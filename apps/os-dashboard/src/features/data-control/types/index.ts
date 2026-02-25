// ============================================================================
// Data Control Tower Types
// ============================================================================

// ============================================================================
// Phase 7: API Connector Types
// ============================================================================

export type AuthType = 'none' | 'api_key' | 'bearer' | 'basic' | 'oauth2';

export type DataCategory = 'pos' | 'crm' | 'erp' | 'ecommerce' | 'analytics' | 'sensor' | 'custom' | 'weather' | 'holidays';

export type ConnectionStatus = 'active' | 'inactive' | 'error' | 'testing';

export type SyncFrequency = 'realtime' | 'every_5_min' | 'every_15_min' | 'every_30_min' | 'hourly' | 'every_6_hours' | 'daily' | 'weekly' | 'manual' | 'custom';

export type PaginationType = 'none' | 'offset' | 'cursor' | 'page' | 'link';

export type TransformType =
  | 'to_string'
  | 'to_integer'
  | 'to_decimal'
  | 'to_boolean'
  | 'to_date'
  | 'to_timestamp'
  | 'to_lowercase'
  | 'to_uppercase'
  | 'to_array'
  | 'cents_to_decimal'
  | 'unix_to_date'
  | 'unix_to_timestamp'
  | 'direct';

export interface FieldMapping {
  source: string;
  target: string;
  transform?: TransformType;
  required?: boolean;
}

export interface AuthConfig {
  // API Key
  api_key?: string;
  header_name?: string;
  // Bearer Token
  token?: string;
  // Basic Auth
  username?: string;
  password?: string;
  // OAuth2
  access_token?: string;
  refresh_token?: string;
  expires_at?: string;
  client_id?: string;
  client_secret?: string;
  token_url?: string;
}

export interface PaginationConfig {
  page_param?: string;
  limit_param?: string;
  default_limit?: number;
  cursor_param?: string;
  cursor_field?: string;
  cursor_format?: string;
  link_header?: string;
  rel?: string;
}

export interface SyncConfig {
  mode?: 'full' | 'incremental' | 'append';
  incremental_key?: string;
  batch_size?: number;
}

export interface ApiConnection {
  id: string;
  org_id?: string;
  store_id?: string;
  user_id: string;
  name: string;
  description?: string;
  url: string;
  method?: string;
  headers?: Record<string, string>;
  auth_type: AuthType;
  auth_config?: AuthConfig;
  provider?: string;
  data_category?: DataCategory;
  connection_category?: 'business' | 'context' | 'analytics';
  is_system_managed?: boolean;
  display_order?: number;
  icon_name?: string;
  field_mappings?: FieldMapping[];
  target_table?: string;
  response_data_path?: string;
  pagination_type?: PaginationType;
  pagination_config?: PaginationConfig;
  sync_frequency?: SyncFrequency;
  sync_cron?: string;
  sync_config?: SyncConfig;
  status: ConnectionStatus;
  is_active: boolean;
  last_sync?: string;
  last_tested_at?: string;
  last_error?: string;
  total_records_synced?: number;
  last_sync_duration_ms?: number;
  next_scheduled_sync?: string;
  is_credentials_encrypted?: boolean;
  retry_count?: number;
  max_retries?: number;
  created_at: string;
  updated_at?: string;
}

export interface ApiMappingTemplate {
  id: string;
  provider: string;
  data_category: DataCategory;
  target_table: string;
  name: string;
  description?: string;
  version: string;
  default_endpoint?: string;
  default_method?: string;
  default_headers?: Record<string, string>;
  response_data_path?: string;
  field_mappings: FieldMapping[];
  pagination_type?: PaginationType;
  pagination_config?: PaginationConfig;
  suggested_auth_type?: AuthType;
  auth_config_hints?: Record<string, string>;
  is_official: boolean;
  is_active: boolean;
  created_at: string;
  updated_at?: string;
}

export type SyncType = 'scheduled' | 'manual' | 'retry';

export interface ApiSyncLog {
  id: string;
  sync_endpoint_id?: string;
  api_connection_id: string;
  sync_type: SyncType;
  started_at: string;
  completed_at?: string;
  fetch_completed_at?: string;
  processing_completed_at?: string;
  duration_ms?: number;
  status: 'running' | 'success' | 'partial' | 'failed';
  records_fetched: number;
  records_created: number;
  records_updated: number;
  records_failed: number;
  error_type?: string;
  error_message?: string;
  error_details?: any;
  request_url?: string;
  request_headers?: Record<string, string>;
  response_status?: number;
  response_headers?: Record<string, string>;
  response_size_bytes?: number;
  raw_import_id?: string;
  etl_run_id?: string;
  org_id?: string;
  created_at: string;
}

export interface ConnectionTestResult {
  success: boolean;
  status_code?: number;
  status_text?: string;
  response_time_ms?: number;
  headers?: Record<string, string>;
  sample_data?: any[];
  record_count?: number;
  detected_fields?: string[];
  message?: string;
  error?: string;
  error_details?: any;
}

export interface SyncResult {
  success: boolean;
  batch_id?: string;
  records_fetched?: number;
  records_created?: number;
  records_failed?: number;
  duration_ms?: number;
  message?: string;
  error?: string;
}

export interface MappingPreview {
  original: any;
  mapped: any;
}

export interface ApiConnectionsDashboard {
  success: boolean;
  connections: ApiConnection[];
  summary: {
    total: number;
    active: number;
    error: number;
    inactive: number;
    by_category: Record<string, number>;
  };
}

// Provider 옵션 상수
export const API_PROVIDERS = [
  { value: 'toast', label: 'Toast POS' },
  { value: 'square', label: 'Square' },
  { value: 'shopify', label: 'Shopify' },
  { value: 'stripe', label: 'Stripe' },
  { value: 'lightspeed', label: 'Lightspeed' },
  { value: 'clover', label: 'Clover POS' },
  { value: 'hubspot', label: 'HubSpot CRM' },
  { value: 'salesforce', label: 'Salesforce' },
  { value: 'generic', label: 'Generic API' },
  { value: 'custom', label: 'Custom' },
] as const;

export const DATA_CATEGORIES = [
  { value: 'pos', label: 'POS / 매출', icon: 'DollarSign' },
  { value: 'crm', label: 'CRM / 고객', icon: 'Users' },
  { value: 'erp', label: 'ERP / 재고', icon: 'Package' },
  { value: 'ecommerce', label: '이커머스', icon: 'ShoppingCart' },
  { value: 'analytics', label: '분석', icon: 'BarChart3' },
  { value: 'sensor', label: '센서 / IoT', icon: 'Activity' },
  { value: 'custom', label: '커스텀', icon: 'Settings' },
  { value: 'weather', label: '날씨', icon: 'CloudSun' },
  { value: 'holidays', label: '공휴일/이벤트', icon: 'Calendar' },
] as const;

export const AUTH_TYPES = [
  { value: 'none', label: '인증 없음' },
  { value: 'api_key', label: 'API Key' },
  { value: 'bearer', label: 'Bearer Token' },
  { value: 'basic', label: 'Basic Auth' },
  { value: 'oauth2', label: 'OAuth 2.0' },
] as const;

export const SYNC_FREQUENCIES = [
  { value: 'manual', label: '수동' },
  { value: 'hourly', label: '매시간' },
  { value: 'daily', label: '매일' },
  { value: 'weekly', label: '매주' },
  { value: 'realtime', label: '실시간' },
] as const;

export const TARGET_TABLES = [
  { value: 'transactions', label: '거래/매출', category: 'pos' },
  { value: 'line_items', label: '거래 상세', category: 'pos' },
  { value: 'customers', label: '고객', category: 'crm' },
  { value: 'products', label: '상품', category: 'pos' },
  { value: 'inventory_levels', label: '재고 수준', category: 'erp' },
  { value: 'inventory_movements', label: '재고 이동', category: 'erp' },
  { value: 'visits', label: '방문', category: 'sensor' },
  { value: 'zone_events', label: '구역 이벤트', category: 'sensor' },
] as const;

// ============================================================================
// ERP API Provider 옵션
// ============================================================================
export const ERP_PROVIDERS = [
  { value: 'sap', label: 'SAP S/4HANA' },
  { value: 'sap_b1', label: 'SAP Business One' },
  { value: 'netsuite', label: 'Oracle NetSuite' },
  { value: 'dynamics', label: 'Microsoft Dynamics 365' },
  { value: 'odoo', label: 'Odoo ERP' },
  { value: 'quickbooks', label: 'QuickBooks' },
  { value: 'zoho', label: 'Zoho Inventory' },
  { value: 'shopify', label: 'Shopify Inventory' },
  { value: 'generic', label: 'Generic Inventory API' },
  { value: 'custom', label: 'Custom ERP' },
] as const;

// ============================================================================
// ERP API Mapping Templates
// ============================================================================
export const ERP_API_TEMPLATES: Record<string, {
  provider: string;
  data_category: DataCategory;
  target_table: string;
  name: string;
  description: string;
  default_endpoint: string;
  default_method: string;
  response_data_path: string;
  field_mappings: FieldMapping[];
  pagination_type: PaginationType;
  pagination_config: PaginationConfig;
  suggested_auth_type: AuthType;
}> = {
  // SAP S/4HANA 재고 레벨
  sap_inventory_levels: {
    provider: 'sap',
    data_category: 'erp',
    target_table: 'inventory_levels',
    name: 'SAP S/4HANA 재고 수준',
    description: 'SAP S/4HANA OData API에서 재고 수준 데이터 연동',
    default_endpoint: '/sap/opu/odata/sap/API_PRODUCT_STOCK_SRV/A_ProductStock',
    default_method: 'GET',
    response_data_path: 'd.results',
    field_mappings: [
      { source: 'Material', target: 'product_id', transform: 'to_string', required: true },
      { source: 'MatlWrhsStkQtyInMatlBaseUnit', target: 'current_stock', transform: 'to_integer', required: true },
      { source: 'ReorderPoint', target: 'optimal_stock', transform: 'to_integer' },
      { source: 'SafetyStock', target: 'minimum_stock', transform: 'to_integer' },
      { source: 'LastChangeDateTime', target: 'last_updated', transform: 'to_timestamp' },
    ],
    pagination_type: 'offset',
    pagination_config: { page_param: '$skip', limit_param: '$top', default_limit: 1000 },
    suggested_auth_type: 'basic',
  },

  // SAP 재고 이동
  sap_inventory_movements: {
    provider: 'sap',
    data_category: 'erp',
    target_table: 'inventory_movements',
    name: 'SAP S/4HANA 재고 이동',
    description: 'SAP S/4HANA에서 입출고 내역 연동',
    default_endpoint: '/sap/opu/odata/sap/API_MATERIAL_DOCUMENT_SRV/A_MaterialDocumentItem',
    default_method: 'GET',
    response_data_path: 'd.results',
    field_mappings: [
      { source: 'Material', target: 'product_id', transform: 'to_string', required: true },
      { source: 'Plant', target: 'store_id', transform: 'to_string' },
      { source: 'GoodsMovementType', target: 'movement_type', transform: 'to_string', required: true },
      { source: 'QuantityInBaseUnit', target: 'quantity', transform: 'to_integer', required: true },
      { source: 'PostingDate', target: 'moved_at', transform: 'to_timestamp', required: true },
      { source: 'MaterialDocumentHeaderText', target: 'reason', transform: 'to_string' },
      { source: 'MaterialDocument', target: 'reference_id', transform: 'to_string' },
    ],
    pagination_type: 'offset',
    pagination_config: { page_param: '$skip', limit_param: '$top', default_limit: 500 },
    suggested_auth_type: 'basic',
  },

  // NetSuite 재고 레벨
  netsuite_inventory_levels: {
    provider: 'netsuite',
    data_category: 'erp',
    target_table: 'inventory_levels',
    name: 'NetSuite 재고 수준',
    description: 'Oracle NetSuite REST API에서 재고 수준 데이터 연동',
    default_endpoint: '/services/rest/record/v1/inventoryItem',
    default_method: 'GET',
    response_data_path: 'items',
    field_mappings: [
      { source: 'id', target: 'product_id', transform: 'to_string', required: true },
      { source: 'quantityOnHand', target: 'current_stock', transform: 'to_integer', required: true },
      { source: 'reorderPoint', target: 'optimal_stock', transform: 'to_integer' },
      { source: 'safetyStockLevel', target: 'minimum_stock', transform: 'to_integer' },
      { source: 'averageWeeklyDemand', target: 'weekly_demand', transform: 'to_decimal' },
      { source: 'lastModifiedDate', target: 'last_updated', transform: 'to_timestamp' },
    ],
    pagination_type: 'offset',
    pagination_config: { page_param: 'offset', limit_param: 'limit', default_limit: 1000 },
    suggested_auth_type: 'oauth2',
  },

  // NetSuite 재고 이동
  netsuite_inventory_movements: {
    provider: 'netsuite',
    data_category: 'erp',
    target_table: 'inventory_movements',
    name: 'NetSuite 재고 이동',
    description: 'NetSuite에서 입출고 및 재고 조정 내역 연동',
    default_endpoint: '/services/rest/record/v1/inventoryadjustment',
    default_method: 'GET',
    response_data_path: 'items',
    field_mappings: [
      { source: 'item.id', target: 'product_id', transform: 'to_string', required: true },
      { source: 'location.id', target: 'store_id', transform: 'to_string' },
      { source: 'adjustmentType', target: 'movement_type', transform: 'to_string', required: true },
      { source: 'adjustQtyBy', target: 'quantity', transform: 'to_integer', required: true },
      { source: 'tranDate', target: 'moved_at', transform: 'to_timestamp', required: true },
      { source: 'memo', target: 'reason', transform: 'to_string' },
      { source: 'tranId', target: 'reference_id', transform: 'to_string' },
    ],
    pagination_type: 'offset',
    pagination_config: { page_param: 'offset', limit_param: 'limit', default_limit: 500 },
    suggested_auth_type: 'oauth2',
  },

  // Shopify 재고 레벨
  shopify_inventory_levels: {
    provider: 'shopify',
    data_category: 'erp',
    target_table: 'inventory_levels',
    name: 'Shopify 재고 수준',
    description: 'Shopify Admin API에서 재고 수준 데이터 연동',
    default_endpoint: '/admin/api/2024-01/inventory_levels.json',
    default_method: 'GET',
    response_data_path: 'inventory_levels',
    field_mappings: [
      { source: 'inventory_item_id', target: 'product_id', transform: 'to_string', required: true },
      { source: 'available', target: 'current_stock', transform: 'to_integer', required: true },
      { source: 'updated_at', target: 'last_updated', transform: 'to_timestamp' },
    ],
    pagination_type: 'cursor',
    pagination_config: { cursor_param: 'page_info', cursor_field: 'page_info', default_limit: 250 },
    suggested_auth_type: 'bearer',
  },

  // Generic Inventory API
  generic_inventory_levels: {
    provider: 'generic',
    data_category: 'erp',
    target_table: 'inventory_levels',
    name: 'Generic 재고 API',
    description: '범용 REST API에서 재고 수준 데이터 연동 (필드 매핑 커스터마이징 필요)',
    default_endpoint: '/api/v1/inventory',
    default_method: 'GET',
    response_data_path: 'data',
    field_mappings: [
      { source: 'product_id', target: 'product_id', transform: 'to_string', required: true },
      { source: 'quantity', target: 'current_stock', transform: 'to_integer', required: true },
      { source: 'reorder_level', target: 'optimal_stock', transform: 'to_integer' },
      { source: 'min_stock', target: 'minimum_stock', transform: 'to_integer' },
      { source: 'weekly_sales', target: 'weekly_demand', transform: 'to_decimal' },
      { source: 'updated_at', target: 'last_updated', transform: 'to_timestamp' },
    ],
    pagination_type: 'offset',
    pagination_config: { page_param: 'page', limit_param: 'per_page', default_limit: 100 },
    suggested_auth_type: 'bearer',
  },

  // Generic 재고 이동
  generic_inventory_movements: {
    provider: 'generic',
    data_category: 'erp',
    target_table: 'inventory_movements',
    name: 'Generic 재고 이동 API',
    description: '범용 REST API에서 입출고 내역 연동',
    default_endpoint: '/api/v1/inventory/movements',
    default_method: 'GET',
    response_data_path: 'data',
    field_mappings: [
      { source: 'product_id', target: 'product_id', transform: 'to_string', required: true },
      { source: 'store_id', target: 'store_id', transform: 'to_string' },
      { source: 'type', target: 'movement_type', transform: 'to_string', required: true },
      { source: 'quantity', target: 'quantity', transform: 'to_integer', required: true },
      { source: 'timestamp', target: 'moved_at', transform: 'to_timestamp', required: true },
      { source: 'previous_qty', target: 'previous_stock', transform: 'to_integer' },
      { source: 'new_qty', target: 'new_stock', transform: 'to_integer' },
      { source: 'reason', target: 'reason', transform: 'to_string' },
      { source: 'reference', target: 'reference_id', transform: 'to_string' },
    ],
    pagination_type: 'offset',
    pagination_config: { page_param: 'page', limit_param: 'per_page', default_limit: 100 },
    suggested_auth_type: 'bearer',
  },
};

export const TRANSFORM_TYPES = [
  { value: 'direct', label: '그대로' },
  { value: 'to_string', label: '문자열' },
  { value: 'to_integer', label: '정수' },
  { value: 'to_decimal', label: '소수' },
  { value: 'to_boolean', label: '불리언' },
  { value: 'to_date', label: '날짜' },
  { value: 'to_timestamp', label: '타임스탬프' },
  { value: 'to_lowercase', label: '소문자' },
  { value: 'to_uppercase', label: '대문자' },
  { value: 'to_array', label: '배열' },
  { value: 'cents_to_decimal', label: '센트→소수' },
  { value: 'unix_to_date', label: 'Unix→날짜' },
  { value: 'unix_to_timestamp', label: 'Unix→타임스탬프' },
] as const;

export interface DataSourceStatus {
  name: string;
  description: string;
  status: 'active' | 'inactive' | 'error';
  last_sync: string | null;
  record_count?: number;
}

export interface DataSourceCoverage {
  available: boolean;
  record_count: number;
  completeness?: number;
  label: string;
}

export interface DataQualityScore {
  success: boolean;
  store_id: string;
  store_name?: string;
  date?: string;
  overall_score: number;
  confidence_level: 'high' | 'medium' | 'low';
  coverage: {
    pos: DataSourceCoverage;
    sensor: DataSourceCoverage;
    crm: DataSourceCoverage;
    product: DataSourceCoverage;
    erp?: DataSourceCoverage;
    zone?: DataSourceCoverage;
    raw_imports?: {
      total_count: number;
      completed_count: number;
      failed_count: number;
      pending_count: number;
      latest_import: string | null;
    };
  };
  warnings: DataWarning[] | Array<{ type: string; source: string; severity: string; message: string }>;
  warning_count: number;
  calculated_at?: string;
}

export interface DataWarning {
  type: 'missing' | 'stale' | 'anomaly';
  source: string;
  severity: 'high' | 'medium' | 'low';
  message: string;
  affected_metrics: string[];
}

export interface RawImport {
  id: string;
  source_type: string;
  source_name: string | null;
  data_type: string | null;
  row_count: number;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  error_message: string | null;
  created_at: string;
  completed_at: string | null;
}

export interface ETLRun {
  id: string;
  etl_function: string;
  status: 'running' | 'completed' | 'failed' | 'partial';
  input_record_count: number;
  output_record_count: number;
  duration_ms: number | null;
  started_at: string;
  completed_at: string | null;
}

export interface DataSourceFlow {
  source: 'pos' | 'sensor' | 'customer' | 'inventory' | 'import';
  label: string;
  icon: string;
  inputCount: number;
  outputTable: string;
  outputCount: number;
  kpiConnected: boolean;
  status: 'active' | 'inactive' | 'warning' | 'error';
  lastSync: string | null;
  trend?: 'up' | 'down' | 'stable';
}

export interface PipelineHealth {
  status: 'healthy' | 'warning' | 'error' | 'unknown';
  message: string;
  warnings: string[];
}

export interface PipelineStats {
  raw_imports: {
    total: number;
    completed: number;
    failed: number;
    pending: number;
  };
  etl_runs?: {
    total: number;
    completed: number;
    failed: number;
    running: number;
  };
  l2_records: number;
  l3_records: number;
  // 새로운 필드
  data_flows?: DataSourceFlow[];
  pipeline_health?: PipelineHealth;
  today_processed?: {
    input: number;
    transformed: number;
    aggregated: number;
    failed: number;
  };
}

export interface DataControlTowerStatus {
  success: boolean;
  store_id: string;
  quality_score: DataQualityScore;
  data_sources: Record<string, DataSourceStatus>;
  recent_imports: RawImport[];
  recent_etl_runs: ETLRun[];
  pipeline_stats: PipelineStats;
  queried_at: string;
}

export interface KPILineage {
  success: boolean;
  kpi_record: {
    id: string;
    date: string;
    store_id: string;
    [key: string]: any;
  };
  lineage: {
    source_trace: {
      raw_import_ids?: string[];
      source_tables?: string[];
      etl_run_id?: string;
      calculated_at?: string;
    };
    etl_run: ETLRun | null;
    raw_imports: RawImport[];
    lineage_path: {
      layer: string;
      table?: string;
      tables?: string[];
      description: string;
    }[];
  };
  metadata: {
    queried_at: string;
    kpi_table: string;
  };
}

// ============================================================================
// Context Data Sources Types (날씨, 이벤트, 환율, 트렌드 등)
// ============================================================================

export type ConnectionCategory = 'business' | 'context' | 'analytics';

export interface ContextDataSource {
  id: string;
  name: string;
  type: string;
  provider: string | null;
  data_category: string | null;
  connection_category: ConnectionCategory;
  is_system_managed: boolean;
  is_active: boolean;
  status: ConnectionStatus;
  icon_name: string | null;
  description: string | null;
  last_sync: string | null;
  total_records_synced: number;
  display_order: number;
}

export interface ContextDataSummary {
  latest_date: string | null;
  record_count: number;
  avg_temperature?: number;
  upcoming_events?: number;
}

export interface AllDataSources {
  success: boolean;
  business: ContextDataSource[];
  context: ContextDataSource[];
  business_count: number;
  context_count: number;
}

export interface ContextDataSourcesResult {
  success: boolean;
  connections: ContextDataSource[];
  weather_summary: ContextDataSummary;
  events_summary: ContextDataSummary;
}

// Context Data Category 상수
export const CONTEXT_DATA_CATEGORIES = [
  { value: 'weather', label: '날씨', icon: 'CloudSun' },
  { value: 'holidays', label: '공휴일/이벤트', icon: 'Calendar' },
  { value: 'exchange', label: '환율', icon: 'TrendingUp' },
  { value: 'trends', label: '트렌드', icon: 'BarChart3' },
] as const;

// Context Provider 상수
export const CONTEXT_PROVIDERS = [
  { value: 'openweathermap', label: 'OpenWeatherMap', category: 'weather' },
  { value: 'kma', label: '기상청', category: 'weather' },
  { value: 'korean_holidays', label: '공공데이터포털 공휴일', category: 'holidays' },
  { value: 'google_calendar', label: 'Google Calendar', category: 'holidays' },
  { value: 'exchange_rate_api', label: 'Exchange Rate API', category: 'exchange' },
  { value: 'google_trends', label: 'Google Trends', category: 'trends' },
] as const;
