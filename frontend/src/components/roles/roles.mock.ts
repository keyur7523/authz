export type RoleRow = {
    id: string;
    name: string;
    description: string;
    permissionsCount: number;
    usersCount: number;
    status: "active" | "expired";
  };
  
  export const mockRoles: RoleRow[] = [
    {
      id: "role_admin",
      name: "Admin",
      description: "Full system access",
      permissionsCount: 12,
      usersCount: 2,
      status: "active",
    },
    {
      id: "role_dev",
      name: "Developer",
      description: "Dev environment access",
      permissionsCount: 8,
      usersCount: 15,
      status: "active",
    },
    {
      id: "role_viewer",
      name: "Viewer",
      description: "Read-only access",
      permissionsCount: 3,
      usersCount: 45,
      status: "active",
    },
    {
      id: "role_approver",
      name: "Approver",
      description: "Can approve requests",
      permissionsCount: 5,
      usersCount: 8,
      status: "active",
    },
  ];
  