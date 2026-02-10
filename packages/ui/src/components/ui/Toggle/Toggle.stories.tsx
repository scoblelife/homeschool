import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";
import { Toggle } from "./Toggle";

const meta: Meta<typeof Toggle> = {
  title: "UI/Toggle",
  component: Toggle,
  tags: ["autodocs"],
  argTypes: {
    size: {
      control: "select",
      options: ["sm", "md", "lg"],
    },
    disabled: {
      control: "boolean",
    },
  },
};

export default meta;
type Story = StoryObj<typeof Toggle>;

// Default Toggle
export const Default: Story = {
  render: () => {
    const [enabled, setEnabled] = useState(false);
    return <Toggle checked={enabled} onChange={setEnabled} />;
  },
};

// With Label
export const WithLabel: Story = {
  render: () => {
    const [enabled, setEnabled] = useState(true);
    return (
      <Toggle
        checked={enabled}
        onChange={setEnabled}
        label="Enable notifications"
      />
    );
  },
};

// With Helper Text
export const WithHelperText: Story = {
  render: () => {
    const [enabled, setEnabled] = useState(false);
    return (
      <Toggle
        checked={enabled}
        onChange={setEnabled}
        label="Email notifications"
        helperText="Receive daily summary emails about student progress"
      />
    );
  },
};

// Sizes
export const Sizes: Story = {
  render: () => {
    const [small, setSmall] = useState(true);
    const [medium, setMedium] = useState(true);
    const [large, setLarge] = useState(true);

    return (
      <div className="space-y-4">
        <Toggle
          size="sm"
          checked={small}
          onChange={setSmall}
          label="Small toggle"
        />
        <Toggle
          size="md"
          checked={medium}
          onChange={setMedium}
          label="Medium toggle (default)"
        />
        <Toggle
          size="lg"
          checked={large}
          onChange={setLarge}
          label="Large toggle"
        />
      </div>
    );
  },
};

// Disabled States
export const Disabled: Story = {
  render: () => {
    return (
      <div className="space-y-4">
        <Toggle
          checked={false}
          onChange={() => {}}
          label="Disabled off"
          disabled
        />
        <Toggle
          checked={true}
          onChange={() => {}}
          label="Disabled on"
          disabled
        />
      </div>
    );
  },
};

// Settings Panel Example
export const SettingsPanel: Story = {
  render: () => {
    const [settings, setSettings] = useState({
      notifications: true,
      autoSave: true,
      darkMode: false,
      analytics: false,
    });

    const updateSetting = (key: keyof typeof settings) => {
      setSettings({ ...settings, [key]: !settings[key] });
    };

    return (
      <div className="max-w-md space-y-6">
        <h3 className="font-medium text-neutral-text">Preferences</h3>
        <div className="space-y-4">
          <Toggle
            checked={settings.notifications}
            onChange={() => updateSetting("notifications")}
            label="Push notifications"
            helperText="Receive notifications about new activities"
          />
          <Toggle
            checked={settings.autoSave}
            onChange={() => updateSetting("autoSave")}
            label="Auto-save"
            helperText="Automatically save changes as you type"
          />
          <Toggle
            checked={settings.darkMode}
            onChange={() => updateSetting("darkMode")}
            label="Dark mode"
            helperText="Use dark theme throughout the app"
          />
          <Toggle
            checked={settings.analytics}
            onChange={() => updateSetting("analytics")}
            label="Usage analytics"
            helperText="Help improve the app by sharing anonymous usage data"
          />
        </div>
        <div className="p-3 bg-neutral-surface border border-neutral-border rounded-lg text-sm text-neutral-textSecondary">
          Active settings:{" "}
          {Object.entries(settings).filter(([, v]) => v).length} of{" "}
          {Object.keys(settings).length}
        </div>
      </div>
    );
  },
};

// Student Features Example
export const StudentFeatures: Story = {
  render: () => {
    const [features, setFeatures] = useState({
      stars: true,
      milestones: true,
      badges: false,
      leaderboard: false,
    });

    return (
      <div className="max-w-md space-y-6">
        <h3 className="font-medium text-neutral-text">Student Features</h3>
        <p className="text-sm text-neutral-textSecondary">
          Enable gamification features to motivate learning
        </p>
        <div className="space-y-4">
          <Toggle
            checked={features.stars}
            onChange={() =>
              setFeatures({ ...features, stars: !features.stars })
            }
            label="Star rewards"
            helperText="Award stars for completed activities"
          />
          <Toggle
            checked={features.milestones}
            onChange={() =>
              setFeatures({ ...features, milestones: !features.milestones })
            }
            label="Milestones"
            helperText="Track and celebrate achievement milestones"
          />
          <Toggle
            checked={features.badges}
            onChange={() =>
              setFeatures({ ...features, badges: !features.badges })
            }
            label="Achievement badges"
            helperText="Earn badges for reaching goals"
          />
          <Toggle
            checked={features.leaderboard}
            onChange={() =>
              setFeatures({ ...features, leaderboard: !features.leaderboard })
            }
            label="Family leaderboard"
            helperText="Compare progress with other family members"
          />
        </div>
      </div>
    );
  },
};
