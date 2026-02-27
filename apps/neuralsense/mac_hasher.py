"""
mac_hasher.py — Deterministic MAC address hashing for GDPR/privacy compliance.

Hashes MAC addresses using SHA-256 with a configurable salt so that:
  - Same MAC + same salt = same hash (deterministic, session linking still works)
  - Without the salt, the original MAC cannot be recovered
  - The hash is applied at the earliest pipeline point (on_message in run_live_geometry.py)

Usage:
    from mac_hasher import get_mac_hasher

    hasher = get_mac_hasher()        # reads config from config.py / env vars
    hashed = hasher("aa:bb:cc:dd:ee:ff")
    # -> "a1b2c3d4e5f6a7b8" (16-char hex) if hashing enabled
    # -> "aa:bb:cc:dd:ee:ff" (passthrough) if hashing disabled
"""

import hashlib
import os

# ---------------------------------------------------------------------------
# Default salt for development — MUST be overridden in production via
# NEURALSENSE_MAC_SALT environment variable.
# ---------------------------------------------------------------------------
_DEV_DEFAULT_SALT = "neuraltwin-dev-salt-change-me"


def _hash_mac(mac: str, salt: str) -> str:
    """
    Deterministic SHA-256 hash of a MAC address with salt.

    Args:
        mac:  MAC address string (any format — colons, dashes, or bare hex)
        salt: Secret salt string

    Returns:
        16-character lowercase hex string (64 bits of the SHA-256 digest).
        This is sufficient for uniqueness in a retail environment while keeping
        IDs short enough for logs and debugging.
    """
    # Normalize: strip whitespace, lowercase, remove separators
    normalized = mac.strip().lower().replace(":", "").replace("-", "")
    digest = hashlib.sha256((salt + normalized).encode("utf-8")).hexdigest()
    return digest[:16]


def _passthrough(mac: str) -> str:
    """Return the MAC unchanged (for development / calibration mode)."""
    return mac


def get_mac_hasher(enabled: bool | None = None, salt: str | None = None):
    """
    Factory that returns a callable ``hasher(mac) -> str``.

    Parameters are resolved in order:
      1. Explicit arguments (enabled, salt)
      2. config.py values (imported lazily to avoid circular imports)
      3. Environment variables directly
      4. Defaults (disabled, dev salt)

    Returns:
        A function  ``(mac: str) -> str``  that either hashes or passes through.
    """
    # Resolve 'enabled'
    if enabled is None:
        try:
            import config as _cfg
            enabled = getattr(_cfg, "MAC_HASH_ENABLED", False)
        except ImportError:
            enabled = os.getenv("NEURALSENSE_MAC_HASH_ENABLED", "false").lower() == "true"

    if not enabled:
        return _passthrough

    # Resolve 'salt'
    if salt is None:
        try:
            import config as _cfg
            salt = getattr(_cfg, "MAC_SALT", "") or ""
        except ImportError:
            salt = ""
        if not salt:
            salt = os.getenv("NEURALSENSE_MAC_SALT", "")
        if not salt:
            salt = _DEV_DEFAULT_SALT

    # Return a closure that captures the resolved salt
    def _hasher(mac: str) -> str:
        return _hash_mac(mac, salt)

    return _hasher
