import { useState, useEffect } from "react";
import { PortfolioNarrative } from "../aiInsights";
import type {
  PortfolioConfig,
  PortfolioSection,
  Student,
} from "../../../../shared/types";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";

interface Props {
  students: Student[];
}

const DEFAULT_SECTIONS: PortfolioSection[] = [
  { id: "cover", name: "Cover Page", enabled: true },
  { id: "student-info", name: "Student Information", enabled: true },
  { id: "narrative", name: "AI Narrative Summary", enabled: false },
  { id: "attendance", name: "Attendance Record", enabled: true },
  { id: "activities", name: "Learning Activities", enabled: true },
  { id: "subjects", name: "Subject Summaries", enabled: true },
  { id: "reading", name: "Reading Log", enabled: true },
  { id: "milestones", name: "Milestones", enabled: true },
  { id: "photos", name: "Photo Gallery", enabled: false },
];

export function PortfolioExport({ students }: Props) {
  const [selectedStudentId, setSelectedStudentId] = useState<string>("");
  const [schoolYear, setSchoolYear] = useState<string>("");
  const [title, setTitle] = useState("Homeschool Portfolio");
  const [subtitle, setSubtitle] = useState("");
  const [sections, setSections] =
    useState<PortfolioSection[]>(DEFAULT_SECTIONS);
  const [includePhotos, setIncludePhotos] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successPath, setSuccessPath] = useState<string | null>(null);

  // Load current school year on mount
  useEffect(() => {
    window.api
      .getCurrentSchoolYear()
      .then(setSchoolYear)
      .catch((error) => {
        console.error("[PortfolioExport] Failed to load school year:", error);
      });
  }, []);

  // Auto-select first student
  useEffect(() => {
    if (!selectedStudentId && students.length > 0) {
      setSelectedStudentId(students[0].id);
    }
  }, [students, selectedStudentId]);

  const selectedStudent = students.find((s) => s.id === selectedStudentId);

  // Calculate date range from school year
  const getDateRange = () => {
    const [startYear] = schoolYear.split("/");
    return {
      startDate: `${startYear}-08-01`,
      endDate: `${parseInt(startYear) + 1}-07-31`,
    };
  };

  const handleSectionToggle = (sectionId: string) => {
    setSections((prev) =>
      prev.map((s) => (s.id === sectionId ? { ...s, enabled: !s.enabled } : s)),
    );

    // Enable photos if photo section is enabled
    if (sectionId === "photos") {
      const photoSection = sections.find((s) => s.id === "photos");
      if (photoSection && !photoSection.enabled) {
        setIncludePhotos(true);
      } else {
        setIncludePhotos(false);
      }
    }
  };

  const handleGenerate = async () => {
    if (!selectedStudentId || !schoolYear) {
      setError("Please select a student and school year");
      return;
    }

    setIsGenerating(true);
    setError(null);
    setSuccessPath(null);

    try {
      const config: PortfolioConfig = {
        title,
        subtitle: subtitle || undefined,
        schoolYear,
        studentId: selectedStudentId,
        dateRange: getDateRange(),
        sections,
        includePhotos,
        includeSummaryStats: true,
      };

      const result = await window.api.generatePortfolioPDF(config);

      if (result.success && result.filePath) {
        setSuccessPath(result.filePath);
      } else {
        setError(result.error || "Failed to generate PDF");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleOpenFile = async () => {
    if (successPath) {
      await window.api.openPortfolioFile(successPath);
    }
  };

  return (
    <div className="bg-neutral-surface rounded-lg shadow p-6">
      <h2 className="text-xl font-semibold text-neutral-text mb-6">
        Generate Portfolio PDF
      </h2>

      <div className="space-y-6">
        {/* Student Selection */}
        <div>
          <label className="block text-sm font-medium text-neutral-text mb-2">
            Student
          </label>
          <select
            value={selectedStudentId}
            onChange={(e) => setSelectedStudentId(e.target.value)}
            className="w-full px-3 py-2 border border-neutral-border rounded-lg
              bg-neutral-surface text-neutral-text"
          >
            <option value="">Select a student...</option>
            {students.map((student) => (
              <option key={student.id} value={student.id}>
                {student.name} ({student.gradeLevel})
              </option>
            ))}
          </select>
        </div>

        {/* School Year */}
        <div>
          <label className="block text-sm font-medium text-neutral-text mb-2">
            School Year
          </label>
          <select
            value={schoolYear}
            onChange={(e) => setSchoolYear(e.target.value)}
            className="w-full px-3 py-2 border border-neutral-border rounded-lg
              bg-neutral-surface text-neutral-text"
          >
            <option value="">Select school year...</option>
            {/* Generate last 3 school years as options */}
            {[0, 1, 2].map((offset) => {
              const year = new Date().getFullYear() - offset;
              const month = new Date().getMonth();
              const startYear = month < 7 ? year - 1 - offset : year - offset;
              const yearStr = `${startYear}/${startYear + 1}`;
              return (
                <option key={yearStr} value={yearStr}>
                  {yearStr}
                </option>
              );
            })}
          </select>
        </div>

        {/* Title */}
        <div>
          <label className="block text-sm font-medium text-neutral-text mb-2">
            Portfolio Title
          </label>
          <Input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Homeschool Portfolio"
          />
        </div>

        {/* Subtitle */}
        <div>
          <label className="block text-sm font-medium text-neutral-text mb-2">
            Subtitle (optional)
          </label>
          <Input
            type="text"
            value={subtitle}
            onChange={(e) => setSubtitle(e.target.value)}
            placeholder="e.g., A Year of Discovery"
          />
        </div>

        {/* Sections */}
        <div>
          <label className="block text-sm font-medium text-neutral-text mb-2">
            Include Sections
          </label>
          <div className="grid grid-cols-2 gap-3">
            {sections.map((section) => (
              <label
                key={section.id}
                className="flex items-center gap-2 p-3 rounded-lg border border-neutral-border
                  hover:bg-neutral-background cursor-pointer"
              >
                <Input
                  type="checkbox"
                  checked={section.enabled}
                  onChange={() => handleSectionToggle(section.id)}
                  className="w-4 h-4"
                />
                <span className="text-sm text-neutral-text">
                  {section.name}
                </span>
              </label>
            ))}
          </div>
        </div>

        {/* AI Narrative Generator - show when narrative section is enabled */}
        {sections.find((s) => s.id === "narrative")?.enabled &&
          selectedStudent &&
          schoolYear && (
            <div className="border border-brand-primary/30 rounded-lg p-4 bg-brand-primaryLight">
              <PortfolioNarrative
                studentId={selectedStudent.id}
                studentName={selectedStudent.name}
                gradeLevel={selectedStudent.gradeLevel}
                schoolYear={schoolYear}
                dateRange={getDateRange()}
                onNarrativeGenerated={() => {}}
              />
            </div>
          )}

        {/* Error Message */}
        {error && (
          <div
            className="p-4 bg-status-errorLight border border-status-error/30 rounded-lg"
            role="alert"
          >
            <p className="text-sm text-status-errorDark">{error}</p>
          </div>
        )}

        {/* Success Message */}
        {successPath && (
          <div
            className="p-4 bg-status-successLight border border-status-success/30 rounded-lg"
            role="status"
          >
            <p className="text-sm text-status-successDark mb-2">
              Portfolio generated successfully!
            </p>
            <p className="text-xs text-status-success mb-3 font-mono break-all">
              {successPath}
            </p>
            <Button
              onClick={handleOpenFile}
              variant="primary"
              size="sm"
              className="bg-status-success hover:bg-status-successDark"
            >
              Open PDF
            </Button>
          </div>
        )}

        {/* Generate Button */}
        <Button
          onClick={handleGenerate}
          disabled={isGenerating || !selectedStudentId || !schoolYear}
          variant="primary"
          loading={isGenerating}
          className="w-full"
          aria-busy={isGenerating}
        >
          {isGenerating ? "Generating PDF..." : "Generate Portfolio PDF"}
        </Button>

        {/* Info */}
        <div className="text-sm text-neutral-textSecondary">
          <p>
            The portfolio will be saved to your Documents folder in "Homeschool
            Portfolios".
            {selectedStudent && schoolYear && (
              <span className="block mt-1">
                Date range: August 1, {schoolYear.split("/")[0]} - July 31,{" "}
                {schoolYear.split("/")[1]}
              </span>
            )}
          </p>
        </div>
      </div>
    </div>
  );
}
