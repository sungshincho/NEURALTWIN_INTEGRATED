# WORK_GUIDE_B — Member B (CTO / IoT & Hardware)

> **역할**: CTO, IoT & Hardware Lead
> **Claude 프로젝트**: `neuraltwin-iot`
> **버전**: 1.0 | 2026-02-25

---

## 1. 역할 요약 (Role Summary)

| 항목 | 내용 |
|------|------|
| **포지션** | CTO, IoT & 하드웨어 리드 |
| **핵심 책임** | NeuralSense 코드 정리, MQTT 스키마 정의, Raspberry Pi 배포 자동화, Supabase 브릿지 |
| **코드 소유 경로** | `apps/neuralsense/` 전체 |
| **의사결정 권한** | IoT 아키텍처, 센서 하드웨어 선택, MQTT 토픽 설계 |

---

## 2. 모노레포 컨텍스트 (Monorepo Context)

### B의 코드 위치
```
neuraltwin/
└── apps/
    └── neuralsense/                # ← B 전체 소유 (pnpm 외부)
        ├── config.py               # 14개 상수 중앙화
        ├── run_live_geometry.py     # 메인 라이브 처리 스크립트
        ├── calibrate_interactive_geometry.py  # 캘리브레이션 도구
        ├── accuracy_test_from_zone_assignments.py  # 정확도 테스트
        ├── zones.csv               # 19개 존 정의
        ├── zones_original.csv      # 원본 125개 존
        ├── requirements.txt        # paho-mqtt>=2.0.0, numpy, scipy
        ├── neuralsense_pi/         # Raspberry Pi 스크립트
        │   ├── sniff_and_send.py
        │   ├── sniff_and_send_unified.py
        │   ├── set_monitor_mode.py
        │   ├── set_channel.sh
        │   └── requirements.txt    # paho-mqtt>=2.0.0, scapy>=2.6.1
        ├── REPO_ANALYSIS_B.md
        └── SCHEMA_MAPPING.md
```

### 다른 멤버와의 의존 관계
- **A**: 모노레포 구조 설정(W1)에 따라 `apps/neuralsense/` 위치 확정. 아키텍처 승인.
- **C**: W6에 NeuralSense → Supabase 브릿지 공동 개발. `process-neuralsense-data`, `process-wifi-data` EF 연동.
- **D**: OS Dashboard에서 센서 데이터 표시. 존 정보(`zones.csv`) 3D 시각화 연동.
- **E**: 직접 의존 없음. 웹사이트 챗봇에서 IoT 데이터 참조 시 간접 의존.

### 핵심 특성
- **pnpm 외부**: NeuralSense는 Python 프로젝트로 pnpm workspace에 포함되지 않음
- **하드웨어 의존**: Pi 스크립트는 WiFi 모니터 모드 어댑터 필수 (물리 하드웨어)
- **MQTT 전용**: HTTP/REST 미사용. 유일한 네트워크 프로토콜은 MQTT (100.87.27.7:1883, Tailscale VPN)

---

## 3. 서브에이전트 팀 (Sub-Agent Team)

### 3.1 Python Dev Agent

```markdown
# CLAUDE.md — Python Dev Agent (neuraltwin-iot)

## 역할
NeuralSense Python 코드 품질과 구조 개선을 담당합니다.

## 핵심 규칙
1. 모든 상수는 반드시 `config.py`에서 import합니다. 하드코딩 금지.
2. 파일 경로는 `pathlib.Path`를 사용합니다 (os.path 대신).
3. `ruff` 린트 통과 필수 (`ruff check .`).
4. `requirements.txt` 변경 시 정확한 버전 핀 사용 (`==`).
5. 중복 함수 작성 금지 — `utils.py`에서 import.

## 작업 디렉토리
`apps/neuralsense/`

## 코드 스타일
- Python 3.11+ 타입 힌트 사용
- Docstring: Google 스타일
- Line length: 120자 (ruff 설정)
- Import 순서: stdlib → third-party → local

## 주요 파일
| 파일 | 역할 |
|------|------|
| `config.py` | 중앙 설정 (14개 상수) |
| `run_live_geometry.py` | 메인 라이브 존 매칭 |
| `neuralsense_pi/sniff_and_send_unified.py` | Pi 스니퍼 (3가지 모드) |

## 검증 명령어
```bash
cd apps/neuralsense
ruff check .
mypy .
pytest
```

## 에스컬레이션
30분 이상 블로킹 → B (Team Lead)에 보고
```

### 3.2 MQTT/Infra Agent

```markdown
# CLAUDE.md — MQTT/Infra Agent (neuraltwin-iot)

## 역할
MQTT 브로커 관리, Raspberry Pi 배포, 네트워크 인프라를 담당합니다.

## 핵심 규칙
1. IP 주소 하드코딩 금지 — `config.py` 또는 환경변수 사용.
2. 네트워크 토폴로지 변경 시 반드시 문서화.
3. MQTT 연결 테스트 후 배포 (`mosquitto_pub` 확인).
4. Pi 배포 전 SSH 접근 가능 여부 확인.

## MQTT 인프라
| 항목 | 값 |
|------|-----|
| Broker | Mosquitto on pi10 |
| IP | 100.87.27.7 (Tailscale VPN) |
| Port | 1883 (비암호화) |
| Topic | `neuralsense/rssi` (단일 토픽) |
| QoS | 0 (fire-and-forget) |
| Keep-Alive | 30초 |

## Raspberry Pi 장비
| ID | 역할 |
|----|------|
| pi5, pi6, pi7, pi8, pi9, pi11, pi12, pi13 | WiFi 스니퍼 |
| pi10 | MQTT 브로커 + 스니퍼 |

## 배포 절차
```bash
# SSH로 Pi에 접속
ssh pi@<tailscale-ip>

# 코드 업데이트
cd ~/neuralsense_pi && git pull

# 의존성 설치
pip install -r requirements.txt

# 모니터 모드 설정
sudo python set_monitor_mode.py

# 스니퍼 시작
sudo python sniff_and_send_unified.py --mode production
```

## 에스컬레이션
네트워크/하드웨어 이슈 → B (Team Lead)에 보고
```

### 3.3 Data Pipeline Agent

```markdown
# CLAUDE.md — Data Pipeline Agent (neuraltwin-iot)

## 역할
센서 → Supabase 데이터 흐름, 스키마 검증, JSONL 처리를 담당합니다.

## 핵심 규칙
1. 모든 MQTT 페이로드는 JSON Schema에 대해 검증합니다.
2. 타임스탬프는 KST (UTC+9) 일관성 유지.
3. 데이터 품질 체크 필수 (RSSI 범위: -95 ~ -20 dBm).
4. DB 스키마 변경 시 C팀(백엔드)과 조율.

## MQTT Payload Schema
```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "type": "object",
  "required": ["ts", "rpi_id", "mac", "rssi"],
  "properties": {
    "ts": { "type": "number", "description": "Unix timestamp (float)" },
    "rpi_id": { "type": "string", "pattern": "^pi\\d+$" },
    "mac": { "type": "string", "pattern": "^([0-9a-f]{2}:){5}[0-9a-f]{2}$" },
    "rssi": { "type": "integer", "minimum": -95, "maximum": -20 }
  }
}
```

## JSONL 출력 스키마 (6종)
| 파일 | 필드 |
|------|------|
| `raw_rssi.jsonl` | ts, rpi_id, mac, rssi |
| `zone_assignments.jsonl` | ts, mac, zone_id, confidence, match_count |
| `transitions.jsonl` | ts, mac, from_zone, to_zone |
| `dwells.jsonl` | ts, mac, zone_id, duration_sec |
| `run_live_errors.jsonl` | ts, error, context |
| `calibration.jsonl` | created_ts, zone_id, vectors |

## Supabase 대상 테이블
- `zone_events` — 존 이벤트
- `visits` / `store_visits` — 방문 기록
- `wifi_tracking` — WiFi 추적 데이터

## 에스컬레이션
데이터 불일치/스키마 변경 → B (Team Lead) → C (Backend)에 보고
```

---

## 4. 8주 태스크 브레이크다운 (8-Week Task Breakdown)

### Week 1: 모노레포 구조 검토

| # | 태스크 | 산출물 | 완료 기준 |
|:-:|--------|--------|----------|
| 1.1 | `apps/neuralsense/` 위치 확인 | 디렉토리 존재 확인 | `ls apps/neuralsense/` 성공 |
| 1.2 | REPO_ANALYSIS_B.md 검토 | 이슈 우선순위 목록 | 6개 코드 중복 패턴 식별 완료 |
| 1.3 | config.py 현황 확인 | config.py 완성도 검토 | 14개 상수 모두 환경변수 지원 확인 |

### Week 2: 코드 정리 + utils.py 생성

| # | 태스크 | 산출물 | 완료 기준 |
|:-:|--------|--------|----------|
| 2.1 | `utils.py` 생성 — 중복 함수 통합 | `apps/neuralsense/utils.py` | 6개 중복 패턴 모두 통합 |
| 2.2 | `normalize_rssi()` 통합 | 단일 함수 | `sniff_and_send.py`, `sniff_and_send_unified.py`에서 import |
| 2.3 | `safe_append_jsonl()` 통합 | 단일 함수 | 4개 파일에서 import |
| 2.4 | `load_calibration()` 통합 | 단일 함수 | 2개 파일에서 import |
| 2.5 | `avg_diff()` 통합 | 단일 함수 | 2개 파일에서 import |
| 2.6 | `ts_kst()` 통합 | 단일 함수 | 4개 파일에서 import |
| 2.7 | 모든 파일이 `config.py` import 사용 | 하드코딩 0건 | `grep -rn "100.87.27.7" apps/neuralsense/` 결과 `config.py`만 |

**롤백**: `git revert` — 각 통합을 개별 커밋

### Week 3: MQTT 스키마 + paho-mqtt v2

| # | 태스크 | 산출물 | 완료 기준 |
|:-:|--------|--------|----------|
| 3.1 | MQTT Payload JSON Schema 작성 | `apps/neuralsense/schemas/mqtt_payload.json` | 4개 필드 스키마 완성 |
| 3.2 | JSONL 출력 6종 스키마 | `apps/neuralsense/schemas/` 6개 파일 | 모든 출력 파일 스키마 정의 |
| 3.3 | paho-mqtt v2 API 마이그레이션 | 전체 Python 파일 업데이트 | `mqtt.Client(mqtt.CallbackAPIVersion.VERSION2, ...)` 패턴 사용 |
| 3.4 | `on_connect` 시그니처 업데이트 | 5-param 콜백 | deprecation warning 0건 |

**paho-mqtt v2 마이그레이션 상세**:
```python
# Before (v1 API — DEPRECATED)
client = mqtt.Client(client_id="laptop-live")
def on_connect(client, userdata, flags, rc): ...

# After (v2 API)
client = mqtt.Client(mqtt.CallbackAPIVersion.VERSION2, client_id="laptop-live")
def on_connect(client, userdata, flags, reason_code, properties): ...
```

**영향 파일**: `run_live_geometry.py`, `calibrate_interactive_geometry.py`, `neuralsense_pi/sniff_and_send.py`, `neuralsense_pi/sniff_and_send_unified.py`

### Week 4: .gitignore + Pi 배포 자동화

| # | 태스크 | 산출물 | 완료 기준 |
|:-:|--------|--------|----------|
| 4.1 | `.gitignore` 생성 | `apps/neuralsense/.gitignore` | `output/`, `accuracy_tests/`, `.venv/`, `__pycache__/` 포함 |
| 4.2 | Pi 배포 스크립트 작성 | `apps/neuralsense/deploy/` | 8대 Pi 일괄 배포 가능 |
| 4.3 | `.env.example` 생성 | `apps/neuralsense/.env.example` | MQTT 설정, RSSI 파라미터 문서화 |

**배포 스크립트 (Fabric 기반 예시)**:
```python
# deploy/fabfile.py
PI_HOSTS = ["pi5", "pi6", "pi7", "pi8", "pi9", "pi10", "pi11", "pi12", "pi13"]

@task
def deploy(c):
    for host in PI_HOSTS:
        c.run(f"ssh pi@{host} 'cd ~/neuralsense_pi && git pull && pip install -r requirements.txt'")
```

### Week 5: Python CI + TypeScript 타입 생성

| # | 태스크 | 산출물 | 완료 기준 |
|:-:|--------|--------|----------|
| 5.1 | `ruff` 린트 설정 | `apps/neuralsense/pyproject.toml` | `ruff check .` 통과 |
| 5.2 | `mypy` 타입 체크 설정 | `mypy.ini` 또는 `pyproject.toml` | `mypy .` 통과 |
| 5.3 | `pytest` 기본 테스트 | `apps/neuralsense/tests/` | `avg_diff()`, `normalize_rssi()`, `load_calibration()` 테스트 |
| 5.4 | JSON Schema → TypeScript 파이프라인 | `json-schema-to-typescript` 스크립트 | MQTT payload TypeScript 타입 자동 생성 |

### Week 6: NeuralSense → Supabase 브릿지 (C 공동)

| # | 태스크 | 산출물 | 완료 기준 |
|:-:|--------|--------|----------|
| 6.1 | `supabase_bridge.py` 설계 | 브릿지 스크립트 | zone_events, visits, wifi_tracking 테이블 INSERT 성공 |
| 6.2 | `process-neuralsense-data` EF 연동 테스트 | 연동 테스트 결과 | MQTT → Bridge → EF → DB 데이터 흐름 확인 |
| 6.3 | `process-wifi-data` EF 연동 테스트 | 연동 테스트 결과 | WiFi 추적 데이터 저장 확인 |

**조율 포인트**: C가 EF 인프라 제공, B가 데이터 스키마 및 변환 로직 구현

### Week 7: E2E IoT 파이프라인 테스트

| # | 태스크 | 산출물 | 완료 기준 |
|:-:|--------|--------|----------|
| 7.1 | Pi → MQTT → Laptop → Supabase E2E 테스트 | 테스트 보고서 | 데이터 무결성 확인 |
| 7.2 | 성능 최적화 | 벤치마크 결과 | raw_rssi 처리 지연 <50ms |
| 7.3 | 로그 로테이션 구현 | 로그 관리 설정 | `raw_rssi.jsonl` 자동 로테이션 (1GB 제한) |

### Week 8: 문서화 + 배포 가이드

| # | 태스크 | 산출물 | 완료 기준 |
|:-:|--------|--------|----------|
| 8.1 | README.md 작성 | `apps/neuralsense/README.md` | 설치, 실행, 배포 절차 완성 |
| 8.2 | 아키텍처 다이어그램 | 데이터 흐름 다이어그램 | Pi → MQTT → Laptop → Supabase 전체 흐름 |
| 8.3 | 최종 테스트 | 전체 시스템 검증 | 모든 Pi 정상 동작 확인 |

---

## 5. 기술 스펙 (Technical Specifications)

### 핵심 의존성

| 패키지 | 버전 | 환경 | 용도 |
|--------|------|------|------|
| paho-mqtt | >=2.0.0 | Laptop + Pi | MQTT 클라이언트 |
| numpy | latest | Laptop | 수치 연산 |
| scipy | latest | Laptop | 삼변측량 |
| scapy | >=2.6.1 | Pi only | WiFi 패킷 캡처 |

### 주요 파일 경로

| 파일 | 역할 | LOC |
|------|------|-----|
| `apps/neuralsense/config.py` | 중앙 설정 (14개 상수) | 33 |
| `apps/neuralsense/run_live_geometry.py` | 메인 라이브 처리 | ~210 |
| `apps/neuralsense/calibrate_interactive_geometry.py` | 캘리브레이션 | ~191 |
| `apps/neuralsense/neuralsense_pi/sniff_and_send_unified.py` | Pi 스니퍼 (메인) | ~185 |
| `apps/neuralsense/neuralsense_pi/set_monitor_mode.py` | 모니터 모드 설정 | ~93 |
| `apps/neuralsense/zones.csv` | 19개 존 좌표 | — |

### config.py 현재 상수 (14개)
```python
MQTT_BROKER_IP = os.getenv("MQTT_BROKER_IP", "100.87.27.7")
MQTT_BROKER_PORT = int(os.getenv("MQTT_BROKER_PORT", "1883"))
MQTT_TOPIC_PREFIX = os.getenv("MQTT_TOPIC_PREFIX", "neuralsense")
PI_IDS = os.getenv("PI_IDS", "pi5,pi6,...,pi13").split(",")
MIN_SOURCES = int(os.getenv("MIN_SOURCES", "2"))
WINDOW_SEC = int(os.getenv("WINDOW_SEC", "5"))
RSSI_THRESHOLD = int(os.getenv("RSSI_THRESHOLD", "-75"))
SMOOTHING_ALPHA = float(os.getenv("SMOOTHING_ALPHA", "0.3"))
TRILATERATION_METHOD = os.getenv("TRILATERATION_METHOD", "weighted")
MAX_DISTANCE_M = float(os.getenv("MAX_DISTANCE_M", "50.0"))
OUTPUT_DIR = os.getenv("OUTPUT_DIR", "./data")
LOG_LEVEL = os.getenv("LOG_LEVEL", "INFO")
KNOWN_DEVICE_MACS = ...
```

### Zone Assignment 알고리즘
1. 각 Pi가 `{pi_id, mac, rssi, timestamp}` MQTT 발행
2. Laptop이 WINDOW_SEC(5초) 내 Pi별 RSSI 수집
3. Pi별 RSSI 중앙값 계산 → 핑거프린트 벡터 생성
4. `calibration.jsonl` 캘리브레이션 벡터와 평균 dBm 차이 비교
5. MATCH_DIFF_DBM(7.0) 이내 최근접 존 할당

---

## 6. 크로스팀 의존성 (Cross-Team Dependencies)

| 공유 리소스 | 소유자 | 변경 시 조율 대상 | 비고 |
|-------------|--------|------------------|------|
| `packages/@neuraltwin/types/` | C (합류 전: A) | **전원** | 타입 변경 시 전 서비스 영향 |
| `process-neuralsense-data` EF | C | B (스키마), D (표시) | MQTT→DB 브릿지 |
| `process-wifi-data` EF | C | B (스키마) | WiFi 추적 데이터 |
| MQTT payload schema | B | C (DB 매핑), D (표시) | IoT 데이터 구조 |
| `zones.csv` 포맷 | B | D (3D 시각화) | 존 좌표 데이터 |
| `wifi_tracking` 테이블 | C | B (데이터 제공), D (표시) | DB 스키마 |

---

## 7. 기술 부채 & 알려진 이슈 (Known Issues & Tech Debt)

| # | 심각도 | 이슈 | 위치 | 해결 방법 |
|:-:|:------:|------|------|----------|
| 1 | **HIGH** | paho-mqtt v1 API 사용 (v2 설치) | 5개 Python 파일 | v2 CallbackAPIVersion 마이그레이션 |
| 2 | **HIGH** | 자동 테스트 0건 | 전체 | pytest 기본 테스트 추가 |
| 3 | **MEDIUM** | `output/` 디렉토리 .gitignore 미포함 | `apps/neuralsense/` | `.gitignore` 생성 |
| 4 | **MEDIUM** | `raw_rssi.jsonl` 무한 증가 | `run_live_geometry.py` | 로그 로테이션 구현 |
| 5 | **MEDIUM** | `run_live.py`와 `run_live_test.py` 동일 client_id | 두 파일 모두 `"laptop-live"` | client_id 분리 |
| 6 | **MEDIUM** | 오프라인 데이터 큐잉 없음 | Pi 스니퍼 | QoS 0 + 저장 없음 = 데이터 유실 가능 |
| 7 | **LOW** | systemd 서비스 파일 없음 | Pi | 부팅 시 자동 시작 설정 필요 |
| 8 | **LOW** | MQTT TLS 미사용 (port 1883) | 인프라 | Tailscale VPN으로 보호 중이나, TLS 추가 권장 |
| 9 | **LOW** | README.md 없음 | `apps/neuralsense/` | 문서화 필요 |

---

## 8. 검증 체크리스트 (Verification Checklist)

### Phase 1 (W1-W3)
- [ ] `config.py`에 14개 상수 모두 환경변수 지원 확인
- [ ] 모든 Python 파일이 `config.py` import 사용 (하드코딩 0건)
- [ ] `utils.py` 생성 — 6개 중복 함수 통합
- [ ] paho-mqtt v2 API 마이그레이션 완료 (deprecation warning 0건)
- [ ] MQTT payload JSON Schema 작성 완료
- [ ] JSONL 6종 스키마 정의 완료

### Phase 2 (W4-W5)
- [ ] `.gitignore` 생성 (`output/`, `.venv/`, `__pycache__/`)
- [ ] `.env.example` 생성
- [ ] Pi 배포 스크립트 작성
- [ ] `ruff check .` 통과
- [ ] `mypy .` 통과
- [ ] `pytest` 기본 테스트 3개 이상

### Phase 3 (W6-W8)
- [ ] `supabase_bridge.py` 작동 확인
- [ ] E2E 데이터 흐름 테스트 통과
- [ ] `raw_rssi.jsonl` 로그 로테이션 구현
- [ ] README.md 작성 완료

---

## 9. 참조 파일 (Reference Files)

| 파일 | 위치 | 참조 섹션 |
|------|------|----------|
| REPO_ANALYSIS_B.md | `apps/neuralsense/REPO_ANALYSIS_B.md` | **전체** — 코드 구조, 의존성, 기술 부채, 마이그레이션 계획 |
| SCHEMA_MAPPING.md | `apps/neuralsense/SCHEMA_MAPPING.md` | 전체 — DB 스키마 매핑 |
| SYSTEM_ARCHITECTURE.md | `docs/SYSTEM_ARCHITECTURE.md` | Sec 4 (IoT Data Flow), Sec 5 (기술 스택) |
| REPO_ANALYSIS_C.md | `supabase/REPO_ANALYSIS_C.md` | Sec 4 (process-neuralsense-data, process-wifi-data EF) — W6 브릿지 준비 |
| CTO_NEURALSENSE_SUPABASE_INTEGRATION_GUIDE.md | `apps/os-dashboard/docs/CTO_NEURALSENSE_SUPABASE_INTEGRATION_GUIDE.md` | 전체 — Supabase 연동 가이드 |

---

## 10. 비상 절차 (Emergency Procedures)

### MQTT 브로커 다운 시
```bash
# 브로커 상태 확인
ssh pi@100.87.27.7 "systemctl status mosquitto"

# 브로커 재시작
ssh pi@100.87.27.7 "sudo systemctl restart mosquitto"

# 연결 테스트
mosquitto_pub -h 100.87.27.7 -p 1883 -t "test" -m "hello"
mosquitto_sub -h 100.87.27.7 -p 1883 -t "test"
```

### Pi 스니퍼 문제 시
```bash
# Pi SSH 접속
ssh pi@<tailscale-ip>

# 프로세스 확인
ps aux | grep sniff

# 네트워크 인터페이스 확인
iwconfig

# 모니터 모드 재설정
sudo python set_monitor_mode.py

# 스니퍼 재시작
sudo python sniff_and_send_unified.py --mode production
```

### 데이터 유실 의심 시
```bash
# MQTT 메시지 직접 확인
mosquitto_sub -h 100.87.27.7 -p 1883 -t "neuralsense/rssi" -v

# raw_rssi.jsonl 최근 데이터 확인
tail -10 output/raw_rssi.jsonl

# 각 Pi 마지막 메시지 시각 확인 (5초 이상 차이 시 이상)
```

### 롤백
```bash
# Git 롤백
git revert <commit-hash>

# Pi 코드 롤백
ssh pi@<ip> "cd ~/neuralsense_pi && git checkout <hash>"
```

### 에스컬레이션 경로
```
Data Pipeline Agent / MQTT Agent / Python Agent → B (Team Lead) → A (Orchestrator)
```
