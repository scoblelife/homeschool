import { useState } from 'react'
import { CoopGroupList, CoopGroupDetail } from '../features/coop'
import type { CoopGroup } from '../../../shared/types'

export default function Coop() {
  const [selectedGroup, setSelectedGroup] = useState<CoopGroup | null>(null)

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

      {selectedGroup ? (
        <CoopGroupDetail
          group={selectedGroup}
          onBack={() => setSelectedGroup(null)}
          onGroupDeleted={handleGroupDeleted}
        />
      ) : (
        <CoopGroupList onSelectGroup={setSelectedGroup} />
      )}
    </div>
  )
}
