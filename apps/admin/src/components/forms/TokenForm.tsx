import { useForm } from "react-hook-form";
import { Button } from "../ui/Button";
import { Input } from "../ui/Input";
import { useChains } from "../../hooks/useChains";
import type {
  Token,
  CreateTokenRequest,
  UpdateTokenRequest,
} from "../../lib/api";

interface TokenFormProps {
  token?: Token;
  onSubmit: (data: CreateTokenRequest | UpdateTokenRequest) => void;
  onCancel: () => void;
  loading?: boolean;
}

type FormData = {
  chainId: number;
  address: string;
  symbol: string;
  decimals: number;
  enabled: boolean;
  name?: string;
};

export function TokenForm({
  token,
  onSubmit,
  onCancel,
  loading,
}: TokenFormProps) {
  const { data: chains = [] } = useChains(true); // Include disabled chains

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    defaultValues: {
      chainId: token?.chainId || chains[0]?.chainId || 1,
      address: token?.address || "",
      symbol: token?.symbol || "",
      decimals: token?.decimals || 18,
      enabled: token?.enabled ?? true,
      name: token?.name || "",
    },
  });

  const onFormSubmit = (data: FormData) => {
    if (token) {
      // Update - exclude chainId and address, only include changed fields
      const updateData: UpdateTokenRequest = {};
      if (data.symbol !== token.symbol) updateData.symbol = data.symbol;
      if (data.decimals !== token.decimals) updateData.decimals = data.decimals;
      if (data.enabled !== token.enabled) updateData.enabled = data.enabled;
      if (data.name !== token.name) updateData.name = data.name;

      onSubmit(updateData);
    } else {
      // Create - include all required fields
      onSubmit(data as CreateTokenRequest);
    }
  };

  return (
    <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Chain
          </label>
          <select
            {...register("chainId", {
              required: "Chain is required",
              valueAsNumber: true,
            })}
            disabled={!!token} // Can't change chain on update
            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          >
            {chains.map((chain) => (
              <option key={chain.chainId} value={chain.chainId}>
                {chain.name || `Chain ${chain.chainId}`} ({chain.chainId})
                {!chain.enabled ? " - Disabled" : ""}
              </option>
            ))}
          </select>
          {errors.chainId && (
            <p className="mt-1 text-sm text-red-600">
              {errors.chainId.message}
            </p>
          )}
        </div>

        <Input
          label="Symbol"
          {...register("symbol", {
            required: "Symbol is required",
            maxLength: {
              value: 10,
              message: "Symbol cannot exceed 10 characters",
            },
          })}
          placeholder="USDC"
          error={errors.symbol?.message}
        />
      </div>

      <Input
        label="Contract Address"
        {...register("address", {
          required: "Address is required",
          pattern: {
            value: /^0x[a-fA-F0-9]{40}$/,
            message: "Must be a valid Ethereum address",
          },
        })}
        disabled={!!token} // Can't change address on update
        placeholder="0x..."
        error={errors.address?.message}
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Input
          label="Name (Optional)"
          {...register("name")}
          placeholder="USD Coin"
          error={errors.name?.message}
        />

        <Input
          label="Decimals"
          type="number"
          {...register("decimals", {
            required: "Decimals is required",
            min: { value: 0, message: "Cannot be negative" },
            max: { value: 18, message: "Cannot exceed 18" },
            valueAsNumber: true,
          })}
          error={errors.decimals?.message}
        />
      </div>

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
          {token ? "Update Token" : "Create Token"}
        </Button>
      </div>
    </form>
  );
}
