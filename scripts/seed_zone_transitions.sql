-- ============================================================================
-- NEURALTWIN Zone Transitions Seeding Script
-- ============================================================================
-- 고객 동선 시각화를 위한 zone_transitions 데이터 시딩
-- zones_dim 데이터를 기반으로 현실적인 존 간 이동 패턴 생성
-- ============================================================================

DO $$
DECLARE
  v_store_id UUID := 'd9830554-2688-4032-af40-acccda787ac4';
  v_org_id UUID;
  v_zone_ids UUID[];
  v_zone_names TEXT[];
  v_zone_types TEXT[];
  v_entrance_idx INT := 1;
  v_exit_idx INT := 1;
  v_i INT;
  v_j INT;
  v_date DATE;
  v_transition_count INT;
  v_avg_duration NUMERIC;
  v_count INT;
BEGIN
  -- org_id 조회
  SELECT org_id INTO v_org_id FROM stores WHERE id = v_store_id;

  -- 기존 데이터 확인
  SELECT COUNT(*) INTO v_count FROM zone_transitions WHERE store_id = v_store_id;

  IF v_count > 0 THEN
    RAISE NOTICE 'zone_transitions 이미 %건 존재, 스킵', v_count;
    RETURN;
  END IF;

  -- zones_dim에서 존 정보 조회 (배열로)
  SELECT
    ARRAY_AGG(id ORDER BY zone_name),
    ARRAY_AGG(zone_name ORDER BY zone_name),
    ARRAY_AGG(COALESCE(zone_type, 'display') ORDER BY zone_name)
  INTO v_zone_ids, v_zone_names, v_zone_types
  FROM zones_dim
  WHERE store_id = v_store_id AND is_active = true;

  IF v_zone_ids IS NULL OR ARRAY_LENGTH(v_zone_ids, 1) < 2 THEN
    RAISE NOTICE 'zones_dim 데이터가 부족합니다 (최소 2개 필요)';
    RETURN;
  END IF;

  RAISE NOTICE '존 %개 발견: %', ARRAY_LENGTH(v_zone_ids, 1), v_zone_names;

  -- 입구/출구 존 찾기
  FOR v_i IN 1..ARRAY_LENGTH(v_zone_names, 1) LOOP
    IF LOWER(v_zone_names[v_i]) LIKE '%입구%' OR LOWER(v_zone_names[v_i]) LIKE '%entrance%'
       OR LOWER(v_zone_types[v_i]) = 'entrance' THEN
      v_entrance_idx := v_i;
    END IF;
    IF LOWER(v_zone_names[v_i]) LIKE '%출구%' OR LOWER(v_zone_names[v_i]) LIKE '%exit%'
       OR LOWER(v_zone_names[v_i]) LIKE '%계산%' OR LOWER(v_zone_types[v_i]) = 'checkout' THEN
      v_exit_idx := v_i;
    END IF;
  END LOOP;

  RAISE NOTICE '입구 존: % (idx: %), 출구 존: % (idx: %)',
    v_zone_names[v_entrance_idx], v_entrance_idx, v_zone_names[v_exit_idx], v_exit_idx;

  -- 최근 30일 데이터 생성
  FOR day_offset IN 0..29 LOOP
    v_date := CURRENT_DATE - day_offset;

    -- 입구 → 다른 존으로의 이동 (주요 유입 패턴)
    FOR v_i IN 1..ARRAY_LENGTH(v_zone_ids, 1) LOOP
      IF v_i <> v_entrance_idx THEN
        -- 입구에서 각 존으로의 이동량 (50~200)
        v_transition_count := 50 + FLOOR(RANDOM() * 150);
        v_avg_duration := 15 + FLOOR(RANDOM() * 45);  -- 15~60초

        INSERT INTO zone_transitions (
          id, store_id, org_id, from_zone_id, to_zone_id,
          transition_date, transition_count, avg_duration_seconds, created_at
        ) VALUES (
          gen_random_uuid(), v_store_id, v_org_id,
          v_zone_ids[v_entrance_idx], v_zone_ids[v_i],
          v_date, v_transition_count, v_avg_duration, NOW()
        );
      END IF;
    END LOOP;

    -- 존 간 상호 이동 패턴 (인접 존 간 이동이 많음)
    FOR v_i IN 1..ARRAY_LENGTH(v_zone_ids, 1) LOOP
      FOR v_j IN 1..ARRAY_LENGTH(v_zone_ids, 1) LOOP
        IF v_i <> v_j AND v_i <> v_entrance_idx AND v_j <> v_entrance_idx THEN
          -- 인접 존 여부에 따라 이동량 조절
          IF ABS(v_i - v_j) = 1 THEN
            v_transition_count := 30 + FLOOR(RANDOM() * 100);  -- 인접 존: 30~130
          ELSE
            v_transition_count := 10 + FLOOR(RANDOM() * 40);   -- 비인접 존: 10~50
          END IF;

          v_avg_duration := 20 + FLOOR(RANDOM() * 60);  -- 20~80초

          INSERT INTO zone_transitions (
            id, store_id, org_id, from_zone_id, to_zone_id,
            transition_date, transition_count, avg_duration_seconds, created_at
          ) VALUES (
            gen_random_uuid(), v_store_id, v_org_id,
            v_zone_ids[v_i], v_zone_ids[v_j],
            v_date, v_transition_count, v_avg_duration, NOW()
          );
        END IF;
      END LOOP;
    END LOOP;

    -- 각 존 → 출구로의 이동 (이탈 패턴)
    FOR v_i IN 1..ARRAY_LENGTH(v_zone_ids, 1) LOOP
      IF v_i <> v_exit_idx THEN
        v_transition_count := 20 + FLOOR(RANDOM() * 80);  -- 20~100
        v_avg_duration := 10 + FLOOR(RANDOM() * 30);  -- 10~40초

        INSERT INTO zone_transitions (
          id, store_id, org_id, from_zone_id, to_zone_id,
          transition_date, transition_count, avg_duration_seconds, created_at
        ) VALUES (
          gen_random_uuid(), v_store_id, v_org_id,
          v_zone_ids[v_i], v_zone_ids[v_exit_idx],
          v_date, v_transition_count, v_avg_duration, NOW()
        );
      END IF;
    END LOOP;
  END LOOP;

  GET DIAGNOSTICS v_count = ROW_COUNT;
  RAISE NOTICE 'zone_transitions 시딩 완료: 약 %건 생성됨', v_count;
END $$;


-- ============================================================================
-- 검증 쿼리
-- ============================================================================

SELECT '========== zone_transitions 시딩 결과 ==========' as info;

-- 전체 건수
SELECT 'Total transitions' as metric, COUNT(*) as value
FROM zone_transitions
WHERE store_id = 'd9830554-2688-4032-af40-acccda787ac4';

-- 날짜별 건수
SELECT 'Dates covered' as metric, COUNT(DISTINCT transition_date) as value
FROM zone_transitions
WHERE store_id = 'd9830554-2688-4032-af40-acccda787ac4';

-- 상위 이동 패턴 (총합 기준)
SELECT '========== 상위 10개 이동 패턴 ==========' as info;

SELECT
  fz.zone_name as from_zone,
  tz.zone_name as to_zone,
  SUM(zt.transition_count) as total_transitions,
  ROUND(AVG(zt.avg_duration_seconds), 1) as avg_duration_sec
FROM zone_transitions zt
JOIN zones_dim fz ON zt.from_zone_id = fz.id
JOIN zones_dim tz ON zt.to_zone_id = tz.id
WHERE zt.store_id = 'd9830554-2688-4032-af40-acccda787ac4'
GROUP BY fz.zone_name, tz.zone_name
ORDER BY total_transitions DESC
LIMIT 10;

SELECT '========== 시딩 완료 ==========' as info;
