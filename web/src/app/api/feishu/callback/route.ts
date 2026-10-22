import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser, getPublicSiteUrl } from "@/lib/public-auth";
import { getFeishuUserInfo, saveFeishuConnection } from "@/lib/feishu";

export const runtime = "nodejs";
const STATE_COOKIE = "clai_feishu_oauth_state";
const TOKEN_URL = "https://accounts.feishu.cn/oauth/v3/token";

function libraryRedirect(error?: string) {
  const url = new URL("/library", getPublicSiteUrl());
  if (error) url.searchParams.set("error", error);
  else url.searchParams.set("connected", "1");
  const response = NextResponse.redirect(url);
  response.cookies.set(STATE_COOKIE, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
  return response;
}

export async function GET(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return libraryRedirect("login_required");

  const { searchParams } = new URL(request.url);
  if (searchParams.get("error")) return libraryRedirect("feishu_denied");
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const cookieState = request.cookies.get(STATE_COOKIE)?.value || "";
  if (!code || !state || !cookieState || state !== cookieState || !state.startsWith(user.id + ".")) {
    return libraryRedirect("feishu_state");
  }

  const clientId = process.env.FEISHU_APP_ID;
  const clientSecret = process.env.FEISHU_APP_SECRET;
  const redirectUri = process.env.FEISHU_REDIRECT_URI || getPublicSiteUrl() + "/api/feishu/callback";
  if (!clientId || !clientSecret || !process.env.FEISHU_TOKEN_ENCRYPTION_KEY) {
    return libraryRedirect("feishu_config");
  }

  try {
    const response = await fetch(TOKEN_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json; charset=utf-8" },
      body: JSON.stringify({
        grant_type: "authorization_code",
        client_id: clientId,
        client_secret: clientSecret,
        code,
        redirect_uri: redirectUri,
      }),
      cache: "no-store",
    });
    const token = (await response.json().catch(() => ({}))) as {
      code?: number;
      access_token?: string;
      refresh_token?: string;
      expires_in?: number;
      refresh_expires_in?: number;
      refresh_token_expires_in?: number;
      scope?: string;
      open_id?: string;
    };
    if (!response.ok || token.code !== 0 || !token.access_token) {
      return libraryRedirect("feishu_token");
    }
    const profile = await getFeishuUserInfo(token.access_token);
    await saveFeishuConnection(user.id, token, profile);
    return libraryRedirect();
  } catch {
    return libraryRedirect("feishu_connect_failed");
  }
}
