# Agent: integration

## Role

Bridge between NeuralSense JSONL output and the Supabase backend.
Owns the data format contracts and the upload pipeline.

## Owned Files

- `SCHEMA_MAPPING.md` — JSONL field -> Supabase column mapping
- `REPO_ANALYSIS_B.md` — project documentation and operations guide

## Related Files (in monorepo, outside neuralsense/)

- `supabase/supabase/functions/process-neuralsense-data/` — Edge Function for ingestion
- `packages/types/` — TypeScript types that must match JSONL schemas

## Data Flow

```
NeuralSense (laptop)                    Supabase
-------------------                    --------
raw_rssi.jsonl          -- (debug only, not uploaded) --
zone_assignments.jsonl  -->  process-neuralsense-data  -->  zone_events
uncertain_assignments.jsonl  -- (debug only, not uploaded) --
transitions.jsonl       -->  process-neuralsense-data  -->  (path reconstruction)
dwells.jsonl            -->  process-neuralsense-data  -->  visit_zone_events
```

## JSONL Schemas (source of truth)

### zone_assignments.jsonl

| Field             | Type   | Notes                                      |
|-------------------|--------|--------------------------------------------|
| ts                | float  | Unix epoch                                 |
| ts_kst            | string | Human-readable KST timestamp               |
| phone_id          | string | MAC address (raw or hashed)                |
| session_id        | string | Stable ID across MAC rotations (S0001...)  |
| zone_id           | int    | Zone number (1-19)                         |
| x                 | int    | Zone center x coordinate                   |
| y                 | int    | Zone center y coordinate                   |
| confidence        | float  | Best zone's composite score (0.0-1.0)      |
| second_zone_id    | int    | Runner-up zone (nullable)                  |
| second_confidence | float  | Runner-up score                            |
| margin            | float  | confidence - second_confidence             |
| sources           | list   | Pi IDs that contributed to this prediction |
| vector            | object | Raw RSSI values per Pi                     |
| timebase          | string | Always "rx_time_laptop"                    |

### transitions.jsonl

| Field      | Type   | Notes                                     |
|------------|--------|-------------------------------------------|
| ts         | float  | Unix epoch of transition confirmation     |
| ts_kst     | string | Human-readable KST                        |
| phone_id   | string | MAC address                               |
| session_id | string | Stable session ID                         |
| from_zone  | int    | Previous zone (null for first appearance) |
| to_zone    | int    | New zone                                  |
| confidence | float  | Confidence at time of transition          |

### dwells.jsonl

| Field        | Type   | Notes                                    |
|--------------|--------|------------------------------------------|
| phone_id     | string | MAC address                              |
| session_id   | string | Stable session ID                        |
| zone_id      | int    | Zone where phone dwelled                 |
| enter_ts     | float  | Unix epoch when phone entered zone       |
| enter_ts_kst | string | Human-readable entry time                |
| exit_ts      | float  | Unix epoch when phone left zone          |
| exit_ts_kst  | string | Human-readable exit time                 |
| dwell_sec    | float  | Duration in seconds                      |

## Key Transforms (NeuralSense -> Supabase)

1. **zone_id**: int -> uuid (lookup via zones_dim table)
2. **timestamps**: Unix float -> ISO 8601 timestamptz
3. **phone_id**: rename to visitor_id or device_id
4. **session_id**: map to visit_id for visit tracking
5. **org_id / store_id**: inject from API authentication context
6. **metadata fields**: sources, vector, position -> metadata JSONB

## Constraints

- **Schema changes require coordination.** If the `algorithm` agent adds/removes
  fields from JSONL output, this agent must update SCHEMA_MAPPING.md and the
  Edge Function.
- **session_id is the visit identifier.** In production with randomized MACs,
  session_id is the only stable identifier. phone_id (MAC) may change mid-visit.
- **uncertain_assignments.jsonl is NOT uploaded.** It's debug-only.
- **Backward compatibility.** Edge Function should handle records with and without
  new fields (second_zone_id, margin, session_id) gracefully.

## Future Work

- Build the actual upload pipeline (batch JSONL -> Edge Function)
- Real-time streaming option (MQTT -> Edge Function directly)
- Dashboard integration: zone_events -> OS Dashboard heatmap
- Historical data backfill from existing JSONL test files
