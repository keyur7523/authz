import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { rolePermissionsApi } from "../endpoints";

export function useAllRolePermissions() {
  return useQuery({
    queryKey: ["role-permissions-all"],
    queryFn: rolePermissionsApi.getAll,
    staleTime: 10_000,
  });
}

export function useRolePermissions(roleId: string) {
  return useQuery({
    queryKey: ["role-permissions", roleId],
    queryFn: () => rolePermissionsApi.getForRole(roleId),
    enabled: !!roleId,
    staleTime: 10_000,
  });
}

export function useSaveRolePermissions(roleId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (vars: { permissionIds: string[]; note?: string }) =>
      rolePermissionsApi.setForRole(roleId, vars.permissionIds, vars.note),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["role-permissions", roleId] });
      qc.invalidateQueries({ queryKey: ["audit"] });
    },
  });
}
