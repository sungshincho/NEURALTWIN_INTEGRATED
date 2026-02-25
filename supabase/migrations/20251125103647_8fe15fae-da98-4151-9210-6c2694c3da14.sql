-- Fix infinite recursion in RLS policies for organization_members
-- 1) Drop existing policies that reference organization_members indirectly (via functions) or directly

DROP POLICY "Allow authenticated users to view org members" ON public.organization_members;
DROP POLICY "NEURALTWIN_ADMIN can add members" ON public.organization_members;
DROP POLICY "NEURALTWIN_ADMIN can remove members" ON public.organization_members;
DROP POLICY "NEURALTWIN_ADMIN can update members" ON public.organization_members;
DROP POLICY "ORG_VIEWER must be invited" ON public.organization_members;
DROP POLICY "create_own_membership" ON public.organization_members;
DROP POLICY "hq_can_delete_members" ON public.organization_members;
DROP POLICY "hq_can_manage_all_members" ON public.organization_members;
DROP POLICY "hq_can_update_members" ON public.organization_members;
DROP POLICY "hq_can_view_all_members" ON public.organization_members;
DROP POLICY "view_own_membership" ON public.organization_members;

-- 유지: 라이선스 검증 관련 정책들은 organization_members를 서브쿼리로 다시 조회하지 않으므로 그대로 둡니다
--   "ORG_HQ must have valid HQ license"
--   "ORG_STORE must have valid Store license"

-- 2) 안전하고 단순한 기본 RLS 정책 재정의
-- 각 사용자는 자신의 멤버십 행만 접근 가능하고,
-- 특수 운영 계정(NeuralTwin HQ 이메일)은 모든 행을 관리할 수 있도록 허용

-- SELECT: 자기 자신의 멤버십만 조회 (예외: 시스템 마스터 계정)
CREATE POLICY "org_members_select_own_or_master" 
ON public.organization_members
FOR SELECT
TO authenticated
USING (
  user_id = auth.uid()
  OR auth.jwt()->>'email' = 'neuraltwin.hq@neuraltwin.io'
);

-- INSERT: 자기 자신의 멤버십만 생성 가능 (예외: 시스템 마스터 계정)
CREATE POLICY "org_members_insert_own_or_master" 
ON public.organization_members
FOR INSERT
TO authenticated
WITH CHECK (
  user_id = auth.uid()
  OR auth.jwt()->>'email' = 'neuraltwin.hq@neuraltwin.io'
);

-- UPDATE: 자기 자신의 멤버십만 수정 가능 (예외: 시스템 마스터 계정)
CREATE POLICY "org_members_update_own_or_master" 
ON public.organization_members
FOR UPDATE
TO authenticated
USING (
  user_id = auth.uid()
  OR auth.jwt()->>'email' = 'neuraltwin.hq@neuraltwin.io'
)
WITH CHECK (
  user_id = auth.uid()
  OR auth.jwt()->>'email' = 'neuraltwin.hq@neuraltwin.io'
);

-- DELETE: 자기 자신의 멤버십만 삭제 가능 (예외: 시스템 마스터 계정)
CREATE POLICY "org_members_delete_own_or_master" 
ON public.organization_members
FOR DELETE
TO authenticated
USING (
  user_id = auth.uid()
  OR auth.jwt()->>'email' = 'neuraltwin.hq@neuraltwin.io'
);
