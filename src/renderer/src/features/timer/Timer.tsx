/**
 * Timer Component
 *
 * Full-featured timer for tracking learning sessions.
 * Shows elapsed time, student/subject info, and control buttons.
 */

import { useState, useEffect, useCallback } from 'react'
import { Dialog, Transition, Listbox } from '@headlessui/react'
import { Fragment } from 'react'
import { useTimerStore } from './timerStore'
import { useStore } from '../../stores/useStore'
import type { CreateActivity } from '../../../../shared/types'

interface TimerProps {
  onSessionSaved?: (activityId: string) => void
}

/**
 * Render a session timer UI that lets the user start, pause, resume, stop, and save timed learning sessions.
 *
 * The component displays elapsed time, session metadata (student, subject, optional title), controls for timer
 * actions, and modal dialogs to start a session or save/discard a completed session.
 *
 * @param onSessionSaved - Optional callback invoked after a timed session is successfully saved; receives the created activity's `id`.
 * @returns The Session Timer React element.
 */
export function Timer({ onSessionSaved }: TimerProps) {
  const { activeSession, isPaused, startTimer, stopTimer, pauseTimer, resumeTimer, clearTimer, getElapsedTime } =
    useTimerStore()
  const { students, subjects } = useStore()

  const [displayTime, setDisplayTime] = useState('00:00:00')
  const [showStartDialog, setShowStartDialog] = useState(false)
  const [showSaveDialog, setShowSaveDialog] = useState(false)
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null)
  const [selectedSubjectId, setSelectedSubjectId] = useState<string | null>(null)
  const [sessionTitle, setSessionTitle] = useState('')
  const [sessionNotes, setSessionNotes] = useState('')
  const [saving, setSaving] = useState(false)

  // Update display time every second
  useEffect(() => {
    if (!activeSession || isPaused) return

    const updateDisplay = () => {
      const elapsed = getElapsedTime()
      const hours = Math.floor(elapsed / 3600000)
      const minutes = Math.floor((elapsed % 3600000) / 60000)
      const seconds = Math.floor((elapsed % 60000) / 1000)
      setDisplayTime(
        `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
      )
    }

    updateDisplay()
    const interval = setInterval(updateDisplay, 1000)
    return () => clearInterval(interval)
  }, [activeSession, isPaused, getElapsedTime])

  // Update display when paused/resumed
  useEffect(() => {
    if (activeSession && isPaused) {
      const elapsed = getElapsedTime()
      const hours = Math.floor(elapsed / 3600000)
      const minutes = Math.floor((elapsed % 3600000) / 60000)
      const seconds = Math.floor((elapsed % 60000) / 1000)
      setDisplayTime(
        `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
      )
    }
  }, [activeSession, isPaused, getElapsedTime])

  const handleStart = () => {
    setSelectedStudentId(students[0]?.id || null)
    setSelectedSubjectId(subjects[0]?.id || null)
    setSessionTitle('')
    setShowStartDialog(true)
  }

  const handleConfirmStart = () => {
    if (!selectedStudentId || !selectedSubjectId) return
    startTimer(selectedStudentId, selectedSubjectId, sessionTitle || undefined)
    setShowStartDialog(false)
  }

  const handleStop = () => {
    setSessionNotes('')
    setShowSaveDialog(true)
  }

  const handleDiscard = () => {
    clearTimer()
    setShowSaveDialog(false)
  }

  const handleSave = async () => {
    if (!activeSession) return

    setSaving(true)
    try {
      const elapsed = getElapsedTime()
      const durationMinutes = Math.max(1, Math.round(elapsed / 60000))

      const activity: CreateActivity = {
        studentId: activeSession.studentId,
        subjectId: activeSession.subjectId,
        sessionId: null,
        activityType: 'hands_on', // Default type for timed sessions
        title: activeSession.title || 'Timed Session',
        description: '',
        dateCompleted: new Date().toISOString().split('T')[0],
        durationMinutes,
        grade: null,
        maxGrade: null,
        notes: sessionNotes,
      }

      const created = await window.api.createActivity(activity)
      stopTimer()
      setShowSaveDialog(false)
      onSessionSaved?.(created.id)
    } catch (error) {
      console.error('Failed to save timed session:', error)
    } finally {
      setSaving(false)
    }
  }

  const activeStudent = activeSession ? students.find((s) => s.id === activeSession.studentId) : null
  const activeSubject = activeSession ? subjects.find((s) => s.id === activeSession.subjectId) : null
  const selectedStudent = selectedStudentId ? students.find((s) => s.id === selectedStudentId) : null
  const selectedSubject = selectedSubjectId ? subjects.find((s) => s.id === selectedSubjectId) : null

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Session Timer</h3>
        {activeSession && (
          <span
            className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
              isPaused ? 'bg-yellow-100 dark:bg-yellow-900/50 text-yellow-800 dark:text-yellow-300' : 'bg-green-100 dark:bg-green-900/50 text-green-800 dark:text-green-300'
            }`}
          >
            {isPaused ? 'Paused' : 'Running'}
          </span>
        )}
      </div>

      {activeSession ? (
        <div className="space-y-4">
          {/* Timer Display */}
          <div className="text-center">
            <div className="text-5xl font-mono font-bold text-gray-900 dark:text-white tabular-nums">{displayTime}</div>
            <div className="mt-2 text-sm text-gray-500 dark:text-gray-400">
              {activeStudent?.name} - {activeSubject?.name}
            </div>
            {activeSession.title && <div className="text-sm text-gray-600 dark:text-gray-300 font-medium">{activeSession.title}</div>}
          </div>

          {/* Control Buttons */}
          <div className="flex justify-center gap-3">
            {isPaused ? (
              <button
                onClick={resumeTimer}
                className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z"
                    clipRule="evenodd"
                  />
                </svg>
                Resume
              </button>
            ) : (
              <button
                onClick={pauseTimer}
                className="inline-flex items-center px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600"
              >
                <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z"
                    clipRule="evenodd"
                  />
                </svg>
                Pause
              </button>
            )}
            <button
              onClick={handleStop}
              className="inline-flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
            >
              <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8 7a1 1 0 00-1 1v4a1 1 0 001 1h4a1 1 0 001-1V8a1 1 0 00-1-1H8z"
                  clipRule="evenodd"
                />
              </svg>
              Stop
            </button>
          </div>
        </div>
      ) : (
        <div className="text-center py-6">
          <div className="text-5xl font-mono font-bold text-gray-300 dark:text-gray-600 tabular-nums">00:00:00</div>
          <p className="mt-4 text-gray-500 dark:text-gray-400 text-sm">Start a timer to track your learning session</p>
          <button
            onClick={handleStart}
            className="mt-4 inline-flex items-center px-6 py-3 bg-fuchsia-500 text-white rounded-lg hover:bg-fuchsia-600 font-medium"
          >
            <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z"
                clipRule="evenodd"
              />
            </svg>
            Start Timer
          </button>
        </div>
      )}

      {/* Start Timer Dialog */}
      <Transition appear show={showStartDialog} as={Fragment}>
        <Dialog as="div" className="relative z-50" onClose={() => setShowStartDialog(false)}>
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black/25" />
          </Transition.Child>

          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4">
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0 scale-95"
                enterTo="opacity-100 scale-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100 scale-100"
                leaveTo="opacity-0 scale-95"
              >
                <Dialog.Panel className="w-full max-w-md bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-xl">
                  <Dialog.Title className="text-lg font-semibold text-gray-900 dark:text-white">Start Timer</Dialog.Title>

                  <div className="mt-4 space-y-4">
                    {/* Student Selection */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Student</label>
                      <Listbox value={selectedStudentId} onChange={setSelectedStudentId}>
                        <div className="relative">
                          <Listbox.Button className="relative w-full py-2 pl-3 pr-10 text-left bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer focus:outline-none focus:ring-2 focus:ring-fuchsia-500 text-gray-900 dark:text-white">
                            <span className="block truncate">
                              {selectedStudent?.name || 'Select student...'}
                            </span>
                          </Listbox.Button>
                          <Transition
                            as={Fragment}
                            leave="transition ease-in duration-100"
                            leaveFrom="opacity-100"
                            leaveTo="opacity-0"
                          >
                            <Listbox.Options className="absolute z-10 w-full py-1 mt-1 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg max-h-60 overflow-auto">
                              {students.map((student) => (
                                <Listbox.Option
                                  key={student.id}
                                  value={student.id}
                                  className={({ active }) =>
                                    `cursor-pointer select-none py-2 px-3 ${active ? 'bg-fuchsia-50 dark:bg-fuchsia-900/30 text-fuchsia-900 dark:text-fuchsia-200' : 'text-gray-900 dark:text-white'}`
                                  }
                                >
                                  {student.name}
                                </Listbox.Option>
                              ))}
                            </Listbox.Options>
                          </Transition>
                        </div>
                      </Listbox>
                    </div>

                    {/* Subject Selection */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Subject</label>
                      <Listbox value={selectedSubjectId} onChange={setSelectedSubjectId}>
                        <div className="relative">
                          <Listbox.Button className="relative w-full py-2 pl-3 pr-10 text-left bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer focus:outline-none focus:ring-2 focus:ring-fuchsia-500 text-gray-900 dark:text-white">
                            <span className="block truncate">
                              {selectedSubject?.name || 'Select subject...'}
                            </span>
                          </Listbox.Button>
                          <Transition
                            as={Fragment}
                            leave="transition ease-in duration-100"
                            leaveFrom="opacity-100"
                            leaveTo="opacity-0"
                          >
                            <Listbox.Options className="absolute z-10 w-full py-1 mt-1 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg max-h-60 overflow-auto">
                              {subjects.map((subject) => (
                                <Listbox.Option
                                  key={subject.id}
                                  value={subject.id}
                                  className={({ active }) =>
                                    `cursor-pointer select-none py-2 px-3 ${active ? 'bg-fuchsia-50 dark:bg-fuchsia-900/30 text-fuchsia-900 dark:text-fuchsia-200' : 'text-gray-900 dark:text-white'}`
                                  }
                                >
                                  {subject.name}
                                </Listbox.Option>
                              ))}
                            </Listbox.Options>
                          </Transition>
                        </div>
                      </Listbox>
                    </div>

                    {/* Optional Title */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Title <span className="text-gray-400 dark:text-gray-500">(optional)</span>
                      </label>
                      <input
                        type="text"
                        value={sessionTitle}
                        onChange={(e) => setSessionTitle(e.target.value)}
                        placeholder="e.g., Math practice, Reading time"
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-fuchsia-500"
                      />
                    </div>
                  </div>

                  <div className="mt-6 flex justify-end gap-3">
                    <button
                      onClick={() => setShowStartDialog(false)}
                      className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleConfirmStart}
                      disabled={!selectedStudentId || !selectedSubjectId}
                      className="px-4 py-2 bg-fuchsia-500 text-white rounded-lg hover:bg-fuchsia-600 disabled:opacity-50"
                    >
                      Start
                    </button>
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>

      {/* Save Session Dialog */}
      <Transition appear show={showSaveDialog} as={Fragment}>
        <Dialog as="div" className="relative z-50" onClose={() => {}}>
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black/25" />
          </Transition.Child>

          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4">
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0 scale-95"
                enterTo="opacity-100 scale-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100 scale-100"
                leaveTo="opacity-0 scale-95"
              >
                <Dialog.Panel className="w-full max-w-md bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-xl">
                  <Dialog.Title className="text-lg font-semibold text-gray-900 dark:text-white">Save Session</Dialog.Title>

                  <div className="mt-4 space-y-4">
                    <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                      <div className="text-3xl font-mono font-bold text-center text-gray-900 dark:text-white">{displayTime}</div>
                      <div className="text-center text-sm text-gray-500 dark:text-gray-400 mt-1">
                        {activeStudent?.name} - {activeSubject?.name}
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Notes <span className="text-gray-400 dark:text-gray-500">(optional)</span>
                      </label>
                      <textarea
                        value={sessionNotes}
                        onChange={(e) => setSessionNotes(e.target.value)}
                        placeholder="What did you work on?"
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-fuchsia-500"
                      />
                    </div>
                  </div>

                  <div className="mt-6 flex justify-between">
                    <button
                      onClick={handleDiscard}
                      className="px-4 py-2 text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300"
                      disabled={saving}
                    >
                      Discard
                    </button>
                    <button
                      onClick={handleSave}
                      disabled={saving}
                      className="px-6 py-2 bg-fuchsia-500 text-white rounded-lg hover:bg-fuchsia-600 disabled:opacity-50"
                    >
                      {saving ? 'Saving...' : 'Save Activity'}
                    </button>
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>
    </div>
  )
}

export default Timer