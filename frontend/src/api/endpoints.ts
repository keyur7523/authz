import { apiGet, apiPost, apiPut, apiDelete } from "./client";

// Types
export type Role = {
  id: string;
  org_id: string;
  name: string;
  description: string | null;
  is_system: boolean;
  created_at: string;
  updated_at: string;
  permissions: { id: string; name: string; description: string | null }[];
};

export type Permission = {
  id: string;
  org_id: string;
  name: string;
  description: string | null;
  created_at: string;
};

export type AccessRequest = {
  id: string;
  org_id: string;
  requester_id: string;
  requested_role_id: string | null;
  requested_permission: string | null;
  resource_id: string | null;
  justification: string;
  status: "pending" | "approved" | "denied" | "cancelled" | "expired";
  duration_hours: number | null;
  expires_at: string | null;
  resolved_at: string | null;
  created_at: string;
  updated_at: string;
  approval_actions: {
    id: string;
    request_id: string;
    approver_id: string;
    action: string;
    comment: string | null;
    created_at: string;
  }[];
};

export type AuditLog = {
  id: string;
  org_id: string;
  actor_id: string | null;
  actor_email: string | null;
  action: string;
  resource_type: string;
  resource_id: string | null;
  details: Record<string, unknown> | null;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
};

export type User = {
  id: string;
  email: string;
  name: string;
  avatar_url: string | null;
  is_active: boolean;
  created_at: string;
};

export type OrgMember = {
  user_id: string;
  email: string;
  name: string;
  role: string;
  joined_at: string;
};

export type UserRole = {
  id: string;
  user_id: string;
  role_id: string;
  org_id: string;
  assigned_by: string | null;
  assigned_at: string;
};

// Helper to get current org ID (you may want to store this in state)
let currentOrgId: string | null = null;

export function setCurrentOrgId(orgId: string) {
  currentOrgId = orgId;
  localStorage.setItem("current_org_id", orgId);
}

export function getCurrentOrgId(): string | null {
  if (!currentOrgId) {
    currentOrgId = localStorage.getItem("current_org_id");
  }
  return currentOrgId;
}

function orgPath(path: string): string {
  const orgId = getCurrentOrgId();
  if (!orgId) throw { message: "No organization selected", status: 400 };
  return `/orgs/${orgId}${path}`;
}

// Roles API
export const rolesApi = {
  list: async (): Promise<Role[]> => apiGet<Role[]>(orgPath("/roles")),

  get: async (roleId: string): Promise<Role> =>
    apiGet<Role>(orgPath(`/roles/${roleId}`)),

  create: async (data: { name: string; description?: string }): Promise<Role> =>
    apiPost<Role>(orgPath("/roles"), data),

  update: async (
    roleId: string,
    data: { name?: string; description?: string }
  ): Promise<Role> => apiPut<Role>(orgPath(`/roles/${roleId}`), data),

  delete: async (roleId: string): Promise<void> =>
    apiDelete<void>(orgPath(`/roles/${roleId}`)),

  addPermissions: async (
    roleId: string,
    permissionIds: string[]
  ): Promise<void> =>
    apiPost<void>(orgPath(`/roles/${roleId}/permissions`), {
      permission_ids: permissionIds,
    }),

  removePermission: async (
    roleId: string,
    permissionId: string
  ): Promise<void> =>
    apiDelete<void>(orgPath(`/roles/${roleId}/permissions/${permissionId}`)),
};

// Permissions API
export const permissionsApi = {
  list: async (): Promise<Permission[]> =>
    apiGet<Permission[]>(orgPath("/permissions")),

  create: async (data: {
    name: string;
    description?: string;
  }): Promise<Permission> => apiPost<Permission>(orgPath("/permissions"), data),

  delete: async (permissionId: string): Promise<void> =>
    apiDelete<void>(orgPath(`/permissions/${permissionId}`)),
};

// Users API (org members)
export const usersApi = {
  list: async (): Promise<OrgMember[]> =>
    apiGet<OrgMember[]>(orgPath("/members")),
};

// User Roles API
export const userRolesApi = {
  getForUser: async (userId: string): Promise<UserRole[]> =>
    apiGet<UserRole[]>(orgPath(`/users/${userId}/roles`)),

  getPermissions: async (
    userId: string
  ): Promise<{ user_id: string; org_id: string; permissions: string[] }> =>
    apiGet(orgPath(`/users/${userId}/permissions`)),

  assignRole: async (
    userId: string,
    roleId: string
  ): Promise<UserRole> =>
    apiPost<UserRole>(orgPath(`/users/${userId}/roles`), { role_id: roleId }),

  revokeRole: async (userId: string, roleId: string): Promise<void> =>
    apiDelete<void>(orgPath(`/users/${userId}/roles/${roleId}`)),
};

// Access Requests API
export const requestsApi = {
  list: async (): Promise<AccessRequest[]> =>
    apiGet<AccessRequest[]>(orgPath("/requests")),

  listPending: async (): Promise<{ requests: AccessRequest[]; total: number }> =>
    apiGet(orgPath("/requests/pending")),

  listAll: async (status?: string): Promise<AccessRequest[]> =>
    apiGet<AccessRequest[]>(
      orgPath(`/requests/all${status ? `?status=${status}` : ""}`)
    ),

  get: async (requestId: string): Promise<AccessRequest> =>
    apiGet<AccessRequest>(orgPath(`/requests/${requestId}`)),

  submit: async (data: {
    requested_role_id?: string;
    requested_permission?: string;
    resource_id?: string;
    justification: string;
    duration_hours?: number;
  }): Promise<AccessRequest> => apiPost<AccessRequest>(orgPath("/requests"), data),

  approve: async (
    requestId: string,
    comment?: string
  ): Promise<AccessRequest> =>
    apiPost<AccessRequest>(orgPath(`/requests/${requestId}/approve`), {
      comment,
    }),

  deny: async (requestId: string, comment?: string): Promise<AccessRequest> =>
    apiPost<AccessRequest>(orgPath(`/requests/${requestId}/deny`), { comment }),

  cancel: async (requestId: string): Promise<AccessRequest> =>
    apiPost<AccessRequest>(orgPath(`/requests/${requestId}/cancel`), {}),
};

// Audit API
export const auditApi = {
  list: async (params?: {
    action?: string;
    resource_type?: string;
    actor_id?: string;
    start_date?: string;
    end_date?: string;
    limit?: number;
    offset?: number;
  }): Promise<{ logs: AuditLog[]; total: number; limit: number; offset: number }> => {
    const searchParams = new URLSearchParams();
    if (params?.action) searchParams.set("action", params.action);
    if (params?.resource_type) searchParams.set("resource_type", params.resource_type);
    if (params?.actor_id) searchParams.set("actor_id", params.actor_id);
    if (params?.start_date) searchParams.set("start_date", params.start_date);
    if (params?.end_date) searchParams.set("end_date", params.end_date);
    if (params?.limit) searchParams.set("limit", params.limit.toString());
    if (params?.offset) searchParams.set("offset", params.offset.toString());

    const query = searchParams.toString();
    return apiGet(orgPath(`/audit${query ? `?${query}` : ""}`));
  },

  export: async (format: "json" | "csv" = "json"): Promise<string> => {
    const orgId = getCurrentOrgId();
    if (!orgId) throw { message: "No organization selected", status: 400 };

    const response = await fetch(
      `http://localhost:8000/api/orgs/${orgId}/audit/export?format=${format}`,
      {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("access_token")}`,
        },
      }
    );
    return response.text();
  },
};

// Policies API
export const policiesApi = {
  list: async (activeOnly = false): Promise<Policy[]> =>
    apiGet<Policy[]>(orgPath(`/policies${activeOnly ? "?active_only=true" : ""}`)),

  get: async (policyId: string): Promise<Policy> =>
    apiGet<Policy>(orgPath(`/policies/${policyId}`)),

  create: async (data: PolicyCreateInput): Promise<Policy> =>
    apiPost<Policy>(orgPath("/policies"), data),

  update: async (policyId: string, data: Partial<PolicyCreateInput>): Promise<Policy> =>
    apiPut<Policy>(orgPath(`/policies/${policyId}`), data),

  delete: async (policyId: string): Promise<void> =>
    apiDelete<void>(orgPath(`/policies/${policyId}`)),

  test: async (data: {
    principal_id: string;
    action: string;
    resource: string;
    context?: Record<string, unknown>;
  }): Promise<{ allowed: boolean; matched_policy: string | null; effect: string | null; reason: string }> =>
    apiPost(orgPath("/policies/test"), data),
};

export type Policy = {
  id: string;
  org_id: string;
  name: string;
  description: string | null;
  effect: "allow" | "deny";
  principals: { roles: string[]; users: string[] };
  actions: string[];
  resources: string[];
  conditions: Record<string, unknown> | null;
  is_active: boolean;
  priority: number;
  created_at: string;
  updated_at: string;
};

export type PolicyCreateInput = {
  name: string;
  description?: string;
  effect: "allow" | "deny";
  principals?: { roles: string[]; users: string[] };
  actions: string[];
  resources: string[];
  conditions?: Record<string, unknown>;
  priority?: number;
};

// Role Permissions API (for managing permissions assigned to roles)
export const rolePermissionsApi = {
  getAll: async (): Promise<Record<string, string[]>> => {
    // Get all roles and build a map of roleId -> permissionIds
    const roles = await rolesApi.list();
    const result: Record<string, string[]> = {};
    for (const role of roles) {
      result[role.id] = role.permissions.map((p) => p.id);
    }
    return result;
  },

  getForRole: async (roleId: string): Promise<string[]> => {
    const role = await rolesApi.get(roleId);
    return role.permissions.map((p) => p.id);
  },

  setForRole: async (
    roleId: string,
    permissionIds: string[],
    _note?: string
  ): Promise<{ roleId: string; permissionIds: string[] }> => {
    // Get current permissions
    const role = await rolesApi.get(roleId);
    const currentIds = new Set(role.permissions.map((p) => p.id));
    const newIds = new Set(permissionIds);

    // Remove permissions that are no longer in the list
    for (const id of currentIds) {
      if (!newIds.has(id)) {
        await rolesApi.removePermission(roleId, id);
      }
    }

    // Add new permissions
    const toAdd = permissionIds.filter((id) => !currentIds.has(id));
    if (toAdd.length > 0) {
      await rolesApi.addPermissions(roleId, toAdd);
    }

    return { roleId, permissionIds };
  },
};

// Organizations API
export const orgsApi = {
  list: async (): Promise<{ id: string; name: string; slug: string; role: string }[]> =>
    apiGet("/orgs"),

  get: async (orgId: string): Promise<{ id: string; name: string; slug: string; created_at: string; updated_at: string }> =>
    apiGet(`/orgs/${orgId}`),

  create: async (data: { name: string; slug: string }): Promise<{ id: string; name: string; slug: string; role: string }> =>
    apiPost("/orgs", data),

  getMembers: async (orgId: string): Promise<OrgMember[]> =>
    apiGet(`/orgs/${orgId}/members`),
};
