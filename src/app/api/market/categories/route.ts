import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// GET /api/market/categories — 返回所有品类及其最新均价
export async function GET() {
  try {
    const supabase = await createClient();

    // 用原生 SQL 聚合：每个品类的最新均价 + 品种数 + 数据新鲜度
    const { data, error } = await supabase.rpc("get_category_summary");

    if (error) {
      // RPC 不存在则回退到客户端聚合
      const { data: raw, error: rawErr } = await supabase
        .from("market_prices")
        .select("category, variety, price, recorded_at")
        .order("recorded_at", { ascending: false })
        .limit(500);

      if (rawErr) {
        console.error("[market/categories] Query error:", rawErr);
        return NextResponse.json(
          { error: "查询品类数据失败" },
          { status: 500 }
        );
      }

      // 客户端聚合
      const categoryMap = new Map<
        string,
        {
          category: string;
          varietyCount: number;
          avgPrice: number;
          latestDate: string;
          varieties: string[];
        }
      >();

      for (const row of raw || []) {
        if (!categoryMap.has(row.category)) {
          categoryMap.set(row.category, {
            category: row.category,
            varietyCount: 0,
            avgPrice: 0,
            latestDate: row.recorded_at,
            varieties: [],
          });
        }

        const entry = categoryMap.get(row.category)!;
        if (!entry.varieties.includes(row.variety)) {
          entry.varieties.push(row.variety);
          entry.varietyCount++;
        }
        entry.avgPrice += row.price;

        if (row.recorded_at > entry.latestDate) {
          entry.latestDate = row.recorded_at;
        }
      }

      const result = Array.from(categoryMap.values()).map((c) => ({
        ...c,
        avgPrice: Math.round((c.avgPrice / c.varieties.length) * 100) / 100,
      }));

      return NextResponse.json({ data: result });
    }

    return NextResponse.json({ data });
  } catch (e) {
    console.error("[market/categories] Unexpected error:", e);
    return NextResponse.json({ error: "服务器内部错误" }, { status: 500 });
  }
}
