import { useQuery } from "@tanstack/react-query";
import { auditApi } from "../endpoints";

export function useAudit(params?: {
  action?: string;
  resource_type?: string;
  limit?: number;
  offset?: number;
}) {
  return useQuery({
    queryKey: ["audit", params],
    queryFn: () => auditApi.list(params),
    staleTime: 10_000,
    select: (data) => data.logs, // Return just the logs array for backwards compatibility
  });
}

export function useAuditPaginated(params?: {
  action?: string;
  resource_type?: string;
  limit?: number;
  offset?: number;
}) {
  return useQuery({
    queryKey: ["audit", "paginated", params],
    queryFn: () => auditApi.list(params),
    staleTime: 10_000,
  });
}
