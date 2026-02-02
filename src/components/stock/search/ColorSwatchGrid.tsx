'use client';

import { Badge } from '@/components/ui/Badge';

interface ColorBadge {
  type: string;
  label: string;
}

interface ColorRecommendation {
  score: number;
  reason: string;
  badges: ColorBadge[];
}

interface InteriorOption {
  id: string;
  name: string;
  code: string;
  hexColor: string;
  stockCount: number;
  imageUrl: string | null;
}

interface ExteriorColor {
  id: string;
  name: string;
  code: string;
  hexColor: string;
  totalStock: number;
  isRecommended: boolean;
  recommendation?: ColorRecommendation;
  interiorOptions: InteriorOption[];
}

interface ColorSwatchGridProps {
  exteriorColors: ExteriorColor[];
  selectedExteriorId?: string;
  selectedInteriorId?: string;
  onSelectExterior: (color: ExteriorColor) => void;
  onSelectInterior: (color: InteriorOption) => void;
  isLoading?: boolean;
}

export function ColorSwatchGrid({
  exteriorColors,
  selectedExteriorId,
  selectedInteriorId,
  onSelectExterior,
  onSelectInterior,
  isLoading,
}: ColorSwatchGridProps) {
  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex gap-3">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-12 w-12 animate-pulse rounded-full bg-gray-100" />
          ))}
        </div>
      </div>
    );
  }

  if (exteriorColors.length === 0) {
    return <p className="text-sm text-gray-500">No colors available</p>;
  }

  const selectedExterior = exteriorColors.find(c => c.id === selectedExteriorId);

  const getBadgeVariant = (type: string) => {
    switch (type) {
      case 'BEST_SELLER':
        return 'success';
      case 'HIGH_DEMAND':
        return 'info';
      case 'LOW_STOCK':
        return 'warning';
      case 'CAMPAIGN':
        return 'primary';
      default:
        return 'default';
    }
  };

  return (
    <div className="space-y-6">
      {/* Exterior Colors */}
      <div className="space-y-3">
        <h3 className="text-sm font-medium text-gray-600">Exterior Color</h3>
        <div className="flex flex-wrap gap-4">
          {exteriorColors.map((color) => (
            <button
              key={color.id}
              onClick={() => onSelectExterior(color)}
              className={`
                group relative flex flex-col items-center
                ${color.totalStock === 0 ? 'opacity-50 cursor-not-allowed' : ''}
              `}
              disabled={color.totalStock === 0}
            >
              <div
                className={`
                  relative h-14 w-14 rounded-full border-4 shadow-md transition-all
                  ${
                    selectedExteriorId === color.id
                      ? 'border-violet-500 scale-110'
                      : 'border-white hover:scale-105'
                  }
                `}
                style={{ backgroundColor: color.hexColor }}
              >
                {color.isRecommended && (
                  <div className="absolute -right-1 -top-1 h-5 w-5 rounded-full bg-amber-400 flex items-center justify-center">
                    <svg className="h-3 w-3 text-amber-900\" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  </div>
                )}
                {selectedExteriorId === color.id && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <svg
                      className="h-6 w-6 drop-shadow-md"
                      style={{
                        color: isLightColor(color.hexColor) ? '#1f2937' : '#ffffff',
                      }}
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={3}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  </div>
                )}
              </div>
              <span className="mt-2 text-xs font-medium text-gray-700 max-w-[60px] text-center truncate">
                {color.name}
              </span>
              <span className="text-xs text-gray-500">{color.totalStock}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Selected exterior info */}
      {selectedExterior && selectedExterior.recommendation && (
        <div className="rounded-lg bg-violet-50 p-3">
          <div className="flex items-center gap-2 flex-wrap">
            {selectedExterior.recommendation.badges.map((badge, idx) => (
              <Badge key={idx} variant={getBadgeVariant(badge.type)} size="sm">
                {badge.label}
              </Badge>
            ))}
          </div>
          <p className="mt-2 text-sm text-violet-700">
            {selectedExterior.recommendation.reason}
          </p>
        </div>
      )}

      {/* Interior Colors */}
      {selectedExterior && selectedExterior.interiorOptions.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-gray-600">Interior Color</h3>
          <div className="flex flex-wrap gap-4">
            {selectedExterior.interiorOptions.map((interior) => (
              <button
                key={interior.id}
                onClick={() => onSelectInterior(interior)}
                className={`
                  group relative flex flex-col items-center
                  ${interior.stockCount === 0 ? 'opacity-50 cursor-not-allowed' : ''}
                `}
                disabled={interior.stockCount === 0}
              >
                <div
                  className={`
                    relative h-10 w-10 rounded-full border-4 shadow-sm transition-all
                    ${
                      selectedInteriorId === interior.id
                        ? 'border-violet-500 scale-110'
                        : 'border-white hover:scale-105'
                    }
                  `}
                  style={{ backgroundColor: interior.hexColor }}
                >
                  {selectedInteriorId === interior.id && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <svg
                        className="h-4 w-4 drop-shadow-md"
                        style={{
                          color: isLightColor(interior.hexColor) ? '#1f2937' : '#ffffff',
                        }}
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={3}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                    </div>
                  )}
                </div>
                <span className="mt-1 text-xs font-medium text-gray-700 max-w-[50px] text-center truncate">
                  {interior.name}
                </span>
                <span className="text-xs text-gray-500">{interior.stockCount}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function isLightColor(hexColor: string): boolean {
  const hex = hexColor.replace('#', '');
  const r = parseInt(hex.substr(0, 2), 16);
  const g = parseInt(hex.substr(2, 2), 16);
  const b = parseInt(hex.substr(4, 2), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.5;
}
