
-- NEURALTWIN_MASTER 역할이 모든 조직에 대해 멤버/관리자 권한을 갖도록 함수 수정

-- is_org_member 함수 업데이트: NEURALTWIN_MASTER는 모든 조직의 멤버로 인정
CREATE OR REPLACE FUNCTION public.is_org_member(_user_id uuid, _org_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.organization_members
    WHERE user_id = _user_id
      AND (org_id = _org_id OR role = 'NEURALTWIN_MASTER')
  )
$$;

-- is_org_admin 함수 업데이트: NEURALTWIN_MASTER는 모든 조직의 관리자로 인정
CREATE OR REPLACE FUNCTION public.is_org_admin(_user_id uuid, _org_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.organization_members
    WHERE user_id = _user_id
      AND (
        (org_id = _org_id AND role IN ('ORG_HQ', 'ORG_ADMIN')) 
        OR role = 'NEURALTWIN_MASTER'
      )
  )
$$;

-- is_org_owner 함수 업데이트: NEURALTWIN_MASTER는 모든 조직의 소유자로 인정
CREATE OR REPLACE FUNCTION public.is_org_owner(_user_id uuid, _org_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.organization_members
    WHERE user_id = _user_id
      AND (
        (org_id = _org_id AND role = 'ORG_HQ')
        OR role = 'NEURALTWIN_MASTER'
      )
  )
$$;

-- is_org_member_simple 함수 업데이트
CREATE OR REPLACE FUNCTION public.is_org_member_simple(_user_id uuid, _org_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.organization_members
    WHERE user_id = _user_id
      AND (org_id = _org_id OR role = 'NEURALTWIN_MASTER')
  )
$$;

-- is_org_member_with_license 함수 업데이트
CREATE OR REPLACE FUNCTION public.is_org_member_with_license(_user_id uuid, _org_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.organization_members
    WHERE user_id = _user_id
      AND (org_id = _org_id OR role = 'NEURALTWIN_MASTER')
  )
$$;

-- is_org_admin_simple 함수 업데이트
CREATE OR REPLACE FUNCTION public.is_org_admin_simple(check_org_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- NEURALTWIN_MASTER 체크
  IF EXISTS (
    SELECT 1 FROM organization_members
    WHERE user_id = auth.uid()
    AND role = 'NEURALTWIN_MASTER'
  ) THEN
    RETURN TRUE;
  END IF;
  
  -- 일반 관리자 체크
  RETURN EXISTS (
    SELECT 1 FROM organization_members om
    WHERE om.user_id = auth.uid()
    AND om.org_id = check_org_id
    AND om.role IN ('ORG_OWNER', 'ORG_ADMIN', 'ORG_HQ')
  );
END;
$$;

-- get_user_orgs 함수 업데이트: NEURALTWIN_MASTER는 모든 조직 반환
CREATE OR REPLACE FUNCTION public.get_user_orgs(_user_id uuid)
RETURNS TABLE(org_id uuid)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- NEURALTWIN_MASTER는 모든 조직 반환
  IF EXISTS (
    SELECT 1 FROM organization_members
    WHERE user_id = _user_id
    AND role = 'NEURALTWIN_MASTER'
  ) THEN
    RETURN QUERY SELECT o.id FROM organizations o;
  ELSE
    -- 일반 사용자는 자신의 조직만 반환
    RETURN QUERY
    SELECT om.org_id
    FROM organization_members om
    WHERE om.user_id = _user_id;
  END IF;
END;
$$;

COMMENT ON FUNCTION public.is_org_member IS 'NEURALTWIN_MASTER role has access to all organizations';
COMMENT ON FUNCTION public.is_org_admin IS 'NEURALTWIN_MASTER role has admin access to all organizations';
COMMENT ON FUNCTION public.is_org_owner IS 'NEURALTWIN_MASTER role has owner access to all organizations';
