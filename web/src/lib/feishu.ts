import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";
import { dbRequest, dbSelectOne, dbUpsert } from "@/lib/supabase-rest";

const TOKEN_URL = "https://accounts.feishu.cn/oauth/v3/token";
const DRIVE_API = "https://open.feishu.cn/open-apis/drive/v1";

type FeishuTokenResponse = {
  code?: number;
  access_token?: string;
  refresh_token?: string;
  expires_in?: number;
  refresh_expires_in?: number;
  refresh_token_expires_in?: number;
  scope?: string;
  open_id?: string;
  error?: string;
  error_description?: string;
};

export type FeishuDriveItem = {
  token: string;
  name: string;
  type: string;
  mime_type?: string;
  size?: number;
  modified_time?: string | number;
  url?: string;
  parent_token?: string;
};

type ConnectionRow = {
  user_id: string;
  feishu_open_id: string | null;
  feishu_name: string | null;
  access_token_ciphertext: string;
  refresh_token_ciphertext: string | null;
  access_token_expires_at: string;
  refresh_token_expires_at: string | null;
  granted_scopes: string | null;
  connected_at: string;
  last_synced_at: string | null;
};

function encryptionKey(): Buffer {
  const value = process.env.FEISHU_TOKEN_ENCRYPTION_KEY || "";
  if (!/^[a-f0-9]{64}$/i.test(value)) {
    throw new Error("FEISHU_ENCRYPTION_KEY_NOT_CONFIGURED");
  }
  return Buffer.from(value, "hex");
}

function encryptSecret(value: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", encryptionKey(), iv);
  const ciphertext = Buffer.concat([cipher.update(value, "utf8"), cipher.final()]);
  return [
    "v1",
    iv.toString("base64url"),
    cipher.getAuthTag().toString("base64url"),
    ciphertext.toString("base64url"),
  ].join(".");
}

function decryptSecret(value: string): string {
  const [version, ivText, tagText, ciphertextText] = value.split(".");
  if (version !== "v1" || !ivText || !tagText || ciphertextText === undefined) {
    throw new Error("FEISHU_CREDENTIAL_INVALID");
  }
  try {
    const decipher = createDecipheriv(
      "aes-256-gcm",
      encryptionKey(),
      Buffer.from(ivText, "base64url"),
    );
    decipher.setAuthTag(Buffer.from(tagText, "base64url"));
    return Buffer.concat([
      decipher.update(Buffer.from(ciphertextText, "base64url")),
      decipher.final(),
    ]).toString("utf8");
  } catch {
    throw new Error("FEISHU_CREDENTIAL_DECRYPT_FAILED");
  }
}

function requireAppCredentials(): { clientId: string; clientSecret: string } {
  const clientId = process.env.FEISHU_APP_ID;
  const clientSecret = process.env.FEISHU_APP_SECRET;
  if (!clientId || !clientSecret) throw new Error("FEISHU_APP_NOT_CONFIGURED");
  return { clientId, clientSecret };
}

async function loadConnection(userId: string): Promise<ConnectionRow | null> {
  const query = new URLSearchParams({
    select: "*",
    user_id: "eq." + userId,
    limit: "1",
  });
  return dbSelectOne<ConnectionRow>("feishu_connections", query);
}

export async function getFeishuConnectionSummary(userId: string) {
  const row = await loadConnection(userId);
  if (!row) return { connected: false as const };
  return {
    connected: true as const,
    name: row.feishu_name || "已连接的飞书账号",
    open_id: row.feishu_open_id,
    connected_at: row.connected_at,
    last_synced_at: row.last_synced_at,
    refresh_available: Boolean(row.refresh_token_ciphertext),
  };
}

export async function saveFeishuConnection(
  userId: string,
  token: FeishuTokenResponse,
  profile: { open_id?: string; name?: string },
): Promise<void> {
  const accessToken = token.access_token;
  if (!accessToken) throw new Error("FEISHU_TOKEN_RESPONSE_INVALID");
  const existing = await loadConnection(userId);
  const refreshToken = token.refresh_token || null;
  const now = Date.now();
  const expiresIn = Math.max(60, Number(token.expires_in) || 3600);
  const refreshExpiresIn = Number(token.refresh_expires_in ?? token.refresh_token_expires_in);

  await dbUpsert(
    "feishu_connections",
    {
      user_id: userId,
      feishu_open_id: profile.open_id || token.open_id || existing?.feishu_open_id || null,
      feishu_name: profile.name || existing?.feishu_name || null,
      access_token_ciphertext: encryptSecret(accessToken),
      refresh_token_ciphertext: refreshToken
        ? encryptSecret(refreshToken)
        : existing?.refresh_token_ciphertext || null,
      access_token_expires_at: new Date(now + expiresIn * 1000).toISOString(),
      refresh_token_expires_at: Number.isFinite(refreshExpiresIn) && refreshExpiresIn > 0
        ? new Date(now + refreshExpiresIn * 1000).toISOString()
        : existing?.refresh_token_expires_at || null,
      granted_scopes: token.scope || existing?.granted_scopes || "",
      connected_at: existing?.connected_at || new Date(now).toISOString(),
      updated_at: new Date(now).toISOString(),
    },
    "user_id",
  );
}

async function refreshConnection(row: ConnectionRow): Promise<string> {
  const refreshCiphertext = row.refresh_token_ciphertext;
  if (!refreshCiphertext) throw new Error("FEISHU_REAUTH_REQUIRED");
  if (
    row.refresh_token_expires_at &&
    Date.parse(row.refresh_token_expires_at) <= Date.now() + 60_000
  ) {
    throw new Error("FEISHU_REAUTH_REQUIRED");
  }

  const { clientId, clientSecret } = requireAppCredentials();
  let response: Response;
  try {
    response = await fetch(TOKEN_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json; charset=utf-8" },
      body: JSON.stringify({
        grant_type: "refresh_token",
        client_id: clientId,
        client_secret: clientSecret,
        refresh_token: decryptSecret(refreshCiphertext),
      }),
      cache: "no-store",
    });
  } catch {
    throw new Error("FEISHU_TOKEN_REFRESH_FAILED");
  }

  const token = (await response.json().catch(() => ({}))) as FeishuTokenResponse;
  if (!response.ok || token.code !== 0 || !token.access_token) {
    if (token.code === 20006 || token.code === 20007 || token.code === 99991669) {
      throw new Error("FEISHU_REAUTH_REQUIRED");
    }
    throw new Error("FEISHU_TOKEN_REFRESH_FAILED");
  }

  const newRefreshToken = token.refresh_token || decryptSecret(refreshCiphertext);
  const now = Date.now();
  const expiresIn = Math.max(60, Number(token.expires_in) || 3600);
  const refreshExpiresIn = Number(token.refresh_expires_in ?? token.refresh_token_expires_in);
  await dbUpsert(
    "feishu_connections",
    {
      user_id: row.user_id,
      feishu_open_id: row.feishu_open_id,
      feishu_name: row.feishu_name,
      access_token_ciphertext: encryptSecret(token.access_token),
      refresh_token_ciphertext: encryptSecret(newRefreshToken),
      access_token_expires_at: new Date(now + expiresIn * 1000).toISOString(),
      refresh_token_expires_at: Number.isFinite(refreshExpiresIn) && refreshExpiresIn > 0
        ? new Date(now + refreshExpiresIn * 1000).toISOString()
        : row.refresh_token_expires_at,
      granted_scopes: token.scope || row.granted_scopes || "",
      connected_at: row.connected_at,
      updated_at: new Date(now).toISOString(),
    },
    "user_id",
  );
  return token.access_token;
}

export async function getValidFeishuAccessToken(
  userId: string,
  forceRefresh = false,
): Promise<string> {
  const row = await loadConnection(userId);
  if (!row) throw new Error("FEISHU_NOT_CONNECTED");
  if (!forceRefresh && Date.parse(row.access_token_expires_at) > Date.now() + 120_000) {
    return decryptSecret(row.access_token_ciphertext);
  }
  return refreshConnection(row);
}

function tokenExpiredCode(code: unknown): boolean {
  return code === 99991663 || code === 99991677 || code === 20006;
}

function permissionError(code: unknown): boolean {
  return code === 91403 || code === 95008 || code === 95009 || code === 95013 || code === 99991679;
}

async function fetchJsonWithToken(
  userId: string,
  url: string,
  retried = false,
): Promise<Record<string, unknown>> {
  const token = await getValidFeishuAccessToken(userId);
  let response: Response;
  try {
    response = await fetch(url, {
      headers: { Authorization: "Bearer " + token },
      cache: "no-store",
    });
  } catch {
    throw new Error("FEISHU_NETWORK_ERROR");
  }
  const payload = (await response.json().catch(() => ({}))) as Record<string, unknown>;
  if (tokenExpiredCode(payload.code) && !retried) {
    await getValidFeishuAccessToken(userId, true);
    return fetchJsonWithToken(userId, url, true);
  }
  if (!response.ok || payload.code !== 0) {
    throw new Error(permissionError(payload.code) ? "FEISHU_PERMISSION_DENIED" : "FEISHU_API_FAILED");
  }
  return payload;
}

export async function listFeishuFiles(
  userId: string,
  folderToken?: string | null,
  pageToken?: string | null,
): Promise<{ files: FeishuDriveItem[]; has_more: boolean; next_page_token: string | null }> {
  const url = new URL(DRIVE_API + "/files");
  url.searchParams.set("page_size", "100");
  if (folderToken) url.searchParams.set("folder_token", folderToken);
  if (pageToken) url.searchParams.set("page_token", pageToken);

  const payload = await fetchJsonWithToken(userId, url.toString());
  const data = (payload.data || {}) as Record<string, unknown>;
  const files = Array.isArray(data.files) ? (data.files as FeishuDriveItem[]) : [];
  return {
    files,
    has_more: data.has_more === true,
    next_page_token:
      typeof data.next_page_token === "string"
        ? data.next_page_token
        : typeof data.page_token === "string"
          ? data.page_token
          : null,
  };
}

export async function downloadFeishuFile(userId: string, fileToken: string): Promise<Response> {
  const requestOnce = async (retried: boolean): Promise<Response> => {
    const accessToken = await getValidFeishuAccessToken(userId);
    const url = DRIVE_API + "/files/" + encodeURIComponent(fileToken) + "/download";
    let response: Response;
    try {
      response = await fetch(url, {
        headers: { Authorization: "Bearer " + accessToken },
        cache: "no-store",
        redirect: "follow",
      });
    } catch {
      throw new Error("FEISHU_DOWNLOAD_FAILED");
    }

    const contentType = response.headers.get("content-type") || "";
    if (contentType.includes("application/json")) {
      const payload = (await response.clone().json().catch(() => ({}))) as Record<string, unknown>;
      if (tokenExpiredCode(payload.code) && !retried) {
        await getValidFeishuAccessToken(userId, true);
        return requestOnce(true);
      }
      if (typeof payload.code === "number" && payload.code !== 0) {
        throw new Error(permissionError(payload.code) ? "FEISHU_PERMISSION_DENIED" : "FEISHU_DOWNLOAD_FAILED");
      }
    }
    if (!response.ok || !response.body) throw new Error("FEISHU_DOWNLOAD_FAILED");
    return response;
  };
  return requestOnce(false);
}

export async function getFeishuUserInfo(
  accessToken: string,
): Promise<{ open_id?: string; name?: string }> {
  let response: Response;
  try {
    response = await fetch("https://open.feishu.cn/open-apis/authen/v1/user_info", {
      headers: { Authorization: "Bearer " + accessToken },
      cache: "no-store",
    });
  } catch {
    throw new Error("FEISHU_USER_INFO_FAILED");
  }
  const payload = (await response.json().catch(() => ({}))) as Record<string, unknown>;
  const data = (payload.data || {}) as Record<string, unknown>;
  if (!response.ok || payload.code !== 0) throw new Error("FEISHU_USER_INFO_FAILED");
  return {
    open_id: typeof data.open_id === "string" ? data.open_id : undefined,
    name: typeof data.name === "string" ? data.name : undefined,
  };
}

export async function markFeishuSynced(userId: string): Promise<void> {
  const query = new URLSearchParams({ user_id: "eq." + userId });
  await dbRequest("feishu_connections?" + query.toString(), {
    method: "PATCH",
    headers: { Prefer: "return=minimal" },
    body: JSON.stringify({ last_synced_at: new Date().toISOString(), updated_at: new Date().toISOString() }),
  });
}
