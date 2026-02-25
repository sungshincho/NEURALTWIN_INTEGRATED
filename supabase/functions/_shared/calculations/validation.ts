/**
 * validation.ts
 *
 * 계산 결과 검증 모듈
 * 범위 검증 + 이상치 탐지
 *
 * Sprint 1 Task: S1-4
 * 작성일: 2026-01-12
 */

import type { TrafficFlowOutput } from './trafficFlow.ts';
import type { ROIOutput } from './roiPredictor.ts';

// ============================================================================
// 타입 정의
// ============================================================================

/** 검증 결과 */
export interface ValidationResult {
  valid: boolean;
  warnings: ValidationWarning[];
  errors: ValidationError[];
  adjustedValue?: number;
  confidence: number;
}

/** 검증 경고 */
export interface ValidationWarning {
  code: string;
  field: string;
  message: string;
  currentValue: number;
  expectedRange: { min: number; max: number };
  severity: 'low' | 'medium' | 'high';
}

/** 검증 에러 */
export interface ValidationError {
  code: string;
  field: string;
  message: string;
  currentValue: number;
}

/** 범위 검증 규칙 */
export interface RangeRule {
  field: string;
  min: number;
  max: number;
  /** 범위 이탈 시 자동 조정 여부 */
  autoClamp?: boolean;
  /** 경고 임계값 (범위 내지만 경계에 가까운 경우) */
  warningThreshold?: number;
}

/** 이상치 탐지 설정 */
export interface OutlierConfig {
  /** IQR 배수 (기본 1.5) */
  iqrMultiplier?: number;
  /** Z-score 임계값 (기본 3) */
  zScoreThreshold?: number;
  /** 최소 샘플 수 (통계 계산을 위한) */
  minSamples?: number;
}

// ============================================================================
// 범위 검증 규칙 정의
// ============================================================================

/** 트래픽 흐름 검증 규칙 */
export const TRAFFIC_FLOW_RULES: RangeRule[] = [
  {
    field: 'expected_visitors',
    min: 0,
    max: 10000,
    autoClamp: true,
    warningThreshold: 0.1, // 10% 이내면 경고
  },
  {
    field: 'flow_rate',
    min: 0,
    max: 100,
    autoClamp: true,
    warningThreshold: 0.1,
  },
  {
    field: 'bottleneck_probability',
    min: 0,
    max: 1,
    autoClamp: true,
  },
  {
    field: 'density_index',
    min: 0,
    max: 1,
    autoClamp: true,
  },
  {
    field: 'confidence',
    min: 0,
    max: 1,
    autoClamp: true,
  },
  {
    field: 'recommended_capacity',
    min: 0,
    max: 5000,
    autoClamp: true,
  },
];

/** ROI 검증 규칙 */
export const ROI_RULES: RangeRule[] = [
  {
    field: 'expected_impressions',
    min: 0,
    max: 100000,
    autoClamp: true,
    warningThreshold: 0.1,
  },
  {
    field: 'expected_conversions',
    min: 0,
    max: 10000,
    autoClamp: true,
    warningThreshold: 0.1,
  },
  {
    field: 'expected_revenue',
    min: 0,
    max: 1000000000, // 10억
    autoClamp: true,
    warningThreshold: 0.05,
  },
  {
    field: 'expected_profit',
    min: -100000000, // 음수 가능 (손실)
    max: 500000000, // 5억
    autoClamp: true,
    warningThreshold: 0.05,
  },
  {
    field: 'roi_percent',
    min: -100, // -100% 최저
    max: 1000, // 1000% 최고
    autoClamp: true,
    warningThreshold: 0.1,
  },
  {
    field: 'confidence',
    min: 0,
    max: 1,
    autoClamp: true,
  },
];

// ============================================================================
// 범위 검증 함수
// ============================================================================

/**
 * 단일 값 범위 검증
 */
export function validateRange(
  value: number,
  rule: RangeRule
): ValidationResult {
  const warnings: ValidationWarning[] = [];
  const errors: ValidationError[] = [];
  let adjustedValue: number | undefined;
  let valid = true;

  // NaN 체크
  if (isNaN(value)) {
    errors.push({
      code: 'INVALID_NUMBER',
      field: rule.field,
      message: `${rule.field} is NaN`,
      currentValue: value,
    });
    return { valid: false, warnings, errors, confidence: 0 };
  }

  // Infinity 체크
  if (!isFinite(value)) {
    errors.push({
      code: 'INFINITE_VALUE',
      field: rule.field,
      message: `${rule.field} is infinite`,
      currentValue: value,
    });
    return { valid: false, warnings, errors, confidence: 0 };
  }

  // 범위 체크
  if (value < rule.min || value > rule.max) {
    if (rule.autoClamp) {
      // 자동 조정
      adjustedValue = Math.max(rule.min, Math.min(rule.max, value));
      warnings.push({
        code: 'OUT_OF_RANGE_CLAMPED',
        field: rule.field,
        message: `${rule.field} was ${value}, clamped to ${adjustedValue}`,
        currentValue: value,
        expectedRange: { min: rule.min, max: rule.max },
        severity: 'medium',
      });
    } else {
      // 에러로 처리
      valid = false;
      errors.push({
        code: 'OUT_OF_RANGE',
        field: rule.field,
        message: `${rule.field} (${value}) is out of range [${rule.min}, ${rule.max}]`,
        currentValue: value,
      });
    }
  } else if (rule.warningThreshold) {
    // 경계 근처 경고
    const range = rule.max - rule.min;
    const warningRange = range * rule.warningThreshold;

    if (value < rule.min + warningRange || value > rule.max - warningRange) {
      warnings.push({
        code: 'NEAR_BOUNDARY',
        field: rule.field,
        message: `${rule.field} (${value}) is close to boundary`,
        currentValue: value,
        expectedRange: { min: rule.min, max: rule.max },
        severity: 'low',
      });
    }
  }

  // 신뢰도 계산 (범위 내 위치 기반)
  const normalizedPosition = (value - rule.min) / (rule.max - rule.min);
  const distanceFromCenter = Math.abs(normalizedPosition - 0.5) * 2; // 0-1
  const confidence = Math.max(0, 1 - distanceFromCenter * 0.3); // 중앙이 높음

  return {
    valid,
    warnings,
    errors,
    adjustedValue,
    confidence,
  };
}

/**
 * 트래픽 흐름 결과 검증
 */
export function validateTrafficFlowOutput(
  output: TrafficFlowOutput
): ValidationResult {
  const allWarnings: ValidationWarning[] = [];
  const allErrors: ValidationError[] = [];
  let totalConfidence = 0;
  let ruleCount = 0;

  for (const rule of TRAFFIC_FLOW_RULES) {
    const value = (output as any)[rule.field];
    if (value === undefined) continue;

    const result = validateRange(value, rule);
    allWarnings.push(...result.warnings);
    allErrors.push(...result.errors);
    totalConfidence += result.confidence;
    ruleCount++;
  }

  // 추가 비즈니스 로직 검증
  // 1. expected_visitors와 flow_rate 일관성
  if (output.expected_visitors > 0 && output.flow_rate <= 0) {
    allWarnings.push({
      code: 'INCONSISTENT_FLOW',
      field: 'flow_rate',
      message: 'flow_rate is 0 but expected_visitors > 0',
      currentValue: output.flow_rate,
      expectedRange: { min: 0.01, max: 100 },
      severity: 'medium',
    });
  }

  // 2. congestion_risk와 density_index 일관성
  const expectedRisk = determineCongestionFromDensity(output.density_index);
  if (output.congestion_risk !== expectedRisk) {
    allWarnings.push({
      code: 'INCONSISTENT_CONGESTION',
      field: 'congestion_risk',
      message: `congestion_risk (${output.congestion_risk}) doesn't match density_index (${output.density_index}) - expected ${expectedRisk}`,
      currentValue: output.density_index,
      expectedRange: { min: 0, max: 1 },
      severity: 'low',
    });
  }

  return {
    valid: allErrors.length === 0,
    warnings: allWarnings,
    errors: allErrors,
    confidence: ruleCount > 0 ? totalConfidence / ruleCount : 0,
  };
}

/**
 * ROI 결과 검증
 */
export function validateROIOutput(output: ROIOutput): ValidationResult {
  const allWarnings: ValidationWarning[] = [];
  const allErrors: ValidationError[] = [];
  let totalConfidence = 0;
  let ruleCount = 0;

  for (const rule of ROI_RULES) {
    const value = (output as any)[rule.field];
    if (value === undefined) continue;

    const result = validateRange(value, rule);
    allWarnings.push(...result.warnings);
    allErrors.push(...result.errors);
    totalConfidence += result.confidence;
    ruleCount++;
  }

  // 추가 비즈니스 로직 검증
  // 1. 전환 수 <= 노출 수
  if (output.expected_conversions > output.expected_impressions) {
    allErrors.push({
      code: 'INVALID_CONVERSION',
      field: 'expected_conversions',
      message: `Conversions (${output.expected_conversions}) cannot exceed impressions (${output.expected_impressions})`,
      currentValue: output.expected_conversions,
    });
  }

  // 2. 매출 = 전환 × 가격 일관성 (근사 검증)
  // 평균 가격을 역산
  if (output.expected_conversions > 0) {
    const impliedPrice = output.expected_revenue / output.expected_conversions;
    if (impliedPrice < 100 || impliedPrice > 10000000) {
      allWarnings.push({
        code: 'UNUSUAL_PRICE',
        field: 'expected_revenue',
        message: `Implied price (₩${impliedPrice.toLocaleString()}) seems unusual`,
        currentValue: impliedPrice,
        expectedRange: { min: 100, max: 10000000 },
        severity: 'medium',
      });
    }
  }

  // 3. 이익 <= 매출
  if (output.expected_profit > output.expected_revenue) {
    allErrors.push({
      code: 'INVALID_PROFIT',
      field: 'expected_profit',
      message: `Profit (₩${output.expected_profit.toLocaleString()}) cannot exceed revenue (₩${output.expected_revenue.toLocaleString()})`,
      currentValue: output.expected_profit,
    });
  }

  // 4. 신뢰도와 recommendation 일관성
  if (output.confidence < 0.3 &&
      (output.recommendation.priority === 'critical' ||
       output.recommendation.priority === 'high')) {
    allWarnings.push({
      code: 'LOW_CONFIDENCE_HIGH_PRIORITY',
      field: 'confidence',
      message: `Low confidence (${(output.confidence * 100).toFixed(0)}%) with high priority recommendation`,
      currentValue: output.confidence,
      expectedRange: { min: 0.5, max: 1 },
      severity: 'high',
    });
  }

  return {
    valid: allErrors.length === 0,
    warnings: allWarnings,
    errors: allErrors,
    confidence: ruleCount > 0 ? totalConfidence / ruleCount : 0,
  };
}

// ============================================================================
// 이상치 탐지 함수
// ============================================================================

/**
 * IQR 기반 이상치 탐지
 */
export function detectOutliersIQR(
  values: number[],
  config: OutlierConfig = {}
): { outliers: number[]; indices: number[]; bounds: { lower: number; upper: number } } {
  const { iqrMultiplier = 1.5, minSamples = 4 } = config;

  if (values.length < minSamples) {
    return { outliers: [], indices: [], bounds: { lower: -Infinity, upper: Infinity } };
  }

  // 정렬
  const sorted = [...values].sort((a, b) => a - b);
  const n = sorted.length;

  // Q1, Q3 계산
  const q1Index = Math.floor(n * 0.25);
  const q3Index = Math.floor(n * 0.75);
  const q1 = sorted[q1Index];
  const q3 = sorted[q3Index];
  const iqr = q3 - q1;

  // 경계 계산
  const lower = q1 - iqrMultiplier * iqr;
  const upper = q3 + iqrMultiplier * iqr;

  // 이상치 찾기
  const outliers: number[] = [];
  const indices: number[] = [];

  values.forEach((value, index) => {
    if (value < lower || value > upper) {
      outliers.push(value);
      indices.push(index);
    }
  });

  return { outliers, indices, bounds: { lower, upper } };
}

/**
 * Z-score 기반 이상치 탐지
 */
export function detectOutliersZScore(
  values: number[],
  config: OutlierConfig = {}
): { outliers: number[]; indices: number[]; stats: { mean: number; std: number } } {
  const { zScoreThreshold = 3, minSamples = 4 } = config;

  if (values.length < minSamples) {
    return { outliers: [], indices: [], stats: { mean: 0, std: 0 } };
  }

  // 평균 계산
  const mean = values.reduce((sum, v) => sum + v, 0) / values.length;

  // 표준편차 계산
  const squaredDiffs = values.map(v => Math.pow(v - mean, 2));
  const variance = squaredDiffs.reduce((sum, v) => sum + v, 0) / values.length;
  const std = Math.sqrt(variance);

  if (std === 0) {
    return { outliers: [], indices: [], stats: { mean, std: 0 } };
  }

  // 이상치 찾기
  const outliers: number[] = [];
  const indices: number[] = [];

  values.forEach((value, index) => {
    const zScore = Math.abs((value - mean) / std);
    if (zScore > zScoreThreshold) {
      outliers.push(value);
      indices.push(index);
    }
  });

  return { outliers, indices, stats: { mean, std } };
}

/**
 * 복합 이상치 탐지 (IQR + Z-score)
 */
export function detectOutliers(
  values: number[],
  config: OutlierConfig = {}
): {
  outliers: number[];
  indices: number[];
  method: 'iqr' | 'zscore' | 'both';
  details: any;
} {
  const iqrResult = detectOutliersIQR(values, config);
  const zScoreResult = detectOutliersZScore(values, config);

  // 두 방법 모두에서 감지된 이상치 (교집합)
  const bothIndices = iqrResult.indices.filter(i => zScoreResult.indices.includes(i));

  // 방법 결정
  let method: 'iqr' | 'zscore' | 'both' = 'both';
  let indices: number[];
  let outliers: number[];

  if (bothIndices.length > 0) {
    // 두 방법 모두에서 감지된 경우
    indices = bothIndices;
    outliers = bothIndices.map(i => values[i]);
  } else if (iqrResult.indices.length > 0) {
    // IQR에서만 감지된 경우
    method = 'iqr';
    indices = iqrResult.indices;
    outliers = iqrResult.outliers;
  } else if (zScoreResult.indices.length > 0) {
    // Z-score에서만 감지된 경우
    method = 'zscore';
    indices = zScoreResult.indices;
    outliers = zScoreResult.outliers;
  } else {
    // 이상치 없음
    indices = [];
    outliers = [];
  }

  return {
    outliers,
    indices,
    method,
    details: {
      iqr: iqrResult,
      zScore: zScoreResult,
    },
  };
}

// ============================================================================
// 시뮬레이션 결과 일관성 검증
// ============================================================================

/** 일관성 검증 결과 */
export interface ConsistencyResult {
  consistent: boolean;
  variance: number;
  coefficient_of_variation: number;
  outliers: number[];
  details: {
    mean: number;
    std: number;
    min: number;
    max: number;
    range: number;
  };
}

/**
 * 동일 입력에 대한 결과 일관성 검증
 * (여러 번 실행한 결과의 변동성 측정)
 */
export function checkResultConsistency(
  results: number[],
  maxCoefficientOfVariation: number = 0.1 // 10% 이내 변동
): ConsistencyResult {
  if (results.length < 2) {
    return {
      consistent: true,
      variance: 0,
      coefficient_of_variation: 0,
      outliers: [],
      details: {
        mean: results[0] || 0,
        std: 0,
        min: results[0] || 0,
        max: results[0] || 0,
        range: 0,
      },
    };
  }

  // 기본 통계
  const mean = results.reduce((sum, v) => sum + v, 0) / results.length;
  const squaredDiffs = results.map(v => Math.pow(v - mean, 2));
  const variance = squaredDiffs.reduce((sum, v) => sum + v, 0) / results.length;
  const std = Math.sqrt(variance);
  const min = Math.min(...results);
  const max = Math.max(...results);
  const range = max - min;

  // 변동계수 (CV)
  const coefficient_of_variation = mean !== 0 ? std / Math.abs(mean) : 0;

  // 이상치 탐지
  const outlierResult = detectOutliers(results);

  return {
    consistent: coefficient_of_variation <= maxCoefficientOfVariation,
    variance,
    coefficient_of_variation,
    outliers: outlierResult.outliers,
    details: {
      mean,
      std,
      min,
      max,
      range,
    },
  };
}

/**
 * 여러 필드의 일관성 종합 검증
 */
export function checkMultiFieldConsistency<T extends Record<string, number>>(
  results: T[],
  fields: (keyof T)[],
  maxCoefficientOfVariation: number = 0.1
): Record<keyof T, ConsistencyResult> {
  const fieldResults: Partial<Record<keyof T, ConsistencyResult>> = {};

  for (const field of fields) {
    const values = results.map(r => r[field] as number).filter(v => !isNaN(v));
    fieldResults[field] = checkResultConsistency(values, maxCoefficientOfVariation);
  }

  return fieldResults as Record<keyof T, ConsistencyResult>;
}

// ============================================================================
// 헬퍼 함수
// ============================================================================

/**
 * density_index로부터 예상 congestion_risk 계산
 */
function determineCongestionFromDensity(
  densityIndex: number
): 'low' | 'medium' | 'high' | 'critical' {
  if (densityIndex < 0.4) return 'low';
  if (densityIndex < 0.6) return 'medium';
  if (densityIndex < 0.8) return 'high';
  return 'critical';
}

/**
 * 검증 결과 요약 생성
 */
export function summarizeValidation(result: ValidationResult): string {
  const parts: string[] = [];

  if (result.valid) {
    parts.push('✅ Valid');
  } else {
    parts.push('❌ Invalid');
  }

  if (result.errors.length > 0) {
    parts.push(`Errors: ${result.errors.length}`);
  }

  if (result.warnings.length > 0) {
    parts.push(`Warnings: ${result.warnings.length}`);
  }

  parts.push(`Confidence: ${(result.confidence * 100).toFixed(0)}%`);

  return parts.join(' | ');
}

// ============================================================================
// Export
// ============================================================================

export default {
  validateRange,
  validateTrafficFlowOutput,
  validateROIOutput,
  detectOutliersIQR,
  detectOutliersZScore,
  detectOutliers,
  checkResultConsistency,
  checkMultiFieldConsistency,
  summarizeValidation,
  // 규칙 export
  TRAFFIC_FLOW_RULES,
  ROI_RULES,
};
