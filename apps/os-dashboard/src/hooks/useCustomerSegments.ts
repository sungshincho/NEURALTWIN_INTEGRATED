import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { format, subDays } from 'date-fns';

/**
 * L3 customer_segments_agg 테이블 기반 고객 세그먼트 분석 Hook
 * Phase 3: 3-Layer Architecture - 모든 분석이 동일한 L3 데이터 소스 사용
 * 
 * VIP / Regular / New / Churning 고객 분류
 */

export interface CustomerSegment {
  segment: 'VIP' | 'Regular' | 'New' | 'Churning';
  customer_count: number;
  totalRevenue: number;
  avgTransactionValue: number;
  avgBasketSize: number;
  visitFrequency: number;
  lifetimeValue: number;
  churnRiskScore: number;
}

export interface SegmentStats {
  vip: {
    count: number;
    totalRevenue: number;
    avgLTV: number;
  };
  regular: {
    count: number;
    totalRevenue: number;
    avgLTV: number;
  };
  new: {
    count: number;
    totalRevenue: number;
    avgLTV: number;
  };
  churning: {
    count: number;
    totalRevenue: number;
    avgLTV: number;
    churnRisk: number;
  };
}

export function useCustomerSegments(storeId?: string, date?: string) {
  const { user, orgId } = useAuth();

  return useQuery({
    queryKey: ['customer-segments', storeId, date],
    queryFn: async () => {
      if (!user || !storeId || !orgId) {
        return {
          segments: [],
          segmentStats: getEmptyStats(),
          totalCustomers: 0,
        };
      }

      // 특정 날짜가 없으면 최근 7일 중 가장 최근 데이터 사용
      let targetDate = date;
      if (!targetDate) {
        const { data: latestData } = await supabase
          .from('customer_segments_agg')
          .select('date')
          .eq('org_id', orgId)
          .eq('store_id', storeId)
          .order('date', { ascending: false })
          .limit(1);
        
        targetDate = latestData?.[0]?.date || format(new Date(), 'yyyy-MM-dd');
      }

      // L3 customer_segments_agg에서 조회
      const { data, error } = await supabase
        .from('customer_segments_agg')
        .select('*')
        .eq('org_id', orgId)
        .eq('store_id', storeId)
        .eq('date', targetDate);

      if (error) {
        console.error('Customer segments fetch error:', error);
        throw new Error('고객 세그먼트 데이터를 불러오는데 실패했습니다.');
      }

      // CustomerSegment 형식으로 변환
      const segments: CustomerSegment[] = (data || []).map(row => ({
        segment: mapSegmentName(row.segment_name),
        customer_count: row.customer_count || 0,
        totalRevenue: row.total_revenue || 0,
        avgTransactionValue: row.avg_transaction_value || 0,
        avgBasketSize: row.avg_basket_size || 0,
        visitFrequency: row.visit_frequency || 0,
        lifetimeValue: row.ltv_estimate || 0,
        churnRiskScore: row.churn_risk_score || 0,
      }));

      // 세그먼트별 통계 계산
      const segmentStats = calculateSegmentStats(segments);
      const totalCustomers = segments.reduce((sum, s) => sum + s.customer_count, 0);

      return {
        segments,
        segmentStats,
        totalCustomers,
      };
    },
    enabled: !!user && !!storeId && !!orgId,
  });
}

function mapSegmentName(name: string): 'VIP' | 'Regular' | 'New' | 'Churning' {
  const normalized = name.toLowerCase();
  if (normalized.includes('vip')) return 'VIP';
  if (normalized.includes('regular')) return 'Regular';
  if (normalized.includes('new')) return 'New';
  if (normalized.includes('churn')) return 'Churning';
  return 'Regular'; // 기본값
}

function getEmptyStats(): SegmentStats {
  return {
    vip: { count: 0, totalRevenue: 0, avgLTV: 0 },
    regular: { count: 0, totalRevenue: 0, avgLTV: 0 },
    new: { count: 0, totalRevenue: 0, avgLTV: 0 },
    churning: { count: 0, totalRevenue: 0, avgLTV: 0, churnRisk: 0 },
  };
}

function calculateSegmentStats(segments: CustomerSegment[]): SegmentStats {
  const stats = getEmptyStats();

  segments.forEach(seg => {
    const key = seg.segment.toLowerCase() as keyof SegmentStats;
    if (stats[key]) {
      stats[key].count = seg.customer_count;
      stats[key].totalRevenue = seg.totalRevenue;
      stats[key].avgLTV = seg.lifetimeValue;
      if (key === 'churning') {
        (stats.churning as any).churnRisk = seg.churnRiskScore;
      }
    }
  });

  return stats;
}

/**
 * 고객 세그먼트 트렌드 조회
 */
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
      return data || [];
    },
    enabled: !!user && !!storeId && !!orgId,
  });
}

/**
 * 특정 세그먼트의 고객 수 조회
 */
export function useSegmentCustomerCount(storeId?: string, segmentType: 'VIP' | 'Regular' | 'New' | 'Churning' = 'VIP') {
  const { data, isLoading } = useCustomerSegments(storeId);

  const segmentData = data?.segments.find(s => s.segment === segmentType);

  return {
    count: segmentData?.customer_count || 0,
    revenue: segmentData?.totalRevenue || 0,
    avgLTV: segmentData?.lifetimeValue || 0,
    isLoading,
  };
}
