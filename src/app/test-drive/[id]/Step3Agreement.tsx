'use client';

import { useState, useRef, useEffect } from 'react';
import {
  FileText,
  CheckCircle,
  User,
  Car,
  Calendar,
  AlertTriangle,
  Building2,
  ScrollText,
} from 'lucide-react';
import { SignaturePad } from '@/components/test-drive';
import { useTestDriveWizard } from '@/hooks/useTestDriveWizard';

interface Step3AgreementProps {
  wizard: ReturnType<typeof useTestDriveWizard>;
}

// Current active terms version
const TERMS_VERSION = '1.0';

// Terms and Conditions - Full Agreement
const TERMS_AND_CONDITIONS = `
TEST DRIVE AGREEMENT
Version ${TERMS_VERSION}

By signing this agreement, I acknowledge and agree to the following terms and conditions:

1. DRIVER REQUIREMENTS
   - I am the holder of a valid driving license appropriate for the vehicle being tested
   - I am at least 21 years of age
   - I am not under the influence of alcohol, drugs, or any medication that may impair my driving ability
   - The driving license information provided is accurate and current

2. VEHICLE USE
   - The test drive route will be as directed by the dealership representative
   - I will drive safely and in accordance with all traffic laws and regulations
   - I will not exceed speed limits or drive recklessly
   - I will not allow any other person to drive the vehicle during the test drive
   - I will not use the vehicle for any illegal activities

3. DURATION & BOOKING
   - The test drive will last approximately the scheduled duration unless otherwise agreed
   - I will return the vehicle at the agreed time
   - I understand the vehicle has been reserved for my test drive during the scheduled slot
   - Late arrival may result in reduced test drive time or rescheduling

4. LIABILITY
   - I understand that I am responsible for any traffic violations incurred during the test drive
   - I accept responsibility for any damage to the vehicle caused by my negligence
   - The dealership's insurance may cover certain incidents, subject to their terms and conditions
   - I agree to report any incidents or damage immediately to the dealership representative

5. PERSONAL DATA
   - I consent to the dealership collecting and storing my personal information for the purpose of this test drive
   - My information will be processed in accordance with applicable data protection laws
   - I consent to receive communications regarding my test drive and related services
   - My identity documents (driving license, Emirates ID) will be stored securely

6. CANCELLATION POLICY
   - I may cancel or reschedule my test drive by contacting the dealership
   - Failure to appear for a scheduled test drive may affect future bookings

7. ACKNOWLEDGMENT
   - I have inspected the vehicle and confirmed it is in acceptable condition for the test drive
   - I have received instructions on the vehicle's controls and features
   - I understand and accept all terms and conditions stated in this agreement
   - I confirm that all information provided is true and accurate
`;

export function Step3Agreement({ wizard }: Step3AgreementProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [hasScrolledToBottom, setHasScrolledToBottom] = useState(false);
  const [showScrollHint, setShowScrollHint] = useState(false);
  const termsContainerRef = useRef<HTMLDivElement>(null);

  // Handle scroll detection
  const handleScroll = () => {
    if (termsContainerRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = termsContainerRef.current;
      // Consider scrolled to bottom when within 20px of the end
      if (scrollTop + clientHeight >= scrollHeight - 20) {
        setHasScrolledToBottom(true);
        setShowScrollHint(false);
      }
    }
  };

  // Show scroll hint after a delay if user hasn't scrolled
  useEffect(() => {
    if (isExpanded && !hasScrolledToBottom) {
      const timer = setTimeout(() => {
        setShowScrollHint(true);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [isExpanded, hasScrolledToBottom]);

  // Pre-filled data
  const customerName = wizard.state.ocrData.fullName || wizard.state.customer?.name || 'Customer';
  const licenseNumber = wizard.state.ocrData.licenseNumber || 'Not provided';
  const emiratesId = wizard.state.nationalIdOcrData?.emiratesIdNumber || 'Not provided';
  const nationality = wizard.state.ocrData.nationality || wizard.state.nationalIdOcrData?.nationality || 'Not provided';

  const vehicleInfo = wizard.state.vehicle
    ? `${wizard.state.vehicle.year} ${wizard.state.vehicle.make} ${wizard.state.vehicle.model}${wizard.state.vehicle.variant ? ` ${wizard.state.vehicle.variant}` : ''}`
    : 'Not selected';

  const vehicleColor = wizard.state.vehicle?.color || 'Not specified';

  const scheduledInfo = wizard.state.scheduledDate && wizard.state.scheduledTime
    ? `${new Date(wizard.state.scheduledDate).toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      })} at ${wizard.state.scheduledTime}`
    : 'Not scheduled';

  const duration = wizard.state.duration || 30;

  const canProceed = wizard.canProceed(3) && (hasScrolledToBottom || !isExpanded);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-semibold text-gray-900">Test Drive Agreement</h2>
        <p className="text-sm text-gray-500 mt-1">
          Review the pre-filled agreement details and sign to complete the booking
        </p>
      </div>

      {/* Pre-filled Details Card */}
      <div className="bg-violet-50 border border-violet-200 rounded-lg p-4 space-y-4">
        <div className="flex items-center gap-2 text-violet-700 font-medium">
          <ScrollText className="w-5 h-5" />
          Agreement Details (Pre-filled)
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          {/* Customer Section */}
          <div className="space-y-3">
            <h4 className="font-medium text-gray-900 flex items-center gap-2">
              <User className="w-4 h-4 text-violet-600" />
              Customer
            </h4>
            <div className="pl-6 space-y-1">
              <p><span className="text-gray-500">Name:</span> <span className="font-medium text-gray-900">{customerName}</span></p>
              <p><span className="text-gray-500">License:</span> <span className="font-medium text-gray-900">{licenseNumber}</span></p>
              {wizard.state.nationalIdOcrData?.emiratesIdNumber && (
                <p><span className="text-gray-500">Emirates ID:</span> <span className="font-medium text-gray-900">{emiratesId}</span></p>
              )}
              <p><span className="text-gray-500">Nationality:</span> <span className="font-medium text-gray-900">{nationality}</span></p>
            </div>
          </div>

          {/* Vehicle Section */}
          <div className="space-y-3">
            <h4 className="font-medium text-gray-900 flex items-center gap-2">
              <Car className="w-4 h-4 text-green-600" />
              Vehicle
            </h4>
            <div className="pl-6 space-y-1">
              <p><span className="text-gray-500">Model:</span> <span className="font-medium text-gray-900">{vehicleInfo}</span></p>
              <p><span className="text-gray-500">Color:</span> <span className="font-medium text-gray-900">{vehicleColor}</span></p>
            </div>
          </div>

          {/* Appointment Section */}
          <div className="space-y-3">
            <h4 className="font-medium text-gray-900 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-amber-600" />
              Appointment
            </h4>
            <div className="pl-6 space-y-1">
              <p><span className="text-gray-500">When:</span> <span className="font-medium text-gray-900">{scheduledInfo}</span></p>
              <p><span className="text-gray-500">Duration:</span> <span className="font-medium text-gray-900">{duration} minutes</span></p>
            </div>
          </div>

          {/* Dealership Section */}
          <div className="space-y-3">
            <h4 className="font-medium text-gray-900 flex items-center gap-2">
              <Building2 className="w-4 h-4 text-blue-600" />
              Dealership
            </h4>
            <div className="pl-6 space-y-1">
              <p><span className="text-gray-500">Name:</span> <span className="font-medium text-gray-900">AutoLead Dealership</span></p>
              <p><span className="text-gray-500">Location:</span> <span className="font-medium text-gray-900">Dubai, UAE</span></p>
            </div>
          </div>
        </div>
      </div>

      {/* Terms and Conditions */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
            <FileText className="w-4 h-4 text-violet-600" />
            Terms & Conditions
            <span className="text-xs text-gray-400">(v{TERMS_VERSION})</span>
          </label>
          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-violet-600 text-sm hover:underline"
          >
            {isExpanded ? 'Collapse' : 'Read Full Terms'}
          </button>
        </div>

        <div
          ref={termsContainerRef}
          onScroll={handleScroll}
          className={`bg-gray-100 rounded-lg p-4 overflow-hidden transition-all relative ${
            isExpanded ? 'max-h-80 overflow-y-auto' : 'max-h-28'
          }`}
        >
          <pre className="text-sm text-gray-600 whitespace-pre-wrap font-sans">
            {TERMS_AND_CONDITIONS}
          </pre>

          {/* Scroll hint */}
          {isExpanded && showScrollHint && !hasScrolledToBottom && (
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-gray-100 via-gray-100 to-transparent py-4 text-center">
              <span className="text-sm text-violet-600 animate-bounce inline-block">
                ↓ Scroll to read full terms
              </span>
            </div>
          )}
        </div>

        {/* Scroll completion indicator */}
        {isExpanded && (
          <div className="flex items-center gap-2 text-sm">
            {hasScrolledToBottom ? (
              <span className="text-green-600 flex items-center gap-1">
                <CheckCircle className="w-4 h-4" />
                Terms reviewed
              </span>
            ) : (
              <span className="text-amber-600 flex items-center gap-1">
                <AlertTriangle className="w-4 h-4" />
                Please scroll to read all terms
              </span>
            )}
          </div>
        )}
      </div>

      {/* Accept Terms Checkbox */}
      <label className="flex items-start gap-3 cursor-pointer">
        <input
          type="checkbox"
          checked={wizard.state.termsAccepted}
          onChange={(e) => wizard.setTermsAccepted(e.target.checked)}
          className="w-5 h-5 rounded border-gray-300 bg-white text-violet-600 focus:ring-violet-600 mt-0.5"
        />
        <span className="text-sm text-gray-600">
          I have read and agree to the <strong>Test Drive Agreement</strong> (v{TERMS_VERSION}).
          I confirm that all the information displayed above is accurate.
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
        <p className="text-xs text-gray-500">
          Draw your signature above using your finger or mouse
        </p>
      </div>

      {/* Validation Warnings */}
      {!wizard.state.termsAccepted && wizard.state.signatureData && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex items-center gap-2 text-amber-600 text-sm">
          <AlertTriangle className="w-4 h-4 flex-shrink-0" />
          Please accept the terms and conditions to continue
        </div>
      )}

      {isExpanded && !hasScrolledToBottom && wizard.state.termsAccepted && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex items-center gap-2 text-amber-600 text-sm">
          <AlertTriangle className="w-4 h-4 flex-shrink-0" />
          Please scroll through the full terms before signing
        </div>
      )}

      {/* What Happens Next */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-2">
        <h4 className="font-medium text-blue-900 text-sm">What happens after signing?</h4>
        <ul className="text-sm text-blue-800 space-y-1 pl-4 list-disc">
          <li>The vehicle will be reserved for your test drive slot</li>
          <li>You&apos;ll receive a confirmation email with the signed agreement</li>
          <li>Bring your driving license and Emirates ID to the appointment</li>
        </ul>
      </div>

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
          {wizard.isLoading ? 'Signing Agreement...' : 'Sign & Complete Booking'}
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
