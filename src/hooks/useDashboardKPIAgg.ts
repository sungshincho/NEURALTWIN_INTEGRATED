import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

/**
 * L3 daily_kpis_agg 테이블 기반 KPI Hook
 * Phase 3: 3-Layer Architecture
 */

export interface DailyKPIAgg {
  id: string;
  store_id: string;
  org_id: string;
  date: string;
  total_visitors: number;
  unique_visitors: number;
  returning_visitors: number;
  total_transactions: number;
  total_revenue: number;
  total_units_sold: number;
  avg_transaction_value: number;
  avg_basket_size: number;
  conversion_rate: number;
  sales_per_visitor: number;
  sales_per_sqm: number;
  sales_per_labor_hour: number;
  avg_visit_duration_seconds: number;
  browse_to_engage_rate: number;
  engage_to_purchase_rate: number;
  labor_hours: number;
  weather_condition?: string;
  temperature?: number;
  is_holiday: boolean;
  special_event?: string;
  calculated_at: string;
}

export function useDailyKPIAgg(storeId?: string, date?: string) {
  const { user, orgId } = useAuth();

  return useQuery({
    queryKey: ['daily-kpi-agg', storeId, date],
    queryFn: async () => {
      if (!user || !storeId || !orgId) return null;

      const targetDate = date || new Date().toISOString().split('T')[0];

      const { data, error } = await supabase
        .from('daily_kpis_agg')
        .select('*')
        .eq('org_id', orgId)
        .eq('store_id', storeId)
        .eq('date', targetDate)
        .maybeSingle();

      if (error) throw error;
      return data as DailyKPIAgg | null;
    },
    enabled: !!user && !!storeId && !!orgId,
  });
}

export function useKPIAggByDateRange(storeId?: string, startDate?: string, endDate?: string) {
  const { user, orgId } = useAuth();

  return useQuery({
    queryKey: ['daily-kpi-agg-range', storeId, startDate, endDate],
    queryFn: async () => {
      if (!user || !storeId || !startDate || !endDate || !orgId) return [];

      const { data, error } = await supabase
        .from('daily_kpis_agg')
        .select('*')
        .eq('org_id', orgId)
        .eq('store_id', storeId)
        .gte('date', startDate)
        .lte('date', endDate)
        .order('date', { ascending: true });

      if (error) throw error;
      return (data || []) as DailyKPIAgg[];
    },
    enabled: !!user && !!storeId && !!startDate && !!endDate && !!orgId,
  });
}

export function useLatestKPIAgg(storeId?: string, limit: number = 7) {
  const { user, orgId } = useAuth();

  return useQuery({
    queryKey: ['daily-kpi-agg-latest', storeId, limit],
    queryFn: async () => {
      if (!user || !storeId || !orgId) return [];

      const { data, error } = await supabase
        .from('daily_kpis_agg')
        .select('*')
        .eq('org_id', orgId)
        .eq('store_id', storeId)
        .order('date', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return (data || []) as DailyKPIAgg[];
    },
    enabled: !!user && !!storeId && !!orgId,
  });
}
