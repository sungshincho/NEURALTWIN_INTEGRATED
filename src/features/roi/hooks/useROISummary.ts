/**
 * ROI 요약 데이터 훅
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase';
import { useSelectedStore } from '@/hooks/useSelectedStore';
import type { ROISummary, DateRange } from '../types/roi.types';

const getDaysFromRange = (range: DateRange): number => {
  switch (range) {
    case '7d':
      return 7;
    case '30d':
      return 30;
    case '90d':
      return 90;
    case 'all':
      return 3650; // ~10년
    default:
      return 90;
  }
};

export const useROISummary = (dateRange: DateRange) => {
  const { selectedStore } = useSelectedStore();

  return useQuery<ROISummary>({
    queryKey: ['roi-summary', selectedStore?.id, dateRange],
    queryFn: async () => {
      if (!selectedStore?.id) {
        throw new Error('Store not selected');
      }

      const days = getDaysFromRange(dateRange);
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      // 기본값 정의
      const defaultSummary: ROISummary = {
        totalApplied: 0,
        activeCount: 0,
        successCount: 0,
        failedCount: 0,
        successRate: 0,
        averageRoi: 0,
        totalRevenueImpact: 0,
        expectedRevenueTotal: 0,
        revenueChangePercent: 0,
      };

      // applied_strategies 테이블에서 직접 집계
      try {
        const { data, error } = await supabase
          .from('applied_strategies')
          .select('status, result, final_roi, current_roi, expected_roi, actual_revenue, expected_revenue')
          .eq('store_id', selectedStore.id)
          .gte('created_at', startDate.toISOString());

        if (error) {
          console.warn('ROI summary fetch warning:', error.message);
          return defaultSummary;
        }

        if (!data || data.length === 0) {
          return defaultSummary;
        }

        // 집계
        const totalApplied = data.length;
        const activeCount = data.filter((item: any) => item.status === 'active').length;
        const successCount = data.filter((item: any) => item.result === 'success').length;
        const failedCount = data.filter((item: any) => item.result === 'failed').length;

        // 성공률 계산
        const successRate = totalApplied > 0 ? (successCount / totalApplied) * 100 : 0;

        // 평균 ROI 계산 (final_roi → current_roi → expected_roi 순서)
        const roiValues = data
          .map((item: any) => item.final_roi ?? item.current_roi ?? item.expected_roi)
          .filter((v: any) => v != null);
        const averageRoi = roiValues.length > 0
          ? roiValues.reduce((a: number, b: number) => a + b, 0) / roiValues.length
          : 0;

        // 총 추가매출 (actual_revenue 합계)
        const totalRevenueImpact = data
          .map((item: any) => item.actual_revenue || 0)
          .reduce((a: number, b: number) => a + b, 0);

        // 예상 매출 합계
        const expectedRevenueTotal = data
          .map((item: any) => item.expected_revenue || 0)
          .reduce((a: number, b: number) => a + b, 0);

        return {
          totalApplied,
          activeCount,
          successCount,
          failedCount,
          successRate,
          averageRoi,
          totalRevenueImpact,
          expectedRevenueTotal,
          revenueChangePercent: 0, // 전월 대비 계산은 별도 로직 필요
        };
      } catch {
        return defaultSummary;
      }
    },
    enabled: !!selectedStore?.id,
    staleTime: 1000 * 60 * 5, // 5분
  });
};

export default useROISummary;
