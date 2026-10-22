import { redirect } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { LibraryClient } from "@/components/library-client";
import { getCurrentUser } from "@/lib/public-auth";

export const dynamic = "force-dynamic";
export const metadata = { title: "我的资料 · 知序 Learning Hub" };

export default async function LibraryPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=%2Flibrary");

  return (
    <AppShell>
      <Breadcrumbs items={[{ label: "我的资料" }]}/>
      <div className="page-heading">
        <span className="section-kicker">MY PRIVATE LIBRARY</span>
        <h1>我的资料</h1>
        <p>连接自己的飞书云空间，递归同步选定文件夹，并在线预览文本、图片和 PDF。</p>
      </div>
      <LibraryClient accountEmail={user.email || ""}/>
    </AppShell>
  );
}
