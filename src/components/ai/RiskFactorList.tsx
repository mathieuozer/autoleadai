import { HTMLAttributes, forwardRef } from 'react';
import { AlertCircle } from 'lucide-react';
import { RiskFactor } from '@/types';

interface RiskFactorListProps extends HTMLAttributes<HTMLDivElement> {
  factors: RiskFactor[];
}

export const RiskFactorList = forwardRef<HTMLDivElement, RiskFactorListProps>(
  ({ factors, className = '', ...props }, ref) => {
    if (factors.length === 0) return null;

    // Sort by impact (highest first)
    const sortedFactors = [...factors].sort((a, b) => b.impact - a.impact);

    return (
      <div ref={ref} className={`space-y-2 ${className}`} {...props}>
        <h4 className="text-sm font-medium text-gray-700">Risk Factors</h4>
        <ul className="space-y-2">
          {sortedFactors.map((factor, index) => (
            <li key={index} className="flex items-start gap-2 rounded-lg bg-gray-50 p-2">
              <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-orange-500" />
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">{factor.description}</span>
                  <span className="rounded bg-orange-100 px-1.5 py-0.5 text-xs font-medium text-orange-700">
                    +{factor.impact}
                  </span>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>
    );
  }
);

RiskFactorList.displayName = 'RiskFactorList';
