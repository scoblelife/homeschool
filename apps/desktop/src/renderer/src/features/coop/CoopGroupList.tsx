import { useState, useEffect, useCallback, type ChangeEvent } from "react";
import { Dialog } from "@headlessui/react";
import { Button, Input, Textarea } from "../../components/ui";
import type {
  CoopGroup,
  CreateCoopGroup,
  CoopMember,
  CreateCoopMember,
} from "../../../../shared/types";

interface CoopGroupListProps {
  onSelectGroup: (group: CoopGroup) => void;
}

export function CoopGroupList({ onSelectGroup }: CoopGroupListProps) {
  const [groups, setGroups] = useState<CoopGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [newGroupName, setNewGroupName] = useState("");
  const [newGroupDescription, setNewGroupDescription] = useState("");
  const [joinCode, setJoinCode] = useState("");
  const [joinError, setJoinError] = useState("");
  const [familyName, setFamilyName] = useState("");

  const loadGroups = useCallback(async () => {
    try {
      const data = await window.api.getCoopGroups();
      setGroups(data);
    } catch (error) {
      console.error("Failed to load groups:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadGroups();
  }, [loadGroups]);

  const handleCreateGroup = async () => {
    if (!newGroupName.trim() || !familyName.trim()) return;

    try {
      // Get device ID from settings or generate one
      const deviceId = (await window.api.getSetting("deviceId")) || "unknown";

      const group = await window.api.createCoopGroup({
        name: newGroupName.trim(),
        description: newGroupDescription.trim() || undefined,
        createdBy: deviceId,
      });

      // Add creator as organizer
      await window.api.createCoopMember({
        groupId: group.id,
        familyName: familyName.trim(),
        role: "organizer",
      });

      setNewGroupName("");
      setNewGroupDescription("");
      setFamilyName("");
      setShowCreateModal(false);
      await loadGroups();
    } catch (error) {
      console.error("Failed to create group:", error);
    }
  };

  const handleJoinGroup = async () => {
    if (!joinCode.trim() || !familyName.trim()) return;
    setJoinError("");

    try {
      const group = await window.api.getCoopGroupByInviteCode(
        joinCode.trim().toUpperCase(),
      );
      if (!group) {
        setJoinError("Invalid invite code. Please check and try again.");
        return;
      }

      // Check if already a member
      const members = await window.api.getCoopMembers(group.id);
      const existingMember = members.find(
        (m) => m.familyName.toLowerCase() === familyName.trim().toLowerCase(),
      );
      if (existingMember) {
        setJoinError("A family with this name is already in the group.");
        return;
      }

      await window.api.createCoopMember({
        groupId: group.id,
        familyName: familyName.trim(),
        role: "member",
      });

      setJoinCode("");
      setFamilyName("");
      setShowJoinModal(false);
      await loadGroups();
    } catch (error) {
      console.error("Failed to join group:", error);
      setJoinError("Failed to join group. Please try again.");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-48">
        <div className="text-gray-500">Loading groups...</div>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Your Co-op Groups
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Join or create groups to coordinate activities with other homeschool
            families.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={() => setShowJoinModal(true)}>
            Join Group
          </Button>
          <Button variant="primary" onClick={() => setShowCreateModal(true)}>
            Create Group
          </Button>
        </div>
      </div>

      {/* Groups List */}
      {groups.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <GroupIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            No groups yet
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Create a new group or join an existing one with an invite code.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {groups.map((group) => (
            <Button
              key={group.id}
              variant="ghost"
              onClick={() => onSelectGroup(group)}
              className="text-left bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:border-brand-primary hover:shadow-md transition-all h-auto items-start"
            >
              <div className="flex items-start gap-3 w-full">
                <div className="p-2 bg-brand-primaryLight rounded-lg">
                  <GroupIcon className="w-6 h-6 text-brand-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-gray-900 dark:text-white truncate">
                    {group.name}
                  </h3>
                  {group.description && (
                    <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                      {group.description}
                    </p>
                  )}
                  <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                    Code: {group.inviteCode}
                  </p>
                </div>
                <ChevronRightIcon className="w-5 h-5 text-gray-400" />
              </div>
            </Button>
          ))}
        </div>
      )}

      {/* Create Group Modal */}
      <Dialog
        open={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        className="relative z-50"
      >
        <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <Dialog.Panel className="mx-auto max-w-md w-full bg-white dark:bg-gray-800 rounded-xl shadow-xl p-6">
            <Dialog.Title className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Create Co-op Group
            </Dialog.Title>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Group Name *
                </label>
                <Input
                  type="text"
                  value={newGroupName}
                  onChange={(e: ChangeEvent<HTMLInputElement>) =>
                    setNewGroupName(e.target.value)
                  }
                  placeholder="e.g., Valley Homeschool Co-op"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Description
                </label>
                <Textarea
                  value={newGroupDescription}
                  onChange={(e: ChangeEvent<HTMLTextAreaElement>) =>
                    setNewGroupDescription(e.target.value)
                  }
                  placeholder="What's your group about?"
                  rows={3}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Your Family Name *
                </label>
                <Input
                  type="text"
                  value={familyName}
                  onChange={(e: ChangeEvent<HTMLInputElement>) =>
                    setFamilyName(e.target.value)
                  }
                  placeholder="e.g., The Smith Family"
                />
                <p className="text-xs text-gray-500 mt-1">
                  This is how other members will see you.
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <Button variant="ghost" onClick={() => setShowCreateModal(false)}>
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={handleCreateGroup}
                disabled={!newGroupName.trim() || !familyName.trim()}
              >
                Create Group
              </Button>
            </div>
          </Dialog.Panel>
        </div>
      </Dialog>

      {/* Join Group Modal */}
      <Dialog
        open={showJoinModal}
        onClose={() => setShowJoinModal(false)}
        className="relative z-50"
      >
        <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <Dialog.Panel className="mx-auto max-w-md w-full bg-white dark:bg-gray-800 rounded-xl shadow-xl p-6">
            <Dialog.Title className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Join Co-op Group
            </Dialog.Title>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Invite Code *
                </label>
                <Input
                  type="text"
                  value={joinCode}
                  onChange={(e: ChangeEvent<HTMLInputElement>) =>
                    setJoinCode(e.target.value.toUpperCase())
                  }
                  placeholder="Enter 6-character code"
                  maxLength={6}
                  className="font-mono text-center text-lg tracking-widest"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Your Family Name *
                </label>
                <Input
                  type="text"
                  value={familyName}
                  onChange={(e: ChangeEvent<HTMLInputElement>) =>
                    setFamilyName(e.target.value)
                  }
                  placeholder="e.g., The Smith Family"
                />
              </div>

              {joinError && (
                <p className="text-sm text-status-error dark:text-status-error">
                  {joinError}
                </p>
              )}
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <Button
                variant="ghost"
                onClick={() => {
                  setShowJoinModal(false);
                  setJoinError("");
                }}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={handleJoinGroup}
                disabled={joinCode.length !== 6 || !familyName.trim()}
              >
                Join Group
              </Button>
            </div>
          </Dialog.Panel>
        </div>
      </Dialog>
    </div>
  );
}

// Icons
function GroupIcon({ className }: { className?: string }) {
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
        d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
      />
    </svg>
  );
}

function ChevronRightIcon({ className }: { className?: string }) {
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
        d="M9 5l7 7-7 7"
      />
    </svg>
  );
}
