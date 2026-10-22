import { cookies } from "next/headers";
import type { NextResponse } from "next/server";

export const ACCESS_COOKIE = "clai_access_token";
export const REFRESH_COOKIE = "clai_refresh_token";

export type PublicUser = {
  id: string;
  email?: string;
  user_metadata?: Record<string, unknown>;
};

export type SupabaseSession = {
  access_token: string;
  refresh_token: string;
  expires_in?: number;
  refresh_expires_in?: number;
  refresh_token_expires_in?: number;
  user?: PublicUser;
  session?: SupabaseSession;
};

export class AuthServiceError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

function authConfig(): { url: string; publicKey: string } {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const publicKey =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !publicKey) throw new Error("SUPABASE_NOT_CONFIGURED");
  return { url: url.replace(/\/+$/, ""), publicKey };
}

export async function supabaseAuthCall(
  path: string,
  init: RequestInit = {},
  accessToken?: string,
): Promise<Record<string, unknown>> {
  const { url, publicKey } = authConfig();
  const headers = new Headers(init.headers);
  headers.set("apikey", publicKey);
  headers.set("Accept", "application/json");
  if (accessToken) headers.set("Authorization", "Bearer " + accessToken);
  if (init.body !== undefined && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  let response: Response;
  try {
    response = await fetch(url + "/auth/v1/" + path, {
      ...init,
      headers,
      cache: "no-store",
    });
  } catch {
    throw new Error("AUTH_SERVICE_UNAVAILABLE");
  }

  const text = await response.text();
  let payload: Record<string, unknown> = {};
  try {
    payload = text ? (JSON.parse(text) as Record<string, unknown>) : {};
  } catch {
    throw new Error("AUTH_RESPONSE_INVALID");
  }
  if (!response.ok) {
    const message =
      (typeof payload.msg === "string" && payload.msg) ||
      (typeof payload.message === "string" && payload.message) ||
      (typeof payload.error_description === "string" && payload.error_description) ||
      "AUTH_REQUEST_FAILED";
    throw new AuthServiceError(response.status, message);
  }
  return payload;
}

export async function getAccessToken(): Promise<string | null> {
  const jar = await cookies();
  return jar.get(ACCESS_COOKIE)?.value ?? null;
}

export async function getRefreshToken(): Promise<string | null> {
  const jar = await cookies();
  return jar.get(REFRESH_COOKIE)?.value ?? null;
}

export async function getCurrentUser(): Promise<PublicUser | null> {
  const accessToken = await getAccessToken();
  if (!accessToken) return null;
  try {
    const user = await supabaseAuthCall("user", { method: "GET" }, accessToken);
    return typeof user.id === "string" ? (user as PublicUser) : null;
  } catch {
    return null;
  }
}

export function setSessionCookies(
  response: NextResponse,
  session: SupabaseSession,
): void {
  const secure = process.env.NODE_ENV === "production";
  const accessMaxAge = Math.max(60, Number(session.expires_in) || 3600);
  const refreshMaxAge = Math.max(
    3600,
    Number(session.refresh_expires_in ?? session.refresh_token_expires_in) ||
      60 * 60 * 24 * 30,
  );
  response.cookies.set(ACCESS_COOKIE, session.access_token, {
    httpOnly: true,
    secure,
    sameSite: "lax",
    path: "/",
    maxAge: accessMaxAge,
  });
  response.cookies.set(REFRESH_COOKIE, session.refresh_token, {
    httpOnly: true,
    secure,
    sameSite: "lax",
    path: "/",
    maxAge: refreshMaxAge,
  });
}

export function clearSessionCookies(response: NextResponse): void {
  const secure = process.env.NODE_ENV === "production";
  for (const name of [ACCESS_COOKIE, REFRESH_COOKIE]) {
    response.cookies.set(name, "", {
      httpOnly: true,
      secure,
      sameSite: "lax",
      path: "/",
      maxAge: 0,
    });
  }
}

export function getPublicSiteUrl(): string {
  return (
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/+$/, "") ||
    "http://localhost:3000"
  );
}
