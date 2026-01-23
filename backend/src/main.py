from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from src.config import settings
from src.core.exceptions import AppError
from src.api.rate_limit import UserRateLimitMiddleware
from src.api.routes import (
    auth,
    orgs,
    roles,
    permissions,
    users,
    policies,
    authorize,
    requests,
    audit,
    websocket,
    dashboard,
    oauth,
)

app = FastAPI(
    title="AuthZ Backend",
    description="Authorization platform with RBAC, policies, and approval workflows",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Rate limiting (100 requests per minute per user/IP)
app.add_middleware(UserRateLimitMiddleware, requests_per_minute=100, window_seconds=60)


@app.exception_handler(AppError)
async def app_error_handler(request: Request, exc: AppError):
    return JSONResponse(
        status_code=exc.status_code,
        content={"detail": exc.message},
    )


@app.get("/health")
async def health_check():
    return {"status": "healthy"}


# Auth routes
app.include_router(auth.router, prefix=settings.API_PREFIX)
app.include_router(oauth.router, prefix=settings.API_PREFIX)

# Organization routes
app.include_router(orgs.router, prefix=settings.API_PREFIX)

# RBAC routes
app.include_router(roles.router, prefix=settings.API_PREFIX)
app.include_router(permissions.router, prefix=settings.API_PREFIX)
app.include_router(users.router, prefix=settings.API_PREFIX)

# Policy routes
app.include_router(policies.router, prefix=settings.API_PREFIX)
app.include_router(authorize.router, prefix=settings.API_PREFIX)

# Workflow routes
app.include_router(requests.router, prefix=settings.API_PREFIX)

# Audit routes
app.include_router(audit.router, prefix=settings.API_PREFIX)

# Dashboard routes
app.include_router(dashboard.router, prefix=settings.API_PREFIX)

# WebSocket routes (no prefix)
app.include_router(websocket.router)
