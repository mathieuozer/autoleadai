'use client';

import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';

interface Campaign {
  id: string;
  name: string;
  type: string;
  discountType: string | null;
  discountValue: number;
  endDate: Date;
  daysRemaining: number;
}

interface PricingInfo {
  msrp: number;
  currentPrice: number;
  campaignDiscount: number;
  effectivePrice: number;
  totalSavings: number;
  savingsPercentage: number;
  currency: string;
}

interface PricingCardProps {
  variant?: {
    id: string;
    name: string;
    code: string;
    year: number;
    model: string;
    brand: string;
  };
  pricing?: PricingInfo;
  activeCampaign?: Campaign | null;
  allCampaigns?: Campaign[];
  isLoading?: boolean;
}

export function PricingCard({
  variant,
  pricing,
  activeCampaign,
  allCampaigns = [],
  isLoading,
}: PricingCardProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-AE', {
      style: 'currency',
      currency: pricing?.currency || 'AED',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  if (isLoading) {
    return (
      <Card className="animate-pulse">
        <div className="h-6 w-32 bg-gray-200 rounded mb-4" />
        <div className="h-10 w-40 bg-gray-200 rounded mb-2" />
        <div className="h-4 w-24 bg-gray-200 rounded" />
      </Card>
    );
  }

  if (!pricing || !variant) {
    return null;
  }

  return (
    <Card>
      <div className="space-y-4">
        {/* Vehicle Info */}
        <div>
          <p className="text-sm text-gray-500">
            {variant.year} {variant.brand} {variant.model}
          </p>
          <h3 className="text-lg font-semibold text-gray-900">{variant.name}</h3>
        </div>

        {/* Pricing */}
        <div className="border-t border-gray-100 pt-4">
          <div className="flex items-baseline justify-between">
            <span className="text-sm text-gray-500">MSRP</span>
            <span className="text-sm text-gray-400 line-through">
              {formatCurrency(pricing.msrp)}
            </span>
          </div>

          {pricing.campaignDiscount > 0 && (
            <div className="flex items-baseline justify-between mt-1">
              <span className="text-sm text-green-600">Campaign Discount</span>
              <span className="text-sm font-medium text-green-600">
                -{formatCurrency(pricing.campaignDiscount)}
              </span>
            </div>
          )}

          <div className="flex items-baseline justify-between mt-3 pt-3 border-t border-gray-100">
            <span className="text-base font-medium text-gray-900">Your Price</span>
            <div className="text-right">
              <span className="text-2xl font-bold text-gray-900">
                {formatCurrency(pricing.effectivePrice)}
              </span>
              {pricing.totalSavings > 0 && (
                <p className="text-sm text-green-600">
                  Save {formatCurrency(pricing.totalSavings)} ({pricing.savingsPercentage}%)
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Active Campaign */}
        {activeCampaign && (
          <div className="bg-gradient-to-r from-violet-50 to-purple-50 rounded-lg p-3 border border-violet-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Badge variant="primary" size="sm">
                  {activeCampaign.type}
                </Badge>
                <span className="text-sm font-medium text-violet-900">
                  {activeCampaign.name}
                </span>
              </div>
              <span className="text-xs text-violet-600">
                {activeCampaign.daysRemaining} days left
              </span>
            </div>
          </div>
        )}

        {/* Other Campaigns */}
        {allCampaigns.length > 1 && (
          <div className="text-xs text-gray-500">
            +{allCampaigns.length - 1} more offer{allCampaigns.length > 2 ? 's' : ''} available
          </div>
        )}

        {/* Finance Options Preview */}
        <div className="border-t border-gray-100 pt-4">
          <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">
            Estimated Monthly
          </p>
          <div className="flex items-baseline gap-1">
            <span className="text-lg font-semibold text-gray-900">
              {formatCurrency(Math.round(pricing.effectivePrice / 60))}
            </span>
            <span className="text-sm text-gray-500">/month</span>
          </div>
          <p className="text-xs text-gray-400 mt-1">
            Based on 60 months with 20% down payment
          </p>
        </div>
      </div>
    </Card>
  );
}
