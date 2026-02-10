import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";
import { RadioGroup } from "./Radio";

const meta: Meta<typeof RadioGroup> = {
  title: "UI/Radio",
  component: RadioGroup,
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof RadioGroup>;

// Default Radio Group
export const Default: Story = {
  render: () => {
    const [value, setValue] = useState("option1");
    return (
      <RadioGroup
        name="default"
        value={value}
        onChange={setValue}
        options={[
          { value: "option1", label: "Option 1" },
          { value: "option2", label: "Option 2" },
          { value: "option3", label: "Option 3" },
        ]}
      />
    );
  },
};

// With Label
export const WithLabel: Story = {
  render: () => {
    const [value, setValue] = useState("small");
    return (
      <RadioGroup
        name="size"
        label="Choose a size"
        value={value}
        onChange={setValue}
        options={[
          { value: "small", label: "Small" },
          { value: "medium", label: "Medium" },
          { value: "large", label: "Large" },
        ]}
      />
    );
  },
};

// With Helper Text
export const WithHelperText: Story = {
  render: () => {
    const [value, setValue] = useState("standard");
    return (
      <RadioGroup
        name="shipping"
        label="Shipping method"
        value={value}
        onChange={setValue}
        options={[
          {
            value: "standard",
            label: "Standard shipping",
            helperText: "5-7 business days",
          },
          {
            value: "express",
            label: "Express shipping",
            helperText: "2-3 business days",
          },
          {
            value: "overnight",
            label: "Overnight shipping",
            helperText: "Next business day",
          },
        ]}
      />
    );
  },
};

// With Disabled Option
export const WithDisabledOption: Story = {
  render: () => {
    const [value, setValue] = useState("available1");
    return (
      <RadioGroup
        name="availability"
        label="Select an option"
        value={value}
        onChange={setValue}
        options={[
          { value: "available1", label: "Available option" },
          { value: "unavailable", label: "Unavailable option", disabled: true },
          { value: "available2", label: "Another available option" },
        ]}
      />
    );
  },
};

// Error State
export const ErrorState: Story = {
  render: () => {
    const [value, setValue] = useState("");
    return (
      <RadioGroup
        name="required"
        label="Required selection"
        value={value}
        onChange={setValue}
        error
        errorMessage="Please select an option"
        options={[
          { value: "option1", label: "Option 1" },
          { value: "option2", label: "Option 2" },
        ]}
      />
    );
  },
};

// Grade Level Example
export const GradeLevelSelection: Story = {
  render: () => {
    const [grade, setGrade] = useState("1st");
    return (
      <div className="max-w-sm">
        <RadioGroup
          name="grade"
          label="Student Grade Level"
          value={grade}
          onChange={setGrade}
          options={[
            { value: "pre-k", label: "Pre-K", helperText: "Ages 3-4" },
            {
              value: "kindergarten",
              label: "Kindergarten",
              helperText: "Ages 5-6",
            },
            { value: "1st", label: "1st Grade", helperText: "Ages 6-7" },
            { value: "2nd", label: "2nd Grade", helperText: "Ages 7-8" },
          ]}
        />
        <div className="mt-4 p-3 bg-brand-primaryLight border border-brand-primary rounded-lg text-sm text-brand-primary">
          Selected: <span className="font-medium">{grade}</span>
        </div>
      </div>
    );
  },
};
