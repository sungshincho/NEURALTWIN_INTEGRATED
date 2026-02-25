/**
 * environment.types.ts
 *
 * 환경 데이터 타입 정의
 * - 날씨, 공휴일, 매장 이벤트 데이터
 * - 환경 영향도 계산
 * - 3D 렌더링 설정
 */

// ============================================================================
// 1. 날씨 데이터 (OpenWeatherMap API 기반)
// ============================================================================

export type WeatherCondition =
  | 'clear'
  | 'clouds'
  | 'rain'
  | 'drizzle'
  | 'thunderstorm'
  | 'snow'
  | 'mist'
  | 'fog'
  | 'haze';

export interface RealWeatherData {
  // 기본 날씨 정보
  condition: WeatherCondition;
  conditionCode: number; // OpenWeatherMap condition code
  description: string;
  icon: string;

  // 온도 (섭씨)
  temperature: number;
  feelsLike: number;
  tempMin: number;
  tempMax: number;

  // 기타 기상 정보
  humidity: number; // 0-100%
  pressure: number; // hPa
  visibility: number; // meters
  windSpeed: number; // m/s
  windDeg: number; // degrees
  clouds: number; // 0-100%

  // 강수량 (mm/h, 있을 경우)
  rain1h?: number;
  rain3h?: number;
  snow1h?: number;
  snow3h?: number;

  // 메타데이터
  timestamp: number; // Unix timestamp
  sunrise: number;
  sunset: number;
  timezone: number; // Shift in seconds from UTC
  cityName: string;
  countryCode: string;

  // 데이터 출처
  source: 'openweathermap';
  fetchedAt: string; // ISO timestamp
}

// ============================================================================
// 2. 공휴일 데이터
// ============================================================================

export type HolidayType =
  | 'national'      // 국경일
  | 'public'        // 공휴일
  | 'observance'    // 기념일 (휴무 아님)
  | 'weekend'       // 주말
  | 'special';      // 특별일 (블랙프라이데이 등)

export interface HolidayData {
  date: string; // YYYY-MM-DD
  name: string;
  localName?: string; // 현지어 이름
  type: HolidayType;
  isHoliday: boolean; // 실제 휴무일 여부
  countryCode: string;

  // 리테일 영향도 관련
  isShoppingHoliday: boolean; // 쇼핑 시즌 여부 (블랙프라이데이, 크리스마스 등)
  expectedTrafficMultiplier?: number; // 예상 트래픽 배율

  // 데이터 출처
  source: 'data-go-kr' | 'calendarific' | 'manual';
  fetchedAt: string;
}

// ============================================================================
// 3. 매장 이벤트 데이터 (DB store_events 테이블)
// ============================================================================

export type StoreEventType =
  | 'sale'           // 세일
  | 'promotion'      // 프로모션
  | 'launch'         // 신제품 출시
  | 'vip'            // VIP 이벤트
  | 'seasonal'       // 시즌 이벤트
  | 'collaboration'  // 콜라보레이션
  | 'popup'          // 팝업 스토어
  | 'special';       // 기타 특별 이벤트

export type EventStatus = 'scheduled' | 'active' | 'completed' | 'cancelled';

export interface StoreEventData {
  id: string;
  store_id: string;
  event_name: string;
  event_type: StoreEventType;
  description?: string;

  // 이벤트 기간
  start_date: string; // ISO timestamp
  end_date: string;

  // 영향도 파라미터
  expected_traffic_increase: number; // 예상 트래픽 증가율 (0.0 ~ 2.0)
  expected_conversion_boost: number; // 예상 전환율 증가 (0.0 ~ 1.0)
  discount_rate?: number; // 할인율 (0.0 ~ 1.0)

  // 상태
  status: EventStatus;

  // 메타데이터
  created_at: string;
  updated_at: string;
}

// ============================================================================
// 4. 환경 영향도 계산 결과
// ============================================================================

export interface EnvironmentImpact {
  // 트래픽 영향
  trafficMultiplier: number; // 기본 1.0

  // 체류 시간 영향
  dwellTimeMultiplier: number; // 기본 1.0

  // 전환율 영향
  conversionMultiplier: number; // 기본 1.0

  // 개별 요인별 영향도
  factors: {
    weather: {
      traffic: number;
      dwellTime: number;
      conversion: number;
      reason: string;
    };
    holiday: {
      traffic: number;
      dwellTime: number;
      conversion: number;
      reason: string;
    };
    event: {
      traffic: number;
      dwellTime: number;
      conversion: number;
      reason: string;
    };
    timeOfDay: {
      traffic: number;
      dwellTime: number;
      conversion: number;
      reason: string;
    };
  };

  // 종합 분석
  summary: string;
  confidence: number; // 0.0 ~ 1.0
}

// ============================================================================
// 5. 3D 렌더링 설정
// ============================================================================

export type TimeOfDay = 'dawn' | 'morning' | 'afternoon' | 'evening' | 'night';
export type SeasonType = 'spring' | 'summer' | 'fall' | 'winter';

export interface LightingConfig {
  // 주 조명
  ambientIntensity: number; // 0.0 ~ 1.0
  ambientColor: string; // hex color

  // 태양광/주 광원
  directionalIntensity: number;
  directionalColor: string;
  directionalPosition: [number, number, number];
  shadowEnabled: boolean;
  shadowIntensity: number;

  // 보조 조명
  fillLightEnabled: boolean;
  fillLightIntensity: number;
  fillLightColor: string;

  // 환경 맵
  environmentPreset: 'city' | 'sunset' | 'dawn' | 'night' | 'warehouse' | 'studio';
  environmentIntensity: number;
}

export interface ParticleConfig {
  // 날씨 파티클 (비, 눈 등)
  weatherParticles: {
    enabled: boolean;
    type: 'rain' | 'snow' | 'none';
    intensity: number; // 0.0 ~ 1.0
    speed: number;
    count: number;
  };

  // 먼지/안개 효과
  atmosphericEffects: {
    enabled: boolean;
    fog: {
      enabled: boolean;
      color: string;
      near: number;
      far: number;
      density: number;
    };
    dust: {
      enabled: boolean;
      intensity: number;
    };
  };
}

export interface PostProcessingConfig {
  // 블룸
  bloom: {
    enabled: boolean;
    intensity: number;
    threshold: number;
    radius: number;
  };

  // 비네트
  vignette: {
    enabled: boolean;
    intensity: number;
  };

  // 색보정
  colorCorrection: {
    enabled: boolean;
    saturation: number;
    brightness: number;
    contrast: number;
    temperature: number; // warm/cool shift
  };

  // 뎁스 오브 필드
  depthOfField: {
    enabled: boolean;
    focusDistance: number;
    focalLength: number;
    bokehScale: number;
  };
}

export interface RenderingConfig {
  lighting: LightingConfig;
  particles: ParticleConfig;
  postProcessing: PostProcessingConfig;

  // 씬 상태
  timeOfDay: TimeOfDay;
  season: SeasonType;
  weatherCondition: WeatherCondition;

  // 메타데이터
  generatedAt: string;
  basedOn: {
    weather: boolean;
    holiday: boolean;
    event: boolean;
    timeOfDay: boolean;
  };
}

// ============================================================================
// 6. 통합 환경 컨텍스트
// ============================================================================

export interface EnvironmentContext {
  // 현재 시간 정보
  currentTime: {
    timestamp: string; // ISO timestamp
    hour: number;
    dayOfWeek: number; // 0 = Sunday
    isWeekend: boolean;
    timeOfDay: TimeOfDay;
    season: SeasonType;
  };

  // 날씨 데이터
  weather: RealWeatherData | null;
  weatherLoading: boolean;
  weatherError: string | null;

  // 공휴일 데이터
  holiday: HolidayData | null;
  upcomingHolidays: HolidayData[];
  holidayLoading: boolean;
  holidayError: string | null;

  // 매장 이벤트
  activeEvents: StoreEventData[];
  upcomingEvents: StoreEventData[];
  eventsLoading: boolean;
  eventsError: string | null;

  // 계산된 영향도
  impact: EnvironmentImpact;

  // 렌더링 설정
  renderingConfig: RenderingConfig;

  // 데이터 상태
  isFullyLoaded: boolean;
  lastUpdated: string;
}

// ============================================================================
// 7. API 응답 타입 (외부 API Raw Response)
// ============================================================================

// OpenWeatherMap API Response
export interface OpenWeatherMapResponse {
  coord: {
    lon: number;
    lat: number;
  };
  weather: Array<{
    id: number;
    main: string;
    description: string;
    icon: string;
  }>;
  base: string;
  main: {
    temp: number;
    feels_like: number;
    temp_min: number;
    temp_max: number;
    pressure: number;
    humidity: number;
    sea_level?: number;
    grnd_level?: number;
  };
  visibility: number;
  wind: {
    speed: number;
    deg: number;
    gust?: number;
  };
  clouds: {
    all: number;
  };
  rain?: {
    '1h'?: number;
    '3h'?: number;
  };
  snow?: {
    '1h'?: number;
    '3h'?: number;
  };
  dt: number;
  sys: {
    type?: number;
    id?: number;
    country: string;
    sunrise: number;
    sunset: number;
  };
  timezone: number;
  id: number;
  name: string;
  cod: number;
}

// 공공데이터포털 공휴일 API Response
export interface DataGoKrHolidayResponse {
  response: {
    header: {
      resultCode: string;
      resultMsg: string;
    };
    body: {
      items: {
        item: Array<{
          dateKind: string;
          dateName: string;
          isHoliday: string;
          locdate: number; // YYYYMMDD
          seq: number;
        }>;
      };
      numOfRows: number;
      pageNo: number;
      totalCount: number;
    };
  };
}

// Calendarific API Response
export interface CalendarificResponse {
  meta: {
    code: number;
  };
  response: {
    holidays: Array<{
      name: string;
      description: string;
      country: {
        id: string;
        name: string;
      };
      date: {
        iso: string;
        datetime: {
          year: number;
          month: number;
          day: number;
        };
      };
      type: string[];
      primary_type: string;
      canonical_url: string;
      urlid: string;
      locations: string;
      states: string;
    }>;
  };
}

// ============================================================================
// 8. 서비스 설정 타입
// ============================================================================

export interface EnvironmentServiceConfig {
  // OpenWeatherMap
  weatherApiKey: string;
  weatherApiBaseUrl: string;
  weatherCacheMinutes: number;

  // 공휴일 API
  holidayApiKey?: string; // 공공데이터포털
  holidayCalendarificKey?: string;
  holidayCacheHours: number;

  // 기본 위치 (매장 위치)
  defaultLocation: {
    lat: number;
    lon: number;
    city: string;
    country: string;
  };

  // 업데이트 주기
  autoRefreshIntervalMs: number;
}

// ============================================================================
// 9. 에러 타입
// ============================================================================

export type EnvironmentDataError =
  | { type: 'WEATHER_API_ERROR'; message: string; statusCode?: number }
  | { type: 'HOLIDAY_API_ERROR'; message: string; statusCode?: number }
  | { type: 'EVENTS_DB_ERROR'; message: string }
  | { type: 'NETWORK_ERROR'; message: string }
  | { type: 'CONFIG_ERROR'; message: string }
  | { type: 'UNKNOWN_ERROR'; message: string };
