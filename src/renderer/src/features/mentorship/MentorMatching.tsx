import { useState, useEffect, useCallback, useMemo } from 'react'
import { Dialog } from '@headlessui/react'
import { format, parseISO } from 'date-fns'
import type {
  MentorProfile,
  CreateMentorProfile,
  MentorExpertise,
  MentorRequest,
  MentorRequestStatus,
  CoopGroup,
  CoopMember
} from '../../../../shared/types'

type ExtendedMentorProfile = MentorProfile & { memberName: string; groupName: string }
type ExtendedMentorRequest = MentorRequest & { requesterName?: string; mentorName?: string }

const expertiseConfig: Record<MentorExpertise, { icon: string; label: string; color: string; bg: string }> = {
  new_to_homeschool: { icon: '🌱', label: 'Getting Started', color: 'text-green-600', bg: 'bg-green-100' },
  curriculum: { icon: '📚', label: 'Curriculum', color: 'text-blue-600', bg: 'bg-blue-100' },
  special_needs: { icon: '💜', label: 'Special Needs', color: 'text-purple-600', bg: 'bg-purple-100' },
  high_school: { icon: '🎓', label: 'High School', color: 'text-amber-600', bg: 'bg-amber-100' },
  college_prep: { icon: '🏛️', label: 'College Prep', color: 'text-indigo-600', bg: 'bg-indigo-100' },
  organization: { icon: '📋', label: 'Organization', color: 'text-teal-600', bg: 'bg-teal-100' },
  legal: { icon: '⚖️', label: 'Legal/Compliance', color: 'text-gray-600', bg: 'bg-gray-100' },
  other: { icon: '✨', label: 'Other', color: 'text-fuchsia-600', bg: 'bg-fuchsia-100' }
}

export function MentorMatching() {
  const [mentors, setMentors] = useState<ExtendedMentorProfile[]>([])
  const [groups, setGroups] = useState<CoopGroup[]>([])
  const [members, setMembers] = useState<Record<string, CoopMember[]>>({})
  const [loading, setLoading] = useState(true)
  const [showBecomeMentorModal, setShowBecomeMentorModal] = useState(false)
  const [showRequestModal, setShowRequestModal] = useState<ExtendedMentorProfile | null>(null)
  const [myProfile, setMyProfile] = useState<MentorProfile | null>(null)
  const [myRequests, setMyRequests] = useState<ExtendedMentorRequest[]>([])
  const [pendingRequests, setPendingRequests] = useState<ExtendedMentorRequest[]>([])
  const [activeTab, setActiveTab] = useState<'find' | 'requests' | 'my-profile'>('find')

  // Filters
  const [searchQuery, setSearchQuery] = useState('')
  const [expertiseFilter, setExpertiseFilter] = useState<MentorExpertise | 'all'>('all')

  const loadData = useCallback(async () => {
    try {
      setLoading(true)
      const [mentorsData, groupsData] = await Promise.all([
        window.api.getMentorProfiles(),
        window.api.getCoopGroups()
      ])
      setMentors(mentorsData)
      setGroups(groupsData)

      // Load members for each group
      const membersMap: Record<string, CoopMember[]> = {}
      for (const group of groupsData) {
        membersMap[group.id] = await window.api.getCoopMembers(group.id)
      }
      setMembers(membersMap)

      // Check if current user is a mentor (simplified: check first organizer)
      for (const group of groupsData) {
        const groupMembers = membersMap[group.id] || []
        const currentMember = groupMembers.find(m => m.role === 'organizer') || groupMembers[0]
        if (currentMember) {
          const profile = await window.api.getMyMentorProfile(currentMember.id)
          if (profile) {
            setMyProfile(profile)
            // Load pending requests for this mentor
            const requests = await window.api.getMentorRequests(profile.id)
            setPendingRequests(requests.filter(r => r.status === 'pending'))
          }
          // Load my outgoing requests
          const myReqs = await window.api.getMyMentorRequests(currentMember.id)
          setMyRequests(myReqs)
          break
        }
      }
    } catch (error) {
      console.error('Failed to load mentors:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  const filteredMentors = useMemo(() => {
    return mentors.filter(mentor => {
      // Don't show own profile in list
      if (myProfile && mentor.id === myProfile.id) return false

      // Only show mentors accepting requests
      if (!mentor.isAcceptingRequests) return false

      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase()
        const matchesSearch =
          mentor.memberName.toLowerCase().includes(query) ||
          mentor.bio.toLowerCase().includes(query) ||
          mentor.groupName.toLowerCase().includes(query) ||
          mentor.expertise.some(e => expertiseConfig[e].label.toLowerCase().includes(query))
        if (!matchesSearch) return false
      }

      // Expertise filter
      if (expertiseFilter !== 'all' && !mentor.expertise.includes(expertiseFilter)) {
        return false
      }

      return true
    })
  }, [mentors, myProfile, searchQuery, expertiseFilter])

  const getCurrentMemberId = useCallback(() => {
    for (const group of groups) {
      const groupMembers = members[group.id] || []
      const currentMember = groupMembers.find(m => m.role === 'organizer') || groupMembers[0]
      if (currentMember) return currentMember.id
    }
    return null
  }, [groups, members])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-48">
        <div className="text-gray-500 dark:text-gray-400">Loading mentors...</div>
      </div>
    )
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Mentor Matching</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Connect with experienced homeschool families for guidance and support
          </p>
        </div>
        {groups.length > 0 && !myProfile && (
          <button
            onClick={() => setShowBecomeMentorModal(true)}
            className="px-4 py-2 bg-fuchsia-500 text-white rounded-lg hover:bg-fuchsia-600 transition-colors text-sm font-medium"
          >
            Become a Mentor
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-4 border-b border-gray-200 dark:border-gray-700 mb-6">
        <button
          onClick={() => setActiveTab('find')}
          className={`pb-3 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'find'
              ? 'border-fuchsia-500 text-fuchsia-600 dark:text-fuchsia-400'
              : 'border-transparent text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white'
          }`}
        >
          Find a Mentor
        </button>
        <button
          onClick={() => setActiveTab('requests')}
          className={`pb-3 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === 'requests'
              ? 'border-fuchsia-500 text-fuchsia-600 dark:text-fuchsia-400'
              : 'border-transparent text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white'
          }`}
        >
          My Requests
          {(pendingRequests.length > 0 || myRequests.some(r => r.status === 'pending')) && (
            <span className="px-2 py-0.5 text-xs bg-fuchsia-100 text-fuchsia-700 rounded-full">
              {pendingRequests.length + myRequests.filter(r => r.status === 'pending').length}
            </span>
          )}
        </button>
        {myProfile && (
          <button
            onClick={() => setActiveTab('my-profile')}
            className={`pb-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'my-profile'
                ? 'border-fuchsia-500 text-fuchsia-600 dark:text-fuchsia-400'
                : 'border-transparent text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white'
            }`}
          >
            My Mentor Profile
          </button>
        )}
      </div>

      {/* Tab Content */}
      {activeTab === 'find' && (
        <>
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search mentors..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 focus:ring-2 focus:ring-fuchsia-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Expertise Filter */}
            <select
              value={expertiseFilter}
              onChange={(e) => setExpertiseFilter(e.target.value as MentorExpertise | 'all')}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-fuchsia-500 focus:border-transparent"
            >
              <option value="all">All expertise</option>
              {Object.entries(expertiseConfig).map(([key, config]) => (
                <option key={key} value={key}>{config.icon} {config.label}</option>
              ))}
            </select>
          </div>

          {/* Mentors Grid */}
          {filteredMentors.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <UsersIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                {mentors.length === 0 ? 'No mentors available yet' : 'No matching mentors'}
              </h3>
              <p className="text-gray-600 dark:text-gray-400 max-w-md mx-auto">
                {mentors.length === 0
                  ? groups.length === 0
                    ? 'Join a co-op group to find mentors.'
                    : 'Be the first to offer mentorship in your co-op!'
                  : 'Try adjusting your search or filters.'}
              </p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredMentors.map(mentor => (
                <MentorCard
                  key={mentor.id}
                  mentor={mentor}
                  onClick={() => setShowRequestModal(mentor)}
                />
              ))}
            </div>
          )}
        </>
      )}

      {activeTab === 'requests' && (
        <RequestsTab
          myRequests={myRequests}
          pendingRequests={pendingRequests}
          onRespond={async (id, status, message) => {
            await window.api.respondToMentorRequest(id, status, message)
            loadData()
          }}
        />
      )}

      {activeTab === 'my-profile' && myProfile && (
        <MyProfileTab
          profile={myProfile}
          onUpdate={async (data) => {
            await window.api.updateMentorProfile(myProfile.id, data)
            loadData()
          }}
          onDelete={async () => {
            if (confirm('Are you sure you want to stop being a mentor? Your profile will be deleted.')) {
              await window.api.deleteMentorProfile(myProfile.id)
              setMyProfile(null)
              setActiveTab('find')
              loadData()
            }
          }}
        />
      )}

      {/* Become Mentor Modal */}
      <BecomeMentorModal
        isOpen={showBecomeMentorModal}
        onClose={() => setShowBecomeMentorModal(false)}
        groups={groups}
        members={members}
        onSuccess={() => {
          setShowBecomeMentorModal(false)
          loadData()
        }}
      />

      {/* Request Mentor Modal */}
      <RequestMentorModal
        mentor={showRequestModal}
        onClose={() => setShowRequestModal(null)}
        currentMemberId={getCurrentMemberId()}
        onSuccess={() => {
          setShowRequestModal(null)
          loadData()
        }}
      />
    </div>
  )
}

function MentorCard({ mentor, onClick }: { mentor: ExtendedMentorProfile; onClick: () => void }) {
  const availableSlots = mentor.maxMentees - mentor.currentMenteeCount

  return (
    <button
      onClick={onClick}
      className="text-left bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:border-fuchsia-300 dark:hover:border-fuchsia-600 transition-colors w-full"
    >
      <div className="flex items-start gap-3">
        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-fuchsia-400 to-purple-500 flex items-center justify-center text-white text-lg font-medium">
          {mentor.memberName.charAt(0).toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-gray-900 dark:text-white">{mentor.memberName}</h3>
          <p className="text-xs text-gray-500 dark:text-gray-400">{mentor.groupName}</p>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            {mentor.yearsHomeschooling} years homeschooling
          </p>
        </div>
      </div>

      {/* Expertise Tags */}
      <div className="flex flex-wrap gap-1.5 mt-3">
        {mentor.expertise.slice(0, 3).map(exp => {
          const config = expertiseConfig[exp]
          return (
            <span
              key={exp}
              className={`text-xs px-2 py-0.5 rounded-full ${config.bg} ${config.color}`}
            >
              {config.icon} {config.label}
            </span>
          )
        })}
        {mentor.expertise.length > 3 && (
          <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
            +{mentor.expertise.length - 3} more
          </span>
        )}
      </div>

      {/* Bio Preview */}
      <p className="text-sm text-gray-600 dark:text-gray-400 mt-3 line-clamp-2">
        {mentor.bio}
      </p>

      {/* Availability */}
      <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100 dark:border-gray-700">
        <span className={`text-xs ${availableSlots > 0 ? 'text-green-600' : 'text-gray-400'}`}>
          {availableSlots > 0 ? `${availableSlots} spot${availableSlots > 1 ? 's' : ''} available` : 'Fully booked'}
        </span>
        <span className="text-xs text-fuchsia-600 font-medium">Request mentorship →</span>
      </div>
    </button>
  )
}

function RequestsTab({
  myRequests,
  pendingRequests,
  onRespond
}: {
  myRequests: ExtendedMentorRequest[]
  pendingRequests: ExtendedMentorRequest[]
  onRespond: (id: string, status: MentorRequestStatus, message?: string) => Promise<void>
}) {
  const [responding, setResponding] = useState<string | null>(null)
  const [responseMessage, setResponseMessage] = useState('')

  return (
    <div className="space-y-6">
      {/* Incoming Requests (if mentor) */}
      {pendingRequests.length > 0 && (
        <div>
          <h3 className="text-md font-medium text-gray-900 dark:text-white mb-3">
            Incoming Requests ({pendingRequests.length})
          </h3>
          <div className="space-y-3">
            {pendingRequests.map(request => (
              <div
                key={request.id}
                className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-white">
                      {request.requesterName}
                    </h4>
                    <p className="text-sm text-gray-500 mt-1">
                      Requested {format(parseISO(request.createdAt), 'MMM d, yyyy')}
                    </p>
                  </div>
                  <span className="px-2 py-1 text-xs bg-amber-100 text-amber-700 rounded-full">
                    Pending
                  </span>
                </div>
                <p className="text-gray-600 dark:text-gray-400 mt-3">{request.message}</p>

                {responding === request.id ? (
                  <div className="mt-4 space-y-3">
                    <textarea
                      value={responseMessage}
                      onChange={(e) => setResponseMessage(e.target.value)}
                      placeholder="Add a message (optional)"
                      rows={2}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={async () => {
                          await onRespond(request.id, 'accepted', responseMessage)
                          setResponding(null)
                          setResponseMessage('')
                        }}
                        className="px-3 py-1.5 bg-green-500 text-white rounded-lg text-sm hover:bg-green-600"
                      >
                        Accept
                      </button>
                      <button
                        onClick={async () => {
                          await onRespond(request.id, 'declined', responseMessage)
                          setResponding(null)
                          setResponseMessage('')
                        }}
                        className="px-3 py-1.5 bg-red-500 text-white rounded-lg text-sm hover:bg-red-600"
                      >
                        Decline
                      </button>
                      <button
                        onClick={() => {
                          setResponding(null)
                          setResponseMessage('')
                        }}
                        className="px-3 py-1.5 text-gray-600 hover:text-gray-800 text-sm"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => setResponding(request.id)}
                    className="mt-3 text-sm text-fuchsia-600 hover:text-fuchsia-700 font-medium"
                  >
                    Respond to request
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* My Outgoing Requests */}
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
            {myRequests.map(request => (
              <div
                key={request.id}
                className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-white">
                      To: {request.mentorName}
                    </h4>
                    <p className="text-sm text-gray-500 mt-1">
                      Sent {format(parseISO(request.createdAt), 'MMM d, yyyy')}
                    </p>
                  </div>
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    request.status === 'pending'
                      ? 'bg-amber-100 text-amber-700'
                      : request.status === 'accepted'
                      ? 'bg-green-100 text-green-700'
                      : 'bg-red-100 text-red-700'
                  }`}>
                    {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                  </span>
                </div>
                <p className="text-gray-600 dark:text-gray-400 mt-3 text-sm">{request.message}</p>
                {request.responseMessage && (
                  <div className="mt-3 p-2 bg-gray-50 dark:bg-gray-700 rounded text-sm">
                    <span className="font-medium">Response: </span>
                    {request.responseMessage}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function MyProfileTab({
  profile,
  onUpdate,
  onDelete
}: {
  profile: MentorProfile
  onUpdate: (data: Partial<CreateMentorProfile>) => Promise<void>
  onDelete: () => Promise<void>
}) {
  const [editing, setEditing] = useState(false)
  const [bio, setBio] = useState(profile.bio)
  const [yearsHomeschooling, setYearsHomeschooling] = useState(profile.yearsHomeschooling)
  const [expertise, setExpertise] = useState<MentorExpertise[]>(profile.expertise)
  const [maxMentees, setMaxMentees] = useState(profile.maxMentees)
  const [isAcceptingRequests, setIsAcceptingRequests] = useState(profile.isAcceptingRequests)

  const handleSave = async () => {
    await onUpdate({
      bio,
      yearsHomeschooling,
      expertise,
      maxMentees,
      isAcceptingRequests
    })
    setEditing(false)
  }

  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
      <div className="flex items-start justify-between mb-6">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white">My Mentor Profile</h3>
        <div className="flex gap-2">
          {editing ? (
            <>
              <button
                onClick={() => setEditing(false)}
                className="px-3 py-1.5 text-gray-600 hover:text-gray-800 text-sm"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="px-3 py-1.5 bg-fuchsia-500 text-white rounded-lg text-sm hover:bg-fuchsia-600"
              >
                Save Changes
              </button>
            </>
          ) : (
            <button
              onClick={() => setEditing(true)}
              className="px-3 py-1.5 text-fuchsia-600 hover:text-fuchsia-700 text-sm font-medium"
            >
              Edit Profile
            </button>
          )}
        </div>
      </div>

      <div className="space-y-4">
        {/* Bio */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            About Me
          </label>
          {editing ? (
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          ) : (
            <p className="text-gray-600 dark:text-gray-400">{profile.bio}</p>
          )}
        </div>

        {/* Years Homeschooling */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Years Homeschooling
          </label>
          {editing ? (
            <input
              type="number"
              value={yearsHomeschooling}
              onChange={(e) => setYearsHomeschooling(parseInt(e.target.value) || 0)}
              min={0}
              className="w-24 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          ) : (
            <p className="text-gray-600 dark:text-gray-400">{profile.yearsHomeschooling} years</p>
          )}
        </div>

        {/* Expertise */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Expertise Areas
          </label>
          {editing ? (
            <div className="flex flex-wrap gap-2">
              {(Object.entries(expertiseConfig) as [MentorExpertise, typeof expertiseConfig.other][]).map(
                ([key, config]) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => {
                      if (expertise.includes(key)) {
                        setExpertise(expertise.filter(e => e !== key))
                      } else {
                        setExpertise([...expertise, key])
                      }
                    }}
                    className={`px-3 py-1.5 rounded-full text-sm ${
                      expertise.includes(key)
                        ? `${config.bg} ${config.color}`
                        : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                    }`}
                  >
                    {config.icon} {config.label}
                  </button>
                )
              )}
            </div>
          ) : (
            <div className="flex flex-wrap gap-2">
              {profile.expertise.map(exp => {
                const config = expertiseConfig[exp]
                return (
                  <span key={exp} className={`px-3 py-1 rounded-full text-sm ${config.bg} ${config.color}`}>
                    {config.icon} {config.label}
                  </span>
                )
              })}
            </div>
          )}
        </div>

        {/* Max Mentees */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Maximum Mentees
          </label>
          {editing ? (
            <input
              type="number"
              value={maxMentees}
              onChange={(e) => setMaxMentees(parseInt(e.target.value) || 1)}
              min={1}
              max={10}
              className="w-24 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          ) : (
            <p className="text-gray-600 dark:text-gray-400">
              {profile.currentMenteeCount} / {profile.maxMentees} mentees
            </p>
          )}
        </div>

        {/* Accepting Requests */}
        <div>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={editing ? isAcceptingRequests : profile.isAcceptingRequests}
              onChange={(e) => editing && setIsAcceptingRequests(e.target.checked)}
              disabled={!editing}
              className="rounded border-gray-300 text-fuchsia-500 focus:ring-fuchsia-500"
            />
            <span className="text-sm text-gray-700 dark:text-gray-300">
              Accepting new mentorship requests
            </span>
          </label>
        </div>
      </div>

      {/* Delete Profile */}
      <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
        <button
          onClick={onDelete}
          className="text-sm text-red-600 hover:text-red-700"
        >
          Stop being a mentor
        </button>
      </div>
    </div>
  )
}

function BecomeMentorModal({
  isOpen,
  onClose,
  groups,
  members,
  onSuccess
}: {
  isOpen: boolean
  onClose: () => void
  groups: CoopGroup[]
  members: Record<string, CoopMember[]>
  onSuccess: () => void
}) {
  const [selectedGroupId, setSelectedGroupId] = useState(groups[0]?.id || '')
  const [yearsHomeschooling, setYearsHomeschooling] = useState(1)
  const [expertise, setExpertise] = useState<MentorExpertise[]>([])
  const [bio, setBio] = useState('')
  const [maxMentees, setMaxMentees] = useState(3)
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!bio.trim() || expertise.length === 0 || !selectedGroupId) return

    const groupMembers = members[selectedGroupId] || []
    const currentMember = groupMembers.find(m => m.role === 'organizer') || groupMembers[0]
    if (!currentMember) {
      alert('You must be a member of the group to become a mentor.')
      return
    }

    setSubmitting(true)
    try {
      await window.api.createMentorProfile({
        memberId: currentMember.id,
        yearsHomeschooling,
        expertise,
        bio: bio.trim(),
        maxMentees,
        isAcceptingRequests: true
      })
      onSuccess()
    } catch (error) {
      console.error('Failed to create mentor profile:', error)
      alert('Failed to create mentor profile. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  useEffect(() => {
    if (isOpen) {
      setSelectedGroupId(groups[0]?.id || '')
      setYearsHomeschooling(1)
      setExpertise([])
      setBio('')
      setMaxMentees(3)
    }
  }, [isOpen, groups])

  return (
    <Dialog open={isOpen} onClose={onClose} className="relative z-50">
      <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="mx-auto max-w-md w-full bg-white dark:bg-gray-800 rounded-xl shadow-xl p-6 max-h-[90vh] overflow-y-auto">
          <Dialog.Title className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Become a Mentor
          </Dialog.Title>

          <form onSubmit={handleSubmit} className="space-y-4">
            {groups.length > 1 && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Co-op Group
                </label>
                <select
                  value={selectedGroupId}
                  onChange={(e) => setSelectedGroupId(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  {groups.map(group => (
                    <option key={group.id} value={group.id}>{group.name}</option>
                  ))}
                </select>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Years Homeschooling *
              </label>
              <input
                type="number"
                value={yearsHomeschooling}
                onChange={(e) => setYearsHomeschooling(parseInt(e.target.value) || 0)}
                min={0}
                className="w-24 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Expertise Areas * (select at least one)
              </label>
              <div className="flex flex-wrap gap-2">
                {(Object.entries(expertiseConfig) as [MentorExpertise, typeof expertiseConfig.other][]).map(
                  ([key, config]) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => {
                        if (expertise.includes(key)) {
                          setExpertise(expertise.filter(e => e !== key))
                        } else {
                          setExpertise([...expertise, key])
                        }
                      }}
                      className={`px-3 py-1.5 rounded-full text-sm ${
                        expertise.includes(key)
                          ? `${config.bg} ${config.color}`
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
                      }`}
                    >
                      {config.icon} {config.label}
                    </button>
                  )
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                About You *
              </label>
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Share your homeschool experience and what makes you a good mentor..."
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Maximum Mentees
              </label>
              <input
                type="number"
                value={maxMentees}
                onChange={(e) => setMaxMentees(parseInt(e.target.value) || 1)}
                min={1}
                max={10}
                className="w-24 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
              <p className="text-xs text-gray-500 mt-1">How many families can you mentor at once?</p>
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!bio.trim() || expertise.length === 0 || submitting}
                className="px-4 py-2 bg-fuchsia-500 text-white rounded-lg hover:bg-fuchsia-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {submitting ? 'Creating...' : 'Become a Mentor'}
              </button>
            </div>
          </form>
        </Dialog.Panel>
      </div>
    </Dialog>
  )
}

function RequestMentorModal({
  mentor,
  onClose,
  currentMemberId,
  onSuccess
}: {
  mentor: ExtendedMentorProfile | null
  onClose: () => void
  currentMemberId: string | null
  onSuccess: () => void
}) {
  const [message, setMessage] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!mentor || !currentMemberId || !message.trim()) return

    setSubmitting(true)
    try {
      await window.api.createMentorRequest({
        mentorId: mentor.id,
        requesterId: currentMemberId,
        message: message.trim()
      })
      onSuccess()
    } catch (error) {
      console.error('Failed to create mentor request:', error)
      alert('Failed to send request. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  useEffect(() => {
    if (mentor) {
      setMessage('')
    }
  }, [mentor])

  if (!mentor) return null

  return (
    <Dialog open={!!mentor} onClose={onClose} className="relative z-50">
      <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="mx-auto max-w-md w-full bg-white dark:bg-gray-800 rounded-xl shadow-xl p-6">
          <Dialog.Title className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Request Mentorship
          </Dialog.Title>

          <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg mb-4">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-fuchsia-400 to-purple-500 flex items-center justify-center text-white font-medium">
              {mentor.memberName.charAt(0).toUpperCase()}
            </div>
            <div>
              <h4 className="font-medium text-gray-900 dark:text-white">{mentor.memberName}</h4>
              <p className="text-xs text-gray-500">{mentor.yearsHomeschooling} years homeschooling</p>
            </div>
          </div>

          <div className="flex flex-wrap gap-1.5 mb-4">
            {mentor.expertise.map(exp => {
              const config = expertiseConfig[exp]
              return (
                <span key={exp} className={`text-xs px-2 py-0.5 rounded-full ${config.bg} ${config.color}`}>
                  {config.icon} {config.label}
                </span>
              )
            })}
          </div>

          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">{mentor.bio}</p>

          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Your Message *
              </label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Introduce yourself and what you're hoping to learn..."
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                required
              />
            </div>

            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!message.trim() || submitting}
                className="px-4 py-2 bg-fuchsia-500 text-white rounded-lg hover:bg-fuchsia-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {submitting ? 'Sending...' : 'Send Request'}
              </button>
            </div>
          </form>
        </Dialog.Panel>
      </div>
    </Dialog>
  )
}

// Icons
function SearchIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
  )
}

function UsersIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
    </svg>
  )
}

export default MentorMatching
