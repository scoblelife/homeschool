import { Routes, Route } from 'react-router-dom'
import MainLayout from './layouts/MainLayout'
import Dashboard from './pages/Dashboard'
import LearningLog from './pages/LearningLog'
import Milestones from './pages/Milestones'
import WeeklyPlanner from './pages/WeeklyPlanner'
import Calendar from './pages/Calendar'
import Reports from './pages/Reports'
import Library from './pages/Library'
import FieldTrips from './pages/FieldTrips'
import Settings from './pages/Settings'
import WeeklySummary from './pages/WeeklySummary'
import AnnualReport from './pages/AnnualReport'
import Attendance from './pages/Attendance'
import Curriculum from './pages/Curriculum'
import HourTracking from './pages/HourTracking'
import Templates from './pages/Templates'
import Recommendations from './pages/Recommendations'
import Resources from './pages/Resources'
import Coop from './pages/Coop'
import ContentLibrary from './pages/ContentLibrary'
import ApiServices from './pages/ApiServices'
import { useInitializeData } from './hooks/useDatabase'

/**
 * Renders the application's route tree within the main layout and initializes required app data.
 *
 * The component invokes initialization logic (useInitializeData) during render to prepare app state, then returns the router with nested routes for each page.
 *
 * @returns The root JSX element containing the app's Routes and nested page routes.
 */
export default function App(): JSX.Element {
  useInitializeData()

  return (
    <Routes>
      <Route path="/" element={<MainLayout />}>
        <Route index element={<Dashboard />} />
        <Route path="log" element={<LearningLog />} />
        <Route path="milestones" element={<Milestones />} />
        <Route path="weekly-planner" element={<WeeklyPlanner />} />
        <Route path="calendar" element={<Calendar />} />
        <Route path="reports" element={<Reports />} />
        <Route path="weekly-summary" element={<WeeklySummary />} />
        <Route path="annual-report" element={<AnnualReport />} />
        <Route path="attendance" element={<Attendance />} />
        <Route path="curriculum" element={<Curriculum />} />
        <Route path="hour-tracking" element={<HourTracking />} />
        <Route path="templates" element={<Templates />} />
        <Route path="recommendations" element={<Recommendations />} />
        <Route path="resources" element={<Resources />} />
        <Route path="library" element={<Library />} />
        <Route path="field-trips" element={<FieldTrips />} />
        <Route path="coop" element={<Coop />} />
        <Route path="content-library" element={<ContentLibrary />} />
        <Route path="api-services" element={<ApiServices />} />
        <Route path="settings" element={<Settings />} />
      </Route>
    </Routes>
  )
}