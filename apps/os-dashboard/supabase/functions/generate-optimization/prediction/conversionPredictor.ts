/**
 * conversionPredictor.ts - Phase 2.2: Conversion Rate Prediction Model
 *
 * NEURALTWIN AI 최적화 Ultimate 명세서 v2.0
 * 상품 배치 변경이 전환율(방문→구매)에 미치는 영향을 예측
 *
 * 매출 예측 vs 전환율 예측:
 * - 매출 예측 (Phase 2.1): 트래픽 × 가격 × 수량 중심
 * - 전환율 예측 (Phase 2.2): 고객 심리 × 구매 여정 × 상품 특성 중심
 */

// ============================================================================
// Type Definitions
// ============================================================================

export type SlotHeight = 'floor' | 'low' | 'eye' | 'high' | 'top';
export type VisibilityLevel = 'low' | 'medium' | 'high' | 'focal_point';
export type PathPosition = 'off_path' | 'side_path' | 'main_path' | 'intersection' | 'decision_point';
export type PricePoint = 'budget' | 'mid' | 'premium' | 'luxury';
export type StockLevel = 'low' | 'medium' | 'high';
export type BenchmarkComparison = 'above' | 'at' | 'below';

/**
 * 상품 정보
 */
export interface ConversionProductInfo {
  id: string;
  sku: string;
  name: string;
  category: string;
  pricePoint: PricePoint;
  isOnSale: boolean;
  isNewArrival: boolean;
  stockLevel: StockLevel;
  historicalConversion: number;
}

/**
 * 배치 정보
 */
export interface ConversionPlacementInfo {
  zoneType: string;
  slotHeight: SlotHeight;
  visibility: VisibilityLevel;
  pathPosition: PathPosition;
  nearCompetitors: number;
  adjacentCategories: string[];
}

/**
 * 컨텍스트 정보
 */
export interface ConversionContext {
  zoneAvgConversion: number;
  categoryAvgConversion: number;
  storeAvgConversion: number;
  peakHour: boolean;
  environment: {
    weatherMultiplier: number;
    eventMultiplier: number;
  };
}

/**
 * 전환율 예측 입력
 */
export interface ConversionPredictionInput {
  product: ConversionProductInfo;
  currentPlacement: ConversionPlacementInfo;
  suggestedPlacement: ConversionPlacementInfo;
  context: ConversionContext;
}

/**
 * 효과 상세
 */
export interface ConversionBreakdown {
  visibilityEffect: number;
  pathPositionEffect: number;
  heightEffect: number;
  competitionEffect: number;
  adjacencyEffect: number;
  promotionEffect: number;
  pricePointEffect: number;
}

/**
 * 인사이트
 */
export interface ConversionInsights {
  strengths: string[];
  weaknesses: string[];
  opportunities: string[];
}

/**
 * 벤치마크 비교
 */
export interface BenchmarkResult {
  vsCategory: BenchmarkComparison;
  vsStore: BenchmarkComparison;
  percentile: number;
}

/**
 * 전환율 예측 출력
 */
export interface ConversionPredictionOutput {
  predictedConversionChange: number;
  predictedConversionRate: {
    before: number;
    after: number;
    benchmark: number;
  };
  confidence: number;
  breakdown: ConversionBreakdown;
  insights: ConversionInsights;
  benchmarkComparison: BenchmarkResult;
}

/**
 * 전환율 예측기 설정
 */
export interface ConversionPredictorConfig {
  baseConversionByCategory: Record<string, number>;
  visibilityMultipliers: Record<VisibilityLevel, number>;
  pathPositionMultipliers: Record<PathPosition, number>;
  slotHeightConversionMultipliers: Record<SlotHeight, number>;
  pricePointMultipliers: Record<PricePoint, number>;
  competitionPenalty: number;
  promotionBoosts: {
    onSale: number;
    newArrival: number;
    lowStock: number;
  };
  adjacencySynergy: Record<string, Record<string, number>>;
}

/**
 * 전환율 예측 요약
 */
export interface ConversionPredictionSummary {
  avgConversionChange: number;
  changesAboveBenchmark: number;
  changesAtBenchmark: number;
  changesBelowBenchmark: number;
  highConfidenceCount: number;
  avgConfidence: number;
}

// ============================================================================
// Default Configuration
// ============================================================================

export const DEFAULT_CONVERSION_CONFIG: ConversionPredictorConfig = {
  baseConversionByCategory: {
    accessory: 0.08,      // 충동구매 용이
    accessory_zone: 0.08,
    bags: 0.06,
    tops: 0.05,
    bottoms: 0.04,
    outerwear: 0.035,     // 고관여 상품
    shoes: 0.03,
    jewelry: 0.025,
    cosmetics: 0.07,
    sale_items: 0.09,     // 세일 상품 높은 전환
    premium: 0.025,
    luxury: 0.02,
    general: 0.05,
  },

  visibilityMultipliers: {
    low: 0.60,
    medium: 0.85,
    high: 1.00,
    focal_point: 1.35,
  },

  pathPositionMultipliers: {
    off_path: 0.50,       // 동선 이탈
    side_path: 0.80,      // 보조 동선
    main_path: 1.00,      // 메인 동선
    intersection: 1.25,   // 교차점 (시선 집중)
    decision_point: 1.40, // 의사결정 지점 (피팅룸 앞 등)
  },

  slotHeightConversionMultipliers: {
    floor: 0.55,
    low: 0.80,
    eye: 1.00,            // 골든존
    high: 0.70,
    top: 0.45,
  },

  pricePointMultipliers: {
    budget: 1.20,         // 저가 = 전환 용이
    mid: 1.00,
    premium: 0.80,
    luxury: 0.60,         // 고가 = 전환 어려움
  },

  competitionPenalty: 0.05,  // 경쟁상품 1개당 -5%

  promotionBoosts: {
    onSale: 1.30,         // 세일 시 +30%
    newArrival: 1.15,     // 신상품 +15%
    lowStock: 1.10,       // 품절 임박 +10%
  },

  adjacencySynergy: {
    outerwear: {
      accessory: 1.15,
      bags: 1.10,
      tops: 1.05,
    },
    tops: {
      bottoms: 1.20,
      accessory: 1.10,
      bags: 1.05,
    },
    bottoms: {
      tops: 1.20,
      shoes: 1.10,
      accessory: 1.05,
    },
    bags: {
      accessory: 1.15,
      outerwear: 1.10,
      shoes: 1.05,
    },
    shoes: {
      bags: 1.10,
      bottoms: 1.05,
      accessory: 1.05,
    },
    accessory: {
      outerwear: 1.15,
      tops: 1.10,
      bags: 1.15,
      jewelry: 1.10,
    },
    jewelry: {
      accessory: 1.15,
      bags: 1.10,
      cosmetics: 1.10,
    },
    cosmetics: {
      accessory: 1.10,
      jewelry: 1.10,
    },
  },
};

// ============================================================================
// Effect Calculation Functions
// ============================================================================

/**
 * 가시성 변화 효과 계산
 */
export function calculateVisibilityEffect(
  currentVisibility: VisibilityLevel,
  suggestedVisibility: VisibilityLevel,
  config: ConversionPredictorConfig = DEFAULT_CONVERSION_CONFIG
): number {
  const currentMult = config.visibilityMultipliers[currentVisibility] || 0.85;
  const suggestedMult = config.visibilityMultipliers[suggestedVisibility] || 0.85;

  return (suggestedMult / currentMult) - 1;
}

/**
 * 동선 위치 변화 효과 계산
 */
export function calculatePathPositionEffect(
  currentPosition: PathPosition,
  suggestedPosition: PathPosition,
  config: ConversionPredictorConfig = DEFAULT_CONVERSION_CONFIG
): number {
  const currentMult = config.pathPositionMultipliers[currentPosition] || 1.0;
  const suggestedMult = config.pathPositionMultipliers[suggestedPosition] || 1.0;

  return (suggestedMult / currentMult) - 1;
}

/**
 * 높이 변화 효과 계산 (전환 관점)
 */
export function calculateHeightEffect(
  currentHeight: SlotHeight,
  suggestedHeight: SlotHeight,
  config: ConversionPredictorConfig = DEFAULT_CONVERSION_CONFIG
): number {
  const currentMult = config.slotHeightConversionMultipliers[currentHeight] || 0.85;
  const suggestedMult = config.slotHeightConversionMultipliers[suggestedHeight] || 0.85;

  return (suggestedMult / currentMult) - 1;
}

/**
 * 경쟁 상품 효과 계산
 */
export function calculateCompetitionEffect(
  currentCompetitors: number,
  suggestedCompetitors: number,
  config: ConversionPredictorConfig = DEFAULT_CONVERSION_CONFIG
): number {
  // 경쟁상품 수 변화에 따른 효과
  const currentPenalty = 1 - (currentCompetitors * config.competitionPenalty);
  const suggestedPenalty = 1 - (suggestedCompetitors * config.competitionPenalty);

  // 최소 0.5 (50%)로 제한
  const currentFactor = Math.max(0.5, currentPenalty);
  const suggestedFactor = Math.max(0.5, suggestedPenalty);

  return (suggestedFactor / currentFactor) - 1;
}

/**
 * 인접 상품 시너지 효과 계산
 */
export function calculateAdjacencyEffect(
  category: string,
  currentAdjacent: string[],
  suggestedAdjacent: string[],
  config: ConversionPredictorConfig = DEFAULT_CONVERSION_CONFIG
): number {
  const normalizedCategory = category.toLowerCase().replace(/\s+/g, '_');
  const synergies = config.adjacencySynergy[normalizedCategory] || {};

  // 현재 인접 시너지 계산
  let currentSynergy = 1.0;
  for (const adj of currentAdjacent) {
    const normalizedAdj = adj.toLowerCase().replace(/\s+/g, '_');
    if (synergies[normalizedAdj]) {
      currentSynergy *= synergies[normalizedAdj];
    }
  }

  // 제안 인접 시너지 계산
  let suggestedSynergy = 1.0;
  for (const adj of suggestedAdjacent) {
    const normalizedAdj = adj.toLowerCase().replace(/\s+/g, '_');
    if (synergies[normalizedAdj]) {
      suggestedSynergy *= synergies[normalizedAdj];
    }
  }

  return (suggestedSynergy / currentSynergy) - 1;
}

/**
 * 프로모션 효과 계산
 */
export function calculatePromotionEffect(
  product: ConversionProductInfo,
  config: ConversionPredictorConfig = DEFAULT_CONVERSION_CONFIG
): number {
  let promotionMultiplier = 1.0;

  if (product.isOnSale) {
    promotionMultiplier *= config.promotionBoosts.onSale;
  }
  if (product.isNewArrival) {
    promotionMultiplier *= config.promotionBoosts.newArrival;
  }
  if (product.stockLevel === 'low') {
    promotionMultiplier *= config.promotionBoosts.lowStock;
  }

  // 프로모션 효과는 기준(1.0)에서의 변화
  return promotionMultiplier - 1;
}

/**
 * 가격대 효과 계산
 */
export function calculatePricePointEffect(
  pricePoint: PricePoint,
  currentZoneType: string,
  suggestedZoneType: string,
  config: ConversionPredictorConfig = DEFAULT_CONVERSION_CONFIG
): number {
  const priceMultiplier = config.pricePointMultipliers[pricePoint] || 1.0;

  // 존 타입과 가격대 적합성
  const zoneAffinities: Record<string, Record<PricePoint, number>> = {
    entrance: { budget: 1.1, mid: 1.0, premium: 0.9, luxury: 0.85 },
    main_hall: { budget: 1.0, mid: 1.0, premium: 1.0, luxury: 0.95 },
    premium_zone: { budget: 0.8, mid: 0.9, premium: 1.15, luxury: 1.2 },
    sale_zone: { budget: 1.2, mid: 1.1, premium: 0.9, luxury: 0.7 },
    checkout: { budget: 1.15, mid: 1.0, premium: 0.85, luxury: 0.7 },
  };

  const currentAffinity = zoneAffinities[currentZoneType]?.[pricePoint] || 1.0;
  const suggestedAffinity = zoneAffinities[suggestedZoneType]?.[pricePoint] || 1.0;

  // 가격대 기본 효과 + 존 적합성 변화
  return ((suggestedAffinity * priceMultiplier) / (currentAffinity * priceMultiplier)) - 1;
}

// ============================================================================
// Insights and Benchmark Functions
// ============================================================================

/**
 * 인사이트 생성
 */
export function generateInsights(
  input: ConversionPredictionInput,
  breakdown: ConversionBreakdown
): ConversionInsights {
  const strengths: string[] = [];
  const weaknesses: string[] = [];
  const opportunities: string[] = [];

  // 가시성 분석
  if (breakdown.visibilityEffect > 0.15) {
    strengths.push(`가시성 ${Math.round(breakdown.visibilityEffect * 100)}% 향상으로 노출 증가`);
  } else if (breakdown.visibilityEffect < -0.10) {
    weaknesses.push(`가시성 ${Math.round(Math.abs(breakdown.visibilityEffect) * 100)}% 감소`);
    opportunities.push('포컬 포인트 또는 동선 교차점 배치 검토');
  }

  // 동선 위치 분석
  if (breakdown.pathPositionEffect > 0.15) {
    strengths.push(`동선 위치 개선 (${input.suggestedPlacement.pathPosition})`);
  } else if (breakdown.pathPositionEffect < -0.10) {
    weaknesses.push(`동선 이탈 우려 (${input.suggestedPlacement.pathPosition})`);
  }

  // 골든존 분석
  const eyeLevelHeights = ['high', 'top'];
  const isEyeLevel = (height: string) => eyeLevelHeights.includes(height);
  if (isEyeLevel(input.suggestedPlacement.slotHeight)) {
    strengths.push('골든존(눈높이) 배치로 구매 접근성 최적');
  } else if (isEyeLevel(input.currentPlacement.slotHeight) &&
             !isEyeLevel(input.suggestedPlacement.slotHeight)) {
    weaknesses.push('골든존 이탈로 가시성 감소 예상');
  }

  // 경쟁 상품 분석
  if (breakdown.competitionEffect > 0.05) {
    strengths.push(`경쟁 상품 감소로 선택 집중도 향상`);
  } else if (breakdown.competitionEffect < -0.10) {
    weaknesses.push(`인접 경쟁상품 ${input.suggestedPlacement.nearCompetitors}개로 주목도 분산`);
    opportunities.push('경쟁상품 적은 구역 검토');
  }

  // 인접 시너지 분석
  if (breakdown.adjacencyEffect > 0.10) {
    const synergyCategories = input.suggestedPlacement.adjacentCategories.join(', ');
    strengths.push(`연관 카테고리(${synergyCategories}) 인접 배치로 크로스셀 시너지`);
  }
  if (breakdown.adjacencyEffect < 0 && input.suggestedPlacement.adjacentCategories.length === 0) {
    opportunities.push(`연관 카테고리 인접 배치 시 추가 ${Math.round(0.15 * 100)}% 향상 가능`);
  }

  // 프로모션 분석
  if (breakdown.promotionEffect > 0) {
    if (input.product.isOnSale) {
      strengths.push('세일 프로모션으로 전환 유도 강화');
    }
    if (input.product.isNewArrival) {
      strengths.push('신상품 효과로 관심도 상승');
    }
    if (input.product.stockLevel === 'low') {
      strengths.push('희소성 효과로 구매 긴급성 유발');
    }
  }

  // 가격대 분석
  if (breakdown.pricePointEffect < -0.10) {
    weaknesses.push(`${input.product.pricePoint} 가격대 상품의 존 부적합 가능성`);
    if (input.product.pricePoint === 'luxury' || input.product.pricePoint === 'premium') {
      opportunities.push('프리미엄 존으로 이동 시 전환율 개선 가능');
    }
  }

  // 기본 인사이트
  if (strengths.length === 0) {
    strengths.push('기존 배치 수준 유지');
  }
  if (weaknesses.length === 0) {
    weaknesses.push('주요 저해 요인 없음');
  }
  if (opportunities.length === 0) {
    opportunities.push('현재 최적화된 상태');
  }

  return { strengths, weaknesses, opportunities };
}

/**
 * 벤치마크 비교
 */
export function compareToBenchmark(
  predictedRate: number,
  categoryAvgConversion: number,
  storeAvgConversion: number
): BenchmarkResult {
  // 카테고리 대비 비교
  let vsCategory: BenchmarkComparison;
  const categoryDiff = (predictedRate - categoryAvgConversion) / categoryAvgConversion;
  if (categoryDiff > 0.05) {
    vsCategory = 'above';
  } else if (categoryDiff < -0.05) {
    vsCategory = 'below';
  } else {
    vsCategory = 'at';
  }

  // 매장 평균 대비 비교
  let vsStore: BenchmarkComparison;
  const storeDiff = (predictedRate - storeAvgConversion) / storeAvgConversion;
  if (storeDiff > 0.05) {
    vsStore = 'above';
  } else if (storeDiff < -0.05) {
    vsStore = 'below';
  } else {
    vsStore = 'at';
  }

  // 백분위 계산 (간단한 정규분포 가정)
  // 평균 대비 상대 위치를 백분위로 변환
  const avgBenchmark = (categoryAvgConversion + storeAvgConversion) / 2;
  const relativePosition = (predictedRate - avgBenchmark) / avgBenchmark;

  // -50% ~ +50% 범위를 0 ~ 100 백분위로 매핑
  let percentile = 50 + (relativePosition * 100);
  percentile = Math.max(5, Math.min(95, percentile)); // 5~95 범위로 제한

  return {
    vsCategory,
    vsStore,
    percentile: Math.round(percentile),
  };
}

/**
 * 신뢰도 계산
 */
export function calculateConversionConfidence(
  input: ConversionPredictionInput,
  predictedChange: number
): number {
  let confidence = 0.75;

  // 과거 데이터 존재 여부
  if (input.product.historicalConversion > 0) {
    confidence += 0.08;
  } else {
    confidence -= 0.10;
  }

  // 컨텍스트 데이터 품질
  if (input.context.categoryAvgConversion > 0) {
    confidence += 0.05;
  }
  if (input.context.zoneAvgConversion > 0) {
    confidence += 0.03;
  }

  // 변화폭에 따른 불확실성
  if (Math.abs(predictedChange) > 0.30) {
    confidence -= 0.12;
  } else if (Math.abs(predictedChange) > 0.20) {
    confidence -= 0.06;
  }

  // 경쟁상품 데이터 신뢰성
  if (input.currentPlacement.nearCompetitors > 5) {
    confidence -= 0.05; // 너무 많은 경쟁상품은 예측 어려움
  }

  // 범위 제한
  return Math.max(0.3, Math.min(0.95, confidence));
}

// ============================================================================
// Main Prediction Function
// ============================================================================

/**
 * 전환율 예측 메인 함수
 */
export function predictConversion(
  input: ConversionPredictionInput,
  config: ConversionPredictorConfig = DEFAULT_CONVERSION_CONFIG
): ConversionPredictionOutput {
  // 1. 각 효과 계산
  const visibilityEffect = calculateVisibilityEffect(
    input.currentPlacement.visibility,
    input.suggestedPlacement.visibility,
    config
  );

  const pathPositionEffect = calculatePathPositionEffect(
    input.currentPlacement.pathPosition,
    input.suggestedPlacement.pathPosition,
    config
  );

  const heightEffect = calculateHeightEffect(
    input.currentPlacement.slotHeight,
    input.suggestedPlacement.slotHeight,
    config
  );

  const competitionEffect = calculateCompetitionEffect(
    input.currentPlacement.nearCompetitors,
    input.suggestedPlacement.nearCompetitors,
    config
  );

  const adjacencyEffect = calculateAdjacencyEffect(
    input.product.category,
    input.currentPlacement.adjacentCategories,
    input.suggestedPlacement.adjacentCategories,
    config
  );

  const promotionEffect = calculatePromotionEffect(input.product, config);

  const pricePointEffect = calculatePricePointEffect(
    input.product.pricePoint,
    input.currentPlacement.zoneType,
    input.suggestedPlacement.zoneType,
    config
  );

  // 2. 효과 상세
  const breakdown: ConversionBreakdown = {
    visibilityEffect,
    pathPositionEffect,
    heightEffect,
    competitionEffect,
    adjacencyEffect,
    promotionEffect,
    pricePointEffect,
  };

  // 3. 가중 합계로 총 변화율 계산
  const weights = {
    visibility: 0.25,
    pathPosition: 0.20,
    height: 0.15,
    competition: 0.12,
    adjacency: 0.10,
    promotion: 0.10,
    pricePoint: 0.08,
  };

  const predictedConversionChange =
    (visibilityEffect * weights.visibility) +
    (pathPositionEffect * weights.pathPosition) +
    (heightEffect * weights.height) +
    (competitionEffect * weights.competition) +
    (adjacencyEffect * weights.adjacency) +
    (promotionEffect * weights.promotion) +
    (pricePointEffect * weights.pricePoint);

  // 4. 실제 전환율 계산
  const baseConversion =
    input.product.historicalConversion ||
    config.baseConversionByCategory[input.product.category.toLowerCase()] ||
    0.05;

  const conversionBefore = baseConversion;
  const conversionAfter = baseConversion * (1 + predictedConversionChange);
  const benchmark = input.context.categoryAvgConversion || baseConversion;

  // 5. 신뢰도
  const confidence = calculateConversionConfidence(input, predictedConversionChange);

  // 6. 인사이트
  const insights = generateInsights(input, breakdown);

  // 7. 벤치마크 비교
  const benchmarkComparison = compareToBenchmark(
    conversionAfter,
    input.context.categoryAvgConversion || baseConversion,
    input.context.storeAvgConversion || 0.05
  );

  return {
    predictedConversionChange,
    predictedConversionRate: {
      before: Math.round(conversionBefore * 10000) / 10000,
      after: Math.round(conversionAfter * 10000) / 10000,
      benchmark: Math.round(benchmark * 10000) / 10000,
    },
    confidence: Math.round(confidence * 100) / 100,
    breakdown: {
      visibilityEffect: Math.round(visibilityEffect * 100) / 100,
      pathPositionEffect: Math.round(pathPositionEffect * 100) / 100,
      heightEffect: Math.round(heightEffect * 100) / 100,
      competitionEffect: Math.round(competitionEffect * 100) / 100,
      adjacencyEffect: Math.round(adjacencyEffect * 100) / 100,
      promotionEffect: Math.round(promotionEffect * 100) / 100,
      pricePointEffect: Math.round(pricePointEffect * 100) / 100,
    },
    insights,
    benchmarkComparison,
  };
}

/**
 * 일괄 예측
 */
export function predictBatchConversion(
  inputs: ConversionPredictionInput[],
  config: ConversionPredictorConfig = DEFAULT_CONVERSION_CONFIG
): ConversionPredictionOutput[] {
  return inputs.map(input => predictConversion(input, config));
}

/**
 * 예측 결과 요약
 */
export function summarizeConversionPredictions(
  predictions: ConversionPredictionOutput[]
): ConversionPredictionSummary {
  if (predictions.length === 0) {
    return {
      avgConversionChange: 0,
      changesAboveBenchmark: 0,
      changesAtBenchmark: 0,
      changesBelowBenchmark: 0,
      highConfidenceCount: 0,
      avgConfidence: 0,
    };
  }

  const totalChange = predictions.reduce((sum, p) => sum + p.predictedConversionChange, 0);
  const avgConversionChange = totalChange / predictions.length;

  const changesAboveBenchmark = predictions.filter(
    p => p.benchmarkComparison.vsCategory === 'above'
  ).length;
  const changesAtBenchmark = predictions.filter(
    p => p.benchmarkComparison.vsCategory === 'at'
  ).length;
  const changesBelowBenchmark = predictions.filter(
    p => p.benchmarkComparison.vsCategory === 'below'
  ).length;

  const highConfidenceCount = predictions.filter(p => p.confidence >= 0.7).length;
  const avgConfidence = predictions.reduce((sum, p) => sum + p.confidence, 0) / predictions.length;

  return {
    avgConversionChange: Math.round(avgConversionChange * 100) / 100,
    changesAboveBenchmark,
    changesAtBenchmark,
    changesBelowBenchmark,
    highConfidenceCount,
    avgConfidence: Math.round(avgConfidence * 100) / 100,
  };
}

// ============================================================================
// Utility Functions for Integration
// ============================================================================

/**
 * 상품 변경 데이터에서 전환율 예측 입력 생성
 */
export function createConversionPredictionInput(
  productChange: any,
  productInfo: any,
  zoneMetrics: Record<string, any>,
  flowData: any | null,
  storeAvgConversion: number
): ConversionPredictionInput | null {
  try {
    // 가격대 추정
    const estimatePricePoint = (price: number): PricePoint => {
      if (price < 30000) return 'budget';
      if (price < 80000) return 'mid';
      if (price < 200000) return 'premium';
      return 'luxury';
    };

    // 동선 위치 추정
    const estimatePathPosition = (zoneType: string): PathPosition => {
      const pathMap: Record<string, PathPosition> = {
        entrance: 'main_path',
        main_hall: 'intersection',
        checkout: 'decision_point',
        fitting_room: 'decision_point',
        fitting_zone: 'decision_point',
        clothing: 'main_path',
        clothing_zone: 'main_path',
        accessory: 'side_path',
        accessory_zone: 'side_path',
        lounge: 'off_path',
        back_zone: 'off_path',
        premium_zone: 'main_path',
      };
      return pathMap[zoneType] || 'main_path';
    };

    // 슬롯 높이 추정
    const estimateSlotHeight = (y: number): SlotHeight => {
      if (y < 0.3) return 'floor';
      if (y < 0.8) return 'low';
      if (y < 1.5) return 'eye';
      if (y < 2.0) return 'high';
      return 'top';
    };

    // 가시성 추정
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

    // 존 메트릭에서 전환율 계산
    const currentZone = zoneMetrics[productChange.current?.zone_id] || {};
    const suggestedZone = zoneMetrics[productChange.suggested?.zone_id] || {};

    const categoryConversion = (productInfo?.category || 'general').toLowerCase();
    const baseConversion = DEFAULT_CONVERSION_CONFIG.baseConversionByCategory[categoryConversion] || 0.05;

    return {
      product: {
        id: productChange.product_id || '',
        sku: productChange.sku || '',
        name: productInfo?.product_name || productChange.sku || 'Unknown',
        category: productInfo?.category || 'general',
        pricePoint: estimatePricePoint(productInfo?.price || 50000),
        isOnSale: productInfo?.is_on_sale || false,
        isNewArrival: productInfo?.is_new_arrival || false,
        stockLevel: productInfo?.stock_level || 'medium',
        historicalConversion: productInfo?.conversion_rate || 0,
      },
      currentPlacement: {
        zoneType: currentZoneType,
        slotHeight: currentHeight,
        visibility: estimateVisibility(currentZoneType, currentHeight),
        pathPosition: estimatePathPosition(currentZoneType),
        nearCompetitors: productChange.current?.near_competitors || 1,
        adjacentCategories: productChange.current?.adjacent_categories || [],
      },
      suggestedPlacement: {
        zoneType: suggestedZoneType,
        slotHeight: suggestedHeight,
        visibility: estimateVisibility(suggestedZoneType, suggestedHeight),
        pathPosition: estimatePathPosition(suggestedZoneType),
        nearCompetitors: productChange.suggested?.near_competitors || 1,
        adjacentCategories: productChange.suggested?.adjacent_categories || [],
      },
      context: {
        zoneAvgConversion: currentZone.conversions
          ? currentZone.conversions / (currentZone.visitors || 1)
          : 0.05,
        categoryAvgConversion: baseConversion,
        storeAvgConversion,
        peakHour: false, // TODO: 시간대 정보에서 결정
        environment: {
          weatherMultiplier: 1.0,
          eventMultiplier: 1.0,
        },
      },
    };
  } catch (error) {
    console.error('[createConversionPredictionInput] Error:', error);
    return null;
  }
}

/**
 * 예측 결과를 간단한 형식으로 변환 (API 응답용)
 */
export function formatConversionPredictionForResponse(
  prediction: ConversionPredictionOutput
) {
  return {
    conversion_change: Math.round(prediction.predictedConversionChange * 100) / 100,
    conversion_before: prediction.predictedConversionRate.before,
    conversion_after: prediction.predictedConversionRate.after,
    benchmark: prediction.predictedConversionRate.benchmark,
    confidence: prediction.confidence,
    vs_benchmark: prediction.benchmarkComparison.vsCategory,
    percentile: prediction.benchmarkComparison.percentile,
    insights: {
      strengths: prediction.insights.strengths,
      weaknesses: prediction.insights.weaknesses,
      opportunities: prediction.insights.opportunities,
    },
    breakdown: prediction.breakdown,
  };
}
