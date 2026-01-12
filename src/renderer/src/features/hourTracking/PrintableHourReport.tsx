import { useState, useEffect, useMemo, useRef } from 'react'
import { useStore } from '../../stores/useStore'
import type { ActivitySummary, Student } from '../../../../shared/types'
import stateRequirements from '../../../../data/stateRequirements.json'

interface Props {
  studentId: string
  schoolYear: string
  selectedState: string
}

export function PrintableHourReport({ studentId, schoolYear, selectedState }: Props) {
  const { students } = useStore()
  const [activitySummary, setActivitySummary] = useState<ActivitySummary[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const printRef = useRef<HTMLDivElement>(null)

  const student = students.find(s => s.id === studentId)

  // Get date range from school year
  const dateRange = useMemo(() => {
    const [startYear] = schoolYear.split('/')
    return {
      startDate: `${startYear}-08-01`,
      endDate: `${parseInt(startYear) + 1}-07-31`
    }
  }, [schoolYear])

  // Load data
  useEffect(() => {
    if (studentId && schoolYear) {
      setIsLoading(true)
      window.api.getActivitySummary(studentId, dateRange.startDate, dateRange.endDate)
        .then(setActivitySummary)
        .finally(() => setIsLoading(false))
    }
  }, [studentId, schoolYear, dateRange])

  // Get state data
  const stateData = (stateRequirements.states as Record<string, {
    name: string
    requiredHoursPerYear: number | null
    requiredDaysPerYear: number | null
  }>)[selectedState]

  // Calculate totals
  const totalMinutes = activitySummary.reduce((sum, s) => sum + s.totalMinutes, 0)
  const totalHours = Math.round(totalMinutes / 60 * 10) / 10
  const totalActivities = activitySummary.reduce((sum, s) => sum + s.totalActivities, 0)

  const handlePrint = () => {
    window.print()
  }

  if (isLoading) {
    return (
      <div className="text-center text-gray-500 py-8">
        Loading...
      </div>
    )
  }

  return (
    <div>
      {/* Print Button */}
      <div className="mb-4 print:hidden">
        <button
          onClick={handlePrint}
          className="px-4 py-2 bg-fuchsia-500 text-white rounded-lg hover:bg-fuchsia-600 flex items-center gap-2"
        >
          <PrintIcon />
          Print Report
        </button>
      </div>

      {/* Printable Content */}
      <div ref={printRef} className="bg-white p-8 print:p-0">
        {/* Header */}
        <div className="text-center mb-8 border-b pb-6">
          <h1 className="text-2xl font-bold text-gray-900">
            Official Instructional Hours Report
          </h1>
          <p className="text-gray-600 mt-2">
            School Year: {schoolYear}
          </p>
        </div>

        {/* Student Info */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-3">Student Information</h2>
          <table className="w-full">
            <tbody>
              <tr>
                <td className="py-1 text-gray-600 w-1/3">Student Name:</td>
                <td className="py-1 font-medium">{student?.name}</td>
              </tr>
              <tr>
                <td className="py-1 text-gray-600">Grade Level:</td>
                <td className="py-1 font-medium">{student?.gradeLevel}</td>
              </tr>
              <tr>
                <td className="py-1 text-gray-600">Date of Birth:</td>
                <td className="py-1 font-medium">
                  {student?.dateOfBirth ? new Date(student.dateOfBirth).toLocaleDateString() : ''}
                </td>
              </tr>
              <tr>
                <td className="py-1 text-gray-600">Reporting Period:</td>
                <td className="py-1 font-medium">
                  {new Date(dateRange.startDate).toLocaleDateString()} - {new Date(dateRange.endDate).toLocaleDateString()}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* State Requirements */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-3">State Requirements ({stateData?.name})</h2>
          <table className="w-full">
            <tbody>
              <tr>
                <td className="py-1 text-gray-600 w-1/3">Required Hours/Year:</td>
                <td className="py-1 font-medium">
                  {stateData?.requiredHoursPerYear ?? 'Not specified'}
                </td>
              </tr>
              <tr>
                <td className="py-1 text-gray-600">Required Days/Year:</td>
                <td className="py-1 font-medium">
                  {stateData?.requiredDaysPerYear ?? 'Not specified'}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Summary */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-3">Instructional Summary</h2>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <p className="text-3xl font-bold text-fuchsia-600">{totalHours}</p>
              <p className="text-sm text-gray-600">Total Hours</p>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <p className="text-3xl font-bold text-fuchsia-600">{totalActivities}</p>
              <p className="text-sm text-gray-600">Total Activities</p>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <p className="text-3xl font-bold text-fuchsia-600">{activitySummary.length}</p>
              <p className="text-sm text-gray-600">Subjects</p>
            </div>
          </div>
        </div>

        {/* Hours by Subject */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-3">Hours by Subject</h2>
          <table className="w-full border border-gray-300">
            <thead>
              <tr className="bg-gray-100">
                <th className="py-2 px-4 text-left border-b border-gray-300">Subject</th>
                <th className="py-2 px-4 text-right border-b border-gray-300">Activities</th>
                <th className="py-2 px-4 text-right border-b border-gray-300">Minutes</th>
                <th className="py-2 px-4 text-right border-b border-gray-300">Hours</th>
                <th className="py-2 px-4 text-right border-b border-gray-300">% of Total</th>
              </tr>
            </thead>
            <tbody>
              {activitySummary.map(subject => (
                <tr key={subject.subjectId}>
                  <td className="py-2 px-4 border-b border-gray-200">{subject.subjectName}</td>
                  <td className="py-2 px-4 text-right border-b border-gray-200">{subject.totalActivities}</td>
                  <td className="py-2 px-4 text-right border-b border-gray-200">{subject.totalMinutes}</td>
                  <td className="py-2 px-4 text-right border-b border-gray-200">
                    {Math.round(subject.totalMinutes / 60 * 10) / 10}
                  </td>
                  <td className="py-2 px-4 text-right border-b border-gray-200">
                    {totalMinutes > 0 ? Math.round((subject.totalMinutes / totalMinutes) * 100) : 0}%
                  </td>
                </tr>
              ))}
              <tr className="font-semibold bg-gray-50">
                <td className="py-2 px-4 border-t-2 border-gray-400">Total</td>
                <td className="py-2 px-4 text-right border-t-2 border-gray-400">{totalActivities}</td>
                <td className="py-2 px-4 text-right border-t-2 border-gray-400">{totalMinutes}</td>
                <td className="py-2 px-4 text-right border-t-2 border-gray-400">{totalHours}</td>
                <td className="py-2 px-4 text-right border-t-2 border-gray-400">100%</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Compliance Status */}
        {stateData?.requiredHoursPerYear && (
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-3">Compliance Status</h2>
            <div className={`p-4 rounded-lg ${
              totalHours >= stateData.requiredHoursPerYear
                ? 'bg-green-50 border border-green-200'
                : 'bg-yellow-50 border border-yellow-200'
            }`}>
              {totalHours >= stateData.requiredHoursPerYear ? (
                <p className="text-green-700">
                  <CheckIcon /> This student has met the {stateData.requiredHoursPerYear} hour requirement
                  for {stateData.name} with {totalHours} total instructional hours logged.
                </p>
              ) : (
                <p className="text-yellow-700">
                  <AlertIcon /> This student has logged {totalHours} of the required {stateData.requiredHoursPerYear} hours.
                  {' '}{Math.round(stateData.requiredHoursPerYear - totalHours)} hours remaining.
                </p>
              )}
            </div>
          </div>
        )}

        {/* Certification */}
        <div className="mt-12 pt-8 border-t">
          <p className="text-sm text-gray-600 mb-6">
            I certify that the above information is accurate and represents the instructional hours
            provided to this student during the specified school year.
          </p>
          <div className="grid grid-cols-2 gap-8">
            <div>
              <div className="border-b border-gray-400 h-8"></div>
              <p className="text-sm text-gray-600 mt-1">Parent/Teacher Signature</p>
            </div>
            <div>
              <div className="border-b border-gray-400 h-8"></div>
              <p className="text-sm text-gray-600 mt-1">Date</p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-12 text-center text-xs text-gray-400">
          <p>Generated by Homeschool App on {new Date().toLocaleDateString()}</p>
        </div>
      </div>
    </div>
  )
}

function PrintIcon() {
  return (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
    </svg>
  )
}

function CheckIcon() {
  return (
    <svg className="w-5 h-5 inline mr-1" fill="currentColor" viewBox="0 0 20 20">
      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
    </svg>
  )
}

function AlertIcon() {
  return (
    <svg className="w-5 h-5 inline mr-1" fill="currentColor" viewBox="0 0 20 20">
      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
    </svg>
  )
}
