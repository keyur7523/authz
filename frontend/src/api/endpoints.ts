import { apiCall } from "./client";
import { mockRoles, type RoleRow } from "../components/roles/roles.mock";
import { mockPermissions, type Permission } from "../components/permissions/permissions.mock";
import { mockRequests, type AccessRequest } from "../components/requests/requests.mock";
import { mockAudit, type AuditEvent } from "../components/audit/audit.mock";

export const rolesApi = {
  list: async (): Promise<RoleRow[]> =>
    apiCall(() => mockRoles, { delayMs: 300 }),

  get: async (roleId: string): Promise<RoleRow | null> =>
    apiCall(() => mockRoles.find((r) => r.id === roleId) ?? null, { delayMs: 250 }),
};

export const permissionsApi = {
  list: async (): Promise<Permission[]> =>
    apiCall(() => mockPermissions, { delayMs: 350 }),
};

export const requestsApi = {
  list: async (): Promise<AccessRequest[]> =>
    apiCall(() => mockRequests, { delayMs: 350 }),

  decide: async (id: string, mode: "approve" | "deny"): Promise<{ id: string; status: "approved" | "denied" }> =>
    apiCall(() => ({ id, status: mode === "approve" ? "approved" : "denied" }), { delayMs: 300 }),
};

export const auditApi = {
  list: async (): Promise<AuditEvent[]> =>
    apiCall(() => mockAudit, { delayMs: 300 }),
};
