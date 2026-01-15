import { useEffect, useState, useCallback } from "react";
import { format, parseISO, isFuture, isToday } from "date-fns";
import { Link } from "react-router-dom";
import { getStudentColor } from "./Settings";
import QuickAdd from "../components/QuickAdd";
import { VoiceInput } from "../features/voiceInput";
import { RecurringActivities } from "../features/recurring";
import { Timer } from "../features/timer";
import { StreakDisplay, useStreakTracking } from "../features/streaks";
import { SubjectBalance } from "../features/balance";
import { AchievementCard } from "../features/celebrations";
import {
  ActivitySuggestions,
  LearningPatterns,
  CompliancePrediction,
  ChatLogger,
} from "../features/aiInsights";
import {
  ErrorBoundary,
  WidgetErrorFallback,
} from "../components/ErrorBoundary";
import { ComplianceDeadlines } from "../components/ComplianceDeadlines";

import { Card } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { PageHeader } from "../components/layout/PageHeader";
import { PageContainer } from "../components/layout/PageContainer";

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
    const [sessions, activities, fieldTrips] = await Promise.all([
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
    setTodaySessions(sessions);
    setRecentActivities(activities.slice(0, 5));

    // Filter to only upcoming/today field trips that are planned
    const upcoming = fieldTrips
      .filter((trip) => {
        const tripDate = toDate(trip.date);
        return (
          (isFuture(tripDate) || isToday(tripDate)) && trip.status === "planned"
        );
      })
      .sort((a, b) => toDate(a.date).getTime() - toDate(b.date).getTime())
      .slice(0, 3);
    setUpcomingFieldTrips(upcoming);

    // Load suggested milestones if student selected
    if (selectedStudentId) {
      const suggested = await window.api.getSuggestedMilestones(
        selectedStudentId,
        5,
      );
      setSuggestedMilestones(suggested);
    } else {
      setSuggestedMilestones([]);
    }
  }, [selectedStudentId, today]);

  // Wrapper to handle activity creation + streak tracking
  const handleActivityCreated = useCallback(async () => {
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
      {/* Recurring Activities - Today's Schedule */}
      <RecurringActivities onActivityCreated={handleActivityCreated} />
      {/* Session Timer */}
      <div className="mb-6">
        <Timer onSessionSaved={handleActivityCreated} />
      </div>
      {/* Milestone Progress (when student selected) */}
      {selectedStudent && milestones.length > 0 && (
        <Card className="mb-6 bg-gradient-to-r from-fuchsia-50 to-purple-50 border-fuchsia-100">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                Learning Progress
              </h2>
              <p className="text-sm text-gray-500">
                {milestoneStats.completed} of {milestoneStats.total} milestones
                completed
              </p>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold text-fuchsia-600">
                {milestoneStats.percentage}%
              </div>
            </div>
          </div>
          <div className="w-full bg-white/50 rounded-full h-3 mb-4">
            <div
              className="bg-gradient-to-r from-fuchsia-500 to-purple-500 h-3 rounded-full transition-all duration-500"
              style={{ width: `${milestoneStats.percentage}%` }}
            />
          </div>
          <div className="grid grid-cols-3 gap-4 text-center text-sm">
            <div className="bg-white/60 rounded-lg p-2">
              <div className="text-xl font-bold text-green-600">
                {milestoneStats.completed}
              </div>
              <div className="text-gray-500 text-xs">Completed</div>
            </div>
            <div className="bg-white/60 rounded-lg p-2">
              <div className="text-xl font-bold text-amber-600">
                {milestoneStats.inProgress}
              </div>
              <div className="text-gray-500 text-xs">In Progress</div>
            </div>
            <div className="bg-white/60 rounded-lg p-2">
              <div className="text-xl font-bold text-gray-400">
                {milestoneStats.total -
                  milestoneStats.completed -
                  milestoneStats.inProgress}
              </div>
              <div className="text-gray-500 text-xs">Not Started</div>
            </div>
          </div>
        </Card>
      )}
      {/* Streak Display (when student selected) */}
      {selectedStudent && (
        <div className="mb-6">
          <ErrorBoundary fallback={<WidgetErrorFallback />}>
            <StreakDisplay
              studentId={selectedStudent.id}
              studentName={selectedStudent.name}
              studentColor={selectedStudent.color}
            />
          </ErrorBoundary>
        </div>
      )}
      {/* Subject Balance (when student selected) */}
      {selectedStudent && (
        <div className="mb-6">
          <ErrorBoundary fallback={<WidgetErrorFallback />}>
            <SubjectBalance
              studentId={selectedStudent.id}
              studentName={selectedStudent.name}
              subjects={subjects}
            />
          </ErrorBoundary>
        </div>
      )}
      {/* Achievements (when student selected) */}
      {selectedStudent && (
        <div className="mb-6">
          <ErrorBoundary fallback={<WidgetErrorFallback />}>
            <AchievementCard
              studentId={selectedStudent.id}
              studentName={selectedStudent.name}
            />
          </ErrorBoundary>
        </div>
      )}
      {/* AI Activity Suggestions (when student selected) */}
      {selectedStudent && (
        <div className="mb-6">
          <ErrorBoundary fallback={<WidgetErrorFallback />}>
            <ActivitySuggestions
              studentId={selectedStudent.id}
              studentName={selectedStudent.name}
              gradeLevel={selectedStudent.gradeLevel}
              subjects={subjects}
            />
          </ErrorBoundary>
        </div>
      )}
      {/* AI Learning Patterns (when student selected) */}
      {selectedStudent && (
        <div className="mb-6">
          <ErrorBoundary fallback={<WidgetErrorFallback />}>
            <LearningPatterns
              studentId={selectedStudent.id}
              studentName={selectedStudent.name}
              gradeLevel={selectedStudent.gradeLevel}
            />
          </ErrorBoundary>
        </div>
      )}
      {/* Compliance Prediction (when student selected) */}
      {selectedStudent && (
        <div className="mb-6">
          <ErrorBoundary fallback={<WidgetErrorFallback />}>
            <CompliancePrediction
              studentId={selectedStudent.id}
              studentName={selectedStudent.name}
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
      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card className="hover:shadow-md transition-shadow">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-xl">
              📚
            </div>
            <div>
              <div className="text-sm font-medium text-gray-500">
                Today's Sessions
              </div>
              <div className="text-2xl font-bold text-gray-900">
                {todaySessions.length}
              </div>
            </div>
          </div>
        </Card>
        <Card className="hover:shadow-md transition-shadow">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center text-xl">
              ✏️
            </div>
            <div>
              <div className="text-sm font-medium text-gray-500">
                Recent Activities
              </div>
              <div className="text-2xl font-bold text-gray-900">
                {recentActivities.length}
              </div>
            </div>
          </div>
        </Card>
        <Card className="hover:shadow-md transition-shadow">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center text-xl">
              🎯
            </div>
            <div>
              <div className="text-sm font-medium text-gray-500">Subjects</div>
              <div className="text-2xl font-bold text-gray-900">
                {subjects.length}
              </div>
            </div>
          </div>
        </Card>
      </div>
      {/* Upcoming Field Trips */}
      {upcomingFieldTrips.length > 0 && (
        <Card className="mb-8 bg-gradient-to-r from-amber-50 to-orange-50 border-amber-100">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <span>🚌</span> Upcoming Field Trips
            </h2>
            <Link
              to="/field-trips"
              className="text-sm text-amber-600 hover:text-amber-800"
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
                  className={`p-4 rounded-lg ${
                    isTripToday
                      ? "bg-amber-100 ring-2 ring-amber-400"
                      : "bg-white/60"
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="font-medium text-gray-900">
                        {trip.title}
                      </div>
                      <div className="text-sm text-gray-600 mt-1">
                        📍 {trip.location}
                      </div>
                      <div className="text-sm text-amber-700 mt-1 font-medium">
                        📅{" "}
                        {isTripToday
                          ? "Today!"
                          : format(tripDate, "EEEE, MMM d")}
                      </div>
                      <div className="mt-2 flex flex-wrap gap-1">
                        {tripStudents.map((s) => (
                          <span
                            key={s.id}
                            className="text-xs px-1.5 py-0.5 rounded bg-purple-100 text-purple-700"
                          >
                            {s.name}
                          </span>
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
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Today's Sessions */}
        <Card>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Today's Sessions
          </h2>
          {todaySessions.length === 0 ? (
            <p className="text-gray-500 text-sm">
              No sessions scheduled for today.
            </p>
          ) : (
            <ul className="space-y-3">
              {todaySessions.map((session) => {
                const student = getStudentById(session.studentId);
                const subject = getSubjectById(session.subjectId);
                return (
                  <li
                    key={session.id}
                    className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg"
                  >
                    <div
                      className={`w-2 h-2 rounded-full ${
                        getStudentColor(student?.color || "fuchsia").bg
                      }`}
                    />
                    <div className="flex-1">
                      <div className="font-medium text-gray-900">
                        {subject?.name}
                      </div>
                      <div className="text-sm text-gray-500">
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
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Recent Activities
          </h2>
          {recentActivities.length === 0 ? (
            <p className="text-gray-500 text-sm">No activities recorded yet.</p>
          ) : (
            <ul className="space-y-3">
              {recentActivities.map((activity) => {
                const student = getStudentById(activity.studentId);
                const subject = getSubjectById(activity.subjectId);
                return (
                  <li
                    key={activity.id}
                    className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg"
                  >
                    <div
                      className={`w-2 h-2 rounded-full ${
                        getStudentColor(student?.color || "fuchsia").bg
                      }`}
                    />
                    <div className="flex-1">
                      <div className="font-medium text-gray-900">
                        {activity.title}
                      </div>
                      <div className="text-sm text-gray-500">
                        {subject?.name} •{" "}
                        {activity.activityType.replace("_", " ")}
                      </div>
                    </div>
                    <div className="text-sm text-gray-400">
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
        <div className="mt-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">
              Focus This Week
            </h2>
            <Link
              to="/weekly-planner"
              className="text-sm text-fuchsia-600 hover:text-fuchsia-700"
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
                      ? "bg-amber-50 border-l-amber-500"
                      : "bg-white border-l-gray-300 border border-gray-200"
                  }`}
                >
                  <div className="flex items-start gap-2">
                    <span className="text-xs px-2 py-0.5 rounded-full bg-fuchsia-50 text-fuchsia-600">
                      {subject?.name}
                    </span>
                    {milestone.status === "in_progress" && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-600">
                        In Progress
                      </span>
                    )}
                  </div>
                  <h3 className="font-medium text-gray-900 mt-2 text-sm">
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
        <div className="mt-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Students</h2>
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
                  className={`card border-l-4 hover:shadow-md transition-shadow ${
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
                      <div className="font-semibold text-gray-900">
                        {student.name}
                      </div>
                      <div className="text-sm text-gray-500">
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
      {/* Quick Add FAB */}
      <QuickAdd onActivityCreated={handleActivityCreated} />
      {/* Voice Input FAB */}
      <VoiceInput onActivityCreated={handleActivityCreated} />
      {/* Chat Logger FAB */}
      <ChatLogger
        students={students}
        subjects={subjects}
        onActivitiesCreated={handleActivityCreated}
      />
    </PageContainer>
  );
}
