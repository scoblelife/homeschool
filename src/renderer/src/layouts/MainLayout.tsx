import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useStore } from '../stores/useStore'
import { SyncStatusIndicator } from '../components/sync'
import { TimerIndicator } from '../features/timer'

const navItems = [
  { path: '/', label: 'Dashboard', icon: '🏠' },
  { path: '/log', label: 'Learning Log', icon: '📝' },
  { path: '/milestones', label: 'Milestones', icon: '🎯' },
  { path: '/weekly-planner', label: 'Weekly Plan', icon: '📋' },
  { path: '/weekly-summary', label: 'Weekly Summary', icon: '📈' },
  { path: '/attendance', label: 'Attendance', icon: '✓' },
  { path: '/curriculum', label: 'Curriculum', icon: '📐' },
  { path: '/hour-tracking', label: 'Hour Tracking', icon: '⏱️' },
  { path: '/library', label: 'Library', icon: '📚' },
  { path: '/field-trips', label: 'Activities', icon: '🎪' },
  { path: '/calendar', label: 'Calendar', icon: '📅' },
  { path: '/reports', label: 'Reports', icon: '📊' },
  { path: '/annual-report', label: 'Annual Report', icon: '📆' }
]

export default function MainLayout(): JSX.Element {
  const { students, selectedStudentId, setSelectedStudentId, isLoading } = useStore()
  const navigate = useNavigate()

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-gray-500">Loading...</div>
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-200 flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-bold text-gray-900">Homeschool</h1>
            <div className="flex items-center gap-2">
              <TimerIndicator onClick={() => navigate('/')} />
              <SyncStatusIndicator onClick={() => navigate('/settings')} />
            </div>
          </div>
        </div>

        {/* Child Selector */}
        <div className="p-4 border-b border-gray-200">
          <label className="label">Student</label>
          <select
            value={selectedStudentId || ''}
            onChange={(e) => setSelectedStudentId(e.target.value || null)}
            className="input"
          >
            <option value="">All Students</option>
            {students.map((student) => (
              <option key={student.id} value={student.id}>
                {student.name} ({student.gradeLevel})
              </option>
            ))}
          </select>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-indigo-50 text-indigo-700'
                    : 'text-gray-700 hover:bg-gray-100'
                }`
              }
            >
              <span>{item.icon}</span>
              {item.label}
            </NavLink>
          ))}
        </nav>

        {/* Settings Link */}
        <div className="p-4 border-t border-gray-200">
          <NavLink
            to="/settings"
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-indigo-50 text-indigo-700'
                  : 'text-gray-700 hover:bg-gray-100'
              }`
            }
          >
            <span>⚙️</span>
            Settings
          </NavLink>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>
    </div>
  )
}
