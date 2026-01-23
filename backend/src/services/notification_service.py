import json
from uuid import UUID
from fastapi import WebSocket
from typing import Any


class ConnectionManager:
    """Manages WebSocket connections for real-time notifications."""

    def __init__(self):
        # Map of org_id -> list of (user_id, websocket) tuples
        self.active_connections: dict[str, list[tuple[str, WebSocket]]] = {}

    async def connect(self, websocket: WebSocket, org_id: str, user_id: str):
        """Accept and register a new WebSocket connection."""
        await websocket.accept()
        if org_id not in self.active_connections:
            self.active_connections[org_id] = []
        self.active_connections[org_id].append((user_id, websocket))

    def disconnect(self, websocket: WebSocket, org_id: str, user_id: str):
        """Remove a WebSocket connection."""
        if org_id in self.active_connections:
            self.active_connections[org_id] = [
                (uid, ws)
                for uid, ws in self.active_connections[org_id]
                if ws != websocket
            ]
            if not self.active_connections[org_id]:
                del self.active_connections[org_id]

    async def send_personal_message(self, message: dict, websocket: WebSocket):
        """Send a message to a specific WebSocket."""
        try:
            await websocket.send_json(message)
        except Exception:
            pass  # Connection may be closed

    async def broadcast_to_org(self, org_id: str, message: dict):
        """Broadcast a message to all users in an organization."""
        if org_id not in self.active_connections:
            return

        for user_id, websocket in self.active_connections[org_id]:
            try:
                await websocket.send_json(message)
            except Exception:
                pass  # Connection may be closed

    async def broadcast_to_user(self, org_id: str, user_id: str, message: dict):
        """Send a message to a specific user in an organization."""
        if org_id not in self.active_connections:
            return

        for uid, websocket in self.active_connections[org_id]:
            if uid == user_id:
                try:
                    await websocket.send_json(message)
                except Exception:
                    pass

    async def broadcast_to_admins(
        self, org_id: str, admin_ids: list[str], message: dict
    ):
        """Send a message to specific admin users in an organization."""
        if org_id not in self.active_connections:
            return

        for user_id, websocket in self.active_connections[org_id]:
            if user_id in admin_ids:
                try:
                    await websocket.send_json(message)
                except Exception:
                    pass

    def get_connection_count(self, org_id: str | None = None) -> int:
        """Get the number of active connections."""
        if org_id:
            return len(self.active_connections.get(org_id, []))
        return sum(len(conns) for conns in self.active_connections.values())


# Global connection manager instance
manager = ConnectionManager()


class NotificationService:
    """Service for sending notifications through WebSockets."""

    def __init__(self):
        self.manager = manager

    async def notify_new_request(
        self, org_id: str, request_id: str, requester_name: str, admin_ids: list[str]
    ):
        """Notify admins of a new access request."""
        message = {
            "type": "request.new",
            "data": {
                "request_id": request_id,
                "requester_name": requester_name,
                "message": f"New access request from {requester_name}",
            },
        }
        await self.manager.broadcast_to_admins(org_id, admin_ids, message)

    async def notify_request_resolved(
        self,
        org_id: str,
        request_id: str,
        requester_id: str,
        status: str,
        resolved_by: str,
    ):
        """Notify the requester that their request was resolved."""
        message = {
            "type": "request.resolved",
            "data": {
                "request_id": request_id,
                "status": status,
                "resolved_by": resolved_by,
                "message": f"Your access request was {status}",
            },
        }
        await self.manager.broadcast_to_user(org_id, requester_id, message)

    async def notify_pending_count(self, org_id: str, count: int, admin_ids: list[str]):
        """Update admins with the pending request count."""
        message = {
            "type": "pending_count",
            "data": {
                "count": count,
            },
        }
        await self.manager.broadcast_to_admins(org_id, admin_ids, message)

    async def notify_role_assigned(
        self, org_id: str, user_id: str, role_name: str, assigned_by: str
    ):
        """Notify a user that they were assigned a role."""
        message = {
            "type": "role.assigned",
            "data": {
                "role_name": role_name,
                "assigned_by": assigned_by,
                "message": f"You were assigned the role: {role_name}",
            },
        }
        await self.manager.broadcast_to_user(org_id, user_id, message)

    async def notify_role_revoked(
        self, org_id: str, user_id: str, role_name: str, revoked_by: str
    ):
        """Notify a user that their role was revoked."""
        message = {
            "type": "role.revoked",
            "data": {
                "role_name": role_name,
                "revoked_by": revoked_by,
                "message": f"Your role was revoked: {role_name}",
            },
        }
        await self.manager.broadcast_to_user(org_id, user_id, message)
