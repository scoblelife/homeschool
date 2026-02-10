import { useState } from "react";
import { CoopGroupList, CoopGroupDetail } from "../features/coop";
import { FieldTripDiscovery } from "../features/fieldTrips";
import { ResourceSharing } from "../features/community";
import { MentorMatching } from "../features/mentorship";
import type { CoopGroup } from "../../../shared/types";
import { PageContainer } from "../components/layout/PageContainer";
import { PageHeader } from "../components/layout/PageHeader";

type TabType = "groups" | "discover" | "resources" | "mentors";

export default function Coop() {
  const [selectedGroup, setSelectedGroup] = useState<CoopGroup | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>("groups");

  const handleGroupDeleted = () => {
    setSelectedGroup(null);
  };

  return (
    <PageContainer>
      <PageHeader
        title="Co-op Groups"
        subtitle="Coordinate activities and events with other homeschool families."
      />

      {/* Tabs - only show when not viewing a group detail */}
      {!selectedGroup && (
        <div className="flex gap-4 border-b border-neutral-border mb-6">
          <button
            onClick={() => setActiveTab("groups")}
            className={`pb-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === "groups"
                ? "border-brand-primary text-brand-primary"
                : "border-transparent text-neutral-textSecondary hover:text-neutral-text"
            }`}
          >
            My Groups
          </button>
          <button
            onClick={() => setActiveTab("discover")}
            className={`pb-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === "discover"
                ? "border-brand-primary text-brand-primary"
                : "border-transparent text-neutral-textSecondary hover:text-neutral-text"
            }`}
          >
            Discover Events
          </button>
          <button
            onClick={() => setActiveTab("resources")}
            className={`pb-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === "resources"
                ? "border-brand-primary text-brand-primary"
                : "border-transparent text-neutral-textSecondary hover:text-neutral-text"
            }`}
          >
            Shared Resources
          </button>
          <button
            onClick={() => setActiveTab("mentors")}
            className={`pb-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === "mentors"
                ? "border-brand-primary text-brand-primary"
                : "border-transparent text-neutral-textSecondary hover:text-neutral-text"
            }`}
          >
            Mentors
          </button>
        </div>
      )}

      {/* Tab Content */}
      {selectedGroup ? (
        <CoopGroupDetail
          group={selectedGroup}
          onBack={() => setSelectedGroup(null)}
          onGroupDeleted={handleGroupDeleted}
        />
      ) : activeTab === "groups" ? (
        <>
          {/* Info box */}
          <div className="mb-6 p-4 bg-student-blue-50 border border-student-blue-200 rounded-lg">
            <h3 className="font-medium text-student-blue-900 mb-2">
              What are Co-op Groups?
            </h3>
            <p className="text-sm text-student-blue-700">
              Co-op groups let you connect with other homeschool families to
              plan park days, field trips, game nights, and group classes.
              Create a group and share the invite code with other families to
              get started!
            </p>
          </div>
          <CoopGroupList onSelectGroup={setSelectedGroup} />
        </>
      ) : activeTab === "discover" ? (
        <FieldTripDiscovery />
      ) : activeTab === "resources" ? (
        <ResourceSharing />
      ) : (
        <MentorMatching />
      )}
    </PageContainer>
  );
}
