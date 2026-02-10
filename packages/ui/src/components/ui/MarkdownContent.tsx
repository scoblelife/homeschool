/**
 * MarkdownContent - Wrapper for rendered markdown with prose styling
 */

import Markdown from "react-markdown";

interface MarkdownContentProps {
  children: string;
  className?: string;
}

export function MarkdownContent({
  children,
  className = "",
}: MarkdownContentProps) {
  return (
    <div
      className={`text-sm text-gray-600 prose prose-sm max-w-none ${className}`}
    >
      <Markdown>{children}</Markdown>
    </div>
  );
}
