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
  if (!email || !password || password.length > 256) {
    return NextResponse.json({ error: "请输入邮箱和密码。" }, { status: 400 });
  }

  try {
    const payload = await supabaseAuthCall("token?grant_type=password", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
    const session = payload as unknown as SupabaseSession;
    if (!session.access_token || !session.refresh_token) {
      return NextResponse.json({ error: "登录响应无效，请重试。" }, { status: 502 });
    }
    const response = NextResponse.json({ ok: true });
    setSessionCookies(response, session);
    return response;
  } catch (error) {
    if (error instanceof AuthServiceError) {
      return NextResponse.json(
        { error: error.status === 429 ? "登录尝试过于频繁，请稍后再试。" : "邮箱或密码不正确，或邮箱尚未验证。" },
        { status: error.status === 429 ? 429 : 401 },
      );
    }
    return NextResponse.json({ error: "账号服务暂时不可用。" }, { status: 503 });
  }
}
