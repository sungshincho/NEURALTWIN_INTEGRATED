-- ============================================================================
-- NEURALTWIN 통합 마이그레이션 스크립트
-- 새 Supabase 프로젝트용 (bdrvowacecxnraaivlhr)
-- ============================================================================
-- 실행 방법:
-- 1. https://supabase.com/dashboard/project/bdrvowacecxnraaivlhr/sql/new 접속
-- 2. 이 파일의 전체 내용을 복사하여 SQL Editor에 붙여넣기
-- 3. "Run" 버튼 클릭
-- ============================================================================

-- Migration 1: 20251119022841_remix_migration_from_pg_dump.sql
-- 기본 테이블 및 스키마 생성
-- ============================================================================

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "pg_trgm" WITH SCHEMA "public";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";

-- Create app_role enum
DO $$ BEGIN
  CREATE TYPE public.app_role AS ENUM (
    'ORG_OWNER',
    'ORG_ADMIN', 
    'ORG_MEMBER',
    'NEURALTWIN_ADMIN'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Create profiles table
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid NOT NULL PRIMARY KEY,
  display_name text,
  avatar_url text,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Create organizations table
CREATE TABLE IF NOT EXISTS public.organizations (
  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  org_name text NOT NULL,
  created_by uuid,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL,
  metadata jsonb DEFAULT '{}'::jsonb
);

-- Create organization_members table
CREATE TABLE IF NOT EXISTS public.organization_members (
  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  org_id uuid,
  user_id uuid NOT NULL,
  role public.app_role DEFAULT 'ORG_MEMBER'::public.app_role NOT NULL,
  joined_at timestamp with time zone DEFAULT now() NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL,
  permissions jsonb,
  CONSTRAINT organization_members_org_id_fkey FOREIGN KEY (org_id) REFERENCES public.organizations(id) ON DELETE CASCADE,
  CONSTRAINT organization_members_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Create subscriptions table
CREATE TABLE IF NOT EXISTS public.subscriptions (
  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  org_id uuid NOT NULL,
  plan_type text NOT NULL,
  status text NOT NULL,
  store_quota integer NOT NULL,
  hq_seat_quota integer NOT NULL,
  billing_cycle_start date DEFAULT CURRENT_DATE NOT NULL,
  billing_cycle_end date DEFAULT (CURRENT_DATE + '1 mon'::interval) NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL,
  metadata jsonb DEFAULT '{}'::jsonb,
  CONSTRAINT subscriptions_org_id_fkey FOREIGN KEY (org_id) REFERENCES public.organizations(id) ON DELETE CASCADE
);

-- Create licenses table
CREATE TABLE IF NOT EXISTS public.licenses (
  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  org_id uuid NOT NULL,
  license_type text NOT NULL,
  effective_date date NOT NULL,
  expiry_date date,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL,
  metadata jsonb DEFAULT '{}'::jsonb,
  CONSTRAINT licenses_org_id_fkey FOREIGN KEY (org_id) REFERENCES public.organizations(id) ON DELETE CASCADE
);

-- Create stores table
CREATE TABLE IF NOT EXISTS public.stores (
  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  user_id uuid NOT NULL,
  org_id uuid,
  store_name text NOT NULL,
  location text,
  store_type text,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL,
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
  address text
);

-- Create products table
CREATE TABLE IF NOT EXISTS public.products (
  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  user_id uuid NOT NULL,
  org_id uuid,
  store_id uuid,
  product_name text NOT NULL,
  category text,
  price numeric,
  stock integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL,
  sku text,
  brand text,
  description text,
  cost_price numeric,
  min_stock_level integer,
  CONSTRAINT products_store_id_fkey FOREIGN KEY (store_id) REFERENCES public.stores(id) ON DELETE SET NULL
);

-- Create customers table
CREATE TABLE IF NOT EXISTS public.customers (
  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  user_id uuid NOT NULL,
  org_id uuid,
  store_id uuid,
  customer_name text,
  email text,
  phone text,
  segment text,
  total_purchases numeric DEFAULT 0,
  last_visit_date timestamp with time zone,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT customers_store_id_fkey FOREIGN KEY (store_id) REFERENCES public.stores(id) ON DELETE SET NULL
);

-- Create visits table
CREATE TABLE IF NOT EXISTS public.visits (
  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  user_id uuid NOT NULL,
  org_id uuid,
  store_id uuid,
  customer_id uuid,
  visit_date timestamp with time zone NOT NULL,
  duration_minutes integer,
  zones_visited text[],
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT visits_store_id_fkey FOREIGN KEY (store_id) REFERENCES public.stores(id) ON DELETE CASCADE,
  CONSTRAINT visits_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES public.customers(id) ON DELETE SET NULL
);

-- Create purchases table
CREATE TABLE IF NOT EXISTS public.purchases (
  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
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
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT purchases_store_id_fkey FOREIGN KEY (store_id) REFERENCES public.stores(id) ON DELETE CASCADE,
  CONSTRAINT purchases_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES public.customers(id) ON DELETE SET NULL,
  CONSTRAINT purchases_visit_id_fkey FOREIGN KEY (visit_id) REFERENCES public.visits(id) ON DELETE SET NULL,
  CONSTRAINT purchases_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE SET NULL
);

-- Create wifi_zones table
CREATE TABLE IF NOT EXISTS public.wifi_zones (
  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  user_id uuid NOT NULL,
  org_id uuid,
  store_id uuid NOT NULL,
  zone_name text NOT NULL,
  zone_type text,
  coordinates jsonb,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT wifi_zones_store_id_fkey FOREIGN KEY (store_id) REFERENCES public.stores(id) ON DELETE CASCADE
);

-- Create wifi_tracking table
CREATE TABLE IF NOT EXISTS public.wifi_tracking (
  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  user_id uuid NOT NULL,
  org_id uuid,
  store_id uuid NOT NULL,
  zone_id uuid,
  mac_address text NOT NULL,
  timestamp timestamp with time zone NOT NULL,
  signal_strength integer,
  dwell_time_seconds integer,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT wifi_tracking_store_id_fkey FOREIGN KEY (store_id) REFERENCES public.stores(id) ON DELETE CASCADE,
  CONSTRAINT wifi_tracking_zone_id_fkey FOREIGN KEY (zone_id) REFERENCES public.wifi_zones(id) ON DELETE SET NULL
);

-- Create scenarios table
CREATE TABLE IF NOT EXISTS public.scenarios (
  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  user_id uuid NOT NULL,
  org_id uuid,
  store_id uuid,
  scenario_name text NOT NULL,
  scenario_type text NOT NULL,
  parameters jsonb NOT NULL,
  results jsonb,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT scenarios_store_id_fkey FOREIGN KEY (store_id) REFERENCES public.stores(id) ON DELETE SET NULL
);

-- Create user_data_imports table
CREATE TABLE IF NOT EXISTS public.user_data_imports (
  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  user_id uuid NOT NULL,
  org_id uuid,
  store_id uuid,
  data_type text NOT NULL,
  file_name text NOT NULL,
  status text DEFAULT 'pending'::text NOT NULL,
  row_count integer DEFAULT 0,
  error_message text,
  raw_data jsonb,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL,
  progress jsonb,
  error_details jsonb,
  started_at timestamp with time zone,
  completed_at timestamp with time zone,
  is_paused boolean DEFAULT false,
  can_resume boolean DEFAULT false,
  CONSTRAINT user_data_imports_store_id_fkey FOREIGN KEY (store_id) REFERENCES public.stores(id) ON DELETE SET NULL
);

-- Create upload_sessions table  
CREATE TABLE IF NOT EXISTS public.upload_sessions (
  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  user_id uuid NOT NULL,
  org_id uuid,
  store_id uuid,
  session_name text,
  status text DEFAULT 'in_progress'::text NOT NULL,
  total_files integer DEFAULT 0,
  processed_files integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT upload_sessions_store_id_fkey FOREIGN KEY (store_id) REFERENCES public.stores(id) ON DELETE SET NULL
);

-- Create dashboard_kpis table
CREATE TABLE IF NOT EXISTS public.dashboard_kpis (
  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
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
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT dashboard_kpis_store_id_fkey FOREIGN KEY (store_id) REFERENCES public.stores(id) ON DELETE SET NULL
);

-- Create ai_recommendations table
CREATE TABLE IF NOT EXISTS public.ai_recommendations (
  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
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
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL,
  displayed_at timestamp with time zone,
  dismissed_at timestamp with time zone,
  is_displayed boolean DEFAULT true,
  CONSTRAINT ai_recommendations_store_id_fkey FOREIGN KEY (store_id) REFERENCES public.stores(id) ON DELETE SET NULL
);

-- Create analysis_history table
CREATE TABLE IF NOT EXISTS public.analysis_history (
  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  user_id uuid NOT NULL,
  org_id uuid,
  store_id uuid,
  analysis_type text NOT NULL,
  input_data jsonb NOT NULL,
  result text NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT analysis_history_store_id_fkey FOREIGN KEY (store_id) REFERENCES public.stores(id) ON DELETE SET NULL
);

-- Create api_connections table
CREATE TABLE IF NOT EXISTS public.api_connections (
  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
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
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Create external_data_sources table
CREATE TABLE IF NOT EXISTS public.external_data_sources (
  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  user_id uuid NOT NULL,
  org_id uuid,
  name text NOT NULL,
  source_type text NOT NULL,
  api_url text,
  api_key_encrypted text,
  description text,
  is_active boolean DEFAULT true NOT NULL,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Create data_sync_schedules table
CREATE TABLE IF NOT EXISTS public.data_sync_schedules (
  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  user_id uuid NOT NULL,
  org_id uuid,
  data_source_id uuid NOT NULL,
  schedule_name text NOT NULL,
  cron_expression text NOT NULL,
  is_enabled boolean DEFAULT true NOT NULL,
  last_run_at timestamp with time zone,
  next_run_at timestamp with time zone,
  last_status text,
  error_message text,
  sync_config jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT data_sync_schedules_data_source_id_fkey FOREIGN KEY (data_source_id) REFERENCES public.external_data_sources(id) ON DELETE CASCADE
);

-- Create data_sync_logs table
CREATE TABLE IF NOT EXISTS public.data_sync_logs (
  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  user_id uuid NOT NULL,
  org_id uuid,
  schedule_id uuid NOT NULL,
  status text NOT NULL,
  started_at timestamp with time zone DEFAULT now() NOT NULL,
  completed_at timestamp with time zone,
  records_synced integer DEFAULT 0,
  error_message text,
  metadata jsonb DEFAULT '{}'::jsonb,
  CONSTRAINT data_sync_logs_schedule_id_fkey FOREIGN KEY (schedule_id) REFERENCES public.data_sync_schedules(id) ON DELETE CASCADE
);

-- Create funnel_metrics table
CREATE TABLE IF NOT EXISTS public.funnel_metrics (
  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  user_id uuid NOT NULL,
  org_id uuid,
  store_id uuid,
  date date NOT NULL,
  hour integer,
  customer_segment text,
  stage text NOT NULL,
  count integer NOT NULL,
  duration_seconds integer,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT funnel_metrics_store_id_fkey FOREIGN KEY (store_id) REFERENCES public.stores(id) ON DELETE CASCADE
);

-- Create ontology_entity_types table
CREATE TABLE IF NOT EXISTS public.ontology_entity_types (
  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  user_id uuid NOT NULL,
  org_id uuid,
  name text NOT NULL,
  label text NOT NULL,
  description text,
  properties jsonb DEFAULT '[]'::jsonb,
  color text DEFAULT '#3b82f6'::text,
  icon text,
  model_3d_url text,
  model_3d_type text,
  model_3d_dimensions jsonb DEFAULT '{"width": 1, "height": 1, "depth": 1}'::jsonb,
  model_3d_metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Create ontology_relation_types table
CREATE TABLE IF NOT EXISTS public.ontology_relation_types (
  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  user_id uuid NOT NULL,
  org_id uuid,
  name text NOT NULL,
  label text NOT NULL,
  description text,
  source_entity_type text NOT NULL,
  target_entity_type text NOT NULL,
  directionality text DEFAULT 'directed'::text,
  properties jsonb DEFAULT '[]'::jsonb,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Create graph_entities table
CREATE TABLE IF NOT EXISTS public.graph_entities (
  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  user_id uuid NOT NULL,
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
  CONSTRAINT graph_entities_entity_type_id_fkey FOREIGN KEY (entity_type_id) REFERENCES public.ontology_entity_types(id) ON DELETE CASCADE,
  CONSTRAINT graph_entities_store_id_fkey FOREIGN KEY (store_id) REFERENCES public.stores(id) ON DELETE SET NULL
);

-- Create graph_relations table
CREATE TABLE IF NOT EXISTS public.graph_relations (
  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  user_id uuid NOT NULL,
  org_id uuid,
  store_id uuid,
  relation_type_id uuid NOT NULL,
  source_entity_id uuid NOT NULL,
  target_entity_id uuid NOT NULL,
  properties jsonb DEFAULT '{}'::jsonb,
  weight double precision DEFAULT 1.0,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT graph_relations_relation_type_id_fkey FOREIGN KEY (relation_type_id) REFERENCES public.ontology_relation_types(id) ON DELETE CASCADE,
  CONSTRAINT graph_relations_source_entity_id_fkey FOREIGN KEY (source_entity_id) REFERENCES public.graph_entities(id) ON DELETE CASCADE,
  CONSTRAINT graph_relations_target_entity_id_fkey FOREIGN KEY (target_entity_id) REFERENCES public.graph_entities(id) ON DELETE CASCADE,
  CONSTRAINT graph_relations_store_id_fkey FOREIGN KEY (store_id) REFERENCES public.stores(id) ON DELETE SET NULL
);

-- Create ontology_schema_versions table
CREATE TABLE IF NOT EXISTS public.ontology_schema_versions (
  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  user_id uuid NOT NULL,
  org_id uuid,
  version_number integer NOT NULL,
  description text,
  schema_data jsonb NOT NULL,
  created_at timestamp with time zone DEFAULT now()
);

-- Create ontology_mapping_cache table
CREATE TABLE IF NOT EXISTS public.ontology_mapping_cache (
  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
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

-- Create hq_store_master table
CREATE TABLE IF NOT EXISTS public.hq_store_master (
  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  user_id uuid NOT NULL,
  org_id uuid,
  hq_store_code text NOT NULL,
  hq_store_name text NOT NULL,
  store_format text,
  region text,
  district text,
  address text,
  phone text,
  email text,
  manager_name text,
  status text DEFAULT 'active'::text,
  opening_date date,
  area_sqm numeric,
  external_system_id text,
  external_system_name text,
  metadata jsonb DEFAULT '{}'::jsonb,
  last_synced_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Create hq_sync_logs table
CREATE TABLE IF NOT EXISTS public.hq_sync_logs (
  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  user_id uuid NOT NULL,
  org_id uuid,
  sync_type text NOT NULL,
  status text NOT NULL,
  started_at timestamp with time zone DEFAULT now() NOT NULL,
  completed_at timestamp with time zone,
  records_processed integer DEFAULT 0,
  records_synced integer DEFAULT 0,
  records_failed integer DEFAULT 0,
  error_message text,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Create inventory_levels table
CREATE TABLE IF NOT EXISTS public.inventory_levels (
  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  user_id uuid NOT NULL,
  org_id uuid,
  product_id uuid NOT NULL,
  current_stock integer DEFAULT 0 NOT NULL,
  optimal_stock integer NOT NULL,
  minimum_stock integer NOT NULL,
  weekly_demand integer DEFAULT 0 NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  last_updated timestamp with time zone DEFAULT now(),
  CONSTRAINT inventory_levels_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE CASCADE
);

-- Create auto_order_suggestions table
CREATE TABLE IF NOT EXISTS public.auto_order_suggestions (
  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  user_id uuid NOT NULL,
  org_id uuid,
  product_id uuid NOT NULL,
  current_stock integer NOT NULL,
  optimal_stock integer NOT NULL,
  suggested_order_quantity integer NOT NULL,
  urgency_level text NOT NULL,
  estimated_stockout_date timestamp with time zone,
  potential_revenue_loss numeric DEFAULT 0,
  status text DEFAULT 'pending'::text NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT auto_order_suggestions_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE CASCADE
);

-- Create neuralsense_devices table
CREATE TABLE IF NOT EXISTS public.neuralsense_devices (
  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  user_id uuid NOT NULL,
  org_id uuid,
  device_id text NOT NULL,
  device_name text NOT NULL,
  mac_address text,
  ip_address text,
  location text,
  status text DEFAULT 'offline'::text NOT NULL,
  wifi_probe_enabled boolean DEFAULT true,
  probe_interval_seconds integer DEFAULT 5,
  probe_range_meters integer DEFAULT 50,
  raspberry_pi_model text,
  last_seen timestamp with time zone,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Create notification_settings table
CREATE TABLE IF NOT EXISTS public.notification_settings (
  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  user_id uuid NOT NULL,
  org_id uuid,
  email_enabled boolean DEFAULT true,
  slack_enabled boolean DEFAULT false,
  slack_webhook_url text,
  notification_types jsonb DEFAULT '["stockout", "anomaly", "milestone"]'::jsonb,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Create holidays_events table
CREATE TABLE IF NOT EXISTS public.holidays_events (
  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  user_id uuid NOT NULL,
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
  CONSTRAINT holidays_events_store_id_fkey FOREIGN KEY (store_id) REFERENCES public.stores(id) ON DELETE SET NULL
);

-- Create economic_indicators table
CREATE TABLE IF NOT EXISTS public.economic_indicators (
  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
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
  updated_at timestamp with time zone DEFAULT now()
);

-- Create ai_scene_analysis table
CREATE TABLE IF NOT EXISTS public.ai_scene_analysis (
  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  user_id uuid NOT NULL,
  org_id uuid,
  store_id uuid,
  analysis_type text NOT NULL,
  scene_data jsonb NOT NULL,
  insights jsonb NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT ai_scene_analysis_store_id_fkey FOREIGN KEY (store_id) REFERENCES public.stores(id) ON DELETE SET NULL
);

-- Enable Realtime for user_data_imports
ALTER PUBLICATION supabase_realtime ADD TABLE public.user_data_imports;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_stores_user_id ON public.stores(user_id);
CREATE INDEX IF NOT EXISTS idx_stores_org_id ON public.stores(org_id);
CREATE INDEX IF NOT EXISTS idx_products_user_id ON public.products(user_id);
CREATE INDEX IF NOT EXISTS idx_products_org_id ON public.products(org_id);
CREATE INDEX IF NOT EXISTS idx_products_store_id ON public.products(store_id);
CREATE INDEX IF NOT EXISTS idx_customers_user_id ON public.customers(user_id);
CREATE INDEX IF NOT EXISTS idx_customers_org_id ON public.customers(org_id);
CREATE INDEX IF NOT EXISTS idx_visits_user_id ON public.visits(user_id);
CREATE INDEX IF NOT EXISTS idx_visits_org_id ON public.visits(org_id);
CREATE INDEX IF NOT EXISTS idx_purchases_user_id ON public.purchases(user_id);
CREATE INDEX IF NOT EXISTS idx_purchases_org_id ON public.purchases(org_id);
CREATE INDEX IF NOT EXISTS idx_user_data_imports_user_id_status ON public.user_data_imports(user_id, status);
CREATE INDEX IF NOT EXISTS idx_user_data_imports_store_id_status ON public.user_data_imports(store_id, status);
CREATE INDEX IF NOT EXISTS idx_dashboard_kpis_store_id_date ON public.dashboard_kpis(store_id, date);
CREATE INDEX IF NOT EXISTS idx_graph_entities_user_id ON public.graph_entities(user_id);
CREATE INDEX IF NOT EXISTS idx_graph_entities_store_id ON public.graph_entities(store_id);
CREATE INDEX IF NOT EXISTS idx_graph_relations_user_id ON public.graph_relations(user_id);
CREATE INDEX IF NOT EXISTS idx_graph_relations_store_id ON public.graph_relations(store_id);

-- ============================================================================
-- Migration 2-24: 나머지 마이그레이션 파일들
-- ============================================================================

-- Create trigger functions
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.update_ontology_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.update_ai_scene_analysis_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.email));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create triggers
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_organizations_updated_at ON public.organizations;
CREATE TRIGGER update_organizations_updated_at
  BEFORE UPDATE ON public.organizations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_organization_members_updated_at ON public.organization_members;
CREATE TRIGGER update_organization_members_updated_at
  BEFORE UPDATE ON public.organization_members
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_subscriptions_updated_at ON public.subscriptions;
CREATE TRIGGER update_subscriptions_updated_at
  BEFORE UPDATE ON public.subscriptions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_licenses_updated_at ON public.licenses;
CREATE TRIGGER update_licenses_updated_at
  BEFORE UPDATE ON public.licenses
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_stores_updated_at ON public.stores;
CREATE TRIGGER update_stores_updated_at
  BEFORE UPDATE ON public.stores
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_products_updated_at ON public.products;
CREATE TRIGGER update_products_updated_at
  BEFORE UPDATE ON public.products
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_ontology_entity_types_updated_at ON public.ontology_entity_types;
CREATE TRIGGER update_ontology_entity_types_updated_at
  BEFORE UPDATE ON public.ontology_entity_types
  FOR EACH ROW EXECUTE FUNCTION public.update_ontology_updated_at();

DROP TRIGGER IF EXISTS update_ontology_relation_types_updated_at ON public.ontology_relation_types;
CREATE TRIGGER update_ontology_relation_types_updated_at
  BEFORE UPDATE ON public.ontology_relation_types
  FOR EACH ROW EXECUTE FUNCTION public.update_ontology_updated_at();

DROP TRIGGER IF EXISTS update_graph_entities_updated_at ON public.graph_entities;
CREATE TRIGGER update_graph_entities_updated_at
  BEFORE UPDATE ON public.graph_entities
  FOR EACH ROW EXECUTE FUNCTION public.update_ontology_updated_at();

DROP TRIGGER IF EXISTS update_graph_relations_updated_at ON public.graph_relations;
CREATE TRIGGER update_graph_relations_updated_at
  BEFORE UPDATE ON public.graph_relations
  FOR EACH ROW EXECUTE FUNCTION public.update_ontology_updated_at();

DROP TRIGGER IF EXISTS update_ai_scene_analysis_updated_at ON public.ai_scene_analysis;
CREATE TRIGGER update_ai_scene_analysis_updated_at
  BEFORE UPDATE ON public.ai_scene_analysis
  FOR EACH ROW EXECUTE FUNCTION public.update_ai_scene_analysis_updated_at();

-- Create Security Definer functions
CREATE OR REPLACE FUNCTION public.is_org_member(_user_id uuid, _org_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.organization_members
    WHERE user_id = _user_id
      AND org_id = _org_id
  )
$$;

CREATE OR REPLACE FUNCTION public.get_user_org_id(_user_id uuid)
RETURNS uuid
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT org_id
  FROM public.organization_members
  WHERE user_id = _user_id
  LIMIT 1
$$;

CREATE OR REPLACE FUNCTION public.is_org_admin(_user_id uuid, _org_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.organization_members
    WHERE user_id = _user_id
      AND org_id = _org_id
      AND role IN ('ORG_OWNER', 'ORG_ADMIN')
  )
$$;

CREATE OR REPLACE FUNCTION public.is_neuraltwin_admin(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.organization_members
    WHERE user_id = _user_id
      AND role = 'NEURALTWIN_ADMIN'
  )
$$;

CREATE OR REPLACE FUNCTION public.is_org_owner(_user_id uuid, _org_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.organization_members
    WHERE user_id = _user_id
      AND org_id = _org_id
      AND role = 'ORG_OWNER'
  )
$$;

CREATE OR REPLACE FUNCTION public.migrate_user_to_organization(p_user_id uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
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
$$;

-- Create graph query functions
CREATE OR REPLACE FUNCTION public.graph_n_hop_query(p_user_id uuid, p_start_entity_id uuid, p_max_hops integer DEFAULT 3)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
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
$$;

CREATE OR REPLACE FUNCTION public.graph_shortest_path(p_user_id uuid, p_start_id uuid, p_end_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
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
$$;

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.licenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.visits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wifi_zones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wifi_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scenarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_data_imports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.upload_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dashboard_kpis ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_recommendations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analysis_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.api_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.external_data_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.data_sync_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.data_sync_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.funnel_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ontology_entity_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ontology_relation_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.graph_entities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.graph_relations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ontology_schema_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ontology_mapping_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hq_store_master ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hq_sync_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_levels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.auto_order_suggestions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.neuralsense_devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.holidays_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.economic_indicators ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_scene_analysis ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for profiles
CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- Create RLS policies for organizations
CREATE POLICY "Organization members can view their organizations"
  ON public.organizations FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.organization_members
      WHERE organization_members.org_id = organizations.id
        AND organization_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Organization owners can update their organizations"
  ON public.organizations FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.organization_members
      WHERE organization_members.org_id = organizations.id
        AND organization_members.user_id = auth.uid()
        AND organization_members.role = 'ORG_OWNER'
    )
  );

CREATE POLICY "Users can create organizations"
  ON public.organizations FOR INSERT
  WITH CHECK (auth.uid() = created_by);

-- Create RLS policies for organization_members
CREATE POLICY "Users can view their own membership records"
  ON public.organization_members FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view members in their organization"
  ON public.organization_members FOR SELECT
  USING (
    org_id IN (
      SELECT org_id FROM public.organization_members
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Org owners and admins can add members"
  ON public.organization_members FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.organization_members
      WHERE organization_members.org_id = organization_members.org_id
        AND organization_members.user_id = auth.uid()
        AND organization_members.role IN ('ORG_OWNER', 'ORG_ADMIN')
    )
  );

CREATE POLICY "Org owners and admins can update members"
  ON public.organization_members FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.organization_members AS om
      WHERE om.org_id = organization_members.org_id
        AND om.user_id = auth.uid()
        AND om.role IN ('ORG_OWNER', 'ORG_ADMIN')
    )
  );

CREATE POLICY "Org owners and admins can remove members"
  ON public.organization_members FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.organization_members AS om
      WHERE om.org_id = organization_members.org_id
        AND om.user_id = auth.uid()
        AND om.role IN ('ORG_OWNER', 'ORG_ADMIN')
    )
  );

-- Create RLS policies for subscriptions
CREATE POLICY "Organization members can view subscriptions"
  ON public.subscriptions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.organization_members
      WHERE organization_members.org_id = subscriptions.org_id
        AND organization_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Org owners can create subscriptions"
  ON public.subscriptions FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.organization_members
      WHERE organization_members.org_id = subscriptions.org_id
        AND organization_members.user_id = auth.uid()
        AND organization_members.role = 'ORG_OWNER'
    )
  );

CREATE POLICY "Org owners can update subscriptions"
  ON public.subscriptions FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.organization_members
      WHERE organization_members.org_id = subscriptions.org_id
        AND organization_members.user_id = auth.uid()
        AND organization_members.role = 'ORG_OWNER'
    )
  );

-- Create RLS policies for licenses
CREATE POLICY "Organization members can view licenses"
  ON public.licenses FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.organization_members
      WHERE organization_members.org_id = licenses.org_id
        AND organization_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Org owners can create licenses"
  ON public.licenses FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.organization_members
      WHERE organization_members.org_id = licenses.org_id
        AND organization_members.user_id = auth.uid()
        AND organization_members.role = 'ORG_OWNER'
    )
  );

CREATE POLICY "Org owners can update licenses"
  ON public.licenses FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.organization_members
      WHERE organization_members.org_id = licenses.org_id
        AND organization_members.user_id = auth.uid()
        AND organization_members.role = 'ORG_OWNER'
    )
  );

-- Create RLS policies for stores
CREATE POLICY "Org members can view org stores"
  ON public.stores FOR SELECT
  USING (
    (org_id IS NULL AND auth.uid() = user_id) OR
    (org_id IS NOT NULL AND is_org_member(auth.uid(), org_id))
  );

CREATE POLICY "Org members can create org stores"
  ON public.stores FOR INSERT
  WITH CHECK (
    (org_id IS NULL AND auth.uid() = user_id) OR
    (org_id IS NOT NULL AND is_org_member(auth.uid(), org_id))
  );

CREATE POLICY "Org members can update org stores"
  ON public.stores FOR UPDATE
  USING (
    (org_id IS NULL AND auth.uid() = user_id) OR
    (org_id IS NOT NULL AND is_org_member(auth.uid(), org_id))
  );

CREATE POLICY "Org admins can delete org stores"
  ON public.stores FOR DELETE
  USING (
    (org_id IS NULL AND auth.uid() = user_id) OR
    (org_id IS NOT NULL AND is_org_admin(auth.uid(), org_id))
  );

-- Create RLS policies for products
CREATE POLICY "Org members can view org products"
  ON public.products FOR SELECT
  USING (
    (org_id IS NULL AND auth.uid() = user_id) OR
    (org_id IS NOT NULL AND is_org_member(auth.uid(), org_id))
  );

CREATE POLICY "Org members can create org products"
  ON public.products FOR INSERT
  WITH CHECK (
    (org_id IS NULL AND auth.uid() = user_id) OR
    (org_id IS NOT NULL AND is_org_member(auth.uid(), org_id))
  );

CREATE POLICY "Org members can update org products"
  ON public.products FOR UPDATE
  USING (
    (org_id IS NULL AND auth.uid() = user_id) OR
    (org_id IS NOT NULL AND is_org_member(auth.uid(), org_id))
  );

CREATE POLICY "Org admins can delete org products"
  ON public.products FOR DELETE
  USING (
    (org_id IS NULL AND auth.uid() = user_id) OR
    (org_id IS NOT NULL AND is_org_admin(auth.uid(), org_id))
  );

-- Create similar RLS policies for other tables (customers, visits, purchases, etc.)
-- All following the same pattern: org members can view/create/update, org admins can delete

-- Customers
CREATE POLICY "Org members can view org customers" ON public.customers FOR SELECT USING ((org_id IS NULL AND auth.uid() = user_id) OR (org_id IS NOT NULL AND is_org_member(auth.uid(), org_id)));
CREATE POLICY "Org members can create org customers" ON public.customers FOR INSERT WITH CHECK ((org_id IS NULL AND auth.uid() = user_id) OR (org_id IS NOT NULL AND is_org_member(auth.uid(), org_id)));
CREATE POLICY "Org members can update org customers" ON public.customers FOR UPDATE USING ((org_id IS NULL AND auth.uid() = user_id) OR (org_id IS NOT NULL AND is_org_member(auth.uid(), org_id)));
CREATE POLICY "Org admins can delete org customers" ON public.customers FOR DELETE USING ((org_id IS NULL AND auth.uid() = user_id) OR (org_id IS NOT NULL AND is_org_admin(auth.uid(), org_id)));

-- Visits
CREATE POLICY "Org members can view org visits" ON public.visits FOR SELECT USING ((org_id IS NULL AND auth.uid() = user_id) OR (org_id IS NOT NULL AND is_org_member(auth.uid(), org_id)));
CREATE POLICY "Org members can create org visits" ON public.visits FOR INSERT WITH CHECK ((org_id IS NULL AND auth.uid() = user_id) OR (org_id IS NOT NULL AND is_org_member(auth.uid(), org_id)));
CREATE POLICY "Org members can update org visits" ON public.visits FOR UPDATE USING ((org_id IS NULL AND auth.uid() = user_id) OR (org_id IS NOT NULL AND is_org_member(auth.uid(), org_id)));
CREATE POLICY "Org admins can delete org visits" ON public.visits FOR DELETE USING ((org_id IS NULL AND auth.uid() = user_id) OR (org_id IS NOT NULL AND is_org_admin(auth.uid(), org_id)));

-- Purchases
CREATE POLICY "Org members can view org purchases" ON public.purchases FOR SELECT USING ((org_id IS NULL AND auth.uid() = user_id) OR (org_id IS NOT NULL AND is_org_member(auth.uid(), org_id)));
CREATE POLICY "Org members can create org purchases" ON public.purchases FOR INSERT WITH CHECK ((org_id IS NULL AND auth.uid() = user_id) OR (org_id IS NOT NULL AND is_org_member(auth.uid(), org_id)));
CREATE POLICY "Org members can update org purchases" ON public.purchases FOR UPDATE USING ((org_id IS NULL AND auth.uid() = user_id) OR (org_id IS NOT NULL AND is_org_member(auth.uid(), org_id)));
CREATE POLICY "Org admins can delete org purchases" ON public.purchases FOR DELETE USING ((org_id IS NULL AND auth.uid() = user_id) OR (org_id IS NOT NULL AND is_org_admin(auth.uid(), org_id)));

-- WiFi Zones
CREATE POLICY "Org members can view org wifi zones" ON public.wifi_zones FOR SELECT USING ((org_id IS NULL AND auth.uid() = user_id) OR (org_id IS NOT NULL AND is_org_member(auth.uid(), org_id)));
CREATE POLICY "Org members can create org wifi zones" ON public.wifi_zones FOR INSERT WITH CHECK ((org_id IS NULL AND auth.uid() = user_id) OR (org_id IS NOT NULL AND is_org_member(auth.uid(), org_id)));
CREATE POLICY "Org members can update org wifi zones" ON public.wifi_zones FOR UPDATE USING ((org_id IS NULL AND auth.uid() = user_id) OR (org_id IS NOT NULL AND is_org_member(auth.uid(), org_id)));
CREATE POLICY "Org admins can delete org wifi zones" ON public.wifi_zones FOR DELETE USING ((org_id IS NULL AND auth.uid() = user_id) OR (org_id IS NOT NULL AND is_org_admin(auth.uid(), org_id)));

-- WiFi Tracking
CREATE POLICY "Org members can view org wifi tracking" ON public.wifi_tracking FOR SELECT USING ((org_id IS NULL AND auth.uid() = user_id) OR (org_id IS NOT NULL AND is_org_member(auth.uid(), org_id)));
CREATE POLICY "Org members can create org wifi tracking" ON public.wifi_tracking FOR INSERT WITH CHECK ((org_id IS NULL AND auth.uid() = user_id) OR (org_id IS NOT NULL AND is_org_member(auth.uid(), org_id)));
CREATE POLICY "Org members can update org wifi tracking" ON public.wifi_tracking FOR UPDATE USING ((org_id IS NULL AND auth.uid() = user_id) OR (org_id IS NOT NULL AND is_org_member(auth.uid(), org_id)));
CREATE POLICY "Org admins can delete org wifi tracking" ON public.wifi_tracking FOR DELETE USING ((org_id IS NULL AND auth.uid() = user_id) OR (org_id IS NOT NULL AND is_org_admin(auth.uid(), org_id)));

-- Scenarios
CREATE POLICY "Org members can view org scenarios" ON public.scenarios FOR SELECT USING ((org_id IS NULL AND auth.uid() = user_id) OR (org_id IS NOT NULL AND is_org_member(auth.uid(), org_id)));
CREATE POLICY "Org members can create org scenarios" ON public.scenarios FOR INSERT WITH CHECK ((org_id IS NULL AND auth.uid() = user_id) OR (org_id IS NOT NULL AND is_org_member(auth.uid(), org_id)));
CREATE POLICY "Org members can update org scenarios" ON public.scenarios FOR UPDATE USING ((org_id IS NULL AND auth.uid() = user_id) OR (org_id IS NOT NULL AND is_org_member(auth.uid(), org_id)));
CREATE POLICY "Org admins can delete org scenarios" ON public.scenarios FOR DELETE USING ((org_id IS NULL AND auth.uid() = user_id) OR (org_id IS NOT NULL AND is_org_admin(auth.uid(), org_id)));

-- User Data Imports
CREATE POLICY "Org members can view org data imports" ON public.user_data_imports FOR SELECT USING ((org_id IS NULL AND auth.uid() = user_id) OR (org_id IS NOT NULL AND is_org_member(auth.uid(), org_id)));
CREATE POLICY "Org members can create org data imports" ON public.user_data_imports FOR INSERT WITH CHECK ((org_id IS NULL AND auth.uid() = user_id) OR (org_id IS NOT NULL AND is_org_member(auth.uid(), org_id)));
CREATE POLICY "Org members can update org data imports" ON public.user_data_imports FOR UPDATE USING ((org_id IS NULL AND auth.uid() = user_id) OR (org_id IS NOT NULL AND is_org_member(auth.uid(), org_id)));
CREATE POLICY "Org admins can delete org data imports" ON public.user_data_imports FOR DELETE USING ((org_id IS NULL AND auth.uid() = user_id) OR (org_id IS NOT NULL AND is_org_admin(auth.uid(), org_id)));

-- Upload Sessions
CREATE POLICY "Org members can view org upload sessions" ON public.upload_sessions FOR SELECT USING ((org_id IS NULL AND auth.uid() = user_id) OR (org_id IS NOT NULL AND is_org_member(auth.uid(), org_id)));
CREATE POLICY "Org members can create org upload sessions" ON public.upload_sessions FOR INSERT WITH CHECK ((org_id IS NULL AND auth.uid() = user_id) OR (org_id IS NOT NULL AND is_org_member(auth.uid(), org_id)));
CREATE POLICY "Org members can update org upload sessions" ON public.upload_sessions FOR UPDATE USING ((org_id IS NULL AND auth.uid() = user_id) OR (org_id IS NOT NULL AND is_org_member(auth.uid(), org_id)));
CREATE POLICY "Org admins can delete org upload sessions" ON public.upload_sessions FOR DELETE USING ((org_id IS NULL AND auth.uid() = user_id) OR (org_id IS NOT NULL AND is_org_admin(auth.uid(), org_id)));

-- Dashboard KPIs
CREATE POLICY "Org members can view org dashboard kpis" ON public.dashboard_kpis FOR SELECT USING ((org_id IS NULL AND auth.uid() = user_id) OR (org_id IS NOT NULL AND is_org_member(auth.uid(), org_id)));
CREATE POLICY "Org members can create org dashboard kpis" ON public.dashboard_kpis FOR INSERT WITH CHECK ((org_id IS NULL AND auth.uid() = user_id) OR (org_id IS NOT NULL AND is_org_member(auth.uid(), org_id)));
CREATE POLICY "Org members can update org dashboard kpis" ON public.dashboard_kpis FOR UPDATE USING ((org_id IS NULL AND auth.uid() = user_id) OR (org_id IS NOT NULL AND is_org_member(auth.uid(), org_id)));
CREATE POLICY "Org admins can delete org dashboard kpis" ON public.dashboard_kpis FOR DELETE USING ((org_id IS NULL AND auth.uid() = user_id) OR (org_id IS NOT NULL AND is_org_admin(auth.uid(), org_id)));

-- AI Recommendations
CREATE POLICY "Org members can view org ai recommendations" ON public.ai_recommendations FOR SELECT USING ((org_id IS NULL AND auth.uid() = user_id) OR (org_id IS NOT NULL AND is_org_member(auth.uid(), org_id)));
CREATE POLICY "Org members can create org ai recommendations" ON public.ai_recommendations FOR INSERT WITH CHECK ((org_id IS NULL AND auth.uid() = user_id) OR (org_id IS NOT NULL AND is_org_member(auth.uid(), org_id)));
CREATE POLICY "Org members can update org ai recommendations" ON public.ai_recommendations FOR UPDATE USING ((org_id IS NULL AND auth.uid() = user_id) OR (org_id IS NOT NULL AND is_org_member(auth.uid(), org_id)));
CREATE POLICY "Org members can delete org ai recommendations" ON public.ai_recommendations FOR DELETE USING ((org_id IS NULL AND auth.uid() = user_id) OR (org_id IS NOT NULL AND is_org_member(auth.uid(), org_id)));

-- Analysis History
CREATE POLICY "Org members can view org analysis history" ON public.analysis_history FOR SELECT USING ((org_id IS NULL AND auth.uid() = user_id) OR (org_id IS NOT NULL AND is_org_member(auth.uid(), org_id)));
CREATE POLICY "Org members can create org analysis history" ON public.analysis_history FOR INSERT WITH CHECK ((org_id IS NULL AND auth.uid() = user_id) OR (org_id IS NOT NULL AND is_org_member(auth.uid(), org_id)));
CREATE POLICY "Org admins can delete org analysis history" ON public.analysis_history FOR DELETE USING ((org_id IS NULL AND auth.uid() = user_id) OR (org_id IS NOT NULL AND is_org_admin(auth.uid(), org_id)));

-- API Connections
CREATE POLICY "Org members can view org api connections" ON public.api_connections FOR SELECT USING ((org_id IS NULL AND auth.uid() = user_id) OR (org_id IS NOT NULL AND is_org_member(auth.uid(), org_id)));
CREATE POLICY "Org admins can create org api connections" ON public.api_connections FOR INSERT WITH CHECK ((org_id IS NULL AND auth.uid() = user_id) OR (org_id IS NOT NULL AND is_org_admin(auth.uid(), org_id)));
CREATE POLICY "Org admins can update org api connections" ON public.api_connections FOR UPDATE USING ((org_id IS NULL AND auth.uid() = user_id) OR (org_id IS NOT NULL AND is_org_admin(auth.uid(), org_id)));
CREATE POLICY "Org admins can delete org api connections" ON public.api_connections FOR DELETE USING ((org_id IS NULL AND auth.uid() = user_id) OR (org_id IS NOT NULL AND is_org_admin(auth.uid(), org_id)));

-- External Data Sources
CREATE POLICY "Org members can view org data sources" ON public.external_data_sources FOR SELECT USING ((org_id IS NULL AND auth.uid() = user_id) OR (org_id IS NOT NULL AND is_org_member(auth.uid(), org_id)));
CREATE POLICY "Org admins can create org data sources" ON public.external_data_sources FOR INSERT WITH CHECK ((org_id IS NULL AND auth.uid() = user_id) OR (org_id IS NOT NULL AND is_org_admin(auth.uid(), org_id)));
CREATE POLICY "Org admins can update org data sources" ON public.external_data_sources FOR UPDATE USING ((org_id IS NULL AND auth.uid() = user_id) OR (org_id IS NOT NULL AND is_org_admin(auth.uid(), org_id)));
CREATE POLICY "Org admins can delete org data sources" ON public.external_data_sources FOR DELETE USING ((org_id IS NULL AND auth.uid() = user_id) OR (org_id IS NOT NULL AND is_org_admin(auth.uid(), org_id)));

-- Data Sync Schedules
CREATE POLICY "Org members can view org sync schedules" ON public.data_sync_schedules FOR SELECT USING ((org_id IS NULL AND auth.uid() = user_id) OR (org_id IS NOT NULL AND is_org_member(auth.uid(), org_id)));
CREATE POLICY "Org admins can create org sync schedules" ON public.data_sync_schedules FOR INSERT WITH CHECK ((org_id IS NULL AND auth.uid() = user_id) OR (org_id IS NOT NULL AND is_org_admin(auth.uid(), org_id)));
CREATE POLICY "Org admins can update org sync schedules" ON public.data_sync_schedules FOR UPDATE USING ((org_id IS NULL AND auth.uid() = user_id) OR (org_id IS NOT NULL AND is_org_admin(auth.uid(), org_id)));
CREATE POLICY "Org admins can delete org sync schedules" ON public.data_sync_schedules FOR DELETE USING ((org_id IS NULL AND auth.uid() = user_id) OR (org_id IS NOT NULL AND is_org_admin(auth.uid(), org_id)));

-- Data Sync Logs
CREATE POLICY "Org members can view org sync logs" ON public.data_sync_logs FOR SELECT USING ((org_id IS NULL AND auth.uid() = user_id) OR (org_id IS NOT NULL AND is_org_member(auth.uid(), org_id)));
CREATE POLICY "Org members can create org sync logs" ON public.data_sync_logs FOR INSERT WITH CHECK ((org_id IS NULL AND auth.uid() = user_id) OR (org_id IS NOT NULL AND is_org_member(auth.uid(), org_id)));

-- Funnel Metrics
CREATE POLICY "Org members can view org funnel metrics" ON public.funnel_metrics FOR SELECT USING ((org_id IS NULL AND auth.uid() = user_id) OR (org_id IS NOT NULL AND is_org_member(auth.uid(), org_id)));
CREATE POLICY "Org members can create org funnel metrics" ON public.funnel_metrics FOR INSERT WITH CHECK ((org_id IS NULL AND auth.uid() = user_id) OR (org_id IS NOT NULL AND is_org_member(auth.uid(), org_id)));
CREATE POLICY "Org members can update org funnel metrics" ON public.funnel_metrics FOR UPDATE USING ((org_id IS NULL AND auth.uid() = user_id) OR (org_id IS NOT NULL AND is_org_member(auth.uid(), org_id)));
CREATE POLICY "Org admins can delete org funnel metrics" ON public.funnel_metrics FOR DELETE USING ((org_id IS NULL AND auth.uid() = user_id) OR (org_id IS NOT NULL AND is_org_admin(auth.uid(), org_id)));

-- Ontology Entity Types
CREATE POLICY "Org members can view org entity types" ON public.ontology_entity_types FOR SELECT USING ((org_id IS NULL AND auth.uid() = user_id) OR (org_id IS NOT NULL AND is_org_member(auth.uid(), org_id)));
CREATE POLICY "Org members can create org entity types" ON public.ontology_entity_types FOR INSERT WITH CHECK ((org_id IS NULL AND auth.uid() = user_id) OR (org_id IS NOT NULL AND is_org_member(auth.uid(), org_id)));
CREATE POLICY "Org members can update org entity types" ON public.ontology_entity_types FOR UPDATE USING ((org_id IS NULL AND auth.uid() = user_id) OR (org_id IS NOT NULL AND is_org_member(auth.uid(), org_id)));
CREATE POLICY "Org admins can delete org entity types" ON public.ontology_entity_types FOR DELETE USING ((org_id IS NULL AND auth.uid() = user_id) OR (org_id IS NOT NULL AND is_org_admin(auth.uid(), org_id)));

-- Ontology Relation Types
CREATE POLICY "Org members can view org relation types" ON public.ontology_relation_types FOR SELECT USING ((org_id IS NULL AND auth.uid() = user_id) OR (org_id IS NOT NULL AND is_org_member(auth.uid(), org_id)));
CREATE POLICY "Org members can create org relation types" ON public.ontology_relation_types FOR INSERT WITH CHECK ((org_id IS NULL AND auth.uid() = user_id) OR (org_id IS NOT NULL AND is_org_member(auth.uid(), org_id)));
CREATE POLICY "Org members can update org relation types" ON public.ontology_relation_types FOR UPDATE USING ((org_id IS NULL AND auth.uid() = user_id) OR (org_id IS NOT NULL AND is_org_member(auth.uid(), org_id)));
CREATE POLICY "Org admins can delete org relation types" ON public.ontology_relation_types FOR DELETE USING ((org_id IS NULL AND auth.uid() = user_id) OR (org_id IS NOT NULL AND is_org_admin(auth.uid(), org_id)));

-- Graph Entities
CREATE POLICY "Org members can view org graph entities" ON public.graph_entities FOR SELECT USING ((org_id IS NULL AND auth.uid() = user_id) OR (org_id IS NOT NULL AND is_org_member(auth.uid(), org_id)));
CREATE POLICY "Org members can create org graph entities" ON public.graph_entities FOR INSERT WITH CHECK ((org_id IS NULL AND auth.uid() = user_id) OR (org_id IS NOT NULL AND is_org_member(auth.uid(), org_id)));
CREATE POLICY "Org members can update org graph entities" ON public.graph_entities FOR UPDATE USING ((org_id IS NULL AND auth.uid() = user_id) OR (org_id IS NOT NULL AND is_org_member(auth.uid(), org_id)));
CREATE POLICY "Org admins can delete org graph entities" ON public.graph_entities FOR DELETE USING ((org_id IS NULL AND auth.uid() = user_id) OR (org_id IS NOT NULL AND is_org_admin(auth.uid(), org_id)));

-- Graph Relations
CREATE POLICY "Org members can view org graph relations" ON public.graph_relations FOR SELECT USING ((org_id IS NULL AND auth.uid() = user_id) OR (org_id IS NOT NULL AND is_org_member(auth.uid(), org_id)));
CREATE POLICY "Org members can create org graph relations" ON public.graph_relations FOR INSERT WITH CHECK ((org_id IS NULL AND auth.uid() = user_id) OR (org_id IS NOT NULL AND is_org_member(auth.uid(), org_id)));
CREATE POLICY "Org members can update org graph relations" ON public.graph_relations FOR UPDATE USING ((org_id IS NULL AND auth.uid() = user_id) OR (org_id IS NOT NULL AND is_org_member(auth.uid(), org_id)));
CREATE POLICY "Org admins can delete org graph relations" ON public.graph_relations FOR DELETE USING ((org_id IS NULL AND auth.uid() = user_id) OR (org_id IS NOT NULL AND is_org_admin(auth.uid(), org_id)));

-- Ontology Schema Versions
CREATE POLICY "Org members can view org schema versions" ON public.ontology_schema_versions FOR SELECT USING ((org_id IS NULL AND auth.uid() = user_id) OR (org_id IS NOT NULL AND is_org_member(auth.uid(), org_id)));
CREATE POLICY "Org members can create org schema versions" ON public.ontology_schema_versions FOR INSERT WITH CHECK ((org_id IS NULL AND auth.uid() = user_id) OR (org_id IS NOT NULL AND is_org_member(auth.uid(), org_id)));

-- Ontology Mapping Cache
CREATE POLICY "Org members can view org mapping cache" ON public.ontology_mapping_cache FOR SELECT USING ((org_id IS NULL AND auth.uid() = user_id) OR (org_id IS NOT NULL AND is_org_member(auth.uid(), org_id)));
CREATE POLICY "Org members can create org mapping cache" ON public.ontology_mapping_cache FOR INSERT WITH CHECK ((org_id IS NULL AND auth.uid() = user_id) OR (org_id IS NOT NULL AND is_org_member(auth.uid(), org_id)));
CREATE POLICY "Org members can update org mapping cache" ON public.ontology_mapping_cache FOR UPDATE USING ((org_id IS NULL AND auth.uid() = user_id) OR (org_id IS NOT NULL AND is_org_member(auth.uid(), org_id)));
CREATE POLICY "Org admins can delete org mapping cache" ON public.ontology_mapping_cache FOR DELETE USING ((org_id IS NULL AND auth.uid() = user_id) OR (org_id IS NOT NULL AND is_org_admin(auth.uid(), org_id)));

-- HQ Store Master
CREATE POLICY "Org members can view org HQ store master" ON public.hq_store_master FOR SELECT USING ((org_id IS NULL AND auth.uid() = user_id) OR (org_id IS NOT NULL AND is_org_member(auth.uid(), org_id)));
CREATE POLICY "Org admins can create org HQ store master" ON public.hq_store_master FOR INSERT WITH CHECK ((org_id IS NULL AND auth.uid() = user_id) OR (org_id IS NOT NULL AND is_org_admin(auth.uid(), org_id)));
CREATE POLICY "Org admins can update org HQ store master" ON public.hq_store_master FOR UPDATE USING ((org_id IS NULL AND auth.uid() = user_id) OR (org_id IS NOT NULL AND is_org_admin(auth.uid(), org_id)));
CREATE POLICY "Org admins can delete org HQ store master" ON public.hq_store_master FOR DELETE USING ((org_id IS NULL AND auth.uid() = user_id) OR (org_id IS NOT NULL AND is_org_admin(auth.uid(), org_id)));

-- HQ Sync Logs
CREATE POLICY "Org members can view org sync logs" ON public.hq_sync_logs FOR SELECT USING ((org_id IS NULL AND auth.uid() = user_id) OR (org_id IS NOT NULL AND is_org_member(auth.uid(), org_id)));
CREATE POLICY "Org members can create org sync logs" ON public.hq_sync_logs FOR INSERT WITH CHECK ((org_id IS NULL AND auth.uid() = user_id) OR (org_id IS NOT NULL AND is_org_member(auth.uid(), org_id)));

-- Inventory Levels
CREATE POLICY "Org members can view org inventory levels" ON public.inventory_levels FOR SELECT USING ((org_id IS NULL AND auth.uid() = user_id) OR (org_id IS NOT NULL AND is_org_member(auth.uid(), org_id)));
CREATE POLICY "Org members can create org inventory levels" ON public.inventory_levels FOR INSERT WITH CHECK ((org_id IS NULL AND auth.uid() = user_id) OR (org_id IS NOT NULL AND is_org_member(auth.uid(), org_id)));
CREATE POLICY "Org members can update org inventory levels" ON public.inventory_levels FOR UPDATE USING ((org_id IS NULL AND auth.uid() = user_id) OR (org_id IS NOT NULL AND is_org_member(auth.uid(), org_id)));
CREATE POLICY "Org admins can delete org inventory levels" ON public.inventory_levels FOR DELETE USING ((org_id IS NULL AND auth.uid() = user_id) OR (org_id IS NOT NULL AND is_org_admin(auth.uid(), org_id)));

-- Auto Order Suggestions
CREATE POLICY "Org members can view org order suggestions" ON public.auto_order_suggestions FOR SELECT USING ((org_id IS NULL AND auth.uid() = user_id) OR (org_id IS NOT NULL AND is_org_member(auth.uid(), org_id)));
CREATE POLICY "Org members can create org order suggestions" ON public.auto_order_suggestions FOR INSERT WITH CHECK ((org_id IS NULL AND auth.uid() = user_id) OR (org_id IS NOT NULL AND is_org_member(auth.uid(), org_id)));
CREATE POLICY "Org members can update org order suggestions" ON public.auto_order_suggestions FOR UPDATE USING ((org_id IS NULL AND auth.uid() = user_id) OR (org_id IS NOT NULL AND is_org_member(auth.uid(), org_id)));
CREATE POLICY "Org admins can delete org order suggestions" ON public.auto_order_suggestions FOR DELETE USING ((org_id IS NULL AND auth.uid() = user_id) OR (org_id IS NOT NULL AND is_org_admin(auth.uid(), org_id)));

-- NeuralSense Devices
CREATE POLICY "Org members can view org devices" ON public.neuralsense_devices FOR SELECT USING ((org_id IS NULL AND auth.uid() = user_id) OR (org_id IS NOT NULL AND is_org_member(auth.uid(), org_id)));
CREATE POLICY "Org members can create org devices" ON public.neuralsense_devices FOR INSERT WITH CHECK ((org_id IS NULL AND auth.uid() = user_id) OR (org_id IS NOT NULL AND is_org_member(auth.uid(), org_id)));
CREATE POLICY "Org members can update org devices" ON public.neuralsense_devices FOR UPDATE USING ((org_id IS NULL AND auth.uid() = user_id) OR (org_id IS NOT NULL AND is_org_member(auth.uid(), org_id)));
CREATE POLICY "Org admins can delete org devices" ON public.neuralsense_devices FOR DELETE USING ((org_id IS NULL AND auth.uid() = user_id) OR (org_id IS NOT NULL AND is_org_admin(auth.uid(), org_id)));

-- Notification Settings
CREATE POLICY "Org members can view org notification settings" ON public.notification_settings FOR SELECT USING ((org_id IS NULL AND auth.uid() = user_id) OR (org_id IS NOT NULL AND is_org_member(auth.uid(), org_id)));
CREATE POLICY "Org members can create org notification settings" ON public.notification_settings FOR INSERT WITH CHECK ((org_id IS NULL AND auth.uid() = user_id) OR (org_id IS NOT NULL AND is_org_member(auth.uid(), org_id)));
CREATE POLICY "Org members can update org notification settings" ON public.notification_settings FOR UPDATE USING ((org_id IS NULL AND auth.uid() = user_id) OR (org_id IS NOT NULL AND is_org_member(auth.uid(), org_id)));

-- Holidays Events
CREATE POLICY "Org members can view org holidays/events" ON public.holidays_events FOR SELECT USING ((org_id IS NULL AND auth.uid() = user_id) OR (org_id IS NOT NULL AND is_org_member(auth.uid(), org_id)));
CREATE POLICY "Org members can create org holidays/events" ON public.holidays_events FOR INSERT WITH CHECK ((org_id IS NULL AND auth.uid() = user_id) OR (org_id IS NOT NULL AND is_org_member(auth.uid(), org_id)));
CREATE POLICY "Org members can update org holidays/events" ON public.holidays_events FOR UPDATE USING ((org_id IS NULL AND auth.uid() = user_id) OR (org_id IS NOT NULL AND is_org_member(auth.uid(), org_id)));
CREATE POLICY "Org admins can delete org holidays/events" ON public.holidays_events FOR DELETE USING ((org_id IS NULL AND auth.uid() = user_id) OR (org_id IS NOT NULL AND is_org_admin(auth.uid(), org_id)));

-- Economic Indicators
CREATE POLICY "Org members can view org economic indicators" ON public.economic_indicators FOR SELECT USING ((org_id IS NULL AND auth.uid() = user_id) OR (org_id IS NOT NULL AND is_org_member(auth.uid(), org_id)));
CREATE POLICY "Org members can create org economic indicators" ON public.economic_indicators FOR INSERT WITH CHECK ((org_id IS NULL AND auth.uid() = user_id) OR (org_id IS NOT NULL AND is_org_member(auth.uid(), org_id)));
CREATE POLICY "Org members can update org economic indicators" ON public.economic_indicators FOR UPDATE USING ((org_id IS NULL AND auth.uid() = user_id) OR (org_id IS NOT NULL AND is_org_member(auth.uid(), org_id)));
CREATE POLICY "Org admins can delete org economic indicators" ON public.economic_indicators FOR DELETE USING ((org_id IS NULL AND auth.uid() = user_id) OR (org_id IS NOT NULL AND is_org_admin(auth.uid(), org_id)));

-- AI Scene Analysis
CREATE POLICY "Users can view their store scene analysis" ON public.ai_scene_analysis FOR SELECT USING (auth.uid() = user_id AND (store_id IS NULL OR EXISTS (SELECT 1 FROM stores WHERE stores.id = ai_scene_analysis.store_id AND stores.user_id = auth.uid())));
CREATE POLICY "Users can create their store scene analysis" ON public.ai_scene_analysis FOR INSERT WITH CHECK (auth.uid() = user_id AND (store_id IS NULL OR EXISTS (SELECT 1 FROM stores WHERE stores.id = ai_scene_analysis.store_id AND stores.user_id = auth.uid())));
CREATE POLICY "Users can update their store scene analysis" ON public.ai_scene_analysis FOR UPDATE USING (auth.uid() = user_id AND (store_id IS NULL OR EXISTS (SELECT 1 FROM stores WHERE stores.id = ai_scene_analysis.store_id AND stores.user_id = auth.uid())));
CREATE POLICY "Users can delete their store scene analysis" ON public.ai_scene_analysis FOR DELETE USING (auth.uid() = user_id AND (store_id IS NULL OR EXISTS (SELECT 1 FROM stores WHERE stores.id = ai_scene_analysis.store_id AND stores.user_id = auth.uid())));

-- NEURALTWIN_ADMIN 역할을 가진 사용자는 특정 organization에 속하지 않으므로 org_id를 nullable로 변경
ALTER TABLE public.organization_members 
ALTER COLUMN org_id DROP NOT NULL;

-- 기존 제약조건 확인 및 조정
COMMENT ON COLUMN public.organization_members.org_id IS 'Organization ID (nullable for NEURALTWIN_ADMIN role)';

-- ============================================================================
-- 마이그레이션 완료
-- ============================================================================
