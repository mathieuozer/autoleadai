'use client';

import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';

interface Campaign {
  id: string;
  name: string;
  type: string;
  discountType: string | null;
  discountValue: number | null;
  endsAt: Date;
}

interface Variant {
  id: string;
  name: string;
  code: string;
  year: number;
  msrp: number;
  currentPrice: number;
  engineType: string | null;
  transmission: string | null;
  stockCount: number;
  activeCampaigns: Campaign[];
}

interface VariantSelectorProps {
  variants: Variant[];
  selectedVariantId?: string;
  onSelect: (variant: Variant) => void;
  modelName?: string;
  isLoading?: boolean;
}

export function VariantSelector({
  variants,
  selectedVariantId,
  onSelect,
  modelName,
  isLoading,
}: VariantSelectorProps) {
  if (isLoading) {
    return (
      <div className="space-y-3">
        {[...Array(3)].map((_, i) => (
          <div
            key={i}
            className="h-24 animate-pulse rounded-xl bg-gray-100"
          />
        ))}
      </div>
    );
  }

  if (variants.length === 0) {
    return (
      <Card className="text-center py-8">
        <p className="text-gray-500">No variants available for this selection</p>
      </Card>
    );
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-AE', {
      style: 'currency',
      currency: 'AED',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
  };

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-medium text-gray-600">
        Select Variant {modelName && <span className="text-violet-600">({modelName})</span>}
      </h3>
      <div className="space-y-3">
        {variants.map((variant) => {
          const hasDiscount = variant.activeCampaigns.length > 0;
          const bestCampaign = variant.activeCampaigns[0];
          const discountedPrice = bestCampaign
            ? variant.currentPrice - (bestCampaign.discountValue || 0)
            : variant.currentPrice;

          return (
            <button
              key={variant.id}
              onClick={() => onSelect(variant)}
              className={`
                relative w-full rounded-xl border-2 p-4 text-left transition-all
                ${
                  selectedVariantId === variant.id
                    ? 'border-violet-500 bg-violet-50 shadow-md'
                    : 'border-gray-200 bg-white hover:border-violet-300 hover:shadow-sm'
                }
              `}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-semibold text-gray-900">
                      {variant.name}
                    </span>
                    {hasDiscount && (
                      <Badge variant="success" size="sm">
                        Campaign
                      </Badge>
                    )}
                  </div>
                  <div className="mt-1 flex flex-wrap gap-3 text-sm text-gray-500">
                    {variant.engineType && (
                      <span className="flex items-center gap-1">
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                        {variant.engineType}
                      </span>
                    )}
                    {variant.transmission && (
                      <span className="flex items-center gap-1">
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                        </svg>
                        {variant.transmission}
                      </span>
                    )}
                    <span className="flex items-center gap-1">
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                      </svg>
                      {variant.stockCount} in stock
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  {hasDiscount ? (
                    <>
                      <p className="text-sm text-gray-400 line-through">
                        {formatPrice(variant.currentPrice)}
                      </p>
                      <p className="text-xl font-bold text-green-600">
                        {formatPrice(discountedPrice)}
                      </p>
                      <p className="text-xs text-green-600">
                        Save {formatPrice(variant.currentPrice - discountedPrice)}
                      </p>
                    </>
                  ) : (
                    <p className="text-xl font-bold text-gray-900">
                      {formatPrice(variant.currentPrice)}
                    </p>
                  )}
                </div>
              </div>
              {selectedVariantId === variant.id && (
                <div className="absolute -right-1 -top-1 h-5 w-5 rounded-full bg-violet-500">
                  <svg
                    className="h-5 w-5 text-white"
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
          );
        })}
      </div>
    </div>
  );
}
