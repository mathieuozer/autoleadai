'use client';

import { Card } from '@/components/ui/Card';

interface Model {
  id: string;
  name: string;
  code: string;
  variantCount: number;
  availableYears: number[];
}

interface ModelSelectorProps {
  models: Model[];
  selectedModelId?: string;
  onSelect: (model: Model) => void;
  brandName?: string;
  isLoading?: boolean;
}

export function ModelSelector({
  models,
  selectedModelId,
  onSelect,
  brandName,
  isLoading,
}: ModelSelectorProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <div
            key={i}
            className="h-28 animate-pulse rounded-xl bg-gray-100"
          />
        ))}
      </div>
    );
  }

  if (models.length === 0) {
    return (
      <Card className="text-center py-8">
        <p className="text-gray-500">No models available for this brand</p>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-medium text-gray-600">
        Select Model {brandName && <span className="text-violet-600">({brandName})</span>}
      </h3>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
        {models.map((model) => (
          <button
            key={model.id}
            onClick={() => onSelect(model)}
            className={`
              relative flex flex-col items-start rounded-xl border-2 p-4 text-left transition-all
              ${
                selectedModelId === model.id
                  ? 'border-violet-500 bg-violet-50 shadow-md'
                  : 'border-gray-200 bg-white hover:border-violet-300 hover:shadow-sm'
              }
            `}
          >
            <span className="text-lg font-semibold text-gray-900">
              {model.name}
            </span>
            <span className="mt-1 text-sm text-gray-500">
              {model.variantCount} variant{model.variantCount !== 1 ? 's' : ''}
            </span>
            {model.availableYears.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1">
                {model.availableYears.slice(0, 3).map((year) => (
                  <span
                    key={year}
                    className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600"
                  >
                    {year}
                  </span>
                ))}
                {model.availableYears.length > 3 && (
                  <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600">
                    +{model.availableYears.length - 3}
                  </span>
                )}
              </div>
            )}
            {selectedModelId === model.id && (
              <div className="absolute -right-1 -top-1 h-4 w-4 rounded-full bg-violet-500">
                <svg
                  className="h-4 w-4 text-white"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
