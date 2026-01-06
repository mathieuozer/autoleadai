'use client';

import { useRef, useState } from 'react';
import { CreditCard, Upload, Check, ArrowRight, Loader2, Scan } from 'lucide-react';
import { useTradeInWizard } from '@/hooks/useTradeInWizard';

// Helper to check if URL is base64 data URL
const isDataUrl = (url: string) => url?.startsWith('data:');

interface Step1RegistrationProps {
  wizard: ReturnType<typeof useTradeInWizard>;
}

export function Step1Registration({ wizard }: Step1RegistrationProps) {
  const frontInputRef = useRef<HTMLInputElement>(null);
  const backInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isProcessingOCR, setIsProcessingOCR] = useState(false);
  const [ocrError, setOcrError] = useState<string | null>(null);

  // Use ref to accumulate OCR data (avoids race condition with React state)
  const ocrAccumulator = useRef<Record<string, unknown>>({});

  const processOCR = async (imageBase64: string, side: 'front' | 'back') => {
    setIsProcessingOCR(true);
    setOcrError(null);

    try {
      const response = await fetch('/api/ocr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageBase64 }),
      });

      const result = await response.json();

      if (result.success && result.data) {
        // Accumulate OCR results in ref (not affected by React state batching)
        const data = result.data;
        if (data.customerName) ocrAccumulator.current.customerName = data.customerName;
        if (data.trafficFileNumber) ocrAccumulator.current.trafficFileNumber = data.trafficFileNumber;
        if (data.plateNumber) ocrAccumulator.current.plateNumber = data.plateNumber;
        if (data.emirateCode) ocrAccumulator.current.emirateCode = data.emirateCode;
        if (data.vin) ocrAccumulator.current.vin = data.vin;
        if (data.engineNumber) ocrAccumulator.current.engineNumber = data.engineNumber;
        if (data.vehicleMake) ocrAccumulator.current.vehicleMake = data.vehicleMake;
        if (data.vehicleModel) ocrAccumulator.current.vehicleModel = data.vehicleModel;
        if (data.vehicleTrim) ocrAccumulator.current.vehicleTrim = data.vehicleTrim;
        if (data.vehicleColor) ocrAccumulator.current.vehicleColor = data.vehicleColor;
        if (data.vehicleType) ocrAccumulator.current.vehicleType = data.vehicleType;
        if (data.registrationYear) ocrAccumulator.current.registrationYear = data.registrationYear;
        if (data.registrationDate) ocrAccumulator.current.registrationDate = data.registrationDate;
        if (data.expiryDate) ocrAccumulator.current.expiryDate = data.expiryDate;
        if (data.insuranceCompany) ocrAccumulator.current.insuranceCompany = data.insuranceCompany;
        if (data.insuranceExpiry) ocrAccumulator.current.insuranceExpiry = data.insuranceExpiry;
        if (data.mortgageInfo) ocrAccumulator.current.mortgageInfo = data.mortgageInfo;

        // Update wizard state with accumulated data
        wizard.setOcrData({
          customerName: ocrAccumulator.current.customerName as string,
          trafficFileNumber: ocrAccumulator.current.trafficFileNumber as string,
          plateNumber: ocrAccumulator.current.plateNumber as string,
          emirateCode: ocrAccumulator.current.emirateCode as string,
          vin: ocrAccumulator.current.vin as string,
          engineNumber: ocrAccumulator.current.engineNumber as string,
          vehicleMake: ocrAccumulator.current.vehicleMake as string,
          vehicleModel: ocrAccumulator.current.vehicleModel as string,
          vehicleTrim: ocrAccumulator.current.vehicleTrim as string,
          vehicleColor: ocrAccumulator.current.vehicleColor as string,
          vehicleType: ocrAccumulator.current.vehicleType as string,
          registrationYear: ocrAccumulator.current.registrationYear as number,
          registrationDate: ocrAccumulator.current.registrationDate as string,
          expiryDate: ocrAccumulator.current.expiryDate as string,
          insuranceCompany: ocrAccumulator.current.insuranceCompany as string,
          insuranceExpiry: ocrAccumulator.current.insuranceExpiry as string,
          mortgageInfo: ocrAccumulator.current.mortgageInfo as string,
        });
      } else if (result.error) {
        setOcrError(result.error);
      }
    } catch (error) {
      console.error('OCR error:', error);
      setOcrError('Failed to process image');
    } finally {
      setIsProcessingOCR(false);
    }
  };

  const handleFileUpload = async (side: 'front' | 'back', file: File) => {
    setIsUploading(true);

    try {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const url = reader.result as string;
        if (side === 'front') {
          wizard.setRegistrationImages(url, wizard.state.registrationBackUrl);
        } else {
          wizard.setRegistrationImages(wizard.state.registrationFrontUrl, url);
        }
        // Trigger OCR for both sides - merge results
        await processOCR(url, side);
        setIsUploading(false);
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error('Upload error:', error);
      setIsUploading(false);
    }
  };

  const handleContinue = async () => {
    await wizard.saveProgress();
    wizard.nextStep();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center">
          <CreditCard className="w-6 h-6 text-blue-600" />
        </div>
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Registration Card</h2>
          <p className="text-sm text-gray-500">
            Scan or upload the vehicle registration card
          </p>
        </div>
      </div>

      {/* Upload Zones */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Front Side */}
        <div
          onClick={() => frontInputRef.current?.click()}
          className={`
            aspect-[3/2] rounded-lg border-2 border-dashed cursor-pointer
            flex flex-col items-center justify-center overflow-hidden
            transition-all duration-200
            ${
              wizard.state.registrationFrontUrl
                ? 'border-green-500 bg-green-50'
                : 'border-gray-300 hover:border-gray-400 bg-gray-50'
            }
          `}
        >
          <input
            ref={frontInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleFileUpload('front', file);
              e.target.value = '';
            }}
          />

          {wizard.state.registrationFrontUrl ? (
            <div className="relative w-full h-full">
              <img
                src={wizard.state.registrationFrontUrl}
                alt="Registration Front"
                className="w-full h-full object-cover"
              />
              <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-green-500 flex items-center justify-center">
                <Check className="w-4 h-4 text-white" />
              </div>
            </div>
          ) : (
            <>
              <Upload className="w-8 h-8 text-gray-400 mb-2" />
              <span className="text-sm font-medium text-gray-900">Front Side</span>
              <span className="text-xs text-gray-400 mt-1">Owner & plate info</span>
            </>
          )}
        </div>

        {/* Back Side */}
        <div
          onClick={() => backInputRef.current?.click()}
          className={`
            aspect-[3/2] rounded-lg border-2 border-dashed cursor-pointer
            flex flex-col items-center justify-center overflow-hidden
            transition-all duration-200
            ${
              wizard.state.registrationBackUrl
                ? 'border-green-500 bg-green-50'
                : 'border-gray-300 hover:border-gray-400 bg-gray-50'
            }
          `}
        >
          <input
            ref={backInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleFileUpload('back', file);
              e.target.value = '';
            }}
          />

          {wizard.state.registrationBackUrl ? (
            <div className="relative w-full h-full">
              <img
                src={wizard.state.registrationBackUrl}
                alt="Registration Back"
                className="w-full h-full object-cover"
              />
              <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-green-500 flex items-center justify-center">
                <Check className="w-4 h-4 text-white" />
              </div>
            </div>
          ) : (
            <>
              <Upload className="w-8 h-8 text-gray-400 mb-2" />
              <span className="text-sm font-medium text-gray-900">Back Side</span>
              <span className="text-xs text-gray-400 mt-1">Vehicle info (VIN, Make, Model)</span>
            </>
          )}
        </div>
      </div>

      {/* OCR Processing Status */}
      {isProcessingOCR && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-center gap-3">
          <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />
          <div>
            <span className="text-sm text-blue-600 font-medium">Processing registration card...</span>
            <p className="text-xs text-gray-500 mt-0.5">Extracting vehicle information with AI</p>
          </div>
        </div>
      )}

      {/* OCR Error */}
      {ocrError && !isProcessingOCR && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-center gap-3">
          <Scan className="w-5 h-5 text-amber-600" />
          <div>
            <span className="text-sm text-amber-600">Could not extract all information</span>
            <p className="text-xs text-gray-500 mt-0.5">You can enter details manually in the next step</p>
          </div>
        </div>
      )}

      {/* Success Message */}
      {wizard.state.registrationFrontUrl && !isProcessingOCR && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center gap-3">
          <Check className="w-5 h-5 text-green-600" />
          <span className="text-sm text-green-600">
            Registration card{wizard.state.registrationBackUrl ? 's' : ''} uploaded successfully
          </span>
        </div>
      )}

      {/* OCR Data Preview (if available) */}
      {(wizard.state.ocrData.vehicleMake || wizard.state.ocrData.plateNumber || wizard.state.ocrData.vin || wizard.state.ocrData.customerName) && !isProcessingOCR && (
        <div className="bg-gray-50 rounded-lg p-4 space-y-3">
          <div className="flex items-center gap-2">
            <Scan className="w-4 h-4 text-green-600" />
            <h3 className="text-sm font-medium text-gray-900">Extracted Information (Mulkiyah)</h3>
          </div>
          <div className="grid grid-cols-2 gap-3 text-sm">
            {/* Owner Details */}
            {wizard.state.ocrData.customerName && (
              <div className="col-span-2">
                <span className="text-gray-500">Owner: </span>
                <span className="text-gray-900 font-medium">{wizard.state.ocrData.customerName}</span>
              </div>
            )}
            {wizard.state.ocrData.trafficFileNumber && (
              <div>
                <span className="text-gray-500">T.C. No: </span>
                <span className="text-gray-900">{wizard.state.ocrData.trafficFileNumber}</span>
              </div>
            )}
            {/* Plate Information */}
            {wizard.state.ocrData.plateNumber && (
              <div>
                <span className="text-gray-500">Plate: </span>
                <span className="text-gray-900 font-medium">{wizard.state.ocrData.plateNumber}</span>
              </div>
            )}
            {/* Vehicle Details */}
            {wizard.state.ocrData.vehicleMake && (
              <div>
                <span className="text-gray-500">Make: </span>
                <span className="text-gray-900">{wizard.state.ocrData.vehicleMake}</span>
              </div>
            )}
            {wizard.state.ocrData.vehicleModel && (
              <div>
                <span className="text-gray-500">Model: </span>
                <span className="text-gray-900">{wizard.state.ocrData.vehicleModel}</span>
              </div>
            )}
            {wizard.state.ocrData.registrationYear && (
              <div>
                <span className="text-gray-500">Year: </span>
                <span className="text-gray-900">{wizard.state.ocrData.registrationYear}</span>
              </div>
            )}
            {wizard.state.ocrData.vehicleColor && (
              <div>
                <span className="text-gray-500">Color: </span>
                <span className="text-gray-900">{wizard.state.ocrData.vehicleColor}</span>
              </div>
            )}
            {wizard.state.ocrData.vehicleType && (
              <div>
                <span className="text-gray-500">Type: </span>
                <span className="text-gray-900">{wizard.state.ocrData.vehicleType}</span>
              </div>
            )}
            {/* Identification */}
            {wizard.state.ocrData.vin && (
              <div className="col-span-2">
                <span className="text-gray-500">VIN: </span>
                <span className="text-gray-900 font-mono text-xs">{wizard.state.ocrData.vin}</span>
              </div>
            )}
            {wizard.state.ocrData.engineNumber && (
              <div className="col-span-2">
                <span className="text-gray-500">Engine No: </span>
                <span className="text-gray-900 font-mono text-xs">{wizard.state.ocrData.engineNumber}</span>
              </div>
            )}
            {/* Dates */}
            {wizard.state.ocrData.expiryDate && (
              <div>
                <span className="text-gray-500">Expiry: </span>
                <span className="text-gray-900">{wizard.state.ocrData.expiryDate}</span>
              </div>
            )}
            {/* Insurance */}
            {wizard.state.ocrData.insuranceCompany && (
              <div>
                <span className="text-gray-500">Insurance: </span>
                <span className="text-gray-900">{wizard.state.ocrData.insuranceCompany}</span>
              </div>
            )}
            {/* Mortgage */}
            {wizard.state.ocrData.mortgageInfo && (
              <div className="col-span-2">
                <span className="text-gray-500">Mortgage: </span>
                <span className="text-amber-600">{wizard.state.ocrData.mortgageInfo}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Continue Button */}
      <button
        onClick={handleContinue}
        disabled={!wizard.canProceed(1) || wizard.isLoading || isUploading || isProcessingOCR}
        className="light-btn-primary w-full justify-center disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {wizard.isLoading ? (
          'Saving...'
        ) : isProcessingOCR ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Processing...
          </>
        ) : (
          <>
            Continue to Vehicle Details
            <ArrowRight className="w-4 h-4" />
          </>
        )}
      </button>
    </div>
  );
}
