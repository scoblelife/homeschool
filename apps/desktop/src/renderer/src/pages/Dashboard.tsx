import { useEffect, useState, useCallback } from "react";
import { format, parseISO, isFuture, isToday } from "date-fns";
import { Link } from "react-router-dom";
import { BookOpen, Pencil, Target, Bus } from "lucide-react";
import { getStudentColor } from "../utils/studentColors";
import QuickAdd from "../components/QuickAdd";
import { RecurringActivities } from "../features/recurring";
import { Timer } from "../features/timer";
import { StreakDisplay, useStreakTracking } from "../features/streaks";
import { CompliancePrediction } from "../features/aiInsights";
import {
  ErrorBoundary,
  WidgetErrorFallback,
} from "../components/ErrorBoundary";
import { ComplianceDeadlines } from "../components/ComplianceDeadlines";
import { validateApiArray } from "../services/validateApiResponse";

import { Card } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { Badge } from "../components/ui/Badge";
import { PageHeader } from "../components/layout/PageHeader";
import { PageContainer } from "../components/layout/PageContainer";
import { IconBadge } from "../components/dashboard/IconBadge";
import { ProgressBar } from "../components/dashboard/ProgressBar";

// Helper to handle dates that might be Date objects or strings from DuckDB
const toDate = (date: string | Date): Date => {
  if (date instanceof Date) return date;
  return parseISO(date);
};
import { useStore } from "../stores/useStore";
import { useMilestones } from "../hooks/useDatabase";
import type {
  Activity,
  Session,
  Milestone,
  FieldTrip,
} from "../../../shared/types";

export default function Dashboard(): JSX.Element {
  const {
    students,
    subjects,
    selectedStudentId,
    getStudentById,
    getSubjectById,
  } = useStore();
  const { milestones } = useMilestones(selectedStudentId ?? undefined);
  const [todaySessions, setTodaySessions] = useState<Session[]>([]);
  const [recentActivities, setRecentActivities] = useState<Activity[]>([]);
  const [suggestedMilestones, setSuggestedMilestones] = useState<Milestone[]>(
    [],
  );
  const [upcomingFieldTrips, setUpcomingFieldTrips] = useState<FieldTrip[]>([]);

  // Streak tracking
  const { recordActivity } = useStreakTracking(students);

  const today = format(new Date(), "yyyy-MM-dd");

  const loadDashboardData = useCallback(async (): Promise<void> => {
    try {
      const [sessionsRaw, activitiesRaw, fieldTripsRaw] = await Promise.all([
        window.api.getSessions({
          studentId: selectedStudentId || undefined,
          startDate: today,
          endDate: today,
        }),
        window.api.getActivities({
          studentId: selectedStudentId || undefined,
        }),
        window.api.getFieldTrips(
          selectedStudentId ? { studentId: selectedStudentId } : undefined,
        ),
      ]);
      const sessions = validateApiArray<Session>(sessionsRaw, "Dashboard");
      const activities = validateApiArray<Activity>(activitiesRaw, "Dashboard");
      const fieldTrips = validateApiArray<FieldTrip>(
        fieldTripsRaw,
        "Dashboard",
      );
      setTodaySessions(sessions);
      setRecentActivities(activities.slice(0, 5));

      // Filter to only upcoming/today field trips that are not started or in progress
      const upcoming = fieldTrips
        .filter((trip) => {
          const tripDate = toDate(trip.date);
          return (
            (isFuture(tripDate) || isToday(tripDate)) &&
            (trip.status === "not_started" || trip.status === "in_progress")
          );
        })
        .sort((a, b) => toDate(a.date).getTime() - toDate(b.date).getTime())
        .slice(0, 3);
      setUpcomingFieldTrips(upcoming);

      // Load suggested milestones if student selected
      if (selectedStudentId) {
        const suggestedRaw = await window.api.getSuggestedMilestones(
          selectedStudentId,
          5,
        );
        const suggested = validateApiArray<Milestone>(
          suggestedRaw,
          "Dashboard",
        );
        setSuggestedMilestones(suggested);
      } else {
        setSuggestedMilestones([]);
      }
    } catch (error) {
      console.error("[Dashboard] Failed to load dashboard data:", error);
    }
  }, [selectedStudentId, today]);

  // Wrapper to handle activity creation + streak tracking
  const handleActivityCreated = useCallback(async () => {
    try {
      // First load fresh data
      await loadDashboardData();
      // Then update streaks for any today's activities
      const todayActivities = await window.api.getActivities({
        startDate: today,
        endDate: today,
      });
      todayActivities.forEach((activity) => {
        recordActivity(activity.studentId, activity.dateCompleted);
      });
    } catch (error) {
      console.error("[Dashboard] Failed to handle activity created:", error);
    }
  }, [loadDashboardData, today, recordActivity]);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  const selectedStudent = selectedStudentId
    ? getStudentById(selectedStudentId)
    : null;

  // Calculate milestone stats
  const milestoneStats = {
    total: milestones.length,
    completed: milestones.filter((m) => m.status === "completed").length,
    inProgress: milestones.filter((m) => m.status === "in_progress").length,
    percentage:
      milestones.length > 0
        ? Math.round(
            (milestones.filter((m) => m.status === "completed").length /
              milestones.length) *
              100,
          )
        : 0,
  };

  return (
    <PageContainer>
      <PageHeader
        title={
          selectedStudent ? `${selectedStudent.name}'s Dashboard` : "Dashboard"
        }
        subtitle={format(new Date(), "EEEE, MMMM d, yyyy")}
        action={
          <div className="flex gap-3">
            <Link to="/log">
              <Button variant="secondary">+ Log Activity</Button>
            </Link>
            <Link to="/weekly-planner">
              <Button variant="primary">Weekly Plan</Button>
            </Link>
          </div>
        }
      />

      {/* ═══ ACTION ZONE ═══ */}

      {/* Recurring Activities - Today's Schedule */}
      <RecurringActivities onActivityCreated={handleActivityCreated} />

      {/* Session Timer */}
      <div className="mb-6">
        <Timer onSessionSaved={handleActivityCreated} />
      </div>

      {/* ═══ SNAPSHOT ═══ */}

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <Card
          className="hover:shadow-md transition-shadow"
          aria-label={`${todaySessions.length} sessions today`}
        >
          <div className="flex items-center gap-3">
            <IconBadge
              icon={<BookOpen className="w-5 h-5 text-student-blue-600" />}
              variant="blue"
            />
            <div>
              <div className="text-sm font-medium text-neutral-textSecondary">
                Today's Sessions
              </div>
              <div className="text-2xl font-bold text-neutral-text">
                {todaySessions.length}
              </div>
            </div>
          </div>
        </Card>
        <Card
          className="hover:shadow-md transition-shadow"
          aria-label={`${recentActivities.length} recent activities`}
        >
          <div className="flex items-center gap-3">
            <IconBadge
              icon={<Pencil className="w-5 h-5 text-status-success" />}
              variant="success"
            />
            <div>
              <div className="text-sm font-medium text-neutral-textSecondary">
                Recent Activities
              </div>
              <div className="text-2xl font-bold text-neutral-text">
                {recentActivities.length}
              </div>
            </div>
          </div>
        </Card>
        <Card
          className="hover:shadow-md transition-shadow"
          aria-label={`${subjects.length} subjects`}
        >
          <div className="flex items-center gap-3">
            <IconBadge
              icon={<Target className="w-5 h-5 text-student-purple-600" />}
              variant="purple"
            />
            <div>
              <div className="text-sm font-medium text-neutral-textSecondary">
                Subjects
              </div>
              <div className="text-2xl font-bold text-neutral-text">
                {subjects.length}
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Compliance + Streak row */}
      {selectedStudent && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <ErrorBoundary fallback={<WidgetErrorFallback />}>
            <CompliancePrediction
              studentId={selectedStudent.id}
              studentName={selectedStudent.name}
            />
          </ErrorBoundary>
          <ErrorBoundary fallback={<WidgetErrorFallback />}>
            <StreakDisplay
              studentId={selectedStudent.id}
              studentName={selectedStudent.name}
              studentColor={selectedStudent.color}
            />
          </ErrorBoundary>
        </div>
      )}

      {/* Compliance Deadlines */}
      <div className="mb-6">
        <ErrorBoundary fallback={<WidgetErrorFallback />}>
          <ComplianceDeadlines compact />
        </ErrorBoundary>
      </div>

      {/* Milestone Progress (when student selected) */}
      {selectedStudent && milestones.length > 0 && (
        <Card className="mb-6 bg-gradient-to-r from-brand-primaryLight to-student-purple-50 border-brand-primaryLight">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="text-lg font-semibold text-neutral-text">
                Learning Progress
              </h2>
              <p className="text-sm text-neutral-textSecondary">
                {milestoneStats.completed} of {milestoneStats.total} milestones
                completed
              </p>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold text-brand-primary">
                {milestoneStats.percentage}%
              </div>
            </div>
          </div>
          <div className="mb-4">
            <ProgressBar percentage={milestoneStats.percentage} />
          </div>
          <div className="grid grid-cols-3 gap-4 text-center text-sm">
            <div
              className="bg-white/60 rounded-lg p-2"
              aria-label={`${milestoneStats.completed} milestones completed`}
            >
              <div className="text-xl font-bold text-status-success">
                {milestoneStats.completed}
              </div>
              <div className="text-neutral-textSecondary text-xs">
                Completed
              </div>
            </div>
            <div
              className="bg-white/60 rounded-lg p-2"
              aria-label={`${milestoneStats.inProgress} milestones in progress`}
            >
              <div className="text-xl font-bold text-status-warning">
                {milestoneStats.inProgress}
              </div>
              <div className="text-neutral-textSecondary text-xs">
                In Progress
              </div>
            </div>
            <div
              className="bg-white/60 rounded-lg p-2"
              aria-label={`${milestoneStats.total - milestoneStats.completed - milestoneStats.inProgress} milestones not started`}
            >
              <div className="text-xl font-bold text-neutral-textTertiary">
                {milestoneStats.total -
                  milestoneStats.completed -
                  milestoneStats.inProgress}
              </div>
              <div className="text-neutral-textSecondary text-xs">
                Not Started
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* ═══ DETAILS ═══ */}

      {/* Upcoming Field Trips */}
      {upcomingFieldTrips.length > 0 && (
        <Card className="mb-6 bg-gradient-to-r from-status-warningLight to-student-orange-50 border-status-warningLight">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-neutral-text flex items-center gap-2">
              <Bus className="w-5 h-5" /> Upcoming Field Trips
            </h2>
            <Link
              to="/field-trips"
              className="text-sm text-status-warning hover:text-status-warningDark"
            >
              View All →
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {upcomingFieldTrips.map((trip) => {
              const tripDate = toDate(trip.date);
              const tripStudents = students.filter((s) =>
                trip.studentIds.includes(s.id),
              );
              const isTripToday = isToday(tripDate);
              return (
                <div
                  key={trip.id}
                  className={`p-4 rounded-lg transition-colors ${
                    isTripToday
                      ? "bg-status-warningLight ring-2 ring-status-warning hover:bg-status-warningLight/80"
                      : "bg-white/60 hover:bg-white/80"
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="font-medium text-neutral-text">
                        {trip.title}
                      </div>
                      <div className="text-sm text-neutral-textSecondary mt-1">
                        📍 {trip.location}
                      </div>
                      <div className="text-sm text-status-warning mt-1 font-medium">
                        📅{" "}
                        {isTripToday
                          ? "Today!"
                          : format(tripDate, "EEEE, MMM d")}
                      </div>
                      <div className="mt-2 flex flex-wrap gap-1">
                        {tripStudents.map((s) => (
                          <Badge
                            key={s.id}
                            size="sm"
                            className="bg-student-purple-100 text-student-purple-700"
                          >
                            {s.name}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Today's Sessions */}
        <Card>
          <h2 className="text-lg font-semibold text-neutral-text mb-4">
            Today's Sessions
          </h2>
          {todaySessions.length === 0 ? (
            <p className="text-neutral-textSecondary text-sm">
              No sessions scheduled for today.
            </p>
          ) : (
            <ul className="space-y-3" aria-live="polite">
              {todaySessions.map((session) => {
                const student = getStudentById(session.studentId);
                const subject = getSubjectById(session.subjectId);
                return (
                  <li
                    key={session.id}
                    className="flex items-center gap-3 p-3 bg-neutral-background rounded-lg hover:bg-neutral-backgroundDeep transition-colors"
                  >
                    <div
                      className={`w-2 h-2 rounded-full ${
                        getStudentColor(student?.color || "fuchsia").bg
                      }`}
                    />
                    <div className="flex-1">
                      <div className="font-medium text-neutral-text">
                        {subject?.name}
                      </div>
                      <div className="text-sm text-neutral-textSecondary">
                        {student?.name}
                        {session.startTime && ` • ${session.startTime}`}
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </Card>

        {/* Recent Activities */}
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-neutral-text">
              Recent Activities
            </h2>
            <Link
              to="/log"
              className="text-sm text-brand-primary hover:text-brand-primaryDark"
            >
              View All →
            </Link>
          </div>
          {recentActivities.length === 0 ? (
            <p className="text-neutral-textSecondary text-sm">
              No activities recorded yet.
            </p>
          ) : (
            <ul className="space-y-3" aria-live="polite">
              {recentActivities.map((activity) => {
                const student = getStudentById(activity.studentId);
                const subject = getSubjectById(activity.subjectId);
                return (
                  <li
                    key={activity.id}
                    className="flex items-center gap-3 p-3 bg-neutral-background rounded-lg hover:bg-neutral-backgroundDeep transition-colors"
                  >
                    <div
                      className={`w-2 h-2 rounded-full ${
                        getStudentColor(student?.color || "fuchsia").bg
                      }`}
                    />
                    <div className="flex-1">
                      <div className="font-medium text-neutral-text">
                        {activity.title}
                      </div>
                      <div className="text-sm text-neutral-textSecondary">
                        {subject?.name} •{" "}
                        {activity.activityType.replace("_", " ")}
                      </div>
                    </div>
                    <div className="text-sm text-neutral-textTertiary">
                      {format(parseISO(activity.dateCompleted), "MMM d")}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </Card>
      </div>

      {/* Focus This Week - Suggested Milestones */}
      {selectedStudent && suggestedMilestones.length > 0 && (
        <div className="mt-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-neutral-text">
              Focus This Week
            </h2>
            <Link
              to="/weekly-planner"
              className="text-sm text-brand-primary hover:text-brand-primaryDark"
            >
              View Full Plan →
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {suggestedMilestones.slice(0, 6).map((milestone) => {
              const subject = getSubjectById(milestone.subjectId);
              return (
                <div
                  key={milestone.id}
                  className={`p-4 rounded-lg border-l-4 ${
                    milestone.status === "in_progress"
                      ? "bg-status-warningLight border-l-status-warning"
                      : "bg-white border-l-neutral-border border border-neutral-border"
                  }`}
                >
                  <div className="flex items-start gap-2">
                    <Badge
                      size="sm"
                      className="rounded-full bg-brand-primaryLight text-brand-primary"
                    >
                      {subject?.name}
                    </Badge>
                    {milestone.status === "in_progress" && (
                      <Badge
                        size="sm"
                        variant="warning"
                        className="rounded-full"
                      >
                        In Progress
                      </Badge>
                    )}
                  </div>
                  <h3 className="font-medium text-neutral-text mt-2 text-sm">
                    {milestone.title}
                  </h3>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Students Overview (if no student selected) */}
      {!selectedStudentId && students.length > 0 && (
        <div className="mt-6">
          <h2 className="text-lg font-semibold text-neutral-text mb-4">
            Students
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {students.map((student) => {
              const gradeLabels: Record<string, string> = {
                "pre-k": "Pre-K",
                "1st": "1st Grade",
                "2nd": "2nd Grade",
                "3rd": "3rd Grade",
                "4th": "4th Grade",
                "5th": "5th Grade",
              };
              return (
                <div
                  key={student.id}
                  className={`bg-white rounded-xl border border-neutral-border shadow-sm p-6 border-l-4 hover:shadow-md transition-shadow ${
                    getStudentColor(student.color).border
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div
                      className={`w-12 h-12 rounded-full flex items-center justify-center text-white text-lg font-bold ${
                        getStudentColor(student.color).bg
                      }`}
                    >
                      {student.name.charAt(0)}
                    </div>
                    <div>
                      <div className="font-semibold text-neutral-text">
                        {student.name}
                      </div>
                      <div className="text-sm text-neutral-textSecondary">
                        {gradeLabels[student.gradeLevel] || student.gradeLevel}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Single Quick Add FAB */}
      <QuickAdd onActivityCreated={handleActivityCreated} />
    </PageContainer>
  );
}
