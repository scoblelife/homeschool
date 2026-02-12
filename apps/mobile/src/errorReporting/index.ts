/**
 * Error reporting module for React Native
 *
 * Captures unhandled errors and stores them locally.
 * Can optionally integrate with Sentry if configured.
 */

import AsyncStorage from "@react-native-async-storage/async-storage";

declare const global: {
  ErrorUtils?: {
    getGlobalHandler: () => (error: unknown, isFatal: boolean) => void;
    setGlobalHandler: (
      handler: (error: unknown, isFatal: boolean) => void,
    ) => void;
  };
  Promise: typeof Promise;
};

interface ErrorLog {
  timestamp: string;
  type: "error" | "unhandledRejection" | "uncaughtException" | "componentError";
  message: string;
  stack?: string;
  componentStack?: string;
  breadcrumbs: Breadcrumb[];
}

interface Breadcrumb {
  timestamp: string;
  category: string;
  message: string;
  data?: Record<string, unknown>;
}

interface ErrorReportingState {
  enabled: boolean;
  logs: ErrorLog[];
  breadcrumbs: Breadcrumb[];
}

const MAX_LOGS = 100;
const MAX_BREADCRUMBS = 50;
const STORAGE_KEY = "@homeschool/error_reporting";

class ErrorReporting {
  private state: ErrorReportingState = {
    enabled: true,
    logs: [],
    breadcrumbs: [],
  };

  private initialized = false;
  private initPromise: Promise<void> | null = null;

  async initialize(): Promise<void> {
    if (this.initialized) return;
    if (this.initPromise) return this.initPromise;

    this.initPromise = this.doInitialize();
    await this.initPromise;
    this.initialized = true;
  }

  private async doInitialize(): Promise<void> {
    // Load existing state
    await this.loadState();

    // Set up global error handler (ErrorUtils is a global, not a react-native export in RN 0.81+)
    const errorUtils = global.ErrorUtils;
    if (!errorUtils) {
      console.warn(
        "[ErrorReporting] ErrorUtils not available, skipping global handler setup",
      );
      return;
    }
    const previousHandler = errorUtils.getGlobalHandler();

    errorUtils.setGlobalHandler((error: unknown, isFatal: boolean) => {
      this.captureError(
        error instanceof Error ? error : new Error(String(error)),
        isFatal ? "uncaughtException" : "error",
      );

      // Call previous handler if exists
      if (previousHandler) {
        previousHandler(error, isFatal);
      }
    });

    // Handle unhandled promise rejections
    const originalPromise = global.Promise;

    // Track unhandled rejections via React Native's tracking
    if (typeof global !== "undefined") {
      const tracking = require("promise/setimmediate/rejection-tracking");
      tracking.enable({
        allRejections: true,
        onUnhandled: (id: number, error: Error) => {
          this.captureError(error, "unhandledRejection");
        },
        onHandled: () => {
          // Rejection was handled, ignore
        },
      });
    }

    this.addBreadcrumb("system", "Error reporting initialized");
  }

  private async loadState(): Promise<void> {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as Partial<ErrorReportingState>;
        this.state = {
          enabled: parsed.enabled ?? true,
          logs: parsed.logs ?? [],
          breadcrumbs: [], // Reset breadcrumbs on app start
        };
      }
    } catch (err) {
      console.error("[ErrorReporting] Failed to load state:", err);
    }
  }

  private async saveState(): Promise<void> {
    try {
      // Trim logs if too many
      if (this.state.logs.length > MAX_LOGS) {
        this.state.logs = this.state.logs.slice(-MAX_LOGS);
      }
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(this.state));
    } catch (err) {
      console.error("[ErrorReporting] Failed to save state:", err);
    }
  }

  /**
   * Add a breadcrumb for debugging context
   */
  addBreadcrumb(
    category: string,
    message: string,
    data?: Record<string, unknown>,
  ): void {
    if (!this.state.enabled) return;

    const breadcrumb: Breadcrumb = {
      timestamp: new Date().toISOString(),
      category,
      message,
      data,
    };

    this.state.breadcrumbs.push(breadcrumb);

    // Trim breadcrumbs if too many
    if (this.state.breadcrumbs.length > MAX_BREADCRUMBS) {
      this.state.breadcrumbs = this.state.breadcrumbs.slice(-MAX_BREADCRUMBS);
    }
  }

  /**
   * Capture an error (can be called from ErrorBoundary)
   */
  captureError(
    error: Error,
    type:
      | "error"
      | "unhandledRejection"
      | "uncaughtException"
      | "componentError" = "error",
    componentStack?: string,
  ): void {
    if (!this.state.enabled) return;

    const log: ErrorLog = {
      timestamp: new Date().toISOString(),
      type,
      message: error.message,
      stack: error.stack,
      componentStack,
      breadcrumbs: [...this.state.breadcrumbs],
    };

    this.state.logs.push(log);

    // Save async, don't block
    this.saveState().catch((err) => {
      console.error("[ErrorReporting] Failed to save error:", err);
    });

    if (__DEV__) {
      console.error(`[ErrorReporting] Captured ${type}:`, error.message);
    }
  }

  /**
   * Enable or disable error reporting
   */
  async setEnabled(enabled: boolean): Promise<void> {
    this.state.enabled = enabled;
    await this.saveState();
  }

  /**
   * Check if error reporting is enabled
   */
  isEnabled(): boolean {
    return this.state.enabled;
  }

  /**
   * Get error logs for display
   */
  getLogs(): ErrorLog[] {
    return this.state.logs;
  }

  /**
   * Get summary of errors
   */
  getSummary(): {
    totalErrors: number;
    lastError: string | null;
    errorsByType: Record<string, number>;
  } {
    const errorsByType: Record<string, number> = {};

    for (const log of this.state.logs) {
      errorsByType[log.type] = (errorsByType[log.type] || 0) + 1;
    }

    return {
      totalErrors: this.state.logs.length,
      lastError: this.state.logs[this.state.logs.length - 1]?.timestamp ?? null,
      errorsByType,
    };
  }

  /**
   * Clear all error logs
   */
  async clearLogs(): Promise<void> {
    this.state.logs = [];
    await this.saveState();
  }
}

// Singleton instance
export const errorReporting = new ErrorReporting();

// React hook for error reporting
export function useErrorReporting() {
  return {
    captureError: errorReporting.captureError.bind(errorReporting),
    addBreadcrumb: errorReporting.addBreadcrumb.bind(errorReporting),
    isEnabled: errorReporting.isEnabled(),
    setEnabled: errorReporting.setEnabled.bind(errorReporting),
    getLogs: errorReporting.getLogs.bind(errorReporting),
    getSummary: errorReporting.getSummary.bind(errorReporting),
    clearLogs: errorReporting.clearLogs.bind(errorReporting),
    initialize: errorReporting.initialize.bind(errorReporting),
  };
}
