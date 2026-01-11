import { create } from 'zustand'
import type { GradeLevel } from '../../../../shared/types'
import {
  CurriculumRecommendation,
  CURRICULUM_RECOMMENDATIONS,
  getUniqueSubjects,
  getUniqueStyles
} from './curriculumData'

interface RecommendationsState {
  // Filters
  selectedSubject: string | null
  selectedGrade: GradeLevel | null
  selectedStyle: CurriculumRecommendation['style'] | null
  selectedPrice: CurriculumRecommendation['priceRange'] | null
  selectedCategory: CurriculumRecommendation['category'] | null
  searchQuery: string

  // Saved/bookmarked
  savedRecommendations: string[]

  // Computed
  filteredRecommendations: CurriculumRecommendation[]
  allSubjects: string[]
  allStyles: CurriculumRecommendation['style'][]

  // Actions
  setSelectedSubject: (subject: string | null) => void
  setSelectedGrade: (grade: GradeLevel | null) => void
  setSelectedStyle: (style: CurriculumRecommendation['style'] | null) => void
  setSelectedPrice: (price: CurriculumRecommendation['priceRange'] | null) => void
  setSelectedCategory: (category: CurriculumRecommendation['category'] | null) => void
  setSearchQuery: (query: string) => void
  clearFilters: () => void
  toggleSaved: (id: string) => void
}

function applyFilters(
  subject: string | null,
  grade: GradeLevel | null,
  style: CurriculumRecommendation['style'] | null,
  price: CurriculumRecommendation['priceRange'] | null,
  category: CurriculumRecommendation['category'] | null,
  query: string
): CurriculumRecommendation[] {
  let results = [...CURRICULUM_RECOMMENDATIONS]

  if (subject) {
    results = results.filter(r => r.subjects.includes(subject))
  }

  if (grade) {
    results = results.filter(r => r.gradeLevels.includes(grade))
  }

  if (style) {
    results = results.filter(r => r.style === style)
  }

  if (price) {
    results = results.filter(r => r.priceRange === price)
  }

  if (category) {
    results = results.filter(r => r.category === category)
  }

  if (query.trim()) {
    const lower = query.toLowerCase()
    results = results.filter(r =>
      r.name.toLowerCase().includes(lower) ||
      r.description.toLowerCase().includes(lower) ||
      r.publisher.toLowerCase().includes(lower) ||
      r.features.some(f => f.toLowerCase().includes(lower)) ||
      r.bestFor.some(b => b.toLowerCase().includes(lower))
    )
  }

  return results
}

export const useRecommendationsStore = create<RecommendationsState>((set, get) => ({
  // Initial state
  selectedSubject: null,
  selectedGrade: null,
  selectedStyle: null,
  selectedPrice: null,
  selectedCategory: null,
  searchQuery: '',
  savedRecommendations: [],
  filteredRecommendations: CURRICULUM_RECOMMENDATIONS,
  allSubjects: getUniqueSubjects(),
  allStyles: getUniqueStyles(),

  // Actions
  setSelectedSubject: (subject) => {
    const state = get()
    set({
      selectedSubject: subject,
      filteredRecommendations: applyFilters(
        subject,
        state.selectedGrade,
        state.selectedStyle,
        state.selectedPrice,
        state.selectedCategory,
        state.searchQuery
      )
    })
  },

  setSelectedGrade: (grade) => {
    const state = get()
    set({
      selectedGrade: grade,
      filteredRecommendations: applyFilters(
        state.selectedSubject,
        grade,
        state.selectedStyle,
        state.selectedPrice,
        state.selectedCategory,
        state.searchQuery
      )
    })
  },

  setSelectedStyle: (style) => {
    const state = get()
    set({
      selectedStyle: style,
      filteredRecommendations: applyFilters(
        state.selectedSubject,
        state.selectedGrade,
        style,
        state.selectedPrice,
        state.selectedCategory,
        state.searchQuery
      )
    })
  },

  setSelectedPrice: (price) => {
    const state = get()
    set({
      selectedPrice: price,
      filteredRecommendations: applyFilters(
        state.selectedSubject,
        state.selectedGrade,
        state.selectedStyle,
        price,
        state.selectedCategory,
        state.searchQuery
      )
    })
  },

  setSelectedCategory: (category) => {
    const state = get()
    set({
      selectedCategory: category,
      filteredRecommendations: applyFilters(
        state.selectedSubject,
        state.selectedGrade,
        state.selectedStyle,
        state.selectedPrice,
        category,
        state.searchQuery
      )
    })
  },

  setSearchQuery: (query) => {
    const state = get()
    set({
      searchQuery: query,
      filteredRecommendations: applyFilters(
        state.selectedSubject,
        state.selectedGrade,
        state.selectedStyle,
        state.selectedPrice,
        state.selectedCategory,
        query
      )
    })
  },

  clearFilters: () => {
    set({
      selectedSubject: null,
      selectedGrade: null,
      selectedStyle: null,
      selectedPrice: null,
      selectedCategory: null,
      searchQuery: '',
      filteredRecommendations: CURRICULUM_RECOMMENDATIONS
    })
  },

  toggleSaved: (id) => {
    set((state) => ({
      savedRecommendations: state.savedRecommendations.includes(id)
        ? state.savedRecommendations.filter(i => i !== id)
        : [...state.savedRecommendations, id]
    }))
  }
}))
