# API 동기화 Cron Job 설정 가이드

## 개요

API 연동 스케줄이 자동으로 실행되도록 Supabase의 `pg_cron`을 사용하여 Cron Job을 설정합니다.

---

## 1. 필수 확장 기능 활성화

Supabase 대시보드에서 다음 SQL을 실행하여 필요한 확장 기능을 활성화합니다:

```sql
-- pg_cron 확장 활성화 (Cron Job 스케줄링)
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- pg_net 확장 활성화 (HTTP 요청)
CREATE EXTENSION IF NOT EXISTS pg_net;
```

---

## 2. Cron Job 생성

### ⚠️ 중요: 프로젝트별 설정 필요

아래 SQL을 실행하기 전에 **반드시** 다음 값들을 프로젝트에 맞게 수정해야 합니다:

- `YOUR_PROJECT_REF`: Supabase 프로젝트 참조 ID (예: `bdrvowacecxnraaivlhr`)
- `YOUR_ANON_KEY`: Supabase Anon Key (설정 > API에서 확인 가능)

### Cron Job SQL 스크립트

```sql
-- 5분마다 스케줄 실행 확인 및 동기화
SELECT cron.schedule(
  'api-sync-schedule-runner',
  '*/5 * * * *', -- 5분마다 실행
  $$
  SELECT
    net.http_post(
        url:='https://YOUR_PROJECT_REF.supabase.co/functions/v1/schedule-runner',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer YOUR_ANON_KEY"}'::jsonb,
        body:=concat('{"time": "', now(), '"}')::jsonb
    ) as request_id;
  $$
);
```

### 설정 예시

프로젝트 ID가 `bdrvowacecxnraaivlhr`이고 Anon Key가 `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`인 경우:

```sql
SELECT cron.schedule(
  'api-sync-schedule-runner',
  '*/5 * * * *',
  $$
  SELECT
    net.http_post(
        url:='https://bdrvowacecxnraaivlhr.supabase.co/functions/v1/schedule-runner',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."}'::jsonb,
        body:=concat('{"time": "', now(), '"}')::jsonb
    ) as request_id;
  $$
);
```

---

## 3. Cron Job 실행 주기 변경

필요에 따라 실행 주기를 변경할 수 있습니다:

```sql
-- 매분 실행
'* * * * *'

-- 5분마다 실행 (기본값)
'*/5 * * * *'

-- 10분마다 실행
'*/10 * * * *'

-- 매 시간 정각 실행
'0 * * * *'

-- 매일 자정 실행
'0 0 * * *'
```

---

## 4. Cron Job 관리

### 등록된 Cron Job 확인

```sql
SELECT * FROM cron.job;
```

### Cron Job 삭제

```sql
SELECT cron.unschedule('api-sync-schedule-runner');
```

### Cron Job 실행 이력 확인

```sql
SELECT * FROM cron.job_run_details
ORDER BY start_time DESC
LIMIT 20;
```

---

## 5. 동작 방식

1. **pg_cron**이 설정된 주기(기본 5분)마다 `schedule-runner` Edge Function을 호출합니다
2. `schedule-runner`는 데이터베이스에서 실행 대기 중인 스케줄(`next_run_at`이 현재 시각 이전)을 조회합니다
3. 각 스케줄에 대해 `sync-api-data` Edge Function을 호출하여 실제 데이터 동기화를 수행합니다
4. 동기화 결과는 `data_sync_logs` 테이블에 기록됩니다
5. 스케줄의 `last_run_at`, `next_run_at`, `last_status`가 업데이트됩니다

```
pg_cron (5분마다)
    ↓
schedule-runner Edge Function
    ↓
실행 대기 중인 스케줄 조회
    ↓
각 스케줄마다 sync-api-data 호출
    ↓
API 데이터 동기화 → 데이터베이스 저장
    ↓
로그 및 스케줄 상태 업데이트
```

---

## 6. 수동 실행 테스트

Cron Job을 설정하기 전에 Edge Function을 수동으로 테스트할 수 있습니다:

```bash
# schedule-runner 수동 실행
curl -X POST 'https://YOUR_PROJECT_REF.supabase.co/functions/v1/schedule-runner' \
  -H 'Authorization: Bearer YOUR_ANON_KEY' \
  -H 'Content-Type: application/json' \
  -d '{"time": "2025-01-26T12:00:00Z"}'

# 특정 스케줄의 sync-api-data 수동 실행
curl -X POST 'https://YOUR_PROJECT_REF.supabase.co/functions/v1/sync-api-data' \
  -H 'Authorization: Bearer YOUR_ANON_KEY' \
  -H 'Content-Type: application/json' \
  -d '{"scheduleId": "YOUR_SCHEDULE_ID", "manualRun": true}'
```

---

## 7. 트러블슈팅

### Cron Job이 실행되지 않는 경우

1. **확장 기능 확인**
   ```sql
   SELECT * FROM pg_extension WHERE extname IN ('pg_cron', 'pg_net');
   ```

2. **Cron Job 등록 확인**
   ```sql
   SELECT * FROM cron.job WHERE jobname = 'api-sync-schedule-runner';
   ```

3. **실행 로그 확인**
   ```sql
   SELECT * FROM cron.job_run_details
   WHERE jobid = (SELECT jobid FROM cron.job WHERE jobname = 'api-sync-schedule-runner')
   ORDER BY start_time DESC
   LIMIT 10;
   ```

### Edge Function 오류 확인

Supabase 대시보드 > Edge Functions > 로그에서 `schedule-runner`와 `sync-api-data`의 실행 로그를 확인하세요.

### 네트워크 권한 확인

`pg_net`이 외부 URL에 접근할 수 있는지 확인:

```sql
SELECT net.http_get('https://httpbin.org/get') as response;
```

---

## 8. 보안 고려사항

- Anon Key는 공개되어도 안전하지만, RLS 정책이 올바르게 설정되어 있는지 확인하세요
- Service Role Key는 절대 클라이언트나 Cron Job SQL에 사용하지 마세요
- Cron Job은 Supabase 서버 내부에서 실행되므로 외부 노출 위험이 없습니다

---

## 9. 다음 단계

Cron Job 설정 후:
1. API 연동 페이지에서 스케줄을 생성하세요
2. "지금 동기화" 버튼으로 수동 테스트를 해보세요
3. 동기화 로그 탭에서 실행 이력을 확인하세요
4. 5분 후 자동 동기화가 실행되는지 확인하세요
