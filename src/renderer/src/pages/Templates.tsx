import { useState } from "react";
import { TemplateLibrary, ActivityTemplate } from "../features/templates";
import { useStore } from "../stores/useStore";
import { PageContainer } from "../components/layout/PageContainer";
import { PageHeader } from "../components/layout/PageHeader";

export default function Templates() {
  const { students, selectedStudentId, subjects, setActivities, activities } =
    useStore();
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
          | "writing_print"
          | "writing_cursive"
          | "hands_on"
          | "game"
          | "assessment",
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
        <div className="fixed inset-0 bg-neutral-overlay flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="p-6">
              <h2 className="text-lg font-semibold text-neutral-text mb-2">
                Add Activity from Template
              </h2>
              <p className="text-neutral-textSecondary mb-4">
                Adding "{selectedTemplate.name}" (
                {selectedTemplate.durationMinutes} min)
              </p>

              <p className="text-sm text-neutral-text mb-4">
                Select a student to add this activity:
              </p>

              <div className="space-y-2">
                {students.map((student) => (
                  <button
                    key={student.id}
                    onClick={() => handleAddActivity(student.id)}
                    disabled={addingActivity}
                    className="w-full px-4 py-3 text-left bg-neutral-backgroundDeep rounded-lg
                      hover:bg-gray-100 disabled:opacity-50 flex items-center justify-between"
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
                  </button>
                ))}
              </div>

              <div className="mt-6 flex justify-end">
                <button
                  onClick={() => {
                    setShowAddModal(false);
                    setSelectedTemplate(null);
                  }}
                  className="px-4 py-2 text-neutral-textSecondary hover:text-neutral-text"
                >
                  Cancel
                </button>
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
