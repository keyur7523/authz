export type AccessRequest = {
    id: string;
    requester: { name: string; email: string };
    roleId: string;
    roleName: string;
    scope: string; // org / project / env
    reason: string;
    createdAt: string; // ISO
    status: "pending" | "approved" | "denied";
    risk: "low" | "medium" | "high";
  };
  
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
    {
      id: "req_1002",
      requester: { name: "Noah Patel", email: "noah@company.com" },
      roleId: "role_dev",
      roleName: "Developer",
      scope: "project:authz-ui",
      reason: "Needs deploy + config access",
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(),
      status: "pending",
      risk: "medium",
    },
    {
      id: "req_1003",
      requester: { name: "Mia Rivera", email: "mia@company.com" },
      roleId: "role_viewer",
      roleName: "Viewer",
      scope: "org:heart-artery-vein",
      reason: "Audit visibility",
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 30).toISOString(),
      status: "approved",
      risk: "low",
    },
    {
      id: "req_1004",
      requester: { name: "Ethan Kim", email: "ethan@company.com" },
      roleId: "role_approver",
      roleName: "Approver",
      scope: "org:heart-artery-vein",
      reason: "Coverage for PTO",
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 72).toISOString(),
      status: "denied",
      risk: "medium",
    },
  ];
  