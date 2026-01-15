import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";
import { Checkbox } from "./Checkbox";

const meta: Meta<typeof Checkbox> = {
  title: "UI/Checkbox",
  component: Checkbox,
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
type Story = StoryObj<typeof Checkbox>;

// Default Checkbox
export const Default: Story = {
  render: () => {
    const [checked, setChecked] = useState(false);
    return (
      <Checkbox
        checked={checked}
        onChange={(e) => setChecked(e.target.checked)}
      />
    );
  },
};

// With Label
export const WithLabel: Story = {
  render: () => {
    const [checked, setChecked] = useState(false);
    return (
      <Checkbox
        label="Accept terms and conditions"
        checked={checked}
        onChange={(e) => setChecked(e.target.checked)}
      />
    );
  },
};

// With Helper Text
export const WithHelperText: Story = {
  render: () => {
    const [checked, setChecked] = useState(false);
    return (
      <Checkbox
        label="Email notifications"
        helperText="Receive email updates about your student's progress"
        checked={checked}
        onChange={(e) => setChecked(e.target.checked)}
      />
    );
  },
};

// Checked State
export const Checked: Story = {
  render: () => {
    const [checked, setChecked] = useState(true);
    return (
      <Checkbox
        label="Already checked"
        checked={checked}
        onChange={(e) => setChecked(e.target.checked)}
      />
    );
  },
};

// Disabled
export const Disabled: Story = {
  render: () => {
    return (
      <div className="space-y-3">
        <Checkbox label="Disabled unchecked" disabled />
        <Checkbox label="Disabled checked" checked disabled />
      </div>
    );
  },
};

// Error State
export const ErrorState: Story = {
  render: () => {
    const [checked, setChecked] = useState(false);
    return (
      <Checkbox
        label="I agree to the terms"
        checked={checked}
        onChange={(e) => setChecked(e.target.checked)}
        error
        errorMessage="You must accept the terms to continue"
      />
    );
  },
};

// Multiple Checkboxes
export const MultipleCheckboxes: Story = {
  render: () => {
    const [prefs, setPrefs] = useState({
      email: true,
      sms: false,
      push: true,
    });

    return (
      <div className="space-y-4">
        <h3 className="font-medium text-neutral-text">
          Notification Preferences
        </h3>
        <div className="space-y-3">
          <Checkbox
            label="Email notifications"
            helperText="Receive updates via email"
            checked={prefs.email}
            onChange={(e) => setPrefs({ ...prefs, email: e.target.checked })}
          />
          <Checkbox
            label="SMS notifications"
            helperText="Receive text message updates"
            checked={prefs.sms}
            onChange={(e) => setPrefs({ ...prefs, sms: e.target.checked })}
          />
          <Checkbox
            label="Push notifications"
            helperText="Receive in-app notifications"
            checked={prefs.push}
            onChange={(e) => setPrefs({ ...prefs, push: e.target.checked })}
          />
        </div>
        <div className="p-3 bg-neutral-surface border border-neutral-border rounded-lg text-sm text-neutral-textSecondary">
          Selected:{" "}
          {Object.entries(prefs)
            .filter(([, v]) => v)
            .map(([k]) => k)
            .join(", ") || "None"}
        </div>
      </div>
    );
  },
};

// Subject Selection Example
export const SubjectSelection: Story = {
  render: () => {
    const [subjects, setSubjects] = useState({
      math: true,
      reading: true,
      science: false,
      art: false,
      music: false,
    });

    const handleChange = (subject: keyof typeof subjects) => {
      setSubjects({ ...subjects, [subject]: !subjects[subject] });
    };

    return (
      <div className="max-w-sm space-y-4">
        <h3 className="font-medium text-neutral-text">Today's Subjects</h3>
        <div className="space-y-2">
          <Checkbox
            label="Mathematics"
            checked={subjects.math}
            onChange={() => handleChange("math")}
          />
          <Checkbox
            label="Reading"
            checked={subjects.reading}
            onChange={() => handleChange("reading")}
          />
          <Checkbox
            label="Science"
            checked={subjects.science}
            onChange={() => handleChange("science")}
          />
          <Checkbox
            label="Art"
            checked={subjects.art}
            onChange={() => handleChange("art")}
          />
          <Checkbox
            label="Music"
            checked={subjects.music}
            onChange={() => handleChange("music")}
          />
        </div>
        <div className="p-3 bg-brand-primaryLight border border-brand-primary rounded-lg text-sm">
          <span className="font-medium text-brand-primary">
            {Object.values(subjects).filter(Boolean).length} subjects selected
          </span>
        </div>
      </div>
    );
  },
};
