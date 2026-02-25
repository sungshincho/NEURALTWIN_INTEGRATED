import os
import sys
import json
import time
import csv
from collections import deque
from queue import Queue, Empty
from datetime import datetime, timezone, timedelta
import paho.mqtt.client as mqtt

MQTT_HOST = "100.87.27.7"
MQTT_PORT = 1883
MQTT_TOPIC = "neuralsense/rssi"

CAL_PHONE_MAC = "a8:76:50:e9:28:20"
ALL_PIS = ["pi10", "pi5", "pi7", "pi8", "pi9", "pi11", "pi12", "pi13"]

MAX_SAMPLES_PER_PI = 8
TIMEOUT_SEC = 180

SYNC_WINDOW_SEC = 1.0
MIN_PIS_FOR_VECTOR = 3
MAX_VECTORS_PER_ZONE = 1000

RECENT_WINDOW = 4
OUTLIER_THRESHOLD = 15

ZONES_CSV = "zones.csv"
OUT_CAL_JSONL = os.path.join("output", "calibration.jsonl")

STATUS_WIDTH = 180
KST = timezone(timedelta(hours=9))

def now_kst_str(ts=None):
    if ts is None:
        ts = time.time()
    return datetime.fromtimestamp(ts, KST).strftime("%Y-%m-%d %H:%M:%S.%f")[:-3] + " KST"

def draw_status_line(text):
    sys.stdout.write("\r" + text.ljust(STATUS_WIDTH))
    sys.stdout.flush()

def clear_status_line():
    sys.stdout.write("\r" + (" " * STATUS_WIDTH) + "\r")
    sys.stdout.flush()

def load_zones():
    zones = {}
    with open(ZONES_CSV, "r", encoding="utf-8") as f:
        r = csv.DictReader(f)
        for row in r:
            zid = int(row["zone_id"])
            zones[zid] = (int(row["x"]), int(row["y"]))
    return zones

def append_jsonl(path, obj):
    with open(path, "a", encoding="utf-8") as f:
        f.write(json.dumps(obj, separators=(",", ":")) + "\n")

def median_of_list(vals):
    if not vals:
        return None
    s = sorted(vals)
    n = len(s)
    mid = n // 2
    return float(s[mid]) if n % 2 else (s[mid - 1] + s[mid]) / 2.0

def outlier_ok(samples, val):
    if len(samples) < RECENT_WINDOW:
        return True
    med = median_of_list(list(samples)[-RECENT_WINDOW:])
    return abs(val - med) <= OUTLIER_THRESHOLD

def drain_queue(q):
    while True:
        try:
            q.get_nowait()
        except Empty:
            break

def freeze_vec(vec):
    return tuple(sorted((pi, int(rssi)) for pi, rssi in vec.items()))

def main():
    os.makedirs("output", exist_ok=True)
    zones = load_zones()

    print("CALIBRATION PHONE MAC:", CAL_PHONE_MAC)
    print("MAX samples per Pi:", MAX_SAMPLES_PER_PI)
    print("Vector rule: ≥{} Pis within {}s".format(MIN_PIS_FOR_VECTOR, SYNC_WINDOW_SEC))

    rssi_queue = Queue()

    def on_message(client, userdata, msg):
        try:
            obj = json.loads(msg.payload.decode("utf-8"))
            if obj.get("mac", "").lower() != CAL_PHONE_MAC:
                return
            rpi_id = obj["rpi_id"]
            rssi = int(obj["rssi"])
            ts = float(obj.get("ts", time.time()))
        except Exception:
            return
        if rpi_id in ALL_PIS:
            rssi_queue.put((ts, rpi_id, rssi))

    client = mqtt.Client(client_id="laptop-calibrate")
    client.on_message = on_message
    client.connect(MQTT_HOST, MQTT_PORT, keepalive=30)
    client.subscribe(MQTT_TOPIC)
    client.loop_start()

    try:
        while True:
            zid = int(input("1) Zone ID (1..125): ").strip())
            if zid not in zones:
                print("Invalid zone.")
                continue

            x, y = zones[zid]
            print("CALIBRATING ZONE", zid, "(x={}, y={})".format(x, y))

            drain_queue(rssi_queue)

            samples = {pi: deque() for pi in ALL_PIS}
            latest = {pi: None for pi in ALL_PIS}
            vectors = []
            seen = set()

            start = time.time()

            while True:
                now = time.time()
                status = ["{}:{}/{}".format(pi, len(samples[pi]), MAX_SAMPLES_PER_PI) for pi in ALL_PIS]
                draw_status_line("   " + "  ".join(status) + "   vectors:{}".format(len(vectors)))

                if all(len(samples[pi]) >= MAX_SAMPLES_PER_PI for pi in ALL_PIS):
                    break
                if len(vectors) >= MAX_VECTORS_PER_ZONE:
                    break
                if now - start > TIMEOUT_SEC:
                    break

                try:
                    ts, pi, rssi = rssi_queue.get(timeout=0.2)
                except Empty:
                    continue

                latest[pi] = (ts, rssi)

                if len(samples[pi]) < MAX_SAMPLES_PER_PI and outlier_ok(samples[pi], rssi):
                    samples[pi].append(rssi)
                    clear_status_line()
                    print("SAMPLE {} {}/{} RSSI={} dBm @ {}".format(
                        pi, len(samples[pi]), MAX_SAMPLES_PER_PI, rssi, now_kst_str(ts)
                    ))

                active = {p: latest[p][1] for p in ALL_PIS if latest[p] and ts - latest[p][0] <= SYNC_WINDOW_SEC}
                if len(active) >= MIN_PIS_FOR_VECTOR:
                    key = freeze_vec(active)
                    if key not in seen:
                        seen.add(key)
                        vectors.append(active)

            record_ts = time.time()
            rec = {
                "created_ts": record_ts,
                "created_ts_kst": now_kst_str(record_ts),
                "zone_id": zid,
                "x": x,
                "y": y,
                "phone_mac_used": CAL_PHONE_MAC,
                "max_samples_per_pi": MAX_SAMPLES_PER_PI,
                "sync_window_sec": SYNC_WINDOW_SEC,
                "min_pis_for_vector": MIN_PIS_FOR_VECTOR,
                "vectors_collected": len(vectors),
                "vectors": vectors
            }
            append_jsonl(OUT_CAL_JSONL, rec)

            clear_status_line()
            print("SAVED calibration for zone", zid, "vectors:", len(vectors))

            if input("2) Continue calibration? (y/n): ").lower() != "y":
                break
    finally:
        client.loop_stop()
        clear_status_line()
        print("DONE CALIBRATING.")

if __name__ == "__main__":
    main()