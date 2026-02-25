-- ============================================================================
-- Migration: Add Staff Positions to Store Scenes
-- Description: B안 AI 최적화 통합 구현을 위한 store_scenes 테이블 확장
-- Date: 2026-01-15
-- ============================================================================

-- 1. staff_positions 컬럼 추가 (직원 위치 저장)
ALTER TABLE public.store_scenes
ADD COLUMN IF NOT EXISTS staff_positions JSONB DEFAULT '[]'::jsonb;

COMMENT ON COLUMN public.store_scenes.staff_positions IS '직원 위치 정보 배열 - StaffPosition[] 형식';

-- 2. scene_type 컬럼 업데이트 (이미 존재하면 ENUM 확장)
-- 기존 scene_type: '3d_layout' (기본값)
-- 추가: 'manual', 'ai_optimized', 'staffing_optimized'
-- 참고: 기존 컬럼이 TEXT 타입이므로 그대로 사용

-- 3. metadata 컬럼 추가 (최적화 메타데이터)
ALTER TABLE public.store_scenes
ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;

COMMENT ON COLUMN public.store_scenes.metadata IS '씬 메타데이터 - optimization_type, expected_impact, created_from 등';

-- 4. 인덱스 생성 (씬 타입별 조회 최적화)
CREATE INDEX IF NOT EXISTS idx_store_scenes_scene_type
ON public.store_scenes(scene_type);

CREATE INDEX IF NOT EXISTS idx_store_scenes_metadata_optimization_type
ON public.store_scenes USING gin ((metadata -> 'optimization_type'));

-- 5. 기존 데이터 백필 (staff_positions를 빈 배열로)
UPDATE public.store_scenes
SET staff_positions = '[]'::jsonb
WHERE staff_positions IS NULL;

-- 6. metadata 기본값 설정
UPDATE public.store_scenes
SET metadata = '{}'::jsonb
WHERE metadata IS NULL;

-- 7. scene_type 값 정규화 (기존 '3d_layout' → 'manual'로 변환)
UPDATE public.store_scenes
SET scene_type = 'manual'
WHERE scene_type = '3d_layout' OR scene_type IS NULL;

-- ============================================================================
-- 검증 쿼리 (실행 후 삭제 가능)
-- ============================================================================
-- SELECT column_name, data_type, column_default
-- FROM information_schema.columns
-- WHERE table_name = 'store_scenes'
-- AND column_name IN ('staff_positions', 'scene_type', 'metadata');
