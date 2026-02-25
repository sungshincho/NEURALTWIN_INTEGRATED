import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { format, subDays } from 'date-fns';

/**
 * L2/L3 zone_events, zone_daily_metrics 테이블 기반 존 분석 Hook
 * Phase 3: 3-Layer Architecture
 */

export interface ZoneDailyMetric {
  id: string;
  zone_id: string;
  store_id: string;
  org_id: string;
  date: string;
  total_visitors: number;
  unique_visitors: number;
  total_dwell_seconds: number;
  avg_dwell_seconds: number;
  entry_count: number;
  exit_count: number;
  interaction_count: number;
  conversion_count: number;
  revenue_attributed: number;
  heatmap_intensity: number;
  peak_hour: number;
  peak_occupancy: number;
  calculated_at: string;
}

export function useZoneDailyMetrics(storeId?: string, date?: string) {
  const { user, orgId } = useAuth();

  return useQuery({
    queryKey: ['zone-daily-metrics', storeId, date],
    queryFn: async () => {
      if (!user || !storeId || !orgId) return [];

      const targetDate = date || format(new Date(), 'yyyy-MM-dd');

      const { data, error } = await supabase
        .from('zone_daily_metrics')
        .select('*')
        .eq('org_id', orgId)
        .eq('store_id', storeId)
        .eq('date', targetDate);

      if (error) throw error;
      return data || [];
    },
    enabled: !!user && !!storeId && !!orgId,
  });
}

export function useZoneMetricsByDateRange(storeId?: string, startDate?: string, endDate?: string) {
  const { user, orgId } = useAuth();

  return useQuery({
    queryKey: ['zone-metrics-range', storeId, startDate, endDate],
    queryFn: async () => {
      if (!user || !storeId || !startDate || !endDate || !orgId) return [];

      const { data, error } = await supabase
        .from('zone_daily_metrics')
        .select('*')
        .eq('org_id', orgId)
        .eq('store_id', storeId)
        .gte('date', startDate)
        .lte('date', endDate)
        .order('date', { ascending: true });

      if (error) throw error;
      return data || [];
    },
    enabled: !!user && !!storeId && !!startDate && !!endDate && !!orgId,
  });
}

export function useZoneEvents(storeId?: string, startDate?: Date, endDate?: Date) {
  const { user, orgId } = useAuth();

  return useQuery({
    queryKey: ['zone-events', storeId, startDate?.toISOString(), endDate?.toISOString()],
    queryFn: async () => {
      if (!user || !storeId || !orgId) return [];

      const start = startDate || subDays(new Date(), 7);
      const end = endDate || new Date();

      const { data, error } = await supabase
        .from('zone_events')
        .select('*')
        .eq('org_id', orgId)
        .eq('store_id', storeId)
        .gte('event_date', format(start, 'yyyy-MM-dd'))
        .lte('event_date', format(end, 'yyyy-MM-dd'))
        .order('event_timestamp', { ascending: false })
        .limit(1000);

      if (error) throw error;
      return data || [];
    },
    enabled: !!user && !!storeId && !!orgId,
  });
}

export function useZoneHeatmapData(storeId?: string, date?: string) {
  const { user, orgId } = useAuth();

  return useQuery({
    queryKey: ['zone-heatmap', storeId, date],
    queryFn: async () => {
      if (!user || !storeId || !orgId) return [];

      const targetDate = date || format(new Date(), 'yyyy-MM-dd');

      // zone_daily_metrics에서 heatmap_intensity 가져오기
      const { data, error } = await supabase
        .from('zone_daily_metrics')
        .select('zone_id, heatmap_intensity, total_visitors, avg_dwell_seconds')
        .eq('org_id', orgId)
        .eq('store_id', storeId)
        .eq('date', targetDate);

      if (error) throw error;

      // 히트맵 데이터로 변환
      return (data || []).map(z => ({
        zone_id: z.zone_id,
        intensity: z.heatmap_intensity || 0,
        visitors: z.total_visitors || 0,
        avgDwell: z.avg_dwell_seconds || 0,
      }));
    },
    enabled: !!user && !!storeId && !!orgId,
  });
}

export function useZonesDim(storeId?: string) {
  const { user, orgId } = useAuth();

  return useQuery({
    queryKey: ['zones-dim', storeId],
    queryFn: async () => {
      if (!user || !storeId || !orgId) return [];

      const { data, error } = await supabase
        .from('zones_dim')
        .select('*')
        .eq('org_id', orgId)
        .eq('store_id', storeId)
        .eq('is_active', true);

      if (error) throw error;
      return data || [];
    },
    enabled: !!user && !!storeId && !!orgId,
  });
}
