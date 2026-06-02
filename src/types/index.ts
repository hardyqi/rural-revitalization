// ============================================================
// 数据表行类型定义 — 乡村振兴平台
// ============================================================

export type Account = {
  id: string;
  name: string;
  plan: "free" | "starter" | "professional" | "enterprise";
  plan_expires_at: string | null;
  credits_balance: number;
  credits_used_total: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type Profile = {
  id: string;
  user_id: string;
  account_id: string;
  role: "owner" | "member" | "admin" | "super_admin";
  display_name: string;
  avatar_url: string | null;
  created_at: string;
};

export type Product = {
  id: string;
  account_id: string;
  name: string;
  category: string;
  origin_province: string | null;
  origin_city: string | null;
  origin_county: string | null;
  product_image_url: string | null;
  product_image_key: string | null;
  description: string | null;
  status: "draft" | "active" | "archived";
  latest_market_score: number | null;
  created_at: string;
  updated_at: string;
};

export type Area = {
  id: string;
  account_id: string;
  name: string;
  province: string;
  city: string | null;
  county: string | null;
  area_type: "village" | "township" | "county";
  gis_boundary: string | null; // GeoJSON
  created_at: string;
  updated_at: string;
};

export type MarketAnalysis = {
  id: string;
  account_id: string;
  product_id: string;
  scenario: "A" | "B";
  input_data: Record<string, unknown>;
  report_html: string | null;
  report_summary: string | null;
  report_pdf_url: string | null;
  market_score: number | null;
  recommended_path: string | null;
  status: "pending" | "processing" | "completed" | "failed";
  error_message: string | null;
  credits_cost: number;
  created_at: string;
  updated_at: string;
};

export type MarketingImage = {
  id: string;
  account_id: string;
  product_id: string;
  image_type: "white_bg" | "detail" | "ingredient" | "scene" | "ad" | "traceability";
  platform_size: string;
  image_url: string | null;
  image_key: string | null;
  status: "pending" | "generating" | "completed" | "failed";
  error_message: string | null;
  credits_cost: number;
  created_at: string;
  updated_at: string;
};

export type ProfitModel = {
  id: string;
  account_id: string;
  product_id: string | null;
  raw_material_unit_price: number;
  yield_rate: number; // 出成率 (0-1)
  auxiliary_cost: number;
  labor_cost: number;
  logistics_cost: number;
  selling_price: number;
  gross_profit: number | null;
  gross_margin: number | null; // 毛利率 (0-1)
  channel_deduction: number | null;
  net_profit: number | null;
  notes: string | null;
  created_at: string;
};

export type ComplianceCheck = {
  id: string;
  account_id: string;
  product_id: string;
  check_type: "gb7718";
  label_text: string;
  check_result: Record<string, unknown>; // JSON 检查结果
  grade: "A" | "B" | "C";
  credits_cost: number;
  created_at: string;
};

export type PlantingDecision = {
  id: string;
  account_id: string;
  area_id: string | null;
  category: string;
  input_data: Record<string, unknown>;
  recommendation: Record<string, unknown> | null;
  status: "pending" | "processing" | "completed" | "failed";
  error_message: string | null;
  credits_cost: number;
  created_at: string;
  updated_at: string;
};

export type MarketPrice = {
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
  created_at: string;
};

export type PlanFeatureGroup = {
  id: string;
  plan: string;
  feature_group: string;
  is_enabled: boolean;
  quota_type: "unlimited" | "capped" | "per_period";
  quota_limit: number;
  price_per_use: number;
  created_at: string;
  updated_at: string;
};

export type QuotaConsumptionLog = {
  id: string;
  account_id: string;
  feature_group: string;
  quota_used: number;
  quota_remaining: number;
  trigger_module: string;
  trigger_record_id: string | null;
  created_at: string;
};

export type AuditLog = {
  id: string;
  account_id: string;
  user_id: string;
  action: string;
  resource_type: string;
  resource_id: string;
  details: Record<string, unknown> | null;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
};
