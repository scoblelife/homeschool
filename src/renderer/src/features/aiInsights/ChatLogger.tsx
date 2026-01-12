/**
 * Conversational Activity Logger
 *
 * Chat interface for logging activities with natural language.
 * Examples:
 * - "We did math worksheets and read for an hour"
 * - "Emma practiced piano for 30 minutes"
 * - "Both kids watched a science documentary about space"
 */

import { useState, useEffect, useRef } from 'react'
import { format } from 'date-fns'
import { useAIInsightsStore } from './aiInsightsStore'

interface ParsedActivity {
  studentName: string
  studentId: string
  subjectName: string
  subjectId: string
  title: string
  duration: number | null
  activityType: string
}

interface Student {
  id: string
  name: string
}

interface Subject {
  id: string
  name: string
}

interface ChatLoggerProps {
  students: Student[]
  subjects: Subject[]
  onActivitiesCreated?: () => void
}

export function ChatLogger({
  students,
  subjects,
  onActivitiesCreated,
}: ChatLoggerProps): JSX.Element | null {
  const { isInitialized, isAvailable, initialize } = useAIInsightsStore()

  const [isOpen, setIsOpen] = useState(false)
  const [input, setInput] = useState('')
  const [parsedActivities, setParsedActivities] = useState<ParsedActivity[]>([])
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  // Initialize AI
  useEffect(() => {
    if (!isInitialized) {
      initialize()
    }
  }, [isInitialized, initialize])

  // Focus input when opened
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus()
    }
  }, [isOpen])

  const parseInput = async () => {
    if (!input.trim() || !isAvailable) return

    setIsProcessing(true)
    setError(null)
    setParsedActivities([])

    try {
      const studentList = students.map((s) => s.name).join(', ')
      const subjectList = subjects.map((s) => s.name).join(', ')

      const prompt = `You are a homeschool activity parser. Parse the following natural language into structured activities.

Input: "${input}"

Available Students: ${studentList}
Available Subjects: ${subjectList}
Today's Date: ${format(new Date(), 'yyyy-MM-dd')}

Parse into JSON array of activities:
[
  {
    "studentName": "Name from available students",
    "subjectName": "Subject from available subjects",
    "title": "Descriptive activity title",
    "duration": minutes as number or null,
    "activityType": "worksheet|video|reading|writing_print|writing_cursive|hands_on|game|assessment"
  }
]

Guidelines:
- If "both kids" or "all" mentioned, create entry for each student
- If no student mentioned, assume ALL students
- Match activity to most appropriate subject
- Infer activity type from description:
  - "worksheets", "pages" → worksheet
  - "watched", "video" → video
  - "read", "book" → reading
  - "wrote", "journal" → writing_print
  - "practiced", "played" (instrument) → hands_on
  - "game", "played" (educational) → game
- Extract duration from phrases like "for 30 minutes", "an hour", etc.
- Create descriptive titles from the activity description

Return only valid JSON array.`

      const result = await window.api.aiComplete(prompt, {
        maxTokens: 500,
        temperature: 0.3,
        useCache: false,
      })

      if (!result.success || !result.response) {
        throw new Error(result.error || 'Failed to parse activities')
      }

      try {
        const parsed = JSON.parse(result.response) as Array<{
          studentName: string
          subjectName: string
          title: string
          duration: number | null
          activityType: string
        }>

        // Map to IDs
        const activities: ParsedActivity[] = parsed
          .map((p) => {
            const student = students.find(
              (s) => s.name.toLowerCase() === p.studentName.toLowerCase()
            )
            const subject = subjects.find(
              (s) => s.name.toLowerCase() === p.subjectName.toLowerCase()
            )

            if (!student || !subject) return null

            return {
              studentName: student.name,
              studentId: student.id,
              subjectName: subject.name,
              subjectId: subject.id,
              title: p.title,
              duration: p.duration,
              activityType: p.activityType,
            }
          })
          .filter((a): a is ParsedActivity => a !== null)

        if (activities.length === 0) {
          setError('Could not parse any activities. Try being more specific.')
        } else {
          setParsedActivities(activities)
        }
      } catch {
        setError('Failed to parse AI response. Try rephrasing.')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to process')
    } finally {
      setIsProcessing(false)
    }
  }

  const removeActivity = (index: number) => {
    setParsedActivities(parsedActivities.filter((_, i) => i !== index))
  }

  const saveActivities = async () => {
    if (parsedActivities.length === 0) return

    setIsSaving(true)
    setError(null)

    try {
      const today = format(new Date(), 'yyyy-MM-dd')

      for (const activity of parsedActivities) {
        await window.api.createActivity({
          sessionId: null,
          studentId: activity.studentId,
          subjectId: activity.subjectId,
          title: activity.title,
          description: '',
          activityType: activity.activityType as 'worksheet' | 'video' | 'reading' | 'writing_print' | 'writing_cursive' | 'hands_on' | 'game' | 'assessment',
          dateCompleted: today,
          durationMinutes: activity.duration ?? null,
          grade: null,
          maxGrade: null,
          notes: `Logged via chat: "${input}"`,
        })
      }

      // Reset state
      setInput('')
      setParsedActivities([])
      setIsOpen(false)
      onActivitiesCreated?.()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save activities')
    } finally {
      setIsSaving(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      parseInput()
    }
  }

  // Don't render if AI not available
  if (isInitialized && !isAvailable) {
    return null
  }

  if (!isInitialized) {
    return null
  }

  const activityTypeLabels: Record<string, string> = {
    worksheet: 'Worksheet',
    video: 'Video',
    reading: 'Reading',
    writing_print: 'Writing (Print)',
    writing_cursive: 'Writing (Cursive)',
    hands_on: 'Hands-on',
    game: 'Game',
    assessment: 'Assessment',
  }

  return (
    <>
      {/* Chat FAB Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-24 w-12 h-12 bg-purple-600 hover:bg-purple-700 text-white rounded-full shadow-lg hover:shadow-xl transition-all flex items-center justify-center text-xl z-40"
        title="Log activities with chat"
      >
        💬
      </button>

      {/* Chat Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/30"
            onClick={() => setIsOpen(false)}
          />

          {/* Panel */}
          <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-xl overflow-hidden">
            {/* Header */}
            <div className="bg-purple-600 px-6 py-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-white">Chat Logger</h2>
                  <p className="text-purple-200 text-sm">
                    Describe what you did today
                  </p>
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  className="text-white/80 hover:text-white"
                >
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="p-6 space-y-4">
              {/* Input */}
              <div>
                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="e.g., We did math worksheets and read for an hour..."
                  rows={3}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                />
                <div className="flex justify-between items-center mt-2">
                  <span className="text-xs text-gray-500">
                    Press Enter to parse, Shift+Enter for new line
                  </span>
                  <button
                    onClick={parseInput}
                    disabled={isProcessing || !input.trim()}
                    className="px-4 py-1.5 bg-purple-600 hover:bg-purple-700 text-white text-sm rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isProcessing ? 'Parsing...' : 'Parse'}
                  </button>
                </div>
              </div>

              {/* Parsed Activities */}
              {parsedActivities.length > 0 && (
                <div className="space-y-3">
                  <div className="text-sm font-medium text-gray-700">
                    Parsed Activities ({parsedActivities.length})
                  </div>
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {parsedActivities.map((activity, index) => (
                      <div
                        key={index}
                        className="p-3 bg-purple-50 rounded-lg border border-purple-100"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="font-medium text-gray-900">
                              {activity.title}
                            </div>
                            <div className="text-sm text-gray-600 mt-1">
                              <span className="inline-flex items-center gap-1">
                                <span className="font-medium">{activity.studentName}</span>
                                <span>•</span>
                                <span>{activity.subjectName}</span>
                                <span>•</span>
                                <span>{activityTypeLabels[activity.activityType] || activity.activityType}</span>
                                {activity.duration && (
                                  <>
                                    <span>•</span>
                                    <span>{activity.duration} min</span>
                                  </>
                                )}
                              </span>
                            </div>
                          </div>
                          <button
                            onClick={() => removeActivity(index)}
                            className="ml-2 text-gray-400 hover:text-red-500"
                          >
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  <button
                    onClick={saveActivities}
                    disabled={isSaving}
                    className="w-full py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
                  >
                    {isSaving ? 'Saving...' : `Save ${parsedActivities.length} Activities`}
                  </button>
                </div>
              )}

              {/* Error */}
              {error && (
                <div className="p-3 bg-red-50 border border-red-100 rounded-lg text-sm text-red-600">
                  {error}
                </div>
              )}

              {/* Examples */}
              {parsedActivities.length === 0 && !isProcessing && (
                <div className="text-sm text-gray-500">
                  <div className="font-medium mb-2">Try saying:</div>
                  <ul className="space-y-1 text-gray-400">
                    <li>• "Emma did 2 math worksheets"</li>
                    <li>• "Both kids read for 30 minutes"</li>
                    <li>• "We watched a science video about dinosaurs"</li>
                    <li>• "Piano practice for an hour"</li>
                  </ul>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
