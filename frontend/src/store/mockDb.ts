import { mockRequests, type AccessRequest } from "../components/requests/requests.mock";
import { mockAudit, type AuditEvent } from "../components/audit/audit.mock";

type Db = {
  requests: AccessRequest[];
  audit: AuditEvent[];
};

const KEY = "authz_mock_db_v1";

function load(): Db {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return { requests: mockRequests, audit: mockAudit };
    return JSON.parse(raw) as Db;
  } catch {
    return { requests: mockRequests, audit: mockAudit };
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
