import { useStore } from '../stores/useStore'
import { AttendanceCalendar, AttendanceStats } from '../features/attendance'

export default function Attendance(): JSX.Element {
  const { students } = useStore()

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Attendance Tracking</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          Track school days, holidays, and absences for compliance reporting
        </p>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Calendar takes 2 columns */}
        <div className="lg:col-span-2">
          <AttendanceCalendar students={students} />
        </div>

        {/* Stats sidebar */}
        <div>
          <AttendanceStats students={students} />
        </div>
      </div>

      {/* Instructions */}
      <div className="mt-6 bg-gray-50 dark:bg-gray-800 rounded-lg p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          How to use
        </h2>
        <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
          <li className="flex items-start gap-2">
            <span className="text-green-500 mt-0.5">1.</span>
            <span>
              Select a student from the tabs above the calendar (if you have multiple students)
            </span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-green-500 mt-0.5">2.</span>
            <span>
              Click any day to mark attendance - choose School, Holiday, Sick, Vacation, or Other
            </span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-green-500 mt-0.5">3.</span>
            <span>
              Add optional notes for context (e.g., "Doctor appointment" or "Thanksgiving break")
            </span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-green-500 mt-0.5">4.</span>
            <span>
              Use the navigation arrows to move between months
            </span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-green-500 mt-0.5">5.</span>
            <span>
              Statistics update automatically to show school year totals
            </span>
          </li>
        </ul>

        <div className="mt-6 p-4 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800">
          <h3 className="font-medium text-amber-800 dark:text-amber-200 mb-2">
            State Requirements
          </h3>
          <p className="text-sm text-amber-700 dark:text-amber-300">
            Different states have different attendance requirements. Some require a minimum number
            of school days (typically 170-180 days), while others like Nevada have no minimum.
            Check your state's requirements in Settings to ensure compliance.
          </p>
        </div>
      </div>
    </div>
  )
}
