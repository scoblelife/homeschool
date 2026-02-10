/**
 * Checkbox Component
 *
 * Styled checkbox input with label support.
 * Provides consistent checkbox styling across the application.
 */

import { forwardRef, InputHTMLAttributes } from "react";
import { clsx } from "clsx";

export interface CheckboxProps extends Omit<
  InputHTMLAttributes<HTMLInputElement>,
  "type"
> {
  /** Label text */
  label?: string;
  /** Helper text below label */
  helperText?: string;
  /** Error state */
  error?: boolean;
  /** Error message */
  errorMessage?: string;
}

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  (
    {
      label,
      helperText,
      error = false,
      errorMessage,
      disabled = false,
      className,
      ...props
    },
    ref,
  ) => {
    const checkboxId =
      props.id || `checkbox-${Math.random().toString(36).substr(2, 9)}`;

    return (
      <div className={className}>
        <div className="flex items-start">
          <div className="flex items-center h-5">
            <input
              ref={ref}
              type="checkbox"
              id={checkboxId}
              disabled={disabled}
              className={clsx(
                "w-4 h-4 rounded",
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
          {(label || helperText) && (
            <div className="ml-3">
              {label && (
                <label
                  htmlFor={checkboxId}
                  className={clsx(
                    "text-sm font-medium",
                    disabled
                      ? "text-neutral-textTertiary cursor-not-allowed"
                      : "text-neutral-text cursor-pointer",
                  )}
                >
                  {label}
                </label>
              )}
              {helperText && (
                <p className="text-sm text-neutral-textSecondary mt-0.5">
                  {helperText}
                </p>
              )}
            </div>
          )}
        </div>
        {error && errorMessage && (
          <p className="mt-1 text-sm text-status-error ml-7">{errorMessage}</p>
        )}
      </div>
    );
  },
);

Checkbox.displayName = "Checkbox";
