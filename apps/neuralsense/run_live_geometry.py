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

# MAC address hashing for GDPR/privacy (Decision #7)
from mac_hasher import get_mac_hasher
_hash_mac = get_mac_hasher()

# Supabase upload integration (optional, toggled by ENABLE_UPLOAD)
_uploader = None
try:
    import config as _cfg
    if _cfg.ENABLE_UPLOAD:
        from supabase_uploader import SupabaseUploader
        _uploader = SupabaseUploader()
except Exception:
    _uploader = None

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
OUT_UNCERTAIN = os.path.join(OUT_DIR, "uncertain_assignments.jsonl")

WINDOW_SEC = 5
MIN_SOURCES = 8
MATCH_DIFF_DBM = 7.0

# Per-Pi freshness gating
PER_PI_FRESH_SEC = 3.0

# Improvement A: Top-2 margin gating — skip ambiguous predictions
MARGIN_GATE = 0.15

# Improvement D: Rank-order composite scoring (device-independent)
RANK_WEIGHT = 0.4
L1_WEIGHT = 0.6
RANK_MATCH_THRESHOLD = 1.5

# Transition debounce — require N consecutive confident predictions for new zone
# (NOT hysteresis — no stickiness, just confirmation counting)
TRANSITION_CONFIRM_COUNT = 3

# Session linking — handle randomized MACs in production
STALE_MAC_SEC = 30.0            # MAC considered gone after 30s of silence
SESSION_RANK_THRESHOLD = 1.5    # max avg rank distance to link sessions
SESSION_CLEANUP_INTERVAL = 100  # cleanup old sessions every N assignments
SESSION_MAX_AGE_SEC = 3600.0    # remove sessions not seen in 1 hour

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

# --- Improvement B: Weighted distance metric ---

def compute_pi_weights(cal):
    """Precompute per-zone, per-Pi reliability weights from calibration variance.
    Low std -> high weight (reliable), high std -> low weight (noisy).
    Weights clamped to [0.2, 1.0].
    """
    zone_weights = {}
    for zid, rec in cal.items():
        vectors = rec.get("vectors", [])
        if not vectors:
            continue
        # Collect all Pi IDs across vectors
        all_pis = set()
        for v in vectors:
            all_pis.update(v.keys())

        weights = {}
        for pi in all_pis:
            vals = [float(v[pi]) for v in vectors if pi in v]
            if len(vals) < 2:
                weights[pi] = 0.5
                continue
            mean = sum(vals) / len(vals)
            var = sum((x - mean) ** 2 for x in vals) / len(vals)
            std = var ** 0.5
            # Map std to weight: std=0 -> 1.0, std>=10 -> 0.2
            w = max(0.2, min(1.0, 1.0 - (std / 12.5)))
            weights[pi] = round(w, 3)
        zone_weights[zid] = weights
    return zone_weights

def weighted_avg_diff(live_norm, cal_norm, weights=None):
    """Weighted L1 distance. Falls back to uniform weights if none provided."""
    common = [p for p in live_norm if p in cal_norm]
    if not common:
        return float("inf")
    if weights is None:
        return sum(abs(float(live_norm[p]) - float(cal_norm[p])) for p in common) / float(len(common))
    total_w = 0.0
    total_d = 0.0
    for p in common:
        w = weights.get(p, 0.5)
        total_w += w
        total_d += w * abs(float(live_norm[p]) - float(cal_norm[p]))
    return total_d / total_w if total_w > 0 else float("inf")

# --- Improvement D: Rank-order composite scoring ---

def rank_vector(norm_vec, pi_order=None):
    """Convert RSSI vector to rank ordering (rank 0 = strongest Pi)."""
    if pi_order is None:
        pi_order = sorted(norm_vec.keys())
    # Sort by RSSI descending (strongest first)
    sorted_pis = sorted(norm_vec.keys(), key=lambda p: -float(norm_vec[p]))
    ranks = {}
    for rank, pi in enumerate(sorted_pis):
        ranks[pi] = rank
    return ranks

def rank_distance(live_ranks, cal_ranks):
    """Average absolute rank difference over common Pis."""
    common = [p for p in live_ranks if p in cal_ranks]
    if not common:
        return float("inf")
    return sum(abs(live_ranks[p] - cal_ranks[p]) for p in common) / float(len(common))

def composite_match(live_norm, cal_norm, weights=None):
    """Blend L1 match with rank-order match.
    Returns True if the vector is a composite match.
    """
    l1 = weighted_avg_diff(live_norm, cal_norm, weights)
    l1_match = 1.0 if l1 <= MATCH_DIFF_DBM else 0.0

    live_ranks = rank_vector(live_norm)
    cal_ranks = rank_vector(cal_norm)
    rd = rank_distance(live_ranks, cal_ranks)
    rank_match = 1.0 if rd <= RANK_MATCH_THRESHOLD else 0.0

    score = L1_WEIGHT * l1_match + RANK_WEIGHT * rank_match
    return score

def score_top_two_zones(live_norm, cal, pi_weights=None):
    """Score all zones and return top-2: (best_zone, best_conf, second_zone, second_conf)."""
    scores = []
    for zid, rec in cal.items():
        vectors = rec.get("vectors", [])
        if not vectors:
            continue
        zid_int = int(zid)
        w = pi_weights.get(zid_int) if pi_weights else None
        total_score = 0.0
        for v in vectors:
            total_score += composite_match(live_norm, v, w)
        conf = total_score / float(len(vectors))
        scores.append((zid_int, conf))

    if not scores:
        return None, 0.0, None, 0.0

    scores.sort(key=lambda x: -x[1])
    best_zone, best_conf = scores[0]
    if len(scores) > 1:
        second_zone, second_conf = scores[1]
    else:
        second_zone, second_conf = None, 0.0

    return best_zone, float(best_conf), second_zone, float(second_conf)

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

    # Improvement B: precompute per-zone per-Pi weights from calibration variance
    pi_weights = compute_pi_weights(cal)

    print("LIVE MODE STARTED (rx-time, normalized matching, NO hysteresis)")
    print("MIN_SOURCES =", MIN_SOURCES)
    print("WINDOW_SEC  =", WINDOW_SEC)
    print("PER_PI_FRESH_SEC =", PER_PI_FRESH_SEC)
    print("MATCH_DIFF_DBM (normalized) =", MATCH_DIFF_DBM)
    print("MARGIN_GATE =", MARGIN_GATE)
    print("RANK_WEIGHT =", RANK_WEIGHT, "| L1_WEIGHT =", L1_WEIGHT)
    print("TRANSITION_CONFIRM_COUNT =", TRANSITION_CONFIRM_COUNT)
    print("STALE_MAC_SEC =", STALE_MAC_SEC)
    print("Broker:", MQTT_HOST, "Topic:", MQTT_TOPIC)
    # Report MAC hashing status
    try:
        import config as _mcfg
        _mac_hash_on = getattr(_mcfg, "MAC_HASH_ENABLED", False)
    except ImportError:
        _mac_hash_on = False
    print("MAC_HASH_ENABLED =", _mac_hash_on)
    print("Zones loaded:", len(zones), "| Cal zones:", len(cal))

    # Supabase uploader init
    global _uploader
    upload_enabled = False
    if _uploader is not None:
        upload_enabled = _uploader.init()
        if upload_enabled:
            print("SUPABASE UPLOAD: ENABLED (batch={}, interval={}s)".format(
                _uploader.batch_size, _uploader.interval_sec))
        else:
            print("SUPABASE UPLOAD: DISABLED (init failed or ENABLE_UPLOAD=false)")
            _uploader = None
    else:
        print("SUPABASE UPLOAD: DISABLED")

    last_flush_ts = [time.time()]

    buf = defaultdict(lambda: deque())

    # Transition state — keyed by session_id
    state = {}      # session_id -> (zone_id, enter_ts)
    pending = {}    # session_id -> (candidate_zone, count, first_ts)

    # Session linking for randomized MACs
    next_sid = [1]          # mutable counter for closure
    mac_to_sid = {}         # MAC -> session_id
    sid_last_seen = {}      # session_id -> (ts, norm_vector)
    mac_last_seen_ts = {}   # MAC -> last seen timestamp
    assign_count = [0]      # periodic cleanup counter

    def resolve_session(phone, live_norm, now_ts):
        """Resolve a MAC address to a stable session_id.
        If the MAC is new and a recently-stale session has a matching RSSI
        signature, link them (handles MAC randomization).
        """
        mac_last_seen_ts[phone] = now_ts

        # Known MAC — return existing session
        if phone in mac_to_sid:
            sid = mac_to_sid[phone]
            sid_last_seen[sid] = (now_ts, live_norm)
            return sid

        # New MAC — try to match against stale sessions
        best_sid = None
        best_dist = float("inf")
        stale_cutoff = now_ts - STALE_MAC_SEC
        checked_sids = set()

        for old_mac, old_sid in mac_to_sid.items():
            if old_sid in checked_sids:
                continue
            old_ts = mac_last_seen_ts.get(old_mac, 0)
            if old_ts > stale_cutoff:
                continue  # still active, skip
            checked_sids.add(old_sid)
            old_info = sid_last_seen.get(old_sid)
            if old_info is None:
                continue
            old_vec = old_info[1]
            live_ranks = rank_vector(live_norm)
            old_ranks = rank_vector(old_vec)
            dist = rank_distance(live_ranks, old_ranks)
            if dist < best_dist:
                best_dist = dist
                best_sid = old_sid

        if best_sid is not None and best_dist <= SESSION_RANK_THRESHOLD:
            mac_to_sid[phone] = best_sid
            sid_last_seen[best_sid] = (now_ts, live_norm)
            print("[SESSION] Linked MAC {} -> {} (rank_dist={:.2f})".format(
                phone[:8] + "...", best_sid, best_dist))
            return best_sid

        # No match — create new session
        sid = "S{:04d}".format(next_sid[0])
        next_sid[0] += 1
        mac_to_sid[phone] = sid
        sid_last_seen[sid] = (now_ts, live_norm)
        print("[SESSION] New MAC {} -> {}".format(phone[:8] + "...", sid))
        return sid

    def cleanup_sessions(now_ts):
        """Remove sessions not seen in SESSION_MAX_AGE_SEC."""
        cutoff = now_ts - SESSION_MAX_AGE_SEC
        stale_sids = set()
        for sid, (ts, _) in list(sid_last_seen.items()):
            if ts < cutoff:
                stale_sids.add(sid)
        if not stale_sids:
            return
        for sid in stale_sids:
            sid_last_seen.pop(sid, None)
            state.pop(sid, None)
            pending.pop(sid, None)
        stale_macs = [m for m, s in mac_to_sid.items() if s in stale_sids]
        for m in stale_macs:
            del mac_to_sid[m]
            mac_last_seen_ts.pop(m, None)
            buf.pop(m, None)
        print("[SESSION] Cleaned up {} stale sessions, {} MACs".format(
            len(stale_sids), len(stale_macs)))

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

        raw_mac = str(evt.get("mac", "")).lower().strip()
        rpi_id = str(evt.get("rpi_id", "")).strip().lower()
        try:
            rssi = int(evt.get("rssi"))
        except Exception as e:
            log_error("parse_rssi", e, extra={"evt": evt})
            return

        # Apply MAC hashing at the earliest pipeline point (Decision #7 — GDPR/privacy).
        # When MAC_HASH_ENABLED=true, raw_mac is hashed before any storage or processing.
        # When disabled (default for dev), _hash_mac is a passthrough.
        phone = _hash_mac(raw_mac)

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
        best_zone, best_conf, second_zone, second_conf = score_top_two_zones(live_norm, cal, pi_weights)
        if best_zone is None:
            return

        margin = best_conf - second_conf
        x, y = zones.get(best_zone, (None, None))

        # Resolve session (handles randomized MACs)
        sid = resolve_session(phone, live_norm, rx_ts)

        # Periodic cleanup of old sessions
        assign_count[0] += 1
        if assign_count[0] % SESSION_CLEANUP_INTERVAL == 0:
            cleanup_sessions(rx_ts)

        # Improvement A: Margin gating — skip ambiguous predictions
        if margin < MARGIN_GATE:
            safe_append_jsonl(OUT_UNCERTAIN, {
                "ts": rx_ts,
                "ts_kst": ts_kst(rx_ts),
                "phone_id": phone,
                "session_id": sid,
                "zone_id": int(best_zone),
                "confidence": float(best_conf),
                "second_zone_id": int(second_zone) if second_zone is not None else None,
                "second_confidence": float(second_conf),
                "margin": round(margin, 4),
                "sources": sources,
                "vector": raw_vec,
                "timebase": "rx_time_laptop"
            })
            return

        # Log assignment (confident prediction)
        assignment = {
            "ts": rx_ts,
            "ts_kst": ts_kst(rx_ts),
            "phone_id": phone,
            "session_id": sid,
            "zone_id": int(best_zone),
            "x": x,
            "y": y,
            "confidence": float(best_conf),
            "second_zone_id": int(second_zone) if second_zone is not None else None,
            "second_confidence": float(second_conf),
            "margin": round(margin, 4),
            "sources": sources,
            "vector": raw_vec,
            "timebase": "rx_time_laptop"
        }
        safe_append_jsonl(OUT_ASSIGN, assignment)

        # Supabase upload: feed assignment to uploader buffer (non-blocking)
        if _uploader is not None:
            try:
                _uploader.add_reading(assignment)
                # Periodic flush based on interval
                now = time.time()
                if now - last_flush_ts[0] >= _uploader.interval_sec:
                    _uploader.flush()
                    last_flush_ts[0] = now
            except Exception as e:
                log_error("supabase_upload", e)

        # --- Transitions/dwells with debounce (keyed by session_id) ---

        # First time seeing this session
        if sid not in state:
            state[sid] = (int(best_zone), rx_ts)
            pending.pop(sid, None)
            safe_append_jsonl(OUT_TRANS, {
                "ts": rx_ts, "ts_kst": ts_kst(rx_ts),
                "phone_id": phone, "session_id": sid,
                "from_zone": None,
                "to_zone": int(best_zone),
                "confidence": float(best_conf)
            })
            return

        prev_zone, enter_ts = state[sid]

        if prev_zone == int(best_zone):
            # Same zone as confirmed — clear any pending transition (spike resolved)
            pending.pop(sid, None)
            return

        # Different zone — debounce: require TRANSITION_CONFIRM_COUNT consecutive
        p = pending.get(sid)
        if p is not None and p[0] == int(best_zone):
            # Same candidate as pending — increment
            count = p[1] + 1
            if count >= TRANSITION_CONFIRM_COUNT:
                # Confirmed transition
                safe_append_jsonl(OUT_DWELL, {
                    "phone_id": phone, "session_id": sid,
                    "zone_id": int(prev_zone),
                    "enter_ts": float(enter_ts),
                    "enter_ts_kst": ts_kst(float(enter_ts)),
                    "exit_ts": p[2],
                    "exit_ts_kst": ts_kst(p[2]),
                    "dwell_sec": p[2] - float(enter_ts)
                })
                safe_append_jsonl(OUT_TRANS, {
                    "ts": rx_ts, "ts_kst": ts_kst(rx_ts),
                    "phone_id": phone, "session_id": sid,
                    "from_zone": int(prev_zone),
                    "to_zone": int(best_zone),
                    "confidence": float(best_conf)
                })
                state[sid] = (int(best_zone), p[2])
                del pending[sid]
            else:
                pending[sid] = (int(best_zone), count, p[2])
        else:
            # New candidate (or different from current pending) — start counting
            pending[sid] = (int(best_zone), 1, rx_ts)

    client = mqtt.Client(client_id="laptop-live-nohyst")
    client.on_connect = on_connect
    client.on_message = on_message
    client.reconnect_delay_set(min_delay=1, max_delay=10)
    client.enable_logger()
    client.connect(MQTT_HOST, MQTT_PORT, keepalive=30)

    try:
        client.loop_forever(retry_first_connection=True)
    except KeyboardInterrupt:
        print("\n[SHUTDOWN] Stopping...")
    finally:
        # Flush any remaining upload buffer on exit
        if _uploader is not None:
            print("[SHUTDOWN] Flushing upload buffer...")
            try:
                _uploader.flush()
                time.sleep(2)  # allow async uploads to complete
            except Exception as e:
                log_error("shutdown_flush", e)
        client.disconnect()
        print("[SHUTDOWN] Done.")

if __name__ == "__main__":
    main()
