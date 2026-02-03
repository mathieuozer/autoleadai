'use client';

export interface TimelineStep {
  id: string;
  title: string;
  description?: string;
  status: 'completed' | 'current' | 'pending';
  date?: string;
}

interface DealProgressTimelineProps {
  steps: TimelineStep[];
  className?: string;
}

export function DealProgressTimeline({ steps, className = '' }: DealProgressTimelineProps) {
  return (
    <div className={`bg-white rounded-2xl p-6 shadow-sm border border-gray-100 ${className}`}>
      <h3 className="text-lg font-semibold text-gray-900 mb-6">Deal Progress</h3>
      <div className="relative">
        {steps.map((step, index) => {
          const isLast = index === steps.length - 1;

          return (
            <div key={step.id} className="relative flex gap-4 pb-8 last:pb-0">
              {/* Connector Line */}
              {!isLast && (
                <div
                  className={`absolute left-[15px] top-8 w-0.5 h-[calc(100%-24px)] ${
                    step.status === 'completed' ? 'bg-[#7c3aed]' : 'bg-gray-200'
                  }`}
                />
              )}

              {/* Status Icon */}
              <div className="relative flex-shrink-0">
                {step.status === 'completed' && (
                  <div className="w-8 h-8 rounded-full bg-[#7c3aed] flex items-center justify-center">
                    <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                )}
                {step.status === 'current' && (
                  <div className="w-8 h-8 rounded-full bg-[#7c3aed]/20 flex items-center justify-center relative">
                    <div className="w-3 h-3 rounded-full bg-[#7c3aed] animate-pulse" />
                    <div className="absolute inset-0 rounded-full bg-[#7c3aed]/30 animate-ping" />
                  </div>
                )}
                {step.status === 'pending' && (
                  <div className="w-8 h-8 rounded-full bg-gray-100 border-2 border-gray-200 flex items-center justify-center">
                    <div className="w-2 h-2 rounded-full bg-gray-300" />
                  </div>
                )}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0 pt-0.5">
                <div className="flex items-center justify-between gap-2">
                  <h4
                    className={`font-medium ${
                      step.status === 'pending' ? 'text-gray-400' : 'text-gray-900'
                    }`}
                  >
                    {step.title}
                  </h4>
                  {step.date && (
                    <span className="text-sm text-gray-500 flex-shrink-0">{step.date}</span>
                  )}
                </div>
                {step.description && (
                  <p
                    className={`text-sm mt-0.5 ${
                      step.status === 'pending' ? 'text-gray-300' : 'text-gray-500'
                    }`}
                  >
                    {step.description}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
