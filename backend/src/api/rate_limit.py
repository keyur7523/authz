import time
from collections import defaultdict
from typing import Callable
from fastapi import Request
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import Response

from src.core.security import decode_token


class UserRateLimitMiddleware(BaseHTTPMiddleware):
    """
    Rate limiter based on authenticated user ID.
    Falls back to IP-based limiting for unauthenticated requests.
    """

    def __init__(
        self,
        app,
        requests_per_minute: int = 100,
        window_seconds: int = 60,
    ):
        super().__init__(app)
        self.requests_per_minute = requests_per_minute
        self.window_seconds = window_seconds
        self.request_counts: dict[str, list[tuple[float, int]]] = defaultdict(list)
        self._last_sweep = time.time()

    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        # Skip rate limiting for health check
        if request.url.path == "/health":
            return await call_next(request)

        # Try to get user ID from authorization header
        identifier = self._get_identifier(request)
        current_time = time.time()

        # Clean old entries
        self._cleanup_old_entries(identifier, current_time)

        # Count requests in current window
        request_count = sum(count for _, count in self.request_counts[identifier])

        if request_count >= self.requests_per_minute:
            return Response(
                content='{"detail": "Rate limit exceeded. Try again later."}',
                status_code=429,
                media_type="application/json",
                headers={
                    "Retry-After": str(self.window_seconds),
                    "X-RateLimit-Limit": str(self.requests_per_minute),
                    "X-RateLimit-Remaining": "0",
                },
            )

        # Add current request
        self.request_counts[identifier].append((current_time, 1))

        response = await call_next(request)

        # Add rate limit headers
        remaining = max(0, self.requests_per_minute - request_count - 1)
        response.headers["X-RateLimit-Limit"] = str(self.requests_per_minute)
        response.headers["X-RateLimit-Remaining"] = str(remaining)

        return response

    def _get_identifier(self, request: Request) -> str:
        """Get user ID from a valid JWT or fall back to IP."""
        auth_header = request.headers.get("Authorization", "")
        if auth_header.startswith("Bearer "):
            try:
                user_id = decode_token(auth_header[7:]).get("sub")
            except Exception:
                user_id = None
            if user_id:
                return f"user:{user_id}"

        # Render's proxy appends the real client IP last; earlier entries are client-controlled
        forwarded_for = request.headers.get("X-Forwarded-For")
        if forwarded_for:
            return f"ip:{forwarded_for.split(',')[-1].strip()}"
        return f"ip:{request.client.host if request.client else 'unknown'}"

    def _cleanup_old_entries(self, identifier: str, current_time: float):
        """Remove entries older than the window, and idle identifiers entirely."""
        cutoff = current_time - self.window_seconds
        if current_time - self._last_sweep > self.window_seconds:
            self._last_sweep = current_time
            for key in [k for k, v in self.request_counts.items() if not v or v[-1][0] <= cutoff]:
                del self.request_counts[key]
        recent = [(ts, count) for ts, count in self.request_counts.get(identifier, []) if ts > cutoff]
        if recent:
            self.request_counts[identifier] = recent
        else:
            self.request_counts.pop(identifier, None)
