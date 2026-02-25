// 엔터프라이즈급 데이터 스키마 정의
// 공통 규약: UTC TIMESTAMP, PII 해시, SCD2, 품질 체크

export type ColumnType = 'string' | 'number' | 'date' | 'boolean' | 'json' | 'array' | 'enum' | 'geography';

export interface EnterpriseColumnSchema {
  name: string;
  type: ColumnType;
  required: boolean;
  description: string;
  examples?: string[];
  enum?: string[]; // ENUM 타입인 경우 가능한 값들
  constraints?: string[]; // 예: 'NOT NULL', 'UNIQUE', '>=0'
  isPII?: boolean; // 개인정보 여부
  isKey?: boolean; // 키 컬럼 여부
}

export interface EnterpriseDataSchema {
  type: string;
  category: 'fact' | 'dimension' | 'bridge';
  grain: string; // 그레인 설명
  columns: EnterpriseColumnSchema[];
  relations?: string[];
  partitionBy?: string; // 파티션 컬럼
  qualityChecks?: string[]; // 품질 체크 규칙
}

// 1) 센서(동선) 데이터 스키마
export const SENSOR_FACT_SCHEMA: EnterpriseDataSchema = {
  type: 'traffic_sensor',
  category: 'fact',
  grain: '한 센서 이벤트 1건',
  partitionBy: 'event_date',
  columns: [
    { name: 'event_id', type: 'string', required: true, description: '이벤트 고유 ID (ULID)', isKey: true, examples: ['event_id', 'id', 'event'] },
    { name: 'event_ts', type: 'date', required: true, description: '이벤트 타임스탬프 (UTC)', examples: ['event_ts', 'timestamp', 'ts', 'datetime', '시간'] },
    { name: 'event_date', type: 'date', required: true, description: '이벤트 날짜 (파티션)', examples: ['event_date', 'date', '날짜'] },
    { name: 'device_id', type: 'string', required: true, description: '센서/디바이스 ID', isKey: true, examples: ['device_id', 'sensor_id', 'beacon_id', '센서ID'] },
    { name: 'store_id', type: 'string', required: true, description: '매장 ID', isKey: true, examples: ['store_id', 'shop_id', '매장ID', '지점코드'] },
    { name: 'zone_id', type: 'string', required: false, description: '존/구역 ID', isKey: true, examples: ['zone_id', 'area_id', '구역ID', 'zone'] },
    { name: 'sensor_type', type: 'enum', required: true, description: '센서 타입', enum: ['camera', 'ble', 'wifi', 'people_counter', 'rfid', 'pos_gateway', 'temp', 'energy'], examples: ['sensor_type', 'type', '센서타입'] },
    { name: 'metric_type', type: 'enum', required: true, description: '측정 지표 타입', enum: ['enter', 'exit', 'dwell', 'path', 'temperature', 'energy_kwh', 'rfid_read'], examples: ['metric_type', 'event_type', '이벤트타입'] },
    { name: 'metric_value', type: 'number', required: true, description: '측정 값 (초, 온도, kwh 등)', constraints: ['>=0'], examples: ['metric_value', 'value', 'duration', '체류시간', 'dwell_time'] },
    { name: 'customer_id', type: 'string', required: false, description: '고객 ID (익명 추적 가능 시)', isPII: true, examples: ['customer_id', 'user_id', '고객ID'] },
    { name: 'session_id', type: 'string', required: false, description: '방문 세션 ID', examples: ['session_id', 'visit_id', '세션ID'] },
    { name: 'raw_payload', type: 'json', required: false, description: '원본 센서 데이터', examples: ['raw_payload', 'raw_data', 'payload'] },
  ],
  relations: ['dim_device', 'dim_zone', 'dim_store', 'dim_customer'],
  qualityChecks: ['metric_value >= 0', 'store_id FK valid', 'event_id unique']
};

// 2) 고객(회원정보) 데이터 스키마
export const CUSTOMER_DIM_SCHEMA: EnterpriseDataSchema = {
  type: 'customer',
  category: 'dimension',
  grain: '고객 1명 (SCD2)',
  columns: [
    { name: 'customer_id', type: 'string', required: true, description: '고객 ID (가명/해시)', isKey: true, isPII: true, examples: ['customer_id', 'user_id', 'member_id', '고객ID', '회원번호', 'customerid', 'userid', 'memberid', 'client_id', 'clientid', '고객id', '회원id', 'cust_id', 'customer_no', 'member_no', 'user', 'member', 'customer'] },
    { name: 'first_seen_ts', type: 'date', required: false, description: '최초 확인 시각', examples: ['first_seen_ts', 'created_at', 'join_date', '가입일', 'firstseents', 'signup_date', 'registered_at', '가입시각', '등록일', 'registration_date', 'first_visit'] },
    { name: 'loyalty_tier', type: 'enum', required: false, description: '로열티 등급', enum: ['none', 'silver', 'gold', 'vip'], examples: ['loyalty_tier', 'tier', 'grade', '등급', 'loyaltytier', 'membership_tier', 'level', '회원등급', '멤버십', 'vip', 'rank'] },
    { name: 'gender', type: 'string', required: false, description: '성별', examples: ['gender', 'sex', '성별', 'male', 'female', 'm', 'f', '남', '여', '남성', '여성'] },
    { name: 'birth_year', type: 'number', required: false, description: '출생년도', examples: ['birth_year', 'year_of_birth', '생년', '출생년도', 'birthyear', 'birth', 'yob', '출생년', 'year'] },
    { name: 'home_region', type: 'string', required: false, description: '거주 지역', examples: ['home_region', 'region', 'location', '지역', '거주지', 'homeregion', 'address', 'city', 'area', '주소', '시', '도시'] },
    { name: 'consent_marketing', type: 'boolean', required: false, description: '마케팅 동의 여부', examples: ['consent_marketing', 'marketing_consent', '마케팅동의', 'consentmarketing', 'marketing', 'email_consent', 'sms_consent', '동의'] },
    { name: 'consent_personalization', type: 'boolean', required: false, description: '개인화 동의 여부', examples: ['consent_personalization', 'personalization_consent', '개인화동의', 'consentpersonalization', 'personalization', '개인화', 'privacy_consent'] },
    { name: 'is_current', type: 'boolean', required: true, description: 'SCD2: 현재 레코드 여부', examples: ['is_current', 'current', 'iscurrent'] },
    { name: 'valid_from', type: 'date', required: true, description: 'SCD2: 유효 시작일', examples: ['valid_from', 'start_date', 'validfrom', 'from_date'] },
    { name: 'valid_to', type: 'date', required: false, description: 'SCD2: 유효 종료일', examples: ['valid_to', 'end_date', 'validto', 'to_date'] },
  ],
  relations: ['fact_sales_line', 'fact_customer_events', 'fact_loyalty_points'],
  qualityChecks: ['customer_id not null', 'is_current bool', 'valid_from <= valid_to']
};

// 3) 브랜드 데이터 스키마
export const BRAND_DIM_SCHEMA: EnterpriseDataSchema = {
  type: 'brand',
  category: 'dimension',
  grain: '브랜드 1개 (SCD2)',
  columns: [
    { name: 'brand_id', type: 'string', required: true, description: '브랜드 ID', isKey: true, examples: ['brand_id', 'id', '브랜드코드', '브랜드ID', 'brandid', 'brand_code', 'brand', '브랜드', 'maker_id', 'manufacturer_id'] },
    { name: 'brand_name', type: 'string', required: true, description: '브랜드명', examples: ['brand_name', 'name', '브랜드명', '브랜드', 'brandname', 'brand', 'maker', '제조사', 'manufacturer'] },
    { name: 'parent_company', type: 'string', required: false, description: '모회사', examples: ['parent_company', 'company', '모회사', '회사', 'parentcompany', 'parent', 'group', '그룹'] },
    { name: 'category', type: 'enum', required: false, description: '브랜드 카테고리', enum: ['fashion', 'beauty', 'f&b', 'electronics', 'etc'], examples: ['category', 'type', '카테고리', '분류', 'industry', 'sector', '업종'] },
    { name: 'country', type: 'string', required: false, description: '원산지 국가', examples: ['country', 'origin', '국가', '원산지', 'nation', 'made_in', 'origin_country'] },
    { name: 'is_current', type: 'boolean', required: true, description: 'SCD2: 현재 레코드', examples: ['is_current', 'current', 'iscurrent'] },
    { name: 'valid_from', type: 'date', required: true, description: 'SCD2: 유효 시작일', examples: ['valid_from', 'start_date', 'validfrom', 'from_date'] },
    { name: 'valid_to', type: 'date', required: false, description: 'SCD2: 유효 종료일', examples: ['valid_to', 'end_date', 'validto', 'to_date'] },
  ],
  relations: ['dim_product', 'dim_store', 'fact_brand_campaign'],
  qualityChecks: ['brand_id unique', 'brand_name not null']
};

// 4) 제품 데이터 스키마
export const PRODUCT_DIM_SCHEMA: EnterpriseDataSchema = {
  type: 'product',
  category: 'dimension',
  grain: '제품 1개 (SCD2)',
  columns: [
    { name: 'product_id', type: 'string', required: true, description: '제품 ID', isKey: true, examples: ['product_id', 'id', '상품코드', '제품코드', 'productid', 'item_id', 'itemid', 'goods_id', 'article_id', 'product_code', '상품id', '제품id', 'prd_id', 'prod_id'] },
    { name: 'brand_id', type: 'string', required: false, description: '브랜드 ID', isKey: true, examples: ['brand_id', '브랜드ID', '브랜드코드', 'brandid', 'brand_code', 'brand', '브랜드', 'maker_id'] },
    { name: 'product_name', type: 'string', required: true, description: '제품명', examples: ['product_name', 'name', '상품명', '제품명', 'productname', 'item_name', 'goods_name', '품명', 'prd_name', 'prod_name', 'title'] },
    { name: 'category_lvl1', type: 'string', required: false, description: '카테고리 레벨1', examples: ['category_lvl1', 'category', '대분류', 'categorylvl1', 'cat1', 'main_category', 'category1', 'type', '카테고리', '분류'] },
    { name: 'category_lvl2', type: 'string', required: false, description: '카테고리 레벨2', examples: ['category_lvl2', 'subcategory', '중분류', 'categorylvl2', 'cat2', 'sub_category', 'category2', '서브카테고리'] },
    { name: 'category_lvl3', type: 'string', required: false, description: '카테고리 레벨3', examples: ['category_lvl3', '소분류', 'categorylvl3', 'cat3', 'category3', 'detail_category'] },
    { name: 'season', type: 'string', required: false, description: '시즌', examples: ['season', '시즌', 'ss', 'fw', 'spring', 'summer', 'fall', 'winter'] },
    { name: 'style_code', type: 'string', required: false, description: '스타일 코드', examples: ['style_code', 'style', '스타일코드', 'stylecode', 'style_no', 'model', '모델'] },
    { name: 'base_price', type: 'number', required: false, description: '기본 가격', constraints: ['>=0'], examples: ['base_price', 'price', '가격', '정가', 'baseprice', 'original_price', 'list_price', 'retail_price', 'msrp', '판매가'] },
    { name: 'status', type: 'enum', required: false, description: '제품 상태', enum: ['active', 'discontinued'], examples: ['status', 'state', '상태', 'active', 'inactive', '활성', '비활성'] },
    { name: 'attributes', type: 'json', required: false, description: '추가 속성 (JSON)', examples: ['attributes', 'properties', '속성', 'attrs', 'metadata', 'specs', 'specifications'] },
    { name: 'is_current', type: 'boolean', required: true, description: 'SCD2: 현재 레코드', examples: ['is_current', 'current', 'iscurrent'] },
    { name: 'valid_from', type: 'date', required: true, description: 'SCD2: 유효 시작일', examples: ['valid_from', 'start_date', 'validfrom', 'from_date'] },
    { name: 'valid_to', type: 'date', required: false, description: 'SCD2: 유효 종료일', examples: ['valid_to', 'end_date', 'validto', 'to_date'] },
  ],
  relations: ['dim_brand', 'dim_sku', 'fact_sales_line'],
  qualityChecks: ['product_id unique', 'product_name not null', 'base_price >= 0']
};

export const SKU_DIM_SCHEMA: EnterpriseDataSchema = {
  type: 'product',
  category: 'dimension',
  grain: 'SKU 1개 (SCD2)',
  columns: [
    { name: 'sku_id', type: 'string', required: true, description: 'SKU ID', isKey: true, examples: ['sku_id', 'sku', 'barcode', 'SKU코드', 'skuid', 'sku_code', 'item_id', 'itemid', '상품코드', 'product_code', 'ean', 'upc', '바코드', 'code'] },
    { name: 'product_id', type: 'string', required: true, description: '제품 ID', isKey: true, examples: ['product_id', '상품코드', '제품코드', 'productid', 'prod_id', 'prd_id', 'item_id', 'goods_id'] },
    { name: 'color', type: 'string', required: false, description: '색상', examples: ['color', 'colour', '색상', '컬러', 'col', '색', 'color_name', 'colorway'] },
    { name: 'size', type: 'string', required: false, description: '사이즈', examples: ['size', '사이즈', '크기', 's', 'm', 'l', 'xl', 'free', '치수'] },
    { name: 'barcode', type: 'string', required: false, description: '바코드', examples: ['barcode', 'ean', 'upc', '바코드', 'ean13', 'gtin', 'isbn'] },
    { name: 'variant_attrs', type: 'json', required: false, description: '변형 속성 (JSON)', examples: ['variant_attrs', 'attributes', '속성', 'variantattrs', 'attrs', 'options', 'variants'] },
    { name: 'current_price', type: 'number', required: false, description: '현재 판매가', constraints: ['>=0'], examples: ['current_price', 'price', '판매가', '가격', 'currentprice', 'sell_price', 'selling_price', 'retail_price', '소비자가'] },
    { name: 'is_current', type: 'boolean', required: true, description: 'SCD2: 현재 레코드', examples: ['is_current', 'current', 'iscurrent'] },
    { name: 'valid_from', type: 'date', required: true, description: 'SCD2: 유효 시작일', examples: ['valid_from', 'start_date', 'validfrom', 'from_date'] },
    { name: 'valid_to', type: 'date', required: false, description: 'SCD2: 유효 종료일', examples: ['valid_to', 'end_date', 'validto', 'to_date'] },
  ],
  relations: ['dim_product', 'fact_sales_line', 'fact_inventory_daily'],
  qualityChecks: ['sku_id unique', 'product_id FK valid', 'current_price >= 0']
};

// 5) 매장 데이터 스키마
export const STORE_DIM_SCHEMA: EnterpriseDataSchema = {
  type: 'store',
  category: 'dimension',
  grain: '매장 1개 (SCD2)',
  columns: [
    { name: 'store_id', type: 'string', required: true, description: '매장 ID', isKey: true, examples: ['store_id', 'shop_id', '매장코드', '지점코드', 'storeid', 'shopid', 'branch_id', 'location_id', '매장id', '지점id', 'branch_code', 'store_code', 'branch', 'store', '매장', '지점'] },
    { name: 'store_name', type: 'string', required: true, description: '매장명', examples: ['store_name', 'name', '매장명', '지점명', 'storename', 'shop_name', 'branch_name', 'location_name', '매장이름', '지점이름', 'store', 'branch'] },
    { name: 'brand_id', type: 'string', required: false, description: '브랜드 ID', isKey: true, examples: ['brand_id', '브랜드ID', '브랜드코드', 'brandid', 'brand_code', 'brand', '브랜드'] },
    { name: 'store_type', type: 'enum', required: false, description: '매장 유형', enum: ['flagship', 'mall', 'street', 'outlet', 'pop-up'], examples: ['store_type', 'type', '매장타입', '유형', 'storetype', 'shop_type', 'location_type', '타입', '매장유형'] },
    { name: 'address', type: 'string', required: false, description: '주소', examples: ['address', 'location', '주소', '위치', 'addr', 'full_address', '전체주소', 'address1'] },
    { name: 'city', type: 'string', required: false, description: '도시', examples: ['city', '도시', '시', '시군구', 'town'] },
    { name: 'region', type: 'string', required: false, description: '지역', examples: ['region', 'state', '지역', '도', 'province', '광역시', 'prefecture'] },
    { name: 'country', type: 'string', required: false, description: '국가', examples: ['country', '국가', 'nation', 'kr', 'korea', '한국'] },
    { name: 'timezone', type: 'string', required: false, description: '타임존', examples: ['timezone', 'tz', '타임존', 'time_zone'] },
    { name: 'floor_area_sqm', type: 'number', required: false, description: '매장 면적 (sqm)', constraints: ['>=0'], examples: ['floor_area_sqm', 'area', '면적', '평수', 'floorareasqm', 'size', 'square_meter', 'sqm', '넓이'] },
    { name: 'opening_hours', type: 'json', required: false, description: '영업시간 (JSON)', examples: ['opening_hours', 'hours', '영업시간', 'openinghours', 'business_hours', 'open_time', '운영시간'] },
    { name: 'lat', type: 'number', required: false, description: '위도', examples: ['lat', 'latitude', '위도', 'y'] },
    { name: 'lng', type: 'number', required: false, description: '경도', examples: ['lng', 'longitude', '경도', 'lon', 'x'] },
    { name: 'is_current', type: 'boolean', required: true, description: 'SCD2: 현재 레코드', examples: ['is_current', 'current', 'iscurrent'] },
    { name: 'valid_from', type: 'date', required: true, description: 'SCD2: 유효 시작일', examples: ['valid_from', 'start_date', 'open_date', 'validfrom', 'from_date', '오픈일', '개점일'] },
    { name: 'valid_to', type: 'date', required: false, description: 'SCD2: 유효 종료일', examples: ['valid_to', 'end_date', 'close_date', 'validto', 'to_date', '폐점일'] },
  ],
  relations: ['dim_brand', 'fact_sales_line', 'fact_store_traffic', 'dim_zone'],
  qualityChecks: ['store_id unique', 'store_name not null', 'floor_area_sqm >= 0']
};

// 직원 데이터 스키마
export const STAFF_DIM_SCHEMA: EnterpriseDataSchema = {
  type: 'staff',
  category: 'dimension',
  grain: '직원 1명 (SCD2)',
  columns: [
    { name: 'staff_id', type: 'string', required: true, description: '직원 고유 ID', isKey: true, examples: ['staff_id', 'id', '직원코드', '사원번호', 'staffid', 'employee_id', 'emp_id', '직원id', '사원id', 'worker_id', 'staff', '직원', '사원'] },
    { name: 'staff_name', type: 'string', required: true, description: '직원명', examples: ['staff_name', 'name', '직원명', '이름', '사원명', 'staffname', 'employee_name', 'emp_name', '성명', 'full_name'] },
    { name: 'store_id', type: 'string', required: true, description: '소속 매장 ID', isKey: true, examples: ['store_id', 'shop_id', '매장코드', '지점코드', 'storeid', 'branch', 'location', '매장', '지점'] },
    { name: 'position', type: 'string', required: false, description: '직책/직급', examples: ['position', 'title', 'role', '직책', '직급', '직위', '포지션', 'job_title', 'rank', '등급'] },
    { name: 'hire_date', type: 'date', required: false, description: '입사일', examples: ['hire_date', 'join_date', 'start_date', '입사일', '입사일자', 'hiredate', 'employment_date', '채용일', '근무시작일'] },
    { name: 'salary_level', type: 'number', required: false, description: '급여 레벨', constraints: ['>=0'], examples: ['salary_level', 'level', 'grade', '급여등급', '호봉', 'salarylevel', 'pay_grade', '등급', '레벨'] },
    { name: 'performance_score', type: 'number', required: false, description: '성과 점수', constraints: ['>=0'], examples: ['performance_score', 'score', 'rating', '성과점수', '평가점수', 'performancescore', 'evaluation', '평가', '점수', 'kpi'] },
    { name: 'sales_count_monthly', type: 'number', required: false, description: '월 판매 건수', constraints: ['>=0'], examples: ['sales_count_monthly', 'sales_count', 'monthly_sales', '월판매건수', '판매건수', 'salescountmonthly', 'transactions', '거래건수'] },
    { name: 'customer_satisfaction', type: 'number', required: false, description: '고객 만족도', constraints: ['>=0'], examples: ['customer_satisfaction', 'satisfaction', 'csat', '만족도', '고객만족도', 'customersatisfaction', 'rating', '평점', 'feedback_score'] },
    { name: 'is_current', type: 'boolean', required: true, description: 'SCD2: 현재 레코드', examples: ['is_current', 'current', 'iscurrent'] },
    { name: 'valid_from', type: 'date', required: true, description: 'SCD2: 유효 시작일', examples: ['valid_from', 'start_date', 'validfrom', 'from_date'] },
    { name: 'valid_to', type: 'date', required: false, description: 'SCD2: 유효 종료일', examples: ['valid_to', 'end_date', 'validto', 'to_date'] },
  ],
  relations: ['dim_store', 'fact_sales_line'],
  qualityChecks: ['staff_id unique', 'staff_name not null', 'store_id FK valid']
};

// 6) 매출 데이터 스키마
export const SALES_FACT_SCHEMA: EnterpriseDataSchema = {
  type: 'sales',
  category: 'fact',
  grain: '거래 라인 1건',
  partitionBy: 'event_date',
  columns: [
    { name: 'transaction_id', type: 'string', required: true, description: '거래 ID', isKey: true, examples: ['transaction_id', 'order_id', 'txn_id', '거래번호', '주문번호', 'transactionid', 'orderid', 'txnid', '거래id', '주문id', 'receipt', '영수증번호', 'billno'] },
    { name: 'line_id', type: 'number', required: false, description: '라인 번호', examples: ['line_id', 'line_number', '라인번호', 'lineid', 'line', 'linenum', 'seq', 'sequence'] },
    { name: 'event_ts', type: 'date', required: true, description: '거래 시각 (UTC)', examples: ['event_ts', 'timestamp', 'datetime', '거래시각', '주문시각', 'eventts', 'time', '시간', '일시', 'purchased_at', 'sold_at', 'created_at', 'transaction_time', 'sale_time'] },
    { name: 'event_date', type: 'date', required: true, description: '거래 날짜 (파티션)', examples: ['event_date', 'date', '날짜', '거래일자', 'eventdate', 'saledate', 'purchasedate', '판매일', 'day'] },
    { name: 'store_id', type: 'string', required: true, description: '매장 ID', isKey: true, examples: ['store_id', 'shop_id', '매장코드', '지점코드', 'storeid', 'shopid', 'branch', 'location', '매장', '지점', 'branch_code', 'store_code', 'shop'] },
    { name: 'register_id', type: 'string', required: false, description: '계산대 ID', examples: ['register_id', 'pos_id', '계산대', 'POS번호', 'registerid', 'posid', 'terminal', 'pos', 'counter'] },
    { name: 'cashier_id', type: 'string', required: false, description: '계산원 ID', examples: ['cashier_id', 'staff_id', '직원ID', '계산원', 'cashierid', 'staffid', 'employee', 'clerk', '직원', '판매원'] },
    { name: 'customer_id', type: 'string', required: false, description: '고객 ID', isPII: true, isKey: true, examples: ['customer_id', 'user_id', 'member_id', '고객ID', '회원번호', 'customerid', 'userid', 'memberid', 'client', '고객', '회원', 'member', 'customer_no', 'member_no'] },
    { name: 'visit_id', type: 'string', required: false, description: '방문 ID', examples: ['visit_id', 'session_id', '방문ID', '세션', 'visitid', 'sessionid', 'visit', 'session'] },
    { name: 'channel', type: 'enum', required: false, description: '판매 채널', enum: ['store', 'web', 'app', 'pos_order_ahead'], examples: ['channel', 'sales_channel', '채널', '판매채널', 'source', 'origin'] },
    { name: 'sku_id', type: 'string', required: true, description: 'SKU ID', isKey: true, examples: ['sku_id', 'product_id', 'sku', '상품코드', 'SKU코드', 'skuid', 'productid', 'item', 'itemcode', '제품코드', 'barcode', '바코드', 'product_code', 'item_code', 'goods', 'article'] },
    { name: 'qty', type: 'number', required: true, description: '수량', constraints: ['>0'], examples: ['qty', 'quantity', '수량', '판매수량', 'amount', 'count', 'sold', 'sold_qty', '개수', 'ea', 'pcs'] },
    { name: 'unit_price', type: 'number', required: true, description: '단가', constraints: ['>=0'], examples: ['unit_price', 'price', '단가', '가격', 'unitprice', 'selling_price', 'sale_price', '판매가', '판매단가', 'retail_price', 'list_price'] },
    { name: 'line_discount', type: 'number', required: false, description: '라인 할인액', constraints: ['>=0'], examples: ['line_discount', 'discount', '할인', '할인금액', 'linediscount', 'discount_amount', 'sale', '세일', 'markdown', 'promotion', '할인액'] },
    { name: 'line_tax', type: 'number', required: false, description: '라인 세금', constraints: ['>=0'], examples: ['line_tax', 'tax', '세금', '부가세', 'linetax', 'vat', 'sales_tax', '부가가치세', 'tax_amount'] },
    { name: 'net_revenue', type: 'number', required: true, description: '순매출 (qty*unit_price - discount + tax)', constraints: ['>=0'], examples: ['net_revenue', 'revenue', 'total', '순매출', '실판매금액', 'netrevenue', 'total_amount', 'amount', '금액', 'sales', '매출', 'total_sales', 'net_sales', 'line_total', 'subtotal'] },
    { name: 'payment_method', type: 'enum', required: false, description: '결제 수단', enum: ['cash', 'card', 'mobile', 'mixed'], examples: ['payment_method', 'payment', '결제수단', '결제방법', 'paymentmethod', 'pay_type', 'payment_type', '결제', 'pay'] },
    { name: 'coupon_id', type: 'string', required: false, description: '쿠폰 ID', examples: ['coupon_id', '쿠폰ID', '쿠폰번호', 'couponid', 'coupon', 'voucher', '쿠폰'] },
    { name: 'promo_id', type: 'string', required: false, description: '프로모션 ID', examples: ['promo_id', 'promotion_id', '프로모션ID', 'promoid', 'promotionid', 'promo', 'promotion', 'campaign', '프로모션', '이벤트'] },
  ],
  relations: ['dim_store', 'dim_sku', 'dim_customer', 'dim_calendar'],
  qualityChecks: [
    'qty > 0',
    'unit_price >= 0',
    'net_revenue = qty * unit_price - line_discount + line_tax',
    'store_id FK valid',
    'sku_id FK valid'
  ]
};

// 스키마 맵
export const ENTERPRISE_SCHEMA_MAP: Record<string, EnterpriseDataSchema> = {
  traffic_sensor: SENSOR_FACT_SCHEMA,
  customer: CUSTOMER_DIM_SCHEMA,
  brand: BRAND_DIM_SCHEMA,
  product: PRODUCT_DIM_SCHEMA,
  sku: SKU_DIM_SCHEMA,
  store: STORE_DIM_SCHEMA,
  staff: STAFF_DIM_SCHEMA,
  sales: SALES_FACT_SCHEMA,
};

// 공통 키 컬럼 목록 (조인 최적화용)
export const COMMON_KEY_COLUMNS = [
  'customer_id',
  'store_id',
  'brand_id',
  'product_id',
  'sku_id',
  'staff_id',
  'transaction_id',
  'event_id',
  'visit_id',
  'device_id',
  'zone_id'
];

// SCD2 필수 컬럼
export const SCD2_COLUMNS = ['is_current', 'valid_from', 'valid_to'];

// 파티션 컬럼 후보
export const PARTITION_COLUMNS = ['event_date', 'calendar_date', 'transaction_date'];
