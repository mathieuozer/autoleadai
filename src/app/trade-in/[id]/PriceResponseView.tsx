'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { PageContainer } from '@/components/layout';
import { Card } from '@/components/ui';
import {
  DollarSign,
  Check,
  X,
  Car,
  MessageSquare,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  ArrowLeft,
} from 'lucide-react';

interface AppraisalData {
  id: string;
  status: string;
  tentativePrice: number | null;
  inspectorNotes: string | null;
  reviewedAt: string | null;
  customer: { name: string };
  inspector?: { name: string } | null;
  ocrVehicleMake?: string;
  ocrVehicleModel?: string;
  ocrRegistrationYear?: number;
  mileage?: number;
  expectedPrice?: number;
  condition?: string;
}

interface PriceResponseViewProps {
  appraisalId: string;
  appraisal: AppraisalData;
  onStatusChange: (newStatus: string) => void;
}

export function PriceResponseView({
  appraisalId,
  appraisal,
  onStatusChange,
}: PriceResponseViewProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [counterOffer, setCounterOffer] = useState('');
  const [rejectReason, setRejectReason] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const vehicleTitle = [
    appraisal.ocrRegistrationYear,
    appraisal.ocrVehicleMake,
    appraisal.ocrVehicleModel,
  ].filter(Boolean).join(' ') || 'Trade-In Vehicle';

  const handleAccept = async () => {
    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch(`/api/trade-ins/${appraisalId}/respond`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'accept' }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to accept price');
      }

      setSuccessMessage('Price accepted! The trade-in has been confirmed.');
      onStatusChange('ACCEPTED');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to accept price');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReject = async () => {
    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch(`/api/trade-ins/${appraisalId}/respond`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'reject',
          counterOffer: counterOffer ? parseFloat(counterOffer) : undefined,
          reason: rejectReason || undefined,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to reject price');
      }

      setSuccessMessage('Price rejected. The inspector has been notified.');
      onStatusChange('REJECTED');
      setShowRejectForm(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reject price');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusBadge = () => {
    switch (appraisal.status) {
      case 'PRICED':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 text-amber-600 text-sm font-medium">
            <Clock className="w-4 h-4" />
            Awaiting Response
          </span>
        );
      case 'ACCEPTED':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-green-50 text-green-600 text-sm font-medium">
            <CheckCircle className="w-4 h-4" />
            Accepted
          </span>
        );
      case 'REJECTED':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-50 text-red-600 text-sm font-medium">
            <XCircle className="w-4 h-4" />
            Rejected
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <PageContainer title="Price Response">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Back Button */}
        <Link
          href="/trade-in"
          className="inline-flex items-center gap-2 text-gray-500 hover:text-gray-900 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          <span className="text-sm font-medium">Back to Trade-Ins</span>
        </Link>

        <Card padding="lg">
          <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-green-50 flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-green-600" />
              </div>
              <div className="flex-1">
                <h1 className="text-xl font-semibold text-gray-900">{vehicleTitle}</h1>
                <p className="text-sm text-gray-500">
                  {appraisal.customer.name}
                </p>
              </div>
              {getStatusBadge()}
            </div>

            {/* Success Message */}
            {successMessage && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                <p className="text-green-600">{successMessage}</p>
              </div>
            )}

            {/* Price Card */}
            <div className="bg-gradient-to-br from-green-50 to-green-100/50 border border-green-200 rounded-xl p-6">
              <p className="text-sm text-gray-500 mb-1">Tentative Trade-In Price</p>
              <p className="text-4xl font-bold text-gray-900">
                AED {appraisal.tentativePrice?.toLocaleString() || '—'}
              </p>
              {appraisal.inspector && (
                <p className="text-sm text-gray-400 mt-2">
                  Reviewed by {appraisal.inspector.name}
                  {appraisal.reviewedAt && (
                    <> on {new Date(appraisal.reviewedAt).toLocaleDateString()}</>
                  )}
                </p>
              )}
            </div>

            {/* Inspector Notes */}
            {appraisal.inspectorNotes && (
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center gap-2 text-gray-900 font-medium mb-2">
                  <MessageSquare className="w-4 h-4 text-blue-600" />
                  Inspector Notes
                </div>
                <p className="text-gray-500 text-sm">{appraisal.inspectorNotes}</p>
              </div>
            )}

            {/* Vehicle Details Summary */}
            <div className="bg-gray-50 rounded-lg p-4 space-y-3">
              <div className="flex items-center gap-2 text-gray-900 font-medium">
                <Car className="w-4 h-4 text-blue-600" />
                Vehicle Summary
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                {appraisal.mileage && (
                  <div>
                    <span className="text-gray-400">Mileage</span>
                    <p className="text-gray-900">{appraisal.mileage.toLocaleString()} km</p>
                  </div>
                )}
                {appraisal.condition && (
                  <div>
                    <span className="text-gray-400">Condition</span>
                    <p className="text-gray-900 capitalize">{appraisal.condition}</p>
                  </div>
                )}
                {appraisal.expectedPrice && (
                  <div>
                    <span className="text-gray-400">Your Expected Price</span>
                    <p className="text-amber-600 font-medium">
                      AED {appraisal.expectedPrice.toLocaleString()}
                    </p>
                  </div>
                )}
                {appraisal.tentativePrice && appraisal.expectedPrice && (
                  <div>
                    <span className="text-gray-400">Difference</span>
                    <p className={`font-medium ${
                      appraisal.tentativePrice >= appraisal.expectedPrice
                        ? 'text-green-600'
                        : 'text-red-600'
                    }`}>
                      {appraisal.tentativePrice >= appraisal.expectedPrice ? '+' : ''}
                      AED {(appraisal.tentativePrice - appraisal.expectedPrice).toLocaleString()}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3">
                <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0" />
                <p className="text-red-600">{error}</p>
              </div>
            )}

            {/* Action Buttons - Only show for PRICED status */}
            {appraisal.status === 'PRICED' && !successMessage && (
              <>
                {!showRejectForm ? (
                  <div className="space-y-3">
                    <button
                      onClick={handleAccept}
                      disabled={isSubmitting}
                      className="w-full py-4 rounded-lg bg-green-500 hover:bg-green-600 text-white font-semibold flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
                    >
                      {isSubmitting ? (
                        'Processing...'
                      ) : (
                        <>
                          <Check className="w-5 h-5" />
                          Accept Price
                        </>
                      )}
                    </button>
                    <button
                      onClick={() => setShowRejectForm(true)}
                      disabled={isSubmitting}
                      className="w-full py-4 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
                    >
                      <X className="w-5 h-5" />
                      Reject / Counter-Offer
                    </button>
                  </div>
                ) : (
                  <div className="bg-gray-50 rounded-lg p-4 space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-gray-900 font-medium">Reject or Counter-Offer</h3>
                      <button
                        onClick={() => setShowRejectForm(false)}
                        className="text-gray-400 hover:text-gray-600"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Counter-Offer (Optional)
                      </label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">AED</span>
                        <input
                          type="number"
                          value={counterOffer}
                          onChange={(e) => setCounterOffer(e.target.value)}
                          placeholder={appraisal.expectedPrice?.toString() || '0'}
                          className="light-input w-full !pl-14"
                        />
                      </div>
                      <p className="text-xs text-gray-400 mt-1">
                        Leave empty to reject without counter-offer
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Reason (Optional)
                      </label>
                      <textarea
                        value={rejectReason}
                        onChange={(e) => setRejectReason(e.target.value)}
                        placeholder="Why are you rejecting this price?"
                        rows={2}
                        className="light-input w-full resize-none"
                      />
                    </div>

                    <div className="flex gap-3">
                      <button
                        onClick={() => setShowRejectForm(false)}
                        disabled={isSubmitting}
                        className="flex-1 py-3 rounded-lg bg-gray-200 hover:bg-gray-300 text-gray-700 font-medium transition-colors disabled:opacity-50"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleReject}
                        disabled={isSubmitting}
                        className="flex-1 py-3 rounded-lg bg-red-500 hover:bg-red-600 text-white font-medium flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
                      >
                        {isSubmitting ? (
                          'Processing...'
                        ) : (
                          <>
                            <X className="w-4 h-4" />
                            {counterOffer ? 'Send Counter-Offer' : 'Reject Price'}
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}

            {/* Back button for ACCEPTED/REJECTED */}
            {['ACCEPTED', 'REJECTED'].includes(appraisal.status) && (
              <button
                onClick={() => router.push('/trade-in')}
                className="w-full py-3 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium flex items-center justify-center gap-2 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Trade-Ins
              </button>
            )}
          </div>
        </Card>
      </div>
    </PageContainer>
  );
}
