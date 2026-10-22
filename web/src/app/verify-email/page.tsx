"use client";

import Link from "next/link";
import { useEffect, useState, type FormEvent } from "react";
import { ArrowRight, BookOpen, LoaderCircle } from "lucide-react";

export default function VerifyEmailPage() {
  const [email, setEmail] = useState("");
  const [token, setToken] = useState("");
  const [busy, setBusy] = useState(false);
  const [resending, setResending] = useState(false);
  const [verified, setVerified] = useState(false);
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);

  useEffect(() => {
    const pendingEmail = window.sessionStorage.getItem("signupVerificationEmail");
    if (pendingEmail) setEmail(pendingEmail);
  }, []);

  async function verify(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setMessage("");
    setIsError(false);
    try {
      const response = await fetch("/api/auth/verify-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), token }),
      });
      const result = (await response.json().catch(() => ({}))) as {
        error?: string;
        signedIn?: boolean;
      };
      if (!response.ok) throw new Error(result.error || "验证失败，请重试。");
      window.sessionStorage.removeItem("signupVerificationEmail");
      setVerified(true);
      if (result.signedIn) {
        window.location.href = "/library";
      } else {
        setMessage("邮箱验证成功！现在可以用注册时设置的密码登录。");
      }
    } catch (error) {
      setIsError(true);
      setMessage(error instanceof Error ? error.message : "验证码验证失败。");
    } finally {
      setBusy(false);
    }
  }

  async function resend() {
    if (!email.trim()) {
      setIsError(true);
      setMessage("请先填写注册邮箱。");
      return;
    }
    setResending(true);
    setIsError(false);
    setMessage("");
    try {
      const response = await fetch("/api/auth/resend-confirmation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });
      const result = (await response.json().catch(() => ({}))) as { error?: string };
      if (!response.ok) throw new Error(result.error || "重新发送失败，请稍后再试。");
      setToken("");
      setMessage("验证码请求已提交。请查看最新的注册确认邮件，以最新的 6 位验证码为准。");
    } catch (error) {
      setIsError(true);
      setMessage(error instanceof Error ? error.message : "重新发送失败。");
    } finally {
      setResending(false);
    }
  }

  return (
    <main className="auth-page">
      <div className="auth-brand">
        <span className="auth-brand-mark"><BookOpen size={23}/></span>
        <div><strong>知序 Learning Hub</strong><span>你的私人学习资料空间</span></div>
      </div>
      <section className="auth-card">
        <span className="section-kicker">CONFIRM YOUR EMAIL</span>
        <h1>验证邮箱</h1>
        <p>我们已向你的注册邮箱发送 6 位数字验证码。输入验证码即可完成注册。</p>
        {!verified ? (
          <form className="auth-form" onSubmit={verify}>
            <label htmlFor="verify-email-address">注册邮箱</label>
            <input
              id="verify-email-address" type="email" autoComplete="email" required
              value={email} onChange={event => setEmail(event.target.value)}
              placeholder="you@example.com"
            />
            <label htmlFor="verify-email-token">6 位数字验证码</label>
            <input
              id="verify-email-token" type="text" inputMode="numeric"
              autoComplete="one-time-code" pattern="[0-9]{6}" maxLength={6} required
              value={token}
              onChange={event => setToken(event.target.value.replace(/\D/g, "").slice(0, 6))}
              placeholder="000000"
            />
            <span className="auth-hint">验证码由 Supabase 发送；过期或输错可重新获取。</span>
            {message && <p className={isError ? "auth-message auth-message--error" : "auth-message"} role="status">{message}</p>}
            <button className="button button-primary auth-submit" type="submit" disabled={busy || resending || token.length !== 6}>
              {busy ? <LoaderCircle className="spin" size={17}/> : null}
              {busy ? "正在验证…" : "验证邮箱并继续"}
              {!busy && <ArrowRight size={16}/>}
            </button>
            <button className="button button-ghost" type="button" disabled={busy || resending} onClick={() => void resend()}>
              {resending ? "正在重新发送…" : "没有收到验证码？重新发送"}
            </button>
          </form>
        ) : (
          <div>
            <p className="auth-message" role="status">{message || "邮箱验证成功，正在进入资料库…"}</p>
            <Link className="button button-primary" href="/login">前往登录</Link>
          </div>
        )}
        <div className="auth-switch">已经验证？ <Link href="/login">直接登录</Link></div>
        <Link className="auth-home-link" href="/">返回学习总览</Link>
      </section>
      <p className="auth-footnote">验证码只用于验证邮箱，不要向任何人透露。</p>
    </main>
  );
}
