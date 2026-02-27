/**
 * useSceneSimulation.ts
 *
 * 씬 기반 AI 시뮬레이션 통합 훅
 * - As-is 씬 데이터를 AI에 전달
 * - 시뮬레이션 결과로 To-be 씬 생성
 * - 씬 비교 및 적용 관리
 * - 🆕 슬롯 기반 제품 배치 정보 추출
 */

import { useState, useCallback, useMemo } from 'react';
import { useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useSelectedStore } from '@/hooks/useSelectedStore';
import { useToast } from '@/components/ui/use-toast';
import {
  generateLayoutOptimizedScene,
  generateFlowOptimizedScene,
  generateStaffingOptimizedScene,
  generateCombinedOptimizedScene,
  mergeToBeIntoAsIs,
  type SceneComparison,
  type SceneChange,
} from '../utils/ToBeSceneGenerator';
import type {
  SceneRecipe,
  SavedScene,
  LayoutSimulationResultType,
  FlowSimulationResultType,
  CongestionSimulationResultType,
  StaffingSimulationResultType,
  FurnitureAsset,
  // 🆕 Ultimate 타입
  UltimateOptimizationResponse,
  FlowAnalysisSummary,
  EnvironmentSummary,
  AssociationSummary,
  PredictionSummary,
  ConversionPredictionSummary,
  VMDAnalysis,
  LearningSession,
} from '../types';

// ============================================================================
// 🆕 슬롯 기반 제품 배치 타입
// ============================================================================

export interface ProductPlacementInfo {
  productId: string;
  productSku: string;
  productName: string;
  category?: string;
  displayType?: string;
  furnitureId: string;
  furnitureCode?: string;
  furnitureName?: string;
  slotId?: string;
  slotType?: string;
  position?: { x: number; y: number; z: number };
}

export interface AvailableSlotInfo {
  slotId: string;
  slotCode?: string;
  furnitureId: string;
  furnitureCode?: string;
  furnitureName?: string;
  slotType?: string;
  compatibleDisplayTypes?: string[];
  position?: { x: number; y: number; z: number };
}

// ============================================================================
// 🆕 제품 배치 및 슬롯 정보 추출 함수
// ============================================================================

/**
 * 가구의 childProducts에서 현재 제품 배치 정보 추출
 */
function extractProductPlacements(furniture: FurnitureAsset[]): ProductPlacementInfo[] {
  const placements: ProductPlacementInfo[] = [];

  furniture.forEach((f) => {
    const childProducts = (f as any).childProducts || [];
    childProducts.forEach((cp: any) => {
      placements.push({
        productId: cp.id,
        productSku: cp.sku || cp.metadata?.sku || '',
        productName: cp.metadata?.product_name || cp.metadata?.name || cp.sku || '상품',
        category: cp.metadata?.category,
        displayType: cp.display_type || cp.metadata?.display_type,
        furnitureId: f.id,
        furnitureCode: f.metadata?.furniture_code || f.metadata?.code,
        furnitureName: f.metadata?.name || f.furniture_type,
        slotId: cp.metadata?.slot_id || cp.slot_id,
        slotType: cp.metadata?.slot_type,
        position: cp.position ? {
          x: cp.position.x ?? cp.position[0] ?? 0,
          y: cp.position.y ?? cp.position[1] ?? 0,
          z: cp.position.z ?? cp.position[2] ?? 0,
        } : undefined,
      });
    });
  });

  console.log('[useSceneSimulation] extractProductPlacements:', placements.length, 'products');
  return placements;
}

/**
 * 사용 가능한 빈 슬롯 목록 추출
 * (DB의 furniture_slots 테이블에서 로드된 슬롯 정보와 현재 제품 배치 비교)
 */
async function extractAvailableSlots(
  storeId: string,
  furniture: FurnitureAsset[],
  currentPlacements: ProductPlacementInfo[]
): Promise<AvailableSlotInfo[]> {
  // DB에서 슬롯 데이터 로드
  const { data: dbSlots, error } = await supabase
    .from('furniture_slots')
    .select('*')
    .eq('store_id', storeId);

  if (error || !dbSlots) {
    console.warn('[useSceneSimulation] Failed to load slots:', error);
    return [];
  }

  // 현재 점유된 슬롯 ID 세트
  const occupiedSlotIds = new Set(currentPlacements.map((p) => p.slotId).filter(Boolean));

  // 가구 ID -> 가구 정보 맵
  const furnitureMap = new Map<string, FurnitureAsset>();
  furniture.forEach((f) => furnitureMap.set(f.id, f));

  // 빈 슬롯 필터링
  const availableSlots: AvailableSlotInfo[] = dbSlots
    .filter((s: any) => !s.is_occupied && !occupiedSlotIds.has(s.slot_id))
    .map((s: any) => {
      const furn = furnitureMap.get(s.furniture_id);
      return {
        slotId: s.id,
        slotCode: s.slot_id,
        furnitureId: s.furniture_id,
        furnitureCode: furn?.metadata?.furniture_code || furn?.metadata?.code,
        furnitureName: furn?.metadata?.name || furn?.furniture_type,
        slotType: s.slot_type,
        compatibleDisplayTypes: s.compatible_display_types,
        position: s.slot_position ? {
          x: s.slot_position.x ?? 0,
          y: s.slot_position.y ?? 0,
          z: s.slot_position.z ?? 0,
        } : undefined,
      };
    });

  console.log('[useSceneSimulation] extractAvailableSlots:', availableSlots.length, 'slots');
  return availableSlots;
}

// 타입 별칭 (기존 코드와 호환성 유지)
type LayoutSimulationResult = LayoutSimulationResultType & {
  // 서버/Edge 응답에서 snake_case/camelCase 변형이 올 수 있어 선택적으로 허용
  furniture_changes?: any[];
  furniture_moves?: any[];
  furnitureMoves?: any[];
  layoutChanges?: any[];
  product_changes?: any[];
  product_moves?: any[];
};

type FlowSimulationResult = FlowSimulationResultType;

type CongestionSimulationResult = CongestionSimulationResultType;

type StaffingSimulationResult = StaffingSimulationResultType & {
  staffPositions?: any[];
  visualization?: any;
};

// ============================================================================
// 타입 정의
// ============================================================================

export type SimulationType = 'layout' | 'flow' | 'congestion' | 'staffing' | 'combined';

export interface SimulationRequest {
  type: SimulationType;
  params: Record<string, any>;
}

export interface SimulationResults {
  layout?: LayoutSimulationResult;
  flow?: FlowSimulationResult;
  congestion?: CongestionSimulationResult;
  staffing?: StaffingSimulationResult;
  // 🆕 Ultimate 분석 결과
  ultimateAnalysis?: {
    flowAnalysis?: FlowAnalysisSummary;
    environment?: EnvironmentSummary;
    association?: AssociationSummary;
    prediction?: PredictionSummary;
    conversionPrediction?: ConversionPredictionSummary;
    vmd?: VMDAnalysis;
    learningSession?: LearningSession | null;
    overallConfidence?: number;
  };
}

export interface SceneSimulationState {
  asIsScene: SceneRecipe | null;
  toBeScene: SceneRecipe | null;
  comparison: SceneComparison | null;
  activeSimulations: SimulationType[];
  results: SimulationResults;
  selectedChanges: string[];
  viewMode: 'asIs' | 'toBe' | 'split' | 'overlay';
}

export interface UseSceneSimulationReturn {
  // 상태
  state: SceneSimulationState;
  isSimulating: boolean;
  error: Error | null;

  // 씬 관리
  setAsIsScene: (scene: SceneRecipe | SavedScene) => void;
  clearScenes: () => void;

  // 시뮬레이션 실행
  runSimulation: (request: SimulationRequest) => Promise<void>;
  runAllSimulations: (params?: Partial<Record<SimulationType, Record<string, any>>>, scene?: SceneRecipe) => Promise<SimulationResults>;

  // 결과 관리
  getComparison: () => SceneComparison | null;
  getChanges: () => SceneChange[];

  // 변경 선택 및 적용
  selectChange: (changeId: string) => void;
  deselectChange: (changeId: string) => void;
  selectAllChanges: () => void;
  deselectAllChanges: () => void;
  applySelectedChanges: () => Promise<SceneRecipe>;
  applyAllChanges: () => Promise<SceneRecipe>;

  // 뷰 모드
  setViewMode: (mode: SceneSimulationState['viewMode']) => void;

  // To-be 씬 저장
  saveToBeScene: (name: string) => Promise<void>;
}

// ============================================================================
// 훅 구현
// ============================================================================

export function useSceneSimulation(): UseSceneSimulationReturn {
  const { orgId, user } = useAuth();
  const { selectedStore } = useSelectedStore();
  const { toast } = useToast();

  // 상태
  const [state, setState] = useState<SceneSimulationState>({
    asIsScene: null,
    toBeScene: null,
    comparison: null,
    activeSimulations: [],
    results: {},
    selectedChanges: [],
    viewMode: 'split',
  });

  const [isSimulating, setIsSimulating] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // As-is 씬 설정
  const setAsIsScene = useCallback((scene: SceneRecipe | SavedScene) => {
    const recipe = 'recipe_data' in scene ? scene.recipe_data : scene;
    setState((prev) => ({
      ...prev,
      asIsScene: recipe,
      toBeScene: null,
      comparison: null,
      results: {},
      selectedChanges: [],
    }));
  }, []);

  // 씬 초기화
  const clearScenes = useCallback(() => {
    setState({
      asIsScene: null,
      toBeScene: null,
      comparison: null,
      activeSimulations: [],
      results: {},
      selectedChanges: [],
      viewMode: 'split',
    });
  }, []);

  // 시뮬레이션 실행
  const simulationMutation = useMutation({
    mutationFn: async (request: SimulationRequest): Promise<SimulationResults> => {
      if (!state.asIsScene || !selectedStore?.id || !orgId) {
        throw new Error('씬 또는 매장 정보가 없습니다.');
      }

      setIsSimulating(true);
      setState((prev) => ({
        ...prev,
        activeSimulations: [...prev.activeSimulations, request.type],
      }));

      // As-is 씬 데이터를 AI에 전달
      const sceneData = {
        furniture: state.asIsScene.furniture.map((f) => ({
          id: f.id,
          type: f.furniture_type,
          position: f.position,
          rotation: f.rotation,
          dimensions: f.dimensions,
        })),
        products: state.asIsScene.products.map((p) => ({
          id: p.id,
          sku: p.sku,
          position: p.position,
          dimensions: p.dimensions,
        })),
        space: {
          dimensions: state.asIsScene.space.dimensions,
        },
      };

      // 🔧 마이그레이션: 타입별 Edge Function 분기
      let data: any;
      let error: any;

      if (request.type === 'layout') {
        // layout → generate-optimization 'both' 타입
        const response = await supabase.functions.invoke('generate-optimization', {
          body: {
            store_id: selectedStore.id,
            optimization_type: 'both', // furniture + product
            parameters: request.params,
          },
        });
        data = response.data;
        error = response.error;
      } else if (request.type === 'staffing') {
        // staffing → generate-optimization 'staffing' 타입
        const response = await supabase.functions.invoke('generate-optimization', {
          body: {
            store_id: selectedStore.id,
            optimization_type: 'staffing',
            parameters: request.params,
          },
        });
        data = response.data;
        error = response.error;
      } else {
        // flow, congestion은 advanced-ai-inference 유지
        const response = await supabase.functions.invoke('advanced-ai-inference', {
          body: {
            type: `${request.type}_simulation`,
            storeId: selectedStore.id,
            orgId,
            params: {
              ...request.params,
              sceneData,
            },
          },
        });
        data = response.data;
        error = response.error;
      }

      if (error) throw error;
      if (!data) throw new Error('시뮬레이션 결과를 받지 못했습니다.');

      // generate-optimization 응답 구조 변환
      const result = request.type === 'layout'
        ? { layoutChanges: data.furniture_changes || [], productPlacements: data.product_changes || [], summary: data.summary }
        : request.type === 'staffing'
          ? data.staffing_result || data
          : data.result;

      return { [request.type]: result };
    },
    onSuccess: (newResults) => {
      setState((prev) => {
        const updatedResults = { ...prev.results, ...newResults };

        // To-be 씬 생성
        let comparison: SceneComparison | null = null;
        if (prev.asIsScene) {
          if (updatedResults.layout) {
            comparison = generateLayoutOptimizedScene(prev.asIsScene, updatedResults.layout);
          } else if (updatedResults.flow) {
            comparison = generateFlowOptimizedScene(prev.asIsScene, updatedResults.flow);
          } else if (updatedResults.staffing) {
            comparison = generateStaffingOptimizedScene(prev.asIsScene, updatedResults.staffing);
          }
        }

        return {
          ...prev,
          results: updatedResults,
          toBeScene: comparison?.toBe || prev.toBeScene,
          comparison,
          activeSimulations: prev.activeSimulations.filter(
            (s) => !Object.keys(newResults).includes(s)
          ),
        };
      });

      toast({
        title: '시뮬레이션 완료',
        description: 'To-be 씬이 생성되었습니다.',
      });
    },
    onError: (err) => {
      setError(err as Error);
      toast({
        title: '시뮬레이션 실패',
        description: err instanceof Error ? err.message : '오류가 발생했습니다.',
        variant: 'destructive',
      });
    },
    onSettled: () => {
      setIsSimulating(false);
    },
  });

  // 단일 시뮬레이션 실행
  const runSimulation = useCallback(
    async (request: SimulationRequest) => {
      await simulationMutation.mutateAsync(request);
    },
    [simulationMutation]
  );

  // 전체 시뮬레이션 실행 (scene 파라미터로 직접 씬을 전달할 수 있음)
  const runAllSimulations = useCallback(
    async (params?: Partial<Record<SimulationType, Record<string, any>>>, scene?: SceneRecipe): Promise<SimulationResults> => {
      console.log('[useSceneSimulation] runAllSimulations called', {
        hasParams: !!params,
        paramsKeys: params ? Object.keys(params) : [],
        hasScene: !!scene,
        storeId: selectedStore?.id,
        orgId,
      });

      // 직접 전달된 씬 또는 state의 asIsScene 사용
      const targetScene = scene || state.asIsScene;

      if (!targetScene || !selectedStore?.id || !orgId) {
        console.error('[useSceneSimulation] Missing required data:', {
          hasTargetScene: !!targetScene,
          storeId: selectedStore?.id,
          orgId,
        });
        toast({
          title: '씬을 먼저 선택해주세요',
          variant: 'destructive',
        });
        return {};
      }

      // 직접 전달된 씬이 있으면 state도 업데이트
      if (scene) {
        setState((prev) => ({
          ...prev,
          asIsScene: scene,
          toBeScene: null,
          comparison: null,
          results: {},
          selectedChanges: [],
        }));
      }

      setIsSimulating(true);

      try {
        // 🆕 슬롯 기반 제품 배치 정보 추출
        const productPlacements = extractProductPlacements(targetScene.furniture);
        const availableSlots = await extractAvailableSlots(
          selectedStore.id,
          targetScene.furniture,
          productPlacements
        );

        console.log('[useSceneSimulation] Product placements for AI:', productPlacements.length);
        console.log('[useSceneSimulation] Available slots for AI:', availableSlots.length);

        // 씬 데이터 준비 (🆕 슬롯 기반 정보 포함)
        const sceneData = {
          furniture: targetScene.furniture.map((f) => ({
            id: f.id,
            type: f.furniture_type,
            code: f.metadata?.furniture_code || f.metadata?.code,
            name: f.metadata?.name || f.furniture_type,
            position: f.position,
            rotation: f.rotation,
            dimensions: f.dimensions,
          })),
          products: targetScene.products.map((p) => ({
            id: p.id,
            sku: p.sku,
            position: p.position,
            dimensions: p.dimensions,
          })),
          space: {
            dimensions: targetScene.space.dimensions,
          },
          // 🆕 슬롯 기반 제품 배치 정보
          productPlacements: productPlacements.map((p) => ({
            productId: p.productId,
            productSku: p.productSku,
            productName: p.productName,
            category: p.category,
            displayType: p.displayType,
            furnitureId: p.furnitureId,
            furnitureCode: p.furnitureCode,
            furnitureName: p.furnitureName,
            slotId: p.slotId,
            slotType: p.slotType,
          })),
          // 🆕 사용 가능한 빈 슬롯
          availableSlots: availableSlots.map((s) => ({
            slotId: s.slotId,
            slotCode: s.slotCode,
            furnitureId: s.furnitureId,
            furnitureCode: s.furnitureCode,
            furnitureName: s.furnitureName,
            slotType: s.slotType,
            compatibleDisplayTypes: s.compatibleDisplayTypes,
          })),
        };

        // 병렬로 시뮬레이션 실행
        console.log('[useSceneSimulation] Invoking Edge Functions...');
        console.log('[useSceneSimulation] Store ID:', selectedStore.id);
        console.log('[useSceneSimulation] Org ID:', orgId);
        console.log('[useSceneSimulation] Scene data:', {
          furnitureCount: sceneData.furniture.length,
          productCount: sceneData.products.length,
          spaceDimensions: sceneData.space.dimensions,
        });
        console.log('[useSceneSimulation] Supabase URL:', (supabase as any).supabaseUrl || 'not accessible');

        // 🔍 DEBUG: 실제 Edge Function 호출 직전 로그
        console.log('[useSceneSimulation] 🚀 Starting Edge Function calls NOW...');

        // 🔧 마이그레이션: advanced-ai-inference → generate-optimization
        // - layout_optimization: generate-optimization (both = furniture + product)
        // - staffing_optimization: generate-optimization (staffing)
        // - flow_simulation: advanced-ai-inference 유지 (generate-optimization 미지원)
        const [layoutRes, flowRes, staffingRes, ultimateRes] = await Promise.allSettled([
          // 레이아웃 최적화 - generate-optimization 'both' 타입 사용
          supabase.functions.invoke('generate-optimization', {
            body: {
              store_id: selectedStore.id,
              optimization_type: 'both', // furniture + product 통합
              parameters: {
                prioritize_revenue: params?.layout?.goal === 'revenue',
                max_furniture_changes: params?.layout?.settings?.furniture?.maxMoves || 12,
                max_product_changes: params?.layout?.settings?.products?.maxRelocations || 30,
                intensity: params?.layout?.settings?.intensity || 'medium',
                goal: params?.layout?.settings?.objective || params?.layout?.goal || 'balanced',
              },
            },
          }),
          // 동선 시뮬레이션 - advanced-ai-inference 유지
          supabase.functions.invoke('advanced-ai-inference', {
            body: {
              type: 'flow_simulation',
              storeId: selectedStore.id,
              orgId,
              params: { ...params?.flow, sceneData },
            },
          }),
          // 인력배치 최적화 - generate-optimization 사용
          supabase.functions.invoke('generate-optimization', {
            body: {
              store_id: selectedStore.id,
              optimization_type: 'staffing',
              parameters: {
                shift_type: params?.staffing?.shiftType || 'weekday_morning',
                visitor_count: params?.staffing?.visitorCount || 100,
              },
            },
          }),
          // 🆕 Ultimate AI 최적화 호출 (동선/환경/연관/VMD 분석 포함)
          supabase.functions.invoke('generate-optimization', {
            body: {
              store_id: selectedStore.id,
              optimization_type: 'both',
              parameters: {
                prioritize_revenue: params?.layout?.goal === 'revenue',
                // 🔧 P0 FIX: Frontend intensity 설정 연동
                max_changes: (params?.layout?.settings?.products?.maxRelocations || 30) +
                             (params?.layout?.settings?.furniture?.maxMoves || 12),
                max_product_changes: params?.layout?.settings?.products?.maxRelocations || 30,
                max_furniture_changes: params?.layout?.settings?.furniture?.maxMoves || 12,
                intensity: params?.layout?.settings?.intensity || 'medium',
                // 🔧 P1 FIX: 환경 컨텍스트 전달
                environment_context: params?.layout?.environment_context || null,
                // 🔧 P1 FIX: 진단 이슈 전달
                diagnostic_issues: params?.layout?.diagnostic_issues || null,
                // 최적화 목표 전달
                goal: params?.layout?.settings?.objective || params?.layout?.goal || 'balanced',
              },
            },
          }),
        ]);

        console.log('[useSceneSimulation] Edge Function responses:', {
          layout: layoutRes.status === 'fulfilled' ? { data: layoutRes.value.data, error: layoutRes.value.error } : { reason: layoutRes.reason },
          flow: flowRes.status === 'fulfilled' ? { data: flowRes.value.data, error: flowRes.value.error } : { reason: flowRes.reason },
          staffing: staffingRes.status === 'fulfilled' ? { data: staffingRes.value.data, error: staffingRes.value.error } : { reason: staffingRes.reason },
          ultimate: ultimateRes.status === 'fulfilled' ? { success: ultimateRes.value.data?.success } : { reason: ultimateRes.reason },
        });

        const results: SimulationResults = {};
        // 🔧 마이그레이션: generate-optimization 응답 구조 처리
        if (layoutRes.status === 'fulfilled' && layoutRes.value.data) {
          const layoutData = layoutRes.value.data;

          // 🔍 DEBUG: 응답 구조 상세 로깅
          console.log('[useSceneSimulation] 📦 layoutData FULL structure:', JSON.stringify({
            keys: Object.keys(layoutData),
            success: layoutData.success,
            hasResult: !!layoutData.result,
            resultKeys: layoutData.result ? Object.keys(layoutData.result) : [],
            hasVisualization: !!layoutData.visualization,
            visualizationKeys: layoutData.visualization ? Object.keys(layoutData.visualization) : [],
          }));

          // 🔧 FIX: generate-optimization 응답 구조: { success, result: { furniture_changes, ... }, visualization: { layout: { furnitureMoves, ... } } }
          // 여러 경로에서 데이터 추출 시도
          const furnitureChanges = layoutData.result?.furniture_changes ||
                                   layoutData.furniture_changes ||
                                   layoutData.result?.layoutChanges || [];
          const productPlacements = layoutData.result?.product_changes ||
                                    layoutData.product_changes ||
                                    layoutData.result?.productPlacements || [];

          // 🆕 visualization.layout에서 직접 가져오기 (fallback)
          const vizFurnitureMoves = layoutData.visualization?.layout?.furnitureMoves || [];
          const vizProductMoves = layoutData.visualization?.layout?.productMoves || [];

          console.log('[useSceneSimulation] 📊 Extracted counts:', {
            furnitureChanges: furnitureChanges.length,
            productPlacements: productPlacements.length,
            vizFurnitureMoves: vizFurnitureMoves.length,
            vizProductMoves: vizProductMoves.length,
          });

          // furnitureMoves 형식으로 변환 (generateLayoutOptimizedScene 호환)
          // 🔧 FIX: Edge Function 실제 필드명에 맞게 매핑 수정
          // 우선순위: result.furniture_changes > visualization.layout.furnitureMoves
          const furnitureMoves = furnitureChanges.length > 0
            ? furnitureChanges.map((change: any) => ({
                furnitureId: change.furniture_id || change.entity_id || change.id,
                furnitureName: change.furniture_label || change.furniture_type || change.entity_label || change.name,
                fromPosition: change.current?.position || change.current_position || change.currentPosition,
                toPosition: change.suggested?.position || change.suggested_position || change.suggestedPosition || change.new_position,
                reason: change.reason || change.optimization_reason,
                rotation: change.suggested?.rotation?.y || change.rotation,
              }))
            : vizFurnitureMoves.map((move: any) => ({
                furnitureId: move.furnitureId || move.furniture_id,
                furnitureName: move.furnitureName || move.furnitureCode || move.furniture_name,
                fromPosition: move.from || move.fromPosition,
                toPosition: move.to || move.toPosition,
                reason: move.reason,
                rotation: move.rotation,
              }));

          // 🆕 productPlacements 형식으로 변환 (LayoutOptimizationOverlay 호환)
          // Edge Function은 snake_case 반환, 프론트엔드는 camelCase 기대
          const mappedProductPlacements = productPlacements.length > 0
            ? productPlacements.map((change: any) => ({
                productId: change.product_id || change.productId || change.id,
                productSku: change.sku || change.productSku || change.product_sku,
                productName: change.product_name || change.productName,
                // from 정보
                fromZoneId: change.current?.zone_id || change.currentZoneId || change.from_zone_id,
                fromFurnitureId: change.current?.furniture_id || change.currentFurnitureId || change.from_furniture_id,
                fromSlotId: change.current?.slot_id || change.currentSlotId || change.from_slot_id,
                fromPosition: change.current?.position || change.currentPosition || change.from_position,
                // to 정보
                toZoneId: change.suggested?.zone_id || change.suggestedZoneId || change.to_zone_id,
                toFurnitureId: change.suggested?.furniture_id || change.suggestedFurnitureId || change.to_furniture_id,
                toSlotId: change.suggested?.slot_id || change.suggestedSlotId || change.to_slot_id,
                toPosition: change.suggested?.position || change.suggestedPosition || change.to_position,
                // 기타 정보
                reason: change.reason || change.optimization_reason,
                priority: change.priority || 'medium',
                expectedRevenueImpact: change.expected_revenue_impact || change.expectedRevenueImpact || 0,
                expectedVisibilityImpact: change.expected_visibility_impact || change.expectedVisibilityImpact || 0,
              }))
            : vizProductMoves.map((move: any) => ({
                productId: move.productId || move.product_id,
                productSku: move.productSku || move.product_sku,
                productName: move.productName || move.product_name,
                fromPosition: move.from?.position || move.fromPosition || move.from,
                toPosition: move.to?.position || move.toPosition || move.to,
                fromFurnitureId: move.from?.furnitureId || move.fromFurnitureId,
                toFurnitureId: move.to?.furnitureId || move.toFurnitureId,
                reason: move.reason,
                priority: move.priority || 'medium',
              }));

          console.log('[useSceneSimulation] 📦 Product placements mapped:', {
            originalCount: productPlacements.length,
            mappedCount: mappedProductPlacements.length,
            firstMapped: mappedProductPlacements[0],
          });

          // 🔧 FIX: summary 필드 올바른 매핑 (소수점 → 퍼센트 변환)
          // Edge Function 응답: { result: { summary: {...} } }
          const summaryData = layoutData.summary || layoutData.result?.summary || {};
          const revenueImprovement = summaryData.expected_revenue_improvement || 0;
          const trafficImprovement = summaryData.expected_traffic_improvement || 0;
          const conversionImprovement = summaryData.expected_conversion_improvement || 0;

          // 소수점이면 100을 곱해 퍼센트로 변환 (0.08 → 8)
          const toPercent = (val: number) => val < 1 ? val * 100 : val;

          // 🔧 FIX: LayoutResult 인터페이스에 맞게 최상위 레벨에도 값 추가
          const revenueIncreaseValue = toPercent(revenueImprovement);
          const dwellTimeIncreaseValue = toPercent(summaryData.expected_dwell_time_improvement || 0);
          const conversionIncreaseValue = toPercent(conversionImprovement);

          results.layout = {
            // 필수 속성
            id: `layout-${Date.now()}`,
            status: 'completed',
            timestamp: new Date().toISOString(),
            expectedROI: revenueIncreaseValue,
            zoneChanges: [],
            confidence: {
              overall: summaryData.confidence || 0.8,
              factors: {
                dataQuality: 0.8,
                modelAccuracy: summaryData.confidence || 0.8,
                sampleSize: 0.7,
                variability: 0.75,
                slotDataAvailable: 0.6,
              },
            },
            // 기존 속성
            furnitureMoves,
            layoutChanges: furnitureChanges.length > 0 ? furnitureChanges : vizFurnitureMoves,
            productPlacements: mappedProductPlacements,
            optimizationSummary: {
              totalChanges: furnitureMoves.length + mappedProductPlacements.length,
              expectedRevenueIncrease: toPercent(revenueImprovement),
              expectedConversionIncrease: toPercent(conversionImprovement),
              confidence: summaryData.confidence || 0.8,
            },
            insights: layoutData.insights || layoutData.result?.insights || summaryData.insights || [],
            // 효율성 점수 계산 (변경 수 기반)
            currentEfficiency: summaryData.current_efficiency || 70,
            optimizedEfficiency: summaryData.optimized_efficiency ||
              Math.min(95, 70 + (furnitureMoves.length * 2) + (mappedProductPlacements.length * 0.5)),
            // 🔧 FIX: LayoutResult 인터페이스 호환을 위해 최상위 레벨에 추가
            revenueIncrease: revenueIncreaseValue,
            dwellTimeIncrease: dwellTimeIncreaseValue,
            conversionIncrease: conversionIncreaseValue,
            // 기존 improvements 객체도 유지 (하위 호환)
            improvements: {
              revenueIncrease: revenueIncreaseValue,
              revenueIncreasePercent: revenueIncreaseValue,
              dwellTimeIncrease: dwellTimeIncreaseValue,
              conversionIncrease: conversionIncreaseValue,
              trafficIncrease: toPercent(trafficImprovement),
            },
            // 🔧 FIX: visualization 필수 속성 추가
            visualization: {
              beforeHeatmap: [],
              afterHeatmap: [],
              flowPaths: [],
              highlightZones: furnitureMoves.map((move: any, idx: number) => ({
                zoneId: move.furnitureId || `zone-${idx}`,
                position: move.toPosition || move.suggestedPosition,
                color: '#4ade80',
                opacity: 0.6,
                type: 'furniture',
                changeType: 'suggested' as const,
              })),
            },
          } as LayoutSimulationResult;
          console.log('[useSceneSimulation] ✅ Layout result (generate-optimization):', {
            furnitureMovesCount: furnitureMoves.length,
            productPlacementsCount: mappedProductPlacements.length,
            usedVisualizationFallback: furnitureChanges.length === 0 && vizFurnitureMoves.length > 0,
            summaryData: {
              revenue: toPercent(revenueImprovement),
              traffic: toPercent(trafficImprovement),
              conversion: toPercent(conversionImprovement),
            },
            firstFurnitureMove: furnitureMoves[0],
            firstProductPlacement: mappedProductPlacements[0],
          });
        } else {
          console.warn('[useSceneSimulation] No layout result:', layoutRes);
        }
        if (flowRes.status === 'fulfilled' && flowRes.value.data?.result) {
          const flowResult = flowRes.value.data.result;
          // 🔧 FIX: visualization 데이터가 없으면 기본값 생성
          results.flow = {
            ...flowResult,
            visualization: flowResult.visualization || {
              flowHeatmap: [],
              zoneFlowArrows: (flowResult.bottlenecks || []).map((bn: any, idx: number) => ({
                from: { x: bn.position?.x || 0, z: bn.position?.z || -5 },
                to: { x: (bn.position?.x || 0) + 2, z: (bn.position?.z || 0) + 2 },
                intensity: bn.severity || 0.5,
              })),
            },
            paths: flowResult.paths || [],
            bottlenecks: flowResult.bottlenecks || [],
          };
          console.log('[useSceneSimulation] Flow result extracted with visualization:', {
            hasVisualization: !!results.flow.visualization,
            hasZoneFlowArrows: !!results.flow.visualization?.zoneFlowArrows?.length,
            pathsCount: results.flow.paths?.length,
            bottlenecksCount: results.flow.bottlenecks?.length,
          });
        } else {
          console.warn('[useSceneSimulation] No flow result:', flowRes);
        }
        if (staffingRes.status === 'fulfilled' && staffingRes.value.data) {
          const staffingData = staffingRes.value.data;

          // 🔍 DEBUG: 실제 응답 구조 확인
          console.log('[useSceneSimulation] 🔍 staffingData:', staffingData);
          console.log('[useSceneSimulation] 🔍 staffingData.staffing_result:', staffingData?.staffing_result);

          // 🔧 마이그레이션: generate-optimization 응답 구조 처리
          // generate-optimization staffing 타입: { staffing_result: {...} }
          const staffingResult = staffingData?.staffing_result ||
                                 staffingData?.result?.staffing_result ||
                                 staffingData?.visualization?.staffing ||
                                 staffingData?.result ||
                                 staffingData;
          
          console.log('[useSceneSimulation] 🔍 resolved staffingResult:', staffingResult);

          if (staffingResult && (staffingResult.staffPositions || staffingResult.staffMarkers || staffingResult.metrics || staffingResult.zoneCoverage || staffingResult.coverageZones)) {
            // staffMarkers를 staffPositions로 변환
            const staffPositions = staffingResult.staffPositions ||
                            staffingResult.staffMarkers ||
                            staffingResult.staff_positions ||
                            staffingResult.positions ||
                            [];
            
            // 🔧 FIX: staffPositions가 0개면 빈 결과 처리 (임의 데이터 생성 안 함)
            if (staffPositions.length === 0) {
              console.log('[useSceneSimulation] No staff positions found - skipping staffing visualization');
              results.staffing = {
                ...staffingResult,
                staffPositions: [],
                zoneCoverage: staffingResult.zoneCoverage || [],
                metrics: staffingResult.metrics || {
                  currentCoverage: 0,
                  optimizedCoverage: 0,
                  customerServiceRateIncrease: 0,
                  avgResponseTimeReduction: 0,
                  efficiencyScore: 0,
                },
                visualization: {
                  heatmap: [],
                  coverageZones: [],
                  movementPaths: [],
                  staffMarkers: [],
                },
              };
            } else {
              // 🔧 FIX: visualization 데이터가 없으면 기본값 생성
              // 🆕 모든 컴포넌트 호환을 위한 통합 구조 생성

              // ========== 1. 기본 메트릭 추출 ==========
              // 🔧 FIX: Edge Function 실제 필드명에 맞게 매핑
              // Edge Function: { totalCoverage, coverageGain, customerServiceRateIncrease }
              const metrics = staffingResult.metrics || {};
              const totalCoverage = metrics.totalCoverage || metrics.total_coverage || 70;
              const coverageGain = metrics.coverageGain || metrics.coverage_gain || 15;

              const currentCoverage = metrics.currentCoverage || metrics.current_coverage || totalCoverage;
              const optimizedCoverage = metrics.optimizedCoverage || metrics.optimized_coverage ||
                                        Math.min(100, totalCoverage + coverageGain);
              const customerServiceRateIncrease = metrics.customerServiceRateIncrease ||
                                                   metrics.customer_service_rate_increase || 12;
              const avgResponseTimeReduction = metrics.avgResponseTimeReduction ||
                                               metrics.avg_response_time_reduction ||
                                               (metrics.avgResponseTime ? metrics.avgResponseTime * 0.2 : 8);

              console.log('[useSceneSimulation] 📊 Staffing metrics extracted:', {
                rawMetrics: metrics,
                mapped: { currentCoverage, optimizedCoverage, coverageGain, customerServiceRateIncrease },
                staffPositionsCount: staffPositions.length,
              });

              // ========== 2. 재배치가 필요한 직원 필터링 ==========
              // 🔧 FIX: 실제 위치 변경이 필요한 직원만 필터링
              const isStaffReallocated = (sp: any) => {
                const curr = sp.currentPosition || sp.current_position;
                const sugg = sp.suggestedPosition || sp.suggested_position;
                // 위치 정보가 없거나, 제안된 위치가 현재 위치와 유의미하게 다른 경우 재배치 필요
                if (!curr || !sugg) return false; // 위치 정보 없으면 재배치 불필요로 처리
                const distanceX = Math.abs((curr.x || 0) - (sugg.x || 0));
                const distanceZ = Math.abs((curr.z || 0) - (sugg.z || 0));
                // 최소 1m 이상 이동하는 경우만 재배치로 간주
                return distanceX > 1 || distanceZ > 1;
              };

              const reallocatedStaff = staffPositions.filter(isStaffReallocated);
              const reallocatedCount = reallocatedStaff.length;

              console.log('[useSceneSimulation] 🚶 Staff reallocation filter:', {
                totalStaff: staffPositions.length,
                reallocatedCount,
                filteredOut: staffPositions.length - reallocatedCount,
              });

              // ========== 3. visualization 구성 ==========
              const visualization = staffingResult.visualization || {
                heatmap: [],
                coverageZones: (staffingResult.zoneCoverage || []).map((zone: any) => ({
                  zoneId: zone.zoneId || zone.zone_id,
                  zoneName: zone.zoneName || zone.zone_name,
                  currentCoverage: zone.currentCoverage || zone.current_coverage || 0.5,
                  suggestedCoverage: zone.suggestedCoverage || zone.suggested_coverage || 0.8,
                  center: { x: zone.centerX || 0, y: 0, z: zone.centerZ || 0 },
                  radius: zone.radius || 3,
                })),
                // 🔧 FIX: 재배치가 필요한 직원만 이동 경로 표시
                movementPaths: reallocatedStaff.map((sp: any) => ({
                  staffId: sp.staffId || sp.staff_id,
                  from: sp.currentPosition || sp.current_position || { x: 0, y: 0, z: 0 },
                  to: sp.suggestedPosition || sp.suggested_position || { x: 2, y: 0, z: 2 },
                })),
                // 전체 직원 마커는 유지 (현재 위치 표시용)
                staffMarkers: staffPositions.map((sp: any) => ({
                  id: sp.staffId || sp.staff_id,
                  name: sp.staffName || sp.staff_name || '직원',
                  role: sp.role || 'sales',
                  currentPosition: sp.currentPosition || sp.current_position || { x: 0, y: 0, z: 0 },
                  suggestedPosition: sp.suggestedPosition || sp.suggested_position || { x: 2, y: 0, z: 2 },
                  // 🆕 재배치 필요 여부 플래그 추가
                  needsReallocation: isStaffReallocated(sp),
                })),
              };

              // ========== 4. 통합 결과 구성 ==========
              results.staffing = {
                // 원본 데이터 유지
                ...staffingResult,

                // ===== StaffingOverlay용 (기존 구조 유지) =====
                staffPositions,
                zoneCoverage: staffingResult.zoneCoverage || [],
                metrics: {
                  currentCoverage,
                  optimizedCoverage,
                  customerServiceRateIncrease,
                  avgResponseTimeReduction,
                  efficiencyScore: staffingResult.metrics?.efficiencyScore || 78,
                  coverageGain: optimizedCoverage - currentCoverage,
                  avgResponseTime: staffingResult.metrics?.avgResponseTime || 45,
                },
                visualization,

                // ===== ResultReportPanel용 (StaffingResult 타입 호환) =====
                currentCoverage,
                optimizedCoverage,
                staffCount: staffPositions.length,
                improvements: [
                  { metric: '고객 응대율', value: `+${Math.round(customerServiceRateIncrease * 100)}%` },
                  { metric: '대기 시간', value: `-${Math.round(avgResponseTimeReduction * 100)}%` },
                  { metric: '커버리지', value: `+${Math.round(optimizedCoverage - currentCoverage)}%` },
                ],

                // ===== StaffOptimizationResultPanel용 (StaffOptimizationResult 타입 호환) =====
                summary: {
                  total_staff: staffPositions.length,
                  reallocated_count: reallocatedCount,
                  efficiency_before: currentCoverage,
                  efficiency_after: optimizedCoverage,
                  efficiency_change: optimizedCoverage - currentCoverage,
                },
                // 🔧 FIX: 재배치가 필요한 직원만 reallocations에 포함
                reallocations: reallocatedStaff.map((sp: any, idx: number) => ({
                  staff_id: sp.staffId || sp.staff_id || `staff-${idx}`,
                  staff_code: sp.staffCode || sp.staff_code || `STAFF-${String(idx + 1).padStart(3, '0')}`,
                  staff_name: sp.staffName || sp.staff_name || sp.name || `직원 ${idx + 1}`,
                  role: sp.role || 'sales',
                  from_zone_id: sp.currentZoneId || sp.current_zone_id || 'zone-current',
                  from_zone_name: sp.currentZone || sp.current_zone || sp.currentZoneName || '현재 구역',
                  from_position: sp.currentPosition || sp.current_position || { x: 0, y: 0, z: 0 },
                  to_zone_id: sp.suggestedZoneId || sp.suggested_zone_id || 'zone-suggested',
                  to_zone_name: sp.suggestedZone || sp.suggested_zone || sp.suggestedZoneName || '추천 구역',
                  to_position: sp.suggestedPosition || sp.suggested_position || { x: 0, y: 0, z: 0 },
                  reason: sp.reason || sp.suggestion || '최적 고객 응대 위치로 재배치',
                  priority: sp.priority || (sp.coverageGain > 10 ? 'high' : sp.coverageGain > 5 ? 'medium' : 'low'),
                  expected_impact: {
                    coverage_change_pct: sp.coverageGain || sp.coverage_gain || 5,
                    response_time_change_sec: sp.responseTimeChange || sp.response_time_change || -10,
                    customers_served_change: sp.customersServedChange || sp.customers_served_change || 2,
                  },
                })),
                overall_impact: {
                  customer_response_rate_change: Math.round(customerServiceRateIncrease * 100),
                  wait_time_change: -Math.round(avgResponseTimeReduction * 100),
                  coverage_change: Math.round(optimizedCoverage - currentCoverage),
                  peak_hour_coverage: optimizedCoverage,
                },
                insights: staffingResult.insights || staffingResult.aiInsights || [
                  '피크 시간대 입구 구역 인력 보강을 권장합니다',
                  '피팅룸 대기시간 단축을 위한 전담 인력 배치가 효과적입니다',
                  '계산대 혼잡 시간에 맞춘 유동적 인력 운영을 권장합니다',
                ],
                confidence: typeof staffingResult.confidence === 'object'
                  ? (staffingResult.confidence as any)?.overall || 0.82
                  : staffingResult.confidence || 0.82,
              };
            }
            console.log('[useSceneSimulation] ✅ Staffing result extracted (all formats):', {
              // StaffingOverlay용
              positionsCount: results.staffing.staffPositions?.length || 0,
              hasVisualization: !!results.staffing.visualization,
              // ResultReportPanel용
              currentCoverage: (results.staffing as any).currentCoverage,
              optimizedCoverage: (results.staffing as any).optimizedCoverage,
              staffCount: (results.staffing as any).staffCount,
              improvementsCount: (results.staffing as any).improvements?.length || 0,
              // StaffOptimizationResultPanel용
              hasSummary: !!(results.staffing as any).summary,
              reallocationsCount: (results.staffing as any).reallocations?.length || 0,
              hasOverallImpact: !!(results.staffing as any).overall_impact,
              insightsCount: results.staffing.insights?.length || 0,
              confidence: results.staffing.confidence,
            });
          } else {
            console.warn('[useSceneSimulation] Staffing data structure unknown:', staffingData);
          }
        } else {
          console.warn('[useSceneSimulation] No staffing result:', staffingRes);
        }

        // 🆕 Ultimate 분석 결과 처리
        if (ultimateRes.status === 'fulfilled' && ultimateRes.value.data?.success) {
          const ultimateData = ultimateRes.value.data as UltimateOptimizationResponse;
          console.log('[useSceneSimulation] 🎯 Ultimate analysis received:', {
            hasFlowAnalysis: !!ultimateData.flow_analysis_summary,
            hasVMD: !!ultimateData.vmd_analysis,
            hasEnvironment: !!ultimateData.environment_summary,
            hasAssociation: !!ultimateData.association_summary,
            hasPrediction: !!ultimateData.prediction_summary,
          });

          results.ultimateAnalysis = {
            flowAnalysis: ultimateData.flow_analysis_summary,
            environment: ultimateData.environment_summary,
            association: ultimateData.association_summary,
            prediction: ultimateData.prediction_summary,
            conversionPrediction: ultimateData.conversion_prediction_summary,
            vmd: ultimateData.vmd_analysis,
            learningSession: ultimateData.learning_session,
            overallConfidence: ultimateData.prediction_summary?.overall_confidence ?? 75,
          };
        } else {
          console.warn('[useSceneSimulation] No Ultimate analysis result:', ultimateRes);
        }

        // 통합 To-be 씬 생성
        console.log('[useSceneSimulation] 📊 Results before comparison:', {
          hasLayout: !!results.layout,
          hasFlow: !!results.flow,
          hasStaffing: !!results.staffing,
          hasUltimate: !!results.ultimateAnalysis,
          targetSceneExists: !!targetScene,
        });

        const comparison = generateCombinedOptimizedScene(targetScene, results);
        console.log('[useSceneSimulation] ✅ Comparison generated:', {
          totalChanges: comparison?.summary?.totalChanges,
          hasToBeScene: !!comparison?.toBe,
        });

        setState((prev) => ({
          ...prev,
          results,
          toBeScene: comparison.toBe,
          comparison,
        }));

        toast({
          title: '전체 시뮬레이션 완료',
          description: `${comparison.summary.totalChanges}개의 최적화 제안이 생성되었습니다.`,
        });

        return results;
      } catch (err) {
        console.error('[useSceneSimulation] ❌ Error in runAllSimulations:', err);
        setError(err as Error);
        toast({
          title: '시뮬레이션 실패',
          description: err instanceof Error ? err.message : '알 수 없는 오류',
          variant: 'destructive',
        });
        return {};
      } finally {
        setIsSimulating(false);
      }
    },
    [state.asIsScene, selectedStore?.id, orgId, toast]
  );

  // 비교 결과 가져오기
  const getComparison = useCallback(() => state.comparison, [state.comparison]);

  // 변경 사항 가져오기
  const getChanges = useCallback(() => state.comparison?.changes || [], [state.comparison]);

  // 변경 선택/해제
  const selectChange = useCallback((changeId: string) => {
    setState((prev) => ({
      ...prev,
      selectedChanges: [...prev.selectedChanges, changeId],
    }));
  }, []);

  const deselectChange = useCallback((changeId: string) => {
    setState((prev) => ({
      ...prev,
      selectedChanges: prev.selectedChanges.filter((id) => id !== changeId),
    }));
  }, []);

  const selectAllChanges = useCallback(() => {
    setState((prev) => ({
      ...prev,
      selectedChanges: prev.comparison?.changes.map((c) => c.id) || [],
    }));
  }, []);

  const deselectAllChanges = useCallback(() => {
    setState((prev) => ({ ...prev, selectedChanges: [] }));
  }, []);

  // 선택된 변경 적용
  const applySelectedChanges = useCallback(async (): Promise<SceneRecipe> => {
    if (!state.asIsScene || !state.toBeScene) {
      throw new Error('씬이 없습니다.');
    }

    const merged = mergeToBeIntoAsIs(
      state.asIsScene,
      state.toBeScene,
      state.selectedChanges
    );

    setState((prev) => ({
      ...prev,
      asIsScene: merged,
      toBeScene: null,
      comparison: null,
      selectedChanges: [],
    }));

    toast({
      title: '변경 적용 완료',
      description: `${state.selectedChanges.length}개의 변경이 적용되었습니다.`,
    });

    return merged;
  }, [state, toast]);

  // 전체 변경 적용
  const applyAllChanges = useCallback(async (): Promise<SceneRecipe> => {
    if (!state.toBeScene) {
      throw new Error('To-be 씬이 없습니다.');
    }

    setState((prev) => ({
      ...prev,
      asIsScene: prev.toBeScene,
      toBeScene: null,
      comparison: null,
      selectedChanges: [],
    }));

    toast({
      title: '전체 변경 적용 완료',
    });

    return state.toBeScene;
  }, [state.toBeScene, toast]);

  // 뷰 모드 변경
  const setViewMode = useCallback((mode: SceneSimulationState['viewMode']) => {
    setState((prev) => ({ ...prev, viewMode: mode }));
  }, []);

  // To-be 씬 저장
  const saveToBeSceneMutation = useMutation({
    mutationFn: async (name: string) => {
      if (!state.toBeScene || !user?.id || !selectedStore?.id) {
        throw new Error('저장할 씬이 없습니다.');
      }

      const { error } = await supabase.from('store_scenes').insert([{
        user_id: user.id,
        org_id: user.id,
        store_id: selectedStore.id,
        scene_name: name,
        recipe_data: state.toBeScene as any,
        is_active: false,
      }]);

      if (error) throw error;
    },
    onSuccess: (_, name) => {
      toast({
        title: 'To-be 씬 저장 완료',
        description: `"${name}" 씬이 저장되었습니다.`,
      });
    },
    onError: (err) => {
      toast({
        title: '씬 저장 실패',
        description: err instanceof Error ? err.message : '오류가 발생했습니다.',
        variant: 'destructive',
      });
    },
  });

  const saveToBeScene = useCallback(
    async (name: string) => {
      await saveToBeSceneMutation.mutateAsync(name);
    },
    [saveToBeSceneMutation]
  );

  return {
    state,
    isSimulating,
    error,

    setAsIsScene,
    clearScenes,

    runSimulation,
    runAllSimulations,

    getComparison,
    getChanges,

    selectChange,
    deselectChange,
    selectAllChanges,
    deselectAllChanges,
    applySelectedChanges,
    applyAllChanges,

    setViewMode,
    saveToBeScene,
  };
}

export default useSceneSimulation;
