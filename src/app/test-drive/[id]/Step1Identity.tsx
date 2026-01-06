'use client';

import { useState, useRef } from 'react';
import {
  Camera,
  Upload,
  CheckCircle,
  AlertTriangle,
  Loader2,
  User,
  CreditCard,
  Calendar,
  MapPin,
  X,
} from 'lucide-react';
import { useTestDriveWizard } from '@/hooks/useTestDriveWizard';

interface Step1IdentityProps {
  wizard: ReturnType<typeof useTestDriveWizard>;
}

export function Step1Identity({ wizard }: Step1IdentityProps) {
  const [isProcessingFront, setIsProcessingFront] = useState(false);
  const [isProcessingBack, setIsProcessingBack] = useState(false);
  const [ocrError, setOcrError] = useState<string | null>(null);
  const frontInputRef = useRef<HTMLInputElement>(null);
  const backInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = async (
    file: File,
    side: 'front' | 'back'
  ) => {
    const setProcessing = side === 'front' ? setIsProcessingFront : setIsProcessingBack;
    setProcessing(true);
    setOcrError(null);

    try {
      // Convert to base64
      const reader = new FileReader();
      const base64 = await new Promise<string>((resolve, reject) => {
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      // Update image in state
      if (side === 'front') {
        wizard.setLicenseImages(base64, wizard.state.drivingLicenseBackUrl);
      } else {
        wizard.setLicenseImages(wizard.state.drivingLicenseFrontUrl, base64);
      }

      // Process OCR for front image
      if (side === 'front') {
        const response = await fetch('/api/ocr/license', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ imageBase64: base64 }),
        });

        if (!response.ok) {
          throw new Error('OCR processing failed');
        }

        const result = await response.json();

        if (result.success && result.data) {
          wizard.setOcrData(
            {
              fullName: result.data.fullName,
              licenseNumber: result.data.licenseNumber,
              licenseExpiry: result.data.licenseExpiry,
              dateOfBirth: result.data.dateOfBirth,
              nationality: result.data.nationality,
              licenseCategory: result.data.licenseCategory,
            },
            result.validation?.isExpired,
            result.validation?.expiryWarning
          );
        }
      }
    } catch (err) {
      setOcrError(err instanceof Error ? err.message : 'Failed to process image');
    } finally {
      setProcessing(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, side: 'front' | 'back') => {
    const file = e.target.files?.[0];
    if (file) {
      handleImageUpload(file, side);
    }
  };

  const clearImage = (side: 'front' | 'back') => {
    if (side === 'front') {
      wizard.setLicenseImages(null, wizard.state.drivingLicenseBackUrl);
      wizard.setOcrData({}, false, null);
    } else {
      wizard.setLicenseImages(wizard.state.drivingLicenseFrontUrl, null);
    }
  };

  const canProceed = wizard.canProceed(1);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-semibold text-gray-900">Identity Verification</h2>
        <p className="text-sm text-gray-500 mt-1">
          Upload the customer&apos;s driving license to verify eligibility
        </p>
      </div>

      {/* License Expired Warning */}
      {wizard.state.isLicenseExpired && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-red-600 font-medium">License Expired</p>
            <p className="text-sm text-red-500">
              This driving license has expired. The customer cannot proceed with a test drive.
            </p>
          </div>
        </div>
      )}

      {/* Expiry Warning */}
      {wizard.state.expiryWarning && !wizard.state.isLicenseExpired && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <p className="text-amber-600 text-sm">{wizard.state.expiryWarning}</p>
        </div>
      )}

      {/* License Upload */}
      <div className="grid grid-cols-2 gap-4">
        {/* Front */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            License Front *
          </label>
          <input
            ref={frontInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={(e) => handleFileChange(e, 'front')}
            className="hidden"
          />

          {wizard.state.drivingLicenseFrontUrl ? (
            <div className="relative aspect-[3/2] bg-gray-100 rounded-lg overflow-hidden">
              <img
                src={wizard.state.drivingLicenseFrontUrl}
                alt="License front"
                className="w-full h-full object-cover"
              />
              <button
                onClick={() => clearImage('front')}
                className="absolute top-2 right-2 p-1.5 bg-black/50 rounded-full hover:bg-black/70 transition-colors"
              >
                <X className="w-4 h-4 text-white" />
              </button>
              {isProcessingFront && (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                  <Loader2 className="w-8 h-8 text-white animate-spin" />
                </div>
              )}
            </div>
          ) : (
            <button
              onClick={() => frontInputRef.current?.click()}
              disabled={isProcessingFront}
              className="w-full aspect-[3/2] border-2 border-dashed border-gray-300 bg-gray-50 rounded-lg flex flex-col items-center justify-center gap-2 hover:border-blue-600 hover:bg-blue-50 transition-colors"
            >
              {isProcessingFront ? (
                <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
              ) : (
                <>
                  <Camera className="w-8 h-8 text-gray-400" />
                  <span className="text-sm text-gray-500">Capture Front</span>
                </>
              )}
            </button>
          )}
        </div>

        {/* Back */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            License Back (Optional)
          </label>
          <input
            ref={backInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={(e) => handleFileChange(e, 'back')}
            className="hidden"
          />

          {wizard.state.drivingLicenseBackUrl ? (
            <div className="relative aspect-[3/2] bg-gray-100 rounded-lg overflow-hidden">
              <img
                src={wizard.state.drivingLicenseBackUrl}
                alt="License back"
                className="w-full h-full object-cover"
              />
              <button
                onClick={() => clearImage('back')}
                className="absolute top-2 right-2 p-1.5 bg-black/50 rounded-full hover:bg-black/70 transition-colors"
              >
                <X className="w-4 h-4 text-white" />
              </button>
              {isProcessingBack && (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                  <Loader2 className="w-8 h-8 text-white animate-spin" />
                </div>
              )}
            </div>
          ) : (
            <button
              onClick={() => backInputRef.current?.click()}
              disabled={isProcessingBack}
              className="w-full aspect-[3/2] border-2 border-dashed border-gray-300 bg-gray-50 rounded-lg flex flex-col items-center justify-center gap-2 hover:border-blue-600 hover:bg-blue-50 transition-colors"
            >
              {isProcessingBack ? (
                <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
              ) : (
                <>
                  <Camera className="w-8 h-8 text-gray-400" />
                  <span className="text-sm text-gray-500">Capture Back</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {/* OCR Error */}
      {ocrError && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-600">
          {ocrError}
        </div>
      )}

      {/* Extracted Data */}
      {wizard.state.ocrData.fullName && (
        <div className="bg-gray-50 rounded-lg p-4 space-y-4">
          <div className="flex items-center gap-2 text-green-600">
            <CheckCircle className="w-5 h-5" />
            <span className="font-medium">License Data Extracted</span>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-start gap-3">
              <User className="w-4 h-4 text-gray-400 mt-1" />
              <div>
                <p className="text-xs text-gray-400">Full Name</p>
                <p className="text-gray-900 font-medium">{wizard.state.ocrData.fullName}</p>
              </div>
            </div>

            {wizard.state.ocrData.licenseNumber && (
              <div className="flex items-start gap-3">
                <CreditCard className="w-4 h-4 text-gray-400 mt-1" />
                <div>
                  <p className="text-xs text-gray-400">License Number</p>
                  <p className="text-gray-900 font-medium">{wizard.state.ocrData.licenseNumber}</p>
                </div>
              </div>
            )}

            {wizard.state.ocrData.licenseExpiry && (
              <div className="flex items-start gap-3">
                <Calendar className="w-4 h-4 text-gray-400 mt-1" />
                <div>
                  <p className="text-xs text-gray-400">Expiry Date</p>
                  <p className={`font-medium ${wizard.state.isLicenseExpired ? 'text-red-600' : 'text-gray-900'}`}>
                    {new Date(wizard.state.ocrData.licenseExpiry).toLocaleDateString()}
                  </p>
                </div>
              </div>
            )}

            {wizard.state.ocrData.nationality && (
              <div className="flex items-start gap-3">
                <MapPin className="w-4 h-4 text-gray-400 mt-1" />
                <div>
                  <p className="text-xs text-gray-400">Nationality</p>
                  <p className="text-gray-900 font-medium">{wizard.state.ocrData.nationality}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Navigation */}
      <div className="flex justify-end pt-4">
        <button
          onClick={async () => {
            await wizard.saveProgress();
            wizard.nextStep();
          }}
          disabled={!canProceed || wizard.isLoading}
          className="light-btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {wizard.isLoading ? 'Saving...' : 'Continue to Vehicle Selection'}
        </button>
      </div>
    </div>
  );
}
