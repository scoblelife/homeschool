/**
 * Global keyboard shortcuts for desktop navigation.
 *
 * Cmd+1–7: Navigate to sidebar pages
 * Cmd+N: Open QuickAdd (dispatches custom "quickadd:open" event)
 * Escape: Close modals (handled natively by Headless UI, but this
 *          dispatches "modal:escape" for any custom consumers)
 */

import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

const NAV_SHORTCUTS: Record<string, string> = {
  "1": "/",
  "2": "/log",
  "3": "/milestones",
  "4": "/calendar",
  "5": "/curriculum",
  "6": "/reports",
  "7": "/settings",
};

export function useKeyboardShortcuts(): void {
  const navigate = useNavigate();

  useEffect(() => {
    const handler = (e: KeyboardEvent): void => {
      // Ignore when typing in inputs, textareas, or contenteditable
      const target = e.target as HTMLElement;
      const isInput =
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.tagName === "SELECT" ||
        target.isContentEditable;

      // Cmd/Ctrl + digit → navigate
      if (e.metaKey && !e.shiftKey && !e.altKey) {
        const path = NAV_SHORTCUTS[e.key];
        if (path) {
          e.preventDefault();
          navigate(path);
          return;
        }

        // Cmd+N → open QuickAdd (skip if in input)
        if (e.key === "n" && !isInput) {
          e.preventDefault();
          window.dispatchEvent(new CustomEvent("quickadd:open"));
          return;
        }
      }

      // Escape → broadcast for custom modal consumers
      if (e.key === "Escape") {
        window.dispatchEvent(new CustomEvent("modal:escape"));
      }
    };

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [navigate]);
}
