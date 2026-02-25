# NEURALTWIN 온톨로지 스키마 v3.0

> **최종 업데이트**: 2025-01-29  
> **엔티티 타입**: 62개 (CRITICAL 25 | HIGH 19 | MEDIUM 13 | LOW 5)  
> **관계 타입**: 86개 (CRITICAL 32 | HIGH 27 | MEDIUM 17 | LOW 10)  
> **용도**: 완전한 데이터 파이프라인 + AI 모델 관리 + 비즈니스 룰 엔진  
> **호환성**: 데이터베이스 구조 100% 반영 + 이벤트 기반 아키텍처

---

## 🚀 v3.0 주요 혁신

### 1. 완전한 데이터 파이프라인 통합
- **DataSource**: POS/ERP/CRM 등 원천 시스템 관리
- **DataSourceTable**: 원천 테이블/파일 추적
- **ColumnMapping**: 소스 → 온톨로지 자동 매핑

### 2. 이벤트 기반 아키텍처
- **BaseEvent**: 모든 이벤트의 공통 상위 구조
- **CustomerEvent**: 고객 행동 이벤트 정규화
- **SensorEvent**: 센서 감지 이벤트 통합

### 3. AI 모델 라이프사이클 관리
- **Model**: LLM/ML 모델 정의
- **ModelRun**: 실행 기록 및 성능 추적
- **메트릭 레이어**: Zone/Product/Store 집계
- **EntityEmbedding**: AI 임베딩 벡터
- **AIInsight**: 생성 인사이트

### 4. 비즈니스 룰 엔진
- **KPI/KPIValue**: KPI 정의 및 측정 자동화
- **RetailConcept**: 리테일 개념/패턴
- **BusinessRule**: 운영 최적화 규칙

### 5. 시뮬레이션 체계화
- **Scenario**: What-if 가정 정의
- **SimulationResult**: 시나리오 실행 결과

---

## 📋 목차

1. [🔴 CRITICAL 엔티티 (25개)](#-critical-엔티티-25개)
2. [🟡 HIGH 엔티티 (19개)](#-high-엔티티-19개)
3. [🟠 MEDIUM 엔티티 (13개)](#-medium-엔티티-13개)
4. [🟢 LOW 엔티티 (5개)](#-low-엔티티-5개)
5. [관계 타입 (86개)](#관계-타입-86개)
6. [데이터 생성 가이드](#데이터-생성-가이드)

---

## 🔴 CRITICAL 엔티티 (25개)

> **필수**: 없으면 기본 기능 불가

### 1. 조직/매장 (2개)

#### 1.1 Organization ⭐ NEW
- **Label**: 조직
- **Color**: `#7c3aed` (보라)
- **Icon**: Building2
- **Description**: 멀티 테넌시 최상위 조직
- **DB Table**: `organizations`
- **Properties**:
  - `org_id` (string, required): 조직 ID
  - `org_name` (string, required): 조직명
  - `org_type` (string): 조직 유형 (retail/franchise/enterprise)
  - `industry` (string): 업종
  - `country` (string, required): 국가
  - `member_count` (number): 멤버 수
  - `created_at` (string): 생성일

#### 1.2 Store
- **Label**: 매장
- **Color**: `#3b82f6` (파랑)
- **Icon**: Store
- **Description**: 오프라인 리테일 매장
- **DB Table**: `stores`
- **3D Type**: building
- **3D Dimensions**: { width: 20, height: 4, depth: 30 }
- **Properties**:
  - `store_code` (string, required): 매장 코드
  - `store_name` (string, required): 매장명
  - `address` (string, required): 주소
  - `area_sqm` (number, required): 면적 (㎡)
  - `opening_date` (string): 개점일
  - `store_format` (string): 매장 포맷 (flagship/standard/compact)
  - `region` (string): 권역
  - `district` (string): 상권
  - `manager_name` (string): 매장 책임자
  - `org_id` (string, required): 조직 FK

---

### 2. 공간 구조 (3개)

#### 2.1 Zone
- **Label**: 구역
- **Color**: `#10b981` (초록)
- **Icon**: Grid3x3
- **Description**: 매장 내 논리적/물리적 구역
- **DB Table**: `graph_entities` (entity_type_id로 구분)
- **3D Type**: zone
- **3D Dimensions**: { width: 5, height: 3, depth: 5 }
- **Properties**:
  - `zone_id` (string, required): 구역 ID
  - `zone_type` (string, required): entrance/product_display/checkout/storage/staff/fitting/rest
  - `zone_name` (string, required): 구역명
  - `area_sqm` (number): 면적 (㎡)
  - `purpose` (string): 용도
  - `traffic_level` (string): high/medium/low

#### 2.2 Entrance
- **Label**: 입구
- **Color**: `#f59e0b` (주황)
- **Icon**: DoorOpen
- **Description**: 매장 출입구
- **DB Table**: `graph_entities`
- **3D Type**: zone
- **3D Dimensions**: { width: 3, height: 3, depth: 0.5 }
- **Properties**:
  - `entrance_id` (string, required): 입구 ID
  - `entrance_type` (string): main/side/emergency
  - `width_m` (number): 너비 (미터)
  - `has_automatic_door` (boolean): 자동문 여부
  - `is_primary` (boolean): 주출입구 여부

#### 2.3 CheckoutCounter
- **Label**: 계산대
- **Color**: `#eab308` (노랑)
- **Icon**: CreditCard
- **Description**: 결제 카운터
- **DB Table**: `graph_entities`
- **3D Type**: furniture
- **3D Dimensions**: { width: 1.2, height: 1, depth: 0.6 }
- **Properties**:
  - `counter_id` (string, required): 계산대 ID
  - `counter_number` (number, required): 계산대 번호
  - `has_pos_terminal` (boolean): POS 단말 여부
  - `supports_mobile_payment` (boolean): 모바일 결제
  - `is_express_lane` (boolean): 간편 계산대 여부

---

### 3. 제품 관련 (5개)

#### 3.1 Category ⭐ NEW
- **Label**: 제품 카테고리
- **Color**: `#8b5cf6` (보라)
- **Icon**: Layers
- **Description**: 제품 분류 체계
- **DB Table**: `products.category` (현재 문자열, 정규화 권장)
- **Properties**:
  - `category_id` (string, required): 카테고리 ID
  - `category_name` (string, required): 카테고리명
  - `parent_category_id` (string): 상위 카테고리 FK
  - `category_level` (number): 계층 레벨 (1/2/3)
  - `display_order` (number): 표시 순서

#### 3.2 Product
- **Label**: 제품
- **Color**: `#06b6d4` (청록)
- **Icon**: ShoppingBag
- **Description**: 판매 제품
- **DB Table**: `products`
- **3D Type**: product
- **3D Dimensions**: { width: 0.3, height: 0.4, depth: 0.1 }
- **Properties**:
  - `sku` (string, required): SKU 코드
  - `product_name` (string, required): 제품명
  - `category_id` (string, required): 카테고리 FK
  - `brand` (string): 브랜드
  - `price` (number, required): 판매가
  - `cost` (number): 원가
  - `stock` (number): 재고 수량
  - `supplier` (string): 공급업체

#### 3.3 Inventory
- **Label**: 재고
- **Color**: `#84cc16` (연두)
- **Icon**: Package
- **Description**: 제품 재고 현황
- **DB Table**: `inventory_levels`
- **Properties**:
  - `inventory_id` (string, required): 재고 ID
  - `product_id` (string, required): 제품 FK
  - `store_id` (string, required): 매장 FK
  - `current_stock` (number, required): 현재 재고
  - `minimum_stock` (number, required): 최소 재고
  - `optimal_stock` (number, required): 적정 재고
  - `weekly_demand` (number): 주간 수요
  - `last_updated` (string): 마지막 업데이트

#### 3.4 Brand ⭐ NEW
- **Label**: 브랜드
- **Color**: `#a855f7` (보라)
- **Icon**: Award
- **Description**: 제품 브랜드
- **DB Table**: `products.brand` (현재 문자열, 정규화 권장)
- **Properties**:
  - `brand_id` (string, required): 브랜드 ID
  - `brand_name` (string, required): 브랜드명
  - `brand_tier` (string): luxury/premium/standard/value
  - `origin_country` (string): 원산지

#### 3.5 Promotion
- **Label**: 프로모션
- **Color**: `#f59e0b` (주황)
- **Icon**: Tag
- **Description**: 판매 촉진 이벤트
- **DB Table**: 없음 (신규 생성 권장)
- **Properties**:
  - `promotion_id` (string, required): 프로모션 ID
  - `promotion_name` (string, required): 프로모션명
  - `promotion_type` (string): discount/bogo/bundle/seasonal
  - `start_date` (string, required): 시작일
  - `end_date` (string, required): 종료일
  - `discount_rate` (number): 할인율 (%)
  - `target_products` (array): 대상 제품 목록
  - `target_zones` (array): 대상 구역 목록

---

### 4. 고객/거래 (4개)

#### 4.1 Customer
- **Label**: 고객
- **Color**: `#8b5cf6` (보라)
- **Icon**: User
- **Description**: 매장 방문 고객
- **DB Table**: `customers`
- **Properties**:
  - `customer_id` (string, required): 고객 ID
  - `age_group` (string): 10s/20s/30s/40s/50s/60s+
  - `gender` (string): male/female/other
  - `customer_segment` (string): VIP/regular/new/lapsed
  - `signup_date` (string): 가입일
  - `loyalty_tier` (string): platinum/gold/silver/bronze
  - `total_purchases` (number): 누적 구매액
  - `visit_frequency` (string): high/medium/low

#### 4.2 Visit
- **Label**: 방문
- **Color**: `#06b6d4` (청록)
- **Icon**: MapPin
- **Description**: 고객 매장 방문 기록
- **DB Table**: `visits`
- **Properties**:
  - `visit_id` (string, required): 방문 ID
  - `customer_id` (string, required): 고객 FK
  - `store_id` (string, required): 매장 FK
  - `visit_date` (string, required): 방문 날짜
  - `visit_time` (string, required): 방문 시간
  - `duration_minutes` (number): 체류 시간 (분)
  - `zones_visited` (array): 방문 구역 목록
  - `did_purchase` (boolean): 구매 여부
  - `entry_point` (string): 입구 ID

#### 4.3 Transaction ⭐ NEW
- **Label**: 거래
- **Color**: `#10b981` (초록)
- **Icon**: DollarSign
- **Description**: POS 판매 거래 (여러 제품 포함)
- **DB Table**: 없음 (purchases가 라인 아이템)
- **Properties**:
  - `transaction_id` (string, required): 거래 ID
  - `customer_id` (string): 고객 ID (비회원 null)
  - `store_id` (string, required): 매장 FK
  - `transaction_date` (string, required): 거래 날짜
  - `transaction_time` (string, required): 거래 시간
  - `total_amount` (number, required): 총 금액
  - `payment_method` (string): cash/card/mobile/mixed
  - `discount_amount` (number): 할인 금액
  - `num_items` (number): 구매 품목 수
  - `counter_id` (string): 계산대 ID

#### 4.4 Purchase
- **Label**: 구매 항목
- **Color**: `#22c55e` (연두)
- **Icon**: ShoppingCart
- **Description**: 거래 내 개별 제품 구매 라인
- **DB Table**: `purchases`
- **Properties**:
  - `purchase_id` (string, required): 구매 ID
  - `transaction_id` (string, required): 거래 FK
  - `customer_id` (string, required): 고객 FK
  - `product_id` (string, required): 제품 FK
  - `quantity` (number, required): 수량
  - `unit_price` (number, required): 단가
  - `total_price` (number, required): 소계
  - `purchase_date` (string, required): 구매일

---

### 5. 직원/운영 (2개)

#### 5.1 Staff
- **Label**: 직원
- **Color**: `#6366f1` (인디고)
- **Icon**: UserCheck
- **Description**: 매장 근무 직원
- **DB Table**: 없음 (신규 생성 권장)
- **Properties**:
  - `staff_id` (string, required): 직원 ID
  - `staff_name` (string, required): 직원명
  - `role` (string, required): manager/sales/stockist/security
  - `store_id` (string, required): 소속 매장 FK
  - `hire_date` (string): 입사일
  - `employment_type` (string): full_time/part_time/contract

#### 5.2 Shift
- **Label**: 근무 교대
- **Color**: `#14b8a6` (청록)
- **Icon**: Clock
- **Description**: 직원 근무 시프트
- **DB Table**: 없음 (신규 생성 권장)
- **Properties**:
  - `shift_id` (string, required): 시프트 ID
  - `staff_id` (string, required): 직원 FK
  - `shift_date` (string, required): 근무 날짜
  - `start_time` (string, required): 시작 시간
  - `end_time` (string, required): 종료 시간
  - `shift_type` (string): morning/afternoon/evening/night

---

### 6. IoT/센서 (1개)

#### 6.1 WiFiSensor
- **Label**: WiFi 센서
- **Color**: `#2563eb` (파랑)
- **Icon**: Wifi
- **Description**: WiFi 기반 위치 추적 센서
- **DB Table**: `neuralsense_devices`
- **3D Type**: device
- **3D Dimensions**: { width: 0.2, height: 0.2, depth: 0.05 }
- **Properties**:
  - `sensor_id` (string, required): 센서 ID
  - `zone_id` (string, required): 설치 구역 FK
  - `mac_address` (string): MAC 주소
  - `detection_range_m` (number): 탐지 범위 (미터)
  - `status` (string): active/inactive/maintenance

---

## 🟡 HIGH 엔티티 (12개)

> **고우선순위**: AI 추론 핵심

### 7. 외부 컨텍스트 (3개)

#### 7.1 Weather ⭐ NEW
- **Label**: 날씨
- **Color**: `#0ea5e9` (하늘색)
- **Icon**: Cloud
- **Description**: 날씨 데이터
- **DB Table**: `weather_data`
- **Properties**:
  - `weather_id` (string, required): 날씨 ID
  - `date` (string, required): 날짜
  - `store_id` (string, required): 매장 FK
  - `condition` (string): sunny/cloudy/rainy/snowy
  - `temperature_c` (number): 기온 (°C)
  - `precipitation_mm` (number): 강수량 (mm)
  - `is_extreme` (boolean): 극한 날씨 여부

#### 7.2 Holiday ⭐ NEW
- **Label**: 공휴일/이벤트
- **Color**: `#ec4899` (핑크)
- **Icon**: Calendar
- **Description**: 공휴일 및 특별 이벤트
- **DB Table**: `holidays_events`
- **Properties**:
  - `holiday_id` (string, required): 공휴일 ID
  - `date` (string, required): 날짜
  - `event_name` (string, required): 이벤트명
  - `event_type` (string): national/religious/commercial/regional
  - `region` (string): 지역 (전국/지역)
  - `impact_level` (string): high/medium/low

#### 7.3 EconomicIndicator ⭐ NEW
- **Label**: 경제 지표
- **Color**: `#f59e0b` (주황)
- **Icon**: TrendingUp
- **Description**: 경제 지표 데이터
- **DB Table**: `economic_indicators`
- **Properties**:
  - `indicator_id` (string, required): 지표 ID
  - `date` (string, required): 날짜
  - `indicator_type` (string): cpi/unemployment/consumer_confidence
  - `indicator_value` (number): 지표 값
  - `region` (string): 지역
  - `data_source` (string): 데이터 출처

---

### 8. 공간 구조 (3개)

#### 8.1 Aisle
- **Label**: 통로
- **Color**: `#22c55e` (연두)
- **Icon**: MoveHorizontal
- **Description**: 고객 이동 통로
- **DB Table**: `graph_entities`
- **3D Type**: zone
- **3D Dimensions**: { width: 1.5, height: 3, depth: 10 }
- **Properties**:
  - `aisle_code` (string, required): 통로 코드
  - `aisle_type` (string): main/secondary/crossover
  - `width_m` (number, required): 통로 너비 (미터)
  - `length_m` (number, required): 통로 길이 (미터)
  - `connects_zones` (array): 연결 구역 목록

#### 8.2 FittingRoom
- **Label**: 피팅룸
- **Color**: `#ec4899` (핑크)
- **Icon**: Shirt
- **Description**: 고객 착용실
- **DB Table**: `graph_entities`
- **3D Type**: furniture
- **3D Dimensions**: { width: 1.5, height: 2.5, depth: 1.5 }
- **Properties**:
  - `fitting_room_id` (string, required): 피팅룸 ID
  - `zone_id` (string, required): 소속 구역 FK
  - `size_category` (string): small/medium/large
  - `has_mirror` (boolean): 거울 여부
  - `occupancy_sensor` (boolean): 점유 센서

#### 8.3 StorageRoom
- **Label**: 창고
- **Color**: `#78716c` (갈색)
- **Icon**: Package
- **Description**: 재고 보관 공간
- **DB Table**: `graph_entities`
- **3D Type**: zone
- **3D Dimensions**: { width: 4, height: 3, depth: 6 }
- **Properties**:
  - `storage_id` (string, required): 창고 ID
  - `storage_type` (string): backstock/cold/hazmat
  - `capacity_cbm` (number): 용량 (㎥)
  - `current_utilization` (number): 사용률 (%)

---

### 9. 가구/집기 (3개)

#### 9.1 Shelf
- **Label**: 선반
- **Color**: `#f97316` (주황)
- **Icon**: Layers
- **Description**: 제품 진열 선반
- **DB Table**: `graph_entities`
- **3D Type**: furniture
- **3D Dimensions**: { width: 1.2, height: 2, depth: 0.4 }
- **Properties**:
  - `shelf_id` (string, required): 선반 ID
  - `zone_id` (string, required): 소속 구역 FK
  - `shelf_type` (string): wall/gondola/endcap
  - `num_levels` (number): 단 수
  - `width_m` (number): 너비
  - `height_m` (number): 높이
  - `max_load_kg` (number): 최대 적재 중량

#### 9.2 Rack
- **Label**: 랙
- **Color**: `#14b8a6` (청록)
- **Icon**: Grid
- **Description**: 의류/소품 진열 랙
- **DB Table**: `graph_entities`
- **3D Type**: furniture
- **3D Dimensions**: { width: 1.5, height: 1.8, depth: 0.5 }
- **Properties**:
  - `rack_id` (string, required): 랙 ID
  - `zone_id` (string, required): 소속 구역 FK
  - `rack_type` (string): round/straight/4way
  - `capacity_units` (number): 수용 수량
  - `has_casters` (boolean): 바퀴 여부

#### 9.3 DisplayTable
- **Label**: 디스플레이 테이블
- **Color**: `#8b5cf6` (보라)
- **Icon**: Table
- **Description**: 제품 진열 테이블
- **DB Table**: `graph_entities`
- **3D Type**: furniture
- **3D Dimensions**: { width: 1.5, height: 0.9, depth: 1 }
- **Properties**:
  - `table_id` (string, required): 테이블 ID
  - `zone_id` (string, required): 소속 구역 FK
  - `table_shape` (string): rectangular/round/square
  - `width_m` (number): 너비
  - `length_m` (number): 길이

---

### 10. 제품 관련 (1개)

#### 10.1 Supplier
- **Label**: 공급업체
- **Color**: `#0ea5e9` (파랑)
- **Icon**: Truck
- **Description**: 제품 공급사
- **DB Table**: 없음 (신규 생성 권장)
- **Properties**:
  - `supplier_id` (string, required): 공급업체 ID
  - `supplier_name` (string, required): 공급업체명
  - `contact_person` (string): 담당자
  - `email` (string): 이메일
  - `phone` (string): 전화번호
  - `lead_time_days` (number): 평균 리드타임
  - `reliability_score` (number): 신뢰도 (0-100)

---

### 11. IoT/센서 (2개)

#### 11.1 Camera
- **Label**: 카메라
- **Color**: `#dc2626` (빨강)
- **Icon**: Video
- **Description**: CCTV 및 비전 분석 카메라
- **DB Table**: `graph_entities`
- **3D Type**: device
- **3D Dimensions**: { width: 0.15, height: 0.15, depth: 0.2 }
- **Properties**:
  - `camera_id` (string, required): 카메라 ID
  - `zone_id` (string, required): 감시 구역 FK
  - `camera_type` (string): fixed/ptz/dome
  - `resolution` (string): 1080p/4K
  - `has_night_vision` (boolean): 야간 촬영 기능
  - `ai_features` (array): face_detection/people_counting

#### 11.2 Beacon
- **Label**: 비콘
- **Color**: `#2563eb` (파랑)
- **Icon**: Wifi
- **Description**: Bluetooth 비콘 장치
- **DB Table**: `graph_entities`
- **3D Type**: device
- **3D Dimensions**: { width: 0.05, height: 0.05, depth: 0.02 }
- **Properties**:
  - `beacon_id` (string, required): 비콘 ID
  - `zone_id` (string, required): 설치 구역 FK
  - `uuid` (string): UUID
  - `tx_power` (number): 송신 출력 (dBm)
  - `battery_level` (number): 배터리 잔량 (%)

---

## 🟠 MEDIUM 엔티티 (9개)

> **중우선순위**: 고급 기능/특정 업종

### 12. 시계열 집계 (3개)

#### 12.1 DailySales ⭐ NEW
- **Label**: 일별 매출 집계
- **Color**: `#10b981` (초록)
- **Icon**: BarChart
- **Description**: 일별 매출 요약 데이터
- **DB Table**: `dashboard_kpis` (일부 포함)
- **Properties**:
  - `daily_sales_id` (string, required): 일별 집계 ID
  - `store_id` (string, required): 매장 FK
  - `date` (string, required): 날짜
  - `total_revenue` (number): 총 매출
  - `total_transactions` (number): 거래 건수
  - `total_customers` (number): 고객 수
  - `avg_basket_size` (number): 평균 구매액
  - `top_category` (string): 최다 판매 카테고리

#### 12.2 InventoryHistory ⭐ NEW
- **Label**: 재고 이력
- **Color**: `#f59e0b` (주황)
- **Icon**: History
- **Description**: 재고 수량 변화 추이
- **DB Table**: 없음 (신규 생성 권장)
- **Properties**:
  - `history_id` (string, required): 이력 ID
  - `product_id` (string, required): 제품 FK
  - `store_id` (string, required): 매장 FK
  - `recorded_at` (string, required): 기록 시간
  - `stock_level` (number): 재고 수량
  - `stock_change` (number): 변화량 (+/-)
  - `change_reason` (string): sale/restock/return/adjustment

#### 12.3 ZonePerformance ⭐ NEW
- **Label**: 구역 성과
- **Color**: `#8b5cf6` (보라)
- **Icon**: Target
- **Description**: 구역별 성과 지표
- **DB Table**: 없음 (신규 생성 권장)
- **Properties**:
  - `performance_id` (string, required): 성과 ID
  - `zone_id` (string, required): 구역 FK
  - `date` (string, required): 날짜
  - `total_visits` (number): 방문 수
  - `avg_dwell_time` (number): 평균 체류 시간
  - `conversion_rate` (number): 전환율 (%)
  - `revenue_generated` (number): 발생 매출

---

### 13. 운영/직원 (1개)

#### 13.1 Task
- **Label**: 업무
- **Color**: `#8b5cf6` (보라)
- **Icon**: CheckSquare
- **Description**: 직원 수행 업무
- **DB Table**: 없음 (신규 생성 권장)
- **Properties**:
  - `task_id` (string, required): 업무 ID
  - `staff_id` (string, required): 직원 FK
  - `task_name` (string, required): 업무명
  - `task_type` (string): restock/cleaning/display/customer_service
  - `priority` (string): high/medium/low
  - `status` (string): pending/in_progress/completed
  - `due_time` (string): 완료 기한

---

### 14. IoT/센서 (4개)

#### 14.1 PeopleCounter
- **Label**: 인원 계수기
- **Color**: `#10b981` (초록)
- **Icon**: Users
- **Description**: 입장/퇴장 인원 카운터
- **DB Table**: `graph_entities`
- **3D Type**: device
- **3D Dimensions**: { width: 0.3, height: 0.1, depth: 0.1 }
- **Properties**:
  - `counter_id` (string, required): 계수기 ID
  - `entrance_id` (string, required): 입구 FK
  - `technology` (string): thermal/stereo/3D
  - `accuracy_rate` (number): 정확도 (%)
  - `bidirectional` (boolean): 양방향 감지

#### 14.2 DoorSensor
- **Label**: 문 센서
- **Color**: `#f59e0b` (주황)
- **Icon**: DoorOpen
- **Description**: 출입 감지 센서
- **DB Table**: `graph_entities`
- **3D Type**: device
- **3D Dimensions**: { width: 0.08, height: 0.08, depth: 0.03 }
- **Properties**:
  - `sensor_id` (string, required): 센서 ID
  - `entrance_id` (string, required): 입구 FK
  - `sensor_type` (string): magnetic/infrared
  - `battery_level` (number): 배터리 잔량 (%)

#### 14.3 TemperatureSensor
- **Label**: 온도 센서
- **Color**: `#ef4444` (빨강)
- **Icon**: Thermometer
- **Description**: 온도 측정 센서
- **DB Table**: `graph_entities`
- **3D Type**: device
- **3D Dimensions**: { width: 0.1, height: 0.1, depth: 0.05 }
- **Properties**:
  - `sensor_id` (string, required): 센서 ID
  - `zone_id` (string, required): 설치 구역 FK
  - `current_temp_c` (number): 현재 온도 (°C)
  - `min_range_c` (number): 최소 측정 범위
  - `max_range_c` (number): 최대 측정 범위

#### 14.4 HumiditySensor
- **Label**: 습도 센서
- **Color**: `#06b6d4` (청록)
- **Icon**: Droplets
- **Description**: 습도 측정 센서
- **DB Table**: `graph_entities`
- **3D Type**: device
- **3D Dimensions**: { width: 0.1, height: 0.1, depth: 0.05 }
- **Properties**:
  - `sensor_id` (string, required): 센서 ID
  - `zone_id` (string, required): 설치 구역 FK
  - `current_humidity` (number): 현재 습도 (%)
  - `accuracy` (number): 정확도 (±%)

---

### 15. 시스템 (1개)

#### 15.1 Alert
- **Label**: 알림
- **Color**: `#dc2626` (빨강)
- **Icon**: AlertTriangle
- **Description**: 비즈니스 알림 및 경고
- **DB Table**: `ai_recommendations` (일부 포함)
- **Properties**:
  - `alert_id` (string, required): 알림 ID
  - `alert_type` (string): inventory_low/sensor_offline/unusual_traffic/security
  - `severity` (string): critical/high/medium/low
  - `message` (string, required): 메시지
  - `triggered_at` (string, required): 발생 시간
  - `resolved` (boolean): 해결 여부
  - `target_entity_type` (string): product/sensor/zone/staff
  - `target_entity_id` (string): 대상 엔티티 ID

---

## 🟢 LOW 엔티티 (5개)

> **저우선순위**: 나이스투해브

### 16. AI/분석 (2개)

#### 16.1 DemandForecast
- **Label**: 수요 예측
- **Color**: `#14b8a6` (청록)
- **Icon**: TrendingUp
- **Description**: AI 기반 수요 예측
- **DB Table**: 없음 (분석 결과)
- **Properties**:
  - `forecast_id` (string, required): 예측 ID
  - `product_id` (string, required): 제품 FK
  - `forecast_date` (string, required): 예측 날짜
  - `forecast_period` (string): daily/weekly/monthly
  - `predicted_demand` (number): 예측 수요량
  - `confidence_level` (number): 신뢰도 (%)
  - `model_version` (string): 모델 버전

#### 16.2 PriceOptimization
- **Label**: 가격 최적화
- **Color**: `#f59e0b` (주황)
- **Icon**: DollarSign
- **Description**: 동적 가격 최적화
- **DB Table**: 없음 (분석 결과)
- **Properties**:
  - `optimization_id` (string, required): 최적화 ID
  - `product_id` (string, required): 제품 FK
  - `optimized_price` (number, required): 최적화된 가격
  - `original_price` (number): 원래 가격
  - `expected_revenue_impact` (number): 예상 매출 영향
  - `optimization_reason` (string): 최적화 근거

---

### 17. 시스템 (3개)

#### 17.1 POS
- **Label**: POS 시스템
- **Color**: `#eab308` (노랑)
- **Icon**: ShoppingCart
- **Description**: 판매 시점 관리 시스템
- **DB Table**: `graph_entities`
- **3D Type**: device
- **3D Dimensions**: { width: 0.4, height: 0.3, depth: 0.3 }
- **Properties**:
  - `pos_id` (string, required): POS ID
  - `counter_id` (string, required): 계산대 FK
  - `pos_type` (string): fixed/mobile/kiosk
  - `has_touchscreen` (boolean): 터치스크린
  - `os_version` (string): 운영체제 버전

#### 17.2 DigitalSignage
- **Label**: 디지털 사이니지
- **Color**: `#f97316` (주황)
- **Icon**: Monitor
- **Description**: 디지털 광고/안내판
- **DB Table**: `graph_entities`
- **3D Type**: device
- **3D Dimensions**: { width: 1.2, height: 0.7, depth: 0.1 }
- **Properties**:
  - `signage_id` (string, required): 사이니지 ID
  - `zone_id` (string, required): 설치 구역 FK
  - `screen_size_inches` (number): 화면 크기 (인치)
  - `content_type` (string): ad/info/wayfinding
  - `current_content` (string): 현재 표시 콘텐츠

#### 17.3 HVAC
- **Label**: 냉난방 시스템
- **Color**: `#0ea5e9` (파랑)
- **Icon**: Wind
- **Description**: 공조 시스템
- **DB Table**: `graph_entities`
- **3D Type**: device
- **3D Dimensions**: { width: 1, height: 0.6, depth: 0.4 }
- **Properties**:
  - `hvac_id` (string, required): HVAC ID
  - `zone_id` (string, required): 제어 구역 FK
  - `system_type` (string): central/split/vrf
  - `current_mode` (string): cooling/heating/auto/off
  - `target_temp_c` (number): 목표 온도

---

## 🔗 관계 타입 (83개)

> **완전 확장 완료**: 95개 → 70개 → 83개 (추가 13개 CRITICAL 관계로 완전한 그래프 커버리지 구현)

---

### ⭐ CRITICAL (25개) - AI 추론 엔진 필수

#### 공간/레이아웃 (4개)

1. **CONTAINS** (포함함)
   - Source: Store → Zone, Zone → Shelf/Rack/DisplayTable
   - Reverse: PART_OF
   - Directionality: directed
   - Description: 공간 계층 구조

2. **CONNECTED_TO** (연결됨)
   - Source: Zone ↔ Zone, Entrance ↔ Zone
   - Directionality: undirected
   - Description: 구역 간 연결성

3. **HAS_ENTRANCE** (입구 보유)
   - Source: Store → Entrance
   - Directionality: directed

4. **HAS_CHECKOUT** (계산대 보유)
   - Source: Store → CheckoutCounter
   - Directionality: directed

---

#### 상품/재고 (5개)

5. **BELONGS_TO_CATEGORY** (카테고리 소속)
   - Source: Product → Category
   - Directionality: directed

6. **SOLD_BY** (판매됨)
   - Source: Product → Store
   - Reverse: SELLS
   - Directionality: directed

7. **IN_STOCK** (재고 보유)
   - Source: Product → Inventory
   - Directionality: directed

8. **SUPPLIED_BY** (공급받음)
   - Source: Product → Supplier
   - Reverse: SUPPLIES
   - Directionality: directed

9. **HAS_PROMOTION** (프로모션 적용)
   - Source: Product → Promotion
   - Directionality: directed

---

#### 고객/방문 (5개)

10. **VISITED** (방문함)
    - Source: Customer → Store
    - Directionality: directed

11. **PURCHASED** (구매함)
    - Source: Customer → Product
    - Directionality: directed

12. **ENTERED_ZONE** (구역 입장)
    - Source: Visit → Zone
    - Directionality: directed

13. **SPENT_TIME_IN** (체류함)
    - Source: Visit → Zone
    - Properties: { duration_minutes: number }
    - Directionality: directed

14. **CHECKED_OUT_AT** (계산함)
    - Source: Visit → CheckoutCounter
    - Directionality: directed

---

#### 운영/인력 (2개)

15. **WORKS_AT** (근무함)
    - Source: Staff → Store
    - Reverse: EMPLOYS
    - Directionality: directed

16. **ASSIGNED_TO_SHIFT** (시프트 배정)
    - Source: Staff → Shift
    - Directionality: directed

---

#### IoT/센서 (2개)

17. **MONITORED_BY** (감시됨)
    - Source: Zone → WiFiSensor/Camera/Beacon
    - Directionality: directed

18. **DETECTED_BY** (감지됨)
    - Source: Customer → WiFiSensor
    - Directionality: directed

---

#### 분석/성과 (2개)

19. **GENERATED_SALES** (매출 발생)
    - Source: Store → DailySales
    - Directionality: directed

20. **HAS_TRANSACTION** (거래 발생)
    - Source: Visit → Transaction
    - Directionality: directed

---

### 🔵 HIGH (20개) - 고급 AI 추론용

#### 공간/레이아웃 (4개)

21. **HAS_ZONE** (구역 보유)
    - Source: Store → Zone
    - Directionality: directed

22. **HAS_AISLE** (통로 보유)
    - Source: Zone → Aisle
    - Directionality: directed

23. **HAS_FITTING_ROOM** (피팅룸 보유)
    - Source: Zone → FittingRoom
    - Directionality: directed

24. **HAS_STORAGE_ROOM** (창고 보유)
    - Source: Store → StorageRoom
    - Directionality: directed

---

#### 상품/재고 (4개)

25. **PLACED_ON** (배치됨)
    - Source: Product → Shelf/Rack/DisplayTable
    - Directionality: directed
    - Note: DISPLAYED_ON + STORED_IN 통합

26. **PROMOTED_IN** (프로모션 활성)
    - Source: Promotion → Zone
    - Directionality: directed

27. **REPLENISHED** (보충됨)
    - Source: Inventory → Product
    - Directionality: directed

28. **BELONGS_TO_BRAND** (브랜드 소속)
    - Source: Product → Brand
    - Directionality: directed

---

#### 고객/방문 (3개)

29. **TRIED_ON** (착용 시도)
    - Source: Customer → Product
    - Directionality: directed

30. **RETURNED_PRODUCT** (제품 반품)
    - Source: Customer → Product
    - Directionality: directed

31. **BELONGS_TO_SEGMENT** (세그먼트 소속)
    - Source: Customer → CustomerSegment
    - Directionality: directed

---

#### 외부 데이터 (3개)

32. **AFFECTED_BY_WEATHER** (날씨 영향)
    - Source: Store → Weather
    - Reverse: AFFECTS
    - Directionality: directed

33. **AFFECTED_BY_HOLIDAY** (공휴일 영향)
    - Source: Store → Holiday
    - Reverse: AFFECTS
    - Directionality: directed

34. **INFLUENCED_BY_ECONOMIC** (경제 영향)
    - Source: Store → EconomicIndicator
    - Reverse: AFFECTS
    - Directionality: directed

---

#### 분석/성과 (2개)

35. **TRACKED_IN_DAILY_SALES** (일별 매출 추적)
    - Source: Product → DailySales
    - Directionality: directed

36. **RECORDED_IN_INVENTORY_HISTORY** (재고 이력 기록)
    - Source: Product → InventoryHistory
    - Directionality: directed

---

#### 운영/인력 (4개)

37. **ASSIGNED_TO_ZONE** (구역 배정)
    - Source: Staff → Zone
    - Directionality: directed

38. **MANAGES** (관리함)
    - Source: Staff → Store
    - Directionality: directed

---

### 🟡 MEDIUM (15개) - 특정 업종/고급 기능

#### 공간/레이아웃 (3개)

39. **HAS_SHELF** (선반 보유)
    - Source: Zone → Shelf
    - Directionality: directed

40. **HAS_RACK** (랙 보유)
    - Source: Zone → Rack
    - Directionality: directed

41. **HAS_DISPLAY_TABLE** (테이블 보유)
    - Source: Zone → DisplayTable
    - Directionality: directed

---

#### IoT/센서 (2개)

42. **EQUIPPED_WITH** (장비 설치)
    - Source: Zone → Camera/Beacon/PeopleCounter
    - Directionality: directed
    - Note: HAS_CAMERA + HAS_BEACON + HAS_PEOPLE_COUNTER 통합

43. **HAS_WIFI_SENSOR** (WiFi 센서 설치)
    - Source: Zone → WiFiSensor
    - Directionality: directed

---

#### 운영/인력 (2개)

44. **ASSIGNED_TO_TASK** (업무 배정)
    - Source: Staff → Task
    - Directionality: directed

45. **TRIGGERED_ALERT** (알림 발생)
    - Source: Alert → Staff
    - Directionality: directed

---

#### 분석/성과 (2개)

46. **MEASURED_IN_ZONE_PERFORMANCE** (구역 성과 측정)
    - Source: Zone → ZonePerformance
    - Directionality: directed

47. **OPTIMIZED_FOR** (최적화 대상)
    - Source: Product → DemandForecast/PriceOptimization
    - Directionality: directed
    - Note: FORECASTED_DEMAND + RECOMMENDED_PRICE_OPTIMIZATION 통합

---

### 🟢 LOW (10개) - 나이스투해브

#### 시뮬레이션 (2개)

48. **SIMULATED_IN** (시뮬레이션 대상)
    - Source: Product → Scenario
    - Directionality: directed

49. **OPTIMIZED_LAYOUT** (레이아웃 최적화)
    - Source: Zone → LayoutOptimization
    - Directionality: directed

---

#### IoT/센서 (3개)

50. **HAS_POS** (POS 보유)
    - Source: CheckoutCounter → POS
    - Directionality: directed

51. **HAS_DIGITAL_SIGNAGE** (사이니지 설치)
    - Source: Zone → DigitalSignage
    - Directionality: directed

52. **CONTROLLED_BY_HVAC** (공조 제어)
    - Source: Zone → HVAC
    - Directionality: directed

---

#### 추천/최적화 (2개)

53. **RECOMMENDED_PRODUCT** (제품 추천)
    - Source: Customer → Product
    - Directionality: directed

54. **RECOMMENDED_PROMOTION** (프로모션 추천)
    - Source: Customer → Promotion
    - Directionality: directed

---

### ⚡ ADDITIONAL (추가 필수 관계) - 13개

> **2025-01-28 추가**: 완전한 그래프 커버리지를 위한 핵심 관계 확장

#### 방문/거래 핵심 연결 (4개)

55. **VISITED_STORE** (매장 방문)
    - Source: Visit → Store
    - Directionality: directed
    - Properties: { visit_date: string }
    - Description: 방문이 특정 매장에서 발생

56. **OCCURRED_AT_STORE** (매장 거래)
    - Source: Transaction → Store
    - Directionality: directed
    - Properties: { transaction_date: string }
    - Description: 거래가 특정 매장에서 발생

57. **ENTERED_THROUGH** (출입구 진입)
    - Source: Visit → Entrance
    - Directionality: directed
    - Properties: { entry_time: string }
    - Description: 방문이 특정 출입구로 진입

58. **STORED_AT** (매장 재고)
    - Source: Inventory → Store
    - Directionality: directed
    - Properties: { stock_level: number }
    - Description: 재고가 특정 매장에 보관

---

#### 카테고리 계층 (1개)

59. **HAS_SUBCATEGORY** (하위 카테고리)
    - Source: Category → Category
    - Directionality: directed
    - Properties: { hierarchy_level: number }
    - Description: 카테고리가 하위 카테고리 보유

---

#### 프로모션 타겟 (2개)

60. **TARGETS_PRODUCT** (제품 타겟)
    - Source: Promotion → Product
    - Directionality: directed
    - Properties: { discount_rate: number }
    - Description: 프로모션이 특정 제품 타겟

61. **TARGETS_ZONE** (구역 타겟)
    - Source: Promotion → Zone
    - Directionality: directed
    - Description: 프로모션이 특정 구역 타겟

---

#### 시계열 데이터 연결 (4개)

62. **SALES_OF_STORE** (매장 매출)
    - Source: DailySales → Store
    - Directionality: directed
    - Properties: { sales_date: string }
    - Description: 일간 매출이 특정 매장의 데이터

63. **RECORDED_AT_STORE** (매장 이력)
    - Source: InventoryHistory → Store
    - Directionality: directed
    - Description: 재고 이력이 특정 매장에서 기록

64. **HISTORY_OF_PRODUCT** (제품 이력)
    - Source: InventoryHistory → Product
    - Directionality: directed
    - Properties: { change_type: string }
    - Description: 재고 이력이 특정 제품의 데이터

65. **PERFORMANCE_OF_ZONE** (구역 성과)
    - Source: ZonePerformance → Zone
    - Directionality: directed
    - Properties: { performance_date: string }
    - Description: 성과 데이터가 특정 구역의 데이터

---

#### 운영 관계 (1개)

66. **ASSIGNED_TO_STAFF** (직원 배정)
    - Source: Task → Staff
    - Directionality: directed
    - Properties: { assigned_date: string }
    - Description: 작업이 특정 직원에게 배정

---

#### 외부 컨텍스트 (1개)

67. **AFFECTS_STORE** (매장 영향)
    - Source: Weather → Store
    - Directionality: directed
    - Properties: { impact_level: string }
    - Description: 날씨가 특정 매장에 영향

---

### ❌ 제거된 관계 (25개)

**불필요한 공간 세부사항:**
- HAS_WINDOW, HAS_WALL, HAS_STAFF_ZONE, HAS_RESTROOM, HAS_MANNEQUIN

**중복 IoT 센서:**
- HAS_DOOR_SENSOR (Entrance로 통합)
- HAS_TEMPERATURE_SENSOR, HAS_HUMIDITY_SENSOR (Weather로 충분)
- HAS_AUDIO_SYSTEM, MONITORED_BY_LIGHTING_SENSOR (핵심 AI 추론 불필요)

**중복/통합된 관계:**
- DISPLAYED_ON, STORED_IN → PLACED_ON으로 통합
- HAS_CAMERA, HAS_BEACON, HAS_PEOPLE_COUNTER → EQUIPPED_WITH으로 통합
- FORECASTED_DEMAND, RECOMMENDED_PRICE_OPTIMIZATION → OPTIMIZED_FOR로 통합

**측정 불가능한 관계:**
- INFLUENCED_BY_CUSTOMER_WTP (고객 지불의향 측정 불가)
- CONVERTED_IN_PURCHASE (PURCHASED로 충분)

**조직 관계 (중복):**
- belongs_to_org, member_of, customer_of_org (org_id로 충분)

**기타 세부 관계:**
- adjacent_to, accesses, restocks, operates, supervises, assists_customer, scheduled_for, task_in_zone, tracked_by, counted_by, recorded_by, subcategory_of, recommends, substitutes, complements

---

## 데이터 생성 가이드

### 1. 필수 데이터 연결

**기본 구조**:
```
Organization → Store → Zone → Shelf/Rack → Product
```

**고객 여정**:
```
Customer → Visit → Zone → Transaction → Purchase → Product
```

**센서 추적**:
```
WiFiSensor → Zone → Customer
```

---

### 2. 최소 데이터량 권장

| 엔티티 | 최소 권장 | 설명 |
|--------|----------|------|
| Organizations | 1개 | 조직 단위 |
| Stores | 3개 | 매장별 분석 |
| Zones | 8-15개/매장 | 공간 구조 |
| Products | 50-100개 | 제품 분석 |
| Categories | 10-15개 | 카테고리 분류 |
| Customers | 200-500명 | 고객 분석 |
| Visits | 2000-5000건 | 방문 패턴 |
| Transactions | 1000-2000건 | 구매 패턴 |
| Purchases | 3000-5000건 | 제품별 분석 |
| WiFiSensors | 8-12개/매장 | 위치 추적 |
| Weather | 90일치 | 외부 컨텍스트 |
| Holidays | 연간 | 이벤트 영향 |

---

### 3. 데이터베이스 호환성

#### ✅ 완벽 매칭 (8개)
- Organization → `organizations`
- Store → `stores`
- Customer → `customers`
- Product → `products`
- Inventory → `inventory_levels`
- Visit → `visits`
- Purchase → `purchases`
- WiFiSensor → `neuralsense_devices`

#### ⚠️ 온톨로지만 (8개)
- Zone, Entrance, CheckoutCounter, Aisle, FittingRoom, StorageRoom, Shelf, Rack, DisplayTable → `graph_entities`

#### ⚠️ 부분 매칭 (2개)
- Category → `products.category` (문자열, 정규화 권장)
- Brand → `products.brand` (문자열, 정규화 권장)

#### ❌ 신규 생성 권장 (6개)
- Transaction (purchases를 트랜잭션 단위로 묶음)
- Promotion
- Staff
- Shift
- Task
- Supplier

#### ✅ 외부 컨텍스트 (3개)
- Weather → `weather_data`
- Holiday → `holidays_events`
- EconomicIndicator → `economic_indicators`

#### ✅ 시계열 집계 (3개)
- DailySales → `dashboard_kpis` (일부 포함)
- InventoryHistory (신규 생성 권장)
- ZonePerformance (신규 생성 권장)

---

## 버전 정보

- **Version**: 2.2 (완전 관계 확장 완료)
- **Last Updated**: 2025-01-28
- **Total Entity Types**: 43 (CRITICAL 17 | HIGH 12 | MEDIUM 9 | LOW 5)
- **Total Relation Types**: 83 (95개 → 70개 → 83개, 추가 13개 핵심 관계 확장)
- **Database Compatibility**: 47% (8개 완벽 매칭 / 17개 CRITICAL)
- **Compatible with**: NEURALTWIN v3.0+
- **Optimization**: AI 추론 엔진 필수 관계 집중 + 완전한 그래프 커버리지 구현

---

## 참고 문서

- `GPT_DATASET_GENERATION_GUIDE.md`: 데이터셋 생성 가이드
- `WIFI_TRACKING_CSV_GUIDE.md`: WiFi 추적 데이터 명세
- `3D_MODEL_FILENAME_SPECIFICATION.md`: 3D 모델 파일 명명 규칙
- `ONTOLOGY_AI_INFERENCE_PHASE3.md`: AI 추론 엔진 가이드
- `COMPLETE_FEATURE_IMPLEMENTATION_AUDIT.md`: 백엔드 연동 상태
