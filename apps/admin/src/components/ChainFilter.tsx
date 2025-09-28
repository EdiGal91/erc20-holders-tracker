import type { Chain } from "../lib/api";
import { CardFilter } from "./ui/CardFilter";
import type { FilterItem } from "./ui/CardFilter";

interface ChainFilterProps {
  chains: Chain[];
  selectedChainId: number | undefined;
  onChainChange: (chainId: number | undefined) => void;
  isLoading: boolean;
}

export function ChainFilter({
  chains,
  selectedChainId,
  onChainChange,
  isLoading,
}: ChainFilterProps) {
  const filterItems: FilterItem[] = chains.map((chain) => ({
    id: chain.chainId,
    title: chain.name || `Chain ${chain.chainId}`,
    subtitle: `ID: ${chain.chainId}`,
    iconBg: "bg-gradient-to-br from-blue-500 to-indigo-600",
    iconText:
      chain.symbol?.charAt(0) ||
      chain.name?.charAt(0) ||
      chain.chainId.toString().charAt(0),
    disabled: !chain.enabled,
  }));

  return (
    <CardFilter
      title="Filter by Chain"
      items={filterItems}
      selectedValue={selectedChainId}
      onSelectionChange={onChainChange}
      isLoading={isLoading}
      allOption={{
        title: "All Chains",
        subtitle: "Show all networks",
        value: undefined,
      }}
      loadingSkeletonCount={6}
    />
  );
}
