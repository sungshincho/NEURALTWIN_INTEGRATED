/**
 * DigitalTwinStudioPage.tsx
 *
 * 디지털트윈 스튜디오 - 통합 3D 편집 + 시뮬레이션 + 분석
 * 드래그 가능 패널 시스템 + 시뮬레이션 결과 패널
 */

import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useSelectedStore } from '@/hooks/useSelectedStore';
import { useActivityLogger } from '@/hooks/useActivityLogger';
import { useLocation, useSearchParams } from 'react-router-dom';
import { DashboardLayout } from '@/components/DashboardLayout';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { AlertCircle, Loader2, Sparkles, Layers, Save, Play, GitCompare, Pause, Square, RotateCcw, Users, FlaskConical, CheckCircle, Cloud, CloudRain, CloudSnow, Sun, Calendar } from 'lucide-react';
import { toast } from 'sonner';

// 새 스튜디오 컴포넌트
import { Canvas3D, SceneProvider, useScene } from './core';
import { LayerPanel, SimulationPanel, ToolPanel, SceneSavePanel, OverlayControlPanel, PropertyPanel } from './panels';
import { HeatmapOverlay, CustomerFlowOverlay, LayoutOptimizationOverlay, FlowOptimizationOverlay, CongestionOverlay, StaffingOverlay, StaffAvatarsOverlay, CustomerFlowOverlayEnhanced, StaffReallocationOverlay, ZonesFloorOverlay } from './overlays';
import { DraggablePanel, QuickToggleBar, ViewModeToggle, ResultReportPanel, type ViewMode } from './components';
import type { DiagnosticIssue } from './components/DiagnosticIssueList';
import { PanelLeftClose, PanelLeft, Mouse } from 'lucide-react';
import { AIOptimizationTab } from './tabs/AIOptimizationTab';
import { AISimulationTab } from './tabs/AISimulationTab';
import { ApplyPanel } from './tabs/ApplyPanel';
import { LayoutResultPanel, FlowResultPanel, CongestionResultPanel, StaffingResultPanel, type LayoutResult, type FlowResult, type CongestionResult, type StaffingResult } from './panels/results';
import { useStudioMode, useOverlayVisibility, useScenePersistence, useSceneSimulation, useStoreBounds, useStaffData, useEnvironmentContext } from './hooks';
import { loadUserModels } from './utils';
import type { StudioMode, Model3D, OverlayType, HeatPoint, ZoneBoundary, SceneRecipe, LightingPreset, Vector3, SimulationScenario, TransformMode, RenderingConfig } from './types';
import type { SimulationEnvironmentConfig } from './types/simulationEnvironment.types';
import { convertToRenderingConfig, isDayTime, isCurrentTimeDayMode, isDayTimeWithPeakData } from './types/simulationEnvironment.types';

// 기존 시뮬레이션 훅
import { useStoreContext } from '@/features/simulation/hooks/useStoreContext';
import { useEnhancedAIInference } from '@/features/simulation/hooks/useEnhancedAIInference';
import { useDateFilterStore } from '@/store/dateFilterStore';
import { useSimulationStore, STATE_COLORS, STATE_LABELS, type CustomerState } from '@/stores/simulationStore';
import { useZoneHeatmapData } from '@/hooks/useZoneMetrics';

// 타입 변환 헬퍼
interface ModelLayer {
  id: string;
  name: string;
  type: 'space' | 'furniture' | 'product' | 'custom' | 'other';
  model_url: string;
  position?: Vector3;
  rotation?: Vector3;
  scale?: Vector3;
  dimensions?: {
    width: number;
    height: number;
    depth: number;
  };
  metadata?: Record<string, any>;
}
type TabType = 'layer' | 'ai-simulation' | 'ai-optimization' | 'apply';

// 시뮬레이션 결과 상태 타입
interface SimulationResults {
  layout: LayoutResult | null;
  flow: FlowResult | null;
  congestion: CongestionResult | null;
  staffing: StaffingResult | null;
}

// 패널 표시 상태 타입
interface VisiblePanels {
  tools: boolean;
  sceneSave: boolean;
  property: boolean;
  resultReport: boolean; // 통합 결과 리포트
}

// ============================================================================
// 메인 페이지 컴포넌트
// ============================================================================
export default function DigitalTwinStudioPage() {
  const {
    user
  } = useAuth();
  const {
    logActivity
  } = useActivityLogger();
  const location = useLocation();
  const {
    selectedStore
  } = useSelectedStore();
  const {
    getDays
  } = useDateFilterStore();

  // 모드 관리
  const {
    mode,
    setMode,
    isEditMode
  } = useStudioMode({
    initialMode: 'view'
  });

  // 오버레이 관리
  const {
    activeOverlays,
    toggleOverlay,
    setOverlayVisibility,
    isActive
  } = useOverlayVisibility();

  // 씬 저장 관리
  const {
    scenes,
    activeScene,
    isSaving,
    saveScene,
    deleteScene,
    setActiveScene,
    clearActiveScene,
    renameScene  // 🆕 추가
  } = useScenePersistence({
    userId: user?.id,
    storeId: selectedStore?.id
  });

  // 씬 기반 시뮬레이션 (As-is → To-be)
  const sceneSimulation = useSceneSimulation();

  // 매장 경계 및 입구 위치 (zones_dim 기반)
  const {
    storeBounds,
    entrancePosition,
    zonePositions,
    zoneSizes,
    zones: dbZones
  } = useStoreBounds();

  // 🔍 DEBUG: zones_dim 데이터 확인
  useEffect(() => {
    console.log('[DigitalTwinStudio] zones_dim data:', {
      count: dbZones?.length || 0,
      zones: dbZones?.map(z => ({ id: z.id, name: z.zone_name, type: z.zone_type })) || []
    });
  }, [dbZones]);

  // 실제 DB 스태프 데이터
  const {
    staff: dbStaff,
    loading: staffLoading,
    error: staffError
  } = useStaffData({
    storeId: selectedStore?.id
  });

  // 🆕 로그인된 계정의 스토어 ID
  const storeId = selectedStore?.id;

  // 🆕 환경 컨텍스트 (실시간 날씨, 공휴일, 이벤트)
  const {
    context: envContext,
    isLoading: isEnvLoading,
    impact: envImpact,
    currentTime: envCurrentTime
  } = useEnvironmentContext({
    storeId: storeId || '',
    enabled: !!storeId,
    autoRefresh: true
  });

  // 🆕 실제 히트맵 데이터 (zone_daily_metrics.heatmap_intensity 기반)
  const {
    data: zoneHeatmapData,
    isLoading: heatmapLoading
  } = useZoneHeatmapData(storeId);

  // 스태프 데이터 디버깅
  useEffect(() => {
    const debugInfo = {
      selectedStoreId: selectedStore?.id,
      selectedStoreName: selectedStore?.store_name,
      expectedStoreId: 'd9830554-2688-4032-af40-acccda787ac4',
      idMatch: selectedStore?.id === 'd9830554-2688-4032-af40-acccda787ac4',
      staffCount: dbStaff?.length || 0,
      staffLoading,
      staffError: staffError?.message
    };
    console.log('%c[DigitalTwinStudio] Staff Debug', 'background: yellow; color: black; font-size: 14px', debugInfo);

    // window에도 저장
    if (typeof window !== 'undefined') {
      (window as any).__studioDebug = debugInfo;
    }
  }, [selectedStore?.id, dbStaff, staffLoading, staffError]);

  // UI 상태
  const [activeTab, setActiveTab] = useState<TabType>('layer');
  const [searchParams] = useSearchParams();
  const tabFromUrl = searchParams.get('tab') as TabType | null;

  // URL 쿼리 파라미터로 탭 전환 (AI 어시스턴트 연동)
  useEffect(() => {
    if (tabFromUrl && ['layer', 'ai-simulation', 'ai-optimization', 'apply'].includes(tabFromUrl)) {
      setActiveTab(tabFromUrl);
    }
  }, [tabFromUrl]);

  // Refs for assistant event handlers (순서 독립적 참조)
  const saveSceneRef = useRef<(name: string) => void>(() => {});
  const currentRecipeRef = useRef<SceneRecipe | null>(null);
  const sceneNameRef = useRef('');

  const [models, setModels] = useState<ModelLayer[]>([]);
  const [activeLayers, setActiveLayers] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [sceneName, setSceneName] = useState('');
  const [transformMode, setTransformMode] = useState<TransformMode>('translate');

  // 패널 리사이즈 상태
  const PANEL_MIN_WIDTH = 280;
  const PANEL_MAX_WIDTH = 500;
  const PANEL_DEFAULT_WIDTH = 320;
  const [panelWidth, setPanelWidth] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('studio_panel_width');
      if (saved) {
        const parsed = parseInt(saved, 10);
        if (!isNaN(parsed) && parsed >= PANEL_MIN_WIDTH && parsed <= PANEL_MAX_WIDTH) {
          return parsed;
        }
      }
    }
    return PANEL_DEFAULT_WIDTH;
  });
  const [isResizing, setIsResizing] = useState(false);
  const [isPanelCollapsed, setIsPanelCollapsed] = useState(false);

  // 플로팅 패널 위치 상수
  const FLOATING_PANEL_TOP = 60;  // ViewModeToggle 아래 시작점
  const FLOATING_PANEL_GAP = 8;   // 패널 간 간격

  // 씬 저장 패널 실제 높이 (동적 추적)
  const [sceneSavePanelHeight, setSceneSavePanelHeight] = useState(0);

  // As-Is / To-Be / Split 뷰 모드
  const [viewMode, setViewMode] = useState<ViewMode>('as-is');

  // 드래그 패널 표시 상태
  const [visiblePanels, setVisiblePanels] = useState<VisiblePanels>({
    tools: false,
    sceneSave: false,  // 기본값 OFF
    property: true,
    resultReport: false // 결과 있을 때만 자동 표시
  });

  // ============================================
  // AI 어시스턴트 이벤트 리스너 (챗 → 스튜디오 제어)
  // 모든 의존 상태(setViewMode, setVisiblePanels 등)가 선언된 이후에 배치
  // ============================================
  useEffect(() => {
    // 1. 오버레이 토글
    const handleToggleOverlay = (e: Event) => {
      const { overlay, visible } = (e as CustomEvent).detail;
      if (overlay) {
        if (visible === true) {
          setOverlayVisibility(overlay, true);
        } else if (visible === false) {
          setOverlayVisibility(overlay, false);
        } else {
          toggleOverlay(overlay);
        }
        console.log('[Studio:Assistant] toggle_overlay:', overlay, visible);
      }
    };

    // 2. 시뮬레이션 제어
    const handleSimulationControl = (e: Event) => {
      const { command, speed } = (e as CustomEvent).detail;
      const simStore = useSimulationStore.getState();
      switch (command) {
        case 'play':
          if (simStore.isPaused) simStore.resume();
          else if (!simStore.isRunning) {
            setOverlayVisibility('avatar', true);
            simStore.start();
          }
          break;
        case 'pause':
          if (simStore.isRunning && !simStore.isPaused) simStore.pause();
          break;
        case 'stop':
          simStore.stop();
          break;
        case 'reset':
          simStore.reset();
          break;
        case 'set_speed':
          if (speed !== undefined) simStore.setSpeed(speed);
          break;
      }
      console.log('[Studio:Assistant] simulation_control:', command, speed);
    };

    // 3. 프리셋 시나리오 적용
    const handleApplyPreset = (e: Event) => {
      const { preset } = (e as CustomEvent).detail;
      if (preset) {
        window.dispatchEvent(new CustomEvent('studio:apply-preset-internal', {
          detail: { preset },
        }));
        setActiveTab('ai-simulation');
        console.log('[Studio:Assistant] apply_preset:', preset);
      }
    };

    // 4. 시뮬레이션 실행
    const handleRunSimulation = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      setActiveTab('ai-simulation');
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent('studio:run-simulation-internal', {
          detail,
        }));
      }, 300);
      console.log('[Studio:Assistant] run_simulation:', detail);
    };

    // 5. 최적화 실행
    const handleRunOptimization = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      setActiveTab('ai-optimization');
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent('studio:run-optimization-internal', {
          detail,
        }));
      }, 300);
      console.log('[Studio:Assistant] run_optimization:', detail);
    };

    // 6. 시뮬레이션 파라미터 설정
    const handleSetSimulationParams = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      setActiveTab('ai-simulation');
      window.dispatchEvent(new CustomEvent('studio:set-sim-params-internal', {
        detail,
      }));
      console.log('[Studio:Assistant] set_simulation_params:', detail);
    };

    // 7. 최적화 설정
    const handleSetOptimizationConfig = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      setActiveTab('ai-optimization');
      window.dispatchEvent(new CustomEvent('studio:set-opt-config-internal', {
        detail,
      }));
      console.log('[Studio:Assistant] set_optimization_config:', detail);
    };

    // 8. 뷰 모드 전환
    const handleSetViewMode = (e: Event) => {
      const { mode } = (e as CustomEvent).detail;
      if (mode && ['as-is', 'compare', 'to-be'].includes(mode)) {
        setViewMode(mode as ViewMode);
        console.log('[Studio:Assistant] set_view_mode:', mode);
      }
    };

    // 9. 패널 토글
    const handleTogglePanel = (e: Event) => {
      const { panel, visible } = (e as CustomEvent).detail;
      if (panel && (panel === 'resultReport' || panel === 'sceneSave')) {
        setVisiblePanels(prev => ({
          ...prev,
          [panel]: visible !== undefined ? visible : !prev[panel],
        }));
        console.log('[Studio:Assistant] toggle_panel:', panel, visible);
      }
    };

    // 10. 씬 저장 (ref 사용으로 순서 독립)
    const handleSaveSceneEvent = (e: Event) => {
      const { name } = (e as CustomEvent).detail;
      if (currentRecipeRef.current) {
        const saveName = name || sceneNameRef.current || `씬_${new Date().toLocaleString('ko-KR')}`;
        saveSceneRef.current(saveName);
        console.log('[Studio:Assistant] save_scene:', saveName);
      } else {
        toast.error('저장할 씬 데이터가 없습니다');
      }
    };

    // 11. 환경 설정 변경
    const handleSetEnvironment = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      setActiveTab('ai-simulation');
      window.dispatchEvent(new CustomEvent('studio:set-environment-internal', {
        detail,
      }));
      console.log('[Studio:Assistant] set_environment:', detail);
    };

    // 이벤트 리스너 등록
    window.addEventListener('assistant:toggle-overlay', handleToggleOverlay);
    window.addEventListener('assistant:simulation-control', handleSimulationControl);
    window.addEventListener('assistant:apply-preset', handleApplyPreset);
    window.addEventListener('assistant:run-simulation', handleRunSimulation);
    window.addEventListener('assistant:run-optimization', handleRunOptimization);
    window.addEventListener('assistant:set-simulation-params', handleSetSimulationParams);
    window.addEventListener('assistant:set-optimization-config', handleSetOptimizationConfig);
    window.addEventListener('assistant:set-view-mode', handleSetViewMode);
    window.addEventListener('assistant:toggle-panel', handleTogglePanel);
    window.addEventListener('assistant:save-scene', handleSaveSceneEvent);
    window.addEventListener('assistant:set-environment', handleSetEnvironment);

    return () => {
      window.removeEventListener('assistant:toggle-overlay', handleToggleOverlay);
      window.removeEventListener('assistant:simulation-control', handleSimulationControl);
      window.removeEventListener('assistant:apply-preset', handleApplyPreset);
      window.removeEventListener('assistant:run-simulation', handleRunSimulation);
      window.removeEventListener('assistant:run-optimization', handleRunOptimization);
      window.removeEventListener('assistant:set-simulation-params', handleSetSimulationParams);
      window.removeEventListener('assistant:set-optimization-config', handleSetOptimizationConfig);
      window.removeEventListener('assistant:set-view-mode', handleSetViewMode);
      window.removeEventListener('assistant:toggle-panel', handleTogglePanel);
      window.removeEventListener('assistant:save-scene', handleSaveSceneEvent);
      window.removeEventListener('assistant:set-environment', handleSetEnvironment);
    };
  }, [toggleOverlay, setOverlayVisibility, setActiveTab, setViewMode, setVisiblePanels]);

  // 씬 저장 패널이 닫히면 높이 초기화
  useEffect(() => {
    if (!visiblePanels.sceneSave) {
      setSceneSavePanelHeight(0);
    }
  }, [visiblePanels.sceneSave]);

  // 시뮬레이션 결과 상태
  const [simulationResults, setSimulationResults] = useState<SimulationResults>({
    layout: null,
    flow: null,
    congestion: null,
    staffing: null
  });

  // AI 시뮬레이션에서 발견된 진단 결과
  const [diagnosticIssues, setDiagnosticIssues] = useState<DiagnosticIssue[]>([]);

  // 🆕 환경 효과 렌더링 설정 (날씨, 시간대 등)
  const [environmentRenderingConfig, setEnvironmentRenderingConfig] = useState<RenderingConfig | null>(null);

  // 🆕 낮/밤 모드 상태 (현재 시간 기반으로 초기화)
  const [isDayMode, setIsDayMode] = useState<boolean>(() => isCurrentTimeDayMode());

  // 🆕 시뮬레이션 환경 설정 원본 (AI 최적화에 전달용)
  const [simulationEnvConfig, setSimulationEnvConfig] = useState<SimulationEnvironmentConfig | null>(null);

  // 🆕 환경 설정 변경 핸들러
  const handleEnvironmentConfigChange = useCallback((config: SimulationEnvironmentConfig) => {
    console.log('[DigitalTwinStudio] Environment config changed:', {
      mode: config.mode,
      weather: config.manualSettings?.weather,
      timeOfDay: config.manualSettings?.timeOfDay,
      autoLoadedWeather: config.autoLoadedData?.weather?.condition
    });

    // 원본 설정 저장 (AI 최적화에서 사용)
    setSimulationEnvConfig(config);
    if (config.mode === 'realtime') {
      // 🆕 실시간 모드: 현재 시간 기반으로 낮/밤 판별
      const dayMode = isCurrentTimeDayMode();
      console.log('[DigitalTwinStudio] Realtime mode - current time isDayMode:', dayMode);
      setIsDayMode(dayMode);
      setEnvironmentRenderingConfig(null); // 렌더링 설정은 SceneEnvironment에서 처리
    } else if (config.mode === 'dateSelect') {
      // 날짜 선택 모드: 선택한 시간대에 따라 판별
      const timeOfDay = config.manualSettings?.timeOfDay || 'afternoon';
      const dayMode = isDayTimeWithPeakData(timeOfDay);
      console.log('[DigitalTwinStudio] DateSelect mode:', {
        timeOfDay,
        dayMode
      });
      setIsDayMode(dayMode);
      if (dayMode) {
        setEnvironmentRenderingConfig(null);
      } else {
        const renderingConfig = convertToRenderingConfig(config);
        setEnvironmentRenderingConfig(renderingConfig);
      }
    } else if (config.mode === 'manual') {
      // 직접 설정 모드: 선택한 시간대에 따라 판별
      const timeOfDay = config.manualSettings?.timeOfDay || 'afternoon';

      // 피크 시간대는 데이터 기반으로 판별 (현재는 기본값 사용)
      // TODO: 실제 피크 시간 데이터 연동 시 peakHour 전달
      const dayMode = isDayTimeWithPeakData(timeOfDay);
      console.log('[DigitalTwinStudio] Manual mode:', {
        timeOfDay,
        dayMode
      });
      setIsDayMode(dayMode);
      if (dayMode) {
        // 낮 모드: 렌더링 설정 제거 → 초기 씬 상태 유지
        console.log('[DigitalTwinStudio] Day mode - clearing rendering config for initial state');
        setEnvironmentRenderingConfig(null);
      } else {
        // 밤 모드: 렌더링 설정 적용
        const renderingConfig = convertToRenderingConfig(config);
        console.log('[DigitalTwinStudio] Night mode - Setting rendering config:', {
          weatherCondition: renderingConfig.weatherCondition,
          particleType: renderingConfig.particles?.weatherParticles?.type,
          particleCount: renderingConfig.particles?.weatherParticles?.count,
          particleEnabled: renderingConfig.particles?.weatherParticles?.enabled
        });
        setEnvironmentRenderingConfig(renderingConfig);
      }
    }
  }, []);

  // 실시간 모드에서 1분마다 낮/밤 상태 체크
  useEffect(() => {
    if (simulationEnvConfig?.mode !== 'realtime') return;
    const checkTime = () => {
      const dayMode = isCurrentTimeDayMode();
      setIsDayMode(dayMode);
    };

    // 1분마다 체크
    const interval = setInterval(checkTime, 60 * 1000);
    return () => clearInterval(interval);
  }, [simulationEnvConfig?.mode]);

  // 시뮬레이션 데이터
  const days = getDays();
  const {
    contextData,
    loading: contextLoading
  } = useStoreContext(selectedStore?.id, days);
  const {
    loading: isInferring
  } = useEnhancedAIInference();

  // 페이지 방문 로깅
  useEffect(() => {
    logActivity('page_view', {
      page: location.pathname,
      page_name: 'Digital Twin Studio (New)',
      mode,
      timestamp: new Date().toISOString()
    });
  }, [location.pathname, mode]);

  // 패널 너비 localStorage 저장
  useEffect(() => {
    if (!isPanelCollapsed) {
      localStorage.setItem('studio_panel_width', panelWidth.toString());
    }
  }, [panelWidth, isPanelCollapsed]);

  // 패널 리사이즈 핸들러
  const handleResizeStart = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
    const startX = e.clientX;
    const startWidth = panelWidth;
    const onMouseMove = (e: MouseEvent) => {
      const newWidth = startWidth + (e.clientX - startX);
      setPanelWidth(Math.min(PANEL_MAX_WIDTH, Math.max(PANEL_MIN_WIDTH, newWidth)));
    };
    const onMouseUp = () => {
      setIsResizing(false);
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
  }, [panelWidth, PANEL_MAX_WIDTH, PANEL_MIN_WIDTH]);

  // 패널 접기/펼치기
  const togglePanelCollapse = useCallback(() => {
    setIsPanelCollapsed(prev => !prev);
  }, []);

  // 모델 로드
  const loadModelsAsync = async () => {
    if (!user) return;
    setLoading(true);
    try {
      console.log('[DigitalTwinStudio] Loading models for user:', user.id, 'store:', selectedStore?.id);
      const loadedModels = await loadUserModels(user.id, selectedStore?.id);

      // 🔍 DEBUG: 로드된 모델의 childProducts 확인
      const furnitureWithChildren = loadedModels.filter(m => m.type === 'furniture' && (m.metadata as any)?.childProducts?.length > 0);
      const totalChildProducts = furnitureWithChildren.reduce((sum, m) => sum + ((m.metadata as any)?.childProducts?.length || 0), 0);
      console.log('[DigitalTwinStudio] Loaded models:', {
        total: loadedModels.length,
        furniture: loadedModels.filter(m => m.type === 'furniture').length,
        products: loadedModels.filter(m => m.type === 'product').length,
        furnitureWithChildren: furnitureWithChildren.length,
        totalChildProducts
      });
      setModels(loadedModels);
      if (loadedModels.length > 0) {
        setActiveLayers(loadedModels.map(m => m.id));
      }
    } catch (error) {
      console.error('[DigitalTwinStudio] Error loading models:', error);
      toast.error('모델 로드 실패');
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    loadModelsAsync();
  }, [user, selectedStore]);

  // 🔧 FIX: 저장된 씬 불러오기 - activeScene이 변경되면 씬 복원
  useEffect(() => {
    if (!activeScene?.recipe_data || !user) return;
    
    const recipe = activeScene.recipe_data as SceneRecipe;
    console.log('[DigitalTwinStudio] Loading saved scene:', activeScene.name, recipe);
    
    // 원본 데이터를 기반으로 위치만 덮어쓰는 방식으로 복원
    const restoreScene = async () => {
      try {
        // 1. 먼저 원본 모델 데이터 로드 (metadata, childProducts 등 포함)
        const originalModels = await loadUserModels(user.id, selectedStore?.id);
        
        // 2. 저장된 recipe에서 위치 정보만 추출하여 매핑
        const positionMap = new Map<string, { position: any; rotation: any; scale: any }>();
        
        if (recipe.space) {
          positionMap.set(recipe.space.id, {
            position: recipe.space.position,
            rotation: recipe.space.rotation,
            scale: recipe.space.scale,
          });
        }
        
        if (recipe.furniture) {
          recipe.furniture.forEach(f => {
            positionMap.set(f.id, {
              position: f.position,
              rotation: f.rotation,
              scale: f.scale,
            });
          });
        }
        
        if (recipe.products) {
          recipe.products.forEach(p => {
            positionMap.set(p.id, {
              position: p.position,
              rotation: p.rotation,
              scale: p.scale,
            });
          });
        }
        
        // 3. 원본 모델에 저장된 위치 적용
        const restoredModels = originalModels.map(m => {
          const savedPos = positionMap.get(m.id);
          if (savedPos) {
            return {
              ...m,
              position: savedPos.position,
              rotation: savedPos.rotation,
              scale: savedPos.scale,
            };
          }
          return m;
        });
        
        console.log('[DigitalTwinStudio] Restored models with saved positions:', {
          total: restoredModels.length,
          positionsApplied: positionMap.size
        });
        
        setModels(restoredModels);
        setActiveLayers(restoredModels.map(m => m.id));
        setSceneName(activeScene.name);
        toast.success(`씬 "${activeScene.name}" 불러오기 완료`);
      } catch (error) {
        console.error('[DigitalTwinStudio] Failed to restore scene:', error);
        toast.error('씬 불러오기 실패');
      }
    };
    
    restoreScene();
  }, [activeScene, user, selectedStore]);

  // 패널 닫기 핸들러
  const closePanel = useCallback((panelId: keyof VisiblePanels) => {
    setVisiblePanels(prev => ({
      ...prev,
      [panelId]: false
    }));
  }, []);

  // 시뮬레이션 완료 핸들러
  const handleSimulationComplete = useCallback((type: keyof SimulationResults, result: LayoutResult | FlowResult | CongestionResult | StaffingResult) => {
    setSimulationResults(prev => ({
      ...prev,
      [type]: result
    }));
    const panelKey = `${type}Result` as keyof VisiblePanels;
    setVisiblePanels(prev => ({
      ...prev,
      [panelKey]: true
    }));
  }, []);

  // 시뮬레이션 실행 핸들러
  const handleRunSimulation = useCallback((scenarios: SimulationScenario[]) => {
    toast.info(`시뮬레이션 실행: ${scenarios.join(', ')}`);

    // 각 시나리오별 Mock 결과 생성 (실제 구현시 API 연동)
    scenarios.forEach(scenario => {
      setTimeout(() => {
        switch (scenario) {
          case 'layout':
            handleSimulationComplete('layout', {
              currentEfficiency: 72,
              optimizedEfficiency: 89,
              revenueIncrease: 2400000,
              dwellTimeIncrease: 8,
              conversionIncrease: 3.2,
              changes: [{
                item: '메인 테이블',
                from: 'A존 중앙',
                to: 'B존 입구',
                effect: '+15% 노출'
              }, {
                item: '디스플레이',
                from: '벽면',
                to: '동선 교차점',
                effect: '+23% 체류'
              }]
            });
            break;
          case 'flow':
            handleSimulationComplete('flow', {
              currentPathLength: 45,
              optimizedPathLength: 38,
              bottlenecks: [{
                location: '입구 → A존',
                congestion: 78,
                cause: '통로 폭 부족',
                suggestion: '진열대 이동'
              }, {
                location: 'B존 중앙',
                congestion: 65,
                cause: '고객 체류',
                suggestion: '휴식 공간 추가'
              }],
              improvements: [{
                metric: '평균 이동 시간',
                value: '-18%'
              }, {
                metric: '병목 해소율',
                value: '85%'
              }, {
                metric: '고객 만족도',
                value: '+12%'
              }]
            });
            break;
          case 'congestion':
            handleSimulationComplete('congestion', {
              date: '2024-12-15 (일)',
              peakHours: '14:00 - 16:00',
              peakCongestion: 85,
              maxCapacity: 50,
              hourlyData: [{
                hour: '10:00',
                congestion: 25
              }, {
                hour: '12:00',
                congestion: 55
              }, {
                hour: '14:00',
                congestion: 85
              }, {
                hour: '16:00',
                congestion: 70
              }, {
                hour: '18:00',
                congestion: 45
              }, {
                hour: '20:00',
                congestion: 30
              }],
              zoneData: [{
                zone: '입구',
                congestion: 45
              }, {
                zone: 'A존',
                congestion: 85
              }, {
                zone: 'B존',
                congestion: 60
              }, {
                zone: '계산대',
                congestion: 75
              }],
              recommendations: ['14-16시 추가 인력 배치', 'A존 진열대 간격 확대', '계산대 운영 효율화']
            });
            break;
          case 'staffing':
            handleSimulationComplete('staffing', {
              currentCoverage: 68,
              optimizedCoverage: 92,
              staffCount: 3,
              staffPositions: [{
                name: '직원 A',
                current: '입구',
                suggested: 'A존 중앙',
                coverageGain: '+12%'
              }, {
                name: '직원 B',
                current: 'B존',
                suggested: 'A-B존 경계',
                coverageGain: '+8%'
              }, {
                name: '직원 C',
                current: '계산대',
                suggested: '계산대',
                coverageGain: '유지'
              }],
              improvements: [{
                metric: '고객 응대율',
                value: '+35%'
              }, {
                metric: '대기 시간',
                value: '-25%'
              }, {
                metric: '매출 효과',
                value: '+₩150만/월'
              }]
            });
            break;
        }
      }, 1000 + Math.random() * 1000);
    });
  }, [handleSimulationComplete]);

  // SceneRecipe 생성 (handleRunAllSimulations보다 먼저 정의되어야 함)
  // SceneRecipe 생성 (handleRunAllSimulations에서 사용하므로 먼저 정의)
  const currentRecipe = useMemo<SceneRecipe | null>(() => {
    const activeModels = models.filter(m => activeLayers.includes(m.id));
    if (activeModels.length === 0) return null;
    const spaceModel = activeModels.find(m => m.type === 'space');
    if (!spaceModel) return null;
    const lightingPreset: LightingPreset = {
      name: 'warm-retail',
      description: 'Default',
      lights: [{
        type: 'ambient',
        color: '#ffffff',
        intensity: 0.5
      }, {
        type: 'directional',
        color: '#ffffff',
        intensity: 1,
        position: {
          x: 10,
          y: 10,
          z: 5
        }
      }]
    };
    const furnitureList = activeModels.filter(m => m.type === 'furniture').map(m => {
      const metaChildProducts = (m.metadata as any)?.childProducts;
      return {
        id: m.id,
        model_url: m.model_url,
        type: 'furniture' as const,
        furniture_type: m.name,
        position: m.position || {
          x: 0,
          y: 0,
          z: 0
        },
        rotation: m.rotation || {
          x: 0,
          y: 0,
          z: 0
        },
        scale: m.scale || {
          x: 1,
          y: 1,
          z: 1
        },
        dimensions: m.dimensions,
        movable: true,
        metadata: m.metadata,
        // 🔧 FIX: 가구에 배치된 자식 제품들 (상대 좌표 사용)
        childProducts: metaChildProducts?.map((cp: any) => ({
          id: cp.id,
          type: 'product' as const,
          model_url: cp.model_url,
          position: cp.position || {
            x: 0,
            y: 0,
            z: 0
          },
          rotation: cp.rotation || {
            x: 0,
            y: 0,
            z: 0
          },
          scale: cp.scale || {
            x: 1,
            y: 1,
            z: 1
          },
          sku: cp.name,
          display_type: cp.metadata?.displayType,
          dimensions: cp.dimensions,
          isRelativePosition: true,
          metadata: cp.metadata
        })) || []
      };
    });
    const productsList = activeModels.filter(m => m.type === 'product').map(m => ({
      id: m.id,
      model_url: m.model_url,
      type: 'product' as const,
      product_id: m.metadata?.entityId,
      sku: m.name,
      position: m.position || {
        x: 0,
        y: 0,
        z: 0
      },
      rotation: m.rotation || {
        x: 0,
        y: 0,
        z: 0
      },
      scale: m.scale || {
        x: 1,
        y: 1,
        z: 1
      },
      dimensions: m.dimensions,
      movable: true,
      metadata: m.metadata
    }));

    // 🔍 DEBUG: currentRecipe의 childProducts 확인
    const totalChildProducts = furnitureList.reduce((sum, f) => sum + ((f as any).childProducts?.length || 0), 0);
    console.log('[DigitalTwinStudio] currentRecipe built:', {
      furnitureCount: furnitureList.length,
      productsCount: productsList.length,
      childProductsTotal: totalChildProducts,
      furnitureWithChildren: furnitureList.filter(f => (f as any).childProducts?.length > 0).length
    });
    return {
      space: {
        id: spaceModel.id,
        model_url: spaceModel.model_url,
        type: 'space',
        position: spaceModel.position || {
          x: 0,
          y: 0,
          z: 0
        },
        rotation: spaceModel.rotation || {
          x: 0,
          y: 0,
          z: 0
        },
        scale: spaceModel.scale || {
          x: 1,
          y: 1,
          z: 1
        },
        dimensions: spaceModel.dimensions,
        metadata: spaceModel.metadata
      },
      furniture: furnitureList,
      products: productsList,
      lighting: lightingPreset,
      camera: {
        position: {
          x: 10,
          y: 10,
          z: 15
        },
        target: {
          x: 0,
          y: 0,
          z: 0
        },
        fov: 50
      }
    };
  }, [models, activeLayers]);

  // 전체 시뮬레이션 실행 (씬 기반 + 레거시 UI 결과)
  const handleRunAllSimulations = useCallback(async () => {
    setMode('simulate');

    // 레거시 UI 결과 패널용 (데모 데이터)
    handleRunSimulation(['layout', 'flow', 'congestion', 'staffing']);

    // 씬 기반 시뮬레이션도 함께 실행 (실제 모델 이동용)
    // currentRecipe를 직접 전달하여 state 동기화 문제 해결
    if (currentRecipe) {
      await sceneSimulation.runAllSimulations({
        layout: {
          goal: 'revenue'
        },
        flow: {
          duration: '1hour',
          customerCount: 100
        },
        staffing: {
          staffCount: 3,
          goal: 'customer_service'
        }
      }, currentRecipe // 씬 직접 전달
      );
    }
  }, [setMode, handleRunSimulation, currentRecipe, sceneSimulation]);

  // SceneProvider용 모델 변환
  // - DB(rotation_x/y/z)는 degree로 저장되어 있어 three.js에 전달 전 radians로 변환
  const sceneModels: Model3D[] = useMemo(() => {
    const degToRad = (deg: number) => deg * Math.PI / 180;
    const result = models.filter(m => activeLayers.includes(m.id)).map(m => {
      const converted = {
        id: m.id,
        name: m.name,
        url: m.model_url,
        position: [m.position?.x || 0, m.position?.y || 0, m.position?.z || 0] as [number, number, number],
        rotation: [degToRad(m.rotation?.x || 0), degToRad(m.rotation?.y || 0), degToRad(m.rotation?.z || 0)] as [number, number, number],
        scale: [m.scale?.x || 1, m.scale?.y || 1, m.scale?.z || 1] as [number, number, number],
        visible: true,
        type: m.type,
        metadata: m.metadata,
        dimensions: m.dimensions
      };
      return converted;
    });

    // 🔍 DEBUG: sceneModels의 childProducts 확인
    const furnitureWithChildren = result.filter(m => m.type === 'furniture' && (m.metadata as any)?.childProducts?.length > 0);
    console.log('[DigitalTwinStudio] sceneModels built:', {
      total: result.length,
      furniture: result.filter(m => m.type === 'furniture').length,
      furnitureWithChildren: furnitureWithChildren.length,
      totalChildProducts: furnitureWithChildren.reduce((sum, m) => sum + ((m.metadata as any)?.childProducts?.length || 0), 0)
    });
    return result;
  }, [models, activeLayers]);

  // As-is → To-be 씬 기반 시뮬레이션 실행
  const handleRunSceneSimulation = useCallback(async () => {
    if (!currentRecipe) {
      toast.error('씬을 먼저 구성해주세요');
      return;
    }

    // 씬 직접 전달하여 시뮬레이션 실행
    await sceneSimulation.runAllSimulations({
      layout: {
        goal: 'revenue'
      },
      flow: {
        duration: '1hour',
        customerCount: 100
      },
      staffing: {
        staffCount: 3,
        goal: 'customer_service'
      }
    }, currentRecipe);

    // AI 시뮬레이션 탭으로 전환
    setActiveTab('ai-simulation');
    setMode('simulate');
  }, [currentRecipe, sceneSimulation, setMode]);

  // 데모 오버레이 데이터
  const demoHeatPoints: HeatPoint[] = useMemo(() => [{
    x: 0,
    y: 0,
    z: 0,
    intensity: 0.8
  }, {
    x: 3,
    y: 0,
    z: 2,
    intensity: 0.6
  }, {
    x: -2,
    y: 0,
    z: 3,
    intensity: 0.9
  }, {
    x: 4,
    y: 0,
    z: -2,
    intensity: 0.4
  }], []);

  // demoFlows 제거됨 - CustomerFlowOverlayEnhanced에서 DB 기반 데이터 사용

  const demoZones: ZoneBoundary[] = useMemo(() => [{
    id: 'zone-1',
    name: '입구',
    points: [[-6, 0, -3], [-6, 0, 3], [-3, 0, 3], [-3, 0, -3]],
    color: '#3b82f6'
  }, {
    id: 'zone-2',
    name: '디스플레이',
    points: [[-3, 0, -3], [-3, 0, 3], [3, 0, 3], [3, 0, -3]],
    color: '#22c55e'
  }, {
    id: 'zone-3',
    name: '계산대',
    points: [[3, 0, -3], [3, 0, 3], [6, 0, 3], [6, 0, -3]],
    color: '#f59e0b'
  }], []);

  // 🔧 FIX: zones_dim 데이터 기반 시뮬레이션 존 (DB 우선, 폴백으로 demoZones 사용)
  const simulationZones = useMemo(() => {
    // DB에서 로드한 zones_dim 데이터가 있으면 우선 사용
    if (dbZones && dbZones.length > 0) {
      console.log('[SimulationZones] Using DB zones:', dbZones.length, 'zones');
      return dbZones.map(zone => ({
        id: zone.id,
        zone_name: zone.zone_name,
        x: zone.position_x || zone.coordinates?.x || 0,
        z: zone.position_z || zone.coordinates?.z || 0,
        width: zone.size_width || zone.coordinates?.width || 3,
        depth: zone.size_depth || zone.coordinates?.depth || 3,
        zone_type: zone.zone_type || 'display'
      }));
    }

    // 폴백: demoZones 사용 (DB 데이터가 없는 경우)
    console.log('[SimulationZones] Using demo zones (DB zones not available)');
    return demoZones.map(zone => {
      // points 배열에서 x, z 범위 계산
      const xValues = zone.points.map(p => p[0]);
      const zValues = zone.points.map(p => p[2]);
      const minX = Math.min(...xValues);
      const maxX = Math.max(...xValues);
      const minZ = Math.min(...zValues);
      const maxZ = Math.max(...zValues);

      // 중심점과 크기 계산
      const centerX = (minX + maxX) / 2;
      const centerZ = (minZ + maxZ) / 2;
      const width = maxX - minX;
      const depth = maxZ - minZ;

      // zone_type 추론 (이름 기반)
      let zone_type = 'display';
      const nameLower = zone.name.toLowerCase();
      if (nameLower.includes('입구') || nameLower.includes('entry') || nameLower.includes('entrance')) {
        zone_type = 'entrance';
      } else if (nameLower.includes('출구') || nameLower.includes('exit')) {
        zone_type = 'exit';
      } else if (nameLower.includes('계산') || nameLower.includes('checkout') || nameLower.includes('register')) {
        zone_type = 'checkout';
      } else if (nameLower.includes('피팅') || nameLower.includes('fitting')) {
        zone_type = 'fitting';
      }
      return {
        id: zone.id,
        zone_name: zone.name,
        x: centerX,
        z: centerZ,
        width,
        depth,
        zone_type
      };
    });
  }, [dbZones, demoZones]);

  // 🆕 새 씬 생성 모드 상태
  const [isNewSceneMode, setIsNewSceneMode] = useState(false);

  // 씬 저장 핸들러 - 수정: 이름이 같으면 업데이트, 다르면 새로 생성
  const handleSaveScene = async (name: string) => {
    if (!currentRecipe) {
      toast.error('저장할 씬 데이터가 없습니다');
      return;
    }
    
    try {
      // 🔧 FIX: 안전한 씬 찾기 (name이 undefined인 경우 처리)
      const existingScene = scenes.find(s => s.name && s.name === name);
      
      // 새 씬 모드이거나 기존 씬이 없으면 새로 생성
      const shouldUpdate = !isNewSceneMode && existingScene && existingScene.id;
      
      console.log('[handleSaveScene]', {
        name,
        isNewSceneMode,
        existingScene: existingScene?.id,
        shouldUpdate,
        scenesCount: scenes.length
      });
      
      await saveScene(currentRecipe, name, shouldUpdate ? existingScene.id : undefined);
      setSceneName(name);
      setIsNewSceneMode(false); // 저장 후 새 씬 모드 해제
      
      logActivity('feature_use', {
        feature: 'scene_save',
        scene_name: name,
        layer_count: activeLayers.length,
        store_id: selectedStore?.id,
        is_new: !shouldUpdate
      });
    } catch (err) {
      console.error('[handleSaveScene] Error:', err);
      // 에러는 useScenePersistence에서 처리
    }
  };

  // AI 어시스턴트 ref 업데이트 (이벤트 리스너에서 최신 값 참조용)
  useEffect(() => {
    saveSceneRef.current = handleSaveScene;
  }, [handleSaveScene]);
  useEffect(() => {
    currentRecipeRef.current = currentRecipe;
  }, [currentRecipe]);
  useEffect(() => {
    sceneNameRef.current = sceneName;
  }, [sceneName]);

  // 새 씬 버튼 핸들러
  const handleNewScene = useCallback(() => {
    setSceneName('');
    setIsNewSceneMode(true);
    toast.info('새 씬 이름을 입력해주세요');
  }, []);

  // 🆕 씬 초기화 (뉴럴트윈 기본값으로 복원)
  const handleResetScene = useCallback(async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      console.log('[DigitalTwinStudio] Resetting scene to original data...');
      
      // 🔧 FIX: 활성 씬 해제 (DB에서 is_active = false로 설정)
      try {
        await clearActiveScene();
        console.log('[DigitalTwinStudio] Active scene cleared');
      } catch (clearError) {
        console.warn('[DigitalTwinStudio] clearActiveScene failed (non-critical):', clearError);
        // 활성 씬 해제 실패해도 계속 진행
      }
      
      // furniture 테이블의 원본 데이터 로드
      const loadedModels = await loadUserModels(user.id, selectedStore?.id);
      console.log('[DigitalTwinStudio] Loaded original models:', loadedModels.length);
      
      setModels(loadedModels);
      if (loadedModels.length > 0) {
        setActiveLayers(loadedModels.map(m => m.id));
      }
      
      // 시뮬레이션 상태 초기화 (존재하는 경우에만)
      (sceneSimulation as any)?.reset?.();
      
      // 씬 이름 초기화
      setSceneName('');
      setIsNewSceneMode(false);
      
      toast.success('씬이 초기화되었습니다', {
        description: 'DB 원본 데이터(기본 위치)로 복원되었습니다'
      });
    } catch (error) {
      console.error('[DigitalTwinStudio] Error resetting scene:', error);
      toast.error('씬 초기화 실패', {
        description: error instanceof Error ? error.message : '알 수 없는 오류'
      });
    } finally {
      setLoading(false);
    }
  }, [user, selectedStore, sceneSimulation, clearActiveScene]);
  if (!selectedStore) {
    return <DashboardLayout>
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>매장을 선택해주세요</AlertDescription>
        </Alert>
      </DashboardLayout>;
  }
  return <DashboardLayout>
      <SceneProvider mode={mode} initialModels={sceneModels}>
        <div className="digital-twin-studio relative w-full h-[calc(100vh-120px)] overflow-hidden bg-black rounded-lg">
          {/* ========== 3D 캔버스 (배경) ========== */}
          <div className="absolute inset-0 z-0">
            {loading ? <div className="flex items-center justify-center h-full">
                <Loader2 className="w-8 h-8 animate-spin text-white" />
              </div> : <Canvas3D mode={mode} transformMode={transformMode} enableControls={true} enableSelection={isEditMode} enableTransform={isEditMode} showGrid={isEditMode} zones={simulationZones} userId={user?.id} storeId={selectedStore?.id} renderingConfig={environmentRenderingConfig} isDayMode={isDayMode}>
                {/* 🔧 zones_dim 기반 구역 바닥 오버레이 - DB 데이터만 사용 */}
                {isActive('zone') && dbZones && dbZones.length > 0 && (
                  <ZonesFloorOverlay zones={dbZones} visible={true} showLabels={true} opacity={0.3} />
                )}

                {/* 🔧 히트맵 오버레이 - zone_daily_metrics.heatmap_intensity 기반 실제 데이터 사용 */}
                {isActive('heatmap') && (() => {
              // 🔧 FIX: zone_daily_metrics 데이터 기반 실제 히트맵 생성
              if (dbZones && dbZones.length > 0) {
                // 히트맵 데이터 매핑 (zone_id → intensity)
                const heatmapByZone = new Map<string, number>();
                if (zoneHeatmapData && zoneHeatmapData.length > 0) {
                  zoneHeatmapData.forEach(h => heatmapByZone.set(h.zone_id, h.intensity));
                }

                // min-max 정규화를 위한 값 수집
                const intensities = zoneHeatmapData?.map(h => h.intensity).filter(v => v > 0) || [];
                const minIntensity = intensities.length > 0 ? Math.min(...intensities) : 0;
                const maxIntensity = intensities.length > 0 ? Math.max(...intensities) : 1;
                const range = maxIntensity - minIntensity;
                console.log('[HeatmapOverlay] 실제 데이터 사용:', {
                  zonesCount: dbZones.length,
                  metricsCount: zoneHeatmapData?.length || 0,
                  intensityRange: {
                    min: minIntensity,
                    max: maxIntensity,
                    range
                  }
                });
                const zoneHeatPoints: HeatPoint[] = dbZones.map(zone => {
                  // 실제 히트맵 데이터가 있으면 사용, 없으면 zone_type 기반 폴백
                  const rawIntensity = heatmapByZone.get(zone.id);
                  let intensity: number;
                  if (rawIntensity !== undefined && range > 0) {
                    // min-max 정규화 (0~1 범위)
                    intensity = (rawIntensity - minIntensity) / range;
                  } else if (rawIntensity !== undefined) {
                    intensity = rawIntensity;
                  } else {
                    // 폴백: zone_type 기반 기본값
                    intensity = zone.zone_type === 'checkout' ? 0.9 : zone.zone_type === 'entrance' ? 0.7 : zone.zone_type === 'fitting' ? 0.8 : zone.zone_type === 'display' ? 0.6 : 0.5;
                  }
                  return {
                    x: zone.position_x || zone.coordinates?.x || 0,
                    y: 0.1,
                    z: zone.position_z || zone.coordinates?.z || 0,
                    intensity,
                    label: zone.zone_name
                  };
                });
                return <HeatmapOverlay heatPoints={zoneHeatPoints} storeBounds={storeBounds} />;
              }
              // 폴백: 데모 데이터
              return <HeatmapOverlay heatPoints={demoHeatPoints} storeBounds={storeBounds} />;
            })()}

                {/* 🆕 개선된 동선 오버레이 (zone_transitions 기반) - DB 데이터 사용 */}
                {isActive('flow') && selectedStore?.id && <CustomerFlowOverlayEnhanced visible={true} storeId={selectedStore.id} showLabels={true} minOpacity={0.3} />}

                {/* 🆕 고객 시뮬레이션은 Canvas3D 내부 CustomerAgents에서 처리 */}
                {/* useSimulationEngine이 storeId 기반으로 zones_dim, zone_transitions 데이터 로드 */}

                {/* 스태프 오버레이 - 실제 DB 스태프 데이터 사용 */}
                {(() => {
              const staffActive = isActive('staff');
              const hasStaffData = dbStaff && dbStaff.length > 0;
              console.log('[DigitalTwinStudio] Staff overlay render check:', {
                staffActive,
                hasStaffData,
                staffCount: dbStaff?.length || 0,
                zonePositions: Object.keys(zonePositions || {}).length
              });
              if (staffActive && hasStaffData) {
                // 스태프 위치가 (0,0,0)인 경우 zone 위치를 fallback으로 사용
                const staffWithPositions = dbStaff.map((s, idx) => {
                  const pos = s.avatar_position;
                  const isZeroPosition = pos.x === 0 && pos.y === 0 && pos.z === 0;
                  if (isZeroPosition && s.zone_id && zonePositions[s.zone_id]) {
                    // zone 위치 기반 fallback
                    const zonePos = zonePositions[s.zone_id];
                    return {
                      ...s,
                      avatar_position: {
                        x: zonePos[0] + idx % 3 * 1.5 - 1.5,
                        y: 0,
                        z: zonePos[2] + Math.floor(idx / 3) * 1.5 - 1.5
                      }
                    };
                  } else if (isZeroPosition) {
                    // zone 없으면 그리드 배치
                    return {
                      ...s,
                      avatar_position: {
                        x: -5 + idx % 4 * 3,
                        y: 0,
                        z: -3 + Math.floor(idx / 4) * 3
                      }
                    };
                  }
                  return s;
                });
                console.log('[DigitalTwinStudio] Rendering staff with positions:', staffWithPositions);
                return <StaffAvatarsOverlay staff={staffWithPositions} showLabels={true} showRoles={true} />;
              }
              return null;
            })()}

                {/* 시뮬레이션 결과 스태프 오버레이 (최적화 결과가 있을 때) */}
                {/* 🔧 FIX: dbStaff가 있을 때만 표시 (임의 데이터 방지) */}
                {isActive('staff') && dbStaff && dbStaff.length > 0 && sceneSimulation.state.results.staffing && <StaffingOverlay result={sceneSimulation.state.results.staffing as any} showStaffMarkers={true} showCurrentPositions={false} showSuggestedPositions={true} showCoverageZones={false} showMovementPaths={true} animateMovement={true} />}

                {/* 🔧 레이아웃 오버레이 - compare 모드에서만 표시 (As-Is/To-Be 박스) */}
                {viewMode === 'compare' && isActive('layoutOptimization') && sceneSimulation.state.results.layout && <LayoutOptimizationOverlay result={sceneSimulation.state.results.layout as any} showBefore={false} showAfter={false} showMoves={true} showProductMoves={true} showZoneHighlights={true} storeBounds={storeBounds} zonePositions={zonePositions} zoneSizes={zoneSizes} />}
                
                {/* 🔧 동선/혼잡도/직원배치 오버레이 - compare 조건 제거, 토글로만 제어 */}
                {isActive('flowOptimization') && sceneSimulation.state.results.flow && <FlowOptimizationOverlay result={sceneSimulation.state.results.flow as any} showPaths={true} showBottlenecks={true} showHeatmap={true} animatePaths={true} storeBounds={storeBounds} entrancePosition={entrancePosition} />}
                {isActive('congestion') && sceneSimulation.state.results.congestion && <CongestionOverlay result={sceneSimulation.state.results.congestion as any} showHeatmap={true} showZoneMarkers={true} showCrowdAnimation={true} animateTimeProgress={false} />}
                {/* 🔧 FIX: dbStaff가 있을 때만 표시 (임의 데이터 방지) */}
                {isActive('staffing') && dbStaff && dbStaff.length > 0 && sceneSimulation.state.results.staffing && <StaffingOverlay result={sceneSimulation.state.results.staffing as any} showStaffMarkers={true} showCurrentPositions={true} showSuggestedPositions={true} showCoverageZones={true} showMovementPaths={true} animateMovement={true} />}

                {/* 🔧 FIX: 인력 재배치 오버레이 - compare 모드 + dbStaff 있을 때만 표시 */}
                {viewMode === 'compare' && isActive('staffing') && dbStaff && dbStaff.length > 0 && sceneSimulation.state.results.staffing && (() => {
              const staffingResult = sceneSimulation.state.results.staffing as any;
              const staffPositions = staffingResult.staffPositions || [];
              
              // 유효한 재배치 데이터만 필터링 (from/to 위치가 모두 있어야 함)
              const validReallocations = staffPositions
                .filter((sp: any) => {
                  const hasCurrentPos = sp.currentPosition && 
                    (sp.currentPosition.x !== 0 || sp.currentPosition.z !== 0);
                  const hasSuggestedPos = sp.suggestedPosition && 
                    (sp.suggestedPosition.x !== 0 || sp.suggestedPosition.z !== 0);
                  return hasCurrentPos && hasSuggestedPos;
                })
                .map((sp: any, idx: number) => ({
                  staff_id: sp.staffId || `staff-${idx}`,
                  staff_code: `S${String(idx + 1).padStart(3, '0')}`,
                  staff_name: sp.staffName || `직원 ${idx + 1}`,
                  role: 'sales' as const,
                  from_zone_id: sp.fromZoneId || `zone-${idx}`,
                  from_zone_name: sp.fromZoneName || sp.currentPosition?.zoneName || '현재 위치',
                  from_position: sp.currentPosition,
                  to_zone_id: sp.toZoneId || `zone-opt-${idx}`,
                  to_zone_name: sp.toZoneName || sp.suggestedPosition?.zoneName || '최적 위치',
                  to_position: sp.suggestedPosition,
                  reason: sp.reason || '커버리지 최적화',
                  priority: (sp.coverageGain > 15 ? 'high' : sp.coverageGain > 8 ? 'medium' : 'low') as 'high' | 'medium' | 'low',
                  expected_impact: {
                    coverage_change_pct: sp.coverageGain || 0,
                    response_time_change_sec: -5,
                    customers_served_change: Math.floor((sp.coverageGain || 0) / 3)
                  }
                }));
              
              // 유효한 재배치 데이터가 없으면 렌더링 안 함
              if (validReallocations.length === 0) return null;
              
              return <StaffReallocationOverlay visible={true} reallocations={validReallocations} />;
            })()}
              </Canvas3D>}
              
              {/* 🔧 ViewModeHandler 제거됨 - AI 최적화 탭에서 직접 3D 위치 관리 */}
          </div>

          {/* ========== UI 오버레이 ========== */}
          <div className="absolute inset-0 z-10 pointer-events-none">
            {/* ----- 상단 중앙: 퀵 토글 바 ----- */}
            <div className="absolute top-4 left-1/2 -translate-x-1/2 pointer-events-auto z-20 flex items-center gap-3">
              {/* 퀵 토글 바 */}
              <QuickToggleBar activeOverlays={activeOverlays as any[]} onToggle={id => toggleOverlay(id as OverlayType)} />
            </div>

            {/* ----- 상단 우측: AI 리포트 + 씬 저장 + 뷰 모드 토글 ----- */}
            <div className="absolute top-4 right-4 pointer-events-auto z-20 flex items-center gap-2">
              {/* AI 리포트 버튼 */}
              <div className="flex items-center px-2 py-1.5 rounded-xl bg-black/60 backdrop-blur-md border border-white/10 shadow-lg">
                <Button variant="ghost" size="sm" onClick={() => setVisiblePanels(prev => ({
                ...prev,
                resultReport: !prev.resultReport
              }))} className={`h-8 px-3 rounded-lg transition-all border border-transparent relative ${visiblePanels.resultReport ? 'bg-purple-500/30 border-purple-500' : 'hover:bg-white/10'}`}
                  style={{ color: visiblePanels.resultReport ? '#a78bfa' : 'rgba(255,255,255,0.6)' }}>
                  <Sparkles className="w-4 h-4 mr-1.5" />
                  <span className="text-xs">AI 리포트</span>
                  {(simulationResults.layout || simulationResults.flow || simulationResults.congestion || simulationResults.staffing) && <span className="absolute -top-1 -right-1 w-2 h-2 bg-green-500 rounded-full" />}
                </Button>
              </div>

              {/* 씬 저장 버튼 */}
              <div className="flex items-center px-2 py-1.5 rounded-xl bg-black/60 backdrop-blur-md border border-white/10 shadow-lg">
                <Button variant="ghost" size="sm" onClick={() => setVisiblePanels(prev => ({
                ...prev,
                sceneSave: !prev.sceneSave
              }))} className={`h-8 px-3 rounded-lg transition-all border border-transparent ${visiblePanels.sceneSave ? 'bg-green-500/30 border-green-500' : 'hover:bg-white/10'}`}
                  style={{ color: visiblePanels.sceneSave ? '#4ade80' : 'rgba(255,255,255,0.6)' }}>
                  <Save className="w-4 h-4 mr-1.5" />
                  <span className="text-xs">씬 저장</span>
                </Button>
              </div>

              {/* 🔧 ViewModeToggle 제거됨 - AI 최적화 탭 내부에서 관리 */}
            </div>

            {/* ----- 하단 좌측: 현재 상태 정보 + 뷰모드 표시 ----- */}
            <div className="absolute bottom-4 left-4 pointer-events-auto z-20 flex items-center gap-2">
              {/* 뷰 모드 인디케이터 */}
              {(sceneSimulation.state.results.layout || sceneSimulation.state.results.flow) && <div className={`px-3 py-2 rounded-lg text-xs font-medium flex flex-col gap-1 ${viewMode === 'as-is' ? 'bg-blue-600/80 text-white' : viewMode === 'to-be' ? 'bg-green-600/80 text-white' : 'bg-purple-600/80 text-white'}`}>
                  <div className="flex items-center gap-1.5">
                    {viewMode === 'as-is' && '📍 As-Is (현재 배치)'}
                    {viewMode === 'to-be' && '✨ To-Be (최적화 결과 적용됨)'}
                    {viewMode === 'compare' && '🔄 비교 (현재 배치 + 이동 위치)'}
                  </div>
                  {/* 비교 뷰 안내 */}
                  {viewMode === 'compare' && <div className="text-[10px] text-white/70">
                      🔴 현재 위치 → 🟢 이동할 위치
                    </div>}
                </div>}
              
            </div>

            {/* ----- 하단 우측: 현재 환경 + 카메라 컨트롤 힌트 ----- */}
            <div className="absolute bottom-4 right-4 pointer-events-auto z-20 flex flex-col gap-2 items-end">
              {/* 현재 환경 표시 */}
              {envContext && (
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-black/60 backdrop-blur-md border border-white/10 shadow-lg">
                  {/* 날씨 */}
                  <div className="flex items-center gap-1">
                    {envContext.weather?.condition === 'rain' && <CloudRain className="w-3.5 h-3.5 text-blue-400" />}
                    {envContext.weather?.condition === 'snow' && <CloudSnow className="w-3.5 h-3.5 text-blue-200" />}
                    {envContext.weather?.condition === 'clear' && <Sun className="w-3.5 h-3.5 text-yellow-400" />}
                    {envContext.weather?.condition === 'clouds' && <Cloud className="w-3.5 h-3.5 text-gray-400" />}
                    {!envContext.weather && <Cloud className="w-3.5 h-3.5 text-white/30" />}
                    <span className="text-xs text-white">
                      {envContext.weather ? `${Math.round(envContext.weather.temperature)}°C` : '-'}
                    </span>
                  </div>
                  
                  <div className="w-px h-4 bg-white/20" />
                  
                  {/* 요일 */}
                  <div className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-purple-400" />
                    <span className="text-xs text-white">
                      {envContext.holiday ? envContext.holiday.name : envCurrentTime?.isWeekend ? '주말' : '평일'}
                    </span>
                  </div>
                  
                  {/* 트래픽 영향도 */}
                  {envImpact && (
                    <>
                      <div className="w-px h-4 bg-white/20" />
                      <span className={`text-xs px-1.5 py-0.5 rounded ${
                        envImpact.trafficMultiplier > 1.1 ? 'bg-green-500/20 text-green-400' : 
                        envImpact.trafficMultiplier < 0.9 ? 'bg-red-500/20 text-red-400' : 
                        'bg-white/10 text-white/60'
                      }`}>
                        트래픽 {(envImpact.trafficMultiplier * 100).toFixed(0)}%
                      </span>
                    </>
                  )}
                </div>
              )}

              {/* 카메라 컨트롤 힌트 */}
              <div className="bg-black/70 backdrop-blur-sm border border-white/10 rounded-lg px-3 py-2 text-xs text-white/50 flex items-center gap-2">
                <Mouse className="w-3.5 h-3.5" />
                <span>회전</span>
                <span className="text-white/30">|</span>
                <span>Shift+🖱️ 이동</span>
                <span className="text-white/30">|</span>
                <span>스크롤 줌</span>
              </div>
            </div>

            {/* ----- 왼쪽 패널 (리사이즈 가능) ----- */}
            <div className="absolute left-4 top-4 bottom-4 pointer-events-auto flex" style={{
            width: isPanelCollapsed ? 40 : panelWidth
          }}>
              {/* 패널 접기/펼치기 버튼 (접힌 상태) */}
              {isPanelCollapsed ? <div className="h-full bg-black/80 backdrop-blur-sm border border-white/10 rounded-xl flex flex-col items-center py-4">
                  <button onClick={togglePanelCollapse} className="p-2 hover:bg-white/10 rounded-lg transition-colors text-white/60 hover:text-white" title="패널 펼치기">
                    <PanelLeft className="w-4 h-4" />
                  </button>
                </div> : <>
                  <div className="flex-1 h-full bg-black/80 backdrop-blur-sm border border-white/10 rounded-xl overflow-hidden flex flex-col relative">
                    {/* 탭 헤더 - 4패널 구조: 레이어 → AI시뮬레이션 → AI최적화 → 적용하기 */}
                    <div className="flex border-b border-white/10 items-center flex-shrink-0 bg-black/80 z-10">
                      <TabButton active={activeTab === 'layer'} onClick={() => setActiveTab('layer')}>
                        <Layers className="w-3 h-3 mr-1 inline" />
                        레이어
                      </TabButton>
                      <TabButton active={activeTab === 'ai-simulation'} onClick={() => setActiveTab('ai-simulation')}>
                        <FlaskConical className="w-3 h-3 mr-1 inline" />
                        AI 시뮬레이션
                      </TabButton>
                      <TabButton active={activeTab === 'ai-optimization'} onClick={() => setActiveTab('ai-optimization')}>
                        <Sparkles className="w-3 h-3 mr-1 inline" />
                        AI 최적화
                      </TabButton>
                      <TabButton active={activeTab === 'apply'} onClick={() => setActiveTab('apply')}>
                        <CheckCircle className="w-3 h-3 mr-1 inline" />
                        적용하기
                      </TabButton>
                      {/* 패널 접기 버튼 */}
                      <button onClick={togglePanelCollapse} className="p-2 ml-auto hover:bg-white/10 rounded-lg transition-colors text-white/40 hover:text-white" title="패널 접기">
                        <PanelLeftClose className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* 탭 컨텐츠 - 독립적인 스크롤 영역 */}
                    <div className="absolute top-[41px] left-0 right-0 bottom-0 overflow-y-auto overflow-x-hidden">
                      {activeTab === 'layer' && <LayerPanel />}
                      {activeTab === 'ai-simulation' && <AISimulationTab storeId={selectedStore?.id || ''} sceneData={currentRecipe} onOverlayToggle={setOverlayVisibility} simulationZones={simulationZones} onResultsUpdate={(type, result) => {
                    // AI 시뮬레이션 결과 저장 및 결과 리포트 패널 표시
                    setSimulationResults(prev => ({
                      ...prev,
                      [type]: result
                    }));
                    setVisiblePanels(prev => ({
                      ...prev,
                      resultReport: true
                    }));
                  }} onNavigateToOptimization={issues => {
                    // AI 시뮬레이션에서 발견된 문제를 AI 최적화로 전달
                    if (issues) {
                      setDiagnosticIssues(issues);
                    }
                    setActiveTab('ai-optimization');
                  }} onEnvironmentConfigChange={handleEnvironmentConfigChange} />}
                      {activeTab === 'ai-optimization' && <AIOptimizationTab storeId={selectedStore?.id || ''} sceneData={currentRecipe} sceneSimulation={sceneSimulation} viewMode={viewMode} onViewModeChange={setViewMode} onSaveScene={handleSaveScene} onSceneUpdate={newScene => {
                    // SceneProvider에 시뮬레이션 결과 적용
                    if (newScene.furnitureMoves) {
                      // applySimulationResults는 useScene에서 가져옴
                    }
                  }} onOverlayToggle={setOverlayVisibility} onResultsUpdate={(type, result) => {
                    // AI 최적화 결과 저장 및 결과 리포트 패널 표시
                    setSimulationResults(prev => ({
                      ...prev,
                      [type]: result
                    }));
                    setVisiblePanels(prev => ({
                      ...prev,
                      resultReport: true
                    }));
                  }} diagnosticIssues={diagnosticIssues} onNavigateToApply={() => setActiveTab('apply')} simulationEnvConfig={simulationEnvConfig} />}
                      {activeTab === 'apply' && <ApplyPanel storeId={selectedStore?.id || ''} onApplyScenario={scenarioId => {
                    toast.success(`시나리오 ${scenarioId} 적용 시작`);
                    logActivity('feature_use', {
                      feature: 'scenario_apply',
                      scenario_id: scenarioId,
                      store_id: selectedStore?.id
                    });
                  }} />}
                    </div>
                  </div>

                  {/* 리사이즈 핸들 */}
                  <div className={`w-1.5 h-full cursor-col-resize flex items-center justify-center group hover:bg-primary/30 transition-colors ${isResizing ? 'bg-primary/50' : ''}`} onMouseDown={handleResizeStart}>
                    <div className="w-0.5 h-12 bg-white/20 group-hover:bg-primary rounded-full transition-colors" />
                  </div>
                </>}
            </div>

            {/* ========== 드래그 가능한 플로팅 패널들 (상단 바 아래에 배치) ========== */}

            {/* 임시 비활성화 - 도구 패널
             {visiblePanels.tools && (
              <DraggablePanel
                id="tool-panel"
                title="도구"
                defaultPosition={{ x: 16, y: 60 }}
                collapsible={true}
                defaultCollapsed={false}
                width="w-auto"
                resizable={false}
              >
                <ToolPanel
                  mode={mode}
                  onModeChange={setMode}
                  onTransformModeChange={setTransformMode}
                  hasSelection={false}
                />
              </DraggablePanel>
             )}
             */}

            {/* 씬 저장 패널 - ViewModeToggle 아래 우측 */}
            {visiblePanels.sceneSave && (
              <DraggablePanel
                id="scene-save"
                title="씬 저장"
                icon={<Save className="w-4 h-4" />}
                defaultPosition={{ x: 0, y: FLOATING_PANEL_TOP }}
                rightOffset={16}
                defaultCollapsed={false}
                closable={true}
                onClose={() => closePanel('sceneSave')}
                onHeightChange={setSceneSavePanelHeight}
                width="w-52"
              >
                <SceneSavePanelWrapper
                  currentSceneName={sceneName}
                  savedScenes={scenes.slice(0, 3)}
                  isSaving={isSaving}
                  saveScene={saveScene}
                  setActiveScene={setActiveScene}
                  deleteScene={deleteScene}
                  renameScene={renameScene}
                  onNew={handleNewScene}
                  onReset={handleResetScene}
                  maxScenes={3}
                  setSceneName={setSceneName}
                  isNewSceneMode={isNewSceneMode}
                  setIsNewSceneMode={setIsNewSceneMode}
                  activeLayers={activeLayers}
                  logActivity={logActivity}
                  storeId={selectedStore?.id}
                />
              </DraggablePanel>
            )}

            {/* 속성 패널 (편집 모드에서만 표시) */}
            {isEditMode && visiblePanels.property && <DraggablePanel id="property-panel" title="속성" defaultPosition={{
            x: 16,
            y: 300
          }} defaultCollapsed={false} width="w-72">
                <PropertyPanel />
              </DraggablePanel>}

            {/* 통합 결과 리포트 패널 - 우측 (씬 저장 패널 아래 또는 ViewModeToggle 아래) */}
            {visiblePanels.resultReport && (
              <ResultReportPanel
                results={simulationResults}
                onClose={() => setVisiblePanels((prev) => ({ ...prev, resultReport: false }))}
                onApply={(type) => {
                  toast.success(`${type} 최적화 결과를 적용합니다`);
                  setActiveTab('apply');
                }}
                onShowIn3D={(type) => {
                  // 해당 오버레이 활성화
                  const overlayMap: Record<string, OverlayType> = {
                    layout: 'layoutOptimization',
                    flow: 'flowOptimization',
                    congestion: 'congestion',
                    staffing: 'staffing',
                  };
                  const overlay = overlayMap[type];
                  if (overlay && !isActive(overlay)) {
                    toggleOverlay(overlay);
                  }
                }}
                defaultPosition={{ x: 0, y: FLOATING_PANEL_TOP }}
                syncY={visiblePanels.sceneSave && sceneSavePanelHeight > 0
                  ? FLOATING_PANEL_TOP + sceneSavePanelHeight + FLOATING_PANEL_GAP
                  : FLOATING_PANEL_TOP}
                rightOffset={16}
                minSize={{ width: 240, height: 100 }}
                maxSize={{ width: 600, height: 900 }}
              />
            )}

            {/* 하단 중앙 버튼 제거됨 - 탭에서 동일 기능 제공 */}
          </div>
        </div>
      </SceneProvider>
    </DashboardLayout>;
}

// ============================================================================
// 탭 버튼 컴포넌트
// ============================================================================
interface TabButtonProps {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}
function TabButton({
  active,
  onClick,
  children
}: TabButtonProps) {
  return <button onClick={onClick} className={`
        flex-1 py-3 text-sm font-medium transition-colors
        ${active ? 'text-white bg-white/10 border-b-2 border-primary' : 'text-white/60 hover:text-white hover:bg-white/5'}
      `}>
      {children}
    </button>;
}

// ============================================================================
// 시뮬레이션 결과 패널 래퍼 (useScene 접근 가능)
// ============================================================================
interface SimulationResultPanelsProps {
  visiblePanels: {
    layoutResult: boolean;
    flowResult: boolean;
    congestionResult: boolean;
    staffingResult: boolean;
  };
  simulationResults: {
    layout: LayoutResult | null;
    flow: FlowResult | null;
    congestion: CongestionResult | null;
    staffing: StaffingResult | null;
  };
  sceneSimulationResults: {
    layout?: any;
    flow?: any;
    congestion?: any;
    staffing?: any;
  };
  onClose: (panel: 'layoutResult' | 'flowResult' | 'congestionResult' | 'staffingResult') => void;
  toggleOverlay: (overlay: string) => void;
}

// ============================================================================
// 통합 오버레이 컨트롤 패널 (고객 시뮬레이션 통합)
// ============================================================================
interface OverlayControlPanelIntegratedProps {
  isActive: (overlayId: OverlayType) => boolean;
  toggleOverlay: (overlayId: OverlayType) => void;
}
function OverlayControlPanelIntegrated({
  isActive,
  toggleOverlay
}: OverlayControlPanelIntegratedProps) {
  // 시뮬레이션 스토어
  const {
    isRunning,
    isPaused,
    simulationTime,
    kpi,
    config,
    start,
    pause,
    resume,
    stop,
    reset,
    setSpeed
  } = useSimulationStore();

  // 고객 오버레이 토글 핸들러 (시뮬레이션 연동)
  const handleAvatarToggle = useCallback(() => {
    const wasActive = isActive('avatar');
    toggleOverlay('avatar');

    // 고객 오버레이가 활성화되면 시뮬레이션 시작
    if (!wasActive && !isRunning) {
      start();
      toast.success('고객 시뮬레이션이 시작되었습니다');
    }
    // 비활성화되면 시뮬레이션 중지
    else if (wasActive && isRunning) {
      stop();
    }
  }, [isActive, toggleOverlay, isRunning, start, stop]);

  // 시간 포맷팅 - 음수는 0으로 처리
  const formatTime = (seconds: number): string => {
    const absSeconds = Math.max(0, seconds);
    const m = Math.floor(absSeconds / 60);
    const s = Math.floor(absSeconds % 60);
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };
  return <DraggablePanel id="overlay" title="오버레이" icon={<Layers className="w-4 h-4" />} defaultPosition={{
    x: 352,
    y: 60
  }} defaultCollapsed={true} width="w-56">
      <div className="space-y-3">
        {/* 기본 오버레이 토글 */}
        <div className="space-y-2">
          {[{
          id: 'heatmap',
          label: '히트맵',
          icon: '🔥'
        }, {
          id: 'zone',
          label: '구역',
          icon: '📍'
        }].map(overlay => <label key={overlay.id} className="flex items-center gap-2 text-xs text-white/80 cursor-pointer hover:text-white transition-colors">
              <input type="checkbox" checked={isActive(overlay.id as OverlayType)} onChange={() => toggleOverlay(overlay.id as OverlayType)} className="w-3 h-3 rounded" />
              <span>{overlay.icon}</span>
              {overlay.label}
            </label>)}
        </div>

        {/* 구분선 */}
        <div className="border-t border-white/10" />

        {/* 고객 시뮬레이션 섹션 */}
        <div className="space-y-2">
          <label className="flex items-center gap-2 text-xs text-white/80 cursor-pointer hover:text-white transition-colors">
            <input type="checkbox" checked={isActive('avatar')} onChange={handleAvatarToggle} className="w-3 h-3 rounded" />
            <Users className="w-3 h-3 text-green-400" />
            고객 (실시간)
          </label>

          {/* 시뮬레이션 컨트롤 (고객 활성화시) */}
          {isActive('avatar') && <div className="pl-5 space-y-2">
              {/* 시간 & 상태 */}
              <div className="flex items-center justify-between text-[10px]">
                <span className="text-white/40">경과: {formatTime(simulationTime)}</span>
                <span className={isRunning ? isPaused ? 'text-yellow-400' : 'text-green-400' : 'text-white/40'}>
                  {isRunning ? isPaused ? '일시정지' : '실행중' : '대기'}
                </span>
              </div>

              {/* 컨트롤 버튼 */}
              <div className="flex gap-1">
                <Button onClick={() => {
              if (!isRunning) start();else if (isPaused) resume();else pause();
            }} size="sm" className={`flex-1 h-6 text-[10px] ${isRunning && !isPaused ? 'bg-yellow-600 hover:bg-yellow-700' : 'bg-green-600 hover:bg-green-700'}`}>
                  {!isRunning ? <Play className="w-3 h-3" /> : isPaused ? <Play className="w-3 h-3" /> : <Pause className="w-3 h-3" />}
                </Button>
                <Button onClick={stop} disabled={!isRunning} size="sm" variant="destructive" className="h-6 w-6 p-0">
                  <Square className="w-3 h-3" />
                </Button>
                <Button onClick={reset} size="sm" variant="outline" className="h-6 w-6 p-0 border-white/20">
                  <RotateCcw className="w-3 h-3" />
                </Button>
              </div>

              {/* 속도 조절 */}
              <div className="flex gap-0.5">
                {[1, 2, 4, 10].map(speed => <Button key={speed} onClick={() => setSpeed(speed)} size="sm" variant={config.speed === speed ? 'default' : 'outline'} className={`flex-1 h-5 text-[9px] px-1 ${config.speed === speed ? 'bg-blue-600' : 'border-white/20 text-white/60'}`}>
                    {speed}x
                  </Button>)}
              </div>

              {/* 실시간 KPI (실행 중일 때) */}
              {isRunning && <div className="grid grid-cols-2 gap-1 text-[9px]">
                  <div className="bg-white/5 rounded px-1.5 py-1">
                    <span className="text-white/40">고객</span>
                    <div className="text-white font-bold">{kpi.currentCustomers}</div>
                  </div>
                  <div className="bg-white/5 rounded px-1.5 py-1">
                    <span className="text-white/40">전환</span>
                    <div className="text-green-400 font-bold">{kpi.conversions}</div>
                  </div>
                </div>}

              {/* 고객 상태 범례 */}
              <div className="pt-1 border-t border-white/10">
                <div className="text-[9px] text-white/40 mb-1">상태 범례</div>
                <div className="grid grid-cols-3 gap-x-1 gap-y-0.5">
                  {(Object.entries(STATE_LABELS) as [CustomerState, string][]).map(([state, label]) => <div key={state} className="flex items-center gap-1">
                      <div className="w-1.5 h-1.5 rounded-full" style={{
                  backgroundColor: STATE_COLORS[state]
                }} />
                      <span className="text-[8px] text-white/50">{label}</span>
                    </div>)}
                </div>
              </div>
            </div>}
        </div>

        {/* 구분선 */}
        <div className="border-t border-white/10" />

        {/* 스태프 오버레이 */}
        <label className="flex items-center gap-2 text-xs text-white/80 cursor-pointer hover:text-white transition-colors">
          <input type="checkbox" checked={isActive('staff')} onChange={() => toggleOverlay('staff')} className="w-3 h-3 rounded" />
          <span>👤</span>
          스태프
        </label>
      </div>
    </DraggablePanel>;
}
function SimulationResultPanels({
  visiblePanels,
  simulationResults,
  sceneSimulationResults,
  onClose,
  toggleOverlay
}: SimulationResultPanelsProps) {
  const {
    applySimulationResults
  } = useScene();

  // 3D 씬에 레이아웃 변경 적용 (모델 위치 이동)
  const handleShowLayoutIn3D = useCallback(() => {
    const layoutResult = sceneSimulationResults.layout;
    if (layoutResult?.furnitureMoves && layoutResult.furnitureMoves.length > 0) {
      applySimulationResults({
        furnitureMoves: layoutResult.furnitureMoves,
        animated: true
      });
      // 🔧 FIX: zone 토글 제거 (파란색 바닥 방지)
      toast.success('3D 씬에 레이아웃 변경이 적용되었습니다');
    } else {
      // 🔧 FIX: zone 토글 제거 (파란색 바닥 방지)
      toast.info('3D 뷰에서 변경사항 표시');
    }
  }, [sceneSimulationResults.layout, applySimulationResults]);
  return <>
      {visiblePanels.layoutResult && <LayoutResultPanel result={simulationResults.layout} onClose={() => onClose('layoutResult')} onApply={() => {
      // ROI 측정 모달 완료 후 호출됨 - 별도 동작 없음
      // (모달이 이미 ROI 페이지로 이동하거나 토스트 표시함)
    }} onShowIn3D={handleShowLayoutIn3D} defaultPosition={{
      x: 352,
      y: 220
    }} />}

      {visiblePanels.flowResult && <FlowResultPanel result={simulationResults.flow} onClose={() => onClose('flowResult')} onApply={() => {
      toast.success('동선 최적화 적용됨');
    }} onShowFlow={() => {
      toggleOverlay('flow');
      toast.info('동선 오버레이 표시');
    }} defaultPosition={{
      x: 352,
      y: 320
    }} />}

      {visiblePanels.congestionResult && <CongestionResultPanel result={simulationResults.congestion} onClose={() => onClose('congestionResult')} onPlayAnimation={() => {
      toast.info('시간대별 애니메이션 재생');
    }} defaultPosition={{
      x: 352,
      y: 420
    }} />}

      {visiblePanels.staffingResult && <StaffingResultPanel result={simulationResults.staffing} onClose={() => onClose('staffingResult')} onApply={() => {
      toast.success('인력 배치 최적화 적용됨');
    }} onShowPositions={() => {
      toggleOverlay('avatar');
      toast.info('직원 위치 표시');
    }} defaultPosition={{
      x: 352,
      y: 520
    }} />}
    </>;
}

// ============================================================================
// 🔧 FIX: SceneProvider 내부에서 실제 3D models를 가져와 저장하는 래퍼
// ============================================================================
interface SceneSavePanelWrapperProps {
  currentSceneName: string;
  savedScenes: any[];
  isSaving: boolean;
  saveScene: (recipe: SceneRecipe, name: string, sceneId?: string) => Promise<void>;
  setActiveScene: (id: string) => void;
  deleteScene: (id: string) => Promise<void>;
  renameScene: (id: string, newName: string) => Promise<void>;  // 🆕 추가
  onNew: () => void;
  onReset: () => void;
  maxScenes: number;
  setSceneName: (name: string) => void;
  isNewSceneMode: boolean;
  setIsNewSceneMode: (v: boolean) => void;
  activeLayers: string[];
  logActivity: (type: string, data: any) => void;
  storeId?: string;
}

function SceneSavePanelWrapper({
  currentSceneName,
  savedScenes,
  isSaving,
  saveScene,
  setActiveScene,
  deleteScene,
  renameScene,  // 🆕 추가
  onNew,
  onReset,
  maxScenes,
  setSceneName,
  isNewSceneMode,
  setIsNewSceneMode,
  activeLayers,
  logActivity,
  storeId,
}: SceneSavePanelWrapperProps) {
  // 🔧 핵심: SceneProvider 내부에서 실제 3D에 보이는 models를 가져옴
  const { models: sceneModels } = useScene();

  // 현재 화면에 보이는 3D 상태로 SceneRecipe 생성
  const buildCurrentRecipe = useCallback((): SceneRecipe | null => {
    const activeModels = sceneModels.filter(m => activeLayers.includes(m.id));
    if (activeModels.length === 0) return null;
    
    const spaceModel = activeModels.find(m => m.type === 'space');
    if (!spaceModel) return null;

    const lightingPreset: LightingPreset = {
      name: 'warm-retail',
      description: 'Default',
      lights: [
        { type: 'ambient', color: '#ffffff', intensity: 0.5 },
        { type: 'directional', color: '#ffffff', intensity: 1, position: { x: 10, y: 10, z: 5 } }
      ]
    };

    // SceneProvider의 models는 position이 [x,y,z] 배열 형태, url 필드 사용
    // 🔧 FIX: rotation은 라디안으로 저장되어 있으므로 도(degree)로 변환하여 저장
    const radToDeg = (rad: number) => rad * 180 / Math.PI;
    
    const furnitureList = activeModels.filter(m => m.type === 'furniture').map(m => {
      const pos = m.position || [0, 0, 0];
      const rot = m.rotation || [0, 0, 0];
      const scl = m.scale || [1, 1, 1];
      const metaChildProducts = (m.metadata as any)?.childProducts;
      
      return {
        id: m.id,
        model_url: m.url,  // 🔧 FIX: SceneProvider의 Model3D는 url 필드 사용
        type: 'furniture' as const,
        furniture_type: m.name,
        position: { x: pos[0], y: pos[1], z: pos[2] },
        rotation: { x: radToDeg(rot[0]), y: radToDeg(rot[1]), z: radToDeg(rot[2]) },  // 라디안 → 도
        scale: { x: scl[0], y: scl[1], z: scl[2] },
        dimensions: m.dimensions,
        movable: true,
        metadata: m.metadata,
        childProducts: metaChildProducts?.map((cp: any) => ({
          id: cp.id,
          type: 'product' as const,
          model_url: cp.model_url || cp.url,  // 🔧 FIX
          position: cp.position || { x: 0, y: 0, z: 0 },
          rotation: cp.rotation || { x: 0, y: 0, z: 0 },
          scale: cp.scale || { x: 1, y: 1, z: 1 },
          sku: cp.name,
          display_type: cp.metadata?.displayType,
          dimensions: cp.dimensions,
          isRelativePosition: true,
          metadata: cp.metadata
        })) || []
      };
    });

    const productsList = activeModels.filter(m => m.type === 'product').map(m => {
      const pos = m.position || [0, 0, 0];
      const rot = m.rotation || [0, 0, 0];
      const scl = m.scale || [1, 1, 1];
      
      return {
        id: m.id,
        model_url: m.url,  // 🔧 FIX: SceneProvider의 Model3D는 url 필드 사용
        type: 'product' as const,
        product_id: (m.metadata as any)?.entityId,
        sku: m.name,
        position: { x: pos[0], y: pos[1], z: pos[2] },
        rotation: { x: radToDeg(rot[0]), y: radToDeg(rot[1]), z: radToDeg(rot[2]) },  // 라디안 → 도
        scale: { x: scl[0], y: scl[1], z: scl[2] },
        dimensions: m.dimensions,
        movable: true,
        metadata: m.metadata
      };
    });

    const spacePos = spaceModel.position || [0, 0, 0];
    const spaceRot = spaceModel.rotation || [0, 0, 0];
    const spaceScl = spaceModel.scale || [1, 1, 1];

    return {
      space: {
        id: spaceModel.id,
        model_url: spaceModel.url,  // 🔧 FIX: SceneProvider의 Model3D는 url 필드 사용
        type: 'space',
        position: { x: spacePos[0], y: spacePos[1], z: spacePos[2] },
        rotation: { x: radToDeg(spaceRot[0]), y: radToDeg(spaceRot[1]), z: radToDeg(spaceRot[2]) },  // 라디안 → 도
        scale: { x: spaceScl[0], y: spaceScl[1], z: spaceScl[2] },
        dimensions: spaceModel.dimensions,
        metadata: spaceModel.metadata
      },
      furniture: furnitureList,
      products: productsList,
      lighting: lightingPreset,
      camera: { position: { x: 10, y: 10, z: 15 }, target: { x: 0, y: 0, z: 0 }, fov: 50 }
    };
  }, [sceneModels, activeLayers]);

  // 저장 핸들러 - 실제 3D 화면 상태를 저장
  const handleSave = useCallback(async (name: string) => {
    const recipe = buildCurrentRecipe();
    if (!recipe) {
      toast.error('저장할 씬 데이터가 없습니다');
      return;
    }

    try {
      const existingScene = savedScenes.find(s => s.name && s.name === name);
      const shouldUpdate = !isNewSceneMode && existingScene && existingScene.id;

      console.log('[SceneSavePanelWrapper] Saving scene with actual 3D positions', {
        name,
        furnitureCount: recipe.furniture.length,
        firstFurniturePos: recipe.furniture[0]?.position
      });

      await saveScene(recipe, name, shouldUpdate ? existingScene.id : undefined);
      setSceneName(name);
      setIsNewSceneMode(false);

      logActivity('feature_use', {
        feature: 'scene_save',
        scene_name: name,
        layer_count: activeLayers.length,
        store_id: storeId,
        is_new: !shouldUpdate
      });
    } catch (err) {
      console.error('[SceneSavePanelWrapper] Error:', err);
    }
  }, [buildCurrentRecipe, savedScenes, isNewSceneMode, saveScene, setSceneName, setIsNewSceneMode, activeLayers, logActivity, storeId]);

  return (
    <SceneSavePanel
      currentSceneName={currentSceneName}
      savedScenes={savedScenes}
      isSaving={isSaving}
      isDirty={false}
      onSave={handleSave}
      onLoad={(id) => setActiveScene(id)}
      onDelete={(id) => deleteScene(id)}
      onRename={(id, newName) => renameScene(id, newName)}  // 🆕 추가
      onNew={onNew}
      onReset={onReset}
      maxScenes={maxScenes}
    />
  );
}

// 🔧 ViewModeHandler 제거됨 - AI 최적화 탭에서 직접 뷰 모드 관리
