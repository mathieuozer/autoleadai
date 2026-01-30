'use client';

import { useState, useRef } from 'react';
import {
  Camera,
  CheckCircle,
  AlertTriangle,
  Loader2,
  User,
  CreditCard,
  Calendar,
  MapPin,
  X,
  IdCard,
} from 'lucide-react';
import { useTestDriveWizard } from '@/hooks/useTestDriveWizard';

interface Step1IdentityProps {
  wizard: ReturnType<typeof useTestDriveWizard>;
}

export function Step1Identity({ wizard }: Step1IdentityProps) {
  // License processing states
  const [isProcessingLicenseFront, setIsProcessingLicenseFront] = useState(false);
  const [isProcessingLicenseBack, setIsProcessingLicenseBack] = useState(false);
  const [licenseOcrError, setLicenseOcrError] = useState<string | null>(null);

  // National ID processing states
  const [isProcessingIdFront, setIsProcessingIdFront] = useState(false);
  const [isProcessingIdBack, setIsProcessingIdBack] = useState(false);
  const [nationalIdOcrError, setNationalIdOcrError] = useState<string | null>(null);

  // Refs
  const licenseFrontRef = useRef<HTMLInputElement>(null);
  const licenseBackRef = useRef<HTMLInputElement>(null);
  const idFrontRef = useRef<HTMLInputElement>(null);
  const idBackRef = useRef<HTMLInputElement>(null);

  const handleLicenseUpload = async (file: File, side: 'front' | 'back') => {
    const setProcessing = side === 'front' ? setIsProcessingLicenseFront : setIsProcessingLicenseBack;
    setProcessing(true);
    setLicenseOcrError(null);

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
      setLicenseOcrError(err instanceof Error ? err.message : 'Failed to process license image');
    } finally {
      setProcessing(false);
    }
  };

  const handleNationalIdUpload = async (file: File, side: 'front' | 'back') => {
    const setProcessing = side === 'front' ? setIsProcessingIdFront : setIsProcessingIdBack;
    setProcessing(true);
    setNationalIdOcrError(null);

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
        wizard.setNationalIdImages(base64, wizard.state.nationalIdBackUrl);
      } else {
        wizard.setNationalIdImages(wizard.state.nationalIdFrontUrl, base64);
      }

      // Process OCR for front image
      if (side === 'front') {
        const response = await fetch('/api/ocr/national-id', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ imageBase64: base64 }),
        });

        if (!response.ok) {
          throw new Error('OCR processing failed');
        }

        const result = await response.json();

        if (result.success && result.data) {
          wizard.setNationalIdOcrData(
            {
              fullNameEn: result.data.fullNameEn,
              fullNameAr: result.data.fullNameAr,
              emiratesIdNumber: result.data.emiratesIdNumber,
              dateOfBirth: result.data.dateOfBirth,
              nationality: result.data.nationality,
              expiryDate: result.data.expiryDate,
              gender: result.data.gender,
            },
            result.validation?.isExpired,
            result.validation?.expiryWarning
          );
        }
      }
    } catch (err) {
      setNationalIdOcrError(err instanceof Error ? err.message : 'Failed to process Emirates ID image');
    } finally {
      setProcessing(false);
    }
  };

  const handleLicenseFileChange = (e: React.ChangeEvent<HTMLInputElement>, side: 'front' | 'back') => {
    const file = e.target.files?.[0];
    if (file) {
      handleLicenseUpload(file, side);
    }
  };

  const handleNationalIdFileChange = (e: React.ChangeEvent<HTMLInputElement>, side: 'front' | 'back') => {
    const file = e.target.files?.[0];
    if (file) {
      handleNationalIdUpload(file, side);
    }
  };

  const clearLicenseImage = (side: 'front' | 'back') => {
    if (side === 'front') {
      wizard.setLicenseImages(null, wizard.state.drivingLicenseBackUrl);
      wizard.setOcrData({}, false, null);
    } else {
      wizard.setLicenseImages(wizard.state.drivingLicenseFrontUrl, null);
    }
  };

  const clearNationalIdImage = (side: 'front' | 'back') => {
    if (side === 'front') {
      wizard.setNationalIdImages(null, wizard.state.nationalIdBackUrl);
      wizard.setNationalIdOcrData({}, false, null);
    } else {
      wizard.setNationalIdImages(wizard.state.nationalIdFrontUrl, null);
    }
  };

  const canProceed = wizard.canProceed(1);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-semibold text-gray-900">Identity Verification</h2>
        <p className="text-sm text-gray-500 mt-1">
          Upload the customer&apos;s driving license and Emirates ID to verify eligibility
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

      {/* License Expiry Warning */}
      {wizard.state.expiryWarning && !wizard.state.isLicenseExpired && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <p className="text-amber-600 text-sm">{wizard.state.expiryWarning}</p>
        </div>
      )}

      {/* National ID Expired Warning */}
      {wizard.state.isNationalIdExpired && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-red-600 font-medium">Emirates ID Expired</p>
            <p className="text-sm text-red-500">
              This Emirates ID has expired.
            </p>
          </div>
        </div>
      )}

      {/* National ID Expiry Warning */}
      {wizard.state.nationalIdExpiryWarning && !wizard.state.isNationalIdExpired && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <p className="text-amber-600 text-sm">{wizard.state.nationalIdExpiryWarning}</p>
        </div>
      )}

      {/* Name Match Warning */}
      {wizard.state.nameMatchWarning && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <p className="text-amber-600 text-sm">{wizard.state.nameMatchWarning}</p>
        </div>
      )}

      {/* Section: Driving License */}
      <div className="space-y-4">
        <h3 className="text-md font-medium text-gray-900 flex items-center gap-2">
          <CreditCard className="w-5 h-5 text-violet-600" />
          Driving License
        </h3>

        <div className="grid grid-cols-2 gap-4">
          {/* License Front */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              License Front *
            </label>
            <input
              ref={licenseFrontRef}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={(e) => handleLicenseFileChange(e, 'front')}
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
                  onClick={() => clearLicenseImage('front')}
                  className="absolute top-2 right-2 p-1.5 bg-black/50 rounded-full hover:bg-black/70 transition-colors"
                >
                  <X className="w-4 h-4 text-white" />
                </button>
                {isProcessingLicenseFront && (
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                    <Loader2 className="w-8 h-8 text-white animate-spin" />
                  </div>
                )}
              </div>
            ) : (
              <button
                onClick={() => licenseFrontRef.current?.click()}
                disabled={isProcessingLicenseFront}
                className="w-full aspect-[3/2] border-2 border-dashed border-gray-300 bg-gray-50 rounded-lg flex flex-col items-center justify-center gap-2 hover:border-violet-600 hover:bg-violet-50 transition-colors"
              >
                {isProcessingLicenseFront ? (
                  <Loader2 className="w-8 h-8 text-violet-600 animate-spin" />
                ) : (
                  <>
                    <Camera className="w-8 h-8 text-gray-400" />
                    <span className="text-sm text-gray-500">Capture Front</span>
                  </>
                )}
              </button>
            )}
          </div>

          {/* License Back */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              License Back (Optional)
            </label>
            <input
              ref={licenseBackRef}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={(e) => handleLicenseFileChange(e, 'back')}
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
                  onClick={() => clearLicenseImage('back')}
                  className="absolute top-2 right-2 p-1.5 bg-black/50 rounded-full hover:bg-black/70 transition-colors"
                >
                  <X className="w-4 h-4 text-white" />
                </button>
                {isProcessingLicenseBack && (
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                    <Loader2 className="w-8 h-8 text-white animate-spin" />
                  </div>
                )}
              </div>
            ) : (
              <button
                onClick={() => licenseBackRef.current?.click()}
                disabled={isProcessingLicenseBack}
                className="w-full aspect-[3/2] border-2 border-dashed border-gray-300 bg-gray-50 rounded-lg flex flex-col items-center justify-center gap-2 hover:border-violet-600 hover:bg-violet-50 transition-colors"
              >
                {isProcessingLicenseBack ? (
                  <Loader2 className="w-8 h-8 text-violet-600 animate-spin" />
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

        {/* License OCR Error */}
        {licenseOcrError && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-600">
            {licenseOcrError}
          </div>
        )}

        {/* License Extracted Data */}
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
      </div>

      {/* Section: Emirates ID */}
      <div className="space-y-4">
        <h3 className="text-md font-medium text-gray-900 flex items-center gap-2">
          <IdCard className="w-5 h-5 text-violet-600" />
          Emirates ID (Optional)
        </h3>

        <div className="grid grid-cols-2 gap-4">
          {/* ID Front */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Emirates ID Front
            </label>
            <input
              ref={idFrontRef}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={(e) => handleNationalIdFileChange(e, 'front')}
              className="hidden"
            />

            {wizard.state.nationalIdFrontUrl ? (
              <div className="relative aspect-[3/2] bg-gray-100 rounded-lg overflow-hidden">
                <img
                  src={wizard.state.nationalIdFrontUrl}
                  alt="Emirates ID front"
                  className="w-full h-full object-cover"
                />
                <button
                  onClick={() => clearNationalIdImage('front')}
                  className="absolute top-2 right-2 p-1.5 bg-black/50 rounded-full hover:bg-black/70 transition-colors"
                >
                  <X className="w-4 h-4 text-white" />
                </button>
                {isProcessingIdFront && (
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                    <Loader2 className="w-8 h-8 text-white animate-spin" />
                  </div>
                )}
              </div>
            ) : (
              <button
                onClick={() => idFrontRef.current?.click()}
                disabled={isProcessingIdFront}
                className="w-full aspect-[3/2] border-2 border-dashed border-gray-300 bg-gray-50 rounded-lg flex flex-col items-center justify-center gap-2 hover:border-violet-600 hover:bg-violet-50 transition-colors"
              >
                {isProcessingIdFront ? (
                  <Loader2 className="w-8 h-8 text-violet-600 animate-spin" />
                ) : (
                  <>
                    <Camera className="w-8 h-8 text-gray-400" />
                    <span className="text-sm text-gray-500">Capture Front</span>
                  </>
                )}
              </button>
            )}
          </div>

          {/* ID Back */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Emirates ID Back
            </label>
            <input
              ref={idBackRef}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={(e) => handleNationalIdFileChange(e, 'back')}
              className="hidden"
            />

            {wizard.state.nationalIdBackUrl ? (
              <div className="relative aspect-[3/2] bg-gray-100 rounded-lg overflow-hidden">
                <img
                  src={wizard.state.nationalIdBackUrl}
                  alt="Emirates ID back"
                  className="w-full h-full object-cover"
                />
                <button
                  onClick={() => clearNationalIdImage('back')}
                  className="absolute top-2 right-2 p-1.5 bg-black/50 rounded-full hover:bg-black/70 transition-colors"
                >
                  <X className="w-4 h-4 text-white" />
                </button>
                {isProcessingIdBack && (
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                    <Loader2 className="w-8 h-8 text-white animate-spin" />
                  </div>
                )}
              </div>
            ) : (
              <button
                onClick={() => idBackRef.current?.click()}
                disabled={isProcessingIdBack}
                className="w-full aspect-[3/2] border-2 border-dashed border-gray-300 bg-gray-50 rounded-lg flex flex-col items-center justify-center gap-2 hover:border-violet-600 hover:bg-violet-50 transition-colors"
              >
                {isProcessingIdBack ? (
                  <Loader2 className="w-8 h-8 text-violet-600 animate-spin" />
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

        {/* National ID OCR Error */}
        {nationalIdOcrError && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-600">
            {nationalIdOcrError}
          </div>
        )}

        {/* National ID Extracted Data */}
        {wizard.state.nationalIdOcrData.emiratesIdNumber && (
          <div className="bg-gray-50 rounded-lg p-4 space-y-4">
            <div className="flex items-center gap-2 text-green-600">
              <CheckCircle className="w-5 h-5" />
              <span className="font-medium">Emirates ID Data Extracted</span>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-start gap-3">
                <IdCard className="w-4 h-4 text-gray-400 mt-1" />
                <div>
                  <p className="text-xs text-gray-400">Emirates ID Number</p>
                  <p className="text-gray-900 font-medium">{wizard.state.nationalIdOcrData.emiratesIdNumber}</p>
                </div>
              </div>

              {wizard.state.nationalIdOcrData.fullNameEn && (
                <div className="flex items-start gap-3">
                  <User className="w-4 h-4 text-gray-400 mt-1" />
                  <div>
                    <p className="text-xs text-gray-400">Name (English)</p>
                    <p className="text-gray-900 font-medium">{wizard.state.nationalIdOcrData.fullNameEn}</p>
                  </div>
                </div>
              )}

              {wizard.state.nationalIdOcrData.fullNameAr && (
                <div className="flex items-start gap-3">
                  <User className="w-4 h-4 text-gray-400 mt-1" />
                  <div>
                    <p className="text-xs text-gray-400">Name (Arabic)</p>
                    <p className="text-gray-900 font-medium" dir="rtl">{wizard.state.nationalIdOcrData.fullNameAr}</p>
                  </div>
                </div>
              )}

              {wizard.state.nationalIdOcrData.expiryDate && (
                <div className="flex items-start gap-3">
                  <Calendar className="w-4 h-4 text-gray-400 mt-1" />
                  <div>
                    <p className="text-xs text-gray-400">Expiry Date</p>
                    <p className={`font-medium ${wizard.state.isNationalIdExpired ? 'text-red-600' : 'text-gray-900'}`}>
                      {new Date(wizard.state.nationalIdOcrData.expiryDate).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              )}

              {wizard.state.nationalIdOcrData.nationality && (
                <div className="flex items-start gap-3">
                  <MapPin className="w-4 h-4 text-gray-400 mt-1" />
                  <div>
                    <p className="text-xs text-gray-400">Nationality</p>
                    <p className="text-gray-900 font-medium">{wizard.state.nationalIdOcrData.nationality}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

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
