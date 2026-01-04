import { HTMLAttributes, forwardRef } from 'react';
import { RiskLevel } from '@/types';

interface RiskBadgeProps extends HTMLAttributes<HTMLSpanElement> {
  level: RiskLevel;
  showLabel?: boolean;
  size?: 'sm' | 'md';
}

const levelStyles: Record<RiskLevel, { bg: string; text: string; label: string }> = {
  HIGH: { bg: 'bg-red-50', text: 'text-red-700', label: 'High Risk' },
  MEDIUM: { bg: 'bg-orange-50', text: 'text-orange-700', label: 'Medium Risk' },
  LOW: { bg: 'bg-green-50', text: 'text-green-700', label: 'Low Risk' },
};

const sizeStyles = {
  sm: 'px-2 py-0.5 text-xs',
  md: 'px-3 py-1 text-sm',
};

export const RiskBadge = forwardRef<HTMLSpanElement, RiskBadgeProps>(
  ({ level, showLabel = true, size = 'sm', className = '', ...props }, ref) => {
    const styles = levelStyles[level];

    return (
      <span
        ref={ref}
        className={`inline-flex items-center rounded-full font-medium ${styles.bg} ${styles.text} ${sizeStyles[size]} ${className}`}
        {...props}
      >
        {showLabel ? styles.label : level}
      </span>
    );
  }
);

RiskBadge.displayName = 'RiskBadge';
