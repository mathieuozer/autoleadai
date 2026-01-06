'use client';

import { useState } from 'react';
import {
  FileText,
  CheckCircle,
  User,
  Car,
  Calendar,
  Clock,
  AlertTriangle,
} from 'lucide-react';
import { SignaturePad } from '@/components/test-drive';
import { useTestDriveWizard } from '@/hooks/useTestDriveWizard';

interface Step3AgreementProps {
  wizard: ReturnType<typeof useTestDriveWizard>;
}

// Terms and Conditions
const TERMS_AND_CONDITIONS = `
TEST DRIVE AGREEMENT

By signing this agreement, I acknowledge and agree to the following terms and conditions:

1. DRIVER REQUIREMENTS
   - I am the holder of a valid driving license appropriate for the vehicle being tested
   - I am at least 21 years of age
   - I am not under the influence of alcohol, drugs, or any medication that may impair my driving ability

2. VEHICLE USE
   - The test drive route will be as directed by the dealership representative
   - I will drive safely and in accordance with all traffic laws and regulations
   - I will not exceed speed limits or drive recklessly
   - I will not allow any other person to drive the vehicle during the test drive

3. DURATION
   - The test drive will last approximately 30 minutes unless otherwise agreed
   - I will return the vehicle at the agreed time

4. LIABILITY
   - I understand that I am responsible for any traffic violations incurred during the test drive
   - I accept responsibility for any damage to the vehicle caused by my negligence
   - The dealership's insurance may cover certain incidents, subject to their terms and conditions

5. PERSONAL DATA
   - I consent to the dealership collecting and storing my personal information for the purpose of this test drive
   - My information will be processed in accordance with applicable data protection laws

6. ACKNOWLEDGMENT
   - I have inspected the vehicle and confirmed it is in acceptable condition for the test drive
   - I have received instructions on the vehicle's controls and features
   - I understand and accept all terms and conditions stated in this agreement
`;

export function Step3Agreement({ wizard }: Step3AgreementProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const vehicleInfo = wizard.state.vehicle
    ? `${wizard.state.vehicle.year} ${wizard.state.vehicle.make} ${wizard.state.vehicle.model}`
    : 'Not selected';

  const scheduledInfo = wizard.state.scheduledDate && wizard.state.scheduledTime
    ? `${new Date(wizard.state.scheduledDate).toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
      })} at ${wizard.state.scheduledTime}`
    : 'Not scheduled';

  const canProceed = wizard.canProceed(3);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-semibold text-gray-900">Test Drive Agreement</h2>
        <p className="text-sm text-gray-500 mt-1">
          Review the terms and sign to complete the booking
        </p>
      </div>

      {/* Summary Card */}
      <div className="bg-gray-50 rounded-lg p-4 space-y-3">
        <div className="flex items-center gap-3">
          <User className="w-4 h-4 text-blue-600" />
          <div>
            <p className="text-xs text-gray-400">Customer</p>
            <p className="text-gray-900 font-medium">{wizard.state.ocrData.fullName || 'Unknown'}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Car className="w-4 h-4 text-green-600" />
          <div>
            <p className="text-xs text-gray-400">Vehicle</p>
            <p className="text-gray-900 font-medium">{vehicleInfo}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Calendar className="w-4 h-4 text-amber-600" />
          <div>
            <p className="text-xs text-gray-400">Scheduled</p>
            <p className="text-gray-900 font-medium">{scheduledInfo}</p>
          </div>
        </div>
      </div>

      {/* Terms and Conditions */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
            <FileText className="w-4 h-4 text-blue-600" />
            Terms & Conditions
          </label>
          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-blue-600 text-sm hover:underline"
          >
            {isExpanded ? 'Collapse' : 'Expand'}
          </button>
        </div>

        <div
          className={`bg-gray-100 rounded-lg p-4 overflow-hidden transition-all ${
            isExpanded ? 'max-h-96 overflow-y-auto' : 'max-h-32'
          }`}
        >
          <pre className="text-sm text-gray-500 whitespace-pre-wrap font-sans">
            {TERMS_AND_CONDITIONS}
          </pre>
        </div>
      </div>

      {/* Accept Terms Checkbox */}
      <label className="flex items-start gap-3 cursor-pointer">
        <input
          type="checkbox"
          checked={wizard.state.termsAccepted}
          onChange={(e) => wizard.setTermsAccepted(e.target.checked)}
          className="w-5 h-5 rounded border-gray-300 bg-white text-blue-600 focus:ring-blue-600 mt-0.5"
        />
        <span className="text-sm text-gray-500">
          I have read and agree to the Test Drive Agreement terms and conditions
        </span>
      </label>

      {/* Signature */}
      <div className="space-y-3">
        <label className="block text-sm font-medium text-gray-700">
          Customer Signature *
        </label>
        <SignaturePad
          onSignatureChange={(sig) => wizard.setSignatureData(sig)}
        />
      </div>

      {/* Validation Warning */}
      {!wizard.state.termsAccepted && wizard.state.signatureData && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex items-center gap-2 text-amber-600 text-sm">
          <AlertTriangle className="w-4 h-4 flex-shrink-0" />
          Please accept the terms and conditions to continue
        </div>
      )}

      {/* Navigation */}
      <div className="flex justify-between pt-4">
        <button
          onClick={() => wizard.prevStep()}
          className="light-btn-secondary"
        >
          Back
        </button>
        <button
          onClick={async () => {
            const success = await wizard.signAgreement();
            if (success) {
              wizard.nextStep();
            }
          }}
          disabled={!canProceed || wizard.isLoading}
          className="light-btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {wizard.isLoading ? 'Signing...' : 'Sign & Complete'}
        </button>
      </div>

      {/* Error */}
      {wizard.error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-600">
          {wizard.error}
        </div>
      )}
    </div>
  );
}
