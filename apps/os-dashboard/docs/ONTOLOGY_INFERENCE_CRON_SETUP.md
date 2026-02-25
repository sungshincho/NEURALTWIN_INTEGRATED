# 온톨로지 관계 추론 Cron Job 설정 가이드

## 개요
AI 기반 온톨로지 관계 추론을 자동화하기 위해 Supabase pg_cron을 설정합니다.

## 전제 조건

### 1. pg_cron 및 pg_net 확장 활성화
Supabase SQL 에디터에서 다음 SQL을 실행하세요:

```sql
-- pg_cron 확장 활성화
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- pg_net 확장 활성화
CREATE EXTENSION IF NOT EXISTS pg_net;
```

## Cron Job 설정

### 방법 1: 매 5분마다 실행 (권장)

**추론 처리가 빠른 환경에 적합**

```sql
SELECT cron.schedule(
  'ontology-inference-every-5min',
  '*/5 * * * *', -- 매 5분
  $$
  SELECT net.http_post(
    url:='https://bdrvowacecxnraaivlhr.supabase.co/functions/v1/ontology-inference-scheduler',
    headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJkcnZvd2FjZWN4bnJhYWl2bGhyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQwMzE1MjMsImV4cCI6MjA3OTYwNzUyM30.J67LWVWT51CdEFxiKVOE4QhGnu6KbYgH2XM0IHl3vsE"}'::jsonb
  ) as request_id;
  $$
);
```

### 방법 2: 매 15분마다 실행

**대량 데이터 또는 느린 처리 환경에 적합**

```sql
SELECT cron.schedule(
  'ontology-inference-every-15min',
  '*/15 * * * *', -- 매 15분
  $$
  SELECT net.http_post(
    url:='https://bdrvowacecxnraaivlhr.supabase.co/functions/v1/ontology-inference-scheduler',
    headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJkcnZvd2FjZWN4bnJhYWl2bGhyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQwMzE1MjMsImV4cCI6MjA3OTYwNzUyM30.J67LWVWT51CdEFxiKVOE4QhGnu6KbYgH2XM0IHl3vsE"}'::jsonb
  ) as request_id;
  $$
);
```

### 방법 3: 매 시간마다 실행

**소량 데이터 또는 배치 처리 선호 시 적합**

```sql
SELECT cron.schedule(
  'ontology-inference-hourly',
  '0 * * * *', -- 매 시간 정각
  $$
  SELECT net.http_post(
    url:='https://bdrvowacecxnraaivlhr.supabase.co/functions/v1/ontology-inference-scheduler',
    headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJkcnZvd2FjZWN4bnJhYWl2bGhyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQwMzE1MjMsImV4cCI6MjA3OTYwNzUyM30.J67LWVWT51CdEFxiKVOE4QhGnu6KbYgH2XM0IHl3vsE"}'::jsonb
  ) as request_id;
  $$
);
```

## Cron 표현식 가이드

| 표현식 | 설명 | 사용 시기 |
|--------|------|-----------|
| `*/5 * * * *` | 매 5분 | 실시간에 가까운 처리 필요 |
| `*/15 * * * *` | 매 15분 | 균형잡힌 처리 |
| `0 * * * *` | 매 시간 정각 | 배치 처리 선호 |
| `0 0 * * *` | 매일 자정 | 일일 배치 처리 |
| `0 */6 * * *` | 6시간마다 | 저빈도 처리 |

## 관리 명령어

### 현재 설정된 Cron Job 확인
```sql
SELECT * FROM cron.job;
```

### Cron Job 삭제
```sql
SELECT cron.unschedule('ontology-inference-every-5min');
```

### Cron Job 일시 중지
```sql
UPDATE cron.job 
SET active = false 
WHERE jobname = 'ontology-inference-every-5min';
```

### Cron Job 재개
```sql
UPDATE cron.job 
SET active = true 
WHERE jobname = 'ontology-inference-every-5min';
```

### Cron Job 실행 이력 확인
```sql
SELECT 
  jobid,
  runid,
  job_pid,
  database,
  username,
  command,
  status,
  return_message,
  start_time,
  end_time
FROM cron.job_run_details
WHERE jobid = (SELECT jobid FROM cron.job WHERE jobname = 'ontology-inference-every-5min')
ORDER BY start_time DESC
LIMIT 20;
```

## 모니터링

### 1. 큐 상태 확인
```sql
SELECT 
  status,
  COUNT(*) as count,
  AVG(retry_count) as avg_retries,
  MAX(created_at) as latest_created
FROM ontology_relation_inference_queue
GROUP BY status
ORDER BY count DESC;
```

### 2. 처리 속도 확인
```sql
SELECT 
  DATE_TRUNC('hour', processed_at) as hour,
  COUNT(*) as processed_count,
  AVG(EXTRACT(EPOCH FROM (processed_at - created_at))) as avg_processing_time_seconds
FROM ontology_relation_inference_queue
WHERE status = 'completed'
  AND processed_at > NOW() - INTERVAL '24 hours'
GROUP BY hour
ORDER BY hour DESC;
```

### 3. 실패 항목 확인
```sql
SELECT 
  id,
  entity_id,
  error_message,
  retry_count,
  created_at,
  processed_at
FROM ontology_relation_inference_queue
WHERE status = 'failed'
ORDER BY processed_at DESC
LIMIT 20;
```

### 4. Edge Function 로그 확인
- [ontology-inference-scheduler 로그](https://supabase.com/dashboard/project/bdrvowacecxnraaivlhr/functions/ontology-inference-scheduler/logs)
- [infer-entity-relations 로그](https://supabase.com/dashboard/project/bdrvowacecxnraaivlhr/functions/infer-entity-relations/logs)

## 트러블슈팅

### 문제 1: Cron Job이 실행되지 않음
**원인**: pg_cron 확장이 활성화되지 않음  
**해결**:
```sql
CREATE EXTENSION IF NOT EXISTS pg_cron;
SELECT * FROM cron.job; -- job이 생성되었는지 확인
```

### 문제 2: 큐가 계속 쌓임
**원인**: 처리 속도가 생성 속도보다 느림  
**해결**:
- Cron Job 주기 단축 (5분 → 2분)
- 배치 크기 증가 (10 → 20)
- 신뢰도 임계값 상향 (0.6 → 0.7)

### 문제 3: AI 호출 실패
**원인**: Lovable AI 요청 제한 또는 크레딧 부족  
**해결**:
- [Lovable 워크스페이스 사용량 확인](https://lovable.dev/settings/workspace/usage)
- 크레딧 충전
- 배치 크기 축소

### 문제 4: 관계 중복 생성
**원인**: 동일한 엔티티가 여러 번 큐에 추가됨  
**해결**:
```sql
-- 중복 큐 항목 정리
DELETE FROM ontology_relation_inference_queue a
USING ontology_relation_inference_queue b
WHERE a.id < b.id
  AND a.entity_id = b.entity_id
  AND a.status = 'pending';
```

## 수동 실행

### 특정 엔티티에 대한 즉시 추론
```typescript
const { data } = await supabase.functions.invoke('infer-entity-relations', {
  body: {
    entity_id: 'specific-entity-uuid',
    batch_size: 1
  }
});
```

### 대량 배치 처리
```typescript
const { data } = await supabase.functions.invoke('infer-entity-relations', {
  body: {
    batch_size: 50 // 한 번에 50개 처리
  }
});
```

## 성능 튜닝

### 최적 배치 크기 결정
```sql
-- 평균 처리 시간 확인
SELECT 
  AVG(EXTRACT(EPOCH FROM (processed_at - created_at))) as avg_seconds
FROM ontology_relation_inference_queue
WHERE status = 'completed'
  AND processed_at > NOW() - INTERVAL '1 day';
```

**권장 배치 크기**:
- 평균 < 10초: batch_size = 20
- 평균 10-30초: batch_size = 10
- 평균 > 30초: batch_size = 5

### Cron 주기 조정
```sql
-- 큐 증가 속도 확인
SELECT 
  DATE_TRUNC('minute', created_at) as minute,
  COUNT(*) as new_entities
FROM ontology_relation_inference_queue
WHERE created_at > NOW() - INTERVAL '1 hour'
GROUP BY minute
ORDER BY minute DESC;
```

**권장 Cron 주기**:
- 분당 < 2개 생성: 15분 주기
- 분당 2-5개 생성: 5분 주기
- 분당 > 5개 생성: 2분 주기 또는 배치 크기 증가

## 베스트 프랙티스

### 1. 점진적 배치 증가
- 초기: batch_size = 5, 매 15분
- 안정화 후: batch_size = 10, 매 5분
- 대용량: batch_size = 20, 매 2분

### 2. 실패 항목 재처리
```sql
-- 실패한 항목을 pending으로 재설정 (최대 3회 재시도까지)
UPDATE ontology_relation_inference_queue
SET 
  status = 'pending',
  error_message = NULL
WHERE status = 'failed'
  AND retry_count < 3;
```

### 3. 오래된 완료 항목 정리
```sql
-- 30일 이상 된 완료 항목 삭제
DELETE FROM ontology_relation_inference_queue
WHERE status = 'completed'
  AND processed_at < NOW() - INTERVAL '30 days';
```

## 참고 링크
- [Supabase Edge Functions](https://supabase.com/dashboard/project/bdrvowacecxnraaivlhr/functions)
- [Lovable AI 사용량](https://lovable.dev/settings/workspace/usage)
- [Phase 2 구현 문서](./PHASE2_REALTIME_SYNC_IMPLEMENTATION.md)
