import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { requestsApi } from "../endpoints";

export function useRequests() {
  return useQuery({
    queryKey: ["requests"],
    queryFn: requestsApi.list,
    staleTime: 10_000,
  });
}

export function usePendingRequests() {
  return useQuery({
    queryKey: ["requests", "pending"],
    queryFn: requestsApi.listPending,
    staleTime: 10_000,
  });
}

export function useDecideRequest() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (vars: { id: string; mode: "approve" | "deny"; note?: string }) =>
      vars.mode === "approve"
        ? requestsApi.approve(vars.id, vars.note)
        : requestsApi.deny(vars.id, vars.note),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["requests"] });
      qc.invalidateQueries({ queryKey: ["audit"] });
      qc.invalidateQueries({ queryKey: ["user-roles"] });
    },
  });
}

export function useSubmitRequest() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (vars: {
      requested_role_id?: string;
      requested_permission?: string;
      justification: string;
      duration_hours?: number;
    }) => requestsApi.submit(vars),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["requests"] });
    },
  });
}

export function useCancelRequest() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (requestId: string) => requestsApi.cancel(requestId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["requests"] });
    },
  });
}
