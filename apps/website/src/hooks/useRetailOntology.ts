import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useSelectedStore } from './useSelectedStore';
import { useAuth } from './useAuth';
import { toast } from 'sonner';
import type {
  DataSource,
  DataSourceType,
  EntityMapping,
  RelationMapping,
  RetailConcept,
  ComputedRetailConcepts,
  RetailInferenceType,
  AIInferenceResult,
} from '@/types/retail-ontology';

// ============== Data Sources ==============

/**
 * 데이터소스 목록 조회 훅
 */
export function useDataSources() {
  const { selectedStore } = useSelectedStore();
  const { user } = useAuth();

  return useQuery({
    queryKey: ['data-sources', selectedStore?.id],
    queryFn: async (): Promise<DataSource[]> => {
      if (!user) return [];

      const query = supabase
        .from('data_sources')
        .select('*')
        .eq('org_id', user.id);

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) throw error;
      return (data || []) as unknown as DataSource[];
    },
    enabled: !!user,
  });
}

/**
 * 데이터소스 등록 훅
 */
export function useRegisterDataSource() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (config: {
      store_id?: string;
      name: string;
      description?: string;
      type: DataSourceType;
      connection_config?: Record<string, any>;
    }) => {
      const { data, error } = await supabase.functions.invoke('datasource-mapper', {
        body: {
          action: 'register',
          config,
        },
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['data-sources'] });
      toast.success('데이터소스가 등록되었습니다');
    },
    onError: (error) => {
      console.error('Failed to register data source:', error);
      toast.error('데이터소스 등록에 실패했습니다');
    },
  });
}

/**
 * 데이터소스 동기화 훅
 */
export function useSyncDataSource() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (dataSourceId: string) => {
      const { data, error } = await supabase.functions.invoke('datasource-mapper', {
        body: {
          action: 'sync',
          data_source_id: dataSourceId,
        },
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['data-sources'] });
      queryClient.invalidateQueries({ queryKey: ['graph-entities'] });
      queryClient.invalidateQueries({ queryKey: ['graph-relations'] });
      toast.success('데이터 동기화가 완료되었습니다');
    },
    onError: (error) => {
      console.error('Failed to sync data source:', error);
      toast.error('데이터 동기화에 실패했습니다');
    },
  });
}

/**
 * 스키마 추론 훅
 */
export function useInferSchema() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (dataSourceId: string) => {
      const { data, error } = await supabase.functions.invoke('datasource-mapper', {
        body: {
          action: 'infer_schema',
          data_source_id: dataSourceId,
        },
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['data-sources'] });
      toast.success('스키마 추론이 완료되었습니다');
    },
    onError: (error) => {
      console.error('Failed to infer schema:', error);
      toast.error('스키마 추론에 실패했습니다');
    },
  });
}

// ============== Mappings ==============

/**
 * 매핑 목록 조회 훅
 */
export function useDataSourceMappings(dataSourceId?: string) {
  return useQuery({
    queryKey: ['data-source-mappings', dataSourceId],
    queryFn: async () => {
      if (!dataSourceId) return { entity_mappings: [], relation_mappings: [] };

      const { data, error } = await supabase.functions.invoke('datasource-mapper', {
        body: {
          action: 'get_mappings',
          data_source_id: dataSourceId,
        },
      });

      if (error) throw error;
      return data as {
        entity_mappings: EntityMapping[];
        relation_mappings: RelationMapping[];
      };
    },
    enabled: !!dataSourceId,
  });
}

/**
 * 매핑 생성 훅
 */
export function useCreateMapping() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      dataSourceId,
      entityMappings,
      relationMappings,
    }: {
      dataSourceId: string;
      entityMappings?: Partial<EntityMapping>[];
      relationMappings?: Partial<RelationMapping>[];
    }) => {
      const { data, error } = await supabase.functions.invoke('datasource-mapper', {
        body: {
          action: 'create_mapping',
          data_source_id: dataSourceId,
          config: {
            entity_mappings: entityMappings,
            relation_mappings: relationMappings,
          },
        },
      });

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['data-source-mappings', variables.dataSourceId],
      });
      toast.success('매핑이 생성되었습니다');
    },
    onError: (error) => {
      console.error('Failed to create mapping:', error);
      toast.error('매핑 생성에 실패했습니다');
    },
  });
}

// ============== Retail Concepts ==============

/**
 * 시스템 리테일 개념 목록 조회 훅
 */
export function useRetailConceptDefinitions() {
  return useQuery({
    queryKey: ['retail-concept-definitions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('retail_concepts')
        .select('*')
        .eq('is_system', true)
        .eq('is_active', true)
        .order('category', { ascending: true });

      if (error) throw error;
      return (data || []) as unknown as RetailConcept[];
    },
  });
}

/**
 * 리테일 개념 계산 결과 조회 훅
 */
export function useRetailConcepts(days: number = 30) {
  const { selectedStore } = useSelectedStore();

  return useQuery({
    queryKey: ['retail-concepts', selectedStore?.id, days],
    queryFn: async () => {
      if (!selectedStore?.id) return null;

      const { data, error } = await supabase.rpc('compute_all_retail_concepts', {
        p_store_id: selectedStore.id,
        p_days: days,
      });

      if (error) {
        console.error('Failed to compute retail concepts:', error);
        return null;
      }

      return data as unknown as ComputedRetailConcepts;
    },
    enabled: !!selectedStore?.id,
    staleTime: 5 * 60 * 1000, // 5분 캐시
  });
}

/**
 * 구역 전환 퍼널 데이터 조회
 */
export function useZoneConversionFunnel(days: number = 30) {
  const { selectedStore } = useSelectedStore();

  return useQuery({
    queryKey: ['zone-conversion-funnel', selectedStore?.id, days],
    queryFn: async () => {
      if (!selectedStore?.id) return [];

      const { data, error } = await supabase.rpc('compute_zone_conversion_funnel', {
        p_store_id: selectedStore.id,
        p_days: days,
      });

      if (error) throw error;
      return data || [];
    },
    enabled: !!selectedStore?.id,
  });
}

/**
 * 교차 판매 친화도 데이터 조회
 */
export function useCrossSellAffinity(minSupport: number = 3) {
  const { selectedStore } = useSelectedStore();

  return useQuery({
    queryKey: ['cross-sell-affinity', selectedStore?.id, minSupport],
    queryFn: async () => {
      if (!selectedStore?.id) return [];

      const { data, error } = await supabase.rpc('compute_cross_sell_affinity', {
        p_store_id: selectedStore.id,
        p_min_support: minSupport,
      });

      if (error) throw error;
      return data || [];
    },
    enabled: !!selectedStore?.id,
  });
}

/**
 * 재고 회전율 데이터 조회
 */
export function useInventoryTurnover(days: number = 30) {
  const { selectedStore } = useSelectedStore();

  return useQuery({
    queryKey: ['inventory-turnover', selectedStore?.id, days],
    queryFn: async () => {
      if (!selectedStore?.id) return [];

      const { data, error } = await supabase.rpc('compute_inventory_turnover', {
        p_store_id: selectedStore.id,
        p_days: days,
      });

      if (error) throw error;
      return data || [];
    },
    enabled: !!selectedStore?.id,
  });
}

/**
 * 구역 히트맵 데이터 조회
 */
export function useZoneHeatmap(days: number = 7) {
  const { selectedStore } = useSelectedStore();

  return useQuery({
    queryKey: ['zone-heatmap', selectedStore?.id, days],
    queryFn: async () => {
      if (!selectedStore?.id) return [];

      const { data, error } = await supabase.rpc('compute_zone_heatmap', {
        p_store_id: selectedStore.id,
        p_days: days,
      });

      if (error) throw error;
      return data || [];
    },
    enabled: !!selectedStore?.id,
  });
}

// ============== AI Inference ==============

/**
 * 리테일 AI 추론 실행 훅
 */
export function useRetailAIInference() {
  const { selectedStore } = useSelectedStore();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      inferenceType,
      parameters = {},
    }: {
      inferenceType: RetailInferenceType;
      parameters?: Record<string, any>;
    }) => {
      if (!selectedStore?.id) {
        throw new Error('매장을 선택해주세요');
      }

      const { data, error } = await supabase.functions.invoke('retail-ai-inference', {
        body: {
          inference_type: inferenceType,
          store_id: selectedStore.id,
          parameters,
        },
      });

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['ai-inference-results'] });
      const resultCount = data?.result?.recommendations?.length || 0;
      toast.success(`AI 분석 완료: ${resultCount}개 추천 생성`);
    },
    onError: (error) => {
      console.error('AI inference failed:', error);
      toast.error(`분석 실패: ${error instanceof Error ? error.message : '알 수 없는 오류'}`);
    },
  });
}

/**
 * AI 추론 결과 이력 조회 훅
 */
export function useAIInferenceHistory(inferenceType?: RetailInferenceType) {
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
      return (data || []) as unknown as AIInferenceResult[];
    },
    enabled: !!selectedStore?.id,
  });
}

// ============== Combined Hook ==============

/**
 * 리테일 온톨로지 시스템 통합 훅
 */
export function useRetailOntologySystem() {
  const dataSources = useDataSources();
  const retailConcepts = useRetailConcepts();
  const conceptDefinitions = useRetailConceptDefinitions();
  const aiInference = useRetailAIInference();

  const registerDataSource = useRegisterDataSource();
  const syncDataSource = useSyncDataSource();
  const inferSchema = useInferSchema();
  const createMapping = useCreateMapping();

  return {
    // Data
    dataSources: dataSources.data,
    retailConcepts: retailConcepts.data,
    conceptDefinitions: conceptDefinitions.data,

    // Loading states
    isLoading:
      dataSources.isLoading ||
      retailConcepts.isLoading ||
      conceptDefinitions.isLoading,

    // Mutations
    registerDataSource: registerDataSource.mutateAsync,
    syncDataSource: syncDataSource.mutateAsync,
    inferSchema: inferSchema.mutateAsync,
    createMapping: createMapping.mutateAsync,
    runAIInference: aiInference.mutateAsync,

    // Mutation states
    isRegistering: registerDataSource.isPending,
    isSyncing: syncDataSource.isPending,
    isInferring: aiInference.isPending,

    // Refetch
    refetchDataSources: dataSources.refetch,
    refetchConcepts: retailConcepts.refetch,
  };
}

export default useRetailOntologySystem;
