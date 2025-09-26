import { useQuery } from "@tanstack/react-query";
import { balanceApi } from "../lib/api";

export function useHolders(tokenAddress?: string) {
  return useQuery({
    queryKey: ["holders", tokenAddress],
    queryFn: () => balanceApi.getTopHolders(tokenAddress || undefined),
  });
}
