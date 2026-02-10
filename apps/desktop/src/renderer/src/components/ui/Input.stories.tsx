import type { Meta, StoryObj } from "@storybook/react";
import { Input, Textarea, Label, FormField } from "./Input";

// Input Stories
const inputMeta: Meta<typeof Input> = {
  title: "UI/Input",
  component: Input,
  tags: ["autodocs"],
  argTypes: {
    size: {
      control: "select",
      options: ["sm", "md", "lg"],
    },
    error: {
      control: "boolean",
    },
    disabled: {
      control: "boolean",
    },
    placeholder: {
      control: "text",
    },
  },
};

export default inputMeta;
type InputStory = StoryObj<typeof Input>;

// Default Input
export const Default: InputStory = {
  args: {
    placeholder: "Enter text...",
  },
};

// Sizes
export const Small: InputStory = {
  args: {
    placeholder: "Small input",
    size: "sm",
  },
};

export const Medium: InputStory = {
  args: {
    placeholder: "Medium input",
    size: "md",
  },
};

export const Large: InputStory = {
  args: {
    placeholder: "Large input",
    size: "lg",
  },
};

// States
export const WithValue: InputStory = {
  args: {
    defaultValue: "Emma Smith",
  },
};

export const Disabled: InputStory = {
  args: {
    placeholder: "Disabled input",
    disabled: true,
  },
};

export const ErrorState: InputStory = {
  args: {
    defaultValue: "Invalid email",
    error: true,
  },
};

// With Icons
const SearchIcon = () => (
  <svg
    className="w-4 h-4"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
    />
  </svg>
);

const MailIcon = () => (
  <svg
    className="w-4 h-4"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
    />
  </svg>
);

export const WithLeftIcon: InputStory = {
  args: {
    placeholder: "Search activities...",
    leftIcon: <SearchIcon />,
  },
};

export const WithRightIcon: InputStory = {
  args: {
    placeholder: "Enter email",
    rightIcon: <MailIcon />,
  },
};

export const WithBothIcons: InputStory = {
  args: {
    placeholder: "Search...",
    leftIcon: <SearchIcon />,
    rightIcon: (
      <svg
        className="w-4 h-4"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M6 18L18 6M6 6l12 12"
        />
      </svg>
    ),
  },
};

// Input Types
export const TypeEmail: InputStory = {
  args: {
    type: "email",
    placeholder: "email@example.com",
  },
};

export const TypePassword: InputStory = {
  args: {
    type: "password",
    placeholder: "Enter password",
    defaultValue: "secretpassword",
  },
};

export const TypeNumber: InputStory = {
  args: {
    type: "number",
    placeholder: "Enter duration (minutes)",
  },
};

// All Sizes Grid
export const AllSizes: InputStory = {
  render: () => (
    <div className="space-y-4 max-w-sm">
      <Input size="sm" placeholder="Small" />
      <Input size="md" placeholder="Medium" />
      <Input size="lg" placeholder="Large" />
    </div>
  ),
};

// Textarea Stories
export const TextareaDefault: InputStory = {
  render: () => (
    <Textarea placeholder="Enter activity description..." rows={4} />
  ),
};

export const TextareaWithValue: InputStory = {
  render: () => (
    <Textarea
      defaultValue="We read Charlotte's Web together and discussed the themes of friendship and loyalty. Emma particularly enjoyed the chapter where Charlotte saves Wilbur."
      rows={4}
    />
  ),
};

export const TextareaError: InputStory = {
  render: () => <Textarea placeholder="Enter description" error rows={3} />,
};

// Label Stories
export const LabelDefault: InputStory = {
  render: () => (
    <div>
      <Label htmlFor="name">Student Name</Label>
      <Input id="name" placeholder="Enter name" />
    </div>
  ),
};

export const LabelRequired: InputStory = {
  render: () => (
    <div>
      <Label htmlFor="email" required>
        Email Address
      </Label>
      <Input id="email" type="email" placeholder="email@example.com" />
    </div>
  ),
};

// FormField Stories
export const FormFieldDefault: InputStory = {
  render: () => (
    <FormField label="Activity Name" htmlFor="activity">
      <Input id="activity" placeholder="Enter activity name" />
    </FormField>
  ),
};

export const FormFieldRequired: InputStory = {
  render: () => (
    <FormField label="Duration" htmlFor="duration" required>
      <Input id="duration" type="number" placeholder="Minutes" />
    </FormField>
  ),
};

export const FormFieldWithHint: InputStory = {
  render: () => (
    <FormField
      label="Notes"
      htmlFor="notes"
      hint="Optional additional details about the activity"
    >
      <Textarea id="notes" placeholder="Enter notes..." rows={3} />
    </FormField>
  ),
};

export const FormFieldWithError: InputStory = {
  render: () => (
    <FormField
      label="Email"
      htmlFor="email"
      required
      error="Please enter a valid email address"
    >
      <Input id="email" type="email" error defaultValue="invalid-email" />
    </FormField>
  ),
};

// Complete Form Example
export const CompleteForm: InputStory = {
  render: () => (
    <form className="space-y-4 max-w-md">
      <FormField label="Student Name" htmlFor="student" required>
        <Input id="student" placeholder="Enter student name" />
      </FormField>
      <FormField label="Subject" htmlFor="subject" required>
        <Input id="subject" placeholder="e.g., Math, Reading, Science" />
      </FormField>
      <FormField label="Duration (minutes)" htmlFor="duration" required>
        <Input id="duration" type="number" placeholder="30" />
      </FormField>
      <FormField
        label="Description"
        htmlFor="desc"
        hint="Describe what was learned"
      >
        <Textarea id="desc" placeholder="Activity details..." rows={3} />
      </FormField>
    </form>
  ),
  parameters: {
    layout: "padded",
  },
};
