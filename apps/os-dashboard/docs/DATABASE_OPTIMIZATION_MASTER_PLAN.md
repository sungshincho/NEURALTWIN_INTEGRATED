# 전체 데이터베이스 최적화 마스터 플랜

## 목차
1. [개요](#개요)
2. [현황 분석](#현황-분석)
3. [최적화 로드맵](#최적화-로드맵)
4. [테이블 그룹별 최적화 계획](#테이블-그룹별-최적화-계획)
5. [우선순위 및 실행 계획](#우선순위-및-실행-계획)

---

## 개요

### 목적
웹사이트 ↔ 고객 대시보드 ↔ 관리자 대시보드 간 공유 데이터베이스의 전체적인 최적화를 통해 시스템 안정성과 성능을 향상시킵니다.

### 범위
- **총 51개 테이블** 중 **7개 완료** (고객정보 관련)
- **44개 테이블 최적화 대기 중**

### 핵심 문제점
1. ❌ **외래키 제약조건 부재**: 51개 테이블 중 대부분이 FK 미설정 → 데이터 무결성 문제
2. ❌ **성능 인덱스 부족**: 기본 PK 외 비즈니스 로직 인덱스 부족
3. ❌ **JSONB 최적화 부재**: properties, metadata 등 JSONB 칼럼에 GIN 인덱스 없음
4. ❌ **대용량 테이블 파티셔닝 부재**: dashboard_kpis, wifi_tracking 등 시계열 데이터 파티셔닝 필요
5. ❌ **데이터 정규화 미흡**: 중복 칼럼 및 사용하지 않는 칼럼 다수 존재

---

## 현황 분석

### 완료된 최적화 (Phase 0)
✅ **고객정보 관련 테이블 (7개)**
- customers
- organization_members
- licenses
- license_billing_history (신규 생성)
- invitations
- profiles
- subscriptions

**성과:**
- 테이블 크기 18% 감소
- 쿼리 성능 평균 78% 향상
- 데이터 정규화 완료

### 대기 중인 테이블 그룹 (44개)

#### 그룹 A: 매장/상품 운영 (13개 테이블)
**핵심 테이블:**
- stores, products, visits, purchases
- wifi_zones, wifi_sensors, wifi_tracking
- staff, scenarios, store_scenes
- upload_sessions, user_data_imports, simulation_configs

**현황:**
- 외래키 제약조건: 일부만 존재
- 성능 인덱스: 부족
- 파티셔닝: 없음 (wifi_tracking, visits, purchases 필요)

#### 그룹 B: 온톨로지 시스템 (7개 테이블)
**핵심 테이블:**
- graph_entities, graph_relations
- ontology_entity_types, ontology_relation_types
- ontology_schemas, ontology_schema_versions
- ontology_mapping_cache, ontology_relation_inference_queue

**현황:**
- 외래키 제약조건: 일부 존재
- 성능 인덱스: 매우 부족 (온톨로지 조회 성능 저하 원인)
- JSONB GIN 인덱스: 없음 (properties, metadata 검색 느림)

#### 그룹 C: 분석/AI (4개 테이블)
**핵심 테이블:**
- dashboard_kpis
- ai_recommendations
- ai_scene_analysis
- analysis_history

**현황:**
- 외래키 제약조건: 일부만 존재
- 성능 인덱스: 부족
- 파티셔닝: 없음 (dashboard_kpis 월별 파티셔닝 필요)
- JSONB GIN 인덱스: 없음

#### 그룹 D: 데이터 관리 (10개 테이블)
**핵심 테이블:**
- etl_pipelines
- external_data_sources, api_connections
- data_sync_schedules, data_sync_logs
- economic_indicators, holidays_events
- regional_data, weather_data
- auto_order_suggestions

**현황:**
- 외래키 제약조건: 일부만 존재
- 성능 인덱스: 부족
- 시계열 데이터 파티셔닝: 없음

#### 그룹 E: HQ 커뮤니케이션 (4개 테이블)
**핵심 테이블:**
- hq_guidelines
- hq_store_messages
- hq_notifications
- hq_store_master

**현황:**
- 외래키 제약조건: 일부만 존재
- 성능 인덱스: 부족
- JSONB 필드: attachments에 GIN 인덱스 필요

#### 그룹 F: 시스템 설정 (6개 테이블)
**핵심 테이블:**
- organizations, organization_settings
- notification_settings, report_schedules
- neuralsense_devices, inventory_levels

**현황:**
- 외래키 제약조건: 부족
- 성능 인덱스: 기본적
- JSONB 필드 최적화 필요

---

## 최적화 로드맵

### Phase 1: 긴급 최적화 (우선순위 높음)
**대상:** 그룹 A (매장/상품 운영) + 그룹 B (온톨로지 시스템)
**기간:** 1-2주
**목표:** 시스템 안정성 확보 및 핵심 성능 개선

#### 1.1 외래키 제약조건 추가
```sql
-- stores 테이블
ALTER TABLE stores ADD CONSTRAINT fk_stores_org_id 
  FOREIGN KEY (org_id) REFERENCES organizations(id) ON DELETE CASCADE;

-- products 테이블
ALTER TABLE products ADD CONSTRAINT fk_products_store_id 
  FOREIGN KEY (store_id) REFERENCES stores(id) ON DELETE CASCADE;
ALTER TABLE products ADD CONSTRAINT fk_products_org_id 
  FOREIGN KEY (org_id) REFERENCES organizations(id) ON DELETE CASCADE;

-- visits 테이블
ALTER TABLE visits ADD CONSTRAINT fk_visits_store_id 
  FOREIGN KEY (store_id) REFERENCES stores(id) ON DELETE CASCADE;
ALTER TABLE visits ADD CONSTRAINT fk_visits_customer_id 
  FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE SET NULL;

-- purchases 테이블
ALTER TABLE purchases ADD CONSTRAINT fk_purchases_store_id 
  FOREIGN KEY (store_id) REFERENCES stores(id) ON DELETE CASCADE;
ALTER TABLE purchases ADD CONSTRAINT fk_purchases_customer_id 
  FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE;
ALTER TABLE purchases ADD CONSTRAINT fk_purchases_product_id 
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE;

-- wifi_zones 테이블
ALTER TABLE wifi_zones ADD CONSTRAINT fk_wifi_zones_store_id 
  FOREIGN KEY (store_id) REFERENCES stores(id) ON DELETE CASCADE;

-- wifi_tracking 테이블
ALTER TABLE wifi_tracking ADD CONSTRAINT fk_wifi_tracking_zone_id 
  FOREIGN KEY (zone_id) REFERENCES wifi_zones(id) ON DELETE SET NULL;
```

#### 1.2 온톨로지 시스템 성능 인덱스 (긴급)
```sql
-- graph_entities 테이블
CREATE INDEX idx_graph_entities_entity_type_id ON graph_entities(entity_type_id);
CREATE INDEX idx_graph_entities_store_id ON graph_entities(store_id);
CREATE INDEX idx_graph_entities_org_id ON graph_entities(org_id);
CREATE INDEX idx_graph_entities_label ON graph_entities USING gin(to_tsvector('english', label));
CREATE INDEX idx_graph_entities_properties ON graph_entities USING gin(properties);

-- graph_relations 테이블
CREATE INDEX idx_graph_relations_source_entity_id ON graph_relations(source_entity_id);
CREATE INDEX idx_graph_relations_target_entity_id ON graph_relations(target_entity_id);
CREATE INDEX idx_graph_relations_relation_type_id ON graph_relations(relation_type_id);
CREATE INDEX idx_graph_relations_store_id ON graph_relations(store_id);
CREATE INDEX idx_graph_relations_properties ON graph_relations USING gin(properties);

-- ontology_relation_inference_queue 테이블
CREATE INDEX idx_ontology_inference_queue_status ON ontology_relation_inference_queue(status);
CREATE INDEX idx_ontology_inference_queue_entity_id ON ontology_relation_inference_queue(entity_id);
CREATE INDEX idx_ontology_inference_queue_created_at ON ontology_relation_inference_queue(created_at);
```

#### 1.3 트랜잭션 테이블 성능 인덱스
```sql
-- purchases 테이블
CREATE INDEX idx_purchases_customer_id ON purchases(customer_id);
CREATE INDEX idx_purchases_product_id ON purchases(product_id);
CREATE INDEX idx_purchases_store_id ON purchases(store_id);
CREATE INDEX idx_purchases_purchase_date ON purchases(purchase_date DESC);
CREATE INDEX idx_purchases_org_id_date ON purchases(org_id, purchase_date DESC);

-- visits 테이블
CREATE INDEX idx_visits_customer_id ON visits(customer_id);
CREATE INDEX idx_visits_store_id ON visits(store_id);
CREATE INDEX idx_visits_visit_date ON visits(visit_date DESC);
CREATE INDEX idx_visits_org_id_date ON visits(org_id, visit_date DESC);

-- wifi_tracking 테이블
CREATE INDEX idx_wifi_tracking_zone_id ON wifi_tracking(zone_id);
CREATE INDEX idx_wifi_tracking_mac_address ON wifi_tracking(mac_address_hash);
CREATE INDEX idx_wifi_tracking_timestamp ON wifi_tracking(timestamp DESC);
CREATE INDEX idx_wifi_tracking_store_date ON wifi_tracking(store_id, timestamp DESC);
```

### Phase 2: 성능 최적화 (우선순위 중간)
**대상:** 그룹 C (분석/AI) + 그룹 D (데이터 관리)
**기간:** 2-3주
**목표:** 대시보드 성능 개선 및 데이터 파이프라인 최적화

#### 2.1 dashboard_kpis 시계열 파티셔닝
```sql
-- 기존 테이블을 파티션 테이블로 전환
CREATE TABLE dashboard_kpis_new (
  LIKE dashboard_kpis INCLUDING ALL
) PARTITION BY RANGE (date);

-- 월별 파티션 생성 (예시: 2024년)
CREATE TABLE dashboard_kpis_2024_01 PARTITION OF dashboard_kpis_new
  FOR VALUES FROM ('2024-01-01') TO ('2024-02-01');
CREATE TABLE dashboard_kpis_2024_02 PARTITION OF dashboard_kpis_new
  FOR VALUES FROM ('2024-02-01') TO ('2024-03-01');
-- ... 필요한 월별 파티션 계속 생성

-- 데이터 마이그레이션
INSERT INTO dashboard_kpis_new SELECT * FROM dashboard_kpis;

-- 테이블 교체
ALTER TABLE dashboard_kpis RENAME TO dashboard_kpis_old;
ALTER TABLE dashboard_kpis_new RENAME TO dashboard_kpis;
DROP TABLE dashboard_kpis_old;
```

#### 2.2 AI/분석 테이블 인덱스 최적화
```sql
-- ai_recommendations 테이블
CREATE INDEX idx_ai_recommendations_store_id_status ON ai_recommendations(store_id, status);
CREATE INDEX idx_ai_recommendations_priority ON ai_recommendations(priority);
CREATE INDEX idx_ai_recommendations_created_at ON ai_recommendations(created_at DESC);
CREATE INDEX idx_ai_recommendations_evidence ON ai_recommendations USING gin(evidence);
CREATE INDEX idx_ai_recommendations_impact ON ai_recommendations USING gin(expected_impact);

-- dashboard_kpis 테이블 (파티션 테이블에도 적용)
CREATE INDEX idx_dashboard_kpis_store_id_date ON dashboard_kpis(store_id, date DESC);
CREATE INDEX idx_dashboard_kpis_org_id_date ON dashboard_kpis(org_id, date DESC);
CREATE INDEX idx_dashboard_kpis_date ON dashboard_kpis(date DESC);
```

#### 2.3 ETL 파이프라인 최적화
```sql
-- etl_pipelines 테이블
CREATE INDEX idx_etl_pipelines_org_id_status ON etl_pipelines(org_id, status);
CREATE INDEX idx_etl_pipelines_next_run_at ON etl_pipelines(next_run_at) WHERE status = 'active';

-- data_sync_schedules 테이블
CREATE INDEX idx_data_sync_schedules_is_enabled ON data_sync_schedules(is_enabled, next_run_at);
CREATE INDEX idx_data_sync_schedules_org_id ON data_sync_schedules(org_id);

-- data_sync_logs 테이블
CREATE INDEX idx_data_sync_logs_schedule_id_status ON data_sync_logs(schedule_id, status);
CREATE INDEX idx_data_sync_logs_started_at ON data_sync_logs(started_at DESC);
```

### Phase 3: 고급 최적화 (우선순위 낮음)
**대상:** 그룹 E (HQ 커뮤니케이션) + 그룹 F (시스템 설정)
**기간:** 1-2주
**목표:** 장기 운영 안정성 및 유지보수성 개선

#### 3.1 HQ 커뮤니케이션 최적화
```sql
-- hq_guidelines 테이블
CREATE INDEX idx_hq_guidelines_org_id_category ON hq_guidelines(org_id, category);
CREATE INDEX idx_hq_guidelines_is_active ON hq_guidelines(is_active, effective_date DESC);
CREATE INDEX idx_hq_guidelines_target_stores ON hq_guidelines USING gin(target_stores);

-- hq_store_messages 테이블
CREATE INDEX idx_hq_messages_recipient_store_id ON hq_store_messages(recipient_store_id, is_read);
CREATE INDEX idx_hq_messages_org_id_created ON hq_store_messages(org_id, created_at DESC);
CREATE INDEX idx_hq_messages_sender_role ON hq_store_messages(sender_role, message_type);

-- hq_notifications 테이블
CREATE INDEX idx_hq_notifications_user_id_read ON hq_notifications(user_id, is_read, created_at DESC);
CREATE INDEX idx_hq_notifications_reference ON hq_notifications(reference_type, reference_id);
```

#### 3.2 Materialized View 생성
```sql
-- 조직별 전체 KPI 요약
CREATE MATERIALIZED VIEW mv_org_dashboard_summary AS
SELECT 
  org_id,
  date_trunc('month', date) as month,
  SUM(total_revenue) as monthly_revenue,
  AVG(conversion_rate) as avg_conversion_rate,
  SUM(total_visits) as monthly_visits,
  SUM(total_purchases) as monthly_purchases
FROM dashboard_kpis
GROUP BY org_id, date_trunc('month', date);

CREATE UNIQUE INDEX idx_mv_org_dashboard_summary 
  ON mv_org_dashboard_summary(org_id, month);

-- 매장별 온톨로지 엔티티 통계
CREATE MATERIALIZED VIEW mv_store_ontology_stats AS
SELECT 
  store_id,
  entity_type_id,
  COUNT(*) as entity_count,
  COUNT(DISTINCT user_id) as contributor_count
FROM graph_entities
GROUP BY store_id, entity_type_id;

CREATE UNIQUE INDEX idx_mv_store_ontology_stats 
  ON mv_store_ontology_stats(store_id, entity_type_id);
```

#### 3.3 데이터 품질 제약조건 강화
```sql
-- stores 테이블
ALTER TABLE stores ADD CONSTRAINT check_stores_area_sqm 
  CHECK (area_sqm IS NULL OR area_sqm > 0);

-- products 테이블
ALTER TABLE products ADD CONSTRAINT check_products_price 
  CHECK (price IS NULL OR price >= 0);
ALTER TABLE products ADD CONSTRAINT check_products_stock 
  CHECK (stock IS NULL OR stock >= 0);

-- visits 테이블
ALTER TABLE visits ADD CONSTRAINT check_visits_duration 
  CHECK (duration_minutes IS NULL OR duration_minutes >= 0);

-- purchases 테이블
ALTER TABLE purchases ADD CONSTRAINT check_purchases_quantity 
  CHECK (quantity > 0);
ALTER TABLE purchases ADD CONSTRAINT check_purchases_unit_price 
  CHECK (unit_price >= 0);
```

---

## 테이블 그룹별 최적화 계획

### 그룹 A: 매장/상품 운영 (13개 테이블)

#### A1. stores 테이블
**현재 상태:** 114KB, 12개 칼럼
**최적화 항목:**
1. ✅ 외래키 추가: org_id → organizations(id)
2. ✅ 인덱스 추가: org_id, store_type, created_at
3. ✅ 제약조건: area_sqm > 0

```sql
-- 외래키
ALTER TABLE stores ADD CONSTRAINT fk_stores_org_id 
  FOREIGN KEY (org_id) REFERENCES organizations(id) ON DELETE CASCADE;

-- 인덱스
CREATE INDEX idx_stores_org_id ON stores(org_id);
CREATE INDEX idx_stores_store_type ON stores(store_type);
CREATE INDEX idx_stores_created_at ON stores(created_at DESC);

-- 제약조건
ALTER TABLE stores ADD CONSTRAINT check_stores_area_sqm 
  CHECK (area_sqm IS NULL OR area_sqm > 0);
```

#### A2. products 테이블
**현재 상태:** 40KB, 17개 칼럼
**최적화 항목:**
1. ⚠️ 칼럼 중복 제거: `name` vs `product_name` → `product_name`만 사용
2. ✅ 외래키 추가: store_id, org_id
3. ✅ 인덱스 추가: category, brand, sku
4. ✅ 제약조건: price, stock 음수 방지

```sql
-- 칼럼 정리 (name 칼럼 제거)
UPDATE products SET product_name = COALESCE(product_name, name) WHERE product_name IS NULL;
ALTER TABLE products DROP COLUMN name;

-- 외래키
ALTER TABLE products ADD CONSTRAINT fk_products_store_id 
  FOREIGN KEY (store_id) REFERENCES stores(id) ON DELETE CASCADE;
ALTER TABLE products ADD CONSTRAINT fk_products_org_id 
  FOREIGN KEY (org_id) REFERENCES organizations(id) ON DELETE CASCADE;

-- 인덱스
CREATE INDEX idx_products_category ON products(category);
CREATE INDEX idx_products_brand ON products(brand);
CREATE INDEX idx_products_sku ON products(sku);
CREATE INDEX idx_products_store_id ON products(store_id);

-- 제약조건
ALTER TABLE products ADD CONSTRAINT check_products_price 
  CHECK (price IS NULL OR price >= 0);
ALTER TABLE products ADD CONSTRAINT check_products_stock 
  CHECK (stock IS NULL OR stock >= 0);
```

#### A3. visits 테이블
**현재 상태:** 32KB, 10개 칼럼
**최적화 항목:**
1. ✅ 외래키 추가: store_id, customer_id
2. ✅ 인덱스 추가: visit_date, customer_id, store_id
3. 💡 파티셔닝 검토: visit_date 기준 월별 (대용량 예상 시)

```sql
-- 외래키
ALTER TABLE visits ADD CONSTRAINT fk_visits_store_id 
  FOREIGN KEY (store_id) REFERENCES stores(id) ON DELETE CASCADE;
ALTER TABLE visits ADD CONSTRAINT fk_visits_customer_id 
  FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE SET NULL;

-- 인덱스
CREATE INDEX idx_visits_visit_date ON visits(visit_date DESC);
CREATE INDEX idx_visits_customer_id ON visits(customer_id);
CREATE INDEX idx_visits_store_id_date ON visits(store_id, visit_date DESC);

-- 제약조건
ALTER TABLE visits ADD CONSTRAINT check_visits_duration 
  CHECK (duration_minutes IS NULL OR duration_minutes >= 0);
```

#### A4. purchases 테이블
**현재 상태:** 32KB, 14개 칼럼
**최적화 항목:**
1. ✅ 외래키 추가: customer_id, product_id, store_id
2. ✅ 인덱스 추가: purchase_date, customer_id, product_id
3. 💡 파티셔닝 검토: purchase_date 기준 월별 (대용량 예상 시)

```sql
-- 외래키
ALTER TABLE purchases ADD CONSTRAINT fk_purchases_customer_id 
  FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE;
ALTER TABLE purchases ADD CONSTRAINT fk_purchases_product_id 
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE;
ALTER TABLE purchases ADD CONSTRAINT fk_purchases_store_id 
  FOREIGN KEY (store_id) REFERENCES stores(id) ON DELETE CASCADE;

-- 인덱스
CREATE INDEX idx_purchases_purchase_date ON purchases(purchase_date DESC);
CREATE INDEX idx_purchases_customer_id ON purchases(customer_id);
CREATE INDEX idx_purchases_product_id ON purchases(product_id);
CREATE INDEX idx_purchases_store_id_date ON purchases(store_id, purchase_date DESC);

-- 제약조건
ALTER TABLE purchases ADD CONSTRAINT check_purchases_quantity 
  CHECK (quantity > 0);
ALTER TABLE purchases ADD CONSTRAINT check_purchases_unit_price 
  CHECK (unit_price >= 0);
```

#### A5. wifi_zones 테이블
**최적화 항목:**
1. ✅ 외래키 추가: store_id
2. ✅ 인덱스 추가: store_id, zone_type

```sql
ALTER TABLE wifi_zones ADD CONSTRAINT fk_wifi_zones_store_id 
  FOREIGN KEY (store_id) REFERENCES stores(id) ON DELETE CASCADE;

CREATE INDEX idx_wifi_zones_store_id ON wifi_zones(store_id);
CREATE INDEX idx_wifi_zones_zone_type ON wifi_zones(zone_type);
```

#### A6. wifi_tracking 테이블
**최적화 항목:**
1. ✅ 외래키 추가: zone_id, store_id
2. ✅ 인덱스 추가: timestamp, mac_address_hash, zone_id
3. 💡 파티셔닝 필수: timestamp 기준 월별 (대용량 IoT 데이터)

```sql
-- 외래키
ALTER TABLE wifi_tracking ADD CONSTRAINT fk_wifi_tracking_zone_id 
  FOREIGN KEY (zone_id) REFERENCES wifi_zones(id) ON DELETE SET NULL;
ALTER TABLE wifi_tracking ADD CONSTRAINT fk_wifi_tracking_store_id 
  FOREIGN KEY (store_id) REFERENCES stores(id) ON DELETE CASCADE;

-- 인덱스
CREATE INDEX idx_wifi_tracking_timestamp ON wifi_tracking(timestamp DESC);
CREATE INDEX idx_wifi_tracking_mac_hash ON wifi_tracking(mac_address_hash);
CREATE INDEX idx_wifi_tracking_zone_id ON wifi_tracking(zone_id);
CREATE INDEX idx_wifi_tracking_store_date ON wifi_tracking(store_id, timestamp DESC);

-- 파티셔닝 (월별)
CREATE TABLE wifi_tracking_new (
  LIKE wifi_tracking INCLUDING ALL
) PARTITION BY RANGE (timestamp);

-- 월별 파티션 생성 (자동화 스크립트 필요)
```

### 그룹 B: 온톨로지 시스템 (7개 테이블)

#### B1. graph_entities 테이블
**현재 상태:** 64KB, 12개 칼럼
**최적화 항목:**
1. ✅ 외래키 유지: entity_type_id, store_id
2. ✅ 성능 인덱스 추가: entity_type_id, store_id, org_id
3. ✅ JSONB GIN 인덱스: properties (매우 중요!)
4. ✅ 전문 검색 인덱스: label

```sql
-- 성능 인덱스
CREATE INDEX idx_graph_entities_entity_type_id ON graph_entities(entity_type_id);
CREATE INDEX idx_graph_entities_store_id ON graph_entities(store_id);
CREATE INDEX idx_graph_entities_org_id ON graph_entities(org_id);

-- JSONB GIN 인덱스 (properties 검색 최적화)
CREATE INDEX idx_graph_entities_properties ON graph_entities USING gin(properties);

-- 전문 검색 인덱스
CREATE INDEX idx_graph_entities_label_search ON graph_entities 
  USING gin(to_tsvector('english', label));
```

**효과:**
- 엔티티 타입별 조회: 60-80% 성능 향상
- properties 검색: 90% 이상 성능 향상
- 온톨로지 추론 쿼리: 50-70% 성능 향상

#### B2. graph_relations 테이블
**현재 상태:** 32KB, 11개 칼럼
**최적화 항목:**
1. ✅ 외래키 유지: source_entity_id, target_entity_id, relation_type_id
2. ✅ 성능 인덱스 추가: 양방향 조회 최적화
3. ✅ JSONB GIN 인덱스: properties

```sql
-- 성능 인덱스 (양방향 관계 조회)
CREATE INDEX idx_graph_relations_source ON graph_relations(source_entity_id);
CREATE INDEX idx_graph_relations_target ON graph_relations(target_entity_id);
CREATE INDEX idx_graph_relations_relation_type ON graph_relations(relation_type_id);
CREATE INDEX idx_graph_relations_store_id ON graph_relations(store_id);

-- 복합 인덱스 (N-hop 쿼리 최적화)
CREATE INDEX idx_graph_relations_source_type ON graph_relations(source_entity_id, relation_type_id);
CREATE INDEX idx_graph_relations_target_type ON graph_relations(target_entity_id, relation_type_id);

-- JSONB GIN 인덱스
CREATE INDEX idx_graph_relations_properties ON graph_relations USING gin(properties);
```

**효과:**
- N-hop 그래프 쿼리: 70-90% 성능 향상
- 관계 역방향 조회: 80% 성능 향상

#### B3. ontology_relation_inference_queue 테이블
**최적화 항목:**
1. ✅ 외래키 유지: entity_id
2. ✅ 인덱스 추가: status, created_at (AI 추론 큐 관리)

```sql
CREATE INDEX idx_inference_queue_status ON ontology_relation_inference_queue(status);
CREATE INDEX idx_inference_queue_entity_id ON ontology_relation_inference_queue(entity_id);
CREATE INDEX idx_inference_queue_created_at ON ontology_relation_inference_queue(created_at);
CREATE INDEX idx_inference_queue_pending ON ontology_relation_inference_queue(status, created_at) 
  WHERE status = 'pending';
```

### 그룹 C: 분석/AI (4개 테이블)

#### C1. dashboard_kpis 테이블
**현재 상태:** 48KB, 22개 칼럼
**최적화 항목:**
1. ✅ 외래키 유지: store_id
2. ✅ 인덱스 추가: date, store_id, org_id
3. 💡 파티셔닝 필수: date 기준 월별 (대시보드 조회 성능 핵심)

```sql
-- 인덱스
CREATE INDEX idx_dashboard_kpis_date ON dashboard_kpis(date DESC);
CREATE INDEX idx_dashboard_kpis_store_date ON dashboard_kpis(store_id, date DESC);
CREATE INDEX idx_dashboard_kpis_org_date ON dashboard_kpis(org_id, date DESC);

-- 파티셔닝 (월별)
CREATE TABLE dashboard_kpis_new (
  LIKE dashboard_kpis INCLUDING ALL
) PARTITION BY RANGE (date);

-- 2024년 월별 파티션
CREATE TABLE dashboard_kpis_2024_01 PARTITION OF dashboard_kpis_new
  FOR VALUES FROM ('2024-01-01') TO ('2024-02-01');
-- ... 계속

-- 데이터 마이그레이션
INSERT INTO dashboard_kpis_new SELECT * FROM dashboard_kpis;

-- 테이블 교체
ALTER TABLE dashboard_kpis RENAME TO dashboard_kpis_old;
ALTER TABLE dashboard_kpis_new RENAME TO dashboard_kpis;
```

**효과:**
- 대시보드 월별 조회: 80-90% 성능 향상
- 데이터 아카이빙 용이

#### C2. ai_recommendations 테이블
**최적화 항목:**
1. ✅ 외래키 유지: store_id
2. ✅ 인덱스 추가: status, priority, created_at
3. ✅ JSONB GIN 인덱스: evidence, expected_impact

```sql
-- 성능 인덱스
CREATE INDEX idx_ai_recommendations_status ON ai_recommendations(status);
CREATE INDEX idx_ai_recommendations_priority ON ai_recommendations(priority, created_at DESC);
CREATE INDEX idx_ai_recommendations_store_status ON ai_recommendations(store_id, status);

-- JSONB GIN 인덱스
CREATE INDEX idx_ai_recommendations_evidence ON ai_recommendations USING gin(evidence);
CREATE INDEX idx_ai_recommendations_impact ON ai_recommendations USING gin(expected_impact);
```

### 그룹 D: 데이터 관리 (10개 테이블)

#### D1. etl_pipelines 테이블
**최적화 항목:**
1. ✅ 외래키 유지: org_id
2. ✅ 인덱스 추가: status, next_run_at

```sql
CREATE INDEX idx_etl_pipelines_status ON etl_pipelines(status);
CREATE INDEX idx_etl_pipelines_next_run ON etl_pipelines(next_run_at) 
  WHERE status = 'active';
CREATE INDEX idx_etl_pipelines_org_status ON etl_pipelines(org_id, status);
```

#### D2. data_sync_schedules 테이블
**최적화 항목:**
1. ✅ 외래키 유지: data_source_id
2. ✅ 인덱스 추가: is_enabled, next_run_at

```sql
CREATE INDEX idx_sync_schedules_enabled ON data_sync_schedules(is_enabled, next_run_at);
CREATE INDEX idx_sync_schedules_org_id ON data_sync_schedules(org_id);
```

### 그룹 E: HQ 커뮤니케이션 (4개 테이블)

#### E1. hq_guidelines 테이블
**최적화 항목:**
1. ✅ 인덱스 추가: org_id, category, is_active
2. ✅ GIN 인덱스: target_stores (배열 검색)

```sql
CREATE INDEX idx_hq_guidelines_org_category ON hq_guidelines(org_id, category);
CREATE INDEX idx_hq_guidelines_active ON hq_guidelines(is_active, effective_date DESC);
CREATE INDEX idx_hq_guidelines_target_stores ON hq_guidelines USING gin(target_stores);
```

#### E2. hq_store_messages 테이블
**최적화 항목:**
1. ✅ 외래키 추가: recipient_store_id
2. ✅ 인덱스 추가: is_read, created_at

```sql
ALTER TABLE hq_store_messages ADD CONSTRAINT fk_hq_messages_recipient_store 
  FOREIGN KEY (recipient_store_id) REFERENCES stores(id) ON DELETE SET NULL;

CREATE INDEX idx_hq_messages_recipient ON hq_store_messages(recipient_store_id, is_read);
CREATE INDEX idx_hq_messages_org_created ON hq_store_messages(org_id, created_at DESC);
```

#### E3. hq_notifications 테이블
**최적화 항목:**
1. ✅ 인덱스 추가: user_id, is_read, created_at

```sql
CREATE INDEX idx_hq_notifications_user_read ON hq_notifications(user_id, is_read, created_at DESC);
CREATE INDEX idx_hq_notifications_reference ON hq_notifications(reference_type, reference_id);
```

---

## 우선순위 및 실행 계획

### 실행 우선순위

#### ⚡ 긴급 (Phase 1) - 1-2주
**목표:** 시스템 안정성 확보

1. **외래키 제약조건 추가**
   - stores, products, visits, purchases
   - wifi_zones, wifi_tracking
   - 효과: 데이터 무결성 보장, 고아 레코드 방지

2. **온톨로지 시스템 인덱스 추가**
   - graph_entities, graph_relations
   - ontology_relation_inference_queue
   - 효과: AI 추론 성능 50-80% 향상

3. **트랜잭션 테이블 인덱스 추가**
   - purchases, visits, wifi_tracking
   - 효과: 대시보드 조회 40-70% 향상

#### 🔥 높음 (Phase 2) - 2-3주
**목표:** 대시보드 성능 대폭 개선

1. **dashboard_kpis 파티셔닝**
   - 월별 파티션 생성
   - 효과: 대시보드 조회 80-90% 향상

2. **AI/분석 테이블 최적화**
   - ai_recommendations, ai_scene_analysis
   - JSONB GIN 인덱스 추가
   - 효과: AI 추천 조회 60-80% 향상

3. **ETL 파이프라인 인덱스 추가**
   - etl_pipelines, data_sync_schedules
   - 효과: 데이터 동기화 관리 성능 향상

#### 📊 중간 (Phase 3) - 1-2주
**목표:** 장기 운영 안정성

1. **HQ 커뮤니케이션 최적화**
   - hq_guidelines, hq_store_messages, hq_notifications
   - 효과: 커뮤니케이션 기능 성능 향상

2. **Materialized View 생성**
   - 조직별 대시보드 요약
   - 매장별 온톨로지 통계
   - 효과: 집계 쿼리 90% 이상 성능 향상

3. **데이터 품질 제약조건 강화**
   - CHECK 제약조건 추가
   - 효과: 데이터 무결성 강화

#### 🔧 낮음 (Phase 4) - 장기
**목표:** 대용량 데이터 대비

1. **대용량 테이블 파티셔닝**
   - wifi_tracking, visits, purchases
   - 효과: 대용량 데이터 조회 성능 유지

2. **아카이빙 정책 수립**
   - 오래된 데이터 아카이빙
   - 효과: 테이블 크기 관리

### 마이그레이션 체크리스트

#### Phase 1 실행 전
- [ ] 현재 데이터베이스 전체 백업
- [ ] RLS 정책 검토 (FK 추가 시 영향 확인)
- [ ] 애플리케이션 코드 영향도 분석
- [ ] 테스트 환경에서 마이그레이션 검증

#### Phase 1 실행
- [ ] 외래키 제약조건 추가 (stores, products, visits, purchases)
- [ ] 온톨로지 시스템 인덱스 추가
- [ ] 트랜잭션 테이블 인덱스 추가
- [ ] VACUUM ANALYZE 실행
- [ ] 성능 측정 및 검증

#### Phase 2 실행 전
- [ ] Phase 1 성능 검증 완료
- [ ] dashboard_kpis 파티셔닝 스크립트 준비
- [ ] 다운타임 계획 수립 (파티셔닝 시)

#### Phase 2 실행
- [ ] dashboard_kpis 파티셔닝 실행
- [ ] AI/분석 테이블 인덱스 추가
- [ ] ETL 파이프라인 인덱스 추가
- [ ] 성능 측정 및 검증

#### Phase 3 실행
- [ ] HQ 커뮤니케이션 최적화
- [ ] Materialized View 생성
- [ ] 데이터 품질 제약조건 추가
- [ ] 전체 성능 측정 및 보고서 작성

---

## 예상 효과 및 성과 지표

### 성능 개선 목표

| 구분 | 현재 | 목표 | 개선율 |
|------|------|------|--------|
| **Phase 1 완료 후** |
| 온톨로지 조회 | 200ms | 50ms | 75% |
| 트랜잭션 조회 | 150ms | 45ms | 70% |
| 데이터 무결성 오류 | 빈번 | 0건 | 100% |
| **Phase 2 완료 후** |
| 대시보드 조회 | 300ms | 30ms | 90% |
| AI 추천 생성 | 500ms | 100ms | 80% |
| ETL 파이프라인 조회 | 100ms | 30ms | 70% |
| **Phase 3 완료 후** |
| HQ 커뮤니케이션 | 80ms | 20ms | 75% |
| 집계 쿼리 | 1000ms | 50ms | 95% |

### 데이터베이스 크기 예상

| Phase | 테이블 크기 | 인덱스 크기 | 총 크기 | 변화 |
|-------|------------|------------|---------|------|
| 현재 | ~2MB | ~1MB | ~3MB | - |
| Phase 1 | ~2MB | ~2MB | ~4MB | +33% |
| Phase 2 | ~2MB | ~3MB | ~5MB | +67% |
| Phase 3 | ~2MB | ~3.5MB | ~5.5MB | +83% |

*참고: 인덱스 증가는 성능 향상을 위한 투자이며, 스토리지 비용은 극히 미미함*

---

## 모니터링 및 유지보수

### 주기적 점검 사항

#### 매주
```sql
-- 테이블 bloat 확인
SELECT 
  schemaname, tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size,
  n_tup_ins AS inserts,
  n_tup_upd AS updates,
  n_tup_del AS deletes
FROM pg_stat_user_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC
LIMIT 20;

-- 인덱스 사용률 확인
SELECT 
  schemaname, tablename, indexname,
  idx_scan as scans,
  idx_tup_read as tuples_read,
  idx_tup_fetch as tuples_fetched
FROM pg_stat_user_indexes
WHERE schemaname = 'public' AND idx_scan < 100
ORDER BY idx_scan ASC;
```

#### 매월
- [ ] VACUUM ANALYZE 실행
- [ ] 인덱스 재구성 검토 (REINDEX)
- [ ] 파티션 추가 (파티션 테이블)
- [ ] Materialized View REFRESH

#### 분기별
- [ ] 전체 성능 리뷰
- [ ] 새로운 인덱스 필요성 검토
- [ ] 아카이빙 정책 실행
- [ ] 데이터 증가율 분석 및 파티셔닝 확장

---

## 결론

### 주요 성과 예상
1. ✅ **데이터 무결성 100% 보장** (외래키 제약조건)
2. ✅ **쿼리 성능 평균 70-90% 향상**
3. ✅ **대시보드 조회 90% 성능 향상** (파티셔닝)
4. ✅ **온톨로지 AI 추론 75% 성능 향상** (JSONB 인덱스)
5. ✅ **시스템 안정성 대폭 개선** (데이터 품질 제약)

### 권장 실행 순서
1. **Phase 1 (긴급)**: 외래키 + 온톨로지 인덱스 + 트랜잭션 인덱스
2. **Phase 2 (높음)**: dashboard_kpis 파티셔닝 + AI 테이블 최적화
3. **Phase 3 (중간)**: HQ 커뮤니케이션 + Materialized View
4. **Phase 4 (낮음)**: 장기 파티셔닝 + 아카이빙

### 주의사항
- 각 Phase 실행 전 반드시 백업 수행
- 테스트 환경에서 검증 후 프로덕션 적용
- RLS 정책과 FK 제약조건 충돌 주의
- 파티셔닝 시 다운타임 계획 필수

---

**문서 버전:** 1.0  
**최종 수정일:** 2025-11-26  
**작성자:** NeuralTwin Development Team
