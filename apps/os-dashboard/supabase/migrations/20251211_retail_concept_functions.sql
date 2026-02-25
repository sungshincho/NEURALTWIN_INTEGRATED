-- ============================================================================
-- 리테일 개념 계산 RPC 함수
-- 버전: 1.1 (실제 스키마 반영)
-- 작성일: 2025-12-11
-- 수정일: 2025-12-12
--
-- 사용 테이블:
-- - zones_dim: 구역 정의
-- - zone_events: 구역 이벤트 (enter, exit, dwell)
-- - zone_daily_metrics: 구역 일별 집계
-- - store_visits: 매장 방문
-- - daily_kpis_agg: 일별 KPI 집계
-- - graph_entities: 온톨로지 엔티티 (상품 등)
-- - graph_relations: 온톨로지 관계
-- ============================================================================

-- 1. 구역 전환 퍼널 계산 (zones_dim + zone_daily_metrics 사용)
-- 각 구역의 방문자 수, 평균 체류 시간, 전환율을 계산
CREATE OR REPLACE FUNCTION compute_zone_conversion_funnel(
  p_store_id UUID,
  p_days INT DEFAULT 30
)
RETURNS TABLE (
  zone_name TEXT,
  visitors BIGINT,
  avg_dwell NUMERIC,
  purchases BIGINT,
  conversion_rate NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  -- zones_dim + zone_daily_metrics 우선 사용
  WITH zone_metrics AS (
    SELECT
      zd.zone_name,
      COALESCE(SUM(zdm.unique_visitors), 0)::BIGINT as total_visitors,
      COALESCE(AVG(zdm.avg_dwell_seconds), 0)::NUMERIC as avg_dwell_seconds,
      COALESCE(SUM(zdm.conversion_count), 0)::BIGINT as total_conversions
    FROM zones_dim zd
    LEFT JOIN zone_daily_metrics zdm ON zd.id = zdm.zone_id
      AND zdm.date >= CURRENT_DATE - p_days
    WHERE zd.store_id = p_store_id
      AND zd.is_active = true
    GROUP BY zd.zone_name
  )
  SELECT
    zm.zone_name::TEXT,
    zm.total_visitors as visitors,
    ROUND(zm.avg_dwell_seconds, 1) as avg_dwell,
    zm.total_conversions as purchases,
    CASE
      WHEN zm.total_visitors > 0
      THEN ROUND(zm.total_conversions::NUMERIC / zm.total_visitors * 100, 2)
      ELSE 0
    END::NUMERIC as conversion_rate
  FROM zone_metrics zm
  ORDER BY zm.total_visitors DESC;

  -- 데이터가 없으면 graph_entities 폴백
  IF NOT FOUND THEN
    RETURN QUERY
    WITH zone_data AS (
      SELECT
        ge.label as zone_label,
        ge.id as zone_entity_id
      FROM graph_entities ge
      JOIN ontology_entity_types oet ON ge.entity_type_id = oet.id
      WHERE ge.store_id = p_store_id
        AND LOWER(oet.name) IN ('zone', 'area')
    ),
    visit_data AS (
      SELECT
        gr.target_entity_id,
        gr.source_entity_id,
        (gr.properties->>'dwell_seconds')::NUMERIC as dwell_seconds
      FROM graph_relations gr
      JOIN ontology_relation_types ort ON gr.relation_type_id = ort.id
      WHERE gr.store_id = p_store_id
        AND LOWER(ort.name) IN ('visited', 'entered_zone')
        AND gr.created_at >= NOW() - (p_days || ' days')::INTERVAL
    ),
    purchase_data AS (
      SELECT DISTINCT gr.source_entity_id as customer_id
      FROM graph_relations gr
      JOIN ontology_relation_types ort ON gr.relation_type_id = ort.id
      WHERE gr.store_id = p_store_id
        AND LOWER(ort.name) IN ('purchased', 'made_transaction')
        AND gr.created_at >= NOW() - (p_days || ' days')::INTERVAL
    )
    SELECT
      zd.zone_label::TEXT as zone_name,
      COUNT(DISTINCT vd.source_entity_id)::BIGINT as visitors,
      COALESCE(ROUND(AVG(vd.dwell_seconds), 1), 0)::NUMERIC as avg_dwell,
      COUNT(DISTINCT pd.customer_id)::BIGINT as purchases,
      COALESCE(
        ROUND(COUNT(DISTINCT pd.customer_id)::NUMERIC / NULLIF(COUNT(DISTINCT vd.source_entity_id), 0) * 100, 2),
        0
      )::NUMERIC as conversion_rate
    FROM zone_data zd
    LEFT JOIN visit_data vd ON zd.zone_entity_id = vd.target_entity_id
    LEFT JOIN purchase_data pd ON vd.source_entity_id = pd.customer_id
    GROUP BY zd.zone_label
    ORDER BY visitors DESC;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. 교차 판매 친화도 계산 (graph_entities + graph_relations 사용)
-- 함께 구매되는 상품 조합과 지지도를 계산
CREATE OR REPLACE FUNCTION compute_cross_sell_affinity(
  p_store_id UUID,
  p_min_support INT DEFAULT 3
)
RETURNS TABLE (
  product_a TEXT,
  product_b TEXT,
  co_purchase_count BIGINT,
  support NUMERIC
) AS $$
DECLARE
  total_tx BIGINT;
BEGIN
  -- 총 거래 수 계산
  SELECT COUNT(DISTINCT ge.id) INTO total_tx
  FROM graph_entities ge
  JOIN ontology_entity_types oet ON ge.entity_type_id = oet.id
  WHERE ge.store_id = p_store_id
    AND LOWER(oet.name) IN ('transaction', 'order');

  IF total_tx = 0 THEN
    -- store_visits에서 구매 건수 조회
    SELECT COUNT(*) INTO total_tx
    FROM store_visits
    WHERE store_id = p_store_id
      AND made_purchase = true
      AND visit_date >= NOW() - INTERVAL '30 days';
  END IF;

  RETURN QUERY
  WITH transaction_items AS (
    SELECT
      gr.source_entity_id as transaction_id,
      ge.id as product_id,
      ge.label as product_name
    FROM graph_relations gr
    JOIN graph_entities ge ON gr.target_entity_id = ge.id
    JOIN ontology_relation_types ort ON gr.relation_type_id = ort.id
    JOIN ontology_entity_types oet ON ge.entity_type_id = oet.id
    WHERE gr.store_id = p_store_id
      AND LOWER(ort.name) IN ('contains', 'has_item', 'purchased_product')
      AND LOWER(oet.name) IN ('product', 'item')
  )
  SELECT
    ti1.product_name::TEXT as product_a,
    ti2.product_name::TEXT as product_b,
    COUNT(*)::BIGINT as co_purchase_count,
    ROUND(COUNT(*)::NUMERIC / NULLIF(total_tx, 0), 4)::NUMERIC as support
  FROM transaction_items ti1
  JOIN transaction_items ti2
    ON ti1.transaction_id = ti2.transaction_id
    AND ti1.product_id < ti2.product_id
  GROUP BY ti1.product_name, ti2.product_name
  HAVING COUNT(*) >= p_min_support
  ORDER BY co_purchase_count DESC
  LIMIT 50;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. 재고 회전율 계산 (graph_entities 사용)
-- 각 상품의 판매량, 평균 재고, 회전율, 재고 일수를 계산
CREATE OR REPLACE FUNCTION compute_inventory_turnover(
  p_store_id UUID,
  p_days INT DEFAULT 30
)
RETURNS TABLE (
  product_name TEXT,
  total_sold BIGINT,
  avg_stock NUMERIC,
  turnover_rate NUMERIC,
  days_of_stock NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  WITH product_data AS (
    SELECT
      ge.id as product_id,
      ge.label as product_label,
      COALESCE((ge.properties->>'stock_quantity')::INT, 0) as current_stock
    FROM graph_entities ge
    JOIN ontology_entity_types oet ON ge.entity_type_id = oet.id
    WHERE ge.store_id = p_store_id
      AND LOWER(oet.name) IN ('product', 'item')
  ),
  sales_data AS (
    SELECT
      gr.target_entity_id as product_id,
      SUM(COALESCE((gr.properties->>'quantity')::INT, 1)) as quantity_sold
    FROM graph_relations gr
    JOIN ontology_relation_types ort ON gr.relation_type_id = ort.id
    WHERE gr.store_id = p_store_id
      AND LOWER(ort.name) IN ('contains', 'has_item', 'sold')
      AND gr.created_at >= NOW() - (p_days || ' days')::INTERVAL
    GROUP BY gr.target_entity_id
  )
  SELECT
    pd.product_label::TEXT as product_name,
    COALESCE(sd.quantity_sold, 0)::BIGINT as total_sold,
    pd.current_stock::NUMERIC as avg_stock,
    CASE
      WHEN pd.current_stock > 0 THEN ROUND(COALESCE(sd.quantity_sold, 0)::NUMERIC / pd.current_stock, 2)
      ELSE 0
    END::NUMERIC as turnover_rate,
    CASE
      WHEN COALESCE(sd.quantity_sold, 0) > 0
      THEN ROUND(pd.current_stock::NUMERIC / (sd.quantity_sold::NUMERIC / p_days), 1)
      ELSE 999
    END::NUMERIC as days_of_stock
  FROM product_data pd
  LEFT JOIN sales_data sd ON pd.product_id = sd.product_id
  ORDER BY turnover_rate DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. 구역 히트맵 계산 (zone_events 우선, graph_relations 폴백)
-- 각 구역의 시간대별 방문자 수와 평균 체류 시간을 계산
CREATE OR REPLACE FUNCTION compute_zone_heatmap(
  p_store_id UUID,
  p_days INT DEFAULT 7
)
RETURNS TABLE (
  zone_name TEXT,
  hour INT,
  visit_count BIGINT,
  avg_dwell NUMERIC
) AS $$
BEGIN
  -- zone_events 테이블 우선 사용
  RETURN QUERY
  SELECT
    zd.zone_name::TEXT,
    ze.event_hour as hour,
    COUNT(*)::BIGINT as visit_count,
    COALESCE(ROUND(AVG(ze.duration_seconds)::NUMERIC, 1), 0)::NUMERIC as avg_dwell
  FROM zones_dim zd
  JOIN zone_events ze ON zd.id = ze.zone_id
  WHERE zd.store_id = p_store_id
    AND ze.event_date >= CURRENT_DATE - p_days
    AND ze.event_type IN ('enter', 'dwell')
  GROUP BY zd.zone_name, ze.event_hour
  ORDER BY zd.zone_name, ze.event_hour;

  -- 데이터가 없으면 graph_relations 폴백
  IF NOT FOUND THEN
    RETURN QUERY
    WITH zone_data AS (
      SELECT ge.label as zone_label, ge.id as zone_entity_id
      FROM graph_entities ge
      JOIN ontology_entity_types oet ON ge.entity_type_id = oet.id
      WHERE ge.store_id = p_store_id
        AND LOWER(oet.name) IN ('zone', 'area')
    ),
    visit_data AS (
      SELECT
        gr.target_entity_id,
        EXTRACT(HOUR FROM gr.created_at)::INT as visit_hour,
        (gr.properties->>'dwell_seconds')::NUMERIC as dwell_seconds
      FROM graph_relations gr
      JOIN ontology_relation_types ort ON gr.relation_type_id = ort.id
      WHERE gr.store_id = p_store_id
        AND LOWER(ort.name) IN ('visited', 'entered_zone')
        AND gr.created_at >= NOW() - (p_days || ' days')::INTERVAL
    )
    SELECT
      zd.zone_label::TEXT as zone_name,
      vd.visit_hour as hour,
      COUNT(*)::BIGINT as visit_count,
      COALESCE(ROUND(AVG(vd.dwell_seconds), 1), 0)::NUMERIC as avg_dwell
    FROM zone_data zd
    JOIN visit_data vd ON zd.zone_entity_id = vd.target_entity_id
    GROUP BY zd.zone_label, vd.visit_hour
    ORDER BY zd.zone_label, vd.visit_hour;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. 일별 KPI 요약 조회 (daily_kpis_agg 사용)
CREATE OR REPLACE FUNCTION get_daily_kpis_summary(
  p_store_id UUID,
  p_days INT DEFAULT 30
)
RETURNS TABLE (
  date DATE,
  total_visitors INT,
  total_transactions INT,
  total_revenue NUMERIC,
  conversion_rate NUMERIC,
  avg_transaction_value NUMERIC,
  sales_per_sqm NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    dka.date,
    COALESCE(dka.total_visitors, 0)::INT,
    COALESCE(dka.total_transactions, 0)::INT,
    COALESCE(dka.total_revenue, 0)::NUMERIC,
    COALESCE(dka.conversion_rate, 0)::NUMERIC,
    COALESCE(dka.avg_transaction_value, 0)::NUMERIC,
    COALESCE(dka.sales_per_sqm, 0)::NUMERIC
  FROM daily_kpis_agg dka
  WHERE dka.store_id = p_store_id
    AND dka.date >= CURRENT_DATE - p_days
  ORDER BY dka.date DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. 통합 개념 계산
-- 모든 리테일 개념을 한 번에 계산하여 JSON 객체로 반환
CREATE OR REPLACE FUNCTION compute_all_retail_concepts(
  p_store_id UUID,
  p_days INT DEFAULT 30
)
RETURNS JSONB AS $$
DECLARE
  result JSONB := '{}';
  zone_funnel JSONB;
  cross_sell JSONB;
  turnover JSONB;
  heatmap JSONB;
  kpi_summary JSONB;
  entity_summary JSONB;
  relation_summary JSONB;
  store_info JSONB;
BEGIN
  -- 매장 정보
  SELECT jsonb_build_object(
    'store_name', s.store_name,
    'area_sqm', s.area_sqm,
    'status', s.status
  )
  INTO store_info
  FROM stores s
  WHERE s.id = p_store_id;

  -- 1. 구역 전환 퍼널
  SELECT COALESCE(jsonb_agg(row_to_json(r)), '[]'::jsonb)
  INTO zone_funnel
  FROM compute_zone_conversion_funnel(p_store_id, p_days) r;

  -- 2. 교차 판매 친화도
  SELECT COALESCE(jsonb_agg(row_to_json(r)), '[]'::jsonb)
  INTO cross_sell
  FROM compute_cross_sell_affinity(p_store_id, 3) r;

  -- 3. 재고 회전율
  SELECT COALESCE(jsonb_agg(row_to_json(r)), '[]'::jsonb)
  INTO turnover
  FROM compute_inventory_turnover(p_store_id, p_days) r;

  -- 4. 구역 히트맵
  SELECT COALESCE(jsonb_agg(row_to_json(r)), '[]'::jsonb)
  INTO heatmap
  FROM compute_zone_heatmap(p_store_id, 7) r;

  -- 5. KPI 요약 (최근 7일)
  SELECT COALESCE(jsonb_agg(row_to_json(r)), '[]'::jsonb)
  INTO kpi_summary
  FROM get_daily_kpis_summary(p_store_id, 7) r;

  -- 6. 엔티티 요약
  SELECT jsonb_build_object(
    'total', COUNT(*)::INT,
    'by_type', COALESCE(
      jsonb_object_agg(type_name, cnt),
      '{}'::jsonb
    )
  )
  INTO entity_summary
  FROM (
    SELECT
      COALESCE(oet.name, 'unknown') as type_name,
      COUNT(*)::INT as cnt
    FROM graph_entities ge
    LEFT JOIN ontology_entity_types oet ON ge.entity_type_id = oet.id
    WHERE ge.store_id = p_store_id
    GROUP BY oet.name
  ) sub;

  -- 7. 관계 요약
  SELECT jsonb_build_object(
    'total', COUNT(*)::INT,
    'by_type', COALESCE(
      jsonb_object_agg(type_name, cnt),
      '{}'::jsonb
    )
  )
  INTO relation_summary
  FROM (
    SELECT
      COALESCE(ort.name, 'unknown') as type_name,
      COUNT(*)::INT as cnt
    FROM graph_relations gr
    LEFT JOIN ontology_relation_types ort ON gr.relation_type_id = ort.id
    WHERE gr.store_id = p_store_id
    GROUP BY ort.name
  ) sub;

  -- 결과 조합
  result := jsonb_build_object(
    'computed_at', NOW(),
    'store_id', p_store_id,
    'period_days', p_days,
    'store_info', COALESCE(store_info, '{}'::jsonb),
    'zone_conversion_funnel', COALESCE(zone_funnel, '[]'::jsonb),
    'cross_sell_affinity', COALESCE(cross_sell, '[]'::jsonb),
    'inventory_turnover', COALESCE(turnover, '[]'::jsonb),
    'zone_heatmap', COALESCE(heatmap, '[]'::jsonb),
    'kpi_summary', COALESCE(kpi_summary, '[]'::jsonb),
    'entity_summary', COALESCE(entity_summary, '{"total":0,"by_type":{}}'::jsonb),
    'relation_summary', COALESCE(relation_summary, '{"total":0,"by_type":{}}'::jsonb)
  );

  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. 특정 개념 값 저장
CREATE OR REPLACE FUNCTION save_concept_value(
  p_concept_name TEXT,
  p_store_id UUID,
  p_value JSONB,
  p_parameters JSONB DEFAULT NULL,
  p_valid_hours INT DEFAULT 24
)
RETURNS UUID AS $$
DECLARE
  v_concept_id UUID;
  v_result_id UUID;
BEGIN
  -- 개념 ID 조회
  SELECT id INTO v_concept_id
  FROM retail_concepts
  WHERE name = p_concept_name
    AND (is_system = true OR user_id = auth.uid());

  IF v_concept_id IS NULL THEN
    RAISE EXCEPTION 'Concept not found: %', p_concept_name;
  END IF;

  -- 값 저장
  INSERT INTO retail_concept_values (concept_id, store_id, value, parameters, valid_until)
  VALUES (
    v_concept_id,
    p_store_id,
    p_value,
    p_parameters,
    NOW() + (p_valid_hours || ' hours')::INTERVAL
  )
  RETURNING id INTO v_result_id;

  RETURN v_result_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. 캐시된 개념 값 조회
CREATE OR REPLACE FUNCTION get_cached_concept_value(
  p_concept_name TEXT,
  p_store_id UUID
)
RETURNS JSONB AS $$
DECLARE
  v_result JSONB;
BEGIN
  SELECT value INTO v_result
  FROM retail_concept_values rcv
  JOIN retail_concepts rc ON rcv.concept_id = rc.id
  WHERE rc.name = p_concept_name
    AND rcv.store_id = p_store_id
    AND (rcv.valid_until IS NULL OR rcv.valid_until > NOW())
  ORDER BY rcv.computed_at DESC
  LIMIT 1;

  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 9. 방문 통계 조회 (store_visits 사용)
CREATE OR REPLACE FUNCTION get_visit_statistics(
  p_store_id UUID,
  p_days INT DEFAULT 30
)
RETURNS TABLE (
  date DATE,
  total_visits BIGINT,
  avg_duration_minutes NUMERIC,
  purchase_count BIGINT,
  conversion_rate NUMERIC,
  avg_purchase_amount NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    sv.visit_date::DATE as date,
    COUNT(*)::BIGINT as total_visits,
    ROUND(AVG(sv.duration_minutes)::NUMERIC, 1) as avg_duration_minutes,
    COUNT(*) FILTER (WHERE sv.made_purchase = true)::BIGINT as purchase_count,
    ROUND(
      COUNT(*) FILTER (WHERE sv.made_purchase = true)::NUMERIC /
      NULLIF(COUNT(*), 0) * 100,
      2
    )::NUMERIC as conversion_rate,
    ROUND(AVG(sv.purchase_amount) FILTER (WHERE sv.made_purchase = true)::NUMERIC, 0) as avg_purchase_amount
  FROM store_visits sv
  WHERE sv.store_id = p_store_id
    AND sv.visit_date >= CURRENT_DATE - p_days
  GROUP BY sv.visit_date::DATE
  ORDER BY date DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 10. 시간대별 트래픽 조회 (hourly_metrics 사용)
CREATE OR REPLACE FUNCTION get_hourly_traffic(
  p_store_id UUID,
  p_date DATE DEFAULT CURRENT_DATE
)
RETURNS TABLE (
  hour INT,
  visitor_count INT,
  transaction_count INT,
  revenue NUMERIC,
  conversion_rate NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    hm.hour,
    COALESCE(hm.visitor_count, 0)::INT,
    COALESCE(hm.transaction_count, 0)::INT,
    COALESCE(hm.revenue, 0)::NUMERIC,
    COALESCE(hm.conversion_rate, 0)::NUMERIC
  FROM hourly_metrics hm
  WHERE hm.store_id = p_store_id
    AND hm.date = p_date
  ORDER BY hm.hour;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
