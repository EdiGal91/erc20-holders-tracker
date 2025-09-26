export function formatBalance(balance: string, decimals: number): string {
  const balanceBigInt = BigInt(balance);
  const divisor = BigInt(10 ** decimals);
  const wholePart = balanceBigInt / divisor;
  const fractionalPart = balanceBigInt % divisor;

  // Format with commas and up to 6 decimal places
  const wholeStr = wholePart.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");

  if (fractionalPart === BigInt(0)) {
    return wholeStr;
  }

  const fractionalStr = fractionalPart.toString().padStart(decimals, "0");
  const trimmedFractional = fractionalStr.replace(/0+$/, "").slice(0, 6);

  return trimmedFractional ? `${wholeStr}.${trimmedFractional}` : wholeStr;
}

export function getExplorerUrl(explorerUrl: string, address: string): string {
  return `${explorerUrl}/address/${address}`;
}
