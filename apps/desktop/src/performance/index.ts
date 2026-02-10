/**
 * Desktop Performance Monitoring
 *
 * Tracks app launch time, screen load times, database query performance,
 * and memory usage.
 */

interface PerformanceMark {
  name: string
  startTime: number
  endTime?: number
  duration?: number
  metadata?: Record<string, unknown>
}

interface PerformanceMetrics {
  appLaunchTime: number | null
  screenLoadTimes: Record<string, number[]>
  dbQueryTimes: Record<string, number[]>
  memoryUsage: number[]
}

class PerformanceMonitor {
  private marks: Map<string, PerformanceMark> = new Map()
  private metrics: PerformanceMetrics = {
    appLaunchTime: null,
    screenLoadTimes: {},
    dbQueryTimes: {},
    memoryUsage: [],
  }
  private isEnabled = true

  /**
   * Start tracking app launch time
   */
  markAppStart(): void {
    if (!this.isEnabled) return
    this.marks.set('app_launch', {
      name: 'app_launch',
      startTime: performance.now(),
    })
  }

  /**
   * Mark app as fully loaded
   */
  markAppReady(): void {
    if (!this.isEnabled) return
    const mark = this.marks.get('app_launch')
    if (mark) {
      mark.endTime = performance.now()
      mark.duration = mark.endTime - mark.startTime
      this.metrics.appLaunchTime = mark.duration
      console.log(`[Performance] App launch time: ${mark.duration.toFixed(2)}ms`)

      // Warn if launch time exceeds 2 seconds
      if (mark.duration > 2000) {
        console.warn(`[Performance] App launch exceeded 2s target: ${mark.duration.toFixed(2)}ms`)
      }
    }
  }

  /**
   * Start tracking a screen load
   */
  markScreenStart(screenName: string): void {
    if (!this.isEnabled) return
    this.marks.set(`screen_${screenName}`, {
      name: `screen_${screenName}`,
      startTime: performance.now(),
    })
  }

  /**
   * Mark screen as interactive
   */
  markScreenReady(screenName: string): void {
    if (!this.isEnabled) return
    const mark = this.marks.get(`screen_${screenName}`)
    if (mark) {
      mark.endTime = performance.now()
      mark.duration = mark.endTime - mark.startTime

      if (!this.metrics.screenLoadTimes[screenName]) {
        this.metrics.screenLoadTimes[screenName] = []
      }
      this.metrics.screenLoadTimes[screenName].push(mark.duration)

      console.log(`[Performance] Screen "${screenName}" ready: ${mark.duration.toFixed(2)}ms`)
    }
  }

  /**
   * Start tracking a database query
   */
  markDbQueryStart(queryName: string): string {
    if (!this.isEnabled) return ''
    const id = `db_${queryName}_${Date.now()}`
    this.marks.set(id, {
      name: queryName,
      startTime: performance.now(),
    })
    return id
  }

  /**
   * Mark database query complete
   */
  markDbQueryEnd(id: string): void {
    if (!this.isEnabled || !id) return
    const mark = this.marks.get(id)
    if (mark) {
      mark.endTime = performance.now()
      mark.duration = mark.endTime - mark.startTime

      if (!this.metrics.dbQueryTimes[mark.name]) {
        this.metrics.dbQueryTimes[mark.name] = []
      }
      this.metrics.dbQueryTimes[mark.name].push(mark.duration)

      // Warn for slow queries (>100ms)
      if (mark.duration > 100) {
        console.warn(`[Performance] Slow query "${mark.name}": ${mark.duration.toFixed(2)}ms`)
      }

      this.marks.delete(id)
    }
  }

  /**
   * Track memory usage (call periodically)
   */
  recordMemoryUsage(): void {
    if (!this.isEnabled) return

    // Use performance.memory if available (Chrome/Electron)
    const memory = (performance as unknown as { memory?: { usedJSHeapSize: number } }).memory
    if (memory) {
      const usedMB = memory.usedJSHeapSize / 1024 / 1024
      this.metrics.memoryUsage.push(usedMB)

      // Keep only last 100 measurements
      if (this.metrics.memoryUsage.length > 100) {
        this.metrics.memoryUsage.shift()
      }

      // Warn for high memory usage (>500MB)
      if (usedMB > 500) {
        console.warn(`[Performance] High memory usage: ${usedMB.toFixed(2)}MB`)
      }
    }
  }

  /**
   * Get average screen load time
   */
  getAverageScreenLoadTime(screenName: string): number | null {
    const times = this.metrics.screenLoadTimes[screenName]
    if (!times || times.length === 0) return null
    return times.reduce((a, b) => a + b, 0) / times.length
  }

  /**
   * Get slow database queries
   */
  getSlowQueries(thresholdMs = 50): Array<{ name: string; avgTime: number }> {
    return Object.entries(this.metrics.dbQueryTimes)
      .map(([name, times]) => ({
        name,
        avgTime: times.reduce((a, b) => a + b, 0) / times.length,
      }))
      .filter((q) => q.avgTime > thresholdMs)
      .sort((a, b) => b.avgTime - a.avgTime)
  }

  /**
   * Get performance summary
   */
  getSummary(): {
    appLaunchTime: number | null
    avgScreenLoadTimes: Record<string, number>
    slowQueries: Array<{ name: string; avgTime: number }>
    avgMemoryUsageMB: number | null
    peakMemoryUsageMB: number | null
  } {
    const avgScreenLoadTimes: Record<string, number> = {}
    for (const [screen, times] of Object.entries(this.metrics.screenLoadTimes)) {
      avgScreenLoadTimes[screen] = times.reduce((a, b) => a + b, 0) / times.length
    }

    const avgMemory =
      this.metrics.memoryUsage.length > 0
        ? this.metrics.memoryUsage.reduce((a, b) => a + b, 0) / this.metrics.memoryUsage.length
        : null

    const peakMemory =
      this.metrics.memoryUsage.length > 0 ? Math.max(...this.metrics.memoryUsage) : null

    return {
      appLaunchTime: this.metrics.appLaunchTime,
      avgScreenLoadTimes,
      slowQueries: this.getSlowQueries(),
      avgMemoryUsageMB: avgMemory,
      peakMemoryUsageMB: peakMemory,
    }
  }

  /**
   * Enable/disable monitoring
   */
  setEnabled(enabled: boolean): void {
    this.isEnabled = enabled
  }

  /**
   * Clear all metrics
   */
  reset(): void {
    this.marks.clear()
    this.metrics = {
      appLaunchTime: null,
      screenLoadTimes: {},
      dbQueryTimes: {},
      memoryUsage: [],
    }
  }
}

// Singleton instance
export const performanceMonitor = new PerformanceMonitor()

// Start memory monitoring interval
let memoryInterval: ReturnType<typeof setInterval> | null = null

export function startMemoryMonitoring(intervalMs = 10000): void {
  if (memoryInterval) return
  memoryInterval = setInterval(() => {
    performanceMonitor.recordMemoryUsage()
  }, intervalMs)
}

export function stopMemoryMonitoring(): void {
  if (memoryInterval) {
    clearInterval(memoryInterval)
    memoryInterval = null
  }
}

// React hook for screen performance tracking
export function useScreenPerformance(screenName: string): void {
  // This would be imported from React in the actual implementation
  // For now, just mark screen start on first render
  performanceMonitor.markScreenStart(screenName)

  // Mark ready after a microtask (simulating component mount)
  Promise.resolve().then(() => {
    performanceMonitor.markScreenReady(screenName)
  })
}
