'use client';

import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';

interface StockHealth {
  healthScore: number;
  freshPercentage: number;
  agingPercentage: number;
  criticalPercentage: number;
  avgDaysInStock: number;
  turnoverRisk: 'LOW' | 'MEDIUM' | 'HIGH';
}

interface StockCounts {
  total: number;
  inTransit: number;
  inYard: number;
  reserved: number;
  sold: number;
}

interface StockValue {
  total: number;
  atRisk: number;
  atRiskPercentage: number;
  currency: string;
}

interface AgingBuckets {
  fresh: number;
  aging: number;
  stale: number;
  critical: number;
}

interface StockOverviewCardProps {
  health: StockHealth;
  counts: StockCounts;
  value: StockValue;
  aging: AgingBuckets;
  topBrands: Array<{ name: string; count: number }>;
  isLoading?: boolean;
}

export function StockOverviewCard({
  health,
  counts,
  value,
  aging,
  topBrands,
  isLoading,
}: StockOverviewCardProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-AE', {
      style: 'currency',
      currency: value.currency,
      minimumFractionDigits: 0,
      notation: amount >= 1000000 ? 'compact' : 'standard',
    }).format(amount);
  };

  const getTurnoverRiskBadge = () => {
    switch (health.turnoverRisk) {
      case 'LOW':
        return <Badge variant="success">Low Risk</Badge>;
      case 'MEDIUM':
        return <Badge variant="warning">Medium Risk</Badge>;
      case 'HIGH':
        return <Badge variant="danger">High Risk</Badge>;
    }
  };

  const getHealthColor = (score: number) => {
    if (score >= 70) return 'text-green-600';
    if (score >= 40) return 'text-amber-600';
    return 'text-red-600';
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardContent className="pt-4">
              <div className="h-6 bg-gray-200 rounded animate-pulse mb-2" />
              <div className="h-8 bg-gray-200 rounded animate-pulse" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Health Score */}
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-gray-500">Stock Health</p>
              {getTurnoverRiskBadge()}
            </div>
            <div className="flex items-baseline gap-2">
              <span className={`text-3xl font-bold ${getHealthColor(health.healthScore)}`}>
                {health.healthScore}
              </span>
              <span className="text-gray-400">/100</span>
            </div>
            <div className="mt-2 h-2 bg-gray-200 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full ${
                  health.healthScore >= 70
                    ? 'bg-green-500'
                    : health.healthScore >= 40
                    ? 'bg-amber-500'
                    : 'bg-red-500'
                }`}
                style={{ width: `${health.healthScore}%` }}
              />
            </div>
          </CardContent>
        </Card>

        {/* Total Units */}
        <Card>
          <CardContent className="pt-4">
            <p className="text-sm text-gray-500 mb-2">Available Units</p>
            <p className="text-3xl font-bold text-gray-900">{counts.total}</p>
            <div className="mt-2 flex gap-2 text-xs">
              <span className="text-blue-600">{counts.inTransit} in transit</span>
              <span className="text-gray-400">•</span>
              <span className="text-green-600">{counts.inYard} in yard</span>
            </div>
          </CardContent>
        </Card>

        {/* Total Value */}
        <Card>
          <CardContent className="pt-4">
            <p className="text-sm text-gray-500 mb-2">Total Value</p>
            <p className="text-3xl font-bold text-gray-900">{formatCurrency(value.total)}</p>
            <div className="mt-2 text-xs">
              <span className="text-red-600">
                {formatCurrency(value.atRisk)} at risk ({value.atRiskPercentage}%)
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Avg Days */}
        <Card>
          <CardContent className="pt-4">
            <p className="text-sm text-gray-500 mb-2">Avg. Days in Stock</p>
            <p className="text-3xl font-bold text-gray-900">{health.avgDaysInStock}</p>
            <div className="mt-2 text-xs text-gray-500">
              Fresh: {health.freshPercentage}%
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Aging Distribution & Top Brands */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Aging Buckets */}
        <Card>
          <CardHeader>
            <CardTitle>Stock Aging Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-green-600">Fresh (0-30 days)</span>
                  <span className="font-medium">{aging.fresh} units</span>
                </div>
                <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-green-500 rounded-full"
                    style={{ width: `${(aging.fresh / counts.total) * 100}%` }}
                  />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-blue-600">Aging (31-60 days)</span>
                  <span className="font-medium">{aging.aging} units</span>
                </div>
                <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-500 rounded-full"
                    style={{ width: `${(aging.aging / counts.total) * 100}%` }}
                  />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-amber-600">Stale (61-90 days)</span>
                  <span className="font-medium">{aging.stale} units</span>
                </div>
                <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-amber-500 rounded-full"
                    style={{ width: `${(aging.stale / counts.total) * 100}%` }}
                  />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-red-600">Critical (90+ days)</span>
                  <span className="font-medium">{aging.critical} units</span>
                </div>
                <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-red-500 rounded-full"
                    style={{ width: `${(aging.critical / counts.total) * 100}%` }}
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Top Brands */}
        <Card>
          <CardHeader>
            <CardTitle>Top Brands</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {topBrands.map((brand, idx) => (
                <div key={brand.name} className="flex items-center gap-3">
                  <span className="text-lg font-bold text-gray-400 w-6">#{idx + 1}</span>
                  <div className="flex-1">
                    <div className="flex justify-between mb-1">
                      <span className="font-medium text-gray-900">{brand.name}</span>
                      <span className="text-gray-600">{brand.count} units</span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-violet-500 rounded-full"
                        style={{ width: `${(brand.count / counts.total) * 100}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
