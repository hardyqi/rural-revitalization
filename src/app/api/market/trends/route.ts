import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// GET /api/market/trends?category=蔬菜&variety=白菜&days=30
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);

    const category = searchParams.get("category") || "蔬菜";
    const variety = searchParams.get("variety");
    const days = Math.min(parseInt(searchParams.get("days") || "30"), 90);

    const dateTo = new Date();
    const dateFrom = new Date();
    dateFrom.setDate(dateFrom.getDate() - days);

    const dateFromStr = dateFrom.toISOString().split("T")[0];
    const dateToStr = dateTo.toISOString().split("T")[0];

    // 按日期聚合均价
    const { data, error } = await supabase.rpc("get_price_trends", {
      p_category: category,
      p_variety: variety || null,
      p_days: days,
    });

    if (error) {
      // RPC 回退 — 客户端聚合
      let query = supabase
        .from("market_prices")
        .select("recorded_at, price, variety, market_type")
        .eq("category", category)
        .gte("recorded_at", dateFromStr)
        .lte("recorded_at", dateToStr)
        .order("recorded_at", { ascending: true });

      if (variety) {
        query = query.ilike("variety", `%${variety}%`);
      }

      const { data: raw, error: rawErr } = await query;

      if (rawErr) {
        console.error("[market/trends] Query error:", rawErr);
        return NextResponse.json(
          { error: "查询趋势数据失败" },
          { status: 500 }
        );
      }

      // 按日期分组求均价
      const trendMap = new Map<string, { total: number; count: number }>();
      for (const row of raw || []) {
        const date = row.recorded_at;
        if (!trendMap.has(date)) {
          trendMap.set(date, { total: 0, count: 0 });
        }
        const entry = trendMap.get(date)!;
        entry.total += Number(row.price);
        entry.count++;
      }

      const result = Array.from(trendMap.entries())
        .map(([date, { total, count }]) => ({
          date,
          avg_price: Math.round((total / count) * 100) / 100,
        }))
        .sort((a, b) => a.date.localeCompare(b.date));

      return NextResponse.json({ data: result, category, variety: variety || "全部品种", days });
    }

    return NextResponse.json({ data, category, variety: variety || "全部品种", days });
  } catch (e) {
    console.error("[market/trends] Unexpected error:", e);
    return NextResponse.json({ error: "服务器内部错误" }, { status: 500 });
  }
}
