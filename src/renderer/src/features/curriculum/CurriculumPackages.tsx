import { useState, useEffect } from "react";
import { useStore } from "../../stores/useStore";
import type {
  CurriculumPackage,
  CreateCurriculumPackage,
  GradeLevel,
  SponsoredResource,
} from "../../../../shared/types";
import { FeaturedCurriculumCard } from "./FeaturedCurriculumCard";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import { Input, Textarea, Label } from "../../components/ui/Input";
import { Checkbox } from "../../components/ui/Checkbox";

// Popular curriculum packages for suggestions
const POPULAR_PACKAGES = [
  { name: "Saxon Math", publisher: "Saxon Publishers" },
  { name: "Abeka", publisher: "Pensacola Christian College" },
  { name: "BJU Press", publisher: "Bob Jones University" },
  { name: "Math-U-See", publisher: "Demme Learning" },
  { name: "Singapore Math", publisher: "Marshall Cavendish" },
  { name: "Teaching Textbooks", publisher: "Teaching Textbooks" },
  { name: "All About Reading", publisher: "All About Learning Press" },
  { name: "Sonlight", publisher: "Sonlight Curriculum" },
  { name: "Mystery of History", publisher: "Bright Ideas Press" },
  { name: "Story of the World", publisher: "Well-Trained Mind Press" },
  { name: "Life of Fred", publisher: "Stanley Schmidt" },
  { name: "Classical Conversations", publisher: "Classical Conversations" },
];

const GRADE_LEVELS: { value: GradeLevel; label: string }[] = [
  { value: "pre-k", label: "Pre-K" },
  { value: "1st", label: "1st Grade" },
  { value: "2nd", label: "2nd Grade" },
  { value: "3rd", label: "3rd Grade" },
  { value: "4th", label: "4th Grade" },
  { value: "5th", label: "5th Grade" },
];

export function CurriculumPackages() {
  const { subjects } = useStore();
  const [packages, setPackages] = useState<CurriculumPackage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [sponsoredCurricula, setSponsoredCurricula] = useState<
    SponsoredResource[]
  >([]);
  const [formData, setFormData] = useState<Partial<CreateCurriculumPackage>>({
    name: "",
    publisher: "",
    subjectIds: [],
    gradeLevels: [],
    websiteUrl: "",
    notes: "",
    isSponsored: false,
    isActive: true,
  });

  useEffect(() => {
    loadPackages();
    loadSponsoredCurricula();
  }, []);

  const loadPackages = async () => {
    setIsLoading(true);
    try {
      const data = await window.api.getCurriculumPackages();
      setPackages(data);
    } catch (err) {
      console.error("Failed to load packages:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const loadSponsoredCurricula = async () => {
    try {
      const resources = await window.api.getSponsoredResources({
        location: "curriculum_page",
        activeOnly: true,
        limit: 6,
      });
      setSponsoredCurricula(resources);
    } catch (error) {
      console.error("Failed to load sponsored curricula:", error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name) return;

    try {
      if (editingId) {
        await window.api.updateCurriculumPackage(editingId, formData);
      } else {
        await window.api.createCurriculumPackage(
          formData as CreateCurriculumPackage,
        );
      }
      await loadPackages();
      resetForm();
    } catch (err) {
      console.error("Failed to save package:", err);
    }
  };

  const handleEdit = (pkg: CurriculumPackage) => {
    setEditingId(pkg.id);
    setFormData({
      name: pkg.name,
      publisher: pkg.publisher || "",
      subjectIds: pkg.subjectIds,
      gradeLevels: pkg.gradeLevels,
      websiteUrl: pkg.websiteUrl || "",
      notes: pkg.notes || "",
      isSponsored: pkg.isSponsored || false,
      isActive: pkg.isActive,
    });
    setShowAddForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this package?")) return;
    try {
      await window.api.deleteCurriculumPackage(id);
      await loadPackages();
    } catch (err) {
      console.error("Failed to delete package:", err);
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      publisher: "",
      subjectIds: [],
      gradeLevels: [],
      websiteUrl: "",
      notes: "",
      isSponsored: false,
      isActive: true,
    });
    setEditingId(null);
    setShowAddForm(false);
  };

  const toggleSubject = (subjectId: string) => {
    const current = formData.subjectIds || [];
    const newSubjects = current.includes(subjectId)
      ? current.filter((id) => id !== subjectId)
      : [...current, subjectId];
    setFormData({ ...formData, subjectIds: newSubjects });
  };

  const toggleGradeLevel = (level: GradeLevel) => {
    const current = formData.gradeLevels || [];
    const newLevels = current.includes(level)
      ? current.filter((l) => l !== level)
      : [...current, level];
    setFormData({ ...formData, gradeLevels: newLevels });
  };

  const selectSuggestion = (suggestion: {
    name: string;
    publisher: string;
  }) => {
    setFormData({
      ...formData,
      name: suggestion.name,
      publisher: suggestion.publisher,
    });
  };

  const handleQuickAdd = (curriculum: SponsoredResource) => {
    // Pre-fill form with sponsored curriculum data
    setFormData({
      name: curriculum.name,
      publisher: "", // Sponsor name not included, user can fill in
      subjectIds: [],
      gradeLevels: curriculum.gradeLevels
        .map((gl) => gl as GradeLevel)
        .filter((gl) =>
          ["pre-k", "1st", "2nd", "3rd", "4th", "5th"].includes(gl),
        ),
      websiteUrl: curriculum.url,
      notes: curriculum.description,
      isSponsored: false,
      isActive: true,
    });
    setShowAddForm(true);
  };

  const handleLearnMore = (curriculum: SponsoredResource) => {
    // Open sponsor URL in new tab
    window.open(curriculum.url, "_blank", "noopener,noreferrer");
  };

  if (isLoading) {
    return (
      <div className="text-center text-gray-500 py-8">
        Loading curriculum packages...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Curriculum Packages
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Track the commercial curriculum products your family uses
          </p>
        </div>
        {!showAddForm && (
          <Button onClick={() => setShowAddForm(true)}>+ Add Package</Button>
        )}
      </div>

      {/* Featured Curriculum Partners */}
      {sponsoredCurricula.length > 0 && (
        <div className="bg-gradient-to-r from-brand-primaryLight to-student-purple-50 border-2 border-brand-primary/20 rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-medium text-gray-900 dark:text-white flex items-center gap-2">
                <SparklesIcon className="w-5 h-5 text-brand-primary" />
                Featured Curriculum Partners
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Click to add or learn more about these trusted curricula
              </p>
            </div>
            <span className="text-xs text-gray-500">Sponsored</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {sponsoredCurricula.map((curriculum) => (
              <FeaturedCurriculumCard
                key={curriculum.id}
                curriculum={curriculum}
                onQuickAdd={handleQuickAdd}
                onLearnMore={handleLearnMore}
              />
            ))}
          </div>
        </div>
      )}

      {/* Add/Edit Form */}
      {showAddForm && (
        <Card className="bg-gray-50 dark:bg-gray-800">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-medium text-gray-900 dark:text-white">
                {editingId ? "Edit Package" : "Add New Package"}
              </h3>
              <Button type="button" onClick={resetForm} variant="ghost">
                Cancel
              </Button>
            </div>

            {/* Quick suggestions */}
            {!editingId && (
              <div className="mb-4">
                <Label>Quick Add (Popular Curricula)</Label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {POPULAR_PACKAGES.slice(0, 6).map((pkg) => (
                    <Button
                      key={pkg.name}
                      type="button"
                      onClick={() => selectSuggestion(pkg)}
                      variant="outline"
                      size="sm"
                      className="rounded-full"
                    >
                      {pkg.name}
                    </Button>
                  ))}
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Package Name *</Label>
                <Input
                  type="text"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  placeholder="e.g., Saxon Math 5/4"
                  required
                />
              </div>
              <div>
                <Label>Publisher</Label>
                <Input
                  type="text"
                  value={formData.publisher}
                  onChange={(e) =>
                    setFormData({ ...formData, publisher: e.target.value })
                  }
                  placeholder="e.g., Saxon Publishers"
                />
              </div>
            </div>

            <div>
              <Label>Website URL</Label>
              <Input
                type="url"
                value={formData.websiteUrl}
                onChange={(e) =>
                  setFormData({ ...formData, websiteUrl: e.target.value })
                }
                placeholder="https://..."
              />
            </div>

            <div>
              <Label>Subjects</Label>
              <div className="flex flex-wrap gap-2 mt-2">
                {subjects.map((subject) => (
                  <Button
                    key={subject.id}
                    type="button"
                    onClick={() => toggleSubject(subject.id)}
                    variant={
                      formData.subjectIds?.includes(subject.id)
                        ? "secondary"
                        : "outline"
                    }
                    size="sm"
                  >
                    {subject.name}
                  </Button>
                ))}
              </div>
            </div>

            <div>
              <Label>Grade Levels</Label>
              <div className="flex flex-wrap gap-2 mt-2">
                {GRADE_LEVELS.map((level) => (
                  <Button
                    key={level.value}
                    type="button"
                    onClick={() => toggleGradeLevel(level.value)}
                    variant={
                      formData.gradeLevels?.includes(level.value)
                        ? "secondary"
                        : "outline"
                    }
                    size="sm"
                  >
                    {level.label}
                  </Button>
                ))}
              </div>
            </div>

            <div>
              <Label>Notes</Label>
              <Textarea
                value={formData.notes}
                onChange={(e) =>
                  setFormData({ ...formData, notes: e.target.value })
                }
                rows={2}
                placeholder="Any notes about this curriculum..."
              />
            </div>

            <div className="space-y-2">
              <Checkbox
                id="isActive"
                checked={formData.isActive}
                onChange={(e) =>
                  setFormData({ ...formData, isActive: e.target.checked })
                }
                label="Currently using this curriculum"
              />
              <Checkbox
                id="isSponsored"
                checked={formData.isSponsored || false}
                onChange={(e) =>
                  setFormData({ ...formData, isSponsored: e.target.checked })
                }
                label="Sponsored partner (show Partner badge)"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" onClick={resetForm} variant="outline">
                Cancel
              </Button>
              <Button type="submit">
                {editingId ? "Save Changes" : "Add Package"}
              </Button>
            </div>
          </form>
        </Card>
      )}

      {/* Package List */}
      {packages.length === 0 && !showAddForm ? (
        <Card className="text-center py-12">
          <div className="text-4xl mb-4">📚</div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            No Curriculum Packages Yet
          </h3>
          <p className="text-gray-500 dark:text-gray-400 mb-4">
            Track the curriculum products your family uses for homeschooling.
          </p>
          <Button onClick={() => setShowAddForm(true)}>
            Add Your First Package
          </Button>
        </Card>
      ) : (
        <div className="grid gap-4">
          {packages.map((pkg) => {
            const pkgSubjects = subjects.filter((s) =>
              pkg.subjectIds.includes(s.id),
            );
            return (
              <Card
                key={pkg.id}
                className={`hover:shadow-md transition-shadow ${
                  !pkg.isActive ? "opacity-60" : ""
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-medium text-gray-900 dark:text-white">
                        {pkg.name}
                      </h3>
                      {pkg.isSponsored && (
                        <span className="px-2 py-0.5 text-xs bg-student-blue-50 dark:bg-student-blue-900/30 text-student-blue-600 dark:text-student-blue-300 rounded border border-student-blue-200 dark:border-student-blue-700">
                          Partner
                        </span>
                      )}
                      {!pkg.isActive && (
                        <span className="px-2 py-0.5 text-xs bg-gray-100 text-gray-600 rounded">
                          Inactive
                        </span>
                      )}
                    </div>
                    {pkg.publisher && (
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        by {pkg.publisher}
                      </p>
                    )}

                    {/* Tags */}
                    <div className="flex flex-wrap gap-2 mt-3">
                      {pkgSubjects.map((subject) => (
                        <span
                          key={subject.id}
                          className="px-2 py-0.5 text-xs bg-brand-primaryLight text-brand-primaryDark rounded"
                        >
                          {subject.name}
                        </span>
                      ))}
                      {pkg.gradeLevels.map((level) => (
                        <span
                          key={level}
                          className="px-2 py-0.5 text-xs bg-student-blue-50 text-student-blue-700 rounded dark:bg-student-blue-900/30 dark:text-student-blue-300"
                        >
                          {GRADE_LEVELS.find((g) => g.value === level)?.label ||
                            level}
                        </span>
                      ))}
                    </div>

                    {pkg.notes && (
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                        {pkg.notes}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-2 ml-4">
                    {pkg.websiteUrl && (
                      <a
                        href={pkg.websiteUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-brand-primary hover:text-brand-primaryDark"
                      >
                        Visit Site
                      </a>
                    )}
                    <Button
                      onClick={() => handleEdit(pkg)}
                      variant="ghost"
                      size="sm"
                    >
                      Edit
                    </Button>
                    <Button
                      onClick={() => handleDelete(pkg.id)}
                      variant="ghost"
                      size="sm"
                      className="text-status-error hover:text-status-errorDark"
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
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
