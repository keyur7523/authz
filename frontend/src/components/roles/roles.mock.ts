// Re-export Role type from API and add display helpers
import { type Role } from "../../api/endpoints";

export type { Role };

// Extended type for table display (computed from Role)
export type RoleRow = {
  id: string;
  name: string;
  description: string | null;
  permissionsCount: number;
  usersCount: number;
  status: "active" | "expired";
};

// Helper to convert API Role to RoleRow for table display
export function toRoleRow(role: Role): RoleRow {
  return {
    id: role.id,
    name: role.name,
    description: role.description,
    permissionsCount: role.permissions?.length ?? 0,
    usersCount: 0, // Would need separate API call to get user count
    status: "active", // All roles are active by default
  };
}

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
];
