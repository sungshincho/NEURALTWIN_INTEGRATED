# sniff_and_send_unified.py
#
# Unified sniffer for:
# 1) Production: publish ALL observed MACs (default)
# 2) Calibration: publish ONLY one MAC (--target-mac)
# 3) Test mode: publish ONLY a list of MACs (--track-macs "mac1,mac2,...")
#
# Extras:
# - rpi_id normalization (lowercase)
# - RSSI sanity filtering
# - optional MAC hashing for privacy in production logs (--hash-macs --hash-salt "secret")
#
# Notes:
# - Use a MONITOR mode interface (often wlan1mon), not managed mode wlan1.

import argparse
import sys
import os
import time
import json
import hashlib
import paho.mqtt.client as mqtt
from scapy.all import sniff
from scapy.layers.dot11 import Dot11

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))
from config import MQTT_BROKER_IP, MQTT_BROKER_PORT, MQTT_TOPIC_PREFIX

MQTT_HOST = MQTT_BROKER_IP
MQTT_PORT = MQTT_BROKER_PORT
MQTT_TOPIC = MQTT_TOPIC_PREFIX + "/rssi"

RSSI_MIN_DBM = -95
RSSI_MAX_DBM = -20

def normalize_rssi(val):
    if val is None:
        return None
    try:
        v = int(val)
    except Exception:
        return None

    # Signed dBm already
    if v < 0:
        r = v
    else:
        # Some drivers report unsigned 8-bit; convert 128..255 -> -128..-1
        if 128 <= v <= 255:
            r = v - 256
        else:
            return None

    if r < RSSI_MIN_DBM or r > RSSI_MAX_DBM:
        return None
    return r

def get_rssi(pkt):
    try:
        if hasattr(pkt, "dBm_AntSignal"):
            return normalize_rssi(pkt.dBm_AntSignal)
    except Exception:
        return None
    return None

def extract_macs(pkt):
    if not pkt.haslayer(Dot11):
        return []
    d = pkt.getlayer(Dot11)

    macs = []
    for a in (d.addr1, d.addr2, d.addr3):
        if a:
            macs.append(a.lower())

    # Deduplicate while preserving order
    seen = set()
    out = []
    for m in macs:
        if m not in seen:
            seen.add(m)
            out.append(m)
    return out

def parse_mac_list(s: str):
    s = (s or "").strip()
    if not s:
        return set()
    parts = [p.strip().lower() for p in s.split(",")]
    return set([p for p in parts if p])

def hash_mac(mac: str, salt: str):
    """
    Stable pseudonym for MAC: sha256(salt + mac) -> short hex.
    Keep salt private. Same salt => consistent IDs across runs.
    """
    h = hashlib.sha256((salt + mac).encode("utf-8")).hexdigest()
    return h[:16]  # short id is enough

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--rpi-id", required=True, help="pi10, pi5, pi7 ...")
    ap.add_argument("--iface", required=True, help="monitor interface (e.g. wlan1mon)")
    ap.add_argument("--target-mac", default="", help="CALIBRATION: publish only this MAC")
    ap.add_argument("--track-macs", default="", help="TEST: publish only these MACs (comma-separated)")
    ap.add_argument("--hash-macs", action="store_true", help="PRODUCTION: hash mac addresses before publishing")
    ap.add_argument("--hash-salt", default="", help="salt used for hashing (required if --hash-macs)")
    args = ap.parse_args()

    rpi_id = str(args.rpi_id).strip().lower()
    iface = str(args.iface).strip()
    target_mac = str(args.target_mac).strip().lower()
    track_macs = parse_mac_list(args.track_macs)

    hash_macs = bool(args.hash_macs)
    hash_salt = str(args.hash_salt or "").strip()

    # Safety: hashing requires salt
    if hash_macs and not hash_salt:
        raise SystemExit("ERROR: --hash-macs requires --hash-salt 'some_secret_salt'")

    # Mode priority:
    # 1) target_mac (calibration) overrides everything
    # 2) track_macs (test mode)
    # 3) production (all macs)
    if target_mac:
        mode = "CALIBRATION(target_mac)"
    elif track_macs:
        mode = "TEST(track_macs)"
    else:
        mode = "PRODUCTION(all_macs)"

    print("[MODE]", mode)
    print("[INFO] rpi_id:", rpi_id, "| iface:", iface)
    if target_mac:
        print("[INFO] Publishing ONLY target MAC:", target_mac)
    elif track_macs:
        print("[INFO] Publishing ONLY these track MACs:", sorted(track_macs))
    else:
        print("[INFO] Publishing ALL observed MACs.")
        if hash_macs:
            print("[INFO] MAC hashing ENABLED (salted sha256 -> 16 hex chars).")
        else:
            print("[INFO] MAC hashing DISABLED (publishing raw MACs).")

    client = mqtt.Client(client_id="sniffer-" + rpi_id)
    client.connect(MQTT_HOST, MQTT_PORT, keepalive=30)
    client.loop_start()

    def publish(mac_out: str, rssi: int, ts: float):
        msg = {"ts": ts, "rpi_id": rpi_id, "mac": mac_out, "rssi": int(rssi)}
        client.publish(MQTT_TOPIC, json.dumps(msg, separators=(",", ":")), qos=0, retain=False)

    def handle(pkt):
        rssi = get_rssi(pkt)
        if rssi is None:
            return

        macs = extract_macs(pkt)
        if not macs:
            return

        ts = time.time()

        # --- Calibration: publish only the specified MAC (raw) ---
        if target_mac:
            if target_mac in macs:
                publish(target_mac, rssi, ts)
            return

        # --- Test: publish only track list (raw) ---
        if track_macs:
            for mac in macs:
                if mac in track_macs:
                    publish(mac, rssi, ts)
            return

        # --- Production: publish all macs (optionally hashed) ---
        if hash_macs:
            for mac in macs:
                publish(hash_mac(mac, hash_salt), rssi, ts)
        else:
            for mac in macs:
                publish(mac, rssi, ts)

    print("[OK]", rpi_id, "sniffing on", iface, "-> MQTT", MQTT_HOST, "topic", MQTT_TOPIC)
    sniff(iface=iface, prn=handle, store=False)

if __name__ == "__main__":
    main()
