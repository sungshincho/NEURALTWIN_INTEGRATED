-- ============================================================================
-- NEURALTWIN v8.6 SEED_01: 기존 데이터 삭제 (FK 역순)
-- ============================================================================
-- 실행 순서: SEED_00 이후
-- 목적: 기존 시딩 데이터 삭제 (마스터 온톨로지, stores, organizations 유지)
-- 수정: ontology_mapping_cache store_id → org_id
-- ============================================================================

BEGIN;

DO $$
DECLARE
  v_store_id UUID;
  v_org_id UUID;
  v_count INT;
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '════════════════════════════════════════════════════════════════════';
  RAISE NOTICE '  NEURALTWIN v8.6 SEED_01: 기존 데이터 삭제';
  RAISE NOTICE '════════════════════════════════════════════════════════════════════';
  RAISE NOTICE '  시작 시간: %', NOW();
  RAISE NOTICE '';
  
  -- Store/Org 정보 가져오기
  SELECT id, org_id INTO v_store_id, v_org_id FROM stores LIMIT 1;
  
  IF v_store_id IS NULL THEN
    RAISE NOTICE '  ⚠️ Store가 없습니다. 삭제할 데이터가 없습니다.';
    RETURN;
  END IF;
  
  RAISE NOTICE '  Store ID: %', v_store_id;
  RAISE NOTICE '  Org ID: %', v_org_id;
  RAISE NOTICE '';

  -- ══════════════════════════════════════════════════════════════════════════
  -- Level 6: AI/전략 파생 데이터 (가장 먼저 삭제)
  -- ══════════════════════════════════════════════════════════════════════════
  RAISE NOTICE '  [Level 6] AI/전략 파생 데이터 삭제...';
  
  -- 1.1 strategy_daily_metrics
  DELETE FROM strategy_daily_metrics WHERE strategy_id IN (
    SELECT id FROM applied_strategies WHERE store_id = v_store_id
  );
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RAISE NOTICE '    1.1  strategy_daily_metrics: % rows', v_count;
  
  -- 1.2 strategy_feedback
  DELETE FROM strategy_feedback WHERE store_id = v_store_id;
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RAISE NOTICE '    1.2  strategy_feedback: % rows', v_count;
  
  -- 1.3 applied_strategies
  DELETE FROM applied_strategies WHERE store_id = v_store_id;
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RAISE NOTICE '    1.3  applied_strategies: % rows', v_count;
  
  -- 1.4 ai_inference_results
  DELETE FROM ai_inference_results WHERE store_id = v_store_id;
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RAISE NOTICE '    1.4  ai_inference_results: % rows', v_count;
  
  -- 1.5 ai_inference_logs
  DELETE FROM ai_inference_logs WHERE store_id = v_store_id;
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RAISE NOTICE '    1.5  ai_inference_logs: % rows', v_count;
  
  -- 1.6 ai_recommendations
  DELETE FROM ai_recommendations WHERE store_id = v_store_id;
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RAISE NOTICE '    1.6  ai_recommendations: % rows', v_count;
  
  -- 1.7 ai_insights
  DELETE FROM ai_insights WHERE store_id = v_store_id;
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RAISE NOTICE '    1.7  ai_insights: % rows', v_count;
  
  -- 1.8 ai_scene_analysis
  DELETE FROM ai_scene_analysis WHERE store_id = v_store_id;
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RAISE NOTICE '    1.8  ai_scene_analysis: % rows', v_count;
  
  -- 1.9 roi_measurements
  DELETE FROM roi_measurements WHERE org_id = v_org_id;
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RAISE NOTICE '    1.9  roi_measurements: % rows', v_count;
  
  -- 1.10 recommendation_applications
  DELETE FROM recommendation_applications WHERE store_id = v_store_id;
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RAISE NOTICE '    1.10 recommendation_applications: % rows', v_count;
  
  -- 1.11 ai_model_performance
  DELETE FROM ai_model_performance WHERE store_id = v_store_id OR org_id = v_org_id;
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RAISE NOTICE '    1.11 ai_model_performance: % rows', v_count;
  
  -- 1.12 learning_adjustments
  DELETE FROM learning_adjustments WHERE store_id = v_store_id OR org_id = v_org_id;
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RAISE NOTICE '    1.12 learning_adjustments: % rows', v_count;

  -- ══════════════════════════════════════════════════════════════════════════
  -- Level 5: 그래프/온톨로지 인스턴스 데이터
  -- ══════════════════════════════════════════════════════════════════════════
  RAISE NOTICE '  [Level 5] 그래프/온톨로지 인스턴스 삭제...';
  
  -- 1.13 graph_relations
  DELETE FROM graph_relations WHERE store_id = v_store_id;
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RAISE NOTICE '    1.13 graph_relations: % rows', v_count;
  
  -- 1.14 graph_entities
  DELETE FROM graph_entities WHERE store_id = v_store_id;
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RAISE NOTICE '    1.14 graph_entities: % rows', v_count;
  
  -- 1.15 ontology_relation_inference_queue
  DELETE FROM ontology_relation_inference_queue WHERE user_id IN (
    SELECT user_id FROM stores WHERE id = v_store_id
  );
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RAISE NOTICE '    1.15 ontology_relation_inference_queue: % rows', v_count;
  
  -- 1.16 ontology_mapping_cache (수정: store_id → org_id)
  DELETE FROM ontology_mapping_cache WHERE org_id = v_org_id;
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RAISE NOTICE '    1.16 ontology_mapping_cache: % rows', v_count;
  
  -- 1.17 ontology_relation_mappings (store-specific만)
  -- 마스터 매핑은 유지, 스토어별 매핑만 삭제
  DELETE FROM ontology_relation_mappings WHERE data_source_id IN (
    SELECT id FROM data_sources WHERE store_id = v_store_id
  );
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RAISE NOTICE '    1.17 ontology_relation_mappings: % rows', v_count;
  
  -- 1.18 ontology_entity_mappings (store-specific만)
  DELETE FROM ontology_entity_mappings WHERE data_source_id IN (
    SELECT id FROM data_sources WHERE store_id = v_store_id
  );
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RAISE NOTICE '    1.18 ontology_entity_mappings: % rows', v_count;
  
  -- 1.19 data_source_tables
  DELETE FROM data_source_tables WHERE data_source_id IN (
    SELECT id FROM data_sources WHERE store_id = v_store_id
  );
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RAISE NOTICE '    1.19 data_source_tables: % rows', v_count;

  -- ══════════════════════════════════════════════════════════════════════════
  -- Level 5: 집계 데이터
  -- ══════════════════════════════════════════════════════════════════════════
  RAISE NOTICE '  [Level 5] 집계 데이터 삭제...';
  
  -- 1.20 customer_segments_agg
  DELETE FROM customer_segments_agg WHERE store_id = v_store_id;
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RAISE NOTICE '    1.20 customer_segments_agg: % rows', v_count;
  
  -- 1.21 product_performance_agg
  DELETE FROM product_performance_agg WHERE store_id = v_store_id;
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RAISE NOTICE '    1.21 product_performance_agg: % rows', v_count;
  
  -- 1.22 zone_daily_metrics
  DELETE FROM zone_daily_metrics WHERE store_id = v_store_id;
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RAISE NOTICE '    1.22 zone_daily_metrics: % rows', v_count;
  
  -- 1.23 zone_performance
  DELETE FROM zone_performance WHERE store_id = v_store_id;
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RAISE NOTICE '    1.23 zone_performance: % rows', v_count;
  
  -- 1.24 zone_metrics
  DELETE FROM zone_metrics WHERE store_id = v_store_id;
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RAISE NOTICE '    1.24 zone_metrics: % rows', v_count;
  
  -- 1.25 hourly_metrics
  DELETE FROM hourly_metrics WHERE store_id = v_store_id;
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RAISE NOTICE '    1.25 hourly_metrics: % rows', v_count;
  
  -- 1.26 daily_sales
  DELETE FROM daily_sales WHERE store_id = v_store_id;
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RAISE NOTICE '    1.26 daily_sales: % rows', v_count;
  
  -- 1.27 daily_kpis_agg
  DELETE FROM daily_kpis_agg WHERE store_id = v_store_id;
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RAISE NOTICE '    1.27 daily_kpis_agg: % rows', v_count;
  
  -- 1.28 kpi_snapshots
  DELETE FROM kpi_snapshots WHERE store_id = v_store_id;
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RAISE NOTICE '    1.28 kpi_snapshots: % rows', v_count;
  
  -- 1.29 dashboard_kpis
  DELETE FROM dashboard_kpis WHERE store_id = v_store_id;
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RAISE NOTICE '    1.29 dashboard_kpis: % rows', v_count;

  -- ══════════════════════════════════════════════════════════════════════════
  -- Level 4: 이벤트/트랜잭션 데이터
  -- ══════════════════════════════════════════════════════════════════════════
  RAISE NOTICE '  [Level 4] 이벤트/트랜잭션 삭제...';
  
  -- 1.30 zone_events
  DELETE FROM zone_events WHERE store_id = v_store_id;
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RAISE NOTICE '    1.30 zone_events: % rows', v_count;
  
  -- 1.31 visit_zone_events
  DELETE FROM visit_zone_events WHERE store_id = v_store_id;
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RAISE NOTICE '    1.31 visit_zone_events: % rows', v_count;
  
  -- 1.32 funnel_events
  DELETE FROM funnel_events WHERE store_id = v_store_id;
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RAISE NOTICE '    1.32 funnel_events: % rows', v_count;
  
  -- 1.33 funnel_metrics
  DELETE FROM funnel_metrics WHERE store_id = v_store_id;
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RAISE NOTICE '    1.33 funnel_metrics: % rows', v_count;
  
  -- 1.34 line_items
  DELETE FROM line_items WHERE store_id = v_store_id;
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RAISE NOTICE '    1.34 line_items: % rows', v_count;
  
  -- 1.35 transactions
  DELETE FROM transactions WHERE store_id = v_store_id;
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RAISE NOTICE '    1.35 transactions: % rows', v_count;
  
  -- 1.36 purchases
  DELETE FROM purchases WHERE store_id = v_store_id;
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RAISE NOTICE '    1.36 purchases: % rows', v_count;
  
  -- 1.37 store_visits
  DELETE FROM store_visits WHERE store_id = v_store_id;
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RAISE NOTICE '    1.37 store_visits: % rows', v_count;
  
  -- 1.38 visits (레거시)
  DELETE FROM visits WHERE store_id = v_store_id;
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RAISE NOTICE '    1.38 visits: % rows', v_count;

  -- ══════════════════════════════════════════════════════════════════════════
  -- Level 3: 3D 스튜디오 데이터 (신규 테이블)
  -- ══════════════════════════════════════════════════════════════════════════
  RAISE NOTICE '  [Level 3] 3D 스튜디오 데이터 삭제...';
  
  -- 1.39 product_placements (신규)
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'product_placements') THEN
    DELETE FROM product_placements WHERE store_id = v_store_id;
    GET DIAGNOSTICS v_count = ROW_COUNT;
    RAISE NOTICE '    1.39 product_placements: % rows', v_count;
  ELSE
    RAISE NOTICE '    1.39 product_placements: (테이블 없음)';
  END IF;
  
  -- 1.40 zone_transitions (신규)
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'zone_transitions') THEN
    DELETE FROM zone_transitions WHERE store_id = v_store_id;
    GET DIAGNOSTICS v_count = ROW_COUNT;
    RAISE NOTICE '    1.40 zone_transitions: % rows', v_count;
  ELSE
    RAISE NOTICE '    1.40 zone_transitions: (테이블 없음)';
  END IF;

  -- ══════════════════════════════════════════════════════════════════════════
  -- Level 3: 가구/상품 데이터
  -- ══════════════════════════════════════════════════════════════════════════
  RAISE NOTICE '  [Level 3] 가구/상품 데이터 삭제...';
  
  -- 1.41 product_models (신규)
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'product_models') THEN
    DELETE FROM product_models WHERE product_id IN (
      SELECT id FROM products WHERE store_id = v_store_id
    );
    GET DIAGNOSTICS v_count = ROW_COUNT;
    RAISE NOTICE '    1.41 product_models: % rows', v_count;
  ELSE
    RAISE NOTICE '    1.41 product_models: (테이블 없음)';
  END IF;
  
  -- 1.42 inventory_levels
  DELETE FROM inventory_levels WHERE product_id IN (
    SELECT id FROM products WHERE store_id = v_store_id
  );
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RAISE NOTICE '    1.42 inventory_levels: % rows', v_count;
  
  -- 1.43 inventory
  DELETE FROM inventory WHERE store_id = v_store_id;
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RAISE NOTICE '    1.43 inventory: % rows', v_count;
  
  -- 1.44 inventory_history
  DELETE FROM inventory_history WHERE store_id = v_store_id;
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RAISE NOTICE '    1.44 inventory_history: % rows', v_count;
  
  -- 1.45 inventory_movements
  DELETE FROM inventory_movements WHERE store_id = v_store_id;
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RAISE NOTICE '    1.45 inventory_movements: % rows', v_count;
  
  -- 1.46 realtime_inventory
  DELETE FROM realtime_inventory WHERE store_id = v_store_id;
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RAISE NOTICE '    1.46 realtime_inventory: % rows', v_count;
  
  -- 1.47 auto_order_suggestions (org_id 사용)
  DELETE FROM auto_order_suggestions WHERE org_id = v_org_id;
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RAISE NOTICE '    1.47 auto_order_suggestions: % rows', v_count;
  
  -- 1.48 furniture_slots (신규)
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'furniture_slots') THEN
    DELETE FROM furniture_slots WHERE store_id = v_store_id;
    GET DIAGNOSTICS v_count = ROW_COUNT;
    RAISE NOTICE '    1.48 furniture_slots: % rows', v_count;
  ELSE
    RAISE NOTICE '    1.48 furniture_slots: (테이블 없음)';
  END IF;
  
  -- 1.49 products
  DELETE FROM products WHERE store_id = v_store_id;
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RAISE NOTICE '    1.49 products: % rows', v_count;
  
  -- 1.50 furniture
  DELETE FROM furniture WHERE store_id = v_store_id;
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RAISE NOTICE '    1.50 furniture: % rows', v_count;

  -- ══════════════════════════════════════════════════════════════════════════
  -- Level 2: 기본 엔티티 데이터
  -- ══════════════════════════════════════════════════════════════════════════
  RAISE NOTICE '  [Level 2] 기본 엔티티 삭제...';
  
  -- 1.51 shift_schedules
  DELETE FROM shift_schedules WHERE store_id = v_store_id;
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RAISE NOTICE '    1.51 shift_schedules: % rows', v_count;
  
  -- 1.52 staff_assignments
  DELETE FROM staff_assignments WHERE store_id = v_store_id;
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RAISE NOTICE '    1.52 staff_assignments: % rows', v_count;
  
  -- 1.53 staff
  DELETE FROM staff WHERE store_id = v_store_id;
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RAISE NOTICE '    1.53 staff: % rows', v_count;
  
  -- 1.54 customer_segments
  DELETE FROM customer_segments WHERE store_id = v_store_id;
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RAISE NOTICE '    1.54 customer_segments: % rows', v_count;
  
  -- 1.55 customers
  DELETE FROM customers WHERE store_id = v_store_id;
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RAISE NOTICE '    1.55 customers: % rows', v_count;
  
  -- 1.56 store_scenes
  DELETE FROM store_scenes WHERE store_id = v_store_id;
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RAISE NOTICE '    1.56 store_scenes: % rows', v_count;
  
  -- 1.57 store_goals
  DELETE FROM store_goals WHERE store_id = v_store_id;
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RAISE NOTICE '    1.57 store_goals: % rows', v_count;
  
  -- 1.58 simulation_history
  DELETE FROM simulation_history WHERE store_id = v_store_id;
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RAISE NOTICE '    1.58 simulation_history: % rows', v_count;
  
  -- 1.59 simulation_configs
  DELETE FROM simulation_configs WHERE store_id = v_store_id;
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RAISE NOTICE '    1.59 simulation_configs: % rows', v_count;
  
  -- 1.60 optimization_tasks
  DELETE FROM optimization_tasks WHERE store_id = v_store_id;
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RAISE NOTICE '    1.60 optimization_tasks: % rows', v_count;
  
  -- 1.61 scenarios
  DELETE FROM scenarios WHERE store_id = v_store_id;
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RAISE NOTICE '    1.61 scenarios: % rows', v_count;
  
  -- 1.62 analysis_history
  DELETE FROM analysis_history WHERE store_id = v_store_id;
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RAISE NOTICE '    1.62 analysis_history: % rows', v_count;
  
  -- 1.63 alerts
  DELETE FROM alerts WHERE store_id = v_store_id;
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RAISE NOTICE '    1.63 alerts: % rows', v_count;
  
  -- 1.64 tasks
  DELETE FROM tasks WHERE store_id = v_store_id;
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RAISE NOTICE '    1.64 tasks: % rows', v_count;
  
  -- 1.65 store_comments
  DELETE FROM store_comments WHERE store_id = v_store_id;
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RAISE NOTICE '    1.65 store_comments: % rows', v_count;

  -- ══════════════════════════════════════════════════════════════════════════
  -- Level 2: 데이터 소스/외부 데이터
  -- ══════════════════════════════════════════════════════════════════════════
  RAISE NOTICE '  [Level 2] 데이터 소스 삭제...';
  
  -- 1.66 data_source_sync_logs
  DELETE FROM data_source_sync_logs WHERE data_source_id IN (
    SELECT id FROM data_sources WHERE store_id = v_store_id
  );
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RAISE NOTICE '    1.66 data_source_sync_logs: % rows', v_count;
  
  -- 1.67 data_sources
  DELETE FROM data_sources WHERE store_id = v_store_id;
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RAISE NOTICE '    1.67 data_sources: % rows', v_count;
  
  -- 1.68 retail_concept_values
  DELETE FROM retail_concept_values WHERE concept_id IN (
    SELECT id FROM retail_concepts WHERE store_id = v_store_id
  );
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RAISE NOTICE '    1.68 retail_concept_values: % rows', v_count;
  
  -- 1.69 retail_concepts
  DELETE FROM retail_concepts WHERE store_id = v_store_id;
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RAISE NOTICE '    1.69 retail_concepts: % rows', v_count;
  
  -- 1.70 weather_data
  DELETE FROM weather_data WHERE store_id = v_store_id;
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RAISE NOTICE '    1.70 weather_data: % rows', v_count;
  
  -- 1.71 holidays_events
  DELETE FROM holidays_events WHERE store_id = v_store_id;
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RAISE NOTICE '    1.71 holidays_events: % rows', v_count;
  
  -- 1.72 economic_indicators
  DELETE FROM economic_indicators WHERE org_id = v_org_id;
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RAISE NOTICE '    1.72 economic_indicators: % rows', v_count;
  
  -- 1.73 regional_data
  DELETE FROM regional_data WHERE org_id = v_org_id;
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RAISE NOTICE '    1.73 regional_data: % rows', v_count;
  
  -- 1.74 trend_signals
  DELETE FROM trend_signals WHERE org_id = v_org_id;
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RAISE NOTICE '    1.74 trend_signals: % rows', v_count;

  -- ══════════════════════════════════════════════════════════════════════════
  -- Level 2: 센서/디바이스 이벤트
  -- ══════════════════════════════════════════════════════════════════════════
  RAISE NOTICE '  [Level 2] 센서/디바이스 이벤트 삭제...';
  
  -- 1.75 wifi_tracking
  DELETE FROM wifi_tracking WHERE store_id = v_store_id;
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RAISE NOTICE '    1.75 wifi_tracking: % rows', v_count;
  
  -- 1.76 wifi_events
  DELETE FROM wifi_events WHERE store_id = v_store_id;
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RAISE NOTICE '    1.76 wifi_events: % rows', v_count;
  
  -- 1.77 wifi_zones
  DELETE FROM wifi_zones WHERE store_id = v_store_id;
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RAISE NOTICE '    1.77 wifi_zones: % rows', v_count;
  
  -- 1.78 beacon_events
  DELETE FROM beacon_events WHERE store_id = v_store_id;
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RAISE NOTICE '    1.78 beacon_events: % rows', v_count;
  
  -- 1.79 beacons
  DELETE FROM beacons WHERE store_id = v_store_id;
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RAISE NOTICE '    1.79 beacons: % rows', v_count;
  
  -- 1.80 camera_events
  DELETE FROM camera_events WHERE store_id = v_store_id;
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RAISE NOTICE '    1.80 camera_events: % rows', v_count;
  
  -- 1.81 realtime_transactions
  DELETE FROM realtime_transactions WHERE store_id = v_store_id;
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RAISE NOTICE '    1.81 realtime_transactions: % rows', v_count;

  -- ══════════════════════════════════════════════════════════════════════════
  -- Level 1: zones_dim (furniture 의존)
  -- ══════════════════════════════════════════════════════════════════════════
  RAISE NOTICE '  [Level 1] zones_dim 삭제...';
  
  -- 1.82 zones_dim
  DELETE FROM zones_dim WHERE store_id = v_store_id;
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RAISE NOTICE '    1.82 zones_dim: % rows', v_count;

  -- ══════════════════════════════════════════════════════════════════════════
  -- Level 0: 마스터 데이터 (삭제하지 않음!)
  -- ══════════════════════════════════════════════════════════════════════════
  RAISE NOTICE '  [Level 0] 마스터 데이터 유지 (삭제 안함)';
  RAISE NOTICE '    ✓ ontology_entity_types (유지)';
  RAISE NOTICE '    ✓ ontology_relation_types (유지)';
  RAISE NOTICE '    ✓ ontology_schemas (유지)';
  RAISE NOTICE '    ✓ ontology_schema_versions (유지)';
  RAISE NOTICE '    ✓ stores (유지)';
  RAISE NOTICE '    ✓ organizations (유지)';
  RAISE NOTICE '    ✓ organization_members (유지)';
  RAISE NOTICE '    ✓ profiles (유지)';

  RAISE NOTICE '';
  RAISE NOTICE '════════════════════════════════════════════════════════════════════';
  RAISE NOTICE '  SEED_01 완료: 기존 데이터 삭제';
  RAISE NOTICE '════════════════════════════════════════════════════════════════════';
  RAISE NOTICE '  완료 시간: %', NOW();
  RAISE NOTICE '════════════════════════════════════════════════════════════════════';
  
END $$;

COMMIT;

-- ============================================================================
-- 검증 쿼리: 주요 테이블 레코드 수 확인
-- ============================================================================
SELECT 
  'products' as table_name, 
  COUNT(*) as row_count 
FROM products
UNION ALL
SELECT 'furniture', COUNT(*) FROM furniture
UNION ALL
SELECT 'customers', COUNT(*) FROM customers
UNION ALL
SELECT 'staff', COUNT(*) FROM staff
UNION ALL
SELECT 'zones_dim', COUNT(*) FROM zones_dim
UNION ALL
SELECT 'store_visits', COUNT(*) FROM store_visits
UNION ALL
SELECT 'purchases', COUNT(*) FROM purchases
UNION ALL
SELECT 'daily_kpis_agg', COUNT(*) FROM daily_kpis_agg
UNION ALL
SELECT 'graph_entities', COUNT(*) FROM graph_entities
UNION ALL
SELECT 'applied_strategies', COUNT(*) FROM applied_strategies
ORDER BY table_name;
