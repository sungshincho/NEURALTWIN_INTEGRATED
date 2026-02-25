/**
 * useLearningFeedback.ts
 *
 * Continuous Learning 피드백 관리 Hook
 * - AI 전략 추천 피드백 생성/조회/업데이트
 * - 모델 성능 통계 조회
 * - 학습 조정 이력 조회
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/components/ui/use-toast';

// ============================================================================
// 타입 정의
// ============================================================================

export interface StrategyFeedback {
  id: string;
  org_id: string;
  store_id: string;
  strategy_id: string | null;
  strategy_type: StrategyType;
  ai_recommendation: AIRecommendation;
  was_applied: boolean;
  applied_at: string | null;
  result_measured: boolean;
  measurement_period_days: number;
  measurement_start_date: string | null;
  measurement_end_date: string | null;
  baseline_metrics: BaselineMetrics | null;
  actual_metrics: BaselineMetrics | null;
  expected_roi: number | null;
  actual_roi: number | null;
  roi_accuracy: number | null;
  feedback_type: FeedbackType | null;
  learnings: Learnings | null;
  created_at: string;
  updated_at: string;
}

export interface AIRecommendation {
  type: string;
  changes?: any[];
  layoutChanges?: any[];
  productPlacements?: any[];
  expectedROI?: number;
  confidence?: number;
  optimizationSummary?: {
    expectedTrafficIncrease?: number;
    expectedRevenueIncrease?: number;
    expectedConversionIncrease?: number;
  };
  [key: string]: any;
}

export interface BaselineMetrics {
  revenue: number;
  visitors: number;
  conversion: number;
  avg_transaction?: number;
  [key: string]: number | undefined;
}

export interface Learnings {
  success_factors?: string[];
  failure_factors?: string[];
  adjustments?: {
    confidence_modifier?: number;
    roi_adjustment?: number;
  };
  context?: {
    day_of_week?: string;
    weather?: string;
    events?: string[];
  };
  [key: string]: any;
}

export type StrategyType =
  | 'layout'
  | 'pricing'
  | 'inventory'
  | 'promotion'
  | 'demand'
  | 'flow'
  | 'congestion'
  | 'staffing';

export type FeedbackType = 'success' | 'partial' | 'failure' | 'negative';

export interface ModelPerformance {
  totalPredictions: number;
  appliedCount: number;
  measuredCount: number;
  successCount: number;
  partialCount: number;
  failureCount: number;
  successRate: number;
  applyRate: number;
  avgConfidence: number;
  avgActualROI: number;
  avgPredictedROI: number;
  predictionAccuracy: number | null;
  confidenceAdjustment: number;
  periodStart: string;
  periodEnd: string;
  byType: Record<string, {
    count: number;
    successRate: number;
    avgROI: number;
  }>;
}

export interface CreateFeedbackInput {
  storeId: string;
  strategyType: StrategyType;
  aiRecommendation: AIRecommendation;
  expectedROI: number;
  strategyId?: string;
}

export interface ApplyFeedbackInput {
  feedbackId: string;
  baselineMetrics: BaselineMetrics;
}

export interface CompleteMeasurementInput {
  feedbackId: string;
  actualMetrics: BaselineMetrics;
  actualROI: number;
  learnings?: Learnings;
}

// ============================================================================
// 전략 유형 한글 라벨
// ============================================================================

export const STRATEGY_TYPE_LABELS: Record<StrategyType, string> = {
  layout: '레이아웃 최적화',
  pricing: '가격 최적화',
  inventory: '재고 최적화',
  promotion: '프로모션',
  demand: '수요 예측',
  flow: '동선 최적화',
  congestion: '혼잡도 분석',
  staffing: '인력 배치',
};

export const FEEDBACK_TYPE_LABELS: Record<FeedbackType, string> = {
  success: '성공',
  partial: '부분 성공',
  failure: '실패',
  negative: '부정적',
};

// ============================================================================
// 피드백 목록 조회
// ============================================================================

export function useStrategyFeedback(storeId?: string, strategyType?: StrategyType) {
  const { orgId } = useAuth();

  return useQuery({
    queryKey: ['strategy-feedback', orgId, storeId, strategyType],
    queryFn: async () => {
      if (!orgId) return [];

      let query = supabase
        .from('strategy_feedback')
        .select('*')
        .eq('org_id', orgId)
        .order('created_at', { ascending: false });

      if (storeId) {
        query = query.eq('store_id', storeId);
      }

      if (strategyType) {
        query = query.eq('strategy_type', strategyType);
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data || []) as StrategyFeedback[];
    },
    enabled: !!orgId,
  });
}

// ============================================================================
// 모델 성능 통계 조회
// ============================================================================

export function useModelPerformance(
  storeId?: string,
  strategyType?: StrategyType,
  days: number = 90
) {
  const { orgId } = useAuth();

  return useQuery({
    queryKey: ['model-performance', orgId, storeId, strategyType, days],
    queryFn: async () => {
      if (!orgId) return null;

      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const { data, error } = await supabase.rpc('aggregate_ai_performance', {
        p_org_id: orgId,
        p_store_id: storeId || null,
        p_model_type: strategyType || null,
        p_start_date: startDate.toISOString().split('T')[0],
        p_end_date: new Date().toISOString().split('T')[0],
      });

      if (error) throw error;
      return data as unknown as ModelPerformance;
    },
    enabled: !!orgId,
  });
}

// ============================================================================
// 피드백 생성
// ============================================================================

export function useCreateFeedback() {
  const { orgId } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (input: CreateFeedbackInput) => {
      if (!orgId) throw new Error('Organization not found');

      const { data, error } = await supabase
        .from('strategy_feedback')
        .insert({
          org_id: orgId,
          store_id: input.storeId,
          strategy_type: input.strategyType,
          strategy_id: input.strategyId || null,
          ai_recommendation: input.aiRecommendation,
          expected_roi: input.expectedROI,
          was_applied: false,
          result_measured: false,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['strategy-feedback'] });
    },
    onError: (error) => {
      console.error('Failed to create feedback:', error);
      toast({
        title: '피드백 생성 실패',
        description: '잠시 후 다시 시도해주세요.',
        variant: 'destructive',
      });
    },
  });
}

// ============================================================================
// 피드백 적용 (베이스라인 기록)
// ============================================================================

export function useApplyFeedback() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (input: ApplyFeedbackInput) => {
      const { data, error } = await supabase
        .from('strategy_feedback')
        .update({
          was_applied: true,
          applied_at: new Date().toISOString(),
          baseline_metrics: input.baselineMetrics,
          measurement_start_date: new Date().toISOString().split('T')[0],
        })
        .eq('id', input.feedbackId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['strategy-feedback'] });
      toast({
        title: '전략 적용 기록됨',
        description: '측정 기간 후 ROI를 확인할 수 있습니다.',
      });
    },
    onError: (error) => {
      console.error('Failed to apply feedback:', error);
      toast({
        title: '적용 기록 실패',
        description: '잠시 후 다시 시도해주세요.',
        variant: 'destructive',
      });
    },
  });
}

// ============================================================================
// 측정 완료 (실제 결과 기록)
// ============================================================================

export function useCompleteMeasurement() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (input: CompleteMeasurementInput) => {
      // 먼저 기존 피드백 조회
      const { data: existing } = await supabase
        .from('strategy_feedback')
        .select('expected_roi')
        .eq('id', input.feedbackId)
        .single();

      const expectedROI = existing?.expected_roi || 0;

      // 피드백 타입 결정
      let feedbackType: FeedbackType;
      if (input.actualROI >= expectedROI * 0.8) {
        feedbackType = 'success';
      } else if (input.actualROI >= expectedROI * 0.5) {
        feedbackType = 'partial';
      } else if (input.actualROI < 0) {
        feedbackType = 'negative';
      } else {
        feedbackType = 'failure';
      }

      // ROI 정확도 계산
      const roiAccuracy = expectedROI !== 0
        ? Math.max(0, 100 - Math.abs((input.actualROI - expectedROI) / expectedROI) * 100)
        : 0;

      const { data, error } = await supabase
        .from('strategy_feedback')
        .update({
          result_measured: true,
          measurement_end_date: new Date().toISOString().split('T')[0],
          actual_metrics: input.actualMetrics,
          actual_roi: input.actualROI,
          roi_accuracy: Math.round(roiAccuracy),
          feedback_type: feedbackType,
          learnings: input.learnings || null,
        })
        .eq('id', input.feedbackId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['strategy-feedback'] });
      queryClient.invalidateQueries({ queryKey: ['model-performance'] });

      const feedbackLabel = data.feedback_type
        ? FEEDBACK_TYPE_LABELS[data.feedback_type as FeedbackType]
        : '완료';

      toast({
        title: `측정 완료: ${feedbackLabel}`,
        description: `실제 ROI: ${data.actual_roi?.toFixed(1)}%`,
      });
    },
    onError: (error) => {
      console.error('Failed to complete measurement:', error);
      toast({
        title: '측정 완료 실패',
        description: '잠시 후 다시 시도해주세요.',
        variant: 'destructive',
      });
    },
  });
}

// ============================================================================
// 성공/실패 패턴 조회
// ============================================================================

export function useSuccessPatterns(storeId: string, strategyType: StrategyType) {
  return useQuery({
    queryKey: ['success-patterns', storeId, strategyType],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_success_patterns', {
        p_store_id: storeId,
        p_strategy_type: strategyType,
        p_limit: 5,
      });

      if (error) throw error;
      return data || [];
    },
    enabled: !!storeId && !!strategyType,
  });
}

export function useFailurePatterns(storeId: string, strategyType: StrategyType) {
  return useQuery({
    queryKey: ['failure-patterns', storeId, strategyType],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_failure_patterns', {
        p_store_id: storeId,
        p_strategy_type: strategyType,
        p_limit: 3,
      });

      if (error) throw error;
      return data || [];
    },
    enabled: !!storeId && !!strategyType,
  });
}

// ============================================================================
// 신뢰도 조정값 조회
// ============================================================================

export function useConfidenceAdjustment(storeId: string, strategyType: StrategyType) {
  return useQuery({
    queryKey: ['confidence-adjustment', storeId, strategyType],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('calculate_confidence_adjustment', {
        p_store_id: storeId,
        p_strategy_type: strategyType,
        p_days: 90,
      });

      if (error) throw error;
      return data as {
        sampleSize: number;
        successRate: number;
        avgROIDifference: number;
        recommendedAdjustment: number;
        hasEnoughData: boolean;
      };
    },
    enabled: !!storeId && !!strategyType,
  });
}

// ============================================================================
// 헬퍼 함수
// ============================================================================

export function getFeedbackTypeColor(type: FeedbackType | null): string {
  switch (type) {
    case 'success':
      return 'text-green-600';
    case 'partial':
      return 'text-yellow-600';
    case 'failure':
      return 'text-orange-600';
    case 'negative':
      return 'text-red-600';
    default:
      return 'text-gray-500';
  }
}

export function getFeedbackTypeBgColor(type: FeedbackType | null): string {
  switch (type) {
    case 'success':
      return 'bg-green-50 border-green-200';
    case 'partial':
      return 'bg-yellow-50 border-yellow-200';
    case 'failure':
      return 'bg-orange-50 border-orange-200';
    case 'negative':
      return 'bg-red-50 border-red-200';
    default:
      return 'bg-gray-50 border-gray-200';
  }
}

export function formatROIAccuracy(accuracy: number | null): string {
  if (accuracy === null) return '-';
  if (accuracy >= 90) return '매우 정확';
  if (accuracy >= 70) return '정확';
  if (accuracy >= 50) return '보통';
  return '부정확';
}
