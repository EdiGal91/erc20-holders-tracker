import { useState } from "react";
import { ArrowPathIcon } from "@heroicons/react/24/outline";
import { useTokens } from "../hooks/useTokens";
import { useChains } from "../hooks/useChains";
import { useHolders } from "../hooks/useHolders";
import { TokenFilter } from "../components/TokenFilter";
import { HoldersTable } from "../components/HoldersTable";
import { Button } from "../components/ui/Button";

export function HoldersPage() {
  const [selectedToken, setSelectedToken] = useState<string>("");

  const { data: tokens = [], isLoading: tokensLoading } = useTokens(true); // Include disabled tokens
  const { data: chains = [], isLoading: chainsLoading } = useChains(true); // Include disabled chains
  const {
    data: holders = [],
    isLoading: holdersLoading,
    error,
    refetch: refetchHolders,
    isFetching: isRefetching,
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
        <div className="px-4 py-5 sm:px-6 flex justify-between items-center">
          <div>
            <h3 className="text-lg leading-6 font-medium text-gray-900">
              Top 20 Holders
            </h3>
            <p className="mt-1 max-w-2xl text-sm text-gray-500">
              Ranked by total balance (confirmed + pending)
            </p>
          </div>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => refetchHolders()}
            loading={isRefetching}
            disabled={holdersLoading}
          >
            <ArrowPathIcon className="h-4 w-4 mr-2" />
            Refresh
          </Button>
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
