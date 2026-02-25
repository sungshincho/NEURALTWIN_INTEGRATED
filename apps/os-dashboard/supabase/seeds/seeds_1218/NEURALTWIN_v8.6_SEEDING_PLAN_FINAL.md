# NEURALTWIN v8.6 전체 시딩 스크립트 계획 (수정본)

> **검토 결과 반영 (2024-12-18)**
> - 누락 테이블 5개 추가
> - 테이블명 불일치 수정
> - 신규 테이블 생성 목록 확정

---

## 📊 스키마 검증 결과

### ✅ 스키마에 존재하는 테이블 (기존 계획 누락)
| 테이블명 | 컬럼수 | FK 의존 | 비고 |
|----------|--------|---------|------|
| `strategy_daily_metrics` | 7 | strategy_id → applied_strategies.id | 🆕 추가 필요 |
| `strategy_feedback` | 21 | strategy_id → applied_strategies.id | 🆕 추가 필요 |
| `ai_inference_results` | 10 | store_id | 🆕 추가 필요 |

### ❌ 스키마에 미존재 → SEED_00에서 생성 필요
| 테이블명 | 용도 | 생성 여부 |
|----------|------|-----------|
| `product_models` | display_type별 3D 모델 URL | ✅ 생성 |
| `furniture_slots` | 가구 슬롯 정의 | ✅ 생성 |
| `product_placements` | 3D 스튜디오 상품 배치 | ✅ 생성 |
| `zone_transitions` | 존 간 이동 데이터 | ⚠️ 선택적 생성 |
| `layout_optimization_results` | 레이아웃 최적화 결과 | ⚠️ 선택적 생성 |

### 🔧 테이블명 수정
| 계획서 (잘못됨) | 실제 테이블명 |
|-----------------|---------------|
| ontology_types | `ontology_entity_types` + `ontology_relation_types` |
| ontology_mappings | `ontology_entity_mappings` + `ontology_relation_mappings` |

---

## 📁 스크립트 구성 (7개 파일)

---

### 📄 SEED_00_SCHEMA_UPDATES.sql
> 신규 테이블 생성 (STEP 0.1 ~ 0.5)

| Step | 테이블 | 컬럼 | FK |
|------|--------|------|-----|
| 0.1 | `product_models` | product_id, display_type, model_3d_url, is_default | products.id |
| 0.2 | `furniture_slots` | furniture_id, slot_id, slot_type, slot_position, compatible_display_types[], is_occupied | furniture.id |
| 0.3 | `product_placements` | slot_id, product_id, display_type, placed_at, is_active | furniture_slots.id, products.id |
| 0.4 | `zone_transitions` (선택) | from_zone_id, to_zone_id, transition_count, avg_duration | zones_dim.id |
| 0.5 | 인덱스/RLS 설정 | | |

**DDL 상세:**

```sql
-- 0.1 product_models
CREATE TABLE IF NOT EXISTS product_models (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  display_type TEXT NOT NULL CHECK (display_type IN ('hanging','standing','folded','stacked','located','boxed')),
  model_3d_url TEXT NOT NULL,
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(product_id, display_type)
);

-- 0.2 furniture_slots
CREATE TABLE IF NOT EXISTS furniture_slots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  furniture_id UUID NOT NULL REFERENCES furniture(id) ON DELETE CASCADE,
  store_id UUID NOT NULL REFERENCES stores(id),
  user_id UUID NOT NULL,
  slot_id TEXT NOT NULL,
  furniture_type TEXT NOT NULL,
  slot_type TEXT NOT NULL,
  slot_position JSONB DEFAULT '{"x":0,"y":0,"z":0}',
  slot_rotation JSONB DEFAULT '{"x":0,"y":0,"z":0}',
  compatible_display_types TEXT[] DEFAULT '{}',
  max_product_width NUMERIC,
  max_product_height NUMERIC,
  max_product_depth NUMERIC,
  is_occupied BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(furniture_id, slot_id)
);

-- 0.3 product_placements
CREATE TABLE IF NOT EXISTS product_placements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slot_id UUID NOT NULL REFERENCES furniture_slots(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  store_id UUID NOT NULL REFERENCES stores(id),
  user_id UUID NOT NULL,
  display_type TEXT NOT NULL,
  position_offset JSONB DEFAULT '{"x":0,"y":0,"z":0}',
  rotation_offset JSONB DEFAULT '{"x":0,"y":0,"z":0}',
  scale JSONB DEFAULT '{"x":1,"y":1,"z":1}',
  quantity INTEGER DEFAULT 1,
  is_active BOOLEAN DEFAULT true,
  placed_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(slot_id, product_id)
);

-- 0.4 zone_transitions (선택적)
CREATE TABLE IF NOT EXISTS zone_transitions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES stores(id),
  from_zone_id UUID NOT NULL REFERENCES zones_dim(id),
  to_zone_id UUID NOT NULL REFERENCES zones_dim(id),
  transition_date DATE NOT NULL,
  transition_count INTEGER DEFAULT 0,
  avg_duration_seconds INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(store_id, from_zone_id, to_zone_id, transition_date)
);
```

---

### 📄 SEED_01_CLEANUP.sql
> 기존 데이터 삭제 - FK 역순 (STEP 1.1 ~ 1.42)

```sql
-- ════════════════════════════════════════════════════════════════════════════
-- Level 6: AI/전략 파생 데이터 (가장 먼저 삭제)
-- ════════════════════════════════════════════════════════════════════════════
1.1   strategy_daily_metrics     -- 🆕 strategy_id → applied_strategies.id
1.2   strategy_feedback          -- 🆕 strategy_id → applied_strategies.id
1.3   applied_strategies         -- store_id → stores.id
1.4   ai_inference_results       -- 🆕 store_id → stores.id
1.5   ai_inference_logs          -- store_id → stores.id
1.6   ai_recommendations         -- store_id → stores.id
1.7   ai_insights                -- store_id → stores.id
1.8   roi_measurements           -- org_id → organizations.id
1.9   recommendation_applications -- store_id → stores.id

-- ════════════════════════════════════════════════════════════════════════════
-- Level 5: 그래프/온톨로지 인스턴스 (매핑은 삭제, 타입은 유지)
-- ════════════════════════════════════════════════════════════════════════════
1.10  graph_relations            -- source/target_entity_id → graph_entities.id
1.11  graph_entities             -- entity_type_id → ontology_entity_types.id
1.12  ontology_relation_mappings -- target_relation_type_id → ontology_relation_types.id
1.13  ontology_entity_mappings   -- target_entity_type_id → ontology_entity_types.id
1.14  ontology_mapping_cache     -- 캐시 데이터
1.15  ontology_relation_inference_queue -- 큐 데이터
1.16  data_source_tables         -- data_source_id → data_sources.id

-- ════════════════════════════════════════════════════════════════════════════
-- Level 5: 집계 데이터
-- ════════════════════════════════════════════════════════════════════════════
1.17  customer_segments_agg      -- store_id → stores.id
1.18  product_performance_agg    -- store_id, product_id
1.19  zone_daily_metrics         -- store_id, zone_id
1.20  zone_performance           -- store_id
1.21  zone_metrics               -- store_id
1.22  hourly_metrics             -- store_id
1.23  daily_sales                -- store_id
1.24  daily_kpis_agg             -- store_id
1.25  kpi_snapshots              -- store_id

-- ════════════════════════════════════════════════════════════════════════════
-- Level 4: 이벤트/트랜잭션
-- ════════════════════════════════════════════════════════════════════════════
1.26  zone_events                -- store_id, zone_id
1.27  visit_zone_events          -- store_id, visit_id, zone_id
1.28  funnel_events              -- store_id, customer_id
1.29  funnel_metrics             -- store_id
1.30  line_items                 -- store_id, purchase_id, product_id
1.31  transactions               -- store_id, visit_id
1.32  purchases                  -- store_id, customer_id, visit_id
1.33  store_visits               -- store_id, customer_id

-- ════════════════════════════════════════════════════════════════════════════
-- Level 3: 3D 스튜디오 데이터 (🆕 신규 테이블)
-- ════════════════════════════════════════════════════════════════════════════
1.34  product_placements         -- 🆕 slot_id → furniture_slots.id
1.35  zone_transitions           -- 🆕 from/to_zone_id → zones_dim.id

-- ════════════════════════════════════════════════════════════════════════════
-- Level 3: 가구/상품
-- ════════════════════════════════════════════════════════════════════════════
1.36  product_models             -- 🆕 product_id → products.id
1.37  inventory_levels           -- product_id → products.id
1.38  inventory                  -- product_id → products.id
1.39  furniture_slots            -- 🆕 furniture_id → furniture.id
1.40  products                   -- store_id → stores.id
1.41  furniture                  -- store_id, zone_id

-- ════════════════════════════════════════════════════════════════════════════
-- Level 2: 기본 엔티티
-- ════════════════════════════════════════════════════════════════════════════
1.42  shift_schedules            -- staff_id → staff.id
1.43  staff_assignments          -- staff_id → staff.id
1.44  staff                      -- store_id → stores.id
1.45  customer_segments          -- store_id → stores.id
1.46  customers                  -- store_id → stores.id
1.47  store_scenes               -- store_id → stores.id
1.48  store_goals                -- store_id → stores.id
1.49  data_sources               -- store_id → stores.id
1.50  retail_concepts            -- store_id (nullable)
1.51  retail_concept_values      -- concept_id → retail_concepts.id

-- ════════════════════════════════════════════════════════════════════════════
-- Level 1: zones_dim (furniture 의존)
-- ════════════════════════════════════════════════════════════════════════════
1.52  zones_dim                  -- store_id → stores.id

-- ════════════════════════════════════════════════════════════════════════════
-- Level 0: 마스터 온톨로지 (🚫 삭제하지 않음!)
-- ════════════════════════════════════════════════════════════════════════════
-- ❌ ontology_entity_types      -- 마스터 유지
-- ❌ ontology_relation_types    -- 마스터 유지
-- ❌ ontology_schemas           -- 마스터 유지
-- ❌ ontology_schema_versions   -- 마스터 유지
-- ❌ stores                     -- 기준 데이터 유지
-- ❌ organizations              -- 기준 데이터 유지
```

---

### 📄 SEED_02_MASTER.sql
> 마스터/기준 데이터 (STEP 2.1 ~ 3.4)

| Step | 테이블 | 건수 | 비고 |
|------|--------|------|------|
| 2.1 | zones_dim | 7 | Z001~Z007 |
| 2.2 | retail_concepts | 12 | 리테일 개념 |
| 2.3 | data_sources | 5 | POS, WiFi 등 |
| 3.1 | customers | 2,500 | VIP 250, Regular 1250, New 750, Dormant 250 |
| 3.2 | staff | 8 | EMP001~EMP008 |
| 3.3 | store_goals | 6 | 매출, 전환율, 방문 목표 |
| 3.4 | store_scenes | 2 | As-Is, To-Be |

---

### 📄 SEED_03_FURNITURE_PRODUCTS.sql
> 가구/상품 데이터 (STEP 4.1 ~ 6.2)

| Step | 테이블 | 건수 | 비고 |
|------|--------|------|------|
| 4.1 | furniture | 68 | 7개 존 분배 |
| 4.2 | furniture_slots | 176 | 34개 가구에 슬롯 |
| 5.1 | products | 25 | 아우터5, 상의5, 하의4, 신발3, 기타8 |
| 5.2 | product_models | 60 | display_type별 GLB URL |
| 5.3 | inventory_levels | 25 | 재고 레벨 |
| 6.1 | product_placements | 25+ | 초기 상품 배치 |
| 6.2 | furniture_slots.is_occupied 업데이트 | - | 점유 상태 |

---

### 📄 SEED_04_TRANSACTIONS.sql
> 트랜잭션 데이터 (STEP 7.1 ~ 9.3)

| Step | 테이블 | 건수 | 비고 |
|------|--------|------|------|
| 7.1 | store_visits | ~7,500 | 90일 × ~83/일 |
| 7.2 | purchases | ~3,750 | 방문의 50% |
| 8.1 | transactions | ~3,750 | 구매당 1건 |
| 8.2 | line_items | ~7,500 | 거래당 평균 2개 |
| 9.1 | funnel_events | ~22,500 | 방문당 3개 이벤트 |
| 9.2 | zone_events | ~30,000 | 방문당 4개 존 |
| 9.3 | visit_zone_events | ~15,000 | 방문-존 상세 |
| 9.4 | zone_transitions | ~1,500 | 90일 × ~17 패턴 |

---

### 📄 SEED_05_GRAPH_AI.sql
> 그래프/AI 데이터 (STEP 10.1 ~ 12.4)

| Step | 테이블 | 건수 | 비고 |
|------|--------|------|------|
| 10.1 | graph_entities | ~120 | ontology_entity_types 참조 |
| 10.2 | graph_relations | ~200 | ontology_relation_types 참조 |
| 11.1 | data_source_tables | 15 | data_sources 참조 |
| 11.2 | ontology_entity_mappings | 30 | 선택적 |
| 12.1 | applied_strategies | 10 | 적용된 전략 |
| 12.2 | strategy_daily_metrics | 90 | 🆕 전략별 일별 |
| 12.3 | strategy_feedback | 10 | 🆕 피드백 |
| 12.4 | ai_recommendations | 20 | AI 추천 |
| 12.5 | ai_inference_results | 10 | 🆕 추론 결과 |

---

### 📄 SEED_06_AGGREGATES.sql
> 집계 데이터 + 검증 (STEP 13.1 ~ 15.2)

| Step | 테이블 | 건수 | 비고 |
|------|--------|------|------|
| 13.1 | daily_kpis_agg | 90 | 90일 KPI |
| 13.2 | daily_sales | 90 | 90일 매출 |
| 13.3 | hourly_metrics | 1,080 | 90일 × 12시간 |
| 14.1 | zone_daily_metrics | 630 | 90일 × 7존 |
| 14.2 | product_performance_agg | 2,250 | 90일 × 25상품 |
| 14.3 | customer_segments_agg | 360 | 90일 × 4세그먼트 |
| 15.1 | 전체 검증 쿼리 | - | FK 무결성, 카운트 |
| 15.2 | Confidence Score | - | 85%+ 목표 |

---

## 📊 총 STEP 수

| 파일 | STEP 수 |
|------|---------|
| SEED_00 | 5 |
| SEED_01 | 52 |
| SEED_02 | 7 |
| SEED_03 | 7 |
| SEED_04 | 8 |
| SEED_05 | 9 |
| SEED_06 | 8 |
| **합계** | **96** |

---

## ⚠️ 핵심 체크리스트

| 항목 | 상태 | 조치 |
|------|------|------|
| strategy_daily_metrics 삭제/시딩 | ✅ 추가 | SEED_01, SEED_05 |
| strategy_feedback 삭제/시딩 | ✅ 추가 | SEED_01, SEED_05 |
| ai_inference_results 삭제/시딩 | ✅ 추가 | SEED_01, SEED_05 |
| product_placements 생성/시딩 | ✅ 추가 | SEED_00, SEED_03 |
| furniture_slots 생성/시딩 | ✅ 추가 | SEED_00, SEED_03 |
| product_models 생성/시딩 | ✅ 추가 | SEED_00, SEED_03 |
| zone_transitions 생성/시딩 | ✅ 추가 | SEED_00, SEED_04 |
| ontology 테이블명 수정 | ✅ 수정 | entity_types, relation_types |
| 마스터 온톨로지 유지 | ✅ 확인 | 삭제하지 않음 |

---

## 📋 실행 순서

```bash
# 1. 신규 테이블 생성
psql -f SEED_00_SCHEMA_UPDATES.sql

# 2. 기존 데이터 삭제 (52개 테이블)
psql -f SEED_01_CLEANUP.sql

# 3. 마스터 데이터 (2,550건)
psql -f SEED_02_MASTER.sql

# 4. 가구/상품 (350건)
psql -f SEED_03_FURNITURE_PRODUCTS.sql

# 5. 트랜잭션 (87,000건)
psql -f SEED_04_TRANSACTIONS.sql

# 6. 그래프/AI (500건)
psql -f SEED_05_GRAPH_AI.sql

# 7. 집계 + 검증 (4,500건)
psql -f SEED_06_AGGREGATES.sql
```

---

## 🎯 예상 총 레코드

| 카테고리 | 레코드 수 |
|----------|-----------|
| 마스터/기준 | ~2,550 |
| 가구/상품/배치 | ~400 |
| 트랜잭션/이벤트 | ~87,000 |
| 그래프/AI | ~500 |
| 집계 | ~4,500 |
| **합계** | **~95,000** |

---

이 계획대로 진행해도 될까요?
