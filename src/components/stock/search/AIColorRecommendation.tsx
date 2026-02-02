'use client';

import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';

interface ColorBadge {
  type: string;
  label: string;
}

interface BestColorRecommendation {
  exteriorColorId: string;
  interiorColorId: string;
  score: number;
  reason: string;
  badges: ColorBadge[];
}

interface AIColorRecommendationProps {
  recommendation: BestColorRecommendation | null;
  exteriorColorName?: string;
  interiorColorName?: string;
  onSelect?: () => void;
}

export function AIColorRecommendation({
  recommendation,
  exteriorColorName,
  interiorColorName,
  onSelect,
}: AIColorRecommendationProps) {
  if (!recommendation) {
    return null;
  }

  const getBadgeVariant = (type: string) => {
    switch (type) {
      case 'BEST_SELLER':
        return 'success';
      case 'HIGH_DEMAND':
        return 'info';
      case 'LOW_STOCK':
        return 'warning';
      case 'FAST_MOVER':
        return 'success';
      case 'CAMPAIGN':
        return 'primary';
      case 'TRENDING':
        return 'info';
      default:
        return 'default';
    }
  };

  return (
    <Card className="bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200">
      <div className="flex items-start gap-3">
        {/* AI Icon */}
        <div className="flex-shrink-0">
          <div className="h-10 w-10 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-md">
            <svg
              className="h-5 w-5 text-white"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h4 className="text-sm font-semibold text-amber-900">
              AI Recommendation
            </h4>
            <span className="text-xs text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full">
              Best to Close
            </span>
          </div>

          {/* Color Names */}
          {(exteriorColorName || interiorColorName) && (
            <p className="mt-1 text-base font-medium text-gray-900">
              {exteriorColorName}
              {interiorColorName && (
                <span className="text-gray-500"> / {interiorColorName}</span>
              )}
            </p>
          )}

          {/* Reason */}
          <p className="mt-1 text-sm text-amber-800">
            {recommendation.reason}
          </p>

          {/* Badges */}
          {recommendation.badges.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1">
              {recommendation.badges.map((badge, idx) => (
                <Badge
                  key={idx}
                  variant={getBadgeVariant(badge.type)}
                  size="sm"
                >
                  {badge.label}
                </Badge>
              ))}
            </div>
          )}

          {/* Score */}
          <div className="mt-3 flex items-center gap-2">
            <div className="flex-1 h-2 bg-amber-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-amber-400 to-orange-500 rounded-full"
                style={{ width: `${recommendation.score}%` }}
              />
            </div>
            <span className="text-sm font-semibold text-amber-700">
              {recommendation.score}%
            </span>
          </div>
        </div>

        {/* Action */}
        {onSelect && (
          <button
            onClick={onSelect}
            className="flex-shrink-0 text-amber-700 hover:text-amber-900 transition-colors"
          >
            <svg
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5l7 7-7 7"
              />
            </svg>
          </button>
        )}
      </div>
    </Card>
  );
}
