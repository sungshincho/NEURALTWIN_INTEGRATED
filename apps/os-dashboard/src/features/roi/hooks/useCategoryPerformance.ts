/**
 * 카테고리별 성과 훅
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase';
import { useSelectedStore } from '@/hooks/useSelectedStore';
import type { CategoryPerformance, DateRange, SimulationSource, SourceModule } from '../types/roi.types';

const getDaysFromRange = (range: DateRange): number => {
  switch (range) {
    case '7d':
      return 7;
    case '30d':
      return 30;
    case '90d':
      return 90;
    case 'all':
      return 3650;
    default:
      return 90;
  }
};

// 모든 가능한 모듈 목록 (데이터가 없어도 표시용)
const ALL_MODULES: Array<{ source: SimulationSource; module: SourceModule }> = [
  // 2D 시뮬레이션 (인사이트 허브)
  { source: '2d_simulation', module: 'price_optimization' },
  { source: '2d_simulation', module: 'inventory_optimization' },
  { source: '2d_simulation', module: 'ai_recommendation' },
  // 3D 시뮬레이션 (디지털트윈 스튜디오)
  { source: '3d_simulation', module: 'layout_optimization' },
  { source: '3d_simulation', module: 'flow_optimization' },
  { source: '3d_simulation', module: 'staffing_optimization' },
];

export const useCategoryPerformance = (dateRange: DateRange) => {
  const { selectedStore } = useSelectedStore();

  return useQuery<CategoryPerformance[]>({
    queryKey: ['category-performance', selectedStore?.id, dateRange],
    queryFn: async () => {
      if (!selectedStore?.id) {
        throw new Error('Store not selected');
      }

      const days = getDaysFromRange(dateRange);
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      // 기본 모듈 반환 함수
      const getDefaultModules = () => ALL_MODULES.map(({ source, module }) => ({
        source,
        sourceModule: module,
        appliedCount: 0,
        successCount: 0,
        averageRoi: 0,
        totalImpact: 0,
        trend: 'stable' as const,
      }));

      // applied_strategies 테이블에서 직접 집계
      try {
        const { data, error } = await supabase
          .from('applied_strategies')
          .select('source, source_module, result, final_roi, current_roi, expected_roi')
          .eq('store_id', selectedStore.id)
          .gte('created_at', startDate.toISOString());

        if (error) {
          console.warn('Category performance fetch warning:', error.message);
          return getDefaultModules();
        }

        if (!data || data.length === 0) {
          return getDefaultModules();
        }

        // 모듈별로 집계
        const resultMap = new Map<string, {
          appliedCount: number;
          successCount: number;
          roiValues: number[];
        }>();

        data.forEach((item: any) => {
          const key = `${item.source}-${item.source_module}`;

          if (!resultMap.has(key)) {
            resultMap.set(key, {
              appliedCount: 0,
              successCount: 0,
              roiValues: [],
            });
          }

          const stats = resultMap.get(key)!;
          stats.appliedCount += 1;

          if (item.result === 'success') {
            stats.successCount += 1;
          }

          // ROI 값: final_roi → current_roi → expected_roi 순서
          const roiValue = item.final_roi ?? item.current_roi ?? item.expected_roi;
          if (roiValue != null) {
            stats.roiValues.push(roiValue);
          }
        });

        // 모든 모듈에 대해 데이터 생성 (없는 것은 0으로)
        return ALL_MODULES.map(({ source, module }) => {
          const key = `${source}-${module}`;
          const stats = resultMap.get(key);

          if (!stats) {
            return {
              source,
              sourceModule: module,
              appliedCount: 0,
              successCount: 0,
              averageRoi: 0,
              totalImpact: 0,
              trend: 'stable' as const,
            };
          }

          const averageRoi = stats.roiValues.length > 0
            ? stats.roiValues.reduce((a, b) => a + b, 0) / stats.roiValues.length
            : 0;

          return {
            source,
            sourceModule: module,
            appliedCount: stats.appliedCount,
            successCount: stats.successCount,
            averageRoi,
            totalImpact: 0, // 미사용 - 기본값
            trend: 'stable' as const, // 미사용 - 기본값
          };
        });
      } catch {
        return getDefaultModules();
      }
    },
    enabled: !!selectedStore?.id,
    staleTime: 1000 * 60 * 5, // 5분
  });
};

// 2D/3D 분리된 데이터
export const useCategoryPerformanceGrouped = (dateRange: DateRange) => {
  const { data, isLoading, error, refetch } = useCategoryPerformance(dateRange);

  const grouped = {
    '2d': data?.filter((item) => item.source === '2d_simulation') || [],
    '3d': data?.filter((item) => item.source === '3d_simulation') || [],
  };

  return { data: grouped, isLoading, error, refetch };
};

export default useCategoryPerformance;
