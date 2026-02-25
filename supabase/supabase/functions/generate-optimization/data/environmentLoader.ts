/**
 * environmentLoader.ts
 *
 * Phase 0.1: 환경 데이터 로딩 시스템
 *
 * 날씨, 휴일/이벤트, 시간대 데이터를 통합 로드하고
 * 정량적 영향도 계산을 수행합니다.
 *
 * 🆕 v2.1.0: 실시간 API 폴백 기능 추가
 * - DB에 데이터 없을 시 OpenWeatherMap / data.go.kr 직접 호출
 * - 자동 DB 저장으로 캐싱
 *
 * @version 2.1.0
 * @author NEURALTWIN AI Team
 */

// ============================================================================
// 🆕 실시간 API 설정
// ============================================================================

const WEATHER_API_CONFIG = {
  enabled: true,
  cacheMinutes: 30, // 30분 이내 데이터는 캐시 사용
  defaultLat: 37.5665, // 서울 기본 좌표
  defaultLon: 126.9780,
};

const HOLIDAYS_API_CONFIG = {
  enabled: true,
  cacheDays: 30, // 한 달 단위 캐시
};

// ============================================================================
// 타입 정의
// ============================================================================

/** 날씨 조건 타입 */
export type WeatherCondition =
  | 'clear'
  | 'sunny'
  | 'cloudy'
  | 'overcast'
  | 'rain'
  | 'heavy_rain'
  | 'drizzle'
  | 'thunderstorm'
  | 'snow'
  | 'heavy_snow'
  | 'fog'
  | 'mist'
  | 'haze'
  | 'unknown';

/** 이벤트 타입 */
export type EventType =
  | 'holiday'       // 공휴일
  | 'commercial'    // 상업 이벤트 (블랙프라이데이, 세일 등)
  | 'seasonal'      // 시즌 이벤트 (크리스마스, 추석 등)
  | 'local'         // 지역 이벤트
  | 'store';        // 매장 자체 이벤트

/** 이벤트 영향 수준 */
export type ImpactLevel = 'high' | 'medium' | 'low';

/** 시간대 타입 */
export type TimeOfDay = 'morning' | 'afternoon' | 'evening' | 'night' | 'peak';

/** 요일 타입 */
export type DayOfWeek =
  | 'monday'
  | 'tuesday'
  | 'wednesday'
  | 'thursday'
  | 'friday'
  | 'saturday'
  | 'sunday';

/** 날씨 데이터 */
export interface WeatherData {
  date: string;
  condition: WeatherCondition;
  temperature: number;
  humidity: number;
  precipitation: number;
  windSpeed: number;
}

/** 휴일/이벤트 데이터 */
export interface HolidayEvent {
  id: string;
  date: string;
  eventName: string;
  eventType: EventType;
  impactLevel: ImpactLevel;
  description?: string;
  /** 이벤트별 영향 승수 */
  multipliers: {
    traffic: number;
    dwell: number;
    conversion: number;
    revenue: number;
  };
}

/** 시간대 정보 */
export interface TemporalContext {
  date: Date;
  dayOfWeek: DayOfWeek;
  isWeekend: boolean;
  timeOfDay: TimeOfDay;
  hour: number;
  /** 영업 시간대별 가중치 */
  businessHourWeight: number;
}

/** 영향도 승수 */
export interface ImpactMultipliers {
  traffic: number;
  dwell: number;
  conversion: number;
  revenue: number;
}

/** 날씨 영향도 상세 */
export interface WeatherImpact extends ImpactMultipliers {
  condition: WeatherCondition;
  severity: 'favorable' | 'neutral' | 'unfavorable' | 'severe';
  description: string;
  recommendations: string[];
}

/** 이벤트 영향도 상세 */
export interface EventImpact extends ImpactMultipliers {
  activeEvents: HolidayEvent[];
  dominantEvent?: HolidayEvent;
  eventScore: number;
  description: string;
  recommendations: string[];
}

/** 복합 환경 영향도 */
export interface EnvironmentImpact {
  weather: WeatherImpact;
  event: EventImpact;
  temporal: TemporalContext;
  /** 최종 복합 승수 */
  combined: ImpactMultipliers;
  /** 신뢰도 (0-1) */
  confidence: number;
  /** AI 프롬프트용 요약 */
  summary: string;
}

/** 환경 데이터 번들 (통합) */
export interface EnvironmentDataBundle {
  weather: WeatherData | null;
  events: HolidayEvent[];
  temporal: TemporalContext;
  impact: EnvironmentImpact;
  /** 데이터 품질 정보 */
  dataQuality: {
    hasWeatherData: boolean;
    hasEventData: boolean;
    weatherDataAge: number; // 일 단위
    lastUpdated: string;
  };
}

// ============================================================================
// 상수: 날씨별 영향도 매핑
// ============================================================================

const WEATHER_IMPACT_MAP: Record<
  WeatherCondition,
  { traffic: number; dwell: number; conversion: number; severity: WeatherImpact['severity'] }
> = {
  clear: { traffic: 1.15, dwell: 0.95, conversion: 1.05, severity: 'favorable' },
  sunny: { traffic: 1.15, dwell: 0.95, conversion: 1.05, severity: 'favorable' },
  cloudy: { traffic: 1.0, dwell: 1.0, conversion: 1.0, severity: 'neutral' },
  overcast: { traffic: 0.95, dwell: 1.05, conversion: 0.98, severity: 'neutral' },
  rain: { traffic: 0.7, dwell: 1.25, conversion: 1.1, severity: 'unfavorable' },
  heavy_rain: { traffic: 0.45, dwell: 1.4, conversion: 1.15, severity: 'severe' },
  drizzle: { traffic: 0.85, dwell: 1.1, conversion: 1.02, severity: 'unfavorable' },
  thunderstorm: { traffic: 0.35, dwell: 1.5, conversion: 1.2, severity: 'severe' },
  snow: { traffic: 0.65, dwell: 1.2, conversion: 1.05, severity: 'unfavorable' },
  heavy_snow: { traffic: 0.4, dwell: 1.4, conversion: 1.1, severity: 'severe' },
  fog: { traffic: 0.8, dwell: 1.1, conversion: 0.95, severity: 'unfavorable' },
  mist: { traffic: 0.9, dwell: 1.05, conversion: 0.98, severity: 'neutral' },
  haze: { traffic: 0.75, dwell: 1.0, conversion: 0.95, severity: 'unfavorable' },
  unknown: { traffic: 1.0, dwell: 1.0, conversion: 1.0, severity: 'neutral' },
};

// ============================================================================
// 상수: 이벤트별 영향도 매핑
// ============================================================================

const EVENT_IMPACT_MAP: Record<
  string,
  { traffic: number; dwell: number; conversion: number; revenue: number }
> = {
  // 주요 상업 이벤트
  black_friday: { traffic: 2.8, dwell: 0.7, conversion: 1.5, revenue: 2.5 },
  cyber_monday: { traffic: 1.2, dwell: 0.9, conversion: 1.3, revenue: 1.4 },
  christmas_eve: { traffic: 2.2, dwell: 0.75, conversion: 1.4, revenue: 2.0 },
  christmas: { traffic: 0.4, dwell: 1.0, conversion: 0.9, revenue: 0.5 },
  new_year_eve: { traffic: 1.8, dwell: 0.8, conversion: 1.3, revenue: 1.6 },
  new_year: { traffic: 0.5, dwell: 1.0, conversion: 0.95, revenue: 0.6 },

  // 한국 명절
  lunar_new_year: { traffic: 0.35, dwell: 1.0, conversion: 0.85, revenue: 0.4 },
  chuseok: { traffic: 0.35, dwell: 1.0, conversion: 0.85, revenue: 0.4 },
  seollal: { traffic: 0.35, dwell: 1.0, conversion: 0.85, revenue: 0.4 },

  // 세일 시즌
  summer_sale: { traffic: 1.7, dwell: 1.1, conversion: 1.25, revenue: 1.5 },
  winter_sale: { traffic: 1.7, dwell: 1.1, conversion: 1.25, revenue: 1.5 },
  end_of_season: { traffic: 1.5, dwell: 1.15, conversion: 1.3, revenue: 1.4 },

  // 일반 휴일
  national_holiday: { traffic: 1.4, dwell: 1.05, conversion: 1.1, revenue: 1.2 },
  public_holiday: { traffic: 1.3, dwell: 1.0, conversion: 1.05, revenue: 1.15 },

  // 기본값
  default: { traffic: 1.0, dwell: 1.0, conversion: 1.0, revenue: 1.0 },
};

// ============================================================================
// 상수: 영향도 수준별 승수
// ============================================================================

const IMPACT_LEVEL_MULTIPLIER: Record<ImpactLevel, number> = {
  high: 1.3,
  medium: 1.0,
  low: 0.7,
};

// ============================================================================
// 상수: 요일별 가중치
// ============================================================================

const DAY_OF_WEEK_WEIGHT: Record<DayOfWeek, number> = {
  monday: 0.75,
  tuesday: 0.8,
  wednesday: 0.85,
  thursday: 0.9,
  friday: 1.15,
  saturday: 1.45,
  sunday: 1.35,
};

// ============================================================================
// 상수: 시간대별 가중치
// ============================================================================

const TIME_OF_DAY_WEIGHT: Record<TimeOfDay, number> = {
  morning: 0.6,    // 09:00-12:00
  afternoon: 1.0,  // 12:00-17:00
  evening: 0.85,   // 17:00-21:00
  night: 0.3,      // 21:00-09:00
  peak: 1.4,       // 데이터 기반 피크
};

// ============================================================================
// 유틸리티 함수
// ============================================================================

/**
 * 날씨 조건 문자열을 정규화
 */
function normalizeWeatherCondition(condition: string | null): WeatherCondition {
  if (!condition) return 'unknown';

  const normalized = condition.toLowerCase().trim().replace(/\s+/g, '_');

  // 직접 매핑
  if (normalized in WEATHER_IMPACT_MAP) {
    return normalized as WeatherCondition;
  }

  // 유사 매핑
  const mappings: Record<string, WeatherCondition> = {
    'partly_cloudy': 'cloudy',
    'mostly_cloudy': 'overcast',
    'light_rain': 'drizzle',
    'shower': 'rain',
    'heavy_shower': 'heavy_rain',
    'light_snow': 'snow',
    'blizzard': 'heavy_snow',
    'storm': 'thunderstorm',
    'dust': 'haze',
    'smoke': 'haze',
    'clear_sky': 'clear',
    'few_clouds': 'cloudy',
    'scattered_clouds': 'cloudy',
    'broken_clouds': 'overcast',
  };

  return mappings[normalized] || 'unknown';
}

/**
 * 이벤트 이름을 키로 정규화
 */
function normalizeEventKey(eventName: string): string {
  return eventName
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '_')
    .replace(/[^a-z0-9_]/g, '');
}

/**
 * 현재 시간대 추출
 */
function getTimeOfDay(hour: number): TimeOfDay {
  if (hour >= 9 && hour < 12) return 'morning';
  if (hour >= 12 && hour < 17) return 'afternoon';
  if (hour >= 17 && hour < 21) return 'evening';
  return 'night';
}

/**
 * 요일 추출
 */
function getDayOfWeek(date: Date): DayOfWeek {
  const days: DayOfWeek[] = [
    'sunday',
    'monday',
    'tuesday',
    'wednesday',
    'thursday',
    'friday',
    'saturday',
  ];
  return days[date.getDay()];
}

// ============================================================================
// 핵심 함수: 날씨 영향도 계산
// ============================================================================

/**
 * 날씨 데이터로부터 정량적 영향도 계산
 *
 * @param weather - 날씨 데이터
 * @returns WeatherImpact - 트래픽/체류/전환/매출 영향도
 */
export function calculateWeatherImpact(weather: WeatherData | null): WeatherImpact {
  if (!weather) {
    return {
      condition: 'unknown',
      traffic: 1.0,
      dwell: 1.0,
      conversion: 1.0,
      revenue: 1.0,
      severity: 'neutral',
      description: '날씨 데이터 없음 - 기본값 적용',
      recommendations: [],
    };
  }

  const condition = normalizeWeatherCondition(weather.condition);
  const baseImpact = WEATHER_IMPACT_MAP[condition];

  // 기온 보정 (-5°C 이하 또는 35°C 이상일 경우 추가 패널티)
  let tempModifier = 1.0;
  if (weather.temperature < -5) {
    tempModifier = 0.85;
  } else if (weather.temperature < 0) {
    tempModifier = 0.92;
  } else if (weather.temperature > 35) {
    tempModifier = 0.88;
  } else if (weather.temperature > 30) {
    tempModifier = 0.95;
  } else if (weather.temperature >= 18 && weather.temperature <= 25) {
    tempModifier = 1.05; // 쾌적한 기온 보너스
  }

  // 습도 보정 (90% 이상일 경우 패널티)
  let humidityModifier = 1.0;
  if (weather.humidity > 90) {
    humidityModifier = 0.92;
  } else if (weather.humidity > 80) {
    humidityModifier = 0.96;
  }

  // 최종 영향도 계산
  const traffic = Math.round(baseImpact.traffic * tempModifier * humidityModifier * 100) / 100;
  const dwell = Math.round(baseImpact.dwell * 100) / 100;
  const conversion = Math.round(baseImpact.conversion * 100) / 100;
  const revenue = Math.round(traffic * conversion * 100) / 100;

  // 추천 사항 생성
  const recommendations: string[] = [];

  if (baseImpact.severity === 'unfavorable' || baseImpact.severity === 'severe') {
    recommendations.push('악천후로 인한 트래픽 감소 예상 - 체험형 상품 노출 강화');
    recommendations.push('실내 체류시간 증가 활용 - 고가 상품 시연 기회 확대');
  }

  if (weather.temperature < 5) {
    recommendations.push('한파 대비 - 겨울 의류/핫초코 등 시즌 상품 전면 배치');
  }

  if (weather.temperature > 30) {
    recommendations.push('폭염 대비 - 쿨링 상품/음료 입구 근처 배치');
  }

  // 설명 생성
  const description = generateWeatherDescription(condition, weather.temperature, traffic);

  return {
    condition,
    traffic,
    dwell,
    conversion,
    revenue,
    severity: baseImpact.severity,
    description,
    recommendations,
  };
}

/**
 * 날씨 설명 텍스트 생성
 */
function generateWeatherDescription(
  condition: WeatherCondition,
  temperature: number,
  trafficMultiplier: number
): string {
  const conditionKo: Record<WeatherCondition, string> = {
    clear: '맑음',
    sunny: '화창함',
    cloudy: '흐림',
    overcast: '잔뜩 흐림',
    rain: '비',
    heavy_rain: '폭우',
    drizzle: '이슬비',
    thunderstorm: '뇌우',
    snow: '눈',
    heavy_snow: '폭설',
    fog: '안개',
    mist: '옅은 안개',
    haze: '미세먼지/연무',
    unknown: '정보 없음',
  };

  const trafficImpact =
    trafficMultiplier >= 1.1
      ? '트래픽 증가 예상'
      : trafficMultiplier <= 0.7
        ? '트래픽 대폭 감소 예상'
        : trafficMultiplier <= 0.9
          ? '트래픽 다소 감소 예상'
          : '트래픽 평이';

  return `${conditionKo[condition]} (${temperature}°C) - ${trafficImpact} (${Math.round(trafficMultiplier * 100)}%)`;
}

// ============================================================================
// 핵심 함수: 이벤트 영향도 계산
// ============================================================================

/**
 * 이벤트 및 환경 조건을 종합하여 복합 영향도 계산
 *
 * @param events - 휴일/이벤트 목록
 * @param weather - 날씨 영향도
 * @param temporal - 시간대 정보
 * @returns EventImpact - 이벤트 영향도
 */
export function analyzeEventImpact(
  events: HolidayEvent[],
  weather: WeatherImpact,
  temporal: TemporalContext
): EventImpact {
  if (events.length === 0) {
    // 이벤트 없음 - 요일만 반영
    const dayWeight = DAY_OF_WEEK_WEIGHT[temporal.dayOfWeek];
    const timeWeight = TIME_OF_DAY_WEIGHT[temporal.timeOfDay];

    return {
      traffic: Math.round(dayWeight * timeWeight * 100) / 100,
      dwell: 1.0,
      conversion: temporal.isWeekend ? 1.08 : 1.0,
      revenue: Math.round(dayWeight * timeWeight * (temporal.isWeekend ? 1.08 : 1.0) * 100) / 100,
      activeEvents: [],
      dominantEvent: undefined,
      eventScore: 0,
      description: `이벤트 없음 - ${temporal.isWeekend ? '주말' : '평일'} ${temporal.dayOfWeek} 기준`,
      recommendations: temporal.isWeekend
        ? ['주말 쇼핑객 증가 - 인기 상품 노출 강화']
        : ['평일 고객 타겟팅 - 직장인 퇴근 시간대 집중'],
    };
  }

  // 이벤트별 영향도 계산
  const eventImpacts = events.map((event) => {
    const eventKey = normalizeEventKey(event.eventName);
    const baseImpact = EVENT_IMPACT_MAP[eventKey] || EVENT_IMPACT_MAP.default;
    const levelMultiplier = IMPACT_LEVEL_MULTIPLIER[event.impactLevel];

    return {
      event,
      impact: {
        traffic: baseImpact.traffic * levelMultiplier,
        dwell: baseImpact.dwell,
        conversion: baseImpact.conversion * levelMultiplier,
        revenue: baseImpact.revenue * levelMultiplier,
      },
      score: baseImpact.traffic * baseImpact.conversion * levelMultiplier,
    };
  });

  // 가장 영향력 큰 이벤트 선정
  const sortedByScore = [...eventImpacts].sort((a, b) => b.score - a.score);
  const dominant = sortedByScore[0];

  // 복합 이벤트 효과 (여러 이벤트가 겹칠 경우 시너지/상쇄)
  let combinedTraffic = dominant.impact.traffic;
  let combinedConversion = dominant.impact.conversion;
  let combinedRevenue = dominant.impact.revenue;

  // 추가 이벤트 효과 (감쇄 적용)
  for (let i = 1; i < sortedByScore.length; i++) {
    const additionalImpact = sortedByScore[i].impact;
    const dampingFactor = 0.3 / i; // 추가 이벤트 효과 감쇄

    combinedTraffic += (additionalImpact.traffic - 1) * dampingFactor;
    combinedConversion += (additionalImpact.conversion - 1) * dampingFactor;
    combinedRevenue += (additionalImpact.revenue - 1) * dampingFactor;
  }

  // 시간대/요일 가중치 적용
  const dayWeight = DAY_OF_WEEK_WEIGHT[temporal.dayOfWeek];
  const timeWeight = TIME_OF_DAY_WEIGHT[temporal.timeOfDay];

  combinedTraffic = Math.round(combinedTraffic * dayWeight * timeWeight * 100) / 100;
  combinedRevenue = Math.round(combinedRevenue * dayWeight * 100) / 100;

  // 이벤트 점수 (0-10)
  const eventScore = Math.min(10, Math.round(dominant.score * 3));

  // 추천 사항 생성
  const recommendations: string[] = [];

  if (dominant.impact.traffic > 1.5) {
    recommendations.push('높은 트래픽 예상 - 인기 상품 재고 확보 및 계산대 증원');
    recommendations.push('입구~중앙 동선 상품 배치 최적화');
  }

  if (dominant.impact.conversion > 1.2) {
    recommendations.push('전환율 상승 기회 - 고가 상품 노출 확대');
    recommendations.push('번들/세트 상품 전면 배치');
  }

  if (dominant.event.eventType === 'seasonal') {
    recommendations.push(`시즌 이벤트(${dominant.event.eventName}) - 관련 카테고리 상품 강조`);
  }

  // 설명 생성
  const eventNames = events.map((e) => e.eventName).join(', ');
  const description = `활성 이벤트: ${eventNames} (영향 점수: ${eventScore}/10)`;

  // 이벤트 객체에 계산된 승수 추가
  const activeEvents = events.map((event) => {
    const eventKey = normalizeEventKey(event.eventName);
    const baseImpact = EVENT_IMPACT_MAP[eventKey] || EVENT_IMPACT_MAP.default;
    const levelMultiplier = IMPACT_LEVEL_MULTIPLIER[event.impactLevel];

    return {
      ...event,
      multipliers: {
        traffic: Math.round(baseImpact.traffic * levelMultiplier * 100) / 100,
        dwell: Math.round(baseImpact.dwell * 100) / 100,
        conversion: Math.round(baseImpact.conversion * levelMultiplier * 100) / 100,
        revenue: Math.round(baseImpact.revenue * levelMultiplier * 100) / 100,
      },
    };
  });

  return {
    traffic: combinedTraffic,
    dwell: Math.round(dominant.impact.dwell * 100) / 100,
    conversion: Math.round(combinedConversion * 100) / 100,
    revenue: combinedRevenue,
    activeEvents,
    dominantEvent: activeEvents[0],
    eventScore,
    description,
    recommendations,
  };
}

// ============================================================================
// 🆕 실시간 API 호출 함수
// ============================================================================

// OpenWeatherMap condition → DB weather_condition 매핑
const WEATHER_CONDITION_MAP: Record<string, WeatherCondition> = {
  'Clear': 'clear',
  'Clouds': 'cloudy',
  'Rain': 'rain',
  'Drizzle': 'drizzle',
  'Snow': 'snow',
  'Thunderstorm': 'thunderstorm',
  'Mist': 'mist',
  'Fog': 'fog',
  'Haze': 'haze',
  'Smoke': 'haze',
  'Dust': 'haze',
};

/**
 * 매장 좌표 조회
 */
async function getStoreCoordinates(
  supabase: any,
  storeId: string
): Promise<{ lat: number; lon: number } | null> {
  try {
    const { data, error } = await supabase
      .from('stores')
      .select('latitude, longitude, address')
      .eq('id', storeId)
      .single();

    if (error || !data) {
      console.log(`[environmentLoader] Store coordinates not found for ${storeId}`);
      return null;
    }

    // 좌표가 있으면 사용
    if (data.latitude && data.longitude) {
      return { lat: data.latitude, lon: data.longitude };
    }

    return null;
  } catch (e) {
    console.error('[environmentLoader] Error fetching store coordinates:', e);
    return null;
  }
}

/**
 * OpenWeatherMap API 직접 호출
 */
async function fetchWeatherFromAPI(
  lat: number,
  lon: number
): Promise<WeatherData | null> {
  try {
    const apiKey = Deno.env.get('OPENWEATHERMAP_API_KEY');
    if (!apiKey) {
      console.log('[environmentLoader] OPENWEATHERMAP_API_KEY not set, skipping weather fetch');
      return null;
    }

    const url = new URL('https://api.openweathermap.org/data/2.5/weather');
    url.searchParams.set('lat', String(lat));
    url.searchParams.set('lon', String(lon));
    url.searchParams.set('appid', apiKey);
    url.searchParams.set('units', 'metric');
    url.searchParams.set('lang', 'kr');

    console.log(`[environmentLoader] 🌤️ Fetching weather from API for (${lat}, ${lon})`);

    const response = await fetch(url.toString());
    if (!response.ok) {
      console.error(`[environmentLoader] Weather API error: ${response.status}`);
      return null;
    }

    const data = await response.json();
    const rawCondition = data.weather?.[0]?.main || 'Clouds';
    const condition = WEATHER_CONDITION_MAP[rawCondition] || 'unknown';

    const weather: WeatherData = {
      date: new Date().toISOString().split('T')[0],
      condition,
      temperature: data.main?.temp ?? 20,
      humidity: data.main?.humidity ?? 50,
      precipitation: data.rain?.['1h'] || data.rain?.['3h'] || 0,
      windSpeed: data.wind?.speed ?? 0,
    };

    console.log(`[environmentLoader] ✅ Weather fetched: ${condition}, ${weather.temperature}°C`);
    return weather;
  } catch (e) {
    console.error('[environmentLoader] Weather API exception:', e);
    return null;
  }
}

/**
 * 날씨 데이터 DB 저장
 */
async function saveWeatherToDb(
  supabase: any,
  storeId: string,
  weather: WeatherData
): Promise<void> {
  try {
    const { error } = await supabase
      .from('weather_data')
      .upsert({
        store_id: storeId,
        date: weather.date,
        weather_condition: weather.condition,
        temperature: weather.temperature,
        humidity: weather.humidity,
        precipitation: weather.precipitation,
        wind_speed: weather.windSpeed,
        is_global: false,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'store_id,date',
        ignoreDuplicates: false,
      });

    if (error) {
      console.error('[environmentLoader] Weather DB save error:', error.message);
    } else {
      console.log('[environmentLoader] 💾 Weather saved to DB');
    }
  } catch (e) {
    console.error('[environmentLoader] Weather DB save exception:', e);
  }
}

/**
 * 공휴일 API 직접 호출 (data.go.kr)
 */
async function fetchHolidaysFromAPI(
  year: number,
  month: number
): Promise<HolidayEvent[]> {
  try {
    const apiKey = Deno.env.get('DATA_GO_KR_API_KEY');
    if (!apiKey) {
      console.log('[environmentLoader] DATA_GO_KR_API_KEY not set, skipping holidays fetch');
      return [];
    }

    const url = new URL('https://apis.data.go.kr/B090041/openapi/service/SpcdeInfoService/getRestDeInfo');
    url.searchParams.set('serviceKey', apiKey);
    url.searchParams.set('solYear', String(year));
    url.searchParams.set('solMonth', String(month).padStart(2, '0'));
    url.searchParams.set('_type', 'json');

    console.log(`[environmentLoader] 📅 Fetching holidays from API for ${year}-${month}`);

    const response = await fetch(url.toString());
    if (!response.ok) {
      console.error(`[environmentLoader] Holidays API error: ${response.status}`);
      return [];
    }

    const data = await response.json();
    const items = data.response?.body?.items?.item;
    const holidaysList = Array.isArray(items) ? items : items ? [items] : [];

    const shoppingHolidays = ['설날', '추석', '크리스마스', '어린이날', '어버이날'];

    const holidays: HolidayEvent[] = holidaysList.map((item: any) => {
      const dateStr = String(item.locdate);
      const formattedDate = `${dateStr.slice(0, 4)}-${dateStr.slice(4, 6)}-${dateStr.slice(6, 8)}`;
      const isShoppingHoliday = shoppingHolidays.some(h => item.dateName?.includes(h));

      return {
        id: `holiday-${formattedDate}`,
        date: formattedDate,
        eventName: item.dateName,
        eventType: 'holiday' as EventType,
        impactLevel: isShoppingHoliday ? 'high' as ImpactLevel : 'medium' as ImpactLevel,
        description: `공휴일: ${item.dateName}`,
        multipliers: {
          traffic: isShoppingHoliday ? 0.4 : 1.3,
          dwell: 1.0,
          conversion: isShoppingHoliday ? 0.9 : 1.05,
          revenue: isShoppingHoliday ? 0.5 : 1.15,
        },
      };
    });

    console.log(`[environmentLoader] ✅ Holidays fetched: ${holidays.length} items`);
    return holidays;
  } catch (e) {
    console.error('[environmentLoader] Holidays API exception:', e);
    return [];
  }
}

/**
 * 공휴일 데이터 DB 저장
 */
async function saveHolidaysToDb(
  supabase: any,
  holidays: HolidayEvent[]
): Promise<void> {
  if (holidays.length === 0) return;

  try {
    const records = holidays.map(h => ({
      date: h.date,
      event_name: h.eventName,
      event_type: h.eventType,
      impact_level: h.impactLevel,
      is_global: true,
      description: h.description,
      updated_at: new Date().toISOString(),
    }));

    const { error } = await supabase
      .from('holidays_events')
      .upsert(records, {
        onConflict: 'date,event_name',
      });

    if (error) {
      console.error('[environmentLoader] Holidays DB save error:', error.message);
    } else {
      console.log(`[environmentLoader] 💾 ${holidays.length} holidays saved to DB`);
    }
  } catch (e) {
    console.error('[environmentLoader] Holidays DB save exception:', e);
  }
}

// ============================================================================
// 핵심 함수: 환경 데이터 통합 로딩
// ============================================================================

/**
 * 환경 데이터 통합 로딩 및 영향도 분석
 *
 * 🆕 v2.1: DB에 데이터 없으면 실시간 API 호출
 *
 * @param supabase - Supabase 클라이언트
 * @param storeId - 매장 ID
 * @param targetDate - 대상 날짜 (기본: 오늘)
 * @returns EnvironmentDataBundle - 통합 환경 데이터
 */
export async function loadEnvironmentDataBundle(
  supabase: any,
  storeId: string,
  targetDate?: Date
): Promise<EnvironmentDataBundle> {
  const now = targetDate || new Date();

  // 🔧 한국 시간대(KST, UTC+9) 적용
  const kstOffset = 9 * 60 * 60 * 1000; // 9시간 in milliseconds
  const kstNow = new Date(now.getTime() + kstOffset);
  const dateStr = kstNow.toISOString().split('T')[0];
  const hour = kstNow.getUTCHours(); // KST 기준 시간

  console.log(`[environmentLoader] Loading environment data for store ${storeId}, date ${dateStr}, hour ${hour} (KST)`);

  // 시간대 정보 구성 (KST 기준)
  const dayOfWeek = getDayOfWeek(kstNow);
  const isWeekend = dayOfWeek === 'saturday' || dayOfWeek === 'sunday';
  const timeOfDay = getTimeOfDay(hour);

  const temporal: TemporalContext = {
    date: kstNow,
    dayOfWeek,
    isWeekend,
    timeOfDay,
    hour,
    businessHourWeight: TIME_OF_DAY_WEIGHT[timeOfDay] * DAY_OF_WEEK_WEIGHT[dayOfWeek],
  };

  // 병렬 데이터 로딩
  const [weatherResult, eventsResult] = await Promise.all([
    // 날씨 데이터 (해당 날짜 또는 최근 7일)
    supabase
      .from('weather_data')
      .select('*')
      .eq('store_id', storeId)
      .gte('date', new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0])
      .lte('date', dateStr)
      .order('date', { ascending: false })
      .limit(1),

    // 휴일/이벤트 데이터 (해당 날짜 ± 1일)
    supabase
      .from('holidays_events')
      .select('*')
      .or(`store_id.eq.${storeId},is_global.eq.true`)
      .gte('date', new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000).toISOString().split('T')[0])
      .lte('date', new Date(now.getTime() + 1 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]),
  ]);

  // 날씨 데이터 파싱
  let weather: WeatherData | null = null;
  let weatherDataAge = 0;
  let weatherFromApi = false;

  if (weatherResult.data && weatherResult.data.length > 0) {
    const w = weatherResult.data[0];
    weather = {
      date: w.date,
      condition: normalizeWeatherCondition(w.weather_condition),
      temperature: w.temperature ?? 20,
      humidity: w.humidity ?? 50,
      precipitation: w.precipitation ?? 0,
      windSpeed: w.wind_speed ?? 0,
    };

    // 데이터 나이 계산
    const dataDate = new Date(w.date);
    weatherDataAge = Math.floor((now.getTime() - dataDate.getTime()) / (24 * 60 * 60 * 1000));
  }

  // 🆕 날씨 데이터 없으면 실시간 API 호출
  if (!weather && WEATHER_API_CONFIG.enabled) {
    console.log('[environmentLoader] No weather data in DB, fetching from API...');

    // 매장 좌표 조회 또는 기본값 사용
    const coords = await getStoreCoordinates(supabase, storeId);
    const lat = coords?.lat ?? WEATHER_API_CONFIG.defaultLat;
    const lon = coords?.lon ?? WEATHER_API_CONFIG.defaultLon;

    weather = await fetchWeatherFromAPI(lat, lon);

    if (weather) {
      weatherFromApi = true;
      // DB에 저장 (캐싱)
      await saveWeatherToDb(supabase, storeId, weather);
    }
  }

  // 🆕 공휴일 데이터 없으면 실시간 API 호출
  let events: HolidayEvent[] = [];
  let eventsFromApi = false;

  const dbEvents = (eventsResult.data || [])
    .filter((e: any) => e.date === dateStr);

  if (dbEvents.length === 0 && HOLIDAYS_API_CONFIG.enabled) {
    console.log('[environmentLoader] No holidays in DB, fetching from API...');

    const apiHolidays = await fetchHolidaysFromAPI(kstNow.getFullYear(), kstNow.getMonth() + 1);

    if (apiHolidays.length > 0) {
      eventsFromApi = true;
      // DB에 저장
      await saveHolidaysToDb(supabase, apiHolidays);
      // 오늘 날짜 필터
      events = apiHolidays.filter(h => h.date === dateStr);
    }
  } else {
    events = dbEvents.map((e: any) => {
      const eventKey = normalizeEventKey(e.event_name);
      const baseImpact = EVENT_IMPACT_MAP[eventKey] || EVENT_IMPACT_MAP.default;
      const impactLevel = (e.impact_level as ImpactLevel) || 'medium';
      const levelMultiplier = IMPACT_LEVEL_MULTIPLIER[impactLevel];

      return {
        id: e.id,
        date: e.date,
        eventName: e.event_name,
        eventType: (e.event_type as EventType) || 'holiday',
        impactLevel,
        description: e.description,
        multipliers: {
          traffic: Math.round(baseImpact.traffic * levelMultiplier * 100) / 100,
          dwell: Math.round(baseImpact.dwell * 100) / 100,
          conversion: Math.round(baseImpact.conversion * levelMultiplier * 100) / 100,
          revenue: Math.round(baseImpact.revenue * levelMultiplier * 100) / 100,
        },
      };
    });
  }

  console.log(`[environmentLoader] Loaded: weather=${!!weather}${weatherFromApi ? ' (API)' : ''}, events=${events.length}${eventsFromApi ? ' (API)' : ''}`);

  // 영향도 계산
  const weatherImpact = calculateWeatherImpact(weather);
  const eventImpact = analyzeEventImpact(events, weatherImpact, temporal);

  // 복합 영향도 계산 (날씨 × 이벤트 시너지)
  const combinedTraffic = Math.round(weatherImpact.traffic * eventImpact.traffic * 100) / 100;
  const combinedDwell = Math.round(weatherImpact.dwell * eventImpact.dwell * 100) / 100;
  const combinedConversion = Math.round(weatherImpact.conversion * eventImpact.conversion * 100) / 100;
  const combinedRevenue = Math.round(combinedTraffic * combinedConversion * 100) / 100;

  // 신뢰도 계산 (데이터 완전성 기반)
  let confidence = 0.5; // 기본 신뢰도
  if (weather) confidence += 0.25;
  if (weatherDataAge === 0) confidence += 0.15;
  if (events.length > 0) confidence += 0.1;

  // AI 프롬프트용 요약 생성
  const summary = generateEnvironmentSummary(weatherImpact, eventImpact, temporal, {
    traffic: combinedTraffic,
    dwell: combinedDwell,
    conversion: combinedConversion,
    revenue: combinedRevenue,
  });

  const impact: EnvironmentImpact = {
    weather: weatherImpact,
    event: eventImpact,
    temporal,
    combined: {
      traffic: combinedTraffic,
      dwell: combinedDwell,
      conversion: combinedConversion,
      revenue: combinedRevenue,
    },
    confidence,
    summary,
  };

  return {
    weather,
    events,
    temporal,
    impact,
    dataQuality: {
      hasWeatherData: !!weather,
      hasEventData: events.length > 0,
      weatherDataAge,
      lastUpdated: new Date().toISOString(),
    },
  };
}

/**
 * AI 프롬프트용 환경 요약 생성
 */
function generateEnvironmentSummary(
  weather: WeatherImpact,
  event: EventImpact,
  temporal: TemporalContext,
  combined: ImpactMultipliers
): string {
  const parts: string[] = [];

  // 날씨 요약
  parts.push(`[날씨] ${weather.description}`);

  // 이벤트 요약
  if (event.activeEvents.length > 0) {
    parts.push(`[이벤트] ${event.description}`);
  } else {
    parts.push(`[이벤트] 특별 이벤트 없음`);
  }

  // 시간대 요약
  const timeKo: Record<TimeOfDay, string> = {
    morning: '오전',
    afternoon: '오후',
    evening: '저녁',
    night: '야간',
    peak: '피크',
  };
  const dayKo: Record<DayOfWeek, string> = {
    monday: '월요일',
    tuesday: '화요일',
    wednesday: '수요일',
    thursday: '목요일',
    friday: '금요일',
    saturday: '토요일',
    sunday: '일요일',
  };
  parts.push(`[시간] ${dayKo[temporal.dayOfWeek]} ${timeKo[temporal.timeOfDay]} (${temporal.isWeekend ? '주말' : '평일'})`);

  // 복합 영향도 요약
  parts.push(
    `[예상 영향] 트래픽 ${combined.traffic}x, 체류 ${combined.dwell}x, 전환 ${combined.conversion}x`
  );

  // 추천 사항 병합
  const allRecommendations = [...weather.recommendations, ...event.recommendations];
  if (allRecommendations.length > 0) {
    parts.push(`[추천] ${allRecommendations.slice(0, 3).join('; ')}`);
  }

  return parts.join('\n');
}

// ============================================================================
// 내보내기
// ============================================================================

export default {
  loadEnvironmentDataBundle,
  calculateWeatherImpact,
  analyzeEventImpact,
};
