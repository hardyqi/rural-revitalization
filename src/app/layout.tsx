import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "乡村振兴创新服务平台",
  description: "AI 赋能农产品全链路决策——从种什么到怎么卖",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN" className="h-full antialiased">
      <body className="min-h-full flex flex-col font-sans">{children}</body>
    </html>
  );
}
