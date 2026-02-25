import argparse
import time
import json
import paho.mqtt.client as mqtt
from scapy.all import sniff
from scapy.layers.dot11 import Dot11

MQTT_HOST = "100.87.27.7"   # pi10 (MQTT broker)
MQTT_PORT = 1883
MQTT_TOPIC = "neuralsense/rssi"

# RSSI sanity range (drop impossible values)
RSSI_MIN_DBM = -95
RSSI_MAX_DBM = -20

def normalize_rssi(val):
    if val is None:
        return None
    try:
        v = int(val)
    except Exception:
        return None
    # Already signed dBm
    if v < 0:
        r = v
    else:
        # Some drivers report unsigned 8-bit; convert 128..255 to signed (-128..-1)
        if 128 <= v <= 255:
            r = v - 256
        else:
            # Likely "quality" (0..100) or unknown; ignore
            return None
    # Drop unrealistic values (prevents -4, -10, etc.)
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
    # A phone MAC can appear in addr1/addr2/addr3 depending on frame type
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

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--rpi-id", required=True, help="pi10, pi5, pi6, pi7, pi8, pi9")
    ap.add_argument("--iface", required=True, help="monitor interface (wlan0 or wlan1)")
    ap.add_argument("--target-mac", default="", help="optional: only publish for this MAC")
    args = ap.parse_args()

    target_mac = args.target_mac.strip().lower()
    if target_mac:
        print("[INFO] Filtering to target MAC only:", target_mac)

    client = mqtt.Client(client_id="sniffer-" + args.rpi_id)
    client.connect(MQTT_HOST, MQTT_PORT, keepalive=30)
    client.loop_start()

    def handle(pkt):
        rssi = get_rssi(pkt)
        if rssi is None:
            return

        macs = extract_macs(pkt)
        if not macs:
            return

        ts = time.time()

        if target_mac:
            # Only publish if target MAC appears in any addr field
            if target_mac not in macs:
                return
            msg = {"ts": ts, "rpi_id": args.rpi_id, "mac": target_mac, "rssi": int(rssi)}
            client.publish(MQTT_TOPIC, json.dumps(msg, separators=(",", ":")), qos=0, retain=False)
            return

        # Otherwise publish for each MAC observed in this frame (more coverage for screen-off devices)
        for mac in macs:
            msg = {"ts": ts, "rpi_id": args.rpi_id, "mac": mac, "rssi": int(rssi)}
            client.publish(MQTT_TOPIC, json.dumps(msg, separators=(",", ":")), qos=0, retain=False)

    print("[OK]", args.rpi_id, "sniffing on", args.iface, "-> MQTT", MQTT_HOST, "topic", MQTT_TOPIC)
    sniff(iface=args.iface, prn=handle, store=False)

if __name__ == "__main__":
    main()
