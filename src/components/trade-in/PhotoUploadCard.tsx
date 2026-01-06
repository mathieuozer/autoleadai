'use client';

import { useRef, useState } from 'react';
import { Plus, X, Camera, Edit2, Info, AlertTriangle } from 'lucide-react';
import { PhotoType, TradeInPhoto } from '@/types';
import Image from 'next/image';

interface PhotoUploadCardProps {
  type: PhotoType;
  label: string;
  required?: boolean;
  guide?: string;
  icon?: string;
  photo?: TradeInPhoto;
  onUpload: (file: File) => void;
  onRemove?: () => void;
  onAnnotate?: () => void;
  lightTheme?: boolean;
}

export function PhotoUploadCard({
  label,
  required = false,
  guide,
  icon,
  photo,
  onUpload,
  onRemove,
  onAnnotate,
  lightTheme = false,
}: PhotoUploadCardProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [showGuide, setShowGuide] = useState(false);

  const hasAnnotations = photo?.annotations && Array.isArray(photo.annotations) && photo.annotations.length > 0;

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

  // Light theme classes
  const emptyBg = lightTheme ? 'bg-gray-50' : 'bg-[#1e293b]';
  const emptyBorder = lightTheme ? 'border-gray-300 hover:border-gray-400' : 'border-[#475569] hover:border-[#64748b]';
  const dragBg = lightTheme ? 'bg-blue-50' : 'bg-[#2563eb]/10';
  const iconBg = lightTheme ? 'bg-gray-200' : 'bg-[#334155]';
  const iconColor = lightTheme ? 'text-gray-500' : 'text-[#94a3b8]';
  const textColor = lightTheme ? 'text-gray-500' : 'text-[#94a3b8]';
  const guideBtnBg = lightTheme ? 'bg-gray-200 hover:bg-gray-300' : 'bg-[#334155] hover:bg-[#475569]';
  const tooltipBg = lightTheme ? 'bg-white border-gray-200' : 'bg-[#0f172a] border-[#334155]';
  const tooltipText = lightTheme ? 'text-gray-600' : 'text-[#94a3b8]';

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
            ? emptyBg
            : isDragging
              ? `border-2 border-dashed border-blue-600 ${dragBg}`
              : `border-2 border-dashed ${emptyBorder} ${emptyBg} cursor-pointer`
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

          {/* Notes & Annotations indicators */}
          <div className="absolute bottom-1 right-1 flex gap-1">
            {hasAnnotations && (
              <div className="bg-amber-500 text-white text-[10px] px-1.5 py-0.5 rounded flex items-center gap-0.5">
                <AlertTriangle className="w-2.5 h-2.5" />
                {(photo.annotations as unknown[]).length}
              </div>
            )}
            {photo.notes && (
              <div className="bg-blue-600 text-white text-[10px] px-1.5 py-0.5 rounded">
                Note
              </div>
            )}
          </div>
        </>
      ) : (
        /* Empty state */
        <div className="absolute inset-0 flex flex-col items-center justify-center p-2">
          <div className={`w-10 h-10 rounded-full ${iconBg} flex items-center justify-center mb-1`}>
            {isDragging ? (
              <Camera className="w-5 h-5 text-blue-600" />
            ) : icon ? (
              <span className="text-lg">{icon}</span>
            ) : (
              <Plus className={`w-5 h-5 ${iconColor}`} />
            )}
          </div>
          <span className={`text-xs ${textColor} text-center`}>Tap to capture</span>

          {/* Guide hint button */}
          {guide && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowGuide(!showGuide);
              }}
              className={`absolute top-2 left-2 p-1 rounded-full ${guideBtnBg} ${iconColor}`}
            >
              <Info className="w-3 h-3" />
            </button>
          )}

          {/* Guide tooltip */}
          {showGuide && guide && (
            <div
              className={`absolute inset-x-2 top-10 ${tooltipBg} text-xs ${tooltipText} p-2 rounded-lg z-10 border shadow-sm`}
              onClick={(e) => e.stopPropagation()}
            >
              {guide}
            </div>
          )}
        </div>
      )}

      {/* Required badge */}
      {required && !photo && (
        <div className="absolute top-2 right-2 bg-amber-500 text-white text-[10px] font-medium px-1.5 py-0.5 rounded">
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
