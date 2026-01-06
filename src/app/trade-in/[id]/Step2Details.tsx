'use client';

import { Car, ArrowLeft, ArrowRight, Sparkles } from 'lucide-react';
import { useTradeInWizard } from '@/hooks/useTradeInWizard';
import { LightConditionSelector, LightFeatureChips } from '@/components/trade-in';
import { VEHICLE_FEATURES } from '@/lib/trade-in-constants';

interface Step2DetailsProps {
  wizard: ReturnType<typeof useTradeInWizard>;
}

export function Step2Details({ wizard }: Step2DetailsProps) {
  const handleContinue = async () => {
    await wizard.saveProgress();
    wizard.nextStep();
  };

  const hasOcrData = wizard.state.ocrData.vehicleMake || wizard.state.ocrData.vehicleModel || wizard.state.ocrData.plateNumber;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center">
          <Car className="w-6 h-6 text-blue-600" />
        </div>
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Vehicle Details</h2>
          <p className="text-sm text-gray-500">
            {hasOcrData ? 'Review extracted data and complete the details' : 'Enter the vehicle specifications and condition'}
          </p>
        </div>
      </div>

      {/* OCR Auto-filled Banner */}
      {hasOcrData && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-3 flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-green-600" />
          <span className="text-sm text-green-600">
            Some fields were auto-filled from the registration card. Please verify and correct if needed.
          </span>
        </div>
      )}

      {/* Form Fields */}
      <div className="space-y-6">
        {/* Vehicle Info (from OCR) */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Make
              {wizard.state.ocrData.vehicleMake && <span className="text-green-600 text-xs ml-1">(auto)</span>}
            </label>
            <input
              type="text"
              value={wizard.state.ocrData.vehicleMake || ''}
              onChange={(e) => wizard.setOcrData({ vehicleMake: e.target.value })}
              placeholder="e.g., Toyota"
              className="light-input w-full"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Model
              {wizard.state.ocrData.vehicleModel && <span className="text-green-600 text-xs ml-1">(auto)</span>}
            </label>
            <input
              type="text"
              value={wizard.state.ocrData.vehicleModel || ''}
              onChange={(e) => wizard.setOcrData({ vehicleModel: e.target.value })}
              placeholder="e.g., Camry"
              className="light-input w-full"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Trim
            </label>
            <input
              type="text"
              value={wizard.state.ocrData.vehicleTrim || ''}
              onChange={(e) => wizard.setOcrData({ vehicleTrim: e.target.value })}
              placeholder="e.g., SE, XLE"
              className="light-input w-full"
            />
          </div>
        </div>

        {/* Year, Plate, VIN */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Year
              {wizard.state.ocrData.registrationYear && <span className="text-green-600 text-xs ml-1">(auto)</span>}
            </label>
            <input
              type="number"
              value={wizard.state.ocrData.registrationYear || ''}
              onChange={(e) => wizard.setOcrData({ registrationYear: e.target.value ? parseInt(e.target.value) : undefined })}
              placeholder="e.g., 2022"
              className="light-input w-full"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Plate Number
              {wizard.state.ocrData.plateNumber && <span className="text-green-600 text-xs ml-1">(auto)</span>}
            </label>
            <input
              type="text"
              value={wizard.state.ocrData.plateNumber || ''}
              onChange={(e) => wizard.setOcrData({ plateNumber: e.target.value })}
              placeholder="e.g., A 12345"
              className="light-input w-full"
            />
          </div>
          <div className="col-span-2 md:col-span-1">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              VIN
              {wizard.state.ocrData.vin && <span className="text-green-600 text-xs ml-1">(auto)</span>}
            </label>
            <input
              type="text"
              value={wizard.state.ocrData.vin || ''}
              onChange={(e) => wizard.setOcrData({ vin: e.target.value.toUpperCase() })}
              placeholder="17-character VIN"
              maxLength={17}
              className="light-input w-full font-mono text-sm"
            />
          </div>
        </div>

        {/* Mileage and Price */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Current Mileage (km) <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              value={wizard.state.mileage}
              onChange={(e) => wizard.setMileage(e.target.value)}
              placeholder="e.g., 45000"
              className="light-input w-full"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Customer Expected Price (AED) <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              value={wizard.state.expectedPrice}
              onChange={(e) => wizard.setExpectedPrice(e.target.value)}
              placeholder="e.g., 85000"
              className="light-input w-full"
            />
          </div>
        </div>

        {/* Condition Selector */}
        <LightConditionSelector
          value={wizard.state.condition}
          onChange={wizard.setCondition}
        />

        {/* Features */}
        <LightFeatureChips
          features={VEHICLE_FEATURES}
          selectedFeatures={wizard.state.features}
          onToggle={wizard.toggleFeature}
        />

        {/* Ownership Notes */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Ownership Notes (Optional)
          </label>
          <textarea
            value={wizard.state.additionalNotes}
            onChange={(e) => wizard.setAdditionalNotes(e.target.value)}
            placeholder="Number of previous owners, service history, accident history, any modifications, reason for selling..."
            rows={4}
            className="light-input w-full resize-none"
          />
          <p className="text-xs text-gray-400 mt-1">
            Include any relevant ownership history or vehicle background
          </p>
        </div>
      </div>

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
          onClick={handleContinue}
          disabled={!wizard.canProceed(2) || wizard.isLoading}
          className="light-btn-primary flex-1 justify-center disabled:opacity-50 disabled:cursor-not-allowed"
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
