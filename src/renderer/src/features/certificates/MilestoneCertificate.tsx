import { useState, useRef } from 'react'
import { Dialog } from '@headlessui/react'
import { useStore } from '../../stores/useStore'
import type { Milestone } from '../../../../shared/types'
import {
  generateMilestoneCertificateHTML,
  formatDate,
  type MilestoneCertificateData,
} from './certificateTemplates'

interface Props {
  milestone: Milestone
  isOpen: boolean
  onClose: () => void
}

export function MilestoneCertificate({ milestone, isOpen, onClose }: Props) {
  const { getStudentById, getSubjectById } = useStore()
  const [teacherName, setTeacherName] = useState('')
  const [isPrinting, setIsPrinting] = useState(false)
  const iframeRef = useRef<HTMLIFrameElement>(null)

  const student = getStudentById(milestone.studentId)
  const subject = getSubjectById(milestone.subjectId)

  if (!student) return null

  const certificateData: MilestoneCertificateData = {
    studentName: student.name,
    milestoneTitle: milestone.title,
    completionDate: milestone.completedDate || new Date().toISOString().split('T')[0],
    subjectName: subject?.name,
    teacherName: teacherName || undefined,
  }

  const handlePrint = () => {
    const html = generateMilestoneCertificateHTML(certificateData)
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
              Print Milestone Certificate
            </Dialog.Title>

            {/* Preview Card */}
            <div className="bg-gradient-to-br from-fuchsia-50 via-white to-purple-50 border border-fuchsia-200 rounded-lg p-6 mb-6">
              <div className="text-center">
                <div className="text-xs uppercase tracking-widest text-fuchsia-600 mb-1">
                  Certificate of Achievement
                </div>
                <div className="text-2xl font-serif font-bold text-gray-900 mb-2">
                  {student.name}
                </div>
                <div className="text-sm text-gray-500 mb-3">has completed</div>
                <div className="text-lg font-medium text-gray-800 border-t border-b border-fuchsia-200 py-2 px-4 inline-block">
                  {milestone.title}
                </div>
                {subject && (
                  <div className="text-sm text-gray-500 mt-2">in {subject.name}</div>
                )}
                <div className="text-sm text-gray-400 mt-3">
                  {formatDate(certificateData.completionDate)}
                </div>
              </div>
            </div>

            {/* Options */}
            <div className="space-y-4">
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
