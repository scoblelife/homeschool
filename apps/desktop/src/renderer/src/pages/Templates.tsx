import { useState } from "react";
import { TemplateLibrary, ActivityTemplate } from "../features/templates";
import { useStore } from "../stores/useStore";
import { Button } from "../components/ui/Button";
import { PageContainer } from "../components/layout/PageContainer";
import { PageHeader } from "../components/layout/PageHeader";

export default function Templates() {
  const { students, selectedStudentId, subjects, setActivities } = useStore();
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedTemplate, setSelectedTemplate] =
    useState<ActivityTemplate | null>(null);
  const [addingActivity, setAddingActivity] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const selectedStudent = students.find((s) => s.id === selectedStudentId);

  const handleSelectTemplate = (template: ActivityTemplate) => {
    setSelectedTemplate(template);
    setShowAddModal(true);
  };

  const handleAddActivity = async (studentId: string) => {
    if (!selectedTemplate) return;

    setAddingActivity(true);
    try {
      // Find matching subject or use first one
      const subject =
        subjects.find(
          (s) =>
            s.name
              .toLowerCase()
              .includes(selectedTemplate.subjectId.toLowerCase()) ||
            selectedTemplate.subjectId
              .toLowerCase()
              .includes(s.name.toLowerCase()),
        ) || subjects[0];

      // Use the window.api to create the activity
      const today = new Date().toISOString().split("T")[0];
      await window.api.createActivity({
        studentId,
        subjectId: subject?.id || "",
        sessionId: null,
        activityType: selectedTemplate.activityType as
          | "worksheet"
          | "video"
          | "reading"
          | "writing"
          | "hands_on"
          | "interactive",
        title: selectedTemplate.name,
        description: selectedTemplate.description,
        dateCompleted: today,
        durationMinutes: selectedTemplate.durationMinutes,
        grade: null,
        maxGrade: null,
        notes: selectedTemplate.instructions || "",
      });

      // Refresh activities list
      const updatedActivities = await window.api.getActivities({});
      setActivities(updatedActivities);

      setShowAddModal(false);
      setSelectedTemplate(null);
      setSuccessMessage(
        `Added "${selectedTemplate.name}" for ${students.find((s) => s.id === studentId)?.name}`,
      );
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (error) {
      console.error("Failed to add activity:", error);
    } finally {
      setAddingActivity(false);
    }
  };

  return (
    <PageContainer>
      <PageHeader
        title="Activity Templates"
        subtitle="Browse pre-built activity templates organized by subject and grade level. One-click to add to your learning log."
      />

      {/* Success Message */}
      {successMessage && (
        /* eslint-disable-next-line design-system/pages-use-components-only -- success notification banner */
        <div className="mb-4 p-4 bg-status-successLight border border-status-success rounded-lg">
          <p className="text-status-successDark flex items-center gap-2">
            <CheckIcon className="w-5 h-5" />
            {successMessage}
          </p>
        </div>
      )}

      <TemplateLibrary
        onSelectTemplate={handleSelectTemplate}
        studentGrade={selectedStudent?.gradeLevel}
      />

      {/* Add Activity Modal */}
      {showAddModal && selectedTemplate && (
        /* eslint-disable-next-line design-system/pages-use-components-only -- modal overlay container */
        <div className="fixed inset-0 bg-neutral-overlay flex items-center justify-center z-50">
          {/* eslint-disable-next-line design-system/pages-use-components-only -- modal dialog panel */}
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="p-6">
              <h2 className="text-lg font-semibold text-neutral-text mb-2">
                Add Activity from Template
              </h2>
              <p className="text-neutral-textSecondary mb-4">
                Adding &ldquo;{selectedTemplate.name}&rdquo; (
                {selectedTemplate.durationMinutes} min)
              </p>

              <p className="text-sm text-neutral-text mb-4">
                Select a student to add this activity:
              </p>

              <div className="space-y-2">
                {students.map((student) => (
                  <Button
                    key={student.id}
                    onClick={() => handleAddActivity(student.id)}
                    disabled={addingActivity}
                    variant="ghost"
                    fullWidth
                    className="justify-between px-4 py-3 bg-neutral-backgroundDeep hover:bg-gray-100"
                  >
                    <span>
                      <span className="font-medium text-neutral-text">
                        {student.name}
                      </span>
                      <span className="text-sm text-neutral-textSecondary ml-2">
                        ({student.gradeLevel})
                      </span>
                    </span>
                    <PlusIcon className="w-5 h-5 text-neutral-textTertiary" />
                  </Button>
                ))}
              </div>

              <div className="mt-6 flex justify-end">
                <Button
                  variant="ghost"
                  onClick={() => {
                    setShowAddModal(false);
                    setSelectedTemplate(null);
                  }}
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
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

function PlusIcon({ className }: { className?: string }) {
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
        d="M12 4v16m8-8H4"
      />
    </svg>
  );
}
