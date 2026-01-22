export type User = {
    id: string;
    name: string;
    email: string;
    status: "active" | "suspended";
  };
  
  export const mockUsers: User[] = [
    { id: "u1", name: "Ava Chen", email: "ava@company.com", status: "active" },
    { id: "u2", name: "Noah Patel", email: "noah@company.com", status: "active" },
    { id: "u3", name: "Mia Rivera", email: "mia@company.com", status: "active" },
    { id: "u4", name: "Ethan Kim", email: "ethan@company.com", status: "active" },
  ];
  