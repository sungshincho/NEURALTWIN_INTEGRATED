/**
 * 리테일 온톨로지 시스템 타입 정의
 */

// ============== Data Source Types ==============

export type DataSourceType =
  | 'pos'
  | 'wifi'
  | 'camera'
  | 'sensor'
  | 'crm'
  | 'inventory'
  | 'external'
  | 'manual';

export type DataSourceStatus = 'active' | 'inactive' | 'error' | 'syncing';

export interface DataSource {
  id: string;
  user_id: string;
  store_id: string | null;
  name: string;
  description?: string;
  type: DataSourceType;
  status: DataSourceStatus;
  connection_config: Record<string, any>;
  schema_definition?: DataSourceSchema;
  last_sync_at: string | null;
  last_sync_status?: string;
  record_count: number;
  created_at: string;
  updated_at: string;
}

export interface DataSourceSchema {
  tables: DataSourceTable[];
}

export interface DataSourceTable {
  id?: string;
  data_source_id?: string;
  table_name: string;
  display_name?: string;
  columns: DataSourceColumn[];
  row_count?: number;
  sample_data?: any;
}

export interface DataSourceColumn {
  name: string;
  type: 'string' | 'number' | 'datetime' | 'boolean' | 'json' | 'array';
  isPrimaryKey?: boolean;
  isForeignKey?: boolean;
  required?: boolean;
  description?: string;
}

// ============== Mapping Types ==============

export interface EntityMapping {
  id: string;
  data_source_id: string;
  source_table: string;
  filter_condition?: string;
  target_entity_type_id: string;
  target_entity_type?: {
    id: string;
    name: string;
    label: string;
  };
  property_mappings: PropertyMapping[];
  label_template: string;
  is_active: boolean;
  priority: number;
  created_at: string;
  updated_at: string;
}

export interface RelationMapping {
  id: string;
  data_source_id: string;
  source_table: string;
  target_relation_type_id: string;
  target_relation_type?: {
    id: string;
    name: string;
    label: string;
  };
  source_entity_resolver: EntityResolver;
  target_entity_resolver: EntityResolver;
  property_mappings: PropertyMapping[];
  is_active: boolean;
  created_at: string;
}

export interface PropertyMapping {
  source_column: string;
  target_property: string;
  transform?: 'none' | 'uppercase' | 'lowercase' | 'number' | 'date' | 'json';
}

export interface EntityResolver {
  type: 'column' | 'lookup' | 'fixed';
  column?: string;
  lookup_table?: string;
  lookup_column?: string;
  fixed_value?: string;
}

// ============== Retail Concept Types ==============

export type RetailConceptCategory = 'behavior' | 'metric' | 'pattern' | 'rule' | 'kpi';

export interface RetailConcept {
  id: string;
  user_id?: string;
  name: string;
  display_name: string;
  category: RetailConceptCategory;
  description?: string;
  involved_entity_types: string[];
  involved_relation_types: string[];
  computation: {
    type: 'graph_traversal' | 'aggregation' | 'pattern_match' | 'time_series';
    query: string;
    parameters?: Record<string, any>;
  };
  ai_context: {
    description: string;
    benchmarks: {
      low: number;
      medium: number;
      high: number;
    };
    actionableInsights: string[];
  };
  is_system: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface RetailConceptValue {
  id: string;
  concept_id: string;
  store_id: string;
  computed_at: string;
  value: any;
  parameters?: Record<string, any>;
  valid_until?: string;
}

// ============== AI Inference Types ==============

export type RetailInferenceType =
  | 'layout_optimization'
  | 'zone_analysis'
  | 'traffic_flow'
  | 'demand_forecast'
  | 'inventory_optimization'
  | 'cross_sell'
  | 'customer_segmentation'
  | 'anomaly_detection';

export interface AIInferenceResult {
  id: string;
  user_id?: string;
  store_id: string;
  inference_type: RetailInferenceType;
  result: {
    insights: string[];
    recommendations: AIRecommendation[];
    metrics: Record<string, any>;
    confidence: number;
  };
  parameters?: Record<string, any>;
  created_at: string;
}

export interface AIRecommendation {
  title: string;
  description: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
  category: string;
  expected_impact?: string;
  action_items?: string[];
}

// ============== Computed Concepts Types ==============

export interface ZoneConversionData {
  zone_name: string;
  visitors: number;
  avg_dwell: number;
  purchases: number;
  conversion_rate: number;
}

export interface CrossSellAffinityData {
  product_a: string;
  product_b: string;
  co_purchase_count: number;
  support: number;
}

export interface InventoryTurnoverData {
  product_name: string;
  total_sold: number;
  avg_stock: number;
  turnover_rate: number;
  days_of_stock: number;
}

export interface ZoneHeatmapData {
  zone_name: string;
  hour: number;
  visit_count: number;
  avg_dwell: number;
}

export interface ComputedRetailConcepts {
  computed_at: string;
  store_id: string;
  period_days: number;
  zone_conversion_funnel: ZoneConversionData[];
  cross_sell_affinity: CrossSellAffinityData[];
  inventory_turnover: InventoryTurnoverData[];
  zone_heatmap: ZoneHeatmapData[];
  entity_summary: {
    total: number;
    by_type: Record<string, number>;
  };
  relation_summary: {
    total: number;
    by_type: Record<string, number>;
  };
}

// ============== Sync Log Types ==============

export interface DataSourceSyncLog {
  id: string;
  data_source_id: string;
  started_at: string;
  completed_at?: string;
  status: 'running' | 'completed' | 'failed' | 'cancelled';
  entities_created: number;
  entities_updated: number;
  relations_created: number;
  errors: Array<{ message: string; details?: any }>;
  triggered_by: string;
}
