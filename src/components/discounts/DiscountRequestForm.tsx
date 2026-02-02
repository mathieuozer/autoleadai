'use client';

import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';

interface DiscountRequestFormProps {
  orderId: string;
  originalPrice: number;
  campaignDiscount?: number;
  brandCode?: string;
  onSubmit: (data: {
    originalPrice: number;
    campaignDiscount: number;
    requestedDiscount: number;
    justification: string;
  }) => void;
  onCancel?: () => void;
  isLoading?: boolean;
}

export function DiscountRequestForm({
  orderId,
  originalPrice,
  campaignDiscount = 0,
  brandCode,
  onSubmit,
  onCancel,
  isLoading,
}: DiscountRequestFormProps) {
  const [requestedDiscount, setRequestedDiscount] = useState('');
  const [justification, setJustification] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-AE', {
      style: 'currency',
      currency: 'AED',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const discountAmount = parseFloat(requestedDiscount) || 0;
  const totalDiscount = campaignDiscount + discountAmount;
  const finalPrice = originalPrice - totalDiscount;
  const discountPercentage = (discountAmount / originalPrice) * 100;

  const getApprovalLevel = () => {
    if (discountAmount <= 5000) return { level: 'BM', label: 'Branch Manager' };
    if (discountAmount <= 15000) return { level: 'BM + GM', label: 'Branch Manager + General Manager' };
    return { level: 'BM + GM', label: 'Branch Manager + General Manager' };
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!requestedDiscount || discountAmount <= 0) {
      newErrors.discount = 'Please enter a valid discount amount';
    }

    if (discountAmount >= originalPrice) {
      newErrors.discount = 'Discount cannot exceed original price';
    }

    if (discountPercentage > 25) {
      newErrors.discount = 'Discount cannot exceed 25% of original price';
    }

    if (!justification || justification.trim().length < 10) {
      newErrors.justification = 'Please provide a justification (at least 10 characters)';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) return;

    onSubmit({
      originalPrice,
      campaignDiscount,
      requestedDiscount: discountAmount,
      justification: justification.trim(),
    });
  };

  const approval = getApprovalLevel();

  return (
    <form onSubmit={handleSubmit}>
      <Card>
        <CardHeader>
          <CardTitle>Request Additional Discount</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Pricing Summary */}
          <div className="bg-gray-50 rounded-lg p-4 space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-600">Original Price</span>
              <span className="font-medium">{formatCurrency(originalPrice)}</span>
            </div>
            {campaignDiscount > 0 && (
              <div className="flex justify-between text-green-600">
                <span>Campaign Discount</span>
                <span>-{formatCurrency(campaignDiscount)}</span>
              </div>
            )}
            {discountAmount > 0 && (
              <div className="flex justify-between text-violet-600">
                <span>Additional Discount</span>
                <span>-{formatCurrency(discountAmount)}</span>
              </div>
            )}
            <div className="flex justify-between border-t pt-2 mt-2">
              <span className="font-semibold">Final Price</span>
              <span className="text-xl font-bold">{formatCurrency(finalPrice)}</span>
            </div>
          </div>

          {/* Discount Input */}
          <div>
            <Input
              label="Additional Discount Amount (AED)"
              type="number"
              value={requestedDiscount}
              onChange={(e) => {
                setRequestedDiscount(e.target.value);
                setErrors({ ...errors, discount: '' });
              }}
              placeholder="Enter discount amount"
              min={0}
              max={originalPrice}
              error={errors.discount}
            />
            {discountAmount > 0 && (
              <p className="mt-1 text-sm text-gray-500">
                {discountPercentage.toFixed(1)}% of original price
              </p>
            )}
          </div>

          {/* Approval Level Info */}
          {discountAmount > 0 && (
            <div className="flex items-center gap-2 p-3 bg-amber-50 rounded-lg border border-amber-200">
              <svg
                className="h-5 w-5 text-amber-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <div>
                <p className="text-sm font-medium text-amber-800">
                  Approval Required: {approval.label}
                </p>
                <p className="text-xs text-amber-600">
                  Discount of {formatCurrency(discountAmount)} requires {approval.level} approval
                </p>
              </div>
            </div>
          )}

          {/* Warning for high discounts */}
          {discountPercentage > 15 && (
            <div className="flex items-center gap-2 p-3 bg-red-50 rounded-lg border border-red-200">
              <svg
                className="h-5 w-5 text-red-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
              <p className="text-sm text-red-800">
                High discount percentage. Additional justification may be required.
              </p>
            </div>
          )}

          {/* Justification */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Justification
            </label>
            <textarea
              value={justification}
              onChange={(e) => {
                setJustification(e.target.value);
                setErrors({ ...errors, justification: '' });
              }}
              placeholder="Explain why this discount is necessary..."
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-violet-500 focus:ring-1 focus:ring-violet-500 resize-none"
              rows={4}
            />
            {errors.justification && (
              <p className="mt-1 text-sm text-red-600">{errors.justification}</p>
            )}
            <p className="mt-1 text-xs text-gray-500">
              {justification.length}/200 characters
            </p>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            {onCancel && (
              <Button type="button" variant="outline" onClick={onCancel}>
                Cancel
              </Button>
            )}
            <Button type="submit" isLoading={isLoading} disabled={!discountAmount}>
              Submit for Approval
            </Button>
          </div>
        </CardContent>
      </Card>
    </form>
  );
}
