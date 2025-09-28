import type { Token } from "../lib/api";
import { CardFilter } from "./ui/CardFilter";
import type { FilterItem } from "./ui/CardFilter";

interface TokenFilterProps {
  tokens: Token[];
  selectedToken: string;
  onTokenChange: (tokenAddress: string) => void;
  isLoading: boolean;
  chains: Array<{
    chainId: number;
    name?: string;
    symbol?: string;
    enabled?: boolean;
  }>;
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

  const filterItems: FilterItem[] = tokens.map((token) => {
    const chainInfo = getChainInfo(token.chainId);
    const isChainDisabled = chainInfo?.enabled === false;

    const disabledStates = [];
    if (!token.enabled) {
      disabledStates.push({ label: "Token: Disabled", type: "error" as const });
    }
    if (isChainDisabled) {
      disabledStates.push({
        label: "Chain: Disabled",
        type: "warning" as const,
      });
    }

    return {
      id: token.address,
      title: token.symbol,
      subtitle: chainInfo?.name || `Chain ${token.chainId}`,
      iconBg: "bg-gradient-to-br from-indigo-500 to-purple-600",
      iconText: token.symbol.charAt(0),
      disabledStates: disabledStates.length > 0 ? disabledStates : undefined,
    };
  });

  return (
    <CardFilter
      title="Filter by Token"
      items={filterItems}
      selectedValue={selectedToken}
      onSelectionChange={onTokenChange}
      isLoading={isLoading}
      allOption={{
        title: "All Tokens",
        subtitle: "All chains",
        value: "",
      }}
      loadingSkeletonCount={8}
    />
  );
}
