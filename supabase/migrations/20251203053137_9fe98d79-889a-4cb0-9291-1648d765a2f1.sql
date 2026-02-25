-- =====================================================
-- 누락된 5개 테이블 생성
-- =====================================================

-- 1. inventory_movements (재고 이동 이력)
CREATE TABLE public.inventory_movements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID REFERENCES public.organizations(id),
  store_id UUID REFERENCES public.stores(id),
  product_id UUID REFERENCES public.products(id),
  movement_type TEXT NOT NULL, -- 'in', 'out', 'adjustment', 'transfer'
  quantity INTEGER NOT NULL,
  previous_stock INTEGER,
  new_stock INTEGER,
  reason TEXT,
  reference_id UUID, -- purchase_id, transfer_id 등
  moved_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  metadata JSONB DEFAULT '{}'::jsonb
);

-- 2. customer_segments (고객 세그먼트 정의)
CREATE TABLE public.customer_segments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID REFERENCES public.organizations(id),
  store_id UUID REFERENCES public.stores(id),
  segment_name TEXT NOT NULL,
  segment_code TEXT NOT NULL,
  description TEXT,
  criteria JSONB DEFAULT '{}'::jsonb, -- 세그먼트 조건 정의
  customer_count INTEGER DEFAULT 0,
  avg_ltv NUMERIC,
  avg_purchase_frequency NUMERIC,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 3. staff (직원 정보)
CREATE TABLE public.staff (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID REFERENCES public.organizations(id),
  store_id UUID REFERENCES public.stores(id),
  user_id UUID,
  staff_code TEXT,
  staff_name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  role TEXT, -- 'manager', 'sales', 'cashier', 'stock'
  department TEXT,
  hire_date DATE,
  hourly_rate NUMERIC,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  metadata JSONB DEFAULT '{}'::jsonb
);

-- 4. shift_schedules (근무 스케줄)
CREATE TABLE public.shift_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID REFERENCES public.organizations(id),
  store_id UUID REFERENCES public.stores(id),
  staff_id UUID REFERENCES public.staff(id),
  shift_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  break_minutes INTEGER DEFAULT 0,
  actual_start_time TIME,
  actual_end_time TIME,
  status TEXT DEFAULT 'scheduled', -- 'scheduled', 'in_progress', 'completed', 'absent'
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 5. product_sales_daily (상품별 일별 판매 집계)
CREATE TABLE public.product_sales_daily (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID REFERENCES public.organizations(id),
  store_id UUID REFERENCES public.stores(id),
  product_id UUID REFERENCES public.products(id),
  date DATE NOT NULL,
  units_sold INTEGER DEFAULT 0,
  revenue NUMERIC DEFAULT 0,
  cost NUMERIC DEFAULT 0,
  profit NUMERIC DEFAULT 0,
  avg_price NUMERIC,
  discount_amount NUMERIC DEFAULT 0,
  return_units INTEGER DEFAULT 0,
  return_amount NUMERIC DEFAULT 0,
  calculated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  metadata JSONB DEFAULT '{}'::jsonb
);

-- =====================================================
-- 인덱스 생성
-- =====================================================

-- inventory_movements 인덱스
CREATE INDEX idx_inventory_movements_org ON public.inventory_movements(org_id);
CREATE INDEX idx_inventory_movements_store ON public.inventory_movements(store_id);
CREATE INDEX idx_inventory_movements_product ON public.inventory_movements(product_id);
CREATE INDEX idx_inventory_movements_moved_at ON public.inventory_movements(moved_at);
CREATE INDEX idx_inventory_movements_type ON public.inventory_movements(movement_type);

-- customer_segments 인덱스
CREATE INDEX idx_customer_segments_org ON public.customer_segments(org_id);
CREATE INDEX idx_customer_segments_store ON public.customer_segments(store_id);
CREATE INDEX idx_customer_segments_code ON public.customer_segments(segment_code);

-- staff 인덱스
CREATE INDEX idx_staff_org ON public.staff(org_id);
CREATE INDEX idx_staff_store ON public.staff(store_id);
CREATE INDEX idx_staff_code ON public.staff(staff_code);
CREATE INDEX idx_staff_active ON public.staff(is_active);

-- shift_schedules 인덱스
CREATE INDEX idx_shift_schedules_org ON public.shift_schedules(org_id);
CREATE INDEX idx_shift_schedules_store ON public.shift_schedules(store_id);
CREATE INDEX idx_shift_schedules_staff ON public.shift_schedules(staff_id);
CREATE INDEX idx_shift_schedules_date ON public.shift_schedules(shift_date);
CREATE INDEX idx_shift_schedules_status ON public.shift_schedules(status);

-- product_sales_daily 인덱스
CREATE INDEX idx_product_sales_daily_org ON public.product_sales_daily(org_id);
CREATE INDEX idx_product_sales_daily_store ON public.product_sales_daily(store_id);
CREATE INDEX idx_product_sales_daily_product ON public.product_sales_daily(product_id);
CREATE INDEX idx_product_sales_daily_date ON public.product_sales_daily(date);
CREATE INDEX idx_product_sales_daily_store_date ON public.product_sales_daily(store_id, date);

-- =====================================================
-- RLS 정책 설정
-- =====================================================

ALTER TABLE public.inventory_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_segments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.staff ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shift_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_sales_daily ENABLE ROW LEVEL SECURITY;

-- inventory_movements RLS
CREATE POLICY "org_rls" ON public.inventory_movements
  FOR ALL USING (
    org_id IS NULL OR EXISTS (
      SELECT 1 FROM organization_members om
      WHERE om.user_id = auth.uid() AND om.org_id = inventory_movements.org_id
    )
  );

-- customer_segments RLS
CREATE POLICY "org_rls" ON public.customer_segments
  FOR ALL USING (
    org_id IS NULL OR EXISTS (
      SELECT 1 FROM organization_members om
      WHERE om.user_id = auth.uid() AND om.org_id = customer_segments.org_id
    )
  );

-- staff RLS
CREATE POLICY "org_rls" ON public.staff
  FOR ALL USING (
    org_id IS NULL OR EXISTS (
      SELECT 1 FROM organization_members om
      WHERE om.user_id = auth.uid() AND om.org_id = staff.org_id
    )
  );

-- shift_schedules RLS
CREATE POLICY "org_rls" ON public.shift_schedules
  FOR ALL USING (
    org_id IS NULL OR EXISTS (
      SELECT 1 FROM organization_members om
      WHERE om.user_id = auth.uid() AND om.org_id = shift_schedules.org_id
    )
  );

-- product_sales_daily RLS
CREATE POLICY "org_rls" ON public.product_sales_daily
  FOR ALL USING (
    org_id IS NULL OR EXISTS (
      SELECT 1 FROM organization_members om
      WHERE om.user_id = auth.uid() AND om.org_id = product_sales_daily.org_id
    )
  );

-- =====================================================
-- updated_at 트리거 설정
-- =====================================================

CREATE TRIGGER update_customer_segments_updated_at
  BEFORE UPDATE ON public.customer_segments
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_staff_updated_at
  BEFORE UPDATE ON public.staff
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_shift_schedules_updated_at
  BEFORE UPDATE ON public.shift_schedules
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();