/**
 * Select Component
 *
 * Wrapper for Headless UI Listbox with design system styling.
 * Provides consistent select dropdown across the application.
 */

import { Fragment } from "react";
import { Listbox, Transition } from "@headlessui/react";
import { clsx } from "clsx";

export interface SelectOption<T = string> {
  value: T;
  label: string;
  disabled?: boolean;
}

export interface SelectProps<T = string> {
  /** Current selected value */
  value: T;
  /** Change handler */
  onChange: (value: T) => void;
  /** Options to display */
  options: SelectOption<T>[];
  /** Optional label above select */
  label?: string;
  /** Placeholder when no value selected */
  placeholder?: string;
  /** Disabled state */
  disabled?: boolean;
  /** Error state */
  error?: boolean;
  /** Error message */
  errorMessage?: string;
  /** Additional CSS classes */
  className?: string;
}

export function Select<T = string>({
  value,
  onChange,
  options,
  label,
  placeholder = "Select an option...",
  disabled = false,
  error = false,
  errorMessage,
  className,
}: SelectProps<T>) {
  const selectedOption = options.find((opt) => opt.value === value);

  return (
    <div className={className}>
      {label && (
        <label className="block text-sm font-medium text-neutral-text mb-1">
          {label}
        </label>
      )}

      <Listbox value={value} onChange={onChange} disabled={disabled}>
        <div className="relative">
          <Listbox.Button
            className={clsx(
              "relative w-full py-2 pl-3 pr-10 text-left rounded-lg cursor-pointer",
              "focus:outline-none focus:ring-2",
              "transition-colors duration-150",
              error
                ? "border-2 border-status-error focus:ring-status-error bg-status-errorLight"
                : "border border-neutral-border focus:ring-brand-primary bg-neutral-surface",
              disabled && "opacity-50 cursor-not-allowed bg-neutral-background",
            )}
          >
            <span
              className={clsx(
                "block truncate",
                selectedOption
                  ? "text-neutral-text"
                  : "text-neutral-textTertiary",
              )}
            >
              {selectedOption?.label || placeholder}
            </span>
            <span className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
              <svg
                className="w-5 h-5 text-neutral-textSecondary"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
                aria-hidden="true"
              >
                <path
                  fillRule="evenodd"
                  d="M10 3a1 1 0 01.707.293l3 3a1 1 0 01-1.414 1.414L10 5.414 7.707 7.707a1 1 0 01-1.414-1.414l3-3A1 1 0 0110 3zm-3.707 9.293a1 1 0 011.414 0L10 14.586l2.293-2.293a1 1 0 011.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z"
                  clipRule="evenodd"
                />
              </svg>
            </span>
          </Listbox.Button>

          <Transition
            as={Fragment}
            leave="transition ease-in duration-100"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <Listbox.Options className="absolute z-50 w-full py-1 mt-1 bg-neutral-surface border border-neutral-border rounded-lg shadow-lg max-h-60 overflow-auto focus:outline-none">
              {options.map((option) => (
                <Listbox.Option
                  key={String(option.value)}
                  value={option.value}
                  disabled={option.disabled}
                  className={({ active, selected }) =>
                    clsx(
                      "cursor-pointer select-none py-2 px-3 transition-colors",
                      active && "bg-brand-primaryLight",
                      selected && "font-medium text-brand-primary",
                      !selected && !active && "text-neutral-text",
                      option.disabled && "opacity-50 cursor-not-allowed",
                    )
                  }
                >
                  {({ selected }) => (
                    <span
                      className={clsx(
                        "block truncate",
                        selected && "font-medium",
                      )}
                    >
                      {option.label}
                    </span>
                  )}
                </Listbox.Option>
              ))}
            </Listbox.Options>
          </Transition>
        </div>
      </Listbox>

      {error && errorMessage && (
        <p className="mt-1 text-sm text-status-error">{errorMessage}</p>
      )}
    </div>
  );
}
