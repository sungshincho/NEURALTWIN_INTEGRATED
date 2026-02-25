# NEURALTWIN 올바른 데이터셋 구조 가이드

> 최종 업데이트: 2025-11-21  
> 목적: 에러 없이 완벽한 데이터 업로드를 위한 상세 가이드

---

## 📋 목차

1. [핵심 원칙](#핵심-원칙)
2. [업로드 순서](#업로드-순서)
3. [데이터셋별 상세 형식](#데이터셋별-상세-형식)
4. [관계 생성 규칙](#관계-생성-규칙)
5. [검증 체크리스트](#검증-체크리스트)

---

## 🎯 핵심 원칙

### 1. **ID 필드의 일관성**
- 모든 엔티티는 고유 ID를 가져야 합니다
- **참조 관계가 있는 경우, 반드시 참조 대상이 먼저 업로드되어야 합니다**
- ID 값은 대소문자를 구분하며, 정확히 일치해야 합니다

### 2. **필수 vs 선택 필드**
- `required: true` 필드는 반드시 값이 있어야 합니다 (빈 문자열 불가)
- `required: false` 필드는 비워둘 수 있습니다

### 3. **데이터 타입 준수**
- `string`: 텍스트 값
- `integer` / `number`: 숫자 값 (따옴표 없이)
- `boolean`: true/false (따옴표 없이)
- `array`: 쉼표로 구분된 값들 (예: "A,B,C" 또는 JSON 배열 형식)

### 4. **날짜/시간 형식**
- 날짜: `YYYY-MM-DD` (예: 2024-01-15)
- 시간: `YYYY-MM-DD HH:mm:ss` (예: 2024-01-15 14:30:00)
- 또는 ISO 8601: `2024-01-15T14:30:00Z`

---

## 📦 업로드 순서

**중요: 반드시 이 순서대로 업로드해야 합니다!**

```
1단계 (기준 데이터 - 관계 없음)
├─ stores.csv          # 매장 기본 정보
└─ brand_master.csv    # 브랜드 마스터

2단계 (제품 관련)
├─ products.csv        # 제품 (Brand 참조)
└─ inventory_levels.csv # 재고 (Product + Store 참조)

3단계 (고객 및 활동)
├─ customers.csv       # 고객
├─ visits.csv          # 방문 (Customer + Store 참조)
├─ purchases.csv       # 구매 (Customer + Product + Visit 참조)
└─ zones.csv           # 매장 구역 (Store 참조)

4단계 (프로모션)
└─ promotions.csv      # 프로모션 (Product + Store 참조)

5단계 (기타)
├─ staff.csv           # 직원 (Store 참조)
├─ wifi_sensors.csv    # WiFi 센서 (Store 참조)
├─ wifi_tracking.csv   # WiFi 추적 데이터
└─ economic_indicators.csv # 경제 지표
```

---

## 📊 데이터셋별 상세 형식

### 1️⃣ stores.csv

**엔티티 타입**: `Store`

**필수 컬럼**:
```csv
store_code,name,location
```

**전체 컬럼** (선택 포함):
```csv
store_code,name,location,area_sqm,opening_date,daily_traffic,floor_plan_url,ceiling_height
```

**예시 데이터**:
```csv
store_code,name,location,area_sqm,opening_date,daily_traffic
STORE_001,강남 플래그십,서울 강남구 테헤란로 123,450.5,2023-03-15,1200
STORE_002,홍대점,서울 마포구 어울마당로 456,320.0,2023-06-01,800
```

**주의사항**:
- `store_code`: 고유 식별자, 중복 불가
- `name`: 매장명
- `location`: 주소 (상세할수록 좋음)
- `area_sqm`: 숫자만 입력 (단위 제외)
- `opening_date`: YYYY-MM-DD 형식
- `daily_traffic`: 일일 평균 방문객 수 (숫자)

---

### 2️⃣ brand_master.csv

**엔티티 타입**: `Brand`

**필수 컬럼**:
```csv
brand_id
```

**전체 컬럼** (선택 포함):
```csv
brand_id,brand_name,brand_type,country,launch_year,positioning,target_gender,target_age_group
```

**예시 데이터**:
```csv
brand_id,brand_name,brand_type,country,launch_year,positioning,target_gender,target_age_group
BRAND_2030YC,NEURALTWIN 2030 영캐주얼,fashion_apparel,KR,2023,young_contemporary_casual,F,20-35
BRAND_PREMIUM,프리미엄 라인,fashion_apparel,KR,2020,luxury_contemporary,unisex,30-50
BRAND_BASIC,베이직 라인,fashion_apparel,KR,2022,affordable_casual,unisex,18-40
```

**주의사항**:
- `brand_id`: **절대로 중복되면 안 됨**, 영문+숫자 조합 권장 (예: BRAND_ABC123)
- `brand_name`: 브랜드 표시 이름
- `brand_type`: 브랜드 유형 (fashion_apparel, accessories, footwear 등)
- `country`: 국가 코드 (KR, US, JP 등)
- `launch_year`: 출시 연도 (숫자만)
- `positioning`: 포지셔닝 (luxury, premium, mid_tier, affordable 등)
- `target_gender`: M, F, unisex
- `target_age_group`: 연령대 (예: 20-35)

---

### 3️⃣ products.csv

**엔티티 타입**: `Product`

**필수 컬럼**:
```csv
sku,name,price
```

**전체 컬럼** (선택 포함):
```csv
sku,name,category,price,cost,margin_rate,brand_id,package_type,display_priority
```

**예시 데이터**:
```csv
sku,name,category,price,cost,margin_rate,brand_id,package_type,display_priority
SKU_001,슬림핏 청바지,Denim,89000,45000,49.4,BRAND_2030YC,hanger,1
SKU_002,오버핏 티셔츠,Top,39000,18000,53.8,BRAND_2030YC,folded,2
SKU_003,레더 재킷,Outerwear,259000,130000,49.8,BRAND_PREMIUM,hanger,1
```

**주의사항**:
- `sku`: 제품 고유 코드, 중복 불가
- `name`: 제품명
- `price`: 판매가 (숫자만, 쉼표 없이)
- `cost`: 원가 (선택)
- `margin_rate`: 마진율 % (선택, 예: 49.4)
- **`brand_id`**: 🔴 **반드시 brand_master.csv의 brand_id와 정확히 일치해야 함**
  - 이 필드가 있으면 자동으로 `brand_has_products` 관계가 생성됩니다
  - 대소문자 구분하므로 정확히 입력해야 합니다
- `package_type`: 포장 유형 (hanger, folded, boxed 등)
- `display_priority`: 진열 우선순위 (1=높음)

---

### 4️⃣ inventory_levels.csv

**엔티티 타입**: `InventoryLevel`

**필수 컬럼**:
```csv
store_id,product_id,current_stock,minimum_stock,optimal_stock
```

**전체 컬럼**:
```csv
store_id,product_id,current_stock,minimum_stock,optimal_stock,weekly_demand
```

**예시 데이터**:
```csv
store_id,product_id,current_stock,minimum_stock,optimal_stock,weekly_demand
STORE_001,SKU_001,45,20,60,12
STORE_001,SKU_002,30,15,50,8
STORE_002,SKU_001,25,20,60,10
```

**주의사항**:
- `store_id`: stores.csv의 store_code와 일치
- `product_id`: products.csv의 sku와 일치
- 모든 재고 수량은 정수 (0 이상)
- `weekly_demand`: 주간 판매 예상량 (선택)

**관계 생성**:
- `inventory_of_product`: InventoryLevel → Product
- `inventory_at_store`: InventoryLevel → Store

---

### 5️⃣ customers.csv

**엔티티 타입**: `Customer`

**필수 컬럼**:
```csv
customer_id
```

**전체 컬럼**:
```csv
customer_id,name,segment,loyalty_level,lifetime_value,churn_risk_score
```

**예시 데이터**:
```csv
customer_id,name,segment,loyalty_level,lifetime_value,churn_risk_score
CUST_001,김민준,VIP,gold,2500000,0.15
CUST_002,이서연,regular,silver,850000,0.35
CUST_003,박지훈,new,bronze,125000,0.60
```

**주의사항**:
- `customer_id`: 고유 식별자 (CUST_001 형식 권장)
- `segment`: VIP, regular, new, at_risk 등
- `loyalty_level`: gold, silver, bronze 등
- `lifetime_value`: 고객 생애 가치 (숫자)
- `churn_risk_score`: 이탈 위험도 0.0 ~ 1.0

---

### 6️⃣ visits.csv

**엔티티 타입**: `Visit`

**필수 컬럼**:
```csv
visit_id,entry_time,customer_id,store_id
```

**전체 컬럼**:
```csv
visit_id,entry_time,exit_time,dwell_time_minutes,zones_visited,converted_to_sale,customer_id,store_id
```

**예시 데이터**:
```csv
visit_id,entry_time,exit_time,dwell_time_minutes,zones_visited,converted_to_sale,customer_id,store_id
VISIT_001,2024-01-15 10:30:00,2024-01-15 11:15:00,45,"ZONE_ENTRANCE,ZONE_DENIM,ZONE_CHECKOUT",true,CUST_001,STORE_001
VISIT_002,2024-01-15 11:00:00,2024-01-15 11:20:00,20,"ZONE_ENTRANCE,ZONE_TOP",false,CUST_002,STORE_001
```

**주의사항**:
- `visit_id`: 고유 방문 ID
- `entry_time`, `exit_time`: YYYY-MM-DD HH:mm:ss 형식
- `dwell_time_minutes`: 체류 시간 (분, 숫자)
- `zones_visited`: 쉼표로 구분된 구역 코드들
- `converted_to_sale`: true/false (구매 전환 여부)
- **`customer_id`**: customers.csv의 customer_id와 일치
- **`store_id`**: stores.csv의 store_code와 일치

**관계 생성**:
- `visit_by_customer`: Visit → Customer
- `visit_to_store`: Visit → Store

---

### 7️⃣ purchases.csv (또는 sales.csv)

**엔티티 타입**: `Sale` 또는 `Purchase`

**필수 컬럼**:
```csv
transaction_id,amount,timestamp,product_id,customer_id,store_id
```

**전체 컬럼**:
```csv
transaction_id,amount,timestamp,payment_method,discount_applied,profit,product_id,customer_id,store_id,visit_id
```

**예시 데이터**:
```csv
transaction_id,amount,timestamp,payment_method,discount_applied,profit,product_id,customer_id,store_id,visit_id
TXN_001,89000,2024-01-15 11:10:00,card,0,44000,SKU_001,CUST_001,STORE_001,VISIT_001
TXN_002,39000,2024-01-15 11:12:00,card,3900,17100,SKU_002,CUST_001,STORE_001,VISIT_001
```

**주의사항**:
- `transaction_id`: 거래 고유 ID
- `amount`: 결제 금액 (숫자만)
- `timestamp`: 거래 시간
- `payment_method`: card, cash, mobile 등
- `discount_applied`: 할인 금액 (숫자)
- `profit`: 순이익 (숫자)
- **`product_id`**: products.csv의 sku와 일치
- **`customer_id`**: customers.csv의 customer_id와 일치
- **`store_id`**: stores.csv의 store_code와 일치
- **`visit_id`**: visits.csv의 visit_id와 일치 (선택)

**관계 생성**:
- `sale_of`: Sale → Product
- `made_by`: Sale → Customer
- `occurred_at`: Sale → Store

---

### 8️⃣ zones.csv

**엔티티 타입**: `Zone`

**필수 컬럼**:
```csv
zone_code,zone_type,store_id
```

**전체 컬럼**:
```csv
zone_code,zone_type,area_sqm,foot_traffic_capacity,lighting_level,temperature,store_id
```

**예시 데이터**:
```csv
zone_code,zone_type,area_sqm,foot_traffic_capacity,lighting_level,temperature,store_id
ZONE_ENTRANCE,entrance,35.0,100,800,22.0,STORE_001
ZONE_DENIM,display,85.5,50,650,21.5,STORE_001
ZONE_TOP,display,72.0,45,650,21.5,STORE_001
ZONE_CHECKOUT,checkout,28.0,80,750,22.0,STORE_001
ZONE_FITTING,fitting,18.5,15,500,23.0,STORE_001
```

**주의사항**:
- `zone_code`: 구역 고유 코드
- `zone_type`: entrance, display, checkout, fitting, storage, aisle 등
- `area_sqm`: 면적 (제곱미터, 숫자)
- `foot_traffic_capacity`: 수용 가능 인원 (숫자)
- `lighting_level`: 조도 (lux, 숫자)
- `temperature`: 온도 (섭씨, 숫자)
- **`store_id`**: stores.csv의 store_code와 일치

**관계 생성**:
- `contains`: Store → Zone

---

### 9️⃣ promotions.csv

**엔티티 타입**: `Promotion`

**필수 컬럼**:
```csv
promotion_id,name,start_date,end_date
```

**전체 컬럼**:
```csv
promotion_id,name,discount_rate,start_date,end_date,effectiveness_score,roi,product_id,store_id
```

**예시 데이터**:
```csv
promotion_id,name,discount_rate,start_date,end_date,effectiveness_score,roi,product_id,store_id
PROMO_SUMMER,썸머 세일,20.0,2024-06-01,2024-08-31,8.5,250.0,SKU_001,STORE_001
PROMO_FALL,가을맞이 할인,15.0,2024-09-01,2024-10-31,7.8,180.0,SKU_002,STORE_001
```

**주의사항**:
- `promotion_id`: 프로모션 고유 ID
- `discount_rate`: 할인율 % (숫자만)
- `start_date`, `end_date`: YYYY-MM-DD 형식
- `effectiveness_score`: 효과성 점수 (0-10)
- `roi`: 투자 대비 수익률 % (숫자)
- **`product_id`**: products.csv의 sku와 일치 (선택)
- **`store_id`**: stores.csv의 store_code와 일치 (선택)

**관계 생성**:
- `promotes_product`: Promotion → Product
- `runs_at_store`: Promotion → Store

---

### 🔟 staff.csv

**엔티티 타입**: `Staff`

**필수 컬럼**:
```csv
staff_id,name,store_id
```

**전체 컬럼**:
```csv
staff_id,name,role,employment_type,hourly_rate,performance_score,store_id
```

**예시 데이터**:
```csv
staff_id,name,role,employment_type,hourly_rate,performance_score,store_id
STAFF_001,김매니저,store_manager,full_time,25000,9.2,STORE_001
STAFF_002,이판매,sales_associate,full_time,12000,8.5,STORE_001
STAFF_003,박알바,sales_associate,part_time,10000,7.8,STORE_001
```

**주의사항**:
- `staff_id`: 직원 고유 ID
- `role`: 역할 (store_manager, sales_associate, cashier, stock_clerk 등)
- `employment_type`: full_time, part_time, contract
- `hourly_rate`: 시급 (숫자)
- `performance_score`: 성과 점수 (0-10)
- **`store_id`**: stores.csv의 store_code와 일치

**관계 생성**:
- `works_at`: Staff → Store

---

### 1️⃣1️⃣ wifi_sensors.csv

**엔티티 타입**: `Sensor`

**필수 컬럼**:
```csv
sensor_id,store_id
```

**전체 컬럼**:
```csv
sensor_id,sensor_type,mac_address,ip_address,coverage_radius_m,location_x,location_z,store_id
```

**예시 데이터**:
```csv
sensor_id,sensor_type,mac_address,ip_address,coverage_radius_m,location_x,location_z,store_id
SENSOR_01,wifi_probe,AA:BB:CC:DD:EE:01,192.168.1.101,15.0,5.0,3.0,STORE_001
SENSOR_02,wifi_probe,AA:BB:CC:DD:EE:02,192.168.1.102,15.0,15.0,3.0,STORE_001
```

**주의사항**:
- `sensor_id`: 센서 고유 ID
- `sensor_type`: wifi_probe, bluetooth, camera 등
- `mac_address`: MAC 주소 형식 (AA:BB:CC:DD:EE:FF)
- `coverage_radius_m`: 커버리지 반경 (미터, 숫자)
- `location_x`, `location_z`: 매장 내 3D 좌표 (숫자)
- **`store_id`**: stores.csv의 store_code와 일치

**관계 생성**:
- `installed_in_store`: Sensor → Store

---

### 1️⃣2️⃣ wifi_tracking.csv

**특수 데이터**: WiFi 추적 raw 데이터 (graph_entities로 변환되지 않음)

**필수 컬럼**:
```csv
session_id,timestamp,x,z,store_id
```

**전체 컬럼**:
```csv
session_id,timestamp,x,z,accuracy,status,store_id
```

**예시 데이터**:
```csv
session_id,timestamp,x,z,accuracy,status,store_id
SESSION_001,2024-01-15 10:30:15,5.2,3.1,0.8,active,STORE_001
SESSION_001,2024-01-15 10:30:45,6.8,4.5,0.9,active,STORE_001
SESSION_001,2024-01-15 10:31:15,8.3,5.2,0.85,active,STORE_001
```

**주의사항**:
- `session_id`: 고객 세션 ID (MAC 주소 기반 익명화)
- `timestamp`: YYYY-MM-DD HH:mm:ss 형식
- `x`, `z`: 매장 내 좌표 (미터, 소수점 가능)
- `accuracy`: 위치 정확도 (0.0 ~ 1.0)
- `status`: active, exited 등
- **`store_id`**: stores.csv의 store_code와 일치

---

### 1️⃣3️⃣ economic_indicators.csv

**엔티티 타입**: `EconomicIndicator`

**필수 컬럼**:
```csv
date,indicator_type,region,indicator_value
```

**전체 컬럼**:
```csv
date,indicator_type,region,indicator_value,unit
```

**예시 데이터**:
```csv
date,indicator_type,region,indicator_value,unit
2024-01-01,cpi,Seoul,110.5,index
2024-01-01,unemployment_rate,Seoul,3.2,percent
2024-01-01,consumer_confidence,Seoul,102.8,index
```

**주의사항**:
- `date`: YYYY-MM-DD 형식
- `indicator_type`: cpi, unemployment_rate, consumer_confidence, retail_sales_growth 등
- `region`: 지역명 (Seoul, Busan 등)
- `indicator_value`: 지표 값 (숫자)
- `unit`: 단위 (index, percent, krw 등)

---

## 🔗 관계 생성 규칙

### 자동 관계 매핑이 작동하는 조건

1. **Brand → Product 관계 (`brand_has_products`)**
   - products.csv에 `brand_id` 컬럼이 있어야 함
   - `brand_id` 값이 brand_master.csv의 `brand_id`와 정확히 일치해야 함
   - ✅ 예시: `BRAND_2030YC` (대소문자 정확히)

2. **InventoryLevel → Product 관계 (`inventory_of_product`)**
   - inventory_levels.csv에 `product_id` 컬럼이 있어야 함
   - `product_id` 값이 products.csv의 `sku`와 일치해야 함

3. **InventoryLevel → Store 관계 (`inventory_at_store`)**
   - inventory_levels.csv에 `store_id` 컬럼이 있어야 함
   - `store_id` 값이 stores.csv의 `store_code`와 일치해야 함

4. **Visit → Customer 관계 (`visit_by_customer`)**
   - visits.csv에 `customer_id` 컬럼이 있어야 함
   - `customer_id` 값이 customers.csv의 `customer_id`와 일치해야 함

5. **Sale → Product/Customer/Store 관계**
   - purchases.csv에 `product_id`, `customer_id`, `store_id` 컬럼이 있어야 함
   - 각각 해당 CSV의 ID와 일치해야 함

---

## ✅ 검증 체크리스트

### 업로드 전 체크

- [ ] 모든 CSV 파일이 UTF-8 인코딩인가?
- [ ] 첫 줄이 헤더 (컬럼명)인가?
- [ ] 필수 컬럼이 모두 있는가?
- [ ] 날짜/시간 형식이 올바른가?
- [ ] 참조 ID들이 정확히 일치하는가?
- [ ] 숫자 필드에 쉼표(,)나 단위가 없는가?
- [ ] boolean 필드가 true/false인가? (TRUE/FALSE 아님)

### 업로드 순서 체크

1. [ ] stores.csv 먼저 업로드
2. [ ] brand_master.csv 업로드
3. [ ] products.csv 업로드 (brand_id 포함)
4. [ ] inventory_levels.csv 업로드 (product_id, store_id 포함)
5. [ ] customers.csv 업로드
6. [ ] visits.csv 업로드 (customer_id, store_id 포함)
7. [ ] purchases.csv 업로드 (product_id, customer_id, store_id 포함)
8. [ ] 나머지 파일들 업로드

### 업로드 후 검증

업로드가 완료되면 다음을 확인:

```sql
-- 1. 엔티티 개수 확인
SELECT oet.name, COUNT(ge.id) as count
FROM ontology_entity_types oet
LEFT JOIN graph_entities ge ON ge.entity_type_id = oet.id
GROUP BY oet.name
ORDER BY count DESC;

-- 2. 관계 개수 확인
SELECT ort.name, COUNT(gr.id) as count
FROM ontology_relation_types ort
LEFT JOIN graph_relations gr ON gr.relation_type_id = ort.id
GROUP BY ort.name
ORDER BY count DESC;

-- 3. Product-Brand 관계 확인 (예시)
SELECT COUNT(*) as product_brand_count
FROM graph_relations gr
JOIN ontology_relation_types ort ON gr.relation_type_id = ort.id
WHERE ort.name = 'brand_has_products';
```

기대 결과:
- `brand_has_products` 관계 수 = products.csv의 행 수 (brand_id가 있는 경우)
- `inventory_of_product` 관계 수 = inventory_levels.csv의 행 수
- `visit_by_customer` 관계 수 = visits.csv의 행 수

---

## 🚨 흔한 에러와 해결법

### 1. "Missing entity for relation" 경고

**원인**: 참조하는 엔티티를 찾을 수 없음

**해결**:
- 참조 대상 파일을 먼저 업로드했는지 확인
- ID 값이 정확히 일치하는지 확인 (대소문자, 공백 주의)
- 예: `BRAND_2030YC` ≠ `brand_2030yc` ≠ `BRAND_2030YC ` (끝 공백)

### 2. "0 entities created" 에러

**원인**: 
- 필수 컬럼이 없음
- 데이터 형식이 잘못됨
- 인코딩 문제 (한글 깨짐)

**해결**:
- CSV를 UTF-8로 저장했는지 확인
- 필수 컬럼명이 정확한지 확인
- 빈 행이 없는지 확인

### 3. "Duplicate entities" 경고

**원인**: 같은 파일을 여러 번 업로드함

**해결**:
- Data Import History에서 이전 업로드를 삭제
- 또는 중복 엔티티를 수동으로 정리

### 4. 관계가 생성되지 않음

**원인**:
- 관계 컬럼(brand_id, product_id 등)이 CSV에 없음
- ID 값이 일치하지 않음
- 참조 대상이 아직 업로드되지 않음

**해결**:
- CSV에 관계 컬럼을 추가
- ID 값을 정확히 일치시킴
- 업로드 순서를 지킴

---

## 📝 완전한 예시 데이터셋

### stores.csv (1개 매장)
```csv
store_code,name,location,area_sqm,opening_date
STORE_001,강남 플래그십,서울 강남구 테헤란로 123,450.5,2023-03-15
```

### brand_master.csv (1개 브랜드)
```csv
brand_id,brand_name,brand_type,country,launch_year,positioning,target_gender,target_age_group
BRAND_2030YC,NEURALTWIN 2030 영캐주얼,fashion_apparel,KR,2023,young_contemporary_casual,F,20-35
```

### products.csv (3개 제품)
```csv
sku,name,category,price,cost,margin_rate,brand_id
SKU_001,슬림핏 청바지,Denim,89000,45000,49.4,BRAND_2030YC
SKU_002,오버핏 티셔츠,Top,39000,18000,53.8,BRAND_2030YC
SKU_003,크롭 가디건,Knit,69000,32000,53.6,BRAND_2030YC
```

### inventory_levels.csv (3개 재고)
```csv
store_id,product_id,current_stock,minimum_stock,optimal_stock,weekly_demand
STORE_001,SKU_001,45,20,60,12
STORE_001,SKU_002,30,15,50,8
STORE_001,SKU_003,52,25,70,15
```

### customers.csv (2명 고객)
```csv
customer_id,name,segment,loyalty_level,lifetime_value
CUST_001,김민준,VIP,gold,2500000
CUST_002,이서연,regular,silver,850000
```

### visits.csv (2번 방문)
```csv
visit_id,entry_time,exit_time,dwell_time_minutes,converted_to_sale,customer_id,store_id
VISIT_001,2024-01-15 10:30:00,2024-01-15 11:15:00,45,true,CUST_001,STORE_001
VISIT_002,2024-01-15 11:00:00,2024-01-15 11:20:00,20,false,CUST_002,STORE_001
```

### purchases.csv (2개 구매)
```csv
transaction_id,amount,timestamp,payment_method,product_id,customer_id,store_id,visit_id
TXN_001,89000,2024-01-15 11:10:00,card,SKU_001,CUST_001,STORE_001,VISIT_001
TXN_002,39000,2024-01-15 11:12:00,card,SKU_002,CUST_001,STORE_001,VISIT_001
```

### zones.csv (5개 구역)
```csv
zone_code,zone_type,area_sqm,store_id
ZONE_ENTRANCE,entrance,35.0,STORE_001
ZONE_DENIM,display,85.5,STORE_001
ZONE_TOP,display,72.0,STORE_001
ZONE_CHECKOUT,checkout,28.0,STORE_001
ZONE_FITTING,fitting,18.5,STORE_001
```

---

## 🎯 최종 권장사항

1. **작은 규모로 시작**
   - 1개 매장, 1개 브랜드, 5-10개 제품으로 먼저 테스트
   - 모든 관계가 제대로 생성되는지 확인
   - 문제없으면 데이터를 확장

2. **ID 일관성 유지**
   - 모든 ID는 영문+숫자 조합 사용
   - 일관된 prefix 사용 (STORE_, BRAND_, SKU_, CUST_ 등)
   - 절대 특수문자 사용 안 함

3. **관계 검증 필수**
   - 각 파일 업로드 후 관계 개수 확인
   - 예상 개수와 일치하지 않으면 즉시 확인

4. **데이터 정리 후 재시작**
   - 현재 중복/오류 데이터가 많으면
   - Data Import History에서 모두 삭제
   - 처음부터 순서대로 깨끗하게 업로드

---

## 📞 문제 발생 시

데이터 업로드 후 다음 명령으로 검증 요청:

```
"전체 데이터 확인해줘"
```

AI가 자동으로:
- 엔티티 개수
- 관계 개수  
- 누락된 관계
를 확인하고 알려드립니다.
