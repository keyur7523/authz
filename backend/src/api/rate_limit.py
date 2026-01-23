import time
from collections import defaultdict
from typing import Callable
from fastapi import Request, HTTPException
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import Response


class RateLimitMiddleware(BaseHTTPMiddleware):
    """
    Simple in-memory rate limiter.
    Limits requests per IP address.
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
        # Store: {ip: [(timestamp, count), ...]}
        self.request_counts: dict[str, list[tuple[float, int]]] = defaultdict(list)

    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        # Skip rate limiting for health check and websocket
        if request.url.path in ["/health", "/ws/notifications"]:
            return await call_next(request)

        client_ip = self._get_client_ip(request)
        current_time = time.time()

        # Clean old entries
        self._cleanup_old_entries(client_ip, current_time)

        # Count requests in current window
        request_count = sum(count for _, count in self.request_counts[client_ip])

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
        self.request_counts[client_ip].append((current_time, 1))

        response = await call_next(request)

        # Add rate limit headers
        remaining = max(0, self.requests_per_minute - request_count - 1)
        response.headers["X-RateLimit-Limit"] = str(self.requests_per_minute)
        response.headers["X-RateLimit-Remaining"] = str(remaining)

        return response

    def _get_client_ip(self, request: Request) -> str:
        """Get client IP, considering X-Forwarded-For header."""
        forwarded_for = request.headers.get("X-Forwarded-For")
        if forwarded_for:
            # Take the first IP in the chain
            return forwarded_for.split(",")[0].strip()
        return request.client.host if request.client else "unknown"

    def _cleanup_old_entries(self, client_ip: str, current_time: float):
        """Remove entries older than the window."""
        cutoff = current_time - self.window_seconds
        self.request_counts[client_ip] = [
            (ts, count)
            for ts, count in self.request_counts[client_ip]
            if ts > cutoff
        ]


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

    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        # Skip rate limiting for health check and websocket
        if request.url.path in ["/health", "/ws/notifications"]:
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
        """Get user ID from JWT or fall back to IP."""
        auth_header = request.headers.get("Authorization", "")
        if auth_header.startswith("Bearer "):
            # Extract user ID from JWT (simple approach - just use the token hash as identifier)
            token = auth_header[7:]
            # Use first 20 chars of token as identifier (unique per user session)
            return f"token:{token[:20]}"

        # Fall back to IP
        forwarded_for = request.headers.get("X-Forwarded-For")
        if forwarded_for:
            return f"ip:{forwarded_for.split(',')[0].strip()}"
        return f"ip:{request.client.host if request.client else 'unknown'}"

    def _cleanup_old_entries(self, identifier: str, current_time: float):
        """Remove entries older than the window."""
        cutoff = current_time - self.window_seconds
        self.request_counts[identifier] = [
            (ts, count)
            for ts, count in self.request_counts[identifier]
            if ts > cutoff
        ]
