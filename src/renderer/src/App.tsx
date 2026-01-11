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
import { useInitializeData } from './hooks/useDatabase'

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
        <Route path="library" element={<Library />} />
        <Route path="field-trips" element={<FieldTrips />} />
        <Route path="settings" element={<Settings />} />
      </Route>
    </Routes>
  )
}
