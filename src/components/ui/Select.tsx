import React from 'react';
import { clsx } from 'clsx';
import { ChevronDown } from 'lucide-react';

interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options?: SelectOption[];
  children?: React.ReactNode;
}

export const Select: React.FC<SelectProps> = ({
  label,
  error,
  options,
  children,
  className,
  id,
  ...props
}) => {
  const selectId = id || `select-${Math.random().toString(36).substr(2, 9)}`;

  return (
    <div className="w-full">
      {label && (
        <label
          htmlFor={selectId}
          className="block text-sm font-medium text-secondary-700 mb-1"
        >
          {label}
        </label>
      )}
      <div className="relative">
        <select
          id={selectId}
          className={clsx(
            'block w-full px-3 py-2 border rounded-md shadow-sm bg-white focus:outline-none focus:ring-2 focus:ring-offset-0 sm:text-sm appearance-none',
            error
              ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
              : 'border-secondary-300 focus:ring-primary-500 focus:border-primary-500',
            className
          )}
          {...props}
        >
          {options ? options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          )) : children}
        </select>
        <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-secondary-400 pointer-events-none" />
      </div>
      {error && (
        <p className="mt-1 text-sm text-red-600">{error}</p>
      )}
    </div>
  );
};