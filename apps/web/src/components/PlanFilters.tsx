import { Input, Select } from '@homeschool/ui'
import type { GradeLevel, ActivityType } from '@homeschool/shared-types'

interface PlanFiltersProps {
  onSearchChange?: (query: string) => void
  onGradeLevelChange?: (gradeLevel: GradeLevel | '') => void
  onActivityTypeChange?: (activityType: ActivityType | '') => void
}

export function PlanFilters({ onSearchChange, onGradeLevelChange, onActivityTypeChange }: PlanFiltersProps) {
  const gradeLevels = [
    { value: '', label: 'All Grade Levels' },
    { value: 'pre-k', label: 'Pre-K' },
    { value: 'k', label: 'Kindergarten' },
    { value: '1st', label: '1st Grade' },
    { value: '2nd', label: '2nd Grade' },
    { value: '3rd', label: '3rd Grade' },
    { value: '4th', label: '4th Grade' },
    { value: '5th', label: '5th Grade' },
  ]

  const activityTypes = [
    { value: '', label: 'All Types' },
    { value: 'worksheet', label: 'Worksheet' },
    { value: 'video', label: 'Video' },
    { value: 'reading', label: 'Reading' },
    { value: 'writing', label: 'Writing' },
    { value: 'hands_on', label: 'Hands-On' },
    { value: 'interactive', label: 'Interactive' },
  ]

  return (
    <div className="flex gap-4 flex-wrap">
      <Input
        placeholder="Search lesson plans..."
        onChange={(e) => onSearchChange?.(e.target.value)}
        className="max-w-md"
      />
      <Select
        options={gradeLevels}
        onChange={(value) => onGradeLevelChange?.(value as GradeLevel | '')}
        placeholder="Grade Level"
      />
      <Select
        options={activityTypes}
        onChange={(value) => onActivityTypeChange?.(value as ActivityType | '')}
        placeholder="Activity Type"
      />
    </div>
  )
}
