import { useState, useEffect, useCallback, useMemo } from "react";
import { Dialog } from "@headlessui/react";
import { format, parseISO } from "date-fns";
import { Button, Input, Textarea } from "@/components/ui";
import type {
  SharedResource,
  CreateSharedResource,
  SharedResourceType,
  ResourceRating,
  CoopGroup,
  CoopMember,
} from "../../../../shared/types";

type ExtendedSharedResource = SharedResource & {
  groupName: string;
  sharedByName: string;
};

const resourceTypeConfig: Record<
  SharedResourceType,
  { icon: string; label: string; color: string; bg: string }
> = {
  link: {
    icon: "🔗",
    label: "Link",
    color: "text-status-infoDark",
    bg: "bg-status-infoLight",
  },
  template: {
    icon: "📋",
    label: "Template",
    color: "text-student-purple-600",
    bg: "bg-student-purple-100",
  },
  curriculum: {
    icon: "📚",
    label: "Curriculum",
    color: "text-status-successDark",
    bg: "bg-status-successLight",
  },
  book: {
    icon: "📖",
    label: "Book",
    color: "text-status-warningDark",
    bg: "bg-status-warningLight",
  },
  other: {
    icon: "📁",
    label: "Other",
    color: "text-gray-600",
    bg: "bg-gray-100",
  },
};

export function ResourceSharing() {
  const [resources, setResources] = useState<ExtendedSharedResource[]>([]);
  const [groups, setGroups] = useState<CoopGroup[]>([]);
  const [members, setMembers] = useState<Record<string, CoopMember[]>>({});
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedResource, setSelectedResource] =
    useState<ExtendedSharedResource | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<SharedResourceType | "all">(
    "all",
  );
  const [groupFilter, setGroupFilter] = useState<string>("all");

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [resourcesData, groupsData] = await Promise.all([
        window.api.getAllSharedResources(),
        window.api.getCoopGroups(),
      ]);
      setResources(resourcesData);
      setGroups(groupsData);

      // Load members for each group
      const membersMap: Record<string, CoopMember[]> = {};
      for (const group of groupsData) {
        membersMap[group.id] = await window.api.getCoopMembers(group.id);
      }
      setMembers(membersMap);
    } catch (error) {
      console.error("Failed to load resources:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const filteredResources = useMemo(() => {
    return resources.filter((resource) => {
      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesSearch =
          resource.title.toLowerCase().includes(query) ||
          resource.description?.toLowerCase().includes(query) ||
          resource.subject?.toLowerCase().includes(query) ||
          resource.groupName.toLowerCase().includes(query);
        if (!matchesSearch) return false;
      }

      // Type filter
      if (typeFilter !== "all" && resource.resourceType !== typeFilter) {
        return false;
      }

      // Group filter
      if (groupFilter !== "all" && resource.groupId !== groupFilter) {
        return false;
      }

      return true;
    });
  }, [resources, searchQuery, typeFilter, groupFilter]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-48">
        <div className="text-gray-500 dark:text-gray-400">
          Loading resources...
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Shared Resources
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Browse and share educational resources with your co-op groups
          </p>
        </div>
        {groups.length > 0 && (
          <Button
            onClick={() => setShowAddModal(true)}
            variant="primary"
            size="md"
          >
            Share Resource
          </Button>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        {/* Search */}
        <div className="flex-1">
          <div className="relative">
            <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <Input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search resources..."
              className="pl-10"
            />
          </div>
        </div>

        {/* Type Filter */}
        <select
          value={typeFilter}
          onChange={(e) =>
            setTypeFilter(e.target.value as SharedResourceType | "all")
          }
          className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-fuchsia-500 focus:border-transparent"
        >
          <option value="all">All types</option>
          {Object.entries(resourceTypeConfig).map(([type, config]) => (
            <option key={type} value={type}>
              {config.icon} {config.label}
            </option>
          ))}
        </select>

        {/* Group Filter */}
        {groups.length > 1 && (
          <select
            value={groupFilter}
            onChange={(e) => setGroupFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-fuchsia-500 focus:border-transparent"
          >
            <option value="all">All groups</option>
            {groups.map((group) => (
              <option key={group.id} value={group.id}>
                {group.name}
              </option>
            ))}
          </select>
        )}
      </div>

      {/* Resources Grid */}
      {filteredResources.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <FolderIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            {resources.length === 0
              ? "No shared resources yet"
              : "No matching resources"}
          </h3>
          <p className="text-gray-600 dark:text-gray-400 max-w-md mx-auto">
            {resources.length === 0
              ? groups.length === 0
                ? "Join a co-op group to share and discover resources."
                : "Be the first to share a resource with your co-op!"
              : "Try adjusting your search or filters."}
          </p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredResources.map((resource) => (
            <ResourceCard
              key={resource.id}
              resource={resource}
              onClick={() => setSelectedResource(resource)}
            />
          ))}
        </div>
      )}

      {/* Add Resource Modal */}
      <AddResourceModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        groups={groups}
        members={members}
        onSuccess={() => {
          setShowAddModal(false);
          loadData();
        }}
      />

      {/* Resource Detail Modal */}
      <ResourceDetailModal
        resource={selectedResource}
        onClose={() => setSelectedResource(null)}
        onDelete={async (id) => {
          await window.api.deleteSharedResource(id);
          setSelectedResource(null);
          loadData();
        }}
      />
    </div>
  );
}

function ResourceCard({
  resource,
  onClick,
}: {
  resource: ExtendedSharedResource;
  onClick: () => void;
}) {
  const config =
    resourceTypeConfig[resource.resourceType] || resourceTypeConfig.other;

  return (
    <Button
      onClick={onClick}
      variant="ghost"
      className="text-left bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:border-brand-primaryLight dark:hover:border-brand-primary transition-colors w-full"
    >
      <div className="flex items-start gap-3">
        <div className={`p-2 rounded-lg ${config.bg}`}>
          <span className="text-xl">{config.icon}</span>
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-gray-900 dark:text-white truncate">
            {resource.title}
          </h3>
          <div className="flex items-center gap-2 mt-1">
            <span
              className={`text-xs px-2 py-0.5 rounded-full ${config.bg} ${config.color}`}
            >
              {config.label}
            </span>
            <span className="text-xs text-gray-500 dark:text-gray-400 truncate">
              {resource.groupName}
            </span>
          </div>
          {resource.description && (
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-2 line-clamp-2">
              {resource.description}
            </p>
          )}
          <div className="flex items-center justify-between mt-3">
            <div className="flex items-center gap-1">
              {resource.ratingCount > 0 ? (
                <>
                  <StarFilledIcon className="w-4 h-4 text-status-warning" />
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    {resource.averageRating.toFixed(1)} ({resource.ratingCount})
                  </span>
                </>
              ) : (
                <span className="text-xs text-gray-400">No ratings yet</span>
              )}
            </div>
            <span className="text-xs text-gray-400">
              by {resource.sharedByName}
            </span>
          </div>
        </div>
      </div>
    </Button>
  );
}

function AddResourceModal({
  isOpen,
  onClose,
  groups,
  members,
  onSuccess,
}: {
  isOpen: boolean;
  onClose: () => void;
  groups: CoopGroup[];
  members: Record<string, CoopMember[]>;
  onSuccess: () => void;
}) {
  const [selectedGroupId, setSelectedGroupId] = useState(groups[0]?.id || "");
  const [resourceType, setResourceType] = useState<SharedResourceType>("link");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [url, setUrl] = useState("");
  const [subject, setSubject] = useState("");
  const [gradeLevel, setGradeLevel] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !selectedGroupId) return;

    const groupMembers = members[selectedGroupId] || [];
    const currentMember =
      groupMembers.find((m) => m.role === "organizer") || groupMembers[0];
    if (!currentMember) {
      alert("You must be a member of the group to share resources.");
      return;
    }

    setSubmitting(true);
    try {
      await window.api.createSharedResource({
        groupId: selectedGroupId,
        sharedBy: currentMember.id,
        resourceType,
        title: title.trim(),
        description: description.trim() || undefined,
        url: url.trim() || undefined,
        subject: subject.trim() || undefined,
        gradeLevel: gradeLevel.trim() || undefined,
      });
      onSuccess();
    } catch (error) {
      console.error("Failed to create resource:", error);
      alert("Failed to share resource. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      setSelectedGroupId(groups[0]?.id || "");
      setResourceType("link");
      setTitle("");
      setDescription("");
      setUrl("");
      setSubject("");
      setGradeLevel("");
    }
  }, [isOpen, groups]);

  return (
    <Dialog open={isOpen} onClose={onClose} className="relative z-50">
      <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="mx-auto max-w-md w-full bg-white dark:bg-gray-800 rounded-xl shadow-xl p-6">
          <Dialog.Title className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Share a Resource
          </Dialog.Title>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Share with Group
              </label>
              <select
                value={selectedGroupId}
                onChange={(e) => setSelectedGroupId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                {groups.map((group) => (
                  <option key={group.id} value={group.id}>
                    {group.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Resource Type
              </label>
              <div className="grid grid-cols-5 gap-2">
                {(
                  Object.entries(resourceTypeConfig) as [
                    SharedResourceType,
                    typeof resourceTypeConfig.link,
                  ][]
                ).map(([type, config]) => (
                  <Button
                    key={type}
                    type="button"
                    variant="ghost"
                    onClick={() => setResourceType(type)}
                    className={`p-2 rounded-lg text-center transition-all flex-col ${
                      resourceType === type
                        ? `${config.bg} ${config.color} ring-2 ring-offset-1 ring-current`
                        : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600"
                    }`}
                  >
                    <div className="text-lg">{config.icon}</div>
                    <div className="text-xs mt-0.5">{config.label}</div>
                  </Button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Title *
              </label>
              <Input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., Khan Academy Math"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                URL
              </label>
              <Input
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://..."
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Subject
                </label>
                <Input
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="e.g., Math"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Grade Level
                </label>
                <Input
                  type="text"
                  value={gradeLevel}
                  onChange={(e) => setGradeLevel(e.target.value)}
                  placeholder="e.g., K-3"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Description
              </label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="What makes this resource great?"
                rows={3}
              />
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button type="button" onClick={onClose} variant="ghost">
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={!title.trim() || submitting}
                variant="primary"
                loading={submitting}
              >
                {submitting ? "Sharing..." : "Share Resource"}
              </Button>
            </div>
          </form>
        </Dialog.Panel>
      </div>
    </Dialog>
  );
}

function ResourceDetailModal({
  resource,
  onClose,
  onDelete,
}: {
  resource: ExtendedSharedResource | null;
  onClose: () => void;
  onDelete: (id: string) => Promise<void>;
}) {
  const [ratings, setRatings] = useState<
    (ResourceRating & { memberName: string })[]
  >([]);
  const [loadingRatings, setLoadingRatings] = useState(false);

  useEffect(() => {
    if (resource) {
      setLoadingRatings(true);
      window.api
        .getResourceRatings(resource.id)
        .then(setRatings)
        .catch(console.error)
        .finally(() => setLoadingRatings(false));
    }
  }, [resource]);

  if (!resource) return null;

  const config =
    resourceTypeConfig[resource.resourceType] || resourceTypeConfig.other;

  return (
    <Dialog open={!!resource} onClose={onClose} className="relative z-50">
      <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="mx-auto max-w-lg w-full bg-white dark:bg-gray-800 rounded-xl shadow-xl p-6">
          <div className="flex items-start gap-4 mb-4">
            <div className={`p-3 rounded-lg ${config.bg}`}>
              <span className="text-2xl">{config.icon}</span>
            </div>
            <div className="flex-1">
              <Dialog.Title className="text-lg font-semibold text-gray-900 dark:text-white">
                {resource.title}
              </Dialog.Title>
              <div className="flex items-center gap-2 mt-1">
                <span
                  className={`text-xs px-2 py-0.5 rounded-full ${config.bg} ${config.color}`}
                >
                  {config.label}
                </span>
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  {resource.groupName}
                </span>
              </div>
            </div>
          </div>

          {resource.description && (
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              {resource.description}
            </p>
          )}

          <div className="space-y-2 mb-4">
            {resource.url && (
              <div className="flex items-center gap-2">
                <LinkIcon className="w-4 h-4 text-gray-400" />
                <a
                  href={resource.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-status-infoDark hover:underline truncate"
                >
                  {resource.url}
                </a>
              </div>
            )}
            {resource.subject && (
              <div className="flex items-center gap-2">
                <BookIcon className="w-4 h-4 text-gray-400" />
                <span className="text-gray-600 dark:text-gray-400">
                  {resource.subject}
                </span>
              </div>
            )}
            {resource.gradeLevel && (
              <div className="flex items-center gap-2">
                <AcademicCapIcon className="w-4 h-4 text-gray-400" />
                <span className="text-gray-600 dark:text-gray-400">
                  {resource.gradeLevel}
                </span>
              </div>
            )}
          </div>

          {/* Rating Summary */}
          <div className="flex items-center gap-2 mb-4 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
            {resource.ratingCount > 0 ? (
              <>
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <StarFilledIcon
                      key={star}
                      className={`w-5 h-5 ${
                        star <= Math.round(resource.averageRating)
                          ? "text-status-warning"
                          : "text-gray-300 dark:text-gray-500"
                      }`}
                    />
                  ))}
                </div>
                <span className="text-gray-600 dark:text-gray-400">
                  {resource.averageRating.toFixed(1)} ({resource.ratingCount}{" "}
                  {resource.ratingCount === 1 ? "rating" : "ratings"})
                </span>
              </>
            ) : (
              <span className="text-gray-500 dark:text-gray-400">
                No ratings yet
              </span>
            )}
          </div>

          {/* Reviews */}
          {loadingRatings ? (
            <div className="text-sm text-gray-500">Loading reviews...</div>
          ) : (
            ratings.length > 0 && (
              <div className="mb-4">
                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Reviews
                </h4>
                <div className="space-y-2 max-h-32 overflow-y-auto">
                  {ratings
                    .filter((r) => r.review)
                    .map((rating) => (
                      <div
                        key={rating.id}
                        className="text-sm p-2 bg-gray-50 dark:bg-gray-700 rounded"
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <div className="flex">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <StarFilledIcon
                                key={star}
                                className={`w-3 h-3 ${star <= rating.rating ? "text-status-warning" : "text-gray-300"}`}
                              />
                            ))}
                          </div>
                          <span className="text-gray-500">
                            {rating.memberName}
                          </span>
                        </div>
                        <p className="text-gray-600 dark:text-gray-400">
                          {rating.review}
                        </p>
                      </div>
                    ))}
                </div>
              </div>
            )
          )}

          {/* Meta */}
          <div className="text-xs text-gray-400 mb-4">
            Shared by {resource.sharedByName} on{" "}
            {format(parseISO(resource.createdAt), "MMM d, yyyy")}
          </div>

          <div className="flex justify-between">
            <Button
              onClick={() => {
                if (confirm("Are you sure you want to delete this resource?")) {
                  onDelete(resource.id);
                }
              }}
              variant="danger"
              size="sm"
            >
              Delete
            </Button>
            <Button onClick={onClose} variant="secondary">
              Close
            </Button>
          </div>
        </Dialog.Panel>
      </div>
    </Dialog>
  );
}

// Icons
function SearchIcon({ className }: { className?: string }) {
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
        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
      />
    </svg>
  );
}

function FolderIcon({ className }: { className?: string }) {
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
        d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"
      />
    </svg>
  );
}

function StarFilledIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
    </svg>
  );
}

function LinkIcon({ className }: { className?: string }) {
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
        d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
      />
    </svg>
  );
}

function BookIcon({ className }: { className?: string }) {
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
        d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
      />
    </svg>
  );
}

function AcademicCapIcon({ className }: { className?: string }) {
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
        d="M12 14l9-5-9-5-9 5 9 5z"
      />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z"
      />
    </svg>
  );
}

export default ResourceSharing;
