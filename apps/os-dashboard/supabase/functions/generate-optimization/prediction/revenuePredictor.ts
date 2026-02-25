/**
 * revenuePredictor.ts - Phase 2.1: Revenue Prediction Model
 *
 * NEURALTWIN AI 최적화 Ultimate 명세서 v2.0
 * AI가 제안한 배치 변경에 대해 예상 매출 변화를 정량적으로 예측
 *
 * 주요 기능:
 * - 존 이동 효과 계산
 * - 슬롯 높이/가시성 효과 계산
 * - 환경 요인 반영
 * - 카테고리-존 친화도 보정
 * - 신뢰구간 및 리스크 평가
 */

// ============================================================================
// Type Definitions
// ============================================================================

export type SlotHeight = 'floor' | 'low' | 'eye' | 'high' | 'top';
export type VisibilityLevel = 'low' | 'medium' | 'high' | 'focal_point';
export type RiskLevel = 'low' | 'medium' | 'high';
export type Priority = 'critical' | 'high' | 'medium' | 'low';

/**
 * 상품 정보
 */
export interface ProductInfo {
  id: string;
  sku: string;
  name: string;
  category: string;
  price: number;
  margin: number;               // 마진율 (0-1)
  avgDailySales: number;        // 평균 일일 판매량
  historicalConversion: number; // 과거 전환율
}

/**
 * 배치 정보
 */
export interface PlacementInfo {
  zoneId: string;
  zoneCode: string;
  zoneType: string;             // entrance, main_hall, clothing, accessory, checkout
  slotHeight: SlotHeight;
  furnitureType: string;
  visibility: VisibilityLevel;
}

/**
 * 컨텍스트 정보
 */
export interface PredictionContext {
  currentZoneTraffic: number;   // 현재 존 일일 방문자
  suggestedZoneTraffic: number; // 제안 존 일일 방문자
  currentZoneConversion: number;
  suggestedZoneConversion: number;
  environment: {
    weatherMultiplier: number;
    eventMultiplier: number;
    temporalMultiplier: number;
  };
}

/**
 * 매출 예측 입력
 */
export interface RevenuePredictionInput {
  product: ProductInfo;
  currentPlacement: PlacementInfo;
  suggestedPlacement: PlacementInfo;
  context: PredictionContext;
}

/**
 * 예측 효과 상세
 */
export interface PredictionBreakdown {
  zoneTrafficEffect: number;     // 존 이동 효과
  slotHeightEffect: number;      // 슬롯 높이 변경 효과
  visibilityEffect: number;      // 가시성 변경 효과
  environmentEffect: number;     // 환경 요인 효과
  categoryBonus: number;         // 카테고리별 보정
}

/**
 * 리스크 평가
 */
export interface RiskAssessment {
  level: RiskLevel;
  factors: string[];
  mitigations: string[];
}

/**
 * 추천 결정
 */
export interface Recommendation {
  proceed: boolean;
  priority: Priority;
  reason: string;
}

/**
 * 매출 예측 출력
 */
export interface RevenuePredictionOutput {
  predictedRevenueChange: number;  // -1 ~ +∞ (비율, 0.15 = +15%)
  predictedDailyRevenue: {
    before: number;                // 현재 예상 일매출
    after: number;                 // 변경 후 예상 일매출
    difference: number;            // 차이 (원)
  };
  confidenceInterval: {
    lower: number;                 // 95% 신뢰구간 하한
    upper: number;                 // 95% 신뢰구간 상한
  };
  confidence: number;              // 예측 신뢰도 (0-1)
  breakdown: PredictionBreakdown;
  risk: RiskAssessment;
  recommendation: Recommendation;
}

/**
 * 예측기 설정
 */
export interface RevenuePredictorConfig {
  zoneMultipliers: Record<string, number>;
  slotHeightMultipliers: Record<SlotHeight, number>;
  visibilityMultipliers: Record<VisibilityLevel, number>;
  categoryZoneAffinity: Record<string, Record<string, number>>;
  weights: {
    zoneTraffic: number;
    slotHeight: number;
    visibility: number;
    environment: number;
    categoryBonus: number;
  };
}

/**
 * 배치 예측 요약
 */
export interface PredictionSummary {
  totalExpectedRevenueChange: number;
  totalDailyRevenueIncrease: number;
  highConfidenceChanges: number;
  mediumConfidenceChanges: number;
  lowConfidenceChanges: number;
  overallConfidence: number;
  topPriorityChanges: number;
}

// ============================================================================
// Default Configuration
// ============================================================================

export const DEFAULT_REVENUE_CONFIG: RevenuePredictorConfig = {
  zoneMultipliers: {
    entrance: 1.0,        // 기준
    main_hall: 1.15,      // 메인 동선
    clothing: 0.95,       // 목적성 구매
    clothing_zone: 0.95,
    accessory: 0.85,      // 충동 구매 의존
    accessory_zone: 0.85,
    fitting_room: 0.70,   // 제한적 노출
    checkout: 1.10,       // 임펄스 구매
    checkout_zone: 1.10,
    lounge: 0.60,         // 휴식 공간
    experience_zone: 0.75,
    premium_zone: 1.05,
    sale_zone: 1.00,
    storage: 0.20,
    back_zone: 0.50,
  },

  slotHeightMultipliers: {
    floor: 0.60,          // 바닥 - 가장 낮은 노출
    low: 0.85,            // 허리 아래
    eye: 1.00,            // 골든존 (기준)
    high: 0.75,           // 어깨 위
    top: 0.50,            // 손 닿지 않음
  },

  visibilityMultipliers: {
    low: 0.60,
    medium: 0.85,
    high: 1.00,
    focal_point: 1.30,    // 포컬 포인트 프리미엄
  },

  categoryZoneAffinity: {
    outerwear: {
      entrance: 1.20,
      main_hall: 1.10,
      clothing: 1.00,
      clothing_zone: 1.00,
      checkout: 0.70,
      accessory: 0.60,
    },
    tops: {
      entrance: 0.90,
      main_hall: 1.00,
      clothing: 1.15,
      clothing_zone: 1.15,
      checkout: 0.80,
      accessory: 0.70,
    },
    bottoms: {
      entrance: 0.80,
      main_hall: 0.95,
      clothing: 1.20,
      clothing_zone: 1.20,
      checkout: 0.70,
      accessory: 0.65,
    },
    accessory: {
      entrance: 1.10,
      main_hall: 1.00,
      accessory: 1.20,
      accessory_zone: 1.20,
      checkout: 1.30,
      clothing: 0.80,
    },
    bags: {
      entrance: 1.00,
      main_hall: 1.10,
      accessory: 1.15,
      accessory_zone: 1.15,
      checkout: 0.90,
      clothing: 0.85,
    },
    shoes: {
      entrance: 0.85,
      main_hall: 0.90,
      clothing: 1.10,
      clothing_zone: 1.10,
      checkout: 0.70,
      accessory: 0.75,
    },
    jewelry: {
      entrance: 0.95,
      main_hall: 1.05,
      accessory: 1.25,
      accessory_zone: 1.25,
      checkout: 1.15,
      premium_zone: 1.30,
    },
    cosmetics: {
      entrance: 1.10,
      main_hall: 1.05,
      accessory: 1.10,
      checkout: 1.20,
      premium_zone: 1.15,
    },
    sale_items: {
      entrance: 1.15,
      main_hall: 1.10,
      sale_zone: 1.25,
      checkout: 0.90,
    },
    premium: {
      entrance: 0.90,
      main_hall: 1.05,
      premium_zone: 1.30,
      experience_zone: 1.15,
      checkout: 0.75,
    },
  },

  weights: {
    zoneTraffic: 0.35,    // 트래픽이 가장 중요
    slotHeight: 0.25,     // 골든존 효과
    visibility: 0.15,     // 가시성
    environment: 0.15,    // 환경 요인
    categoryBonus: 0.10,  // 카테고리 친화도
  },
};

// ============================================================================
// Effect Calculation Functions
// ============================================================================

/**
 * 존 이동에 따른 트래픽 변화 효과 계산
 */
export function calculateZoneTrafficEffect(
  input: RevenuePredictionInput,
  config: RevenuePredictorConfig = DEFAULT_REVENUE_CONFIG
): number {
  const { context, currentPlacement, suggestedPlacement } = input;

  // 트래픽 비율 계산
  const trafficRatio = context.currentZoneTraffic > 0
    ? context.suggestedZoneTraffic / context.currentZoneTraffic
    : 1.0;

  // 존 타입 승수 계산
  const currentZoneMult = config.zoneMultipliers[currentPlacement.zoneType] || 1.0;
  const suggestedZoneMult = config.zoneMultipliers[suggestedPlacement.zoneType] || 1.0;
  const zoneTypeFactor = suggestedZoneMult / currentZoneMult;

  // 전환율 반영
  const conversionRatio = context.currentZoneConversion > 0
    ? context.suggestedZoneConversion / context.currentZoneConversion
    : 1.0;

  // 종합 효과 (가중 기하 평균)
  const combinedEffect = Math.pow(trafficRatio, 0.5) *
                         Math.pow(zoneTypeFactor, 0.3) *
                         Math.pow(conversionRatio, 0.2);

  // 변화율로 변환 (-1 ~ +∞)
  return combinedEffect - 1;
}

/**
 * 슬롯 높이 변경 효과 계산
 */
export function calculateSlotHeightEffect(
  currentHeight: SlotHeight,
  suggestedHeight: SlotHeight,
  config: RevenuePredictorConfig = DEFAULT_REVENUE_CONFIG
): number {
  const currentMult = config.slotHeightMultipliers[currentHeight] || 0.85;
  const suggestedMult = config.slotHeightMultipliers[suggestedHeight] || 0.85;

  // 변화율 계산
  const heightFactor = suggestedMult / currentMult;
  return heightFactor - 1;
}

/**
 * 가시성 변경 효과 계산
 */
export function calculateVisibilityEffect(
  currentVisibility: VisibilityLevel,
  suggestedVisibility: VisibilityLevel,
  config: RevenuePredictorConfig = DEFAULT_REVENUE_CONFIG
): number {
  const currentMult = config.visibilityMultipliers[currentVisibility] || 0.85;
  const suggestedMult = config.visibilityMultipliers[suggestedVisibility] || 0.85;

  const visibilityFactor = suggestedMult / currentMult;
  return visibilityFactor - 1;
}

/**
 * 환경 요인 종합 효과 계산
 */
export function calculateEnvironmentEffect(
  input: RevenuePredictionInput
): number {
  const { environment } = input.context;

  // 환경 요인 종합 (모든 승수 곱)
  const combinedEnvMultiplier =
    environment.weatherMultiplier *
    environment.eventMultiplier *
    environment.temporalMultiplier;

  // 기준(1.0)에서의 변화율
  return combinedEnvMultiplier - 1;
}

/**
 * 카테고리-존 친화도 보정 계산
 */
export function calculateCategoryBonus(
  category: string,
  currentZoneType: string,
  suggestedZoneType: string,
  config: RevenuePredictorConfig = DEFAULT_REVENUE_CONFIG
): number {
  // 카테고리 정규화 (소문자, 공백 제거)
  const normalizedCategory = category.toLowerCase().replace(/\s+/g, '_');

  // 카테고리 친화도 맵 가져오기
  const affinityMap = config.categoryZoneAffinity[normalizedCategory];

  if (!affinityMap) {
    // 알 수 없는 카테고리는 기본 존 승수만 사용
    return 0;
  }

  const currentAffinity = affinityMap[currentZoneType] || 1.0;
  const suggestedAffinity = affinityMap[suggestedZoneType] || 1.0;

  // 친화도 변화율
  const affinityFactor = suggestedAffinity / currentAffinity;
  return affinityFactor - 1;
}

// ============================================================================
// Risk Assessment
// ============================================================================

/**
 * 리스크 평가
 */
export function assessRisk(
  input: RevenuePredictionInput,
  predictedChange: number,
  breakdown: PredictionBreakdown
): RiskAssessment {
  const factors: string[] = [];
  const mitigations: string[] = [];
  let riskScore = 0;

  // 1. 큰 변화 리스크 (예측 불확실성)
  if (Math.abs(predictedChange) > 0.30) {
    factors.push('예상 변화폭이 큼 (>30%) - 예측 불확실성 증가');
    mitigations.push('단계적 적용 및 A/B 테스트 권장');
    riskScore += 2;
  } else if (Math.abs(predictedChange) > 0.20) {
    factors.push('예상 변화폭이 상당함 (>20%)');
    mitigations.push('모니터링 강화 권장');
    riskScore += 1;
  }

  // 2. 골든존 이탈 리스크
  if (input.currentPlacement.slotHeight === 'eye' &&
      input.suggestedPlacement.slotHeight !== 'eye') {
    factors.push('골든존(눈높이)에서 이탈');
    mitigations.push('이탈 사유의 타당성 재검토 필요');
    riskScore += 2;
  }

  // 3. 저트래픽 존으로 이동 리스크
  const trafficRatio = input.context.currentZoneTraffic > 0
    ? input.context.suggestedZoneTraffic / input.context.currentZoneTraffic
    : 1.0;

  if (trafficRatio < 0.5) {
    factors.push('트래픽이 50% 이상 감소하는 존으로 이동');
    mitigations.push('고객 유도 전략 병행 필요');
    riskScore += 2;
  } else if (trafficRatio < 0.7) {
    factors.push('트래픽이 30% 이상 감소하는 존으로 이동');
    mitigations.push('가시성 향상 조치 고려');
    riskScore += 1;
  }

  // 4. 가시성 저하 리스크
  if (breakdown.visibilityEffect < -0.15) {
    factors.push('가시성이 크게 감소');
    mitigations.push('포컬 포인트 또는 동선 최적화 고려');
    riskScore += 1;
  }

  // 5. 카테고리-존 부적합 리스크
  if (breakdown.categoryBonus < -0.10) {
    factors.push('카테고리와 존 타입의 친화도 낮음');
    mitigations.push('해당 존에 적합한 상품으로 대체 고려');
    riskScore += 1;
  }

  // 6. 환경 역풍 리스크
  if (breakdown.environmentEffect < -0.10) {
    factors.push('현재 환경 조건에서 불리');
    mitigations.push('환경 조건 개선 시 재평가');
    riskScore += 1;
  }

  // 7. 음의 예측 결과 리스크
  if (predictedChange < -0.05) {
    factors.push('예상 매출 감소 (-5% 이상)');
    mitigations.push('변경 재검토 또는 대안 모색 권장');
    riskScore += 2;
  }

  // 리스크 레벨 결정
  let level: RiskLevel;
  if (riskScore >= 4) {
    level = 'high';
  } else if (riskScore >= 2) {
    level = 'medium';
  } else {
    level = 'low';
  }

  // 기본 완화책 추가
  if (factors.length === 0) {
    factors.push('특별한 리스크 요인 없음');
  }
  if (mitigations.length === 0) {
    mitigations.push('표준 모니터링 적용');
  }

  return { level, factors, mitigations };
}

// ============================================================================
// Recommendation Generation
// ============================================================================

/**
 * 추천 결정 생성
 */
export function generateRecommendation(
  predictedChange: number,
  risk: RiskAssessment,
  confidence: number
): Recommendation {
  // 진행 여부 결정
  const proceed = predictedChange > 0.05 && risk.level !== 'high';

  // 우선순위 결정
  let priority: Priority;
  let reason: string;

  if (predictedChange >= 0.25 && confidence >= 0.7 && risk.level === 'low') {
    priority = 'critical';
    reason = `매출 ${Math.round(predictedChange * 100)}% 증가 예상, 높은 신뢰도(${Math.round(confidence * 100)}%), 낮은 리스크 - 즉시 적용 권장`;
  } else if (predictedChange >= 0.15 && confidence >= 0.6 && risk.level !== 'high') {
    priority = 'high';
    reason = `매출 ${Math.round(predictedChange * 100)}% 증가 예상, 양호한 신뢰도 - 우선 적용 권장`;
  } else if (predictedChange >= 0.05 && confidence >= 0.5) {
    priority = 'medium';
    reason = `매출 ${Math.round(predictedChange * 100)}% 증가 예상 - 순차 적용 고려`;
  } else if (predictedChange > 0) {
    priority = 'low';
    reason = `소폭 개선 예상(${Math.round(predictedChange * 100)}%) - 여유 시 적용`;
  } else if (predictedChange > -0.05) {
    priority = 'low';
    reason = '변화 미미 - 다른 요인 고려하여 결정';
  } else {
    priority = 'low';
    reason = `매출 감소 예상(${Math.round(predictedChange * 100)}%) - 변경 보류 권장`;
  }

  // 리스크 높으면 추가 경고
  if (risk.level === 'high' && proceed) {
    reason += ' (단, 높은 리스크로 인해 신중한 검토 필요)';
  }

  return { proceed, priority, reason };
}

// ============================================================================
// Confidence Calculation
// ============================================================================

/**
 * 신뢰도 및 신뢰구간 계산
 */
export function calculateConfidence(
  input: RevenuePredictionInput,
  predictedChange: number
): { confidence: number; interval: { lower: number; upper: number } } {
  // 기본 신뢰도 시작
  let confidence = 0.80;

  // 데이터 품질 기반 조정
  // - 과거 판매 데이터 존재 여부
  if (input.product.avgDailySales > 0) {
    confidence += 0.05;
  } else {
    confidence -= 0.10;
  }

  // - 과거 전환율 데이터 존재
  if (input.product.historicalConversion > 0) {
    confidence += 0.05;
  } else {
    confidence -= 0.05;
  }

  // 트래픽 데이터 신뢰성
  if (input.context.currentZoneTraffic > 100) {
    confidence += 0.03;
  } else if (input.context.currentZoneTraffic < 20) {
    confidence -= 0.08;
  }

  // 변화폭에 따른 불확실성
  if (Math.abs(predictedChange) > 0.30) {
    confidence -= 0.12;
  } else if (Math.abs(predictedChange) > 0.20) {
    confidence -= 0.07;
  }

  // 환경 변동성
  const envVariance = Math.abs(input.context.environment.weatherMultiplier - 1) +
                      Math.abs(input.context.environment.eventMultiplier - 1) +
                      Math.abs(input.context.environment.temporalMultiplier - 1);
  if (envVariance > 0.3) {
    confidence -= 0.05;
  }

  // 신뢰도 범위 제한 (0.3 ~ 0.95)
  confidence = Math.max(0.3, Math.min(0.95, confidence));

  // 신뢰구간 계산
  // 기본 ±5%, 추가 불확실성 반영
  let baseUncertainty = 0.05;

  // 데이터 부족 시 ±3% 추가
  if (input.product.avgDailySales === 0 || input.context.currentZoneTraffic < 20) {
    baseUncertainty += 0.03;
  }

  // 큰 변화 시 ±5% 추가
  if (Math.abs(predictedChange) > 0.20) {
    baseUncertainty += 0.05;
  }

  // 환경 변동성 ±3% 추가
  if (envVariance > 0.3) {
    baseUncertainty += 0.03;
  }

  // 95% 신뢰구간 (약 2 표준편차)
  const interval = {
    lower: predictedChange - (baseUncertainty * 2),
    upper: predictedChange + (baseUncertainty * 2),
  };

  return { confidence, interval };
}

// ============================================================================
// Main Prediction Function
// ============================================================================

/**
 * 매출 예측 메인 함수
 */
export function predictRevenue(
  input: RevenuePredictionInput,
  config: RevenuePredictorConfig = DEFAULT_REVENUE_CONFIG
): RevenuePredictionOutput {
  // 1. 각 효과 계산
  const zoneTrafficEffect = calculateZoneTrafficEffect(input, config);
  const slotHeightEffect = calculateSlotHeightEffect(
    input.currentPlacement.slotHeight,
    input.suggestedPlacement.slotHeight,
    config
  );
  const visibilityEffect = calculateVisibilityEffect(
    input.currentPlacement.visibility,
    input.suggestedPlacement.visibility,
    config
  );
  const environmentEffect = calculateEnvironmentEffect(input);
  const categoryBonus = calculateCategoryBonus(
    input.product.category,
    input.currentPlacement.zoneType,
    input.suggestedPlacement.zoneType,
    config
  );

  // 2. 가중 합계로 총 변화율 계산
  const { weights } = config;
  const predictedRevenueChange =
    (zoneTrafficEffect * weights.zoneTraffic) +
    (slotHeightEffect * weights.slotHeight) +
    (visibilityEffect * weights.visibility) +
    (environmentEffect * weights.environment) +
    (categoryBonus * weights.categoryBonus);

  // 3. 실제 금액 계산
  const dailyRevenueBefore = input.product.avgDailySales * input.product.price;
  const dailyRevenueAfter = dailyRevenueBefore * (1 + predictedRevenueChange);
  const difference = dailyRevenueAfter - dailyRevenueBefore;

  // 4. 효과 상세
  const breakdown: PredictionBreakdown = {
    zoneTrafficEffect,
    slotHeightEffect,
    visibilityEffect,
    environmentEffect,
    categoryBonus,
  };

  // 5. 신뢰도 및 신뢰구간
  const { confidence, interval } = calculateConfidence(input, predictedRevenueChange);

  // 6. 리스크 평가
  const risk = assessRisk(input, predictedRevenueChange, breakdown);

  // 7. 추천 생성
  const recommendation = generateRecommendation(predictedRevenueChange, risk, confidence);

  return {
    predictedRevenueChange,
    predictedDailyRevenue: {
      before: Math.round(dailyRevenueBefore),
      after: Math.round(dailyRevenueAfter),
      difference: Math.round(difference),
    },
    confidenceInterval: {
      lower: Math.round(interval.lower * 100) / 100,
      upper: Math.round(interval.upper * 100) / 100,
    },
    confidence: Math.round(confidence * 100) / 100,
    breakdown,
    risk,
    recommendation,
  };
}

/**
 * 여러 변경사항 일괄 예측
 */
export function predictBatchRevenue(
  inputs: RevenuePredictionInput[],
  config: RevenuePredictorConfig = DEFAULT_REVENUE_CONFIG
): RevenuePredictionOutput[] {
  return inputs.map(input => predictRevenue(input, config));
}

/**
 * 예측 결과 요약 생성
 */
export function summarizePredictions(
  predictions: RevenuePredictionOutput[]
): PredictionSummary {
  if (predictions.length === 0) {
    return {
      totalExpectedRevenueChange: 0,
      totalDailyRevenueIncrease: 0,
      highConfidenceChanges: 0,
      mediumConfidenceChanges: 0,
      lowConfidenceChanges: 0,
      overallConfidence: 0,
      topPriorityChanges: 0,
    };
  }

  // 총 매출 변화 계산 (가중 평균)
  const totalRevenueBefore = predictions.reduce(
    (sum, p) => sum + p.predictedDailyRevenue.before, 0
  );
  const totalRevenueAfter = predictions.reduce(
    (sum, p) => sum + p.predictedDailyRevenue.after, 0
  );
  const totalDailyRevenueIncrease = totalRevenueAfter - totalRevenueBefore;
  const totalExpectedRevenueChange = totalRevenueBefore > 0
    ? (totalRevenueAfter - totalRevenueBefore) / totalRevenueBefore
    : 0;

  // 신뢰도별 분류
  const highConfidenceChanges = predictions.filter(p => p.confidence >= 0.75).length;
  const mediumConfidenceChanges = predictions.filter(
    p => p.confidence >= 0.5 && p.confidence < 0.75
  ).length;
  const lowConfidenceChanges = predictions.filter(p => p.confidence < 0.5).length;

  // 전체 신뢰도 (가중 평균)
  const overallConfidence = predictions.reduce((sum, p) =>
    sum + p.confidence * Math.abs(p.predictedDailyRevenue.difference), 0
  ) / predictions.reduce((sum, p) =>
    sum + Math.abs(p.predictedDailyRevenue.difference), 0
  ) || 0;

  // 최우선 변경 수 (critical + high)
  const topPriorityChanges = predictions.filter(
    p => p.recommendation.priority === 'critical' || p.recommendation.priority === 'high'
  ).length;

  return {
    totalExpectedRevenueChange: Math.round(totalExpectedRevenueChange * 100) / 100,
    totalDailyRevenueIncrease: Math.round(totalDailyRevenueIncrease),
    highConfidenceChanges,
    mediumConfidenceChanges,
    lowConfidenceChanges,
    overallConfidence: Math.round(overallConfidence * 100) / 100,
    topPriorityChanges,
  };
}

// ============================================================================
// Utility Functions for Integration
// ============================================================================

/**
 * 상품 변경 데이터에서 예측 입력 생성
 */
export function createPredictionInput(
  productChange: any,
  productInfo: any,
  zoneMetrics: Record<string, any>,
  environmentMultipliers: { weather: number; event: number; temporal: number }
): RevenuePredictionInput | null {
  try {
    // 현재 및 제안 존 메트릭 조회
    const currentZone = zoneMetrics[productChange.current?.zone_id] || {};
    const suggestedZone = zoneMetrics[productChange.suggested?.zone_id] || {};

    // 슬롯 높이 추정 (position.y 기반)
    const estimateSlotHeight = (y: number): SlotHeight => {
      if (y < 0.3) return 'floor';
      if (y < 0.8) return 'low';
      if (y < 1.5) return 'eye';
      if (y < 2.0) return 'high';
      return 'top';
    };

    // 가시성 추정 (존 타입 및 위치 기반)
    const estimateVisibility = (zoneType: string, slotHeight: SlotHeight): VisibilityLevel => {
      if (slotHeight === 'eye') {
        if (zoneType === 'entrance' || zoneType === 'main_hall') return 'focal_point';
        return 'high';
      }
      if (slotHeight === 'low' || slotHeight === 'high') return 'medium';
      return 'low';
    };

    const currentHeight = estimateSlotHeight(productChange.current?.position?.y || 1.0);
    const suggestedHeight = estimateSlotHeight(productChange.suggested?.position?.y || 1.0);

    const currentZoneType = productChange.current?.zone_type || 'main_hall';
    const suggestedZoneType = productChange.suggested?.zone_type || 'main_hall';

    return {
      product: {
        id: productChange.product_id || '',
        sku: productChange.sku || '',
        name: productInfo?.product_name || productChange.sku || 'Unknown',
        category: productInfo?.category || 'general',
        price: productInfo?.price || 50000,
        margin: productInfo?.margin || 0.3,
        avgDailySales: productInfo?.avg_daily_sales || 2,
        historicalConversion: productInfo?.conversion_rate || 0.05,
      },
      currentPlacement: {
        zoneId: productChange.current?.zone_id || '',
        zoneCode: productChange.current?.zone_code || '',
        zoneType: currentZoneType,
        slotHeight: currentHeight,
        furnitureType: productChange.current?.furniture_type || 'shelf',
        visibility: estimateVisibility(currentZoneType, currentHeight),
      },
      suggestedPlacement: {
        zoneId: productChange.suggested?.zone_id || '',
        zoneCode: productChange.suggested?.zone_code || '',
        zoneType: suggestedZoneType,
        slotHeight: suggestedHeight,
        furnitureType: productChange.suggested?.furniture_type || 'shelf',
        visibility: estimateVisibility(suggestedZoneType, suggestedHeight),
      },
      context: {
        currentZoneTraffic: currentZone.visitors || 100,
        suggestedZoneTraffic: suggestedZone.visitors || 100,
        currentZoneConversion: currentZone.conversions
          ? currentZone.conversions / (currentZone.visitors || 1)
          : 0.05,
        suggestedZoneConversion: suggestedZone.conversions
          ? suggestedZone.conversions / (suggestedZone.visitors || 1)
          : 0.05,
        environment: {
          weatherMultiplier: environmentMultipliers.weather,
          eventMultiplier: environmentMultipliers.event,
          temporalMultiplier: environmentMultipliers.temporal,
        },
      },
    };
  } catch (error) {
    console.error('[createPredictionInput] Error:', error);
    return null;
  }
}

/**
 * 예측 결과를 간단한 형식으로 변환 (API 응답용)
 */
export function formatPredictionForResponse(prediction: RevenuePredictionOutput) {
  return {
    revenue_change: Math.round(prediction.predictedRevenueChange * 100) / 100,
    daily_revenue_before: prediction.predictedDailyRevenue.before,
    daily_revenue_after: prediction.predictedDailyRevenue.after,
    daily_revenue_difference: prediction.predictedDailyRevenue.difference,
    confidence: prediction.confidence,
    confidence_interval: prediction.confidenceInterval,
    risk_level: prediction.risk.level,
    risk_factors: prediction.risk.factors,
    priority: prediction.recommendation.priority,
    proceed: prediction.recommendation.proceed,
    reason: prediction.recommendation.reason,
    breakdown: {
      zone_traffic: Math.round(prediction.breakdown.zoneTrafficEffect * 100) / 100,
      slot_height: Math.round(prediction.breakdown.slotHeightEffect * 100) / 100,
      visibility: Math.round(prediction.breakdown.visibilityEffect * 100) / 100,
      environment: Math.round(prediction.breakdown.environmentEffect * 100) / 100,
      category_bonus: Math.round(prediction.breakdown.categoryBonus * 100) / 100,
    },
  };
}
