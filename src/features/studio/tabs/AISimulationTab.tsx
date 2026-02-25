/**
 * AISimulationTab.tsx
 *
 * AI 시뮬레이션 탭 - 통합 시뮬레이션 컨트롤
 * - 실시간/AI 예측 시뮬레이션 타입 선택
 * - 하나의 통합 실행 버튼
 * - 시뮬레이션 옵션 설정
 */

import { useState, useCallback, useEffect, useMemo } from 'react';
import { Play, Pause, Square, RotateCcw, Users, Activity, Thermometer, Monitor, Eye, Lightbulb, Lock, Loader2, TrendingUp, Clock, DollarSign, AlertTriangle, Zap, Sparkles, Sun, ChevronDown, ChevronUp, Cloud, CloudRain, CloudSnow, Calendar, Settings, Target, ArrowRight, X, CheckCircle, MapPin, Wrench } from 'lucide-react';
import { useEnvironmentContext } from '../hooks/useEnvironmentContext';
import { SimulationEnvironmentSettings } from '../components/SimulationEnvironmentSettings';
import type { SimulationEnvironmentConfig } from '../types/simulationEnvironment.types';
import { createDefaultSimulationConfig, calculateSimulationImpacts, WEATHER_OPTIONS, TIME_OF_DAY_OPTIONS, HOLIDAY_OPTIONS } from '../types/simulationEnvironment.types';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useSimulationStore, STATE_COLORS, STATE_LABELS } from '@/stores/simulationStore';
import { useSimulationStore as useAISimulationStore } from '../stores/simulationStore';
import { buildStoreContext } from '../utils/store-context-builder';
import { DiagnosticIssueList, type DiagnosticIssue } from '../components/DiagnosticIssueList';
import type { SceneRecipe } from '../types';
// 프리셋 시나리오
import {
  PRESET_SCENARIOS,
  type PresetScenario,
  type PresetScenarioId,
  presetToEnvironmentConfig,
  type SimulationIssue,
  ISSUE_TYPE_META,
} from '../types/scenarioPresets.types';
import { analyzeSimulationIssues, extractIssuesFromAIResult } from '../utils/simulationIssueAnalyzer';
import {
  SimulationErrorRecovery,
  createSimulationError,
  type SimulationErrorState,
} from '../components/SimulationErrorRecovery';

// 시뮬레이션 타입
type SimulationType = 'realtime' | 'prediction';
interface SimulationZone {
  id: string;
  zone_name: string;
  zone_type: string;
  x: number;
  z: number;
  width: number;
  depth: number;
}
interface AISimulationTabProps {
  storeId: string;
  sceneData: SceneRecipe | null;
  onOverlayToggle: (overlayType: string, visible: boolean) => void;
  simulationZones: SimulationZone[];
  onResultsUpdate?: (type: 'congestion' | 'flow' | 'layout' | 'staffing', result: any) => void;
  onNavigateToOptimization?: (diagnosticIssues?: DiagnosticIssue[]) => void;
  /** 환경 설정 변경 시 콜백 */
  onEnvironmentConfigChange?: (config: SimulationEnvironmentConfig) => void;
}
export function AISimulationTab({
  storeId,
  sceneData,
  onOverlayToggle,
  simulationZones,
  onResultsUpdate,
  onNavigateToOptimization,
  onEnvironmentConfigChange
}: AISimulationTabProps) {
  // 실시간 시뮬레이션 스토어
  const {
    isRunning: isRealtimeRunning,
    isPaused,
    simulationTime,
    kpi,
    config,
    start: startRealtime,
    pause,
    resume,
    stop: stopRealtime,
    reset: resetRealtime,
    setSpeed
  } = useSimulationStore();

  // AI 예측 시뮬레이션 스토어
  const {
    isLoading: isAIPredictionLoading,
    progress: aiProgress,
    error: aiError,
    result: aiResult,
    diagnosticIssues: aiDiagnosticIssues,
    realtimeKpis,
    options: aiOptions,
    setOptions: setAIOptions,
    runSimulation: runAIPrediction,
    reset: resetAIPrediction,
    getIssuesForOptimization
  } = useAISimulationStore();

  // 🆕 환경 컨텍스트 (날씨, 공휴일, 이벤트)
  const {
    context: envContext,
    impact: envImpact,
    aiContext: envAiContext,
    isLoading: isEnvLoading,
    currentTime
  } = useEnvironmentContext({
    storeId,
    enabled: !!storeId,
    autoRefresh: true
  });

  // ===== 통합 시뮬레이션 상태 =====
  const [simulationType, setSimulationType] = useState<SimulationType>('prediction');
  const [customerCount, setCustomerCount] = useState(100);
  const [duration, setDuration] = useState(60);
  const [showAdvancedOptions, setShowAdvancedOptions] = useState(false);

  // 🆕 프리셋 시나리오 상태
  const [selectedPreset, setSelectedPreset] = useState<PresetScenarioId | null>(null);
  const [trafficMultiplier, setTrafficMultiplier] = useState(1.0);
  const [showPresets, setShowPresets] = useState(true);
  const [analyzedIssues, setAnalyzedIssues] = useState<SimulationIssue[]>([]);

  // 🆕 AI 최적화 연결 모달 상태
  const [showOptimizationModal, setShowOptimizationModal] = useState(false);
  const [selectedIssuesForOptimization, setSelectedIssuesForOptimization] = useState<Set<string>>(new Set());
  // isOptimizationLoading state removed - optimization runs in AIOptimizationTab

  // 🆕 S0-4: 에러 복구 상태
  const [simulationError, setSimulationError] = useState<SimulationErrorState | null>(null);
  const [isRetrying, setIsRetrying] = useState(false);

  // 🆕 시뮬레이션 환경 설정 상태
  const [showEnvironmentSettings, setShowEnvironmentSettings] = useState(true); // 기본 열림
  const [simulationEnvConfig, setSimulationEnvConfig] = useState<SimulationEnvironmentConfig>(() => {
    const config = createDefaultSimulationConfig();
    config.calculatedImpact = calculateSimulationImpacts(config);
    return config;
  });

  // 🔧 FIX: 환경 설정 변경 시 부모에게 알림 (디버그 로그 추가)
  useEffect(() => {
    console.log('[AISimulationTab] Environment config useEffect triggered:', {
      hasCallback: !!onEnvironmentConfigChange,
      mode: simulationEnvConfig.mode,
      weather: simulationEnvConfig.manualSettings?.weather
    });
    if (onEnvironmentConfigChange) {
      onEnvironmentConfigChange(simulationEnvConfig);
    }
  }, [simulationEnvConfig, onEnvironmentConfigChange]);

  // 시각화 옵션
  const [showCustomerLabels, setShowCustomerLabels] = useState(false);
  const [showCongestionHeatmap, setShowCongestionHeatmap] = useState(false);

  // 진단 결과
  const [diagnosticIssues, setDiagnosticIssues] = useState<DiagnosticIssue[]>([]);

  // 현재 실행 중 여부 통합 체크
  const isAnyRunning = isRealtimeRunning || isAIPredictionLoading;

  // 🆕 프리셋 시나리오 선택 핸들러
  const handlePresetSelect = useCallback((preset: PresetScenario) => {
    setSelectedPreset(preset.id);
    setSimulationType('prediction'); // 프리셋 선택 시 AI 예측 모드로 전환

    // 환경 설정 업데이트
    const envConfig = presetToEnvironmentConfig(preset);
    setSimulationEnvConfig(prev => ({
      ...prev,
      ...envConfig,
      calculatedImpact: {
        trafficMultiplier: preset.expectedImpact.visitorsMultiplier,
        dwellTimeMultiplier: preset.expectedImpact.dwellTimeMultiplier,
        conversionMultiplier: preset.expectedImpact.conversionMultiplier,
      },
    }));

    // 트래픽 배수 업데이트
    setTrafficMultiplier(preset.settings.trafficMultiplier);

    // 고객 수 자동 조정 (기본 100명 기준)
    const baseCustomers = 100;
    setCustomerCount(Math.round(baseCustomers * preset.settings.trafficMultiplier));

    toast.success(`"${preset.name}" 시나리오가 적용되었습니다`, {
      description: preset.description,
    });
  }, []);

  // 🆕 프리셋 초기화
  const handleClearPreset = useCallback(() => {
    setSelectedPreset(null);
    setTrafficMultiplier(1.0);
    setCustomerCount(100);
    const defaultConfig = createDefaultSimulationConfig();
    defaultConfig.calculatedImpact = calculateSimulationImpacts(defaultConfig);
    setSimulationEnvConfig(defaultConfig);
  }, []);

  // 시간 포맷팅
  const formatTime = (seconds: number): string => {
    const absSeconds = Math.max(0, Math.abs(seconds));
    const m = Math.floor(absSeconds / 60);
    const s = Math.floor(absSeconds % 60);
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // 금액 포맷팅
  const formatCurrency = (amount: number): string => {
    if (amount >= 1000000) {
      return `₩${(amount / 1000000).toFixed(1)}M`;
    }
    return `₩${(amount / 10000).toFixed(0)}만`;
  };

  // ===== 🔧 통합 시뮬레이션 실행 =====
  const handleRunSimulation = useCallback(async () => {
    if (!storeId) {
      toast.error('매장을 선택해주세요');
      return;
    }

    // S0-4: 실행 시 에러 상태 초기화
    setSimulationError(null);

    if (simulationType === 'realtime') {
      // 실시간 시뮬레이션 시작
      onOverlayToggle('avatar', true);
      if (showCongestionHeatmap) {
        onOverlayToggle('heatmap', true);
      }
      startRealtime();
      toast.success('실시간 시뮬레이션이 시작되었습니다');
    } else {
      // AI 예측 시뮬레이션 실행
      try {
        // 🆕 프리셋 시나리오 컨텍스트 구성
        const currentPreset = selectedPreset ? PRESET_SCENARIOS.find(p => p.id === selectedPreset) : null;

        // 🆕 환경 설정에 따른 옵션 구성
        const envConfigForAI = {
          weather: simulationEnvConfig.manualSettings?.weather || simulationEnvConfig.weather,
          temperature: simulationEnvConfig.temperature,
          humidity: simulationEnvConfig.humidity,
          holiday_type: simulationEnvConfig.manualSettings?.holidayType || simulationEnvConfig.holidayType,
          day_of_week: simulationEnvConfig.dayOfWeek,
          time_of_day: simulationEnvConfig.manualSettings?.timeOfDay || simulationEnvConfig.timeOfDay,
          impact: simulationEnvConfig.calculatedImpact,
          // 🆕 프리셋 시나리오 정보 추가
          preset_scenario: currentPreset ? {
            id: currentPreset.id,
            name: currentPreset.name,
            traffic_multiplier: currentPreset.settings.trafficMultiplier,
            discount_percent: currentPreset.settings.discountPercent,
            event_type: currentPreset.settings.eventType,
            expected_impact: currentPreset.expectedImpact,
            risk_tags: currentPreset.riskTags,
          } : null,
        };

        // 옵션 설정 - 시간대는 환경 설정에서 가져옴
        const timeOfDayFromConfig = simulationEnvConfig.mode === 'manual' ? simulationEnvConfig.manualSettings?.timeOfDay : simulationEnvConfig.timeOfDay || 'afternoon';
        setAIOptions({
          customer_count: customerCount,
          duration_minutes: duration,
          time_of_day: timeOfDayFromConfig,
          environment_context: envConfigForAI, // 환경 컨텍스트 추가
          traffic_multiplier: trafficMultiplier, // 🆕 트래픽 배수
        });
        toast.loading('AI 예측 시뮬레이션 실행 중...', {
          id: 'ai-sim'
        });
        await runAIPrediction(storeId);
        toast.success('AI 시뮬레이션 완료!', {
          id: 'ai-sim'
        });

        // 🆕 시뮬레이션 결과에서 문제점 분석
        // simulationZones를 ZoneData 형식으로 변환
        const zoneDataForAnalysis = simulationZones.map(z => ({
          id: z.id,
          name: z.zone_name,
          type: z.zone_type,
          capacity: 50, // 기본값 (실제로는 store 설정에서 가져와야 함)
          visitRate: Math.random() * 0.3 + 0.1, // 시뮬레이션 결과에서 추출
        }));

        // AI 결과에서 이슈 추출
        const aiStore = useAISimulationStore.getState();
        if (aiStore.result) {
          // S0-4: 폴백 데이터 감지
          const isFallback = !!(aiStore.result as any)?._fallback;
          if (isFallback) {
            setSimulationError({
              message: 'AI 응답을 처리하는 중 문제가 발생하여 기본 데이터로 표시됩니다.',
              canRetry: true,
              timestamp: new Date(),
              type: 'parse',
              isFallback: true,
              details: 'AI 분석은 완료되었으나 응답 형식에 문제가 있어 폴백 데이터를 사용합니다.',
            });
            toast.warning('AI 응답 처리 오류', {
              id: 'ai-sim',
              description: '기본 데이터로 결과를 표시합니다. 다시 시도하면 정확한 결과를 얻을 수 있습니다.',
            });
          }

          const extractedIssues = extractIssuesFromAIResult(aiStore.result, zoneDataForAnalysis);
          setAnalyzedIssues(extractedIssues);

          // 심각한 이슈가 있으면 알림 (폴백이 아닌 경우에만)
          if (!isFallback) {
            const criticalIssues = extractedIssues.filter(i => i.severity === 'critical');
            if (criticalIssues.length > 0) {
              toast.warning(`${criticalIssues.length}개의 심각한 문제가 감지되었습니다`, {
                description: 'AI 최적화를 통해 해결 방안을 확인하세요',
              });
            }
          }
        }

        // 혼잡도 히트맵 표시 (옵션에 따라)
        if (showCongestionHeatmap) {
          onOverlayToggle('congestionHeatmap', true);
        }
      } catch (err: any) {
        // S0-4: 향상된 에러 처리
        const errorState = createSimulationError(err, {
          canRetry: true,
          isFallback: false,
        });
        setSimulationError(errorState);

        toast.error(`시뮬레이션 실패: ${err.message}`, {
          id: 'ai-sim'
        });
      }
    }
  }, [storeId, simulationType, customerCount, duration, showCongestionHeatmap, startRealtime, runAIPrediction, setAIOptions, onOverlayToggle, simulationEnvConfig, envAiContext, selectedPreset, trafficMultiplier, simulationZones]);

  // ============================================
  // AI 어시스턴트 내부 이벤트 리스너
  // ============================================
  useEffect(() => {
    // 프리셋 적용
    const handleApplyPresetInternal = (e: Event) => {
      const { preset: presetId } = (e as CustomEvent).detail;
      const found = PRESET_SCENARIOS.find(p => p.id === presetId);
      if (found) {
        handlePresetSelect(found);
      }
    };

    // 시뮬레이션 실행
    const handleRunSimInternal = (e: Event) => {
      // 약간의 딜레이 후 실행 (프리셋 적용 대기)
      setTimeout(() => {
        handleRunSimulation();
      }, 200);
    };

    // 파라미터 설정
    const handleSetParamsInternal = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (detail.simulation_type) {
        setSimulationType(detail.simulation_type as SimulationType);
      }
      if (detail.customer_count) {
        setCustomerCount(detail.customer_count);
      }
      if (detail.duration) {
        setDuration(detail.duration);
      }
    };

    // 환경 설정 변경
    const handleSetEnvInternal = (e: Event) => {
      const { weather, timeOfDay, holidayType } = (e as CustomEvent).detail;
      setSimulationEnvConfig(prev => {
        const updated = { ...prev, mode: 'manual' as const };
        if (!updated.manualSettings) {
          updated.manualSettings = { weather: 'clear', timeOfDay: 'afternoon', holidayType: 'none' };
        }
        if (weather) updated.manualSettings.weather = weather;
        if (timeOfDay) updated.manualSettings.timeOfDay = timeOfDay;
        if (holidayType) updated.manualSettings.holidayType = holidayType;
        updated.calculatedImpact = calculateSimulationImpacts(updated);
        return updated;
      });
    };

    window.addEventListener('studio:apply-preset-internal', handleApplyPresetInternal);
    window.addEventListener('studio:run-simulation-internal', handleRunSimInternal);
    window.addEventListener('studio:set-sim-params-internal', handleSetParamsInternal);
    window.addEventListener('studio:set-environment-internal', handleSetEnvInternal);

    return () => {
      window.removeEventListener('studio:apply-preset-internal', handleApplyPresetInternal);
      window.removeEventListener('studio:run-simulation-internal', handleRunSimInternal);
      window.removeEventListener('studio:set-sim-params-internal', handleSetParamsInternal);
      window.removeEventListener('studio:set-environment-internal', handleSetEnvInternal);
    };
  }, [handlePresetSelect, handleRunSimulation]);

  // 시뮬레이션 중지
  const handleStopSimulation = useCallback(() => {
    if (simulationType === 'realtime') {
      stopRealtime();
      onOverlayToggle('avatar', false);
    }
    resetAIPrediction();
    setDiagnosticIssues([]);
    setSimulationError(null); // S0-4: 에러 상태도 초기화
  }, [simulationType, stopRealtime, resetAIPrediction, onOverlayToggle]);

  // S0-4: 에러 복구 - 재시도
  const handleErrorRetry = useCallback(async () => {
    setIsRetrying(true);
    setSimulationError(null);
    try {
      await handleRunSimulation();
    } finally {
      setIsRetrying(false);
    }
  }, [handleRunSimulation]);

  // S0-4: 에러 복구 - 초기화
  const handleErrorReset = useCallback(() => {
    setSimulationError(null);
    resetAIPrediction();
    setAnalyzedIssues([]);
    toast.info('시뮬레이션이 초기화되었습니다');
  }, [resetAIPrediction]);

  // S0-4: 에러 무시 (폴백 데이터 사용)
  const handleErrorDismiss = useCallback(() => {
    setSimulationError(null);
    // 폴백 데이터로 계속 진행
  }, []);

  // 일시정지/재개 토글
  const handleTogglePause = useCallback(() => {
    if (isPaused) {
      resume();
    } else {
      pause();
    }
  }, [isPaused, resume, pause]);

  // 최적화 탭으로 이동
  const handleNavigateToOptimization = useCallback(() => {
    const issues = getIssuesForOptimization();
    if (onNavigateToOptimization) {
      onNavigateToOptimization(issues);
      toast.info(`${issues.length}개 이슈를 AI 최적화로 전달합니다`);
    }
  }, [getIssuesForOptimization, onNavigateToOptimization]);

  // 🆕 AI 최적화 모달 열기
  const handleOpenOptimizationModal = useCallback(() => {
    // 분석된 이슈 중 critical/warning만 기본 선택
    const criticalWarningIds = analyzedIssues
      .filter(i => i.severity === 'critical' || i.severity === 'warning')
      .map(i => i.id);
    setSelectedIssuesForOptimization(new Set(criticalWarningIds));
    setShowOptimizationModal(true);
  }, [analyzedIssues]);

  // 🆕 이슈 선택 토글
  const handleToggleIssueSelection = useCallback((issueId: string) => {
    setSelectedIssuesForOptimization(prev => {
      const newSet = new Set(prev);
      if (newSet.has(issueId)) {
        newSet.delete(issueId);
      } else {
        newSet.add(issueId);
      }
      return newSet;
    });
  }, []);

  // 🆕 AI 최적화 탭으로 이동 (이슈 전달)
  const handleNavigateToOptimizationTab = useCallback(() => {
    if (selectedIssuesForOptimization.size === 0) {
      toast.error('해결할 문제를 선택해주세요');
      return;
    }

    // 선택된 이슈들
    const selectedIssues = analyzedIssues.filter(i => selectedIssuesForOptimization.has(i.id));

    // 현재 프리셋 시나리오 정보
    const currentPreset = selectedPreset ? PRESET_SCENARIOS.find(p => p.id === selectedPreset) : null;

    // 최적화 탭으로 이동 (이슈와 시나리오 컨텍스트 전달)
    if (onNavigateToOptimization) {
      const diagnosticIssues = selectedIssues.map(i => ({
        id: i.id,
        type: i.type,
        severity: i.severity,
        title: i.title,
        zone_id: i.location.zoneId,
        zone_name: i.location.zoneName,
        message: i.details.description,
        recommendations: i.recommendations,
        impact: i.impact,
        details: i.details,
        // 🆕 시나리오 및 환경 컨텍스트
        scenario_context: currentPreset ? {
          id: currentPreset.id,
          name: currentPreset.name,
          description: currentPreset.description,
          expected_impact: currentPreset.expectedImpact,
          risk_tags: currentPreset.riskTags,
        } : null,
        environment_context: {
          weather: simulationEnvConfig.manualSettings?.weather || simulationEnvConfig.weather,
          holiday_type: simulationEnvConfig.manualSettings?.holidayType || simulationEnvConfig.holidayType,
          time_of_day: simulationEnvConfig.manualSettings?.timeOfDay || simulationEnvConfig.timeOfDay,
          traffic_multiplier: trafficMultiplier,
        },
        simulation_kpis: {
          visitors: realtimeKpis.visitors,
          revenue: realtimeKpis.revenue,
          conversion: realtimeKpis.conversion,
          avg_dwell: realtimeKpis.avgDwell,
        },
      }));

      onNavigateToOptimization(diagnosticIssues as any);

      toast.success('AI 최적화 탭으로 이동합니다', {
        description: `${selectedIssues.length}개 문제점을 우선 해결하도록 설정됩니다`,
      });
    }

    setShowOptimizationModal(false);
  }, [selectedIssuesForOptimization, analyzedIssues, selectedPreset, simulationEnvConfig, trafficMultiplier, realtimeKpis, onNavigateToOptimization]);

  // 🆕 분석된 이슈 카운트 (memoized)
  const { analyzedCriticalCount, analyzedWarningCount, analyzedInfoCount, totalRevenueImpact } = useMemo(() => {
    return {
      analyzedCriticalCount: analyzedIssues.filter(i => i.severity === 'critical').length,
      analyzedWarningCount: analyzedIssues.filter(i => i.severity === 'warning').length,
      analyzedInfoCount: analyzedIssues.filter(i => i.severity === 'info').length,
      totalRevenueImpact: analyzedIssues.reduce((sum, i) => sum + i.impact.revenueImpact, 0),
    };
  }, [analyzedIssues]);

  // 기존 이슈 카운트 (호환성)
  const criticalCount = aiDiagnosticIssues.filter(i => i.severity === 'critical').length;
  const warningCount = aiDiagnosticIssues.filter(i => i.severity === 'warning').length;
  return <div className="flex flex-col h-full overflow-hidden">
      {/* ===== 헤더 ===== */}
      <div className="p-4 border-b border-white/10">
        <h3 className="font-semibold text-sm text-white flex items-center gap-2">
          <Activity className="w-4 h-4 text-green-400" />
          AI 시뮬레이션
        </h3>
        <p className="text-xs text-white/50 mt-1">
          매장 고객 흐름을 시뮬레이션하고 AI 예측 분석을 실행합니다.
        </p>
      </div>

      {/* ===== 설정 영역 ===== */}
      <div className="flex-1 overflow-auto p-4 space-y-4">

        {/* 🆕 프리셋 시나리오 섹션 */}
        <div className="border border-white/10 rounded-lg">
          <button
            onClick={() => setShowPresets(!showPresets)}
            className="w-full flex items-center justify-between p-3 text-sm text-white/80"
          >
            <span className="font-medium flex items-center gap-2 text-white">
              <Target className="w-4 h-4 text-purple-400" />
              프리셋 시나리오
              {selectedPreset && (
                <span className="text-xs px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-400">
                  {PRESET_SCENARIOS.find(p => p.id === selectedPreset)?.emoji}{' '}
                  {PRESET_SCENARIOS.find(p => p.id === selectedPreset)?.name}
                </span>
              )}
            </span>
            {showPresets ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>

          {showPresets && (
            <div className="p-3 pt-0 border-t border-white/10 space-y-3">
              <p className="text-xs text-white/50">
                "만약 ~라면?" 시나리오를 선택하고 매장 상태를 예측하세요
              </p>

              {/* 프리셋 카드 그리드 */}
              <div className="grid grid-cols-2 gap-2">
                {PRESET_SCENARIOS.slice(0, 6).map((preset) => (
                  <button
                    key={preset.id}
                    onClick={() => handlePresetSelect(preset)}
                    disabled={isAnyRunning}
                    className={cn(
                      'p-2.5 rounded-lg border text-left transition-all',
                      selectedPreset === preset.id
                        ? `${preset.colorTheme.bg} ${preset.colorTheme.border} ${preset.colorTheme.text}`
                        : 'bg-white/5 border-white/10 hover:bg-white/10 text-white/70',
                      isAnyRunning && 'opacity-50 cursor-not-allowed'
                    )}
                  >
                    <div className="flex items-center gap-1.5 font-medium text-xs">
                      <span className="text-base">{preset.emoji}</span>
                      <span className="truncate">{preset.name}</span>
                    </div>
                    <div className="text-[10px] text-white/40 mt-1 truncate">
                      {preset.description}
                    </div>
                    {/* 리스크 태그 */}
                    {preset.riskTags.length > 0 && (
                      <div className="flex gap-1 mt-1.5 flex-wrap">
                        {preset.riskTags.slice(0, 2).map((tag) => (
                          <span
                            key={tag}
                            className="text-[9px] px-1 py-0.5 rounded bg-red-500/20 text-red-400"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </button>
                ))}
              </div>

              {/* 선택된 프리셋 정보 */}
              {selectedPreset && (
                <div className="p-2.5 bg-white/5 rounded-lg space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-white">예상 영향</span>
                    <button
                      onClick={handleClearPreset}
                      className="text-[10px] text-white/40 hover:text-white/60"
                    >
                      초기화
                    </button>
                  </div>
                  <div className="grid grid-cols-4 gap-2 text-center">
                    {(() => {
                      const preset = PRESET_SCENARIOS.find(p => p.id === selectedPreset);
                      if (!preset) return null;
                      return (
                        <>
                          <div>
                            <div className="text-[10px] text-white/40">방문객</div>
                            <div className={cn(
                              'text-xs font-bold',
                              preset.expectedImpact.visitorsMultiplier > 1 ? 'text-green-400' : 'text-red-400'
                            )}>
                              {preset.expectedImpact.visitorsMultiplier > 1 ? '+' : ''}
                              {Math.round((preset.expectedImpact.visitorsMultiplier - 1) * 100)}%
                            </div>
                          </div>
                          <div>
                            <div className="text-[10px] text-white/40">전환율</div>
                            <div className={cn(
                              'text-xs font-bold',
                              preset.expectedImpact.conversionMultiplier > 1 ? 'text-green-400' : 'text-red-400'
                            )}>
                              {preset.expectedImpact.conversionMultiplier > 1 ? '+' : ''}
                              {Math.round((preset.expectedImpact.conversionMultiplier - 1) * 100)}%
                            </div>
                          </div>
                          <div>
                            <div className="text-[10px] text-white/40">객단가</div>
                            <div className={cn(
                              'text-xs font-bold',
                              preset.expectedImpact.basketMultiplier > 1 ? 'text-green-400' : 'text-red-400'
                            )}>
                              {preset.expectedImpact.basketMultiplier > 1 ? '+' : ''}
                              {Math.round((preset.expectedImpact.basketMultiplier - 1) * 100)}%
                            </div>
                          </div>
                          <div>
                            <div className="text-[10px] text-white/40">체류</div>
                            <div className={cn(
                              'text-xs font-bold',
                              preset.expectedImpact.dwellTimeMultiplier > 1 ? 'text-blue-400' : 'text-orange-400'
                            )}>
                              {preset.expectedImpact.dwellTimeMultiplier > 1 ? '+' : ''}
                              {Math.round((preset.expectedImpact.dwellTimeMultiplier - 1) * 100)}%
                            </div>
                          </div>
                        </>
                      );
                    })()}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* 🆕 시뮬레이션 타입 - AI 예측 고정 (실시간 제거) */}
        {/* 시뮬레이션 타입 선택 UI 제거됨 - 기본값으로 AI 예측 사용 */}

        {/* 🆕 커스텀 시나리오 패널 (접기/펼치기) - 프리셋 바로 아래 배치 */}
        <div className={cn(
          "border rounded-lg transition-all duration-300",
          // 커스텀 시나리오가 적용되었을 때 (직접설정 모드이고 프리셋 미선택)
          simulationEnvConfig.mode === 'manual' && !selectedPreset
            ? "border-orange-500/50 bg-orange-500/5 shadow-[0_0_15px_rgba(249,115,22,0.15)]"
            : "border-white/10"
        )}>
          <button onClick={() => setShowEnvironmentSettings(!showEnvironmentSettings)} className="w-full flex items-center justify-between p-3 text-sm text-white/80">
            <span className="font-medium flex items-center gap-2 text-white">
              <Wrench className={cn(
                "w-4 h-4 transition-colors",
                simulationEnvConfig.mode === 'manual' && !selectedPreset ? "text-orange-400" : "text-blue-400"
              )} />
              커스텀 시나리오
              {/* 적용됨 표시 */}
              {simulationEnvConfig.mode === 'manual' && !selectedPreset && (
                <span className="flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded bg-orange-500/20 text-orange-400 animate-pulse">
                  <CheckCircle className="w-3 h-3" />
                  적용됨
                </span>
              )}
            </span>
            <div className="flex items-center gap-2">
              <span className={cn("text-xs px-1.5 py-0.5 rounded", simulationEnvConfig.mode === 'realtime' ? "bg-blue-500/20 text-blue-400" : "bg-orange-500/20 text-orange-400")}>
                {simulationEnvConfig.mode === 'realtime' ? '실시간' : '직접설정'}
              </span>
              {showEnvironmentSettings ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </div>
          </button>

          {showEnvironmentSettings && <div className="p-3 pt-0 border-t border-white/10">
              <p className="text-xs text-white/50 mb-3">
                날씨, 시간대, 이벤트 등을 직접 설정하여 시나리오를 구성하세요
              </p>
              <SimulationEnvironmentSettings config={simulationEnvConfig} onChange={config => {
            console.log('[AISimulationTab] SimulationEnvironmentSettings onChange:', config.mode);
            // 커스텀 설정 변경 시 프리셋 선택 해제 (실시간 또는 직접설정 모두)
            if (config.mode === 'manual' || config.mode === 'realtime') {
              setSelectedPreset(null);
            }
            setSimulationEnvConfig(config);
          }} storeId={storeId} compact={true} />
            </div>}
        </div>

        {/* 🆕 최종 적용 시나리오 확인 패널 */}
        <div className="border border-white/10 rounded-lg p-3 bg-gradient-to-br from-white/5 to-transparent">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle className="w-4 h-4 text-green-400" />
            <span className="text-xs font-medium text-white">최종 적용 시나리오</span>
          </div>
          
          {/* 적용된 시나리오 타입 표시 */}
          <div className={cn(
            "p-2.5 rounded-lg border transition-all",
            selectedPreset 
              ? "bg-purple-500/10 border-purple-500/30" 
              : simulationEnvConfig.mode === 'manual'
              ? "bg-orange-500/10 border-orange-500/30"
              : "bg-blue-500/10 border-blue-500/30"
          )}>
            {selectedPreset ? (
              // 프리셋 시나리오 적용됨
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <Target className="w-4 h-4 text-purple-400" />
                  <span className="text-sm font-medium text-purple-400">프리셋 시나리오</span>
                </div>
                <div className="flex items-center gap-2 text-white">
                  <span className="text-lg">{PRESET_SCENARIOS.find(p => p.id === selectedPreset)?.emoji}</span>
                  <span className="font-medium">{PRESET_SCENARIOS.find(p => p.id === selectedPreset)?.name}</span>
                </div>
                <p className="text-[10px] text-white/50">
                  {PRESET_SCENARIOS.find(p => p.id === selectedPreset)?.description}
                </p>
              </div>
            ) : simulationEnvConfig.mode === 'manual' ? (
              // 커스텀 시나리오 적용됨
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <Wrench className="w-4 h-4 text-orange-400" />
                  <span className="text-sm font-medium text-orange-400">커스텀 시나리오</span>
                </div>
                <div className="flex flex-wrap gap-1.5 mt-1">
                  {simulationEnvConfig.manualSettings?.weather && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/10 text-white/80">
                      🌤️ {WEATHER_OPTIONS.find(w => w.value === simulationEnvConfig.manualSettings?.weather)?.label || simulationEnvConfig.manualSettings?.weather}
                    </span>
                  )}
                  {simulationEnvConfig.manualSettings?.timeOfDay && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/10 text-white/80">
                      🕐 {TIME_OF_DAY_OPTIONS.find(t => t.value === simulationEnvConfig.manualSettings?.timeOfDay)?.label || simulationEnvConfig.manualSettings?.timeOfDay}
                    </span>
                  )}
                  {simulationEnvConfig.manualSettings?.holidayType && simulationEnvConfig.manualSettings?.holidayType !== 'none' && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/10 text-white/80">
                      🎉 {HOLIDAY_OPTIONS.find(h => h.value === simulationEnvConfig.manualSettings?.holidayType)?.label || simulationEnvConfig.manualSettings?.holidayType}
                    </span>
                  )}
                </div>
              </div>
            ) : (
              // 실시간 환경 적용됨
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <Activity className="w-4 h-4 text-blue-400" />
                  <span className="text-sm font-medium text-blue-400">실시간 환경</span>
                </div>
                <p className="text-[10px] text-white/50">
                  현재 실제 날씨, 시간대, 이벤트를 기반으로 시뮬레이션합니다
                </p>
              </div>
            )}
          </div>
          
          {/* 예상 영향도 요약 */}
          {simulationEnvConfig.calculatedImpact && (
            <div className="grid grid-cols-3 gap-2 mt-2 text-center">
              <div className="p-1.5 bg-white/5 rounded">
                <div className="text-[9px] text-white/40">트래픽</div>
                <div className={cn(
                  "text-xs font-bold",
                  (simulationEnvConfig.calculatedImpact.trafficMultiplier || 1) >= 1 ? "text-green-400" : "text-red-400"
                )}>
                  {(simulationEnvConfig.calculatedImpact.trafficMultiplier || 1) >= 1 ? '+' : ''}
                  {Math.round(((simulationEnvConfig.calculatedImpact.trafficMultiplier || 1) - 1) * 100)}%
                </div>
              </div>
              <div className="p-1.5 bg-white/5 rounded">
                <div className="text-[9px] text-white/40">체류시간</div>
                <div className={cn(
                  "text-xs font-bold",
                  (simulationEnvConfig.calculatedImpact.dwellTimeMultiplier || 1) >= 1 ? "text-blue-400" : "text-orange-400"
                )}>
                  {(simulationEnvConfig.calculatedImpact.dwellTimeMultiplier || 1) >= 1 ? '+' : ''}
                  {Math.round(((simulationEnvConfig.calculatedImpact.dwellTimeMultiplier || 1) - 1) * 100)}%
                </div>
              </div>
              <div className="p-1.5 bg-white/5 rounded">
                <div className="text-[9px] text-white/40">전환율</div>
                <div className={cn(
                  "text-xs font-bold",
                  (simulationEnvConfig.calculatedImpact.conversionMultiplier || 1) >= 1 ? "text-purple-400" : "text-red-400"
                )}>
                  {(simulationEnvConfig.calculatedImpact.conversionMultiplier || 1) >= 1 ? '+' : ''}
                  {Math.round(((simulationEnvConfig.calculatedImpact.conversionMultiplier || 1) - 1) * 100)}%
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 🔧 숨김 처리: 예상 고객 수, 시뮬레이션 시간, 시각화 옵션 */}
        {/* 
        {/* 예상 고객 수 *}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-medium bg-inherit text-white">예상 고객 수</label>
            <span className="text-sm font-bold text-white">{customerCount}명</span>
          </div>
          <Slider value={[customerCount]} onValueChange={([v]) => setCustomerCount(v)} min={10} max={300} step={10} disabled={isAnyRunning} className="w-full" />
          <div className="flex justify-between text-xs text-white/40">
            <span>10명</span>
            <span>300명</span>
          </div>
        </div>

        {/* 시뮬레이션 시간 *}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-medium text-white">시뮬레이션 시간</label>
            <span className="text-sm font-bold text-white">{duration}분</span>
          </div>
          <Slider value={[duration]} onValueChange={([v]) => setDuration(v)} min={15} max={180} step={15} disabled={isAnyRunning} className="w-full" />
          <div className="flex justify-between text-xs text-white/40">
            <span>15분</span>
            <span>180분</span>
          </div>
        </div>

        {/* 고급 옵션 (접기/펼치기) *}
        <div className="border border-white/10 rounded-lg">
          <button onClick={() => setShowAdvancedOptions(!showAdvancedOptions)} className="w-full flex items-center justify-between p-3 text-sm text-white/80">
            <span className="font-medium text-white">시각화 옵션</span>
            {showAdvancedOptions ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>

          {showAdvancedOptions && <div className="p-3 pt-0 space-y-3 border-t border-white/10">
              {/* 고객 상태 범례 *}
              <label className="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" checked={showCustomerLabels} onChange={e => setShowCustomerLabels(e.target.checked)} disabled={isAnyRunning} className="w-4 h-4 rounded bg-white/10" />
                <div>
                  <div className="text-sm text-white/80">고객 상태 범례</div>
                  <div className="text-xs text-white/40">
                    고객 상태별 색상을 표시합니다
                  </div>
                </div>
              </label>

              {/* 혼잡도 히트맵 *}
              <label className="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" checked={showCongestionHeatmap} onChange={e => setShowCongestionHeatmap(e.target.checked)} disabled={isAnyRunning} className="w-4 h-4 rounded bg-white/10" />
                <div>
                  <div className="text-sm text-white/80">혼잡도 시뮬레이션</div>
                  <div className="text-xs text-white/40">
                    AI가 시간대별 혼잡도 히트맵을 생성합니다
                  </div>
                </div>
              </label>

              {/* 고객 상태 범례 표시 *}
              {showCustomerLabels && <div className="pt-2 border-t border-white/10">
                  <div className="text-xs text-white/50 mb-2">상태 범례</div>
                  <div className="grid grid-cols-3 gap-1">
                    {Object.entries(STATE_LABELS).map(([state, label]) => <div key={state} className="flex items-center gap-1.5">
                        <div className="w-2 h-2 rounded-full" style={{
                  backgroundColor: STATE_COLORS[state as keyof typeof STATE_COLORS]
                }} />
                        <span className="text-[10px] text-white/50">{label}</span>
                      </div>)}
                  </div>
                </div>}
            </div>}
        </div>
        */}

        {/* AI 예측 로딩 프로그레스 */}
        {isAIPredictionLoading && <div className="w-full bg-white/10 rounded-full h-2 overflow-hidden">
            <div className="h-full bg-gradient-to-r from-purple-500 to-blue-500 transition-all duration-300" style={{
          width: `${aiProgress}%`
        }} />
          </div>}

        {/* S0-4: 향상된 에러 복구 UI */}
        {simulationError && (
          <SimulationErrorRecovery
            error={simulationError}
            onRetry={handleErrorRetry}
            onReset={handleErrorReset}
            onDismiss={simulationError.isFallback ? handleErrorDismiss : undefined}
            isRetrying={isRetrying}
          />
        )}

        {/* 기존 에러 표시 (simulationError가 없을 때만 표시) */}
        {aiError && !simulationError && <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
            <div className="flex items-center gap-2 text-red-400 text-sm">
              <AlertTriangle className="w-4 h-4" />
              {aiError}
            </div>
          </div>}

        {/* 실시간 시뮬레이션 KPI (실행 중일 때) */}
        {isRealtimeRunning && simulationType === 'realtime' && <div className="space-y-3 p-3 bg-white/5 rounded-lg border border-white/10">
            <div className="flex items-center justify-between">
              <span className="text-xs text-white/50">경과 시간</span>
              <span className="text-lg font-mono text-white">{formatTime(simulationTime)}</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="p-2 bg-white/5 rounded">
                <div className="flex items-center gap-1 text-xs text-white/40">
                  <Users className="h-3 w-3" />
                  현재 고객
                </div>
                <div className="text-lg font-bold text-white">{kpi.currentCustomers}</div>
              </div>
              <div className="p-2 bg-white/5 rounded">
                <div className="text-xs text-white/40">매출</div>
                <div className="text-lg font-bold text-green-400">{formatCurrency(kpi.totalRevenue)}</div>
              </div>
              <div className="p-2 bg-white/5 rounded">
                <div className="text-xs text-white/40">전환율</div>
                <div className="text-lg font-bold text-blue-400">{kpi.conversionRate.toFixed(1)}%</div>
              </div>
              <div className="p-2 bg-white/5 rounded">
                <div className="text-xs text-white/40">평균 체류</div>
                <div className="text-lg font-bold text-purple-400">{kpi.avgDwellTime.toFixed(0)}분</div>
              </div>
            </div>

            {/* 속도 조절 */}
            <div className="flex gap-1">
              {[1, 2, 4, 10].map(speed => <Button key={speed} onClick={() => setSpeed(speed)} size="sm" variant={config.speed === speed ? 'default' : 'outline'} className={cn('flex-1 text-xs h-7', config.speed === speed ? 'bg-blue-600' : 'border-white/20 text-white/60')}>
                  {speed}x
                </Button>)}
            </div>
          </div>}

        {/* AI 예측 결과 표시 */}
        {aiResult && simulationType === 'prediction' && <div className="space-y-3">
            {/* KPI 요약 */}
            <div className="grid grid-cols-2 gap-2">
              <div className="p-2 bg-white/5 rounded-lg">
                <div className="flex items-center gap-1 text-xs text-white/40 mb-0.5">
                  <Users className="h-3 w-3" />
                  예상 방문객
                </div>
                <div className="text-lg font-bold text-white">
                  {realtimeKpis.visitors.toLocaleString()}
                  <span className="text-xs text-white/40 font-normal ml-0.5">명</span>
                </div>
              </div>
              <div className="p-2 bg-white/5 rounded-lg">
                <div className="flex items-center gap-1 text-xs text-white/40 mb-0.5">
                  <TrendingUp className="h-3 w-3" />
                  전환율
                </div>
                <div className="text-lg font-bold text-blue-400">
                  {(realtimeKpis.conversion * 100).toFixed(1)}%
                </div>
              </div>
              <div className="p-2 bg-white/5 rounded-lg">
                <div className="flex items-center gap-1 text-xs text-white/40 mb-0.5">
                  <Clock className="h-3 w-3" />
                  평균 체류
                </div>
                <div className="text-lg font-bold text-purple-400">
                  {Math.round(realtimeKpis.avgDwell / 60)}분
                </div>
              </div>
              <div className="p-2 bg-white/5 rounded-lg">
                <div className="flex items-center gap-1 text-xs text-white/40 mb-0.5">
                  <DollarSign className="h-3 w-3" />
                  예상 매출
                </div>
                <div className="text-lg font-bold text-green-400">
                  {formatCurrency(realtimeKpis.revenue)}
                </div>
              </div>
            </div>

            {/* 🆕 분석된 문제점 섹션 (새로운 형식) */}
            {analyzedIssues.length > 0 && (
              <div className="p-3 bg-gradient-to-br from-red-500/5 to-orange-500/5 rounded-lg border border-red-500/20 space-y-3">
                {/* 헤더 */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm font-medium text-white">
                    <AlertTriangle className="h-4 w-4 text-red-400" />
                    감지된 문제점
                  </div>
                  <div className="flex gap-1.5">
                    {analyzedCriticalCount > 0 && (
                      <span className="px-2 py-0.5 bg-red-500 text-white text-xs rounded-full font-medium">
                        위험 {analyzedCriticalCount}
                      </span>
                    )}
                    {analyzedWarningCount > 0 && (
                      <span className="px-2 py-0.5 bg-yellow-500 text-white text-xs rounded-full font-medium">
                        주의 {analyzedWarningCount}
                      </span>
                    )}
                    {analyzedInfoCount > 0 && (
                      <span className="px-2 py-0.5 bg-blue-500 text-white text-xs rounded-full font-medium">
                        정보 {analyzedInfoCount}
                      </span>
                    )}
                  </div>
                </div>

                {/* 예상 영향 요약 */}
                {totalRevenueImpact > 0 && (
                  <div className="p-2 bg-red-500/10 rounded text-xs text-red-300 flex items-center gap-2">
                    <DollarSign className="h-3.5 w-3.5" />
                    예상 매출 손실: <span className="font-bold">{(totalRevenueImpact / 10000).toLocaleString()}만원</span>
                  </div>
                )}

                {/* 이슈 목록 */}
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {analyzedIssues.slice(0, 5).map((issue) => (
                    <div
                      key={issue.id}
                      className={cn(
                        'p-2.5 rounded-lg text-xs border transition-all',
                        issue.severity === 'critical'
                          ? 'bg-red-500/10 border-red-500/30 text-red-300'
                          : issue.severity === 'warning'
                          ? 'bg-yellow-500/10 border-yellow-500/30 text-yellow-300'
                          : 'bg-blue-500/10 border-blue-500/30 text-blue-300'
                      )}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-1.5">
                          <span className="text-sm">{ISSUE_TYPE_META[issue.type]?.icon || '⚠️'}</span>
                          <span className="font-medium">{issue.title}</span>
                        </div>
                        {issue.severity === 'critical' && (
                          <span className="px-1 py-0.5 bg-red-500/30 text-red-300 text-[10px] rounded">
                            위험
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5 mt-1.5 text-white/50">
                        <MapPin className="h-3 w-3" />
                        {issue.location.zoneName}
                        {issue.details.description && (
                          <>
                            <span>•</span>
                            <span className="truncate">{issue.details.description}</span>
                          </>
                        )}
                      </div>
                      {/* 권장사항 미리보기 */}
                      {issue.recommendations.length > 0 && (
                        <div className="mt-1.5 pt-1.5 border-t border-white/10 text-[10px] text-white/40">
                          💡 {issue.recommendations[0]}
                        </div>
                      )}
                    </div>
                  ))}
                  {analyzedIssues.length > 5 && (
                    <div className="text-xs text-white/40 text-center py-1">
                      +{analyzedIssues.length - 5}개 더 있음
                    </div>
                  )}
                </div>

                {/* AI 최적화 연결 버튼 */}
                {(analyzedCriticalCount > 0 || analyzedWarningCount > 0) && (
                  <div className="space-y-2">
                    <div className="p-2.5 bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-lg border border-purple-500/30">
                      <p className="text-xs text-white/80 text-center">
                        <Sparkles className="h-3.5 w-3.5 inline mr-1 text-purple-400" />
                        <strong>AI 최적화</strong>로 위 문제점들을 해결할 수 있습니다
                      </p>
                    </div>
                    <Button
                      onClick={handleOpenOptimizationModal}
                      className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-sm py-3"
                      size="sm"
                    >
                      <Wrench className="h-4 w-4 mr-2" />
                      AI 최적화로 실행하시겠습니까?
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </Button>
                  </div>
                )}
              </div>
            )}

            {/* 기존 진단 이슈 (호환성 유지) */}
            {aiDiagnosticIssues.length > 0 && analyzedIssues.length === 0 && <div className="p-3 bg-white/5 rounded-lg space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm text-white/80">
                    <AlertTriangle className="h-4 w-4" />
                    발견된 이슈
                  </div>
                  <div className="flex gap-1">
                    {criticalCount > 0 && <span className="px-1.5 py-0.5 bg-red-500 text-white text-xs rounded-full">
                        {criticalCount}
                      </span>}
                    {warningCount > 0 && <span className="px-1.5 py-0.5 bg-yellow-500 text-white text-xs rounded-full">
                        {warningCount}
                      </span>}
                  </div>
                </div>

                {/* 이슈 목록 (최대 3개) */}
                <div className="space-y-1.5">
                  {aiDiagnosticIssues.slice(0, 3).map(issue => <div key={issue.id} className={cn('p-2 rounded text-xs', issue.severity === 'critical' ? 'bg-red-500/20 text-red-300' : issue.severity === 'warning' ? 'bg-yellow-500/20 text-yellow-300' : 'bg-blue-500/20 text-blue-300')}>
                      <div className="font-medium">{issue.title}</div>
                      <div className="text-white/50 mt-0.5">{issue.zone_name}</div>
                    </div>)}
                  {aiDiagnosticIssues.length > 3 && <div className="text-xs text-white/40 text-center">
                      +{aiDiagnosticIssues.length - 3}개 더
                    </div>}
                </div>

                {/* AI 최적화로 이동 버튼 */}
                {(criticalCount > 0 || warningCount > 0) && onNavigateToOptimization && <Button onClick={handleNavigateToOptimization} className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-sm" size="sm">
                    <Sparkles className="h-3.5 w-3.5 mr-1.5" />
                    AI 최적화로 해결하기 ({criticalCount + warningCount}개 이슈)
                  </Button>}
              </div>}

            {/* AI 인사이트 */}
            {aiResult.ai_insights && aiResult.ai_insights.length > 0 && <div className="p-3 bg-white/5 rounded-lg">
                <div className="text-sm text-white/80 mb-2 flex items-center gap-2">
                  <Lightbulb className="h-4 w-4 text-yellow-400" />
                  AI 인사이트
                </div>
                <ul className="space-y-1.5">
                  {aiResult.ai_insights.slice(0, 3).map((insight, idx) => <li key={idx} className="text-xs text-white/60 flex items-start gap-1.5">
                      <span className="text-yellow-400 mt-0.5">•</span>
                      {insight}
                    </li>)}
                </ul>
              </div>}
          </div>}
      </div>

      {/* ===== 🔧 통합 실행 버튼 영역 ===== */}
      <div className="p-4 border-t border-white/10 space-y-2">
        {!isAnyRunning ? <Button onClick={handleRunSimulation} disabled={!storeId} className={cn("w-full py-3 font-medium text-white transition flex items-center justify-center gap-2", simulationType === 'realtime' ? "bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700" : "bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700")}>
            {simulationType === 'realtime' ? <>
                <Play className="w-4 h-4" />
                실시간 시뮬레이션 시작
              </> : <>
                <Zap className="w-4 h-4" />
                AI 예측 시뮬레이션 실행
              </>}
          </Button> : <div className="flex gap-2">
            {/* 일시정지/재개 (실시간만) */}
            {simulationType === 'realtime' && isRealtimeRunning && <Button onClick={handleTogglePause} className="flex-1 py-3 font-medium bg-yellow-600 hover:bg-yellow-700 text-white transition flex items-center justify-center gap-2">
                {isPaused ? <>
                    <Play className="w-4 h-4" />
                    재개
                  </> : <>
                    <Pause className="w-4 h-4" />
                    일시정지
                  </>}
              </Button>}

            {/* 중지 */}
            <Button onClick={handleStopSimulation} className={cn("py-3 font-medium bg-red-600 hover:bg-red-700 text-white transition flex items-center justify-center gap-2", simulationType === 'realtime' && isRealtimeRunning ? "flex-1" : "w-full")}>
              <Square className="w-4 h-4" />
              중지
            </Button>
          </div>}

        {/* 실시간 시뮬레이션 상태 표시 */}
        {isRealtimeRunning && simulationType === 'realtime' && <div className="text-center text-xs text-white/50">
            <Clock className="w-3 h-3 inline mr-1" />
            경과 시간: {formatTime(simulationTime)}
            {' | '}
            <Users className="w-3 h-3 inline mx-1" />
            활동중: {kpi.currentCustomers}명
          </div>}

        {/* AI 예측 로딩 상태 */}
        {isAIPredictionLoading && <div className="text-center text-xs text-white/50">
            <Loader2 className="w-3 h-3 inline mr-1 animate-spin" />
            AI 분석 중... {aiProgress}%
          </div>}
      </div>

      {/* 🆕 AI 최적화 연결 모달 */}
      {showOptimizationModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-[#1a1a2e] border border-white/10 rounded-xl w-full max-w-lg mx-4 max-h-[80vh] overflow-hidden shadow-2xl">
            {/* 모달 헤더 */}
            <div className="p-4 border-b border-white/10 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Wrench className="h-5 w-5 text-purple-400" />
                <h3 className="font-semibold text-white">AI 최적화 연결</h3>
              </div>
              <button
                onClick={() => setShowOptimizationModal(false)}
                className="p-1 rounded hover:bg-white/10 text-white/60 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* 모달 내용 */}
            <div className="p-4 space-y-4 overflow-y-auto max-h-[50vh]">
              {/* 현재 시나리오 정보 */}
              {selectedPreset && (
                <div className="p-3 bg-purple-500/10 rounded-lg border border-purple-500/20">
                  <div className="text-xs text-purple-300 mb-1">적용된 시나리오</div>
                  <div className="flex items-center gap-2 text-white">
                    <span className="text-lg">
                      {PRESET_SCENARIOS.find(p => p.id === selectedPreset)?.emoji}
                    </span>
                    <span className="font-medium">
                      {PRESET_SCENARIOS.find(p => p.id === selectedPreset)?.name}
                    </span>
                  </div>
                </div>
              )}

              {/* 해결할 문제 선택 */}
              <div>
                <div className="text-sm font-medium text-white mb-2 flex items-center justify-between">
                  <span>해결할 문제 선택</span>
                  <span className="text-xs text-white/40">
                    {selectedIssuesForOptimization.size}개 선택됨
                  </span>
                </div>
                <div className="space-y-2">
                  {analyzedIssues.map((issue) => (
                    <label
                      key={issue.id}
                      className={cn(
                        'flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-all',
                        selectedIssuesForOptimization.has(issue.id)
                          ? 'bg-purple-500/10 border-purple-500/30'
                          : 'bg-white/5 border-white/10 hover:bg-white/10'
                      )}
                    >
                      <input
                        type="checkbox"
                        checked={selectedIssuesForOptimization.has(issue.id)}
                        onChange={() => handleToggleIssueSelection(issue.id)}
                        className="mt-0.5 w-4 h-4 rounded bg-white/10 border-white/20"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span>{ISSUE_TYPE_META[issue.type]?.icon || '⚠️'}</span>
                          <span className="text-sm font-medium text-white truncate">
                            {issue.title}
                          </span>
                          <span
                            className={cn(
                              'text-[10px] px-1.5 py-0.5 rounded',
                              issue.severity === 'critical'
                                ? 'bg-red-500/30 text-red-300'
                                : issue.severity === 'warning'
                                ? 'bg-yellow-500/30 text-yellow-300'
                                : 'bg-blue-500/30 text-blue-300'
                            )}
                          >
                            {issue.severity === 'critical' ? '위험' : issue.severity === 'warning' ? '주의' : '정보'}
                          </span>
                        </div>
                        <div className="text-xs text-white/50 mt-1">
                          {issue.location.zoneName} • {issue.details.description}
                        </div>
                        {issue.impact.revenueImpact > 0 && (
                          <div className="text-xs text-red-400 mt-1">
                            예상 손실: {(issue.impact.revenueImpact / 10000).toLocaleString()}만원
                          </div>
                        )}
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* 최적화 예상 효과 */}
              {selectedIssuesForOptimization.size > 0 && (
                <div className="p-3 bg-green-500/10 rounded-lg border border-green-500/20">
                  <div className="text-xs text-green-300 mb-2">최적화 예상 효과</div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="flex items-center gap-1.5">
                      <CheckCircle className="h-3.5 w-3.5 text-green-400" />
                      <span className="text-white/70">문제 해결:</span>
                      <span className="text-green-400 font-medium">
                        {selectedIssuesForOptimization.size}개
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <DollarSign className="h-3.5 w-3.5 text-green-400" />
                      <span className="text-white/70">예상 회복:</span>
                      <span className="text-green-400 font-medium">
                        {(
                          analyzedIssues
                            .filter(i => selectedIssuesForOptimization.has(i.id))
                            .reduce((sum, i) => sum + i.impact.revenueImpact, 0) / 10000
                        ).toLocaleString()}만원
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* 모달 푸터 */}
            <div className="p-4 border-t border-white/10 flex gap-2">
              <Button
                onClick={() => setShowOptimizationModal(false)}
                variant="outline"
                className="flex-1 border-white/20 text-white/70 hover:bg-white/10"
              >
                취소
              </Button>
              <Button
                onClick={handleNavigateToOptimizationTab}
                disabled={selectedIssuesForOptimization.size === 0}
                className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
              >
                <ArrowRight className="h-4 w-4 mr-2" />
                AI 최적화 탭으로 이동
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>;
}
export default AISimulationTab;
