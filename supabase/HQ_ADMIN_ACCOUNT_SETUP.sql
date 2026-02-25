-- ============================================================================
-- HQ Admin 계정 설정
-- 새 Supabase 프로젝트용 (bdrvowacecxnraaivlhr)
-- ============================================================================
-- 
-- 실행 전 필수 단계:
-- 1. Supabase Dashboard → Authentication → Users로 이동
-- 2. "Add User" → "Create New User" 클릭
-- 3. Email: neuraltwin.hq@neuraltwin.io
-- 4. Password: neuraltwin0708
-- 5. "Auto Confirm User" 체크 (이메일 확인 생략)
-- 6. 생성 후 User ID를 복사
-- 7. 아래 SQL의 '<USER_ID_HERE>'를 복사한 User ID로 교체
-- 
-- ============================================================================

-- Step 1: HQ Admin 계정을 organization_members에 추가
-- NEURALTWIN_ADMIN 역할은 조직에 속하지 않으므로 org_id는 NULL
INSERT INTO public.organization_members (
  user_id,
  org_id,
  role,
  permissions
)
VALUES (
  '<USER_ID_HERE>'::uuid,  -- ← 여기에 생성된 User ID 입력
  NULL,  -- NEURALTWIN_ADMIN은 조직에 속하지 않음
  'NEURALTWIN_ADMIN',
  '{"full_access": true, "can_manage_all_orgs": true, "can_view_analytics": true}'::jsonb
)
ON CONFLICT (user_id, org_id) DO UPDATE
SET role = 'NEURALTWIN_ADMIN',
    permissions = '{"full_access": true, "can_manage_all_orgs": true, "can_view_analytics": true}'::jsonb;

-- Step 2: 확인 쿼리 (선택사항)
-- 생성된 HQ Admin 계정 확인
SELECT 
  om.id,
  om.user_id,
  om.role,
  om.permissions,
  om.created_at,
  u.email
FROM public.organization_members om
JOIN auth.users u ON u.id = om.user_id
WHERE om.role = 'NEURALTWIN_ADMIN';

-- ============================================================================
-- 참고: 추가 HQ Admin 계정이 필요한 경우
-- ============================================================================
-- 
-- 동일한 방식으로 Supabase Dashboard에서 사용자를 생성한 후
-- 위의 INSERT 문을 실행하여 NEURALTWIN_ADMIN 역할을 부여하세요.
-- 
-- ============================================================================
