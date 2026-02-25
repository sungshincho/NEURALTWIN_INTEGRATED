// ============================================================================
// 데이터 아키텍처 분류
// ============================================================================
// 
// 📥 RAW_DATA: 외부에서 업로드하는 원천 데이터 (Unified Data Import 대상)
// 📊 DERIVED_DATA: 백엔드 ETL/AI 파이프라인이 자동 생성하는 파생 데이터
//
// ⚠️ DERIVED_DATA는 CSV로 업로드하지 않고, 백엔드에서 자동 생성됩니다.
// ============================================================================

export type DataCategory = 'RAW_DATA' | 'DERIVED_DATA';

export interface DataSchema {
  type: string;
  category: DataCategory;
  columns: ColumnSchema[];
  relations?: string[];
  description?: string;
}

export interface ColumnSchema {
  name: string;
  type: 'string' | 'number' | 'date' | 'boolean' | 'array' | 'object';
  required: boolean;
  description: string;
  examples?: string[];
}

// ============================================================================
// RAW DATA SCHEMAS (외부에서 업로드하는 원천 데이터)
// ============================================================================

// 판매/거래 데이터 표준 스키마
export const SALES_SCHEMA: DataSchema = {
  type: 'sales',
  category: 'RAW_DATA',
  columns: [
    { name: 'transaction_id', type: 'string', required: false, description: '거래 고유 ID 주문번호 order', examples: ['주문번호', 'order_id', 'transaction', 'id'] },
    { name: 'timestamp', type: 'date', required: false, description: '거래 시간 기간 날짜 date', examples: ['기간', '날짜', 'date', 'time', '주문시각', 'timestamp'] },
    { name: 'product_name', type: 'string', required: true, description: '상품명 제품명 품목 product', examples: ['상품명', 'product', 'item', '품목', '제품'] },
    { name: 'product_category', type: 'string', required: false, description: '상품 카테고리 분류 category', examples: ['카테고리', 'category', '분류'] },
    { name: 'price', type: 'number', required: true, description: '판매 가격 단가 상품가격 price', examples: ['가격', 'price', '단가', '상품가격', '금액'] },
    { name: 'quantity', type: 'number', required: true, description: '판매 수량 건수 quantity count', examples: ['수량', 'quantity', '판매건수', 'count', '건수'] },
    { name: 'total_amount', type: 'number', required: false, description: '총 금액 실판매금액 total amount', examples: ['총금액', 'total', '실판매금액', 'amount', '판매금액', '실판매'] },
    { name: 'discount', type: 'number', required: false, description: '할인 금액 할인액 discount', examples: ['할인', 'discount', '할인금액', '할인액'] },
    { name: 'tax', type: 'number', required: false, description: '부가세 세금 tax', examples: ['부가세', 'tax', '세금', '부가세액'] },
    { name: 'customer_id', type: 'string', required: false, description: '고객 ID customer', examples: ['고객', 'customer', '회원'] },
    { name: 'payment_method', type: 'string', required: false, description: '결제 수단 payment', examples: ['결제', 'payment', '결제수단'] },
  ],
  relations: ['customer', 'product']
};

// Zone 위치 데이터 표준 스키마
export const ZONE_SCHEMA: DataSchema = {
  type: 'zone',
  category: 'RAW_DATA',
  columns: [
    { name: 'zone_id', type: 'string', required: true, description: 'Zone 고유 ID' },
    { name: 'zone_name', type: 'string', required: true, description: 'Zone 이름' },
    { name: 'x', type: 'number', required: true, description: 'X 좌표' },
    { name: 'y', type: 'number', required: true, description: 'Y 좌표' },
    { name: 'z', type: 'number', required: false, description: 'Z 좌표 (높이)' },
    { name: 'type', type: 'string', required: false, description: 'Zone 타입 (입구, 진열대, 계산대 등)' },
    { name: 'area', type: 'number', required: false, description: '면적 (sqm)' },
  ],
  relations: ['traffic', 'product']
};

// 고객 동선 데이터 표준 스키마
export const TRAFFIC_SCHEMA: DataSchema = {
  type: 'traffic',
  category: 'RAW_DATA',
  columns: [
    { name: 'person_id', type: 'string', required: true, description: '고객/방문자 ID' },
    { name: 'zones', type: 'array', required: true, description: '방문한 Zone 순서 배열' },
    { name: 'timestamp_start', type: 'date', required: true, description: '동선 시작 시간' },
    { name: 'timestamp_end', type: 'date', required: true, description: '동선 종료 시간' },
    { name: 'dwell_times', type: 'array', required: false, description: '각 Zone 체류 시간 배열 (초)' },
  ],
  relations: ['zone', 'customer']
};

// 상품 데이터 표준 스키마
export const PRODUCT_SCHEMA: DataSchema = {
  type: 'product',
  category: 'RAW_DATA',
  columns: [
    { name: 'product_id', type: 'string', required: true, description: '상품 고유 ID' },
    { name: 'product_name', type: 'string', required: true, description: '상품명' },
    { name: 'category', type: 'string', required: true, description: '카테고리' },
    { name: 'brand', type: 'string', required: false, description: '브랜드' },
    { name: 'price', type: 'number', required: true, description: '판매 가격' },
    { name: 'cost', type: 'number', required: false, description: '원가' },
    { name: 'sku', type: 'string', required: false, description: 'SKU 코드' },
  ],
  relations: ['sales', 'inventory']
};

// 고객 데이터 표준 스키마
export const CUSTOMER_SCHEMA: DataSchema = {
  type: 'customer',
  category: 'RAW_DATA',
  columns: [
    { name: 'customer_id', type: 'string', required: true, description: '고객 고유 ID' },
    { name: 'segment', type: 'string', required: false, description: '고객 세그먼트' },
    { name: 'join_date', type: 'date', required: false, description: '가입일' },
    { name: 'total_purchases', type: 'number', required: false, description: '총 구매 횟수' },
    { name: 'lifetime_value', type: 'number', required: false, description: '생애 가치 (LTV)' },
  ],
  relations: ['sales', 'traffic']
};

// 재고 데이터 표준 스키마
export const INVENTORY_SCHEMA: DataSchema = {
  type: 'inventory',
  category: 'RAW_DATA',
  columns: [
    { name: 'product_id', type: 'string', required: true, description: '상품 ID' },
    { name: 'timestamp', type: 'date', required: true, description: '재고 기록 시간' },
    { name: 'stock_level', type: 'number', required: true, description: '재고 수량' },
    { name: 'reorder_point', type: 'number', required: false, description: '재주문 포인트' },
    { name: 'warehouse_location', type: 'string', required: false, description: '창고 위치' },
  ],
  relations: ['product']
};

// 브랜드 데이터 표준 스키마
export const BRAND_SCHEMA: DataSchema = {
  type: 'brand',
  category: 'RAW_DATA',
  columns: [
    { name: 'brand_id', type: 'string', required: true, description: '브랜드 고유 ID', examples: ['brand_id', 'id', '브랜드코드'] },
    { name: 'brand_name', type: 'string', required: true, description: '브랜드명', examples: ['brand_name', 'name', '브랜드', '브랜드명'] },
    { name: 'category', type: 'string', required: false, description: '브랜드 카테고리', examples: ['category', 'type', '카테고리', '분류'] },
    { name: 'country', type: 'string', required: false, description: '원산지 국가', examples: ['country', 'origin', '국가', '원산지'] },
    { name: 'description', type: 'string', required: false, description: '브랜드 설명', examples: ['description', 'desc', '설명', '소개'] },
  ],
  relations: ['product', 'sales']
};

// 매장 데이터 표준 스키마
export const STORE_SCHEMA: DataSchema = {
  type: 'store',
  category: 'RAW_DATA',
  columns: [
    { name: 'store_id', type: 'string', required: true, description: '매장 고유 ID', examples: ['store_id', 'id', '매장코드', '지점코드'] },
    { name: 'store_name', type: 'string', required: true, description: '매장명', examples: ['store_name', 'name', '매장명', '지점명'] },
    { name: 'location', type: 'string', required: false, description: '매장 위치', examples: ['location', 'address', '주소', '위치'] },
    { name: 'store_type', type: 'string', required: false, description: '매장 유형', examples: ['store_type', 'type', '매장타입', '유형'] },
    { name: 'area', type: 'number', required: false, description: '매장 면적 (sqm)', examples: ['area', 'size', '면적', '평수'] },
    { name: 'open_date', type: 'date', required: false, description: '오픈일', examples: ['open_date', 'opened_at', '오픈일', '개점일'] },
  ],
  relations: ['sales', 'traffic', 'zone']
};

// 직원 데이터 표준 스키마
export const STAFF_SCHEMA: DataSchema = {
  type: 'staff',
  category: 'RAW_DATA',
  columns: [
    { name: 'staff_id', type: 'string', required: true, description: '직원 고유 ID', examples: ['staff_id', 'id', '직원코드', '사원번호'] },
    { name: 'staff_name', type: 'string', required: true, description: '직원명', examples: ['staff_name', 'name', '직원명', '이름', '사원명'] },
    { name: 'store_id', type: 'string', required: true, description: '소속 매장 ID', examples: ['store_id', 'store', '매장코드', '지점코드'] },
    { name: 'position', type: 'string', required: false, description: '직책/직급', examples: ['position', 'title', '직책', '직급'] },
    { name: 'hire_date', type: 'date', required: false, description: '입사일', examples: ['hire_date', 'join_date', '입사일', '입사일자'] },
    { name: 'salary_level', type: 'number', required: false, description: '급여 레벨', examples: ['salary_level', 'level', '급여등급', '호봉'] },
    { name: 'performance_score', type: 'number', required: false, description: '성과 점수', examples: ['performance_score', 'score', '성과점수', '평가점수'] },
    { name: 'sales_count_monthly', type: 'number', required: false, description: '월 판매 건수', examples: ['sales_count_monthly', 'sales_count', '월판매건수', '판매건수'] },
    { name: 'customer_satisfaction', type: 'number', required: false, description: '고객 만족도', examples: ['customer_satisfaction', 'satisfaction', '만족도', '고객만족도'] },
  ],
  relations: ['store', 'sales']
};

// ============================================================================
// DERIVED DATA SCHEMAS (백엔드 ETL/AI가 자동 생성하는 파생 데이터)
// ============================================================================

// Dashboard KPIs (집계 테이블)
// 생성 방식: aggregate-all-kpis Edge Function (Batch ETL)
// 입력: visits, purchases, stores, context data
export const DASHBOARD_KPI_SCHEMA: DataSchema = {
  type: 'dashboard_kpi',
  category: 'DERIVED_DATA',
  description: '원천 데이터에서 자동 집계되는 대시보드 KPI (백엔드 생성)',
  columns: [
    { name: 'date', type: 'date', required: true, description: '집계 날짜' },
    { name: 'store_id', type: 'string', required: true, description: '매장 ID' },
    { name: 'total_revenue', type: 'number', required: true, description: '총 매출' },
    { name: 'total_visits', type: 'number', required: true, description: '총 방문자 수' },
    { name: 'total_purchases', type: 'number', required: true, description: '총 구매 건수' },
    { name: 'conversion_rate', type: 'number', required: true, description: '전환율 (%)' },
    { name: 'sales_per_sqm', type: 'number', required: false, description: '평당 매출' },
  ],
  relations: ['stores', 'visits', 'purchases']
};

// AI Recommendations (AI 출력 결과 테이블)
// 생성 방식: generate-ai-recommendations Edge Function (AI Inference)
// 입력: inventory_levels, sales, context data
export const AI_RECOMMENDATION_SCHEMA: DataSchema = {
  type: 'ai_recommendation',
  category: 'DERIVED_DATA',
  description: 'AI가 자동 생성하는 추천 사항 (백엔드 생성)',
  columns: [
    { name: 'recommendation_type', type: 'string', required: true, description: '추천 유형 (재고, 레이아웃, 프로모션 등)' },
    { name: 'priority', type: 'string', required: true, description: '우선순위 (high, medium, low)' },
    { name: 'title', type: 'string', required: true, description: '추천 제목' },
    { name: 'description', type: 'string', required: true, description: '추천 내용' },
    { name: 'expected_impact', type: 'object', required: false, description: '예상 영향 (매출, CVR 등)' },
  ],
  relations: ['inventory_levels', 'products', 'dashboard_kpis']
};

// ============================================================================
// SCHEMA MAPS
// ============================================================================

// 원천 데이터 스키마 맵 (업로드 대상)
export const RAW_DATA_SCHEMA_MAP: Record<string, DataSchema> = {
  sales: SALES_SCHEMA,
  zone: ZONE_SCHEMA,
  traffic: TRAFFIC_SCHEMA,
  traffic_sensor: TRAFFIC_SCHEMA, // 센서 데이터도 traffic 스키마 사용
  product: PRODUCT_SCHEMA,
  customer: CUSTOMER_SCHEMA,
  inventory: INVENTORY_SCHEMA,
  brand: BRAND_SCHEMA,
  store: STORE_SCHEMA,
  staff: STAFF_SCHEMA,
};

// 파생 데이터 스키마 맵 (백엔드 생성)
export const DERIVED_DATA_SCHEMA_MAP: Record<string, DataSchema> = {
  dashboard_kpi: DASHBOARD_KPI_SCHEMA,
  ai_recommendation: AI_RECOMMENDATION_SCHEMA,
};

// 전체 스키마 맵 (하위 호환성)
export const SCHEMA_MAP: Record<string, DataSchema> = {
  ...RAW_DATA_SCHEMA_MAP,
  ...DERIVED_DATA_SCHEMA_MAP,
};
