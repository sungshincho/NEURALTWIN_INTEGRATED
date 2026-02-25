/**
 * AIOptimizationTab.tsx
 *
 * AI 최적화 탭 - 레이아웃/동선/인력배치 최적화
 * - 다중 선택 가능
 * - As-Is / To-Be 결과 비교
 * - 3D 씬에 결과 자동 반영
 * - 최적화 설정 패널 (가구/제품/강도)
 */

import { useState, useCallback, useEffect, useMemo } from 'react';
import { Sparkles, Layout, Route, Users, Loader2, ChevronDown, ChevronUp, Check, RotateCcw, Eye, Layers, Target, TrendingUp, Clock, Footprints, Settings2, Save, ArrowRight, BookmarkPlus, Cloud, Calendar, Thermometer, GitCompare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { buildStoreContext } from '../utils/store-context-builder';
import { OptimizationResultPanel } from '../panels/OptimizationResultPanel';
import { StaffOptimizationResultPanel } from '../components/StaffOptimizationResult';
import { useScene } from '../core/SceneProvider';
import { validateOptimizationResult } from '../utils/optimizationValidator';
import { OptimizationSettingsPanel } from '../components/optimization';
import type { DiagnosticIssue } from '../components/DiagnosticIssueList';
import type { UseSceneSimulationReturn } from '../hooks/useSceneSimulation';
import type { SceneRecipe } from '../types';
import type {
  OptimizationSettings,
  FurnitureItem,
  ProductItem,
} from '../types/optimization.types';
import { DEFAULT_OPTIMIZATION_SETTINGS, INTENSITY_LIMITS } from '../types/optimization.types';
import type { StaffOptimizationResult } from '../types/staffOptimization.types';
import type { SimulationEnvironmentConfig } from '../types/simulationEnvironment.types';
import { WEATHER_OPTIONS, HOLIDAY_OPTIONS, TIME_OF_DAY_OPTIONS, getEffectiveWeather, getEffectiveTimeOfDay, getEffectiveHoliday } from '../types/simulationEnvironment.types';

type OptimizationType = 'layout' | 'flow' | 'staffing';
type ViewMode = 'as-is' | 'compare' | 'to-be';
type OptimizationGoal = 'revenue' | 'dwell_time' | 'traffic' | 'conversion';

interface GoalOption {
  id: OptimizationGoal;
  label: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
}

const goalOptions: GoalOption[] = [
  {
    id: 'revenue',
    label: '매출',
    description: '매출 극대화',
    icon: TrendingUp,
  },
  {
    id: 'dwell_time',
    label: '체류',
    description: '체류시간 증가',
    icon: Clock,
  },
  {
    id: 'traffic',
    label: '동선',
    description: '유동인구 분산',
    icon: Footprints,
  },
  {
    id: 'conversion',
    label: '전환',
    description: '전환율 개선',
    icon: Target,
  },
];

interface OptimizationOption {
  id: OptimizationType;
  label: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
}

const optimizationOptions: OptimizationOption[] = [
  {
    id: 'layout',
    label: '레이아웃 최적화',
    description: 'AI가 가구/제품/장치 배치를 최적화합니다',
    icon: Layout,
  },
  {
    id: 'staffing',
    label: '인력 배치 최적화',
    description: 'AI가 최적의 직원 배치를 제안합니다',
    icon: Users,
  },
  // 동선 최적화는 오버레이_고객 시뮬레이션으로 통합됨
];

interface AIOptimizationTabProps {
  storeId: string;
  sceneData: SceneRecipe | null;
  sceneSimulation: UseSceneSimulationReturn;
  onSceneUpdate?: (newScene: any) => void;
  onOverlayToggle: (overlayType: string, visible: boolean) => void;
  onResultsUpdate?: (type: 'layout' | 'flow' | 'congestion' | 'staffing', result: any) => void;
  /** AI 시뮬레이션에서 전달받은 진단 결과 */
  diagnosticIssues?: DiagnosticIssue[];
  /** 적용하기 탭으로 이동 */
  onNavigateToApply?: () => void;
  /** 🆕 시뮬레이션 환경 설정 (날씨, 휴일, 시간대 등) */
  simulationEnvConfig?: SimulationEnvironmentConfig | null;
  /** 🆕 현재 뷰 모드 (상단 토글과 연동) */
  viewMode?: ViewMode;
  /** 🆕 뷰 모드 변경 콜백 (상단 토글과 연동) */
  onViewModeChange?: (mode: ViewMode) => void;
  /** 🆕 씬 저장 함수 (DigitalTwinStudioPage에서 전달) */
  onSaveScene?: (name: string) => Promise<void>;
}

export function AIOptimizationTab({
  storeId,
  sceneData,
  sceneSimulation,
  onSceneUpdate,
  onOverlayToggle,
  onResultsUpdate,
  diagnosticIssues = [],
  onNavigateToApply,
  simulationEnvConfig,
  viewMode: externalViewMode,
  onViewModeChange,
  onSaveScene,
}: AIOptimizationTabProps) {
  // SceneProvider에서 applySimulationResults, revertSimulationChanges 가져오기
  const { applySimulationResults, revertSimulationChanges } = useScene();

  // 최적화 목표 선택
  const [selectedGoal, setSelectedGoal] = useState<OptimizationGoal>('revenue');

  // 선택된 최적화 유형들
  const [selectedOptimizations, setSelectedOptimizations] = useState<OptimizationType[]>(['layout', 'staffing']);

  // 실행 상태
  const [runningTypes, setRunningTypes] = useState<OptimizationType[]>([]);

  // 🆕 최적화 진행률 (0-100)
  const [optimizationProgress, setOptimizationProgress] = useState(0);

  // 결과 패널 펼침/접힘
  const [isResultExpanded, setIsResultExpanded] = useState(true);

  // 🆕 뷰 모드 - 외부에서 전달받거나 내부 상태 사용
  const [internalViewMode, setInternalViewMode] = useState<ViewMode>('as-is');
  const viewMode = externalViewMode ?? internalViewMode;
  const setViewMode = useCallback((mode: ViewMode) => {
    if (onViewModeChange) {
      onViewModeChange(mode);
    } else {
      setInternalViewMode(mode);
    }
  }, [onViewModeChange]);

  // 🆕 뷰 모드 전환 중인지 추적 (연타 방지)
  const [isTransitioning, setIsTransitioning] = useState(false);

  // 최적화 설정 상태
  const [optimizationSettings, setOptimizationSettings] = useState<OptimizationSettings>(DEFAULT_OPTIMIZATION_SETTINGS);
  const [isSettingsExpanded, setIsSettingsExpanded] = useState(false);

  // 🆕 Staff overlay 표시 상태
  const [showStaffOverlay, setShowStaffOverlay] = useState(false);

  // sceneData에서 가구/제품 목록 추출
  const furnitureItems: FurnitureItem[] = useMemo(() => {
    if (!sceneData?.furniture) return [];
    return sceneData.furniture.map((f) => ({
      id: f.id,
      name: f.metadata?.name || f.furniture_type || '가구',
      furniture_type: f.furniture_type || 'unknown',
      movable: f.movable !== false, // 기본적으로 이동 가능
      position: f.position || { x: 0, y: 0, z: 0 },
      zone_id: f.metadata?.zone_id,
    }));
  }, [sceneData?.furniture]);

  // 🔧 FIX: 가구 목록이 로드되면 이동 가능한 가구 전체 선택으로 초기화
  useEffect(() => {
    if (furnitureItems.length > 0 && optimizationSettings.furniture.movableIds.length === 0) {
      const movableFurnitureIds = furnitureItems
        .filter((f) => f.movable)
        .map((f) => f.id);

      if (movableFurnitureIds.length > 0) {
        setOptimizationSettings((prev) => ({
          ...prev,
          furniture: {
            ...prev.furniture,
            movableIds: movableFurnitureIds,
          },
        }));
        console.log('[AIOptimizationTab] Initialized movableIds with all furniture:', movableFurnitureIds.length);
      }
    }
  }, [furnitureItems]);

  const productItems: ProductItem[] = useMemo(() => {
    const products: ProductItem[] = [];

    // 1️⃣ sceneData.products에서 추출 (기존 방식)
    if (sceneData?.products) {
      sceneData.products.forEach((p) => {
        products.push({
          id: p.id,
          sku: p.sku || '',
          product_name: p.metadata?.product_name || p.metadata?.name || '상품',
          category: p.metadata?.category,
          furniture_id: p.metadata?.furniture_id,
          slot_id: p.metadata?.slot_id,
        });
      });
    }

    // 2️⃣ 가구의 childProducts에서 추출 (SEED 로더 방식)
    if (sceneData?.furniture) {
      sceneData.furniture.forEach((f) => {
        const childProducts = (f as any).childProducts || [];
        childProducts.forEach((cp: any) => {
          products.push({
            id: cp.id,
            sku: cp.sku || cp.metadata?.sku || '',
            product_name: cp.metadata?.product_name || cp.metadata?.name || cp.sku || '상품',
            category: cp.metadata?.category,
            furniture_id: f.id,
            slot_id: cp.metadata?.slot_id,
          });
        });
      });
    }

    // 🔍 DEBUG: 제품 추출 결과 로깅
    console.log('[AIOptimizationTab] productItems extracted:', {
      fromProducts: sceneData?.products?.length || 0,
      fromChildProducts: products.length - (sceneData?.products?.length || 0),
      total: products.length,
      furnitureCount: sceneData?.furniture?.length || 0,
    });

    return products;
  }, [sceneData?.products, sceneData?.furniture]);

  // 🔧 FIX: 이 useEffect 제거 - handleViewModeChange에서 오버레이 설정을 직접 처리함
  // viewMode 변경 시 useEffect가 중복으로 오버레이 토글을 호출하여 버그 발생
  // (비교 버튼 클릭 → handleViewModeChange에서 오버레이 켜짐 → useEffect에서 다시 토글되어 꺼짐)

  // 체크박스 토글
  const toggleOptimization = (type: OptimizationType) => {
    setSelectedOptimizations((prev) =>
      prev.includes(type)
        ? prev.filter((t) => t !== type)
        : [...prev, type]
    );
  };

  // 전체 선택/해제
  const toggleAll = () => {
    if (selectedOptimizations.length === optimizationOptions.length) {
      setSelectedOptimizations([]);
    } else {
      setSelectedOptimizations(optimizationOptions.map((o) => o.id));
    }
  };

  // 최적화 실행
  const runOptimizations = useCallback(async () => {
    console.log('[AIOptimizationTab] runOptimizations clicked', {
      selectedOptimizations,
      selectedGoal,
      storeId,
      hasSceneData: !!sceneData,
      optimizationSettings,
    });

    if (selectedOptimizations.length === 0) {
      toast.error('최적화를 선택하세요');
      return;
    }

    if (!storeId) {
      toast.error('매장을 선택해주세요');
      return;
    }

    if (!sceneData) {
      toast.error('씬 데이터가 없습니다');
      return;
    }

    setRunningTypes([...selectedOptimizations]);
    setOptimizationProgress(0);

    // 진행률 업데이트 인터벌
    const progressInterval = setInterval(() => {
      setOptimizationProgress((prev) => {
        if (prev >= 90) return prev;
        return prev + Math.random() * 8 + 2; // 2-10% 씩 증가
      });
    }, 400);

    try {
      // Store Context 빌드 (온톨로지 + 데이터소스)
      setOptimizationProgress(10);
      console.log('[AIOptimizationTab] Building store context...');
      const storeContext = await buildStoreContext(storeId);
      setOptimizationProgress(25);
      console.log('[AIOptimizationTab] Store context built:', {
        hasZones: storeContext.zones?.length,
        hasFurniture: storeContext.productPlacements?.length,
        hasVisits: storeContext.visits?.length,
      });

      // 강도에 따른 제한 설정
      const intensityLimits = INTENSITY_LIMITS[optimizationSettings.intensity];

      // 선택된 최적화만 실행하도록 파라미터 구성
      const params: Record<string, Record<string, any>> = {};

      // 🔧 FIX: 환경 컨텍스트 구성 (날짜선택/직접설정 모드일 때 사용)
      const environmentContext = simulationEnvConfig && (simulationEnvConfig.mode === 'dateSelect' || simulationEnvConfig.mode === 'manual')
        ? {
            weather: getEffectiveWeather(simulationEnvConfig),
            temperature: simulationEnvConfig.autoLoadedData?.weather?.temperature ?? 20,
            humidity: simulationEnvConfig.autoLoadedData?.weather?.humidity ?? 50,
            holiday_type: getEffectiveHoliday(simulationEnvConfig),
            time_of_day: getEffectiveTimeOfDay(simulationEnvConfig),
            impact: simulationEnvConfig.calculatedImpact,
          }
        : null;

      // 🆕 진단 이슈 컨텍스트 구성 (시뮬레이션에서 전달받은 문제점들)
      const diagnosticIssuesContext = diagnosticIssues.length > 0
        ? {
            priority_issues: diagnosticIssues.map(issue => ({
              id: issue.id,
              type: (issue as any).type || 'unknown',
              severity: issue.severity,
              title: issue.title,
              zone_id: (issue as any).zone_id || issue.zone,
              zone_name: (issue as any).zone_name || issue.zone,
              description: issue.message || (issue as any).details?.description,
              impact: (issue as any).impact,
              recommendations: issue.recommendation ? [issue.recommendation] : (issue as any).recommendations || [],
            })),
            scenario_context: (diagnosticIssues[0] as any)?.scenario_context || null,
            environment_context: (diagnosticIssues[0] as any)?.environment_context || null,
            simulation_kpis: (diagnosticIssues[0] as any)?.simulation_kpis || null,
          }
        : null;

      console.log('[AIOptimizationTab] Diagnostic issues context:', diagnosticIssuesContext);

      if (selectedOptimizations.includes('layout')) {
        // 목표를 설정 패널의 objective로 매핑
        const goalMapping: Record<string, OptimizationGoal> = {
          revenue: 'revenue',
          dwell_time: 'dwell_time',
          conversion: 'conversion',
          balanced: 'revenue', // balanced는 revenue로 기본 설정
        };

        params.layout = {
          goal: goalMapping[optimizationSettings.objective] || selectedGoal,
          storeContext,
          // 🆕 환경 컨텍스트 추가 (비 오는 날 → 실내 체류 증가 가정 등)
          environment_context: environmentContext,
          // 🆕 진단 이슈 컨텍스트 추가 (시뮬레이션에서 발견한 문제점 우선 해결)
          diagnostic_issues: diagnosticIssuesContext,
          // 설정 패널의 상세 설정 전달
          settings: {
            objective: optimizationSettings.objective,
            furniture: {
              movableIds: optimizationSettings.furniture.movableIds,
              keepWallAttached: optimizationSettings.furniture.keepWallAttached,
              keepZoneBoundaries: optimizationSettings.furniture.keepZoneBoundaries,
              maxMoves: intensityLimits.maxFurnitureMoves,
            },
            products: {
              relocatableIds: optimizationSettings.products.relocateAll
                ? [] // 빈 배열 = 전체 제품
                : optimizationSettings.products.relocatableIds,
              relocateAll: optimizationSettings.products.relocateAll,
              respectDisplayType: optimizationSettings.products.respectDisplayType,
              keepCategory: optimizationSettings.products.keepCategory,
              maxRelocations: intensityLimits.maxProductRelocations,
            },
            intensity: optimizationSettings.intensity,
          },
        };
      }
      if (selectedOptimizations.includes('flow')) {
        params.flow = {
          duration: '1hour',
          customerCount: 100,
          storeContext,
          // 🆕 환경 컨텍스트 추가 (날씨에 따른 동선 패턴 변화 등)
          environment_context: environmentContext,
        };
      }
      if (selectedOptimizations.includes('staffing')) {
        // 선택된 목표에 따라 직원 배치 전략 결정
        const staffingGoalMap: Record<OptimizationGoal, string> = {
          revenue: 'sales_support',
          dwell_time: 'customer_engagement',
          traffic: 'flow_guidance',
          conversion: 'customer_service',
        };
        // 🔧 FIX: 실제 DB 직원 수 사용 (하드코딩 제거)
        const actualStaffCount = storeContext.staff?.length || 8;
        params.staffing = {
          staffCount: actualStaffCount,
          goal: staffingGoalMap[selectedGoal],
          storeContext,
          // 🆕 환경 컨텍스트 추가 (블랙프라이데이 → 고트래픽 가정 등)
          environment_context: environmentContext,
        };
        console.log('[AIOptimizationTab] Using actual staff count:', actualStaffCount);
      }

      console.log('[AIOptimizationTab] Calling runAllSimulations with params:', Object.keys(params));

      // useSceneSimulation의 runAllSimulations 호출 - 결과를 직접 반환받음
      const results = await sceneSimulation.runAllSimulations(params, sceneData);

      console.log('[AIOptimizationTab] runAllSimulations returned:', {
        hasLayout: !!results.layout,
        hasFlow: !!results.flow,
        hasStaffing: !!results.staffing,
        results,
      });

      // 🆕 레이아웃 결과 유효성 검증
      if (results.layout) {
        const storeDataForValidation = {
          zones: storeContext.zones || [],
          furniture: sceneData.furniture?.map((f) => ({
            id: f.id,
            furniture_code: f.furniture_type || f.metadata?.furniture_code,
            metadata: f.metadata,
            position: f.position,
          })) || [],
        };

        const validation = validateOptimizationResult(
          {
            furniture_moves: results.layout.furnitureMoves || results.layout.layoutChanges || [],
            product_placements: results.layout.productPlacements || [],
          },
          storeDataForValidation
        );

        console.log('[AIOptimizationTab] Validation result:', {
          isValid: validation.isValid,
          removedFurniture: validation.removedItems.furniture.length,
          removedProducts: validation.removedItems.products.length,
          warnings: validation.warnings,
        });

        // 유효하지 않은 항목이 있으면 경고 표시
        if (!validation.isValid) {
          const removedCount = validation.removedItems.furniture.length + validation.removedItems.products.length;
          toast.warning(`${removedCount}개 항목이 유효성 검증에서 필터링됨`, {
            description: validation.warnings.slice(0, 3).join('\n'),
          });

          // 검증된 결과로 교체
          if (results.layout.furnitureMoves) {
            results.layout.furnitureMoves = validation.filteredResult.furniture_moves as any[];
          }
          if ((results.layout as any).layoutChanges) {
            (results.layout as any).layoutChanges = validation.filteredResult.furniture_moves as any[];
          }
          if (results.layout.productPlacements) {
            results.layout.productPlacements = validation.filteredResult.product_placements as any[];
          }
        }
      }

      // 레이아웃 결과가 있으면 오버레이 활성화 및 오른쪽 패널 업데이트
      if (results.layout) {
        onOverlayToggle('layoutOptimization', true);

        // 오른쪽 패널용 결과 변환
        if (onResultsUpdate) {
          const layoutPanelResult = {
            currentEfficiency: results.layout.currentEfficiency || 1,
            optimizedEfficiency: results.layout.optimizedEfficiency || 75,
            revenueIncrease: results.layout.improvements?.revenueIncrease ||
                            results.layout.optimizationSummary?.expectedRevenueIncrease || 0,
            dwellTimeIncrease: results.layout.improvements?.dwellTimeIncrease || 0,
            conversionIncrease: results.layout.improvements?.conversionIncrease ||
                               results.layout.optimizationSummary?.expectedConversionIncrease || 0,
            // 가구 변경 사항 (layoutChanges 또는 furnitureMoves 지원)
            changes: (results.layout.layoutChanges || results.layout.furnitureMoves || []).map((move: any) => ({
              item: move.entityLabel || move.furnitureName || move.furnitureId || move.name || '가구',
              from: (move.currentPosition || move.fromPosition)
                ? `(${(move.currentPosition?.x || move.fromPosition?.x || 0).toFixed(1)}, ${(move.currentPosition?.z || move.fromPosition?.z || 0).toFixed(1)})`
                : 'As-Is',
              to: (move.suggestedPosition || move.toPosition)
                ? `(${(move.suggestedPosition?.x || move.toPosition?.x || 0).toFixed(1)}, ${(move.suggestedPosition?.z || move.toPosition?.z || 0).toFixed(1)})`
                : 'To-Be',
              effect: move.reason || '+효율성',
            })),
            // 🆕 제품 재배치 변경 사항 (슬롯 바인딩 기반)
            productChanges: (results.layout.productPlacements || []).map((placement: any) => ({
              productId: placement.productId || placement.product_id || '',
              productSku: placement.productSku || placement.sku || '',
              productName: placement.productName || placement.productLabel || placement.sku || '상품',
              // As-Is (현재 위치)
              fromFurniture: placement.fromFurnitureCode || placement.fromFurnitureName || placement.currentFurnitureLabel || '현재 가구',
              fromSlot: placement.fromSlotId || '-',
              // To-Be (제안 위치)
              toFurniture: placement.toFurnitureCode || placement.toFurnitureName || placement.suggestedFurnitureLabel || '추천 가구',
              toSlot: placement.toSlotId || '-',
              // 사유 및 예상 효과
              reason: placement.reason || '슬롯 최적화',
              expectedImpact: placement.expectedImpact ? {
                revenueChangePct: placement.expectedImpact.revenueChangePct || placement.expectedImpact.revenue_change_pct || 0,
                visibilityScore: placement.expectedImpact.visibilityScore || placement.expectedImpact.visibility_score || 0,
              } : undefined,
            })),
          };

          console.log('[AIOptimizationTab] layoutPanelResult:', {
            changesCount: layoutPanelResult.changes.length,
            productChangesCount: layoutPanelResult.productChanges.length,
            rawLayoutChanges: results.layout.layoutChanges?.length,
            rawFurnitureMoves: results.layout.furnitureMoves?.length,
            rawProductPlacements: results.layout.productPlacements?.length,
          });

          onResultsUpdate('layout', layoutPanelResult);
        }
      }

      // 동선 결과가 있으면 오버레이 활성화 및 오른쪽 패널 업데이트
      if (results.flow) {
        onOverlayToggle('flowOptimization', true);

        if (onResultsUpdate) {
          const flowPanelResult = {
            currentPathLength: results.flow.comparison?.currentPathLength || 45,
            optimizedPathLength: results.flow.comparison?.optimizedPathLength || 38,
            bottlenecks: results.flow.bottlenecks?.map((b: any) => ({
              location: b.location || b.zoneName || '구간',
              congestion: Math.round((b.severity || b.congestionLevel || 0.7) * 100),
              cause: b.cause || '통로 혼잡',
              suggestion: b.suggestions?.[0] || '통로 확장 권장',
            })) || [],
            improvements: [
              { metric: '동선 길이 감소', value: `${results.flow.comparison?.pathLengthReduction?.toFixed(1) || -15}%` },
              { metric: '이동 시간 감소', value: `${results.flow.comparison?.timeReduction?.toFixed(1) || -18}%` },
              { metric: '병목 해소율', value: `${Math.round((results.flow.comparison?.congestionReduction || 0.8) * 100)}%` },
            ],
          };
          onResultsUpdate('flow', flowPanelResult);
        }
      }

      // 인력배치 결과가 있으면 오버레이 활성화 및 오른쪽 패널 업데이트
      if (results.staffing) {
        onOverlayToggle('staffing', true);

        if (onResultsUpdate) {
          const currentCoverage = results.staffing.zoneCoverage?.[0]?.currentCoverage || 68;
          const optimizedCoverage = results.staffing.zoneCoverage?.[0]?.suggestedCoverage || 92;
          const staffingPanelResult = {
            currentCoverage,
            optimizedCoverage,
            staffCount: results.staffing.staffPositions?.length || 3,
            staffPositions: results.staffing.staffPositions?.map((p: any) => ({
              name: p.staffName || p.staffId || `직원`,
              current: p.currentPosition ? `(${p.currentPosition.x?.toFixed(1)}, ${p.currentPosition.z?.toFixed(1)})` : '현재 위치',
              suggested: p.suggestedPosition ? `(${p.suggestedPosition.x?.toFixed(1)}, ${p.suggestedPosition.z?.toFixed(1)})` : '제안 위치',
              coverageGain: `+${p.coverageGain || 10}%`,
            })) || [],
            improvements: [
              { metric: '고객 응대율', value: `+${Math.round((results.staffing.metrics?.customerServiceRateIncrease || 0.35) * 100)}%` },
              { metric: '대기 시간', value: `-${Math.round((1 / (results.staffing.metrics?.avgResponseTime || 1)) * 10)}%` },
              { metric: '커버리지 증가', value: `+${results.staffing.metrics?.coverageGain || 24}%` },
            ],
          };
          onResultsUpdate('staffing', staffingPanelResult);
        }
      }

      toast.success(`${selectedOptimizations.length}개 최적화가 완료되었습니다`);
      setOptimizationProgress(100);
    } catch (error) {
      console.error('Optimization error:', error);
      toast.error('최적화 실행 중 오류가 발생했습니다');
    } finally {
      clearInterval(progressInterval);
      setRunningTypes([]);
      // 1초 후 진행률 리셋
      setTimeout(() => setOptimizationProgress(0), 1000);
    }
  }, [selectedOptimizations, selectedGoal, storeId, sceneData, sceneSimulation, onOverlayToggle, onResultsUpdate, optimizationSettings, simulationEnvConfig]);

  // ============================================
  // AI 어시스턴트 내부 이벤트 리스너
  // ============================================
  useEffect(() => {
    // 최적화 설정 변경
    const handleSetOptConfig = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (detail.goal) {
        setSelectedGoal(detail.goal as OptimizationGoal);
      }
      if (detail.types) {
        setSelectedOptimizations(detail.types as OptimizationType[]);
      }
      if (detail.intensity) {
        setOptimizationSettings(prev => ({
          ...prev,
          intensity: detail.intensity,
        }));
      }
    };

    // 최적화 실행
    const handleRunOptInternal = (e: Event) => {
      setTimeout(() => {
        runOptimizations();
      }, 200);
    };

    window.addEventListener('studio:set-opt-config-internal', handleSetOptConfig);
    window.addEventListener('studio:run-optimization-internal', handleRunOptInternal);

    return () => {
      window.removeEventListener('studio:set-opt-config-internal', handleSetOptConfig);
      window.removeEventListener('studio:run-optimization-internal', handleRunOptInternal);
    };
  }, [runOptimizations]);

  // 🆕 뷰 모드 변경 핸들러 (연타 방지 + 3D 위치 적용)
  const handleViewModeChange = useCallback(async (newMode: ViewMode) => {
    // 이미 같은 모드면 무시
    if (viewMode === newMode) return;
    
    // 전환 중이면 무시 (연타 방지)
    if (isTransitioning) {
      console.log('[AIOptimizationTab] View mode transition blocked - already transitioning');
      return;
    }

    setIsTransitioning(true);
    console.log('[AIOptimizationTab] View mode changing:', viewMode, '->', newMode);

    try {
      const results = sceneSimulation.state.results;
      const previousMode = viewMode;
      
      // 🔧 FIX: 상태 전환 로직 수정
      // - As-Is: 원본 위치
      // - 비교: 원본 위치 + 오버레이 (As-Is 박스 + To-Be 박스)
      // - To-Be: 최적화 위치
      
      if (newMode === 'as-is') {
        // As-Is: 원래 위치로 복원
        if (previousMode === 'to-be') {
          // To-Be에서 오는 경우만 위치 복원 필요
          revertSimulationChanges();
        }
        // 비교에서 오는 경우는 이미 As-Is 위치이므로 복원 불필요
        onOverlayToggle('layoutOptimization', false);
        
      } else if (newMode === 'compare') {
        // 🔧 비교 모드: As-Is 위치 유지 + 오버레이만 표시
        if (previousMode === 'to-be') {
          // To-Be에서 오는 경우: 위치를 As-Is로 복원
          revertSimulationChanges();
        }
        // As-Is에서 오는 경우: 위치 변경 없음 (이미 As-Is)
        onOverlayToggle('layoutOptimization', true);
        
      } else if (newMode === 'to-be') {
        // To-Be: 최적화 위치 적용
        const layoutAny = results.layout as any;
        const rawFurnitureMoves = layoutAny?.layoutChanges ||
                                  layoutAny?.furnitureMoves ||
                                  layoutAny?.furniture_changes ||
                                  layoutAny?.furniture_moves || [];
        
        if (rawFurnitureMoves.length > 0) {
          const payload = {
            furnitureMoves: rawFurnitureMoves.map((move: any) => ({
              furnitureId: move.furniture_id || move.furnitureId || move.entityId || move.id,
              furnitureName: move.furniture_name || move.furnitureName || move.entityLabel || move.name,
              toPosition: move.suggested_position || move.suggestedPosition || move.toPosition || move.new_position || {
                x: move.new_x ?? move.x ?? 0,
                y: move.new_y ?? move.y ?? 0,
                z: move.new_z ?? move.z ?? 0,
              },
              rotation: move.rotation ?? move.new_rotation,
              reason: move.reason || move.expected_effect,
            })),
          };
          applySimulationResults(payload);
        }
        onOverlayToggle('layoutOptimization', false);
      }

      // 뷰 모드 상태 업데이트
      setViewMode(newMode);

    } catch (error) {
      console.error('[AIOptimizationTab] View mode change error:', error);
      toast.error('뷰 모드 전환 중 오류가 발생했습니다');
    } finally {
      // 300ms 후 전환 잠금 해제 (애니메이션 완료 대기)
      setTimeout(() => setIsTransitioning(false), 300);
    }
  }, [viewMode, isTransitioning, sceneSimulation.state.results, revertSimulationChanges, applySimulationResults, onOverlayToggle, setViewMode]);

  // As-Is 버튼 클릭 핸들러
  const handleRevertToAsIs = useCallback(() => {
    handleViewModeChange('as-is');
  }, [handleViewModeChange]);

  // 비교 버튼 클릭 핸들러
  const handleCompare = useCallback(() => {
    handleViewModeChange('compare');
  }, [handleViewModeChange]);

  // To-Be 버튼 클릭 핸들러
  const handleApplyToBe = useCallback(() => {
    handleViewModeChange('to-be');
  }, [handleViewModeChange]);

  // To-Be 씬 저장 (개선: 상위 컴포넌트의 씬 저장 기능 사용)
  const handleSaveToBe = useCallback(async () => {
    try {
      const { results } = sceneSimulation.state;
      
      // 저장할 결과가 없으면 에러
      if (!results.layout && !results.flow && !results.staffing) {
        toast.error('저장할 최적화 결과가 없습니다');
        return;
      }

      const sceneName = `최적화 씬 ${new Date().toLocaleDateString('ko-KR')} ${new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}`;
      
      // 🔧 FIX: onSaveScene이 있으면 사용 (DB 저장)
      if (onSaveScene) {
        await onSaveScene(sceneName);
        toast.success('To-Be 씬이 저장되었습니다');
        return;
      }
      
      // toBeScene이 있으면 사용
      if (sceneSimulation.state.toBeScene) {
        await sceneSimulation.saveToBeScene(sceneName);
        return;
      }
      
      // 최후 수단: 로컬 스토리지에 저장
      toast.info('최적화 결과를 시나리오로 저장합니다');
      
      const scenarioData = {
        id: `tobe-scene-${Date.now()}`,
        name: sceneName,
        createdAt: new Date().toISOString(),
        type: 'to-be-scene',
        results: {
          layout: results.layout,
          flow: results.flow,
          staffing: results.staffing,
        },
      };
      
      const savedScenes = JSON.parse(localStorage.getItem('optimization_tobe_scenes') || '[]');
      savedScenes.push(scenarioData);
      localStorage.setItem('optimization_tobe_scenes', JSON.stringify(savedScenes));
      
      toast.success('To-Be 씬이 저장되었습니다 (로컬)');
    } catch (error) {
      console.error('Save To-Be error:', error);
      toast.error('저장에 실패했습니다');
    }
  }, [sceneSimulation, onSaveScene]);

  const { results } = sceneSimulation.state;
  const hasResults = results.layout || results.flow || results.staffing;
  const isRunning = sceneSimulation.isSimulating || runningTypes.length > 0;

  // 시나리오 저장 (ApplyPanel로 전달)
  const handleSaveScenario = useCallback(() => {
    const { results } = sceneSimulation.state;
    if (!results.layout && !results.flow && !results.staffing) {
      toast.error('저장할 최적화 결과가 없습니다');
      return;
    }

    // 시나리오 데이터 구성
    const scenarioData = {
      id: `scenario-${Date.now()}`,
      name: `최적화 시나리오 ${new Date().toLocaleDateString('ko-KR')}`,
      createdAt: new Date().toISOString(),
      goal: selectedGoal,
      optimizations: selectedOptimizations,
      results: {
        layout: results.layout,
        flow: results.flow,
        staffing: results.staffing,
      },
      settings: optimizationSettings,
    };

    // 로컬 스토리지에 저장
    const savedScenarios = JSON.parse(localStorage.getItem('optimization_scenarios') || '[]');
    savedScenarios.push(scenarioData);
    localStorage.setItem('optimization_scenarios', JSON.stringify(savedScenarios));

    toast.success('시나리오가 저장되었습니다', {
      description: '적용하기 탭에서 저장된 시나리오를 확인할 수 있습니다.',
    });
  }, [sceneSimulation.state, selectedGoal, selectedOptimizations, optimizationSettings]);

  return (
    <div className="p-4 space-y-4 min-h-0">
      {/* ========== 🆕 문제점 시나리오 (AI 시뮬레이션에서 전달) ========== */}
      {diagnosticIssues.length > 0 && (
        <div className="space-y-3">
          {/* 시나리오 컨텍스트 헤더 */}
          <div className="p-3 bg-gradient-to-r from-red-500/10 via-orange-500/10 to-yellow-500/10 rounded-lg border border-red-500/30">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-semibold text-white flex items-center gap-2">
                <Target className="w-4 h-4 text-red-400" />
                해결할 문제점 시나리오
              </span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-red-500/20 text-red-300 border border-red-500/30">
                {diagnosticIssues.length}건 발견
              </span>
            </div>

            {/* 시나리오/환경 컨텍스트 (있는 경우) */}
            {diagnosticIssues[0]?.scenario_context && (
              <div className="mb-2 p-2 bg-purple-500/10 rounded border border-purple-500/20">
                <div className="flex items-center gap-2 text-xs">
                  <span className="text-purple-300 font-medium">📊 시뮬레이션 시나리오:</span>
                  <span className="text-white">{(diagnosticIssues[0] as any).scenario_context.name}</span>
                </div>
                {(diagnosticIssues[0] as any).scenario_context.description && (
                  <p className="text-[10px] text-white/50 mt-1">
                    {(diagnosticIssues[0] as any).scenario_context.description}
                  </p>
                )}
              </div>
            )}

            {/* 문제점 목록 */}
            <div className="space-y-1.5">
              {diagnosticIssues.slice(0, 5).map((issue, idx) => (
                <div
                  key={issue.id || idx}
                  className={cn(
                    'p-2 rounded flex items-start gap-2',
                    issue.severity === 'critical'
                      ? 'bg-red-500/20 border border-red-500/30'
                      : issue.severity === 'warning'
                      ? 'bg-yellow-500/20 border border-yellow-500/30'
                      : 'bg-blue-500/20 border border-blue-500/30'
                  )}
                >
                  <span className="text-sm">
                    {issue.severity === 'critical' ? '🔴' : issue.severity === 'warning' ? '🟠' : '🔵'}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-white truncate">{issue.title}</p>
                    <p className="text-[10px] text-white/50">
                      {issue.zone || issue.zone_name} • {issue.message || (issue as any).details?.description}
                    </p>
                    {(issue as any).impact?.revenueImpact > 0 && (
                      <p className="text-[10px] text-red-400 mt-0.5">
                        예상 손실: {((issue as any).impact.revenueImpact / 10000).toLocaleString()}만원
                      </p>
                    )}
                  </div>
                </div>
              ))}
              {diagnosticIssues.length > 5 && (
                <p className="text-[10px] text-white/40 text-center pt-1">
                  +{diagnosticIssues.length - 5}건 더 있음
                </p>
              )}
            </div>

            {/* 안내 메시지 */}
            <div className="mt-3 p-2 bg-gradient-to-r from-purple-500/10 to-blue-500/10 rounded border border-purple-500/20">
              <p className="text-xs text-purple-300 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                <strong>AI 최적화</strong>가 위 문제점들을 최우선으로 해결합니다
              </p>
              <p className="text-[10px] text-white/50 mt-1">
                아래에서 최적화 목표와 옵션을 설정하고 실행하세요
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ========== 🔧 FIX: 환경 설정 컨텍스트 (날짜선택/직접설정 모드일 때 표시) ========== */}
      {simulationEnvConfig && (simulationEnvConfig.mode === 'dateSelect' || simulationEnvConfig.mode === 'manual') && (
        <div className="p-3 bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-lg border border-blue-500/30 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-white/80 flex items-center gap-1.5">
              <Cloud className="w-3.5 h-3.5 text-blue-400" />
              환경 컨텍스트 적용됨
            </span>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-400">
              {simulationEnvConfig.mode === 'dateSelect' ? '날짜 선택' : '직접 설정'}
            </span>
          </div>

          <div className="grid grid-cols-3 gap-2 text-xs">
            {/* 날씨 */}
            <div className="flex items-center gap-1.5">
              <span className="text-sm">
                {WEATHER_OPTIONS.find((w) => w.value === getEffectiveWeather(simulationEnvConfig))?.emoji}
              </span>
              <span className="text-white/70">
                {WEATHER_OPTIONS.find((w) => w.value === getEffectiveWeather(simulationEnvConfig))?.label}
              </span>
            </div>

            {/* 휴일 */}
            <div className="flex items-center gap-1.5">
              <span className="text-sm">
                {HOLIDAY_OPTIONS.find((h) => h.value === getEffectiveHoliday(simulationEnvConfig))?.emoji}
              </span>
              <span className="text-white/70">
                {HOLIDAY_OPTIONS.find((h) => h.value === getEffectiveHoliday(simulationEnvConfig))?.label}
              </span>
            </div>

            {/* 시간대 */}
            <div className="flex items-center gap-1.5">
              <span className="text-sm">
                {TIME_OF_DAY_OPTIONS.find((t) => t.value === getEffectiveTimeOfDay(simulationEnvConfig))?.emoji}
              </span>
              <span className="text-white/70">
                {TIME_OF_DAY_OPTIONS.find((t) => t.value === getEffectiveTimeOfDay(simulationEnvConfig))?.label}
              </span>
            </div>
          </div>

          {/* 영향도 요약 */}
          {simulationEnvConfig.calculatedImpact && (
            <div className="text-[10px] text-white/50 pt-1 border-t border-white/10 flex gap-3">
              <span>
                트래픽: <span className={cn(
                  simulationEnvConfig.calculatedImpact.trafficMultiplier > 1 ? 'text-green-400' : 'text-red-400'
                )}>
                  {(simulationEnvConfig.calculatedImpact.trafficMultiplier * 100).toFixed(0)}%
                </span>
              </span>
              <span>
                체류: <span className={cn(
                  simulationEnvConfig.calculatedImpact.dwellTimeMultiplier > 1 ? 'text-green-400' : 'text-red-400'
                )}>
                  {(simulationEnvConfig.calculatedImpact.dwellTimeMultiplier * 100).toFixed(0)}%
                </span>
              </span>
              <span>
                전환: <span className={cn(
                  simulationEnvConfig.calculatedImpact.conversionMultiplier > 1 ? 'text-green-400' : 'text-red-400'
                )}>
                  {(simulationEnvConfig.calculatedImpact.conversionMultiplier * 100).toFixed(0)}%
                </span>
              </span>
            </div>
          )}

          <p className="text-[10px] text-white/40">
            ⚡ AI 최적화 시 위 환경 조건을 고려하여 추천합니다
          </p>
        </div>
      )}

      {/* 구분선 */}
      <div className="border-t border-white/10" />

      {/* ========== 최적화 선택 섹션 ========== */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="text-sm font-medium text-white/80 flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-yellow-400" />
            AI 최적화
          </div>
          <button
            onClick={toggleAll}
            className="text-xs text-blue-400 hover:text-blue-300 transition-colors"
          >
            {selectedOptimizations.length === optimizationOptions.length ? '전체 해제' : '전체 선택'}
          </button>
        </div>

        {/* 최적화 옵션 체크박스 */}
        <div className="space-y-2">
          {optimizationOptions.map((option) => {
            const Icon = option.icon;
            const isSelected = selectedOptimizations.includes(option.id);
            const isRunningThis = runningTypes.includes(option.id);
            const hasResult = !!results[option.id];

            return (
              <label
                key={option.id}
                className={cn(
                  'flex items-start gap-3 p-3 rounded-lg cursor-pointer transition-all',
                  'border border-transparent',
                  isSelected
                    ? 'bg-blue-500/20 border-blue-500/50'
                    : 'bg-white/5 hover:bg-white/10',
                  isRunningThis && 'opacity-70 cursor-wait'
                )}
              >
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={() => toggleOptimization(option.id)}
                  disabled={isRunning}
                  className="mt-1 w-4 h-4 rounded border-white/40 text-blue-600 focus:ring-blue-500 bg-white/10"
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <Icon className={cn('h-4 w-4', isSelected ? 'text-blue-400' : 'text-white/40')} />
                    <span className={cn('text-sm font-medium', isSelected ? 'text-white' : 'text-white/70')}>
                      {option.label}
                    </span>
                    {isRunningThis && <Loader2 className="h-3 w-3 animate-spin text-blue-400" />}
                    {hasResult && !isRunningThis && (
                      <span className="px-1.5 py-0.5 text-xs bg-green-600 text-white rounded">완료</span>
                    )}
                  </div>
                  <p className="text-xs text-white/50 mt-1">{option.description}</p>
                </div>
              </label>
            );
          })}
        </div>

        {/* ========== 상세 설정 섹션 ========== */}
        <div className="space-y-2">
          <button
            onClick={() => setIsSettingsExpanded(!isSettingsExpanded)}
            className="w-full flex items-center justify-between text-xs font-medium text-white/70 hover:text-white/90 transition-colors p-2 bg-white/5 rounded-lg"
          >
            <div className="flex items-center gap-2">
              <Settings2 className="h-4 w-4 text-purple-400" />
              상세 설정
              <span className="text-white/40">
                ({optimizationSettings.intensity === 'low' ? '보수적' : optimizationSettings.intensity === 'medium' ? '균형' : '적극적'})
              </span>
            </div>
            {isSettingsExpanded ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </button>

          {isSettingsExpanded && (
            <div className="animate-in slide-in-from-top-2 duration-200">
              <OptimizationSettingsPanel
                settings={optimizationSettings}
                onChange={setOptimizationSettings}
                furniture={furnitureItems}
                products={productItems}
                disabled={isRunning}
                compact
              />
            </div>
          )}
        </div>

        {/* 실행 버튼 */}
        <Button
          onClick={runOptimizations}
          disabled={isRunning || selectedOptimizations.length === 0}
          className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
        >
          {isRunning ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              최적화 실행 중... {Math.round(optimizationProgress)}%
            </>
          ) : (
            <>
              <Sparkles className="h-4 w-4 mr-2" />
              선택된 {selectedOptimizations.length}개 최적화 실행
            </>
          )}
        </Button>

        {/* 🆕 최적화 진행률 바 */}
        {isRunning && (
          <div className="space-y-1">
            <div className="w-full bg-white/10 rounded-full h-2 overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-300 ease-out"
                style={{ width: `${Math.min(optimizationProgress, 100)}%` }}
              />
            </div>
            <p className="text-[10px] text-white/50 text-center">
              {optimizationProgress < 30 && '매장 데이터 분석 중...'}
              {optimizationProgress >= 30 && optimizationProgress < 60 && 'AI 최적화 계산 중...'}
              {optimizationProgress >= 60 && optimizationProgress < 90 && '결과 생성 중...'}
              {optimizationProgress >= 90 && '완료 처리 중...'}
            </p>
          </div>
        )}
      </div>

      {/* 구분선 */}
      <div className="border-t border-white/10" />

      {/* ========== 결과 섹션 ========== */}
      <div className="space-y-3">
        <button
          onClick={() => setIsResultExpanded(!isResultExpanded)}
          className="w-full flex items-center justify-between text-sm font-medium text-white/80"
        >
          <span>최적화 결과</span>
          {isResultExpanded ? (
            <ChevronUp className="h-4 w-4 text-white/40" />
          ) : (
            <ChevronDown className="h-4 w-4 text-white/40" />
          )}
        </button>

        {isResultExpanded && (
          <div className="space-y-3">
            {!hasResults ? (
              <div className="text-center py-6 text-white/40 text-sm">
                최적화를 실행하면 결과가 여기에 표시됩니다.
              </div>
            ) : (
              <>
                {/* 레이아웃 최적화 결과 */}
                {results.layout && (
                  <OptimizationResultPanel
                    type="layout"
                    title="레이아웃 최적화"
                    result={results.layout}
                    onToggleOverlay={(visible) => onOverlayToggle('layoutOptimization', visible)}
                  />
                )}

                {/* 동선 최적화 결과 */}
                {results.flow && (
                  <OptimizationResultPanel
                    type="flow"
                    title="동선 최적화"
                    result={results.flow}
                    onToggleOverlay={(visible) => onOverlayToggle('flowOptimization', visible)}
                  />
                )}

                {/* 인력 배치 최적화 결과 - 새로운 상세 패널 사용 */}
                {results.staffing && (
                  <StaffOptimizationResultPanel
                    result={results.staffing as unknown as StaffOptimizationResult}
                    onToggleOverlay={(visible) => {
                      setShowStaffOverlay(visible);
                      onOverlayToggle('staffing', visible);
                    }}
                    isOverlayVisible={showStaffOverlay}
                  />
                )}

                {/* 🆕 As-Is / 비교 / To-Be 뷰 모드 토글 (3버튼) */}
                <div className="flex gap-1 p-1 bg-white/5 rounded-lg">
                  <Button
                    onClick={handleRevertToAsIs}
                    variant="ghost"
                    size="sm"
                    disabled={isTransitioning}
                    className={cn(
                      "flex-1 h-8 text-xs transition-all",
                      viewMode === 'as-is' 
                        ? "bg-blue-600 text-white hover:bg-blue-700" 
                        : "text-white/60 hover:text-white hover:bg-white/10"
                    )}
                  >
                    <Eye className="h-3.5 w-3.5 mr-1" />
                    As-Is
                  </Button>
                  <Button
                    onClick={handleCompare}
                    variant="ghost"
                    size="sm"
                    disabled={isTransitioning}
                    className={cn(
                      "flex-1 h-8 text-xs transition-all",
                      viewMode === 'compare' 
                        ? "bg-purple-600 text-white hover:bg-purple-700" 
                        : "text-white/60 hover:text-white hover:bg-white/10"
                    )}
                  >
                    <GitCompare className="h-3.5 w-3.5 mr-1" />
                    비교
                  </Button>
                  <Button
                    onClick={handleApplyToBe}
                    variant="ghost"
                    size="sm"
                    disabled={isTransitioning}
                    className={cn(
                      "flex-1 h-8 text-xs transition-all",
                      viewMode === 'to-be' 
                        ? "bg-green-600 text-white hover:bg-green-700" 
                        : "text-white/60 hover:text-white hover:bg-white/10"
                    )}
                  >
                    <Sparkles className="h-3.5 w-3.5 mr-1" />
                    To-Be
                  </Button>
                </div>

                {/* 현재 뷰 모드 설명 */}
                <div className="text-[10px] text-center text-white/40 py-1">
                  {viewMode === 'as-is' && '📍 현재 배치 상태'}
                  {viewMode === 'compare' && '🔄 현재 배치 + 이동 위치 표시 (빨강→초록)'}
                  {viewMode === 'to-be' && '✨ 최적화 결과 적용 상태'}
                </div>

                {/* 저장 버튼 그룹 */}
                <div className="flex gap-2 pt-2 border-t border-white/10">
                  <Button
                    onClick={handleSaveToBe}
                    variant="outline"
                    size="sm"
                    className="flex-1 border-white/20 text-white/70 hover:text-white hover:bg-white/10"
                  >
                    <Save className="h-3.5 w-3.5 mr-1.5" />
                    씬 저장
                  </Button>
                  <Button
                    onClick={handleSaveScenario}
                    variant="outline"
                    size="sm"
                    className="flex-1 border-purple-500/50 text-purple-400 hover:text-purple-300 hover:bg-purple-500/10"
                  >
                    <BookmarkPlus className="h-3.5 w-3.5 mr-1.5" />
                    시나리오 저장
                  </Button>
                </div>

                {/* 적용하기 탭으로 이동 버튼 */}
                {onNavigateToApply && (
                  <Button
                    onClick={onNavigateToApply}
                    className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
                  >
                    <ArrowRight className="h-4 w-4 mr-2" />
                    적용하기 탭에서 검토 및 실행
                  </Button>
                )}
              </>
            )}
          </div>
        )}
      </div>

      {/* 비교 요약 */}
      {sceneSimulation.state.comparison && (
        <div className="p-3 bg-white/5 rounded-lg border border-white/10">
          <h4 className="text-xs font-medium text-white/60 mb-2">변경 요약</h4>
          <div className="space-y-1 text-xs">
            <div className="flex justify-between">
              <span className="text-white/50">총 변경 수</span>
              <span className="text-white">{sceneSimulation.state.comparison.summary.totalChanges}개</span>
            </div>
            <div className="flex justify-between">
              <span className="text-white/50">예상 매출 증가</span>
              <span className="text-green-400">
                +{sceneSimulation.state.comparison.summary.expectedImpact?.revenue?.toFixed(1) || 0}%
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-white/50">예상 체류시간 증가</span>
              <span className="text-blue-400">
                +{sceneSimulation.state.comparison.summary.expectedImpact?.traffic?.toFixed(1) || 0}%
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AIOptimizationTab;
