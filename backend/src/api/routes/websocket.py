from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Query
from jose import jwt, JWTError

from src.config import settings
from src.services.notification_service import manager

router = APIRouter(tags=["websocket"])


@router.websocket("/ws/notifications")
async def websocket_endpoint(
    websocket: WebSocket,
    token: str = Query(...),
    org_id: str = Query(...),
):
    """
    WebSocket endpoint for real-time notifications.

    Connect with: ws://host/ws/notifications?token=<jwt>&org_id=<org_id>

    Events emitted:
    - request.new: New access request submitted (admins only)
    - request.resolved: Access request resolved (requester only)
    - pending_count: Updated pending request count (admins only)
    - role.assigned: Role assigned to user
    - role.revoked: Role revoked from user
    """
    # Validate token
    try:
        payload = jwt.decode(
            token, settings.JWT_SECRET, algorithms=[settings.JWT_ALGORITHM]
        )
        if payload.get("type") != "access":
            await websocket.close(code=4001, reason="Invalid token type")
            return
        user_id = payload.get("sub")
        if not user_id:
            await websocket.close(code=4001, reason="Invalid token")
            return
    except JWTError:
        await websocket.close(code=4001, reason="Invalid token")
        return

    # Connect
    await manager.connect(websocket, org_id, user_id)

    try:
        # Send connection confirmation
        await websocket.send_json({
            "type": "connected",
            "data": {"user_id": user_id, "org_id": org_id},
        })

        # Keep connection alive and handle incoming messages
        while True:
            data = await websocket.receive_text()
            # Handle ping/pong for keepalive
            if data == "ping":
                await websocket.send_text("pong")

    except WebSocketDisconnect:
        manager.disconnect(websocket, org_id, user_id)
    except Exception:
        manager.disconnect(websocket, org_id, user_id)


@router.get("/ws/health")
async def websocket_health():
    """Get WebSocket connection statistics."""
    return {
        "total_connections": manager.get_connection_count(),
        "status": "healthy",
    }
