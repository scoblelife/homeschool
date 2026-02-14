import { useState, useEffect, type ReactNode } from "react";
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  addMonths,
  subMonths,
  startOfWeek,
  endOfWeek,
  isWithinInterval,
  parseISO,
} from "date-fns";
import {
  PenLine,
  Clapperboard,
  BookOpen,
  PencilLine,
  Palette,
  Gamepad2,
  Bus,
  TreePine,
  Dice5,
  HandMetal,
  GraduationCap,
  Calendar as CalendarIcon,
  MapPin,
  ExternalLink,
} from "lucide-react";
import { useStore } from "../stores/useStore";
import type {
  Session,
  Activity,
  CreateActivity,
  ActivityType,
  CalendarBusyEvent,
  FieldTrip,
} from "../../../shared/types";

import { validateApiArray } from "../services/validateApiResponse";
import { Button } from "../components/ui/Button";
import { Input, Textarea } from "../components/ui/Input";
import { Card } from "../components/ui/Card";
import { Modal } from "../components/ui/Modal";
import { PageHeader } from "../components/layout/PageHeader";
import { PageContainer } from "../components/layout/PageContainer";

const activityTypes: { value: ActivityType; label: string; icon: ReactNode }[] =
  [
    { value: "worksheet", label: "Worksheet", icon: <PenLine size={16} /> },
    { value: "video", label: "Video", icon: <Clapperboard size={16} /> },
    { value: "reading", label: "Reading", icon: <BookOpen size={16} /> },
    { value: "writing", label: "Writing", icon: <PencilLine size={16} /> },
    { value: "hands_on", label: "Hands-on", icon: <Palette size={16} /> },
    {
      value: "interactive",
      label: "Interactive",
      icon: <Gamepad2 size={16} />,
    },
  ];

// Colors for field trip activity types
const fieldTripTypeColors: Record<
  string,
  { bg: string; text: string; textDark: string; dot: string; icon: ReactNode }
> = {
  field_trip: {
    bg: "bg-status-warningLight",
    text: "text-status-warning",
    textDark: "text-status-warning",
    dot: "bg-status-warning",
    icon: <Bus size={14} />,
  },
  park_day: {
    bg: "bg-status-successLight",
    text: "text-status-success",
    textDark: "text-status-successDark",
    dot: "bg-status-success",
    icon: <TreePine size={14} />,
  },
  game_night: {
    bg: "bg-student-purple-50",
    text: "text-student-purple-600",
    textDark: "text-student-purple-700",
    dot: "bg-student-purple-500",
    icon: <Dice5 size={14} />,
  },
  playdate: {
    bg: "bg-student-fuchsia-50",
    text: "text-student-fuchsia-600",
    textDark: "text-student-fuchsia-700",
    dot: "bg-student-fuchsia-500",
    icon: <HandMetal size={14} />,
  },
  coop_class: {
    bg: "bg-student-blue-50",
    text: "text-student-blue-600",
    textDark: "text-student-blue-700",
    dot: "bg-student-blue-500",
    icon: <GraduationCap size={14} />,
  },
  custom: {
    bg: "bg-neutral-background",
    text: "text-neutral-textSecondary",
    textDark: "text-neutral-text",
    dot: "bg-neutral-textSecondary",
    icon: <CalendarIcon size={14} />,
  },
};

function getFieldTripColors(activityType: string | undefined) {
  return (
    fieldTripTypeColors[activityType || "field_trip"] ||
    fieldTripTypeColors.field_trip
  );
}

// Load persisted date from localStorage or default to today
function getInitialSelectedDate(): Date {
  const stored = localStorage.getItem("calendar-selected-date");
  if (stored) {
    const parsed = parseISO(stored);
    if (!isNaN(parsed.getTime())) {
      return parsed;
    }
  }
  return new Date();
}

function getInitialMonth(): Date {
  const stored = localStorage.getItem("calendar-selected-date");
  if (stored) {
    const parsed = parseISO(stored);
    if (!isNaN(parsed.getTime())) {
      return startOfMonth(parsed);
    }
  }
  return new Date();
}

export default function Calendar(): JSX.Element {
  const {
    students,
    subjects,
    selectedStudentId,
    getStudentById,
    getSubjectById,
  } = useStore();
  const [currentMonth, setCurrentMonth] = useState(getInitialMonth);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [fieldTrips, setFieldTrips] = useState<FieldTrip[]>([]);
  const [busyEvents, setBusyEvents] = useState<CalendarBusyEvent[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date>(
    getInitialSelectedDate,
  );
  const [showAddActivity, setShowAddActivity] = useState(false);
  const [formData, setFormData] = useState<Partial<CreateActivity>>({
    studentId: "",
    subjectId: "",
    activityType: "worksheet",
    title: "",
    dateCompleted: "",
    durationMinutes: null,
    notes: "",
  });

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const calendarStart = startOfWeek(monthStart);
  const calendarEnd = endOfWeek(monthEnd);
  const calendarDays = eachDayOfInterval({
    start: calendarStart,
    end: calendarEnd,
  });

  // Handle date selection with persistence
  const handleSelectDate = (date: Date) => {
    setSelectedDate(date);
    localStorage.setItem("calendar-selected-date", format(date, "yyyy-MM-dd"));
  };

  // Go to today
  const goToToday = () => {
    const today = new Date();
    setCurrentMonth(today);
    handleSelectDate(today);
  };

  useEffect(() => {
    async function loadMonthData(): Promise<void> {
      try {
        const startDate = format(calendarStart, "yyyy-MM-dd");
        const endDate = format(calendarEnd, "yyyy-MM-dd");

        const [sessionsRaw, activitiesRaw, fieldTripsRaw] = await Promise.all([
          window.api.getSessions({
            studentId: selectedStudentId || undefined,
            startDate,
            endDate,
          }),
          window.api.getActivities({
            studentId: selectedStudentId || undefined,
            startDate,
            endDate,
          }),
          window.api.getFieldTrips(
            selectedStudentId ? { studentId: selectedStudentId } : undefined,
          ),
        ]);

        const sessionsData = validateApiArray<Session>(sessionsRaw, "Calendar");
        const activitiesData = validateApiArray<Activity>(
          activitiesRaw,
          "Calendar",
        );
        const fieldTripsData = validateApiArray<FieldTrip>(
          fieldTripsRaw,
          "Calendar",
        );
        setSessions(sessionsData);
        setActivities(activitiesData);
        // Filter field trips to only show ones in the current date range
        const filteredTrips = fieldTripsData.filter((trip) => {
          return trip.date >= startDate && trip.date <= endDate;
        });
        setFieldTrips(filteredTrips);

        // Fetch calendar events from iCal feeds
        const selectedStudent = selectedStudentId
          ? getStudentById(selectedStudentId)
          : null;
        if (selectedStudent?.calendarFeedUrl) {
          const eventsRaw = await window.api.fetchCalendarEvents(
            selectedStudent.calendarFeedUrl,
            startDate,
            endDate,
          );
          const events = validateApiArray<CalendarBusyEvent>(
            eventsRaw,
            "Calendar",
          );
          setBusyEvents(events);
        } else {
          setBusyEvents([]);
        }
      } catch (error) {
        console.error("[Calendar] Failed to load month data:", error);
      }
    }
    loadMonthData();
  }, [
    currentMonth,
    selectedStudentId,
    calendarStart,
    calendarEnd,
    getStudentById,
  ]);

  const getEventsForDay = (date: Date) => {
    const dateStr = format(date, "yyyy-MM-dd");
    const daySessions = sessions.filter((s) => s.date === dateStr);
    const dayActivities = activities.filter((a) => a.dateCompleted === dateStr);
    const dayFieldTrips = fieldTrips.filter((t) => t.date === dateStr);
    return {
      sessions: daySessions,
      activities: dayActivities,
      fieldTrips: dayFieldTrips,
    };
  };

  const getBusyEventsForDay = (date: Date): CalendarBusyEvent[] => {
    return busyEvents.filter((event) => {
      const eventStart = parseISO(event.start);
      const eventEnd = parseISO(event.end);
      // Check if date falls within event range (inclusive)
      return (
        isWithinInterval(date, { start: eventStart, end: eventEnd }) ||
        isSameDay(date, eventStart) ||
        isSameDay(date, eventEnd)
      );
    });
  };

  const selectedDayEvents = getEventsForDay(selectedDate);
  const selectedDayBusy = getBusyEventsForDay(selectedDate);

  const openAddActivity = () => {
    setFormData({
      studentId: selectedStudentId || "",
      subjectId: "",
      activityType: "worksheet",
      title: "",
      dateCompleted: format(selectedDate, "yyyy-MM-dd"),
      durationMinutes: null,
      notes: "",
    });
    setShowAddActivity(true);
  };

  const handleSubmitActivity = async (e: React.FormEvent) => {
    e.preventDefault();
    if (
      !formData.studentId ||
      !formData.subjectId ||
      !formData.title ||
      !formData.dateCompleted
    )
      return;

    try {
      const newActivity = await window.api.createActivity({
        studentId: formData.studentId,
        subjectId: formData.subjectId,
        sessionId: null,
        activityType: formData.activityType || "worksheet",
        title: formData.title,
        description: "",
        dateCompleted: formData.dateCompleted,
        durationMinutes: formData.durationMinutes || null,
        grade: null,
        maxGrade: null,
        notes: formData.notes || "",
      });

      setActivities([...activities, newActivity]);
      setShowAddActivity(false);
    } catch (error) {
      console.error("[Calendar] Failed to create activity:", error);
    }
  };

  const handleDeleteActivity = async (id: string) => {
    try {
      await window.api.deleteActivity(id);
      setActivities(activities.filter((a) => a.id !== id));
    } catch (error) {
      console.error(`[Calendar] Failed to delete activity ${id}:`, error);
    }
  };

  return (
    <PageContainer>
      <PageHeader
        title="Calendar"
        action={
          <div className="flex items-center gap-4">
            <Button
              variant="secondary"
              onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
              aria-label="Previous month"
            >
              ← Prev
            </Button>
            <span className="text-lg font-semibold">
              {format(currentMonth, "MMMM yyyy")}
            </span>
            <Button
              variant="secondary"
              onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
              aria-label="Next month"
            >
              Next →
            </Button>
            <Button variant="primary" onClick={goToToday}>
              Today
            </Button>
          </div>
        }
      />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Calendar Grid */}
        <div className="lg:col-span-2">
          <Card>
            {/* Day headers */}
            <div className="grid grid-cols-7 mb-2">
              {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
                <div
                  key={day}
                  className="text-center text-sm font-medium text-neutral-textSecondary py-2"
                >
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar days */}
            <div
              className="grid grid-cols-7 gap-1"
              role="grid"
              aria-label={`Calendar for ${format(currentMonth, "MMMM yyyy")}`}
            >
              {calendarDays.map((day) => {
                const events = getEventsForDay(day);
                const dayBusy = getBusyEventsForDay(day);
                const hasEvents =
                  events.sessions.length > 0 ||
                  events.activities.length > 0 ||
                  events.fieldTrips.length > 0;
                const hasFieldTrip = events.fieldTrips.length > 0;
                const isBusy = dayBusy.length > 0;
                const isCurrentMonth = isSameMonth(day, currentMonth);
                const isSelected = selectedDate && isSameDay(day, selectedDate);
                const isToday = isSameDay(day, new Date());
                // Get the first field trip's color for background (if multiple, show first)
                const firstTripColors = hasFieldTrip
                  ? getFieldTripColors(events.fieldTrips[0].activityType)
                  : null;

                return (
                  <button
                    key={day.toISOString()}
                    onClick={() => handleSelectDate(day)}
                    aria-label={format(day, "EEEE, MMMM d, yyyy")}
                    aria-selected={!!isSelected}
                    aria-current={isToday ? "date" : undefined}
                    className={`aspect-square p-2 rounded-lg text-left transition-colors ${
                      !isCurrentMonth
                        ? "text-neutral-textTertiary"
                        : "text-neutral-text"
                    } ${isSelected ? "bg-brand-primaryLight ring-2 ring-brand-primary" : "hover:bg-neutral-background"} ${
                      isToday && !isSelected ? "bg-status-warningLight" : ""
                    } ${hasFieldTrip && isCurrentMonth && !isSelected ? firstTripColors?.bg : ""} ${
                      isBusy && isCurrentMonth && !isSelected && !hasFieldTrip
                        ? "bg-status-errorLight"
                        : ""
                    }`}
                  >
                    <div
                      className={`text-sm font-medium ${isToday ? "text-brand-primary" : ""} ${hasFieldTrip && isCurrentMonth ? firstTripColors?.text : ""} ${isBusy && isCurrentMonth && !hasFieldTrip ? "text-status-error" : ""}`}
                    >
                      {format(day, "d")}
                    </div>
                    {(hasEvents || isBusy) && isCurrentMonth && (
                      <div className="mt-1 flex gap-1 flex-wrap">
                        {isBusy && (
                          <div
                            className="w-2 h-2 rounded-full bg-status-error"
                            title="Busy"
                          />
                        )}
                        {events.fieldTrips.map((trip) => {
                          const colors = getFieldTripColors(trip.activityType);
                          return (
                            <div
                              key={trip.id}
                              className={`w-2 h-2 rounded-full ${colors.dot}`}
                              title={trip.title}
                            />
                          );
                        })}
                        {events.activities.length > 0 && (
                          <div
                            className="w-2 h-2 rounded-full bg-status-success"
                            title="Activities"
                          />
                        )}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Legend */}
            {/* eslint-disable-next-line design-system/pages-use-components-only -- calendar legend layout */}
            <div className="mt-4 flex flex-wrap gap-4 text-sm text-neutral-textSecondary">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-status-successLight0" />
                <span>Activities</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-status-warning" />
                <span className="flex items-center gap-1">
                  <Bus size={12} /> Field Trip
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-status-successLight0" />
                <span className="flex items-center gap-1">
                  <TreePine size={12} /> Park Day
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-student-purple-500" />
                <span className="flex items-center gap-1">
                  <Dice5 size={12} /> Game Night
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-student-fuchsia-500" />
                <span className="flex items-center gap-1">
                  <HandMetal size={12} /> Playdate
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-student-blue-500" />
                <span className="flex items-center gap-1">
                  <GraduationCap size={12} /> Co-op
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-status-error" />
                <span>Busy (External)</span>
              </div>
            </div>
          </Card>
        </div>

        {/* Selected Day Details */}
        <Card aria-live="polite">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-neutral-text">
              {format(selectedDate, "EEEE, MMMM d")}
            </h2>
            <Button
              variant="primary"
              onClick={openAddActivity}
              className="text-sm"
            >
              + Log Activity
            </Button>
          </div>

          <div className="space-y-6">
            {/* Field Trips / Activities */}
            {selectedDayEvents.fieldTrips.length > 0 && (
              <div>
                <h3 className="text-sm font-medium text-neutral-textSecondary mb-2">
                  Events ({selectedDayEvents.fieldTrips.length})
                </h3>
                <ul className="space-y-2">
                  {selectedDayEvents.fieldTrips.map((trip) => {
                    const tripStudents = students.filter((s) =>
                      trip.studentIds.includes(s.id),
                    );
                    const colors = getFieldTripColors(trip.activityType);
                    return (
                      <li
                        key={trip.id}
                        className={`p-2 ${colors.bg} rounded-lg text-sm`}
                      >
                        <div
                          className={`font-medium ${colors.textDark} flex items-center gap-2`}
                        >
                          <span>{colors.icon}</span>
                          {trip.title}
                          <span
                            className={`text-xs px-1.5 py-0.5 rounded ${
                              trip.status === "completed"
                                ? "bg-status-successLight text-status-success"
                                : trip.status === "cancelled"
                                  ? "bg-neutral-backgroundDeep text-neutral-textSecondary"
                                  : "bg-student-blue-100 text-student-blue-700"
                            }`}
                          >
                            {trip.status}
                          </span>
                        </div>
                        <div
                          className={`${colors.text} mt-1 flex items-center gap-1`}
                        >
                          <MapPin size={12} /> {trip.location}
                        </div>
                        <div className="text-neutral-textSecondary mt-1">
                          {tripStudents.map((s) => s.name).join(", ")}
                        </div>
                        {trip.websiteUrl && (
                          <a
                            href={trip.websiteUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-student-blue-600 hover:underline mt-1"
                          >
                            <ExternalLink size={12} className="flex-shrink-0" />{" "}
                            Website
                          </a>
                        )}
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}

            {/* Busy Events */}
            {selectedDayBusy.length > 0 && (
              <div>
                <h3 className="text-sm font-medium text-status-error mb-2">
                  Busy ({selectedDayBusy.length})
                </h3>
                <ul className="space-y-2">
                  {selectedDayBusy.map((event, idx) => (
                    <li
                      key={idx}
                      className="p-2 bg-status-errorLight rounded-lg text-sm"
                    >
                      <div className="font-medium text-status-errorDark">
                        {event.summary || "Busy"}
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Activities */}
            <div>
              <h3 className="text-sm font-medium text-neutral-textSecondary mb-2">
                Activities ({selectedDayEvents.activities.length})
              </h3>
              {selectedDayEvents.activities.length === 0 ? (
                <p className="text-sm text-neutral-textTertiary">
                  No activities logged
                </p>
              ) : (
                <ul className="space-y-2">
                  {selectedDayEvents.activities.map((activity) => {
                    const student = getStudentById(activity.studentId);
                    const typeInfo = activityTypes.find(
                      (t) => t.value === activity.activityType,
                    );
                    return (
                      <li
                        key={activity.id}
                        className="p-2 bg-status-successLight rounded-lg flex items-start justify-between"
                      >
                        <div>
                          <div className="font-medium text-neutral-text flex items-center gap-2">
                            <span>{typeInfo?.icon}</span>
                            {activity.title}
                          </div>
                          <div className="text-sm text-neutral-textSecondary">
                            {student?.name} • {typeInfo?.label}
                            {activity.durationMinutes &&
                              ` • ${activity.durationMinutes} min`}
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteActivity(activity.id)}
                          className="text-status-error hover:text-status-error text-sm"
                          aria-label={`Delete activity ${activity.title}`}
                        >
                          ×
                        </Button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </div>
        </Card>
      </div>
      {/* Add Activity Modal */}
      <Modal
        open={showAddActivity}
        onClose={() => setShowAddActivity(false)}
        title={`Log Activity - ${format(selectedDate, "MMM d, yyyy")}`}
        size="md"
      >
        <form onSubmit={handleSubmitActivity} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-neutral-text mb-1">
              Activity Type
            </label>
            <div
              className="grid grid-cols-4 gap-2"
              role="radiogroup"
              aria-label="Activity type"
            >
              {activityTypes.map((type) => (
                <button
                  key={type.value}
                  type="button"
                  role="radio"
                  aria-checked={formData.activityType === type.value}
                  onClick={() =>
                    setFormData({ ...formData, activityType: type.value })
                  }
                  className={`p-2 rounded-lg text-center transition-colors ${
                    formData.activityType === type.value
                      ? "bg-brand-primaryLight ring-2 ring-brand-primary"
                      : "bg-neutral-background hover:bg-neutral-backgroundDeep"
                  }`}
                >
                  <div className="text-xl">{type.icon}</div>
                  <div className="text-xs mt-1">{type.label}</div>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-text mb-1">
              Student
            </label>
            <select
              value={formData.studentId}
              onChange={(e) =>
                setFormData({ ...formData, studentId: e.target.value })
              }
              className="block w-full px-3 py-2 border border-neutral-border rounded-lg shadow-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-brand-primary text-sm hover:border-neutral-border"
              required
            >
              <option value="">Select student...</option>
              {students.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-text mb-1">
              Subject
            </label>
            <select
              value={formData.subjectId}
              onChange={(e) =>
                setFormData({ ...formData, subjectId: e.target.value })
              }
              className="block w-full px-3 py-2 border border-neutral-border rounded-lg shadow-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-brand-primary text-sm hover:border-neutral-border"
              required
            >
              <option value="">Select subject...</option>
              {subjects.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-text mb-1">
              Title
            </label>
            <Input
              type="text"
              value={formData.title}
              onChange={(e) =>
                setFormData({ ...formData, title: e.target.value })
              }
              placeholder="e.g., Math worksheet Chapter 5"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-text mb-1">
              Duration (minutes)
            </label>
            <Input
              type="number"
              value={formData.durationMinutes || ""}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  durationMinutes: e.target.value
                    ? parseInt(e.target.value)
                    : null,
                })
              }
              min="1"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-text mb-1">
              Notes
            </label>
            <Textarea
              value={formData.notes}
              onChange={(e) =>
                setFormData({ ...formData, notes: e.target.value })
              }
              rows={2}
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button
              variant="secondary"
              type="button"
              onClick={() => setShowAddActivity(false)}
            >
              Cancel
            </Button>
            <Button variant="primary" type="submit">
              Log Activity
            </Button>
          </div>
        </form>
      </Modal>
    </PageContainer>
  );
}
