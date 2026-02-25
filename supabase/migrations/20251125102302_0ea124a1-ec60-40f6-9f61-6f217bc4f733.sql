-- Drop problematic policies that cause infinite recursion
DROP POLICY IF EXISTS "hq_view_members" ON organization_members;
DROP POLICY IF EXISTS "hq_manage_members" ON organization_members;
DROP POLICY IF EXISTS "view_own_orgs" ON organizations;
DROP POLICY IF EXISTS "hq_update_org" ON organizations;

-- Create security definer function to check user's role safely
CREATE OR REPLACE FUNCTION public.get_user_role(_user_id uuid)
RETURNS app_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role
  FROM public.organization_members
  WHERE user_id = _user_id
  LIMIT 1;
$$;

-- Recreate organizations policies without recursion
CREATE POLICY "users_view_their_orgs"
ON organizations FOR SELECT
TO authenticated
USING (
  created_by = auth.uid()
  OR
  id IN (SELECT org_id FROM organization_members WHERE user_id = auth.uid())
);

CREATE POLICY "hq_can_update_org"
ON organizations FOR UPDATE
TO authenticated
USING (
  public.get_user_role(auth.uid()) IN ('ORG_HQ', 'NEURALTWIN_MASTER')
);

-- Recreate organization_members policies with security definer function
CREATE POLICY "hq_can_view_all_members"
ON organization_members FOR SELECT
TO authenticated
USING (
  user_id = auth.uid()
  OR
  public.get_user_role(auth.uid()) IN ('ORG_HQ', 'NEURALTWIN_MASTER')
);

CREATE POLICY "hq_can_manage_all_members"
ON organization_members FOR INSERT
TO authenticated
WITH CHECK (
  user_id = auth.uid()
  OR
  public.get_user_role(auth.uid()) IN ('ORG_HQ', 'NEURALTWIN_MASTER')
);

CREATE POLICY "hq_can_update_members"
ON organization_members FOR UPDATE
TO authenticated
USING (
  public.get_user_role(auth.uid()) IN ('ORG_HQ', 'NEURALTWIN_MASTER')
);

CREATE POLICY "hq_can_delete_members"
ON organization_members FOR DELETE
TO authenticated
USING (
  public.get_user_role(auth.uid()) IN ('ORG_HQ', 'NEURALTWIN_MASTER')
);