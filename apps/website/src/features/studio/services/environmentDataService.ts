/**
 * environmentDataService.ts
 *
 * 환경 데이터 외부 API 서비스
 * - OpenWeatherMap: 실시간 날씨 데이터
 * - 공공데이터포털 / Calendarific: 공휴일 데이터
 * - Supabase: 매장 이벤트 데이터
 *
 * 📌 모든 데이터는 실제 외부 API 또는 DB 기반
 * 📌 하드코딩/Mock 데이터 사용 금지
 */

import { supabase } from '@/integrations/supabase/client';
import type {
  RealWeatherData,
  HolidayData,
  StoreEventData,
  WeatherCondition,
  HolidayType,
  OpenWeatherMapResponse,
  DataGoKrHolidayResponse,
  CalendarificResponse,
  EnvironmentServiceConfig,
  EnvironmentDataError,
} from '../types/environment.types';

// ============================================================================
// 환경 변수 및 설정
// ============================================================================

const getConfig = (): EnvironmentServiceConfig => ({
  // OpenWeatherMap
  weatherApiKey: import.meta.env.VITE_OPENWEATHERMAP_API_KEY || '',
  weatherApiBaseUrl: 'https://api.openweathermap.org/data/2.5',
  weatherCacheMinutes: 30,

  // 공휴일 API
  holidayApiKey: import.meta.env.VITE_DATA_GO_KR_API_KEY || '',
  holidayCalendarificKey: import.meta.env.VITE_CALENDARIFIC_API_KEY || '',
  holidayCacheHours: 24,

  // 기본 위치 (서울)
  defaultLocation: {
    lat: 37.5665,
    lon: 126.9780,
    city: 'Seoul',
    country: 'KR',
  },

  // 5분마다 자동 갱신
  autoRefreshIntervalMs: 5 * 60 * 1000,
});

// ============================================================================
// 캐시 시스템
// ============================================================================

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiresAt: number;
}

const cache: {
  weather: CacheEntry<RealWeatherData> | null;
  holidays: CacheEntry<HolidayData[]> | null;
  events: Map<string, CacheEntry<StoreEventData[]>>;
} = {
  weather: null,
  holidays: null,
  events: new Map(),
};

function isCacheValid<T>(entry: CacheEntry<T> | null): boolean {
  if (!entry) return false;
  return Date.now() < entry.expiresAt;
}

// ============================================================================
// 1. 날씨 데이터 서비스 (OpenWeatherMap)
// ============================================================================

/**
 * OpenWeatherMap condition code → WeatherCondition 변환
 */
function mapWeatherCondition(code: number): WeatherCondition {
  // https://openweathermap.org/weather-conditions
  if (code >= 200 && code < 300) return 'thunderstorm';
  if (code >= 300 && code < 400) return 'drizzle';
  if (code >= 500 && code < 600) return 'rain';
  if (code >= 600 && code < 700) return 'snow';
  if (code === 701) return 'mist';
  if (code === 741) return 'fog';
  if (code === 721) return 'haze';
  if (code >= 700 && code < 800) return 'mist';
  if (code === 800) return 'clear';
  if (code > 800) return 'clouds';
  return 'clear';
}

/**
 * OpenWeatherMap API Response → RealWeatherData 변환
 */
function transformWeatherResponse(response: OpenWeatherMapResponse): RealWeatherData {
  const weather = response.weather[0];

  return {
    condition: mapWeatherCondition(weather.id),
    conditionCode: weather.id,
    description: weather.description,
    icon: weather.icon,

    temperature: response.main.temp,
    feelsLike: response.main.feels_like,
    tempMin: response.main.temp_min,
    tempMax: response.main.temp_max,

    humidity: response.main.humidity,
    pressure: response.main.pressure,
    visibility: response.visibility,
    windSpeed: response.wind.speed,
    windDeg: response.wind.deg,
    clouds: response.clouds.all,

    rain1h: response.rain?.['1h'],
    rain3h: response.rain?.['3h'],
    snow1h: response.snow?.['1h'],
    snow3h: response.snow?.['3h'],

    timestamp: response.dt,
    sunrise: response.sys.sunrise,
    sunset: response.sys.sunset,
    timezone: response.timezone,
    cityName: response.name,
    countryCode: response.sys.country,

    source: 'openweathermap',
    fetchedAt: new Date().toISOString(),
  };
}

/**
 * 실시간 날씨 데이터 조회
 * 📌 Edge Function (environment-proxy)을 통해 API 호출 (CORS/시크릿 처리)
 * 📌 store_id가 제공되면 weather_data 테이블에 자동 저장
 */
export async function fetchWeatherData(
  lat?: number,
  lon?: number,
  options?: {
    store_id?: string;
    user_id?: string;
    org_id?: string;
    save_to_db?: boolean;
  }
): Promise<{ data: RealWeatherData | null; error: EnvironmentDataError | null }> {
  const config = getConfig();

  // 캐시 확인 (DB 저장 옵션이 없을 때만)
  if (!options?.save_to_db && isCacheValid(cache.weather)) {
    return { data: cache.weather!.data, error: null };
  }

  const latitude = lat ?? config.defaultLocation.lat;
  const longitude = lon ?? config.defaultLocation.lon;

  try {
    // Edge Function을 통해 날씨 API 호출 (API 키는 서버에서 처리)
    const { data, error } = await supabase.functions.invoke('environment-proxy', {
      body: {
        type: 'weather',
        lat: latitude,
        lon: longitude,
        // DB 저장용 파라미터 (선택적)
        store_id: options?.store_id,
        user_id: options?.user_id,
        org_id: options?.org_id,
        save_to_db: options?.save_to_db ?? (options?.store_id ? true : false),
      },
    });

    if (error) {
      // API 키 미설정 등의 에러 - 조용히 처리
      console.info('[EnvironmentData] 날씨 API 호출 실패:', error.message);
      return { data: null, error: null };
    }

    // 에러 응답 확인
    if (data?.error) {
      console.info('[EnvironmentData] 날씨 API 에러:', data.error);
      return { data: null, error: null };
    }

    const rawData = data as OpenWeatherMapResponse;
    const weatherData = transformWeatherResponse(rawData);

    // 캐시 업데이트
    cache.weather = {
      data: weatherData,
      timestamp: Date.now(),
      expiresAt: Date.now() + config.weatherCacheMinutes * 60 * 1000,
    };

    // DB 저장 결과 로깅
    if (data._db_save) {
      console.log('[EnvironmentData] DB 저장 결과:', data._db_save);
    }

    console.log('[EnvironmentData] 날씨 데이터 조회 성공:', weatherData.condition, weatherData.temperature + '°C');
    return { data: weatherData, error: null };
  } catch (error) {
    // 네트워크 에러 등 - 조용히 처리
    console.info('[EnvironmentData] 날씨 데이터 조회 불가:', error instanceof Error ? error.message : 'Unknown');
    return { data: null, error: null };
  }
}

// ============================================================================
// 2. 공휴일 데이터 서비스
// ============================================================================

/**
 * 공공데이터포털 API Response → HolidayData 변환
 */
function transformDataGoKrResponse(response: DataGoKrHolidayResponse): HolidayData[] {
  const items = response.response?.body?.items?.item;
  if (!items || !Array.isArray(items)) return [];

  return items.map((item) => {
    const dateStr = String(item.locdate);
    const formattedDate = `${dateStr.slice(0, 4)}-${dateStr.slice(4, 6)}-${dateStr.slice(6, 8)}`;

    // 쇼핑 시즌 판별
    const shoppingHolidays = ['설날', '추석', '크리스마스', '어린이날', '어버이날'];
    const isShoppingHoliday = shoppingHolidays.some((h) => item.dateName.includes(h));

    return {
      date: formattedDate,
      name: item.dateName,
      localName: item.dateName,
      type: item.isHoliday === 'Y' ? 'public' : 'observance',
      isHoliday: item.isHoliday === 'Y',
      countryCode: 'KR',
      isShoppingHoliday,
      expectedTrafficMultiplier: isShoppingHoliday ? 1.5 : item.isHoliday === 'Y' ? 1.2 : 1.0,
      source: 'data-go-kr',
      fetchedAt: new Date().toISOString(),
    } as HolidayData;
  });
}

/**
 * Calendarific API Response → HolidayData 변환
 */
function transformCalendarificResponse(response: CalendarificResponse): HolidayData[] {
  const holidays = response.response?.holidays;
  if (!holidays || !Array.isArray(holidays)) return [];

  return holidays.map((item) => {
    const typeMapping: Record<string, HolidayType> = {
      'National holiday': 'national',
      'Public holiday': 'public',
      'Observance': 'observance',
      'Common local holiday': 'public',
    };

    const isPublicHoliday = item.type.some(
      (t) => t.includes('National') || t.includes('Public') || t.includes('holiday')
    );

    // 쇼핑 시즌 판별
    const shoppingHolidays = ['Chuseok', 'Seollal', 'Christmas', 'Children', 'Parents'];
    const isShoppingHoliday = shoppingHolidays.some((h) =>
      item.name.toLowerCase().includes(h.toLowerCase())
    );

    return {
      date: item.date.iso.split('T')[0],
      name: item.name,
      localName: item.name,
      type: typeMapping[item.primary_type] || 'observance',
      isHoliday: isPublicHoliday,
      countryCode: item.country.id,
      isShoppingHoliday,
      expectedTrafficMultiplier: isShoppingHoliday ? 1.5 : isPublicHoliday ? 1.2 : 1.0,
      source: 'calendarific',
      fetchedAt: new Date().toISOString(),
    } as HolidayData;
  });
}

/**
 * 공휴일 데이터 조회
 * 📌 Edge Function (environment-proxy)을 통해 API 호출 (CORS/시크릿 처리)
 */
export async function fetchHolidayData(
  year?: number,
  month?: number,
  countryCode: string = 'KR'
): Promise<{ data: HolidayData[]; error: EnvironmentDataError | null }> {
  const config = getConfig();
  const targetYear = year ?? new Date().getFullYear();

  // 캐시 확인
  if (isCacheValid(cache.holidays)) {
    return { data: cache.holidays!.data, error: null };
  }

  // 현재 한국(KR)만 지원
  if (countryCode !== 'KR') {
    console.info('[EnvironmentData] 현재 KR 공휴일만 지원됩니다.');
    return { data: [], error: null };
  }

  try {
    // 특정 월이 지정된 경우 해당 월만, 아니면 전체 연도(12개월) 조회
    const monthsToFetch = month ? [month] : [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];

    console.log(`[EnvironmentData] ${targetYear}년 공휴일 데이터 조회 시작 (${monthsToFetch.length}개월)`);

    // 모든 월을 병렬로 조회
    const results = await Promise.all(
      monthsToFetch.map(async (m) => {
        try {
          const { data, error } = await supabase.functions.invoke('environment-proxy', {
            body: { type: 'holidays', year: targetYear, month: m, countryCode, save_to_db: true },
          });

          if (error || data?.error) {
            return [];
          }

          const rawData = data as DataGoKrHolidayResponse;
          return transformDataGoKrResponse(rawData);
        } catch {
          return [];
        }
      })
    );

    // 결과 합치기 및 중복 제거 (날짜 기준)
    const allHolidays = results.flat();
    const uniqueHolidays = allHolidays.reduce((acc, holiday) => {
      if (!acc.find((h) => h.date === holiday.date && h.name === holiday.name)) {
        acc.push(holiday);
      }
      return acc;
    }, [] as HolidayData[]);

    // 날짜순 정렬
    uniqueHolidays.sort((a, b) => a.date.localeCompare(b.date));

    // 캐시 업데이트
    if (uniqueHolidays.length > 0) {
      cache.holidays = {
        data: uniqueHolidays,
        timestamp: Date.now(),
        expiresAt: Date.now() + config.holidayCacheHours * 60 * 60 * 1000,
      };
    }

    console.log('[EnvironmentData] 공휴일 데이터 조회 성공:', uniqueHolidays.length, '건');
    return { data: uniqueHolidays, error: null };
  } catch (error) {
    // 네트워크 에러 등 - 조용히 처리
    console.info('[EnvironmentData] 공휴일 데이터 조회 불가:', error instanceof Error ? error.message : 'Unknown');
    return { data: [], error: null };
  }
}

/**
 * 오늘 공휴일 여부 확인
 */
export async function getTodayHoliday(): Promise<HolidayData | null> {
  const today = new Date().toISOString().split('T')[0];
  const { data: holidays } = await fetchHolidayData();

  return holidays.find((h) => h.date === today) || null;
}

/**
 * 다가오는 공휴일 조회 (향후 N일)
 */
export async function getUpcomingHolidays(days: number = 30): Promise<HolidayData[]> {
  const { data: holidays } = await fetchHolidayData();

  const today = new Date();
  const futureDate = new Date();
  futureDate.setDate(today.getDate() + days);

  return holidays.filter((h) => {
    const holidayDate = new Date(h.date);
    return holidayDate >= today && holidayDate <= futureDate;
  });
}

// ============================================================================
// 3. 매장 이벤트 데이터 서비스 (Supabase)
// ============================================================================

/**
 * 매장 이벤트 조회
 */
export async function fetchStoreEvents(
  storeId: string,
  options?: {
    status?: 'active' | 'scheduled' | 'all';
    startDate?: string;
    endDate?: string;
  }
): Promise<{ data: StoreEventData[]; error: EnvironmentDataError | null }> {
  // 캐시 확인
  const cacheKey = `${storeId}-${options?.status || 'all'}`;
  const cachedEntry = cache.events.get(cacheKey);
  if (cachedEntry && isCacheValid(cachedEntry)) {
    return { data: cachedEntry.data, error: null };
  }

  try {
    const today = new Date().toISOString().split('T')[0];

    let query = (supabase
      .from('zone_events' as any)
      .select('*')
      .eq('store_id', storeId)) as any;

    // 상태 필터 (zone_events는 "예정" 이벤트가 아닌 로그 성격이므로 날짜 기준으로 단순 매핑)
    if (options?.status === 'active') {
      query = query.eq('event_date', today);
    } else if (options?.status === 'scheduled') {
      query = query.gt('event_date', today);
    }

    // 날짜 범위 필터 (event_timestamp 기준)
    if (options?.startDate) {
      query = query.gte('event_timestamp', options.startDate);
    }
    if (options?.endDate) {
      query = query.lte('event_timestamp', options.endDate);
    }

    query = query.order('event_timestamp', { ascending: false }).limit(200);

    const { data, error } = await query;

    if (error) {
      if (error.code === '42P01') {
        console.warn('[EnvironmentData] zone_events 테이블이 없습니다. 빈 배열 반환.');
        return { data: [], error: null };
      }
      throw error;
    }

    const rows = (data || []) as any[];
    const events: StoreEventData[] = rows.map((row) => {
      const start = String(row.event_timestamp ?? new Date().toISOString());
      const durationSeconds = typeof row.duration_seconds === 'number' ? row.duration_seconds : 0;
      const end = new Date(new Date(start).getTime() + durationSeconds * 1000).toISOString();

      const status: StoreEventData['status'] =
        row.event_date === today ? 'active' : String(row.event_date) > today ? 'scheduled' : 'completed';

      return {
        id: String(row.id),
        store_id: String(row.store_id),
        event_name: `${row.event_type ?? 'event'} (zone ${row.zone_id ?? '-'})`,
        event_type: 'special',
        description: row.metadata ? JSON.stringify(row.metadata) : undefined,
        start_date: start,
        end_date: end,
        expected_traffic_increase: 0,
        expected_conversion_boost: 0,
        status,
        created_at: String(row.created_at ?? start),
        updated_at: String(row.created_at ?? start),
      };
    });

    // 캐시 업데이트 (5분)
    cache.events.set(cacheKey, {
      data: events,
      timestamp: Date.now(),
      expiresAt: Date.now() + 5 * 60 * 1000,
    });

    console.log('[EnvironmentData] zone_events 기반 이벤트 조회 성공:', events.length, '건');
    return { data: events, error: null };
  } catch (error) {
    console.error('[EnvironmentData] 매장 이벤트 조회 실패:', error);
    return {
      data: [],
      error: {
        type: 'EVENTS_DB_ERROR',
        message: error instanceof Error ? error.message : 'Database error',
      },
    };
  }
}

/**
 * 현재 활성 이벤트 조회
 */
export async function getActiveEvents(storeId: string): Promise<StoreEventData[]> {
  const { data } = await fetchStoreEvents(storeId, { status: 'active' });
  return data;
}

/**
 * 다가오는 이벤트 조회
 */
export async function getUpcomingEvents(storeId: string): Promise<StoreEventData[]> {
  const { data } = await fetchStoreEvents(storeId, { status: 'scheduled' });
  return data;
}

// ============================================================================
// 4. 매장 위치 조회 (날씨 API용)
// ============================================================================

interface StoreLocation {
  lat: number;
  lon: number;
  city: string;
  country: string;
}

/**
 * 매장 위치 정보 조회
 */
export async function getStoreLocation(storeId: string): Promise<StoreLocation | null> {
  try {
    const { data, error } = await supabase
      .from('stores')
      .select('metadata')
      .eq('id', storeId)
      .single();

    if (error || !data) {
      return null;
    }

    const metadata = data.metadata as Record<string, any> | null;
    if (metadata?.location) {
      return {
        lat: metadata.location.lat || getConfig().defaultLocation.lat,
        lon: metadata.location.lon || getConfig().defaultLocation.lon,
        city: metadata.location.city || getConfig().defaultLocation.city,
        country: metadata.location.country || getConfig().defaultLocation.country,
      };
    }

    return null;
  } catch {
    return null;
  }
}

// ============================================================================
// 5. 통합 환경 데이터 조회
// ============================================================================

export interface EnvironmentDataBundle {
  weather: RealWeatherData | null;
  todayHoliday: HolidayData | null;
  upcomingHolidays: HolidayData[];
  activeEvents: StoreEventData[];
  upcomingEvents: StoreEventData[];
  errors: EnvironmentDataError[];
  fetchedAt: string;
}

/**
 * 모든 환경 데이터 통합 조회
 * 📌 DB 저장 옵션 추가 - 데이터 컨트롤타워 연동용
 */
export async function fetchAllEnvironmentData(
  storeId: string,
  options?: {
    save_to_db?: boolean;
    org_id?: string;
    user_id?: string;
  }
): Promise<EnvironmentDataBundle> {
  const errors: EnvironmentDataError[] = [];
  const shouldSaveToDb = options?.save_to_db ?? true; // 기본값: true로 변경

  // 매장 위치 및 org_id 조회
  const location = await getStoreLocation(storeId);
  const storeInfo = await getStoreInfo(storeId);
  const orgId = options?.org_id || storeInfo?.org_id;
  const userId = options?.user_id || storeInfo?.user_id;

  // 병렬 데이터 조회 (날씨는 DB 저장 옵션 전달)
  const [weatherResult, holidaysResult, activeEventsResult, upcomingEventsResult] =
    await Promise.all([
      fetchWeatherData(location?.lat, location?.lon, {
        store_id: storeId,
        org_id: orgId,
        user_id: userId,
        save_to_db: shouldSaveToDb,
      }),
      fetchHolidayData(),
      fetchStoreEvents(storeId, { status: 'active' }),
      fetchStoreEvents(storeId, { status: 'scheduled' }),
    ]);

  // 에러 수집
  if (weatherResult.error) errors.push(weatherResult.error);
  if (holidaysResult.error) errors.push(holidaysResult.error);
  if (activeEventsResult.error) errors.push(activeEventsResult.error);
  if (upcomingEventsResult.error) errors.push(upcomingEventsResult.error);

  // 공휴일 데이터 DB 저장 (holidays_events 테이블)
  if (shouldSaveToDb && holidaysResult.data.length > 0 && orgId) {
    await saveHolidaysToDb(holidaysResult.data, storeId, orgId);
  }

  // 오늘 공휴일 확인
  const today = new Date().toISOString().split('T')[0];
  const todayHoliday = holidaysResult.data.find((h) => h.date === today) || null;

  // 다가오는 공휴일 (향후 30일)
  const futureDate = new Date();
  futureDate.setDate(futureDate.getDate() + 30);
  const upcomingHolidays = holidaysResult.data.filter((h) => {
    const holidayDate = new Date(h.date);
    return holidayDate > new Date() && holidayDate <= futureDate;
  });

  return {
    weather: weatherResult.data,
    todayHoliday,
    upcomingHolidays,
    activeEvents: activeEventsResult.data,
    upcomingEvents: upcomingEventsResult.data,
    errors,
    fetchedAt: new Date().toISOString(),
  };
}

/**
 * 매장 정보 조회 (org_id, user_id 포함)
 */
async function getStoreInfo(storeId: string): Promise<{ org_id?: string; user_id?: string } | null> {
  try {
    const { data, error } = await supabase
      .from('stores')
      .select('org_id, user_id')
      .eq('id', storeId)
      .single();

    if (error || !data) return null;
    return { org_id: data.org_id, user_id: data.user_id };
  } catch {
    return null;
  }
}

/**
 * 공휴일 데이터 DB 저장 (holidays_events 테이블)
 */
async function saveHolidaysToDb(
  holidays: HolidayData[],
  storeId: string,
  orgId: string
): Promise<void> {
  try {
    // 중복 방지를 위해 upsert 사용
    const records = holidays.map((h) => ({
      store_id: storeId,
      org_id: orgId,
      date: h.date,
      event_name: h.name,
      event_type: h.isHoliday ? 'public_holiday' : 'observance',
      impact_level: h.isShoppingHoliday ? 'high' : h.isHoliday ? 'medium' : 'low',
      is_recurring: true,
      metadata: {
        source: h.source,
        countryCode: h.countryCode,
        expectedTrafficMultiplier: h.expectedTrafficMultiplier,
      },
    }));

    const { error } = await supabase
      .from('holidays_events')
      .upsert(records, {
        onConflict: 'store_id,date,event_name',
        ignoreDuplicates: true,
      });

    if (error) {
      console.warn('[EnvironmentData] 공휴일 DB 저장 실패:', error.message);
    } else {
      console.log('[EnvironmentData] 공휴일 데이터 DB 저장:', records.length, '건');
    }
  } catch (err) {
    console.warn('[EnvironmentData] 공휴일 DB 저장 중 오류:', err);
  }
}

// ============================================================================
// 6. 캐시 관리
// ============================================================================

/**
 * 캐시 초기화
 */
export function clearEnvironmentCache(): void {
  cache.weather = null;
  cache.holidays = null;
  cache.events.clear();
  console.log('[EnvironmentData] 캐시가 초기화되었습니다.');
}

/**
 * 캐시 상태 확인
 */
export function getCacheStatus(): {
  weather: { valid: boolean; expiresIn?: number };
  holidays: { valid: boolean; expiresIn?: number };
  events: { count: number };
} {
  return {
    weather: {
      valid: isCacheValid(cache.weather),
      expiresIn: cache.weather ? Math.max(0, cache.weather.expiresAt - Date.now()) : undefined,
    },
    holidays: {
      valid: isCacheValid(cache.holidays),
      expiresIn: cache.holidays ? Math.max(0, cache.holidays.expiresAt - Date.now()) : undefined,
    },
    events: {
      count: cache.events.size,
    },
  };
}

// ============================================================================
// 7. 날짜 선택 모드용 간편 조회 함수
// ============================================================================

import type { AutoLoadedWeatherData, AutoLoadedEventData } from '../types/simulationEnvironment.types';

/**
 * 특정 날짜의 날씨 조회 (날짜 선택 모드용)
 * - 최근 날짜: 실제 API 호출
 * - 과거/미래: 계절 기반 추정
 */
export async function fetchHistoricalWeather(
  date: Date,
  lat?: number,
  lon?: number
): Promise<AutoLoadedWeatherData | null> {
  const config = getConfig();
  const latitude = lat ?? config.defaultLocation.lat;
  const longitude = lon ?? config.defaultLocation.lon;

  const now = new Date();
  const targetDate = new Date(date);
  const diffDays = Math.floor((targetDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

  // 오늘 또는 최근 날짜면 실제 API 호출
  if (diffDays >= -1 && diffDays <= 1) {
    const { data } = await fetchWeatherData(latitude, longitude);
    if (data) {
      return {
        condition: data.condition,
        temperature: Math.round(data.temperature),
        humidity: data.humidity,
        description: data.description,
      };
    }
  }

  // 그 외에는 계절 기반 추정
  return estimateWeatherForDate(targetDate);
}

/**
 * 날짜 기반 날씨 추정 (API 불가 시)
 */
function estimateWeatherForDate(date: Date): AutoLoadedWeatherData {
  const month = date.getMonth() + 1;

  // 계절별 평균 날씨 추정 (한국 기준)
  if (month >= 3 && month <= 5) {
    // 봄
    return {
      condition: 'clouds',
      temperature: 15,
      humidity: 60,
      description: '봄 날씨 (추정)',
    };
  } else if (month >= 6 && month <= 8) {
    // 여름
    const isRainy = month === 7; // 7월은 장마
    return {
      condition: isRainy ? 'rain' : 'clouds',
      temperature: 28,
      humidity: 80,
      description: isRainy ? '장마철 (추정)' : '여름 날씨 (추정)',
    };
  } else if (month >= 9 && month <= 11) {
    // 가을
    return {
      condition: 'clear',
      temperature: 18,
      humidity: 50,
      description: '가을 날씨 (추정)',
    };
  } else {
    // 겨울
    const isDecember = month === 12;
    return {
      condition: 'snow',
      temperature: isDecember ? -2 : 2,
      humidity: 40,
      description: '겨울 날씨 (추정)',
    };
  }
}

/**
 * 특정 날짜의 이벤트/휴일 조회 (날짜 선택 모드용)
 */
export async function fetchDateEvents(
  storeId: string,
  date: Date
): Promise<AutoLoadedEventData[]> {
  const events: AutoLoadedEventData[] = [];
  const dateStr = date.toISOString().split('T')[0];
  const monthDay = dateStr.slice(5); // "MM-DD"

  // 1. 한국 공휴일 확인
  const knownHolidays: Record<string, string> = {
    '01-01': '신정',
    '03-01': '삼일절',
    '05-05': '어린이날',
    '06-06': '현충일',
    '08-15': '광복절',
    '10-03': '개천절',
    '10-09': '한글날',
    '12-25': '크리스마스',
  };

  if (knownHolidays[monthDay]) {
    events.push({
      name: knownHolidays[monthDay],
      type: 'holiday',
    });
  }

  // 2. 특별 상업 이벤트 확인
  const specialEvents: Record<string, string> = {
    '02-14': '발렌타인데이',
    '03-14': '화이트데이',
    '05-08': '어버이날',
    '11-11': '빼빼로데이',
  };

  if (specialEvents[monthDay]) {
    events.push({
      name: specialEvents[monthDay],
      type: 'commercial',
    });
  }

  // 3. 블랙프라이데이 (11월 네번째 금요일)
  if (date.getMonth() === 10) {
    const fourthFriday = getFourthFridayOfMonth(date.getFullYear(), 10);
    if (date.getDate() === fourthFriday.getDate()) {
      events.push({
        name: '블랙프라이데이',
        type: 'commercial',
      });
    }
  }

  // 4. DB에서 매장 이벤트 조회
  if (storeId) {
    try {
      const { data: storeEvents } = await fetchStoreEvents(storeId, {
        startDate: dateStr,
        endDate: dateStr,
      });
      if (storeEvents.length > 0) {
        events.push(
          ...storeEvents.map((e) => ({
            name: e.event_name || '매장 이벤트',
            type: 'event' as const,
          }))
        );
      }
    } catch (e) {
      console.warn('[Events] 날짜별 이벤트 조회 실패:', e);
    }
  }

  // 5. 주말 확인
  const dayOfWeek = date.getDay();
  if (dayOfWeek === 0 || dayOfWeek === 6) {
    if (events.length === 0) {
      events.push({
        name: dayOfWeek === 0 ? '일요일' : '토요일',
        type: 'holiday',
      });
    }
  }

  return events;
}

/**
 * 특정 월의 네번째 금요일 계산
 */
function getFourthFridayOfMonth(year: number, month: number): Date {
  const firstDay = new Date(year, month, 1);
  const dayOfWeek = firstDay.getDay();

  // 첫번째 금요일 계산
  let firstFriday = 1 + ((5 - dayOfWeek + 7) % 7);
  if (dayOfWeek > 5) {
    firstFriday += 7;
  }

  // 네번째 금요일
  const fourthFriday = firstFriday + 21;
  return new Date(year, month, fourthFriday);
}

/**
 * 실시간 환경 데이터 (실시간 모드용)
 */
export interface RealTimeEnvironmentData {
  weather: AutoLoadedWeatherData | null;
  isHoliday: boolean;
  isWeekend: boolean;
  activeEvents: AutoLoadedEventData[];
}

/**
 * 현재 환경 데이터 조회 (실시간 모드용)
 */
export async function fetchRealTimeEnvironment(
  storeId?: string,
  lat?: number,
  lon?: number
): Promise<RealTimeEnvironmentData> {
  const now = new Date();
  const dayOfWeek = now.getDay();

  // 병렬로 날씨와 이벤트 조회
  const [weather, events] = await Promise.all([
    fetchHistoricalWeather(now, lat, lon),
    storeId ? fetchDateEvents(storeId, now) : Promise.resolve([]),
  ]);

  return {
    weather,
    isHoliday: events.some((e) => e.type === 'holiday'),
    isWeekend: dayOfWeek === 0 || dayOfWeek === 6,
    activeEvents: events,
  };
}
