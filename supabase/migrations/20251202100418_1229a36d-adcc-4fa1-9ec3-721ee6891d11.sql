-- Remove recursive RLS policy on organization_members causing infinite recursion
DROP POLICY IF EXISTS "org_rls" ON organization_members;