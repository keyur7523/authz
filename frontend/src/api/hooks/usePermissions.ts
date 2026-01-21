import { useQuery } from "@tanstack/react-query";
import { permissionsApi } from "../endpoints";

export function usePermissions() {
  return useQuery({
    queryKey: ["permissions"],
    queryFn: permissionsApi.list,
    staleTime: 30_000,
  });
}
