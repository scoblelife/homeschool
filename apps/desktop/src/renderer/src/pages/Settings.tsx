/* eslint-disable design-system/require-design-system-components -- Settings page uses native select, input[type=checkbox], input[type=number], and toggle button elements that have no design system equivalents (Select, Checkbox, Toggle not yet implemented) */
/* eslint-disable design-system/pages-use-components-only -- Settings page composes multiple sub-components (DemoDataSection, DataManagement, SharingToggle) and native form elements that are not yet in the design system */
/* TODO(Phase 2): Migrate form elements to design system components (Select, Input wrappers, etc.) */
import { useState, useEffect } from "react";
import { format, parseISO, startOfWeek, endOfWeek } from "date-fns";
import { Dialog } from "@headlessui/react";
import { useStudents } from "../hooks/useDatabase";
import { SyncSettings } from "../components/sync";
import { GradeCertificate } from "../features/certificates";
import { FeedbackButton } from "../components/Feedback";
import {
  getAllStates,
  getStateRequirements,
  formatRequirements,
  type StateRequirements,
} from "../../../data/stateRequirementsTypes";
import type {
  GradeLevel,
  GoogleCalendarInfo,
  Subject,
  SubjectChoreMapping,
  EmailSummaryConfig,
  WeeklySummaryEmailData,
  Student,
} from "../../../shared/types";

import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { Card } from "../components/ui/Card";
import { PageContainer, PageHeader } from "../components/layout";

// Student color palette - using design system tokens
const STUDENT_COLORS = [
  {
    id: "fuchsia",
    name: "Fuchsia",
    bg: "bg-student-fuchsia-500",
    ring: "ring-student-fuchsia-500",
    bgLight: "bg-student-fuchsia-50",
    border: "border-l-student-fuchsia-500",
    text: "text-student-fuchsia-600",
  },
  {
    id: "teal",
    name: "Teal",
    bg: "bg-student-teal-500",
    ring: "ring-student-teal-500",
    bgLight: "bg-student-teal-50",
    border: "border-l-student-teal-500",
    text: "text-student-teal-600",
  },
  {
    id: "blue",
    name: "Blue",
    bg: "bg-student-blue-500",
    ring: "ring-student-blue-500",
    bgLight: "bg-student-blue-50",
    border: "border-l-student-blue-500",
    text: "text-student-blue-600",
  },
  {
    id: "orange",
    name: "Orange",
    bg: "bg-student-orange-500",
    ring: "ring-student-orange-500",
    bgLight: "bg-student-orange-50",
    border: "border-l-student-orange-500",
    text: "text-student-orange-600",
  },
  {
    id: "purple",
    name: "Purple",
    bg: "bg-student-purple-500",
    ring: "ring-student-purple-500",
    bgLight: "bg-student-purple-50",
    border: "border-l-student-purple-500",
    text: "text-student-purple-600",
  },
  {
    id: "green",
    name: "Green",
    bg: "bg-student-green-500",
    ring: "ring-student-green-500",
    bgLight: "bg-student-green-50",
    border: "border-l-student-green-500",
    text: "text-student-green-600",
  },
] as const;

export function getStudentColor(colorId: string) {
  // Handle legacy 'child1'/'child2' values
  if (colorId === "child1") return STUDENT_COLORS[0];
  if (colorId === "child2") return STUDENT_COLORS[1];
  return STUDENT_COLORS.find((c) => c.id === colorId) || STUDENT_COLORS[0];
}

// --- Props interfaces for sub-components ---

interface StudentsSectionProps {
  students: Student[];
  onAddStudent: () => void;
  onEditStudent: (studentId: string) => void;
  onDeleteStudent: (id: string) => void;
  onPrintCertificate: (student: Student) => void;
}

interface StudentCardProps {
  student: Student;
  onEdit: (studentId: string) => void;
  onDelete: (id: string) => void;
  onPrintCertificate: (student: Student) => void;
}

interface StateRequirementsSectionProps {
  selectedStateCode: string | null;
  stateInfo: StateRequirements | null;
  availableStates: Array<{ code: string; name: string }>;
  onStateChange: (stateCode: string) => void;
}

interface StateRequirementsDetailsProps {
  stateInfo: StateRequirements;
}

interface GoogleCalendarSectionProps {
  googleAuthStatus: {
    hasCredentials: boolean;
    isAuthenticated: boolean;
  } | null;
  calendars: GoogleCalendarInfo[];
  selectedCalendarId: string | null;
  isConnecting: boolean;
  onConnect: () => void;
  onDisconnect: () => void;
  onSelectCalendar: (calendarId: string) => void;
}

interface GoogleCalendarConnectedProps {
  calendars: GoogleCalendarInfo[];
  selectedCalendarId: string | null;
  onSelectCalendar: (calendarId: string) => void;
  onDisconnect: () => void;
}

interface EmailSummarySectionProps {
  students: Student[];
}

interface EmailSummaryFormProps {
  emailConfig: EmailSummaryConfig;
  onSaveConfig: (config: EmailSummaryConfig) => void;
  onUpdateConfig: (config: EmailSummaryConfig) => void;
  onPreviewEmail: () => void;
  onSendTestEmail: () => void;
  isSendingEmail: boolean;
  emailStatus: { success?: boolean; message?: string } | null;
}

interface EmailPreviewModalProps {
  emailPreviewHtml: string | null;
  onClose: () => void;
}

interface ChoreMappingSectionProps {
  subjects: Subject[];
  choreMappings: SubjectChoreMapping[];
  mappingForm: Record<string, { choreName: string; defaultStars: number }>;
  onUpdateMappingForm: (
    form: Record<string, { choreName: string; defaultStars: number }>,
  ) => void;
  onSaveMapping: (subjectId: string) => void;
}

interface ChoreRowProps {
  subject: Subject;
  formValue: { choreName: string; defaultStars: number };
  hasMapping: boolean;
  onUpdateForm: (value: { choreName: string; defaultStars: number }) => void;
  onSave: () => void;
}

interface SponsoredContentSectionProps {
  showSponsoredContent: boolean;
  onToggle: (enabled: boolean) => void;
}

interface StudentModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingStudent: string | null;
  formData: {
    name: string;
    dateOfBirth: string;
    gradeLevel: GradeLevel;
    color: string;
    calendarFeedUrl: string;
  };
  onFormDataChange: (data: {
    name: string;
    dateOfBirth: string;
    gradeLevel: GradeLevel;
    color: string;
    calendarFeedUrl: string;
  }) => void;
  onSubmit: (e: React.FormEvent) => void;
}

interface StudentModalFormFieldsProps {
  formData: {
    name: string;
    dateOfBirth: string;
    gradeLevel: GradeLevel;
    color: string;
    calendarFeedUrl: string;
  };
  onFormDataChange: (data: {
    name: string;
    dateOfBirth: string;
    gradeLevel: GradeLevel;
    color: string;
    calendarFeedUrl: string;
  }) => void;
}

interface ColorPickerProps {
  selectedColor: string;
  onSelectColor: (colorId: string) => void;
}

// --- Main Settings Component ---

export default function Settings(): JSX.Element {
  const { students, createStudent, updateStudent, deleteStudent } =
    useStudents();

  return (
    <PageContainer>
      <PageHeader
        title="Settings"
        subtitle="Manage students, integrations, and application preferences"
      />
      <StudentManagementSection
        students={students}
        createStudent={createStudent}
        updateStudent={updateStudent}
        deleteStudent={deleteStudent}
      />
      <StateRequirementsSection />
      <div className="mb-8">
        <SyncSettings />
      </div>
      <GoogleCalendarSection />
      <EmailSummarySection students={students} />
      <ChoreMappingSection />
      <SponsoredContentSection />
      <DataManagement />
      <SupportSection />
      <DemoDataSection />
      <AboutSection />
    </PageContainer>
  );
}

// --- Student Management Section (owns modal + certificate state) ---

interface StudentManagementSectionProps {
  students: Student[];
  createStudent: (data: {
    name: string;
    dateOfBirth: string;
    gradeLevel: GradeLevel;
    color: string;
    calendarFeedUrl: string;
  }) => Promise<Student | void>;
  updateStudent: (
    id: string,
    data: {
      name: string;
      dateOfBirth: string;
      gradeLevel: GradeLevel;
      color: string;
      calendarFeedUrl: string;
    },
  ) => Promise<Student | void>;
  deleteStudent: (id: string) => Promise<void>;
}

type StudentFormData = {
  name: string;
  dateOfBirth: string;
  gradeLevel: GradeLevel;
  color: string;
  calendarFeedUrl: string;
};

const EMPTY_FORM_DATA: StudentFormData = {
  name: "",
  dateOfBirth: "",
  gradeLevel: "pre-k",
  color: "child1",
  calendarFeedUrl: "",
};

function buildAddFormData(studentCount: number): StudentFormData {
  return {
    ...EMPTY_FORM_DATA,
    color: STUDENT_COLORS[studentCount % STUDENT_COLORS.length].id,
  };
}

function buildEditFormData(student: Student): StudentFormData {
  return {
    name: student.name,
    dateOfBirth: student.dateOfBirth,
    gradeLevel: student.gradeLevel,
    color: student.color,
    calendarFeedUrl: student.calendarFeedUrl || "",
  };
}

function StudentManagementSection({
  students,
  createStudent,
  updateStudent,
  deleteStudent,
}: StudentManagementSectionProps): JSX.Element {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<string | null>(null);
  const [formData, setFormData] = useState<StudentFormData>(EMPTY_FORM_DATA);
  const [certificateStudent, setCertificateStudent] = useState<Student | null>(
    null,
  );

  const openAddModal = (): void => {
    setEditingStudent(null);
    setFormData(buildAddFormData(students.length));
    setIsModalOpen(true);
  };

  const openEditModal = (studentId: string): void => {
    const student = students.find((s) => s.id === studentId);
    if (!student) return;
    setEditingStudent(studentId);
    setFormData(buildEditFormData(student));
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    if (!formData.name || !formData.dateOfBirth) return;
    if (editingStudent) {
      await updateStudent(editingStudent, formData);
    } else {
      await createStudent(formData);
    }
    setIsModalOpen(false);
  };

  const handleDelete = async (id: string): Promise<void> => {
    if (confirm("Delete this student and all their activities and sessions?")) {
      await deleteStudent(id);
    }
  };

  return (
    <>
      <StudentsSection
        students={students}
        onAddStudent={openAddModal}
        onEditStudent={openEditModal}
        onDeleteStudent={handleDelete}
        onPrintCertificate={setCertificateStudent}
      />
      <StudentModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        editingStudent={editingStudent}
        formData={formData}
        onFormDataChange={setFormData}
        onSubmit={handleSubmit}
      />
      {certificateStudent && (
        <GradeCertificate
          student={certificateStudent}
          isOpen={!!certificateStudent}
          onClose={() => setCertificateStudent(null)}
        />
      )}
    </>
  );
}

// --- Students Section ---

function StudentsSection({
  students,
  onAddStudent,
  onEditStudent,
  onDeleteStudent,
  onPrintCertificate,
}: StudentsSectionProps): JSX.Element {
  return (
    <Card className="mb-8">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-900">Students</h2>
        <Button variant="primary" onClick={onAddStudent}>
          + Add Student
        </Button>
      </div>

      {students.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-500 mb-4">No students added yet.</p>
          <Button variant="primary" onClick={onAddStudent}>
            Add Your First Student
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {students.map((student) => (
            <StudentCard
              key={student.id}
              student={student}
              onEdit={onEditStudent}
              onDelete={onDeleteStudent}
              onPrintCertificate={onPrintCertificate}
            />
          ))}
        </div>
      )}
    </Card>
  );
}

function StudentCard({
  student,
  onEdit,
  onDelete,
  onPrintCertificate,
}: StudentCardProps): JSX.Element {
  const color = getStudentColor(student.color);

  return (
    <div
      className={`flex items-center gap-4 p-4 bg-gray-50 rounded-lg border-l-4 ${color.border}`}
    >
      <div
        className={`w-12 h-12 rounded-full flex items-center justify-center text-white text-lg font-bold ${color.bg}`}
      >
        {student.name.charAt(0)}
      </div>
      <div className="flex-1">
        <div className="font-semibold text-gray-900">{student.name}</div>
        <div className="text-sm text-gray-500">
          {student.gradeLevel === "pre-k"
            ? "Pre-K"
            : student.gradeLevel === "1st"
              ? "1st Grade"
              : "2nd Grade"}{" "}
          • Born {format(parseISO(student.dateOfBirth), "MMMM d, yyyy")}
        </div>
      </div>
      <div className="flex gap-2">
        <Button
          variant="secondary"
          onClick={() => onPrintCertificate(student)}
          className="text-sm flex items-center gap-1"
          title="Print Grade Certificate"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"
            />
          </svg>
          Certificate
        </Button>
        <Button
          variant="secondary"
          onClick={() => onEdit(student.id)}
          className="text-sm"
        >
          Edit
        </Button>
        <Button
          variant="danger"
          onClick={() => onDelete(student.id)}
          className="text-sm"
        >
          Delete
        </Button>
      </div>
    </div>
  );
}

// --- State Requirements Section ---

function StateRequirementsSection(): JSX.Element {
  const [selectedStateCode, setSelectedStateCode] = useState<string | null>(
    null,
  );
  const [stateInfo, setStateInfo] = useState<StateRequirements | null>(null);
  const availableStates = getAllStates();

  useEffect(() => {
    const loadStateSelection = async (): Promise<void> => {
      const savedState = await window.api.getSetting("homeschool_state");
      if (savedState) {
        setSelectedStateCode(savedState);
        setStateInfo(getStateRequirements(savedState));
      }
    };
    loadStateSelection();
  }, []);

  const handleStateChange = async (stateCode: string): Promise<void> => {
    if (stateCode) {
      await window.api.setSetting("homeschool_state", stateCode);
      setSelectedStateCode(stateCode);
      setStateInfo(getStateRequirements(stateCode));
    } else {
      await window.api.deleteSetting("homeschool_state");
      setSelectedStateCode(null);
      setStateInfo(null);
    }
  };

  return (
    <StateRequirementsCard
      selectedStateCode={selectedStateCode}
      stateInfo={stateInfo}
      availableStates={availableStates}
      onStateChange={handleStateChange}
    />
  );
}

function StateRequirementsCard({
  selectedStateCode,
  stateInfo,
  availableStates,
  onStateChange,
}: StateRequirementsSectionProps): JSX.Element {
  return (
    <Card className="mb-8">
      <h2 className="text-lg font-semibold text-gray-900 mb-2">
        State Requirements
      </h2>
      <p className="text-sm text-gray-600 mb-4">
        Select your state to see homeschool requirements and ensure compliance.
      </p>

      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Your State
        </label>
        <select
          value={selectedStateCode || ""}
          onChange={(e) => onStateChange(e.target.value)}
          className="block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-brand-primary text-sm hover:border-gray-400"
        >
          <option value="">Select your state...</option>
          {availableStates.map((state) => (
            <option key={state.code} value={state.code}>
              {state.name}
            </option>
          ))}
        </select>
      </div>

      {stateInfo && <StateRequirementsDetails stateInfo={stateInfo} />}
    </Card>
  );
}

function getRegulationLevelClassName(level: string): string {
  if (level === "minimal")
    return "bg-status-successLight text-status-successDark";
  if (level === "low") return "bg-student-blue-100 text-student-blue-800";
  if (level === "moderate")
    return "bg-status-warningLight text-status-warningDark";
  return "bg-status-errorLight text-status-errorDark";
}

function StateRequirementsDetails({
  stateInfo,
}: StateRequirementsDetailsProps): JSX.Element {
  return (
    <div className="bg-gray-50 rounded-lg p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-medium text-gray-900">
          {stateInfo.name} Requirements
        </h3>
        <span
          className={`text-xs px-2 py-1 rounded-full ${getRegulationLevelClassName(stateInfo.regulationLevel)}`}
        >
          {stateInfo.regulationLevel.charAt(0).toUpperCase() +
            stateInfo.regulationLevel.slice(1)}{" "}
          Regulation
        </span>
      </div>

      <RequirementsList stateInfo={stateInfo} />

      {stateInfo.notes && (
        <div className="text-sm text-neutral-textSecondary bg-neutral-surface rounded p-3 border border-neutral-border">
          <strong>Notes:</strong> {stateInfo.notes}
        </div>
      )}

      {stateInfo.resources.length > 0 && (
        <StateResourceLinks resources={stateInfo.resources} />
      )}
    </div>
  );
}

function RequirementsList({
  stateInfo,
}: {
  stateInfo: StateRequirements;
}): JSX.Element {
  return (
    <ul className="space-y-2 text-sm text-gray-600 mb-4">
      {formatRequirements(stateInfo).map((req, i) => (
        <li key={i} className="flex items-start gap-2">
          <span className="text-brand-primary mt-0.5">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clipRule="evenodd"
              />
            </svg>
          </span>
          {req}
        </li>
      ))}
    </ul>
  );
}

function StateResourceLinks({
  resources,
}: {
  resources: string[];
}): JSX.Element {
  return (
    <div className="mt-3">
      <div className="text-xs text-gray-500 mb-1">Official Resources:</div>
      {resources.map((url, i) => (
        <a
          key={i}
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm text-brand-primary hover:text-brand-primaryDark block truncate"
        >
          {url}
        </a>
      ))}
    </div>
  );
}

// --- Google Calendar Section ---

function GoogleCalendarSection(): JSX.Element {
  const [googleAuthStatus, setGoogleAuthStatus] = useState<{
    hasCredentials: boolean;
    isAuthenticated: boolean;
  } | null>(null);
  const [calendars, setCalendars] = useState<GoogleCalendarInfo[]>([]);
  const [selectedCalendarId, setSelectedCalendarId] = useState<string | null>(
    null,
  );
  const [isConnecting, setIsConnecting] = useState(false);

  useEffect(() => {
    loadGoogleAuthStatus();
  }, []);

  const loadGoogleAuthStatus = async (): Promise<void> => {
    const status = await window.api.getGoogleAuthStatus();
    setGoogleAuthStatus(status);

    if (status.isAuthenticated) {
      const calendarList = await window.api.listGoogleCalendars();
      setCalendars(calendarList);

      const savedCalendarId = await window.api.getSetting("google_calendar_id");
      setSelectedCalendarId(savedCalendarId);
    }
  };

  const handleConnectGoogle = async (): Promise<void> => {
    setIsConnecting(true);
    try {
      await window.api.connectGoogleCalendar();
      await loadGoogleAuthStatus();
    } catch (error) {
      console.error("Failed to connect:", error);
      alert("Failed to connect to Google Calendar. Please try again.");
    } finally {
      setIsConnecting(false);
    }
  };

  const handleDisconnectGoogle = async (): Promise<void> => {
    if (!confirm("Are you sure you want to disconnect Google Calendar?"))
      return;
    await window.api.disconnectGoogleCalendar();
    setCalendars([]);
    setSelectedCalendarId(null);
    await window.api.deleteSetting("google_calendar_id");
    loadGoogleAuthStatus();
  };

  const handleSelectCalendar = async (calendarId: string): Promise<void> => {
    setSelectedCalendarId(calendarId);
    await window.api.setSetting("google_calendar_id", calendarId);
  };

  return (
    <GoogleCalendarCard
      googleAuthStatus={googleAuthStatus}
      calendars={calendars}
      selectedCalendarId={selectedCalendarId}
      isConnecting={isConnecting}
      onConnect={handleConnectGoogle}
      onDisconnect={handleDisconnectGoogle}
      onSelectCalendar={handleSelectCalendar}
    />
  );
}

function GoogleCalendarCard({
  googleAuthStatus,
  calendars,
  selectedCalendarId,
  isConnecting,
  onConnect,
  onDisconnect,
  onSelectCalendar,
}: GoogleCalendarSectionProps): JSX.Element {
  return (
    <Card className="mb-8">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">
        Google Calendar Sync
      </h2>
      <p className="text-sm text-gray-600 mb-4">
        Sync your weekly plan milestones to Google Calendar. Events will
        automatically appear on your Skylight calendar.
      </p>

      {googleAuthStatus === null ? (
        <div className="text-gray-500">Loading...</div>
      ) : !googleAuthStatus.isAuthenticated ? (
        <div className="space-y-4">
          <Button
            variant="primary"
            onClick={onConnect}
            disabled={isConnecting}
            className="flex items-center gap-2"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12.545,10.239v3.821h5.445c-0.712,2.315-2.647,3.972-5.445,3.972c-3.332,0-6.033-2.701-6.033-6.032s2.701-6.032,6.033-6.032c1.498,0,2.866,0.549,3.921,1.453l2.814-2.814C17.503,2.988,15.139,2,12.545,2C7.021,2,2.543,6.477,2.543,12s4.478,10,10.002,10c8.396,0,10.249-7.85,9.426-11.748L12.545,10.239z" />
            </svg>
            {isConnecting ? "Connecting..." : "Connect Google Calendar"}
          </Button>
        </div>
      ) : (
        <GoogleCalendarConnected
          calendars={calendars}
          selectedCalendarId={selectedCalendarId}
          onSelectCalendar={onSelectCalendar}
          onDisconnect={onDisconnect}
        />
      )}
    </Card>
  );
}

function GoogleCalendarConnected({
  calendars,
  selectedCalendarId,
  onSelectCalendar,
  onDisconnect,
}: GoogleCalendarConnectedProps): JSX.Element {
  return (
    <div className="space-y-4">
      <div className="bg-status-successLight border border-status-success rounded-lg p-4 flex items-center gap-3">
        <div className="w-8 h-8 bg-status-success rounded-full flex items-center justify-center text-white">
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
              clipRule="evenodd"
            />
          </svg>
        </div>
        <div>
          <p className="font-medium text-status-successDark">
            Connected to Google Calendar
          </p>
          <p className="text-sm text-status-success">
            Ready to sync milestones
          </p>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Sync to Calendar
        </label>
        <select
          value={selectedCalendarId || ""}
          onChange={(e) => onSelectCalendar(e.target.value)}
          className="block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-brand-primary text-sm hover:border-gray-400"
        >
          <option value="">Select a calendar...</option>
          {calendars.map((cal) => (
            <option key={cal.id} value={cal.id}>
              {cal.summary} {cal.primary ? "(Primary)" : ""}
            </option>
          ))}
        </select>
        <p className="text-xs text-gray-500 mt-1">
          Milestones from your weekly plan will be synced to this calendar.
        </p>
      </div>

      <Button
        variant="secondary"
        onClick={onDisconnect}
        className="text-status-error"
      >
        Disconnect Google Calendar
      </Button>
    </div>
  );
}

// --- Email Summary Section ---

async function generateStudentSummary(
  student: Student,
  weekStart: Date,
  weekEnd: Date,
) {
  const weekStartStr = format(weekStart, "yyyy-MM-dd");
  const weekEndStr = format(weekEnd, "yyyy-MM-dd");

  const activitySummary = await window.api.getActivitySummary(
    student.id,
    weekStartStr,
    weekEndStr,
  );
  const dailySummaries = await window.api.getDailySummaries(
    student.id,
    weekStartStr,
    weekEndStr,
  );

  const totalActivities = activitySummary.reduce(
    (sum, s) => sum + s.totalActivities,
    0,
  );
  const totalMinutes = activitySummary.reduce(
    (sum, s) => sum + s.totalMinutes,
    0,
  );
  const activeDays = dailySummaries.filter((d) => d.activitiesCount > 0).length;

  return {
    name: student.name,
    gradeLevel: student.gradeLevel,
    totalActivities,
    totalMinutes,
    activeDays,
    subjects: activitySummary.map((s) => ({
      name: s.subjectName,
      activities: s.totalActivities,
      minutes: s.totalMinutes,
    })),
  };
}

async function generateWeeklySummaryData(
  students: Student[],
): Promise<WeeklySummaryEmailData> {
  const now = new Date();
  const weekStart = startOfWeek(now, { weekStartsOn: 0 }); // Sunday
  const weekEnd = endOfWeek(now, { weekStartsOn: 0 });

  const studentSummaries = await Promise.all(
    students.map((student) =>
      generateStudentSummary(student, weekStart, weekEnd),
    ),
  );

  const familyTotalActivities = studentSummaries.reduce(
    (sum, s) => sum + s.totalActivities,
    0,
  );
  const familyTotalMinutes = studentSummaries.reduce(
    (sum, s) => sum + s.totalMinutes,
    0,
  );

  return {
    weekStart: format(weekStart, "yyyy-MM-dd"),
    weekEnd: format(weekEnd, "yyyy-MM-dd"),
    students: studentSummaries,
    familyTotalActivities,
    familyTotalMinutes,
  };
}

async function loadEmailConfigFromSettings(): Promise<EmailSummaryConfig> {
  const [enabled, recipientEmail, method, resendApiKey] = await Promise.all([
    window.api.getSetting("email_summary_enabled"),
    window.api.getSetting("email_summary_recipient"),
    window.api.getSetting("email_summary_method"),
    window.api.getSetting("email_summary_resend_api_key"),
  ]);
  return {
    enabled: enabled === "true",
    recipientEmail: recipientEmail || "",
    method: (method as "mailto" | "resend") || "mailto",
    resendApiKey: resendApiKey || undefined,
  };
}

async function persistEmailConfig(config: EmailSummaryConfig): Promise<void> {
  await Promise.all([
    window.api.setSetting("email_summary_enabled", config.enabled.toString()),
    window.api.setSetting("email_summary_recipient", config.recipientEmail),
    window.api.setSetting("email_summary_method", config.method),
    config.resendApiKey
      ? window.api.setSetting(
          "email_summary_resend_api_key",
          config.resendApiKey,
        )
      : window.api.deleteSetting("email_summary_resend_api_key"),
  ]);
}

type EmailStatusState = { success?: boolean; message?: string } | null;

async function sendTestEmail(
  students: Student[],
  emailConfig: EmailSummaryConfig,
  setIsSendingEmail: (value: boolean) => void,
  setEmailStatus: (status: EmailStatusState) => void,
): Promise<void> {
  if (!emailConfig.recipientEmail) {
    setEmailStatus({
      success: false,
      message: "Please enter a recipient email address",
    });
    return;
  }
  setIsSendingEmail(true);
  setEmailStatus(null);
  try {
    const data = await generateWeeklySummaryData(students);
    const result = await window.api.sendWeeklySummaryEmail(data, {
      ...emailConfig,
      enabled: true,
    });
    if (result.success) {
      setEmailStatus({ success: true, message: "Email sent successfully!" });
    } else {
      setEmailStatus({
        success: false,
        message: result.error || "Failed to send email",
      });
    }
  } catch (error) {
    setEmailStatus({
      success: false,
      message: error instanceof Error ? error.message : "Failed to send email",
    });
  } finally {
    setIsSendingEmail(false);
  }
}

function EmailSummarySection({
  students,
}: EmailSummarySectionProps): JSX.Element {
  const [emailConfig, setEmailConfig] = useState<EmailSummaryConfig>({
    enabled: false,
    recipientEmail: "",
    method: "mailto",
  });
  const [emailPreviewHtml, setEmailPreviewHtml] = useState<string | null>(null);
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [emailStatus, setEmailStatus] = useState<EmailStatusState>(null);

  useEffect(() => {
    loadEmailConfigFromSettings().then(setEmailConfig);
  }, []);

  const saveEmailConfig = async (config: EmailSummaryConfig): Promise<void> => {
    await persistEmailConfig(config);
    setEmailConfig(config);
  };

  const handlePreviewEmail = async (): Promise<void> => {
    const data = await generateWeeklySummaryData(students);
    const html = await window.api.generateEmailPreview(data);
    setEmailPreviewHtml(html);
  };

  return (
    <>
      <Card className="mb-8">
        <h2 className="text-lg font-semibold text-gray-900 mb-2">
          Weekly Email Summary
        </h2>
        <p className="text-sm text-gray-600 mb-4">
          Receive a weekly email summarizing your students' homeschool
          activities.
        </p>

        <EmailSummaryForm
          emailConfig={emailConfig}
          onSaveConfig={saveEmailConfig}
          onUpdateConfig={setEmailConfig}
          onPreviewEmail={handlePreviewEmail}
          onSendTestEmail={() =>
            sendTestEmail(
              students,
              emailConfig,
              setIsSendingEmail,
              setEmailStatus,
            )
          }
          isSendingEmail={isSendingEmail}
          emailStatus={emailStatus}
        />
      </Card>
      <EmailPreviewModal
        emailPreviewHtml={emailPreviewHtml}
        onClose={() => setEmailPreviewHtml(null)}
      />
    </>
  );
}

interface EmailStatusAlertProps {
  emailStatus: { success?: boolean; message?: string } | null;
}

function EmailStatusAlert({
  emailStatus,
}: EmailStatusAlertProps): JSX.Element | null {
  if (!emailStatus) return null;
  return (
    <div
      className={`p-3 rounded-lg text-sm ${
        emailStatus.success
          ? "bg-status-successLight text-status-successDark border border-status-success"
          : "bg-status-errorLight text-status-errorDark border border-status-error"
      }`}
    >
      {emailStatus.message}
    </div>
  );
}

function EmailSummaryForm({
  emailConfig,
  onSaveConfig,
  onUpdateConfig,
  onPreviewEmail,
  onSendTestEmail,
  isSendingEmail,
  emailStatus,
}: EmailSummaryFormProps): JSX.Element {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <input
          type="checkbox"
          id="email-enabled"
          checked={emailConfig.enabled}
          onChange={(e) =>
            onSaveConfig({ ...emailConfig, enabled: e.target.checked })
          }
          className="w-4 h-4 text-brand-primary rounded focus:ring-brand-primary"
        />
        <label
          htmlFor="email-enabled"
          className="text-sm font-medium text-gray-700"
        >
          Enable weekly email summaries
        </label>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Recipient Email
        </label>
        <Input
          type="email"
          value={emailConfig.recipientEmail}
          onChange={(e) =>
            onUpdateConfig({ ...emailConfig, recipientEmail: e.target.value })
          }
          onBlur={() => onSaveConfig(emailConfig)}
          placeholder="your@email.com"
        />
      </div>

      <EmailMethodSelect
        emailConfig={emailConfig}
        onSaveConfig={onSaveConfig}
        onUpdateConfig={onUpdateConfig}
      />

      <div className="flex gap-3 pt-2">
        <Button variant="secondary" onClick={onPreviewEmail}>
          Preview Email
        </Button>
        <Button
          variant="primary"
          onClick={onSendTestEmail}
          disabled={isSendingEmail || !emailConfig.recipientEmail}
        >
          {isSendingEmail ? "Sending..." : "Send Test Email"}
        </Button>
      </div>

      <EmailStatusAlert emailStatus={emailStatus} />
    </div>
  );
}

interface EmailMethodSelectProps {
  emailConfig: EmailSummaryConfig;
  onSaveConfig: (config: EmailSummaryConfig) => void;
  onUpdateConfig: (config: EmailSummaryConfig) => void;
}

function EmailMethodSelect({
  emailConfig,
  onSaveConfig,
  onUpdateConfig,
}: EmailMethodSelectProps): JSX.Element {
  return (
    <>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Send Method
        </label>
        <select
          value={emailConfig.method}
          onChange={(e) =>
            onSaveConfig({
              ...emailConfig,
              method: e.target.value as "mailto" | "resend",
            })
          }
          className="block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-brand-primary text-sm hover:border-gray-400"
        >
          <option value="mailto">Open in Email Client (mailto)</option>
          <option value="resend">Send via Resend API</option>
        </select>
        <p className="text-xs text-gray-500 mt-1">
          {emailConfig.method === "mailto"
            ? "Opens your default email client with a pre-filled email."
            : "Sends the email directly using the Resend API."}
        </p>
      </div>

      {emailConfig.method === "resend" && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Resend API Key
          </label>
          <Input
            type="password"
            value={emailConfig.resendApiKey || ""}
            onChange={(e) =>
              onUpdateConfig({
                ...emailConfig,
                resendApiKey: e.target.value,
              })
            }
            onBlur={() => onSaveConfig(emailConfig)}
            placeholder="re_xxxxxxxxxxxx"
          />
          <p className="text-xs text-gray-500 mt-1">
            Get your API key from{" "}
            <a
              href="https://resend.com/api-keys"
              target="_blank"
              rel="noopener noreferrer"
              className="text-brand-primary hover:text-brand-primaryDark"
            >
              resend.com/api-keys
            </a>
          </p>
        </div>
      )}
    </>
  );
}

function EmailPreviewModal({
  emailPreviewHtml,
  onClose,
}: EmailPreviewModalProps): JSX.Element {
  return (
    <Dialog
      open={emailPreviewHtml !== null}
      onClose={onClose}
      className="relative z-50"
    >
      <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[80vh] flex flex-col">
          <div className="flex items-center justify-between p-4 border-b">
            <Dialog.Title className="text-lg font-semibold text-gray-900">
              Email Preview
            </Dialog.Title>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
          <div className="flex-1 overflow-auto p-4">
            {emailPreviewHtml && (
              <iframe
                srcDoc={emailPreviewHtml}
                className="w-full h-[500px] border rounded"
                title="Email Preview"
              />
            )}
          </div>
        </Dialog.Panel>
      </div>
    </Dialog>
  );
}

// --- Skylight Chore Mapping Section ---

function ChoreMappingSection(): JSX.Element {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [choreMappings, setChoreMappings] = useState<SubjectChoreMapping[]>([]);
  const [mappingForm, setMappingForm] = useState<
    Record<string, { choreName: string; defaultStars: number }>
  >({});

  useEffect(() => {
    loadSubjectsAndMappings();
  }, []);

  const loadSubjectsAndMappings = async (): Promise<void> => {
    const [subjectList, mappingList] = await Promise.all([
      window.api.getSubjects(),
      window.api.getChoreMappings(),
    ]);
    setSubjects(subjectList);
    setChoreMappings(mappingList);

    const initialForm: Record<
      string,
      { choreName: string; defaultStars: number }
    > = {};
    for (const subject of subjectList) {
      const mapping = mappingList.find((m) => m.subjectId === subject.id);
      initialForm[subject.id] = {
        choreName: mapping?.choreName || "",
        defaultStars: mapping?.defaultStars || 1,
      };
    }
    setMappingForm(initialForm);
  };

  const handleSaveMapping = async (subjectId: string): Promise<void> => {
    const data = mappingForm[subjectId];
    if (!data.choreName.trim()) {
      await window.api.deleteChoreMapping(subjectId);
    } else {
      await window.api.upsertChoreMapping({
        subjectId,
        choreName: data.choreName.trim(),
        defaultStars: data.defaultStars,
      });
    }
    await loadSubjectsAndMappings();
  };

  return (
    <ChoreMappingCard
      subjects={subjects}
      choreMappings={choreMappings}
      mappingForm={mappingForm}
      onUpdateMappingForm={setMappingForm}
      onSaveMapping={handleSaveMapping}
    />
  );
}

function ChoreMappingCard({
  subjects,
  choreMappings,
  mappingForm,
  onUpdateMappingForm,
  onSaveMapping,
}: ChoreMappingSectionProps): JSX.Element {
  return (
    <Card className="mb-8">
      <h2 className="text-lg font-semibold text-gray-900 mb-2">
        Skylight Chore Mapping
      </h2>
      <p className="text-sm text-gray-600 mb-4">
        Map each subject to a Skylight chore name. When you complete milestones,
        you'll see these names in the daily checklist.
      </p>

      {subjects.length === 0 ? (
        <div className="text-gray-500">Loading subjects...</div>
      ) : (
        <div className="space-y-3">
          {subjects.map((subject) => {
            const formValue = mappingForm[subject.id] || {
              choreName: "",
              defaultStars: 1,
            };
            const hasMapping = choreMappings.some(
              (m) => m.subjectId === subject.id,
            );

            return (
              <ChoreRow
                key={subject.id}
                subject={subject}
                formValue={formValue}
                hasMapping={hasMapping}
                onUpdateForm={(value) =>
                  onUpdateMappingForm({
                    ...mappingForm,
                    [subject.id]: value,
                  })
                }
                onSave={() => onSaveMapping(subject.id)}
              />
            );
          })}
        </div>
      )}

      <p className="text-xs text-gray-500 mt-4">
        These mappings are used when generating the daily Skylight checklist for
        completed milestones.
      </p>
    </Card>
  );
}

function ChoreRow({
  subject,
  formValue,
  hasMapping,
  onUpdateForm,
  onSave,
}: ChoreRowProps): JSX.Element {
  return (
    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
      <div className="w-32 font-medium text-gray-700 truncate">
        {subject.name}
      </div>
      <span className="text-gray-400">→</span>
      <input
        type="text"
        value={formValue.choreName}
        onChange={(e) =>
          onUpdateForm({
            ...formValue,
            choreName: e.target.value,
          })
        }
        onBlur={onSave}
        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-brand-primary focus:border-brand-primary"
        placeholder="Skylight chore name..."
      />
      <span className="text-yellow-500">⭐</span>
      <input
        type="number"
        min={1}
        max={10}
        value={formValue.defaultStars}
        onChange={(e) =>
          onUpdateForm({
            ...formValue,
            defaultStars: parseInt(e.target.value) || 1,
          })
        }
        onBlur={onSave}
        className="w-16 px-2 py-2 border border-gray-300 rounded-lg text-center focus:ring-brand-primary focus:border-brand-primary"
      />
      {hasMapping && <span className="text-status-success text-sm">✓</span>}
    </div>
  );
}

// --- Privacy & Sponsored Content Section ---

function SponsoredContentSection(): JSX.Element {
  const [showSponsoredContent, setShowSponsoredContent] = useState(true);
  const [, setHasSeenSponsoredDisclosure] = useState(false);

  useEffect(() => {
    const savedShowSponsored = localStorage.getItem("showSponsoredContent");
    const savedHasSeenDisclosure = localStorage.getItem(
      "hasSeenSponsoredDisclosure",
    );

    if (savedShowSponsored !== null) {
      setShowSponsoredContent(savedShowSponsored === "true");
    }
    if (savedHasSeenDisclosure !== null) {
      setHasSeenSponsoredDisclosure(savedHasSeenDisclosure === "true");
    }
  }, []);

  const handleToggleSponsoredContent = (enabled: boolean): void => {
    setShowSponsoredContent(enabled);
    localStorage.setItem("showSponsoredContent", enabled.toString());
  };

  return (
    <SponsoredContentCard
      showSponsoredContent={showSponsoredContent}
      onToggle={handleToggleSponsoredContent}
    />
  );
}

function SponsoredContentCard({
  showSponsoredContent,
  onToggle,
}: SponsoredContentSectionProps): JSX.Element {
  return (
    <Card className="mb-8">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">
        Privacy & Sponsored Content
      </h2>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex-1 mr-4">
            <h3 className="font-medium text-gray-900">
              Show recommendations from educational partners
            </h3>
            <p className="text-sm text-gray-500 mt-1">
              We partner with trusted educational companies to show you relevant
              resources. We never share your children's personal information
              with partners.
            </p>
          </div>
          <button
            onClick={() => onToggle(!showSponsoredContent)}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              showSponsoredContent ? "bg-brand-primary" : "bg-gray-200"
            }`}
            aria-label="Toggle sponsored content"
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                showSponsoredContent ? "translate-x-6" : "translate-x-1"
              }`}
            />
          </button>
        </div>

        <div className="pt-4 border-t border-gray-200 text-sm text-gray-600">
          <h4 className="font-medium text-gray-900 mb-2">
            Your Privacy is Protected
          </h4>
          <ul className="space-y-1 list-disc list-inside">
            <li>
              We only track anonymous clicks (no student names, no personal
              information)
            </li>
            <li>Sponsors never receive your data</li>
            <li>All tracking is local to your device</li>
            <li>No cookies, no pixels, no third-party analytics</li>
          </ul>
          <p className="mt-3 text-xs text-gray-500">
            These partnerships help fund ongoing development of this app while
            protecting your family's privacy.
          </p>
        </div>
      </div>
    </Card>
  );
}

// --- Support Section ---

function SupportSection(): JSX.Element {
  return (
    <Card className="mb-8">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Support</h2>
      <p className="text-sm text-gray-600 mb-4">
        Have feedback, found a bug, or want to request a feature? We'd love to
        hear from you.
      </p>
      <FeedbackButton className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors" />
    </Card>
  );
}

// --- About Section ---

function AboutSection(): JSX.Element {
  return (
    <Card>
      <h2 className="text-lg font-semibold text-gray-900 mb-4">About</h2>
      <div className="text-sm text-gray-600 space-y-2">
        <p>
          <strong>Homeschool Manager</strong> v0.1.3
        </p>
        <p>A desktop application for managing homeschool education.</p>
        <p>
          Data is stored locally on your device. Family sync uses encrypted
          peer-to-peer connections - your data never touches our servers.
        </p>
      </div>
    </Card>
  );
}

// --- Student Modal ---

function StudentModal({
  isOpen,
  onClose,
  editingStudent,
  formData,
  onFormDataChange,
  onSubmit,
}: StudentModalProps): JSX.Element {
  return (
    <Dialog open={isOpen} onClose={onClose} className="relative z-50">
      <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
          <Dialog.Title className="text-lg font-semibold text-gray-900 mb-4">
            {editingStudent ? "Edit Student" : "Add Student"}
          </Dialog.Title>

          <form onSubmit={onSubmit} className="space-y-4">
            <StudentModalFormFields
              formData={formData}
              onFormDataChange={onFormDataChange}
            />

            <div className="flex justify-end gap-3 pt-4">
              <Button variant="secondary" type="button" onClick={onClose}>
                Cancel
              </Button>
              <Button variant="primary" type="submit">
                {editingStudent ? "Save Changes" : "Add Student"}
              </Button>
            </div>
          </form>
        </Dialog.Panel>
      </div>
    </Dialog>
  );
}

function StudentModalFormFields({
  formData,
  onFormDataChange,
}: StudentModalFormFieldsProps): JSX.Element {
  return (
    <>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Name
        </label>
        <Input
          type="text"
          value={formData.name}
          onChange={(e) =>
            onFormDataChange({ ...formData, name: e.target.value })
          }
          placeholder="Enter student name"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Date of Birth
        </label>
        <Input
          type="date"
          value={formData.dateOfBirth}
          onChange={(e) =>
            onFormDataChange({ ...formData, dateOfBirth: e.target.value })
          }
          required
        />
      </div>

      <GradeLevelSelect
        gradeLevel={formData.gradeLevel}
        onChange={(gradeLevel) => onFormDataChange({ ...formData, gradeLevel })}
      />

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Color
        </label>
        <ColorPicker
          selectedColor={formData.color}
          onSelectColor={(colorId) =>
            onFormDataChange({ ...formData, color: colorId })
          }
        />
      </div>

      <CalendarFeedUrlField
        calendarFeedUrl={formData.calendarFeedUrl}
        onChange={(calendarFeedUrl) =>
          onFormDataChange({ ...formData, calendarFeedUrl })
        }
      />
    </>
  );
}

interface GradeLevelSelectProps {
  gradeLevel: GradeLevel;
  onChange: (gradeLevel: GradeLevel) => void;
}

function GradeLevelSelect({
  gradeLevel,
  onChange,
}: GradeLevelSelectProps): JSX.Element {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        Grade Level
      </label>
      <select
        value={gradeLevel}
        onChange={(e) => onChange(e.target.value as GradeLevel)}
        className="block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-brand-primary text-sm hover:border-gray-400"
      >
        <option value="pre-k">Pre-K (4 years old)</option>
        <option value="1st">1st Grade (6 years old)</option>
        <option value="2nd">2nd Grade (7 years old)</option>
      </select>
    </div>
  );
}

interface CalendarFeedUrlFieldProps {
  calendarFeedUrl: string;
  onChange: (url: string) => void;
}

function CalendarFeedUrlField({
  calendarFeedUrl,
  onChange,
}: CalendarFeedUrlFieldProps): JSX.Element {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        Google Calendar Feed URL (optional)
      </label>
      <Input
        type="url"
        value={calendarFeedUrl}
        onChange={(e) => onChange(e.target.value)}
        placeholder="https://calendar.google.com/calendar/ical/..."
      />
      <p className="text-xs text-gray-500 mt-1">
        Get this from Google Calendar → Settings → Your Calendar → Secret
        address in iCal format
      </p>
    </div>
  );
}

function ColorPicker({
  selectedColor,
  onSelectColor,
}: ColorPickerProps): JSX.Element {
  return (
    <div className="grid grid-cols-3 gap-2">
      {STUDENT_COLORS.map((color) => {
        const isSelected =
          selectedColor === color.id ||
          (selectedColor === "child1" && color.id === "fuchsia") ||
          (selectedColor === "child2" && color.id === "teal");
        return (
          <button
            key={color.id}
            type="button"
            onClick={() => onSelectColor(color.id)}
            className={`p-2 rounded-lg flex items-center gap-2 transition-colors ${
              isSelected
                ? `ring-2 ${color.ring} ${color.bgLight}`
                : "bg-gray-50 hover:bg-gray-100"
            }`}
          >
            <div className={`w-5 h-5 rounded-full ${color.bg}`} />
            <span className="text-sm">{color.name}</span>
          </button>
        );
      })}
    </div>
  );
}

// --- Demo Data Section ---

interface StatusMessageProps {
  status: { type: "success" | "error"; message: string } | null;
}

function StatusMessage({ status }: StatusMessageProps): JSX.Element | null {
  if (!status) return null;
  return (
    <div
      className={`p-3 rounded-lg mb-4 text-sm ${
        status.type === "success"
          ? "bg-status-successLight text-status-successDark"
          : "bg-status-errorLight text-status-errorDark"
      }`}
    >
      {status.message}
    </div>
  );
}

type DemoStatusSetter = (
  status: { type: "success" | "error"; message: string } | null,
) => void;

async function loadDemoData(
  setStatus: DemoStatusSetter,
  setIsLoading: (value: boolean) => void,
): Promise<void> {
  setIsLoading(true);
  setStatus(null);
  try {
    const { seedDemoData } = await import("../services/demo-data");
    const result = await seedDemoData();
    setStatus({
      type: "success",
      message: `Loaded demo data: ${result.students.length} students, ${result.activitiesCreated} activities. Refresh the page to see changes.`,
    });
  } catch (error) {
    setStatus({
      type: "error",
      message:
        error instanceof Error ? error.message : "Failed to load demo data",
    });
  } finally {
    setIsLoading(false);
  }
}

async function clearDemoDataHandler(
  setStatus: DemoStatusSetter,
  setIsLoading: (value: boolean) => void,
): Promise<void> {
  if (!confirm("Remove demo students (Emma & Liam) and all their data?"))
    return;
  setIsLoading(true);
  setStatus(null);
  try {
    const { clearDemoData } = await import("../services/demo-data");
    await clearDemoData();
    setStatus({
      type: "success",
      message: "Demo data cleared. Refresh to see changes.",
    });
  } catch (error) {
    setStatus({
      type: "error",
      message:
        error instanceof Error ? error.message : "Failed to clear demo data",
    });
  } finally {
    setIsLoading(false);
  }
}

function DemoDataSection() {
  const [status, setStatus] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  return (
    <Card className="mb-8">
      <h2 className="text-lg font-semibold text-gray-900 mb-2">Demo Data</h2>
      <p className="text-sm text-gray-600 mb-4">
        Load sample data for demos and testing. Creates two students (Emma &amp;
        Liam) with 3 weeks of activities, milestones, books, and field trips.
      </p>

      <StatusMessage status={status} />

      <div className="flex gap-3">
        <Button
          variant="primary"
          onClick={() => loadDemoData(setStatus, setIsLoading)}
          disabled={isLoading}
        >
          {isLoading ? "Loading..." : "Load Demo Data"}
        </Button>
        <Button
          variant="danger"
          onClick={() => clearDemoDataHandler(setStatus, setIsLoading)}
          disabled={isLoading}
        >
          Clear Demo Data
        </Button>
      </div>
    </Card>
  );
}

// --- Data Management Section ---

type ExportStatusSetter = (
  status: {
    type: "success" | "error";
    message: string;
  } | null,
) => void;

async function handleExportJSON(
  setExportStatus: ExportStatusSetter,
  setIsExporting: (value: boolean) => void,
): Promise<void> {
  setIsExporting(true);
  setExportStatus(null);
  try {
    const result = await window.api.exportDataJSON();
    if (result.success) {
      setExportStatus({
        type: "success",
        message: `Data exported to ${result.filePath}`,
      });
    } else if (result.error !== "Cancelled") {
      setExportStatus({
        type: "error",
        message: result.error || "Export failed",
      });
    }
  } catch {
    setExportStatus({ type: "error", message: "Export failed" });
  } finally {
    setIsExporting(false);
  }
}

async function handleExportCSV(
  setExportStatus: ExportStatusSetter,
  setIsExporting: (value: boolean) => void,
): Promise<void> {
  setIsExporting(true);
  setExportStatus(null);
  try {
    const result = await window.api.exportActivitiesCSV();
    if (result.success) {
      setExportStatus({
        type: "success",
        message: `Activities exported to ${result.filePath}`,
      });
    } else if (result.error !== "Cancelled") {
      setExportStatus({
        type: "error",
        message: result.error || "Export failed",
      });
    }
  } catch {
    setExportStatus({ type: "error", message: "Export failed" });
  } finally {
    setIsExporting(false);
  }
}

function DataManagement() {
  const [exportStatus, setExportStatus] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);
  const [isExporting, setIsExporting] = useState(false);

  return (
    <Card className="mb-8">
      <h2 className="text-lg font-semibold text-gray-900 mb-2">
        Data Management
      </h2>
      <p className="text-sm text-gray-600 mb-4">
        Export your data for backup or use in other applications.
      </p>

      <StatusMessage status={exportStatus} />

      <div className="flex gap-3">
        <Button
          variant="secondary"
          onClick={() => handleExportJSON(setExportStatus, setIsExporting)}
          disabled={isExporting}
        >
          Export All Data (JSON)
        </Button>
        <Button
          variant="secondary"
          onClick={() => handleExportCSV(setExportStatus, setIsExporting)}
          disabled={isExporting}
        >
          Export Activities (CSV)
        </Button>
      </div>
      <p className="text-xs text-gray-500 mt-3">
        JSON export includes students, activities, milestones, books,
        assessments, and attendance. CSV export includes activities with student
        and subject names for use in spreadsheets.
      </p>
    </Card>
  );
}
