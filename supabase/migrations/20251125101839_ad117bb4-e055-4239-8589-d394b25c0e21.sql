-- Drop ALL existing policies on organizations and organization_members tables

-- Organizations table policies
DROP POLICY IF EXISTS "Authenticated users can create organizations" ON organizations;
DROP POLICY IF EXISTS "Members can view their organizations" ON organizations;
DROP POLICY IF EXISTS "HQ members can update organizations" ON organizations;
DROP POLICY IF EXISTS "Users can create organizations" ON organizations;
DROP POLICY IF EXISTS "Organization members can view their organization" ON organizations;
DROP POLICY IF EXISTS "Organization owners can update their organization" ON organizations;
DROP POLICY IF EXISTS "NEURALTWIN admins have full access to organizations" ON organizations;
DROP POLICY IF EXISTS "Org members can view their org" ON organizations;
DROP POLICY IF EXISTS "Org owners can update their org" ON organizations;

-- Organization_members table policies  
DROP POLICY IF EXISTS "Users can view own memberships" ON organization_members;
DROP POLICY IF EXISTS "Users can create own memberships" ON organization_members;
DROP POLICY IF EXISTS "HQ members can manage memberships" ON organization_members;
DROP POLICY IF EXISTS "Users can view their organization memberships" ON organization_members;
DROP POLICY IF EXISTS "Users can create their organization memberships" ON organization_members;
DROP POLICY IF EXISTS "Org members can view members" ON organization_members;
DROP POLICY IF EXISTS "Org admins can manage members" ON organization_members;

-- Create simple, non-recursive policies

-- Organizations: Allow authenticated users to create (for signup)
CREATE POLICY "signup_create_org"
ON organizations FOR INSERT
TO authenticated
WITH CHECK (created_by = auth.uid());

-- Organizations: Allow users to view orgs where they are direct members
CREATE POLICY "view_own_orgs"
ON organizations FOR SELECT
TO authenticated
USING (
  id IN (SELECT org_id FROM organization_members WHERE user_id = auth.uid())
);

-- Organizations: Allow HQ/MASTER to update
CREATE POLICY "hq_update_org"
ON organizations FOR UPDATE
TO authenticated
USING (
  id IN (
    SELECT org_id FROM organization_members 
    WHERE user_id = auth.uid() AND role IN ('ORG_HQ', 'NEURALTWIN_MASTER')
  )
);

-- Organization_members: Users can view their own membership
CREATE POLICY "view_own_membership"
ON organization_members FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Organization_members: Users can create own membership (for signup)
CREATE POLICY "create_own_membership"
ON organization_members FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

-- Organization_members: HQ can view all org members
CREATE POLICY "hq_view_members"
ON organization_members FOR SELECT
TO authenticated
USING (
  org_id IN (
    SELECT org_id FROM organization_members 
    WHERE user_id = auth.uid() AND role IN ('ORG_HQ', 'NEURALTWIN_MASTER')
  )
);

-- Organization_members: HQ can manage members
CREATE POLICY "hq_manage_members"
ON organization_members FOR ALL
TO authenticated
USING (
  org_id IN (
    SELECT org_id FROM organization_members 
    WHERE user_id = auth.uid() AND role IN ('ORG_HQ', 'NEURALTWIN_MASTER')
  )
);