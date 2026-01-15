import { useState } from 'react'
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom'
import { useStore } from '../stores/useStore'
import { SyncStatusIndicator } from '../components/sync'
import { TimerIndicator } from '../features/timer'
import { TitleBar } from '../components/TitleBar'

interface NavItem {
  path: string
  label: string
  icon: string
  children?: NavItem[]
}

const navItems: NavItem[] = [
  { path: '/', label: 'Dashboard', icon: '🏠' },
  { path: '/log', label: 'Learning Log', icon: '📝' },
  { path: '/milestones', label: 'Milestones', icon: '🎯' },
  { path: '/attendance', label: 'Attendance', icon: '✓' },
  { path: '/hour-tracking', label: 'Hour Tracking', icon: '⏱️' },
  {
    path: '/field-trips',
    label: 'Activities',
    icon: '🎪',
    children: [
      { path: '/templates', label: 'Templates', icon: '🗃️' }
    ]
  },
  {
    path: '/content-library',
    label: 'Content Library',
    icon: '📦',
    children: [
      { path: '/curriculum', label: 'Curriculum', icon: '📐' },
      { path: '/recommendations', label: 'Curricula', icon: '📖' },
      { path: '/resources', label: 'Resources', icon: '🔗' }
    ]
  },
  { path: '/library', label: 'Library', icon: '📚' },
  { path: '/coop', label: 'Co-op Groups', icon: '👥' },
  {
    path: '/calendar',
    label: 'Calendar',
    icon: '📅',
    children: [
      { path: '/weekly-planner', label: 'Weekly Plan', icon: '📋' },
      { path: '/weekly-summary', label: 'Weekly Summary', icon: '📈' }
    ]
  },
  { path: '/reports', label: 'Reports', icon: '📊' },
  { path: '/annual-report', label: 'Annual Report', icon: '📆' }
]

/**
 * Renders a navigation item that may be a collapsible section with child links.
 *
 * Renders either a single NavLink for a leaf item or a button that toggles an expandable list containing an "Overview" link and child NavLinks for items with children. The rendered links reflect the current route as active and apply corresponding styling.
 *
 * @param item - The navigation item to render; may include `children` for a collapsible section.
 * @param expandedSections - Set of parent paths that are currently expanded.
 * @param toggleSection - Callback to toggle expansion for a parent path.
 * @returns The JSX element for the navigation item (a NavLink or a collapsible section with nested NavLinks).
 */
function NavItemComponent({ item, expandedSections, toggleSection }: {
  item: NavItem
  expandedSections: Set<string>
  toggleSection: (path: string) => void
}) {
  const location = useLocation()
  const hasChildren = item.children && item.children.length > 0
  const isExpanded = expandedSections.has(item.path)
  const isChildActive = hasChildren && item.children?.some(child => location.pathname === child.path)
  const isActive = location.pathname === item.path || isChildActive

  if (hasChildren) {
    return (
      <div>
        <button
          onClick={() => toggleSection(item.path)}
          className={`w-full flex items-center justify-between gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
            isActive
              ? 'bg-fuchsia-50 dark:bg-fuchsia-900/30 text-fuchsia-700 dark:text-fuchsia-400'
              : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
          }`}
        >
          <div className="flex items-center gap-3">
            <span>{item.icon}</span>
            {item.label}
          </div>
          <svg
            className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        {isExpanded && (
          <div className="ml-4 mt-1 space-y-1 border-l-2 border-gray-200 dark:border-gray-700 pl-2">
            <NavLink
              to={item.path}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-1.5 rounded-lg text-sm transition-colors ${
                  isActive
                    ? 'bg-fuchsia-50 dark:bg-fuchsia-900/30 text-fuchsia-700 dark:text-fuchsia-400 font-medium'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`
              }
            >
              <span className="text-xs">•</span>
              Overview
            </NavLink>
            {item.children?.map((child) => (
              <NavLink
                key={child.path}
                to={child.path}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-1.5 rounded-lg text-sm transition-colors ${
                    isActive
                      ? 'bg-fuchsia-50 dark:bg-fuchsia-900/30 text-fuchsia-700 dark:text-fuchsia-400 font-medium'
                      : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`
                }
              >
                <span>{child.icon}</span>
                {child.label}
              </NavLink>
            ))}
          </div>
        )}
      </div>
    )
  }

  return (
    <NavLink
      to={item.path}
      className={({ isActive }) =>
        `flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
          isActive
            ? 'bg-fuchsia-50 dark:bg-fuchsia-900/30 text-fuchsia-700 dark:text-fuchsia-400'
            : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
        }`
      }
    >
      <span>{item.icon}</span>
      {item.label}
    </NavLink>
  )
}

/**
 * Application shell that renders the title bar, sidebar navigation with student selector, and main content outlet.
 *
 * Initializes which navigation sections are expanded based on the current route, exposes controls to toggle section expansion,
 * shows a centered loading state while store data is loading, and synchronizes the selected student with the global store.
 *
 * @returns The root JSX layout element containing the TitleBar, a sidebar with navigation and student selector, and an Outlet for route content.
 */
export default function MainLayout(): JSX.Element {
  const { students, selectedStudentId, setSelectedStudentId, isLoading } = useStore()
  const navigate = useNavigate()
  const location = useLocation()

  // Initialize expanded sections based on current route
  const getInitialExpandedSections = () => {
    const expanded = new Set<string>()
    navItems.forEach(item => {
      if (item.children) {
        const isChildActive = item.children.some(child => location.pathname === child.path)
        const isParentActive = location.pathname === item.path
        if (isChildActive || isParentActive) {
          expanded.add(item.path)
        }
      }
    })
    return expanded
  }

  const [expandedSections, setExpandedSections] = useState<Set<string>>(getInitialExpandedSections)

  const toggleSection = (path: string) => {
    setExpandedSections(prev => {
      const next = new Set(prev)
      if (next.has(path)) {
        next.delete(path)
      } else {
        next.add(path)
      }
      return next
    })
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-gray-500">Loading...</div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-screen bg-gray-50 dark:bg-gray-900">
      {/* Title Bar */}
      <TitleBar />

      {/* Main container with sidebar and content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <aside className="w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">Homeschool</h1>
            <div className="flex items-center gap-2">
              <TimerIndicator onClick={() => navigate('/')} />
              <SyncStatusIndicator onClick={() => navigate('/settings')} />
            </div>
          </div>
        </div>

        {/* Child Selector */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <label className="label dark:text-gray-300">Student</label>
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
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => (
            <NavItemComponent
              key={item.path}
              item={item}
              expandedSections={expandedSections}
              toggleSection={toggleSection}
            />
          ))}
        </nav>

        {/* Settings Links */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-700 space-y-1">
          <NavLink
            to="/api-services"
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-fuchsia-50 dark:bg-fuchsia-900/30 text-fuchsia-700 dark:text-fuchsia-400'
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`
            }
          >
            <span>🔌</span>
            API Services
          </NavLink>
          <NavLink
            to="/settings"
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-fuchsia-50 dark:bg-fuchsia-900/30 text-fuchsia-700 dark:text-fuchsia-400'
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
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
    </div>
  )
}