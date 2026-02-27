-- =============================================================
-- neuralsense_live_state: Real-time IoT visitor tracking table
-- Purpose: Store live visitor positions for Supabase Realtime subscriptions
-- Branch: neuraltwin-sungshin (bpwneyvqowbaiwcfxsck)
-- Applied: 2026-02-27
-- =============================================================

CREATE TABLE IF NOT EXISTS public.neuralsense_live_state (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL,
  hashed_mac TEXT NOT NULL,
  current_zone_id UUID,
  position JSONB DEFAULT '{}',
  rssi_readings JSONB DEFAULT '{}',
  confidence NUMERIC DEFAULT 0,
  session_id TEXT,
  status TEXT DEFAULT 'browsing' CHECK (status IN ('entering', 'browsing', 'purchasing', 'leaving', 'exited')),
  last_seen TIMESTAMPTZ NOT NULL DEFAULT now(),
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes for realtime queries
CREATE INDEX idx_neuralsense_live_state_store_active
  ON public.neuralsense_live_state(store_id) WHERE active = true;
CREATE INDEX idx_neuralsense_live_state_hashed_mac
  ON public.neuralsense_live_state(hashed_mac);
CREATE INDEX idx_neuralsense_live_state_last_seen
  ON public.neuralsense_live_state(last_seen);

-- RLS policies
ALTER TABLE public.neuralsense_live_state ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read live state for their stores"
  ON public.neuralsense_live_state
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Service role can insert live state"
  ON public.neuralsense_live_state
  FOR INSERT
  TO service_role
  WITH CHECK (true);

CREATE POLICY "Service role can update live state"
  ON public.neuralsense_live_state
  FOR UPDATE
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Service role can delete live state"
  ON public.neuralsense_live_state
  FOR DELETE
  TO service_role
  USING (true);

-- Enable Realtime for this table
ALTER PUBLICATION supabase_realtime ADD TABLE public.neuralsense_live_state;

-- Function to upsert live state (called by broadcast EF)
CREATE OR REPLACE FUNCTION public.upsert_live_visitor(
  p_store_id UUID,
  p_hashed_mac TEXT,
  p_zone_id UUID DEFAULT NULL,
  p_position JSONB DEFAULT '{}',
  p_rssi_readings JSONB DEFAULT '{}',
  p_confidence NUMERIC DEFAULT 0,
  p_session_id TEXT DEFAULT NULL,
  p_status TEXT DEFAULT 'browsing'
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_id UUID;
BEGIN
  INSERT INTO neuralsense_live_state (
    store_id, hashed_mac, current_zone_id, position, rssi_readings,
    confidence, session_id, status, last_seen, active
  ) VALUES (
    p_store_id, p_hashed_mac, p_zone_id, p_position, p_rssi_readings,
    p_confidence, p_session_id, p_status, now(), true
  )
  ON CONFLICT (store_id, hashed_mac) WHERE active = true DO UPDATE SET
    current_zone_id = EXCLUDED.current_zone_id,
    position = EXCLUDED.position,
    rssi_readings = EXCLUDED.rssi_readings,
    confidence = EXCLUDED.confidence,
    session_id = EXCLUDED.session_id,
    status = EXCLUDED.status,
    last_seen = now(),
    active = true
  RETURNING id INTO v_id;

  RETURN v_id;
END;
$$;

-- Function to mark stale visitors as inactive (>5 min no update)
CREATE OR REPLACE FUNCTION public.cleanup_stale_visitors(p_store_id UUID DEFAULT NULL)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_count INTEGER;
BEGIN
  UPDATE neuralsense_live_state
  SET active = false, status = 'exited'
  WHERE active = true
    AND last_seen < now() - INTERVAL '5 minutes'
    AND (p_store_id IS NULL OR store_id = p_store_id);

  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$;

-- Unique constraint for upsert by store + hashed_mac (one active record per visitor)
CREATE UNIQUE INDEX idx_neuralsense_live_state_unique_active
  ON public.neuralsense_live_state(store_id, hashed_mac) WHERE active = true;
