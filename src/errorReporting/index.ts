/**
 * Error reporting module for desktop (Electron main process)
 *
 * Captures unhandled errors and stores them locally.
 * Can optionally integrate with Sentry if configured.
 */

import { app } from 'electron'
import * as fs from 'fs'
import * as path from 'path'

interface ErrorLog {
  timestamp: string
  type: 'error' | 'unhandledRejection' | 'uncaughtException'
  message: string
  stack?: string
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
const CONFIG_FILE = 'error-reporting.json'

class ErrorReporting {
  private state: ErrorReportingState = {
    enabled: true,
    logs: [],
    breadcrumbs: [],
  }

  private configPath: string = ''
  private initialized = false

  initialize(): void {
    if (this.initialized) return

    // Set up config path
    const userDataPath = app.getPath('userData')
    this.configPath = path.join(userDataPath, CONFIG_FILE)

    // Load existing state
    this.loadState()

    // Set up global error handlers
    process.on('uncaughtException', (error) => {
      this.captureError(error, 'uncaughtException')
    })

    process.on('unhandledRejection', (reason) => {
      const error = reason instanceof Error ? reason : new Error(String(reason))
      this.captureError(error, 'unhandledRejection')
    })

    this.initialized = true
    this.addBreadcrumb('system', 'Error reporting initialized')
  }

  private loadState(): void {
    try {
      if (fs.existsSync(this.configPath)) {
        const data = fs.readFileSync(this.configPath, 'utf-8')
        const parsed = JSON.parse(data) as Partial<ErrorReportingState>
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
      fs.writeFileSync(this.configPath, JSON.stringify(this.state, null, 2))
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
   * Capture an error
   */
  captureError(
    error: Error,
    type: 'error' | 'unhandledRejection' | 'uncaughtException' = 'error'
  ): void {
    if (!this.state.enabled) return

    const log: ErrorLog = {
      timestamp: new Date().toISOString(),
      type,
      message: error.message,
      stack: error.stack,
      breadcrumbs: [...this.state.breadcrumbs],
    }

    this.state.logs.push(log)
    this.saveState()

    console.error(`[ErrorReporting] Captured ${type}:`, error.message)
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
