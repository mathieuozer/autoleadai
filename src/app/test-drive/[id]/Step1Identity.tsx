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
        <h2 className="text-xl font-semibold text-white">Identity Verification</h2>
        <p className="text-sm text-[#94a3b8] mt-1">
          Upload the customer&apos;s driving license to verify eligibility
        </p>
      </div>

      {/* License Expired Warning */}
      {wizard.state.isLicenseExpired && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-red-400 font-medium">License Expired</p>
            <p className="text-sm text-red-400/80">
              This driving license has expired. The customer cannot proceed with a test drive.
            </p>
          </div>
        </div>
      )}

      {/* Expiry Warning */}
      {wizard.state.expiryWarning && !wizard.state.isLicenseExpired && (
        <div className="bg-[#f59e0b]/10 border border-[#f59e0b]/30 rounded-lg p-4 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-[#f59e0b] flex-shrink-0 mt-0.5" />
          <p className="text-[#f59e0b] text-sm">{wizard.state.expiryWarning}</p>
        </div>
      )}

      {/* License Upload */}
      <div className="grid grid-cols-2 gap-4">
        {/* Front */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-[#f8fafc]">
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
            <div className="relative aspect-[3/2] bg-[#0f172a] rounded-lg overflow-hidden">
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
              className="w-full aspect-[3/2] border-2 border-dashed border-[#475569] rounded-lg flex flex-col items-center justify-center gap-2 hover:border-[#0ea5e9] hover:bg-[#0ea5e9]/5 transition-colors"
            >
              {isProcessingFront ? (
                <Loader2 className="w-8 h-8 text-[#0ea5e9] animate-spin" />
              ) : (
                <>
                  <Camera className="w-8 h-8 text-[#64748b]" />
                  <span className="text-sm text-[#94a3b8]">Capture Front</span>
                </>
              )}
            </button>
          )}
        </div>

        {/* Back */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-[#f8fafc]">
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
            <div className="relative aspect-[3/2] bg-[#0f172a] rounded-lg overflow-hidden">
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
              className="w-full aspect-[3/2] border-2 border-dashed border-[#475569] rounded-lg flex flex-col items-center justify-center gap-2 hover:border-[#0ea5e9] hover:bg-[#0ea5e9]/5 transition-colors"
            >
              {isProcessingBack ? (
                <Loader2 className="w-8 h-8 text-[#0ea5e9] animate-spin" />
              ) : (
                <>
                  <Camera className="w-8 h-8 text-[#64748b]" />
                  <span className="text-sm text-[#94a3b8]">Capture Back</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {/* OCR Error */}
      {ocrError && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 text-sm text-red-400">
          {ocrError}
        </div>
      )}

      {/* Extracted Data */}
      {wizard.state.ocrData.fullName && (
        <div className="bg-[#1e293b] rounded-lg p-4 space-y-4">
          <div className="flex items-center gap-2 text-[#22c55e]">
            <CheckCircle className="w-5 h-5" />
            <span className="font-medium">License Data Extracted</span>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-start gap-3">
              <User className="w-4 h-4 text-[#64748b] mt-1" />
              <div>
                <p className="text-xs text-[#64748b]">Full Name</p>
                <p className="text-white font-medium">{wizard.state.ocrData.fullName}</p>
              </div>
            </div>

            {wizard.state.ocrData.licenseNumber && (
              <div className="flex items-start gap-3">
                <CreditCard className="w-4 h-4 text-[#64748b] mt-1" />
                <div>
                  <p className="text-xs text-[#64748b]">License Number</p>
                  <p className="text-white font-medium">{wizard.state.ocrData.licenseNumber}</p>
                </div>
              </div>
            )}

            {wizard.state.ocrData.licenseExpiry && (
              <div className="flex items-start gap-3">
                <Calendar className="w-4 h-4 text-[#64748b] mt-1" />
                <div>
                  <p className="text-xs text-[#64748b]">Expiry Date</p>
                  <p className={`font-medium ${wizard.state.isLicenseExpired ? 'text-red-400' : 'text-white'}`}>
                    {new Date(wizard.state.ocrData.licenseExpiry).toLocaleDateString()}
                  </p>
                </div>
              </div>
            )}

            {wizard.state.ocrData.nationality && (
              <div className="flex items-start gap-3">
                <MapPin className="w-4 h-4 text-[#64748b] mt-1" />
                <div>
                  <p className="text-xs text-[#64748b]">Nationality</p>
                  <p className="text-white font-medium">{wizard.state.ocrData.nationality}</p>
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
          className="dark-btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {wizard.isLoading ? 'Saving...' : 'Continue to Vehicle Selection'}
        </button>
      </div>
    </div>
  );
}
