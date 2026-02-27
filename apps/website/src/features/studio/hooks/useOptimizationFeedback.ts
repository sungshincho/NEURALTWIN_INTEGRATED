/**
 * useOptimizationFeedback.ts
 *
 * Sprint 3 Task: S3-1, S3-2, S3-3
 *
 * AI 최적화 피드백 관리 훅
 * - Accept/Reject/Modify 액션
 * - 피드백 사유 입력
 * - 피드백 DB 저장 (strategy_feedback, optimization_feedback)
 */

import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

// ============================================================================
// 타입 정의
// ============================================================================

export type FeedbackAction = 'accept' | 'reject' | 'modify';
export type FeedbackTargetType = 'furniture_move' | 'product_placement' | 'zone_change' | 'overall';

export interface FeedbackReasonCode {
  code: string;
  category: FeedbackAction;
  label_ko: string;
  label_en: string;
  description?: string;
}

export interface FeedbackSubmission {
  optimizationId: string;
  targetType: FeedbackTargetType;
  targetId?: string;
  action: FeedbackAction;
  reasonCode?: string;
  reasonText?: string;
  originalSuggestion?: Record<string, any>;
  modifiedSuggestion?: Record<string, any>;
  aiConfidence?: number;
  vmdRulesApplied?: string[];
}

export interface FeedbackStats {
  total_recommendations: number;
  accepted: number;
  rejected: number;
  modified: number;
  acceptance_rate: number;
}

export interface UseOptimizationFeedbackOptions {
  storeId: string;
  userId?: string;
  onFeedbackSubmitted?: (feedback: FeedbackSubmission) => void;
  onError?: (error: Error) => void;
}

export interface UseOptimizationFeedbackReturn {
  // 상태
  isSubmitting: boolean;
  reasonCodes: FeedbackReasonCode[];
  feedbackStats: FeedbackStats | null;

  // 액션
  submitFeedback: (feedback: FeedbackSubmission) => Promise<boolean>;
  submitBulkFeedback: (feedbacks: FeedbackSubmission[]) => Promise<boolean>;

  // 유틸리티
  loadReasonCodes: () => Promise<void>;
  loadFeedbackStats: () => Promise<void>;
  getReasonCodesForAction: (action: FeedbackAction) => FeedbackReasonCode[];
}

// ============================================================================
// 메인 훅
// ============================================================================

export function useOptimizationFeedback({
  storeId,
  userId,
  onFeedbackSubmitted,
  onError,
}: UseOptimizationFeedbackOptions): UseOptimizationFeedbackReturn {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [reasonCodes, setReasonCodes] = useState<FeedbackReasonCode[]>([]);
  const [feedbackStats, setFeedbackStats] = useState<FeedbackStats | null>(null);

  // Supabase 타입 정의가 일부 테이블을 포함하지 않을 수 있어, 이 훅에서는 런타임 동작을 유지하며 타입만 완화
  const sb = supabase as any;

  // 사유 코드 로드
  const loadReasonCodes = useCallback(async () => {
    try {
      const { data, error } = await sb
        .from('feedback_reason_codes')
        .select('*')
        .eq('is_active', true)
        .order('display_order', { ascending: true });

      if (error) throw error;

      setReasonCodes((data || []) as FeedbackReasonCode[]);
    } catch (err) {
      console.error('[useOptimizationFeedback] Failed to load reason codes:', err);
    }
  }, []);

  // 피드백 통계 로드
  const loadFeedbackStats = useCallback(async () => {
    try {
      // store_personas 테이블에서 통계 조회
      const { data, error } = await sb
        .from('store_personas')
        .select('feedback_stats')
        .eq('store_id', storeId)
        .eq('is_active', true)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 = not found
        throw error;
      }

      if (data?.feedback_stats) {
        setFeedbackStats(data.feedback_stats as FeedbackStats);
      } else {
        // 기본값
        setFeedbackStats({
          total_recommendations: 0,
          accepted: 0,
          rejected: 0,
          modified: 0,
          acceptance_rate: 0,
        });
      }
    } catch (err) {
      console.error('[useOptimizationFeedback] Failed to load feedback stats:', err);
    }
  }, [storeId]);

  // 초기 로드
  useEffect(() => {
    loadReasonCodes();
    loadFeedbackStats();
  }, [loadReasonCodes, loadFeedbackStats]);

  // 단일 피드백 제출
  const submitFeedback = useCallback(async (feedback: FeedbackSubmission): Promise<boolean> => {
    setIsSubmitting(true);

    try {
      // 1. optimization_feedback 테이블에 저장
      const { error: feedbackError } = await sb
        .from('optimization_feedback')
        .insert({
          store_id: storeId,
          optimization_id: feedback.optimizationId,
          feedback_target_type: feedback.targetType,
          target_id: feedback.targetId,
          action: feedback.action,
          reason_code: feedback.reasonCode,
          reason_text: feedback.reasonText,
          original_suggestion: feedback.originalSuggestion,
          modified_suggestion: feedback.modifiedSuggestion,
          ai_confidence: feedback.aiConfidence,
          vmd_rules_applied: feedback.vmdRulesApplied,
          feedback_by: userId || 'anonymous',
        });

      if (feedbackError) {
        console.warn('[submitFeedback] optimization_feedback insert failed:', feedbackError);
        // 테이블이 없을 수 있으므로 경고만 출력하고 계속 진행
      }

      // 2. strategy_feedback 테이블에도 저장 (레거시 호환 + 학습 시스템 연동)
      if (feedback.targetType === 'overall') {
        const { error: strategyError } = await sb
          .from('strategy_feedback')
          .insert({
            org_id: await getOrgIdForStore(storeId),
            store_id: storeId,
            strategy_type: 'layout',
            ai_recommendation: {
              optimization_id: feedback.optimizationId,
              confidence: feedback.aiConfidence,
              vmd_rules: feedback.vmdRulesApplied,
            },
            was_applied: feedback.action === 'accept',
            learnings: {
              feedback_action: feedback.action,
              reason_code: feedback.reasonCode,
              reason_text: feedback.reasonText,
            },
          });

        if (strategyError) {
          console.warn('[submitFeedback] strategy_feedback insert failed:', strategyError);
        }
      }

      // 3. layout_optimization_results 상태 업데이트
      if (feedback.optimizationId) {
        const statusMap: Record<FeedbackAction, string> = {
          accept: 'applied',
          reject: 'rejected',
          modify: 'partial',
        };

         const { error: updateError } = await sb
           .from('layout_optimization_results')
           .update({
             status: statusMap[feedback.action],
             feedback_action: feedback.action,
             feedback_reason: feedback.reasonCode,
             feedback_note: feedback.reasonText,
             updated_at: new Date().toISOString(),
           })
           .eq('id', feedback.optimizationId);

        if (updateError) {
          console.warn('[submitFeedback] layout_optimization_results update failed:', updateError);
        }
      }

      // 통계 갱신
      await loadFeedbackStats();

      onFeedbackSubmitted?.(feedback);
      return true;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to submit feedback');
      onError?.(error);
      return false;
    } finally {
      setIsSubmitting(false);
    }
  }, [storeId, userId, loadFeedbackStats, onFeedbackSubmitted, onError]);

  // 대량 피드백 제출
  const submitBulkFeedback = useCallback(async (feedbacks: FeedbackSubmission[]): Promise<boolean> => {
    setIsSubmitting(true);

    try {
      const feedbackRecords = feedbacks.map(f => ({
        store_id: storeId,
        optimization_id: f.optimizationId,
        feedback_target_type: f.targetType,
        target_id: f.targetId,
        action: f.action,
        reason_code: f.reasonCode,
        reason_text: f.reasonText,
        original_suggestion: f.originalSuggestion,
        modified_suggestion: f.modifiedSuggestion,
        ai_confidence: f.aiConfidence,
        vmd_rules_applied: f.vmdRulesApplied,
        feedback_by: userId || 'anonymous',
      }));

      const { error } = await sb
        .from('optimization_feedback')
        .insert(feedbackRecords);

      if (error) {
        console.warn('[submitBulkFeedback] Insert failed:', error);
      }

      // 통계 갱신
      await loadFeedbackStats();

      feedbacks.forEach(f => onFeedbackSubmitted?.(f));
      return true;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to submit bulk feedback');
      onError?.(error);
      return false;
    } finally {
      setIsSubmitting(false);
    }
  }, [storeId, userId, loadFeedbackStats, onFeedbackSubmitted, onError]);

  // 액션별 사유 코드 필터
  const getReasonCodesForAction = useCallback((action: FeedbackAction): FeedbackReasonCode[] => {
    return reasonCodes.filter(code => code.category === action);
  }, [reasonCodes]);

  return {
    isSubmitting,
    reasonCodes,
    feedbackStats,

    submitFeedback,
    submitBulkFeedback,

    loadReasonCodes,
    loadFeedbackStats,
    getReasonCodesForAction,
  };
}

// ============================================================================
// 헬퍼 함수
// ============================================================================

async function getOrgIdForStore(storeId: string): Promise<string> {
  const { data } = await (supabase as any)
    .from('stores')
    .select('org_id')
    .eq('id', storeId)
    .single();

  return data?.org_id || storeId; // fallback to storeId if org not found
}

export default useOptimizationFeedback;
