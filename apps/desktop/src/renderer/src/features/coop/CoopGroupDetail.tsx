import { useState, useEffect, useCallback } from "react";
import { Dialog } from "@headlessui/react";
import { format, parseISO, isFuture, isPast, isToday } from "date-fns";
import type {
  CoopGroup,
  CoopMember,
  CoopEvent,
  CoopSharingPreferences,
  UpdateCoopSharingPreferences,
} from "../../../../shared/types";
import { Button } from "../../components/ui/Button";
import { Input, Textarea, FormField } from "../../components/ui/Input";

interface CoopGroupDetailProps {
  group: CoopGroup;
  onBack: () => void;
  onGroupDeleted: () => void;
}

export function CoopGroupDetail({
  group,
  onBack,
  onGroupDeleted,
}: CoopGroupDetailProps) {
  const [members, setMembers] = useState<CoopMember[]>([]);
  const [events, setEvents] = useState<CoopEvent[]>([]);
  const [sharingPrefs, setSharingPrefs] =
    useState<CoopSharingPreferences | null>(null);
  const [activeTab, setActiveTab] = useState<"events" | "members" | "sharing">(
    "events",
  );
  const [showEventModal, setShowEventModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  // Event form state
  const [eventTitle, setEventTitle] = useState("");
  const [eventDescription, setEventDescription] = useState("");
  const [eventLocation, setEventLocation] = useState("");
  const [eventDate, setEventDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [eventStartTime, setEventStartTime] = useState("");
  const [eventEndTime, setEventEndTime] = useState("");
  const [eventMaxAttendees, setEventMaxAttendees] = useState("");

  const loadData = useCallback(async () => {
    try {
      const [membersData, eventsData, sharingData] = await Promise.all([
        window.api.getCoopMembers(group.id),
        window.api.getCoopEvents(group.id),
        window.api.getCoopSharingPreferences(group.id),
      ]);
      setMembers(membersData);
      setEvents(eventsData);
      setSharingPrefs(sharingData);
    } catch (error) {
      console.error("Failed to load group data:", error);
    }
  }, [group.id]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(group.inviteCode);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    } catch (error) {
      console.error("Failed to copy code:", error);
    }
  };

  const handleCreateEvent = async () => {
    if (!eventTitle.trim() || !eventLocation.trim() || !eventDate) return;

    // Find current user's member ID (first organizer or first member)
    const currentMember =
      members.find((m) => m.role === "organizer") || members[0];
    if (!currentMember) return;

    try {
      await window.api.createCoopEvent({
        groupId: group.id,
        title: eventTitle.trim(),
        description: eventDescription.trim() || undefined,
        location: eventLocation.trim(),
        date: eventDate,
        startTime: eventStartTime || undefined,
        endTime: eventEndTime || undefined,
        organizerId: currentMember.id,
        maxAttendees: eventMaxAttendees
          ? parseInt(eventMaxAttendees, 10)
          : undefined,
      });

      // Reset form
      setEventTitle("");
      setEventDescription("");
      setEventLocation("");
      setEventDate(format(new Date(), "yyyy-MM-dd"));
      setEventStartTime("");
      setEventEndTime("");
      setEventMaxAttendees("");
      setShowEventModal(false);
      await loadData();
    } catch (error) {
      console.error("Failed to create event:", error);
    }
  };

  const handleDeleteEvent = async (eventId: string) => {
    if (!confirm("Are you sure you want to delete this event?")) return;
    try {
      await window.api.deleteCoopEvent(eventId);
      await loadData();
    } catch (error) {
      console.error("Failed to delete event:", error);
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    if (!confirm("Are you sure you want to remove this member?")) return;
    try {
      await window.api.deleteCoopMember(memberId);
      await loadData();
    } catch (error) {
      console.error("Failed to remove member:", error);
    }
  };

  const handleDeleteGroup = async () => {
    try {
      await window.api.deleteCoopGroup(group.id);
      onGroupDeleted();
    } catch (error) {
      console.error("Failed to delete group:", error);
    }
  };

  const handleUpdateSharing = async (updates: UpdateCoopSharingPreferences) => {
    try {
      const updated = await window.api.updateCoopSharingPreferences(
        group.id,
        updates,
      );
      setSharingPrefs(updated);
    } catch (error) {
      console.error("Failed to update sharing preferences:", error);
    }
  };

  const upcomingEvents = events.filter(
    (e) => isFuture(parseISO(e.date)) || isToday(parseISO(e.date)),
  );
  const pastEvents = events.filter(
    (e) => isPast(parseISO(e.date)) && !isToday(parseISO(e.date)),
  );

  return (
    <div>
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onBack}
            leftIcon={<ChevronLeftIcon className="w-4 h-4" />}
            className="mb-2"
          >
            Back to Groups
          </Button>
          <h2 className="text-xl font-semibold text-neutral-text dark:text-white">
            {group.name}
          </h2>
          {group.description && (
            <p className="text-neutral-textSecondary dark:text-gray-400 mt-1">
              {group.description}
            </p>
          )}
        </div>

        {/* Invite Code */}
        <div className="text-right">
          <p className="text-xs text-neutral-textSecondary dark:text-gray-400 mb-1">
            Invite Code
          </p>
          <Button
            variant="ghost"
            onClick={handleCopyCode}
            aria-label={copiedCode ? "Invite code copied" : "Copy invite code"}
            className="flex items-center gap-2 px-3 py-1.5 bg-neutral-backgroundSecondary dark:bg-gray-700 rounded-lg hover:bg-neutral-border dark:hover:bg-gray-600 transition-colors"
          >
            <span className="font-mono text-lg tracking-widest text-neutral-text dark:text-white">
              {group.inviteCode}
            </span>
            {copiedCode ? (
              <CheckIcon className="w-4 h-4 text-status-success" />
            ) : (
              <CopyIcon className="w-4 h-4 text-neutral-textSecondary" />
            )}
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div
        className="flex gap-4 border-b border-neutral-border dark:border-gray-700 mb-6"
        role="tablist"
        aria-label="Group sections"
      >
        {}
        <button
          onClick={() => setActiveTab("events")}
          role="tab"
          aria-selected={activeTab === "events"}
          aria-controls="tabpanel-events"
          className={`pb-3 text-sm font-medium border-b-2 transition-colors ${
            activeTab === "events"
              ? "border-brand-primary text-brand-primaryDark"
              : "border-transparent text-neutral-textSecondary hover:text-neutral-text dark:text-gray-400 dark:hover:text-white"
          }`}
        >
          Events ({events.length})
        </button>
        {}
        <button
          onClick={() => setActiveTab("members")}
          role="tab"
          aria-selected={activeTab === "members"}
          aria-controls="tabpanel-members"
          className={`pb-3 text-sm font-medium border-b-2 transition-colors ${
            activeTab === "members"
              ? "border-brand-primary text-brand-primaryDark"
              : "border-transparent text-neutral-textSecondary hover:text-neutral-text dark:text-gray-400 dark:hover:text-white"
          }`}
        >
          Members ({members.length})
        </button>
        {}
        <button
          onClick={() => setActiveTab("sharing")}
          role="tab"
          aria-selected={activeTab === "sharing"}
          aria-controls="tabpanel-sharing"
          className={`pb-3 text-sm font-medium border-b-2 transition-colors ${
            activeTab === "sharing"
              ? "border-brand-primary text-brand-primaryDark"
              : "border-transparent text-neutral-textSecondary hover:text-neutral-text dark:text-gray-400 dark:hover:text-white"
          }`}
        >
          Sharing
        </button>
      </div>

      {/* Events Tab */}
      {activeTab === "events" && (
        <div id="tabpanel-events" role="tabpanel" aria-label="Events">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-medium text-neutral-text dark:text-white">
              Upcoming Events
            </h3>
            <Button
              variant="primary"
              size="sm"
              onClick={() => setShowEventModal(true)}
            >
              Add Event
            </Button>
          </div>

          {upcomingEvents.length === 0 ? (
            <div className="text-center py-8 bg-gray-50 dark:bg-gray-800 rounded-lg mb-6">
              <CalendarIcon className="w-10 h-10 text-gray-400 mx-auto mb-2" />
              <p className="text-gray-600 dark:text-gray-400">
                No upcoming events
              </p>
            </div>
          ) : (
            <div className="space-y-3 mb-6">
              {upcomingEvents.map((event) => (
                <EventCard
                  key={event.id}
                  event={event}
                  members={members}
                  onDelete={() => handleDeleteEvent(event.id)}
                />
              ))}
            </div>
          )}

          {pastEvents.length > 0 && (
            <>
              <h3 className="font-medium text-gray-900 dark:text-white mb-4">
                Past Events
              </h3>
              <div className="space-y-3 opacity-60">
                {pastEvents.slice(0, 5).map((event) => (
                  <EventCard
                    key={event.id}
                    event={event}
                    members={members}
                    onDelete={() => handleDeleteEvent(event.id)}
                    isPast
                  />
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {/* Members Tab */}
      {activeTab === "members" && (
        <div id="tabpanel-members" role="tabpanel" aria-label="Members">
          <div className="space-y-3">
            {members.map((member) => (
              <div
                key={member.id}
                className="flex items-center justify-between bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`p-2 rounded-full ${member.role === "organizer" ? "bg-status-warningLight dark:bg-amber-900/30" : "bg-neutral-backgroundSecondary dark:bg-gray-700"}`}
                  >
                    <UserIcon
                      className={`w-5 h-5 ${member.role === "organizer" ? "text-status-warningDark" : "text-neutral-textSecondary"}`}
                    />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {member.familyName}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400 capitalize">
                      {member.role}
                    </p>
                  </div>
                </div>
                {member.role !== "organizer" && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemoveMember(member.id)}
                    className="text-neutral-textTertiary hover:text-status-error transition-colors p-1"
                    aria-label={`Remove ${member.familyName}`}
                    title="Remove member"
                  >
                    <XIcon className="w-5 h-5" />
                  </Button>
                )}
              </div>
            ))}
          </div>

          <div className="mt-8 pt-6 border-t border-neutral-border dark:border-gray-700">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowDeleteConfirm(true)}
              className="text-status-error hover:text-status-errorDark"
            >
              Delete Group
            </Button>
          </div>
        </div>
      )}

      {/* Sharing Tab */}
      {activeTab === "sharing" && (
        <div id="tabpanel-sharing" role="tabpanel" aria-label="Sharing">
          <div className="bg-status-infoLight border border-status-info/20 rounded-lg p-4 mb-6">
            <div className="flex items-start gap-3">
              <ShieldIcon className="w-5 h-5 text-status-info mt-0.5" />
              <div>
                <h4 className="font-medium text-status-infoDark">
                  Privacy-First Sharing
                </h4>
                <p className="text-sm text-neutral-textSecondary mt-1">
                  Choose what to share with your co-op group. All data is shared
                  via encrypted peer-to-peer connections - it never touches our
                  servers.
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <SharingToggle
              label="Events & Field Trips"
              description="Share co-op events and field trip plans with group members"
              enabled={sharingPrefs?.shareEvents ?? true}
              onChange={(enabled) =>
                handleUpdateSharing({ shareEvents: enabled })
              }
            />
            <SharingToggle
              label="Resources"
              description="Share educational resources and links you've collected"
              enabled={sharingPrefs?.shareResources ?? false}
              onChange={(enabled) =>
                handleUpdateSharing({ shareResources: enabled })
              }
            />
            <SharingToggle
              label="Reading Lists"
              description="Share book recommendations and reading lists"
              enabled={sharingPrefs?.shareReadingLists ?? false}
              onChange={(enabled) =>
                handleUpdateSharing({ shareReadingLists: enabled })
              }
            />
            <SharingToggle
              label="Curriculum Packages"
              description="Share which curriculum packages your family uses"
              enabled={sharingPrefs?.sharePackages ?? false}
              onChange={(enabled) =>
                handleUpdateSharing({ sharePackages: enabled })
              }
            />
          </div>

          <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <h4 className="font-medium text-gray-900 dark:text-white mb-2">
              What's shared vs. what's private
            </h4>
            <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
              <li className="flex items-center gap-2">
                <span className="text-status-success">✓</span> Shared: Selected
                data types above
              </li>
              <li className="flex items-center gap-2">
                <span className="text-status-error">✗</span> Never shared:
                Student grades, activity logs, personal notes
              </li>
              <li className="flex items-center gap-2">
                <span className="text-status-error">✗</span> Never shared: Hours
                tracking, compliance records
              </li>
            </ul>
          </div>
        </div>
      )}

      {/* Create Event Modal */}
      <Dialog
        open={showEventModal}
        onClose={() => setShowEventModal(false)}
        className="relative z-50"
      >
        <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <Dialog.Panel className="mx-auto max-w-md w-full bg-white dark:bg-gray-800 rounded-xl shadow-xl p-6">
            <Dialog.Title className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Create Event
            </Dialog.Title>

            <div className="space-y-4">
              <FormField label="Event Title" required>
                <Input
                  type="text"
                  value={eventTitle}
                  onChange={(e) => setEventTitle(e.target.value)}
                  placeholder="e.g., Park Day at Oak Grove"
                />
              </FormField>

              <FormField label="Location" required>
                <Input
                  type="text"
                  value={eventLocation}
                  onChange={(e) => setEventLocation(e.target.value)}
                  placeholder="e.g., Oak Grove Park, 123 Main St"
                />
              </FormField>

              <div className="grid grid-cols-2 gap-4">
                <FormField label="Date" required>
                  <Input
                    type="date"
                    value={eventDate}
                    onChange={(e) => setEventDate(e.target.value)}
                  />
                </FormField>
                <FormField label="Max Attendees">
                  <Input
                    type="number"
                    value={eventMaxAttendees}
                    onChange={(e) => setEventMaxAttendees(e.target.value)}
                    placeholder="Optional"
                    min="1"
                  />
                </FormField>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField label="Start Time">
                  <Input
                    type="time"
                    value={eventStartTime}
                    onChange={(e) => setEventStartTime(e.target.value)}
                  />
                </FormField>
                <FormField label="End Time">
                  <Input
                    type="time"
                    value={eventEndTime}
                    onChange={(e) => setEventEndTime(e.target.value)}
                  />
                </FormField>
              </div>

              <FormField label="Description">
                <Textarea
                  value={eventDescription}
                  onChange={(e) => setEventDescription(e.target.value)}
                  placeholder="Add details about the event..."
                  rows={3}
                />
              </FormField>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <Button
                variant="secondary"
                onClick={() => setShowEventModal(false)}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={handleCreateEvent}
                disabled={
                  !eventTitle.trim() || !eventLocation.trim() || !eventDate
                }
              >
                Create Event
              </Button>
            </div>
          </Dialog.Panel>
        </div>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog
        open={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        className="relative z-50"
      >
        <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <Dialog.Panel className="mx-auto max-w-sm w-full bg-white dark:bg-gray-800 rounded-xl shadow-xl p-6">
            <Dialog.Title className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Delete Group?
            </Dialog.Title>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              This will permanently delete the group, all members, and all
              events. This action cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <Button
                variant="secondary"
                onClick={() => setShowDeleteConfirm(false)}
              >
                Cancel
              </Button>
              <Button variant="danger" onClick={handleDeleteGroup}>
                Delete Group
              </Button>
            </div>
          </Dialog.Panel>
        </div>
      </Dialog>
    </div>
  );
}

// Event Card Component
function EventCard({
  event,
  members,
  onDelete,
  isPast = false,
}: {
  event: CoopEvent;
  members: CoopMember[];
  onDelete: () => void;
  isPast?: boolean;
}) {
  const organizer = members.find((m) => m.id === event.organizerId);

  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <h4 className="font-medium text-gray-900 dark:text-white truncate">
            {event.title}
          </h4>
          <div className="flex items-center gap-3 mt-1 text-sm text-gray-600 dark:text-gray-400">
            <span>{format(parseISO(event.date), "EEEE, MMM d")}</span>
            {event.startTime && (
              <>
                <span>-</span>
                <span>
                  {event.startTime}
                  {event.endTime ? ` - ${event.endTime}` : ""}
                </span>
              </>
            )}
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            {event.location}
          </p>
          {organizer && (
            <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
              Organized by {organizer.familyName}
            </p>
          )}
        </div>
        {!isPast && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onDelete}
            className="text-neutral-textTertiary hover:text-status-error transition-colors p-1"
            aria-label={`Delete event: ${event.title}`}
            title="Delete event"
          >
            <TrashIcon className="w-4 h-4" />
          </Button>
        )}
      </div>
    </div>
  );
}

// Icons
function ChevronLeftIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M15 19l-7-7 7-7"
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
      aria-hidden="true"
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

function CopyIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
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
      aria-hidden="true"
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

function UserIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
      />
    </svg>
  );
}

function XIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M6 18L18 6M6 6l12 12"
      />
    </svg>
  );
}

function TrashIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
      />
    </svg>
  );
}

function ShieldIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
      />
    </svg>
  );
}

// Sharing Toggle Component
function SharingToggle({
  label,
  description,
  enabled,
  onChange,
}: {
  label: string;
  description: string;
  enabled: boolean;
  onChange: (enabled: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
      <div className="flex-1 mr-4">
        <h4 className="font-medium text-gray-900 dark:text-white">{label}</h4>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {description}
        </p>
      </div>
      {}
      <button
        onClick={() => onChange(!enabled)}
        role="switch"
        aria-checked={enabled}
        aria-label={label}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
          enabled ? "bg-brand-primary" : "bg-neutral-border dark:bg-gray-600"
        }`}
      >
        <span
          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
            enabled ? "translate-x-6" : "translate-x-1"
          }`}
        />
      </button>
    </div>
  );
}
