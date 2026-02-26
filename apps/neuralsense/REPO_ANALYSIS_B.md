# NeuralSense Repository Analysis

---

## Section 1: Project Structure

### 1. Directory Tree

```
neuralsense/
├── config.py                                  # Central config (all constants)
├── run_live_geometry.py                       # Primary runtime (zone classification)
├── calibrate_interactive_geometry.py          # Calibration tool
├── accuracy_test_from_zone_assignments.py     # Accuracy testing
├── zones.csv                                  # Zone definitions (19 zones)
├── output/                                    # Runtime output (JSONL files)
│   ├── raw_rssi.jsonl
│   ├── zone_assignments.jsonl
│   ├── uncertain_assignments.jsonl
│   ├── transitions.jsonl
│   ├── dwells.jsonl
│   ├── calibration.jsonl
│   └── run_live_errors.jsonl
├── accuracy_tests/                            # Accuracy test output
│   └── *.jsonl
└── neuralsense_pi/                            # Raspberry Pi code
    ├── sniff_and_send_unified.py              # Pi sniffer (3 modes)
    ├── set_channel.sh                         # Monitor mode setup
    └── requirements.txt
```

### 2. Main Entry Points

| File                                      | Role                 | Description                                                                                                                                     |
|-------------------------------------------|----------------------|-------------------------------------------------------------------------------------------------------------------------------------------------|
| `run_live_geometry.py`                    | **Primary runtime**  | MQTT subscriber: receives RSSI, builds vectors, classifies zones using composite scoring (L1 + rank-order), margin gating, transition debounce, MAC session linking. |
| `calibrate_interactive_geometry.py`       | **Calibration tool** | Interactive CLI: collects RSSI samples per zone, filters multipath spikes, saves normalized calibration vectors.                                |
| `accuracy_test_from_zone_assignments.py`  | **Accuracy tester**  | Reads zone_assignments.jsonl live, compares against ground truth with settling period and streak validation.                                    |
| `neuralsense_pi/sniff_and_send_unified.py`| **Pi sniffer**       | Runs on each Pi. Captures Wi-Fi frames in monitor mode, publishes RSSI to MQTT. Supports calibration, test, and production modes.              |

---

## Section 2: Hardware Setup

### Raspberry Pi Fleet

| Pi ID | Interface | Notes |
|-------|-----------|-------|
| pi5   | wlan0     |       |
| pi7   | wlan0     |       |
| pi8   | wlan0     |       |
| pi9   | wlan1     |       |
| pi10  | wlan0     |       |
| pi11  | wlan1     |       |
| pi12  | wlan0     |       |
| pi13  | wlan0     |       |

All Pis are connected via **Tailscale VPN** (mesh network).
MQTT broker runs on 100.87.27.7:1883.

### Zone Layout

19 zones on a 2D grid (zones.csv):
- Rows: y = -2, 0, 2, 4
- Cols: x = -5 to 5
- Zones 1-6: bottom row (y=-2)
- Zones 7-12: middle row (y=0)
- Zones 13-17: upper row (y=2)
- Zones 18-19: top row (y=4)

---

## Section 3: Data Pipeline

### MQTT Message Format (Pi → Laptop)

```json
{"ts": 1740000000.123, "rpi_id": "pi10", "mac": "a8:76:50:e9:28:20", "rssi": -65}
```

Topic: `neuralsense/rssi`

### Processing Pipeline (run_live_geometry.py)

```
MQTT message
  → Buffer per phone (5s sliding window)
  → Per-Pi freshness gating (3s)
  → Require 8/8 Pis present
  → Median-normalize RSSI vector
  → Resolve MAC → session_id (handles randomized MACs)
  → Composite scoring: 60% weighted-L1 + 40% rank-order
  → Top-2 margin gating (skip if gap < 0.15)
  → Transition debounce (require 3 consecutive for zone change)
  → Output: zone_assignments.jsonl / uncertain_assignments.jsonl
```

### Output Files

| File                           | Content                              | Used By                       |
|--------------------------------|--------------------------------------|-------------------------------|
| `raw_rssi.jsonl`               | Every RSSI reading from MQTT         | Debug                         |
| `zone_assignments.jsonl`       | Confident zone predictions           | Accuracy test, Supabase upload|
| `uncertain_assignments.jsonl`  | Ambiguous predictions (margin < 0.15)| Debug / tuning                |
| `transitions.jsonl`            | Confirmed zone changes (debounced)   | Supabase upload               |
| `dwells.jsonl`                 | Time spent in each zone              | Supabase upload               |
| `calibration.jsonl`            | Per-zone calibration vectors         | run_live loads at startup     |
| `run_live_errors.jsonl`        | Runtime errors                       | Debug                         |

---

## Section 4: Algorithm Details

### Zone Classification (Composite Scoring)

For each calibration vector in each zone:
1. **Weighted L1 match** (60%): `weighted_avg_diff(live, cal) <= 7.0 dBm`
   - Per-Pi weights from calibration variance (low std = high weight)
2. **Rank-order match** (40%): `rank_distance(live, cal) <= 1.5`
   - Device-independent: rank ordering is same regardless of phone model
3. **Composite score** = 0.6 × L1_match + 0.4 × rank_match
4. Zone confidence = sum of composite scores / number of calibration vectors

### Margin Gating

If `best_conf - second_conf < 0.15`, prediction is **uncertain** and routed
to `uncertain_assignments.jsonl` instead of `zone_assignments.jsonl`.

### Transition Debounce

When a new zone is predicted (different from confirmed zone):
1. Start counting consecutive predictions for the new zone
2. If a prediction returns to the confirmed zone, counter resets
3. After 3 consecutive predictions, the transition is confirmed
4. Enter time recorded as time of first prediction (not confirmation)

### MAC Session Linking

Handles iOS/Android MAC randomization:
1. Each MAC gets a stable session_id (S0001, S0002, ...)
2. When a MAC goes silent for >30s and a new MAC appears:
   - Compare RSSI rank-order of new MAC vs stale session
   - If rank distance ≤ 1.5 → same device, reuse session_id
3. Transitions and dwells keyed by session_id (stable across MAC rotations)
4. Stale sessions cleaned up after 1 hour

### Calibration (Multipath Filtering)

1. Collect RSSI samples from all 8 Pis (max 80 per Pi)
2. Build synchronized vectors (all 8 Pis within 3s window)
3. Median-normalize vectors (RSSI - median)
4. **Filter multipath spikes**: remove vectors where any Pi deviates >2.5σ
5. Save filtered vectors + per-Pi stats to calibration.jsonl

---

## Section 5: Key Parameters

| Parameter                  | Value | File           | Purpose                                      |
|----------------------------|-------|----------------|----------------------------------------------|
| `WINDOW_SEC`               | 5     | run_live       | Sliding window for RSSI buffer               |
| `MIN_SOURCES`              | 8     | run_live       | Require all 8 Pis for prediction             |
| `PER_PI_FRESH_SEC`         | 3.0   | run_live       | Per-Pi staleness cutoff                      |
| `MATCH_DIFF_DBM`           | 7.0   | run_live       | L1 match threshold (normalized dBm)          |
| `MARGIN_GATE`              | 0.15  | run_live       | Min confidence gap for certain prediction    |
| `L1_WEIGHT`                | 0.6   | run_live       | Weight for L1 distance in composite          |
| `RANK_WEIGHT`              | 0.4   | run_live       | Weight for rank-order in composite           |
| `RANK_MATCH_THRESHOLD`     | 1.5   | run_live       | Max avg rank displacement                    |
| `TRANSITION_CONFIRM_COUNT` | 3     | run_live       | Consecutive predictions for zone change      |
| `STALE_MAC_SEC`            | 30.0  | run_live       | MAC silence before considering stale         |
| `SESSION_RANK_THRESHOLD`   | 1.5   | run_live       | Max rank distance for session linking        |
| `MAX_SAMPLES_PER_PI`       | 80    | calibrate      | Samples collected per Pi per zone            |
| `SYNC_WINDOW_SEC`          | 3.0   | calibrate      | Time window for synchronized vectors         |
| `Z_THRESHOLD`              | 2.5   | calibrate      | Multipath spike filter (z-score)             |
| `SETTLING_SEC`             | 10    | accuracy_test  | Ignore first 10s of predictions              |
| `STABLE_STREAK_REQUIRED`   | 3     | accuracy_test  | Consecutive same-zone before counting        |
| `TEST_DURATION_SEC`        | 500   | accuracy_test  | Duration of each accuracy test               |

---

## Section 6: Step-by-Step Operations Guide

### Prerequisites

- 8 Raspberry Pis connected via Tailscale VPN
- Each Pi has a Wi-Fi antenna in monitor mode
- MQTT broker running on 100.87.27.7:1883
- Laptop on same Tailscale network

### Step 1: Set Monitor Mode on Each Pi

SSH into each Pi and run:
```bash
sudo bash set_channel.sh 6 wlanX
```

Replace `wlanX` with the correct interface for each Pi (see Pi table above).

### Step 2: Calibrate (one-time per zone layout change)

**2a. Start sniffers in CALIBRATION mode** (one MAC only):
```bash
# On each Pi (via SSH):
sudo python3 sniff_and_send_unified.py --rpi-id pi10 --iface wlan0 --target-mac a8:76:50:e9:28:20
sudo python3 sniff_and_send_unified.py --rpi-id pi5  --iface wlan0 --target-mac a8:76:50:e9:28:20
sudo python3 sniff_and_send_unified.py --rpi-id pi7  --iface wlan0 --target-mac a8:76:50:e9:28:20
sudo python3 sniff_and_send_unified.py --rpi-id pi8  --iface wlan0 --target-mac a8:76:50:e9:28:20
sudo python3 sniff_and_send_unified.py --rpi-id pi9  --iface wlan1 --target-mac a8:76:50:e9:28:20
sudo python3 sniff_and_send_unified.py --rpi-id pi11 --iface wlan1 --target-mac a8:76:50:e9:28:20
sudo python3 sniff_and_send_unified.py --rpi-id pi12 --iface wlan0 --target-mac a8:76:50:e9:28:20
sudo python3 sniff_and_send_unified.py --rpi-id pi13 --iface wlan0 --target-mac a8:76:50:e9:28:20
```

**2b. Start calibration on laptop** (Git Bash):
```bash
cd apps/neuralsense
python calibrate_interactive_geometry.py
```

**2c. Perform calibration:**
- Enter zone ID when prompted
- Place calibration phone (a8:76:50:e9:28:20) in that zone
- Wait for samples to collect (all 8 Pis reaching 80 samples)
- Repeat for each zone
- Calibration vectors saved to `output/calibration.jsonl`

### Step 3: Live Testing

**3a. Restart sniffers in TEST mode** (multiple MACs):
```bash
# On each Pi (via SSH) — Ctrl+C the calibration sniffer first, then:
sudo python3 sniff_and_send_unified.py --rpi-id pi10 --iface wlan0 --track-macs "b0:54:76:5c:99:d5,24:24:b7:19:30:0a,a8:76:50:e9:28:20"
sudo python3 sniff_and_send_unified.py --rpi-id pi5  --iface wlan0 --track-macs "b0:54:76:5c:99:d5,24:24:b7:19:30:0a,a8:76:50:e9:28:20"
sudo python3 sniff_and_send_unified.py --rpi-id pi7  --iface wlan0 --track-macs "b0:54:76:5c:99:d5,24:24:b7:19:30:0a,a8:76:50:e9:28:20"
sudo python3 sniff_and_send_unified.py --rpi-id pi8  --iface wlan0 --track-macs "b0:54:76:5c:99:d5,24:24:b7:19:30:0a,a8:76:50:e9:28:20"
sudo python3 sniff_and_send_unified.py --rpi-id pi9  --iface wlan1 --track-macs "b0:54:76:5c:99:d5,24:24:b7:19:30:0a,a8:76:50:e9:28:20"
sudo python3 sniff_and_send_unified.py --rpi-id pi11 --iface wlan1 --track-macs "b0:54:76:5c:99:d5,24:24:b7:19:30:0a,a8:76:50:e9:28:20"
sudo python3 sniff_and_send_unified.py --rpi-id pi12 --iface wlan0 --track-macs "b0:54:76:5c:99:d5,24:24:b7:19:30:0a,a8:76:50:e9:28:20"
sudo python3 sniff_and_send_unified.py --rpi-id pi13 --iface wlan0 --track-macs "b0:54:76:5c:99:d5,24:24:b7:19:30:0a,a8:76:50:e9:28:20"
```

**3b. Start live zone classification** (Git Bash terminal 1):
```bash
cd apps/neuralsense
python run_live_geometry.py
```

You should see:
```
LIVE MODE STARTED (rx-time, normalized matching, NO hysteresis)
MIN_SOURCES = 8
WINDOW_SEC  = 5
MARGIN_GATE = 0.15
TRANSITION_CONFIRM_COUNT = 3
STALE_MAC_SEC = 30.0
[MQTT] Connected rc= 0
[SESSION] New MAC b0:54:76:... -> S0001
```

**3c. Start accuracy test** (Git Bash terminal 2):
```bash
cd apps/neuralsense
python accuracy_test_from_zone_assignments.py
```

- Enter the zone ID where the phones are placed
- Wait for TEST_DURATION_SEC (500s)
- First 10s of predictions are skipped (settling period)
- Requires 3 consecutive same-zone predictions before counting (streak)
- Results printed and logged to `accuracy_tests/`

### Step 4: Production Mode

**Start sniffers in PRODUCTION mode** (all MACs, optionally hashed):
```bash
# On each Pi:
sudo python3 sniff_and_send_unified.py --rpi-id pi10 --iface wlan0 --hash-macs --hash-salt "your_secret_salt"
```

- Publishes ALL observed MACs (not just known ones)
- `--hash-macs` + `--hash-salt` replaces raw MACs with salted SHA-256 hashes
- Session linking in run_live handles MAC randomization automatically

---

## Section 7: Output File Schemas

### zone_assignments.jsonl
```json
{
  "ts": 1740000000.123,
  "ts_kst": "2025-02-20 12:00:00.123 KST",
  "phone_id": "b0:54:76:5c:99:d5",
  "session_id": "S0001",
  "zone_id": 5,
  "x": 3, "y": -2,
  "confidence": 0.85,
  "second_zone_id": 6,
  "second_confidence": 0.42,
  "margin": 0.43,
  "sources": ["pi5","pi7","pi8","pi9","pi10","pi11","pi12","pi13"],
  "vector": {"pi5":-55,"pi7":-62,...},
  "timebase": "rx_time_laptop"
}
```

### uncertain_assignments.jsonl
Same schema as zone_assignments.jsonl, but `margin < 0.15`.

### transitions.jsonl
```json
{
  "ts": 1740000005.456,
  "ts_kst": "2025-02-20 12:00:05.456 KST",
  "phone_id": "b0:54:76:5c:99:d5",
  "session_id": "S0001",
  "from_zone": 5,
  "to_zone": 6,
  "confidence": 0.82
}
```

### dwells.jsonl
```json
{
  "phone_id": "b0:54:76:5c:99:d5",
  "session_id": "S0001",
  "zone_id": 5,
  "enter_ts": 1740000000.123,
  "enter_ts_kst": "2025-02-20 12:00:00.123 KST",
  "exit_ts": 1740000005.456,
  "exit_ts_kst": "2025-02-20 12:00:05.456 KST",
  "dwell_sec": 5.333
}
```

### calibration.jsonl
```json
{
  "created_ts": 1740000000.0,
  "created_ts_kst": "2025-02-20 12:00:00.000 KST",
  "zone_id": 5,
  "x": 3, "y": -2,
  "phone_mac_used": "a8:76:50:e9:28:20",
  "max_samples_per_pi": 80,
  "sync_window_sec": 3.0,
  "min_pis_for_vector": 8,
  "vectors_collected": 450,
  "vectors_raw": 500,
  "vectors_after_filter": 450,
  "vector_type": "normalized_rssi_minus_median",
  "timebase": "rx_time_laptop",
  "pi_stats": {"pi5": {"mean": -2.3, "std": 1.8, "n": 450}, ...},
  "vectors": [{"pi5": -2.3, "pi7": 5.1, ...}, ...]
}
```

### accuracy test output (per-phone JSONL)
```json
{
  "ts": 1740000000.123,
  "ts_kst": "2025-02-20 12:00:00.123 KST",
  "phone_id": "b0:54:76:5c:99:d5",
  "true_zone_id": 5,
  "pred_zone_id": 5,
  "is_correct": true,
  "settling_skipped": false,
  "streak_at_pred": 5,
  "counted": true,
  "confidence": 0.85,
  "sources": ["pi5","pi7",...],
  "vector": {"pi5":-55,...}
}
```
