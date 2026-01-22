import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { usersApi, userRolesApi } from "../endpoints";

export function useUsers() {
  return useQuery({
    queryKey: ["users"],
    queryFn: usersApi.list,
    staleTime: 30_000,
  });
}

export function useUserRoles(userId: string) {
  return useQuery({
    queryKey: ["user-roles", userId],
    queryFn: () => userRolesApi.getForUser(userId),
    enabled: !!userId,
    staleTime: 10_000,
  });
}

export function useAssignRole() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (vars: { userId: string; roleId: string; reason: string }) =>
      userRolesApi.assignRole(vars.userId, vars.roleId, vars.reason),
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ["user-roles", vars.userId] });
      qc.invalidateQueries({ queryKey: ["audit"] });
    },
    onError: () => {
      // High-risk assignment creates a request
      qc.invalidateQueries({ queryKey: ["requests"] });
    },
  });
}
