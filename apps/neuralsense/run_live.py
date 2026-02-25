import os
import json
import time
import csv
import sys
from collections import defaultdict, deque
from statistics import median
from datetime import datetime, timezone, timedelta
import paho.mqtt.client as mqtt

from config import (
    MQTT_BROKER_IP, MQTT_BROKER_PORT, MQTT_TOPIC_PREFIX,
    WINDOW_SEC, MIN_SOURCES, OUTPUT_DIR,
)

MQTT_HOST = MQTT_BROKER_IP
MQTT_PORT = MQTT_BROKER_PORT
MQTT_TOPIC = MQTT_TOPIC_PREFIX + "/rssi"

ZONES_CSV = "zones.csv"
CAL_JSONL = os.path.join("output", "calibration.jsonl")

OUT_DIR = "output"
OUT_RAW = os.path.join(OUT_DIR, "raw_rssi.jsonl")
OUT_ASSIGN = os.path.join(OUT_DIR, "zone_assignments.jsonl")
OUT_TRANS = os.path.join(OUT_DIR, "transitions.jsonl")
OUT_DWELL = os.path.join(OUT_DIR, "dwells.jsonl")
OUT_ERR = os.path.join(OUT_DIR, "run_live_errors.jsonl")

MATCH_DIFF_DBM = 7.0

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
    payload = {"ts": time.time(), "ts_kst": ts_kst(time.time()), "where": where, "error": str(exc)}
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

def avg_diff(live_vec, cal_vec):
    common = [p for p in live_vec if p in cal_vec]
    if not common:
        return float("inf")
    return sum(abs(int(live_vec[p]) - int(cal_vec[p])) for p in common) / float(len(common))

def main():
    os.makedirs(OUT_DIR, exist_ok=True)
    zones = load_zones()
    cal = load_calibration()
    if not cal:
        print("ERROR: output/calibration.jsonl missing or has no vectors. Run calibration first.")
        return

    print("LIVE MODE STARTED")
    print("MIN_SOURCES =", MIN_SOURCES)
    print("Broker:", MQTT_HOST, "Topic:", MQTT_TOPIC)
    print("Zones loaded:", len(zones), "| Cal zones:", len(cal))
    print("Writing:", OUT_RAW)

    buf = defaultdict(lambda: deque())
    state = {}

    def on_connect(client, userdata, flags, rc):
        print("[MQTT] Connected rc=", rc)
        try:
            client.subscribe(MQTT_TOPIC)
            print("[MQTT] Subscribed to", MQTT_TOPIC)
        except Exception as e:
            log_error("on_connect/subscribe", e)

    def on_message(client, userdata, msg):
        try:
            evt = json.loads(msg.payload.decode("utf-8"))
        except Exception as e:
            log_error("json_decode", e)
            return

        try:
            ts = float(evt.get("ts", time.time()))
        except Exception:
            ts = time.time()

        phone = str(evt.get("mac", "")).lower().strip()
        rpi_id = str(evt.get("rpi_id", "")).strip().lower()  # FIX: normalize
        try:
            rssi = int(evt.get("rssi"))
        except Exception as e:
            log_error("parse_rssi", e, extra={"evt": evt})
            return

        # raw log
        safe_append_jsonl(OUT_RAW, {"ts": ts, "ts_kst": ts_kst(ts), "phone_id": phone, "rpi_id": rpi_id, "rssi": rssi})

        # rolling window
        d = buf[phone]
        d.append((ts, rpi_id, rssi))
        cutoff = ts - WINDOW_SEC
        while d and d[0][0] < cutoff:
            d.popleft()

        # live vector
        by_pi = defaultdict(list)
        for _, pi, rs in d:
            by_pi[pi].append(rs)
        live_vec = {pi: int(median(vals)) for pi, vals in by_pi.items() if vals}

        sources = sorted(list(live_vec.keys()))
        if len(sources) < MIN_SOURCES:
            return  # HARD ENFORCEMENT

        # score zones
        best_zone = None
        best_conf = -1.0
        for zid, rec in cal.items():
            vectors = rec.get("vectors", [])
            if not vectors:
                continue
            matches = 0
            for v in vectors:
                if avg_diff(live_vec, v) <= MATCH_DIFF_DBM:
                    matches += 1
            conf = matches / float(len(vectors))
            if conf > best_conf:
                best_conf = conf
                best_zone = int(zid)

        if best_zone is None:
            return

        x, y = zones.get(best_zone, (None, None))

        # assignment (uses sources computed above)
        safe_append_jsonl(OUT_ASSIGN, {
            "ts": ts,
            "ts_kst": ts_kst(ts),
            "phone_id": phone,
            "zone_id": best_zone,
            "x": x,
            "y": y,
            "confidence": float(best_conf),
            "sources": sources,
            "vector": live_vec
        })

        # transitions/dwells
        if phone not in state:
            state[phone] = (best_zone, ts)
            safe_append_jsonl(OUT_TRANS, {"ts": ts, "ts_kst": ts_kst(ts), "phone_id": phone, "from_zone": None, "to_zone": best_zone, "confidence": float(best_conf)})
            return

        prev_zone, enter_ts = state[phone]
        if prev_zone == best_zone:
            return

        safe_append_jsonl(OUT_DWELL, {"phone_id": phone, "zone_id": prev_zone, "enter_ts": float(enter_ts), "enter_ts_kst": ts_kst(float(enter_ts)), "exit_ts": ts, "exit_ts_kst": ts_kst(ts), "dwell_sec": ts - float(enter_ts)})
        safe_append_jsonl(OUT_TRANS, {"ts": ts, "ts_kst": ts_kst(ts), "phone_id": phone, "from_zone": prev_zone, "to_zone": best_zone, "confidence": float(best_conf)})
        state[phone] = (best_zone, ts)

    client = mqtt.Client(client_id="laptop-live")
    client.on_connect = on_connect
    client.on_message = on_message
    client.reconnect_delay_set(min_delay=1, max_delay=10)
    client.enable_logger()
    client.connect(MQTT_HOST, MQTT_PORT, keepalive=30)
    client.loop_forever(retry_first_connection=True)

if __name__ == "__main__":
    main()
