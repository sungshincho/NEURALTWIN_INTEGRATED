import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

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

export interface OntologyAnomaly {
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

export interface AssociationRule {
  antecedent: string[];
  consequent: string[];
  support: number;
  confidence: number;
  lift: number;
  interpretation: string;
}

/**
 * Phase 3: AI 추론 엔진 - 온톨로지 기반 추론 Hook
 * 
 * 기능:
 * 1. 온톨로지 기반 추천 시스템
 * 2. 지식 그래프 기반 이상 탐지
 * 3. 관계 패턴 분석
 */
export function useOntologyInference() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  /**
   * 1. 온톨로지 기반 추천 생성
   * 
   * 지식 그래프의 관계를 분석하여 제품, 고객, 카테고리 추천 수행
   * - 협업 필터링: 유사한 고객들이 구매한 제품
   * - 콘텐츠 기반: 유사한 속성을 가진 엔티티
   * - 그래프 탐색: 관계 체인을 따라 추천
   */
  const generateRecommendations = async (
    storeId: string,
    entityId?: string,
    recommendationType: 'product' | 'customer' | 'category' = 'product'
  ): Promise<OntologyRecommendation[] | null> => {
    setLoading(true);
    setError(null);

    try {
      const { data, error: functionError } = await supabase.functions.invoke(
        'unified-ai',
        {
          body: {
            action: 'ontology_recommendation',
            store_id: storeId,
            entity_id: entityId,
            parameters: {
              recommendation_type: recommendationType,
            },
          },
        }
      );

      if (functionError) {
        throw functionError;
      }

      if (!data || !data.recommendations) {
        throw new Error('추천 결과가 없습니다');
      }

      toast.success(`${data.recommendations.length}개의 온톨로지 기반 추천 생성 완료`);
      return data.recommendations as OntologyRecommendation[];
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : '온톨로지 추천 생성 실패';
      setError(e as Error);
      toast.error(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  };

  /**
   * 2. 지식 그래프 기반 이상 탐지
   * 
   * 그래프 구조와 엔티티 속성을 분석하여 이상 패턴 탐지
   * - 구조적 이상: 고립된 노드, 비정상 허브, 예상치 못한 관계
   * - 행동적 이상: 평소와 다른 패턴
   * - 값 이상: 통계적 이상치
   */
  const detectAnomalies = async (
    storeId: string,
    sensitivity: 'high' | 'medium' | 'low' = 'medium'
  ): Promise<{
    anomalies: OntologyAnomaly[];
    summary: {
      total_anomalies: number;
      critical_count: number;
      high_count: number;
      graph_health_score: number;
      main_concerns: string[];
    };
  } | null> => {
    setLoading(true);
    setError(null);

    try {
      const { data, error: functionError } = await supabase.functions.invoke(
        'unified-ai',
        {
          body: {
            action: 'anomaly_detection',
            store_id: storeId,
            parameters: {
              sensitivity,
            },
          },
        }
      );

      if (functionError) {
        throw functionError;
      }

      if (!data || !data.anomalies) {
        throw new Error('이상 탐지 결과가 없습니다');
      }

      const criticalCount = data.anomalies.filter(
        (a: OntologyAnomaly) => a.severity === 'critical'
      ).length;

      if (criticalCount > 0) {
        toast.warning(`${criticalCount}개의 중요 이상 징후 발견`);
      } else {
        toast.success('이상 탐지 완료');
      }

      return {
        anomalies: data.anomalies as OntologyAnomaly[],
        summary: data.anomaly_summary,
      };
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : '이상 탐지 실패';
      setError(e as Error);
      toast.error(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  };

  /**
   * 3. 관계 패턴 분석
   * 
   * 지식 그래프에서 의미 있는 패턴 발견
   * - 빈발 패턴: 자주 등장하는 구조
   * - 연관 규칙: A가 있으면 B도 있을 확률
   * - 클러스터: 유사한 엔티티 그룹
   * - 순차 패턴: 시간 순서를 가진 패턴
   */
  const analyzePatterns = async (
    storeId: string,
    analysisType: 'all' | 'frequency' | 'sequential' | 'co-occurrence' = 'all'
  ): Promise<{
    patterns: GraphPattern[];
    association_rules: AssociationRule[];
    clusters?: any[];
    insights: string[];
  } | null> => {
    setLoading(true);
    setError(null);

    try {
      const { data, error: functionError } = await supabase.functions.invoke(
        'unified-ai',
        {
          body: {
            action: 'pattern_analysis',
            store_id: storeId,
            parameters: {
              analysis_type: analysisType,
            },
          },
        }
      );

      if (functionError) {
        throw functionError;
      }

      if (!data || !data.patterns) {
        throw new Error('패턴 분석 결과가 없습니다');
      }

      toast.success(`${data.patterns.length}개의 패턴 발견`);
      return {
        patterns: data.patterns as GraphPattern[],
        association_rules: data.association_rules as AssociationRule[],
        clusters: data.clusters,
        insights: data.insights,
      };
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : '패턴 분석 실패';
      setError(e as Error);
      toast.error(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  };

  return {
    generateRecommendations,
    detectAnomalies,
    analyzePatterns,
    loading,
    error,
  };
}
