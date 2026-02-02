'use client';

import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';

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
  pdfUrl?: string | null;
}

interface Customer {
  name: string;
  phone: string;
  email?: string;
  address?: string;
}

interface Vehicle {
  brand: string;
  model: string;
  variant?: string;
  year: number;
  exteriorColor?: string;
  interiorColor?: string;
  vin?: string;
}

interface QuotationPreviewProps {
  quotation: Quotation;
  customer: Customer;
  vehicle: Vehicle;
  dealership?: {
    name: string;
    address: string;
    phone: string;
    email: string;
  };
}

export function QuotationPreview({
  quotation,
  customer,
  vehicle,
  dealership,
}: QuotationPreviewProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-AE', {
      style: 'currency',
      currency: 'AED',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { variant: 'success' | 'warning' | 'info' | 'default' | 'danger'; label: string }> = {
      DRAFT: { variant: 'default', label: 'Draft' },
      ISSUED: { variant: 'info', label: 'Issued' },
      SENT: { variant: 'info', label: 'Sent' },
      ACCEPTED: { variant: 'success', label: 'Accepted' },
      EXPIRED: { variant: 'warning', label: 'Expired' },
      CANCELLED: { variant: 'danger', label: 'Cancelled' },
    };
    const config = statusMap[status] || { variant: 'default', label: status };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const isExpired = new Date(quotation.validUntil) < new Date();
  const daysRemaining = Math.ceil(
    (new Date(quotation.validUntil).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
  );

  return (
    <Card className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="p-6 border-b">
        <div className="flex items-start justify-between">
          <div>
            {dealership && (
              <>
                <h2 className="text-xl font-bold text-gray-900">{dealership.name}</h2>
                <p className="text-sm text-gray-500">{dealership.address}</p>
              </>
            )}
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-500">Quotation</p>
            <p className="text-lg font-bold font-mono">{quotation.quotationNumber}</p>
            {getStatusBadge(quotation.status)}
          </div>
        </div>
      </div>

      {/* Dates */}
      <div className="p-6 border-b bg-gray-50 grid grid-cols-2 gap-4">
        <div>
          <p className="text-xs text-gray-500 uppercase tracking-wide">Issue Date</p>
          <p className="font-medium">{formatDate(quotation.issuedAt)}</p>
        </div>
        <div>
          <p className="text-xs text-gray-500 uppercase tracking-wide">Valid Until</p>
          <p className={`font-medium ${isExpired ? 'text-red-600' : ''}`}>
            {formatDate(quotation.validUntil)}
            {!isExpired && daysRemaining > 0 && (
              <span className="text-sm text-gray-500 ml-2">
                ({daysRemaining} day{daysRemaining !== 1 ? 's' : ''} remaining)
              </span>
            )}
          </p>
        </div>
      </div>

      {/* Customer */}
      <div className="p-6 border-b">
        <h3 className="text-xs text-gray-500 uppercase tracking-wide mb-2">Customer</h3>
        <p className="font-medium text-gray-900">{customer.name}</p>
        <p className="text-sm text-gray-600">{customer.phone}</p>
        {customer.email && <p className="text-sm text-gray-600">{customer.email}</p>}
        {customer.address && <p className="text-sm text-gray-600">{customer.address}</p>}
      </div>

      {/* Vehicle */}
      <div className="p-6 border-b">
        <h3 className="text-xs text-gray-500 uppercase tracking-wide mb-2">Vehicle</h3>
        <p className="text-lg font-semibold text-gray-900">
          {vehicle.year} {vehicle.brand} {vehicle.model}
        </p>
        {vehicle.variant && <p className="text-gray-600">{vehicle.variant}</p>}
        <div className="mt-2 grid grid-cols-2 gap-2 text-sm">
          {vehicle.exteriorColor && (
            <div>
              <span className="text-gray-500">Exterior:</span>{' '}
              <span className="font-medium">{vehicle.exteriorColor}</span>
            </div>
          )}
          {vehicle.interiorColor && (
            <div>
              <span className="text-gray-500">Interior:</span>{' '}
              <span className="font-medium">{vehicle.interiorColor}</span>
            </div>
          )}
          {vehicle.vin && (
            <div className="col-span-2">
              <span className="text-gray-500">VIN:</span>{' '}
              <span className="font-mono font-medium">{vehicle.vin}</span>
            </div>
          )}
        </div>
      </div>

      {/* Pricing */}
      <div className="p-6">
        <h3 className="text-xs text-gray-500 uppercase tracking-wide mb-4">Pricing</h3>
        <div className="space-y-2">
          <div className="flex justify-between">
            <span className="text-gray-600">Vehicle Price</span>
            <span className="font-medium">{formatCurrency(quotation.vehiclePrice)}</span>
          </div>
          {quotation.campaignDiscount > 0 && (
            <div className="flex justify-between text-green-600">
              <span>Campaign Discount</span>
              <span>-{formatCurrency(quotation.campaignDiscount)}</span>
            </div>
          )}
          {quotation.additionalDiscount > 0 && (
            <div className="flex justify-between text-violet-600">
              <span>Additional Discount</span>
              <span>-{formatCurrency(quotation.additionalDiscount)}</span>
            </div>
          )}
          {quotation.accessories > 0 && (
            <div className="flex justify-between">
              <span className="text-gray-600">Accessories</span>
              <span>+{formatCurrency(quotation.accessories)}</span>
            </div>
          )}
          {quotation.fees > 0 && (
            <div className="flex justify-between">
              <span className="text-gray-600">Fees</span>
              <span>+{formatCurrency(quotation.fees)}</span>
            </div>
          )}
          <div className="flex justify-between pt-4 mt-4 border-t border-gray-200">
            <span className="text-lg font-bold">Total Amount</span>
            <span className="text-2xl font-bold text-violet-600">
              {formatCurrency(quotation.totalAmount)}
            </span>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="p-4 bg-gray-50 border-t text-center">
        <p className="text-xs text-gray-500">
          This quotation is valid until {formatDate(quotation.validUntil)}.
          Prices are subject to change after this date.
        </p>
      </div>
    </Card>
  );
}
