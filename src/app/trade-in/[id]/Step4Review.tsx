'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  CheckCircle,
  CreditCard,
  Car,
  Camera,
  ArrowLeft,
  Check,
} from 'lucide-react';
import Image from 'next/image';
import { useTradeInWizard } from '@/hooks/useTradeInWizard';
import { CONDITION_OPTIONS } from '@/lib/trade-in-constants';

interface Step4ReviewProps {
  wizard: ReturnType<typeof useTradeInWizard>;
}

export function Step4Review({ wizard }: Step4ReviewProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const conditionLabel =
    CONDITION_OPTIONS.find((c) => c.value === wizard.state.condition)?.label || 'N/A';

  const handleSubmit = async () => {
    setIsSubmitting(true);
    const success = await wizard.submitAppraisal();
    setIsSubmitting(false);

    if (success) {
      setSubmitSuccess(true);
      // Redirect after a short delay
      setTimeout(() => {
        router.push('/dashboard');
      }, 2000);
    }
  };

  if (submitSuccess) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="w-20 h-20 rounded-full bg-[#22c55e]/10 flex items-center justify-center mb-6">
          <CheckCircle className="w-10 h-10 text-[#22c55e]" />
        </div>
        <h2 className="text-2xl font-semibold text-white mb-2">
          Appraisal Submitted!
        </h2>
        <p className="text-[#94a3b8] mb-6">
          Your trade-in appraisal has been submitted for review.
          <br />
          You'll receive a notification when pricing is ready.
        </p>
        <div className="animate-pulse text-[#64748b] text-sm">
          Redirecting to dashboard...
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-full bg-[#22c55e]/10 flex items-center justify-center">
          <CheckCircle className="w-6 h-6 text-[#22c55e]" />
        </div>
        <div>
          <h2 className="text-xl font-semibold text-white">Review & Submit</h2>
          <p className="text-sm text-[#94a3b8]">
            Verify all information before submitting
          </p>
        </div>
      </div>

      {/* Section 1: Registration Documents */}
      <div className="bg-[#334155] rounded-lg p-4 space-y-3">
        <div className="flex items-center gap-2">
          <CreditCard className="w-4 h-4 text-[#0ea5e9]" />
          <h3 className="text-sm font-medium text-white">Registration Documents</h3>
        </div>
        <p className="text-xs text-[#64748b]">Vehicle registration card scans</p>

        <div className="flex gap-3 overflow-x-auto pb-2">
          {wizard.state.registrationFrontUrl && (
            <div className="relative w-32 h-20 rounded-lg overflow-hidden flex-shrink-0">
              <Image
                src={wizard.state.registrationFrontUrl}
                alt="Registration Front"
                fill
                className="object-cover"
              />
            </div>
          )}
          {wizard.state.registrationBackUrl && (
            <div className="relative w-32 h-20 rounded-lg overflow-hidden flex-shrink-0">
              <Image
                src={wizard.state.registrationBackUrl}
                alt="Registration Back"
                fill
                className="object-cover"
              />
            </div>
          )}
        </div>
      </div>

      {/* Section 2: Vehicle Details */}
      <div className="bg-[#334155] rounded-lg p-4 space-y-3">
        <div className="flex items-center gap-2">
          <Car className="w-4 h-4 text-[#0ea5e9]" />
          <h3 className="text-sm font-medium text-white">Vehicle Details</h3>
        </div>
        <p className="text-xs text-[#64748b]">Specifications and condition</p>

        <div className="grid grid-cols-3 gap-4">
          <div className="text-center">
            <p className="text-lg font-semibold text-white">
              {parseInt(wizard.state.mileage).toLocaleString()} km
            </p>
            <p className="text-xs text-[#64748b]">Mileage</p>
          </div>
          <div className="text-center">
            <p className="text-lg font-semibold text-white">
              AED {parseInt(wizard.state.expectedPrice).toLocaleString()}
            </p>
            <p className="text-xs text-[#64748b]">Expected Price</p>
          </div>
          <div className="text-center">
            <p className="text-lg font-semibold text-white">{conditionLabel}</p>
            <p className="text-xs text-[#64748b]">Condition</p>
          </div>
        </div>

        {wizard.state.features.length > 0 && (
          <div className="flex flex-wrap gap-2 pt-2">
            {wizard.state.features.map((feature) => (
              <span
                key={feature}
                className="text-xs bg-[#475569] text-[#f8fafc] px-2 py-1 rounded"
              >
                {feature}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Section 3: Vehicle Photos */}
      <div className="bg-[#334155] rounded-lg p-4 space-y-3">
        <div className="flex items-center gap-2">
          <Camera className="w-4 h-4 text-[#0ea5e9]" />
          <h3 className="text-sm font-medium text-white">Vehicle Photos</h3>
        </div>
        <p className="text-xs text-[#64748b]">
          {wizard.state.photos.size} photos uploaded
        </p>

        <div className="grid grid-cols-4 gap-2">
          {Array.from(wizard.state.photos.values())
            .slice(0, 4)
            .map((photo) => (
              <div
                key={photo.id}
                className="relative aspect-square rounded-lg overflow-hidden"
              >
                <Image
                  src={photo.url}
                  alt={photo.type}
                  fill
                  className="object-cover"
                />
              </div>
            ))}
          {wizard.state.photos.size > 4 && (
            <div className="aspect-square rounded-lg bg-[#475569] flex items-center justify-center">
              <span className="text-sm text-[#94a3b8]">
                +{wizard.state.photos.size - 4} more
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Error Display */}
      {wizard.error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
          <p className="text-sm text-red-400">{wizard.error}</p>
        </div>
      )}

      {/* Navigation Buttons */}
      <div className="flex gap-3">
        <button
          onClick={wizard.prevStep}
          className="dark-btn-secondary flex-1 justify-center"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>
        <button
          onClick={handleSubmit}
          disabled={!wizard.canProceed(4) || isSubmitting}
          className="dark-btn-primary flex-1 justify-center disabled:opacity-50 disabled:cursor-not-allowed bg-[#22c55e] hover:bg-[#16a34a]"
        >
          {isSubmitting ? (
            'Submitting...'
          ) : (
            <>
              <Check className="w-4 h-4" />
              Submit Appraisal
            </>
          )}
        </button>
      </div>
    </div>
  );
}
