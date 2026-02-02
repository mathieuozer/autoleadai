'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { PageContainer } from '@/components/layout';
import { Card, Button } from '@/components/ui';
import { PendingApprovalsList } from '@/components/discounts';
import { ArrowLeft, Loader2, AlertCircle, RefreshCw } from 'lucide-react';

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

interface DiscountsData {
  discounts: DiscountRequest[];
  stats: {
    pendingBM: number;
    pendingGM: number;
    totalPendingValue: number;
  };
}

export default function DiscountApprovalsPage() {
  const [data, setData] = useState<DiscountsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [approverRole, setApproverRole] = useState<'BRANCH_MANAGER' | 'ADMIN'>('BRANCH_MANAGER');
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [actionType, setActionType] = useState<'approve' | 'reject' | null>(null);

  const fetchData = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/discounts/pending?approverRole=${approverRole}`);
      const result = await res.json();

      if (result.success) {
        setData(result.data);
      } else {
        setError(result.error?.message || 'Failed to fetch pending discounts');
      }
    } catch (err) {
      setError('Failed to fetch pending discounts');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [approverRole]);

  const handleApprove = async (discountId: string, comment?: string) => {
    setProcessingId(discountId);
    setActionType('approve');

    try {
      const res = await fetch(`/api/discounts/${discountId}/approve`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          approvedBy: 'current-user-id', // Would come from auth context
          comment,
          approverRole,
        }),
      });

      const result = await res.json();

      if (result.success) {
        // Refresh the list
        fetchData();
      } else {
        alert(result.error?.message || 'Failed to approve discount');
      }
    } catch (err) {
      console.error('Error approving discount:', err);
      alert('Failed to approve discount');
    } finally {
      setProcessingId(null);
      setActionType(null);
    }
  };

  const handleReject = async (discountId: string, reason: string) => {
    setProcessingId(discountId);
    setActionType('reject');

    try {
      const res = await fetch(`/api/discounts/${discountId}/reject`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rejectedBy: 'current-user-id', // Would come from auth context
          reason,
        }),
      });

      const result = await res.json();

      if (result.success) {
        // Refresh the list
        fetchData();
      } else {
        alert(result.error?.message || 'Failed to reject discount');
      }
    } catch (err) {
      console.error('Error rejecting discount:', err);
      alert('Failed to reject discount');
    } finally {
      setProcessingId(null);
      setActionType(null);
    }
  };

  if (isLoading) {
    return (
      <PageContainer title="Discount Approvals" subtitle="Loading...">
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-[#7c3aed]" />
        </div>
      </PageContainer>
    );
  }

  if (error) {
    return (
      <PageContainer title="Discount Approvals" subtitle="Error loading data">
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
      title="Discount Approvals"
      subtitle="Review and approve discount requests"
    >
      <div className="mb-6 flex items-center justify-between">
        <Link href="/dashboard">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Button>
        </Link>
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-500">View as:</span>
          <select
            value={approverRole}
            onChange={(e) => setApproverRole(e.target.value as 'BRANCH_MANAGER' | 'ADMIN')}
            className="px-3 py-1.5 text-sm border rounded-lg focus:border-violet-500 focus:ring-1 focus:ring-violet-500"
          >
            <option value="BRANCH_MANAGER">Branch Manager</option>
            <option value="ADMIN">General Manager</option>
          </select>
          <Button onClick={fetchData} variant="outline" size="sm">
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
        </div>
      </div>

      {data && (
        <PendingApprovalsList
          discounts={data.discounts}
          stats={data.stats}
          approverRole={approverRole}
          onApprove={handleApprove}
          onReject={handleReject}
          approvingId={actionType === 'approve' ? processingId : null}
          rejectingId={actionType === 'reject' ? processingId : null}
        />
      )}
    </PageContainer>
  );
}
