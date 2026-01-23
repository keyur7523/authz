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

  export const mockAudit: AuditEvent[] = [
    {
      id: "evt_2001",
      ts: new Date(Date.now() - 1000 * 60 * 8).toISOString(),
      actor: { id: "u_admin", name: "Admin User", email: "admin@company.com" },
      action: "approve_request",
      resource: { type: "request", id: "req_1002" },
      scope: "org:heart-artery-vein",
      ip: "10.0.2.15",
      metadata: { note: "Approved for deploy access" },
    },
    {
      id: "evt_2002",
      ts: new Date(Date.now() - 1000 * 60 * 20).toISOString(),
      actor: { id: "u_admin", name: "Admin User", email: "admin@company.com" },
      action: "assign_permission",
      resource: { type: "role", id: "role_dev" },
      scope: "project:authz-ui",
      metadata: { permission: "roles.write" },
    },
    {
      id: "evt_2003",
      ts: new Date(Date.now() - 1000 * 60 * 35).toISOString(),
      actor: { id: "u_service", name: "Policy Engine", email: "svc-authz@company.com" },
      action: "authorize",
      resource: { type: "policy", id: "pol_core" },
      decision: "allow",
      scope: "org:heart-artery-vein",
      metadata: { subject: "u1", permission: "audit.read" },
    },
    {
      id: "evt_2004",
      ts: new Date(Date.now() - 1000 * 60 * 70).toISOString(),
      actor: { id: "u_service", name: "Policy Engine", email: "svc-authz@company.com" },
      action: "authorize",
      resource: { type: "policy", id: "pol_core" },
      decision: "deny",
      scope: "org:heart-artery-vein",
      metadata: { subject: "u9", permission: "roles.write" },
    },
  ];
  