import { useState, useEffect } from "react";
import { useStore } from "../stores/useStore";
import {
  StandardsList,
  CoverageReport,
  ActivityStandardsModal,
  CurriculumPackages,
} from "../features/curriculum";
import type {
  Activity,
  GradeLevel,
  LearningStandard,
} from "../../../shared/types";

import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { Card } from "../components/ui/Card";
import { PageHeader } from "../components/layout/PageHeader";
import { PageContainer } from "../components/layout/PageContainer";

type TabType = "packages" | "coverage" | "standards" | "custom";

export default function Curriculum(): JSX.Element {
  const { students, selectedStudentId, getSelectedStudent } = useStore();
  const [activeTab, setActiveTab] = useState<TabType>("coverage");
  const [recentActivities, setRecentActivities] = useState<Activity[]>([]);
  const [selectedActivity, setSelectedActivity] = useState<Activity | null>(
    null,
  );
  const [isModalOpen, setIsModalOpen] = useState(false);

  const selectedStudent = getSelectedStudent();

  // Load recent activities for mapping
  useEffect(() => {
    if (selectedStudentId) {
      const endDate = new Date().toISOString().split("T")[0];
      const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split("T")[0];

      window.api
        .getActivities({
          studentId: selectedStudentId,
          startDate,
          endDate,
        })
        .then(setRecentActivities)
        .catch((error) => {
          console.error(
            "[Curriculum] Failed to load recent activities:",
            error,
          );
        });
    }
  }, [selectedStudentId]);

  const tabs: { id: TabType; label: string }[] = [
    { id: "packages", label: "Packages" },
    { id: "coverage", label: "Coverage Report" },
    { id: "standards", label: "Browse Standards" },
    { id: "custom", label: "Map Activities" },
  ];

  const openMappingModal = (activity: Activity) => {
    setSelectedActivity(activity);
    setIsModalOpen(true);
  };

  return (
    <PageContainer>
      <PageHeader
        title="Curriculum Mapping"
        subtitle="Map activities to learning standards and track coverage"
      />
      {/* Tabs */}
      <div className="border-b border-neutral-border mb-6">
        <nav
          className="-mb-px flex gap-6"
          role="tablist"
          aria-label="Curriculum sections"
        >
          {tabs.map((tab) => (
            <Button
              key={tab.id}
              variant="ghost"
              onClick={() => setActiveTab(tab.id)}
              role="tab"
              aria-selected={activeTab === tab.id}
              className={`py-3 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === tab.id
                  ? "border-brand-primary text-brand-primary"
                  : "border-transparent text-neutral-textSecondary hover:text-neutral-text hover:border-neutral-border"
              }`}
            >
              {tab.label}
            </Button>
          ))}
        </nav>
      </div>
      {/* Tab Content */}
      {activeTab === "packages" && (
        <div
          className="bg-neutral-surface rounded-lg shadow p-6"
          role="tabpanel"
          aria-label="Packages"
        >
          <CurriculumPackages />
        </div>
      )}
      {activeTab !== "packages" && !selectedStudentId ? (
        <Card className="text-center py-12">
          <p className="text-gray-500">
            Select a student from the sidebar to view curriculum mapping.
          </p>
        </Card>
      ) : (
        <>
          {activeTab === "coverage" && selectedStudent && selectedStudentId && (
            <CoverageReport
              studentId={selectedStudentId}
              gradeLevel={selectedStudent.gradeLevel as GradeLevel}
            />
          )}

          {activeTab === "standards" && selectedStudent && (
            <div
              className="bg-neutral-surface rounded-lg shadow p-6"
              role="tabpanel"
              aria-label="Browse Standards"
            >
              <StandardsList
                gradeLevel={selectedStudent.gradeLevel as GradeLevel}
              />
            </div>
          )}

          {activeTab === "custom" && selectedStudent && (
            <div
              className="space-y-6"
              role="tabpanel"
              aria-label="Map Activities"
            >
              {/* Instructions */}
              <div
                className={`bg-student-blue-50 border border-student-blue-200 rounded-lg p-4`}
              >
                <p className="text-sm text-student-blue-700">
                  Select an activity from the list below to map it to learning
                  standards. This helps track which standards are being covered
                  by your curriculum.
                </p>
              </div>

              {/* Recent Activities */}
              <div className="bg-neutral-surface rounded-lg shadow">
                <div className="px-6 py-4 border-b border-neutral-border">
                  <h3 className="text-lg font-semibold text-neutral-text">
                    Recent Activities
                  </h3>
                  <p className="text-sm text-neutral-textSecondary">
                    Last 30 days - click to map standards
                  </p>
                </div>

                <div
                  className="divide-y divide-neutral-border max-h-96 overflow-y-auto"
                  aria-live="polite"
                >
                  {recentActivities.length === 0 ? (
                    <div className="px-6 py-8 text-center text-gray-500">
                      No recent activities found.
                    </div>
                  ) : (
                    recentActivities.map((activity) => (
                      <ActivityRow
                        key={activity.id}
                        activity={activity}
                        onClick={() => openMappingModal(activity)}
                      />
                    ))
                  )}
                </div>
              </div>
            </div>
          )}
        </>
      )}
      {/* Standards Mapping Modal */}
      {selectedActivity && selectedStudent && (
        <ActivityStandardsModal
          activity={selectedActivity}
          student={selectedStudent}
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setSelectedActivity(null);
          }}
        />
      )}
    </PageContainer>
  );
}

// Activity row component
function ActivityRow({
  activity,
  onClick,
}: {
  activity: Activity;
  onClick: () => void;
}) {
  const [standardCount, setStandardCount] = useState(0);

  useEffect(() => {
    window.api
      .getActivityStandards(activity.id)
      .then((standards) => {
        setStandardCount(standards.length);
      })
      .catch((error) => {
        console.error("[Curriculum] Failed to load activity standards:", error);
      });
  }, [activity.id]);

  return (
    <Button
      variant="ghost"
      onClick={onClick}
      className={`w-full px-6 py-4 flex items-center justify-between hover:bg-neutral-backgroundDeep transition-colors text-left`}
    >
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <span className="font-medium text-neutral-text">
            {activity.title}
          </span>
          <span
            className={`px-2 py-0.5 text-xs bg-neutral-backgroundDeep text-neutral-textSecondary rounded`}
          >
            {activity.activityType.replace("_", " ")}
          </span>
        </div>
        <p className="text-sm text-neutral-textSecondary mt-1">
          {new Date(activity.dateCompleted).toLocaleDateString()}
          {activity.durationMinutes && ` - ${activity.durationMinutes} min`}
        </p>
      </div>
      <div className="flex items-center gap-3">
        {standardCount > 0 ? (
          <span
            className={`px-2 py-1 text-sm bg-status-successLight text-status-successDark rounded-full`}
          >
            {standardCount} standards
          </span>
        ) : (
          <span
            className={`px-2 py-1 text-sm bg-neutral-backgroundDeep text-neutral-textSecondary rounded-full`}
          >
            No standards
          </span>
        )}
        <ChevronRightIcon />
      </div>
    </Button>
  );
}

function ChevronRightIcon() {
  return (
    <svg
      className="w-5 h-5 text-gray-400"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M9 5l7 7-7 7"
      />
    </svg>
  );
}
