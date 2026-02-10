/**
 * Push Notifications Module
 *
 * Handles local notifications for:
 * - Daily activity reminders
 * - Streak warning notifications
 * - Other scheduled reminders
 */

import * as Notifications from "expo-notifications";
import AsyncStorage from "@react-native-async-storage/async-storage";

// Storage keys
const STORAGE_KEYS = {
  ENABLED: "@homeschool/notifications_enabled",
  REMINDER_TIME: "@homeschool/reminder_time",
  STREAK_WARNINGS: "@homeschool/streak_warnings_enabled",
};

// Default reminder time (6:00 PM)
const DEFAULT_REMINDER_HOUR = 18;
const DEFAULT_REMINDER_MINUTE = 0;

// Notification IDs
const NOTIFICATION_IDS = {
  DAILY_REMINDER: "daily-reminder",
  STREAK_WARNING: "streak-warning",
};

interface NotificationSettings {
  enabled: boolean;
  reminderHour: number;
  reminderMinute: number;
  streakWarningsEnabled: boolean;
}

class NotificationsManager {
  private initialized = false;

  async initialize(): Promise<void> {
    if (this.initialized) return;

    // Configure notification handler
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
        shouldShowBanner: true,
        shouldShowList: true,
      }),
    });

    this.initialized = true;
  }

  /**
   * Request notification permissions
   */
  async requestPermissions(): Promise<boolean> {
    const { status: existingStatus } =
      await Notifications.getPermissionsAsync();

    if (existingStatus === "granted") {
      return true;
    }

    const { status } = await Notifications.requestPermissionsAsync();
    return status === "granted";
  }

  /**
   * Check if notifications are permitted
   */
  async hasPermissions(): Promise<boolean> {
    const { status } = await Notifications.getPermissionsAsync();
    return status === "granted";
  }

  /**
   * Get current notification settings
   */
  async getSettings(): Promise<NotificationSettings> {
    const [enabled, reminderTime, streakWarnings] = await Promise.all([
      AsyncStorage.getItem(STORAGE_KEYS.ENABLED),
      AsyncStorage.getItem(STORAGE_KEYS.REMINDER_TIME),
      AsyncStorage.getItem(STORAGE_KEYS.STREAK_WARNINGS),
    ]);

    const [hour, minute] = reminderTime
      ? reminderTime.split(":").map(Number)
      : [DEFAULT_REMINDER_HOUR, DEFAULT_REMINDER_MINUTE];

    return {
      enabled: enabled !== "false", // Default to enabled
      reminderHour: hour,
      reminderMinute: minute,
      streakWarningsEnabled: streakWarnings !== "false", // Default to enabled
    };
  }

  /**
   * Update notification settings
   */
  async updateSettings(settings: Partial<NotificationSettings>): Promise<void> {
    if (settings.enabled !== undefined) {
      await AsyncStorage.setItem(
        STORAGE_KEYS.ENABLED,
        String(settings.enabled),
      );
    }

    if (
      settings.reminderHour !== undefined &&
      settings.reminderMinute !== undefined
    ) {
      await AsyncStorage.setItem(
        STORAGE_KEYS.REMINDER_TIME,
        `${settings.reminderHour}:${settings.reminderMinute}`,
      );
    }

    if (settings.streakWarningsEnabled !== undefined) {
      await AsyncStorage.setItem(
        STORAGE_KEYS.STREAK_WARNINGS,
        String(settings.streakWarningsEnabled),
      );
    }

    // Reschedule notifications with new settings
    await this.scheduleAllNotifications();
  }

  /**
   * Schedule the daily activity reminder
   */
  async scheduleDailyReminder(): Promise<void> {
    const settings = await this.getSettings();

    if (!settings.enabled) {
      await this.cancelDailyReminder();
      return;
    }

    const hasPermission = await this.hasPermissions();
    if (!hasPermission) {
      return;
    }

    // Cancel existing reminder first
    await this.cancelDailyReminder();

    // Schedule gentle nudge reminder
    await Notifications.scheduleNotificationAsync({
      content: {
        title: "Quick check-in",
        body: "Anything to log today? Even a few minutes counts!",
        sound: true,
        priority: Notifications.AndroidNotificationPriority.DEFAULT,
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour: settings.reminderHour,
        minute: settings.reminderMinute,
      },
      identifier: NOTIFICATION_IDS.DAILY_REMINDER,
    });
  }

  /**
   * Cancel the daily reminder
   */
  async cancelDailyReminder(): Promise<void> {
    await Notifications.cancelScheduledNotificationAsync(
      NOTIFICATION_IDS.DAILY_REMINDER,
    );
  }

  /**
   * Schedule a streak warning notification
   */
  async scheduleStreakWarning(streakDays: number): Promise<void> {
    const settings = await this.getSettings();

    if (!settings.enabled || !settings.streakWarningsEnabled) {
      return;
    }

    const hasPermission = await this.hasPermissions();
    if (!hasPermission) {
      return;
    }

    // Cancel existing warning first
    await this.cancelStreakWarning();

    // Schedule warning for 8 PM (if daily reminder is before that)
    const warningHour = Math.max(settings.reminderHour + 2, 20);

    await Notifications.scheduleNotificationAsync({
      content: {
        title: `Keep your ${streakDays}-day streak!`,
        body: "Log an activity today to maintain your streak.",
        sound: true,
        priority: Notifications.AndroidNotificationPriority.HIGH,
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour: warningHour,
        minute: 0,
      },
      identifier: NOTIFICATION_IDS.STREAK_WARNING,
    });
  }

  /**
   * Cancel the streak warning
   */
  async cancelStreakWarning(): Promise<void> {
    await Notifications.cancelScheduledNotificationAsync(
      NOTIFICATION_IDS.STREAK_WARNING,
    );
  }

  /**
   * Schedule all notifications based on current settings
   */
  async scheduleAllNotifications(): Promise<void> {
    await this.scheduleDailyReminder();
    // Streak warning is scheduled dynamically based on current streak
  }

  /**
   * Cancel all scheduled notifications
   */
  async cancelAllNotifications(): Promise<void> {
    await Notifications.cancelAllScheduledNotificationsAsync();
  }

  /**
   * Get all scheduled notifications (for debugging)
   */
  async getScheduledNotifications(): Promise<
    Notifications.NotificationRequest[]
  > {
    return Notifications.getAllScheduledNotificationsAsync();
  }

  /**
   * Send a positive end-of-day summary notification
   */
  async sendDailySummary(activityCount: number): Promise<void> {
    const settings = await this.getSettings();
    if (!settings.enabled) return;

    const hasPermission = await this.hasPermissions();
    if (!hasPermission) return;

    if (activityCount > 0) {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: `Great day! ${activityCount} ${activityCount === 1 ? "activity" : "activities"} logged`,
          body: "Keep up the good work. Every bit of learning counts!",
          sound: true,
        },
        trigger: null, // Immediate
      });
    }
  }

  /**
   * Send an immediate notification (for testing)
   */
  async sendTestNotification(): Promise<void> {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: "Test Notification",
        body: "Notifications are working correctly!",
        sound: true,
      },
      trigger: null, // Immediate
    });
  }
}

// Singleton instance
export const notifications = new NotificationsManager();

// Hook for React components
export function useNotifications() {
  return {
    initialize: notifications.initialize.bind(notifications),
    requestPermissions: notifications.requestPermissions.bind(notifications),
    hasPermissions: notifications.hasPermissions.bind(notifications),
    getSettings: notifications.getSettings.bind(notifications),
    updateSettings: notifications.updateSettings.bind(notifications),
    scheduleDailyReminder:
      notifications.scheduleDailyReminder.bind(notifications),
    scheduleStreakWarning:
      notifications.scheduleStreakWarning.bind(notifications),
    cancelAllNotifications:
      notifications.cancelAllNotifications.bind(notifications),
    sendDailySummary: notifications.sendDailySummary.bind(notifications),
    sendTestNotification:
      notifications.sendTestNotification.bind(notifications),
  };
}
