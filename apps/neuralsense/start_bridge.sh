#!/usr/bin/env bash
# start_bridge.sh — Production startup script for NeuralSense bridge.
# Checks required environment variables, activates venv, starts
# run_live_geometry.py with logging, and restarts on failure.

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

LOG_DIR="${SCRIPT_DIR}/logs"
mkdir -p "$LOG_DIR"

RESTART_DELAY=5  # seconds to wait before restarting on failure

# ── Check required environment variables ──
REQUIRED_VARS=(
    SUPABASE_URL
    SUPABASE_ANON_KEY
    STORE_ID
    ORG_ID
    MQTT_BROKER_IP
)

missing=()
for var in "${REQUIRED_VARS[@]}"; do
    if [ -z "${!var:-}" ]; then
        missing+=("$var")
    fi
done

if [ ${#missing[@]} -gt 0 ]; then
    echo "ERROR: Missing required environment variables:"
    for var in "${missing[@]}"; do
        echo "  - $var"
    done
    echo ""
    echo "Copy .env.example to .env and fill in the values, then:"
    echo "  export \$(grep -v '^#' .env | xargs)"
    exit 1
fi

echo "=== NeuralSense Bridge ==="
echo "SUPABASE_URL    = ${SUPABASE_URL}"
echo "STORE_ID        = ${STORE_ID}"
echo "ORG_ID          = ${ORG_ID}"
echo "MQTT_BROKER_IP  = ${MQTT_BROKER_IP}"
echo "MQTT_BROKER_PORT= ${MQTT_BROKER_PORT:-1883}"
echo "ENABLE_UPLOAD   = ${ENABLE_UPLOAD:-true}"
echo "=========================="

# ── Activate virtual environment if it exists ──
if [ -d "${SCRIPT_DIR}/venv" ]; then
    echo "Activating virtual environment: ${SCRIPT_DIR}/venv"
    source "${SCRIPT_DIR}/venv/bin/activate"
elif [ -d "${SCRIPT_DIR}/.venv" ]; then
    echo "Activating virtual environment: ${SCRIPT_DIR}/.venv"
    source "${SCRIPT_DIR}/.venv/bin/activate"
else
    echo "No virtual environment found (venv/ or .venv/), using system Python."
fi

# Verify Python and dependencies
python3 -c "import paho.mqtt.client; import requests" 2>/dev/null || {
    echo "ERROR: Missing Python dependencies. Run: pip install -r requirements.txt"
    exit 1
}

# ── Run with restart-on-failure loop ──
LOG_FILE="${LOG_DIR}/bridge_$(date +%Y%m%d_%H%M%S).log"
echo "Logging to: ${LOG_FILE}"
echo ""

while true; do
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] Starting run_live_geometry.py ..." | tee -a "$LOG_FILE"

    python3 "${SCRIPT_DIR}/run_live_geometry.py" 2>&1 | tee -a "$LOG_FILE"
    EXIT_CODE=${PIPESTATUS[0]}

    if [ "$EXIT_CODE" -eq 0 ]; then
        echo "[$(date '+%Y-%m-%d %H:%M:%S')] Process exited cleanly (code 0). Stopping." | tee -a "$LOG_FILE"
        break
    fi

    echo "[$(date '+%Y-%m-%d %H:%M:%S')] Process exited with code ${EXIT_CODE}. Restarting in ${RESTART_DELAY}s ..." | tee -a "$LOG_FILE"
    sleep "$RESTART_DELAY"
done
