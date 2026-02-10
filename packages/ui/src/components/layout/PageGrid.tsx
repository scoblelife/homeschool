/**
 * PageGrid Component
 *
 * Responsive grid for card layouts. Handles responsive column
 * counts automatically.
 */

import { ReactNode } from "react";
import { clsx } from "clsx";

export interface PageGridProps {
  /** Grid content */
  children: ReactNode;
  /** Number of columns on desktop */
  cols?: 2 | 3 | 4;
  /** Gap size */
  gap?: 4 | 6 | 8;
  /** Additional CSS classes */
  className?: string;
}

const colsClasses = {
  2: "md:grid-cols-2",
  3: "md:grid-cols-2 lg:grid-cols-3",
  4: "md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4",
};

const gapClasses = {
  4: "gap-4",
  6: "gap-6",
  8: "gap-8",
};

export function PageGrid({
  children,
  cols = 3,
  gap = 6,
  className,
}: PageGridProps) {
  return (
    <div
      className={clsx(
        "grid grid-cols-1",
        colsClasses[cols],
        gapClasses[gap],
        className,
      )}
    >
      {children}
    </div>
  );
}
