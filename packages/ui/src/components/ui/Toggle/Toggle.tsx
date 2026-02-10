/**
 * Toggle Component
 *
 * Binary toggle switch with label support.
 * Provides consistent toggle/switch styling across the application.
 */

import { Switch } from "@headlessui/react";
import { clsx } from "clsx";

export interface ToggleProps {
  /** Current checked state */
  checked: boolean;
  /** Change handler */
  onChange: (checked: boolean) => void;
  /** Label text */
  label?: string;
  /** Helper text below label */
  helperText?: string;
  /** Disabled state */
  disabled?: boolean;
  /** Size variant */
  size?: "sm" | "md" | "lg";
  /** Additional CSS classes */
  className?: string;
}

const sizeClasses = {
  sm: {
    switch: "h-5 w-9",
    thumb: "h-4 w-4",
    translate: "translate-x-4",
  },
  md: {
    switch: "h-6 w-11",
    thumb: "h-5 w-5",
    translate: "translate-x-5",
  },
  lg: {
    switch: "h-7 w-14",
    thumb: "h-6 w-6",
    translate: "translate-x-7",
  },
};

export function Toggle({
  checked,
  onChange,
  label,
  helperText,
  disabled = false,
  size = "md",
  className,
}: ToggleProps) {
  const sizes = sizeClasses[size];

  return (
    <Switch.Group>
      <div className={clsx("flex items-start", className)}>
        <Switch
          checked={checked}
          onChange={onChange}
          disabled={disabled}
          className={clsx(
            sizes.switch,
            "relative inline-flex flex-shrink-0 rounded-full transition-colors duration-200",
            "focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-primary",
            checked ? "bg-brand-primary" : "bg-neutral-border",
            disabled && "opacity-50 cursor-not-allowed",
            !disabled && "cursor-pointer",
          )}
        >
          <span
            aria-hidden="true"
            className={clsx(
              sizes.thumb,
              "pointer-events-none inline-block rounded-full bg-white shadow-lg transform ring-0 transition duration-200",
              checked ? sizes.translate : "translate-x-0.5",
            )}
          />
        </Switch>
        {(label || helperText) && (
          <Switch.Label
            passive={!label}
            className={clsx("ml-3", disabled && "opacity-50")}
          >
            {label && (
              <span
                className={clsx(
                  "text-sm font-medium",
                  disabled ? "text-neutral-textTertiary" : "text-neutral-text",
                )}
              >
                {label}
              </span>
            )}
            {helperText && (
              <p className="text-sm text-neutral-textSecondary mt-0.5">
                {helperText}
              </p>
            )}
          </Switch.Label>
        )}
      </div>
    </Switch.Group>
  );
}
