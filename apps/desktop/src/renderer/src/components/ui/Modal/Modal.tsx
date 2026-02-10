/**
 * Modal Component
 *
 * A wrapper around Headless UI Dialog with consistent design system styling.
 * Provides animated overlay, proper focus management, and accessibility.
 */

import { Fragment, ReactNode } from "react";
import { Dialog, Transition } from "@headlessui/react";
import { clsx } from "clsx";

export type ModalSize = "sm" | "md" | "lg" | "xl" | "full";

export interface ModalProps {
  /** Whether the modal is open */
  open: boolean;
  /** Callback when modal should close */
  onClose: () => void;
  /** Modal title (optional) */
  title?: string;
  /** Modal content */
  children: ReactNode;
  /** Size variant */
  size?: ModalSize;
  /** Additional CSS classes */
  className?: string;
  /** Whether to show close button on overlay click (default: true) */
  closeOnOverlayClick?: boolean;
}

const sizeClasses: Record<ModalSize, string> = {
  sm: "max-w-sm",
  md: "max-w-md",
  lg: "max-w-lg",
  xl: "max-w-xl",
  full: "max-w-7xl",
};

export function Modal({
  open,
  onClose,
  title,
  children,
  size = "md",
  className,
  closeOnOverlayClick = true,
}: ModalProps) {
  const handleOverlayClick = () => {
    if (closeOnOverlayClick) {
      onClose();
    }
  };

  return (
    <Transition appear show={open} as={Fragment}>
      <Dialog
        as="div"
        className="relative z-modal"
        onClose={handleOverlayClick}
      >
        {/* Overlay */}
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/30 backdrop-blur-sm" />
        </Transition.Child>

        {/* Modal Container */}
        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel
                className={clsx(
                  "w-full transform overflow-hidden rounded-xl bg-white shadow-xl transition-all",
                  sizeClasses[size],
                  className,
                )}
              >
                {/* Header */}
                {title && (
                  <div className="border-b border-gray-200 px-6 py-4">
                    <Dialog.Title className="text-lg font-semibold text-gray-900">
                      {title}
                    </Dialog.Title>
                  </div>
                )}

                {/* Content */}
                <div className={clsx("px-6", title ? "py-4" : "py-6")}>
                  {children}
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}

/**
 * ModalHeader - Optional header section for modals without title prop
 */
export interface ModalHeaderProps {
  children: ReactNode;
  className?: string;
}

export function ModalHeader({ children, className }: ModalHeaderProps) {
  return (
    <div className={clsx("border-b border-gray-200 px-6 py-4", className)}>
      <Dialog.Title as="h3" className="text-lg font-semibold text-gray-900">
        {children}
      </Dialog.Title>
    </div>
  );
}

/**
 * ModalBody - Content section
 */
export interface ModalBodyProps {
  children: ReactNode;
  className?: string;
}

export function ModalBody({ children, className }: ModalBodyProps) {
  return <div className={clsx("px-6 py-4", className)}>{children}</div>;
}

/**
 * ModalFooter - Actions section
 */
export interface ModalFooterProps {
  children: ReactNode;
  className?: string;
}

export function ModalFooter({ children, className }: ModalFooterProps) {
  return (
    <div
      className={clsx(
        "border-t border-gray-200 px-6 py-4 bg-gray-50",
        className,
      )}
    >
      <div className="flex justify-end gap-3">{children}</div>
    </div>
  );
}

/**
 * ModalActions - Convenience wrapper for action buttons in footer
 */
export interface ModalActionsProps {
  children: ReactNode;
  className?: string;
}

export function ModalActions({ children, className }: ModalActionsProps) {
  return (
    <div className={clsx("flex justify-end gap-3", className)}>{children}</div>
  );
}
