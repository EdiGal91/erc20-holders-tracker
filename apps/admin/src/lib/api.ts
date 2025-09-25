import axios from "axios";

const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:3000/api/v1";

export const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor for debugging
api.interceptors.request.use(
  (config) => {
    console.log(`API Request: ${config.method?.toUpperCase()} ${config.url}`);
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    console.error("API Error:", error.response?.data || error.message);
    return Promise.reject(error);
  }
);

// Chain API types
export interface Chain {
  _id: string;
  chainId: number;
  rpcUrl: string;
  confirmations: number;
  logsRange: number;
  enabled: boolean;
  name?: string;
  symbol?: string;
  explorerUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateChainRequest {
  chainId: number;
  rpcUrl: string;
  apiKey: string;
  confirmations?: number;
  logsRange?: number;
  enabled?: boolean;
  name?: string;
  symbol?: string;
  explorerUrl?: string;
}

export interface UpdateChainRequest {
  rpcUrl?: string;
  apiKey?: string;
  confirmations?: number;
  logsRange?: number;
  enabled?: boolean;
  name?: string;
  symbol?: string;
  explorerUrl?: string;
}

// Token API types
export interface Token {
  _id: string;
  chainId: number;
  address: string;
  symbol: string;
  decimals: number;
  enabled: boolean;
  name?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTokenRequest {
  chainId: number;
  address: string;
  symbol: string;
  decimals?: number;
  enabled?: boolean;
  name?: string;
}

export interface UpdateTokenRequest {
  symbol?: string;
  decimals?: number;
  enabled?: boolean;
  name?: string;
}

// Chain API functions
export const chainApi = {
  getAll: (includeDisabled = false): Promise<Chain[]> =>
    api
      .get(`/chains?includeDisabled=${includeDisabled}`)
      .then((res) => res.data),

  getById: (chainId: number): Promise<Chain> =>
    api.get(`/chains/${chainId}`).then((res) => res.data),

  create: (data: CreateChainRequest): Promise<Chain> =>
    api.post("/chains", data).then((res) => res.data),

  update: (chainId: number, data: UpdateChainRequest): Promise<Chain> =>
    api.patch(`/chains/${chainId}`, data).then((res) => res.data),

  toggleEnabled: (chainId: number): Promise<Chain> =>
    api.patch(`/chains/${chainId}/toggle`).then((res) => res.data),

  delete: (chainId: number): Promise<void> =>
    api.delete(`/chains/${chainId}`).then(() => undefined),
};

// Token API functions
export const tokenApi = {
  getAll: (includeDisabled = false, chainId?: number): Promise<Token[]> => {
    const params = new URLSearchParams();
    if (includeDisabled) params.append("includeDisabled", "true");
    if (chainId) params.append("chainId", chainId.toString());
    return api.get(`/tokens?${params.toString()}`).then((res) => res.data);
  },

  getById: (chainId: number, address: string): Promise<Token> =>
    api.get(`/tokens/${chainId}/${address}`).then((res) => res.data),

  getByChain: (chainId: number, includeDisabled = false): Promise<Token[]> =>
    api
      .get(`/tokens/chain/${chainId}?includeDisabled=${includeDisabled}`)
      .then((res) => res.data),

  getBySymbol: (symbol: string, includeDisabled = false): Promise<Token[]> =>
    api
      .get(`/tokens/symbol/${symbol}?includeDisabled=${includeDisabled}`)
      .then((res) => res.data),

  create: (data: CreateTokenRequest): Promise<Token> =>
    api.post("/tokens", data).then((res) => res.data),

  update: (
    chainId: number,
    address: string,
    data: UpdateTokenRequest
  ): Promise<Token> =>
    api.patch(`/tokens/${chainId}/${address}`, data).then((res) => res.data),

  toggleEnabled: (chainId: number, address: string): Promise<Token> =>
    api.patch(`/tokens/${chainId}/${address}/toggle`).then((res) => res.data),

  delete: (chainId: number, address: string): Promise<void> =>
    api.delete(`/tokens/${chainId}/${address}`).then(() => undefined),

  bulkUpdate: (
    tokens: { chainId: number; address: string; enabled: boolean }[]
  ): Promise<void> =>
    api.post("/tokens/bulk-update", tokens).then(() => undefined),
};
