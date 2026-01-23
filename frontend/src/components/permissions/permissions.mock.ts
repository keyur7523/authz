import { type Permission as ApiPermission } from "../../api/endpoints";
export type { ApiPermission };

export type Permission = {
    id: string;        // stable internal id
    key: string;       // e.g. "roles.write"
    description: string;
    service: "authz" | "admin" | "audit";
    risk: "low" | "medium" | "high";
  };

export function toPermission(p: ApiPermission): Permission {
  // Determine service based on permission name pattern
  const service = p.name.startsWith("audit")
    ? "audit"
    : p.name.startsWith("policy")
    ? "authz"
    : "admin";

  // Determine risk based on write/delete actions
  const risk = p.name.includes("write") || p.name.includes("delete")
    ? "high"
    : p.name.includes("evaluate")
    ? "medium"
    : "low";

  return {
    id: p.id,
    key: p.name,
    description: p.description ?? "",
    service,
    risk,
  };
}

  export const mockPermissions: Permission[] = [
    { id: "p_roles_read", key: "roles.read", description: "View roles", service: "admin", risk: "low" },
    { id: "p_roles_write", key: "roles.write", description: "Create/update roles", service: "admin", risk: "high" },
    { id: "p_users_read", key: "users.read", description: "View users", service: "admin", risk: "low" },
    { id: "p_users_write", key: "users.write", description: "Manage users", service: "admin", risk: "high" },
    { id: "p_audit_read", key: "audit.read", description: "View audit logs", service: "audit", risk: "medium" },
    { id: "p_policy_eval", key: "policy.evaluate", description: "Evaluate policies", service: "authz", risk: "medium" },
  ];
  