import { useState, useEffect } from "react";
import { ResourceLibrary, LearningResource } from "../features/resources";
import { useStore } from "../stores/useStore";
import { PageContainer } from "../components/layout/PageContainer";
import { PageHeader } from "../components/layout/PageHeader";
import { SponsoredResourceCard } from "../features/sponsored/SponsoredResourceCard";
import { SponsoredDisclosureModal } from "../components/SponsoredDisclosureModal";
import { Card } from "../components/ui";
import { Alert } from "../components/ui/Alert";
import type { SponsoredResource } from "../../../shared/types";

export default function Resources() {
  const { students, subjects, setActivities } = useStore();
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [sponsoredResources, setSponsoredResources] = useState<
    SponsoredResource[]
  >([]);
  const [showDisclosureModal, setShowDisclosureModal] = useState(false);
  const [showSponsoredContent, setShowSponsoredContent] = useState(true);

  // Load sponsored resources
  useEffect(() => {
    // Check if sponsored content is enabled
    const savedShowSponsored = localStorage.getItem("showSponsoredContent");
    if (savedShowSponsored === "false") {
      setShowSponsoredContent(false);
      return;
    }

    loadSponsoredResources();
  }, []);

  const loadSponsoredResources = async () => {
    try {
      const resources = await window.api.getSponsoredResources({
        location: "resources_page",
        activeOnly: true,
        limit: 3,
      });

      // If there are resources and user hasn't seen disclosure, show modal
      if (resources.length > 0) {
        const hasSeenDisclosure = localStorage.getItem(
          "hasSeenSponsoredDisclosure",
        );
        if (!hasSeenDisclosure) {
          setShowDisclosureModal(true);
        }
      }

      setSponsoredResources(resources);
    } catch (error) {
      console.error("Failed to load sponsored resources:", error);
    }
  };

  const handleLogActivity = async (
    resource: LearningResource,
    studentId: string,
    duration: number,
  ) => {
    try {
      // Find matching subject or use first one
      const resourceSubject = resource.subjects[0];
      const subject =
        subjects.find(
          (s) =>
            s.name.toLowerCase().includes(resourceSubject) ||
            resourceSubject.includes(s.name.toLowerCase()),
        ) || subjects[0];

      const today = new Date().toISOString().split("T")[0];
      await window.api.createActivity({
        studentId,
        subjectId: subject?.id || "",
        sessionId: null,
        activityType: resource.suggestedActivityType,
        title: `${resource.name}`,
        description: `Used ${resource.name} - ${resource.description}`,
        dateCompleted: today,
        durationMinutes: duration,
        grade: null,
        maxGrade: null,
        notes: `Resource: ${resource.url}`,
      });

      // Refresh activities
      const updatedActivities = await window.api.getActivities({});
      setActivities(updatedActivities);

      const studentName =
        students.find((s) => s.id === studentId)?.name || "Student";
      setSuccessMessage(
        `Logged ${duration} minutes of ${resource.name} for ${studentName}`,
      );
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (error) {
      console.error("Failed to log activity:", error);
    }
  };

  return (
    <PageContainer>
      <PageHeader
        title="Learning Resources"
        subtitle="Quick links to educational websites and apps. Track time spent learning with each resource."
      />

      {/* Success Message */}
      {successMessage && (
        <Alert
          variant="success"
          style="subtle"
          icon={<CheckIcon className="w-5 h-5" />}
          dismissible
          onDismiss={() => setSuccessMessage(null)}
          className="mb-4"
        >
          {successMessage}
        </Alert>
      )}

      {/* Info box */}
      <Alert
        variant="info"
        style="subtle"
        title="Track Your Learning Time"
        className="mb-6"
      >
        Click "Open" to visit any resource in a new tab. Click "Log" to record
        time spent as an activity in your learning log. Favorite resources
        appear at the top for quick access.
      </Alert>

      {/* Featured Educational Partners */}
      {showSponsoredContent && sponsoredResources.length > 0 && (
        <Card className="mb-6 bg-gradient-to-r from-student-blue-50 to-student-purple-50 border-student-blue-200">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="font-medium text-student-blue-700 flex items-center gap-2">
                <SparklesIcon className="w-5 h-5" />
                Featured Partners
              </h3>
              <p className="text-sm text-student-blue-600">
                Trusted resources recommended for your family
              </p>
            </div>
            <span className="text-xs text-gray-500">Sponsored</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {sponsoredResources.map((resource) => (
              <SponsoredResourceCard
                key={resource.id}
                resource={resource}
                location="resources_page"
              />
            ))}
          </div>
        </Card>
      )}

      <ResourceLibrary onLogActivity={handleLogActivity} students={students} />

      {/* Sponsored Content Disclosure Modal */}
      <SponsoredDisclosureModal
        isOpen={showDisclosureModal}
        onClose={() => setShowDisclosureModal(false)}
      />
    </PageContainer>
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

function SparklesIcon({ className }: { className?: string }) {
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
        d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"
      />
    </svg>
  );
}
