import { mockRequests, type AccessRequest } from "../components/requests/requests.mock";
import { mockAudit, type AuditEvent } from "../components/audit/audit.mock";

type Db = {
  requests: AccessRequest[];
  audit: AuditEvent[];
  rolePermissions: Record<string, string[]>;
};

const KEY = "authz_mock_db_v1";

const defaultRolePermissions: Record<string, string[]> = {
  role_admin: ["p_roles_read", "p_roles_write", "p_users_read", "p_users_write", "p_audit_read"],
  role_dev: ["p_roles_read", "p_users_read", "p_policy_eval"],
  role_viewer: ["p_roles_read", "p_users_read", "p_audit_read"],
  role_approver: ["p_roles_read", "p_audit_read"],
};

function load(): Db {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) {
      return {
        requests: mockRequests,
        audit: mockAudit,
        rolePermissions: defaultRolePermissions,
      };
    }
    const db = JSON.parse(raw) as Partial<Db>;
    return {
      requests: db.requests ?? mockRequests,
      audit: db.audit ?? mockAudit,
      rolePermissions: db.rolePermissions ?? defaultRolePermissions,
    };
  } catch {
    return {
      requests: mockRequests,
      audit: mockAudit,
      rolePermissions: defaultRolePermissions,
    };
  }
}

function save(db: Db) {
  localStorage.setItem(KEY, JSON.stringify(db));
}

export const mockDb = {
  get(): Db {
    return load();
  },

  set(next: Db) {
    save(next);
  },

  update(fn: (db: Db) => Db) {
    const current = load();
    const next = fn(current);
    save(next);
  },
};
