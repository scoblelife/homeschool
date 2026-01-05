import { create } from 'zustand'
import type { Student, Subject, Session, Activity, Milestone } from '../../../shared/types'

interface AppState {
  // Data
  students: Student[]
  subjects: Subject[]
  sessions: Session[]
  activities: Activity[]
  milestones: Milestone[]

  // UI State
  selectedStudentId: string | null
  isLoading: boolean

  // Actions
  setStudents: (students: Student[]) => void
  setSubjects: (subjects: Subject[]) => void
  setSessions: (sessions: Session[]) => void
  setActivities: (activities: Activity[]) => void
  setMilestones: (milestones: Milestone[]) => void
  setSelectedStudentId: (id: string | null) => void
  setIsLoading: (loading: boolean) => void

  // Helpers
  getStudentById: (id: string) => Student | undefined
  getSubjectById: (id: string) => Subject | undefined
  getSelectedStudent: () => Student | undefined
}

export const useStore = create<AppState>((set, get) => ({
  // Initial state
  students: [],
  subjects: [],
  sessions: [],
  activities: [],
  milestones: [],
  selectedStudentId: null,
  isLoading: true,

  // Actions
  setStudents: (students) => set({ students }),
  setSubjects: (subjects) => set({ subjects }),
  setSessions: (sessions) => set({ sessions }),
  setActivities: (activities) => set({ activities }),
  setMilestones: (milestones) => set({ milestones }),
  setSelectedStudentId: (selectedStudentId) => set({ selectedStudentId }),
  setIsLoading: (isLoading) => set({ isLoading }),

  // Helpers
  getStudentById: (id) => get().students.find((s) => s.id === id),
  getSubjectById: (id) => get().subjects.find((s) => s.id === id),
  getSelectedStudent: () => {
    const { students, selectedStudentId } = get()
    return students.find((s) => s.id === selectedStudentId)
  }
}))
