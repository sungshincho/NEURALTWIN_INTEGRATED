# IoT → Supabase Pipeline Implementation Report

> **Date**: 2026-02-26
> **Branch**: NT_Backups_0226
> **Author**: PM Lead Agent (Claude Code Agent Teams)
> **Requested by**: CEO 성신

---

## 1. Executive Summary

IoT 센서(NeuralSense) → Supabase 실시간 파이프라인의 핵심 구현을 완료했습니다.
6,820건의 실제 JSONL 데이터를 Supabase에 성공적으로 업로드하여 E2E 검증을 마쳤습니다.

**핵심 성과:**
- Edge Function 배포 및 스키마 불일치 해결
- Python 업로더 모듈 신규 개발
- 실시간 파이프라인 통합 (run_live_geometry.py)
- 전체 6,820건 E2E 업로드 성공 (0건 실패)
- OS 대시보드 L3 데이터 집계 완료

---

## 2. Commits (NT_Backups_0226)

| Commit | Description |
|--------|-------------|
| `0a78c869` | Phase 1: zones_dim 시드(19존), EF visits 스키마 수정, Python 업로더, .env.example, config.py 확장 |
| `294b72de` | Step B1: run_live_geometry.py에 SupabaseUploader 통합 (비동기 non-blocking) |
| `f99cbd2f` | EF raw_imports user_id UUID 수정 + 업로더 로깅 인코딩 수정 |

---

## 3. Files Created / Modified

### New Files
| File | Purpose |
|------|---------|
| `apps/neuralsense/supabase_uploader.py` | Supabase 배치 업로더 (CLI + 스트리밍 API) |
| `apps/neuralsense/.env.example` | 환경변수 템플릿 |
| `supabase/supabase/migrations/20260226100000_seed_neuralsense_zones.sql` | NS001-NS019 존 시드 + 편의 함수 |
| `docs/PLAN_IOT_SUPABASE_PIPELINE.md` | 상세 기획 문서 |

### Modified Files
| File | Changes |
|------|---------|
| `apps/neuralsense/config.py` | Supabase 업로드 환경변수 추가 (SUPABASE_URL, ANON_KEY, STORE_ID 등) |
| `apps/neuralsense/requirements.txt` | `requests>=2.28.0` 추가 |
| `apps/neuralsense/run_live_geometry.py` | SupabaseUploader 통합 (조건부 import, add_reading, flush) |
| `supabase/supabase/functions/process-neuralsense-data/index.ts` | visits 스키마 수정, raw_imports user_id UUID 수정 |

---

## 4. Architecture

```
Raspberry Pi (WiFi RSSI)
        |
        v
   MQTT Broker (100.87.27.7:1883)
        |
        v
run_live_geometry.py (Zone Classification)
   |                    |
   v                    v (non-blocking, batch=50)
zone_assignments.jsonl  supabase_uploader.py
                            |
                            v  HTTP POST + JWT Auth
                   process-neuralsense-data EF (v175)
                            |
              +-------------+-------------+
              |             |             |
              v             v             v
        raw_imports    zone_events     visits
         (L1 audit)    (L2 events)   (L2 sessions)
              |             |
              v             v
         etl_runs    zone_daily_metrics (L3)
                     hourly_metrics (L3)
                            |
                            v
                    OS Dashboard (StoreTab)
```

---

## 5. E2E Test Results

### Upload Summary
| Metric | Value |
|--------|-------|
| Input records | 6,820 |
| Transformed | 6,820 (100%) |
| Uploaded | 6,820 (100%) |
| Failed | 0 |
| Batches | 137 (50 records/batch) |
| Total time | ~3m 28s |
| Avg batch duration | 678ms |

### Database Verification
| Table | Records | Status |
|-------|---------|--------|
| raw_imports | 137 | all completed |
| etl_runs | 137 | all completed |
| zone_events | 1,107 | enter: 737, exit: 370 |
| visits | 1 | zones_visited: 3 zones |
| zone_daily_metrics | 3 (aggregated) | NS001, NS012, NS018 |
| hourly_metrics | 2 (aggregated) | hour 3, hour 4 |

### Zone Heatmap
| Zone | Events | Enters | Exits | Heatmap Intensity |
|------|--------|--------|-------|-------------------|
| NS001 (Zone 1) | 473 | 335 | 138 | 1.0000 |
| NS018 (Zone 18) | 382 | 228 | 154 | 0.6806 |
| NS012 (Zone 12) | 252 | 174 | 78 | 0.5194 |

---

## 6. Issues Discovered & Fixed

### Critical
1. **visits 테이블 스키마 불일치**: EF가 `visitor_id`, `entry_time`, `exit_time` 컬럼을 사용했으나, 실제 테이블에는 `user_id`(uuid NOT NULL), `visit_date`, `duration_minutes`, `zones_visited`만 존재. SYSTEM_USER_ID (`00000000-...`)로 수정.
2. **raw_imports user_id 타입 오류**: `'system'` 문자열 → UUID `'00000000-0000-0000-0000-000000000000'`으로 수정.

### Minor
3. **Python 로깅 인코딩**: em dash (`—`) → ASCII hyphen (`-`) 변경 (Windows cp949 호환).

---

## 7. OS Dashboard Integration Status

### Data Flow Verification
- **StoreTab** (`/insights?tab=store`): `zone_daily_metrics` 조회 → NS001/NS012/NS018 데이터 표시 가능
- **Date Filter**: 기본 7일(02-19~02-26) → 02-25 NeuralSense 데이터 포함
- **RLS**: `org_rls` 정책 통과 (org_id 일치 확인)
- **zones_dim**: 19개 NS존 활성, org_id/store_id 정확

### Known Gaps
1. **L2→L3 자동 집계 없음**: zone_events → zone_daily_metrics 변환이 수동 SQL. 자동화 필요 (pg_cron 또는 주기 EF).
2. **Dwell time 짧음**: 평균 13초 (RSSI 변동으로 빈번한 zone 전환). 대시보드에서 0분 표시.
3. **NS존 이름 미매핑**: "NeuralSense Zone 1" 등 일반 이름. 실제 매장 구역명으로 업데이트 필요.
4. **시딩 데이터와 불연속**: 기존 시딩(~2026-01-08)과 NeuralSense(2026-02-25) 사이 ~7주 공백.

---

## 8. Key Credentials & Config

| Item | Value |
|------|-------|
| Store ID (A매장) | `d9830554-2688-4032-af40-acccda787ac4` |
| Org ID | `0c6076e3-a993-4022-9b40-0f4e4370f8ef` |
| Supabase Project Ref | `bdrvowacecxnraaivlhr` |
| EF Version | v175 |
| MQTT Broker | `100.87.27.7:1883` |
| Pi IDs | pi5, pi7, pi8, pi9, pi10, pi11, pi12, pi13 |

---

## 9. Recommended Next Steps

| Priority | Task | Owner | Description |
|----------|------|-------|-------------|
| P0 | L2→L3 자동 집계 | T2 Backend | zone_events → zone_daily_metrics 주기 집계 (pg_cron or EF) |
| P0 | NS존 이름 매핑 | T1 IoT / CEO | "NeuralSense Zone 1" → 실제 구역명 업데이트 |
| P1 | Dwell time 보정 | T1 IoT | 같은 존 연속 체류 합산 로직 개선 |
| P1 | 실시간 MQTT 테스트 | T1 IoT | 현장 Pi 연결 후 라이브 파이프라인 검증 |
| P2 | 대시보드 NS존 시각화 | T3 DT/OS | Digital Twin 3D 뷰에 NS존 오버레이 |
| P2 | 히스토리컬 데이터 백필 | T2 Backend | 과거 JSONL 파일 일괄 업로드 스크립트 |

---

## 10. Agent Team Utilization

| Agent | Role | Work Done |
|-------|------|-----------|
| PM Lead | 기획, 코드 작성, 배포, 검증 | 전체 파이프라인 구현 및 E2E 테스트 |
| T1 IoT | 초기 정찰 (권한 제한) | run_live_geometry.py, config.py 분석 |
| T2 Backend | 초기 정찰 (권한 제한) | EF, DB 스키마 분석 |
| T3 DT/OS | 대시보드 탐색 | useZoneMetrics, StoreTab 데이터 플로우 분석 |
| T4 Website | 대기 | (이번 스프린트 미배정) |
| T5 Domain | 대기 | (이번 스프린트 미배정) |

> **Note**: T1/T2의 Write/Edit/Bash 권한 제한으로 PM Lead가 직접 구현 수행. 향후 권한 설정 조정 필요.
