import { type AuditLog } from "../../api/endpoints";
export type { AuditLog };

export type AuditEvent = {
    id: string;
    ts: string; // ISO
    actor: { id: string; name: string; email: string };
    action: "authorize" | "assign_permission" | "revoke_permission" | "approve_request" | "deny_request" | string;
    resource: { type: "role" | "permission" | "request" | "policy" | string; id: string };
    decision?: "allow" | "deny";
    scope: string; // org/project/env
    ip?: string;
    userAgent?: string;
    metadata?: Record<string, string>;
  };

export function toAuditEvent(log: AuditLog): AuditEvent {
  // Extract decision from details if it's an authorization action
  const decision = log.details?.decision as "allow" | "deny" | undefined;

  return {
    id: log.id,
    ts: log.created_at,
    actor: {
      id: log.actor_id ?? "system",
      name: log.actor_email?.split("@")[0] ?? "System",
      email: log.actor_email ?? "",
    },
    action: log.action,
    resource: {
      type: log.resource_type,
      id: log.resource_id ?? "",
    },
    decision,
    scope: `org:${log.org_id}`,
    ip: log.ip_address ?? undefined,
    userAgent: log.user_agent ?? undefined,
    metadata: log.details as Record<string, string> | undefined,
  };
}
