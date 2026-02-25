CREATE EXTENSION IF NOT EXISTS "pg_graphql";
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "plpgsql";
CREATE EXTENSION IF NOT EXISTS "supabase_vault";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
--
-- PostgreSQL database dump
--


-- Dumped from database version 17.6
-- Dumped by pg_dump version 17.7

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: public; Type: SCHEMA; Schema: -; Owner: -
--



--
-- Name: app_role; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.app_role AS ENUM (
    'admin',
    'manager',
    'analyst',
    'viewer',
    'ORG_OWNER',
    'ORG_ADMIN',
    'ORG_MEMBER',
    'NEURALTWIN_ADMIN'
);


--
-- Name: create_store_storage_folders(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.create_store_storage_folders() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
  -- 스토리지 폴더 구조는 애플리케이션 레벨에서 관리
  -- 이 트리거는 로깅 목적
  RAISE NOTICE 'Store created: % (ID: %). Storage path: %/%', NEW.store_name, NEW.id, NEW.user_id, NEW.id;
  RETURN NEW;
END;
$$;


--
-- Name: get_user_org_id(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_user_org_id(_user_id uuid) RETURNS uuid
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  SELECT org_id
  FROM public.organization_members
  WHERE user_id = _user_id
  LIMIT 1
$$;


--
-- Name: graph_n_hop_query(uuid, uuid, integer); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.graph_n_hop_query(p_user_id uuid, p_start_entity_id uuid, p_max_hops integer DEFAULT 3) RETURNS jsonb
    LANGUAGE plpgsql SECURITY DEFINER
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


--
-- Name: graph_shortest_path(uuid, uuid, uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.graph_shortest_path(p_user_id uuid, p_start_id uuid, p_end_id uuid) RETURNS jsonb
    LANGUAGE plpgsql SECURITY DEFINER
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


--
-- Name: handle_new_user(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.handle_new_user() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.email));
  RETURN NEW;
END;
$$;


--
-- Name: has_role(uuid, public.app_role); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.has_role(_user_id uuid, _role public.app_role) RETURNS boolean
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;


--
-- Name: is_admin(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.is_admin(_user_id uuid) RETURNS boolean
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  SELECT public.has_role(_user_id, 'admin')
$$;


--
-- Name: is_neuraltwin_admin(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.is_neuraltwin_admin(_user_id uuid) RETURNS boolean
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.organization_members
    WHERE user_id = _user_id
      AND role = 'NEURALTWIN_ADMIN'
  )
$$;


--
-- Name: is_org_admin(uuid, uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.is_org_admin(_user_id uuid, _org_id uuid) RETURNS boolean
    LANGUAGE sql STABLE SECURITY DEFINER
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


--
-- Name: is_org_member(uuid, uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.is_org_member(_user_id uuid, _org_id uuid) RETURNS boolean
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.organization_members
    WHERE user_id = _user_id
      AND org_id = _org_id
  )
$$;


--
-- Name: is_org_owner(uuid, uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.is_org_owner(_user_id uuid, _org_id uuid) RETURNS boolean
    LANGUAGE sql STABLE SECURITY DEFINER
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


--
-- Name: migrate_user_to_organization(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.migrate_user_to_organization(p_user_id uuid) RETURNS uuid
    LANGUAGE plpgsql SECURITY DEFINER
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

    -- Backfill org_id for all user's data tables (removed customers, visits, purchases)
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
    UPDATE organization_settings SET org_id = v_org_id WHERE user_id = p_user_id AND org_id IS NULL;
    UPDATE auto_order_suggestions SET org_id = v_org_id WHERE user_id = p_user_id AND org_id IS NULL;
    UPDATE economic_indicators SET org_id = v_org_id WHERE user_id = p_user_id AND org_id IS NULL;
  END IF;

  RETURN v_org_id;
END;
$$;


--
-- Name: update_ai_scene_analysis_updated_at(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_ai_scene_analysis_updated_at() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;


--
-- Name: update_classification_patterns_updated_at(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_classification_patterns_updated_at() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;


--
-- Name: update_ontology_updated_at(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_ontology_updated_at() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;


--
-- Name: update_updated_at_column(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_updated_at_column() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;


SET default_table_access_method = heap;

--
-- Name: ai_recommendations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.ai_recommendations (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    store_id uuid,
    recommendation_type text NOT NULL,
    priority text NOT NULL,
    title text NOT NULL,
    description text NOT NULL,
    action_category text,
    expected_impact jsonb,
    data_source text,
    evidence jsonb,
    status text DEFAULT 'pending'::text,
    is_displayed boolean DEFAULT true,
    displayed_at timestamp with time zone,
    dismissed_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    org_id uuid
);


--
-- Name: ai_scene_analysis; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.ai_scene_analysis (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    analysis_type text NOT NULL,
    scene_data jsonb NOT NULL,
    insights jsonb NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    store_id uuid,
    org_id uuid
);


--
-- Name: analysis_history; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.analysis_history (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    analysis_type text NOT NULL,
    input_data jsonb NOT NULL,
    result text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    store_id uuid,
    org_id uuid
);


--
-- Name: api_connections; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.api_connections (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    name text NOT NULL,
    type text NOT NULL,
    url text NOT NULL,
    method text DEFAULT 'GET'::text,
    headers jsonb DEFAULT '{}'::jsonb,
    auth_type text DEFAULT 'none'::text,
    auth_value text,
    is_active boolean DEFAULT true,
    last_sync timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    org_id uuid,
    CONSTRAINT api_connections_auth_type_check CHECK ((auth_type = ANY (ARRAY['none'::text, 'api_key'::text, 'bearer'::text, 'basic'::text]))),
    CONSTRAINT api_connections_type_check CHECK ((type = ANY (ARRAY['rest'::text, 'graphql'::text, 'webhook'::text])))
);


--
-- Name: auto_order_suggestions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.auto_order_suggestions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    product_id uuid NOT NULL,
    current_stock integer NOT NULL,
    optimal_stock integer NOT NULL,
    suggested_order_quantity integer NOT NULL,
    urgency_level text NOT NULL,
    estimated_stockout_date timestamp with time zone,
    potential_revenue_loss numeric(10,2) DEFAULT 0,
    status text DEFAULT 'pending'::text NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    org_id uuid,
    CONSTRAINT auto_order_suggestions_status_check CHECK ((status = ANY (ARRAY['pending'::text, 'approved'::text, 'rejected'::text, 'ordered'::text]))),
    CONSTRAINT auto_order_suggestions_urgency_level_check CHECK ((urgency_level = ANY (ARRAY['low'::text, 'medium'::text, 'high'::text, 'critical'::text])))
);


--
-- Name: dashboard_kpis; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.dashboard_kpis (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    store_id uuid,
    date date NOT NULL,
    total_revenue numeric(15,2) DEFAULT 0,
    total_visits integer DEFAULT 0,
    total_purchases integer DEFAULT 0,
    conversion_rate numeric(5,2) DEFAULT 0,
    sales_per_sqm numeric(10,2) DEFAULT 0,
    labor_hours numeric(10,2) DEFAULT 0,
    funnel_entry integer DEFAULT 0,
    funnel_browse integer DEFAULT 0,
    funnel_fitting integer DEFAULT 0,
    funnel_purchase integer DEFAULT 0,
    funnel_return integer DEFAULT 0,
    weather_condition text,
    is_holiday boolean DEFAULT false,
    special_event text,
    consumer_sentiment_index numeric(5,2),
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    org_id uuid
);


--
-- Name: data_sync_logs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.data_sync_logs (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    schedule_id uuid NOT NULL,
    started_at timestamp with time zone DEFAULT now() NOT NULL,
    completed_at timestamp with time zone,
    status text NOT NULL,
    records_synced integer DEFAULT 0,
    error_message text,
    metadata jsonb DEFAULT '{}'::jsonb,
    org_id uuid
);


--
-- Name: data_sync_schedules; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.data_sync_schedules (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
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
    org_id uuid
);


--
-- Name: economic_indicators; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.economic_indicators (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    date date NOT NULL,
    region text,
    indicator_type text NOT NULL,
    indicator_value numeric NOT NULL,
    unit text,
    source text,
    metadata jsonb DEFAULT '{}'::jsonb,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    org_id uuid
);


--
-- Name: external_data_sources; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.external_data_sources (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    name text NOT NULL,
    source_type text NOT NULL,
    api_url text,
    api_key_encrypted text,
    description text,
    is_active boolean DEFAULT true NOT NULL,
    metadata jsonb DEFAULT '{}'::jsonb,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    org_id uuid
);


--
-- Name: funnel_metrics; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.funnel_metrics (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    store_id uuid,
    date date NOT NULL,
    hour integer,
    stage text NOT NULL,
    count integer NOT NULL,
    duration_seconds integer,
    customer_segment text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    org_id uuid
);


--
-- Name: graph_entities; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.graph_entities (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    entity_type_id uuid NOT NULL,
    label text NOT NULL,
    properties jsonb DEFAULT '{}'::jsonb,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    model_3d_position jsonb DEFAULT '{"x": 0, "y": 0, "z": 0}'::jsonb,
    model_3d_rotation jsonb DEFAULT '{"x": 0, "y": 0, "z": 0}'::jsonb,
    model_3d_scale jsonb DEFAULT '{"x": 1, "y": 1, "z": 1}'::jsonb,
    store_id uuid,
    org_id uuid
);

ALTER TABLE ONLY public.graph_entities REPLICA IDENTITY FULL;


--
-- Name: graph_relations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.graph_relations (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    relation_type_id uuid NOT NULL,
    source_entity_id uuid NOT NULL,
    target_entity_id uuid NOT NULL,
    properties jsonb DEFAULT '{}'::jsonb,
    weight double precision DEFAULT 1.0,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    store_id uuid,
    org_id uuid
);

ALTER TABLE ONLY public.graph_relations REPLICA IDENTITY FULL;


--
-- Name: holidays_events; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.holidays_events (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    store_id uuid,
    date date NOT NULL,
    event_type text NOT NULL,
    event_name text NOT NULL,
    impact_level text,
    description text,
    metadata jsonb DEFAULT '{}'::jsonb,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    org_id uuid
);


--
-- Name: hq_store_master; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.hq_store_master (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    hq_store_code text NOT NULL,
    hq_store_name text NOT NULL,
    store_format text,
    region text,
    district text,
    address text,
    phone text,
    email text,
    manager_name text,
    opening_date date,
    area_sqm numeric,
    status text DEFAULT 'active'::text,
    external_system_id text,
    external_system_name text,
    metadata jsonb DEFAULT '{}'::jsonb,
    last_synced_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    org_id uuid
);


--
-- Name: hq_sync_logs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.hq_sync_logs (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    sync_type text NOT NULL,
    status text NOT NULL,
    started_at timestamp with time zone DEFAULT now() NOT NULL,
    completed_at timestamp with time zone,
    records_processed integer DEFAULT 0,
    records_synced integer DEFAULT 0,
    records_failed integer DEFAULT 0,
    error_message text,
    metadata jsonb DEFAULT '{}'::jsonb,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    org_id uuid
);


--
-- Name: inventory_levels; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.inventory_levels (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    product_id uuid NOT NULL,
    current_stock integer DEFAULT 0 NOT NULL,
    optimal_stock integer NOT NULL,
    minimum_stock integer NOT NULL,
    weekly_demand integer DEFAULT 0 NOT NULL,
    last_updated timestamp with time zone DEFAULT now(),
    created_at timestamp with time zone DEFAULT now(),
    org_id uuid
);


--
-- Name: license_management; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.license_management (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    plan_type text NOT NULL,
    max_stores integer DEFAULT 1 NOT NULL,
    max_hq_users integer DEFAULT 1 NOT NULL,
    storage_limit_gb integer DEFAULT 5 NOT NULL,
    api_calls_limit integer DEFAULT 10000 NOT NULL,
    current_stores integer DEFAULT 0 NOT NULL,
    current_hq_users integer DEFAULT 1 NOT NULL,
    usage_storage_gb numeric(10,2) DEFAULT 0,
    usage_api_calls integer DEFAULT 0,
    billing_cycle_start date DEFAULT CURRENT_DATE NOT NULL,
    billing_cycle_end date DEFAULT (CURRENT_DATE + '1 mon'::interval) NOT NULL,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    org_id uuid,
    CONSTRAINT license_management_plan_type_check CHECK ((plan_type = ANY (ARRAY['free'::text, 'starter'::text, 'professional'::text, 'enterprise'::text])))
);


--
-- Name: licenses; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.licenses (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    org_id uuid NOT NULL,
    license_type text NOT NULL,
    effective_date date NOT NULL,
    expiry_date date,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    metadata jsonb DEFAULT '{}'::jsonb
);


--
-- Name: neuralsense_devices; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.neuralsense_devices (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    device_name text NOT NULL,
    device_id text NOT NULL,
    location text,
    status text DEFAULT 'offline'::text NOT NULL,
    raspberry_pi_model text,
    ip_address text,
    mac_address text,
    last_seen timestamp with time zone,
    wifi_probe_enabled boolean DEFAULT true,
    probe_interval_seconds integer DEFAULT 5,
    probe_range_meters integer DEFAULT 50,
    metadata jsonb DEFAULT '{}'::jsonb,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    org_id uuid,
    CONSTRAINT neuralsense_devices_status_check CHECK ((status = ANY (ARRAY['online'::text, 'offline'::text, 'error'::text])))
);


--
-- Name: notification_settings; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.notification_settings (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    email_enabled boolean DEFAULT true,
    slack_enabled boolean DEFAULT false,
    slack_webhook_url text,
    notification_types jsonb DEFAULT '["stockout", "anomaly", "milestone"]'::jsonb,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    org_id uuid
);


--
-- Name: ontology_entity_types; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.ontology_entity_types (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    name text NOT NULL,
    label text NOT NULL,
    description text,
    color text DEFAULT '#3b82f6'::text,
    icon text,
    properties jsonb DEFAULT '[]'::jsonb,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    model_3d_url text,
    model_3d_dimensions jsonb DEFAULT '{"depth": 1, "width": 1, "height": 1}'::jsonb,
    model_3d_type text,
    model_3d_metadata jsonb DEFAULT '{}'::jsonb,
    org_id uuid,
    CONSTRAINT ontology_entity_types_model_3d_type_check CHECK (((model_3d_type IS NULL) OR (model_3d_type = ANY (ARRAY['space'::text, 'zone'::text, 'furniture'::text, 'structure'::text, 'room'::text, 'device'::text, 'product'::text, 'decoration'::text, 'lighting'::text]))))
);

ALTER TABLE ONLY public.ontology_entity_types REPLICA IDENTITY FULL;


--
-- Name: ontology_mapping_cache; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.ontology_mapping_cache (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    data_type text NOT NULL,
    file_name_pattern text NOT NULL,
    entity_mappings jsonb NOT NULL,
    relation_mappings jsonb NOT NULL,
    confidence_score numeric DEFAULT 0,
    usage_count integer DEFAULT 0,
    last_used_at timestamp with time zone DEFAULT now(),
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    org_id uuid
);


--
-- Name: ontology_relation_types; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.ontology_relation_types (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    name text NOT NULL,
    label text NOT NULL,
    description text,
    source_entity_type text NOT NULL,
    target_entity_type text NOT NULL,
    directionality text DEFAULT 'directed'::text,
    properties jsonb DEFAULT '[]'::jsonb,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    org_id uuid,
    CONSTRAINT ontology_relation_types_directionality_check CHECK ((directionality = ANY (ARRAY['directed'::text, 'undirected'::text])))
);


--
-- Name: ontology_schema_versions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.ontology_schema_versions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    version_number integer NOT NULL,
    schema_data jsonb NOT NULL,
    description text,
    created_at timestamp with time zone DEFAULT now(),
    org_id uuid
);


--
-- Name: organization_members; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.organization_members (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    org_id uuid,
    user_id uuid NOT NULL,
    role public.app_role DEFAULT 'ORG_MEMBER'::public.app_role NOT NULL,
    permissions jsonb DEFAULT '[]'::jsonb,
    joined_at timestamp with time zone DEFAULT now() NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: organization_settings; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.organization_settings (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    timezone text DEFAULT 'Asia/Seoul'::text NOT NULL,
    currency text DEFAULT 'KRW'::text NOT NULL,
    default_kpi_set jsonb DEFAULT '["totalVisits", "totalRevenue", "conversionRate"]'::jsonb,
    logo_url text,
    brand_color text DEFAULT '#1B6BFF'::text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    org_id uuid
);


--
-- Name: organizations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.organizations (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    org_name text NOT NULL,
    industry text,
    created_by uuid,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    metadata jsonb DEFAULT '{}'::jsonb
);


--
-- Name: products; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.products (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    name text NOT NULL,
    sku text NOT NULL,
    category text,
    cost_price numeric(10,2) NOT NULL,
    selling_price numeric(10,2) NOT NULL,
    supplier text,
    lead_time_days integer DEFAULT 7,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    org_id uuid
);


--
-- Name: profiles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.profiles (
    id uuid NOT NULL,
    display_name text,
    avatar_url text,
    phone text,
    job_title text,
    department text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: regional_data; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.regional_data (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    store_id uuid,
    date date NOT NULL,
    data_type text NOT NULL,
    value numeric NOT NULL,
    comparison_value numeric,
    unit text,
    metadata jsonb DEFAULT '{}'::jsonb,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    org_id uuid
);


--
-- Name: report_schedules; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.report_schedules (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    report_name text NOT NULL,
    frequency text NOT NULL,
    day_of_week integer,
    day_of_month integer,
    time_of_day time without time zone DEFAULT '09:00:00'::time without time zone NOT NULL,
    recipients jsonb DEFAULT '[]'::jsonb NOT NULL,
    report_type text NOT NULL,
    is_enabled boolean DEFAULT true,
    last_sent_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    org_id uuid,
    CONSTRAINT report_schedules_day_of_month_check CHECK (((day_of_month >= 1) AND (day_of_month <= 31))),
    CONSTRAINT report_schedules_day_of_week_check CHECK (((day_of_week >= 0) AND (day_of_week <= 6))),
    CONSTRAINT report_schedules_frequency_check CHECK ((frequency = ANY (ARRAY['daily'::text, 'weekly'::text, 'monthly'::text])))
);


--
-- Name: scenario_comparisons; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.scenario_comparisons (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    name text NOT NULL,
    scenario_ids uuid[] NOT NULL,
    comparison_type text DEFAULT 'ab_test'::text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    org_id uuid
);


--
-- Name: scenarios; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.scenarios (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    store_id uuid,
    scenario_type text NOT NULL,
    name text NOT NULL,
    description text,
    params jsonb DEFAULT '{}'::jsonb NOT NULL,
    baseline_kpi jsonb DEFAULT '{}'::jsonb,
    predicted_kpi jsonb DEFAULT '{}'::jsonb,
    confidence_score numeric,
    ai_insights text,
    status text DEFAULT 'draft'::text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    org_id uuid,
    CONSTRAINT scenarios_confidence_score_check CHECK (((confidence_score >= (0)::numeric) AND (confidence_score <= (100)::numeric))),
    CONSTRAINT scenarios_scenario_type_check CHECK ((scenario_type = ANY (ARRAY['layout'::text, 'pricing'::text, 'inventory'::text, 'demand'::text, 'recommendation'::text, 'staffing'::text, 'promotion'::text]))),
    CONSTRAINT scenarios_status_check CHECK ((status = ANY (ARRAY['draft'::text, 'running'::text, 'completed'::text, 'archived'::text])))
);


--
-- Name: simulation_results; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.simulation_results (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    scenario_id uuid,
    result_type text NOT NULL,
    result_data jsonb DEFAULT '{}'::jsonb NOT NULL,
    metadata jsonb DEFAULT '{}'::jsonb,
    created_at timestamp with time zone DEFAULT now(),
    org_id uuid
);


--
-- Name: store_mappings; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.store_mappings (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    hq_store_id uuid NOT NULL,
    local_store_id uuid NOT NULL,
    mapping_status text DEFAULT 'active'::text,
    sync_enabled boolean DEFAULT true,
    last_synced_at timestamp with time zone,
    sync_direction text DEFAULT 'hq_to_local'::text,
    metadata jsonb DEFAULT '{}'::jsonb,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    org_id uuid
);


--
-- Name: store_scenes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.store_scenes (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    store_id uuid,
    name text DEFAULT 'Default Scene'::text NOT NULL,
    recipe_data jsonb NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    org_id uuid
);


--
-- Name: stores; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.stores (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    store_name text NOT NULL,
    store_code text NOT NULL,
    address text,
    manager_name text,
    phone text,
    email text,
    metadata jsonb DEFAULT '{}'::jsonb,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    org_id uuid,
    status text DEFAULT 'active'::text,
    region text,
    district text,
    area_sqm numeric,
    opening_date date,
    store_format text,
    hq_store_code text
);


--
-- Name: subscriptions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.subscriptions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    org_id uuid NOT NULL,
    plan text NOT NULL,
    status text DEFAULT 'active'::text NOT NULL,
    store_quota integer DEFAULT 1 NOT NULL,
    hq_seat_quota integer DEFAULT 1 NOT NULL,
    billing_cycle_start date NOT NULL,
    billing_cycle_end date NOT NULL,
    auto_renew boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    metadata jsonb DEFAULT '{}'::jsonb
);


--
-- Name: upload_sessions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.upload_sessions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    store_id uuid,
    total_files integer DEFAULT 0 NOT NULL,
    completed_files integer DEFAULT 0 NOT NULL,
    failed_files integer DEFAULT 0 NOT NULL,
    status text DEFAULT 'active'::text,
    started_at timestamp with time zone DEFAULT now(),
    completed_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: user_classification_patterns; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_classification_patterns (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    pattern_type text NOT NULL,
    pattern_value text NOT NULL,
    classified_as text NOT NULL,
    confidence double precision DEFAULT 1.0 NOT NULL,
    use_count integer DEFAULT 1 NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: user_data_imports; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_data_imports (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    file_name text NOT NULL,
    file_type text NOT NULL,
    data_type text NOT NULL,
    raw_data jsonb NOT NULL,
    row_count integer NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    sheet_name text,
    store_id uuid,
    file_path text,
    status text DEFAULT 'pending'::text,
    progress jsonb DEFAULT '{}'::jsonb,
    error_details text,
    processing_started_at timestamp with time zone,
    processing_completed_at timestamp with time zone,
    can_pause boolean DEFAULT false,
    can_resume boolean DEFAULT false,
    session_id uuid,
    org_id uuid
);

ALTER TABLE ONLY public.user_data_imports REPLICA IDENTITY FULL;


--
-- Name: user_roles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_roles (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    role public.app_role DEFAULT 'viewer'::public.app_role NOT NULL,
    assigned_by uuid,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: weather_data; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.weather_data (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    store_id uuid,
    date date NOT NULL,
    hour integer,
    temperature numeric,
    weather_condition text,
    precipitation numeric,
    humidity numeric,
    wind_speed numeric,
    metadata jsonb DEFAULT '{}'::jsonb,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: wifi_heatmap_cache; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.wifi_heatmap_cache (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid DEFAULT auth.uid() NOT NULL,
    store_id uuid,
    date date NOT NULL,
    hour integer NOT NULL,
    grid_x double precision NOT NULL,
    grid_z double precision NOT NULL,
    visit_count integer DEFAULT 0 NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT wifi_heatmap_cache_hour_check CHECK (((hour >= 0) AND (hour < 24)))
);


--
-- Name: wifi_probe_data; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.wifi_probe_data (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    device_id uuid NOT NULL,
    user_id uuid NOT NULL,
    mac_address text NOT NULL,
    signal_strength integer,
    "timestamp" timestamp with time zone DEFAULT now() NOT NULL,
    location_zone text,
    device_type text,
    metadata jsonb DEFAULT '{}'::jsonb,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: wifi_raw_signals; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.wifi_raw_signals (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid DEFAULT auth.uid() NOT NULL,
    store_id uuid,
    "timestamp" timestamp with time zone NOT NULL,
    mac_address text NOT NULL,
    sensor_id text NOT NULL,
    rssi integer NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: wifi_tracking; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.wifi_tracking (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid DEFAULT auth.uid() NOT NULL,
    store_id uuid,
    "timestamp" timestamp with time zone NOT NULL,
    session_id text NOT NULL,
    x double precision NOT NULL,
    z double precision NOT NULL,
    accuracy double precision,
    status text,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: wifi_zones; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.wifi_zones (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid DEFAULT auth.uid() NOT NULL,
    store_id uuid,
    zone_id integer NOT NULL,
    x double precision NOT NULL,
    y double precision NOT NULL,
    z double precision DEFAULT 0,
    metadata jsonb DEFAULT '{}'::jsonb,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: ai_recommendations ai_recommendations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ai_recommendations
    ADD CONSTRAINT ai_recommendations_pkey PRIMARY KEY (id);


--
-- Name: ai_scene_analysis ai_scene_analysis_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ai_scene_analysis
    ADD CONSTRAINT ai_scene_analysis_pkey PRIMARY KEY (id);


--
-- Name: analysis_history analysis_history_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.analysis_history
    ADD CONSTRAINT analysis_history_pkey PRIMARY KEY (id);


--
-- Name: api_connections api_connections_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.api_connections
    ADD CONSTRAINT api_connections_pkey PRIMARY KEY (id);


--
-- Name: auto_order_suggestions auto_order_suggestions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.auto_order_suggestions
    ADD CONSTRAINT auto_order_suggestions_pkey PRIMARY KEY (id);


--
-- Name: dashboard_kpis dashboard_kpis_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.dashboard_kpis
    ADD CONSTRAINT dashboard_kpis_pkey PRIMARY KEY (id);


--
-- Name: data_sync_logs data_sync_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.data_sync_logs
    ADD CONSTRAINT data_sync_logs_pkey PRIMARY KEY (id);


--
-- Name: data_sync_schedules data_sync_schedules_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.data_sync_schedules
    ADD CONSTRAINT data_sync_schedules_pkey PRIMARY KEY (id);


--
-- Name: economic_indicators economic_indicators_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.economic_indicators
    ADD CONSTRAINT economic_indicators_pkey PRIMARY KEY (id);


--
-- Name: economic_indicators economic_indicators_user_id_date_region_indicator_type_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.economic_indicators
    ADD CONSTRAINT economic_indicators_user_id_date_region_indicator_type_key UNIQUE (user_id, date, region, indicator_type);


--
-- Name: external_data_sources external_data_sources_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.external_data_sources
    ADD CONSTRAINT external_data_sources_pkey PRIMARY KEY (id);


--
-- Name: funnel_metrics funnel_metrics_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.funnel_metrics
    ADD CONSTRAINT funnel_metrics_pkey PRIMARY KEY (id);


--
-- Name: graph_entities graph_entities_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.graph_entities
    ADD CONSTRAINT graph_entities_pkey PRIMARY KEY (id);


--
-- Name: graph_relations graph_relations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.graph_relations
    ADD CONSTRAINT graph_relations_pkey PRIMARY KEY (id);


--
-- Name: holidays_events holidays_events_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.holidays_events
    ADD CONSTRAINT holidays_events_pkey PRIMARY KEY (id);


--
-- Name: hq_store_master hq_store_master_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.hq_store_master
    ADD CONSTRAINT hq_store_master_pkey PRIMARY KEY (id);


--
-- Name: hq_store_master hq_store_master_user_id_hq_store_code_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.hq_store_master
    ADD CONSTRAINT hq_store_master_user_id_hq_store_code_key UNIQUE (user_id, hq_store_code);


--
-- Name: hq_sync_logs hq_sync_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.hq_sync_logs
    ADD CONSTRAINT hq_sync_logs_pkey PRIMARY KEY (id);


--
-- Name: inventory_levels inventory_levels_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.inventory_levels
    ADD CONSTRAINT inventory_levels_pkey PRIMARY KEY (id);


--
-- Name: license_management license_management_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.license_management
    ADD CONSTRAINT license_management_pkey PRIMARY KEY (id);


--
-- Name: license_management license_management_user_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.license_management
    ADD CONSTRAINT license_management_user_id_key UNIQUE (user_id);


--
-- Name: licenses licenses_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.licenses
    ADD CONSTRAINT licenses_pkey PRIMARY KEY (id);


--
-- Name: neuralsense_devices neuralsense_devices_device_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.neuralsense_devices
    ADD CONSTRAINT neuralsense_devices_device_id_key UNIQUE (device_id);


--
-- Name: neuralsense_devices neuralsense_devices_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.neuralsense_devices
    ADD CONSTRAINT neuralsense_devices_pkey PRIMARY KEY (id);


--
-- Name: notification_settings notification_settings_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notification_settings
    ADD CONSTRAINT notification_settings_pkey PRIMARY KEY (id);


--
-- Name: notification_settings notification_settings_user_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notification_settings
    ADD CONSTRAINT notification_settings_user_id_key UNIQUE (user_id);


--
-- Name: ontology_entity_types ontology_entity_types_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ontology_entity_types
    ADD CONSTRAINT ontology_entity_types_pkey PRIMARY KEY (id);


--
-- Name: ontology_entity_types ontology_entity_types_user_id_name_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ontology_entity_types
    ADD CONSTRAINT ontology_entity_types_user_id_name_key UNIQUE (user_id, name);


--
-- Name: ontology_mapping_cache ontology_mapping_cache_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ontology_mapping_cache
    ADD CONSTRAINT ontology_mapping_cache_pkey PRIMARY KEY (id);


--
-- Name: ontology_relation_types ontology_relation_types_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ontology_relation_types
    ADD CONSTRAINT ontology_relation_types_pkey PRIMARY KEY (id);


--
-- Name: ontology_relation_types ontology_relation_types_user_id_name_source_target_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ontology_relation_types
    ADD CONSTRAINT ontology_relation_types_user_id_name_source_target_key UNIQUE (user_id, name, source_entity_type, target_entity_type);


--
-- Name: ontology_schema_versions ontology_schema_versions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ontology_schema_versions
    ADD CONSTRAINT ontology_schema_versions_pkey PRIMARY KEY (id);


--
-- Name: ontology_schema_versions ontology_schema_versions_user_id_version_number_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ontology_schema_versions
    ADD CONSTRAINT ontology_schema_versions_user_id_version_number_key UNIQUE (user_id, version_number);


--
-- Name: organization_members organization_members_org_id_user_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.organization_members
    ADD CONSTRAINT organization_members_org_id_user_id_key UNIQUE (org_id, user_id);


--
-- Name: organization_members organization_members_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.organization_members
    ADD CONSTRAINT organization_members_pkey PRIMARY KEY (id);


--
-- Name: organization_settings organization_settings_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.organization_settings
    ADD CONSTRAINT organization_settings_pkey PRIMARY KEY (id);


--
-- Name: organization_settings organization_settings_user_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.organization_settings
    ADD CONSTRAINT organization_settings_user_id_key UNIQUE (user_id);


--
-- Name: organizations organizations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.organizations
    ADD CONSTRAINT organizations_pkey PRIMARY KEY (id);


--
-- Name: products products_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_pkey PRIMARY KEY (id);


--
-- Name: profiles profiles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_pkey PRIMARY KEY (id);


--
-- Name: regional_data regional_data_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.regional_data
    ADD CONSTRAINT regional_data_pkey PRIMARY KEY (id);


--
-- Name: report_schedules report_schedules_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.report_schedules
    ADD CONSTRAINT report_schedules_pkey PRIMARY KEY (id);


--
-- Name: scenario_comparisons scenario_comparisons_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.scenario_comparisons
    ADD CONSTRAINT scenario_comparisons_pkey PRIMARY KEY (id);


--
-- Name: scenarios scenarios_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.scenarios
    ADD CONSTRAINT scenarios_pkey PRIMARY KEY (id);


--
-- Name: simulation_results simulation_results_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.simulation_results
    ADD CONSTRAINT simulation_results_pkey PRIMARY KEY (id);


--
-- Name: store_mappings store_mappings_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.store_mappings
    ADD CONSTRAINT store_mappings_pkey PRIMARY KEY (id);


--
-- Name: store_mappings store_mappings_user_id_hq_store_id_local_store_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.store_mappings
    ADD CONSTRAINT store_mappings_user_id_hq_store_id_local_store_id_key UNIQUE (user_id, hq_store_id, local_store_id);


--
-- Name: store_scenes store_scenes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.store_scenes
    ADD CONSTRAINT store_scenes_pkey PRIMARY KEY (id);


--
-- Name: stores stores_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.stores
    ADD CONSTRAINT stores_pkey PRIMARY KEY (id);


--
-- Name: stores stores_user_id_store_code_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.stores
    ADD CONSTRAINT stores_user_id_store_code_key UNIQUE (user_id, store_code);


--
-- Name: subscriptions subscriptions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.subscriptions
    ADD CONSTRAINT subscriptions_pkey PRIMARY KEY (id);


--
-- Name: upload_sessions upload_sessions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.upload_sessions
    ADD CONSTRAINT upload_sessions_pkey PRIMARY KEY (id);


--
-- Name: user_classification_patterns user_classification_patterns_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_classification_patterns
    ADD CONSTRAINT user_classification_patterns_pkey PRIMARY KEY (id);


--
-- Name: user_data_imports user_data_imports_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_data_imports
    ADD CONSTRAINT user_data_imports_pkey PRIMARY KEY (id);


--
-- Name: user_roles user_roles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_pkey PRIMARY KEY (id);


--
-- Name: user_roles user_roles_user_id_role_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_user_id_role_key UNIQUE (user_id, role);


--
-- Name: weather_data weather_data_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.weather_data
    ADD CONSTRAINT weather_data_pkey PRIMARY KEY (id);


--
-- Name: weather_data weather_data_user_id_store_id_date_hour_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.weather_data
    ADD CONSTRAINT weather_data_user_id_store_id_date_hour_key UNIQUE (user_id, store_id, date, hour);


--
-- Name: wifi_heatmap_cache wifi_heatmap_cache_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.wifi_heatmap_cache
    ADD CONSTRAINT wifi_heatmap_cache_pkey PRIMARY KEY (id);


--
-- Name: wifi_heatmap_cache wifi_heatmap_cache_store_id_date_hour_grid_x_grid_z_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.wifi_heatmap_cache
    ADD CONSTRAINT wifi_heatmap_cache_store_id_date_hour_grid_x_grid_z_key UNIQUE (store_id, date, hour, grid_x, grid_z);


--
-- Name: wifi_probe_data wifi_probe_data_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.wifi_probe_data
    ADD CONSTRAINT wifi_probe_data_pkey PRIMARY KEY (id);


--
-- Name: wifi_raw_signals wifi_raw_signals_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.wifi_raw_signals
    ADD CONSTRAINT wifi_raw_signals_pkey PRIMARY KEY (id);


--
-- Name: wifi_tracking wifi_tracking_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.wifi_tracking
    ADD CONSTRAINT wifi_tracking_pkey PRIMARY KEY (id);


--
-- Name: wifi_zones wifi_zones_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.wifi_zones
    ADD CONSTRAINT wifi_zones_pkey PRIMARY KEY (id);


--
-- Name: wifi_zones wifi_zones_store_id_zone_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.wifi_zones
    ADD CONSTRAINT wifi_zones_store_id_zone_id_key UNIQUE (store_id, zone_id);


--
-- Name: idx_ai_recommendations_displayed; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_ai_recommendations_displayed ON public.ai_recommendations USING btree (is_displayed, displayed_at DESC) WHERE (is_displayed = true);


--
-- Name: idx_ai_recommendations_org_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_ai_recommendations_org_id ON public.ai_recommendations USING btree (org_id);


--
-- Name: idx_ai_recommendations_store_created; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_ai_recommendations_store_created ON public.ai_recommendations USING btree (store_id, created_at DESC);


--
-- Name: idx_ai_recommendations_user_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_ai_recommendations_user_status ON public.ai_recommendations USING btree (user_id, status, priority);


--
-- Name: idx_ai_scene_analysis_store_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_ai_scene_analysis_store_id ON public.ai_scene_analysis USING btree (store_id);


--
-- Name: idx_analysis_history_created_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_analysis_history_created_at ON public.analysis_history USING btree (created_at DESC);


--
-- Name: idx_analysis_history_org_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_analysis_history_org_id ON public.analysis_history USING btree (org_id);


--
-- Name: idx_analysis_history_store_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_analysis_history_store_id ON public.analysis_history USING btree (store_id);


--
-- Name: idx_analysis_history_type; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_analysis_history_type ON public.analysis_history USING btree (analysis_type);


--
-- Name: idx_analysis_history_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_analysis_history_user_id ON public.analysis_history USING btree (user_id);


--
-- Name: idx_api_connections_is_active; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_api_connections_is_active ON public.api_connections USING btree (is_active);


--
-- Name: idx_api_connections_org_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_api_connections_org_id ON public.api_connections USING btree (org_id);


--
-- Name: idx_api_connections_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_api_connections_user_id ON public.api_connections USING btree (user_id);


--
-- Name: idx_auto_order_suggestions_org_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_auto_order_suggestions_org_id ON public.auto_order_suggestions USING btree (org_id);


--
-- Name: idx_auto_order_suggestions_product_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_auto_order_suggestions_product_id ON public.auto_order_suggestions USING btree (product_id);


--
-- Name: idx_auto_order_suggestions_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_auto_order_suggestions_status ON public.auto_order_suggestions USING btree (status);


--
-- Name: idx_auto_order_suggestions_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_auto_order_suggestions_user_id ON public.auto_order_suggestions USING btree (user_id);


--
-- Name: idx_classification_patterns_type; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_classification_patterns_type ON public.user_classification_patterns USING btree (pattern_type, pattern_value);


--
-- Name: idx_classification_patterns_unique; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX idx_classification_patterns_unique ON public.user_classification_patterns USING btree (user_id, pattern_type, pattern_value, classified_as);


--
-- Name: idx_classification_patterns_user; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_classification_patterns_user ON public.user_classification_patterns USING btree (user_id);


--
-- Name: idx_dashboard_kpis_org_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_dashboard_kpis_org_id ON public.dashboard_kpis USING btree (org_id);


--
-- Name: idx_dashboard_kpis_store_date; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_dashboard_kpis_store_date ON public.dashboard_kpis USING btree (store_id, date DESC);


--
-- Name: idx_dashboard_kpis_user_date; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_dashboard_kpis_user_date ON public.dashboard_kpis USING btree (user_id, date DESC);


--
-- Name: idx_data_sync_logs_org_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_data_sync_logs_org_id ON public.data_sync_logs USING btree (org_id);


--
-- Name: idx_data_sync_schedules_org_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_data_sync_schedules_org_id ON public.data_sync_schedules USING btree (org_id);


--
-- Name: idx_economic_indicators_lookup; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_economic_indicators_lookup ON public.economic_indicators USING btree (user_id, date, region);


--
-- Name: idx_economic_indicators_org_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_economic_indicators_org_id ON public.economic_indicators USING btree (org_id);


--
-- Name: idx_external_data_sources_org_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_external_data_sources_org_id ON public.external_data_sources USING btree (org_id);


--
-- Name: idx_funnel_metrics_org_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_funnel_metrics_org_id ON public.funnel_metrics USING btree (org_id);


--
-- Name: idx_funnel_metrics_store_stage; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_funnel_metrics_store_stage ON public.funnel_metrics USING btree (store_id, stage, date DESC);


--
-- Name: idx_funnel_metrics_user_date; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_funnel_metrics_user_date ON public.funnel_metrics USING btree (user_id, date DESC);


--
-- Name: idx_graph_entities_entity_type_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_graph_entities_entity_type_id ON public.graph_entities USING btree (entity_type_id);


--
-- Name: idx_graph_entities_org_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_graph_entities_org_id ON public.graph_entities USING btree (org_id);


--
-- Name: idx_graph_entities_store_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_graph_entities_store_id ON public.graph_entities USING btree (store_id);


--
-- Name: idx_graph_entities_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_graph_entities_user_id ON public.graph_entities USING btree (user_id);


--
-- Name: idx_graph_relations_org_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_graph_relations_org_id ON public.graph_relations USING btree (org_id);


--
-- Name: idx_graph_relations_source; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_graph_relations_source ON public.graph_relations USING btree (source_entity_id);


--
-- Name: idx_graph_relations_store_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_graph_relations_store_id ON public.graph_relations USING btree (store_id);


--
-- Name: idx_graph_relations_target; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_graph_relations_target ON public.graph_relations USING btree (target_entity_id);


--
-- Name: idx_graph_relations_type; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_graph_relations_type ON public.graph_relations USING btree (relation_type_id);


--
-- Name: idx_graph_relations_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_graph_relations_user_id ON public.graph_relations USING btree (user_id);


--
-- Name: idx_holidays_events_lookup; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_holidays_events_lookup ON public.holidays_events USING btree (user_id, store_id, date);


--
-- Name: idx_holidays_events_org_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_holidays_events_org_id ON public.holidays_events USING btree (org_id);


--
-- Name: idx_hq_store_master_code; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_hq_store_master_code ON public.hq_store_master USING btree (user_id, hq_store_code);


--
-- Name: idx_hq_store_master_org_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_hq_store_master_org_id ON public.hq_store_master USING btree (org_id);


--
-- Name: idx_hq_store_master_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_hq_store_master_user_id ON public.hq_store_master USING btree (user_id);


--
-- Name: idx_hq_sync_logs_org_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_hq_sync_logs_org_id ON public.hq_sync_logs USING btree (org_id);


--
-- Name: idx_hq_sync_logs_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_hq_sync_logs_status ON public.hq_sync_logs USING btree (user_id, status);


--
-- Name: idx_hq_sync_logs_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_hq_sync_logs_user_id ON public.hq_sync_logs USING btree (user_id);


--
-- Name: idx_inventory_levels_org_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_inventory_levels_org_id ON public.inventory_levels USING btree (org_id);


--
-- Name: idx_inventory_levels_product_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_inventory_levels_product_id ON public.inventory_levels USING btree (product_id);


--
-- Name: idx_inventory_levels_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_inventory_levels_user_id ON public.inventory_levels USING btree (user_id);


--
-- Name: idx_mapping_cache_pattern; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_mapping_cache_pattern ON public.ontology_mapping_cache USING btree (file_name_pattern);


--
-- Name: idx_mapping_cache_user_type; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_mapping_cache_user_type ON public.ontology_mapping_cache USING btree (user_id, data_type);


--
-- Name: idx_neuralsense_devices_org_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_neuralsense_devices_org_id ON public.neuralsense_devices USING btree (org_id);


--
-- Name: idx_neuralsense_devices_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_neuralsense_devices_status ON public.neuralsense_devices USING btree (status);


--
-- Name: idx_neuralsense_devices_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_neuralsense_devices_user_id ON public.neuralsense_devices USING btree (user_id);


--
-- Name: idx_notification_settings_org_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_notification_settings_org_id ON public.notification_settings USING btree (org_id);


--
-- Name: idx_ontology_entity_types_org_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_ontology_entity_types_org_id ON public.ontology_entity_types USING btree (org_id);


--
-- Name: idx_ontology_mapping_cache_org_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_ontology_mapping_cache_org_id ON public.ontology_mapping_cache USING btree (org_id);


--
-- Name: idx_ontology_relation_types_org_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_ontology_relation_types_org_id ON public.ontology_relation_types USING btree (org_id);


--
-- Name: idx_ontology_schema_versions_org_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_ontology_schema_versions_org_id ON public.ontology_schema_versions USING btree (org_id);


--
-- Name: idx_products_org_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_products_org_id ON public.products USING btree (org_id);


--
-- Name: idx_products_sku; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_products_sku ON public.products USING btree (sku);


--
-- Name: idx_products_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_products_user_id ON public.products USING btree (user_id);


--
-- Name: idx_products_user_org; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_products_user_org ON public.products USING btree (user_id, org_id);


--
-- Name: idx_regional_data_lookup; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_regional_data_lookup ON public.regional_data USING btree (user_id, store_id, date);


--
-- Name: idx_scenario_comparisons_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_scenario_comparisons_user_id ON public.scenario_comparisons USING btree (user_id);


--
-- Name: idx_scenarios_org_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_scenarios_org_id ON public.scenarios USING btree (org_id);


--
-- Name: idx_scenarios_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_scenarios_status ON public.scenarios USING btree (status);


--
-- Name: idx_scenarios_store_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_scenarios_store_id ON public.scenarios USING btree (store_id);


--
-- Name: idx_scenarios_type; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_scenarios_type ON public.scenarios USING btree (scenario_type);


--
-- Name: idx_scenarios_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_scenarios_user_id ON public.scenarios USING btree (user_id);


--
-- Name: idx_simulation_results_scenario_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_simulation_results_scenario_id ON public.simulation_results USING btree (scenario_id);


--
-- Name: idx_store_mappings_hq_store; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_store_mappings_hq_store ON public.store_mappings USING btree (hq_store_id);


--
-- Name: idx_store_mappings_local_store; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_store_mappings_local_store ON public.store_mappings USING btree (local_store_id);


--
-- Name: idx_store_mappings_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_store_mappings_user_id ON public.store_mappings USING btree (user_id);


--
-- Name: idx_store_scenes_is_active; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_store_scenes_is_active ON public.store_scenes USING btree (is_active) WHERE (is_active = true);


--
-- Name: idx_store_scenes_org_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_store_scenes_org_id ON public.store_scenes USING btree (org_id);


--
-- Name: idx_store_scenes_store_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_store_scenes_store_id ON public.store_scenes USING btree (store_id);


--
-- Name: idx_store_scenes_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_store_scenes_user_id ON public.store_scenes USING btree (user_id);


--
-- Name: idx_stores_org_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_stores_org_id ON public.stores USING btree (org_id);


--
-- Name: idx_stores_org_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_stores_org_status ON public.stores USING btree (org_id, status);


--
-- Name: idx_stores_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_stores_status ON public.stores USING btree (status);


--
-- Name: idx_upload_sessions_user; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_upload_sessions_user ON public.upload_sessions USING btree (user_id, status);


--
-- Name: idx_user_data_imports_org_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_user_data_imports_org_id ON public.user_data_imports USING btree (org_id);


--
-- Name: idx_user_data_imports_sheet_name; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_user_data_imports_sheet_name ON public.user_data_imports USING btree (sheet_name);


--
-- Name: idx_user_data_imports_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_user_data_imports_status ON public.user_data_imports USING btree (user_id, status);


--
-- Name: idx_user_data_imports_store; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_user_data_imports_store ON public.user_data_imports USING btree (store_id, status);


--
-- Name: idx_user_data_imports_store_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_user_data_imports_store_id ON public.user_data_imports USING btree (store_id);


--
-- Name: idx_weather_data_lookup; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_weather_data_lookup ON public.weather_data USING btree (user_id, store_id, date);


--
-- Name: idx_wifi_heatmap_cache_store_date; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_wifi_heatmap_cache_store_date ON public.wifi_heatmap_cache USING btree (store_id, date, hour);


--
-- Name: idx_wifi_heatmap_cache_user; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_wifi_heatmap_cache_user ON public.wifi_heatmap_cache USING btree (user_id);


--
-- Name: idx_wifi_probe_data_device_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_wifi_probe_data_device_id ON public.wifi_probe_data USING btree (device_id);


--
-- Name: idx_wifi_probe_data_timestamp; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_wifi_probe_data_timestamp ON public.wifi_probe_data USING btree ("timestamp" DESC);


--
-- Name: idx_wifi_raw_signals_store_timestamp; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_wifi_raw_signals_store_timestamp ON public.wifi_raw_signals USING btree (store_id, "timestamp" DESC);


--
-- Name: idx_wifi_raw_signals_user; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_wifi_raw_signals_user ON public.wifi_raw_signals USING btree (user_id);


--
-- Name: idx_wifi_tracking_session; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_wifi_tracking_session ON public.wifi_tracking USING btree (session_id);


--
-- Name: idx_wifi_tracking_store_timestamp; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_wifi_tracking_store_timestamp ON public.wifi_tracking USING btree (store_id, "timestamp" DESC);


--
-- Name: idx_wifi_tracking_user; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_wifi_tracking_user ON public.wifi_tracking USING btree (user_id);


--
-- Name: idx_wifi_zones_store; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_wifi_zones_store ON public.wifi_zones USING btree (store_id);


--
-- Name: idx_wifi_zones_user; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_wifi_zones_user ON public.wifi_zones USING btree (user_id);


--
-- Name: stores on_store_created; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER on_store_created AFTER INSERT ON public.stores FOR EACH ROW EXECUTE FUNCTION public.create_store_storage_folders();


--
-- Name: ai_recommendations update_ai_recommendations_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_ai_recommendations_updated_at BEFORE UPDATE ON public.ai_recommendations FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: ai_scene_analysis update_ai_scene_analysis_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_ai_scene_analysis_updated_at BEFORE UPDATE ON public.ai_scene_analysis FOR EACH ROW EXECUTE FUNCTION public.update_ai_scene_analysis_updated_at();


--
-- Name: api_connections update_api_connections_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_api_connections_updated_at BEFORE UPDATE ON public.api_connections FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: auto_order_suggestions update_auto_order_suggestions_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_auto_order_suggestions_updated_at BEFORE UPDATE ON public.auto_order_suggestions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: user_classification_patterns update_classification_patterns_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_classification_patterns_updated_at BEFORE UPDATE ON public.user_classification_patterns FOR EACH ROW EXECUTE FUNCTION public.update_classification_patterns_updated_at();


--
-- Name: dashboard_kpis update_dashboard_kpis_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_dashboard_kpis_updated_at BEFORE UPDATE ON public.dashboard_kpis FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: data_sync_schedules update_data_sync_schedules_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_data_sync_schedules_updated_at BEFORE UPDATE ON public.data_sync_schedules FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: economic_indicators update_economic_indicators_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_economic_indicators_updated_at BEFORE UPDATE ON public.economic_indicators FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: ontology_entity_types update_entity_types_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_entity_types_updated_at BEFORE UPDATE ON public.ontology_entity_types FOR EACH ROW EXECUTE FUNCTION public.update_ontology_updated_at();


--
-- Name: external_data_sources update_external_data_sources_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_external_data_sources_updated_at BEFORE UPDATE ON public.external_data_sources FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: graph_entities update_graph_entities_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_graph_entities_updated_at BEFORE UPDATE ON public.graph_entities FOR EACH ROW EXECUTE FUNCTION public.update_ontology_updated_at();


--
-- Name: graph_relations update_graph_relations_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_graph_relations_updated_at BEFORE UPDATE ON public.graph_relations FOR EACH ROW EXECUTE FUNCTION public.update_ontology_updated_at();


--
-- Name: holidays_events update_holidays_events_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_holidays_events_updated_at BEFORE UPDATE ON public.holidays_events FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: hq_store_master update_hq_store_master_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_hq_store_master_updated_at BEFORE UPDATE ON public.hq_store_master FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: license_management update_license_management_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_license_management_updated_at BEFORE UPDATE ON public.license_management FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: licenses update_licenses_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_licenses_updated_at BEFORE UPDATE ON public.licenses FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: neuralsense_devices update_neuralsense_devices_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_neuralsense_devices_updated_at BEFORE UPDATE ON public.neuralsense_devices FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: notification_settings update_notification_settings_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_notification_settings_updated_at BEFORE UPDATE ON public.notification_settings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: organization_members update_organization_members_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_organization_members_updated_at BEFORE UPDATE ON public.organization_members FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: organization_settings update_organization_settings_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_organization_settings_updated_at BEFORE UPDATE ON public.organization_settings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: organizations update_organizations_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_organizations_updated_at BEFORE UPDATE ON public.organizations FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: products update_products_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON public.products FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: profiles update_profiles_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: regional_data update_regional_data_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_regional_data_updated_at BEFORE UPDATE ON public.regional_data FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: ontology_relation_types update_relation_types_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_relation_types_updated_at BEFORE UPDATE ON public.ontology_relation_types FOR EACH ROW EXECUTE FUNCTION public.update_ontology_updated_at();


--
-- Name: report_schedules update_report_schedules_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_report_schedules_updated_at BEFORE UPDATE ON public.report_schedules FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: scenario_comparisons update_scenario_comparisons_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_scenario_comparisons_updated_at BEFORE UPDATE ON public.scenario_comparisons FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: scenarios update_scenarios_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_scenarios_updated_at BEFORE UPDATE ON public.scenarios FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: store_mappings update_store_mappings_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_store_mappings_updated_at BEFORE UPDATE ON public.store_mappings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: store_scenes update_store_scenes_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_store_scenes_updated_at BEFORE UPDATE ON public.store_scenes FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: stores update_stores_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_stores_updated_at BEFORE UPDATE ON public.stores FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: subscriptions update_subscriptions_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_subscriptions_updated_at BEFORE UPDATE ON public.subscriptions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: user_roles update_user_roles_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_user_roles_updated_at BEFORE UPDATE ON public.user_roles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: weather_data update_weather_data_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_weather_data_updated_at BEFORE UPDATE ON public.weather_data FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: ai_recommendations ai_recommendations_org_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ai_recommendations
    ADD CONSTRAINT ai_recommendations_org_id_fkey FOREIGN KEY (org_id) REFERENCES public.organizations(id) ON DELETE CASCADE;


--
-- Name: ai_recommendations ai_recommendations_store_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ai_recommendations
    ADD CONSTRAINT ai_recommendations_store_id_fkey FOREIGN KEY (store_id) REFERENCES public.stores(id) ON DELETE CASCADE;


--
-- Name: ai_scene_analysis ai_scene_analysis_org_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ai_scene_analysis
    ADD CONSTRAINT ai_scene_analysis_org_id_fkey FOREIGN KEY (org_id) REFERENCES public.organizations(id) ON DELETE CASCADE;


--
-- Name: ai_scene_analysis ai_scene_analysis_store_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ai_scene_analysis
    ADD CONSTRAINT ai_scene_analysis_store_id_fkey FOREIGN KEY (store_id) REFERENCES public.stores(id) ON DELETE CASCADE;


--
-- Name: analysis_history analysis_history_org_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.analysis_history
    ADD CONSTRAINT analysis_history_org_id_fkey FOREIGN KEY (org_id) REFERENCES public.organizations(id) ON DELETE CASCADE;


--
-- Name: analysis_history analysis_history_store_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.analysis_history
    ADD CONSTRAINT analysis_history_store_id_fkey FOREIGN KEY (store_id) REFERENCES public.stores(id) ON DELETE CASCADE;


--
-- Name: analysis_history analysis_history_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.analysis_history
    ADD CONSTRAINT analysis_history_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: api_connections api_connections_org_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.api_connections
    ADD CONSTRAINT api_connections_org_id_fkey FOREIGN KEY (org_id) REFERENCES public.organizations(id) ON DELETE CASCADE;


--
-- Name: auto_order_suggestions auto_order_suggestions_org_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.auto_order_suggestions
    ADD CONSTRAINT auto_order_suggestions_org_id_fkey FOREIGN KEY (org_id) REFERENCES public.organizations(id) ON DELETE CASCADE;


--
-- Name: auto_order_suggestions auto_order_suggestions_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.auto_order_suggestions
    ADD CONSTRAINT auto_order_suggestions_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE CASCADE;


--
-- Name: dashboard_kpis dashboard_kpis_org_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.dashboard_kpis
    ADD CONSTRAINT dashboard_kpis_org_id_fkey FOREIGN KEY (org_id) REFERENCES public.organizations(id) ON DELETE CASCADE;


--
-- Name: dashboard_kpis dashboard_kpis_store_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.dashboard_kpis
    ADD CONSTRAINT dashboard_kpis_store_id_fkey FOREIGN KEY (store_id) REFERENCES public.stores(id) ON DELETE CASCADE;


--
-- Name: data_sync_logs data_sync_logs_org_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.data_sync_logs
    ADD CONSTRAINT data_sync_logs_org_id_fkey FOREIGN KEY (org_id) REFERENCES public.organizations(id) ON DELETE CASCADE;


--
-- Name: data_sync_logs data_sync_logs_schedule_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.data_sync_logs
    ADD CONSTRAINT data_sync_logs_schedule_id_fkey FOREIGN KEY (schedule_id) REFERENCES public.data_sync_schedules(id) ON DELETE CASCADE;


--
-- Name: data_sync_schedules data_sync_schedules_data_source_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.data_sync_schedules
    ADD CONSTRAINT data_sync_schedules_data_source_id_fkey FOREIGN KEY (data_source_id) REFERENCES public.external_data_sources(id) ON DELETE CASCADE;


--
-- Name: data_sync_schedules data_sync_schedules_org_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.data_sync_schedules
    ADD CONSTRAINT data_sync_schedules_org_id_fkey FOREIGN KEY (org_id) REFERENCES public.organizations(id) ON DELETE CASCADE;


--
-- Name: economic_indicators economic_indicators_org_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.economic_indicators
    ADD CONSTRAINT economic_indicators_org_id_fkey FOREIGN KEY (org_id) REFERENCES public.organizations(id) ON DELETE CASCADE;


--
-- Name: external_data_sources external_data_sources_org_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.external_data_sources
    ADD CONSTRAINT external_data_sources_org_id_fkey FOREIGN KEY (org_id) REFERENCES public.organizations(id) ON DELETE CASCADE;


--
-- Name: funnel_metrics funnel_metrics_org_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.funnel_metrics
    ADD CONSTRAINT funnel_metrics_org_id_fkey FOREIGN KEY (org_id) REFERENCES public.organizations(id) ON DELETE CASCADE;


--
-- Name: funnel_metrics funnel_metrics_store_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.funnel_metrics
    ADD CONSTRAINT funnel_metrics_store_id_fkey FOREIGN KEY (store_id) REFERENCES public.stores(id) ON DELETE CASCADE;


--
-- Name: graph_entities graph_entities_entity_type_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.graph_entities
    ADD CONSTRAINT graph_entities_entity_type_id_fkey FOREIGN KEY (entity_type_id) REFERENCES public.ontology_entity_types(id) ON DELETE CASCADE;


--
-- Name: graph_entities graph_entities_org_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.graph_entities
    ADD CONSTRAINT graph_entities_org_id_fkey FOREIGN KEY (org_id) REFERENCES public.organizations(id) ON DELETE CASCADE;


--
-- Name: graph_entities graph_entities_store_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.graph_entities
    ADD CONSTRAINT graph_entities_store_id_fkey FOREIGN KEY (store_id) REFERENCES public.stores(id) ON DELETE CASCADE;


--
-- Name: graph_relations graph_relations_org_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.graph_relations
    ADD CONSTRAINT graph_relations_org_id_fkey FOREIGN KEY (org_id) REFERENCES public.organizations(id) ON DELETE CASCADE;


--
-- Name: graph_relations graph_relations_relation_type_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.graph_relations
    ADD CONSTRAINT graph_relations_relation_type_id_fkey FOREIGN KEY (relation_type_id) REFERENCES public.ontology_relation_types(id) ON DELETE CASCADE;


--
-- Name: graph_relations graph_relations_source_entity_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.graph_relations
    ADD CONSTRAINT graph_relations_source_entity_id_fkey FOREIGN KEY (source_entity_id) REFERENCES public.graph_entities(id) ON DELETE CASCADE;


--
-- Name: graph_relations graph_relations_store_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.graph_relations
    ADD CONSTRAINT graph_relations_store_id_fkey FOREIGN KEY (store_id) REFERENCES public.stores(id) ON DELETE CASCADE;


--
-- Name: graph_relations graph_relations_target_entity_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.graph_relations
    ADD CONSTRAINT graph_relations_target_entity_id_fkey FOREIGN KEY (target_entity_id) REFERENCES public.graph_entities(id) ON DELETE CASCADE;


--
-- Name: holidays_events holidays_events_org_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.holidays_events
    ADD CONSTRAINT holidays_events_org_id_fkey FOREIGN KEY (org_id) REFERENCES public.organizations(id) ON DELETE CASCADE;


--
-- Name: holidays_events holidays_events_store_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.holidays_events
    ADD CONSTRAINT holidays_events_store_id_fkey FOREIGN KEY (store_id) REFERENCES public.stores(id) ON DELETE CASCADE;


--
-- Name: hq_store_master hq_store_master_org_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.hq_store_master
    ADD CONSTRAINT hq_store_master_org_id_fkey FOREIGN KEY (org_id) REFERENCES public.organizations(id) ON DELETE CASCADE;


--
-- Name: hq_sync_logs hq_sync_logs_org_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.hq_sync_logs
    ADD CONSTRAINT hq_sync_logs_org_id_fkey FOREIGN KEY (org_id) REFERENCES public.organizations(id) ON DELETE CASCADE;


--
-- Name: inventory_levels inventory_levels_org_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.inventory_levels
    ADD CONSTRAINT inventory_levels_org_id_fkey FOREIGN KEY (org_id) REFERENCES public.organizations(id) ON DELETE CASCADE;


--
-- Name: inventory_levels inventory_levels_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.inventory_levels
    ADD CONSTRAINT inventory_levels_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE CASCADE;


--
-- Name: license_management license_management_org_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.license_management
    ADD CONSTRAINT license_management_org_id_fkey FOREIGN KEY (org_id) REFERENCES public.organizations(id) ON DELETE CASCADE;


--
-- Name: license_management license_management_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.license_management
    ADD CONSTRAINT license_management_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: licenses licenses_org_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.licenses
    ADD CONSTRAINT licenses_org_id_fkey FOREIGN KEY (org_id) REFERENCES public.organizations(id) ON DELETE CASCADE;


--
-- Name: neuralsense_devices neuralsense_devices_org_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.neuralsense_devices
    ADD CONSTRAINT neuralsense_devices_org_id_fkey FOREIGN KEY (org_id) REFERENCES public.organizations(id) ON DELETE CASCADE;


--
-- Name: notification_settings notification_settings_org_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notification_settings
    ADD CONSTRAINT notification_settings_org_id_fkey FOREIGN KEY (org_id) REFERENCES public.organizations(id) ON DELETE CASCADE;


--
-- Name: notification_settings notification_settings_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notification_settings
    ADD CONSTRAINT notification_settings_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: ontology_entity_types ontology_entity_types_org_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ontology_entity_types
    ADD CONSTRAINT ontology_entity_types_org_id_fkey FOREIGN KEY (org_id) REFERENCES public.organizations(id) ON DELETE CASCADE;


--
-- Name: ontology_mapping_cache ontology_mapping_cache_org_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ontology_mapping_cache
    ADD CONSTRAINT ontology_mapping_cache_org_id_fkey FOREIGN KEY (org_id) REFERENCES public.organizations(id) ON DELETE CASCADE;


--
-- Name: ontology_mapping_cache ontology_mapping_cache_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ontology_mapping_cache
    ADD CONSTRAINT ontology_mapping_cache_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: ontology_relation_types ontology_relation_types_org_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ontology_relation_types
    ADD CONSTRAINT ontology_relation_types_org_id_fkey FOREIGN KEY (org_id) REFERENCES public.organizations(id) ON DELETE CASCADE;


--
-- Name: ontology_schema_versions ontology_schema_versions_org_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ontology_schema_versions
    ADD CONSTRAINT ontology_schema_versions_org_id_fkey FOREIGN KEY (org_id) REFERENCES public.organizations(id) ON DELETE CASCADE;


--
-- Name: organization_members organization_members_org_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.organization_members
    ADD CONSTRAINT organization_members_org_id_fkey FOREIGN KEY (org_id) REFERENCES public.organizations(id) ON DELETE CASCADE;


--
-- Name: organization_members organization_members_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.organization_members
    ADD CONSTRAINT organization_members_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: organization_settings organization_settings_org_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.organization_settings
    ADD CONSTRAINT organization_settings_org_id_fkey FOREIGN KEY (org_id) REFERENCES public.organizations(id) ON DELETE CASCADE;


--
-- Name: organization_settings organization_settings_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.organization_settings
    ADD CONSTRAINT organization_settings_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: organizations organizations_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.organizations
    ADD CONSTRAINT organizations_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE SET NULL;


--
-- Name: products products_org_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_org_id_fkey FOREIGN KEY (org_id) REFERENCES public.organizations(id) ON DELETE CASCADE;


--
-- Name: profiles profiles_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: regional_data regional_data_org_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.regional_data
    ADD CONSTRAINT regional_data_org_id_fkey FOREIGN KEY (org_id) REFERENCES public.organizations(id) ON DELETE CASCADE;


--
-- Name: regional_data regional_data_store_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.regional_data
    ADD CONSTRAINT regional_data_store_id_fkey FOREIGN KEY (store_id) REFERENCES public.stores(id) ON DELETE CASCADE;


--
-- Name: report_schedules report_schedules_org_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.report_schedules
    ADD CONSTRAINT report_schedules_org_id_fkey FOREIGN KEY (org_id) REFERENCES public.organizations(id) ON DELETE CASCADE;


--
-- Name: report_schedules report_schedules_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.report_schedules
    ADD CONSTRAINT report_schedules_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: scenario_comparisons scenario_comparisons_org_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.scenario_comparisons
    ADD CONSTRAINT scenario_comparisons_org_id_fkey FOREIGN KEY (org_id) REFERENCES public.organizations(id) ON DELETE CASCADE;


--
-- Name: scenarios scenarios_org_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.scenarios
    ADD CONSTRAINT scenarios_org_id_fkey FOREIGN KEY (org_id) REFERENCES public.organizations(id) ON DELETE CASCADE;


--
-- Name: scenarios scenarios_store_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.scenarios
    ADD CONSTRAINT scenarios_store_id_fkey FOREIGN KEY (store_id) REFERENCES public.stores(id);


--
-- Name: simulation_results simulation_results_org_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.simulation_results
    ADD CONSTRAINT simulation_results_org_id_fkey FOREIGN KEY (org_id) REFERENCES public.organizations(id) ON DELETE CASCADE;


--
-- Name: simulation_results simulation_results_scenario_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.simulation_results
    ADD CONSTRAINT simulation_results_scenario_id_fkey FOREIGN KEY (scenario_id) REFERENCES public.scenarios(id) ON DELETE CASCADE;


--
-- Name: store_mappings store_mappings_hq_store_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.store_mappings
    ADD CONSTRAINT store_mappings_hq_store_id_fkey FOREIGN KEY (hq_store_id) REFERENCES public.hq_store_master(id) ON DELETE CASCADE;


--
-- Name: store_mappings store_mappings_local_store_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.store_mappings
    ADD CONSTRAINT store_mappings_local_store_id_fkey FOREIGN KEY (local_store_id) REFERENCES public.stores(id) ON DELETE CASCADE;


--
-- Name: store_mappings store_mappings_org_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.store_mappings
    ADD CONSTRAINT store_mappings_org_id_fkey FOREIGN KEY (org_id) REFERENCES public.organizations(id) ON DELETE CASCADE;


--
-- Name: store_scenes store_scenes_org_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.store_scenes
    ADD CONSTRAINT store_scenes_org_id_fkey FOREIGN KEY (org_id) REFERENCES public.organizations(id) ON DELETE CASCADE;


--
-- Name: store_scenes store_scenes_store_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.store_scenes
    ADD CONSTRAINT store_scenes_store_id_fkey FOREIGN KEY (store_id) REFERENCES public.stores(id) ON DELETE CASCADE;


--
-- Name: stores stores_org_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.stores
    ADD CONSTRAINT stores_org_id_fkey FOREIGN KEY (org_id) REFERENCES public.organizations(id) ON DELETE CASCADE;


--
-- Name: subscriptions subscriptions_org_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.subscriptions
    ADD CONSTRAINT subscriptions_org_id_fkey FOREIGN KEY (org_id) REFERENCES public.organizations(id) ON DELETE CASCADE;


--
-- Name: upload_sessions upload_sessions_store_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.upload_sessions
    ADD CONSTRAINT upload_sessions_store_id_fkey FOREIGN KEY (store_id) REFERENCES public.stores(id) ON DELETE CASCADE;


--
-- Name: upload_sessions upload_sessions_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.upload_sessions
    ADD CONSTRAINT upload_sessions_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: user_data_imports user_data_imports_org_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_data_imports
    ADD CONSTRAINT user_data_imports_org_id_fkey FOREIGN KEY (org_id) REFERENCES public.organizations(id) ON DELETE CASCADE;


--
-- Name: user_data_imports user_data_imports_session_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_data_imports
    ADD CONSTRAINT user_data_imports_session_id_fkey FOREIGN KEY (session_id) REFERENCES public.upload_sessions(id) ON DELETE SET NULL;


--
-- Name: user_data_imports user_data_imports_store_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_data_imports
    ADD CONSTRAINT user_data_imports_store_id_fkey FOREIGN KEY (store_id) REFERENCES public.stores(id) ON DELETE CASCADE;


--
-- Name: user_roles user_roles_assigned_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_assigned_by_fkey FOREIGN KEY (assigned_by) REFERENCES auth.users(id);


--
-- Name: user_roles user_roles_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: weather_data weather_data_store_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.weather_data
    ADD CONSTRAINT weather_data_store_id_fkey FOREIGN KEY (store_id) REFERENCES public.stores(id) ON DELETE CASCADE;


--
-- Name: wifi_heatmap_cache wifi_heatmap_cache_store_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.wifi_heatmap_cache
    ADD CONSTRAINT wifi_heatmap_cache_store_id_fkey FOREIGN KEY (store_id) REFERENCES public.stores(id) ON DELETE CASCADE;


--
-- Name: wifi_probe_data wifi_probe_data_device_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.wifi_probe_data
    ADD CONSTRAINT wifi_probe_data_device_id_fkey FOREIGN KEY (device_id) REFERENCES public.neuralsense_devices(id) ON DELETE CASCADE;


--
-- Name: wifi_raw_signals wifi_raw_signals_store_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.wifi_raw_signals
    ADD CONSTRAINT wifi_raw_signals_store_id_fkey FOREIGN KEY (store_id) REFERENCES public.stores(id) ON DELETE CASCADE;


--
-- Name: wifi_tracking wifi_tracking_store_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.wifi_tracking
    ADD CONSTRAINT wifi_tracking_store_id_fkey FOREIGN KEY (store_id) REFERENCES public.stores(id) ON DELETE CASCADE;


--
-- Name: wifi_zones wifi_zones_store_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.wifi_zones
    ADD CONSTRAINT wifi_zones_store_id_fkey FOREIGN KEY (store_id) REFERENCES public.stores(id) ON DELETE CASCADE;


--
-- Name: license_management Admins can manage all licenses; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage all licenses" ON public.license_management USING (public.is_admin(auth.uid()));


--
-- Name: user_roles Admins can manage all roles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage all roles" ON public.user_roles USING (public.is_admin(auth.uid()));


--
-- Name: organizations Authenticated users can create organizations; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Authenticated users can create organizations" ON public.organizations FOR INSERT TO authenticated WITH CHECK ((auth.uid() = created_by));


--
-- Name: organization_members Org admins can add members; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Org admins can add members" ON public.organization_members FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM public.organization_members om
  WHERE ((om.org_id = organization_members.org_id) AND (om.user_id = auth.uid()) AND (om.role = ANY (ARRAY['ORG_OWNER'::public.app_role, 'ORG_ADMIN'::public.app_role]))))));


--
-- Name: hq_store_master Org admins can create org HQ store master; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Org admins can create org HQ store master" ON public.hq_store_master FOR INSERT WITH CHECK ((((org_id IS NULL) AND (auth.uid() = user_id)) OR ((org_id IS NOT NULL) AND public.is_org_admin(auth.uid(), org_id))));


--
-- Name: api_connections Org admins can create org api connections; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Org admins can create org api connections" ON public.api_connections FOR INSERT TO authenticated WITH CHECK ((((org_id IS NULL) AND (auth.uid() = user_id)) OR ((org_id IS NOT NULL) AND public.is_org_admin(auth.uid(), org_id))));


--
-- Name: external_data_sources Org admins can create org data sources; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Org admins can create org data sources" ON public.external_data_sources FOR INSERT TO authenticated WITH CHECK ((((org_id IS NULL) AND (auth.uid() = user_id)) OR ((org_id IS NOT NULL) AND public.is_org_admin(auth.uid(), org_id))));


--
-- Name: data_sync_schedules Org admins can create org sync schedules; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Org admins can create org sync schedules" ON public.data_sync_schedules FOR INSERT TO authenticated WITH CHECK ((((org_id IS NULL) AND (auth.uid() = user_id)) OR ((org_id IS NOT NULL) AND public.is_org_admin(auth.uid(), org_id))));


--
-- Name: hq_store_master Org admins can delete org HQ store master; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Org admins can delete org HQ store master" ON public.hq_store_master FOR DELETE USING ((((org_id IS NULL) AND (auth.uid() = user_id)) OR ((org_id IS NOT NULL) AND public.is_org_admin(auth.uid(), org_id))));


--
-- Name: analysis_history Org admins can delete org analysis history; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Org admins can delete org analysis history" ON public.analysis_history FOR DELETE TO authenticated USING ((((org_id IS NULL) AND (auth.uid() = user_id)) OR ((org_id IS NOT NULL) AND public.is_org_admin(auth.uid(), org_id))));


--
-- Name: api_connections Org admins can delete org api connections; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Org admins can delete org api connections" ON public.api_connections FOR DELETE TO authenticated USING ((((org_id IS NULL) AND (auth.uid() = user_id)) OR ((org_id IS NOT NULL) AND public.is_org_admin(auth.uid(), org_id))));


--
-- Name: dashboard_kpis Org admins can delete org dashboard kpis; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Org admins can delete org dashboard kpis" ON public.dashboard_kpis FOR DELETE TO authenticated USING ((((org_id IS NULL) AND (auth.uid() = user_id)) OR ((org_id IS NOT NULL) AND public.is_org_admin(auth.uid(), org_id))));


--
-- Name: external_data_sources Org admins can delete org data sources; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Org admins can delete org data sources" ON public.external_data_sources FOR DELETE TO authenticated USING ((((org_id IS NULL) AND (auth.uid() = user_id)) OR ((org_id IS NOT NULL) AND public.is_org_admin(auth.uid(), org_id))));


--
-- Name: neuralsense_devices Org admins can delete org devices; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Org admins can delete org devices" ON public.neuralsense_devices FOR DELETE USING ((((org_id IS NULL) AND (auth.uid() = user_id)) OR ((org_id IS NOT NULL) AND public.is_org_admin(auth.uid(), org_id))));


--
-- Name: economic_indicators Org admins can delete org economic indicators; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Org admins can delete org economic indicators" ON public.economic_indicators FOR DELETE USING ((((org_id IS NULL) AND (auth.uid() = user_id)) OR ((org_id IS NOT NULL) AND public.is_org_admin(auth.uid(), org_id))));


--
-- Name: ontology_entity_types Org admins can delete org entity types; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Org admins can delete org entity types" ON public.ontology_entity_types FOR DELETE USING ((((org_id IS NULL) AND (auth.uid() = user_id)) OR ((org_id IS NOT NULL) AND public.is_org_admin(auth.uid(), org_id))));


--
-- Name: funnel_metrics Org admins can delete org funnel metrics; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Org admins can delete org funnel metrics" ON public.funnel_metrics FOR DELETE USING ((((org_id IS NULL) AND (auth.uid() = user_id)) OR ((org_id IS NOT NULL) AND public.is_org_admin(auth.uid(), org_id))));


--
-- Name: graph_entities Org admins can delete org graph entities; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Org admins can delete org graph entities" ON public.graph_entities FOR DELETE TO authenticated USING ((((org_id IS NULL) AND (auth.uid() = user_id)) OR ((org_id IS NOT NULL) AND public.is_org_admin(auth.uid(), org_id))));


--
-- Name: graph_relations Org admins can delete org graph relations; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Org admins can delete org graph relations" ON public.graph_relations FOR DELETE TO authenticated USING ((((org_id IS NULL) AND (auth.uid() = user_id)) OR ((org_id IS NOT NULL) AND public.is_org_admin(auth.uid(), org_id))));


--
-- Name: holidays_events Org admins can delete org holidays/events; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Org admins can delete org holidays/events" ON public.holidays_events FOR DELETE USING ((((org_id IS NULL) AND (auth.uid() = user_id)) OR ((org_id IS NOT NULL) AND public.is_org_admin(auth.uid(), org_id))));


--
-- Name: inventory_levels Org admins can delete org inventory levels; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Org admins can delete org inventory levels" ON public.inventory_levels FOR DELETE TO authenticated USING ((((org_id IS NULL) AND (auth.uid() = user_id)) OR ((org_id IS NOT NULL) AND public.is_org_admin(auth.uid(), org_id))));


--
-- Name: ontology_mapping_cache Org admins can delete org mapping cache; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Org admins can delete org mapping cache" ON public.ontology_mapping_cache FOR DELETE USING ((((org_id IS NULL) AND (auth.uid() = user_id)) OR ((org_id IS NOT NULL) AND public.is_org_admin(auth.uid(), org_id))));


--
-- Name: auto_order_suggestions Org admins can delete org order suggestions; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Org admins can delete org order suggestions" ON public.auto_order_suggestions FOR DELETE TO authenticated USING ((((org_id IS NULL) AND (auth.uid() = user_id)) OR ((org_id IS NOT NULL) AND public.is_org_admin(auth.uid(), org_id))));


--
-- Name: products Org admins can delete org products; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Org admins can delete org products" ON public.products FOR DELETE TO authenticated USING ((((org_id IS NULL) AND (auth.uid() = user_id)) OR ((org_id IS NOT NULL) AND public.is_org_admin(auth.uid(), org_id))));


--
-- Name: ontology_relation_types Org admins can delete org relation types; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Org admins can delete org relation types" ON public.ontology_relation_types FOR DELETE USING ((((org_id IS NULL) AND (auth.uid() = user_id)) OR ((org_id IS NOT NULL) AND public.is_org_admin(auth.uid(), org_id))));


--
-- Name: stores Org admins can delete org stores; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Org admins can delete org stores" ON public.stores FOR DELETE TO authenticated USING ((((org_id IS NULL) AND (auth.uid() = user_id)) OR ((org_id IS NOT NULL) AND public.is_org_admin(auth.uid(), org_id))));


--
-- Name: data_sync_schedules Org admins can delete org sync schedules; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Org admins can delete org sync schedules" ON public.data_sync_schedules FOR DELETE TO authenticated USING ((((org_id IS NULL) AND (auth.uid() = user_id)) OR ((org_id IS NOT NULL) AND public.is_org_admin(auth.uid(), org_id))));


--
-- Name: organization_members Org admins can remove members; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Org admins can remove members" ON public.organization_members FOR DELETE USING ((EXISTS ( SELECT 1
   FROM public.organization_members om
  WHERE ((om.org_id = organization_members.org_id) AND (om.user_id = auth.uid()) AND (om.role = ANY (ARRAY['ORG_OWNER'::public.app_role, 'ORG_ADMIN'::public.app_role]))))));


--
-- Name: organization_members Org admins can update members; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Org admins can update members" ON public.organization_members FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM public.organization_members om
  WHERE ((om.org_id = organization_members.org_id) AND (om.user_id = auth.uid()) AND (om.role = ANY (ARRAY['ORG_OWNER'::public.app_role, 'ORG_ADMIN'::public.app_role]))))));


--
-- Name: hq_store_master Org admins can update org HQ store master; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Org admins can update org HQ store master" ON public.hq_store_master FOR UPDATE USING ((((org_id IS NULL) AND (auth.uid() = user_id)) OR ((org_id IS NOT NULL) AND public.is_org_admin(auth.uid(), org_id))));


--
-- Name: api_connections Org admins can update org api connections; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Org admins can update org api connections" ON public.api_connections FOR UPDATE TO authenticated USING ((((org_id IS NULL) AND (auth.uid() = user_id)) OR ((org_id IS NOT NULL) AND public.is_org_admin(auth.uid(), org_id))));


--
-- Name: external_data_sources Org admins can update org data sources; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Org admins can update org data sources" ON public.external_data_sources FOR UPDATE TO authenticated USING ((((org_id IS NULL) AND (auth.uid() = user_id)) OR ((org_id IS NOT NULL) AND public.is_org_admin(auth.uid(), org_id))));


--
-- Name: products Org admins can update org products; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Org admins can update org products" ON public.products FOR UPDATE TO authenticated USING ((((org_id IS NULL) AND (auth.uid() = user_id)) OR ((org_id IS NOT NULL) AND public.is_org_admin(auth.uid(), org_id))));


--
-- Name: stores Org admins can update org stores; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Org admins can update org stores" ON public.stores FOR UPDATE TO authenticated USING ((((org_id IS NULL) AND (auth.uid() = user_id)) OR ((org_id IS NOT NULL) AND public.is_org_admin(auth.uid(), org_id))));


--
-- Name: data_sync_schedules Org admins can update org sync schedules; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Org admins can update org sync schedules" ON public.data_sync_schedules FOR UPDATE TO authenticated USING ((((org_id IS NULL) AND (auth.uid() = user_id)) OR ((org_id IS NOT NULL) AND public.is_org_admin(auth.uid(), org_id))));


--
-- Name: organizations Org admins can update their organization; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Org admins can update their organization" ON public.organizations FOR UPDATE TO authenticated USING ((EXISTS ( SELECT 1
   FROM public.organization_members
  WHERE ((organization_members.org_id = organizations.id) AND (organization_members.user_id = auth.uid()) AND (organization_members.role = ANY (ARRAY['ORG_OWNER'::public.app_role, 'ORG_ADMIN'::public.app_role]))))));


--
-- Name: ai_recommendations Org members can create org ai recommendations; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Org members can create org ai recommendations" ON public.ai_recommendations FOR INSERT TO authenticated WITH CHECK ((((org_id IS NULL) AND (auth.uid() = user_id)) OR ((org_id IS NOT NULL) AND public.is_org_member(auth.uid(), org_id))));


--
-- Name: analysis_history Org members can create org analysis history; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Org members can create org analysis history" ON public.analysis_history FOR INSERT TO authenticated WITH CHECK ((((org_id IS NULL) AND (auth.uid() = user_id)) OR ((org_id IS NOT NULL) AND public.is_org_member(auth.uid(), org_id))));


--
-- Name: dashboard_kpis Org members can create org dashboard kpis; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Org members can create org dashboard kpis" ON public.dashboard_kpis FOR INSERT TO authenticated WITH CHECK ((((org_id IS NULL) AND (auth.uid() = user_id)) OR ((org_id IS NOT NULL) AND public.is_org_member(auth.uid(), org_id))));


--
-- Name: neuralsense_devices Org members can create org devices; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Org members can create org devices" ON public.neuralsense_devices FOR INSERT WITH CHECK ((((org_id IS NULL) AND (auth.uid() = user_id)) OR ((org_id IS NOT NULL) AND public.is_org_member(auth.uid(), org_id))));


--
-- Name: economic_indicators Org members can create org economic indicators; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Org members can create org economic indicators" ON public.economic_indicators FOR INSERT WITH CHECK ((((org_id IS NULL) AND (auth.uid() = user_id)) OR ((org_id IS NOT NULL) AND public.is_org_member(auth.uid(), org_id))));


--
-- Name: ontology_entity_types Org members can create org entity types; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Org members can create org entity types" ON public.ontology_entity_types FOR INSERT WITH CHECK ((((org_id IS NULL) AND (auth.uid() = user_id)) OR ((org_id IS NOT NULL) AND public.is_org_member(auth.uid(), org_id))));


--
-- Name: funnel_metrics Org members can create org funnel metrics; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Org members can create org funnel metrics" ON public.funnel_metrics FOR INSERT WITH CHECK ((((org_id IS NULL) AND (auth.uid() = user_id)) OR ((org_id IS NOT NULL) AND public.is_org_member(auth.uid(), org_id))));


--
-- Name: graph_entities Org members can create org graph entities; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Org members can create org graph entities" ON public.graph_entities FOR INSERT TO authenticated WITH CHECK ((((org_id IS NULL) AND (auth.uid() = user_id)) OR ((org_id IS NOT NULL) AND public.is_org_member(auth.uid(), org_id))));


--
-- Name: graph_relations Org members can create org graph relations; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Org members can create org graph relations" ON public.graph_relations FOR INSERT TO authenticated WITH CHECK ((((org_id IS NULL) AND (auth.uid() = user_id)) OR ((org_id IS NOT NULL) AND public.is_org_member(auth.uid(), org_id))));


--
-- Name: holidays_events Org members can create org holidays/events; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Org members can create org holidays/events" ON public.holidays_events FOR INSERT WITH CHECK ((((org_id IS NULL) AND (auth.uid() = user_id)) OR ((org_id IS NOT NULL) AND public.is_org_member(auth.uid(), org_id))));


--
-- Name: inventory_levels Org members can create org inventory levels; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Org members can create org inventory levels" ON public.inventory_levels FOR INSERT TO authenticated WITH CHECK ((((org_id IS NULL) AND (auth.uid() = user_id)) OR ((org_id IS NOT NULL) AND public.is_org_member(auth.uid(), org_id))));


--
-- Name: ontology_mapping_cache Org members can create org mapping cache; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Org members can create org mapping cache" ON public.ontology_mapping_cache FOR INSERT WITH CHECK ((((org_id IS NULL) AND (auth.uid() = user_id)) OR ((org_id IS NOT NULL) AND public.is_org_member(auth.uid(), org_id))));


--
-- Name: notification_settings Org members can create org notification settings; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Org members can create org notification settings" ON public.notification_settings FOR INSERT WITH CHECK ((((org_id IS NULL) AND (auth.uid() = user_id)) OR ((org_id IS NOT NULL) AND public.is_org_member(auth.uid(), org_id))));


--
-- Name: auto_order_suggestions Org members can create org order suggestions; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Org members can create org order suggestions" ON public.auto_order_suggestions FOR INSERT TO authenticated WITH CHECK ((((org_id IS NULL) AND (auth.uid() = user_id)) OR ((org_id IS NOT NULL) AND public.is_org_member(auth.uid(), org_id))));


--
-- Name: products Org members can create org products; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Org members can create org products" ON public.products FOR INSERT TO authenticated WITH CHECK ((((org_id IS NULL) AND (auth.uid() = user_id)) OR ((org_id IS NOT NULL) AND public.is_org_member(auth.uid(), org_id))));


--
-- Name: ontology_relation_types Org members can create org relation types; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Org members can create org relation types" ON public.ontology_relation_types FOR INSERT WITH CHECK ((((org_id IS NULL) AND (auth.uid() = user_id)) OR ((org_id IS NOT NULL) AND public.is_org_member(auth.uid(), org_id))));


--
-- Name: ontology_schema_versions Org members can create org schema versions; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Org members can create org schema versions" ON public.ontology_schema_versions FOR INSERT WITH CHECK ((((org_id IS NULL) AND (auth.uid() = user_id)) OR ((org_id IS NOT NULL) AND public.is_org_member(auth.uid(), org_id))));


--
-- Name: stores Org members can create org stores; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Org members can create org stores" ON public.stores FOR INSERT TO authenticated WITH CHECK ((((org_id IS NULL) AND (auth.uid() = user_id)) OR ((org_id IS NOT NULL) AND public.is_org_member(auth.uid(), org_id))));


--
-- Name: data_sync_logs Org members can create org sync logs; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Org members can create org sync logs" ON public.data_sync_logs FOR INSERT TO authenticated WITH CHECK ((((org_id IS NULL) AND (auth.uid() = user_id)) OR ((org_id IS NOT NULL) AND public.is_org_member(auth.uid(), org_id))));


--
-- Name: hq_sync_logs Org members can create org sync logs; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Org members can create org sync logs" ON public.hq_sync_logs FOR INSERT WITH CHECK ((((org_id IS NULL) AND (auth.uid() = user_id)) OR ((org_id IS NOT NULL) AND public.is_org_member(auth.uid(), org_id))));


--
-- Name: ai_recommendations Org members can delete org ai recommendations; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Org members can delete org ai recommendations" ON public.ai_recommendations FOR DELETE TO authenticated USING ((((org_id IS NULL) AND (auth.uid() = user_id)) OR ((org_id IS NOT NULL) AND public.is_org_member(auth.uid(), org_id))));


--
-- Name: ai_recommendations Org members can update org ai recommendations; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Org members can update org ai recommendations" ON public.ai_recommendations FOR UPDATE TO authenticated USING ((((org_id IS NULL) AND (auth.uid() = user_id)) OR ((org_id IS NOT NULL) AND public.is_org_member(auth.uid(), org_id))));


--
-- Name: dashboard_kpis Org members can update org dashboard kpis; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Org members can update org dashboard kpis" ON public.dashboard_kpis FOR UPDATE TO authenticated USING ((((org_id IS NULL) AND (auth.uid() = user_id)) OR ((org_id IS NOT NULL) AND public.is_org_member(auth.uid(), org_id))));


--
-- Name: neuralsense_devices Org members can update org devices; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Org members can update org devices" ON public.neuralsense_devices FOR UPDATE USING ((((org_id IS NULL) AND (auth.uid() = user_id)) OR ((org_id IS NOT NULL) AND public.is_org_member(auth.uid(), org_id))));


--
-- Name: economic_indicators Org members can update org economic indicators; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Org members can update org economic indicators" ON public.economic_indicators FOR UPDATE USING ((((org_id IS NULL) AND (auth.uid() = user_id)) OR ((org_id IS NOT NULL) AND public.is_org_member(auth.uid(), org_id))));


--
-- Name: ontology_entity_types Org members can update org entity types; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Org members can update org entity types" ON public.ontology_entity_types FOR UPDATE USING ((((org_id IS NULL) AND (auth.uid() = user_id)) OR ((org_id IS NOT NULL) AND public.is_org_member(auth.uid(), org_id))));


--
-- Name: funnel_metrics Org members can update org funnel metrics; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Org members can update org funnel metrics" ON public.funnel_metrics FOR UPDATE USING ((((org_id IS NULL) AND (auth.uid() = user_id)) OR ((org_id IS NOT NULL) AND public.is_org_member(auth.uid(), org_id))));


--
-- Name: graph_entities Org members can update org graph entities; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Org members can update org graph entities" ON public.graph_entities FOR UPDATE TO authenticated USING ((((org_id IS NULL) AND (auth.uid() = user_id)) OR ((org_id IS NOT NULL) AND public.is_org_member(auth.uid(), org_id))));


--
-- Name: graph_relations Org members can update org graph relations; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Org members can update org graph relations" ON public.graph_relations FOR UPDATE TO authenticated USING ((((org_id IS NULL) AND (auth.uid() = user_id)) OR ((org_id IS NOT NULL) AND public.is_org_member(auth.uid(), org_id))));


--
-- Name: holidays_events Org members can update org holidays/events; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Org members can update org holidays/events" ON public.holidays_events FOR UPDATE USING ((((org_id IS NULL) AND (auth.uid() = user_id)) OR ((org_id IS NOT NULL) AND public.is_org_member(auth.uid(), org_id))));


--
-- Name: inventory_levels Org members can update org inventory levels; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Org members can update org inventory levels" ON public.inventory_levels FOR UPDATE TO authenticated USING ((((org_id IS NULL) AND (auth.uid() = user_id)) OR ((org_id IS NOT NULL) AND public.is_org_member(auth.uid(), org_id))));


--
-- Name: ontology_mapping_cache Org members can update org mapping cache; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Org members can update org mapping cache" ON public.ontology_mapping_cache FOR UPDATE USING ((((org_id IS NULL) AND (auth.uid() = user_id)) OR ((org_id IS NOT NULL) AND public.is_org_member(auth.uid(), org_id))));


--
-- Name: notification_settings Org members can update org notification settings; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Org members can update org notification settings" ON public.notification_settings FOR UPDATE USING ((((org_id IS NULL) AND (auth.uid() = user_id)) OR ((org_id IS NOT NULL) AND public.is_org_member(auth.uid(), org_id))));


--
-- Name: auto_order_suggestions Org members can update org order suggestions; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Org members can update org order suggestions" ON public.auto_order_suggestions FOR UPDATE TO authenticated USING ((((org_id IS NULL) AND (auth.uid() = user_id)) OR ((org_id IS NOT NULL) AND public.is_org_member(auth.uid(), org_id))));


--
-- Name: ontology_relation_types Org members can update org relation types; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Org members can update org relation types" ON public.ontology_relation_types FOR UPDATE USING ((((org_id IS NULL) AND (auth.uid() = user_id)) OR ((org_id IS NOT NULL) AND public.is_org_member(auth.uid(), org_id))));


--
-- Name: hq_store_master Org members can view org HQ store master; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Org members can view org HQ store master" ON public.hq_store_master FOR SELECT USING ((((org_id IS NULL) AND (auth.uid() = user_id)) OR ((org_id IS NOT NULL) AND public.is_org_member(auth.uid(), org_id))));


--
-- Name: ai_recommendations Org members can view org ai recommendations; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Org members can view org ai recommendations" ON public.ai_recommendations FOR SELECT TO authenticated USING ((((org_id IS NULL) AND (auth.uid() = user_id)) OR ((org_id IS NOT NULL) AND public.is_org_member(auth.uid(), org_id))));


--
-- Name: analysis_history Org members can view org analysis history; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Org members can view org analysis history" ON public.analysis_history FOR SELECT TO authenticated USING ((((org_id IS NULL) AND (auth.uid() = user_id)) OR ((org_id IS NOT NULL) AND public.is_org_member(auth.uid(), org_id))));


--
-- Name: api_connections Org members can view org api connections; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Org members can view org api connections" ON public.api_connections FOR SELECT TO authenticated USING ((((org_id IS NULL) AND (auth.uid() = user_id)) OR ((org_id IS NOT NULL) AND public.is_org_member(auth.uid(), org_id))));


--
-- Name: dashboard_kpis Org members can view org dashboard kpis; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Org members can view org dashboard kpis" ON public.dashboard_kpis FOR SELECT TO authenticated USING ((((org_id IS NULL) AND (auth.uid() = user_id)) OR ((org_id IS NOT NULL) AND public.is_org_member(auth.uid(), org_id))));


--
-- Name: external_data_sources Org members can view org data sources; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Org members can view org data sources" ON public.external_data_sources FOR SELECT TO authenticated USING ((((org_id IS NULL) AND (auth.uid() = user_id)) OR ((org_id IS NOT NULL) AND public.is_org_member(auth.uid(), org_id))));


--
-- Name: neuralsense_devices Org members can view org devices; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Org members can view org devices" ON public.neuralsense_devices FOR SELECT USING ((((org_id IS NULL) AND (auth.uid() = user_id)) OR ((org_id IS NOT NULL) AND public.is_org_member(auth.uid(), org_id))));


--
-- Name: economic_indicators Org members can view org economic indicators; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Org members can view org economic indicators" ON public.economic_indicators FOR SELECT USING ((((org_id IS NULL) AND (auth.uid() = user_id)) OR ((org_id IS NOT NULL) AND public.is_org_member(auth.uid(), org_id))));


--
-- Name: ontology_entity_types Org members can view org entity types; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Org members can view org entity types" ON public.ontology_entity_types FOR SELECT USING ((((org_id IS NULL) AND (auth.uid() = user_id)) OR ((org_id IS NOT NULL) AND public.is_org_member(auth.uid(), org_id))));


--
-- Name: funnel_metrics Org members can view org funnel metrics; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Org members can view org funnel metrics" ON public.funnel_metrics FOR SELECT USING ((((org_id IS NULL) AND (auth.uid() = user_id)) OR ((org_id IS NOT NULL) AND public.is_org_member(auth.uid(), org_id))));


--
-- Name: graph_entities Org members can view org graph entities; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Org members can view org graph entities" ON public.graph_entities FOR SELECT TO authenticated USING ((((org_id IS NULL) AND (auth.uid() = user_id)) OR ((org_id IS NOT NULL) AND public.is_org_member(auth.uid(), org_id))));


--
-- Name: graph_relations Org members can view org graph relations; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Org members can view org graph relations" ON public.graph_relations FOR SELECT TO authenticated USING ((((org_id IS NULL) AND (auth.uid() = user_id)) OR ((org_id IS NOT NULL) AND public.is_org_member(auth.uid(), org_id))));


--
-- Name: holidays_events Org members can view org holidays/events; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Org members can view org holidays/events" ON public.holidays_events FOR SELECT USING ((((org_id IS NULL) AND (auth.uid() = user_id)) OR ((org_id IS NOT NULL) AND public.is_org_member(auth.uid(), org_id))));


--
-- Name: inventory_levels Org members can view org inventory levels; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Org members can view org inventory levels" ON public.inventory_levels FOR SELECT TO authenticated USING ((((org_id IS NULL) AND (auth.uid() = user_id)) OR ((org_id IS NOT NULL) AND public.is_org_member(auth.uid(), org_id))));


--
-- Name: ontology_mapping_cache Org members can view org mapping cache; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Org members can view org mapping cache" ON public.ontology_mapping_cache FOR SELECT USING ((((org_id IS NULL) AND (auth.uid() = user_id)) OR ((org_id IS NOT NULL) AND public.is_org_member(auth.uid(), org_id))));


--
-- Name: notification_settings Org members can view org notification settings; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Org members can view org notification settings" ON public.notification_settings FOR SELECT USING ((((org_id IS NULL) AND (auth.uid() = user_id)) OR ((org_id IS NOT NULL) AND public.is_org_member(auth.uid(), org_id))));


--
-- Name: auto_order_suggestions Org members can view org order suggestions; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Org members can view org order suggestions" ON public.auto_order_suggestions FOR SELECT TO authenticated USING ((((org_id IS NULL) AND (auth.uid() = user_id)) OR ((org_id IS NOT NULL) AND public.is_org_member(auth.uid(), org_id))));


--
-- Name: products Org members can view org products; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Org members can view org products" ON public.products FOR SELECT TO authenticated USING ((((org_id IS NULL) AND (auth.uid() = user_id)) OR ((org_id IS NOT NULL) AND public.is_org_member(auth.uid(), org_id))));


--
-- Name: ontology_relation_types Org members can view org relation types; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Org members can view org relation types" ON public.ontology_relation_types FOR SELECT USING ((((org_id IS NULL) AND (auth.uid() = user_id)) OR ((org_id IS NOT NULL) AND public.is_org_member(auth.uid(), org_id))));


--
-- Name: ontology_schema_versions Org members can view org schema versions; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Org members can view org schema versions" ON public.ontology_schema_versions FOR SELECT USING ((((org_id IS NULL) AND (auth.uid() = user_id)) OR ((org_id IS NOT NULL) AND public.is_org_member(auth.uid(), org_id))));


--
-- Name: stores Org members can view org stores; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Org members can view org stores" ON public.stores FOR SELECT TO authenticated USING ((((org_id IS NULL) AND (auth.uid() = user_id)) OR ((org_id IS NOT NULL) AND public.is_org_member(auth.uid(), org_id))));


--
-- Name: data_sync_logs Org members can view org sync logs; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Org members can view org sync logs" ON public.data_sync_logs FOR SELECT TO authenticated USING ((((org_id IS NULL) AND (auth.uid() = user_id)) OR ((org_id IS NOT NULL) AND public.is_org_member(auth.uid(), org_id))));


--
-- Name: hq_sync_logs Org members can view org sync logs; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Org members can view org sync logs" ON public.hq_sync_logs FOR SELECT USING ((((org_id IS NULL) AND (auth.uid() = user_id)) OR ((org_id IS NOT NULL) AND public.is_org_member(auth.uid(), org_id))));


--
-- Name: data_sync_schedules Org members can view org sync schedules; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Org members can view org sync schedules" ON public.data_sync_schedules FOR SELECT TO authenticated USING ((((org_id IS NULL) AND (auth.uid() = user_id)) OR ((org_id IS NOT NULL) AND public.is_org_member(auth.uid(), org_id))));


--
-- Name: licenses Org owners can create licenses; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Org owners can create licenses" ON public.licenses FOR INSERT TO authenticated WITH CHECK ((EXISTS ( SELECT 1
   FROM public.organization_members
  WHERE ((organization_members.org_id = licenses.org_id) AND (organization_members.user_id = auth.uid()) AND (organization_members.role = 'ORG_OWNER'::public.app_role)))));


--
-- Name: subscriptions Org owners can create subscriptions; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Org owners can create subscriptions" ON public.subscriptions FOR INSERT TO authenticated WITH CHECK ((EXISTS ( SELECT 1
   FROM public.organization_members
  WHERE ((organization_members.org_id = subscriptions.org_id) AND (organization_members.user_id = auth.uid()) AND (organization_members.role = 'ORG_OWNER'::public.app_role)))));


--
-- Name: licenses Org owners can update licenses; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Org owners can update licenses" ON public.licenses FOR UPDATE TO authenticated USING ((EXISTS ( SELECT 1
   FROM public.organization_members
  WHERE ((organization_members.org_id = licenses.org_id) AND (organization_members.user_id = auth.uid()) AND (organization_members.role = 'ORG_OWNER'::public.app_role)))));


--
-- Name: subscriptions Org owners can update subscriptions; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Org owners can update subscriptions" ON public.subscriptions FOR UPDATE TO authenticated USING ((EXISTS ( SELECT 1
   FROM public.organization_members
  WHERE ((organization_members.org_id = subscriptions.org_id) AND (organization_members.user_id = auth.uid()) AND (organization_members.role = 'ORG_OWNER'::public.app_role)))));


--
-- Name: licenses Organization members can view licenses; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Organization members can view licenses" ON public.licenses FOR SELECT TO authenticated USING ((EXISTS ( SELECT 1
   FROM public.organization_members
  WHERE ((organization_members.org_id = licenses.org_id) AND (organization_members.user_id = auth.uid())))));


--
-- Name: subscriptions Organization members can view subscriptions; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Organization members can view subscriptions" ON public.subscriptions FOR SELECT TO authenticated USING ((EXISTS ( SELECT 1
   FROM public.organization_members
  WHERE ((organization_members.org_id = subscriptions.org_id) AND (organization_members.user_id = auth.uid())))));


--
-- Name: organizations Organization members can view their organization; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Organization members can view their organization" ON public.organizations FOR SELECT TO authenticated USING ((EXISTS ( SELECT 1
   FROM public.organization_members
  WHERE ((organization_members.org_id = organizations.id) AND (organization_members.user_id = auth.uid())))));


--
-- Name: simulation_results Users can create simulation results for their scenarios; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can create simulation results for their scenarios" ON public.simulation_results FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM public.scenarios
  WHERE ((scenarios.id = simulation_results.scenario_id) AND (scenarios.user_id = auth.uid())))));


--
-- Name: user_classification_patterns Users can create their own classification patterns; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can create their own classification patterns" ON public.user_classification_patterns FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: user_data_imports Users can create their own data imports; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can create their own data imports" ON public.user_data_imports FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: profiles Users can create their own profile; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can create their own profile" ON public.profiles FOR INSERT TO authenticated WITH CHECK ((auth.uid() = id));


--
-- Name: scenario_comparisons Users can create their own scenario comparisons; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can create their own scenario comparisons" ON public.scenario_comparisons FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: scenarios Users can create their own scenarios; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can create their own scenarios" ON public.scenarios FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: store_scenes Users can create their own store scenes; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can create their own store scenes" ON public.store_scenes FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: upload_sessions Users can create their own upload sessions; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can create their own upload sessions" ON public.upload_sessions FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: user_data_imports Users can create their store imports; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can create their store imports" ON public.user_data_imports FOR INSERT WITH CHECK (((auth.uid() = user_id) AND ((store_id IS NULL) OR (EXISTS ( SELECT 1
   FROM public.stores
  WHERE ((stores.id = user_data_imports.store_id) AND (stores.user_id = auth.uid())))))));


--
-- Name: ai_scene_analysis Users can create their store scene analysis; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can create their store scene analysis" ON public.ai_scene_analysis FOR INSERT WITH CHECK (((auth.uid() = user_id) AND ((store_id IS NULL) OR (EXISTS ( SELECT 1
   FROM public.stores
  WHERE ((stores.id = ai_scene_analysis.store_id) AND (stores.user_id = auth.uid())))))));


--
-- Name: store_scenes Users can create their store scenes; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can create their store scenes" ON public.store_scenes FOR INSERT WITH CHECK (((auth.uid() = user_id) AND ((store_id IS NULL) OR (EXISTS ( SELECT 1
   FROM public.stores
  WHERE ((stores.id = store_scenes.store_id) AND (stores.user_id = auth.uid())))))));


--
-- Name: user_classification_patterns Users can delete their own classification patterns; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete their own classification patterns" ON public.user_classification_patterns FOR DELETE USING ((auth.uid() = user_id));


--
-- Name: user_data_imports Users can delete their own data imports; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete their own data imports" ON public.user_data_imports FOR DELETE USING ((auth.uid() = user_id));


--
-- Name: wifi_heatmap_cache Users can delete their own heatmap cache; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete their own heatmap cache" ON public.wifi_heatmap_cache FOR DELETE USING ((auth.uid() = user_id));


--
-- Name: wifi_raw_signals Users can delete their own raw signals; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete their own raw signals" ON public.wifi_raw_signals FOR DELETE USING ((auth.uid() = user_id));


--
-- Name: regional_data Users can delete their own regional data; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete their own regional data" ON public.regional_data FOR DELETE USING ((auth.uid() = user_id));


--
-- Name: report_schedules Users can delete their own report schedules; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete their own report schedules" ON public.report_schedules FOR DELETE USING ((auth.uid() = user_id));


--
-- Name: scenario_comparisons Users can delete their own scenario comparisons; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete their own scenario comparisons" ON public.scenario_comparisons FOR DELETE USING ((auth.uid() = user_id));


--
-- Name: scenarios Users can delete their own scenarios; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete their own scenarios" ON public.scenarios FOR DELETE USING ((auth.uid() = user_id));


--
-- Name: store_mappings Users can delete their own store mappings; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete their own store mappings" ON public.store_mappings FOR DELETE USING ((auth.uid() = user_id));


--
-- Name: store_scenes Users can delete their own store scenes; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete their own store scenes" ON public.store_scenes FOR DELETE USING ((auth.uid() = user_id));


--
-- Name: wifi_tracking Users can delete their own tracking data; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete their own tracking data" ON public.wifi_tracking FOR DELETE USING ((auth.uid() = user_id));


--
-- Name: weather_data Users can delete their own weather data; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete their own weather data" ON public.weather_data FOR DELETE USING ((auth.uid() = user_id));


--
-- Name: wifi_zones Users can delete their own zones; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete their own zones" ON public.wifi_zones FOR DELETE USING ((auth.uid() = user_id));


--
-- Name: user_data_imports Users can delete their store imports; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete their store imports" ON public.user_data_imports FOR DELETE USING (((auth.uid() = user_id) AND ((store_id IS NULL) OR (EXISTS ( SELECT 1
   FROM public.stores
  WHERE ((stores.id = user_data_imports.store_id) AND (stores.user_id = auth.uid())))))));


--
-- Name: ai_scene_analysis Users can delete their store scene analysis; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete their store scene analysis" ON public.ai_scene_analysis FOR DELETE USING (((auth.uid() = user_id) AND ((store_id IS NULL) OR (EXISTS ( SELECT 1
   FROM public.stores
  WHERE ((stores.id = ai_scene_analysis.store_id) AND (stores.user_id = auth.uid())))))));


--
-- Name: store_scenes Users can delete their store scenes; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete their store scenes" ON public.store_scenes FOR DELETE USING (((auth.uid() = user_id) AND ((store_id IS NULL) OR (EXISTS ( SELECT 1
   FROM public.stores
  WHERE ((stores.id = store_scenes.store_id) AND (stores.user_id = auth.uid())))))));


--
-- Name: wifi_heatmap_cache Users can insert their own heatmap cache; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can insert their own heatmap cache" ON public.wifi_heatmap_cache FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: organization_settings Users can insert their own organization settings; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can insert their own organization settings" ON public.organization_settings FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: wifi_probe_data Users can insert their own probe data; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can insert their own probe data" ON public.wifi_probe_data FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: wifi_raw_signals Users can insert their own raw signals; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can insert their own raw signals" ON public.wifi_raw_signals FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: regional_data Users can insert their own regional data; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can insert their own regional data" ON public.regional_data FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: report_schedules Users can insert their own report schedules; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can insert their own report schedules" ON public.report_schedules FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: store_mappings Users can insert their own store mappings; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can insert their own store mappings" ON public.store_mappings FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: wifi_tracking Users can insert their own tracking data; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can insert their own tracking data" ON public.wifi_tracking FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: weather_data Users can insert their own weather data; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can insert their own weather data" ON public.weather_data FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: wifi_zones Users can insert their own zones; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can insert their own zones" ON public.wifi_zones FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: user_classification_patterns Users can update their own classification patterns; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update their own classification patterns" ON public.user_classification_patterns FOR UPDATE USING ((auth.uid() = user_id));


--
-- Name: user_data_imports Users can update their own data imports; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update their own data imports" ON public.user_data_imports FOR UPDATE USING ((auth.uid() = user_id));


--
-- Name: wifi_heatmap_cache Users can update their own heatmap cache; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update their own heatmap cache" ON public.wifi_heatmap_cache FOR UPDATE USING ((auth.uid() = user_id));


--
-- Name: organization_settings Users can update their own organization settings; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update their own organization settings" ON public.organization_settings FOR UPDATE USING ((auth.uid() = user_id));


--
-- Name: profiles Users can update their own profile; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE TO authenticated USING ((auth.uid() = id));


--
-- Name: regional_data Users can update their own regional data; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update their own regional data" ON public.regional_data FOR UPDATE USING ((auth.uid() = user_id));


--
-- Name: report_schedules Users can update their own report schedules; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update their own report schedules" ON public.report_schedules FOR UPDATE USING ((auth.uid() = user_id));


--
-- Name: scenario_comparisons Users can update their own scenario comparisons; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update their own scenario comparisons" ON public.scenario_comparisons FOR UPDATE USING ((auth.uid() = user_id));


--
-- Name: scenarios Users can update their own scenarios; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update their own scenarios" ON public.scenarios FOR UPDATE USING ((auth.uid() = user_id));


--
-- Name: store_mappings Users can update their own store mappings; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update their own store mappings" ON public.store_mappings FOR UPDATE USING ((auth.uid() = user_id));


--
-- Name: store_scenes Users can update their own store scenes; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update their own store scenes" ON public.store_scenes FOR UPDATE USING ((auth.uid() = user_id));


--
-- Name: upload_sessions Users can update their own upload sessions; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update their own upload sessions" ON public.upload_sessions FOR UPDATE USING ((auth.uid() = user_id));


--
-- Name: weather_data Users can update their own weather data; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update their own weather data" ON public.weather_data FOR UPDATE USING ((auth.uid() = user_id));


--
-- Name: wifi_zones Users can update their own zones; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update their own zones" ON public.wifi_zones FOR UPDATE USING ((auth.uid() = user_id));


--
-- Name: ai_scene_analysis Users can update their store scene analysis; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update their store scene analysis" ON public.ai_scene_analysis FOR UPDATE USING (((auth.uid() = user_id) AND ((store_id IS NULL) OR (EXISTS ( SELECT 1
   FROM public.stores
  WHERE ((stores.id = ai_scene_analysis.store_id) AND (stores.user_id = auth.uid())))))));


--
-- Name: store_scenes Users can update their store scenes; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update their store scenes" ON public.store_scenes FOR UPDATE USING (((auth.uid() = user_id) AND ((store_id IS NULL) OR (EXISTS ( SELECT 1
   FROM public.stores
  WHERE ((stores.id = store_scenes.store_id) AND (stores.user_id = auth.uid())))))));


--
-- Name: organization_members Users can view org members; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view org members" ON public.organization_members FOR SELECT USING ((org_id IN ( SELECT om.org_id
   FROM public.organization_members om
  WHERE (om.user_id = auth.uid()))));


--
-- Name: simulation_results Users can view simulation results for their scenarios; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view simulation results for their scenarios" ON public.simulation_results FOR SELECT USING ((EXISTS ( SELECT 1
   FROM public.scenarios
  WHERE ((scenarios.id = simulation_results.scenario_id) AND (scenarios.user_id = auth.uid())))));


--
-- Name: user_classification_patterns Users can view their own classification patterns; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own classification patterns" ON public.user_classification_patterns FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: user_data_imports Users can view their own data imports; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own data imports" ON public.user_data_imports FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: wifi_heatmap_cache Users can view their own heatmap cache; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own heatmap cache" ON public.wifi_heatmap_cache FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: license_management Users can view their own license; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own license" ON public.license_management FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: organization_members Users can view their own membership; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own membership" ON public.organization_members FOR SELECT USING ((user_id = auth.uid()));


--
-- Name: organization_settings Users can view their own organization settings; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own organization settings" ON public.organization_settings FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: wifi_probe_data Users can view their own probe data; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own probe data" ON public.wifi_probe_data FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: profiles Users can view their own profile; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own profile" ON public.profiles FOR SELECT TO authenticated USING ((auth.uid() = id));


--
-- Name: wifi_raw_signals Users can view their own raw signals; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own raw signals" ON public.wifi_raw_signals FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: regional_data Users can view their own regional data; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own regional data" ON public.regional_data FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: report_schedules Users can view their own report schedules; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own report schedules" ON public.report_schedules FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: user_roles Users can view their own roles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own roles" ON public.user_roles FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: scenario_comparisons Users can view their own scenario comparisons; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own scenario comparisons" ON public.scenario_comparisons FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: scenarios Users can view their own scenarios; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own scenarios" ON public.scenarios FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: store_mappings Users can view their own store mappings; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own store mappings" ON public.store_mappings FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: store_scenes Users can view their own store scenes; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own store scenes" ON public.store_scenes FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: wifi_tracking Users can view their own tracking data; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own tracking data" ON public.wifi_tracking FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: upload_sessions Users can view their own upload sessions; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own upload sessions" ON public.upload_sessions FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: weather_data Users can view their own weather data; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own weather data" ON public.weather_data FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: wifi_zones Users can view their own zones; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own zones" ON public.wifi_zones FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: user_data_imports Users can view their store imports; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their store imports" ON public.user_data_imports FOR SELECT USING (((auth.uid() = user_id) AND ((store_id IS NULL) OR (EXISTS ( SELECT 1
   FROM public.stores
  WHERE ((stores.id = user_data_imports.store_id) AND (stores.user_id = auth.uid())))))));


--
-- Name: ai_scene_analysis Users can view their store scene analysis; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their store scene analysis" ON public.ai_scene_analysis FOR SELECT USING (((auth.uid() = user_id) AND ((store_id IS NULL) OR (EXISTS ( SELECT 1
   FROM public.stores
  WHERE ((stores.id = ai_scene_analysis.store_id) AND (stores.user_id = auth.uid())))))));


--
-- Name: store_scenes Users can view their store scenes; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their store scenes" ON public.store_scenes FOR SELECT USING (((auth.uid() = user_id) AND ((store_id IS NULL) OR (EXISTS ( SELECT 1
   FROM public.stores
  WHERE ((stores.id = store_scenes.store_id) AND (stores.user_id = auth.uid())))))));


--
-- Name: ai_recommendations; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.ai_recommendations ENABLE ROW LEVEL SECURITY;

--
-- Name: ai_scene_analysis; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.ai_scene_analysis ENABLE ROW LEVEL SECURITY;

--
-- Name: analysis_history; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.analysis_history ENABLE ROW LEVEL SECURITY;

--
-- Name: api_connections; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.api_connections ENABLE ROW LEVEL SECURITY;

--
-- Name: auto_order_suggestions; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.auto_order_suggestions ENABLE ROW LEVEL SECURITY;

--
-- Name: dashboard_kpis; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.dashboard_kpis ENABLE ROW LEVEL SECURITY;

--
-- Name: data_sync_logs; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.data_sync_logs ENABLE ROW LEVEL SECURITY;

--
-- Name: data_sync_schedules; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.data_sync_schedules ENABLE ROW LEVEL SECURITY;

--
-- Name: economic_indicators; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.economic_indicators ENABLE ROW LEVEL SECURITY;

--
-- Name: external_data_sources; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.external_data_sources ENABLE ROW LEVEL SECURITY;

--
-- Name: funnel_metrics; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.funnel_metrics ENABLE ROW LEVEL SECURITY;

--
-- Name: graph_entities; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.graph_entities ENABLE ROW LEVEL SECURITY;

--
-- Name: graph_relations; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.graph_relations ENABLE ROW LEVEL SECURITY;

--
-- Name: holidays_events; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.holidays_events ENABLE ROW LEVEL SECURITY;

--
-- Name: hq_store_master; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.hq_store_master ENABLE ROW LEVEL SECURITY;

--
-- Name: hq_sync_logs; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.hq_sync_logs ENABLE ROW LEVEL SECURITY;

--
-- Name: inventory_levels; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.inventory_levels ENABLE ROW LEVEL SECURITY;

--
-- Name: license_management; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.license_management ENABLE ROW LEVEL SECURITY;

--
-- Name: licenses; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.licenses ENABLE ROW LEVEL SECURITY;

--
-- Name: neuralsense_devices; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.neuralsense_devices ENABLE ROW LEVEL SECURITY;

--
-- Name: notification_settings; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.notification_settings ENABLE ROW LEVEL SECURITY;

--
-- Name: ontology_entity_types; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.ontology_entity_types ENABLE ROW LEVEL SECURITY;

--
-- Name: ontology_mapping_cache; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.ontology_mapping_cache ENABLE ROW LEVEL SECURITY;

--
-- Name: ontology_relation_types; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.ontology_relation_types ENABLE ROW LEVEL SECURITY;

--
-- Name: ontology_schema_versions; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.ontology_schema_versions ENABLE ROW LEVEL SECURITY;

--
-- Name: organization_members; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.organization_members ENABLE ROW LEVEL SECURITY;

--
-- Name: organization_settings; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.organization_settings ENABLE ROW LEVEL SECURITY;

--
-- Name: organizations; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;

--
-- Name: products; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

--
-- Name: profiles; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

--
-- Name: regional_data; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.regional_data ENABLE ROW LEVEL SECURITY;

--
-- Name: report_schedules; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.report_schedules ENABLE ROW LEVEL SECURITY;

--
-- Name: scenario_comparisons; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.scenario_comparisons ENABLE ROW LEVEL SECURITY;

--
-- Name: scenarios; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.scenarios ENABLE ROW LEVEL SECURITY;

--
-- Name: simulation_results; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.simulation_results ENABLE ROW LEVEL SECURITY;

--
-- Name: store_mappings; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.store_mappings ENABLE ROW LEVEL SECURITY;

--
-- Name: store_scenes; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.store_scenes ENABLE ROW LEVEL SECURITY;

--
-- Name: stores; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.stores ENABLE ROW LEVEL SECURITY;

--
-- Name: subscriptions; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

--
-- Name: upload_sessions; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.upload_sessions ENABLE ROW LEVEL SECURITY;

--
-- Name: user_classification_patterns; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.user_classification_patterns ENABLE ROW LEVEL SECURITY;

--
-- Name: user_data_imports; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.user_data_imports ENABLE ROW LEVEL SECURITY;

--
-- Name: user_roles; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

--
-- Name: weather_data; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.weather_data ENABLE ROW LEVEL SECURITY;

--
-- Name: wifi_heatmap_cache; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.wifi_heatmap_cache ENABLE ROW LEVEL SECURITY;

--
-- Name: wifi_probe_data; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.wifi_probe_data ENABLE ROW LEVEL SECURITY;

--
-- Name: wifi_raw_signals; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.wifi_raw_signals ENABLE ROW LEVEL SECURITY;

--
-- Name: wifi_tracking; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.wifi_tracking ENABLE ROW LEVEL SECURITY;

--
-- Name: wifi_zones; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.wifi_zones ENABLE ROW LEVEL SECURITY;

--
-- PostgreSQL database dump complete
--


