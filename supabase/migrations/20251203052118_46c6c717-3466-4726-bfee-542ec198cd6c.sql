-- ============================================
-- L1: RAW/GRAPH LAYER (기존 테이블 보완)
-- ============================================

-- L1: raw_imports - 원본 데이터 추적
CREATE TABLE IF NOT EXISTS public.raw_imports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid REFERENCES public.organizations(id),
  store_id uuid REFERENCES public.stores(id),
  user_id uuid NOT NULL,
  source_type text NOT NULL, -- 'csv', 'api', 'manual'
  source_name text,
  file_path text,
  row_count integer DEFAULT 0,
  status text DEFAULT 'pending', -- 'pending', 'processing', 'completed', 'failed'
  error_message text,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  processed_at timestamptz
);

-- ============================================
-- L2: FACT TABLES (정규화된 팩트 테이블)
-- ============================================

-- L2 DIM: zones_dim - 존 마스터 데이터
CREATE TABLE IF NOT EXISTS public.zones_dim (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid REFERENCES public.organizations(id),
  store_id uuid REFERENCES public.stores(id) NOT NULL,
  zone_code text NOT NULL,
  zone_name text NOT NULL,
  zone_type text, -- 'entrance', 'checkout', 'display', 'fitting', 'storage'
  floor_level integer DEFAULT 1,
  area_sqm numeric,
  capacity integer,
  parent_zone_id uuid REFERENCES public.zones_dim(id),
  coordinates jsonb, -- {x, y, width, height}
  metadata jsonb DEFAULT '{}'::jsonb,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(store_id, zone_code)
);

-- L2 FACT: line_items - 구매 라인 아이템
CREATE TABLE IF NOT EXISTS public.line_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid REFERENCES public.organizations(id),
  store_id uuid REFERENCES public.stores(id),
  transaction_id text NOT NULL,
  purchase_id uuid REFERENCES public.purchases(id),
  product_id uuid REFERENCES public.products(id),
  customer_id uuid REFERENCES public.customers(id),
  quantity integer NOT NULL DEFAULT 1,
  unit_price numeric NOT NULL,
  discount_amount numeric DEFAULT 0,
  tax_amount numeric DEFAULT 0,
  line_total numeric NOT NULL,
  transaction_date date NOT NULL,
  transaction_hour integer,
  payment_method text,
  is_return boolean DEFAULT false,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

-- L2 FACT: funnel_events - 퍼널 이벤트
CREATE TABLE IF NOT EXISTS public.funnel_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid REFERENCES public.organizations(id),
  store_id uuid REFERENCES public.stores(id),
  visitor_id text, -- anonymous visitor tracking
  customer_id uuid REFERENCES public.customers(id),
  session_id text,
  event_type text NOT NULL, -- 'entry', 'browse', 'engage', 'fitting', 'checkout', 'purchase', 'exit'
  event_date date NOT NULL,
  event_hour integer,
  event_timestamp timestamptz NOT NULL,
  zone_id uuid REFERENCES public.zones_dim(id),
  duration_seconds integer,
  previous_event_type text,
  next_event_type text,
  device_type text,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

-- L2 FACT: zone_events - 존 이벤트
CREATE TABLE IF NOT EXISTS public.zone_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid REFERENCES public.organizations(id),
  store_id uuid REFERENCES public.stores(id),
  zone_id uuid REFERENCES public.zones_dim(id),
  event_type text NOT NULL, -- 'enter', 'exit', 'dwell', 'interaction'
  event_date date NOT NULL,
  event_hour integer,
  event_timestamp timestamptz NOT NULL,
  visitor_id text,
  customer_id uuid REFERENCES public.customers(id),
  duration_seconds integer,
  sensor_type text, -- 'wifi', 'camera', 'beacon'
  sensor_id text,
  confidence_score numeric,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

-- L2 FACT: visit_zone_events - 방문-존 연계
CREATE TABLE IF NOT EXISTS public.visit_zone_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid REFERENCES public.organizations(id),
  store_id uuid REFERENCES public.stores(id),
  visit_id uuid REFERENCES public.visits(id),
  zone_id uuid REFERENCES public.zones_dim(id),
  entry_time timestamptz NOT NULL,
  exit_time timestamptz,
  dwell_seconds integer,
  interaction_count integer DEFAULT 0,
  path_sequence integer, -- 방문 순서
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

-- ============================================
-- L3: KPI/AGGREGATED TABLES (집계 테이블)
-- ============================================

-- L3: daily_kpis_agg - 일별 KPI 집계
CREATE TABLE IF NOT EXISTS public.daily_kpis_agg (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid REFERENCES public.organizations(id),
  store_id uuid REFERENCES public.stores(id),
  date date NOT NULL,
  -- Traffic KPIs
  total_visitors integer DEFAULT 0,
  unique_visitors integer DEFAULT 0,
  returning_visitors integer DEFAULT 0,
  avg_visit_duration_seconds integer,
  -- Sales KPIs
  total_transactions integer DEFAULT 0,
  total_revenue numeric DEFAULT 0,
  total_units_sold integer DEFAULT 0,
  avg_basket_size numeric,
  avg_transaction_value numeric,
  -- Conversion KPIs
  conversion_rate numeric,
  browse_to_engage_rate numeric,
  engage_to_purchase_rate numeric,
  -- Efficiency KPIs
  sales_per_sqm numeric,
  sales_per_visitor numeric,
  labor_hours numeric,
  sales_per_labor_hour numeric,
  -- External Factors
  weather_condition text,
  temperature numeric,
  is_holiday boolean DEFAULT false,
  special_event text,
  -- Metadata
  calculated_at timestamptz DEFAULT now(),
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(store_id, date)
);

-- L3: hourly_metrics - 시간별 메트릭
CREATE TABLE IF NOT EXISTS public.hourly_metrics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid REFERENCES public.organizations(id),
  store_id uuid REFERENCES public.stores(id),
  date date NOT NULL,
  hour integer NOT NULL CHECK (hour >= 0 AND hour <= 23),
  -- Traffic
  visitor_count integer DEFAULT 0,
  entry_count integer DEFAULT 0,
  exit_count integer DEFAULT 0,
  -- Sales
  transaction_count integer DEFAULT 0,
  revenue numeric DEFAULT 0,
  units_sold integer DEFAULT 0,
  -- Occupancy
  avg_occupancy integer,
  peak_occupancy integer,
  -- Conversion
  conversion_rate numeric,
  -- Metadata
  calculated_at timestamptz DEFAULT now(),
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  UNIQUE(store_id, date, hour)
);

-- L3: zone_daily_metrics - 존별 일간 메트릭
CREATE TABLE IF NOT EXISTS public.zone_daily_metrics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid REFERENCES public.organizations(id),
  store_id uuid REFERENCES public.stores(id),
  zone_id uuid REFERENCES public.zones_dim(id),
  date date NOT NULL,
  -- Traffic
  total_visitors integer DEFAULT 0,
  unique_visitors integer DEFAULT 0,
  entry_count integer DEFAULT 0,
  exit_count integer DEFAULT 0,
  -- Engagement
  avg_dwell_seconds integer,
  total_dwell_seconds integer,
  interaction_count integer DEFAULT 0,
  -- Performance
  conversion_count integer DEFAULT 0,
  revenue_attributed numeric DEFAULT 0,
  -- Heatmap
  heatmap_intensity numeric,
  peak_hour integer,
  peak_occupancy integer,
  -- Metadata
  calculated_at timestamptz DEFAULT now(),
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  UNIQUE(store_id, zone_id, date)
);

-- L3: customer_segments_agg - 고객 세그먼트 집계
CREATE TABLE IF NOT EXISTS public.customer_segments_agg (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid REFERENCES public.organizations(id),
  store_id uuid REFERENCES public.stores(id),
  date date NOT NULL,
  segment_type text NOT NULL, -- 'rfm', 'behavioral', 'demographic'
  segment_name text NOT NULL,
  customer_count integer DEFAULT 0,
  total_revenue numeric DEFAULT 0,
  avg_transaction_value numeric,
  visit_frequency numeric,
  avg_basket_size numeric,
  churn_risk_score numeric,
  ltv_estimate numeric,
  metadata jsonb DEFAULT '{}'::jsonb,
  calculated_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  UNIQUE(store_id, date, segment_type, segment_name)
);

-- L3: product_performance_agg - 상품 성과 집계
CREATE TABLE IF NOT EXISTS public.product_performance_agg (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid REFERENCES public.organizations(id),
  store_id uuid REFERENCES public.stores(id),
  product_id uuid REFERENCES public.products(id),
  date date NOT NULL,
  -- Sales
  units_sold integer DEFAULT 0,
  revenue numeric DEFAULT 0,
  transactions integer DEFAULT 0,
  -- Performance
  conversion_rate numeric,
  avg_selling_price numeric,
  discount_rate numeric,
  return_rate numeric,
  -- Inventory
  stock_level integer,
  stockout_hours integer DEFAULT 0,
  -- Ranking
  category_rank integer,
  store_rank integer,
  -- Metadata
  calculated_at timestamptz DEFAULT now(),
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  UNIQUE(store_id, product_id, date)
);

-- ============================================
-- INDEXES
-- ============================================

-- L1 indexes
CREATE INDEX IF NOT EXISTS idx_raw_imports_org_store ON public.raw_imports(org_id, store_id);
CREATE INDEX IF NOT EXISTS idx_raw_imports_status ON public.raw_imports(status);

-- L2 DIM indexes
CREATE INDEX IF NOT EXISTS idx_zones_dim_store ON public.zones_dim(store_id);
CREATE INDEX IF NOT EXISTS idx_zones_dim_type ON public.zones_dim(zone_type);

-- L2 FACT indexes
CREATE INDEX IF NOT EXISTS idx_line_items_store_date ON public.line_items(store_id, transaction_date);
CREATE INDEX IF NOT EXISTS idx_line_items_product ON public.line_items(product_id);
CREATE INDEX IF NOT EXISTS idx_line_items_customer ON public.line_items(customer_id);
CREATE INDEX IF NOT EXISTS idx_line_items_transaction ON public.line_items(transaction_id);

CREATE INDEX IF NOT EXISTS idx_funnel_events_store_date ON public.funnel_events(store_id, event_date);
CREATE INDEX IF NOT EXISTS idx_funnel_events_type ON public.funnel_events(event_type);
CREATE INDEX IF NOT EXISTS idx_funnel_events_visitor ON public.funnel_events(visitor_id);
CREATE INDEX IF NOT EXISTS idx_funnel_events_session ON public.funnel_events(session_id);

CREATE INDEX IF NOT EXISTS idx_zone_events_store_date ON public.zone_events(store_id, event_date);
CREATE INDEX IF NOT EXISTS idx_zone_events_zone ON public.zone_events(zone_id);
CREATE INDEX IF NOT EXISTS idx_zone_events_type ON public.zone_events(event_type);

CREATE INDEX IF NOT EXISTS idx_visit_zone_events_store ON public.visit_zone_events(store_id);
CREATE INDEX IF NOT EXISTS idx_visit_zone_events_visit ON public.visit_zone_events(visit_id);
CREATE INDEX IF NOT EXISTS idx_visit_zone_events_zone ON public.visit_zone_events(zone_id);

-- L3 indexes
CREATE INDEX IF NOT EXISTS idx_daily_kpis_agg_store_date ON public.daily_kpis_agg(store_id, date);
CREATE INDEX IF NOT EXISTS idx_hourly_metrics_store_date ON public.hourly_metrics(store_id, date);
CREATE INDEX IF NOT EXISTS idx_zone_daily_metrics_store_zone ON public.zone_daily_metrics(store_id, zone_id);
CREATE INDEX IF NOT EXISTS idx_zone_daily_metrics_date ON public.zone_daily_metrics(date);
CREATE INDEX IF NOT EXISTS idx_customer_segments_agg_store_date ON public.customer_segments_agg(store_id, date);
CREATE INDEX IF NOT EXISTS idx_product_performance_agg_store_date ON public.product_performance_agg(store_id, date);
CREATE INDEX IF NOT EXISTS idx_product_performance_agg_product ON public.product_performance_agg(product_id);

-- ============================================
-- RLS POLICIES
-- ============================================

-- Enable RLS
ALTER TABLE public.raw_imports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.zones_dim ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.line_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.funnel_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.zone_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.visit_zone_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_kpis_agg ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hourly_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.zone_daily_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_segments_agg ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_performance_agg ENABLE ROW LEVEL SECURITY;

-- RLS Policies (org-based)
CREATE POLICY "org_rls" ON public.raw_imports FOR ALL USING (
  (org_id IS NULL) OR (EXISTS (SELECT 1 FROM organization_members om WHERE om.user_id = auth.uid() AND om.org_id = raw_imports.org_id))
);

CREATE POLICY "org_rls" ON public.zones_dim FOR ALL USING (
  (org_id IS NULL) OR (EXISTS (SELECT 1 FROM organization_members om WHERE om.user_id = auth.uid() AND om.org_id = zones_dim.org_id))
);

CREATE POLICY "org_rls" ON public.line_items FOR ALL USING (
  (org_id IS NULL) OR (EXISTS (SELECT 1 FROM organization_members om WHERE om.user_id = auth.uid() AND om.org_id = line_items.org_id))
);

CREATE POLICY "org_rls" ON public.funnel_events FOR ALL USING (
  (org_id IS NULL) OR (EXISTS (SELECT 1 FROM organization_members om WHERE om.user_id = auth.uid() AND om.org_id = funnel_events.org_id))
);

CREATE POLICY "org_rls" ON public.zone_events FOR ALL USING (
  (org_id IS NULL) OR (EXISTS (SELECT 1 FROM organization_members om WHERE om.user_id = auth.uid() AND om.org_id = zone_events.org_id))
);

CREATE POLICY "org_rls" ON public.visit_zone_events FOR ALL USING (
  (org_id IS NULL) OR (EXISTS (SELECT 1 FROM organization_members om WHERE om.user_id = auth.uid() AND om.org_id = visit_zone_events.org_id))
);

CREATE POLICY "org_rls" ON public.daily_kpis_agg FOR ALL USING (
  (org_id IS NULL) OR (EXISTS (SELECT 1 FROM organization_members om WHERE om.user_id = auth.uid() AND om.org_id = daily_kpis_agg.org_id))
);

CREATE POLICY "org_rls" ON public.hourly_metrics FOR ALL USING (
  (org_id IS NULL) OR (EXISTS (SELECT 1 FROM organization_members om WHERE om.user_id = auth.uid() AND om.org_id = hourly_metrics.org_id))
);

CREATE POLICY "org_rls" ON public.zone_daily_metrics FOR ALL USING (
  (org_id IS NULL) OR (EXISTS (SELECT 1 FROM organization_members om WHERE om.user_id = auth.uid() AND om.org_id = zone_daily_metrics.org_id))
);

CREATE POLICY "org_rls" ON public.customer_segments_agg FOR ALL USING (
  (org_id IS NULL) OR (EXISTS (SELECT 1 FROM organization_members om WHERE om.user_id = auth.uid() AND om.org_id = customer_segments_agg.org_id))
);

CREATE POLICY "org_rls" ON public.product_performance_agg FOR ALL USING (
  (org_id IS NULL) OR (EXISTS (SELECT 1 FROM organization_members om WHERE om.user_id = auth.uid() AND om.org_id = product_performance_agg.org_id))
);

-- ============================================
-- TRIGGERS (updated_at)
-- ============================================

CREATE TRIGGER update_zones_dim_updated_at
  BEFORE UPDATE ON public.zones_dim
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_daily_kpis_agg_updated_at
  BEFORE UPDATE ON public.daily_kpis_agg
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();