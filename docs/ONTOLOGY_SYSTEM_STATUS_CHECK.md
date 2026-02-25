# 온톨로지 통합 시스템 상태 확인

## 📊 시스템 개요

```
데이터 소스 → 온톨로지 스키마 → AI 추론 모델
    ↓              ↓                ↓
CSV/API       graph_entities    추천/이상탐지/패턴분석
              graph_relations
```

## ✅ Phase 1: 데이터 파이프라인 통합

### 구성 요소

| 항목 | 상태 | 설명 |
|------|------|------|
| **Edge Function** | ✅ 구현됨 | `integrated-data-pipeline` |
| **CSV → 온톨로지** | ✅ 작동 | CSV 업로드 시 자동 변환 |
| **API → 온톨로지** | ✅ 작동 | `sync-api-data`에서 온톨로지 변환 옵션 |
| **필드 매핑 UI** | ✅ 구현됨 | 엔티티 타입 선택 가능 |

### 데이터 흐름

```
1. 사용자가 CSV 업로드 또는 API 연동 설정
   ↓
2. 데이터가 일반 테이블에 저장 (products, customers, purchases 등)
   ↓
3. [Phase 1] 필드 매핑 시 온톨로지 엔티티 타입 선택
   ↓
4. integrated-data-pipeline 호출
   ↓
5. graph_entities 생성 + ontology_entity_types 연결
```

### 확인 방법

```sql
-- 1. 온톨로지 엔티티 타입 확인
SELECT * FROM ontology_entity_types ORDER BY created_at DESC LIMIT 10;

-- 2. 생성된 그래프 엔티티 확인
SELECT 
  e.id,
  e.label,
  et.name as entity_type,
  e.properties,
  e.created_at
FROM graph_entities e
JOIN ontology_entity_types et ON e.entity_type_id = et.id
ORDER BY e.created_at DESC
LIMIT 10;

-- 3. 데이터 임포트 히스토리 확인
SELECT * FROM user_data_imports 
WHERE import_type = 'ontology'
ORDER BY created_at DESC
LIMIT 5;
```

## ✅ Phase 2: 실시간 동기화

### 구성 요소

| 항목 | 상태 | 설명 |
|------|------|------|
| **Database 트리거** | ✅ 구현됨 | customers, products, purchases, stores 테이블에 설치 |
| **자동 엔티티 생성** | ✅ 작동 | INSERT/UPDATE 시 graph_entities 자동 생성 |
| **관계 추론 큐** | ✅ 구현됨 | `ontology_relation_inference_queue` 테이블 |
| **AI 관계 추론** | ✅ 구현됨 | `infer-entity-relations` Edge Function |
| **스케줄러** | ✅ 구현됨 | `ontology-inference-scheduler` |

### 데이터 흐름

```
1. 데이터가 일반 테이블에 INSERT/UPDATE
   (customers, products, purchases, stores)
   ↓
2. [Phase 2 트리거] 자동으로 graph_entities 생성
   - sync_customer_to_ontology()
   - sync_product_to_ontology()
   - sync_purchase_to_ontology()
   - sync_store_to_ontology()
   ↓
3. 새 엔티티가 ontology_relation_inference_queue에 추가
   ↓
4. infer-entity-relations Edge Function이 큐 처리
   ↓
5. Lovable AI (Gemini 2.5 Flash)가 관계 추론
   ↓
6. graph_relations 생성 (purchased, located_in 등)
```

### 트리거 상태 확인

```sql
-- 1. 설치된 트리거 확인
SELECT 
  trigger_name,
  event_object_table,
  action_statement,
  action_timing,
  event_manipulation
FROM information_schema.triggers
WHERE trigger_schema = 'public'
AND trigger_name LIKE '%sync%ontology%'
ORDER BY event_object_table;

-- 예상 결과:
-- - sync_customer_to_ontology_trigger (customers 테이블)
-- - sync_product_to_ontology_trigger (products 테이블)
-- - sync_purchase_to_ontology_trigger (purchases 테이블)
-- - sync_store_to_ontology_trigger (stores 테이블)

-- 2. 관계 추론 큐 상태 확인
SELECT 
  status,
  COUNT(*) as count
FROM ontology_relation_inference_queue
GROUP BY status;

-- 3. 최근 추론된 관계 확인
SELECT 
  r.id,
  source.label as source,
  rt.name as relation_type,
  target.label as target,
  r.weight,
  r.created_at
FROM graph_relations r
JOIN graph_entities source ON r.source_entity_id = source.id
JOIN graph_entities target ON r.target_entity_id = target.id
JOIN ontology_relation_types rt ON r.relation_type_id = rt.id
WHERE r.created_at > NOW() - INTERVAL '7 days'
ORDER BY r.created_at DESC
LIMIT 20;
```

### 함수 존재 확인

```sql
-- 트리거 함수들이 존재하는지 확인
SELECT 
  routine_name,
  routine_type
FROM information_schema.routines
WHERE routine_schema = 'public'
AND routine_name LIKE '%sync%ontology%';

-- 예상 결과:
-- - sync_customer_to_ontology
-- - sync_product_to_ontology
-- - sync_purchase_to_ontology
-- - sync_store_to_ontology
-- - queue_relation_inference
```

## ✅ Phase 3: AI 추론 엔진

### 구성 요소

| 항목 | 상태 | 설명 |
|------|------|------|
| **Edge Function** | ✅ 구현됨 | `ontology-ai-inference` |
| **추천 시스템** | ✅ 작동 | 협업 필터링, 콘텐츠 기반, 그래프 탐색 |
| **이상 탐지** | ✅ 작동 | 구조적/행동적/값 이상 탐지 |
| **패턴 분석** | ✅ 작동 | 빈발 패턴, 연관 규칙, 클러스터 |
| **Frontend Hook** | ✅ 구현됨 | `useOntologyInference` |

### 데이터 흐름

```
1. 프론트엔드에서 useOntologyInference 호출
   ↓
2. ontology-ai-inference Edge Function 호출
   ↓
3. graph_entities + graph_relations 로드
   ↓
4. 통계적 분석 수행 (패턴 추출, 이상 탐지)
   ↓
5. Lovable AI (Gemini 2.5 Flash) 호출
   - 추천: OntologyRecommendation[]
   - 이상: OntologyAnomaly[]
   - 패턴: GraphPattern[], AssociationRule[]
   ↓
6. 추천 결과를 ai_recommendations 테이블에 저장
   ↓
7. 프론트엔드로 결과 반환
```

### Edge Functions 확인

```bash
# Supabase config.toml에 등록된 함수 확인
# 예상 함수들:
# - integrated-data-pipeline (Phase 1)
# - infer-entity-relations (Phase 2)
# - ontology-inference-scheduler (Phase 2)
# - ontology-ai-inference (Phase 3)
```

### AI 추천 테이블 확인

```sql
-- 1. AI 추천 데이터 확인
SELECT 
  recommendation_type,
  priority,
  title,
  description,
  data_source,
  is_displayed,
  created_at
FROM ai_recommendations
WHERE data_source = 'ontology_ai_inference'
ORDER BY created_at DESC
LIMIT 10;

-- 2. 추천 증거 (evidence) 확인
SELECT 
  title,
  evidence->'confidence' as confidence,
  evidence->'entity_type' as entity_type,
  evidence->'supporting_relations' as supporting_relations
FROM ai_recommendations
WHERE data_source = 'ontology_ai_inference'
ORDER BY created_at DESC
LIMIT 5;
```

## 🔧 테스트 시나리오

### 시나리오 1: CSV 업로드 → 온톨로지 생성

1. `/data-management/import`로 이동
2. CSV 파일 업로드 (예: products.csv)
3. 필드 매핑 시 "온톨로지 자동 변환" 체크박스 활성화
4. 엔티티 타입 선택 (예: Product)
5. 업로드 완료 후 확인:

```sql
-- 새로 생성된 엔티티 확인
SELECT * FROM graph_entities 
WHERE entity_type_id = (
  SELECT id FROM ontology_entity_types WHERE name = 'Product'
)
ORDER BY created_at DESC
LIMIT 10;
```

### 시나리오 2: 실시간 동기화 테스트

1. 데이터베이스에 직접 INSERT:

```sql
-- 새 고객 추가
INSERT INTO customers (user_id, org_id, customer_name, email, phone)
VALUES (
  auth.uid(),
  (SELECT org_id FROM organization_members WHERE user_id = auth.uid() LIMIT 1),
  '테스트 고객',
  'test@example.com',
  '010-1234-5678'
);

-- 자동으로 graph_entities에 생성되었는지 확인
SELECT * FROM graph_entities
WHERE label = '테스트 고객'
ORDER BY created_at DESC
LIMIT 1;

-- 관계 추론 큐에 추가되었는지 확인
SELECT * FROM ontology_relation_inference_queue
WHERE status = 'pending'
ORDER BY created_at DESC
LIMIT 5;
```

2. 관계 추론 실행 (수동):

```bash
# Edge Function 호출
curl -X POST \
  https://your-project.supabase.co/functions/v1/infer-entity-relations \
  -H "Authorization: Bearer YOUR_SERVICE_ROLE_KEY"
```

3. 결과 확인:

```sql
-- 새로 추론된 관계 확인
SELECT 
  source.label as source,
  rt.name as relation,
  target.label as target,
  r.properties
FROM graph_relations r
JOIN graph_entities source ON r.source_entity_id = source.id
JOIN graph_entities target ON r.target_entity_id = target.id
JOIN ontology_relation_types rt ON r.relation_type_id = rt.id
WHERE r.created_at > NOW() - INTERVAL '1 hour'
ORDER BY r.created_at DESC;
```

### 시나리오 3: AI 추론 실행

1. 프론트엔드에서 테스트:

```typescript
import { useOntologyInference } from '@/hooks/useOntologyInference';

function TestComponent() {
  const { generateRecommendations, detectAnomalies, analyzePatterns } = useOntologyInference();
  
  const testRecommendations = async () => {
    const recs = await generateRecommendations('store-id', undefined, 'product');
    console.log('추천 결과:', recs);
  };
  
  const testAnomalies = async () => {
    const anomalies = await detectAnomalies('store-id', 'medium');
    console.log('이상 탐지 결과:', anomalies);
  };
  
  const testPatterns = async () => {
    const patterns = await analyzePatterns('store-id', 'all');
    console.log('패턴 분석 결과:', patterns);
  };
  
  return (
    <div>
      <button onClick={testRecommendations}>추천 테스트</button>
      <button onClick={testAnomalies}>이상 탐지 테스트</button>
      <button onClick={testPatterns}>패턴 분석 테스트</button>
    </div>
  );
}
```

2. Edge Function 로그 확인:

```sql
-- Supabase 대시보드에서 Edge Function 로그 확인
-- 또는 CLI로:
supabase functions logs ontology-ai-inference --limit 50
```

## 🚨 잠재적 문제 및 해결

### 문제 1: 트리거가 실행되지 않음

**증상:**
- 데이터 INSERT 후 graph_entities가 생성되지 않음

**확인:**
```sql
-- 트리거 존재 여부 확인
SELECT * FROM information_schema.triggers
WHERE trigger_name LIKE '%sync%ontology%';

-- 함수 존재 여부 확인
SELECT routine_name FROM information_schema.routines
WHERE routine_name LIKE '%sync%ontology%';
```

**해결:**
- Migration이 실행되었는지 확인
- `supabase/migrations/` 폴더의 최신 마이그레이션 확인

### 문제 2: 관계 추론 큐가 처리되지 않음

**증상:**
- ontology_relation_inference_queue에 pending 상태가 계속 쌓임

**확인:**
```sql
SELECT status, COUNT(*) 
FROM ontology_relation_inference_queue
GROUP BY status;
```

**해결:**
- `infer-entity-relations` Edge Function이 배포되었는지 확인
- 스케줄러가 설정되었는지 확인 (Cron job)
- Edge Function 로그 확인

### 문제 3: AI 추론이 실패함

**증상:**
- useOntologyInference 호출 시 에러 발생

**확인:**
```typescript
const { error } = useOntologyInference();
console.log('Error:', error);
```

**해결:**
- LOVABLE_API_KEY 환경 변수가 설정되었는지 확인
- Edge Function 로그에서 자세한 에러 메시지 확인
- 그래프 데이터가 충분한지 확인 (최소 5개 엔티티, 3개 관계)

### 문제 4: RLS 정책 에러

**증상:**
- "permission denied" 에러 발생

**확인:**
```sql
-- 사용자의 org_id 확인
SELECT org_id FROM organization_members WHERE user_id = auth.uid();

-- 데이터의 org_id 확인
SELECT org_id FROM graph_entities LIMIT 5;
```

**해결:**
- 모든 온톨로지 데이터에 org_id가 올바르게 설정되어 있는지 확인
- RLS 정책이 활성화되어 있는지 확인

## 📈 성능 모니터링

### 지표 확인

```sql
-- 1. 온톨로지 데이터 크기
SELECT 
  'Entities' as type,
  COUNT(*) as count
FROM graph_entities
UNION ALL
SELECT 
  'Relations' as type,
  COUNT(*) as count
FROM graph_relations;

-- 2. 엔티티 타입별 분포
SELECT 
  et.name,
  COUNT(e.id) as count
FROM ontology_entity_types et
LEFT JOIN graph_entities e ON et.id = e.entity_type_id
GROUP BY et.name
ORDER BY count DESC;

-- 3. 관계 타입별 분포
SELECT 
  rt.name,
  COUNT(r.id) as count
FROM ontology_relation_types rt
LEFT JOIN graph_relations r ON rt.id = r.relation_type_id
GROUP BY rt.name
ORDER BY count DESC;

-- 4. AI 추천 생성 빈도
SELECT 
  DATE_TRUNC('day', created_at) as date,
  COUNT(*) as recommendations_count
FROM ai_recommendations
WHERE data_source = 'ontology_ai_inference'
GROUP BY date
ORDER BY date DESC
LIMIT 7;

-- 5. 관계 추론 성공률
SELECT 
  status,
  COUNT(*) as count,
  ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER (), 2) as percentage
FROM ontology_relation_inference_queue
GROUP BY status;
```

## ✅ 체크리스트

### Phase 1: 데이터 파이프라인
- [ ] `integrated-data-pipeline` Edge Function 배포됨
- [ ] CSV 업로드 시 온톨로지 옵션 표시됨
- [ ] API 연동 시 엔티티 타입 선택 가능
- [ ] `user_data_imports` 테이블에 기록 생성됨
- [ ] `graph_entities` 테이블에 데이터 생성됨

### Phase 2: 실시간 동기화
- [ ] Database 트리거 4개 설치됨 (customers, products, purchases, stores)
- [ ] 트리거 함수 4개 생성됨
- [ ] `ontology_relation_inference_queue` 테이블 존재
- [ ] `queue_relation_inference` 트리거 설치됨
- [ ] `infer-entity-relations` Edge Function 배포됨
- [ ] `ontology-inference-scheduler` Edge Function 배포됨
- [ ] Cron job 설정됨 (선택사항)

### Phase 3: AI 추론 엔진
- [ ] `ontology-ai-inference` Edge Function 배포됨
- [ ] `useOntologyInference` Hook 생성됨
- [ ] 추천 시스템 작동 확인
- [ ] 이상 탐지 작동 확인
- [ ] 패턴 분석 작동 확인
- [ ] `ai_recommendations` 테이블에 결과 저장됨

### 통합 테스트
- [ ] CSV 업로드 → 온톨로지 생성 확인
- [ ] 데이터 INSERT → 자동 엔티티 생성 확인
- [ ] 관계 추론 큐 → AI 관계 생성 확인
- [ ] AI 추천 → 결과 반환 확인
- [ ] AI 이상 탐지 → 이상 목록 확인
- [ ] AI 패턴 분석 → 패턴 목록 확인

## 📚 관련 문서

- [Phase 1: 데이터 파이프라인 통합](./DATA_PIPELINE_PHASE1_IMPLEMENTATION.md)
- [Phase 2: 실시간 동기화](./PHASE2_REALTIME_SYNC_IMPLEMENTATION.md)
- [Phase 3: AI 추론 엔진](./ONTOLOGY_AI_INFERENCE_PHASE3.md)
- [온톨로지 완전 아키텍처](./ONTOLOGY_COMPLETE_ARCHITECTURE.md)
- [온톨로지 추론 Cron 설정](./ONTOLOGY_INFERENCE_CRON_SETUP.md)

## 🎯 다음 단계

1. **즉시 확인 필요:**
   - 위의 SQL 쿼리들을 실행하여 각 Phase의 상태 확인
   - Edge Functions 로그 확인
   - 테스트 시나리오 실행

2. **개선 가능 영역:**
   - Cron job 설정하여 자동 관계 추론
   - AI 추천 결과를 대시보드에 표시하는 UI 구현
   - 성능 모니터링 대시보드 추가
   - 이상 탐지 시 자동 알림 기능

3. **확장 계획:**
   - 더 많은 엔티티 타입 추가
   - 더 복잡한 관계 타입 정의
   - 시계열 패턴 분석 추가
   - A/B 테스트 기능 통합
