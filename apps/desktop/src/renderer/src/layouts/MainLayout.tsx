import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useStore } from "../stores/useStore";
import { SyncStatusIndicator } from "../components/sync";
import { TimerIndicator } from "../features/timer";
import { useKeyboardShortcuts } from "../hooks/useKeyboardShortcuts";
import { ChangeEvent } from "react";
import {
  LayoutDashboard,
  PenLine,
  Target,
  Calendar,
  GraduationCap,
  BarChart3,
  Settings,
  type LucideIcon,
} from "lucide-react";

interface NavItem {
  path: string;
  label: string;
  icon: LucideIcon;
  shortcut: string;
}

const navItems: NavItem[] = [
  { path: "/", label: "Dashboard", icon: LayoutDashboard, shortcut: "⌘1" },
  { path: "/log", label: "Learning Log", icon: PenLine, shortcut: "⌘2" },
  { path: "/milestones", label: "Milestones", icon: Target, shortcut: "⌘3" },
  { path: "/calendar", label: "Calendar", icon: Calendar, shortcut: "⌘4" },
  {
    path: "/curriculum",
    label: "Curriculum",
    icon: GraduationCap,
    shortcut: "⌘5",
  },
  { path: "/reports", label: "Reports", icon: BarChart3, shortcut: "⌘6" },
];

function NavItemLink({ item }: { item: NavItem }) {
  const Icon = item.icon;
  return (
    <NavLink
      to={item.path}
      className={({ isActive }) =>
        `group flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
          isActive
            ? "bg-brand-primaryLight text-brand-primaryDark"
            : "text-neutral-text hover:bg-neutral-backgroundDeep"
        }`
      }
    >
      <Icon className="w-4 h-4 flex-shrink-0" />
      <span className="flex-1">{item.label}</span>
      <span className="text-[10px] text-neutral-textTertiary opacity-0 group-hover:opacity-100 transition-opacity">
        {item.shortcut}
      </span>
    </NavLink>
  );
}

export default function MainLayout(): JSX.Element {
  const { students, selectedStudentId, setSelectedStudentId, isLoading } =
    useStore();
  const navigate = useNavigate();
  useKeyboardShortcuts();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-neutral-textSecondary">Loading...</div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-neutral-background">
      {/* Sidebar */}
      <aside
        className="w-64 bg-neutral-surface border-r border-neutral-border flex flex-col"
        aria-label="Sidebar navigation"
      >
        {/* Header */}
        <div className="p-4 border-b border-neutral-border">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-bold text-neutral-text">Homeschool</h1>
            <div className="flex items-center gap-2">
              <TimerIndicator onClick={() => navigate("/")} />
              <SyncStatusIndicator onClick={() => navigate("/settings")} />
            </div>
          </div>
        </div>

        {/* Child Selector */}
        <div className="p-4 border-b border-neutral-border">
          <label className="block text-sm font-medium text-neutral-text mb-1">
            Student
          </label>
          <select
            value={selectedStudentId || ""}
            onChange={(e: ChangeEvent<HTMLSelectElement>) =>
              setSelectedStudentId(e.target.value || null)
            }
            className="block w-full px-3 py-2 text-sm border border-neutral-border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-brand-primary"
            aria-label="Select student"
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
        <nav className="flex-1 p-4 space-y-1" aria-label="Main navigation">
          {navItems.map((item) => (
            <NavItemLink key={item.path} item={item} />
          ))}
        </nav>

        {/* Settings */}
        <div className="p-4 border-t border-neutral-border">
          <NavLink
            to="/settings"
            className={({ isActive }) =>
              `group flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? "bg-brand-primaryLight text-brand-primaryDark"
                  : "text-neutral-text hover:bg-neutral-backgroundDeep"
              }`
            }
          >
            <Settings className="w-4 h-4 flex-shrink-0" />
            <span className="flex-1">Settings</span>
            <span className="text-[10px] text-neutral-textTertiary opacity-0 group-hover:opacity-100 transition-opacity">
              ⌘7
            </span>
          </NavLink>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto" role="main">
        <Outlet />
      </main>
    </div>
  );
}
