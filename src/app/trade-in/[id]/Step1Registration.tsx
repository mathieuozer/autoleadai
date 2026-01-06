'use client';

import { useRef, useState } from 'react';
import { CreditCard, Upload, Check, ArrowRight, Loader2, Scan } from 'lucide-react';
import Image from 'next/image';
import { useTradeInWizard } from '@/hooks/useTradeInWizard';

interface Step1RegistrationProps {
  wizard: ReturnType<typeof useTradeInWizard>;
}

export function Step1Registration({ wizard }: Step1RegistrationProps) {
  const frontInputRef = useRef<HTMLInputElement>(null);
  const backInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isProcessingOCR, setIsProcessingOCR] = useState(false);
  const [ocrError, setOcrError] = useState<string | null>(null);

  const processOCR = async (imageBase64: string) => {
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
        // Update wizard state with OCR results
        wizard.setOcrData({
          customerName: result.data.customerName,
          vehicleMake: result.data.vehicleMake,
          vehicleModel: result.data.vehicleModel,
          vehicleTrim: result.data.vehicleTrim,
          vin: result.data.vin,
          plateNumber: result.data.plateNumber,
          registrationYear: result.data.registrationYear,
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
          // Trigger OCR for front side
          await processOCR(url);
        } else {
          wizard.setRegistrationImages(wizard.state.registrationFrontUrl, url);
        }
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
        <div className="w-12 h-12 rounded-full bg-[#0ea5e9]/10 flex items-center justify-center">
          <CreditCard className="w-6 h-6 text-[#0ea5e9]" />
        </div>
        <div>
          <h2 className="text-xl font-semibold text-white">Registration Card</h2>
          <p className="text-sm text-[#94a3b8]">
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
                ? 'border-[#22c55e] bg-[#22c55e]/5'
                : 'border-[#475569] hover:border-[#64748b] bg-[#1e293b]'
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
              <Image
                src={wizard.state.registrationFrontUrl}
                alt="Registration Front"
                fill
                className="object-cover"
              />
              <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-[#22c55e] flex items-center justify-center">
                <Check className="w-4 h-4 text-white" />
              </div>
            </div>
          ) : (
            <>
              <Upload className="w-8 h-8 text-[#64748b] mb-2" />
              <span className="text-sm font-medium text-white">Front Side</span>
              <span className="text-xs text-[#64748b] mt-1">Tap to upload</span>
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
                ? 'border-[#22c55e] bg-[#22c55e]/5'
                : 'border-[#475569] hover:border-[#64748b] bg-[#1e293b]'
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
              <Image
                src={wizard.state.registrationBackUrl}
                alt="Registration Back"
                fill
                className="object-cover"
              />
              <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-[#22c55e] flex items-center justify-center">
                <Check className="w-4 h-4 text-white" />
              </div>
            </div>
          ) : (
            <>
              <Upload className="w-8 h-8 text-[#64748b] mb-2" />
              <span className="text-sm font-medium text-white">Back Side</span>
              <span className="text-xs text-[#64748b] mt-1">Tap to upload (optional)</span>
            </>
          )}
        </div>
      </div>

      {/* OCR Processing Status */}
      {isProcessingOCR && (
        <div className="bg-[#0ea5e9]/10 border border-[#0ea5e9]/30 rounded-lg p-4 flex items-center gap-3">
          <Loader2 className="w-5 h-5 text-[#0ea5e9] animate-spin" />
          <div>
            <span className="text-sm text-[#0ea5e9] font-medium">Processing registration card...</span>
            <p className="text-xs text-[#64748b] mt-0.5">Extracting vehicle information with AI</p>
          </div>
        </div>
      )}

      {/* OCR Error */}
      {ocrError && !isProcessingOCR && (
        <div className="bg-[#f59e0b]/10 border border-[#f59e0b]/30 rounded-lg p-4 flex items-center gap-3">
          <Scan className="w-5 h-5 text-[#f59e0b]" />
          <div>
            <span className="text-sm text-[#f59e0b]">Could not extract all information</span>
            <p className="text-xs text-[#64748b] mt-0.5">You can enter details manually in the next step</p>
          </div>
        </div>
      )}

      {/* Success Message */}
      {wizard.state.registrationFrontUrl && !isProcessingOCR && (
        <div className="bg-[#22c55e]/10 border border-[#22c55e]/30 rounded-lg p-4 flex items-center gap-3">
          <Check className="w-5 h-5 text-[#22c55e]" />
          <span className="text-sm text-[#22c55e]">
            Registration card{wizard.state.registrationBackUrl ? 's' : ''} uploaded successfully
          </span>
        </div>
      )}

      {/* OCR Data Preview (if available) */}
      {(wizard.state.ocrData.vehicleMake || wizard.state.ocrData.plateNumber || wizard.state.ocrData.vin || wizard.state.ocrData.customerName) && !isProcessingOCR && (
        <div className="bg-[#334155] rounded-lg p-4 space-y-3">
          <div className="flex items-center gap-2">
            <Scan className="w-4 h-4 text-[#22c55e]" />
            <h3 className="text-sm font-medium text-white">Extracted Information</h3>
          </div>
          <div className="grid grid-cols-2 gap-3 text-sm">
            {wizard.state.ocrData.customerName && (
              <div className="col-span-2">
                <span className="text-[#64748b]">Owner: </span>
                <span className="text-white font-medium">{wizard.state.ocrData.customerName}</span>
              </div>
            )}
            {wizard.state.ocrData.vehicleMake && (
              <div>
                <span className="text-[#64748b]">Make: </span>
                <span className="text-white">{wizard.state.ocrData.vehicleMake}</span>
              </div>
            )}
            {wizard.state.ocrData.vehicleModel && (
              <div>
                <span className="text-[#64748b]">Model: </span>
                <span className="text-white">{wizard.state.ocrData.vehicleModel}</span>
              </div>
            )}
            {wizard.state.ocrData.plateNumber && (
              <div>
                <span className="text-[#64748b]">Plate: </span>
                <span className="text-white">{wizard.state.ocrData.plateNumber}</span>
              </div>
            )}
            {wizard.state.ocrData.registrationYear && (
              <div>
                <span className="text-[#64748b]">Year: </span>
                <span className="text-white">{wizard.state.ocrData.registrationYear}</span>
              </div>
            )}
            {wizard.state.ocrData.vin && (
              <div className="col-span-2">
                <span className="text-[#64748b]">VIN: </span>
                <span className="text-white font-mono text-xs">{wizard.state.ocrData.vin}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Continue Button */}
      <button
        onClick={handleContinue}
        disabled={!wizard.canProceed(1) || wizard.isLoading || isUploading || isProcessingOCR}
        className="dark-btn-primary w-full justify-center disabled:opacity-50 disabled:cursor-not-allowed"
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
