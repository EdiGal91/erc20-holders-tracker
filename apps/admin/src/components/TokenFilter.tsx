import type { Token } from "../lib/api";

interface TokenFilterProps {
  tokens: Token[];
  selectedToken: string;
  onTokenChange: (tokenAddress: string) => void;
  isLoading: boolean;
  chains: Array<{ chainId: number; name: string; symbol: string }>;
}

export function TokenFilter({
  tokens,
  selectedToken,
  onTokenChange,
  isLoading,
  chains,
}: TokenFilterProps) {
  const getChainInfo = (chainId: number) => {
    return chains.find((chain) => chain.chainId === chainId);
  };

  if (isLoading) {
    return (
      <div className="bg-white shadow rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          Filter by Token
        </h3>
        <div className="animate-pulse">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="h-16 bg-gray-200 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <h3 className="text-lg font-medium text-gray-900 mb-4">
        Filter by Token
      </h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
        {/* All Tokens Card */}
        <button
          onClick={() => onTokenChange("")}
          className={`p-4 rounded-lg border-2 text-left transition-all duration-200 hover:shadow-md ${
            selectedToken === ""
              ? "border-indigo-500 bg-indigo-50 shadow-md"
              : "border-gray-200 bg-white hover:border-gray-300"
          }`}
        >
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
              <span className="text-gray-600 text-sm font-medium">All</span>
            </div>
            <div>
              <div className="font-medium text-gray-900">All Tokens</div>
              <div className="text-sm text-gray-500">All chains</div>
            </div>
          </div>
        </button>

        {/* Token Cards */}
        {tokens.map((token) => {
          const chainInfo = getChainInfo(token.chainId);
          return (
            <button
              key={`${token.chainId}-${token.address}`}
              onClick={() => onTokenChange(token.address)}
              className={`p-4 rounded-lg border-2 text-left transition-all duration-200 hover:shadow-md ${
                selectedToken === token.address
                  ? "border-indigo-500 bg-indigo-50 shadow-md"
                  : "border-gray-200 bg-white hover:border-gray-300"
              }`}
            >
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-bold">
                    {token.symbol.charAt(0)}
                  </span>
                </div>
                <div className="min-w-0 flex-1">
                  <div className="font-medium text-gray-900 truncate">
                    {token.symbol}
                  </div>
                  <div className="text-sm text-gray-500 truncate">
                    {chainInfo?.name || `Chain ${token.chainId}`}
                  </div>
                  {!token.enabled && (
                    <div className="text-xs text-amber-600 font-medium">
                      Disabled
                    </div>
                  )}
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
