'use client';

import { VehicleCondition, ConditionOption } from '@/types';
import { CONDITION_OPTIONS } from '@/lib/trade-in-constants';

interface ConditionSelectorProps {
  value: VehicleCondition | null;
  onChange: (condition: VehicleCondition) => void;
  options?: ConditionOption[];
}

export function ConditionSelector({
  value,
  onChange,
  options = CONDITION_OPTIONS,
}: ConditionSelectorProps) {
  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-[#f8fafc]">
        Vehicle Condition
      </label>
      <div className="grid grid-cols-2 gap-3">
        {options.map((option) => {
          const isSelected = value === option.value;
          return (
            <button
              key={option.value}
              type="button"
              onClick={() => onChange(option.value)}
              className={`
                p-4 rounded-lg text-left transition-all duration-200
                ${
                  isSelected
                    ? 'bg-[#0ea5e9]/10 border-2 border-[#0ea5e9]'
                    : 'bg-[#334155] border-2 border-transparent hover:border-[#475569]'
                }
              `}
            >
              <div className="flex items-center justify-between mb-1">
                <span
                  className={`font-medium ${
                    isSelected ? 'text-[#0ea5e9]' : 'text-white'
                  }`}
                >
                  {option.label}
                </span>
                {isSelected && (
                  <div className="w-5 h-5 rounded-full bg-[#0ea5e9] flex items-center justify-center">
                    <svg
                      className="w-3 h-3 text-white"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={3}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  </div>
                )}
              </div>
              <p className="text-xs text-[#94a3b8]">{option.description}</p>
            </button>
          );
        })}
      </div>
    </div>
  );
}
