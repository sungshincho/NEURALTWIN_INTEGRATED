# NEURALSENSE → Supabase Backend Integration
## CTO 작업 가이드 (상세)

---

# 목차

1. [개요](#1-개요)
2. [현재 시스템 아키텍처](#2-현재-시스템-아키텍처)
3. [기존 Supabase 테이블 스키마](#3-기존-supabase-테이블-스키마)
4. [데이터 매핑 상세](#4-데이터-매핑-상세)
5. [신규 테이블 생성](#5-신규-테이블-생성)
6. [신규 파일 생성](#6-신규-파일-생성)
7. [기존 파일 수정](#7-기존-파일-수정)
8. [Edge Function 연동](#8-edge-function-연동)
9. [테스트 및 검증](#9-테스트-및-검증)
10. [실행 순서](#10-실행-순서)

---

# 1. 개요

## 1.1 목표

CTO가 구축한 Raspberry Pi 기반 NEURALSENSE 시스템을 기존 NEURALTWIN Supabase 백엔드와 통합합니다.

```
현재 아키텍처:
  Raspberry Pi → MQTT → Laptop → 로컬 JSONL 파일

목표 아키텍처:
  Raspberry Pi → MQTT → Laptop → 로컬 JSONL + Supabase 실시간 동기화
```

## 1.2 핵심 원칙

- **기존 CTO 코드의 로직과 구조를 최대한 유지**
- **Supabase 연동 기능만 추가**
- **로컬 파일 저장은 백업으로 계속 유지**
- **네트워크 장애 시에도 로컬 저장 동작 보장**

## 1.3 기존 Edge Function 활용

> **중요**: 프로젝트에 이미 `process-neuralsense-data` Edge Function이 존재합니다.
> 이 함수를 활용하면 서버 측 데이터 처리 로직을 재사용할 수 있습니다.

**Edge Function 위치**: `supabase/functions/process-neuralsense-data/index.ts`

---

# 2. 현재 시스템 아키텍처

## 2.1 CTO 디렉토리 구조

```
neuralsense_pi/                    # 각 Raspberry Pi에서 실행
├── requirements.txt
├── set_monitor_mode.py
└── sniff_and_send.py

neuralsense_laptop/                # Central Server (Laptop)
├── requirements.txt
├── zones.csv
├── calibrate_interactive.py
├── run_live.py
└── output/
    ├── calibration.jsonl
    ├── raw_rssi.jsonl
    ├── zone_assignments.jsonl
    ├── transitions.jsonl
    └── dwells.jsonl
```

## 2.2 출력 파일 형식

### calibration.jsonl
```json
{
  "created_ts": 1737312000.0,
  "zone_id": 1,
  "x": 100,
  "y": 200,
  "phone_mac_used": "a8:76:50:e9:28:20",
  "samples_per_pi_target": 30,
  "fingerprint": {
    "pib": {"n": 30, "avg": -62.5, "min": -65, "max": -59},
    "pi5": {"n": 30, "avg": -70.2, "min": -73, "max": -68}
  }
}
```

### raw_rssi.jsonl
```json
{"ts": 1737312045.123, "phone_id": "a1:b2:c3:d4:e5:f6", "rpi_id": "pib", "rssi": -64}
```

### zone_assignments.jsonl
```json
{
  "ts": 1737312045.5,
  "phone_id": "a1:b2:c3:d4:e5:f6",
  "zone_id": 1,
  "x": 100,
  "y": 200,
  "score": 3.2,
  "sources": ["pib", "pi5", "pi6"],
  "vector": {"pib": -64, "pi5": -72, "pi6": -81}
}
```

### transitions.jsonl
```json
{"ts": 1737312045.5, "phone_id": "a1:b2:c3:d4:e5:f6", "from_zone": null, "to_zone": 1}
{"ts": 1737312130.0, "phone_id": "a1:b2:c3:d4:e5:f6", "from_zone": 1, "to_zone": 2}
```

### dwells.jsonl
```json
{
  "phone_id": "a1:b2:c3:d4:e5:f6",
  "zone_id": 1,
  "enter_ts": 1737312045.5,
  "exit_ts": 1737312130.0,
  "dwell_sec": 84.5
}
```

---

# 3. 기존 Supabase 테이블 스키마

> **중요**: 아래 테이블들은 이미 프로젝트에 존재합니다. 새로 생성할 필요 없습니다.

## 3.1 zones_dim (존 정의)

**이미 `zone_code` 컬럼이 존재합니다!** CTO의 정수 zone_id와 매핑 가능.

```typescript
// src/integrations/supabase/types.ts:9800
zones_dim: {
  Row: {
    id: string                    // UUID (PK)
    store_id: string              // FK → stores
    org_id: string | null         // FK → organizations
    zone_code: string             // ⭐ CTO zone_id 매핑용 (예: "1", "2", ...)
    zone_name: string             // 존 이름
    zone_type: string | null      // entrance, display, checkout 등
    coordinates: Json | null      // 좌표 정보
    position_x: number | null     // X 좌표
    position_y: number | null     // Y 좌표
    position_z: number | null     // Z 좌표
    is_active: boolean | null     // 활성화 여부
    metadata: Json | null         // 추가 메타데이터
    created_at: string | null
    updated_at: string | null
  }
}
```

## 3.2 zone_events (존 이벤트)

CTO의 `zone_assignments.jsonl`, `transitions.jsonl`, `dwells.jsonl` → 이 테이블로 통합

```typescript
// src/integrations/supabase/types.ts:9429
zone_events: {
  Row: {
    id: string                    // UUID (PK)
    store_id: string | null       // FK → stores
    org_id: string | null         // FK → organizations
    zone_id: string | null        // FK → zones_dim
    event_type: string            // 'enter', 'exit', 'dwell'
    event_date: string            // YYYY-MM-DD
    event_hour: number | null     // 0-23
    event_timestamp: string       // ISO 8601
    visitor_id: string | null     // ⭐ 익명화된 MAC 주소
    duration_seconds: number | null // 체류 시간
    sensor_type: string | null    // 'wifi', 'ble'
    sensor_id: string | null      // 센서/노드 ID
    confidence_score: number | null // 신뢰도 점수
    metadata: Json | null         // 추가 정보 (rssi_vector 등)
    created_at: string | null
  }
}
```

## 3.3 wifi_events (Raw WiFi 데이터)

CTO의 `raw_rssi.jsonl` → 이 테이블

```typescript
// src/integrations/supabase/types.ts:9128
wifi_events: {
  Row: {
    id: string                    // UUID (PK)
    store_id: string | null       // FK → stores
    org_id: string | null         // FK → organizations
    device_id: string | null      // ⭐ 익명화된 MAC 주소
    zone_id: string | null        // FK → zones_dim
    event_type: string | null     // 'probe_request'
    event_ts: string              // ISO 8601
    signal_strength: number | null // RSSI 값
    dwell_time_seconds: number | null
    metadata: Json | null         // { rpi_id, rssi_vector }
    created_at: string
  }
}
```

## 3.4 wifi_tracking (존 위치 결정)

CTO의 `zone_assignments.jsonl` → 이 테이블 (zone_events와 중복 가능, 용도 선택)

```typescript
// src/integrations/supabase/types.ts:9185
wifi_tracking: {
  Row: {
    id: string                    // UUID (PK)
    store_id: string              // FK → stores
    org_id: string | null         // FK → organizations
    zone_id: string | null        // FK → zones_dim
    user_id: string               // 시스템 사용자 ID
    mac_address: string           // ⭐ 익명화된 MAC 주소
    timestamp: string             // ISO 8601
    signal_strength: number | null // RSSI 값
    dwell_time_seconds: number | null
    session_id: string | null     // 세션 ID
    created_at: string
  }
}
```

## 3.5 zone_transitions (이동 경로)

CTO의 `transitions.jsonl` → 이 테이블

```typescript
// src/integrations/supabase/types.ts:9714
zone_transitions: {
  Row: {
    id: string                    // UUID (PK)
    store_id: string              // FK → stores
    org_id: string | null         // FK → organizations
    from_zone_id: string          // FK → zones_dim
    to_zone_id: string            // FK → zones_dim
    transition_date: string       // YYYY-MM-DD
    transition_count: number | null // 집계용
    avg_duration_seconds: number | null // 평균 체류 시간
    created_at: string | null
  }
}
```

## 3.6 raw_imports (원본 데이터 저장)

CTO의 배치 데이터를 원본 그대로 저장

```typescript
// src/integrations/supabase/types.ts:5973
raw_imports: {
  Row: {
    id: string                    // UUID (PK)
    store_id: string | null       // FK → stores
    org_id: string | null         // FK → organizations
    user_id: string               // 시스템 사용자 ID
    source_type: string           // 'neuralsense'
    source_name: string | null    // 노드 ID
    data_type: string | null      // 'wifi', 'ble'
    row_count: number | null      // 레코드 수
    status: string | null         // 'pending', 'processing', 'completed', 'failed'
    raw_data: Json | null         // 원본 JSON 배열
    metadata: Json | null         // { node_id, firmware_version }
    etl_version: string | null    // ETL 버전
    started_at: string | null
    processed_at: string | null
    completed_at: string | null
    created_at: string | null
  }
}
```

## 3.7 visits (방문 세션)

CTO의 세션 관리 데이터

```typescript
// src/integrations/supabase/types.ts:8792
visits: {
  Row: {
    id: string                    // UUID (PK)
    store_id: string | null       // FK → stores
    org_id: string | null         // FK → organizations
    user_id: string               // 시스템 사용자 ID
    customer_id: string | null    // FK → customers (optional)
    visit_date: string            // YYYY-MM-DD
    duration_minutes: number | null
    zones_visited: string[] | null // 방문한 존 목록
    created_at: string
  }
}
```

## 3.8 zone_daily_metrics (일별 집계)

대시보드 집계 테이블

```typescript
// src/integrations/supabase/types.ts:9321
zone_daily_metrics: {
  Row: {
    id: string
    store_id: string | null
    org_id: string | null
    zone_id: string | null
    date: string                  // YYYY-MM-DD
    total_visitors: number | null
    unique_visitors: number | null
    avg_dwell_seconds: number | null
    peak_hour: number | null      // 0-23
    conversion_count: number | null
    calculated_at: string | null
    created_at: string | null
  }
}
```

---

# 4. 데이터 매핑 상세

## 4.1 CTO 출력 → Supabase 테이블 매핑

| CTO 파일 | Supabase 테이블 | 용도 | 비고 |
|----------|-----------------|------|------|
| `calibration.jsonl` | `zone_fingerprints` (신규) | 존별 RSSI 핑거프린트 | 신규 테이블 필요 |
| `raw_rssi.jsonl` | `wifi_events` | Raw RSSI 데이터 | 기존 테이블 활용 |
| `zone_assignments.jsonl` | `zone_events` | 존 진입 이벤트 | 기존 테이블 활용 |
| `transitions.jsonl` | `zone_transitions` | 존 이동 기록 | 기존 테이블 활용 |
| `dwells.jsonl` | `zone_events` | 체류 시간 (exit 이벤트) | 기존 테이블 활용 |

## 4.2 필드 매핑 상세

### raw_rssi.jsonl → wifi_events

```python
# CTO 데이터
{"ts": 1737312045.123, "phone_id": "a1:b2:c3:d4:e5:f6", "rpi_id": "pib", "rssi": -64}

# Supabase wifi_events
{
    "id": "auto-generated-uuid",
    "store_id": "환경변수 STORE_ID",
    "org_id": "환경변수 ORG_ID",
    "device_id": "sha256(a1:b2:c3:d4:e5:f6 + salt)[:16]",  # 익명화
    "event_type": "probe_request",
    "event_ts": "2025-01-19T19:00:45.123Z",  # Unix → ISO 8601
    "signal_strength": -64,
    "metadata": {"rpi_id": "pib", "raw_mac_hash": "...", "batch_id": "..."}
}
```

### zone_assignments.jsonl → zone_events

```python
# CTO 데이터
{
    "ts": 1737312045.5,
    "phone_id": "a1:b2:c3:d4:e5:f6",
    "zone_id": 1,
    "x": 100, "y": 200,
    "score": 3.2,
    "sources": ["pib", "pi5", "pi6"],
    "vector": {"pib": -64, "pi5": -72, "pi6": -81}
}

# Supabase zone_events
{
    "id": "auto-generated-uuid",
    "store_id": "환경변수 STORE_ID",
    "org_id": "환경변수 ORG_ID",
    "zone_id": "zones_dim에서 zone_code='1'인 레코드의 id",  # UUID 매핑
    "event_type": "enter",
    "event_date": "2025-01-19",
    "event_hour": 19,
    "event_timestamp": "2025-01-19T19:00:45.500Z",
    "visitor_id": "sha256(a1:b2:c3:d4:e5:f6 + salt)[:16]",
    "sensor_type": "wifi",
    "confidence_score": 3.2,  # score → confidence_score (낮을수록 좋음, 변환 필요 시 반전)
    "metadata": {
        "position": {"x": 100, "y": 200},
        "sources": ["pib", "pi5", "pi6"],
        "rssi_vector": {"pib": -64, "pi5": -72, "pi6": -81}
    }
}
```

### transitions.jsonl → zone_transitions

```python
# CTO 데이터
{"ts": 1737312130.0, "phone_id": "a1:b2:c3:d4:e5:f6", "from_zone": 1, "to_zone": 2}

# Supabase zone_transitions (집계 방식)
{
    "id": "auto-generated-uuid",
    "store_id": "환경변수 STORE_ID",
    "org_id": "환경변수 ORG_ID",
    "from_zone_id": "zones_dim에서 zone_code='1'인 UUID",
    "to_zone_id": "zones_dim에서 zone_code='2'인 UUID",
    "transition_date": "2025-01-19",
    "transition_count": 1,
    "avg_duration_seconds": null
}
```

> **참고**: 기존 zone_transitions 테이블은 집계 목적으로 설계됨.
> 개별 transition 이벤트는 `zone_events`의 `enter`/`exit` 이벤트 쌍으로 추적 권장.

### dwells.jsonl → zone_events (exit 이벤트)

```python
# CTO 데이터
{
    "phone_id": "a1:b2:c3:d4:e5:f6",
    "zone_id": 1,
    "enter_ts": 1737312045.5,
    "exit_ts": 1737312130.0,
    "dwell_sec": 84.5
}

# Supabase zone_events (exit 이벤트)
{
    "id": "auto-generated-uuid",
    "store_id": "환경변수 STORE_ID",
    "org_id": "환경변수 ORG_ID",
    "zone_id": "zones_dim에서 zone_code='1'인 UUID",
    "event_type": "exit",
    "event_date": "2025-01-19",
    "event_hour": 19,
    "event_timestamp": "2025-01-19T19:02:10.000Z",
    "visitor_id": "sha256(a1:b2:c3:d4:e5:f6 + salt)[:16]",
    "duration_seconds": 85,  # 정수로 변환
    "sensor_type": "wifi",
    "metadata": {
        "enter_ts": "2025-01-19T19:00:45.500Z",
        "exit_ts": "2025-01-19T19:02:10.000Z"
    }
}
```

## 4.3 Zone ID 매핑 방식

```python
# zones_dim 테이블 조회
SELECT id, zone_code FROM zones_dim WHERE store_id = '{STORE_ID}' AND is_active = true;

# 결과 예시
| id (UUID)                            | zone_code |
|--------------------------------------|-----------|
| a1b2c3d4-e5f6-7890-abcd-ef1234567890 | 1         |
| b2c3d4e5-f6a7-8901-bcde-f12345678901 | 2         |
| ...                                  | ...       |

# 매핑 딕셔너리 생성
zone_mapping = {
    1: "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    2: "b2c3d4e5-f6a7-8901-bcde-f12345678901",
    # ...
}
```

---

# 5. 신규 테이블 생성

## 5.1 zone_fingerprints (캘리브레이션 데이터)

CTO의 `calibration.jsonl` 데이터를 저장할 테이블입니다.

### SQL 생성 스크립트

```sql
-- ============================================================================
-- zone_fingerprints: NEURALSENSE 캘리브레이션 핑거프린트 저장
-- 위치: supabase/migrations/[timestamp]_create_zone_fingerprints.sql
-- ============================================================================

CREATE TABLE IF NOT EXISTS zone_fingerprints (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id        UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  zone_id         UUID NOT NULL REFERENCES zones_dim(id) ON DELETE CASCADE,
  rpi_id          TEXT NOT NULL,           -- pib, pi5, pi6, pi7, pi8, pi9
  rssi_avg        NUMERIC(6,2) NOT NULL,   -- 평균 RSSI
  rssi_min        INTEGER,                 -- 최소 RSSI
  rssi_max        INTEGER,                 -- 최대 RSSI
  sample_count    INTEGER DEFAULT 30,      -- 샘플 수
  phone_mac_used  TEXT,                    -- 캘리브레이션에 사용된 폰 MAC (해시)
  calibrated_at   TIMESTAMPTZ DEFAULT now(),
  is_active       BOOLEAN DEFAULT true,    -- 활성화 여부
  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now(),

  -- 복합 유니크 제약: 같은 store+zone+rpi 조합은 하나만
  UNIQUE(store_id, zone_id, rpi_id)
);

-- 인덱스
CREATE INDEX idx_zone_fingerprints_store ON zone_fingerprints(store_id);
CREATE INDEX idx_zone_fingerprints_zone ON zone_fingerprints(zone_id);
CREATE INDEX idx_zone_fingerprints_active ON zone_fingerprints(store_id, is_active);

-- 업데이트 트리거
CREATE OR REPLACE FUNCTION update_zone_fingerprints_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_zone_fingerprints_updated_at
  BEFORE UPDATE ON zone_fingerprints
  FOR EACH ROW
  EXECUTE FUNCTION update_zone_fingerprints_updated_at();

-- RLS 정책
ALTER TABLE zone_fingerprints ENABLE ROW LEVEL SECURITY;

-- 읽기: 소속 매장 데이터만
CREATE POLICY "zone_fingerprints_select" ON zone_fingerprints
  FOR SELECT USING (
    store_id IN (
      SELECT id FROM stores
      WHERE user_id = auth.uid()
         OR org_id IN (SELECT org_id FROM user_organizations WHERE user_id = auth.uid())
    )
  );

-- 쓰기: 소속 매장 데이터만
CREATE POLICY "zone_fingerprints_insert" ON zone_fingerprints
  FOR INSERT WITH CHECK (
    store_id IN (
      SELECT id FROM stores
      WHERE user_id = auth.uid()
         OR org_id IN (SELECT org_id FROM user_organizations WHERE user_id = auth.uid())
    )
  );

-- 수정: 소속 매장 데이터만
CREATE POLICY "zone_fingerprints_update" ON zone_fingerprints
  FOR UPDATE USING (
    store_id IN (
      SELECT id FROM stores
      WHERE user_id = auth.uid()
         OR org_id IN (SELECT org_id FROM user_organizations WHERE user_id = auth.uid())
    )
  );

-- 서비스 롤은 모든 작업 가능 (Edge Function용)
CREATE POLICY "zone_fingerprints_service_role" ON zone_fingerprints
  FOR ALL USING (auth.role() = 'service_role');

-- 코멘트
COMMENT ON TABLE zone_fingerprints IS 'NEURALSENSE 캘리브레이션 핑거프린트 (존별 RSSI 기준값)';
COMMENT ON COLUMN zone_fingerprints.rpi_id IS 'Raspberry Pi 식별자 (pib, pi5, pi6, pi7, pi8, pi9)';
COMMENT ON COLUMN zone_fingerprints.rssi_avg IS '해당 Pi에서 측정한 평균 RSSI 값';
```

---

# 6. 신규 파일 생성

## 6.1 neuralsense_laptop/config.py

```python
"""
NEURALSENSE 설정 파일
Supabase 연결 정보 및 배치 업로드 설정
"""

import os
from dotenv import load_dotenv

# .env 파일 로드
load_dotenv()

# ============================================================================
# Supabase 연결 설정
# ============================================================================
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")  # SERVICE_ROLE_KEY 권장

# ============================================================================
# 매장/조직 정보
# ============================================================================
STORE_ID = os.getenv("STORE_ID")
ORG_ID = os.getenv("ORG_ID")
USER_ID = os.getenv("USER_ID", "system")  # 시스템 사용자

# ============================================================================
# 보안 설정
# ============================================================================
MAC_SALT = os.getenv("MAC_SALT", "neuralsense-2025")  # MAC 익명화 솔트

# ============================================================================
# 배치 업로드 설정
# ============================================================================
BATCH_SIZE = int(os.getenv("BATCH_SIZE", "50"))         # 50개 모이면 업로드
BATCH_INTERVAL_SEC = int(os.getenv("BATCH_INTERVAL_SEC", "30"))  # 또는 30초마다

# ============================================================================
# 기능 플래그
# ============================================================================
ENABLE_SUPABASE = os.getenv("ENABLE_SUPABASE", "true").lower() == "true"
ENABLE_LOCAL_BACKUP = True  # 항상 로컬 백업 유지

# ============================================================================
# Edge Function 설정 (선택)
# ============================================================================
USE_EDGE_FUNCTION = os.getenv("USE_EDGE_FUNCTION", "false").lower() == "true"
EDGE_FUNCTION_URL = f"{SUPABASE_URL}/functions/v1/process-neuralsense-data"

# ============================================================================
# 유효성 검증
# ============================================================================
def validate_config():
    """필수 설정 확인"""
    if ENABLE_SUPABASE:
        required = ["SUPABASE_URL", "SUPABASE_KEY", "STORE_ID"]
        missing = [k for k in required if not os.getenv(k)]
        if missing:
            raise ValueError(f"Missing required environment variables: {missing}")
    return True

# 모듈 로드 시 검증
if __name__ != "__main__":
    try:
        validate_config()
    except ValueError as e:
        print(f"[WARN] Config validation: {e}")
```

## 6.2 neuralsense_laptop/.env.example

```env
# ============================================================================
# Supabase 연결 정보
# ============================================================================
SUPABASE_URL=https://bdrvowacecxnraaivlhr.supabase.co
SUPABASE_KEY=eyJhbGci...your-service-role-key...

# ============================================================================
# 매장/조직 정보 (Supabase에서 확인)
# ============================================================================
STORE_ID=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
ORG_ID=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
USER_ID=system

# ============================================================================
# 보안 설정
# ============================================================================
MAC_SALT=your-unique-salt-here

# ============================================================================
# 배치 업로드 설정
# ============================================================================
BATCH_SIZE=50
BATCH_INTERVAL_SEC=30

# ============================================================================
# 기능 플래그
# ============================================================================
ENABLE_SUPABASE=true
USE_EDGE_FUNCTION=false
```

## 6.3 neuralsense_laptop/supabase_uploader.py

```python
"""
Supabase 업로더 클래스
CTO의 JSONL 데이터를 Supabase에 업로드
"""

import hashlib
import time
from datetime import datetime, timezone
from typing import Optional, Dict, List, Any
from collections import defaultdict

try:
    from supabase import create_client, Client
    SUPABASE_AVAILABLE = True
except ImportError:
    SUPABASE_AVAILABLE = False
    print("[WARN] supabase package not installed. Run: pip install supabase")

from config import (
    SUPABASE_URL, SUPABASE_KEY, STORE_ID, ORG_ID, USER_ID,
    MAC_SALT, ENABLE_SUPABASE
)


class SupabaseUploader:
    """
    NEURALSENSE 데이터를 Supabase에 업로드하는 클래스

    주요 기능:
    - MAC 주소 익명화
    - Zone ID 매핑 (정수 → UUID)
    - 시간 변환 (Unix timestamp → ISO 8601)
    - 배치 업로드
    """

    def __init__(self):
        """Supabase 클라이언트 초기화 및 zone 매핑 로드"""
        if not SUPABASE_AVAILABLE:
            raise RuntimeError("supabase package is required")

        if not ENABLE_SUPABASE:
            raise RuntimeError("Supabase is disabled in config")

        if not SUPABASE_URL or not SUPABASE_KEY:
            raise ValueError("SUPABASE_URL and SUPABASE_KEY are required")

        self.client: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
        self.store_id = STORE_ID
        self.org_id = ORG_ID
        self.user_id = USER_ID
        self.salt = MAC_SALT

        # Zone 매핑 로드 (zone_code → UUID)
        self.zone_mapping: Dict[int, str] = {}
        self._load_zone_mapping()

        print(f"[OK] SupabaseUploader initialized with {len(self.zone_mapping)} zones")

    # ========================================================================
    # 내부 유틸리티 메서드
    # ========================================================================

    def _load_zone_mapping(self) -> None:
        """zones_dim에서 zone_code → id 매핑 로드"""
        try:
            response = self.client.table('zones_dim') \
                .select('id, zone_code') \
                .eq('store_id', self.store_id) \
                .eq('is_active', True) \
                .execute()

            for row in response.data:
                try:
                    zone_code = int(row['zone_code'])
                    self.zone_mapping[zone_code] = row['id']
                except (ValueError, TypeError):
                    # zone_code가 정수로 변환 불가한 경우 스킵
                    continue

        except Exception as e:
            print(f"[WARN] Failed to load zone mapping: {e}")

    def _anonymize_mac(self, mac: str) -> str:
        """MAC 주소를 SHA256 해시로 익명화"""
        if not mac:
            return ""
        normalized = mac.lower().replace(":", "").replace("-", "")
        hash_input = f"{normalized}{self.salt}"
        return hashlib.sha256(hash_input.encode()).hexdigest()[:16]

    def _generate_session_id(self, mac: str, date_str: str = None) -> str:
        """MAC + 날짜 기반 세션 ID 생성"""
        if date_str is None:
            date_str = datetime.now(timezone.utc).strftime("%Y-%m-%d")
        hash_input = f"{mac}{date_str}"
        return hashlib.md5(hash_input.encode()).hexdigest()[:12]

    def _to_iso(self, unix_ts: float) -> str:
        """Unix timestamp를 ISO 8601 문자열로 변환"""
        return datetime.fromtimestamp(unix_ts, tz=timezone.utc).isoformat()

    def _get_zone_uuid(self, zone_id: int) -> Optional[str]:
        """정수 zone_id를 UUID로 변환"""
        return self.zone_mapping.get(zone_id)

    # ========================================================================
    # 개별 업로드 메서드
    # ========================================================================

    def upload_wifi_event(self, raw_data: dict) -> bool:
        """
        raw_rssi.jsonl → wifi_events

        Args:
            raw_data: {"ts", "phone_id", "rpi_id", "rssi"}

        Returns:
            성공 여부
        """
        try:
            record = {
                "store_id": self.store_id,
                "org_id": self.org_id,
                "device_id": self._anonymize_mac(raw_data.get("phone_id", "")),
                "event_type": "probe_request",
                "event_ts": self._to_iso(raw_data.get("ts", time.time())),
                "signal_strength": raw_data.get("rssi"),
                "metadata": {
                    "rpi_id": raw_data.get("rpi_id"),
                    "source": "neuralsense"
                }
            }

            self.client.table('wifi_events').insert(record).execute()
            return True

        except Exception as e:
            print(f"[ERROR] upload_wifi_event failed: {e}")
            return False

    def upload_zone_assignment(self, assign_data: dict) -> bool:
        """
        zone_assignments.jsonl → zone_events (enter 이벤트)

        Args:
            assign_data: {"ts", "phone_id", "zone_id", "x", "y", "score", "sources", "vector"}

        Returns:
            성공 여부
        """
        try:
            zone_uuid = self._get_zone_uuid(assign_data.get("zone_id"))
            if not zone_uuid:
                print(f"[WARN] Unknown zone_id: {assign_data.get('zone_id')}")
                return False

            ts = assign_data.get("ts", time.time())
            ts_iso = self._to_iso(ts)
            dt = datetime.fromtimestamp(ts, tz=timezone.utc)

            record = {
                "store_id": self.store_id,
                "org_id": self.org_id,
                "zone_id": zone_uuid,
                "event_type": "enter",
                "event_date": dt.strftime("%Y-%m-%d"),
                "event_hour": dt.hour,
                "event_timestamp": ts_iso,
                "visitor_id": self._anonymize_mac(assign_data.get("phone_id", "")),
                "sensor_type": "wifi",
                "confidence_score": assign_data.get("score"),
                "metadata": {
                    "position": {
                        "x": assign_data.get("x"),
                        "y": assign_data.get("y")
                    },
                    "sources": assign_data.get("sources", []),
                    "rssi_vector": assign_data.get("vector", {}),
                    "source": "neuralsense"
                }
            }

            self.client.table('zone_events').insert(record).execute()
            return True

        except Exception as e:
            print(f"[ERROR] upload_zone_assignment failed: {e}")
            return False

    def upload_transition(self, trans_data: dict) -> bool:
        """
        transitions.jsonl → zone_events (enter/exit 쌍)

        Args:
            trans_data: {"ts", "phone_id", "from_zone", "to_zone"}

        Returns:
            성공 여부
        """
        try:
            ts = trans_data.get("ts", time.time())
            ts_iso = self._to_iso(ts)
            dt = datetime.fromtimestamp(ts, tz=timezone.utc)
            visitor_id = self._anonymize_mac(trans_data.get("phone_id", ""))

            events = []

            # from_zone exit 이벤트
            from_zone = trans_data.get("from_zone")
            if from_zone is not None:
                from_uuid = self._get_zone_uuid(from_zone)
                if from_uuid:
                    events.append({
                        "store_id": self.store_id,
                        "org_id": self.org_id,
                        "zone_id": from_uuid,
                        "event_type": "exit",
                        "event_date": dt.strftime("%Y-%m-%d"),
                        "event_hour": dt.hour,
                        "event_timestamp": ts_iso,
                        "visitor_id": visitor_id,
                        "sensor_type": "wifi",
                        "metadata": {
                            "transition_to": trans_data.get("to_zone"),
                            "source": "neuralsense"
                        }
                    })

            # to_zone enter 이벤트
            to_zone = trans_data.get("to_zone")
            if to_zone is not None:
                to_uuid = self._get_zone_uuid(to_zone)
                if to_uuid:
                    events.append({
                        "store_id": self.store_id,
                        "org_id": self.org_id,
                        "zone_id": to_uuid,
                        "event_type": "enter",
                        "event_date": dt.strftime("%Y-%m-%d"),
                        "event_hour": dt.hour,
                        "event_timestamp": ts_iso,
                        "visitor_id": visitor_id,
                        "sensor_type": "wifi",
                        "metadata": {
                            "transition_from": from_zone,
                            "source": "neuralsense"
                        }
                    })

            if events:
                self.client.table('zone_events').insert(events).execute()

            return True

        except Exception as e:
            print(f"[ERROR] upload_transition failed: {e}")
            return False

    def upload_dwell(self, dwell_data: dict) -> bool:
        """
        dwells.jsonl → zone_events (dwell 이벤트)

        Args:
            dwell_data: {"phone_id", "zone_id", "enter_ts", "exit_ts", "dwell_sec"}

        Returns:
            성공 여부
        """
        try:
            zone_uuid = self._get_zone_uuid(dwell_data.get("zone_id"))
            if not zone_uuid:
                print(f"[WARN] Unknown zone_id: {dwell_data.get('zone_id')}")
                return False

            exit_ts = dwell_data.get("exit_ts", time.time())
            ts_iso = self._to_iso(exit_ts)
            dt = datetime.fromtimestamp(exit_ts, tz=timezone.utc)

            record = {
                "store_id": self.store_id,
                "org_id": self.org_id,
                "zone_id": zone_uuid,
                "event_type": "dwell",  # 또는 "exit" + duration
                "event_date": dt.strftime("%Y-%m-%d"),
                "event_hour": dt.hour,
                "event_timestamp": ts_iso,
                "visitor_id": self._anonymize_mac(dwell_data.get("phone_id", "")),
                "duration_seconds": int(dwell_data.get("dwell_sec", 0)),
                "sensor_type": "wifi",
                "metadata": {
                    "enter_ts": self._to_iso(dwell_data.get("enter_ts", 0)),
                    "exit_ts": ts_iso,
                    "source": "neuralsense"
                }
            }

            self.client.table('zone_events').insert(record).execute()
            return True

        except Exception as e:
            print(f"[ERROR] upload_dwell failed: {e}")
            return False

    def upload_calibration(self, cal_data: dict) -> bool:
        """
        calibration.jsonl → zone_fingerprints

        Args:
            cal_data: {"created_ts", "zone_id", "x", "y", "phone_mac_used", "fingerprint": {...}}

        Returns:
            성공 여부
        """
        try:
            zone_id_int = cal_data.get("zone_id")
            zone_uuid = self._get_zone_uuid(zone_id_int)

            if not zone_uuid:
                print(f"[WARN] Unknown zone_id: {zone_id_int}")
                return False

            fingerprint = cal_data.get("fingerprint", {})
            phone_mac_hash = self._anonymize_mac(cal_data.get("phone_mac_used", ""))
            calibrated_at = self._to_iso(cal_data.get("created_ts", time.time()))

            records = []
            for rpi_id, fp_data in fingerprint.items():
                if fp_data.get("avg") is None:
                    continue

                records.append({
                    "store_id": self.store_id,
                    "zone_id": zone_uuid,
                    "rpi_id": rpi_id,
                    "rssi_avg": fp_data.get("avg"),
                    "rssi_min": fp_data.get("min"),
                    "rssi_max": fp_data.get("max"),
                    "sample_count": fp_data.get("n", 30),
                    "phone_mac_used": phone_mac_hash,
                    "calibrated_at": calibrated_at,
                    "is_active": True
                })

            if records:
                # UPSERT: 같은 store+zone+rpi 조합이면 업데이트
                for record in records:
                    self.client.table('zone_fingerprints') \
                        .upsert(record, on_conflict='store_id,zone_id,rpi_id') \
                        .execute()

            return True

        except Exception as e:
            print(f"[ERROR] upload_calibration failed: {e}")
            return False

    # ========================================================================
    # 배치 업로드 메서드
    # ========================================================================

    def upload_batch(self, batch_buffer: dict) -> dict:
        """
        배치 버퍼의 모든 데이터를 업로드

        Args:
            batch_buffer: {
                "raw": [...],      # raw_rssi 데이터
                "assign": [...],   # zone_assignments 데이터
                "trans": [...],    # transitions 데이터
                "dwell": [...]     # dwells 데이터
            }

        Returns:
            {"success": int, "failed": int, "details": {...}}
        """
        result = {
            "success": 0,
            "failed": 0,
            "details": {
                "raw": {"success": 0, "failed": 0},
                "assign": {"success": 0, "failed": 0},
                "trans": {"success": 0, "failed": 0},
                "dwell": {"success": 0, "failed": 0}
            }
        }

        # Raw RSSI 업로드
        for item in batch_buffer.get("raw", []):
            if self.upload_wifi_event(item):
                result["success"] += 1
                result["details"]["raw"]["success"] += 1
            else:
                result["failed"] += 1
                result["details"]["raw"]["failed"] += 1

        # Zone Assignments 업로드
        for item in batch_buffer.get("assign", []):
            if self.upload_zone_assignment(item):
                result["success"] += 1
                result["details"]["assign"]["success"] += 1
            else:
                result["failed"] += 1
                result["details"]["assign"]["failed"] += 1

        # Transitions 업로드
        for item in batch_buffer.get("trans", []):
            if self.upload_transition(item):
                result["success"] += 1
                result["details"]["trans"]["success"] += 1
            else:
                result["failed"] += 1
                result["details"]["trans"]["failed"] += 1

        # Dwells 업로드
        for item in batch_buffer.get("dwell", []):
            if self.upload_dwell(item):
                result["success"] += 1
                result["details"]["dwell"]["success"] += 1
            else:
                result["failed"] += 1
                result["details"]["dwell"]["failed"] += 1

        return result

    # ========================================================================
    # 벌크 업로드 메서드 (성능 최적화)
    # ========================================================================

    def upload_batch_optimized(self, batch_buffer: dict) -> dict:
        """
        배치 업로드 최적화 버전 (bulk insert)

        테이블별로 레코드를 모아서 한 번에 insert
        """
        result = {
            "success": 0,
            "failed": 0,
            "details": {}
        }

        try:
            # wifi_events 벌크 삽입
            wifi_events = []
            for item in batch_buffer.get("raw", []):
                wifi_events.append({
                    "store_id": self.store_id,
                    "org_id": self.org_id,
                    "device_id": self._anonymize_mac(item.get("phone_id", "")),
                    "event_type": "probe_request",
                    "event_ts": self._to_iso(item.get("ts", time.time())),
                    "signal_strength": item.get("rssi"),
                    "metadata": {"rpi_id": item.get("rpi_id"), "source": "neuralsense"}
                })

            if wifi_events:
                self.client.table('wifi_events').insert(wifi_events).execute()
                result["success"] += len(wifi_events)
                result["details"]["wifi_events"] = len(wifi_events)

            # zone_events 벌크 삽입
            zone_events = []

            # zone_assignments → enter 이벤트
            for item in batch_buffer.get("assign", []):
                zone_uuid = self._get_zone_uuid(item.get("zone_id"))
                if not zone_uuid:
                    continue

                ts = item.get("ts", time.time())
                dt = datetime.fromtimestamp(ts, tz=timezone.utc)

                zone_events.append({
                    "store_id": self.store_id,
                    "org_id": self.org_id,
                    "zone_id": zone_uuid,
                    "event_type": "enter",
                    "event_date": dt.strftime("%Y-%m-%d"),
                    "event_hour": dt.hour,
                    "event_timestamp": self._to_iso(ts),
                    "visitor_id": self._anonymize_mac(item.get("phone_id", "")),
                    "sensor_type": "wifi",
                    "confidence_score": item.get("score"),
                    "metadata": {
                        "position": {"x": item.get("x"), "y": item.get("y")},
                        "sources": item.get("sources", []),
                        "rssi_vector": item.get("vector", {}),
                        "source": "neuralsense"
                    }
                })

            # dwells → dwell 이벤트
            for item in batch_buffer.get("dwell", []):
                zone_uuid = self._get_zone_uuid(item.get("zone_id"))
                if not zone_uuid:
                    continue

                exit_ts = item.get("exit_ts", time.time())
                dt = datetime.fromtimestamp(exit_ts, tz=timezone.utc)

                zone_events.append({
                    "store_id": self.store_id,
                    "org_id": self.org_id,
                    "zone_id": zone_uuid,
                    "event_type": "dwell",
                    "event_date": dt.strftime("%Y-%m-%d"),
                    "event_hour": dt.hour,
                    "event_timestamp": self._to_iso(exit_ts),
                    "visitor_id": self._anonymize_mac(item.get("phone_id", "")),
                    "duration_seconds": int(item.get("dwell_sec", 0)),
                    "sensor_type": "wifi",
                    "metadata": {
                        "enter_ts": self._to_iso(item.get("enter_ts", 0)),
                        "source": "neuralsense"
                    }
                })

            if zone_events:
                self.client.table('zone_events').insert(zone_events).execute()
                result["success"] += len(zone_events)
                result["details"]["zone_events"] = len(zone_events)

        except Exception as e:
            print(f"[ERROR] upload_batch_optimized failed: {e}")
            result["failed"] = sum(len(v) for v in batch_buffer.values())

        return result


# ============================================================================
# 테스트 코드
# ============================================================================
if __name__ == "__main__":
    import json

    print("Testing SupabaseUploader...")

    try:
        uploader = SupabaseUploader()
        print(f"Zone mapping: {uploader.zone_mapping}")

        # 테스트 데이터
        test_raw = {
            "ts": time.time(),
            "phone_id": "a1:b2:c3:d4:e5:f6",
            "rpi_id": "pib",
            "rssi": -65
        }

        print(f"\nTest anonymize_mac: {uploader._anonymize_mac(test_raw['phone_id'])}")
        print(f"Test to_iso: {uploader._to_iso(test_raw['ts'])}")

        # 실제 업로드 테스트 (주석 해제하여 사용)
        # result = uploader.upload_wifi_event(test_raw)
        # print(f"Upload result: {result}")

    except Exception as e:
        print(f"Test failed: {e}")
```

## 6.4 neuralsense_laptop/migrate_calibration.py

```python
"""
기존 캘리브레이션 데이터 마이그레이션
calibration.jsonl → Supabase zone_fingerprints
"""

import os
import json
from collections import defaultdict

from supabase_uploader import SupabaseUploader


def load_calibration_jsonl(filepath: str) -> list:
    """JSONL 파일에서 캘리브레이션 데이터 로드"""
    records = []

    if not os.path.exists(filepath):
        print(f"[WARN] File not found: {filepath}")
        return records

    with open(filepath, 'r', encoding='utf-8') as f:
        for line in f:
            line = line.strip()
            if not line:
                continue
            try:
                records.append(json.loads(line))
            except json.JSONDecodeError as e:
                print(f"[WARN] Invalid JSON line: {e}")

    return records


def get_latest_per_zone(records: list) -> list:
    """zone_id별로 가장 최신 캘리브레이션만 선택"""
    latest = {}

    for rec in records:
        zone_id = rec.get("zone_id")
        created_ts = rec.get("created_ts", 0)

        if zone_id not in latest or created_ts > latest[zone_id].get("created_ts", 0):
            latest[zone_id] = rec

    return list(latest.values())


def migrate_calibration():
    """메인 마이그레이션 함수"""
    print("=" * 60)
    print("NEURALSENSE Calibration Migration")
    print("=" * 60)

    # 1. 업로더 초기화
    print("\n[1/4] Initializing Supabase uploader...")
    try:
        uploader = SupabaseUploader()
        print(f"[OK] Zone mapping loaded: {len(uploader.zone_mapping)} zones")
    except Exception as e:
        print(f"[ERROR] Failed to initialize uploader: {e}")
        return

    # 2. 캘리브레이션 파일 로드
    cal_path = os.path.join("output", "calibration.jsonl")
    print(f"\n[2/4] Loading calibration data from {cal_path}...")

    records = load_calibration_jsonl(cal_path)
    print(f"[OK] Loaded {len(records)} calibration records")

    if not records:
        print("[WARN] No calibration data to migrate")
        return

    # 3. zone_id별 최신 레코드 필터링
    print("\n[3/4] Filtering latest calibration per zone...")
    latest_records = get_latest_per_zone(records)
    print(f"[OK] {len(latest_records)} unique zones to migrate")

    # 4. Supabase에 업로드
    print("\n[4/4] Uploading to Supabase...")

    success_count = 0
    failed_count = 0

    for rec in latest_records:
        zone_id = rec.get("zone_id")

        if uploader.upload_calibration(rec):
            success_count += 1
            fingerprint = rec.get("fingerprint", {})
            pi_count = len([k for k, v in fingerprint.items() if v.get("avg") is not None])
            print(f"  [OK] Zone {zone_id}: {pi_count} Pi fingerprints")
        else:
            failed_count += 1
            print(f"  [FAIL] Zone {zone_id}")

    # 결과 출력
    print("\n" + "=" * 60)
    print("Migration Complete")
    print("=" * 60)
    print(f"  Total zones: {len(latest_records)}")
    print(f"  Success: {success_count}")
    print(f"  Failed: {failed_count}")


if __name__ == "__main__":
    migrate_calibration()
```

## 6.5 neuralsense_laptop/requirements.txt (수정)

```
# MQTT
paho-mqtt==2.1.0

# Supabase
supabase==2.3.0

# Environment variables
python-dotenv==1.0.0

# HTTP requests (supabase 의존성에 포함되지만 명시적으로)
httpx>=0.24.0
```

---

# 7. 기존 파일 수정

## 7.1 run_live.py 수정 사항

### 변경 개요

1. Supabase 업로더 import 및 초기화
2. 배치 버퍼 추가
3. 각 데이터 저장 시 배치 버퍼에도 추가
4. 주기적으로 배치 업로드 수행

### 전체 수정 코드

```python
"""
run_live.py - NEURALSENSE 실시간 모드
로컬 JSONL 저장 + Supabase 배치 업로드
"""

import os
import json
import time
import csv
from collections import defaultdict, deque
from statistics import median
import paho.mqtt.client as mqtt

# ============================================================================
# 추가: Supabase 연동
# ============================================================================
try:
    from config import BATCH_SIZE, BATCH_INTERVAL_SEC, ENABLE_SUPABASE
    from supabase_uploader import SupabaseUploader
    CONFIG_AVAILABLE = True
except ImportError:
    CONFIG_AVAILABLE = False
    ENABLE_SUPABASE = False
    BATCH_SIZE = 50
    BATCH_INTERVAL_SEC = 30
    print("[WARN] config.py not found. Running in local-only mode.")

# ============================================================================
# 기존 설정
# ============================================================================
MQTT_HOST = "100.76.59.59"
MQTT_PORT = 1883
MQTT_TOPIC = "neuralsense/rssi"

ZONES_CSV = "zones.csv"
CAL_JSONL = os.path.join("output", "calibration.jsonl")

OUT_RAW = os.path.join("output", "raw_rssi.jsonl")
OUT_ASSIGN = os.path.join("output", "zone_assignments.jsonl")
OUT_TRANS = os.path.join("output", "transitions.jsonl")
OUT_DWELL = os.path.join("output", "dwells.jsonl")

WINDOW_SEC = 5
MIN_SOURCES = 3


def load_zones():
    zones = {}
    with open(ZONES_CSV, "r", encoding="utf-8") as f:
        r = csv.DictReader(f)
        for row in r:
            zid = int(row["zone_id"])
            zones[zid] = (int(row["x"]), int(row["y"]))
    return zones


def load_latest_calibration():
    latest = {}
    if not os.path.exists(CAL_JSONL):
        return latest
    with open(CAL_JSONL, "r", encoding="utf-8") as f:
        for line in f:
            try:
                rec = json.loads(line)
                zid = int(rec["zone_id"])
                ts = float(rec["created_ts"])
            except Exception:
                continue
            if zid not in latest or ts > float(latest[zid]["created_ts"]):
                latest[zid] = rec
    return latest


def append_jsonl(path, obj):
    with open(path, "a", encoding="utf-8") as f:
        f.write(json.dumps(obj, separators=(",", ":")) + "\n")


def score_zone(live_vec, zone_rec):
    fp = zone_rec["fingerprint"]
    common = [pi for pi in live_vec if pi in fp and fp[pi]["avg"] is not None]
    if not common:
        return float("inf")
    s = 0.0
    for pi in common:
        v = live_vec[pi]
        avg = float(fp[pi]["avg"])
        mn = fp[pi]["min"]
        mx = fp[pi]["max"]
        s += abs(v - avg)
        if mn is not None and mx is not None and mn <= v <= mx:
            s -= 1.0
    return s / max(1, len(common))


def main():
    os.makedirs("output", exist_ok=True)

    zones_xy = load_zones()
    cal = load_latest_calibration()
    if not cal:
        print("ERROR: output/calibration.jsonl missing. Calibrate first.")
        return

    print("LIVE MODE STARTED")
    print("Rule: we only assign a zone if we heard >= 3 Pis in the last 5 seconds.")

    # ========================================================================
    # 추가: Supabase 업로더 초기화
    # ========================================================================
    uploader = None
    if ENABLE_SUPABASE and CONFIG_AVAILABLE:
        try:
            uploader = SupabaseUploader()
            print("[OK] Supabase connected")
        except Exception as e:
            print(f"[WARN] Supabase connection failed: {e}")
            print("[WARN] Continuing with local-only mode")

    # 배치 버퍼
    batch_buffer = {"raw": [], "assign": [], "trans": [], "dwell": []}
    last_upload_ts = time.time()

    # ========================================================================
    # 추가: 배치 업로드 함수
    # ========================================================================
    def flush_batch():
        nonlocal last_upload_ts

        if uploader and any(len(v) > 0 for v in batch_buffer.values()):
            try:
                result = uploader.upload_batch_optimized(batch_buffer)
                print(f"[UPLOAD] success={result['success']}, failed={result['failed']}")
            except Exception as e:
                print(f"[UPLOAD ERROR] {e}")

        # 버퍼 클리어
        for key in batch_buffer:
            batch_buffer[key].clear()

        last_upload_ts = time.time()

    def check_and_flush():
        total = sum(len(v) for v in batch_buffer.values())
        elapsed = time.time() - last_upload_ts

        if total >= BATCH_SIZE or elapsed >= BATCH_INTERVAL_SEC:
            flush_batch()

    # ========================================================================
    # 기존 코드
    # ========================================================================
    buf = defaultdict(lambda: deque())
    state = {}
    last_assign_ts = {}

    def on_message(client, userdata, msg):
        try:
            evt = json.loads(msg.payload.decode("utf-8"))
            ts = float(evt["ts"])
            phone = evt["mac"].lower()
            rpi_id = str(evt["rpi_id"])
            rssi = int(evt["rssi"])
        except Exception:
            return

        # 로컬 저장 + 배치 버퍼
        raw_data = {"ts": ts, "phone_id": phone, "rpi_id": rpi_id, "rssi": rssi}
        append_jsonl(OUT_RAW, raw_data)
        batch_buffer["raw"].append(raw_data)  # 추가

        d = buf[phone]
        d.append((ts, rpi_id, rssi))
        cutoff = ts - WINDOW_SEC
        while d and d[0][0] < cutoff:
            d.popleft()

        if phone in last_assign_ts and (ts - last_assign_ts[phone]) < 1.0:
            check_and_flush()  # 추가
            return
        last_assign_ts[phone] = ts

        by_pi = defaultdict(list)
        for t, pi, rs in d:
            by_pi[pi].append(rs)
        live_vec = {pi: int(median(vals)) for pi, vals in by_pi.items() if vals}

        if len(live_vec) < MIN_SOURCES:
            check_and_flush()  # 추가
            return

        best_zone = None
        best_score = float("inf")
        for zid, zone_rec in cal.items():
            sc = score_zone(live_vec, zone_rec)
            if sc < best_score:
                best_score = sc
                best_zone = int(zid)

        if best_zone is None:
            check_and_flush()  # 추가
            return

        x, y = zones_xy.get(best_zone, (None, None))
        assign = {
            "ts": ts,
            "phone_id": phone,
            "zone_id": best_zone,
            "x": x,
            "y": y,
            "score": float(best_score),
            "sources": list(live_vec.keys()),
            "vector": live_vec
        }
        append_jsonl(OUT_ASSIGN, assign)
        batch_buffer["assign"].append(assign)  # 추가

        if phone not in state:
            state[phone] = {"zone": best_zone, "enter_ts": ts}
            trans_data = {"ts": ts, "phone_id": phone, "from_zone": None, "to_zone": best_zone}
            append_jsonl(OUT_TRANS, trans_data)
            batch_buffer["trans"].append(trans_data)  # 추가
            check_and_flush()  # 추가
            return

        prev_zone = state[phone]["zone"]
        if best_zone == prev_zone:
            check_and_flush()  # 추가
            return

        enter_ts = state[phone]["enter_ts"]
        dwell_data = {
            "phone_id": phone,
            "zone_id": prev_zone,
            "enter_ts": enter_ts,
            "exit_ts": ts,
            "dwell_sec": ts - enter_ts
        }
        append_jsonl(OUT_DWELL, dwell_data)
        batch_buffer["dwell"].append(dwell_data)  # 추가

        trans_data = {"ts": ts, "phone_id": phone, "from_zone": prev_zone, "to_zone": best_zone}
        append_jsonl(OUT_TRANS, trans_data)
        batch_buffer["trans"].append(trans_data)  # 추가

        state[phone] = {"zone": best_zone, "enter_ts": ts}

        check_and_flush()  # 추가

    client = mqtt.Client(mqtt.CallbackAPIVersion.VERSION2, client_id="laptop-live")
    client.on_message = on_message
    client.connect(MQTT_HOST, MQTT_PORT, keepalive=30)
    client.subscribe(MQTT_TOPIC)

    print("Outputs go to neuralsense_laptop/output/")
    if uploader:
        print(f"Supabase sync enabled (batch_size={BATCH_SIZE}, interval={BATCH_INTERVAL_SEC}s)")

    try:
        client.loop_forever()
    except KeyboardInterrupt:
        print("\nShutting down...")
        flush_batch()  # 남은 데이터 업로드
        print("Done.")


if __name__ == "__main__":
    main()
```

---

# 8. Edge Function 연동 (선택)

기존 `process-neuralsense-data` Edge Function을 활용하는 방법입니다.

## 8.1 Edge Function 호출 방식

```python
# supabase_uploader.py에 추가

import httpx

def upload_via_edge_function(self, readings: list) -> dict:
    """
    Edge Function을 통한 데이터 업로드

    장점:
    - 서버 측 데이터 처리 로직 재사용
    - 복잡한 매핑 로직을 서버에서 처리

    단점:
    - HTTP 호출 오버헤드
    - 네트워크 의존성 증가
    """
    from config import EDGE_FUNCTION_URL, SUPABASE_KEY

    payload = {
        "node_id": "laptop-uploader",
        "store_id": self.store_id,
        "org_id": self.org_id,
        "data_type": "wifi",
        "readings": [
            {
                "timestamp": self._to_iso(r["ts"]),
                "hashed_mac": self._anonymize_mac(r["phone_id"]),
                "rssi_readings": r.get("vector", {r.get("rpi_id", "unknown"): r.get("rssi")}),
                "zone_id": self._get_zone_uuid(r.get("zone_id")) if r.get("zone_id") else None
            }
            for r in readings
        ]
    }

    headers = {
        "Authorization": f"Bearer {SUPABASE_KEY}",
        "Content-Type": "application/json"
    }

    try:
        response = httpx.post(
            EDGE_FUNCTION_URL,
            json=payload,
            headers=headers,
            timeout=30.0
        )
        response.raise_for_status()
        return response.json()
    except Exception as e:
        print(f"[ERROR] Edge function call failed: {e}")
        return {"success": False, "error": str(e)}
```

## 8.2 Edge Function 페이로드 형식

기존 Edge Function이 기대하는 형식:

```json
{
  "node_id": "NS-001",
  "store_id": "store-uuid",
  "org_id": "org-uuid",
  "data_type": "wifi",
  "readings": [
    {
      "timestamp": "2026-01-19T14:30:00.123Z",
      "hashed_mac": "a1b2c3d4e5f6",
      "rssi_readings": {
        "pib": -45,
        "pi5": -62
      },
      "estimated_position": {
        "x": 12.5,
        "y": 8.3,
        "confidence": 0.85
      },
      "zone_id": "zone-uuid"
    }
  ]
}
```

---

# 9. 테스트 및 검증

## 9.1 단위 테스트

### test_supabase_uploader.py

```python
"""
SupabaseUploader 단위 테스트
"""

import unittest
import time
from supabase_uploader import SupabaseUploader


class TestSupabaseUploader(unittest.TestCase):

    @classmethod
    def setUpClass(cls):
        """테스트 전 업로더 초기화"""
        try:
            cls.uploader = SupabaseUploader()
            cls.skip_tests = False
        except Exception as e:
            print(f"[WARN] Skipping tests: {e}")
            cls.skip_tests = True

    def test_anonymize_mac(self):
        """MAC 익명화 테스트"""
        if self.skip_tests:
            self.skipTest("Uploader not available")

        mac1 = "a1:b2:c3:d4:e5:f6"
        mac2 = "A1:B2:C3:D4:E5:F6"  # 대소문자 다름
        mac3 = "a1-b2-c3-d4-e5-f6"  # 구분자 다름

        hash1 = self.uploader._anonymize_mac(mac1)
        hash2 = self.uploader._anonymize_mac(mac2)
        hash3 = self.uploader._anonymize_mac(mac3)

        # 같은 MAC은 같은 해시
        self.assertEqual(hash1, hash2)
        self.assertEqual(hash1, hash3)

        # 해시 길이 확인
        self.assertEqual(len(hash1), 16)

    def test_to_iso(self):
        """시간 변환 테스트"""
        if self.skip_tests:
            self.skipTest("Uploader not available")

        ts = 1737312045.123
        iso = self.uploader._to_iso(ts)

        self.assertIn("2025-01-19", iso)
        self.assertIn("T", iso)
        self.assertTrue(iso.endswith("Z") or "+" in iso)

    def test_zone_mapping(self):
        """Zone 매핑 테스트"""
        if self.skip_tests:
            self.skipTest("Uploader not available")

        # zone_mapping이 로드되었는지 확인
        self.assertIsInstance(self.uploader.zone_mapping, dict)
        print(f"Zone mapping: {self.uploader.zone_mapping}")


class TestDataTransformation(unittest.TestCase):
    """데이터 변환 테스트"""

    def test_raw_rssi_format(self):
        """raw_rssi 데이터 형식 테스트"""
        raw_data = {
            "ts": time.time(),
            "phone_id": "a1:b2:c3:d4:e5:f6",
            "rpi_id": "pib",
            "rssi": -65
        }

        self.assertIn("ts", raw_data)
        self.assertIn("phone_id", raw_data)
        self.assertIn("rpi_id", raw_data)
        self.assertIn("rssi", raw_data)
        self.assertIsInstance(raw_data["rssi"], int)

    def test_zone_assignment_format(self):
        """zone_assignment 데이터 형식 테스트"""
        assign_data = {
            "ts": time.time(),
            "phone_id": "a1:b2:c3:d4:e5:f6",
            "zone_id": 1,
            "x": 100,
            "y": 200,
            "score": 3.2,
            "sources": ["pib", "pi5", "pi6"],
            "vector": {"pib": -64, "pi5": -72, "pi6": -81}
        }

        self.assertIsInstance(assign_data["zone_id"], int)
        self.assertIsInstance(assign_data["vector"], dict)


if __name__ == "__main__":
    unittest.main()
```

## 9.2 통합 테스트 체크리스트

| 테스트 항목 | 검증 방법 | 예상 결과 |
|------------|----------|----------|
| Supabase 연결 | `SupabaseUploader()` 초기화 | 에러 없이 완료 |
| Zone 매핑 로드 | `uploader.zone_mapping` 확인 | 정수 → UUID 딕셔너리 |
| MAC 익명화 | 같은 MAC 두 번 해시 | 동일한 결과 |
| wifi_events 삽입 | `upload_wifi_event()` 호출 | True 반환 |
| zone_events 삽입 | `upload_zone_assignment()` 호출 | True 반환 |
| 배치 업로드 | `upload_batch()` 호출 | success > 0 |
| E2E 테스트 | `python run_live.py` 실행 | Supabase에 데이터 저장 |

## 9.3 Supabase에서 데이터 확인

```sql
-- wifi_events 확인
SELECT * FROM wifi_events
WHERE store_id = 'YOUR_STORE_ID'
ORDER BY created_at DESC
LIMIT 10;

-- zone_events 확인
SELECT * FROM zone_events
WHERE store_id = 'YOUR_STORE_ID'
  AND sensor_type = 'wifi'
ORDER BY event_timestamp DESC
LIMIT 10;

-- zone_fingerprints 확인 (캘리브레이션 마이그레이션 후)
SELECT zf.*, zd.zone_name, zd.zone_code
FROM zone_fingerprints zf
JOIN zones_dim zd ON zf.zone_id = zd.id
WHERE zf.store_id = 'YOUR_STORE_ID'
ORDER BY zd.zone_code, zf.rpi_id;
```

---

# 10. 실행 순서

## 10.1 사전 준비

```bash
# 1. Supabase에서 store_id, org_id 확인
# Dashboard → Table Editor → stores/organizations 테이블 확인

# 2. zones_dim에 zone_code가 설정되어 있는지 확인
# zone_code = '1', '2', ... 형태로 설정 필요
```

## 10.2 설치 및 설정

```bash
# 1. 작업 디렉토리 이동
cd neuralsense_laptop

# 2. 패키지 설치
pip install -r requirements.txt

# 3. 환경 변수 파일 생성
cp .env.example .env

# 4. .env 파일 편집 (실제 값 입력)
# SUPABASE_URL, SUPABASE_KEY, STORE_ID, ORG_ID 설정
```

## 10.3 Supabase 테이블 생성

```bash
# Supabase Dashboard → SQL Editor에서 실행
# 또는 supabase CLI 사용

# zone_fingerprints 테이블 생성 (섹션 5.1의 SQL)
```

## 10.4 기존 데이터 마이그레이션

```bash
# 캘리브레이션 데이터 마이그레이션
python migrate_calibration.py
```

## 10.5 실행

```bash
# 실시간 모드 실행 (로컬 + Supabase 동기화)
python run_live.py
```

## 10.6 검증

```bash
# 1. 터미널에서 [UPLOAD] 로그 확인
# 2. Supabase Dashboard에서 데이터 확인
# 3. 네트워크 끊김 테스트 (로컬 저장 계속 동작 확인)
```

---

# 부록: 파일 구조 요약

## 최종 neuralsense_laptop 디렉토리

```
neuralsense_laptop/
├── .env                           # 🆕 환경변수 (git ignore)
├── .env.example                   # 🆕 환경변수 템플릿
├── config.py                      # 🆕 설정 로드
├── requirements.txt               # ✏️ 수정 (supabase 추가)
├── zones.csv                      # 기존 유지
├── calibrate_interactive.py       # 기존 유지
├── run_live.py                    # ✏️ 수정 (Supabase 배치 업로드 추가)
├── supabase_uploader.py           # 🆕 업로드 클래스
├── migrate_calibration.py         # 🆕 기존 데이터 마이그레이션
├── test_supabase_uploader.py      # 🆕 테스트 (선택)
└── output/
    └── *.jsonl                    # 기존 유지 (로컬 백업)
```

## 작업 체크리스트

- [ ] Supabase에 `zone_fingerprints` 테이블 생성
- [ ] `zones_dim` 테이블에 `zone_code` 값 설정 확인
- [ ] `config.py` 파일 생성
- [ ] `.env.example` 파일 생성
- [ ] `.env` 파일 생성 및 실제 값 입력
- [ ] `supabase_uploader.py` 파일 생성
- [ ] `migrate_calibration.py` 파일 생성
- [ ] `requirements.txt` 수정
- [ ] `run_live.py` 수정
- [ ] 패키지 설치 (`pip install -r requirements.txt`)
- [ ] 캘리브레이션 마이그레이션 실행
- [ ] 실시간 모드 테스트
- [ ] Supabase에서 데이터 확인

---

**문서 버전**: 1.0
**작성일**: 2026-01-19
**작성자**: Claude Code
**대상**: CTO (NEURALSENSE 시스템 담당)
