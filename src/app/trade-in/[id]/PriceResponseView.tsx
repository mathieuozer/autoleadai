'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { DarkLayout } from '@/components/trade-in';
import {
  DollarSign,
  Check,
  X,
  Car,
  User,
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
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#f59e0b]/20 text-[#f59e0b] text-sm font-medium">
            <Clock className="w-4 h-4" />
            Awaiting Response
          </span>
        );
      case 'ACCEPTED':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#22c55e]/20 text-[#22c55e] text-sm font-medium">
            <CheckCircle className="w-4 h-4" />
            Accepted
          </span>
        );
      case 'REJECTED':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#ef4444]/20 text-[#ef4444] text-sm font-medium">
            <XCircle className="w-4 h-4" />
            Rejected
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <DarkLayout showBackButton backHref="/trade-in">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-[#22c55e]/10 flex items-center justify-center">
            <DollarSign className="w-6 h-6 text-[#22c55e]" />
          </div>
          <div className="flex-1">
            <h1 className="text-xl font-semibold text-white">{vehicleTitle}</h1>
            <p className="text-sm text-[#94a3b8]">
              {appraisal.customer.name}
            </p>
          </div>
          {getStatusBadge()}
        </div>

        {/* Success Message */}
        {successMessage && (
          <div className="bg-[#22c55e]/10 border border-[#22c55e]/30 rounded-lg p-4 flex items-center gap-3">
            <CheckCircle className="w-5 h-5 text-[#22c55e] flex-shrink-0" />
            <p className="text-[#22c55e]">{successMessage}</p>
          </div>
        )}

        {/* Price Card */}
        <div className="bg-gradient-to-br from-[#22c55e]/20 to-[#22c55e]/5 border border-[#22c55e]/30 rounded-xl p-6">
          <p className="text-sm text-[#94a3b8] mb-1">Tentative Trade-In Price</p>
          <p className="text-4xl font-bold text-white">
            AED {appraisal.tentativePrice?.toLocaleString() || '—'}
          </p>
          {appraisal.inspector && (
            <p className="text-sm text-[#64748b] mt-2">
              Reviewed by {appraisal.inspector.name}
              {appraisal.reviewedAt && (
                <> on {new Date(appraisal.reviewedAt).toLocaleDateString()}</>
              )}
            </p>
          )}
        </div>

        {/* Inspector Notes */}
        {appraisal.inspectorNotes && (
          <div className="bg-[#334155] rounded-lg p-4">
            <div className="flex items-center gap-2 text-white font-medium mb-2">
              <MessageSquare className="w-4 h-4 text-[#0ea5e9]" />
              Inspector Notes
            </div>
            <p className="text-[#94a3b8] text-sm">{appraisal.inspectorNotes}</p>
          </div>
        )}

        {/* Vehicle Details Summary */}
        <div className="bg-[#334155] rounded-lg p-4 space-y-3">
          <div className="flex items-center gap-2 text-white font-medium">
            <Car className="w-4 h-4 text-[#0ea5e9]" />
            Vehicle Summary
          </div>
          <div className="grid grid-cols-2 gap-4 text-sm">
            {appraisal.mileage && (
              <div>
                <span className="text-[#64748b]">Mileage</span>
                <p className="text-white">{appraisal.mileage.toLocaleString()} km</p>
              </div>
            )}
            {appraisal.condition && (
              <div>
                <span className="text-[#64748b]">Condition</span>
                <p className="text-white capitalize">{appraisal.condition}</p>
              </div>
            )}
            {appraisal.expectedPrice && (
              <div>
                <span className="text-[#64748b]">Your Expected Price</span>
                <p className="text-[#f59e0b] font-medium">
                  AED {appraisal.expectedPrice.toLocaleString()}
                </p>
              </div>
            )}
            {appraisal.tentativePrice && appraisal.expectedPrice && (
              <div>
                <span className="text-[#64748b]">Difference</span>
                <p className={`font-medium ${
                  appraisal.tentativePrice >= appraisal.expectedPrice
                    ? 'text-[#22c55e]'
                    : 'text-[#ef4444]'
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
          <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0" />
            <p className="text-red-400">{error}</p>
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
                  className="w-full py-4 rounded-lg bg-[#22c55e] hover:bg-[#16a34a] text-white font-semibold flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
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
                  className="w-full py-4 rounded-lg bg-[#334155] hover:bg-[#475569] text-white font-medium flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
                >
                  <X className="w-5 h-5" />
                  Reject / Counter-Offer
                </button>
              </div>
            ) : (
              <div className="bg-[#334155] rounded-lg p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-white font-medium">Reject or Counter-Offer</h3>
                  <button
                    onClick={() => setShowRejectForm(false)}
                    className="text-[#94a3b8] hover:text-white"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#f8fafc] mb-2">
                    Counter-Offer (Optional)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#64748b]">AED</span>
                    <input
                      type="number"
                      value={counterOffer}
                      onChange={(e) => setCounterOffer(e.target.value)}
                      placeholder={appraisal.expectedPrice?.toString() || '0'}
                      className="dark-input w-full !pl-14"
                    />
                  </div>
                  <p className="text-xs text-[#64748b] mt-1">
                    Leave empty to reject without counter-offer
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#f8fafc] mb-2">
                    Reason (Optional)
                  </label>
                  <textarea
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                    placeholder="Why are you rejecting this price?"
                    rows={2}
                    className="dark-input w-full resize-none"
                  />
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => setShowRejectForm(false)}
                    disabled={isSubmitting}
                    className="flex-1 py-3 rounded-lg bg-[#475569] hover:bg-[#64748b] text-white font-medium transition-colors disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleReject}
                    disabled={isSubmitting}
                    className="flex-1 py-3 rounded-lg bg-[#ef4444] hover:bg-[#dc2626] text-white font-medium flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
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
            className="w-full py-3 rounded-lg bg-[#334155] hover:bg-[#475569] text-white font-medium flex items-center justify-center gap-2 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Trade-Ins
          </button>
        )}
      </div>
    </DarkLayout>
  );
}
