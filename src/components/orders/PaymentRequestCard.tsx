'use client';

import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Badge } from '@/components/ui/Badge';

interface PaymentRequest {
  id: string;
  type: string;
  status: string;
  amount: number;
  currency: string;
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

interface PaymentRequestCardProps {
  orderId: string;
  payments: PaymentRequest[];
  summary: PaymentSummary;
  onCreatePayment: (data: { type: string; amount: number }) => void;
  onCompletePayment: (paymentId: string, data: { paymentMethod: string; reference?: string }) => void;
  isCreating?: boolean;
  isCompleting?: boolean;
}

const PAYMENT_TYPES = [
  { value: 'DOWN_PAYMENT', label: 'Down Payment' },
  { value: 'FULL_PAYMENT', label: 'Full Payment' },
  { value: 'INSTALLMENT', label: 'Installment' },
];

const PAYMENT_METHODS = [
  { value: 'CASH', label: 'Cash' },
  { value: 'CARD', label: 'Card' },
  { value: 'BANK_TRANSFER', label: 'Bank Transfer' },
];

export function PaymentRequestCard({
  orderId,
  payments,
  summary,
  onCreatePayment,
  onCompletePayment,
  isCreating,
  isCompleting,
}: PaymentRequestCardProps) {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [completingId, setCompletingId] = useState<string | null>(null);
  const [newPayment, setNewPayment] = useState({ type: 'DOWN_PAYMENT', amount: '' });
  const [completeData, setCompleteData] = useState({ paymentMethod: 'CARD', reference: '' });

  const formatCurrency = (amount: number, currency: string = 'AED') => {
    return new Intl.NumberFormat('en-AE', {
      style: 'currency',
      currency,
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return <Badge variant="success">Completed</Badge>;
      case 'PENDING':
        return <Badge variant="warning">Pending</Badge>;
      case 'REQUESTED':
        return <Badge variant="info">Requested</Badge>;
      case 'FAILED':
        return <Badge variant="danger">Failed</Badge>;
      case 'REFUNDED':
        return <Badge variant="default">Refunded</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const handleCreate = () => {
    if (newPayment.amount) {
      onCreatePayment({
        type: newPayment.type,
        amount: parseFloat(newPayment.amount),
      });
      setShowCreateForm(false);
      setNewPayment({ type: 'DOWN_PAYMENT', amount: '' });
    }
  };

  const handleComplete = (paymentId: string) => {
    onCompletePayment(paymentId, {
      paymentMethod: completeData.paymentMethod,
      reference: completeData.reference || undefined,
    });
    setCompletingId(null);
    setCompleteData({ paymentMethod: 'CARD', reference: '' });
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Payments</CardTitle>
        <Button size="sm" onClick={() => setShowCreateForm(!showCreateForm)}>
          {showCreateForm ? 'Cancel' : 'Request Payment'}
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Summary */}
        <div className="grid grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg">
          <div>
            <p className="text-xs text-gray-500">Total Requested</p>
            <p className="text-lg font-semibold">{formatCurrency(summary.totalRequested)}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Completed</p>
            <p className="text-lg font-semibold text-green-600">
              {formatCurrency(summary.totalCompleted)}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Pending</p>
            <p className="text-lg font-semibold text-amber-600">
              {summary.pendingPayments} request{summary.pendingPayments !== 1 ? 's' : ''}
            </p>
          </div>
        </div>

        {/* Create Form */}
        {showCreateForm && (
          <div className="p-4 border border-violet-200 rounded-lg bg-violet-50 space-y-3">
            <h4 className="font-medium text-violet-900">New Payment Request</h4>
            <div className="grid grid-cols-2 gap-3">
              <Select
                value={newPayment.type}
                onChange={(e) => setNewPayment({ ...newPayment, type: e.target.value })}
              >
                {PAYMENT_TYPES.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </Select>
              <Input
                type="number"
                placeholder="Amount"
                value={newPayment.amount}
                onChange={(e) => setNewPayment({ ...newPayment, amount: e.target.value })}
                min={0}
              />
            </div>
            <div className="flex justify-end">
              <Button size="sm" onClick={handleCreate} isLoading={isCreating}>
                Create Request
              </Button>
            </div>
          </div>
        )}

        {/* Payment List */}
        <div className="space-y-3">
          {payments.map((payment) => (
            <div
              key={payment.id}
              className="flex items-center justify-between p-3 border rounded-lg"
            >
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-medium">{payment.type.replace('_', ' ')}</span>
                  {getStatusBadge(payment.status)}
                </div>
                <p className="text-sm text-gray-500">
                  Requested: {new Date(payment.requestedAt).toLocaleDateString()}
                  {payment.paidAt && ` • Paid: ${new Date(payment.paidAt).toLocaleDateString()}`}
                </p>
              </div>
              <div className="text-right">
                <p className="text-lg font-semibold">
                  {formatCurrency(payment.amount, payment.currency)}
                </p>
                {(payment.status === 'PENDING' || payment.status === 'REQUESTED') && (
                  <>
                    {completingId === payment.id ? (
                      <div className="mt-2 space-y-2">
                        <Select
                          value={completeData.paymentMethod}
                          onChange={(e) =>
                            setCompleteData({ ...completeData, paymentMethod: e.target.value })
                          }
                        >
                          {PAYMENT_METHODS.map((method) => (
                            <option key={method.value} value={method.value}>
                              {method.label}
                            </option>
                          ))}
                        </Select>
                        <Input
                          placeholder="Reference (optional)"
                          value={completeData.reference}
                          onChange={(e) =>
                            setCompleteData({ ...completeData, reference: e.target.value })
                          }
                        />
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setCompletingId(null)}
                          >
                            Cancel
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => handleComplete(payment.id)}
                            isLoading={isCompleting}
                          >
                            Confirm
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setCompletingId(payment.id)}
                      >
                        Mark Complete
                      </Button>
                    )}
                  </>
                )}
              </div>
            </div>
          ))}

          {payments.length === 0 && (
            <p className="text-center text-gray-500 py-4">No payment requests yet</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
