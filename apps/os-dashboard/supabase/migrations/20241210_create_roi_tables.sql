-- ROI 측정 대시보드 테이블
-- 적용된 전략 기록 테이블

CREATE TABLE IF NOT EXISTS applied_strategies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES stores(id),
  org_id UUID NOT NULL REFERENCES organizations(id),

  -- 출처 정보
  source VARCHAR(20) NOT NULL CHECK (source IN ('2d_simulation', '3d_simulation')),
  source_module VARCHAR(50) NOT NULL,
  -- source_module 값:
  -- 2D: 'price_optimization', 'inventory_optimization', 'promotion', 'demand_forecast'
  -- 3D: 'layout_optimization', 'flow_optimization', 'congestion_simulation', 'staffing_optimization'

  -- 전략 정보
  name VARCHAR(200) NOT NULL,
  description TEXT,
  settings JSONB DEFAULT '{}',  -- 적용 당시 설정 스냅샷

  -- 기간
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,

  -- ROI 정보
  expected_roi DECIMAL(10,2) NOT NULL,  -- 예상 ROI (%)
  target_roi DECIMAL(10,2),              -- 목표 ROI (%)
  current_roi DECIMAL(10,2),             -- 현재 ROI (실시간 계산)
  final_roi DECIMAL(10,2),               -- 최종 ROI (완료 후)

  -- 금액 정보
  expected_revenue DECIMAL(15,2),        -- 예상 매출 증가
  actual_revenue DECIMAL(15,2),          -- 실제 매출 증가

  -- 상태
  status VARCHAR(20) NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'completed', 'cancelled')),
  result VARCHAR(20)
    CHECK (result IN ('success', 'partial', 'failed')),
  -- success: 목표 ROI 100% 이상 달성
  -- partial: 목표 ROI 80-99% 달성
  -- failed: 목표 ROI 80% 미만

  -- 기준 메트릭 (적용 전 스냅샷)
  baseline_metrics JSONB DEFAULT '{}',
  -- 예: { "daily_revenue": 3200000, "conversion_rate": 14.2, "avg_order_value": 89000 }

  -- 메모
  notes TEXT,

  -- 메타
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),

  -- 인덱스용
  CONSTRAINT valid_dates CHECK (end_date >= start_date)
);

-- 일별 ROI 추적 테이블
CREATE TABLE IF NOT EXISTS strategy_daily_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  strategy_id UUID NOT NULL REFERENCES applied_strategies(id) ON DELETE CASCADE,

  date DATE NOT NULL,

  -- 일별 메트릭
  metrics JSONB NOT NULL DEFAULT '{}',
  -- 예: { "revenue": 4100000, "conversion_rate": 16.8, "visitors": 102, "orders": 17 }

  -- 계산된 ROI
  daily_roi DECIMAL(10,2),
  cumulative_roi DECIMAL(10,2),

  created_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(strategy_id, date)
);

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_applied_strategies_store ON applied_strategies(store_id);
CREATE INDEX IF NOT EXISTS idx_applied_strategies_org ON applied_strategies(org_id);
CREATE INDEX IF NOT EXISTS idx_applied_strategies_status ON applied_strategies(status);
CREATE INDEX IF NOT EXISTS idx_applied_strategies_dates ON applied_strategies(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_applied_strategies_source ON applied_strategies(source, source_module);
CREATE INDEX IF NOT EXISTS idx_applied_strategies_created ON applied_strategies(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_strategy_daily_metrics_strategy ON strategy_daily_metrics(strategy_id);
CREATE INDEX IF NOT EXISTS idx_strategy_daily_metrics_date ON strategy_daily_metrics(date);

-- RLS 정책
ALTER TABLE applied_strategies ENABLE ROW LEVEL SECURITY;
ALTER TABLE strategy_daily_metrics ENABLE ROW LEVEL SECURITY;

-- applied_strategies RLS
CREATE POLICY "Users can view own org strategies"
ON applied_strategies FOR SELECT
USING (org_id IN (SELECT org_id FROM organization_members WHERE user_id = auth.uid()));

CREATE POLICY "Users can insert own org strategies"
ON applied_strategies FOR INSERT
WITH CHECK (org_id IN (SELECT org_id FROM organization_members WHERE user_id = auth.uid()));

CREATE POLICY "Users can update own org strategies"
ON applied_strategies FOR UPDATE
USING (org_id IN (SELECT org_id FROM organization_members WHERE user_id = auth.uid()));

CREATE POLICY "Users can delete own org strategies"
ON applied_strategies FOR DELETE
USING (org_id IN (SELECT org_id FROM organization_members WHERE user_id = auth.uid()));

-- strategy_daily_metrics RLS
CREATE POLICY "Users can view own org metrics"
ON strategy_daily_metrics FOR SELECT
USING (strategy_id IN (
  SELECT id FROM applied_strategies WHERE org_id IN (
    SELECT org_id FROM organization_members WHERE user_id = auth.uid()
  )
));

CREATE POLICY "Users can insert own org metrics"
ON strategy_daily_metrics FOR INSERT
WITH CHECK (strategy_id IN (
  SELECT id FROM applied_strategies WHERE org_id IN (
    SELECT org_id FROM organization_members WHERE user_id = auth.uid()
  )
));

-- Updated at trigger
CREATE OR REPLACE FUNCTION update_applied_strategies_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_applied_strategies_updated_at
BEFORE UPDATE ON applied_strategies
FOR EACH ROW
EXECUTE FUNCTION update_applied_strategies_updated_at();

-- ROI 요약 조회 RPC 함수
CREATE OR REPLACE FUNCTION get_roi_summary(
  p_store_id UUID,
  p_days INTEGER DEFAULT 90
)
RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_build_object(
    'totalApplied', COUNT(*),
    'activeCount', COUNT(*) FILTER (WHERE status = 'active'),
    'successCount', COUNT(*) FILTER (WHERE result = 'success'),
    'failedCount', COUNT(*) FILTER (WHERE result = 'failed'),
    'successRate', CASE
      WHEN COUNT(*) FILTER (WHERE status = 'completed') > 0
      THEN ROUND(COUNT(*) FILTER (WHERE result = 'success')::NUMERIC /
           COUNT(*) FILTER (WHERE status = 'completed') * 100, 1)
      ELSE 0
    END,
    'averageRoi', COALESCE(ROUND(AVG(COALESCE(final_roi, current_roi))::NUMERIC, 1), 0),
    'totalRevenueImpact', COALESCE(SUM(COALESCE(actual_revenue, 0)), 0),
    'expectedRevenueTotal', COALESCE(SUM(COALESCE(expected_revenue, 0)), 0)
  ) INTO result
  FROM applied_strategies
  WHERE store_id = p_store_id
    AND created_at >= NOW() - (p_days || ' days')::INTERVAL;

  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 카테고리별 성과 조회 RPC 함수
CREATE OR REPLACE FUNCTION get_category_performance(
  p_store_id UUID,
  p_days INTEGER DEFAULT 90
)
RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_agg(category_data) INTO result
  FROM (
    SELECT
      source,
      source_module,
      COUNT(*) as applied_count,
      COUNT(*) FILTER (WHERE result = 'success') as success_count,
      COALESCE(ROUND(AVG(COALESCE(final_roi, current_roi))::NUMERIC, 1), 0) as average_roi,
      COALESCE(SUM(COALESCE(actual_revenue, 0)), 0) as total_impact,
      CASE
        WHEN LAG(SUM(COALESCE(actual_revenue, 0))) OVER (PARTITION BY source_module ORDER BY MIN(created_at)) IS NULL THEN 'stable'
        WHEN SUM(COALESCE(actual_revenue, 0)) > LAG(SUM(COALESCE(actual_revenue, 0))) OVER (PARTITION BY source_module ORDER BY MIN(created_at)) THEN 'up'
        WHEN SUM(COALESCE(actual_revenue, 0)) < LAG(SUM(COALESCE(actual_revenue, 0))) OVER (PARTITION BY source_module ORDER BY MIN(created_at)) THEN 'down'
        ELSE 'stable'
      END as trend
    FROM applied_strategies
    WHERE store_id = p_store_id
      AND created_at >= NOW() - (p_days || ' days')::INTERVAL
    GROUP BY source, source_module
    ORDER BY source, total_impact DESC
  ) category_data;

  RETURN COALESCE(result, '[]'::JSON);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
