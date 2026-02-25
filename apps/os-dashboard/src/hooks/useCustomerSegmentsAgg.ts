import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { format, subDays } from 'date-fns';

/**
 * L3 customer_segments_agg 테이블 기반 고객 세그먼트 Hook
 * Phase 3: 3-Layer Architecture
 */

export interface CustomerSegmentAgg {
  id: string;
  store_id: string;
  org_id: string;
  date: string;
  segment_type: string; // 'rfm', 'value', 'behavior'
  segment_name: string; // 'VIP', 'Regular', 'New', 'Churning'
  customer_count: number;
  total_revenue: number;
  avg_transaction_value: number;
  avg_basket_size: number;
  visit_frequency: number;
  ltv_estimate: number;
  churn_risk_score: number;
}

export function useCustomerSegmentsAgg(storeId?: string, date?: string) {
  const { user, orgId } = useAuth();

  return useQuery({
    queryKey: ['customer-segments-agg', storeId, date],
    queryFn: async () => {
      if (!user || !storeId || !orgId) return [];

      const targetDate = date || format(new Date(), 'yyyy-MM-dd');

      const { data, error } = await supabase
        .from('customer_segments_agg')
        .select('*')
        .eq('org_id', orgId)
        .eq('store_id', storeId)
        .eq('date', targetDate);

      if (error) throw error;
      return (data || []) as CustomerSegmentAgg[];
    },
    enabled: !!user && !!storeId && !!orgId,
  });
}

export function useCustomerSegmentsTrend(storeId?: string, days: number = 30) {
  const { user, orgId } = useAuth();

  return useQuery({
    queryKey: ['customer-segments-trend', storeId, days],
    queryFn: async () => {
      if (!user || !storeId || !orgId) return [];

      const startDate = format(subDays(new Date(), days), 'yyyy-MM-dd');

      const { data, error } = await supabase
        .from('customer_segments_agg')
        .select('*')
        .eq('org_id', orgId)
        .eq('store_id', storeId)
        .gte('date', startDate)
        .order('date', { ascending: true });

      if (error) throw error;
      return (data || []) as CustomerSegmentAgg[];
    },
    enabled: !!user && !!storeId && !!orgId,
  });
}

export function useSegmentStats(storeId?: string) {
  const { data: segments, isLoading } = useCustomerSegmentsAgg(storeId);

  const stats = {
    vip: {
      count: 0,
      totalRevenue: 0,
      avgLTV: 0,
    },
    regular: {
      count: 0,
      totalRevenue: 0,
      avgLTV: 0,
    },
    new: {
      count: 0,
      totalRevenue: 0,
      avgLTV: 0,
    },
    churning: {
      count: 0,
      totalRevenue: 0,
      avgLTV: 0,
      churnRisk: 0,
    },
  };

  if (segments) {
    segments.forEach(seg => {
      const segmentKey = seg.segment_name.toLowerCase() as keyof typeof stats;
      if (stats[segmentKey]) {
        stats[segmentKey].count = seg.customer_count;
        stats[segmentKey].totalRevenue = seg.total_revenue;
        stats[segmentKey].avgLTV = seg.ltv_estimate;
        if (segmentKey === 'churning') {
          (stats.churning as any).churnRisk = seg.churn_risk_score;
        }
      }
    });
  }

  return {
    stats,
    segments,
    isLoading,
    totalCustomers: segments?.reduce((sum, s) => sum + s.customer_count, 0) || 0,
  };
}
