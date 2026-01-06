'use client';

import { useRef, useState } from 'react';
import { Plus, X, Camera, Edit2 } from 'lucide-react';
import { PhotoType, TradeInPhoto } from '@/types';
import Image from 'next/image';

interface PhotoUploadCardProps {
  type: PhotoType;
  label: string;
  required?: boolean;
  photo?: TradeInPhoto;
  onUpload: (file: File) => void;
  onRemove?: () => void;
  onAnnotate?: () => void;
}

export function PhotoUploadCard({
  label,
  required = false,
  photo,
  onUpload,
  onRemove,
  onAnnotate,
}: PhotoUploadCardProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleClick = () => {
    if (!photo) {
      inputRef.current?.click();
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onUpload(file);
    }
    // Reset input
    e.target.value = '';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (!photo) {
      setIsDragging(true);
    }
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file && !photo) {
      onUpload(file);
    }
  };

  return (
    <div
      onClick={handleClick}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`
        relative aspect-[4/3] rounded-lg overflow-hidden
        transition-all duration-200
        ${
          photo
            ? 'bg-[#1e293b]'
            : isDragging
              ? 'border-2 border-dashed border-[#0ea5e9] bg-[#0ea5e9]/10'
              : 'border-2 border-dashed border-[#475569] bg-[#1e293b] hover:border-[#64748b] cursor-pointer'
        }
      `}
    >
      {/* Hidden file input */}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={handleFileChange}
      />

      {photo ? (
        <>
          {/* Photo thumbnail */}
          <Image
            src={photo.url}
            alt={label}
            fill
            className="object-cover"
          />

          {/* Overlay actions */}
          <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
            {onAnnotate && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onAnnotate();
                }}
                className="p-2 rounded-full bg-white/20 hover:bg-white/30 text-white"
              >
                <Edit2 className="w-4 h-4" />
              </button>
            )}
            {onRemove && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onRemove();
                }}
                className="p-2 rounded-full bg-white/20 hover:bg-white/30 text-white"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Notes indicator */}
          {photo.notes && (
            <div className="absolute bottom-1 right-1 bg-[#0ea5e9] text-white text-xs px-1.5 py-0.5 rounded">
              Note
            </div>
          )}
        </>
      ) : (
        /* Empty state */
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <div className="w-10 h-10 rounded-full bg-[#334155] flex items-center justify-center mb-2">
            {isDragging ? (
              <Camera className="w-5 h-5 text-[#0ea5e9]" />
            ) : (
              <Plus className="w-5 h-5 text-[#94a3b8]" />
            )}
          </div>
          <span className="text-xs text-[#94a3b8]">Add Photo</span>
        </div>
      )}

      {/* Required badge */}
      {required && !photo && (
        <div className="absolute top-2 right-2 bg-[#f59e0b] text-white text-[10px] font-medium px-1.5 py-0.5 rounded">
          Required
        </div>
      )}

      {/* Label */}
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-2">
        <span className="text-xs text-white font-medium">{label}</span>
      </div>
    </div>
  );
}
