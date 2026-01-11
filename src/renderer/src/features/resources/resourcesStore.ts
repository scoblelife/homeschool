import { create } from 'zustand'
import type { GradeLevel } from '../../../../shared/types'
import {
  LearningResource,
  LEARNING_RESOURCES,
  getUniqueSubjects,
  getUniqueCategories
} from './resourceData'

interface ResourcesState {
  // Filters
  selectedSubject: string | null
  selectedGrade: GradeLevel | null
  selectedCategory: LearningResource['category'] | null
  freeOnly: boolean
  searchQuery: string

  // Favorites
  favoriteResources: string[]

  // Usage tracking
  recentlyUsed: Array<{ resourceId: string; timestamp: number }>

  // Computed
  filteredResources: LearningResource[]
  allSubjects: string[]
  allCategories: LearningResource['category'][]

  // Actions
  setSelectedSubject: (subject: string | null) => void
  setSelectedGrade: (grade: GradeLevel | null) => void
  setSelectedCategory: (category: LearningResource['category'] | null) => void
  setFreeOnly: (freeOnly: boolean) => void
  setSearchQuery: (query: string) => void
  clearFilters: () => void
  toggleFavorite: (id: string) => void
  trackUsage: (resourceId: string) => void
}

function applyFilters(
  subject: string | null,
  grade: GradeLevel | null,
  category: LearningResource['category'] | null,
  freeOnly: boolean,
  query: string
): LearningResource[] {
  let results = [...LEARNING_RESOURCES]

  if (subject) {
    results = results.filter(r => r.subjects.includes(subject))
  }

  if (grade) {
    results = results.filter(r => r.gradeLevels.includes(grade))
  }

  if (category) {
    results = results.filter(r => r.category === category)
  }

  if (freeOnly) {
    results = results.filter(r => r.isFree)
  }

  if (query.trim()) {
    const lower = query.toLowerCase()
    results = results.filter(r =>
      r.name.toLowerCase().includes(lower) ||
      r.description.toLowerCase().includes(lower) ||
      r.features.some(f => f.toLowerCase().includes(lower))
    )
  }

  return results
}

export const useResourcesStore = create<ResourcesState>((set, get) => ({
  // Initial state
  selectedSubject: null,
  selectedGrade: null,
  selectedCategory: null,
  freeOnly: false,
  searchQuery: '',
  favoriteResources: [],
  recentlyUsed: [],
  filteredResources: LEARNING_RESOURCES,
  allSubjects: getUniqueSubjects(),
  allCategories: getUniqueCategories(),

  // Actions
  setSelectedSubject: (subject) => {
    const state = get()
    set({
      selectedSubject: subject,
      filteredResources: applyFilters(
        subject,
        state.selectedGrade,
        state.selectedCategory,
        state.freeOnly,
        state.searchQuery
      )
    })
  },

  setSelectedGrade: (grade) => {
    const state = get()
    set({
      selectedGrade: grade,
      filteredResources: applyFilters(
        state.selectedSubject,
        grade,
        state.selectedCategory,
        state.freeOnly,
        state.searchQuery
      )
    })
  },

  setSelectedCategory: (category) => {
    const state = get()
    set({
      selectedCategory: category,
      filteredResources: applyFilters(
        state.selectedSubject,
        state.selectedGrade,
        category,
        state.freeOnly,
        state.searchQuery
      )
    })
  },

  setFreeOnly: (freeOnly) => {
    const state = get()
    set({
      freeOnly,
      filteredResources: applyFilters(
        state.selectedSubject,
        state.selectedGrade,
        state.selectedCategory,
        freeOnly,
        state.searchQuery
      )
    })
  },

  setSearchQuery: (query) => {
    const state = get()
    set({
      searchQuery: query,
      filteredResources: applyFilters(
        state.selectedSubject,
        state.selectedGrade,
        state.selectedCategory,
        state.freeOnly,
        query
      )
    })
  },

  clearFilters: () => {
    set({
      selectedSubject: null,
      selectedGrade: null,
      selectedCategory: null,
      freeOnly: false,
      searchQuery: '',
      filteredResources: LEARNING_RESOURCES
    })
  },

  toggleFavorite: (id) => {
    set((state) => ({
      favoriteResources: state.favoriteResources.includes(id)
        ? state.favoriteResources.filter(i => i !== id)
        : [...state.favoriteResources, id]
    }))
  },

  trackUsage: (resourceId) => {
    set((state) => {
      const updated = [
        { resourceId, timestamp: Date.now() },
        ...state.recentlyUsed.filter(r => r.resourceId !== resourceId)
      ].slice(0, 10) // Keep last 10
      return { recentlyUsed: updated }
    })
  }
}))
