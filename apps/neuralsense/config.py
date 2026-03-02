"""
NeuralSense central config.
All constants match the values used in the actual scripts.
Environment variables override defaults when set.
"""
import os

# ── MQTT Broker ──
MQTT_BROKER_IP = os.environ.get("MQTT_BROKER_IP", "100.87.27.7")
MQTT_BROKER_PORT = int(os.environ.get("MQTT_BROKER_PORT", "1883"))
MQTT_TOPIC_PREFIX = os.environ.get("MQTT_TOPIC_PREFIX", "neuralsense")

# ── Raspberry Pi IDs (8 active Pis) ──
PI_IDS = os.environ.get(
    "PI_IDS", "pi5,pi7,pi8,pi9,pi10,pi11,pi12,pi13"
).split(",")

# ── Pi → interface mapping (for reference) ──
# pi5:  wlan0    pi10: wlan0
# pi7:  wlan0    pi11: wlan1
# pi8:  wlan0    pi12: wlan0
# pi9:  wlan1    pi13: wlan0

# ── RSSI tuning (run_live_geometry.py) ──
MIN_SOURCES = int(os.environ.get("MIN_SOURCES", "8"))
WINDOW_SEC = int(os.environ.get("WINDOW_SEC", "5"))
PER_PI_FRESH_SEC = float(os.environ.get("PER_PI_FRESH_SEC", "3.0"))
MATCH_DIFF_DBM = float(os.environ.get("MATCH_DIFF_DBM", "7.0"))

# ── Scoring (run_live_geometry.py) ──
MARGIN_GATE = float(os.environ.get("MARGIN_GATE", "0.15"))
RANK_WEIGHT = float(os.environ.get("RANK_WEIGHT", "0.4"))
L1_WEIGHT = float(os.environ.get("L1_WEIGHT", "0.6"))
RANK_MATCH_THRESHOLD = float(os.environ.get("RANK_MATCH_THRESHOLD", "1.5"))

# ── Transition debounce (run_live_geometry.py) ──
TRANSITION_CONFIRM_COUNT = int(os.environ.get("TRANSITION_CONFIRM_COUNT", "3"))

# ── Session linking for randomized MACs (run_live_geometry.py) ──
STALE_MAC_SEC = float(os.environ.get("STALE_MAC_SEC", "30.0"))
SESSION_RANK_THRESHOLD = float(os.environ.get("SESSION_RANK_THRESHOLD", "1.5"))
SESSION_MAX_AGE_SEC = float(os.environ.get("SESSION_MAX_AGE_SEC", "3600.0"))

# ── Calibration (calibrate_interactive_geometry.py) ──
CAL_PHONE_MAC = os.environ.get("CAL_PHONE_MAC", "a8:76:50:e9:28:20")
MAX_SAMPLES_PER_PI = int(os.environ.get("MAX_SAMPLES_PER_PI", "80"))
SYNC_WINDOW_SEC = float(os.environ.get("SYNC_WINDOW_SEC", "3.0"))
MIN_PIS_FOR_VECTOR = int(os.environ.get("MIN_PIS_FOR_VECTOR", "8"))
MAX_VECTORS_PER_ZONE = int(os.environ.get("MAX_VECTORS_PER_ZONE", "2000"))
Z_THRESHOLD = float(os.environ.get("Z_THRESHOLD", "2.5"))

# ── Accuracy testing (accuracy_test_from_zone_assignments.py) ──
TRACK_MACS = os.environ.get(
    "TRACK_MACS",
    "b0:54:76:5c:99:d5,24:24:b7:19:30:0a,a8:76:50:e9:28:20"
).lower().split(",")
TEST_DURATION_SEC = int(os.environ.get("TEST_DURATION_SEC", "500"))
SETTLING_SEC = int(os.environ.get("SETTLING_SEC", "10"))
STABLE_STREAK_REQUIRED = int(os.environ.get("STABLE_STREAK_REQUIRED", "3"))

# ── Pi sniffer RSSI sanity bounds (sniff_and_send_unified.py) ──
RSSI_MIN_DBM = int(os.environ.get("RSSI_MIN_DBM", "-95"))
RSSI_MAX_DBM = int(os.environ.get("RSSI_MAX_DBM", "-20"))

# ── MAC Address Hashing (GDPR/Privacy) ──
# When enabled, MAC addresses are SHA-256 hashed with a salt before processing.
# Same MAC + same salt = same hash (deterministic — session linking still works).
MAC_HASH_ENABLED = os.environ.get("NEURALSENSE_MAC_HASH_ENABLED", "false").lower() == "true"
MAC_SALT = os.environ.get("NEURALSENSE_MAC_SALT", "")

# ── Data output ──
OUTPUT_DIR = os.environ.get("OUTPUT_DIR", "output")

# ── Supabase Upload ──
SUPABASE_URL = os.environ.get("SUPABASE_URL", "")
SUPABASE_ANON_KEY = os.environ.get("SUPABASE_ANON_KEY", "")
STORE_ID = os.environ.get("STORE_ID", "")
ORG_ID = os.environ.get("ORG_ID", "")
ENABLE_UPLOAD = os.environ.get("ENABLE_UPLOAD", "true").lower() == "true"
UPLOAD_BATCH_SIZE = int(os.environ.get("UPLOAD_BATCH_SIZE", "50"))
UPLOAD_INTERVAL_SEC = int(os.environ.get("UPLOAD_INTERVAL_SEC", "30"))
UPLOAD_MAX_RETRIES = int(os.environ.get("UPLOAD_MAX_RETRIES", "3"))
