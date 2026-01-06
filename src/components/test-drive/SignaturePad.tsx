'use client';

import { useRef, useState, useEffect } from 'react';
import { Eraser, Check, RotateCcw } from 'lucide-react';

interface SignaturePadProps {
  onSignatureChange: (signature: string | null) => void;
  width?: number;
  height?: number;
  className?: string;
}

export function SignaturePad({
  onSignatureChange,
  width = 400,
  height = 200,
  className = '',
}: SignaturePadProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSignature, setHasSignature] = useState(false);
  const [lastPos, setLastPos] = useState({ x: 0, y: 0 });

  // Initialize canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    canvas.width = width;
    canvas.height = height;

    // Set drawing styles
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    // Fill with transparent background
    ctx.fillStyle = 'rgba(0, 0, 0, 0)';
    ctx.fillRect(0, 0, width, height);
  }, [width, height]);

  // Get position from event
  const getPosition = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    if ('touches' in e) {
      const touch = e.touches[0];
      return {
        x: (touch.clientX - rect.left) * scaleX,
        y: (touch.clientY - rect.top) * scaleY,
      };
    } else {
      return {
        x: (e.clientX - rect.left) * scaleX,
        y: (e.clientY - rect.top) * scaleY,
      };
    }
  };

  // Start drawing
  const handleStart = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    const pos = getPosition(e);
    setIsDrawing(true);
    setLastPos(pos);
  };

  // Draw
  const handleMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing) return;
    e.preventDefault();

    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    const currentPos = getPosition(e);

    ctx.beginPath();
    ctx.moveTo(lastPos.x, lastPos.y);
    ctx.lineTo(currentPos.x, currentPos.y);
    ctx.stroke();

    setLastPos(currentPos);
    setHasSignature(true);
  };

  // Stop drawing
  const handleEnd = () => {
    if (isDrawing) {
      setIsDrawing(false);
      exportSignature();
    }
  };

  // Export signature as data URL
  const exportSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    if (hasSignature) {
      const dataUrl = canvas.toDataURL('image/png');
      onSignatureChange(dataUrl);
    }
  };

  // Clear signature
  const handleClear = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasSignature(false);
    onSignatureChange(null);
  };

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Canvas container */}
      <div className="relative bg-[#0f172a] border-2 border-dashed border-[#475569] rounded-lg overflow-hidden">
        <canvas
          ref={canvasRef}
          className="w-full touch-none cursor-crosshair"
          style={{ aspectRatio: `${width}/${height}` }}
          onMouseDown={handleStart}
          onMouseMove={handleMove}
          onMouseUp={handleEnd}
          onMouseLeave={handleEnd}
          onTouchStart={handleStart}
          onTouchMove={handleMove}
          onTouchEnd={handleEnd}
        />

        {/* Signature line */}
        <div className="absolute bottom-8 left-8 right-8 border-t border-[#475569]" />
        <p className="absolute bottom-2 left-8 text-xs text-[#64748b]">Sign above the line</p>

        {/* Empty state overlay */}
        {!hasSignature && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <p className="text-[#64748b] text-sm">Draw your signature here</p>
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="flex gap-3">
        <button
          type="button"
          onClick={handleClear}
          disabled={!hasSignature}
          className="flex-1 py-2 px-4 rounded-lg bg-[#334155] hover:bg-[#475569] text-white font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          <RotateCcw className="w-4 h-4" />
          Clear
        </button>
        {hasSignature && (
          <div className="flex items-center gap-2 px-4 text-[#22c55e]">
            <Check className="w-4 h-4" />
            <span className="text-sm font-medium">Signature captured</span>
          </div>
        )}
      </div>
    </div>
  );
}
