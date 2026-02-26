# Agent: evaluation

## Role

Testing framework and accuracy measurement for the zone classification system.
Responsible for measuring how well the algorithm works, NOT for changing the algorithm.

## Owned Files

- `accuracy_test_from_zone_assignments.py` — live accuracy testing tool
- `accuracy_tests/` — test output directory (JSONL results, master log)

## Read-Only Context (do not modify)

- `run_live_geometry.py` — understand what zone_assignments.jsonl contains
- `config.py` — reference for parameter values
- `zones.csv` — zone definitions

## How Accuracy Testing Works

1. `run_live_geometry.py` writes predictions to `output/zone_assignments.jsonl`
2. This script tails that file in real-time
3. User declares ground truth zone (phones are physically placed there)
4. Script compares predictions vs ground truth for TEST_DURATION_SEC (500s)

### Settling and Streak Validation

- **SETTLING_SEC = 10**: First 10s of predictions are skipped (2x WINDOW_SEC).
  Allows the RSSI buffer to fully refresh after test start.
- **STABLE_STREAK_REQUIRED = 3**: Require 3 consecutive identical zone predictions
  per phone before counting begins. Filters startup noise.
- Both settling AND streak must pass before a prediction is counted.

### Output Format

Per-phone JSONL files in `accuracy_tests/`:
```
neuralsense_test_zone_id_01_02262026_phone_id_b05476c599d5.jsonl
```

Each record:
```json
{
  "ts": 1740000000.123,
  "ts_kst": "2025-02-20 12:00:00.123 KST",
  "phone_id": "b0:54:76:5c:99:d5",
  "true_zone_id": 1,
  "pred_zone_id": 1,
  "is_correct": true,
  "settling_skipped": false,
  "streak_at_pred": 5,
  "counted": true,
  "confidence": 0.85,
  "sources": ["pi5","pi7",...],
  "vector": {"pi5":-55,...}
}
```

Master log: `accuracy_tests/neuralsense_accuracy_master_log.txt`

## Test Phones

| MAC                 | Device         |
|---------------------|----------------|
| b0:54:76:5c:99:d5   | Phone 1        |
| 24:24:b7:19:30:0a   | Phone 2        |
| a8:76:50:e9:28:20   | Phone 3 (cal)  |

Phone 3 is also the calibration phone. It tends to have higher accuracy
since calibration was done with its RSSI pattern.

## Constraints

- **Read-only on zone_assignments.jsonl.** This script only reads, never writes to it.
- **Do not change the output schema** without coordinating with the `integration` agent.
- **Ground truth is manual.** User declares the zone. There is no automated ground truth.
- **Tail-follow approach.** Script seeks to end of file and reads new lines.
  It must be started AFTER `run_live_geometry.py` is running.

## Known Accuracy Baselines (before improvements)

| Zone | Phone 1 | Phone 2 | Phone 3 |
|------|---------|---------|---------|
| 1    | ~97%    | ~97%    | ~97%    |
| 12   | ~86%    | ~93%    | ~93%    |
| 18   | ~49%    | ~53%    | ~90%   |

These are pre-improvement baselines. After the composite scoring + margin gating
changes, re-test to establish new baselines.

## Future Work

- **Walk test mode**: phone moves between zones, measure transition detection accuracy
- **Confusion matrix**: which zones get confused with which
- **Automated regression**: compare new test results against saved baselines
- **Uncertain analysis**: parse uncertain_assignments.jsonl to understand
  which zones are most ambiguous and whether margin gating is correctly filtering
- **Multi-round stats**: run N tests per zone, report mean/std accuracy
