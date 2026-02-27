/**
 * 적용된 전략 목록 훅
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase';
import { useSelectedStore } from '@/hooks/useSelectedStore';
import type {
  AppliedStrategy,
  AppliedStrategyRow,
  DateRange,
  StrategyFilters,
  StrategySortOptions,
  ApplyStrategyInput,
} from '../types/roi.types';

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

// Row를 도메인 타입으로 변환
const transformStrategy = (row: AppliedStrategyRow): AppliedStrategy => ({
  id: row.id,
  storeId: row.store_id,
  orgId: row.org_id,
  source: row.source,
  sourceModule: row.source_module,
  name: row.name,
  description: row.description,
  settings: row.settings,
  startDate: row.start_date,
  endDate: row.end_date,
  expectedRoi: row.expected_roi,
  targetRoi: row.target_roi,
  currentRoi: row.current_roi,
  finalRoi: row.final_roi,
  expectedRevenue: row.expected_revenue,
  actualRevenue: row.actual_revenue,
  status: row.status,
  result: row.result,
  baselineMetrics: row.baseline_metrics,
  notes: row.notes,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
  createdBy: row.created_by,
});

export const useAppliedStrategies = (
  dateRange: DateRange,
  filters?: Partial<StrategyFilters>,
  sort?: StrategySortOptions
) => {
  const { selectedStore } = useSelectedStore();

  return useQuery<AppliedStrategy[]>({
    queryKey: ['applied-strategies', selectedStore?.id, dateRange, filters, sort],
    queryFn: async () => {
      if (!selectedStore?.id) {
        throw new Error('Store not selected');
      }

      const days = getDaysFromRange(dateRange);
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      let query = supabase
        .from('applied_strategies')
        .select('*')
        .eq('store_id', selectedStore.id)
        .gte('created_at', startDate.toISOString());

      // 필터 적용
      if (filters?.source) {
        query = query.eq('source', filters.source);
      }
      if (filters?.sourceModule) {
        query = query.eq('source_module', filters.sourceModule);
      }
      if (filters?.status) {
        query = query.eq('status', filters.status);
      }
      if (filters?.result) {
        query = query.eq('result', filters.result);
      }

      // 정렬 적용
      const sortField = sort?.field || 'createdAt';
      const sortDirection = sort?.direction || 'desc';
      const dbField =
        sortField === 'createdAt'
          ? 'created_at'
          : sortField === 'startDate'
            ? 'start_date'
            : sortField === 'expectedRoi'
              ? 'expected_roi'
              : sortField === 'currentRoi'
                ? 'current_roi'
                : 'name';

      query = query.order(dbField, { ascending: sortDirection === 'asc' });

      const { data, error } = await query;

      if (error) {
        console.error('Applied strategies fetch error:', error);
        return [];
      }

      return (data || []).map((row) => transformStrategy(row as unknown as AppliedStrategyRow));
    },
    enabled: !!selectedStore?.id,
    staleTime: 1000 * 60 * 2, // 2분
  });
};

// 개별 전략 상세 조회
export const useStrategyDetail = (strategyId: string | null) => {
  return useQuery<AppliedStrategy | null>({
    queryKey: ['strategy-detail', strategyId],
    queryFn: async () => {
      if (!strategyId) return null;

      const { data, error } = await supabase
        .from('applied_strategies')
        .select('*')
        .eq('id', strategyId)
        .single();

      if (error) {
        console.error('Strategy detail fetch error:', error);
        return null;
      }

      return transformStrategy(data as unknown as AppliedStrategyRow);
    },
    enabled: !!strategyId,
  });
};

// 전략 적용 뮤테이션
export const useApplyStrategy = () => {
  const queryClient = useQueryClient();
  const { selectedStore } = useSelectedStore();

  return useMutation({
    mutationFn: async (input: ApplyStrategyInput) => {
      const orgId = selectedStore?.org_id || selectedStore?.organization_id;
      if (!selectedStore?.id || !orgId) {
        throw new Error('Store not selected');
      }

      const { data, error } = await supabase
        .from('applied_strategies')
        .insert({
          store_id: selectedStore.id,
          org_id: orgId,
          source: input.source,
          source_module: input.sourceModule,
          name: input.name,
          description: input.description || null,
          settings: input.settings,
          start_date: input.startDate,
          end_date: input.endDate,
          expected_roi: input.expectedRoi,
          expected_revenue: input.expectedRevenue || null,
          target_roi: input.targetRoi || input.expectedRoi,
          baseline_metrics: input.baselineMetrics,
          notes: input.notes || null,
          status: 'active',
        })
        .select()
        .single();

      if (error) {
        throw error;
      }

      return transformStrategy(data as unknown as AppliedStrategyRow);
    },
    onSuccess: () => {
      // 관련 쿼리 무효화
      queryClient.invalidateQueries({ queryKey: ['applied-strategies'] });
      queryClient.invalidateQueries({ queryKey: ['roi-summary'] });
      queryClient.invalidateQueries({ queryKey: ['category-performance'] });
    },
  });
};

// 전략 상태 업데이트
export const useUpdateStrategyStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      strategyId,
      status,
      result,
      finalRoi,
      actualRevenue,
    }: {
      strategyId: string;
      status?: 'active' | 'completed' | 'cancelled';
      result?: 'success' | 'partial' | 'failed';
      finalRoi?: number;
      actualRevenue?: number;
    }) => {
      const updateData: Record<string, any> = {};

      if (status) updateData.status = status;
      if (result) updateData.result = result;
      if (finalRoi !== undefined) updateData.final_roi = finalRoi;
      if (actualRevenue !== undefined) updateData.actual_revenue = actualRevenue;

      const { data, error } = await supabase
        .from('applied_strategies')
        .update(updateData)
        .eq('id', strategyId)
        .select()
        .single();

      if (error) {
        throw error;
      }

      return transformStrategy(data as unknown as AppliedStrategyRow);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['applied-strategies'] });
      queryClient.invalidateQueries({ queryKey: ['strategy-detail'] });
      queryClient.invalidateQueries({ queryKey: ['roi-summary'] });
    },
  });
};

// 전략 삭제 뮤테이션
export const useDeleteStrategies = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (strategyIds: string[]) => {
      const { error } = await supabase
        .from('applied_strategies')
        .delete()
        .in('id', strategyIds);

      if (error) {
        throw error;
      }

      return strategyIds;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['applied-strategies'] });
      queryClient.invalidateQueries({ queryKey: ['roi-summary'] });
      queryClient.invalidateQueries({ queryKey: ['category-performance'] });
    },
  });
};

export default useAppliedStrategies;
