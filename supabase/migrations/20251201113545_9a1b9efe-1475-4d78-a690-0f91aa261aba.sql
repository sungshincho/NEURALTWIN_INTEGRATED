-- Allow all authenticated users to view master account's ontology schema (v3.0)
-- This is necessary for schema synchronization feature

-- Drop existing SELECT policies for ontology_entity_types
DROP POLICY IF EXISTS "Org members can view org entity types" ON ontology_entity_types;

-- Create new SELECT policy that allows viewing own org entities AND master account entities
CREATE POLICY "Org members can view org entity types and master schema"
ON ontology_entity_types
FOR SELECT
USING (
  (
    (org_id IS NULL AND auth.uid() = user_id) 
    OR 
    (org_id IS NOT NULL AND is_org_member(auth.uid(), org_id))
  )
  OR
  -- Allow all authenticated users to view master account's schema
  (user_id = 'af316ab2-ffb5-4509-bd37-13aa31feb5ad'::uuid)
);

-- Drop existing SELECT policies for ontology_relation_types
DROP POLICY IF EXISTS "Org members can view org relation types" ON ontology_relation_types;

-- Create new SELECT policy that allows viewing own org relations AND master account relations
CREATE POLICY "Org members can view org relation types and master schema"
ON ontology_relation_types
FOR SELECT
USING (
  (
    (org_id IS NULL AND auth.uid() = user_id) 
    OR 
    (org_id IS NOT NULL AND is_org_member(auth.uid(), org_id))
  )
  OR
  -- Allow all authenticated users to view master account's schema
  (user_id = 'af316ab2-ffb5-4509-bd37-13aa31feb5ad'::uuid)
);