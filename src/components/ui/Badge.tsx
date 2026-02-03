import { HTMLAttributes, forwardRef } from 'react';

export type BadgeVariant =
  | 'default'
  | 'primary'
  | 'success'
  | 'warning'
  | 'danger'
  | 'outline'
  | 'info'
  | 'approved'
  | 'pending'
  | 'under-review'
  | 'rejected'
  | 'on-track'
  | 'at-risk'
  | 'overdue'
  | 'accent';

export type BadgeSize = 'sm' | 'md' | 'lg';

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  size?: BadgeSize;
}

const variantStyles: Record<BadgeVariant, string> = {
  default: 'bg-gray-100 text-gray-700',
  primary: 'bg-[#ede9fe] text-[#7c3aed]',
  success: 'bg-green-100 text-green-700',
  warning: 'bg-orange-100 text-orange-700',
  danger: 'bg-red-100 text-red-700',
  outline: 'border border-[#c4b5fd] text-[#7c3aed]',
  info: 'bg-blue-100 text-blue-700',
  // Status variants
  approved: 'bg-[#dcfce7] text-[#166534]',
  pending: 'bg-[#fef3c7] text-[#92400e]',
  'under-review': 'bg-[#dbeafe] text-[#1e40af]',
  rejected: 'bg-[#fee2e2] text-[#991b1b]',
  'on-track': 'bg-[#d1fae5] text-[#065f46]',
  'at-risk': 'bg-[#ffedd5] text-[#c2410c]',
  overdue: 'bg-[#fee2e2] text-[#b91c1c]',
  // Accent variant (cyan/teal)
  accent: 'bg-[#00D4AA]/10 text-[#00D4AA]',
};

const sizeStyles: Record<BadgeSize, string> = {
  sm: 'px-2 py-0.5 text-xs',
  md: 'px-2.5 py-0.5 text-xs',
  lg: 'px-3 py-1 text-sm',
};

export const Badge = forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className = '', variant = 'default', size = 'md', children, ...props }, ref) => {
    return (
      <span
        ref={ref}
        className={`inline-flex items-center rounded-full font-medium ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
        {...props}
      >
        {children}
      </span>
    );
  }
);

Badge.displayName = 'Badge';
