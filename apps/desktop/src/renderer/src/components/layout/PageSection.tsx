/**
 * PageSection Component
 *
 * Section wrapper with optional title. Provides consistent spacing
 * and layout for page content sections.
 */

import { ReactNode } from "react";
import { clsx } from "clsx";
import { Card, CardTitle, CardContent } from "../ui/Card";

export interface PageSectionProps {
  /** Section title (optional) */
  title?: string;
  /** Section content */
  children: ReactNode;
  /** Whether to wrap in a Card component */
  card?: boolean;
  /** Additional CSS classes */
  className?: string;
}

export function PageSection({
  title,
  children,
  card = true,
  className,
}: PageSectionProps) {
  if (card) {
    return (
      <Card padding="lg" className={clsx("mb-6", className)}>
        {title && <CardTitle>{title}</CardTitle>}
        <CardContent>{children}</CardContent>
      </Card>
    );
  }

  return (
    <section className={clsx("mb-6", className)}>
      {title && (
        <h2 className="text-lg font-semibold text-gray-900 mb-4">{title}</h2>
      )}
      {children}
    </section>
  );
}
