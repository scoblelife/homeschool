/**
 * Privacy-respecting analytics module
 *
 * Tracks app usage events locally with optional opt-out.
 * No PII is collected or transmitted.
 */

// Event types we track
export type AnalyticsEvent =
  | "app_open"
  | "activity_logged"
  | "session_started"
  | "session_ended"
  | "report_generated"
  | "milestone_completed"
  | "streak_achieved"
  | "student_added"
  | "sync_connected"
  | "sync_disconnected";

interface EventData {
  event: AnalyticsEvent;
  timestamp: string;
  properties?: Record<string, string | number | boolean>;
}

interface AnalyticsState {
  enabled: boolean;
  events: EventData[];
  sessionStart: string | null;
}

const STORAGE_KEY = "homeschool_analytics";
const MAX_EVENTS = 1000; // Keep last 1000 events locally

class Analytics {
  private state: AnalyticsState = {
    enabled: true,
    events: [],
    sessionStart: null,
  };

  constructor() {
    this.loadState();
  }

  private loadState(): void {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as Partial<AnalyticsState>;
        this.state = {
          enabled: parsed.enabled ?? true,
          events: parsed.events ?? [],
          sessionStart: null, // Reset on app start
        };
      }
    } catch (err) {
      console.error("[Analytics] Failed to load state:", err);
    }
  }

  private saveState(): void {
    try {
      // Trim events if too many
      if (this.state.events.length > MAX_EVENTS) {
        this.state.events = this.state.events.slice(-MAX_EVENTS);
      }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.state));
    } catch (err) {
      console.error("[Analytics] Failed to save state:", err);
    }
  }

  /**
   * Track an analytics event
   */
  track(
    event: AnalyticsEvent,
    properties?: Record<string, string | number | boolean>,
  ): void {
    if (!this.state.enabled) return;

    const eventData: EventData = {
      event,
      timestamp: new Date().toISOString(),
      properties,
    };

    this.state.events.push(eventData);
    this.saveState();

    // Log in development
    if (import.meta.env.DEV) {
      console.log("[Analytics]", event, properties);
    }
  }

  /**
   * Track app open (call once on startup)
   */
  trackAppOpen(): void {
    this.state.sessionStart = new Date().toISOString();
    this.track("app_open");
  }

  /**
   * Enable or disable analytics
   */
  setEnabled(enabled: boolean): void {
    this.state.enabled = enabled;
    this.saveState();
  }

  /**
   * Check if analytics is enabled
   */
  isEnabled(): boolean {
    return this.state.enabled;
  }

  /**
   * Get local analytics summary (for display in settings)
   */
  getSummary(): {
    totalEvents: number;
    eventCounts: Record<string, number>;
    oldestEvent: string | null;
    newestEvent: string | null;
  } {
    const eventCounts: Record<string, number> = {};

    for (const e of this.state.events) {
      eventCounts[e.event] = (eventCounts[e.event] || 0) + 1;
    }

    return {
      totalEvents: this.state.events.length,
      eventCounts,
      oldestEvent: this.state.events[0]?.timestamp ?? null,
      newestEvent:
        this.state.events[this.state.events.length - 1]?.timestamp ?? null,
    };
  }

  /**
   * Clear all local analytics data
   */
  clearData(): void {
    this.state.events = [];
    this.saveState();
  }
}

// Singleton instance
export const analytics = new Analytics();

// Convenience function for React components
export function useAnalytics() {
  return {
    track: analytics.track.bind(analytics),
    isEnabled: analytics.isEnabled(),
    setEnabled: analytics.setEnabled.bind(analytics),
    getSummary: analytics.getSummary.bind(analytics),
    clearData: analytics.clearData.bind(analytics),
  };
}
