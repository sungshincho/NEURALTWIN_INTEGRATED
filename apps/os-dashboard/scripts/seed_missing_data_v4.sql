-- ============================================================================
-- NEURALTWIN 추가 시딩 데이터 v4.0 - Option A (데모/테스트용)
-- ============================================================================
-- 기존 시딩된 데이터 유지 + 누락된 원천 데이터 추가
-- 실행 순서: 1. dashboard_kpis → 2. store_goals → 3. holidays_events
--           → 4. weather_data → 5. staff
-- ============================================================================

-- ============================================================================
-- STEP 1: dashboard_kpis (daily_kpis_agg에서 복사)
-- ============================================================================
-- ROI 측정 기능에서 사용하는 KPI 스냅샷 테이블

DO $$
DECLARE
  v_store_id UUID := 'd9830554-2688-4032-af40-acccda787ac4';
  v_count INT;
BEGIN
  -- 기존 데이터 확인
  SELECT COUNT(*) INTO v_count FROM dashboard_kpis WHERE store_id = v_store_id;

  IF v_count = 0 THEN
    -- daily_kpis_agg에서 dashboard_kpis로 복사
    INSERT INTO dashboard_kpis (
      id, store_id, org_id, date,
      total_revenue, total_visits, total_purchases, conversion_rate,
      funnel_entry, funnel_browse, funnel_fitting, funnel_purchase,
      created_at, updated_at
    )
    SELECT
      gen_random_uuid(),
      store_id,
      org_id,
      date,
      total_revenue,
      total_visitors,  -- total_visits로 매핑
      total_transactions,  -- total_purchases로 매핑
      conversion_rate,
      total_visitors,  -- funnel_entry = 방문자 수
      FLOOR(total_visitors * 0.75),  -- funnel_browse = 75%
      FLOOR(total_visitors * 0.35),  -- funnel_fitting = 35%
      total_transactions,  -- funnel_purchase = 구매 수
      NOW(),
      NOW()
    FROM daily_kpis_agg
    WHERE store_id = v_store_id;

    GET DIAGNOSTICS v_count = ROW_COUNT;
    RAISE NOTICE 'Step 1 완료: dashboard_kpis %건 복사됨', v_count;
  ELSE
    RAISE NOTICE 'Step 1 스킵: dashboard_kpis 이미 %건 존재', v_count;
  END IF;
END $$;


-- ============================================================================
-- STEP 2: store_goals (목표 설정 - 4개)
-- ============================================================================
-- 인사이트 허브 "목표 달성률" 위젯에서 사용

DO $$
DECLARE
  v_store_id UUID := 'd9830554-2688-4032-af40-acccda787ac4';
  v_user_id UUID;
  v_org_id UUID;
  v_month_start DATE;
  v_month_end DATE;
  v_week_start DATE;
  v_week_end DATE;
BEGIN
  SELECT user_id, org_id INTO v_user_id, v_org_id FROM stores WHERE id = v_store_id;

  -- 현재 월/주 계산
  v_month_start := DATE_TRUNC('month', CURRENT_DATE)::DATE;
  v_month_end := (DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month' - INTERVAL '1 day')::DATE;
  v_week_start := DATE_TRUNC('week', CURRENT_DATE)::DATE;
  v_week_end := (DATE_TRUNC('week', CURRENT_DATE) + INTERVAL '6 days')::DATE;

  -- store_goals 테이블 구조 확인 후 삽입
  INSERT INTO store_goals (
    id, org_id, store_id, goal_type, period_type,
    period_start, period_end, target_value,
    created_by, is_active, created_at, updated_at
  ) VALUES
  -- 월간 매출 목표: 1억원
  (
    gen_random_uuid(), v_org_id, v_store_id, 'revenue', 'monthly',
    v_month_start, v_month_end, 100000000,
    v_user_id, true, NOW(), NOW()
  ),
  -- 월간 방문자 목표: 5,000명
  (
    gen_random_uuid(), v_org_id, v_store_id, 'visitors', 'monthly',
    v_month_start, v_month_end, 5000,
    v_user_id, true, NOW(), NOW()
  ),
  -- 주간 전환율 목표: 15%
  (
    gen_random_uuid(), v_org_id, v_store_id, 'conversion', 'weekly',
    v_week_start, v_week_end, 15,
    v_user_id, true, NOW(), NOW()
  ),
  -- 월간 객단가 목표: 250,000원
  (
    gen_random_uuid(), v_org_id, v_store_id, 'avg_basket', 'monthly',
    v_month_start, v_month_end, 250000,
    v_user_id, true, NOW(), NOW()
  )
  ON CONFLICT DO NOTHING;

  RAISE NOTICE 'Step 2 완료: store_goals 4건 생성됨';
END $$;


-- ============================================================================
-- STEP 3: holidays_events (공휴일/이벤트 - 30개)
-- ============================================================================
-- 히트맵/수요예측에서 외부 요인 분석에 사용

DO $$
DECLARE
  v_store_id UUID := 'd9830554-2688-4032-af40-acccda787ac4';
  v_user_id UUID;
  v_org_id UUID;
BEGIN
  SELECT user_id, org_id INTO v_user_id, v_org_id FROM stores WHERE id = v_store_id;

  INSERT INTO holidays_events (
    id, store_id, user_id, org_id, date, event_name, event_type,
    description, impact_level, created_at
  ) VALUES
  -- 2024년 12월 공휴일/이벤트
  (gen_random_uuid(), v_store_id, v_user_id, v_org_id, '2024-12-25', '크리스마스', 'holiday', '성탄절', 'high', NOW()),
  (gen_random_uuid(), v_store_id, v_user_id, v_org_id, '2024-12-31', '연말', 'holiday', '송년', 'high', NOW()),
  (gen_random_uuid(), v_store_id, v_user_id, v_org_id, '2024-12-20', '연말 세일', 'promotion', '연말 특별 할인', 'high', NOW()),
  (gen_random_uuid(), v_store_id, v_user_id, v_org_id, '2024-12-24', '크리스마스 이브', 'holiday', '크리스마스 전날', 'medium', NOW()),

  -- 2024년 11월 이벤트
  (gen_random_uuid(), v_store_id, v_user_id, v_org_id, '2024-11-11', '빼빼로데이', 'promotion', '11월 11일 특별 이벤트', 'medium', NOW()),
  (gen_random_uuid(), v_store_id, v_user_id, v_org_id, '2024-11-22', '블랙프라이데이', 'promotion', '대규모 할인 행사', 'high', NOW()),
  (gen_random_uuid(), v_store_id, v_user_id, v_org_id, '2024-11-25', '사이버먼데이', 'promotion', '온라인 연계 할인', 'medium', NOW()),

  -- 2024년 10월 이벤트
  (gen_random_uuid(), v_store_id, v_user_id, v_org_id, '2024-10-03', '개천절', 'holiday', '국경일', 'low', NOW()),
  (gen_random_uuid(), v_store_id, v_user_id, v_org_id, '2024-10-09', '한글날', 'holiday', '국경일', 'low', NOW()),
  (gen_random_uuid(), v_store_id, v_user_id, v_org_id, '2024-10-15', '가을 시즌 오픈', 'season', 'F/W 시즌 상품 출시', 'medium', NOW()),
  (gen_random_uuid(), v_store_id, v_user_id, v_org_id, '2024-10-31', '할로윈', 'promotion', '할로윈 특별 이벤트', 'medium', NOW()),

  -- 2024년 9월 이벤트
  (gen_random_uuid(), v_store_id, v_user_id, v_org_id, '2024-09-16', '추석 연휴', 'holiday', '추석 (음력 8월 15일)', 'high', NOW()),
  (gen_random_uuid(), v_store_id, v_user_id, v_org_id, '2024-09-17', '추석', 'holiday', '추석 당일', 'high', NOW()),
  (gen_random_uuid(), v_store_id, v_user_id, v_org_id, '2024-09-18', '추석 연휴', 'holiday', '추석 다음날', 'high', NOW()),
  (gen_random_uuid(), v_store_id, v_user_id, v_org_id, '2024-09-01', '가을 신상품', 'season', '가을 컬렉션 출시', 'medium', NOW()),

  -- 2025년 1월 이벤트 (미래)
  (gen_random_uuid(), v_store_id, v_user_id, v_org_id, '2025-01-01', '신정', 'holiday', '새해 첫날', 'high', NOW()),
  (gen_random_uuid(), v_store_id, v_user_id, v_org_id, '2025-01-02', '신년 세일', 'promotion', '새해 특별 할인', 'high', NOW()),
  (gen_random_uuid(), v_store_id, v_user_id, v_org_id, '2025-01-15', 'S/S 프리뷰', 'season', '봄 시즌 프리뷰', 'medium', NOW()),
  (gen_random_uuid(), v_store_id, v_user_id, v_org_id, '2025-01-28', '설날 연휴', 'holiday', '설날 전날', 'high', NOW()),
  (gen_random_uuid(), v_store_id, v_user_id, v_org_id, '2025-01-29', '설날', 'holiday', '설날 당일', 'high', NOW()),
  (gen_random_uuid(), v_store_id, v_user_id, v_org_id, '2025-01-30', '설날 연휴', 'holiday', '설날 다음날', 'high', NOW()),

  -- 정기 이벤트
  (gen_random_uuid(), v_store_id, v_user_id, v_org_id, '2024-12-01', '멤버십 데이', 'promotion', '월간 VIP 특별 혜택', 'medium', NOW()),
  (gen_random_uuid(), v_store_id, v_user_id, v_org_id, '2024-11-01', '멤버십 데이', 'promotion', '월간 VIP 특별 혜택', 'medium', NOW()),
  (gen_random_uuid(), v_store_id, v_user_id, v_org_id, '2024-10-01', '멤버십 데이', 'promotion', '월간 VIP 특별 혜택', 'medium', NOW()),
  (gen_random_uuid(), v_store_id, v_user_id, v_org_id, '2024-09-02', '멤버십 데이', 'promotion', '월간 VIP 특별 혜택', 'medium', NOW()),

  -- 기타 이벤트
  (gen_random_uuid(), v_store_id, v_user_id, v_org_id, '2024-12-14', '주말 특가', 'promotion', '주말 한정 특가', 'low', NOW()),
  (gen_random_uuid(), v_store_id, v_user_id, v_org_id, '2024-12-07', '주말 특가', 'promotion', '주말 한정 특가', 'low', NOW()),
  (gen_random_uuid(), v_store_id, v_user_id, v_org_id, '2024-11-30', '주말 특가', 'promotion', '주말 한정 특가', 'low', NOW()),
  (gen_random_uuid(), v_store_id, v_user_id, v_org_id, '2024-11-16', '주말 특가', 'promotion', '주말 한정 특가', 'low', NOW()),
  (gen_random_uuid(), v_store_id, v_user_id, v_org_id, '2024-10-26', '주말 특가', 'promotion', '주말 한정 특가', 'low', NOW())
  ON CONFLICT DO NOTHING;

  RAISE NOTICE 'Step 3 완료: holidays_events 30건 생성됨';
END $$;


-- ============================================================================
-- STEP 4: weather_data (날씨 데이터 - 90일)
-- ============================================================================
-- 히트맵/수요예측에서 환경 요인 분석에 사용

DO $$
DECLARE
  v_store_id UUID := 'd9830554-2688-4032-af40-acccda787ac4';
  v_user_id UUID;
  v_org_id UUID;
  v_date DATE;
  v_temp NUMERIC;
  v_condition TEXT;
  v_conditions TEXT[] := ARRAY['sunny', 'cloudy', 'rainy', 'snowy', 'foggy'];
  v_count INT;
BEGIN
  SELECT user_id, org_id INTO v_user_id, v_org_id FROM stores WHERE id = v_store_id;

  -- 기존 데이터 확인
  SELECT COUNT(*) INTO v_count FROM weather_data WHERE store_id = v_store_id;

  IF v_count < 90 THEN
    -- 90일치 날씨 데이터 생성
    FOR day_offset IN 0..89 LOOP
      v_date := CURRENT_DATE - day_offset;

      -- 계절에 따른 온도 설정
      v_temp := CASE
        WHEN EXTRACT(MONTH FROM v_date) IN (12, 1, 2) THEN -5 + FLOOR(RANDOM() * 10)  -- 겨울: -5 ~ 5
        WHEN EXTRACT(MONTH FROM v_date) IN (3, 4, 5) THEN 10 + FLOOR(RANDOM() * 15)   -- 봄: 10 ~ 25
        WHEN EXTRACT(MONTH FROM v_date) IN (6, 7, 8) THEN 25 + FLOOR(RANDOM() * 10)   -- 여름: 25 ~ 35
        ELSE 10 + FLOOR(RANDOM() * 15)  -- 가을: 10 ~ 25
      END;

      -- 날씨 조건 (계절 반영)
      v_condition := CASE
        WHEN EXTRACT(MONTH FROM v_date) IN (12, 1, 2) AND RANDOM() < 0.2 THEN 'snowy'
        WHEN EXTRACT(MONTH FROM v_date) IN (6, 7, 8) AND RANDOM() < 0.3 THEN 'rainy'
        WHEN RANDOM() < 0.6 THEN 'sunny'
        WHEN RANDOM() < 0.8 THEN 'cloudy'
        ELSE 'rainy'
      END;

      INSERT INTO weather_data (
        id, store_id, user_id, org_id, date,
        temperature, weather_condition, precipitation, humidity,
        created_at
      ) VALUES (
        gen_random_uuid(), v_store_id, v_user_id, v_org_id, v_date,
        v_temp,
        v_condition,
        CASE v_condition
          WHEN 'rainy' THEN 5 + FLOOR(RANDOM() * 30)
          WHEN 'snowy' THEN 2 + FLOOR(RANDOM() * 15)
          ELSE FLOOR(RANDOM() * 5)
        END,
        CASE v_condition
          WHEN 'rainy' THEN 70 + FLOOR(RANDOM() * 25)
          WHEN 'snowy' THEN 60 + FLOOR(RANDOM() * 30)
          WHEN 'sunny' THEN 30 + FLOOR(RANDOM() * 30)
          ELSE 50 + FLOOR(RANDOM() * 30)
        END,
        NOW()
      )
      ON CONFLICT DO NOTHING;
    END LOOP;

    RAISE NOTICE 'Step 4 완료: weather_data 90일치 생성됨';
  ELSE
    RAISE NOTICE 'Step 4 스킵: weather_data 이미 %건 존재', v_count;
  END IF;
END $$;


-- ============================================================================
-- STEP 5: staff (직원 데이터 - 5명)
-- ============================================================================
-- 인력 시뮬레이션 기능에서 사용

DO $$
DECLARE
  v_store_id UUID := 'd9830554-2688-4032-af40-acccda787ac4';
  v_user_id UUID;
  v_org_id UUID;
BEGIN
  SELECT user_id, org_id INTO v_user_id, v_org_id FROM stores WHERE id = v_store_id;

  INSERT INTO staff (
    id, store_id, user_id, org_id, staff_name, role,
    hire_date, hourly_rate, is_active, created_at
  ) VALUES
  -- 매니저
  (
    gen_random_uuid(), v_store_id, v_user_id, v_org_id,
    '김민준', 'manager',
    '2022-03-15', 25000, true, NOW()
  ),
  -- 시니어 스태프
  (
    gen_random_uuid(), v_store_id, v_user_id, v_org_id,
    '이서연', 'senior_staff',
    '2022-08-01', 18000, true, NOW()
  ),
  -- 스태프
  (
    gen_random_uuid(), v_store_id, v_user_id, v_org_id,
    '박지호', 'staff',
    '2023-02-20', 15000, true, NOW()
  ),
  (
    gen_random_uuid(), v_store_id, v_user_id, v_org_id,
    '최예은', 'staff',
    '2023-06-10', 15000, true, NOW()
  ),
  -- 파트타임
  (
    gen_random_uuid(), v_store_id, v_user_id, v_org_id,
    '정하윤', 'part_time',
    '2024-01-05', 12000, true, NOW()
  )
  ON CONFLICT DO NOTHING;

  RAISE NOTICE 'Step 5 완료: staff 5명 생성됨';
END $$;


-- ============================================================================
-- 검증 쿼리
-- ============================================================================

SELECT '========== 시딩 결과 검증 ==========' as info;

SELECT 'dashboard_kpis' as table_name, COUNT(*) as count
FROM dashboard_kpis WHERE store_id = 'd9830554-2688-4032-af40-acccda787ac4'
UNION ALL
SELECT 'store_goals', COUNT(*)
FROM store_goals WHERE store_id = 'd9830554-2688-4032-af40-acccda787ac4'
UNION ALL
SELECT 'holidays_events', COUNT(*)
FROM holidays_events WHERE store_id = 'd9830554-2688-4032-af40-acccda787ac4'
UNION ALL
SELECT 'weather_data', COUNT(*)
FROM weather_data WHERE store_id = 'd9830554-2688-4032-af40-acccda787ac4'
UNION ALL
SELECT 'staff', COUNT(*)
FROM staff WHERE store_id = 'd9830554-2688-4032-af40-acccda787ac4';

SELECT '========== 시딩 완료 ==========' as info;
