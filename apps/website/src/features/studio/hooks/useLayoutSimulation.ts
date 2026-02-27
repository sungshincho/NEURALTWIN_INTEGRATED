/**
 * useLayoutSimulation.ts
 *
 * 레이아웃 최적화 시뮬레이션 훅
 * - AI 기반 가구/상품 배치 최적화
 * - generate-optimization Edge Function 연동
 * - 3D 시각화용 데이터 제공
 *
 * 🆕 마이그레이션 (2026-01):
 * - advanced-ai-inference (deprecated) → generate-optimization (both 타입)
 */

import { useState, useCallback } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useSelectedStore } from '@/hooks/useSelectedStore';
import { useToast } from '@/components/ui/use-toast';
import { buildStoreContext } from '../utils/store-context-builder';
import type {
  LayoutOptimizationResult,
  FurnitureMove,
  ZoneChange,
  SimulationStatus,
  ConfidenceDetails,
  ProductPlacement,
} from '../types';

// ============================================================================
// 타입 정의
// ============================================================================

export interface LayoutSimulationParams {
  goal: 'revenue' | 'dwell_time' | 'traffic';
  constraints?: {
    fixedFurniture?: string[];
    maxMoves?: number;
    preserveZones?: string[];
  };
  analysisDepth?: 'quick' | 'standard' | 'deep';
}

export interface LayoutSimulationResult {
  id: string;
  status: SimulationStatus;
  timestamp: string;
  params: LayoutSimulationParams;

  // 메트릭
  currentEfficiency: number;
  optimizedEfficiency: number;
  expectedROI: number;

  // 예상 개선 효과
  improvements: {
    revenueIncrease: number;
    revenueIncreasePercent: number;
    dwellTimeIncrease: number;
    conversionIncrease: number;
    trafficIncrease: number;
  };

  // 변경 사항
  furnitureMoves: FurnitureMove[];
  zoneChanges: ZoneChange[];

  // 🆕 상품 재배치 제안
  productPlacements: ProductPlacement[];

  // 신뢰도
  confidence: ConfidenceDetails;

  // AI 인사이트
  insights: string[];
  warnings?: string[];

  // 3D 시각화 데이터
  visualization: {
    beforeHeatmap: Array<{ x: number; z: number; intensity: number }>;
    afterHeatmap: Array<{ x: number; z: number; intensity: number }>;
    flowPaths: Array<{
      id: string;
      points: Array<{ x: number; y: number; z: number }>;
      type: 'current' | 'optimized';
    }>;
    highlightZones: Array<{
      zoneId: string;
      color: string;
      opacity: number;
      changeType: 'improved' | 'degraded' | 'new' | 'removed' | 'suggested';
    }>;
  };
}

export interface UseLayoutSimulationReturn {
  // 상태
  isSimulating: boolean;
  result: LayoutSimulationResult | null;
  error: Error | null;
  progress: number;

  // 액션
  runSimulation: (params: LayoutSimulationParams) => Promise<LayoutSimulationResult>;
  applyChanges: () => Promise<void>;
  resetResult: () => void;

  // 3D 시각화 데이터
  getVisualizationData: () => LayoutSimulationResult['visualization'] | null;

  // 히스토리
  history: LayoutSimulationResult[];
  loadHistory: () => Promise<void>;
}

// ============================================================================
// 훅 구현
// ============================================================================

export function useLayoutSimulation(): UseLayoutSimulationReturn {
  const { orgId } = useAuth();
  const { selectedStore } = useSelectedStore();
  const { toast } = useToast();

  const [result, setResult] = useState<LayoutSimulationResult | null>(null);
  const [progress, setProgress] = useState(0);
  const [history, setHistory] = useState<LayoutSimulationResult[]>([]);

  // 시뮬레이션 히스토리 조회
  const { refetch: fetchHistory } = useQuery<any[], Error, any[], string[]>({
    queryKey: ['layout-simulation-history', selectedStore?.id || ''],
    queryFn: async () => {
      if (!selectedStore?.id) return [] as any[];

      const { data } = await supabase
        .from('ai_inference_results')
        .select('*')
        .eq('store_id', selectedStore.id)
        .eq('inference_type', 'layout_optimization')
        .order('created_at', { ascending: false })
        .limit(10);

      return (data || []) as any[];
    },
    enabled: false,
  });

  // 시뮬레이션 실행 mutation
  const simulationMutation = useMutation({
    mutationFn: async (params: LayoutSimulationParams): Promise<LayoutSimulationResult> => {
      if (!selectedStore?.id || !orgId) {
        throw new Error('매장 또는 조직 정보가 없습니다.');
      }

      setProgress(10);

      // 실제 매장 데이터 기반 storeContext 빌드
      console.log('[useLayoutSimulation] Building store context for:', selectedStore.id);
      const storeContext = await buildStoreContext(selectedStore.id);
      console.log('[useLayoutSimulation] Store context built:', {
        dailySales: storeContext.dailySales?.length,
        visits: storeContext.visits?.length,
        zones: storeContext.zones?.length,
        zoneMetrics: storeContext.zoneMetrics?.length,
        dataQuality: storeContext.dataQuality,
      });

      setProgress(30);

      // 🆕 generate-optimization Edge Function 호출 (both 타입)
      // 마이그레이션: advanced-ai-inference (deprecated) → generate-optimization
      const { data, error } = await supabase.functions.invoke('generate-optimization', {
        body: {
          store_id: selectedStore.id,
          optimization_type: 'both', // 가구 + 상품 통합 최적화
          parameters: {
            prioritize_revenue: params.goal === 'revenue',
            prioritize_visibility: params.goal === 'dwell_time',
            prioritize_accessibility: params.goal === 'traffic',
            max_changes: params.constraints?.maxMoves,
            fixed_furniture_ids: params.constraints?.fixedFurniture,
            preserve_zone_ids: params.constraints?.preserveZones,
          },
        },
      });

      setProgress(80);

      if (error) throw error;
      if (!data) throw new Error('최적화 결과를 받지 못했습니다.');

      // 결과 변환 (generate-optimization 결과 구조에 맞춤)
      // generate-optimization은 furniture_changes, product_changes 필드 사용
      const normalizedResult = {
        layoutChanges: data.furniture_changes || [],
        productPlacements: data.product_changes || [],
        zoneChanges: [],
        optimizationSummary: data.summary || {},
        confidence: data.summary?.overall_confidence || 0.7,
        insights: data.ai_insights || [],
      };
      const simulationResult = transformLayoutResult(normalizedResult, params);

      setProgress(100);

      return simulationResult;
    },
    onSuccess: (data) => {
      setResult(data);
      toast({
        title: '레이아웃 최적화 완료',
        description: `예상 매출 증가: +${data.improvements.revenueIncreasePercent.toFixed(1)}%`,
      });
    },
    onError: (error) => {
      console.error('Layout simulation failed:', error);
      toast({
        title: '시뮬레이션 실패',
        description: error instanceof Error ? error.message : '잠시 후 다시 시도해주세요.',
        variant: 'destructive',
      });
    },
    onSettled: () => {
      setProgress(0);
    },
  });

  // 변경 사항 적용
  const applyChangesMutation = useMutation({
    mutationFn: async () => {
      if (!result || !selectedStore?.id) {
        throw new Error('적용할 결과가 없습니다.');
      }

      // 가구 위치 업데이트
      for (const move of result.furnitureMoves) {
        await supabase
          .from('furniture')
          .update({
            position: move.toPosition,
            rotation: move.rotation || 0,
            updated_at: new Date().toISOString(),
          })
          .eq('id', move.furnitureId);
      }

      // 존 변경 적용
      for (const zoneChange of result.zoneChanges) {
        if (zoneChange.changeType === 'resize' || zoneChange.changeType === 'move') {
          await supabase
            .from('zones')
            .update({
              bounds: zoneChange.after,
              updated_at: new Date().toISOString(),
            })
            .eq('id', zoneChange.zoneId);
        }
      }

      // 🆕 상품 배치 변경 적용
      for (const productMove of result.productPlacements) {
        if (productMove.toSlotId && productMove.toFurnitureId) {
          // 기존 슬롯에서 상품 제거
          if (productMove.fromSlotId) {
            await supabase
              .from('furniture_slots')
              .update({
                occupied_by_product_id: null,
                updated_at: new Date().toISOString(),
              })
              .eq('slot_id', productMove.fromSlotId);
          }

          // 새 슬롯에 상품 배치
          await supabase
            .from('furniture_slots')
            .update({
              occupied_by_product_id: productMove.productId,
              updated_at: new Date().toISOString(),
            })
            .eq('slot_id', productMove.toSlotId)
            .eq('furniture_id', productMove.toFurnitureId);
        }
      }

      // 적용 이력 저장
      await supabase.from('applied_strategies').insert([{
        org_id: orgId,
        store_id: selectedStore.id,
        name: 'Layout Optimization',
        source: 'ai_simulation',
        source_module: 'layout',
        expected_roi: result.expectedROI,
        start_date: new Date().toISOString(),
        end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        settings: result as any,
      }]);
    },
    onSuccess: () => {
      toast({
        title: '레이아웃 변경 적용됨',
        description: '3D 뷰에서 변경된 배치를 확인하세요.',
      });
    },
    onError: (error) => {
      console.error('Apply changes failed:', error);
      toast({
        title: '변경 적용 실패',
        description: '잠시 후 다시 시도해주세요.',
        variant: 'destructive',
      });
    },
  });

  // 시뮬레이션 실행
  const runSimulation = useCallback(async (params: LayoutSimulationParams) => {
    return simulationMutation.mutateAsync(params);
  }, [simulationMutation]);

  // 변경 적용
  const applyChanges = useCallback(async () => {
    await applyChangesMutation.mutateAsync();
  }, [applyChangesMutation]);

  // 결과 초기화
  const resetResult = useCallback(() => {
    setResult(null);
    setProgress(0);
  }, []);

  // 시각화 데이터 가져오기
  const getVisualizationData = useCallback(() => {
    return result?.visualization || null;
  }, [result]);

  // 히스토리 로드
  const loadHistory = useCallback(async () => {
    const { data } = await fetchHistory();
    if (data) {
      setHistory(data.map(transformHistoryItem));
    }
  }, [fetchHistory]);

  return {
    isSimulating: simulationMutation.isPending,
    result,
    error: simulationMutation.error as Error | null,
    progress,

    runSimulation,
    applyChanges,
    resetResult,

    getVisualizationData,

    history,
    loadHistory,
  };
}

// ============================================================================
// 헬퍼 함수
// ============================================================================

function transformLayoutResult(
  rawResult: any,
  params: LayoutSimulationParams
): LayoutSimulationResult {
  // AI 응답을 LayoutSimulationResult 형식으로 변환
  // 🔧 FIX: furnitureMoves 필드도 확인 (smart layout handler는 furnitureMoves 반환)
  const furnitureMoves: FurnitureMove[] = (
    rawResult.layoutChanges || rawResult.furnitureMoves || rawResult.changes || []
  ).map(
    (change: any, idx: number) => ({
      furnitureId: change.id || change.entityId || `furniture-${idx}`,
      furnitureName: change.item || change.name || change.entityLabel || `가구 ${idx + 1}`,
      fromPosition: change.from || change.currentPosition || { x: 0, y: 0, z: 0 },
      toPosition: change.to || change.suggestedPosition || { x: 0, y: 0, z: 0 },
      rotation: change.rotation,
    })
  );

  console.log('[useLayoutSimulation] Extracted furniture moves:', furnitureMoves.length);

  const zoneChanges: ZoneChange[] = (rawResult.zoneChanges || []).map(
    (change: any, idx: number) => {
      const zoneId =
        change.zoneId ||
        change.zone_id ||
        change.zoneName ||
        change.zone_name ||
        change.zoneType ||
        change.zone_type ||
        `zone-${idx}`;

      return {
        zoneId: String(zoneId),
        zoneName: change.zoneName || change.zone_name || `존 ${idx + 1}`,
        changeType: change.changeType || change.change_type || 'resize',
        before: change.before || {},
        after: change.after || {},
      };
    }
  );

  // 🆕 상품 재배치 추출 (productPlacements, productMoves, productChanges 등 다양한 필드명 지원)
  // Edge Function에서 suggestedFurnitureId/suggestedPosition 필드도 지원
  const productPlacements: ProductPlacement[] = (
    rawResult.productPlacements ||
    rawResult.productMoves ||
    rawResult.productChanges ||
    []
  ).map((placement: any, idx: number) => ({
    productId: placement.productId || placement.product_id || `product-${idx}`,
    productSku: placement.productSku || placement.sku || '',
    productName: placement.productName || placement.product_name || placement.productLabel || `상품 ${idx + 1}`,
    displayType: placement.displayType || placement.display_type,
    fromFurnitureId: placement.fromFurnitureId || placement.from_furniture_id || placement.currentFurnitureId || null,
    fromSlotId: placement.fromSlotId || placement.from_slot_id || null,
    fromPosition: placement.fromPosition || placement.from_position || placement.currentPosition,
    fromSlotPosition: placement.fromSlotPosition || placement.from_slot_position,
    toSlotId: placement.toSlotId || placement.to_slot_id || placement.suggestedSlotId || `slot-${idx}`,
    toFurnitureId: placement.toFurnitureId || placement.to_furniture_id || placement.suggestedFurnitureId || '',
    toPosition: placement.toPosition || placement.to_position || placement.suggestedPosition,
    toSlotPosition: placement.toSlotPosition || placement.to_slot_position,
    slotType: placement.slotType || placement.slot_type,
    reason: placement.reason || placement.rationale || '매출 최적화를 위한 위치 변경',
    priority: placement.priority || 'medium',
    displayTypeMatch: placement.displayTypeMatch ?? true,
  }));

  console.log('[useLayoutSimulation] Extracted product placements:', productPlacements.length);

  // 신뢰도 정보
  const confidence: ConfidenceDetails = {
    overall: rawResult.confidence || 0.75,
    factors: {
      dataQuality: rawResult.confidenceFactors?.dataQuality || 0.8,
      modelAccuracy: rawResult.confidenceFactors?.modelAccuracy || 0.75,
      sampleSize: rawResult.confidenceFactors?.sampleSize || 0.7,
      variability: rawResult.confidenceFactors?.variability || 0.72,
    },
  };

  // 시각화 데이터 생성
  const visualization = generateVisualizationData(rawResult, furnitureMoves, zoneChanges);

  return {
    id: rawResult.id || `sim-${Date.now()}`,
    status: 'completed',
    timestamp: new Date().toISOString(),
    params,

    currentEfficiency: rawResult.currentEfficiency || 72,
    optimizedEfficiency: rawResult.optimizedEfficiency ||
      (rawResult.currentEfficiency || 72) + (rawResult.optimizationSummary?.efficiencyGain || 15),
    expectedROI: rawResult.expectedROI || rawResult.optimizationSummary?.expectedROI || 12,

    improvements: {
      revenueIncrease: rawResult.optimizationSummary?.expectedRevenueIncrease || 2400000,
      revenueIncreasePercent: rawResult.optimizationSummary?.expectedRevenueIncreasePercent ||
        ((rawResult.optimizationSummary?.expectedRevenueIncrease || 2400000) / 20000000) * 100,
      dwellTimeIncrease: rawResult.optimizationSummary?.expectedDwellTimeIncrease || 8,
      conversionIncrease: rawResult.optimizationSummary?.expectedConversionIncrease || 3.2,
      trafficIncrease: rawResult.optimizationSummary?.expectedTrafficIncrease || 5,
    },

    furnitureMoves,
    zoneChanges,
    productPlacements,
    confidence,

    insights: rawResult.insights || [
      '입구 근처 메인 테이블 이동으로 첫 노출 증가',
      '동선 교차점에 프로모션 디스플레이 배치 추천',
    ],
    warnings: rawResult.warnings,

    visualization,
  };
}

function generateVisualizationData(
  rawResult: any,
  furnitureMoves: FurnitureMove[],
  zoneChanges: ZoneChange[]
): LayoutSimulationResult['visualization'] {
  // 히트맵 데이터 생성
  const beforeHeatmap = generateHeatmapData(rawResult.heatmapBefore || null, 'before');
  const afterHeatmap = generateHeatmapData(rawResult.heatmapAfter || null, 'after');

  // 동선 경로 생성
  const flowPaths = furnitureMoves.map((move, idx) => ({
    id: `path-${idx}`,
    points: [
      { x: move.fromPosition.x, y: 0.5, z: move.fromPosition.z },
      { x: move.toPosition.x, y: 0.5, z: move.toPosition.z },
    ],
    type: 'optimized' as const,
  }));

  // 하이라이트 존 생성
  // - rawResult.zoneChanges는 provider/버전별로 zoneId 누락이 발생할 수 있어, 이미 정규화된 zoneChanges를 사용
  const highlightZones = (zoneChanges || [])
    .filter((c) => !!c.zoneId)
    .map((change) => {
      const rawType = String(change.changeType || '').toLowerCase();
      const changeType:
        | 'improved'
        | 'degraded'
        | 'new'
        | 'removed'
        | 'suggested' =
        rawType === 'improved'
          ? 'improved'
          : rawType === 'degraded'
            ? 'degraded'
            : rawType === 'new'
              ? 'new'
              : rawType === 'removed' || rawType === 'remove'
                ? 'removed'
                : 'suggested';

      const color =
        changeType === 'new'
          ? '#3b82f6'
          : changeType === 'removed'
            ? '#ef4444'
            : changeType === 'degraded'
              ? '#f59e0b'
              : changeType === 'suggested'
                ? '#8b5cf6'
                : '#22c55e';

      return {
        zoneId: change.zoneId,
        color,
        opacity: 0.4,
        changeType,
      };
    });

  return {
    beforeHeatmap,
    afterHeatmap,
    flowPaths,
    highlightZones,
  };
}

function generateHeatmapData(
  rawData: any[] | null,
  type: 'before' | 'after'
): Array<{ x: number; z: number; intensity: number }> {
  if (rawData && Array.isArray(rawData)) {
    return rawData.map((point) => ({
      x: point.x || 0,
      z: point.z || point.y || 0,
      intensity: point.intensity || point.value || 0.5,
    }));
  }

  // 샘플 데이터 생성
  const baseIntensity = type === 'before' ? 0.5 : 0.7;
  return Array.from({ length: 20 }, (_, i) => ({
    x: (i % 5) * 2 - 4,
    z: Math.floor(i / 5) * 2 - 4,
    intensity: baseIntensity + Math.random() * 0.3,
  }));
}

function transformHistoryItem(item: any): LayoutSimulationResult {
  return {
    id: item.id,
    status: item.status || 'completed',
    timestamp: item.created_at,
    params: item.parameters || { goal: 'revenue' },
    currentEfficiency: item.result?.currentEfficiency || 72,
    optimizedEfficiency: item.result?.optimizedEfficiency || 85,
    expectedROI: item.result?.expectedROI || 10,
    improvements: item.result?.improvements || {
      revenueIncrease: 0,
      revenueIncreasePercent: 0,
      dwellTimeIncrease: 0,
      conversionIncrease: 0,
      trafficIncrease: 0,
    },
    furnitureMoves: item.result?.furnitureMoves || [],
    zoneChanges: item.result?.zoneChanges || [],
    productPlacements: item.result?.productPlacements || item.result?.productMoves || [],
    confidence: item.result?.confidence || {
      overall: 0.7,
      factors: { dataQuality: 0.7, modelAccuracy: 0.7, sampleSize: 0.7, variability: 0.7 },
    },
    insights: item.result?.insights || [],
    visualization: item.result?.visualization || {
      beforeHeatmap: [],
      afterHeatmap: [],
      flowPaths: [],
      highlightZones: [],
    },
  };
}

export default useLayoutSimulation;
