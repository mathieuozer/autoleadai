'use client';

import { Camera, ArrowLeft, ArrowRight, Info } from 'lucide-react';
import { useTradeInWizard } from '@/hooks/useTradeInWizard';
import { PhotoUploadCard } from '@/components/trade-in';
import { PHOTO_REQUIREMENTS, REQUIRED_PHOTO_COUNT } from '@/lib/trade-in-constants';
import { PhotoType } from '@/types';

interface Step3PhotosProps {
  wizard: ReturnType<typeof useTradeInWizard>;
  appraisalId: string;
}

export function Step3Photos({ wizard, appraisalId }: Step3PhotosProps) {
  const uploadedCount = wizard.state.photos.size;

  const handlePhotoUpload = async (type: PhotoType, file: File) => {
    // In a real app, this would upload to cloud storage
    // For demo, we'll use a data URL
    const reader = new FileReader();
    reader.onloadend = async () => {
      const url = reader.result as string;

      // Add to local state
      wizard.addPhoto(type, {
        id: `temp-${Date.now()}`,
        type,
        url,
        timestamp: new Date().toISOString(),
      });

      // Save to API
      try {
        const response = await fetch(`/api/trade-ins/${appraisalId}/photos`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: type.toUpperCase(),
            url,
          }),
        });
        if (!response.ok) {
          console.error('Failed to save photo:', await response.text());
        }
      } catch (error) {
        console.error('Failed to save photo:', error);
      }
    };
    reader.readAsDataURL(file);
  };

  const handlePhotoRemove = async (type: PhotoType) => {
    const photo = wizard.state.photos.get(type);
    if (!photo) return;

    wizard.removePhoto(type);

    // Remove from API if it has a real ID
    if (!photo.id.startsWith('temp-')) {
      try {
        // Would need to add appraisalId to wizard state
      } catch (error) {
        console.error('Failed to delete photo:', error);
      }
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
          <Camera className="w-6 h-6 text-[#0ea5e9]" />
        </div>
        <div>
          <h2 className="text-xl font-semibold text-white">Vehicle Photos</h2>
          <p className="text-sm text-[#94a3b8]">
            Upload at least 8 photos covering all angles
          </p>
        </div>
      </div>

      {/* Upload Progress */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm">
          <span className="text-[#0ea5e9] font-semibold">{uploadedCount}</span>
          <span className="text-[#64748b]">/ {PHOTO_REQUIREMENTS.length}</span>
        </div>
        <div className="flex items-center gap-2 text-xs text-[#f59e0b] bg-[#f59e0b]/10 px-3 py-1.5 rounded-full">
          <Info className="w-3 h-3" />
          Minimum {REQUIRED_PHOTO_COUNT} required photos
        </div>
      </div>

      {/* Photo Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {PHOTO_REQUIREMENTS.map((req) => (
          <PhotoUploadCard
            key={req.type}
            type={req.type}
            label={req.label}
            required={req.required}
            photo={wizard.state.photos.get(req.type)}
            onUpload={(file) => handlePhotoUpload(req.type, file)}
            onRemove={() => handlePhotoRemove(req.type)}
          />
        ))}
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
          disabled={!wizard.canProceed(3) || wizard.isLoading}
          className="dark-btn-primary flex-1 justify-center disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {wizard.isLoading ? (
            'Saving...'
          ) : (
            <>
              Review & Submit
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </div>
    </div>
  );
}
