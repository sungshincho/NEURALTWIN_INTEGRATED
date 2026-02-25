/**
 * SimulationEnvironmentSettings.tsx
 *
 * 시뮬레이션 환경 설정 UI 컴포넌트 (개선된 버전)
 * - 3가지 모드: 실시간 / 날짜 선택 / 직접 설정
 * - 날짜 선택 시 날씨/이벤트 자동 로드
 * - 기온/습도 슬라이더 제거 (날씨에 따라 자동)
 */

import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { Cloud, Sun, Calendar, Clock, Gift, RefreshCw, TrendingUp, TrendingDown, Activity, Loader2, Settings2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { SimulationEnvironmentConfig, EnvironmentMode, WeatherOption, HolidayOption, TimeOfDayOption } from '../types/simulationEnvironment.types';
import { WEATHER_OPTIONS, HOLIDAY_OPTIONS, TIME_OF_DAY_OPTIONS, calculateSimulationImpacts, createDefaultSimulationConfig, getWeatherImpactFromCondition, isCurrentTimeDayMode, isDayTime } from '../types/simulationEnvironment.types';
import { fetchHistoricalWeather, fetchDateEvents, fetchRealTimeEnvironment, type RealTimeEnvironmentData } from '../services/environmentDataService';

// ============================================================================
// Props
// ============================================================================

interface SimulationEnvironmentSettingsProps {
  config: SimulationEnvironmentConfig;
  onChange: (config: SimulationEnvironmentConfig) => void;
  storeId?: string;
  className?: string;
  compact?: boolean;
}

// ============================================================================
// 헬퍼 함수
// ============================================================================

function getWeatherEmoji(condition?: string): string {
  const emojis: Record<string, string> = {
    clear: '☀️',
    sunny: '☀️',
    clouds: '☁️',
    cloudy: '☁️',
    overcast: '🌥️',
    rain: '🌧️',
    drizzle: '🌦️',
    thunderstorm: '⛈️',
    heavyrain: '⛈️',
    snow: '❄️',
    heavysnow: '🌨️',
    mist: '🌫️',
    fog: '🌫️',
    haze: '😷'
  };
  return emojis[condition?.toLowerCase() || ''] || '🌤️';
}

// ============================================================================
// 메인 컴포넌트
// ============================================================================

export const SimulationEnvironmentSettings: React.FC<SimulationEnvironmentSettingsProps> = ({
  config,
  onChange,
  storeId,
  className,
  compact = false
}) => {
  const [isLoadingDateData, setIsLoadingDateData] = useState(false);
  const [realTimeData, setRealTimeData] = useState<RealTimeEnvironmentData | null>(null);

  // 실시간 모드일 때 환경 데이터 로드
  useEffect(() => {
    if (config.mode === 'realtime') {
      fetchRealTimeEnvironment(storeId).then(setRealTimeData);
    }
  }, [config.mode, storeId]);

  // 날짜 선택 시 해당 날짜의 날씨/이벤트 자동 로드
  const handleDateChange = useCallback(async (date: Date) => {
    const newConfig = {
      ...config,
      selectedDate: date
    };
    onChange(newConfig);
    if (config.mode === 'dateSelect') {
      setIsLoadingDateData(true);
      try {
        const [weatherData, eventsData] = await Promise.all([fetchHistoricalWeather(date), storeId ? fetchDateEvents(storeId, date) : Promise.resolve([])]);
        const updatedConfig: SimulationEnvironmentConfig = {
          ...newConfig,
          autoLoadedData: {
            weather: weatherData || undefined,
            events: eventsData
          }
        };
        updatedConfig.calculatedImpact = calculateSimulationImpacts(updatedConfig);
        onChange(updatedConfig);
      } catch (error) {
        console.warn('[EnvironmentSettings] 날짜 데이터 로드 실패:', error);
      } finally {
        setIsLoadingDateData(false);
      }
    }
  }, [config, onChange, storeId]);

  // 모드 변경 핸들러
  const handleModeChange = useCallback(async (mode: EnvironmentMode) => {
    const newConfig: SimulationEnvironmentConfig = {
      ...config,
      mode,
      // 레거시 호환용 필드도 업데이트
      date: config.selectedDate,
      weather: mode === 'manual' ? config.manualSettings.weather : config.weather,
      timeOfDay: mode === 'manual' ? config.manualSettings.timeOfDay : config.timeOfDay,
      holidayType: mode === 'manual' ? config.manualSettings.holidayType : config.holidayType
    };

    // 실시간 모드로 전환 시 현재 데이터 적용
    if (mode === 'realtime') {
      const rtData = await fetchRealTimeEnvironment(storeId);
      setRealTimeData(rtData);
      newConfig.autoLoadedData = {
        weather: rtData.weather || undefined,
        events: rtData.activeEvents
      };
    }

    // 날짜 선택 모드로 전환 시 데이터 로드
    if (mode === 'dateSelect') {
      setIsLoadingDateData(true);
      try {
        const [weatherData, eventsData] = await Promise.all([fetchHistoricalWeather(config.selectedDate), storeId ? fetchDateEvents(storeId, config.selectedDate) : Promise.resolve([])]);
        newConfig.autoLoadedData = {
          weather: weatherData || undefined,
          events: eventsData
        };
      } finally {
        setIsLoadingDateData(false);
      }
    }
    newConfig.calculatedImpact = calculateSimulationImpacts(newConfig, realTimeData || undefined);
    onChange(newConfig);
  }, [config, onChange, storeId, realTimeData]);

  // 직접 설정 업데이트
  const updateManualSettings = useCallback((updates: Partial<typeof config.manualSettings>) => {
    const newManualSettings = {
      ...config.manualSettings,
      ...updates
    };
    const newConfig: SimulationEnvironmentConfig = {
      ...config,
      manualSettings: newManualSettings,
      // 레거시 호환용
      weather: newManualSettings.weather,
      timeOfDay: newManualSettings.timeOfDay,
      holidayType: newManualSettings.holidayType
    };
    newConfig.calculatedImpact = calculateSimulationImpacts(newConfig);
    onChange(newConfig);
  }, [config, onChange]);

  // 리셋
  const handleReset = useCallback(() => {
    const defaultConfig = createDefaultSimulationConfig();
    defaultConfig.calculatedImpact = calculateSimulationImpacts(defaultConfig);
    onChange(defaultConfig);
  }, [onChange]);

  // 계산된 영향도
  const impacts = useMemo(() => {
    return config.calculatedImpact || calculateSimulationImpacts(config, realTimeData || undefined);
  }, [config, realTimeData]);
  return <div className={cn('space-y-4', className)}>
      {/* 2가지 모드 선택 (날짜 선택 제거) */}
      <div className="flex gap-1 p-1 bg-muted/50 rounded-lg">
        <button onClick={() => handleModeChange('realtime')} className={cn('flex-1 flex items-center justify-center gap-1.5 py-2 px-2 rounded text-xs font-medium transition', config.mode === 'realtime' ? 'bg-blue-500 text-white' : 'hover:bg-muted')}>
          <Activity className="w-3.5 h-3.5" />
          {!compact && '실시간'}
        </button>
        <button onClick={() => handleModeChange('manual')} className={cn('flex-1 flex items-center justify-center gap-1.5 py-2 px-2 rounded text-xs font-medium transition', config.mode === 'manual' ? 'bg-orange-500 text-white' : 'hover:bg-muted')}>
          <Settings2 className="w-3.5 h-3.5" />
          {!compact && '직접 설정'}
        </button>
      </div>

      {/* ===== 직접 설정 모드 ===== */}
      {config.mode === 'manual' && <div className="space-y-4">
          {/* 시간대 선택 (드롭다운) */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-muted-foreground flex items-center gap-1">
              <Clock className="w-3 h-3" />
              시간대
            </label>
            <Select value={config.manualSettings.timeOfDay} onValueChange={(value: TimeOfDayOption) => updateManualSettings({
          timeOfDay: value
        })}>
              <SelectTrigger className="w-full h-9 text-sm bg-background border-white/10">
                <SelectValue placeholder="시간대 선택" />
              </SelectTrigger>
              <SelectContent>
                {TIME_OF_DAY_OPTIONS.map(time => <SelectItem key={time.value} value={time.value}>
                    <div className="flex items-center gap-2">
                      <span>{time.emoji}</span>
                      <span>{time.label}</span>
                      <span className="text-muted-foreground text-xs">({time.hours})</span>
                    </div>
                  </SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          {/* 날씨 선택 (드롭다운) */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-muted-foreground flex items-center gap-1">
              <Cloud className="w-3 h-3" />
              날씨
            </label>
            <Select value={config.manualSettings.weather} onValueChange={(value: WeatherOption) => updateManualSettings({
          weather: value
        })}>
              <SelectTrigger className="w-full h-9 text-sm bg-background border-white/10">
                <SelectValue placeholder="날씨 선택" />
              </SelectTrigger>
              <SelectContent>
                {WEATHER_OPTIONS.map(weather => <SelectItem key={weather.value} value={weather.value}>
                    <div className="flex items-center gap-2">
                      <span>{weather.emoji}</span>
                      <span>{weather.label}</span>
                    </div>
                  </SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          {/* 휴일/이벤트 선택 (드롭다운) */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-muted-foreground flex items-center gap-1">
              <Gift className="w-3 h-3" />
              휴일/이벤트
            </label>
            <Select value={config.manualSettings.holidayType} onValueChange={(value: HolidayOption) => updateManualSettings({
          holidayType: value
        })}>
              <SelectTrigger className="w-full h-9 text-sm bg-background border-white/10">
                <SelectValue placeholder="휴일/이벤트 선택" />
              </SelectTrigger>
              <SelectContent>
                {HOLIDAY_OPTIONS.map(holiday => <SelectItem key={holiday.value} value={holiday.value}>
                    <div className="flex items-center gap-2">
                      <span>{holiday.emoji}</span>
                      <span>{holiday.label}</span>
                    </div>
                  </SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          {/* 선택된 설정 요약 */}
          <div className="p-3 bg-muted/30 rounded-lg">
            <div className="text-xs text-muted-foreground mb-1">현재 설정</div>
            <div className="flex flex-wrap gap-2">
              <span className="px-2 py-1 bg-yellow-500/20 text-yellow-400 rounded text-xs">
                {TIME_OF_DAY_OPTIONS.find(t => t.value === config.manualSettings.timeOfDay)?.emoji}{' '}
                {TIME_OF_DAY_OPTIONS.find(t => t.value === config.manualSettings.timeOfDay)?.label}
                {' '}
                ({config.manualSettings.timeOfDay === 'peak' ? '데이터 기반' : isDayTime(config.manualSettings.timeOfDay) ? '낮 씬' : '밤 씬'})
              </span>
              <span className="px-2 py-1 bg-cyan-500/20 text-cyan-400 rounded text-xs">
                {WEATHER_OPTIONS.find(w => w.value === config.manualSettings.weather)?.emoji}{' '}
                {WEATHER_OPTIONS.find(w => w.value === config.manualSettings.weather)?.label}
              </span>
              {config.manualSettings.holidayType !== 'none' && <span className="px-2 py-1 bg-purple-500/20 text-purple-400 rounded text-xs">
                  {HOLIDAY_OPTIONS.find(h => h.value === config.manualSettings.holidayType)?.emoji}{' '}
                  {HOLIDAY_OPTIONS.find(h => h.value === config.manualSettings.holidayType)?.label}
                </span>}
            </div>
          </div>
        </div>}

      {/* ===== 실시간 모드 ===== */}
      {config.mode === 'realtime' && <div className="space-y-3">
          {/* 현재 환경 상태 표시 */}
          <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Activity className="w-4 h-4 text-blue-400" />
              <span className="text-sm font-medium text-blue-400">실시간 환경</span>
            </div>

            {realTimeData ? <div className="space-y-2 text-sm">
                {/* 현재 시간 */}
                <div className="flex items-center gap-2">
                  <Clock className="text-white w-[15px] h-[15px] px-0 mx-[2px]" />
                  <span className="text-white text-sm">
                    {new Date().toLocaleTimeString('ko-KR', {
                hour: '2-digit',
                minute: '2-digit'
              })}
                    {' '}
                    <span className="text-white">
                      ({isCurrentTimeDayMode() ? '낮' : '밤'})
                    </span>
                  </span>
                </div>

                {/* 현재 날씨 */}
                {realTimeData.weather && <div className="flex items-center gap-2">
                    <span>{getWeatherEmoji(realTimeData.weather.condition)}</span>
                    <span className="text-white text-xs">{realTimeData.weather.description}</span>
                    <span className="text-white text-xs">
                      {realTimeData.weather.temperature}°C
                    </span>
                  </div>}

                {/* 오늘 이벤트 */}
                {realTimeData.activeEvents && realTimeData.activeEvents.length > 0 && <div className="flex items-center gap-2">
                    <Gift className="w-3.5 h-3.5 text-muted-foreground" />
                    <span>{realTimeData.activeEvents.map(e => e.name).join(', ')}</span>
                  </div>}

                {/* 휴일/주말 표시 */}
                <div className="text-xs text-muted-foreground flex gap-2">
                  {realTimeData.isHoliday && <span className="text-red-400">🎉 휴일</span>}
                  {realTimeData.isWeekend && <span className="text-purple-400">📅 주말</span>}
                  {!realTimeData.isHoliday && !realTimeData.isWeekend && <span className="text-white text-xs mx-px">📅   평일</span>}
                </div>
              </div> : <div className="flex items-center text-sm text-muted-foreground">
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                환경 데이터를 불러오는 중...
              </div>}
          </div>

          {/* 안내 메시지 */}
          <p className="text-xs text-muted-foreground text-center">
            실시간 모드에서는 현재 시간과 날씨가 자동으로 반영됩니다
          </p>
        </div>}

      {/* ===== 예상 영향도 (공통) ===== */}
      <ImpactDisplay impacts={impacts} />

      {/* 리셋 버튼 */}
      {config.mode !== 'realtime' && <button onClick={handleReset} className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs text-muted-foreground hover:text-foreground hover:bg-muted rounded transition">
          <RefreshCw className="w-3 h-3" />
          기본값으로 초기화
        </button>}
    </div>;
};

// ============================================================================
// 영향도 표시
// ============================================================================

interface ImpactDisplayProps {
  impacts: {
    trafficMultiplier: number;
    dwellTimeMultiplier: number;
    conversionMultiplier: number;
  };
}
const ImpactDisplay: React.FC<ImpactDisplayProps> = ({
  impacts
}) => {
  const formatChange = (value: number) => {
    const percent = Math.round((value - 1) * 100);
    return percent >= 0 ? `+${percent}%` : `${percent}%`;
  };
  const getChangeColor = (value: number, type: 'traffic' | 'dwell' | 'conversion') => {
    if (value > 1) {
      return type === 'traffic' ? 'text-green-500' : type === 'dwell' ? 'text-blue-500' : 'text-purple-500';
    }
    if (value < 1) {
      return type === 'traffic' ? 'text-red-500' : type === 'dwell' ? 'text-orange-500' : 'text-yellow-500';
    }
    return 'text-muted-foreground';
  };
  const getIcon = (value: number) => {
    if (value > 1) return <TrendingUp className="w-3 h-3" />;
    if (value < 1) return <TrendingDown className="w-3 h-3" />;
    return null;
  };
  return <div className="p-3 bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-lg border border-white/10">
      <div className="text-xs font-medium mb-2 text-[#61a6fa]">
        예상 영향도
      </div>
      <div className="grid grid-cols-3 gap-2">
        <div className="text-center">
          <div className="text-xs mb-1 text-white">방문객</div>
          <div className={cn('flex items-center justify-center gap-1 font-bold', getChangeColor(impacts.trafficMultiplier, 'traffic'))}>
            {getIcon(impacts.trafficMultiplier)}
            {formatChange(impacts.trafficMultiplier)}
          </div>
        </div>
        <div className="text-center">
          <div className="text-xs mb-1 text-white">체류시간</div>
          <div className={cn('flex items-center justify-center gap-1 font-bold', getChangeColor(impacts.dwellTimeMultiplier, 'dwell'))}>
            {getIcon(impacts.dwellTimeMultiplier)}
            {formatChange(impacts.dwellTimeMultiplier)}
          </div>
        </div>
        <div className="text-center">
          <div className="text-xs mb-1 text-white">전환율</div>
          <div className={cn('flex items-center justify-center gap-1 font-bold', getChangeColor(impacts.conversionMultiplier, 'conversion'))}>
            {getIcon(impacts.conversionMultiplier)}
            {formatChange(impacts.conversionMultiplier)}
          </div>
        </div>
      </div>
    </div>;
};
export default SimulationEnvironmentSettings;
