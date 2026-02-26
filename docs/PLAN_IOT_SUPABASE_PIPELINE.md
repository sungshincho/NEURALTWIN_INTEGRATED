# IoT → Supabase 파이프라인 기획서

> **작성**: PM 리드 에이전트 | **승인 대기**: CEO 성신
> **날짜**: 2026-02-26
> **우선순위**: P0 (최우선)
> **목표**: NeuralSense 센서 데이터가 Supabase DB까지 End-to-End로 흐르게 한다

---

## 1. 현황 분석

### 1.1 현재 데이터 흐름 (끊김 지점 표시)

```
[Pi 8대]  →  [MQTT 브로커]  →  [Laptop: run_live_geometry.py]  →  [JSONL 파일]  ✕  [Supabase DB]
  WiFi        100.87.27.7       RSSI 집계 + 존 분류                 로컬 저장      ↑ 여기가 끊김
  RSSI        포트 1883          5초 윈도우                          output/
```

### 1.2 이미 존재하는 것

| 구성요소 | 상태 | 위치 |
|---------|------|------|
| MQTT 수집 + 존 분류 알고리즘 | **완성** | `apps/neuralsense/run_live_geometry.py` |
| JSONL 출력 (6종) | **완성** | `apps/neuralsense/output/` |
| 스키마 매핑 문서 | **완성** | `apps/neuralsense/SCHEMA_MAPPING.md` |
| Edge Function `process-neuralsense-data` | **존재하나 스키마 불일치** | `supabase/supabase/functions/process-neuralsense-data/index.ts` |
| DB 테이블 (zone_events, visits, zones_dim 등) | **존재** | Supabase PostgreSQL |

### 1.3 없는 것 (구현 필요)

| 구성요소 | 담당 |
|---------|------|
| Python 업로더 모듈 (JSONL → Supabase EF 호출) | **T1 IoT** |
| Edge Function 스키마 불일치 수정 | **T2 Backend** |
| zones_dim 시드 데이터 (19개 존 UUID 매핑) | **T2 Backend** |
| MQTT TLS/인증 | **T1 IoT** |
| 대시보드에서 실시간 데이터 확인 | **T3 DT/OS** |

---

## 2. 목표 아키텍처

```
Phase 1 (이 기획서):
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

[Pi 8대]                         [Supabase Cloud]
  │ WiFi RSSI                      ┌─────────────────────┐
  ▼                                │  process-neuralsense │
[MQTT Broker]                      │  -data (Edge Func)   │
  │ neuralsense/rssi               │                     │
  ▼                                │  1. raw_imports 저장  │
[run_live_geometry.py]             │  2. etl_runs 추적    │
  │ 존 분류 완료                    │  3. zone_events 생성  │
  ▼                                │  4. visits 세션 관리  │
[JSONL 파일]                       │  5. funnel_events    │
  │                                └──────────┬──────────┘
  ▼                                           │
[supabase_uploader.py] ─── HTTPS POST ──────→ │
  │ 배치 (30초 간격)                           ▼
  │ zone_assignments.jsonl                ┌──────────┐
  │ dwells.jsonl                          │ Supabase │
  └─────────────────────────────────────→ │ DB       │
                                          │          │
                                          │ zone_events     (37K+ rows) │
                                          │ visits          (세션)      │
                                          │ visit_zone_events (체류)    │
                                          │ funnel_events   (퍼널)     │
                                          └──────────┘
                                               │
                                               ▼
                                     [OS Dashboard] (T3)
                                     [Website Chat] (T4)

Phase 2 (향후):
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  - MQTT → Supabase 직접 스트리밍 (MQTT-to-HTTP 브릿지)
  - MQTT TLS + 사용자 인증
  - 실시간 WebSocket 대시보드 반영
```

---

## 3. 발견된 핵심 이슈

### 이슈 1: Edge Function ↔ visits 테이블 스키마 불일치 (Critical)

`process-neuralsense-data` EF가 `visits` 테이블에 삽입하는 필드와 실제 테이블 스키마가 다릅니다:

| EF가 삽입하려는 필드 | 실제 visits 테이블 | 상태 |
|---------------------|-------------------|------|
| `visitor_id` | 없음 | **불일치** — `customer_id`만 존재 |
| `entry_time` | 없음 | **불일치** — `created_at`만 존재 |
| `exit_time` | 없음 | **불일치** |
| `source` | 없음 | **불일치** |
| `metadata` | 없음 | **불일치** |
| `user_id` | `user_id` (필수) | EF에서 미설정 |
| `visit_date` | `visit_date` (필수) | OK |
| `store_id` | `store_id` | OK |
| `org_id` | `org_id` | OK |

**결론**: EF가 현재 스키마로는 visits INSERT가 실패합니다. 수정 필요.

### 이슈 2: Zone ID 타입 불일치

| NeuralSense | Supabase |
|-------------|----------|
| `zone_id: int` (1~19) | `zone_id: uuid` |

zones_dim 테이블에 19개 존 시드 데이터가 있어야 하며, zone_code (int 문자열) → UUID 매핑이 필요합니다.

### 이슈 3: NeuralSense 출력 ↔ EF 입력 포맷 불일치

NeuralSense `zone_assignments.jsonl` 출력:
```json
{"zone_id": 7, "phone_id": "a8:76:50:e9:28:20", "ts": 1740000000.5, "confidence": 0.85, "margin": 0.23, "sources": ["pi5","pi7",...]}
```

EF `process-neuralsense-data`가 기대하는 입력:
```json
{"timestamp": "2026-01-13T14:30:00Z", "hashed_mac": "a1b2c3", "zone_id": "uuid-here", "rssi_readings": {"NS-001": -45}, "estimated_position": {"x": 12.5, "y": 8.3, "confidence": 0.85}}
```

**변환이 필요한 필드**:
- `ts` (Unix float) → `timestamp` (ISO 8601)
- `phone_id` → `hashed_mac`
- `zone_id` (int) → `zone_id` (UUID, zones_dim 조회)
- `confidence` → `estimated_position.confidence`
- Pi별 RSSI → `rssi_readings` 재구성

---

## 4. 태스크 분해

### Phase 1-A: 기반 준비 (병렬 실행 가능)

#### 태스크 A1 — zones_dim 시드 데이터
```
[태스크] zones_dim 19개 존 시드 데이터 + 마이그레이션
[담당] Teammate 2 — Backend
[목표] NeuralSense의 19개 존 (zones.csv)을 zones_dim 테이블에 UUID와 함께 등록
[범위] supabase/supabase/migrations/새_마이그레이션.sql
[의존성] 없음
[완료 기준]
  - zones_dim에 zone_code '1'~'19' 레코드 19개 존재
  - store_id, org_id는 기존 테스트 매장 데이터 참조
  - zone_name, zone_type, position_x/y/z, is_active 설정
  - 마이그레이션 적용 후 SELECT 확인
[참고 데이터]
  apps/neuralsense/zones.csv:
    zone_id,x,y → zone_code, position_x, position_z (y는 0)
```

#### 태스크 A2 — visits 테이블 스키마 또는 EF 수정
```
[태스크] process-neuralsense-data EF의 visits 삽입 로직 수정
[담당] Teammate 2 — Backend
[목표] EF가 실제 visits 테이블 스키마에 맞게 데이터를 삽입하도록 수정
[범위] supabase/supabase/functions/process-neuralsense-data/index.ts (라인 305~354)
[의존성] 없음
[완료 기준]
  - visits INSERT가 실제 스키마 필드에 맞게 동작
  - user_id: 'system' (시스템 자동 생성 방문)
  - visit_date: YYYY-MM-DD
  - duration_minutes: 계산 후 설정
  - zones_visited: 배열로 방문 존 ID 누적
  - customer_id: null (IoT 익명 추적)
  - visitor_id 대신 metadata에 hashed_mac 저장
[주의]
  - 기존 visits 데이터 손상 없어야 함
  - visitor→customer 매핑은 Phase 2로 연기
```

#### 태스크 A3 — EF 입력 포맷 어댑터 (Python 측 변환)
```
[태스크] supabase_uploader.py — JSONL→EF 페이로드 변환 모듈
[담당] Teammate 1 — IoT
[목표] zone_assignments.jsonl과 dwells.jsonl을 EF가 기대하는 NeuralsensePayload로 변환
[범위] apps/neuralsense/supabase_uploader.py (신규 생성)
[의존성] 태스크 A1 (zone_code→UUID 매핑 필요)
[완료 기준]
  - zone_assignments.jsonl 읽기 → NeuralsensePayload 생성
  - 필드 변환:
    * ts (Unix float) → timestamp (ISO 8601)
    * phone_id → hashed_mac
    * zone_id (int) → zone_id (UUID) — zones_dim API 조회 또는 로컬 캐시
    * confidence → estimated_position.confidence
    * vector (Pi별 RSSI) → rssi_readings
  - 배치 크기: 50 readings/request (조절 가능)
  - 재시도 로직: 3회, 지수 백오프
  - 에러 로깅: failed_uploads.jsonl
  - .env 기반 설정: SUPABASE_URL, SUPABASE_ANON_KEY, STORE_ID, ORG_ID
[참고]
  apps/neuralsense/SCHEMA_MAPPING.md 의 변환 규칙 준수
```

### Phase 1-B: 통합 (A1~A3 완료 후)

#### 태스크 B1 — 업로더 통합 및 run_live와 연동
```
[태스크] run_live_geometry.py에 실시간 업로드 훅 추가
[담당] Teammate 1 — IoT
[목표] 존 할당이 생성될 때마다 supabase_uploader에 전달, 30초 배치로 업로드
[범위] apps/neuralsense/run_live_geometry.py (기존 파일 수정)
        apps/neuralsense/supabase_uploader.py
[의존성] 태스크 A3
[완료 기준]
  - run_live_geometry.py 실행 시 JSONL 저장 + Supabase 업로드 동시 수행
  - ENABLE_UPLOAD=true/false 환경변수로 토글
  - 업로드 실패 시 JSONL 저장은 계속 (업로드는 비차단)
  - 30초 배치 버퍼 (또는 50건 도달 시 즉시 전송)
  - 업로드 통계 로깅: 성공/실패/지연시간
```

#### 태스크 B2 — End-to-End 검증
```
[태스크] 파이프라인 End-to-End 스모크 테스트
[담당] Teammate 1 (실행) + Teammate 2 (DB 검증)
[목표] Pi→MQTT→존분류→업로드→Supabase DB 전체 흐름 확인
[범위] 전체 파이프라인
[의존성] 태스크 B1
[완료 기준]
  - run_live_geometry.py 실행 → zone_events 테이블에 레코드 생성 확인
  - visits 테이블에 방문 세션 생성 확인
  - raw_imports에 원본 데이터 저장 확인
  - etl_runs에 실행 추적 기록 확인
  - 에러/경고 없이 최소 100건 처리 확인
[검증 쿼리]
  SELECT count(*) FROM zone_events WHERE sensor_type = 'wifi' AND created_at > now() - interval '1 hour';
  SELECT count(*) FROM visits WHERE source = 'neuralsense' AND created_at > now() - interval '1 hour';
  SELECT * FROM etl_runs WHERE etl_function = 'process-neuralsense-data' ORDER BY started_at DESC LIMIT 5;
```

### Phase 1-C: 대시보드 연동 (B2 완료 후)

#### 태스크 C1 — OS Dashboard 실시간 데이터 반영 확인
```
[태스크] 대시보드에서 NeuralSense 실시간 데이터 표시 확인
[담당] Teammate 3 — DT/OS
[목표] InsightHub의 Store/Customer 탭에서 IoT 센서 데이터가 반영되는지 확인
[범위] apps/os-dashboard/src/features/insights/ (읽기 전용 확인)
[의존성] 태스크 B2 (DB에 데이터 존재해야 함)
[완료 기준]
  - Overview 탭: 방문자 수(footfall)에 IoT 데이터 반영
  - Store 탭: 존별 히트맵에 실제 체류시간 표시
  - 데이터가 표시되지 않는 경우 원인 분석 및 수정안 보고
[주의]
  - 기존 쿼리가 zone_events를 이미 사용 중이라면 자동 반영될 수 있음
  - 쿼리 필터 (sensor_type, date range) 확인 필요
```

---

## 5. 의존성 그래프

```
        ┌──── A1 (zones_dim 시드) ────┐
        │                             │
        │     A2 (EF 스키마 수정) ────┤
        │                             ▼
        └──────────────────────→ A3 (Python 업로더)
                                      │
                                      ▼
                                 B1 (run_live 통합)
                                      │
                                      ▼
                                 B2 (E2E 검증)
                                      │
                                      ▼
                                 C1 (대시보드 확인)

실행 계획:
  Step 1: A1 + A2 병렬 (T2 Backend)
  Step 2: A3 (T1 IoT) — A1 완료 후 시작
  Step 3: B1 (T1 IoT) — A3 완료 후
  Step 4: B2 (T1 + T2 협업)
  Step 5: C1 (T3 DT/OS)
```

---

## 6. Teammate별 작업 요약

| Teammate | 태스크 | 예상 작업량 | 순서 |
|----------|--------|-----------|------|
| **T1 IoT** | A3 → B1 → B2(실행) | 신규 파일 1개 + 기존 수정 1개 | Step 2→3→4 |
| **T2 Backend** | A1 + A2 → B2(검증) | 마이그레이션 1개 + EF 수정 1개 | Step 1→4 |
| **T3 DT/OS** | C1 | 읽기 전용 확인 + 필요시 수정 | Step 5 |
| **T4 Website** | 없음 (이 Phase에서) | — | — |
| **T5 Domain** | 없음 (이 Phase에서) | — | — |

---

## 7. 파일 변경 목록 (예상)

### 신규 생성
| 파일 | 담당 | 설명 |
|------|------|------|
| `apps/neuralsense/supabase_uploader.py` | T1 | JSONL→EF 페이로드 변환 + HTTP 전송 |
| `apps/neuralsense/.env.example` | T1 | Supabase 연결 환경변수 템플릿 |
| `supabase/supabase/migrations/YYYYMMDD_seed_zones_dim.sql` | T2 | 19개 존 시드 데이터 |

### 수정
| 파일 | 담당 | 변경 내용 |
|------|------|----------|
| `supabase/supabase/functions/process-neuralsense-data/index.ts` | T2 | visits INSERT 스키마 수정 (라인 305~354) |
| `apps/neuralsense/run_live_geometry.py` | T1 | 업로더 훅 추가 (ENABLE_UPLOAD 토글) |
| `apps/neuralsense/config.py` | T1 | Supabase 관련 환경변수 추가 |
| `apps/neuralsense/requirements.txt` | T1 | `requests` 또는 `httpx` 추가 |

### 변경 없음 (읽기 전용 확인)
| 파일 | 담당 | 확인 내용 |
|------|------|----------|
| `apps/os-dashboard/src/hooks/useZoneMetrics.ts` | T3 | zone_events 쿼리 필터 확인 |
| `apps/os-dashboard/src/features/insights/` | T3 | 데이터 표시 확인 |

---

## 8. 환경변수 (신규)

### apps/neuralsense/.env
```bash
# Supabase 연결 (업로더용)
SUPABASE_URL=https://bdrvowacecxnraaivlhr.supabase.co
SUPABASE_ANON_KEY=<anon_key_here>

# 매장/조직 식별
STORE_ID=<store_uuid>
ORG_ID=<org_uuid>

# 업로드 설정
ENABLE_UPLOAD=true
UPLOAD_BATCH_SIZE=50
UPLOAD_INTERVAL_SEC=30
UPLOAD_MAX_RETRIES=3
```

---

## 9. 리스크 및 완화 전략

| 리스크 | 확률 | 영향 | 완화 |
|--------|------|------|------|
| zones_dim에 테스트 매장이 없음 | 높음 | 차단 | stores 테이블에 테스트 매장 먼저 확인/생성 |
| MQTT 평문 통신 보안 | 중간 | 높음 | Phase 1에서는 Tailscale VPN 내부이므로 허용, Phase 2에서 TLS 추가 |
| 대량 데이터 시 EF 타임아웃 | 낮음 | 중간 | 배치 크기 50으로 제한, 타임아웃 모니터링 |
| EF 수정 시 기존 기능 영향 | 낮음 | 높음 | visits INSERT만 수정, 기존 zone_events 로직 유지 |

---

## 10. 성공 기준

파이프라인 완성 시 아래가 **모두** 충족되어야 합니다:

- [ ] run_live_geometry.py 실행 중 zone_events 테이블에 실시간 레코드 생성
- [ ] visits 테이블에 방문 세션 자동 생성/갱신
- [ ] raw_imports에 원본 데이터 보존 (감사 추적)
- [ ] etl_runs에 처리 이력 기록
- [ ] 업로드 실패 시에도 JSONL 로컬 저장 정상 동작 (비차단)
- [ ] OS Dashboard에서 IoT 데이터 기반 KPI 표시 가능
- [ ] ENABLE_UPLOAD=false 시 기존 동작과 100% 동일 (하위 호환)

---

## 11. 향후 Phase (이 기획 범위 밖)

| Phase | 내용 | 시기 |
|-------|------|------|
| Phase 2 | MQTT TLS + 인증 | Pipeline 안정화 후 |
| Phase 3 | MQTT→Supabase 직접 스트리밍 (중간 JSONL 제거) | Phase 2 후 |
| Phase 4 | 실시간 WebSocket 대시보드 반영 | Phase 3 후 |
| Phase 5 | visit_zone_events 자동 생성 (dwells.jsonl 활용) | Phase 1 검증 후 |

---

**PM 리드 의견**: Phase 1 완료 시 NeuralTwin의 핵심 가치 제안 "센서→AI→최적화"가 최초로 End-to-End 동작합니다. T2 Backend가 A1+A2를 먼저 완료하면 T1 IoT가 바로 A3에 착수할 수 있으므로, T2부터 시작하는 것을 권장합니다.

**CEO 승인 요청**: 위 기획대로 진행해도 될까요?
