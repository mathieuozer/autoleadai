'use client';

import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';

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

interface DiscountApprovalCardProps {
  discount: DiscountRequest;
  approverRole: 'BRANCH_MANAGER' | 'ADMIN';
  onApprove: (discountId: string, comment?: string) => void;
  onReject: (discountId: string, reason: string) => void;
  isApproving?: boolean;
  isRejecting?: boolean;
}

export function DiscountApprovalCard({
  discount,
  approverRole,
  onApprove,
  onReject,
  isApproving,
  isRejecting,
}: DiscountApprovalCardProps) {
  const [showActions, setShowActions] = useState(false);
  const [comment, setComment] = useState('');
  const [rejectReason, setRejectReason] = useState('');
  const [actionType, setActionType] = useState<'approve' | 'reject' | null>(null);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-AE', {
      style: 'currency',
      currency: 'AED',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const handleApprove = () => {
    onApprove(discount.id, comment || undefined);
    setActionType(null);
    setComment('');
  };

  const handleReject = () => {
    if (rejectReason.length < 10) return;
    onReject(discount.id, rejectReason);
    setActionType(null);
    setRejectReason('');
  };

  const canApprove = () => {
    if (approverRole === 'BRANCH_MANAGER' && discount.status === 'PENDING_BM') return true;
    if (approverRole === 'ADMIN' && discount.status === 'PENDING_GM') return true;
    return false;
  };

  return (
    <Card className={discount.waitingDays > 2 ? 'border-l-4 border-l-amber-500' : ''}>
      <CardContent className="pt-4">
        <div className="flex items-start justify-between gap-4">
          {/* Left: Customer & Vehicle Info */}
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h4 className="font-semibold text-gray-900">{discount.order.customer.name}</h4>
              <Badge variant={discount.status === 'PENDING_BM' ? 'warning' : 'info'}>
                {discount.status === 'PENDING_BM' ? 'Pending BM' : 'Pending GM'}
              </Badge>
              {discount.waitingDays > 0 && (
                <span className="text-xs text-gray-500">
                  Waiting {discount.waitingDays} day{discount.waitingDays !== 1 ? 's' : ''}
                </span>
              )}
            </div>
            <p className="text-sm text-gray-600">
              {discount.order.vehicle.year} {discount.order.vehicle.make} {discount.order.vehicle.model}
            </p>
            {discount.order.salesperson && (
              <p className="text-xs text-gray-500 mt-1">
                Salesperson: {discount.order.salesperson.name}
              </p>
            )}
          </div>

          {/* Right: Pricing */}
          <div className="text-right">
            <p className="text-sm text-gray-500 line-through">
              {formatCurrency(discount.originalPrice)}
            </p>
            <p className="text-lg font-bold text-green-600">
              {formatCurrency(discount.finalPrice)}
            </p>
            <p className="text-sm text-violet-600">
              -{formatCurrency(discount.requestedDiscount)} ({discount.discountPercentage}%)
            </p>
          </div>
        </div>

        {/* Justification */}
        <div className="mt-3 p-3 bg-gray-50 rounded-lg">
          <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Justification</p>
          <p className="text-sm text-gray-700">{discount.justification}</p>
        </div>

        {/* Actions */}
        {canApprove() && (
          <div className="mt-4">
            {!actionType ? (
              <div className="flex justify-end gap-2">
                <Button
                  size="sm"
                  variant="danger"
                  onClick={() => setActionType('reject')}
                >
                  Reject
                </Button>
                <Button size="sm" onClick={() => setActionType('approve')}>
                  Approve
                </Button>
              </div>
            ) : actionType === 'approve' ? (
              <div className="space-y-3 p-3 bg-green-50 rounded-lg border border-green-200">
                <p className="text-sm font-medium text-green-800">Approve Discount</p>
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Add a comment (optional)"
                  className="w-full px-3 py-2 text-sm rounded-lg border border-green-200 focus:border-green-500 focus:ring-1 focus:ring-green-500 resize-none"
                  rows={2}
                />
                <div className="flex justify-end gap-2">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setActionType(null)}
                  >
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleApprove}
                    isLoading={isApproving}
                  >
                    Confirm Approval
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-3 p-3 bg-red-50 rounded-lg border border-red-200">
                <p className="text-sm font-medium text-red-800">Reject Discount</p>
                <textarea
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="Provide a reason for rejection (required, min 10 characters)"
                  className="w-full px-3 py-2 text-sm rounded-lg border border-red-200 focus:border-red-500 focus:ring-1 focus:ring-red-500 resize-none"
                  rows={2}
                />
                <div className="flex justify-end gap-2">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setActionType(null)}
                  >
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    variant="danger"
                    onClick={handleReject}
                    isLoading={isRejecting}
                    disabled={rejectReason.length < 10}
                  >
                    Confirm Rejection
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
