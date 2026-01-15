/**
 * Tabs Component
 *
 * Wrapper for Headless UI Tab with design system styling.
 * Provides consistent tabbed interfaces across the application.
 */

import { Fragment, ReactNode } from "react";
import { Tab } from "@headlessui/react";
import { clsx } from "clsx";

export interface TabItem {
  label: string;
  content: ReactNode;
  disabled?: boolean;
  icon?: ReactNode;
}

export interface TabsProps {
  /** Tab items with label and content */
  tabs: TabItem[];
  /** Default selected tab index */
  defaultIndex?: number;
  /** Optional change handler */
  onChange?: (index: number) => void;
  /** Variant style */
  variant?: "default" | "pills";
  /** Additional CSS classes */
  className?: string;
}

export function Tabs({
  tabs,
  defaultIndex = 0,
  onChange,
  variant = "default",
  className,
}: TabsProps) {
  return (
    <Tab.Group defaultIndex={defaultIndex} onChange={onChange}>
      <div className={className}>
        <Tab.List
          className={clsx(
            "flex space-x-1",
            variant === "default" && "border-b border-neutral-border",
            variant === "pills" && "bg-neutral-background p-1 rounded-lg",
          )}
        >
          {tabs.map((tab, index) => (
            <Tab key={index} as={Fragment} disabled={tab.disabled}>
              {({ selected, disabled }) => (
                <button
                  className={clsx(
                    "flex items-center gap-2 px-4 py-2",
                    "text-sm font-medium transition-colors duration-150",
                    "focus:outline-none focus:ring-2 focus:ring-brand-primary focus:ring-offset-2",
                    disabled && "opacity-50 cursor-not-allowed",
                    variant === "default" && [
                      "border-b-2",
                      selected
                        ? "border-brand-primary text-brand-primary"
                        : "border-transparent text-neutral-textSecondary hover:text-neutral-text hover:border-neutral-border",
                    ],
                    variant === "pills" && [
                      "rounded-md",
                      selected
                        ? "bg-neutral-surface text-brand-primary shadow-sm"
                        : "text-neutral-textSecondary hover:text-neutral-text",
                    ],
                  )}
                  disabled={disabled}
                >
                  {tab.icon && (
                    <span className="flex-shrink-0">{tab.icon}</span>
                  )}
                  {tab.label}
                </button>
              )}
            </Tab>
          ))}
        </Tab.List>

        <Tab.Panels className="mt-4">
          {tabs.map((tab, index) => (
            <Tab.Panel
              key={index}
              className={clsx(
                "focus:outline-none focus:ring-2 focus:ring-brand-primary rounded-lg",
              )}
            >
              {tab.content}
            </Tab.Panel>
          ))}
        </Tab.Panels>
      </div>
    </Tab.Group>
  );
}
