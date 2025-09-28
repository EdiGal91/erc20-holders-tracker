import type { ReactNode } from "react";

export interface FilterItem {
  id: string | number;
  title: string;
  subtitle: string;
  icon?: ReactNode;
  iconBg?: string;
  iconText?: string;
  disabled?: boolean;
  disabledStates?: Array<{
    label: string;
    type: "warning" | "error";
  }>;
}

interface CardFilterProps<T extends string | number | undefined> {
  title: string;
  items: FilterItem[];
  selectedValue: T;
  onSelectionChange: (value: T) => void;
  isLoading: boolean;
  allOption?: {
    title: string;
    subtitle: string;
    value: T;
  };
  loadingSkeletonCount?: number;
}

export function CardFilter<T extends string | number | undefined>({
  title,
  items,
  selectedValue,
  onSelectionChange,
  isLoading,
  allOption,
  loadingSkeletonCount = 8,
}: CardFilterProps<T>) {
  if (isLoading) {
    return (
      <div className="bg-white shadow rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">{title}</h3>
        <div className="animate-pulse">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {[...Array(loadingSkeletonCount)].map((_, i) => (
              <div key={i} className="h-16 bg-gray-200 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const isSelected = (itemId: string | number | undefined) => {
    return selectedValue === itemId;
  };

  const getCardClasses = (itemId: string | number | undefined) => {
    return `p-4 rounded-lg border-2 text-left transition-all duration-200 hover:shadow-md ${
      isSelected(itemId)
        ? "border-indigo-500 bg-indigo-50 shadow-md"
        : "border-gray-200 bg-white hover:border-gray-300"
    }`;
  };

  const renderIcon = (item: FilterItem) => {
    if (item.icon) {
      return item.icon;
    }

    const bgClass =
      item.iconBg || "bg-gradient-to-br from-indigo-500 to-purple-600";
    const iconText = item.iconText || item.title.charAt(0);

    return (
      <div
        className={`w-8 h-8 ${bgClass} rounded-full flex items-center justify-center`}
      >
        <span className="text-white text-sm font-bold">{iconText}</span>
      </div>
    );
  };

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <h3 className="text-lg font-medium text-gray-900 mb-4">{title}</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
        {/* All Option Card */}
        {allOption && (
          <button
            onClick={() => onSelectionChange(allOption.value)}
            className={getCardClasses(allOption.value)}
          >
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                <span className="text-gray-600 text-sm font-medium">All</span>
              </div>
              <div>
                <div className="font-medium text-gray-900">
                  {allOption.title}
                </div>
                <div className="text-sm text-gray-500">
                  {allOption.subtitle}
                </div>
              </div>
            </div>
          </button>
        )}

        {/* Item Cards */}
        {items.map((item) => (
          <button
            key={item.id}
            onClick={() => onSelectionChange(item.id as T)}
            className={getCardClasses(item.id)}
          >
            <div className="flex items-center space-x-3">
              {renderIcon(item)}
              <div className="min-w-0 flex-1">
                <div className="font-medium text-gray-900 truncate">
                  {item.title}
                </div>
                <div className="text-sm text-gray-500 truncate">
                  {item.subtitle}
                </div>
                {item.disabled && (
                  <div className="text-xs text-amber-600 font-medium">
                    Disabled
                  </div>
                )}
                {item.disabledStates && item.disabledStates.length > 0 && (
                  <div className="space-y-1">
                    {item.disabledStates.map((state, index) => (
                      <div
                        key={index}
                        className={`text-xs font-medium ${
                          state.type === "error"
                            ? "text-red-600"
                            : "text-amber-600"
                        }`}
                      >
                        {state.label}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
