import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  tokenApi,
  type Token,
  type CreateTokenRequest,
  type UpdateTokenRequest,
} from "../lib/api";

export const TOKENS_QUERY_KEY = "tokens";

export const useTokens = (includeDisabled = false, chainId?: number) => {
  return useQuery({
    queryKey: [TOKENS_QUERY_KEY, "all", includeDisabled, chainId],
    queryFn: () => tokenApi.getAll(includeDisabled, chainId),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const useToken = (chainId: number, address: string) => {
  return useQuery({
    queryKey: [TOKENS_QUERY_KEY, "detail", chainId, address],
    queryFn: () => tokenApi.getById(chainId, address),
    enabled: !!chainId && !!address,
    staleTime: 5 * 60 * 1000,
  });
};

export const useTokensByChain = (chainId: number, includeDisabled = false) => {
  return useQuery({
    queryKey: [TOKENS_QUERY_KEY, "byChain", chainId, includeDisabled],
    queryFn: () => tokenApi.getByChain(chainId, includeDisabled),
    enabled: !!chainId,
    staleTime: 5 * 60 * 1000,
  });
};

export const useTokensBySymbol = (symbol: string, includeDisabled = false) => {
  return useQuery({
    queryKey: [TOKENS_QUERY_KEY, "bySymbol", symbol, includeDisabled],
    queryFn: () => tokenApi.getBySymbol(symbol, includeDisabled),
    enabled: !!symbol,
    staleTime: 5 * 60 * 1000,
  });
};

export const useEnabledTokens = (chainId?: number) => {
  return useQuery({
    queryKey: [TOKENS_QUERY_KEY, "enabled", chainId],
    queryFn: () => tokenApi.getAll(false, chainId), // false = only enabled tokens
    staleTime: 5 * 60 * 1000,
  });
};

export const useCreateToken = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateTokenRequest) => tokenApi.create(data),
    onSuccess: (newToken) => {
      // Invalidate all tokens queries
      queryClient.invalidateQueries({ queryKey: [TOKENS_QUERY_KEY] });

      // Optimistically update the cache
      queryClient.setQueryData<Token[]>(
        [TOKENS_QUERY_KEY, "all", false],
        (old) => {
          if (!old) return [newToken];
          return [...old, newToken].sort((a, b) => {
            if (a.chainId !== b.chainId) return a.chainId - b.chainId;
            return a.symbol.localeCompare(b.symbol);
          });
        }
      );
    },
    onError: (error) => {
      console.error("Failed to create token:", error);
    },
  });
};

export const useUpdateToken = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      chainId,
      address,
      data,
    }: {
      chainId: number;
      address: string;
      data: UpdateTokenRequest;
    }) => tokenApi.update(chainId, address, data),
    onSuccess: (updatedToken) => {
      // Invalidate all tokens queries
      queryClient.invalidateQueries({ queryKey: [TOKENS_QUERY_KEY] });

      // Update specific token in cache
      queryClient.setQueryData<Token>(
        [
          TOKENS_QUERY_KEY,
          "detail",
          updatedToken.chainId,
          updatedToken.address,
        ],
        updatedToken
      );

      // Update token in all tokens list
      queryClient.setQueryData<Token[]>(
        [TOKENS_QUERY_KEY, "all", false],
        (old) => {
          if (!old) return [updatedToken];
          return old.map((token) =>
            token.chainId === updatedToken.chainId &&
            token.address === updatedToken.address
              ? updatedToken
              : token
          );
        }
      );
    },
    onError: (error) => {
      console.error("Failed to update token:", error);
    },
  });
};

export const useToggleTokenEnabled = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ chainId, address }: { chainId: number; address: string }) =>
      tokenApi.toggleEnabled(chainId, address),
    onSuccess: (updatedToken) => {
      // Invalidate all tokens queries
      queryClient.invalidateQueries({ queryKey: [TOKENS_QUERY_KEY] });

      // Update specific token in cache
      queryClient.setQueryData<Token>(
        [
          TOKENS_QUERY_KEY,
          "detail",
          updatedToken.chainId,
          updatedToken.address,
        ],
        updatedToken
      );
    },
    onError: (error) => {
      console.error("Failed to toggle token enabled status:", error);
    },
  });
};

export const useDeleteToken = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ chainId, address }: { chainId: number; address: string }) =>
      tokenApi.delete(chainId, address),
    onSuccess: (_, { chainId, address }) => {
      // Invalidate all tokens queries
      queryClient.invalidateQueries({ queryKey: [TOKENS_QUERY_KEY] });

      // Remove token from cache
      queryClient.removeQueries({
        queryKey: [TOKENS_QUERY_KEY, "detail", chainId, address],
      });

      // Remove from all tokens list
      queryClient.setQueryData<Token[]>(
        [TOKENS_QUERY_KEY, "all", false],
        (old) => {
          if (!old) return [];
          return old.filter(
            (token) => !(token.chainId === chainId && token.address === address)
          );
        }
      );
    },
    onError: (error) => {
      console.error("Failed to delete token:", error);
    },
  });
};

export const useBulkUpdateTokens = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (
      tokens: { chainId: number; address: string; enabled: boolean }[]
    ) => tokenApi.bulkUpdate(tokens),
    onSuccess: () => {
      // Invalidate all tokens queries to refresh the data
      queryClient.invalidateQueries({ queryKey: [TOKENS_QUERY_KEY] });
    },
    onError: (error) => {
      console.error("Failed to bulk update tokens:", error);
    },
  });
};
