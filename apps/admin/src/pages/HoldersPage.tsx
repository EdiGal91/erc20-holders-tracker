import { useState } from "react";
import { useTokens } from "../hooks/useTokens";
import { useChains } from "../hooks/useChains";
import { useHolders } from "../hooks/useHolders";
import { TokenFilter } from "../components/TokenFilter";
import { HoldersTable } from "../components/HoldersTable";

export function HoldersPage() {
  const [selectedToken, setSelectedToken] = useState<string>("");

  const { data: tokens = [], isLoading: tokensLoading } = useTokens(true); // Include disabled tokens
  const { data: chains = [], isLoading: chainsLoading } = useChains(true); // Include disabled chains
  const {
    data: holders = [],
    isLoading: holdersLoading,
    error,
  } = useHolders(selectedToken);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Top Holders</h1>
        <p className="mt-2 text-sm text-gray-700">
          View the top token holders across all chains
        </p>
      </div>

      <TokenFilter
        tokens={tokens}
        selectedToken={selectedToken}
        onTokenChange={setSelectedToken}
        isLoading={tokensLoading || chainsLoading}
        chains={chains}
      />

      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        <div className="px-4 py-5 sm:px-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900">
            Top 20 Holders
          </h3>
          <p className="mt-1 max-w-2xl text-sm text-gray-500">
            Ranked by total balance (confirmed + pending)
          </p>
        </div>

        <HoldersTable
          holders={holders}
          isLoading={holdersLoading}
          error={error}
        />
      </div>
    </div>
  );
}
