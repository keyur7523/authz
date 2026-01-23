// Re-export AccessRequest type from API
import { type AccessRequest as ApiAccessRequest } from "../../api/endpoints";

export type { ApiAccessRequest };

// Extended type for table display (with computed fields for UI)
export type AccessRequest = {
  id: string;
  requester: { name: string; email: string };
  roleId: string;
  roleName: string;
  scope: string;
  reason: string;
  createdAt: string;
  status: "pending" | "approved" | "denied" | "cancelled" | "expired" | "info_requested";
  risk: "low" | "medium" | "high";
};

// Helper to convert API AccessRequest to display AccessRequest
export function toAccessRequest(req: ApiAccessRequest, roleName?: string): AccessRequest {
  return {
    id: req.id,
    requester: {
      name: req.requester_id, // Would need to fetch user name separately
      email: req.requester_id,
    },
    roleId: req.requested_role_id ?? "",
    roleName: roleName ?? req.requested_role_id ?? "Unknown",
    scope: req.resource_id ?? "org",
    reason: req.justification,
    createdAt: req.created_at,
    status: req.status,
    risk: "medium", // Would need logic to determine risk
  };
}

export const mockRequests: AccessRequest[] = [
  {
    id: "req_1001",
    requester: { name: "Ava Chen", email: "ava@company.com" },
    roleId: "role_admin",
    roleName: "Admin",
    scope: "org:heart-artery-vein",
    reason: "On-call incident response access",
    createdAt: new Date(Date.now() - 1000 * 60 * 25).toISOString(),
    status: "pending",
    risk: "high",
  },
];
