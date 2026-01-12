/**
 * Mobile Performance Monitoring
 *
 * Tracks app launch time, screen load times, database query performance,
 * and memory usage for React Native.
 */

import React from 'react'
import { InteractionManager } from 'react-native'

interface PerformanceMark {
  name: string
  startTime: number
  endTime?: number
  duration?: number
}

interface PerformanceMetrics {
  appLaunchTime: number | null
  screenLoadTimes: Record<string, number[]>
  dbQueryTimes: Record<string, number[]>
  coldStartTime: number | null
}

class MobilePerformanceMonitor {
  private marks: Map<string, PerformanceMark> = new Map()
  private metrics: PerformanceMetrics = {
    appLaunchTime: null,
    screenLoadTimes: {},
    dbQueryTimes: {},
    coldStartTime: null,
  }
  private isEnabled = true
  private appStartTime: number = Date.now()

  /**
   * Record cold start time (call from App entry point)
   */
  recordColdStart(): void {
    if (!this.isEnabled) return
    this.appStartTime = Date.now()
    this.marks.set('cold_start', {
      name: 'cold_start',
      startTime: this.appStartTime,
    })
  }

  /**
   * Mark app as fully interactive (call after first render)
   */
  markAppReady(): void {
    if (!this.isEnabled) return
    const mark = this.marks.get('cold_start')
    if (mark) {
      // Wait for interactions to complete
      InteractionManager.runAfterInteractions(() => {
        mark.endTime = Date.now()
        mark.duration = mark.endTime - mark.startTime
        this.metrics.appLaunchTime = mark.duration
        this.metrics.coldStartTime = mark.duration

        console.log(`[Performance] Cold start time: ${mark.duration}ms`)

        // Warn if cold start exceeds 2 seconds
        if (mark.duration > 2000) {
          console.warn(`[Performance] Cold start exceeded 2s target: ${mark.duration}ms`)
        }
      })
    }
  }

  /**
   * Start tracking a screen load
   */
  markScreenStart(screenName: string): void {
    if (!this.isEnabled) return
    this.marks.set(`screen_${screenName}`, {
      name: `screen_${screenName}`,
      startTime: Date.now(),
    })
  }

  /**
   * Mark screen as interactive
   */
  markScreenReady(screenName: string): void {
    if (!this.isEnabled) return
    const mark = this.marks.get(`screen_${screenName}`)
    if (mark) {
      InteractionManager.runAfterInteractions(() => {
        mark.endTime = Date.now()
        mark.duration = mark.endTime - mark.startTime

        if (!this.metrics.screenLoadTimes[screenName]) {
          this.metrics.screenLoadTimes[screenName] = []
        }
        this.metrics.screenLoadTimes[screenName].push(mark.duration)

        console.log(`[Performance] Screen "${screenName}" ready: ${mark.duration}ms`)

        // Warn for slow screens (>500ms)
        if (mark.duration > 500) {
          console.warn(`[Performance] Slow screen "${screenName}": ${mark.duration}ms`)
        }
      })
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
      startTime: Date.now(),
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
      mark.endTime = Date.now()
      mark.duration = mark.endTime - mark.startTime

      if (!this.metrics.dbQueryTimes[mark.name]) {
        this.metrics.dbQueryTimes[mark.name] = []
      }
      this.metrics.dbQueryTimes[mark.name].push(mark.duration)

      // Warn for slow queries (>100ms)
      if (mark.duration > 100) {
        console.warn(`[Performance] Slow query "${mark.name}": ${mark.duration}ms`)
      }

      this.marks.delete(id)
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
    coldStartTime: number | null
    avgScreenLoadTimes: Record<string, number>
    slowQueries: Array<{ name: string; avgTime: number }>
  } {
    const avgScreenLoadTimes: Record<string, number> = {}
    for (const [screen, times] of Object.entries(this.metrics.screenLoadTimes)) {
      avgScreenLoadTimes[screen] = times.reduce((a, b) => a + b, 0) / times.length
    }

    return {
      coldStartTime: this.metrics.coldStartTime,
      avgScreenLoadTimes,
      slowQueries: this.getSlowQueries(),
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
      coldStartTime: null,
    }
  }
}

// Singleton instance
export const performanceMonitor = new MobilePerformanceMonitor()

/**
 * React hook for screen performance tracking
 */
import { useEffect, useRef } from 'react'

export function useScreenPerformance(screenName: string): void {
  const hasMarked = useRef(false)

  useEffect(() => {
    if (!hasMarked.current) {
      performanceMonitor.markScreenStart(screenName)
      hasMarked.current = true
    }

    // Mark ready after layout
    const timeout = setTimeout(() => {
      performanceMonitor.markScreenReady(screenName)
    }, 0)

    return () => clearTimeout(timeout)
  }, [screenName])
}

/**
 * Higher-order component to track screen performance
 */
export function withPerformanceTracking<P extends object>(
  screenName: string,
  WrappedComponent: React.ComponentType<P>
): React.FC<P> {
  return function PerformanceTrackedComponent(props: P) {
    useScreenPerformance(screenName)
    return <WrappedComponent {...props} />
  }
}
