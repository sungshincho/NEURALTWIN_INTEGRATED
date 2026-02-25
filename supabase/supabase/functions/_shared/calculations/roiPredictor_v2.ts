/**
 * roiPredictor_v2.ts
 *
 * 리테일 업계 맞춤형 ROI 예측 계산 모듈 (v2)
 *
 * 핵심 개선사항:
 * - 증분(Incremental) 기반 계산: 현재 위치 vs 제안 위치 비교
 * - 투자 회수 기간 (Payback Period) 명시
 * - 점장 친화적 한글 요약
 * - 보수적 예측 (Conservative Estimate)
 * - 리스크 시나리오 제공
 *
 * Sprint 1 Task: S1-2 Enhancement
 * 작성일: 2026-01-12
 */

// ============================================================================
// 타입 정의
// ============================================================================

/** 위치 정보 */
export interface PositionInfo {
  /** Zone ID */
  zone_id?: string;
  /** Zone 이름 */
  zone_name: string;
  /** 일일 트래픽 */
  daily_traffic: number;
  /** 가시성 (0-1) */
  visibility: number;
  /** 위치 타입 (눈높이, 바닥 등) */
  position_type?: 'eye_level' | 'reach_level' | 'bend_level' | 'floor_level' | 'top_shelf' | 'endcap' | 'checkout_adjacent';
  /** 전환율 보너스 */
  conversion_bonus?: number;
}

/** 리테일 ROI 계산 입력 */
export interface RetailROIInput {
  // 상품 정보
  product_id?: string;
  product_name: string;
  product_price: number;
  product_margin: number;  // 0-1
  base_conversion_rate: number;  // 0-1
  avg_purchase_quantity?: number;

  // 위치 정보
  current_position: PositionInfo;
  proposed_position: PositionInfo;

  // 비용 (선택적)
  implementation_cost?: number;  // 인건비 등 실행 비용

  // 보수적 예측 계수 (기본 0.7)
  conservative_factor?: number;
}

/** 매출 비교 */
interface RevenueComparison {
  current_daily: number;
  proposed_daily: number;
  incremental_daily: number;
  incremental_monthly: number;
  incremental_annual: number;
}

/** 이익 비교 */
interface ProfitComparison {
  current_daily: number;
  proposed_daily: number;
  incremental_daily: number;
  incremental_monthly: number;
  incremental_annual: number;
}

/** ROI 지표 */
interface ROIMetrics {
  payback_period_days: number | null;
  payback_period_text: string;
  monthly_roi_percent: number;
  annual_roi_percent: number;
}

/** 리스크 시나리오 */
interface RiskScenario {
  downside_scenario: {
    monthly_profit: number;
    description: string;
  };
  expected_scenario: {
    monthly_profit: number;
    description: string;
  };
  upside_scenario: {
    monthly_profit: number;
    description: string;
  };
}

/** 점장 요약 */
interface RetailSummary {
  verdict: 'strongly_recommend' | 'recommend' | 'neutral' | 'not_recommend' | 'strongly_not_recommend';
  verdict_kr: string;
  one_liner: string;
  priority_rank: number;  // 1-5, 1이 가장 높음
}

/** 계산 상세 */
interface CalculationDetail {
  current_impressions: number;
  proposed_impressions: number;
  current_conversions: number;
  proposed_conversions: number;
  effective_conversion_current: number;
  effective_conversion_proposed: number;
  growth_factor_raw: number;
  growth_factor_conservative: number;
}

/** 리테일 ROI 계산 출력 */
export interface RetailROIOutput {
  // 점장 요약
  summary: RetailSummary;

  // 매출/이익 비교
  revenue: RevenueComparison;
  profit: ProfitComparison;

  // ROI 지표
  roi: ROIMetrics;

  // 리스크
  risk: RiskScenario;

  // 계산 상세 (디버깅/투명성용)
  calculation_detail: CalculationDetail;

  // 메타데이터
  product_name: string;
  from_zone: string;
  to_zone: string;
  confidence: number;
}

// ============================================================================
// 상수 정의
// ============================================================================

/** 위치별 가시성 승수 */
export const POSITION_VISIBILITY_MULTIPLIER: Record<string, number> = {
  eye_level: 1.4,        // 눈높이 - 가장 좋음
  reach_level: 1.2,      // 손 닿는 높이
  endcap: 1.35,          // 엔드캡
  checkout_adjacent: 1.25, // 계산대 인접
  bend_level: 1.0,       // 허리 높이 (기준)
  floor_level: 0.7,      // 바닥
  top_shelf: 0.6,        // 최상단
};

/** 위치별 전환율 보너스 */
export const POSITION_CONVERSION_BONUS: Record<string, number> = {
  eye_level: 0.02,
  endcap: 0.03,
  checkout_adjacent: 0.04,  // 충동구매 효과
  reach_level: 0.01,
  bend_level: 0,
  floor_level: -0.01,
  top_shelf: -0.015,
};

/** 판정 기준 (월간 증분 이익 기준, 원) */
export const VERDICT_THRESHOLDS = {
  strongly_recommend: 500000,   // 월 50만원 이상
  recommend: 200000,            // 월 20만원 이상
  neutral: 50000,               // 월 5만원 이상
  not_recommend: 0,             // 양수
  strongly_not_recommend: -Infinity,  // 음수
};

// ============================================================================
// 핵심 계산 함수
// ============================================================================

/**
 * 리테일 맞춤형 ROI 계산
 *
 * @param input - 계산 입력
 * @returns RetailROIOutput
 */
export function calculateRetailROI(input: RetailROIInput): RetailROIOutput {
  const conservativeFactor = input.conservative_factor ?? 0.7;
  const avgQuantity = input.avg_purchase_quantity ?? 1;

  // === Step 1: 현재 위치 매출 계산 ===
  const currentVisibilityMult = POSITION_VISIBILITY_MULTIPLIER[input.current_position.position_type || 'bend_level'] || 1.0;
  const currentConversionBonus = POSITION_CONVERSION_BONUS[input.current_position.position_type || 'bend_level'] || 0;

  const currentImpressions = Math.round(
    input.current_position.daily_traffic *
    input.current_position.visibility *
    currentVisibilityMult
  );

  const currentEffectiveConversion = Math.max(0, Math.min(1,
    input.base_conversion_rate + currentConversionBonus + (input.current_position.conversion_bonus || 0)
  ));

  const currentConversions = Math.round(currentImpressions * currentEffectiveConversion);
  const currentDailyRevenue = currentConversions * input.product_price * avgQuantity;
  const currentDailyProfit = currentDailyRevenue * input.product_margin;

  // === Step 2: 제안 위치 매출 계산 ===
  const proposedVisibilityMult = POSITION_VISIBILITY_MULTIPLIER[input.proposed_position.position_type || 'bend_level'] || 1.0;
  const proposedConversionBonus = POSITION_CONVERSION_BONUS[input.proposed_position.position_type || 'bend_level'] || 0;

  const proposedImpressions = Math.round(
    input.proposed_position.daily_traffic *
    input.proposed_position.visibility *
    proposedVisibilityMult
  );

  const proposedEffectiveConversion = Math.max(0, Math.min(1,
    input.base_conversion_rate + proposedConversionBonus + (input.proposed_position.conversion_bonus || 0)
  ));

  const proposedConversions = Math.round(proposedImpressions * proposedEffectiveConversion);
  const proposedDailyRevenue = proposedConversions * input.product_price * avgQuantity;
  const proposedDailyProfit = proposedDailyRevenue * input.product_margin;

  // === Step 3: 성장률 계산 (보수적 조정) ===
  const rawGrowthFactor = currentDailyRevenue > 0
    ? proposedDailyRevenue / currentDailyRevenue
    : (proposedDailyRevenue > 0 ? 10 : 1);  // 현재 매출 0이면 최대 10배로 제한

  // 보수적 조정: 예상 성장의 70%만 반영
  const conservativeGrowthFactor = 1 + (rawGrowthFactor - 1) * conservativeFactor;

  // === Step 4: 보수적 예측 매출/이익 ===
  const conservativeProposedRevenue = currentDailyRevenue * conservativeGrowthFactor;
  const conservativeProposedProfit = conservativeProposedRevenue * input.product_margin;

  const incrementalDailyRevenue = conservativeProposedRevenue - currentDailyRevenue;
  const incrementalDailyProfit = conservativeProposedProfit - currentDailyProfit;
  const incrementalMonthlyProfit = incrementalDailyProfit * 30;
  const incrementalAnnualProfit = incrementalDailyProfit * 365;

  // === Step 5: ROI 지표 계산 ===
  const implementationCost = input.implementation_cost || 0;

  let paybackDays: number | null = null;
  let paybackText = '즉시 효과';

  if (implementationCost > 0 && incrementalDailyProfit > 0) {
    paybackDays = Math.ceil(implementationCost / incrementalDailyProfit);
    paybackText = paybackDays === 1 ? '1일' : `${paybackDays}일`;
  } else if (implementationCost > 0 && incrementalDailyProfit <= 0) {
    paybackText = '회수 불가';
  }

  // 월간 ROI = 증분 이익(월) / 현재 매출(월) * 100
  const monthlyROI = currentDailyRevenue > 0
    ? (incrementalMonthlyProfit / (currentDailyRevenue * 30)) * 100
    : (incrementalMonthlyProfit > 0 ? 999 : 0);

  const annualROI = monthlyROI * 12;

  // === Step 6: 리스크 시나리오 ===
  const risk: RiskScenario = {
    downside_scenario: {
      monthly_profit: Math.round(incrementalMonthlyProfit * 0.5),
      description: `최악의 경우 (예상의 50%): 월 ₩${Math.round(incrementalMonthlyProfit * 0.5).toLocaleString()} 추가 이익`,
    },
    expected_scenario: {
      monthly_profit: Math.round(incrementalMonthlyProfit),
      description: `예상 시나리오: 월 ₩${Math.round(incrementalMonthlyProfit).toLocaleString()} 추가 이익`,
    },
    upside_scenario: {
      monthly_profit: Math.round(incrementalMonthlyProfit * 1.3),
      description: `최상의 경우 (예상의 130%): 월 ₩${Math.round(incrementalMonthlyProfit * 1.3).toLocaleString()} 추가 이익`,
    },
  };

  // === Step 7: 판정 및 요약 ===
  const summary = generateRetailSummary(
    incrementalMonthlyProfit,
    paybackDays,
    implementationCost,
    input.product_name
  );

  // === Step 8: 신뢰도 계산 ===
  const confidence = calculateConfidence(input);

  return {
    summary,
    revenue: {
      current_daily: Math.round(currentDailyRevenue),
      proposed_daily: Math.round(conservativeProposedRevenue),
      incremental_daily: Math.round(incrementalDailyRevenue),
      incremental_monthly: Math.round(incrementalDailyRevenue * 30),
      incremental_annual: Math.round(incrementalDailyRevenue * 365),
    },
    profit: {
      current_daily: Math.round(currentDailyProfit),
      proposed_daily: Math.round(conservativeProposedProfit),
      incremental_daily: Math.round(incrementalDailyProfit),
      incremental_monthly: Math.round(incrementalMonthlyProfit),
      incremental_annual: Math.round(incrementalAnnualProfit),
    },
    roi: {
      payback_period_days: paybackDays,
      payback_period_text: paybackText,
      monthly_roi_percent: Math.round(monthlyROI * 10) / 10,
      annual_roi_percent: Math.round(annualROI * 10) / 10,
    },
    risk,
    calculation_detail: {
      current_impressions: currentImpressions,
      proposed_impressions: proposedImpressions,
      current_conversions: currentConversions,
      proposed_conversions: proposedConversions,
      effective_conversion_current: currentEffectiveConversion,
      effective_conversion_proposed: proposedEffectiveConversion,
      growth_factor_raw: Math.round(rawGrowthFactor * 100) / 100,
      growth_factor_conservative: Math.round(conservativeGrowthFactor * 100) / 100,
    },
    product_name: input.product_name,
    from_zone: input.current_position.zone_name,
    to_zone: input.proposed_position.zone_name,
    confidence,
  };
}

// ============================================================================
// 보조 함수
// ============================================================================

/**
 * 점장 친화적 요약 생성
 */
function generateRetailSummary(
  incrementalMonthlyProfit: number,
  paybackDays: number | null,
  implementationCost: number,
  productName: string
): RetailSummary {
  let verdict: RetailSummary['verdict'];
  let verdict_kr: string;
  let priority_rank: number;

  if (incrementalMonthlyProfit >= VERDICT_THRESHOLDS.strongly_recommend) {
    verdict = 'strongly_recommend';
    verdict_kr = '강력 추천';
    priority_rank = 1;
  } else if (incrementalMonthlyProfit >= VERDICT_THRESHOLDS.recommend) {
    verdict = 'recommend';
    verdict_kr = '추천';
    priority_rank = 2;
  } else if (incrementalMonthlyProfit >= VERDICT_THRESHOLDS.neutral) {
    verdict = 'neutral';
    verdict_kr = '보통';
    priority_rank = 3;
  } else if (incrementalMonthlyProfit >= VERDICT_THRESHOLDS.not_recommend) {
    verdict = 'not_recommend';
    verdict_kr = '비추천';
    priority_rank = 4;
  } else {
    verdict = 'strongly_not_recommend';
    verdict_kr = '강력 비추천';
    priority_rank = 5;
  }

  // 원라이너 생성
  let one_liner: string;
  const monthlyProfitFormatted = `₩${Math.abs(Math.round(incrementalMonthlyProfit)).toLocaleString()}`;

  if (incrementalMonthlyProfit > 0) {
    if (implementationCost === 0 || paybackDays === null) {
      one_liner = `월 ${monthlyProfitFormatted} 추가 수익, 비용 없이 즉시 효과`;
    } else if (paybackDays <= 7) {
      one_liner = `월 ${monthlyProfitFormatted} 추가 수익, ${paybackDays}일 만에 본전`;
    } else if (paybackDays <= 30) {
      one_liner = `월 ${monthlyProfitFormatted} 추가 수익, 약 ${Math.ceil(paybackDays / 7)}주 후 본전`;
    } else {
      one_liner = `월 ${monthlyProfitFormatted} 추가 수익, 회수에 ${paybackDays}일 소요`;
    }
  } else if (incrementalMonthlyProfit === 0) {
    one_liner = '배치 변경 효과 없음 (현재 유지 권장)';
  } else {
    one_liner = `배치 변경 시 월 ${monthlyProfitFormatted} 손실 예상`;
  }

  return {
    verdict,
    verdict_kr,
    one_liner,
    priority_rank,
  };
}

/**
 * 신뢰도 계산
 */
function calculateConfidence(input: RetailROIInput): number {
  let score = 0.5;

  // 필수 데이터
  if (input.product_price > 0) score += 0.1;
  if (input.product_margin > 0 && input.product_margin <= 1) score += 0.1;
  if (input.base_conversion_rate > 0) score += 0.1;

  // 위치 데이터 품질
  if (input.current_position.daily_traffic > 0) score += 0.05;
  if (input.proposed_position.daily_traffic > 0) score += 0.05;
  if (input.current_position.position_type) score += 0.05;
  if (input.proposed_position.position_type) score += 0.05;

  return Math.min(1, score);
}

// ============================================================================
// Gemini Function Calling 스키마
// ============================================================================

/**
 * Gemini Tool Use를 위한 Function 정의
 */
export const RETAIL_ROI_FUNCTION_DECLARATION = {
  name: 'calculate_retail_roi',
  description: `상품 배치 변경의 증분 ROI를 계산합니다. 현재 위치와 제안 위치를 비교하여
예상 매출/이익 증가분, 투자 회수 기간, 리스크 시나리오를 반환합니다.
점장이 이해하기 쉬운 한글 요약을 포함합니다.`,
  parameters: {
    type: 'object' as const,
    properties: {
      product_name: {
        type: 'string' as const,
        description: '상품 이름',
      },
      product_price: {
        type: 'number' as const,
        description: '상품 가격 (원)',
      },
      product_margin: {
        type: 'number' as const,
        description: '상품 마진율 (0-1, 예: 0.4 = 40%)',
      },
      base_conversion_rate: {
        type: 'number' as const,
        description: '상품의 기본 전환율 (0-1, 예: 0.03 = 3%)',
      },
      // 현재 위치
      current_zone_name: {
        type: 'string' as const,
        description: '현재 Zone 이름',
      },
      current_daily_traffic: {
        type: 'integer' as const,
        description: '현재 Zone의 일일 방문자 수',
      },
      current_visibility: {
        type: 'number' as const,
        description: '현재 위치의 상품 가시성 (0-1)',
      },
      current_position_type: {
        type: 'string' as const,
        enum: ['eye_level', 'reach_level', 'bend_level', 'floor_level', 'top_shelf', 'endcap', 'checkout_adjacent'],
        description: '현재 진열 위치 타입',
      },
      // 제안 위치
      proposed_zone_name: {
        type: 'string' as const,
        description: '제안 Zone 이름',
      },
      proposed_daily_traffic: {
        type: 'integer' as const,
        description: '제안 Zone의 일일 방문자 수',
      },
      proposed_visibility: {
        type: 'number' as const,
        description: '제안 위치의 예상 상품 가시성 (0-1)',
      },
      proposed_position_type: {
        type: 'string' as const,
        enum: ['eye_level', 'reach_level', 'bend_level', 'floor_level', 'top_shelf', 'endcap', 'checkout_adjacent'],
        description: '제안 진열 위치 타입',
      },
      // 선택적
      implementation_cost: {
        type: 'number' as const,
        description: '실행 비용 (인건비 등, 원). 없으면 0으로 계산.',
      },
    },
    required: [
      'product_name', 'product_price', 'product_margin', 'base_conversion_rate',
      'current_zone_name', 'current_daily_traffic', 'current_visibility',
      'proposed_zone_name', 'proposed_daily_traffic', 'proposed_visibility',
    ],
  },
};

// ============================================================================
// 배치 계산
// ============================================================================

/**
 * 여러 상품의 리테일 ROI 일괄 계산
 */
export function calculateRetailROIBatch(inputs: RetailROIInput[]): RetailROIOutput[] {
  return inputs.map(input => calculateRetailROI(input));
}

/**
 * 리테일 ROI 결과 요약
 */
export interface RetailROISummary {
  total_incremental_monthly_profit: number;
  total_incremental_annual_profit: number;
  avg_payback_days: number | null;
  strongly_recommend_count: number;
  recommend_count: number;
  total_items: number;
  top_opportunities: string[];
}

export function summarizeRetailROIResults(outputs: RetailROIOutput[]): RetailROISummary {
  if (outputs.length === 0) {
    return {
      total_incremental_monthly_profit: 0,
      total_incremental_annual_profit: 0,
      avg_payback_days: null,
      strongly_recommend_count: 0,
      recommend_count: 0,
      total_items: 0,
      top_opportunities: [],
    };
  }

  const total_incremental_monthly_profit = outputs.reduce(
    (sum, o) => sum + o.profit.incremental_monthly, 0
  );

  const total_incremental_annual_profit = outputs.reduce(
    (sum, o) => sum + o.profit.incremental_annual, 0
  );

  const paybackDays = outputs
    .filter(o => o.roi.payback_period_days !== null)
    .map(o => o.roi.payback_period_days as number);

  const avg_payback_days = paybackDays.length > 0
    ? Math.round(paybackDays.reduce((a, b) => a + b, 0) / paybackDays.length)
    : null;

  const strongly_recommend_count = outputs.filter(
    o => o.summary.verdict === 'strongly_recommend'
  ).length;

  const recommend_count = outputs.filter(
    o => o.summary.verdict === 'recommend' || o.summary.verdict === 'strongly_recommend'
  ).length;

  // 상위 기회 (증분 이익 기준 상위 3개)
  const top_opportunities = outputs
    .filter(o => o.profit.incremental_monthly > 0)
    .sort((a, b) => b.profit.incremental_monthly - a.profit.incremental_monthly)
    .slice(0, 3)
    .map(o => `${o.product_name}: ${o.from_zone} → ${o.to_zone} (월 +₩${o.profit.incremental_monthly.toLocaleString()})`);

  return {
    total_incremental_monthly_profit,
    total_incremental_annual_profit,
    avg_payback_days,
    strongly_recommend_count,
    recommend_count,
    total_items: outputs.length,
    top_opportunities,
  };
}

// ============================================================================
// Export
// ============================================================================

export default {
  calculateRetailROI,
  calculateRetailROIBatch,
  summarizeRetailROIResults,
  RETAIL_ROI_FUNCTION_DECLARATION,
  // 상수 export
  POSITION_VISIBILITY_MULTIPLIER,
  POSITION_CONVERSION_BONUS,
  VERDICT_THRESHOLDS,
};
