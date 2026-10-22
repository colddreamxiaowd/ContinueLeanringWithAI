import { NextResponse } from "next/server";
import {
  AuthServiceError,
  setSessionCookies,
  supabaseAuthCall,
  type SupabaseSession,
} from "@/lib/public-auth";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as {
    email?: unknown;
    token?: unknown;
  } | null;
  const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
  const token = typeof body?.token === "string" ? body.token.trim() : "";
  if (email.length > 320 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || !/^\d{6}$/.test(token)) {
    return NextResponse.json({ error: "请输入注册邮箱和邮件中的 6 位数字验证码。" }, { status: 400 });
  }

  try {
    // Email signup OTPs now use the "email" verification type (legacy "signup" is deprecated).
    const payload = await supabaseAuthCall("verify", {
      method: "POST",
      body: JSON.stringify({ email, token, type: "email" }),
    });
    const session = (payload.session || payload) as unknown as SupabaseSession;
    const response = NextResponse.json({
      ok: true,
      signedIn: Boolean(session.access_token && session.refresh_token),
    }, { headers: { "Cache-Control": "no-store" } });
    if (session.access_token && session.refresh_token) {
      setSessionCookies(response, session);
    }
    return response;
  } catch (error) {
    if (error instanceof AuthServiceError) {
      const status = error.status === 429 ? 429 : 400;
      return NextResponse.json({
        error: status === 429
          ? "验证尝试过于频繁，请稍后再试。"
          : "验证码错误或已过期，请使用最新邮件中的验证码，或重新发送。",
      }, { status });
    }
    return NextResponse.json({ error: "邮箱验证服务暂时不可用，请稍后重试。" }, { status: 503 });
  }
}
