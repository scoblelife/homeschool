/**
 * Error Boundary Component
 *
 * Catches React errors and displays a fallback UI instead of crashing the app.
 * Provides graceful degradation for component failures.
 */

import { Component, ErrorInfo, ReactNode } from "react";
import { errorReporting } from "../errorReporting";

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  // If true, show a minimal fallback without error details
  silent?: boolean;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error("[ErrorBoundary] Caught error:", error);
    console.error("[ErrorBoundary] Component stack:", errorInfo.componentStack);

    // Report to error reporting system
    errorReporting.captureError(
      error,
      "error",
      errorInfo.componentStack ?? undefined,
    );

    this.props.onError?.(error, errorInfo);
  }

  render(): ReactNode {
    if (this.state.hasError) {
      // If a custom fallback is provided, use it
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Silent mode - just render nothing
      if (this.props.silent) {
        return null;
      }

      // Default fallback UI
      return (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center gap-2 text-red-700 mb-2">
            <svg
              className="w-5 h-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
            <span className="font-medium">Something went wrong</span>
          </div>
          <p className="text-sm text-red-600 mb-3">
            This component couldn't load properly. The rest of the app should
            still work.
          </p>
          <button
            onClick={() => this.setState({ hasError: false, error: null })}
            className="text-sm text-red-700 hover:text-red-800 underline"
          >
            Try again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * Higher-order component to wrap any component with an error boundary
 */
export function withErrorBoundary<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  fallback?: ReactNode,
): React.FC<P> {
  return function WithErrorBoundary(props: P) {
    return (
      <ErrorBoundary fallback={fallback}>
        <WrappedComponent {...props} />
      </ErrorBoundary>
    );
  };
}

/**
 * A compact error fallback for dashboard widgets
 */
export function WidgetErrorFallback(): JSX.Element {
  return (
    <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg text-center">
      <span className="text-sm text-gray-500">Unable to load</span>
    </div>
  );
}

/**
 * A silent error boundary that just hides the component on error
 */
export function SilentErrorBoundary({
  children,
}: {
  children: ReactNode;
}): JSX.Element {
  return <ErrorBoundary silent>{children}</ErrorBoundary>;
}
