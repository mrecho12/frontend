import React from 'react';
import { clsx } from 'clsx';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>((
  {
    label,
    error,
    helperText,
    className,
    id,
    ...props
  },
  ref
) => {
  const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`;

  return (
    <div className="w-full">
      {label && (
        <label
          htmlFor={inputId}
          className="block text-sm font-medium text-secondary-700 mb-1"
        >
          {label}
        </label>
      )}
      <input
        ref={ref}
        id={inputId}
        className={clsx(
          'block w-full px-3 py-2 border rounded-md shadow-sm placeholder-secondary-400 focus:outline-none focus:ring-2 focus:ring-offset-0 sm:text-sm',
          error
            ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
            : 'border-secondary-300 focus:ring-primary-500 focus:border-primary-500',
          className
        )}
        {...props}
      />
      {error && (
        <p className="mt-1 text-sm text-red-600">{error}</p>
      )}
      {helperText && !error && (
        <p className="mt-1 text-sm text-secondary-500">{helperText}</p>
      )}
    </div>
  );
});

Input.displayName = 'Input';