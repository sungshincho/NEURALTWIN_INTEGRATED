import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface DashboardKPI {
  id: string;
  date: string;
  total_revenue: number;
  total_visits: number;
  total_purchases: number;
  conversion_rate: number;
  sales_per_sqm: number;
  labor_hours: number;
  funnel_entry: number;
  funnel_browse: number;
  funnel_fitting: number;
  funnel_purchase: number;
  funnel_return: number;
  weather_condition?: string;
  is_holiday: boolean;
  special_event?: string;
  consumer_sentiment_index?: number;
}

/**
 * L3 daily_kpis_agg 테이블 기반 KPI Hook
 * 3-Layer Architecture: L3 집계 테이블 사용
 */
export function useDashboardKPI(storeId?: string, date?: string) {
  const { user, orgId } = useAuth();

  return useQuery({
    queryKey: ['dashboard-kpi', storeId, date],
    queryFn: async () => {
      if (!user || !storeId || !orgId) return null;

      const targetDate = date || new Date().toISOString().split('T')[0];

      // L3 daily_kpis_agg 테이블에서 조회
      const { data, error } = await supabase
        .from('daily_kpis_agg')
        .select('*')
        .eq('org_id', orgId)
        .eq('store_id', storeId)
        .eq('date', targetDate)
        .maybeSingle();

      if (error) throw error;
      
      if (!data) return null;

      // daily_kpis_agg → DashboardKPI 매핑
      return {
        id: data.id,
        date: data.date,
        total_revenue: data.total_revenue || 0,
        total_visits: data.total_visitors || 0,
        total_purchases: data.total_transactions || 0,
        conversion_rate: data.conversion_rate || 0,
        sales_per_sqm: data.sales_per_sqm || 0,
        labor_hours: data.labor_hours || 0,
        funnel_entry: data.total_visitors || 0,
        funnel_browse: Math.round((data.total_visitors || 0) * (data.browse_to_engage_rate || 0) / 100),
        funnel_fitting: Math.round((data.total_visitors || 0) * 0.15), // 예상 피팅룸 사용률
        funnel_purchase: data.total_transactions || 0,
        funnel_return: data.returning_visitors || 0,
        weather_condition: data.weather_condition,
        is_holiday: data.is_holiday || false,
        special_event: data.special_event,
        consumer_sentiment_index: undefined,
      } as DashboardKPI;
    },
    enabled: !!user && !!storeId,
  });
}

export function useLatestKPIs(storeId?: string, limit: number = 7) {
  const { user, orgId } = useAuth();

  return useQuery({
    queryKey: ['dashboard-kpis-latest', storeId, limit],
    queryFn: async () => {
      if (!user || !storeId || !orgId) return [];

      // L3 daily_kpis_agg 테이블에서 조회
      const { data, error } = await supabase
        .from('daily_kpis_agg')
        .select('*')
        .eq('org_id', orgId)
        .eq('store_id', storeId)
        .order('date', { ascending: false })
        .limit(limit);

      if (error) throw error;
      
      // daily_kpis_agg → DashboardKPI 매핑
      return (data || []).map(row => ({
        id: row.id,
        date: row.date,
        total_revenue: row.total_revenue || 0,
        total_visits: row.total_visitors || 0,
        total_purchases: row.total_transactions || 0,
        conversion_rate: row.conversion_rate || 0,
        sales_per_sqm: row.sales_per_sqm || 0,
        labor_hours: row.labor_hours || 0,
        funnel_entry: row.total_visitors || 0,
        funnel_browse: Math.round((row.total_visitors || 0) * (row.browse_to_engage_rate || 0) / 100),
        funnel_fitting: Math.round((row.total_visitors || 0) * 0.15),
        funnel_purchase: row.total_transactions || 0,
        funnel_return: row.returning_visitors || 0,
        weather_condition: row.weather_condition,
        is_holiday: row.is_holiday || false,
        special_event: row.special_event,
        consumer_sentiment_index: undefined,
      })) as DashboardKPI[];
    },
    enabled: !!user && !!storeId,
  });
}

export function useKPIsByDateRange(storeId?: string, startDate?: string, endDate?: string) {
  const { user, orgId } = useAuth();

  return useQuery({
    queryKey: ['dashboard-kpis-range', storeId, startDate, endDate],
    queryFn: async () => {
      if (!user || !storeId || !startDate || !endDate || !orgId) return [];

      // L3 daily_kpis_agg 테이블에서 조회
      const { data, error } = await supabase
        .from('daily_kpis_agg')
        .select('*')
        .eq('org_id', orgId)
        .eq('store_id', storeId)
        .gte('date', startDate)
        .lte('date', endDate)
        .order('date', { ascending: true });

      if (error) throw error;
      
      // daily_kpis_agg → DashboardKPI 매핑
      return (data || []).map(row => ({
        id: row.id,
        date: row.date,
        total_revenue: row.total_revenue || 0,
        total_visits: row.total_visitors || 0,
        total_purchases: row.total_transactions || 0,
        conversion_rate: row.conversion_rate || 0,
        sales_per_sqm: row.sales_per_sqm || 0,
        labor_hours: row.labor_hours || 0,
        funnel_entry: row.total_visitors || 0,
        funnel_browse: Math.round((row.total_visitors || 0) * (row.browse_to_engage_rate || 0) / 100),
        funnel_fitting: Math.round((row.total_visitors || 0) * 0.15),
        funnel_purchase: row.total_transactions || 0,
        funnel_return: row.returning_visitors || 0,
        weather_condition: row.weather_condition,
        is_holiday: row.is_holiday || false,
        special_event: row.special_event,
        consumer_sentiment_index: undefined,
      })) as DashboardKPI[];
    },
    enabled: !!user && !!storeId && !!startDate && !!endDate,
  });
}
