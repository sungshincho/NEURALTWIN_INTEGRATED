-- =============================================================================
-- Migration: Add RLS policies for 100 unprotected tables
-- Sprint 1.3 | 2026-03-02
-- =============================================================================
-- Tables with RLS enabled but NO policies: 100
-- Already covered (10): organization_members, stores, subscriptions,
--   onboarding_progress, sample_data_templates, user_activity_logs,
--   quickstart_guides, user_guide_completions, chat_context_memory,
--   neuralsense_live_state
-- =============================================================================

-- ─────────────────────────────────────────────────────────────────────────────
-- SECTION 0: Helper functions (SECURITY DEFINER for RLS performance)
-- ─────────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.rls_user_org_ids()
RETURNS SETOF uuid
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = ''
AS $$
  SELECT om.org_id
  FROM public.organization_members om
  WHERE om.user_id = auth.uid()
$$;

CREATE OR REPLACE FUNCTION public.rls_user_store_ids()
RETURNS SETOF uuid
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = ''
AS $$
  SELECT s.id
  FROM public.stores s
  WHERE s.org_id IN (SELECT public.rls_user_org_ids())
$$;


-- ═════════════════════════════════════════════════════════════════════════════
-- CAT 1: org_id only — 7 tables
-- ═════════════════════════════════════════════════════════════════════════════

-- organizations (PK id = org_id equivalent)
CREATE POLICY "rls_organizations_select" ON public.organizations
  FOR SELECT TO authenticated
  USING (id IN (SELECT rls_user_org_ids()));
CREATE POLICY "rls_organizations_update" ON public.organizations
  FOR UPDATE TO authenticated
  USING (id IN (SELECT rls_user_org_ids()))
  WITH CHECK (id IN (SELECT rls_user_org_ids()));

-- organization_settings
CREATE POLICY "rls_organization_settings_all" ON public.organization_settings
  FOR ALL TO authenticated
  USING (org_id IN (SELECT rls_user_org_ids()))
  WITH CHECK (org_id IN (SELECT rls_user_org_ids()));

-- invitations
CREATE POLICY "rls_invitations_all" ON public.invitations
  FOR ALL TO authenticated
  USING (org_id IN (SELECT rls_user_org_ids()))
  WITH CHECK (org_id IN (SELECT rls_user_org_ids()));

-- licenses
CREATE POLICY "rls_licenses_all" ON public.licenses
  FOR ALL TO authenticated
  USING (org_id IN (SELECT rls_user_org_ids()))
  WITH CHECK (org_id IN (SELECT rls_user_org_ids()));

-- roi_measurements
CREATE POLICY "rls_roi_measurements_all" ON public.roi_measurements
  FOR ALL TO authenticated
  USING (org_id IN (SELECT rls_user_org_ids()))
  WITH CHECK (org_id IN (SELECT rls_user_org_ids()));

-- trend_signals (org_id nullable)
CREATE POLICY "rls_trend_signals_all" ON public.trend_signals
  FOR ALL TO authenticated
  USING (org_id IN (SELECT rls_user_org_ids()))
  WITH CHECK (org_id IN (SELECT rls_user_org_ids()));

-- api_sync_logs (org_id nullable)
CREATE POLICY "rls_api_sync_logs_all" ON public.api_sync_logs
  FOR ALL TO authenticated
  USING (org_id IN (SELECT rls_user_org_ids()))
  WITH CHECK (org_id IN (SELECT rls_user_org_ids()));


-- ═════════════════════════════════════════════════════════════════════════════
-- CAT 2: store_id only (no org_id, no user_id) — 6 tables
-- Access via org membership → store ownership
-- ═════════════════════════════════════════════════════════════════════════════

CREATE POLICY "rls_learning_sessions_all" ON public.learning_sessions
  FOR ALL TO authenticated
  USING (store_id IN (SELECT rls_user_store_ids()))
  WITH CHECK (store_id IN (SELECT rls_user_store_ids()));

CREATE POLICY "rls_prediction_records_all" ON public.prediction_records
  FOR ALL TO authenticated
  USING (store_id IN (SELECT rls_user_store_ids()))
  WITH CHECK (store_id IN (SELECT rls_user_store_ids()));

CREATE POLICY "rls_store_personas_all" ON public.store_personas
  FOR ALL TO authenticated
  USING (store_id IN (SELECT rls_user_store_ids()))
  WITH CHECK (store_id IN (SELECT rls_user_store_ids()));

CREATE POLICY "rls_stored_model_parameters_all" ON public.stored_model_parameters
  FOR ALL TO authenticated
  USING (store_id IN (SELECT rls_user_store_ids()))
  WITH CHECK (store_id IN (SELECT rls_user_store_ids()));

CREATE POLICY "rls_optimization_feedback_all" ON public.optimization_feedback
  FOR ALL TO authenticated
  USING (store_id IN (SELECT rls_user_store_ids()))
  WITH CHECK (store_id IN (SELECT rls_user_store_ids()));

CREATE POLICY "rls_vmd_rule_applications_all" ON public.vmd_rule_applications
  FOR ALL TO authenticated
  USING (store_id IN (SELECT rls_user_store_ids()))
  WITH CHECK (store_id IN (SELECT rls_user_store_ids()));


-- ═════════════════════════════════════════════════════════════════════════════
-- CAT 3: user_id = auth.uid() — 1 table
-- ═════════════════════════════════════════════════════════════════════════════

-- profiles (PK id = auth.uid())
CREATE POLICY "rls_profiles_select" ON public.profiles
  FOR SELECT TO authenticated
  USING (id = auth.uid());
CREATE POLICY "rls_profiles_update" ON public.profiles
  FOR UPDATE TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());
CREATE POLICY "rls_profiles_insert" ON public.profiles
  FOR INSERT TO authenticated
  WITH CHECK (id = auth.uid());


-- ═════════════════════════════════════════════════════════════════════════════
-- CAT 4: org_id + store_id (no user_id) — 22 tables
-- Primary access check: org membership
-- ═════════════════════════════════════════════════════════════════════════════

CREATE POLICY "rls_ai_model_performance_all" ON public.ai_model_performance
  FOR ALL TO authenticated
  USING (org_id IN (SELECT rls_user_org_ids()))
  WITH CHECK (org_id IN (SELECT rls_user_org_ids()));

CREATE POLICY "rls_customer_segments_agg_all" ON public.customer_segments_agg
  FOR ALL TO authenticated
  USING (org_id IN (SELECT rls_user_org_ids()))
  WITH CHECK (org_id IN (SELECT rls_user_org_ids()));

CREATE POLICY "rls_daily_kpis_agg_all" ON public.daily_kpis_agg
  FOR ALL TO authenticated
  USING (org_id IN (SELECT rls_user_org_ids()))
  WITH CHECK (org_id IN (SELECT rls_user_org_ids()));

CREATE POLICY "rls_data_sources_all" ON public.data_sources
  FOR ALL TO authenticated
  USING (org_id IN (SELECT rls_user_org_ids()))
  WITH CHECK (org_id IN (SELECT rls_user_org_ids()));

CREATE POLICY "rls_etl_runs_all" ON public.etl_runs
  FOR ALL TO authenticated
  USING (org_id IN (SELECT rls_user_org_ids()))
  WITH CHECK (org_id IN (SELECT rls_user_org_ids()));

CREATE POLICY "rls_funnel_events_all" ON public.funnel_events
  FOR ALL TO authenticated
  USING (org_id IN (SELECT rls_user_org_ids()))
  WITH CHECK (org_id IN (SELECT rls_user_org_ids()));

CREATE POLICY "rls_hourly_metrics_all" ON public.hourly_metrics
  FOR ALL TO authenticated
  USING (org_id IN (SELECT rls_user_org_ids()))
  WITH CHECK (org_id IN (SELECT rls_user_org_ids()));

CREATE POLICY "rls_inventory_movements_all" ON public.inventory_movements
  FOR ALL TO authenticated
  USING (org_id IN (SELECT rls_user_org_ids()))
  WITH CHECK (org_id IN (SELECT rls_user_org_ids()));

CREATE POLICY "rls_learning_adjustments_all" ON public.learning_adjustments
  FOR ALL TO authenticated
  USING (org_id IN (SELECT rls_user_org_ids()))
  WITH CHECK (org_id IN (SELECT rls_user_org_ids()));

CREATE POLICY "rls_line_items_all" ON public.line_items
  FOR ALL TO authenticated
  USING (org_id IN (SELECT rls_user_org_ids()))
  WITH CHECK (org_id IN (SELECT rls_user_org_ids()));

CREATE POLICY "rls_pos_integrations_all" ON public.pos_integrations
  FOR ALL TO authenticated
  USING (org_id IN (SELECT rls_user_org_ids()))
  WITH CHECK (org_id IN (SELECT rls_user_org_ids()));

CREATE POLICY "rls_product_performance_agg_all" ON public.product_performance_agg
  FOR ALL TO authenticated
  USING (org_id IN (SELECT rls_user_org_ids()))
  WITH CHECK (org_id IN (SELECT rls_user_org_ids()));

CREATE POLICY "rls_realtime_inventory_all" ON public.realtime_inventory
  FOR ALL TO authenticated
  USING (org_id IN (SELECT rls_user_org_ids()))
  WITH CHECK (org_id IN (SELECT rls_user_org_ids()));

CREATE POLICY "rls_recommendation_applications_all" ON public.recommendation_applications
  FOR ALL TO authenticated
  USING (org_id IN (SELECT rls_user_org_ids()))
  WITH CHECK (org_id IN (SELECT rls_user_org_ids()));

CREATE POLICY "rls_store_goals_all" ON public.store_goals
  FOR ALL TO authenticated
  USING (org_id IN (SELECT rls_user_org_ids()))
  WITH CHECK (org_id IN (SELECT rls_user_org_ids()));

CREATE POLICY "rls_store_trade_area_context_all" ON public.store_trade_area_context
  FOR ALL TO authenticated
  USING (org_id IN (SELECT rls_user_org_ids()))
  WITH CHECK (org_id IN (SELECT rls_user_org_ids()));

CREATE POLICY "rls_store_visits_all" ON public.store_visits
  FOR ALL TO authenticated
  USING (org_id IN (SELECT rls_user_org_ids()))
  WITH CHECK (org_id IN (SELECT rls_user_org_ids()));

CREATE POLICY "rls_strategy_feedback_all" ON public.strategy_feedback
  FOR ALL TO authenticated
  USING (org_id IN (SELECT rls_user_org_ids()))
  WITH CHECK (org_id IN (SELECT rls_user_org_ids()));

CREATE POLICY "rls_visit_zone_events_all" ON public.visit_zone_events
  FOR ALL TO authenticated
  USING (org_id IN (SELECT rls_user_org_ids()))
  WITH CHECK (org_id IN (SELECT rls_user_org_ids()));

CREATE POLICY "rls_zone_daily_metrics_all" ON public.zone_daily_metrics
  FOR ALL TO authenticated
  USING (org_id IN (SELECT rls_user_org_ids()))
  WITH CHECK (org_id IN (SELECT rls_user_org_ids()));

CREATE POLICY "rls_zone_events_all" ON public.zone_events
  FOR ALL TO authenticated
  USING (org_id IN (SELECT rls_user_org_ids()))
  WITH CHECK (org_id IN (SELECT rls_user_org_ids()));

CREATE POLICY "rls_zone_transitions_all" ON public.zone_transitions
  FOR ALL TO authenticated
  USING (store_id IN (SELECT rls_user_store_ids()))
  WITH CHECK (store_id IN (SELECT rls_user_store_ids()));


-- ═════════════════════════════════════════════════════════════════════════════
-- CAT 5: user_id + org_id (no store_id) — 12 tables
-- Access: org membership OR user owns record
-- ═════════════════════════════════════════════════════════════════════════════

CREATE POLICY "rls_auto_order_suggestions_all" ON public.auto_order_suggestions
  FOR ALL TO authenticated
  USING (org_id IN (SELECT rls_user_org_ids()) OR user_id = auth.uid())
  WITH CHECK (org_id IN (SELECT rls_user_org_ids()) OR user_id = auth.uid());

CREATE POLICY "rls_data_sync_logs_all" ON public.data_sync_logs
  FOR ALL TO authenticated
  USING (org_id IN (SELECT rls_user_org_ids()) OR user_id = auth.uid())
  WITH CHECK (org_id IN (SELECT rls_user_org_ids()) OR user_id = auth.uid());

CREATE POLICY "rls_data_sync_schedules_all" ON public.data_sync_schedules
  FOR ALL TO authenticated
  USING (org_id IN (SELECT rls_user_org_ids()) OR user_id = auth.uid())
  WITH CHECK (org_id IN (SELECT rls_user_org_ids()) OR user_id = auth.uid());

CREATE POLICY "rls_external_data_sources_all" ON public.external_data_sources
  FOR ALL TO authenticated
  USING (org_id IN (SELECT rls_user_org_ids()) OR user_id = auth.uid())
  WITH CHECK (org_id IN (SELECT rls_user_org_ids()) OR user_id = auth.uid());

CREATE POLICY "rls_inventory_levels_all" ON public.inventory_levels
  FOR ALL TO authenticated
  USING (org_id IN (SELECT rls_user_org_ids()) OR user_id = auth.uid())
  WITH CHECK (org_id IN (SELECT rls_user_org_ids()) OR user_id = auth.uid());

CREATE POLICY "rls_notification_settings_all" ON public.notification_settings
  FOR ALL TO authenticated
  USING (org_id IN (SELECT rls_user_org_ids()) OR user_id = auth.uid())
  WITH CHECK (org_id IN (SELECT rls_user_org_ids()) OR user_id = auth.uid());

CREATE POLICY "rls_ontology_mapping_cache_all" ON public.ontology_mapping_cache
  FOR ALL TO authenticated
  USING (org_id IN (SELECT rls_user_org_ids()) OR user_id = auth.uid())
  WITH CHECK (org_id IN (SELECT rls_user_org_ids()) OR user_id = auth.uid());

CREATE POLICY "rls_ontology_schema_versions_all" ON public.ontology_schema_versions
  FOR ALL TO authenticated
  USING (org_id IN (SELECT rls_user_org_ids()) OR user_id = auth.uid())
  WITH CHECK (org_id IN (SELECT rls_user_org_ids()) OR user_id = auth.uid());

CREATE POLICY "rls_ontology_entity_types_all" ON public.ontology_entity_types
  FOR ALL TO authenticated
  USING (org_id IN (SELECT rls_user_org_ids()) OR user_id = auth.uid())
  WITH CHECK (org_id IN (SELECT rls_user_org_ids()) OR user_id = auth.uid());

CREATE POLICY "rls_ontology_relation_types_all" ON public.ontology_relation_types
  FOR ALL TO authenticated
  USING (org_id IN (SELECT rls_user_org_ids()) OR user_id = auth.uid())
  WITH CHECK (org_id IN (SELECT rls_user_org_ids()) OR user_id = auth.uid());

-- economic_indicators (has is_global flag)
CREATE POLICY "rls_economic_indicators_select" ON public.economic_indicators
  FOR SELECT TO authenticated
  USING (is_global = true OR org_id IN (SELECT rls_user_org_ids()) OR user_id = auth.uid());
CREATE POLICY "rls_economic_indicators_write" ON public.economic_indicators
  FOR INSERT TO authenticated
  WITH CHECK (org_id IN (SELECT rls_user_org_ids()) OR user_id = auth.uid());
CREATE POLICY "rls_economic_indicators_update" ON public.economic_indicators
  FOR UPDATE TO authenticated
  USING (org_id IN (SELECT rls_user_org_ids()) OR user_id = auth.uid())
  WITH CHECK (org_id IN (SELECT rls_user_org_ids()) OR user_id = auth.uid());
CREATE POLICY "rls_economic_indicators_delete" ON public.economic_indicators
  FOR DELETE TO authenticated
  USING (org_id IN (SELECT rls_user_org_ids()) OR user_id = auth.uid());

-- regional_data (has is_global flag)
CREATE POLICY "rls_regional_data_select" ON public.regional_data
  FOR SELECT TO authenticated
  USING (is_global = true OR org_id IN (SELECT rls_user_org_ids()) OR user_id = auth.uid());
CREATE POLICY "rls_regional_data_write" ON public.regional_data
  FOR INSERT TO authenticated
  WITH CHECK (org_id IN (SELECT rls_user_org_ids()) OR user_id = auth.uid());
CREATE POLICY "rls_regional_data_update" ON public.regional_data
  FOR UPDATE TO authenticated
  USING (org_id IN (SELECT rls_user_org_ids()) OR user_id = auth.uid())
  WITH CHECK (org_id IN (SELECT rls_user_org_ids()) OR user_id = auth.uid());
CREATE POLICY "rls_regional_data_delete" ON public.regional_data
  FOR DELETE TO authenticated
  USING (org_id IN (SELECT rls_user_org_ids()) OR user_id = auth.uid());


-- ═════════════════════════════════════════════════════════════════════════════
-- CAT 5a-A: user_id NOT NULL + org_id nullable — 15 tables
-- Access: org membership OR user owns record
-- ═════════════════════════════════════════════════════════════════════════════

CREATE POLICY "rls_ai_recommendations_all" ON public.ai_recommendations
  FOR ALL TO authenticated
  USING (org_id IN (SELECT rls_user_org_ids()) OR user_id = auth.uid())
  WITH CHECK (org_id IN (SELECT rls_user_org_ids()) OR user_id = auth.uid());

CREATE POLICY "rls_analysis_history_all" ON public.analysis_history
  FOR ALL TO authenticated
  USING (org_id IN (SELECT rls_user_org_ids()) OR user_id = auth.uid())
  WITH CHECK (org_id IN (SELECT rls_user_org_ids()) OR user_id = auth.uid());

CREATE POLICY "rls_api_connections_all" ON public.api_connections
  FOR ALL TO authenticated
  USING (org_id IN (SELECT rls_user_org_ids()) OR user_id = auth.uid())
  WITH CHECK (org_id IN (SELECT rls_user_org_ids()) OR user_id = auth.uid());

CREATE POLICY "rls_customers_all" ON public.customers
  FOR ALL TO authenticated
  USING (org_id IN (SELECT rls_user_org_ids()) OR user_id = auth.uid())
  WITH CHECK (org_id IN (SELECT rls_user_org_ids()) OR user_id = auth.uid());

CREATE POLICY "rls_dashboard_kpis_all" ON public.dashboard_kpis
  FOR ALL TO authenticated
  USING (org_id IN (SELECT rls_user_org_ids()) OR user_id = auth.uid())
  WITH CHECK (org_id IN (SELECT rls_user_org_ids()) OR user_id = auth.uid());

CREATE POLICY "rls_funnel_metrics_all" ON public.funnel_metrics
  FOR ALL TO authenticated
  USING (org_id IN (SELECT rls_user_org_ids()) OR user_id = auth.uid())
  WITH CHECK (org_id IN (SELECT rls_user_org_ids()) OR user_id = auth.uid());

CREATE POLICY "rls_graph_relations_all" ON public.graph_relations
  FOR ALL TO authenticated
  USING (org_id IN (SELECT rls_user_org_ids()) OR user_id = auth.uid())
  WITH CHECK (org_id IN (SELECT rls_user_org_ids()) OR user_id = auth.uid());

CREATE POLICY "rls_model_3d_files_all" ON public.model_3d_files
  FOR ALL TO authenticated
  USING (org_id IN (SELECT rls_user_org_ids()) OR user_id = auth.uid())
  WITH CHECK (org_id IN (SELECT rls_user_org_ids()) OR user_id = auth.uid());

CREATE POLICY "rls_products_all" ON public.products
  FOR ALL TO authenticated
  USING (org_id IN (SELECT rls_user_org_ids()) OR user_id = auth.uid())
  WITH CHECK (org_id IN (SELECT rls_user_org_ids()) OR user_id = auth.uid());

CREATE POLICY "rls_purchases_all" ON public.purchases
  FOR ALL TO authenticated
  USING (org_id IN (SELECT rls_user_org_ids()) OR user_id = auth.uid())
  WITH CHECK (org_id IN (SELECT rls_user_org_ids()) OR user_id = auth.uid());

CREATE POLICY "rls_raw_imports_all" ON public.raw_imports
  FOR ALL TO authenticated
  USING (org_id IN (SELECT rls_user_org_ids()) OR user_id = auth.uid())
  WITH CHECK (org_id IN (SELECT rls_user_org_ids()) OR user_id = auth.uid());

CREATE POLICY "rls_store_scenes_all" ON public.store_scenes
  FOR ALL TO authenticated
  USING (org_id IN (SELECT rls_user_org_ids()) OR user_id = auth.uid())
  WITH CHECK (org_id IN (SELECT rls_user_org_ids()) OR user_id = auth.uid());

CREATE POLICY "rls_upload_sessions_all" ON public.upload_sessions
  FOR ALL TO authenticated
  USING (org_id IN (SELECT rls_user_org_ids()) OR user_id = auth.uid())
  WITH CHECK (org_id IN (SELECT rls_user_org_ids()) OR user_id = auth.uid());

CREATE POLICY "rls_user_data_imports_all" ON public.user_data_imports
  FOR ALL TO authenticated
  USING (org_id IN (SELECT rls_user_org_ids()) OR user_id = auth.uid())
  WITH CHECK (org_id IN (SELECT rls_user_org_ids()) OR user_id = auth.uid());

CREATE POLICY "rls_visits_all" ON public.visits
  FOR ALL TO authenticated
  USING (org_id IN (SELECT rls_user_org_ids()) OR user_id = auth.uid())
  WITH CHECK (org_id IN (SELECT rls_user_org_ids()) OR user_id = auth.uid());


-- ═════════════════════════════════════════════════════════════════════════════
-- CAT 5a-B: store_id NOT NULL, org_id/user_id nullable — 9 tables
-- Access via store ownership (derived from org membership)
-- ═════════════════════════════════════════════════════════════════════════════

CREATE POLICY "rls_furniture_all" ON public.furniture
  FOR ALL TO authenticated
  USING (store_id IN (SELECT rls_user_store_ids()))
  WITH CHECK (store_id IN (SELECT rls_user_store_ids()));

CREATE POLICY "rls_furniture_slots_all" ON public.furniture_slots
  FOR ALL TO authenticated
  USING (store_id IN (SELECT rls_user_store_ids()))
  WITH CHECK (store_id IN (SELECT rls_user_store_ids()));

CREATE POLICY "rls_layout_optimization_results_all" ON public.layout_optimization_results
  FOR ALL TO authenticated
  USING (store_id IN (SELECT rls_user_store_ids()))
  WITH CHECK (store_id IN (SELECT rls_user_store_ids()));

CREATE POLICY "rls_optimization_tasks_all" ON public.optimization_tasks
  FOR ALL TO authenticated
  USING (store_id IN (SELECT rls_user_store_ids()))
  WITH CHECK (store_id IN (SELECT rls_user_store_ids()));

CREATE POLICY "rls_product_associations_all" ON public.product_associations
  FOR ALL TO authenticated
  USING (store_id IN (SELECT rls_user_store_ids()))
  WITH CHECK (store_id IN (SELECT rls_user_store_ids()));

CREATE POLICY "rls_product_placements_all" ON public.product_placements
  FOR ALL TO authenticated
  USING (store_id IN (SELECT rls_user_store_ids()))
  WITH CHECK (store_id IN (SELECT rls_user_store_ids()));

CREATE POLICY "rls_simulation_history_all" ON public.simulation_history
  FOR ALL TO authenticated
  USING (store_id IN (SELECT rls_user_store_ids()))
  WITH CHECK (store_id IN (SELECT rls_user_store_ids()));

CREATE POLICY "rls_staff_assignments_all" ON public.staff_assignments
  FOR ALL TO authenticated
  USING (store_id IN (SELECT rls_user_store_ids()))
  WITH CHECK (store_id IN (SELECT rls_user_store_ids()));

CREATE POLICY "rls_zones_dim_all" ON public.zones_dim
  FOR ALL TO authenticated
  USING (store_id IN (SELECT rls_user_store_ids()))
  WITH CHECK (store_id IN (SELECT rls_user_store_ids()));


-- ═════════════════════════════════════════════════════════════════════════════
-- CAT 5a-C: org_id NOT NULL (with store/user nullable) — 2 tables
-- ═════════════════════════════════════════════════════════════════════════════

CREATE POLICY "rls_applied_strategies_all" ON public.applied_strategies
  FOR ALL TO authenticated
  USING (org_id IN (SELECT rls_user_org_ids()))
  WITH CHECK (org_id IN (SELECT rls_user_org_ids()));

CREATE POLICY "rls_user_alerts_all" ON public.user_alerts
  FOR ALL TO authenticated
  USING (org_id IN (SELECT rls_user_org_ids()))
  WITH CHECK (org_id IN (SELECT rls_user_org_ids()));


-- ═════════════════════════════════════════════════════════════════════════════
-- CAT 5a-D: All three columns nullable — 4 tables
-- Access: org membership OR user owns record
-- ═════════════════════════════════════════════════════════════════════════════

CREATE POLICY "rls_ai_inference_results_all" ON public.ai_inference_results
  FOR ALL TO authenticated
  USING (org_id IN (SELECT rls_user_org_ids()) OR user_id = auth.uid())
  WITH CHECK (org_id IN (SELECT rls_user_org_ids()) OR user_id = auth.uid());

CREATE POLICY "rls_graph_entities_all" ON public.graph_entities
  FOR ALL TO authenticated
  USING (org_id IN (SELECT rls_user_org_ids()) OR user_id = auth.uid())
  WITH CHECK (org_id IN (SELECT rls_user_org_ids()) OR user_id = auth.uid());

CREATE POLICY "rls_staff_all" ON public.staff
  FOR ALL TO authenticated
  USING (org_id IN (SELECT rls_user_org_ids()) OR user_id = auth.uid())
  WITH CHECK (org_id IN (SELECT rls_user_org_ids()) OR user_id = auth.uid());

CREATE POLICY "rls_transactions_all" ON public.transactions
  FOR ALL TO authenticated
  USING (org_id IN (SELECT rls_user_org_ids()) OR user_id = auth.uid())
  WITH CHECK (org_id IN (SELECT rls_user_org_ids()) OR user_id = auth.uid());


-- ═════════════════════════════════════════════════════════════════════════════
-- CAT 5a-E: Special cases — 6 tables
-- ═════════════════════════════════════════════════════════════════════════════

-- ai_response_logs: NO org_id, store_id NOT NULL, user_id nullable
CREATE POLICY "rls_ai_response_logs_all" ON public.ai_response_logs
  FOR ALL TO authenticated
  USING (store_id IN (SELECT rls_user_store_ids()) OR user_id = auth.uid())
  WITH CHECK (store_id IN (SELECT rls_user_store_ids()) OR user_id = auth.uid());

-- chat_conversations: NO org_id, user_id nullable, store_id nullable
-- Edge Functions use service_role for writes; authenticated users read their own
CREATE POLICY "rls_chat_conversations_select" ON public.chat_conversations
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());
CREATE POLICY "rls_chat_conversations_insert" ON public.chat_conversations
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());
CREATE POLICY "rls_chat_conversations_update" ON public.chat_conversations
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- holidays_events (is_global flag, all nullable)
CREATE POLICY "rls_holidays_events_select" ON public.holidays_events
  FOR SELECT TO authenticated
  USING (is_global = true OR org_id IN (SELECT rls_user_org_ids()) OR user_id = auth.uid());
CREATE POLICY "rls_holidays_events_write" ON public.holidays_events
  FOR INSERT TO authenticated
  WITH CHECK (org_id IN (SELECT rls_user_org_ids()) OR user_id = auth.uid());
CREATE POLICY "rls_holidays_events_update" ON public.holidays_events
  FOR UPDATE TO authenticated
  USING (org_id IN (SELECT rls_user_org_ids()) OR user_id = auth.uid())
  WITH CHECK (org_id IN (SELECT rls_user_org_ids()) OR user_id = auth.uid());
CREATE POLICY "rls_holidays_events_delete" ON public.holidays_events
  FOR DELETE TO authenticated
  USING (org_id IN (SELECT rls_user_org_ids()) OR user_id = auth.uid());

-- weather_data (is_global flag, all nullable)
CREATE POLICY "rls_weather_data_select" ON public.weather_data
  FOR SELECT TO authenticated
  USING (is_global = true OR org_id IN (SELECT rls_user_org_ids()) OR user_id = auth.uid());
CREATE POLICY "rls_weather_data_write" ON public.weather_data
  FOR INSERT TO authenticated
  WITH CHECK (org_id IN (SELECT rls_user_org_ids()) OR user_id = auth.uid());
CREATE POLICY "rls_weather_data_update" ON public.weather_data
  FOR UPDATE TO authenticated
  USING (org_id IN (SELECT rls_user_org_ids()) OR user_id = auth.uid())
  WITH CHECK (org_id IN (SELECT rls_user_org_ids()) OR user_id = auth.uid());
CREATE POLICY "rls_weather_data_delete" ON public.weather_data
  FOR DELETE TO authenticated
  USING (org_id IN (SELECT rls_user_org_ids()) OR user_id = auth.uid());

-- wifi_tracking (user NOT NULL, org nullable, store NOT NULL)
CREATE POLICY "rls_wifi_tracking_all" ON public.wifi_tracking
  FOR ALL TO authenticated
  USING (store_id IN (SELECT rls_user_store_ids()) OR user_id = auth.uid())
  WITH CHECK (store_id IN (SELECT rls_user_store_ids()) OR user_id = auth.uid());

-- wifi_zones (user NOT NULL, org nullable, store NOT NULL)
CREATE POLICY "rls_wifi_zones_all" ON public.wifi_zones
  FOR ALL TO authenticated
  USING (store_id IN (SELECT rls_user_store_ids()) OR user_id = auth.uid())
  WITH CHECK (store_id IN (SELECT rls_user_store_ids()) OR user_id = auth.uid());


-- ═════════════════════════════════════════════════════════════════════════════
-- CAT 6: FK-based access (no direct org/store/user) — 8 tables
-- Access cascaded from parent table
-- ═════════════════════════════════════════════════════════════════════════════

-- chat_events → chat_conversations.conversation_id
CREATE POLICY "rls_chat_events_all" ON public.chat_events
  FOR ALL TO authenticated
  USING (conversation_id IN (
    SELECT id FROM public.chat_conversations WHERE user_id = auth.uid()
  ))
  WITH CHECK (conversation_id IN (
    SELECT id FROM public.chat_conversations WHERE user_id = auth.uid()
  ));

-- chat_messages → chat_conversations.conversation_id
CREATE POLICY "rls_chat_messages_all" ON public.chat_messages
  FOR ALL TO authenticated
  USING (conversation_id IN (
    SELECT id FROM public.chat_conversations WHERE user_id = auth.uid()
  ))
  WITH CHECK (conversation_id IN (
    SELECT id FROM public.chat_conversations WHERE user_id = auth.uid()
  ));

-- chat_leads → chat_conversations.conversation_id (PII — restrict to service_role)
-- Authenticated users can only see leads from their own conversations
CREATE POLICY "rls_chat_leads_select" ON public.chat_leads
  FOR SELECT TO authenticated
  USING (conversation_id IN (
    SELECT id FROM public.chat_conversations WHERE user_id = auth.uid()
  ));

-- data_source_sync_logs → data_sources.data_source_id
CREATE POLICY "rls_data_source_sync_logs_all" ON public.data_source_sync_logs
  FOR ALL TO authenticated
  USING (data_source_id IN (
    SELECT id FROM public.data_sources WHERE org_id IN (SELECT rls_user_org_ids())
  ))
  WITH CHECK (data_source_id IN (
    SELECT id FROM public.data_sources WHERE org_id IN (SELECT rls_user_org_ids())
  ));

-- data_source_tables → data_sources.data_source_id
CREATE POLICY "rls_data_source_tables_all" ON public.data_source_tables
  FOR ALL TO authenticated
  USING (data_source_id IN (
    SELECT id FROM public.data_sources WHERE org_id IN (SELECT rls_user_org_ids())
  ))
  WITH CHECK (data_source_id IN (
    SELECT id FROM public.data_sources WHERE org_id IN (SELECT rls_user_org_ids())
  ));

-- ontology_entity_mappings → data_sources.data_source_id
CREATE POLICY "rls_ontology_entity_mappings_all" ON public.ontology_entity_mappings
  FOR ALL TO authenticated
  USING (data_source_id IN (
    SELECT id FROM public.data_sources WHERE org_id IN (SELECT rls_user_org_ids())
  ))
  WITH CHECK (data_source_id IN (
    SELECT id FROM public.data_sources WHERE org_id IN (SELECT rls_user_org_ids())
  ));

-- ontology_relation_mappings → data_sources.data_source_id
CREATE POLICY "rls_ontology_relation_mappings_all" ON public.ontology_relation_mappings
  FOR ALL TO authenticated
  USING (data_source_id IN (
    SELECT id FROM public.data_sources WHERE org_id IN (SELECT rls_user_org_ids())
  ))
  WITH CHECK (data_source_id IN (
    SELECT id FROM public.data_sources WHERE org_id IN (SELECT rls_user_org_ids())
  ));

-- product_models → products.product_id
CREATE POLICY "rls_product_models_all" ON public.product_models
  FOR ALL TO authenticated
  USING (product_id IN (
    SELECT id FROM public.products
    WHERE org_id IN (SELECT rls_user_org_ids()) OR user_id = auth.uid()
  ))
  WITH CHECK (product_id IN (
    SELECT id FROM public.products
    WHERE org_id IN (SELECT rls_user_org_ids()) OR user_id = auth.uid()
  ));


-- ═════════════════════════════════════════════════════════════════════════════
-- CAT 7: System/reference tables — 8 tables
-- Read-only for authenticated, writes via service_role only
-- ═════════════════════════════════════════════════════════════════════════════

-- ai_batch_test_results: internal testing, service_role only
CREATE POLICY "rls_ai_batch_test_results_select" ON public.ai_batch_test_results
  FOR SELECT TO authenticated
  USING (false);  -- service_role bypasses RLS

-- api_mapping_templates: read-only reference
CREATE POLICY "rls_api_mapping_templates_select" ON public.api_mapping_templates
  FOR SELECT TO authenticated
  USING (true);

-- contact_submissions: public form → anon INSERT, service_role reads
CREATE POLICY "rls_contact_submissions_insert" ON public.contact_submissions
  FOR INSERT TO anon
  WITH CHECK (true);
CREATE POLICY "rls_contact_submissions_auth_insert" ON public.contact_submissions
  FOR INSERT TO authenticated
  WITH CHECK (true);

-- feedback_reason_codes: read-only reference
CREATE POLICY "rls_feedback_reason_codes_select" ON public.feedback_reason_codes
  FOR SELECT TO authenticated
  USING (true);

-- retail_concepts: read-only knowledge base
CREATE POLICY "rls_retail_concepts_select" ON public.retail_concepts
  FOR SELECT TO authenticated
  USING (true);

-- retail_knowledge_chunks: read-only knowledge base
CREATE POLICY "rls_retail_knowledge_chunks_select" ON public.retail_knowledge_chunks
  FOR SELECT TO authenticated
  USING (true);

-- v_org_id: utility/helper table, service_role only
CREATE POLICY "rls_v_org_id_select" ON public.v_org_id
  FOR SELECT TO authenticated
  USING (false);  -- service_role bypasses RLS

-- vmd_rulesets: read-only reference for all authenticated users
CREATE POLICY "rls_vmd_rulesets_select" ON public.vmd_rulesets
  FOR SELECT TO authenticated
  USING (true);


-- ═════════════════════════════════════════════════════════════════════════════
-- PERFORMANCE: Indexes for RLS helper function queries
-- ═════════════════════════════════════════════════════════════════════════════

CREATE INDEX IF NOT EXISTS idx_org_members_user_id
  ON public.organization_members (user_id);

CREATE INDEX IF NOT EXISTS idx_stores_org_id
  ON public.stores (org_id);

-- High-traffic tables: ensure org_id/store_id/user_id are indexed
CREATE INDEX IF NOT EXISTS idx_daily_kpis_agg_org_id
  ON public.daily_kpis_agg (org_id);
CREATE INDEX IF NOT EXISTS idx_hourly_metrics_org_id
  ON public.hourly_metrics (org_id);
CREATE INDEX IF NOT EXISTS idx_zone_events_org_id
  ON public.zone_events (org_id);
CREATE INDEX IF NOT EXISTS idx_store_visits_org_id
  ON public.store_visits (org_id);
CREATE INDEX IF NOT EXISTS idx_transactions_org_id
  ON public.transactions (org_id);
CREATE INDEX IF NOT EXISTS idx_wifi_tracking_store_id
  ON public.wifi_tracking (store_id);
CREATE INDEX IF NOT EXISTS idx_chat_conversations_user_id
  ON public.chat_conversations (user_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_conversation_id
  ON public.chat_messages (conversation_id);
