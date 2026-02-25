-- ============================================================================
-- Database Migration: Fix Schema Mismatches
-- ============================================================================

-- 1. Add missing columns to stores table
ALTER TABLE public.stores 
ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;

-- 2. Add missing columns to products table
ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS name TEXT,
ADD COLUMN IF NOT EXISTS selling_price NUMERIC;

-- Update existing data: copy product_name to name, price to selling_price
UPDATE public.products 
SET name = product_name, 
    selling_price = price 
WHERE name IS NULL OR selling_price IS NULL;

-- Make name required going forward
ALTER TABLE public.products 
ALTER COLUMN name SET NOT NULL;

-- 3. Add missing columns to wifi_tracking table
ALTER TABLE public.wifi_tracking 
ADD COLUMN IF NOT EXISTS session_id TEXT;

-- 4. Add missing columns to user_data_imports table
ALTER TABLE public.user_data_imports 
ADD COLUMN IF NOT EXISTS progress INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS can_pause BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS can_resume BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS error_details JSONB DEFAULT NULL;

-- 5. Fix scenarios table schema
ALTER TABLE public.scenarios 
ADD COLUMN IF NOT EXISTS predicted_kpi JSONB DEFAULT NULL;

-- 6. Create store_mappings table (for HQ-Store sync)
CREATE TABLE IF NOT EXISTS public.store_mappings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  org_id UUID,
  hq_store_id UUID REFERENCES public.hq_store_master(id) ON DELETE CASCADE,
  local_store_id UUID REFERENCES public.stores(id) ON DELETE CASCADE,
  sync_status TEXT DEFAULT 'active',
  last_synced_at TIMESTAMP WITH TIME ZONE,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(hq_store_id, local_store_id)
);

-- Enable RLS on store_mappings
ALTER TABLE public.store_mappings ENABLE ROW LEVEL SECURITY;

-- RLS policies for store_mappings
CREATE POLICY "Org members can view org store mappings"
ON public.store_mappings FOR SELECT
USING (
  (org_id IS NULL AND auth.uid() = user_id) OR
  (org_id IS NOT NULL AND is_org_member(auth.uid(), org_id))
);

CREATE POLICY "Org admins can create org store mappings"
ON public.store_mappings FOR INSERT
WITH CHECK (
  (org_id IS NULL AND auth.uid() = user_id) OR
  (org_id IS NOT NULL AND is_org_admin(auth.uid(), org_id))
);

CREATE POLICY "Org admins can update org store mappings"
ON public.store_mappings FOR UPDATE
USING (
  (org_id IS NULL AND auth.uid() = user_id) OR
  (org_id IS NOT NULL AND is_org_admin(auth.uid(), org_id))
);

CREATE POLICY "Org admins can delete org store mappings"
ON public.store_mappings FOR DELETE
USING (
  (org_id IS NULL AND auth.uid() = user_id) OR
  (org_id IS NOT NULL AND is_org_admin(auth.uid(), org_id))
);

-- 7. Create weather_data table
CREATE TABLE IF NOT EXISTS public.weather_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  org_id UUID,
  store_id UUID REFERENCES public.stores(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  temperature NUMERIC,
  humidity NUMERIC,
  precipitation NUMERIC,
  weather_condition TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(store_id, date)
);

-- Enable RLS on weather_data
ALTER TABLE public.weather_data ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org members can view org weather data"
ON public.weather_data FOR SELECT
USING (
  (org_id IS NULL AND auth.uid() = user_id) OR
  (org_id IS NOT NULL AND is_org_member(auth.uid(), org_id))
);

CREATE POLICY "Org members can create org weather data"
ON public.weather_data FOR INSERT
WITH CHECK (
  (org_id IS NULL AND auth.uid() = user_id) OR
  (org_id IS NOT NULL AND is_org_member(auth.uid(), org_id))
);

CREATE POLICY "Org members can update org weather data"
ON public.weather_data FOR UPDATE
USING (
  (org_id IS NULL AND auth.uid() = user_id) OR
  (org_id IS NOT NULL AND is_org_member(auth.uid(), org_id))
);

CREATE POLICY "Org admins can delete org weather data"
ON public.weather_data FOR DELETE
USING (
  (org_id IS NULL AND auth.uid() = user_id) OR
  (org_id IS NOT NULL AND is_org_admin(auth.uid(), org_id))
);

-- 8. Create regional_data table
CREATE TABLE IF NOT EXISTS public.regional_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  org_id UUID,
  region TEXT NOT NULL,
  date DATE NOT NULL,
  population NUMERIC,
  gdp NUMERIC,
  unemployment_rate NUMERIC,
  consumer_confidence NUMERIC,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(region, date)
);

-- Enable RLS on regional_data
ALTER TABLE public.regional_data ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org members can view org regional data"
ON public.regional_data FOR SELECT
USING (
  (org_id IS NULL AND auth.uid() = user_id) OR
  (org_id IS NOT NULL AND is_org_member(auth.uid(), org_id))
);

CREATE POLICY "Org members can create org regional data"
ON public.regional_data FOR INSERT
WITH CHECK (
  (org_id IS NULL AND auth.uid() = user_id) OR
  (org_id IS NOT NULL AND is_org_member(auth.uid(), org_id))
);

CREATE POLICY "Org members can update org regional data"
ON public.regional_data FOR UPDATE
USING (
  (org_id IS NULL AND auth.uid() = user_id) OR
  (org_id IS NOT NULL AND is_org_member(auth.uid(), org_id))
);

CREATE POLICY "Org admins can delete org regional data"
ON public.regional_data FOR DELETE
USING (
  (org_id IS NULL AND auth.uid() = user_id) OR
  (org_id IS NOT NULL AND is_org_admin(auth.uid(), org_id))
);

-- 9. Create triggers for updated_at
CREATE TRIGGER update_store_mappings_updated_at
BEFORE UPDATE ON public.store_mappings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_weather_data_updated_at
BEFORE UPDATE ON public.weather_data
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_regional_data_updated_at
BEFORE UPDATE ON public.regional_data
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- 10. Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_store_mappings_hq_store ON public.store_mappings(hq_store_id);
CREATE INDEX IF NOT EXISTS idx_store_mappings_local_store ON public.store_mappings(local_store_id);
CREATE INDEX IF NOT EXISTS idx_store_mappings_org ON public.store_mappings(org_id);
CREATE INDEX IF NOT EXISTS idx_weather_data_store_date ON public.weather_data(store_id, date);
CREATE INDEX IF NOT EXISTS idx_regional_data_region_date ON public.regional_data(region, date);