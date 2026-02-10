import type { Meta, StoryObj } from "@storybook/react";
import { Alert } from "./Alert";

const meta = {
  title: "UI/Alert",
  component: Alert,
  parameters: {
    layout: "padded",
  },
  tags: ["autodocs"],
} satisfies Meta<typeof Alert>;

export default meta;
type Story = StoryObj<typeof meta>;

// Icons
const SuccessIcon = (
  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
    <path
      fillRule="evenodd"
      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
      clipRule="evenodd"
    />
  </svg>
);

const WarningIcon = (
  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
    <path
      fillRule="evenodd"
      d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
      clipRule="evenodd"
    />
  </svg>
);

const ErrorIcon = (
  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
    <path
      fillRule="evenodd"
      d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
      clipRule="evenodd"
    />
  </svg>
);

const InfoIcon = (
  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
    <path
      fillRule="evenodd"
      d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
      clipRule="evenodd"
    />
  </svg>
);

export const SuccessSubtle: Story = {
  args: {
    variant: "success",
    style: "subtle",
    icon: SuccessIcon,
    children: "Activity logged successfully! 3 stars earned.",
  },
};

export const SuccessOutlined: Story = {
  args: {
    variant: "success",
    style: "outlined",
    icon: SuccessIcon,
    children: "Student profile updated.",
  },
};

export const SuccessFilled: Story = {
  args: {
    variant: "success",
    style: "filled",
    icon: SuccessIcon,
    children: "Milestone completed! Great progress.",
  },
};

export const WarningSubtle: Story = {
  args: {
    variant: "warning",
    style: "subtle",
    icon: WarningIcon,
    children: "Some activities have no grade recorded.",
  },
};

export const WarningWithTitle: Story = {
  args: {
    variant: "warning",
    style: "subtle",
    icon: WarningIcon,
    title: "Incomplete Data",
    children:
      "Please add subject information to all activities for accurate reporting.",
  },
};

export const ErrorSubtle: Story = {
  args: {
    variant: "error",
    style: "subtle",
    icon: ErrorIcon,
    children: "Failed to save activity. Please try again.",
  },
};

export const ErrorFilled: Story = {
  args: {
    variant: "error",
    style: "filled",
    icon: ErrorIcon,
    title: "Error",
    children:
      "Unable to connect to sync server. Changes will be saved locally.",
  },
};

export const InfoSubtle: Story = {
  args: {
    variant: "info",
    style: "subtle",
    icon: InfoIcon,
    children: "Nevada requires minimal homeschool reporting documentation.",
  },
};

export const InfoWithTitle: Story = {
  args: {
    variant: "info",
    style: "subtle",
    icon: InfoIcon,
    title: "Tip",
    children: "You can use the Quick Add button to log activities faster.",
  },
};

export const Dismissible: Story = {
  args: {
    variant: "info",
    style: "subtle",
    icon: InfoIcon,
    title: "New Feature",
    children:
      "Try the new field trip planner to organize upcoming educational events.",
    dismissible: true,
    onDismiss: () => alert("Alert dismissed"),
  },
};

export const WithoutIcon: Story = {
  args: {
    variant: "success",
    style: "subtle",
    children: "This alert has no icon.",
  },
};

export const AllVariantsSubtle = {
  render: () => (
    <div className="space-y-4">
      <Alert variant="success" style="subtle" icon={SuccessIcon}>
        Success message
      </Alert>
      <Alert variant="warning" style="subtle" icon={WarningIcon}>
        Warning message
      </Alert>
      <Alert variant="error" style="subtle" icon={ErrorIcon}>
        Error message
      </Alert>
      <Alert variant="info" style="subtle" icon={InfoIcon}>
        Info message
      </Alert>
      <Alert variant="default" style="subtle">
        Default message
      </Alert>
    </div>
  ),
};

export const AllStyles = {
  render: () => (
    <div className="space-y-4">
      <Alert variant="success" style="subtle" icon={SuccessIcon}>
        Subtle style
      </Alert>
      <Alert variant="success" style="outlined" icon={SuccessIcon}>
        Outlined style
      </Alert>
      <Alert variant="success" style="filled" icon={SuccessIcon}>
        Filled style
      </Alert>
    </div>
  ),
};

export const LongContent: Story = {
  args: {
    variant: "info",
    style: "subtle",
    icon: InfoIcon,
    title: "Important Information",
    children:
      "This is a longer alert message that demonstrates how the component handles multiple lines of text. The content wraps naturally and maintains good readability. You can include detailed explanations or instructions here without breaking the layout.",
  },
};
