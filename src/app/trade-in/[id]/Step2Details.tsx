'use client';

import { Car, ArrowLeft, ArrowRight } from 'lucide-react';
import { useTradeInWizard } from '@/hooks/useTradeInWizard';
import { ConditionSelector, FeatureChips } from '@/components/trade-in';
import { VEHICLE_FEATURES } from '@/lib/trade-in-constants';

interface Step2DetailsProps {
  wizard: ReturnType<typeof useTradeInWizard>;
}

export function Step2Details({ wizard }: Step2DetailsProps) {
  const handleContinue = async () => {
    await wizard.saveProgress();
    wizard.nextStep();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-full bg-[#0ea5e9]/10 flex items-center justify-center">
          <Car className="w-6 h-6 text-[#0ea5e9]" />
        </div>
        <div>
          <h2 className="text-xl font-semibold text-white">Vehicle Details</h2>
          <p className="text-sm text-[#94a3b8]">
            Enter the vehicle specifications and condition
          </p>
        </div>
      </div>

      {/* Form Fields */}
      <div className="space-y-6">
        {/* Mileage and Price */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-[#f8fafc] mb-2">
              Current Mileage (km)
            </label>
            <input
              type="number"
              value={wizard.state.mileage}
              onChange={(e) => wizard.setMileage(e.target.value)}
              placeholder="e.g., 45000"
              className="dark-input w-full"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[#f8fafc] mb-2">
              Customer Expected Price (AED)
            </label>
            <input
              type="number"
              value={wizard.state.expectedPrice}
              onChange={(e) => wizard.setExpectedPrice(e.target.value)}
              placeholder="e.g., 85000"
              className="dark-input w-full"
            />
          </div>
        </div>

        {/* Condition Selector */}
        <ConditionSelector
          value={wizard.state.condition}
          onChange={wizard.setCondition}
        />

        {/* Features */}
        <FeatureChips
          features={VEHICLE_FEATURES}
          selectedFeatures={wizard.state.features}
          onToggle={wizard.toggleFeature}
        />

        {/* Additional Notes */}
        <div>
          <label className="block text-sm font-medium text-[#f8fafc] mb-2">
            Additional Notes
          </label>
          <textarea
            value={wizard.state.additionalNotes}
            onChange={(e) => wizard.setAdditionalNotes(e.target.value)}
            placeholder="Any additional information about the vehicle condition, history, or special features..."
            rows={4}
            className="dark-input w-full resize-none"
          />
        </div>
      </div>

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
          onClick={handleContinue}
          disabled={!wizard.canProceed(2) || wizard.isLoading}
          className="dark-btn-primary flex-1 justify-center disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {wizard.isLoading ? (
            'Saving...'
          ) : (
            <>
              Continue to Photos
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </div>
    </div>
  );
}
