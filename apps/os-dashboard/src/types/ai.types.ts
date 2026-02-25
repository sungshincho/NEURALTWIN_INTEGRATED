// ============================================================================
// AI 관련 타입 정의
// ============================================================================

/**
 * Unified AI Action 타입
 */
export type UnifiedAIAction =
  | 'generate_recommendations'
  | 'ontology_recommendation'
  | 'anomaly_detection'
  | 'pattern_analysis'
  | 'infer_relations';

/**
 * Retail AI Inference 타입
 */
export type RetailAIInferenceType =
  | 'layout_optimization'
  | 'zone_analysis'
  | 'traffic_flow'
  | 'demand_forecast'
  | 'inventory_optimization'
  | 'cross_sell'
  | 'customer_segmentation'
  | 'anomaly_detection';

/**
 * 통합 AI 추론 타입
 */
export type AIInferenceType = UnifiedAIAction | RetailAIInferenceType;

/**
 * AI 요청 인터페이스
 */
export interface AIRequest {
  inferenceType: AIInferenceType;
  parameters?: Record<string, any>;
  storeId?: string;
  entityId?: string;
}

/**
 * AI 추천 결과
 */
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

/**
 * AI 추론 결과
 */
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

/**
 * 생성된 추천 (규칙 기반)
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
 * 온톨로지 기반 추천
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
 * 이상 탐지 결과
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
 * 그래프 패턴
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
 * 추론된 관계
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
 * 시뮬레이션 AI 결과
 */
export interface SimulationAIResult {
  success: boolean;
  inference_type: string;
  store_id: string;
  result: {
    insights: string[];
    recommendations: Array<{
      title: string;
      description: string;
      priority: 'critical' | 'high' | 'medium' | 'low';
      category: string;
      expected_impact?: string;
      action_items?: string[];
    }>;
    metrics: Record<string, any>;
    confidence: number;
  };
  data_summary?: {
    entities_analyzed: number;
    relations_analyzed: number;
    concepts_computed: number;
  };
}

// ============================================================================
// 리테일 데이터 타입
// ============================================================================

/**
 * 구역 정보
 */
export interface ZoneDim {
  id: string;
  store_id: string;
  zone_code: string;
  zone_name: string;
  zone_type: string | null;
  floor_level: number;
  area_sqm: number | null;
  capacity: number | null;
  coordinates: Record<string, any> | null;
  is_active: boolean;
  created_at: string;
}

/**
 * 구역 일별 메트릭
 */
export interface ZoneDailyMetric {
  id: string;
  store_id: string;
  zone_id: string;
  date: string;
  total_visitors: number;
  unique_visitors: number;
  avg_dwell_seconds: number;
  total_dwell_seconds: number;
  conversion_count: number;
  revenue_attributed: number;
  heatmap_intensity: number;
  peak_hour: number;
  zones_dim?: ZoneDim;
}

/**
 * 일별 KPI
 */
export interface DailyKPI {
  id: string;
  store_id: string;
  date: string;
  total_visitors: number;
  unique_visitors: number;
  total_revenue: number;
  total_transactions: number;
  conversion_rate: number;
  sales_per_sqm: number;
  avg_transaction_value: number;
  avg_visit_duration_seconds: number;
}

/**
 * 매장 방문 기록
 */
export interface StoreVisit {
  id: string;
  store_id: string;
  visit_date: string;
  exit_date: string | null;
  duration_minutes: number | null;
  zones_visited: string[];
  zone_durations: Record<string, number>;
  made_purchase: boolean;
  purchase_amount: number | null;
}

/**
 * 데이터 소스
 */
export interface DataSource {
  id: string;
  store_id: string;
  name: string;
  type: string;
  status: string;
  last_sync_at: string | null;
  record_count: number;
}
