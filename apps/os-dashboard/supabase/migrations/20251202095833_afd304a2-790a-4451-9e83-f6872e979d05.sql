
-- Fix the SELECT policy to completely avoid infinite recursion
-- by removing the subquery that references organization_members

DROP POLICY IF EXISTS "organization_members_select_policy" ON organization_members;

-- Create fully simplified SELECT policy without any subqueries
CREATE POLICY "organization_members_select_policy"
ON organization_members
FOR SELECT
TO authenticated
USING (
  user_id = auth.uid()
  OR auth.uid()::text = 'af316ab2-ffb5-4509-bd37-13aa31feb5ad' -- NEURALTWIN_MASTER
  OR auth.email() = 'neuraltwin.hq@neuraltwin.io' -- NEURALTWIN_MASTER by email
);
