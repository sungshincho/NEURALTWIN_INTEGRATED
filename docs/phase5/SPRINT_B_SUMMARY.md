# Phase 5 Sprint B — 정리 및 최적화 실행 완료 보고서

> 실행일: 2026-02-26
> 실행 도구: Supabase MCP (execute_sql), Supabase CLI, Vercel
> 프로젝트: bdrvowacecxnraaivlhr
> 전제: Sprint A 전수 조사 완료 (153 테이블, 85 RPC, 47 EF, 5 Storage)

---

## 최종 현황 (한눈에 보기)

```
NeuralTwin Backend — Sprint B 정리 결과
═══════════════════════════════════════════════════════════════
                      Before     After      Change
─────────────────────────────────────────────────────────────
  public 테이블         153        105       -48 (→ _archive)
  _archive 테이블         0         48       +48
  RPC 함수              236        211       -25 삭제
  Edge Functions         47         45       -2 삭제 (CLI)
  database.types.ts   ~6,400줄   ~3,500줄   -2,905줄 (-45%)
  Storage 버킷 보안      0/5        2/5      avatars + chat-attachments 제한 적용
═══════════════════════════════════════════════════════════════
```

---

## Step 6-A: UNUSED 테이블 아카이브 (48개) ✅

### 방법
- `CREATE SCHEMA IF NOT EXISTS _archive;`
- `ALTER TABLE public.{name} SET SCHEMA _archive;` (5개씩 10배치)
- 매 배치 후 테이블 수 + FK 깨짐 검증

### 배치 실행 결과

| 배치 | 분류 | 수 | 결과 |
|------|------|-----|------|
| 1-1, 1-2 | Deprecated/Replaced | 10 | ✅ 153→143 |
| 2-1 ~ 2-5 | Unimplemented Features | 22 | ✅ 143→121 |
| 3-1, 3-2 | Partial/Legacy | 10 | ✅ 121→111 |
| 4 | Fully Unused | 6 | ✅ 111→105 |

### FK 크로스 스키마 이슈 해결

| FK Constraint | Source → Target | 데이터 | 조치 |
|--------------|----------------|--------|------|
| `recommendation_applications_scenario_id_fkey` | public → _archive.scenarios | 0건 참조 (전부 NULL) | DROP CONSTRAINT ✅ |
| `api_sync_logs_sync_endpoint_id_fkey` | public → _archive.sync_endpoints | 0행 테이블 | DROP CONSTRAINT ✅ |

> 상세: [SPRINT_B_STEP6_RESULT.md](./SPRINT_B_STEP6_RESULT.md)

---

## Step 6-B: UNUSED RPC 삭제 (25개) ✅

### 방법
- `DROP FUNCTION IF EXISTS public.{name}({exact_signature});`
- 시그니처 불일치 시 `pg_proc`에서 조회 후 재시도
- pg_cron 미설치 확인 (cron 충돌 없음)

### 배치 실행 결과

| 배치 | 카테고리 | 수 | RPC 수 |
|------|---------|-----|--------|
| B-1 | Sync/Import | 7 | 236→229 |
| B-2 | Sync/Import | 7 | 229→222 |
| B-3 | Utility | 6 | 222→216 |
| B-4 | Cache + User + Data | 5 | 216→211 |

### 보존된 RPC (삭제하지 않음)

| Category | Count | Reason |
|----------|-------|--------|
| Analytics/Reporting | 9 | 향후 대시보드 확장 가능 |
| VMD/Furniture | 6 | D팀 확장 예정 |
| Data Management | 4 | ensure_system_context_connections 등 |
| INTERNAL Auth | 8 | RLS 정책 의존 — 삭제 금지 |

> 상세: [SPRINT_B_STEP6_RESULT.md](./SPRINT_B_STEP6_RESULT.md)

---

## Step 6-C: Storage 정리 ✅

### 중복 파일

| 항목 | 결과 |
|------|------|
| 고아 파일 | 0건 |
| 중복 products.csv 3건 (2.3KB) | 스킵 — Supabase `storage.protect_delete()` 보호. Storage API 필요 |

### 버킷 보안 강화

| 버킷 | file_size_limit | allowed_mime_types | 변경 |
|------|----------------|-------------------|------|
| `avatars` | 5 MB | image/jpeg, png, webp, gif | ✅ 적용 (이전: 제한 없음) |
| `chat-attachments` | 10 MB | image/*, pdf, text | ✅ 적용 (이전: 제한 없음) |
| `3d-models` | — | — | 기존 유지 |
| `store-data` | — | — | private, 기존 유지 |
| `user-imports` | 50 MB | csv, excel, json 등 | 기존 유지 |

---

## Step 7: 중복 테이블 통합 분석 ✅

5개 그룹 (15개 테이블) 분석 결과: **전부 통합 불필요**

| 그룹 | 테이블 | 판단 | 근거 |
|------|--------|------|------|
| 1. KPI | daily_kpis_agg, dashboard_kpis | 통합 불가 | 스키마 상이 (29 vs 22 cols), 데이터 겹침 0건, L3 자동 집계 vs 유저별 퍼널 |
| 2. Inventory | inventory_levels, inventory_movements, realtime_inventory | 통합 불가 | State / Event / POS 외부연동 — 3가지 데이터 모델 |
| 3. Zone Metrics | zone_daily_metrics, hourly_metrics | 통합 불가 | zone_id(공간) vs hour(시간) 축 상이 |
| 4. Sync Logs | data_sync_logs, api_sync_logs | 통합 보류 | 둘 다 0행, 스키마 크기 2.6배 차이, 향후 재검토 |
| 5. Ontology | 6개 테이블 | 통합 불가 | 정규화된 6테이블 계층 구조 (타입→매핑→캐시→버전) |

> 상세: [DUPLICATE_ANALYSIS.md](./DUPLICATE_ANALYSIS.md)

---

## Step 8: Dead EF/RPC 최종 정리 ✅

### 8-A: Dead EF 삭제

| EF | 코드 디렉토리 | 프론트엔드 참조 | Supabase CLI | 결과 |
|----|-------------|---------------|-------------|------|
| `generate-template` | 이전 PR에서 삭제 | DataImportWidget.tsx → 참조 제거, 로컬 CSV 직접 사용으로 전환 | `supabase functions delete` ✅ | 완료 |
| `upscale-image` | 이전 PR에서 삭제 | 참조 없음 | `supabase functions delete` ✅ | 완료 |

### 8-B: 잔여 RPC 확인

25개 삭제 대상 전수 재확인 → **잔여 0건** ✅

### 8-C: Phantom EF 현황 (10개)

| 분류 | EF | 수 | 상태 |
|------|-----|---|------|
| 해결됨 | validate-and-fix-csv | 1 | 코멘트만 남음 (인라인 대체 완료) |
| 안전 (graceful fallback) | apply-sample-data, fetch-db-schema | 2 | 에러 핸들링 있음, 향후 EF 구현 시 활성화 |
| POS 미구현 | sync-pos-data, pos-oauth-callback, pos-oauth-start | 3 | POS 기능 구현 전까지 비활성 |
| 참조 없음 | analyze-zone-performance, generate-vmd-recommendations, calculate-advanced-analytics, generate-report | 4 | 코드/Supabase 모두 미존재, 위험 없음 |

> 상세: [SPRINT_B_STEP8_RESULT.md](./SPRINT_B_STEP8_RESULT.md)

---

## 검증 결과

### 타입 재생성
```
npx supabase gen types typescript --project-id bdrvowacecxnraaivlhr
→ packages/types/src/database.types.ts 재생성 완료
→ 283 insertions, 3,188 deletions (-2,905줄, -45%)
```

### 빌드 검증

| 검증 항목 | 결과 | 비고 |
|----------|------|------|
| `pnpm type-check` | ✅ 7/7 tasks passed | types, shared, ui, website, os-dashboard |
| `pnpm build` | ✅ 5/5 tasks passed | 전체 워크스페이스 빌드 성공 |
| `pnpm lint` | ⚠️ 기존 이슈 | website 47개, os-dashboard 980개 — Sprint B 변경 관련 에러 0건 |

### 프로덕션 접속 확인

| 사이트 | URL | 상태 |
|--------|-----|------|
| Website | neuraltwin-integrated-website.vercel.app | ✅ 정상 ("NEURALTWIN" 타이틀 확인) |
| OS Dashboard | neuraltwin-os.vercel.app | ✅ 정상 ("NEURALTWIN OS" 타이틀, 다크모드 동작) |

### Dead EF 삭제 확인

| EF | Supabase 삭제 | 코드 참조 | 상태 |
|----|-------------|----------|------|
| `generate-template` | ✅ Deleted | ✅ 0건 | 완전 제거 |
| `upscale-image` | ✅ Deleted | ✅ 0건 | 완전 제거 |

---

## Sprint B 완료 체크리스트

```
✅ UNUSED 테이블 48개 → _archive 스키마로 이동 완료
✅ UNUSED RPC 함수 25개 삭제 완료
✅ Storage 버킷 보안 강화 완료 (avatars 5MB, chat-attachments 10MB)
✅ 중복 테이블 분석 완료 → DUPLICATE_ANALYSIS.md (통합 불필요 확인)
✅ Dead EF 2개 삭제 완료 (generate-template, upscale-image)
✅ 프론트엔드에서 삭제된 EF/RPC 호출 없음 확인
✅ supabase gen types typescript 재생성 (-2,905줄)
✅ 프론트엔드 빌드 정상 (type-check 7/7, build 5/5)
✅ 프로덕션 사이트 정상 접속 확인 (website + os-dashboard)
```

---

## 산출물 목록

| 파일 | 내용 | Sprint |
|------|------|--------|
| [SPRINT_A_SUMMARY.md](./SPRINT_A_SUMMARY.md) | 백엔드 전수 조사 완료 보고서 | A |
| [TABLE_USAGE_MAP.md](./TABLE_USAGE_MAP.md) | 153개 테이블 사용 현황 | A |
| [RPC_USAGE_MAP.md](./RPC_USAGE_MAP.md) | 85개 RPC 사용 현황 | A |
| [EF_TRAFFIC_REPORT.md](./EF_TRAFFIC_REPORT.md) | 47개 EF 트래픽 분석 | A |
| [EF_LIVE_TRAFFIC.md](./EF_LIVE_TRAFFIC.md) | 24h 라이브 트래픽 | A |
| [STORAGE_AUDIT.md](./STORAGE_AUDIT.md) | 5개 Storage 버킷 감사 | A |
| [RLS_INDEX_AUDIT.md](./RLS_INDEX_AUDIT.md) | RLS 정책 + 인덱스 감사 | A |
| [SPRINT_B_EXECUTION_PLAN.md](./SPRINT_B_EXECUTION_PLAN.md) | Sprint B 실행 계획서 | B |
| [SPRINT_B_STEP6_RESULT.md](./SPRINT_B_STEP6_RESULT.md) | Step 6 실행 결과 (테이블/RPC/Storage) | B |
| [DUPLICATE_ANALYSIS.md](./DUPLICATE_ANALYSIS.md) | Step 7 중복 테이블 분석 | B |
| [SPRINT_B_STEP8_RESULT.md](./SPRINT_B_STEP8_RESULT.md) | Step 8 실행 결과 (Dead EF/정합성) | B |
| **SPRINT_B_SUMMARY.md** | **Sprint B 완료 보고서 (본 문서)** | **B** |

---

## 복원 가이드

```sql
-- 테이블 복원 (개별)
ALTER TABLE _archive.{table_name} SET SCHEMA public;

-- FK 제약 복원 (필요시)
ALTER TABLE public.recommendation_applications
  ADD CONSTRAINT recommendation_applications_scenario_id_fkey
  FOREIGN KEY (scenario_id) REFERENCES public.scenarios(id);
ALTER TABLE public.api_sync_logs
  ADD CONSTRAINT api_sync_logs_sync_endpoint_id_fkey
  FOREIGN KEY (sync_endpoint_id) REFERENCES public.sync_endpoints(id);

-- RPC 복원: Supabase 일일 백업에서 함수 소스 추출 후 CREATE FUNCTION 재실행
-- EF 복원: git history에서 삭제된 EF 복원 후 supabase functions deploy
```

---

## 다음 단계 (Sprint C 제안)

| 항목 | 내용 | 우선순위 |
|------|------|---------|
| 보안 긴급 수정 | chat_context_memory RLS 활성화, RLS 항상-TRUE 12건 수정 | P0 |
| 성능 최적화 | Critical FK 인덱스 11개 생성, 미사용 인덱스 대형 10개 DROP | P1 |
| Phantom EF 처리 | POS 3개 (구현 or 제거), apply-sample-data/fetch-db-schema (구현) | P1 |
| 코드 정리 | lint 에러 수정 (website 47, os-dashboard 980) | P2 |
| Sync Logs 재검토 | data_sync_logs + api_sync_logs 통합 여부 (데이터 축적 후) | P2 |

---

> 작성일: 2026-02-26
> 실행자: Claude Code (Supabase MCP + Supabase CLI + Vercel)
> 상태: **Sprint B 완료**
> 다음: 사용자 검토 후 Sprint C 진행 여부 결정
