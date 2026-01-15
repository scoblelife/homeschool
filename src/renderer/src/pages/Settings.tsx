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
  CreateStudent,
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

// Student color palette
const STUDENT_COLORS = [
  {
    id: "fuchsia",
    name: "Fuchsia",
    bg: "bg-fuchsia-500",
    ring: "ring-fuchsia-500",
    bgLight: "bg-fuchsia-50",
    border: "border-l-fuchsia-500",
    text: "text-fuchsia-600",
  },
  {
    id: "teal",
    name: "Teal",
    bg: "bg-teal-500",
    ring: "ring-teal-500",
    bgLight: "bg-teal-50",
    border: "border-l-teal-500",
    text: "text-teal-600",
  },
  {
    id: "blue",
    name: "Blue",
    bg: "bg-blue-500",
    ring: "ring-blue-500",
    bgLight: "bg-blue-50",
    border: "border-l-blue-500",
    text: "text-blue-600",
  },
  {
    id: "orange",
    name: "Orange",
    bg: "bg-orange-500",
    ring: "ring-orange-500",
    bgLight: "bg-orange-50",
    border: "border-l-orange-500",
    text: "text-orange-600",
  },
  {
    id: "purple",
    name: "Purple",
    bg: "bg-purple-500",
    ring: "ring-purple-500",
    bgLight: "bg-purple-50",
    border: "border-l-purple-500",
    text: "text-purple-600",
  },
  {
    id: "green",
    name: "Green",
    bg: "bg-green-500",
    ring: "ring-green-500",
    bgLight: "bg-green-50",
    border: "border-l-green-500",
    text: "text-green-600",
  },
] as const;

export function getStudentColor(colorId: string) {
  // Handle legacy 'child1'/'child2' values
  if (colorId === "child1") return STUDENT_COLORS[0];
  if (colorId === "child2") return STUDENT_COLORS[1];
  return STUDENT_COLORS.find((c) => c.id === colorId) || STUDENT_COLORS[0];
}

export default function Settings(): JSX.Element {
  const { students, createStudent, updateStudent, deleteStudent } =
    useStudents();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<string | null>(null);
  const [formData, setFormData] = useState<{
    name: string;
    dateOfBirth: string;
    gradeLevel: GradeLevel;
    color: string;
    calendarFeedUrl: string;
  }>({
    name: "",
    dateOfBirth: "",
    gradeLevel: "pre-k",
    color: "child1",
    calendarFeedUrl: "",
  });

  // Google Calendar state
  const [googleAuthStatus, setGoogleAuthStatus] = useState<{
    hasCredentials: boolean;
    isAuthenticated: boolean;
  } | null>(null);
  const [calendars, setCalendars] = useState<GoogleCalendarInfo[]>([]);
  const [selectedCalendarId, setSelectedCalendarId] = useState<string | null>(
    null,
  );
  const [isConnecting, setIsConnecting] = useState(false);

  // Skylight Chore Mapping state
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [choreMappings, setChoreMappings] = useState<SubjectChoreMapping[]>([]);
  const [mappingForm, setMappingForm] = useState<
    Record<string, { choreName: string; defaultStars: number }>
  >({});

  // Email Summary state
  const [emailConfig, setEmailConfig] = useState<EmailSummaryConfig>({
    enabled: false,
    recipientEmail: "",
    method: "mailto",
  });
  const [emailPreviewHtml, setEmailPreviewHtml] = useState<string | null>(null);
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [emailStatus, setEmailStatus] = useState<{
    success?: boolean;
    message?: string;
  } | null>(null);

  // State Requirements state
  const [selectedStateCode, setSelectedStateCode] = useState<string | null>(
    null,
  );
  const [stateInfo, setStateInfo] = useState<StateRequirements | null>(null);
  const availableStates = getAllStates();

  // Certificate state
  const [certificateStudent, setCertificateStudent] = useState<Student | null>(
    null,
  );

  // Load Google auth status on mount
  useEffect(() => {
    loadGoogleAuthStatus();
  }, []);

  // Load subjects and chore mappings on mount
  useEffect(() => {
    loadSubjectsAndMappings();
  }, []);

  // Load email config on mount
  useEffect(() => {
    loadEmailConfig();
  }, []);

  // Load state requirements on mount
  useEffect(() => {
    loadStateSelection();
  }, []);

  const loadStateSelection = async (): Promise<void> => {
    const savedState = await window.api.getSetting("homeschool_state");
    if (savedState) {
      setSelectedStateCode(savedState);
      setStateInfo(getStateRequirements(savedState));
    }
  };

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

  const loadEmailConfig = async (): Promise<void> => {
    const [enabled, recipientEmail, method, resendApiKey] = await Promise.all([
      window.api.getSetting("email_summary_enabled"),
      window.api.getSetting("email_summary_recipient"),
      window.api.getSetting("email_summary_method"),
      window.api.getSetting("email_summary_resend_api_key"),
    ]);
    setEmailConfig({
      enabled: enabled === "true",
      recipientEmail: recipientEmail || "",
      method: (method as "mailto" | "resend") || "mailto",
      resendApiKey: resendApiKey || undefined,
    });
  };

  const saveEmailConfig = async (config: EmailSummaryConfig): Promise<void> => {
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
    setEmailConfig(config);
  };

  const generateWeeklySummaryData =
    async (): Promise<WeeklySummaryEmailData> => {
      const now = new Date();
      const weekStart = startOfWeek(now, { weekStartsOn: 0 }); // Sunday
      const weekEnd = endOfWeek(now, { weekStartsOn: 0 });

      const studentSummaries = await Promise.all(
        students.map(async (student) => {
          const activitySummary = await window.api.getActivitySummary(
            student.id,
            format(weekStart, "yyyy-MM-dd"),
            format(weekEnd, "yyyy-MM-dd"),
          );
          const dailySummaries = await window.api.getDailySummaries(
            student.id,
            format(weekStart, "yyyy-MM-dd"),
            format(weekEnd, "yyyy-MM-dd"),
          );

          const totalActivities = activitySummary.reduce(
            (sum, s) => sum + s.totalActivities,
            0,
          );
          const totalMinutes = activitySummary.reduce(
            (sum, s) => sum + s.totalMinutes,
            0,
          );
          const activeDays = dailySummaries.filter(
            (d) => d.activitiesCount > 0,
          ).length;

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
        }),
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
    };

  const handlePreviewEmail = async (): Promise<void> => {
    const data = await generateWeeklySummaryData();
    const html = await window.api.generateEmailPreview(data);
    setEmailPreviewHtml(html);
  };

  const handleSendTestEmail = async (): Promise<void> => {
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
      const data = await generateWeeklySummaryData();
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
        message:
          error instanceof Error ? error.message : "Failed to send email",
      });
    } finally {
      setIsSendingEmail(false);
    }
  };

  const loadSubjectsAndMappings = async (): Promise<void> => {
    const [subjectList, mappingList] = await Promise.all([
      window.api.getSubjects(),
      window.api.getChoreMappings(),
    ]);
    setSubjects(subjectList);
    setChoreMappings(mappingList);

    // Initialize form with existing mappings
    const formData: Record<
      string,
      { choreName: string; defaultStars: number }
    > = {};
    for (const subject of subjectList) {
      const mapping = mappingList.find((m) => m.subjectId === subject.id);
      formData[subject.id] = {
        choreName: mapping?.choreName || "",
        defaultStars: mapping?.defaultStars || 1,
      };
    }
    setMappingForm(formData);
  };

  const handleSaveMapping = async (subjectId: string): Promise<void> => {
    const data = mappingForm[subjectId];
    if (!data.choreName.trim()) {
      // Delete mapping if chore name is empty
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

  const loadGoogleAuthStatus = async (): Promise<void> => {
    const status = await window.api.getGoogleAuthStatus();
    setGoogleAuthStatus(status);

    if (status.isAuthenticated) {
      // Load calendars and selected calendar
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

  const openAddModal = (): void => {
    setEditingStudent(null);
    setFormData({
      name: "",
      dateOfBirth: "",
      gradeLevel: "pre-k",
      color: STUDENT_COLORS[students.length % STUDENT_COLORS.length].id,
      calendarFeedUrl: "",
    });
    setIsModalOpen(true);
  };

  const openEditModal = (studentId: string): void => {
    const student = students.find((s) => s.id === studentId);
    if (!student) return;

    setEditingStudent(studentId);
    setFormData({
      name: student.name,
      dateOfBirth: student.dateOfBirth,
      gradeLevel: student.gradeLevel,
      color: student.color,
      calendarFeedUrl: student.calendarFeedUrl || "",
    });
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
    if (
      confirm(
        "Are you sure you want to delete this student? This will also delete all their activities and sessions.",
      )
    ) {
      await deleteStudent(id);
    }
  };

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-8">Settings</h1>
      {/* Students Section */}
      <Card className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Students</h2>
          <Button variant="primary" onClick={openAddModal}>
            + Add Student
          </Button>
        </div>

        {students.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500 mb-4">No students added yet.</p>
            <Button variant="primary" onClick={openAddModal}>
              Add Your First Student
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {students.map((student) => (
              <div
                key={student.id}
                className={`flex items-center gap-4 p-4 bg-gray-50 rounded-lg border-l-4 ${
                  getStudentColor(student.color).border
                }`}
              >
                <div
                  className={`w-12 h-12 rounded-full flex items-center justify-center text-white text-lg font-bold ${
                    getStudentColor(student.color).bg
                  }`}
                >
                  {student.name.charAt(0)}
                </div>
                <div className="flex-1">
                  <div className="font-semibold text-gray-900">
                    {student.name}
                  </div>
                  <div className="text-sm text-gray-500">
                    {student.gradeLevel === "pre-k"
                      ? "Pre-K"
                      : student.gradeLevel === "1st"
                        ? "1st Grade"
                        : "2nd Grade"}{" "}
                    • Born{" "}
                    {format(parseISO(student.dateOfBirth), "MMMM d, yyyy")}
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="secondary"
                    onClick={() => setCertificateStudent(student)}
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
                    onClick={() => openEditModal(student.id)}
                    className="text-sm"
                  >
                    Edit
                  </Button>
                  <Button
                    variant="danger"
                    onClick={() => handleDelete(student.id)}
                    className="text-sm"
                  >
                    Delete
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
      {/* State Requirements Section */}
      <Card className="mb-8">
        <h2 className="text-lg font-semibold text-gray-900 mb-2">
          State Requirements
        </h2>
        <p className="text-sm text-gray-600 mb-4">
          Select your state to see homeschool requirements and ensure
          compliance.
        </p>

        <div className="mb-4">
          <label className="label">Your State</label>
          <select
            value={selectedStateCode || ""}
            onChange={(e) => handleStateChange(e.target.value)}
            className="input"
          >
            <option value="">Select your state...</option>
            {availableStates.map((state) => (
              <option key={state.code} value={state.code}>
                {state.name}
              </option>
            ))}
          </select>
        </div>

        {stateInfo && (
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-medium text-gray-900">
                {stateInfo.name} Requirements
              </h3>
              <span
                className={`text-xs px-2 py-1 rounded-full ${
                  stateInfo.regulationLevel === "minimal"
                    ? "bg-green-100 text-green-800"
                    : stateInfo.regulationLevel === "low"
                      ? "bg-blue-100 text-blue-800"
                      : stateInfo.regulationLevel === "moderate"
                        ? "bg-amber-100 text-amber-800"
                        : "bg-red-100 text-red-800"
                }`}
              >
                {stateInfo.regulationLevel.charAt(0).toUpperCase() +
                  stateInfo.regulationLevel.slice(1)}{" "}
                Regulation
              </span>
            </div>

            <ul className="space-y-2 text-sm text-gray-600 mb-4">
              {formatRequirements(stateInfo).map((req, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="text-fuchsia-500 mt-0.5">
                    <svg
                      className="w-4 h-4"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
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

            {stateInfo.notes && (
              <div className="text-sm text-gray-600 bg-white rounded p-3 border border-gray-200">
                <strong>Notes:</strong> {stateInfo.notes}
              </div>
            )}

            {stateInfo.resources.length > 0 && (
              <div className="mt-3">
                <div className="text-xs text-gray-500 mb-1">
                  Official Resources:
                </div>
                {stateInfo.resources.map((url, i) => (
                  <a
                    key={i}
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-fuchsia-600 hover:text-fuchsia-700 block truncate"
                  >
                    {url}
                  </a>
                ))}
              </div>
            )}
          </div>
        )}
      </Card>
      {/* Family Sync Section */}
      <div className="mb-8">
        <SyncSettings />
      </div>
      {/* Google Calendar Section */}
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
              onClick={handleConnectGoogle}
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
          <div className="space-y-4">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center gap-3">
              <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center text-white">
                <svg
                  className="w-5 h-5"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div>
                <p className="font-medium text-green-800">
                  Connected to Google Calendar
                </p>
                <p className="text-sm text-green-600">
                  Ready to sync milestones
                </p>
              </div>
            </div>

            <div>
              <label className="label">Sync to Calendar</label>
              <select
                value={selectedCalendarId || ""}
                onChange={(e) => handleSelectCalendar(e.target.value)}
                className="input"
              >
                <option value="">Select a calendar...</option>
                {calendars.map((cal) => (
                  <option key={cal.id} value={cal.id}>
                    {cal.summary} {cal.primary ? "(Primary)" : ""}
                  </option>
                ))}
              </select>
              <p className="text-xs text-gray-500 mt-1">
                Milestones from your weekly plan will be synced to this
                calendar.
              </p>
            </div>

            <Button
              variant="secondary"
              onClick={handleDisconnectGoogle}
              className="text-red-600"
            >
              Disconnect Google Calendar
            </Button>
          </div>
        )}
      </Card>
      {/* Email Summary Section */}
      <Card className="mb-8">
        <h2 className="text-lg font-semibold text-gray-900 mb-2">
          Weekly Email Summary
        </h2>
        <p className="text-sm text-gray-600 mb-4">
          Receive a weekly email summarizing your students' homeschool
          activities.
        </p>

        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="email-enabled"
              checked={emailConfig.enabled}
              onChange={(e) =>
                saveEmailConfig({ ...emailConfig, enabled: e.target.checked })
              }
              className="w-4 h-4 text-fuchsia-600 rounded focus:ring-fuchsia-500"
            />
            <label
              htmlFor="email-enabled"
              className="text-sm font-medium text-gray-700"
            >
              Enable weekly email summaries
            </label>
          </div>

          <div>
            <label className="label">Recipient Email</label>
            <Input
              type="email"
              value={emailConfig.recipientEmail}
              onChange={(e) =>
                setEmailConfig({
                  ...emailConfig,
                  recipientEmail: e.target.value,
                })
              }
              onBlur={() => saveEmailConfig(emailConfig)}
              placeholder="your@email.com"
            />
          </div>

          <div>
            <label className="label">Send Method</label>
            <select
              value={emailConfig.method}
              onChange={(e) =>
                saveEmailConfig({
                  ...emailConfig,
                  method: e.target.value as "mailto" | "resend",
                })
              }
              className="input"
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
              <label className="label">Resend API Key</label>
              <Input
                type="password"
                value={emailConfig.resendApiKey || ""}
                onChange={(e) =>
                  setEmailConfig({
                    ...emailConfig,
                    resendApiKey: e.target.value,
                  })
                }
                onBlur={() => saveEmailConfig(emailConfig)}
                placeholder="re_xxxxxxxxxxxx"
              />
              <p className="text-xs text-gray-500 mt-1">
                Get your API key from{" "}
                <a
                  href="https://resend.com/api-keys"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-fuchsia-600 hover:text-fuchsia-700"
                >
                  resend.com/api-keys
                </a>
              </p>
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <Button variant="secondary" onClick={handlePreviewEmail}>
              Preview Email
            </Button>
            <Button
              variant="primary"
              onClick={handleSendTestEmail}
              disabled={isSendingEmail || !emailConfig.recipientEmail}
            >
              {isSendingEmail ? "Sending..." : "Send Test Email"}
            </Button>
          </div>

          {emailStatus && (
            <div
              className={`p-3 rounded-lg text-sm ${
                emailStatus.success
                  ? "bg-green-50 text-green-800 border border-green-200"
                  : "bg-red-50 text-red-800 border border-red-200"
              }`}
            >
              {emailStatus.message}
            </div>
          )}
        </div>
      </Card>
      {/* Email Preview Modal */}
      <Dialog
        open={emailPreviewHtml !== null}
        onClose={() => setEmailPreviewHtml(null)}
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
                onClick={() => setEmailPreviewHtml(null)}
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
      {/* Skylight Chore Mapping Section */}
      <Card className="mb-8">
        <h2 className="text-lg font-semibold text-gray-900 mb-2">
          Skylight Chore Mapping
        </h2>
        <p className="text-sm text-gray-600 mb-4">
          Map each subject to a Skylight chore name. When you complete
          milestones, you'll see these names in the daily checklist.
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
                <div
                  key={subject.id}
                  className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg"
                >
                  <div className="w-32 font-medium text-gray-700 truncate">
                    {subject.name}
                  </div>
                  <span className="text-gray-400">→</span>
                  <input
                    type="text"
                    value={formValue.choreName}
                    onChange={(e) =>
                      setMappingForm({
                        ...mappingForm,
                        [subject.id]: {
                          ...formValue,
                          choreName: e.target.value,
                        },
                      })
                    }
                    onBlur={() => handleSaveMapping(subject.id)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-fuchsia-500 focus:border-fuchsia-500"
                    placeholder="Skylight chore name..."
                  />
                  <span className="text-yellow-500">⭐</span>
                  <input
                    type="number"
                    min={1}
                    max={10}
                    value={formValue.defaultStars}
                    onChange={(e) =>
                      setMappingForm({
                        ...mappingForm,
                        [subject.id]: {
                          ...formValue,
                          defaultStars: parseInt(e.target.value) || 1,
                        },
                      })
                    }
                    onBlur={() => handleSaveMapping(subject.id)}
                    className="w-16 px-2 py-2 border border-gray-300 rounded-lg text-center focus:ring-fuchsia-500 focus:border-fuchsia-500"
                  />
                  {hasMapping && (
                    <span className="text-green-500 text-sm">✓</span>
                  )}
                </div>
              );
            })}
          </div>
        )}

        <p className="text-xs text-gray-500 mt-4">
          These mappings are used when generating the daily Skylight checklist
          for completed milestones.
        </p>
      </Card>
      {/* Support Section */}
      <Card className="mb-8">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Support</h2>
        <p className="text-sm text-gray-600 mb-4">
          Have feedback, found a bug, or want to request a feature? We'd love to
          hear from you.
        </p>
        <FeedbackButton className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors" />
      </Card>
      {/* About Section */}
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
      {/* Add/Edit Student Modal */}
      <Dialog
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        className="relative z-50"
      >
        <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <Dialog.Panel className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <Dialog.Title className="text-lg font-semibold text-gray-900 mb-4">
              {editingStudent ? "Edit Student" : "Add Student"}
            </Dialog.Title>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="label">Name</label>
                <Input
                  type="text"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  placeholder="Enter student name"
                  required
                />
              </div>

              <div>
                <label className="label">Date of Birth</label>
                <Input
                  type="date"
                  value={formData.dateOfBirth}
                  onChange={(e) =>
                    setFormData({ ...formData, dateOfBirth: e.target.value })
                  }
                  required
                />
              </div>

              <div>
                <label className="label">Grade Level</label>
                <select
                  value={formData.gradeLevel}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      gradeLevel: e.target.value as GradeLevel,
                    })
                  }
                  className="input"
                >
                  <option value="pre-k">Pre-K (4 years old)</option>
                  <option value="1st">1st Grade (6 years old)</option>
                  <option value="2nd">2nd Grade (7 years old)</option>
                </select>
              </div>

              <div>
                <label className="label">Color</label>
                <div className="grid grid-cols-3 gap-2">
                  {STUDENT_COLORS.map((color) => {
                    const isSelected =
                      formData.color === color.id ||
                      (formData.color === "child1" && color.id === "fuchsia") ||
                      (formData.color === "child2" && color.id === "teal");
                    return (
                      <button
                        key={color.id}
                        type="button"
                        onClick={() =>
                          setFormData({ ...formData, color: color.id })
                        }
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
              </div>

              <div>
                <label className="label">
                  Google Calendar Feed URL (optional)
                </label>
                <Input
                  type="url"
                  value={formData.calendarFeedUrl}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      calendarFeedUrl: e.target.value,
                    })
                  }
                  placeholder="https://calendar.google.com/calendar/ical/..."
                />
                <p className="text-xs text-gray-500 mt-1">
                  Get this from Google Calendar → Settings → Your Calendar →
                  Secret address in iCal format
                </p>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <Button
                  variant="secondary"
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                >
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
      {/* Grade Certificate Modal */}
      {certificateStudent && (
        <GradeCertificate
          student={certificateStudent}
          isOpen={!!certificateStudent}
          onClose={() => setCertificateStudent(null)}
        />
      )}
    </div>
  );
}
