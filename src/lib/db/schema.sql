-- ============================================================
-- 乡村振兴创新服务平台 · 核心数据库 DDL
-- 版本：V1.0
-- 数据库：Supabase (PostgreSQL 15+)
-- ============================================================

-- 启用必要的扩展
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- 1. 账户与权限
-- ============================================================

-- 账户表（主账号级别）
CREATE TABLE accounts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  plan TEXT NOT NULL DEFAULT 'free' CHECK (plan IN ('free', 'starter', 'professional', 'enterprise')),
  plan_expires_at TIMESTAMPTZ,
  credits_balance INTEGER NOT NULL DEFAULT 0 CHECK (credits_balance >= 0),
  credits_used_total INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 用户档案表（关联 Supabase Auth users 表）
CREATE TABLE profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('owner', 'member', 'admin', 'super_admin')),
  display_name TEXT NOT NULL,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id)
);

-- ============================================================
-- 2. 产品档案
-- ============================================================

CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  origin_province TEXT,
  origin_city TEXT,
  origin_county TEXT,
  product_image_url TEXT,
  product_image_key TEXT,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'archived')),
  latest_market_score NUMERIC(5,1),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- 3. 区域数据（种植联合体/县域）
-- ============================================================

CREATE TABLE areas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  province TEXT NOT NULL,
  city TEXT,
  county TEXT,
  area_type TEXT NOT NULL DEFAULT 'village' CHECK (area_type IN ('village', 'township', 'county')),
  gis_boundary TEXT, -- GeoJSON MULTIPOLYGON
  gis_boundary_simplified TEXT, -- 简化版边界（小比例尺渲染用）
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- 4. 模块一：市场分析报告
-- ============================================================

CREATE TABLE market_analyses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  scenario TEXT NOT NULL CHECK (scenario IN ('A', 'B')),
  input_data JSONB NOT NULL DEFAULT '{}',
  report_html TEXT,
  report_summary TEXT,
  report_pdf_url TEXT,
  market_score NUMERIC(5,1),
  recommended_path TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  error_message TEXT,
  credits_cost INTEGER NOT NULL DEFAULT 0,
  data_sources JSONB, -- 追踪引用的数据源版本
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- 5. 模块四：电商营销主图
-- ============================================================

CREATE TABLE marketing_images (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  image_type TEXT NOT NULL CHECK (image_type IN ('white_bg', 'detail', 'ingredient', 'scene', 'ad', 'traceability')),
  platform_size TEXT NOT NULL,
  image_url TEXT,
  image_key TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'generating', 'completed', 'failed')),
  error_message TEXT,
  credits_cost INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- 6. 模块六：生产合规检查
-- ============================================================

CREATE TABLE compliance_checks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  check_type TEXT NOT NULL DEFAULT 'gb7718',
  label_text TEXT NOT NULL,
  check_result JSONB NOT NULL DEFAULT '{}',
  grade TEXT NOT NULL CHECK (grade IN ('A', 'B', 'C')),
  source_version TEXT, -- GB 标准库版本号
  credits_cost INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- 7. 模块五：种植决策
-- ============================================================

CREATE TABLE planting_decisions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  area_id UUID REFERENCES areas(id) ON DELETE SET NULL,
  category TEXT NOT NULL,
  input_data JSONB NOT NULL DEFAULT '{}',
  recommendation JSONB,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  error_message TEXT,
  credits_cost INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- 8. 模块七：利润模型
-- ============================================================

CREATE TABLE profit_models (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id) ON DELETE SET NULL,
  raw_material_unit_price NUMERIC(10,2) NOT NULL,
  yield_rate NUMERIC(4,3) NOT NULL CHECK (yield_rate > 0 AND yield_rate <= 1),
  auxiliary_cost NUMERIC(10,2) NOT NULL DEFAULT 0,
  labor_cost NUMERIC(10,2) NOT NULL DEFAULT 0,
  logistics_cost NUMERIC(10,2) NOT NULL DEFAULT 0,
  selling_price NUMERIC(10,2) NOT NULL,
  gross_profit NUMERIC(10,2),
  gross_margin NUMERIC(4,3),
  channel_deduction NUMERIC(5,3),
  net_profit NUMERIC(10,2),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- 9. 行情数据（日更）
-- ============================================================

CREATE TABLE market_prices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  category TEXT NOT NULL,
  variety TEXT NOT NULL,
  market_type TEXT NOT NULL CHECK (market_type IN ('wholesale', 'farmgate')),
  price NUMERIC(10,2) NOT NULL,
  unit TEXT NOT NULL DEFAULT '元/公斤',
  source TEXT NOT NULL,
  province TEXT,
  city TEXT,
  recorded_at DATE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_market_prices_category ON market_prices(category);
CREATE INDEX idx_market_prices_recorded ON market_prices(recorded_at DESC);
CREATE INDEX idx_market_prices_lookup ON market_prices(category, market_type, recorded_at DESC);

-- ============================================================
-- 10. 计费功能组配置（超管管控）
-- ============================================================

CREATE TABLE plan_feature_groups (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  plan TEXT NOT NULL CHECK (plan IN ('free', 'starter', 'professional', 'enterprise')),
  feature_group TEXT NOT NULL,
  is_enabled BOOLEAN NOT NULL DEFAULT true,
  quota_type TEXT NOT NULL DEFAULT 'capped' CHECK (quota_type IN ('unlimited', 'capped', 'per_period')),
  quota_limit INTEGER NOT NULL DEFAULT 0,
  price_per_use INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(plan, feature_group)
);

-- ============================================================
-- 11. 配额消耗日志
-- ============================================================

CREATE TABLE quota_consumption_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  feature_group TEXT NOT NULL,
  quota_used INTEGER NOT NULL,
  quota_remaining INTEGER NOT NULL,
  trigger_module TEXT NOT NULL,
  trigger_record_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_quota_account ON quota_consumption_logs(account_id, created_at DESC);

-- ============================================================
-- 12. 操作审计日志
-- ============================================================

CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  resource_type TEXT NOT NULL,
  resource_id UUID,
  details JSONB,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_audit_account ON audit_logs(account_id, created_at DESC);
CREATE INDEX idx_audit_resource ON audit_logs(resource_type, resource_id);

-- ============================================================
-- 13. 积分交易记录
-- ============================================================

CREATE TABLE credit_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('purchase', 'consumption', 'refund', 'bonus', 'adjustment')),
  amount INTEGER NOT NULL,
  balance_after INTEGER NOT NULL,
  description TEXT,
  trigger_module TEXT,
  trigger_record_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_credit_tx_account ON credit_transactions(account_id, created_at DESC);

-- ============================================================
-- RLS 策略：数据行级安全
-- ============================================================

-- 账户：仅 owner/admin 可更新
ALTER TABLE accounts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "账户-本人读取" ON accounts FOR SELECT USING (id IN (
  SELECT account_id FROM profiles WHERE user_id = auth.uid()
));
CREATE POLICY "超管全部读取" ON accounts FOR SELECT USING (
  EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid() AND role = 'super_admin')
);

-- 产品：账户隔离
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "产品-账户隔离" ON products FOR ALL USING (account_id IN (
  SELECT account_id FROM profiles WHERE user_id = auth.uid()
));

-- 市场分析：账户隔离
ALTER TABLE market_analyses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "分析-账户隔离" ON market_analyses FOR ALL USING (account_id IN (
  SELECT account_id FROM profiles WHERE user_id = auth.uid()
));

-- 主图：账户隔离
ALTER TABLE marketing_images ENABLE ROW LEVEL SECURITY;
CREATE POLICY "主图-账户隔离" ON marketing_images FOR ALL USING (account_id IN (
  SELECT account_id FROM profiles WHERE user_id = auth.uid()
));

-- 合规检查：账户隔离
ALTER TABLE compliance_checks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "合规-账户隔离" ON compliance_checks FOR ALL USING (account_id IN (
  SELECT account_id FROM profiles WHERE user_id = auth.uid()
));

-- 行情数据：公开只读
ALTER TABLE market_prices ENABLE ROW LEVEL SECURITY;
CREATE POLICY "行情-公开读取" ON market_prices FOR SELECT USING (true);

-- ============================================================
-- 触发器：自动更新 updated_at
-- ============================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_accounts_updated_at BEFORE UPDATE ON accounts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_market_analyses_updated_at BEFORE UPDATE ON market_analyses FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- 初始数据：计费功能组配置
-- ============================================================

INSERT INTO plan_feature_groups (plan, feature_group, is_enabled, quota_type, quota_limit, price_per_use) VALUES
-- Free 套餐
('free', 'G1_market_analysis', true, 'capped', 3, 0),
('free', 'G2_planting_decision', false, 'capped', 0, 0),
('free', 'G4_marketing_image', false, 'capped', 0, 0),
('free', 'G5_profit_model', true, 'capped', 5, 0),
('free', 'G6_compliance_check', false, 'capped', 0, 0),
-- Starter 套餐
('starter', 'G1_market_analysis', true, 'capped', 10, 10),
('starter', 'G2_planting_decision', true, 'capped', 3, 15),
('starter', 'G4_marketing_image', true, 'capped', 12, 20),
('starter', 'G5_profit_model', true, 'unlimited', 0, 0),
('starter', 'G6_compliance_check', true, 'capped', 5, 10),
-- Professional 套餐
('professional', 'G1_market_analysis', true, 'capped', 30, 8),
('professional', 'G2_planting_decision', true, 'capped', 10, 12),
('professional', 'G4_marketing_image', true, 'capped', 60, 15),
('professional', 'G5_profit_model', true, 'unlimited', 0, 0),
('professional', 'G6_compliance_check', true, 'capped', 20, 8);
