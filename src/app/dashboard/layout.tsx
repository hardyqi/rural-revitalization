"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { href: "/dashboard", label: "工作台", icon: "🏠" },
  { href: "/dashboard/market-analysis", label: "市场分析", icon: "📊" },
  { href: "/dashboard/marketing-image", label: "电商主图", icon: "🖼️" },
  { href: "/dashboard/profit-model", label: "利润测算", icon: "💰" },
  { href: "/dashboard/compliance", label: "合规检查", icon: "✅" },
  { href: "/dashboard/planting", label: "种植决策", icon: "🌱" },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div className="flex min-h-screen">
      {/* 侧边栏 */}
      <aside className="w-56 border-r border-gray-200 bg-white shrink-0">
        <div className="p-4">
          <Link
            href="/dashboard"
            className="block text-sm font-bold text-green-700"
          >
            乡村振兴平台
          </Link>
        </div>
        <nav className="px-2 space-y-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors ${
                  isActive
                    ? "bg-green-50 text-green-700 font-medium"
                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                }`}
              >
                <span>{item.icon}</span>
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* 主内容区 */}
      <main className="flex-1 bg-gray-50">{children}</main>
    </div>
  );
}
