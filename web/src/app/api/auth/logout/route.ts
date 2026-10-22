import { NextResponse } from "next/server";
import { clearSessionCookies, getAccessToken, supabaseAuthCall } from "@/lib/public-auth";

export const runtime = "nodejs";

export async function POST() {
  const token = await getAccessToken();
  if (token) {
    try {
      await supabaseAuthCall("logout?scope=global", { method: "POST" }, token);
    } catch {
      // Always clear this browser's session, even if the provider session expired.
    }
  }
  const response = NextResponse.json({ ok: true });
  clearSessionCookies(response);
  return response;
}
