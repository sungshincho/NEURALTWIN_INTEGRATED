# Phase 5 Sprint A — 백엔드 전수 조사 완료 보고서

> 작성일: 2026-02-26 | 기간: 2026-02-25 ~ 2026-02-26
> 방법론: 코드 정적 분석 + Supabase MCP 프로덕션 로그/쿼리 검증

---

## 완료 체크리스트

| Step | 산출물 | 대상 | 상태 |
|------|--------|------|------|
| Step 1 | [TABLE_USAGE_MAP.md](./TABLE_USAGE_MAP.md) | 153개 테이블 전수 분류 | ✅ 완료 |
| Step 2 | [RPC_USAGE_MAP.md](./RPC_USAGE_MAP.md) | 85개 RPC 전수 분류 | ✅ 완료 |
| Step 3 | [EF_TRAFFIC_REPORT.md](./EF_TRAFFIC_REPORT.md) + [EF_LIVE_TRAFFIC.md](./EF_LIVE_TRAFFIC.md) | 47개 EF + 라이브 트래픽 | ✅ 완료 |
| Step 4 | [STORAGE_AUDIT.md](./STORAGE_AUDIT.md) | 5개 Storage 버킷 | ✅ 완료 |
| Step 5 | [RLS_INDEX_AUDIT.md](./RLS_INDEX_AUDIT.md) | RLS 정책 + 인덱스 감사 | ✅ 완료 |

---

## 1. 백엔드 전체 현황 (한눈에 보기)

```
NeuralTwin Backend Health
═══════════════════════════════════════════════════════════════
                      Total    Active   Unused   Efficiency
─────────────────────────────────────────────────────────────
  Tables               153      100       48        65%
  RPCs                  85       33       44        39%
  Edge Functions        47        2*      12        ~74%**
  Storage Buckets        5        2        3        40%
─────────────────────────────────────────────────────────────
  * 24h 라이브 트래픽 기준 활성 EF (코드 참조 기준 21개)
  ** DEAD 2 + PHANTOM 10 제외 시
```

---

## 2. 레이어별 분석 요약

### 2.1 데이터베이스 (153개 테이블)

| 분류 | 수 | 비율 | 설명 |
|------|-----|------|------|
| ✅ ACTIVE | 100 | 65% | 프론트엔드/EF에서 직접 참조 |
| ⚠️ STALE | 3 | 2% | 테스트 전용 또는 RPC-only |
| 🔵 SYSTEM | 2 | 1% | 내부 헬퍼/뷰 |
| 🔴 UNUSED | 48 | 31% | 코드 참조 0 → **삭제 후보** |

**UNUSED 48개 내역**: 미구현 기능 22개, deprecated 10개, 부분 레거시 10개, 완전 미사용 6개

### 2.2 RPC 함수 (85개)

| 분류 | 수 | 비율 | 설명 |
|------|-----|------|------|
| ✅ ACTIVE | 33 | 39% | 프론트엔드/EF에서 직접 호출 |
| 🔵 INTERNAL | 8 | 9% | RLS 정책 내부 사용 (삭제 금지) |
| 🔴 UNUSED | 44 | 52% | 호출 없음 → **삭제 후보** |

**UNUSED 44개 내역**: Sync/Import 중복 14개, Analytics UI 미연결 9개, VMD 확장용 6개, 기타 유틸 15개

**핵심 발견**: 14개 Sync RPC가 EF 내부 SQL과 중복 → 통합 필요

### 2.3 Edge Functions (47개 디렉토리)

| 분류 | 수 | 설명 |
|------|-----|------|
| ✅ ACTIVE (코드 참조) | 21 | 프론트엔드 `.invoke()` 호출 |
| ✅ ACTIVE (EF-to-EF) | 1 | 내부 파이프라인 호출 |
| ⚠️ ENDPOINT | 23 | HTTP/cron — 코드 외 경로로 호출 가능 |
| 🔴 DEAD (확정) | **2** | `generate-template`, `upscale-image` — 트래픽 0 + 참조 0 |
| 🟡 PHANTOM (확정) | **10** | 프론트엔드 호출하나 디렉토리 미존재 → 런타임 에러 |

**라이브 트래픽 (24h)**: 62 POST 총 호출 — `environment-proxy` 55건, `retail-chatbot` 7건만 활성

### 2.4 Storage (5개 버킷)

| 버킷 | 파일 수 | 용량 | 상태 |
|------|--------|------|------|
| 3d-models | 307 | 119.9 MB | ✅ 활성 (products 73MB, furniture 12MB) |
| user-imports | 5 | 3.3 KB | ✅ 활성 (중복 4건) |
| avatars | 0 | 0 | 🔴 비어있음 |
| chat-attachments | 0 | 0 | 🔴 비어있음 |
| store-data | 0 | 0 | 🔴 비어있음 |

**보안 이슈**: `avatars`, `chat-attachments` 버킷이 public + 파일 크기/MIME 제한 없음

### 2.5 보안 & 성능 (RLS/인덱스)

#### 보안

| 이슈 | 수 | 심각도 |
|------|-----|--------|
| RLS 미적용 테이블 | 2 | 🔴 Critical (`chat_context_memory`) |
| RLS 활성 + 정책 0개 | 7 | 🟠 Medium (service_role만 접근) |
| RLS 항상-TRUE 정책 | 12 | 🟠 Medium (실질 무효화) |
| search_path 변경 가능 함수 | 77 | 🟠 Medium |

#### 성능

| 이슈 | 수 | 영향도 |
|------|-----|--------|
| FK 인덱스 누락 (Critical, 행 1K+) | 11 | 🔴 High (`zone_events` 37K행) |
| 미사용 인덱스 | 147 | 🟠 Medium (23.5 MB 낭비) |
| 중복 인덱스 | 10 | 🟡 Low |
| 다중 permissive 정책 | 1,020 | 🟠 Medium (쿼리 성능) |

---

## 3. 정리 대상 전체 집계 (Sprint B 입력)

### 삭제 확정 (라이브 트래픽 + 코드 분석 교차 검증)

| 카테고리 | 수 | 즉시 삭제 가능 | 사용자 확인 필요 |
|---------|-----|--------------|----------------|
| UNUSED 테이블 | 48 | 6 (완전 미사용) | 42 (미구현/deprecated) |
| UNUSED RPC | 44 | 15 (유틸/캐시) | 29 (analytics/sync/VMD) |
| DEAD EF | 2 | **2** (확정) | 0 |
| PHANTOM EF 참조 | 10 | 0 | **10** (생성 or 제거 결정) |
| 빈 Storage 버킷 | 3 | 0 | 3 (사용 계획 확인) |
| 미사용 인덱스 | 147 | ~130 (PK 외) | 17 (검색용 유지?) |
| 중복 인덱스 | 10 | **10** | 0 |

### 예상 정리 효과

| 항목 | 현재 | 정리 후 | 감소율 |
|------|------|--------|--------|
| 테이블 수 | 153 | ~105 | -31% |
| RPC 수 | 85 | ~41 | -52% |
| EF 디렉토리 | 47 | 45 | -4% |
| 인덱스 수 | ~300+ | ~150 | -50% |
| 인덱스 디스크 | ~50 MB | ~26 MB | -48% |

---

## 4. 사용자 확인 필요 사항 (Sprint B 진행 전)

### 🔴 P0 — 즉시 결정 필요

| # | 질문 | 배경 | 옵션 |
|---|------|------|------|
| 1 | **Phantom EF 10개 처리 방침** | 프론트엔드가 호출하나 EF가 없음 | A) 누락 EF 신규 생성 / B) 프론트엔드 호출 코드 제거 / C) 기능별 판단 |
| 2 | **`chat_context_memory` RLS** | 사용자 채팅 데이터가 RLS 없이 노출 | RLS 활성화 + user_id 정책 추가 → 즉시 조치? |
| 3 | **Storage 보안** | `avatars`, `chat-attachments` 버킷이 public + 무제한 | 파일 크기/MIME 제한 추가 → 즉시 조치? |

### 🟠 P1 — Sprint B 범위 결정

| # | 질문 | 영향 |
|---|------|------|
| 4 | **POS Integration** (pos-oauth-*, sync-pos-data) | 향후 구현 예정? → 코드 유지 vs UI 숨김 |
| 5 | **Analytics RPC 9개** | D팀 대시보드 연결 예정? → 보존 vs 삭제 |
| 6 | **VMD/Furniture RPC 6개** | D팀 확장 예정? → 보존 vs 삭제 |
| 7 | **IoT 확장 테이블 22개** (beacon, camera 등) | B팀 향후 사용? → 보존 vs 삭제 |
| 8 | **pg_cron 스케줄 확인** | cleanup RPC가 cron에 등록되어 있을 수 있음 |

### 🟡 P2 — 참고 사항

| # | 발견 | 권장 |
|---|------|------|
| 9 | `retail-chatbot` 401 에러 (14.3%) | 토큰 갱신 로직 점검 |
| 10 | `environment-proxy` burst 패턴 | OS Dashboard debounce 검토 |
| 11 | `retail-chatbot` 평균 18.7초 응답 | SSE 스트리밍 전환 검토 |
| 12 | 14개 Sync RPC ↔ EF SQL 중복 | 장기적으로 RPC로 통합 권장 |

---

## 5. Sprint B 로드맵 (제안)

```
Sprint B: 정리 및 최적화 실행
├── B-1: 보안 긴급 수정
│   ├── chat_context_memory RLS 활성화
│   ├── Storage 버킷 보안 강화
│   └── RLS 항상-TRUE 정책 12건 수정
├── B-2: Dead/Phantom EF 정리
│   ├── Dead EF 2개 삭제 (generate-template, upscale-image)
│   ├── Phantom EF 3개 P0 수정 (validate-and-fix-csv, apply-sample-data, fetch-db-schema)
│   └── Phantom EF 7개 처리 (사용자 방침에 따라)
├── B-3: 성능 최적화
│   ├── Critical FK 인덱스 11개 생성
│   ├── 미사용 인덱스 대형 10개 DROP
│   └── 중복 인덱스 10개 DROP
├── B-4: 스키마 정리 (사용자 승인 후)
│   ├── UNUSED 테이블 48개 마이그레이션
│   ├── UNUSED RPC 44개 정리
│   └── database.types.ts 재생성
└── B-5: 검증
    ├── type-check + lint + build
    ├── 스모크 테스트
    └── 라이브 트래픽 재검증
```

---

> **다음 단계**: 위 P0 질문에 대한 답변 후 Sprint B 진행
