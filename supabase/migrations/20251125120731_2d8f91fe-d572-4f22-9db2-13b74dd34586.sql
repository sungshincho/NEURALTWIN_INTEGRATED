-- Drop existing problematic RLS policies on organization_members
DROP POLICY IF EXISTS "Users can view their own membership" ON organization_members;
DROP POLICY IF EXISTS "Users can view memberships in their orgs" ON organization_members;
DROP POLICY IF EXISTS "Org admins can insert members" ON organization_members;
DROP POLICY IF EXISTS "Org admins can update members" ON organization_members;
DROP POLICY IF EXISTS "Org admins can delete members" ON organization_members;
DROP POLICY IF EXISTS "Master account can manage all memberships" ON organization_members;

-- Create simple SECURITY DEFINER function to check if user can access membership
CREATE OR REPLACE FUNCTION can_access_membership(membership_user_id UUID, membership_org_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  -- Allow if user is the member themselves
  IF auth.uid() = membership_user_id THEN
    RETURN TRUE;
  END IF;
  
  -- Allow if user is system master account
  IF EXISTS (
    SELECT 1 FROM auth.users 
    WHERE id = auth.uid() 
    AND email = 'neuraltwin.hq@neuraltwin.io'
  ) THEN
    RETURN TRUE;
  END IF;
  
  -- Allow if user is in the same organization
  -- Use direct query without triggering RLS
  IF EXISTS (
    SELECT 1 FROM organization_members om
    WHERE om.user_id = auth.uid()
    AND om.org_id = membership_org_id
  ) THEN
    RETURN TRUE;
  END IF;
  
  RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create simple SECURITY DEFINER function to check if user is org admin
CREATE OR REPLACE FUNCTION is_org_admin_simple(check_org_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  -- System master account has admin access
  IF EXISTS (
    SELECT 1 FROM auth.users 
    WHERE id = auth.uid() 
    AND email = 'neuraltwin.hq@neuraltwin.io'
  ) THEN
    RETURN TRUE;
  END IF;
  
  -- Check if user has admin role in org
  RETURN EXISTS (
    SELECT 1 FROM organization_members om
    WHERE om.user_id = auth.uid()
    AND om.org_id = check_org_id
    AND om.role IN ('ORG_OWNER', 'ORG_ADMIN', 'ORG_HQ')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create simplified RLS policies using SECURITY DEFINER functions
CREATE POLICY "Users can view accessible memberships"
  ON organization_members FOR SELECT
  USING (can_access_membership(user_id, org_id));

CREATE POLICY "Org admins can insert members"
  ON organization_members FOR INSERT
  WITH CHECK (is_org_admin_simple(org_id));

CREATE POLICY "Org admins can update members"
  ON organization_members FOR UPDATE
  USING (is_org_admin_simple(org_id));

CREATE POLICY "Org admins can delete members"
  ON organization_members FOR DELETE
  USING (is_org_admin_simple(org_id));