import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useSelectedStore } from './useSelectedStore';
import { toast } from 'sonner';

// ============================================================================
// 타입 정의
// ============================================================================

export type UnifiedAIAction =
  | 'generate_recommendations'
  | 'ontology_recommendation'
  | 'anomaly_detection'
  | 'pattern_analysis'
  | 'infer_relations';

export type RetailAIInferenceType =
  | 'layout_optimization'
  | 'zone_analysis'
  | 'traffic_flow'
  | 'demand_forecast'
  | 'inventory_optimization'
  | 'cross_sell'
  | 'customer_segmentation'
  | 'anomaly_detection';

export type AIInferenceType = UnifiedAIAction | RetailAIInferenceType;

export interface AIRequest {
  inferenceType: AIInferenceType;
  parameters?: Record<string, any>;
  storeId?: string;
  entityId?: string;
}

export interface AIRecommendation {
  entity_id?: string;
  entity_label: string;
  entity_type?: string;
  confidence: number;
  reasoning: string;
  supporting_relations?: string[];
  expected_impact?: {
    conversion_probability?: number;
    estimated_revenue?: number;
    cross_sell_potential?: string;
  };
}

export interface AIInferenceResult {
  success: boolean;
  action?: string;
  inference_type?: string;
  timestamp: string;
  recommendations?: AIRecommendation[];
  insights?: string[];
  metrics?: Record<string, any>;
  graph_stats?: {
    totalEntities: number;
    totalRelations: number;
    entityTypes: string[];
    relationTypes: string[];
  };
  result?: {
    insights: string[];
    recommendations: any[];
    metrics: Record<string, any>;
    confidence: number;
  };
}

// ============================================================================
// 통합 AI 훅
// ============================================================================

/**
 * 통합 AI 추론 훅
 *
 * unified-ai와 retail-ai-inference Edge Function을 통합하여
 * 단일 인터페이스로 AI 기능을 제공합니다.
 */
export function useAI() {
  const { selectedStore } = useSelectedStore();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      inferenceType,
      parameters = {},
      storeId,
      entityId,
    }: AIRequest): Promise<AIInferenceResult> => {
      const targetStoreId = storeId || selectedStore?.id;
      if (!targetStoreId) throw new Error('매장을 선택해주세요');

      // 함수 라우팅: unified-ai vs retail-ai-inference
      const unifiedAIActions: AIInferenceType[] = [
        'generate_recommendations',
        'ontology_recommendation',
        'anomaly_detection',
        'pattern_analysis',
        'infer_relations',
      ];

      const isUnifiedAI = unifiedAIActions.includes(inferenceType);
      const functionName = isUnifiedAI ? 'unified-ai' : 'retail-ai-inference';

      const body = isUnifiedAI
        ? {
            action: inferenceType,
            store_id: targetStoreId,
            entity_id: entityId,
            parameters,
          }
        : {
            inference_type: inferenceType,
            store_id: targetStoreId,
            parameters,
          };

      const { data, error } = await supabase.functions.invoke(functionName, {
        body,
      });

      if (error) throw error;
      return data as AIInferenceResult;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['ai-inference-results'] });
      queryClient.invalidateQueries({ queryKey: ['ai-recommendations'] });

      const count =
        data.recommendations?.length ||
        data.result?.recommendations?.length ||
        0;
      if (count > 0) {
        toast.success(`AI 분석 완료: ${count}개 추천 생성`);
      } else {
        toast.success('AI 분석이 완료되었습니다');
      }
    },
    onError: (error: Error) => {
      console.error('AI inference failed:', error);
      toast.error(`AI 분석 실패: ${error.message}`);
    },
  });
}

// ============================================================================
// 편의 훅들 (하위 호환성)
// ============================================================================

/**
 * 시뮬레이션 AI 분석 훅
 */
export function useSimulationAI() {
  const ai = useAI();
  const { selectedStore } = useSelectedStore();

  return {
    ...ai,
    analyzeLayout: (simulationResults: any) =>
      ai.mutateAsync({
        inferenceType: 'layout_optimization',
        storeId: selectedStore?.id,
        parameters: { simulation_results: simulationResults },
      }),
    analyzeTrafficFlow: (simulationResults: any) =>
      ai.mutateAsync({
        inferenceType: 'traffic_flow',
        storeId: selectedStore?.id,
        parameters: { simulation_results: simulationResults },
      }),
    analyzeZones: (zoneMetrics: any) =>
      ai.mutateAsync({
        inferenceType: 'zone_analysis',
        storeId: selectedStore?.id,
        parameters: { zone_metrics: zoneMetrics },
      }),
  };
}

/**
 * 추천 생성 훅
 */
export function useGenerateRecommendations() {
  const ai = useAI();

  return {
    ...ai,
    generate: () =>
      ai.mutateAsync({ inferenceType: 'generate_recommendations' }),
  };
}

/**
 * 온톨로지 기반 추천 훅
 */
export function useOntologyRecommendation() {
  const ai = useAI();

  return {
    ...ai,
    recommend: (entityId?: string, recommendationType: string = 'product') =>
      ai.mutateAsync({
        inferenceType: 'ontology_recommendation',
        entityId,
        parameters: { recommendation_type: recommendationType },
      }),
  };
}

/**
 * 관계 추론 훅
 */
export function useInferRelations() {
  const ai = useAI();

  return {
    ...ai,
    infer: (entityId?: string, autoSave: boolean = false) =>
      ai.mutateAsync({
        inferenceType: 'infer_relations',
        entityId,
        parameters: { auto_save: autoSave },
      }),
  };
}

/**
 * 이상 탐지 훅
 */
export function useAnomalyDetection() {
  const ai = useAI();

  return {
    ...ai,
    detect: (sensitivity: number = 0.5) =>
      ai.mutateAsync({
        inferenceType: 'anomaly_detection',
        parameters: { sensitivity },
      }),
  };
}

/**
 * 패턴 분석 훅
 */
export function usePatternAnalysis() {
  const ai = useAI();

  return {
    ...ai,
    analyze: (analysisType: string = 'all') =>
      ai.mutateAsync({
        inferenceType: 'pattern_analysis',
        parameters: { analysis_type: analysisType },
      }),
  };
}

/**
 * 리테일 AI 추론 훅 (retail-ai-inference)
 */
export function useRetailAIInference() {
  const ai = useAI();

  return {
    ...ai,
    analyze: (type: RetailAIInferenceType, parameters?: Record<string, any>) =>
      ai.mutateAsync({ inferenceType: type, parameters }),
  };
}

// ============================================================================
// AI 결과 조회 훅
// ============================================================================

/**
 * AI 추론 결과 이력 조회 훅
 */
export function useAIInferenceHistory(inferenceType?: AIInferenceType) {
  const { selectedStore } = useSelectedStore();

  return useQuery({
    queryKey: ['ai-inference-results', selectedStore?.id, inferenceType],
    queryFn: async () => {
      if (!selectedStore?.id) return [];

      let query = supabase
        .from('ai_inference_results')
        .select('*')
        .eq('store_id', selectedStore.id)
        .order('created_at', { ascending: false })
        .limit(20);

      if (inferenceType) {
        query = query.eq('inference_type', inferenceType);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
    enabled: !!selectedStore?.id,
  });
}

/**
 * AI 추천 목록 조회 훅
 * @param storeId - 선택적 매장 ID (없으면 선택된 매장 사용)
 */
export function useAIRecommendations(storeId?: string) {
  const { selectedStore } = useSelectedStore();
  const targetStoreId = storeId || selectedStore?.id;

  return useQuery({
    queryKey: ['ai-recommendations', targetStoreId],
    queryFn: async () => {
      if (!targetStoreId) return [];

      const { data, error } = await supabase
        .from('ai_recommendations')
        .select('*')
        .eq('store_id', targetStoreId)
        .eq('is_displayed', true)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      return data || [];
    },
    enabled: !!targetStoreId,
  });
}

export default useAI;
