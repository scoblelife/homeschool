import { create } from 'zustand'
import type { Student, Subject, Activity, Milestone, FamilyGoal } from '../types'

interface AppState {
  // Data
  students: Student[]
  subjects: Subject[]
  activities: Activity[]
  milestones: Milestone[]

  // UI State
  selectedStudentId: string | null
  isLoading: boolean
  isInitialized: boolean

  // Actions
  setStudents: (students: Student[]) => void
  setSubjects: (subjects: Subject[]) => void
  setActivities: (activities: Activity[]) => void
  setMilestones: (milestones: Milestone[]) => void
  setSelectedStudentId: (id: string | null) => void
  setIsLoading: (loading: boolean) => void
  setIsInitialized: (initialized: boolean) => void

  // Helpers
  getStudentById: (id: string) => Student | undefined
  getSubjectById: (id: string) => Subject | undefined
  getSelectedStudent: () => Student | undefined
}

export const useStore = create<AppState>((set, get) => ({
  // Initial data
  students: [],
  subjects: [],
  activities: [],
  milestones: [],

  // Initial UI state
  selectedStudentId: null,
  isLoading: false,
  isInitialized: false,

  // Actions
  setStudents: (students) => set({ students }),
  setSubjects: (subjects) => set({ subjects }),
  setActivities: (activities) => set({ activities }),
  setMilestones: (milestones) => set({ milestones }),
  setSelectedStudentId: (id) => set({ selectedStudentId: id }),
  setIsLoading: (loading) => set({ isLoading: loading }),
  setIsInitialized: (initialized) => set({ isInitialized: initialized }),

  // Helpers
  getStudentById: (id) => get().students.find((s) => s.id === id),
  getSubjectById: (id) => get().subjects.find((s) => s.id === id),
  getSelectedStudent: () => {
    const { students, selectedStudentId } = get()
    return students.find((s) => s.id === selectedStudentId)
  },
}))
