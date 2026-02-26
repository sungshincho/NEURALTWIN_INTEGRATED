# EF Live Traffic Report

> 조회 시각: 2026-02-26 05:37:27 UTC
> 프로젝트: bdrvowacecxnraaivlhr
> 데이터 범위: 최근 24시간 (Supabase get_logs API 제약 — 7일/30일 조회 불가)

## 1. 전체 EF 트래픽 (24시간)

> **참고**: Supabase MCP `get_logs`는 최근 24시간만 지원합니다. 7일/30일 데이터는 Supabase Dashboard > Logs에서 직접 확인하세요.

| EF명 | 호출 수 (POST) | 평균 응답시간(ms) | 에러 수 | 에러율 |
|------|---------------|-----------------|--------|-------|
| retail-chatbot | 7 | 18,725 | 1 (401) | 14.3% |
| environment-proxy | 55 | 887 | 0 | 0.0% |
| **합계** | **62** | **3,458** | **1** | **1.6%** |

### 세부 분석

**retail-chatbot** (function_id: `df39cc4b`)
- 6건 정상 (200), 1건 인증 실패 (401)
- 응답시간 범위: 5,540ms ~ 28,004ms (AI 호출 포함으로 높음)
- OPTIONS preflight: 8건 (204)

**environment-proxy** (function_id: `39dd2418`)
- 55건 전체 정상 (200)
- 응답시간 범위: 195ms ~ 4,233ms
- OPTIONS preflight: 28건 (200)
- 대량 burst 패턴 관측 (단일 시점에 20+ 동시 호출)

## 2. Dead EF 확인 (24시간)

> **참고**: 30일 데이터는 MCP 도구 제약으로 조회 불가. 아래는 24시간 기준 결과입니다.

| EF명 | 호출 수 (24h) | 마지막 호출 | 판정 |
|------|-------------|------------|------|
| generate-template | 0 | 로그 없음 | **Dead 후보** |
| upscale-image | 0 | 로그 없음 | **Dead 후보** |

24시간 내 두 함수 모두 호출 기록이 전혀 없습니다.

## 3. Phantom EF 에러 (24시간)

> **참고**: 30일 데이터는 MCP 도구 제약으로 조회 불가. 아래는 24시간 기준 결과입니다.

| EF명 | 호출 시도 (24h) | 에러 수 | 상태코드 | 판정 |
|------|---------------|--------|---------|------|
| fetch-db-schema | 0 | 0 | - | Phantom (호출 없음) |
| apply-sample-data | 0 | 0 | - | Phantom (호출 없음) |
| pos-oauth-start | 0 | 0 | - | Phantom (호출 없음) |
| pos-oauth-callback | 0 | 0 | - | Phantom (호출 없음) |
| sync-pos-data | 0 | 0 | - | Phantom (호출 없음) |
| auto-fix-data | 0 | 0 | - | Phantom (호출 없음) |
| validate-batch-files | 0 | 0 | - | Phantom (호출 없음) |
| generate-ai-recommendations | 0 | 0 | - | Phantom (호출 없음) |
| link-3d-models | 0 | 0 | - | Phantom (호출 없음) |
| validate-and-fix-csv | 0 | 0 | - | Phantom (호출 없음) |

10개 함수 모두 24시간 내 호출 기록이 전혀 없습니다.

## 분석 요약

### 활성 EF (2개만 활성)
1. **environment-proxy**: 가장 활발 (55 POST/24h). 안정적 (에러 0%). OS Dashboard의 환경 데이터 프록시 역할.
2. **retail-chatbot**: AI 채팅 기능 (7 POST/24h). 401 에러 1건 발생 — 인증 토큰 만료 또는 미인증 접근 시도.

### 발견된 이슈

| # | 이슈 | 심각도 | 설명 |
|---|------|--------|------|
| 1 | retail-chatbot 401 에러 | Medium | 인증 실패 1건. 토큰 갱신 로직 또는 프론트엔드 인증 흐름 확인 필요 |
| 2 | retail-chatbot 응답시간 | Low | 평균 18.7초. Gemini API 호출 포함이므로 예상 범위이나, 스트리밍 전환 검토 권장 |
| 3 | Dead EF 2개 | High | `generate-template`, `upscale-image` — 24h 트래픽 0. 삭제 또는 deprecation 검토 |
| 4 | Phantom EF 10개 | High | 10개 함수 모두 24h 트래픽 0. 코드베이스에서 참조 여부 확인 후 정리 필요 |

### 권장 조치

1. **Dead/Phantom EF 정리**: 12개 함수(Dead 2 + Phantom 10)의 코드베이스 참조를 확인하고, 미참조 시 삭제하여 배포 파이프라인 최적화
2. **retail-chatbot 인증 강화**: 401 에러 원인 조사 (프론트엔드 토큰 갱신 타이밍 확인)
3. **Supabase Dashboard에서 30일 로그 확인**: MCP 도구는 24시간 제한이므로, 정확한 Dead/Phantom 판정을 위해 Dashboard > Logs > Edge Functions에서 30일 범위 수동 확인 필요
4. **environment-proxy burst 패턴 조사**: 단일 시점에 20+ 동시 요청 발생 — 프론트엔드에서 불필요한 중복 호출 여부 확인
