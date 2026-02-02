'use client';

import { Card } from '@/components/ui/Card';

interface Brand {
  id: string;
  name: string;
  code: string;
  logoUrl?: string | null;
  modelCount: number;
}

interface BrandSelectorProps {
  brands: Brand[];
  selectedBrandId?: string;
  onSelect: (brand: Brand) => void;
  isLoading?: boolean;
}

export function BrandSelector({
  brands,
  selectedBrandId,
  onSelect,
  isLoading,
}: BrandSelectorProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            className="h-24 animate-pulse rounded-xl bg-gray-100"
          />
        ))}
      </div>
    );
  }

  if (brands.length === 0) {
    return (
      <Card className="text-center py-8">
        <p className="text-gray-500">No brands available</p>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-medium text-gray-600">Select Brand</h3>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
        {brands.map((brand) => (
          <button
            key={brand.id}
            onClick={() => onSelect(brand)}
            className={`
              group relative flex flex-col items-center justify-center rounded-xl border-2 p-4 transition-all
              ${
                selectedBrandId === brand.id
                  ? 'border-violet-500 bg-violet-50 shadow-md'
                  : 'border-gray-200 bg-white hover:border-violet-300 hover:shadow-sm'
              }
            `}
          >
            {brand.logoUrl ? (
              <img
                src={brand.logoUrl}
                alt={brand.name}
                className="h-10 w-auto object-contain"
              />
            ) : (
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-purple-600">
                <span className="text-lg font-bold text-white">
                  {brand.name.charAt(0)}
                </span>
              </div>
            )}
            <span className="mt-2 text-sm font-medium text-gray-900">
              {brand.name}
            </span>
            <span className="text-xs text-gray-500">
              {brand.modelCount} model{brand.modelCount !== 1 ? 's' : ''}
            </span>
            {selectedBrandId === brand.id && (
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
