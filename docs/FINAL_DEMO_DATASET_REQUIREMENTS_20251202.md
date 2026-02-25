# NEURALTWIN 최종 데모 데이터셋 요구사항

> **최종 업데이트**: 2025-12-02  
> **온톨로지 스키마 버전**: v3.0 (62 Entities, 99 Relations)  
> **대상**: 고객 대시보드 전체 기능 완전 Demonstration  
> **통합 문서**: GPT_DATASET_GENERATION_GUIDE.md + DEMO_DATASET_REQUIREMENTS.md

---

## 📋 목차

1. [개요 및 목적](#1-개요-및-목적)
2. [온톨로지 스키마 v3.0 구조](#2-온톨로지-스키마-v30-구조)
3. [대시보드 페이지별 필수 데이터](#3-대시보드-페이지별-필수-데이터)
4. [CRITICAL 엔티티 데이터셋 (25개)](#4-critical-엔티티-데이터셋-25개)
5. [HIGH 엔티티 데이터셋 (19개)](#5-high-엔티티-데이터셋-19개)
6. [MEDIUM 엔티티 데이터셋 (13개)](#6-medium-엔티티-데이터셋-13개)
7. [3D 모델 및 메타데이터](#7-3d-모델-및-메타데이터)
8. [온톨로지 관계 데이터](#8-온톨로지-관계-데이터)
9. [GPT 데이터 생성 가이드](#9-gpt-데이터-생성-가이드)
10. [데이터 검증 및 품질 관리](#10-데이터-검증-및-품질-관리)

---

## 1. 개요 및 목적

### 1.1 프로젝트 구조 및 작동 방식

**NEURALTWIN**은 오프라인 매장의 디지털 트윈을 구현하는 시스템으로:
- 3D 공간에서 실시간 고객 동선 시각화
- WiFi 센서 기반 위치 트래킹
- AI 기반 매장 분석 및 최적화 추천
- v3.0 온톨로지 기반 유연한 데이터 모델링

### 1.2 데이터 흐름

```
[CSV/API 업로드] → [Storage] → [ETL 처리] → [온톨로지 그래프 생성]
                                                    ↓
                                          [데이터베이스 트리거]
                                                    ↓
                                    [graph_entities + graph_relations]
                                                    ↓
                                    ┌──────────────┴──────────────┐
                                    ↓                             ↓
                        [3D 디지털 트윈 시각화]       [AI 추론 엔진]
                                    ↓                             ↓
                        [실시간 동선 분석]           [추천/이상탐지/패턴분석]
```

### 1.3 데이터셋 우선순위

| 우선순위 | 엔티티 수 | 최소 레코드 | 설명 |
|---------|----------|------------|------|
| 🔴 **CRITICAL** | 25 | 7,500+ | 기본 기능 필수 (조직, 매장, 제품, 고객, 거래, 직원, 센서, AI 모델) |
| 🟡 **HIGH** | 19 | 3,500+ | AI 추론 필수 (환경 데이터, 가구, 공급망, 시뮬레이션, KPI) |
| 🟢 **MEDIUM** | 13 | 1,000+ | 고급 분석 기능 (시계열 분석, 성과 추적, IoT 센서) |
| ⚪ **LOW** | 5 | 선택적 | Nice-to-have (현재 MEDIUM과 통합) |

### 1.4 전체 데이터 구조 개요

```
Organization (1개)
└── Store (1개 - NT-FLG-001 NEURALTWIN Flagship Store)
    │
    ├── 공간 구조 (27개)
    │   ├── Zone (8개: A-입구, B-가방, C-하의, D-상의, E-신발, F-아우터, G-프리미엄, H-계산대)
    │   ├── Entrance (2개: 메인 출입구, 측면 출입구)
    │   ├── CheckoutCounter (3개: 일반 계산대 2개 + 익스프레스 1개)
    │   ├── Aisle (6개)
    │   ├── FittingRoom (2개)
    │   ├── StorageRoom (1개)
    │   ├── Shelf (12개)
    │   ├── Rack (8개)
    │   └── DisplayTable (6개)
    │
    ├── 제품 체계 (445개)
    │   ├── Category (20개 - 3레벨 계층)
    │   │   ├── Level 1: 의류, 신발, 액세서리
    │   │   ├── Level 2: 상의, 하의, 아우터, 운동화, 구두, 가방, 지갑, 모자, 벨트
    │   │   └── Level 3: 티셔츠, 셔츠, 청바지, 면바지, 자켓, 코트, 스니커즈, 러닝화
    │   ├── Product (200개)
    │   ├── Brand (15개)
    │   ├── Supplier (10개)
    │   ├── Inventory (200개)
    │   └── Promotion (10개)
    │
    ├── 고객/거래 (4,000개)
    │   ├── Customer (500명)
    │   │   ├── VIP: 50명 (10%) - 월 3-5회 방문, 고가 상품
    │   │   ├── Regular: 300명 (60%) - 월 1-2회 방문, 중가 상품
    │   │   └── New: 150명 (30%) - 첫 구매, 저가 상품
    │   ├── Visit (2,000건 - 3개월)
    │   ├── Transaction (1,000건)
    │   └── Purchase (2,500건)
    │
    ├── 직원/운영 (565개)
    │   ├── Staff (15명)
    │   ├── Shift (450건 - 1개월)
    │   └── Task (100건)
    │
    ├── IoT 센서 및 이벤트 (15,018개)
    │   ├── WiFiSensor (6개)
    │   ├── Camera (8개)
    │   ├── Beacon (4개)
    │   ├── PeopleCounter (2개)
    │   ├── SensorEvent (10,000건)
    │   └── CustomerEvent (5,000건)
    │
    ├── 환경/외부 데이터 (390개)
    │   ├── Weather (90일치)
    │   ├── Holiday (30건)
    │   └── EconomicIndicator (270건 = 3개 지표 × 90일)
    │
    ├── 분석/성과 데이터 (6,810개)
    │   ├── DailySales (90일)
    │   ├── InventoryHistory (6,000건 = 200개 제품 × 30일)
    │   ├── ZonePerformance (720건 = 8개 Zone × 90일)
    │   └── Alert (50건)
    │
    ├── AI/시뮬레이션 (515개)
    │   ├── Model (5개: 수요예측, 재고최적화, 가격최적화, 추천, 이상탐지)
    │   ├── ModelRun (50건)
    │   ├── ModelEmbedding (1,000건 제품 벡터)
    │   ├── AIInsight (200건)
    │   ├── Scenario (10개)
    │   ├── SimulationResult (50건)
    │   ├── DemandForecast (200건)
    │   └── PriceOptimization (200건)
    │
    ├── 데이터 파이프라인 (63개)
    │   ├── DataSource (3개: POS, ERP, CRM)
    │   ├── DataSourceTable (10개)
    │   └── ColumnMapping (50개)
    │
    └── 비즈니스 규칙 (1,465개)
        ├── KPI (15개)
        ├── KPIValue (1,350건 = 15개 KPI × 90일)
        ├── RetailConcept (20개)
        ├── BusinessRule (30개)
        └── Alert (50건)

**총 레코드 수: ~29,000개**
```

---

## 2. 온톨로지 스키마 v3.0 구조

### 2.1 엔티티 분류 (62개)

#### 🔴 CRITICAL (25개) - 기본 기능
1. **조직/매장**: Organization, Store
2. **공간 구조**: Zone, Entrance, CheckoutCounter
3. **제품**: Category, Product, Inventory, Brand, Promotion
4. **고객/거래**: Customer, Visit, Transaction, Purchase
5. **직원/운영**: Staff, Shift
6. **센서**: WiFiSensor
7. **데이터 파이프라인**: DataSource, DataSourceTable, ColumnMapping
8. **이벤트**: BaseEvent, CustomerEvent, SensorEvent
9. **AI 모델**: Model, ModelRun, ModelEmbedding, AIInsight

#### 🟡 HIGH (19개) - AI 추론 필수
Weather, Holiday, EconomicIndicator, Aisle, FittingRoom, StorageRoom, Shelf, Rack, DisplayTable, Supplier, Camera, Beacon, Scenario, SimulationResult, KPI, KPIValue, RetailConcept, BusinessRule, DemandForecast

#### 🟢 MEDIUM (13개) - 고급 분석
DailySales, InventoryHistory, ZonePerformance, Task, PeopleCounter, DoorSensor, TemperatureSensor, HumiditySensor, Alert, PriceOptimization, POS, DigitalSignage, HVAC

### 2.2 관계 분류 (99개)

#### CRITICAL (32개)
BELONGS_TO, HAS_ZONE, HAS_ENTRANCE, HAS_CHECKOUT, BELONGS_TO_CATEGORY, HAS_SUBCATEGORY, PARENT_OF, MANUFACTURED_BY, SOLD_AT, STORED_AT, PURCHASED_PRODUCT, MADE_TRANSACTION, VISITED_STORE, ENTERED_THROUGH, WORKS_AT, ASSIGNED_TO_STORE, CHECKED_OUT_AT, OCCURRED_AT_STORE, ASSIGNED_TO_STAFF 등

#### HIGH (27개)
AFFECTED_BY_WEATHER, AFFECTED_BY_HOLIDAY, INFLUENCED_BY_INDICATOR, HAS_SHELF, HAS_RACK, DISPLAYED_ON, SUPPLIED_BY, MONITORED_BY_CAMERA, TRACKED_BY_BEACON, TARGETS_PRODUCT, APPLIED_IN_ZONE 등

#### MEDIUM (17개)
SALES_OF_STORE, HISTORY_OF_PRODUCT, PERFORMANCE_OF_ZONE, COUNTED_BY, SENSED_BY_DOOR, MEASURED_TEMPERATURE, MEASURED_HUMIDITY, TARGETS_ENTITY 등

#### ADDITIONAL (23개)
기타 보완 관계들

---

## 3. 대시보드 페이지별 필수 데이터

### (A) Overview - 개요

#### 📊 DashboardPage
**필수 엔티티**: Store, Customer, Visit, Transaction, Purchase, DailySales, ZonePerformance, AIInsight, Alert

**최소 데이터**:
- Store: 1개
- Customer: 500명
- Visit: 2,000건 (3개월)
- Transaction: 1,000건
- Purchase: 2,500건
- DailySales: 90일치
- ZonePerformance: 720건 (8개 Zone × 90일)
- AIInsight: 50건
- Alert: 20건

#### 🏪 StoresPage
**필수 엔티티**: Store, Zone, Staff, DailySales, ZonePerformance

**최소 데이터**:
- Store: 1개 (완전한 정보)
- Zone: 8개
- Staff: 15명
- DailySales: 90일
- ZonePerformance: 720건

#### 💬 HQCommunicationPage
**필수 엔티티**: Organization, Store, Staff, Task

**최소 데이터**:
- Organization: 1개
- Store: 1개
- Staff: 15명 (역할별)
- Task: 100건 (본사 지시사항)

#### ⚙️ SettingsPage
**필수 엔티티**: Organization, DataSource, DataSourceTable

**최소 데이터**:
- Organization: 1개
- DataSource: 3개 (POS, ERP, CRM)
- DataSourceTable: 10개

---

### (B) Store Analysis - 매장 현황 분석

#### 🏬 StoreAnalysisPage
**필수 엔티티**: Store, Zone, ZonePerformance, DailySales, Staff, Shift

**최소 데이터**:
- Store: 1개
- Zone: 8개
- ZonePerformance: 720건
- DailySales: 90일
- Staff: 15명
- Shift: 450건 (15명 × 30일)

#### 👤 CustomerAnalysisPage (CRITICAL 우선순위)
**필수 엔티티**: Customer, Visit, Purchase, Transaction, CustomerEvent

**최소 데이터**:
- Customer: 500명 (세그먼트별 분포 정확히)
- Visit: 2,000건
- Purchase: 2,500건
- Transaction: 1,000건
- CustomerEvent: 5,000건

#### 📦 ProductAnalysisPage
**필수 엔티티**: Product, Category, Brand, Inventory, Purchase, InventoryHistory

**최소 데이터**:
- Product: 200개
- Category: 20개 (3 레벨 계층)
- Brand: 15개
- Inventory: 200건
- Purchase: 2,500건
- InventoryHistory: 6,000건 (200개 × 30일)

---

### (C) Simulation - 시뮬레이션

#### 🎯 DigitalTwin3DPage
**필수 엔티티**: Store, Zone, Product, Shelf, Rack, DisplayTable, Camera, WiFiSensor, CustomerEvent

**최소 데이터**:
- Store: 1개 (3D 모델 필수)
- Zone: 8개 (각 3D 모델)
- Product: 200개 (카테고리별 대표 모델)
- Shelf: 12개
- Rack: 8개
- DisplayTable: 6개
- Camera: 8개
- WiFiSensor: 6개
- CustomerEvent: 5,000건 (동선 데이터)

#### 🔬 SimulationHubPage
**필수 엔티티**: Scenario, SimulationResult, DemandForecast, PriceOptimization, Model, ModelRun

**최소 데이터**:
- Scenario: 10개 (레이아웃/수요/재고/가격/프로모션)
- SimulationResult: 50건
- DemandForecast: 200건
- PriceOptimization: 200건
- Model: 5개 (AI 모델 정의)
- ModelRun: 50건

---

### (D) Data Management - 데이터 관리

#### 📂 UnifiedDataManagementPage
**필수 엔티티**: DataSource, DataSourceTable, ColumnMapping

**최소 데이터**:
- DataSource: 3개 (POS, ERP, CRM)
- DataSourceTable: 10개
- ColumnMapping: 50개

#### 🧬 SchemaBuilderPage
**필수 엔티티**: ontology_entity_types, ontology_relation_types

**최소 데이터**:
- Entity Types: 62개 (v3.0 마스터 스키마)
- Relation Types: 99개 (v3.0 마스터 스키마)

#### 🔌 APIIntegrationPage
**필수 엔티티**: DataSource, DataSourceTable, ColumnMapping

**최소 데이터**:
- DataSource: 3개
- DataSourceTable: 10개
- ColumnMapping: 50개

---

## 4. CRITICAL 엔티티 데이터셋 (25개)

### 4.1 Organization (조직)

**파일명**: `organizations.csv`  
**최소 레코드**: 1개

| 컬럼명 | 타입 | 필수 | 설명 | 예시 |
|--------|------|------|------|------|
| org_id | string | ✅ | 조직 ID | ORG-001 |
| org_name | string | ✅ | 조직명 | NEURALTWIN Fashion |
| org_type | string | ❌ | 조직 유형 | retail |
| industry | string | ❌ | 업종 | fashion |
| country | string | ❌ | 국가 | KR |
| created_at | datetime | ❌ | 생성일 | 2024-01-01 |

**샘플 데이터**:
```csv
org_id,org_name,org_type,industry,country,created_at
ORG-001,NEURALTWIN Fashion,retail,fashion,KR,2024-01-01
```

---

### 4.2 Store (매장)

**파일명**: `stores.csv`  
**최소 레코드**: 1개

| 컬럼명 | 타입 | 필수 | 설명 | 예시 |
|--------|------|------|------|------|
| store_code | string | ✅ | 매장 코드 | NT-FLG-001 |
| store_name | string | ✅ | 매장명 | NEURALTWIN Flagship Store |
| address | string | ✅ | 주소 | 서울 강남구 테헤란로 427 |
| area_sqm | number | ✅ | 면적 (㎡) | 200 |
| opening_date | date | ❌ | 오픈일 | 2024-01-15 |
| store_format | string | ❌ | 매장 포맷 | flagship |
| region | string | ❌ | 지역 | Seoul |
| district | string | ❌ | 구역 | Gangnam |
| manager_name | string | ❌ | 매니저명 | 김매니저 |
| org_id | string | ✅ | 조직 ID | ORG-001 |

**샘플 데이터**:
```csv
store_code,store_name,address,area_sqm,opening_date,store_format,region,district,manager_name,org_id
NT-FLG-001,NEURALTWIN Flagship Store,서울 강남구 테헤란로 427,200,2024-01-15,flagship,Seoul,Gangnam,김매니저,ORG-001
```

---

### 4.3 Zone (구역)

**파일명**: `zones.csv`  
**최소 레코드**: 8개

| 컬럼명 | 타입 | 필수 | 설명 | 예시 |
|--------|------|------|------|------|
| zone_id | string | ✅ | 구역 ID | ZONE-A |
| zone_type | string | ✅ | 구역 유형 | entrance |
| zone_name | string | ✅ | 구역명 | 존-A (입구) |
| area_sqm | number | ❌ | 면적 (㎡) | 16 |
| purpose | string | ❌ | 목적 | 고객 입장 및 환영 |
| traffic_level | string | ❌ | 트래픽 레벨 | high |
| x | number | ❌ | X 좌표 (3D) | 0.0 |
| z | number | ❌ | Z 좌표 (3D) | 0.0 |
| width | number | ❌ | 너비 (m) | 4.0 |
| depth | number | ❌ | 깊이 (m) | 4.0 |

**Zone Types**:
- `entrance`: 입구 구역
- `product_display`: 제품 진열 구역
- `checkout`: 계산대 구역
- `storage`: 창고/보관 구역
- `fitting`: 피팅룸 구역

**샘플 데이터**:
```csv
zone_id,zone_type,zone_name,area_sqm,purpose,traffic_level,x,z,width,depth
ZONE-A,entrance,존-A (입구),16,고객 입장 및 환영,high,0.0,0.0,4.0,4.0
ZONE-B,product_display,존-B (가방/액세서리),25,가방 및 액세서리 진열,medium,4.0,0.0,5.0,5.0
ZONE-C,product_display,존-C (하의),25,하의 제품 진열,medium,9.0,0.0,5.0,5.0
ZONE-D,product_display,존-D (상의),25,상의 제품 진열,high,14.0,0.0,5.0,5.0
ZONE-E,product_display,존-E (신발),25,신발 제품 진열,medium,4.0,5.0,5.0,5.0
ZONE-F,product_display,존-F (아우터),25,아우터 제품 진열,low,9.0,5.0,5.0,5.0
ZONE-G,product_display,존-G (프리미엄),25,프리미엄 제품 진열,medium,14.0,5.0,5.0,5.0
ZONE-H,checkout,존-H (계산대),16,결제 및 포장,high,16.0,0.0,4.0,4.0
```

---

### 4.4 Entrance (출입구)

**파일명**: `entrances.csv`  
**최소 레코드**: 2개

| 컬럼명 | 타입 | 필수 | 설명 | 예시 |
|--------|------|------|------|------|
| entrance_id | string | ✅ | 출입구 ID | ENT-MAIN-01 |
| entrance_type | string | ❌ | 유형 | main |
| width_m | number | ❌ | 너비 (미터) | 3.0 |
| is_primary | boolean | ❌ | 메인 출입구 여부 | true |
| zone_id | string | ❌ | 소속 구역 | ZONE-A |

**샘플 데이터**:
```csv
entrance_id,entrance_type,width_m,is_primary,zone_id
ENT-MAIN-01,main,3.0,true,ZONE-A
ENT-SIDE-01,side,2.0,false,ZONE-A
```

---

### 4.5 CheckoutCounter (계산대)

**파일명**: `checkout_counters.csv`  
**최소 레코드**: 3개

| 컬럼명 | 타입 | 필수 | 설명 | 예시 |
|--------|------|------|------|------|
| counter_id | string | ✅ | 계산대 ID | CHK-01 |
| counter_number | number | ✅ | 계산대 번호 | 1 |
| has_pos_terminal | boolean | ❌ | POS 단말기 보유 | true |
| supports_mobile_payment | boolean | ❌ | 모바일 결제 지원 | true |
| is_express_lane | boolean | ❌ | 익스프레스 레인 | false |
| zone_id | string | ❌ | 소속 구역 | ZONE-H |

**샘플 데이터**:
```csv
counter_id,counter_number,has_pos_terminal,supports_mobile_payment,is_express_lane,zone_id
CHK-01,1,true,true,false,ZONE-H
CHK-02,2,true,true,false,ZONE-H
CHK-03,3,true,true,true,ZONE-H
```

---

### 4.6 Category (카테고리)

**파일명**: `categories.csv`  
**최소 레코드**: 20개 (3레벨 계층)

| 컬럼명 | 타입 | 필수 | 설명 | 예시 |
|--------|------|------|------|------|
| category_id | string | ✅ | 카테고리 ID | CAT-001 |
| category_name | string | ✅ | 카테고리명 | 의류 |
| parent_category_id | string | ❌ | 상위 카테고리 | null |
| category_level | number | ❌ | 계층 레벨 | 1 |
| display_order | number | ❌ | 표시 순서 | 1 |

**샘플 데이터** (3레벨 계층):
```csv
category_id,category_name,parent_category_id,category_level,display_order
CAT-001,의류,,1,1
CAT-002,신발,,1,2
CAT-003,액세서리,,1,3
CAT-004,상의,CAT-001,2,1
CAT-005,하의,CAT-001,2,2
CAT-006,아우터,CAT-001,2,3
CAT-007,티셔츠,CAT-004,3,1
CAT-008,셔츠,CAT-004,3,2
CAT-009,청바지,CAT-005,3,1
CAT-010,면바지,CAT-005,3,2
CAT-011,자켓,CAT-006,3,1
CAT-012,코트,CAT-006,3,2
CAT-013,운동화,CAT-002,2,1
CAT-014,구두,CAT-002,2,2
CAT-015,가방,CAT-003,2,1
CAT-016,지갑,CAT-003,2,2
CAT-017,모자,CAT-003,2,3
CAT-018,벨트,CAT-003,2,4
CAT-019,스니커즈,CAT-013,3,1
CAT-020,러닝화,CAT-013,3,2
```

---

### 4.7 Product (제품)

**파일명**: `products.csv`  
**최소 레코드**: 200개

| 컬럼명 | 타입 | 필수 | 설명 | 예시 |
|--------|------|------|------|------|
| sku | string | ✅ | SKU | SKU-TS-001 |
| product_name | string | ✅ | 제품명 | 베이직 화이트 티셔츠 |
| category_id | string | ✅ | 카테고리 ID | CAT-007 |
| brand | string | ❌ | 브랜드 | NEURALTWIN Basic |
| selling_price | number | ✅ | 판매가 (원) | 29000 |
| cost_price | number | ❌ | 원가 (원) | 15000 |
| supplier | string | ❌ | 공급업체 | SUP-001 |
| lead_time_days | number | ❌ | 리드타임 (일) | 7 |
| size | string | ❌ | 사이즈 | M |
| color | string | ❌ | 색상 | White |

**카테고리별 분포** (200개 총):
- 상의 (티셔츠/셔츠): 60개 (30%)
- 하의 (청바지/면바지): 40개 (20%)
- 아우터 (자켓/코트): 30개 (15%)
- 신발 (운동화/구두): 40개 (20%)
- 액세서리 (가방/지갑/모자/벨트): 30개 (15%)

**가격대 분포**:
- 저가 (<50,000원): 60개 (30%)
- 중가 (50,000-150,000원): 100개 (50%)
- 고가 (>150,000원): 40개 (20%)

**샘플 데이터**:
```csv
sku,product_name,category_id,brand,selling_price,cost_price,supplier,lead_time_days,size,color
SKU-TS-001,베이직 화이트 티셔츠,CAT-007,NEURALTWIN Basic,29000,15000,SUP-001,7,M,White
SKU-TS-002,베이직 블랙 티셔츠,CAT-007,NEURALTWIN Basic,29000,15000,SUP-001,7,M,Black
SKU-SH-001,옥스포드 화이트 셔츠,CAT-008,Premium Shirts,79000,40000,SUP-002,14,L,White
SKU-JE-001,클래식 청바지,CAT-009,Denim Pro,89000,45000,SUP-001,10,32,Blue
SKU-JA-001,레더 자켓,CAT-011,Leather King,299000,150000,SUP-003,21,L,Black
```

---

### 4.8 Inventory (재고)

**파일명**: `inventory.csv`  
**최소 레코드**: 200개 (제품당 1개)

| 컬럼명 | 타입 | 필수 | 설명 | 예시 |
|--------|------|------|------|------|
| inventory_id | string | ✅ | 재고 ID | INV-001 |
| sku | string | ✅ | SKU (products.csv 참조) | SKU-TS-001 |
| current_stock | number | ✅ | 현재 재고 | 45 |
| minimum_stock | number | ✅ | 최소 재고 | 10 |
| optimal_stock | number | ✅ | 최적 재고 | 50 |
| reorder_point | number | ❌ | 재주문 시점 | 15 |
| last_restocked | date | ❌ | 마지막 입고일 | 2024-11-25 |

**재고 레벨 분포**:
- 정상 (current ≥ minimum): 150개 (75%)
- 주의 (minimum ≤ current < reorder): 30개 (15%)
- 부족 (current < minimum): 20개 (10%)

**샘플 데이터**:
```csv
inventory_id,sku,current_stock,minimum_stock,optimal_stock,reorder_point,last_restocked
INV-001,SKU-TS-001,45,10,50,15,2024-11-25
INV-002,SKU-TS-002,38,10,50,15,2024-11-25
INV-003,SKU-SH-001,22,5,30,8,2024-11-20
INV-004,SKU-JE-001,8,10,40,15,2024-11-15
INV-005,SKU-JA-001,5,3,15,5,2024-11-10
```

---

### 4.9 Brand (브랜드)

**파일명**: `brands.csv`  
**최소 레코드**: 15개

| 컬럼명 | 타입 | 필수 | 설명 | 예시 |
|--------|------|------|------|------|
| brand_id | string | ✅ | 브랜드 ID | BRD-001 |
| brand_name | string | ✅ | 브랜드명 | NEURALTWIN Basic |
| brand_tier | string | ❌ | 브랜드 등급 | premium |
| country_of_origin | string | ❌ | 원산지 | KR |
| established_year | number | ❌ | 설립 연도 | 2020 |

**샘플 데이터**:
```csv
brand_id,brand_name,brand_tier,country_of_origin,established_year
BRD-001,NEURALTWIN Basic,basic,KR,2020
BRD-002,Premium Shirts,premium,IT,1995
BRD-003,Denim Pro,mid,US,2010
BRD-004,Leather King,luxury,IT,1980
BRD-005,Urban Sneakers,mid,KR,2018
```

---

### 4.10 Promotion (프로모션)

**파일명**: `promotions.csv`  
**최소 레코드**: 10개

| 컬럼명 | 타입 | 필수 | 설명 | 예시 |
|--------|------|------|------|------|
| promotion_id | string | ✅ | 프로모션 ID | PROMO-001 |
| promotion_name | string | ✅ | 프로모션명 | 겨울 신상품 할인 |
| promotion_type | string | ✅ | 프로모션 유형 | seasonal |
| discount_rate | number | ❌ | 할인율 (%) | 20 |
| start_date | date | ✅ | 시작일 | 2024-12-01 |
| end_date | date | ✅ | 종료일 | 2024-12-31 |
| target_category | string | ❌ | 대상 카테고리 | CAT-006 |

**샘플 데이터**:
```csv
promotion_id,promotion_name,promotion_type,discount_rate,start_date,end_date,target_category
PROMO-001,겨울 신상품 할인,seasonal,20,2024-12-01,2024-12-31,CAT-006
PROMO-002,주말 특가,weekend,15,2024-12-07,2024-12-08,
PROMO-003,VIP 고객 특별 할인,loyalty,25,2024-12-01,2024-12-31,
PROMO-004,재고 정리 세일,clearance,30,2024-11-20,2024-11-30,CAT-004
```

---

### 4.11 Customer (고객)

**파일명**: `customers.csv`  
**최소 레코드**: 500명

| 컬럼명 | 타입 | 필수 | 설명 | 예시 |
|--------|------|------|------|------|
| customer_id | string | ✅ | 고객 ID | CUST-0001 |
| age_group | string | ❌ | 연령대 | 20s |
| gender | string | ❌ | 성별 | F |
| customer_segment | string | ✅ | 세그먼트 | VIP |
| signup_date | date | ❌ | 가입일 | 2024-01-15 |
| total_purchase_count | number | ❌ | 총 구매 횟수 | 25 |
| lifetime_value | number | ❌ | 생애 가치 (원) | 2500000 |
| avg_purchase_amount | number | ❌ | 평균 구매액 | 100000 |
| last_visit_date | date | ❌ | 마지막 방문일 | 2024-11-30 |

**세그먼트 분포** (500명):
- VIP: 50명 (10%)
  - total_purchase_count: 20-50회
  - avg_purchase_amount: 100,000-200,000원
  - lifetime_value: 2,000,000-10,000,000원
- Regular: 300명 (60%)
  - total_purchase_count: 5-19회
  - avg_purchase_amount: 50,000-100,000원
  - lifetime_value: 250,000-1,900,000원
- New: 150명 (30%)
  - total_purchase_count: 1-4회
  - avg_purchase_amount: 30,000-80,000원
  - lifetime_value: 30,000-320,000원

**인구통계 분포**:
- 연령대: 10s(5%), 20s(30%), 30s(35%), 40s(20%), 50s(7%), 60s+(3%)
- 성별: F(60%), M(38%), Other(2%)

**샘플 데이터**:
```csv
customer_id,age_group,gender,customer_segment,signup_date,total_purchase_count,lifetime_value,avg_purchase_amount,last_visit_date
CUST-0001,30s,F,VIP,2024-01-15,42,3780000,90000,2024-11-30
CUST-0002,20s,M,Regular,2024-02-20,12,840000,70000,2024-11-28
CUST-0003,40s,F,Regular,2024-03-10,8,640000,80000,2024-11-25
CUST-0004,20s,F,New,2024-11-15,2,120000,60000,2024-11-28
CUST-0005,50s,M,VIP,2024-01-20,35,4200000,120000,2024-12-01
```

---

### 4.12 Visit (방문)

**파일명**: `visits.csv`  
**최소 레코드**: 2,000건 (3개월)

| 컬럼명 | 타입 | 필수 | 설명 | 예시 |
|--------|------|------|------|------|
| visit_id | string | ✅ | 방문 ID | VISIT-0001 |
| customer_id | string | ❌ | 고객 ID | CUST-0001 |
| store_code | string | ✅ | 매장 코드 | NT-FLG-001 |
| visit_datetime | datetime | ✅ | 방문 일시 | 2024-11-15 14:30:00 |
| entry_time | time | ✅ | 입장 시간 | 14:30:00 |
| exit_time | time | ❌ | 퇴장 시간 | 15:05:00 |
| duration_minutes | number | ❌ | 체류 시간 (분) | 35 |
| zones_visited | string | ❌ | 방문 구역 (쉼표 구분) | ZONE-A,ZONE-C,ZONE-D,ZONE-H |
| did_purchase | boolean | ✅ | 구매 여부 | true |
| session_id | string | ❌ | 세션 ID (WiFi 매칭용) | SESS-0001 |

**데이터 생성 규칙**:
- 기간: 2024-09-01 ~ 2024-11-30 (3개월)
- 시간대 분포: 오전(10-12시) 10%, 점심(12-14시) 20%, 오후(14-18시) 40%, 저녁(18-22시) 30%
- 요일 분포: 주중(60%), 주말(40%)
- 체류 시간: 평균 20-40분, 표준편차 15분
  - 구매함: 평균 30-50분
  - 구매 안 함: 평균 10-25분
- zones_visited: 평균 3-7개 구역
- 전환율 (did_purchase=true): 40% (800건/2,000건)
- 재방문율: 60% (기존 고객)

**샘플 데이터**:
```csv
visit_id,customer_id,store_code,visit_datetime,entry_time,exit_time,duration_minutes,zones_visited,did_purchase,session_id
VISIT-0001,CUST-0001,NT-FLG-001,2024-11-15 14:30:00,14:30:00,15:05:00,35,"ZONE-A,ZONE-C,ZONE-D,ZONE-H",true,SESS-0001
VISIT-0002,,NT-FLG-001,2024-11-15 14:45:00,14:45:00,15:00:00,15,"ZONE-A,ZONE-B",false,SESS-0002
VISIT-0003,CUST-0002,NT-FLG-001,2024-11-15 15:00:00,15:00:00,15:45:00,45,"ZONE-A,ZONE-B,ZONE-C,ZONE-D,ZONE-E,ZONE-H",true,SESS-0003
```

---

### 4.13 Transaction (거래)

**파일명**: `transactions.csv`  
**최소 레코드**: 1,000건

| 컬럼명 | 타입 | 필수 | 설명 | 예시 |
|--------|------|------|------|------|
| transaction_id | string | ✅ | 거래 ID | TXN-0001 |
| visit_id | string | ❌ | 방문 ID | VISIT-0001 |
| customer_id | string | ❌ | 고객 ID | CUST-0001 |
| store_code | string | ✅ | 매장 코드 | NT-FLG-001 |
| transaction_datetime | datetime | ✅ | 거래 일시 | 2024-11-15 15:05:00 |
| total_amount | number | ✅ | 총액 (원) | 58000 |
| discount_amount | number | ❌ | 할인액 (원) | 5000 |
| final_amount | number | ✅ | 최종 결제액 (원) | 53000 |
| payment_method | string | ❌ | 결제 수단 | card |
| staff_id | string | ❌ | 응대 직원 | STAFF-001 |
| counter_id | string | ❌ | 계산대 | CHK-01 |

**결제 수단 분포**:
- card: 60%
- mobile: 30%
- cash: 10%

**샘플 데이터**:
```csv
transaction_id,visit_id,customer_id,store_code,transaction_datetime,total_amount,discount_amount,final_amount,payment_method,staff_id,counter_id
TXN-0001,VISIT-0001,CUST-0001,NT-FLG-001,2024-11-15 15:05:00,58000,5000,53000,card,STAFF-001,CHK-01
TXN-0002,VISIT-0003,CUST-0002,NT-FLG-001,2024-11-15 15:45:00,89000,0,89000,mobile,STAFF-002,CHK-02
```

---

### 4.14 Purchase (구매)

**파일명**: `purchases.csv`  
**최소 레코드**: 2,500건

| 컬럼명 | 타입 | 필수 | 설명 | 예시 |
|--------|------|------|------|------|
| purchase_id | string | ✅ | 구매 ID | PUR-0001 |
| transaction_id | string | ✅ | 거래 ID | TXN-0001 |
| sku | string | ✅ | SKU (products.csv 참조) | SKU-TS-001 |
| quantity | number | ✅ | 수량 | 2 |
| unit_price | number | ✅ | 단가 (원) | 29000 |
| line_total | number | ✅ | 라인 합계 (원) | 58000 |

**거래당 평균 구매 품목**: 2.5개 (2,500건 / 1,000건)

**샘플 데이터**:
```csv
purchase_id,transaction_id,sku,quantity,unit_price,line_total
PUR-0001,TXN-0001,SKU-TS-001,2,29000,58000
PUR-0002,TXN-0002,SKU-SH-001,1,89000,89000
PUR-0003,TXN-0002,SKU-JE-001,1,89000,89000
```

---

### 4.15 Staff (직원)

**파일명**: `staff.csv`  
**최소 레코드**: 15명

| 컬럼명 | 타입 | 필수 | 설명 | 예시 |
|--------|------|------|------|------|
| staff_id | string | ✅ | 직원 ID | STAFF-001 |
| staff_name | string | ✅ | 직원명 | 김직원 |
| role | string | ✅ | 역할 | sales |
| department | string | ❌ | 부서 | Sales |
| hire_date | date | ❌ | 입사일 | 2024-01-15 |
| performance_score | number | ❌ | 성과 점수 | 4.5 |

**역할 분포** (15명):
- manager: 2명
- sales: 8명
- cashier: 3명
- stock: 2명

**샘플 데이터**:
```csv
staff_id,staff_name,role,department,hire_date,performance_score
STAFF-001,김직원,sales,Sales,2024-01-15,4.5
STAFF-002,이직원,sales,Sales,2024-02-01,4.3
STAFF-003,박직원,cashier,Operations,2024-01-20,4.7
STAFF-004,최매니저,manager,Management,2024-01-10,4.8
```

---

### 4.16 Shift (근무 시간)

**파일명**: `shifts.csv`  
**최소 레코드**: 450건 (15명 × 30일)

| 컬럼명 | 타입 | 필수 | 설명 | 예시 |
|--------|------|------|------|------|
| shift_id | string | ✅ | 근무 ID | SHIFT-0001 |
| staff_id | string | ✅ | 직원 ID | STAFF-001 |
| shift_date | date | ✅ | 근무일 | 2024-11-15 |
| start_time | time | ✅ | 시작 시간 | 10:00:00 |
| end_time | time | ✅ | 종료 시간 | 18:00:00 |
| shift_type | string | ❌ | 근무 유형 | day |
| hours_worked | number | ❌ | 근무 시간 | 8 |

**근무 유형**:
- day: 오전 10시 ~ 오후 6시
- evening: 오후 2시 ~ 오후 10시
- weekend: 주말 근무

**샘플 데이터**:
```csv
shift_id,staff_id,shift_date,start_time,end_time,shift_type,hours_worked
SHIFT-0001,STAFF-001,2024-11-15,10:00:00,18:00:00,day,8
SHIFT-0002,STAFF-002,2024-11-15,14:00:00,22:00:00,evening,8
SHIFT-0003,STAFF-003,2024-11-15,10:00:00,18:00:00,day,8
```

---

### 4.17 WiFiSensor (WiFi 센서)

**파일명**: `wifi_sensors.csv`  
**최소 레코드**: 6개

| 컬럼명 | 타입 | 필수 | 설명 | 예시 |
|--------|------|------|------|------|
| sensor_id | string | ✅ | 센서 ID | WIFI-01 |
| sensor_name | string | ✅ | 센서명 | 입구 센서 |
| x | number | ✅ | X 좌표 (m) | 0.0 |
| y | number | ✅ | Y 좌표 (m) | 2.5 |
| z | number | ✅ | Z 좌표 (m) | 0.0 |
| detection_radius_m | number | ❌ | 감지 반경 (m) | 10 |
| zone_id | string | ❌ | 소속 구역 | ZONE-A |

**센서 배치 (200㎡ 매장 기준)**:
```
                20m (깊이)
         ┌────────────────────┐
         │  WiFi-04  WiFi-05  │
    10m  │                    │
  (너비) │  WiFi-02  WiFi-03  │
         │                    │
         │  WiFi-01  WiFi-06  │
         └────────────────────┘
```

**샘플 데이터**:
```csv
sensor_id,sensor_name,x,y,z,detection_radius_m,zone_id
WIFI-01,입구 좌측 센서,2.0,2.5,2.0,10,ZONE-A
WIFI-02,중앙 좌측 센서,6.0,2.5,6.0,10,ZONE-C
WIFI-03,중앙 우측 센서,14.0,2.5,6.0,10,ZONE-D
WIFI-04,후방 좌측 센서,6.0,2.5,14.0,10,ZONE-E
WIFI-05,후방 우측 센서,14.0,2.5,14.0,10,ZONE-G
WIFI-06,계산대 센서,18.0,2.5,2.0,10,ZONE-H
```

---

### 4.18-4.25 데이터 파이프라인 & 이벤트 & AI 모델 엔티티

#### 4.18 DataSource (데이터 소스)
**파일명**: `data_sources.csv`  
**최소 레코드**: 3개

```csv
source_id,source_name,source_type,connection_string,is_active
DS-001,POS 시스템,api,https://api.pos.example.com,true
DS-002,ERP 시스템,database,postgresql://erp.db,true
DS-003,CRM 시스템,api,https://api.crm.example.com,true
```

#### 4.19 DataSourceTable (데이터 소스 테이블)
**파일명**: `data_source_tables.csv`  
**최소 레코드**: 10개

```csv
table_id,source_id,table_name,entity_type,sync_frequency
DST-001,DS-001,sales_transactions,Transaction,hourly
DST-002,DS-001,product_inventory,Inventory,daily
DST-003,DS-002,customer_master,Customer,daily
```

#### 4.20 ColumnMapping (컬럼 매핑)
**파일명**: `column_mappings.csv`  
**최소 레코드**: 50개

```csv
mapping_id,table_id,source_column,target_column,transformation_rule
MAP-001,DST-001,txn_id,transaction_id,direct
MAP-002,DST-001,txn_date,transaction_datetime,datetime_parse
MAP-003,DST-001,amount,final_amount,numeric
```

#### 4.21 BaseEvent (기본 이벤트)
**파일명**: `base_events.csv`  
**최소 레코드**: 통합 (CustomerEvent + SensorEvent)

#### 4.22 CustomerEvent (고객 이벤트)
**파일명**: `customer_events.csv`  
**최소 레코드**: 5,000건

```csv
event_id,customer_id,event_type,event_datetime,zone_id,product_id,metadata
CE-0001,CUST-0001,zone_enter,2024-11-15 14:30:05,ZONE-A,,"{""entrance"":""ENT-MAIN-01""}"
CE-0002,CUST-0001,product_view,2024-11-15 14:35:20,ZONE-C,SKU-JE-001,"{""duration_seconds"":45}"
CE-0003,CUST-0001,zone_exit,2024-11-15 14:40:00,ZONE-C,,"{}"
```

#### 4.23 SensorEvent (센서 이벤트)
**파일명**: `sensor_events.csv`  
**최소 레코드**: 10,000건

```csv
event_id,sensor_id,event_datetime,mac_address,rssi,x,z,session_id
SE-0001,WIFI-01,2024-11-15 14:30:00,AA:BB:CC:DD:EE:01,-45,2.0,2.0,SESS-0001
SE-0002,WIFI-01,2024-11-15 14:30:05,AA:BB:CC:DD:EE:01,-48,2.5,2.5,SESS-0001
SE-0003,WIFI-02,2024-11-15 14:32:00,AA:BB:CC:DD:EE:01,-55,5.0,5.0,SESS-0001
```

#### 4.24 Model (AI 모델)
**파일명**: `models.csv`  
**최소 레코드**: 5개

```csv
model_id,model_name,model_type,version,accuracy,created_date
MODEL-001,수요 예측 모델,demand_forecast,v1.2,0.85,2024-10-01
MODEL-002,재고 최적화 모델,inventory_optimization,v1.0,0.78,2024-09-15
MODEL-003,가격 최적화 모델,price_optimization,v2.1,0.82,2024-10-20
MODEL-004,추천 엔진,recommendation,v1.5,0.88,2024-11-01
MODEL-005,이상 탐지 모델,anomaly_detection,v1.0,0.90,2024-11-10
```

#### 4.25 ModelRun (모델 실행)
**파일명**: `model_runs.csv`  
**최소 레코드**: 50건

```csv
run_id,model_id,run_datetime,input_data,output_result,execution_time_ms,success
RUN-001,MODEL-001,2024-11-30 09:00:00,"{""sku"":""SKU-TS-001""}","{""forecast_demand"":120}",1500,true
RUN-002,MODEL-002,2024-11-30 09:05:00,"{""sku"":""SKU-TS-001""}","{""optimal_stock"":50}",2000,true
```

---

## 5. HIGH 엔티티 데이터셋 (19개)

### 5.1 Weather (날씨)

**파일명**: `weather.csv`  
**최소 레코드**: 90일

| 컬럼명 | 타입 | 필수 | 설명 | 예시 |
|--------|------|------|------|------|
| weather_id | string | ✅ | 날씨 ID | WTH-20241115 |
| date | date | ✅ | 날짜 | 2024-11-15 |
| condition | string | ✅ | 날씨 상태 | sunny |
| temperature_c | number | ❌ | 기온 (°C) | 12.5 |
| humidity_percent | number | ❌ | 습도 (%) | 45 |
| precipitation_mm | number | ❌ | 강수량 (mm) | 0 |

**날씨 상태 분포** (90일):
- sunny: 40일 (44%)
- cloudy: 30일 (33%)
- rainy: 15일 (17%)
- snowy: 5일 (6%)

**샘플 데이터**:
```csv
weather_id,date,condition,temperature_c,humidity_percent,precipitation_mm
WTH-20241115,2024-11-15,sunny,12.5,45,0
WTH-20241116,2024-11-16,cloudy,10.2,55,0
WTH-20241117,2024-11-17,rainy,8.7,75,12.5
```

---

### 5.2 Holiday (휴일)

**파일명**: `holidays.csv`  
**최소 레코드**: 30건

| 컬럼명 | 타입 | 필수 | 설명 | 예시 |
|--------|------|------|------|------|
| holiday_id | string | ✅ | 휴일 ID | HOL-001 |
| date | date | ✅ | 날짜 | 2024-01-01 |
| holiday_name | string | ✅ | 휴일명 | 신정 |
| holiday_type | string | ❌ | 휴일 유형 | public |
| impact_level | string | ❌ | 영향 수준 | high |

**샘플 데이터**:
```csv
holiday_id,date,holiday_name,holiday_type,impact_level
HOL-001,2024-01-01,신정,public,high
HOL-002,2024-02-10,설날,public,high
HOL-003,2024-03-01,삼일절,public,medium
HOL-004,2024-05-05,어린이날,public,high
HOL-005,2024-12-25,크리스마스,public,high
```

---

### 5.3 EconomicIndicator (경제 지표)

**파일명**: `economic_indicators.csv`  
**최소 레코드**: 270건 (3개 지표 × 90일)

| 컬럼명 | 타입 | 필수 | 설명 | 예시 |
|--------|------|------|------|------|
| indicator_id | string | ✅ | 지표 ID | ECON-CPI-20241115 |
| date | date | ✅ | 날짜 | 2024-11-15 |
| indicator_type | string | ✅ | 지표 유형 | cpi |
| value | number | ✅ | 값 | 110.5 |
| unit | string | ❌ | 단위 | index |

**지표 유형**:
- cpi: 소비자 물가 지수
- unemployment_rate: 실업률
- consumer_confidence: 소비자 신뢰 지수

**샘플 데이터**:
```csv
indicator_id,date,indicator_type,value,unit
ECON-CPI-20241115,2024-11-15,cpi,110.5,index
ECON-UNEMP-20241115,2024-11-15,unemployment_rate,3.2,percent
ECON-CONF-20241115,2024-11-15,consumer_confidence,102.3,index
```

---

### 5.4-5.9 공간 가구 엔티티

#### 5.4 Aisle (통로)
**파일명**: `aisles.csv` | **최소 레코드**: 6개

```csv
aisle_id,aisle_name,width_m,length_m,zone_id
AISLE-01,메인 통로,2.0,18.0,ZONE-B
AISLE-02,중앙 통로,1.5,18.0,ZONE-C
```

#### 5.5 FittingRoom (피팅룸)
**파일명**: `fitting_rooms.csv` | **최소 레코드**: 2개

```csv
fitting_room_id,room_number,size_sqm,is_accessible,zone_id
FITTING-01,1,4.0,true,ZONE-F
FITTING-02,2,4.0,false,ZONE-F
```

#### 5.6 StorageRoom (창고)
**파일명**: `storage_rooms.csv` | **최소 레코드**: 1개

```csv
storage_room_id,room_name,capacity_sqm,current_utilization,zone_id
STORAGE-01,메인 창고,20.0,0.75,ZONE-H
```

#### 5.7 Shelf (선반)
**파일명**: `shelves.csv` | **최소 레코드**: 12개

```csv
shelf_id,shelf_type,width_m,height_m,depth_m,capacity,zone_id
SHELF-01,wall,3.0,2.0,0.5,50,ZONE-B
SHELF-02,side,2.0,1.8,0.4,30,ZONE-C
```

#### 5.8 Rack (랙)
**파일명**: `racks.csv` | **최소 레코드**: 8개

```csv
rack_id,rack_type,width_m,height_m,capacity,zone_id
RACK-01,clothing,1.5,1.8,40,ZONE-D
RACK-02,clothing,1.5,1.8,40,ZONE-E
```

#### 5.9 DisplayTable (디스플레이 테이블)
**파일명**: `display_tables.csv` | **최소 레코드**: 6개

```csv
table_id,width_m,height_m,surface_type,zone_id
TABLE-01,2.0,1.0,glass,ZONE-B
TABLE-02,1.5,0.8,wood,ZONE-G
```

---

### 5.10 Supplier (공급업체)

**파일명**: `suppliers.csv`  
**최소 레코드**: 10개

```csv
supplier_id,supplier_name,country,lead_time_days,reliability_score
SUP-001,Basic Apparel Co.,KR,7,4.5
SUP-002,Premium Textiles,IT,14,4.8
SUP-003,Leather Goods Inc.,IT,21,4.7
SUP-004,Urban Fashion Korea,KR,5,4.3
SUP-005,Footwear Dynamics,US,10,4.6
```

---

### 5.11 Camera (카메라)

**파일명**: `cameras.csv`  
**최소 레코드**: 8개

```csv
camera_id,camera_type,resolution,x,y,z,zone_id
CAM-01,ceiling,1080p,2.0,3.0,2.0,ZONE-A
CAM-02,ceiling,1080p,10.0,3.0,5.0,ZONE-C
CAM-03,ceiling,4k,18.0,3.0,2.0,ZONE-H
```

---

### 5.12 Beacon (비콘)

**파일명**: `beacons.csv`  
**최소 레코드**: 4개

```csv
beacon_id,beacon_uuid,tx_power,zone_id
BEACON-01,UUID-001,-59,ZONE-B
BEACON-02,UUID-002,-59,ZONE-D
BEACON-03,UUID-003,-59,ZONE-F
BEACON-04,UUID-004,-59,ZONE-H
```

---

### 5.13-5.19 시뮬레이션 & KPI & 비즈니스 규칙

#### 5.13 Scenario (시나리오)
**파일명**: `scenarios.csv` | **최소 레코드**: 10개

```csv
scenario_id,scenario_name,scenario_type,description,created_date
SCN-001,레이아웃 최적화 A안,layout,Zone-D 면적 확대,2024-11-01
SCN-002,겨울 수요 예측,demand,겨울 시즌 수요 예측,2024-11-05
SCN-003,재고 최적화,inventory,최소 재고 유지,2024-11-10
```

#### 5.14 SimulationResult (시뮬레이션 결과)
**파일명**: `simulation_results.csv` | **최소 레코드**: 50건

```csv
result_id,scenario_id,run_datetime,predicted_revenue,predicted_traffic,success_rate
RESULT-001,SCN-001,2024-11-30 10:00:00,15000000,2500,0.85
RESULT-002,SCN-002,2024-11-30 10:30:00,18000000,3000,0.88
```

#### 5.15 KPI (KPI 정의)
**파일명**: `kpis.csv` | **최소 레코드**: 15개

```csv
kpi_id,kpi_name,kpi_category,unit,target_value
KPI-001,일 매출,sales,KRW,5000000
KPI-002,방문객 수,traffic,count,300
KPI-003,전환율,conversion,percent,40
KPI-004,평균 구매액,sales,KRW,100000
KPI-005,재고 회전율,inventory,ratio,6
```

#### 5.16 KPIValue (KPI 값)
**파일명**: `kpi_values.csv` | **최소 레코드**: 1,350건 (15개 KPI × 90일)

```csv
value_id,kpi_id,date,actual_value,target_value,variance
KPIV-001,KPI-001,2024-11-15,5200000,5000000,0.04
KPIV-002,KPI-002,2024-11-15,320,300,0.067
KPIV-003,KPI-003,2024-11-15,42,40,0.05
```

#### 5.17 RetailConcept (리테일 개념)
**파일명**: `retail_concepts.csv` | **최소 레코드**: 20개

```csv
concept_id,concept_name,concept_category,description
RC-001,골든 트라이앵글,layout,입구-중앙-계산대 동선
RC-002,앵커 제품 배치,merchandising,고마진 제품을 주요 동선에 배치
RC-003,크로스셀링,sales,관련 제품 인접 배치
```

#### 5.18 BusinessRule (비즈니스 규칙)
**파일명**: `business_rules.csv` | **최소 레코드**: 30개

```csv
rule_id,rule_name,rule_type,condition,action,priority
BR-001,재고 부족 알림,inventory,"current_stock < minimum_stock",generate_alert,high
BR-002,VIP 고객 할인,loyalty,"customer_segment = 'VIP'",apply_discount_25,high
BR-003,주말 프로모션,promotion,"day_of_week IN ('Sat','Sun')",apply_discount_15,medium
```

#### 5.19 DemandForecast (수요 예측)
**파일명**: `demand_forecasts.csv` | **최소 레코드**: 200건

```csv
forecast_id,sku,forecast_date,predicted_demand,confidence_level,model_id
FORECAST-001,SKU-TS-001,2024-12-01,120,0.85,MODEL-001
FORECAST-002,SKU-TS-002,2024-12-01,95,0.82,MODEL-001
```

---

## 6. MEDIUM 엔티티 데이터셋 (13개)

### 6.1 DailySales (일별 매출)

**파일명**: `daily_sales.csv`  
**최소 레코드**: 90일

```csv
sales_id,date,store_code,total_revenue,total_transactions,avg_transaction_value,total_customers
SALES-20241115,2024-11-15,NT-FLG-001,5200000,52,100000,320
SALES-20241116,2024-11-16,NT-FLG-001,4800000,48,100000,290
```

---

### 6.2 InventoryHistory (재고 이력)

**파일명**: `inventory_history.csv`  
**최소 레코드**: 6,000건 (200개 제품 × 30일)

```csv
history_id,sku,date,opening_stock,received,sold,closing_stock
INVH-0001,SKU-TS-001,2024-11-01,50,0,5,45
INVH-0002,SKU-TS-001,2024-11-02,45,0,3,42
```

---

### 6.3 ZonePerformance (구역 성과)

**파일명**: `zone_performance.csv`  
**최소 레코드**: 720건 (8개 Zone × 90일)

```csv
performance_id,zone_id,date,visitor_count,dwell_time_avg_min,conversion_rate,revenue
ZONEP-001,ZONE-A,2024-11-15,320,5.2,1.0,0
ZONEP-002,ZONE-B,2024-11-15,180,12.5,0.35,850000
```

---

### 6.4 Task (작업)

**파일명**: `tasks.csv`  
**최소 레코드**: 100건

```csv
task_id,task_name,assigned_to,due_date,status,priority
TASK-001,재고 정리,STAFF-005,2024-11-20,completed,medium
TASK-002,진열 변경,STAFF-002,2024-11-25,in_progress,high
```

---

### 6.5-6.9 IoT 센서들

#### 6.5 PeopleCounter (인원 카운터)
**파일명**: `people_counters.csv` | **최소 레코드**: 2개

```csv
counter_id,location,zone_id
PC-01,메인 출입구,ZONE-A
PC-02,계산대 앞,ZONE-H
```

#### 6.6-6.8 DoorSensor, TemperatureSensor, HumiditySensor
각 센서별 CSV 파일 및 샘플 데이터 생략 (선택적)

---

### 6.10 Alert (알림)

**파일명**: `alerts.csv`  
**최소 레코드**: 50건

```csv
alert_id,alert_type,severity,message,created_datetime,resolved
ALERT-001,low_stock,high,SKU-JE-001 재고 부족,2024-11-15 09:00:00,true
ALERT-002,high_traffic,medium,ZONE-D 혼잡도 높음,2024-11-15 15:30:00,false
```

---

### 6.11 PriceOptimization (가격 최적화)

**파일명**: `price_optimizations.csv`  
**최소 레코드**: 200건

```csv
optimization_id,sku,current_price,recommended_price,expected_revenue_lift,model_id
PRICEOPT-001,SKU-TS-001,29000,27000,0.08,MODEL-003
PRICEOPT-002,SKU-SH-001,79000,75000,0.12,MODEL-003
```

---

### 6.12-6.13 POS, DigitalSignage, HVAC
선택적 엔티티 - 필요 시 추가

---

## 7. 3D 모델 및 메타데이터

### 7.1 파일명 규칙

**형식**: `{EntityType}_{Identifier}_{Width}x{Height}x{Depth}.glb`

- `EntityType`: ontology_entity_types.name과 일치
- `Identifier`: 식별자 (한글/영문)
- `Dimensions`: 미터 단위

### 7.2 필수 3D 모델 리스트

#### 7.2.1 매장 구조 (1개)
```
Store_NT매장_20.0x4.0x10.0.glb
```

#### 7.2.2 Zone (8개)
```
Zone_존A_4.0x4.0x4.0.glb
Zone_존B_5.0x5.0x4.0.glb
Zone_존C_5.0x5.0x4.0.glb
Zone_존D_5.0x5.0x4.0.glb
Zone_존E_5.0x5.0x4.0.glb
Zone_존F_5.0x5.0x4.0.glb
Zone_존G_5.0x5.0x4.0.glb
Zone_존H_4.0x4.0x4.0.glb
```

#### 7.2.3 가구 (12개)
```
Shelf_벽면진열대_3.0x2.0x0.5.glb
Shelf_측면진열대_2.0x1.8x0.4.glb
Rack_의류랙_1.5x1.8x0.5.glb
DisplayTable_중앙테이블_2.0x1.0x0.8.glb
CheckoutCounter_계산대_2.5x1.1x1.0.glb
FittingRoom_피팅룸_2.0x2.5x2.0.glb
```

#### 7.2.4 제품 (6개 - 카테고리별 대표)
```
Product_가방_0.4x0.3x0.2.glb
Product_하의_0.3x0.4x0.1.glb
Product_상의_0.3x0.4x0.05.glb
Product_신발_0.3x0.15x0.3.glb
Product_액세서리_0.2x0.2x0.1.glb
Product_아우터_0.4x0.5x0.1.glb
```

#### 7.2.5 IoT 장비 (6개)
```
Camera_천장카메라_0.2x0.3x0.2.glb
WiFiSensor_입구센서_0.15x0.1x0.15.glb
Beacon_비콘_0.1x0.1x0.05.glb
PeopleCounter_인원카운터_0.3x0.3x0.2.glb
```

**총 33개 3D 모델 필요**

### 7.3 JSON 메타데이터 예시

**파일명**: `Shelf_벽면진열대_metadata.json`

```json
{
  "entity_type": "Shelf",
  "identifier": "SHELF-01",
  "dimensions": {
    "width_m": 3.0,
    "height_m": 2.0,
    "depth_m": 0.5
  },
  "properties": {
    "material": "metal",
    "color": "white",
    "max_weight_kg": 200,
    "shelf_count": 5,
    "adjustable": true
  },
  "default_transform": {
    "position": { "x": 0, "y": 0, "z": 0 },
    "rotation": { "x": 0, "y": 0, "z": 0 },
    "scale": { "x": 1, "y": 1, "z": 1 }
  }
}
```

---

## 8. 온톨로지 관계 데이터

### 8.1 CRITICAL 관계 (32개)

관계는 CSV 업로드 후 자동 생성되거나 수동으로 `graph_relations` 테이블에 삽입됩니다.

**샘플 관계 데이터**:
```csv
relation_id,source_entity_id,relation_type_id,target_entity_id,properties,weight
REL-001,STORE-001,BELONGS_TO,ORG-001,{},1.0
REL-002,ZONE-A,BELONGS_TO,STORE-001,{},1.0
REL-003,CUST-001,VISITED_STORE,STORE-001,"{""visit_count"":25}",1.0
REL-004,SKU-TS-001,BELONGS_TO_CATEGORY,CAT-007,{},1.0
REL-005,TXN-001,OCCURRED_AT_STORE,STORE-001,{},1.0
```

### 8.2 자동 생성 관계 (데이터베이스 트리거)

데이터베이스 트리거가 다음 관계를 자동 생성:
- Customer → graph_entities (자동)
- Visit → VISITED_STORE 관계 생성
- Transaction → OCCURRED_AT_STORE 관계 생성
- Purchase → PURCHASED_PRODUCT 관계 생성

### 8.3 AI 추론 관계 (infer-entity-relations Edge Function)

AI가 자동으로 발견하는 관계:
- Customer ↔ Product (구매 패턴 기반)
- Product ↔ Product (Cross-sell 패턴)
- Customer ↔ Zone (방문 패턴)

---

## 9. GPT 데이터 생성 가이드

### 9.1 전체 데이터셋 생성 프롬프트

```
당신은 오프라인 리테일 매장의 디지털 트윈 시스템인 NEURALTWIN을 위한 데모 데이터를 생성하는 전문가입니다.

# 매장 설정
- 매장명: NEURALTWIN Flagship Store
- 매장 코드: NT-FLG-001
- 면적: 200㎡
- 카테고리: 패션 리테일 (의류 60%, 신발 25%, 액세서리 15%)
- 데이터 기간: 2024-09-01 ~ 2024-11-30 (3개월)

# 생성할 데이터셋 목록 (우선순위별)
## CRITICAL (25개 엔티티)
1. organizations.csv - 1건
2. stores.csv - 1건
3. zones.csv - 8건
4. entrances.csv - 2건
5. checkout_counters.csv - 3건
6. categories.csv - 20건 (3레벨 계층)
7. products.csv - 200건
8. inventory.csv - 200건
9. brands.csv - 15건
10. promotions.csv - 10건
11. customers.csv - 500건
12. visits.csv - 2,000건
13. transactions.csv - 1,000건
14. purchases.csv - 2,500건
15. staff.csv - 15건
16. shifts.csv - 450건
17. wifi_sensors.csv - 6건
18. data_sources.csv - 3건
19. data_source_tables.csv - 10건
20. column_mappings.csv - 50건
21. customer_events.csv - 5,000건
22. sensor_events.csv - 10,000건
23. models.csv - 5건
24. model_runs.csv - 50건

## HIGH (19개 엔티티)
25. weather.csv - 90건
26. holidays.csv - 30건
27. economic_indicators.csv - 270건
28. aisles.csv - 6건
29. fitting_rooms.csv - 2건
30. storage_rooms.csv - 1건
31. shelves.csv - 12건
32. racks.csv - 8건
33. display_tables.csv - 6건
34. suppliers.csv - 10건
35. cameras.csv - 8건
36. beacons.csv - 4건
37. scenarios.csv - 10건
38. simulation_results.csv - 50건
39. kpis.csv - 15건
40. kpi_values.csv - 1,350건
41. retail_concepts.csv - 20건
42. business_rules.csv - 30건
43. demand_forecasts.csv - 200건

## MEDIUM (13개 엔티티)
44. daily_sales.csv - 90건
45. inventory_history.csv - 6,000건
46. zone_performance.csv - 720건
47. tasks.csv - 100건
48. people_counters.csv - 2건
49. alerts.csv - 50건
50. price_optimizations.csv - 200건

# 데이터 품질 요구사항
- 현실적인 분포와 패턴 (요일별, 시간대별, 계절별)
- 고객 세그먼트별 행동 차이 반영
  - VIP: 50명 (10%) - 월 3-5회, 고가 상품
  - Regular: 300명 (60%) - 월 1-2회, 중가 상품
  - New: 150명 (30%) - 첫 구매, 저가 상품
- 상품 카테고리별 가격대 및 재고 수준 다르게 설정
- 센서 데이터는 실제 매장 동선 패턴 반영
- 구매 전환율 40% 유지 (800건/2,000건)
- 외래키 참조 무결성 100% 유지

# 컬럼별 상세 스펙
{각 데이터셋의 컬럼 정의와 예시 데이터 참조}

# 출력 형식
- 각 CSV 파일을 개별적으로 생성
- 첫 줄은 헤더(컬럼명)
- UTF-8 인코딩
- 날짜 형식: YYYY-MM-DD
- 시간 형식: HH:MM:SS
- 날짜시간 형식: YYYY-MM-DD HH:MM:SS
- 숫자: 천 단위 구분 없음

각 데이터셋을 순서대로 생성해주세요.
```

### 9.2 개별 데이터셋 프롬프트 예시

#### customers.csv 생성

```
500명의 현실적인 고객 데이터를 생성해주세요.

# 세그먼트 분포
- VIP: 50명 (10%)
  - total_purchase_count: 20-50회
  - avg_purchase_amount: 100,000-200,000원
  - lifetime_value: 2,000,000-10,000,000원
  
- Regular: 300명 (60%)
  - total_purchase_count: 5-19회
  - avg_purchase_amount: 50,000-100,000원
  - lifetime_value: 250,000-1,900,000원
  
- New: 150명 (30%)
  - total_purchase_count: 1-4회
  - avg_purchase_amount: 30,000-80,000원
  - lifetime_value: 30,000-320,000원

# 인구통계 분포
- 연령대: 10s(5%), 20s(30%), 30s(35%), 40s(20%), 50s(7%), 60s+(3%)
- 성별: F(60%), M(38%), Other(2%)
- 가입일: 2024-01-15 ~ 2024-11-15 균등 분포

# 출력 형식
customer_id,age_group,gender,customer_segment,signup_date,total_purchase_count,lifetime_value,avg_purchase_amount,last_visit_date

customer_id는 CUST-0001부터 시작하여 순차 증가
```

#### sensor_events.csv 생성

```
10,000건의 WiFi 센서 이벤트 데이터를 생성해주세요.

# 센서 배치 (wifi_sensors.csv 기준)
- WIFI-01: (2.0, 2.5, 2.0) - 입구 좌측
- WIFI-02: (6.0, 2.5, 6.0) - 중앙 좌측
- WIFI-03: (14.0, 2.5, 6.0) - 중앙 우측
- WIFI-04: (6.0, 2.5, 14.0) - 후방 좌측
- WIFI-05: (14.0, 2.5, 14.0) - 후방 우측
- WIFI-06: (18.0, 2.5, 2.0) - 계산대
- 감지 반경: 각 10m

# 세션 패턴
- 총 100개 세션 (visits.csv의 session_id와 매칭: SESS-0001 ~ SESS-0100)
- 세션당 평균 100개 신호 (1-5초 간격)
- 세션 지속: 평균 20-40분

# 동선 패턴
1. 입구(WIFI-01) → 진열 구역(WIFI-02/03) → 계산대(WIFI-06)
2. 입구 → 피팅룸(WIFI-04) → 진열 구역 → 계산대
3. 입구 → 둘러보기(WIFI-02/03/05) → 출구 (구매 없음)

# RSSI 값
- 센서 근처(0-5m): -40 ~ -55 dBm
- 중거리(5-10m): -55 ~ -70 dBm
- 원거리(10-15m): -70 ~ -80 dBm

# 출력 형식
event_id,sensor_id,event_datetime,mac_address,rssi,x,z,session_id

MAC 주소는 AA:BB:CC:DD:EE:XX 형식 (세션별 고유)
event_datetime는 2024-11-15 10:00:00부터 시작
```

### 9.3 Python 생성 스크립트 예시

```python
import pandas as pd
import numpy as np
from datetime import datetime, timedelta

# 고객 데이터 생성
def generate_customers(count=500):
    # 세그먼트 분포
    segments = ['VIP'] * 50 + ['Regular'] * 300 + ['New'] * 150
    np.random.shuffle(segments)
    
    # 연령대 분포
    age_groups = np.random.choice(
        ['10s','20s','30s','40s','50s','60s+'], 
        count, 
        p=[0.05, 0.30, 0.35, 0.20, 0.07, 0.03]
    )
    
    # 성별 분포
    genders = np.random.choice(
        ['F','M','Other'], 
        count, 
        p=[0.60, 0.38, 0.02]
    )
    
    # 세그먼트별 구매 패턴
    purchase_counts = []
    avg_amounts = []
    lifetime_values = []
    
    for seg in segments:
        if seg == 'VIP':
            pc = np.random.randint(20, 51)
            aa = np.random.randint(100000, 200001)
        elif seg == 'Regular':
            pc = np.random.randint(5, 20)
            aa = np.random.randint(50000, 100001)
        else:  # New
            pc = np.random.randint(1, 5)
            aa = np.random.randint(30000, 80001)
        
        purchase_counts.append(pc)
        avg_amounts.append(aa)
        lifetime_values.append(pc * aa)
    
    # 가입일 (2024-01-15 ~ 2024-11-15)
    start_date = datetime(2024, 1, 15)
    signup_dates = [
        start_date + timedelta(days=np.random.randint(0, 305)) 
        for _ in range(count)
    ]
    
    # 마지막 방문일 (가입일 이후 ~ 2024-11-30)
    last_visit_dates = [
        signup_date + timedelta(days=np.random.randint(0, (datetime(2024, 11, 30) - signup_date).days + 1))
        for signup_date in signup_dates
    ]
    
    customers = pd.DataFrame({
        'customer_id': [f'CUST-{i:04d}' for i in range(1, count+1)],
        'age_group': age_groups,
        'gender': genders,
        'customer_segment': segments,
        'signup_date': [d.strftime('%Y-%m-%d') for d in signup_dates],
        'total_purchase_count': purchase_counts,
        'lifetime_value': lifetime_values,
        'avg_purchase_amount': avg_amounts,
        'last_visit_date': [d.strftime('%Y-%m-%d') for d in last_visit_dates]
    })
    
    return customers

# 실행
customers = generate_customers(500)
customers.to_csv('customers.csv', index=False, encoding='utf-8')
print(f"Generated {len(customers)} customer records")
```

---

## 10. 데이터 검증 및 품질 관리

### 10.1 데이터 검증 체크리스트

#### 필수 검증 항목
- [ ] 모든 CSV 파일이 UTF-8 인코딩
- [ ] 헤더가 첫 줄에 존재
- [ ] 필수 컬럼에 NULL 값 없음
- [ ] 날짜 형식 일치 (YYYY-MM-DD)
- [ ] 시간 형식 일치 (HH:MM:SS)
- [ ] 외래 키 참조 무결성 확인
- [ ] 카테고리 계층 구조 검증 (3레벨)
- [ ] 재고 수량이 음수 아님
- [ ] 가격이 양수
- [ ] 전환율 40% 달성 (800건/2,000건)
- [ ] 세그먼트 분포: VIP(10%), Regular(60%), New(30%)

### 10.2 SQL 검증 쿼리

#### 고아 레코드 확인
```sql
-- Visit without Customer (허용)
SELECT COUNT(*) as anonymous_visits 
FROM visits v
LEFT JOIN customers c ON v.customer_id = c.customer_id
WHERE c.customer_id IS NULL;
-- 예상: ~800건 (40% 익명 방문)

-- Purchase without Product (오류)
SELECT COUNT(*) 
FROM purchases p
LEFT JOIN products pr ON p.sku = pr.sku
WHERE pr.sku IS NULL;
-- 예상: 0건

-- Transaction without Visit (오류)
SELECT COUNT(*) 
FROM transactions t
LEFT JOIN visits v ON t.visit_id = v.visit_id
WHERE v.visit_id IS NULL;
-- 예상: 0건
```

#### 전환율 검증
```sql
SELECT 
  COUNT(DISTINCT CASE WHEN did_purchase THEN visit_id END) * 100.0 / COUNT(*) as conversion_rate
FROM visits;
-- 예상: ~40%
```

#### 재고 부족 제품
```sql
SELECT p.product_name, i.current_stock, i.minimum_stock
FROM inventory i
JOIN products p ON i.sku = p.sku
WHERE i.current_stock < i.minimum_stock;
-- 예상: ~20개 제품 (10%)
```

#### 고객 세그먼트 분포
```sql
SELECT 
  customer_segment,
  COUNT(*) as count,
  ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM customers), 1) as percentage
FROM customers
GROUP BY customer_segment;
-- 예상: VIP(50, 10%), Regular(300, 60%), New(150, 30%)
```

#### 카테고리 계층 검증
```sql
-- 3레벨 계층 구조 확인
SELECT category_level, COUNT(*) 
FROM categories 
GROUP BY category_level 
ORDER BY category_level;
-- 예상: Level 1(3개), Level 2(10개), Level 3(7개)
```

### 10.3 일관성 검증 프롬프트

```
생성된 데이터셋의 일관성을 검증해주세요.

# 검증 항목
1. 외래키 참조 무결성
   - purchases.sku는 products.sku에 존재
   - purchases.transaction_id는 transactions.transaction_id에 존재
   - transactions.customer_id는 customers.customer_id에 존재 (NULL 가능)
   - visits.customer_id는 customers.customer_id에 존재 (NULL 가능)
   - visits.store_code는 stores.store_code에 존재

2. 날짜 일관성
   - transaction_datetime는 customer의 signup_date 이후
   - last_visit_date는 signup_date 이후
   - visit_datetime는 매장 opening_date 이후

3. 수량 일관성
   - customer.total_purchase_count = COUNT(purchases WHERE customer_id)
   - customer.lifetime_value = SUM(transactions.final_amount WHERE customer_id)
   - transaction.total_amount = SUM(purchases.line_total WHERE transaction_id)

4. 논리적 일관성
   - visits에서 did_purchase=true인 경우 transactions 존재
   - sensor_events의 session_id는 visits의 session_id와 매칭
   - zones_visited의 zone_id는 zones.zone_id에 존재

5. 비즈니스 규칙
   - 전환율 40% (did_purchase=true 비율)
   - 세그먼트 분포: VIP(10%), Regular(60%), New(30%)
   - 재고 부족 제품 10% (current_stock < minimum_stock)

오류가 있으면 수정된 데이터를 제공해주세요.
```

### 10.4 데이터 생성 순서

**Phase 1: 기본 데이터** (1-2일차)
1. organizations.csv
2. stores.csv
3. zones.csv, entrances.csv, checkout_counters.csv
4. categories.csv (3레벨 계층)
5. brands.csv, suppliers.csv
6. products.csv
7. inventory.csv

**Phase 2: 고객/거래 데이터** (3-4일차)
8. customers.csv
9. visits.csv
10. transactions.csv
11. purchases.csv

**Phase 3: 운영 데이터** (5-6일차)
12. staff.csv, shifts.csv
13. promotions.csv
14. wifi_sensors.csv, cameras.csv, beacons.csv
15. customer_events.csv, sensor_events.csv

**Phase 4: 환경/분석 데이터** (7-8일차)
16. weather.csv, holidays.csv, economic_indicators.csv
17. daily_sales.csv, zone_performance.csv, inventory_history.csv
18. tasks.csv, alerts.csv

**Phase 5: AI/시뮬레이션 데이터** (9-10일차)
19. models.csv, model_runs.csv
20. scenarios.csv, simulation_results.csv
21. demand_forecasts.csv, price_optimizations.csv
22. kpis.csv, kpi_values.csv
23. retail_concepts.csv, business_rules.csv

**Phase 6: 데이터 파이프라인** (11일차)
24. data_sources.csv, data_source_tables.csv, column_mappings.csv

---

## 부록 A: 전체 엔티티 요약

| Priority | Count | Entities |
|----------|-------|----------|
| 🔴 CRITICAL | 25 | Organization, Store, Zone, Entrance, CheckoutCounter, Category, Product, Inventory, Brand, Promotion, Customer, Visit, Transaction, Purchase, Staff, Shift, WiFiSensor, DataSource, DataSourceTable, ColumnMapping, BaseEvent, CustomerEvent, SensorEvent, Model, ModelRun |
| 🟡 HIGH | 19 | Weather, Holiday, EconomicIndicator, Aisle, FittingRoom, StorageRoom, Shelf, Rack, DisplayTable, Supplier, Camera, Beacon, Scenario, SimulationResult, KPI, KPIValue, RetailConcept, BusinessRule, DemandForecast |
| 🟢 MEDIUM | 13 | DailySales, InventoryHistory, ZonePerformance, Task, PeopleCounter, DoorSensor, TemperatureSensor, HumiditySensor, Alert, PriceOptimization, POS, DigitalSignage, HVAC |
| ⚪ LOW | 5 | (현재 MEDIUM과 통합) |
| **TOTAL** | **62** | |

---

## 부록 B: 최소 데이터셋 요약

| Category | Records | % of Total |
|----------|---------|------------|
| 조직/매장 기본 | 15 | <1% |
| 제품 관련 | 445 | 1.5% |
| 고객/거래 | 4,000 | 13.8% |
| 직원/운영 | 565 | 1.9% |
| IoT/센서 | 15,018 | 51.8% |
| 환경/외부 | 390 | 1.3% |
| 분석/성과 | 6,810 | 23.5% |
| AI/시뮬레이션 | 515 | 1.8% |
| 데이터 파이프라인 | 63 | 0.2% |
| 비즈니스 규칙 | 1,465 | 5.1% |
| **TOTAL** | **~29,000 records** | **100%** |

---

## 부록 C: 참고 자료

### 관련 문서
- `DEMO_DATASET_REQUIREMENTS.md`: v3.0 기본 데이터셋 요구사항
- `GPT_DATASET_GENERATION_GUIDE.md`: GPT 프롬프트 템플릿
- `comprehensiveRetailSchema.ts`: v3.0 온톨로지 스키마
- `CURRENT_ONTOLOGY_SCHEMA.md`: 온톨로지 스키마 문서
- `DEMO_TEST_SCENARIOS.md`: 테스트 시나리오

### 업로드 경로
- CSV/Excel: `store-data` 버킷 → `{userId}/{storeId}/`
- 3D 모델: `3d-models` 버킷 → `{userId}/{storeId}/`
- JSON 메타데이터: `store-data` 버킷 → `{userId}/{storeId}/metadata/`

---

**문서 버전**: 1.0.0  
**최종 업데이트**: 2025-12-02  
**작성자**: NEURALTWIN Team  
**통합 기준**: v3.0 Ontology Schema (62 Entities, 99 Relations)

---

**문서 끝**
