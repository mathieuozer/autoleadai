'use client';

import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { DiscountApprovalCard } from './DiscountApprovalCard';

interface DiscountRequest {
  id: string;
  orderId: string;
  status: string;
  originalPrice: number;
  campaignDiscount: number;
  requestedDiscount: number;
  finalPrice: number;
  justification: string;
  currentLevel: number;
  requiredLevel: number;
  requestedBy: string;
  requestedAt: string;
  discountPercentage: number;
  waitingDays: number;
  order: {
    customer: {
      name: string;
      phone: string;
    };
    vehicle: {
      make: string;
      model: string;
      year: number;
    };
    salesperson?: {
      name: string;
    };
  };
}

interface Stats {
  pendingBM: number;
  pendingGM: number;
  totalPendingValue: number;
}

interface PendingApprovalsListProps {
  discounts: DiscountRequest[];
  stats: Stats;
  approverRole: 'BRANCH_MANAGER' | 'ADMIN';
  onApprove: (discountId: string, comment?: string) => void;
  onReject: (discountId: string, reason: string) => void;
  isLoading?: boolean;
  approvingId?: string | null;
  rejectingId?: string | null;
}

export function PendingApprovalsList({
  discounts,
  stats,
  approverRole,
  onApprove,
  onReject,
  isLoading,
  approvingId,
  rejectingId,
}: PendingApprovalsListProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-AE', {
      style: 'currency',
      currency: 'AED',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-40 bg-gray-100 rounded-xl animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-4">
            <p className="text-sm text-gray-500">Pending BM</p>
            <p className="text-2xl font-bold text-amber-600">{stats.pendingBM}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-sm text-gray-500">Pending GM</p>
            <p className="text-2xl font-bold text-violet-600">{stats.pendingGM}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-sm text-gray-500">Total Value</p>
            <p className="text-2xl font-bold">{formatCurrency(stats.totalPendingValue)}</p>
          </CardContent>
        </Card>
      </div>

      {/* Role Filter Info */}
      <div className="flex items-center gap-2">
        <span className="text-sm text-gray-600">Showing requests for:</span>
        <Badge variant={approverRole === 'BRANCH_MANAGER' ? 'warning' : 'info'}>
          {approverRole === 'BRANCH_MANAGER' ? 'Branch Manager' : 'General Manager'}
        </Badge>
      </div>

      {/* Discount List */}
      <div className="space-y-4">
        {discounts.map((discount) => (
          <DiscountApprovalCard
            key={discount.id}
            discount={discount}
            approverRole={approverRole}
            onApprove={onApprove}
            onReject={onReject}
            isApproving={approvingId === discount.id}
            isRejecting={rejectingId === discount.id}
          />
        ))}

        {discounts.length === 0 && (
          <Card className="text-center py-12">
            <div className="text-gray-400 mb-2">
              <svg
                className="h-12 w-12 mx-auto"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <p className="text-gray-500">No pending approvals</p>
            <p className="text-sm text-gray-400 mt-1">
              All discount requests have been processed
            </p>
          </Card>
        )}
      </div>
    </div>
  );
}
