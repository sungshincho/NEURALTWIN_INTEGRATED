-- Auto-generated schema dump from production (bdrvowacecxnraaivlhr)
-- Generated: 2026-02-27

-- ============================================
-- EXTENSIONS (must be before tables that use vector types)
-- ============================================

CREATE EXTENSION IF NOT EXISTS vector WITH SCHEMA public;
CREATE EXTENSION IF NOT EXISTS pg_trgm WITH SCHEMA public;

-- ============================================
-- TABLES
-- ============================================

CREATE TABLE IF NOT EXISTS public.ai_batch_test_results (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  test_type text NOT NULL,
  test_batch_id uuid NOT NULL,
  combination_id text,
  combination_variables jsonb NOT NULL DEFAULT '{}'::jsonb,
  function_name text NOT NULL,
  request_body jsonb NOT NULL DEFAULT '{}'::jsonb,
  success boolean NOT NULL DEFAULT false,
  response_data jsonb,
  error_message text,
  execution_time_ms integer,
  response_quality_score integer,
  linked_simulation_id uuid,
  diagnostic_issues_passed jsonb,
  response_metrics jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.ai_inference_results (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid,
  org_id uuid,
  store_id uuid,
  inference_type text NOT NULL,
  result jsonb NOT NULL,
  parameters jsonb DEFAULT '{}'::jsonb,
  processing_time_ms integer,
  model_used text,
  created_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.ai_model_performance (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL,
  store_id uuid,
  model_type character varying(50) NOT NULL,
  period_start date NOT NULL,
  period_end date NOT NULL,
  total_predictions integer DEFAULT 0,
  applied_count integer DEFAULT 0,
  success_count integer DEFAULT 0,
  partial_count integer DEFAULT 0,
  failure_count integer DEFAULT 0,
  avg_confidence numeric(5,2),
  avg_actual_roi numeric(10,2),
  avg_predicted_roi numeric(10,2),
  prediction_accuracy numeric(5,2),
  confidence_adjustment numeric(5,2) DEFAULT 0,
  roi_adjustment numeric(5,2) DEFAULT 0,
  prompt_adjustments jsonb,
  created_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.ai_recommendations (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  org_id uuid,
  store_id uuid,
  recommendation_type text NOT NULL,
  title text NOT NULL,
  description text NOT NULL,
  priority text NOT NULL,
  status text DEFAULT 'pending'::text,
  expected_impact jsonb,
  evidence jsonb,
  action_category text,
  data_source text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  displayed_at timestamp with time zone,
  dismissed_at timestamp with time zone,
  is_displayed boolean DEFAULT true
);

CREATE TABLE IF NOT EXISTS public.ai_response_logs (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  store_id uuid NOT NULL,
  user_id uuid,
  function_name text NOT NULL,
  simulation_type text NOT NULL,
  input_variables jsonb NOT NULL DEFAULT '{}'::jsonb,
  ai_response jsonb NOT NULL DEFAULT '{}'::jsonb,
  response_summary jsonb DEFAULT '{}'::jsonb,
  quality_score integer,
  quality_notes text,
  is_good_example boolean DEFAULT false,
  execution_time_ms integer,
  model_used text,
  prompt_tokens integer,
  completion_tokens integer,
  context_metadata jsonb DEFAULT '{}'::jsonb,
  had_error boolean DEFAULT false,
  error_message text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  parse_success boolean DEFAULT true,
  fallback_used boolean DEFAULT false,
  schema_validation_errors jsonb DEFAULT '[]'::jsonb,
  parse_attempts integer DEFAULT 1,
  raw_response_length integer,
  used_fallback boolean DEFAULT false
);

CREATE TABLE IF NOT EXISTS public.analysis_history (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  org_id uuid,
  store_id uuid,
  analysis_type text NOT NULL,
  input_data jsonb NOT NULL,
  result text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.api_connections (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  org_id uuid,
  name text NOT NULL,
  type text NOT NULL,
  url text NOT NULL,
  auth_type text DEFAULT 'none'::text,
  auth_value text,
  method text DEFAULT 'GET'::text,
  headers jsonb DEFAULT '{}'::jsonb,
  is_active boolean DEFAULT true,
  last_sync timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  store_id uuid,
  provider text,
  auth_config jsonb DEFAULT '{}'::jsonb,
  request_config jsonb DEFAULT '{"timeout_ms": 30000, "retry_count": 3, "retry_delay_ms": 1000}'::jsonb,
  rate_limit_config jsonb DEFAULT '{"requests_per_hour": 1000, "requests_per_minute": 60}'::jsonb,
  last_tested_at timestamp with time zone,
  last_error text,
  status text DEFAULT 'inactive'::text,
  data_category text,
  field_mappings jsonb DEFAULT '[]'::jsonb,
  target_table text,
  response_data_path text DEFAULT 'data'::text,
  pagination_type text DEFAULT 'none'::text,
  pagination_config jsonb DEFAULT '{"page_param": "page", "limit_param": "limit", "default_limit": 100}'::jsonb,
  sync_frequency text DEFAULT 'manual'::text,
  sync_config jsonb DEFAULT '{"mode": "incremental", "batch_size": 100, "incremental_key": "updated_at"}'::jsonb,
  total_records_synced integer DEFAULT 0,
  last_sync_duration_ms integer,
  successful_syncs integer DEFAULT 0,
  error_count integer DEFAULT 0,
  next_sync_at timestamp with time zone,
  api_body_template jsonb,
  sync_cron text,
  next_scheduled_sync timestamp with time zone,
  is_credentials_encrypted boolean DEFAULT false,
  retry_count integer DEFAULT 0,
  max_retries integer DEFAULT 3,
  connection_category text DEFAULT 'business'::text,
  is_system_managed boolean DEFAULT false,
  display_order integer DEFAULT 100,
  icon_name text,
  description text
);

CREATE TABLE IF NOT EXISTS public.api_mapping_templates (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  provider text NOT NULL,
  data_category text NOT NULL,
  target_table text NOT NULL,
  name text NOT NULL,
  description text,
  version text DEFAULT '1.0'::text,
  default_endpoint text,
  default_method text DEFAULT 'GET'::text,
  default_headers jsonb DEFAULT '{}'::jsonb,
  response_data_path text,
  field_mappings jsonb NOT NULL,
  pagination_type text DEFAULT 'offset'::text,
  pagination_config jsonb DEFAULT '{}'::jsonb,
  suggested_auth_type text DEFAULT 'api_key'::text,
  auth_config_hints jsonb DEFAULT '{}'::jsonb,
  is_official boolean DEFAULT false,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.api_sync_logs (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  sync_endpoint_id uuid NOT NULL,
  api_connection_id uuid,
  started_at timestamp with time zone DEFAULT now(),
  completed_at timestamp with time zone,
  duration_ms integer,
  status text NOT NULL,
  records_fetched integer DEFAULT 0,
  records_created integer DEFAULT 0,
  records_updated integer DEFAULT 0,
  records_failed integer DEFAULT 0,
  error_message text,
  error_details jsonb,
  request_url text,
  request_headers jsonb,
  response_status integer,
  response_headers jsonb,
  created_at timestamp with time zone DEFAULT now(),
  org_id uuid,
  sync_type text DEFAULT 'manual'::text,
  raw_import_id uuid,
  etl_run_id uuid,
  fetch_completed_at timestamp with time zone,
  processing_completed_at timestamp with time zone,
  response_size_bytes bigint,
  error_type text
);

CREATE TABLE IF NOT EXISTS public.applied_strategies (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  store_id uuid NOT NULL,
  org_id uuid NOT NULL,
  user_id uuid,
  source character varying(20) NOT NULL,
  source_module character varying(50) NOT NULL,
  name character varying(200) NOT NULL,
  description text,
  settings jsonb DEFAULT '{}'::jsonb,
  start_date date NOT NULL,
  end_date date NOT NULL,
  expected_roi numeric(10,2) NOT NULL,
  target_roi numeric(10,2),
  current_roi numeric(10,2),
  final_roi numeric(10,2),
  baseline_metrics jsonb DEFAULT '{}'::jsonb,
  status character varying(20) DEFAULT 'active'::character varying,
  result character varying(20),
  notes text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  completed_at timestamp with time zone,
  expected_revenue numeric(15,2),
  actual_revenue numeric(15,2),
  created_by uuid
);

CREATE TABLE IF NOT EXISTS public.auto_order_suggestions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  org_id uuid,
  product_id uuid NOT NULL,
  current_stock integer NOT NULL,
  optimal_stock integer NOT NULL,
  suggested_order_quantity integer NOT NULL,
  urgency_level text NOT NULL,
  estimated_stockout_date timestamp with time zone,
  potential_revenue_loss numeric DEFAULT 0,
  status text NOT NULL DEFAULT 'pending'::text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.chat_context_memory (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL,
  session_id text,
  user_id uuid,
  user_profile jsonb DEFAULT '{}'::jsonb,
  conversation_insights jsonb DEFAULT '[]'::jsonb,
  conversation_summary text DEFAULT ''::text,
  last_turn_count integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.chat_conversations (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  channel chat_channel NOT NULL,
  user_id uuid,
  session_id text,
  store_id uuid,
  title text,
  message_count integer DEFAULT 0,
  total_tokens_used integer DEFAULT 0,
  satisfaction_rating integer,
  channel_metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  is_archived boolean DEFAULT false
);

CREATE TABLE IF NOT EXISTS public.chat_events (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  conversation_id uuid,
  channel chat_channel NOT NULL,
  event_type text NOT NULL,
  event_data jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.chat_leads (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  conversation_id uuid,
  email text NOT NULL,
  company text,
  role text,
  pain_points jsonb DEFAULT '[]'::jsonb,
  source_page text,
  created_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.chat_messages (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL,
  role text NOT NULL,
  content text NOT NULL,
  model_used text,
  tokens_used integer,
  execution_time_ms integer,
  channel_data jsonb DEFAULT '{}'::jsonb,
  user_feedback text,
  feedback_comment text,
  created_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.contact_submissions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL,
  company text NOT NULL,
  email text NOT NULL,
  phone text,
  stores integer,
  features text[],
  timeline text,
  message text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  privacy_consent boolean NOT NULL DEFAULT false,
  marketing_consent boolean DEFAULT false
);

CREATE TABLE IF NOT EXISTS public.customer_segments_agg (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  org_id uuid,
  store_id uuid,
  date date NOT NULL,
  segment_type text NOT NULL,
  segment_name text NOT NULL,
  customer_count integer DEFAULT 0,
  total_revenue numeric DEFAULT 0,
  avg_transaction_value numeric,
  visit_frequency numeric,
  avg_basket_size numeric,
  churn_risk_score numeric,
  ltv_estimate numeric,
  metadata jsonb DEFAULT '{}'::jsonb,
  calculated_at timestamp with time zone DEFAULT now(),
  created_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.customers (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  org_id uuid,
  store_id uuid,
  customer_name text,
  email text,
  phone text,
  segment text,
  total_purchases numeric DEFAULT 0,
  last_visit_date timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  avatar_url text,
  avatar_type text
);

CREATE TABLE IF NOT EXISTS public.daily_kpis_agg (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  org_id uuid,
  store_id uuid,
  date date NOT NULL,
  total_visitors integer DEFAULT 0,
  unique_visitors integer DEFAULT 0,
  returning_visitors integer DEFAULT 0,
  avg_visit_duration_seconds integer,
  total_transactions integer DEFAULT 0,
  total_revenue numeric DEFAULT 0,
  total_units_sold integer DEFAULT 0,
  avg_basket_size numeric,
  avg_transaction_value numeric,
  conversion_rate numeric,
  browse_to_engage_rate numeric,
  engage_to_purchase_rate numeric,
  sales_per_sqm numeric,
  sales_per_visitor numeric,
  labor_hours numeric,
  sales_per_labor_hour numeric,
  weather_condition text,
  temperature numeric,
  is_holiday boolean DEFAULT false,
  special_event text,
  calculated_at timestamp with time zone DEFAULT now(),
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  source_trace jsonb DEFAULT '{}'::jsonb
);

CREATE TABLE IF NOT EXISTS public.dashboard_kpis (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  org_id uuid,
  store_id uuid,
  date date NOT NULL,
  total_revenue numeric DEFAULT 0,
  total_visits integer DEFAULT 0,
  total_purchases integer DEFAULT 0,
  conversion_rate numeric DEFAULT 0,
  sales_per_sqm numeric DEFAULT 0,
  labor_hours numeric DEFAULT 0,
  funnel_entry integer DEFAULT 0,
  funnel_browse integer DEFAULT 0,
  funnel_fitting integer DEFAULT 0,
  funnel_purchase integer DEFAULT 0,
  funnel_return integer DEFAULT 0,
  weather_condition text,
  is_holiday boolean DEFAULT false,
  special_event text,
  consumer_sentiment_index numeric,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.data_source_sync_logs (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  data_source_id uuid NOT NULL,
  started_at timestamp with time zone DEFAULT now(),
  completed_at timestamp with time zone,
  status text DEFAULT 'running'::text,
  entities_created integer DEFAULT 0,
  entities_updated integer DEFAULT 0,
  relations_created integer DEFAULT 0,
  errors jsonb DEFAULT '[]'::jsonb,
  triggered_by text
);

CREATE TABLE IF NOT EXISTS public.data_source_tables (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  data_source_id uuid NOT NULL,
  table_name text NOT NULL,
  display_name text,
  columns jsonb NOT NULL DEFAULT '[]'::jsonb,
  row_count bigint DEFAULT 0,
  sample_data jsonb,
  created_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.data_sources (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  org_id uuid,
  source_id_code text,
  source_name text NOT NULL,
  source_type text NOT NULL,
  connection_string text,
  config jsonb DEFAULT '{}'::jsonb,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  store_id uuid,
  description text,
  schema_definition jsonb,
  last_sync_at timestamp with time zone,
  last_sync_status text,
  record_count bigint DEFAULT 0
);

CREATE TABLE IF NOT EXISTS public.data_sync_logs (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  org_id uuid,
  schedule_id uuid NOT NULL,
  status text NOT NULL,
  started_at timestamp with time zone NOT NULL DEFAULT now(),
  completed_at timestamp with time zone,
  records_synced integer DEFAULT 0,
  error_message text,
  metadata jsonb DEFAULT '{}'::jsonb
);

CREATE TABLE IF NOT EXISTS public.data_sync_schedules (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  org_id uuid,
  data_source_id uuid NOT NULL,
  schedule_name text NOT NULL,
  cron_expression text NOT NULL,
  is_enabled boolean NOT NULL DEFAULT true,
  last_run_at timestamp with time zone,
  next_run_at timestamp with time zone,
  last_status text,
  error_message text,
  sync_config jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.economic_indicators (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  org_id uuid,
  date date NOT NULL,
  indicator_type text NOT NULL,
  indicator_value numeric NOT NULL,
  region text,
  source text,
  unit text,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  is_global boolean NOT NULL DEFAULT false
);

CREATE TABLE IF NOT EXISTS public.etl_runs (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  org_id uuid,
  store_id uuid,
  etl_function text NOT NULL,
  etl_version text DEFAULT '2.0'::text,
  date_range_start date,
  date_range_end date,
  input_record_count integer DEFAULT 0,
  output_record_count integer DEFAULT 0,
  raw_import_ids uuid[] DEFAULT '{}'::uuid[],
  status text DEFAULT 'running'::text,
  error_message text,
  error_details jsonb,
  started_at timestamp with time zone DEFAULT now(),
  completed_at timestamp with time zone,
  duration_ms integer,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.external_data_sources (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  org_id uuid,
  name text NOT NULL,
  source_type text NOT NULL,
  api_url text,
  api_key_encrypted text,
  description text,
  is_active boolean NOT NULL DEFAULT true,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.feedback_reason_codes (
  code text NOT NULL,
  category text NOT NULL,
  label_ko text NOT NULL,
  label_en text NOT NULL,
  description text,
  is_active boolean DEFAULT true,
  display_order integer DEFAULT 50
);

CREATE TABLE IF NOT EXISTS public.funnel_events (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  org_id uuid,
  store_id uuid,
  visitor_id text,
  customer_id uuid,
  session_id text,
  event_type text NOT NULL,
  event_date date NOT NULL,
  event_hour integer,
  event_timestamp timestamp with time zone NOT NULL,
  zone_id uuid,
  duration_seconds integer,
  previous_event_type text,
  next_event_type text,
  device_type text,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone DEFAULT now(),
  product_id uuid
);

CREATE TABLE IF NOT EXISTS public.funnel_metrics (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  org_id uuid,
  store_id uuid,
  date date NOT NULL,
  hour integer,
  customer_segment text,
  stage text NOT NULL,
  count integer NOT NULL,
  duration_seconds integer,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.furniture (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  store_id uuid NOT NULL,
  user_id uuid,
  org_id uuid,
  name text NOT NULL,
  furniture_type text NOT NULL,
  category text,
  position_x numeric DEFAULT 0,
  position_y numeric DEFAULT 0,
  position_z numeric DEFAULT 0,
  rotation_x numeric DEFAULT 0,
  rotation_y numeric DEFAULT 0,
  rotation_z numeric DEFAULT 0,
  scale_x numeric DEFAULT 1,
  scale_y numeric DEFAULT 1,
  scale_z numeric DEFAULT 1,
  width numeric,
  height numeric,
  depth numeric,
  model_url text,
  model_type text,
  properties jsonb DEFAULT '{}'::jsonb,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  zone_id uuid,
  furniture_code text,
  thumbnail_url text,
  movable boolean DEFAULT false,
  furniture_name text,
  height_zone text DEFAULT 'eye_level'::text,
  facing text DEFAULT 'front'::text,
  vmd_properties jsonb DEFAULT '{}'::jsonb
);

CREATE TABLE IF NOT EXISTS public.furniture_slots (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  furniture_id uuid NOT NULL,
  store_id uuid NOT NULL,
  user_id uuid,
  org_id uuid,
  slot_id text NOT NULL,
  furniture_type text NOT NULL,
  slot_type text NOT NULL,
  slot_position jsonb DEFAULT '{"x": 0, "y": 0, "z": 0}'::jsonb,
  slot_rotation jsonb DEFAULT '{"x": 0, "y": 0, "z": 0}'::jsonb,
  compatible_display_types text[] DEFAULT '{}'::text[],
  max_product_width numeric,
  max_product_height numeric,
  max_product_depth numeric,
  is_occupied boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  properties jsonb DEFAULT '{}'::jsonb,
  height_zone text,
  facing_count integer DEFAULT 1,
  slot_height_cm numeric
);

CREATE TABLE IF NOT EXISTS public.graph_entities (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid,
  org_id uuid,
  store_id uuid,
  entity_type_id uuid NOT NULL,
  label text NOT NULL,
  properties jsonb DEFAULT '{}'::jsonb,
  model_3d_position jsonb DEFAULT '{"x": 0, "y": 0, "z": 0}'::jsonb,
  model_3d_rotation jsonb DEFAULT '{"x": 0, "y": 0, "z": 0}'::jsonb,
  model_3d_scale jsonb DEFAULT '{"x": 1, "y": 1, "z": 1}'::jsonb,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  entity_code text,
  is_active boolean DEFAULT true
);

CREATE TABLE IF NOT EXISTS public.graph_relations (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  org_id uuid,
  store_id uuid,
  relation_type_id uuid NOT NULL,
  source_entity_id uuid NOT NULL,
  target_entity_id uuid NOT NULL,
  properties jsonb DEFAULT '{}'::jsonb,
  weight double precision DEFAULT 1.0,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.holidays_events (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid,
  org_id uuid,
  store_id uuid,
  date date NOT NULL,
  event_name text NOT NULL,
  event_type text NOT NULL,
  description text,
  impact_level text,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  is_global boolean NOT NULL DEFAULT false,
  country_code text,
  region_code text,
  source_provider text,
  raw_payload jsonb DEFAULT '{}'::jsonb
);

CREATE TABLE IF NOT EXISTS public.hourly_metrics (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  org_id uuid,
  store_id uuid,
  date date NOT NULL,
  hour integer NOT NULL,
  visitor_count integer DEFAULT 0,
  entry_count integer DEFAULT 0,
  exit_count integer DEFAULT 0,
  transaction_count integer DEFAULT 0,
  revenue numeric DEFAULT 0,
  units_sold integer DEFAULT 0,
  avg_occupancy integer,
  peak_occupancy integer,
  conversion_rate numeric,
  calculated_at timestamp with time zone DEFAULT now(),
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.inventory_levels (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  org_id uuid,
  product_id uuid NOT NULL,
  current_stock integer NOT NULL DEFAULT 0,
  optimal_stock integer NOT NULL,
  minimum_stock integer NOT NULL,
  weekly_demand integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  last_updated timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.inventory_movements (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  org_id uuid,
  store_id uuid,
  product_id uuid,
  movement_type text NOT NULL,
  quantity integer NOT NULL,
  previous_stock integer,
  new_stock integer,
  reason text,
  reference_id uuid,
  moved_at timestamp with time zone NOT NULL DEFAULT now(),
  created_at timestamp with time zone DEFAULT now(),
  metadata jsonb DEFAULT '{}'::jsonb
);

CREATE TABLE IF NOT EXISTS public.invitations (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL,
  invited_by uuid NOT NULL,
  email text NOT NULL,
  role app_role NOT NULL,
  token text NOT NULL,
  status text NOT NULL DEFAULT 'pending'::text,
  license_id uuid,
  expires_at timestamp with time zone NOT NULL,
  accepted_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.layout_optimization_results (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  store_id uuid NOT NULL,
  user_id uuid,
  org_id uuid,
  optimization_type text NOT NULL,
  furniture_changes jsonb DEFAULT '[]'::jsonb,
  product_changes jsonb DEFAULT '[]'::jsonb,
  total_furniture_changes integer DEFAULT 0,
  total_product_changes integer DEFAULT 0,
  expected_revenue_improvement numeric(5,2),
  expected_traffic_improvement numeric(5,2),
  expected_conversion_improvement numeric(5,2),
  status text DEFAULT 'generated'::text,
  reviewed_by uuid,
  reviewed_at timestamp with time zone,
  applied_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  parameters jsonb DEFAULT '{}'::jsonb,
  feedback_action text,
  feedback_reason text,
  feedback_note text,
  applied_changes jsonb DEFAULT '[]'::jsonb,
  summary jsonb DEFAULT '{}'::jsonb
);

CREATE TABLE IF NOT EXISTS public.learning_adjustments (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL,
  store_id uuid,
  model_type character varying(50) NOT NULL,
  adjustment_type character varying(30) NOT NULL,
  previous_value jsonb,
  new_value jsonb,
  trigger_reason character varying(100),
  supporting_data jsonb,
  applied_at timestamp with time zone DEFAULT now(),
  applied_by character varying(20) DEFAULT 'system'::character varying,
  effectiveness_measured boolean DEFAULT false,
  effectiveness_score numeric(5,2),
  created_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.learning_sessions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  store_id uuid NOT NULL,
  started_at timestamp with time zone DEFAULT now(),
  completed_at timestamp with time zone,
  status text NOT NULL DEFAULT 'started'::text,
  predictions_evaluated integer DEFAULT 0,
  adjustments_proposed integer DEFAULT 0,
  adjustments_applied integer DEFAULT 0,
  improvement_metrics jsonb DEFAULT '{}'::jsonb,
  error_message text
);

CREATE TABLE IF NOT EXISTS public.licenses (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL,
  license_type text NOT NULL,
  effective_date date NOT NULL,
  expiry_date date,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  status text DEFAULT 'active'::text,
  subscription_id uuid,
  activated_at timestamp with time zone,
  last_used_at timestamp with time zone,
  monthly_price numeric,
  next_billing_date date,
  assigned_to uuid,
  assigned_store_id uuid
);

CREATE TABLE IF NOT EXISTS public.line_items (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  org_id uuid,
  store_id uuid,
  transaction_id text NOT NULL,
  purchase_id uuid,
  product_id uuid,
  customer_id uuid,
  quantity integer NOT NULL DEFAULT 1,
  unit_price numeric NOT NULL,
  discount_amount numeric DEFAULT 0,
  tax_amount numeric DEFAULT 0,
  line_total numeric NOT NULL,
  transaction_date date NOT NULL,
  transaction_hour integer,
  payment_method text,
  is_return boolean DEFAULT false,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.model_3d_files (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  org_id uuid,
  store_id uuid,
  file_name text NOT NULL,
  file_path text NOT NULL,
  file_size bigint NOT NULL,
  file_type text NOT NULL,
  display_name text NOT NULL,
  description text,
  thumbnail_url text,
  status text DEFAULT 'ready'::text,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.notification_settings (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  org_id uuid,
  email_enabled boolean DEFAULT true,
  slack_enabled boolean DEFAULT false,
  slack_webhook_url text,
  notification_types jsonb DEFAULT '["stockout", "anomaly", "milestone"]'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.onboarding_progress (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL,
  user_id uuid NOT NULL,
  current_step integer NOT NULL DEFAULT 1,
  total_steps integer NOT NULL DEFAULT 7,
  completed_steps integer[] DEFAULT '{}'::integer[],
  skipped_steps integer[] DEFAULT '{}'::integer[],
  steps_status jsonb DEFAULT '{"7_completion": "pending", "3_data_source": "pending", "4_sample_data": "pending", "1_account_setup": "pending", "2_store_creation": "pending", "5_first_dashboard": "pending", "6_first_simulation": "pending"}'::jsonb,
  selected_template text,
  business_type text,
  store_count integer,
  primary_goals text[],
  data_sources text[],
  started_at timestamp with time zone DEFAULT now(),
  completed_at timestamp with time zone,
  last_activity_at timestamp with time zone DEFAULT now(),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.ontology_entity_mappings (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  data_source_id uuid NOT NULL,
  source_table text NOT NULL,
  filter_condition text,
  target_entity_type_id uuid NOT NULL,
  property_mappings jsonb NOT NULL DEFAULT '[]'::jsonb,
  label_template text NOT NULL DEFAULT '${id}'::text,
  is_active boolean DEFAULT true,
  priority integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.ontology_entity_types (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid,
  org_id uuid,
  name text NOT NULL,
  label text NOT NULL,
  description text,
  properties jsonb DEFAULT '[]'::jsonb,
  color text DEFAULT '#3b82f6'::text,
  icon text,
  model_3d_url text,
  model_3d_type text,
  model_3d_dimensions jsonb DEFAULT '{"depth": 1, "width": 1, "height": 1}'::jsonb,
  model_3d_metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  priority text
);

CREATE TABLE IF NOT EXISTS public.ontology_mapping_cache (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  org_id uuid,
  data_type text NOT NULL,
  file_name_pattern text NOT NULL,
  entity_mappings jsonb NOT NULL,
  relation_mappings jsonb NOT NULL,
  confidence_score numeric DEFAULT 0,
  usage_count integer DEFAULT 0,
  last_used_at timestamp with time zone DEFAULT now(),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.ontology_relation_mappings (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  data_source_id uuid NOT NULL,
  source_table text NOT NULL,
  target_relation_type_id uuid NOT NULL,
  source_entity_resolver jsonb NOT NULL DEFAULT '{}'::jsonb,
  target_entity_resolver jsonb NOT NULL DEFAULT '{}'::jsonb,
  property_mappings jsonb DEFAULT '[]'::jsonb,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.ontology_relation_types (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid,
  org_id uuid,
  name text NOT NULL,
  label text NOT NULL,
  description text,
  source_entity_type text NOT NULL,
  target_entity_type text NOT NULL,
  directionality text DEFAULT 'directed'::text,
  properties jsonb DEFAULT '[]'::jsonb,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  priority text
);

CREATE TABLE IF NOT EXISTS public.ontology_schema_versions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  org_id uuid,
  version_number integer NOT NULL,
  description text,
  schema_data jsonb NOT NULL,
  created_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.optimization_feedback (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  store_id uuid NOT NULL,
  optimization_id uuid,
  feedback_target_type text NOT NULL,
  target_id text,
  action text NOT NULL,
  reason_code text,
  reason_text text,
  original_suggestion jsonb,
  modified_suggestion jsonb,
  ai_confidence numeric,
  vmd_rules_applied text[],
  feedback_by text,
  created_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.optimization_tasks (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  store_id uuid NOT NULL,
  user_id uuid,
  org_id uuid,
  task_type text NOT NULL,
  task_name text,
  description text,
  status text DEFAULT 'pending'::text,
  priority integer DEFAULT 0,
  input_params jsonb DEFAULT '{}'::jsonb,
  output_result jsonb DEFAULT '{}'::jsonb,
  simulation_id uuid,
  strategy_id uuid,
  scheduled_at timestamp with time zone,
  started_at timestamp with time zone,
  completed_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.organization_members (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  org_id uuid,
  user_id uuid NOT NULL,
  role app_role NOT NULL DEFAULT 'ORG_MEMBER'::app_role,
  joined_at timestamp with time zone NOT NULL DEFAULT now(),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  license_id uuid
);

CREATE TABLE IF NOT EXISTS public.organization_settings (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL,
  timezone text DEFAULT 'UTC'::text,
  currency text DEFAULT 'USD'::text,
  default_kpi_set text DEFAULT 'standard'::text,
  logo_url text,
  brand_color text DEFAULT '#3b82f6'::text,
  email_notifications boolean DEFAULT true,
  slack_notifications boolean DEFAULT false,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.organizations (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  org_name text NOT NULL,
  created_by uuid,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  metadata jsonb DEFAULT '{}'::jsonb,
  member_count integer DEFAULT 0
);

CREATE TABLE IF NOT EXISTS public.pos_integrations (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL,
  store_id uuid NOT NULL,
  provider text NOT NULL,
  provider_store_id text,
  credentials_encrypted jsonb DEFAULT '{}'::jsonb,
  access_token_encrypted text,
  refresh_token_encrypted text,
  token_expires_at timestamp with time zone,
  sync_enabled boolean DEFAULT true,
  sync_frequency_minutes integer DEFAULT 15,
  last_sync_at timestamp with time zone,
  last_sync_status text,
  last_sync_error text,
  field_mappings jsonb DEFAULT '{}'::jsonb,
  webhook_url text,
  webhook_secret text,
  webhook_events jsonb DEFAULT '["transaction.created", "inventory.updated"]'::jsonb,
  status text DEFAULT 'pending'::text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.prediction_records (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  store_id uuid NOT NULL,
  prediction_type text NOT NULL,
  predicted_value numeric NOT NULL,
  actual_value numeric,
  prediction_date date NOT NULL,
  context jsonb DEFAULT '{}'::jsonb
);

CREATE TABLE IF NOT EXISTS public.product_associations (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  store_id uuid NOT NULL,
  org_id uuid,
  user_id uuid,
  antecedent_product_id uuid NOT NULL,
  consequent_product_id uuid NOT NULL,
  support numeric(5,4) NOT NULL DEFAULT 0.01,
  confidence numeric(5,4) NOT NULL DEFAULT 0.30,
  lift numeric(6,2) NOT NULL DEFAULT 1.00,
  conviction numeric(6,2) DEFAULT 1.00,
  rule_type character varying(20) DEFAULT 'co_purchase'::character varying,
  rule_strength character varying(20) DEFAULT 'moderate'::character varying,
  placement_type character varying(20) DEFAULT 'cross_sell'::character varying,
  co_occurrence_count integer DEFAULT 0,
  avg_basket_value numeric(12,2) DEFAULT 0,
  antecedent_category character varying(50),
  consequent_category character varying(50),
  category_pair character varying(100),
  analysis_period_start date,
  analysis_period_end date,
  sample_transaction_count integer DEFAULT 0,
  is_active boolean DEFAULT true,
  is_verified boolean DEFAULT false,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.product_models (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL,
  display_type text NOT NULL,
  model_3d_url text NOT NULL,
  is_default boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.product_performance_agg (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  org_id uuid,
  store_id uuid,
  product_id uuid,
  date date NOT NULL,
  units_sold integer DEFAULT 0,
  revenue numeric DEFAULT 0,
  transactions integer DEFAULT 0,
  conversion_rate numeric,
  avg_selling_price numeric,
  discount_rate numeric,
  return_rate numeric,
  stock_level integer,
  stockout_hours integer DEFAULT 0,
  category_rank integer,
  store_rank integer,
  calculated_at timestamp with time zone DEFAULT now(),
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.product_placements (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  slot_id uuid NOT NULL,
  product_id uuid NOT NULL,
  store_id uuid NOT NULL,
  user_id uuid,
  org_id uuid,
  display_type text NOT NULL,
  position_offset jsonb DEFAULT '{"x": 0, "y": 0, "z": 0}'::jsonb,
  rotation_offset jsonb DEFAULT '{"x": 0, "y": 0, "z": 0}'::jsonb,
  scale jsonb DEFAULT '{"x": 1, "y": 1, "z": 1}'::jsonb,
  quantity integer DEFAULT 1,
  is_active boolean DEFAULT true,
  placed_at timestamp with time zone DEFAULT now(),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.products (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  org_id uuid,
  store_id uuid,
  product_name text NOT NULL,
  category text,
  price numeric,
  stock integer DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  sku text,
  brand text,
  description text,
  cost_price numeric,
  supplier text,
  initial_furniture_id uuid,
  slot_id text,
  model_3d_position jsonb DEFAULT '{"x": 0, "y": 0, "z": 0}'::jsonb,
  model_3d_rotation jsonb DEFAULT '{"x": 0, "y": 0, "z": 0}'::jsonb,
  model_3d_scale jsonb DEFAULT '{"x": 1, "y": 1, "z": 1}'::jsonb,
  model_3d_url text,
  movable boolean DEFAULT true,
  display_type text DEFAULT 'standing'::text,
  compatible_display_types text[] DEFAULT ARRAY['hanging'::text],
  margin_rate numeric,
  turnover_rate numeric,
  cross_sell_product_ids uuid[]
);

CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid NOT NULL,
  display_name text,
  avatar_url text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.purchases (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  org_id uuid,
  store_id uuid,
  customer_id uuid,
  visit_id uuid,
  product_id uuid,
  purchase_date timestamp with time zone NOT NULL,
  quantity integer NOT NULL,
  unit_price numeric NOT NULL,
  total_price numeric NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.quickstart_guides (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  guide_key text NOT NULL,
  title text NOT NULL,
  description text,
  target_page text NOT NULL,
  target_role text[],
  steps jsonb NOT NULL DEFAULT '[]'::jsonb,
  auto_show boolean DEFAULT true,
  show_once boolean DEFAULT true,
  priority integer DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.raw_imports (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  org_id uuid,
  store_id uuid,
  user_id uuid NOT NULL,
  source_type text NOT NULL,
  source_name text,
  file_path text,
  row_count integer DEFAULT 0,
  status text DEFAULT 'pending'::text,
  error_message text,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone DEFAULT now(),
  processed_at timestamp with time zone,
  raw_data jsonb,
  progress jsonb DEFAULT '{"total": 0, "current": 0, "percentage": 0}'::jsonb,
  error_details jsonb,
  started_at timestamp with time zone,
  completed_at timestamp with time zone,
  data_type text,
  etl_version text DEFAULT '2.0'::text,
  api_connection_id uuid,
  api_response_meta jsonb DEFAULT '{}'::jsonb,
  sync_batch_id uuid,
  session_id uuid
);

CREATE TABLE IF NOT EXISTS public.realtime_inventory (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL,
  store_id uuid NOT NULL,
  pos_integration_id uuid,
  external_product_id text NOT NULL,
  product_name text,
  sku text,
  barcode text,
  category text,
  quantity_on_hand integer NOT NULL DEFAULT 0,
  quantity_reserved integer DEFAULT 0,
  quantity_available integer DEFAULT (quantity_on_hand - quantity_reserved),
  reorder_point integer,
  reorder_quantity integer,
  is_low_stock boolean DEFAULT (quantity_on_hand <= COALESCE(reorder_point, 0)),
  unit_cost numeric(10,2),
  unit_price numeric(10,2),
  last_updated_at timestamp with time zone DEFAULT now(),
  last_sale_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.recommendation_applications (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL,
  store_id uuid NOT NULL,
  scenario_id uuid,
  recommendation_type text NOT NULL,
  recommendation_summary text,
  recommendation_details jsonb DEFAULT '{}'::jsonb,
  baseline_date date NOT NULL,
  baseline_kpis jsonb NOT NULL,
  applied_at timestamp with time zone,
  applied_by uuid,
  measurement_period_days integer DEFAULT 7,
  measurement_start_date date,
  measurement_end_date date,
  status text DEFAULT 'pending'::text,
  reverted_at timestamp with time zone,
  reverted_reason text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.regional_data (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  org_id uuid,
  region text NOT NULL,
  date date NOT NULL,
  population numeric,
  gdp numeric,
  unemployment_rate numeric,
  consumer_confidence numeric,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  is_global boolean NOT NULL DEFAULT false
);

CREATE TABLE IF NOT EXISTS public.retail_concepts (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  store_id uuid,
  name text NOT NULL,
  display_name text NOT NULL,
  category text NOT NULL,
  description text,
  involved_entity_types text[] DEFAULT '{}'::text[],
  involved_relation_types text[] DEFAULT '{}'::text[],
  computation jsonb NOT NULL DEFAULT '{}'::jsonb,
  ai_context jsonb NOT NULL DEFAULT '{}'::jsonb,
  is_system boolean DEFAULT false,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.retail_knowledge_chunks (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  topic_id text NOT NULL,
  chunk_type text NOT NULL,
  insight_id text,
  title text NOT NULL,
  content text NOT NULL,
  conditions jsonb DEFAULT '{}'::jsonb,
  source text DEFAULT 'curation'::text,
  embedding vector(768),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.roi_measurements (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL,
  application_id uuid NOT NULL,
  measurement_start_date date NOT NULL,
  measurement_end_date date NOT NULL,
  measurement_days integer NOT NULL,
  measured_kpis jsonb NOT NULL,
  kpi_changes jsonb NOT NULL,
  statistical_significance jsonb,
  estimated_annual_impact jsonb,
  summary_text text,
  is_positive_impact boolean,
  created_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.sample_data_templates (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  template_name text NOT NULL,
  template_type text NOT NULL,
  display_name text NOT NULL,
  description text,
  preview_image_url text,
  store_config jsonb DEFAULT '{}'::jsonb,
  entity_types jsonb DEFAULT '[]'::jsonb,
  relation_types jsonb DEFAULT '[]'::jsonb,
  sample_entities jsonb DEFAULT '[]'::jsonb,
  sample_relations jsonb DEFAULT '[]'::jsonb,
  sample_products jsonb DEFAULT '[]'::jsonb,
  sample_kpis jsonb DEFAULT '[]'::jsonb,
  sample_transactions jsonb DEFAULT '[]'::jsonb,
  sample_visits jsonb DEFAULT '[]'::jsonb,
  store_3d_model_url text,
  furniture_models jsonb DEFAULT '[]'::jsonb,
  product_models jsonb DEFAULT '[]'::jsonb,
  estimated_setup_minutes integer DEFAULT 5,
  is_active boolean DEFAULT true,
  sort_order integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.simulation_history (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  store_id uuid NOT NULL,
  user_id uuid,
  org_id uuid,
  simulation_type text NOT NULL,
  simulation_name text,
  status text DEFAULT 'pending'::text,
  params jsonb DEFAULT '{}'::jsonb,
  result jsonb DEFAULT '{}'::jsonb,
  metrics jsonb DEFAULT '{}'::jsonb,
  started_at timestamp with time zone,
  completed_at timestamp with time zone,
  duration_seconds integer,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.staff (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  org_id uuid,
  store_id uuid,
  user_id uuid,
  staff_code text,
  staff_name text NOT NULL,
  email text,
  phone text,
  role text,
  department text,
  hire_date date,
  hourly_rate numeric,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  metadata jsonb DEFAULT '{}'::jsonb,
  avatar_url text,
  avatar_position jsonb DEFAULT '{"x": 0, "y": 0, "z": 0}'::jsonb,
  avatar_rotation jsonb DEFAULT '{"x": 0, "y": 0, "z": 0}'::jsonb,
  avatar_scale jsonb DEFAULT '{"x": 1, "y": 1, "z": 1}'::jsonb,
  assigned_zone_id uuid,
  zone_id uuid
);

CREATE TABLE IF NOT EXISTS public.staff_assignments (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  store_id uuid NOT NULL,
  user_id uuid,
  org_id uuid,
  staff_name text,
  staff_role text,
  zone_id uuid,
  position_x numeric,
  position_y numeric,
  position_z numeric,
  shift_start time without time zone,
  shift_end time without time zone,
  assigned_date date,
  status text DEFAULT 'active'::text,
  optimization_task_id uuid,
  is_ai_suggested boolean DEFAULT false,
  efficiency_score numeric,
  properties jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.store_goals (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL,
  store_id uuid NOT NULL,
  goal_type character varying(50) NOT NULL,
  period_type character varying(20) NOT NULL,
  period_start date NOT NULL,
  period_end date NOT NULL,
  target_value numeric NOT NULL,
  created_by uuid,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.store_personas (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  store_id uuid NOT NULL,
  store_style text DEFAULT 'standard'::text,
  target_demographic text DEFAULT 'general'::text,
  preference_weights jsonb DEFAULT '{"revenue": 0.4, "conversion": 0.25, "dwell_time": 0.2, "traffic_flow": 0.15}'::jsonb,
  vmd_preferences jsonb DEFAULT '{"avoid_rules": [], "prefer_rules": [], "custom_thresholds": {}}'::jsonb,
  learned_context jsonb DEFAULT '{"failure_patterns": [], "success_patterns": [], "custom_instructions": "", "seasonal_adjustments": {}}'::jsonb,
  confidence_adjustments jsonb DEFAULT '{"flow": 0, "layout": 0, "pricing": 0, "staffing": 0}'::jsonb,
  feedback_stats jsonb DEFAULT '{"accepted": 0, "modified": 0, "rejected": 0, "acceptance_rate": 0, "total_recommendations": 0}'::jsonb,
  last_learning_at timestamp with time zone,
  learning_version integer DEFAULT 1,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.store_scenes (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  org_id uuid,
  store_id uuid,
  scene_name text NOT NULL,
  scene_type text DEFAULT '3d_layout'::text,
  recipe_data jsonb DEFAULT '{}'::jsonb,
  is_active boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  staff_positions jsonb DEFAULT '[]'::jsonb,
  metadata jsonb DEFAULT '{}'::jsonb
);

CREATE TABLE IF NOT EXISTS public.store_trade_area_context (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  org_id uuid,
  store_id uuid,
  provider text NOT NULL,
  radius_m integer NOT NULL,
  total_pois integer NOT NULL DEFAULT 0,
  categories jsonb DEFAULT '[]'::jsonb,
  stats jsonb DEFAULT '{}'::jsonb,
  raw_payload jsonb DEFAULT '[]'::jsonb,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.store_visits (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  store_id uuid NOT NULL,
  org_id uuid NOT NULL,
  customer_id uuid,
  visit_date timestamp with time zone NOT NULL DEFAULT now(),
  exit_date timestamp with time zone,
  duration_minutes integer,
  zones_visited text[],
  zone_durations jsonb DEFAULT '{}'::jsonb,
  made_purchase boolean DEFAULT false,
  transaction_id uuid,
  purchase_amount numeric(10,2),
  entry_point character varying(100),
  device_type character varying(50),
  data_source character varying(50) DEFAULT 'estimated'::character varying,
  created_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.stored_model_parameters (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  store_id uuid NOT NULL,
  parameter_key text NOT NULL,
  parameter_value numeric NOT NULL,
  prediction_type text NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  version integer DEFAULT 1,
  is_active boolean DEFAULT true
);

CREATE TABLE IF NOT EXISTS public.stores (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  org_id uuid,
  store_name text NOT NULL,
  location text,
  store_type text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  status text DEFAULT 'active'::text,
  region text,
  district text,
  area_sqm numeric,
  opening_date date,
  store_format text,
  hq_store_code text,
  manager_name text,
  email text,
  phone text,
  address text,
  store_code text,
  city text,
  timezone text DEFAULT 'Asia/Seoul'::text,
  floor_area_sqm numeric(10,2),
  license_id uuid,
  country text DEFAULT 'KR'::text,
  metadata jsonb DEFAULT '{}'::jsonb,
  max_capacity integer DEFAULT 50,
  staff_count integer DEFAULT 3,
  opening_hour integer DEFAULT 10,
  closing_hour integer DEFAULT 22,
  is_active boolean DEFAULT true,
  model_3d_url text,
  model_url text
);

CREATE TABLE IF NOT EXISTS public.strategy_feedback (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL,
  store_id uuid NOT NULL,
  strategy_id uuid,
  strategy_type character varying(50) NOT NULL,
  ai_recommendation jsonb NOT NULL,
  was_applied boolean DEFAULT false,
  applied_at timestamp with time zone,
  result_measured boolean DEFAULT false,
  measurement_period_days integer DEFAULT 14,
  measurement_start_date date,
  measurement_end_date date,
  baseline_metrics jsonb,
  actual_metrics jsonb,
  expected_roi numeric(10,2),
  actual_roi numeric(10,2),
  roi_accuracy numeric(5,2),
  feedback_type character varying(20),
  learnings jsonb,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.subscriptions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL,
  plan_type text,
  status text NOT NULL,
  store_quota integer,
  hq_seat_quota integer,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  metadata jsonb DEFAULT '{}'::jsonb,
  start_date timestamp with time zone DEFAULT now(),
  end_date timestamp with time zone,
  subscription_type text NOT NULL DEFAULT 'LICENSE_BASED'::text,
  hq_license_count integer NOT NULL DEFAULT 0,
  store_license_count integer NOT NULL DEFAULT 0,
  viewer_count integer NOT NULL DEFAULT 0,
  billing_cycle text NOT NULL DEFAULT 'monthly'::text,
  current_period_start date,
  current_period_end date,
  monthly_cost numeric NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS public.transactions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid,
  org_id uuid,
  store_id uuid,
  customer_id uuid,
  visit_id uuid,
  transaction_datetime timestamp with time zone NOT NULL,
  channel text,
  payment_method text,
  total_amount numeric,
  discount_amount numeric,
  net_amount numeric,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.trend_signals (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  org_id uuid,
  source_provider text NOT NULL,
  scope text NOT NULL,
  key text NOT NULL,
  date date NOT NULL,
  index_value numeric NOT NULL,
  metadata jsonb DEFAULT '{}'::jsonb,
  raw_payload jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.upload_sessions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  org_id uuid,
  store_id uuid,
  session_name text,
  status text NOT NULL DEFAULT 'in_progress'::text,
  total_files integer DEFAULT 0,
  processed_files integer DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  file_name text,
  file_path text,
  file_size bigint,
  file_type text,
  import_type text,
  target_table text,
  row_count integer,
  parsed_preview jsonb,
  column_mapping jsonb,
  validation_errors jsonb,
  completed_files integer DEFAULT 0,
  failed_files integer DEFAULT 0,
  started_at timestamp with time zone DEFAULT now(),
  completed_at timestamp with time zone
);

CREATE TABLE IF NOT EXISTS public.user_activity_logs (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  org_id uuid,
  activity_type text NOT NULL,
  activity_data jsonb DEFAULT '{}'::jsonb,
  ip_address text,
  user_agent text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.user_alerts (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL,
  store_id uuid,
  user_id uuid,
  alert_type character varying(50) NOT NULL,
  severity character varying(20) NOT NULL,
  title character varying(255) NOT NULL,
  message text,
  action_url character varying(255),
  action_label character varying(100),
  is_read boolean DEFAULT false,
  is_dismissed boolean DEFAULT false,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone DEFAULT now(),
  read_at timestamp with time zone,
  expires_at timestamp with time zone
);

CREATE TABLE IF NOT EXISTS public.user_data_imports (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  org_id uuid,
  store_id uuid,
  data_type text NOT NULL,
  file_name text NOT NULL,
  status text NOT NULL DEFAULT 'pending'::text,
  row_count integer DEFAULT 0,
  error_message text,
  raw_data jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  progress jsonb,
  error_details jsonb,
  started_at timestamp with time zone,
  completed_at timestamp with time zone,
  is_paused boolean DEFAULT false,
  can_resume boolean DEFAULT false,
  can_pause boolean DEFAULT false,
  import_type text,
  target_table text,
  total_rows integer,
  imported_rows integer DEFAULT 0,
  failed_rows integer DEFAULT 0,
  rolled_back_at timestamp with time zone,
  rolled_back_rows integer
);

CREATE TABLE IF NOT EXISTS public.user_guide_completions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  guide_key text NOT NULL,
  completed_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.v_org_id (
  id uuid
);

CREATE TABLE IF NOT EXISTS public.visit_zone_events (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  org_id uuid,
  store_id uuid,
  visit_id uuid,
  zone_id uuid,
  entry_time timestamp with time zone NOT NULL,
  exit_time timestamp with time zone,
  dwell_seconds integer,
  interaction_count integer DEFAULT 0,
  path_sequence integer,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.visits (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  org_id uuid,
  store_id uuid,
  customer_id uuid,
  visit_date timestamp with time zone NOT NULL,
  duration_minutes integer,
  zones_visited text[],
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.vmd_rule_applications (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  rule_id uuid NOT NULL,
  store_id uuid NOT NULL,
  optimization_id uuid,
  applied_to_zone_id uuid,
  applied_to_fixture_id uuid,
  applied_to_product_id uuid,
  was_accepted boolean,
  user_feedback text,
  actual_impact jsonb,
  applied_at timestamp with time zone DEFAULT now(),
  applied_by text
);

CREATE TABLE IF NOT EXISTS public.vmd_rulesets (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  rule_code text NOT NULL,
  rule_name text NOT NULL,
  rule_name_ko text,
  rule_category text NOT NULL,
  description text NOT NULL,
  description_ko text,
  trigger_conditions jsonb NOT NULL DEFAULT '{}'::jsonb,
  recommended_action text NOT NULL,
  recommended_action_ko text,
  action_parameters jsonb DEFAULT '{}'::jsonb,
  expected_impact jsonb DEFAULT '{}'::jsonb,
  evidence_source text,
  evidence_url text,
  confidence_level numeric,
  applicable_store_types text[] DEFAULT ARRAY['all'::text],
  applicable_industries text[] DEFAULT ARRAY['retail'::text],
  is_active boolean DEFAULT true,
  priority integer DEFAULT 50,
  version integer DEFAULT 1,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  created_by text DEFAULT 'system'::text
);

CREATE TABLE IF NOT EXISTS public.weather_data (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid,
  org_id uuid,
  store_id uuid,
  date date NOT NULL,
  temperature numeric,
  humidity numeric,
  precipitation numeric,
  weather_condition text,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  is_global boolean NOT NULL DEFAULT false,
  wind_speed numeric
);

CREATE TABLE IF NOT EXISTS public.wifi_tracking (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  org_id uuid,
  store_id uuid NOT NULL,
  zone_id uuid,
  mac_address text NOT NULL,
  timestamp timestamp with time zone NOT NULL,
  signal_strength integer,
  dwell_time_seconds integer,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  session_id text
);

CREATE TABLE IF NOT EXISTS public.wifi_zones (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  org_id uuid,
  store_id uuid NOT NULL,
  zone_name text NOT NULL,
  zone_type text,
  coordinates jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.zone_daily_metrics (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  org_id uuid,
  store_id uuid,
  zone_id uuid,
  date date NOT NULL,
  total_visitors integer DEFAULT 0,
  unique_visitors integer DEFAULT 0,
  entry_count integer DEFAULT 0,
  exit_count integer DEFAULT 0,
  avg_dwell_seconds integer,
  total_dwell_seconds integer,
  interaction_count integer DEFAULT 0,
  conversion_count integer DEFAULT 0,
  revenue_attributed numeric DEFAULT 0,
  heatmap_intensity numeric,
  peak_hour integer,
  peak_occupancy integer,
  calculated_at timestamp with time zone DEFAULT now(),
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone DEFAULT now(),
  source_trace jsonb DEFAULT '{}'::jsonb
);

CREATE TABLE IF NOT EXISTS public.zone_events (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  org_id uuid,
  store_id uuid,
  zone_id uuid,
  event_type text NOT NULL,
  event_date date NOT NULL,
  event_hour integer,
  event_timestamp timestamp with time zone NOT NULL,
  visitor_id text,
  customer_id uuid,
  duration_seconds integer,
  sensor_type text,
  sensor_id text,
  confidence_score numeric,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.zone_transitions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  store_id uuid NOT NULL,
  org_id uuid,
  from_zone_id uuid NOT NULL,
  to_zone_id uuid NOT NULL,
  transition_date date NOT NULL,
  transition_count integer DEFAULT 0,
  avg_duration_seconds integer,
  created_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.zones_dim (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  org_id uuid,
  store_id uuid NOT NULL,
  zone_code text NOT NULL,
  zone_name text NOT NULL,
  zone_type text,
  floor_level integer DEFAULT 1,
  area_sqm numeric,
  capacity integer,
  parent_zone_id uuid,
  coordinates jsonb,
  metadata jsonb DEFAULT '{}'::jsonb,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  user_id uuid,
  position_x numeric DEFAULT 0,
  position_y numeric DEFAULT 0,
  position_z numeric DEFAULT 0,
  size_width numeric,
  size_depth numeric,
  size_height numeric,
  color text,
  properties jsonb DEFAULT '{}'::jsonb,
  vmd_attributes jsonb DEFAULT '{}'::jsonb
);

-- ============================================
-- PRIMARY KEY CONSTRAINTS
-- ============================================

ALTER TABLE public.ai_batch_test_results ADD CONSTRAINT ai_batch_test_results_pkey PRIMARY KEY (id);
ALTER TABLE public.ai_inference_results ADD CONSTRAINT ai_inference_results_pkey PRIMARY KEY (id);
ALTER TABLE public.ai_model_performance ADD CONSTRAINT ai_model_performance_pkey PRIMARY KEY (id);
ALTER TABLE public.ai_recommendations ADD CONSTRAINT ai_recommendations_pkey PRIMARY KEY (id);
ALTER TABLE public.ai_response_logs ADD CONSTRAINT ai_response_logs_pkey PRIMARY KEY (id);
ALTER TABLE public.analysis_history ADD CONSTRAINT analysis_history_pkey PRIMARY KEY (id);
ALTER TABLE public.api_connections ADD CONSTRAINT api_connections_pkey PRIMARY KEY (id);
ALTER TABLE public.api_mapping_templates ADD CONSTRAINT api_mapping_templates_pkey PRIMARY KEY (id);
ALTER TABLE public.api_sync_logs ADD CONSTRAINT api_sync_logs_pkey PRIMARY KEY (id);
ALTER TABLE public.applied_strategies ADD CONSTRAINT applied_strategies_pkey PRIMARY KEY (id);
ALTER TABLE public.auto_order_suggestions ADD CONSTRAINT auto_order_suggestions_pkey PRIMARY KEY (id);
ALTER TABLE public.chat_context_memory ADD CONSTRAINT chat_context_memory_pkey PRIMARY KEY (id);
ALTER TABLE public.chat_conversations ADD CONSTRAINT chat_conversations_pkey PRIMARY KEY (id);
ALTER TABLE public.chat_events ADD CONSTRAINT chat_events_pkey PRIMARY KEY (id);
ALTER TABLE public.chat_leads ADD CONSTRAINT chat_leads_pkey PRIMARY KEY (id);
ALTER TABLE public.chat_messages ADD CONSTRAINT chat_messages_pkey PRIMARY KEY (id);
ALTER TABLE public.contact_submissions ADD CONSTRAINT contact_submissions_pkey PRIMARY KEY (id);
ALTER TABLE public.customer_segments_agg ADD CONSTRAINT customer_segments_agg_pkey PRIMARY KEY (id);
ALTER TABLE public.customers ADD CONSTRAINT customers_pkey PRIMARY KEY (id);
ALTER TABLE public.daily_kpis_agg ADD CONSTRAINT daily_kpis_agg_pkey PRIMARY KEY (id);
ALTER TABLE public.dashboard_kpis ADD CONSTRAINT dashboard_kpis_pkey PRIMARY KEY (id);
ALTER TABLE public.data_source_sync_logs ADD CONSTRAINT data_source_sync_logs_pkey PRIMARY KEY (id);
ALTER TABLE public.data_source_tables ADD CONSTRAINT data_source_tables_pkey PRIMARY KEY (id);
ALTER TABLE public.data_sources ADD CONSTRAINT data_sources_pkey PRIMARY KEY (id);
ALTER TABLE public.data_sync_logs ADD CONSTRAINT data_sync_logs_pkey PRIMARY KEY (id);
ALTER TABLE public.data_sync_schedules ADD CONSTRAINT data_sync_schedules_pkey PRIMARY KEY (id);
ALTER TABLE public.economic_indicators ADD CONSTRAINT economic_indicators_pkey PRIMARY KEY (id);
ALTER TABLE public.etl_runs ADD CONSTRAINT etl_runs_pkey PRIMARY KEY (id);
ALTER TABLE public.external_data_sources ADD CONSTRAINT external_data_sources_pkey PRIMARY KEY (id);
ALTER TABLE public.feedback_reason_codes ADD CONSTRAINT feedback_reason_codes_pkey PRIMARY KEY (code);
ALTER TABLE public.funnel_events ADD CONSTRAINT funnel_events_pkey PRIMARY KEY (id);
ALTER TABLE public.funnel_metrics ADD CONSTRAINT funnel_metrics_pkey PRIMARY KEY (id);
ALTER TABLE public.furniture ADD CONSTRAINT furniture_pkey PRIMARY KEY (id);
ALTER TABLE public.furniture_slots ADD CONSTRAINT furniture_slots_pkey PRIMARY KEY (id);
ALTER TABLE public.graph_entities ADD CONSTRAINT graph_entities_pkey PRIMARY KEY (id);
ALTER TABLE public.graph_relations ADD CONSTRAINT graph_relations_pkey PRIMARY KEY (id);
ALTER TABLE public.holidays_events ADD CONSTRAINT holidays_events_pkey PRIMARY KEY (id);
ALTER TABLE public.hourly_metrics ADD CONSTRAINT hourly_metrics_pkey PRIMARY KEY (id);
ALTER TABLE public.inventory_levels ADD CONSTRAINT inventory_levels_pkey PRIMARY KEY (id);
ALTER TABLE public.inventory_movements ADD CONSTRAINT inventory_movements_pkey PRIMARY KEY (id);
ALTER TABLE public.invitations ADD CONSTRAINT invitations_pkey PRIMARY KEY (id);
ALTER TABLE public.layout_optimization_results ADD CONSTRAINT layout_optimization_results_pkey PRIMARY KEY (id);
ALTER TABLE public.learning_adjustments ADD CONSTRAINT learning_adjustments_pkey PRIMARY KEY (id);
ALTER TABLE public.learning_sessions ADD CONSTRAINT learning_sessions_pkey PRIMARY KEY (id);
ALTER TABLE public.licenses ADD CONSTRAINT licenses_pkey PRIMARY KEY (id);
ALTER TABLE public.line_items ADD CONSTRAINT line_items_pkey PRIMARY KEY (id);
ALTER TABLE public.model_3d_files ADD CONSTRAINT model_3d_files_pkey PRIMARY KEY (id);
ALTER TABLE public.notification_settings ADD CONSTRAINT notification_settings_pkey PRIMARY KEY (id);
ALTER TABLE public.onboarding_progress ADD CONSTRAINT onboarding_progress_pkey PRIMARY KEY (id);
ALTER TABLE public.ontology_entity_mappings ADD CONSTRAINT ontology_entity_mappings_pkey PRIMARY KEY (id);
ALTER TABLE public.ontology_entity_types ADD CONSTRAINT ontology_entity_types_pkey PRIMARY KEY (id);
ALTER TABLE public.ontology_mapping_cache ADD CONSTRAINT ontology_mapping_cache_pkey PRIMARY KEY (id);
ALTER TABLE public.ontology_relation_mappings ADD CONSTRAINT ontology_relation_mappings_pkey PRIMARY KEY (id);
ALTER TABLE public.ontology_relation_types ADD CONSTRAINT ontology_relation_types_pkey PRIMARY KEY (id);
ALTER TABLE public.ontology_schema_versions ADD CONSTRAINT ontology_schema_versions_pkey PRIMARY KEY (id);
ALTER TABLE public.optimization_feedback ADD CONSTRAINT optimization_feedback_pkey PRIMARY KEY (id);
ALTER TABLE public.optimization_tasks ADD CONSTRAINT optimization_tasks_pkey PRIMARY KEY (id);
ALTER TABLE public.organization_members ADD CONSTRAINT organization_members_pkey PRIMARY KEY (id);
ALTER TABLE public.organization_settings ADD CONSTRAINT organization_settings_pkey PRIMARY KEY (id);
ALTER TABLE public.organizations ADD CONSTRAINT organizations_pkey PRIMARY KEY (id);
ALTER TABLE public.pos_integrations ADD CONSTRAINT pos_integrations_pkey PRIMARY KEY (id);
ALTER TABLE public.prediction_records ADD CONSTRAINT prediction_records_pkey PRIMARY KEY (id);
ALTER TABLE public.product_associations ADD CONSTRAINT product_associations_pkey PRIMARY KEY (id);
ALTER TABLE public.product_models ADD CONSTRAINT product_models_pkey PRIMARY KEY (id);
ALTER TABLE public.product_performance_agg ADD CONSTRAINT product_performance_agg_pkey PRIMARY KEY (id);
ALTER TABLE public.product_placements ADD CONSTRAINT product_placements_pkey PRIMARY KEY (id);
ALTER TABLE public.products ADD CONSTRAINT products_pkey PRIMARY KEY (id);
ALTER TABLE public.profiles ADD CONSTRAINT profiles_pkey PRIMARY KEY (id);
ALTER TABLE public.purchases ADD CONSTRAINT purchases_pkey PRIMARY KEY (id);
ALTER TABLE public.quickstart_guides ADD CONSTRAINT quickstart_guides_pkey PRIMARY KEY (id);
ALTER TABLE public.raw_imports ADD CONSTRAINT raw_imports_pkey PRIMARY KEY (id);
ALTER TABLE public.realtime_inventory ADD CONSTRAINT realtime_inventory_pkey PRIMARY KEY (id);
ALTER TABLE public.recommendation_applications ADD CONSTRAINT recommendation_applications_pkey PRIMARY KEY (id);
ALTER TABLE public.regional_data ADD CONSTRAINT regional_data_pkey PRIMARY KEY (id);
ALTER TABLE public.retail_concepts ADD CONSTRAINT retail_concepts_pkey PRIMARY KEY (id);
ALTER TABLE public.retail_knowledge_chunks ADD CONSTRAINT retail_knowledge_chunks_pkey PRIMARY KEY (id);
ALTER TABLE public.roi_measurements ADD CONSTRAINT roi_measurements_pkey PRIMARY KEY (id);
ALTER TABLE public.sample_data_templates ADD CONSTRAINT sample_data_templates_pkey PRIMARY KEY (id);
ALTER TABLE public.simulation_history ADD CONSTRAINT simulation_history_pkey PRIMARY KEY (id);
ALTER TABLE public.staff ADD CONSTRAINT staff_pkey PRIMARY KEY (id);
ALTER TABLE public.staff_assignments ADD CONSTRAINT staff_assignments_pkey PRIMARY KEY (id);
ALTER TABLE public.store_goals ADD CONSTRAINT store_goals_pkey PRIMARY KEY (id);
ALTER TABLE public.store_personas ADD CONSTRAINT store_personas_pkey PRIMARY KEY (id);
ALTER TABLE public.store_scenes ADD CONSTRAINT store_scenes_pkey PRIMARY KEY (id);
ALTER TABLE public.store_trade_area_context ADD CONSTRAINT store_trade_area_context_pkey PRIMARY KEY (id);
ALTER TABLE public.store_visits ADD CONSTRAINT store_visits_pkey PRIMARY KEY (id);
ALTER TABLE public.stored_model_parameters ADD CONSTRAINT stored_model_parameters_pkey PRIMARY KEY (id);
ALTER TABLE public.stores ADD CONSTRAINT stores_pkey PRIMARY KEY (id);
ALTER TABLE public.strategy_feedback ADD CONSTRAINT strategy_feedback_pkey PRIMARY KEY (id);
ALTER TABLE public.subscriptions ADD CONSTRAINT subscriptions_pkey PRIMARY KEY (id);
ALTER TABLE public.transactions ADD CONSTRAINT transactions_pkey PRIMARY KEY (id);
ALTER TABLE public.trend_signals ADD CONSTRAINT trend_signals_pkey PRIMARY KEY (id);
ALTER TABLE public.upload_sessions ADD CONSTRAINT upload_sessions_pkey PRIMARY KEY (id);
ALTER TABLE public.user_activity_logs ADD CONSTRAINT user_activity_logs_pkey PRIMARY KEY (id);
ALTER TABLE public.user_alerts ADD CONSTRAINT user_alerts_pkey PRIMARY KEY (id);
ALTER TABLE public.user_data_imports ADD CONSTRAINT user_data_imports_pkey PRIMARY KEY (id);
ALTER TABLE public.user_guide_completions ADD CONSTRAINT user_guide_completions_pkey PRIMARY KEY (id);
ALTER TABLE public.visit_zone_events ADD CONSTRAINT visit_zone_events_pkey PRIMARY KEY (id);
ALTER TABLE public.visits ADD CONSTRAINT visits_pkey PRIMARY KEY (id);
ALTER TABLE public.vmd_rule_applications ADD CONSTRAINT vmd_rule_applications_pkey PRIMARY KEY (id);
ALTER TABLE public.vmd_rulesets ADD CONSTRAINT vmd_rulesets_pkey PRIMARY KEY (id);
ALTER TABLE public.weather_data ADD CONSTRAINT weather_data_pkey PRIMARY KEY (id);
ALTER TABLE public.wifi_tracking ADD CONSTRAINT wifi_tracking_pkey PRIMARY KEY (id);
ALTER TABLE public.wifi_zones ADD CONSTRAINT wifi_zones_pkey PRIMARY KEY (id);
ALTER TABLE public.zone_daily_metrics ADD CONSTRAINT zone_daily_metrics_pkey PRIMARY KEY (id);
ALTER TABLE public.zone_events ADD CONSTRAINT zone_events_pkey PRIMARY KEY (id);
ALTER TABLE public.zone_transitions ADD CONSTRAINT zone_transitions_pkey PRIMARY KEY (id);
ALTER TABLE public.zones_dim ADD CONSTRAINT zones_dim_pkey PRIMARY KEY (id);

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================

ALTER TABLE public.ai_batch_test_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_inference_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_model_performance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_recommendations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_response_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analysis_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.api_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.api_mapping_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.api_sync_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.applied_strategies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.auto_order_suggestions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_context_memory ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contact_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_segments_agg ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_kpis_agg ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dashboard_kpis ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.data_source_sync_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.data_source_tables ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.data_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.data_sync_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.data_sync_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.economic_indicators ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.etl_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.external_data_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feedback_reason_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.funnel_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.funnel_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.furniture ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.furniture_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.graph_entities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.graph_relations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.holidays_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hourly_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_levels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.layout_optimization_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.learning_adjustments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.learning_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.licenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.line_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.model_3d_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.onboarding_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ontology_entity_mappings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ontology_entity_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ontology_mapping_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ontology_relation_mappings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ontology_relation_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ontology_schema_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.optimization_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.optimization_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pos_integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prediction_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_associations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_models ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_performance_agg ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_placements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quickstart_guides ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.raw_imports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.realtime_inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recommendation_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.regional_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.retail_concepts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.retail_knowledge_chunks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.roi_measurements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sample_data_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.simulation_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.staff ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.staff_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.store_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.store_personas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.store_scenes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.store_trade_area_context ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.store_visits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stored_model_parameters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.strategy_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trend_signals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.upload_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_data_imports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_guide_completions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.v_org_id ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.visit_zone_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.visits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vmd_rule_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vmd_rulesets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.weather_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wifi_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wifi_zones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.zone_daily_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.zone_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.zone_transitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.zones_dim ENABLE ROW LEVEL SECURITY;

-- ============================================
-- CUSTOM FUNCTIONS (98 functions)
-- ============================================

CREATE OR REPLACE FUNCTION public.add_user_to_default_org()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  default_org_id uuid;
  user_role app_role;
BEGIN
  -- Find NeuralTwin HQ organization
  SELECT id INTO default_org_id
  FROM organizations
  WHERE org_name = 'NeuralTwin HQ'
  LIMIT 1;

  -- Grant NEURALTWIN_MASTER role if email matches
  IF NEW.email = 'neuraltwin.hq@neuraltwin.io' THEN
    user_role := 'NEURALTWIN_MASTER';
  ELSE
    user_role := 'ORG_VIEWER';
  END IF;

  -- Add to organization_members
  IF default_org_id IS NOT NULL THEN
    INSERT INTO organization_members (org_id, user_id, role)
    VALUES (default_org_id, NEW.id, user_role)
    ON CONFLICT (user_id, org_id) DO NOTHING;
  END IF;

  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.aggregate_ai_performance(p_org_id uuid, p_store_id uuid DEFAULT NULL::uuid, p_model_type character varying DEFAULT NULL::character varying, p_start_date date DEFAULT NULL::date, p_end_date date DEFAULT NULL::date)
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$

DECLARE

  result JSON;

  v_start_date DATE;

  v_end_date DATE;

BEGIN

  -- 湲곕낯媛?: 理쒓렐 90?씪

  v_start_date := COALESCE(p_start_date, CURRENT_DATE - INTERVAL '90 days');

  v_end_date := COALESCE(p_end_date, CURRENT_DATE);



  SELECT json_build_object(

    'totalPredictions', COUNT(*),

    'appliedCount', COUNT(*) FILTER (WHERE was_applied),

    'measuredCount', COUNT(*) FILTER (WHERE result_measured),

    'successCount', COUNT(*) FILTER (WHERE feedback_type = 'success'),

    'partialCount', COUNT(*) FILTER (WHERE feedback_type = 'partial'),

    'failureCount', COUNT(*) FILTER (WHERE feedback_type IN ('failure', 'negative')),

    'successRate', CASE

      WHEN COUNT(*) FILTER (WHERE result_measured) > 0

      THEN ROUND(COUNT(*) FILTER (WHERE feedback_type = 'success')::NUMERIC /

           COUNT(*) FILTER (WHERE result_measured) * 100, 1)

      ELSE 0

    END,

    'applyRate', CASE

      WHEN COUNT(*) > 0

      THEN ROUND(COUNT(*) FILTER (WHERE was_applied)::NUMERIC / COUNT(*) * 100, 1)

      ELSE 0

    END,

    'avgConfidence', ROUND(AVG((ai_recommendation->>'confidence')::NUMERIC), 1),

    'avgActualROI', ROUND(AVG(actual_roi), 1),

    'avgPredictedROI', ROUND(AVG(expected_roi), 1),

    'predictionAccuracy', CASE

      WHEN COUNT(*) FILTER (WHERE actual_roi IS NOT NULL AND expected_roi IS NOT NULL AND expected_roi != 0) > 0

      THEN ROUND(100 - AVG(ABS(actual_roi - expected_roi) / NULLIF(ABS(expected_roi), 0) * 100) FILTER (WHERE actual_roi IS NOT NULL AND expected_roi IS NOT NULL AND expected_roi != 0), 1)

      ELSE NULL

    END,

    'confidenceAdjustment', CASE

      WHEN COUNT(*) FILTER (WHERE actual_roi IS NOT NULL AND expected_roi IS NOT NULL) >= 5

      THEN ROUND(AVG(actual_roi - expected_roi) FILTER (WHERE actual_roi IS NOT NULL AND expected_roi IS NOT NULL) / 10, 2)

      ELSE 0

    END,

    'periodStart', v_start_date,

    'periodEnd', v_end_date,

    'byType', (

      SELECT COALESCE(json_object_agg(strategy_type, type_stats), '{}'::json)

      FROM (

        SELECT

          strategy_type,

          json_build_object(

            'count', COUNT(*),

            'successRate', CASE

              WHEN COUNT(*) FILTER (WHERE result_measured) > 0

              THEN ROUND(COUNT(*) FILTER (WHERE feedback_type = 'success')::NUMERIC /

                   COUNT(*) FILTER (WHERE result_measured) * 100, 1)

              ELSE 0

            END,

            'avgROI', ROUND(AVG(actual_roi), 1)

          ) as type_stats

        FROM strategy_feedback sf2

        WHERE sf2.org_id = p_org_id

          AND (p_store_id IS NULL OR sf2.store_id = p_store_id)

          AND sf2.created_at BETWEEN v_start_date AND v_end_date + INTERVAL '1 day'

        GROUP BY strategy_type

      ) type_agg

    )

  ) INTO result

  FROM strategy_feedback

  WHERE org_id = p_org_id

    AND (p_store_id IS NULL OR store_id = p_store_id)

    AND (p_model_type IS NULL OR strategy_type = p_model_type)

    AND created_at BETWEEN v_start_date AND v_end_date + INTERVAL '1 day';



  RETURN result;

END;

$function$
;

CREATE OR REPLACE FUNCTION public.aggregate_zone_performance()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$

DECLARE

  v_zone TEXT;

  v_date DATE;

BEGIN

  v_date := DATE(NEW.visit_date);

  

  -- 媛? 諛⑸Ц 援ъ뿭?뿉 ????빐 吏묎퀎 ?뾽?뜲?씠?듃

  FOREACH v_zone IN ARRAY NEW.zones_visited LOOP

    INSERT INTO zone_performance (

      store_id, org_id, zone_name, date,

      visit_count, purchase_count, 

      avg_dwell_time

    )

    VALUES (

      NEW.store_id, NEW.org_id, v_zone, v_date,

      1,

      CASE WHEN NEW.made_purchase THEN 1 ELSE 0 END,

      COALESCE(NEW.duration_minutes::DECIMAL / array_length(NEW.zones_visited, 1), 0)

    )

    ON CONFLICT (store_id, zone_name, date) DO UPDATE SET

      visit_count = zone_performance.visit_count + 1,

      purchase_count = zone_performance.purchase_count + 

        CASE WHEN NEW.made_purchase THEN 1 ELSE 0 END,

      avg_dwell_time = (

        zone_performance.avg_dwell_time * zone_performance.visit_count + 

        COALESCE(NEW.duration_minutes::DECIMAL / array_length(NEW.zones_visited, 1), 0)

      ) / (zone_performance.visit_count + 1),

      conversion_rate = (zone_performance.purchase_count + 

        CASE WHEN NEW.made_purchase THEN 1 ELSE 0 END)::DECIMAL / 

        (zone_performance.visit_count + 1),

      updated_at = NOW();

  END LOOP;

  

  RETURN NEW;

END;

$function$
;

CREATE OR REPLACE FUNCTION public.calculate_confidence_adjustment(p_store_id uuid, p_strategy_type character varying, p_days integer DEFAULT 90)
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$

DECLARE

  result JSON;

  v_sample_size INTEGER;

  v_success_rate NUMERIC;

  v_avg_diff NUMERIC;

  v_adjustment NUMERIC;

BEGIN

  SELECT

    COUNT(*),

    CASE WHEN COUNT(*) FILTER (WHERE result_measured) > 0

         THEN COUNT(*) FILTER (WHERE feedback_type = 'success')::NUMERIC / COUNT(*) FILTER (WHERE result_measured)

         ELSE 0 END,

    AVG(actual_roi - expected_roi) FILTER (WHERE actual_roi IS NOT NULL AND expected_roi IS NOT NULL)

  INTO v_sample_size, v_success_rate, v_avg_diff

  FROM strategy_feedback

  WHERE store_id = p_store_id

    AND strategy_type = p_strategy_type

    AND result_measured = TRUE

    AND created_at >= CURRENT_DATE - (p_days || ' days')::INTERVAL;



  -- 議곗젙媛? 怨꾩궛:

  -- ?꽦怨듬쪧 ?넂?쑝硫? ?떊猶곕룄 ?긽?뼢 (理쒕?? +10)

  -- ROI ?삁痢? ?삤李? 諛섏쁺 (?삤李⑥쓽 10%瑜? 議곗젙媛믪쑝濡?)

  v_adjustment := 0;



  IF v_sample_size >= 5 THEN

    -- ?꽦怨듬쪧 湲곕컲 議곗젙

    IF v_success_rate >= 0.8 THEN

      v_adjustment := v_adjustment + 5;

    ELSIF v_success_rate >= 0.6 THEN

      v_adjustment := v_adjustment + 2;

    ELSIF v_success_rate < 0.4 THEN

      v_adjustment := v_adjustment - 5;

    END IF;



    -- ROI ?삤李? 湲곕컲 議곗젙

    IF v_avg_diff IS NOT NULL THEN

      v_adjustment := v_adjustment + LEAST(GREATEST(v_avg_diff / 10, -5), 5);

    END IF;

  END IF;



  SELECT json_build_object(

    'sampleSize', v_sample_size,

    'successRate', ROUND(v_success_rate * 100, 1),

    'avgROIDifference', ROUND(v_avg_diff, 1),

    'recommendedAdjustment', ROUND(v_adjustment, 1),

    'hasEnoughData', v_sample_size >= 5

  ) INTO result;



  RETURN result;

END;

$function$
;

CREATE OR REPLACE FUNCTION public.calculate_data_quality_score(p_store_id uuid, p_date date DEFAULT CURRENT_DATE)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$

DECLARE

  v_result JSONB;

  v_coverage JSONB := '{}';

  v_issues JSONB := '[]';

  v_total_score NUMERIC := 0;

  v_weight_sum NUMERIC := 0;

  v_count INTEGER;

  v_store_name TEXT;

  v_weights CONSTANT JSONB := '{"pos": 0.25, "sensor": 0.30, "crm": 0.15, "product": 0.15, "zone": 0.15}';

BEGIN

  -- ?뒪?넗?뼱 ?씠由? 議고쉶 (store_name 而щ읆留? ?궗?슜)

  SELECT store_name INTO v_store_name FROM stores WHERE id = p_store_id;



  IF v_store_name IS NULL THEN

    IF NOT EXISTS (SELECT 1 FROM stores WHERE id = p_store_id) THEN

      RETURN jsonb_build_object('success', false, 'error', 'Store not found');

    END IF;

    v_store_name := p_store_id::TEXT;

  END IF;



  -- 1. POS (transactions ?뀒?씠釉?)

  SELECT COUNT(*) INTO v_count FROM transactions WHERE store_id = p_store_id;

  v_coverage := v_coverage || jsonb_build_object('pos', jsonb_build_object(

    'available', v_count > 0, 'record_count', v_count,

    'completeness', LEAST(v_count::NUMERIC / 1000, 1), 'label', 'POS/留ㅼ텧 ?뜲?씠?꽣'));

  IF v_count = 0 THEN

    v_issues := v_issues || jsonb_build_object('type', 'missing', 'source', 'pos', 'severity', 'high', 'message', 'POS ?뜲?씠?꽣媛? ?뾾?뒿?땲?떎.');

  END IF;

  v_total_score := v_total_score + LEAST(v_count::NUMERIC / 1000, 1) * 0.25;

  v_weight_sum := v_weight_sum + 0.25;



  -- 2. Sensor (zone_events)

  SELECT COUNT(*) INTO v_count FROM zone_events WHERE store_id = p_store_id;

  v_coverage := v_coverage || jsonb_build_object('sensor', jsonb_build_object(

    'available', v_count > 0, 'record_count', v_count,

    'completeness', LEAST(v_count::NUMERIC / 5000, 1), 'label', 'NEURALSENSE ?꽱?꽌'));

  IF v_count = 0 THEN

    v_issues := v_issues || jsonb_build_object('type', 'missing', 'source', 'sensor', 'severity', 'high', 'message', 'NEURALSENSE ?뜲?씠?꽣媛? ?뾾?뒿?땲?떎.');

  END IF;

  v_total_score := v_total_score + LEAST(v_count::NUMERIC / 5000, 1) * 0.30;

  v_weight_sum := v_weight_sum + 0.30;



  -- 3. CRM

  SELECT COUNT(*) INTO v_count FROM customers WHERE store_id = p_store_id;

  v_coverage := v_coverage || jsonb_build_object('crm', jsonb_build_object(

    'available', v_count > 0, 'record_count', v_count,

    'completeness', CASE WHEN v_count > 0 THEN 1 ELSE 0 END, 'label', 'CRM/怨좉컼 ?뜲?씠?꽣'));

  v_total_score := v_total_score + (CASE WHEN v_count > 0 THEN 1 ELSE 0 END) * 0.15;

  v_weight_sum := v_weight_sum + 0.15;



  -- 4. Product

  SELECT COUNT(*) INTO v_count FROM products WHERE store_id = p_store_id;

  v_coverage := v_coverage || jsonb_build_object('product', jsonb_build_object(

    'available', v_count > 0, 'record_count', v_count,

    'completeness', CASE WHEN v_count > 0 THEN 1 ELSE 0 END, 'label', '?긽?뭹 留덉뒪?꽣'));

  v_total_score := v_total_score + (CASE WHEN v_count > 0 THEN 1 ELSE 0 END) * 0.15;

  v_weight_sum := v_weight_sum + 0.15;



  -- 5. Zone

  SELECT COUNT(*) INTO v_count FROM zones_dim WHERE store_id = p_store_id AND is_active = true;

  v_coverage := v_coverage || jsonb_build_object('zone', jsonb_build_object(

    'available', v_count > 0, 'record_count', v_count,

    'completeness', CASE WHEN v_count > 0 THEN 1 ELSE 0 END, 'label', '議?/援ъ뿭 ?꽕?젙'));

  v_total_score := v_total_score + (CASE WHEN v_count > 0 THEN 1 ELSE 0 END) * 0.15;

  v_weight_sum := v_weight_sum + 0.15;



  RETURN jsonb_build_object(

    'success', true, 'store_id', p_store_id, 'store_name', v_store_name, 'date', p_date,

    'overall_score', ROUND((v_total_score / NULLIF(v_weight_sum, 0)) * 100),

    'confidence_level', CASE

      WHEN v_total_score / NULLIF(v_weight_sum, 0) >= 0.8 THEN 'high'

      WHEN v_total_score / NULLIF(v_weight_sum, 0) >= 0.5 THEN 'medium'

      ELSE 'low' END,

    'coverage', v_coverage,

    'warnings', COALESCE(v_issues, '[]'::jsonb),

    'warning_count', jsonb_array_length(COALESCE(v_issues, '[]'::jsonb)),

    'calculated_at', NOW()

  );

END;

$function$
;

CREATE OR REPLACE FUNCTION public.calculate_furniture_visibility(p_height_zone text, p_facing text, p_is_focal_point boolean DEFAULT false, p_lighting_enhanced boolean DEFAULT false)
 RETURNS numeric
 LANGUAGE plpgsql
 IMMUTABLE
AS $function$

DECLARE

  v_base_score NUMERIC;

  v_facing_multiplier NUMERIC;

  v_bonus NUMERIC := 0;

BEGIN

  -- ?넂?씠蹂? 湲곕낯 ?젏?닔

  SELECT visibility_multiplier INTO v_base_score

  FROM furniture_height_zones

  WHERE code = p_height_zone;



  IF v_base_score IS NULL THEN

    v_base_score := 0.7;

  END IF;



  -- Facing 媛?以묒튂

  SELECT traffic_exposure INTO v_facing_multiplier

  FROM furniture_facings

  WHERE code = p_facing;



  IF v_facing_multiplier IS NULL THEN

    v_facing_multiplier := 1.0;

  END IF;



  -- 蹂대꼫?뒪

  IF p_is_focal_point THEN

    v_bonus := v_bonus + 0.15;

  END IF;



  IF p_lighting_enhanced THEN

    v_bonus := v_bonus + 0.1;

  END IF;



  RETURN LEAST(1.0, v_base_score * v_facing_multiplier + v_bonus);

END;

$function$
;

CREATE OR REPLACE FUNCTION public.calculate_kpi_changes()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$

DECLARE

  baseline_kpis JSONB;

  kpi_key TEXT;

  baseline_val NUMERIC;

  measured_val NUMERIC;

  absolute_change NUMERIC;

  percentage_change NUMERIC;

  changes JSONB := '{}';

BEGIN

  -- 踰좎씠?뒪?씪?씤 KPI 媛??졇?삤湲?

  SELECT ra.baseline_kpis INTO baseline_kpis

  FROM recommendation_applications ra

  WHERE ra.id = NEW.application_id;

  

  -- 媛? KPI?뿉 ????빐 蹂??솕?웾 怨꾩궛

  FOR kpi_key IN SELECT jsonb_object_keys(baseline_kpis)

  LOOP

    baseline_val := (baseline_kpis->>kpi_key)::NUMERIC;

    measured_val := (NEW.measured_kpis->>kpi_key)::NUMERIC;

    

    IF baseline_val IS NOT NULL AND measured_val IS NOT NULL AND baseline_val > 0 THEN

      absolute_change := measured_val - baseline_val;

      percentage_change := ROUND(((measured_val - baseline_val) / baseline_val * 100)::NUMERIC, 2);

      

      changes := changes || jsonb_build_object(

        kpi_key, jsonb_build_object(

          'absolute', absolute_change,

          'percentage', percentage_change

        )

      );

    END IF;

  END LOOP;

  

  NEW.kpi_changes := changes;

  

  -- 湲띿젙?쟻 ?쁺?뼢 ?뿬遺? ?뙋?떒 (留ㅼ텧 湲곗??)

  IF changes->'total_revenue'->>'percentage' IS NOT NULL THEN

    NEW.is_positive_impact := (changes->'total_revenue'->>'percentage')::NUMERIC > 0;

  END IF;

  

  RETURN NEW;

END;

$function$
;

CREATE OR REPLACE FUNCTION public.can_access_membership(membership_user_id uuid, membership_org_id uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF auth.uid() = membership_user_id THEN
    RETURN TRUE;
  END IF;
  
  IF EXISTS (
    SELECT 1 FROM auth.users 
    WHERE id = auth.uid() 
    AND email = 'neuraltwin.hq@neuraltwin.io'
  ) THEN
    RETURN TRUE;
  END IF;
  
  IF EXISTS (
    SELECT 1 FROM organization_members om
    WHERE om.user_id = auth.uid()
    AND om.org_id = membership_org_id
  ) THEN
    RETURN TRUE;
  END IF;
  
  RETURN FALSE;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.check_slot_display_compatibility(p_slot_id uuid, p_product_id uuid)
 RETURNS boolean
 LANGUAGE plpgsql
AS $function$

DECLARE

  v_slot_display_types TEXT[];

  v_product_display_type TEXT;

  v_product_compatible_types TEXT[];

BEGIN

  -- Get slot compatible types

  SELECT compatible_display_types INTO v_slot_display_types

  FROM furniture_slots WHERE id = p_slot_id;



  -- Get product display type and compatible types

  SELECT display_type, compatible_display_types

  INTO v_product_display_type, v_product_compatible_types

  FROM products WHERE id = p_product_id;



  -- Check if product's current display type is compatible with slot

  IF v_product_display_type = ANY(v_slot_display_types) THEN

    RETURN true;

  END IF;



  -- Check if any of product's compatible types match slot

  IF v_product_compatible_types IS NOT NULL THEN

    RETURN EXISTS (

      SELECT 1 FROM unnest(v_product_compatible_types) pct

      WHERE pct = ANY(v_slot_display_types)

    );

  END IF;



  RETURN false;

END;

$function$
;

CREATE OR REPLACE FUNCTION public.check_slot_product_compatibility(p_slot_id uuid, p_product_display_type text)
 RETURNS boolean
 LANGUAGE plpgsql
AS $function$

DECLARE

  v_compatible_types TEXT[];

BEGIN

  SELECT compatible_display_types INTO v_compatible_types

  FROM furniture_slots

  WHERE id = p_slot_id;



  IF v_compatible_types IS NULL THEN

    RETURN false;

  END IF;



  RETURN p_product_display_type = ANY(v_compatible_types);

END;

$function$
;

CREATE OR REPLACE FUNCTION public.compute_all_retail_concepts(p_store_id uuid, p_days integer DEFAULT 30)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$

DECLARE

  result JSONB := '{}';

  zone_funnel JSONB;

  cross_sell JSONB;

  turnover JSONB;

  heatmap JSONB;

  kpi_summary JSONB;

  entity_summary JSONB;

  relation_summary JSONB;

  store_info JSONB;

BEGIN

  -- 留ㅼ옣 ?젙蹂?

  SELECT jsonb_build_object(

    'store_name', s.store_name,

    'area_sqm', s.area_sqm,

    'status', s.status

  )

  INTO store_info

  FROM stores s

  WHERE s.id = p_store_id;



  -- 1. 援ъ뿭 ?쟾?솚 ?띁?꼸

  SELECT COALESCE(jsonb_agg(row_to_json(r)), '[]'::jsonb)

  INTO zone_funnel

  FROM compute_zone_conversion_funnel(p_store_id, p_days) r;



  -- 2. 援먯감 ?뙋留? 移쒗솕?룄

  SELECT COALESCE(jsonb_agg(row_to_json(r)), '[]'::jsonb)

  INTO cross_sell

  FROM compute_cross_sell_affinity(p_store_id, 3) r;



  -- 3. ?옱怨? ?쉶?쟾?쑉

  SELECT COALESCE(jsonb_agg(row_to_json(r)), '[]'::jsonb)

  INTO turnover

  FROM compute_inventory_turnover(p_store_id, p_days) r;



  -- 4. 援ъ뿭 ?엳?듃留?

  SELECT COALESCE(jsonb_agg(row_to_json(r)), '[]'::jsonb)

  INTO heatmap

  FROM compute_zone_heatmap(p_store_id, 7) r;



  -- 5. KPI ?슂?빟 (理쒓렐 7?씪)

  SELECT COALESCE(jsonb_agg(row_to_json(r)), '[]'::jsonb)

  INTO kpi_summary

  FROM get_daily_kpis_summary(p_store_id, 7) r;



  -- 6. ?뿏?떚?떚 ?슂?빟

  SELECT jsonb_build_object(

    'total', COUNT(*)::INT,

    'by_type', COALESCE(

      jsonb_object_agg(type_name, cnt),

      '{}'::jsonb

    )

  )

  INTO entity_summary

  FROM (

    SELECT

      COALESCE(oet.name, 'unknown') as type_name,

      COUNT(*)::INT as cnt

    FROM graph_entities ge

    LEFT JOIN ontology_entity_types oet ON ge.entity_type_id = oet.id

    WHERE ge.store_id = p_store_id

    GROUP BY oet.name

  ) sub;



  -- 7. 愿?怨? ?슂?빟

  SELECT jsonb_build_object(

    'total', COUNT(*)::INT,

    'by_type', COALESCE(

      jsonb_object_agg(type_name, cnt),

      '{}'::jsonb

    )

  )

  INTO relation_summary

  FROM (

    SELECT

      COALESCE(ort.name, 'unknown') as type_name,

      COUNT(*)::INT as cnt

    FROM graph_relations gr

    LEFT JOIN ontology_relation_types ort ON gr.relation_type_id = ort.id

    WHERE gr.store_id = p_store_id

    GROUP BY ort.name

  ) sub;



  -- 寃곌낵 議고빀

  result := jsonb_build_object(

    'computed_at', NOW(),

    'store_id', p_store_id,

    'period_days', p_days,

    'store_info', COALESCE(store_info, '{}'::jsonb),

    'zone_conversion_funnel', COALESCE(zone_funnel, '[]'::jsonb),

    'cross_sell_affinity', COALESCE(cross_sell, '[]'::jsonb),

    'inventory_turnover', COALESCE(turnover, '[]'::jsonb),

    'zone_heatmap', COALESCE(heatmap, '[]'::jsonb),

    'kpi_summary', COALESCE(kpi_summary, '[]'::jsonb),

    'entity_summary', COALESCE(entity_summary, '{"total":0,"by_type":{}}'::jsonb),

    'relation_summary', COALESCE(relation_summary, '{"total":0,"by_type":{}}'::jsonb)

  );



  RETURN result;

END;

$function$
;

CREATE OR REPLACE FUNCTION public.compute_cross_sell_affinity(p_store_id uuid, p_min_support integer DEFAULT 3)
 RETURNS TABLE(product_a text, product_b text, co_purchase_count bigint, support numeric)
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$

DECLARE

  total_tx BIGINT;

BEGIN

  -- 珥? 嫄곕옒 ?닔 怨꾩궛

  SELECT COUNT(DISTINCT ge.id) INTO total_tx

  FROM graph_entities ge

  JOIN ontology_entity_types oet ON ge.entity_type_id = oet.id

  WHERE ge.store_id = p_store_id

    AND LOWER(oet.name) IN ('transaction', 'order');



  IF total_tx = 0 THEN

    -- store_visits?뿉?꽌 援щℓ 嫄댁닔 議고쉶

    SELECT COUNT(*) INTO total_tx

    FROM store_visits

    WHERE store_id = p_store_id

      AND made_purchase = true

      AND visit_date >= NOW() - INTERVAL '30 days';

  END IF;



  RETURN QUERY

  WITH transaction_items AS (

    SELECT

      gr.source_entity_id as transaction_id,

      ge.id as product_id,

      ge.label as product_name

    FROM graph_relations gr

    JOIN graph_entities ge ON gr.target_entity_id = ge.id

    JOIN ontology_relation_types ort ON gr.relation_type_id = ort.id

    JOIN ontology_entity_types oet ON ge.entity_type_id = oet.id

    WHERE gr.store_id = p_store_id

      AND LOWER(ort.name) IN ('contains', 'has_item', 'purchased_product')

      AND LOWER(oet.name) IN ('product', 'item')

  )

  SELECT

    ti1.product_name::TEXT as product_a,

    ti2.product_name::TEXT as product_b,

    COUNT(*)::BIGINT as co_purchase_count,

    ROUND(COUNT(*)::NUMERIC / NULLIF(total_tx, 0), 4)::NUMERIC as support

  FROM transaction_items ti1

  JOIN transaction_items ti2

    ON ti1.transaction_id = ti2.transaction_id

    AND ti1.product_id < ti2.product_id

  GROUP BY ti1.product_name, ti2.product_name

  HAVING COUNT(*) >= p_min_support

  ORDER BY co_purchase_count DESC

  LIMIT 50;

END;

$function$
;

CREATE OR REPLACE FUNCTION public.compute_inventory_turnover(p_store_id uuid, p_days integer DEFAULT 30)
 RETURNS TABLE(product_name text, total_sold bigint, avg_stock numeric, turnover_rate numeric, days_of_stock numeric)
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$

BEGIN

  RETURN QUERY

  WITH product_data AS (

    SELECT

      ge.id as product_id,

      ge.label as product_label,

      COALESCE((ge.properties->>'stock_quantity')::INT, 0) as current_stock

    FROM graph_entities ge

    JOIN ontology_entity_types oet ON ge.entity_type_id = oet.id

    WHERE ge.store_id = p_store_id

      AND LOWER(oet.name) IN ('product', 'item')

  ),

  sales_data AS (

    SELECT

      gr.target_entity_id as product_id,

      SUM(COALESCE((gr.properties->>'quantity')::INT, 1)) as quantity_sold

    FROM graph_relations gr

    JOIN ontology_relation_types ort ON gr.relation_type_id = ort.id

    WHERE gr.store_id = p_store_id

      AND LOWER(ort.name) IN ('contains', 'has_item', 'sold')

      AND gr.created_at >= NOW() - (p_days || ' days')::INTERVAL

    GROUP BY gr.target_entity_id

  )

  SELECT

    pd.product_label::TEXT as product_name,

    COALESCE(sd.quantity_sold, 0)::BIGINT as total_sold,

    pd.current_stock::NUMERIC as avg_stock,

    CASE

      WHEN pd.current_stock > 0 THEN ROUND(COALESCE(sd.quantity_sold, 0)::NUMERIC / pd.current_stock, 2)

      ELSE 0

    END::NUMERIC as turnover_rate,

    CASE

      WHEN COALESCE(sd.quantity_sold, 0) > 0

      THEN ROUND(pd.current_stock::NUMERIC / (sd.quantity_sold::NUMERIC / p_days), 1)

      ELSE 999

    END::NUMERIC as days_of_stock

  FROM product_data pd

  LEFT JOIN sales_data sd ON pd.product_id = sd.product_id

  ORDER BY turnover_rate DESC;

END;

$function$
;

CREATE OR REPLACE FUNCTION public.compute_zone_conversion_funnel(p_store_id uuid, p_days integer DEFAULT 30)
 RETURNS TABLE(zone_name text, visitors bigint, avg_dwell numeric, purchases bigint, conversion_rate numeric)
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$

BEGIN

  RETURN QUERY

  -- zones_dim + zone_daily_metrics ?슦?꽑 ?궗?슜

  WITH zone_metrics AS (

    SELECT

      zd.zone_name,

      COALESCE(SUM(zdm.unique_visitors), 0)::BIGINT as total_visitors,

      COALESCE(AVG(zdm.avg_dwell_seconds), 0)::NUMERIC as avg_dwell_seconds,

      COALESCE(SUM(zdm.conversion_count), 0)::BIGINT as total_conversions

    FROM zones_dim zd

    LEFT JOIN zone_daily_metrics zdm ON zd.id = zdm.zone_id

      AND zdm.date >= CURRENT_DATE - p_days

    WHERE zd.store_id = p_store_id

      AND zd.is_active = true

    GROUP BY zd.zone_name

  )

  SELECT

    zm.zone_name::TEXT,

    zm.total_visitors as visitors,

    ROUND(zm.avg_dwell_seconds, 1) as avg_dwell,

    zm.total_conversions as purchases,

    CASE

      WHEN zm.total_visitors > 0

      THEN ROUND(zm.total_conversions::NUMERIC / zm.total_visitors * 100, 2)

      ELSE 0

    END::NUMERIC as conversion_rate

  FROM zone_metrics zm

  ORDER BY zm.total_visitors DESC;



  -- ?뜲?씠?꽣媛? ?뾾?쑝硫? graph_entities ?뤃諛?

  IF NOT FOUND THEN

    RETURN QUERY

    WITH zone_data AS (

      SELECT

        ge.label as zone_label,

        ge.id as zone_entity_id

      FROM graph_entities ge

      JOIN ontology_entity_types oet ON ge.entity_type_id = oet.id

      WHERE ge.store_id = p_store_id

        AND LOWER(oet.name) IN ('zone', 'area')

    ),

    visit_data AS (

      SELECT

        gr.target_entity_id,

        gr.source_entity_id,

        (gr.properties->>'dwell_seconds')::NUMERIC as dwell_seconds

      FROM graph_relations gr

      JOIN ontology_relation_types ort ON gr.relation_type_id = ort.id

      WHERE gr.store_id = p_store_id

        AND LOWER(ort.name) IN ('visited', 'entered_zone')

        AND gr.created_at >= NOW() - (p_days || ' days')::INTERVAL

    ),

    purchase_data AS (

      SELECT DISTINCT gr.source_entity_id as customer_id

      FROM graph_relations gr

      JOIN ontology_relation_types ort ON gr.relation_type_id = ort.id

      WHERE gr.store_id = p_store_id

        AND LOWER(ort.name) IN ('purchased', 'made_transaction')

        AND gr.created_at >= NOW() - (p_days || ' days')::INTERVAL

    )

    SELECT

      zd.zone_label::TEXT as zone_name,

      COUNT(DISTINCT vd.source_entity_id)::BIGINT as visitors,

      COALESCE(ROUND(AVG(vd.dwell_seconds), 1), 0)::NUMERIC as avg_dwell,

      COUNT(DISTINCT pd.customer_id)::BIGINT as purchases,

      COALESCE(

        ROUND(COUNT(DISTINCT pd.customer_id)::NUMERIC / NULLIF(COUNT(DISTINCT vd.source_entity_id), 0) * 100, 2),

        0

      )::NUMERIC as conversion_rate

    FROM zone_data zd

    LEFT JOIN visit_data vd ON zd.zone_entity_id = vd.target_entity_id

    LEFT JOIN purchase_data pd ON vd.source_entity_id = pd.customer_id

    GROUP BY zd.zone_label

    ORDER BY visitors DESC;

  END IF;

END;

$function$
;

CREATE OR REPLACE FUNCTION public.compute_zone_heatmap(p_store_id uuid, p_days integer DEFAULT 7)
 RETURNS TABLE(zone_name text, hour integer, visit_count bigint, avg_dwell numeric)
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$

BEGIN

  -- zone_events ?뀒?씠釉? ?슦?꽑 ?궗?슜

  RETURN QUERY

  SELECT

    zd.zone_name::TEXT,

    ze.event_hour as hour,

    COUNT(*)::BIGINT as visit_count,

    COALESCE(ROUND(AVG(ze.duration_seconds)::NUMERIC, 1), 0)::NUMERIC as avg_dwell

  FROM zones_dim zd

  JOIN zone_events ze ON zd.id = ze.zone_id

  WHERE zd.store_id = p_store_id

    AND ze.event_date >= CURRENT_DATE - p_days

    AND ze.event_type IN ('enter', 'dwell')

  GROUP BY zd.zone_name, ze.event_hour

  ORDER BY zd.zone_name, ze.event_hour;



  -- ?뜲?씠?꽣媛? ?뾾?쑝硫? graph_relations ?뤃諛?

  IF NOT FOUND THEN

    RETURN QUERY

    WITH zone_data AS (

      SELECT ge.label as zone_label, ge.id as zone_entity_id

      FROM graph_entities ge

      JOIN ontology_entity_types oet ON ge.entity_type_id = oet.id

      WHERE ge.store_id = p_store_id

        AND LOWER(oet.name) IN ('zone', 'area')

    ),

    visit_data AS (

      SELECT

        gr.target_entity_id,

        EXTRACT(HOUR FROM gr.created_at)::INT as visit_hour,

        (gr.properties->>'dwell_seconds')::NUMERIC as dwell_seconds

      FROM graph_relations gr

      JOIN ontology_relation_types ort ON gr.relation_type_id = ort.id

      WHERE gr.store_id = p_store_id

        AND LOWER(ort.name) IN ('visited', 'entered_zone')

        AND gr.created_at >= NOW() - (p_days || ' days')::INTERVAL

    )

    SELECT

      zd.zone_label::TEXT as zone_name,

      vd.visit_hour as hour,

      COUNT(*)::BIGINT as visit_count,

      COALESCE(ROUND(AVG(vd.dwell_seconds), 1), 0)::NUMERIC as avg_dwell

    FROM zone_data zd

    JOIN visit_data vd ON zd.zone_entity_id = vd.target_entity_id

    GROUP BY zd.zone_label, vd.visit_hour

    ORDER BY zd.zone_label, vd.visit_hour;

  END IF;

END;

$function$
;

CREATE OR REPLACE FUNCTION public.create_api_connection(p_org_id uuid, p_store_id uuid, p_name text, p_provider text, p_data_category text, p_url text, p_auth_type text, p_auth_config jsonb DEFAULT '{}'::jsonb, p_field_mappings jsonb DEFAULT '[]'::jsonb, p_target_table text DEFAULT NULL::text, p_response_data_path text DEFAULT 'data'::text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$

DECLARE

  v_connection_id uuid;

  v_template record;

BEGIN

  -- ?엯?젰 ?쑀?슚?꽦 寃??궗

  IF p_name IS NULL OR p_name = '' THEN

    RETURN jsonb_build_object('success', false, 'error', 'Name is required');

  END IF;



  IF p_url IS NULL OR p_url = '' THEN

    RETURN jsonb_build_object('success', false, 'error', 'URL is required');

  END IF;



  -- 留ㅽ븨 ?뀥?뵆由? 議고쉶 (?엳?쑝硫? 湲곕낯媛? ?쟻?슜)

  IF p_field_mappings = '[]'::jsonb AND p_provider IS NOT NULL AND p_data_category IS NOT NULL THEN

    SELECT * INTO v_template

    FROM api_mapping_templates

    WHERE provider = p_provider

      AND data_category = p_data_category

      AND target_table = COALESCE(p_target_table, target_table)

      AND is_active = true

    ORDER BY is_official DESC, created_at DESC

    LIMIT 1;



    IF FOUND THEN

      p_field_mappings := v_template.field_mappings;

      p_target_table := COALESCE(p_target_table, v_template.target_table);

      p_response_data_path := COALESCE(p_response_data_path, v_template.response_data_path, 'data');

    END IF;

  END IF;



  -- API ?뿰寃? ?깮?꽦 (type 而щ읆 異붽??)

  INSERT INTO api_connections (

    org_id,

    store_id,

    user_id,

    name,

    provider,

    data_category,

    url,

    method,

    type,  -- 異붽??: type 而щ읆

    auth_type,

    auth_config,

    field_mappings,

    target_table,

    response_data_path,

    is_active,

    status

  ) VALUES (

    p_org_id,

    p_store_id,

    auth.uid(),

    p_name,

    p_provider,

    p_data_category,

    p_url,

    'GET',

    'rest',  -- 湲곕낯媛?: REST API

    COALESCE(p_auth_type, 'none'),

    p_auth_config,

    p_field_mappings,

    p_target_table,

    p_response_data_path,

    true,

    'inactive'

  )

  RETURNING id INTO v_connection_id;



  RETURN jsonb_build_object(

    'success', true,

    'connection_id', v_connection_id,

    'message', 'API connection created successfully',

    'has_template', v_template IS NOT NULL

  );

END;

$function$
;

CREATE OR REPLACE FUNCTION public.create_guideline_notification()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  recipient_user_id UUID;
  recipient_users UUID[];
BEGIN
  IF NEW.target_stores IS NOT NULL AND ARRAY_LENGTH(NEW.target_stores, 1) > 0 THEN
    SELECT ARRAY_AGG(DISTINCT om.user_id)
    INTO recipient_users
    FROM organization_members om
    JOIN stores s ON s.org_id = om.org_id
    WHERE s.id = ANY(NEW.target_stores)
      AND om.role IN ('ORG_STORE', 'ORG_HQ')
      AND om.user_id != NEW.user_id;
  ELSE
    SELECT ARRAY_AGG(user_id)
    INTO recipient_users
    FROM organization_members
    WHERE org_id = NEW.org_id
      AND user_id != NEW.user_id;
  END IF;

  IF recipient_users IS NOT NULL THEN
    FOR recipient_user_id IN SELECT UNNEST(recipient_users)
    LOOP
      INSERT INTO hq_notifications (
        user_id,
        org_id,
        notification_type,
        title,
        message,
        reference_id,
        reference_type
      ) VALUES (
        recipient_user_id,
        NEW.org_id,
        'guideline',
        '?깉 媛??씠?뱶?씪?씤: ' || NEW.title,
        '移댄뀒怨좊━: ' || NEW.category || ' | ?슦?꽑?닚?쐞: ' || NEW.priority,
        NEW.id,
        'guideline'
      );
    END LOOP;
  END IF;

  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.create_message_notification()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  recipient_user_id UUID;
  recipient_users UUID[];
BEGIN
  IF NEW.recipient_store_id IS NOT NULL THEN
    SELECT ARRAY_AGG(DISTINCT om.user_id)
    INTO recipient_users
    FROM organization_members om
    JOIN stores s ON s.org_id = om.org_id
    WHERE s.id = NEW.recipient_store_id
      AND om.role IN ('ORG_STORE', 'ORG_HQ');
  ELSE
    SELECT ARRAY_AGG(user_id)
    INTO recipient_users
    FROM organization_members
    WHERE org_id = NEW.org_id
      AND user_id != NEW.user_id;
  END IF;

  IF recipient_users IS NOT NULL THEN
    FOR recipient_user_id IN SELECT UNNEST(recipient_users)
    LOOP
      INSERT INTO hq_notifications (
        user_id,
        org_id,
        notification_type,
        title,
        message,
        reference_id,
        reference_type
      ) VALUES (
        recipient_user_id,
        NEW.org_id,
        'message',
        CASE
          WHEN NEW.subject IS NOT NULL THEN NEW.subject
          ELSE '?깉 硫붿떆吏?: ' || NEW.message_type
        END,
        NEW.sender_name || '?떂?씠 硫붿떆吏?瑜? 蹂대깉?뒿?땲?떎: ' || 
        SUBSTRING(NEW.content, 1, 100) || 
        CASE WHEN LENGTH(NEW.content) > 100 THEN '...' ELSE '' END,
        NEW.id,
        'message'
      );
    END LOOP;
  END IF;

  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.ensure_system_context_connections(p_org_id uuid, p_store_id uuid DEFAULT NULL::uuid, p_user_id uuid DEFAULT NULL::uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$

DECLARE

  v_weather_id uuid;

  v_holidays_id uuid;

  v_user_id uuid;

  v_result jsonb;

BEGIN

  v_user_id := COALESCE(p_user_id, (SELECT id FROM auth.users LIMIT 1));



  IF v_user_id IS NULL THEN

    RETURN jsonb_build_object('success', false, 'error', 'No valid user_id found');

  END IF;



  -- ?궇?뵪 ?뿰寃? ?솗?씤/?깮?꽦

  SELECT id INTO v_weather_id

  FROM api_connections

  WHERE (p_store_id IS NULL OR store_id = p_store_id)

    AND org_id = p_org_id

    AND data_category = 'weather'

    AND connection_category = 'context'

  LIMIT 1;



  IF v_weather_id IS NULL THEN

    INSERT INTO api_connections (

      id, user_id, org_id, store_id, name, provider, type, url,

      status, is_active, data_category, connection_category,

      is_system_managed, display_order, icon_name, description,

      created_at, updated_at

    ) VALUES (

      gen_random_uuid(),

      v_user_id,

      p_org_id,

      p_store_id,

      '?궇?뵪 ?뜲?씠?꽣 (OpenWeatherMap)',

      'openweathermap',

      'rest',

      'https://api.openweathermap.org/data/2.5',

      'active',

      true,

      'weather',

      'context',

      true,

      10,

      'cloud-sun',

      '?떎?떆媛? ?궇?뵪 ?젙蹂대?? ?닔吏묓븯?뿬 留ㅼ옣 ?슫?쁺 遺꾩꽍?뿉 ?솢?슜?빀?땲?떎.',

      NOW(),

      NOW()

    )

    RETURNING id INTO v_weather_id;

  END IF;



  -- 怨듯쑕?씪 ?뿰寃? ?솗?씤/?깮?꽦

  SELECT id INTO v_holidays_id

  FROM api_connections

  WHERE (p_store_id IS NULL OR store_id = p_store_id)

    AND org_id = p_org_id

    AND data_category = 'holidays'

    AND connection_category = 'context'

  LIMIT 1;



  IF v_holidays_id IS NULL THEN

    INSERT INTO api_connections (

      id, user_id, org_id, store_id, name, provider, type, url,

      status, is_active, data_category, connection_category,

      is_system_managed, display_order, icon_name, description,

      created_at, updated_at

    ) VALUES (

      gen_random_uuid(),

      v_user_id,

      p_org_id,

      p_store_id,

      '怨듯쑕?씪/?씠踰ㅽ듃 (怨듦났?뜲?씠?꽣?룷?꽭)',

      'data-go-kr',

      'rest',

      'https://apis.data.go.kr/B090041/openapi/service/SpcdeInfoService',

      'active',

      true,

      'holidays',

      'context',

      true,

      11,

      'calendar',

      '怨듯쑕?씪 諛? ?듅蹂? ?씠踰ㅽ듃 ?젙蹂대?? ?닔吏묓븯?뿬 ?닔?슂 ?삁痢≪뿉 ?솢?슜?빀?땲?떎.',

      NOW(),

      NOW()

    )

    RETURNING id INTO v_holidays_id;

  END IF;



  v_result := jsonb_build_object(

    'success', true,

    'weather_connection_id', v_weather_id,

    'holidays_connection_id', v_holidays_id

  );



  RETURN v_result;

END;

$function$
;

CREATE OR REPLACE FUNCTION public.get_all_data_sources(p_org_id uuid, p_store_id uuid DEFAULT NULL::uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$

DECLARE

  v_business jsonb;

  v_context jsonb;

BEGIN

  -- 鍮꾩쫰?땲?뒪 ?뜲?씠?꽣 ?냼?뒪

  SELECT jsonb_agg(

    jsonb_build_object(

      'id', ac.id,

      'name', ac.name,

      'type', ac.type,

      'provider', ac.provider,

      'data_category', ac.data_category,

      'connection_category', 'business',

      'is_system_managed', COALESCE(ac.is_system_managed, false),

      'is_active', ac.is_active,

      'status', ac.status,

      'icon_name', ac.icon_name,

      'description', ac.description,

      'last_sync', ac.last_sync,

      'total_records_synced', COALESCE(ac.total_records_synced, 0),

      'display_order', COALESCE(ac.display_order, 100)

    )

    ORDER BY COALESCE(ac.display_order, 100), ac.name

  )

  INTO v_business

  FROM api_connections ac

  WHERE ac.org_id = p_org_id

    AND (ac.connection_category = 'business' OR ac.connection_category IS NULL)

    AND (p_store_id IS NULL OR ac.store_id = p_store_id OR ac.store_id IS NULL);



  -- 而⑦뀓?뒪?듃 ?뜲?씠?꽣 ?냼?뒪

  SELECT jsonb_agg(

    jsonb_build_object(

      'id', ac.id,

      'name', ac.name,

      'type', ac.type,

      'provider', ac.provider,

      'data_category', ac.data_category,

      'connection_category', 'context',

      'is_system_managed', COALESCE(ac.is_system_managed, false),

      'is_active', ac.is_active,

      'status', ac.status,

      'icon_name', ac.icon_name,

      'description', ac.description,

      'last_sync', ac.last_sync,

      'total_records_synced', COALESCE(ac.total_records_synced, 0),

      'display_order', COALESCE(ac.display_order, 100)

    )

    ORDER BY COALESCE(ac.display_order, 100), ac.name

  )

  INTO v_context

  FROM api_connections ac

  WHERE ac.org_id = p_org_id

    AND ac.connection_category = 'context'

    AND (p_store_id IS NULL OR ac.store_id = p_store_id OR ac.store_id IS NULL);



  RETURN jsonb_build_object(

    'success', true,

    'business', COALESCE(v_business, '[]'::jsonb),

    'context', COALESCE(v_context, '[]'::jsonb),

    'business_count', jsonb_array_length(COALESCE(v_business, '[]'::jsonb)),

    'context_count', jsonb_array_length(COALESCE(v_context, '[]'::jsonb))

  );

END;

$function$
;

CREATE OR REPLACE FUNCTION public.get_api_connections_dashboard(p_org_id uuid DEFAULT NULL::uuid, p_store_id uuid DEFAULT NULL::uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$

DECLARE

  v_connections jsonb;

  v_summary jsonb;

BEGIN

  -- ?뿰寃? 紐⑸줉 議고쉶

  SELECT jsonb_agg(

    jsonb_build_object(

      'id', ac.id,

      'name', ac.name,

      'provider', ac.provider,

      'data_category', ac.data_category,

      'url', ac.url,

      'auth_type', ac.auth_type,

      'status', ac.status,

      'target_table', ac.target_table,

      'sync_frequency', ac.sync_frequency,

      'last_sync', ac.last_sync,

      'last_tested_at', ac.last_tested_at,

      'last_error', ac.last_error,

      'total_records_synced', ac.total_records_synced,

      'last_sync_duration_ms', ac.last_sync_duration_ms,

      'is_active', ac.is_active,

      'created_at', ac.created_at

    )

    ORDER BY ac.created_at DESC

  )

  INTO v_connections

  FROM api_connections ac

  WHERE (p_org_id IS NULL OR ac.org_id = p_org_id)

    AND (p_store_id IS NULL OR ac.store_id = p_store_id);



  -- ?슂?빟 ?젙蹂?

  SELECT jsonb_build_object(

    'total', COUNT(*),

    'active', COUNT(*) FILTER (WHERE status = 'active'),

    'error', COUNT(*) FILTER (WHERE status = 'error'),

    'inactive', COUNT(*) FILTER (WHERE status = 'inactive'),

    'by_category', jsonb_object_agg(

      COALESCE(data_category, 'unknown'),

      category_count

    )

  )

  INTO v_summary

  FROM (

    SELECT

      data_category,

      COUNT(*) as category_count

    FROM api_connections

    WHERE (p_org_id IS NULL OR org_id = p_org_id)

      AND (p_store_id IS NULL OR store_id = p_store_id)

    GROUP BY data_category

  ) sub

  CROSS JOIN (

    SELECT COUNT(*) as total

    FROM api_connections

    WHERE (p_org_id IS NULL OR org_id = p_org_id)

      AND (p_store_id IS NULL OR store_id = p_store_id)

  ) totals;



  RETURN jsonb_build_object(

    'success', true,

    'connections', COALESCE(v_connections, '[]'::jsonb),

    'summary', COALESCE(v_summary, '{}'::jsonb)

  );

END;

$function$
;

CREATE OR REPLACE FUNCTION public.get_applicable_vmd_rules(p_zone_type text DEFAULT NULL::text, p_category text DEFAULT NULL::text, p_min_confidence numeric DEFAULT 0.5, p_limit integer DEFAULT 10)
 RETURNS TABLE(rule_code text, rule_name text, rule_name_ko text, rule_category text, description_ko text, recommended_action_ko text, expected_impact jsonb, confidence_level numeric, priority integer)
 LANGUAGE plpgsql
 STABLE
AS $function$

BEGIN

  RETURN QUERY

  SELECT

    r.rule_code,

    r.rule_name,

    r.rule_name_ko,

    r.rule_category,

    r.description_ko,

    r.recommended_action_ko,

    r.expected_impact,

    r.confidence_level,

    r.priority

  FROM vmd_rulesets r

  WHERE r.is_active = true

    AND r.confidence_level >= p_min_confidence

    AND (p_category IS NULL OR r.rule_category = p_category)

    AND (p_zone_type IS NULL OR

         r.trigger_conditions->'zone_type' IS NULL OR

         r.trigger_conditions->'zone_type' ? p_zone_type)

  ORDER BY r.priority DESC, r.confidence_level DESC

  LIMIT p_limit;

END;

$function$
;

CREATE OR REPLACE FUNCTION public.get_applied_strategies(p_store_id uuid, p_start_date timestamp with time zone DEFAULT NULL::timestamp with time zone, p_end_date timestamp with time zone DEFAULT NULL::timestamp with time zone, p_limit integer DEFAULT 50)
 RETURNS TABLE(id uuid, name text, source text, source_module text, status text, result text, final_roi numeric, current_roi numeric, expected_roi numeric, actual_revenue numeric, expected_revenue numeric, start_date date, end_date date, created_at timestamp with time zone)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$

  SELECT

    s.id,

    s.name,

    s.source,

    s.source_module,

    s.status,

    s.result,

    s.final_roi,

    s.current_roi,

    s.expected_roi,

    s.actual_revenue,

    s.expected_revenue,

    s.start_date,

    s.end_date,

    s.created_at

  FROM applied_strategies s

  WHERE s.store_id = p_store_id

    AND (p_start_date IS NULL OR s.created_at >= p_start_date)

    AND (p_end_date IS NULL OR s.created_at <= p_end_date)

  ORDER BY s.created_at DESC

  LIMIT p_limit;

$function$
;

CREATE OR REPLACE FUNCTION public.get_association_summary(p_store_id uuid)
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$

DECLARE

  result JSON;

BEGIN

  SELECT json_build_object(

    'totalRules', COUNT(*),

    'activeRules', COUNT(*) FILTER (WHERE is_active),

    'veryStrongRules', COUNT(*) FILTER (WHERE rule_strength = 'very_strong' AND is_active),

    'strongRules', COUNT(*) FILTER (WHERE rule_strength = 'strong' AND is_active),

    'moderateRules', COUNT(*) FILTER (WHERE rule_strength = 'moderate' AND is_active),

    'weakRules', COUNT(*) FILTER (WHERE rule_strength = 'weak' AND is_active),

    'avgConfidence', ROUND(AVG(confidence) FILTER (WHERE is_active)::NUMERIC, 3),

    'avgLift', ROUND(AVG(lift) FILTER (WHERE is_active)::NUMERIC, 2),

    'bundleRecommendations', COUNT(*) FILTER (WHERE placement_type = 'bundle' AND is_active),

    'crossSellRecommendations', COUNT(*) FILTER (WHERE placement_type = 'cross_sell' AND is_active),

    'upsellRecommendations', COUNT(*) FILTER (WHERE placement_type = 'upsell' AND is_active),

    'impulseRecommendations', COUNT(*) FILTER (WHERE placement_type = 'impulse' AND is_active),

    'dataQuality', CASE

      WHEN AVG(sample_transaction_count) >= 500 THEN 'excellent'

      WHEN AVG(sample_transaction_count) >= 200 THEN 'good'

      WHEN AVG(sample_transaction_count) >= 50 THEN 'fair'

      ELSE 'poor'

    END

  ) INTO result

  FROM product_associations

  WHERE store_id = p_store_id;



  RETURN result;

END;

$function$
;

CREATE OR REPLACE FUNCTION public.get_available_slots_for_display_type(p_store_id uuid, p_display_type text)
 RETURNS TABLE(slot_id uuid, furniture_id uuid, slot_code text, slot_type text, slot_position jsonb, furniture_type text)
 LANGUAGE plpgsql
AS $function$

BEGIN

  RETURN QUERY

  SELECT

    fs.id,

    fs.furniture_id,

    fs.slot_id,

    fs.slot_type,

    fs.slot_position,

    fs.furniture_type

  FROM furniture_slots fs

  WHERE fs.store_id = p_store_id

    AND fs.is_occupied = false

    AND p_display_type = ANY(fs.compatible_display_types);

END;

$function$
;

CREATE OR REPLACE FUNCTION public.get_category_affinities(p_store_id uuid, p_limit integer DEFAULT 10)
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$

DECLARE

  result JSON;

BEGIN

  SELECT COALESCE(json_agg(affinity_data), '[]'::json) INTO result

  FROM (

    SELECT

      json_build_object(

        'category1', antecedent_category,

        'category2', consequent_category,

        'categoryPair', category_pair,

        'avgConfidence', ROUND(AVG(confidence)::NUMERIC, 3),

        'avgLift', ROUND(AVG(lift)::NUMERIC, 2),

        'ruleCount', COUNT(*),

        'strongRuleCount', COUNT(*) FILTER (WHERE rule_strength IN ('very_strong', 'strong')),

        'avgCoOccurrence', ROUND(AVG(co_occurrence_count)::NUMERIC, 0)

      ) as affinity_data

    FROM product_associations

    WHERE store_id = p_store_id

      AND is_active = true

      AND antecedent_category IS NOT NULL

      AND consequent_category IS NOT NULL

      AND antecedent_category != consequent_category

    GROUP BY antecedent_category, consequent_category, category_pair

    ORDER BY AVG(lift) DESC

    LIMIT p_limit

  ) affinities;



  RETURN result;

END;

$function$
;

CREATE OR REPLACE FUNCTION public.get_compatible_slots_for_product(p_store_id uuid, p_product_id uuid)
 RETURNS TABLE(slot_uuid uuid, furniture_id uuid, slot_code text, slot_type text, slot_position jsonb, furniture_type text, compatible_display_types text[])
 LANGUAGE plpgsql
AS $function$

DECLARE

  v_product_compatible_types TEXT[];

BEGIN

  -- Get product's compatible display types

  SELECT p.compatible_display_types INTO v_product_compatible_types

  FROM products p WHERE p.id = p_product_id;



  RETURN QUERY

  SELECT

    fs.id,

    fs.furniture_id,

    fs.slot_id,

    fs.slot_type,

    fs.slot_position,

    fs.furniture_type,

    fs.compatible_display_types

  FROM furniture_slots fs

  WHERE fs.store_id = p_store_id

    AND fs.is_occupied = false

    AND EXISTS (

      SELECT 1 FROM unnest(v_product_compatible_types) pct

      WHERE pct = ANY(fs.compatible_display_types)

    );

END;

$function$
;

CREATE OR REPLACE FUNCTION public.get_context_data_sources(p_org_id uuid, p_store_id uuid DEFAULT NULL::uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$

DECLARE

  v_connections jsonb;

  v_weather_data jsonb;

  v_event_data jsonb;

BEGIN

  -- 而⑦뀓?뒪?듃 ?뿰寃? 議고쉶

  SELECT jsonb_agg(

    jsonb_build_object(

      'id', ac.id,

      'name', ac.name,

      'type', ac.type,

      'provider', ac.provider,

      'data_category', ac.data_category,

      'connection_category', ac.connection_category,

      'is_system_managed', ac.is_system_managed,

      'is_active', ac.is_active,

      'status', ac.status,

      'icon_name', ac.icon_name,

      'description', ac.description,

      'last_sync', ac.last_sync,

      'total_records_synced', COALESCE(ac.total_records_synced, 0),

      'display_order', COALESCE(ac.display_order, 100)

    )

    ORDER BY ac.display_order, ac.name

  )

  INTO v_connections

  FROM api_connections ac

  WHERE ac.org_id = p_org_id

    AND ac.connection_category = 'context'

    AND (p_store_id IS NULL OR ac.store_id = p_store_id OR ac.store_id IS NULL);



  -- 理쒓렐 ?궇?뵪 ?뜲?씠?꽣 ?슂?빟 (?꽑?깮?쟻)

  SELECT jsonb_build_object(

    'latest_date', MAX(date),

    'record_count', COUNT(*),

    'avg_temperature', ROUND(AVG(temperature)::numeric, 1)

  )

  INTO v_weather_data

  FROM weather_data

  WHERE org_id = p_org_id

    AND (p_store_id IS NULL OR store_id = p_store_id)

    AND date >= CURRENT_DATE - INTERVAL '7 days';



  -- 理쒓렐 ?씠踰ㅽ듃 ?뜲?씠?꽣 ?슂?빟 (?꽑?깮?쟻)

  SELECT jsonb_build_object(

    'latest_date', MAX(date),

    'record_count', COUNT(*),

    'upcoming_events', COUNT(*) FILTER (WHERE date >= CURRENT_DATE)

  )

  INTO v_event_data

  FROM holidays_events

  WHERE org_id = p_org_id

    AND (p_store_id IS NULL OR store_id = p_store_id)

    AND date >= CURRENT_DATE - INTERVAL '30 days';



  RETURN jsonb_build_object(

    'success', true,

    'connections', COALESCE(v_connections, '[]'::jsonb),

    'weather_summary', COALESCE(v_weather_data, '{}'::jsonb),

    'events_summary', COALESCE(v_event_data, '{}'::jsonb)

  );

END;

$function$
;

CREATE OR REPLACE FUNCTION public.get_customer_segments(p_org_id uuid, p_store_id uuid, p_start_date date, p_end_date date)
 RETURNS TABLE(segment_name text, customer_count bigint, avg_transaction_value numeric, visit_frequency numeric)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$

  SELECT

    cs.segment_name,

    COALESCE(SUM(cs.customer_count), 0)::bigint AS customer_count,

    CASE WHEN COUNT(*) > 0

         THEN ROUND(COALESCE(SUM(cs.avg_transaction_value), 0) / COUNT(*), 0)::numeric

         ELSE 0 END AS avg_transaction_value,

    CASE WHEN COUNT(*) > 0

         THEN ROUND(COALESCE(SUM(cs.visit_frequency), 0)::numeric / COUNT(*), 1)

         ELSE 0 END AS visit_frequency

  FROM customer_segments_agg cs

  WHERE cs.org_id = p_org_id

    AND cs.store_id = p_store_id

    AND cs.date >= p_start_date

    AND cs.date <= p_end_date

  GROUP BY cs.segment_name

  ORDER BY SUM(cs.customer_count) DESC;

$function$
;

CREATE OR REPLACE FUNCTION public.get_daily_kpis_summary(p_store_id uuid, p_days integer DEFAULT 30)
 RETURNS TABLE(date date, total_visitors integer, total_transactions integer, total_revenue numeric, conversion_rate numeric, avg_transaction_value numeric, sales_per_sqm numeric)
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$

BEGIN

  RETURN QUERY

  SELECT

    dka.date,

    COALESCE(dka.total_visitors, 0)::INT,

    COALESCE(dka.total_transactions, 0)::INT,

    COALESCE(dka.total_revenue, 0)::NUMERIC,

    COALESCE(dka.conversion_rate, 0)::NUMERIC,

    COALESCE(dka.avg_transaction_value, 0)::NUMERIC,

    COALESCE(dka.sales_per_sqm, 0)::NUMERIC

  FROM daily_kpis_agg dka

  WHERE dka.store_id = p_store_id

    AND dka.date >= CURRENT_DATE - p_days

  ORDER BY dka.date DESC;

END;

$function$
;

CREATE OR REPLACE FUNCTION public.get_data_control_tower_status(p_store_id uuid, p_limit integer DEFAULT 20)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$

DECLARE

  v_result JSONB;

  v_data_sources JSONB;

  v_recent_imports JSONB;

  v_etl_runs_data JSONB;

  v_pipeline_stats JSONB;

  v_quality_score JSONB;

  v_l2_count INTEGER := 0;

  v_l3_count INTEGER := 0;

BEGIN

  -- 1. ?뜲?씠?꽣 ?뭹吏? ?젏?닔

  v_quality_score := calculate_data_quality_score(p_store_id, CURRENT_DATE);



  -- 2. 理쒓렐 Imports (COALESCE ?쟻?슜)

  SELECT COALESCE(jsonb_agg(

    jsonb_build_object(

      'id', id, 'source_type', source_type, 'source_name', source_name,

      'data_type', data_type, 'row_count', row_count, 'status', status,

      'error_message', error_message, 'created_at', created_at, 'completed_at', completed_at

    ) ORDER BY created_at DESC

  ), '[]'::jsonb)

  INTO v_recent_imports

  FROM (SELECT * FROM raw_imports WHERE store_id = p_store_id ORDER BY created_at DESC LIMIT p_limit) sub;



  -- 3. 理쒓렐 ETL Runs (COALESCE ?쟻?슜)

  SELECT COALESCE(jsonb_agg(

    jsonb_build_object(

      'id', id, 'etl_function', etl_function, 'status', status,

      'input_record_count', input_record_count, 'output_record_count', output_record_count,

      'duration_ms', duration_ms, 'started_at', started_at, 'completed_at', completed_at

    ) ORDER BY started_at DESC

  ), '[]'::jsonb)

  INTO v_etl_runs_data

  FROM (SELECT * FROM etl_runs WHERE store_id = p_store_id ORDER BY started_at DESC LIMIT p_limit) sub;



  -- 4. ?뙆?씠?봽?씪?씤 ?넻怨?

  SELECT jsonb_build_object(

    'raw_imports', jsonb_build_object(

      'total', COALESCE(COUNT(*), 0),

      'completed', COALESCE(COUNT(*) FILTER (WHERE status = 'completed'), 0),

      'failed', COALESCE(COUNT(*) FILTER (WHERE status = 'failed'), 0),

      'pending', COALESCE(COUNT(*) FILTER (WHERE status = 'pending'), 0)

    )

  )

  INTO v_pipeline_stats

  FROM raw_imports WHERE store_id = p_store_id;



  -- ETL ?넻怨? 異붽??

  SELECT COALESCE(v_pipeline_stats, '{}'::jsonb) || jsonb_build_object(

    'etl_runs', jsonb_build_object(

      'total', COALESCE(COUNT(*), 0),

      'completed', COALESCE(COUNT(*) FILTER (WHERE status = 'completed'), 0),

      'failed', COALESCE(COUNT(*) FILTER (WHERE status = 'failed'), 0),

      'running', COALESCE(COUNT(*) FILTER (WHERE status = 'running'), 0)

    )

  )

  INTO v_pipeline_stats

  FROM etl_runs WHERE store_id = p_store_id;



  -- L2/L3 移댁슫?듃

  SELECT COALESCE(COUNT(*), 0) INTO v_l2_count FROM zone_events WHERE store_id = p_store_id;

  SELECT COALESCE(COUNT(*), 0) INTO v_l3_count FROM daily_kpis_agg WHERE store_id = p_store_id;



  v_pipeline_stats := COALESCE(v_pipeline_stats, '{}'::jsonb) || jsonb_build_object('l2_records', v_l2_count, 'l3_records', v_l3_count);



  -- 5. ?뜲?씠?꽣 ?냼?뒪 ?긽?깭

  v_data_sources := jsonb_build_object(

    'pos', jsonb_build_object(

      'name', 'POS', 'description', '留ㅼ텧/嫄곕옒 ?뜲?씠?꽣',

      'status', CASE WHEN (v_quality_score->'coverage'->'pos'->>'available')::boolean THEN 'active' ELSE 'inactive' END,

      'last_sync', (SELECT MAX(created_at) FROM raw_imports WHERE store_id = p_store_id AND data_type IN ('purchases', 'sales'))

    ),

    'sensor', jsonb_build_object(

      'name', 'NEURALSENSE', 'description', 'WiFi/BLE ?꽱?꽌',

      'status', CASE WHEN (v_quality_score->'coverage'->'sensor'->>'available')::boolean THEN 'active' ELSE 'inactive' END,

      'last_sync', (SELECT MAX(created_at) FROM raw_imports WHERE store_id = p_store_id AND source_type = 'neuralsense')

    ),

    'crm', jsonb_build_object(

      'name', 'CRM', 'description', '怨좉컼/CDP ?뜲?씠?꽣',

      'status', CASE WHEN (v_quality_score->'coverage'->'crm'->>'available')::boolean THEN 'active' ELSE 'inactive' END,

      'last_sync', (SELECT MAX(created_at) FROM raw_imports WHERE store_id = p_store_id AND data_type = 'customers')

    ),

    'product', jsonb_build_object(

      'name', 'ERP', 'description', '?옱怨?/?긽?뭹 ?뜲?씠?꽣',

      'status', CASE WHEN (v_quality_score->'coverage'->'product'->>'available')::boolean THEN 'active' ELSE 'inactive' END,

      'last_sync', (SELECT MAX(created_at) FROM raw_imports WHERE store_id = p_store_id AND data_type = 'products')

    )

  );



  -- 理쒖쥌 寃곌낵

  v_result := jsonb_build_object(

    'success', true,

    'store_id', p_store_id,

    'quality_score', COALESCE(v_quality_score, '{}'::jsonb),

    'data_sources', COALESCE(v_data_sources, '{}'::jsonb),

    'recent_imports', COALESCE(v_recent_imports, '[]'::jsonb),

    'recent_etl_runs', COALESCE(v_etl_runs_data, '[]'::jsonb),

    'pipeline_stats', COALESCE(v_pipeline_stats, '{}'::jsonb),

    'queried_at', NOW()

  );



  RETURN v_result;

END;

$function$
;

CREATE OR REPLACE FUNCTION public.get_failure_patterns(p_store_id uuid, p_strategy_type character varying, p_limit integer DEFAULT 3)
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$

DECLARE

  result JSON;

BEGIN

  SELECT COALESCE(json_agg(pattern_data), '[]'::json) INTO result

  FROM (

    SELECT

      json_build_object(

        'id', id,

        'recommendation', ai_recommendation,

        'actualROI', actual_roi,

        'expectedROI', expected_roi,

        'learnings', learnings,

        'appliedAt', applied_at

      ) as pattern_data

    FROM strategy_feedback

    WHERE store_id = p_store_id

      AND strategy_type = p_strategy_type

      AND feedback_type IN ('failure', 'negative')

      AND result_measured = TRUE

    ORDER BY created_at DESC

    LIMIT p_limit

  ) failure_patterns;



  RETURN result;

END;

$function$
;

CREATE OR REPLACE FUNCTION public.get_funnel_stats(p_store_id uuid, p_start_date date, p_end_date date)
 RETURNS TABLE(event_type text, unique_visitors bigint)
 LANGUAGE sql
 STABLE
AS $function$

  SELECT 

    fe.event_type::TEXT,

    COUNT(DISTINCT fe.visitor_id)::BIGINT as unique_visitors

  FROM funnel_events fe

  WHERE fe.store_id = p_store_id

    AND fe.event_date >= p_start_date

    AND fe.event_date <= p_end_date

  GROUP BY fe.event_type;

$function$
;

CREATE OR REPLACE FUNCTION public.get_hourly_entry_counts(p_org_id uuid, p_store_id uuid, p_start_date date, p_end_date date)
 RETURNS TABLE(hour integer, count bigint)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$

  SELECT

    event_hour as hour,

    COUNT(*)::bigint as count

  FROM funnel_events

  WHERE org_id = p_org_id

    AND store_id = p_store_id

    AND event_type = 'entry'

    AND event_date >= p_start_date

    AND event_date <= p_end_date

    AND event_hour IS NOT NULL

  GROUP BY event_hour

  ORDER BY event_hour;

$function$
;

CREATE OR REPLACE FUNCTION public.get_hourly_traffic(p_store_id uuid, p_date date DEFAULT CURRENT_DATE)
 RETURNS TABLE(hour integer, visitor_count integer, transaction_count integer, revenue numeric, conversion_rate numeric)
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$

BEGIN

  RETURN QUERY

  SELECT

    hm.hour,

    COALESCE(hm.visitor_count, 0)::INT,

    COALESCE(hm.transaction_count, 0)::INT,

    COALESCE(hm.revenue, 0)::NUMERIC,

    COALESCE(hm.conversion_rate, 0)::NUMERIC

  FROM hourly_metrics hm

  WHERE hm.store_id = p_store_id

    AND hm.date = p_date

  ORDER BY hm.hour;

END;

$function$
;

CREATE OR REPLACE FUNCTION public.get_inventory_movements(p_org_id uuid, p_start_date date, p_end_date date, p_limit integer DEFAULT 50)
 RETURNS TABLE(id uuid, product_id uuid, product_name text, movement_type text, quantity integer, previous_stock integer, new_stock integer, reason text, moved_at timestamp with time zone)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$

  SELECT

    im.id,

    im.product_id,

    COALESCE(pr.product_name, 'Unknown') AS product_name,

    im.movement_type,

    im.quantity,

    im.previous_stock,

    im.new_stock,

    im.reason,

    im.moved_at

  FROM inventory_movements im

  LEFT JOIN products pr ON pr.id = im.product_id

  WHERE im.org_id = p_org_id

    AND im.moved_at >= p_start_date::timestamptz

    AND im.moved_at < (p_end_date + interval '1 day')::timestamptz

  ORDER BY im.moved_at DESC

  LIMIT p_limit;

$function$
;

CREATE OR REPLACE FUNCTION public.get_inventory_status(p_org_id uuid)
 RETURNS TABLE(product_id uuid, product_name text, sku text, category text, price numeric, current_stock integer, minimum_stock integer, optimal_stock integer, weekly_demand numeric, stock_status text, days_until_stockout integer)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$

  SELECT

    il.product_id,

    COALESCE(pr.product_name, 'Unknown') AS product_name,

    COALESCE(pr.sku, '') AS sku,

    COALESCE(pr.category, '湲고??') AS category,

    pr.price,

    il.current_stock,

    il.minimum_stock,

    il.optimal_stock,

    il.weekly_demand,

    CASE

      WHEN il.current_stock <= il.minimum_stock THEN 'critical'

      WHEN il.current_stock < (il.optimal_stock * 0.5)::integer THEN 'low'

      WHEN il.current_stock > (il.optimal_stock * 1.5)::integer THEN 'overstock'

      ELSE 'normal'

    END AS stock_status,

    CASE

      WHEN il.weekly_demand IS NOT NULL AND il.weekly_demand > 0

        THEN FLOOR(il.current_stock * 7.0 / il.weekly_demand)::integer

      ELSE NULL

    END AS days_until_stockout

  FROM inventory_levels il

  LEFT JOIN products pr ON pr.id = il.product_id

  WHERE il.org_id = p_org_id;

$function$
;

CREATE OR REPLACE FUNCTION public.get_kpi_lineage(p_kpi_table text, p_kpi_id uuid DEFAULT NULL::uuid, p_store_id uuid DEFAULT NULL::uuid, p_date date DEFAULT NULL::date)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$

DECLARE

  v_result JSONB := '{}';

  v_kpi_record JSONB;

  v_source_trace JSONB;

  v_raw_imports JSONB;

BEGIN

  -- KPI ?젅肄붾뱶 議고쉶

  IF p_kpi_table = 'daily_kpis_agg' THEN

    IF p_kpi_id IS NOT NULL THEN

      SELECT to_jsonb(t.*) INTO v_kpi_record FROM daily_kpis_agg t WHERE id = p_kpi_id;

    ELSIF p_store_id IS NOT NULL AND p_date IS NOT NULL THEN

      SELECT to_jsonb(t.*) INTO v_kpi_record FROM daily_kpis_agg t WHERE store_id = p_store_id AND date = p_date LIMIT 1;

    END IF;

  ELSIF p_kpi_table = 'zone_daily_metrics' THEN

    IF p_kpi_id IS NOT NULL THEN

      SELECT to_jsonb(t.*) INTO v_kpi_record FROM zone_daily_metrics t WHERE id = p_kpi_id;

    END IF;

  END IF;



  IF v_kpi_record IS NULL THEN

    RETURN jsonb_build_object('success', false, 'error', 'KPI record not found');

  END IF;



  v_source_trace := COALESCE(v_kpi_record -> 'source_trace', '{}'::jsonb);



  -- Raw Imports 議고쉶 (COALESCE ?쟻?슜)

  SELECT COALESCE(jsonb_agg(

    jsonb_build_object(

      'id', id, 'source_type', source_type, 'source_name', source_name,

      'data_type', data_type, 'row_count', row_count, 'status', status,

      'created_at', created_at

    )

  ), '[]'::jsonb)

  INTO v_raw_imports

  FROM raw_imports

  WHERE store_id = COALESCE(p_store_id, (v_kpi_record->>'store_id')::UUID)

  ORDER BY created_at DESC

  LIMIT 10;



  v_result := jsonb_build_object(

    'success', true,

    'kpi_record', COALESCE(v_kpi_record, '{}'::jsonb),

    'lineage', jsonb_build_object(

      'source_trace', COALESCE(v_source_trace, '{}'::jsonb),

      'etl_run', NULL,

      'raw_imports', COALESCE(v_raw_imports, '[]'::jsonb),

      'lineage_path', jsonb_build_array(

        jsonb_build_object('layer', 'L3', 'table', p_kpi_table, 'description', 'Aggregated KPI'),

        jsonb_build_object('layer', 'L2', 'tables', ARRAY['zone_events', 'line_items'], 'description', 'Fact Tables'),

        jsonb_build_object('layer', 'L1', 'table', 'raw_imports', 'description', 'Raw Data')

      )

    ),

    'metadata', jsonb_build_object('queried_at', NOW(), 'kpi_table', p_kpi_table)

  );



  RETURN v_result;

END;

$function$
;

CREATE OR REPLACE FUNCTION public.get_neuralsense_zone_uuid(p_ns_zone_id integer, p_store_id uuid DEFAULT 'd9830554-2688-4032-af40-acccda787ac4'::uuid)
 RETURNS uuid
 LANGUAGE sql
 STABLE
AS $function$
  SELECT id FROM zones_dim
  WHERE store_id = p_store_id
    AND zone_code = 'NS' || LPAD(p_ns_zone_id::text, 3, '0')
    AND is_active = true
  LIMIT 1;
$function$
;

CREATE OR REPLACE FUNCTION public.get_overview_kpis(p_org_id uuid, p_store_id uuid, p_start_date date, p_end_date date)
 RETURNS TABLE(total_visitors bigint, unique_visitors bigint, returning_visitors bigint, total_revenue numeric, total_transactions bigint, avg_conversion_rate numeric, avg_transaction_value numeric, avg_dwell_minutes numeric, funnel_entry bigint, funnel_browse bigint, funnel_engage bigint, funnel_fitting bigint, funnel_purchase bigint)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$

  WITH kpis AS (

    SELECT

      COALESCE(SUM(k.total_visitors), 0)::bigint AS total_visitors,

      COALESCE(SUM(k.unique_visitors), 0)::bigint AS unique_visitors,

      COALESCE(SUM(k.returning_visitors), 0)::bigint AS returning_visitors,

      COALESCE(SUM(k.total_revenue), 0)::numeric AS total_revenue,

      COALESCE(SUM(k.total_transactions), 0)::bigint AS total_transactions,

      COALESCE(AVG(k.conversion_rate), 0)::numeric AS avg_conversion_rate,

      CASE WHEN SUM(k.total_transactions) > 0

           THEN (SUM(k.total_revenue) / SUM(k.total_transactions))::numeric

           ELSE 0 END AS avg_transaction_value,

      CASE WHEN SUM(k.total_visitors) > 0

           THEN ROUND(

             SUM(COALESCE(k.avg_visit_duration_seconds, 0) * COALESCE(k.total_visitors, 0))

             / SUM(k.total_visitors) / 60.0, 1

           )::numeric

           ELSE 0 END AS avg_dwell_minutes

    FROM daily_kpis_agg k

    WHERE k.org_id = p_org_id

      AND k.store_id = p_store_id

      AND k.date >= p_start_date

      AND k.date <= p_end_date

  ),

  funnel AS (

    SELECT

      event_type,

      COUNT(*)::bigint AS cnt

    FROM funnel_events

    WHERE org_id = p_org_id

      AND store_id = p_store_id

      AND event_date >= p_start_date

      AND event_date <= p_end_date

      AND event_type IN ('entry', 'browse', 'engage', 'fitting', 'purchase')

    GROUP BY event_type

  )

  SELECT

    kpis.total_visitors,

    kpis.unique_visitors,

    kpis.returning_visitors,

    kpis.total_revenue,

    kpis.total_transactions,

    kpis.avg_conversion_rate,

    kpis.avg_transaction_value,

    kpis.avg_dwell_minutes,

    COALESCE((SELECT cnt FROM funnel WHERE event_type = 'entry'), 0)::bigint,

    COALESCE((SELECT cnt FROM funnel WHERE event_type = 'browse'), 0)::bigint,

    COALESCE((SELECT cnt FROM funnel WHERE event_type = 'engage'), 0)::bigint,

    COALESCE((SELECT cnt FROM funnel WHERE event_type = 'fitting'), 0)::bigint,

    COALESCE((SELECT cnt FROM funnel WHERE event_type = 'purchase'), 0)::bigint

  FROM kpis;

$function$
;

CREATE OR REPLACE FUNCTION public.get_product_associations(p_store_id uuid, p_product_id uuid DEFAULT NULL::uuid, p_min_confidence numeric DEFAULT 0.3, p_min_lift numeric DEFAULT 1.2, p_limit integer DEFAULT 20)
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$

DECLARE

  result JSON;

BEGIN

  SELECT COALESCE(json_agg(assoc_data), '[]'::json) INTO result

  FROM (

    SELECT

      json_build_object(

        'id', pa.id,

        'antecedentProductId', pa.antecedent_product_id,

        'consequentProductId', pa.consequent_product_id,

        'antecedentSku', p1.sku,

        'consequentSku', p2.sku,

        'antecedentName', p1.product_name,

        'consequentName', p2.product_name,

        'antecedentCategory', pa.antecedent_category,

        'consequentCategory', pa.consequent_category,

        'support', pa.support,

        'confidence', pa.confidence,

        'lift', pa.lift,

        'ruleStrength', pa.rule_strength,

        'placementType', pa.placement_type,

        'coOccurrenceCount', pa.co_occurrence_count,

        'avgBasketValue', pa.avg_basket_value

      ) as assoc_data

    FROM product_associations pa

    JOIN products p1 ON pa.antecedent_product_id = p1.id

    JOIN products p2 ON pa.consequent_product_id = p2.id

    WHERE pa.store_id = p_store_id

      AND pa.is_active = true

      AND pa.confidence >= p_min_confidence

      AND pa.lift >= p_min_lift

      AND (p_product_id IS NULL OR pa.antecedent_product_id = p_product_id)

    ORDER BY pa.lift DESC, pa.confidence DESC

    LIMIT p_limit

  ) assocs;



  RETURN result;

END;

$function$
;

CREATE OR REPLACE FUNCTION public.get_product_performance(p_org_id uuid, p_store_id uuid, p_start_date date, p_end_date date)
 RETURNS TABLE(product_id uuid, product_name text, category text, revenue numeric, units_sold bigint, stock_level integer)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$

  SELECT

    p.product_id,

    COALESCE(pr.product_name, 'Unknown') AS product_name,

    COALESCE(pr.category, '湲고??') AS category,

    COALESCE(SUM(p.revenue), 0)::numeric AS revenue,

    COALESCE(SUM(p.units_sold), 0)::bigint AS units_sold,

    (SELECT pp.stock_level

     FROM product_performance_agg pp

     WHERE pp.product_id = p.product_id

       AND pp.org_id = p_org_id

       AND pp.store_id = p_store_id

       AND pp.date >= p_start_date

       AND pp.date <= p_end_date

       AND pp.stock_level IS NOT NULL

     ORDER BY pp.date DESC

     LIMIT 1) AS stock_level

  FROM product_performance_agg p

  LEFT JOIN products pr ON pr.id = p.product_id

  WHERE p.org_id = p_org_id

    AND p.store_id = p_store_id

    AND p.date >= p_start_date

    AND p.date <= p_end_date

  GROUP BY p.product_id, pr.product_name, pr.category

  ORDER BY SUM(p.revenue) DESC;

$function$
;

CREATE OR REPLACE FUNCTION public.get_roi_by_category(p_org_id uuid, p_store_id uuid DEFAULT NULL::uuid)
 RETURNS TABLE(source character varying, source_module character varying, total_count bigint, success_count bigint, avg_roi numeric, total_effect numeric)
 LANGUAGE sql
 STABLE
AS $function$

  SELECT

    source, source_module,

    COUNT(*) as total_count,

    COUNT(*) FILTER (WHERE result = 'success') as success_count,

    AVG(COALESCE(final_roi, current_roi, 0)) as avg_roi,

    SUM(COALESCE(final_roi, current_roi, 0)) as total_effect

  FROM public.applied_strategies

  WHERE org_id = p_org_id

    AND (p_store_id IS NULL OR store_id = p_store_id)

  GROUP BY source, source_module

  ORDER BY source, source_module;

$function$
;

CREATE OR REPLACE FUNCTION public.get_roi_summary(p_org_id uuid, p_store_id uuid DEFAULT NULL::uuid)
 RETURNS TABLE(total_strategies bigint, active_strategies bigint, completed_strategies bigint, success_count bigint, success_rate numeric, avg_roi numeric, total_expected_revenue numeric, total_actual_revenue numeric)
 LANGUAGE sql
 STABLE
AS $function$

  WITH strategy_stats AS (

    SELECT

      COUNT(*) as total,

      COUNT(*) FILTER (WHERE status = 'active') as active,

      COUNT(*) FILTER (WHERE status = 'completed') as completed,

      COUNT(*) FILTER (WHERE result = 'success') as success,

      AVG(COALESCE(final_roi, current_roi)) as avg_roi,

      SUM(expected_roi) as expected_rev,

      SUM(COALESCE(final_roi, current_roi, 0)) as actual_rev

    FROM public.applied_strategies

    WHERE org_id = p_org_id

      AND (p_store_id IS NULL OR store_id = p_store_id)

  )

  SELECT

    total, active, completed, success,

    CASE WHEN completed > 0 THEN (success::DECIMAL / completed * 100) ELSE 0 END,

    COALESCE(avg_roi, 0),

    COALESCE(expected_rev, 0),

    COALESCE(actual_rev, 0)

  FROM strategy_stats;

$function$
;

CREATE OR REPLACE FUNCTION public.get_schema_metadata()
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  result jsonb;
  table_record record;
  column_record record;
  fk_record record;
  pk_record record;
  table_metadata jsonb;
  columns_array jsonb;
  fks_array jsonb;
  pks_array jsonb;
  all_tables jsonb;
BEGIN
  all_tables := '{}'::jsonb;
  
  -- public ?뒪?궎留덉쓽 紐⑤뱺 ?뀒?씠釉? ?닚?쉶
  FOR table_record IN 
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
      AND table_name NOT LIKE 'pg_%'
    ORDER BY table_name
  LOOP
    columns_array := '[]'::jsonb;
    fks_array := '[]'::jsonb;
    pks_array := '[]'::jsonb;
    
    -- 而щ읆 ?젙蹂? ?닔吏?
    FOR column_record IN
      SELECT 
        c.column_name,
        c.data_type,
        CASE WHEN c.is_nullable = 'YES' THEN true ELSE false END as is_nullable,
        c.column_default,
        CASE WHEN pk.column_name IS NOT NULL THEN true ELSE false END as is_primary_key
      FROM information_schema.columns c
      LEFT JOIN (
        SELECT kcu.column_name
        FROM information_schema.table_constraints tc
        JOIN information_schema.key_column_usage kcu 
          ON tc.constraint_name = kcu.constraint_name
        WHERE tc.table_schema = 'public'
          AND tc.table_name = table_record.table_name
          AND tc.constraint_type = 'PRIMARY KEY'
      ) pk ON pk.column_name = c.column_name
      WHERE c.table_schema = 'public'
        AND c.table_name = table_record.table_name
      ORDER BY c.ordinal_position
    LOOP
      columns_array := columns_array || jsonb_build_object(
        'column_name', column_record.column_name,
        'data_type', column_record.data_type,
        'is_nullable', column_record.is_nullable,
        'column_default', column_record.column_default,
        'is_primary_key', column_record.is_primary_key
      );
    END LOOP;
    
    -- Foreign Key ?젙蹂? ?닔吏?
    FOR fk_record IN
      SELECT
        kcu.column_name,
        ccu.table_name AS foreign_table,
        ccu.column_name AS foreign_column
      FROM information_schema.table_constraints tc
      JOIN information_schema.key_column_usage kcu
        ON tc.constraint_name = kcu.constraint_name
      JOIN information_schema.constraint_column_usage ccu
        ON ccu.constraint_name = tc.constraint_name
      WHERE tc.table_schema = 'public'
        AND tc.table_name = table_record.table_name
        AND tc.constraint_type = 'FOREIGN KEY'
    LOOP
      fks_array := fks_array || jsonb_build_object(
        'column_name', fk_record.column_name,
        'foreign_table', fk_record.foreign_table,
        'foreign_column', fk_record.foreign_column
      );
    END LOOP;
    
    -- Primary Key ?젙蹂? ?닔吏?
    FOR pk_record IN
      SELECT kcu.column_name
      FROM information_schema.table_constraints tc
      JOIN information_schema.key_column_usage kcu
        ON tc.constraint_name = kcu.constraint_name
      WHERE tc.table_schema = 'public'
        AND tc.table_name = table_record.table_name
        AND tc.constraint_type = 'PRIMARY KEY'
      ORDER BY kcu.ordinal_position
    LOOP
      pks_array := pks_array || to_jsonb(pk_record.column_name);
    END LOOP;
    
    -- ?뀒?씠釉? 硫뷀???뜲?씠?꽣 援ъ꽦
    table_metadata := jsonb_build_object(
      'table_name', table_record.table_name,
      'columns', columns_array,
      'foreign_keys', fks_array,
      'primary_keys', pks_array
    );
    
    -- ?쟾泥? 寃곌낵?뿉 異붽??
    all_tables := all_tables || jsonb_build_object(table_record.table_name, table_metadata);
  END LOOP;
  
  RETURN all_tables;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.get_store_goals(p_org_id uuid, p_store_id uuid, p_date date DEFAULT CURRENT_DATE)
 RETURNS TABLE(id uuid, goal_type text, period_type text, target_value numeric, period_start date, period_end date)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$

  SELECT

    sg.id,

    sg.goal_type,

    sg.period_type,

    sg.target_value,

    sg.period_start,

    sg.period_end

  FROM store_goals sg

  WHERE sg.org_id = p_org_id

    AND sg.store_id = p_store_id

    AND sg.is_active = true

    AND sg.period_start <= p_date

    AND sg.period_end >= p_date

  ORDER BY sg.created_at DESC;

$function$
;

CREATE OR REPLACE FUNCTION public.get_store_persona_context(p_store_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE
AS $function$

DECLARE

  v_persona RECORD;

  v_success_patterns JSONB;

  v_failure_patterns JSONB;

  v_context JSONB;

BEGIN

  -- Store Persona 議고쉶

  SELECT * INTO v_persona

  FROM store_personas

  WHERE store_id = p_store_id AND is_active = true;



  -- ?뾾?쑝硫? 湲곕낯媛? 諛섑솚

  IF NOT FOUND THEN

    RETURN jsonb_build_object(

      'has_persona', false,

      'store_style', 'standard',

      'target_demographic', 'general',

      'preference_weights', '{"revenue": 0.4, "conversion": 0.25, "dwell_time": 0.2, "traffic_flow": 0.15}'::jsonb,

      'confidence_adjustments', '{"layout": 0, "flow": 0, "staffing": 0}'::jsonb,

      'custom_instructions', ''

    );

  END IF;



  -- 理쒓렐 ?꽦怨? ?뙣?꽩 議고쉶 (理쒓렐 5媛?)

  SELECT COALESCE(json_agg(pattern), '[]'::json)::jsonb INTO v_success_patterns

  FROM (

    SELECT jsonb_build_object(

      'target_type', feedback_target_type,

      'vmd_rules', vmd_rules_applied,

      'confidence', ai_confidence

    ) AS pattern

    FROM optimization_feedback

    WHERE store_id = p_store_id

      AND action = 'accept'

    ORDER BY created_at DESC

    LIMIT 5

  ) t;



  -- 理쒓렐 ?떎?뙣 ?뙣?꽩 議고쉶 (理쒓렐 3媛?)

  SELECT COALESCE(json_agg(pattern), '[]'::json)::jsonb INTO v_failure_patterns

  FROM (

    SELECT jsonb_build_object(

      'target_type', feedback_target_type,

      'vmd_rules', vmd_rules_applied,

      'reason', reason_code

    ) AS pattern

    FROM optimization_feedback

    WHERE store_id = p_store_id

      AND action = 'reject'

    ORDER BY created_at DESC

    LIMIT 3

  ) t;



  -- 而⑦뀓?뒪?듃 援ъ꽦

  v_context := jsonb_build_object(

    'has_persona', true,

    'store_style', v_persona.store_style,

    'target_demographic', v_persona.target_demographic,

    'preference_weights', v_persona.preference_weights,

    'vmd_preferences', v_persona.vmd_preferences,

    'confidence_adjustments', v_persona.confidence_adjustments,

    'feedback_stats', v_persona.feedback_stats,

    'success_patterns', v_success_patterns,

    'failure_patterns', v_failure_patterns,

    'custom_instructions', COALESCE(v_persona.learned_context->>'custom_instructions', ''),

    'learning_version', v_persona.learning_version

  );



  RETURN v_context;

END;

$function$
;

CREATE OR REPLACE FUNCTION public.get_strategy_roi_trend(p_strategy_id uuid)
 RETURNS TABLE(date date, daily_roi numeric, cumulative_roi numeric, metrics jsonb)
 LANGUAGE sql
 STABLE
AS $function$

  SELECT date, daily_roi, cumulative_roi, metrics

  FROM public.strategy_daily_metrics

  WHERE strategy_id = p_strategy_id

  ORDER BY date;

$function$
;

CREATE OR REPLACE FUNCTION public.get_success_patterns(p_store_id uuid, p_strategy_type character varying, p_limit integer DEFAULT 5)
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$

DECLARE

  result JSON;

BEGIN

  SELECT COALESCE(json_agg(pattern_data), '[]'::json) INTO result

  FROM (

    SELECT

      json_build_object(

        'id', id,

        'recommendation', ai_recommendation,

        'actualROI', actual_roi,

        'expectedROI', expected_roi,

        'accuracy', roi_accuracy,

        'learnings', learnings,

        'baselineMetrics', baseline_metrics,

        'actualMetrics', actual_metrics,

        'appliedAt', applied_at

      ) as pattern_data

    FROM strategy_feedback

    WHERE store_id = p_store_id

      AND strategy_type = p_strategy_type

      AND feedback_type = 'success'

      AND result_measured = TRUE

    ORDER BY actual_roi DESC, created_at DESC

    LIMIT p_limit

  ) success_patterns;



  RETURN result;

END;

$function$
;

CREATE OR REPLACE FUNCTION public.get_sync_history(p_connection_id uuid DEFAULT NULL::uuid, p_org_id uuid DEFAULT NULL::uuid, p_limit integer DEFAULT 50, p_offset integer DEFAULT 0)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$

DECLARE

  v_logs jsonb;

  v_total integer;

BEGIN

  -- 濡쒓렇 議고쉶

  SELECT jsonb_agg(

    jsonb_build_object(

      'id', asl.id,

      'api_connection_id', asl.api_connection_id,

      'connection_name', ac.name,

      'provider', ac.provider,

      'data_category', ac.data_category,

      'sync_type', COALESCE(asl.sync_type, 'manual'),

      'status', asl.status,

      'started_at', asl.started_at,

      'completed_at', asl.completed_at,

      'duration_ms', asl.duration_ms,

      'records_fetched', asl.records_fetched,

      'records_created', asl.records_created,

      'records_updated', asl.records_updated,

      'records_failed', asl.records_failed,

      'error_type', asl.error_type,

      'error_message', asl.error_message,

      'raw_import_id', asl.raw_import_id,

      'etl_run_id', asl.etl_run_id

    )

    ORDER BY asl.started_at DESC

  )

  INTO v_logs

  FROM api_sync_logs asl

  LEFT JOIN api_connections ac ON ac.id = asl.api_connection_id

  WHERE (p_connection_id IS NULL OR asl.api_connection_id = p_connection_id)

    AND (p_org_id IS NULL OR asl.org_id = p_org_id)

  LIMIT p_limit

  OFFSET p_offset;



  -- 珥? 媛쒖닔 議고쉶

  SELECT COUNT(*)

  INTO v_total

  FROM api_sync_logs asl

  WHERE (p_connection_id IS NULL OR asl.api_connection_id = p_connection_id)

    AND (p_org_id IS NULL OR asl.org_id = p_org_id);



  RETURN jsonb_build_object(

    'success', true,

    'logs', COALESCE(v_logs, '[]'::jsonb),

    'total', v_total,

    'limit', p_limit,

    'offset', p_offset

  );

END;

$function$
;

CREATE OR REPLACE FUNCTION public.get_sync_statistics(p_connection_id uuid DEFAULT NULL::uuid, p_org_id uuid DEFAULT NULL::uuid, p_days integer DEFAULT 30)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$

DECLARE

  v_stats jsonb;

  v_daily jsonb;

BEGIN

  -- ?쟾泥? ?넻怨?

  SELECT jsonb_build_object(

    'total_syncs', COUNT(*),

    'successful_syncs', COUNT(*) FILTER (WHERE status = 'success'),

    'failed_syncs', COUNT(*) FILTER (WHERE status = 'failed'),

    'partial_syncs', COUNT(*) FILTER (WHERE status = 'partial'),

    'total_records_fetched', COALESCE(SUM(records_fetched), 0),

    'total_records_created', COALESCE(SUM(records_created), 0),

    'total_records_updated', COALESCE(SUM(records_updated), 0),

    'total_records_failed', COALESCE(SUM(records_failed), 0),

    'avg_duration_ms', ROUND(AVG(duration_ms)),

    'success_rate', ROUND(

      COUNT(*) FILTER (WHERE status = 'success')::decimal /

      NULLIF(COUNT(*), 0) * 100, 2

    )

  )

  INTO v_stats

  FROM api_sync_logs

  WHERE (p_connection_id IS NULL OR api_connection_id = p_connection_id)

    AND (p_org_id IS NULL OR org_id = p_org_id)

    AND started_at >= NOW() - (p_days || ' days')::interval;



  -- ?씪蹂? ?넻怨?

  SELECT jsonb_agg(

    jsonb_build_object(

      'date', date,

      'syncs', syncs,

      'success', success,

      'failed', failed,

      'records', records

    )

    ORDER BY date DESC

  )

  INTO v_daily

  FROM (

    SELECT

      DATE(started_at) as date,

      COUNT(*) as syncs,

      COUNT(*) FILTER (WHERE status = 'success') as success,

      COUNT(*) FILTER (WHERE status = 'failed') as failed,

      COALESCE(SUM(records_created + records_updated), 0) as records

    FROM api_sync_logs

    WHERE (p_connection_id IS NULL OR api_connection_id = p_connection_id)

      AND (p_org_id IS NULL OR org_id = p_org_id)

      AND started_at >= NOW() - (p_days || ' days')::interval

    GROUP BY DATE(started_at)

  ) daily;



  RETURN jsonb_build_object(

    'success', true,

    'period_days', p_days,

    'statistics', COALESCE(v_stats, '{}'::jsonb),

    'daily', COALESCE(v_daily, '[]'::jsonb)

  );

END;

$function$
;

CREATE OR REPLACE FUNCTION public.get_user_org_id(_user_id uuid)
 RETURNS uuid
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$

  SELECT org_id

  FROM public.organization_members

  WHERE user_id = _user_id

  LIMIT 1

$function$
;

CREATE OR REPLACE FUNCTION public.get_user_role(_user_id uuid)
 RETURNS app_role
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT role
  FROM public.organization_members
  WHERE user_id = _user_id
  LIMIT 1;
$function$
;

CREATE OR REPLACE FUNCTION public.get_visit_statistics(p_store_id uuid, p_days integer DEFAULT 30)
 RETURNS TABLE(date date, total_visits bigint, avg_duration_minutes numeric, purchase_count bigint, conversion_rate numeric, avg_purchase_amount numeric)
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$

BEGIN

  RETURN QUERY

  SELECT

    sv.visit_date::DATE as date,

    COUNT(*)::BIGINT as total_visits,

    ROUND(AVG(sv.duration_minutes)::NUMERIC, 1) as avg_duration_minutes,

    COUNT(*) FILTER (WHERE sv.made_purchase = true)::BIGINT as purchase_count,

    ROUND(

      COUNT(*) FILTER (WHERE sv.made_purchase = true)::NUMERIC /

      NULLIF(COUNT(*), 0) * 100,

      2

    )::NUMERIC as conversion_rate,

    ROUND(AVG(sv.purchase_amount) FILTER (WHERE sv.made_purchase = true)::NUMERIC, 0) as avg_purchase_amount

  FROM store_visits sv

  WHERE sv.store_id = p_store_id

    AND sv.visit_date >= CURRENT_DATE - p_days

  GROUP BY sv.visit_date::DATE

  ORDER BY date DESC;

END;

$function$
;

CREATE OR REPLACE FUNCTION public.get_zone_metrics(p_org_id uuid, p_store_id uuid, p_start_date date, p_end_date date)
 RETURNS TABLE(zone_id uuid, zone_name text, zone_type text, visitors bigint, avg_dwell_seconds numeric, revenue numeric, conversion_count bigint)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$

  SELECT

    zdm.zone_id,

    COALESCE(zd.zone_name, zdm.zone_id::text) AS zone_name,

    COALESCE(zd.zone_type, 'unknown') AS zone_type,

    COALESCE(SUM(zdm.total_visitors), 0)::bigint AS visitors,

    COALESCE(AVG(zdm.avg_dwell_seconds), 0)::numeric AS avg_dwell_seconds,

    COALESCE(SUM(zdm.revenue_attributed), 0)::numeric AS revenue,

    COALESCE(SUM(zdm.conversion_count), 0)::bigint AS conversion_count

  FROM zone_daily_metrics zdm

  LEFT JOIN zones_dim zd

    ON zd.id = zdm.zone_id

    AND zd.org_id = p_org_id

    AND zd.store_id = p_store_id

  WHERE zdm.org_id = p_org_id

    AND zdm.store_id = p_store_id

    AND zdm.date >= p_start_date

    AND zdm.date <= p_end_date

  GROUP BY zdm.zone_id, zd.zone_name, zd.zone_type

  ORDER BY SUM(zdm.total_visitors) DESC;

$function$
;

CREATE OR REPLACE FUNCTION public.get_zones_dim_list(p_org_id uuid, p_store_id uuid)
 RETURNS TABLE(id uuid, zone_name text, zone_type text, is_active boolean)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$

  SELECT

    zd.id,

    COALESCE(zd.zone_name, zd.id::text) AS zone_name,

    COALESCE(zd.zone_type, 'unknown') AS zone_type,

    zd.is_active

  FROM zones_dim zd

  WHERE zd.org_id = p_org_id

    AND zd.store_id = p_store_id

    AND zd.is_active = true

  ORDER BY zd.zone_name;

$function$
;

CREATE OR REPLACE FUNCTION public.graph_n_hop_query(p_user_id uuid, p_start_entity_id uuid, p_max_hops integer DEFAULT 3)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$

DECLARE

  result jsonb;

BEGIN

  WITH RECURSIVE graph_traverse AS (

    -- Base case: start node

    SELECT 

      e.id as entity_id,

      e.label,

      e.properties,

      0 as depth,

      ARRAY[e.id] as path

    FROM graph_entities e

    WHERE e.id = p_start_entity_id AND e.user_id = p_user_id

    

    UNION ALL

    

    -- Recursive case: traverse edges

    SELECT 

      e.id as entity_id,

      e.label,

      e.properties,

      gt.depth + 1 as depth,

      gt.path || e.id as path

    FROM graph_traverse gt

    JOIN graph_relations r ON r.source_entity_id = gt.entity_id AND r.user_id = p_user_id

    JOIN graph_entities e ON e.id = r.target_entity_id

    WHERE gt.depth < p_max_hops

      AND NOT e.id = ANY(gt.path) -- Prevent cycles

  )

  SELECT jsonb_build_object(

    'nodes', (SELECT jsonb_agg(DISTINCT jsonb_build_object(

      'id', entity_id,

      'label', label,

      'properties', properties,

      'depth', depth

    )) FROM graph_traverse),

    'edges', (

      SELECT jsonb_agg(jsonb_build_object(

        'source', r.source_entity_id,

        'target', r.target_entity_id,

        'properties', r.properties,

        'weight', r.weight

      ))

      FROM graph_relations r

      WHERE r.source_entity_id IN (SELECT entity_id FROM graph_traverse)

        AND r.target_entity_id IN (SELECT entity_id FROM graph_traverse)

        AND r.user_id = p_user_id

    ),

    'paths', (SELECT jsonb_agg(DISTINCT path) FROM graph_traverse WHERE depth = p_max_hops)

  ) INTO result;

  

  RETURN result;

END;

$function$
;

CREATE OR REPLACE FUNCTION public.graph_shortest_path(p_user_id uuid, p_start_id uuid, p_end_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$

DECLARE

  result jsonb;

BEGIN

  WITH RECURSIVE bfs AS (

    -- Start node

    SELECT 

      e.id as entity_id,

      ARRAY[e.id] as path,

      0 as distance

    FROM graph_entities e

    WHERE e.id = p_start_id AND e.user_id = p_user_id

    

    UNION ALL

    

    -- BFS traversal

    SELECT 

      e.id as entity_id,

      bfs.path || e.id as path,

      bfs.distance + 1 as distance

    FROM bfs

    JOIN graph_relations r ON r.source_entity_id = bfs.entity_id AND r.user_id = p_user_id

    JOIN graph_entities e ON e.id = r.target_entity_id

    WHERE NOT e.id = ANY(bfs.path) -- Prevent cycles

      AND bfs.entity_id != p_end_id -- Stop when we reach the end

  )

  SELECT path INTO result

  FROM bfs

  WHERE entity_id = p_end_id

  ORDER BY distance ASC

  LIMIT 1;

  

  RETURN to_jsonb(result);

END;

$function$
;

CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$

BEGIN

  INSERT INTO public.profiles (id, display_name)

  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.email));

  RETURN NEW;

END;

$function$
;

CREATE OR REPLACE FUNCTION public.handover_chat_session(p_session_id text, p_user_id uuid)
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
$function$
;

CREATE OR REPLACE FUNCTION public.has_valid_license(_user_id uuid, _license_type text)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT EXISTS (
    SELECT 1
    FROM public.organization_members om
    JOIN public.licenses l ON l.id = om.license_id
    WHERE om.user_id = _user_id
    AND l.license_type = _license_type
    AND l.status IN ('active', 'assigned')
    AND (l.expiry_date IS NULL OR l.expiry_date > CURRENT_DATE)
  );
$function$
;

CREATE OR REPLACE FUNCTION public.is_neuraltwin_admin(_user_id uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT EXISTS (
    SELECT 1
    FROM organization_members
    WHERE user_id = _user_id
      AND role = 'NEURALTWIN_MASTER'
  );
$function$
;

CREATE OR REPLACE FUNCTION public.is_org_admin(_user_id uuid, _org_id uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT EXISTS (
    SELECT 1
    FROM public.organization_members
    WHERE user_id = _user_id
      AND (
        (org_id = _org_id AND role IN ('ORG_HQ', 'ORG_ADMIN')) 
        OR role = 'NEURALTWIN_MASTER'
      )
  )
$function$
;

CREATE OR REPLACE FUNCTION public.is_org_admin_simple(check_org_id uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- NEURALTWIN_MASTER 泥댄겕
  IF EXISTS (
    SELECT 1 FROM organization_members
    WHERE user_id = auth.uid()
    AND role = 'NEURALTWIN_MASTER'
  ) THEN
    RETURN TRUE;
  END IF;
  
  -- ?씪諛? 愿?由ъ옄 泥댄겕
  RETURN EXISTS (
    SELECT 1 FROM organization_members om
    WHERE om.user_id = auth.uid()
    AND om.org_id = check_org_id
    AND om.role IN ('ORG_OWNER', 'ORG_ADMIN', 'ORG_HQ')
  );
END;
$function$
;

CREATE OR REPLACE FUNCTION public.is_org_member(_user_id uuid, _org_id uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$

  SELECT EXISTS (

    SELECT 1

    FROM public.organization_members

    WHERE user_id = _user_id

      AND (org_id = _org_id OR role = 'NEURALTWIN_MASTER')

  )

$function$
;

CREATE OR REPLACE FUNCTION public.is_org_member_simple(_user_id uuid, _org_id uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT EXISTS (
    SELECT 1
    FROM public.organization_members
    WHERE user_id = _user_id
      AND (org_id = _org_id OR role = 'NEURALTWIN_MASTER')
  )
$function$
;

CREATE OR REPLACE FUNCTION public.is_org_member_with_license(_user_id uuid, _org_id uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT EXISTS (
    SELECT 1
    FROM public.organization_members
    WHERE user_id = _user_id
      AND (org_id = _org_id OR role = 'NEURALTWIN_MASTER')
  )
$function$
;

CREATE OR REPLACE FUNCTION public.is_org_owner(_user_id uuid, _org_id uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT EXISTS (
    SELECT 1
    FROM public.organization_members
    WHERE user_id = _user_id
      AND (
        (org_id = _org_id AND role = 'ORG_HQ')
        OR role = 'NEURALTWIN_MASTER'
      )
  )
$function$
;

CREATE OR REPLACE FUNCTION public.migrate_user_to_organization(p_user_id uuid)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$

DECLARE

  v_org_id UUID;

  v_user_email TEXT;

BEGIN

  -- Get user email

  SELECT email INTO v_user_email

  FROM auth.users

  WHERE id = p_user_id;



  -- Check if user already has an organization

  SELECT org_id INTO v_org_id

  FROM organization_members

  WHERE user_id = p_user_id

  LIMIT 1;



  -- If no organization exists, create one

  IF v_org_id IS NULL THEN

    -- Create organization

    INSERT INTO organizations (org_name, created_by)

    VALUES (

      COALESCE(v_user_email, 'Organization ' || p_user_id::text),

      p_user_id

    )

    RETURNING id INTO v_org_id;



    -- Add user as ORG_OWNER

    INSERT INTO organization_members (org_id, user_id, role)

    VALUES (v_org_id, p_user_id, 'ORG_OWNER');



    -- Backfill org_id for all user's data tables

    UPDATE stores SET org_id = v_org_id WHERE user_id = p_user_id AND org_id IS NULL;

    UPDATE products SET org_id = v_org_id WHERE user_id = p_user_id AND org_id IS NULL;

    UPDATE wifi_zones SET org_id = v_org_id WHERE user_id = p_user_id AND org_id IS NULL;

    UPDATE wifi_tracking SET org_id = v_org_id WHERE user_id = p_user_id AND org_id IS NULL;

    UPDATE scenarios SET org_id = v_org_id WHERE user_id = p_user_id AND org_id IS NULL;

    UPDATE user_data_imports SET org_id = v_org_id WHERE user_id = p_user_id AND org_id IS NULL;

    UPDATE upload_sessions SET org_id = v_org_id WHERE user_id = p_user_id AND org_id IS NULL;

    UPDATE dashboard_kpis SET org_id = v_org_id WHERE user_id = p_user_id AND org_id IS NULL;

    UPDATE ai_recommendations SET org_id = v_org_id WHERE user_id = p_user_id AND org_id IS NULL;

    UPDATE analysis_history SET org_id = v_org_id WHERE user_id = p_user_id AND org_id IS NULL;

    UPDATE api_connections SET org_id = v_org_id WHERE user_id = p_user_id AND org_id IS NULL;

    UPDATE external_data_sources SET org_id = v_org_id WHERE user_id = p_user_id AND org_id IS NULL;

    UPDATE data_sync_schedules SET org_id = v_org_id WHERE user_id = p_user_id AND org_id IS NULL;

    UPDATE data_sync_logs SET org_id = v_org_id WHERE user_id = p_user_id AND org_id IS NULL;

    UPDATE funnel_metrics SET org_id = v_org_id WHERE user_id = p_user_id AND org_id IS NULL;

    UPDATE graph_entities SET org_id = v_org_id WHERE user_id = p_user_id AND org_id IS NULL;

    UPDATE graph_relations SET org_id = v_org_id WHERE user_id = p_user_id AND org_id IS NULL;

    UPDATE holidays_events SET org_id = v_org_id WHERE user_id = p_user_id AND org_id IS NULL;

    UPDATE hq_store_master SET org_id = v_org_id WHERE user_id = p_user_id AND org_id IS NULL;

    UPDATE hq_sync_logs SET org_id = v_org_id WHERE user_id = p_user_id AND org_id IS NULL;

    UPDATE inventory_levels SET org_id = v_org_id WHERE user_id = p_user_id AND org_id IS NULL;

    UPDATE neuralsense_devices SET org_id = v_org_id WHERE user_id = p_user_id AND org_id IS NULL;

    UPDATE notification_settings SET org_id = v_org_id WHERE user_id = p_user_id AND org_id IS NULL;

    UPDATE ontology_entity_types SET org_id = v_org_id WHERE user_id = p_user_id AND org_id IS NULL;

    UPDATE ontology_mapping_cache SET org_id = v_org_id WHERE user_id = p_user_id AND org_id IS NULL;

    UPDATE ontology_relation_types SET org_id = v_org_id WHERE user_id = p_user_id AND org_id IS NULL;

    UPDATE ontology_schema_versions SET org_id = v_org_id WHERE user_id = p_user_id AND org_id IS NULL;

    UPDATE auto_order_suggestions SET org_id = v_org_id WHERE user_id = p_user_id AND org_id IS NULL;

    UPDATE economic_indicators SET org_id = v_org_id WHERE user_id = p_user_id AND org_id IS NULL;

  END IF;



  RETURN v_org_id;

END;

$function$
;

CREATE OR REPLACE FUNCTION public.queue_relation_inference()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- 愿?怨? 異붾줎 ?걧?뿉 異붽??
  INSERT INTO ontology_relation_inference_queue (
    user_id,
    org_id,
    entity_id,
    status
  ) VALUES (
    NEW.user_id,
    NEW.org_id,
    NEW.id,
    'pending'
  )
  ON CONFLICT (entity_id, status) DO NOTHING;

  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.search_knowledge(query_embedding vector, match_threshold double precision DEFAULT 0.65, match_count integer DEFAULT 5, filter_topic text DEFAULT NULL::text)
 RETURNS TABLE(id uuid, topic_id text, chunk_type text, title text, content text, conditions jsonb, similarity double precision)
 LANGUAGE plpgsql
AS $function$

BEGIN

  RETURN QUERY

  SELECT

    rkc.id,

    rkc.topic_id,

    rkc.chunk_type,

    rkc.title,

    rkc.content,

    rkc.conditions,

    1 - (rkc.embedding <=> query_embedding) AS similarity

  FROM retail_knowledge_chunks rkc

  WHERE

    1 - (rkc.embedding <=> query_embedding) > match_threshold

    AND (filter_topic IS NULL OR rkc.topic_id = filter_topic)

  ORDER BY similarity DESC

  LIMIT match_count;

END;

$function$
;

CREATE OR REPLACE FUNCTION public.search_knowledge_trgm(search_query text, match_threshold double precision DEFAULT 0.1, match_count integer DEFAULT 5, filter_topic text DEFAULT NULL::text)
 RETURNS TABLE(id uuid, topic_id text, chunk_type text, title text, content text, conditions jsonb, similarity double precision)
 LANGUAGE plpgsql
AS $function$

BEGIN

  RETURN QUERY

  SELECT

    rkc.id,

    rkc.topic_id,

    rkc.chunk_type,

    rkc.title,

    rkc.content,

    rkc.conditions,

    GREATEST(

      similarity(rkc.title, search_query),

      similarity(rkc.content, search_query)

    ) AS similarity

  FROM retail_knowledge_chunks rkc

  WHERE

    (similarity(rkc.title, search_query) > match_threshold

     OR similarity(rkc.content, search_query) > match_threshold * 0.5)

    AND (filter_topic IS NULL OR rkc.topic_id = filter_topic)

  ORDER BY similarity DESC

  LIMIT match_count;

END;

$function$
;

CREATE OR REPLACE FUNCTION public.set_measurement_dates()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$

BEGIN

  IF NEW.status = 'applied' AND OLD.status = 'pending' THEN

    NEW.measurement_start_date := NEW.baseline_date;

    NEW.measurement_end_date := NEW.baseline_date + (NEW.measurement_period_days || ' days')::INTERVAL;

  END IF;

  NEW.updated_at := now();

  RETURN NEW;

END;

$function$
;

CREATE OR REPLACE FUNCTION public.sync_customer_to_ontology()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_entity_type_id uuid;
  v_existing_entity_id uuid;
BEGIN
  -- Customer ?뿏?떚?떚 ????엯 李얘린 ?삉?뒗 ?깮?꽦
  SELECT id INTO v_entity_type_id
  FROM ontology_entity_types
  WHERE user_id = NEW.user_id
    AND name = 'Customer'
  LIMIT 1;

  IF v_entity_type_id IS NULL THEN
    INSERT INTO ontology_entity_types (
      user_id,
      org_id,
      name,
      label,
      description,
      color
    ) VALUES (
      NEW.user_id,
      NEW.org_id,
      'Customer',
      'Customer',
      'Auto-created customer entity type',
      '#3b82f6'
    )
    RETURNING id INTO v_entity_type_id;
  END IF;

  -- 湲곗〈 ?뿏?떚?떚 ?솗?씤 (customer_id 湲곗??)
  IF TG_OP = 'UPDATE' THEN
    SELECT ge.id INTO v_existing_entity_id
    FROM graph_entities ge
    WHERE ge.user_id = NEW.user_id
      AND ge.entity_type_id = v_entity_type_id
      AND ge.properties->>'customer_id' = OLD.id::text
    LIMIT 1;

    IF v_existing_entity_id IS NOT NULL THEN
      -- ?뾽?뜲?씠?듃
      UPDATE graph_entities
      SET
        label = COALESCE(NEW.customer_name, 'Customer ' || NEW.id),
        properties = jsonb_build_object(
          'customer_id', NEW.id,
          'customer_name', NEW.customer_name,
          'email', NEW.email,
          'phone', NEW.phone,
          'segment', NEW.segment,
          'total_purchases', NEW.total_purchases,
          'last_visit_date', NEW.last_visit_date,
          'source_table', 'customers',
          'synced_at', now()
        ),
        updated_at = now()
      WHERE id = v_existing_entity_id;
      
      RETURN NEW;
    END IF;
  END IF;

  -- ?떊洹? ?뿏?떚?떚 ?깮?꽦
  INSERT INTO graph_entities (
    user_id,
    org_id,
    store_id,
    entity_type_id,
    label,
    properties
  ) VALUES (
    NEW.user_id,
    NEW.org_id,
    NEW.store_id,
    v_entity_type_id,
    COALESCE(NEW.customer_name, 'Customer ' || NEW.id),
    jsonb_build_object(
      'customer_id', NEW.id,
      'customer_name', NEW.customer_name,
      'email', NEW.email,
      'phone', NEW.phone,
      'segment', NEW.segment,
      'total_purchases', NEW.total_purchases,
      'last_visit_date', NEW.last_visit_date,
      'source_table', 'customers',
      'synced_at', now()
    )
  );

  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.sync_product_to_ontology()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_entity_type_id uuid;
  v_existing_entity_id uuid;
BEGIN
  -- Product ?뿏?떚?떚 ????엯 李얘린 ?삉?뒗 ?깮?꽦
  SELECT id INTO v_entity_type_id
  FROM ontology_entity_types
  WHERE user_id = NEW.user_id
    AND name = 'Product'
  LIMIT 1;

  IF v_entity_type_id IS NULL THEN
    INSERT INTO ontology_entity_types (
      user_id,
      org_id,
      name,
      label,
      description,
      color
    ) VALUES (
      NEW.user_id,
      NEW.org_id,
      'Product',
      'Product',
      'Auto-created product entity type',
      '#10b981'
    )
    RETURNING id INTO v_entity_type_id;
  END IF;

  -- 湲곗〈 ?뿏?떚?떚 ?솗?씤
  IF TG_OP = 'UPDATE' THEN
    SELECT ge.id INTO v_existing_entity_id
    FROM graph_entities ge
    WHERE ge.user_id = NEW.user_id
      AND ge.entity_type_id = v_entity_type_id
      AND ge.properties->>'product_id' = OLD.id::text
    LIMIT 1;

    IF v_existing_entity_id IS NOT NULL THEN
      UPDATE graph_entities
      SET
        label = COALESCE(NEW.product_name, 'Product ' || NEW.id),
        properties = jsonb_build_object(
          'product_id', NEW.id,
          'product_name', NEW.product_name,
          'category', NEW.category,
          'brand', NEW.brand,
          'price', NEW.price,
          'stock', NEW.stock,
          'source_table', 'products',
          'synced_at', now()
        ),
        updated_at = now()
      WHERE id = v_existing_entity_id;
      
      RETURN NEW;
    END IF;
  END IF;

  -- ?떊洹? ?뿏?떚?떚 ?깮?꽦
  INSERT INTO graph_entities (
    user_id,
    org_id,
    store_id,
    entity_type_id,
    label,
    properties
  ) VALUES (
    NEW.user_id,
    NEW.org_id,
    NEW.store_id,
    v_entity_type_id,
    COALESCE(NEW.product_name, 'Product ' || NEW.id),
    jsonb_build_object(
      'product_id', NEW.id,
      'product_name', NEW.product_name,
      'category', NEW.category,
      'brand', NEW.brand,
      'price', NEW.price,
      'stock', NEW.stock,
      'source_table', 'products',
      'synced_at', now()
    )
  );

  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.sync_purchase_to_ontology()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_entity_type_id uuid;
  v_purchase_entity_id uuid;
  v_customer_entity_id uuid;
  v_product_entity_id uuid;
  v_purchased_relation_type_id uuid;
BEGIN
  -- Purchase ?뿏?떚?떚 ????엯 李얘린 ?삉?뒗 ?깮?꽦
  SELECT id INTO v_entity_type_id
  FROM ontology_entity_types
  WHERE user_id = NEW.user_id
    AND name = 'Purchase'
  LIMIT 1;

  IF v_entity_type_id IS NULL THEN
    INSERT INTO ontology_entity_types (
      user_id,
      org_id,
      name,
      label,
      description,
      color
    ) VALUES (
      NEW.user_id,
      NEW.org_id,
      'Purchase',
      'Purchase',
      'Auto-created purchase entity type',
      '#f59e0b'
    )
    RETURNING id INTO v_entity_type_id;
  END IF;

  -- Purchase ?뿏?떚?떚 ?깮?꽦
  INSERT INTO graph_entities (
    user_id,
    org_id,
    store_id,
    entity_type_id,
    label,
    properties
  ) VALUES (
    NEW.user_id,
    NEW.org_id,
    NEW.store_id,
    v_entity_type_id,
    'Purchase ' || NEW.id,
    jsonb_build_object(
      'purchase_id', NEW.id,
      'customer_id', NEW.customer_id,
      'product_id', NEW.product_id,
      'quantity', NEW.quantity,
      'unit_price', NEW.unit_price,
      'total_price', NEW.total_price,
      'purchase_date', NEW.purchase_date,
      'source_table', 'purchases',
      'synced_at', now()
    )
  )
  RETURNING id INTO v_purchase_entity_id;

  -- Customer ?뿏?떚?떚 李얘린
  SELECT ge.id INTO v_customer_entity_id
  FROM graph_entities ge
  JOIN ontology_entity_types oet ON oet.id = ge.entity_type_id
  WHERE ge.user_id = NEW.user_id
    AND oet.name = 'Customer'
    AND ge.properties->>'customer_id' = NEW.customer_id::text
  LIMIT 1;

  -- Product ?뿏?떚?떚 李얘린
  SELECT ge.id INTO v_product_entity_id
  FROM graph_entities ge
  JOIN ontology_entity_types oet ON oet.id = ge.entity_type_id
  WHERE ge.user_id = NEW.user_id
    AND oet.name = 'Product'
    AND ge.properties->>'product_id' = NEW.product_id::text
  LIMIT 1;

  -- 'purchased' 愿?怨? ????엯 李얘린 ?삉?뒗 ?깮?꽦
  SELECT id INTO v_purchased_relation_type_id
  FROM ontology_relation_types
  WHERE user_id = NEW.user_id
    AND name = 'purchased'
  LIMIT 1;

  IF v_purchased_relation_type_id IS NULL THEN
    INSERT INTO ontology_relation_types (
      user_id,
      org_id,
      name,
      label,
      source_entity_type,
      target_entity_type,
      description
    ) VALUES (
      NEW.user_id,
      NEW.org_id,
      'purchased',
      'purchased',
      'Customer',
      'Product',
      'Customer purchased a product'
    )
    RETURNING id INTO v_purchased_relation_type_id;
  END IF;

  -- Customer -> Product 愿?怨? ?깮?꽦
  IF v_customer_entity_id IS NOT NULL AND v_product_entity_id IS NOT NULL THEN
    INSERT INTO graph_relations (
      user_id,
      org_id,
      store_id,
      relation_type_id,
      source_entity_id,
      target_entity_id,
      properties,
      weight
    ) VALUES (
      NEW.user_id,
      NEW.org_id,
      NEW.store_id,
      v_purchased_relation_type_id,
      v_customer_entity_id,
      v_product_entity_id,
      jsonb_build_object(
        'purchase_id', NEW.id,
        'quantity', NEW.quantity,
        'unit_price', NEW.unit_price,
        'total_price', NEW.total_price,
        'purchase_date', NEW.purchase_date,
        'synced_at', now()
      ),
      1.0
    )
    ON CONFLICT DO NOTHING;
  END IF;

  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.sync_store_to_ontology()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_entity_type_id uuid;
  v_existing_entity_id uuid;
BEGIN
  -- Store ?뿏?떚?떚 ????엯 李얘린 ?삉?뒗 ?깮?꽦
  SELECT id INTO v_entity_type_id
  FROM ontology_entity_types
  WHERE user_id = NEW.user_id
    AND name = 'Store'
  LIMIT 1;

  IF v_entity_type_id IS NULL THEN
    INSERT INTO ontology_entity_types (
      user_id,
      org_id,
      name,
      label,
      description,
      color
    ) VALUES (
      NEW.user_id,
      NEW.org_id,
      'Store',
      'Store',
      'Auto-created store entity type',
      '#8b5cf6'
    )
    RETURNING id INTO v_entity_type_id;
  END IF;

  -- 湲곗〈 ?뿏?떚?떚 ?솗?씤
  IF TG_OP = 'UPDATE' THEN
    SELECT ge.id INTO v_existing_entity_id
    FROM graph_entities ge
    WHERE ge.user_id = NEW.user_id
      AND ge.entity_type_id = v_entity_type_id
      AND ge.properties->>'store_id' = OLD.id::text
    LIMIT 1;

    IF v_existing_entity_id IS NOT NULL THEN
      UPDATE graph_entities
      SET
        label = COALESCE(NEW.store_name, 'Store ' || NEW.id),
        properties = jsonb_build_object(
          'store_id', NEW.id,
          'store_name', NEW.store_name,
          'location', NEW.location,
          'store_type', NEW.store_type,
          'area_sqm', NEW.area_sqm,
          'source_table', 'stores',
          'synced_at', now()
        ),
        updated_at = now()
      WHERE id = v_existing_entity_id;
      
      RETURN NEW;
    END IF;
  END IF;

  -- ?떊洹? ?뿏?떚?떚 ?깮?꽦
  INSERT INTO graph_entities (
    user_id,
    org_id,
    store_id,
    entity_type_id,
    label,
    properties
  ) VALUES (
    NEW.user_id,
    NEW.org_id,
    NEW.id,
    v_entity_type_id,
    COALESCE(NEW.store_name, 'Store ' || NEW.id),
    jsonb_build_object(
      'store_id', NEW.id,
      'store_name', NEW.store_name,
      'location', NEW.location,
      'store_type', NEW.store_type,
      'area_sqm', NEW.area_sqm,
      'source_table', 'stores',
      'synced_at', now()
    )
  );

  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.sync_weather_to_ontology()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_entity_type_id uuid;
  v_existing_entity_id uuid;
  v_weather_label text;
BEGIN
  -- Weather ?뿏?떚?떚 ????엯 李얘린
  SELECT id INTO v_entity_type_id
  FROM ontology_entity_types
  WHERE name = 'Weather'
  LIMIT 1;

  -- Weather ?뿏?떚?떚 ????엯?씠 ?뾾?쑝硫? ?뿉?윭 (?씠誘? ?뒪?궎留덉뿉 ?젙?쓽?릺?뼱 ?엳?뼱?빞 ?븿)
  IF v_entity_type_id IS NULL THEN
    RAISE EXCEPTION 'Weather entity type not found in ontology schema';
  END IF;

  -- ?궇?뵪 ?씪踰? ?깮?꽦
  v_weather_label := NEW.weather_condition || ' - ' || NEW.date::text;
  IF NEW.store_id IS NOT NULL THEN
    v_weather_label := v_weather_label || ' (Store)';
  ELSE
    v_weather_label := v_weather_label || ' (Global)';
  END IF;

  -- 湲곗〈 ?뿏?떚?떚 ?솗?씤 (weather_id 湲곗??)
  IF TG_OP = 'UPDATE' THEN
    SELECT ge.id INTO v_existing_entity_id
    FROM graph_entities ge
    WHERE ge.user_id = NEW.user_id
      AND ge.entity_type_id = v_entity_type_id
      AND ge.properties->>'weather_id' = OLD.id::text
    LIMIT 1;

    IF v_existing_entity_id IS NOT NULL THEN
      -- 湲곗〈 ?뿏?떚?떚 ?뾽?뜲?씠?듃
      UPDATE graph_entities
      SET
        label = v_weather_label,
        store_id = NEW.store_id,
        properties = jsonb_build_object(
          'weather_id', NEW.id,
          'date', NEW.date,
          'temperature', NEW.temperature,
          'weather_condition', NEW.weather_condition,
          'humidity', NEW.humidity,
          'precipitation', NEW.precipitation,
          'wind_speed', NEW.wind_speed,
          'is_global', NEW.is_global,
          'metadata', NEW.metadata,
          'source_table', 'weather_data',
          'synced_at', now()
        ),
        updated_at = now()
      WHERE id = v_existing_entity_id;
      
      RETURN NEW;
    END IF;
  END IF;

  -- ?떊洹? ?뿏?떚?떚 ?깮?꽦
  INSERT INTO graph_entities (
    user_id,
    org_id,
    store_id,
    entity_type_id,
    label,
    properties
  ) VALUES (
    NEW.user_id,
    NEW.org_id,
    NEW.store_id,
    v_entity_type_id,
    v_weather_label,
    jsonb_build_object(
      'weather_id', NEW.id,
      'date', NEW.date,
      'temperature', NEW.temperature,
      'weather_condition', NEW.weather_condition,
      'humidity', NEW.humidity,
      'precipitation', NEW.precipitation,
      'wind_speed', NEW.wind_speed,
      'is_global', NEW.is_global,
      'metadata', NEW.metadata,
      'source_table', 'weather_data',
      'synced_at', now()
    )
  );

  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.test_api_connection(p_connection_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$

DECLARE

  v_connection record;

  v_result jsonb;

BEGIN

  -- ?뿰寃? ?젙蹂? 議고쉶

  SELECT * INTO v_connection

  FROM api_connections

  WHERE id = p_connection_id;



  IF NOT FOUND THEN

    RETURN jsonb_build_object(

      'success', false,

      'error', 'Connection not found'

    );

  END IF;



  -- ?뀒?뒪?듃 ?떆媛? ?뾽?뜲?씠?듃

  UPDATE api_connections

  SET

    last_tested_at = now(),

    status = 'testing'

  WHERE id = p_connection_id;



  -- ?떎?젣 API ?샇異쒖?? Edge Function?뿉?꽌 ?닔?뻾

  -- ?뿬湲곗꽌?뒗 硫뷀???뜲?씠?꽣留? 諛섑솚

  RETURN jsonb_build_object(

    'success', true,

    'connection_id', p_connection_id,

    'url', v_connection.url,

    'method', v_connection.method,

    'auth_type', v_connection.auth_type,

    'provider', v_connection.provider,

    'message', 'Connection ready for testing'

  );

END;

$function$
;

CREATE OR REPLACE FUNCTION public.update_ai_response_logs_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$

BEGIN

  NEW.updated_at = NOW();

  RETURN NEW;

END;

$function$
;

CREATE OR REPLACE FUNCTION public.update_ai_scene_analysis_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$

BEGIN

  NEW.updated_at = NOW();

  RETURN NEW;

END;

$function$
;

CREATE OR REPLACE FUNCTION public.update_applied_strategies_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$

BEGIN

  NEW.updated_at = NOW();

  RETURN NEW;

END;

$function$
;

CREATE OR REPLACE FUNCTION public.update_chat_conversations_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$

BEGIN

  NEW.updated_at = now();

  RETURN NEW;

END;

$function$
;

CREATE OR REPLACE FUNCTION public.update_furniture_slots_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$

BEGIN

  NEW.updated_at = NOW();

  RETURN NEW;

END;

$function$
;

CREATE OR REPLACE FUNCTION public.update_furniture_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$

BEGIN

  NEW.updated_at = NOW();

  RETURN NEW;

END;

$function$
;

CREATE OR REPLACE FUNCTION public.update_license_counts()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  _subscription_id uuid;
BEGIN
  -- subscription_id 寃곗젙
  _subscription_id := COALESCE(NEW.subscription_id, OLD.subscription_id);

  IF _subscription_id IS NOT NULL THEN
    -- 援щ룆?쓽 ?씪?씠?꽑?뒪 移댁슫?듃 諛? ?썡 鍮꾩슜 ?옱怨꾩궛
    UPDATE public.subscriptions
    SET 
      hq_license_count = (
        SELECT COUNT(*) 
        FROM public.licenses
        WHERE subscription_id = _subscription_id
        AND license_type = 'HQ_SEAT'
        AND status NOT IN ('revoked', 'expired')
      ),
      store_license_count = (
        SELECT COUNT(*) 
        FROM public.licenses
        WHERE subscription_id = _subscription_id
        AND license_type = 'STORE'
        AND status NOT IN ('revoked', 'expired')
      ),
      monthly_cost = (
        SELECT COALESCE(SUM(monthly_price), 0)
        FROM public.licenses
        WHERE subscription_id = _subscription_id
        AND status NOT IN ('revoked', 'expired')
      ),
      updated_at = now()
    WHERE id = _subscription_id;
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$function$
;

CREATE OR REPLACE FUNCTION public.update_model_3d_files_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$

BEGIN

  NEW.updated_at = now();

  RETURN NEW;

END;

$function$
;

CREATE OR REPLACE FUNCTION public.update_ontology_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$

BEGIN

  NEW.updated_at = now();

  RETURN NEW;

END;

$function$
;

CREATE OR REPLACE FUNCTION public.update_org_member_count()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE organizations 
    SET member_count = member_count + 1 
    WHERE id = NEW.org_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE organizations 
    SET member_count = GREATEST(member_count - 1, 0) 
    WHERE id = OLD.org_id;
  END IF;
  RETURN NULL;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.update_persona_feedback_stats()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$

DECLARE

  v_stats JSONB;

BEGIN

  -- ?뵾?뱶諛? ?넻怨? 吏묎퀎

  SELECT jsonb_build_object(

    'total_recommendations', COUNT(*),

    'accepted', COUNT(*) FILTER (WHERE action = 'accept'),

    'rejected', COUNT(*) FILTER (WHERE action = 'reject'),

    'modified', COUNT(*) FILTER (WHERE action = 'modify'),

    'acceptance_rate', CASE

      WHEN COUNT(*) > 0

      THEN ROUND(COUNT(*) FILTER (WHERE action = 'accept')::NUMERIC / COUNT(*) * 100, 1)

      ELSE 0

    END

  ) INTO v_stats

  FROM optimization_feedback

  WHERE store_id = NEW.store_id;



  -- Store Persona ?뾽?뜲?씠?듃

  UPDATE store_personas

  SET

    feedback_stats = v_stats,

    updated_at = NOW()

  WHERE store_id = NEW.store_id;



  -- ?럹瑜댁냼?굹 ?뾾?쑝硫? ?깮?꽦

  IF NOT FOUND THEN

    PERFORM ensure_store_persona(NEW.store_id);

    UPDATE store_personas

    SET feedback_stats = v_stats

    WHERE store_id = NEW.store_id;

  END IF;



  RETURN NEW;

END;

$function$
;

CREATE OR REPLACE FUNCTION public.update_product_associations_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$

BEGIN

  NEW.updated_at = NOW();

  RETURN NEW;

END;

$function$
;

CREATE OR REPLACE FUNCTION public.update_recommendation_applications_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$

BEGIN

  NEW.updated_at = NOW();

  RETURN NEW;

END;

$function$
;

CREATE OR REPLACE FUNCTION public.update_store_trade_area_context_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.update_strategy_feedback_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$

BEGIN

  NEW.updated_at = NOW();

  RETURN NEW;

END;

$function$
;

CREATE OR REPLACE FUNCTION public.update_trend_signals_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$

BEGIN

  NEW.updated_at = now();

  RETURN NEW;

END;

$function$
;

CREATE OR REPLACE FUNCTION public.update_viewer_count()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  _org_id uuid;
  _old_role app_role;
  _new_role app_role;
BEGIN
  _org_id := COALESCE(NEW.org_id, OLD.org_id);
  _old_role := OLD.role;
  _new_role := NEW.role;

  IF TG_OP = 'INSERT' AND _new_role = 'ORG_VIEWER' THEN
    -- Viewer 異붽??
    UPDATE public.subscriptions
    SET 
      viewer_count = viewer_count + 1,
      updated_at = now()
    WHERE org_id = _org_id;
    
  ELSIF TG_OP = 'DELETE' AND _old_role = 'ORG_VIEWER' THEN
    -- Viewer ?젣嫄?
    UPDATE public.subscriptions
    SET 
      viewer_count = GREATEST(viewer_count - 1, 0),
      updated_at = now()
    WHERE org_id = _org_id;
    
  ELSIF TG_OP = 'UPDATE' AND _old_role != _new_role THEN
    -- ?뿭?븷 蹂?寃?
    IF _new_role = 'ORG_VIEWER' AND _old_role != 'ORG_VIEWER' THEN
      UPDATE public.subscriptions
      SET 
        viewer_count = viewer_count + 1,
        updated_at = now()
      WHERE org_id = _org_id;
    ELSIF _old_role = 'ORG_VIEWER' AND _new_role != 'ORG_VIEWER' THEN
      UPDATE public.subscriptions
      SET 
        viewer_count = GREATEST(viewer_count - 1, 0),
        updated_at = now()
      WHERE org_id = _org_id;
    END IF;
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$function$
;

CREATE OR REPLACE FUNCTION public.user_can_access_store(p_store_id uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$

  SELECT EXISTS (

    SELECT 1 FROM public.stores s

    LEFT JOIN public.organization_members om ON om.org_id = s.org_id AND om.user_id = auth.uid()

    WHERE s.id = p_store_id

    AND (s.user_id = auth.uid() OR om.user_id IS NOT NULL)

  );

$function$
;


-- ============================================
-- TRIGGERS
-- ============================================

CREATE TRIGGER trigger_ai_response_logs_updated_at BEFORE UPDATE ON public.ai_response_logs FOR EACH ROW EXECUTE FUNCTION public.update_ai_response_logs_updated_at();
CREATE TRIGGER update_api_mapping_templates_updated_at BEFORE UPDATE ON public.api_mapping_templates FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trigger_applied_strategies_updated_at BEFORE UPDATE ON public.applied_strategies FOR EACH ROW EXECUTE FUNCTION public.update_applied_strategies_updated_at();
CREATE TRIGGER trigger_chat_conversations_updated_at BEFORE UPDATE ON public.chat_conversations FOR EACH ROW EXECUTE FUNCTION public.update_chat_conversations_updated_at();
CREATE TRIGGER trigger_sync_customer_to_ontology AFTER INSERT OR UPDATE ON public.customers FOR EACH ROW EXECUTE FUNCTION public.sync_customer_to_ontology();
CREATE TRIGGER update_daily_kpis_agg_updated_at BEFORE UPDATE ON public.daily_kpis_agg FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER furniture_updated_at BEFORE UPDATE ON public.furniture FOR EACH ROW EXECUTE FUNCTION public.update_furniture_updated_at();
CREATE TRIGGER update_furniture_updated_at BEFORE UPDATE ON public.furniture FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trigger_queue_relation_inference AFTER INSERT ON public.graph_entities FOR EACH ROW EXECUTE FUNCTION public.queue_relation_inference();
CREATE TRIGGER update_graph_entities_updated_at BEFORE UPDATE ON public.graph_entities FOR EACH ROW EXECUTE FUNCTION public.update_ontology_updated_at();
CREATE TRIGGER update_graph_relations_updated_at BEFORE UPDATE ON public.graph_relations FOR EACH ROW EXECUTE FUNCTION public.update_ontology_updated_at();
CREATE TRIGGER update_invitations_updated_at BEFORE UPDATE ON public.invitations FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_layout_optimization_results_updated_at BEFORE UPDATE ON public.layout_optimization_results FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trigger_update_license_counts AFTER INSERT OR DELETE OR UPDATE ON public.licenses FOR EACH ROW EXECUTE FUNCTION public.update_license_counts();
CREATE TRIGGER update_licenses_updated_at BEFORE UPDATE ON public.licenses FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trigger_model_3d_files_updated_at BEFORE UPDATE ON public.model_3d_files FOR EACH ROW EXECUTE FUNCTION public.update_model_3d_files_updated_at();
CREATE TRIGGER update_ontology_entity_mappings_updated_at BEFORE UPDATE ON public.ontology_entity_mappings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_ontology_entity_types_updated_at BEFORE UPDATE ON public.ontology_entity_types FOR EACH ROW EXECUTE FUNCTION public.update_ontology_updated_at();
CREATE TRIGGER update_ontology_relation_types_updated_at BEFORE UPDATE ON public.ontology_relation_types FOR EACH ROW EXECUTE FUNCTION public.update_ontology_updated_at();
CREATE TRIGGER trigger_update_persona_feedback_stats AFTER INSERT ON public.optimization_feedback FOR EACH ROW EXECUTE FUNCTION public.update_persona_feedback_stats();
CREATE TRIGGER update_optimization_tasks_updated_at BEFORE UPDATE ON public.optimization_tasks FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER org_member_count_trigger AFTER INSERT OR DELETE ON public.organization_members FOR EACH ROW EXECUTE FUNCTION public.update_org_member_count();
CREATE TRIGGER trigger_update_viewer_count AFTER INSERT OR DELETE OR UPDATE ON public.organization_members FOR EACH ROW EXECUTE FUNCTION public.update_viewer_count();
CREATE TRIGGER update_organization_members_updated_at BEFORE UPDATE ON public.organization_members FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_organization_settings_updated_at BEFORE UPDATE ON public.organization_settings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_organizations_updated_at BEFORE UPDATE ON public.organizations FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trigger_product_associations_updated_at BEFORE UPDATE ON public.product_associations FOR EACH ROW EXECUTE FUNCTION public.update_product_associations_updated_at();
CREATE TRIGGER trigger_sync_product_to_ontology AFTER INSERT OR UPDATE ON public.products FOR EACH ROW EXECUTE FUNCTION public.sync_product_to_ontology();
CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON public.products FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trigger_sync_purchase_to_ontology AFTER INSERT ON public.purchases FOR EACH ROW EXECUTE FUNCTION public.sync_purchase_to_ontology();
CREATE TRIGGER trg_set_measurement_dates BEFORE UPDATE ON public.recommendation_applications FOR EACH ROW EXECUTE FUNCTION public.set_measurement_dates();
CREATE TRIGGER trigger_recommendation_applications_updated_at BEFORE UPDATE ON public.recommendation_applications FOR EACH ROW EXECUTE FUNCTION public.update_recommendation_applications_updated_at();
CREATE TRIGGER update_regional_data_updated_at BEFORE UPDATE ON public.regional_data FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_retail_concepts_updated_at BEFORE UPDATE ON public.retail_concepts FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_calculate_kpi_changes BEFORE INSERT ON public.roi_measurements FOR EACH ROW EXECUTE FUNCTION public.calculate_kpi_changes();
CREATE TRIGGER update_simulation_history_updated_at BEFORE UPDATE ON public.simulation_history FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_staff_updated_at BEFORE UPDATE ON public.staff FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_staff_assignments_updated_at BEFORE UPDATE ON public.staff_assignments FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_store_scenes_updated_at BEFORE UPDATE ON public.store_scenes FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trigger_update_store_trade_area_context_updated_at BEFORE UPDATE ON public.store_trade_area_context FOR EACH ROW EXECUTE FUNCTION public.update_store_trade_area_context_updated_at();
CREATE TRIGGER trigger_aggregate_zone_performance AFTER INSERT ON public.store_visits FOR EACH ROW EXECUTE FUNCTION public.aggregate_zone_performance();
CREATE TRIGGER trigger_sync_store_to_ontology AFTER INSERT OR UPDATE ON public.stores FOR EACH ROW EXECUTE FUNCTION public.sync_store_to_ontology();
CREATE TRIGGER update_stores_updated_at BEFORE UPDATE ON public.stores FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trigger_strategy_feedback_updated_at BEFORE UPDATE ON public.strategy_feedback FOR EACH ROW EXECUTE FUNCTION public.update_strategy_feedback_updated_at();
CREATE TRIGGER update_subscriptions_updated_at BEFORE UPDATE ON public.subscriptions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trigger_update_trend_signals_updated_at BEFORE UPDATE ON public.trend_signals FOR EACH ROW EXECUTE FUNCTION public.update_trend_signals_updated_at();
CREATE TRIGGER trigger_sync_weather_to_ontology AFTER INSERT OR UPDATE ON public.weather_data FOR EACH ROW EXECUTE FUNCTION public.sync_weather_to_ontology();
CREATE TRIGGER update_weather_data_updated_at BEFORE UPDATE ON public.weather_data FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_zones_dim_updated_at BEFORE UPDATE ON public.zones_dim FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
