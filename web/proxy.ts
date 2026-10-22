import { NextRequest, NextResponse } from "next/server";

const ACCESS_COOKIE = "clai_access_token";
const REFRESH_COOKIE = "clai_refresh_token";

function supabaseConfig() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/+$/, "");
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  return url && key ? { url, key } : null;
}

function tokenExpiry(token: string): number | null {
  try {
    const payload = token.split(".")[1];
    if (!payload) return null;
    const normalized = payload.replace(/-/g, "+").replace(/_/g, "/");
    const decoded = JSON.parse(Buffer.from(normalized, "base64").toString("utf8")) as { exp?: unknown };
    return typeof decoded.exp === "number" ? decoded.exp : null;
  } catch {
    return null;
  }
}

function setAuthCookies(response: NextResponse, session: Record<string, unknown>) {
  const secure = process.env.NODE_ENV === "production";
  const access = session.access_token;
  const refresh = session.refresh_token;
  if (typeof access !== "string" || typeof refresh !== "string") return;
  response.cookies.set(ACCESS_COOKIE, access, {
    httpOnly: true, secure, sameSite: "lax", path: "/",
    maxAge: Math.max(60, Number(session.expires_in) || 3600),
  });
  response.cookies.set(REFRESH_COOKIE, refresh, {
    httpOnly: true, secure, sameSite: "lax", path: "/",
    maxAge: Math.max(3600, Number(session.refresh_expires_in ?? session.refresh_token_expires_in) || 60 * 60 * 24 * 30),
  });
}

function clearAuthCookies(response: NextResponse) {
  const secure = process.env.NODE_ENV === "production";
  for (const name of [ACCESS_COOKIE, REFRESH_COOKIE]) {
    response.cookies.set(name, "", { httpOnly: true, secure, sameSite: "lax", path: "/", maxAge: 0 });
  }
}

export async function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const isApi = pathname.startsWith("/api/");
  const access = request.cookies.get(ACCESS_COOKIE)?.value;
  const refresh = request.cookies.get(REFRESH_COOKIE)?.value;
  if (access && (tokenExpiry(access) ?? 0) > Math.floor(Date.now() / 1000) + 90) {
    return NextResponse.next();
  }
  if (refresh) {
    const config = supabaseConfig();
    if (config) {
      try {
        const response = await fetch(config.url + "/auth/v1/token?grant_type=refresh_token", {
          method: "POST",
          headers: { apikey: config.key, "Content-Type": "application/json" },
          body: JSON.stringify({ refresh_token: refresh }),
          cache: "no-store",
        });
        const session = (await response.json().catch(() => ({}))) as Record<string, unknown>;
        if (response.ok && typeof session.access_token === "string" && typeof session.refresh_token === "string") {
          const next = NextResponse.next();
          setAuthCookies(next, session);
          return next;
        }
      } catch {
        // Fall through to clear an invalid session or let the API return a JSON 401.
      }
    }
  }

  if (isApi) {
    const next = NextResponse.next();
    if (access || refresh) clearAuthCookies(next);
    return next;
  }
  const target = new URL("/login", request.url);
  target.searchParams.set("next", pathname);
  const redirect = NextResponse.redirect(target);
  if (access || refresh) clearAuthCookies(redirect);
  return redirect;
}

export const config = {
  matcher: ["/library/:path*", "/api/feishu/:path*", "/api/library/:path*"],
};
