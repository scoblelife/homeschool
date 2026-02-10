import { useCallback } from "react";
import { Button } from "@/components/ui";

interface MapLinkProps {
  location: string;
  className?: string;
  showIcon?: boolean;
}

/**
 * Opens the location in Google Maps when clicked.
 * Falls back to Apple Maps on iOS devices.
 */
export function MapLink({
  location,
  className = "",
  showIcon = true,
}: MapLinkProps) {
  const handleClick = useCallback(() => {
    if (!location) return;

    // Encode the location for URL
    const encodedLocation = encodeURIComponent(location);

    // Use Google Maps URL - works on all platforms
    const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodedLocation}`;

    // Open in default browser via Electron's shell
    window.open(mapsUrl, "_blank");
  }, [location]);

  if (!location) return null;

  return (
    <Button
      onClick={handleClick}
      variant="ghost"
      size="sm"
      className={`inline-flex items-center gap-1 text-status-infoDark hover:text-status-infoDark hover:underline ${className}`}
      title={`Open "${location}" in Google Maps`}
    >
      {showIcon && <MapPinIcon className="w-4 h-4" />}
      <span>{location}</span>
    </Button>
  );
}

function MapPinIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
      />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
      />
    </svg>
  );
}

/**
 * Compact map icon button for use in card headers
 */
export function MapButton({ location }: { location: string }) {
  const handleClick = useCallback(() => {
    if (!location) return;
    const encodedLocation = encodeURIComponent(location);
    const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodedLocation}`;
    window.open(mapsUrl, "_blank");
  }, [location]);

  if (!location) return null;

  return (
    <Button
      onClick={handleClick}
      variant="ghost"
      size="sm"
      className="p-1.5 text-gray-500 hover:text-status-infoDark hover:bg-status-infoLight rounded"
      title={`View "${location}" on map`}
    >
      <MapPinIcon className="w-4 h-4" />
    </Button>
  );
}
