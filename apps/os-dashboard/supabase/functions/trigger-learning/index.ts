/**
 * trigger-learning Edge Function
 *
 * Sprint 3 Task: S3-5
 *
 * 자동 학습 트리거
 * - 피드백 축적 시 자동 페르소나 업데이트
 * - 성공/실패 패턴 분석
 * - 신뢰도 조정값 계산
 *
 * 작성일: 2026-01-12
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.89.0';

// ============================================================================
// 타입 정의
// ============================================================================

interface TriggerLearningRequest {
  store_id: string;
  learning_type?: 'full' | 'incremental' | 'confidence_only';
  min_feedback_count?: number;
}

interface LearningResult {
  success: boolean;
  store_id: string;
  learning_type: string;
  feedbacks_analyzed: number;
  adjustments_made: {
    confidence_adjustments: Record<string, number>;
    pattern_updates: number;
    preference_updates: number;
  };
  new_learning_version: number;
  error?: string;
}

// ============================================================================
// CORS 헤더
// ============================================================================

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// ============================================================================
// 메인 핸들러
// ============================================================================

serve(async (req) => {
  // CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const body: TriggerLearningRequest = await req.json();
    const {
      store_id,
      learning_type = 'incremental',
      min_feedback_count = 5,
    } = body;

    if (!store_id) {
      throw new Error('store_id is required');
    }

    console.log(`[trigger-learning] Starting ${learning_type} learning for store ${store_id}`);

    // 1. 학습 세션 시작
    const { data: session, error: sessionError } = await supabase
      .from('learning_sessions')
      .insert({
        store_id,
        status: 'processing',
      })
      .select()
      .single();

    if (sessionError) {
      console.warn('[trigger-learning] Could not create learning session:', sessionError);
    }

    // 2. 최근 피드백 조회
    const { data: feedbacks, error: feedbackError } = await supabase
      .from('optimization_feedback')
      .select('*')
      .eq('store_id', store_id)
      .order('created_at', { ascending: false })
      .limit(100);

    if (feedbackError) {
      throw new Error(`Failed to fetch feedbacks: ${feedbackError.message}`);
    }

    const feedbackCount = feedbacks?.length || 0;
    console.log(`[trigger-learning] Found ${feedbackCount} feedbacks`);

    if (feedbackCount < min_feedback_count) {
      // 충분한 피드백 없음
      const result: LearningResult = {
        success: true,
        store_id,
        learning_type,
        feedbacks_analyzed: feedbackCount,
        adjustments_made: {
          confidence_adjustments: {},
          pattern_updates: 0,
          preference_updates: 0,
        },
        new_learning_version: 0,
        error: `Insufficient feedbacks (${feedbackCount} < ${min_feedback_count})`,
      };

      return new Response(JSON.stringify(result), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // 3. 현재 페르소나 로드 또는 생성
    let persona = await loadOrCreatePersona(supabase, store_id);

    // 4. 피드백 분석
    const analysis = analyzeFeedbacks(feedbacks || []);

    // 5. 신뢰도 조정값 계산
    const confidenceAdjustments = calculateConfidenceAdjustments(analysis);

    // 6. 성공/실패 패턴 추출
    const patterns = extractPatterns(feedbacks || []);

    // 7. VMD 선호도 분석
    const vmdPreferences = analyzeVMDPreferences(feedbacks || []);

    // 8. 페르소나 업데이트
    const { data: updatedPersona, error: updateError } = await supabase
      .from('store_personas')
      .update({
        confidence_adjustments: {
          ...persona.confidence_adjustments,
          ...confidenceAdjustments,
        },
        learned_context: {
          ...persona.learned_context,
          success_patterns: patterns.successPatterns.slice(0, 10),
          failure_patterns: patterns.failurePatterns.slice(0, 5),
        },
        vmd_preferences: {
          ...persona.vmd_preferences,
          prefer_rules: vmdPreferences.preferRules,
          avoid_rules: vmdPreferences.avoidRules,
        },
        last_learning_at: new Date().toISOString(),
        learning_version: persona.learning_version + 1,
        updated_at: new Date().toISOString(),
      })
      .eq('id', persona.id)
      .select()
      .single();

    if (updateError) {
      throw new Error(`Failed to update persona: ${updateError.message}`);
    }

    // 9. 학습 세션 완료
    if (session) {
      await supabase
        .from('learning_sessions')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString(),
          predictions_evaluated: feedbackCount,
          adjustments_proposed: Object.keys(confidenceAdjustments).length,
          adjustments_applied: Object.keys(confidenceAdjustments).length,
          improvement_metrics: {
            acceptance_rate_before: analysis.previousAcceptanceRate,
            pattern_count: patterns.successPatterns.length + patterns.failurePatterns.length,
            confidence_deltas: confidenceAdjustments,
          },
        })
        .eq('id', session.id);
    }

    // 10. 결과 반환
    const result: LearningResult = {
      success: true,
      store_id,
      learning_type,
      feedbacks_analyzed: feedbackCount,
      adjustments_made: {
        confidence_adjustments: confidenceAdjustments,
        pattern_updates: patterns.successPatterns.length + patterns.failurePatterns.length,
        preference_updates: vmdPreferences.preferRules.length + vmdPreferences.avoidRules.length,
      },
      new_learning_version: updatedPersona?.learning_version || persona.learning_version + 1,
    };

    console.log(`[trigger-learning] Completed: ${JSON.stringify(result)}`);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('[trigger-learning] Error:', error);

    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});

// ============================================================================
// 헬퍼 함수
// ============================================================================

async function loadOrCreatePersona(supabase: any, storeId: string) {
  const { data: existing, error } = await supabase
    .from('store_personas')
    .select('*')
    .eq('store_id', storeId)
    .eq('is_active', true)
    .single();

  if (existing) {
    return existing;
  }

  // 없으면 생성
  const { data: newPersona, error: createError } = await supabase
    .from('store_personas')
    .insert({ store_id: storeId })
    .select()
    .single();

  if (createError) {
    throw new Error(`Failed to create persona: ${createError.message}`);
  }

  return newPersona;
}

interface FeedbackAnalysis {
  totalCount: number;
  acceptCount: number;
  rejectCount: number;
  modifyCount: number;
  acceptanceRate: number;
  previousAcceptanceRate: number;
  byTargetType: Record<string, { accept: number; reject: number; modify: number }>;
  averageConfidence: {
    accepted: number;
    rejected: number;
  };
}

function analyzeFeedbacks(feedbacks: any[]): FeedbackAnalysis {
  const acceptCount = feedbacks.filter(f => f.action === 'accept').length;
  const rejectCount = feedbacks.filter(f => f.action === 'reject').length;
  const modifyCount = feedbacks.filter(f => f.action === 'modify').length;
  const totalCount = feedbacks.length;

  // 타겟 타입별 분석
  const byTargetType: Record<string, { accept: number; reject: number; modify: number }> = {};
  for (const f of feedbacks) {
    const type = f.feedback_target_type || 'unknown';
    if (!byTargetType[type]) {
      byTargetType[type] = { accept: 0, reject: 0, modify: 0 };
    }
    byTargetType[type][f.action as 'accept' | 'reject' | 'modify']++;
  }

  // 신뢰도별 분석
  const acceptedWithConfidence = feedbacks.filter(f => f.action === 'accept' && f.ai_confidence);
  const rejectedWithConfidence = feedbacks.filter(f => f.action === 'reject' && f.ai_confidence);

  return {
    totalCount,
    acceptCount,
    rejectCount,
    modifyCount,
    acceptanceRate: totalCount > 0 ? acceptCount / totalCount : 0,
    previousAcceptanceRate: 0, // TODO: 이전 기간 비교
    byTargetType,
    averageConfidence: {
      accepted: acceptedWithConfidence.length > 0
        ? acceptedWithConfidence.reduce((sum, f) => sum + f.ai_confidence, 0) / acceptedWithConfidence.length
        : 0.75,
      rejected: rejectedWithConfidence.length > 0
        ? rejectedWithConfidence.reduce((sum, f) => sum + f.ai_confidence, 0) / rejectedWithConfidence.length
        : 0.75,
    },
  };
}

function calculateConfidenceAdjustments(analysis: FeedbackAnalysis): Record<string, number> {
  const adjustments: Record<string, number> = {};

  // 타겟 타입별 신뢰도 조정
  for (const [targetType, stats] of Object.entries(analysis.byTargetType)) {
    const total = stats.accept + stats.reject + stats.modify;
    if (total < 3) continue; // 최소 샘플 수

    const typeRate = stats.accept / total;

    // 최적화 타입 매핑
    const optimizationType = {
      furniture_move: 'layout',
      product_placement: 'layout',
      zone_change: 'flow',
      overall: 'layout',
    }[targetType] || 'layout';

    // 조정값 계산:
    // - 수용률 80% 이상: +5
    // - 수용률 60-80%: +2
    // - 수용률 40-60%: 0
    // - 수용률 20-40%: -3
    // - 수용률 20% 미만: -7
    let adjustment = 0;
    if (typeRate >= 0.8) adjustment = 5;
    else if (typeRate >= 0.6) adjustment = 2;
    else if (typeRate >= 0.4) adjustment = 0;
    else if (typeRate >= 0.2) adjustment = -3;
    else adjustment = -7;

    adjustments[optimizationType] = (adjustments[optimizationType] || 0) + adjustment;
  }

  // -20 ~ +20 범위로 제한
  for (const key of Object.keys(adjustments)) {
    adjustments[key] = Math.max(-20, Math.min(20, adjustments[key]));
  }

  return adjustments;
}

interface Patterns {
  successPatterns: Array<{
    target_type: string;
    vmd_rules: string[];
    confidence: number;
    count: number;
  }>;
  failurePatterns: Array<{
    target_type: string;
    vmd_rules: string[];
    reason: string;
    count: number;
  }>;
}

function extractPatterns(feedbacks: any[]): Patterns {
  // 성공 패턴: 수용된 추천들
  const successMap = new Map<string, any>();
  const failureMap = new Map<string, any>();

  for (const f of feedbacks) {
    const key = `${f.feedback_target_type}_${(f.vmd_rules_applied || []).sort().join(',')}`;

    if (f.action === 'accept') {
      const existing = successMap.get(key);
      if (existing) {
        existing.count++;
        existing.confidence = (existing.confidence + (f.ai_confidence || 0.75)) / 2;
      } else {
        successMap.set(key, {
          target_type: f.feedback_target_type,
          vmd_rules: f.vmd_rules_applied || [],
          confidence: f.ai_confidence || 0.75,
          count: 1,
        });
      }
    } else if (f.action === 'reject') {
      const existing = failureMap.get(key);
      if (existing) {
        existing.count++;
      } else {
        failureMap.set(key, {
          target_type: f.feedback_target_type,
          vmd_rules: f.vmd_rules_applied || [],
          reason: f.reason_code || 'unknown',
          count: 1,
        });
      }
    }
  }

  // 빈도순 정렬
  const successPatterns = Array.from(successMap.values())
    .sort((a, b) => b.count - a.count);

  const failurePatterns = Array.from(failureMap.values())
    .sort((a, b) => b.count - a.count);

  return { successPatterns, failurePatterns };
}

interface VMDPreferenceAnalysis {
  preferRules: string[];
  avoidRules: string[];
}

function analyzeVMDPreferences(feedbacks: any[]): VMDPreferenceAnalysis {
  const ruleStats = new Map<string, { accept: number; reject: number }>();

  for (const f of feedbacks) {
    const rules = f.vmd_rules_applied || [];
    for (const rule of rules) {
      const stats = ruleStats.get(rule) || { accept: 0, reject: 0 };
      if (f.action === 'accept') {
        stats.accept++;
      } else if (f.action === 'reject') {
        stats.reject++;
      }
      ruleStats.set(rule, stats);
    }
  }

  const preferRules: string[] = [];
  const avoidRules: string[] = [];

  for (const [rule, stats] of ruleStats.entries()) {
    const total = stats.accept + stats.reject;
    if (total < 3) continue;

    const acceptRate = stats.accept / total;

    if (acceptRate >= 0.7) {
      preferRules.push(rule);
    } else if (acceptRate <= 0.3) {
      avoidRules.push(rule);
    }
  }

  return { preferRules, avoidRules };
}
