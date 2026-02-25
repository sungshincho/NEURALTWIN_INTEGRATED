# run_live_no_hyst.py (rx-time + normalized matching + per-pi freshness, NO hysteresis)
import os
import json
import time
import csv
import sys
from collections import defaultdict, deque
from statistics import median
from datetime import datetime, timezone, timedelta
import paho.mqtt.client as mqtt

MQTT_HOST = "100.87.27.7"
MQTT_PORT = 1883
MQTT_TOPIC = "neuralsense/rssi"

ZONES_CSV = "zones.csv"
CAL_JSONL = os.path.join("output", "calibration.jsonl")

OUT_DIR = "output"
OUT_RAW = os.path.join(OUT_DIR, "raw_rssi.jsonl")
OUT_ASSIGN = os.path.join(OUT_DIR, "zone_assignments.jsonl")
OUT_TRANS = os.path.join(OUT_DIR, "transitions.jsonl")
OUT_DWELL = os.path.join(OUT_DIR, "dwells.jsonl")
OUT_ERR = os.path.join(OUT_DIR, "run_live_errors.jsonl")

WINDOW_SEC = 5
MIN_SOURCES = 8
MATCH_DIFF_DBM = 7.0

# Per-Pi freshness gating
PER_PI_FRESH_SEC = 3.0

KST = timezone(timedelta(hours=9))

def ts_kst(ts_float):
    return datetime.fromtimestamp(ts_float, KST).strftime("%Y-%m-%d %H:%M:%S.%f")[:-3] + " KST"

def safe_append_jsonl(path, obj):
    try:
        with open(path, "a", encoding="utf-8") as f:
            f.write(json.dumps(obj, separators=(",", ":")) + "\n")
    except Exception as e:
        sys.stderr.write("[FILE_WRITE_ERROR] {} -> {}\n".format(path, str(e)))
        sys.stderr.flush()

def log_error(where, exc, extra=None):
    now = time.time()
    payload = {"ts": now, "ts_kst": ts_kst(now), "where": where, "error": str(exc)}
    if extra is not None:
        payload["extra"] = extra
    safe_append_jsonl(OUT_ERR, payload)
    sys.stderr.write("[ERROR] {}: {}\n".format(where, str(exc)))
    sys.stderr.flush()

def load_zones():
    zones = {}
    try:
        with open(ZONES_CSV, "r", encoding="utf-8") as f:
            for r in csv.DictReader(f):
                zones[int(r["zone_id"])] = (int(r["x"]), int(r["y"]))
    except Exception as e:
        log_error("load_zones", e)
    return zones

def load_calibration():
    latest = {}
    if not os.path.exists(CAL_JSONL):
        return latest
    try:
        with open(CAL_JSONL, "r", encoding="utf-8") as f:
            for line in f:
                try:
                    rec = json.loads(line)
                    zid = int(rec["zone_id"])
                    created = float(rec.get("created_ts", 0) or 0)
                    vectors = rec.get("vectors", [])
                    if not vectors:
                        continue
                    if zid not in latest or created > float(latest[zid].get("created_ts", 0) or 0):
                        latest[zid] = rec
                except Exception:
                    continue
    except Exception as e:
        log_error("load_calibration", e)
    return latest

def median_list(nums):
    s = sorted(nums)
    n = len(s)
    mid = n // 2
    return float(s[mid]) if n % 2 else (s[mid - 1] + s[mid]) / 2.0

def normalize_live_vector(vec):
    m = median_list([int(v) for v in vec.values()])
    return {pi: round(int(rssi) - m, 1) for pi, rssi in vec.items()}

def avg_diff_norm(live_norm, cal_norm):
    common = [p for p in live_norm if p in cal_norm]
    if not common:
        return float("inf")
    return sum(abs(float(live_norm[p]) - float(cal_norm[p])) for p in common) / float(len(common))

def score_best_zone(live_norm, cal):
    best_zone = None
    best_conf = -1.0
    for zid, rec in cal.items():
        vectors = rec.get("vectors", [])
        if not vectors:
            continue
        matches = 0
        for v in vectors:
            if avg_diff_norm(live_norm, v) <= MATCH_DIFF_DBM:
                matches += 1
        conf = matches / float(len(vectors))
        if conf > best_conf:
            best_conf = conf
            best_zone = int(zid)
    return best_zone, float(best_conf)

def build_fresh_vector(events_deque, now_ts):
    # latest_by_pi[pi] = (ts, rssi)
    latest_by_pi = {}
    for ts, pi, rssi in events_deque:
        prev = latest_by_pi.get(pi)
        if prev is None or ts > prev[0]:
            latest_by_pi[pi] = (ts, rssi)

    vec = {}
    for pi, (ts, rssi) in latest_by_pi.items():
        if (now_ts - ts) <= PER_PI_FRESH_SEC:
            vec[pi] = int(rssi)
    return vec

def main():
    os.makedirs(OUT_DIR, exist_ok=True)
    zones = load_zones()
    cal = load_calibration()
    if not cal:
        print("ERROR: output/calibration.jsonl missing or has no vectors. Run calibration first.")
        return

    print("LIVE MODE STARTED (rx-time, normalized matching, NO hysteresis)")
    print("MIN_SOURCES =", MIN_SOURCES)
    print("WINDOW_SEC  =", WINDOW_SEC)
    print("PER_PI_FRESH_SEC =", PER_PI_FRESH_SEC)
    print("MATCH_DIFF_DBM (normalized) =", MATCH_DIFF_DBM)
    print("Broker:", MQTT_HOST, "Topic:", MQTT_TOPIC)
    print("Zones loaded:", len(zones), "| Cal zones:", len(cal))

    buf = defaultdict(lambda: deque())
    state = {}  # for dwell/transitions only: state[phone] = (zone_id, enter_ts)

    def on_connect(client, userdata, flags, rc):
        print("[MQTT] Connected rc=", rc)
        try:
            client.subscribe(MQTT_TOPIC)
            print("[MQTT] Subscribed to", MQTT_TOPIC)
        except Exception as e:
            log_error("on_connect/subscribe", e)

    def on_message(client, userdata, msg):
        rx_ts = time.time()

        try:
            evt = json.loads(msg.payload.decode("utf-8"))
        except Exception as e:
            log_error("json_decode", e)
            return

        phone = str(evt.get("mac", "")).lower().strip()
        rpi_id = str(evt.get("rpi_id", "")).strip().lower()
        try:
            rssi = int(evt.get("rssi"))
        except Exception as e:
            log_error("parse_rssi", e, extra={"evt": evt})
            return

        safe_append_jsonl(OUT_RAW, {
            "ts": rx_ts, "ts_kst": ts_kst(rx_ts),
            "phone_id": phone, "rpi_id": rpi_id, "rssi": rssi
        })

        d = buf[phone]
        d.append((rx_ts, rpi_id, rssi))
        cutoff = rx_ts - WINDOW_SEC
        while d and d[0][0] < cutoff:
            d.popleft()

        raw_vec = build_fresh_vector(d, rx_ts)
        sources = sorted(raw_vec.keys())
        if len(sources) < MIN_SOURCES:
            return

        live_norm = normalize_live_vector(raw_vec)
        best_zone, best_conf = score_best_zone(live_norm, cal)
        if best_zone is None:
            return

        x, y = zones.get(best_zone, (None, None))

        # Log assignment every time we get a valid best_zone
        safe_append_jsonl(OUT_ASSIGN, {
            "ts": rx_ts,
            "ts_kst": ts_kst(rx_ts),
            "phone_id": phone,
            "zone_id": int(best_zone),
            "x": x,
            "y": y,
            "confidence": float(best_conf),
            "sources": sources,
            "vector": raw_vec,
            "timebase": "rx_time_laptop"
        })

        # transitions/dwells (no hysteresis, but we still track movement)
        if phone not in state:
            state[phone] = (int(best_zone), rx_ts)
            safe_append_jsonl(OUT_TRANS, {
                "ts": rx_ts, "ts_kst": ts_kst(rx_ts),
                "phone_id": phone,
                "from_zone": None,
                "to_zone": int(best_zone),
                "confidence": float(best_conf)
            })
            return

        prev_zone, enter_ts = state[phone]
        if prev_zone == int(best_zone):
            return

        safe_append_jsonl(OUT_DWELL, {
            "phone_id": phone,
            "zone_id": int(prev_zone),
            "enter_ts": float(enter_ts),
            "enter_ts_kst": ts_kst(float(enter_ts)),
            "exit_ts": rx_ts,
            "exit_ts_kst": ts_kst(rx_ts),
            "dwell_sec": rx_ts - float(enter_ts)
        })
        safe_append_jsonl(OUT_TRANS, {
            "ts": rx_ts, "ts_kst": ts_kst(rx_ts),
            "phone_id": phone,
            "from_zone": int(prev_zone),
            "to_zone": int(best_zone),
            "confidence": float(best_conf)
        })
        state[phone] = (int(best_zone), rx_ts)

    client = mqtt.Client(client_id="laptop-live-nohyst")
    client.on_connect = on_connect
    client.on_message = on_message
    client.reconnect_delay_set(min_delay=1, max_delay=10)
    client.enable_logger()
    client.connect(MQTT_HOST, MQTT_PORT, keepalive=30)
    client.loop_forever(retry_first_connection=True)

if __name__ == "__main__":
    main()
