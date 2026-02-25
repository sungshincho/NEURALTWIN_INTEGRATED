"""
NeuralSense 중앙 설정 파일
모든 하드코딩된 상수를 여기서 관리합니다.
환경변수가 있으면 우선 사용하고, 없으면 기본값을 사용합니다.
"""
import os

# ── MQTT 브로커 ──
MQTT_BROKER_IP = os.getenv("MQTT_BROKER_IP", "100.87.27.7")
MQTT_BROKER_PORT = int(os.getenv("MQTT_BROKER_PORT", "1883"))
MQTT_TOPIC_PREFIX = os.getenv("MQTT_TOPIC_PREFIX", "neuralsense")

# ── Raspberry Pi 식별자 ──
PI_IDS = os.getenv("PI_IDS", "pi5,pi6,pi7,pi8,pi9,pi10,pi11,pi12,pi13").split(",")

# ── RSSI 튜닝 파라미터 ──
MIN_SOURCES = int(os.getenv("MIN_SOURCES", "2"))
WINDOW_SEC = int(os.getenv("WINDOW_SEC", "5"))
RSSI_THRESHOLD = int(os.getenv("RSSI_THRESHOLD", "-75"))
SMOOTHING_ALPHA = float(os.getenv("SMOOTHING_ALPHA", "0.3"))

# ── 삼변측량 설정 ──
TRILATERATION_METHOD = os.getenv("TRILATERATION_METHOD", "weighted")
MAX_DISTANCE_M = float(os.getenv("MAX_DISTANCE_M", "50.0"))

# ── 데이터 출력 ──
OUTPUT_DIR = os.getenv("OUTPUT_DIR", "./data")
LOG_LEVEL = os.getenv("LOG_LEVEL", "INFO")

# ── MAC 주소 필터링 ──
# 이 값들은 환경에 따라 달라지므로 반드시 환경변수 또는 DB에서 관리
KNOWN_DEVICE_MACS = os.getenv("KNOWN_DEVICE_MACS", "").split(",") if os.getenv("KNOWN_DEVICE_MACS") else []
