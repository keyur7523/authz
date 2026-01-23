import csv
import io
import json
from uuid import UUID
from datetime import datetime
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from fastapi import Request

from src.db.models.audit_log import AuditLog


class AuditService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def log(
        self,
        org_id: UUID,
        actor_id: UUID | None,
        action: str,
        resource_type: str,
        resource_id: str | None = None,
        details: dict | None = None,
        request: Request | None = None,
        actor_email: str | None = None,
    ) -> AuditLog:
        """Create an audit log entry."""
        ip_address = None
        user_agent = None

        if request:
            ip_address = request.client.host if request.client else None
            user_agent = request.headers.get("user-agent")

        log_entry = AuditLog(
            org_id=org_id,
            actor_id=actor_id,
            actor_email=actor_email,
            action=action,
            resource_type=resource_type,
            resource_id=resource_id,
            details=details,
            ip_address=ip_address,
            user_agent=user_agent,
        )
        self.db.add(log_entry)
        await self.db.commit()
        await self.db.refresh(log_entry)
        return log_entry

    async def query(
        self,
        org_id: UUID,
        action: str | None = None,
        resource_type: str | None = None,
        actor_id: UUID | None = None,
        start_date: datetime | None = None,
        end_date: datetime | None = None,
        limit: int = 50,
        offset: int = 0,
    ) -> tuple[list[AuditLog], int]:
        """Query audit logs with filters."""
        query = select(AuditLog).where(AuditLog.org_id == org_id)
        count_query = select(func.count(AuditLog.id)).where(AuditLog.org_id == org_id)

        if action:
            query = query.where(AuditLog.action == action)
            count_query = count_query.where(AuditLog.action == action)

        if resource_type:
            query = query.where(AuditLog.resource_type == resource_type)
            count_query = count_query.where(AuditLog.resource_type == resource_type)

        if actor_id:
            query = query.where(AuditLog.actor_id == actor_id)
            count_query = count_query.where(AuditLog.actor_id == actor_id)

        if start_date:
            query = query.where(AuditLog.created_at >= start_date)
            count_query = count_query.where(AuditLog.created_at >= start_date)

        if end_date:
            query = query.where(AuditLog.created_at <= end_date)
            count_query = count_query.where(AuditLog.created_at <= end_date)

        # Get total count
        total_result = await self.db.execute(count_query)
        total = total_result.scalar() or 0

        # Get paginated results
        query = query.order_by(AuditLog.created_at.desc()).limit(limit).offset(offset)
        result = await self.db.execute(query)
        logs = list(result.scalars().all())

        return logs, total

    async def export(
        self,
        org_id: UUID,
        format: str = "json",
        action: str | None = None,
        resource_type: str | None = None,
        actor_id: UUID | None = None,
        start_date: datetime | None = None,
        end_date: datetime | None = None,
    ) -> tuple[str, str]:
        """Export audit logs in specified format."""
        # Get all matching logs (with reasonable limit)
        logs, _ = await self.query(
            org_id=org_id,
            action=action,
            resource_type=resource_type,
            actor_id=actor_id,
            start_date=start_date,
            end_date=end_date,
            limit=10000,
            offset=0,
        )

        if format == "csv":
            return self._export_csv(logs), "text/csv"
        else:
            return self._export_json(logs), "application/json"

    def _export_json(self, logs: list[AuditLog]) -> str:
        """Export logs as JSON."""
        data = [
            {
                "id": str(log.id),
                "org_id": str(log.org_id),
                "actor_id": str(log.actor_id) if log.actor_id else None,
                "actor_email": log.actor_email,
                "action": log.action,
                "resource_type": log.resource_type,
                "resource_id": log.resource_id,
                "details": log.details,
                "ip_address": log.ip_address,
                "user_agent": log.user_agent,
                "created_at": log.created_at.isoformat(),
            }
            for log in logs
        ]
        return json.dumps(data, indent=2)

    def _export_csv(self, logs: list[AuditLog]) -> str:
        """Export logs as CSV."""
        output = io.StringIO()
        writer = csv.writer(output)

        # Header
        writer.writerow([
            "id",
            "org_id",
            "actor_id",
            "actor_email",
            "action",
            "resource_type",
            "resource_id",
            "details",
            "ip_address",
            "user_agent",
            "created_at",
        ])

        # Data
        for log in logs:
            writer.writerow([
                str(log.id),
                str(log.org_id),
                str(log.actor_id) if log.actor_id else "",
                log.actor_email or "",
                log.action,
                log.resource_type,
                log.resource_id or "",
                json.dumps(log.details) if log.details else "",
                log.ip_address or "",
                log.user_agent or "",
                log.created_at.isoformat(),
            ])

        return output.getvalue()
