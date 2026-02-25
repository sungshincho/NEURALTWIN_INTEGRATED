import { useState, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useSelectedStore } from '@/hooks/useSelectedStore';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { useStoreContext, StoreContextData } from '@/features/simulation/hooks/useStoreContext';
/**
 * Phase 1: 강화된 AI 추론 Hook v3
 * 
 * 주요 개선사항:
 * 1. 실제 매출/방문 데이터 기반 추론
 * 2. 통계적 신뢰도 계산
 * 3. 과거 추천 성과 반영
 * 4. 구역별 히트맵/동선 분석 통합
 */

// ============================================================================
// 타입 정의
// ============================================================================

export type SimulationScenario = 'demand' | 'inventory' | 'pricing' | 'layout' | 'marketing';

export interface OntologySchema {
  entityTypes: Array<{
    id: string;
    name: string;
    label: string;
    description?: string;
    properties: Array<{ name: string; type: string; required: boolean }>;
  }>;
  relationTypes: Array<{
    id: string;
    name: string;
    label: string;
    source_entity_type: string;
    target_entity_type: string;
  }>;
  stats: {
    totalEntityTypes: number;
    totalRelationTypes: number;
    criticalEntities: number;
    criticalRelations: number;
  };
}

export interface OntologyContext {
  schema: OntologySchema;
  entities: {
    total: number;
    byType: Record<string, number>;
    sample: Array<{ id: string; label: string; type: string; properties: Record<string, any> }>;
  };
  relations: {
    total: number;
    byType: Record<string, number>;
    sample: Array<{ source: string; target: string; type: string; weight?: number }>;
  };
  patterns: {
    frequentPairs: Array<{ items: string[]; count: number }>;
    hubs: Array<{ entity: string; connections: number; type: string }>;
    isolated: Array<{ entity: string; type: string }>;
    relationChains: Array<{ chain: string[]; count: number }>;
  };
  stats: {
    avgDegree: number;
    density: number;
    schemaCoverage: number;
  };
}

export interface SimulationParams {
  dataRange?: number;
  forecastPeriod?: number;
  confidenceLevel?: number;
  includeSeasonality?: boolean;
  includeExternalFactors?: boolean;
  useOntologyContext?: boolean;
  useEnhancedData?: boolean;
  ontologyDepth?: number;
  relationTypes?: string[];
  [key: string]: any;
}

export interface ConfidenceDetails {
  score: number;
  factors: {
    dataAvailability: number;
    dataRecency: number;
    dataCoverage: number;
    pastPerformance: number;
    patternConsistency: number;
    ontologyDepth: number;
  };
  explanation: string;
}

export interface InferenceResult {
  type: string;
  timestamp: string;
  confidenceScore: number;
  confidenceDetails?: ConfidenceDetails;
  aiInsights: string[];
  dataBasedInsights?: string[];
  predictedKpi?: Record<string, number>;
  recommendations?: string[];
  ontologyInsights?: {
    schemaUsed: boolean;
    entityTypesAnalyzed: string[];
    relationTypesAnalyzed: string[];
    patternsUsed: string[];
    confidence: number;
  };
  dataQuality?: {
    salesDataDays: number;
    visitorDataDays: number;
    hasZoneData: boolean;
    hasFlowData: boolean;
    overallScore: number;
  };
  [key: string]: any;
}

interface UseEnhancedAIInferenceReturn {
  loading: boolean;
  error: Error | null;
  lastResult: InferenceResult | null;
  ontologyContext: OntologyContext | null;
  ontologySchema: OntologySchema | null;
  enhancedStoreContext: StoreContextData | null;
  
  infer: (scenario: SimulationScenario, params?: SimulationParams, storeContext?: any) => Promise<InferenceResult | null>;
  inferWithEnhancedData: (scenario: SimulationScenario, params?: SimulationParams) => Promise<InferenceResult | null>;
  inferWithOntology: (scenario: SimulationScenario, params?: SimulationParams, storeContext?: any) => Promise<InferenceResult | null>;
  runOntologyInference: (inferenceType: 'recommendation' | 'anomaly_detection' | 'pattern_analysis', entityId?: string, params?: Record<string, any>) => Promise<any | null>;
  analyzeGoal: (goalText: string) => Promise<any[] | null>;
  loadOntologySchema: () => Promise<OntologySchema | null>;
  loadOntologyContext: () => Promise<OntologyContext | null>;
  refreshEnhancedContext: () => Promise<void>;
  clearError: () => void;
  clearLastResult: () => void;
}

// ============================================================================
// Hook 구현
// ============================================================================

export function useEnhancedAIInference(): UseEnhancedAIInferenceReturn {
  const { selectedStore } = useSelectedStore();
  const { user } = useAuth();
  
  const { contextData: enhancedStoreContext, loading: contextLoading, refresh: refreshContext } = useStoreContext(selectedStore?.id);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [lastResult, setLastResult] = useState<InferenceResult | null>(null);
  const [ontologyContext, setOntologyContext] = useState<OntologyContext | null>(null);
  const [ontologySchema, setOntologySchema] = useState<OntologySchema | null>(null);
  
  const cache = useRef<Map<string, { result: any; timestamp: number }>>(new Map());
  const CACHE_TTL = 5 * 60 * 1000;

  /**
   * 온톨로지 스키마 로드
   */
  const loadOntologySchema = useCallback(async (): Promise<OntologySchema | null> => {
    if (!user?.id) return null;

    try {
      const { data: entityTypes, error: entityError } = await supabase
        .from('ontology_entity_types')
        .select('*')
        .eq('user_id', user.id)
        .order('name');

      if (entityError) throw entityError;

      const { data: relationTypes, error: relationError } = await supabase
        .from('ontology_relation_types')
        .select('*')
        .eq('user_id', user.id)
        .order('name');

      if (relationError) throw relationError;

      const schema: OntologySchema = {
        entityTypes: (entityTypes || []).map((e: any) => ({
          id: e.id,
          name: e.name,
          label: e.label,
          description: e.description,
          properties: e.properties || [],
        })),
        relationTypes: (relationTypes || []).map((r: any) => ({
          id: r.id,
          name: r.name,
          label: r.label,
          source_entity_type: r.source_entity_type,
          target_entity_type: r.target_entity_type,
        })),
        stats: {
          totalEntityTypes: entityTypes?.length || 0,
          totalRelationTypes: relationTypes?.length || 0,
          criticalEntities: (entityTypes || []).filter((e: any) => e.name?.match(/^(Store|Product|Customer|Zone|Transaction|Inventory)$/)).length,
          criticalRelations: (relationTypes || []).filter((r: any) => r.priority === 'critical').length,
        },
      };

      setOntologySchema(schema);
      return schema;
    } catch (e) {
      console.error('Failed to load ontology schema:', e);
      return null;
    }
  }, [user?.id]);

  /**
   * 온톨로지 컨텍스트 로드
   */
  const loadOntologyContext = useCallback(async (): Promise<OntologyContext | null> => {
    if (!selectedStore?.id || !user?.id) return null;

    try {
      let schema = ontologySchema;
      if (!schema) {
        schema = await loadOntologySchema();
      }
      if (!schema) throw new Error('Failed to load ontology schema');

      const { data: entities } = await supabase
        .from('graph_entities')
        .select(`id, label, properties, entity_type:ontology_entity_types!graph_entities_entity_type_id_fkey(id, name, label)`)
        .eq('store_id', selectedStore.id)
        .eq('user_id', user.id)
        .limit(1000);

      const { data: relations } = await supabase
        .from('graph_relations')
        .select(`id, weight, properties, source:graph_entities!graph_relations_source_entity_id_fkey(id, label), target:graph_entities!graph_relations_target_entity_id_fkey(id, label), relation_type:ontology_relation_types!graph_relations_relation_type_id_fkey(id, name, label)`)
        .eq('store_id', selectedStore.id)
        .eq('user_id', user.id)
        .limit(2000);

      const entityByType: Record<string, number> = {};
      (entities || []).forEach((e: any) => {
        const typeName = e.entity_type?.name || 'unknown';
        entityByType[typeName] = (entityByType[typeName] || 0) + 1;
      });

      const relationByType: Record<string, number> = {};
      (relations || []).forEach((r: any) => {
        const typeName = r.relation_type?.name || 'unknown';
        relationByType[typeName] = (relationByType[typeName] || 0) + 1;
      });

      const context: OntologyContext = {
        schema,
        entities: {
          total: (entities || []).length,
          byType: entityByType,
          sample: (entities || []).slice(0, 100).map((e: any) => ({
            id: e.id, label: e.label, type: e.entity_type?.name || 'unknown', properties: e.properties || {},
          })),
        },
        relations: {
          total: (relations || []).length,
          byType: relationByType,
          sample: (relations || []).slice(0, 100).map((r: any) => ({
            source: r.source?.label || '', target: r.target?.label || '', type: r.relation_type?.name || 'unknown', weight: r.weight,
          })),
        },
        patterns: { frequentPairs: [], hubs: [], isolated: [], relationChains: [] },
        stats: { avgDegree: 0, density: 0, schemaCoverage: 0 },
      };

      setOntologyContext(context);
      return context;
    } catch (e) {
      console.error('Failed to load ontology context:', e);
      return null;
    }
  }, [selectedStore?.id, user?.id, ontologySchema, loadOntologySchema]);

  /**
   * 기본 AI 추론
   */
  const infer = useCallback(async (
    scenario: SimulationScenario,
    params: SimulationParams = {},
    storeContext?: any
  ): Promise<InferenceResult | null> => {
    if (!selectedStore?.id) {
      toast.error('매장을 선택해주세요');
      return null;
    }

    const cacheKey = `${scenario}-${selectedStore.id}-${JSON.stringify(params)}`;
    const cached = cache.current.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      return cached.result;
    }

    setLoading(true);
    setError(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke('advanced-ai-inference', {
        body: {
          inference_type: 'prediction',
          data: [{ scenarioType: scenario, params, storeId: selectedStore.id }],
          parameters: { scenario_type: scenario, store_context: storeContext, ...params },
        },
      });

      if (fnError) throw fnError;

      const result = data as InferenceResult;
      setLastResult(result);
      cache.current.set(cacheKey, { result, timestamp: Date.now() });
      return result;
    } catch (e) {
      const err = e as Error;
      setError(err);
      toast.error(err.message || 'AI 추론 실패');
      return null;
    } finally {
      setLoading(false);
    }
  }, [selectedStore?.id]);

  /**
   * 🆕 강화된 데이터 기반 AI 추론 (Phase 1 핵심)
   */
  const inferWithEnhancedData = useCallback(async (
    scenario: SimulationScenario,
    params: SimulationParams = {}
  ): Promise<InferenceResult | null> => {
    if (!selectedStore?.id) {
      toast.error('매장을 선택해주세요');
      return null;
    }

    if (!enhancedStoreContext) {
      toast.info('데이터 로딩 중...');
      await refreshContext();
    }

    setLoading(true);
    setError(null);

    try {
      let ontCtx = ontologyContext;
      if (!ontCtx && params.useOntologyContext !== false) {
        ontCtx = await loadOntologyContext();
      }

      const enhancedContext = {
  storeInfo: enhancedStoreContext?.storeInfo,
  entities: enhancedStoreContext?.entities || [],
  relations: enhancedStoreContext?.relations || [],
  salesData: enhancedStoreContext?.salesAnalysis,      // salesData → salesAnalysis
  visitorData: enhancedStoreContext?.visitorAnalysis,  // visitorData → visitorAnalysis
  conversionData: enhancedStoreContext?.conversionAnalysis,  // conversionData → conversionAnalysis
  recommendationPerformance: enhancedStoreContext?.recommendationPerformance,
  dataQuality: enhancedStoreContext?.dataQuality,
        ontologySchema: ontCtx?.schema ? {
          entityTypes: ontCtx.schema.entityTypes.map(e => ({ name: e.name, label: e.label })),
          relationTypes: ontCtx.schema.relationTypes.map(r => ({ name: r.name, label: r.label })),
          stats: ontCtx.schema.stats,
        } : undefined,
        ontologyPatterns: ontCtx?.patterns,
        ontologyStats: ontCtx?.stats,
      };

      console.log('🚀 Enhanced AI inference:', {
        scenario,
        hasSalesData: !!enhancedContext.salesData,
        hasVisitorData: !!enhancedContext.visitorData,
        dataQualityScore: enhancedContext.dataQuality?.overallScore,
      });

      const { data, error: fnError } = await supabase.functions.invoke('advanced-ai-inference', {
        body: {
          inference_type: 'prediction',
          data: [{ scenarioType: scenario, params, storeId: selectedStore.id }],
          parameters: {
            scenario_type: scenario,
            store_context: enhancedContext,
            use_enhanced_data: true,
            use_ontology: !!ontCtx,
            ...params,
          },
        },
      });

      if (fnError) throw fnError;

      const result: InferenceResult = {
        ...data,
        dataQuality: enhancedContext.dataQuality,
        ontologyInsights: ontCtx ? {
          schemaUsed: true,
          entityTypesAnalyzed: Object.keys(ontCtx.entities.byType),
          relationTypesAnalyzed: Object.keys(ontCtx.relations.byType),
          patternsUsed: [],
          confidence: ontCtx.stats.schemaCoverage > 50 ? 0.85 : 0.7,
        } : undefined,
      };

      setLastResult(result);

      const confidence = result.confidenceScore || result.optimizationSummary?.confidence;
      if (confidence) {
        toast.success(`AI 분석 완료 (신뢰도: ${Math.round(confidence * (confidence <= 1 ? 100 : 1))}%)`);
      }

      return result;
    } catch (e) {
      const err = e as Error;
      setError(err);
      toast.error(err.message || 'AI 추론 실패');
      return null;
    } finally {
      setLoading(false);
    }
  }, [selectedStore?.id, enhancedStoreContext, ontologyContext, loadOntologyContext, refreshContext]);

  /**
   * 온톨로지 강화 AI 추론
   */
  const inferWithOntology = useCallback(async (
    scenario: SimulationScenario,
    params: SimulationParams = {},
    storeContext?: any
  ): Promise<InferenceResult | null> => {
    if (!selectedStore?.id) {
      toast.error('매장을 선택해주세요');
      return null;
    }

    setLoading(true);
    setError(null);

    try {
      let context = ontologyContext;
      if (!context) {
        context = await loadOntologyContext();
      }

      const { data, error: fnError } = await supabase.functions.invoke('advanced-ai-inference', {
        body: {
          inference_type: 'prediction',
          data: [{ scenarioType: scenario, params, storeId: selectedStore.id }],
          graph_data: context ? { nodes: context.entities.sample, edges: context.relations.sample, patterns: context.patterns, stats: context.stats } : undefined,
          parameters: {
            scenario_type: scenario,
            store_context: storeContext,
            use_ontology: true,
            ontology_schema: context?.schema,
            ...params,
          },
        },
      });

      if (fnError) throw fnError;

      const result = { ...data, ontologyInsights: context ? { schemaUsed: true, entityTypesAnalyzed: Object.keys(context.entities.byType), relationTypesAnalyzed: Object.keys(context.relations.byType), patternsUsed: [], confidence: 0.8 } : undefined } as InferenceResult;
      setLastResult(result);
      return result;
    } catch (e) {
      const err = e as Error;
      setError(err);
      toast.error(err.message || '온톨로지 기반 추론 실패');
      return null;
    } finally {
      setLoading(false);
    }
  }, [selectedStore?.id, ontologyContext, loadOntologyContext]);

  /**
   * 온톨로지 전용 추론
   */
  const runOntologyInference = useCallback(async (
    inferenceType: 'recommendation' | 'anomaly_detection' | 'pattern_analysis',
    entityId?: string,
    params: Record<string, any> = {}
  ): Promise<any | null> => {
    if (!selectedStore?.id) {
      toast.error('매장을 선택해주세요');
      return null;
    }

    setLoading(true);
    setError(null);

    try {
      const schema = ontologySchema || await loadOntologySchema();

      // Map inference type to unified-ai action
      const actionMap: Record<string, string> = {
        'recommendation': 'ontology_recommendation',
        'anomaly_detection': 'anomaly_detection',
        'pattern_analysis': 'pattern_analysis',
      };

      const { data, error: fnError } = await supabase.functions.invoke('unified-ai', {
        body: {
          action: actionMap[inferenceType] || inferenceType,
          store_id: selectedStore.id,
          entity_id: entityId,
          parameters: { ...params, schema_info: schema?.stats },
        },
      });

      if (fnError) throw fnError;

      toast.success(`${inferenceType} 완료`);
      return data;
    } catch (e) {
      const err = e as Error;
      setError(err);
      toast.error(err.message || '온톨로지 추론 실패');
      return null;
    } finally {
      setLoading(false);
    }
  }, [selectedStore?.id, ontologySchema, loadOntologySchema]);

  /**
   * 비즈니스 목표 분석
   */
  const analyzeGoal = useCallback(async (goalText: string): Promise<any[] | null> => {
    if (!selectedStore?.id) {
      toast.error('매장을 선택해주세요');
      return null;
    }

    setLoading(true);
    setError(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke('advanced-ai-inference', {
        body: {
          inference_type: 'pattern',
          data: [{ goal: goalText, storeId: selectedStore.id }],
          parameters: { analysis_type: 'business_goal_analysis', goal_text: goalText },
        },
      });

      if (fnError) throw fnError;
      return data?.recommendations || [];
    } catch (e) {
      const err = e as Error;
      setError(err);
      toast.error(err.message || '목표 분석 실패');
      return null;
    } finally {
      setLoading(false);
    }
  }, [selectedStore?.id]);

  const refreshEnhancedContext = useCallback(async () => {
    await refreshContext();
    toast.success('데이터 새로고침 완료');
  }, [refreshContext]);

  const clearError = useCallback(() => setError(null), []);
  const clearLastResult = useCallback(() => setLastResult(null), []);

  return {
    loading: loading || contextLoading,
    error,
    lastResult,
    ontologyContext,
    ontologySchema,
    enhancedStoreContext,
    infer,
    inferWithEnhancedData,
    inferWithOntology,
    runOntologyInference,
    analyzeGoal,
    loadOntologySchema,
    loadOntologyContext,
    refreshEnhancedContext,
    clearError,
    clearLastResult,
  };
}

export default useEnhancedAIInference;
