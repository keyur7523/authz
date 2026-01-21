import { useParams } from "react-router-dom";
import { RoleHeader } from "../components/roles/RoleHeader";
import { RolePermissions } from "../components/roles/RolePermissions";
import { RoleUsers } from "../components/roles/RoleUsers";

export function RoleDetail() {
  const { roleId } = useParams();

  // Mock role data for now
  const role = {
    id: roleId!,
    name: "Admin",
    description: "Full system access",
  };

  return (
    <div className="space-y-4">
      <RoleHeader name={role.name} description={role.description} />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <RolePermissions />
        <RoleUsers />
      </div>
    </div>
  );
}
