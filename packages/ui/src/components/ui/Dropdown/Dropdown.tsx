/**
 * Dropdown Component
 *
 * Wrapper for Headless UI Menu with design system styling.
 * Provides consistent dropdown menus for actions and options.
 */

import { Fragment, ReactNode } from "react";
import { Menu, Transition } from "@headlessui/react";
import { clsx } from "clsx";

export interface DropdownItem {
  label: string;
  onClick: () => void;
  icon?: ReactNode;
  disabled?: boolean;
  variant?: "default" | "danger";
  divider?: boolean;
}

export interface DropdownProps {
  /** Button content/trigger */
  trigger: ReactNode;
  /** Menu items */
  items: DropdownItem[];
  /** Alignment of dropdown menu */
  align?: "left" | "right";
  /** Additional CSS classes for trigger button */
  buttonClassName?: string;
}

export function Dropdown({
  trigger,
  items,
  align = "right",
  buttonClassName,
}: DropdownProps) {
  return (
    <Menu as="div" className="relative inline-block text-left">
      <Menu.Button className={clsx("focus:outline-none", buttonClassName)}>
        {trigger}
      </Menu.Button>

      <Transition
        as={Fragment}
        enter="transition ease-out duration-100"
        enterFrom="transform opacity-0 scale-95"
        enterTo="transform opacity-100 scale-100"
        leave="transition ease-in duration-75"
        leaveFrom="transform opacity-100 scale-100"
        leaveTo="transform opacity-0 scale-95"
      >
        <Menu.Items
          className={clsx(
            "absolute z-50 mt-2 w-56 origin-top-right",
            "bg-neutral-surface border border-neutral-border rounded-lg shadow-lg",
            "focus:outline-none",
            "divide-y divide-neutral-border",
            align === "right" && "right-0",
            align === "left" && "left-0",
          )}
        >
          <div className="py-1">
            {items.map((item, index) => (
              <Fragment key={index}>
                {item.divider && index > 0 && (
                  <div className="border-t border-neutral-border my-1" />
                )}
                <Menu.Item disabled={item.disabled}>
                  {({ active, disabled }) => (
                    <button
                      onClick={item.onClick}
                      disabled={disabled}
                      className={clsx(
                        "group flex items-center w-full px-4 py-2 text-sm transition-colors",
                        active && "bg-brand-primaryLight",
                        disabled && "opacity-50 cursor-not-allowed",
                        item.variant === "danger"
                          ? "text-status-error"
                          : "text-neutral-text",
                      )}
                    >
                      {item.icon && (
                        <span className="mr-3 flex-shrink-0">{item.icon}</span>
                      )}
                      {item.label}
                    </button>
                  )}
                </Menu.Item>
              </Fragment>
            ))}
          </div>
        </Menu.Items>
      </Transition>
    </Menu>
  );
}

// Common trigger button styles
export function DropdownTriggerButton({ children }: { children: ReactNode }) {
  return (
    <button
      className={clsx(
        "inline-flex items-center justify-center",
        "px-3 py-2 rounded-lg",
        "text-neutral-text bg-neutral-surface",
        "border border-neutral-border",
        "hover:bg-neutral-background",
        "focus:outline-none focus:ring-2 focus:ring-brand-primary",
        "transition-colors duration-150",
      )}
    >
      {children}
    </button>
  );
}

// Icon-only trigger (three dots)
export function DropdownIconTrigger() {
  return (
    <button
      className={clsx(
        "p-2 rounded-lg",
        "text-neutral-textSecondary hover:text-neutral-text",
        "hover:bg-neutral-background",
        "focus:outline-none focus:ring-2 focus:ring-brand-primary",
        "transition-colors duration-150",
      )}
      aria-label="More options"
    >
      <svg
        className="w-5 h-5"
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 20 20"
        fill="currentColor"
      >
        <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
      </svg>
    </button>
  );
}
