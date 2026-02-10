import type { Meta, StoryObj } from "@storybook/react";
import { Tabs } from "./Tabs";

const meta: Meta<typeof Tabs> = {
  title: "UI/Tabs",
  component: Tabs,
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof Tabs>;

// Default Tabs
export const Default: Story = {
  args: {
    tabs: [
      {
        label: "Overview",
        content: (
          <div className="p-4 bg-neutral-surface border border-neutral-border rounded-lg">
            <h3 className="font-medium text-neutral-text mb-2">Overview</h3>
            <p className="text-neutral-textSecondary">
              This is the overview tab content. It provides a summary of key
              information.
            </p>
          </div>
        ),
      },
      {
        label: "Details",
        content: (
          <div className="p-4 bg-neutral-surface border border-neutral-border rounded-lg">
            <h3 className="font-medium text-neutral-text mb-2">Details</h3>
            <p className="text-neutral-textSecondary">
              This tab shows detailed information about the selected item.
            </p>
          </div>
        ),
      },
      {
        label: "Settings",
        content: (
          <div className="p-4 bg-neutral-surface border border-neutral-border rounded-lg">
            <h3 className="font-medium text-neutral-text mb-2">Settings</h3>
            <p className="text-neutral-textSecondary">
              Configure settings and preferences here.
            </p>
          </div>
        ),
      },
    ],
  },
};

// Pills Variant
export const Pills: Story = {
  args: {
    variant: "pills",
    tabs: [
      {
        label: "All",
        content: (
          <div className="space-y-2">
            <div className="p-3 bg-neutral-surface border border-neutral-border rounded-lg">
              All activities
            </div>
            <div className="p-3 bg-neutral-surface border border-neutral-border rounded-lg">
              Including completed and pending
            </div>
          </div>
        ),
      },
      {
        label: "Active",
        content: (
          <div className="p-3 bg-neutral-surface border border-neutral-border rounded-lg">
            Only active activities shown here
          </div>
        ),
      },
      {
        label: "Completed",
        content: (
          <div className="p-3 bg-neutral-surface border border-neutral-border rounded-lg">
            Completed activities shown here
          </div>
        ),
      },
    ],
  },
};

// With Icons
export const WithIcons: Story = {
  args: {
    tabs: [
      {
        label: "Activities",
        icon: (
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
        ),
        content: (
          <div className="p-4 bg-neutral-surface border border-neutral-border rounded-lg">
            <h3 className="font-medium text-neutral-text mb-2">Activities</h3>
            <p className="text-neutral-textSecondary">
              View and manage all activities
            </p>
          </div>
        ),
      },
      {
        label: "Milestones",
        icon: (
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
            />
          </svg>
        ),
        content: (
          <div className="p-4 bg-neutral-surface border border-neutral-border rounded-lg">
            <h3 className="font-medium text-neutral-text mb-2">Milestones</h3>
            <p className="text-neutral-textSecondary">
              Track important achievements
            </p>
          </div>
        ),
      },
      {
        label: "Reports",
        icon: (
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
        ),
        content: (
          <div className="p-4 bg-neutral-surface border border-neutral-border rounded-lg">
            <h3 className="font-medium text-neutral-text mb-2">Reports</h3>
            <p className="text-neutral-textSecondary">
              View statistics and generate reports
            </p>
          </div>
        ),
      },
    ],
  },
};

// With Disabled Tab
export const WithDisabledTab: Story = {
  args: {
    tabs: [
      {
        label: "Available",
        content: (
          <div className="p-4 bg-neutral-surface border border-neutral-border rounded-lg">
            This tab is available
          </div>
        ),
      },
      {
        label: "Coming Soon",
        disabled: true,
        content: (
          <div className="p-4 bg-neutral-surface border border-neutral-border rounded-lg">
            This content is not accessible
          </div>
        ),
      },
      {
        label: "Also Available",
        content: (
          <div className="p-4 bg-neutral-surface border border-neutral-border rounded-lg">
            This tab is also available
          </div>
        ),
      },
    ],
  },
};

// Student Activity Tabs Example
export const StudentActivityTabs: Story = {
  args: {
    variant: "pills",
    tabs: [
      {
        label: "Emma",
        content: (
          <div className="space-y-3">
            <div className="p-4 bg-neutral-surface border border-student-fuchsia-500 rounded-lg">
              <h4 className="font-medium text-neutral-text">Math Worksheet</h4>
              <p className="text-sm text-neutral-textSecondary">
                Completed today
              </p>
            </div>
            <div className="p-4 bg-neutral-surface border border-neutral-border rounded-lg">
              <h4 className="font-medium text-neutral-text">
                Reading - Chapter 3
              </h4>
              <p className="text-sm text-neutral-textSecondary">
                Completed yesterday
              </p>
            </div>
          </div>
        ),
      },
      {
        label: "Jackson",
        content: (
          <div className="space-y-3">
            <div className="p-4 bg-neutral-surface border border-student-teal-500 rounded-lg">
              <h4 className="font-medium text-neutral-text">
                Science Experiment
              </h4>
              <p className="text-sm text-neutral-textSecondary">
                Completed today
              </p>
            </div>
            <div className="p-4 bg-neutral-surface border border-neutral-border rounded-lg">
              <h4 className="font-medium text-neutral-text">
                Writing Practice
              </h4>
              <p className="text-sm text-neutral-textSecondary">
                Completed yesterday
              </p>
            </div>
          </div>
        ),
      },
    ],
  },
};
