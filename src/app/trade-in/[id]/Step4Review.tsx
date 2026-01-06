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
        router.push('/trade-in');
      }, 2000);
    }
  };

  if (submitSuccess) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="w-20 h-20 rounded-full bg-green-50 flex items-center justify-center mb-6">
          <CheckCircle className="w-10 h-10 text-green-600" />
        </div>
        <h2 className="text-2xl font-semibold text-gray-900 mb-2">
          Appraisal Submitted!
        </h2>
        <p className="text-gray-500 mb-6">
          Your trade-in appraisal has been submitted for review.
          <br />
          You'll receive a notification when pricing is ready.
        </p>
        <div className="animate-pulse text-gray-400 text-sm">
          Redirecting to trade-ins...
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-full bg-green-50 flex items-center justify-center">
          <CheckCircle className="w-6 h-6 text-green-600" />
        </div>
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Review & Submit</h2>
          <p className="text-sm text-gray-500">
            Verify all information before submitting
          </p>
        </div>
      </div>

      {/* Section 1: Registration Documents */}
      <div className="bg-gray-50 rounded-lg p-4 space-y-3">
        <div className="flex items-center gap-2">
          <CreditCard className="w-4 h-4 text-blue-600" />
          <h3 className="text-sm font-medium text-gray-900">Registration Documents</h3>
        </div>
        <p className="text-xs text-gray-400">Vehicle registration card scans</p>

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
      <div className="bg-gray-50 rounded-lg p-4 space-y-3">
        <div className="flex items-center gap-2">
          <Car className="w-4 h-4 text-blue-600" />
          <h3 className="text-sm font-medium text-gray-900">Vehicle Details</h3>
        </div>

        {/* Vehicle Info from OCR */}
        {(wizard.state.ocrData.vehicleMake || wizard.state.ocrData.vehicleModel) && (
          <div className="bg-white rounded-lg p-3 space-y-2 border border-gray-200">
            <p className="text-lg font-semibold text-gray-900">
              {[
                wizard.state.ocrData.registrationYear,
                wizard.state.ocrData.vehicleMake,
                wizard.state.ocrData.vehicleModel,
                wizard.state.ocrData.vehicleTrim,
              ]
                .filter(Boolean)
                .join(' ')}
            </p>
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm">
              {wizard.state.ocrData.plateNumber && (
                <span className="text-gray-500">
                  Plate: <span className="text-gray-900">{wizard.state.ocrData.plateNumber}</span>
                </span>
              )}
              {wizard.state.ocrData.vin && (
                <span className="text-gray-500">
                  VIN: <span className="text-gray-900 font-mono text-xs">{wizard.state.ocrData.vin}</span>
                </span>
              )}
            </div>
          </div>
        )}

        <div className="grid grid-cols-3 gap-4">
          <div className="text-center">
            <p className="text-lg font-semibold text-gray-900">
              {parseInt(wizard.state.mileage).toLocaleString()} km
            </p>
            <p className="text-xs text-gray-400">Mileage</p>
          </div>
          <div className="text-center">
            <p className="text-lg font-semibold text-gray-900">
              AED {parseInt(wizard.state.expectedPrice).toLocaleString()}
            </p>
            <p className="text-xs text-gray-400">Expected Price</p>
          </div>
          <div className="text-center">
            <p className="text-lg font-semibold text-gray-900">{conditionLabel}</p>
            <p className="text-xs text-gray-400">Condition</p>
          </div>
        </div>

        {wizard.state.features.length > 0 && (
          <div className="flex flex-wrap gap-2 pt-2">
            {wizard.state.features.map((feature) => (
              <span
                key={feature}
                className="text-xs bg-gray-200 text-gray-700 px-2 py-1 rounded"
              >
                {feature}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Section 3: Vehicle Photos */}
      <div className="bg-gray-50 rounded-lg p-4 space-y-3">
        <div className="flex items-center gap-2">
          <Camera className="w-4 h-4 text-blue-600" />
          <h3 className="text-sm font-medium text-gray-900">Vehicle Photos</h3>
        </div>
        <p className="text-xs text-gray-400">
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
            <div className="aspect-square rounded-lg bg-gray-200 flex items-center justify-center">
              <span className="text-sm text-gray-500">
                +{wizard.state.photos.size - 4} more
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Error Display */}
      {wizard.error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-sm text-red-600">{wizard.error}</p>
        </div>
      )}

      {/* Navigation Buttons */}
      <div className="flex gap-3">
        <button
          onClick={wizard.prevStep}
          className="light-btn-secondary flex-1 justify-center"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>
        <button
          onClick={handleSubmit}
          disabled={!wizard.canProceed(4) || isSubmitting}
          className="light-btn-success flex-1 justify-center disabled:opacity-50 disabled:cursor-not-allowed"
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
