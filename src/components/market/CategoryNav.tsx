"use client";

import { useCallback } from "react";

type Category = {
  category: string;
  varietyCount: number;
  avgPrice: number;
  latestDate: string;
};

type Props = {
  categories: Category[];
  active: string;
  onSelect: (category: string) => void;
  loading?: boolean;
};

const CATEGORY_ICONS: Record<string, string> = {
  "蔬菜": "🥬",
  "水果": "🍎",
  "粮油": "🌾",
  "肉类": "🥩",
  "水产": "🐟",
};

export default function CategoryNav({ categories, active, onSelect, loading }: Props) {
  const getIcon = useCallback(
    (name: string) => CATEGORY_ICONS[name] || "📦",
    []
  );

  if (loading) {
    return (
      <div className="flex gap-3 overflow-x-auto pb-2">
        {[1, 2, 3, 4, 5].map((i) => (
          <div
            key={i}
            className="flex-shrink-0 w-36 h-24 rounded-xl bg-gray-100 animate-pulse"
          />
        ))}
      </div>
    );
  }

  return (
    <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-thin">
      {categories.map((cat) => {
        const isActive = cat.category === active;
        return (
          <button
            key={cat.category}
            onClick={() => onSelect(cat.category)}
            className={`flex-shrink-0 w-40 p-4 rounded-xl text-left transition-all duration-200 cursor-pointer ${
              isActive
                ? "bg-emerald-600 text-white shadow-lg shadow-emerald-200 scale-[1.02]"
                : "bg-white border border-gray-100 hover:border-emerald-200 hover:shadow-md hover:bg-emerald-50"
            }`}
          >
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xl">{getIcon(cat.category)}</span>
              <span className={`text-sm font-semibold ${isActive ? "text-white" : "text-gray-800"}`}>
                {cat.category}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className={`text-xs ${isActive ? "text-emerald-100" : "text-gray-400"}`}>
                {cat.varietyCount} 个品种
              </span>
              <span className={`text-lg font-bold ${isActive ? "text-white" : "text-emerald-600"}`}>
                ¥{cat.avgPrice}
              </span>
            </div>
          </button>
        );
      })}
    </div>
  );
}
