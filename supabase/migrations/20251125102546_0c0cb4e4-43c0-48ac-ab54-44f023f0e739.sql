-- Drop the existing check constraint that blocks signup
ALTER TABLE organization_members 
DROP CONSTRAINT IF EXISTS org_members_role_license_check;

-- Create a more flexible check constraint
-- Allow null license_id during signup, will be assigned after payment
ALTER TABLE organization_members
ADD CONSTRAINT org_members_role_license_check CHECK (
  -- ORG_VIEWER must have null license_id
  (role = 'ORG_VIEWER' AND license_id IS NULL)
  OR
  -- ORG_HQ and ORG_STORE can have null license_id (during signup before payment)
  -- or must have a valid license_id after payment
  (role IN ('ORG_HQ', 'ORG_STORE'))
  OR
  -- NEURALTWIN_MASTER doesn't need license
  (role = 'NEURALTWIN_MASTER')
);