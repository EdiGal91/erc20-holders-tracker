import { useState } from "react";
import { Button } from "../components/ui/Button";
import { Modal } from "../components/ui/Modal";
import { ChainForm } from "../components/forms/ChainForm";
import {
  useChains,
  useCreateChain,
  useUpdateChain,
  useDeleteChain,
  useToggleChainEnabled,
} from "../hooks/useChains";
import type { Chain, CreateChainRequest, UpdateChainRequest } from "../lib/api";

export function ChainsPage() {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingChain, setEditingChain] = useState<Chain | null>(null);
  const [includeDisabled, setIncludeDisabled] = useState(false);

  const { data: chains = [], isLoading, error } = useChains(includeDisabled);
  const createMutation = useCreateChain();
  const updateMutation = useUpdateChain();
  const deleteMutation = useDeleteChain();
  const toggleMutation = useToggleChainEnabled();

  const handleCreate = (data: CreateChainRequest) => {
    createMutation.mutate(data, {
      onSuccess: () => {
        setShowCreateModal(false);
      },
    });
  };

  const handleUpdate = (data: UpdateChainRequest) => {
    if (!editingChain) return;

    updateMutation.mutate(
      { chainId: editingChain.chainId, data },
      {
        onSuccess: () => {
          setEditingChain(null);
        },
      }
    );
  };

  const handleDelete = (chainId: number) => {
    if (
      confirm(
        "Are you sure you want to delete this chain? This action cannot be undone."
      )
    ) {
      deleteMutation.mutate(chainId);
    }
  };

  const handleToggleEnabled = (chainId: number) => {
    toggleMutation.mutate(chainId);
  };

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-600">Error loading chains: {error.message}</p>
      </div>
    );
  }

  return (
    <div>
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h1 className="text-2xl font-semibold text-gray-900">Chains</h1>
          <p className="mt-2 text-sm text-gray-700">
            Manage blockchain networks and their configurations.
          </p>
        </div>
        <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none space-x-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setIncludeDisabled(!includeDisabled)}
          >
            {includeDisabled ? "Hide Disabled" : "Show Disabled"}
          </Button>
          <Button onClick={() => setShowCreateModal(true)}>Add Chain</Button>
        </div>
      </div>

      {isLoading ? (
        <div className="text-center py-8">
          <p className="text-gray-500">Loading chains...</p>
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
                        Chain
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">
                        RPC URL
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">
                        Config
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
                    {chains.map((chain) => (
                      <tr key={chain._id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {chain.name || `Chain ${chain.chainId}`}
                            </div>
                            <div className="text-sm text-gray-500">
                              ID: {chain.chainId}
                              {chain.symbol && ` • ${chain.symbol}`}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900 max-w-xs truncate">
                            {chain.rpcUrl}
                          </div>
                          {chain.explorerUrl && (
                            <div className="text-sm text-gray-500 max-w-xs truncate">
                              Explorer: {chain.explorerUrl}
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <div>Confirmations: {chain.confirmations}</div>
                          <div>Logs Range: {chain.logsRange}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              chain.enabled
                                ? "bg-green-100 text-green-800"
                                : "bg-red-100 text-red-800"
                            }`}
                          >
                            {chain.enabled ? "Enabled" : "Disabled"}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setEditingChain(chain)}
                          >
                            Edit
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleToggleEnabled(chain.chainId)}
                            loading={toggleMutation.isPending}
                          >
                            {chain.enabled ? "Disable" : "Enable"}
                          </Button>
                          <Button
                            size="sm"
                            variant="danger"
                            onClick={() => handleDelete(chain.chainId)}
                            loading={deleteMutation.isPending}
                          >
                            Delete
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {chains.length === 0 && (
                  <div className="text-center py-8">
                    <p className="text-gray-500">
                      {includeDisabled
                        ? "No chains found."
                        : "No enabled chains found."}
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
        title="Add New Chain"
        maxWidth="2xl"
      >
        {showCreateModal && (
          <ChainForm
            onSubmit={handleCreate}
            onCancel={() => setShowCreateModal(false)}
            loading={createMutation.isPending}
          />
        )}
      </Modal>

      {/* Edit Modal */}
      <Modal
        isOpen={!!editingChain}
        onClose={() => setEditingChain(null)}
        title="Edit Chain"
        maxWidth="2xl"
      >
        {editingChain && (
          <ChainForm
            chain={editingChain}
            onSubmit={handleUpdate}
            onCancel={() => setEditingChain(null)}
            loading={updateMutation.isPending}
          />
        )}
      </Modal>
    </div>
  );
}
