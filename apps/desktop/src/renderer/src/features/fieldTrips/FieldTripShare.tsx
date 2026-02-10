import { useState, useCallback, useMemo } from "react";
import { Dialog } from "@headlessui/react";
import { format, parseISO } from "date-fns";
import { Button } from "@/components/ui";
import type { FieldTrip } from "../../../../shared/types";

// Simplified types for sharing - only need id and name
interface SimpleStudent {
  id: string;
  name: string;
}

interface SimpleSubject {
  id: string;
  name: string;
}

interface FieldTripShareProps {
  trip: FieldTrip;
  students: SimpleStudent[];
  subjects: SimpleSubject[];
  isOpen: boolean;
  onClose: () => void;
}

type ShareFormat = "text" | "ics" | "email";

export function FieldTripShare({
  trip,
  students,
  subjects,
  isOpen,
  onClose,
}: FieldTripShareProps) {
  const [copied, setCopied] = useState(false);
  const [_shareFormat, _setShareFormat] = useState<ShareFormat>("text");

  const tripStudents = useMemo(
    () => students.filter((s) => trip.studentIds.includes(s.id)),
    [students, trip.studentIds],
  );

  const tripSubjects = useMemo(
    () => subjects.filter((s) => trip.subjectIds.includes(s.id)),
    [subjects, trip.subjectIds],
  );

  // Generate plain text summary
  const textSummary = useMemo(() => {
    const lines: string[] = [];
    lines.push(`${trip.title}`);
    lines.push("");
    lines.push(`Date: ${format(parseISO(trip.date), "EEEE, MMMM d, yyyy")}`);
    if (trip.startTime) {
      lines.push(
        `Time: ${trip.startTime}${trip.endTime ? ` - ${trip.endTime}` : ""}`,
      );
    }
    lines.push(`Location: ${trip.location}`);
    if (trip.websiteUrl) {
      lines.push(`Website: ${trip.websiteUrl}`);
    }
    if (trip.cost) {
      lines.push(`Cost: $${trip.cost.toFixed(2)}`);
    }
    if (tripStudents.length > 0) {
      lines.push(`Students: ${tripStudents.map((s) => s.name).join(", ")}`);
    }
    if (tripSubjects.length > 0) {
      lines.push(`Subjects: ${tripSubjects.map((s) => s.name).join(", ")}`);
    }
    if (trip.description) {
      lines.push("");
      lines.push(`Description:`);
      lines.push(trip.description);
    }
    if (trip.learningOutcomes) {
      lines.push("");
      lines.push(`Learning Outcomes:`);
      lines.push(trip.learningOutcomes);
    }
    if (trip.notes) {
      lines.push("");
      lines.push(`Notes:`);
      lines.push(trip.notes);
    }
    return lines.join("\n");
  }, [trip, tripStudents, tripSubjects]);

  // Generate ICS calendar file content
  const icsContent = useMemo(() => {
    const startDate = parseISO(trip.date);
    const formatDate = (d: Date) => format(d, "yyyyMMdd");
    const formatDateTime = (dateStr: string, timeStr: string) => {
      const [hours, minutes] = timeStr.split(":").map(Number);
      const date = parseISO(dateStr);
      date.setHours(hours, minutes, 0, 0);
      return format(date, "yyyyMMdd'T'HHmmss");
    };

    const lines: string[] = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//Homeschool App//Field Trip//EN",
      "BEGIN:VEVENT",
      `UID:${trip.id}@homeschool-app`,
    ];

    if (trip.startTime) {
      lines.push(`DTSTART:${formatDateTime(trip.date, trip.startTime)}`);
      if (trip.endTime) {
        lines.push(`DTEND:${formatDateTime(trip.date, trip.endTime)}`);
      }
    } else {
      lines.push(`DTSTART;VALUE=DATE:${formatDate(startDate)}`);
    }

    lines.push(`SUMMARY:${trip.title.replace(/[,;\\]/g, "\\$&")}`);
    lines.push(`LOCATION:${trip.location.replace(/[,;\\]/g, "\\$&")}`);

    const description = [
      trip.description,
      trip.learningOutcomes
        ? `Learning Outcomes: ${trip.learningOutcomes}`
        : null,
      trip.cost ? `Cost: $${trip.cost.toFixed(2)}` : null,
      trip.websiteUrl ? `Website: ${trip.websiteUrl}` : null,
    ]
      .filter(Boolean)
      .join("\\n\\n")
      .replace(/[,;\\]/g, "\\$&");

    if (description) {
      lines.push(`DESCRIPTION:${description}`);
    }

    if (trip.websiteUrl) {
      lines.push(`URL:${trip.websiteUrl}`);
    }

    lines.push("END:VEVENT", "END:VCALENDAR");

    return lines.join("\r\n");
  }, [trip]);

  // Generate mailto link for email sharing
  const emailLink = useMemo(() => {
    const subject = encodeURIComponent(`Field Trip: ${trip.title}`);
    const body = encodeURIComponent(textSummary);
    return `mailto:?subject=${subject}&body=${body}`;
  }, [trip.title, textSummary]);

  // Generate Google Maps link
  const mapsLink = useMemo(() => {
    const encodedLocation = encodeURIComponent(trip.location);
    return `https://www.google.com/maps/search/?api=1&query=${encodedLocation}`;
  }, [trip.location]);

  const handleCopyText = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(textSummary);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy text:", err);
    }
  }, [textSummary]);

  const handleDownloadICS = useCallback(() => {
    const blob = new Blob([icsContent], {
      type: "text/calendar;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${trip.title.replace(/[^a-z0-9]/gi, "_")}.ics`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, [icsContent, trip.title]);

  const handleEmailShare = useCallback(() => {
    window.location.href = emailLink;
  }, [emailLink]);

  return (
    <Dialog open={isOpen} onClose={onClose} className="relative z-50">
      <div className="fixed inset-0 bg-black/30" aria-hidden="true" />

      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="mx-auto max-w-lg w-full bg-white dark:bg-gray-800 rounded-xl shadow-xl">
          <div className="p-6">
            <Dialog.Title className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Share Field Trip
            </Dialog.Title>

            {/* Quick Actions */}
            <div className="grid grid-cols-3 gap-3 mb-6">
              <Button
                onClick={handleCopyText}
                variant="ghost"
                className="flex flex-col items-center gap-2 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600"
              >
                {copied ? (
                  <CheckIcon className="w-6 h-6 text-status-successDark" />
                ) : (
                  <ClipboardIcon className="w-6 h-6 text-gray-600 dark:text-gray-300" />
                )}
                <span className="text-sm text-gray-700 dark:text-gray-200">
                  {copied ? "Copied!" : "Copy Text"}
                </span>
              </Button>

              <Button
                onClick={handleDownloadICS}
                variant="ghost"
                className="flex flex-col items-center gap-2 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600"
              >
                <CalendarIcon className="w-6 h-6 text-gray-600 dark:text-gray-300" />
                <span className="text-sm text-gray-700 dark:text-gray-200">
                  Calendar
                </span>
              </Button>

              <Button
                onClick={handleEmailShare}
                variant="ghost"
                className="flex flex-col items-center gap-2 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600"
              >
                <EmailIcon className="w-6 h-6 text-gray-600 dark:text-gray-300" />
                <span className="text-sm text-gray-700 dark:text-gray-200">
                  Email
                </span>
              </Button>
            </div>

            {/* Preview */}
            <div className="mb-4">
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Preview
              </h4>
              <pre className="text-xs bg-gray-50 dark:bg-gray-700 p-3 rounded-lg overflow-auto max-h-48 whitespace-pre-wrap text-gray-700 dark:text-gray-200">
                {textSummary}
              </pre>
            </div>

            {/* Map Link */}
            <div className="mb-6">
              <a
                href={mapsLink}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-status-infoDark hover:text-status-infoDark text-sm"
              >
                <MapIcon className="w-4 h-4" />
                View location on Google Maps
              </a>
            </div>

            {/* Close button */}
            <div className="flex justify-end">
              <Button onClick={onClose} variant="secondary">
                Close
              </Button>
            </div>
          </div>
        </Dialog.Panel>
      </div>
    </Dialog>
  );
}

// Icons
function ClipboardIcon({ className }: { className?: string }) {
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
        d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3"
      />
    </svg>
  );
}

function CheckIcon({ className }: { className?: string }) {
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
        d="M5 13l4 4L19 7"
      />
    </svg>
  );
}

function CalendarIcon({ className }: { className?: string }) {
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
        d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
      />
    </svg>
  );
}

function EmailIcon({ className }: { className?: string }) {
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
        d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
      />
    </svg>
  );
}

function MapIcon({ className }: { className?: string }) {
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
        d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"
      />
    </svg>
  );
}

// Share button component for use in field trip cards
interface ShareButtonProps {
  trip: FieldTrip;
  students: SimpleStudent[];
  subjects: SimpleSubject[];
}

export function ShareButton({ trip, students, subjects }: ShareButtonProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <Button
        onClick={() => setIsOpen(true)}
        variant="ghost"
        size="sm"
        className="p-1.5 text-gray-500 hover:text-status-infoDark hover:bg-status-infoLight rounded"
        title="Share field trip"
      >
        <ShareIcon className="w-4 h-4" />
      </Button>

      <FieldTripShare
        trip={trip}
        students={students}
        subjects={subjects}
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
      />
    </>
  );
}

function ShareIcon({ className }: { className?: string }) {
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
        d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
      />
    </svg>
  );
}
