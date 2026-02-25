/**
 * useGoals.ts
 *
 * 목표 설정 및 달성률 추적 Hook
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useSelectedStore } from '@/hooks/useSelectedStore';
import { toast } from 'sonner';
import { startOfMonth, endOfMonth, startOfWeek, endOfWeek, format } from 'date-fns';

// ============================================================================
// 타입 정의
// ============================================================================

export type GoalType = 'revenue' | 'visitors' | 'conversion' | 'avg_basket';
export type PeriodType = 'daily' | 'weekly' | 'monthly';

export interface StoreGoal {
  id: string;
  org_id: string;
  store_id: string;
  goal_type: GoalType;
  period_type: PeriodType;
  period_start: string;
  period_end: string;
  target_value: number;
  created_by: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface GoalFormData {
  goalType: GoalType;
  periodType: PeriodType;
  targetValue: number;
}

export interface GoalProgress {
  goal: StoreGoal;
  currentValue: number;
  progress: number; // 0-100
  remaining: number;
  isAchieved: boolean;
}

// 목표 유형 메타데이터
export const GOAL_TYPES = [
  { value: 'revenue' as GoalType, label: '매출', unit: '원', icon: 'DollarSign', placeholder: '3000000', kpiField: 'total_revenue' },
  { value: 'visitors' as GoalType, label: '방문자', unit: '명', icon: 'Users', placeholder: '50', kpiField: 'total_visitors' },
  { value: 'conversion' as GoalType, label: '전환율', unit: '%', icon: 'TrendingUp', placeholder: '40', kpiField: 'conversion_rate' },
  { value: 'avg_basket' as GoalType, label: '객단가', unit: '원', icon: 'ShoppingCart', placeholder: '200000', kpiField: 'avg_transaction_value' },
] as const;

// ============================================================================
// 현재 목표 조회
// ============================================================================

export function useCurrentGoals() {
  const { orgId } = useAuth();
  const { selectedStore } = useSelectedStore();

  return useQuery({
    queryKey: ['store-goals', orgId, selectedStore?.id, 'current'],
    queryFn: async () => {
      if (!orgId || !selectedStore?.id) return [];

      const today = new Date().toISOString().split('T')[0];

      const { data, error } = await supabase
        .from('store_goals')
        .select('*')
        .eq('org_id', orgId)
        .eq('store_id', selectedStore.id)
        .eq('is_active', true)
        .lte('period_start', today)
        .gte('period_end', today)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data || []) as StoreGoal[];
    },
    enabled: !!orgId && !!selectedStore?.id,
  });
}

// ============================================================================
// 목표 달성률 계산
// ============================================================================

export function useGoalProgress() {
  const { orgId } = useAuth();
  const { selectedStore } = useSelectedStore();
  const { data: goals = [] } = useCurrentGoals();

  return useQuery({
    queryKey: ['goal-progress', orgId, selectedStore?.id, goals.map(g => g.id).join(',')],
    queryFn: async (): Promise<GoalProgress[]> => {
      if (!selectedStore?.id || goals.length === 0) return [];

      const progressList: GoalProgress[] = [];

      for (const goal of goals) {
        let currentValue = 0;

        if (goal.goal_type === 'revenue') {
          // 매출: line_items에서 직접 조회 (가장 정확)
          const { data: lineItems } = await supabase
            .from('line_items')
            .select('line_total')
            .eq('store_id', selectedStore.id)
            .gte('transaction_date', goal.period_start)
            .lte('transaction_date', goal.period_end);

          currentValue = lineItems?.reduce((sum, item) => sum + Number(item.line_total || 0), 0) || 0;

          // fallback to daily_kpis_agg if no line_items
          if (currentValue === 0) {
            const { data: kpiData } = await supabase
              .from('daily_kpis_agg')
              .select('total_revenue')
              .eq('store_id', selectedStore.id)
              .gte('date', goal.period_start)
              .lte('date', goal.period_end);
            currentValue = kpiData?.reduce((sum, k) => sum + Number(k.total_revenue || 0), 0) || 0;
          }
        } else if (goal.goal_type === 'visitors') {
          // 방문자: store_visits에서 직접 조회
          const { count } = await supabase
            .from('store_visits')
            .select('*', { count: 'exact', head: true })
            .eq('store_id', selectedStore.id)
            .gte('visit_date', `${goal.period_start}T00:00:00`)
            .lte('visit_date', `${goal.period_end}T23:59:59`);

          currentValue = count || 0;

          // fallback to daily_kpis_agg if no store_visits
          if (currentValue === 0) {
            const { data: kpiData } = await supabase
              .from('daily_kpis_agg')
              .select('total_visitors')
              .eq('store_id', selectedStore.id)
              .gte('date', goal.period_start)
              .lte('date', goal.period_end);
            currentValue = kpiData?.reduce((sum, k) => sum + (k.total_visitors || 0), 0) || 0;
          }
        } else if (goal.goal_type === 'conversion') {
          // 전환율: (구매 수 / 방문 수) * 100
          const { count: visitCount } = await supabase
            .from('store_visits')
            .select('*', { count: 'exact', head: true })
            .eq('store_id', selectedStore.id)
            .gte('visit_date', `${goal.period_start}T00:00:00`)
            .lte('visit_date', `${goal.period_end}T23:59:59`);

          const { count: purchaseCount } = await supabase
            .from('purchases')
            .select('*', { count: 'exact', head: true })
            .eq('store_id', selectedStore.id)
            .gte('purchase_date', `${goal.period_start}T00:00:00`)
            .lte('purchase_date', `${goal.period_end}T23:59:59`);

          currentValue = visitCount && visitCount > 0
            ? ((purchaseCount || 0) / visitCount) * 100
            : 0;
        } else if (goal.goal_type === 'avg_basket') {
          // 객단가: 총매출 / 거래수
          const { data: lineItems } = await supabase
            .from('line_items')
            .select('line_total, transaction_id')
            .eq('store_id', selectedStore.id)
            .gte('transaction_date', goal.period_start)
            .lte('transaction_date', goal.period_end);

          const totalRevenue = lineItems?.reduce((sum, item) => sum + Number(item.line_total || 0), 0) || 0;
          const uniqueTransactions = new Set(lineItems?.map(item => item.transaction_id)).size;

          currentValue = uniqueTransactions > 0 ? totalRevenue / uniqueTransactions : 0;
        }

        const progress = goal.target_value > 0
          ? Math.min((currentValue / goal.target_value) * 100, 100)
          : 0;

        progressList.push({
          goal,
          currentValue,
          progress,
          remaining: Math.max(goal.target_value - currentValue, 0),
          isAchieved: currentValue >= goal.target_value,
        });
      }

      return progressList;
    },
    enabled: !!selectedStore?.id && goals.length > 0,
  });
}

// ============================================================================
// 목표 생성
// ============================================================================

export function useCreateGoal() {
  const { user, orgId } = useAuth();
  const { selectedStore } = useSelectedStore();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (formData: GoalFormData) => {
      if (!user?.id || !orgId || !selectedStore?.id) {
        throw new Error('인증 정보가 없습니다');
      }

      const now = new Date();
      let periodStart: Date, periodEnd: Date;

      switch (formData.periodType) {
        case 'daily':
          periodStart = periodEnd = now;
          break;
        case 'weekly':
          periodStart = startOfWeek(now, { weekStartsOn: 1 });
          periodEnd = endOfWeek(now, { weekStartsOn: 1 });
          break;
        case 'monthly':
          periodStart = startOfMonth(now);
          periodEnd = endOfMonth(now);
          break;
        default:
          periodStart = startOfMonth(now);
          periodEnd = endOfMonth(now);
      }

      const { data, error } = await supabase
        .from('store_goals')
        .upsert({
          org_id: orgId,
          store_id: selectedStore.id,
          goal_type: formData.goalType,
          period_type: formData.periodType,
          period_start: format(periodStart, 'yyyy-MM-dd'),
          period_end: format(periodEnd, 'yyyy-MM-dd'),
          target_value: formData.targetValue,
          created_by: user.id,
          is_active: true,
        }, {
          onConflict: 'store_id,goal_type,period_type,period_start'
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['store-goals'] });
      queryClient.invalidateQueries({ queryKey: ['goal-progress'] });
      toast.success('목표가 설정되었습니다');
    },
    onError: (error) => {
      console.error('목표 설정 실패:', error);
      toast.error('목표 설정에 실패했습니다');
    },
  });
}

// ============================================================================
// 목표 삭제/비활성화
// ============================================================================

export function useDeleteGoal() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (goalId: string) => {
      const { error } = await supabase
        .from('store_goals')
        .update({ is_active: false })
        .eq('id', goalId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['store-goals'] });
      queryClient.invalidateQueries({ queryKey: ['goal-progress'] });
      toast.success('목표가 삭제되었습니다');
    },
    onError: () => {
      toast.error('목표 삭제에 실패했습니다');
    },
  });
}

// ============================================================================
// 유틸리티 함수
// ============================================================================

export function formatGoalValue(value: number, goalType: GoalType): string {
  switch (goalType) {
    case 'revenue':
      if (value >= 100000000) return `${(value / 100000000).toFixed(1)}억`;
      if (value >= 10000) return `${Math.round(value / 10000)}만원`;
      return `₩${value.toLocaleString()}`;
    case 'visitors':
      return `${value.toLocaleString()}명`;
    case 'conversion':
      return `${value.toFixed(1)}%`;
    case 'avg_basket':
      return `₩${value.toLocaleString()}`;
    default:
      return value.toString();
  }
}

export function getGoalTypeLabel(goalType: GoalType): string {
  return GOAL_TYPES.find(t => t.value === goalType)?.label || goalType;
}
