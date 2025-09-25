import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  chainApi,
  type Chain,
  type CreateChainRequest,
  type UpdateChainRequest,
} from "../lib/api";

export const CHAINS_QUERY_KEY = "chains";

export const useChains = (includeDisabled = false) => {
  return useQuery({
    queryKey: [CHAINS_QUERY_KEY, "all", includeDisabled],
    queryFn: () => chainApi.getAll(includeDisabled),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const useChain = (chainId: number) => {
  return useQuery({
    queryKey: [CHAINS_QUERY_KEY, "detail", chainId],
    queryFn: () => chainApi.getById(chainId),
    enabled: !!chainId,
    staleTime: 5 * 60 * 1000,
  });
};

export const useEnabledChains = () => {
  return useQuery({
    queryKey: [CHAINS_QUERY_KEY, "enabled"],
    queryFn: () => chainApi.getAll(false), // false = only enabled chains
    staleTime: 5 * 60 * 1000,
  });
};

export const useCreateChain = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateChainRequest) => chainApi.create(data),
    onSuccess: (newChain) => {
      // Invalidate all chains queries
      queryClient.invalidateQueries({ queryKey: [CHAINS_QUERY_KEY] });

      // Optimistically update the cache
      queryClient.setQueryData<Chain[]>(
        [CHAINS_QUERY_KEY, "all", false],
        (old) => {
          if (!old) return [newChain];
          return [...old, newChain].sort((a, b) => a.chainId - b.chainId);
        }
      );
    },
    onError: (error) => {
      console.error("Failed to create chain:", error);
    },
  });
};

export const useUpdateChain = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      chainId,
      data,
    }: {
      chainId: number;
      data: UpdateChainRequest;
    }) => chainApi.update(chainId, data),
    onSuccess: (updatedChain) => {
      // Invalidate all chains queries
      queryClient.invalidateQueries({ queryKey: [CHAINS_QUERY_KEY] });

      // Update specific chain in cache
      queryClient.setQueryData<Chain>(
        [CHAINS_QUERY_KEY, "detail", updatedChain.chainId],
        updatedChain
      );

      // Update chain in all chains list
      queryClient.setQueryData<Chain[]>(
        [CHAINS_QUERY_KEY, "all", false],
        (old) => {
          if (!old) return [updatedChain];
          return old.map((chain) =>
            chain.chainId === updatedChain.chainId ? updatedChain : chain
          );
        }
      );
    },
    onError: (error) => {
      console.error("Failed to update chain:", error);
    },
  });
};

export const useToggleChainEnabled = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (chainId: number) => chainApi.toggleEnabled(chainId),
    onSuccess: (updatedChain) => {
      // Invalidate all chains queries
      queryClient.invalidateQueries({ queryKey: [CHAINS_QUERY_KEY] });

      // Update specific chain in cache
      queryClient.setQueryData<Chain>(
        [CHAINS_QUERY_KEY, "detail", updatedChain.chainId],
        updatedChain
      );
    },
    onError: (error) => {
      console.error("Failed to toggle chain enabled status:", error);
    },
  });
};

export const useDeleteChain = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (chainId: number) => chainApi.delete(chainId),
    onSuccess: (_, chainId) => {
      // Invalidate all chains queries
      queryClient.invalidateQueries({ queryKey: [CHAINS_QUERY_KEY] });

      // Remove chain from cache
      queryClient.removeQueries({
        queryKey: [CHAINS_QUERY_KEY, "detail", chainId],
      });

      // Remove from all chains list
      queryClient.setQueryData<Chain[]>(
        [CHAINS_QUERY_KEY, "all", false],
        (old) => {
          if (!old) return [];
          return old.filter((chain) => chain.chainId !== chainId);
        }
      );
    },
    onError: (error) => {
      console.error("Failed to delete chain:", error);
    },
  });
};
