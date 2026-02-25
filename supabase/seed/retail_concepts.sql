-- ============================================================================
-- 시스템 리테일 개념 시딩
-- 8개의 기본 리테일 분석 개념 정의
-- ============================================================================

INSERT INTO retail_concepts (name, display_name, category, description, involved_entity_types, involved_relation_types, computation, ai_context, is_system)
VALUES
-- 1. 고객 여정
('customer_journey', '고객 여정', 'behavior',
 '고객이 매장 내에서 이동한 구역 시퀀스',
 ARRAY['Customer', 'Visit', 'Zone'],
 ARRAY['VISITED', 'ENTERED_ZONE'],
 '{"type": "graph_traversal", "query": "SELECT customer_id, array_agg(zone_name ORDER BY entry_time) as journey FROM zone_visits GROUP BY customer_id", "parameters": {"min_zones": 2}}'::jsonb,
 '{"description": "고객의 구역 방문 순서를 분석하여 동선 패턴을 파악합니다", "benchmarks": {"low": 2, "medium": 4, "high": 6}, "actionableInsights": ["평균 여정이 2개 구역 미만 → 동선 유도 개선 필요", "특정 구역 이탈률 높음 → 해당 구역 매력도 점검", "주요 경로 파악 → 핵심 동선에 프로모션 배치"]}'::jsonb,
 true
),

-- 2. 구역별 전환 퍼널
('zone_conversion_funnel', '구역별 전환 퍼널', 'metric',
 '구역별 방문→구매 전환율',
 ARRAY['Zone', 'Visit', 'Transaction'],
 ARRAY['ENTERED_ZONE', 'HAS_TRANSACTION'],
 '{"type": "aggregation", "query": "SELECT zone_name, COUNT(DISTINCT visitor_id) as visitors, COUNT(DISTINCT transaction_id) as purchases, ROUND(COUNT(DISTINCT transaction_id)::numeric / NULLIF(COUNT(DISTINCT visitor_id), 0) * 100, 2) as conversion_rate FROM zone_metrics GROUP BY zone_name", "parameters": {"date_range": 30}}'::jsonb,
 '{"description": "각 구역의 방문자 대비 구매 전환율을 측정합니다", "benchmarks": {"low": 5, "medium": 15, "high": 25}, "actionableInsights": ["전환율 5% 미만 → 상품 구성 또는 가격 점검", "방문 많고 전환 낮음 → 직원 배치 강화", "전환율 높은 구역 → 유사 전략 다른 구역 적용"]}'::jsonb,
 true
),

-- 3. 교차 판매 친화도
('cross_sell_affinity', '교차 판매 친화도', 'pattern',
 '함께 구매되는 상품 조합',
 ARRAY['Product', 'Transaction', 'LineItem'],
 ARRAY['CONTAINS_ITEM'],
 '{"type": "pattern_match", "query": "SELECT p1.name as product_a, p2.name as product_b, COUNT(*) as co_purchase_count, COUNT(*)::numeric / total_transactions as support FROM co_purchases GROUP BY p1.name, p2.name HAVING COUNT(*) >= 3", "parameters": {"min_support": 3, "min_confidence": 0.1}}'::jsonb,
 '{"description": "동일 거래에서 함께 구매된 상품 조합을 분석합니다", "benchmarks": {"low": 1, "medium": 5, "high": 10}, "actionableInsights": ["높은 친화도 상품 → 인접 배치 또는 번들 상품 구성", "예상치 못한 조합 발견 → 새로운 프로모션 기회", "친화도 낮은 카테고리 → 교차 판매 유도 전략 수립"]}'::jsonb,
 true
),

-- 4. 재고 회전율
('inventory_turnover', '재고 회전율', 'metric',
 '재고 회전 속도',
 ARRAY['Product', 'Inventory'],
 ARRAY['IN_STOCK'],
 '{"type": "time_series", "query": "SELECT product_name, SUM(quantity_sold) as total_sold, AVG(current_stock) as avg_stock, SUM(quantity_sold)::numeric / NULLIF(AVG(current_stock), 0) as turnover_rate FROM inventory_metrics GROUP BY product_name", "parameters": {"period_days": 30}}'::jsonb,
 '{"description": "재고가 얼마나 빠르게 소진되는지 측정합니다", "benchmarks": {"low": 2, "medium": 6, "high": 12}, "actionableInsights": ["회전율 2 미만 → 가격 인하 또는 프로모션 검토", "회전율 12 초과 → 재고 부족 리스크, 발주량 증가 고려", "계절성 상품 → 시즌 종료 전 재고 소진 전략"]}'::jsonb,
 true
),

-- 5. 구역 히트맵
('zone_heatmap', '구역 히트맵', 'metric',
 '시간대별 구역 밀집도',
 ARRAY['Zone', 'Visit'],
 ARRAY['ENTERED_ZONE'],
 '{"type": "aggregation", "query": "SELECT zone_name, EXTRACT(HOUR FROM entry_time) as hour, COUNT(*) as visit_count, AVG(dwell_seconds) as avg_dwell FROM zone_visits GROUP BY zone_name, EXTRACT(HOUR FROM entry_time)", "parameters": {"date_range": 7}}'::jsonb,
 '{"description": "각 구역의 시간대별 방문자 수와 체류 시간을 분석합니다", "benchmarks": {"low": 10, "medium": 30, "high": 50}, "actionableInsights": ["피크 시간대 밀집 → 추가 인력 배치", "특정 구역 방문 저조 → 동선 유도 또는 시인성 개선", "체류 시간 짧음 → 구역 매력도 점검"]}'::jsonb,
 true
),

-- 6. 프로모션 효과
('promotion_effectiveness', '프로모션 효과', 'metric',
 '프로모션 기간 매출 변화',
 ARRAY['Promotion', 'Product', 'Transaction'],
 ARRAY['HAS_PROMOTION', 'CONTAINS_ITEM'],
 '{"type": "time_series", "query": "SELECT promo_name, SUM(sales_during) as promo_sales, SUM(sales_before) as baseline_sales, (SUM(sales_during) - SUM(sales_before))::numeric / NULLIF(SUM(sales_before), 0) as lift FROM promo_performance GROUP BY promo_name", "parameters": {"comparison_period": 14}}'::jsonb,
 '{"description": "프로모션이 매출에 미친 영향을 분석합니다", "benchmarks": {"low": 10, "medium": 30, "high": 50}, "actionableInsights": ["Lift 10% 미만 → 프로모션 조건 재검토", "Lift 50% 초과 → 유사 프로모션 반복 고려", "특정 상품군 Lift 높음 → 해당 카테고리 집중 프로모션"]}'::jsonb,
 true
),

-- 7. 재주문점
('reorder_point', '재주문점', 'rule',
 '재고 재주문 기준점',
 ARRAY['Product', 'Inventory', 'Supplier'],
 ARRAY['IN_STOCK', 'SUPPLIED_BY'],
 '{"type": "aggregation", "query": "SELECT product_name, current_stock, reorder_point, lead_time_days, CASE WHEN current_stock <= reorder_point THEN true ELSE false END as needs_reorder FROM inventory_levels", "parameters": {"safety_stock_days": 7}}'::jsonb,
 '{"description": "안전재고 기반 재주문 트리거를 관리합니다", "benchmarks": {"low": 0, "medium": 0.5, "high": 1}, "actionableInsights": ["재주문점 도달 → 즉시 발주 진행", "리드타임 긴 상품 → 재주문점 상향 조정", "수요 변동 큰 상품 → 안전재고 확대"]}'::jsonb,
 true
),

-- 8. 인력 배치
('staff_allocation', '인력 배치', 'rule',
 '수요 기반 인력 배치',
 ARRAY['Zone', 'Staff', 'Shift'],
 ARRAY['WORKS_AT', 'ASSIGNED_TO'],
 '{"type": "aggregation", "query": "SELECT zone_name, hour, AVG(visitors) as avg_visitors, CEIL(AVG(visitors) / 15.0) as recommended_staff FROM hourly_traffic GROUP BY zone_name, hour", "parameters": {"visitors_per_staff": 15}}'::jsonb,
 '{"description": "시간대별 예상 방문자 수 기반 필요 인력을 산출합니다", "benchmarks": {"low": 10, "medium": 20, "high": 30}, "actionableInsights": ["피크 시간대 인력 부족 → 시프트 조정 또는 추가 채용", "비피크 시간대 인력 과잉 → 교육/정리 업무 배정", "구역별 편차 큼 → 유동적 배치 전략 수립"]}'::jsonb,
 true
)
ON CONFLICT (user_id, name) DO UPDATE SET
  display_name = EXCLUDED.display_name,
  description = EXCLUDED.description,
  involved_entity_types = EXCLUDED.involved_entity_types,
  involved_relation_types = EXCLUDED.involved_relation_types,
  computation = EXCLUDED.computation,
  ai_context = EXCLUDED.ai_context,
  updated_at = NOW();
