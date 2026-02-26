# Agent: algorithm

## Role

Core scoring and classification engine for Wi-Fi RSSI zone localization.

## Owned Files

- `run_live_geometry.py` — primary runtime (zone classification, session linking, transitions)
- `calibrate_interactive_geometry.py` — calibration data collection and filtering
- `config.py` — central constants (keep in sync with actual values in scripts)

## Read-Only Context (do not modify)

- `zones.csv` — zone definitions (19 zones, 2D grid)
- `neuralsense_pi/sniff_and_send_unified.py` — understand MQTT message format
- `SCHEMA_MAPPING.md` — understand output schema contracts

## Current Architecture

### Scoring Pipeline (run_live_geometry.py)

```
MQTT RSSI -> 5s buffer -> 8-Pi freshness gate -> median-normalize
  -> composite scoring (60% weighted-L1 + 40% rank-order)
  -> margin gating (skip if top-2 gap < 0.15)
  -> session linking (MAC randomization handling)
  -> transition debounce (3 consecutive for zone change)
  -> output: zone_assignments.jsonl / uncertain_assignments.jsonl
```

### Key Parameters and Why

| Parameter              | Value | Rationale                                               |
|------------------------|-------|---------------------------------------------------------|
| WINDOW_SEC             | 5     | Balance freshness vs having enough data from all 8 Pis  |
| MIN_SOURCES            | 8     | Require all Pis for reliable prediction                 |
| PER_PI_FRESH_SEC       | 3.0   | Drop stale Pi readings within the window                |
| MATCH_DIFF_DBM         | 7.0   | L1 threshold, tuned from calibration data spread        |
| MARGIN_GATE            | 0.15  | 15% confidence gap filters ambiguous zone 18 predictions|
| L1_WEIGHT              | 0.6   | L1 is the proven baseline                               |
| RANK_WEIGHT            | 0.4   | Rank-order is device-independent, helps zone 18         |
| RANK_MATCH_THRESHOLD   | 1.5   | Avg 1.5 rank positions displacement across 8 Pis       |
| TRANSITION_CONFIRM_COUNT| 3    | ~3s of sustained evidence before confirming zone change |
| STALE_MAC_SEC          | 30.0  | MAC silent 30s before attempting session link           |
| SESSION_RANK_THRESHOLD | 1.5   | Same threshold as scoring, rank-order is stable         |

### Calibration Pipeline (calibrate_interactive_geometry.py)

```
MQTT RSSI from single phone -> collect 80 samples per Pi
  -> build sync vectors (8 Pis within 3s window)
  -> median-normalize
  -> filter multipath spikes (>2.5 sigma)
  -> save to calibration.jsonl with per-Pi stats
```

## Constraints

- **No hysteresis.** User explicitly rejected it (was sticky, gave wrong results).
- **Backward compatible calibration.** Old calibration records without `pi_stats` must still load.
  Use `.get("pi_stats", None)` fallback pattern.
- **MQTT callback thread safety.** All state in `on_message` runs in paho's single callback thread.
  No locks needed, but don't do blocking I/O.
- **Output schema contract.** If you change fields in zone_assignments.jsonl, transitions.jsonl,
  or dwells.jsonl, notify the `integration` agent to update SCHEMA_MAPPING.md.
- **Config sync.** When changing any constant, update both the script AND config.py.

## Known Issues

- Zone 18 accuracy is phone-dependent (49-53% for some phones, ~90% for others).
  Rank-order scoring was added to address this. May need further tuning.
- Zone 12 occasionally dips to 86%. Weighted distance metric should help.
- `composite_match()` uses binary match (1.0/0.0) for both L1 and rank.
  A soft/graded match could improve discrimination for borderline zones.

## Tuning Workflow

1. Run live test with `accuracy_test_from_zone_assignments.py`
2. Check `uncertain_assignments.jsonl` — if too many predictions are filtered,
   lower MARGIN_GATE. If wrong predictions still get through, raise it.
3. Check per-zone accuracy — if rank-order is hurting a previously good zone,
   adjust RANK_WEIGHT down. If phone-dependent zones improve, it's working.
4. After re-calibrating a zone, compare `pi_stats` old vs new to verify
   multipath filtering is removing the right vectors.
