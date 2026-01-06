'use client';

import { useState } from 'react';
import { X, MessageSquare, AlertTriangle, Check } from 'lucide-react';
import Image from 'next/image';
import { TradeInPhoto, PhotoAnnotation, AnnotationType } from '@/types';

interface PhotoAnnotationModalProps {
  photo: TradeInPhoto;
  label: string;
  isOpen: boolean;
  onClose: () => void;
  onSave: (notes: string, annotations: PhotoAnnotation[]) => void;
}

const DAMAGE_TYPES: { value: AnnotationType; label: string; color: string }[] = [
  { value: 'scratch', label: 'Scratch', color: '#f59e0b' },
  { value: 'dent', label: 'Dent', color: '#ef4444' },
  { value: 'wear', label: 'Wear', color: '#8b5cf6' },
  { value: 'other', label: 'Other', color: '#6b7280' },
];

export function PhotoAnnotationModal({
  photo,
  label,
  isOpen,
  onClose,
  onSave,
}: PhotoAnnotationModalProps) {
  const [notes, setNotes] = useState(photo.notes || '');
  const [markers, setMarkers] = useState<PhotoAnnotation[]>(
    photo.annotations || []
  );
  const [selectedDamageType, setSelectedDamageType] = useState<AnnotationType>('scratch');
  const [isMarking, setIsMarking] = useState(false);

  if (!isOpen) return null;

  const handleImageClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isMarking) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    const newMarker: PhotoAnnotation = {
      id: `marker-${Date.now()}`,
      x,
      y,
      type: selectedDamageType,
    };

    setMarkers([...markers, newMarker]);
  };

  const removeMarker = (id: string | undefined) => {
    if (!id) return;
    setMarkers(markers.filter((m) => m.id !== id));
  };

  const handleSave = () => {
    onSave(notes, markers);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80">
      <div className="bg-[#1e293b] rounded-xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-[#334155]">
          <h3 className="text-lg font-semibold text-white">{label}</h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-[#334155] rounded-lg text-[#94a3b8]"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Photo with markers */}
          <div
            className={`relative aspect-video rounded-lg overflow-hidden ${isMarking ? 'cursor-crosshair' : ''}`}
            onClick={handleImageClick}
          >
            <Image
              src={photo.url}
              alt={label}
              fill
              className="object-contain bg-black"
            />

            {/* Damage markers */}
            {markers.map((marker) => {
              const damageType = DAMAGE_TYPES.find((d) => d.value === marker.type);
              return (
                <div
                  key={marker.id}
                  className="absolute w-6 h-6 -translate-x-1/2 -translate-y-1/2 cursor-pointer group"
                  style={{
                    left: `${marker.x}%`,
                    top: `${marker.y}%`,
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    removeMarker(marker.id);
                  }}
                >
                  <div
                    className="w-full h-full rounded-full border-2 flex items-center justify-center text-xs font-bold"
                    style={{
                      borderColor: damageType?.color,
                      backgroundColor: `${damageType?.color}33`,
                      color: damageType?.color,
                    }}
                  >
                    <AlertTriangle className="w-3 h-3" />
                  </div>
                  <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-black/80 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 whitespace-nowrap">
                    {damageType?.label} - Click to remove
                  </div>
                </div>
              );
            })}

            {/* Marking mode indicator */}
            {isMarking && (
              <div className="absolute top-2 left-2 bg-[#f59e0b] text-white text-xs px-2 py-1 rounded">
                Tap on image to mark damage
              </div>
            )}
          </div>

          {/* Timestamp */}
          <p className="text-xs text-[#64748b]">
            Captured: {new Date(photo.timestamp || Date.now()).toLocaleString()}
          </p>

          {/* Mark Damage Toggle */}
          <div className="space-y-3">
            <button
              onClick={() => setIsMarking(!isMarking)}
              className={`w-full py-2 px-4 rounded-lg flex items-center justify-center gap-2 transition-colors ${
                isMarking
                  ? 'bg-[#f59e0b] text-white'
                  : 'bg-[#334155] text-white hover:bg-[#475569]'
              }`}
            >
              <AlertTriangle className="w-4 h-4" />
              {isMarking ? 'Done Marking' : 'Mark Damage on Photo'}
            </button>

            {/* Damage type selector */}
            {isMarking && (
              <div className="flex gap-2 flex-wrap">
                {DAMAGE_TYPES.map((type) => (
                  <button
                    key={type.value}
                    onClick={() => setSelectedDamageType(type.value)}
                    className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                      selectedDamageType === type.value
                        ? 'ring-2 ring-white'
                        : 'opacity-70 hover:opacity-100'
                    }`}
                    style={{
                      backgroundColor: `${type.color}33`,
                      color: type.color,
                    }}
                  >
                    {type.label}
                  </button>
                ))}
              </div>
            )}

            {/* Markers summary */}
            {markers.length > 0 && (
              <div className="flex gap-2 flex-wrap">
                {DAMAGE_TYPES.map((type) => {
                  const count = markers.filter((m) => m.type === type.value).length;
                  if (count === 0) return null;
                  return (
                    <span
                      key={type.value}
                      className="text-xs px-2 py-1 rounded"
                      style={{
                        backgroundColor: `${type.color}33`,
                        color: type.color,
                      }}
                    >
                      {count} {type.label}{count > 1 ? 'es' : ''}
                    </span>
                  );
                })}
              </div>
            )}
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-[#f8fafc] mb-2 flex items-center gap-2">
              <MessageSquare className="w-4 h-4" />
              Notes
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add any observations about this photo (scratches, dents, wear, etc.)..."
              rows={3}
              className="dark-input w-full resize-none"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex gap-3 p-4 border-t border-[#334155]">
          <button
            onClick={onClose}
            className="dark-btn-secondary flex-1 justify-center"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="dark-btn-primary flex-1 justify-center"
          >
            <Check className="w-4 h-4" />
            Save Annotations
          </button>
        </div>
      </div>
    </div>
  );
}
