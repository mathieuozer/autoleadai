'use client';

import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';

interface PriorityItem {
  id: string;
  vin: string;
  vehicle: {
    brand: string;
    model: string;
    variant: string;
    year: number;
    color: string;
  };
  status: string;
  daysInStock: number;
  price: number;
  scores: {
    aging: number;
    agingRisk: string;
    closeability: number;
    priority: number;
  };
  urgency: 'NOW' | 'THIS_WEEK' | 'THIS_MONTH';
  recommendedAction: string;
  hasActiveCampaign: boolean;
  campaign?: {
    name: string;
    discountValue: number;
  } | null;
}

interface PrioritySummary {
  now: number;
  thisWeek: number;
  thisMonth: number;
  total: number;
  atRiskValue: number;
  atRiskCount: number;
  currency: string;
}

interface PriorityPushListProps {
  items: PriorityItem[];
  summary: PrioritySummary;
  onViewDetails?: (item: PriorityItem) => void;
  isLoading?: boolean;
}

export function PriorityPushList({
  items,
  summary,
  onViewDetails,
  isLoading,
}: PriorityPushListProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-AE', {
      style: 'currency',
      currency: summary.currency,
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const getUrgencyBadge = (urgency: string) => {
    switch (urgency) {
      case 'NOW':
        return <Badge variant="danger">Action Now</Badge>;
      case 'THIS_WEEK':
        return <Badge variant="warning">This Week</Badge>;
      case 'THIS_MONTH':
        return <Badge variant="info">This Month</Badge>;
      default:
        return <Badge>{urgency}</Badge>;
    }
  };

  const getRiskBadge = (risk: string) => {
    switch (risk) {
      case 'CRITICAL':
        return <Badge variant="danger" size="sm">Critical</Badge>;
      case 'HIGH':
        return <Badge variant="warning" size="sm">High</Badge>;
      case 'MEDIUM':
        return <Badge variant="info" size="sm">Medium</Badge>;
      default:
        return <Badge variant="success" size="sm">Low</Badge>;
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-24 bg-gray-100 rounded-xl animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-red-50 border border-red-200">
          <CardContent className="pt-4">
            <p className="text-sm text-red-600">Action Now</p>
            <p className="text-2xl font-bold text-red-700">{summary.now}</p>
          </CardContent>
        </Card>
        <Card className="bg-amber-50 border border-amber-200">
          <CardContent className="pt-4">
            <p className="text-sm text-amber-600">This Week</p>
            <p className="text-2xl font-bold text-amber-700">{summary.thisWeek}</p>
          </CardContent>
        </Card>
        <Card className="bg-blue-50 border border-blue-200">
          <CardContent className="pt-4">
            <p className="text-sm text-blue-600">This Month</p>
            <p className="text-2xl font-bold text-blue-700">{summary.thisMonth}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-sm text-gray-500">At Risk Value</p>
            <p className="text-2xl font-bold text-gray-900">{formatCurrency(summary.atRiskValue)}</p>
          </CardContent>
        </Card>
      </div>

      {/* Priority List */}
      <Card>
        <CardHeader>
          <CardTitle>Priority Push List</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {items.map((item, idx) => (
              <div
                key={item.id}
                className={`
                  flex items-center gap-4 p-4 rounded-lg border transition-colors
                  ${item.urgency === 'NOW' ? 'border-red-200 bg-red-50' : 'border-gray-200 hover:bg-gray-50'}
                `}
              >
                {/* Rank */}
                <div className="flex-shrink-0 h-10 w-10 rounded-full bg-violet-100 flex items-center justify-center">
                  <span className="font-bold text-violet-600">#{idx + 1}</span>
                </div>

                {/* Vehicle Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold text-gray-900 truncate">
                      {item.vehicle.year} {item.vehicle.brand} {item.vehicle.model}
                    </span>
                    {getUrgencyBadge(item.urgency)}
                    {getRiskBadge(item.scores.agingRisk)}
                    {item.hasActiveCampaign && (
                      <Badge variant="success" size="sm">Campaign</Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-3 text-sm text-gray-500">
                    <span>{item.vehicle.variant}</span>
                    <span>•</span>
                    <span>{item.vehicle.color}</span>
                    <span>•</span>
                    <span>{item.daysInStock} days</span>
                  </div>
                  <p className="mt-1 text-sm text-violet-600 font-medium">
                    {item.recommendedAction}
                  </p>
                </div>

                {/* Scores */}
                <div className="flex-shrink-0 text-right hidden md:block">
                  <div className="flex gap-4">
                    <div>
                      <p className="text-xs text-gray-400">Priority</p>
                      <p className="font-bold text-lg">{item.scores.priority}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400">Closeability</p>
                      <p className="font-semibold text-green-600">{item.scores.closeability}%</p>
                    </div>
                  </div>
                </div>

                {/* Price & Action */}
                <div className="flex-shrink-0 text-right">
                  <p className="font-bold text-gray-900">{formatCurrency(item.price)}</p>
                  {onViewDetails && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => onViewDetails(item)}
                      className="mt-1"
                    >
                      Details →
                    </Button>
                  )}
                </div>
              </div>
            ))}

            {items.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <p>No priority items found</p>
                <p className="text-sm">All stock is in healthy condition</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
