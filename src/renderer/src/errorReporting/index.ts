/**
 * Error reporting module for desktop renderer (browser context)
 *
 * Captures unhandled errors and stores them locally.
 * Can optionally integrate with Sentry if configured.
 */

interface ErrorLog {
  timestamp: string
  type: 'error' | 'unhandledRejection' | 'uncaughtException'
  message: string
  stack?: string
  componentStack?: string
  breadcrumbs: Breadcrumb[]
}

interface Breadcrumb {
  timestamp: string
  category: string
  message: string
  data?: Record<string, unknown>
}

interface ErrorReportingState {
  enabled: boolean
  logs: ErrorLog[]
  breadcrumbs: Breadcrumb[]
}

const MAX_LOGS = 100
const MAX_BREADCRUMBS = 50
const STORAGE_KEY = 'homeschool_error_reporting'

class ErrorReporting {
  private state: ErrorReportingState = {
    enabled: true,
    logs: [],
    breadcrumbs: [],
  }

  private initialized = false

  initialize(): void {
    if (this.initialized) return

    // Load existing state
    this.loadState()

    // Set up global error handlers
    window.addEventListener('error', (event) => {
      this.captureError(event.error || new Error(event.message), 'error')
    })

    window.addEventListener('unhandledrejection', (event) => {
      const error =
        event.reason instanceof Error ? event.reason : new Error(String(event.reason))
      this.captureError(error, 'unhandledRejection')
    })

    this.initialized = true
    this.addBreadcrumb('system', 'Error reporting initialized')
  }

  private loadState(): void {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        const parsed = JSON.parse(stored) as Partial<ErrorReportingState>
        this.state = {
          enabled: parsed.enabled ?? true,
          logs: parsed.logs ?? [],
          breadcrumbs: [], // Reset breadcrumbs on app start
        }
      }
    } catch (err) {
      console.error('[ErrorReporting] Failed to load state:', err)
    }
  }

  private saveState(): void {
    try {
      // Trim logs if too many
      if (this.state.logs.length > MAX_LOGS) {
        this.state.logs = this.state.logs.slice(-MAX_LOGS)
      }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.state))
    } catch (err) {
      console.error('[ErrorReporting] Failed to save state:', err)
    }
  }

  /**
   * Add a breadcrumb for debugging context
   */
  addBreadcrumb(category: string, message: string, data?: Record<string, unknown>): void {
    if (!this.state.enabled) return

    const breadcrumb: Breadcrumb = {
      timestamp: new Date().toISOString(),
      category,
      message,
      data,
    }

    this.state.breadcrumbs.push(breadcrumb)

    // Trim breadcrumbs if too many
    if (this.state.breadcrumbs.length > MAX_BREADCRUMBS) {
      this.state.breadcrumbs = this.state.breadcrumbs.slice(-MAX_BREADCRUMBS)
    }
  }

  /**
   * Capture an error (can be called from ErrorBoundary)
   */
  captureError(
    error: Error,
    type: 'error' | 'unhandledRejection' | 'uncaughtException' = 'error',
    componentStack?: string
  ): void {
    if (!this.state.enabled) return

    const log: ErrorLog = {
      timestamp: new Date().toISOString(),
      type,
      message: error.message,
      stack: error.stack,
      componentStack,
      breadcrumbs: [...this.state.breadcrumbs],
    }

    this.state.logs.push(log)
    this.saveState()

    if (import.meta.env.DEV) {
      console.error(`[ErrorReporting] Captured ${type}:`, error.message)
    }
  }

  /**
   * Enable or disable error reporting
   */
  setEnabled(enabled: boolean): void {
    this.state.enabled = enabled
    this.saveState()
  }

  /**
   * Check if error reporting is enabled
   */
  isEnabled(): boolean {
    return this.state.enabled
  }

  /**
   * Get error logs for display
   */
  getLogs(): ErrorLog[] {
    return this.state.logs
  }

  /**
   * Get summary of errors
   */
  getSummary(): {
    totalErrors: number
    lastError: string | null
    errorsByType: Record<string, number>
  } {
    const errorsByType: Record<string, number> = {}

    for (const log of this.state.logs) {
      errorsByType[log.type] = (errorsByType[log.type] || 0) + 1
    }

    return {
      totalErrors: this.state.logs.length,
      lastError: this.state.logs[this.state.logs.length - 1]?.timestamp ?? null,
      errorsByType,
    }
  }

  /**
   * Clear all error logs
   */
  clearLogs(): void {
    this.state.logs = []
    this.saveState()
  }
}

// Singleton instance
export const errorReporting = new ErrorReporting()

// Initialize on import
errorReporting.initialize()

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
  }
}
