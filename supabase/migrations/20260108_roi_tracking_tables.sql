-- ROI 추적 시스템 테이블 생성
-- recommendation_applications, roi_measurements, kpi_snapshots

-- ============================================================================
-- 1. recommendation_applications 테이블
-- AI 추천 적용 기록 및 ROI 측정을 위한 베이스라인 저장
-- ============================================================================
CREATE TABLE IF NOT EXISTS recommendation_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  scenario_id UUID REFERENCES scenarios(id) ON DELETE SET NULL,

  -- 추천 정보
  recommendation_type VARCHAR(50) NOT NULL,
  recommendation_summary TEXT,
  recommendation_details JSONB DEFAULT '{}',

  -- 베이스라인 (적용 전 기준)
  baseline_date DATE NOT NULL,
  baseline_kpis JSONB NOT NULL DEFAULT '{}',

  -- 적용 정보
  applied_at TIMESTAMPTZ,
  applied_by UUID REFERENCES auth.users(id),

  -- 측정 기간
  measurement_period_days INTEGER DEFAULT 7,
  measurement_start_date DATE,
  measurement_end_date DATE,

  -- 상태: pending, applied, measuring, completed, reverted
  status VARCHAR(20) DEFAULT 'pending',

  -- 되돌리기 정보
  reverted_at TIMESTAMPTZ,
  reverted_reason TEXT,

  -- 메타
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_recommendation_applications_org ON recommendation_applications(org_id);
CREATE INDEX IF NOT EXISTS idx_recommendation_applications_store ON recommendation_applications(store_id);
CREATE INDEX IF NOT EXISTS idx_recommendation_applications_status ON recommendation_applications(status);
CREATE INDEX IF NOT EXISTS idx_recommendation_applications_created ON recommendation_applications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_recommendation_applications_type ON recommendation_applications(recommendation_type);

-- ============================================================================
-- 2. roi_measurements 테이블
-- 측정 기간 완료 후 ROI 결과 저장
-- ============================================================================
CREATE TABLE IF NOT EXISTS roi_measurements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  application_id UUID NOT NULL REFERENCES recommendation_applications(id) ON DELETE CASCADE,

  -- 측정 기간
  measurement_start_date DATE NOT NULL,
  measurement_end_date DATE NOT NULL,
  measurement_days INTEGER NOT NULL,

  -- 측정된 KPI
  measured_kpis JSONB NOT NULL DEFAULT '{}',

  -- KPI 변화량
  kpi_changes JSONB NOT NULL DEFAULT '{}',
  -- { total_revenue: { absolute: 500000, percentage: 12.5 }, ... }

  -- 통계적 유의성
  statistical_significance JSONB,
  -- { p_value: 0.03, confidence_interval: [8.2, 16.8], sample_size: 7, is_significant: true }

  -- 연간 예상 영향
  estimated_annual_impact JSONB,
  -- { revenue: 6000000, visitors: 3650, transactions: 730 }

  -- 요약
  summary_text TEXT,
  is_positive_impact BOOLEAN,

  -- 메타
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_roi_measurements_org ON roi_measurements(org_id);
CREATE INDEX IF NOT EXISTS idx_roi_measurements_application ON roi_measurements(application_id);
CREATE INDEX IF NOT EXISTS idx_roi_measurements_created ON roi_measurements(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_roi_measurements_positive ON roi_measurements(is_positive_impact);

-- ============================================================================
-- 3. kpi_snapshots 테이블
-- 베이스라인 및 측정 시점의 KPI 스냅샷
-- ============================================================================
CREATE TABLE IF NOT EXISTS kpi_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  application_id UUID REFERENCES recommendation_applications(id) ON DELETE SET NULL,

  -- 스냅샷 정보
  snapshot_date DATE NOT NULL,
  snapshot_type VARCHAR(20) DEFAULT 'baseline', -- baseline, measurement

  -- KPI 데이터
  total_revenue DECIMAL(15,2),
  total_visitors INTEGER,
  total_transactions INTEGER,
  conversion_rate DECIMAL(5,2),
  avg_transaction_value DECIMAL(12,2),
  items_per_transaction DECIMAL(5,2),
  avg_dwell_time_minutes DECIMAL(5,1),

  -- 추가 메트릭
  additional_metrics JSONB,

  -- 메타
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_kpi_snapshots_org ON kpi_snapshots(org_id);
CREATE INDEX IF NOT EXISTS idx_kpi_snapshots_store ON kpi_snapshots(store_id);
CREATE INDEX IF NOT EXISTS idx_kpi_snapshots_application ON kpi_snapshots(application_id);
CREATE INDEX IF NOT EXISTS idx_kpi_snapshots_date ON kpi_snapshots(snapshot_date);
CREATE INDEX IF NOT EXISTS idx_kpi_snapshots_type ON kpi_snapshots(snapshot_type);

-- ============================================================================
-- RLS 정책
-- ============================================================================

-- recommendation_applications
ALTER TABLE recommendation_applications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own org recommendation applications"
ON recommendation_applications FOR SELECT
USING (org_id IN (SELECT org_id FROM organization_members WHERE user_id = auth.uid()));

CREATE POLICY "Users can insert own org recommendation applications"
ON recommendation_applications FOR INSERT
WITH CHECK (org_id IN (SELECT org_id FROM organization_members WHERE user_id = auth.uid()));

CREATE POLICY "Users can update own org recommendation applications"
ON recommendation_applications FOR UPDATE
USING (org_id IN (SELECT org_id FROM organization_members WHERE user_id = auth.uid()));

CREATE POLICY "Users can delete own org recommendation applications"
ON recommendation_applications FOR DELETE
USING (org_id IN (SELECT org_id FROM organization_members WHERE user_id = auth.uid()));

-- roi_measurements
ALTER TABLE roi_measurements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own org roi measurements"
ON roi_measurements FOR SELECT
USING (org_id IN (SELECT org_id FROM organization_members WHERE user_id = auth.uid()));

CREATE POLICY "Users can insert own org roi measurements"
ON roi_measurements FOR INSERT
WITH CHECK (org_id IN (SELECT org_id FROM organization_members WHERE user_id = auth.uid()));

CREATE POLICY "Users can update own org roi measurements"
ON roi_measurements FOR UPDATE
USING (org_id IN (SELECT org_id FROM organization_members WHERE user_id = auth.uid()));

-- kpi_snapshots
ALTER TABLE kpi_snapshots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own org kpi snapshots"
ON kpi_snapshots FOR SELECT
USING (org_id IN (SELECT org_id FROM organization_members WHERE user_id = auth.uid()));

CREATE POLICY "Users can insert own org kpi snapshots"
ON kpi_snapshots FOR INSERT
WITH CHECK (org_id IN (SELECT org_id FROM organization_members WHERE user_id = auth.uid()));

-- ============================================================================
-- Updated at 트리거
-- ============================================================================
CREATE OR REPLACE FUNCTION update_recommendation_applications_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_recommendation_applications_updated_at ON recommendation_applications;
CREATE TRIGGER trigger_recommendation_applications_updated_at
BEFORE UPDATE ON recommendation_applications
FOR EACH ROW
EXECUTE FUNCTION update_recommendation_applications_updated_at();
