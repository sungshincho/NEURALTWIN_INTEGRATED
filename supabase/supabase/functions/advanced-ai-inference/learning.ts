/**
 * learning.ts
 *
 * Continuous Learning 모듈
 * - 과거 성과 기반 신뢰도 계산
 * - 학습 컨텍스트 생성 (AI 프롬프트용)
 * - ROI 예측 검증
 */

import { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2.89.0';

// ============================================================================
// 타입 정의
// ============================================================================

export interface PastPerformanceResult {
  score: number; // 0-20 점
  sampleSize: number;
  successRate: number;
  avgAccuracy: number;
  confidenceAdjustment: number;
  explanation: string;
}

export interface LearningContext {
  successPatterns: SuccessPattern[];
  failurePatterns: FailurePattern[];
  confidenceAdjustment: number;
  contextSummary: string;
  promptAddition: string;
}

export interface SuccessPattern {
  id: string;
  summary: string;
  actualROI: number;
  keyChanges: string[];
  successFactors: string[];
}

export interface FailurePattern {
  id: string;
  summary: string;
  actualROI: number;
  failureFactors: string[];
}

export interface ROIValidationResult {
  isValid: boolean;
  adjustedPrediction: ROIPrediction;
  warnings: string[];
  confidenceModifier: number;
}

export interface ROIPrediction {
  expectedTrafficIncrease: number;
  expectedRevenueIncrease: number;
  expectedConversionIncrease: number;
}

export interface HistoricalPerformance {
  avgROI: number;
  maxROI: number;
  minROI: number;
  stdDev: number;
  sampleSize: number;
}

// ============================================================================
// 과거 성과 기반 신뢰도 점수 계산
// ============================================================================

export async function calculatePastPerformance(
  supabase: SupabaseClient,
  storeId: string,
  strategyType: string
): Promise<PastPerformanceResult> {
  try {
    // 최근 90일 피드백 데이터 조회
    const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString();

    const { data: feedback, error } = await supabase
      .from('strategy_feedback')
      .select('feedback_type, roi_accuracy, actual_roi, expected_roi')
      .eq('store_id', storeId)
      .eq('strategy_type', strategyType)
      .eq('result_measured', true)
      .gte('created_at', ninetyDaysAgo)
      .order('created_at', { ascending: false })
      .limit(20);

    if (error) {
      console.error('[Learning] Failed to fetch feedback:', error.message);
      return getDefaultPerformance('데이터 조회 실패');
    }

    if (!feedback || feedback.length === 0) {
      return getDefaultPerformance('과거 피드백 데이터 없음');
    }

    // 성공률 계산
    const successCount = feedback.filter((f) => f.feedback_type === 'success').length;
    const successRate = successCount / feedback.length;

    // 예측 정확도 계산 (roi_accuracy 평균)
    const accuracyValues = feedback
      .filter((f) => f.roi_accuracy !== null)
      .map((f) => f.roi_accuracy);
    const avgAccuracy = accuracyValues.length > 0
      ? accuracyValues.reduce((sum, v) => sum + v, 0) / accuracyValues.length
      : 0;

    // 점수 계산 (최대 20점)
    // - 성공률 기반: 0-12점
    // - 예측 정확도 기반: 0-8점
    const successScore = Math.round(successRate * 12);
    const accuracyScore = Math.round((avgAccuracy / 100) * 8);
    const totalScore = Math.min(20, successScore + accuracyScore);

    // 신뢰도 조정값 계산
    const roiDiffs = feedback
      .filter((f) => f.actual_roi !== null && f.expected_roi !== null)
      .map((f) => f.actual_roi - f.expected_roi);
    const avgRoiDiff = roiDiffs.length > 0
      ? roiDiffs.reduce((sum, v) => sum + v, 0) / roiDiffs.length
      : 0;
    const confidenceAdjustment = Math.round(avgRoiDiff / 5); // ROI 차이의 1/5을 조정값으로

    const explanation = buildPerformanceExplanation(
      feedback.length,
      successRate,
      avgAccuracy,
      confidenceAdjustment
    );

    return {
      score: totalScore,
      sampleSize: feedback.length,
      successRate: Math.round(successRate * 100),
      avgAccuracy: Math.round(avgAccuracy),
      confidenceAdjustment,
      explanation,
    };
  } catch (err) {
    console.error('[Learning] Error calculating past performance:', err);
    return getDefaultPerformance('계산 오류');
  }
}

function getDefaultPerformance(reason: string): PastPerformanceResult {
  return {
    score: 5, // 기본값 (데이터 없음)
    sampleSize: 0,
    successRate: 0,
    avgAccuracy: 0,
    confidenceAdjustment: 0,
    explanation: reason,
  };
}

function buildPerformanceExplanation(
  sampleSize: number,
  successRate: number,
  avgAccuracy: number,
  adjustment: number
): string {
  const parts: string[] = [];

  if (sampleSize >= 10) {
    parts.push(`${sampleSize}건의 충분한 과거 데이터`);
  } else if (sampleSize >= 5) {
    parts.push(`${sampleSize}건의 과거 데이터`);
  } else {
    parts.push(`${sampleSize}건의 제한적 데이터`);
  }

  if (successRate >= 0.7) {
    parts.push(`높은 성공률 ${Math.round(successRate * 100)}%`);
  } else if (successRate >= 0.5) {
    parts.push(`보통 성공률 ${Math.round(successRate * 100)}%`);
  } else if (sampleSize > 0) {
    parts.push(`낮은 성공률 ${Math.round(successRate * 100)}%`);
  }

  if (avgAccuracy >= 80) {
    parts.push(`우수한 예측 정확도 ${Math.round(avgAccuracy)}%`);
  } else if (avgAccuracy >= 60) {
    parts.push(`보통 예측 정확도 ${Math.round(avgAccuracy)}%`);
  }

  if (adjustment > 0) {
    parts.push(`ROI 상향 조정 필요 (+${adjustment}%p)`);
  } else if (adjustment < 0) {
    parts.push(`ROI 하향 조정 필요 (${adjustment}%p)`);
  }

  return parts.join(', ') || '평가 데이터 부족';
}

// ============================================================================
// 학습 컨텍스트 생성 (AI 프롬프트용)
// ============================================================================

export async function buildLearningContext(
  supabase: SupabaseClient,
  storeId: string,
  strategyType: string
): Promise<LearningContext> {
  try {
    // 1. 성공 패턴 조회
    const { data: successData } = await supabase.rpc('get_success_patterns', {
      p_store_id: storeId,
      p_strategy_type: strategyType,
      p_limit: 5,
    });

    // 2. 실패 패턴 조회
    const { data: failureData } = await supabase.rpc('get_failure_patterns', {
      p_store_id: storeId,
      p_strategy_type: strategyType,
      p_limit: 3,
    });

    // 3. 신뢰도 조정값 조회
    const { data: adjustmentData } = await supabase.rpc('calculate_confidence_adjustment', {
      p_store_id: storeId,
      p_strategy_type: strategyType,
      p_days: 90,
    });

    // 성공 패턴 파싱
    const successPatterns: SuccessPattern[] = (successData || []).map((p: any) => ({
      id: p.id,
      summary: summarizeRecommendation(p.recommendation),
      actualROI: p.actualROI || 0,
      keyChanges: extractKeyChanges(p.recommendation),
      successFactors: p.learnings?.success_factors || [],
    }));

    // 실패 패턴 파싱
    const failurePatterns: FailurePattern[] = (failureData || []).map((p: any) => ({
      id: p.id,
      summary: summarizeRecommendation(p.recommendation),
      actualROI: p.actualROI || 0,
      failureFactors: p.learnings?.failure_factors || [],
    }));

    const confidenceAdjustment = adjustmentData?.recommendedAdjustment || 0;

    // 컨텍스트 요약 생성
    const contextSummary = buildContextSummary(
      successPatterns,
      failurePatterns,
      confidenceAdjustment
    );

    // AI 프롬프트 추가 문구 생성
    const promptAddition = buildPromptAddition(
      successPatterns,
      failurePatterns,
      confidenceAdjustment
    );

    return {
      successPatterns,
      failurePatterns,
      confidenceAdjustment,
      contextSummary,
      promptAddition,
    };
  } catch (err) {
    console.error('[Learning] Error building learning context:', err);
    return {
      successPatterns: [],
      failurePatterns: [],
      confidenceAdjustment: 0,
      contextSummary: '학습 데이터 없음',
      promptAddition: '',
    };
  }
}

function summarizeRecommendation(recommendation: any): string {
  if (!recommendation) return '요약 없음';

  const type = recommendation.type || '일반';
  const changesCount = recommendation.changes?.length ||
    recommendation.layoutChanges?.length || 0;
  const expectedROI = recommendation.expectedROI ||
    recommendation.optimizationSummary?.expectedRevenueIncrease || 0;

  return `${type} 최적화 (${changesCount}개 변경, 예상 ROI ${expectedROI}%)`;
}

function extractKeyChanges(recommendation: any): string[] {
  const changes: string[] = [];

  const layoutChanges = recommendation?.layoutChanges || recommendation?.changes || [];
  layoutChanges.slice(0, 3).forEach((change: any) => {
    if (change.entityLabel && change.reason) {
      changes.push(`${change.entityLabel}: ${change.reason}`);
    } else if (change.description) {
      changes.push(change.description);
    }
  });

  return changes;
}

function buildContextSummary(
  successPatterns: SuccessPattern[],
  failurePatterns: FailurePattern[],
  adjustment: number
): string {
  const parts: string[] = [];

  if (successPatterns.length > 0) {
    const avgSuccessROI = successPatterns.reduce((sum, p) => sum + p.actualROI, 0) / successPatterns.length;
    parts.push(`성공 사례 ${successPatterns.length}건 (평균 ROI ${Math.round(avgSuccessROI)}%)`);
  }

  if (failurePatterns.length > 0) {
    parts.push(`실패 사례 ${failurePatterns.length}건 참조`);
  }

  if (adjustment !== 0) {
    parts.push(`신뢰도 조정 ${adjustment > 0 ? '+' : ''}${adjustment}%p 권장`);
  }

  return parts.join(' | ') || '학습 데이터 없음';
}

function buildPromptAddition(
  successPatterns: SuccessPattern[],
  failurePatterns: FailurePattern[],
  adjustment: number
): string {
  if (successPatterns.length === 0 && failurePatterns.length === 0) {
    return '';
  }

  let prompt = `
=== 📚 과거 학습 데이터 (Continuous Learning) ===
`;

  if (successPatterns.length > 0) {
    prompt += `
✅ 성공한 전략 패턴 (참고하여 유사하게 추천):
${successPatterns.map((p, i) => `
${i + 1}. ROI ${p.actualROI}% 달성
   - 요약: ${p.summary}
   ${p.keyChanges.length > 0 ? `- 주요 변경: ${p.keyChanges.join('; ')}` : ''}
   ${p.successFactors.length > 0 ? `- 성공 요인: ${p.successFactors.join(', ')}` : ''}
`).join('')}
`;
  }

  if (failurePatterns.length > 0) {
    prompt += `
⚠️ 피해야 할 패턴 (이런 방향은 지양):
${failurePatterns.map((p, i) => `
${i + 1}. ROI ${p.actualROI}% (실패)
   - 요약: ${p.summary}
   ${p.failureFactors.length > 0 ? `- 실패 원인: ${p.failureFactors.join(', ')}` : ''}
`).join('')}
`;
  }

  if (adjustment !== 0) {
    prompt += `
📊 과거 데이터 기반 조정:
- ROI 예측 시 ${adjustment > 0 ? '상향' : '하향'} 조정 권장 (${adjustment > 0 ? '+' : ''}${adjustment}%p)
- 과거 예측이 실제보다 ${adjustment > 0 ? '낮았음' : '높았음'}
`;
  }

  return prompt;
}

// ============================================================================
// ROI 예측 검증
// ============================================================================

export async function validateROIPrediction(
  supabase: SupabaseClient,
  storeId: string,
  strategyType: string,
  prediction: ROIPrediction
): Promise<ROIValidationResult> {
  const warnings: string[] = [];
  const adjusted = { ...prediction };
  let confidenceModifier = 0;

  try {
    // 과거 성과 데이터 조회
    const historical = await getHistoricalPerformance(supabase, storeId, strategyType);

    // 1. 비현실적으로 높은 예측 조정
    const maxRealisticROI = Math.max(
      historical.avgROI + 2 * historical.stdDev,
      historical.maxROI * 1.2,
      30 // 절대 상한
    );

    if (prediction.expectedRevenueIncrease > maxRealisticROI) {
      warnings.push(
        `매출 증가 예측이 비현실적으로 높음: ${prediction.expectedRevenueIncrease}% → ${Math.round(maxRealisticROI)}%로 조정`
      );
      adjusted.expectedRevenueIncrease = Math.round(maxRealisticROI);
      confidenceModifier -= 10; // 신뢰도 감소
    }

    // 2. 비현실적으로 낮은 예측 조정
    const minRealisticROI = Math.min(
      historical.minROI - historical.stdDev,
      -20 // 절대 하한
    );

    if (prediction.expectedRevenueIncrease < minRealisticROI) {
      warnings.push(
        `매출 감소 예측이 너무 비관적: ${prediction.expectedRevenueIncrease}% → ${Math.round(minRealisticROI)}%로 조정`
      );
      adjusted.expectedRevenueIncrease = Math.round(minRealisticROI);
      confidenceModifier -= 5;
    }

    // 3. 일관성 검증 (매출 증가 = 트래픽 증가 × 전환율 증가 - 1)
    const expectedFromComponents =
      ((1 + prediction.expectedTrafficIncrease / 100) *
        (1 + prediction.expectedConversionIncrease / 100) - 1) * 100;

    const diff = Math.abs(prediction.expectedRevenueIncrease - expectedFromComponents);
    if (diff > 10) {
      warnings.push(
        `매출 예측(${prediction.expectedRevenueIncrease}%)과 트래픽/전환율 기반 계산(${Math.round(expectedFromComponents)}%)이 불일치`
      );
      // 불일치 시 트래픽/전환율 기반 값으로 조정
      adjusted.expectedRevenueIncrease = Math.round(expectedFromComponents);
    }

    // 4. 트래픽/전환율 개별 검증
    if (prediction.expectedTrafficIncrease > 50) {
      warnings.push(`트래픽 증가 예측이 높음: ${prediction.expectedTrafficIncrease}% → 50%로 조정`);
      adjusted.expectedTrafficIncrease = 50;
    }

    if (prediction.expectedConversionIncrease > 30) {
      warnings.push(`전환율 증가 예측이 높음: ${prediction.expectedConversionIncrease}% → 30%로 조정`);
      adjusted.expectedConversionIncrease = 30;
    }

    return {
      isValid: warnings.length === 0,
      adjustedPrediction: adjusted,
      warnings,
      confidenceModifier,
    };
  } catch (err) {
    console.error('[Learning] Error validating ROI prediction:', err);
    return {
      isValid: true,
      adjustedPrediction: prediction,
      warnings: [],
      confidenceModifier: 0,
    };
  }
}

async function getHistoricalPerformance(
  supabase: SupabaseClient,
  storeId: string,
  strategyType: string
): Promise<HistoricalPerformance> {
  try {
    const { data: feedback } = await supabase
      .from('strategy_feedback')
      .select('actual_roi')
      .eq('store_id', storeId)
      .eq('strategy_type', strategyType)
      .eq('result_measured', true)
      .not('actual_roi', 'is', null)
      .order('created_at', { ascending: false })
      .limit(50);

    if (!feedback || feedback.length < 3) {
      return {
        avgROI: 10,
        maxROI: 25,
        minROI: -5,
        stdDev: 10,
        sampleSize: 0,
      };
    }

    const rois = feedback.map((f) => f.actual_roi);
    const avgROI = rois.reduce((sum, v) => sum + v, 0) / rois.length;
    const maxROI = Math.max(...rois);
    const minROI = Math.min(...rois);

    // 표준편차 계산
    const squaredDiffs = rois.map((v) => Math.pow(v - avgROI, 2));
    const avgSquaredDiff = squaredDiffs.reduce((sum, v) => sum + v, 0) / rois.length;
    const stdDev = Math.sqrt(avgSquaredDiff);

    return {
      avgROI,
      maxROI,
      minROI,
      stdDev,
      sampleSize: feedback.length,
    };
  } catch (err) {
    console.error('[Learning] Error getting historical performance:', err);
    return {
      avgROI: 10,
      maxROI: 25,
      minROI: -5,
      stdDev: 10,
      sampleSize: 0,
    };
  }
}

// ============================================================================
// 피드백 저장 헬퍼
// ============================================================================

export async function saveFeedbackRecord(
  supabase: SupabaseClient,
  data: {
    orgId: string;
    storeId: string;
    strategyType: string;
    aiRecommendation: any;
    expectedROI: number;
    strategyId?: string;
  }
): Promise<{ id: string } | null> {
  try {
    const { data: inserted, error } = await supabase
      .from('strategy_feedback')
      .insert({
        org_id: data.orgId,
        store_id: data.storeId,
        strategy_type: data.strategyType,
        strategy_id: data.strategyId || null,
        ai_recommendation: data.aiRecommendation,
        expected_roi: data.expectedROI,
        was_applied: false,
        result_measured: false,
      })
      .select('id')
      .single();

    if (error) {
      console.error('[Learning] Failed to save feedback record:', error.message);
      return null;
    }

    return inserted;
  } catch (err) {
    console.error('[Learning] Error saving feedback:', err);
    return null;
  }
}

export async function updateFeedbackApplied(
  supabase: SupabaseClient,
  feedbackId: string,
  baselineMetrics: any
): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('strategy_feedback')
      .update({
        was_applied: true,
        applied_at: new Date().toISOString(),
        baseline_metrics: baselineMetrics,
        measurement_start_date: new Date().toISOString().split('T')[0],
      })
      .eq('id', feedbackId);

    return !error;
  } catch (err) {
    console.error('[Learning] Error updating feedback applied:', err);
    return false;
  }
}

export async function completeFeedbackMeasurement(
  supabase: SupabaseClient,
  feedbackId: string,
  actualMetrics: any,
  actualROI: number,
  learnings?: any
): Promise<boolean> {
  try {
    const { data: feedback } = await supabase
      .from('strategy_feedback')
      .select('expected_roi')
      .eq('id', feedbackId)
      .single();

    const expectedROI = feedback?.expected_roi || 0;

    // 피드백 타입 결정
    let feedbackType: string;
    if (actualROI >= expectedROI * 0.8) {
      feedbackType = 'success';
    } else if (actualROI >= expectedROI * 0.5) {
      feedbackType = 'partial';
    } else if (actualROI < 0) {
      feedbackType = 'negative';
    } else {
      feedbackType = 'failure';
    }

    // ROI 정확도 계산
    const roiAccuracy = expectedROI !== 0
      ? Math.max(0, 100 - Math.abs((actualROI - expectedROI) / expectedROI) * 100)
      : 0;

    const { error } = await supabase
      .from('strategy_feedback')
      .update({
        result_measured: true,
        measurement_end_date: new Date().toISOString().split('T')[0],
        actual_metrics: actualMetrics,
        actual_roi: actualROI,
        roi_accuracy: Math.round(roiAccuracy),
        feedback_type: feedbackType,
        learnings: learnings || null,
      })
      .eq('id', feedbackId);

    return !error;
  } catch (err) {
    console.error('[Learning] Error completing measurement:', err);
    return false;
  }
}
