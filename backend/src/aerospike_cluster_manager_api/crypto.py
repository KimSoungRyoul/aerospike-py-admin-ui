"""Password encryption utilities using Fernet symmetric encryption."""

from __future__ import annotations

import base64
import hashlib
import logging

from cryptography.fernet import Fernet, InvalidToken

from aerospike_cluster_manager_api import config

logger = logging.getLogger(__name__)

_ENCRYPTED_PREFIX = "enc::"


def _get_fernet() -> Fernet | None:
    key = config.ENCRYPTION_KEY
    if not key:
        return None
    # Derive a valid 32-byte Fernet key from an arbitrary secret string
    derived = hashlib.sha256(key.encode()).digest()
    return Fernet(base64.urlsafe_b64encode(derived))


def encrypt_password(plaintext: str | None) -> str | None:
    """Encrypt a password. Returns the original value if no key is configured."""
    if plaintext is None:
        return None
    fernet = _get_fernet()
    if fernet is None:
        return plaintext
    token = fernet.encrypt(plaintext.encode()).decode()
    return f"{_ENCRYPTED_PREFIX}{token}"


def decrypt_password(stored: str | None) -> str | None:
    """Decrypt a password. Handles both encrypted and legacy plaintext values."""
    if stored is None:
        return None
    if not stored.startswith(_ENCRYPTED_PREFIX):
        # Legacy plaintext — return as-is
        return stored
    fernet = _get_fernet()
    if fernet is None:
        logger.warning("ENCRYPTION_KEY not set but found encrypted password; returning None")
        return None
    try:
        token = stored[len(_ENCRYPTED_PREFIX) :]
        return fernet.decrypt(token.encode()).decode()
    except InvalidToken:
        logger.error("Failed to decrypt password — key mismatch or corrupted data")
        return None
