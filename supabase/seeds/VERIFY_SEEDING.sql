-- ============================================================================
-- 🔍 데이터 시딩 검증 스크립트
-- Supabase SQL Editor에서 실행하여 모든 시딩 데이터 확인
-- ============================================================================

-- 📊 전체 요약
SELECT '=== 📊 데이터 시딩 요약 ===' as section;

SELECT
  'stores' as table_name,
  COUNT(*) as row_count,
  CASE WHEN COUNT(*) > 0 THEN '✅' ELSE '❌' END as status
FROM stores
UNION ALL
SELECT 'products', COUNT(*), CASE WHEN COUNT(*) >= 25 THEN '✅' ELSE '⚠️' END FROM products
UNION ALL
SELECT 'furniture', COUNT(*), CASE WHEN COUNT(*) >= 14 THEN '✅' ELSE '⚠️' END FROM furniture
UNION ALL
SELECT 'furniture_slots', COUNT(*), CASE WHEN COUNT(*) >= 100 THEN '✅' ELSE '⚠️' END FROM furniture_slots
UNION ALL
SELECT 'zones_dim', COUNT(*), CASE WHEN COUNT(*) > 0 THEN '✅' ELSE '⚠️' END FROM zones_dim
UNION ALL
SELECT 'graph_entities', COUNT(*), CASE WHEN COUNT(*) > 0 THEN '✅' ELSE '⚠️' END FROM graph_entities
UNION ALL
SELECT 'graph_relations', COUNT(*), CASE WHEN COUNT(*) > 0 THEN '✅' ELSE '⚠️' END FROM graph_relations
ORDER BY table_name;

-- ============================================================================
-- 🏪 매장 정보
-- ============================================================================
SELECT '=== 🏪 매장 정보 ===' as section;

SELECT id, name, width, height, depth, business_type
FROM stores
LIMIT 5;

-- ============================================================================
-- 👕 상품 + display_type 확인 (슬롯 호환성 핵심)
-- ============================================================================
SELECT '=== 👕 상품 display_type 분포 ===' as section;

SELECT
  display_type,
  COUNT(*) as count,
  ARRAY_AGG(name ORDER BY name LIMIT 3) as sample_products
FROM products
GROUP BY display_type
ORDER BY count DESC;

-- 상품별 compatible_display_types 확인
SELECT '=== 👕 상품 compatible_display_types ===' as section;

SELECT
  category,
  COUNT(*) as count,
  compatible_display_types[1] as primary_display,
  ARRAY_LENGTH(compatible_display_types, 1) as display_options
FROM products
GROUP BY category, compatible_display_types
ORDER BY category;

-- ============================================================================
-- 🪑 가구 정보
-- ============================================================================
SELECT '=== 🪑 가구 타입별 분포 ===' as section;

SELECT
  furniture_type,
  COUNT(*) as count,
  ROUND(AVG((dimensions->>'width')::numeric), 1) as avg_width
FROM furniture
GROUP BY furniture_type
ORDER BY count DESC;

-- 마네킹 가구 확인
SELECT '=== 🧍 마네킹 가구 ===' as section;

SELECT id, furniture_type, position, dimensions
FROM furniture
WHERE furniture_type LIKE 'mannequin%';

-- ============================================================================
-- 📌 슬롯 정보 (핵심!)
-- ============================================================================
SELECT '=== 📌 슬롯 타입별 분포 ===' as section;

SELECT
  slot_type,
  COUNT(*) as total_slots,
  SUM(CASE WHEN is_occupied THEN 1 ELSE 0 END) as occupied,
  SUM(CASE WHEN NOT is_occupied THEN 1 ELSE 0 END) as available
FROM furniture_slots
GROUP BY slot_type
ORDER BY total_slots DESC;

-- 가구별 슬롯 수
SELECT '=== 📌 가구별 슬롯 수 ===' as section;

SELECT
  f.furniture_type,
  f.id as furniture_id,
  COUNT(fs.id) as slot_count,
  STRING_AGG(DISTINCT fs.slot_type, ', ') as slot_types
FROM furniture f
LEFT JOIN furniture_slots fs ON f.id = fs.furniture_id
GROUP BY f.id, f.furniture_type
ORDER BY slot_count DESC
LIMIT 10;

-- ============================================================================
-- 🔗 슬롯-상품 호환성 매트릭스
-- ============================================================================
SELECT '=== 🔗 슬롯-상품 호환성 ===' as section;

-- 각 슬롯 타입에 배치 가능한 상품 수
SELECT
  fs.slot_type,
  COUNT(DISTINCT p.id) as compatible_products
FROM furniture_slots fs
CROSS JOIN products p
WHERE
  (fs.slot_type = 'hanger' AND 'hanging' = ANY(p.compatible_display_types)) OR
  (fs.slot_type = 'mannequin' AND 'standing' = ANY(p.compatible_display_types)) OR
  (fs.slot_type = 'shelf' AND ('folded' = ANY(p.compatible_display_types) OR 'located' = ANY(p.compatible_display_types) OR 'boxed' = ANY(p.compatible_display_types) OR 'stacked' = ANY(p.compatible_display_types))) OR
  (fs.slot_type = 'table' AND ('folded' = ANY(p.compatible_display_types) OR 'located' = ANY(p.compatible_display_types) OR 'boxed' = ANY(p.compatible_display_types))) OR
  (fs.slot_type = 'rack' AND ('hanging' = ANY(p.compatible_display_types) OR 'located' = ANY(p.compatible_display_types)))
GROUP BY fs.slot_type
ORDER BY compatible_products DESC;

-- ============================================================================
-- 🗺️ 존 정보
-- ============================================================================
SELECT '=== 🗺️ 존 정보 ===' as section;

SELECT
  zone_type,
  COUNT(*) as count,
  ROUND(SUM(area_sqm), 1) as total_area_sqm
FROM zones_dim
GROUP BY zone_type
ORDER BY count DESC;

-- ============================================================================
-- 🕸️ 온톨로지 그래프
-- ============================================================================
SELECT '=== 🕸️ 온톨로지 엔티티 ===' as section;

SELECT
  entity_type,
  COUNT(*) as count
FROM graph_entities
GROUP BY entity_type
ORDER BY count DESC;

SELECT '=== 🕸️ 온톨로지 관계 ===' as section;

SELECT
  relation_type,
  COUNT(*) as count
FROM (
  SELECT
    COALESCE(ort.name, 'Unknown') as relation_type
  FROM graph_relations gr
  LEFT JOIN ontology_relation_types ort ON gr.relation_type_id = ort.id
) sub
GROUP BY relation_type
ORDER BY count DESC;

-- ============================================================================
-- ✅ 최종 검증 결과
-- ============================================================================
SELECT '=== ✅ 최종 검증 ===' as section;

SELECT
  CASE
    WHEN (SELECT COUNT(*) FROM products WHERE display_type IS NOT NULL) >= 25
         AND (SELECT COUNT(*) FROM furniture) >= 14
         AND (SELECT COUNT(*) FROM furniture_slots) >= 100
    THEN '🎉 데이터 시딩 완료! AI 최적화 테스트 준비됨'
    ELSE '⚠️ 일부 데이터 누락 - 위 결과 확인 필요'
  END as verification_result;
