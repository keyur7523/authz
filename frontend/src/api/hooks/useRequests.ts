import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { requestsApi } from "../endpoints";

export function useRequests() {
  return useQuery({
    queryKey: ["requests"],
    queryFn: requestsApi.list,
    staleTime: 10_000,
  });
}

export function useDecideRequest() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (vars: { id: string; mode: "approve" | "deny"; note?: string }) =>
      requestsApi.decide(vars.id, vars.mode, vars.note),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["requests"] });
      qc.invalidateQueries({ queryKey: ["audit"] });
    },
  });
}
