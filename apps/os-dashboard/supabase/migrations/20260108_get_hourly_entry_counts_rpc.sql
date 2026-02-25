-- =====================================================
-- RPC 함수: get_hourly_entry_counts
-- 시간대별 entry 이벤트 카운트를 서버에서 집계
--
-- SECURITY DEFINER로 RLS 우회
-- Date: 2026-01-08
-- =====================================================

CREATE OR REPLACE FUNCTION public.get_hourly_entry_counts(
  p_org_id uuid,
  p_store_id uuid,
  p_start_date date,
  p_end_date date
)
RETURNS TABLE (hour integer, count bigint)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT
    event_hour as hour,
    COUNT(*)::bigint as count
  FROM funnel_events
  WHERE org_id = p_org_id
    AND store_id = p_store_id
    AND event_type = 'entry'
    AND event_date >= p_start_date
    AND event_date <= p_end_date
    AND event_hour IS NOT NULL
  GROUP BY event_hour
  ORDER BY event_hour;
$$;

-- 권한 부여
GRANT EXECUTE ON FUNCTION public.get_hourly_entry_counts(uuid, uuid, date, date) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_hourly_entry_counts(uuid, uuid, date, date) TO anon;

COMMENT ON FUNCTION public.get_hourly_entry_counts IS '시간대별 entry 이벤트 카운트 - SECURITY DEFINER로 RLS 우회';
