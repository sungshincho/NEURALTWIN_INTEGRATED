-- ============================================
-- NEURALTWIN 최소 샘플 데이터 생성 스크립트
-- User: 조성신 (Sungshin Cho)
-- Organization: TCAG
-- Role: ORG_HQ
-- ============================================

-- STEP 1: Supabase Auth UI에서 먼저 사용자 생성 필요
-- Email: brrrshin@gmail.com
-- Password: whtjdtls94

DO $$
DECLARE
  v_user_id UUID;
  v_org_id UUID;
  v_subscription_id UUID;
  v_hq_license_id UUID;
BEGIN
  -- 사용자 ID 조회
  SELECT id INTO v_user_id FROM auth.users WHERE email = 'brrrshin@gmail.com' LIMIT 1;
  
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION '❌ User not found! Supabase Auth UI에서 먼저 사용자를 생성하세요: brrrshin@gmail.com';
  END IF;

  RAISE NOTICE '✓ User ID: %', v_user_id;

  -- STEP 2: 프로필 생성/업데이트
  INSERT INTO public.profiles (id, display_name, avatar_url)
  VALUES (v_user_id, '조성신', NULL)
  ON CONFLICT (id) 
  DO UPDATE SET 
    display_name = EXCLUDED.display_name,
    updated_at = now();

  RAISE NOTICE '✓ Profile: 조성신';

  -- STEP 3: 조직 생성 (TCAG)
  -- 기존 조직 확인
  SELECT id INTO v_org_id FROM public.organizations WHERE org_name = 'TCAG' LIMIT 1;
  
  -- 조직이 없으면 생성
  IF v_org_id IS NULL THEN
    INSERT INTO public.organizations (org_name, created_by, metadata)
    VALUES (
      'TCAG',
      v_user_id,
      jsonb_build_object(
        'country', 'South Korea',
        'industry', 'Retail',
        'company_size', 'medium'
      )
    )
    RETURNING id INTO v_org_id;
  END IF;

  RAISE NOTICE '✓ Organization: TCAG (ID: %)', v_org_id;

  -- STEP 4: 구독 생성 (HQ 라이선스 1개만)
  INSERT INTO public.subscriptions (
    org_id,
    subscription_type,
    status,
    hq_license_count,
    store_license_count,
    viewer_count,
    monthly_cost,
    billing_cycle,
    current_period_start,
    current_period_end
  )
  VALUES (
    v_org_id,
    'LICENSE_BASED',
    'active',
    1,  -- HQ 라이선스 1개
    0,  -- Store 라이선스 0개
    0,  -- Viewer 0명
    500.00,  -- 1 × 500
    'monthly',
    date_trunc('month', now()),
    date_trunc('month', now()) + interval '1 month'
  )
  RETURNING id INTO v_subscription_id;

  RAISE NOTICE '✓ Subscription: LICENSE_BASED (월 ₩500,000)';

  -- STEP 5: HQ 라이선스 생성
  INSERT INTO public.licenses (
    org_id,
    subscription_id,
    license_type,
    license_key,
    status,
    monthly_price,
    effective_date,
    next_billing_date,
    assigned_to,
    activated_at
  )
  VALUES (
    v_org_id,
    v_subscription_id,
    'HQ_SEAT',
    'NT-HQ-' || substring(gen_random_uuid()::text, 1, 8),
    'active',
    500.00,
    current_date,
    date_trunc('month', now()) + interval '1 month',
    v_user_id,
    now()
  )
  RETURNING id INTO v_hq_license_id;

  RAISE NOTICE '✓ HQ License assigned to 조성신';

  -- STEP 6: 조직 멤버 생성 (ORG_HQ 역할)
  INSERT INTO public.organization_members (
    org_id,
    user_id,
    role,
    license_id,
    permissions
  )
  VALUES (
    v_org_id,
    v_user_id,
    'ORG_HQ',
    v_hq_license_id,
    jsonb_build_object(
      'canInvite', true,
      'canExport', true,
      'features', ARRAY['all']
    )
  )
  ON CONFLICT (user_id, org_id) 
  DO UPDATE SET 
    role = EXCLUDED.role,
    license_id = EXCLUDED.license_id,
    permissions = EXCLUDED.permissions,
    updated_at = now();

  RAISE NOTICE '✓ Organization Member: ORG_HQ role assigned';

  RAISE NOTICE '';
  RAISE NOTICE '===========================================';
  RAISE NOTICE '✅ 샘플 데이터 생성 완료!';
  RAISE NOTICE '===========================================';
  RAISE NOTICE 'Email: brrrshin@gmail.com';
  RAISE NOTICE 'Name: 조성신';
  RAISE NOTICE 'Organization: TCAG';
  RAISE NOTICE 'Role: ORG_HQ';
  RAISE NOTICE 'Subscription: Active (월 ₩500,000)';
  RAISE NOTICE 'License: HQ_SEAT (Assigned)';
  RAISE NOTICE '===========================================';
  RAISE NOTICE '';
  RAISE NOTICE '이제 웹사이트에서 로그인하세요:';
  RAISE NOTICE 'https://your-website.com/auth';
  
END $$;
