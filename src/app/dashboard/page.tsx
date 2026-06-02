import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";

/**
 * 工作台 — MVP 核心功能区
 * 市场分析(M1) → 主图生成(M4) → 利润模型(M7) → 合规检查(M6) → 种植决策(M5)
 */
export default async function DashboardPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // 获取用户档案和账户信息
  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name, account_id")
    .eq("user_id", user.id)
    .single();

  const { data: account } = await supabase
    .from("accounts")
    .select("credits_balance, plan")
    .eq("id", profile?.account_id)
    .single();

  const modules = [
    {
      id: "market-analysis",
      title: "市场分析",
      description: "AI 深度分析产品市场前景，8 维度入市决策报告",
      icon: "📊",
      href: "/dashboard/market-analysis",
      status: "available" as const,
    },
    {
      id: "marketing-image",
      title: "电商主图",
      description: "AI 生成 6 张专业营销主图，支持多平台尺寸",
      icon: "🖼️",
      href: "/dashboard/marketing-image",
      status: "available" as const,
    },
    {
      id: "profit-model",
      title: "利润测算",
      description: "原料成本、出成率、渠道扣点一键测算",
      icon: "💰",
      href: "/dashboard/profit-model",
      status: "available" as const,
    },
    {
      id: "compliance",
      title: "合规检查",
      description: "GB 7718 预包装食品标签自动诊断（ABC 评级）",
      icon: "✅",
      href: "/dashboard/compliance",
      status: "available" as const,
    },
    {
      id: "planting",
      title: "种植决策",
      description: "7 维度分析，推荐 TOP 5 品类（产前决策）",
      icon: "🌱",
      href: "/dashboard/planting",
      status: "available" as const,
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 顶部导航 */}
      <header className="bg-white border-b border-gray-200">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-4">
              <h1 className="text-lg font-bold text-gray-900">
                乡村振兴创新服务平台
              </h1>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-600">
                积分余额:{" "}
                <span className="font-medium text-green-700">
                  {account?.credits_balance ?? 0}
                </span>
              </span>
              <span className="text-xs rounded-full bg-gray-100 px-3 py-1 text-gray-600">
                {profile?.display_name || user.email}
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* 主体内容 */}
      <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900">工作台</h2>
          <p className="mt-1 text-sm text-gray-500">
            选择一个模块开始使用 AI 赋能你的农产品业务
          </p>
        </div>

        {/* 功能模块网格 */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {modules.map((mod) => (
            <Link
              key={mod.id}
              href={mod.href}
              className="group rounded-xl border border-gray-200 bg-white p-6 transition-all hover:border-green-300 hover:shadow-md"
            >
              <div className="mb-4 text-3xl">{mod.icon}</div>
              <h3 className="mb-2 text-base font-semibold text-gray-900 group-hover:text-green-700">
                {mod.title}
              </h3>
              <p className="text-sm text-gray-500">{mod.description}</p>
            </Link>
          ))}
        </div>

        {/* 行情看板 */}
        <div className="mt-10 rounded-xl border border-gray-200 bg-white p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-semibold text-gray-900">行情看板</h3>
            <span className="text-xs text-gray-400">数据每日更新 · 来源：农业农村部</span>
          </div>
          <p className="text-sm text-gray-500">
            行情数据加载中...（Phase 1A 行情看板正在构建中）
          </p>
        </div>
      </main>
    </div>
  );
}
