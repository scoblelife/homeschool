/**
 * Sponsored Resource Management Admin Page
 *
 * CRUD interface for managing sponsored content (resources, curriculum, etc.)
 * Links resources to sponsors and controls visibility across the app
 */

import { useState, useEffect } from "react";
import { format, parseISO } from "date-fns";
import { Card } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { Badge } from "../../components/ui/Badge";
import { Input, Textarea } from "../../components/ui/Input";
import { Checkbox } from "../../components/ui/Checkbox";
import { Modal } from "../../components/ui/Modal";
import { PageHeader } from "../../components/layout/PageHeader";
import { PageContainer } from "../../components/layout/PageContainer";
import type {
  SponsoredResource,
  Sponsor,
  CreateSponsoredResource,
  UpdateSponsoredResource,
} from "../../../../shared/types";

const LOCATION_OPTIONS = [
  { value: "resources_page", label: "Resources Page" },
  { value: "curriculum_page", label: "Curriculum Page" },
  { value: "dashboard", label: "Dashboard" },
  { value: "learning_log", label: "Learning Log" },
];

const GRADE_LEVEL_OPTIONS = [
  "pre-k",
  "1st",
  "2nd",
  "3rd",
  "4th",
  "5th",
  "6th",
  "7th",
  "8th",
  "9th",
  "10th",
  "11th",
  "12th",
];

export default function SponsoredResourceManagement() {
  const [resources, setResources] = useState<SponsoredResource[]>([]);
  const [sponsors, setSponsors] = useState<Sponsor[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingResource, setEditingResource] =
    useState<SponsoredResource | null>(null);
  const [formData, setFormData] = useState<Partial<CreateSponsoredResource>>({
    sponsorId: "",
    tier: "basic",
    name: "",
    description: "",
    icon: "",
    url: "",
    subjects: [],
    gradeLevels: [],
    category: "",
    pricingInfo: "",
    displayPriority: 0,
    isActive: true,
    contractStartDate: format(new Date(), "yyyy-MM-dd"),
    contractEndDate: "",
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [resourceData, sponsorData] = await Promise.all([
        window.api.getSponsoredResources({}),
        window.api.getSponsors(),
      ]);
      setResources(resourceData);
      setSponsors(sponsorData);
    } catch (error) {
      console.error("Failed to load data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.sponsorId || !formData.name || !formData.url) return;

    try {
      if (editingResource) {
        await window.api.updateSponsoredResource(
          editingResource.id,
          formData as UpdateSponsoredResource,
        );
      } else {
        await window.api.createSponsoredResource(
          formData as CreateSponsoredResource,
        );
      }
      await loadData();
      closeModal();
    } catch (error) {
      console.error("Failed to save resource:", error);
      alert("Failed to save sponsored resource. Please try again.");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this sponsored resource?")) {
      return;
    }

    try {
      await window.api.deleteSponsoredResource(id);
      await loadData();
    } catch (error) {
      console.error("Failed to delete resource:", error);
      alert("Failed to delete resource. Please try again.");
    }
  };

  const openCreateModal = () => {
    setEditingResource(null);
    setFormData({
      sponsorId: "",
      tier: "basic",
      name: "",
      description: "",
      icon: "",
      url: "",
      subjects: [],
      gradeLevels: [],
      category: "",
      pricingInfo: "",
      displayPriority: 0,
      isActive: true,
      contractStartDate: format(new Date(), "yyyy-MM-dd"),
      contractEndDate: "",
    });
    setIsModalOpen(true);
  };

  const openEditModal = (resource: SponsoredResource) => {
    setEditingResource(resource);
    setFormData({
      sponsorId: resource.sponsorId,
      tier: resource.tier,
      name: resource.name,
      description: resource.description,
      icon: resource.icon || "",
      url: resource.url,
      subjects: resource.subjects,
      gradeLevels: resource.gradeLevels,
      category: resource.category || "",
      pricingInfo: resource.pricingInfo || "",
      displayPriority: resource.displayPriority,
      isActive: resource.isActive,
      contractStartDate: resource.contractStartDate,
      contractEndDate: resource.contractEndDate,
    });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingResource(null);
  };

  const handleSponsorChange = (sponsorId: string) => {
    const sponsor = sponsors.find((s) => s.id === sponsorId);
    setFormData({
      ...formData,
      sponsorId,
      tier: sponsor?.tier || "basic",
    });
  };

  const toggleSubject = (subject: string) => {
    const current = formData.subjects || [];
    const updated = current.includes(subject)
      ? current.filter((s) => s !== subject)
      : [...current, subject];
    setFormData({ ...formData, subjects: updated });
  };

  const toggleGradeLevel = (level: string) => {
    const current = formData.gradeLevels || [];
    const updated = current.includes(level)
      ? current.filter((l) => l !== level)
      : [...current, level];
    setFormData({ ...formData, gradeLevels: updated });
  };

  const activeResources = resources.filter((r) => r.isActive);
  const inactiveResources = resources.filter((r) => !r.isActive);

  if (isLoading) {
    return (
      <PageContainer>
        <div className="text-center text-gray-500 py-8">
          Loading resources...
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <PageHeader
        title="Sponsored Resource Management"
        subtitle="Manage sponsored content displayed across the app"
        action={
          <Button variant="primary" onClick={openCreateModal}>
            + Add Resource
          </Button>
        }
      />

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        {LOCATION_OPTIONS.map((location) => {
          const count = activeResources.filter(
            (_r) =>
              // Check if resource is suitable for this location based on implementation
              true,
          ).length;
          return (
            <Card key={location.value}>
              <div className="text-center">
                <div className="text-2xl font-bold text-brand-primary">
                  {count}
                </div>
                <div className="text-sm text-gray-500">{location.label}</div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Active Resources */}
      {activeResources.length > 0 && (
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Active Resources
          </h2>
          <div className="space-y-4">
            {activeResources.map((resource) => (
              <ResourceCard
                key={resource.id}
                resource={resource}
                sponsors={sponsors}
                onEdit={openEditModal}
                onDelete={handleDelete}
              />
            ))}
          </div>
        </div>
      )}

      {/* Inactive Resources */}
      {inactiveResources.length > 0 && (
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-gray-500 mb-4">
            Inactive Resources
          </h2>
          <div className="space-y-4 opacity-60">
            {inactiveResources.map((resource) => (
              <ResourceCard
                key={resource.id}
                resource={resource}
                sponsors={sponsors}
                onEdit={openEditModal}
                onDelete={handleDelete}
              />
            ))}
          </div>
        </div>
      )}

      {resources.length === 0 && (
        <Card className="text-center py-12">
          <div className="text-4xl mb-4">📚</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No Sponsored Resources Yet
          </h3>
          <p className="text-gray-500 mb-4">
            Add your first sponsored resource to start displaying content to
            users.
          </p>
          <Button variant="primary" onClick={openCreateModal}>
            Add First Resource
          </Button>
        </Card>
      )}

      {/* Create/Edit Modal */}
      <Modal
        open={isModalOpen}
        onClose={closeModal}
        title={
          editingResource ? "Edit Sponsored Resource" : "Add Sponsored Resource"
        }
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Sponsor *
            </label>
            <select
              value={formData.sponsorId}
              onChange={(e) => handleSponsorChange(e.target.value)}
              className="block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-brand-primary text-sm"
              required
            >
              <option value="">Select sponsor...</option>
              {sponsors
                .filter((s) => s.isActive)
                .map((sponsor) => (
                  <option key={sponsor.id} value={sponsor.id}>
                    {sponsor.name} ({sponsor.tier})
                  </option>
                ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Resource Name *
              </label>
              <Input
                type="text"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                placeholder="e.g., IXL Math Practice"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Icon/Emoji
              </label>
              <Input
                type="text"
                value={formData.icon}
                onChange={(e) =>
                  setFormData({ ...formData, icon: e.target.value })
                }
                placeholder="📚"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description *
            </label>
            <Textarea
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              rows={2}
              placeholder="Brief description of what this resource offers..."
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              URL *
            </label>
            <Input
              type="url"
              value={formData.url}
              onChange={(e) =>
                setFormData({ ...formData, url: e.target.value })
              }
              placeholder="https://..."
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Subjects (type and press Enter)
            </label>
            <div className="flex flex-wrap gap-2 mb-2">
              {(formData.subjects || []).map((subject) => (
                <Badge
                  key={subject}
                  size="md"
                  className="bg-brand-primaryLight text-brand-primaryDark rounded-full flex items-center gap-1"
                >
                  {subject}
                  <Button
                    type="button"
                    onClick={() => toggleSubject(subject)}
                    variant="ghost"
                    size="sm"
                    className="text-brand-primaryDark hover:text-brand-primary h-auto p-0 min-w-0"
                  >
                    ×
                  </Button>
                </Badge>
              ))}
            </div>
            <Input
              type="text"
              placeholder="e.g., Math, Science, Reading..."
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  const input = e.currentTarget;
                  const value = input.value.trim();
                  if (value && !formData.subjects?.includes(value)) {
                    setFormData({
                      ...formData,
                      subjects: [...(formData.subjects || []), value],
                    });
                    input.value = "";
                  }
                }
              }}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Grade Levels
            </label>
            <div className="flex flex-wrap gap-2">
              {GRADE_LEVEL_OPTIONS.map((level) => (
                <button
                  key={level}
                  type="button"
                  onClick={() => toggleGradeLevel(level)}
                  className={`px-3 py-1.5 text-sm rounded-lg border transition-colors ${
                    formData.gradeLevels?.includes(level)
                      ? "bg-brand-primaryLight border-brand-primary text-brand-primaryDark"
                      : "bg-white border-gray-300 text-gray-600 hover:border-gray-400"
                  }`}
                >
                  {level}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Category
              </label>
              <Input
                type="text"
                value={formData.category}
                onChange={(e) =>
                  setFormData({ ...formData, category: e.target.value })
                }
                placeholder="e.g., curriculum, tool, course"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Pricing Info
              </label>
              <Input
                type="text"
                value={formData.pricingInfo}
                onChange={(e) =>
                  setFormData({ ...formData, pricingInfo: e.target.value })
                }
                placeholder="e.g., Free, $9.95/mo, $99/year"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Contract Start Date *
              </label>
              <Input
                type="date"
                value={formData.contractStartDate}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    contractStartDate: e.target.value,
                  })
                }
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Contract End Date *
              </label>
              <Input
                type="date"
                value={formData.contractEndDate}
                onChange={(e) =>
                  setFormData({ ...formData, contractEndDate: e.target.value })
                }
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Display Priority (higher = shown first)
            </label>
            <Input
              type="number"
              value={formData.displayPriority}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  displayPriority: parseInt(e.target.value),
                })
              }
              min="0"
            />
          </div>

          <Checkbox
            id="isActive"
            checked={formData.isActive}
            onChange={(e) =>
              setFormData({ ...formData, isActive: e.target.checked })
            }
            label="Active (visible to users)"
          />

          <div className="flex justify-end gap-3 pt-4">
            <Button variant="secondary" type="button" onClick={closeModal}>
              Cancel
            </Button>
            <Button variant="primary" type="submit">
              {editingResource ? "Save Changes" : "Create Resource"}
            </Button>
          </div>
        </form>
      </Modal>
    </PageContainer>
  );
}

interface ResourceCardProps {
  resource: SponsoredResource;
  sponsors: Sponsor[];
  onEdit: (resource: SponsoredResource) => void;
  onDelete: (id: string) => void;
}

function ResourceCard({
  resource,
  sponsors,
  onEdit,
  onDelete,
}: ResourceCardProps) {
  const sponsor = sponsors.find((s) => s.id === resource.sponsorId);

  return (
    <Card className={!resource.isActive ? "opacity-60" : ""}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            {resource.icon && <span className="text-2xl">{resource.icon}</span>}
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                {resource.name}
              </h3>
              {sponsor && (
                <p className="text-sm text-gray-500">by {sponsor.name}</p>
              )}
            </div>
            <span
              className={`px-2 py-0.5 text-xs font-medium rounded ${
                resource.tier === "enterprise"
                  ? "bg-purple-100 text-purple-700"
                  : resource.tier === "premium"
                    ? "bg-blue-100 text-blue-700"
                    : "bg-gray-100 text-gray-700"
              }`}
            >
              {resource.tier}
            </span>
            {!resource.isActive && (
              <Badge size="sm" variant="default">
                Inactive
              </Badge>
            )}
          </div>

          <p className="text-sm text-gray-600 mb-3">{resource.description}</p>

          <div className="flex flex-wrap gap-2 mb-2">
            {resource.subjects.slice(0, 5).map((subject) => (
              <Badge
                key={subject}
                size="sm"
                className="bg-brand-primaryLight text-brand-primaryDark"
              >
                {subject}
              </Badge>
            ))}
            {resource.gradeLevels.length > 0 && (
              <Badge size="sm" variant="default">
                {resource.gradeLevels[0]}-
                {resource.gradeLevels[resource.gradeLevels.length - 1]}
              </Badge>
            )}
          </div>

          <div className="flex flex-wrap gap-4 text-sm text-gray-500">
            {resource.pricingInfo && (
              <div>
                <span className="font-medium">Pricing:</span>{" "}
                {resource.pricingInfo}
              </div>
            )}
            <div>
              <span className="font-medium">Priority:</span>{" "}
              {resource.displayPriority}
            </div>
            <div>
              <span className="font-medium">Contract:</span>{" "}
              {format(parseISO(resource.contractStartDate), "MMM d, yyyy")} -{" "}
              {format(parseISO(resource.contractEndDate), "MMM d, yyyy")}
            </div>
          </div>

          <div className="mt-2">
            <a
              href={resource.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-brand-primary hover:text-brand-primaryDark"
            >
              Visit Resource →
            </a>
          </div>
        </div>

        <div className="flex items-center gap-2 ml-4">
          <Button onClick={() => onEdit(resource)} variant="ghost" size="sm">
            Edit
          </Button>
          <Button
            onClick={() => onDelete(resource.id)}
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
}
