
-- =============================================
-- SECURITY FIX: Remove all qual:true policies and harden org_rls
-- =============================================

-- 1. Enable RLS on tables missing it
ALTER TABLE public.api_mapping_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.import_type_schemas ENABLE ROW LEVEL SECURITY;

-- Add read-only policies for api_mapping_templates (reference data)
CREATE POLICY "Authenticated users can read mapping templates"
  ON public.api_mapping_templates FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- Add read-only policies for import_type_schemas (reference data)
CREATE POLICY "Authenticated users can read import schemas"
  ON public.import_type_schemas FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- 2. Drop all qual:true (fully open) policies
DROP POLICY IF EXISTS "Users can manage graph_entities" ON public.graph_entities;
DROP POLICY IF EXISTS "Users can manage graph_relations" ON public.graph_relations;
DROP POLICY IF EXISTS "Users can manage recommendation_applications" ON public.recommendation_applications;
DROP POLICY IF EXISTS "Users can view store_visits" ON public.store_visits;
DROP POLICY IF EXISTS "Users can view store transactions" ON public.transactions;
DROP POLICY IF EXISTS "Users can manage zones_dim" ON public.zones_dim;
DROP POLICY IF EXISTS "layout_optimization_results_select_policy" ON public.layout_optimization_results;
DROP POLICY IF EXISTS "layout_optimization_results_insert_policy" ON public.layout_optimization_results;
DROP POLICY IF EXISTS "layout_optimization_results_update_policy" ON public.layout_optimization_results;
DROP POLICY IF EXISTS "learning_sessions_all_policy" ON public.learning_sessions;
DROP POLICY IF EXISTS "Service role can manage inference queue" ON public.ontology_relation_inference_queue;

-- 3. Replace org_rls policies that allow unauthenticated access (org_id IS NULL without auth check)
-- Fix customers org_rls
DROP POLICY IF EXISTS "org_rls" ON public.customers;
CREATE POLICY "org_rls" ON public.customers FOR ALL
  USING (
    auth.uid() IS NOT NULL AND (
      org_id IS NULL OR is_org_member(auth.uid(), org_id)
    )
  );

-- Fix graph_entities org_rls
DROP POLICY IF EXISTS "org_rls" ON public.graph_entities;
CREATE POLICY "org_rls" ON public.graph_entities FOR ALL
  USING (
    auth.uid() IS NOT NULL AND (
      org_id IS NULL OR EXISTS (
        SELECT 1 FROM organization_members om
        WHERE om.user_id = auth.uid() AND om.org_id = graph_entities.org_id
      )
    )
  )
  WITH CHECK (
    auth.uid() IS NOT NULL AND (
      org_id IS NULL OR EXISTS (
        SELECT 1 FROM organization_members om
        WHERE om.user_id = auth.uid() AND om.org_id = graph_entities.org_id
      )
    )
  );

-- Fix graph_relations org_rls
DROP POLICY IF EXISTS "org_rls" ON public.graph_relations;
CREATE POLICY "org_rls" ON public.graph_relations FOR ALL
  USING (
    auth.uid() IS NOT NULL AND (
      org_id IS NULL OR EXISTS (
        SELECT 1 FROM organization_members om
        WHERE om.user_id = auth.uid() AND om.org_id = graph_relations.org_id
      )
    )
  )
  WITH CHECK (
    auth.uid() IS NOT NULL AND (
      org_id IS NULL OR EXISTS (
        SELECT 1 FROM organization_members om
        WHERE om.user_id = auth.uid() AND om.org_id = graph_relations.org_id
      )
    )
  );

-- Fix store_visits org_rls
DROP POLICY IF EXISTS "org_rls" ON public.store_visits;
CREATE POLICY "org_rls" ON public.store_visits FOR ALL
  USING (
    auth.uid() IS NOT NULL AND (
      org_id IS NULL OR is_org_member(auth.uid(), org_id)
    )
  );

-- Fix transactions org_rls
DROP POLICY IF EXISTS "org_rls" ON public.transactions;
CREATE POLICY "org_rls" ON public.transactions FOR ALL
  USING (
    auth.uid() IS NOT NULL AND (
      org_id IS NULL OR is_org_member(auth.uid(), org_id)
    )
  );

-- Fix zones_dim org_rls
DROP POLICY IF EXISTS "org_rls" ON public.zones_dim;
CREATE POLICY "org_rls" ON public.zones_dim FOR ALL
  USING (
    auth.uid() IS NOT NULL AND (
      org_id IS NULL OR is_org_member(auth.uid(), org_id)
    )
  );

-- Fix ontology_relation_inference_queue org_rls
DROP POLICY IF EXISTS "org_rls" ON public.ontology_relation_inference_queue;
CREATE POLICY "org_rls" ON public.ontology_relation_inference_queue FOR ALL
  USING (
    auth.uid() IS NOT NULL AND (
      org_id IS NULL OR EXISTS (
        SELECT 1 FROM organization_members om
        WHERE om.user_id = auth.uid() AND om.org_id = ontology_relation_inference_queue.org_id
      )
    )
  )
  WITH CHECK (
    auth.uid() IS NOT NULL AND (
      org_id IS NULL OR EXISTS (
        SELECT 1 FROM organization_members om
        WHERE om.user_id = auth.uid() AND om.org_id = ontology_relation_inference_queue.org_id
      )
    )
  );

-- 4. Add proper policy for learning_sessions (replace qual:true)
CREATE POLICY "Authenticated users can manage learning_sessions"
  ON public.learning_sessions FOR ALL
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

-- 5. Harden SECURITY DEFINER function: handover_chat_session
CREATE OR REPLACE FUNCTION public.handover_chat_session(
  p_session_id TEXT,
  p_user_id UUID
) RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  updated_count INTEGER;
BEGIN
  -- SECURITY: Verify p_user_id matches authenticated user
  IF p_user_id IS DISTINCT FROM auth.uid() THEN
    RAISE EXCEPTION 'Cannot handover session to different user';
  END IF;

  UPDATE chat_conversations
  SET user_id = p_user_id, updated_at = now()
  WHERE session_id = p_session_id
    AND user_id IS NULL
    AND channel = 'website';

  GET DIAGNOSTICS updated_count = ROW_COUNT;
  RETURN updated_count;
END;
$$;
