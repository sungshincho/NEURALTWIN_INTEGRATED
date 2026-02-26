# NeuralSense -> Supabase Data Mapping

NeuralSense outputs JSONL files. This document maps each file's fields to Supabase DB table columns.

---

## 1. raw_rssi.jsonl -> wifi_events

| NeuralSense Field | Supabase Column    | Transform   | Notes                                   |
|-------------------|--------------------|-------------|-----------------------------------------|
| phone_id (MAC)    | device_id          | rename      | phone_id -> device_id                   |
| rssi              | signal_strength    | rename      | rssi -> signal_strength                 |
| ts (Unix epoch)   | event_ts           | format      | Unix float -> ISO 8601 timestamptz      |
| rpi_id            | metadata.sensor_id | restructure | stored in metadata JSONB                |
| --                | org_id             | required    | not in NeuralSense, server injects      |
| --                | store_id           | required    | not in NeuralSense, server injects      |
| --                | zone_id            | optional    | not determined at raw stage             |
| --                | event_type         | required    | 'wifi_probe', server sets               |

## 2. zone_assignments.jsonl -> zone_events

| NeuralSense Field | Supabase Column         | Transform   | Notes                                   |
|-------------------|-------------------------|-------------|-----------------------------------------|
| zone_id (int)     | zone_id (uuid)          | type        | int -> zones_dim UUID lookup            |
| phone_id          | visitor_id              | rename      | phone_id -> visitor_id                  |
| session_id        | metadata.session_id     | restructure | stable ID across MAC rotations          |
| ts (Unix epoch)   | event_timestamp         | format      | Unix float -> ISO 8601 timestamptz      |
| confidence        | confidence_score        | rename      |                                         |
| second_zone_id    | metadata.second_zone_id | restructure | runner-up zone                          |
| second_confidence | metadata.second_conf    | restructure | runner-up score                         |
| margin            | metadata.margin         | restructure | confidence gap (best - second)          |
| sources           | metadata.sources        | restructure | list of Pi IDs                          |
| vector            | metadata.vector         | restructure | raw RSSI per Pi                         |
| x, y              | metadata.position       | restructure | zone center coordinates                 |
| --                | event_type              | required    | 'zone_assignment', server sets          |
| --                | event_date              | extract     | from event_timestamp                    |
| --                | event_hour              | extract     | from event_timestamp                    |
| --                | org_id                  | required    | server injects                          |
| --                | store_id                | required    | server injects                          |
| --                | sensor_type             | required    | 'wifi', server sets                     |

## 3. uncertain_assignments.jsonl (new)

Same schema as zone_assignments.jsonl. These are predictions where the margin between
the top-2 zones was below `MARGIN_GATE` (0.15). Not uploaded to Supabase — used for
local debugging and tuning only.

## 4. dwells.jsonl -> visit_zone_events

| NeuralSense Field | Supabase Column     | Transform    | Notes                                  |
|-------------------|---------------------|--------------|----------------------------------------|
| zone_id (int)     | zone_id (uuid)      | type         | int -> zones_dim UUID lookup           |
| phone_id          | metadata.visitor_id | restructure  |                                        |
| session_id        | visit_id            | rename       | session_id is the stable visit ID      |
| enter_ts (Unix)   | entry_time          | format+rename| Unix float -> ISO 8601                 |
| exit_ts (Unix)    | exit_time           | format+rename| Unix float -> ISO 8601                 |
| dwell_sec         | dwell_seconds       | rename       |                                        |
| --                | org_id              | required     | server injects                         |
| --                | store_id            | required     | server injects                         |
| --                | path_sequence       | compute      | derived from transitions order         |

## 5. transitions.jsonl (reference)

Not directly mapped to a Supabase table. Used to reconstruct visitor paths
via zone_events or visit_zone_events.path_sequence.

| NeuralSense Field | Usage                     | Notes                             |
|-------------------|---------------------------|-----------------------------------|
| from_zone         | path_sequence calculation | previous zone                     |
| to_zone           | path_sequence calculation | next zone                         |
| phone_id          | visit grouping            | group by same phone               |
| session_id        | visit grouping            | stable across MAC rotations       |
| confidence        | quality filter            | filter low-confidence transitions |

---

## Key Differences Summary

| #   | Issue                        | Description                                             | Resolution                                 |
|-----|------------------------------|---------------------------------------------------------|--------------------------------------------|
| 1   | **zone_id type**             | NeuralSense: int, Supabase: uuid                        | Edge Function: zone_code -> uuid lookup    |
| 2   | **timestamp format**         | NeuralSense: Unix float, Supabase: timestamptz          | Edge Function: convert to ISO 8601         |
| 3   | **field names**              | phone_id<->visitor_id/device_id, rssi<->signal_strength | Edge Function: rename                      |
| 4   | **org_id/store_id missing**  | not in NeuralSense output                               | Edge Function: inject from API auth        |
| 5   | **session_id -> visit_id**   | session_id handles MAC randomization                    | Edge Function: map session_id -> visit_id  |

---

## Edge Function Reference

Supabase Edge Function `process-neuralsense-data` handles the above transforms.
NeuralsenseReading interface:
```typescript
interface NeuralsenseReading {
  timestamp: string;
  hashed_mac: string;
  session_id?: string;
  rssi_readings: Record<string, number>;
  estimated_position?: { x: number; y: number; confidence: number };
  zone_id?: string;
  second_zone_id?: string;
  margin?: number;
  device_type?: 'smartphone' | 'tablet' | 'wearable' | 'unknown';
}
```
