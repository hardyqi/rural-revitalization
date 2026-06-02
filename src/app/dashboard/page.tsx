"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type CategorySummary = {
  category: string;
  varietyCount: number;
  avgPrice: number;
};

export default function DashboardPage() {
  const [categories, setCategories] = useState<CategorySummary[]>([]);

  useEffect(() => {
    fetch("/api/market/categories")
      .then((r) => r.json())
      .then((json) => setCategories(json.data?.slice(0, 5) || []))
      .catch(() => {});
  }, []);

  const modules = [
    {
      href: "/dashboard/market-analysis",
      label: "市场分析",
      desc: "实时行情、价格趋势、区域对比",
      icon: "📊",
      color: "from-emerald-500 to-teal-600",
      stats: categories.length > 0 ? `${categories.length} 个品类监测中` : "行情数据加载中",
    },
    {
      href: "/dashboard/marketing-image",
      label: "电商主图",
      desc: "AI 生成白底图/场景图/详情图",
      icon: "🖼️",
      color: "from-violet-500 to-purple-600",
      stats: "即将上线",
    },
    {
      href: "/dashboard/profit-model",
      label: "利润测算",
      desc: "原料→成品 全链路利润模型",
      icon: "💰",
      color: "from-amber-500 to-orange-600",
      stats: "即将上线",
    },
    {
      href: "/dashboard/compliance",
      label: "合规检查",
      desc: "GB 7718 标签智能审查",
      icon: "✅",
      color: "from-blue-500 to-cyan-600",
      stats: "即将上线",
    },
    {
      href: "/dashboard/planting",
      label: "种植决策",
      desc: "土壤+气候+市场 智能推荐品种",
      icon: "🌱",
      color: "from-rose-500 to-pink-600",
      stats: "即将上线",
    },
  ];

  return (
    <div className="space-y-6">
      {/* 欢迎横幅 */}
      <div className="bg-gradient-to-br from-emerald-600 to-teal-700 rounded-2xl p-8 text-white">
        <h1 className="text-2xl font-bold mb-2">农产品行情看板</h1>
        <p className="text-emerald-100 text-sm max-w-lg">
          实时追踪全国主要批发市场价格，覆盖蔬菜、水果、粮油、肉类、水产五大品类。数据来源：农业农村部批发市场监测体系。
        </p>
        <div className="flex gap-4 mt-5">
          {categories.length > 0 && (
            <div className="flex gap-3">
              {categories.map((cat) => (
                <div
                  key={cat.category}
                  className="bg-white/15 backdrop-blur rounded-lg px-4 py-2 text-center"
                >
                  <div className="text-xs text-emerald-200">{cat.category}</div>
                  <div className="text-lg font-bold">¥{cat.avgPrice}</div>
                  <div className="text-xs text-emerald-200">{cat.varietyCount} 品种</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 模块卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {modules.map((mod) => (
          <Link
            key={mod.href}
            href={mod.href}
            className="group block bg-white rounded-xl border border-gray-100 p-5 hover:shadow-lg hover:border-gray-200 transition-all duration-200"
          >
            <div
              className={`inline-flex items-center justify-center w-10 h-10 rounded-lg bg-gradient-to-br ${mod.color} text-white text-lg mb-3`}
            >
              {mod.icon}
            </div>
            <h3 className="text-base font-semibold text-gray-800 group-hover:text-emerald-700 transition-colors">
              {mod.label}
            </h3>
            <p className="text-sm text-gray-500 mt-1">{mod.desc}</p>
            <div className="mt-3 pt-3 border-t border-gray-50">
              <span className="text-xs text-gray-400">{mod.stats}</span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
