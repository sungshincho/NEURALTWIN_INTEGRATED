-- L3 테이블 데이터 삭제
DELETE FROM daily_kpis_agg;
DELETE FROM hourly_metrics;
DELETE FROM zone_daily_metrics;
DELETE FROM customer_segments_agg;
DELETE FROM product_performance_agg;

-- L2 테이블 데이터 삭제
DELETE FROM line_items;
DELETE FROM funnel_events;
DELETE FROM zone_events;
DELETE FROM visit_zone_events;

-- L1/Raw 테이블 데이터 삭제
DELETE FROM raw_imports;

-- 기본 데이터 테이블 삭제 (외래키 순서 고려)
DELETE FROM purchases;
DELETE FROM visits;
DELETE FROM wifi_tracking;
DELETE FROM customers;
DELETE FROM products;