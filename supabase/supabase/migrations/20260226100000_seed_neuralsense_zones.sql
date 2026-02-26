-- ============================================================================
-- NeuralSense 19개 존 시드 데이터 + 매핑 유틸
-- IoT→Supabase 파이프라인 Phase 1 (태스크 A1)
-- 2026-02-26
-- ============================================================================

-- 1. zones_dim에 고유 제약 추가 (idempotent insert 지원)
ALTER TABLE zones_dim
  ADD CONSTRAINT uq_zones_dim_store_zone_code UNIQUE (store_id, zone_code);

-- 2. NeuralSense 19개 그리드 존 INSERT
-- store_id: A매장, org_id: 기본 조직
-- zone_code: NS001~NS019 (기존 Z001~Z007과 구분)
-- position_x/z: zones.csv 좌표, position_y: 0 (바닥)
INSERT INTO zones_dim (
  id, store_id, org_id, zone_code, zone_name, zone_type,
  position_x, position_y, position_z,
  size_width, size_height, size_depth,
  is_active, metadata, created_at, updated_at
) VALUES
  (gen_random_uuid(), 'd9830554-2688-4032-af40-acccda787ac4', '0c6076e3-a993-4022-9b40-0f4e4370f8ef',
   'NS001', 'NeuralSense Zone 1',  'neuralsense_grid', -5, 0, -2, 2.0, 3.0, 2.0, true,
   '{"neuralsense_zone_id": 1, "grid_x": -5, "grid_y": -2}'::jsonb, now(), now()),

  (gen_random_uuid(), 'd9830554-2688-4032-af40-acccda787ac4', '0c6076e3-a993-4022-9b40-0f4e4370f8ef',
   'NS002', 'NeuralSense Zone 2',  'neuralsense_grid', -3, 0, -2, 2.0, 3.0, 2.0, true,
   '{"neuralsense_zone_id": 2, "grid_x": -3, "grid_y": -2}'::jsonb, now(), now()),

  (gen_random_uuid(), 'd9830554-2688-4032-af40-acccda787ac4', '0c6076e3-a993-4022-9b40-0f4e4370f8ef',
   'NS003', 'NeuralSense Zone 3',  'neuralsense_grid', -1, 0, -2, 2.0, 3.0, 2.0, true,
   '{"neuralsense_zone_id": 3, "grid_x": -1, "grid_y": -2}'::jsonb, now(), now()),

  (gen_random_uuid(), 'd9830554-2688-4032-af40-acccda787ac4', '0c6076e3-a993-4022-9b40-0f4e4370f8ef',
   'NS004', 'NeuralSense Zone 4',  'neuralsense_grid',  1, 0, -2, 2.0, 3.0, 2.0, true,
   '{"neuralsense_zone_id": 4, "grid_x": 1, "grid_y": -2}'::jsonb, now(), now()),

  (gen_random_uuid(), 'd9830554-2688-4032-af40-acccda787ac4', '0c6076e3-a993-4022-9b40-0f4e4370f8ef',
   'NS005', 'NeuralSense Zone 5',  'neuralsense_grid',  3, 0, -2, 2.0, 3.0, 2.0, true,
   '{"neuralsense_zone_id": 5, "grid_x": 3, "grid_y": -2}'::jsonb, now(), now()),

  (gen_random_uuid(), 'd9830554-2688-4032-af40-acccda787ac4', '0c6076e3-a993-4022-9b40-0f4e4370f8ef',
   'NS006', 'NeuralSense Zone 6',  'neuralsense_grid',  5, 0, -2, 2.0, 3.0, 2.0, true,
   '{"neuralsense_zone_id": 6, "grid_x": 5, "grid_y": -2}'::jsonb, now(), now()),

  (gen_random_uuid(), 'd9830554-2688-4032-af40-acccda787ac4', '0c6076e3-a993-4022-9b40-0f4e4370f8ef',
   'NS007', 'NeuralSense Zone 7',  'neuralsense_grid', -5, 0,  0, 2.0, 3.0, 2.0, true,
   '{"neuralsense_zone_id": 7, "grid_x": -5, "grid_y": 0}'::jsonb, now(), now()),

  (gen_random_uuid(), 'd9830554-2688-4032-af40-acccda787ac4', '0c6076e3-a993-4022-9b40-0f4e4370f8ef',
   'NS008', 'NeuralSense Zone 8',  'neuralsense_grid', -3, 0,  0, 2.0, 3.0, 2.0, true,
   '{"neuralsense_zone_id": 8, "grid_x": -3, "grid_y": 0}'::jsonb, now(), now()),

  (gen_random_uuid(), 'd9830554-2688-4032-af40-acccda787ac4', '0c6076e3-a993-4022-9b40-0f4e4370f8ef',
   'NS009', 'NeuralSense Zone 9',  'neuralsense_grid', -1, 0,  0, 2.0, 3.0, 2.0, true,
   '{"neuralsense_zone_id": 9, "grid_x": -1, "grid_y": 0}'::jsonb, now(), now()),

  (gen_random_uuid(), 'd9830554-2688-4032-af40-acccda787ac4', '0c6076e3-a993-4022-9b40-0f4e4370f8ef',
   'NS010', 'NeuralSense Zone 10', 'neuralsense_grid',  1, 0,  0, 2.0, 3.0, 2.0, true,
   '{"neuralsense_zone_id": 10, "grid_x": 1, "grid_y": 0}'::jsonb, now(), now()),

  (gen_random_uuid(), 'd9830554-2688-4032-af40-acccda787ac4', '0c6076e3-a993-4022-9b40-0f4e4370f8ef',
   'NS011', 'NeuralSense Zone 11', 'neuralsense_grid',  3, 0,  0, 2.0, 3.0, 2.0, true,
   '{"neuralsense_zone_id": 11, "grid_x": 3, "grid_y": 0}'::jsonb, now(), now()),

  (gen_random_uuid(), 'd9830554-2688-4032-af40-acccda787ac4', '0c6076e3-a993-4022-9b40-0f4e4370f8ef',
   'NS012', 'NeuralSense Zone 12', 'neuralsense_grid',  5, 0,  0, 2.0, 3.0, 2.0, true,
   '{"neuralsense_zone_id": 12, "grid_x": 5, "grid_y": 0}'::jsonb, now(), now()),

  (gen_random_uuid(), 'd9830554-2688-4032-af40-acccda787ac4', '0c6076e3-a993-4022-9b40-0f4e4370f8ef',
   'NS013', 'NeuralSense Zone 13', 'neuralsense_grid', -5, 0,  2, 2.0, 3.0, 2.0, true,
   '{"neuralsense_zone_id": 13, "grid_x": -5, "grid_y": 2}'::jsonb, now(), now()),

  (gen_random_uuid(), 'd9830554-2688-4032-af40-acccda787ac4', '0c6076e3-a993-4022-9b40-0f4e4370f8ef',
   'NS014', 'NeuralSense Zone 14', 'neuralsense_grid', -3, 0,  2, 2.0, 3.0, 2.0, true,
   '{"neuralsense_zone_id": 14, "grid_x": -3, "grid_y": 2}'::jsonb, now(), now()),

  (gen_random_uuid(), 'd9830554-2688-4032-af40-acccda787ac4', '0c6076e3-a993-4022-9b40-0f4e4370f8ef',
   'NS015', 'NeuralSense Zone 15', 'neuralsense_grid', -1, 0,  2, 2.0, 3.0, 2.0, true,
   '{"neuralsense_zone_id": 15, "grid_x": -1, "grid_y": 2}'::jsonb, now(), now()),

  (gen_random_uuid(), 'd9830554-2688-4032-af40-acccda787ac4', '0c6076e3-a993-4022-9b40-0f4e4370f8ef',
   'NS016', 'NeuralSense Zone 16', 'neuralsense_grid',  1, 0,  2, 2.0, 3.0, 2.0, true,
   '{"neuralsense_zone_id": 16, "grid_x": 1, "grid_y": 2}'::jsonb, now(), now()),

  (gen_random_uuid(), 'd9830554-2688-4032-af40-acccda787ac4', '0c6076e3-a993-4022-9b40-0f4e4370f8ef',
   'NS017', 'NeuralSense Zone 17', 'neuralsense_grid',  3, 0,  2, 2.0, 3.0, 2.0, true,
   '{"neuralsense_zone_id": 17, "grid_x": 3, "grid_y": 2}'::jsonb, now(), now()),

  (gen_random_uuid(), 'd9830554-2688-4032-af40-acccda787ac4', '0c6076e3-a993-4022-9b40-0f4e4370f8ef',
   'NS018', 'NeuralSense Zone 18', 'neuralsense_grid', -1, 0,  4, 2.0, 3.0, 2.0, true,
   '{"neuralsense_zone_id": 18, "grid_x": -1, "grid_y": 4}'::jsonb, now(), now()),

  (gen_random_uuid(), 'd9830554-2688-4032-af40-acccda787ac4', '0c6076e3-a993-4022-9b40-0f4e4370f8ef',
   'NS019', 'NeuralSense Zone 19', 'neuralsense_grid',  1, 0,  4, 2.0, 3.0, 2.0, true,
   '{"neuralsense_zone_id": 19, "grid_x": 1, "grid_y": 4}'::jsonb, now(), now())
ON CONFLICT (store_id, zone_code) DO NOTHING;

-- 3. 편의 함수: NeuralSense int zone_id → zones_dim UUID 조회
CREATE OR REPLACE FUNCTION get_neuralsense_zone_uuid(
  p_ns_zone_id integer,
  p_store_id uuid DEFAULT 'd9830554-2688-4032-af40-acccda787ac4'::uuid
)
RETURNS uuid
LANGUAGE sql STABLE
AS $$
  SELECT id FROM zones_dim
  WHERE store_id = p_store_id
    AND zone_code = 'NS' || LPAD(p_ns_zone_id::text, 3, '0')
    AND is_active = true
  LIMIT 1;
$$;

-- 4. 인덱스: neuralsense_zone_id 메타데이터 검색 최적화
CREATE INDEX IF NOT EXISTS idx_zones_dim_neuralsense_zone_id
  ON zones_dim ((metadata->>'neuralsense_zone_id'))
  WHERE metadata->>'neuralsense_zone_id' IS NOT NULL;

-- 5. 확인 쿼리 (마이그레이션 검증용)
-- SELECT zone_code, zone_name, position_x, position_z, metadata->>'neuralsense_zone_id' as ns_id
-- FROM zones_dim
-- WHERE zone_type = 'neuralsense_grid' AND store_id = 'd9830554-2688-4032-af40-acccda787ac4'
-- ORDER BY zone_code;
