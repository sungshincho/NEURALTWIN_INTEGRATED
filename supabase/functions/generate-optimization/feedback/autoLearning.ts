/**
 * Phase 4.2: Auto Learning System
 *
 * 예측 모델의 자동 학습 및 교정 시스템
 * - 예측 vs 실제 결과 비교
 * - 바이어스 교정 및 가중치 조정
 * - 모델 파라미터 업데이트 및 버전 관리
 */

import { createClient, SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2.89.0';

// ============================================================================
// Type Definitions
// ============================================================================

/** 예측 타입 */
export type PredictionType = 'revenue' | 'conversion' | 'dwell_time' | 'flow';

/** 조정 타입 */
export type AdjustmentType = 'weight' | 'bias' | 'threshold' | 'coefficient';

/** 조정 상태 */
export type AdjustmentStatus = 'proposed' | 'applied' | 'rejected' | 'reverted';

/** 학습 세션 상태 */
export type LearningSessionStatus = 'started' | 'processing' | 'completed' | 'failed';

/** 모델 파라미터 구조 */
export interface ModelParameters {
  // Revenue prediction weights
  revenue: {
    baselineWeight: number;
    trafficWeight: number;
    seasonalityWeight: number;
    promotionWeight: number;
    layoutWeight: number;
    weatherWeight: number;
    competitorWeight: number;
    biasCorrection: number;
  };
  // Conversion prediction weights
  conversion: {
    baseRate: number;
    layoutEffectWeight: number;
    productMixWeight: number;
    trafficQualityWeight: number;
    seasonalWeight: number;
    promotionWeight: number;
    biasCorrection: number;
  };
  // Dwell time prediction weights
  dwellTime: {
    baseMinutes: number;
    zoneAttractivenessWeight: number;
    crowdingWeight: number;
    layoutComplexityWeight: number;
    biasCorrection: number;
  };
  // Flow prediction weights
  flow: {
    entranceWeight: number;
    pathResistanceWeight: number;
    attractorWeight: number;
    biasCorrection: number;
  };
}

/** 저장된 모델 파라미터 (DB 스키마) */
export interface StoredModelParameters {
  id: string;
  store_id: string;
  parameter_key: string;
  parameter_value: number;
  prediction_type: PredictionType;
  created_at: string;
  updated_at: string;
  version: number;
  is_active: boolean;
}

/** 학습 조정 기록 (DB 스키마) */
export interface LearningAdjustment {
  id: string;
  store_id: string;
  prediction_type: PredictionType;
  adjustment_type: AdjustmentType;
  parameter_key: string;
  old_value: number;
  new_value: number;
  confidence: number;
  sample_size: number;
  status: AdjustmentStatus;
  session_id: string;
  created_at: string;
  applied_at?: string;
}

/** 학습 세션 (DB 스키마) */
export interface LearningSession {
  id: string;
  store_id: string;
  started_at: string;
  completed_at?: string;
  status: LearningSessionStatus;
  predictions_evaluated: number;
  adjustments_proposed: number;
  adjustments_applied: number;
  improvement_metrics: ImprovementMetrics;
  error_message?: string;
}

/** 개선 메트릭 */
export interface ImprovementMetrics {
  before: {
    mape: number; // Mean Absolute Percentage Error
    rmse: number; // Root Mean Square Error
    bias: number; // Systematic bias
  };
  after: {
    mape: number;
    rmse: number;
    bias: number;
  };
  improvement_percentage: number;
}

/** 예측 기록 (비교용) */
export interface PredictionRecord {
  id: string;
  store_id: string;
  prediction_type: PredictionType;
  predicted_value: number;
  actual_value: number;
  prediction_date: string;
  context: Record<string, unknown>;
}

/** 성능 평가 결과 */
export interface PerformanceEvaluation {
  predictionType: PredictionType;
  sampleSize: number;
  metrics: {
    mape: number; // Mean Absolute Percentage Error
    rmse: number; // Root Mean Square Error
    mae: number;  // Mean Absolute Error
    bias: number; // Systematic bias (mean error)
    correlation: number; // Pearson correlation
  };
  distribution: {
    underPrediction: number; // % of under-predictions
    overPrediction: number;  // % of over-predictions
    withinThreshold: number; // % within acceptable threshold
  };
  outliers: PredictionRecord[];
  recentTrend: 'improving' | 'stable' | 'degrading';
}

/** 제안된 조정 */
export interface ProposedAdjustment {
  parameterKey: string;
  adjustmentType: AdjustmentType;
  predictionType: PredictionType;
  currentValue: number;
  proposedValue: number;
  changeRatio: number;
  confidence: number;
  reasoning: string;
  expectedImprovement: number;
}

/** 조정 적용 결과 */
export interface AdjustmentResult {
  adjustment: ProposedAdjustment;
  applied: boolean;
  newValue: number;
  error?: string;
}

/** 학습 세션 요약 */
export interface LearningSessionSummary {
  sessionId: string;
  storeId: string;
  duration: number; // seconds
  predictionsEvaluated: number;
  adjustmentsProposed: number;
  adjustmentsApplied: number;
  improvementMetrics: ImprovementMetrics;
  appliedAdjustments: Array<{
    parameter: string;
    oldValue: number;
    newValue: number;
    improvement: string;
  }>;
}

// ============================================================================
// Default Model Parameters
// ============================================================================

export const DEFAULT_MODEL_PARAMETERS: ModelParameters = {
  revenue: {
    baselineWeight: 1.0,
    trafficWeight: 0.3,
    seasonalityWeight: 0.2,
    promotionWeight: 0.15,
    layoutWeight: 0.15,
    weatherWeight: 0.1,
    competitorWeight: 0.1,
    biasCorrection: 0,
  },
  conversion: {
    baseRate: 0.25,
    layoutEffectWeight: 0.2,
    productMixWeight: 0.2,
    trafficQualityWeight: 0.2,
    seasonalWeight: 0.15,
    promotionWeight: 0.25,
    biasCorrection: 0,
  },
  dwellTime: {
    baseMinutes: 15,
    zoneAttractivenessWeight: 0.3,
    crowdingWeight: -0.2,
    layoutComplexityWeight: 0.15,
    biasCorrection: 0,
  },
  flow: {
    entranceWeight: 0.4,
    pathResistanceWeight: -0.3,
    attractorWeight: 0.3,
    biasCorrection: 0,
  },
};

// ============================================================================
// Statistical Helper Functions
// ============================================================================

/**
 * Mean Absolute Percentage Error 계산
 */
function calculateMAPE(predictions: number[], actuals: number[]): number {
  if (predictions.length === 0 || predictions.length !== actuals.length) {
    return 0;
  }

  let sumAPE = 0;
  let validCount = 0;

  for (let i = 0; i < predictions.length; i++) {
    if (actuals[i] !== 0) {
      sumAPE += Math.abs((actuals[i] - predictions[i]) / actuals[i]);
      validCount++;
    }
  }

  return validCount > 0 ? (sumAPE / validCount) * 100 : 0;
}

/**
 * Root Mean Square Error 계산
 */
function calculateRMSE(predictions: number[], actuals: number[]): number {
  if (predictions.length === 0 || predictions.length !== actuals.length) {
    return 0;
  }

  const sumSquaredError = predictions.reduce((sum, pred, i) => {
    return sum + Math.pow(pred - actuals[i], 2);
  }, 0);

  return Math.sqrt(sumSquaredError / predictions.length);
}

/**
 * Mean Absolute Error 계산
 */
function calculateMAE(predictions: number[], actuals: number[]): number {
  if (predictions.length === 0 || predictions.length !== actuals.length) {
    return 0;
  }

  const sumAbsError = predictions.reduce((sum, pred, i) => {
    return sum + Math.abs(pred - actuals[i]);
  }, 0);

  return sumAbsError / predictions.length;
}

/**
 * Bias (평균 오차) 계산
 */
function calculateBias(predictions: number[], actuals: number[]): number {
  if (predictions.length === 0 || predictions.length !== actuals.length) {
    return 0;
  }

  const sumError = predictions.reduce((sum, pred, i) => {
    return sum + (pred - actuals[i]);
  }, 0);

  return sumError / predictions.length;
}

/**
 * Pearson 상관계수 계산
 */
function calculateCorrelation(predictions: number[], actuals: number[]): number {
  if (predictions.length < 2 || predictions.length !== actuals.length) {
    return 0;
  }

  const n = predictions.length;
  const meanPred = predictions.reduce((a, b) => a + b, 0) / n;
  const meanActual = actuals.reduce((a, b) => a + b, 0) / n;

  let numerator = 0;
  let denomPred = 0;
  let denomActual = 0;

  for (let i = 0; i < n; i++) {
    const diffPred = predictions[i] - meanPred;
    const diffActual = actuals[i] - meanActual;
    numerator += diffPred * diffActual;
    denomPred += diffPred * diffPred;
    denomActual += diffActual * diffActual;
  }

  const denominator = Math.sqrt(denomPred * denomActual);
  return denominator === 0 ? 0 : numerator / denominator;
}

/**
 * 표준편차 계산
 */
function calculateStdDev(values: number[]): number {
  if (values.length < 2) return 0;

  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const squaredDiffs = values.map(v => Math.pow(v - mean, 2));
  const variance = squaredDiffs.reduce((a, b) => a + b, 0) / (values.length - 1);

  return Math.sqrt(variance);
}

/**
 * 최근 트렌드 분석 (이동 평균 기반)
 */
function analyzeRecentTrend(
  errors: number[],
  windowSize: number = 7
): 'improving' | 'stable' | 'degrading' {
  if (errors.length < windowSize * 2) {
    return 'stable';
  }

  // 최근 윈도우와 이전 윈도우의 평균 오차 비교
  const recentWindow = errors.slice(-windowSize);
  const previousWindow = errors.slice(-windowSize * 2, -windowSize);

  const recentAvg = recentWindow.reduce((a, b) => a + b, 0) / windowSize;
  const previousAvg = previousWindow.reduce((a, b) => a + b, 0) / windowSize;

  const changeRatio = (recentAvg - previousAvg) / previousAvg;

  if (changeRatio < -0.1) return 'improving';
  if (changeRatio > 0.1) return 'degrading';
  return 'stable';
}

// ============================================================================
// Performance Evaluation Functions
// ============================================================================

/**
 * 모델 성능 평가
 * 예측 기록을 분석하여 성능 메트릭 계산
 */
export function evaluateModelPerformance(
  records: PredictionRecord[],
  predictionType: PredictionType,
  acceptableErrorThreshold: number = 0.15 // 15% 오차 허용
): PerformanceEvaluation {
  const filteredRecords = records.filter(r => r.prediction_type === predictionType);

  if (filteredRecords.length === 0) {
    return {
      predictionType,
      sampleSize: 0,
      metrics: { mape: 0, rmse: 0, mae: 0, bias: 0, correlation: 0 },
      distribution: { underPrediction: 0, overPrediction: 0, withinThreshold: 0 },
      outliers: [],
      recentTrend: 'stable',
    };
  }

  const predictions = filteredRecords.map(r => r.predicted_value);
  const actuals = filteredRecords.map(r => r.actual_value);

  // 메트릭 계산
  const mape = calculateMAPE(predictions, actuals);
  const rmse = calculateRMSE(predictions, actuals);
  const mae = calculateMAE(predictions, actuals);
  const bias = calculateBias(predictions, actuals);
  const correlation = calculateCorrelation(predictions, actuals);

  // 분포 분석
  let underCount = 0;
  let overCount = 0;
  let withinCount = 0;
  const outliers: PredictionRecord[] = [];
  const errors: number[] = [];

  filteredRecords.forEach(record => {
    const error = record.predicted_value - record.actual_value;
    const percentError = record.actual_value !== 0
      ? Math.abs(error / record.actual_value)
      : 0;

    errors.push(Math.abs(percentError));

    if (percentError <= acceptableErrorThreshold) {
      withinCount++;
    } else if (error < 0) {
      underCount++;
      if (percentError > 0.3) { // 30% 이상 오차는 이상치로 분류
        outliers.push(record);
      }
    } else {
      overCount++;
      if (percentError > 0.3) {
        outliers.push(record);
      }
    }
  });

  const total = filteredRecords.length;

  return {
    predictionType,
    sampleSize: total,
    metrics: {
      mape: Math.round(mape * 100) / 100,
      rmse: Math.round(rmse * 100) / 100,
      mae: Math.round(mae * 100) / 100,
      bias: Math.round(bias * 100) / 100,
      correlation: Math.round(correlation * 1000) / 1000,
    },
    distribution: {
      underPrediction: Math.round((underCount / total) * 100),
      overPrediction: Math.round((overCount / total) * 100),
      withinThreshold: Math.round((withinCount / total) * 100),
    },
    outliers: outliers.slice(0, 10), // 상위 10개만
    recentTrend: analyzeRecentTrend(errors),
  };
}

/**
 * 다중 예측 타입에 대한 종합 성능 평가
 */
export function evaluateAllModels(
  records: PredictionRecord[]
): Map<PredictionType, PerformanceEvaluation> {
  const types: PredictionType[] = ['revenue', 'conversion', 'dwell_time', 'flow'];
  const evaluations = new Map<PredictionType, PerformanceEvaluation>();

  types.forEach(type => {
    evaluations.set(type, evaluateModelPerformance(records, type));
  });

  return evaluations;
}

// ============================================================================
// Adjustment Proposal Functions
// ============================================================================

/**
 * 바이어스 교정 제안
 */
function proposeBiasCorrection(
  evaluation: PerformanceEvaluation,
  currentParameters: ModelParameters
): ProposedAdjustment | null {
  const { predictionType, metrics, sampleSize } = evaluation;

  // 샘플 크기가 너무 작으면 제안하지 않음
  if (sampleSize < 30) {
    return null;
  }

  // 바이어스가 유의미하지 않으면 제안하지 않음
  const biasThreshold = metrics.rmse * 0.2; // RMSE의 20%
  if (Math.abs(metrics.bias) < biasThreshold) {
    return null;
  }

  // 현재 바이어스 교정값 가져오기
  let currentBias = 0;
  let paramKey = '';

  switch (predictionType) {
    case 'revenue':
      currentBias = currentParameters.revenue.biasCorrection;
      paramKey = 'revenue.biasCorrection';
      break;
    case 'conversion':
      currentBias = currentParameters.conversion.biasCorrection;
      paramKey = 'conversion.biasCorrection';
      break;
    case 'dwell_time':
      currentBias = currentParameters.dwellTime.biasCorrection;
      paramKey = 'dwellTime.biasCorrection';
      break;
    case 'flow':
      currentBias = currentParameters.flow.biasCorrection;
      paramKey = 'flow.biasCorrection';
      break;
  }

  // 새 바이어스 교정값 계산 (학습률 0.5 적용)
  const learningRate = 0.5;
  const newBias = currentBias - (metrics.bias * learningRate);

  // 신뢰도 계산 (샘플 크기 및 상관관계 기반)
  const sampleConfidence = Math.min(sampleSize / 100, 1);
  const correlationConfidence = Math.max(0, metrics.correlation);
  const confidence = (sampleConfidence * 0.6 + correlationConfidence * 0.4);

  return {
    parameterKey: paramKey,
    adjustmentType: 'bias',
    predictionType,
    currentValue: currentBias,
    proposedValue: Math.round(newBias * 1000) / 1000,
    changeRatio: currentBias !== 0 ? (newBias - currentBias) / Math.abs(currentBias) : newBias,
    confidence: Math.round(confidence * 100) / 100,
    reasoning: `체계적 ${metrics.bias > 0 ? '과대' : '과소'}예측 감지 (bias: ${metrics.bias.toFixed(2)}). ` +
      `바이어스 교정으로 예측 정확도 개선 예상.`,
    expectedImprovement: Math.min(Math.abs(metrics.bias) / metrics.rmse * 100, 30),
  };
}

/**
 * 가중치 조정 제안
 */
function proposeWeightAdjustments(
  evaluation: PerformanceEvaluation,
  currentParameters: ModelParameters,
  contextAnalysis?: Record<string, number> // 컨텍스트별 오차 분석
): ProposedAdjustment[] {
  const adjustments: ProposedAdjustment[] = [];
  const { predictionType, metrics, distribution, sampleSize } = evaluation;

  // 샘플 크기 확인
  if (sampleSize < 50) {
    return adjustments;
  }

  // MAPE가 충분히 높을 때만 가중치 조정 제안
  if (metrics.mape < 10) {
    return adjustments;
  }

  // 예측 타입별 가중치 조정 로직
  switch (predictionType) {
    case 'revenue': {
      const params = currentParameters.revenue;

      // 과대/과소 예측 패턴에 따른 조정
      if (distribution.overPrediction > 60) {
        // 과대예측이 많음 - 긍정적 요소 가중치 감소
        if (params.promotionWeight > 0.05) {
          adjustments.push({
            parameterKey: 'revenue.promotionWeight',
            adjustmentType: 'weight',
            predictionType,
            currentValue: params.promotionWeight,
            proposedValue: Math.round((params.promotionWeight * 0.9) * 1000) / 1000,
            changeRatio: -0.1,
            confidence: 0.7,
            reasoning: '과대예측 비율이 높음. 프로모션 효과 가중치 감소 제안.',
            expectedImprovement: 5,
          });
        }
      } else if (distribution.underPrediction > 60) {
        // 과소예측이 많음 - 긍정적 요소 가중치 증가
        if (params.trafficWeight < 0.5) {
          adjustments.push({
            parameterKey: 'revenue.trafficWeight',
            adjustmentType: 'weight',
            predictionType,
            currentValue: params.trafficWeight,
            proposedValue: Math.round((params.trafficWeight * 1.1) * 1000) / 1000,
            changeRatio: 0.1,
            confidence: 0.7,
            reasoning: '과소예측 비율이 높음. 트래픽 가중치 증가 제안.',
            expectedImprovement: 5,
          });
        }
      }
      break;
    }

    case 'conversion': {
      const params = currentParameters.conversion;

      if (distribution.overPrediction > 60 && params.layoutEffectWeight > 0.1) {
        adjustments.push({
          parameterKey: 'conversion.layoutEffectWeight',
          adjustmentType: 'weight',
          predictionType,
          currentValue: params.layoutEffectWeight,
          proposedValue: Math.round((params.layoutEffectWeight * 0.85) * 1000) / 1000,
          changeRatio: -0.15,
          confidence: 0.65,
          reasoning: '전환율 과대예측. 레이아웃 효과 가중치 감소 제안.',
          expectedImprovement: 7,
        });
      }
      break;
    }

    case 'dwell_time': {
      const params = currentParameters.dwellTime;

      // 체류 시간 예측 조정
      if (metrics.mape > 25 && params.zoneAttractivenessWeight > 0.15) {
        adjustments.push({
          parameterKey: 'dwellTime.zoneAttractivenessWeight',
          adjustmentType: 'weight',
          predictionType,
          currentValue: params.zoneAttractivenessWeight,
          proposedValue: Math.round((params.zoneAttractivenessWeight * 0.9) * 1000) / 1000,
          changeRatio: -0.1,
          confidence: 0.6,
          reasoning: '체류 시간 예측 오차가 큼. 존 매력도 가중치 조정 제안.',
          expectedImprovement: 8,
        });
      }
      break;
    }

    case 'flow': {
      const params = currentParameters.flow;

      if (distribution.underPrediction > 55 && params.attractorWeight < 0.5) {
        adjustments.push({
          parameterKey: 'flow.attractorWeight',
          adjustmentType: 'weight',
          predictionType,
          currentValue: params.attractorWeight,
          proposedValue: Math.round((params.attractorWeight * 1.15) * 1000) / 1000,
          changeRatio: 0.15,
          confidence: 0.65,
          reasoning: '유동 패턴 과소예측. 어트랙터 가중치 증가 제안.',
          expectedImprovement: 6,
        });
      }
      break;
    }
  }

  return adjustments;
}

/**
 * 종합 조정 제안 생성
 */
export function proposeAdjustments(
  evaluations: Map<PredictionType, PerformanceEvaluation>,
  currentParameters: ModelParameters
): ProposedAdjustment[] {
  const allAdjustments: ProposedAdjustment[] = [];

  evaluations.forEach((evaluation, predictionType) => {
    // 바이어스 교정 제안
    const biasAdjustment = proposeBiasCorrection(evaluation, currentParameters);
    if (biasAdjustment) {
      allAdjustments.push(biasAdjustment);
    }

    // 가중치 조정 제안
    const weightAdjustments = proposeWeightAdjustments(evaluation, currentParameters);
    allAdjustments.push(...weightAdjustments);
  });

  // 신뢰도 순으로 정렬
  allAdjustments.sort((a, b) => b.confidence - a.confidence);

  return allAdjustments;
}

// ============================================================================
// Adjustment Application Functions
// ============================================================================

/**
 * 파라미터 경로를 통해 값 설정
 */
function setNestedValue(obj: Record<string, unknown>, path: string, value: number): void {
  const keys = path.split('.');
  let current = obj as Record<string, unknown>;

  for (let i = 0; i < keys.length - 1; i++) {
    if (!(keys[i] in current)) {
      current[keys[i]] = {};
    }
    current = current[keys[i]] as Record<string, unknown>;
  }

  current[keys[keys.length - 1]] = value;
}

/**
 * 파라미터 경로를 통해 값 가져오기
 */
function getNestedValue(obj: Record<string, unknown>, path: string): number | undefined {
  const keys = path.split('.');
  let current = obj as Record<string, unknown>;

  for (let i = 0; i < keys.length - 1; i++) {
    if (!(keys[i] in current)) {
      return undefined;
    }
    current = current[keys[i]] as Record<string, unknown>;
  }

  return current[keys[keys.length - 1]] as number;
}

/**
 * 단일 조정 적용
 */
export function applyAdjustment(
  parameters: ModelParameters,
  adjustment: ProposedAdjustment,
  minConfidence: number = 0.5
): AdjustmentResult {
  // 신뢰도 확인
  if (adjustment.confidence < minConfidence) {
    return {
      adjustment,
      applied: false,
      newValue: adjustment.currentValue,
      error: `신뢰도(${adjustment.confidence})가 최소 기준(${minConfidence})보다 낮음`,
    };
  }

  // 변경 비율 제한 확인 (±50% 이내)
  if (Math.abs(adjustment.changeRatio) > 0.5) {
    return {
      adjustment,
      applied: false,
      newValue: adjustment.currentValue,
      error: `변경 비율(${adjustment.changeRatio})이 허용 범위(±50%)를 초과`,
    };
  }

  try {
    setNestedValue(
      parameters as unknown as Record<string, unknown>,
      adjustment.parameterKey,
      adjustment.proposedValue
    );

    return {
      adjustment,
      applied: true,
      newValue: adjustment.proposedValue,
    };
  } catch (error) {
    return {
      adjustment,
      applied: false,
      newValue: adjustment.currentValue,
      error: `적용 실패: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}

/**
 * 다중 조정 적용
 */
export function applyAdjustments(
  parameters: ModelParameters,
  adjustments: ProposedAdjustment[],
  options: {
    minConfidence?: number;
    maxAdjustmentsPerType?: number;
  } = {}
): AdjustmentResult[] {
  const { minConfidence = 0.5, maxAdjustmentsPerType = 3 } = options;
  const results: AdjustmentResult[] = [];

  // 예측 타입별 조정 카운트
  const typeCount = new Map<PredictionType, number>();

  for (const adjustment of adjustments) {
    const currentCount = typeCount.get(adjustment.predictionType) || 0;

    // 타입별 최대 조정 수 확인
    if (currentCount >= maxAdjustmentsPerType) {
      results.push({
        adjustment,
        applied: false,
        newValue: adjustment.currentValue,
        error: `${adjustment.predictionType} 타입의 최대 조정 수(${maxAdjustmentsPerType})에 도달`,
      });
      continue;
    }

    const result = applyAdjustment(parameters, adjustment, minConfidence);
    results.push(result);

    if (result.applied) {
      typeCount.set(adjustment.predictionType, currentCount + 1);
    }
  }

  return results;
}

// ============================================================================
// Supabase Integration Functions
// ============================================================================

/**
 * Supabase에서 저장된 파라미터 로드
 * 🔧 테이블이 없는 경우 graceful하게 기본값 반환
 */
export async function loadStoredParameters(
  supabase: SupabaseClient,
  storeId: string
): Promise<ModelParameters> {
  try {
    const { data, error } = await supabase
      .from('stored_model_parameters')
      .select('*')
      .eq('store_id', storeId)
      .eq('is_active', true);

    if (error) {
      // 🔧 테이블이 없는 경우 (42P01) 조용히 기본값 반환
      if (error.code === '42P01' || error.message?.includes('does not exist')) {
        console.log('[AutoLearning] stored_model_parameters 테이블 없음, 기본값 사용');
        return { ...DEFAULT_MODEL_PARAMETERS };
      }
      console.warn('[AutoLearning] 파라미터 로드 실패:', error.message);
      return { ...DEFAULT_MODEL_PARAMETERS };
    }

    if (!data || data.length === 0) {
      return { ...DEFAULT_MODEL_PARAMETERS };
    }

    // 기본 파라미터에서 시작하여 저장된 값으로 덮어쓰기
    const parameters = JSON.parse(JSON.stringify(DEFAULT_MODEL_PARAMETERS)) as ModelParameters;

    for (const row of data as StoredModelParameters[]) {
      try {
        setNestedValue(
          parameters as unknown as Record<string, unknown>,
          row.parameter_key,
          row.parameter_value
        );
      } catch (e) {
        console.warn(`[AutoLearning] 파라미터 설정 실패: ${row.parameter_key}`, e);
      }
    }

    return parameters;
  } catch (e) {
    console.warn('[AutoLearning] 파라미터 로드 예외:', e);
    return { ...DEFAULT_MODEL_PARAMETERS };
  }
}

/**
 * 파라미터를 Supabase에 저장
 * 🔧 테이블이 없는 경우 graceful하게 false 반환
 */
export async function saveParameters(
  supabase: SupabaseClient,
  storeId: string,
  parameters: ModelParameters
): Promise<boolean> {
  try {
    const now = new Date().toISOString();
    const updates: Partial<StoredModelParameters>[] = [];

    // 파라미터를 플랫하게 펼치기
    function flattenParameters(obj: Record<string, unknown>, prefix = ''): void {
      for (const key of Object.keys(obj)) {
        const path = prefix ? `${prefix}.${key}` : key;
        const value = obj[key];

        if (typeof value === 'number') {
          updates.push({
            store_id: storeId,
            parameter_key: path,
            parameter_value: value,
            prediction_type: path.split('.')[0] as PredictionType,
            updated_at: now,
            is_active: true,
          });
        } else if (typeof value === 'object' && value !== null) {
          flattenParameters(value as Record<string, unknown>, path);
        }
      }
    }

    flattenParameters(parameters as unknown as Record<string, unknown>);

    // Upsert 실행
    const { error } = await supabase
      .from('stored_model_parameters')
      .upsert(updates, {
        onConflict: 'store_id,parameter_key',
      });

    if (error) {
      // 🔧 테이블이 없는 경우 조용히 false 반환
      if (error.code === '42P01' || error.message?.includes('does not exist')) {
        console.log('[AutoLearning] stored_model_parameters 테이블 없음, 저장 스킵');
        return false;
      }
      console.warn('[AutoLearning] 파라미터 저장 실패:', error.message);
      return false;
    }

    return true;
  } catch (e) {
    console.warn('[AutoLearning] 파라미터 저장 예외:', e);
    return false;
  }
}

/**
 * 학습 세션 시작
 * 🔧 테이블이 없는 경우 null 반환 (세션 없이 진행)
 */
export async function startLearningSession(
  supabase: SupabaseClient,
  storeId: string
): Promise<string | null> {
  const sessionId = crypto.randomUUID();

  try {
    const { error } = await supabase
      .from('learning_sessions')
      .insert({
        id: sessionId,
        store_id: storeId,
        started_at: new Date().toISOString(),
        status: 'started',
        predictions_evaluated: 0,
        adjustments_proposed: 0,
        adjustments_applied: 0,
        improvement_metrics: {},
      });

    if (error) {
      // 🔧 테이블이 없는 경우 조용히 null 반환
      if (error.code === '42P01' || error.message?.includes('does not exist')) {
        console.log('[AutoLearning] learning_sessions 테이블 없음, 세션 기록 스킵');
        return null;
      }
      console.warn('[AutoLearning] 학습 세션 시작 실패:', error.message);
      return null;
    }

    return sessionId;
  } catch (e) {
    console.warn('[AutoLearning] 학습 세션 시작 예외:', e);
    return null;
  }
}

/**
 * 학습 세션 완료
 * 🔧 테이블이 없는 경우 graceful하게 처리
 */
export async function completeLearningSession(
  supabase: SupabaseClient,
  sessionId: string,
  summary: Partial<LearningSession>
): Promise<void> {
  try {
    const { error } = await supabase
      .from('learning_sessions')
      .update({
        ...summary,
        completed_at: new Date().toISOString(),
        status: 'completed',
      })
      .eq('id', sessionId);

    if (error) {
      // 🔧 테이블이 없는 경우 조용히 처리
      if (error.code === '42P01' || error.message?.includes('does not exist')) {
        console.log('[AutoLearning] learning_sessions 테이블 없음, 완료 기록 스킵');
        return;
      }
      console.warn('[AutoLearning] 학습 세션 완료 실패:', error.message);
    }
  } catch (e) {
    console.warn('[AutoLearning] 학습 세션 완료 예외:', e);
  }
}

/**
 * 조정 기록 저장
 * 🔧 테이블이 없는 경우 graceful하게 처리
 */
export async function saveAdjustmentRecord(
  supabase: SupabaseClient,
  storeId: string,
  sessionId: string,
  adjustment: ProposedAdjustment,
  status: AdjustmentStatus
): Promise<void> {
  try {
    const { error } = await supabase
      .from('learning_adjustments')
      .insert({
        id: crypto.randomUUID(),
        store_id: storeId,
        prediction_type: adjustment.predictionType,
        adjustment_type: adjustment.adjustmentType,
        parameter_key: adjustment.parameterKey,
        old_value: adjustment.currentValue,
        new_value: adjustment.proposedValue,
        confidence: adjustment.confidence,
        sample_size: 0, // 별도로 설정 필요
        status,
        session_id: sessionId,
        created_at: new Date().toISOString(),
        applied_at: status === 'applied' ? new Date().toISOString() : null,
      });

    if (error) {
      // 🔧 테이블이 없는 경우 조용히 처리
      if (error.code === '42P01' || error.message?.includes('does not exist')) {
        return; // 조용히 스킵
      }
      console.warn('[AutoLearning] 조정 기록 저장 실패:', error.message);
    }
  } catch (e) {
    console.warn('[AutoLearning] 조정 기록 저장 예외:', e);
  }
}

/**
 * 예측 기록 조회
 * 🔧 테이블이 없는 경우 빈 배열 반환
 */
export async function fetchPredictionRecords(
  supabase: SupabaseClient,
  storeId: string,
  days: number = 30
): Promise<PredictionRecord[]> {
  try {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const { data, error } = await supabase
      .from('prediction_records')
      .select('*')
      .eq('store_id', storeId)
      .gte('prediction_date', startDate.toISOString())
      .not('actual_value', 'is', null);

    if (error) {
      // 🔧 테이블이 없는 경우 조용히 빈 배열 반환
      if (error.code === '42P01' || error.message?.includes('does not exist')) {
        console.log('[AutoLearning] prediction_records 테이블 없음, 스킵');
        return [];
      }
      console.warn('[AutoLearning] 예측 기록 조회 실패:', error.message);
      return [];
    }

    return (data || []) as PredictionRecord[];
  } catch (e) {
    console.warn('[AutoLearning] 예측 기록 조회 예외:', e);
    return [];
  }
}

// ============================================================================
// Main Learning Execution Function
// ============================================================================

/**
 * 자동 학습 실행
 * 전체 학습 파이프라인을 실행하고 결과 요약 반환
 */
export async function runAutoLearning(
  supabase: SupabaseClient,
  storeId: string,
  options: {
    minConfidence?: number;
    maxAdjustmentsPerType?: number;
    lookbackDays?: number;
  } = {}
): Promise<LearningSessionSummary> {
  const {
    minConfidence = 0.5,
    maxAdjustmentsPerType = 3,
    lookbackDays = 30,
  } = options;

  const startTime = Date.now();

  // 1. 학습 세션 시작
  const sessionId = await startLearningSession(supabase, storeId);

  try {
    // 2. 현재 파라미터 로드
    const currentParameters = await loadStoredParameters(supabase, storeId);

    // 3. 예측 기록 조회
    const records = await fetchPredictionRecords(supabase, storeId, lookbackDays);

    if (records.length < 30) {
      // 데이터 부족
      if (sessionId) {
        await completeLearningSession(supabase, sessionId, {
          predictions_evaluated: records.length,
          adjustments_proposed: 0,
          adjustments_applied: 0,
          improvement_metrics: {
            before: { mape: 0, rmse: 0, bias: 0 },
            after: { mape: 0, rmse: 0, bias: 0 },
            improvement_percentage: 0,
          },
        });
      }

      return {
        sessionId: sessionId || 'no-session',
        storeId,
        duration: (Date.now() - startTime) / 1000,
        predictionsEvaluated: records.length,
        adjustmentsProposed: 0,
        adjustmentsApplied: 0,
        improvementMetrics: {
          before: { mape: 0, rmse: 0, bias: 0 },
          after: { mape: 0, rmse: 0, bias: 0 },
          improvement_percentage: 0,
        },
        appliedAdjustments: [],
      };
    }

    // 4. 모델 성능 평가
    const evaluations = evaluateAllModels(records);

    // 사전 메트릭 계산
    let totalMAPE = 0;
    let totalRMSE = 0;
    let totalBias = 0;
    let evalCount = 0;

    evaluations.forEach(evaluation => {
      if (evaluation.sampleSize > 0) {
        totalMAPE += evaluation.metrics.mape;
        totalRMSE += evaluation.metrics.rmse;
        totalBias += evaluation.metrics.bias;
        evalCount++;
      }
    });

    const beforeMetrics = {
      mape: evalCount > 0 ? totalMAPE / evalCount : 0,
      rmse: evalCount > 0 ? totalRMSE / evalCount : 0,
      bias: evalCount > 0 ? totalBias / evalCount : 0,
    };

    // 5. 조정 제안
    const proposedAdjustments = proposeAdjustments(evaluations, currentParameters);

    // 6. 조정 적용
    const updatedParameters = JSON.parse(JSON.stringify(currentParameters)) as ModelParameters;
    const adjustmentResults = applyAdjustments(updatedParameters, proposedAdjustments, {
      minConfidence,
      maxAdjustmentsPerType,
    });

    const appliedResults = adjustmentResults.filter(r => r.applied);

    // 7. 조정 기록 저장 (세션이 있을 때만)
    if (sessionId) {
      for (const result of adjustmentResults) {
        await saveAdjustmentRecord(
          supabase,
          storeId,
          sessionId,
          result.adjustment,
          result.applied ? 'applied' : 'rejected'
        );
      }
    }

    // 8. 파라미터 저장
    if (appliedResults.length > 0) {
      await saveParameters(supabase, storeId, updatedParameters);
    }

    // 9. 예상 개선 메트릭 계산
    const expectedImprovement = appliedResults.reduce(
      (sum, r) => sum + r.adjustment.expectedImprovement,
      0
    ) / Math.max(appliedResults.length, 1);

    const afterMetrics = {
      mape: beforeMetrics.mape * (1 - expectedImprovement / 100),
      rmse: beforeMetrics.rmse * (1 - expectedImprovement / 100),
      bias: beforeMetrics.bias * 0.5, // 바이어스는 절반 감소 예상
    };

    const improvementMetrics: ImprovementMetrics = {
      before: {
        mape: Math.round(beforeMetrics.mape * 100) / 100,
        rmse: Math.round(beforeMetrics.rmse * 100) / 100,
        bias: Math.round(beforeMetrics.bias * 100) / 100,
      },
      after: {
        mape: Math.round(afterMetrics.mape * 100) / 100,
        rmse: Math.round(afterMetrics.rmse * 100) / 100,
        bias: Math.round(afterMetrics.bias * 100) / 100,
      },
      improvement_percentage: Math.round(expectedImprovement * 100) / 100,
    };

    // 10. 세션 완료 (세션이 있을 때만)
    if (sessionId) {
      await completeLearningSession(supabase, sessionId, {
        predictions_evaluated: records.length,
        adjustments_proposed: proposedAdjustments.length,
        adjustments_applied: appliedResults.length,
        improvement_metrics: improvementMetrics,
      });
    }

    // 11. 결과 요약 반환
    return {
      sessionId: sessionId || 'no-session',
      storeId,
      duration: (Date.now() - startTime) / 1000,
      predictionsEvaluated: records.length,
      adjustmentsProposed: proposedAdjustments.length,
      adjustmentsApplied: appliedResults.length,
      improvementMetrics,
      appliedAdjustments: appliedResults.map(r => ({
        parameter: r.adjustment.parameterKey,
        oldValue: r.adjustment.currentValue,
        newValue: r.newValue,
        improvement: `${r.adjustment.expectedImprovement.toFixed(1)}%`,
      })),
    };

  } catch (error) {
    // 세션 실패 처리
    await supabase
      .from('learning_sessions')
      .update({
        status: 'failed',
        completed_at: new Date().toISOString(),
        error_message: error instanceof Error ? error.message : 'Unknown error',
      })
      .eq('id', sessionId);

    throw error;
  }
}

/**
 * 응답용 학습 세션 포맷
 */
export function formatLearningSessionForResponse(
  summary: LearningSessionSummary
): Record<string, unknown> {
  return {
    session_id: summary.sessionId,
    store_id: summary.storeId,
    duration_seconds: summary.duration,
    summary: {
      predictions_evaluated: summary.predictionsEvaluated,
      adjustments_proposed: summary.adjustmentsProposed,
      adjustments_applied: summary.adjustmentsApplied,
    },
    improvement_metrics: summary.improvementMetrics,
    applied_adjustments: summary.appliedAdjustments,
  };
}
