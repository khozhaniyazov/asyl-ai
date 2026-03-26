"""Rate limiting using in-memory store (Redis optional)."""

from collections import defaultdict
from datetime import datetime, timezone
from fastapi import HTTPException, Request
from app.core.config import settings
from typing import Optional

# In-memory rate limit store (works without Redis, sufficient for single-process)
_rate_store: dict[str, list[float]] = defaultdict(list)


def reset_rate_limits():
    """Reset all rate limits. Used in tests."""
    _rate_store.clear()


# Try to import Redis, use in-memory fallback if not available
_redis_client = None

try:
    import redis.asyncio as aioredis

    async def _get_redis():
        global _redis_client
        if _redis_client is None:
            try:
                _redis_client = aioredis.from_url(
                    settings.REDIS_URL, decode_responses=True
                )
                await _redis_client.ping()
            except Exception:
                _redis_client = None
        return _redis_client

except ImportError:

    async def _get_redis():
        return None


async def check_rate_limit(
    key: str, max_attempts: int, window_seconds: int
) -> tuple[bool, int]:
    """
    Check if rate limit is exceeded.
    Returns (is_allowed, remaining_attempts).
    Uses Redis if available, falls back to in-memory.
    """
    r = await _get_redis()

    if r is not None:
        try:
            current = await r.get(key)
            if current is None:
                await r.setex(key, window_seconds, 1)
                return True, max_attempts - 1

            count = int(current)
            if count >= max_attempts:
                return False, 0

            await r.incr(key)
            return True, max_attempts - count - 1
        except Exception:
            pass  # Fall through to in-memory

    # In-memory fallback
    now = datetime.now(timezone.utc).timestamp()
    cutoff = now - window_seconds
    _rate_store[key] = [t for t in _rate_store[key] if t > cutoff]

    if len(_rate_store[key]) >= max_attempts:
        return False, 0

    _rate_store[key].append(now)
    return True, max_attempts - len(_rate_store[key])


async def rate_limit_login(request: Request) -> None:
    """Rate limit login attempts by IP."""
    client_ip = request.client.host if request.client else "unknown"
    key = f"rate_limit:login:{client_ip}"

    allowed, remaining = await check_rate_limit(
        key, settings.RATE_LIMIT_LOGIN_MAX, settings.RATE_LIMIT_LOGIN_WINDOW
    )

    if not allowed:
        raise HTTPException(
            status_code=429,
            detail="Too many login attempts. Please try again later.",
        )


async def rate_limit_otp(phone: str) -> None:
    """Rate limit OTP requests by phone number."""
    key = f"rate_limit:otp:{phone}"

    allowed, remaining = await check_rate_limit(
        key, settings.RATE_LIMIT_OTP_MAX, settings.RATE_LIMIT_OTP_WINDOW
    )

    if not allowed:
        raise HTTPException(
            status_code=429,
            detail="Too many OTP requests. Please try again later.",
        )
