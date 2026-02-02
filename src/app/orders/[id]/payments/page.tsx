'use client';

import { use, useState, useEffect } from 'react';
import Link from 'next/link';
import { PageContainer } from '@/components/layout';
import { Card, CardTitle, Button, Badge, Input, Select } from '@/components/ui';
import {
  ArrowLeft,
  Loader2,
  AlertCircle,
  RefreshCw,
  Plus,
  CheckCircle,
  Clock,
  CreditCard,
} from 'lucide-react';

interface Payment {
  id: string;
  type: string;
  amount: number;
  currency: string;
  status: string;
  paymentMethod: string | null;
  reference: string | null;
  requestedAt: string;
  paidAt: string | null;
}

interface PaymentSummary {
  totalRequested: number;
  totalCompleted: number;
  pendingPayments: number;
}

interface PaymentsData {
  payments: Payment[];
  summary: PaymentSummary;
}

interface OrderPaymentsPageProps {
  params: Promise<{ id: string }>;
}

export default function OrderPaymentsPage({ params }: OrderPaymentsPageProps) {
  const { id: orderId } = use(params);
  const [data, setData] = useState<PaymentsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    type: 'DOWN_PAYMENT',
    amount: '',
    currency: 'AED',
  });

  const fetchPayments = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/orders/${orderId}/payments`);
      const result = await res.json();

      if (result.success) {
        setData(result.data);
      } else {
        setError(result.error?.message || 'Failed to fetch payments');
      }
    } catch (err) {
      setError('Failed to fetch payments');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPayments();
  }, [orderId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const res = await fetch(`/api/orders/${orderId}/payments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          amount: parseFloat(formData.amount),
          requestedBy: 'current-user-id', // Would come from auth context
        }),
      });

      const result = await res.json();

      if (result.success) {
        setShowForm(false);
        setFormData({ type: 'DOWN_PAYMENT', amount: '', currency: 'AED' });
        fetchPayments();
      } else {
        alert(result.error?.message || 'Failed to create payment');
      }
    } catch (err) {
      console.error(err);
      alert('Failed to create payment');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCompletePayment = async (paymentId: string) => {
    try {
      const res = await fetch(`/api/payments/${paymentId}/complete`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          paymentMethod: 'CASH',
          processedBy: 'current-user-id',
        }),
      });

      const result = await res.json();

      if (result.success) {
        fetchPayments();
      } else {
        alert(result.error?.message || 'Failed to complete payment');
      }
    } catch (err) {
      console.error(err);
      alert('Failed to complete payment');
    }
  };

  const formatCurrency = (amount: number, currency: string = 'AED') => {
    return new Intl.NumberFormat('en-AE', {
      style: 'currency',
      currency,
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

  const statusVariant: Record<string, 'default' | 'success' | 'warning' | 'danger'> = {
    PENDING: 'warning',
    REQUESTED: 'warning',
    COMPLETED: 'success',
    REFUNDED: 'danger',
  };

  if (isLoading) {
    return (
      <PageContainer title="Order Payments" subtitle="Loading...">
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-[#7c3aed]" />
        </div>
      </PageContainer>
    );
  }

  if (error) {
    return (
      <PageContainer title="Order Payments" subtitle="Error loading data">
        <Card className="p-8 text-center">
          <AlertCircle className="mx-auto mb-4 h-12 w-12 text-red-500" />
          <p className="text-red-600 mb-4">{error}</p>
          <Button onClick={fetchPayments} variant="outline">
            <RefreshCw className="mr-2 h-4 w-4" />
            Retry
          </Button>
        </Card>
      </PageContainer>
    );
  }

  return (
    <PageContainer
      title="Order Payments"
      subtitle="Manage payment requests and records"
    >
      <div className="mb-6 flex items-center justify-between">
        <Link href={`/orders/${orderId}`}>
          <Button variant="ghost" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Order
          </Button>
        </Link>
        <div className="flex gap-2">
          <Button onClick={fetchPayments} variant="outline" size="sm">
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
          <Button onClick={() => setShowForm(true)} size="sm">
            <Plus className="mr-2 h-4 w-4" />
            Request Payment
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      {data && (
        <div className="grid grid-cols-3 gap-4 mb-6">
          <Card>
            <div className="text-center">
              <p className="text-sm text-gray-500">Total Requested</p>
              <p className="text-2xl font-bold">{formatCurrency(data.summary.totalRequested)}</p>
            </div>
          </Card>
          <Card>
            <div className="text-center">
              <p className="text-sm text-gray-500">Completed</p>
              <p className="text-2xl font-bold text-green-600">{formatCurrency(data.summary.totalCompleted)}</p>
            </div>
          </Card>
          <Card>
            <div className="text-center">
              <p className="text-sm text-gray-500">Pending</p>
              <p className="text-2xl font-bold text-amber-600">{data.summary.pendingPayments}</p>
            </div>
          </Card>
        </div>
      )}

      {/* Payment Form Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <Card className="w-full max-w-md">
            <CardTitle className="mb-4">Request Payment</CardTitle>
            <form onSubmit={handleSubmit} className="space-y-4">
              <Select
                label="Payment Type"
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
              >
                <option value="DOWN_PAYMENT">Down Payment</option>
                <option value="FULL_PAYMENT">Full Payment</option>
                <option value="PARTIAL_PAYMENT">Partial Payment</option>
                <option value="ACCESSORY">Accessory Payment</option>
                <option value="INSURANCE">Insurance</option>
                <option value="REGISTRATION">Registration</option>
              </Select>
              <Input
                label="Amount"
                type="number"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                placeholder="Enter amount"
                required
              />
              <Select
                label="Currency"
                value={formData.currency}
                onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
              >
                <option value="AED">AED</option>
                <option value="USD">USD</option>
              </Select>
              <div className="flex justify-end gap-3 pt-4">
                <Button type="button" variant="ghost" onClick={() => setShowForm(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    'Create Request'
                  )}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* Payments List */}
      <div className="space-y-4">
        {data?.payments.map((payment) => (
          <Card key={payment.id}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className={`flex h-10 w-10 items-center justify-center rounded-full ${
                  payment.status === 'COMPLETED' ? 'bg-green-100' : 'bg-amber-100'
                }`}>
                  {payment.status === 'COMPLETED' ? (
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  ) : (
                    <Clock className="h-5 w-5 text-amber-600" />
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{payment.type.replace(/_/g, ' ')}</span>
                    <Badge variant={statusVariant[payment.status]}>{payment.status}</Badge>
                  </div>
                  <p className="text-sm text-gray-500">
                    Requested: {formatDate(payment.requestedAt)}
                    {payment.paidAt && ` | Paid: ${formatDate(payment.paidAt)}`}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <p className="text-xl font-bold">{formatCurrency(payment.amount, payment.currency)}</p>
                {payment.status === 'PENDING' && (
                  <Button
                    size="sm"
                    onClick={() => handleCompletePayment(payment.id)}
                  >
                    <CreditCard className="mr-2 h-4 w-4" />
                    Mark Paid
                  </Button>
                )}
              </div>
            </div>
          </Card>
        ))}

        {data?.payments.length === 0 && (
          <Card className="text-center py-12">
            <CreditCard className="mx-auto mb-4 h-12 w-12 text-gray-300" />
            <p className="text-gray-500">No payments recorded</p>
            <p className="text-sm text-gray-400 mt-1">Create a payment request to get started</p>
          </Card>
        )}
      </div>
    </PageContainer>
  );
}
