import { useParams } from "react-router-dom";
import { RoleHeader } from "../components/roles/RoleHeader";
import { RolePermissionsEditor } from "../components/roles/RolePermissionsEditor";
import { RoleUsers } from "../components/roles/RoleUsers";
import { QueryState } from "../components/ui/QueryState";
import { useRole } from "../api/hooks/useRoles";

export function RoleDetail() {
  const { roleId } = useParams();
  const roleQuery = useRole(roleId ?? "");

  const role = roleQuery.data;

  return (
    <QueryState
      isLoading={roleQuery.isLoading}
      isError={roleQuery.isError}
      error={roleQuery.error}
      onRetry={() => roleQuery.refetch()}
    >
      {role && (
        <div className="space-y-4">
          <RoleHeader name={role.name} description={role.description} />

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <RolePermissionsEditor roleId={roleId!} />
            <RoleUsers />
          </div>
        </div>
      )}
    </QueryState>
  );
}
