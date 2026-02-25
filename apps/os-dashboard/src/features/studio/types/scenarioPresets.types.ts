/**
 * scenarioPresets.types.ts
 *
 * AI 시뮬레이션 프리셋 시나리오 정의
 * 기획서 기반 7개 프리셋 시나리오
 */

import type { WeatherOption, HolidayOption, TimeOfDayOption } from './simulationEnvironment.types';

// ============================================================================
// 프리셋 시나리오 타입
// ============================================================================

export type PresetScenarioId =
  | 'christmas'      // 크리스마스 시즌
  | 'rainyWeekday'   // 비 오는 평일
  | 'blackFriday'    // 블랙프라이데이
  | 'newArrival'     // 신상품 런칭
  | 'normalWeekend'  // 평범한 주말
  | 'coldWave'       // 한파 주의보
  | 'yearEndParty';  // 연말 파티 시즌

export interface PresetScenario {
  id: PresetScenarioId;
  name: string;
  emoji: string;
  description: string;
  // 시나리오 설정값
  settings: {
    weather: WeatherOption;
    holidayType: HolidayOption;
    timeOfDay: TimeOfDayOption;
    trafficMultiplier: number;  // 트래픽 배수 (0.5 ~ 3.0)
    discountPercent?: number;   // 할인율 (%)
    eventType?: 'sale' | 'newArrival' | 'seasonOpen' | 'vip' | null;
  };
  // 예상 영향
  expectedImpact: {
    visitorsMultiplier: number;
    conversionMultiplier: number;
    basketMultiplier: number;
    dwellTimeMultiplier: number;
  };
  // 주의 태그 (리스크 표시)
  riskTags: string[];
  // 색상 테마
  colorTheme: {
    bg: string;
    border: string;
    text: string;
  };
}

// ============================================================================
// 7개 프리셋 시나리오 정의
// ============================================================================

export const PRESET_SCENARIOS: PresetScenario[] = [
  {
    id: 'christmas',
    name: '크리스마스 시즌',
    emoji: '🎄',
    description: '주말 + 겨울 + 세일 30%',
    settings: {
      weather: 'snow',
      holidayType: 'christmas',
      timeOfDay: 'afternoon',
      trafficMultiplier: 1.8,
      discountPercent: 30,
      eventType: 'sale',
    },
    expectedImpact: {
      visitorsMultiplier: 1.8,
      conversionMultiplier: 1.2,
      basketMultiplier: 1.15,
      dwellTimeMultiplier: 1.1,
    },
    riskTags: ['혼잡 위험', '계산대 대기'],
    colorTheme: {
      bg: 'bg-red-500/10',
      border: 'border-red-500/30',
      text: 'text-red-400',
    },
  },
  {
    id: 'rainyWeekday',
    name: '비 오는 평일',
    emoji: '🌧️',
    description: '평일 + 비 + 이벤트 없음',
    settings: {
      weather: 'rain',
      holidayType: 'none',
      timeOfDay: 'afternoon',
      trafficMultiplier: 0.7,
      eventType: null,
    },
    expectedImpact: {
      visitorsMultiplier: 0.7,
      conversionMultiplier: 1.0,
      basketMultiplier: 1.05,
      dwellTimeMultiplier: 1.25,
    },
    riskTags: ['매출 감소'],
    colorTheme: {
      bg: 'bg-blue-500/10',
      border: 'border-blue-500/30',
      text: 'text-blue-400',
    },
  },
  {
    id: 'blackFriday',
    name: '블랙프라이데이',
    emoji: '🔥',
    description: '금요일 + 세일 50% + 마케팅 강화',
    settings: {
      weather: 'clear',
      holidayType: 'blackFriday',
      timeOfDay: 'peak',
      trafficMultiplier: 2.5,
      discountPercent: 50,
      eventType: 'sale',
    },
    expectedImpact: {
      visitorsMultiplier: 2.5,
      conversionMultiplier: 1.3,
      basketMultiplier: 0.85,
      dwellTimeMultiplier: 0.9,
    },
    riskTags: ['혼잡 위험', '인력 부족', '병목 위험'],
    colorTheme: {
      bg: 'bg-orange-500/10',
      border: 'border-orange-500/30',
      text: 'text-orange-400',
    },
  },
  {
    id: 'newArrival',
    name: '신상품 런칭',
    emoji: '📦',
    description: '주말 + 신상품 출시',
    settings: {
      weather: 'clear',
      holidayType: 'weekend',
      timeOfDay: 'afternoon',
      trafficMultiplier: 1.2,
      eventType: 'newArrival',
    },
    expectedImpact: {
      visitorsMultiplier: 1.2,
      conversionMultiplier: 1.1,
      basketMultiplier: 1.1,
      dwellTimeMultiplier: 1.15,
    },
    riskTags: ['특정 존 집중'],
    colorTheme: {
      bg: 'bg-purple-500/10',
      border: 'border-purple-500/30',
      text: 'text-purple-400',
    },
  },
  {
    id: 'normalWeekend',
    name: '평범한 주말',
    emoji: '🌞',
    description: '주말 + 맑음 + 이벤트 없음',
    settings: {
      weather: 'clear',
      holidayType: 'weekend',
      timeOfDay: 'afternoon',
      trafficMultiplier: 1.35,
      eventType: null,
    },
    expectedImpact: {
      visitorsMultiplier: 1.35,
      conversionMultiplier: 1.05,
      basketMultiplier: 1.0,
      dwellTimeMultiplier: 1.0,
    },
    riskTags: [],
    colorTheme: {
      bg: 'bg-yellow-500/10',
      border: 'border-yellow-500/30',
      text: 'text-yellow-400',
    },
  },
  {
    id: 'coldWave',
    name: '한파 주의보',
    emoji: '❄️',
    description: '평일 + 영하 10도 + 눈',
    settings: {
      weather: 'heavySnow',
      holidayType: 'none',
      timeOfDay: 'afternoon',
      trafficMultiplier: 0.6,
      eventType: null,
    },
    expectedImpact: {
      visitorsMultiplier: 0.6,
      conversionMultiplier: 1.0,
      basketMultiplier: 1.1,
      dwellTimeMultiplier: 0.85,
    },
    riskTags: ['매출 감소', '방문객 급감'],
    colorTheme: {
      bg: 'bg-cyan-500/10',
      border: 'border-cyan-500/30',
      text: 'text-cyan-400',
    },
  },
  {
    id: 'yearEndParty',
    name: '연말 파티 시즌',
    emoji: '🎉',
    description: '금요일 저녁 + 이벤트',
    settings: {
      weather: 'clear',
      holidayType: 'weekend',
      timeOfDay: 'evening',
      trafficMultiplier: 1.5,
      eventType: 'seasonOpen',
    },
    expectedImpact: {
      visitorsMultiplier: 1.5,
      conversionMultiplier: 1.15,
      basketMultiplier: 1.2,
      dwellTimeMultiplier: 1.3,
    },
    riskTags: ['저녁 집중', '체류시간 증가'],
    colorTheme: {
      bg: 'bg-pink-500/10',
      border: 'border-pink-500/30',
      text: 'text-pink-400',
    },
  },
];

// ============================================================================
// 헬퍼 함수
// ============================================================================

/**
 * ID로 프리셋 시나리오 찾기
 */
export function getPresetScenarioById(id: PresetScenarioId): PresetScenario | undefined {
  return PRESET_SCENARIOS.find(s => s.id === id);
}

/**
 * 프리셋 시나리오를 SimulationEnvironmentConfig로 변환
 */
export function presetToEnvironmentConfig(preset: PresetScenario) {
  return {
    mode: 'manual' as const,
    selectedDate: new Date(),
    manualSettings: {
      weather: preset.settings.weather,
      timeOfDay: preset.settings.timeOfDay,
      holidayType: preset.settings.holidayType,
    },
    calculatedImpact: {
      trafficMultiplier: preset.expectedImpact.visitorsMultiplier,
      dwellTimeMultiplier: preset.expectedImpact.dwellTimeMultiplier,
      conversionMultiplier: preset.expectedImpact.conversionMultiplier,
    },
    // 레거시 호환
    weather: preset.settings.weather,
    timeOfDay: preset.settings.timeOfDay,
    holidayType: preset.settings.holidayType,
  };
}

// ============================================================================
// 시뮬레이션 문제점 타입
// ============================================================================

export type SimulationIssueType =
  | 'congestion'    // 혼잡 위험
  | 'bottleneck'    // 동선 병목
  | 'deadzone'      // 데드존
  | 'understaffed'  // 인력 부족
  | 'checkout_wait'; // 계산대 대기

export type SimulationIssueSeverity = 'critical' | 'warning' | 'info';

export interface SimulationIssue {
  id: string;
  type: SimulationIssueType;
  severity: SimulationIssueSeverity;
  title: string;
  location: {
    zoneId: string;
    zoneName: string;
  };
  timeRange?: {
    start: string;
    end: string;
    peak?: string;
  };
  details: {
    currentValue: number;
    threshold: number;
    unit: string;
    description: string;
  };
  impact: {
    revenueImpact: number;      // 예상 매출 손실 (원)
    customerImpact: number;      // 영향 고객 수
    conversionImpact?: number;   // 전환율 영향 (%)
  };
  recommendations: string[];
}

// ============================================================================
// 문제점 감지 기준값
// ============================================================================

export const ISSUE_THRESHOLDS = {
  congestion: {
    warning: 0.8,   // 수용인원 80%
    critical: 1.0,  // 수용인원 100%
  },
  bottleneck: {
    warning: 3,     // 대기시간 3분
    critical: 5,    // 대기시간 5분
  },
  deadzone: {
    warning: 0.1,   // 방문율 10%
    critical: 0.05, // 방문율 5%
  },
  understaffed: {
    warning: 15,    // 고객:직원 15:1
    critical: 20,   // 고객:직원 20:1
  },
  checkout_wait: {
    warning: 10,    // 대기시간 10분
    critical: 15,   // 대기시간 15분
  },
};

/**
 * 문제점 유형별 아이콘 및 색상
 */
export const ISSUE_TYPE_META: Record<SimulationIssueType, {
  icon: string;
  label: string;
  color: string;
}> = {
  congestion: { icon: '🔴', label: '혼잡 위험', color: 'text-red-400' },
  bottleneck: { icon: '⚠️', label: '동선 병목', color: 'text-orange-400' },
  deadzone: { icon: '💤', label: '데드존', color: 'text-gray-400' },
  understaffed: { icon: '👥', label: '인력 부족', color: 'text-yellow-400' },
  checkout_wait: { icon: '🕐', label: '계산대 대기', color: 'text-purple-400' },
};
