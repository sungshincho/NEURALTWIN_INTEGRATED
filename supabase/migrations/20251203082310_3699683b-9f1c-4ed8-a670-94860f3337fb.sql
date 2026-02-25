
-- dashboard_kpis에서 org_id가 NULL인 레코드 수정
UPDATE dashboard_kpis 
SET org_id = '0c6076e3-a993-4022-9b40-0f4e4370f8ef'
WHERE user_id = 'e4200130-08e8-47da-8c92-3d0b90fafd77'
AND org_id IS NULL;

-- daily_sales 시딩 (대시보드 트렌드 차트용)
INSERT INTO daily_sales (date, store_id, org_id, total_revenue, total_transactions, avg_transaction_value, total_customers)
VALUES 
  ('2025-12-01', '9a382eaf-f12b-48b3-838e-21dc03ed979e', '0c6076e3-a993-4022-9b40-0f4e4370f8ef', 2450000, 35, 70000, 120),
  ('2025-12-02', '9a382eaf-f12b-48b3-838e-21dc03ed979e', '0c6076e3-a993-4022-9b40-0f4e4370f8ef', 2680000, 42, 63800, 145),
  ('2025-12-01', '99a1b0e5-d82f-4294-a99c-fa782ad61348', '0c6076e3-a993-4022-9b40-0f4e4370f8ef', 1850000, 28, 66071, 95),
  ('2025-12-02', '99a1b0e5-d82f-4294-a99c-fa782ad61348', '0c6076e3-a993-4022-9b40-0f4e4370f8ef', 2150000, 33, 65151, 112)
ON CONFLICT DO NOTHING;

-- customer_segments 시딩 (고객 분석용)
INSERT INTO customer_segments (segment_code, segment_name, description, store_id, org_id, customer_count, avg_purchase_frequency, avg_ltv, is_active)
VALUES 
  ('VIP', 'VIP 고객', '월 3회 이상 구매, 평균 구매액 10만원 이상', '9a382eaf-f12b-48b3-838e-21dc03ed979e', '0c6076e3-a993-4022-9b40-0f4e4370f8ef', 45, 3.5, 850000, true),
  ('REGULAR', '일반 고객', '월 1-2회 구매', '9a382eaf-f12b-48b3-838e-21dc03ed979e', '0c6076e3-a993-4022-9b40-0f4e4370f8ef', 280, 1.8, 320000, true),
  ('NEW', '신규 고객', '최근 30일 내 첫 구매', '9a382eaf-f12b-48b3-838e-21dc03ed979e', '0c6076e3-a993-4022-9b40-0f4e4370f8ef', 85, 1.0, 75000, true),
  ('DORMANT', '휴면 고객', '60일 이상 구매 없음', '9a382eaf-f12b-48b3-838e-21dc03ed979e', '0c6076e3-a993-4022-9b40-0f4e4370f8ef', 120, 0.2, 180000, true),
  ('VIP', 'VIP 고객', '월 3회 이상 구매', '99a1b0e5-d82f-4294-a99c-fa782ad61348', '0c6076e3-a993-4022-9b40-0f4e4370f8ef', 32, 3.2, 720000, true),
  ('REGULAR', '일반 고객', '월 1-2회 구매', '99a1b0e5-d82f-4294-a99c-fa782ad61348', '0c6076e3-a993-4022-9b40-0f4e4370f8ef', 195, 1.6, 280000, true)
ON CONFLICT DO NOTHING;

-- funnel_metrics 시딩 (퍼널 분석용)
INSERT INTO funnel_metrics (user_id, date, stage, count, store_id, org_id, duration_seconds)
VALUES 
  ('e4200130-08e8-47da-8c92-3d0b90fafd77', '2025-12-01', 'entry', 450, '9a382eaf-f12b-48b3-838e-21dc03ed979e', '0c6076e3-a993-4022-9b40-0f4e4370f8ef', NULL),
  ('e4200130-08e8-47da-8c92-3d0b90fafd77', '2025-12-01', 'browse', 320, '9a382eaf-f12b-48b3-838e-21dc03ed979e', '0c6076e3-a993-4022-9b40-0f4e4370f8ef', 180),
  ('e4200130-08e8-47da-8c92-3d0b90fafd77', '2025-12-01', 'fitting', 85, '9a382eaf-f12b-48b3-838e-21dc03ed979e', '0c6076e3-a993-4022-9b40-0f4e4370f8ef', 420),
  ('e4200130-08e8-47da-8c92-3d0b90fafd77', '2025-12-01', 'purchase', 35, '9a382eaf-f12b-48b3-838e-21dc03ed979e', '0c6076e3-a993-4022-9b40-0f4e4370f8ef', 240),
  ('e4200130-08e8-47da-8c92-3d0b90fafd77', '2025-12-01', 'return', 12, '9a382eaf-f12b-48b3-838e-21dc03ed979e', '0c6076e3-a993-4022-9b40-0f4e4370f8ef', NULL),
  ('e4200130-08e8-47da-8c92-3d0b90fafd77', '2025-12-02', 'entry', 520, '9a382eaf-f12b-48b3-838e-21dc03ed979e', '0c6076e3-a993-4022-9b40-0f4e4370f8ef', NULL),
  ('e4200130-08e8-47da-8c92-3d0b90fafd77', '2025-12-02', 'browse', 380, '9a382eaf-f12b-48b3-838e-21dc03ed979e', '0c6076e3-a993-4022-9b40-0f4e4370f8ef', 195),
  ('e4200130-08e8-47da-8c92-3d0b90fafd77', '2025-12-02', 'fitting', 102, '9a382eaf-f12b-48b3-838e-21dc03ed979e', '0c6076e3-a993-4022-9b40-0f4e4370f8ef', 450),
  ('e4200130-08e8-47da-8c92-3d0b90fafd77', '2025-12-02', 'purchase', 42, '9a382eaf-f12b-48b3-838e-21dc03ed979e', '0c6076e3-a993-4022-9b40-0f4e4370f8ef', 260),
  ('e4200130-08e8-47da-8c92-3d0b90fafd77', '2025-12-02', 'return', 15, '9a382eaf-f12b-48b3-838e-21dc03ed979e', '0c6076e3-a993-4022-9b40-0f4e4370f8ef', NULL),
  ('e4200130-08e8-47da-8c92-3d0b90fafd77', '2025-12-01', 'entry', 380, '99a1b0e5-d82f-4294-a99c-fa782ad61348', '0c6076e3-a993-4022-9b40-0f4e4370f8ef', NULL),
  ('e4200130-08e8-47da-8c92-3d0b90fafd77', '2025-12-01', 'browse', 260, '99a1b0e5-d82f-4294-a99c-fa782ad61348', '0c6076e3-a993-4022-9b40-0f4e4370f8ef', 165),
  ('e4200130-08e8-47da-8c92-3d0b90fafd77', '2025-12-01', 'fitting', 72, '99a1b0e5-d82f-4294-a99c-fa782ad61348', '0c6076e3-a993-4022-9b40-0f4e4370f8ef', 380),
  ('e4200130-08e8-47da-8c92-3d0b90fafd77', '2025-12-01', 'purchase', 28, '99a1b0e5-d82f-4294-a99c-fa782ad61348', '0c6076e3-a993-4022-9b40-0f4e4370f8ef', 220),
  ('e4200130-08e8-47da-8c92-3d0b90fafd77', '2025-12-01', 'return', 8, '99a1b0e5-d82f-4294-a99c-fa782ad61348', '0c6076e3-a993-4022-9b40-0f4e4370f8ef', NULL);

-- ai_recommendations 시딩 (AI 추천 카드용)
INSERT INTO ai_recommendations (user_id, store_id, org_id, title, description, recommendation_type, priority, status, evidence, expected_impact, data_source, action_category)
VALUES 
  ('e4200130-08e8-47da-8c92-3d0b90fafd77', '9a382eaf-f12b-48b3-838e-21dc03ed979e', '0c6076e3-a993-4022-9b40-0f4e4370f8ef',
   '피팅룸 전환율 개선 필요', 
   '피팅룸 이용 고객 중 구매 전환율이 41%로 업계 평균(55%) 대비 낮습니다. 피팅룸 조명 개선과 직원 응대 강화를 권장합니다.',
   'conversion', 'high', 'pending',
   '{"fitting_conversion": 41, "industry_avg": 55, "gap": -14}'::jsonb,
   '{"revenue_increase": "12-15%", "conversion_improvement": "+8%"}'::jsonb,
   'funnel_metrics', 'staffing'),
  ('e4200130-08e8-47da-8c92-3d0b90fafd77', '9a382eaf-f12b-48b3-838e-21dc03ed979e', '0c6076e3-a993-4022-9b40-0f4e4370f8ef',
   '주말 오후 피크타임 인력 보강', 
   '토요일 14:00-17:00 시간대 방문자 대비 직원 비율이 부족합니다. 해당 시간대 1-2명 추가 배치를 권장합니다.',
   'staffing', 'medium', 'pending',
   '{"peak_visitors": 85, "current_staff": 3, "recommended_staff": 5}'::jsonb,
   '{"service_improvement": "+25%", "customer_satisfaction": "+15%"}'::jsonb,
   'visitor_patterns', 'staffing'),
  ('e4200130-08e8-47da-8c92-3d0b90fafd77', '99a1b0e5-d82f-4294-a99c-fa782ad61348', '0c6076e3-a993-4022-9b40-0f4e4370f8ef',
   '겨울 아우터 재고 확보 권장', 
   '현재 겨울 아우터 재고가 2주 내 소진 예상됩니다. 수요 예측 기반 추가 발주를 권장합니다.',
   'inventory', 'high', 'pending',
   '{"current_stock": 45, "weekly_sales": 22, "weeks_remaining": 2}'::jsonb,
   '{"stockout_prevention": "100%", "revenue_protection": "₩4,500,000"}'::jsonb,
   'inventory_analysis', 'inventory');

-- daily_kpis_agg 시딩 (L3 집계 데이터)
INSERT INTO daily_kpis_agg (date, store_id, org_id, total_visitors, unique_visitors, returning_visitors, total_transactions, total_revenue, avg_transaction_value, conversion_rate, avg_visit_duration_seconds, sales_per_sqm, weather_condition, is_holiday)
VALUES 
  ('2025-12-01', '9a382eaf-f12b-48b3-838e-21dc03ed979e', '0c6076e3-a993-4022-9b40-0f4e4370f8ef', 450, 380, 70, 35, 2450000, 70000, 7.8, 420, 24500, 'sunny', false),
  ('2025-12-02', '9a382eaf-f12b-48b3-838e-21dc03ed979e', '0c6076e3-a993-4022-9b40-0f4e4370f8ef', 520, 440, 80, 42, 2680000, 63800, 8.1, 395, 26800, 'cloudy', false),
  ('2025-12-01', '99a1b0e5-d82f-4294-a99c-fa782ad61348', '0c6076e3-a993-4022-9b40-0f4e4370f8ef', 380, 320, 60, 28, 1850000, 66071, 7.4, 380, 23125, 'sunny', false),
  ('2025-12-02', '99a1b0e5-d82f-4294-a99c-fa782ad61348', '0c6076e3-a993-4022-9b40-0f4e4370f8ef', 420, 355, 65, 33, 2150000, 65151, 7.9, 405, 26875, 'cloudy', false);
