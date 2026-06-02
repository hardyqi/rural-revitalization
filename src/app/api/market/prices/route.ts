import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// GET /api/market/prices?category=蔬菜&variety=白菜&province=山东&market_type=wholesale&date_from=2026-05-01&date_to=2026-06-02&limit=50&offset=0&sort=price_desc
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);

    const category = searchParams.get("category");
    const variety = searchParams.get("variety");
    const province = searchParams.get("province");
    const market_type = searchParams.get("market_type");
    const date_from = searchParams.get("date_from");
    const date_to = searchParams.get("date_to");
    const limit = Math.min(parseInt(searchParams.get("limit") || "50"), 200);
    const offset = parseInt(searchParams.get("offset") || "0");
    const sort = searchParams.get("sort") || "recorded_at_desc";

    let query = supabase
      .from("market_prices")
      .select("*", { count: "exact" });

    if (category) {
      query = query.eq("category", category);
    }
    if (variety) {
      query = query.ilike("variety", `%${variety}%`);
    }
    if (province) {
      query = query.eq("province", province);
    }
    if (market_type) {
      query = query.eq("market_type", market_type);
    }
    if (date_from) {
      query = query.gte("recorded_at", date_from);
    }
    if (date_to) {
      query = query.lte("recorded_at", date_to);
    }

    // 排序
    switch (sort) {
      case "price_asc":
        query = query.order("price", { ascending: true });
        break;
      case "price_desc":
        query = query.order("price", { ascending: false });
        break;
      case "recorded_at_asc":
        query = query.order("recorded_at", { ascending: true });
        break;
      case "recorded_at_desc":
      default:
        query = query.order("recorded_at", { ascending: false });
        break;
    }

    query = query.range(offset, offset + limit - 1);

    const { data, error, count } = await query;

    if (error) {
      console.error("[market/prices] Query error:", error);
      return NextResponse.json({ error: "查询行情数据失败" }, { status: 500 });
    }

    return NextResponse.json({
      data,
      total: count ?? 0,
      limit,
      offset,
    });
  } catch (e) {
    console.error("[market/prices] Unexpected error:", e);
    return NextResponse.json({ error: "服务器内部错误" }, { status: 500 });
  }
}
