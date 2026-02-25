/**
 * simulationEnvironment.types.ts
 *
 * 시뮬레이션 환경 설정 타입 정의
 * - 실시간 vs 시뮬레이션 모드
 * - 날씨, 날짜, 휴일 설정
 * - 영향도 계산
 */

// ============================================================================
// 기본 타입
// ============================================================================

// 환경 모드 (4가지)
export type EnvironmentMode =
  | 'realtime'    // 실시간 (현재 날씨/시간)
  | 'dateSelect'  // 날짜 선택 (해당 날짜 날씨/이벤트 자동)
  | 'manual'      // 직접 설정
  | 'simulation'; // 시뮬레이션 모드

// 날씨 조건 옵션
export type WeatherOption =
  | 'clear' // ☀️ 맑음
  | 'cloudy' // ☁️ 흐림
  | 'overcast' // 🌥️ 잔뜩 흐림
  | 'rain' // 🌧️ 비
  | 'heavyRain' // ⛈️ 폭우
  | 'snow' // ❄️ 눈
  | 'heavySnow' // 🌨️ 폭설
  | 'fog' // 🌫️ 안개
  | 'haze'; // 😷 미세먼지

// 요일 옵션
export type DayOfWeekOption =
  | 'monday'
  | 'tuesday'
  | 'wednesday'
  | 'thursday'
  | 'friday'
  | 'saturday'
  | 'sunday';

// 휴일/이벤트 옵션
export type HolidayOption =
  | 'none' // 평일
  | 'weekend' // 주말
  | 'holiday' // 일반 공휴일
  | 'christmas' // 크리스마스
  | 'lunarNewYear' // 설날
  | 'chuseok' // 추석
  | 'blackFriday' // 블랙프라이데이
  | 'summerSale' // 여름 세일
  | 'winterSale'; // 겨울 세일

// 시간대 옵션 (v4.0: 3개 - 오후/저녁/피크)
export type TimeOfDayOption = 'afternoon' | 'evening' | 'peak';

// ============================================================================
// 자동 로드 데이터 타입
// ============================================================================

export interface AutoLoadedWeatherData {
  condition: string;
  temperature: number;
  humidity: number;
  description: string;
}

export interface AutoLoadedEventData {
  name: string;
  type: 'holiday' | 'commercial' | 'event';
}

// ============================================================================
// 시뮬레이션 환경 설정 (개선된 구조)
// ============================================================================

export interface SimulationEnvironmentConfig {
  // 모드
  mode: EnvironmentMode;

  // 날짜 선택 모드용
  selectedDate: Date;

  // 직접 설정 모드용
  manualSettings: {
    weather: WeatherOption;
    timeOfDay: TimeOfDayOption;
    holidayType: HolidayOption;
  };

  // 자동 로드된 데이터 (읽기 전용)
  autoLoadedData?: {
    weather?: AutoLoadedWeatherData;
    events?: AutoLoadedEventData[];
  };

  // 계산된 영향도
  calculatedImpact: {
    trafficMultiplier: number;
    dwellTimeMultiplier: number;
    conversionMultiplier: number;
  };

  // === 레거시 호환용 (기존 코드 지원) ===
  // @deprecated - 새 코드에서는 manualSettings 또는 autoLoadedData 사용
  date?: Date;
  timeOfDay?: TimeOfDayOption;
  dayOfWeek?: DayOfWeekOption;
  weather?: WeatherOption;
  temperature?: number;
  humidity?: number;
  holidayType?: HolidayOption;
  customEventName?: string;
}

// ============================================================================
// 메타데이터: 날씨 옵션
// ============================================================================

export interface WeatherOptionMeta {
  value: WeatherOption;
  label: string;
  emoji: string;
  trafficImpact: number;
  dwellTimeImpact: number;
}

export const WEATHER_OPTIONS: WeatherOptionMeta[] = [
  { value: 'clear', label: '맑음', emoji: '☀️', trafficImpact: 1.1, dwellTimeImpact: 0.95 },
  { value: 'cloudy', label: '흐림', emoji: '☁️', trafficImpact: 1.0, dwellTimeImpact: 1.0 },
  { value: 'overcast', label: '잔뜩 흐림', emoji: '🌥️', trafficImpact: 0.95, dwellTimeImpact: 1.05 },
  { value: 'rain', label: '비', emoji: '🌧️', trafficImpact: 0.7, dwellTimeImpact: 1.25 },
  { value: 'heavyRain', label: '폭우', emoji: '⛈️', trafficImpact: 0.4, dwellTimeImpact: 1.5 },
  { value: 'snow', label: '눈', emoji: '❄️', trafficImpact: 0.65, dwellTimeImpact: 1.2 },
  { value: 'heavySnow', label: '폭설', emoji: '🌨️', trafficImpact: 0.4, dwellTimeImpact: 1.4 },
  { value: 'fog', label: '안개', emoji: '🌫️', trafficImpact: 0.85, dwellTimeImpact: 1.1 },
  { value: 'haze', label: '미세먼지', emoji: '😷', trafficImpact: 0.75, dwellTimeImpact: 1.0 },
];

// ============================================================================
// 메타데이터: 휴일 옵션
// ============================================================================

export interface HolidayOptionMeta {
  value: HolidayOption;
  label: string;
  emoji: string;
  trafficImpact: number;
  conversionImpact: number;
  categories?: string[];
}

export const HOLIDAY_OPTIONS: HolidayOptionMeta[] = [
  { value: 'none', label: '평일', emoji: '📅', trafficImpact: 1.0, conversionImpact: 1.0 },
  { value: 'weekend', label: '주말', emoji: '🎉', trafficImpact: 1.35, conversionImpact: 1.05 },
  { value: 'holiday', label: '공휴일', emoji: '🏖️', trafficImpact: 1.2, conversionImpact: 1.0 },
  {
    value: 'christmas',
    label: '크리스마스',
    emoji: '🎄',
    trafficImpact: 1.8,
    conversionImpact: 1.2,
    categories: ['선물', '의류'],
  },
  {
    value: 'lunarNewYear',
    label: '설날',
    emoji: '🧧',
    trafficImpact: 0.4,
    conversionImpact: 0.9,
    categories: ['한복', '선물세트'],
  },
  {
    value: 'chuseok',
    label: '추석',
    emoji: '🥮',
    trafficImpact: 0.4,
    conversionImpact: 0.9,
    categories: ['선물세트'],
  },
  {
    value: 'blackFriday',
    label: '블랙프라이데이',
    emoji: '🛒',
    trafficImpact: 2.5,
    conversionImpact: 1.3,
    categories: ['전체'],
  },
  {
    value: 'summerSale',
    label: '여름 세일',
    emoji: '🌴',
    trafficImpact: 1.6,
    conversionImpact: 1.15,
    categories: ['여름의류'],
  },
  {
    value: 'winterSale',
    label: '겨울 세일',
    emoji: '🧥',
    trafficImpact: 1.6,
    conversionImpact: 1.15,
    categories: ['겨울의류'],
  },
];

// ============================================================================
// 메타데이터: 요일 옵션
// ============================================================================

export interface DayOfWeekOptionMeta {
  value: DayOfWeekOption;
  label: string;
  shortLabel: string;
  trafficImpact: number;
}

export const DAY_OF_WEEK_OPTIONS: DayOfWeekOptionMeta[] = [
  { value: 'monday', label: '월요일', shortLabel: '월', trafficImpact: 0.8 },
  { value: 'tuesday', label: '화요일', shortLabel: '화', trafficImpact: 0.85 },
  { value: 'wednesday', label: '수요일', shortLabel: '수', trafficImpact: 0.9 },
  { value: 'thursday', label: '목요일', shortLabel: '목', trafficImpact: 0.95 },
  { value: 'friday', label: '금요일', shortLabel: '금', trafficImpact: 1.1 },
  { value: 'saturday', label: '토요일', shortLabel: '토', trafficImpact: 1.4 },
  { value: 'sunday', label: '일요일', shortLabel: '일', trafficImpact: 1.3 },
];

// ============================================================================
// 메타데이터: 시간대 옵션
// ============================================================================

export interface TimeOfDayOptionMeta {
  value: TimeOfDayOption;
  label: string;
  emoji: string;
  hours: string;
  trafficImpact: number;
}

export const TIME_OF_DAY_OPTIONS: TimeOfDayOptionMeta[] = [
  { value: 'afternoon', label: '오후', emoji: '☀️', hours: '09:00-18:00', trafficImpact: 1.0 },
  { value: 'evening', label: '저녁', emoji: '🌙', hours: '18:00-24:00', trafficImpact: 0.6 },
  { value: 'peak', label: '피크', emoji: '🔥', hours: '데이터 기반', trafficImpact: 1.5 },
];

// ============================================================================
// 헬퍼 함수
// ============================================================================

/**
 * Date 객체에서 요일 옵션 추출
 */
export function getDayOfWeekFromDate(date: Date): DayOfWeekOption {
  const days: DayOfWeekOption[] = [
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

/**
 * 날씨 옵션에서 설명 텍스트 가져오기
 */
export function getWeatherDescription(weather: WeatherOption): string {
  const meta = WEATHER_OPTIONS.find((w) => w.value === weather);
  return meta?.label || '맑음';
}

/**
 * 휴일 옵션에서 이름 가져오기
 */
export function getHolidayName(holiday: HolidayOption): string {
  const meta = HOLIDAY_OPTIONS.find((h) => h.value === holiday);
  return meta?.label || '';
}

/**
 * 날씨 조건에서 영향도 계산
 */
export function getWeatherImpactFromCondition(condition?: string): number {
  const impacts: Record<string, number> = {
    clear: 1.1, sunny: 1.1,
    clouds: 1.0, cloudy: 0.95,
    overcast: 0.95,
    rain: 0.7, drizzle: 0.8,
    thunderstorm: 0.4, heavyRain: 0.4,
    snow: 0.65, heavySnow: 0.4,
    mist: 0.85, fog: 0.85,
    haze: 0.75,
  };
  return impacts[condition?.toLowerCase() || ''] || 1.0;
}

/**
 * 시뮬레이션 환경 설정에서 영향도 계산 (개선된 버전)
 */
export function calculateSimulationImpacts(
  config: SimulationEnvironmentConfig,
  realTimeData?: { weather?: { condition: string }; isHoliday?: boolean; isWeekend?: boolean }
): {
  trafficMultiplier: number;
  dwellTimeMultiplier: number;
  conversionMultiplier: number;
} {
  let weatherImpact = 1.0;
  let holidayImpact = 1.0;
  let timeImpact = 1.0;
  let dwellTimeImpact = 1.0;
  let conversionImpact = 1.0;

  if (config.mode === 'manual') {
    // 직접 설정 모드: 선택한 값 사용
    const weatherMeta = WEATHER_OPTIONS.find((w) => w.value === config.manualSettings.weather);
    const holidayMeta = HOLIDAY_OPTIONS.find((h) => h.value === config.manualSettings.holidayType);
    const timeMeta = TIME_OF_DAY_OPTIONS.find((t) => t.value === config.manualSettings.timeOfDay);

    weatherImpact = weatherMeta?.trafficImpact || 1.0;
    dwellTimeImpact = weatherMeta?.dwellTimeImpact || 1.0;
    holidayImpact = holidayMeta?.trafficImpact || 1.0;
    conversionImpact = holidayMeta?.conversionImpact || 1.0;
    timeImpact = timeMeta?.trafficImpact || 1.0;
  } else if (config.mode === 'dateSelect' && config.autoLoadedData) {
    // 날짜 선택 모드: 자동 로드된 데이터 사용
    weatherImpact = getWeatherImpactFromCondition(config.autoLoadedData.weather?.condition);
    dwellTimeImpact = weatherImpact < 0.8 ? 1.2 : 1.0;
    holidayImpact = config.autoLoadedData.events?.length ? 1.3 : 1.0;
    conversionImpact = config.autoLoadedData.events?.some(e => e.type === 'commercial') ? 1.15 : 1.0;
  } else if (config.mode === 'realtime' && realTimeData) {
    // 실시간 모드: 현재 데이터 사용
    weatherImpact = getWeatherImpactFromCondition(realTimeData.weather?.condition);
    dwellTimeImpact = weatherImpact < 0.8 ? 1.2 : 1.0;
    holidayImpact = realTimeData.isHoliday ? 1.2 : (realTimeData.isWeekend ? 1.35 : 1.0);
    conversionImpact = realTimeData.isHoliday ? 1.1 : 1.0;
  } else {
    // 레거시 호환: 기존 필드 사용
    const weatherMeta = WEATHER_OPTIONS.find((w) => w.value === config.weather);
    const holidayMeta = HOLIDAY_OPTIONS.find((h) => h.value === config.holidayType);
    const dayMeta = DAY_OF_WEEK_OPTIONS.find((d) => d.value === config.dayOfWeek);
    const timeMeta = TIME_OF_DAY_OPTIONS.find((t) => t.value === config.timeOfDay);

    // 기온 영향 (레거시)
    let tempImpact = 1.0;
    if (config.temperature !== undefined) {
      if (config.temperature < 0) tempImpact = 0.85;
      else if (config.temperature > 33) tempImpact = 0.8;
      else if (config.temperature >= 18 && config.temperature <= 25) tempImpact = 1.05;
    }

    weatherImpact = (weatherMeta?.trafficImpact || 1) * tempImpact;
    dwellTimeImpact = weatherMeta?.dwellTimeImpact || 1;
    holidayImpact = (holidayMeta?.trafficImpact || 1) * (dayMeta?.trafficImpact || 1);
    conversionImpact = holidayMeta?.conversionImpact || 1;
    timeImpact = timeMeta?.trafficImpact || 1;
  }

  const trafficMultiplier = weatherImpact * holidayImpact * timeImpact;

  return {
    trafficMultiplier: Math.round(trafficMultiplier * 100) / 100,
    dwellTimeMultiplier: Math.round(dwellTimeImpact * 100) / 100,
    conversionMultiplier: Math.round(conversionImpact * 100) / 100,
  };
}

/**
 * 기본 시뮬레이션 환경 설정 생성 (개선된 버전)
 */
export function createDefaultSimulationConfig(): SimulationEnvironmentConfig {
  const now = new Date();
  return {
    mode: 'realtime',
    selectedDate: now,
    manualSettings: {
      weather: 'clear',
      timeOfDay: 'afternoon',
      holidayType: 'none',
    },
    calculatedImpact: {
      trafficMultiplier: 1.0,
      dwellTimeMultiplier: 1.0,
      conversionMultiplier: 1.0,
    },
    // 레거시 호환용
    date: now,
    timeOfDay: 'afternoon',
    dayOfWeek: getDayOfWeekFromDate(now),
    weather: 'clear',
    temperature: 20,
    humidity: 50,
    holidayType: 'none',
  };
}

/**
 * 설정에서 현재 유효한 날씨 값 추출 (모드에 따라)
 */
export function getEffectiveWeather(config: SimulationEnvironmentConfig): WeatherOption {
  if (config.mode === 'manual') {
    return config.manualSettings.weather;
  }
  if (config.mode === 'dateSelect' && config.autoLoadedData?.weather) {
    // API 응답 조건을 WeatherOption으로 매핑
    const conditionMapping: Record<string, WeatherOption> = {
      clear: 'clear', sunny: 'clear',
      clouds: 'cloudy', cloudy: 'cloudy',
      overcast: 'overcast',
      rain: 'rain', drizzle: 'rain',
      thunderstorm: 'heavyRain',
      snow: 'snow',
      mist: 'fog', fog: 'fog',
      haze: 'haze',
    };
    return conditionMapping[config.autoLoadedData.weather.condition.toLowerCase()] || 'clear';
  }
  // 레거시/실시간 모드
  return config.weather || 'clear';
}

/**
 * 설정에서 현재 유효한 시간대 값 추출 (모드에 따라)
 * v4.0: 3개 옵션 (afternoon/evening/peak)
 */
export function getEffectiveTimeOfDay(config: SimulationEnvironmentConfig): TimeOfDayOption {
  if (config.mode === 'manual') {
    return config.manualSettings.timeOfDay;
  }
  // dateSelect 또는 realtime 모드에서는 현재 시간 기반
  const hour = config.selectedDate?.getHours() || new Date().getHours();
  // 18시~6시: 저녁(밤), 6시~18시: 오후(낮)
  if (hour >= 18 || hour < 6) return 'evening';
  return 'afternoon';
}

/**
 * 설정에서 현재 유효한 휴일 값 추출 (모드에 따라)
 */
export function getEffectiveHoliday(config: SimulationEnvironmentConfig): HolidayOption {
  if (config.mode === 'manual') {
    return config.manualSettings.holidayType;
  }
  if (config.mode === 'dateSelect' && config.autoLoadedData?.events?.length) {
    // 이벤트 타입에 따라 매핑
    const event = config.autoLoadedData.events[0];
    if (event.type === 'holiday') return 'holiday';
    if (event.name?.includes('크리스마스')) return 'christmas';
    if (event.name?.includes('블랙프라이데이')) return 'blackFriday';
    return 'holiday';
  }
  // 레거시
  return config.holidayType || 'none';
}

// ============================================================================
// 3D 렌더링 설정 변환
// ============================================================================

/**
 * 시간대별 조명 프리셋 (v4.0: 3개 - 오후/저녁/피크)
 */
const TIME_OF_DAY_LIGHTING: Record<
  TimeOfDayOption,
  {
    ambientIntensity: number;
    ambientColor: string;
    directionalIntensity: number;
    directionalColor: string;
    directionalPosition: [number, number, number];
    environmentPreset: 'city' | 'sunset' | 'dawn' | 'night' | 'warehouse' | 'studio';
  }
> = {
  afternoon: {
    ambientIntensity: 0.6,
    ambientColor: '#ffffff',
    directionalIntensity: 1.0,
    directionalColor: '#ffffff',
    directionalPosition: [0, 20, 10],
    environmentPreset: 'city',
  },
  evening: {
    ambientIntensity: 0.2,
    ambientColor: '#334466',
    directionalIntensity: 0.1,
    directionalColor: '#6688aa',
    directionalPosition: [5, 15, 5],
    environmentPreset: 'night',
  },
  peak: {
    // 피크 시간은 데이터에 따라 동적으로 결정됨 (기본값: 낮 설정)
    ambientIntensity: 0.7,
    ambientColor: '#fffaf0',
    directionalIntensity: 1.1,
    directionalColor: '#fff8e7',
    directionalPosition: [0, 20, 10],
    environmentPreset: 'city',
  },
};

/**
 * 날씨별 파티클 설정
 */
function getWeatherParticles(
  weather: WeatherOption
): {
  enabled: boolean;
  type: 'rain' | 'snow' | 'dust' | 'none';
  count: number;
  speed: number;
  intensity: number;
} {
  switch (weather) {
    case 'rain':
      return { enabled: true, type: 'rain', count: 300, speed: 1.5, intensity: 0.7 };
    case 'heavyRain':
      return { enabled: true, type: 'rain', count: 500, speed: 2.0, intensity: 1.0 };
    case 'snow':
      return { enabled: true, type: 'snow', count: 200, speed: 0.3, intensity: 0.8 };
    case 'heavySnow':
      return { enabled: true, type: 'snow', count: 400, speed: 0.5, intensity: 1.0 };
    case 'haze':
      return { enabled: true, type: 'dust', count: 100, speed: 0.1, intensity: 0.3 };
    default:
      return { enabled: false, type: 'none', count: 0, speed: 0, intensity: 0 };
  }
}

/**
 * 날씨별 안개/대기 설정
 */
function getAtmosphericEffects(weather: WeatherOption): {
  enabled: boolean;
  fog: { enabled: boolean; color: string; density: number };
} {
  switch (weather) {
    case 'fog':
      return {
        enabled: true,
        fog: { enabled: true, color: '#cccccc', density: 0.03 },
      };
    case 'haze':
      return {
        enabled: true,
        fog: { enabled: true, color: '#ddddcc', density: 0.015 },
      };
    case 'rain':
    case 'heavyRain':
      return {
        enabled: true,
        fog: { enabled: true, color: '#aabbcc', density: 0.008 },
      };
    case 'snow':
    case 'heavySnow':
      return {
        enabled: true,
        fog: { enabled: true, color: '#eeeeff', density: 0.01 },
      };
    default:
      return {
        enabled: false,
        fog: { enabled: false, color: '#ffffff', density: 0 },
      };
  }
}

import type { RenderingConfig, TimeOfDay, SeasonType, WeatherCondition } from './environment.types';

// ============================================================================
// 시간대 → 낮/밤 판별 헬퍼 함수
// ============================================================================

/**
 * 시간대가 낮인지 판별
 * v4.0: afternoon → true (낮), evening → false (밤), peak → 데이터 기반
 * peak의 경우 기본값 false, isPeakDayTime으로 별도 판별 필요
 */
export function isDayTime(timeOfDay: TimeOfDayOption): boolean {
  return timeOfDay === 'afternoon';
}

/**
 * 시간대가 밤인지 판별
 * v4.0: evening → true (밤), afternoon → false (낮), peak → 데이터 기반
 * peak의 경우 기본값 true, isPeakDayTime으로 별도 판별 필요
 */
export function isNightTime(timeOfDay: TimeOfDayOption): boolean {
  return timeOfDay === 'evening' || timeOfDay === 'peak';
}

// ============================================================================
// 실시간 모드: 현재 시간 기반 낮/밤 판별
// ============================================================================

/**
 * 현재 시간이 낮인지 판별 (06:00 ~ 17:59)
 */
export function isCurrentTimeDayMode(): boolean {
  const now = new Date();
  const hour = now.getHours();
  return hour >= 6 && hour < 18;
}

/**
 * 현재 시간이 밤인지 판별 (18:00 ~ 05:59)
 */
export function isCurrentTimeNightMode(): boolean {
  return !isCurrentTimeDayMode();
}

/**
 * 피크 시간대가 낮인지 판별
 * @param peakHour 피크 시간 (0-23)
 * @returns 06:00~17:59면 true (낮), 18:00~05:59면 false (밤)
 */
export function isPeakDayTime(peakHour: number): boolean {
  return peakHour >= 6 && peakHour < 18;
}

/**
 * 시간대에 따른 낮/밤 판별 (피크 시간 데이터 포함)
 * @param timeOfDay 시간대 옵션
 * @param peakHour 피크 시간대일 경우 실제 피크 시간 (0-23), 없으면 현재 시간 기준
 */
export function isDayTimeWithPeakData(timeOfDay: TimeOfDayOption, peakHour?: number): boolean {
  if (timeOfDay === 'afternoon') return true;
  if (timeOfDay === 'evening') return false;
  // peak인 경우: 피크 시간 데이터가 있으면 그에 따라, 없으면 현재 시간 기준
  if (timeOfDay === 'peak') {
    if (peakHour !== undefined) {
      return isPeakDayTime(peakHour);
    }
    // 피크 시간 데이터가 없으면 현재 시간 기준
    return isCurrentTimeDayMode();
  }
  return true; // 기본값 낮
}

/**
 * TimeOfDayOption → TimeOfDay 변환
 * v4.0: 3개 옵션 (오후/저녁/피크)
 */
function convertTimeOfDay(time: TimeOfDayOption): TimeOfDay {
  const mapping: Record<TimeOfDayOption, TimeOfDay> = {
    afternoon: 'afternoon',
    evening: 'night',  // evening은 night으로 매핑
    peak: 'afternoon', // peak는 기본 afternoon으로 매핑 (데이터에 따라 동적 결정)
  };
  return mapping[time];
}

/**
 * WeatherOption → WeatherCondition 변환
 */
function convertWeatherCondition(weather: WeatherOption): WeatherCondition {
  const mapping: Record<WeatherOption, WeatherCondition> = {
    clear: 'clear',
    cloudy: 'clouds',
    overcast: 'clouds',
    rain: 'rain',
    heavyRain: 'thunderstorm',
    snow: 'snow',
    heavySnow: 'snow',
    fog: 'fog',
    haze: 'haze',
  };
  return mapping[weather];
}

/**
 * 현재 월에서 계절 추출
 */
function getSeasonFromDate(date: Date): SeasonType {
  const month = date.getMonth() + 1; // 0-indexed
  if (month >= 3 && month <= 5) return 'spring';
  if (month >= 6 && month <= 8) return 'summer';
  if (month >= 9 && month <= 11) return 'fall';
  return 'winter';
}

/**
 * SimulationEnvironmentConfig → RenderingConfig 변환
 * 3D 씬에서 사용할 렌더링 설정 생성 (개선된 버전)
 */
export function convertToRenderingConfig(config: SimulationEnvironmentConfig): RenderingConfig {
  // 모드에 따라 유효한 값 추출
  const effectiveWeather = getEffectiveWeather(config);
  const effectiveTimeOfDay = getEffectiveTimeOfDay(config);
  const effectiveHoliday = getEffectiveHoliday(config);

  const timeLighting = TIME_OF_DAY_LIGHTING[effectiveTimeOfDay];
  const weatherParticles = getWeatherParticles(effectiveWeather);
  const atmosphericEffects = getAtmosphericEffects(effectiveWeather);

  // 날씨에 따른 조명 조정
  let lightingModifier = 1.0;
  if (['rain', 'heavyRain', 'overcast'].includes(effectiveWeather)) {
    lightingModifier = 0.6;
  } else if (['cloudy', 'fog', 'haze'].includes(effectiveWeather)) {
    lightingModifier = 0.8;
  } else if (['snow', 'heavySnow'].includes(effectiveWeather)) {
    lightingModifier = 0.9;
  }

  return {
    lighting: {
      ambientIntensity: timeLighting.ambientIntensity * lightingModifier,
      ambientColor: timeLighting.ambientColor,
      directionalIntensity: timeLighting.directionalIntensity * lightingModifier,
      directionalColor: timeLighting.directionalColor,
      directionalPosition: timeLighting.directionalPosition,
      shadowEnabled: effectiveTimeOfDay !== 'evening',
      shadowIntensity: 0.3,
      fillLightEnabled: true,
      fillLightIntensity: 0.3,
      fillLightColor: '#aaccff',
      environmentPreset: timeLighting.environmentPreset,
      environmentIntensity: lightingModifier,
    },
    particles: {
      weatherParticles: {
        enabled: weatherParticles.enabled,
        type: weatherParticles.type === 'dust' ? 'none' : weatherParticles.type as 'rain' | 'snow' | 'none',
        count: weatherParticles.count,
        speed: weatherParticles.speed,
        intensity: weatherParticles.intensity,
      },
      atmosphericEffects: {
        enabled: atmosphericEffects.enabled,
        fog: {
          enabled: atmosphericEffects.fog.enabled,
          color: atmosphericEffects.fog.color,
          near: 10,
          far: 100,
          density: atmosphericEffects.fog.density,
        },
        dust: {
          enabled: weatherParticles.type === 'dust',
          intensity: weatherParticles.type === 'dust' ? weatherParticles.intensity : 0,
        },
      },
    },
    postProcessing: {
      bloom: {
        enabled: effectiveTimeOfDay === 'evening',
        intensity: effectiveTimeOfDay === 'evening' ? 0.4 : 0.2,
        threshold: 0.8,
        radius: 0.4,
      },
      vignette: {
        enabled: effectiveTimeOfDay === 'evening',
        intensity: 0.3,
      },
      colorCorrection: {
        enabled: true,
        saturation: 1.0,
        brightness: effectiveTimeOfDay === 'evening' ? 0.8 : 1.0,
        contrast: 1.0,
        temperature: effectiveTimeOfDay === 'evening' ? 0.1 : 0,
      },
      depthOfField: {
        enabled: false,
        focusDistance: 10,
        focalLength: 50,
        bokehScale: 2,
      },
    },
    timeOfDay: convertTimeOfDay(effectiveTimeOfDay),
    season: getSeasonFromDate(config.selectedDate || config.date || new Date()),
    weatherCondition: convertWeatherCondition(effectiveWeather),
    generatedAt: new Date().toISOString(),
    basedOn: {
      weather: true,
      holiday: effectiveHoliday !== 'none',
      event: config.mode === 'dateSelect' && (config.autoLoadedData?.events?.length ?? 0) > 0,
      timeOfDay: true,
    },
  };
}
