/**
 * Sponsored Resource Card Component
 *
 * Display card for sponsored resources with privacy-first click tracking
 * Only tracks clicks when user opens the resource (no impressions, no PII)
 */

import { sponsoredTracking } from "../../services/sponsoredTracking";
import type {
  SponsoredResource,
  SponsoredLocation,
} from "../../../../shared/types";

interface SponsoredResourceCardProps {
  resource: SponsoredResource;
  location: SponsoredLocation;
  compact?: boolean;
}

export function SponsoredResourceCard({
  resource,
  location,
  compact = false,
}: SponsoredResourceCardProps) {
  const handleClick = async () => {
    // Track anonymous click (no student ID, no PII)
    await sponsoredTracking.trackClick(resource.id, location);

    // Open sponsor URL in new tab
    window.open(resource.url, "_blank", "noopener,noreferrer");
  };

  return (
    <div
      className="bg-white rounded-lg shadow border border-gray-200 p-4 hover:shadow-md transition-shadow cursor-pointer"
      onClick={handleClick}
    >
      <div className="flex items-start gap-3">
        {resource.icon && <span className="text-3xl">{resource.icon}</span>}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h4 className="font-medium text-gray-900 truncate">
              {resource.name}
            </h4>
            {resource.pricingInfo &&
              resource.pricingInfo.toLowerCase().includes("free") && (
                <span className="text-xs bg-status-successLight text-status-success px-2 py-0.5 rounded">
                  FREE
                </span>
              )}
          </div>
          <p className="text-sm text-gray-600 line-clamp-2 mb-2">
            {resource.description}
          </p>
          {resource.pricingInfo &&
            !resource.pricingInfo.toLowerCase().includes("free") && (
              <p className="text-xs text-gray-500 mb-2">
                {resource.pricingInfo}
              </p>
            )}
          {!compact && resource.subjects.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {resource.subjects.slice(0, 2).map((subject) => (
                <span
                  key={subject}
                  className="text-xs bg-student-purple-100 text-student-purple-700 px-2 py-0.5 rounded"
                >
                  {subject}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
