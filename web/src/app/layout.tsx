import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "知序 Learning Hub · 持续学习",
  description: "学习资料、技术长文与可验证学习成果的长期归档中心",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="zh-CN" suppressHydrationWarning><body>{children}</body></html>;
}
