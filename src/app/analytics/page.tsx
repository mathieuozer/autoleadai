'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { PageContainer } from '@/components/layout';
import { Card, CardTitle, Button, Badge, Select } from '@/components/ui';
import {
  ArrowLeft,
  Loader2,
  AlertCircle,
  RefreshCw,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Users,
  Car,
  Clock,
  Target,
  Award,
  BarChart3,
  Calendar,
} from 'lucide-react';

interface SalespersonPerformance {
  id: string;
  name: string;
  avatar: string | null;
  orders: number;
  revenue: number;
  conversion: number;
  avgResponseTime: number;
  riskReduction: number;
  rank: number;
}

interface AnalyticsData {
  period: string;
  overview: {
    totalOrders: number;
    totalRevenue: number;
    avgConversion: number;
    avgFulfillment: number;
    ordersAtRisk: number;
    atRiskValue: number;
    deliveries: number;
    cancellations: number;
  };
  trends: {
    ordersChange: number;
    revenueChange: number;
    conversionChange: number;
    riskChange: number;
  };
  byStatus: Array<{
    status: string;
    count: number;
    value: number;
  }>;
  bySource: Array<{
    source: string;
    count: number;
    conversion: number;
  }>;
  team: SalespersonPerformance[];
}

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [period, setPeriod] = useState('this_month');

  const fetchData = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // In production, this would fetch from the API
      // For now, using mock data
      const mockData: AnalyticsData = {
        period: 'January 2024',
        overview: {
          totalOrders: 156,
          totalRevenue: 28500000,
          avgConversion: 32,
          avgFulfillment: 78,
          ordersAtRisk: 23,
          atRiskValue: 4250000,
          deliveries: 89,
          cancellations: 12
        },
        trends: {
          ordersChange: 12,
          revenueChange: 18,
          conversionChange: 5,
          riskChange: -8
        },
        byStatus: [
          { status: 'New', count: 24, value: 4320000 },
          { status: 'Test Drive Done', count: 18, value: 3240000 },
          { status: 'Negotiation', count: 31, value: 5580000 },
          { status: 'Booking Done', count: 28, value: 5040000 },
          { status: 'Financing', count: 22, value: 3960000 },
          { status: 'Ready for Delivery', count: 15, value: 2700000 },
          { status: 'Delivered', count: 89, value: 16020000 }
        ],
        bySource: [
          { source: 'Website', count: 45, conversion: 28 },
          { source: 'Walk-in', count: 38, conversion: 42 },
          { source: 'Referral', count: 32, conversion: 56 },
          { source: 'Campaign', count: 28, conversion: 22 },
          { source: 'Social Media', count: 13, conversion: 18 }
        ],
        team: [
          { id: '1', name: 'Mohammed Al Rashid', avatar: null, orders: 24, revenue: 4320000, conversion: 42, avgResponseTime: 1.2, riskReduction: 28, rank: 1 },
          { id: '2', name: 'Sarah Johnson', avatar: null, orders: 21, revenue: 3780000, conversion: 38, avgResponseTime: 1.8, riskReduction: 24, rank: 2 },
          { id: '3', name: 'Ahmed Hassan', avatar: null, orders: 19, revenue: 3420000, conversion: 35, avgResponseTime: 2.1, riskReduction: 22, rank: 3 },
          { id: '4', name: 'Fatima Ali', avatar: null, orders: 18, revenue: 3240000, conversion: 32, avgResponseTime: 2.5, riskReduction: 18, rank: 4 },
          { id: '5', name: 'John Smith', avatar: null, orders: 15, revenue: 2700000, conversion: 28, avgResponseTime: 3.2, riskReduction: 15, rank: 5 }
        ]
      };

      setData(mockData);
    } catch (err) {
      setError('Failed to fetch analytics');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [period]);

  const formatCurrency = (amount: number) => {
    if (amount >= 1000000) {
      return `AED ${(amount / 1000000).toFixed(1)}M`;
    }
    return new Intl.NumberFormat('en-AE', {
      style: 'currency',
      currency: 'AED',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  if (isLoading) {
    return (
      <PageContainer title="Performance Analytics" subtitle="Loading...">
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-[#7c3aed]" />
        </div>
      </PageContainer>
    );
  }

  if (error || !data) {
    return (
      <PageContainer title="Performance Analytics" subtitle="Error loading data">
        <Card className="p-8 text-center">
          <AlertCircle className="mx-auto mb-4 h-12 w-12 text-red-500" />
          <p className="text-red-600 mb-4">{error}</p>
          <Button onClick={fetchData} variant="outline">
            <RefreshCw className="mr-2 h-4 w-4" />
            Retry
          </Button>
        </Card>
      </PageContainer>
    );
  }

  return (
    <PageContainer
      title="Performance Analytics"
      subtitle="Branch and team performance insights"
    >
      <div className="mb-6 flex items-center justify-between">
        <Link href="/dashboard">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Button>
        </Link>
        <div className="flex items-center gap-4">
          <Select
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            className="w-40"
          >
            <option value="today">Today</option>
            <option value="this_week">This Week</option>
            <option value="this_month">This Month</option>
            <option value="this_quarter">This Quarter</option>
            <option value="this_year">This Year</option>
          </Select>
          <Button onClick={fetchData} variant="outline" size="sm">
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-violet-100">
              <Car className="h-6 w-6 text-violet-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{data.overview.totalOrders}</p>
              <p className="text-sm text-gray-500">Total Orders</p>
              <p className={`text-xs ${data.trends.ordersChange > 0 ? 'text-green-600' : 'text-red-600'}`}>
                {data.trends.ordersChange > 0 ? '↑' : '↓'} {Math.abs(data.trends.ordersChange)}% vs last period
              </p>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-green-100">
              <DollarSign className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{formatCurrency(data.overview.totalRevenue)}</p>
              <p className="text-sm text-gray-500">Revenue</p>
              <p className={`text-xs ${data.trends.revenueChange > 0 ? 'text-green-600' : 'text-red-600'}`}>
                {data.trends.revenueChange > 0 ? '↑' : '↓'} {Math.abs(data.trends.revenueChange)}% vs last period
              </p>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-100">
              <Target className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{data.overview.avgConversion}%</p>
              <p className="text-sm text-gray-500">Conversion Rate</p>
              <p className={`text-xs ${data.trends.conversionChange > 0 ? 'text-green-600' : 'text-red-600'}`}>
                {data.trends.conversionChange > 0 ? '↑' : '↓'} {Math.abs(data.trends.conversionChange)}% vs last period
              </p>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-red-100">
              <AlertCircle className="h-6 w-6 text-red-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{data.overview.ordersAtRisk}</p>
              <p className="text-sm text-gray-500">At Risk</p>
              <p className="text-xs text-gray-500">{formatCurrency(data.overview.atRiskValue)}</p>
            </div>
          </div>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Pipeline by Status */}
        <Card>
          <CardTitle className="mb-4">
            <div className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-violet-600" />
              Pipeline by Status
            </div>
          </CardTitle>
          <div className="space-y-3">
            {data.byStatus.map((item) => (
              <div key={item.status}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium">{item.status}</span>
                  <span className="text-sm text-gray-500">
                    {item.count} orders • {formatCurrency(item.value)}
                  </span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-violet-500 rounded-full"
                    style={{ width: `${(item.count / data.overview.totalOrders) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Lead Sources */}
        <Card>
          <CardTitle className="mb-4">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-violet-600" />
              Lead Sources
            </div>
          </CardTitle>
          <div className="space-y-4">
            {data.bySource.map((source) => (
              <div key={source.source} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-24">
                    <p className="font-medium">{source.source}</p>
                    <p className="text-xs text-gray-500">{source.count} leads</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-32 h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-green-500 rounded-full"
                      style={{ width: `${source.conversion}%` }}
                    />
                  </div>
                  <span className="text-sm font-medium w-12 text-right">
                    {source.conversion}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Team Leaderboard */}
      <Card className="mt-6">
        <CardTitle className="mb-4">
          <div className="flex items-center gap-2">
            <Award className="h-5 w-5 text-violet-600" />
            Team Leaderboard
          </div>
        </CardTitle>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-left text-sm text-gray-500 border-b">
                <th className="pb-3 font-medium">Rank</th>
                <th className="pb-3 font-medium">Salesperson</th>
                <th className="pb-3 font-medium text-right">Orders</th>
                <th className="pb-3 font-medium text-right">Revenue</th>
                <th className="pb-3 font-medium text-right">Conversion</th>
                <th className="pb-3 font-medium text-right">Resp. Time</th>
                <th className="pb-3 font-medium text-right">Risk Reduction</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {data.team.map((person) => (
                <tr key={person.id} className="hover:bg-gray-50">
                  <td className="py-3">
                    <div className={`flex h-8 w-8 items-center justify-center rounded-full ${
                      person.rank === 1 ? 'bg-amber-100 text-amber-700' :
                      person.rank === 2 ? 'bg-gray-200 text-gray-700' :
                      person.rank === 3 ? 'bg-orange-100 text-orange-700' :
                      'bg-gray-100 text-gray-600'
                    }`}>
                      {person.rank}
                    </div>
                  </td>
                  <td className="py-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-violet-100">
                        <Users className="h-5 w-5 text-violet-600" />
                      </div>
                      <span className="font-medium">{person.name}</span>
                    </div>
                  </td>
                  <td className="py-3 text-right font-medium">{person.orders}</td>
                  <td className="py-3 text-right">{formatCurrency(person.revenue)}</td>
                  <td className="py-3 text-right">
                    <Badge variant={person.conversion >= 35 ? 'success' : 'default'}>
                      {person.conversion}%
                    </Badge>
                  </td>
                  <td className="py-3 text-right">
                    <span className={person.avgResponseTime <= 2 ? 'text-green-600' : 'text-amber-600'}>
                      {person.avgResponseTime}h
                    </span>
                  </td>
                  <td className="py-3 text-right">
                    <span className="text-green-600">↓{person.riskReduction}%</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
        <Card className="text-center bg-green-50">
          <p className="text-3xl font-bold text-green-600">{data.overview.deliveries}</p>
          <p className="text-sm text-gray-600">Deliveries</p>
        </Card>
        <Card className="text-center bg-red-50">
          <p className="text-3xl font-bold text-red-600">{data.overview.cancellations}</p>
          <p className="text-sm text-gray-600">Cancellations</p>
        </Card>
        <Card className="text-center bg-blue-50">
          <p className="text-3xl font-bold text-blue-600">{data.overview.avgFulfillment}%</p>
          <p className="text-sm text-gray-600">Avg Fulfillment</p>
        </Card>
        <Card className="text-center bg-violet-50">
          <p className="text-3xl font-bold text-violet-600">
            {Math.round(data.overview.totalRevenue / data.overview.totalOrders / 1000)}K
          </p>
          <p className="text-sm text-gray-600">Avg Deal Size</p>
        </Card>
      </div>
    </PageContainer>
  );
}
