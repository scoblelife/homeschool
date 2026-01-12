import { useState, useRef, useEffect } from 'react'
import { Dialog } from '@headlessui/react'
import { useStore } from '../../stores/useStore'
import type { Student, GradeLevel } from '../../../../shared/types'
import {
  generateGradeCertificateHTML,
  formatDate,
  getSchoolYear,
  type GradeCertificateData,
} from './certificateTemplates'

interface Props {
  student: Student
  isOpen: boolean
  onClose: () => void
}

export function GradeCertificate({ student, isOpen, onClose }: Props) {
  const { subjects } = useStore()
  const [teacherName, setTeacherName] = useState('')
  const [totalHours, setTotalHours] = useState(0)
  const [isPrinting, setIsPrinting] = useState(false)
  const [completionDate, setCompletionDate] = useState(
    new Date().toISOString().split('T')[0]
  )
  const iframeRef = useRef<HTMLIFrameElement>(null)

  // Load total hours for the school year
  useEffect(() => {
    if (isOpen && student.id) {
      const schoolYear = getSchoolYear()
      const [startYear] = schoolYear.split('-').map(Number)
      const startDate = `${startYear}-08-01`
      const endDate = `${startYear + 1}-07-31`

      window.api
        .getActivities({
          studentId: student.id,
          startDate,
          endDate,
        })
        .then((activities) => {
          const minutes = activities.reduce(
            (sum, a) => sum + (a.durationMinutes || 0),
            0
          )
          setTotalHours(Math.round(minutes / 60))
        })
    }
  }, [isOpen, student.id])

  const studentSubjects = subjects.filter(
    (s) => s.gradeLevels.includes(student.gradeLevel as GradeLevel)
  )

  const certificateData: GradeCertificateData = {
    studentName: student.name,
    gradeLevel: student.gradeLevel as GradeLevel,
    schoolYear: getSchoolYear(),
    totalHours,
    subjects: studentSubjects.map((s) => s.name),
    completionDate,
    teacherName: teacherName || undefined,
  }

  const handlePrint = () => {
    const html = generateGradeCertificateHTML(certificateData)
    const iframe = iframeRef.current
    if (!iframe) return

    const doc = iframe.contentDocument || iframe.contentWindow?.document
    if (!doc) return

    doc.open()
    doc.write(html)
    doc.close()

    // Wait for fonts to load
    setIsPrinting(true)
    setTimeout(() => {
      iframe.contentWindow?.print()
      setIsPrinting(false)
    }, 500)
  }

  return (
    <Dialog open={isOpen} onClose={onClose} className="relative z-50">
      <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="mx-auto max-w-lg w-full bg-white rounded-xl shadow-xl">
          <div className="p-6">
            <Dialog.Title className="text-xl font-semibold text-gray-900 mb-4">
              Print Grade Completion Certificate
            </Dialog.Title>

            {/* Preview Card */}
            <div className="bg-gradient-to-br from-blue-50 via-white to-green-50 border border-blue-200 rounded-lg p-6 mb-6">
              <div className="text-center">
                <div className="text-xs uppercase tracking-widest text-blue-600 mb-1">
                  Certificate of Completion
                </div>
                <div className="text-2xl font-serif font-bold text-gray-900 mb-2">
                  {student.name}
                </div>
                <div className="text-sm text-gray-500 mb-2">
                  has completed requirements for
                </div>
                <div className="text-lg font-medium text-blue-600 mb-1">
                  {student.gradeLevel === 'pre-k'
                    ? 'Pre-Kindergarten'
                    : student.gradeLevel === '1st'
                      ? 'First Grade'
                      : student.gradeLevel}
                </div>
                <div className="text-sm text-gray-500">
                  School Year {certificateData.schoolYear}
                </div>
                <div className="flex justify-center gap-6 mt-3 text-sm">
                  <div>
                    <span className="font-semibold text-blue-600">
                      {totalHours}
                    </span>{' '}
                    <span className="text-gray-500">hours</span>
                  </div>
                  <div>
                    <span className="font-semibold text-blue-600">
                      {studentSubjects.length}
                    </span>{' '}
                    <span className="text-gray-500">subjects</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Options */}
            <div className="space-y-4">
              <div>
                <label className="label">Completion Date</label>
                <input
                  type="date"
                  value={completionDate}
                  onChange={(e) => setCompletionDate(e.target.value)}
                  className="input"
                />
              </div>
              <div>
                <label className="label">Teacher/Parent Name (optional)</label>
                <input
                  type="text"
                  value={teacherName}
                  onChange={(e) => setTeacherName(e.target.value)}
                  className="input"
                  placeholder="Enter name for signature line"
                />
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3 mt-6">
              <button onClick={onClose} className="btn btn-secondary">
                Cancel
              </button>
              <button
                onClick={handlePrint}
                className="btn btn-primary"
                disabled={isPrinting}
              >
                {isPrinting ? 'Preparing...' : 'Print Certificate'}
              </button>
            </div>
          </div>

          {/* Hidden iframe for printing */}
          <iframe
            ref={iframeRef}
            style={{ display: 'none', position: 'absolute', width: 0, height: 0 }}
            title="Certificate Print"
          />
        </Dialog.Panel>
      </div>
    </Dialog>
  )
}
