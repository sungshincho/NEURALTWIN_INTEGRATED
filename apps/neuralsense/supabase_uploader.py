"""
supabase_uploader.py — Upload NeuralSense zone_assignments.jsonl to Supabase Edge Function.

Reads JSONL data, transforms fields to NeuralsensePayload format, and POSTs
to the `process-neuralsense-data` Edge Function in batches with retry logic.

Usage (standalone):
    python supabase_uploader.py output/zone_assignments.jsonl

Or integrate into the live pipeline via add_reading() / flush().
"""

import json
import logging
import os
import sys
import time
import threading
from datetime import datetime, timezone
from pathlib import Path

try:
    import requests
except ImportError:
    sys.exit(
        "ERROR: 'requests' package is required. Install with: pip install requests"
    )

import config

# ---------------------------------------------------------------------------
# Logging
# ---------------------------------------------------------------------------
logger = logging.getLogger("supabase_uploader")
logger.setLevel(logging.DEBUG)

_handler = logging.StreamHandler(sys.stdout)
_handler.setFormatter(
    logging.Formatter("[%(asctime)s] %(levelname)s %(name)s: %(message)s")
)
logger.addHandler(_handler)

# ---------------------------------------------------------------------------
# Constants
# ---------------------------------------------------------------------------
FIRMWARE_VERSION = "1.0.0"
NODE_ID = "neuralsense-laptop"
DATA_TYPE = "wifi"

# Zone code prefix — zones_dim stores zone_code as 'NS001' .. 'NS019'
ZONE_CODE_PREFIX = "NS"


# ---------------------------------------------------------------------------
# SupabaseUploader
# ---------------------------------------------------------------------------
class SupabaseUploader:
    """Batched uploader for NeuralSense data to Supabase Edge Function."""

    def __init__(self):
        self.supabase_url = config.SUPABASE_URL
        self.supabase_anon_key = config.SUPABASE_ANON_KEY
        self.store_id = config.STORE_ID
        self.org_id = config.ORG_ID
        self.enable_upload = config.ENABLE_UPLOAD
        self.batch_size = config.UPLOAD_BATCH_SIZE
        self.interval_sec = config.UPLOAD_INTERVAL_SEC
        self.max_retries = config.UPLOAD_MAX_RETRIES

        # Validate required settings
        missing = []
        if not self.supabase_url:
            missing.append("SUPABASE_URL")
        if not self.supabase_anon_key:
            missing.append("SUPABASE_ANON_KEY")
        if not self.store_id:
            missing.append("STORE_ID")
        if not self.org_id:
            missing.append("ORG_ID")
        if missing:
            logger.warning(
                "Missing environment variables: %s — uploads will fail",
                ", ".join(missing),
            )

        # Internal state
        self._zone_mapping: dict[int, str] = {}
        self._buffer: list[dict] = []
        self._lock = threading.Lock()

        # Output paths
        self._output_dir = config.OUTPUT_DIR
        self._failed_path = os.path.join(self._output_dir, "failed_uploads.jsonl")

    # ------------------------------------------------------------------
    # Zone mapping: int zone_id -> UUID
    # ------------------------------------------------------------------
    def fetch_zone_mapping(self) -> dict[int, str]:
        """Fetch zones_dim from Supabase REST API and build int->UUID map."""
        url = (
            "{}/rest/v1/zones_dim"
            "?store_id=eq.{}"
            "&zone_code=like.{}*"
            "&is_active=eq.true"
            "&select=id,zone_code"
        ).format(self.supabase_url, self.store_id, ZONE_CODE_PREFIX)

        headers = {
            "apikey": self.supabase_anon_key,
            "Authorization": "Bearer {}".format(self.supabase_anon_key),
            "Accept": "application/json",
        }

        try:
            resp = requests.get(url, headers=headers, timeout=15)
            resp.raise_for_status()
            rows = resp.json()
        except requests.RequestException as exc:
            logger.error("Failed to fetch zone mapping: %s", exc)
            return {}

        mapping: dict[int, str] = {}
        for row in rows:
            zone_code = row.get("zone_code", "")
            zone_uuid = row.get("id", "")
            suffix = zone_code.replace(ZONE_CODE_PREFIX, "")
            try:
                zone_int = int(suffix)
            except ValueError:
                logger.warning("Unexpected zone_code format '%s', skipping", zone_code)
                continue
            mapping[zone_int] = zone_uuid

        logger.info(
            "Zone mapping loaded: %d zones (e.g. %s)",
            len(mapping),
            dict(list(mapping.items())[:3]),
        )
        self._zone_mapping = mapping
        return mapping

    # ------------------------------------------------------------------
    # Transform a single JSONL record -> NeuralsenseReading
    # ------------------------------------------------------------------
    def transform_reading(self, jsonl_line: dict) -> dict | None:
        """Convert one zone_assignments.jsonl record to NeuralsenseReading.

        Field mapping:
            ts (Unix float)    -> timestamp (ISO 8601)
            phone_id           -> hashed_mac (colons removed)
            zone_id (int)      -> zone_id (UUID from zones_dim)
            confidence         -> estimated_position.confidence
            x, y               -> estimated_position.x, estimated_position.y
            vector             -> rssi_readings
        """
        # timestamp
        ts = jsonl_line.get("ts")
        if ts is None:
            logger.warning("Record missing 'ts', skipping")
            return None
        timestamp = datetime.fromtimestamp(float(ts), tz=timezone.utc).isoformat()

        # hashed_mac (remove colons)
        phone_id = jsonl_line.get("phone_id", "")
        hashed_mac = phone_id.replace(":", "").lower()
        if not hashed_mac:
            logger.warning("Record missing 'phone_id', skipping")
            return None

        # zone_id int -> UUID
        zone_int = jsonl_line.get("zone_id")
        zone_uuid = None
        if zone_int is not None:
            zone_uuid = self._zone_mapping.get(int(zone_int))
            if zone_uuid is None:
                logger.warning("No UUID mapping for zone_id=%s, skipping", zone_int)
                return None

        # rssi_readings
        rssi_readings = jsonl_line.get("vector", {})

        # estimated_position
        confidence = jsonl_line.get("confidence")
        x = jsonl_line.get("x")
        y = jsonl_line.get("y")
        estimated_position = None
        if confidence is not None and x is not None and y is not None:
            estimated_position = {
                "x": x,
                "y": y,
                "confidence": float(confidence),
            }

        reading: dict = {
            "timestamp": timestamp,
            "hashed_mac": hashed_mac,
            "rssi_readings": rssi_readings,
        }
        if estimated_position is not None:
            reading["estimated_position"] = estimated_position
        if zone_uuid is not None:
            reading["zone_id"] = zone_uuid

        # Optional fields
        session_id = jsonl_line.get("session_id")
        if session_id is not None:
            reading["session_id"] = session_id

        return reading

    # ------------------------------------------------------------------
    # Build the full NeuralsensePayload
    # ------------------------------------------------------------------
    def build_payload(self, readings: list[dict]) -> dict:
        """Wrap a list of NeuralsenseReading dicts in a NeuralsensePayload."""
        return {
            "node_id": NODE_ID,
            "store_id": self.store_id,
            "org_id": self.org_id,
            "firmware_version": FIRMWARE_VERSION,
            "data_type": DATA_TYPE,
            "readings": readings,
        }

    # ------------------------------------------------------------------
    # HTTP POST with exponential backoff
    # ------------------------------------------------------------------
    def upload_batch(self, payload: dict) -> dict | None:
        """POST payload to process-neuralsense-data Edge Function.

        Retries up to max_retries times with exponential back-off (1s, 2s, 4s).
        """
        url = "{}/functions/v1/process-neuralsense-data".format(self.supabase_url)
        headers = {
            "Authorization": "Bearer {}".format(self.supabase_anon_key),
            "Content-Type": "application/json",
        }

        last_error = None
        for attempt in range(self.max_retries):
            try:
                resp = requests.post(url, json=payload, headers=headers, timeout=30)
                resp.raise_for_status()
                result = resp.json()
                stats = result.get("stats", {})
                logger.info(
                    "Upload OK — readings=%d, zone_events=%d, duration=%dms",
                    stats.get("total_readings", 0),
                    stats.get("zone_events_created", 0),
                    stats.get("duration_ms", 0),
                )
                return result

            except requests.RequestException as exc:
                last_error = exc
                backoff = 2 ** attempt
                logger.warning(
                    "Upload attempt %d/%d failed: %s — retrying in %ds",
                    attempt + 1, self.max_retries, exc, backoff,
                )
                time.sleep(backoff)

        logger.error("Upload failed after %d retries: %s", self.max_retries, last_error)
        return None

    # ------------------------------------------------------------------
    # Save failed readings to disk
    # ------------------------------------------------------------------
    def _save_failed(self, readings: list[dict], error_msg: str):
        """Append failed readings to output/failed_uploads.jsonl."""
        os.makedirs(self._output_dir, exist_ok=True)
        try:
            with open(self._failed_path, "a", encoding="utf-8") as f:
                record = {
                    "failed_at": datetime.now(timezone.utc).isoformat(),
                    "error": str(error_msg),
                    "reading_count": len(readings),
                    "readings": readings,
                }
                f.write(json.dumps(record, separators=(",", ":")) + "\n")
            logger.info("Saved %d failed readings to %s", len(readings), self._failed_path)
        except OSError as exc:
            logger.error("Cannot write failed uploads file: %s", exc)

    # ------------------------------------------------------------------
    # Upload an entire JSONL file in batches
    # ------------------------------------------------------------------
    def upload_file(self, filepath: str) -> dict:
        """Read a JSONL file and upload all records in batches."""
        path = Path(filepath)
        if not path.exists():
            logger.error("File not found: %s", filepath)
            return {"error": "File not found"}

        if not self._zone_mapping:
            self.fetch_zone_mapping()
            if not self._zone_mapping:
                logger.error("No zone mapping available — cannot transform records")
                return {"error": "No zone mapping available"}

        total_lines = 0
        transformed = 0
        skipped = 0
        uploaded = 0
        failed = 0
        batch: list[dict] = []

        with open(path, "r", encoding="utf-8") as f:
            for line in f:
                line = line.strip()
                if not line:
                    continue
                total_lines += 1

                try:
                    record = json.loads(line)
                except json.JSONDecodeError as exc:
                    logger.warning("Invalid JSON on line %d: %s", total_lines, exc)
                    skipped += 1
                    continue

                reading = self.transform_reading(record)
                if reading is None:
                    skipped += 1
                    continue

                transformed += 1
                batch.append(reading)

                if len(batch) >= self.batch_size:
                    payload = self.build_payload(batch)
                    result = self.upload_batch(payload)
                    if result and result.get("success"):
                        uploaded += len(batch)
                    else:
                        failed += len(batch)
                        self._save_failed(batch, result.get("error", "Unknown") if result else "No response")
                    batch = []

        # Upload remaining
        if batch:
            payload = self.build_payload(batch)
            result = self.upload_batch(payload)
            if result and result.get("success"):
                uploaded += len(batch)
            else:
                failed += len(batch)
                self._save_failed(batch, result.get("error", "Unknown") if result else "No response")

        summary = {
            "total_lines": total_lines,
            "transformed": transformed,
            "skipped": skipped,
            "uploaded": uploaded,
            "failed": failed,
        }
        logger.info("File upload complete: %s", summary)
        return summary

    # ------------------------------------------------------------------
    # Streaming API: add_reading / flush (for live pipeline integration)
    # ------------------------------------------------------------------
    def add_reading(self, reading: dict):
        """Add a raw JSONL record to the buffer. Auto-uploads when batch is full."""
        if not self.enable_upload:
            return

        transformed = self.transform_reading(reading)
        if transformed is None:
            return

        flush_batch = None
        with self._lock:
            self._buffer.append(transformed)
            if len(self._buffer) >= self.batch_size:
                flush_batch = self._buffer[:]
                self._buffer = []

        if flush_batch is not None:
            self._upload_async(flush_batch)

    def flush(self):
        """Force-upload whatever is currently in the buffer."""
        if not self.enable_upload:
            return

        with self._lock:
            batch = self._buffer[:]
            self._buffer = []

        if batch:
            self._upload_async(batch)

    def _upload_async(self, readings: list[dict]):
        """Upload a batch in a daemon thread (non-blocking)."""
        def _worker():
            payload = self.build_payload(readings)
            result = self.upload_batch(payload)
            if not (result and result.get("success")):
                self._save_failed(readings, result.get("error", "Unknown") if result else "No response")

        t = threading.Thread(target=_worker, daemon=True)
        t.start()

    # ------------------------------------------------------------------
    # Initialise
    # ------------------------------------------------------------------
    def init(self) -> bool:
        """Initialise uploader: fetch zone mapping. Returns True on success."""
        if not self.enable_upload:
            logger.info("Upload disabled (ENABLE_UPLOAD != true)")
            return False

        mapping = self.fetch_zone_mapping()
        return len(mapping) > 0


# ---------------------------------------------------------------------------
# CLI entry point
# ---------------------------------------------------------------------------
def main():
    """Upload a JSONL file from the command line."""
    if len(sys.argv) < 2:
        print("Usage: python {} <path/to/zone_assignments.jsonl>".format(sys.argv[0]))
        sys.exit(1)

    filepath = sys.argv[1]
    config.ENABLE_UPLOAD = True

    uploader = SupabaseUploader()

    logger.info("Fetching zone mapping from Supabase...")
    mapping = uploader.fetch_zone_mapping()
    if not mapping:
        logger.error("Could not load zone mapping. Check SUPABASE_URL and credentials.")
        sys.exit(1)
    logger.info("Zone mapping ready: %d zones", len(mapping))

    logger.info("Uploading file: %s", filepath)
    summary = uploader.upload_file(filepath)

    print("\n=== Upload Summary ===")
    for key, val in summary.items():
        print("  {}: {}".format(key, val))

    if summary.get("failed", 0) > 0:
        print("\nFailed readings saved to: {}".format(uploader._failed_path))
        sys.exit(1)


if __name__ == "__main__":
    main()
