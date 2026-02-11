import {
  useState,
  useEffect,
  useCallback,
  useMemo,
  type ChangeEvent,
} from "react";
import { Dialog } from "@headlessui/react";
import { format, parseISO } from "date-fns";
import { Button, Input, Textarea, Checkbox } from "../../components/ui";
import type {
  MentorProfile,
  CreateMentorProfile,
  MentorExpertise,
  MentorRequest,
  MentorRequestStatus,
  CoopGroup,
  CoopMember,
} from "../../../../shared/types";

type ExtendedMentorProfile = MentorProfile & {
  memberName: string;
  groupName: string;
};
type ExtendedMentorRequest = MentorRequest & {
  requesterName?: string;
  mentorName?: string;
};

const expertiseConfig: Record<
  MentorExpertise,
  { icon: string; label: string; color: string; bg: string }
> = {
  new_to_homeschool: {
    icon: "🌱",
    label: "Getting Started",
    color: "text-status-successDark",
    bg: "bg-status-successLight",
  },
  curriculum: {
    icon: "📚",
    label: "Curriculum",
    color: "text-status-infoDark",
    bg: "bg-status-infoLight",
  },
  special_needs: {
    icon: "💜",
    label: "Special Needs",
    color: "text-student-purple-600",
    bg: "bg-student-purple-100",
  },
  high_school: {
    icon: "🎓",
    label: "High School",
    color: "text-status-warningDark",
    bg: "bg-status-warningLight",
  },
  college_prep: {
    icon: "🏛️",
    label: "College Prep",
    color: "text-indigo-600",
    bg: "bg-indigo-100",
  },
  organization: {
    icon: "📋",
    label: "Organization",
    color: "text-student-teal-600",
    bg: "bg-student-teal-100",
  },
  legal: {
    icon: "⚖️",
    label: "Legal/Compliance",
    color: "text-gray-600",
    bg: "bg-gray-100",
  },
  other: {
    icon: "✨",
    label: "Other",
    color: "text-brand-primary",
    bg: "bg-brand-primaryLight",
  },
};

// --- Prop types for sub-components ---

interface MentorMatchingHeaderProps {
  hasGroups: boolean;
  hasProfile: boolean;
  onBecomeMentor: () => void;
}

interface MentorMatchingTabsProps {
  activeTab: "find" | "requests" | "my-profile";
  onTabChange: (tab: "find" | "requests" | "my-profile") => void;
  pendingRequestCount: number;
  myPendingRequestCount: number;
  hasProfile: boolean;
}

interface FindMentorsTabProps {
  searchQuery: string;
  onSearchQueryChange: (query: string) => void;
  expertiseFilter: MentorExpertise | "all";
  onExpertiseFilterChange: (filter: MentorExpertise | "all") => void;
  filteredMentors: ExtendedMentorProfile[];
  mentorCountTotal: number;
  groupCount: number;
  onMentorClick: (mentor: ExtendedMentorProfile) => void;
}

interface FindMentorsFiltersProps {
  searchQuery: string;
  onSearchQueryChange: (query: string) => void;
  expertiseFilter: MentorExpertise | "all";
  onExpertiseFilterChange: (filter: MentorExpertise | "all") => void;
}

interface FindMentorsEmptyProps {
  mentorCountTotal: number;
  groupCount: number;
}

interface MentorCardProps {
  mentor: ExtendedMentorProfile;
  onClick: () => void;
}

interface MentorCardHeaderProps {
  memberName: string;
  groupName: string;
  yearsHomeschooling: number;
}

interface ExpertiseTagListProps {
  expertise: MentorExpertise[];
  limitCount?: number;
}

interface RequestsTabProps {
  myRequests: ExtendedMentorRequest[];
  pendingRequests: ExtendedMentorRequest[];
  onRespond: (
    id: string,
    status: MentorRequestStatus,
    message?: string,
  ) => Promise<void>;
}

interface IncomingRequestCardProps {
  request: ExtendedMentorRequest;
  onRespond: (
    id: string,
    status: MentorRequestStatus,
    message?: string,
  ) => Promise<void>;
}

interface IncomingRequestResponseFormProps {
  requestId: string;
  onRespond: (
    id: string,
    status: MentorRequestStatus,
    message?: string,
  ) => Promise<void>;
  onCancel: () => void;
}

interface OutgoingRequestCardProps {
  request: ExtendedMentorRequest;
}

interface MyProfileTabProps {
  profile: MentorProfile;
  onUpdate: (data: Partial<CreateMentorProfile>) => Promise<void>;
  onDelete: () => Promise<void>;
}

interface MyProfileHeaderProps {
  editing: boolean;
  onEdit: () => void;
  onCancel: () => void;
  onSave: () => void;
}

interface ProfileBioFieldProps {
  editing: boolean;
  bio: string;
  displayBio: string;
  onBioChange: (value: string) => void;
}

interface ProfileYearsFieldProps {
  editing: boolean;
  yearsHomeschooling: number;
  displayYears: number;
  onYearsChange: (value: number) => void;
}

interface ProfileExpertiseFieldProps {
  editing: boolean;
  expertise: MentorExpertise[];
  displayExpertise: MentorExpertise[];
  onExpertiseChange: (expertise: MentorExpertise[]) => void;
}

interface ProfileMaxMenteesFieldProps {
  editing: boolean;
  maxMentees: number;
  displayMaxMentees: number;
  currentMenteeCount: number;
  onMaxMenteesChange: (value: number) => void;
}

interface ProfileAcceptingFieldProps {
  editing: boolean;
  isAcceptingRequests: boolean;
  displayIsAccepting: boolean;
  onAcceptingChange: (value: boolean) => void;
}

interface BecomeMentorModalProps {
  isOpen: boolean;
  onClose: () => void;
  groups: CoopGroup[];
  members: Record<string, CoopMember[]>;
  onSuccess: () => void;
}

interface BecomeMentorFormProps {
  groups: CoopGroup[];
  selectedGroupId: string;
  onGroupChange: (id: string) => void;
  yearsHomeschooling: number;
  onYearsChange: (years: number) => void;
  expertise: MentorExpertise[];
  onExpertiseChange: (key: MentorExpertise) => void;
  bio: string;
  onBioChange: (bio: string) => void;
  maxMentees: number;
  onMaxMenteesChange: (max: number) => void;
  submitting: boolean;
  onSubmit: (e: React.FormEvent) => void;
  onCancel: () => void;
}

interface ExpertiseToggleListProps {
  expertise: MentorExpertise[];
  onToggle: (key: MentorExpertise) => void;
  darkMode?: boolean;
}

interface RequestMentorModalProps {
  mentor: ExtendedMentorProfile | null;
  onClose: () => void;
  currentMemberId: string | null;
  onSuccess: () => void;
}

interface MentorPreviewCardProps {
  mentor: ExtendedMentorProfile;
}

interface RequestMentorFormProps {
  message: string;
  onMessageChange: (message: string) => void;
  submitting: boolean;
  onSubmit: (e: React.FormEvent) => void;
  onCancel: () => void;
}

interface MentorMatchingData {
  mentors: ExtendedMentorProfile[];
  groups: CoopGroup[];
  members: Record<string, CoopMember[]>;
  loading: boolean;
  myProfile: MentorProfile | null;
  myRequests: ExtendedMentorRequest[];
  pendingRequests: ExtendedMentorRequest[];
  filteredMentors: ExtendedMentorProfile[];
  searchQuery: string;
  expertiseFilter: MentorExpertise | "all";
  activeTab: "find" | "requests" | "my-profile";
  showBecomeMentorModal: boolean;
  showRequestModal: ExtendedMentorProfile | null;
  setSearchQuery: (query: string) => void;
  setExpertiseFilter: (filter: MentorExpertise | "all") => void;
  setActiveTab: (tab: "find" | "requests" | "my-profile") => void;
  setShowBecomeMentorModal: (show: boolean) => void;
  setShowRequestModal: (mentor: ExtendedMentorProfile | null) => void;
  getCurrentMemberId: () => string | null;
  handleRespondToRequest: (
    id: string,
    status: MentorRequestStatus,
    message?: string,
  ) => Promise<void>;
  handleUpdateProfile: (data: Partial<CreateMentorProfile>) => Promise<void>;
  handleDeleteProfile: () => Promise<void>;
  handleBecomeMentorSuccess: () => void;
  handleRequestMentorSuccess: () => void;
}

interface MyProfileFieldsProps {
  editing: boolean;
  profile: MentorProfile;
  bio: string;
  yearsHomeschooling: number;
  expertise: MentorExpertise[];
  maxMentees: number;
  isAcceptingRequests: boolean;
  onBioChange: (value: string) => void;
  onYearsChange: (value: number) => void;
  onExpertiseChange: (expertise: MentorExpertise[]) => void;
  onMaxMenteesChange: (value: number) => void;
  onAcceptingChange: (value: boolean) => void;
}

interface BecomeMentorFormGroupSelectProps {
  groups: CoopGroup[];
  selectedGroupId: string;
  onGroupChange: (id: string) => void;
}

interface BecomeMentorFormFieldsProps {
  groups: CoopGroup[];
  selectedGroupId: string;
  onGroupChange: (id: string) => void;
  yearsHomeschooling: number;
  onYearsChange: (years: number) => void;
  expertise: MentorExpertise[];
  onExpertiseChange: (key: MentorExpertise) => void;
  bio: string;
  onBioChange: (bio: string) => void;
  maxMentees: number;
  onMaxMenteesChange: (max: number) => void;
}

interface BecomeMentorFormActionsProps {
  bio: string;
  expertiseCount: number;
  submitting: boolean;
  onCancel: () => void;
}

// --- Custom hook for MentorMatching data and handlers ---

function useMentorMatchingData(): MentorMatchingData {
  const [mentors, setMentors] = useState<ExtendedMentorProfile[]>([]);
  const [groups, setGroups] = useState<CoopGroup[]>([]);
  const [members, setMembers] = useState<Record<string, CoopMember[]>>({});
  const [loading, setLoading] = useState(true);
  const [showBecomeMentorModal, setShowBecomeMentorModal] = useState(false);
  const [showRequestModal, setShowRequestModal] =
    useState<ExtendedMentorProfile | null>(null);
  const [myProfile, setMyProfile] = useState<MentorProfile | null>(null);
  const [myRequests, setMyRequests] = useState<ExtendedMentorRequest[]>([]);
  const [pendingRequests, setPendingRequests] = useState<
    ExtendedMentorRequest[]
  >([]);
  const [activeTab, setActiveTab] = useState<
    "find" | "requests" | "my-profile"
  >("find");
  const [searchQuery, setSearchQuery] = useState("");
  const [expertiseFilter, setExpertiseFilter] = useState<
    MentorExpertise | "all"
  >("all");

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [mentorsData, groupsData] = await Promise.all([
        window.api.getMentorProfiles(),
        window.api.getCoopGroups(),
      ]);
      setMentors(mentorsData);
      setGroups(groupsData);

      const membersMap: Record<string, CoopMember[]> = {};
      for (const group of groupsData) {
        membersMap[group.id] = await window.api.getCoopMembers(group.id);
      }
      setMembers(membersMap);

      await loadCurrentUserData(
        groupsData,
        membersMap,
        setMyProfile,
        setPendingRequests,
        setMyRequests,
      );
    } catch (error) {
      console.error("Failed to load mentors:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const filteredMentors = useMentorFilter(
    mentors,
    myProfile,
    searchQuery,
    expertiseFilter,
  );

  const getCurrentMemberId = useCallback(() => {
    for (const group of groups) {
      const groupMembers = members[group.id] || [];
      const currentMember =
        groupMembers.find((m) => m.role === "organizer") || groupMembers[0];
      if (currentMember) return currentMember.id;
    }
    return null;
  }, [groups, members]);

  const handlers = useMentorMatchingHandlers(
    loadData,
    myProfile,
    setMyProfile,
    setActiveTab,
    setShowBecomeMentorModal,
    setShowRequestModal,
  );

  return {
    mentors,
    groups,
    members,
    loading,
    myProfile,
    myRequests,
    pendingRequests,
    filteredMentors,
    searchQuery,
    expertiseFilter,
    activeTab,
    showBecomeMentorModal,
    showRequestModal,
    setSearchQuery,
    setExpertiseFilter,
    setActiveTab,
    setShowBecomeMentorModal,
    setShowRequestModal,
    getCurrentMemberId,
    ...handlers,
  };
}

function useMentorMatchingHandlers(
  loadData: () => Promise<void>,
  myProfile: MentorProfile | null,
  setMyProfile: (profile: MentorProfile | null) => void,
  setActiveTab: (tab: "find" | "requests" | "my-profile") => void,
  setShowBecomeMentorModal: (show: boolean) => void,
  setShowRequestModal: (mentor: ExtendedMentorProfile | null) => void,
) {
  const handleRespondToRequest = useCallback(
    async (id: string, status: MentorRequestStatus, message?: string) => {
      try {
        await window.api.respondToMentorRequest(id, status, message);
        loadData();
      } catch (error) {
        console.error(
          `[MentorMatching] Failed to respond to mentor request ${id} with status ${status}:`,
          error,
        );
      }
    },
    [loadData],
  );

  const handleUpdateProfile = useCallback(
    async (data: Partial<CreateMentorProfile>) => {
      if (!myProfile) return;
      try {
        await window.api.updateMentorProfile(myProfile.id, data);
        loadData();
      } catch (error) {
        console.error(
          `[MentorMatching] Failed to update mentor profile ${myProfile.id}:`,
          error,
        );
      }
    },
    [myProfile, loadData],
  );

  const handleDeleteProfile = useCallback(async () => {
    if (!myProfile) return;
    if (
      confirm(
        "Are you sure you want to stop being a mentor? Your profile will be deleted.",
      )
    ) {
      try {
        await window.api.deleteMentorProfile(myProfile.id);
        setMyProfile(null);
        setActiveTab("find");
        loadData();
      } catch (error) {
        console.error(
          `[MentorMatching] Failed to delete mentor profile ${myProfile.id}:`,
          error,
        );
      }
    }
  }, [myProfile, loadData, setMyProfile, setActiveTab]);

  const handleBecomeMentorSuccess = useCallback(() => {
    setShowBecomeMentorModal(false);
    loadData();
  }, [loadData, setShowBecomeMentorModal]);

  const handleRequestMentorSuccess = useCallback(() => {
    setShowRequestModal(null);
    loadData();
  }, [loadData, setShowRequestModal]);

  return {
    handleRespondToRequest,
    handleUpdateProfile,
    handleDeleteProfile,
    handleBecomeMentorSuccess,
    handleRequestMentorSuccess,
  };
}

async function loadCurrentUserData(
  groupsData: CoopGroup[],
  membersMap: Record<string, CoopMember[]>,
  setMyProfile: (profile: MentorProfile | null) => void,
  setPendingRequests: (requests: ExtendedMentorRequest[]) => void,
  setMyRequests: (requests: ExtendedMentorRequest[]) => void,
): Promise<void> {
  for (const group of groupsData) {
    const groupMembers = membersMap[group.id] || [];
    const currentMember =
      groupMembers.find((m) => m.role === "organizer") || groupMembers[0];
    if (currentMember) {
      const profile = await window.api.getMyMentorProfile(currentMember.id);
      if (profile) {
        setMyProfile(profile);
        const requests = await window.api.getMentorRequests(profile.id);
        setPendingRequests(requests.filter((r) => r.status === "pending"));
      }
      const myReqs = await window.api.getMyMentorRequests(currentMember.id);
      setMyRequests(myReqs);
      break;
    }
  }
}

function useMentorFilter(
  mentors: ExtendedMentorProfile[],
  myProfile: MentorProfile | null,
  searchQuery: string,
  expertiseFilter: MentorExpertise | "all",
): ExtendedMentorProfile[] {
  return useMemo(() => {
    return mentors.filter((mentor) => {
      if (myProfile && mentor.id === myProfile.id) return false;
      if (!mentor.isAcceptingRequests) return false;

      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesSearch =
          mentor.memberName.toLowerCase().includes(query) ||
          mentor.bio.toLowerCase().includes(query) ||
          mentor.groupName.toLowerCase().includes(query) ||
          mentor.expertise.some((e) =>
            expertiseConfig[e].label.toLowerCase().includes(query),
          );
        if (!matchesSearch) return false;
      }

      if (
        expertiseFilter !== "all" &&
        !mentor.expertise.includes(expertiseFilter)
      ) {
        return false;
      }

      return true;
    });
  }, [mentors, myProfile, searchQuery, expertiseFilter]);
}

// --- Main component ---

export function MentorMatching() {
  const data = useMentorMatchingData();

  if (data.loading) {
    return (
      <div
        className="flex items-center justify-center h-48"
        role="status"
        aria-busy="true"
      >
        <div className="text-gray-500 dark:text-gray-400">
          Loading mentors...
        </div>
      </div>
    );
  }

  const myPendingRequestCount = data.myRequests.filter(
    (r) => r.status === "pending",
  ).length;

  return (
    <div>
      <MentorMatchingHeader
        hasGroups={data.groups.length > 0}
        hasProfile={!!data.myProfile}
        onBecomeMentor={() => data.setShowBecomeMentorModal(true)}
      />

      <MentorMatchingTabs
        activeTab={data.activeTab}
        onTabChange={data.setActiveTab}
        pendingRequestCount={data.pendingRequests.length}
        myPendingRequestCount={myPendingRequestCount}
        hasProfile={!!data.myProfile}
      />

      <MentorMatchingTabContent data={data} />

      <MentorMatchingModals data={data} />
    </div>
  );
}

function MentorMatchingTabContent({ data }: { data: MentorMatchingData }) {
  if (data.activeTab === "find") {
    return (
      <FindMentorsTab
        searchQuery={data.searchQuery}
        onSearchQueryChange={data.setSearchQuery}
        expertiseFilter={data.expertiseFilter}
        onExpertiseFilterChange={data.setExpertiseFilter}
        filteredMentors={data.filteredMentors}
        mentorCountTotal={data.mentors.length}
        groupCount={data.groups.length}
        onMentorClick={data.setShowRequestModal}
      />
    );
  }

  if (data.activeTab === "requests") {
    return (
      <RequestsTab
        myRequests={data.myRequests}
        pendingRequests={data.pendingRequests}
        onRespond={data.handleRespondToRequest}
      />
    );
  }

  if (data.activeTab === "my-profile" && data.myProfile) {
    return (
      <MyProfileTab
        profile={data.myProfile}
        onUpdate={data.handleUpdateProfile}
        onDelete={data.handleDeleteProfile}
      />
    );
  }

  return null;
}

function MentorMatchingModals({ data }: { data: MentorMatchingData }) {
  return (
    <>
      <BecomeMentorModal
        isOpen={data.showBecomeMentorModal}
        onClose={() => data.setShowBecomeMentorModal(false)}
        groups={data.groups}
        members={data.members}
        onSuccess={data.handleBecomeMentorSuccess}
      />

      <RequestMentorModal
        mentor={data.showRequestModal}
        onClose={() => data.setShowRequestModal(null)}
        currentMemberId={data.getCurrentMemberId()}
        onSuccess={data.handleRequestMentorSuccess}
      />
    </>
  );
}

// --- Header ---

function MentorMatchingHeader({
  hasGroups,
  hasProfile,
  onBecomeMentor,
}: MentorMatchingHeaderProps) {
  return (
    <div className="flex items-center justify-between mb-6">
      <div>
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
          Mentor Matching
        </h2>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Connect with experienced homeschool families for guidance and support
        </p>
      </div>
      {hasGroups && !hasProfile && (
        <Button onClick={onBecomeMentor} variant="primary" size="md">
          Become a Mentor
        </Button>
      )}
    </div>
  );
}

// --- Tabs ---

function MentorMatchingTabs({
  activeTab,
  onTabChange,
  pendingRequestCount,
  myPendingRequestCount,
  hasProfile,
}: MentorMatchingTabsProps) {
  const requestBadgeCount = pendingRequestCount + myPendingRequestCount;

  return (
    <div
      className="flex gap-4 border-b border-gray-200 dark:border-gray-700 mb-6"
      role="tablist"
      aria-label="Mentor matching sections"
    >
      <Button
        variant="ghost"
        onClick={() => onTabChange("find")}
        role="tab"
        aria-selected={activeTab === "find"}
        className={`pb-3 text-sm font-medium border-b-2 transition-colors rounded-none ${
          activeTab === "find"
            ? "border-brand-primary text-brand-primary"
            : "border-transparent text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
        }`}
      >
        Find a Mentor
      </Button>
      <Button
        variant="ghost"
        onClick={() => onTabChange("requests")}
        role="tab"
        aria-selected={activeTab === "requests"}
        className={`pb-3 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 rounded-none ${
          activeTab === "requests"
            ? "border-brand-primary text-brand-primary"
            : "border-transparent text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
        }`}
      >
        My Requests
        {requestBadgeCount > 0 && (
          <span className="px-2 py-0.5 text-xs bg-brand-primaryLight text-brand-primaryDark rounded-full">
            {requestBadgeCount}
          </span>
        )}
      </Button>
      {hasProfile && (
        <Button
          variant="ghost"
          onClick={() => onTabChange("my-profile")}
          role="tab"
          aria-selected={activeTab === "my-profile"}
          className={`pb-3 text-sm font-medium border-b-2 transition-colors rounded-none ${
            activeTab === "my-profile"
              ? "border-brand-primary text-brand-primary"
              : "border-transparent text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
          }`}
        >
          My Mentor Profile
        </Button>
      )}
    </div>
  );
}

// --- Find Mentors Tab ---

function FindMentorsTab({
  searchQuery,
  onSearchQueryChange,
  expertiseFilter,
  onExpertiseFilterChange,
  filteredMentors,
  mentorCountTotal,
  groupCount,
  onMentorClick,
}: FindMentorsTabProps) {
  return (
    <>
      <FindMentorsFilters
        searchQuery={searchQuery}
        onSearchQueryChange={onSearchQueryChange}
        expertiseFilter={expertiseFilter}
        onExpertiseFilterChange={onExpertiseFilterChange}
      />

      {filteredMentors.length === 0 ? (
        <FindMentorsEmpty
          mentorCountTotal={mentorCountTotal}
          groupCount={groupCount}
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredMentors.map((mentor) => (
            <MentorCard
              key={mentor.id}
              mentor={mentor}
              onClick={() => onMentorClick(mentor)}
            />
          ))}
        </div>
      )}
    </>
  );
}

function FindMentorsFilters({
  searchQuery,
  onSearchQueryChange,
  expertiseFilter,
  onExpertiseFilterChange,
}: FindMentorsFiltersProps) {
  return (
    <div className="flex flex-col sm:flex-row gap-4 mb-6">
      <div className="flex-1">
        <div className="relative">
          <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <Input
            type="text"
            value={searchQuery}
            onChange={(e: ChangeEvent<HTMLInputElement>) =>
              onSearchQueryChange(e.target.value)
            }
            placeholder="Search mentors..."
            aria-label="Search mentors"
            className="pl-10"
          />
        </div>
      </div>

      <select
        value={expertiseFilter}
        onChange={(e) =>
          onExpertiseFilterChange(e.target.value as MentorExpertise | "all")
        }
        aria-label="Filter by expertise"
        className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-fuchsia-500 focus:border-transparent"
      >
        <option value="all">All expertise</option>
        {Object.entries(expertiseConfig).map(([key, config]) => (
          <option key={key} value={key}>
            {config.icon} {config.label}
          </option>
        ))}
      </select>
    </div>
  );
}

function FindMentorsEmpty({
  mentorCountTotal,
  groupCount,
}: FindMentorsEmptyProps) {
  return (
    <div className="text-center py-12 bg-gray-50 dark:bg-gray-800 rounded-lg">
      <UsersIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
      <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
        {mentorCountTotal === 0
          ? "No mentors available yet"
          : "No matching mentors"}
      </h3>
      <p className="text-gray-600 dark:text-gray-400 max-w-md mx-auto">
        {mentorCountTotal === 0
          ? groupCount === 0
            ? "Join a co-op group to find mentors."
            : "Be the first to offer mentorship in your co-op!"
          : "Try adjusting your search or filters."}
      </p>
    </div>
  );
}

// --- Mentor Card ---

function MentorCard({ mentor, onClick }: MentorCardProps) {
  const availableSlots = mentor.maxMentees - mentor.currentMenteeCount;

  return (
    <Button
      variant="ghost"
      onClick={onClick}
      className="text-left bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:border-brand-primaryLight transition-colors w-full h-auto items-start flex-col"
    >
      <MentorCardHeader
        memberName={mentor.memberName}
        groupName={mentor.groupName}
        yearsHomeschooling={mentor.yearsHomeschooling}
      />

      <ExpertiseTagList expertise={mentor.expertise} limitCount={3} />

      <p className="text-sm text-gray-600 dark:text-gray-400 mt-3 line-clamp-2">
        {mentor.bio}
      </p>

      <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100 dark:border-gray-700">
        <span
          className={`text-xs ${availableSlots > 0 ? "text-status-successDark" : "text-gray-400"}`}
        >
          {availableSlots > 0
            ? `${availableSlots} spot${availableSlots > 1 ? "s" : ""} available`
            : "Fully booked"}
        </span>
        <span className="text-xs text-brand-primary font-medium">
          Request mentorship →
        </span>
      </div>
    </Button>
  );
}

function MentorCardHeader({
  memberName,
  groupName,
  yearsHomeschooling,
}: MentorCardHeaderProps) {
  return (
    <div className="flex items-start gap-3 w-full">
      <div
        className={`w-12 h-12 rounded-full bg-gradient-to-br from-brand-primary to-student-purple-500 flex items-center justify-center text-white text-lg font-medium`}
      >
        {memberName.charAt(0).toUpperCase()}
      </div>
      <div className="flex-1 min-w-0">
        <h3 className="font-medium text-gray-900 dark:text-white">
          {memberName}
        </h3>
        <p className="text-xs text-gray-500 dark:text-gray-400">{groupName}</p>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
          {yearsHomeschooling} years homeschooling
        </p>
      </div>
    </div>
  );
}

function ExpertiseTagList({ expertise, limitCount }: ExpertiseTagListProps) {
  const displayedExpertise = limitCount
    ? expertise.slice(0, limitCount)
    : expertise;
  const remainingCount = limitCount ? expertise.length - limitCount : 0;

  return (
    <div className="flex flex-wrap gap-1.5 mt-3">
      {displayedExpertise.map((exp) => {
        const config = expertiseConfig[exp];
        return (
          <span
            key={exp}
            className={`text-xs px-2 py-0.5 rounded-full ${config.bg} ${config.color}`}
          >
            {config.icon} {config.label}
          </span>
        );
      })}
      {remainingCount > 0 && (
        <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
          +{remainingCount} more
        </span>
      )}
    </div>
  );
}

// --- Requests Tab ---

function RequestsTab({
  myRequests,
  pendingRequests,
  onRespond,
}: RequestsTabProps) {
  return (
    <div className="space-y-6">
      {pendingRequests.length > 0 && (
        <div>
          <h3 className="text-md font-medium text-gray-900 dark:text-white mb-3">
            Incoming Requests ({pendingRequests.length})
          </h3>
          <div className="space-y-3">
            {pendingRequests.map((request) => (
              <IncomingRequestCard
                key={request.id}
                request={request}
                onRespond={onRespond}
              />
            ))}
          </div>
        </div>
      )}

      <div>
        <h3 className="text-md font-medium text-gray-900 dark:text-white mb-3">
          My Requests ({myRequests.length})
        </h3>
        {myRequests.length === 0 ? (
          <div className="text-center py-8 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <p className="text-gray-500 dark:text-gray-400">
              You haven't requested any mentors yet
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {myRequests.map((request) => (
              <OutgoingRequestCard key={request.id} request={request} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function IncomingRequestCard({ request, onRespond }: IncomingRequestCardProps) {
  const [responding, setResponding] = useState(false);

  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
      <div className="flex items-start justify-between">
        <div>
          <h4 className="font-medium text-gray-900 dark:text-white">
            {request.requesterName}
          </h4>
          <p className="text-sm text-gray-500 mt-1">
            Requested {format(parseISO(request.createdAt), "MMM d, yyyy")}
          </p>
        </div>
        <span className="px-2 py-1 text-xs bg-status-warningLight text-status-warningDark rounded-full">
          Pending
        </span>
      </div>
      <p className="text-gray-600 dark:text-gray-400 mt-3">{request.message}</p>

      {responding ? (
        <IncomingRequestResponseForm
          requestId={request.id}
          onRespond={onRespond}
          onCancel={() => setResponding(false)}
        />
      ) : (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setResponding(true)}
          className="mt-3 text-brand-primary hover:text-brand-primaryDark"
        >
          Respond to request
        </Button>
      )}
    </div>
  );
}

function IncomingRequestResponseForm({
  requestId,
  onRespond,
  onCancel,
}: IncomingRequestResponseFormProps) {
  const [responseMessage, setResponseMessage] = useState("");

  const handleAccept = useCallback(async () => {
    try {
      await onRespond(requestId, "accepted", responseMessage);
      onCancel();
    } catch (error) {
      console.error(
        `[MentorMatching] Failed to accept mentor request ${requestId}:`,
        error,
      );
    }
  }, [requestId, responseMessage, onRespond, onCancel]);

  const handleDecline = useCallback(async () => {
    try {
      await onRespond(requestId, "declined", responseMessage);
      onCancel();
    } catch (error) {
      console.error(
        `[MentorMatching] Failed to decline mentor request ${requestId}:`,
        error,
      );
    }
  }, [requestId, responseMessage, onRespond, onCancel]);

  return (
    <div className="mt-4 space-y-3">
      <Textarea
        value={responseMessage}
        onChange={(e: ChangeEvent<HTMLTextAreaElement>) =>
          setResponseMessage(e.target.value)
        }
        placeholder="Add a message (optional)"
        rows={2}
      />
      <div className="flex gap-2">
        <Button
          size="sm"
          variant="primary"
          className="bg-status-success hover:bg-status-successDark"
          onClick={handleAccept}
        >
          Accept
        </Button>
        <Button size="sm" variant="danger" onClick={handleDecline}>
          Decline
        </Button>
        <Button size="sm" variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </div>
  );
}

function OutgoingRequestCard({ request }: OutgoingRequestCardProps) {
  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
      <div className="flex items-start justify-between">
        <div>
          <h4 className="font-medium text-gray-900 dark:text-white">
            To: {request.mentorName}
          </h4>
          <p className="text-sm text-gray-500 mt-1">
            Sent {format(parseISO(request.createdAt), "MMM d, yyyy")}
          </p>
        </div>
        <span
          className={`px-2 py-1 text-xs rounded-full ${
            request.status === "pending"
              ? "bg-status-warningLight text-status-warningDark"
              : request.status === "accepted"
                ? "bg-status-successLight text-status-successDark"
                : "bg-status-errorLight text-status-errorDark"
          }`}
        >
          {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
        </span>
      </div>
      <p className="text-gray-600 dark:text-gray-400 mt-3 text-sm">
        {request.message}
      </p>
      {request.responseMessage && (
        <div className="mt-3 p-2 bg-gray-50 dark:bg-gray-700 rounded text-sm">
          <span className="font-medium">Response: </span>
          {request.responseMessage}
        </div>
      )}
    </div>
  );
}

// --- My Profile Tab ---

function MyProfileTab({ profile, onUpdate, onDelete }: MyProfileTabProps) {
  const [editing, setEditing] = useState(false);
  const [bio, setBio] = useState(profile.bio);
  const [yearsHomeschooling, setYearsHomeschooling] = useState(
    profile.yearsHomeschooling,
  );
  const [expertise, setExpertise] = useState<MentorExpertise[]>(
    profile.expertise,
  );
  const [maxMentees, setMaxMentees] = useState(profile.maxMentees);
  const [isAcceptingRequests, setIsAcceptingRequests] = useState(
    profile.isAcceptingRequests,
  );

  const handleSave = useCallback(async () => {
    try {
      await onUpdate({
        bio,
        yearsHomeschooling,
        expertise,
        maxMentees,
        isAcceptingRequests,
      });
      setEditing(false);
    } catch (error) {
      console.error("[MentorMatching] Failed to save mentor profile:", error);
    }
  }, [
    bio,
    yearsHomeschooling,
    expertise,
    maxMentees,
    isAcceptingRequests,
    onUpdate,
  ]);

  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
      <MyProfileHeader
        editing={editing}
        onEdit={() => setEditing(true)}
        onCancel={() => setEditing(false)}
        onSave={handleSave}
      />

      <MyProfileFields
        editing={editing}
        profile={profile}
        bio={bio}
        yearsHomeschooling={yearsHomeschooling}
        expertise={expertise}
        maxMentees={maxMentees}
        isAcceptingRequests={isAcceptingRequests}
        onBioChange={setBio}
        onYearsChange={setYearsHomeschooling}
        onExpertiseChange={setExpertise}
        onMaxMenteesChange={setMaxMentees}
        onAcceptingChange={setIsAcceptingRequests}
      />

      <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
        <Button
          variant="ghost"
          size="sm"
          onClick={onDelete}
          className="text-status-error hover:text-status-errorDark"
        >
          Stop being a mentor
        </Button>
      </div>
    </div>
  );
}

function MyProfileFields({
  editing,
  profile,
  bio,
  yearsHomeschooling,
  expertise,
  maxMentees,
  isAcceptingRequests,
  onBioChange,
  onYearsChange,
  onExpertiseChange,
  onMaxMenteesChange,
  onAcceptingChange,
}: MyProfileFieldsProps) {
  return (
    <div className="space-y-4">
      <ProfileBioField
        editing={editing}
        bio={bio}
        displayBio={profile.bio}
        onBioChange={onBioChange}
      />
      <ProfileYearsField
        editing={editing}
        yearsHomeschooling={yearsHomeschooling}
        displayYears={profile.yearsHomeschooling}
        onYearsChange={onYearsChange}
      />
      <ProfileExpertiseField
        editing={editing}
        expertise={expertise}
        displayExpertise={profile.expertise}
        onExpertiseChange={onExpertiseChange}
      />
      <ProfileMaxMenteesField
        editing={editing}
        maxMentees={maxMentees}
        displayMaxMentees={profile.maxMentees}
        currentMenteeCount={profile.currentMenteeCount}
        onMaxMenteesChange={onMaxMenteesChange}
      />
      <ProfileAcceptingField
        editing={editing}
        isAcceptingRequests={isAcceptingRequests}
        displayIsAccepting={profile.isAcceptingRequests}
        onAcceptingChange={onAcceptingChange}
      />
    </div>
  );
}

function MyProfileHeader({
  editing,
  onEdit,
  onCancel,
  onSave,
}: MyProfileHeaderProps) {
  return (
    <div className="flex items-start justify-between mb-6">
      <h3 className="text-lg font-medium text-gray-900 dark:text-white">
        My Mentor Profile
      </h3>
      <div className="flex gap-2">
        {editing ? (
          <>
            <Button variant="ghost" size="sm" onClick={onCancel}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" onClick={onSave}>
              Save Changes
            </Button>
          </>
        ) : (
          <Button
            variant="ghost"
            size="sm"
            onClick={onEdit}
            className="text-brand-primary hover:text-brand-primaryDark"
          >
            Edit Profile
          </Button>
        )}
      </div>
    </div>
  );
}

function ProfileBioField({
  editing,
  bio,
  displayBio,
  onBioChange,
}: ProfileBioFieldProps) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
        About Me
      </label>
      {editing ? (
        <Textarea
          value={bio}
          onChange={(e: ChangeEvent<HTMLTextAreaElement>) =>
            onBioChange(e.target.value)
          }
          rows={3}
        />
      ) : (
        <p className="text-gray-600 dark:text-gray-400">{displayBio}</p>
      )}
    </div>
  );
}

function ProfileYearsField({
  editing,
  yearsHomeschooling,
  displayYears,
  onYearsChange,
}: ProfileYearsFieldProps) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
        Years Homeschooling
      </label>
      {editing ? (
        <Input
          type="number"
          value={yearsHomeschooling}
          onChange={(e: ChangeEvent<HTMLInputElement>) =>
            onYearsChange(parseInt(e.target.value) || 0)
          }
          min={0}
          className="w-24"
        />
      ) : (
        <p className="text-gray-600 dark:text-gray-400">{displayYears} years</p>
      )}
    </div>
  );
}

function ProfileExpertiseField({
  editing,
  expertise,
  displayExpertise,
  onExpertiseChange,
}: ProfileExpertiseFieldProps) {
  const handleToggle = useCallback(
    (key: MentorExpertise) => {
      if (expertise.includes(key)) {
        onExpertiseChange(expertise.filter((e) => e !== key));
      } else {
        onExpertiseChange([...expertise, key]);
      }
    },
    [expertise, onExpertiseChange],
  );

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
        Expertise Areas
      </label>
      {editing ? (
        <ExpertiseToggleList expertise={expertise} onToggle={handleToggle} />
      ) : (
        <div className="flex flex-wrap gap-2">
          {displayExpertise.map((exp) => {
            const config = expertiseConfig[exp];
            return (
              <span
                key={exp}
                className={`px-3 py-1 rounded-full text-sm ${config.bg} ${config.color}`}
              >
                {config.icon} {config.label}
              </span>
            );
          })}
        </div>
      )}
    </div>
  );
}

function ProfileMaxMenteesField({
  editing,
  maxMentees,
  displayMaxMentees,
  currentMenteeCount,
  onMaxMenteesChange,
}: ProfileMaxMenteesFieldProps) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
        Maximum Mentees
      </label>
      {editing ? (
        <Input
          type="number"
          value={maxMentees}
          onChange={(e: ChangeEvent<HTMLInputElement>) =>
            onMaxMenteesChange(parseInt(e.target.value) || 1)
          }
          min={1}
          max={10}
          className="w-24"
        />
      ) : (
        <p className="text-gray-600 dark:text-gray-400">
          {currentMenteeCount} / {displayMaxMentees} mentees
        </p>
      )}
    </div>
  );
}

function ProfileAcceptingField({
  editing,
  isAcceptingRequests,
  displayIsAccepting,
  onAcceptingChange,
}: ProfileAcceptingFieldProps) {
  return (
    <div>
      <Checkbox
        checked={editing ? isAcceptingRequests : displayIsAccepting}
        onChange={(e: ChangeEvent<HTMLInputElement>) =>
          editing && onAcceptingChange(e.target.checked)
        }
        disabled={!editing}
        label="Accepting new mentorship requests"
      />
    </div>
  );
}

// --- Expertise Toggle List (shared between MyProfileTab and BecomeMentorModal) ---

function ExpertiseToggleList({
  expertise,
  onToggle,
  darkMode,
}: ExpertiseToggleListProps) {
  const inactiveClass = darkMode
    ? "bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600"
    : "bg-gray-100 text-gray-500 hover:bg-gray-200";

  return (
    <div className="flex flex-wrap gap-2">
      {(
        Object.entries(expertiseConfig) as [
          MentorExpertise,
          typeof expertiseConfig.other,
        ][]
      ).map(([key, config]) => (
        <Button
          key={key}
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => onToggle(key)}
          aria-pressed={expertise.includes(key)}
          className={`rounded-full ${
            expertise.includes(key)
              ? `${config.bg} ${config.color}`
              : inactiveClass
          }`}
        >
          {config.icon} {config.label}
        </Button>
      ))}
    </div>
  );
}

// --- Become Mentor Modal ---

function useBecomeMentorForm(
  isOpen: boolean,
  groups: CoopGroup[],
  members: Record<string, CoopMember[]>,
  onSuccess: () => void,
) {
  const [selectedGroupId, setSelectedGroupId] = useState(groups[0]?.id || "");
  const [yearsHomeschooling, setYearsHomeschooling] = useState(1);
  const [expertise, setExpertise] = useState<MentorExpertise[]>([]);
  const [bio, setBio] = useState("");
  const [maxMentees, setMaxMentees] = useState(3);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!bio.trim() || expertise.length === 0 || !selectedGroupId) return;

      const groupMembers = members[selectedGroupId] || [];
      const currentMember =
        groupMembers.find((m) => m.role === "organizer") || groupMembers[0];
      if (!currentMember) {
        alert("You must be a member of the group to become a mentor.");
        return;
      }

      setSubmitting(true);
      try {
        await window.api.createMentorProfile({
          memberId: currentMember.id,
          yearsHomeschooling,
          expertise,
          bio: bio.trim(),
          maxMentees,
          isAcceptingRequests: true,
        });
        onSuccess();
      } catch (error) {
        console.error("Failed to create mentor profile:", error);
        alert("Failed to create mentor profile. Please try again.");
      } finally {
        setSubmitting(false);
      }
    },
    [
      bio,
      expertise,
      selectedGroupId,
      members,
      yearsHomeschooling,
      maxMentees,
      onSuccess,
    ],
  );

  const handleExpertiseToggle = useCallback(
    (key: MentorExpertise) => {
      if (expertise.includes(key)) {
        setExpertise(expertise.filter((e) => e !== key));
      } else {
        setExpertise([...expertise, key]);
      }
    },
    [expertise],
  );

  useEffect(() => {
    if (isOpen) {
      setSelectedGroupId(groups[0]?.id || "");
      setYearsHomeschooling(1);
      setExpertise([]);
      setBio("");
      setMaxMentees(3);
    }
  }, [isOpen, groups]);

  return {
    selectedGroupId,
    setSelectedGroupId,
    yearsHomeschooling,
    setYearsHomeschooling,
    expertise,
    handleExpertiseToggle,
    bio,
    setBio,
    maxMentees,
    setMaxMentees,
    submitting,
    handleSubmit,
  };
}

function BecomeMentorModal({
  isOpen,
  onClose,
  groups,
  members,
  onSuccess,
}: BecomeMentorModalProps) {
  const form = useBecomeMentorForm(isOpen, groups, members, onSuccess);

  return (
    <Dialog open={isOpen} onClose={onClose} className="relative z-50">
      <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="mx-auto max-w-md w-full bg-white dark:bg-gray-800 rounded-xl shadow-xl p-6 max-h-[90vh] overflow-y-auto">
          <Dialog.Title className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Become a Mentor
          </Dialog.Title>

          <BecomeMentorForm
            groups={groups}
            selectedGroupId={form.selectedGroupId}
            onGroupChange={form.setSelectedGroupId}
            yearsHomeschooling={form.yearsHomeschooling}
            onYearsChange={form.setYearsHomeschooling}
            expertise={form.expertise}
            onExpertiseChange={form.handleExpertiseToggle}
            bio={form.bio}
            onBioChange={form.setBio}
            maxMentees={form.maxMentees}
            onMaxMenteesChange={form.setMaxMentees}
            submitting={form.submitting}
            onSubmit={form.handleSubmit}
            onCancel={onClose}
          />
        </Dialog.Panel>
      </div>
    </Dialog>
  );
}

function BecomeMentorForm({
  groups,
  selectedGroupId,
  onGroupChange,
  yearsHomeschooling,
  onYearsChange,
  expertise,
  onExpertiseChange,
  bio,
  onBioChange,
  maxMentees,
  onMaxMenteesChange,
  submitting,
  onSubmit,
  onCancel,
}: BecomeMentorFormProps) {
  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <BecomeMentorFormFields
        groups={groups}
        selectedGroupId={selectedGroupId}
        onGroupChange={onGroupChange}
        yearsHomeschooling={yearsHomeschooling}
        onYearsChange={onYearsChange}
        expertise={expertise}
        onExpertiseChange={onExpertiseChange}
        bio={bio}
        onBioChange={onBioChange}
        maxMentees={maxMentees}
        onMaxMenteesChange={onMaxMenteesChange}
      />

      <BecomeMentorFormActions
        bio={bio}
        expertiseCount={expertise.length}
        submitting={submitting}
        onCancel={onCancel}
      />
    </form>
  );
}

function BecomeMentorFormFields({
  groups,
  selectedGroupId,
  onGroupChange,
  yearsHomeschooling,
  onYearsChange,
  expertise,
  onExpertiseChange,
  bio,
  onBioChange,
  maxMentees,
  onMaxMenteesChange,
}: BecomeMentorFormFieldsProps) {
  return (
    <>
      {groups.length > 1 && (
        <BecomeMentorFormGroupSelect
          groups={groups}
          selectedGroupId={selectedGroupId}
          onGroupChange={onGroupChange}
        />
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Years Homeschooling *
        </label>
        <Input
          type="number"
          value={yearsHomeschooling}
          onChange={(e: ChangeEvent<HTMLInputElement>) =>
            onYearsChange(parseInt(e.target.value) || 0)
          }
          min={0}
          className="w-24"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Expertise Areas * (select at least one)
        </label>
        <ExpertiseToggleList
          expertise={expertise}
          onToggle={onExpertiseChange}
          darkMode
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          About You *
        </label>
        <Textarea
          value={bio}
          onChange={(e: ChangeEvent<HTMLTextAreaElement>) =>
            onBioChange(e.target.value)
          }
          placeholder="Share your homeschool experience and what makes you a good mentor..."
          rows={4}
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Maximum Mentees
        </label>
        <Input
          type="number"
          value={maxMentees}
          onChange={(e: ChangeEvent<HTMLInputElement>) =>
            onMaxMenteesChange(parseInt(e.target.value) || 1)
          }
          min={1}
          max={10}
          className="w-24"
        />
        <p className="text-xs text-gray-500 mt-1">
          How many families can you mentor at once?
        </p>
      </div>
    </>
  );
}

function BecomeMentorFormGroupSelect({
  groups,
  selectedGroupId,
  onGroupChange,
}: BecomeMentorFormGroupSelectProps) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
        Co-op Group
      </label>
      <select
        value={selectedGroupId}
        onChange={(e) => onGroupChange(e.target.value)}
        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
      >
        {groups.map((group) => (
          <option key={group.id} value={group.id}>
            {group.name}
          </option>
        ))}
      </select>
    </div>
  );
}

function BecomeMentorFormActions({
  bio,
  expertiseCount,
  submitting,
  onCancel,
}: BecomeMentorFormActionsProps) {
  return (
    <div className="flex justify-end gap-3 pt-4">
      <Button type="button" variant="ghost" onClick={onCancel}>
        Cancel
      </Button>
      <Button
        type="submit"
        variant="primary"
        disabled={!bio.trim() || expertiseCount === 0 || submitting}
      >
        {submitting ? "Creating..." : "Become a Mentor"}
      </Button>
    </div>
  );
}

// --- Request Mentor Modal ---

function RequestMentorModal({
  mentor,
  onClose,
  currentMemberId,
  onSuccess,
}: RequestMentorModalProps) {
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!mentor || !currentMemberId || !message.trim()) return;

      setSubmitting(true);
      try {
        await window.api.createMentorRequest({
          mentorId: mentor.id,
          requesterId: currentMemberId,
          message: message.trim(),
        });
        onSuccess();
      } catch (error) {
        console.error("Failed to create mentor request:", error);
        alert("Failed to send request. Please try again.");
      } finally {
        setSubmitting(false);
      }
    },
    [mentor, currentMemberId, message, onSuccess],
  );

  useEffect(() => {
    if (mentor) {
      setMessage("");
    }
  }, [mentor]);

  if (!mentor) return null;

  return (
    <Dialog open={!!mentor} onClose={onClose} className="relative z-50">
      <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="mx-auto max-w-md w-full bg-white dark:bg-gray-800 rounded-xl shadow-xl p-6">
          <Dialog.Title className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Request Mentorship
          </Dialog.Title>

          <MentorPreviewCard mentor={mentor} />

          <RequestMentorForm
            message={message}
            onMessageChange={setMessage}
            submitting={submitting}
            onSubmit={handleSubmit}
            onCancel={onClose}
          />
        </Dialog.Panel>
      </div>
    </Dialog>
  );
}

function MentorPreviewCard({ mentor }: MentorPreviewCardProps) {
  return (
    <>
      <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg mb-4">
        <div
          className={`w-10 h-10 rounded-full bg-gradient-to-br from-brand-primary to-student-purple-500 flex items-center justify-center text-white font-medium`}
        >
          {mentor.memberName.charAt(0).toUpperCase()}
        </div>
        <div>
          <h4 className="font-medium text-gray-900 dark:text-white">
            {mentor.memberName}
          </h4>
          <p className="text-xs text-gray-500">
            {mentor.yearsHomeschooling} years homeschooling
          </p>
        </div>
      </div>

      <div className="flex flex-wrap gap-1.5 mb-4">
        {mentor.expertise.map((exp) => {
          const config = expertiseConfig[exp];
          return (
            <span
              key={exp}
              className={`text-xs px-2 py-0.5 rounded-full ${config.bg} ${config.color}`}
            >
              {config.icon} {config.label}
            </span>
          );
        })}
      </div>

      <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
        {mentor.bio}
      </p>
    </>
  );
}

function RequestMentorForm({
  message,
  onMessageChange,
  submitting,
  onSubmit,
  onCancel,
}: RequestMentorFormProps) {
  return (
    <form onSubmit={onSubmit}>
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Your Message *
        </label>
        <Textarea
          value={message}
          onChange={(e: ChangeEvent<HTMLTextAreaElement>) =>
            onMessageChange(e.target.value)
          }
          placeholder="Introduce yourself and what you're hoping to learn..."
          rows={4}
          required
        />
      </div>

      <div className="flex justify-end gap-3">
        <Button type="button" variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
        <Button
          type="submit"
          variant="primary"
          disabled={!message.trim() || submitting}
        >
          {submitting ? "Sending..." : "Send Request"}
        </Button>
      </div>
    </form>
  );
}

// --- Icons ---

function SearchIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      aria-hidden="true"
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

function UsersIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
      />
    </svg>
  );
}

export default MentorMatching;
