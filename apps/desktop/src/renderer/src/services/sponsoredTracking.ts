/**
 * Privacy-First Sponsored Content Tracking
 *
 * Only tracks anonymous clicks - NO impressions, NO conversions, NO student IDs
 * All tracking is local to the app's DuckDB database
 */

import type { SponsoredLocation } from "../../../shared/types";

export class SponsoredTracking {
  /**
   * Track anonymous click when user opens a sponsored resource
   *
   * @param resourceId - ID of the sponsored resource
   * @param location - Where in the app the click occurred
   */
  async trackClick(
    resourceId: string,
    location: SponsoredLocation,
  ): Promise<void> {
    try {
      await window.api.trackSponsoredClick({
        sponsoredResourceId: resourceId,
        location,
      });
    } catch (error) {
      // Fail silently - don't block user action if tracking fails
      console.error("Failed to track sponsored click:", error);
    }
  }
}

// Export singleton instance
export const sponsoredTracking = new SponsoredTracking();
