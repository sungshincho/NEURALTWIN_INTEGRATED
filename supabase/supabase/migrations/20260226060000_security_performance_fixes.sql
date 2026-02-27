-- Phase 5 Sprint B: Security & Performance Fixes
-- 1. RLS activation for chat_context_memory
-- 2. Storage bucket security constraints
-- 3. Critical FK indexes (high-traffic tables)

-- ============================================================
-- 1. chat_context_memory RLS
-- ============================================================

-- Enable RLS
ALTER TABLE public.chat_context_memory ENABLE ROW LEVEL SECURITY;

-- Policy: users can read their own context memory
CREATE POLICY "Users can read own context memory"
  ON public.chat_context_memory
  FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: users can insert their own context memory
CREATE POLICY "Users can insert own context memory"
  ON public.chat_context_memory
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy: users can update their own context memory
CREATE POLICY "Users can update own context memory"
  ON public.chat_context_memory
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Policy: users can delete their own context memory
CREATE POLICY "Users can delete own context memory"
  ON public.chat_context_memory
  FOR DELETE
  USING (auth.uid() = user_id);

-- Note: service_role (used by retail-chatbot EF) bypasses RLS automatically


-- ============================================================
-- 2. Storage bucket security
-- ============================================================

-- avatars: limit to 5MB, image types only
UPDATE storage.buckets
SET file_size_limit = 5242880,  -- 5MB
    allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml']
WHERE id = 'avatars';

-- chat-attachments: limit to 10MB, common safe types
UPDATE storage.buckets
SET file_size_limit = 10485760,  -- 10MB
    allowed_mime_types = ARRAY[
      'image/jpeg', 'image/png', 'image/gif', 'image/webp',
      'application/pdf',
      'text/plain', 'text/csv',
      'application/json'
    ]
WHERE id = 'chat-attachments';

-- store-data: limit to 50MB (same as user-imports)
UPDATE storage.buckets
SET file_size_limit = 52428800  -- 50MB
WHERE id = 'store-data';


-- ============================================================
-- 3. Critical FK indexes (tables with 1,000+ rows)
-- ============================================================

-- zone_events (37,109 rows)
CREATE INDEX IF NOT EXISTS idx_zone_events_customer_id
  ON public.zone_events(customer_id);
CREATE INDEX IF NOT EXISTS idx_zone_events_org_id
  ON public.zone_events(org_id);

-- funnel_events (26,588 rows)
CREATE INDEX IF NOT EXISTS idx_funnel_events_zone_id
  ON public.funnel_events(zone_id);
CREATE INDEX IF NOT EXISTS idx_funnel_events_customer_id
  ON public.funnel_events(customer_id);
CREATE INDEX IF NOT EXISTS idx_funnel_events_org_id
  ON public.funnel_events(org_id);

-- visit_zone_events (24,626 rows)
CREATE INDEX IF NOT EXISTS idx_visit_zone_events_org_id
  ON public.visit_zone_events(org_id);

-- line_items (8,194 rows)
CREATE INDEX IF NOT EXISTS idx_line_items_org_id
  ON public.line_items(org_id);
CREATE INDEX IF NOT EXISTS idx_line_items_purchase_id
  ON public.line_items(purchase_id);

-- transactions (4,109 rows)
CREATE INDEX IF NOT EXISTS idx_transactions_org_id
  ON public.transactions(org_id);
CREATE INDEX IF NOT EXISTS idx_transactions_visit_id
  ON public.transactions(visit_id);

-- customers (2,500 rows)
CREATE INDEX IF NOT EXISTS idx_customers_store_id
  ON public.customers(store_id);
