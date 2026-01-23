// Re-export OrgMember type from API
import { type OrgMember } from "../../api/endpoints";

export type { OrgMember };

// Extended type for table display
export type User = {
  id: string;
  name: string;
  email: string;
  status: "active" | "suspended";
};

// Helper to convert API OrgMember to User for table display
export function toUser(member: OrgMember): User {
  return {
    id: member.user_id,
    name: member.name,
    email: member.email,
    status: "active", // OrgMember doesn't have status, assume active
  };
}

export const mockUsers: User[] = [
  { id: "u1", name: "Ava Chen", email: "ava@company.com", status: "active" },
  { id: "u2", name: "Noah Patel", email: "noah@company.com", status: "active" },
  { id: "u3", name: "Mia Rivera", email: "mia@company.com", status: "active" },
  { id: "u4", name: "Ethan Kim", email: "ethan@company.com", status: "active" },
];
