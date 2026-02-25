// ============================================================================
// Phase 9: API Provider Constants
// ============================================================================
// API 연동에 필요한 프로바이더, 인증, 동기화 관련 상수 정의
// ============================================================================

import {
  DollarSign,
  Users,
  Package,
  ShoppingCart,
  BarChart3,
  Activity,
  Settings,
  Key,
  Shield,
  Lock,
  Cloud,
  type LucideIcon,
} from 'lucide-react';

// ============================================================================
// Provider Definitions
// ============================================================================

export interface ProviderConfig {
  value: string;
  label: string;
  icon?: LucideIcon;
  description?: string;
  defaultAuthType?: string;
  docsUrl?: string;
  category?: string[];
}

export const PROVIDERS: readonly ProviderConfig[] = [
  {
    value: 'toast',
    label: 'Toast POS',
    description: '레스토랑 POS 시스템',
    defaultAuthType: 'api_key',
    docsUrl: 'https://doc.toasttab.com/openapi',
    category: ['pos'],
  },
  {
    value: 'square',
    label: 'Square',
    description: '결제 및 POS 플랫폼',
    defaultAuthType: 'oauth2',
    docsUrl: 'https://developer.squareup.com/docs',
    category: ['pos', 'crm'],
  },
  {
    value: 'shopify',
    label: 'Shopify',
    description: '이커머스 플랫폼',
    defaultAuthType: 'api_key',
    docsUrl: 'https://shopify.dev/docs/api',
    category: ['ecommerce'],
  },
  {
    value: 'stripe',
    label: 'Stripe',
    description: '결제 처리 플랫폼',
    defaultAuthType: 'bearer',
    docsUrl: 'https://stripe.com/docs/api',
    category: ['pos', 'ecommerce'],
  },
  {
    value: 'lightspeed',
    label: 'Lightspeed',
    description: '소매/레스토랑 POS',
    defaultAuthType: 'oauth2',
    docsUrl: 'https://developers.lightspeedhq.com',
    category: ['pos', 'erp'],
  },
  {
    value: 'clover',
    label: 'Clover POS',
    description: '클로버 POS 시스템',
    defaultAuthType: 'oauth2',
    docsUrl: 'https://docs.clover.com/docs',
    category: ['pos'],
  },
  {
    value: 'hubspot',
    label: 'HubSpot CRM',
    description: '마케팅 및 CRM',
    defaultAuthType: 'bearer',
    docsUrl: 'https://developers.hubspot.com/docs/api',
    category: ['crm'],
  },
  {
    value: 'salesforce',
    label: 'Salesforce',
    description: 'CRM 플랫폼',
    defaultAuthType: 'oauth2',
    docsUrl: 'https://developer.salesforce.com/docs',
    category: ['crm'],
  },
  {
    value: 'xero',
    label: 'Xero',
    description: '회계 소프트웨어',
    defaultAuthType: 'oauth2',
    docsUrl: 'https://developer.xero.com/documentation',
    category: ['erp'],
  },
  {
    value: 'quickbooks',
    label: 'QuickBooks',
    description: '회계 및 재무 관리',
    defaultAuthType: 'oauth2',
    docsUrl: 'https://developer.intuit.com/app/developer',
    category: ['erp'],
  },
  {
    value: 'generic',
    label: 'Generic API',
    description: '일반 REST API',
    defaultAuthType: 'api_key',
    category: ['custom'],
  },
  {
    value: 'custom',
    label: 'Custom',
    description: '커스텀 API 연동',
    defaultAuthType: 'none',
    category: ['custom'],
  },
] as const;

// ============================================================================
// Data Category Definitions
// ============================================================================

export interface DataCategoryConfig {
  value: string;
  label: string;
  icon: LucideIcon;
  description?: string;
  targetTables?: string[];
}

export const DATA_CATEGORIES: readonly DataCategoryConfig[] = [
  {
    value: 'pos',
    label: 'POS / 매출',
    icon: DollarSign,
    description: '결제 및 거래 데이터',
    targetTables: ['transactions', 'line_items', 'payments'],
  },
  {
    value: 'crm',
    label: 'CRM / 고객',
    icon: Users,
    description: '고객 및 회원 데이터',
    targetTables: ['customers', 'customer_segments'],
  },
  {
    value: 'erp',
    label: 'ERP / 재고',
    icon: Package,
    description: '재고 및 공급망 데이터',
    targetTables: ['inventory', 'stock_movements', 'suppliers'],
  },
  {
    value: 'ecommerce',
    label: '이커머스',
    icon: ShoppingCart,
    description: '온라인 쇼핑 데이터',
    targetTables: ['orders', 'carts', 'products'],
  },
  {
    value: 'analytics',
    label: '분석',
    icon: BarChart3,
    description: '분석 및 리포트 데이터',
    targetTables: ['events', 'pageviews', 'conversions'],
  },
  {
    value: 'sensor',
    label: '센서 / IoT',
    icon: Activity,
    description: 'IoT 및 센서 데이터',
    targetTables: ['visits', 'zone_transitions', 'sensor_events'],
  },
  {
    value: 'custom',
    label: '커스텀',
    icon: Settings,
    description: '사용자 정의 데이터',
    targetTables: [],
  },
] as const;

// ============================================================================
// Authentication Type Definitions
// ============================================================================

export interface AuthTypeConfig {
  value: string;
  label: string;
  icon: LucideIcon;
  description?: string;
  requiredFields: string[];
  optionalFields?: string[];
}

export const AUTH_TYPES: readonly AuthTypeConfig[] = [
  {
    value: 'none',
    label: '인증 없음',
    icon: Cloud,
    description: '공개 API (인증 불필요)',
    requiredFields: [],
  },
  {
    value: 'api_key',
    label: 'API Key',
    icon: Key,
    description: 'API 키 인증',
    requiredFields: ['api_key'],
    optionalFields: ['header_name'],
  },
  {
    value: 'bearer',
    label: 'Bearer Token',
    icon: Shield,
    description: 'Bearer 토큰 인증',
    requiredFields: ['token'],
  },
  {
    value: 'basic',
    label: 'Basic Auth',
    icon: Lock,
    description: 'HTTP Basic 인증',
    requiredFields: ['username', 'password'],
  },
  {
    value: 'oauth2',
    label: 'OAuth 2.0',
    icon: Shield,
    description: 'OAuth 2.0 인증',
    requiredFields: ['client_id', 'client_secret'],
    optionalFields: ['access_token', 'refresh_token', 'token_url', 'expires_at'],
  },
] as const;

// ============================================================================
// Sync Frequency / Interval Definitions
// ============================================================================

export interface SyncIntervalConfig {
  value: string;
  label: string;
  cronExpression?: string;
  description?: string;
  intervalMs?: number;
}

export const SYNC_INTERVALS: readonly SyncIntervalConfig[] = [
  {
    value: 'manual',
    label: '수동',
    description: '수동으로 동기화',
    intervalMs: 0,
  },
  {
    value: 'realtime',
    label: '실시간',
    description: '웹훅 또는 스트리밍',
    intervalMs: 0,
  },
  {
    value: 'every_5_min',
    label: '5분마다',
    cronExpression: '*/5 * * * *',
    description: '5분 간격으로 동기화',
    intervalMs: 5 * 60 * 1000,
  },
  {
    value: 'every_15_min',
    label: '15분마다',
    cronExpression: '*/15 * * * *',
    description: '15분 간격으로 동기화',
    intervalMs: 15 * 60 * 1000,
  },
  {
    value: 'every_30_min',
    label: '30분마다',
    cronExpression: '*/30 * * * *',
    description: '30분 간격으로 동기화',
    intervalMs: 30 * 60 * 1000,
  },
  {
    value: 'hourly',
    label: '매시간',
    cronExpression: '0 * * * *',
    description: '매시간 정각에 동기화',
    intervalMs: 60 * 60 * 1000,
  },
  {
    value: 'every_6_hours',
    label: '6시간마다',
    cronExpression: '0 */6 * * *',
    description: '6시간 간격으로 동기화',
    intervalMs: 6 * 60 * 60 * 1000,
  },
  {
    value: 'daily',
    label: '매일',
    cronExpression: '0 0 * * *',
    description: '매일 자정에 동기화',
    intervalMs: 24 * 60 * 60 * 1000,
  },
  {
    value: 'weekly',
    label: '매주',
    cronExpression: '0 0 * * 0',
    description: '매주 일요일 자정에 동기화',
    intervalMs: 7 * 24 * 60 * 60 * 1000,
  },
] as const;

// ============================================================================
// Target Table Definitions
// ============================================================================

export interface TargetTableConfig {
  value: string;
  label: string;
  category: string;
  description?: string;
  requiredFields?: string[];
}

export const TARGET_TABLES: readonly TargetTableConfig[] = [
  {
    value: 'transactions',
    label: '거래/매출',
    category: 'pos',
    description: '매출 거래 데이터',
    requiredFields: ['transaction_id', 'transaction_date', 'total_amount'],
  },
  {
    value: 'line_items',
    label: '거래 상세',
    category: 'pos',
    description: '거래 품목 상세',
    requiredFields: ['transaction_id', 'product_id', 'quantity', 'unit_price'],
  },
  {
    value: 'payments',
    label: '결제',
    category: 'pos',
    description: '결제 정보',
    requiredFields: ['payment_id', 'transaction_id', 'payment_method', 'amount'],
  },
  {
    value: 'customers',
    label: '고객',
    category: 'crm',
    description: '고객 마스터 데이터',
    requiredFields: ['customer_id'],
  },
  {
    value: 'products',
    label: '상품',
    category: 'pos',
    description: '상품 마스터 데이터',
    requiredFields: ['product_id', 'name'],
  },
  {
    value: 'inventory',
    label: '재고',
    category: 'erp',
    description: '재고 현황',
    requiredFields: ['product_id', 'quantity'],
  },
  {
    value: 'visits',
    label: '방문',
    category: 'sensor',
    description: '매장 방문 데이터',
    requiredFields: ['visit_id', 'visitor_id', 'entry_time'],
  },
  {
    value: 'zone_transitions',
    label: '구역 이동',
    category: 'sensor',
    description: '구역 이동 추적',
    requiredFields: ['visitor_id', 'zone_id', 'timestamp'],
  },
  {
    value: 'orders',
    label: '주문',
    category: 'ecommerce',
    description: '온라인 주문 데이터',
    requiredFields: ['order_id', 'customer_id', 'order_date', 'total_amount'],
  },
] as const;

// ============================================================================
// Transform Function Definitions
// ============================================================================

export interface TransformFunctionConfig {
  value: string;
  label: string;
  description?: string;
  inputType?: string;
  outputType?: string;
}

export const TRANSFORM_FUNCTIONS: readonly TransformFunctionConfig[] = [
  {
    value: 'direct',
    label: '그대로',
    description: '변환 없이 그대로 사용',
  },
  {
    value: 'to_string',
    label: '문자열',
    description: '문자열로 변환',
    outputType: 'string',
  },
  {
    value: 'to_integer',
    label: '정수',
    description: '정수로 변환',
    outputType: 'integer',
  },
  {
    value: 'to_decimal',
    label: '소수',
    description: '소수로 변환',
    outputType: 'decimal',
  },
  {
    value: 'to_boolean',
    label: '불리언',
    description: '참/거짓으로 변환',
    outputType: 'boolean',
  },
  {
    value: 'to_date',
    label: '날짜',
    description: '날짜로 변환 (YYYY-MM-DD)',
    outputType: 'date',
  },
  {
    value: 'to_timestamp',
    label: '타임스탬프',
    description: 'ISO 8601 타임스탬프로 변환',
    outputType: 'timestamp',
  },
  {
    value: 'to_lowercase',
    label: '소문자',
    description: '소문자로 변환',
    outputType: 'string',
  },
  {
    value: 'to_uppercase',
    label: '대문자',
    description: '대문자로 변환',
    outputType: 'string',
  },
  {
    value: 'to_array',
    label: '배열',
    description: '배열로 변환',
    outputType: 'array',
  },
  {
    value: 'cents_to_decimal',
    label: '센트→소수',
    description: '센트 단위를 달러 단위로 변환',
    inputType: 'integer',
    outputType: 'decimal',
  },
  {
    value: 'unix_to_date',
    label: 'Unix→날짜',
    description: 'Unix 타임스탬프를 날짜로 변환',
    inputType: 'integer',
    outputType: 'date',
  },
  {
    value: 'unix_to_timestamp',
    label: 'Unix→타임스탬프',
    description: 'Unix 타임스탬프를 ISO 타임스탬프로 변환',
    inputType: 'integer',
    outputType: 'timestamp',
  },
  {
    value: 'json_extract',
    label: 'JSON 추출',
    description: 'JSON 경로에서 값 추출',
    inputType: 'object',
  },
  {
    value: 'split_first',
    label: '첫번째 분할',
    description: '구분자로 분할 후 첫번째 값',
    inputType: 'string',
    outputType: 'string',
  },
  {
    value: 'split_last',
    label: '마지막 분할',
    description: '구분자로 분할 후 마지막 값',
    inputType: 'string',
    outputType: 'string',
  },
] as const;

// ============================================================================
// HTTP Methods
// ============================================================================

export const HTTP_METHODS = [
  { value: 'GET', label: 'GET' },
  { value: 'POST', label: 'POST' },
  { value: 'PUT', label: 'PUT' },
  { value: 'PATCH', label: 'PATCH' },
  { value: 'DELETE', label: 'DELETE' },
] as const;

// ============================================================================
// Pagination Types
// ============================================================================

export interface PaginationTypeConfig {
  value: string;
  label: string;
  description?: string;
  configFields?: string[];
}

export const PAGINATION_TYPES: readonly PaginationTypeConfig[] = [
  {
    value: 'none',
    label: '페이지네이션 없음',
    description: '단일 응답',
    configFields: [],
  },
  {
    value: 'offset',
    label: 'Offset 기반',
    description: 'offset & limit 파라미터 사용',
    configFields: ['page_param', 'limit_param', 'default_limit'],
  },
  {
    value: 'page',
    label: '페이지 기반',
    description: 'page & per_page 파라미터 사용',
    configFields: ['page_param', 'limit_param', 'default_limit'],
  },
  {
    value: 'cursor',
    label: '커서 기반',
    description: '커서 토큰으로 다음 페이지 요청',
    configFields: ['cursor_param', 'cursor_field', 'cursor_format'],
  },
  {
    value: 'link',
    label: 'Link 헤더',
    description: 'RFC 5988 Link 헤더 기반',
    configFields: ['link_header', 'rel'],
  },
] as const;

// ============================================================================
// Sync Modes
// ============================================================================

export const SYNC_MODES = [
  {
    value: 'full',
    label: '전체 동기화',
    description: '모든 데이터를 새로 가져옴',
  },
  {
    value: 'incremental',
    label: '증분 동기화',
    description: '마지막 동기화 이후 변경된 데이터만',
  },
  {
    value: 'append',
    label: '추가 전용',
    description: '새 데이터만 추가 (업데이트 없음)',
  },
] as const;

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * 프로바이더 설정 조회
 */
export function getProviderConfig(provider: string): ProviderConfig | undefined {
  return PROVIDERS.find((p) => p.value === provider);
}

/**
 * 데이터 카테고리 설정 조회
 */
export function getDataCategoryConfig(category: string): DataCategoryConfig | undefined {
  return DATA_CATEGORIES.find((c) => c.value === category);
}

/**
 * 인증 타입 설정 조회
 */
export function getAuthTypeConfig(authType: string): AuthTypeConfig | undefined {
  return AUTH_TYPES.find((a) => a.value === authType);
}

/**
 * 동기화 주기 설정 조회
 */
export function getSyncIntervalConfig(interval: string): SyncIntervalConfig | undefined {
  return SYNC_INTERVALS.find((s) => s.value === interval);
}

/**
 * 대상 테이블 설정 조회
 */
export function getTargetTableConfig(table: string): TargetTableConfig | undefined {
  return TARGET_TABLES.find((t) => t.value === table);
}

/**
 * 카테고리별 대상 테이블 필터링
 */
export function getTargetTablesByCategory(category: string): TargetTableConfig[] {
  return TARGET_TABLES.filter((t) => t.category === category);
}

/**
 * 카테고리별 프로바이더 필터링
 */
export function getProvidersByCategory(category: string): ProviderConfig[] {
  return PROVIDERS.filter((p) => p.category?.includes(category));
}
