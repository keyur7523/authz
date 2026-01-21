import { useQuery } from "@tanstack/react-query";
import { rolesApi } from "../endpoints";

export function useRoles() {
  return useQuery({
    queryKey: ["roles"],
    queryFn: rolesApi.list,
    staleTime: 30_000,
  });
}

export function useRole(roleId: string) {
  return useQuery({
    queryKey: ["roles", roleId],
    queryFn: () => rolesApi.get(roleId),
    enabled: !!roleId,
    staleTime: 30_000,
  });
}
