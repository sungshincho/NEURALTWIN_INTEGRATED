/**
 * useEnvironmentContext.ts
 *
 * 환경 컨텍스트 React 훅
 * - 날씨, 공휴일, 매장 이벤트 데이터 통합 조회
 * - 영향도 및 렌더링 설정 자동 계산
 * - 자동 갱신 지원
 *
 * 📌 모든 데이터는 실제 외부 API 또는 DB 기반
 */

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  fetchAllEnvironmentData,
  clearEnvironmentCache,
  getCacheStatus,
  type EnvironmentDataBundle,
} from '../services/environmentDataService';
import {
  calculateEnvironmentImpact,
  createAISimulationContext,
  getTimeOfDay,
  type AISimulationEnvironmentContext,
} from '../services/environmentImpactCalculator';
import {
  calculateRenderingConfig,
  getCurrentSeason,
  applyRenderingPreset,
  type RenderingPreset,
} from '../services/renderingConfigCalculator';
import type {
  EnvironmentContext,
  EnvironmentImpact,
  RenderingConfig,
  TimeOfDay,
  SeasonType,
} from '../types/environment.types';

// ============================================================================
// 훅 옵션 및 반환 타입
// ============================================================================

export interface UseEnvironmentContextOptions {
  storeId: string;
  enabled?: boolean;
  autoRefresh?: boolean;
  refreshIntervalMs?: number; // 기본 5분
  renderingPreset?: RenderingPreset;
}

export interface UseEnvironmentContextReturn {
  // 환경 컨텍스트
  context: EnvironmentContext | null;

  // 로딩/에러 상태
  isLoading: boolean;
  error: string | null;

  // 계산된 값들
  impact: EnvironmentImpact | null;
  renderingConfig: RenderingConfig | null;
  aiContext: AISimulationEnvironmentContext | null;

  // 액션
  refresh: () => Promise<void>;
  clearCache: () => void;

  // 캐시 상태
  cacheStatus: ReturnType<typeof getCacheStatus> | null;

  // 현재 시간 정보
  currentTime: {
    timeOfDay: TimeOfDay;
    season: SeasonType;
    isWeekend: boolean;
    hour: number;
  };
}

// ============================================================================
// 메인 훅
// ============================================================================

export function useEnvironmentContext({
  storeId,
  enabled = true,
  autoRefresh = true,
  refreshIntervalMs = 5 * 60 * 1000, // 5분
  renderingPreset = 'realistic',
}: UseEnvironmentContextOptions): UseEnvironmentContextReturn {
  // 상태
  const [dataBundle, setDataBundle] = useState<EnvironmentDataBundle | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cacheStatus, setCacheStatus] = useState<ReturnType<typeof getCacheStatus> | null>(null);

  // 자동 갱신 인터벌 ref
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ============================================================================
  // 데이터 페칭
  // ============================================================================

  const fetchData = useCallback(async () => {
    if (!storeId || !enabled) return;

    setIsLoading(true);
    setError(null);

    try {
      const bundle = await fetchAllEnvironmentData(storeId);

      // 에러가 있으면 경고 로그 (데이터는 계속 사용)
      if (bundle.errors.length > 0) {
        console.warn('[useEnvironmentContext] 일부 데이터 조회 실패:', bundle.errors);
        // 치명적 에러가 아니면 계속 진행
      }

      setDataBundle(bundle);
      setCacheStatus(getCacheStatus());
    } catch (err) {
      console.error('[useEnvironmentContext] 데이터 조회 실패:', err);
      setError(err instanceof Error ? err.message : '환경 데이터 조회 실패');
    } finally {
      setIsLoading(false);
    }
  }, [storeId, enabled]);

  // 초기 로드
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // 자동 갱신
  useEffect(() => {
    if (!autoRefresh || !enabled) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    intervalRef.current = setInterval(() => {
      fetchData();
    }, refreshIntervalMs);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [autoRefresh, enabled, refreshIntervalMs, fetchData]);

  // ============================================================================
  // 계산된 값들
  // ============================================================================

  // 현재 시간 정보 (매 렌더링마다 갱신)
  const currentTime = useMemo(() => {
    const now = new Date();
    const hour = now.getHours();
    const dayOfWeek = now.getDay();

    return {
      timeOfDay: getTimeOfDay(hour),
      season: getCurrentSeason(),
      isWeekend: dayOfWeek === 0 || dayOfWeek === 6,
      hour,
    };
  }, []);

  // 영향도 계산
  const impact = useMemo<EnvironmentImpact | null>(() => {
    if (!dataBundle) return null;

    return calculateEnvironmentImpact({
      weather: dataBundle.weather,
      todayHoliday: dataBundle.todayHoliday,
      upcomingHolidays: dataBundle.upcomingHolidays,
      activeEvents: dataBundle.activeEvents,
    });
  }, [dataBundle]);

  // 렌더링 설정 계산
  const renderingConfig = useMemo<RenderingConfig | null>(() => {
    if (!dataBundle) return null;

    const baseConfig = calculateRenderingConfig({
      weather: dataBundle.weather,
      todayHoliday: dataBundle.todayHoliday,
      activeEvents: dataBundle.activeEvents,
    });

    return applyRenderingPreset(baseConfig, renderingPreset);
  }, [dataBundle, renderingPreset]);

  // AI 시뮬레이션 컨텍스트
  const aiContext = useMemo<AISimulationEnvironmentContext | null>(() => {
    if (!dataBundle || !impact) return null;

    return createAISimulationContext(
      {
        weather: dataBundle.weather,
        todayHoliday: dataBundle.todayHoliday,
        upcomingHolidays: dataBundle.upcomingHolidays,
        activeEvents: dataBundle.activeEvents,
      },
      impact
    );
  }, [dataBundle, impact]);

  // 전체 환경 컨텍스트
  const context = useMemo<EnvironmentContext | null>(() => {
    if (!dataBundle || !impact || !renderingConfig) return null;

    const now = new Date();

    return {
      currentTime: {
        timestamp: now.toISOString(),
        hour: now.getHours(),
        dayOfWeek: now.getDay(),
        isWeekend: currentTime.isWeekend,
        timeOfDay: currentTime.timeOfDay,
        season: currentTime.season,
      },

      weather: dataBundle.weather,
      weatherLoading: isLoading,
      weatherError: dataBundle.errors.find((e) => e.type === 'WEATHER_API_ERROR')?.message || null,

      holiday: dataBundle.todayHoliday,
      upcomingHolidays: dataBundle.upcomingHolidays,
      holidayLoading: isLoading,
      holidayError: dataBundle.errors.find((e) => e.type === 'HOLIDAY_API_ERROR')?.message || null,

      activeEvents: dataBundle.activeEvents,
      upcomingEvents: dataBundle.upcomingEvents,
      eventsLoading: isLoading,
      eventsError: dataBundle.errors.find((e) => e.type === 'EVENTS_DB_ERROR')?.message || null,

      impact,
      renderingConfig,

      isFullyLoaded: !isLoading && dataBundle.errors.length === 0,
      lastUpdated: dataBundle.fetchedAt,
    };
  }, [dataBundle, impact, renderingConfig, currentTime, isLoading]);

  // ============================================================================
  // 액션
  // ============================================================================

  const refresh = useCallback(async () => {
    clearEnvironmentCache();
    await fetchData();
  }, [fetchData]);

  const clearCache = useCallback(() => {
    clearEnvironmentCache();
    setCacheStatus(getCacheStatus());
  }, []);

  // ============================================================================
  // 반환
  // ============================================================================

  return {
    context,
    isLoading,
    error,
    impact,
    renderingConfig,
    aiContext,
    refresh,
    clearCache,
    cacheStatus,
    currentTime,
  };
}

// ============================================================================
// 간소화된 훅 (읽기 전용)
// ============================================================================

/**
 * 현재 날씨만 필요할 때 사용
 */
export function useCurrentWeather(storeId: string) {
  const { context, isLoading, error, refresh } = useEnvironmentContext({
    storeId,
    autoRefresh: true,
    refreshIntervalMs: 10 * 60 * 1000, // 10분
  });

  return {
    weather: context?.weather || null,
    isLoading,
    error,
    refresh,
  };
}

/**
 * 현재 영향도만 필요할 때 사용
 */
export function useEnvironmentImpact(storeId: string) {
  const { impact, isLoading, error, currentTime } = useEnvironmentContext({
    storeId,
    autoRefresh: true,
  });

  return {
    impact,
    isLoading,
    error,
    timeOfDay: currentTime.timeOfDay,
    isWeekend: currentTime.isWeekend,
  };
}

/**
 * AI 시뮬레이션에 전달할 컨텍스트
 */
export function useAISimulationEnvironment(storeId: string) {
  const { aiContext, isLoading, error } = useEnvironmentContext({
    storeId,
    autoRefresh: false, // 시뮬레이션 시작 시점 데이터 고정
  });

  return {
    environmentContext: aiContext,
    isLoading,
    error,
  };
}

/**
 * 3D 렌더링 설정
 */
export function useRenderingEnvironment(storeId: string, preset: RenderingPreset = 'realistic') {
  const { renderingConfig, isLoading, context } = useEnvironmentContext({
    storeId,
    renderingPreset: preset,
    autoRefresh: true,
    refreshIntervalMs: 15 * 60 * 1000, // 15분
  });

  return {
    config: renderingConfig,
    isLoading,
    weatherCondition: context?.weather?.condition || 'clear',
    timeOfDay: context?.currentTime?.timeOfDay || 'afternoon',
  };
}

export default useEnvironmentContext;
