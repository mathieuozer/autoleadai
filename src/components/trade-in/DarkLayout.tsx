'use client';

import { ReactNode } from 'react';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

interface DarkLayoutProps {
  children: ReactNode;
  showBackButton?: boolean;
  backHref?: string;
  onBack?: () => void;
}

export function DarkLayout({
  children,
  showBackButton = false,
  backHref,
  onBack,
}: DarkLayoutProps) {
  const handleBack = () => {
    if (onBack) {
      onBack();
    }
  };

  return (
    <div className="dark-theme">
      {/* Header with optional back button */}
      {showBackButton && (
        <div className="sticky top-0 z-10 bg-[#0f172a]/95 backdrop-blur-sm border-b border-[#334155]">
          <div className="max-w-4xl mx-auto px-4 py-3">
            {backHref ? (
              <Link
                href={backHref}
                className="inline-flex items-center gap-2 text-[#94a3b8] hover:text-white transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
                <span className="text-sm font-medium">Back</span>
              </Link>
            ) : (
              <button
                onClick={handleBack}
                className="inline-flex items-center gap-2 text-[#94a3b8] hover:text-white transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
                <span className="text-sm font-medium">Back</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* Main content */}
      <main className="max-w-4xl mx-auto px-4 py-6 pb-24">
        {children}
      </main>
    </div>
  );
}
