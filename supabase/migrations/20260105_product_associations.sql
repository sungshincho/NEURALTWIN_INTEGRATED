-- ============================================================================
-- product_associations 테이블 마이그레이션
-- NEURALTWIN 상품 연관 규칙 저장 테이블
-- ============================================================================
-- 목적: 실시간 연관 규칙 마이닝 대신 사전 계산된 규칙을 저장하여
--       AI 최적화 시스템의 신뢰도 향상 및 응답 시간 단축
-- ============================================================================

-- ============================================================================
-- 1. product_associations 테이블 생성
-- ============================================================================
CREATE TABLE IF NOT EXISTS product_associations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- 매장 정보
  store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  org_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,

  -- 연관 규칙 핵심 정보
  antecedent_product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  consequent_product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,

  -- 연관 규칙 지표
  support DECIMAL(5,4) NOT NULL DEFAULT 0.01,       -- 지지도 (0-1)
  confidence DECIMAL(5,4) NOT NULL DEFAULT 0.30,    -- 신뢰도 (0-1)
  lift DECIMAL(6,2) NOT NULL DEFAULT 1.00,          -- 향상도 (>1 양의 연관)
  conviction DECIMAL(6,2) DEFAULT 1.00,             -- 확신도

  -- 규칙 메타데이터
  rule_type VARCHAR(20) DEFAULT 'co_purchase',
  -- 가능한 값: 'co_purchase' (동시구매), 'sequential' (순차구매), 'substitute' (대체상품)

  rule_strength VARCHAR(20) DEFAULT 'moderate',
  -- 가능한 값: 'very_strong', 'strong', 'moderate', 'weak'

  -- 배치 추천 타입
  placement_type VARCHAR(20) DEFAULT 'cross_sell',
  -- 가능한 값: 'bundle', 'cross_sell', 'upsell', 'impulse'

  -- 통계 정보
  co_occurrence_count INTEGER DEFAULT 0,           -- 동시 구매 횟수
  avg_basket_value DECIMAL(12,2) DEFAULT 0,        -- 함께 구매 시 평균 객단가

  -- 카테고리 정보 (조회 성능 향상용 캐시)
  antecedent_category VARCHAR(50),
  consequent_category VARCHAR(50),
  category_pair VARCHAR(100),                      -- "category1+category2" 형태

  -- 분석 메타데이터
  analysis_period_start DATE,
  analysis_period_end DATE,
  sample_transaction_count INTEGER DEFAULT 0,      -- 분석에 사용된 거래 수

  -- 활성 상태
  is_active BOOLEAN DEFAULT true,
  is_verified BOOLEAN DEFAULT false,               -- 수동 검증 여부

  -- 메타
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 2. 인덱스 생성
-- ============================================================================

-- 기본 조회 인덱스
CREATE INDEX IF NOT EXISTS idx_product_associations_store
ON product_associations(store_id);

CREATE INDEX IF NOT EXISTS idx_product_associations_antecedent
ON product_associations(antecedent_product_id);

CREATE INDEX IF NOT EXISTS idx_product_associations_consequent
ON product_associations(consequent_product_id);

-- 복합 인덱스 (매장+선행상품)
CREATE INDEX IF NOT EXISTS idx_product_associations_store_antecedent
ON product_associations(store_id, antecedent_product_id);

-- 강도 기반 필터링 인덱스
CREATE INDEX IF NOT EXISTS idx_product_associations_strength
ON product_associations(rule_strength) WHERE is_active = true;

-- Lift 기반 정렬 인덱스
CREATE INDEX IF NOT EXISTS idx_product_associations_lift
ON product_associations(lift DESC) WHERE is_active = true;

-- 카테고리 쌍 인덱스
CREATE INDEX IF NOT EXISTS idx_product_associations_category_pair
ON product_associations(category_pair);

-- 배치 타입 인덱스
CREATE INDEX IF NOT EXISTS idx_product_associations_placement_type
ON product_associations(placement_type) WHERE is_active = true;

-- 고유 제약 조건 (매장+선행+후행 조합)
CREATE UNIQUE INDEX IF NOT EXISTS idx_product_associations_unique_rule
ON product_associations(store_id, antecedent_product_id, consequent_product_id)
WHERE is_active = true;

-- ============================================================================
-- 3. RLS 정책 설정
-- ============================================================================

ALTER TABLE product_associations ENABLE ROW LEVEL SECURITY;

-- 조회: 자신의 조직 데이터만
CREATE POLICY "Users can view own org associations"
ON product_associations FOR SELECT
USING (
  org_id IN (SELECT org_id FROM organization_members WHERE user_id = auth.uid())
  OR store_id IN (SELECT id FROM stores WHERE user_id = auth.uid())
);

-- 삽입: 자신의 조직 데이터만
CREATE POLICY "Users can insert own org associations"
ON product_associations FOR INSERT
WITH CHECK (
  org_id IN (SELECT org_id FROM organization_members WHERE user_id = auth.uid())
  OR store_id IN (SELECT id FROM stores WHERE user_id = auth.uid())
);

-- 수정: 자신의 조직 데이터만
CREATE POLICY "Users can update own org associations"
ON product_associations FOR UPDATE
USING (
  org_id IN (SELECT org_id FROM organization_members WHERE user_id = auth.uid())
  OR store_id IN (SELECT id FROM stores WHERE user_id = auth.uid())
);

-- 삭제: 자신의 조직 데이터만
CREATE POLICY "Users can delete own org associations"
ON product_associations FOR DELETE
USING (
  org_id IN (SELECT org_id FROM organization_members WHERE user_id = auth.uid())
  OR store_id IN (SELECT id FROM stores WHERE user_id = auth.uid())
);

-- Service Role: 모든 데이터 접근 가능
CREATE POLICY "Service role can manage all associations"
ON product_associations FOR ALL
USING (auth.role() = 'service_role');

-- ============================================================================
-- 4. Updated At 트리거
-- ============================================================================

CREATE OR REPLACE FUNCTION update_product_associations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_product_associations_updated_at
BEFORE UPDATE ON product_associations
FOR EACH ROW
EXECUTE FUNCTION update_product_associations_updated_at();

-- ============================================================================
-- 5. RPC 함수: 상품 연관 규칙 조회
-- ============================================================================

-- 특정 상품의 연관 상품 조회
CREATE OR REPLACE FUNCTION get_product_associations(
  p_store_id UUID,
  p_product_id UUID DEFAULT NULL,
  p_min_confidence DECIMAL DEFAULT 0.3,
  p_min_lift DECIMAL DEFAULT 1.2,
  p_limit INTEGER DEFAULT 20
) RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
  SELECT COALESCE(json_agg(assoc_data), '[]'::json) INTO result
  FROM (
    SELECT
      json_build_object(
        'id', pa.id,
        'antecedentProductId', pa.antecedent_product_id,
        'consequentProductId', pa.consequent_product_id,
        'antecedentSku', p1.sku,
        'consequentSku', p2.sku,
        'antecedentName', p1.product_name,
        'consequentName', p2.product_name,
        'antecedentCategory', pa.antecedent_category,
        'consequentCategory', pa.consequent_category,
        'support', pa.support,
        'confidence', pa.confidence,
        'lift', pa.lift,
        'ruleStrength', pa.rule_strength,
        'placementType', pa.placement_type,
        'coOccurrenceCount', pa.co_occurrence_count,
        'avgBasketValue', pa.avg_basket_value
      ) as assoc_data
    FROM product_associations pa
    JOIN products p1 ON pa.antecedent_product_id = p1.id
    JOIN products p2 ON pa.consequent_product_id = p2.id
    WHERE pa.store_id = p_store_id
      AND pa.is_active = true
      AND pa.confidence >= p_min_confidence
      AND pa.lift >= p_min_lift
      AND (p_product_id IS NULL OR pa.antecedent_product_id = p_product_id)
    ORDER BY pa.lift DESC, pa.confidence DESC
    LIMIT p_limit
  ) assocs;

  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 카테고리 친화도 조회
CREATE OR REPLACE FUNCTION get_category_affinities(
  p_store_id UUID,
  p_limit INTEGER DEFAULT 10
) RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
  SELECT COALESCE(json_agg(affinity_data), '[]'::json) INTO result
  FROM (
    SELECT
      json_build_object(
        'category1', antecedent_category,
        'category2', consequent_category,
        'categoryPair', category_pair,
        'avgConfidence', ROUND(AVG(confidence)::NUMERIC, 3),
        'avgLift', ROUND(AVG(lift)::NUMERIC, 2),
        'ruleCount', COUNT(*),
        'strongRuleCount', COUNT(*) FILTER (WHERE rule_strength IN ('very_strong', 'strong')),
        'avgCoOccurrence', ROUND(AVG(co_occurrence_count)::NUMERIC, 0)
      ) as affinity_data
    FROM product_associations
    WHERE store_id = p_store_id
      AND is_active = true
      AND antecedent_category IS NOT NULL
      AND consequent_category IS NOT NULL
      AND antecedent_category != consequent_category
    GROUP BY antecedent_category, consequent_category, category_pair
    ORDER BY AVG(lift) DESC
    LIMIT p_limit
  ) affinities;

  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 연관 규칙 요약 통계
CREATE OR REPLACE FUNCTION get_association_summary(
  p_store_id UUID
) RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_build_object(
    'totalRules', COUNT(*),
    'activeRules', COUNT(*) FILTER (WHERE is_active),
    'veryStrongRules', COUNT(*) FILTER (WHERE rule_strength = 'very_strong' AND is_active),
    'strongRules', COUNT(*) FILTER (WHERE rule_strength = 'strong' AND is_active),
    'moderateRules', COUNT(*) FILTER (WHERE rule_strength = 'moderate' AND is_active),
    'weakRules', COUNT(*) FILTER (WHERE rule_strength = 'weak' AND is_active),
    'avgConfidence', ROUND(AVG(confidence) FILTER (WHERE is_active)::NUMERIC, 3),
    'avgLift', ROUND(AVG(lift) FILTER (WHERE is_active)::NUMERIC, 2),
    'bundleRecommendations', COUNT(*) FILTER (WHERE placement_type = 'bundle' AND is_active),
    'crossSellRecommendations', COUNT(*) FILTER (WHERE placement_type = 'cross_sell' AND is_active),
    'upsellRecommendations', COUNT(*) FILTER (WHERE placement_type = 'upsell' AND is_active),
    'impulseRecommendations', COUNT(*) FILTER (WHERE placement_type = 'impulse' AND is_active),
    'dataQuality', CASE
      WHEN AVG(sample_transaction_count) >= 500 THEN 'excellent'
      WHEN AVG(sample_transaction_count) >= 200 THEN 'good'
      WHEN AVG(sample_transaction_count) >= 50 THEN 'fair'
      ELSE 'poor'
    END
  ) INTO result
  FROM product_associations
  WHERE store_id = p_store_id;

  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 6. 코멘트 추가
-- ============================================================================

COMMENT ON TABLE product_associations IS '상품 연관 규칙 저장 테이블 - AI 최적화 시스템의 연관 분석 데이터';
COMMENT ON COLUMN product_associations.support IS '지지도: 전체 거래 중 두 상품이 함께 구매된 비율 (0-1)';
COMMENT ON COLUMN product_associations.confidence IS '신뢰도: 선행 상품 구매 시 후행 상품도 구매할 확률 (0-1)';
COMMENT ON COLUMN product_associations.lift IS '향상도: 연관성 강도 (>1이면 양의 연관, <1이면 음의 연관)';
COMMENT ON COLUMN product_associations.conviction IS '확신도: 규칙의 방향성 강도';
COMMENT ON COLUMN product_associations.rule_strength IS '규칙 강도 등급 (very_strong, strong, moderate, weak)';
COMMENT ON COLUMN product_associations.placement_type IS '배치 추천 유형 (bundle, cross_sell, upsell, impulse)';

COMMENT ON FUNCTION get_product_associations IS '특정 매장의 상품 연관 규칙을 조회 (신뢰도/향상도 필터링 지원)';
COMMENT ON FUNCTION get_category_affinities IS '카테고리 간 친화도 요약 조회';
COMMENT ON FUNCTION get_association_summary IS '연관 규칙 요약 통계 조회';
