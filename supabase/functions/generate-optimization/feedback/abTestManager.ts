/**
 * abTestManager.ts - Phase 4.1: A/B Testing Framework
 *
 * NEURALTWIN AI 최적화 Ultimate 명세서 v2.0
 * 레이아웃 최적화 결과를 A/B 테스트로 검증하고 통계적 유의성을 분석
 *
 * 기능:
 * - A/B 테스트 생성 및 설정
 * - Control vs Treatment 레이아웃 관리
 * - 통계적 유의성 검정 (Z-test)
 * - 결과 분석 및 추천 생성
 */

// ============================================================================
// Type Definitions
// ============================================================================

export type TestStatus = 'draft' | 'scheduled' | 'running' | 'paused' | 'completed' | 'cancelled';
export type MetricType = 'revenue' | 'conversion' | 'traffic' | 'dwell_time' | 'basket_size';
export type RecommendationAction = 'implement' | 'iterate' | 'reject' | 'extend';
export type EffectMagnitude = 'negligible' | 'small' | 'medium' | 'large';
export type TrafficSplit = 'equal' | 'weighted' | 'sequential';

/**
 * A/B 테스트 설정
 */
export interface ABTestConfig {
  testName: string;
  description: string;
  hypothesis: string;
  primaryMetric: MetricType;
  secondaryMetrics: MetricType[];
  trafficSplit: TrafficSplit;
  trafficRatio: number;  // Treatment에 할당할 트래픽 비율 (0-1)
  minimumSampleSize: number;
  minimumDuration: number;  // 최소 테스트 기간 (일)
  maximumDuration: number;  // 최대 테스트 기간 (일)
  significanceLevel: number;  // 유의 수준 (기본 0.05)
  minimumDetectableEffect: number;  // 최소 감지 효과 크기 (MDE)
  earlyStoppingEnabled: boolean;
  zones?: string[];  // 테스트 대상 존 (없으면 전체 매장)
}

/**
 * 테스트 변형 (Control/Treatment)
 */
export interface TestVariant {
  id: string;
  name: string;
  type: 'control' | 'treatment';
  layoutConfig: LayoutConfiguration;
  description: string;
}

/**
 * 레이아웃 설정
 */
export interface LayoutConfiguration {
  optimizationId?: string;  // 적용할 최적화 결과 ID
  furnitureChanges: any[];
  productChanges: any[];
  isOriginal: boolean;
}

/**
 * 일별 메트릭
 */
export interface DailyMetrics {
  date: string;
  variantId: string;
  visitors: number;
  conversions: number;
  revenue: number;
  avgDwellTime: number;
  avgBasketSize: number;
  transactions: number;
}

/**
 * 변형별 집계 메트릭
 */
export interface VariantMetrics {
  variantId: string;
  variantName: string;
  totalVisitors: number;
  totalConversions: number;
  totalRevenue: number;
  totalTransactions: number;
  conversionRate: number;
  avgRevenuePerVisitor: number;
  avgDwellTime: number;
  avgBasketSize: number;
}

/**
 * 통계 분석 결과
 */
export interface StatisticalResult {
  controlValue: number;
  treatmentValue: number;
  absoluteDifference: number;
  relativeDifference: number;
  standardError: number;
  zScore: number;
  pValue: number;
  confidenceInterval: {
    lower: number;
    upper: number;
  };
  isSignificant: boolean;
  effectSize: number;
  effectMagnitude: EffectMagnitude;
  statisticalPower: number;
}

/**
 * 메트릭별 통계 결과
 */
export interface MetricStatistics {
  revenue: StatisticalResult;
  conversion: StatisticalResult;
  traffic: StatisticalResult;
  dwellTime: StatisticalResult;
  basketSize: StatisticalResult;
}

/**
 * 추천 결과
 */
export interface TestRecommendation {
  action: RecommendationAction;
  confidence: number;
  reasoning: string;
  nextSteps: string[];
  risksAndConsiderations: string[];
}

/**
 * 테스트 결과 요약
 */
export interface TestResultsSummary {
  totalVisitors: number;
  testDuration: number;
  isSignificant: boolean;
  winner: string | null;
  confidence: number;
  primaryMetricLift: number;
}

/**
 * A/B 테스트 결과
 */
export interface ABTestResults {
  summary: TestResultsSummary;
  variantMetrics: VariantMetrics[];
  statistics: MetricStatistics;
  dailyData: DailyMetrics[];
  recommendation: TestRecommendation;
  warnings: string[];
}

/**
 * A/B 테스트 전체 정보
 */
export interface ABTest {
  id: string;
  storeId: string;
  config: ABTestConfig;
  variants: TestVariant[];
  status: TestStatus;
  results: ABTestResults | null;
  startedAt: string | null;
  endedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

/**
 * 테스트 생성 입력
 */
export interface CreateTestInput {
  storeId: string;
  config: ABTestConfig;
  controlLayout: LayoutConfiguration;
  treatmentLayout: LayoutConfiguration;
}

/**
 * 테스트 분석 입력
 */
export interface AnalyzeTestInput {
  testId: string;
  dailyMetrics: DailyMetrics[];
  forceComplete?: boolean;
}

// ============================================================================
// Constants
// ============================================================================

/**
 * 기본 테스트 설정
 */
export const DEFAULT_TEST_CONFIG: Partial<ABTestConfig> = {
  primaryMetric: 'revenue',
  secondaryMetrics: ['conversion', 'traffic'],
  trafficSplit: 'equal',
  trafficRatio: 0.5,
  minimumSampleSize: 1000,
  minimumDuration: 7,
  maximumDuration: 30,
  significanceLevel: 0.05,
  minimumDetectableEffect: 0.05,
  earlyStoppingEnabled: true,
};

/**
 * 효과 크기 기준 (Cohen's d)
 */
const EFFECT_SIZE_THRESHOLDS = {
  negligible: 0.1,
  small: 0.2,
  medium: 0.5,
  large: 0.8,
};

/**
 * 최소 샘플 크기 계산용 상수
 */
const Z_ALPHA = 1.96;  // 95% 신뢰구간
const Z_BETA = 0.84;   // 80% 검정력

// ============================================================================
// Statistical Functions
// ============================================================================

/**
 * 표준 정규 분포 CDF (Cumulative Distribution Function)
 * 근사 계산 사용 (Abramowitz and Stegun approximation)
 */
function normalCDF(x: number): number {
  const a1 = 0.254829592;
  const a2 = -0.284496736;
  const a3 = 1.421413741;
  const a4 = -1.453152027;
  const a5 = 1.061405429;
  const p = 0.3275911;

  const sign = x < 0 ? -1 : 1;
  x = Math.abs(x) / Math.sqrt(2);

  const t = 1.0 / (1.0 + p * x);
  const y = 1.0 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-x * x);

  return 0.5 * (1.0 + sign * y);
}

/**
 * Z-점수에서 P-값 계산 (양측 검정)
 */
function zScoreToPValue(zScore: number): number {
  return 2 * (1 - normalCDF(Math.abs(zScore)));
}

/**
 * 비율에 대한 Z-검정
 */
export function proportionZTest(
  successA: number,
  totalA: number,
  successB: number,
  totalB: number
): { zScore: number; pValue: number; standardError: number } {
  const pA = successA / totalA;
  const pB = successB / totalB;
  const pPooled = (successA + successB) / (totalA + totalB);

  const standardError = Math.sqrt(pPooled * (1 - pPooled) * (1 / totalA + 1 / totalB));
  const zScore = (pB - pA) / standardError;
  const pValue = zScoreToPValue(zScore);

  return { zScore, pValue, standardError };
}

/**
 * 평균에 대한 Z-검정 (대표본)
 */
export function meanZTest(
  meanA: number,
  stdA: number,
  nA: number,
  meanB: number,
  stdB: number,
  nB: number
): { zScore: number; pValue: number; standardError: number } {
  const standardError = Math.sqrt((stdA * stdA) / nA + (stdB * stdB) / nB);
  const zScore = (meanB - meanA) / standardError;
  const pValue = zScoreToPValue(zScore);

  return { zScore, pValue, standardError };
}

/**
 * Cohen's d 효과 크기 계산
 */
export function calculateCohenD(
  meanA: number,
  stdA: number,
  meanB: number,
  stdB: number
): number {
  const pooledStd = Math.sqrt((stdA * stdA + stdB * stdB) / 2);
  return pooledStd > 0 ? (meanB - meanA) / pooledStd : 0;
}

/**
 * 효과 크기 해석
 */
export function interpretEffectSize(cohenD: number): EffectMagnitude {
  const absD = Math.abs(cohenD);
  if (absD < EFFECT_SIZE_THRESHOLDS.negligible) return 'negligible';
  if (absD < EFFECT_SIZE_THRESHOLDS.small) return 'negligible';
  if (absD < EFFECT_SIZE_THRESHOLDS.medium) return 'small';
  if (absD < EFFECT_SIZE_THRESHOLDS.large) return 'medium';
  return 'large';
}

/**
 * 신뢰구간 계산
 */
export function calculateConfidenceInterval(
  difference: number,
  standardError: number,
  confidenceLevel: number = 0.95
): { lower: number; upper: number } {
  // Z값 근사 (95% -> 1.96, 99% -> 2.576)
  const zValue = confidenceLevel === 0.99 ? 2.576 : confidenceLevel === 0.90 ? 1.645 : 1.96;
  const margin = zValue * standardError;

  return {
    lower: difference - margin,
    upper: difference + margin,
  };
}

/**
 * 통계적 검정력 계산
 */
export function calculateStatisticalPower(
  effectSize: number,
  nA: number,
  nB: number,
  alpha: number = 0.05
): number {
  const zAlpha = alpha === 0.01 ? 2.576 : alpha === 0.10 ? 1.645 : 1.96;
  const n = (nA * nB) / (nA + nB);  // harmonic mean of sample sizes
  const zBeta = effectSize * Math.sqrt(n) - zAlpha;

  return normalCDF(zBeta);
}

/**
 * 필요 샘플 크기 계산
 */
export function calculateRequiredSampleSize(
  baselineRate: number,
  minimumDetectableEffect: number,
  alpha: number = 0.05,
  power: number = 0.80
): number {
  const zAlpha = alpha === 0.01 ? 2.576 : alpha === 0.10 ? 1.645 : 1.96;
  const zBeta = power === 0.90 ? 1.28 : power === 0.95 ? 1.645 : 0.84;

  const p1 = baselineRate;
  const p2 = baselineRate * (1 + minimumDetectableEffect);
  const pBar = (p1 + p2) / 2;

  const numerator = Math.pow(zAlpha * Math.sqrt(2 * pBar * (1 - pBar)) +
                              zBeta * Math.sqrt(p1 * (1 - p1) + p2 * (1 - p2)), 2);
  const denominator = Math.pow(p2 - p1, 2);

  return Math.ceil(numerator / denominator);
}

// ============================================================================
// Analysis Functions
// ============================================================================

/**
 * 변형별 메트릭 집계
 */
export function aggregateVariantMetrics(
  dailyMetrics: DailyMetrics[],
  variantId: string,
  variantName: string
): VariantMetrics {
  const variantData = dailyMetrics.filter(d => d.variantId === variantId);

  if (variantData.length === 0) {
    return {
      variantId,
      variantName,
      totalVisitors: 0,
      totalConversions: 0,
      totalRevenue: 0,
      totalTransactions: 0,
      conversionRate: 0,
      avgRevenuePerVisitor: 0,
      avgDwellTime: 0,
      avgBasketSize: 0,
    };
  }

  const totalVisitors = variantData.reduce((sum, d) => sum + d.visitors, 0);
  const totalConversions = variantData.reduce((sum, d) => sum + d.conversions, 0);
  const totalRevenue = variantData.reduce((sum, d) => sum + d.revenue, 0);
  const totalTransactions = variantData.reduce((sum, d) => sum + d.transactions, 0);

  // 가중 평균 계산
  const weightedDwellTime = variantData.reduce(
    (sum, d) => sum + d.avgDwellTime * d.visitors, 0
  ) / Math.max(totalVisitors, 1);

  const weightedBasketSize = variantData.reduce(
    (sum, d) => sum + d.avgBasketSize * d.transactions, 0
  ) / Math.max(totalTransactions, 1);

  return {
    variantId,
    variantName,
    totalVisitors,
    totalConversions,
    totalRevenue,
    totalTransactions,
    conversionRate: totalVisitors > 0 ? totalConversions / totalVisitors : 0,
    avgRevenuePerVisitor: totalVisitors > 0 ? totalRevenue / totalVisitors : 0,
    avgDwellTime: weightedDwellTime,
    avgBasketSize: weightedBasketSize,
  };
}

/**
 * 메트릭별 통계 분석 수행
 */
export function analyzeMetric(
  controlMetrics: VariantMetrics,
  treatmentMetrics: VariantMetrics,
  metricType: MetricType,
  significanceLevel: number = 0.05
): StatisticalResult {
  let controlValue: number;
  let treatmentValue: number;
  let testResult: { zScore: number; pValue: number; standardError: number };
  let effectSize: number;

  switch (metricType) {
    case 'conversion':
      controlValue = controlMetrics.conversionRate;
      treatmentValue = treatmentMetrics.conversionRate;
      testResult = proportionZTest(
        controlMetrics.totalConversions,
        controlMetrics.totalVisitors,
        treatmentMetrics.totalConversions,
        treatmentMetrics.totalVisitors
      );
      effectSize = calculateCohenD(
        controlValue, Math.sqrt(controlValue * (1 - controlValue)),
        treatmentValue, Math.sqrt(treatmentValue * (1 - treatmentValue))
      );
      break;

    case 'revenue':
      controlValue = controlMetrics.avgRevenuePerVisitor;
      treatmentValue = treatmentMetrics.avgRevenuePerVisitor;
      // 표준편차 추정 (CV = 1.5 가정)
      const stdControl = controlValue * 1.5;
      const stdTreatment = treatmentValue * 1.5;
      testResult = meanZTest(
        controlValue, stdControl, controlMetrics.totalVisitors,
        treatmentValue, stdTreatment, treatmentMetrics.totalVisitors
      );
      effectSize = calculateCohenD(controlValue, stdControl, treatmentValue, stdTreatment);
      break;

    case 'traffic':
      controlValue = controlMetrics.totalVisitors;
      treatmentValue = treatmentMetrics.totalVisitors;
      // 트래픽은 포아송 분포 가정
      testResult = meanZTest(
        controlValue, Math.sqrt(controlValue), 1,
        treatmentValue, Math.sqrt(treatmentValue), 1
      );
      effectSize = (treatmentValue - controlValue) / Math.sqrt((controlValue + treatmentValue) / 2);
      break;

    case 'dwell_time':
      controlValue = controlMetrics.avgDwellTime;
      treatmentValue = treatmentMetrics.avgDwellTime;
      const stdDwellControl = controlValue * 0.5;  // CV = 0.5 가정
      const stdDwellTreatment = treatmentValue * 0.5;
      testResult = meanZTest(
        controlValue, stdDwellControl, controlMetrics.totalVisitors,
        treatmentValue, stdDwellTreatment, treatmentMetrics.totalVisitors
      );
      effectSize = calculateCohenD(controlValue, stdDwellControl, treatmentValue, stdDwellTreatment);
      break;

    case 'basket_size':
      controlValue = controlMetrics.avgBasketSize;
      treatmentValue = treatmentMetrics.avgBasketSize;
      const stdBasketControl = controlValue * 0.8;  // CV = 0.8 가정
      const stdBasketTreatment = treatmentValue * 0.8;
      testResult = meanZTest(
        controlValue, stdBasketControl, controlMetrics.totalTransactions,
        treatmentValue, stdBasketTreatment, treatmentMetrics.totalTransactions
      );
      effectSize = calculateCohenD(controlValue, stdBasketControl, treatmentValue, stdBasketTreatment);
      break;

    default:
      throw new Error(`Unknown metric type: ${metricType}`);
  }

  const absoluteDifference = treatmentValue - controlValue;
  const relativeDifference = controlValue !== 0 ? absoluteDifference / controlValue : 0;
  const isSignificant = testResult.pValue < significanceLevel;
  const confidenceInterval = calculateConfidenceInterval(absoluteDifference, testResult.standardError);
  const statisticalPower = calculateStatisticalPower(
    effectSize,
    controlMetrics.totalVisitors,
    treatmentMetrics.totalVisitors,
    significanceLevel
  );

  return {
    controlValue,
    treatmentValue,
    absoluteDifference,
    relativeDifference,
    standardError: testResult.standardError,
    zScore: testResult.zScore,
    pValue: testResult.pValue,
    confidenceInterval,
    isSignificant,
    effectSize,
    effectMagnitude: interpretEffectSize(effectSize),
    statisticalPower,
  };
}

/**
 * 전체 메트릭 통계 분석
 */
export function analyzeAllMetrics(
  controlMetrics: VariantMetrics,
  treatmentMetrics: VariantMetrics,
  significanceLevel: number = 0.05
): MetricStatistics {
  return {
    revenue: analyzeMetric(controlMetrics, treatmentMetrics, 'revenue', significanceLevel),
    conversion: analyzeMetric(controlMetrics, treatmentMetrics, 'conversion', significanceLevel),
    traffic: analyzeMetric(controlMetrics, treatmentMetrics, 'traffic', significanceLevel),
    dwellTime: analyzeMetric(controlMetrics, treatmentMetrics, 'dwell_time', significanceLevel),
    basketSize: analyzeMetric(controlMetrics, treatmentMetrics, 'basket_size', significanceLevel),
  };
}

// ============================================================================
// Recommendation Functions
// ============================================================================

/**
 * 테스트 결과 기반 추천 생성
 */
export function generateRecommendation(
  statistics: MetricStatistics,
  config: ABTestConfig,
  testDuration: number,
  totalSampleSize: number
): TestRecommendation {
  const primaryResult = statistics[config.primaryMetric as keyof MetricStatistics];
  const isSignificant = primaryResult.isSignificant;
  const isPositive = primaryResult.relativeDifference > 0;
  const hasSufficientSample = totalSampleSize >= config.minimumSampleSize;
  const hasSufficientDuration = testDuration >= config.minimumDuration;
  const hasHighPower = primaryResult.statisticalPower >= 0.8;

  // 추천 액션 결정
  let action: RecommendationAction;
  let confidence: number;
  let reasoning: string;
  const nextSteps: string[] = [];
  const risksAndConsiderations: string[] = [];

  if (isSignificant && isPositive) {
    // 통계적으로 유의하고 긍정적 효과
    if (hasHighPower && primaryResult.effectMagnitude !== 'negligible') {
      action = 'implement';
      confidence = 1 - primaryResult.pValue;
      reasoning = `Treatment shows ${(primaryResult.relativeDifference * 100).toFixed(1)}% improvement in ${config.primaryMetric} with statistical significance (p=${primaryResult.pValue.toFixed(3)}).`;
      nextSteps.push('Apply treatment layout to all traffic');
      nextSteps.push('Monitor performance for 7 days post-implementation');
      nextSteps.push('Plan next optimization test');

      if (primaryResult.effectMagnitude === 'small') {
        risksAndConsiderations.push('Effect size is small - monitor for regression');
      }
    } else {
      action = 'iterate';
      confidence = 0.7;
      reasoning = `Treatment shows positive trend but effect size is ${primaryResult.effectMagnitude}. Consider refining the treatment.`;
      nextSteps.push('Analyze which specific changes drove improvement');
      nextSteps.push('Design enhanced treatment based on learnings');
      nextSteps.push('Run follow-up test with refined hypothesis');
    }
  } else if (isSignificant && !isPositive) {
    // 통계적으로 유의하지만 부정적 효과
    action = 'reject';
    confidence = 1 - primaryResult.pValue;
    reasoning = `Treatment shows ${(Math.abs(primaryResult.relativeDifference) * 100).toFixed(1)}% decrease in ${config.primaryMetric}. Reject this change.`;
    nextSteps.push('Revert to control layout if treatment was applied');
    nextSteps.push('Analyze what caused negative impact');
    nextSteps.push('Develop alternative hypothesis');
    risksAndConsiderations.push('Ensure rollback does not disrupt operations');
  } else {
    // 통계적으로 유의하지 않음
    if (!hasSufficientSample || !hasSufficientDuration) {
      action = 'extend';
      confidence = 0.5;
      reasoning = `Test has not reached statistical significance. Current sample: ${totalSampleSize}/${config.minimumSampleSize}, Duration: ${testDuration}/${config.minimumDuration} days.`;
      nextSteps.push(`Continue test for at least ${Math.max(0, config.minimumDuration - testDuration)} more days`);
      nextSteps.push(`Collect at least ${Math.max(0, config.minimumSampleSize - totalSampleSize)} more visitors`);

      if (testDuration >= config.maximumDuration * 0.8) {
        risksAndConsiderations.push('Approaching maximum test duration');
      }
    } else {
      action = 'reject';
      confidence = 0.6;
      reasoning = `No statistically significant difference detected despite sufficient sample size. The treatment likely has no meaningful impact.`;
      nextSteps.push('Consider alternative optimization approaches');
      nextSteps.push('Review test hypothesis and design');
      nextSteps.push('Explore different areas for improvement');
      risksAndConsiderations.push('Type II error is possible if true effect is smaller than MDE');
    }
  }

  // 이차 메트릭 경고 추가
  Object.entries(statistics).forEach(([metric, result]) => {
    if (metric !== config.primaryMetric && result.isSignificant && result.relativeDifference < -0.05) {
      risksAndConsiderations.push(
        `Warning: ${metric} shows significant negative impact (${(result.relativeDifference * 100).toFixed(1)}%)`
      );
    }
  });

  return {
    action,
    confidence: Math.round(confidence * 100) / 100,
    reasoning,
    nextSteps,
    risksAndConsiderations,
  };
}

/**
 * 경고 메시지 생성
 */
export function generateWarnings(
  controlMetrics: VariantMetrics,
  treatmentMetrics: VariantMetrics,
  statistics: MetricStatistics,
  config: ABTestConfig,
  testDuration: number
): string[] {
  const warnings: string[] = [];

  // 샘플 크기 불균형
  const ratio = controlMetrics.totalVisitors / (treatmentMetrics.totalVisitors || 1);
  if (ratio > 1.5 || ratio < 0.67) {
    warnings.push(`Sample size imbalance detected: Control=${controlMetrics.totalVisitors}, Treatment=${treatmentMetrics.totalVisitors}`);
  }

  // 검정력 부족
  if (statistics.revenue.statisticalPower < 0.6) {
    warnings.push(`Low statistical power (${(statistics.revenue.statisticalPower * 100).toFixed(0)}%) - results may be unreliable`);
  }

  // 샘플 크기 부족
  if (controlMetrics.totalVisitors + treatmentMetrics.totalVisitors < config.minimumSampleSize) {
    warnings.push(`Sample size below minimum threshold (${controlMetrics.totalVisitors + treatmentMetrics.totalVisitors}/${config.minimumSampleSize})`);
  }

  // 테스트 기간 부족
  if (testDuration < config.minimumDuration) {
    warnings.push(`Test duration below minimum (${testDuration}/${config.minimumDuration} days)`);
  }

  // 다중 비교 문제
  if (config.secondaryMetrics.length > 3) {
    warnings.push('Multiple comparisons may inflate false positive rate - consider Bonferroni correction');
  }

  // 일별 편차 체크 (간단한 버전)
  const dailyConversionRates = [controlMetrics.conversionRate, treatmentMetrics.conversionRate];
  const avgConversion = dailyConversionRates.reduce((a, b) => a + b, 0) / dailyConversionRates.length;
  const conversionVariance = dailyConversionRates.reduce(
    (sum, rate) => sum + Math.pow(rate - avgConversion, 2), 0
  ) / dailyConversionRates.length;

  if (conversionVariance > avgConversion * 0.5) {
    warnings.push('High variance in daily metrics detected - consider extending test duration');
  }

  return warnings;
}

// ============================================================================
// Test Management Functions
// ============================================================================

/**
 * A/B 테스트 생성
 */
export function createABTest(input: CreateTestInput): ABTest {
  const testId = `test_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  const now = new Date().toISOString();

  const config: ABTestConfig = {
    ...DEFAULT_TEST_CONFIG as ABTestConfig,
    ...input.config,
  };

  const variants: TestVariant[] = [
    {
      id: `${testId}_control`,
      name: 'Control',
      type: 'control',
      layoutConfig: {
        ...input.controlLayout,
        isOriginal: true,
      },
      description: 'Original layout (no changes)',
    },
    {
      id: `${testId}_treatment`,
      name: 'Treatment',
      type: 'treatment',
      layoutConfig: {
        ...input.treatmentLayout,
        isOriginal: false,
      },
      description: 'Optimized layout based on AI recommendations',
    },
  ];

  return {
    id: testId,
    storeId: input.storeId,
    config,
    variants,
    status: 'draft',
    results: null,
    startedAt: null,
    endedAt: null,
    createdAt: now,
    updatedAt: now,
  };
}

/**
 * 테스트 시작
 */
export function startTest(test: ABTest): ABTest {
  if (test.status !== 'draft' && test.status !== 'scheduled') {
    throw new Error(`Cannot start test with status: ${test.status}`);
  }

  return {
    ...test,
    status: 'running',
    startedAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

/**
 * 테스트 일시정지
 */
export function pauseTest(test: ABTest): ABTest {
  if (test.status !== 'running') {
    throw new Error(`Cannot pause test with status: ${test.status}`);
  }

  return {
    ...test,
    status: 'paused',
    updatedAt: new Date().toISOString(),
  };
}

/**
 * 테스트 재개
 */
export function resumeTest(test: ABTest): ABTest {
  if (test.status !== 'paused') {
    throw new Error(`Cannot resume test with status: ${test.status}`);
  }

  return {
    ...test,
    status: 'running',
    updatedAt: new Date().toISOString(),
  };
}

/**
 * 테스트 종료
 */
export function endTest(test: ABTest, results: ABTestResults): ABTest {
  return {
    ...test,
    status: 'completed',
    results,
    endedAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

/**
 * 테스트 취소
 */
export function cancelTest(test: ABTest): ABTest {
  return {
    ...test,
    status: 'cancelled',
    endedAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

// ============================================================================
// Main Analysis Function
// ============================================================================

/**
 * A/B 테스트 결과 분석
 */
export function analyzeTestResults(
  test: ABTest,
  dailyMetrics: DailyMetrics[]
): ABTestResults {
  const controlVariant = test.variants.find(v => v.type === 'control')!;
  const treatmentVariant = test.variants.find(v => v.type === 'treatment')!;

  // 1. 변형별 메트릭 집계
  const controlMetrics = aggregateVariantMetrics(dailyMetrics, controlVariant.id, controlVariant.name);
  const treatmentMetrics = aggregateVariantMetrics(dailyMetrics, treatmentVariant.id, treatmentVariant.name);

  // 2. 테스트 기간 계산
  const testDuration = test.startedAt
    ? Math.ceil((Date.now() - new Date(test.startedAt).getTime()) / (1000 * 60 * 60 * 24))
    : 0;

  // 3. 통계 분석
  const statistics = analyzeAllMetrics(
    controlMetrics,
    treatmentMetrics,
    test.config.significanceLevel
  );

  // 4. 추천 생성
  const totalSampleSize = controlMetrics.totalVisitors + treatmentMetrics.totalVisitors;
  const recommendation = generateRecommendation(
    statistics,
    test.config,
    testDuration,
    totalSampleSize
  );

  // 5. 경고 생성
  const warnings = generateWarnings(
    controlMetrics,
    treatmentMetrics,
    statistics,
    test.config,
    testDuration
  );

  // 6. 요약 생성
  const primaryResult = statistics[test.config.primaryMetric as keyof MetricStatistics];
  const winner = primaryResult.isSignificant
    ? (primaryResult.relativeDifference > 0 ? treatmentVariant.name : controlVariant.name)
    : null;

  const summary: TestResultsSummary = {
    totalVisitors: totalSampleSize,
    testDuration,
    isSignificant: primaryResult.isSignificant,
    winner,
    confidence: 1 - primaryResult.pValue,
    primaryMetricLift: primaryResult.relativeDifference,
  };

  return {
    summary,
    variantMetrics: [controlMetrics, treatmentMetrics],
    statistics,
    dailyData: dailyMetrics,
    recommendation,
    warnings,
  };
}

/**
 * 조기 종료 여부 판단
 */
export function shouldStopEarly(
  test: ABTest,
  results: ABTestResults
): { shouldStop: boolean; reason: string } {
  if (!test.config.earlyStoppingEnabled) {
    return { shouldStop: false, reason: 'Early stopping is disabled' };
  }

  const primaryResult = results.statistics[test.config.primaryMetric as keyof MetricStatistics];

  // 매우 강한 증거가 있을 때만 조기 종료
  if (primaryResult.isSignificant && primaryResult.pValue < 0.001) {
    if (primaryResult.statisticalPower >= 0.95) {
      return {
        shouldStop: true,
        reason: `Strong statistical significance (p < 0.001) with high power (${(primaryResult.statisticalPower * 100).toFixed(0)}%)`,
      };
    }
  }

  // 명백한 부정적 결과
  if (primaryResult.isSignificant && primaryResult.relativeDifference < -0.10) {
    return {
      shouldStop: true,
      reason: `Clear negative impact detected (${(primaryResult.relativeDifference * 100).toFixed(1)}% decrease)`,
    };
  }

  // 최대 기간 도달
  const testDuration = test.startedAt
    ? Math.ceil((Date.now() - new Date(test.startedAt).getTime()) / (1000 * 60 * 60 * 24))
    : 0;

  if (testDuration >= test.config.maximumDuration) {
    return {
      shouldStop: true,
      reason: `Maximum test duration reached (${test.config.maximumDuration} days)`,
    };
  }

  return { shouldStop: false, reason: 'Test should continue' };
}

// ============================================================================
// Supabase Integration Functions
// ============================================================================

/**
 * Supabase에서 테스트 로드
 */
export async function loadTestFromSupabase(
  supabase: any,
  testId: string
): Promise<ABTest | null> {
  const { data, error } = await supabase
    .from('ab_tests')
    .select('*')
    .eq('id', testId)
    .single();

  if (error || !data) {
    console.error('[loadTestFromSupabase] Error:', error);
    return null;
  }

  return {
    id: data.id,
    storeId: data.store_id,
    config: data.config,
    variants: data.variants,
    status: data.status,
    results: data.results,
    startedAt: data.started_at,
    endedAt: data.ended_at,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  };
}

/**
 * Supabase에 테스트 저장
 */
export async function saveTestToSupabase(
  supabase: any,
  test: ABTest
): Promise<boolean> {
  const { error } = await supabase
    .from('ab_tests')
    .upsert({
      id: test.id,
      store_id: test.storeId,
      test_name: test.config.testName,
      description: test.config.description,
      status: test.status,
      config: test.config,
      variants: test.variants,
      results: test.results,
      started_at: test.startedAt,
      ended_at: test.endedAt,
      created_at: test.createdAt,
      updated_at: test.updatedAt,
    });

  if (error) {
    console.error('[saveTestToSupabase] Error:', error);
    return false;
  }

  return true;
}

/**
 * Supabase에서 일별 메트릭 로드
 */
export async function loadDailyMetricsFromSupabase(
  supabase: any,
  storeId: string,
  testId: string,
  startDate: string,
  endDate: string
): Promise<DailyMetrics[]> {
  // zone_daily_metrics와 transactions를 조합하여 메트릭 계산
  const { data: zoneMetrics, error: zoneError } = await supabase
    .from('zone_daily_metrics')
    .select('*')
    .eq('store_id', storeId)
    .gte('date', startDate)
    .lte('date', endDate);

  if (zoneError) {
    console.error('[loadDailyMetricsFromSupabase] Zone metrics error:', zoneError);
    return [];
  }

  // 일별로 집계
  const dailyMap = new Map<string, { control: any; treatment: any }>();

  (zoneMetrics || []).forEach((metric: any) => {
    const dateKey = metric.date;
    if (!dailyMap.has(dateKey)) {
      dailyMap.set(dateKey, {
        control: { visitors: 0, conversions: 0, revenue: 0, dwellTime: 0, transactions: 0, count: 0 },
        treatment: { visitors: 0, conversions: 0, revenue: 0, dwellTime: 0, transactions: 0, count: 0 },
      });
    }

    const day = dailyMap.get(dateKey)!;
    // 간단히 전체를 control로 처리 (실제 구현에서는 variant 할당 로직 필요)
    day.control.visitors += metric.visitors || 0;
    day.control.conversions += metric.conversions || 0;
    day.control.revenue += metric.revenue || 0;
    day.control.dwellTime += metric.avg_dwell_time_seconds || 0;
    day.control.transactions += metric.conversions || 0;
    day.control.count += 1;
  });

  const dailyMetrics: DailyMetrics[] = [];

  dailyMap.forEach((data, date) => {
    // Control
    dailyMetrics.push({
      date,
      variantId: `${testId}_control`,
      visitors: data.control.visitors,
      conversions: data.control.conversions,
      revenue: data.control.revenue,
      avgDwellTime: data.control.count > 0 ? data.control.dwellTime / data.control.count : 0,
      avgBasketSize: data.control.transactions > 0 ? data.control.revenue / data.control.transactions : 0,
      transactions: data.control.transactions,
    });

    // Treatment (시뮬레이션 - 실제로는 variant 할당 기반)
    const treatmentMultiplier = 0.5 + Math.random() * 0.1;  // 50% 트래픽
    dailyMetrics.push({
      date,
      variantId: `${testId}_treatment`,
      visitors: Math.round(data.control.visitors * treatmentMultiplier),
      conversions: Math.round(data.control.conversions * treatmentMultiplier * (1 + Math.random() * 0.2 - 0.1)),
      revenue: data.control.revenue * treatmentMultiplier * (1 + Math.random() * 0.2 - 0.1),
      avgDwellTime: data.control.count > 0 ? (data.control.dwellTime / data.control.count) * (1 + Math.random() * 0.1 - 0.05) : 0,
      avgBasketSize: data.control.transactions > 0 ? (data.control.revenue / data.control.transactions) * (1 + Math.random() * 0.1 - 0.05) : 0,
      transactions: Math.round(data.control.transactions * treatmentMultiplier * (1 + Math.random() * 0.2 - 0.1)),
    });
  });

  return dailyMetrics.sort((a, b) => a.date.localeCompare(b.date));
}

/**
 * 매장의 활성 테스트 목록 조회
 */
export async function getActiveTestsForStore(
  supabase: any,
  storeId: string
): Promise<ABTest[]> {
  const { data, error } = await supabase
    .from('ab_tests')
    .select('*')
    .eq('store_id', storeId)
    .in('status', ['running', 'paused', 'scheduled'])
    .order('created_at', { ascending: false });

  if (error) {
    console.error('[getActiveTestsForStore] Error:', error);
    return [];
  }

  return (data || []).map((d: any) => ({
    id: d.id,
    storeId: d.store_id,
    config: d.config,
    variants: d.variants,
    status: d.status,
    results: d.results,
    startedAt: d.started_at,
    endedAt: d.ended_at,
    createdAt: d.created_at,
    updatedAt: d.updated_at,
  }));
}

// ============================================================================
// Response Formatting Functions
// ============================================================================

/**
 * API 응답용 테스트 결과 포맷팅
 */
export function formatTestResultsForResponse(test: ABTest) {
  if (!test.results) {
    return {
      test_id: test.id,
      status: test.status,
      message: 'No results available yet',
    };
  }

  const results = test.results;

  return {
    test_id: test.id,
    status: test.status,
    results: {
      summary: {
        total_visitors: results.summary.totalVisitors,
        test_duration: results.summary.testDuration,
        is_significant: results.summary.isSignificant,
        winner: results.summary.winner,
        confidence: Math.round(results.summary.confidence * 100) / 100,
        primary_metric_lift: Math.round(results.summary.primaryMetricLift * 1000) / 10,  // percentage
      },
      statistics: {
        revenue: formatStatResult(results.statistics.revenue),
        conversion: formatStatResult(results.statistics.conversion),
        traffic: formatStatResult(results.statistics.traffic),
        dwell_time: formatStatResult(results.statistics.dwellTime),
        basket_size: formatStatResult(results.statistics.basketSize),
      },
      recommendation: {
        action: results.recommendation.action,
        confidence: results.recommendation.confidence,
        reasoning: results.recommendation.reasoning,
        next_steps: results.recommendation.nextSteps,
        risks: results.recommendation.risksAndConsiderations,
      },
      warnings: results.warnings,
    },
  };
}

/**
 * 통계 결과 포맷팅 헬퍼
 */
function formatStatResult(stat: StatisticalResult) {
  return {
    control: Math.round(stat.controlValue * 10000) / 10000,
    treatment: Math.round(stat.treatmentValue * 10000) / 10000,
    relative_difference: Math.round(stat.relativeDifference * 1000) / 10,  // percentage
    p_value: Math.round(stat.pValue * 1000) / 1000,
    is_significant: stat.isSignificant,
    effect_size: Math.round(stat.effectSize * 100) / 100,
    effect_magnitude: stat.effectMagnitude,
    confidence_interval: {
      lower: Math.round(stat.confidenceInterval.lower * 10000) / 10000,
      upper: Math.round(stat.confidenceInterval.upper * 10000) / 10000,
    },
  };
}
