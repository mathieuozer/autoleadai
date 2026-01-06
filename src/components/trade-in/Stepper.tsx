'use client';

import { Check } from 'lucide-react';
import { WizardStep, WizardStepStatus } from '@/types';

interface StepperProps {
  steps: WizardStep[];
  currentStep: number;
}

function getStepStatus(stepNumber: number, currentStep: number): WizardStepStatus {
  if (stepNumber < currentStep) return 'completed';
  if (stepNumber === currentStep) return 'current';
  return 'upcoming';
}

export function Stepper({ steps, currentStep }: StepperProps) {
  return (
    <div className="w-full py-4">
      <div className="flex items-center justify-between">
        {steps.map((step, index) => {
          const status = getStepStatus(step.number, currentStep);
          const isLast = index === steps.length - 1;

          return (
            <div key={step.number} className="flex items-center flex-1">
              {/* Step Circle + Labels */}
              <div className="flex flex-col items-center">
                {/* Circle */}
                <div
                  className={`
                    w-10 h-10 rounded-full flex items-center justify-center
                    font-semibold text-sm transition-all duration-200
                    ${
                      status === 'completed'
                        ? 'bg-[#22c55e] text-white'
                        : status === 'current'
                          ? 'bg-[#0ea5e9] text-white'
                          : 'bg-[#334155] text-[#94a3b8]'
                    }
                  `}
                >
                  {status === 'completed' ? (
                    <Check className="w-5 h-5" />
                  ) : (
                    step.number
                  )}
                </div>

                {/* Labels */}
                <div className="mt-2 text-center">
                  <p
                    className={`text-sm font-medium ${
                      status === 'current'
                        ? 'text-white'
                        : status === 'completed'
                          ? 'text-[#22c55e]'
                          : 'text-[#64748b]'
                    }`}
                  >
                    {step.label}
                  </p>
                  <p className="text-xs text-[#64748b] mt-0.5">{step.sublabel}</p>
                </div>
              </div>

              {/* Connector Line */}
              {!isLast && (
                <div
                  className={`
                    flex-1 h-0.5 mx-3 mt-[-24px]
                    ${status === 'completed' ? 'bg-[#22c55e]' : 'bg-[#334155]'}
                  `}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
