-- ============================================================================
-- 온톨로지-데이터소스-AI 추론 시스템 스키마 (기존 테이블 호환 버전)
-- 버전: 1.2
-- 작성일: 2025-12-12
-- ============================================================================

-- 0. 기존 data_sources 테이블에 누락된 컬럼 추가
ALTER TABLE data_sources ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE data_sources ADD COLUMN IF NOT EXISTS schema_definition JSONB;
ALTER TABLE data_sources ADD COLUMN IF NOT EXISTS last_sync_at TIMESTAMPTZ;
ALTER TABLE data_sources ADD COLUMN IF NOT EXISTS last_sync_status TEXT;
ALTER TABLE data_sources ADD COLUMN IF NOT EXISTS record_count BIGINT DEFAULT 0;

-- 1. 데이터소스 테이블 정의
CREATE TABLE IF NOT EXISTS data_source_tables (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  data_source_id UUID NOT NULL REFERENCES data_sources(id) ON DELETE CASCADE,
  table_name TEXT NOT NULL,
  display_name TEXT,
  columns JSONB NOT NULL DEFAULT '[]',
  row_count BIGINT DEFAULT 0,
  sample_data JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(data_source_id, table_name)
);

-- 2. 엔티티 매핑 정의
CREATE TABLE IF NOT EXISTS ontology_entity_mappings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  data_source_id UUID NOT NULL REFERENCES data_sources(id) ON DELETE CASCADE,
  source_table TEXT NOT NULL,
  filter_condition TEXT,
  target_entity_type_id UUID NOT NULL REFERENCES ontology_entity_types(id),
  property_mappings JSONB NOT NULL DEFAULT '[]',
  label_template TEXT NOT NULL DEFAULT '${id}',
  is_active BOOLEAN DEFAULT true,
  priority INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. 관계 매핑 정의
CREATE TABLE IF NOT EXISTS ontology_relation_mappings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  data_source_id UUID NOT NULL REFERENCES data_sources(id) ON DELETE CASCADE,
  source_table TEXT NOT NULL,
  target_relation_type_id UUID NOT NULL REFERENCES ontology_relation_types(id),
  source_entity_resolver JSONB NOT NULL DEFAULT '{}',
  target_entity_resolver JSONB NOT NULL DEFAULT '{}',
  property_mappings JSONB DEFAULT '[]',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. 리테일 개념 정의
CREATE TABLE IF NOT EXISTS retail_concepts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID REFERENCES stores(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  display_name TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('behavior', 'metric', 'pattern', 'rule', 'kpi')),
  description TEXT,
  involved_entity_types TEXT[] DEFAULT '{}',
  involved_relation_types TEXT[] DEFAULT '{}',
  computation JSONB NOT NULL DEFAULT '{}',
  ai_context JSONB NOT NULL DEFAULT '{}',
  is_system BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. 개념 계산 결과 캐시
CREATE TABLE IF NOT EXISTS retail_concept_values (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  concept_id UUID NOT NULL REFERENCES retail_concepts(id) ON DELETE CASCADE,
  store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  computed_at TIMESTAMPTZ DEFAULT NOW(),
  value JSONB NOT NULL,
  parameters JSONB,
  valid_until TIMESTAMPTZ
);

-- 6. 동기화 로그
CREATE TABLE IF NOT EXISTS data_source_sync_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  data_source_id UUID NOT NULL REFERENCES data_sources(id) ON DELETE CASCADE,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  status TEXT DEFAULT 'running' CHECK (status IN ('running', 'completed', 'failed', 'cancelled')),
  entities_created INT DEFAULT 0,
  entities_updated INT DEFAULT 0,
  relations_created INT DEFAULT 0,
  errors JSONB DEFAULT '[]',
  triggered_by TEXT
);

-- 7. 인덱스
CREATE INDEX IF NOT EXISTS idx_data_sources_store ON data_sources(store_id);
CREATE INDEX IF NOT EXISTS idx_data_sources_type ON data_sources(source_type);
CREATE INDEX IF NOT EXISTS idx_data_source_tables_source ON data_source_tables(data_source_id);
CREATE INDEX IF NOT EXISTS idx_entity_mappings_source ON ontology_entity_mappings(data_source_id);
CREATE INDEX IF NOT EXISTS idx_relation_mappings_source ON ontology_relation_mappings(data_source_id);
CREATE INDEX IF NOT EXISTS idx_retail_concepts_category ON retail_concepts(category);
CREATE INDEX IF NOT EXISTS idx_retail_concepts_system ON retail_concepts(is_system);
CREATE INDEX IF NOT EXISTS idx_retail_concepts_store ON retail_concepts(store_id);
CREATE INDEX IF NOT EXISTS idx_concept_values_store ON retail_concept_values(store_id);
CREATE INDEX IF NOT EXISTS idx_concept_values_concept ON retail_concept_values(concept_id);
CREATE INDEX IF NOT EXISTS idx_sync_logs_source ON data_source_sync_logs(data_source_id);

-- 8. RLS 활성화
ALTER TABLE data_source_tables ENABLE ROW LEVEL SECURITY;
ALTER TABLE ontology_entity_mappings ENABLE ROW LEVEL SECURITY;
ALTER TABLE ontology_relation_mappings ENABLE ROW LEVEL SECURITY;
ALTER TABLE retail_concepts ENABLE ROW LEVEL SECURITY;
ALTER TABLE retail_concept_values ENABLE ROW LEVEL SECURITY;
ALTER TABLE data_source_sync_logs ENABLE ROW LEVEL SECURITY;

-- 9. 기존 RLS 정책 삭제
DO $$
BEGIN
  DROP POLICY IF EXISTS "Authenticated users can manage data source tables" ON data_source_tables;
  DROP POLICY IF EXISTS "Authenticated users can manage entity mappings" ON ontology_entity_mappings;
  DROP POLICY IF EXISTS "Authenticated users can manage relation mappings" ON ontology_relation_mappings;
  DROP POLICY IF EXISTS "Authenticated users can view concepts" ON retail_concepts;
  DROP POLICY IF EXISTS "Authenticated users can manage concepts" ON retail_concepts;
  DROP POLICY IF EXISTS "Authenticated users can manage concept values" ON retail_concept_values;
  DROP POLICY IF EXISTS "Authenticated users can manage sync logs" ON data_source_sync_logs;
END $$;

-- 10. 새 RLS 정책 (단순화)
CREATE POLICY "Authenticated users can manage data source tables" ON data_source_tables
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated users can manage entity mappings" ON ontology_entity_mappings
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated users can manage relation mappings" ON ontology_relation_mappings
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated users can view concepts" ON retail_concepts
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can manage concepts" ON retail_concepts
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated users can manage concept values" ON retail_concept_values
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated users can manage sync logs" ON data_source_sync_logs
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 11. updated_at 트리거 함수
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- 12. 트리거 생성
DROP TRIGGER IF EXISTS update_ontology_entity_mappings_updated_at ON ontology_entity_mappings;
CREATE TRIGGER update_ontology_entity_mappings_updated_at
  BEFORE UPDATE ON ontology_entity_mappings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_retail_concepts_updated_at ON retail_concepts;
CREATE TRIGGER update_retail_concepts_updated_at
  BEFORE UPDATE ON retail_concepts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
