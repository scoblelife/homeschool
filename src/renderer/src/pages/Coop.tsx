import { useState } from 'react'
import { CoopGroupList, CoopGroupDetail } from '../features/coop'
import { FieldTripDiscovery } from '../features/fieldTrips'
import { ResourceSharing, ExternalSources } from '../features/community'
import { MentorMatching } from '../features/mentorship'
import type { CoopGroup } from '../../../shared/types'

type TabType = 'groups' | 'discover' | 'external' | 'resources' | 'mentors'

/**
 * Render the Co-op Groups page with tabs for My Groups, Discover Events, Community Sources, Shared Resources, and Mentors.
 *
 * Displays a group detail view when a group is selected; otherwise shows the tabbed list and corresponding content.
 *
 * @returns The JSX element for the Co-op Groups page.
 */
export default function Coop() {
  const [selectedGroup, setSelectedGroup] = useState<CoopGroup | null>(null)
  const [activeTab, setActiveTab] = useState<TabType>('groups')

  const handleGroupDeleted = () => {
    setSelectedGroup(null)
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Co-op Groups
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          Coordinate activities and events with other homeschool families.
        </p>
      </div>

      {/* Tabs - only show when not viewing a group detail */}
      {!selectedGroup && (
        <div className="flex gap-4 border-b border-gray-200 dark:border-gray-700 mb-6">
          <button
            onClick={() => setActiveTab('groups')}
            className={`pb-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'groups'
                ? 'border-fuchsia-500 text-fuchsia-600 dark:text-fuchsia-400'
                : 'border-transparent text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white'
            }`}
          >
            My Groups
          </button>
          <button
            onClick={() => setActiveTab('discover')}
            className={`pb-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'discover'
                ? 'border-fuchsia-500 text-fuchsia-600 dark:text-fuchsia-400'
                : 'border-transparent text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white'
            }`}
          >
            Discover Events
          </button>
          <button
            onClick={() => setActiveTab('external')}
            className={`pb-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'external'
                ? 'border-fuchsia-500 text-fuchsia-600 dark:text-fuchsia-400'
                : 'border-transparent text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white'
            }`}
          >
            Community Sources
          </button>
          <button
            onClick={() => setActiveTab('resources')}
            className={`pb-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'resources'
                ? 'border-fuchsia-500 text-fuchsia-600 dark:text-fuchsia-400'
                : 'border-transparent text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white'
            }`}
          >
            Shared Resources
          </button>
          <button
            onClick={() => setActiveTab('mentors')}
            className={`pb-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'mentors'
                ? 'border-fuchsia-500 text-fuchsia-600 dark:text-fuchsia-400'
                : 'border-transparent text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white'
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
      ) : activeTab === 'groups' ? (
        <>
          {/* Info box */}
          <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
            <h3 className="font-medium text-blue-900 dark:text-blue-100 mb-2">
              What are Co-op Groups?
            </h3>
            <p className="text-sm text-blue-700 dark:text-blue-300">
              Co-op groups let you connect with other homeschool families to plan park days,
              field trips, game nights, and group classes. Create a group and share the invite
              code with other families to get started!
            </p>
          </div>
          <CoopGroupList onSelectGroup={setSelectedGroup} />
        </>
      ) : activeTab === 'discover' ? (
        <FieldTripDiscovery />
      ) : activeTab === 'external' ? (
        <ExternalSources />
      ) : activeTab === 'resources' ? (
        <ResourceSharing />
      ) : (
        <MentorMatching />
      )}
    </div>
  )
}