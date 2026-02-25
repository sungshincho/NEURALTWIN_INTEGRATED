# 온톨로지 통합 아키텍처 완전 구현

## 전체 아키텍처

```
┌─────────────────────────────────────────────────────────────────┐
│                      데이터 소스 레이어                           │
├─────────────────────────────────────────────────────────────────┤
│  CSV 파일  │  API 연동  │  수동 입력  │  IoT 센서  │  3D 모델   │
└──────┬──────────┬──────────┬──────────┬───────────┬─────────────┘
       │          │          │          │           │
       └──────────┴──────────┴──────────┴───────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│                   데이터 파이프라인 레이어                        │
├─────────────────────────────────────────────────────────────────┤
│  Phase 1: 배치 변환                                              │
│  - integrated-data-pipeline (CSV → 온톨로지)                     │
│  - sync-api-data (API → 온톨로지)                               │
│  - smart-ontology-mapping (AI 매핑)                             │
│  - schema-etl (엔티티/관계 생성)                                │
├─────────────────────────────────────────────────────────────────┤
│  Phase 2: 실시간 동기화                                          │
│  - Database 트리거 (자동 엔티티 생성)                            │
│  - AI 관계 추론 (비동기 큐)                                      │
└─────────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│                     온톨로지 스토리지 레이어                      │
├─────────────────────────────────────────────────────────────────┤
│  - ontology_entity_types (43개 타입)                            │
│  - ontology_relation_types (89개 타입)                          │
│  - graph_entities (수천-수만 엔티티)                            │
│  - graph_relations (수만-수십만 관계)                           │
└─────────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│                      AI 추론 엔진 레이어                          │
├─────────────────────────────────────────────────────────────────┤
│  Phase 3 (예정): 온톨로지 기반 고급 분석                         │
│  - 추천 시스템                                                   │
│  - 이상 탐지                                                     │
│  - 패턴 분석                                                     │
│  - 예측 모델링                                                   │
└─────────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│                    애플리케이션 레이어                            │
├─────────────────────────────────────────────────────────────────┤
│  - 대시보드 (KPI, 분석, 시각화)                                 │
│  - 디지털 트윈 3D (3D 모델 + 온톨로지)                          │
│  - 시뮬레이션 (온톨로지 기반 예측)                              │
│  - 데이터 관리 (스키마 빌더, 임포트)                            │
└─────────────────────────────────────────────────────────────────┘
```

## Phase별 구현 상태

### ✅ Phase 1: 데이터 파이프라인 통합 (완료)

#### CSV → 온톨로지
- **Edge Function**: `integrated-data-pipeline`
- **프로세스**:
  1. CSV 파일 업로드
  2. 데이터 검증 (`validate-and-fix-csv`)
  3. AI 기반 매핑 (`smart-ontology-mapping`)
  4. ETL 실행 (`schema-etl`)
- **결과**: 완벽한 자동화

#### API → 온톨로지
- **Edge Function**: `sync-api-data`
- **프로세스**:
  1. API 데이터 수집
  2. 일반 테이블 저장
  3. `convert_to_ontology` 옵션 활성화 시
  4. `integrated-data-pipeline` 호출
- **결과**: 완벽한 자동화

#### 필드 매핑 UI
- **위치**: `/data-management/api`
- **기능**:
  - API 응답 미리보기
  - 필드 매핑 설정
  - 온톨로지 변환 옵션
  - 엔티티 타입 선택
- **결과**: 사용자 친화적 인터페이스

### ✅ Phase 2: 실시간 동기화 (완료)

#### Database 트리거
| 테이블 | 트리거 함수 | 엔티티 타입 | 동작 |
|--------|------------|------------|------|
| `customers` | `sync_customer_to_ontology()` | Customer | INSERT/UPDATE → 엔티티 생성/업데이트 |
| `products` | `sync_product_to_ontology()` | Product | INSERT/UPDATE → 엔티티 생성/업데이트 |
| `purchases` | `sync_purchase_to_ontology()` | Purchase | INSERT → 엔티티 + 관계 생성 |
| `stores` | `sync_store_to_ontology()` | Store | INSERT/UPDATE → 엔티티 생성/업데이트 |

#### 관계 추론 시스템
- **큐 테이블**: `ontology_relation_inference_queue`
- **트리거**: 새 엔티티 생성 시 큐에 자동 추가
- **Edge Function**: `infer-entity-relations`
  - AI(Gemini 2.5 Flash) 기반 관계 분석
  - 신뢰도 점수 기반 필터링 (≥ 0.6)
  - 배치 처리 (기본 10개씩)
- **스케줄러**: `ontology-inference-scheduler`
  - Cron Job으로 주기적 실행
  - 큐 상태 모니터링

### ⏳ Phase 3: AI 추론 엔진 (예정)
- 온톨로지 기반 추천 시스템
- 이상 탐지 (Anomaly Detection)
- 패턴 분석 및 시각화
- 예측 모델링

## 데이터 플로우 상세

### 1. 배치 임포트 플로우 (Phase 1)
```
사용자 업로드 (CSV/API)
  ↓
user_data_imports 생성
  ↓
validate-and-fix-csv (데이터 품질 검증)
  ↓
smart-ontology-mapping (AI 매핑)
  ↓
schema-etl (엔티티/관계 생성)
  ↓
graph_entities + graph_relations
```

### 2. 실시간 동기화 플로우 (Phase 2)
```
데이터 INSERT/UPDATE (customers, products, etc.)
  ↓
Database Trigger 자동 실행
  ↓
graph_entities 생성/업데이트 (즉시)
  ↓
ontology_relation_inference_queue 추가 (비동기)
  ↓
Cron Job (매 5분)
  ↓
ontology-inference-scheduler
  ↓
infer-entity-relations (AI 추론)
  ↓
graph_relations 생성 (신뢰도 기반)
```

## 기술 스택

### Backend
- **Database**: Supabase PostgreSQL
- **Triggers**: PL/pgSQL 함수
- **Edge Functions**: Deno + TypeScript
- **Cron Jobs**: pg_cron

### AI & ML
- **AI Gateway**: Lovable AI
- **Model**: Google Gemini 2.5 Flash
- **Technique**: Tool Calling (Structured Output)

### Frontend
- **Framework**: React + TypeScript
- **Query**: TanStack React Query
- **UI**: Shadcn UI + Tailwind CSS

## 데이터베이스 스키마

### 핵심 테이블
```sql
-- 온톨로지 정의
ontology_entity_types (43개 타입 정의)
ontology_relation_types (89개 관계 정의)

-- 온톨로지 인스턴스
graph_entities (실제 엔티티 데이터)
graph_relations (실제 관계 데이터)

-- 메타데이터
user_data_imports (임포트 이력)
ontology_mapping_cache (AI 매핑 캐시)
ontology_relation_inference_queue (관계 추론 큐)
```

### 데이터 소스 테이블
```sql
customers, products, purchases, visits, stores,
inventory_levels, wifi_tracking, wifi_zones
```

## 성능 지표

### 목표
- **엔티티 생성**: < 100ms (트리거)
- **관계 추론**: < 30초/엔티티 (AI)
- **배치 처리**: 10-20 엔티티/분
- **신뢰도**: > 0.6 (60% 이상)

### 모니터링
- 큐 크기 추적
- 처리 속도 측정
- 실패율 모니터링
- AI 비용 추적

## 확장성

### 수평 확장
- 배치 크기 증가 (최대 50)
- Cron Job 주기 단축 (최소 1분)
- 병렬 처리 (여러 스케줄러)

### 수직 확장
- AI 모델 업그레이드 (Flash → Pro)
- 더 큰 컨텍스트 (100 → 500 엔티티)
- 고급 프롬프트 엔지니어링

## 비용 최적화

### Lovable AI 사용량 관리
1. **신뢰도 임계값 조정**: 0.6 → 0.7 (요청 감소)
2. **배치 크기 최적화**: 불필요하게 크지 않게
3. **캐싱 활용**: 동일 패턴 재사용
4. **모델 선택**: Flash (빠르고 저렴) vs Pro (정확하지만 비쌈)

### Database 리소스
- **인덱스 최적화**: 큐 테이블 인덱스
- **정기 정리**: 완료된 큐 항목 삭제
- **파티셔닝**: 대용량 시 테이블 파티셔닝

## 보안

### RLS 정책
```sql
-- ontology_relation_inference_queue
"Users can view their inference queue" (SELECT)
"Service role can manage inference queue" (ALL)
```

### Edge Function 인증
```toml
[functions.infer-entity-relations]
verify_jwt = false  # Service role 사용

[functions.ontology-inference-scheduler]
verify_jwt = false  # Cron에서 호출
```

## 활용 사례

### 1. 고객 세그멘테이션
```
Customer 엔티티 생성
  ↓
AI가 유사 고객 발견
  ↓
'similar_to' 관계 생성
  ↓
세그먼트별 마케팅 전략
```

### 2. 제품 추천
```
Purchase 엔티티 생성
  ↓
Customer-Product 관계 생성
  ↓
AI가 유사 제품 발견
  ↓
추천 시스템 개선
```

### 3. 재고 최적화
```
Product + Store 엔티티 생성
  ↓
'located_in' 관계 생성
  ↓
매장별 재고 분석
  ↓
최적 재고 수준 예측
```

## 다음 단계

### 즉시 실행 가능
1. **Cron Job 설정**: [가이드 참조](./ONTOLOGY_INFERENCE_CRON_SETUP.md)
2. **테스트 데이터 생성**: 고객/제품 데이터 삽입
3. **관계 확인**: 자동 생성된 관계 검증

### Phase 3 준비
1. 온톨로지 기반 추천 알고리즘 설계
2. 이상 탐지 모델 구축
3. 그래프 분석 UI 개발

## 참고 문서
- [Phase 1 구현](./DATA_PIPELINE_PHASE1_IMPLEMENTATION.md)
- [Phase 2 구현](./PHASE2_REALTIME_SYNC_IMPLEMENTATION.md)
- [Cron Job 설정](./ONTOLOGY_INFERENCE_CRON_SETUP.md)
- [온톨로지 스키마](./CURRENT_ONTOLOGY_SCHEMA.md)
