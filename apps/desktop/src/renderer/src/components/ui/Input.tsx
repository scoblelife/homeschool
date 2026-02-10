/**
 * Input Component
 *
 * Form input elements with consistent styling.
 * Matches the mobile Input component design language.
 */

import {
  forwardRef,
  InputHTMLAttributes,
  TextareaHTMLAttributes,
  ReactNode,
} from "react";
import { clsx } from "clsx";

export type InputSize = "sm" | "md" | "lg";

export interface InputProps extends Omit<
  InputHTMLAttributes<HTMLInputElement>,
  "size"
> {
  size?: InputSize;
  error?: boolean;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
}

const sizeClasses: Record<InputSize, string> = {
  sm: "px-2.5 py-1.5 text-sm",
  md: "px-3 py-2 text-sm",
  lg: "px-4 py-2.5 text-base",
};

const baseClasses =
  "block w-full border rounded-lg shadow-sm transition-all duration-200 " +
  "focus:outline-none focus:ring-2 focus:ring-offset-0 " +
  "disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-gray-50";

const stateClasses = {
  default:
    "border-gray-300 hover:border-gray-400 focus:ring-brand-primary focus:border-brand-primary",
  error:
    "border-status-error focus:ring-status-error focus:border-status-error",
};

export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    { size = "md", error = false, leftIcon, rightIcon, className, ...props },
    ref,
  ) => {
    if (leftIcon || rightIcon) {
      return (
        <div className="relative">
          {leftIcon && (
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
              {leftIcon}
            </div>
          )}
          <input
            ref={ref}
            className={clsx(
              baseClasses,
              error ? stateClasses.error : stateClasses.default,
              sizeClasses[size],
              leftIcon && "pl-10",
              rightIcon && "pr-10",
              className,
            )}
            {...props}
          />
          {rightIcon && (
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-gray-400">
              {rightIcon}
            </div>
          )}
        </div>
      );
    }

    return (
      <input
        ref={ref}
        className={clsx(
          baseClasses,
          error ? stateClasses.error : stateClasses.default,
          sizeClasses[size],
          className,
        )}
        {...props}
      />
    );
  },
);

Input.displayName = "Input";

export interface TextareaProps extends Omit<
  TextareaHTMLAttributes<HTMLTextAreaElement>,
  "size"
> {
  size?: InputSize;
  error?: boolean;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ size = "md", error = false, className, ...props }, ref) => {
    return (
      <textarea
        ref={ref}
        className={clsx(
          baseClasses,
          error ? stateClasses.error : stateClasses.default,
          sizeClasses[size],
          "resize-none",
          className,
        )}
        {...props}
      />
    );
  },
);

Textarea.displayName = "Textarea";

export interface LabelProps extends React.LabelHTMLAttributes<HTMLLabelElement> {
  children: ReactNode;
  required?: boolean;
}

export const Label = forwardRef<HTMLLabelElement, LabelProps>(
  ({ children, required = false, className, ...props }, ref) => {
    return (
      <label
        ref={ref}
        className={clsx(
          "block text-sm font-medium text-gray-700 mb-1",
          className,
        )}
        {...props}
      >
        {children}
        {required && <span className="text-status-error ml-1">*</span>}
      </label>
    );
  },
);

Label.displayName = "Label";

export interface FormFieldProps {
  label: string;
  htmlFor?: string;
  required?: boolean;
  error?: string;
  hint?: string;
  children: ReactNode;
}

export function FormField({
  label,
  htmlFor,
  required,
  error,
  hint,
  children,
}: FormFieldProps) {
  return (
    <div className="space-y-1">
      <Label htmlFor={htmlFor} required={required}>
        {label}
      </Label>
      {children}
      {error && <p className="text-sm text-status-errorDark">{error}</p>}
      {hint && !error && <p className="text-sm text-gray-500">{hint}</p>}
    </div>
  );
}
