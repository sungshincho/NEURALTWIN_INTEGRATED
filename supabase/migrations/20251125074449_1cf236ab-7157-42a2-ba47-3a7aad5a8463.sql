-- Add status column to licenses table first
ALTER TABLE public.licenses
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'expired', 'revoked'));

-- Add missing columns to licenses table
ALTER TABLE public.licenses
ADD COLUMN IF NOT EXISTS subscription_id UUID REFERENCES public.subscriptions(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS license_key TEXT,
ADD COLUMN IF NOT EXISTS issued_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
ADD COLUMN IF NOT EXISTS activated_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS last_used_at TIMESTAMP WITH TIME ZONE;

-- Migrate is_active to status if needed
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'licenses' AND column_name = 'is_active') THEN
    UPDATE public.licenses SET status = CASE WHEN is_active THEN 'active' ELSE 'inactive' END WHERE status IS NULL;
    ALTER TABLE public.licenses DROP COLUMN is_active;
  END IF;
END $$;

-- Make license_key unique if it exists
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'licenses_license_key_key'
  ) THEN
    ALTER TABLE public.licenses ADD CONSTRAINT licenses_license_key_key UNIQUE (license_key);
  END IF;
END $$;

-- Update licenses table license_type check constraint
ALTER TABLE public.licenses
DROP CONSTRAINT IF EXISTS licenses_license_type_check,
ADD CONSTRAINT licenses_license_type_check CHECK (license_type IN ('STORE', 'HQ', 'ENTERPRISE'));

-- Add missing columns to stores table
ALTER TABLE public.stores
ADD COLUMN IF NOT EXISTS store_code TEXT,
ADD COLUMN IF NOT EXISTS city TEXT,
ADD COLUMN IF NOT EXISTS timezone TEXT DEFAULT 'Asia/Seoul',
ADD COLUMN IF NOT EXISTS floor_area_sqm NUMERIC(10,2),
ADD COLUMN IF NOT EXISTS license_id UUID REFERENCES public.licenses(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS country TEXT DEFAULT 'KR';

-- Ensure store_name column exists
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'stores' AND column_name = 'store_name') THEN
    ALTER TABLE public.stores ADD COLUMN store_name TEXT;
  END IF;
END $$;

-- Add unique constraint for store_code if not exists
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'stores_org_id_store_code_key'
  ) THEN
    ALTER TABLE public.stores ADD CONSTRAINT stores_org_id_store_code_key UNIQUE (org_id, store_code);
  END IF;
EXCEPTION WHEN others THEN
  NULL; -- Ignore if constraint already exists or can't be created
END $$;

-- Update subscriptions to add missing columns
ALTER TABLE public.subscriptions
ADD COLUMN IF NOT EXISTS start_date TIMESTAMP WITH TIME ZONE DEFAULT now(),
ADD COLUMN IF NOT EXISTS end_date TIMESTAMP WITH TIME ZONE;

-- Rename billing columns if needed
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'subscriptions' AND column_name = 'billing_cycle_start') THEN
    UPDATE public.subscriptions SET start_date = billing_cycle_start WHERE start_date IS NULL;
    ALTER TABLE public.subscriptions DROP COLUMN billing_cycle_start CASCADE;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'subscriptions' AND column_name = 'billing_cycle_end') THEN
    UPDATE public.subscriptions SET end_date = billing_cycle_end WHERE end_date IS NULL;
    ALTER TABLE public.subscriptions DROP COLUMN billing_cycle_end CASCADE;
  END IF;
END $$;

-- Update subscriptions status check constraint
ALTER TABLE public.subscriptions
DROP CONSTRAINT IF EXISTS subscriptions_status_check,
ADD CONSTRAINT subscriptions_status_check CHECK (status IN ('active', 'cancelled', 'expired', 'trial'));

-- Create ontology_schemas table
CREATE TABLE IF NOT EXISTS public.ontology_schemas (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  schema_name TEXT NOT NULL UNIQUE,
  version TEXT NOT NULL,
  schema_type TEXT NOT NULL CHECK (schema_type IN ('PRODUCT', 'STORE', 'CUSTOMER', 'TRANSACTION', 'CUSTOM')),
  schema_definition JSONB NOT NULL,
  is_master BOOLEAN NOT NULL DEFAULT false,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'deprecated', 'draft')),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create etl_pipelines table
CREATE TABLE IF NOT EXISTS public.etl_pipelines (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  pipeline_name TEXT NOT NULL,
  source_type TEXT NOT NULL CHECK (source_type IN ('API', 'DATABASE', 'FILE', 'STREAM', 'MANUAL')),
  target_type TEXT NOT NULL CHECK (target_type IN ('STORE_DATA', 'PRODUCT_DATA', 'CUSTOMER_DATA', 'TRANSACTION_DATA')),
  schedule_cron TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused', 'failed', 'completed')),
  last_run_at TIMESTAMP WITH TIME ZONE,
  next_run_at TIMESTAMP WITH TIME ZONE,
  config JSONB NOT NULL DEFAULT '{}'::jsonb,
  error_log TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(org_id, pipeline_name)
);

-- Create simulation_configs table
CREATE TABLE IF NOT EXISTS public.simulation_configs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  store_id UUID REFERENCES public.stores(id) ON DELETE CASCADE,
  config_name TEXT NOT NULL,
  simulation_type TEXT NOT NULL CHECK (simulation_type IN ('LAYOUT', 'FOOTFALL', 'INVENTORY', 'PRICING', 'STAFF')),
  parameters JSONB NOT NULL DEFAULT '{}'::jsonb,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'running', 'completed', 'failed')),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  results JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on new tables
ALTER TABLE public.ontology_schemas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.etl_pipelines ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.simulation_configs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for ontology_schemas
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'ontology_schemas' AND policyname = 'Anyone can view active ontology schemas') THEN
    CREATE POLICY "Anyone can view active ontology schemas"
      ON public.ontology_schemas FOR SELECT
      USING (status = 'active' OR created_by = auth.uid());
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'ontology_schemas' AND policyname = 'NEURALTWIN admins can manage ontology schemas') THEN
    CREATE POLICY "NEURALTWIN admins can manage ontology schemas"
      ON public.ontology_schemas FOR ALL
      USING (public.is_neuraltwin_admin(auth.uid()));
  END IF;
END $$;

-- RLS Policies for etl_pipelines
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'etl_pipelines' AND policyname = 'Org members can view their ETL pipelines') THEN
    CREATE POLICY "Org members can view their ETL pipelines"
      ON public.etl_pipelines FOR SELECT
      USING (org_id IN (
        SELECT org_id FROM public.organization_members
        WHERE user_id = auth.uid()
      ));
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'etl_pipelines' AND policyname = 'Org owners and admins can manage ETL pipelines') THEN
    CREATE POLICY "Org owners and admins can manage ETL pipelines"
      ON public.etl_pipelines FOR ALL
      USING (org_id IN (
        SELECT org_id FROM public.organization_members
        WHERE user_id = auth.uid()
          AND role IN ('ORG_OWNER', 'ORG_ADMIN')
      ));
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'etl_pipelines' AND policyname = 'NEURALTWIN admins have full access to ETL pipelines') THEN
    CREATE POLICY "NEURALTWIN admins have full access to ETL pipelines"
      ON public.etl_pipelines FOR ALL
      USING (public.is_neuraltwin_admin(auth.uid()));
  END IF;
END $$;

-- RLS Policies for simulation_configs  
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'simulation_configs' AND policyname = 'Org members can view their simulation configs') THEN
    CREATE POLICY "Org members can view their simulation configs"
      ON public.simulation_configs FOR SELECT
      USING (org_id IN (
        SELECT org_id FROM public.organization_members
        WHERE user_id = auth.uid()
      ));
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'simulation_configs' AND policyname = 'Org members can create simulation configs') THEN
    CREATE POLICY "Org members can create simulation configs"
      ON public.simulation_configs FOR INSERT
      WITH CHECK (org_id IN (
        SELECT org_id FROM public.organization_members
        WHERE user_id = auth.uid()
      ) AND created_by = auth.uid());
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'simulation_configs' AND policyname = 'Org owners and admins can manage simulation configs') THEN
    CREATE POLICY "Org owners and admins can manage simulation configs"
      ON public.simulation_configs FOR ALL
      USING (org_id IN (
        SELECT org_id FROM public.organization_members
        WHERE user_id = auth.uid()
          AND role IN ('ORG_OWNER', 'ORG_ADMIN')
      ));
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'simulation_configs' AND policyname = 'NEURALTWIN admins have full access to simulation configs') THEN
    CREATE POLICY "NEURALTWIN admins have full access to simulation configs"
      ON public.simulation_configs FOR ALL
      USING (public.is_neuraltwin_admin(auth.uid()));
  END IF;
END $$;

-- Create triggers for updated_at columns
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_ontology_schemas_updated_at') THEN
    CREATE TRIGGER update_ontology_schemas_updated_at
      BEFORE UPDATE ON public.ontology_schemas
      FOR EACH ROW
      EXECUTE FUNCTION public.update_updated_at_column();
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_etl_pipelines_updated_at') THEN
    CREATE TRIGGER update_etl_pipelines_updated_at
      BEFORE UPDATE ON public.etl_pipelines
      FOR EACH ROW
      EXECUTE FUNCTION public.update_updated_at_column();
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_simulation_configs_updated_at') THEN
    CREATE TRIGGER update_simulation_configs_updated_at
      BEFORE UPDATE ON public.simulation_configs
      FOR EACH ROW
      EXECUTE FUNCTION public.update_updated_at_column();
  END IF;
END $$;

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_licenses_subscription_id ON public.licenses(subscription_id);
CREATE INDEX IF NOT EXISTS idx_licenses_license_key ON public.licenses(license_key);
CREATE INDEX IF NOT EXISTS idx_licenses_status ON public.licenses(status);

CREATE INDEX IF NOT EXISTS idx_stores_license_id ON public.stores(license_id);
CREATE INDEX IF NOT EXISTS idx_stores_store_code ON public.stores(store_code);

CREATE INDEX IF NOT EXISTS idx_ontology_schemas_schema_name ON public.ontology_schemas(schema_name);
CREATE INDEX IF NOT EXISTS idx_ontology_schemas_status ON public.ontology_schemas(status);

CREATE INDEX IF NOT EXISTS idx_etl_pipelines_org_id ON public.etl_pipelines(org_id);
CREATE INDEX IF NOT EXISTS idx_etl_pipelines_status ON public.etl_pipelines(status);

CREATE INDEX IF NOT EXISTS idx_simulation_configs_org_id ON public.simulation_configs(org_id);
CREATE INDEX IF NOT EXISTS idx_simulation_configs_store_id ON public.simulation_configs(store_id);
CREATE INDEX IF NOT EXISTS idx_simulation_configs_status ON public.simulation_configs(status);