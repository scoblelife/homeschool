import type { Meta, StoryObj } from "@storybook/react";
import {
  Dropdown,
  DropdownTriggerButton,
  DropdownIconTrigger,
} from "./Dropdown";

const meta: Meta<typeof Dropdown> = {
  title: "UI/Dropdown",
  component: Dropdown,
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof Dropdown>;

// Basic Dropdown
export const Default: Story = {
  args: {
    trigger: <DropdownTriggerButton>Options</DropdownTriggerButton>,
    items: [
      {
        label: "View Details",
        onClick: () => alert("View Details"),
      },
      {
        label: "Edit",
        onClick: () => alert("Edit"),
      },
      {
        label: "Duplicate",
        onClick: () => alert("Duplicate"),
      },
      {
        label: "Delete",
        onClick: () => alert("Delete"),
        variant: "danger",
        divider: true,
      },
    ],
  },
};

// Icon-only Trigger
export const IconTrigger: Story = {
  args: {
    trigger: <DropdownIconTrigger />,
    items: [
      {
        label: "Edit",
        onClick: () => alert("Edit"),
      },
      {
        label: "Share",
        onClick: () => alert("Share"),
      },
      {
        label: "Delete",
        onClick: () => alert("Delete"),
        variant: "danger",
        divider: true,
      },
    ],
  },
};

// With Icons
export const WithIcons: Story = {
  args: {
    trigger: <DropdownTriggerButton>Actions</DropdownTriggerButton>,
    items: [
      {
        label: "Edit",
        onClick: () => alert("Edit"),
        icon: (
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
            />
          </svg>
        ),
      },
      {
        label: "Download",
        onClick: () => alert("Download"),
        icon: (
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
            />
          </svg>
        ),
      },
      {
        label: "Share",
        onClick: () => alert("Share"),
        icon: (
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
            />
          </svg>
        ),
      },
      {
        label: "Delete",
        onClick: () => alert("Delete"),
        variant: "danger",
        divider: true,
        icon: (
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
            />
          </svg>
        ),
      },
    ],
  },
};

// Aligned Left
export const LeftAligned: Story = {
  args: {
    trigger: <DropdownTriggerButton>Left Aligned</DropdownTriggerButton>,
    align: "left",
    items: [
      {
        label: "Option 1",
        onClick: () => alert("Option 1"),
      },
      {
        label: "Option 2",
        onClick: () => alert("Option 2"),
      },
      {
        label: "Option 3",
        onClick: () => alert("Option 3"),
      },
    ],
  },
};

// With Disabled Item
export const WithDisabledItem: Story = {
  args: {
    trigger: <DropdownTriggerButton>Options</DropdownTriggerButton>,
    items: [
      {
        label: "Available Action",
        onClick: () => alert("Available"),
      },
      {
        label: "Disabled Action",
        onClick: () => alert("This should not fire"),
        disabled: true,
      },
      {
        label: "Another Available Action",
        onClick: () => alert("Available"),
      },
    ],
  },
};

// Activity Card Actions Example
export const ActivityCardActions: Story = {
  render: () => {
    const handleEdit = () => alert("Edit activity");
    const handleDuplicate = () => alert("Duplicate activity");
    const handleDelete = () => alert("Delete activity");

    return (
      <div className="inline-flex items-center gap-4 p-4 bg-neutral-surface border border-neutral-border rounded-lg">
        <div className="flex-1">
          <h3 className="font-medium text-neutral-text">
            Math Worksheet - Chapter 5
          </h3>
          <p className="text-sm text-neutral-textSecondary">Completed today</p>
        </div>
        <Dropdown
          trigger={<DropdownIconTrigger />}
          items={[
            {
              label: "Edit Activity",
              onClick: handleEdit,
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
                    d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                  />
                </svg>
              ),
            },
            {
              label: "Duplicate",
              onClick: handleDuplicate,
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
                    d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                  />
                </svg>
              ),
            },
            {
              label: "Delete",
              onClick: handleDelete,
              variant: "danger",
              divider: true,
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
                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                  />
                </svg>
              ),
            },
          ]}
        />
      </div>
    );
  },
};
