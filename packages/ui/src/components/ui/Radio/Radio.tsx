/**
 * Radio Component
 *
 * Styled radio button group with label support.
 * Provides consistent radio button styling across the application.
 */

import { forwardRef, InputHTMLAttributes } from "react";
import { clsx } from "clsx";

export interface RadioOption {
  value: string;
  label: string;
  helperText?: string;
  disabled?: boolean;
}

export interface RadioGroupProps {
  /** Group label */
  label?: string;
  /** Radio options */
  options: RadioOption[];
  /** Current selected value */
  value: string;
  /** Change handler */
  onChange: (value: string) => void;
  /** Name attribute for radio group */
  name: string;
  /** Error state */
  error?: boolean;
  /** Error message */
  errorMessage?: string;
  /** Additional CSS classes */
  className?: string;
}

export function RadioGroup({
  label,
  options,
  value,
  onChange,
  name,
  error = false,
  errorMessage,
  className,
}: RadioGroupProps) {
  return (
    <div className={className}>
      {label && (
        <label className="block text-sm font-medium text-neutral-text mb-3">
          {label}
        </label>
      )}
      <div className="space-y-2">
        {options.map((option) => (
          <Radio
            key={option.value}
            name={name}
            value={option.value}
            label={option.label}
            helperText={option.helperText}
            checked={value === option.value}
            onChange={() => onChange(option.value)}
            disabled={option.disabled}
            error={error}
          />
        ))}
      </div>
      {error && errorMessage && (
        <p className="mt-2 text-sm text-status-error">{errorMessage}</p>
      )}
    </div>
  );
}

export interface RadioProps extends Omit<
  InputHTMLAttributes<HTMLInputElement>,
  "type"
> {
  /** Label text */
  label: string;
  /** Helper text below label */
  helperText?: string;
  /** Error state */
  error?: boolean;
}

export const Radio = forwardRef<HTMLInputElement, RadioProps>(
  (
    { label, helperText, error = false, disabled = false, className, ...props },
    ref,
  ) => {
    const radioId =
      props.id || `radio-${Math.random().toString(36).substr(2, 9)}`;

    return (
      <div className={className}>
        <div className="flex items-start">
          <div className="flex items-center h-5">
            <input
              ref={ref}
              type="radio"
              id={radioId}
              disabled={disabled}
              className={clsx(
                "w-4 h-4 rounded-full",
                "border-2 transition-colors duration-150",
                "focus:ring-2 focus:ring-offset-2",
                error
                  ? "border-status-error focus:ring-status-error"
                  : "border-neutral-border focus:ring-brand-primary",
                "text-brand-primary",
                "disabled:opacity-50 disabled:cursor-not-allowed",
                "cursor-pointer",
              )}
              {...props}
            />
          </div>
          <div className="ml-3">
            <label
              htmlFor={radioId}
              className={clsx(
                "text-sm font-medium",
                disabled
                  ? "text-neutral-textTertiary cursor-not-allowed"
                  : "text-neutral-text cursor-pointer",
              )}
            >
              {label}
            </label>
            {helperText && (
              <p className="text-sm text-neutral-textSecondary mt-0.5">
                {helperText}
              </p>
            )}
          </div>
        </div>
      </div>
    );
  },
);

Radio.displayName = "Radio";
