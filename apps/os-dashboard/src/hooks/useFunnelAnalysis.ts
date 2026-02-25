import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { format, subDays } from 'date-fns';

/**
 * L2 funnel_events 테이블 기반 퍼널 분석 Hook
 * Phase 3: 3-Layer Architecture
 */

export interface FunnelStage {
  event_type: string;
  count: number;
  conversion_rate: number;
}

export interface FunnelAnalysis {
  stages: FunnelStage[];
  totalEntries: number;
  totalPurchases: number;
  overallConversionRate: number;
}

export function useFunnelAnalysis(storeId?: string, startDate?: Date, endDate?: Date) {
  const { user, orgId } = useAuth();

  return useQuery({
    queryKey: ['funnel-analysis', storeId, startDate?.toISOString(), endDate?.toISOString()],
    queryFn: async (): Promise<FunnelAnalysis> => {
      if (!user || !storeId || !orgId) {
        return {
          stages: [],
          totalEntries: 0,
          totalPurchases: 0,
          overallConversionRate: 0,
        };
      }

      const start = startDate || subDays(new Date(), 7);
      const end = endDate || new Date();

      const { data: events, error } = await supabase
        .from('funnel_events')
        .select('event_type, id')
        .eq('org_id', orgId)
        .eq('store_id', storeId)
        .gte('event_date', format(start, 'yyyy-MM-dd'))
        .lte('event_date', format(end, 'yyyy-MM-dd'));

      if (error) throw error;

      // 이벤트 타입별 집계
      const eventCounts = new Map<string, number>();
      (events || []).forEach(e => {
        const count = eventCounts.get(e.event_type) || 0;
        eventCounts.set(e.event_type, count + 1);
      });

      const stageOrder = ['entry', 'browse', 'engage', 'fitting', 'purchase'];
      const totalEntries = eventCounts.get('entry') || 0;

      const stages: FunnelStage[] = stageOrder.map(eventType => {
        const count = eventCounts.get(eventType) || 0;
        return {
          event_type: eventType,
          count,
          conversion_rate: totalEntries > 0 ? (count / totalEntries) * 100 : 0,
        };
      });

      const totalPurchases = eventCounts.get('purchase') || 0;
      const overallConversionRate = totalEntries > 0 ? (totalPurchases / totalEntries) * 100 : 0;

      return {
        stages,
        totalEntries,
        totalPurchases,
        overallConversionRate,
      };
    },
    enabled: !!user && !!storeId && !!orgId,
  });
}

export function useHourlyMetrics(storeId?: string, date?: string) {
  const { user, orgId } = useAuth();

  return useQuery({
    queryKey: ['hourly-metrics', storeId, date],
    queryFn: async () => {
      if (!user || !storeId || !orgId) return [];

      const targetDate = date || format(new Date(), 'yyyy-MM-dd');

      const { data, error } = await supabase
        .from('hourly_metrics')
        .select('*')
        .eq('org_id', orgId)
        .eq('store_id', storeId)
        .eq('date', targetDate)
        .order('hour', { ascending: true });

      if (error) throw error;
      return data || [];
    },
    enabled: !!user && !!storeId && !!orgId,
  });
}

export function useFunnelEventsByHour(storeId?: string, date?: string) {
  const { user, orgId } = useAuth();

  return useQuery({
    queryKey: ['funnel-events-hourly', storeId, date],
    queryFn: async () => {
      if (!user || !storeId || !orgId) return [];

      const targetDate = date || format(new Date(), 'yyyy-MM-dd');

      const { data, error } = await supabase
        .from('funnel_events')
        .select('event_hour, event_type, id')
        .eq('org_id', orgId)
        .eq('store_id', storeId)
        .eq('event_date', targetDate);

      if (error) throw error;

      // 시간대별 집계
      const hourlyData = Array.from({ length: 24 }, (_, hour) => ({
        hour,
        time: `${hour.toString().padStart(2, '0')}:00`,
        entries: 0,
        browses: 0,
        purchases: 0,
      }));

      (data || []).forEach(event => {
        const hour = event.event_hour || 0;
        if (hour >= 0 && hour < 24) {
          if (event.event_type === 'entry') hourlyData[hour].entries += 1;
          if (event.event_type === 'browse') hourlyData[hour].browses += 1;
          if (event.event_type === 'purchase') hourlyData[hour].purchases += 1;
        }
      });

      return hourlyData;
    },
    enabled: !!user && !!storeId && !!orgId,
  });
}
