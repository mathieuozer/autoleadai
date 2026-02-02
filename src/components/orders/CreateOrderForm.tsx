'use client';

import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';

interface StockSelection {
  brandId: string;
  brandName: string;
  modelId: string;
  modelName: string;
  year: number;
  variantId: string;
  variantName: string;
  exteriorColorId: string;
  exteriorColorName: string;
  interiorColorId: string;
  interiorColorName: string;
  price: number;
}

interface CreateOrderFormProps {
  selection?: StockSelection;
  customers?: Array<{ id: string; name: string; phone: string }>;
  salespersons?: Array<{ id: string; name: string }>;
  onSubmit: (data: OrderFormData) => void;
  onCancel?: () => void;
  isLoading?: boolean;
}

interface OrderFormData {
  customerId: string;
  vehicleId: string;
  source: string;
  totalAmount: number;
  variantId?: string;
  exteriorColorId?: string;
  interiorColorId?: string;
  salespersonId?: string;
  expectedDeliveryDate?: string;
  bookingAmount?: number;
}

const ORDER_SOURCES = [
  { value: 'WALK_IN', label: 'Walk-in' },
  { value: 'WHATSAPP', label: 'WhatsApp' },
  { value: 'WEBSITE', label: 'Website' },
  { value: 'PHONE', label: 'Phone' },
  { value: 'REFERRAL', label: 'Referral' },
];

export function CreateOrderForm({
  selection,
  customers = [],
  salespersons = [],
  onSubmit,
  onCancel,
  isLoading,
}: CreateOrderFormProps) {
  const [formData, setFormData] = useState({
    customerId: '',
    source: 'WALK_IN',
    salespersonId: '',
    expectedDeliveryDate: '',
    bookingAmount: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.customerId || !selection) {
      return;
    }

    onSubmit({
      customerId: formData.customerId,
      vehicleId: '', // Will be created/linked based on selection
      source: formData.source,
      totalAmount: selection.price,
      variantId: selection.variantId,
      exteriorColorId: selection.exteriorColorId,
      interiorColorId: selection.interiorColorId,
      salespersonId: formData.salespersonId || undefined,
      expectedDeliveryDate: formData.expectedDeliveryDate || undefined,
      bookingAmount: formData.bookingAmount ? parseFloat(formData.bookingAmount) : undefined,
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-AE', {
      style: 'currency',
      currency: 'AED',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Vehicle Summary */}
      {selection && (
        <Card className="bg-gradient-to-r from-violet-50 to-purple-50 border border-violet-100">
          <CardHeader>
            <CardTitle className="text-violet-900">Selected Vehicle</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-500">Vehicle</span>
                <p className="font-medium text-gray-900">
                  {selection.year} {selection.brandName} {selection.modelName}
                </p>
                <p className="text-gray-600">{selection.variantName}</p>
              </div>
              <div>
                <span className="text-gray-500">Color</span>
                <p className="font-medium text-gray-900">
                  {selection.exteriorColorName}
                </p>
                <p className="text-gray-600">{selection.interiorColorName} Interior</p>
              </div>
              <div className="col-span-2">
                <span className="text-gray-500">Price</span>
                <p className="text-2xl font-bold text-violet-700">
                  {formatCurrency(selection.price)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Customer Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Customer Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Select
            label="Customer"
            value={formData.customerId}
            onChange={(e) => setFormData({ ...formData, customerId: e.target.value })}
            required
          >
            <option value="">Select a customer</option>
            {customers.map((customer) => (
              <option key={customer.id} value={customer.id}>
                {customer.name} - {customer.phone}
              </option>
            ))}
          </Select>

          <Select
            label="Order Source"
            value={formData.source}
            onChange={(e) => setFormData({ ...formData, source: e.target.value })}
            required
          >
            {ORDER_SOURCES.map((source) => (
              <option key={source.value} value={source.value}>
                {source.label}
              </option>
            ))}
          </Select>
        </CardContent>
      </Card>

      {/* Assignment & Dates */}
      <Card>
        <CardHeader>
          <CardTitle>Order Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Select
            label="Assigned Salesperson"
            value={formData.salespersonId}
            onChange={(e) => setFormData({ ...formData, salespersonId: e.target.value })}
          >
            <option value="">Select salesperson (optional)</option>
            {salespersons.map((sp) => (
              <option key={sp.id} value={sp.id}>
                {sp.name}
              </option>
            ))}
          </Select>

          <Input
            label="Expected Delivery Date"
            type="date"
            value={formData.expectedDeliveryDate}
            onChange={(e) => setFormData({ ...formData, expectedDeliveryDate: e.target.value })}
            min={new Date().toISOString().split('T')[0]}
          />

          <Input
            label="Booking Amount (Optional)"
            type="number"
            value={formData.bookingAmount}
            onChange={(e) => setFormData({ ...formData, bookingAmount: e.target.value })}
            placeholder="Enter booking amount"
            min={0}
          />
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex justify-end gap-3">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        )}
        <Button type="submit" isLoading={isLoading} disabled={!formData.customerId || !selection}>
          Create Order
        </Button>
      </div>
    </form>
  );
}
