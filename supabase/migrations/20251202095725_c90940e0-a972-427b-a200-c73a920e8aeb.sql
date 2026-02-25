
-- Fix infinite recursion in organization_members RLS policies
-- by using SECURITY DEFINER functions with direct user_id checks

-- Drop existing problematic policies
DROP POLICY IF EXISTS "Users can view own organization membership" ON organization_members;
DROP POLICY IF EXISTS "Users can insert own membership" ON organization_members;
DROP POLICY IF EXISTS "Users can update own membership" ON organization_members;
DROP POLICY IF EXISTS "Users can view members of their organizations" ON organization_members;
DROP POLICY IF EXISTS "Organization admins can manage members" ON organization_members;
DROP POLICY IF EXISTS "Members can view their organization" ON organization_members;
DROP POLICY IF EXISTS "Admins can manage organization members" ON organization_members;

-- Create simplified SELECT policy with master account check
CREATE POLICY "organization_members_select_policy"
ON organization_members
FOR SELECT
TO authenticated
USING (
  user_id = auth.uid()
  OR org_id IN (
    SELECT org_id 
    FROM organization_members 
    WHERE user_id = auth.uid()
  )
  OR auth.uid()::text = 'af316ab2-ffb5-4509-bd37-13aa31feb5ad' -- NEURALTWIN_MASTER
  OR auth.email() = 'neuraltwin.hq@neuraltwin.io' -- NEURALTWIN_MASTER by email
);

-- Create simplified INSERT policy
CREATE POLICY "organization_members_insert_policy"
ON organization_members
FOR INSERT
TO authenticated
WITH CHECK (
  user_id = auth.uid()
  OR auth.uid()::text = 'af316ab2-ffb5-4509-bd37-13aa31feb5ad' -- NEURALTWIN_MASTER
  OR auth.email() = 'neuraltwin.hq@neuraltwin.io' -- NEURALTWIN_MASTER by email
);

-- Create simplified UPDATE policy
CREATE POLICY "organization_members_update_policy"
ON organization_members
FOR UPDATE
TO authenticated
USING (
  user_id = auth.uid()
  OR auth.uid()::text = 'af316ab2-ffb5-4509-bd37-13aa31feb5ad' -- NEURALTWIN_MASTER
  OR auth.email() = 'neuraltwin.hq@neuraltwin.io' -- NEURALTWIN_MASTER by email
)
WITH CHECK (
  user_id = auth.uid()
  OR auth.uid()::text = 'af316ab2-ffb5-4509-bd37-13aa31feb5ad' -- NEURALTWIN_MASTER
  OR auth.email() = 'neuraltwin.hq@neuraltwin.io' -- NEURALTWIN_MASTER by email
);

-- Create simplified DELETE policy
CREATE POLICY "organization_members_delete_policy"
ON organization_members
FOR DELETE
TO authenticated
USING (
  auth.uid()::text = 'af316ab2-ffb5-4509-bd37-13aa31feb5ad' -- NEURALTWIN_MASTER only
  OR auth.email() = 'neuraltwin.hq@neuraltwin.io' -- NEURALTWIN_MASTER by email
);
