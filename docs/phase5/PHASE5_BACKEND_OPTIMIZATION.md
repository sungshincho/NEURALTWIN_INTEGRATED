# Phase 5: 백엔드 구조 최적화 실행 요청서

> 작성일: 2026-02-25
> 전제조건: **Phase 4 (A&B) 완료** — Lovable 완전 탈피, EF 리팩토링, Vercel 배포, 프로덕션 전환 모두 정상
> 기반 데이터: REPO_ANALYSIS A~E, SHARED_TYPES_DESIGN, CROSS_REPO_COMPARISON, SYSTEM_ARCHITECTURE_ANALYSIS
> 실행 도구: Claude Code + Supabase MCP (Dashboard 직접 쿼리)
> 상태: Phase 4 완료 후 착수

---

## ⚠️ Phase 5 핵심 원칙

```
┌─────────────────────────────────────────────────────────────┐
│  DB 스키마 변경 = 프로덕션 즉시 반영                           │
│  Phase 4와 달리 "코드만 변경"이 아님                           │
│  모든 삭제/변경은 반드시 백업 → 검증 → 실행 순서               │
│  한 번에 하나씩, 되돌릴 수 있게                                │
└─────────────────────────────────────────────────────────────┘
```

---

## 0. Phase 5 전체 구조

```
Phase 5 (백엔드 최적화)
│
├── Sprint A: 전수 조사 (분석만, 변경 없음)        ← 1~2주
│   ├── Step 1: 테이블 사용 현황 완전 매핑
│   ├── Step 2: RPC 함수 사용 현황 완전 매핑
│   ├── Step 3: Edge Function 사용 현황 최종 확인
│   ├── Step 4: Storage 버킷 분석
│   └── Step 5: RLS 정책 & 인덱스 현황 감사
│
├── Sprint B: 정리 (삭제/통합, 신중하게)            ← 2~3주
│   ├── Step 6: 미사용 리소스 아카이브/삭제
│   ├── Step 7: 중복 테이블/컬럼 통합
│   └── Step 8: Dead RPC & Dead EF 정리
│
└── Sprint C: 강화 (보안/성능)                     ← 2주
    ├── Step 9: RLS 정책 적용 확대
    ├── Step 10: 인덱스 최적화
    └── Step 11: 쿼리 성능 튜닝
```

---

## Sprint A: 전수 조사 (분석만, DB 변경 없음)

> Sprint A의 모든 작업은 **읽기 전용**입니다. DB에 어떤 변경도 가하지 않습니다.
> 결과물은 분석 문서(`.md`)이며, Sprint B 실행의 근거가 됩니다.

---

### Step 1: 테이블 사용 현황 완전 매핑

**목표**: 153개 테이블 각각에 대해 "누가, 어떻게 사용하는가" 완전 매핑

**이미 아는 것**:
- C 분석 (EF 코드 역공학): 76개 테이블 확인
- D 분석 (OS 프론트엔드): 83개 테이블 확인
- E 분석 (웹사이트 프론트엔드): ~30개 테이블 추정
- 아직 미확인: 어떤 서비스도 참조하지 않는 테이블

**🤖 Claude Code 작업**:

```
프롬프트:

Supabase MCP를 사용해서 다음을 수행해줘:

1. `execute_sql`로 전체 테이블 목록 조회:
   SELECT schemaname, tablename FROM pg_tables 
   WHERE schemaname = 'public' ORDER BY tablename;

2. 각 테이블별로 다음 정보를 조회:
   - 행(row) 수: SELECT count(*) FROM {table};
   - 컬럼 수: information_schema.columns에서
   - 최근 INSERT 시점: created_at 또는 updated_at 컬럼의 MAX 값
   - Foreign Key 관계: information_schema.table_constraints
   - 인덱스 현황: pg_indexes

3. 코드 분석 결과(아래)와 교차 대조:
   - C 분석: EF에서 참조하는 76개 테이블
   - D 분석: OS 대시보드에서 참조하는 83개 테이블
   - E 분석: 웹사이트에서 참조하는 테이블

4. 결과를 TABLE_USAGE_MAP.md로 생성:

   각 테이블에 대해:
   | 테이블명 | 행 수 | 컬럼 수 | EF 참조 | 웹사이트 참조 | OS 참조 | RPC 참조 | 최종수정일 | 판정 |
   
   판정 기준:
   - ✅ ACTIVE: 1개 이상 서비스에서 참조 + 데이터 존재
   - ⚠️ STALE: 참조되지만 데이터 0건 또는 6개월 이상 미갱신
   - 🔴 UNUSED: 어떤 서비스에서도 참조하지 않음
   - 🔵 SYSTEM: auth, storage 등 Supabase 내부 테이블
```

**예상 결과 구조**:

```
153개 테이블 분류 예상:
├── ✅ ACTIVE: ~80~100개 (핵심 비즈니스)
├── ⚠️ STALE: ~20~30개 (개발 중 생성 후 미사용)
├── 🔴 UNUSED: ~15~30개 (고아 테이블)
└── 🔵 SYSTEM: ~5~10개 (Supabase 내부)
```

**🧑‍💻 사용자 확인 포인트**:
- UNUSED 판정된 테이블 중 "향후 사용 예정"인 것이 있는지 확인
- 비즈니스 로직으로만 판단 가능한 테이블 용도 확인

---

### Step 2: RPC 함수 사용 현황 완전 매핑

**목표**: 96개 RPC 함수 각각에 대해 "누가 호출하는가" 완전 매핑

**이미 아는 것**:
- EF에서 호출하는 RPC: 18개 (C 분석 완료)
- D에서 직접 호출: 18개 (D 분석 완료)
- 나머지 78개 중 일부는 DB 트리거/Policy에서 내부 호출, 일부는 미사용

**🤖 Claude Code 작업**:

```
프롬프트:

Supabase MCP를 사용해서:

1. 전체 RPC 함수 목록 + 시그니처 조회:
   SELECT routine_name, routine_type, data_type 
   FROM information_schema.routines 
   WHERE routine_schema = 'public';

2. 각 함수가 DB 트리거에서 호출되는지 확인:
   SELECT trigger_name, event_object_table, action_statement
   FROM information_schema.triggers
   WHERE trigger_schema = 'public';

3. 각 함수가 RLS Policy에서 사용되는지 확인:
   SELECT tablename, policyname, qual, with_check
   FROM pg_policies
   WHERE schemaname = 'public';

4. 이미 매핑된 데이터와 교차 대조:
   - EF 호출: 18개 (REPO_ANALYSIS_C 4.7)
   - D 직접 호출: 18개 (REPO_ANALYSIS_D 7.3)
   - E 직접 호출: 4개 (REPO_ANALYSIS_E 7.2 RPC)

5. RPC_USAGE_MAP.md 생성:

   | RPC 함수명 | EF 호출 | 웹사이트 호출 | OS 호출 | 트리거 사용 | Policy 사용 | 판정 |
   
   판정:
   - ✅ ACTIVE: 코드 또는 트리거/Policy에서 사용
   - 🔴 UNUSED: 어디에서도 참조되지 않음
   - 🔵 INTERNAL: DB 내부 트리거/Policy 전용
```

**예상 분류**:

```
96개 RPC 함수 분류 예상:
├── ✅ ACTIVE (코드 호출): ~30~40개
├── 🔵 INTERNAL (트리거/Policy): ~15~25개
└── 🔴 UNUSED: ~30~50개
```

---

### Step 3: Edge Function 사용 현황 최종 확인

**목표**: Phase 4에서 리팩토링된 50개 EF의 실제 트래픽 확인

**🤖 Claude Code 작업**:

```
프롬프트:

Supabase MCP `get_logs` 도구를 사용해서:

1. edge-function 로그 조회 (최근 24시간)
2. 각 EF별 호출 횟수 집계
3. Phase 4에서 삭제한 Dead EF 3개가 정말 호출 0인지 최종 확인
4. 호출 0인 EF 추가 식별

결과를 EF_TRAFFIC_REPORT.md로:
| EF명 | 24h 호출 수 | 평균 응답시간 | 에러율 | 호출 소스 | 판정 |
```

**⚠️ 중요**: Phase 4에서 이미 dead EF 3개를 처리했지만, 프로덕션 전환 후 **실제 로그**로 재확인해야 합니다.

---

### Step 4: Storage 버킷 분석

**목표**: 5개 Storage 버킷의 용량, 파일 수, 접근 빈도 파악

**🤖 Claude Code 작업**:

```
프롬프트:

Supabase MCP를 사용해서:

1. 각 버킷별 파일 목록 및 통계:
   - user-imports: 총 파일 수, 총 용량, 가장 오래된 파일
   - store-data: 총 파일 수, 총 용량
   - 3d-models: 총 파일 수, 총 용량
   - chat-attachments: 총 파일 수, 총 용량
   - avatars: 총 파일 수, 총 용량

2. execute_sql로 storage.objects 테이블 직접 조회:
   SELECT bucket_id, count(*), 
          sum(metadata->>'size')::bigint as total_bytes,
          min(created_at) as oldest,
          max(created_at) as newest
   FROM storage.objects
   GROUP BY bucket_id;

3. 고아 파일 식별:
   - upload_sessions에 매칭되지 않는 user-imports 파일
   - 삭제된 대화의 chat-attachments 파일
   - 프로필 변경 후 남은 이전 avatars 파일

4. STORAGE_AUDIT.md 생성
```

---

### Step 5: RLS 정책 & 인덱스 현황 감사

**목표**: 현재 RLS/인덱스 상태를 정확히 파악

**🤖 Claude Code 작업**:

```
프롬프트:

Supabase MCP를 사용해서:

1. RLS 활성화 현황:
   SELECT tablename, rowsecurity 
   FROM pg_tables 
   WHERE schemaname = 'public';

2. 기존 RLS 정책 목록:
   SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
   FROM pg_policies 
   WHERE schemaname = 'public';

3. 인덱스 현황:
   SELECT tablename, indexname, indexdef 
   FROM pg_indexes 
   WHERE schemaname = 'public';

4. Supabase Advisors 보안 검사:
   get_advisors(type: "security") + get_advisors(type: "performance")

5. RLS_INDEX_AUDIT.md 생성:
   
   섹션 1 — RLS 미적용 테이블 (rowsecurity = false):
   | 테이블명 | 행 수 | service_role 접근 EF 수 | 위험도 |
   
   섹션 2 — 인덱스 누락 추정:
   | 테이블명 | 행 수 | FK 컬럼 | 인덱스 존재 | WHERE/JOIN에서 사용 | 권장 |
   
   섹션 3 — 미사용 인덱스:
   | 인덱스명 | 테이블 | 마지막 사용 | idx_scan 횟수 | 권장 |
```

---

### Sprint A 완료 기준

```
□ TABLE_USAGE_MAP.md — 153개 테이블 전수 분류 완료
□ RPC_USAGE_MAP.md — 96개 RPC 전수 분류 완료
□ EF_TRAFFIC_REPORT.md — 50개 EF 실제 트래픽 확인
□ STORAGE_AUDIT.md — 5개 버킷 용량/고아파일 분석
□ RLS_INDEX_AUDIT.md — RLS/인덱스 현황 감사 완료
□ 🧑‍💻 사용자: UNUSED 판정 항목 최종 검토 완료
```

**🧑‍💻 사용자 정지 포인트**: Sprint A 완료 후 분석 결과를 검토하고, Sprint B 진행 여부를 결정합니다. UNUSED로 판정된 항목 중 보존해야 할 것이 있으면 이 시점에서 표시해주세요.

---

## Sprint B: 정리 (삭제/통합)

> ⚠️ Sprint B의 모든 작업은 **프로덕션 DB에 즉시 반영**됩니다.
> 반드시 Sprint A 분석 결과의 사용자 검토가 완료된 후에 시작합니다.

---

### Step 6: 미사용 리소스 아카이브/삭제

**원칙**: 삭제 전에 반드시 백업. 복원 가능한 상태에서만 삭제.

**🤖 Claude Code 작업**:

```
프롬프트:

⚠️ 이 작업은 프로덕션 DB를 변경합니다. 반드시 아래 순서를 따라주세요.

[사전 준비]
1. Supabase Dashboard에서 DB 백업 상태 확인
   (Settings → Database → Backups)

[6-A: UNUSED 테이블 아카이브]
TABLE_USAGE_MAP.md에서 🔴 UNUSED 판정 + 사용자가 "삭제 승인"한 테이블에 대해:

방법 1 — 스키마 이동 (권장, 안전):
  CREATE SCHEMA IF NOT EXISTS _archive;
  ALTER TABLE public.{table_name} SET SCHEMA _archive;

  → 테이블을 삭제하지 않고 _archive 스키마로 이동
  → 코드에서 접근 불가하지만 데이터 보존
  → 필요시 ALTER TABLE _archive.{table_name} SET SCHEMA public; 으로 복원

방법 2 — 실제 삭제 (데이터 0건이고 확실히 불필요한 경우만):
  DROP TABLE IF EXISTS public.{table_name} CASCADE;

매 테이블 이동/삭제 후:
  - 에러 없는지 확인
  - 영향받는 FK 관계 확인 (CASCADE 적용 범위)
  - 프론트엔드/EF 정상 동작 확인

[6-B: UNUSED RPC 삭제]
RPC_USAGE_MAP.md에서 🔴 UNUSED + 사용자 승인 함수:
  DROP FUNCTION IF EXISTS public.{function_name}({param_types});

[6-C: Storage 고아 파일 정리]
STORAGE_AUDIT.md에서 식별된 고아 파일:
  Supabase Storage API로 일괄 삭제 (execute_sql 사용)

모든 작업 완료 후:
  - supabase gen types typescript로 타입 재생성
  - 프론트엔드 빌드 확인 (타입 에러 없는지)
  - EF serve 확인
```

**작업 진행 방식 — 🐌 느리고 안전하게**:

```
1회차: 테이블 5개씩 이동 → 확인 → 다음 5개
2회차: RPC 10개씩 삭제 → 확인 → 다음 10개
3회차: Storage 파일 정리

각 회차 사이에 프론트엔드/EF 정상 동작 확인
문제 발생 시 즉시 중단 + 복원
```

**🧑‍💻 사용자 액션**:
- Sprint A에서 UNUSED 판정된 목록에 대해 최종 승인/거부 표시
- 아카이브 전 Supabase Dashboard에서 수동 백업 트리거 (또는 일일 자동 백업 확인)

---

### Step 7: 중복 테이블/컬럼 통합

**알려진 중복 후보** (분석에서 발견):

```
잠재 중복 영역:

1. KPI 관련:
   - daily_kpis_agg (집계용)
   - dashboard_kpis (대시보드용) 
   - kpis (정의용)
   - kpi_snapshots (스냅샷)
   → 실제 데이터 흐름 확인 후 통합 여부 결정

2. 인벤토리 관련:
   - inventory
   - inventory_history
   - inventory_levels
   - inventory_movements
   - realtime_inventory
   → 현재 사용 패턴 확인 필요

3. 존 메트릭 관련:
   - zone_metrics
   - zone_performance
   - zone_daily_metrics
   - hourly_metrics
   → 집계 주기별 분리가 의도적인지 확인

4. 동기화 로그 관련:
   - data_sync_logs
   - sync_logs
   - api_sync_logs
   → 단일 sync_logs로 통합 가능 여부

5. 온톨로지 관련 (7개):
   - ontology_entity_types, ontology_relation_types
   - ontology_entity_mappings, ontology_relation_mappings
   - ontology_mapping_cache
   - ontology_relation_inference_queue
   - ontology_schema_versions, ontology_schemas
   → 전부 사용 중인지, 일부 실험 테이블인지 확인
```

**🤖 Claude Code 작업**:

```
프롬프트:

위 중복 후보 각 그룹에 대해:

1. 실제 데이터 비교:
   - 각 테이블의 행 수, 컬럼 비교
   - 컬럼 이름/타입 유사도 분석
   - 동일 데이터가 양쪽에 존재하는지 샘플 확인

2. 코드 참조 비교:
   - 같은 데이터를 두 테이블에 쓰는 EF가 있는지
   - 프론트엔드에서 어느 테이블을 읽는지

3. 통합 판단:
   - 통합 가능: 마이그레이션 SQL 작성
   - 통합 불가 (의도적 분리): 이유 문서화
   - 판단 보류: 추가 정보 필요

4. DUPLICATE_ANALYSIS.md 생성
```

**⚠️ 중요**: 테이블 통합은 프로덕션 데이터 마이그레이션이 필요하므로, Sprint B에서 가장 신중해야 하는 작업입니다. 통합하려면 반드시 다음 순서를 따릅니다:

```
1. 대상 테이블 구조 비교 → 통합 스키마 설계
2. 마이그레이션 SQL 작성 (INSERT INTO ... SELECT ...)
3. 코드에서 참조하는 테이블명 모두 변경 (코드 먼저!)
4. NT_refactoring 브랜치에서 코드 변경 완료 + 빌드 확인
5. 마이그레이션 SQL 실행 (Supabase)
6. 코드 배포 (Vercel + EF deploy)
7. 기존 테이블 → _archive 스키마 이동
```

---

### Step 8: Dead RPC & Dead EF 최종 정리

**🤖 Claude Code 작업**:

```
프롬프트:

1. Sprint A에서 UNUSED 판정된 RPC 중 Step 6에서 아직 삭제하지 않은 것 정리
2. EF_TRAFFIC_REPORT.md에서 호출 0으로 확인된 EF 정리:
   - Supabase에서 함수 삭제: supabase functions delete {name}
   - 코드 디렉토리 삭제: rm -rf supabase/functions/{name}/
3. 프론트엔드에서 삭제된 EF를 호출하는 코드가 없는지 최종 grep 확인
```

---

### Sprint B 완료 기준

```
□ UNUSED 테이블 → _archive 스키마로 이동 완료
□ UNUSED RPC 함수 삭제 완료
□ Storage 고아 파일 정리 완료
□ 중복 테이블 분석 완료 (통합은 안전한 것만)
□ Dead EF 삭제 완료
□ supabase gen types typescript 재생성
□ 프론트엔드 빌드 정상 (website + os-dashboard)
□ 전체 EF supabase functions serve 정상
□ 프로덕션 사이트 정상 접속 확인
```

**🧑‍💻 사용자 정지 포인트**: Sprint B 완료 후, 정리 결과를 확인하고 Sprint C 진행 여부를 결정합니다.

---

## Sprint C: 강화 (보안/성능)

---

### Step 9: RLS 정책 적용 확대

**현재 상태** (Phase 4 분석):
- service_role 사용 60+회 → RLS 전면 우회
- Phase 4에서 3개 EF만 anon + RLS 전환 (submit-contact, retail-chatbot, knowledge-admin)

**🤖 Claude Code 작업**:

```
프롬프트:

RLS_INDEX_AUDIT.md 기반으로:

1. RLS 미적용 테이블 중 정책이 필요한 테이블 식별:
   
   우선순위 1 (사용자 데이터 — 필수):
   - profiles, organization_members, subscriptions, licenses
   - chat_conversations, chat_messages, chat_leads
   - user_activity_logs
   
   우선순위 2 (비즈니스 데이터 — 조직 격리):
   - stores, products, transactions, zones_dim
   - daily_kpis_agg, zone_daily_metrics
   - graph_entities, graph_relations
   
   우선순위 3 (시스템 데이터 — 나중에):
   - etl_runs, raw_imports, upload_sessions
   - ai_response_logs

2. 각 테이블에 대해 RLS 정책 SQL 생성:

   패턴 A — 조직 격리 (대부분의 비즈니스 테이블):
   ALTER TABLE {table} ENABLE ROW LEVEL SECURITY;
   CREATE POLICY "org_isolation" ON {table}
     FOR ALL
     USING (org_id = (SELECT get_user_org_id(auth.uid())));

   패턴 B — 사용자 본인 데이터:
   CREATE POLICY "own_data" ON {table}
     FOR ALL
     USING (user_id = auth.uid());

   패턴 C — 매장 + 조직 격리:
   CREATE POLICY "store_org_isolation" ON {table}
     FOR ALL
     USING (
       store_id IN (
         SELECT s.id FROM stores s 
         WHERE s.org_id = (SELECT get_user_org_id(auth.uid()))
       )
     );

3. ⚠️ 주의: RLS 활성화 전에 반드시 해당 테이블에 접근하는
   모든 EF가 service_role을 사용하는지 확인!
   anon_key를 사용하는 EF + RLS 미적용 → RLS 활성화 시 데이터 접근 차단
   
4. 실행 순서:
   a. 테이블 1개에 RLS 활성화 + 정책 추가
   b. 해당 테이블을 사용하는 모든 EF 정상 확인
   c. 해당 테이블을 사용하는 프론트엔드 정상 확인
   d. 다음 테이블로 이동

5. RLS_MIGRATION_LOG.md 생성 (실행 기록)
```

---

### Step 10: 인덱스 최적화

**🤖 Claude Code 작업**:

```
프롬프트:

RLS_INDEX_AUDIT.md 기반으로:

1. 누락 인덱스 추가:
   
   FK 컬럼 인덱스 (필수):
   - 모든 *_id 컬럼 중 인덱스가 없는 것
   - 특히 JOIN/WHERE에서 자주 사용되는 컬럼
   
   검색 성능 인덱스:
   - 자주 필터링되는 컬럼 (status, org_id, store_id, created_at)
   - 정렬에 사용되는 컬럼
   
   생성 SQL 예:
   CREATE INDEX CONCURRENTLY idx_{table}_{column} 
   ON {table}({column});
   
   ⚠️ CONCURRENTLY 필수 — 테이블 락 방지

2. 미사용 인덱스 정리:
   
   pg_stat_user_indexes에서 idx_scan = 0인 인덱스:
   DROP INDEX CONCURRENTLY IF EXISTS {index_name};
   
   ⚠️ PK/UNIQUE 인덱스는 절대 삭제하지 않음

3. 복합 인덱스 추가 검토:
   
   자주 함께 사용되는 컬럼 조합:
   - (org_id, store_id) — 대부분의 비즈니스 쿼리
   - (store_id, created_at) — 시계열 조회
   - (conversation_id, created_at) — 채팅 이력

4. INDEX_OPTIMIZATION_LOG.md 생성
```

---

### Step 11: 쿼리 성능 튜닝

**🤖 Claude Code 작업**:

```
프롬프트:

1. Supabase Dashboard에서 느린 쿼리 확인:
   SELECT query, calls, total_time, mean_time, rows
   FROM pg_stat_statements
   ORDER BY mean_time DESC
   LIMIT 20;

2. 각 느린 쿼리에 대해:
   - EXPLAIN ANALYZE 실행
   - Sequential Scan → Index Scan 전환 가능 여부
   - 불필요한 SELECT * → 필요한 컬럼만 SELECT
   - N+1 쿼리 패턴 식별

3. RPC 함수 최적화:
   - 96개 중 ACTIVE 판정 함수의 실행 계획 검토
   - 불필요한 서브쿼리 제거
   - materialized view 도입 검토 (KPI 집계 등)

4. QUERY_OPTIMIZATION_REPORT.md 생성
```

---

### Sprint C 완료 기준

```
□ RLS 정책: 우선순위 1 테이블 전체 적용
□ RLS 정책: 우선순위 2 테이블 최소 50% 적용
□ 누락 인덱스 추가 완료
□ 미사용 인덱스 정리 완료
□ 느린 쿼리 Top 10 최적화
□ Supabase Advisors 보안 경고 0건
□ Supabase Advisors 성능 경고 ≤3건
□ 프로덕션 사이트 정상 동작 확인
```

---

## Phase 5 전체 타임라인

```
        Sprint A              Sprint B               Sprint C
       (1~2주)               (2~3주)                (2주)
    ┌──────────┐         ┌──────────┐          ┌──────────┐
    │  전수     │         │  정리     │          │  강화     │
    │  조사     │    →    │  삭제     │    →     │  보안     │
    │  (읽기만) │  검토   │  통합     │   검토   │  성능     │
    └────┬─────┘  후     └────┬─────┘   후     └──────────┘
         │                    │
    🧑‍💻 사용자              🧑‍💻 사용자
    UNUSED 검토            정리 결과 확인
    승인/거부              Sprint C 결정
```

---

## Phase 5 성공 지표 (KPI)

| 지표 | Phase 4 완료 시 | Phase 5 목표 |
|------|:--------------:|:-----------:|
| 전체 테이블 수 | 153개 | **≤120개** (UNUSED 아카이브) |
| 전체 RPC 수 | 96개 | **≤60개** (UNUSED 삭제) |
| 전체 EF 수 | ~47개 | **≤45개** (Dead 정리) |
| RLS 적용 테이블 비율 | ~5% | **>50%** |
| 미사용 인덱스 | 미파악 | **0개** |
| Storage 고아 파일 | 미파악 | **0건** |
| Supabase Security Advisors | 미확인 | **경고 0건** |
| 평균 쿼리 응답 시간 | 미측정 | **기준선 대비 30% 개선** |

---

## 부록: 위험 관리

### 되돌리기 절차

| 상황 | 복원 방법 |
|------|---------|
| 아카이브한 테이블이 필요 | `ALTER TABLE _archive.{name} SET SCHEMA public;` |
| 삭제한 RPC가 필요 | Supabase DB 백업에서 복원 또는 코드에서 재생성 |
| RLS로 서비스 장애 | `ALTER TABLE {name} DISABLE ROW LEVEL SECURITY;` (즉시) |
| 인덱스 삭제 후 성능 저하 | `CREATE INDEX CONCURRENTLY` 재생성 |
| Storage 파일 복구 | Supabase 일일 백업에서 복원 (Storage 포함) |

### 절대 하지 않는 것

```
❌ 백업 없이 테이블 DROP
❌ 한 번에 10개 이상 테이블 동시 변경
❌ RLS 활성화 후 확인 없이 다음 테이블 진행
❌ CONCURRENTLY 없이 대형 테이블 인덱스 생성
❌ 프로덕션 확인 없이 Sprint B/C 연속 실행
❌ PK/UNIQUE 인덱스 삭제
❌ 트리거/Policy에서 사용 중인 RPC 삭제
```

---

## 부록: Phase 4 → Phase 5 인수 체크리스트

Phase 5 시작 전에 Phase 4 완료를 확인합니다:

```
Phase 4 완료 확인:
□ Lovable 코드 완전 제거 (lovable-tagger, AI Gateway)
□ 50개 EF _shared/ 전환 완료
□ Vercel 프로덕션 배포 정상
□ CI/CD 파이프라인 동작 중
□ Supabase Dashboard Secrets 전환 완료
□ 기존 4개 레포 아카이브
□ neuraltwin.com 프로덕션 라이브

위 항목 모두 ✅인 경우만 Phase 5 시작
```

---

*작성일: 2026-02-25*
*기반 데이터: 프로젝트 분석 문서 16개 + Phase 4 실행 결과*
*다음 단계: Phase 4 (A&B) 완료 → Sprint A 전수 조사 시작*
