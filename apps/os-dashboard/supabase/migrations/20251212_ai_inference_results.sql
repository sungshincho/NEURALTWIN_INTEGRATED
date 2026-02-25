-- ============================================================================
-- AI 추론 결과 저장 테이블 생성
--
-- unified-ai, retail-ai-inference Edge Function의 결과를 저장합니다.
-- ============================================================================

-- 1. ai_inference_results 테이블 (없으면 생성)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'ai_inference_results') THEN
    CREATE TABLE ai_inference_results (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      store_id UUID REFERENCES stores(id) ON DELETE CASCADE,
      inference_type TEXT NOT NULL,
      result JSONB NOT NULL,
      parameters JSONB DEFAULT '{}',
      processing_time_ms INTEGER,
      model_used TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
  END IF;
END $$;

-- 2. 인덱스 생성 (안전하게)
CREATE INDEX IF NOT EXISTS idx_ai_inference_results_store
  ON ai_inference_results(store_id);

CREATE INDEX IF NOT EXISTS idx_ai_inference_results_type
  ON ai_inference_results(inference_type);

CREATE INDEX IF NOT EXISTS idx_ai_inference_results_created
  ON ai_inference_results(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_ai_inference_results_store_type
  ON ai_inference_results(store_id, inference_type);

-- 3. RLS 활성화
ALTER TABLE ai_inference_results ENABLE ROW LEVEL SECURITY;

-- 4. RLS 정책 (store_id 기반으로 변경)
DO $$
BEGIN
  -- 기존 정책 삭제 (있으면)
  DROP POLICY IF EXISTS "Users can view own inference results" ON ai_inference_results;
  DROP POLICY IF EXISTS "Users can insert own inference results" ON ai_inference_results;
  DROP POLICY IF EXISTS "Users can delete own inference results" ON ai_inference_results;
  DROP POLICY IF EXISTS "Store members can view inference results" ON ai_inference_results;
  DROP POLICY IF EXISTS "Store members can insert inference results" ON ai_inference_results;
END $$;

-- store 소속 멤버가 조회 가능
CREATE POLICY "Store members can view inference results"
  ON ai_inference_results
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM stores s
      JOIN organization_members om ON om.org_id = s.org_id
      WHERE s.id = ai_inference_results.store_id
      AND om.user_id = auth.uid()
    )
  );

-- store 소속 멤버가 삽입 가능
CREATE POLICY "Store members can insert inference results"
  ON ai_inference_results
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM stores s
      JOIN organization_members om ON om.org_id = s.org_id
      WHERE s.id = ai_inference_results.store_id
      AND om.user_id = auth.uid()
    )
  );

-- ============================================================================
-- stores 테이블 컬럼 추가 (시뮬레이션용)
-- ============================================================================

-- 최대 수용 인원 (혼잡도 시뮬레이션용)
ALTER TABLE stores ADD COLUMN IF NOT EXISTS max_capacity INTEGER DEFAULT 50;

-- 직원 수 (인력 배치 시뮬레이션용)
ALTER TABLE stores ADD COLUMN IF NOT EXISTS staff_count INTEGER DEFAULT 3;

-- 운영 시간 (시간대별 분석용)
ALTER TABLE stores ADD COLUMN IF NOT EXISTS opening_hour INTEGER DEFAULT 10;
ALTER TABLE stores ADD COLUMN IF NOT EXISTS closing_hour INTEGER DEFAULT 22;

-- ============================================================================
-- 코멘트 추가
-- ============================================================================

COMMENT ON TABLE ai_inference_results IS 'AI 추론 결과 저장 (unified-ai, retail-ai-inference)';
COMMENT ON COLUMN ai_inference_results.inference_type IS '추론 타입 (layout_optimization, zone_analysis, traffic_flow 등)';
COMMENT ON COLUMN ai_inference_results.result IS 'AI 분석 결과 JSON (insights, recommendations, metrics)';
COMMENT ON COLUMN ai_inference_results.parameters IS '추론 시 사용된 파라미터';
COMMENT ON COLUMN ai_inference_results.processing_time_ms IS '처리 시간 (밀리초)';
COMMENT ON COLUMN ai_inference_results.model_used IS '사용된 AI 모델';

COMMENT ON COLUMN stores.max_capacity IS '매장 최대 수용 인원';
COMMENT ON COLUMN stores.staff_count IS '매장 직원 수';
COMMENT ON COLUMN stores.opening_hour IS '영업 시작 시간 (0-23)';
COMMENT ON COLUMN stores.closing_hour IS '영업 종료 시간 (0-23)';
