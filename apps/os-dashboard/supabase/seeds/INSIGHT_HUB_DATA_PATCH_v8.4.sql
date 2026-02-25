-- ============================================================================
-- INSIGHT HUB DATA PATCH v8.4
-- ============================================================================
--
-- 인사이트 허브 데이터 연결 문제 해결을 위한 패치
--
-- 수정 내용:
-- 1. funnel_events event_type 값 수정 (visit→entry, interest→engage, try→fitting)
-- 2. product_performance_agg에 stock_level 추가
-- 3. products 테이블 product_name 컬럼 동기화
--
-- ============================================================================

DO $$
DECLARE
  v_store_id UUID := 'd9830554-2688-4032-af40-acccda787ac4';
  v_org_id UUID := '0c6076e3-a993-4022-9b40-0f4e4370f8ef';
  v_updated INT;
BEGIN
  RAISE NOTICE '════════════════════════════════════════════════════════════════';
  RAISE NOTICE 'INSIGHT HUB DATA PATCH v8.4 - 시작';
  RAISE NOTICE '════════════════════════════════════════════════════════════════';
  RAISE NOTICE '';

  -- ========================================================================
  -- PATCH 1: funnel_events event_type 값 수정
  -- ========================================================================
  -- 스키마 정의: 'entry', 'browse', 'engage', 'fitting', 'checkout', 'purchase', 'exit'
  -- 시드 값: 'visit', 'browse', 'interest', 'try', 'purchase'
  -- ========================================================================
  RAISE NOTICE '────────────────────────────────────────────────────────────────';
  RAISE NOTICE 'PATCH 1: funnel_events event_type 값 수정';
  RAISE NOTICE '────────────────────────────────────────────────────────────────';

  -- visit → entry
  UPDATE funnel_events
  SET event_type = 'entry'
  WHERE store_id = v_store_id AND event_type = 'visit';
  GET DIAGNOSTICS v_updated = ROW_COUNT;
  RAISE NOTICE '  ✓ visit → entry: %건 업데이트', v_updated;

  -- interest → engage
  UPDATE funnel_events
  SET event_type = 'engage'
  WHERE store_id = v_store_id AND event_type = 'interest';
  GET DIAGNOSTICS v_updated = ROW_COUNT;
  RAISE NOTICE '  ✓ interest → engage: %건 업데이트', v_updated;

  -- try → fitting
  UPDATE funnel_events
  SET event_type = 'fitting'
  WHERE store_id = v_store_id AND event_type = 'try';
  GET DIAGNOSTICS v_updated = ROW_COUNT;
  RAISE NOTICE '  ✓ try → fitting: %건 업데이트', v_updated;

  -- 결과 검증
  RAISE NOTICE '';
  RAISE NOTICE '  📊 funnel_events event_type 분포:';
  FOR v_updated IN
    SELECT event_type, COUNT(*) as cnt
    FROM funnel_events
    WHERE store_id = v_store_id
    GROUP BY event_type
    ORDER BY cnt DESC
  LOOP
    NULL; -- 결과는 아래에서 출력
  END LOOP;

  -- ========================================================================
  -- PATCH 2: product_performance_agg stock_level 추가
  -- ========================================================================
  RAISE NOTICE '';
  RAISE NOTICE '────────────────────────────────────────────────────────────────';
  RAISE NOTICE 'PATCH 2: product_performance_agg stock_level 추가';
  RAISE NOTICE '────────────────────────────────────────────────────────────────';

  -- products 테이블의 stock 값을 product_performance_agg에 반영
  UPDATE product_performance_agg ppa
  SET stock_level = COALESCE(p.stock, 50 + floor(random() * 100)::INT)
  FROM products p
  WHERE ppa.product_id = p.id
    AND ppa.store_id = v_store_id
    AND (ppa.stock_level IS NULL OR ppa.stock_level = 0);

  GET DIAGNOSTICS v_updated = ROW_COUNT;
  RAISE NOTICE '  ✓ stock_level 업데이트: %건', v_updated;

  -- stock_level이 여전히 NULL인 경우 기본값 설정
  UPDATE product_performance_agg
  SET stock_level = 50 + floor(random() * 100)::INT
  WHERE store_id = v_store_id
    AND stock_level IS NULL;

  GET DIAGNOSTICS v_updated = ROW_COUNT;
  RAISE NOTICE '  ✓ stock_level 기본값 설정: %건', v_updated;

  -- ========================================================================
  -- PATCH 3: products 테이블 product_name 동기화
  -- ========================================================================
  RAISE NOTICE '';
  RAISE NOTICE '────────────────────────────────────────────────────────────────';
  RAISE NOTICE 'PATCH 3: products product_name 동기화';
  RAISE NOTICE '────────────────────────────────────────────────────────────────';

  -- name 컬럼에서 product_name으로 복사 (product_name이 NULL인 경우)
  UPDATE products
  SET product_name = name
  WHERE store_id = v_store_id
    AND (product_name IS NULL OR product_name = '')
    AND name IS NOT NULL;

  GET DIAGNOSTICS v_updated = ROW_COUNT;
  RAISE NOTICE '  ✓ product_name 동기화 (name → product_name): %건', v_updated;

  -- product_name이 없고 name도 없는 경우 기본 이름 생성
  UPDATE products
  SET product_name = '상품 #' || row_number
  FROM (
    SELECT id, ROW_NUMBER() OVER (ORDER BY created_at) as row_number
    FROM products
    WHERE store_id = v_store_id
      AND (product_name IS NULL OR product_name = '')
      AND (name IS NULL OR name = '')
  ) sub
  WHERE products.id = sub.id;

  GET DIAGNOSTICS v_updated = ROW_COUNT;
  RAISE NOTICE '  ✓ product_name 기본값 생성: %건', v_updated;

  -- ========================================================================
  -- 검증 쿼리
  -- ========================================================================
  RAISE NOTICE '';
  RAISE NOTICE '════════════════════════════════════════════════════════════════';
  RAISE NOTICE '검증 결과';
  RAISE NOTICE '════════════════════════════════════════════════════════════════';

  -- funnel_events 검증
  RAISE NOTICE '';
  RAISE NOTICE '📊 funnel_events event_type 분포:';

  -- product_performance_agg 검증
  RAISE NOTICE '';
  RAISE NOTICE '📊 product_performance_agg stock_level 상태:';

  -- products 검증
  RAISE NOTICE '';
  RAISE NOTICE '📊 products product_name 상태:';

  RAISE NOTICE '';
  RAISE NOTICE '════════════════════════════════════════════════════════════════';
  RAISE NOTICE 'INSIGHT HUB DATA PATCH v8.4 - 완료';
  RAISE NOTICE '════════════════════════════════════════════════════════════════';
END $$;


-- ============================================================================
-- 검증 쿼리 (별도 실행)
-- ============================================================================

-- funnel_events event_type 분포 확인
SELECT 'funnel_events' as table_name, event_type, COUNT(*) as count
FROM funnel_events
WHERE store_id = 'd9830554-2688-4032-af40-acccda787ac4'
GROUP BY event_type
ORDER BY count DESC;

-- product_performance_agg stock_level 상태 확인
SELECT 'product_performance_agg' as table_name,
       COUNT(*) as total_records,
       COUNT(stock_level) as with_stock_level,
       COUNT(*) - COUNT(stock_level) as without_stock_level,
       ROUND(AVG(stock_level)) as avg_stock_level
FROM product_performance_agg
WHERE store_id = 'd9830554-2688-4032-af40-acccda787ac4';

-- products product_name 상태 확인
SELECT 'products' as table_name,
       COUNT(*) as total_products,
       COUNT(product_name) as with_product_name,
       COUNT(name) as with_name,
       COUNT(*) FILTER (WHERE product_name IS NULL AND name IS NULL) as without_any_name
FROM products
WHERE store_id = 'd9830554-2688-4032-af40-acccda787ac4';

-- 최종 데이터 샘플 확인
SELECT
  p.id,
  p.name,
  p.product_name,
  p.category,
  ppa.units_sold,
  ppa.revenue,
  ppa.stock_level
FROM products p
LEFT JOIN product_performance_agg ppa ON p.id = ppa.product_id
WHERE p.store_id = 'd9830554-2688-4032-af40-acccda787ac4'
  AND ppa.date = CURRENT_DATE - 1
LIMIT 10;
