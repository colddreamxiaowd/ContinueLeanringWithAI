import { NextResponse } from "next/server";
import { AuthServiceError, supabaseAuthCall } from "@/lib/public-auth";

export const runtime = "nodejs";

// A public self-service way to replace an expired single-use signup link.
// The provider rate-limits resend attempts. Never disclose whether an email
// address already exists or has been confirmed.
export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as {
    email?: unknown;
  } | null;
  const email =
    typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
  if (email.length > 320 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: "请填写有效的注册邮箱。" }, { status: 400 });
  }

  try {
    await supabaseAuthCall("resend", {
      method: "POST",
      body: JSON.stringify({ type: "signup", email }),
    });
    return NextResponse.json({ ok: true }, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error) {
    if (error instanceof AuthServiceError) {
      if (error.status === 429) {
        return NextResponse.json(
          { error: "发送请求过于频繁，请稍后再试。" },
          { status: 429 },
        );
      }
      if (error.status >= 500) {
        // An SMTP/provider fault is not an account-enumeration detail. Never
        // silently claim that a failed email-send request succeeded.
        return NextResponse.json(
          { error: "验证码发送服务出现故障，请检查 Supabase → Logs → Auth Logs 和 SMTP 设置。" },
          { status: 503, headers: { "Cache-Control": "no-store" } },
        );
      }
      // Other 4xx errors may reveal whether an email exists or is confirmed.
      return NextResponse.json({ ok: true }, {
        headers: { "Cache-Control": "no-store" },
      });
    }
    return NextResponse.json(
      { error: "邮件服务暂时不可用，请稍后重试。" },
      { status: 503 },
    );
  }
}
