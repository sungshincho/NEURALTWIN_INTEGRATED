import { useState, useCallback } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useSelectedStore } from './useSelectedStore';
import { toast } from 'sonner';

/**
 * unified-ai Edge Function Actions
 */
export type UnifiedAIAction =
  | 'generate_recommendations'
  | 'ontology_recommendation'
  | 'anomaly_detection'
  | 'pattern_analysis'
  | 'infer_relations';

/**
 * Unified AI Request interface
 */
export interface UnifiedAIRequest {
  action: UnifiedAIAction;
  store_id: string;
  entity_id?: string;
  parameters?: Record<string, any>;
}

/**
 * Recommendation result from generate_recommendations action
 */
export interface GeneratedRecommendation {
  id: string;
  recommendation_type: string;
  priority: string;
  title: string;
  description: string;
  action_category?: string;
  expected_impact?: Record<string, any>;
  evidence?: Record<string, any>;
}

/**
 * Ontology-based recommendation result
 */
export interface OntologyRecommendation {
  entity_id: string;
  entity_label: string;
  entity_type: string;
  confidence: number;
  reasoning: string;
  supporting_relations: string[];
  expected_impact?: {
    conversion_probability?: number;
    estimated_revenue?: number;
    cross_sell_potential?: string;
  };
}

/**
 * Anomaly detection result
 */
export interface DetectedAnomaly {
  anomaly_id: string;
  type: 'structural' | 'behavioral' | 'temporal' | 'value';
  severity: 'critical' | 'high' | 'medium' | 'low';
  entity_id?: string;
  entity_label?: string;
  description: string;
  normal_pattern: string;
  observed_pattern: string;
  possible_causes: string[];
  business_impact: string;
  recommended_action: string;
  confidence: number;
}

/**
 * Pattern analysis result
 */
export interface GraphPattern {
  pattern_id: string;
  pattern_type: 'frequency' | 'association' | 'sequential' | 'cluster';
  description: string;
  entities_involved: string[];
  relation_sequence?: string[];
  support?: number;
  confidence?: number;
  lift?: number;
  business_interpretation: string;
  actionable_insight: string;
}

/**
 * Inferred relation result
 */
export interface InferredRelation {
  source_entity_id: string;
  source_label: string;
  relation_type: string;
  target_entity_id: string;
  target_label: string;
  confidence: number;
  reasoning: string;
  supporting_evidence: string[];
  weight: number;
}

/**
 * useUnifiedAI - Consolidated hook for all AI operations
 *
 * Usage:
 * ```tsx
 * const {
 *   generateRecommendations,
 *   ontologyRecommendation,
 *   detectAnomalies,
 *   analyzePatterns,
 *   inferRelations,
 *   loading,
 *   error
 * } = useUnifiedAI();
 *
 * // Generate rule-based recommendations
 * await generateRecommendations();
 *
 * // Get AI-powered ontology recommendations
 * const recs = await ontologyRecommendation({ recommendation_type: 'product' });
 *
 * // Detect anomalies in knowledge graph
 * const anomalies = await detectAnomalies({ sensitivity: 'high' });
 *
 * // Analyze patterns
 * const patterns = await analyzePatterns({ analysis_type: 'all' });
 *
 * // Infer new relations
 * const relations = await inferRelations({ max_relations: 10, auto_save: true });
 * ```
 */
export function useUnifiedAI() {
  const { selectedStore } = useSelectedStore();
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  /**
   * Base function to invoke unified-ai Edge Function
   */
  const invokeUnifiedAI = useCallback(async <T = any>(
    action: UnifiedAIAction,
    entityId?: string,
    parameters?: Record<string, any>
  ): Promise<T | null> => {
    if (!selectedStore?.id) {
      toast.error('매장을 선택해주세요');
      return null;
    }

    setLoading(true);
    setError(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke('unified-ai', {
        body: {
          action,
          store_id: selectedStore.id,
          entity_id: entityId,
          parameters,
        } as UnifiedAIRequest,
      });

      if (fnError) throw fnError;
      return data as T;
    } catch (e) {
      const err = e as Error;
      setError(err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [selectedStore?.id]);

  /**
   * Generate rule-based KPI recommendations
   */
  const generateRecommendationsMutation = useMutation({
    mutationFn: async (storeId?: string) => {
      const targetStoreId = storeId || selectedStore?.id;
      if (!targetStoreId) throw new Error('매장을 선택해주세요');

      const { data, error } = await supabase.functions.invoke('unified-ai', {
        body: {
          action: 'generate_recommendations',
          store_id: targetStoreId,
        },
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ai-recommendations'] });
      toast.success('AI 추천이 생성되었습니다');
    },
    onError: (error) => {
      console.error('Error generating recommendations:', error);
      toast.error('AI 추천 생성에 실패했습니다');
    },
  });

  /**
   * Get ontology-based AI recommendations
   */
  const ontologyRecommendation = useCallback(async (
    parameters?: {
      recommendation_type?: 'product' | 'customer' | 'category';
      [key: string]: any;
    },
    entityId?: string
  ): Promise<{
    recommendations: OntologyRecommendation[];
    recommendation_strategy: any;
    insights: string[];
  } | null> => {
    try {
      const result = await invokeUnifiedAI<any>(
        'ontology_recommendation',
        entityId,
        parameters
      );

      if (result?.recommendations) {
        toast.success(`${result.recommendations.length}개의 온톨로지 기반 추천 생성 완료`);
      }

      return result;
    } catch (e) {
      toast.error('온톨로지 추천 생성 실패');
      return null;
    }
  }, [invokeUnifiedAI]);

  /**
   * Detect anomalies in knowledge graph
   */
  const detectAnomalies = useCallback(async (
    parameters?: {
      sensitivity?: 'high' | 'medium' | 'low';
      [key: string]: any;
    }
  ): Promise<{
    anomalies: DetectedAnomaly[];
    anomaly_summary: {
      total_anomalies: number;
      critical_count: number;
      high_count: number;
      graph_health_score: number;
      main_concerns: string[];
    };
    insights: string[];
  } | null> => {
    try {
      const result = await invokeUnifiedAI<any>('anomaly_detection', undefined, parameters);

      if (result?.anomalies) {
        const criticalCount = result.anomalies.filter(
          (a: DetectedAnomaly) => a.severity === 'critical'
        ).length;

        if (criticalCount > 0) {
          toast.warning(`${criticalCount}개의 중요 이상 징후 발견`);
        } else {
          toast.success('이상 탐지 완료');
        }
      }

      return result;
    } catch (e) {
      toast.error('이상 탐지 실패');
      return null;
    }
  }, [invokeUnifiedAI]);

  /**
   * Analyze patterns in knowledge graph
   */
  const analyzePatterns = useCallback(async (
    parameters?: {
      analysis_type?: 'all' | 'frequency' | 'sequential' | 'co-occurrence';
      [key: string]: any;
    }
  ): Promise<{
    patterns: GraphPattern[];
    association_rules: Array<{
      antecedent: string[];
      consequent: string[];
      support: number;
      confidence: number;
      lift: number;
      interpretation: string;
    }>;
    clusters?: any[];
    insights: string[];
  } | null> => {
    try {
      const result = await invokeUnifiedAI<any>('pattern_analysis', undefined, parameters);

      if (result?.patterns) {
        toast.success(`${result.patterns.length}개의 패턴 발견`);
      }

      return result;
    } catch (e) {
      toast.error('패턴 분석 실패');
      return null;
    }
  }, [invokeUnifiedAI]);

  /**
   * Infer new relations between entities
   */
  const inferRelations = useCallback(async (
    parameters?: {
      scope?: 'all' | 'entity';
      max_relations?: number;
      auto_save?: boolean;
      [key: string]: any;
    },
    entityId?: string
  ): Promise<{
    inferred_relations: InferredRelation[];
    inference_summary: {
      total_inferred: number;
      high_confidence_count: number;
      relation_types_inferred: string[];
      coverage_improvement: string;
    };
    insights: string[];
  } | null> => {
    try {
      const result = await invokeUnifiedAI<any>('infer_relations', entityId, parameters);

      if (result?.inferred_relations) {
        toast.success(`${result.inferred_relations.length}개의 관계 추론 완료`);
      }

      return result;
    } catch (e) {
      toast.error('관계 추론 실패');
      return null;
    }
  }, [invokeUnifiedAI]);

  /**
   * Clear error state
   */
  const clearError = useCallback(() => setError(null), []);

  return {
    // State
    loading: loading || generateRecommendationsMutation.isPending,
    error,

    // Actions
    generateRecommendations: generateRecommendationsMutation.mutateAsync,
    ontologyRecommendation,
    detectAnomalies,
    analyzePatterns,
    inferRelations,

    // Utilities
    clearError,
    invokeUnifiedAI,
  };
}

export default useUnifiedAI;
