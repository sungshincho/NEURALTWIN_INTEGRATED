-- NEURALTWIN DB Schema (public)
-- Generated from remote DB via MCP execute_sql
-- Date: 2026-02-24

CREATE TABLE public.ai_batch_test_results (
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

CREATE TABLE public.ai_inference_logs (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  store_id uuid NOT NULL,
  org_id uuid NOT NULL,
  user_id uuid NOT NULL,
  scenario_type character varying(50) NOT NULL,
  inference_type character varying(50) NOT NULL,
  input_data_quality jsonb DEFAULT '{}'::jsonb,
  confidence_score numeric,
  confidence_factors jsonb DEFAULT '{}'::jsonb,
  result_summary jsonb DEFAULT '{}'::jsonb,
  recommendations_count integer DEFAULT 0,
  was_applied boolean DEFAULT false,
  application_id uuid,
  measured_impact jsonb,
  processing_time_ms integer,
  model_version character varying(50),
  created_at timestamp with time zone DEFAULT now()
);

CREATE TABLE public.ai_inference_results (
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

CREATE TABLE public.ai_insights (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid,
  org_id uuid,
  store_id uuid,
  category text,
  title text NOT NULL,
  insight_text text NOT NULL,
  severity text,
  source text,
  kpi_refs jsonb DEFAULT '[]'::jsonb,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE public.ai_model_performance (
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
  avg_confidence numeric,
  avg_actual_roi numeric,
  avg_predicted_roi numeric,
  prediction_accuracy numeric,
  confidence_adjustment numeric DEFAULT 0,
  roi_adjustment numeric DEFAULT 0,
  prompt_adjustments jsonb,
  created_at timestamp with time zone DEFAULT now()
);

CREATE TABLE public.ai_recommendations (
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

CREATE TABLE public.ai_response_logs (
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

CREATE TABLE public.ai_scene_analysis (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  org_id uuid,
  store_id uuid,
  analysis_type text NOT NULL,
  scene_data jsonb NOT NULL,
  insights jsonb NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE public.alerts (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid,
  org_id uuid,
  store_id uuid,
  alert_type text NOT NULL,
  severity text NOT NULL,
  message text NOT NULL,
  source text,
  is_read boolean NOT NULL DEFAULT false,
  resolved boolean NOT NULL DEFAULT false,
  resolved_at timestamp with time zone,
  resolved_by uuid,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE public.analysis_history (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  org_id uuid,
  store_id uuid,
  analysis_type text NOT NULL,
  input_data jsonb NOT NULL,
  result text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE public.api_connections (
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

CREATE TABLE public.api_mapping_templates (
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

CREATE TABLE public.api_sync_logs (
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

CREATE TABLE public.applied_strategies (
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
  expected_roi numeric NOT NULL,
  target_roi numeric,
  current_roi numeric,
  final_roi numeric,
  baseline_metrics jsonb DEFAULT '{}'::jsonb,
  status character varying(20) DEFAULT 'active'::character varying,
  result character varying(20),
  notes text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  completed_at timestamp with time zone,
  expected_revenue numeric,
  actual_revenue numeric,
  created_by uuid
);

CREATE TABLE public.assistant_command_cache (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  store_id uuid,
  input_pattern text,
  input_hash text,
  intent text,
  parameters jsonb,
  usage_count integer DEFAULT 1,
  last_used_at timestamp with time zone DEFAULT now(),
  expires_at timestamp with time zone
);

CREATE TABLE public.auto_order_suggestions (
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

CREATE TABLE public.beacon_events (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  org_id uuid,
  store_id uuid,
  beacon_id uuid,
  device_id text,
  event_ts timestamp with time zone NOT NULL,
  rssi numeric,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE public.beacons (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  org_id uuid,
  store_id uuid,
  beacon_code text NOT NULL,
  zone_id text,
  location text,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE public.camera_events (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  org_id uuid,
  store_id uuid,
  camera_code text,
  zone_id text,
  event_ts timestamp with time zone NOT NULL,
  event_type text,
  count integer,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE public.chat_context_memory (
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

CREATE TABLE public.chat_conversations (
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

CREATE TABLE public.chat_daily_analytics (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  date date NOT NULL,
  channel chat_channel NOT NULL,
  total_sessions integer DEFAULT 0,
  unique_users integer DEFAULT 0,
  avg_turns_per_session numeric,
  top_topics jsonb DEFAULT '[]'::jsonb,
  top_pain_points jsonb DEFAULT '[]'::jsonb,
  top_intents jsonb DEFAULT '[]'::jsonb,
  lead_conversion_rate numeric,
  satisfaction_avg numeric
);

CREATE TABLE public.chat_events (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  conversation_id uuid,
  channel chat_channel NOT NULL,
  event_type text NOT NULL,
  event_data jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone DEFAULT now()
);

CREATE TABLE public.chat_leads (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  conversation_id uuid,
  email text NOT NULL,
  company text,
  role text,
  pain_points jsonb DEFAULT '[]'::jsonb,
  source_page text,
  created_at timestamp with time zone DEFAULT now()
);

CREATE TABLE public.chat_messages (
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

CREATE TABLE public.column_mappings (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  org_id uuid,
  table_id uuid NOT NULL,
  source_column text NOT NULL,
  target_entity text NOT NULL,
  target_column text NOT NULL,
  transformation_rule text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE public.contact_submissions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL,
  company text NOT NULL,
  email text NOT NULL,
  phone text,
  stores integer,
  features _text,
  timeline text,
  message text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  privacy_consent boolean NOT NULL DEFAULT false,
  marketing_consent boolean DEFAULT false
);

CREATE TABLE public.customer_segments (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  org_id uuid,
  store_id uuid,
  segment_name text NOT NULL,
  segment_code text NOT NULL,
  description text,
  criteria jsonb DEFAULT '{}'::jsonb,
  customer_count integer DEFAULT 0,
  avg_ltv numeric,
  avg_purchase_frequency numeric,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

CREATE TABLE public.customer_segments_agg (
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

CREATE TABLE public.customers (
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

CREATE TABLE public.daily_kpis_agg (
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

CREATE TABLE public.daily_sales (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  org_id uuid,
  store_id uuid,
  date date NOT NULL,
  total_revenue numeric,
  total_transactions integer,
  avg_transaction_value numeric,
  total_customers integer,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE public.dashboard_kpis (
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

CREATE TABLE public.data_source_sync_logs (
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

CREATE TABLE public.data_source_tables (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  data_source_id uuid NOT NULL,
  table_name text NOT NULL,
  display_name text,
  columns jsonb NOT NULL DEFAULT '[]'::jsonb,
  row_count bigint DEFAULT 0,
  sample_data jsonb,
  created_at timestamp with time zone DEFAULT now()
);

CREATE TABLE public.data_sources (
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

CREATE TABLE public.data_sync_logs (
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

CREATE TABLE public.data_sync_schedules (
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

CREATE TABLE public.economic_indicators (
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

CREATE TABLE public.etl_runs (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  org_id uuid,
  store_id uuid,
  etl_function text NOT NULL,
  etl_version text DEFAULT '2.0'::text,
  date_range_start date,
  date_range_end date,
  input_record_count integer DEFAULT 0,
  output_record_count integer DEFAULT 0,
  raw_import_ids _uuid DEFAULT '{}'::uuid[],
  status text DEFAULT 'running'::text,
  error_message text,
  error_details jsonb,
  started_at timestamp with time zone DEFAULT now(),
  completed_at timestamp with time zone,
  duration_ms integer,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone DEFAULT now()
);

CREATE TABLE public.external_data_sources (
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

CREATE TABLE public.feedback_reason_codes (
  code text NOT NULL,
  category text NOT NULL,
  label_ko text NOT NULL,
  label_en text NOT NULL,
  description text,
  is_active boolean DEFAULT true,
  display_order integer DEFAULT 50
);

CREATE TABLE public.field_transform_rules (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  sync_endpoint_id uuid NOT NULL,
  source_field text NOT NULL,
  target_field text NOT NULL,
  transform_type text DEFAULT 'direct'::text,
  transform_config jsonb DEFAULT '{}'::jsonb,
  validation_rules jsonb DEFAULT '[]'::jsonb,
  on_error text DEFAULT 'skip'::text,
  default_value text,
  priority integer DEFAULT 100,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

CREATE TABLE public.funnel_events (
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

CREATE TABLE public.funnel_metrics (
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

CREATE TABLE public.furniture (
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

CREATE TABLE public.furniture_facings (
  code text NOT NULL,
  name text NOT NULL,
  traffic_exposure numeric NOT NULL,
  description text
);

CREATE TABLE public.furniture_height_zones (
  code text NOT NULL,
  name text NOT NULL,
  height_range_cm text NOT NULL,
  visibility_multiplier numeric NOT NULL,
  accessibility_multiplier numeric NOT NULL,
  recommended_products text,
  description text
);

CREATE TABLE public.furniture_slots (
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
  compatible_display_types _text DEFAULT '{}'::text[],
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

CREATE TABLE public.graph_entities (
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

CREATE TABLE public.graph_relations (
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

CREATE TABLE public.holidays_events (
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

CREATE TABLE public.hourly_metrics (
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

CREATE TABLE public.hq_guidelines (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  org_id uuid NOT NULL,
  title text NOT NULL,
  content text NOT NULL,
  category text NOT NULL,
  target_stores _uuid DEFAULT ARRAY[]::uuid[],
  priority text DEFAULT 'normal'::text,
  effective_date date,
  expiry_date date,
  attachments jsonb DEFAULT '[]'::jsonb,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

CREATE TABLE public.hq_notifications (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  org_id uuid NOT NULL,
  notification_type text NOT NULL,
  title text NOT NULL,
  message text NOT NULL,
  reference_id uuid,
  reference_type text,
  is_read boolean DEFAULT false,
  read_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now()
);

CREATE TABLE public.hq_store_messages (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  org_id uuid NOT NULL,
  sender_role app_role NOT NULL,
  sender_name text NOT NULL,
  recipient_store_id uuid,
  recipient_role app_role,
  message_type text NOT NULL DEFAULT 'general'::text,
  subject text,
  content text NOT NULL,
  attachments jsonb DEFAULT '[]'::jsonb,
  is_read boolean DEFAULT false,
  read_at timestamp with time zone,
  priority text DEFAULT 'normal'::text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

CREATE TABLE public.import_type_schemas (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  import_type text NOT NULL,
  target_table text NOT NULL,
  required_fields jsonb NOT NULL,
  optional_fields jsonb,
  validation_rules jsonb,
  sample_data jsonb,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

CREATE TABLE public.inventory (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  org_id uuid,
  store_id uuid,
  product_id uuid,
  quantity_on_hand integer NOT NULL,
  safety_stock integer,
  reorder_point integer,
  metadata jsonb DEFAULT '{}'::jsonb,
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE public.inventory_history (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  org_id uuid,
  store_id uuid,
  product_id uuid,
  date date NOT NULL,
  opening_qty integer,
  received_qty integer,
  sold_qty integer,
  adjustment_qty integer,
  closing_qty integer,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE public.inventory_levels (
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

CREATE TABLE public.inventory_movements (
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

CREATE TABLE public.invitations (
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

CREATE TABLE public.kpi_snapshots (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL,
  store_id uuid NOT NULL,
  application_id uuid,
  snapshot_date date NOT NULL,
  snapshot_type text DEFAULT 'daily'::text,
  total_revenue numeric,
  total_visitors integer,
  total_transactions integer,
  conversion_rate numeric,
  avg_transaction_value numeric,
  items_per_transaction numeric,
  avg_dwell_time_minutes numeric,
  additional_metrics jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone DEFAULT now()
);

CREATE TABLE public.kpis (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  org_id uuid,
  code text NOT NULL,
  name text NOT NULL,
  description text,
  unit text,
  category text,
  aggregation text DEFAULT 'sum'::text,
  is_active boolean NOT NULL DEFAULT true,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE public.layout_optimization_results (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  store_id uuid NOT NULL,
  user_id uuid,
  org_id uuid,
  optimization_type text NOT NULL,
  furniture_changes jsonb DEFAULT '[]'::jsonb,
  product_changes jsonb DEFAULT '[]'::jsonb,
  total_furniture_changes integer DEFAULT 0,
  total_product_changes integer DEFAULT 0,
  expected_revenue_improvement numeric,
  expected_traffic_improvement numeric,
  expected_conversion_improvement numeric,
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

CREATE TABLE public.learning_adjustments (
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
  effectiveness_score numeric,
  created_at timestamp with time zone DEFAULT now()
);

CREATE TABLE public.learning_sessions (
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

CREATE TABLE public.license_billing_history (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  license_id uuid NOT NULL,
  billing_date date NOT NULL,
  amount numeric NOT NULL,
  status text NOT NULL DEFAULT 'completed'::text,
  payment_method text,
  transaction_id text,
  notes text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE public.licenses (
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

CREATE TABLE public.line_items (
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

CREATE TABLE public.model_3d_files (
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

CREATE TABLE public.models (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  org_id uuid,
  name text NOT NULL,
  model_type text NOT NULL,
  target_entity text NOT NULL,
  version text NOT NULL,
  status text NOT NULL DEFAULT 'active'::text,
  config jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE public.notification_settings (
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

CREATE TABLE public.onboarding_progress (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL,
  user_id uuid NOT NULL,
  current_step integer NOT NULL DEFAULT 1,
  total_steps integer NOT NULL DEFAULT 7,
  completed_steps _int4 DEFAULT '{}'::integer[],
  skipped_steps _int4 DEFAULT '{}'::integer[],
  steps_status jsonb DEFAULT '{"7_completion": "pending", "3_data_source": "pending", "4_sample_data": "pending", "1_account_setup": "pending", "2_store_creation": "pending", "5_first_dashboard": "pending", "6_first_simulation": "pending"}'::jsonb,
  selected_template text,
  business_type text,
  store_count integer,
  primary_goals _text,
  data_sources _text,
  started_at timestamp with time zone DEFAULT now(),
  completed_at timestamp with time zone,
  last_activity_at timestamp with time zone DEFAULT now(),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

CREATE TABLE public.ontology_entity_mappings (
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

CREATE TABLE public.ontology_entity_types (
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

CREATE TABLE public.ontology_mapping_cache (
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

CREATE TABLE public.ontology_relation_inference_queue (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid,
  org_id uuid,
  entity_id uuid NOT NULL,
  status text NOT NULL DEFAULT 'pending'::text,
  retry_count integer NOT NULL DEFAULT 0,
  error_message text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  processed_at timestamp with time zone
);

CREATE TABLE public.ontology_relation_mappings (
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

CREATE TABLE public.ontology_relation_types (
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

CREATE TABLE public.ontology_schema_versions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  org_id uuid,
  version_number integer NOT NULL,
  description text,
  schema_data jsonb NOT NULL,
  created_at timestamp with time zone DEFAULT now()
);

CREATE TABLE public.ontology_schemas (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  schema_name text NOT NULL,
  version text NOT NULL,
  schema_type text NOT NULL,
  schema_definition jsonb NOT NULL,
  is_master boolean NOT NULL DEFAULT false,
  status text NOT NULL DEFAULT 'active'::text,
  created_by uuid,
  description text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE public.optimization_feedback (
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
  vmd_rules_applied _text,
  feedback_by text,
  created_at timestamp with time zone DEFAULT now()
);

CREATE TABLE public.optimization_tasks (
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

CREATE TABLE public.organization_members (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  org_id uuid,
  user_id uuid NOT NULL,
  role app_role NOT NULL DEFAULT 'ORG_MEMBER'::app_role,
  joined_at timestamp with time zone NOT NULL DEFAULT now(),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  license_id uuid
);

CREATE TABLE public.organization_settings (
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

CREATE TABLE public.organizations (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  org_name text NOT NULL,
  created_by uuid,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  metadata jsonb DEFAULT '{}'::jsonb,
  member_count integer DEFAULT 0
);

CREATE TABLE public.pos_integrations (
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

CREATE TABLE public.prediction_records (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  store_id uuid NOT NULL,
  prediction_type text NOT NULL,
  predicted_value numeric NOT NULL,
  actual_value numeric,
  prediction_date date NOT NULL,
  context jsonb DEFAULT '{}'::jsonb
);

CREATE TABLE public.product_associations (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  store_id uuid NOT NULL,
  org_id uuid,
  user_id uuid,
  antecedent_product_id uuid NOT NULL,
  consequent_product_id uuid NOT NULL,
  support numeric NOT NULL DEFAULT 0.01,
  confidence numeric NOT NULL DEFAULT 0.30,
  lift numeric NOT NULL DEFAULT 1.00,
  conviction numeric DEFAULT 1.00,
  rule_type character varying(20) DEFAULT 'co_purchase'::character varying,
  rule_strength character varying(20) DEFAULT 'moderate'::character varying,
  placement_type character varying(20) DEFAULT 'cross_sell'::character varying,
  co_occurrence_count integer DEFAULT 0,
  avg_basket_value numeric DEFAULT 0,
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

CREATE TABLE public.product_models (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL,
  display_type text NOT NULL,
  model_3d_url text NOT NULL,
  is_default boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

CREATE TABLE public.product_performance_agg (
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

CREATE TABLE public.product_placements (
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

CREATE TABLE public.products (
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
  compatible_display_types _text DEFAULT ARRAY['hanging'::text],
  margin_rate numeric,
  turnover_rate numeric,
  cross_sell_product_ids _uuid
);

CREATE TABLE public.profiles (
  id uuid NOT NULL,
  display_name text,
  avatar_url text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE public.purchases (
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

CREATE TABLE public.push_subscriptions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  subscription jsonb NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

CREATE TABLE public.quickstart_guides (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  guide_key text NOT NULL,
  title text NOT NULL,
  description text,
  target_page text NOT NULL,
  target_role _text,
  steps jsonb NOT NULL DEFAULT '[]'::jsonb,
  auto_show boolean DEFAULT true,
  show_once boolean DEFAULT true,
  priority integer DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

CREATE TABLE public.raw_imports (
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

CREATE TABLE public.realtime_inventory (
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
  quantity_available integer,
  reorder_point integer,
  reorder_quantity integer,
  is_low_stock boolean,
  unit_cost numeric,
  unit_price numeric,
  last_updated_at timestamp with time zone DEFAULT now(),
  last_sale_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now()
);

CREATE TABLE public.realtime_transactions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL,
  store_id uuid NOT NULL,
  pos_integration_id uuid,
  external_transaction_id text NOT NULL,
  external_data jsonb DEFAULT '{}'::jsonb,
  transaction_date date NOT NULL,
  transaction_time time without time zone NOT NULL,
  transaction_timestamp timestamp with time zone NOT NULL,
  subtotal numeric NOT NULL DEFAULT 0,
  discount_amount numeric DEFAULT 0,
  tax_amount numeric DEFAULT 0,
  total_amount numeric NOT NULL DEFAULT 0,
  payment_method text,
  currency text DEFAULT 'KRW'::text,
  customer_id text,
  customer_type text,
  items jsonb DEFAULT '[]'::jsonb,
  item_count integer DEFAULT 0,
  employee_id text,
  register_id text,
  receipt_number text,
  processed_at timestamp with time zone DEFAULT now(),
  is_voided boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now()
);

CREATE TABLE public.recommendation_applications (
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

CREATE TABLE public.regional_data (
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

CREATE TABLE public.report_schedules (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  org_id uuid,
  report_name text NOT NULL,
  report_type text NOT NULL,
  frequency text NOT NULL,
  recipients _text DEFAULT '{}'::text[],
  filters jsonb DEFAULT '{}'::jsonb,
  is_enabled boolean DEFAULT true,
  last_run_at timestamp with time zone,
  next_run_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

CREATE TABLE public.retail_concept_values (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  concept_id uuid NOT NULL,
  store_id uuid NOT NULL,
  computed_at timestamp with time zone DEFAULT now(),
  value jsonb NOT NULL,
  parameters jsonb,
  valid_until timestamp with time zone
);

CREATE TABLE public.retail_concepts (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  store_id uuid,
  name text NOT NULL,
  display_name text NOT NULL,
  category text NOT NULL,
  description text,
  involved_entity_types _text DEFAULT '{}'::text[],
  involved_relation_types _text DEFAULT '{}'::text[],
  computation jsonb NOT NULL DEFAULT '{}'::jsonb,
  ai_context jsonb NOT NULL DEFAULT '{}'::jsonb,
  is_system boolean DEFAULT false,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

CREATE TABLE public.retail_knowledge_chunks (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  topic_id text NOT NULL,
  chunk_type text NOT NULL,
  insight_id text,
  title text NOT NULL,
  content text NOT NULL,
  conditions jsonb DEFAULT '{}'::jsonb,
  source text DEFAULT 'curation'::text,
  embedding vector,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

CREATE TABLE public.roi_measurements (
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

CREATE TABLE public.sample_data_templates (
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

CREATE TABLE public.scenarios (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  org_id uuid,
  store_id uuid,
  scenario_name text NOT NULL,
  scenario_type text NOT NULL,
  parameters jsonb NOT NULL,
  results jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  predicted_kpi jsonb
);

CREATE TABLE public.shift_schedules (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  org_id uuid,
  store_id uuid,
  staff_id uuid,
  shift_date date NOT NULL,
  start_time time without time zone NOT NULL,
  end_time time without time zone NOT NULL,
  break_minutes integer DEFAULT 0,
  actual_start_time time without time zone,
  actual_end_time time without time zone,
  status text DEFAULT 'scheduled'::text,
  notes text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

CREATE TABLE public.simulation_configs (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL,
  store_id uuid,
  config_name text NOT NULL,
  simulation_type text NOT NULL,
  parameters jsonb NOT NULL DEFAULT '{}'::jsonb,
  status text NOT NULL DEFAULT 'draft'::text,
  created_by uuid,
  results jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE public.simulation_history (
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

CREATE TABLE public.staff (
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

CREATE TABLE public.staff_assignments (
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

CREATE TABLE public.store_comments (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  org_id uuid NOT NULL,
  store_id uuid,
  author_name text NOT NULL,
  author_role app_role NOT NULL,
  comment text NOT NULL,
  parent_comment_id uuid,
  is_pinned boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

CREATE TABLE public.store_goals (
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

CREATE TABLE public.store_personas (
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

CREATE TABLE public.store_scenes (
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

CREATE TABLE public.store_trade_area_context (
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

CREATE TABLE public.store_visits (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  store_id uuid NOT NULL,
  org_id uuid NOT NULL,
  customer_id uuid,
  visit_date timestamp with time zone NOT NULL DEFAULT now(),
  exit_date timestamp with time zone,
  duration_minutes integer,
  zones_visited _text,
  zone_durations jsonb DEFAULT '{}'::jsonb,
  made_purchase boolean DEFAULT false,
  transaction_id uuid,
  purchase_amount numeric,
  entry_point character varying(100),
  device_type character varying(50),
  data_source character varying(50) DEFAULT 'estimated'::character varying,
  created_at timestamp with time zone DEFAULT now()
);

CREATE TABLE public.stored_model_parameters (
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

CREATE TABLE public.stores (
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
  floor_area_sqm numeric,
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

CREATE TABLE public.strategy_daily_metrics (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  strategy_id uuid NOT NULL,
  date date NOT NULL,
  metrics jsonb NOT NULL DEFAULT '{}'::jsonb,
  daily_roi numeric,
  cumulative_roi numeric,
  created_at timestamp with time zone DEFAULT now()
);

CREATE TABLE public.strategy_feedback (
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
  expected_roi numeric,
  actual_roi numeric,
  roi_accuracy numeric,
  feedback_type character varying(20),
  learnings jsonb,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

CREATE TABLE public.subscriptions (
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

CREATE TABLE public.sync_endpoints (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  api_connection_id uuid NOT NULL,
  name text NOT NULL,
  description text,
  endpoint_path text NOT NULL,
  http_method text DEFAULT 'GET'::text,
  target_table text NOT NULL,
  data_path text,
  sync_mode text DEFAULT 'incremental'::text,
  sync_frequency text DEFAULT 'daily'::text,
  last_sync_at timestamp with time zone,
  last_sync_status text,
  last_sync_record_count integer DEFAULT 0,
  last_sync_error text,
  pagination_config jsonb DEFAULT '{"type": "offset", "page_param": "page", "limit_param": "limit", "default_limit": 100}'::jsonb,
  query_params jsonb DEFAULT '{}'::jsonb,
  incremental_key text,
  incremental_value text,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  org_id uuid,
  user_id uuid NOT NULL
);

CREATE TABLE public.sync_logs (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL,
  pos_integration_id uuid NOT NULL,
  sync_type text NOT NULL,
  sync_started_at timestamp with time zone DEFAULT now(),
  sync_ended_at timestamp with time zone,
  status text DEFAULT 'running'::text,
  records_fetched integer DEFAULT 0,
  records_created integer DEFAULT 0,
  records_updated integer DEFAULT 0,
  records_failed integer DEFAULT 0,
  error_message text,
  error_details jsonb,
  created_at timestamp with time zone DEFAULT now()
);

CREATE TABLE public.tasks (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  org_id uuid,
  store_id uuid,
  task_code text,
  task_name text NOT NULL,
  description text,
  assigned_to_id uuid,
  assigned_to text,
  due_date date,
  status text NOT NULL DEFAULT 'pending'::text,
  priority text NOT NULL DEFAULT 'medium'::text,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_by uuid,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE public.transactions (
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

CREATE TABLE public.trend_signals (
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

CREATE TABLE public.upload_sessions (
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

CREATE TABLE public.user_activity_logs (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  org_id uuid,
  activity_type text NOT NULL,
  activity_data jsonb DEFAULT '{}'::jsonb,
  ip_address text,
  user_agent text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE public.user_alerts (
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

CREATE TABLE public.user_data_imports (
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

CREATE TABLE public.user_guide_completions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  guide_key text NOT NULL,
  completed_at timestamp with time zone DEFAULT now()
);

CREATE TABLE public.v_org_id (
  id uuid
);

CREATE TABLE public.visit_zone_events (
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

CREATE TABLE public.visits (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  org_id uuid,
  store_id uuid,
  customer_id uuid,
  visit_date timestamp with time zone NOT NULL,
  duration_minutes integer,
  zones_visited _text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE public.vmd_rule_applications (
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

CREATE TABLE public.vmd_rulesets (
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
  applicable_store_types _text DEFAULT ARRAY['all'::text],
  applicable_industries _text DEFAULT ARRAY['retail'::text],
  is_active boolean DEFAULT true,
  priority integer DEFAULT 50,
  version integer DEFAULT 1,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  created_by text DEFAULT 'system'::text
);

CREATE TABLE public.vmd_zone_types (
  code text NOT NULL,
  name text NOT NULL,
  description text,
  typical_dwell_seconds integer,
  traffic_weight numeric,
  color_code text
);

CREATE TABLE public.weather_data (
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

CREATE TABLE public.web_events (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  org_id uuid,
  site text,
  session_id text,
  event_type text,
  page_path text,
  referrer text,
  event_ts timestamp with time zone NOT NULL,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE public.wifi_events (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  org_id uuid,
  store_id uuid,
  device_id text,
  zone_id text,
  event_type text,
  event_ts timestamp with time zone NOT NULL,
  dwell_time_seconds integer,
  signal_strength integer,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE public.wifi_tracking (
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

CREATE TABLE public.wifi_zones (
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

CREATE TABLE public.zone_daily_metrics (
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

CREATE TABLE public.zone_events (
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

CREATE TABLE public.zone_metrics (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  org_id uuid,
  store_id uuid,
  zone_id text NOT NULL,
  date date NOT NULL,
  visitor_count integer,
  dwell_time_avg_min numeric,
  conversion_rate numeric,
  revenue numeric,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  hour integer
);

CREATE TABLE public.zone_performance (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  store_id uuid NOT NULL,
  org_id uuid NOT NULL,
  zone_name character varying(100) NOT NULL,
  date date NOT NULL,
  visit_count integer DEFAULT 0,
  unique_visitors integer DEFAULT 0,
  avg_dwell_time numeric DEFAULT 0,
  purchase_count integer DEFAULT 0,
  conversion_rate numeric DEFAULT 0,
  revenue_contribution numeric DEFAULT 0,
  hourly_visits jsonb DEFAULT '{}'::jsonb,
  heatmap_data jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

CREATE TABLE public.zone_transitions (
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

CREATE TABLE public.zones_dim (
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

