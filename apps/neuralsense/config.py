"""
NeuralSense central config.
All constants match the values used in the actual scripts.
Environment variables override defaults when set.
"""
import os

# ── MQTT Broker ──
MQTT_BROKER_IP = os.getenv("MQTT_BROKER_IP", "100.87.27.7")
MQTT_BROKER_PORT = int(os.getenv("MQTT_BROKER_PORT", "1883"))
MQTT_TOPIC_PREFIX = os.getenv("MQTT_TOPIC_PREFIX", "neuralsense")

# ── Raspberry Pi IDs (8 active Pis) ──
PI_IDS = os.getenv(
    "PI_IDS", "pi5,pi7,pi8,pi9,pi10,pi11,pi12,pi13"
).split(",")

# ── Pi → interface mapping (for reference) ──
# pi5:  wlan0    pi10: wlan0
# pi7:  wlan0    pi11: wlan1
# pi8:  wlan0    pi12: wlan0
# pi9:  wlan1    pi13: wlan0

# ── RSSI tuning (run_live_geometry.py) ──
MIN_SOURCES = int(os.getenv("MIN_SOURCES", "8"))
WINDOW_SEC = int(os.getenv("WINDOW_SEC", "5"))
PER_PI_FRESH_SEC = float(os.getenv("PER_PI_FRESH_SEC", "3.0"))
MATCH_DIFF_DBM = float(os.getenv("MATCH_DIFF_DBM", "7.0"))

# ── Scoring (run_live_geometry.py) ──
MARGIN_GATE = float(os.getenv("MARGIN_GATE", "0.15"))
RANK_WEIGHT = float(os.getenv("RANK_WEIGHT", "0.4"))
L1_WEIGHT = float(os.getenv("L1_WEIGHT", "0.6"))
RANK_MATCH_THRESHOLD = float(os.getenv("RANK_MATCH_THRESHOLD", "1.5"))

# ── Transition debounce (run_live_geometry.py) ──
TRANSITION_CONFIRM_COUNT = int(os.getenv("TRANSITION_CONFIRM_COUNT", "3"))

# ── Session linking for randomized MACs (run_live_geometry.py) ──
STALE_MAC_SEC = float(os.getenv("STALE_MAC_SEC", "30.0"))
SESSION_RANK_THRESHOLD = float(os.getenv("SESSION_RANK_THRESHOLD", "1.5"))
SESSION_MAX_AGE_SEC = float(os.getenv("SESSION_MAX_AGE_SEC", "3600.0"))

# ── Calibration (calibrate_interactive_geometry.py) ──
CAL_PHONE_MAC = os.getenv("CAL_PHONE_MAC", "a8:76:50:e9:28:20")
MAX_SAMPLES_PER_PI = int(os.getenv("MAX_SAMPLES_PER_PI", "80"))
SYNC_WINDOW_SEC = float(os.getenv("SYNC_WINDOW_SEC", "3.0"))
MIN_PIS_FOR_VECTOR = int(os.getenv("MIN_PIS_FOR_VECTOR", "8"))
MAX_VECTORS_PER_ZONE = int(os.getenv("MAX_VECTORS_PER_ZONE", "2000"))
Z_THRESHOLD = float(os.getenv("Z_THRESHOLD", "2.5"))

# ── Accuracy testing (accuracy_test_from_zone_assignments.py) ──
TRACK_MACS = os.getenv(
    "TRACK_MACS",
    "b0:54:76:5c:99:d5,24:24:b7:19:30:0a,a8:76:50:e9:28:20"
).lower().split(",")
TEST_DURATION_SEC = int(os.getenv("TEST_DURATION_SEC", "500"))
SETTLING_SEC = int(os.getenv("SETTLING_SEC", "10"))
STABLE_STREAK_REQUIRED = int(os.getenv("STABLE_STREAK_REQUIRED", "3"))

# ── Pi sniffer RSSI sanity bounds (sniff_and_send_unified.py) ──
RSSI_MIN_DBM = int(os.getenv("RSSI_MIN_DBM", "-95"))
RSSI_MAX_DBM = int(os.getenv("RSSI_MAX_DBM", "-20"))

# ── Data output ──
OUTPUT_DIR = os.getenv("OUTPUT_DIR", "output")

# ── Supabase Upload ──
SUPABASE_URL = os.getenv("SUPABASE_URL", "")
SUPABASE_ANON_KEY = os.getenv("SUPABASE_ANON_KEY", "")
STORE_ID = os.getenv("STORE_ID", "")
ORG_ID = os.getenv("ORG_ID", "")
ENABLE_UPLOAD = os.getenv("ENABLE_UPLOAD", "false").lower() == "true"
UPLOAD_BATCH_SIZE = int(os.getenv("UPLOAD_BATCH_SIZE", "50"))
UPLOAD_INTERVAL_SEC = int(os.getenv("UPLOAD_INTERVAL_SEC", "30"))
UPLOAD_MAX_RETRIES = int(os.getenv("UPLOAD_MAX_RETRIES", "3"))
