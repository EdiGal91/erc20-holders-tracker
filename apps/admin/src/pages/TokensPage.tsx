import { useState } from "react";
import { Button } from "../components/ui/Button";
import { Modal } from "../components/ui/Modal";
import { TokenForm } from "../components/forms/TokenForm";
import {
  useTokens,
  useCreateToken,
  useUpdateToken,
  useDeleteToken,
  useToggleTokenEnabled,
} from "../hooks/useTokens";
import { useEnabledChains } from "../hooks/useChains";
import type { Token, CreateTokenRequest, UpdateTokenRequest } from "../lib/api";

export function TokensPage() {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingToken, setEditingToken] = useState<Token | null>(null);
  const [includeDisabled, setIncludeDisabled] = useState(false);
  const [selectedChainId, setSelectedChainId] = useState<number | undefined>();

  const { data: chains = [] } = useEnabledChains();
  const {
    data: tokens = [],
    isLoading,
    error,
  } = useTokens(includeDisabled, selectedChainId);
  const createMutation = useCreateToken();
  const updateMutation = useUpdateToken();
  const deleteMutation = useDeleteToken();
  const toggleMutation = useToggleTokenEnabled();

  const handleCreate = (data: CreateTokenRequest) => {
    createMutation.mutate(data, {
      onSuccess: () => {
        setShowCreateModal(false);
      },
    });
  };

  const handleUpdate = (data: UpdateTokenRequest) => {
    if (!editingToken) return;

    updateMutation.mutate(
      { chainId: editingToken.chainId, address: editingToken.address, data },
      {
        onSuccess: () => {
          setEditingToken(null);
        },
      }
    );
  };

  const handleDelete = (chainId: number, address: string) => {
    if (
      confirm(
        "Are you sure you want to delete this token? This action cannot be undone."
      )
    ) {
      deleteMutation.mutate({ chainId, address });
    }
  };

  const handleToggleEnabled = (chainId: number, address: string) => {
    toggleMutation.mutate({ chainId, address });
  };

  const getChainName = (chainId: number) => {
    const chain = chains.find((c) => c.chainId === chainId);
    return chain?.name || `Chain ${chainId}`;
  };

  const getTokenExplorerUrl = (chainId: number, address: string) => {
    const chain = chains.find((c) => c.chainId === chainId);
    if (!chain?.explorerUrl) return null;
    return `${chain.explorerUrl}/token/${address}`;
  };

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-600">Error loading tokens: {error.message}</p>
      </div>
    );
  }

  return (
    <div>
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h1 className="text-2xl font-semibold text-gray-900">Tokens</h1>
          <p className="mt-2 text-sm text-gray-700">
            Manage ERC20 tokens across different blockchain networks.
          </p>
        </div>
        <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none space-x-2">
          <select
            value={selectedChainId || ""}
            onChange={(e) =>
              setSelectedChainId(
                e.target.value ? Number(e.target.value) : undefined
              )
            }
            className="rounded-md border-gray-300 text-sm"
          >
            <option value="">All Chains</option>
            {chains.map((chain) => (
              <option key={chain.chainId} value={chain.chainId}>
                {chain.name || `Chain ${chain.chainId}`}
              </option>
            ))}
          </select>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setIncludeDisabled(!includeDisabled)}
          >
            {includeDisabled ? "Hide Disabled" : "Show Disabled"}
          </Button>
          <Button onClick={() => setShowCreateModal(true)}>Add Token</Button>
        </div>
      </div>

      {isLoading ? (
        <div className="text-center py-8">
          <p className="text-gray-500">Loading tokens...</p>
        </div>
      ) : (
        <div className="mt-8 flow-root">
          <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
            <div className="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
              <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
                <table className="min-w-full divide-y divide-gray-300">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">
                        Token
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">
                        Chain
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">
                        Address
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">
                        Details
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">
                        Status
                      </th>
                      <th className="relative px-6 py-3">
                        <span className="sr-only">Actions</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {tokens.map((token) => (
                      <tr key={`${token.chainId}-${token.address}`}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {token.name || token.symbol}
                            </div>
                            <div className="text-sm text-gray-500">
                              {token.symbol}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {getChainName(token.chainId)}
                          </div>
                          <div className="text-sm text-gray-500">
                            ID: {token.chainId}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900 font-mono max-w-xs truncate">
                            {token.address}
                          </div>
                          {getTokenExplorerUrl(
                            token.chainId,
                            token.address
                          ) && (
                            <div className="mt-1">
                              <a
                                href={
                                  getTokenExplorerUrl(
                                    token.chainId,
                                    token.address
                                  )!
                                }
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center text-xs text-indigo-600 hover:text-indigo-900"
                              >
                                <svg
                                  className="w-3 h-3 mr-1"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                                  />
                                </svg>
                                View Contract
                              </a>
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <div>Decimals: {token.decimals}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              token.enabled
                                ? "bg-green-100 text-green-800"
                                : "bg-red-100 text-red-800"
                            }`}
                          >
                            {token.enabled ? "Enabled" : "Disabled"}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setEditingToken(token)}
                          >
                            Edit
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() =>
                              handleToggleEnabled(token.chainId, token.address)
                            }
                            loading={toggleMutation.isPending}
                          >
                            {token.enabled ? "Disable" : "Enable"}
                          </Button>
                          <Button
                            size="sm"
                            variant="danger"
                            onClick={() =>
                              handleDelete(token.chainId, token.address)
                            }
                            loading={deleteMutation.isPending}
                          >
                            Delete
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {tokens.length === 0 && (
                  <div className="text-center py-8">
                    <p className="text-gray-500">
                      {includeDisabled
                        ? "No tokens found."
                        : "No enabled tokens found."}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Add New Token"
        maxWidth="2xl"
      >
        <TokenForm
          onSubmit={handleCreate}
          onCancel={() => setShowCreateModal(false)}
          loading={createMutation.isPending}
        />
      </Modal>

      {/* Edit Modal */}
      <Modal
        isOpen={!!editingToken}
        onClose={() => setEditingToken(null)}
        title="Edit Token"
        maxWidth="2xl"
      >
        {editingToken && (
          <TokenForm
            token={editingToken}
            onSubmit={handleUpdate}
            onCancel={() => setEditingToken(null)}
            loading={updateMutation.isPending}
          />
        )}
      </Modal>
    </div>
  );
}
