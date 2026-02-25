/**
 * trafficFlow.ts
 *
 * 트래픽 흐름 계산 모듈
 * AI가 호출할 수 있는 순수 함수들
 *
 * Sprint 1 Task: S1-1
 * 작성일: 2026-01-12
 */

// ============================================================================
// 타입 정의
// ============================================================================

/** 트래픽 흐름 계산 입력 */
export interface TrafficFlowInput {
  zone_id: string;
  zone_type: ZoneType;
  area_sqm: number;
  adjacent_zones: string[];
  furniture_count: number;
  current_visitors: number;
  time_of_day: TimeOfDay;
  /** 선택적: 요일 정보 */
  day_of_week?: DayOfWeek;
  /** 선택적: 이벤트 여부 */
  has_event?: boolean;
  /** 선택적: 날씨 영향 계수 (0.5 ~ 1.5) */
  weather_multiplier?: number;
}

/** Zone 타입 */
export type ZoneType =
  | 'entrance'
  | 'main'
  | 'display'
  | 'fitting'
  | 'checkout'
  | 'storage'
  | 'corner'
  | 'back';

/** 시간대 */
export type TimeOfDay = 'morning' | 'afternoon' | 'evening' | 'night';

/** 요일 */
export type DayOfWeek =
  | 'monday'
  | 'tuesday'
  | 'wednesday'
  | 'thursday'
  | 'friday'
  | 'saturday'
  | 'sunday';

/** 트래픽 흐름 계산 출력 */
export interface TrafficFlowOutput {
  /** Zone ID */
  zone_id: string;
  /** 예상 방문자 수 */
  expected_visitors: number;
  /** 유동인구 흐름율 (분당 방문자) */
  flow_rate: number;
  /** 혼잡 위험도 */
  congestion_risk: 'low' | 'medium' | 'high' | 'critical';
  /** 병목 발생 확률 (0-1) */
  bottleneck_probability: number;
  /** 권장 수용 인원 */
  recommended_capacity: number;
  /** 현재 밀도 지수 (0-1, 1이 가장 혼잡) */
  density_index: number;
  /** 계산 신뢰도 (0-1) */
  confidence: number;
  /** 계산 상세 내역 */
  calculation_breakdown: CalculationStep[];
}

/** 계산 단계 */
export interface CalculationStep {
  step: string;
  value: number;
  formula: string;
  unit?: string;
}

// ============================================================================
// 상수 정의
// ============================================================================

/** 시간대별 트래픽 계수 */
export const TIME_MULTIPLIERS: Record<TimeOfDay, number> = {
  morning: 0.6,    // 오전 (10-12시)
  afternoon: 1.0,  // 오후 피크 (12-18시)
  evening: 0.85,   // 저녁 (18-21시)
  night: 0.3,      // 야간 (21시 이후)
};

/** 요일별 트래픽 계수 */
export const DAY_MULTIPLIERS: Record<DayOfWeek, number> = {
  monday: 0.7,
  tuesday: 0.75,
  wednesday: 0.8,
  thursday: 0.85,
  friday: 0.95,
  saturday: 1.3,
  sunday: 1.2,
};

/** Zone 타입별 흡인력 계수 */
export const ZONE_ATTRACTION: Record<ZoneType, number> = {
  entrance: 1.5,    // 입구: 모든 방문자 통과
  main: 1.2,        // 메인 통로: 높은 유동성
  display: 1.0,     // 디스플레이: 표준
  fitting: 0.5,     // 피팅룸: 제한적 접근
  checkout: 0.8,    // 계산대: 구매자만
  storage: 0.1,     // 창고: 직원 전용
  corner: 0.4,      // 코너: 접근성 낮음
  back: 0.3,        // 후면: 접근성 매우 낮음
};

/** Zone 타입별 기본 체류 시간 (분) */
export const ZONE_DWELL_TIME: Record<ZoneType, number> = {
  entrance: 1,
  main: 3,
  display: 5,
  fitting: 8,
  checkout: 2,
  storage: 0,
  corner: 2,
  back: 2,
};

/** 평방미터당 권장 수용 인원 */
const CAPACITY_PER_SQM = 0.5;

/** 혼잡도 임계값 */
export const CONGESTION_THRESHOLDS = {
  low: 0.4,
  medium: 0.6,
  high: 0.8,
  critical: 1.0,
};

// ============================================================================
// 핵심 계산 함수
// ============================================================================

/**
 * 트래픽 흐름 계산
 *
 * @param input - 트래픽 계산 입력 데이터
 * @returns TrafficFlowOutput
 *
 * @example
 * const result = calculateTrafficFlow({
 *   zone_id: 'zone-001',
 *   zone_type: 'display',
 *   area_sqm: 25,
 *   adjacent_zones: ['zone-002', 'zone-003'],
 *   furniture_count: 4,
 *   current_visitors: 8,
 *   time_of_day: 'afternoon',
 * });
 */
export function calculateTrafficFlow(input: TrafficFlowInput): TrafficFlowOutput {
  const breakdown: CalculationStep[] = [];

  // Step 1: 기본 용량 계산 (면적 기반)
  const baseCapacity = input.area_sqm * CAPACITY_PER_SQM;
  breakdown.push({
    step: '기본 수용 용량',
    value: baseCapacity,
    formula: `${input.area_sqm}㎡ × ${CAPACITY_PER_SQM}명/㎡ = ${baseCapacity.toFixed(1)}명`,
    unit: '명',
  });

  // Step 2: 시간대별 계수 적용
  const timeMultiplier = TIME_MULTIPLIERS[input.time_of_day];
  breakdown.push({
    step: '시간대 계수',
    value: timeMultiplier,
    formula: `${input.time_of_day} = ${timeMultiplier}`,
  });

  // Step 3: 요일별 계수 적용 (선택적)
  const dayMultiplier = input.day_of_week
    ? DAY_MULTIPLIERS[input.day_of_week]
    : 1.0;
  if (input.day_of_week) {
    breakdown.push({
      step: '요일 계수',
      value: dayMultiplier,
      formula: `${input.day_of_week} = ${dayMultiplier}`,
    });
  }

  // Step 4: Zone 타입별 흡인력 계수
  const attraction = ZONE_ATTRACTION[input.zone_type];
  breakdown.push({
    step: 'Zone 흡인력',
    value: attraction,
    formula: `${input.zone_type} = ${attraction}`,
  });

  // Step 5: 가구 밀도에 따른 페널티 계산
  const furnitureDensity = input.furniture_count / input.area_sqm;
  const densityPenalty = calculateDensityPenalty(furnitureDensity);
  breakdown.push({
    step: '가구 밀도 페널티',
    value: densityPenalty,
    formula: `밀도 ${furnitureDensity.toFixed(2)}/㎡ → 페널티 ${densityPenalty.toFixed(2)}`,
  });

  // Step 6: 인접 Zone 보너스 (연결성)
  const adjacencyBonus = calculateAdjacencyBonus(input.adjacent_zones.length);
  breakdown.push({
    step: '연결성 보너스',
    value: adjacencyBonus,
    formula: `인접 ${input.adjacent_zones.length}개 Zone → ${adjacencyBonus.toFixed(2)}`,
  });

  // Step 7: 날씨/이벤트 계수 적용
  const externalMultiplier = (input.weather_multiplier || 1.0) * (input.has_event ? 1.2 : 1.0);
  if (input.weather_multiplier || input.has_event) {
    breakdown.push({
      step: '외부 요인 계수',
      value: externalMultiplier,
      formula: `날씨(${input.weather_multiplier?.toFixed(2) || '1.00'}) × 이벤트(${input.has_event ? '1.20' : '1.00'}) = ${externalMultiplier.toFixed(2)}`,
    });
  }

  // Step 8: 최종 예상 방문자 수 계산
  const expected_visitors = Math.round(
    baseCapacity *
    timeMultiplier *
    dayMultiplier *
    attraction *
    densityPenalty *
    adjacencyBonus *
    externalMultiplier
  );
  breakdown.push({
    step: '예상 방문자 수',
    value: expected_visitors,
    formula: `${baseCapacity.toFixed(1)} × ${timeMultiplier} × ${dayMultiplier} × ${attraction} × ${densityPenalty.toFixed(2)} × ${adjacencyBonus.toFixed(2)} × ${externalMultiplier.toFixed(2)} = ${expected_visitors}명`,
    unit: '명',
  });

  // Step 9: 유동인구 흐름율 (분당)
  const dwellTime = ZONE_DWELL_TIME[input.zone_type] || 3;
  const flow_rate = expected_visitors / Math.max(dwellTime, 1);
  breakdown.push({
    step: '분당 흐름율',
    value: flow_rate,
    formula: `${expected_visitors}명 / ${dwellTime}분 = ${flow_rate.toFixed(2)}명/분`,
    unit: '명/분',
  });

  // Step 10: 현재 밀도 및 혼잡도 계산
  const density_index = Math.min(1, input.current_visitors / Math.max(baseCapacity, 1));
  const congestion_risk = determineCongestionRisk(density_index);
  breakdown.push({
    step: '현재 밀도 지수',
    value: density_index,
    formula: `${input.current_visitors}명 / ${baseCapacity.toFixed(1)}명 = ${(density_index * 100).toFixed(1)}%`,
  });

  // Step 11: 병목 발생 확률
  const bottleneck_probability = calculateBottleneckProbability(
    density_index,
    input.adjacent_zones.length,
    furnitureDensity
  );
  breakdown.push({
    step: '병목 확률',
    value: bottleneck_probability,
    formula: `밀도(${(density_index * 100).toFixed(0)}%) + 연결성(${input.adjacent_zones.length}) + 가구밀도(${furnitureDensity.toFixed(2)}) → ${(bottleneck_probability * 100).toFixed(1)}%`,
  });

  // Step 12: 신뢰도 계산
  const confidence = calculateConfidence(input);
  breakdown.push({
    step: '계산 신뢰도',
    value: confidence,
    formula: `입력 데이터 완전성 기반 = ${(confidence * 100).toFixed(0)}%`,
  });

  return {
    zone_id: input.zone_id,
    expected_visitors,
    flow_rate: Math.round(flow_rate * 100) / 100,
    congestion_risk,
    bottleneck_probability: Math.round(bottleneck_probability * 100) / 100,
    recommended_capacity: Math.round(baseCapacity),
    density_index: Math.round(density_index * 100) / 100,
    confidence: Math.round(confidence * 100) / 100,
    calculation_breakdown: breakdown,
  };
}

// ============================================================================
// 보조 계산 함수
// ============================================================================

/**
 * 가구 밀도 페널티 계산
 * 밀도가 높을수록 이동 불편으로 인해 방문자 감소
 */
function calculateDensityPenalty(density: number): number {
  if (density <= 0.1) return 1.0;      // 여유로움
  if (density <= 0.2) return 0.95;     // 적정
  if (density <= 0.3) return 0.85;     // 약간 복잡
  if (density <= 0.4) return 0.75;     // 복잡
  if (density <= 0.5) return 0.6;      // 매우 복잡
  return 0.5;                          // 과밀
}

/**
 * 인접 Zone 연결성 보너스 계산
 * 연결된 Zone이 많을수록 유동인구 증가
 */
function calculateAdjacencyBonus(adjacentCount: number): number {
  if (adjacentCount === 0) return 0.7;   // 고립된 구역
  if (adjacentCount === 1) return 0.85;  // 1방향 연결
  if (adjacentCount === 2) return 1.0;   // 표준
  if (adjacentCount === 3) return 1.1;   // 허브 구역
  return 1.15;                           // 교차로
}

/**
 * 혼잡 위험도 판정
 */
function determineCongestionRisk(densityIndex: number): TrafficFlowOutput['congestion_risk'] {
  if (densityIndex < CONGESTION_THRESHOLDS.low) return 'low';
  if (densityIndex < CONGESTION_THRESHOLDS.medium) return 'medium';
  if (densityIndex < CONGESTION_THRESHOLDS.high) return 'high';
  return 'critical';
}

/**
 * 병목 발생 확률 계산
 */
function calculateBottleneckProbability(
  densityIndex: number,
  adjacentCount: number,
  furnitureDensity: number
): number {
  // 기본 확률 = 밀도 기반
  let probability = densityIndex * 0.5;

  // 연결성이 낮으면 병목 확률 증가 (입구/출구가 제한적)
  if (adjacentCount <= 1) {
    probability += 0.2;
  }

  // 가구 밀도가 높으면 병목 확률 증가
  if (furnitureDensity > 0.3) {
    probability += furnitureDensity * 0.3;
  }

  return Math.min(1, Math.max(0, probability));
}

/**
 * 계산 신뢰도 산정
 */
function calculateConfidence(input: TrafficFlowInput): number {
  let score = 0.5; // 기본 점수

  // 필수 데이터 존재 시 가중치 부여
  if (input.area_sqm > 0) score += 0.1;
  if (input.current_visitors >= 0) score += 0.1;
  if (input.furniture_count >= 0) score += 0.05;
  if (input.adjacent_zones.length > 0) score += 0.05;

  // 선택적 데이터 존재 시 추가 점수
  if (input.day_of_week) score += 0.1;
  if (input.weather_multiplier !== undefined) score += 0.05;
  if (input.has_event !== undefined) score += 0.05;

  return Math.min(1, score);
}

// ============================================================================
// 배치 계산 함수
// ============================================================================

/**
 * 여러 Zone의 트래픽 흐름 일괄 계산
 */
export function calculateTrafficFlowBatch(
  inputs: TrafficFlowInput[]
): TrafficFlowOutput[] {
  return inputs.map(input => calculateTrafficFlow(input));
}

/**
 * 전체 매장 트래픽 요약
 */
export interface StoreTrafficSummary {
  total_expected_visitors: number;
  avg_density_index: number;
  high_risk_zones: string[];
  bottleneck_zones: string[];
  total_flow_rate: number;
  overall_confidence: number;
}

export function summarizeStoreTraffic(
  outputs: TrafficFlowOutput[]
): StoreTrafficSummary {
  if (outputs.length === 0) {
    return {
      total_expected_visitors: 0,
      avg_density_index: 0,
      high_risk_zones: [],
      bottleneck_zones: [],
      total_flow_rate: 0,
      overall_confidence: 0,
    };
  }

  const total_expected_visitors = outputs.reduce(
    (sum, o) => sum + o.expected_visitors, 0
  );

  const avg_density_index = outputs.reduce(
    (sum, o) => sum + o.density_index, 0
  ) / outputs.length;

  const high_risk_zones = outputs
    .filter(o => o.congestion_risk === 'high' || o.congestion_risk === 'critical')
    .map(o => o.zone_id);

  const bottleneck_zones = outputs
    .filter(o => o.bottleneck_probability > 0.5)
    .map(o => o.zone_id);

  const total_flow_rate = outputs.reduce(
    (sum, o) => sum + o.flow_rate, 0
  );

  const overall_confidence = outputs.reduce(
    (sum, o) => sum + o.confidence, 0
  ) / outputs.length;

  return {
    total_expected_visitors,
    avg_density_index: Math.round(avg_density_index * 100) / 100,
    high_risk_zones,
    bottleneck_zones,
    total_flow_rate: Math.round(total_flow_rate * 100) / 100,
    overall_confidence: Math.round(overall_confidence * 100) / 100,
  };
}

// ============================================================================
// Gemini Function Calling 스키마 정의
// ============================================================================

/**
 * Gemini Tool Use를 위한 Function 정의
 */
export const TRAFFIC_FLOW_FUNCTION_DECLARATION = {
  name: 'calculate_traffic_flow',
  description: '특정 Zone의 예상 트래픽 흐름을 계산합니다. 방문자 수, 혼잡도, 병목 확률 등을 반환합니다.',
  parameters: {
    type: 'object' as const,
    properties: {
      zone_id: {
        type: 'string' as const,
        description: 'Zone의 고유 식별자',
      },
      zone_type: {
        type: 'string' as const,
        enum: ['entrance', 'main', 'display', 'fitting', 'checkout', 'storage', 'corner', 'back'],
        description: 'Zone의 유형 (entrance, main, display, fitting, checkout, storage, corner, back)',
      },
      area_sqm: {
        type: 'number' as const,
        description: 'Zone의 면적 (제곱미터)',
      },
      adjacent_zones: {
        type: 'array' as const,
        items: { type: 'string' as const },
        description: '인접한 Zone ID 목록',
      },
      furniture_count: {
        type: 'integer' as const,
        description: 'Zone 내 가구 수',
      },
      current_visitors: {
        type: 'integer' as const,
        description: '현재 Zone 내 방문자 수',
      },
      time_of_day: {
        type: 'string' as const,
        enum: ['morning', 'afternoon', 'evening', 'night'],
        description: '시간대 (morning, afternoon, evening, night)',
      },
      day_of_week: {
        type: 'string' as const,
        enum: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'],
        description: '요일 (선택적)',
      },
      has_event: {
        type: 'boolean' as const,
        description: '매장 이벤트 진행 여부 (선택적)',
      },
      weather_multiplier: {
        type: 'number' as const,
        description: '날씨 영향 계수, 0.5~1.5 범위 (선택적)',
      },
    },
    required: ['zone_id', 'zone_type', 'area_sqm', 'adjacent_zones', 'furniture_count', 'current_visitors', 'time_of_day'],
  },
};

// ============================================================================
// Export
// ============================================================================

export default {
  calculateTrafficFlow,
  calculateTrafficFlowBatch,
  summarizeStoreTraffic,
  TRAFFIC_FLOW_FUNCTION_DECLARATION,
  // 상수 export
  TIME_MULTIPLIERS,
  DAY_MULTIPLIERS,
  ZONE_ATTRACTION,
  ZONE_DWELL_TIME,
  CONGESTION_THRESHOLDS,
};
