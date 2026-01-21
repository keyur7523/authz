export type Permission = {
    id: string;        // stable internal id
    key: string;       // e.g. "roles.write"
    description: string;
    service: "authz" | "admin" | "audit";
    risk: "low" | "medium" | "high";
  };
  
  export const mockPermissions: Permission[] = [
    { id: "p_roles_read", key: "roles.read", description: "View roles", service: "admin", risk: "low" },
    { id: "p_roles_write", key: "roles.write", description: "Create/update roles", service: "admin", risk: "high" },
    { id: "p_users_read", key: "users.read", description: "View users", service: "admin", risk: "low" },
    { id: "p_users_write", key: "users.write", description: "Manage users", service: "admin", risk: "high" },
    { id: "p_audit_read", key: "audit.read", description: "View audit logs", service: "audit", risk: "medium" },
    { id: "p_policy_eval", key: "policy.evaluate", description: "Evaluate policies", service: "authz", risk: "medium" },
  ];
  