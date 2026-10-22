import { NextResponse } from "next/server";
import {
  AuthServiceError,
  setSessionCookies,
  supabaseAuthCall,
  type SupabaseSession,
} from "@/lib/public-auth";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as { email?: unknown; password?: unknown } | null;
  const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
  const password = typeof body?.password === "string" ? body.password : "";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || password.length < 10 || password.length > 256) {
    return NextResponse.json(
      { error: "请输入有效邮箱，密码至少 10 位且不超过 256 位。" },
      { status: 400 },
    );
  }

  try {
    const payload = await supabaseAuthCall("signup", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
    const session = (payload.session || payload) as unknown as SupabaseSession;
    if (session.access_token && session.refresh_token) {
      const response = NextResponse.json({ ok: true, signedIn: true }, { status: 201 });
      setSessionCookies(response, session);
      return response;
    }
    return NextResponse.json(
      { ok: true, signedIn: false, confirmationRequired: true },
      { status: 202 },
    );
  } catch (error) {
    if (error instanceof AuthServiceError) {
      const status = error.status === 429 ? 429 : 400;
      return NextResponse.json(
        { error: status === 429 ? "注册请求过于频繁，请稍后再试。" : "注册未完成，请检查邮箱是否已注册及 Supabase 邮箱设置。" },
        { status },
      );
    }
    return NextResponse.json({ error: "账号服务尚未配置完成。" }, { status: 503 });
  }
}
