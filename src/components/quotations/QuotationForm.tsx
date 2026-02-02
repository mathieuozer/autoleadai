'use client';

import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';

interface Order {
  id: string;
  customer: {
    name: string;
    phone: string;
    email?: string;
  };
  vehicle: {
    make: string;
    model: string;
    variant?: string;
    year: number;
  };
  totalAmount: number;
}

interface QuotationFormProps {
  order: Order;
  campaignDiscount?: number;
  onSubmit: (data: {
    vehiclePrice: number;
    campaignDiscount: number;
    additionalDiscount: number;
    accessories: number;
    fees: number;
    validityDays: number;
  }) => void;
  onCancel?: () => void;
  isLoading?: boolean;
}

export function QuotationForm({
  order,
  campaignDiscount = 0,
  onSubmit,
  onCancel,
  isLoading,
}: QuotationFormProps) {
  const [formData, setFormData] = useState({
    vehiclePrice: order.totalAmount.toString(),
    additionalDiscount: '0',
    accessories: '0',
    fees: '0',
    validityDays: '7',
  });

  const vehiclePrice = parseFloat(formData.vehiclePrice) || 0;
  const additionalDiscount = parseFloat(formData.additionalDiscount) || 0;
  const accessories = parseFloat(formData.accessories) || 0;
  const fees = parseFloat(formData.fees) || 0;

  const subtotal = vehiclePrice - campaignDiscount - additionalDiscount;
  const totalAmount = subtotal + accessories + fees;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-AE', {
      style: 'currency',
      currency: 'AED',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    onSubmit({
      vehiclePrice,
      campaignDiscount,
      additionalDiscount,
      accessories,
      fees,
      validityDays: parseInt(formData.validityDays),
    });
  };

  return (
    <form onSubmit={handleSubmit}>
      <Card>
        <CardHeader>
          <CardTitle>Create Quotation</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Customer & Vehicle Info */}
          <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide">Customer</p>
              <p className="font-medium text-gray-900">{order.customer.name}</p>
              <p className="text-sm text-gray-600">{order.customer.phone}</p>
              {order.customer.email && (
                <p className="text-sm text-gray-600">{order.customer.email}</p>
              )}
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide">Vehicle</p>
              <p className="font-medium text-gray-900">
                {order.vehicle.year} {order.vehicle.make} {order.vehicle.model}
              </p>
              {order.vehicle.variant && (
                <p className="text-sm text-gray-600">{order.vehicle.variant}</p>
              )}
            </div>
          </div>

          {/* Pricing Inputs */}
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Vehicle Price"
              type="number"
              value={formData.vehiclePrice}
              onChange={(e) => setFormData({ ...formData, vehiclePrice: e.target.value })}
              min={0}
            />
            <Input
              label="Additional Discount"
              type="number"
              value={formData.additionalDiscount}
              onChange={(e) => setFormData({ ...formData, additionalDiscount: e.target.value })}
              min={0}
            />
            <Input
              label="Accessories"
              type="number"
              value={formData.accessories}
              onChange={(e) => setFormData({ ...formData, accessories: e.target.value })}
              min={0}
            />
            <Input
              label="Fees"
              type="number"
              value={formData.fees}
              onChange={(e) => setFormData({ ...formData, fees: e.target.value })}
              min={0}
            />
          </div>

          {/* Validity */}
          <Select
            label="Validity Period"
            value={formData.validityDays}
            onChange={(e) => setFormData({ ...formData, validityDays: e.target.value })}
          >
            <option value="3">3 Days</option>
            <option value="7">7 Days</option>
            <option value="14">14 Days</option>
            <option value="30">30 Days</option>
          </Select>

          {/* Pricing Summary */}
          <div className="border-t pt-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Vehicle Price</span>
              <span>{formatCurrency(vehiclePrice)}</span>
            </div>
            {campaignDiscount > 0 && (
              <div className="flex justify-between text-sm text-green-600">
                <span>Campaign Discount</span>
                <span>-{formatCurrency(campaignDiscount)}</span>
              </div>
            )}
            {additionalDiscount > 0 && (
              <div className="flex justify-between text-sm text-violet-600">
                <span>Additional Discount</span>
                <span>-{formatCurrency(additionalDiscount)}</span>
              </div>
            )}
            {accessories > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Accessories</span>
                <span>+{formatCurrency(accessories)}</span>
              </div>
            )}
            {fees > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Fees</span>
                <span>+{formatCurrency(fees)}</span>
              </div>
            )}
            <div className="flex justify-between pt-2 border-t font-semibold">
              <span>Total Amount</span>
              <span className="text-xl">{formatCurrency(totalAmount)}</span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            {onCancel && (
              <Button type="button" variant="outline" onClick={onCancel}>
                Cancel
              </Button>
            )}
            <Button type="submit" isLoading={isLoading}>
              Create Quotation
            </Button>
          </div>
        </CardContent>
      </Card>
    </form>
  );
}
