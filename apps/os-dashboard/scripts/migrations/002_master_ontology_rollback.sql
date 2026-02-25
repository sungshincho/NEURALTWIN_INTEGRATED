-- ============================================================================
-- NEURALTWIN Master Ontology Rollback Script v2.0
-- ============================================================================
-- 작성일: 2025-12-14
-- 목적: 마이그레이션 롤백 - 백업 테이블에서 복원
--
-- 주의: 이 스크립트는 백업 테이블이 존재해야 실행 가능합니다
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE '⚠️ 롤백 시작: 백업에서 복원';
  RAISE NOTICE '========================================';
END $$;

-- ============================================================================
-- STEP 1: 백업 테이블 존재 확인
-- ============================================================================
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'ontology_entity_types_backup_20251214') THEN
    RAISE EXCEPTION '❌ 백업 테이블이 존재하지 않습니다: ontology_entity_types_backup_20251214';
  END IF;
  IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'ontology_relation_types_backup_20251214') THEN
    RAISE EXCEPTION '❌ 백업 테이블이 존재하지 않습니다: ontology_relation_types_backup_20251214';
  END IF;
  RAISE NOTICE '✅ 백업 테이블 확인 완료';
END $$;

-- ============================================================================
-- STEP 2: graph_entities 복원
-- ============================================================================
DO $$
BEGIN
  RAISE NOTICE '🔄 graph_entities entity_type_id 복원 중...';
END $$;

UPDATE graph_entities ge
SET entity_type_id = mapping.entity_type_id
FROM graph_entities_type_mapping_20251214 mapping
WHERE ge.id = mapping.id
  AND mapping.entity_type_id IS NOT NULL;

DO $$
DECLARE
  v_count INTEGER;
BEGIN
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RAISE NOTICE '✅ graph_entities 복원: %개 행', v_count;
END $$;

-- ============================================================================
-- STEP 3: 마스터 타입 삭제
-- ============================================================================
DO $$
BEGIN
  RAISE NOTICE '🗑️ 마스터 엔티티/관계 타입 삭제 중...';
END $$;

-- 마스터 관계 타입 삭제 (참조되지 않는 것만)
DELETE FROM ontology_relation_types
WHERE org_id IS NULL AND user_id IS NULL
  AND NOT EXISTS (
    SELECT 1 FROM graph_relations gr WHERE gr.relation_type_id = ontology_relation_types.id
  );

-- 마스터 엔티티 타입 삭제 (참조되지 않는 것만)
DELETE FROM ontology_entity_types
WHERE org_id IS NULL AND user_id IS NULL
  AND NOT EXISTS (
    SELECT 1 FROM graph_entities ge WHERE ge.entity_type_id = ontology_entity_types.id
  );

DO $$ BEGIN RAISE NOTICE '✅ 마스터 타입 삭제 완료'; END $$;

-- ============================================================================
-- STEP 4: RLS 정책 복원
-- ============================================================================
DO $$
BEGIN
  RAISE NOTICE '🔄 RLS 정책 복원 중...';
END $$;

DROP POLICY IF EXISTS "View master and own entity types" ON ontology_entity_types;
DROP POLICY IF EXISTS "View master and own relation types" ON ontology_relation_types;

-- 원래 정책 복원
CREATE POLICY "Org members can view org entity types and master schema"
ON ontology_entity_types FOR SELECT USING (
  (
    (org_id IS NULL AND auth.uid() = user_id)
    OR
    (org_id IS NOT NULL AND is_org_member(auth.uid(), org_id))
  )
  OR
  (user_id = 'af316ab2-ffb5-4509-bd37-13aa31feb5ad'::uuid)
);

CREATE POLICY "Org members can view org relation types and master schema"
ON ontology_relation_types FOR SELECT USING (
  (
    (org_id IS NULL AND auth.uid() = user_id)
    OR
    (org_id IS NOT NULL AND is_org_member(auth.uid(), org_id))
  )
  OR
  (user_id = 'af316ab2-ffb5-4509-bd37-13aa31feb5ad'::uuid)
);

DO $$ BEGIN RAISE NOTICE '✅ RLS 정책 복원 완료'; END $$;

-- ============================================================================
-- STEP 5: 유니크 인덱스 복원
-- ============================================================================
DO $$
BEGIN
  RAISE NOTICE '🔄 유니크 인덱스 복원 중...';
END $$;

DROP INDEX IF EXISTS idx_ontology_entity_types_unique_scope;
DROP INDEX IF EXISTS idx_ontology_relation_types_unique_scope;

-- 원래 유니크 제약조건 복원
ALTER TABLE ontology_entity_types
ADD CONSTRAINT ontology_entity_types_user_id_name_key UNIQUE (user_id, name);

ALTER TABLE ontology_relation_types
ADD CONSTRAINT ontology_relation_types_user_id_name_source_target_key
UNIQUE (user_id, name, source_entity_type, target_entity_type);

DO $$ BEGIN RAISE NOTICE '✅ 유니크 인덱스 복원 완료'; END $$;

-- ============================================================================
-- STEP 6: user_id NOT NULL 복원
-- ============================================================================
DO $$
BEGIN
  RAISE NOTICE '🔄 user_id NOT NULL 제약조건 복원 중...';
END $$;

-- 주의: NULL 값이 있으면 이 단계가 실패합니다
-- 먼저 NULL 값이 없는지 확인
DO $$
DECLARE
  v_null_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_null_count FROM ontology_entity_types WHERE user_id IS NULL;
  IF v_null_count > 0 THEN
    RAISE WARNING '⚠️ ontology_entity_types에 user_id=NULL인 행이 %개 있습니다. NOT NULL 복원을 건너뜁니다.', v_null_count;
  ELSE
    ALTER TABLE ontology_entity_types ALTER COLUMN user_id SET NOT NULL;
    RAISE NOTICE '✅ ontology_entity_types.user_id NOT NULL 복원';
  END IF;

  SELECT COUNT(*) INTO v_null_count FROM ontology_relation_types WHERE user_id IS NULL;
  IF v_null_count > 0 THEN
    RAISE WARNING '⚠️ ontology_relation_types에 user_id=NULL인 행이 %개 있습니다. NOT NULL 복원을 건너뜁니다.', v_null_count;
  ELSE
    ALTER TABLE ontology_relation_types ALTER COLUMN user_id SET NOT NULL;
    RAISE NOTICE '✅ ontology_relation_types.user_id NOT NULL 복원';
  END IF;
END $$;

-- ============================================================================
-- STEP 7: 검증
-- ============================================================================
DO $$
DECLARE
  v_entity_count INTEGER;
  v_relation_count INTEGER;
  v_master_entity INTEGER;
  v_master_relation INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_entity_count FROM ontology_entity_types;
  SELECT COUNT(*) INTO v_relation_count FROM ontology_relation_types;
  SELECT COUNT(*) INTO v_master_entity FROM ontology_entity_types WHERE org_id IS NULL AND user_id IS NULL;
  SELECT COUNT(*) INTO v_master_relation FROM ontology_relation_types WHERE org_id IS NULL AND user_id IS NULL;

  RAISE NOTICE '========================================';
  RAISE NOTICE '📊 롤백 후 상태:';
  RAISE NOTICE '   - 총 엔티티 타입: %개', v_entity_count;
  RAISE NOTICE '   - 총 관계 타입: %개', v_relation_count;
  RAISE NOTICE '   - 마스터 엔티티 타입: %개', v_master_entity;
  RAISE NOTICE '   - 마스터 관계 타입: %개', v_master_relation;
  RAISE NOTICE '========================================';
  RAISE NOTICE '✅ 롤백 완료!';
  RAISE NOTICE '========================================';
END $$;

-- ============================================================================
-- 선택적: 백업 테이블 삭제
-- ============================================================================
-- 롤백 후 백업 테이블이 더 이상 필요 없으면 삭제
-- DROP TABLE IF EXISTS ontology_entity_types_backup_20251214;
-- DROP TABLE IF EXISTS ontology_relation_types_backup_20251214;
-- DROP TABLE IF EXISTS graph_entities_type_mapping_20251214;
