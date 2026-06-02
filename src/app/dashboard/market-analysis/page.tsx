"use client";

import { useState, useEffect, useCallback } from "react";
import CategoryNav from "@/components/market/CategoryNav";
import TrendChart from "@/components/market/TrendChart";
import PriceTable from "@/components/market/PriceTable";
import RegionCompare from "@/components/market/RegionCompare";

type CategorySummary = {
  category: string;
  varietyCount: number;
  avgPrice: number;
  latestDate: string;
};

type TrendPoint = {
  date: string;
  avg_price: number;
};

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

type Region = {
  province: string;
  avg_price: number;
  latest_date: string;
};

export default function MarketAnalysisPage() {
  const [activeCategory, setActiveCategory] = useState("蔬菜");
  const [categories, setCategories] = useState<CategorySummary[]>([]);
  const [trends, setTrends] = useState<TrendPoint[]>([]);
  const [prices, setPrices] = useState<PriceRecord[]>([]);
  const [regions, setRegions] = useState<Region[]>([]);
  const [loading, setLoading] = useState({
    categories: true,
    trends: true,
    prices: true,
    regions: true,
  });

  // 加载品类列表
  const loadCategories = useCallback(async () => {
    setLoading((l) => ({ ...l, categories: true }));
    try {
      const res = await fetch("/api/market/categories");
      if (!res.ok) throw new Error("Failed");
      const json = await res.json();
      setCategories(json.data || []);
      if (json.data?.length > 0 && !json.data.find((c: CategorySummary) => c.category === activeCategory)) {
        setActiveCategory(json.data[0].category);
      }
    } catch (e) {
      console.error("Failed to load categories:", e);
    } finally {
      setLoading((l) => ({ ...l, categories: false }));
    }
  }, []);

  // 加载趋势数据
  const loadTrends = useCallback(async (category: string) => {
    setLoading((l) => ({ ...l, trends: true }));
    try {
      const res = await fetch(`/api/market/trends?category=${encodeURIComponent(category)}&days=30`);
      if (!res.ok) throw new Error("Failed");
      const json = await res.json();
      setTrends(json.data || []);
    } catch (e) {
      console.error("Failed to load trends:", e);
    } finally {
      setLoading((l) => ({ ...l, trends: false }));
    }
  }, []);

  // 加载价格列表
  const loadPrices = useCallback(async (category: string) => {
    setLoading((l) => ({ ...l, prices: true }));
    try {
      const res = await fetch(`/api/market/prices?category=${encodeURIComponent(category)}&limit=100&sort=recorded_at_desc`);
      if (!res.ok) throw new Error("Failed");
      const json = await res.json();
      setPrices(json.data || []);
    } catch (e) {
      console.error("Failed to load prices:", e);
    } finally {
      setLoading((l) => ({ ...l, prices: false }));
    }
  }, []);

  // 加载区域对比
  const loadRegions = useCallback(async (category: string) => {
    setLoading((l) => ({ ...l, regions: true }));
    try {
      const res = await fetch(`/api/market/regions?category=${encodeURIComponent(category)}`);
      if (!res.ok) throw new Error("Failed");
      const json = await res.json();
      setRegions(json.data || []);
    } catch (e) {
      console.error("Failed to load regions:", e);
    } finally {
      setLoading((l) => ({ ...l, regions: false }));
    }
  }, []);

  // 初始加载
  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  // 品类切换时加载数据
  useEffect(() => {
    if (activeCategory) {
      loadTrends(activeCategory);
      loadPrices(activeCategory);
      loadRegions(activeCategory);
    }
  }, [activeCategory, loadTrends, loadPrices, loadRegions]);

  const handleCategoryChange = (category: string) => {
    setActiveCategory(category);
  };

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">市场行情分析</h1>
        <p className="text-sm text-gray-500 mt-1">
          实时农产品批发与产地价格，支持多维度对比与趋势追踪
        </p>
      </div>

      {/* 品类导航 */}
      <CategoryNav
        categories={categories}
        active={activeCategory}
        onSelect={handleCategoryChange}
        loading={loading.categories}
      />

      {/* 趋势图 + 区域对比 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <TrendChart
            data={trends}
            category={activeCategory}
            variety="全部品种"
            loading={loading.trends}
          />
        </div>
        <div className="lg:col-span-1">
          <RegionCompare data={regions} loading={loading.regions} />
        </div>
      </div>

      {/* 价格明细表 */}
      <div>
        <h2 className="text-lg font-semibold text-gray-800 mb-3">
          价格明细 · {activeCategory}
        </h2>
        <PriceTable data={prices} loading={loading.prices} />
      </div>
    </div>
  );
}
