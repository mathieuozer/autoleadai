'use client';

import { use, useState, useEffect } from 'react';
import Link from 'next/link';
import { PageContainer } from '@/components/layout';
import { Card, CardTitle, Button, Badge, Input, Textarea } from '@/components/ui';
import { ApprovalWorkflowStatus } from '@/components/discounts';
import {
  ArrowLeft,
  Loader2,
  AlertCircle,
  RefreshCw,
  Plus,
  Percent,
  CheckCircle,
  XCircle,
  Clock,
} from 'lucide-react';

interface DiscountRequest {
  id: string;
  status: string;
  originalPrice: number;
  campaignDiscount: number;
  requestedDiscount: number;
  finalPrice: number;
  justification: string;
  currentLevel: number;
  requiredLevel: number;
  requestedAt: string;
  bmApprovedAt: string | null;
  gmApprovedAt: string | null;
  rejectedAt: string | null;
  rejectionReason: string | null;
}

interface OrderDiscountsPageProps {
  params: Promise<{ id: string }>;
}

export default function OrderDiscountsPage({ params }: OrderDiscountsPageProps) {
  const { id: orderId } = use(params);
  const [discounts, setDiscounts] = useState<DiscountRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    originalPrice: '',
    campaignDiscount: '0',
    requestedDiscount: '',
    justification: '',
  });

  const fetchDiscounts = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/orders/${orderId}/discounts`);
      const result = await res.json();

      if (result.success) {
        setDiscounts(result.data);
      } else {
        setError(result.error?.message || 'Failed to fetch discounts');
      }
    } catch (err) {
      setError('Failed to fetch discounts');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDiscounts();
  }, [orderId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const res = await fetch(`/api/orders/${orderId}/discounts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          originalPrice: parseFloat(formData.originalPrice),
          campaignDiscount: parseFloat(formData.campaignDiscount || '0'),
          requestedDiscount: parseFloat(formData.requestedDiscount),
          justification: formData.justification,
          requestedBy: 'current-user-id', // Would come from auth context
        }),
      });

      const result = await res.json();

      if (result.success) {
        setShowForm(false);
        setFormData({
          originalPrice: '',
          campaignDiscount: '0',
          requestedDiscount: '',
          justification: '',
        });
        fetchDiscounts();
      } else {
        alert(result.error?.message || 'Failed to create discount request');
      }
    } catch (err) {
      console.error(err);
      alert('Failed to create discount request');
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-AE', {
      style: 'currency',
      currency: 'AED',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const statusVariant: Record<string, 'default' | 'success' | 'warning' | 'danger' | 'primary'> = {
    DRAFT: 'default',
    PENDING_BM: 'warning',
    PENDING_GM: 'primary',
    APPROVED: 'success',
    REJECTED: 'danger',
  };

  const statusLabels: Record<string, string> = {
    DRAFT: 'Draft',
    PENDING_BM: 'Pending BM',
    PENDING_GM: 'Pending GM',
    APPROVED: 'Approved',
    REJECTED: 'Rejected',
  };

  const hasPendingRequest = discounts.some(d => ['DRAFT', 'PENDING_BM', 'PENDING_GM'].includes(d.status));

  if (isLoading) {
    return (
      <PageContainer title="Discount Requests" subtitle="Loading...">
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-[#7c3aed]" />
        </div>
      </PageContainer>
    );
  }

  if (error) {
    return (
      <PageContainer title="Discount Requests" subtitle="Error loading data">
        <Card className="p-8 text-center">
          <AlertCircle className="mx-auto mb-4 h-12 w-12 text-red-500" />
          <p className="text-red-600 mb-4">{error}</p>
          <Button onClick={fetchDiscounts} variant="outline">
            <RefreshCw className="mr-2 h-4 w-4" />
            Retry
          </Button>
        </Card>
      </PageContainer>
    );
  }

  return (
    <PageContainer
      title="Discount Requests"
      subtitle="Request and track discount approvals"
    >
      <div className="mb-6 flex items-center justify-between">
        <Link href={`/orders/${orderId}`}>
          <Button variant="ghost" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Order
          </Button>
        </Link>
        <div className="flex gap-2">
          <Button onClick={fetchDiscounts} variant="outline" size="sm">
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
          {!hasPendingRequest && (
            <Button onClick={() => setShowForm(true)} size="sm">
              <Plus className="mr-2 h-4 w-4" />
              New Request
            </Button>
          )}
        </div>
      </div>

      {/* Discount Form Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <Card className="w-full max-w-lg">
            <CardTitle className="mb-4">Request Discount</CardTitle>
            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                label="Original Price (AED)"
                type="number"
                value={formData.originalPrice}
                onChange={(e) => setFormData({ ...formData, originalPrice: e.target.value })}
                placeholder="Enter original vehicle price"
                required
              />
              <Input
                label="Campaign Discount (AED)"
                type="number"
                value={formData.campaignDiscount}
                onChange={(e) => setFormData({ ...formData, campaignDiscount: e.target.value })}
                placeholder="Enter any existing campaign discount"
              />
              <Input
                label="Additional Discount Requested (AED)"
                type="number"
                value={formData.requestedDiscount}
                onChange={(e) => setFormData({ ...formData, requestedDiscount: e.target.value })}
                placeholder="Enter additional discount amount"
                required
              />
              {formData.originalPrice && formData.requestedDiscount && (
                <div className="p-3 bg-violet-50 rounded-lg">
                  <p className="text-sm text-violet-700">
                    Discount: {((parseFloat(formData.requestedDiscount) / parseFloat(formData.originalPrice)) * 100).toFixed(1)}%
                  </p>
                  <p className="text-sm font-medium text-violet-900">
                    Final Price: {formatCurrency(
                      parseFloat(formData.originalPrice) -
                      parseFloat(formData.campaignDiscount || '0') -
                      parseFloat(formData.requestedDiscount)
                    )}
                  </p>
                </div>
              )}
              <Textarea
                label="Justification"
                value={formData.justification}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setFormData({ ...formData, justification: e.target.value })}
                placeholder="Explain why this discount is needed (minimum 10 characters)"
                rows={3}
                required
              />
              <div className="flex justify-end gap-3 pt-4">
                <Button type="button" variant="ghost" onClick={() => setShowForm(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    'Submit Request'
                  )}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* Discounts List */}
      <div className="space-y-4">
        {discounts.map((discount) => (
          <Card key={discount.id}>
            <div className="flex items-start justify-between mb-4">
              <div>
                <div className="flex items-center gap-2">
                  <Badge variant={statusVariant[discount.status]}>
                    {statusLabels[discount.status]}
                  </Badge>
                  <span className="text-sm text-gray-500">
                    Requested: {formatDate(discount.requestedAt)}
                  </span>
                </div>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-violet-600">
                  -{formatCurrency(discount.requestedDiscount)}
                </p>
                <p className="text-sm text-gray-500">
                  {Math.round((discount.requestedDiscount / discount.originalPrice) * 100)}% off
                </p>
              </div>
            </div>

            {/* Pricing Details */}
            <div className="grid grid-cols-4 gap-4 py-4 border-t border-b border-gray-100">
              <div>
                <p className="text-xs text-gray-500 uppercase">Original</p>
                <p className="font-medium">{formatCurrency(discount.originalPrice)}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase">Campaign</p>
                <p className="font-medium">-{formatCurrency(discount.campaignDiscount)}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase">Requested</p>
                <p className="font-medium text-violet-600">-{formatCurrency(discount.requestedDiscount)}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase">Final</p>
                <p className="font-bold text-green-600">{formatCurrency(discount.finalPrice)}</p>
              </div>
            </div>

            {/* Justification */}
            <div className="mt-4">
              <p className="text-sm text-gray-600">{discount.justification}</p>
            </div>

            {/* Approval Status */}
            <div className="mt-4">
              <ApprovalWorkflowStatus
                currentLevel={discount.currentLevel}
                requiredLevel={discount.requiredLevel}
                status={discount.status}
                bmApprovedAt={discount.bmApprovedAt}
                gmApprovedAt={discount.gmApprovedAt}
                rejectedAt={discount.rejectedAt}
                rejectionReason={discount.rejectionReason}
              />
            </div>
          </Card>
        ))}

        {discounts.length === 0 && (
          <Card className="text-center py-12">
            <Percent className="mx-auto mb-4 h-12 w-12 text-gray-300" />
            <p className="text-gray-500">No discount requests</p>
            <p className="text-sm text-gray-400 mt-1">Create a request to negotiate pricing</p>
          </Card>
        )}
      </div>
    </PageContainer>
  );
}
