import type { Meta, StoryObj } from "@storybook/react";
import { Badge, StudentBadge } from "./Badge";

const meta: Meta<typeof Badge> = {
  title: "UI/Badge",
  component: Badge,
  tags: ["autodocs"],
  argTypes: {
    variant: {
      control: "select",
      options: [
        "default",
        "primary",
        "secondary",
        "success",
        "warning",
        "danger",
        "info",
      ],
    },
    size: {
      control: "select",
      options: ["sm", "md"],
    },
    dot: {
      control: "boolean",
    },
  },
};

export default meta;
type Story = StoryObj<typeof Badge>;

// Default
export const Default: Story = {
  args: {
    children: "Badge",
  },
};

// Variants
export const Primary: Story = {
  args: {
    children: "Primary",
    variant: "primary",
  },
};

export const Secondary: Story = {
  args: {
    children: "Secondary",
    variant: "secondary",
  },
};

export const Success: Story = {
  args: {
    children: "Success",
    variant: "success",
  },
};

export const Warning: Story = {
  args: {
    children: "Warning",
    variant: "warning",
  },
};

export const Danger: Story = {
  args: {
    children: "Danger",
    variant: "danger",
  },
};

export const Info: Story = {
  args: {
    children: "Info",
    variant: "info",
  },
};

// Sizes
export const Small: Story = {
  args: {
    children: "Small",
    size: "sm",
  },
};

export const Medium: Story = {
  args: {
    children: "Medium",
    size: "md",
  },
};

// With Dot
export const WithDot: Story = {
  args: {
    children: "Active",
    variant: "success",
    dot: true,
  },
};

// All Variants Grid
export const AllVariants: Story = {
  render: () => (
    <div className="flex flex-wrap gap-2">
      <Badge variant="default">Default</Badge>
      <Badge variant="primary">Primary</Badge>
      <Badge variant="secondary">Secondary</Badge>
      <Badge variant="success">Success</Badge>
      <Badge variant="warning">Warning</Badge>
      <Badge variant="danger">Danger</Badge>
      <Badge variant="info">Info</Badge>
    </div>
  ),
};

// All With Dots
export const AllWithDots: Story = {
  render: () => (
    <div className="flex flex-wrap gap-2">
      <Badge variant="default" dot>
        Default
      </Badge>
      <Badge variant="primary" dot>
        Primary
      </Badge>
      <Badge variant="secondary" dot>
        Secondary
      </Badge>
      <Badge variant="success" dot>
        Success
      </Badge>
      <Badge variant="warning" dot>
        Warning
      </Badge>
      <Badge variant="danger" dot>
        Danger
      </Badge>
      <Badge variant="info" dot>
        Info
      </Badge>
    </div>
  ),
};

// Use Cases
export const StatusBadges: Story = {
  render: () => (
    <div className="space-y-4">
      <h4 className="text-sm font-medium text-gray-700">Activity Status</h4>
      <div className="flex flex-wrap gap-2">
        <Badge variant="success" dot>
          Completed
        </Badge>
        <Badge variant="warning" dot>
          In Progress
        </Badge>
        <Badge variant="default" dot>
          Not Started
        </Badge>
      </div>
    </div>
  ),
};

export const SubjectBadges: Story = {
  render: () => (
    <div className="space-y-4">
      <h4 className="text-sm font-medium text-gray-700">Subjects</h4>
      <div className="flex flex-wrap gap-2">
        <Badge variant="primary">Math</Badge>
        <Badge variant="secondary">English</Badge>
        <Badge variant="info">Science</Badge>
        <Badge variant="success">Art</Badge>
        <Badge variant="warning">Music</Badge>
        <Badge variant="danger">PE</Badge>
      </div>
    </div>
  ),
};

export const DurationBadges: Story = {
  render: () => (
    <div className="space-y-4">
      <h4 className="text-sm font-medium text-gray-700">Activity Duration</h4>
      <div className="flex flex-wrap gap-2">
        <Badge variant="default">15 min</Badge>
        <Badge variant="default">30 min</Badge>
        <Badge variant="default">1 hr</Badge>
        <Badge variant="success">2 hrs</Badge>
      </div>
    </div>
  ),
};

// Student Badges
export const StudentBadges: Story = {
  render: () => (
    <div className="space-y-4">
      <h4 className="text-sm font-medium text-gray-700">Student Colors</h4>
      <div className="flex flex-wrap gap-2">
        <StudentBadge color="fuchsia">Emma</StudentBadge>
        <StudentBadge color="teal">Jack</StudentBadge>
        <StudentBadge color="blue">Sophia</StudentBadge>
        <StudentBadge color="orange">Liam</StudentBadge>
        <StudentBadge color="purple">Olivia</StudentBadge>
        <StudentBadge color="green">Noah</StudentBadge>
      </div>
    </div>
  ),
};

// All Student Colors
export const AllStudentColors: Story = {
  render: () => (
    <div className="grid grid-cols-3 gap-4">
      {(["fuchsia", "teal", "blue", "orange", "purple", "green"] as const).map(
        (color) => (
          <div key={color} className="flex items-center gap-2">
            <StudentBadge color={color}>{color}</StudentBadge>
          </div>
        ),
      )}
    </div>
  ),
};

// Combined Example
export const ActivityListItem: Story = {
  render: () => (
    <div className="flex items-center justify-between p-3 bg-white border rounded-lg max-w-md">
      <div>
        <span className="font-medium">Math Worksheet</span>
        <div className="flex gap-2 mt-1">
          <StudentBadge color="fuchsia" size="sm">
            Emma
          </StudentBadge>
          <Badge variant="default" size="sm">
            45 min
          </Badge>
        </div>
      </div>
      <Badge variant="success" dot>
        Done
      </Badge>
    </div>
  ),
};
