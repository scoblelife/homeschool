import { useState, useEffect, useCallback } from 'react'
import { useStore } from '../stores/useStore'
import type {
  CreateStudent,
  UpdateStudent,
  CreateSession,
  UpdateSession,
  CreateActivity,
  UpdateActivity,
  UpdateMilestone,
  ActivityType,
  GradeLevel
} from '../../../shared/types'

export function useInitializeData(): void {
  const { setStudents, setSubjects, setIsLoading } = useStore()

  useEffect(() => {
    async function loadData(): Promise<void> {
      try {
        const [students, subjects] = await Promise.all([
          window.api.getStudents(),
          window.api.getSubjects()
        ])
        setStudents(students)
        setSubjects(subjects)

        // Auto-select first student if available
        if (students.length > 0 && !useStore.getState().selectedStudentId) {
          useStore.getState().setSelectedStudentId(students[0].id)
        }
      } finally {
        setIsLoading(false)
      }
    }
    loadData()
  }, [setStudents, setSubjects, setIsLoading])
}

export function useStudents() {
  const { students, setStudents } = useStore()

  const createStudent = useCallback(async (data: CreateStudent) => {
    const student = await window.api.createStudent(data)
    setStudents([...useStore.getState().students, student])
    return student
  }, [setStudents])

  const updateStudent = useCallback(async (id: string, data: UpdateStudent) => {
    const student = await window.api.updateStudent(id, data)
    setStudents(useStore.getState().students.map((s) => (s.id === id ? student : s)))
    return student
  }, [setStudents])

  const deleteStudent = useCallback(async (id: string) => {
    await window.api.deleteStudent(id)
    setStudents(useStore.getState().students.filter((s) => s.id !== id))
  }, [setStudents])

  return { students, createStudent, updateStudent, deleteStudent }
}

export function useSessions(filters?: { studentId?: string; startDate?: string; endDate?: string }) {
  const { sessions, setSessions } = useStore()

  const loadSessions = useCallback(async () => {
    const data = await window.api.getSessions(filters)
    setSessions(data)
  }, [filters, setSessions])

  useEffect(() => {
    loadSessions()
  }, [loadSessions])

  const createSession = useCallback(async (data: CreateSession) => {
    const session = await window.api.createSession(data)
    setSessions([session, ...useStore.getState().sessions])
    return session
  }, [setSessions])

  const updateSession = useCallback(async (id: string, data: UpdateSession) => {
    const session = await window.api.updateSession(id, data)
    setSessions(useStore.getState().sessions.map((s) => (s.id === id ? session : s)))
    return session
  }, [setSessions])

  const deleteSession = useCallback(async (id: string) => {
    await window.api.deleteSession(id)
    setSessions(useStore.getState().sessions.filter((s) => s.id !== id))
  }, [setSessions])

  return { sessions, loadSessions, createSession, updateSession, deleteSession }
}

export function useActivities(filters?: {
  studentId?: string
  subjectId?: string
  activityType?: ActivityType
  startDate?: string
  endDate?: string
}) {
  const { activities, setActivities } = useStore()

  const loadActivities = useCallback(async () => {
    const data = await window.api.getActivities(filters)
    setActivities(data)
  }, [filters, setActivities])

  useEffect(() => {
    loadActivities()
  }, [loadActivities])

  const createActivity = useCallback(async (data: CreateActivity) => {
    const activity = await window.api.createActivity(data)
    setActivities([activity, ...useStore.getState().activities])
    return activity
  }, [setActivities])

  const updateActivity = useCallback(async (id: string, data: UpdateActivity) => {
    const activity = await window.api.updateActivity(id, data)
    setActivities(useStore.getState().activities.map((a) => (a.id === id ? activity : a)))
    return activity
  }, [setActivities])

  const deleteActivity = useCallback(async (id: string) => {
    await window.api.deleteActivity(id)
    setActivities(useStore.getState().activities.filter((a) => a.id !== id))
  }, [setActivities])

  return { activities, loadActivities, createActivity, updateActivity, deleteActivity }
}

export function useMilestones(studentId?: string) {
  const { milestones, setMilestones } = useStore()
  const [isLoading, setIsLoading] = useState(true)

  const loadMilestones = useCallback(async () => {
    setIsLoading(true)
    try {
      if (!studentId) {
        setMilestones([])
        return
      }
      const data = await window.api.getMilestones(studentId)
      setMilestones(data)
    } finally {
      setIsLoading(false)
    }
  }, [studentId, setMilestones])

  useEffect(() => {
    loadMilestones()
  }, [loadMilestones])

  const updateMilestone = useCallback(async (id: string, data: UpdateMilestone) => {
    const milestone = await window.api.updateMilestone(id, data)
    setMilestones(useStore.getState().milestones.map((m) => (m.id === id ? milestone : m)))
    return milestone
  }, [setMilestones])

  const deleteMilestone = useCallback(async (id: string) => {
    await window.api.deleteMilestone(id)
    setMilestones(useStore.getState().milestones.filter((m) => m.id !== id))
  }, [setMilestones])

  const initializeMilestones = useCallback(async (studentId: string, gradeLevel: GradeLevel) => {
    const newMilestones = await window.api.initializeStudentMilestones(studentId, gradeLevel)
    setMilestones(newMilestones)
    return newMilestones
  }, [setMilestones])

  return { milestones, isLoading, loadMilestones, updateMilestone, deleteMilestone, initializeMilestones }
}
