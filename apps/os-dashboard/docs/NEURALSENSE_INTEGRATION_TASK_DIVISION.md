# NEURALSENSE Supabase 연동 작업 분담

## 핵심 원칙

> **CTO의 모든 결과값은 기존 데이터 테이블, 스키마, 마스터 데이터 룰을 따라야 함**

| 항목 | 마스터 (Supabase) | 따르는 쪽 (CTO) |
|------|-------------------|-----------------|
| Zone 정의 | `zones_dim` 테이블 | `zones.csv` 파일 |
| Zone ID 형식 | UUID | zone_code로 매핑 |
| 테이블 스키마 | `zone_events`, `wifi_events` | 출력 데이터 변환 |
| 시간 형식 | ISO 8601 (TIMESTAMPTZ) | Unix timestamp → 변환 |
| MAC 주소 | 익명화 필수 | 해시 처리 후 전송 |

---

## 백엔드 담당자 작업

### Phase 1: 마스터 데이터 & 스키마 정보 제공

| 순서 | 작업 | CTO에게 전달할 내용 |
|------|------|---------------------|
| 1 | zones_dim 데이터 추출 | zone_id(UUID), zone_code, zone_name, position_x, position_y |
| 2 | store/org 정보 제공 | STORE_ID, ORG_ID |
| 3 | Supabase 연결 정보 제공 | SUPABASE_URL, SUPABASE_KEY (Service Role) |
| 4 | 기존 테이블 스키마 공유 | zone_events, wifi_events 필드 정의 |

#### zones_dim 데이터 추출 쿼리

```sql
SELECT
  id as zone_uuid,
  zone_code,
  zone_name,
  position_x as x,
  position_y as y
FROM zones_dim
WHERE store_id = 'YOUR_STORE_ID'
  AND is_active = true
ORDER BY zone_code::int;
```

#### CTO에게 전달할 환경변수 템플릿

```
SUPABASE_URL=https://bdrvowacecxnraaivlhr.supabase.co
SUPABASE_KEY=[Service Role Key]
STORE_ID=[매장 UUID]
ORG_ID=[조직 UUID]
MAC_SALT=[임의의 솔트 문자열]
```

---

### Phase 2: Supabase 준비

| 순서 | 작업 | 상세 |
|------|------|------|
| 5 | `zone_fingerprints` 테이블 생성 | 캘리브레이션 데이터 저장용 |
| 6 | RLS 정책 확인 | Service Role Key 접근 권한 확인 |

#### zone_fingerprints 테이블 생성 SQL

```sql
CREATE TABLE IF NOT EXISTS zone_fingerprints (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id        UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  zone_id         UUID NOT NULL REFERENCES zones_dim(id) ON DELETE CASCADE,
  rpi_id          TEXT NOT NULL,
  rssi_avg        NUMERIC(6,2) NOT NULL,
  rssi_min        INTEGER,
  rssi_max        INTEGER,
  sample_count    INTEGER DEFAULT 30,
  phone_mac_used  TEXT,
  calibrated_at   TIMESTAMPTZ DEFAULT now(),
  is_active       BOOLEAN DEFAULT true,
  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now(),
  UNIQUE(store_id, zone_id, rpi_id)
);

ALTER TABLE zone_fingerprints ENABLE ROW LEVEL SECURITY;

CREATE POLICY "zone_fingerprints_service_role" ON zone_fingerprints
  FOR ALL USING (auth.role() = 'service_role');
```

---

### Phase 3: 검증

| 순서 | 작업 | 상세 |
|------|------|------|
| 7 | 데이터 수신 확인 | zone_events, wifi_events 테이블 검증 |
| 8 | 대시보드 연동 확인 | 기존 훅/컴포넌트에서 데이터 표시 확인 |

#### 데이터 검증 쿼리

```sql
-- zone_events 확인
SELECT * FROM zone_events
WHERE store_id = 'YOUR_STORE_ID'
  AND sensor_type = 'wifi'
ORDER BY event_timestamp DESC
LIMIT 20;

-- wifi_events 확인
SELECT * FROM wifi_events
WHERE store_id = 'YOUR_STORE_ID'
ORDER BY created_at DESC
LIMIT 20;

-- zone_fingerprints 확인
SELECT zf.*, zd.zone_name, zd.zone_code
FROM zone_fingerprints zf
JOIN zones_dim zd ON zf.zone_id = zd.id
WHERE zf.store_id = 'YOUR_STORE_ID'
ORDER BY zd.zone_code, zf.rpi_id;
```

---

## CTO 작업

### Phase 1: 마스터 데이터 적용

| 순서 | 작업 | 상세 |
|------|------|------|
| 1 | zones.csv 생성 | **백엔드에서 받은 zones_dim 데이터 기준** |
| 2 | 캘리브레이션 재수행 | 새 zone_code 기준으로 fingerprint 수집 |

#### zones.csv 형식 (백엔드 데이터 기준)

```csv
zone_id,x,y,zone_name,zone_uuid
1,100,200,입구,a1b2c3d4-...
2,150,250,디스플레이A,b2c3d4e5-...
3,200,300,디스플레이B,c3d4e5f6-...
4,250,350,계산대,d4e5f6a7-...
```

---

### Phase 2: Supabase 연동 구현

| 순서 | 작업 | 상세 |
|------|------|------|
| 3 | 신규 파일 생성 | config.py, supabase_uploader.py, migrate_calibration.py |
| 4 | **기존 스키마에 맞게 데이터 변환** | zone_events, wifi_events 필드 매핑 |
| 5 | run_live.py 수정 | 배치 업로드 로직 추가 |
| 6 | 패키지 설치 | `pip install supabase python-dotenv` |

#### 데이터 변환 매핑

| CTO 출력 | Supabase 테이블 | 필드 매핑 |
|----------|-----------------|-----------|
| raw_rssi.jsonl | wifi_events | ts→event_ts, phone_id→device_id(해시), rssi→signal_strength |
| zone_assignments.jsonl | zone_events | zone_id→zone_uuid 매핑, event_type='enter' |
| transitions.jsonl | zone_events | from_zone→exit, to_zone→enter 이벤트 쌍 |
| dwells.jsonl | zone_events | event_type='dwell', dwell_sec→duration_seconds |
| calibration.jsonl | zone_fingerprints | zone_id→zone_uuid 매핑, fingerprint 분해 |

---

### Phase 3: 실행

| 순서 | 작업 | 상세 |
|------|------|------|
| 7 | .env 설정 | 백엔드에서 받은 환경변수 입력 |
| 8 | 캘리브레이션 마이그레이션 | `python migrate_calibration.py` |
| 9 | 실시간 모드 실행 | `python run_live.py` |

---

## 작업 흐름도

```
[백엔드] Phase 1                    [CTO] Phase 1
    │                                   │
    ├─ zones_dim 추출 ──────────────────→ zones.csv 생성
    ├─ store/org ID ─────────────────────→
    ├─ Supabase 연결정보 ────────────────→
    ├─ 테이블 스키마 공유 ───────────────→ 스키마 맞춰 변환 로직 구현
    │                                   │
    ▼                                   ▼
[백엔드] Phase 2                    [CTO] Phase 2
    │                                   │
    ├─ zone_fingerprints 생성            ├─ 코드 작성
    ├─ RLS 정책 확인                     ├─ 패키지 설치
    │                                   │
    ▼                                   ▼
                                   [CTO] Phase 3
                                        │
                                        ├─ .env 설정
                                        ├─ 마이그레이션
                                        ├─ 실행
                                        │
                                        ▼
[백엔드] Phase 3 ←───────────────── 데이터 전송
    │
    ├─ 데이터 검증
    └─ 대시보드 확인
```

---

## 체크리스트

### 백엔드 담당자

- [ ] zones_dim 데이터 추출 및 CTO 전달
- [ ] STORE_ID, ORG_ID 확인 및 CTO 전달
- [ ] Service Role Key 생성 및 CTO 전달
- [ ] zone_events, wifi_events 스키마 문서화 및 CTO 전달
- [ ] zone_fingerprints 테이블 생성
- [ ] RLS 정책 확인
- [ ] 데이터 수신 검증
- [ ] 대시보드 연동 확인

### CTO

- [ ] 백엔드에서 받은 zones_dim 데이터로 zones.csv 생성
- [ ] 캘리브레이션 재수행 (zone_code 기준)
- [ ] config.py 파일 생성
- [ ] supabase_uploader.py 파일 생성
- [ ] migrate_calibration.py 파일 생성
- [ ] requirements.txt 수정 (supabase, python-dotenv 추가)
- [ ] run_live.py 수정 (배치 업로드 로직)
- [ ] .env 파일 설정
- [ ] 패키지 설치
- [ ] 캘리브레이션 마이그레이션 실행
- [ ] 실시간 모드 테스트

---

## 관련 문서

- [CTO 작업 상세 가이드](./CTO_NEURALSENSE_SUPABASE_INTEGRATION_GUIDE.md)

---

**문서 버전**: 1.0
**작성일**: 2026-01-21
**작성자**: Claude Code
