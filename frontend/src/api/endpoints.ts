import { apiCall } from "./client";
import { mockRoles, type RoleRow } from "../components/roles/roles.mock";
import { mockPermissions, type Permission } from "../components/permissions/permissions.mock";
import { type AccessRequest } from "../components/requests/requests.mock";
import { type AuditEvent } from "../components/audit/audit.mock";
import { mockDb } from "../store/mockDb";

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
    apiCall(() => mockDb.get().requests, { delayMs: 300 }),

  decide: async (id: string, mode: "approve" | "deny", note?: string): Promise<{ id: string; status: "approved" | "denied" }> =>
    apiCall(() => {
      const status: "approved" | "denied" = mode === "approve" ? "approved" : "denied";

      mockDb.update((db) => {
        const requests = db.requests.map((r) =>
          r.id === id ? { ...r, status } : r
        );

        const auditEvent: AuditEvent = {
          id: `evt_${Math.floor(Math.random() * 1_000_000)}`,
          ts: new Date().toISOString(),
          actor: { id: "u_admin", name: "Admin User", email: "admin@company.com" },
          action: mode === "approve" ? "approve_request" : "deny_request",
          resource: { type: "request", id },
          scope: "org:heart-artery-vein",
          ip: "10.0.2.15",
          metadata: note ? { note } : {},
        };

        const audit = [auditEvent, ...db.audit];

        return { ...db, requests, audit };
      });

      return { id, status };
    }, { delayMs: 300 }),
};

export const auditApi = {
  list: async (): Promise<AuditEvent[]> =>
    apiCall(() => mockDb.get().audit, { delayMs: 250 }),
};
