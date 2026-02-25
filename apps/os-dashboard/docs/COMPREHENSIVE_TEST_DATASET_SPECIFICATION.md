# NEURALTWIN 고객 대시보드 100% 테스트 데이터셋 완벽 명세서

> **최종 업데이트**: 2025-11-27  
> **버전**: 1.0.0  
> **목적**: 고객 대시보드 12개 페이지 전체 기능 완벽 테스트를 위한 데이터셋 생성 가이드

---

## 📋 목차

1. [개요](#1-개요)
2. [페이지별 데이터 요구사항 매핑](#2-페이지별-데이터-요구사항-매핑)
3. [필수 CSV 데이터셋 (15개)](#3-필수-csv-데이터셋-15개)
4. [데이터 생성 규칙 및 패턴](#4-데이터-생성-규칙-및-패턴)
5. [온톨로지 엔티티 커버리지](#5-온톨로지-엔티티-커버리지)
6. [데이터 업로드 순서](#6-데이터-업로드-순서)
7. [데이터 검증 체크리스트](#7-데이터-검증-체크리스트)
8. [샘플 데이터 예시](#8-샘플-데이터-예시)

---

## 1. 개요

### 1.1 데이터셋 목표
- 고객 대시보드 **12개 페이지 전체 기능** 100% 테스트 가능
- **온톨로지 스키마 43개 엔티티** 중 CRITICAL + HIGH 우선순위(29개) 완벽 커버
- **AI 추론 규칙 25개** 모두 실행 가능한 데이터 품질 확보
- **실제 비즈니스 시나리오** 반영 (패션 리테일 매장 데이터)

### 1.2 전체 데이터셋 구조

```
NEURALTWIN 테스트 데이터셋
├── 1단계: 기준 데이터 (2개)
│   ├── stores.csv (3개 매장)
│   └── brands.csv (10개 브랜드)
│
├── 2단계: 제품 데이터 (2개)
│   ├── products.csv (100개 제품)
│   └── inventory_levels.csv (300개 재고 레코드)
│
├── 3단계: 고객 및 활동 (4개)
│   ├── customers.csv (500명)
│   ├── visits.csv (3,000건)
│   ├── purchases.csv (1,500건)
│   └── zones.csv (24개 구역)
│
├── 4단계: 프로모션 및 직원 (3개)
│   ├── promotions.csv (20개)
│   ├── staff.csv (15명)
│   └── shifts.csv (90건)
│
└── 5단계: IoT 및 컨텍스트 데이터 (4개)
    ├── wifi_sensors.csv (24개 센서)
    ├── wifi_tracking.csv (15,000건)
    ├── economic_indicators.csv (90건)
    └── holidays_events.csv (30건)
```

### 1.3 데이터 규모 요약

| 데이터셋 | 파일명 | 레코드 수 | 크기 예상 | 우선순위 |
|---------|--------|----------|----------|---------|
| 매장 | stores.csv | 3 | 1 KB | P1 필수 |
| 브랜드 | brands.csv | 10 | 2 KB | P1 필수 |
| 제품 | products.csv | 100 | 15 KB | P1 필수 |
| 재고 | inventory_levels.csv | 300 | 10 KB | P1 필수 |
| 고객 | customers.csv | 500 | 30 KB | P1 필수 |
| 방문 | visits.csv | 3,000 | 200 KB | P1 필수 |
| 구매 | purchases.csv | 1,500 | 80 KB | P1 필수 |
| 구역 | zones.csv | 24 | 3 KB | P2 권장 |
| 프로모션 | promotions.csv | 20 | 3 KB | P2 권장 |
| 직원 | staff.csv | 15 | 2 KB | P2 권장 |
| 근무 | shifts.csv | 90 | 5 KB | P2 권장 |
| WiFi센서 | wifi_sensors.csv | 24 | 2 KB | P3 선택 |
| WiFi추적 | wifi_tracking.csv | 15,000 | 1 MB | P3 선택 |
| 경제지표 | economic_indicators.csv | 90 | 5 KB | P3 선택 |
| 이벤트 | holidays_events.csv | 30 | 3 KB | P3 선택 |
| **합계** | **15개 파일** | **20,706건** | **~1.4 MB** | - |

---

## 2. 페이지별 데이터 요구사항 매핑

### 2.1 Section A - Overview (4페이지)

#### A-1. DashboardPage (대시보드)
**필요 데이터**:
- ✅ **필수**: stores, customers, visits, purchases, zones
- ⭐ **권장**: staff, promotions, economic_indicators, holidays_events
- 📊 **생성 데이터**: dashboard_kpis (자동 집계)

**테스트 시나리오**:
1. KPI 카드 표시 (총 매출, 방문자, CVR, 평당매출)
2. 일별/주별/월별 트렌드 차트
3. 매장 비교 분석
4. 이상 감지 알림

**데이터 품질 요구사항**:
- 최근 90일 이상의 연속 데이터 (visits, purchases)
- 매장별 균형있는 데이터 분포 (70% / 20% / 10%)
- 주중/주말 패턴 차이 (평일 60%, 주말 40%)
- 시간대별 분포 (피크타임 18:00-20:00 = 40%)

---

#### A-2. StoresPage (매장 관리)
**필요 데이터**:
- ✅ **필수**: stores, zones, staff
- ⭐ **권장**: inventory_levels, wifi_sensors
- 📊 **생성 데이터**: store health scoring (AI 계산)

**테스트 시나리오**:
1. 매장 목록 및 상세 정보 표시
2. 매장별 Zone 구성 (입구, 판매공간, 계산대, 피팅룸 등)
3. 직원 배치 현황
4. 매장 건강도 점수 (재고, 인력, 성과 종합)

**데이터 품질 요구사항**:
- 매장당 8-10개 Zone (입구 1 + 판매공간 4-6 + 계산대 1 + 피팅룸 1 + 기타 1-2)
- 매장당 5-7명 직원 (매니저 1 + 판매 3-4 + 재고관리 1-2)
- 면적 데이터 정확 (Zone 면적 합 ≈ 매장 총 면적의 90%)

---

#### A-3. HQCommunicationPage (HQ-매장 커뮤니케이션)
**필요 데이터**:
- ✅ **필수**: stores, staff
- 📊 **Database**: hq_store_messages, hq_guidelines, hq_notifications

**테스트 시나리오**:
1. HQ → 매장 메시지 발송 (특정 매장 타겟팅)
2. 가이드라인 배포 (매장 선택)
3. 알림 수신 및 읽음 처리
4. 댓글/답장 스레드

**데이터 품질 요구사항**:
- CSV 업로드 불필요 (Database 직접 입력 기능 사용)
- stores.csv만 있으면 매장 선택 가능

---

#### A-4. SettingsPage (설정)
**필요 데이터**:
- 📊 **Database**: profiles, organizations, licenses, organization_members

**테스트 시나리오**:
1. 사용자 정보 표시
2. 조직 정보 표시
3. 구독/라이센스 정보
4. 알림 설정

**데이터 품질 요구사항**:
- CSV 업로드 불필요 (로그인 계정 정보 사용)

---

### 2.2 Section B - Store Analysis (3페이지)

#### B-1. StoreAnalysisPage (매장 분석)
**필요 데이터**:
- ✅ **필수**: stores, zones, visits, purchases, staff
- ⭐ **권장**: promotions, wifi_tracking
- 📊 **생성 데이터**: zone performance metrics (AI 계산)

**테스트 시나리오**:
1. Zone별 성과 분석 (매출, 체류시간, 전환율)
2. 프로모션 효과 측정 (Before/After)
3. 직원 효율성 분석 (판매건수, 객단가)
4. 동선 히트맵 (3D 시각화)

**데이터 품질 요구사항**:
- visits.csv에 zones_visited 필드 필수 (예: "ZONE-A,ZONE-B,ZONE-C")
- purchases.csv와 visits.csv 연결 (visit_id 일치)
- Zone별 최소 100건 이상 방문 데이터
- 프로모션 기간 전후 2주 이상 데이터

---

#### B-2. CustomerAnalysisPage (고객 분석)
**필요 데이터**:
- ✅ **필수**: customers, visits, purchases
- ⭐ **권장**: None
- 📊 **생성 데이터**: RFM segmentation, LTV prediction, churn detection (AI)

**테스트 시나리오**:
1. RFM 세그먼테이션 (최근성, 빈도, 금액)
2. 고객 생애가치(LTV) 예측
3. 이탈 위험 고객 탐지
4. 코호트 분석 (가입 월별)

**데이터 품질 요구사항**:
- customers.csv: 500명 (VIP 10%, Regular 60%, New 30%)
- purchases.csv: 고객당 평균 3건 이상 (VIP는 5건 이상)
- 최근 90일 내 거래 데이터
- 다양한 구매 패턴 (단골 고객, 일회성 고객, 이탈 고객)

---

#### B-3. ProductAnalysisPage (상품 분석)
**필요 데이터**:
- ✅ **필수**: products, purchases, inventory_levels, brands
- ⭐ **권장**: promotions
- 📊 **생성 데이터**: product ranking, cross-sell recommendations, slow-moving alerts (AI)

**테스트 시나리오**:
1. 제품 성과 랭킹 (매출, 수량, 마진)
2. 교차 판매 추천 (함께 구매된 제품)
3. 재고 회전율 분석
4. 느린 이동 상품 경고

**데이터 품질 요구사항**:
- products.csv: 100개 (카테고리별 균형: Bag 20, Top 20, Bottom 20, Shoes 15, Outer 15, Accessory 10)
- purchases.csv: 제품당 최소 5건 판매 (인기 제품은 50건 이상)
- inventory_levels.csv: 모든 제품의 현재 재고 상태
- brands.csv: 제품의 brand_id와 정확히 일치

---

### 2.3 Section C - Simulation (2페이지)

#### C-1. DigitalTwin3DPage (디지털 트윈 3D)
**필요 데이터**:
- ✅ **필수**: stores, zones, products, wifi_sensors
- ⭐ **권장**: wifi_tracking, visits
- 📊 **3D Models**: GLB 파일 (매장, Zone, 제품, 센서)
- 📊 **생성 데이터**: 3D scene composition (자동)

**테스트 시나리오**:
1. 3D 매장 레이아웃 표시
2. Zone별 색상 코딩 (성과 기반)
3. 제품 배치 시각화
4. WiFi 센서 커버리지 표시
5. 고객 동선 애니메이션 (wifi_tracking 기반)

**데이터 품질 요구사항**:
- zones.csv: X, Y, Z 좌표 필수 (3D 위치)
- products.csv: zone_id 연결 (어느 Zone에 배치되었는지)
- wifi_sensors.csv: position_x, position_y, position_z (3D 좌표)
- wifi_tracking.csv: timestamp별 좌표 경로 (동선 애니메이션용)

---

#### C-2. SimulationHubPage (시뮬레이션 허브)
**필요 데이터**:
- ✅ **필수**: stores, products, inventory_levels, purchases, visits
- ⭐ **권장**: economic_indicators, holidays_events, promotions
- 📊 **생성 데이터**: demand forecast, inventory optimization, pricing optimization, promotion strategy (AI)

**테스트 시나리오**:
1. 수요 예측 (다음 주/월 판매량)
2. 재고 최적화 (적정 재고 수준 추천)
3. 가격 최적화 (탄력성 기반)
4. 프로모션 전략 추천 (타겟 고객, 할인율, 기간)

**데이터 품질 요구사항**:
- purchases.csv: 최소 90일 연속 데이터 (시계열 패턴 학습)
- inventory_levels.csv: 현재 재고 + 최소/최적 재고 수준
- economic_indicators.csv: 경제 지표 (소비자 심리 지수 등)
- holidays_events.csv: 주요 이벤트 날짜 (판매 급증 시점)

---

### 2.4 Section D - Data Management (3페이지)

#### D-1. UnifiedDataManagementPage (통합 데이터 임포트)
**필요 데이터**:
- ✅ **업로드 대상**: 위 15개 CSV 파일 모두
- 📊 **Database**: user_data_imports (임포트 이력)

**테스트 시나리오**:
1. CSV 파일 업로드 (드래그앤드롭 or 파일 선택)
2. 데이터 타입 자동 감지 및 매핑
3. 데이터 검증 (스키마 일치, 필수 필드, 중복 체크)
4. 업로드 진행 상황 표시
5. 에러 처리 및 수정 제안

**데이터 품질 요구사항**:
- UTF-8 인코딩 (BOM 없음)
- 헤더 행 필수 (첫 줄)
- 관계형 데이터 무결성 (FK 참조 정확)
- 날짜/시간 형식 통일 (YYYY-MM-DD, HH:MM:SS)

---

#### D-2. SchemaBuilderPage (스키마 빌더)
**필요 데이터**:
- 📊 **Database**: ontology_entity_types, ontology_relation_types

**테스트 시나리오**:
1. 온톨로지 엔티티 타입 조회
2. 관계 타입 조회 및 시각화
3. 엔티티 추가/수정/삭제
4. 관계 추가/수정/삭제

**데이터 품질 요구사항**:
- CSV 업로드 불필요 (Database 직접 관리)
- 온톨로지 스키마는 이미 Migration으로 생성됨

---

#### D-3. APIIntegrationPage (API 연동)
**필요 데이터**:
- 📊 **Database**: api_connections, data_sync_schedules, data_sync_logs

**테스트 시나리오**:
1. API 연결 등록 (URL, 인증, 헤더)
2. 연결 테스트
3. 동기화 스케줄 설정 (Cron)
4. 동기화 실행 로그 확인

**데이터 품질 요구사항**:
- CSV 업로드 불필요 (Database 직접 관리)

---

## 3. 필수 CSV 데이터셋 (15개)

### 3.1 1단계: 기준 데이터

#### 📄 stores.csv
**목적**: 매장 기본 정보  
**레코드 수**: 3개 (플래그십 1 + 스탠다드 2)  
**온톨로지**: Store

| 컬럼명 | 타입 | 필수 | 설명 | 예시 |
|--------|------|------|------|------|
| store_code | string | ✅ | 매장 고유 코드 | ST001 |
| store_name | string | ✅ | 매장명 | 강남 플래그십 |
| address | string | ✅ | 주소 | 서울 강남구 테헤란로 123 |
| area_sqm | number | ✅ | 면적(㎡) | 450.0 |
| opening_date | date | ❌ | 개점일 | 2023-03-15 |
| store_format | string | ❌ | 매장 포맷 | flagship |
| region | string | ❌ | 권역 | 서울 |
| district | string | ❌ | 상권 | 강남역 |
| manager_name | string | ❌ | 매장 책임자 | 김매니저 |
| daily_traffic | number | ❌ | 일일 평균 방문객 | 1200 |

**샘플 데이터**:
```csv
store_code,store_name,address,area_sqm,opening_date,store_format,region,district,manager_name,daily_traffic
ST001,강남 플래그십,서울 강남구 테헤란로 123,450.0,2023-03-15,flagship,서울,강남역,김매니저,1200
ST002,홍대점,서울 마포구 어울마당로 456,320.0,2023-06-01,standard,서울,홍대입구,이매니저,800
ST003,부산 센텀,부산 해운대구 센텀로 789,380.0,2023-09-10,flagship,부산,센텀시티,박매니저,1000
```

**데이터 생성 규칙**:
- store_code: "ST" + 3자리 숫자 (ST001, ST002, ST003)
- store_format: flagship (40%), standard (60%)
- area_sqm: 250-500㎡ 범위 (플래그십 > 스탠다드)
- daily_traffic: 면적과 비례 (㎡당 평균 2.5명)

---

#### 📄 brands.csv
**목적**: 브랜드 마스터 데이터  
**레코드 수**: 10개  
**온톨로지**: Brand

| 컬럼명 | 타입 | 필수 | 설명 | 예시 |
|--------|------|------|------|------|
| brand_id | string | ✅ | 브랜드 고유 ID | BRD001 |
| brand_name | string | ✅ | 브랜드명 | URBAN STYLE |
| brand_type | string | ✅ | 브랜드 유형 | fashion_apparel |
| country | string | ❌ | 원산지 | KR |
| launch_year | number | ❌ | 출시 연도 | 2020 |
| positioning | string | ❌ | 포지셔닝 | premium |
| target_gender | string | ❌ | 타겟 성별 | unisex |
| target_age_group | string | ❌ | 타겟 연령대 | 20-35 |

**샘플 데이터**:
```csv
brand_id,brand_name,brand_type,country,launch_year,positioning,target_gender,target_age_group
BRD001,URBAN STYLE,fashion_apparel,KR,2020,premium,unisex,20-35
BRD002,CLASSIC LINE,fashion_apparel,KR,2018,mid_tier,unisex,30-50
BRD003,YOUTH VIBE,fashion_apparel,KR,2022,affordable,F,18-28
BRD004,LUXURY FASHION,fashion_apparel,IT,2015,luxury,unisex,30-60
BRD005,SPORT WEAR,activewear,US,2019,mid_tier,unisex,20-40
BRD006,ECO BRAND,fashion_apparel,KR,2021,premium,unisex,25-45
BRD007,STREET CULTURE,streetwear,KR,2023,affordable,M,18-30
BRD008,OFFICE CHIC,fashion_apparel,KR,2017,mid_tier,F,25-45
BRD009,WEEKEND CASUAL,fashion_apparel,KR,2019,affordable,unisex,20-40
BRD010,FORMAL ELEGANCE,fashion_apparel,KR,2016,premium,unisex,30-55
```

**데이터 생성 규칙**:
- brand_id: "BRD" + 3자리 숫자
- positioning: luxury (10%), premium (30%), mid_tier (40%), affordable (20%)
- country: KR (70%), 기타 (30%)

---

### 3.2 2단계: 제품 데이터

#### 📄 products.csv
**목적**: 제품 카탈로그  
**레코드 수**: 100개  
**온톨로지**: Product

| 컬럼명 | 타입 | 필수 | 설명 | 예시 |
|--------|------|------|------|------|
| sku | string | ✅ | SKU 코드 | SKU-W-DRS-001 |
| product_name | string | ✅ | 제품명 | 플로럴 원피스 |
| category | string | ✅ | 카테고리 | Top |
| brand_id | string | ✅ | 브랜드 ID | BRD001 |
| selling_price | number | ✅ | 판매가 | 89000 |
| cost_price | number | ❌ | 원가 | 45000 |
| margin_rate | number | ❌ | 마진율(%) | 49.4 |
| package_type | string | ❌ | 포장 유형 | hanger |
| display_priority | number | ❌ | 진열 우선순위 | 1 |
| zone_id | string | ❌ | 배치 Zone | ZONE-ST001-TOP |

**카테고리 분류** (100개 제품 분포):
- Top (상의): 25개
- Bottom (하의): 25개
- Outer (아우터): 15개
- Shoes (신발): 15개
- Bag (가방): 10개
- Accessory (액세서리): 10개

**샘플 데이터** (카테고리별 2개씩):
```csv
sku,product_name,category,brand_id,selling_price,cost_price,margin_rate,package_type,display_priority,zone_id
SKU-TOP-001,베이직 티셔츠,Top,BRD001,29000,15000,48.3,folded,2,ZONE-ST001-TOP
SKU-TOP-002,오버핏 맨투맨,Top,BRD002,49000,25000,49.0,folded,1,ZONE-ST001-TOP
SKU-BTM-001,슬림핏 청바지,Bottom,BRD001,89000,45000,49.4,hanger,1,ZONE-ST001-BTM
SKU-BTM-002,와이드 팬츠,Bottom,BRD003,79000,40000,49.4,hanger,2,ZONE-ST001-BTM
SKU-OUT-001,트렌치 코트,Outer,BRD004,259000,130000,49.8,hanger,1,ZONE-ST001-OUT
SKU-OUT-002,레더 재킷,Outer,BRD005,199000,100000,49.7,hanger,1,ZONE-ST001-OUT
SKU-SHO-001,화이트 스니커즈,Shoes,BRD006,129000,65000,49.6,boxed,1,ZONE-ST001-SHOES
SKU-SHO-002,앵클 부츠,Shoes,BRD007,149000,75000,49.7,boxed,2,ZONE-ST001-SHOES
SKU-BAG-001,크로스백,Bag,BRD008,89000,45000,49.4,boxed,1,ZONE-ST001-BAG
SKU-BAG-002,백팩,Bag,BRD009,119000,60000,49.6,boxed,2,ZONE-ST001-BAG
```

**데이터 생성 규칙**:
- sku: "SKU-{카테고리코드}-{일련번호3자리}"
- selling_price: 
  - Top: 19,000 ~ 89,000원
  - Bottom: 59,000 ~ 129,000원
  - Outer: 129,000 ~ 399,000원
  - Shoes: 89,000 ~ 199,000원
  - Bag: 59,000 ~ 299,000원
  - Accessory: 19,000 ~ 89,000원
- cost_price: selling_price의 50% (마진율 약 50%)
- brand_id: brands.csv의 brand_id와 정확히 일치 (❗ 중요)
- zone_id: zones.csv 업로드 후 연결

---

#### 📄 inventory_levels.csv
**목적**: 매장별 제품 재고  
**레코드 수**: 300개 (100개 제품 × 3개 매장)  
**온톨로지**: Inventory

| 컬럼명 | 타입 | 필수 | 설명 | 예시 |
|--------|------|------|------|------|
| store_id | string | ✅ | 매장 코드 | ST001 |
| product_id | string | ✅ | 제품 SKU | SKU-TOP-001 |
| current_stock | number | ✅ | 현재 재고 | 25 |
| minimum_stock | number | ✅ | 최소 재고 | 10 |
| optimal_stock | number | ✅ | 적정 재고 | 40 |
| weekly_demand | number | ✅ | 주간 수요 | 15 |
| last_updated | datetime | ❌ | 마지막 업데이트 | 2024-11-25 09:00:00 |

**샘플 데이터**:
```csv
store_id,product_id,current_stock,minimum_stock,optimal_stock,weekly_demand,last_updated
ST001,SKU-TOP-001,25,10,40,15,2024-11-25 09:00:00
ST001,SKU-TOP-002,32,12,45,18,2024-11-25 09:00:00
ST001,SKU-BTM-001,18,8,35,12,2024-11-25 09:00:00
ST002,SKU-TOP-001,15,10,40,12,2024-11-25 09:00:00
ST002,SKU-TOP-002,20,12,45,14,2024-11-25 09:00:00
ST003,SKU-TOP-001,30,10,40,16,2024-11-25 09:00:00
```

**데이터 생성 규칙**:
- 모든 제품(100개) × 모든 매장(3개) = 300개 레코드
- optimal_stock = weekly_demand × 2.5 ~ 3.0
- minimum_stock = weekly_demand × 0.6 ~ 0.8
- current_stock: optimal_stock ± 40% (랜덤)
- 재고 상태 분포:
  - 충분 (current >= optimal): 40%
  - 주의 (minimum <= current < optimal): 40%
  - 부족 (current < minimum): 20% ⬅️ AI 알림 트리거

**관계 생성**:
- inventory_of_product: Inventory → Product
- inventory_at_store: Inventory → Store

---

### 3.3 3단계: 고객 및 활동 데이터

#### 📄 customers.csv
**목적**: 고객 프로필  
**레코드 수**: 500명  
**온톨로지**: Customer

| 컬럼명 | 타입 | 필수 | 설명 | 예시 |
|--------|------|------|------|------|
| customer_id | string | ✅ | 고객 고유 ID | C00001 |
| name | string | ❌ | 고객명 (익명화) | 김고객 |
| age_group | string | ❌ | 연령대 | 20-29 |
| gender | string | ❌ | 성별 | F |
| customer_segment | string | ✅ | 고객 세그먼트 | VIP |
| signup_date | date | ✅ | 가입일 | 2023-06-15 |
| loyalty_tier | string | ❌ | 멤버십 등급 | gold |
| lifetime_value | number | ❌ | 생애가치 | 2500000 |
| churn_risk_score | number | ❌ | 이탈 위험도(0-1) | 0.15 |

**세그먼트 분포** (500명):
- VIP: 50명 (10%)
- Regular: 300명 (60%)
- New: 150명 (30%)

**샘플 데이터**:
```csv
customer_id,name,age_group,gender,customer_segment,signup_date,loyalty_tier,lifetime_value,churn_risk_score
C00001,김민준,20-29,F,VIP,2023-03-15,gold,2500000,0.15
C00002,이서연,30-39,F,regular,2023-08-22,silver,850000,0.35
C00003,박지훈,20-29,M,new,2024-11-01,bronze,125000,0.60
C00004,최수아,40-49,F,VIP,2022-12-10,platinum,3200000,0.10
C00005,정도윤,30-39,M,regular,2024-02-18,silver,720000,0.40
```

**데이터 생성 규칙**:
- customer_id: "C" + 5자리 숫자 (C00001 ~ C00500)
- age_group: 10-19(5%), 20-29(30%), 30-39(35%), 40-49(20%), 50-59(8%), 60+(2%)
- gender: F(60%), M(40%)
- customer_segment:
  - VIP: loyalty_tier = gold/platinum, lifetime_value > 1,500,000원, churn_risk_score < 0.3
  - Regular: loyalty_tier = silver/bronze, lifetime_value = 500,000~1,500,000원, churn_risk_score = 0.3~0.5
  - New: loyalty_tier = bronze, lifetime_value < 500,000원, churn_risk_score > 0.5
- signup_date: 최근 2년 이내 (2023-01-01 ~ 2024-11-27)

---

#### 📄 visits.csv
**목적**: 매장 방문 기록  
**레코드 수**: 3,000건 (최근 90일)  
**온톨로지**: Visit

| 컬럼명 | 타입 | 필수 | 설명 | 예시 |
|--------|------|------|------|------|
| visit_id | string | ✅ | 방문 ID | V0000001 |
| customer_id | string | ✅ | 고객 ID | C00001 |
| store_code | string | ✅ | 매장 코드 | ST001 |
| visit_date | date | ✅ | 방문 날짜 | 2024-11-15 |
| visit_time | time | ✅ | 방문 시간 | 14:30:00 |
| exit_time | time | ✅ | 퇴장 시간 | 15:15:00 |
| duration_minutes | number | ✅ | 체류시간(분) | 45 |
| zones_visited | string | ❌ | 방문 Zone (쉼표구분) | ZONE-ST001-ENTRANCE,ZONE-ST001-TOP,ZONE-ST001-CHECKOUT |
| did_purchase | boolean | ✅ | 구매 여부 | true |

**샘플 데이터**:
```csv
visit_id,customer_id,store_code,visit_date,visit_time,exit_time,duration_minutes,zones_visited,did_purchase
V0000001,C00001,ST001,2024-11-15,14:30:00,15:15:00,45,"ZONE-ST001-ENTRANCE,ZONE-ST001-TOP,ZONE-ST001-BTM,ZONE-ST001-CHECKOUT",true
V0000002,C00002,ST001,2024-11-15,15:20:00,15:42:00,22,"ZONE-ST001-ENTRANCE,ZONE-ST001-SHOES",false
V0000003,C00003,ST002,2024-11-15,18:45:00,19:40:00,55,"ZONE-ST002-ENTRANCE,ZONE-ST002-OUT,ZONE-ST002-TOP,ZONE-ST002-CHECKOUT",true
V0000004,C00004,ST003,2024-11-16,11:00:00,11:25:00,25,"ZONE-ST003-ENTRANCE,ZONE-ST003-BAG,ZONE-ST003-ACC",false
V0000005,C00001,ST001,2024-11-16,19:10:00,20:05:00,55,"ZONE-ST001-ENTRANCE,ZONE-ST001-OUT,ZONE-ST001-FITTING,ZONE-ST001-CHECKOUT",true
```

**데이터 생성 규칙**:
- visit_id: "V" + 7자리 숫자 (V0000001 ~ V0003000)
- 기간: 최근 90일 (2024-08-28 ~ 2024-11-27)
- 매장별 분포: ST001(70%), ST002(20%), ST003(10%)
- 시간대별 분포:
  - 10:00-12:00: 15%
  - 12:00-14:00: 20%
  - 14:00-17:00: 25%
  - 17:00-20:00: 40% ⬅️ 피크타임
- duration_minutes:
  - 구매한 경우 (did_purchase=true): 30-90분, 평균 50분
  - 구매 안한 경우 (did_purchase=false): 10-40분, 평균 20분
- did_purchase: true (35%), false (65%) ⬅️ 전환율 35%
- zones_visited: 평균 2-5개 Zone (입구는 필수 포함)

**요일별 패턴**:
- 평일 (월-목): 60% of visits
- 주말 (금-일): 40% of visits

**관계 생성**:
- visit_by_customer: Visit → Customer
- visit_to_store: Visit → Store

---

#### 📄 purchases.csv
**목적**: 구매/판매 거래  
**레코드 수**: 1,500건 (visits 중 did_purchase=true인 것만)  
**온톨로지**: Sale, Transaction

| 컬럼명 | 타입 | 필수 | 설명 | 예시 |
|--------|------|------|------|------|
| sale_id | string | ✅ | 판매 ID | S0000001 |
| visit_id | string | ✅ | 방문 ID | V0000001 |
| customer_id | string | ✅ | 고객 ID | C00001 |
| store_code | string | ✅ | 매장 코드 | ST001 |
| sale_date | date | ✅ | 판매 날짜 | 2024-11-15 |
| sale_time | time | ✅ | 판매 시간 | 15:10:00 |
| products_purchased | string | ✅ | 구매 제품 (쉼표구분) | SKU-TOP-001,SKU-BTM-001 |
| quantities | string | ✅ | 수량 (쉼표구분) | 1,1 |
| total_amount | number | ✅ | 총 금액 | 118000 |
| discount_amount | number | ❌ | 할인 금액 | 0 |
| payment_method | string | ❌ | 결제 수단 | card |
| num_items | number | ✅ | 구매 품목 수 | 2 |

**샘플 데이터**:
```csv
sale_id,visit_id,customer_id,store_code,sale_date,sale_time,products_purchased,quantities,total_amount,discount_amount,payment_method,num_items
S0000001,V0000001,C00001,ST001,2024-11-15,15:10:00,"SKU-TOP-001,SKU-BTM-001","1,1",118000,0,card,2
S0000002,V0000003,C00003,ST002,2024-11-15,19:35:00,"SKU-OUT-001","1",259000,25900,mobile,1
S0000003,V0000005,C00001,ST001,2024-11-16,20:00:00,"SKU-OUT-002,SKU-BAG-001","1,1",308000,0,card,2
S0000004,V0000008,C00008,ST001,2024-11-17,14:45:00,"SKU-TOP-002,SKU-SHO-001,SKU-ACC-001","2,1,1",236000,23600,card,4
```

**데이터 생성 규칙**:
- sale_id: "S" + 7자리 숫자 (S0000001 ~ S0001500)
- visit_id: visits.csv에서 did_purchase=true인 visit만 연결 (약 1,050건)
  - 일부 visit은 여러 개의 purchase 가능 (교환/추가 구매)
- sale_time: visit의 exit_time 약 5-10분 전
- products_purchased: 1-5개 제품 (평균 2.3개)
  - VIP: 평균 3.5개
  - Regular: 평균 2.2개
  - New: 평균 1.5개
- total_amount: 제품 가격 합계 - 할인
- discount_amount:
  - 70%: 할인 없음 (0원)
  - 30%: 5-30% 할인
- payment_method: card (70%), mobile (25%), cash (5%)

**세그먼트별 평균 객단가**:
- VIP: 180,000원 (고가 제품 선호)
- Regular: 85,000원
- New: 55,000원

**관계 생성**:
- sale_of: Sale → Product (products_purchased 각각)
- made_by: Sale → Customer
- occurred_at: Sale → Store
- during_visit: Sale → Visit

---

#### 📄 zones.csv
**목적**: 매장 내 구역 정의  
**레코드 수**: 24개 (매장당 8개 × 3개 매장)  
**온톨로지**: Zone, Entrance, CheckoutCounter, FittingRoom

| 컬럼명 | 타입 | 필수 | 설명 | 예시 |
|--------|------|------|------|------|
| zone_id | string | ✅ | 구역 ID | ZONE-ST001-ENTRANCE |
| store_code | string | ✅ | 매장 코드 | ST001 |
| zone_type | string | ✅ | 구역 유형 | entrance |
| zone_name | string | ✅ | 구역명 | 메인 입구 |
| area_sqm | number | ✅ | 면적(㎡) | 30.0 |
| position_x | number | ❌ | X 좌표 (미터) | 10.0 |
| position_y | number | ❌ | Y 좌표 (미터) | 0.0 |
| position_z | number | ❌ | Z 좌표 (미터) | 0.0 |
| purpose | string | ❌ | 용도 | customer_entry |
| traffic_level | string | ❌ | 통행량 | high |

**Zone 유형**:
- entrance: 입구
- sales_floor: 판매 공간 (카테고리별)
- fitting_room: 피팅룸
- checkout: 계산대
- storage: 창고
- staff: 직원 공간

**매장당 표준 Zone 구성** (8개):
1. ENTRANCE (입구) - 1개
2. SALES_FLOOR (판매 공간) - 4개
   - TOP (상의)
   - BOTTOM (하의)
   - OUTER (아우터)
   - SHOES (신발)
3. FITTING (피팅룸) - 1개
4. CHECKOUT (계산대) - 1개
5. STORAGE (창고) - 1개

**샘플 데이터** (ST001 매장):
```csv
zone_id,store_code,zone_type,zone_name,area_sqm,position_x,position_y,position_z,purpose,traffic_level
ZONE-ST001-ENTRANCE,ST001,entrance,메인 입구,30.0,10.0,0.0,0.0,customer_entry,high
ZONE-ST001-TOP,ST001,sales_floor,상의 구역,120.0,10.0,5.0,0.0,product_display,high
ZONE-ST001-BTM,ST001,sales_floor,하의 구역,100.0,10.0,10.0,0.0,product_display,medium
ZONE-ST001-OUT,ST001,sales_floor,아우터 구역,80.0,5.0,5.0,0.0,product_display,medium
ZONE-ST001-SHOES,ST001,sales_floor,신발 구역,60.0,15.0,5.0,0.0,product_display,medium
ZONE-ST001-FITTING,ST001,fitting_room,피팅룸,25.0,2.0,8.0,0.0,try_on,low
ZONE-ST001-CHECKOUT,ST001,checkout,계산대,35.0,10.0,15.0,0.0,transaction,high
ZONE-ST001-STORAGE,ST001,storage,창고,40.0,0.0,15.0,0.0,inventory,low
```

**데이터 생성 규칙**:
- zone_id: "ZONE-{매장코드}-{구역타입}"
- 면적 합: 매장 area_sqm의 90-95%
- position_x, position_y: 매장 레이아웃 좌표 (0,0 = 좌측 하단)
- traffic_level:
  - entrance, checkout, 인기 sales_floor: high
  - 일반 sales_floor: medium
  - fitting_room, storage, staff: low

**관계 생성**:
- contains: Store → Zone

---

### 3.4 4단계: 프로모션 및 직원 데이터

#### 📄 promotions.csv
**목적**: 프로모션 캠페인  
**레코드 수**: 20개  
**온톨로지**: Promotion

| 컬럼명 | 타입 | 필수 | 설명 | 예시 |
|--------|------|------|------|------|
| promotion_id | string | ✅ | 프로모션 ID | PROMO001 |
| promotion_name | string | ✅ | 프로모션명 | 썸머 세일 |
| discount_rate | number | ✅ | 할인율(%) | 20.0 |
| start_date | date | ✅ | 시작일 | 2024-06-01 |
| end_date | date | ✅ | 종료일 | 2024-08-31 |
| target_category | string | ❌ | 타겟 카테고리 | Top,Bottom |
| target_products | string | ❌ | 타겟 제품 (쉼표구분) | SKU-TOP-001,SKU-BTM-001 |
| store_code | string | ❌ | 적용 매장 | ST001 |
| effectiveness_score | number | ❌ | 효과성 점수 (0-10) | 8.5 |
| roi | number | ❌ | ROI(%) | 250.0 |

**샘플 데이터**:
```csv
promotion_id,promotion_name,discount_rate,start_date,end_date,target_category,target_products,store_code,effectiveness_score,roi
PROMO001,썸머 세일,20.0,2024-06-01,2024-08-31,"Top,Bottom",,ST001,8.5,250.0
PROMO002,가을맞이 할인,15.0,2024-09-01,2024-10-31,"Outer",SKU-OUT-001,ST001,7.8,180.0
PROMO003,연말 대축제,30.0,2024-11-15,2024-11-30,,,,9.2,320.0
PROMO004,VIP 특별 할인,25.0,2024-10-01,2024-12-31,"Bag,Accessory",,ST002,8.0,200.0
PROMO005,신규 고객 환영,10.0,2024-01-01,2024-12-31,,,ST003,6.5,120.0
```

**데이터 생성 규칙**:
- promotion_id: "PROMO" + 3자리 숫자
- discount_rate: 10-30%
- 기간: 최근 1년 이내
- effectiveness_score: 5.0-10.0 (할인율과 비례)
- roi: 100-400% (효과성 점수와 비례)

**관계 생성**:
- promotes_product: Promotion → Product (target_products)
- runs_at_store: Promotion → Store

---

#### 📄 staff.csv
**목적**: 직원 정보  
**레코드 수**: 15명 (매장당 5명)  
**온톨로지**: Staff

| 컬럼명 | 타입 | 필수 | 설명 | 예시 |
|--------|------|------|------|------|
| staff_id | string | ✅ | 직원 ID | EMP001 |
| staff_name | string | ✅ | 직원명 | 김직원 |
| store_code | string | ✅ | 소속 매장 | ST001 |
| role | string | ✅ | 역할 | sales |
| hire_date | date | ✅ | 입사일 | 2023-06-01 |
| employment_type | string | ❌ | 고용 형태 | full_time |
| hourly_rate | number | ❌ | 시급 | 15000 |
| performance_score | number | ❌ | 성과 점수 (0-10) | 8.5 |
| sales_count_monthly | number | ❌ | 월 판매 건수 | 120 |

**역할 분포** (매장당):
- manager: 1명
- sales: 3명
- stockist: 1명

**샘플 데이터**:
```csv
staff_id,staff_name,store_code,role,hire_date,employment_type,hourly_rate,performance_score,sales_count_monthly
EMP001,김매니저,ST001,manager,2023-03-15,full_time,25000,9.2,150
EMP002,이판매1,ST001,sales,2023-06-01,full_time,15000,8.5,120
EMP003,박판매2,ST001,sales,2023-06-01,full_time,15000,7.8,100
EMP004,최판매3,ST001,sales,2024-01-10,part_time,12000,6.5,80
EMP005,정재고,ST001,stockist,2023-08-15,full_time,13000,8.0,0
```

**데이터 생성 규칙**:
- staff_id: "EMP" + 3자리 숫자
- role별 hourly_rate:
  - manager: 20,000-30,000원
  - sales: 12,000-18,000원
  - stockist: 11,000-15,000원
- performance_score: 5.0-10.0
- sales_count_monthly: 역할과 성과에 비례

**관계 생성**:
- works_at: Staff → Store

---

#### 📄 shifts.csv
**목적**: 직원 근무 스케줄  
**레코드 수**: 90건 (15명 × 최근 6일)  
**온톨로지**: Shift

| 컬럼명 | 타입 | 필수 | 설명 | 예시 |
|--------|------|------|------|------|
| shift_id | string | ✅ | 근무 ID | SHF0001 |
| staff_id | string | ✅ | 직원 ID | EMP001 |
| store_code | string | ✅ | 매장 코드 | ST001 |
| shift_date | date | ✅ | 근무 날짜 | 2024-11-25 |
| start_time | time | ✅ | 시작 시간 | 10:00:00 |
| end_time | time | ✅ | 종료 시간 | 20:00:00 |
| shift_type | string | ❌ | 근무 유형 | full_day |
| break_minutes | number | ❌ | 휴게 시간 (분) | 60 |

**근무 유형**:
- full_day: 10:00-20:00 (10시간)
- morning: 10:00-16:00 (6시간)
- afternoon: 14:00-20:00 (6시간)

**샘플 데이터**:
```csv
shift_id,staff_id,store_code,shift_date,start_time,end_time,shift_type,break_minutes
SHF0001,EMP001,ST001,2024-11-25,10:00:00,20:00:00,full_day,60
SHF0002,EMP002,ST001,2024-11-25,10:00:00,16:00:00,morning,30
SHF0003,EMP003,ST001,2024-11-25,14:00:00,20:00:00,afternoon,30
SHF0004,EMP004,ST001,2024-11-25,14:00:00,20:00:00,afternoon,30
SHF0005,EMP005,ST001,2024-11-25,10:00:00,16:00:00,morning,30
```

**데이터 생성 규칙**:
- shift_id: "SHF" + 4자리 숫자
- shift_date: 최근 7일
- 매일 매장당 최소 3명 이상 근무
- manager는 주로 full_day
- sales는 morning/afternoon 교대

**관계 생성**:
- assigned_to_staff: Shift → Staff
- scheduled_at_store: Shift → Store

---

### 3.5 5단계: IoT 및 컨텍스트 데이터

#### 📄 wifi_sensors.csv
**목적**: WiFi 센서 배치  
**레코드 수**: 24개 (매장당 8개)  
**온톨로지**: WiFiSensor

| 컬럼명 | 타입 | 필수 | 설명 | 예시 |
|--------|------|------|------|------|
| sensor_id | string | ✅ | 센서 ID | WS-ST001-001 |
| store_code | string | ✅ | 매장 코드 | ST001 |
| zone_id | string | ✅ | 설치 Zone | ZONE-ST001-ENTRANCE |
| sensor_type | string | ✅ | 센서 유형 | wifi_probe |
| position_x | number | ✅ | X 좌표 (미터) | 10.0 |
| position_y | number | ✅ | Y 좌표 (미터) | 0.5 |
| position_z | number | ✅ | Z 좌표 (미터) | 2.8 |
| mac_address | string | ❌ | MAC 주소 | AA:BB:CC:DD:EE:01 |
| ip_address | string | ❌ | IP 주소 | 192.168.1.101 |
| detection_range_m | number | ❌ | 탐지 범위 (미터) | 30 |
| status | string | ❌ | 상태 | active |

**샘플 데이터**:
```csv
sensor_id,store_code,zone_id,sensor_type,position_x,position_y,position_z,mac_address,ip_address,detection_range_m,status
WS-ST001-001,ST001,ZONE-ST001-ENTRANCE,wifi_probe,10.0,0.5,2.8,AA:BB:CC:DD:EE:01,192.168.1.101,30,active
WS-ST001-002,ST001,ZONE-ST001-TOP,wifi_probe,10.0,5.5,2.8,AA:BB:CC:DD:EE:02,192.168.1.102,30,active
WS-ST001-003,ST001,ZONE-ST001-BTM,wifi_probe,10.0,10.5,2.8,AA:BB:CC:DD:EE:03,192.168.1.103,30,active
WS-ST001-004,ST001,ZONE-ST001-OUT,wifi_probe,5.0,5.5,2.8,AA:BB:CC:DD:EE:04,192.168.1.104,30,active
WS-ST001-005,ST001,ZONE-ST001-SHOES,wifi_probe,15.0,5.5,2.8,AA:BB:CC:DD:EE:05,192.168.1.105,30,active
WS-ST001-006,ST001,ZONE-ST001-FITTING,wifi_probe,2.0,8.5,2.8,AA:BB:CC:DD:EE:06,192.168.1.106,25,active
WS-ST001-007,ST001,ZONE-ST001-CHECKOUT,wifi_probe,10.0,15.5,2.8,AA:BB:CC:DD:EE:07,192.168.1.107,30,active
WS-ST001-008,ST001,ZONE-ST001-STORAGE,wifi_probe,0.5,15.5,2.8,AA:BB:CC:DD:EE:08,192.168.1.108,25,active
```

**데이터 생성 규칙**:
- sensor_id: "WS-{매장코드}-{일련번호3자리}"
- Zone당 1개 센서 배치
- position_z: 천장 높이 2.5-3.0m
- detection_range_m: 25-35m
- status: active (95%), maintenance (5%)

**관계 생성**:
- installed_in_zone: WiFiSensor → Zone
- monitors_store: WiFiSensor → Store

---

#### 📄 wifi_tracking.csv
**목적**: WiFi 기반 위치 추적  
**레코드 수**: 15,000건  
**특수**: Database 테이블 직접 입력 (graph_entities 미생성)

| 컬럼명 | 타입 | 필수 | 설명 | 예시 |
|--------|------|------|------|------|
| tracking_id | string | ✅ | 추적 ID | TRK-000001 |
| sensor_id | string | ✅ | 감지 센서 | WS-ST001-001 |
| mac_address_hash | string | ✅ | 기기 MAC (해시) | hash_abc123 |
| timestamp | datetime | ✅ | 감지 시간 | 2024-11-15 14:30:15 |
| signal_strength | number | ✅ | 신호 강도 (dBm) | -65 |
| estimated_distance | number | ❌ | 추정 거리 (미터) | 5.2 |
| position_x | number | ❌ | 추정 X 좌표 | 10.5 |
| position_y | number | ❌ | 추정 Y 좌표 | 1.2 |
| store_code | string | ✅ | 매장 코드 | ST001 |

**샘플 데이터**:
```csv
tracking_id,sensor_id,mac_address_hash,timestamp,signal_strength,estimated_distance,position_x,position_y,store_code
TRK-000001,WS-ST001-001,hash_abc123,2024-11-15 14:30:15,-65,5.2,10.5,1.2,ST001
TRK-000002,WS-ST001-001,hash_abc123,2024-11-15 14:30:25,-63,4.8,10.8,1.5,ST001
TRK-000003,WS-ST001-002,hash_abc123,2024-11-15 14:30:35,-58,3.5,10.2,5.8,ST001
TRK-000004,WS-ST001-002,hash_abc123,2024-11-15 14:30:45,-60,4.0,10.5,6.2,ST001
```

**데이터 생성 규칙**:
- tracking_id: "TRK-" + 6자리 숫자
- 고객 방문(visits.csv)당 평균 5-10개 포인트 생성
  - 체류 시간 / 5초 = 포인트 수
  - 예: 45분 체류 = 540초 / 5초 = 108개 포인트
- signal_strength: -90 ~ -40 dBm
  - -40 ~ -60: 매우 가까움 (0-5m)
  - -61 ~ -75: 가까움 (5-15m)
  - -76 ~ -90: 멀음 (15-30m)
- mac_address_hash: 개인정보 보호 (해시 처리)
- 동일 고객의 연속 포인트는 5-10초 간격

---

#### 📄 economic_indicators.csv
**목적**: 경제 지표 (컨텍스트 데이터)  
**레코드 수**: 90건 (최근 90일)  
**온톨로지**: EconomicIndicator

| 컬럼명 | 타입 | 필수 | 설명 | 예시 |
|--------|------|------|------|------|
| date | date | ✅ | 날짜 | 2024-11-15 |
| indicator_type | string | ✅ | 지표 유형 | consumer_sentiment |
| indicator_value | number | ✅ | 지표 값 | 105.2 |
| region | string | ❌ | 지역 | Seoul |
| source | string | ❌ | 출처 | Korean Statistics |
| unit | string | ❌ | 단위 | index |

**지표 유형**:
- consumer_sentiment: 소비자 심리 지수
- retail_sales_index: 소매 판매 지수
- inflation_rate: 인플레이션율
- unemployment_rate: 실업률

**샘플 데이터**:
```csv
date,indicator_type,indicator_value,region,source,unit
2024-11-15,consumer_sentiment,105.2,Seoul,Korean Statistics,index
2024-11-15,retail_sales_index,112.5,Seoul,Korean Statistics,index
2024-11-15,inflation_rate,2.8,Korea,Bank of Korea,percent
2024-11-15,unemployment_rate,3.2,Korea,Korean Statistics,percent
2024-11-16,consumer_sentiment,106.0,Seoul,Korean Statistics,index
```

**데이터 생성 규칙**:
- date: 최근 90일 (매일)
- indicator_type별 1일 1건씩 (총 4개 지표 × 90일 = 360건 → 샘플은 90건만)
- 값 범위:
  - consumer_sentiment: 90-120 (100=중립)
  - retail_sales_index: 95-125 (100=기준)
  - inflation_rate: 1.5-4.0 (%)
  - unemployment_rate: 2.5-4.5 (%)

---

#### 📄 holidays_events.csv
**목적**: 공휴일 및 이벤트  
**레코드 수**: 30건 (최근 90일 내 주요 이벤트)  
**온톨로지**: Holiday, Event

| 컬럼명 | 타입 | 필수 | 설명 | 예시 |
|--------|------|------|------|------|
| date | date | ✅ | 날짜 | 2024-09-16 |
| event_name | string | ✅ | 이벤트명 | 추석 연휴 |
| event_type | string | ✅ | 이벤트 유형 | public_holiday |
| impact_level | string | ❌ | 영향도 | high |
| description | string | ❌ | 설명 | 명절 선물 구매 증가 예상 |

**이벤트 유형**:
- public_holiday: 공휴일
- special_event: 특별 이벤트 (블랙프라이데이, 크리스마스)
- weather_event: 날씨 이벤트 (폭염, 한파)
- local_event: 지역 행사

**샘플 데이터**:
```csv
date,event_name,event_type,impact_level,description
2024-09-16,추석 연휴,public_holiday,high,명절 선물 구매 증가 예상
2024-09-17,추석,public_holiday,high,명절 당일
2024-09-18,추석 연휴,public_holiday,high,명절 연휴
2024-10-03,개천절,public_holiday,medium,공휴일 쇼핑 증가
2024-10-09,한글날,public_holiday,medium,공휴일 쇼핑 증가
2024-11-11,빼빼로데이,special_event,medium,선물용 구매 증가
2024-11-29,블랙프라이데이,special_event,high,대규모 할인 이벤트
2024-12-25,크리스마스,public_holiday,high,연말 쇼핑 시즌
```

**데이터 생성 규칙**:
- date: 최근 90일 ~ 향후 30일
- impact_level:
  - high: 매출 20% 이상 변화
  - medium: 매출 10-20% 변화
  - low: 매출 10% 미만 변화

---

## 4. 데이터 생성 규칙 및 패턴

### 4.1 날짜/시간 형식 통일

```
날짜: YYYY-MM-DD (예: 2024-11-15)
시간: HH:MM:SS (예: 14:30:00)
날짜시간: YYYY-MM-DD HH:MM:SS (예: 2024-11-15 14:30:00)
```

### 4.2 숫자 형식 통일

```
정수: 쉼표 없음 (예: 89000)
소수: 점(.) 구분자 (예: 450.5)
백분율: 0-100 범위 (예: 49.4)
```

### 4.3 배열/리스트 형식

```csv
# 쉼표로 구분 (따옴표로 감싸기)
zones_visited,"ZONE-A,ZONE-B,ZONE-C"
products_purchased,"SKU-001,SKU-002,SKU-003"
quantities,"1,2,1"
```

### 4.4 불리언 값

```
true / false (소문자, 따옴표 없음)
```

### 4.5 인코딩 및 줄바꿈

```
인코딩: UTF-8 (BOM 없음)
줄바꿈: LF (Unix style)
구분자: 쉼표 (,)
따옴표: 쌍따옴표 (") - 필드에 쉼표 포함 시 사용
```

---

## 5. 온톨로지 엔티티 커버리지

### 5.1 CRITICAL 우선순위 엔티티 (17개) - 100% 커버

| 엔티티 | CSV 파일 | 레코드 수 | 상태 |
|--------|---------|----------|------|
| Organization | (Database) | 1 | ✅ 자동생성 |
| Store | stores.csv | 3 | ✅ 완료 |
| Zone | zones.csv | 24 | ✅ 완료 |
| Entrance | zones.csv (type=entrance) | 3 | ✅ 완료 |
| CheckoutCounter | zones.csv (type=checkout) | 3 | ✅ 완료 |
| Category | (자동추출) | 6 | ✅ products.csv에서 |
| Product | products.csv | 100 | ✅ 완료 |
| Inventory | inventory_levels.csv | 300 | ✅ 완료 |
| Brand | brands.csv | 10 | ✅ 완료 |
| Promotion | promotions.csv | 20 | ✅ 완료 |
| Customer | customers.csv | 500 | ✅ 완료 |
| Visit | visits.csv | 3,000 | ✅ 완료 |
| Transaction | purchases.csv | 1,500 | ✅ 완료 |
| Purchase | purchases.csv | 1,500 | ✅ 완료 |
| Staff | staff.csv | 15 | ✅ 완료 |
| Shift | shifts.csv | 90 | ✅ 완료 |
| WiFiSensor | wifi_sensors.csv | 24 | ✅ 완료 |

**커버리지**: 17/17 = **100%** ✅

### 5.2 HIGH 우선순위 엔티티 (12개) - 50% 커버

| 엔티티 | CSV 파일 | 레코드 수 | 상태 |
|--------|---------|----------|------|
| Weather | economic_indicators.csv | 0 | ❌ 미포함 |
| Holiday | holidays_events.csv | 30 | ✅ 완료 |
| EconomicIndicator | economic_indicators.csv | 90 | ✅ 완료 |
| Aisle | zones.csv (type=aisle) | 0 | ❌ 선택 |
| FittingRoom | zones.csv (type=fitting_room) | 3 | ✅ 완료 |
| StorageRoom | zones.csv (type=storage) | 3 | ✅ 완료 |
| Shelf | (3D 모델) | 0 | ❌ 3D 전용 |
| Rack | (3D 모델) | 0 | ❌ 3D 전용 |
| DisplayTable | (3D 모델) | 0 | ❌ 3D 전용 |
| Supplier | (선택) | 0 | ❌ 미포함 |
| Camera | (선택) | 0 | ❌ IoT 선택 |
| Beacon | (선택) | 0 | ❌ IoT 선택 |

**커버리지**: 6/12 = **50%** (필수는 모두 포함)

---

## 6. 데이터 업로드 순서

### ⚠️ 중요: 반드시 이 순서대로 업로드!

```
1단계: 기준 데이터 (관계 없음)
  1. stores.csv
  2. brands.csv

2단계: 제품 데이터 (Brand 참조)
  3. products.csv
  4. zones.csv
  5. inventory_levels.csv

3단계: 고객 및 활동 (Customer + Store + Product 참조)
  6. customers.csv
  7. visits.csv
  8. purchases.csv

4단계: 프로모션 및 직원 (Store + Product 참조)
  9. promotions.csv
  10. staff.csv
  11. shifts.csv

5단계: IoT 및 컨텍스트 (선택)
  12. wifi_sensors.csv
  13. wifi_tracking.csv
  14. economic_indicators.csv
  15. holidays_events.csv
```

### 업로드 전 체크리스트

- [ ] UTF-8 인코딩 (BOM 없음)
- [ ] 헤더 행 존재
- [ ] 쉼표(,) 구분자
- [ ] 날짜 형식 통일 (YYYY-MM-DD)
- [ ] 필수 컬럼 모두 값 존재
- [ ] FK 참조 정확 (brand_id, store_code, customer_id 등)
- [ ] 중복 ID 없음

---

## 7. 데이터 검증 체크리스트

### 7.1 업로드 전 검증

#### A. 파일 형식 검증
- [ ] 파일 확장자: .csv
- [ ] 인코딩: UTF-8 (BOM 없음)
- [ ] 줄바꿈: LF (Unix)
- [ ] 헤더 존재: 첫 줄
- [ ] 빈 행 없음

#### B. 데이터 타입 검증
- [ ] 날짜: YYYY-MM-DD
- [ ] 시간: HH:MM:SS
- [ ] 숫자: 쉼표 없음, 소수점은 점(.)
- [ ] 불리언: true/false (소문자)

#### C. 관계형 무결성 검증
- [ ] products.csv의 brand_id → brands.csv의 brand_id 존재
- [ ] inventory_levels.csv의 store_id → stores.csv의 store_code 존재
- [ ] inventory_levels.csv의 product_id → products.csv의 sku 존재
- [ ] visits.csv의 customer_id → customers.csv의 customer_id 존재
- [ ] visits.csv의 store_code → stores.csv의 store_code 존재
- [ ] purchases.csv의 visit_id → visits.csv의 visit_id 존재
- [ ] purchases.csv의 products_purchased → products.csv의 sku 존재 (쉼표 구분 각각)

#### D. 필수 필드 검증
- [ ] stores.csv: store_code, store_name, address, area_sqm 모두 값 존재
- [ ] products.csv: sku, product_name, category, brand_id, selling_price 모두 값 존재
- [ ] customers.csv: customer_id, customer_segment, signup_date 모두 값 존재
- [ ] visits.csv: visit_id, customer_id, store_code, visit_date, did_purchase 모두 값 존재
- [ ] purchases.csv: sale_id, visit_id, customer_id, store_code, total_amount 모두 값 존재

---

### 7.2 업로드 후 검증

#### A. Database 확인 (Supabase SQL Editor)

**1. 엔티티 생성 확인**
```sql
-- 각 데이터셋별 레코드 수 확인
SELECT 'stores' as table_name, COUNT(*) as count FROM stores
UNION ALL
SELECT 'brands', COUNT(*) FROM brands
UNION ALL
SELECT 'products', COUNT(*) FROM products
UNION ALL
SELECT 'inventory_levels', COUNT(*) FROM inventory_levels
UNION ALL
SELECT 'customers', COUNT(*) FROM customers
UNION ALL
SELECT 'visits', COUNT(*) FROM visits
UNION ALL
SELECT 'purchases', COUNT(*) FROM purchases;
```

**기대 결과**:
```
stores: 3
brands: 10
products: 100
inventory_levels: 300
customers: 500
visits: 3000
purchases: 1500
```

**2. 온톨로지 엔티티 생성 확인**
```sql
-- graph_entities 생성 확인
SELECT 
  et.name as entity_type,
  COUNT(ge.id) as entity_count
FROM ontology_entity_types et
LEFT JOIN graph_entities ge ON ge.entity_type_id = et.id
WHERE et.name IN ('Store', 'Brand', 'Product', 'Customer', 'Visit', 'Transaction', 'Staff')
GROUP BY et.name
ORDER BY entity_count DESC;
```

**기대 결과**:
```
Visit: 3000
Transaction: 1500
Customer: 500
Product: 100
Brand: 10
Store: 3
Staff: 15
```

**3. 관계 생성 확인**
```sql
-- graph_relations 생성 확인
SELECT 
  rt.name as relation_type,
  COUNT(gr.id) as relation_count
FROM ontology_relation_types rt
LEFT JOIN graph_relations gr ON gr.relation_type_id = rt.id
WHERE rt.name IN ('brand_has_products', 'visit_by_customer', 'sale_of', 'works_at')
GROUP BY rt.name
ORDER BY relation_count DESC;
```

**기대 결과**:
```
sale_of: ~3000 (제품별)
visit_by_customer: 3000
brand_has_products: 100
works_at: 15
```

**4. 데이터 무결성 확인**
```sql
-- FK 참조 무결성 확인 (orphan records 없는지)
SELECT 
  'products without brand' as issue,
  COUNT(*) as count
FROM products p
LEFT JOIN brands b ON p.brand_id = b.brand_id
WHERE b.brand_id IS NULL

UNION ALL

SELECT 
  'purchases without visit',
  COUNT(*)
FROM purchases pu
LEFT JOIN visits v ON pu.visit_id = v.visit_id
WHERE v.visit_id IS NULL

UNION ALL

SELECT 
  'visits without customer',
  COUNT(*)
FROM visits v
LEFT JOIN customers c ON v.customer_id = c.customer_id
WHERE c.customer_id IS NULL;
```

**기대 결과**: 모두 0 (orphan 없음)

---

#### B. 페이지별 기능 테스트

**1. DashboardPage 테스트**
- [ ] KPI 카드 4개 표시 (총 매출, 방문자, CVR, 평당매출)
- [ ] 트렌드 차트 표시 (일별/주별/월별)
- [ ] 매장 비교 차트 표시
- [ ] AI 추천 카드 표시 (anomaly detection)

**2. StoreAnalysisPage 테스트**
- [ ] Zone별 성과 표 표시
- [ ] 직원 효율성 차트 표시
- [ ] 프로모션 효과 비교 차트

**3. CustomerAnalysisPage 테스트**
- [ ] RFM 세그먼트 차트 표시
- [ ] LTV 예측 표 표시
- [ ] 이탈 위험 고객 목록

**4. ProductAnalysisPage 테스트**
- [ ] 제품 성과 랭킹 표시
- [ ] 교차 판매 추천 표시
- [ ] 재고 경고 목록

**5. DigitalTwin3DPage 테스트**
- [ ] 3D 매장 레이아웃 로드
- [ ] Zone 색상 코딩 표시
- [ ] WiFi 센서 위치 표시

**6. SimulationHubPage 테스트**
- [ ] 수요 예측 차트 생성
- [ ] 재고 최적화 추천
- [ ] 가격 최적화 시뮬레이션
- [ ] 프로모션 전략 추천

---

## 8. 샘플 데이터 예시

### 8.1 완전한 고객 여정 시나리오 (고객 C00001)

#### 1단계: 고객 프로필
```csv
# customers.csv
customer_id,name,age_group,gender,customer_segment,signup_date,loyalty_tier,lifetime_value,churn_risk_score
C00001,김민준,20-29,F,VIP,2023-03-15,gold,2500000,0.15
```

#### 2단계: 첫 번째 방문
```csv
# visits.csv
visit_id,customer_id,store_code,visit_date,visit_time,exit_time,duration_minutes,zones_visited,did_purchase
V0000001,C00001,ST001,2024-11-15,14:30:00,15:15:00,45,"ZONE-ST001-ENTRANCE,ZONE-ST001-TOP,ZONE-ST001-BTM,ZONE-ST001-CHECKOUT",true
```

#### 3단계: 구매 거래
```csv
# purchases.csv
sale_id,visit_id,customer_id,store_code,sale_date,sale_time,products_purchased,quantities,total_amount,discount_amount,payment_method,num_items
S0000001,V0000001,C00001,ST001,2024-11-15,15:10:00,"SKU-TOP-001,SKU-BTM-001","1,1",118000,0,card,2
```

#### 4단계: WiFi 추적 데이터 (간략)
```csv
# wifi_tracking.csv
tracking_id,sensor_id,mac_address_hash,timestamp,signal_strength,estimated_distance,position_x,position_y,store_code
TRK-000001,WS-ST001-001,hash_abc123,2024-11-15 14:30:15,-65,5.2,10.5,1.2,ST001
TRK-000002,WS-ST001-002,hash_abc123,2024-11-15 14:35:20,-58,3.5,10.2,5.8,ST001
TRK-000003,WS-ST001-003,hash_abc123,2024-11-15 14:42:10,-60,4.0,10.5,10.5,ST001
TRK-000004,WS-ST001-007,hash_abc123,2024-11-15 15:08:30,-55,2.8,10.3,15.2,ST001
```

#### 5단계: 두 번째 방문 (재방문)
```csv
# visits.csv
V0000005,C00001,ST001,2024-11-16,19:10:00,20:05:00,55,"ZONE-ST001-ENTRANCE,ZONE-ST001-OUT,ZONE-ST001-FITTING,ZONE-ST001-CHECKOUT",true

# purchases.csv
S0000003,V0000005,C00001,ST001,2024-11-16,20:00:00,"SKU-OUT-002,SKU-BAG-001","1,1",308000,0,card,2
```

**결과**: 
- 고객 C00001의 완전한 여정 추적 가능
- RFM 분석: Recency(최근), Frequency(2회), Monetary(426,000원)
- 온톨로지 관계: Customer → Visit → Transaction → Product

---

### 8.2 매장 성과 분석 시나리오 (ST001 강남 플래그십)

#### 매장 정보
```csv
# stores.csv
ST001,강남 플래그십,서울 강남구 테헤란로 123,450.0,2023-03-15,flagship,서울,강남역,김매니저,1200
```

#### Zone 구성 (8개)
```csv
# zones.csv
ZONE-ST001-ENTRANCE,ST001,entrance,메인 입구,30.0,10.0,0.0,0.0,customer_entry,high
ZONE-ST001-TOP,ST001,sales_floor,상의 구역,120.0,10.0,5.0,0.0,product_display,high
ZONE-ST001-BTM,ST001,sales_floor,하의 구역,100.0,10.0,10.0,0.0,product_display,medium
# ... (나머지 5개 Zone)
```

#### 직원 배치 (5명)
```csv
# staff.csv
EMP001,김매니저,ST001,manager,2023-03-15,full_time,25000,9.2,150
EMP002,이판매1,ST001,sales,2023-06-01,full_time,15000,8.5,120
EMP003,박판매2,ST001,sales,2023-06-01,full_time,15000,7.8,100
EMP004,최판매3,ST001,sales,2024-01-10,part_time,12000,6.5,80
EMP005,정재고,ST001,stockist,2023-08-15,full_time,13000,8.0,0
```

#### 재고 현황 (제품별)
```csv
# inventory_levels.csv
ST001,SKU-TOP-001,25,10,40,15,2024-11-25 09:00:00
ST001,SKU-TOP-002,32,12,45,18,2024-11-25 09:00:00
ST001,SKU-BTM-001,18,8,35,12,2024-11-25 09:00:00
ST001,SKU-BTM-002,8,10,38,14,2024-11-25 09:00:00  # ⚠️ 재고 부족
```

**분석 결과**:
- Zone별 성과: TOP Zone (120㎡, high traffic) vs BTM Zone (100㎡, medium traffic)
- 직원 효율성: 김매니저 (150건/월) vs 최판매3 (80건/월)
- 재고 경고: SKU-BTM-002 (현재 8 < 최소 10) ⬅️ AI 알림 트리거

---

## 9. 추가 참고 자료

### 9.1 관련 문서
- [CORRECTED_DATASET_STRUCTURE.md](./CORRECTED_DATASET_STRUCTURE.md) - 데이터셋 구조 가이드
- [REQUIRED_DATASETS_SPECIFICATION.md](./REQUIRED_DATASETS_SPECIFICATION.md) - 데이터셋 상세 명세
- [DEMO_DATASET_REQUIREMENTS.md](./DEMO_DATASET_REQUIREMENTS.md) - 데모용 데이터셋 요구사항
- [3D_MODEL_METADATA_CSV_GUIDE.md](./3D_MODEL_METADATA_CSV_GUIDE.md) - 3D 모델 메타데이터 가이드

### 9.2 데이터 생성 도구 (GPT 활용)
- [GPT_DATASET_GENERATION_GUIDE.md](./GPT_DATASET_GENERATION_GUIDE.md) - GPT로 데이터셋 생성하는 방법

### 9.3 검증 SQL 쿼리
- 모든 검증 쿼리는 위 "7.2 업로드 후 검증" 섹션 참조

---

## 10. 요약

### ✅ 필수 CSV 파일 (15개)

| 우선순위 | 파일명 | 레코드 수 | 크기 |
|---------|--------|----------|------|
| P1 | stores.csv | 3 | 1 KB |
| P1 | brands.csv | 10 | 2 KB |
| P1 | products.csv | 100 | 15 KB |
| P1 | inventory_levels.csv | 300 | 10 KB |
| P1 | customers.csv | 500 | 30 KB |
| P1 | visits.csv | 3,000 | 200 KB |
| P1 | purchases.csv | 1,500 | 80 KB |
| P2 | zones.csv | 24 | 3 KB |
| P2 | promotions.csv | 20 | 3 KB |
| P2 | staff.csv | 15 | 2 KB |
| P2 | shifts.csv | 90 | 5 KB |
| P3 | wifi_sensors.csv | 24 | 2 KB |
| P3 | wifi_tracking.csv | 15,000 | 1 MB |
| P3 | economic_indicators.csv | 90 | 5 KB |
| P3 | holidays_events.csv | 30 | 3 KB |

**총합**: 20,706건, ~1.4 MB

### ✅ 페이지별 테스트 커버리지

| 섹션 | 페이지 | 필요 데이터 | 커버리지 |
|------|--------|------------|---------|
| A | DashboardPage | stores, customers, visits, purchases | ✅ 100% |
| A | StoresPage | stores, zones, staff | ✅ 100% |
| A | HQCommunicationPage | stores, (Database) | ✅ 100% |
| A | SettingsPage | (Database) | ✅ 100% |
| B | StoreAnalysisPage | stores, zones, visits, purchases, staff | ✅ 100% |
| B | CustomerAnalysisPage | customers, visits, purchases | ✅ 100% |
| B | ProductAnalysisPage | products, purchases, inventory, brands | ✅ 100% |
| C | DigitalTwin3DPage | stores, zones, products, wifi_sensors | ✅ 100% |
| C | SimulationHubPage | products, inventory, purchases, visits | ✅ 100% |
| D | UnifiedDataManagementPage | (All CSV files) | ✅ 100% |
| D | SchemaBuilderPage | (Database) | ✅ 100% |
| D | APIIntegrationPage | (Database) | ✅ 100% |

**전체 커버리지**: **12/12 페이지 = 100%** ✅

---

**문서 끝**
