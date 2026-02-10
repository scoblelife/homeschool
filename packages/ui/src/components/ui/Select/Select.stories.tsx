import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";
import { Select } from "./Select";

const meta: Meta<typeof Select> = {
  title: "UI/Select",
  component: Select,
  tags: ["autodocs"],
  argTypes: {
    disabled: {
      control: "boolean",
    },
    error: {
      control: "boolean",
    },
  },
};

export default meta;
type Story = StoryObj<typeof Select>;

// Sample data
const fruitOptions = [
  { value: "apple", label: "Apple" },
  { value: "banana", label: "Banana" },
  { value: "orange", label: "Orange" },
  { value: "grape", label: "Grape" },
  { value: "watermelon", label: "Watermelon" },
];

const gradeOptions = [
  { value: "pre-k", label: "Pre-K" },
  { value: "kindergarten", label: "Kindergarten" },
  { value: "1st", label: "1st Grade" },
  { value: "2nd", label: "2nd Grade" },
  { value: "3rd", label: "3rd Grade" },
];

// Default Select
export const Default: Story = {
  render: () => {
    const [value, setValue] = useState("");
    return (
      <Select
        value={value}
        onChange={setValue}
        options={fruitOptions}
        placeholder="Choose a fruit..."
      />
    );
  },
};

// With Label
export const WithLabel: Story = {
  render: () => {
    const [value, setValue] = useState("");
    return (
      <Select
        value={value}
        onChange={setValue}
        options={fruitOptions}
        label="Favorite Fruit"
        placeholder="Select your favorite..."
      />
    );
  },
};

// With Selected Value
export const WithValue: Story = {
  render: () => {
    const [value, setValue] = useState("banana");
    return (
      <Select
        value={value}
        onChange={setValue}
        options={fruitOptions}
        label="Selected Fruit"
      />
    );
  },
};

// Disabled
export const Disabled: Story = {
  render: () => {
    const [value, setValue] = useState("apple");
    return (
      <Select
        value={value}
        onChange={setValue}
        options={fruitOptions}
        label="Disabled Select"
        disabled
      />
    );
  },
};

// Error State
export const ErrorState: Story = {
  render: () => {
    const [value, setValue] = useState("");
    return (
      <Select
        value={value}
        onChange={setValue}
        options={fruitOptions}
        label="Grade Level"
        error
        errorMessage="Please select a grade level"
      />
    );
  },
};

// With Many Options
export const ManyOptions: Story = {
  render: () => {
    const [value, setValue] = useState("");
    const manyOptions = Array.from({ length: 20 }, (_, i) => ({
      value: `option-${i}`,
      label: `Option ${i + 1}`,
    }));

    return (
      <Select
        value={value}
        onChange={setValue}
        options={manyOptions}
        label="Many Options (scrollable)"
        placeholder="Select an option..."
      />
    );
  },
};

// Practical Example: Grade Selection
export const GradeSelection: Story = {
  render: () => {
    const [value, setValue] = useState("1st");
    return (
      <div className="space-y-4">
        <Select
          value={value}
          onChange={setValue}
          options={gradeOptions}
          label="Student Grade Level"
          placeholder="Select grade..."
        />
        <p className="text-sm text-neutral-textSecondary">
          Selected: <span className="font-medium">{value || "None"}</span>
        </p>
      </div>
    );
  },
};

// Multiple Selects Example
export const MultipleSelects: Story = {
  render: () => {
    const [student, setStudent] = useState("");
    const [subject, setSubject] = useState("");

    const studentOptions = [
      { value: "emma", label: "Emma" },
      { value: "jackson", label: "Jackson" },
    ];

    const subjectOptions = [
      { value: "math", label: "Mathematics" },
      { value: "reading", label: "Reading" },
      { value: "science", label: "Science" },
      { value: "art", label: "Art" },
    ];

    return (
      <div className="space-y-4 max-w-sm">
        <Select
          value={student}
          onChange={setStudent}
          options={studentOptions}
          label="Student"
          placeholder="Choose student..."
        />
        <Select
          value={subject}
          onChange={setSubject}
          options={subjectOptions}
          label="Subject"
          placeholder="Choose subject..."
        />
        <div className="p-4 bg-neutral-surface border border-neutral-border rounded-lg">
          <p className="text-sm text-neutral-textSecondary">
            {student && subject
              ? `Logging activity for ${student} in ${subject}`
              : "Select both student and subject"}
          </p>
        </div>
      </div>
    );
  },
};
