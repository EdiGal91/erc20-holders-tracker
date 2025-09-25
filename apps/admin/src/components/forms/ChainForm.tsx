import { useForm } from "react-hook-form";
import { Button } from "../ui/Button";
import { Input } from "../ui/Input";
import type {
  Chain,
  CreateChainRequest,
  UpdateChainRequest,
} from "../../lib/api";

interface ChainFormProps {
  chain?: Chain;
  onSubmit: (data: CreateChainRequest | UpdateChainRequest) => void;
  onCancel: () => void;
  loading?: boolean;
}

type FormData = {
  chainId: number;
  rpcUrl: string;
  apiKey: string;
  confirmations: number;
  logsRange: number;
  enabled: boolean;
  name?: string;
  symbol?: string;
  explorerUrl?: string;
};

export function ChainForm({
  chain,
  onSubmit,
  onCancel,
  loading,
}: ChainFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    defaultValues: {
      chainId: chain?.chainId || 1,
      rpcUrl: chain?.rpcUrl || "",
      apiKey: "", // Always empty for security
      confirmations: chain?.confirmations || 12,
      logsRange: chain?.logsRange || 2000,
      enabled: chain?.enabled ?? true,
      name: chain?.name || "",
      symbol: chain?.symbol || "",
      explorerUrl: chain?.explorerUrl || "",
    },
  });

  const onFormSubmit = (data: FormData) => {
    if (chain) {
      // Update - exclude chainId and only include changed fields
      const updateData: UpdateChainRequest = {};
      if (data.rpcUrl !== chain.rpcUrl) updateData.rpcUrl = data.rpcUrl;
      if (data.apiKey) updateData.apiKey = data.apiKey; // Only if provided
      if (data.confirmations !== chain.confirmations)
        updateData.confirmations = data.confirmations;
      if (data.logsRange !== chain.logsRange)
        updateData.logsRange = data.logsRange;
      if (data.enabled !== chain.enabled) updateData.enabled = data.enabled;
      if (data.name !== chain.name) updateData.name = data.name;
      if (data.symbol !== chain.symbol) updateData.symbol = data.symbol;
      if (data.explorerUrl !== chain.explorerUrl)
        updateData.explorerUrl = data.explorerUrl;

      onSubmit(updateData);
    } else {
      // Create - include all required fields
      onSubmit(data as CreateChainRequest);
    }
  };

  return (
    <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Input
          label="Chain ID"
          type="number"
          {...register("chainId", {
            required: "Chain ID is required",
            min: { value: 1, message: "Chain ID must be greater than 0" },
          })}
          disabled={!!chain} // Can't change chain ID on update
          error={errors.chainId?.message}
        />

        <Input
          label="Name (Optional)"
          {...register("name")}
          placeholder="Ethereum Mainnet"
          error={errors.name?.message}
        />
      </div>

      <Input
        label="RPC URL"
        type="url"
        {...register("rpcUrl", {
          required: "RPC URL is required",
          pattern: {
            value: /^https?:\/\/.+/,
            message: "Must be a valid HTTP/HTTPS URL",
          },
        })}
        placeholder="https://mainnet.infura.io/v3/..."
        error={errors.rpcUrl?.message}
      />

      <Input
        label={chain ? "API Key (leave empty to keep current)" : "API Key"}
        type="password"
        {...register("apiKey", {
          required: !chain ? "API Key is required" : false,
        })}
        placeholder={chain ? "Enter new API key to change" : "Your API key"}
        error={errors.apiKey?.message}
        helperText={
          chain ? "Only enter a new key if you want to change it" : undefined
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Input
          label="Confirmations"
          type="number"
          {...register("confirmations", {
            required: "Confirmations is required",
            min: { value: 1, message: "Must be at least 1" },
            max: { value: 100, message: "Cannot exceed 100" },
          })}
          error={errors.confirmations?.message}
        />

        <Input
          label="Logs Range"
          type="number"
          {...register("logsRange", {
            required: "Logs range is required",
            min: { value: 100, message: "Must be at least 100" },
            max: { value: 10000, message: "Cannot exceed 10000" },
          })}
          error={errors.logsRange?.message}
        />

        <Input
          label="Symbol (Optional)"
          {...register("symbol")}
          placeholder="ETH"
          error={errors.symbol?.message}
        />
      </div>

      <Input
        label="Explorer URL (Optional)"
        type="url"
        {...register("explorerUrl", {
          pattern: {
            value: /^https?:\/\/.+/,
            message: "Must be a valid HTTP/HTTPS URL",
          },
        })}
        placeholder="https://etherscan.io"
        error={errors.explorerUrl?.message}
      />

      <div className="flex items-center">
        <input
          type="checkbox"
          {...register("enabled")}
          className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
        />
        <label className="ml-2 block text-sm text-gray-900">Enabled</label>
      </div>

      <div className="flex justify-end space-x-3 pt-4">
        <Button type="button" variant="secondary" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" loading={loading}>
          {chain ? "Update Chain" : "Create Chain"}
        </Button>
      </div>
    </form>
  );
}
