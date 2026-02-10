import type { Meta, StoryObj } from "@storybook/react";
import {
  EmptyState,
  NoStudentsEmpty,
  NoActivitiesEmpty,
  NoResultsEmpty,
} from "./EmptyState";
import { Button } from "./Button";

const meta: Meta<typeof EmptyState> = {
  title: "UI/EmptyState",
  component: EmptyState,
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof EmptyState>;

// Basic
export const Default: Story = {
  args: {
    title: "No items",
    description: "There are no items to display.",
  },
};

// With Icon
export const WithIcon: Story = {
  args: {
    icon: (
      <svg
        className="w-full h-full"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.5}
          d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
        />
      </svg>
    ),
    title: "Inbox empty",
    description: "No new messages.",
  },
};

// With Action
export const WithAction: Story = {
  args: {
    icon: (
      <svg
        className="w-full h-full"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.5}
          d="M12 4v16m8-8H4"
        />
      </svg>
    ),
    title: "No activities yet",
    description: "Get started by logging your first activity.",
    action: <Button>Log Activity</Button>,
  },
};

// Pre-built: No Students
export const NoStudents: Story = {
  render: () => <NoStudentsEmpty onAdd={() => alert("Add student clicked")} />,
};

export const NoStudentsWithoutAction: Story = {
  render: () => <NoStudentsEmpty />,
};

// Pre-built: No Activities
export const NoActivities: Story = {
  render: () => <NoActivitiesEmpty />,
};

// Pre-built: No Results
export const NoResults: Story = {
  render: () => <NoResultsEmpty />,
};

export const NoResultsWithQuery: Story = {
  render: () => <NoResultsEmpty query="Charlotte's Web" />,
};

// Custom Examples
export const NoFieldTrips: Story = {
  args: {
    icon: (
      <svg
        className="w-full h-full"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.5}
          d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
        />
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.5}
          d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
        />
      </svg>
    ),
    title: "No field trips planned",
    description: "Plan your first educational adventure.",
    action: <Button variant="primary">Plan Field Trip</Button>,
  },
};

export const NoMilestones: Story = {
  args: {
    icon: (
      <svg
        className="w-full h-full"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.5}
          d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
        />
      </svg>
    ),
    title: "No milestones yet",
    description: "Create milestones to celebrate learning achievements.",
    action: <Button>Create Milestone</Button>,
  },
};

export const OfflineState: Story = {
  args: {
    icon: (
      <svg
        className="w-full h-full"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.5}
          d="M18.364 5.636a9 9 0 010 12.728m0 0l-2.829-2.829m2.829 2.829L21 21M15.536 8.464a5 5 0 010 7.072m0 0l-2.829-2.829m-4.243 2.829a4.978 4.978 0 01-1.414-2.83m-1.414 5.658a9 9 0 01-2.167-9.238m7.824 2.167a1 1 0 111.414 1.414m-1.414-1.414L3 3m8.293 8.293l1.414 1.414"
        />
      </svg>
    ),
    title: "You're offline",
    description: "Some features may be limited. Your data is saved locally.",
  },
};

// Error State
export const ErrorState: Story = {
  args: {
    icon: (
      <svg
        className="w-full h-full text-red-400"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.5}
          d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
        />
      </svg>
    ),
    title: "Something went wrong",
    description: "We couldn't load your data. Please try again.",
    action: <Button variant="outline">Retry</Button>,
  },
};

// In Context
export const InCard: Story = {
  render: () => (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm max-w-md">
      <NoActivitiesEmpty />
    </div>
  ),
};

export const InDashboard: Story = {
  render: () => (
    <div className="p-6 bg-gray-50 rounded-lg">
      <h2 className="text-lg font-semibold mb-4">Today's Activities</h2>
      <div className="bg-white rounded-xl border border-gray-200">
        <EmptyState
          icon={
            <svg
              className="w-full h-full"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
              />
            </svg>
          }
          title="Start your day!"
          description="Log your first learning activity."
          action={<Button size="sm">Log Activity</Button>}
        />
      </div>
    </div>
  ),
  parameters: {
    layout: "padded",
  },
};
