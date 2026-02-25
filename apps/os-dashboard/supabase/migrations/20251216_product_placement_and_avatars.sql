-- =====================================================
-- NEURALTWIN v8.1: Product Placement & Avatar System
-- =====================================================
-- Version: 1.0.0 (FINAL - Idempotent)
-- Date: 2024-12-16
-- Description:
--   재실행 가능한 멱등성 스크립트
--   1. Product placement fields (products 테이블)
--   2. Staff avatar system (staff 테이블)
--   3. Customer avatar system (customers 테이블)
--   4. product_placements 테이블
--   5. furniture_slots 테이블
--   6. layout_optimization_results 테이블
-- =====================================================


-- =====================================================
-- PART 1: Product Placement Fields on products table
-- =====================================================

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'initial_furniture_id') THEN
    ALTER TABLE products ADD COLUMN initial_furniture_id UUID;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'slot_id') THEN
    ALTER TABLE products ADD COLUMN slot_id TEXT;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'model_3d_position') THEN
    ALTER TABLE products ADD COLUMN model_3d_position JSONB DEFAULT '{"x":0,"y":0,"z":0}'::jsonb;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'model_3d_rotation') THEN
    ALTER TABLE products ADD COLUMN model_3d_rotation JSONB DEFAULT '{"x":0,"y":0,"z":0}'::jsonb;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'model_3d_scale') THEN
    ALTER TABLE products ADD COLUMN model_3d_scale JSONB DEFAULT '{"x":1,"y":1,"z":1}'::jsonb;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'model_3d_url') THEN
    ALTER TABLE products ADD COLUMN model_3d_url TEXT;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'movable') THEN
    ALTER TABLE products ADD COLUMN movable BOOLEAN DEFAULT true;
  END IF;
  
  RAISE NOTICE '✓ Products table: placement columns added/verified';
END $$;


-- =====================================================
-- PART 2: Staff Avatar System
-- =====================================================

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'staff' AND column_name = 'avatar_url') THEN
    ALTER TABLE staff ADD COLUMN avatar_url TEXT;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'staff' AND column_name = 'avatar_position') THEN
    ALTER TABLE staff ADD COLUMN avatar_position JSONB DEFAULT '{"x":0,"y":0,"z":0}'::jsonb;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'staff' AND column_name = 'avatar_rotation') THEN
    ALTER TABLE staff ADD COLUMN avatar_rotation JSONB DEFAULT '{"x":0,"y":0,"z":0}'::jsonb;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'staff' AND column_name = 'avatar_scale') THEN
    ALTER TABLE staff ADD COLUMN avatar_scale JSONB DEFAULT '{"x":1,"y":1,"z":1}'::jsonb;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'staff' AND column_name = 'assigned_zone_id') THEN
    ALTER TABLE staff ADD COLUMN assigned_zone_id UUID;
  END IF;
  
  RAISE NOTICE '✓ Staff table: avatar columns added/verified';
END $$;


-- =====================================================
-- PART 3: Customer Avatar System
-- =====================================================

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'customers' AND column_name = 'avatar_url') THEN
    ALTER TABLE customers ADD COLUMN avatar_url TEXT;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'customers' AND column_name = 'avatar_type') THEN
    ALTER TABLE customers ADD COLUMN avatar_type TEXT;
  END IF;
  
  RAISE NOTICE '✓ Customers table: avatar columns added/verified';
END $$;


-- =====================================================
-- PART 4: Create product_placements table
-- =====================================================

CREATE TABLE IF NOT EXISTS product_placements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  org_id UUID REFERENCES organizations(id) ON DELETE CASCADE,

  -- Current placement
  current_zone_id UUID,
  current_furniture_id UUID,
  current_slot_id TEXT,
  current_position JSONB DEFAULT '{"x":0,"y":0,"z":0}'::jsonb,
  current_rotation JSONB DEFAULT '{"x":0,"y":0,"z":0}'::jsonb,

  -- Suggested placement (from AI optimization)
  suggested_zone_id UUID,
  suggested_furniture_id UUID,
  suggested_slot_id TEXT,
  suggested_position JSONB,
  suggested_rotation JSONB,

  -- Optimization metadata
  optimization_reason TEXT,
  expected_revenue_impact NUMERIC(5,2),
  expected_visibility_score NUMERIC(3,2),
  expected_accessibility_score NUMERIC(3,2),
  confidence NUMERIC(3,2),
  priority TEXT CHECK (priority IN ('high', 'medium', 'low')),

  -- Status
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'applied', 'rejected', 'expired')),
  applied_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes (IF NOT EXISTS)
CREATE INDEX IF NOT EXISTS idx_product_placements_product_id ON product_placements(product_id);
CREATE INDEX IF NOT EXISTS idx_product_placements_store_id ON product_placements(store_id);
CREATE INDEX IF NOT EXISTS idx_product_placements_status ON product_placements(status);


-- =====================================================
-- PART 5: Create furniture_slots table
-- =====================================================

CREATE TABLE IF NOT EXISTS furniture_slots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  furniture_id UUID NOT NULL,
  furniture_type TEXT NOT NULL,
  slot_id TEXT NOT NULL,
  slot_position JSONB NOT NULL DEFAULT '{"x":0,"y":0,"z":0}'::jsonb,
  slot_rotation JSONB DEFAULT '{"x":0,"y":0,"z":0}'::jsonb,
  max_product_width NUMERIC(5,2),
  max_product_height NUMERIC(5,2),
  max_product_depth NUMERIC(5,2),
  is_occupied BOOLEAN DEFAULT false,
  occupied_by_product_id UUID,
  store_id UUID REFERENCES stores(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),

  CONSTRAINT furniture_slots_unique UNIQUE (furniture_id, slot_id)
);

-- Indexes (IF NOT EXISTS)
CREATE INDEX IF NOT EXISTS idx_furniture_slots_furniture_id ON furniture_slots(furniture_id);
CREATE INDEX IF NOT EXISTS idx_furniture_slots_store_id ON furniture_slots(store_id);
CREATE INDEX IF NOT EXISTS idx_furniture_slots_is_occupied ON furniture_slots(is_occupied);


-- =====================================================
-- PART 6: Create layout_optimization_results table
-- =====================================================

CREATE TABLE IF NOT EXISTS layout_optimization_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  org_id UUID REFERENCES organizations(id) ON DELETE CASCADE,

  optimization_type TEXT NOT NULL CHECK (optimization_type IN ('furniture', 'product', 'both')),

  -- Results
  furniture_changes JSONB DEFAULT '[]'::jsonb,
  product_changes JSONB DEFAULT '[]'::jsonb,

  -- Summary
  total_furniture_changes INTEGER DEFAULT 0,
  total_product_changes INTEGER DEFAULT 0,
  expected_revenue_improvement NUMERIC(5,2),
  expected_traffic_improvement NUMERIC(5,2),
  expected_conversion_improvement NUMERIC(5,2),

  -- Status
  status TEXT DEFAULT 'generated' CHECK (status IN ('generated', 'reviewing', 'approved', 'applied', 'rejected')),
  reviewed_by UUID,
  reviewed_at TIMESTAMPTZ,
  applied_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes (IF NOT EXISTS)
CREATE INDEX IF NOT EXISTS idx_layout_optimization_results_store_id ON layout_optimization_results(store_id);
CREATE INDEX IF NOT EXISTS idx_layout_optimization_results_status ON layout_optimization_results(status);


-- =====================================================
-- PART 7: RLS Policies (DROP IF EXISTS + CREATE)
-- =====================================================

-- Enable RLS
ALTER TABLE product_placements ENABLE ROW LEVEL SECURITY;
ALTER TABLE furniture_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE layout_optimization_results ENABLE ROW LEVEL SECURITY;

-- Product Placements RLS
DROP POLICY IF EXISTS "Users can view own product placements" ON product_placements;
DROP POLICY IF EXISTS "Users can insert own product placements" ON product_placements;
DROP POLICY IF EXISTS "Users can update own product placements" ON product_placements;
DROP POLICY IF EXISTS "Users can delete own product placements" ON product_placements;

CREATE POLICY "Users can view own product placements" ON product_placements
  FOR SELECT USING (auth.uid() = user_id OR store_id IN (SELECT id FROM stores WHERE user_id = auth.uid()));

CREATE POLICY "Users can insert own product placements" ON product_placements
  FOR INSERT WITH CHECK (auth.uid() = user_id OR store_id IN (SELECT id FROM stores WHERE user_id = auth.uid()));

CREATE POLICY "Users can update own product placements" ON product_placements
  FOR UPDATE USING (auth.uid() = user_id OR store_id IN (SELECT id FROM stores WHERE user_id = auth.uid()));

CREATE POLICY "Users can delete own product placements" ON product_placements
  FOR DELETE USING (auth.uid() = user_id OR store_id IN (SELECT id FROM stores WHERE user_id = auth.uid()));

-- Furniture Slots RLS
DROP POLICY IF EXISTS "Users can view own furniture slots" ON furniture_slots;
DROP POLICY IF EXISTS "Users can insert own furniture slots" ON furniture_slots;
DROP POLICY IF EXISTS "Users can update own furniture slots" ON furniture_slots;
DROP POLICY IF EXISTS "Users can delete own furniture slots" ON furniture_slots;

CREATE POLICY "Users can view own furniture slots" ON furniture_slots
  FOR SELECT USING (auth.uid() = user_id OR store_id IN (SELECT id FROM stores WHERE user_id = auth.uid()));

CREATE POLICY "Users can insert own furniture slots" ON furniture_slots
  FOR INSERT WITH CHECK (auth.uid() = user_id OR store_id IN (SELECT id FROM stores WHERE user_id = auth.uid()));

CREATE POLICY "Users can update own furniture slots" ON furniture_slots
  FOR UPDATE USING (auth.uid() = user_id OR store_id IN (SELECT id FROM stores WHERE user_id = auth.uid()));

CREATE POLICY "Users can delete own furniture slots" ON furniture_slots
  FOR DELETE USING (auth.uid() = user_id OR store_id IN (SELECT id FROM stores WHERE user_id = auth.uid()));

-- Layout Optimization Results RLS
DROP POLICY IF EXISTS "Users can view own optimization results" ON layout_optimization_results;
DROP POLICY IF EXISTS "Users can insert own optimization results" ON layout_optimization_results;
DROP POLICY IF EXISTS "Users can update own optimization results" ON layout_optimization_results;
DROP POLICY IF EXISTS "Users can delete own optimization results" ON layout_optimization_results;

CREATE POLICY "Users can view own optimization results" ON layout_optimization_results
  FOR SELECT USING (auth.uid() = user_id OR store_id IN (SELECT id FROM stores WHERE user_id = auth.uid()));

CREATE POLICY "Users can insert own optimization results" ON layout_optimization_results
  FOR INSERT WITH CHECK (auth.uid() = user_id OR store_id IN (SELECT id FROM stores WHERE user_id = auth.uid()));

CREATE POLICY "Users can update own optimization results" ON layout_optimization_results
  FOR UPDATE USING (auth.uid() = user_id OR store_id IN (SELECT id FROM stores WHERE user_id = auth.uid()));

CREATE POLICY "Users can delete own optimization results" ON layout_optimization_results
  FOR DELETE USING (auth.uid() = user_id OR store_id IN (SELECT id FROM stores WHERE user_id = auth.uid()));


-- =====================================================
-- PART 8: Updated_at Triggers
-- =====================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_product_placements_updated_at ON product_placements;
CREATE TRIGGER update_product_placements_updated_at
  BEFORE UPDATE ON product_placements
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_furniture_slots_updated_at ON furniture_slots;
CREATE TRIGGER update_furniture_slots_updated_at
  BEFORE UPDATE ON furniture_slots
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_layout_optimization_results_updated_at ON layout_optimization_results;
CREATE TRIGGER update_layout_optimization_results_updated_at
  BEFORE UPDATE ON layout_optimization_results
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();


-- =====================================================
-- PART 9: Comments
-- =====================================================

COMMENT ON TABLE product_placements IS 'Product placement tracking with AI optimization suggestions';
COMMENT ON TABLE furniture_slots IS 'Furniture slot definitions for product placement';
COMMENT ON TABLE layout_optimization_results IS 'AI-generated layout optimization results';

COMMENT ON COLUMN staff.avatar_url IS '3D avatar model URL for staff visualization';
COMMENT ON COLUMN staff.avatar_position IS '3D position of staff avatar in store';
COMMENT ON COLUMN staff.avatar_rotation IS '3D rotation of staff avatar';
COMMENT ON COLUMN staff.avatar_scale IS '3D scale of staff avatar';

COMMENT ON COLUMN customers.avatar_url IS '3D avatar model URL for customer simulation';
COMMENT ON COLUMN customers.avatar_type IS 'Customer segment type for avatar selection (vip/regular/new)';

COMMENT ON COLUMN products.initial_furniture_id IS 'Initial furniture where product is placed';
COMMENT ON COLUMN products.slot_id IS 'Slot ID within the furniture (A1, B2, etc.)';
COMMENT ON COLUMN products.model_3d_position IS '3D position of product model';
COMMENT ON COLUMN products.model_3d_url IS '3D model URL for product visualization';


-- =====================================================
-- PART 10: Summary
-- =====================================================

DO $$
DECLARE
  v_pp_count INT;
  v_fs_count INT;
  v_lor_count INT;
BEGIN
  SELECT COUNT(*) INTO v_pp_count FROM information_schema.columns WHERE table_name = 'product_placements';
  SELECT COUNT(*) INTO v_fs_count FROM information_schema.columns WHERE table_name = 'furniture_slots';
  SELECT COUNT(*) INTO v_lor_count FROM information_schema.columns WHERE table_name = 'layout_optimization_results';

  RAISE NOTICE '';
  RAISE NOTICE '════════════════════════════════════════════════════════════════';
  RAISE NOTICE 'NEURALTWIN v8.1 Migration Complete (Idempotent)';
  RAISE NOTICE '════════════════════════════════════════════════════════════════';
  RAISE NOTICE '✓ products: 7 columns added (placement, 3D model)';
  RAISE NOTICE '✓ staff: 5 columns added (avatar)';
  RAISE NOTICE '✓ customers: 2 columns added (avatar)';
  RAISE NOTICE '✓ product_placements: % columns', v_pp_count;
  RAISE NOTICE '✓ furniture_slots: % columns', v_fs_count;
  RAISE NOTICE '✓ layout_optimization_results: % columns', v_lor_count;
  RAISE NOTICE '✓ RLS policies: 12 policies created';
  RAISE NOTICE '✓ Triggers: 3 triggers created';
  RAISE NOTICE '';
  RAISE NOTICE '이 스크립트는 여러 번 재실행해도 안전합니다.';
  RAISE NOTICE '════════════════════════════════════════════════════════════════';
END $$;
