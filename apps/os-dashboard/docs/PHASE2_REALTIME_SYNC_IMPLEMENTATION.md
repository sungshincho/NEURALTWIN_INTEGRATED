# Phase 2: 실시간 동기화 구현 완료

## 개요
데이터베이스 트리거와 AI 기반 관계 추론을 통한 실시간 온톨로지 동기화를 완벽하게 구현하였습니다.

## 구현 완료 사항

### 1. Database 트리거로 자동 graph_entities 생성 ✅

#### 트리거 함수 목록
1. **`sync_customer_to_ontology()`**
   - 테이블: `customers`
   - 동작: INSERT/UPDATE 시 Customer 엔티티 자동 생성/업데이트
   - 엔티티 타입: `Customer` (자동 생성)

2. **`sync_product_to_ontology()`**
   - 테이블: `products`
   - 동작: INSERT/UPDATE 시 Product 엔티티 자동 생성/업데이트
   - 엔티티 타입: `Product` (자동 생성)

3. **`sync_purchase_to_ontology()`**
   - 테이블: `purchases`
   - 동작: INSERT 시 Purchase 엔티티 생성 + Customer-Product 관계 자동 생성
   - 엔티티 타입: `Purchase` (자동 생성)
   - 관계 타입: `purchased` (Customer → Product)

4. **`sync_store_to_ontology()`**
   - 테이블: `stores`
   - 동작: INSERT/UPDATE 시 Store 엔티티 자동 생성/업데이트
   - 엔티티 타입: `Store` (자동 생성)

#### 트리거 특징
- **중복 방지**: 기존 엔티티가 있으면 업데이트, 없으면 생성
- **엔티티 타입 자동 생성**: 엔티티 타입이 없으면 자동으로 생성
- **메타데이터 포함**: 모든 원본 데이터를 properties에 저장
- **추적 가능**: `source_table`, `synced_at` 메타데이터로 출처 추적

### 2. AI 기반 관계 자동 추론 ✅

#### 관계 추론 큐 (`ontology_relation_inference_queue`)
새로운 테이블로 AI 관계 추론을 비동기 처리:
- `pending`: 처리 대기 중
- `processing`: 현재 처리 중
- `completed`: 처리 완료
- `failed`: 처리 실패 (재시도 가능)

#### Edge Function: `infer-entity-relations`
**기능**:
1. 큐에서 `pending` 엔티티 가져오기 (배치 처리)
2. 각 엔티티와 관련된 다른 엔티티들 조회
3. AI(Lovable AI - Gemini 2.5 Flash) 사용하여 관계 추론
4. 추론된 관계를 `graph_relations`에 자동 생성
5. 큐 상태를 `completed`로 업데이트

**AI 관계 추론 프로세스**:
```
1. 대상 엔티티 정보 분석
   ↓
2. 다른 엔티티들(최대 100개) 조회
   ↓
3. AI 프롬프트 생성
   ↓
4. Lovable AI 호출 (Tool Calling)
   ↓
5. 관계 타입, 방향성, 신뢰도 점수 추출
   ↓
6. 신뢰도 0.6 이상 관계만 생성
```

**추론 가능한 관계 타입**:
- `purchased`: 고객 → 제품 구매
- `located_in`: 제품 → 매장 위치
- `belongs_to`: 제품 → 카테고리/브랜드
- `similar_to`: 유사 제품/고객
- `visited`: 고객 → 매장 방문
- `works_at`: 직원 → 매장 근무
- 기타 AI가 데이터에서 발견한 관계

#### Edge Function: `ontology-inference-scheduler`
주기적으로 실행되어 관계 추론을 트리거:
- 큐에서 pending 엔티티 수 확인
- `infer-entity-relations` 함수 호출
- 배치 단위(20개)로 처리

### 3. 실시간 동기화 플로우

```
┌──────────────┐
│   데이터      │
│   INSERT/    │
│   UPDATE     │
└──────┬───────┘
       │
       ▼
┌──────────────────────┐
│  Database Trigger    │
│  (자동 실행)         │
└──────┬───────────────┘
       │
       ├───────────────────┐
       │                   │
       ▼                   ▼
┌──────────────┐   ┌───────────────┐
│graph_entities│   │ queue_relation│
│   생성/업데이트│   │  _inference() │
└──────────────┘   └───────┬───────┘
                           │
                           ▼
                  ┌────────────────────┐
                  │ontology_relation_  │
                  │inference_queue     │
                  │(status: pending)   │
                  └────────┬───────────┘
                           │
                           ▼
                  ┌────────────────────┐
                  │Scheduler (Cron Job)│
                  │매 5분마다 실행      │
                  └────────┬───────────┘
                           │
                           ▼
                  ┌────────────────────┐
                  │infer-entity-       │
                  │relations           │
                  │(AI 추론)           │
                  └────────┬───────────┘
                           │
                           ▼
                  ┌────────────────────┐
                  │graph_relations     │
                  │자동 생성            │
                  └────────────────────┘
```

## 데이터베이스 구조

### 새로 추가된 테이블
```sql
CREATE TABLE ontology_relation_inference_queue (
  id uuid PRIMARY KEY,
  user_id uuid NOT NULL,
  org_id uuid,
  entity_id uuid NOT NULL REFERENCES graph_entities(id),
  status text NOT NULL DEFAULT 'pending',
  retry_count integer NOT NULL DEFAULT 0,
  error_message text,
  created_at timestamptz NOT NULL DEFAULT now(),
  processed_at timestamptz,
  UNIQUE(entity_id, status)
);
```

### 트리거 목록
1. `trigger_sync_customer_to_ontology` ON `customers`
2. `trigger_sync_product_to_ontology` ON `products`
3. `trigger_sync_purchase_to_ontology` ON `purchases`
4. `trigger_sync_store_to_ontology` ON `stores`
5. `trigger_queue_relation_inference` ON `graph_entities`

## Edge Functions

### 1. infer-entity-relations
**경로**: `supabase/functions/infer-entity-relations/index.ts`

**입력 파라미터**:
```typescript
{
  entity_id?: string;     // 특정 엔티티만 처리 (선택사항)
  batch_size?: number;    // 한 번에 처리할 엔티티 수 (기본: 10)
}
```

**출력**:
```typescript
{
  success: boolean;
  processed: number;           // 처리된 엔티티 수
  success_count: number;       // 성공한 엔티티 수
  failure_count: number;       // 실패한 엔티티 수
  relations_created: number;   // 생성된 관계 수
}
```

**사용 예시**:
```typescript
// 수동 실행
const { data, error } = await supabase.functions.invoke('infer-entity-relations', {
  body: { batch_size: 20 }
});
```

### 2. ontology-inference-scheduler
**경로**: `supabase/functions/ontology-inference-scheduler/index.ts`

**기능**: 
- 큐에서 pending 엔티티 확인
- `infer-entity-relations` 함수 호출
- Cron Job으로 주기적 실행 (매 5분)

**Cron Job 설정**:
```sql
-- Supabase pg_cron으로 실행
SELECT cron.schedule(
  'ontology-inference-every-5min',
  '*/5 * * * *', -- 매 5분
  $$
  SELECT net.http_post(
    url:='https://bdrvowacecxnraaivlhr.supabase.co/functions/v1/ontology-inference-scheduler',
    headers:='{"Content-Type": "application/json", "Authorization": "Bearer YOUR_ANON_KEY"}'::jsonb
  ) as request_id;
  $$
);
```

## AI 모델 사용

### Lovable AI Gateway
- **모델**: `google/gemini-2.5-flash`
- **용도**: 관계 추론 (Tool Calling)
- **API**: `https://ai.gateway.lovable.dev/v1/chat/completions`

### Tool Calling Schema
```typescript
{
  name: 'create_entity_relations',
  parameters: {
    relations: [
      {
        target_entity_id: string,      // 대상 엔티티 ID
        relation_type: string,          // 관계 타입 (예: purchased)
        relation_label: string,         // 사람이 읽기 쉬운 레이블
        directionality: 'directed' | 'undirected',
        confidence: number,             // 0.0-1.0 (최소 0.6)
        reasoning: string               // 추론 근거
      }
    ]
  }
}
```

## 성능 최적화

### 1. 배치 처리
- 큐에서 한 번에 10-20개씩 처리
- 대량 엔티티 생성 시에도 안정적 처리

### 2. 비동기 처리
- 트리거는 즉시 반환 (큐에만 추가)
- AI 추론은 백그라운드에서 비동기 실행
- 데이터 삽입 성능에 영향 없음

### 3. 재시도 메커니즘
- 실패한 추론은 `retry_count` 증가
- 최대 3회까지 재시도 가능

### 4. 신뢰도 필터링
- 신뢰도 0.6 이상 관계만 생성
- 노이즈 관계 방지

## 모니터링 및 디버깅

### 큐 상태 확인
```sql
SELECT 
  status,
  COUNT(*) as count,
  AVG(retry_count) as avg_retries
FROM ontology_relation_inference_queue
GROUP BY status;
```

### 최근 추론된 관계 확인
```sql
SELECT 
  gr.*,
  ge_source.label as source_label,
  ge_target.label as target_label,
  ort.name as relation_type
FROM graph_relations gr
JOIN graph_entities ge_source ON ge_source.id = gr.source_entity_id
JOIN graph_entities ge_target ON ge_target.id = gr.target_entity_id
JOIN ontology_relation_types ort ON ort.id = gr.relation_type_id
WHERE gr.properties->>'ai_inferred' = 'true'
ORDER BY gr.created_at DESC
LIMIT 20;
```

### Edge Function 로그 확인
- [infer-entity-relations 로그](https://supabase.com/dashboard/project/bdrvowacecxnraaivlhr/functions/infer-entity-relations/logs)
- [ontology-inference-scheduler 로그](https://supabase.com/dashboard/project/bdrvowacecxnraaivlhr/functions/ontology-inference-scheduler/logs)

## 사용 시나리오

### 시나리오 1: 신규 고객 등록
```sql
INSERT INTO customers (user_id, org_id, customer_name, email)
VALUES ('...', '...', 'John Doe', 'john@example.com');

-- 자동 실행:
-- 1. Customer 엔티티 생성 (트리거)
-- 2. 관계 추론 큐에 추가 (트리거)
-- 3. AI가 유사 고객, 방문 매장 등 관계 추론 (스케줄러)
```

### 시나리오 2: 제품 구매
```sql
INSERT INTO purchases (user_id, org_id, customer_id, product_id, quantity)
VALUES ('...', '...', 'customer-123', 'product-456', 2);

-- 자동 실행:
-- 1. Purchase 엔티티 생성
-- 2. Customer → Product 'purchased' 관계 생성
-- 3. AI가 추가 관계 추론 (예: 유사 제품 추천)
```

### 시나리오 3: 수동 관계 추론
```typescript
// 특정 엔티티에 대해 즉시 관계 추론
const { data } = await supabase.functions.invoke('infer-entity-relations', {
  body: {
    entity_id: 'specific-entity-id',
    batch_size: 1
  }
});
```

## 확장 가능성

### 추가 가능한 트리거
- `visits` → Visit 엔티티
- `inventory_levels` → Inventory 엔티티
- `wifi_tracking` → WiFiTracking 엔티티

### AI 관계 추론 개선
- 더 정교한 프롬프트 엔지니어링
- 도메인별 관계 타입 프리셋
- 사용자 피드백 기반 학습

### 성능 튜닝
- 인덱스 최적화
- 배치 크기 동적 조정
- 우선순위 큐 도입

## 다음 단계 (Phase 3)

### Phase 3: AI 추론 엔진
- [ ] 온톨로지 기반 추천 시스템
- [ ] 이상 탐지 (Anomaly Detection)
- [ ] 패턴 분석 및 시각화
- [ ] 예측 모델링

## 참고 문서
- [Phase 1 구현 문서](./DATA_PIPELINE_PHASE1_IMPLEMENTATION.md)
- [온톨로지 스키마](./CURRENT_ONTOLOGY_SCHEMA.md)
- [Lovable AI 사용 가이드](https://docs.lovable.dev/features/ai)
- [Supabase Cron Jobs](https://supabase.com/docs/guides/functions/schedule-functions)
