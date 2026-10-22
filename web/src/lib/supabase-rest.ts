type JsonRecord = Record<string, unknown>;

function baseUrl(): string {
  const value = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!value) throw new Error("SUPABASE_NOT_CONFIGURED");
  return value.replace(/\/+$/, "");
}

function serviceKey(): string {
  // New Supabase projects use sb_secret_... API keys instead of legacy JWT keys.
  const value =
    process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!value) throw new Error("SUPABASE_NOT_CONFIGURED");
  return value;
}

export async function dbRequest<T = unknown>(
  path: string,
  init: RequestInit = {},
): Promise<T> {
  const headers = new Headers(init.headers);
  const key = serviceKey();
  headers.set("apikey", key);
  // New sb_secret_* keys are opaque API keys, not JWTs. They belong only in
  // the apikey header; legacy service_role JWTs still use Bearer authorization.
  if (key.startsWith("sb_secret_")) {
    headers.delete("Authorization");
  } else {
    headers.set("Authorization", "Bearer " + key);
  }
  headers.set("Accept", "application/json");
  if (init.body !== undefined && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  let response: Response;
  try {
    response = await fetch(baseUrl() + "/rest/v1/" + path, {
      ...init,
      headers,
      cache: "no-store",
    });
  } catch {
    throw new Error("DATABASE_UNAVAILABLE");
  }

  if (!response.ok) {
    // Do not return provider details, SQL, tokens, or row content to callers.
    throw new Error("DATABASE_REQUEST_FAILED");
  }
  if (response.status === 204) return null as T;

  const text = await response.text();
  if (!text) return null as T;
  try {
    return JSON.parse(text) as T;
  } catch {
    throw new Error("DATABASE_RESPONSE_INVALID");
  }
}

export async function dbSelectOne<T extends JsonRecord>(
  table: string,
  query: URLSearchParams,
): Promise<T | null> {
  const rows = await dbRequest<T[]>(table + "?" + query.toString());
  return Array.isArray(rows) ? (rows[0] ?? null) : null;
}

export async function dbSelectAll<T extends JsonRecord>(
  table: string,
  query: URLSearchParams,
  pageSize = 500,
): Promise<T[]> {
  const rows: T[] = [];
  for (let offset = 0; offset < 10000; offset += pageSize) {
    const headers = new Headers({
      Range: offset + "-" + (offset + pageSize - 1),
      "Range-Unit": "items",
    });
    const page = await dbRequest<T[]>(table + "?" + query.toString(), { headers });
    if (!Array.isArray(page)) throw new Error("DATABASE_RESPONSE_INVALID");
    rows.push(...page);
    if (page.length < pageSize) return rows;
  }
  throw new Error("DATABASE_RESULT_LIMIT");
}

export async function dbUpsert<T = unknown>(
  table: string,
  rows: JsonRecord | JsonRecord[],
  conflictColumns: string,
): Promise<T> {
  return dbRequest<T>(
    table + "?on_conflict=" + encodeURIComponent(conflictColumns),
    {
      method: "POST",
      headers: { Prefer: "resolution=merge-duplicates,return=representation" },
      body: JSON.stringify(rows),
    },
  );
}

export async function dbPatch<T = unknown>(
  table: string,
  query: URLSearchParams,
  patch: JsonRecord,
): Promise<T> {
  return dbRequest<T>(table + "?" + query.toString(), {
    method: "PATCH",
    headers: { Prefer: "return=representation" },
    body: JSON.stringify(patch),
  });
}

export async function dbDelete(
  table: string,
  query: URLSearchParams,
): Promise<void> {
  await dbRequest(table + "?" + query.toString(), { method: "DELETE" });
}
