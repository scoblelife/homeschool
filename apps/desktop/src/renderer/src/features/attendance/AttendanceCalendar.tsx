import { useEffect, useMemo, useState } from "react";
import { useAttendanceStore, getMonthRange } from "./attendanceStore";
import type { AttendanceStatus, Student } from "../../../../shared/types";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";

// Simple chevron icons
function ChevronLeftIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
      aria-hidden="true"
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
    </svg>
  );
}

function ChevronRightIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
      aria-hidden="true"
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
    </svg>
  );
}

interface Props {
  students: Student[];
}

const STATUS_COLORS: Record<AttendanceStatus, string> = {
  present: "bg-status-success",
  absent: "bg-status-error",
  holiday: "bg-status-info",
};

const STATUS_LABELS: Record<AttendanceStatus, string> = {
  present: "Present",
  absent: "Absent",
  holiday: "Holiday",
};

const ALL_STATUSES: AttendanceStatus[] = ["present", "absent", "holiday"];

export function AttendanceCalendar({ students }: Props) {
  const {
    records,
    currentMonth,
    selectedStudentId,
    setCurrentMonth,
    setSelectedStudentId,
    loadAttendance,
    setAttendance,
    deleteAttendance,
    getRecord,
  } = useAttendanceStore();

  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [showStatusPicker, setShowStatusPicker] = useState(false);
  const [notes, setNotes] = useState("");

  // Auto-select first student if none selected
  useEffect(() => {
    if (!selectedStudentId && students.length > 0) {
      setSelectedStudentId(students[0].id);
    }
  }, [students, selectedStudentId, setSelectedStudentId]);

  // Load attendance when month or student changes
  useEffect(() => {
    if (selectedStudentId) {
      const { startDate, endDate } = getMonthRange(currentMonth);
      loadAttendance(selectedStudentId, startDate, endDate);
    }
  }, [selectedStudentId, currentMonth, loadAttendance]);

  const selectedStudent = students.find((s) => s.id === selectedStudentId);

  // Generate calendar days
  const calendarDays = useMemo(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();

    const firstDayOfMonth = new Date(year, month, 1);
    const lastDayOfMonth = new Date(year, month + 1, 0);

    const startDay = firstDayOfMonth.getDay(); // 0 = Sunday
    const daysInMonth = lastDayOfMonth.getDate();

    const days: Array<{ date: string; day: number; isCurrentMonth: boolean }> =
      [];

    // Previous month days
    const prevMonthLastDay = new Date(year, month, 0).getDate();
    for (let i = startDay - 1; i >= 0; i--) {
      const day = prevMonthLastDay - i;
      const prevMonth = month === 0 ? 11 : month - 1;
      const prevYear = month === 0 ? year - 1 : year;
      days.push({
        date: `${prevYear}-${String(prevMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`,
        day,
        isCurrentMonth: false,
      });
    }

    // Current month days
    for (let day = 1; day <= daysInMonth; day++) {
      days.push({
        date: `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`,
        day,
        isCurrentMonth: true,
      });
    }

    // Next month days to fill grid
    const remainingDays = 42 - days.length; // 6 rows x 7 days
    for (let day = 1; day <= remainingDays; day++) {
      const nextMonth = month === 11 ? 0 : month + 1;
      const nextYear = month === 11 ? year + 1 : year;
      days.push({
        date: `${nextYear}-${String(nextMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`,
        day,
        isCurrentMonth: false,
      });
    }

    return days;
  }, [currentMonth]);

  const handlePrevMonth = () => {
    setCurrentMonth(
      new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1),
    );
  };

  const handleNextMonth = () => {
    setCurrentMonth(
      new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1),
    );
  };

  const handleDayClick = (date: string) => {
    if (!selectedStudentId) return;

    const record = getRecord(selectedStudentId, date);
    setSelectedDate(date);
    setNotes(record?.notes || "");
    setShowStatusPicker(true);
  };

  const handleStatusSelect = async (status: AttendanceStatus) => {
    if (!selectedStudentId || !selectedDate) return;

    try {
      await setAttendance(
        selectedStudentId,
        selectedDate,
        status,
        notes || undefined,
      );
      setShowStatusPicker(false);
      setSelectedDate(null);
      setNotes("");
    } catch {
      // Error already logged in store
    }
  };

  const handleClearAttendance = async () => {
    if (!selectedStudentId || !selectedDate) return;

    try {
      await deleteAttendance(selectedStudentId, selectedDate);
      setShowStatusPicker(false);
      setSelectedDate(null);
      setNotes("");
    } catch {
      // Error already logged in store
    }
  };

  const today = new Date().toISOString().split("T")[0];

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
      {/* Student selector */}
      {students.length > 1 && (
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Student
          </label>
          <div className="flex gap-2">
            {students.map((student) => (
              // eslint-disable-next-line design-system/require-design-system-components -- dynamic student color styling
              <button
                key={student.id}
                onClick={() => setSelectedStudentId(student.id)}
                aria-pressed={selectedStudentId === student.id}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  selectedStudentId === student.id
                    ? `bg-${student.color}-100 text-${student.color}-700 dark:bg-${student.color}-900 dark:text-${student.color}-300 ring-2 ring-${student.color}-500`
                    : "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                }`}
                style={
                  selectedStudentId === student.id
                    ? {
                        backgroundColor: `var(--${student.color}-100, #f0f9ff)`,
                        color: `var(--${student.color}-700, #0369a1)`,
                        borderColor: `var(--${student.color}-500, #0ea5e9)`,
                      }
                    : {}
                }
              >
                {student.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Month navigation */}
      <div className="flex items-center justify-between mb-6">
        {/* eslint-disable-next-line design-system/require-design-system-components -- icon-only nav button */}
        <button
          onClick={handlePrevMonth}
          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
          aria-label="Previous month"
        >
          <ChevronLeftIcon className="w-5 h-5" />
        </button>

        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
          {currentMonth.toLocaleString("default", {
            month: "long",
            year: "numeric",
          })}
        </h2>

        {/* eslint-disable-next-line design-system/require-design-system-components -- icon-only nav button */}
        <button
          onClick={handleNextMonth}
          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
          aria-label="Next month"
        >
          <ChevronRightIcon className="w-5 h-5" />
        </button>
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-1">
        {/* Day headers */}
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
          <div
            key={day}
            className="text-center text-xs font-medium text-gray-500 dark:text-gray-400 py-2"
          >
            {day}
          </div>
        ))}

        {/* Calendar days */}
        {calendarDays.map(({ date, day, isCurrentMonth }) => {
          const record = selectedStudentId
            ? getRecord(selectedStudentId, date)
            : undefined;
          const isToday = date === today;
          const isWeekend =
            new Date(date).getDay() === 0 || new Date(date).getDay() === 6;

          return (
            <button
              key={date}
              onClick={() => isCurrentMonth && handleDayClick(date)}
              disabled={!isCurrentMonth}
              className={`
                relative aspect-square p-1 rounded-lg text-sm transition-colors
                ${
                  isCurrentMonth
                    ? "hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer"
                    : "text-gray-300 dark:text-gray-600 cursor-default"
                }
                ${isToday ? "ring-2 ring-blue-500" : ""}
                ${isWeekend && isCurrentMonth ? "bg-gray-50 dark:bg-gray-750" : ""}
              `}
            >
              <span
                className={`
                ${isCurrentMonth ? "text-gray-900 dark:text-white" : ""}
                ${isToday ? "font-bold" : ""}
              `}
              >
                {day}
              </span>

              {/* Status indicator */}
              {record && (
                <div
                  className={`absolute bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full ${STATUS_COLORS[record.status]}`}
                  title={STATUS_LABELS[record.status]}
                  aria-hidden="true"
                />
              )}
            </button>
          );
        })}
      </div>

      {/* Legend */}
      <div
        className="mt-6 flex flex-wrap gap-4 justify-center"
        aria-label="Attendance legend"
      >
        {ALL_STATUSES.map((status) => (
          <div key={status} className="flex items-center gap-2">
            <div
              className={`w-3 h-3 rounded-full ${STATUS_COLORS[status]}`}
              aria-hidden="true"
            />
            <span className="text-sm text-gray-600 dark:text-gray-400">
              {STATUS_LABELS[status]}
            </span>
          </div>
        ))}
      </div>

      {/* Status picker modal */}
      {showStatusPicker && selectedDate && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 max-w-sm w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              {new Date(selectedDate + "T12:00:00").toLocaleDateString(
                "default",
                {
                  weekday: "long",
                  month: "long",
                  day: "numeric",
                },
              )}
            </h3>

            {selectedStudent && (
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                Attendance for {selectedStudent.name}
              </p>
            )}

            <div className="space-y-2 mb-4">
              {ALL_STATUSES.map((status) => {
                const currentRecord = selectedStudentId
                  ? getRecord(selectedStudentId, selectedDate)
                  : undefined;
                const isSelected = currentRecord?.status === status;

                return (
                  <button
                    key={status}
                    onClick={() => handleStatusSelect(status)}
                    aria-pressed={currentRecord?.status === status}
                    className={`
                      w-full flex items-center gap-3 p-3 rounded-lg border transition-colors
                      ${
                        isSelected
                          ? "border-blue-500 bg-blue-50 dark:bg-blue-900/30"
                          : "border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700"
                      }
                    `}
                  >
                    <div
                      className={`w-4 h-4 rounded-full ${STATUS_COLORS[status]}`}
                      aria-hidden="true"
                    />
                    <span className="font-medium text-gray-900 dark:text-white">
                      {STATUS_LABELS[status]}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Notes input */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Notes (optional)
              </label>
              <Input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add a note..."
              />
            </div>

            <div className="flex gap-2">
              {selectedStudentId &&
                getRecord(selectedStudentId, selectedDate) && (
                  <Button
                    variant="danger"
                    onClick={handleClearAttendance}
                    className="flex-1"
                  >
                    Clear
                  </Button>
                )}
              <Button
                variant="secondary"
                onClick={() => {
                  setShowStatusPicker(false);
                  setSelectedDate(null);
                  setNotes("");
                }}
                className="flex-1"
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
