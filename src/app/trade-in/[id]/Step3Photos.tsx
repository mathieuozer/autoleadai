'use client';

import { useState } from 'react';
import { Camera, ArrowLeft, ArrowRight, Info, Sparkles } from 'lucide-react';
import { useTradeInWizard } from '@/hooks/useTradeInWizard';
import { PhotoUploadCard, PhotoAnnotationModal } from '@/components/trade-in';
import { PHOTO_REQUIREMENTS, REQUIRED_PHOTO_COUNT } from '@/lib/trade-in-constants';
import { PhotoType, TradeInPhoto, PhotoAnnotation } from '@/types';

interface Step3PhotosProps {
  wizard: ReturnType<typeof useTradeInWizard>;
  appraisalId: string;
}

export function Step3Photos({ wizard, appraisalId }: Step3PhotosProps) {
  const uploadedCount = wizard.state.photos.size;
  const [annotatingPhoto, setAnnotatingPhoto] = useState<{
    type: PhotoType;
    photo: TradeInPhoto;
    label: string;
  } | null>(null);

  const handlePhotoUpload = async (type: PhotoType, file: File) => {
    const reader = new FileReader();
    reader.onloadend = async () => {
      const url = reader.result as string;
      const timestamp = new Date().toISOString();

      // Add to local state
      wizard.addPhoto(type, {
        id: `temp-${Date.now()}`,
        type,
        url,
        timestamp,
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
        await fetch(`/api/trade-ins/${appraisalId}/photos/${photo.id}`, {
          method: 'DELETE',
        });
      } catch (error) {
        console.error('Failed to delete photo:', error);
      }
    }
  };

  const handleAnnotate = (type: PhotoType, label: string) => {
    const photo = wizard.state.photos.get(type);
    if (photo) {
      setAnnotatingPhoto({ type, photo, label });
    }
  };

  const handleSaveAnnotations = async (notes: string, annotations: PhotoAnnotation[]) => {
    if (!annotatingPhoto) return;

    // Update local state
    const updatedPhoto: TradeInPhoto = {
      ...annotatingPhoto.photo,
      notes,
      annotations,
    };
    wizard.addPhoto(annotatingPhoto.type, updatedPhoto);

    // Save to API
    if (!annotatingPhoto.photo.id.startsWith('temp-')) {
      try {
        await fetch(`/api/trade-ins/${appraisalId}/photos/${annotatingPhoto.photo.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ notes, annotations }),
        });
      } catch (error) {
        console.error('Failed to save annotations:', error);
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

      {/* Smart Camera Guide */}
      <div className="bg-[#334155] rounded-lg p-3 flex items-start gap-3">
        <Sparkles className="w-5 h-5 text-[#0ea5e9] flex-shrink-0 mt-0.5" />
        <div className="text-sm">
          <p className="text-white font-medium">Smart Camera Mode</p>
          <p className="text-[#94a3b8] text-xs mt-0.5">
            Tap the <Info className="w-3 h-3 inline" /> icon on each card for framing guides.
            After capturing, tap the photo to add notes or mark damage.
          </p>
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
            guide={req.guide}
            icon={req.icon}
            photo={wizard.state.photos.get(req.type)}
            onUpload={(file) => handlePhotoUpload(req.type, file)}
            onRemove={() => handlePhotoRemove(req.type)}
            onAnnotate={() => handleAnnotate(req.type, req.label)}
          />
        ))}
      </div>

      {/* Annotation Modal */}
      {annotatingPhoto && (
        <PhotoAnnotationModal
          photo={annotatingPhoto.photo}
          label={annotatingPhoto.label}
          isOpen={true}
          onClose={() => setAnnotatingPhoto(null)}
          onSave={handleSaveAnnotations}
        />
      )}

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
