import { useQuery } from "@tanstack/react-query";
import { auditApi } from "../endpoints";

export function useAudit() {
  return useQuery({
    queryKey: ["audit"],
    queryFn: auditApi.list,
    staleTime: 10_000,
  });
}
