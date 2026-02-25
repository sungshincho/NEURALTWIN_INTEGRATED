-- ============================================================================
-- Add Missing Columns and Tables
-- ============================================================================

-- 1. Add supplier column to products table
ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS supplier TEXT;

-- 2. Create store_scenes table for 3D scene management
CREATE TABLE IF NOT EXISTS public.store_scenes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  org_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
  store_id UUID REFERENCES public.stores(id) ON DELETE CASCADE,
  scene_name TEXT NOT NULL,
  scene_type TEXT DEFAULT '3d_layout',
  recipe_data JSONB DEFAULT '{}'::jsonb,
  is_active BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(store_id, scene_name)
);

-- Enable RLS
ALTER TABLE public.store_scenes ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Org members can view org store scenes"
ON public.store_scenes FOR SELECT
USING (
  (org_id IS NULL AND auth.uid() = user_id) OR
  (org_id IS NOT NULL AND is_org_member(auth.uid(), org_id))
);

CREATE POLICY "Org members can create org store scenes"
ON public.store_scenes FOR INSERT
WITH CHECK (
  (org_id IS NULL AND auth.uid() = user_id) OR
  (org_id IS NOT NULL AND is_org_member(auth.uid(), org_id))
);

CREATE POLICY "Org members can update org store scenes"
ON public.store_scenes FOR UPDATE
USING (
  (org_id IS NULL AND auth.uid() = user_id) OR
  (org_id IS NOT NULL AND is_org_member(auth.uid(), org_id))
);

CREATE POLICY "Org admins can delete org store scenes"
ON public.store_scenes FOR DELETE
USING (
  (org_id IS NULL AND auth.uid() = user_id) OR
  (org_id IS NOT NULL AND is_org_admin(auth.uid(), org_id))
);

-- Trigger for updated_at
CREATE TRIGGER update_store_scenes_updated_at
BEFORE UPDATE ON public.store_scenes
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Indexes
CREATE INDEX IF NOT EXISTS idx_store_scenes_store ON public.store_scenes(store_id);
CREATE INDEX IF NOT EXISTS idx_store_scenes_org ON public.store_scenes(org_id);
CREATE INDEX IF NOT EXISTS idx_store_scenes_active ON public.store_scenes(is_active) WHERE is_active = true;