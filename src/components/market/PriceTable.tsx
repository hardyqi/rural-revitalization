"use client";

import { useState, useMemo } from "react";

type PriceRecord = {
  id: string;
  category: string;
  variety: string;
  market_type: "wholesale" | "farmgate";
  price: number;
  unit: string;
  source: string;
  province: string | null;
  city: string | null;
  recorded_at: string;
};

type Props = {
  data: PriceRecord[];
  loading?: boolean;
};

type SortKey = "variety" | "price" | "market_type" | "province" | "recorded_at";
type SortDir = "asc" | "desc";

export default function PriceTable({ data, loading }: Props) {
  const [sortKey, setSortKey] = useState<SortKey>("recorded_at");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<"all" | "wholesale" | "farmgate">("all");

  const handleSort = (key: SortKey) => {
    if (key === sortKey) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  };

  const sorted = useMemo(() => {
    let filtered = data;
    if (search) {
      const q = search.toLowerCase();
      filtered = filtered.filter(
        (r) =>
          r.variety.toLowerCase().includes(q) ||
          (r.province && r.province.toLowerCase().includes(q)) ||
          (r.city && r.city.toLowerCase().includes(q))
      );
    }
    if (typeFilter !== "all") {
      filtered = filtered.filter((r) => r.market_type === typeFilter);
    }

    return [...filtered].sort((a, b) => {
      let cmp = 0;
      switch (sortKey) {
        case "variety":
          cmp = a.variety.localeCompare(b.variety);
          break;
        case "price":
          cmp = a.price - b.price;
          break;
        case "market_type":
          cmp = a.market_type.localeCompare(b.market_type);
          break;
        case "province":
          cmp = (a.province || "").localeCompare(b.province || "");
          break;
        case "recorded_at":
          cmp = a.recorded_at.localeCompare(b.recorded_at);
          break;
      }
      return sortDir === "asc" ? cmp : -cmp;
    });
  }, [data, sortKey, sortDir, search, typeFilter]);

  const sortIcon = (key: SortKey) => {
    if (key !== sortKey) return "↕";
    return sortDir === "asc" ? "↑" : "↓";
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-gray-100 p-6">
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-10 bg-gray-50 rounded-lg animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
      {/* 工具栏 */}
      <div className="px-6 py-4 border-b border-gray-100 flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          <input
            type="text"
            placeholder="搜索品种、产地..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
          />
        </div>
        <div className="flex gap-1 bg-gray-50 rounded-lg p-0.5">
          {(["all", "wholesale", "farmgate"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTypeFilter(t)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer ${
                typeFilter === t
                  ? "bg-white text-gray-800 shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              {t === "all" ? "全部" : t === "wholesale" ? "批发" : "产地"}
            </button>
          ))}
        </div>
        <span className="text-xs text-gray-400 ml-auto">
          共 {sorted.length} 条
        </span>
      </div>

      {/* 表格 */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider">
              <Th onClick={() => handleSort("variety")}>
                品种 {sortIcon("variety")}
              </Th>
              <Th onClick={() => handleSort("market_type")}>
                类型 {sortIcon("market_type")}
              </Th>
              <Th onClick={() => handleSort("price")} align="right">
                价格 {sortIcon("price")}
              </Th>
              <Th onClick={() => handleSort("province")}>
                产地 {sortIcon("province")}
              </Th>
              <Th onClick={() => handleSort("recorded_at")}>
                日期 {sortIcon("recorded_at")}
              </Th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {sorted.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center text-gray-400">
                  暂无数据
                </td>
              </tr>
            ) : (
              sorted.slice(0, 50).map((row) => (
                <tr
                  key={row.id}
                  className="hover:bg-gray-50/50 transition-colors"
                >
                  <td className="px-6 py-3 font-medium text-gray-800">
                    {row.variety}
                  </td>
                  <td className="px-6 py-3">
                    <span
                      className={`inline-block px-2 py-0.5 text-xs rounded-full ${
                        row.market_type === "wholesale"
                          ? "bg-blue-50 text-blue-700"
                          : "bg-amber-50 text-amber-700"
                      }`}
                    >
                      {row.market_type === "wholesale" ? "批发价" : "产地价"}
                    </span>
                  </td>
                  <td className="px-6 py-3 text-right">
                    <span className="text-emerald-600 font-semibold tabular-nums">
                      ¥{Number(row.price).toFixed(1)}
                    </span>
                    <span className="text-gray-400 text-xs ml-1">{row.unit}</span>
                  </td>
                  <td className="px-6 py-3 text-gray-600">
                    {row.province}
                    {row.city ? ` · ${row.city}` : ""}
                  </td>
                  <td className="px-6 py-3 text-gray-400">{row.recorded_at}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Th({
  children,
  onClick,
  align,
}: {
  children: React.ReactNode;
  onClick: () => void;
  align?: "left" | "right";
}) {
  return (
    <th
      onClick={onClick}
      className={`px-6 py-3 font-semibold cursor-pointer hover:text-gray-700 select-none ${
        align === "right" ? "text-right" : "text-left"
      }`}
    >
      {children}
    </th>
  );
}
