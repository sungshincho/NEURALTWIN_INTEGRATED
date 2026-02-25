# AI 현재 상태 분석 보고서

## 작성일: 2026-01-12
## 프로젝트: NEURALTWIN - AI 고도화 스프린트

---

## 1. AI 아키텍처 개요

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        Frontend (React + TypeScript)                     │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────────┐   │
│  │ AISimulationTab  │  │ AIOptimizationTab│  │ useSceneSimulation   │   │
│  │ (시뮬레이션 실행)│  │ (최적화 실행)    │  │ (훅)                 │   │
│  └────────┬─────────┘  └────────┬─────────┘  └──────────┬───────────┘   │
│           │                     │                       │               │
│           └─────────────────────┴───────────────────────┘               │
│                                 │                                        │
│                                 ▼                                        │
│                    ┌─────────────────────────┐                          │
│                    │ buildStoreContext()     │                          │
│                    │ (매장 컨텍스트 구성)    │                          │
│                    └─────────────────────────┘                          │
└─────────────────────────────────────────────────────────────────────────┘
                                  │
                                  ▼ Supabase Functions Invoke
┌─────────────────────────────────────────────────────────────────────────┐
│                      Supabase Edge Functions                             │
│  ┌──────────────────────┐  ┌──────────────────────┐                     │
│  │ run-simulation       │  │ generate-optimization│                     │
│  │ - 고객 시뮬레이션    │  │ - 레이아웃 최적화   │                     │
│  │ - 동선 분석          │  │ - 인력 배치 최적화  │                     │
│  └──────────┬───────────┘  └──────────┬───────────┘                     │
│             │                         │                                  │
│             └───────────┬─────────────┘                                  │
│                         ▼                                                │
│           ┌─────────────────────────────┐                               │
│           │ OpenRouter API (Gemini 2.0) │                               │
│           │ - response_format: json     │                               │
│           │ - 직접 API 호출             │                               │
│           └─────────────────────────────┘                               │
│                         │                                                │
│                         ▼                                                │
│           ┌─────────────────────────────┐                               │
│           │ aiResponseLogger            │                               │
│           │ (_shared/aiResponseLogger)  │                               │
│           └─────────────────────────────┘                               │
└─────────────────────────────────────────────────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                         Supabase Database                                │
│  ┌───────────────┐ ┌───────────────┐ ┌───────────────┐                  │
│  │ zones_dim     │ │ furniture     │ │ products      │                  │
│  │ (Zone 데이터) │ │ (집기 데이터) │ │ (상품 데이터) │                  │
│  └───────────────┘ └───────────────┘ └───────────────┘                  │
│  ┌───────────────┐ ┌───────────────┐ ┌───────────────────────┐          │
│  │ ai_response   │ │ applied_      │ │ strategy_feedback     │          │
│  │ _logs         │ │ strategies    │ │ (피드백 기록)         │          │
│  └───────────────┘ └───────────────┘ └───────────────────────┘          │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Edge Function별 상세 분석

### 2.1 generate-optimization (레이아웃/인력 최적화)

**파일 경로**: `supabase/functions/generate-optimization/index.ts`

**입력 스키마**:
```typescript
interface OptimizationRequest {
  store_id: string;
  optimization_type: 'layout' | 'staffing';
  parameters: {
    goal: 'revenue' | 'dwell_time' | 'traffic' | 'conversion';
    storeContext: StoreContext;
    settings?: OptimizationSettings;
    environment_context?: EnvironmentContext;
    diagnostic_issues?: DiagnosticIssue[];
  };
}
```

**출력 스키마**: `schemas/retailOptimizationSchema.ts` 참조
- `furniture_changes[]`: 가구 배치 변경 목록
- `product_changes[]`: 상품 배치 변경 목록
- `summary`: 종합 요약 (confidence_score 포함)

**현재 구현 특징**:
- JSON Schema 강제 출력 (strict: true) - **구현됨**
- VMD 원칙 코드북 정의됨 (8개 원칙)
- 배치 전략 코드북 정의됨 (10개 전략)
- `response_format: { type: 'json_schema' }` 사용

**발견된 이슈**:
1. ⚠️ Function Calling 미사용 - 모든 계산이 프롬프트 내에서 처리됨
2. ⚠️ 프롬프트가 함수 내 하드코딩됨 (약 500줄)
3. ⚠️ ROI 계산이 AI의 추측에 의존 (정확한 수식 없음)

---

### 2.2 run-simulation (고객 시뮬레이션)

**파일 경로**: `supabase/functions/run-simulation/index.ts`

**입력 스키마**:
```typescript
interface SimulationRequest {
  store_id: string;
  scenario_type: 'baseline' | 'what-if' | 'comparison';
  parameters: {
    duration: '1hour' | '1day';
    customer_count: number;
    storeContext: StoreContext;
    layout_changes?: LayoutChange[];
    environment?: EnvironmentContext;
  };
}
```

**출력 스키마**:
```typescript
interface SimulationResult {
  scenario_id: string;
  metrics: {
    total_visitors: number;
    conversion_rate: number;
    avg_dwell_time: number;
    revenue_estimate: number;
  };
  zone_analytics: ZoneAnalytic[];
  heatmap_data: HeatmapPoint[];
  diagnostic_issues: DiagnosticIssue[];
}
```

**현재 구현 특징**:
- `response_format: { type: 'json_object' }` 사용 (스키마 강제 X)
- Zone별 트래픽/체류시간 예측
- 진단 이슈 생성 기능 있음

**발견된 이슈**:
1. ⚠️ 시뮬레이션 결과가 AI 추측에 의존 (물리 엔진 없음)
2. ⚠️ 수치 계산이 일관성 없음 (같은 입력에 다른 결과)
3. ⚠️ 파싱 실패 시 폴백 로직 부재

---

### 2.3 retail-ai-inference (일반 AI 추론)

**파일 경로**: `supabase/functions/retail-ai-inference/index.ts`

**입력 스키마**:
```typescript
interface InferenceRequest {
  store_id: string;
  inference_type: 'demand_forecast' | 'customer_segment' | 'recommendation' | 'anomaly';
  parameters: Record<string, any>;
}
```

**현재 구현 특징**:
- 범용 AI 추론 엔드포인트
- `response_format: { type: 'json_object' }` 사용
- 컨텍스트 데이터 자동 로드 (zones, furniture, products)

---

## 3. 데이터 구조 분석

### 3.1 Zone 온톨로지

**테이블**: `zones_dim`

| 컬럼 | 타입 | 현재 값 | 확장 필요 |
|------|------|---------|----------|
| zone_type | text | entrance, main, display, fitting, checkout, storage | VMD 속성 추가 필요 |
| properties | jsonb | 기본 메타데이터만 | vmd_type, golden_zone, dead_space 추가 필요 |

**현재 정의된 Zone Types**:
- `entrance`: 입구
- `main`: 메인홀
- `display`: 전시/판매 존
- `fitting`: 피팅룸
- `checkout`: 계산대
- `storage`: 창고

**부족한 VMD 속성**:
- ❌ Golden Zone (눈높이 120-150cm)
- ❌ Dead Space (저트래픽 구역)
- ❌ Power Wall (우측 벽면)
- ❌ Decompression Zone (입구 감압 구역)

---

### 3.2 Furniture 온톨로지

**테이블**: `furniture`, `furniture_slots`

| 속성 | 구현 상태 | 설명 |
|------|----------|------|
| furniture_type | ✅ 구현됨 | shelf, rack, table, gondola, endcap, mannequin 등 |
| slot_type | ✅ 구현됨 | hanger, shelf, table, rack, mannequin |
| compatible_display_types | ✅ 구현됨 | hanging, folded, standing, boxed 등 |
| capacity | ⚠️ 부분 구현 | slot별 수용량 정보 불완전 |
| facing_count | ❌ 미구현 | 페이싱(진열 면) 수 |
| height_zone | ❌ 미구현 | floor/bottom/middle/eye_level/top |

---

### 3.3 Product 온톨로지

**테이블**: `products`

| 속성 | 구현 상태 | 설명 |
|------|----------|------|
| sku | ✅ 구현됨 | 상품 코드 |
| category | ✅ 구현됨 | 상품 카테고리 |
| price | ✅ 구현됨 | 가격 |
| display_type | ✅ 구현됨 | 현재 진열 방식 |
| compatible_display_types | ✅ 구현됨 | 가능한 진열 방식 |
| margin | ❌ 미구현 | 마진율 |
| turnover_rate | ❌ 미구현 | 회전율 |
| cross_sell_products | ❌ 미구현 | 연관 상품 ID 배열 |

---

### 3.4 온톨로지 그래프 구조

**테이블**: `ontology_entity_types`, `ontology_relation_types`, `graph_entities`, `graph_relations`

**현재 정의된 Entity Types**:
- Store, Zone, Product, Furniture, Customer, Segment

**현재 정의된 Relation Types**:
- contains, displays, has_furniture, belongs_to, similar_to

**부족한 관계**:
- ❌ cross_sells_with (상품 간 연관 판매)
- ❌ adjacent_to (Zone 간 인접 관계)
- ❌ purchased_in (Zone 내 구매 이력)

---

## 4. 피드백 루프 시스템

### 4.1 현재 구현된 테이블

| 테이블 | 용도 | 구현 상태 |
|--------|------|----------|
| applied_strategies | 적용된 전략 기록 | ✅ 구현됨 |
| strategy_feedback | 전략 피드백 | ✅ 구현됨 |
| strategy_daily_metrics | 전략별 일일 지표 | ✅ 구현됨 |
| ai_response_logs | AI 응답 로깅 | ✅ 구현됨 |
| learning_sessions | 학습 세션 | ⚠️ 테이블만 생성됨 |
| learning_adjustments | 학습 조정 기록 | ⚠️ 테이블만 생성됨 |
| prediction_records | 예측 vs 실제 기록 | ⚠️ 테이블만 생성됨 |

### 4.2 프론트엔드 피드백 UI

**파일**: `src/features/studio/hooks/useOptimization.ts`

```typescript
// 현재 구현된 기능
- applyChange(changeId, type)    // 개별 변경 적용
- applyAllChanges()              // 전체 적용
- rejectChange(changeId, type)   // 개별 거부
- rejectAllChanges()             // 전체 거부
```

**부족한 기능**:
- ❌ 수정(Modify) 기능 - 사용자가 AI 제안을 수정
- ❌ 피드백 사유 입력 - 왜 거부했는지
- ❌ 실제 결과 입력 - 적용 후 실제 성과

---

## 5. 로깅 및 모니터링

### 5.1 AI Response Logger

**파일**: `supabase/functions/_shared/aiResponseLogger.ts`

**기록 항목**:
- function_name: Edge Function 이름
- simulation_type: 시뮬레이션 유형
- request_params: 요청 파라미터
- response_body: AI 응답 본문
- response_time_ms: 응답 시간
- token_usage: 토큰 사용량
- error_message: 에러 메시지

**활용 현황**:
- ⚠️ 로깅은 되지만 분석/대시보드 없음
- ⚠️ 파싱 성공률 추적 기능 없음
- ⚠️ 모델 성능 모니터링 없음

---

## 6. 기술 부채 목록

### 6.1 즉시 해결 필요 (P0)

| ID | 이슈 | 영향도 | 해결 방법 |
|----|------|--------|----------|
| D1 | run-simulation JSON 파싱 불안정 | Demo 실패 가능 | json_schema 강제 |
| D2 | 시뮬레이션 수치 일관성 없음 | 신뢰도 하락 | Function Calling + 계산 모듈 |
| D3 | 에러 발생 시 UI 복구 어려움 | UX 저하 | 에러 바운더리 + 폴백 |

### 6.2 단기 해결 필요 (P1)

| ID | 이슈 | 영향도 | 해결 방법 |
|----|------|--------|----------|
| D4 | VMD 원칙이 프롬프트에만 존재 | 확장성 낮음 | DB 기반 룰셋 |
| D5 | ROI 계산이 AI 추측 | 정확도 낮음 | 명시적 수식 모듈 |
| D6 | 프롬프트 하드코딩 | 유지보수 어려움 | 프롬프트 관리 시스템 |

### 6.3 중기 해결 필요 (P2)

| ID | 이슈 | 영향도 | 해결 방법 |
|----|------|--------|----------|
| D7 | 피드백 학습 미작동 | 개선 불가 | 학습 파이프라인 구축 |
| D8 | 매장별 차별화 없음 | 일반적 추천 | Store Persona 주입 |
| D9 | VMD 룰셋 검색 불가 | 근거 부족 | RAG 시스템 구축 |

---

## 7. Confidence Score 분석

### 7.1 현재 Confidence Score 구성

**generate-optimization** 결과의 `summary.confidence_score`:

현재 값: **~0.61 (61%)** (관측 기준)

**구성 요소**:
- AI 자체 평가: 0.75-0.85 (높음)
- 데이터 완전성: 0.50-0.60 (중간)
- 룰셋 적용 여부: 0.40-0.50 (낮음)

### 7.2 신뢰도 향상 로드맵

| 개선 항목 | 현재 기여도 | 목표 기여도 | 구현 방법 |
|----------|------------|------------|----------|
| 데이터 완전성 | 15% | 25% | Zone/Furniture 속성 확장 |
| VMD 룰셋 적용 | 10% | 20% | 룰셋 DB + RAG |
| Function Calling | 5% | 15% | 계산 분리 |
| 피드백 학습 | 5% | 15% | Accept/Reject 기반 조정 |
| **총합** | **35%** | **75%** | - |

---

## 8. 요약 및 권장사항

### 8.1 강점
- JSON Schema 기반 Structured Output 부분 적용됨
- 로깅 인프라 구축됨 (ai_response_logs)
- 피드백 테이블 구조 정의됨
- VMD 원칙/배치 전략 코드북 정의됨

### 8.2 약점
- Function Calling 미사용으로 수치 정확도 낮음
- 피드백 학습 파이프라인 미작동
- 프롬프트 관리 시스템 부재
- 매장별 개인화 불가

### 8.3 우선 권장 작업
1. **Sprint 0**: JSON Schema 전면 적용 + 에러 핸들링 강화
2. **Sprint 1**: Function Calling 기반 계산 모듈 분리
3. **Sprint 2**: 온톨로지 확장 + VMD 룰셋 DB화
4. **Sprint 3**: 피드백 학습 파이프라인 활성화

---

*문서 버전: 1.0*
*최종 수정: 2026-01-12*
