# NeuralSense → Supabase 데이터 매핑

NeuralSense가 출력하는 JSONL 파일별로 Supabase DB 테이블 컬럼과의 매핑을 정리합니다.

---

## 1. raw_rssi.jsonl → wifi_events

| NeuralSense 필드 | Supabase wifi_events 컬럼 | 변환 필요 | 비고 |
|------------------|--------------------------|-----------|------|
| phone_id (MAC)   | device_id                | 이름 변환 | phone_id → device_id로 rename |
| rssi             | signal_strength          | 이름 변환 | rssi → signal_strength로 rename |
| ts (Unix epoch)  | event_ts                 | 형식 변환 | Unix float → ISO 8601 timestamptz |
| rpi_id           | metadata.sensor_id       | 구조 변환 | 별도 컬럼 없음, metadata JSONB에 저장 |
| —                | org_id                   | 필요      | NeuralSense에 없음, 서버에서 주입 필요 |
| —                | store_id                 | 필요      | NeuralSense에 없음, 서버에서 주입 필요 |
| —                | zone_id                  | 선택      | raw 단계에서는 zone 미확정 |
| —                | event_type               | 필요      | 'wifi_probe' 등 서버에서 지정 |
| —                | dwell_time_seconds       | 선택      | raw 단계에서는 미확정 |

## 2. zone_assignments.jsonl → zone_events

| NeuralSense 필드 | Supabase zone_events 컬럼 | 변환 필요 | 비고 |
|------------------|--------------------------|-----------|------|
| zone_id (int)    | zone_id (uuid)           | 타입 변환 | int → zones_dim UUID로 lookup 필요 |
| phone_id         | visitor_id               | 이름 변환 | phone_id → visitor_id로 rename |
| ts (Unix epoch)  | event_timestamp          | 형식 변환 | Unix float → ISO 8601 timestamptz |
| confidence       | confidence_score         | 이름 변환 | confidence → confidence_score |
| —                | event_type               | 필요      | 'zone_assignment' 등 서버에서 지정 |
| —                | event_date               | 추출      | event_timestamp에서 date 추출 |
| —                | event_hour               | 추출      | event_timestamp에서 hour 추출 |
| —                | org_id                   | 필요      | NeuralSense에 없음, 서버에서 주입 필요 |
| —                | store_id                 | 필요      | NeuralSense에 없음, 서버에서 주입 필요 |
| —                | sensor_type              | 필요      | 'wifi' 서버에서 지정 |
| sources          | metadata.sources         | 구조 변환 | metadata JSONB에 저장 |
| vector           | metadata.vector          | 구조 변환 | metadata JSONB에 저장 |
| x, y             | metadata.position        | 구조 변환 | metadata JSONB에 저장 |

## 3. dwells.jsonl → visit_zone_events

| NeuralSense 필드 | Supabase visit_zone_events 컬럼 | 변환 필요 | 비고 |
|------------------|--------------------------------|-----------|------|
| zone_id (int)    | zone_id (uuid)                 | 타입 변환 | int → zones_dim UUID로 lookup 필요 |
| enter_ts (Unix)  | entry_time                     | 형식+이름 | Unix float → ISO 8601, enter_ts → entry_time |
| exit_ts (Unix)   | exit_time                      | 형식+이름 | Unix float → ISO 8601, exit_ts → exit_time |
| dwell_sec        | dwell_seconds                  | 이름 변환 | dwell_sec → dwell_seconds |
| phone_id         | metadata.visitor_id            | 구조 변환 | 직접 매핑 컬럼 없음 |
| —                | visit_id                       | 필요      | 세션 관리 로직에서 생성 필요 |
| —                | org_id                         | 필요      | NeuralSense에 없음, 서버에서 주입 필요 |
| —                | store_id                       | 필요      | NeuralSense에 없음, 서버에서 주입 필요 |

## 4. transitions.jsonl (참조용)

transitions.jsonl은 별도 Supabase 테이블에 직접 매핑되지 않습니다.
zone_events의 연속 레코드로부터 동선(path)을 재구성하거나,
visit_zone_events의 path_sequence 필드로 순서를 추적합니다.

| NeuralSense 필드 | 활용 방식 | 비고 |
|------------------|----------|------|
| from_zone        | visit_zone_events.path_sequence 계산 | 이전 zone에서 순서 추론 |
| to_zone          | visit_zone_events.path_sequence 계산 | 다음 zone으로 순서 추론 |
| phone_id         | visit_id 세션 그룹핑 | 같은 phone의 연속 전환을 하나의 visit로 묶음 |

---

## 주요 불일치 요약

| # | 불일치 항목 | 설명 | 해결 방안 |
|---|-----------|------|----------|
| 1 | **zone_id 타입** | NeuralSense: int, Supabase: uuid | Edge Function에서 zone_code → uuid lookup |
| 2 | **timestamp 형식** | NeuralSense: Unix float, Supabase: timestamptz | Edge Function에서 ISO 8601로 변환 |
| 3 | **필드명 차이** | phone_id↔visitor_id/device_id, rssi↔signal_strength 등 | Edge Function에서 rename |
| 4 | **org_id/store_id 누락** | NeuralSense 출력에 조직/매장 정보 없음 | Edge Function에서 API 인증 기반으로 주입 |
| 5 | **visit_id 누락** | NeuralSense는 방문 세션 개념 없음 | 서버 ETL에서 시간 기반 세션 분리 로직 필요 |

---

## Edge Function 참고

Supabase Edge Function `process-neuralsense-data`가 위 변환을 처리합니다.
NeuralsenseReading 인터페이스:
```typescript
interface NeuralsenseReading {
  timestamp: string;
  hashed_mac: string;
  rssi_readings: Record<string, number>;
  estimated_position?: { x: number; y: number; confidence: number };
  zone_id?: string;
  device_type?: 'smartphone' | 'tablet' | 'wearable' | 'unknown';
}
```
