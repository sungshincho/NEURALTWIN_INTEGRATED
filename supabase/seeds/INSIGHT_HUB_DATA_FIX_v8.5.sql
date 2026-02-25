-- ============================================================================
-- INSIGHT HUB DATA FIX PATCH v8.5
-- ============================================================================
--
-- 문제 해결:
-- 1. funnel_events browse/engage/fitting 이벤트 누락 보완
-- 2. funnel_events event_hour NULL 수정
-- 3. daily_kpis_agg returning_visitors > total_visitors 수정
--
-- 실행 방법: Supabase SQL Editor에서 실행
-- ============================================================================

DO $$
DECLARE
  v_store_id UUID := 'd9830554-2688-4032-af40-acccda787ac4';
  v_org_id UUID := '0c6076e3-a993-4022-9b40-0f4e4370f8ef';
  v_entry_count INT;
  v_browse_count INT;
  v_engage_count INT;
  v_fitting_count INT;
  v_purchase_count INT;
  v_fixed_count INT;
BEGIN
  RAISE NOTICE '════════════════════════════════════════════════════════════════';
  RAISE NOTICE 'INSIGHT HUB DATA FIX v8.5 - 시작';
  RAISE NOTICE '════════════════════════════════════════════════════════════════';
  RAISE NOTICE '';

  -- ========================================================================
  -- 현재 상태 확인
  -- ========================================================================
  SELECT COUNT(*) INTO v_entry_count FROM funnel_events WHERE store_id = v_store_id AND event_type = 'entry';
  SELECT COUNT(*) INTO v_browse_count FROM funnel_events WHERE store_id = v_store_id AND event_type = 'browse';
  SELECT COUNT(*) INTO v_engage_count FROM funnel_events WHERE store_id = v_store_id AND event_type = 'engage';
  SELECT COUNT(*) INTO v_fitting_count FROM funnel_events WHERE store_id = v_store_id AND event_type = 'fitting';
  SELECT COUNT(*) INTO v_purchase_count FROM funnel_events WHERE store_id = v_store_id AND event_type = 'purchase';

  RAISE NOTICE '[현재 상태]';
  RAISE NOTICE '  Entry: %', v_entry_count;
  RAISE NOTICE '  Browse: %', v_browse_count;
  RAISE NOTICE '  Engage: %', v_engage_count;
  RAISE NOTICE '  Fitting: %', v_fitting_count;
  RAISE NOTICE '  Purchase: %', v_purchase_count;
  RAISE NOTICE '';

  -- ========================================================================
  -- FIX 1: funnel_events event_hour NULL 수정
  -- ========================================================================
  RAISE NOTICE '[FIX 1] event_hour NULL 수정';

  UPDATE funnel_events
  SET event_hour = EXTRACT(HOUR FROM event_timestamp)::INT
  WHERE store_id = v_store_id
    AND event_hour IS NULL
    AND event_timestamp IS NOT NULL;

  GET DIAGNOSTICS v_fixed_count = ROW_COUNT;
  RAISE NOTICE '  ✓ event_hour 수정: %건', v_fixed_count;

  -- ========================================================================
  -- FIX 2: daily_kpis_agg returning_visitors 수정
  -- ========================================================================
  RAISE NOTICE '';
  RAISE NOTICE '[FIX 2] daily_kpis_agg returning_visitors 수정';

  -- returning_visitors가 total_visitors보다 큰 경우 수정
  UPDATE daily_kpis_agg
  SET returning_visitors = FLOOR(total_visitors * 0.25)::INT
  WHERE store_id = v_store_id
    AND returning_visitors > total_visitors;

  GET DIAGNOSTICS v_fixed_count = ROW_COUNT;
  RAISE NOTICE '  ✓ returning_visitors > total_visitors 수정: %건', v_fixed_count;

  -- returning_visitors가 NULL인 경우 수정
  UPDATE daily_kpis_agg
  SET returning_visitors = FLOOR(total_visitors * 0.20)::INT
  WHERE store_id = v_store_id
    AND returning_visitors IS NULL;

  GET DIAGNOSTICS v_fixed_count = ROW_COUNT;
  RAISE NOTICE '  ✓ returning_visitors NULL 수정: %건', v_fixed_count;

  -- ========================================================================
  -- FIX 3: Browse 이벤트 보완 (Entry의 75% 수준으로)
  -- ========================================================================
  RAISE NOTICE '';
  RAISE NOTICE '[FIX 3] Browse 이벤트 보완';

  IF v_browse_count < (v_entry_count * 0.5) THEN
    INSERT INTO funnel_events (
      id, store_id, org_id, session_id, visitor_id, event_type,
      event_timestamp, event_date, event_hour, duration_seconds, metadata, created_at
    )
    SELECT
      gen_random_uuid(),
      store_id,
      org_id,
      session_id,
      visitor_id,
      'browse',
      event_timestamp + INTERVAL '2 minutes',
      event_date,
      event_hour,
      120 + floor(random()*180)::INT,
      '{"source":"patch_v8.5","derived_from":"entry"}'::jsonb,
      NOW()
    FROM funnel_events
    WHERE store_id = v_store_id
      AND event_type = 'entry'
      AND session_id NOT IN (
        SELECT DISTINCT session_id FROM funnel_events
        WHERE store_id = v_store_id AND event_type = 'browse'
      )
      AND random() < 0.75;

    GET DIAGNOSTICS v_fixed_count = ROW_COUNT;
    RAISE NOTICE '  ✓ Browse 이벤트 생성: %건', v_fixed_count;
  ELSE
    RAISE NOTICE '  - Browse 이벤트 충분함, 스킵';
  END IF;

  -- ========================================================================
  -- FIX 4: Engage 이벤트 보완 (Browse의 60% 수준으로)
  -- ========================================================================
  RAISE NOTICE '';
  RAISE NOTICE '[FIX 4] Engage 이벤트 보완';

  -- 현재 browse 수 다시 확인
  SELECT COUNT(*) INTO v_browse_count FROM funnel_events WHERE store_id = v_store_id AND event_type = 'browse';

  IF v_engage_count < (v_browse_count * 0.4) THEN
    INSERT INTO funnel_events (
      id, store_id, org_id, session_id, visitor_id, event_type,
      event_timestamp, event_date, event_hour, duration_seconds, metadata, created_at
    )
    SELECT
      gen_random_uuid(),
      store_id,
      org_id,
      session_id,
      visitor_id,
      'engage',
      event_timestamp + INTERVAL '3 minutes',
      event_date,
      event_hour,
      180 + floor(random()*300)::INT,
      '{"source":"patch_v8.5","derived_from":"browse"}'::jsonb,
      NOW()
    FROM funnel_events
    WHERE store_id = v_store_id
      AND event_type = 'browse'
      AND session_id NOT IN (
        SELECT DISTINCT session_id FROM funnel_events
        WHERE store_id = v_store_id AND event_type = 'engage'
      )
      AND random() < 0.60;

    GET DIAGNOSTICS v_fixed_count = ROW_COUNT;
    RAISE NOTICE '  ✓ Engage 이벤트 생성: %건', v_fixed_count;
  ELSE
    RAISE NOTICE '  - Engage 이벤트 충분함, 스킵';
  END IF;

  -- ========================================================================
  -- FIX 5: Fitting 이벤트 보완 (Engage의 50% 수준으로)
  -- ========================================================================
  RAISE NOTICE '';
  RAISE NOTICE '[FIX 5] Fitting 이벤트 보완';

  -- 현재 engage 수 다시 확인
  SELECT COUNT(*) INTO v_engage_count FROM funnel_events WHERE store_id = v_store_id AND event_type = 'engage';

  IF v_fitting_count < (v_engage_count * 0.3) THEN
    INSERT INTO funnel_events (
      id, store_id, org_id, session_id, visitor_id, event_type,
      event_timestamp, event_date, event_hour, duration_seconds, metadata, created_at
    )
    SELECT
      gen_random_uuid(),
      store_id,
      org_id,
      session_id,
      visitor_id,
      'fitting',
      event_timestamp + INTERVAL '5 minutes',
      event_date,
      event_hour,
      300 + floor(random()*600)::INT,
      '{"source":"patch_v8.5","derived_from":"engage"}'::jsonb,
      NOW()
    FROM funnel_events
    WHERE store_id = v_store_id
      AND event_type = 'engage'
      AND session_id NOT IN (
        SELECT DISTINCT session_id FROM funnel_events
        WHERE store_id = v_store_id AND event_type = 'fitting'
      )
      AND random() < 0.50;

    GET DIAGNOSTICS v_fixed_count = ROW_COUNT;
    RAISE NOTICE '  ✓ Fitting 이벤트 생성: %건', v_fixed_count;
  ELSE
    RAISE NOTICE '  - Fitting 이벤트 충분함, 스킵';
  END IF;

  -- ========================================================================
  -- 최종 결과 확인
  -- ========================================================================
  RAISE NOTICE '';
  RAISE NOTICE '════════════════════════════════════════════════════════════════';
  RAISE NOTICE '[최종 결과]';

  SELECT COUNT(*) INTO v_entry_count FROM funnel_events WHERE store_id = v_store_id AND event_type = 'entry';
  SELECT COUNT(*) INTO v_browse_count FROM funnel_events WHERE store_id = v_store_id AND event_type = 'browse';
  SELECT COUNT(*) INTO v_engage_count FROM funnel_events WHERE store_id = v_store_id AND event_type = 'engage';
  SELECT COUNT(*) INTO v_fitting_count FROM funnel_events WHERE store_id = v_store_id AND event_type = 'fitting';
  SELECT COUNT(*) INTO v_purchase_count FROM funnel_events WHERE store_id = v_store_id AND event_type = 'purchase';

  RAISE NOTICE '  Entry: % (100%%)', v_entry_count;
  RAISE NOTICE '  Browse: % (%.1f%%)', v_browse_count, (v_browse_count::FLOAT / NULLIF(v_entry_count, 0) * 100);
  RAISE NOTICE '  Engage: % (%.1f%%)', v_engage_count, (v_engage_count::FLOAT / NULLIF(v_entry_count, 0) * 100);
  RAISE NOTICE '  Fitting: % (%.1f%%)', v_fitting_count, (v_fitting_count::FLOAT / NULLIF(v_entry_count, 0) * 100);
  RAISE NOTICE '  Purchase: % (%.1f%%)', v_purchase_count, (v_purchase_count::FLOAT / NULLIF(v_entry_count, 0) * 100);
  RAISE NOTICE '';
  RAISE NOTICE '════════════════════════════════════════════════════════════════';
  RAISE NOTICE 'INSIGHT HUB DATA FIX v8.5 - 완료';
  RAISE NOTICE '════════════════════════════════════════════════════════════════';
END $$;


-- ============================================================================
-- 결과 확인 쿼리
-- ============================================================================

-- 퍼널 이벤트 분포 확인
SELECT
  event_type,
  COUNT(*) as count,
  ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER(), 1) as percentage
FROM funnel_events
WHERE store_id = 'd9830554-2688-4032-af40-acccda787ac4'
GROUP BY event_type
ORDER BY
  CASE event_type
    WHEN 'entry' THEN 1
    WHEN 'browse' THEN 2
    WHEN 'engage' THEN 3
    WHEN 'fitting' THEN 4
    WHEN 'purchase' THEN 5
    ELSE 6
  END;

-- 시간대별 방문 확인
SELECT
  event_hour,
  COUNT(*) as visits
FROM funnel_events
WHERE store_id = 'd9830554-2688-4032-af40-acccda787ac4'
  AND event_type = 'entry'
  AND event_hour IS NOT NULL
GROUP BY event_hour
ORDER BY event_hour;

-- daily_kpis_agg 재방문 확인
SELECT
  date,
  total_visitors,
  returning_visitors,
  total_visitors - returning_visitors as new_visitors
FROM daily_kpis_agg
WHERE store_id = 'd9830554-2688-4032-af40-acccda787ac4'
ORDER BY date DESC
LIMIT 10;
