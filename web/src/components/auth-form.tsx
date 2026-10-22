"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { ArrowRight, BookOpen, LoaderCircle } from "lucide-react";

export function AuthForm({ mode }: { mode: "login" | "signup" }) {
  const isSignup = mode === "signup";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setMessage("");
    setIsError(false);
    try {
      const response = await fetch("/api/auth/" + mode, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const result = (await response.json().catch(() => ({}))) as {
        error?: string;
        signedIn?: boolean;
        confirmationRequired?: boolean;
      };
      if (!response.ok) throw new Error(result.error || "请求失败，请重试。");
      if (result.confirmationRequired) {
        setMessage("注册信息已提交。请打开邮箱完成验证，再使用邮箱和密码登录。");
        setPassword("");
        return;
      }
      window.location.href = "/library";
    } catch (error) {
      setIsError(true);
      setMessage(error instanceof Error ? error.message : "请求失败，请重试。");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="auth-page">
      <div className="auth-brand"><span className="auth-brand-mark"><BookOpen size={23}/></span><div><strong>知序 Learning Hub</strong><span>你的私人学习资料空间</span></div></div>
      <section className="auth-card">
        <span className="section-kicker">{isSignup ? "CREATE YOUR SPACE" : "WELCOME BACK"}</span>
        <h1>{isSignup ? "创建学习空间" : "登录你的资料库"}</h1>
        <p>{isSignup ? "创建账号后，连接自己的飞书云空间。" : "登录后即可继续浏览和同步你已授权的飞书资料。"}</p>
        <form onSubmit={submit} className="auth-form">
          <label htmlFor="account-email">邮箱账号</label>
          <input id="account-email" type="email" autoComplete="email" required value={email} onChange={event => setEmail(event.target.value)} placeholder="you@example.com"/>
          <label htmlFor="account-password">密码</label>
          <input id="account-password" type="password" autoComplete={isSignup ? "new-password" : "current-password"} minLength={isSignup ? 10 : 1} maxLength={256} required value={password} onChange={event => setPassword(event.target.value)} placeholder={isSignup ? "至少 10 位" : "输入密码"}/>
          {isSignup && <span className="auth-hint">请使用至少 10 位密码。账号由网站独立管理，与飞书登录凭证分开。</span>}
          {message && <p className={isError ? "auth-message auth-message--error" : "auth-message"} role="status">{message}</p>}
          <button className="button button-primary auth-submit" type="submit" disabled={busy}>
            {busy ? <LoaderCircle className="spin" size={17}/> : null}
            {busy ? "正在处理…" : isSignup ? "创建账号" : "登录"}
            {!busy && <ArrowRight size={16}/>}
          </button>
        </form>
        <div className="auth-switch">{isSignup ? "已经有账号？" : "还没有账号？"} <Link href={isSignup ? "/login" : "/signup"}>{isSignup ? "直接登录" : "创建账号"}</Link></div>
        <Link className="auth-home-link" href="/">返回学习总览</Link>
      </section>
      <p className="auth-footnote">你的飞书访问授权仅用于读取你自己允许访问的资料，不会向其他用户公开。</p>
    </main>
  );
}
