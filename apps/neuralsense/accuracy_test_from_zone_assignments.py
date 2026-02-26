# accuracy_test_from_zone_assignments.py
import os
import time
import json
from datetime import datetime, timezone, timedelta

# -----------------------
# CONFIG
# -----------------------
TRACK_MACS = [
    "b0:54:76:5c:99:d5",
    "24:24:b7:19:30:0a",
    "a8:76:50:e9:28:20"
]
TRACK_MACS = [m.lower() for m in TRACK_MACS]

TEST_DURATION_SEC = 500

# Settling: ignore predictions in first SETTLING_SEC after test start
# (2x WINDOW_SEC in run_live, allows full buffer refresh)
SETTLING_SEC = 10

# Require N consecutive identical zone predictions per phone before counting
STABLE_STREAK_REQUIRED = 3

OUT_DIR = "accuracy_tests"
MASTER_LOG = os.path.join(OUT_DIR, "neuralsense_accuracy_master_log.txt")

# This is run_live output file
ZONE_ASSIGNMENTS_PATH = os.path.join("output", "zone_assignments.jsonl")

KST = timezone(timedelta(hours=9))

def ts_kst(ts_float):
    return datetime.fromtimestamp(ts_float, KST).strftime("%Y-%m-%d %H:%M:%S.%f")[:-3] + " KST"

def today_mmddyyyy_kst(ts_float=None):
    if ts_float is None:
        ts_float = time.time()
    return datetime.fromtimestamp(ts_float, KST).strftime("%m%d%Y")

def mac_compact(mac):
    return mac.replace(":", "").lower()

def zone_id_str(zid):
    return str(int(zid)).zfill(2)

def append_jsonl(path, obj):
    with open(path, "a", encoding="utf-8") as f:
        f.write(json.dumps(obj, separators=(",", ":")) + "\n")

def append_master(line):
    with open(MASTER_LOG, "a", encoding="utf-8") as f:
        f.write(line + "\n")

def safe_int_input(prompt):
    while True:
        s = input(prompt).strip()
        try:
            return int(s)
        except ValueError:
            print("Please type a number (example: 1).")

def tail_follow_jsonl(path, start_at_end=True):
    """
    Generator that yields parsed JSON objects from a growing JSONL file.
    start_at_end=True means only new lines from now on (recommended for live test).
    """
    with open(path, "r", encoding="utf-8") as f:
        if start_at_end:
            f.seek(0, 2)
        while True:
            line = f.readline()
            if not line:
                time.sleep(0.1)
                continue
            line = line.strip()
            if not line:
                continue
            try:
                yield json.loads(line)
            except Exception:
                continue

def main():
    os.makedirs(OUT_DIR, exist_ok=True)

    if not os.path.exists(ZONE_ASSIGNMENTS_PATH):
        print("ERROR: {} not found.".format(ZONE_ASSIGNMENTS_PATH))
        print("Make sure run_live.py is running and writing output/zone_assignments.jsonl")
        return

    print("Tracking MACs:")
    for m in TRACK_MACS:
        print(" -", m)
    print("Reading:", ZONE_ASSIGNMENTS_PATH)
    print("Test duration (sec):", TEST_DURATION_SEC)
    print("Output folder:", OUT_DIR)

    while True:
        true_zone = safe_int_input("1) Which zone are the smart phones at (zone_id)?: ")

        date_str = today_mmddyyyy_kst(time.time())
        zid_s = zone_id_str(true_zone)

        # per-phone output jsonl
        out_files = {}
        for mac in TRACK_MACS:
            fname = "neuralsense_test_zone_id_{}_{}_phone_id_{}.jsonl".format(
                zid_s, date_str, mac_compact(mac)
            )
            out_files[mac] = os.path.join(OUT_DIR, fname)

        total = {m: 0 for m in TRACK_MACS}
        correct = {m: 0 for m in TRACK_MACS}
        settling_skipped = {m: 0 for m in TRACK_MACS}

        # Per-phone streak tracking: streak_zone = last predicted zone, streak_count = consecutive count
        streak_zone = {m: None for m in TRACK_MACS}
        streak_count = {m: 0 for m in TRACK_MACS}
        streak_reached = {m: False for m in TRACK_MACS}

        start = time.time()
        end = start + TEST_DURATION_SEC

        print("TEST START true_zone={} for {} seconds @ {}".format(true_zone, TEST_DURATION_SEC, ts_kst(start)))
        print("SETTLING_SEC={}, STABLE_STREAK_REQUIRED={}".format(SETTLING_SEC, STABLE_STREAK_REQUIRED))
        print("Logging per-phone JSONL into:", OUT_DIR)

        # Follow zone_assignments.jsonl from "now"
        stream = tail_follow_jsonl(ZONE_ASSIGNMENTS_PATH, start_at_end=True)

        while time.time() < end:
            evt = next(stream)

            phone = str(evt.get("phone_id", "")).lower().strip()
            if phone not in TRACK_MACS:
                continue

            # predicted zone
            try:
                pred_zone = int(evt.get("zone_id"))
            except Exception:
                continue

            ts = evt.get("ts", time.time())
            try:
                ts = float(ts)
            except Exception:
                ts = time.time()

            elapsed = time.time() - start

            # Settling period: skip predictions in first SETTLING_SEC
            in_settling = elapsed < SETTLING_SEC

            # Streak tracking (always updated, even during settling)
            if pred_zone == streak_zone[phone]:
                streak_count[phone] += 1
            else:
                streak_zone[phone] = pred_zone
                streak_count[phone] = 1

            cur_streak = streak_count[phone]
            if cur_streak >= STABLE_STREAK_REQUIRED:
                streak_reached[phone] = True

            # Decide whether to count this prediction
            skip_settling = in_settling
            skip_streak = not streak_reached[phone]
            should_count = not skip_settling and not skip_streak

            if skip_settling:
                settling_skipped[phone] += 1

            is_correct = (pred_zone == true_zone)
            if should_count:
                total[phone] += 1
                if is_correct:
                    correct[phone] += 1

            # Write the record (includes correctness and new fields)
            rec = {
                "ts": ts,
                "ts_kst": evt.get("ts_kst", ts_kst(ts)),
                "phone_id": phone,
                "true_zone_id": true_zone,
                "pred_zone_id": pred_zone,
                "is_correct": is_correct,
                "settling_skipped": skip_settling,
                "streak_at_pred": cur_streak,
                "counted": should_count,
                "x": evt.get("x"),
                "y": evt.get("y"),
                "confidence": evt.get("confidence"),
                "sources": evt.get("sources"),
                "vector": evt.get("vector")
            }
            append_jsonl(out_files[phone], rec)

        print("TEST END true_zone={} @ {}".format(true_zone, ts_kst(time.time())))

        # Print enhanced summary per phone + master log
        for mac in TRACK_MACS:
            t = total[mac]
            c = correct[mac]
            sk = settling_skipped[mac]
            pct = (c / t * 100.0) if t > 0 else 0.0
            line = "zone_id: {}, phone_id: {}, Accuracy: {}/{} ({:.0f}%), settling_skipped: {}, effective_predictions: {}".format(
                true_zone, mac, c, t, pct, sk, t
            )
            print(line)
            append_master(line)

        cont = input("Continue accuracy testing? (y/n): ").strip().lower()
        if cont not in ("y", "yes"):
            break

    print("DONE.")

if __name__ == "__main__":
    main()
