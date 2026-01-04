'use client';

import { PageContainer } from '@/components/layout';
import { Card, CardTitle } from '@/components/ui';
import { PriorityListItem } from '@/components/ai';
import { AlertCircle, Phone, MessageSquare, TrendingUp, DollarSign } from 'lucide-react';
import {
  mockOrders,
  generatePriorityList,
  getTodayActions,
  calculateAggregateStats,
} from '@/lib';

// Generate priority list from mock data
const priorityList = generatePriorityList(mockOrders);
const todayActions = getTodayActions(priorityList.items);
const stats = calculateAggregateStats(priorityList.items);

// Format currency
function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-AE', {
    style: 'currency',
    currency: 'AED',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

export default function DashboardPage() {
  const { summary } = priorityList;

  return (
    <PageContainer
      title="Good morning!"
      subtitle={`Here's what you need to focus on today — ${new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}`}
    >
      {/* Summary Cards */}
      <div className="mb-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <SummaryCard
          label="High Risk Orders"
          value={summary.highRisk}
          icon={<AlertCircle className="h-5 w-5 text-red-500" />}
          bgColor="bg-red-50"
          trend={summary.highRisk > 0 ? 'attention' : 'good'}
        />
        <SummaryCard
          label="Actions Today"
          value={todayActions.length}
          icon={<Phone className="h-5 w-5 text-blue-500" />}
          bgColor="bg-blue-50"
        />
        <SummaryCard
          label="At-Risk Value"
          value={formatCurrency(stats.atRiskOrderValue)}
          icon={<DollarSign className="h-5 w-5 text-orange-500" />}
          bgColor="bg-orange-50"
          subtitle="needs attention"
        />
        <SummaryCard
          label="Avg. Fulfillment"
          value={`${stats.averageFulfillmentProbability}%`}
          icon={<TrendingUp className="h-5 w-5 text-green-500" />}
          bgColor="bg-green-50"
        />
      </div>

      {/* Risk Summary Pills */}
      <div className="mb-6 flex flex-wrap gap-3">
        <RiskPill label="High Risk" count={summary.highRisk} color="red" />
        <RiskPill label="Medium Risk" count={summary.mediumRisk} color="orange" />
        <RiskPill label="Low Risk" count={summary.lowRisk} color="green" />
        <div className="ml-auto text-sm text-gray-500">
          {priorityList.items.length} active orders
        </div>
      </div>

      {/* Priority List */}
      <Card padding="none">
        <div className="border-b border-gray-100 p-6">
          <CardTitle>Today&apos;s Priority List</CardTitle>
          <p className="mt-1 text-sm text-gray-500">
            Orders ranked by AI risk score with recommended actions
          </p>
        </div>

        <div className="divide-y divide-gray-100">
          {priorityList.items.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <MessageSquare className="mx-auto mb-3 h-12 w-12 text-gray-300" />
              <p className="font-medium">No active orders</p>
              <p className="text-sm">All orders are either delivered or cancelled.</p>
            </div>
          ) : (
            priorityList.items.map((item) => (
              <div key={item.id} className="p-4">
                <PriorityListItem
                  item={item}
                  onTakeAction={() => {
                    // In a real app, this would open a modal or navigate
                    console.log('Take action on:', item.orderId);
                  }}
                  onViewDetails={() => {
                    // In a real app, this would navigate to order details
                    console.log('View details for:', item.orderId);
                  }}
                />
              </div>
            ))
          )}
        </div>
      </Card>

      {/* Quick Stats Footer */}
      <div className="mt-8 rounded-lg bg-blue-50 p-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-blue-800">
              Total Pipeline Value
            </p>
            <p className="text-2xl font-bold text-blue-900">
              {formatCurrency(stats.totalOrderValue)}
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm text-blue-700">
              Average Risk Score: <span className="font-semibold">{stats.averageRiskScore}</span>
            </p>
            <p className="text-xs text-blue-600">
              Generated at {new Date(priorityList.generatedAt).toLocaleTimeString()}
            </p>
          </div>
        </div>
      </div>
    </PageContainer>
  );
}

function SummaryCard({
  label,
  value,
  icon,
  bgColor,
  subtitle,
  trend,
}: {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  bgColor: string;
  subtitle?: string;
  trend?: 'good' | 'attention';
}) {
  return (
    <Card className="flex items-center gap-4">
      <div className={`flex h-12 w-12 items-center justify-center rounded-lg ${bgColor}`}>
        {icon}
      </div>
      <div>
        <p className={`text-2xl font-bold ${trend === 'attention' ? 'text-red-600' : 'text-gray-900'}`}>
          {value}
        </p>
        <p className="text-sm text-gray-500">{label}</p>
        {subtitle && <p className="text-xs text-gray-400">{subtitle}</p>}
      </div>
    </Card>
  );
}

function RiskPill({
  label,
  count,
  color,
}: {
  label: string;
  count: number;
  color: 'red' | 'orange' | 'green';
}) {
  const colors = {
    red: 'bg-red-100 text-red-700 border-red-200',
    orange: 'bg-orange-100 text-orange-700 border-orange-200',
    green: 'bg-green-100 text-green-700 border-green-200',
  };

  return (
    <div className={`flex items-center gap-2 rounded-full border px-3 py-1 text-sm ${colors[color]}`}>
      <span className="font-medium">{count}</span>
      <span>{label}</span>
    </div>
  );
}
