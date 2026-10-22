import { randomBytes } from "node:crypto";
import { NextResponse } from "next/server";
import { getCurrentUser, getPublicSiteUrl } from "@/lib/public-auth";

export const runtime = "nodejs";
const STATE_COOKIE = "clai_feishu_oauth_state";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.redirect(new URL("/login?next=%2Flibrary", getPublicSiteUrl()));

  const clientId = process.env.FEISHU_APP_ID;
  const siteUrl = getPublicSiteUrl();
  const redirectUri = process.env.FEISHU_REDIRECT_URI || siteUrl + "/api/feishu/callback";
  if (!clientId || !process.env.FEISHU_APP_SECRET || !process.env.FEISHU_TOKEN_ENCRYPTION_KEY) {
    return NextResponse.redirect(new URL("/library?error=feishu_config", siteUrl));
  }

  const state = user.id + "." + randomBytes(32).toString("base64url");
  const authorize = new URL("https://accounts.feishu.cn/open-apis/authen/v1/authorize");
  authorize.searchParams.set("client_id", clientId);
  authorize.searchParams.set("response_type", "code");
  authorize.searchParams.set("redirect_uri", redirectUri);
  authorize.searchParams.set("scope", "drive:drive:readonly offline_access");
  authorize.searchParams.set("prompt", "consent");
  authorize.searchParams.set("state", state);

  const response = NextResponse.redirect(authorize);
  response.cookies.set(STATE_COOKIE, state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 600,
  });
  return response;
}
