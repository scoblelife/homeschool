import type { Meta, StoryObj } from '@storybook/react'
import { ProgressBar, CircularProgress } from './ProgressBar'

// ProgressBar Meta
const meta: Meta<typeof ProgressBar> = {
  title: 'UI/Progress',
  component: ProgressBar,
  tags: ['autodocs'],
  argTypes: {
    value: {
      control: { type: 'range', min: 0, max: 100, step: 1 },
    },
    max: {
      control: 'number',
    },
    variant: {
      control: 'select',
      options: ['default', 'primary', 'success', 'warning', 'danger'],
    },
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg'],
    },
    showLabel: {
      control: 'boolean',
    },
    label: {
      control: 'text',
    },
  },
}

export default meta
type Story = StoryObj<typeof ProgressBar>

// Default
export const Default: Story = {
  args: {
    value: 65,
  },
}

// Variants
export const Primary: Story = {
  args: {
    value: 75,
    variant: 'primary',
  },
}

export const Success: Story = {
  args: {
    value: 100,
    variant: 'success',
  },
}

export const Warning: Story = {
  args: {
    value: 45,
    variant: 'warning',
  },
}

export const Danger: Story = {
  args: {
    value: 20,
    variant: 'danger',
  },
}

// Sizes
export const Small: Story = {
  args: {
    value: 60,
    size: 'sm',
  },
}

export const Medium: Story = {
  args: {
    value: 60,
    size: 'md',
  },
}

export const Large: Story = {
  args: {
    value: 60,
    size: 'lg',
  },
}

// With Labels
export const WithPercentage: Story = {
  args: {
    value: 75,
    showLabel: true,
  },
}

export const WithLabel: Story = {
  args: {
    value: 3,
    max: 5,
    label: 'Activities Today',
    showLabel: true,
  },
}

export const WithLabelAndPercentage: Story = {
  args: {
    value: 750,
    max: 1000,
    label: 'Required Hours',
    showLabel: true,
  },
}

// All Variants
export const AllVariants: Story = {
  render: () => (
    <div className="space-y-4 w-64">
      <ProgressBar value={100} variant="default" />
      <ProgressBar value={80} variant="primary" />
      <ProgressBar value={60} variant="success" />
      <ProgressBar value={40} variant="warning" />
      <ProgressBar value={20} variant="danger" />
    </div>
  ),
}

// All Sizes
export const AllSizes: Story = {
  render: () => (
    <div className="space-y-4 w-64">
      <ProgressBar value={75} size="sm" />
      <ProgressBar value={75} size="md" />
      <ProgressBar value={75} size="lg" />
    </div>
  ),
}

// Circular Progress
export const CircularDefault: Story = {
  render: () => <CircularProgress value={65} />,
}

export const CircularWithLabel: Story = {
  render: () => <CircularProgress value={75} showLabel />,
}

export const CircularSizes: Story = {
  render: () => (
    <div className="flex items-center gap-4">
      <CircularProgress value={60} size={32} strokeWidth={3} />
      <CircularProgress value={60} size={48} strokeWidth={4} />
      <CircularProgress value={60} size={64} strokeWidth={5} />
      <CircularProgress value={60} size={80} strokeWidth={6} showLabel />
    </div>
  ),
}

export const CircularVariants: Story = {
  render: () => (
    <div className="flex gap-4">
      <CircularProgress value={100} variant="default" showLabel />
      <CircularProgress value={80} variant="primary" showLabel />
      <CircularProgress value={60} variant="success" showLabel />
      <CircularProgress value={40} variant="warning" showLabel />
      <CircularProgress value={20} variant="danger" showLabel />
    </div>
  ),
}

// Use Cases
export const DailyProgress: Story = {
  render: () => (
    <div className="p-4 bg-white rounded-xl border border-gray-200 max-w-sm">
      <h3 className="font-semibold text-gray-900 mb-4">Today's Progress</h3>
      <div className="space-y-3">
        <ProgressBar value={3} max={5} label="Activities" showLabel variant="primary" />
        <ProgressBar value={90} max={120} label="Minutes" showLabel variant="success" />
        <ProgressBar value={2} max={4} label="Subjects" showLabel variant="default" />
      </div>
    </div>
  ),
}

export const ComplianceProgress: Story = {
  render: () => (
    <div className="p-4 bg-white rounded-xl border border-gray-200 max-w-sm">
      <h3 className="font-semibold text-gray-900 mb-4">Annual Requirements</h3>
      <div className="space-y-3">
        <ProgressBar
          value={750}
          max={1000}
          label="Required Hours"
          showLabel
          variant="success"
        />
        <p className="text-sm text-gray-500">750 of 1000 hours completed (75%)</p>
      </div>
    </div>
  ),
}

export const StudentStats: Story = {
  render: () => (
    <div className="grid grid-cols-2 gap-4 max-w-md">
      <div className="p-3 bg-white rounded-lg border text-center">
        <CircularProgress value={85} variant="primary" size={56} showLabel />
        <p className="text-sm text-gray-600 mt-2">Math</p>
      </div>
      <div className="p-3 bg-white rounded-lg border text-center">
        <CircularProgress value={92} variant="success" size={56} showLabel />
        <p className="text-sm text-gray-600 mt-2">Reading</p>
      </div>
      <div className="p-3 bg-white rounded-lg border text-center">
        <CircularProgress value={68} variant="warning" size={56} showLabel />
        <p className="text-sm text-gray-600 mt-2">Science</p>
      </div>
      <div className="p-3 bg-white rounded-lg border text-center">
        <CircularProgress value={95} variant="success" size={56} showLabel />
        <p className="text-sm text-gray-600 mt-2">Art</p>
      </div>
    </div>
  ),
}

export const LoadingStates: Story = {
  render: () => (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <CircularProgress value={0} size={24} strokeWidth={3} />
        <span className="text-sm text-gray-600">Not started</span>
      </div>
      <div className="flex items-center gap-3">
        <CircularProgress value={50} variant="primary" size={24} strokeWidth={3} />
        <span className="text-sm text-gray-600">In progress</span>
      </div>
      <div className="flex items-center gap-3">
        <CircularProgress value={100} variant="success" size={24} strokeWidth={3} />
        <span className="text-sm text-gray-600">Complete</span>
      </div>
    </div>
  ),
}

export const StreakProgress: Story = {
  render: () => (
    <div className="p-4 bg-gradient-to-r from-fuchsia-50 to-purple-50 rounded-xl max-w-xs">
      <div className="flex items-center gap-4">
        <CircularProgress value={70} max={100} variant="primary" size={64} showLabel />
        <div>
          <h4 className="font-semibold text-gray-900">7 Day Streak</h4>
          <p className="text-sm text-gray-600">Keep going!</p>
        </div>
      </div>
    </div>
  ),
}
