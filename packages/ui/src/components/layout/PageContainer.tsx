/**
 * PageContainer Component
 *
 * Max-width container for page content. Provides consistent
 * padding and centered layout.
 */

import { ReactNode } from "react";
import { clsx } from "clsx";

export interface PageContainerProps {
  /** Page content */
  children: ReactNode;
  /** Maximum width (default: none) */
  maxWidth?: "sm" | "md" | "lg" | "xl" | "2xl" | "full";
  /** Additional CSS classes */
  className?: string;
}

const maxWidthClasses = {
  sm: "max-w-screen-sm",
  md: "max-w-screen-md",
  lg: "max-w-screen-lg",
  xl: "max-w-screen-xl",
  "2xl": "max-w-screen-2xl",
  full: "max-w-full",
};

export function PageContainer({
  children,
  maxWidth,
  className,
}: PageContainerProps) {
  return (
    <div
      className={clsx("p-8", maxWidth && maxWidthClasses[maxWidth], className)}
    >
      {children}
    </div>
  );
}
