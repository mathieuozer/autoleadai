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
  FileText,
  Download,
  Send,
  Eye,
} from 'lucide-react';

interface Quotation {
  id: string;
  quotationNumber: string;
  status: string;
  vehiclePrice: number;
  campaignDiscount: number;
  additionalDiscount: number;
  accessories: number;
  fees: number;
  totalAmount: number;
  validUntil: string;
  issuedAt: string;
  sentAt: string | null;
  acceptedAt: string | null;
}

interface OrderQuotationsPageProps {
  params: Promise<{ id: string }>;
}

export default function OrderQuotationsPage({ params }: OrderQuotationsPageProps) {
  const { id: orderId } = use(params);
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    vehiclePrice: '',
    campaignDiscount: '0',
    additionalDiscount: '0',
    accessories: '0',
    fees: '0',
    validityDays: '7',
  });

  const fetchQuotations = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/orders/${orderId}/quotations`);
      const result = await res.json();

      if (result.success) {
        setQuotations(result.data);
      } else {
        setError(result.error?.message || 'Failed to fetch quotations');
      }
    } catch (err) {
      setError('Failed to fetch quotations');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchQuotations();
  }, [orderId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const res = await fetch(`/api/orders/${orderId}/quotations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          vehiclePrice: parseFloat(formData.vehiclePrice),
          campaignDiscount: parseFloat(formData.campaignDiscount || '0'),
          additionalDiscount: parseFloat(formData.additionalDiscount || '0'),
          accessories: parseFloat(formData.accessories || '0'),
          fees: parseFloat(formData.fees || '0'),
          validityDays: parseInt(formData.validityDays || '7'),
          issuedBy: 'current-user-id', // Would come from auth context
        }),
      });

      const result = await res.json();

      if (result.success) {
        setShowForm(false);
        setFormData({
          vehiclePrice: '',
          campaignDiscount: '0',
          additionalDiscount: '0',
          accessories: '0',
          fees: '0',
          validityDays: '7',
        });
        fetchQuotations();
      } else {
        alert(result.error?.message || 'Failed to create quotation');
      }
    } catch (err) {
      console.error(err);
      alert('Failed to create quotation');
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

  const calculateTotal = () => {
    const vp = parseFloat(formData.vehiclePrice || '0');
    const cd = parseFloat(formData.campaignDiscount || '0');
    const ad = parseFloat(formData.additionalDiscount || '0');
    const acc = parseFloat(formData.accessories || '0');
    const fee = parseFloat(formData.fees || '0');
    return vp - cd - ad + acc + fee;
  };

  const statusVariant: Record<string, 'default' | 'success' | 'warning' | 'danger' | 'primary'> = {
    DRAFT: 'default',
    SENT: 'primary',
    VIEWED: 'primary',
    ACCEPTED: 'success',
    REJECTED: 'danger',
    EXPIRED: 'warning',
  };

  const isExpired = (validUntil: string) => {
    return new Date(validUntil) < new Date();
  };

  if (isLoading) {
    return (
      <PageContainer title="Quotations" subtitle="Loading...">
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-[#7c3aed]" />
        </div>
      </PageContainer>
    );
  }

  if (error) {
    return (
      <PageContainer title="Quotations" subtitle="Error loading data">
        <Card className="p-8 text-center">
          <AlertCircle className="mx-auto mb-4 h-12 w-12 text-red-500" />
          <p className="text-red-600 mb-4">{error}</p>
          <Button onClick={fetchQuotations} variant="outline">
            <RefreshCw className="mr-2 h-4 w-4" />
            Retry
          </Button>
        </Card>
      </PageContainer>
    );
  }

  return (
    <PageContainer
      title="Quotations"
      subtitle="Create and manage price quotations"
    >
      <div className="mb-6 flex items-center justify-between">
        <Link href={`/orders/${orderId}`}>
          <Button variant="ghost" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Order
          </Button>
        </Link>
        <div className="flex gap-2">
          <Button onClick={fetchQuotations} variant="outline" size="sm">
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
          <Button onClick={() => setShowForm(true)} size="sm">
            <Plus className="mr-2 h-4 w-4" />
            New Quotation
          </Button>
        </div>
      </div>

      {/* Quotation Form Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 overflow-auto">
          <Card className="w-full max-w-lg my-8">
            <CardTitle className="mb-4">Create Quotation</CardTitle>
            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                label="Vehicle Price (AED)"
                type="number"
                value={formData.vehiclePrice}
                onChange={(e) => setFormData({ ...formData, vehiclePrice: e.target.value })}
                placeholder="Enter vehicle base price"
                required
              />
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Campaign Discount"
                  type="number"
                  value={formData.campaignDiscount}
                  onChange={(e) => setFormData({ ...formData, campaignDiscount: e.target.value })}
                  placeholder="0"
                />
                <Input
                  label="Additional Discount"
                  type="number"
                  value={formData.additionalDiscount}
                  onChange={(e) => setFormData({ ...formData, additionalDiscount: e.target.value })}
                  placeholder="0"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Accessories"
                  type="number"
                  value={formData.accessories}
                  onChange={(e) => setFormData({ ...formData, accessories: e.target.value })}
                  placeholder="0"
                />
                <Input
                  label="Fees"
                  type="number"
                  value={formData.fees}
                  onChange={(e) => setFormData({ ...formData, fees: e.target.value })}
                  placeholder="0"
                />
              </div>
              <Select
                label="Valid For"
                value={formData.validityDays}
                onChange={(e) => setFormData({ ...formData, validityDays: e.target.value })}
              >
                <option value="3">3 days</option>
                <option value="7">7 days</option>
                <option value="14">14 days</option>
                <option value="30">30 days</option>
              </Select>

              {formData.vehiclePrice && (
                <div className="p-4 bg-violet-50 rounded-lg">
                  <div className="flex justify-between text-sm mb-1">
                    <span>Vehicle Price</span>
                    <span>{formatCurrency(parseFloat(formData.vehiclePrice || '0'))}</span>
                  </div>
                  {parseFloat(formData.campaignDiscount || '0') > 0 && (
                    <div className="flex justify-between text-sm mb-1 text-green-600">
                      <span>Campaign Discount</span>
                      <span>-{formatCurrency(parseFloat(formData.campaignDiscount))}</span>
                    </div>
                  )}
                  {parseFloat(formData.additionalDiscount || '0') > 0 && (
                    <div className="flex justify-between text-sm mb-1 text-green-600">
                      <span>Additional Discount</span>
                      <span>-{formatCurrency(parseFloat(formData.additionalDiscount))}</span>
                    </div>
                  )}
                  {parseFloat(formData.accessories || '0') > 0 && (
                    <div className="flex justify-between text-sm mb-1">
                      <span>Accessories</span>
                      <span>+{formatCurrency(parseFloat(formData.accessories))}</span>
                    </div>
                  )}
                  {parseFloat(formData.fees || '0') > 0 && (
                    <div className="flex justify-between text-sm mb-1">
                      <span>Fees</span>
                      <span>+{formatCurrency(parseFloat(formData.fees))}</span>
                    </div>
                  )}
                  <div className="flex justify-between font-bold text-lg mt-2 pt-2 border-t border-violet-200">
                    <span>Total</span>
                    <span>{formatCurrency(calculateTotal())}</span>
                  </div>
                </div>
              )}

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
                    'Create Quotation'
                  )}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* Quotations List */}
      <div className="space-y-4">
        {quotations.map((quotation) => (
          <Card key={quotation.id}>
            <div className="flex items-start justify-between mb-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono font-medium">{quotation.quotationNumber}</span>
                  <Badge variant={isExpired(quotation.validUntil) && quotation.status !== 'ACCEPTED' ? 'warning' : statusVariant[quotation.status]}>
                    {isExpired(quotation.validUntil) && quotation.status !== 'ACCEPTED' ? 'EXPIRED' : quotation.status}
                  </Badge>
                </div>
                <p className="text-sm text-gray-500 mt-1">
                  Issued: {formatDate(quotation.issuedAt)} | Valid until: {formatDate(quotation.validUntil)}
                </p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold">{formatCurrency(quotation.totalAmount)}</p>
              </div>
            </div>

            {/* Pricing Breakdown */}
            <div className="grid grid-cols-5 gap-4 py-4 border-t border-b border-gray-100 text-sm">
              <div>
                <p className="text-xs text-gray-500 uppercase">Vehicle</p>
                <p className="font-medium">{formatCurrency(quotation.vehiclePrice)}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase">Campaign</p>
                <p className="font-medium text-green-600">-{formatCurrency(quotation.campaignDiscount)}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase">Discount</p>
                <p className="font-medium text-green-600">-{formatCurrency(quotation.additionalDiscount)}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase">Accessories</p>
                <p className="font-medium">{formatCurrency(quotation.accessories)}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase">Fees</p>
                <p className="font-medium">{formatCurrency(quotation.fees)}</p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-2 mt-4">
              <Button variant="outline" size="sm">
                <Eye className="mr-2 h-4 w-4" />
                Preview
              </Button>
              <Button variant="outline" size="sm">
                <Download className="mr-2 h-4 w-4" />
                Download
              </Button>
              {quotation.status === 'DRAFT' && (
                <Button size="sm">
                  <Send className="mr-2 h-4 w-4" />
                  Send to Customer
                </Button>
              )}
            </div>
          </Card>
        ))}

        {quotations.length === 0 && (
          <Card className="text-center py-12">
            <FileText className="mx-auto mb-4 h-12 w-12 text-gray-300" />
            <p className="text-gray-500">No quotations created</p>
            <p className="text-sm text-gray-400 mt-1">Create a quotation to share pricing with the customer</p>
          </Card>
        )}
      </div>
    </PageContainer>
  );
}
