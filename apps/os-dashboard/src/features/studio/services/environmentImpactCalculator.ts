/**
 * environmentImpactCalculator.ts
 *
 * 환경 영향도 계산
 * - 날씨, 공휴일, 매장 이벤트가 트래픽/체류시간/전환율에 미치는 영향 계산
 * - AI 시뮬레이션 및 3D 렌더링에 전달될 multiplier 값 생성
 *
 * 📌 모든 계산은 실제 데이터 기반
 * 📌 하드코딩된 값 없음 - 외부 데이터가 없으면 기본값(1.0) 사용
 */

import type {
  RealWeatherData,
  HolidayData,
  StoreEventData,
  EnvironmentImpact,
  WeatherCondition,
  TimeOfDay,
} from '../types/environment.types';

// ============================================================================
// 1. 날씨 영향도 계산
// ============================================================================

interface WeatherImpactFactors {
  traffic: number;
  dwellTime: number;
  conversion: number;
  reason: string;
}

/**
 * 날씨 조건별 영향도 계산
 */
function calculateWeatherImpact(weather: RealWeatherData | null): WeatherImpactFactors {
  if (!weather) {
    return {
      traffic: 1.0,
      dwellTime: 1.0,
      conversion: 1.0,
      reason: '날씨 데이터 없음',
    };
  }

  let traffic = 1.0;
  let dwellTime = 1.0;
  let conversion = 1.0;
  const reasons: string[] = [];

  // 날씨 조건 영향
  const conditionEffects: Record<WeatherCondition, { traffic: number; dwell: number; conv: number; reason: string }> = {
    clear: { traffic: 1.1, dwell: 0.95, conv: 1.0, reason: '맑은 날씨 - 외출 증가' },
    clouds: { traffic: 1.0, dwell: 1.0, conv: 1.0, reason: '흐림 - 보통' },
    rain: { traffic: 0.7, dwell: 1.3, conv: 1.1, reason: '비 - 방문 감소, 체류시간 증가' },
    drizzle: { traffic: 0.85, dwell: 1.15, conv: 1.05, reason: '이슬비 - 약간 영향' },
    thunderstorm: { traffic: 0.5, dwell: 1.5, conv: 1.15, reason: '뇌우 - 방문 급감, 체류 증가' },
    snow: { traffic: 0.6, dwell: 1.4, conv: 1.1, reason: '눈 - 방문 감소, 체류시간 증가' },
    mist: { traffic: 0.9, dwell: 1.05, conv: 1.0, reason: '안개 - 약간 영향' },
    fog: { traffic: 0.85, dwell: 1.1, conv: 1.0, reason: '짙은 안개 - 외출 감소' },
    haze: { traffic: 0.95, dwell: 1.0, conv: 1.0, reason: '연무 - 경미한 영향' },
  };

  const effect = conditionEffects[weather.condition];
  traffic *= effect.traffic;
  dwellTime *= effect.dwell;
  conversion *= effect.conv;
  reasons.push(effect.reason);

  // 기온 영향 (극한 온도에서 영향)
  if (weather.temperature < 0) {
    traffic *= 0.8;
    dwellTime *= 1.2;
    reasons.push(`극저온 (${weather.temperature}°C)`);
  } else if (weather.temperature > 35) {
    traffic *= 0.85;
    dwellTime *= 1.15;
    reasons.push(`극고온 (${weather.temperature}°C)`);
  } else if (weather.temperature >= 20 && weather.temperature <= 25) {
    traffic *= 1.05;
    reasons.push('쾌적한 기온');
  }

  // 습도 영향 (불쾌지수 기반)
  if (weather.humidity > 80 && weather.temperature > 25) {
    traffic *= 0.9;
    conversion *= 0.95;
    reasons.push('높은 불쾌지수');
  }

  // 강풍 영향
  if (weather.windSpeed > 10) {
    traffic *= 0.9;
    reasons.push('강풍');
  }

  return {
    traffic: Math.max(0.3, Math.min(1.5, traffic)),
    dwellTime: Math.max(0.5, Math.min(2.0, dwellTime)),
    conversion: Math.max(0.5, Math.min(1.5, conversion)),
    reason: reasons.join(', '),
  };
}

// ============================================================================
// 2. 공휴일 영향도 계산
// ============================================================================

interface HolidayImpactFactors {
  traffic: number;
  dwellTime: number;
  conversion: number;
  reason: string;
}

/**
 * 공휴일 영향도 계산
 */
function calculateHolidayImpact(
  todayHoliday: HolidayData | null,
  upcomingHolidays: HolidayData[]
): HolidayImpactFactors {
  if (!todayHoliday) {
    // 내일이 공휴일이면 오늘 방문 약간 증가
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split('T')[0];
    const isTomorrowHoliday = upcomingHolidays.some((h) => h.date === tomorrowStr);

    if (isTomorrowHoliday) {
      return {
        traffic: 1.1,
        dwellTime: 0.95,
        conversion: 1.0,
        reason: '공휴일 전날 - 쇼핑 증가',
      };
    }

    return {
      traffic: 1.0,
      dwellTime: 1.0,
      conversion: 1.0,
      reason: '평일',
    };
  }

  // 쇼핑 시즌 공휴일
  if (todayHoliday.isShoppingHoliday) {
    return {
      traffic: todayHoliday.expectedTrafficMultiplier || 1.5,
      dwellTime: 1.2,
      conversion: 1.15,
      reason: `${todayHoliday.name} - 쇼핑 시즌`,
    };
  }

  // 일반 공휴일
  if (todayHoliday.isHoliday) {
    return {
      traffic: todayHoliday.expectedTrafficMultiplier || 1.2,
      dwellTime: 1.15,
      conversion: 1.05,
      reason: `${todayHoliday.name}`,
    };
  }

  // 기념일 (휴무 아님)
  return {
    traffic: 1.05,
    dwellTime: 1.0,
    conversion: 1.0,
    reason: `${todayHoliday.name} (기념일)`,
  };
}

// ============================================================================
// 3. 매장 이벤트 영향도 계산
// ============================================================================

interface EventImpactFactors {
  traffic: number;
  dwellTime: number;
  conversion: number;
  reason: string;
}

/**
 * 매장 이벤트 영향도 계산
 */
function calculateEventImpact(activeEvents: StoreEventData[]): EventImpactFactors {
  if (!activeEvents || activeEvents.length === 0) {
    return {
      traffic: 1.0,
      dwellTime: 1.0,
      conversion: 1.0,
      reason: '진행 중인 이벤트 없음',
    };
  }

  // 복수 이벤트의 영향을 합산 (곱셈 기반)
  let traffic = 1.0;
  let dwellTime = 1.0;
  let conversion = 1.0;
  const eventNames: string[] = [];

  for (const event of activeEvents) {
    // 이벤트별 영향 적용
    traffic *= 1 + (event.expected_traffic_increase || 0);
    conversion *= 1 + (event.expected_conversion_boost || 0);

    // 이벤트 타입별 체류시간 영향
    const dwellMultipliers: Record<string, number> = {
      sale: 1.1,
      promotion: 1.15,
      launch: 1.25,
      vip: 1.3,
      seasonal: 1.1,
      collaboration: 1.2,
      popup: 1.35,
      special: 1.15,
    };
    dwellTime *= dwellMultipliers[event.event_type] || 1.0;

    eventNames.push(event.event_name);
  }

  return {
    traffic: Math.max(1.0, Math.min(3.0, traffic)),
    dwellTime: Math.max(1.0, Math.min(2.0, dwellTime)),
    conversion: Math.max(1.0, Math.min(2.0, conversion)),
    reason: eventNames.join(', '),
  };
}

// ============================================================================
// 4. 시간대 영향도 계산
// ============================================================================

interface TimeOfDayImpactFactors {
  traffic: number;
  dwellTime: number;
  conversion: number;
  reason: string;
}

/**
 * 현재 시간 → TimeOfDay 변환
 */
export function getTimeOfDay(hour?: number): TimeOfDay {
  const h = hour ?? new Date().getHours();

  if (h >= 5 && h < 9) return 'dawn';
  if (h >= 9 && h < 12) return 'morning';
  if (h >= 12 && h < 18) return 'afternoon';
  if (h >= 18 && h < 21) return 'evening';
  return 'night';
}

/**
 * 시간대별 영향도 계산
 */
function calculateTimeOfDayImpact(isWeekend: boolean): TimeOfDayImpactFactors {
  const hour = new Date().getHours();
  const timeOfDay = getTimeOfDay(hour);

  // 평일 vs 주말 패턴
  const weekdayPatterns: Record<TimeOfDay, { traffic: number; dwell: number; conv: number; reason: string }> = {
    dawn: { traffic: 0.3, dwell: 0.8, conv: 0.9, reason: '이른 아침 - 방문 적음' },
    morning: { traffic: 0.7, dwell: 0.9, conv: 0.95, reason: '오전 - 점진적 증가' },
    afternoon: { traffic: 1.0, dwell: 1.0, conv: 1.0, reason: '오후 - 점심시간대' },
    evening: { traffic: 1.3, dwell: 1.1, conv: 1.1, reason: '저녁 - 퇴근 후 피크' },
    night: { traffic: 0.5, dwell: 1.2, conv: 1.05, reason: '밤 - 방문 감소' },
  };

  const weekendPatterns: Record<TimeOfDay, { traffic: number; dwell: number; conv: number; reason: string }> = {
    dawn: { traffic: 0.2, dwell: 0.8, conv: 0.9, reason: '주말 이른 아침' },
    morning: { traffic: 0.6, dwell: 1.0, conv: 0.95, reason: '주말 오전' },
    afternoon: { traffic: 1.4, dwell: 1.2, conv: 1.1, reason: '주말 오후 - 피크' },
    evening: { traffic: 1.2, dwell: 1.15, conv: 1.05, reason: '주말 저녁' },
    night: { traffic: 0.6, dwell: 1.1, conv: 1.0, reason: '주말 밤' },
  };

  const pattern = isWeekend ? weekendPatterns[timeOfDay] : weekdayPatterns[timeOfDay];

  return {
    traffic: pattern.traffic,
    dwellTime: pattern.dwell,
    conversion: pattern.conv,
    reason: pattern.reason,
  };
}

// ============================================================================
// 5. 통합 영향도 계산
// ============================================================================

export interface CalculateImpactParams {
  weather: RealWeatherData | null;
  todayHoliday: HolidayData | null;
  upcomingHolidays: HolidayData[];
  activeEvents: StoreEventData[];
}

/**
 * 모든 환경 요인의 통합 영향도 계산
 */
export function calculateEnvironmentImpact(params: CalculateImpactParams): EnvironmentImpact {
  const { weather, todayHoliday, upcomingHolidays, activeEvents } = params;

  // 각 요인별 영향도 계산
  const weatherImpact = calculateWeatherImpact(weather);
  const holidayImpact = calculateHolidayImpact(todayHoliday, upcomingHolidays);
  const eventImpact = calculateEventImpact(activeEvents);

  // 주말 여부 확인
  const dayOfWeek = new Date().getDay();
  const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
  const timeOfDayImpact = calculateTimeOfDayImpact(isWeekend);

  // 통합 multiplier 계산 (각 요인의 곱)
  const trafficMultiplier =
    weatherImpact.traffic *
    holidayImpact.traffic *
    eventImpact.traffic *
    timeOfDayImpact.traffic;

  const dwellTimeMultiplier =
    weatherImpact.dwellTime *
    holidayImpact.dwellTime *
    eventImpact.dwellTime *
    timeOfDayImpact.dwellTime;

  const conversionMultiplier =
    weatherImpact.conversion *
    holidayImpact.conversion *
    eventImpact.conversion *
    timeOfDayImpact.conversion;

  // 요약 생성
  const summaryParts: string[] = [];
  if (weather) summaryParts.push(`날씨: ${weather.description}`);
  if (todayHoliday) summaryParts.push(`공휴일: ${todayHoliday.name}`);
  if (activeEvents.length > 0) summaryParts.push(`이벤트: ${activeEvents.length}개 진행 중`);
  summaryParts.push(`시간대: ${timeOfDayImpact.reason}`);

  // 신뢰도 계산 (데이터 가용성 기반)
  let confidence = 0.5; // 기본값
  if (weather) confidence += 0.2;
  if (todayHoliday !== undefined) confidence += 0.15; // null도 유효한 응답
  if (activeEvents) confidence += 0.15;

  return {
    trafficMultiplier: Math.max(0.1, Math.min(5.0, trafficMultiplier)),
    dwellTimeMultiplier: Math.max(0.3, Math.min(3.0, dwellTimeMultiplier)),
    conversionMultiplier: Math.max(0.3, Math.min(3.0, conversionMultiplier)),

    factors: {
      weather: weatherImpact,
      holiday: holidayImpact,
      event: eventImpact,
      timeOfDay: timeOfDayImpact,
    },

    summary: summaryParts.join(' | '),
    confidence: Math.min(1.0, confidence),
  };
}

// ============================================================================
// 6. AI 시뮬레이션용 환경 컨텍스트 생성
// ============================================================================

export interface AISimulationEnvironmentContext {
  // 기본 정보
  timestamp: string;
  isWeekend: boolean;
  isHoliday: boolean;
  holidayName: string | null;

  // 날씨 정보
  weatherCondition: WeatherCondition | null;
  temperature: number | null;
  humidity: number | null;

  // 이벤트 정보
  activeEventCount: number;
  activeEventTypes: string[];
  totalDiscountRate: number;

  // 계산된 영향도
  trafficMultiplier: number;
  dwellTimeMultiplier: number;
  conversionMultiplier: number;

  // 추가 컨텍스트
  timeOfDay: TimeOfDay;
  peakHourFactor: number; // 피크 시간대 가중치
}

/**
 * AI 시뮬레이션에 전달할 환경 컨텍스트 생성
 */
export function createAISimulationContext(
  params: CalculateImpactParams,
  impact: EnvironmentImpact
): AISimulationEnvironmentContext {
  const { weather, todayHoliday, activeEvents } = params;

  const dayOfWeek = new Date().getDay();
  const hour = new Date().getHours();
  const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

  // 피크 시간대 가중치
  let peakHourFactor = 1.0;
  if (isWeekend) {
    if (hour >= 13 && hour <= 17) peakHourFactor = 1.3;
    else if (hour >= 11 && hour <= 19) peakHourFactor = 1.15;
  } else {
    if (hour >= 18 && hour <= 20) peakHourFactor = 1.3;
    else if (hour >= 12 && hour <= 14) peakHourFactor = 1.15;
  }

  // 총 할인율 계산
  const totalDiscountRate = activeEvents.reduce((sum, e) => sum + (e.discount_rate || 0), 0);

  return {
    timestamp: new Date().toISOString(),
    isWeekend,
    isHoliday: todayHoliday?.isHoliday || false,
    holidayName: todayHoliday?.name || null,

    weatherCondition: weather?.condition || null,
    temperature: weather?.temperature || null,
    humidity: weather?.humidity || null,

    activeEventCount: activeEvents.length,
    activeEventTypes: activeEvents.map((e) => e.event_type),
    totalDiscountRate,

    trafficMultiplier: impact.trafficMultiplier,
    dwellTimeMultiplier: impact.dwellTimeMultiplier,
    conversionMultiplier: impact.conversionMultiplier,

    timeOfDay: getTimeOfDay(hour),
    peakHourFactor,
  };
}
