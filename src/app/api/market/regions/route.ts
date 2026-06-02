import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// GET /api/market/regions?category=蔬菜
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);

    const category = searchParams.get("category") || "蔬菜";

    // 各省级行政区最新均价对比
    const { data, error } = await supabase.rpc("get_regional_prices", {
      p_category: category,
    });

    if (error) {
      // RPC 回退 — 客户端聚合
      const { data: raw, error: rawErr } = await supabase
        .from("market_prices")
        .select("province, price, recorded_at")
        .eq("category", category)
        .order("recorded_at", { ascending: false })
        .limit(300);

      if (rawErr) {
        console.error("[market/regions] Query error:", rawErr);
        return NextResponse.json(
          { error: "查询区域数据失败" },
          { status: 500 }
        );
      }

      // 按省份聚合
      const regionMap = new Map<string, { total: number; count: number; latest: string }>();
      for (const row of raw || []) {
        const prov = row.province || "未知";
        if (!regionMap.has(prov)) {
          regionMap.set(prov, { total: 0, count: 0, latest: row.recorded_at });
        }
        const entry = regionMap.get(prov)!;
        entry.total += Number(row.price);
        entry.count++;
        if (row.recorded_at > entry.latest) {
          entry.latest = row.recorded_at;
        }
      }

      const result = Array.from(regionMap.entries())
        .map(([province, { total, count, latest }]) => ({
          province,
          avg_price: Math.round((total / count) * 100) / 100,
          latest_date: latest,
        }))
        .sort((a, b) => a.avg_price - b.avg_price);

      return NextResponse.json({ data: result, category });
    }

    return NextResponse.json({ data, category });
  } catch (e) {
    console.error("[market/regions] Unexpected error:", e);
    return NextResponse.json({ error: "服务器内部错误" }, { status: 500 });
  }
}
