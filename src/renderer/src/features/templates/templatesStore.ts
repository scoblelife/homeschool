import { create } from 'zustand'
import type { GradeLevel } from '../../../../shared/types'
import {
  ActivityTemplate,
  ACTIVITY_TEMPLATES,
  getTemplatesBySubject,
  getTemplatesByGrade,
  getTemplatesByCategory,
  searchTemplates,
  getUniqueSubjects,
  getUniqueTags
} from './templateData'

interface TemplatesState {
  // Filters
  selectedSubject: string | null
  selectedGrade: GradeLevel | null
  selectedCategory: ActivityTemplate['category'] | null
  searchQuery: string
  selectedTags: string[]

  // UI State
  recentlyUsed: string[] // Template IDs
  favorites: string[] // Template IDs

  // Computed
  filteredTemplates: ActivityTemplate[]
  allSubjects: Array<{ id: string; name: string }>
  allTags: string[]

  // Actions
  setSelectedSubject: (subject: string | null) => void
  setSelectedGrade: (grade: GradeLevel | null) => void
  setSelectedCategory: (category: ActivityTemplate['category'] | null) => void
  setSearchQuery: (query: string) => void
  toggleTag: (tag: string) => void
  clearFilters: () => void
  addToRecentlyUsed: (templateId: string) => void
  toggleFavorite: (templateId: string) => void
}

function applyFilters(
  subject: string | null,
  grade: GradeLevel | null,
  category: ActivityTemplate['category'] | null,
  query: string,
  tags: string[]
): ActivityTemplate[] {
  let results = [...ACTIVITY_TEMPLATES]

  if (subject) {
    results = results.filter(t => t.subjectId === subject)
  }

  if (grade) {
    results = results.filter(t => t.grades.includes(grade))
  }

  if (category) {
    results = results.filter(t => t.category === category)
  }

  if (query.trim()) {
    const lower = query.toLowerCase()
    results = results.filter(t =>
      t.name.toLowerCase().includes(lower) ||
      t.description.toLowerCase().includes(lower) ||
      t.tags.some(tag => tag.toLowerCase().includes(lower))
    )
  }

  if (tags.length > 0) {
    results = results.filter(t =>
      tags.some(tag => t.tags.includes(tag))
    )
  }

  return results
}

export const useTemplatesStore = create<TemplatesState>((set, get) => ({
  // Initial state
  selectedSubject: null,
  selectedGrade: null,
  selectedCategory: null,
  searchQuery: '',
  selectedTags: [],
  recentlyUsed: [],
  favorites: [],
  filteredTemplates: ACTIVITY_TEMPLATES,
  allSubjects: getUniqueSubjects(),
  allTags: getUniqueTags(),

  // Actions
  setSelectedSubject: (subject) => {
    set((state) => ({
      selectedSubject: subject,
      filteredTemplates: applyFilters(
        subject,
        state.selectedGrade,
        state.selectedCategory,
        state.searchQuery,
        state.selectedTags
      )
    }))
  },

  setSelectedGrade: (grade) => {
    set((state) => ({
      selectedGrade: grade,
      filteredTemplates: applyFilters(
        state.selectedSubject,
        grade,
        state.selectedCategory,
        state.searchQuery,
        state.selectedTags
      )
    }))
  },

  setSelectedCategory: (category) => {
    set((state) => ({
      selectedCategory: category,
      filteredTemplates: applyFilters(
        state.selectedSubject,
        state.selectedGrade,
        category,
        state.searchQuery,
        state.selectedTags
      )
    }))
  },

  setSearchQuery: (query) => {
    set((state) => ({
      searchQuery: query,
      filteredTemplates: applyFilters(
        state.selectedSubject,
        state.selectedGrade,
        state.selectedCategory,
        query,
        state.selectedTags
      )
    }))
  },

  toggleTag: (tag) => {
    set((state) => {
      const newTags = state.selectedTags.includes(tag)
        ? state.selectedTags.filter(t => t !== tag)
        : [...state.selectedTags, tag]
      return {
        selectedTags: newTags,
        filteredTemplates: applyFilters(
          state.selectedSubject,
          state.selectedGrade,
          state.selectedCategory,
          state.searchQuery,
          newTags
        )
      }
    })
  },

  clearFilters: () => {
    set({
      selectedSubject: null,
      selectedGrade: null,
      selectedCategory: null,
      searchQuery: '',
      selectedTags: [],
      filteredTemplates: ACTIVITY_TEMPLATES
    })
  },

  addToRecentlyUsed: (templateId) => {
    set((state) => {
      const updated = [templateId, ...state.recentlyUsed.filter(id => id !== templateId)]
      return { recentlyUsed: updated.slice(0, 10) } // Keep last 10
    })
  },

  toggleFavorite: (templateId) => {
    set((state) => ({
      favorites: state.favorites.includes(templateId)
        ? state.favorites.filter(id => id !== templateId)
        : [...state.favorites, templateId]
    }))
  }
}))
