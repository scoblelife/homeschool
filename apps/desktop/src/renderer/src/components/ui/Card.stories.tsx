import type { Meta, StoryObj } from "@storybook/react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "./Card";
import { Button } from "./Button";
import { Badge } from "./Badge";

const meta: Meta<typeof Card> = {
  title: "UI/Card",
  component: Card,
  tags: ["autodocs"],
  argTypes: {
    padding: {
      control: "select",
      options: ["none", "sm", "md", "lg"],
    },
    hover: {
      control: "boolean",
    },
    interactive: {
      control: "boolean",
    },
  },
};

export default meta;
type Story = StoryObj<typeof Card>;

// Default
export const Default: Story = {
  args: {
    children: (
      <div>
        <h3 className="font-semibold">Card Title</h3>
        <p className="text-gray-600 mt-2">Card content goes here.</p>
      </div>
    ),
  },
};

// With Header
export const WithHeader: Story = {
  render: () => (
    <Card>
      <CardHeader>
        <CardTitle>Session Summary</CardTitle>
        <CardDescription>Today's learning activities</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-gray-600">
          You've completed 3 activities today, totaling 2 hours of learning
          time.
        </p>
      </CardContent>
    </Card>
  ),
};

// With Footer
export const WithFooter: Story = {
  render: () => (
    <Card>
      <CardHeader>
        <CardTitle>Add New Activity</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-gray-600">
          Log a new learning activity for your student.
        </p>
      </CardContent>
      <CardFooter>
        <Button variant="primary" size="sm">
          Add Activity
        </Button>
        <Button variant="ghost" size="sm">
          Cancel
        </Button>
      </CardFooter>
    </Card>
  ),
};

// Padding Variants
export const PaddingNone: Story = {
  args: {
    padding: "none",
    children: (
      <div className="p-4 bg-fuchsia-50">Content with no card padding</div>
    ),
  },
};

export const PaddingSmall: Story = {
  args: {
    padding: "sm",
    children: <p>Small padding card</p>,
  },
};

export const PaddingLarge: Story = {
  args: {
    padding: "lg",
    children: <p>Large padding card</p>,
  },
};

// Interactive States
export const HoverEffect: Story = {
  args: {
    hover: true,
    children: <p>Hover over this card to see the shadow effect.</p>,
  },
};

export const Interactive: Story = {
  args: {
    interactive: true,
    children: <p>Click this card (it has cursor and press effects)</p>,
  },
};

// Student Card Example
export const StudentCard: Story = {
  render: () => (
    <Card hover className="max-w-sm">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Emma</CardTitle>
          <Badge variant="primary">1st Grade</Badge>
        </div>
        <CardDescription>6 years old</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Today's Activities</span>
            <span className="font-medium">4</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Total Hours</span>
            <span className="font-medium">2.5 hrs</span>
          </div>
        </div>
      </CardContent>
      <CardFooter>
        <Button variant="outline" size="sm" fullWidth>
          View Details
        </Button>
      </CardFooter>
    </Card>
  ),
};

// Activity Card Example
export const ActivityCard: Story = {
  render: () => (
    <Card className="max-w-md">
      <CardContent>
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-lg bg-fuchsia-100 flex items-center justify-center">
            <svg
              className="w-5 h-5 text-fuchsia-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
              />
            </svg>
          </div>
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <h4 className="font-medium text-gray-900">Reading Practice</h4>
              <span className="text-xs text-gray-500">10:30 AM</span>
            </div>
            <p className="text-sm text-gray-500 mt-1">
              Charlotte's Web - Chapter 3
            </p>
            <div className="flex items-center gap-2 mt-2">
              <Badge variant="success" size="sm">
                30 min
              </Badge>
              <Badge size="sm">English</Badge>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  ),
};

// Grid of Cards
export const CardGrid: Story = {
  render: () => (
    <div className="grid grid-cols-2 gap-4">
      {["Reading", "Math", "Science", "Art"].map((subject) => (
        <Card key={subject} hover interactive className="text-center">
          <CardContent>
            <h4 className="font-medium">{subject}</h4>
            <p className="text-sm text-gray-500 mt-1">3 activities</p>
          </CardContent>
        </Card>
      ))}
    </div>
  ),
  parameters: {
    layout: "padded",
  },
};
