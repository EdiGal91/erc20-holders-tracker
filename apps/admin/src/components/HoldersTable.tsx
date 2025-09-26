import { ArrowTopRightOnSquareIcon } from "@heroicons/react/24/outline";
import type { Balance } from "../lib/api";
import { formatBalance, getExplorerUrl } from "../utils/format";

interface HoldersTableProps {
  holders: Balance[];
  isLoading: boolean;
  error: Error | null;
}

export function HoldersTable({ holders, isLoading, error }: HoldersTableProps) {
  if (isLoading) {
    return (
      <div className="p-6 text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
        <p className="mt-2 text-sm text-gray-500">Loading holders...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 text-center text-red-600">
        Error loading holders: {error.message}
      </div>
    );
  }

  if (holders.length === 0) {
    return (
      <div className="p-6 text-center text-gray-500">No holders found</div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Rank
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Address
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Token
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Chain
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Total Balance
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Confirmed Balance
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Pending Balance
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Block
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {holders.map((holder, index) => (
            <tr key={holder._id} className="hover:bg-gray-50">
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                #{index + 1}
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-mono text-gray-900">
                    {holder.address.slice(0, 6)}...
                    {holder.address.slice(-4)}
                  </span>
                  {holder.chainInfo?.explorerUrl && (
                    <a
                      href={getExplorerUrl(
                        holder.chainInfo.explorerUrl,
                        holder.address
                      )}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-indigo-600 hover:text-indigo-900"
                    >
                      <ArrowTopRightOnSquareIcon className="h-4 w-4" />
                    </a>
                  )}
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                {holder.tokenInfo ? (
                  <div>
                    <div className="text-sm font-medium text-gray-900">
                      {holder.tokenInfo.symbol}
                    </div>
                    <div className="text-sm text-gray-500">
                      {holder.tokenInfo.name}
                    </div>
                  </div>
                ) : (
                  <span className="text-sm text-gray-500">Unknown</span>
                )}
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                {holder.chainInfo ? (
                  <div>
                    <div className="text-sm font-medium text-gray-900">
                      {holder.chainInfo.name}
                    </div>
                    <div className="text-sm text-gray-500">
                      ID: {holder.chainId}
                    </div>
                  </div>
                ) : (
                  <span className="text-sm text-gray-500">
                    Chain {holder.chainId}
                  </span>
                )}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-mono font-bold">
                {holder.tokenInfo
                  ? formatBalance(
                      (
                        BigInt(holder.confirmed) + BigInt(holder.pending)
                      ).toString(),
                      holder.tokenInfo.decimals
                    )
                  : (
                      BigInt(holder.confirmed) + BigInt(holder.pending)
                    ).toString()}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 font-mono">
                {holder.tokenInfo
                  ? formatBalance(holder.confirmed, holder.tokenInfo.decimals)
                  : holder.confirmed}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 font-mono">
                {holder.tokenInfo
                  ? formatBalance(holder.pending, holder.tokenInfo.decimals)
                  : holder.pending}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {holder.blockNumber?.toLocaleString()}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
