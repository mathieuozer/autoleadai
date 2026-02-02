import { TextareaHTMLAttributes, forwardRef } from 'react';

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className = '', label, error, id, ...props }, ref) => {
    const textareaId = id || label?.toLowerCase().replace(/\s+/g, '-');

    return (
      <div className="w-full">
        {label && (
          <label htmlFor={textareaId} className="mb-1.5 block text-sm font-semibold text-[#0f172a]">
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          id={textareaId}
          className={`w-full rounded-[16px] border bg-[#f2f6fe] px-4 py-3 text-sm font-medium text-[#0f172a] shadow-[0_1px_6px_rgba(214,188,247,0.13)] transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-offset-0 resize-y ${
            error
              ? 'border-red-500 focus:border-red-500 focus:ring-red-200'
              : 'border-[#c4b5fd] focus:border-[#7c3aed] focus:ring-[#ede9fe]'
          } ${className}`}
          aria-invalid={error ? 'true' : 'false'}
          aria-describedby={error ? `${textareaId}-error` : undefined}
          {...props}
        />
        {error && (
          <p id={`${textareaId}-error`} className="mt-1 text-sm text-red-500" role="alert">
            {error}
          </p>
        )}
      </div>
    );
  }
);

Textarea.displayName = 'Textarea';
