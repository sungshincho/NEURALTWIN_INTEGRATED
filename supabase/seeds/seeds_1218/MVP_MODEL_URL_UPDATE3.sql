-- ============================================================================
-- MVP_MODEL_URL_UPDATE3.sql (v8.5 168슬롯 버전)
-- ============================================================================
-- 가구: 68개 고유 furniture_type (LIKE 패턴 매칭)
-- 슬롯: 168개 (34개 가구)
-- Staff: 8명 (EMP001~EMP008)
-- ============================================================================

DO $$
DECLARE
  v_store_id UUID;
  v_user_id UUID;
  v_org_id UUID;
  v_zone_entrance UUID;
  v_zone_main UUID;
  v_zone_clothing UUID;
  v_zone_accessory UUID;
  v_zone_fitting UUID;
  v_zone_checkout UUID;
  v_zone_lounge UUID;
BEGIN
  SELECT id, user_id, org_id INTO v_store_id, v_user_id, v_org_id FROM stores LIMIT 1;

  -- Zone IDs
  SELECT id INTO v_zone_entrance FROM zones_dim WHERE zone_code = 'Z001' AND store_id = v_store_id;
  SELECT id INTO v_zone_main FROM zones_dim WHERE zone_code = 'Z002' AND store_id = v_store_id;
  SELECT id INTO v_zone_clothing FROM zones_dim WHERE zone_code = 'Z003' AND store_id = v_store_id;
  SELECT id INTO v_zone_accessory FROM zones_dim WHERE zone_code = 'Z004' AND store_id = v_store_id;
  SELECT id INTO v_zone_fitting FROM zones_dim WHERE zone_code = 'Z005' AND store_id = v_store_id;
  SELECT id INTO v_zone_checkout FROM zones_dim WHERE zone_code = 'Z006' AND store_id = v_store_id;
  SELECT id INTO v_zone_lounge FROM zones_dim WHERE zone_code = 'Z007' AND store_id = v_store_id;

  RAISE NOTICE '';
  RAISE NOTICE '════════════════════════════════════════════════════════════════';
  RAISE NOTICE '      MVP_MODEL_URL_UPDATE3 (v8.5 168슬롯 버전)                 ';
  RAISE NOTICE '════════════════════════════════════════════════════════════════';

  -- ═══════════════════════════════════════════════════════════════════════════
  -- 1. 공간 모델 URL (zones_dim.metadata) - 7개 존
  -- ═══════════════════════════════════════════════════════════════════════════
  
  -- 전체 매장 모델 (stores 테이블)
  UPDATE stores SET
    metadata = COALESCE(metadata, '{}'::jsonb) || jsonb_build_object(
      'model_3d_url', 'https://bdrvowacecxnraaivlhr.supabase.co/storage/v1/object/public/3d-models/e4200130-08e8-47da-8c92-3d0b90fafd77/d9830554-2688-4032-af40-acccda787ac4/3d-models/space/store_20x20.glb'
    )
  WHERE id = v_store_id;
  RAISE NOTICE '  ✓ 전체 매장 모델 URL 설정 (store_20x20.glb)';

  -- Z001 입구
  UPDATE zones_dim SET
    metadata = COALESCE(metadata, '{}'::jsonb) || jsonb_build_object(
      'model_3d_url', 'https://bdrvowacecxnraaivlhr.supabase.co/storage/v1/object/public/3d-models/e4200130-08e8-47da-8c92-3d0b90fafd77/d9830554-2688-4032-af40-acccda787ac4/3d-models/space/zone_entrance_01.glb'
    )
  WHERE store_id = v_store_id AND zone_code = 'Z001';

  -- Z002 메인홀
  UPDATE zones_dim SET
    metadata = COALESCE(metadata, '{}'::jsonb) || jsonb_build_object(
      'model_3d_url', 'https://bdrvowacecxnraaivlhr.supabase.co/storage/v1/object/public/3d-models/e4200130-08e8-47da-8c92-3d0b90fafd77/d9830554-2688-4032-af40-acccda787ac4/3d-models/space/zone_main_01.glb'
    )
  WHERE store_id = v_store_id AND zone_code = 'Z002';

  -- Z003 의류존
  UPDATE zones_dim SET
    metadata = COALESCE(metadata, '{}'::jsonb) || jsonb_build_object(
      'model_3d_url', 'https://bdrvowacecxnraaivlhr.supabase.co/storage/v1/object/public/3d-models/e4200130-08e8-47da-8c92-3d0b90fafd77/d9830554-2688-4032-af40-acccda787ac4/3d-models/space/zone_clothing_01.glb'
    )
  WHERE store_id = v_store_id AND zone_code = 'Z003';

  -- Z004 액세서리존
  UPDATE zones_dim SET
    metadata = COALESCE(metadata, '{}'::jsonb) || jsonb_build_object(
      'model_3d_url', 'https://bdrvowacecxnraaivlhr.supabase.co/storage/v1/object/public/3d-models/e4200130-08e8-47da-8c92-3d0b90fafd77/d9830554-2688-4032-af40-acccda787ac4/3d-models/space/zone_accessory_01.glb'
    )
  WHERE store_id = v_store_id AND zone_code = 'Z004';

  -- Z005 피팅룸
  UPDATE zones_dim SET
    metadata = COALESCE(metadata, '{}'::jsonb) || jsonb_build_object(
      'model_3d_url', 'https://bdrvowacecxnraaivlhr.supabase.co/storage/v1/object/public/3d-models/e4200130-08e8-47da-8c92-3d0b90fafd77/d9830554-2688-4032-af40-acccda787ac4/3d-models/space/zone_fitting_01.glb'
    )
  WHERE store_id = v_store_id AND zone_code = 'Z005';

  -- Z006 계산대
  UPDATE zones_dim SET
    metadata = COALESCE(metadata, '{}'::jsonb) || jsonb_build_object(
      'model_3d_url', 'https://bdrvowacecxnraaivlhr.supabase.co/storage/v1/object/public/3d-models/e4200130-08e8-47da-8c92-3d0b90fafd77/d9830554-2688-4032-af40-acccda787ac4/3d-models/space/zone_checkout_01.glb'
    )
  WHERE store_id = v_store_id AND zone_code = 'Z006';

  -- Z007 휴식공간
  UPDATE zones_dim SET
    metadata = COALESCE(metadata, '{}'::jsonb) || jsonb_build_object(
      'model_3d_url', 'https://bdrvowacecxnraaivlhr.supabase.co/storage/v1/object/public/3d-models/e4200130-08e8-47da-8c92-3d0b90fafd77/d9830554-2688-4032-af40-acccda787ac4/3d-models/space/zone_lounge_01.glb'
    )
  WHERE store_id = v_store_id AND zone_code = 'Z007';

  RAISE NOTICE '  ✓ 존별 모델 URL 설정 (7개)';

  -- ═══════════════════════════════════════════════════════════════════════════
  -- 2. 가구 모델 URL (68개 고유 타입 - LIKE 패턴 매칭)
  -- ═══════════════════════════════════════════════════════════════════════════

  -- Z001 입구
  UPDATE furniture SET model_url = 'https://bdrvowacecxnraaivlhr.supabase.co/storage/v1/object/public/3d-models/e4200130-08e8-47da-8c92-3d0b90fafd77/d9830554-2688-4032-af40-acccda787ac4/3d-models/furniture/gate_entrance_01.glb'
  WHERE store_id = v_store_id AND furniture_type = 'gate_entrance_01';

  UPDATE furniture SET model_url = 'https://bdrvowacecxnraaivlhr.supabase.co/storage/v1/object/public/3d-models/e4200130-08e8-47da-8c92-3d0b90fafd77/d9830554-2688-4032-af40-acccda787ac4/3d-models/furniture/sign_welcome_01.glb'
  WHERE store_id = v_store_id AND furniture_type = 'sign_welcome_01';

  UPDATE furniture SET model_url = 'https://bdrvowacecxnraaivlhr.supabase.co/storage/v1/object/public/3d-models/e4200130-08e8-47da-8c92-3d0b90fafd77/d9830554-2688-4032-af40-acccda787ac4/3d-models/furniture/kiosk_info_01.glb'
  WHERE store_id = v_store_id AND furniture_type = 'kiosk_info_01';

  UPDATE furniture SET model_url = 'https://bdrvowacecxnraaivlhr.supabase.co/storage/v1/object/public/3d-models/e4200130-08e8-47da-8c92-3d0b90fafd77/d9830554-2688-4032-af40-acccda787ac4/3d-models/furniture/cart_stand_01.glb'
  WHERE store_id = v_store_id AND furniture_type = 'cart_stand_01';

  RAISE NOTICE '  ✓ Z001 입구 가구 (4개)';

  -- Z002 메인홀
  UPDATE furniture SET model_url = 'https://bdrvowacecxnraaivlhr.supabase.co/storage/v1/object/public/3d-models/e4200130-08e8-47da-8c92-3d0b90fafd77/d9830554-2688-4032-af40-acccda787ac4/3d-models/furniture/stand_promo_01.glb'
  WHERE store_id = v_store_id AND furniture_type = 'stand_promo_01';
  UPDATE furniture SET model_url = 'https://bdrvowacecxnraaivlhr.supabase.co/storage/v1/object/public/3d-models/e4200130-08e8-47da-8c92-3d0b90fafd77/d9830554-2688-4032-af40-acccda787ac4/3d-models/furniture/stand_promo_02.glb'
  WHERE store_id = v_store_id AND furniture_type = 'stand_promo_02';
  UPDATE furniture SET model_url = 'https://bdrvowacecxnraaivlhr.supabase.co/storage/v1/object/public/3d-models/e4200130-08e8-47da-8c92-3d0b90fafd77/d9830554-2688-4032-af40-acccda787ac4/3d-models/furniture/stand_promo_03.glb'
  WHERE store_id = v_store_id AND furniture_type = 'stand_promo_03';
  UPDATE furniture SET model_url = 'https://bdrvowacecxnraaivlhr.supabase.co/storage/v1/object/public/3d-models/e4200130-08e8-47da-8c92-3d0b90fafd77/d9830554-2688-4032-af40-acccda787ac4/3d-models/furniture/stand_promo_04.glb'
  WHERE store_id = v_store_id AND furniture_type = 'stand_promo_04';

  UPDATE furniture SET model_url = 'https://bdrvowacecxnraaivlhr.supabase.co/storage/v1/object/public/3d-models/e4200130-08e8-47da-8c92-3d0b90fafd77/d9830554-2688-4032-af40-acccda787ac4/3d-models/furniture/table_display_center_01.glb'
  WHERE store_id = v_store_id AND furniture_type = 'table_display_center_01';
  UPDATE furniture SET model_url = 'https://bdrvowacecxnraaivlhr.supabase.co/storage/v1/object/public/3d-models/e4200130-08e8-47da-8c92-3d0b90fafd77/d9830554-2688-4032-af40-acccda787ac4/3d-models/furniture/table_display_center_02.glb'
  WHERE store_id = v_store_id AND furniture_type = 'table_display_center_02';

  UPDATE furniture SET model_url = 'https://bdrvowacecxnraaivlhr.supabase.co/storage/v1/object/public/3d-models/e4200130-08e8-47da-8c92-3d0b90fafd77/d9830554-2688-4032-af40-acccda787ac4/3d-models/furniture/display_round_01.glb'
  WHERE store_id = v_store_id AND furniture_type = 'display_round_01';

  UPDATE furniture SET model_url = 'https://bdrvowacecxnraaivlhr.supabase.co/storage/v1/object/public/3d-models/e4200130-08e8-47da-8c92-3d0b90fafd77/d9830554-2688-4032-af40-acccda787ac4/3d-models/furniture/mannequin_full_01.glb'
  WHERE store_id = v_store_id AND furniture_type = 'mannequin_full_01';
  UPDATE furniture SET model_url = 'https://bdrvowacecxnraaivlhr.supabase.co/storage/v1/object/public/3d-models/e4200130-08e8-47da-8c92-3d0b90fafd77/d9830554-2688-4032-af40-acccda787ac4/3d-models/furniture/mannequin_full_02.glb'
  WHERE store_id = v_store_id AND furniture_type = 'mannequin_full_02';
  UPDATE furniture SET model_url = 'https://bdrvowacecxnraaivlhr.supabase.co/storage/v1/object/public/3d-models/e4200130-08e8-47da-8c92-3d0b90fafd77/d9830554-2688-4032-af40-acccda787ac4/3d-models/furniture/mannequin_full_03.glb'
  WHERE store_id = v_store_id AND furniture_type = 'mannequin_full_03';
  UPDATE furniture SET model_url = 'https://bdrvowacecxnraaivlhr.supabase.co/storage/v1/object/public/3d-models/e4200130-08e8-47da-8c92-3d0b90fafd77/d9830554-2688-4032-af40-acccda787ac4/3d-models/furniture/mannequin_full_04.glb'
  WHERE store_id = v_store_id AND furniture_type = 'mannequin_full_04';

  UPDATE furniture SET model_url = 'https://bdrvowacecxnraaivlhr.supabase.co/storage/v1/object/public/3d-models/e4200130-08e8-47da-8c92-3d0b90fafd77/d9830554-2688-4032-af40-acccda787ac4/3d-models/furniture/banner_hanger_01.glb'
  WHERE store_id = v_store_id AND furniture_type = 'banner_hanger_01';
  UPDATE furniture SET model_url = 'https://bdrvowacecxnraaivlhr.supabase.co/storage/v1/object/public/3d-models/e4200130-08e8-47da-8c92-3d0b90fafd77/d9830554-2688-4032-af40-acccda787ac4/3d-models/furniture/banner_hanger_02.glb'
  WHERE store_id = v_store_id AND furniture_type = 'banner_hanger_02';

  RAISE NOTICE '  ✓ Z002 메인홀 가구 (13개)';

  -- Z003 의류존
  UPDATE furniture SET model_url = 'https://bdrvowacecxnraaivlhr.supabase.co/storage/v1/object/public/3d-models/e4200130-08e8-47da-8c92-3d0b90fafd77/d9830554-2688-4032-af40-acccda787ac4/3d-models/furniture/clothing_rack_double_01.glb'
  WHERE store_id = v_store_id AND furniture_type = 'clothing_rack_double_01';
  UPDATE furniture SET model_url = 'https://bdrvowacecxnraaivlhr.supabase.co/storage/v1/object/public/3d-models/e4200130-08e8-47da-8c92-3d0b90fafd77/d9830554-2688-4032-af40-acccda787ac4/3d-models/furniture/clothing_rack_double_02.glb'
  WHERE store_id = v_store_id AND furniture_type = 'clothing_rack_double_02';
  UPDATE furniture SET model_url = 'https://bdrvowacecxnraaivlhr.supabase.co/storage/v1/object/public/3d-models/e4200130-08e8-47da-8c92-3d0b90fafd77/d9830554-2688-4032-af40-acccda787ac4/3d-models/furniture/clothing_rack_double_03.glb'
  WHERE store_id = v_store_id AND furniture_type = 'clothing_rack_double_03';
  UPDATE furniture SET model_url = 'https://bdrvowacecxnraaivlhr.supabase.co/storage/v1/object/public/3d-models/e4200130-08e8-47da-8c92-3d0b90fafd77/d9830554-2688-4032-af40-acccda787ac4/3d-models/furniture/clothing_rack_double_04.glb'
  WHERE store_id = v_store_id AND furniture_type = 'clothing_rack_double_04';

  UPDATE furniture SET model_url = 'https://bdrvowacecxnraaivlhr.supabase.co/storage/v1/object/public/3d-models/e4200130-08e8-47da-8c92-3d0b90fafd77/d9830554-2688-4032-af40-acccda787ac4/3d-models/furniture/clothing_rack_single_01.glb'
  WHERE store_id = v_store_id AND furniture_type = 'clothing_rack_single_01';
  UPDATE furniture SET model_url = 'https://bdrvowacecxnraaivlhr.supabase.co/storage/v1/object/public/3d-models/e4200130-08e8-47da-8c92-3d0b90fafd77/d9830554-2688-4032-af40-acccda787ac4/3d-models/furniture/clothing_rack_single_02.glb'
  WHERE store_id = v_store_id AND furniture_type = 'clothing_rack_single_02';
  UPDATE furniture SET model_url = 'https://bdrvowacecxnraaivlhr.supabase.co/storage/v1/object/public/3d-models/e4200130-08e8-47da-8c92-3d0b90fafd77/d9830554-2688-4032-af40-acccda787ac4/3d-models/furniture/clothing_rack_single_03.glb'
  WHERE store_id = v_store_id AND furniture_type = 'clothing_rack_single_03';
  UPDATE furniture SET model_url = 'https://bdrvowacecxnraaivlhr.supabase.co/storage/v1/object/public/3d-models/e4200130-08e8-47da-8c92-3d0b90fafd77/d9830554-2688-4032-af40-acccda787ac4/3d-models/furniture/clothing_rack_single_04.glb'
  WHERE store_id = v_store_id AND furniture_type = 'clothing_rack_single_04';

  UPDATE furniture SET model_url = 'https://bdrvowacecxnraaivlhr.supabase.co/storage/v1/object/public/3d-models/e4200130-08e8-47da-8c92-3d0b90fafd77/d9830554-2688-4032-af40-acccda787ac4/3d-models/furniture/shelf_display_01.glb'
  WHERE store_id = v_store_id AND furniture_type = 'shelf_display_01';
  UPDATE furniture SET model_url = 'https://bdrvowacecxnraaivlhr.supabase.co/storage/v1/object/public/3d-models/e4200130-08e8-47da-8c92-3d0b90fafd77/d9830554-2688-4032-af40-acccda787ac4/3d-models/furniture/shelf_display_02.glb'
  WHERE store_id = v_store_id AND furniture_type = 'shelf_display_02';

  UPDATE furniture SET model_url = 'https://bdrvowacecxnraaivlhr.supabase.co/storage/v1/object/public/3d-models/e4200130-08e8-47da-8c92-3d0b90fafd77/d9830554-2688-4032-af40-acccda787ac4/3d-models/furniture/table_display_01.glb'
  WHERE store_id = v_store_id AND furniture_type = 'table_display_01';
  UPDATE furniture SET model_url = 'https://bdrvowacecxnraaivlhr.supabase.co/storage/v1/object/public/3d-models/e4200130-08e8-47da-8c92-3d0b90fafd77/d9830554-2688-4032-af40-acccda787ac4/3d-models/furniture/table_display_02.glb'
  WHERE store_id = v_store_id AND furniture_type = 'table_display_02';

  UPDATE furniture SET model_url = 'https://bdrvowacecxnraaivlhr.supabase.co/storage/v1/object/public/3d-models/e4200130-08e8-47da-8c92-3d0b90fafd77/d9830554-2688-4032-af40-acccda787ac4/3d-models/furniture/mannequin_torso_01.glb'
  WHERE store_id = v_store_id AND furniture_type = 'mannequin_torso_01';
  UPDATE furniture SET model_url = 'https://bdrvowacecxnraaivlhr.supabase.co/storage/v1/object/public/3d-models/e4200130-08e8-47da-8c92-3d0b90fafd77/d9830554-2688-4032-af40-acccda787ac4/3d-models/furniture/mannequin_torso_02.glb'
  WHERE store_id = v_store_id AND furniture_type = 'mannequin_torso_02';
  UPDATE furniture SET model_url = 'https://bdrvowacecxnraaivlhr.supabase.co/storage/v1/object/public/3d-models/e4200130-08e8-47da-8c92-3d0b90fafd77/d9830554-2688-4032-af40-acccda787ac4/3d-models/furniture/mannequin_torso_03.glb'
  WHERE store_id = v_store_id AND furniture_type = 'mannequin_torso_03';
  UPDATE furniture SET model_url = 'https://bdrvowacecxnraaivlhr.supabase.co/storage/v1/object/public/3d-models/e4200130-08e8-47da-8c92-3d0b90fafd77/d9830554-2688-4032-af40-acccda787ac4/3d-models/furniture/mannequin_torso_04.glb'
  WHERE store_id = v_store_id AND furniture_type = 'mannequin_torso_04';

  UPDATE furniture SET model_url = 'https://bdrvowacecxnraaivlhr.supabase.co/storage/v1/object/public/3d-models/e4200130-08e8-47da-8c92-3d0b90fafd77/d9830554-2688-4032-af40-acccda787ac4/3d-models/furniture/mirror_full_01.glb'
  WHERE store_id = v_store_id AND furniture_type = 'mirror_full_01';
  UPDATE furniture SET model_url = 'https://bdrvowacecxnraaivlhr.supabase.co/storage/v1/object/public/3d-models/e4200130-08e8-47da-8c92-3d0b90fafd77/d9830554-2688-4032-af40-acccda787ac4/3d-models/furniture/mirror_full_02.glb'
  WHERE store_id = v_store_id AND furniture_type = 'mirror_full_02';

  UPDATE furniture SET model_url = 'https://bdrvowacecxnraaivlhr.supabase.co/storage/v1/object/public/3d-models/e4200130-08e8-47da-8c92-3d0b90fafd77/d9830554-2688-4032-af40-acccda787ac4/3d-models/furniture/sign_size_01.glb'
  WHERE store_id = v_store_id AND furniture_type = 'sign_size_01';
  UPDATE furniture SET model_url = 'https://bdrvowacecxnraaivlhr.supabase.co/storage/v1/object/public/3d-models/e4200130-08e8-47da-8c92-3d0b90fafd77/d9830554-2688-4032-af40-acccda787ac4/3d-models/furniture/sign_size_02.glb'
  WHERE store_id = v_store_id AND furniture_type = 'sign_size_02';
  UPDATE furniture SET model_url = 'https://bdrvowacecxnraaivlhr.supabase.co/storage/v1/object/public/3d-models/e4200130-08e8-47da-8c92-3d0b90fafd77/d9830554-2688-4032-af40-acccda787ac4/3d-models/furniture/sign_size_03.glb'
  WHERE store_id = v_store_id AND furniture_type = 'sign_size_03';
  UPDATE furniture SET model_url = 'https://bdrvowacecxnraaivlhr.supabase.co/storage/v1/object/public/3d-models/e4200130-08e8-47da-8c92-3d0b90fafd77/d9830554-2688-4032-af40-acccda787ac4/3d-models/furniture/sign_size_04.glb'
  WHERE store_id = v_store_id AND furniture_type = 'sign_size_04';
  UPDATE furniture SET model_url = 'https://bdrvowacecxnraaivlhr.supabase.co/storage/v1/object/public/3d-models/e4200130-08e8-47da-8c92-3d0b90fafd77/d9830554-2688-4032-af40-acccda787ac4/3d-models/furniture/sign_size_05.glb'
  WHERE store_id = v_store_id AND furniture_type = 'sign_size_05';
  UPDATE furniture SET model_url = 'https://bdrvowacecxnraaivlhr.supabase.co/storage/v1/object/public/3d-models/e4200130-08e8-47da-8c92-3d0b90fafd77/d9830554-2688-4032-af40-acccda787ac4/3d-models/furniture/sign_size_06.glb'
  WHERE store_id = v_store_id AND furniture_type = 'sign_size_06';
  UPDATE furniture SET model_url = 'https://bdrvowacecxnraaivlhr.supabase.co/storage/v1/object/public/3d-models/e4200130-08e8-47da-8c92-3d0b90fafd77/d9830554-2688-4032-af40-acccda787ac4/3d-models/furniture/sign_size_07.glb'
  WHERE store_id = v_store_id AND furniture_type = 'sign_size_07';
  UPDATE furniture SET model_url = 'https://bdrvowacecxnraaivlhr.supabase.co/storage/v1/object/public/3d-models/e4200130-08e8-47da-8c92-3d0b90fafd77/d9830554-2688-4032-af40-acccda787ac4/3d-models/furniture/sign_size_08.glb'
  WHERE store_id = v_store_id AND furniture_type = 'sign_size_08';

  RAISE NOTICE '  ✓ Z003 의류존 가구 (26개)';

  -- Z004 액세서리존
  UPDATE furniture SET model_url = 'https://bdrvowacecxnraaivlhr.supabase.co/storage/v1/object/public/3d-models/e4200130-08e8-47da-8c92-3d0b90fafd77/d9830554-2688-4032-af40-acccda787ac4/3d-models/furniture/showcase_locked_01.glb'
  WHERE store_id = v_store_id AND furniture_type = 'showcase_locked_01';
  UPDATE furniture SET model_url = 'https://bdrvowacecxnraaivlhr.supabase.co/storage/v1/object/public/3d-models/e4200130-08e8-47da-8c92-3d0b90fafd77/d9830554-2688-4032-af40-acccda787ac4/3d-models/furniture/showcase_locked_02.glb'
  WHERE store_id = v_store_id AND furniture_type = 'showcase_locked_02';

  UPDATE furniture SET model_url = 'https://bdrvowacecxnraaivlhr.supabase.co/storage/v1/object/public/3d-models/e4200130-08e8-47da-8c92-3d0b90fafd77/d9830554-2688-4032-af40-acccda787ac4/3d-models/furniture/showcase_open_01.glb'
  WHERE store_id = v_store_id AND furniture_type = 'showcase_open_01';
  UPDATE furniture SET model_url = 'https://bdrvowacecxnraaivlhr.supabase.co/storage/v1/object/public/3d-models/e4200130-08e8-47da-8c92-3d0b90fafd77/d9830554-2688-4032-af40-acccda787ac4/3d-models/furniture/showcase_open_02.glb'
  WHERE store_id = v_store_id AND furniture_type = 'showcase_open_02';

  UPDATE furniture SET model_url = 'https://bdrvowacecxnraaivlhr.supabase.co/storage/v1/object/public/3d-models/e4200130-08e8-47da-8c92-3d0b90fafd77/d9830554-2688-4032-af40-acccda787ac4/3d-models/furniture/display_bag_01.glb'
  WHERE store_id = v_store_id AND furniture_type = 'display_bag_01';
  UPDATE furniture SET model_url = 'https://bdrvowacecxnraaivlhr.supabase.co/storage/v1/object/public/3d-models/e4200130-08e8-47da-8c92-3d0b90fafd77/d9830554-2688-4032-af40-acccda787ac4/3d-models/furniture/display_bag_02.glb'
  WHERE store_id = v_store_id AND furniture_type = 'display_bag_02';

  UPDATE furniture SET model_url = 'https://bdrvowacecxnraaivlhr.supabase.co/storage/v1/object/public/3d-models/e4200130-08e8-47da-8c92-3d0b90fafd77/d9830554-2688-4032-af40-acccda787ac4/3d-models/furniture/stand_accessory_01.glb'
  WHERE store_id = v_store_id AND furniture_type = 'stand_accessory_01';
  UPDATE furniture SET model_url = 'https://bdrvowacecxnraaivlhr.supabase.co/storage/v1/object/public/3d-models/e4200130-08e8-47da-8c92-3d0b90fafd77/d9830554-2688-4032-af40-acccda787ac4/3d-models/furniture/stand_accessory_02.glb'
  WHERE store_id = v_store_id AND furniture_type = 'stand_accessory_02';

  UPDATE furniture SET model_url = 'https://bdrvowacecxnraaivlhr.supabase.co/storage/v1/object/public/3d-models/e4200130-08e8-47da-8c92-3d0b90fafd77/d9830554-2688-4032-af40-acccda787ac4/3d-models/furniture/shelf_shoes_01.glb'
  WHERE store_id = v_store_id AND furniture_type = 'shelf_shoes_01';
  UPDATE furniture SET model_url = 'https://bdrvowacecxnraaivlhr.supabase.co/storage/v1/object/public/3d-models/e4200130-08e8-47da-8c92-3d0b90fafd77/d9830554-2688-4032-af40-acccda787ac4/3d-models/furniture/shelf_shoes_02.glb'
  WHERE store_id = v_store_id AND furniture_type = 'shelf_shoes_02';
  UPDATE furniture SET model_url = 'https://bdrvowacecxnraaivlhr.supabase.co/storage/v1/object/public/3d-models/e4200130-08e8-47da-8c92-3d0b90fafd77/d9830554-2688-4032-af40-acccda787ac4/3d-models/furniture/shelf_shoes_03.glb'
  WHERE store_id = v_store_id AND furniture_type = 'shelf_shoes_03';

  RAISE NOTICE '  ✓ Z004 액세서리존 가구 (11개)';

  -- Z005 피팅룸
  UPDATE furniture SET model_url = 'https://bdrvowacecxnraaivlhr.supabase.co/storage/v1/object/public/3d-models/e4200130-08e8-47da-8c92-3d0b90fafd77/d9830554-2688-4032-af40-acccda787ac4/3d-models/furniture/fitting_booth_01.glb'
  WHERE store_id = v_store_id AND furniture_type = 'fitting_booth_01';
  UPDATE furniture SET model_url = 'https://bdrvowacecxnraaivlhr.supabase.co/storage/v1/object/public/3d-models/e4200130-08e8-47da-8c92-3d0b90fafd77/d9830554-2688-4032-af40-acccda787ac4/3d-models/furniture/fitting_booth_02.glb'
  WHERE store_id = v_store_id AND furniture_type = 'fitting_booth_02';
  UPDATE furniture SET model_url = 'https://bdrvowacecxnraaivlhr.supabase.co/storage/v1/object/public/3d-models/e4200130-08e8-47da-8c92-3d0b90fafd77/d9830554-2688-4032-af40-acccda787ac4/3d-models/furniture/fitting_booth_03.glb'
  WHERE store_id = v_store_id AND furniture_type = 'fitting_booth_03';
  UPDATE furniture SET model_url = 'https://bdrvowacecxnraaivlhr.supabase.co/storage/v1/object/public/3d-models/e4200130-08e8-47da-8c92-3d0b90fafd77/d9830554-2688-4032-af40-acccda787ac4/3d-models/furniture/fitting_booth_04.glb'
  WHERE store_id = v_store_id AND furniture_type = 'fitting_booth_04';

  RAISE NOTICE '  ✓ Z005 피팅룸 가구 (4개)';

  -- Z006 계산대
  UPDATE furniture SET model_url = 'https://bdrvowacecxnraaivlhr.supabase.co/storage/v1/object/public/3d-models/e4200130-08e8-47da-8c92-3d0b90fafd77/d9830554-2688-4032-af40-acccda787ac4/3d-models/furniture/counter_checkout_01.glb'
  WHERE store_id = v_store_id AND furniture_type = 'counter_checkout_01';
  UPDATE furniture SET model_url = 'https://bdrvowacecxnraaivlhr.supabase.co/storage/v1/object/public/3d-models/e4200130-08e8-47da-8c92-3d0b90fafd77/d9830554-2688-4032-af40-acccda787ac4/3d-models/furniture/counter_checkout_02.glb'
  WHERE store_id = v_store_id AND furniture_type = 'counter_checkout_02';

  UPDATE furniture SET model_url = 'https://bdrvowacecxnraaivlhr.supabase.co/storage/v1/object/public/3d-models/e4200130-08e8-47da-8c92-3d0b90fafd77/d9830554-2688-4032-af40-acccda787ac4/3d-models/furniture/pos_terminal_01.glb'
  WHERE store_id = v_store_id AND furniture_type = 'pos_terminal_01';
  UPDATE furniture SET model_url = 'https://bdrvowacecxnraaivlhr.supabase.co/storage/v1/object/public/3d-models/e4200130-08e8-47da-8c92-3d0b90fafd77/d9830554-2688-4032-af40-acccda787ac4/3d-models/furniture/pos_terminal_02.glb'
  WHERE store_id = v_store_id AND furniture_type = 'pos_terminal_02';

  RAISE NOTICE '  ✓ Z006 계산대 가구 (4개)';

  -- Z007 휴식공간
  UPDATE furniture SET model_url = 'https://bdrvowacecxnraaivlhr.supabase.co/storage/v1/object/public/3d-models/e4200130-08e8-47da-8c92-3d0b90fafd77/d9830554-2688-4032-af40-acccda787ac4/3d-models/furniture/sofa_2seat_01.glb'
  WHERE store_id = v_store_id AND furniture_type = 'sofa_2seat_01';
  UPDATE furniture SET model_url = 'https://bdrvowacecxnraaivlhr.supabase.co/storage/v1/object/public/3d-models/e4200130-08e8-47da-8c92-3d0b90fafd77/d9830554-2688-4032-af40-acccda787ac4/3d-models/furniture/sofa_2seat_02.glb'
  WHERE store_id = v_store_id AND furniture_type = 'sofa_2seat_02';

  UPDATE furniture SET model_url = 'https://bdrvowacecxnraaivlhr.supabase.co/storage/v1/object/public/3d-models/e4200130-08e8-47da-8c92-3d0b90fafd77/d9830554-2688-4032-af40-acccda787ac4/3d-models/furniture/chair_lounge_01.glb'
  WHERE store_id = v_store_id AND furniture_type = 'chair_lounge_01';
  UPDATE furniture SET model_url = 'https://bdrvowacecxnraaivlhr.supabase.co/storage/v1/object/public/3d-models/e4200130-08e8-47da-8c92-3d0b90fafd77/d9830554-2688-4032-af40-acccda787ac4/3d-models/furniture/chair_lounge_02.glb'
  WHERE store_id = v_store_id AND furniture_type = 'chair_lounge_02';

  UPDATE furniture SET model_url = 'https://bdrvowacecxnraaivlhr.supabase.co/storage/v1/object/public/3d-models/e4200130-08e8-47da-8c92-3d0b90fafd77/d9830554-2688-4032-af40-acccda787ac4/3d-models/furniture/table_coffee_01.glb'
  WHERE store_id = v_store_id AND furniture_type = 'table_coffee_01';
  UPDATE furniture SET model_url = 'https://bdrvowacecxnraaivlhr.supabase.co/storage/v1/object/public/3d-models/e4200130-08e8-47da-8c92-3d0b90fafd77/d9830554-2688-4032-af40-acccda787ac4/3d-models/furniture/table_coffee_02.glb'
  WHERE store_id = v_store_id AND furniture_type = 'table_coffee_02';

  RAISE NOTICE '  ✓ Z007 휴식공간 가구 (6개)';
  RAISE NOTICE '  ✓ 전체 가구 모델 URL: 68개 완료';

  -- ═══════════════════════════════════════════════════════════════════════════
  -- 3. 상품 모델 URL (25개)
  -- ═══════════════════════════════════════════════════════════════════════════

  -- 아우터
  UPDATE products SET model_3d_url = 'https://bdrvowacecxnraaivlhr.supabase.co/storage/v1/object/public/3d-models/e4200130-08e8-47da-8c92-3d0b90fafd77/d9830554-2688-4032-af40-acccda787ac4/3d-models/product/product_coat.glb'
  WHERE sku = 'SKU-OUT-001';
  UPDATE products SET model_3d_url = 'https://bdrvowacecxnraaivlhr.supabase.co/storage/v1/object/public/3d-models/e4200130-08e8-47da-8c92-3d0b90fafd77/d9830554-2688-4032-af40-acccda787ac4/3d-models/product/product_jacket.glb'
  WHERE sku = 'SKU-OUT-002';

  -- 상의
  UPDATE products SET model_3d_url = 'https://bdrvowacecxnraaivlhr.supabase.co/storage/v1/object/public/3d-models/e4200130-08e8-47da-8c92-3d0b90fafd77/d9830554-2688-4032-af40-acccda787ac4/3d-models/product/product_blouse.glb'
  WHERE sku = 'SKU-TOP-001';
  UPDATE products SET model_3d_url = 'https://bdrvowacecxnraaivlhr.supabase.co/storage/v1/object/public/3d-models/e4200130-08e8-47da-8c92-3d0b90fafd77/d9830554-2688-4032-af40-acccda787ac4/3d-models/product/product_sweater.glb'
  WHERE sku = 'SKU-TOP-002';
  UPDATE products SET model_3d_url = 'https://bdrvowacecxnraaivlhr.supabase.co/storage/v1/object/public/3d-models/e4200130-08e8-47da-8c92-3d0b90fafd77/d9830554-2688-4032-af40-acccda787ac4/3d-models/product/product_shirt.glb'
  WHERE sku = 'SKU-TOP-003';
  UPDATE products SET model_3d_url = 'https://bdrvowacecxnraaivlhr.supabase.co/storage/v1/object/public/3d-models/e4200130-08e8-47da-8c92-3d0b90fafd77/d9830554-2688-4032-af40-acccda787ac4/3d-models/product/product_linen_top.glb'
  WHERE sku = 'SKU-TOP-004';

  -- 하의
  UPDATE products SET model_3d_url = 'https://bdrvowacecxnraaivlhr.supabase.co/storage/v1/object/public/3d-models/e4200130-08e8-47da-8c92-3d0b90fafd77/d9830554-2688-4032-af40-acccda787ac4/3d-models/product/product_denim.glb'
  WHERE sku = 'SKU-BTM-001';
  UPDATE products SET model_3d_url = 'https://bdrvowacecxnraaivlhr.supabase.co/storage/v1/object/public/3d-models/e4200130-08e8-47da-8c92-3d0b90fafd77/d9830554-2688-4032-af40-acccda787ac4/3d-models/product/product_chino.glb'
  WHERE sku = 'SKU-BTM-002';
  UPDATE products SET model_3d_url = 'https://bdrvowacecxnraaivlhr.supabase.co/storage/v1/object/public/3d-models/e4200130-08e8-47da-8c92-3d0b90fafd77/d9830554-2688-4032-af40-acccda787ac4/3d-models/product/product_skirt.glb'
  WHERE sku = 'SKU-BTM-003';

  -- 신발
  UPDATE products SET model_3d_url = 'https://bdrvowacecxnraaivlhr.supabase.co/storage/v1/object/public/3d-models/e4200130-08e8-47da-8c92-3d0b90fafd77/d9830554-2688-4032-af40-acccda787ac4/3d-models/product/product_loafer.glb'
  WHERE sku = 'SKU-SHO-001';
  UPDATE products SET model_3d_url = 'https://bdrvowacecxnraaivlhr.supabase.co/storage/v1/object/public/3d-models/e4200130-08e8-47da-8c92-3d0b90fafd77/d9830554-2688-4032-af40-acccda787ac4/3d-models/product/product_heels.glb'
  WHERE sku = 'SKU-SHO-002';
  UPDATE products SET model_3d_url = 'https://bdrvowacecxnraaivlhr.supabase.co/storage/v1/object/public/3d-models/e4200130-08e8-47da-8c92-3d0b90fafd77/d9830554-2688-4032-af40-acccda787ac4/3d-models/product/product_sneakers.glb'
  WHERE sku = 'SKU-SHO-003';

  -- 가방
  UPDATE products SET model_3d_url = 'https://bdrvowacecxnraaivlhr.supabase.co/storage/v1/object/public/3d-models/e4200130-08e8-47da-8c92-3d0b90fafd77/d9830554-2688-4032-af40-acccda787ac4/3d-models/product/product_tote.glb'
  WHERE sku = 'SKU-BAG-001';
  UPDATE products SET model_3d_url = 'https://bdrvowacecxnraaivlhr.supabase.co/storage/v1/object/public/3d-models/e4200130-08e8-47da-8c92-3d0b90fafd77/d9830554-2688-4032-af40-acccda787ac4/3d-models/product/product_crossbody.glb'
  WHERE sku = 'SKU-BAG-002';

  -- 액세서리
  UPDATE products SET model_3d_url = 'https://bdrvowacecxnraaivlhr.supabase.co/storage/v1/object/public/3d-models/e4200130-08e8-47da-8c92-3d0b90fafd77/d9830554-2688-4032-af40-acccda787ac4/3d-models/product/product_scarf.glb'
  WHERE sku = 'SKU-SCA-001';
  UPDATE products SET model_3d_url = 'https://bdrvowacecxnraaivlhr.supabase.co/storage/v1/object/public/3d-models/e4200130-08e8-47da-8c92-3d0b90fafd77/d9830554-2688-4032-af40-acccda787ac4/3d-models/product/product_belt.glb'
  WHERE sku = 'SKU-BLT-001';
  UPDATE products SET model_3d_url = 'https://bdrvowacecxnraaivlhr.supabase.co/storage/v1/object/public/3d-models/e4200130-08e8-47da-8c92-3d0b90fafd77/d9830554-2688-4032-af40-acccda787ac4/3d-models/product/product_watch.glb'
  WHERE sku = 'SKU-WAT-001';
  UPDATE products SET model_3d_url = 'https://bdrvowacecxnraaivlhr.supabase.co/storage/v1/object/public/3d-models/e4200130-08e8-47da-8c92-3d0b90fafd77/d9830554-2688-4032-af40-acccda787ac4/3d-models/product/product_necklace.glb'
  WHERE sku = 'SKU-JWL-001';
  UPDATE products SET model_3d_url = 'https://bdrvowacecxnraaivlhr.supabase.co/storage/v1/object/public/3d-models/e4200130-08e8-47da-8c92-3d0b90fafd77/d9830554-2688-4032-af40-acccda787ac4/3d-models/product/product_earring.glb'
  WHERE sku = 'SKU-JWL-002';

  -- 기타
  UPDATE products SET model_3d_url = 'https://bdrvowacecxnraaivlhr.supabase.co/storage/v1/object/public/3d-models/e4200130-08e8-47da-8c92-3d0b90fafd77/d9830554-2688-4032-af40-acccda787ac4/3d-models/product/product_underwear.glb'
  WHERE sku = 'SKU-UND-001';
  UPDATE products SET model_3d_url = 'https://bdrvowacecxnraaivlhr.supabase.co/storage/v1/object/public/3d-models/e4200130-08e8-47da-8c92-3d0b90fafd77/d9830554-2688-4032-af40-acccda787ac4/3d-models/product/product_socks.glb'
  WHERE sku = 'SKU-SOC-001';
  UPDATE products SET model_3d_url = 'https://bdrvowacecxnraaivlhr.supabase.co/storage/v1/object/public/3d-models/e4200130-08e8-47da-8c92-3d0b90fafd77/d9830554-2688-4032-af40-acccda787ac4/3d-models/product/product_hat.glb'
  WHERE sku = 'SKU-HAT-001';
  UPDATE products SET model_3d_url = 'https://bdrvowacecxnraaivlhr.supabase.co/storage/v1/object/public/3d-models/e4200130-08e8-47da-8c92-3d0b90fafd77/d9830554-2688-4032-af40-acccda787ac4/3d-models/product/product_sunglasses.glb'
  WHERE sku = 'SKU-GLS-001';
  UPDATE products SET model_3d_url = 'https://bdrvowacecxnraaivlhr.supabase.co/storage/v1/object/public/3d-models/e4200130-08e8-47da-8c92-3d0b90fafd77/d9830554-2688-4032-af40-acccda787ac4/3d-models/product/product_giftbox.glb'
  WHERE sku = 'SKU-GFT-001';
  UPDATE products SET model_3d_url = 'https://bdrvowacecxnraaivlhr.supabase.co/storage/v1/object/public/3d-models/e4200130-08e8-47da-8c92-3d0b90fafd77/d9830554-2688-4032-af40-acccda787ac4/3d-models/product/product_tshirt_stack.glb'
  WHERE sku = 'SKU-TSK-001';

  RAISE NOTICE '  ✓ 상품 모델 URL: 25개 완료';

  -- ═══════════════════════════════════════════════════════════════════════════
  -- 4. Staff 아바타 (8명) - EMP001~EMP008
  -- ═══════════════════════════════════════════════════════════════════════════

  -- 기존 staff 삭제 후 재생성
  DELETE FROM staff WHERE store_id = v_store_id;

  INSERT INTO staff (id, store_id, user_id, staff_code, staff_name, role, zone_id, avatar_url, avatar_position, is_active, created_at, updated_at) VALUES
  -- EMP001: 매니저 (Z002 메인홀)
  (gen_random_uuid(), v_store_id, v_user_id, 'EMP001', '매니저', 'manager', v_zone_main,
   'https://bdrvowacecxnraaivlhr.supabase.co/storage/v1/object/public/3d-models/e4200130-08e8-47da-8c92-3d0b90fafd77/d9830554-2688-4032-af40-acccda787ac4/3d-models/staff/avatar_manager_01.glb',
   '{"x": 0, "y": 0, "z": -2}'::jsonb, true, NOW(), NOW()),

  -- EMP002: 판매직원 1 (Z003 의류존)
  (gen_random_uuid(), v_store_id, v_user_id, 'EMP002', '판매직원 1', 'sales', v_zone_clothing,
   'https://bdrvowacecxnraaivlhr.supabase.co/storage/v1/object/public/3d-models/e4200130-08e8-47da-8c92-3d0b90fafd77/d9830554-2688-4032-af40-acccda787ac4/3d-models/staff/avatar_sales_01.glb',
   '{"x": -7, "y": 0, "z": -3}'::jsonb, true, NOW(), NOW()),

  -- EMP003: 판매직원 2 (Z004 액세서리존)
  (gen_random_uuid(), v_store_id, v_user_id, 'EMP003', '판매직원 2', 'sales', v_zone_accessory,
   'https://bdrvowacecxnraaivlhr.supabase.co/storage/v1/object/public/3d-models/e4200130-08e8-47da-8c92-3d0b90fafd77/d9830554-2688-4032-af40-acccda787ac4/3d-models/staff/avatar_sales_02.glb',
   '{"x": 6.5, "y": 0, "z": -3.5}'::jsonb, true, NOW(), NOW()),

  -- EMP004: 계산원 1 (Z006 계산대)
  (gen_random_uuid(), v_store_id, v_user_id, 'EMP004', '계산원 1', 'cashier', v_zone_checkout,
   'https://bdrvowacecxnraaivlhr.supabase.co/storage/v1/object/public/3d-models/e4200130-08e8-47da-8c92-3d0b90fafd77/d9830554-2688-4032-af40-acccda787ac4/3d-models/staff/avatar_cashier_01.glb',
   '{"x": 7, "y": 0, "z": 6.5}'::jsonb, true, NOW(), NOW()),

  -- EMP005: 계산원 2 (Z006 계산대)
  (gen_random_uuid(), v_store_id, v_user_id, 'EMP005', '계산원 2', 'cashier', v_zone_checkout,
   'https://bdrvowacecxnraaivlhr.supabase.co/storage/v1/object/public/3d-models/e4200130-08e8-47da-8c92-3d0b90fafd77/d9830554-2688-4032-af40-acccda787ac4/3d-models/staff/avatar_cashier_02.glb',
   '{"x": 7, "y": 0, "z": 5.5}'::jsonb, true, NOW(), NOW()),

  -- EMP006: 보안요원 (Z001 입구)
  (gen_random_uuid(), v_store_id, v_user_id, 'EMP006', '보안요원', 'security', v_zone_entrance,
   'https://bdrvowacecxnraaivlhr.supabase.co/storage/v1/object/public/3d-models/e4200130-08e8-47da-8c92-3d0b90fafd77/d9830554-2688-4032-af40-acccda787ac4/3d-models/staff/avatar_security_01.glb',
   '{"x": 0, "y": 0, "z": -8.5}'::jsonb, true, NOW(), NOW()),

  -- EMP007: 피팅룸 담당 (Z005 피팅룸)
  (gen_random_uuid(), v_store_id, v_user_id, 'EMP007', '피팅룸 담당', 'fitting', v_zone_fitting,
   'https://bdrvowacecxnraaivlhr.supabase.co/storage/v1/object/public/3d-models/e4200130-08e8-47da-8c92-3d0b90fafd77/d9830554-2688-4032-af40-acccda787ac4/3d-models/staff/avatar_fitting_01.glb',
   '{"x": -8.5, "y": 0, "z": 5}'::jsonb, true, NOW(), NOW()),

  -- EMP008: 안내직원 (Z001 입구)
  (gen_random_uuid(), v_store_id, v_user_id, 'EMP008', '안내직원', 'greeter', v_zone_entrance,
   'https://bdrvowacecxnraaivlhr.supabase.co/storage/v1/object/public/3d-models/e4200130-08e8-47da-8c92-3d0b90fafd77/d9830554-2688-4032-af40-acccda787ac4/3d-models/staff/avatar_greeter_01.glb',
   '{"x": 1.5, "y": 0, "z": -8}'::jsonb, true, NOW(), NOW());

  RAISE NOTICE '  ✓ Staff 아바타: 8명 완료';

  -- ═══════════════════════════════════════════════════════════════════════════
  -- Summary
  -- ═══════════════════════════════════════════════════════════════════════════
  RAISE NOTICE '';
  RAISE NOTICE '════════════════════════════════════════════════════════════════';
  RAISE NOTICE '      MVP_MODEL_URL_UPDATE3 Complete!                           ';
  RAISE NOTICE '════════════════════════════════════════════════════════════════';
  RAISE NOTICE '  전체 매장 모델: 1개 (store_20x20.glb)';
  RAISE NOTICE '  존별 모델: 7개 (zone_*.glb)';
  RAISE NOTICE '  가구 모델: 68개 (고유 타입)';
  RAISE NOTICE '  상품 모델: 25개';
  RAISE NOTICE '  Staff 아바타: 8명';
  RAISE NOTICE '════════════════════════════════════════════════════════════════';
END $$;


-- ════════════════════════════════════════════════════════════════════════════
-- MVP 상품-슬롯 배치 (v8.5 좌표 반영)
-- ════════════════════════════════════════════════════════════════════════════
-- 월드 좌표 = 가구 position + 슬롯 slot_position
-- ════════════════════════════════════════════════════════════════════════════

DO $$
DECLARE
  v_store_id UUID;
BEGIN
  SELECT id INTO v_store_id FROM stores LIMIT 1;

  RAISE NOTICE '';
  RAISE NOTICE '════════════════════════════════════════════════════════════════';
  RAISE NOTICE '      MVP Product-Slot Assignment (v8.5 좌표)                   ';
  RAISE NOTICE '════════════════════════════════════════════════════════════════';

  -- ═══════════════════════════════════════════════════════════════════════════
  -- 코트 → clothing_rack_double_01 (RACK-001) / H1-1
  -- 가구: (-8.5, 0, -2) + 슬롯: (-0.328, 1.38, 0.5) = (-8.828, 1.38, -1.5)
  -- ═══════════════════════════════════════════════════════════════════════════
  UPDATE products SET
    initial_furniture_id = 'b0000001-0000-0000-0000-000000000001'::UUID,
    slot_id = 'H1-1',
    model_3d_position = '{"x": -8.828, "y": 1.38, "z": -1.5}'::jsonb
  WHERE sku = 'SKU-OUT-001';

  UPDATE furniture_slots SET
    is_occupied = true,
    occupied_by_product_id = 'f0000001-0000-0000-0000-000000000000'::UUID
  WHERE furniture_id = 'b0000001-0000-0000-0000-000000000001'::UUID AND slot_id = 'H1-1';

  RAISE NOTICE '  ✓ SKU-OUT-001 (코트) → RACK-001 / H1-1';

  -- ═══════════════════════════════════════════════════════════════════════════
  -- 속옷세트(folded) → shelf_display_01 (SHELF-001) / S1-1
  -- 가구: (-8.5, 0, -4.8) + 슬롯: (-0.3, 0.96, 0) = (-8.8, 0.96, -4.8)
  -- ═══════════════════════════════════════════════════════════════════════════
  UPDATE products SET
    initial_furniture_id = 'b0000011-0000-0000-0000-000000000011'::UUID,
    slot_id = 'S1-1',
    model_3d_position = '{"x": -8.8, "y": 0.96, "z": -4.8}'::jsonb
  WHERE sku = 'SKU-UND-001';

  UPDATE furniture_slots SET
    is_occupied = true,
    occupied_by_product_id = 'f0000020-0000-0000-0000-000000000000'::UUID
  WHERE furniture_id = 'b0000011-0000-0000-0000-000000000011'::UUID AND slot_id = 'S1-1';

  RAISE NOTICE '  ✓ SKU-UND-001 (속옷세트) → SHELF-001 / S1-1';

  -- ═══════════════════════════════════════════════════════════════════════════
  -- 로퍼(standing) → shelf_shoes_01 (SHOE-001) / R1-1
  -- 가구: (5.8, 0, -5) + 슬롯: (-0.15, 0.2, 0) = (5.65, 0.2, -5)
  -- ═══════════════════════════════════════════════════════════════════════════
  UPDATE products SET
    initial_furniture_id = 'b0000031-0000-0000-0000-000000000031'::UUID,
    slot_id = 'R1-1',
    model_3d_position = '{"x": 5.65, "y": 0.2, "z": -5}'::jsonb
  WHERE sku = 'SKU-SHO-001';

  UPDATE furniture_slots SET
    is_occupied = true,
    occupied_by_product_id = 'f0000010-0000-0000-0000-000000000000'::UUID
  WHERE furniture_id = 'b0000031-0000-0000-0000-000000000031'::UUID AND slot_id = 'R1-1';

  RAISE NOTICE '  ✓ SKU-SHO-001 (로퍼) → SHOE-001 / R1-1';

  -- ═══════════════════════════════════════════════════════════════════════════
  -- 선물세트(boxed) → table_display_01 (TABLE-001) / T1-1
  -- 가구: (-8.5, 0, -5.7) + 슬롯: (-0.5, 0.76, 0.3) = (-9.0, 0.76, -5.4)
  -- ═══════════════════════════════════════════════════════════════════════════
  UPDATE products SET
    initial_furniture_id = 'b0000021-0000-0000-0000-000000000021'::UUID,
    slot_id = 'T1-1',
    model_3d_position = '{"x": -9.0, "y": 0.76, "z": -5.4}'::jsonb
  WHERE sku = 'SKU-GFT-001';

  UPDATE furniture_slots SET
    is_occupied = true,
    occupied_by_product_id = 'f0000024-0000-0000-0000-000000000000'::UUID
  WHERE furniture_id = 'b0000021-0000-0000-0000-000000000021'::UUID AND slot_id = 'T1-1';

  RAISE NOTICE '  ✓ SKU-GFT-001 (선물세트) → TABLE-001 / T1-1';

  -- ═══════════════════════════════════════════════════════════════════════════
  -- 티셔츠팩(stacked) → table_display_01 (TABLE-001) / T1-2
  -- 가구: (-8.5, 0, -5.7) + 슬롯: (0, 0.76, 0.3) = (-8.5, 0.76, -5.4)
  -- ═══════════════════════════════════════════════════════════════════════════
  UPDATE products SET
    initial_furniture_id = 'b0000021-0000-0000-0000-000000000021'::UUID,
    slot_id = 'T1-2',
    model_3d_position = '{"x": -8.5, "y": 0.76, "z": -5.4}'::jsonb
  WHERE sku = 'SKU-TSK-001';

  UPDATE furniture_slots SET
    is_occupied = true,
    occupied_by_product_id = 'f0000025-0000-0000-0000-000000000000'::UUID
  WHERE furniture_id = 'b0000021-0000-0000-0000-000000000021'::UUID AND slot_id = 'T1-2';

  RAISE NOTICE '  ✓ SKU-TSK-001 (티셔츠팩) → TABLE-001 / T1-2';

  RAISE NOTICE '';
  RAISE NOTICE '════════════════════════════════════════════════════════════════';
  RAISE NOTICE '  MVP 5개 상품 슬롯 배치 완료!';
  RAISE NOTICE '════════════════════════════════════════════════════════════════';
  RAISE NOTICE '  SKU-OUT-001 (코트)      → RACK-001  / H1-1  (-8.828, 1.38, -1.5)';
  RAISE NOTICE '  SKU-UND-001 (속옷세트)  → SHELF-001 / S1-1  (-8.8, 0.96, -4.8)';
  RAISE NOTICE '  SKU-SHO-001 (로퍼)      → SHOE-001  / R1-1  (5.65, 0.2, -5)';
  RAISE NOTICE '  SKU-GFT-001 (선물세트)  → TABLE-001 / T1-1  (-9.0, 0.76, -5.4)';
  RAISE NOTICE '  SKU-TSK-001 (티셔츠팩)  → TABLE-001 / T1-2  (-8.5, 0.76, -5.4)';
  RAISE NOTICE '════════════════════════════════════════════════════════════════';
END $$;


-- ════════════════════════════════════════════════════════════════════════════
-- 검증 쿼리
-- ════════════════════════════════════════════════════════════════════════════

-- 가구 모델 URL 확인
SELECT furniture_type, model_url IS NOT NULL as has_url FROM furniture ORDER BY furniture_type;

-- 상품 모델 URL 확인
SELECT sku, model_3d_url IS NOT NULL as has_url FROM products ORDER BY sku;

-- Staff 확인
SELECT staff_code, staff_name, role, avatar_url IS NOT NULL as has_avatar FROM staff ORDER BY staff_code;

-- 배치된 상품 확인
SELECT p.sku, p.slot_id, p.model_3d_position, fs.is_occupied
FROM products p
LEFT JOIN furniture_slots fs ON p.initial_furniture_id = fs.furniture_id AND p.slot_id = fs.slot_id
WHERE p.initial_furniture_id IS NOT NULL;
