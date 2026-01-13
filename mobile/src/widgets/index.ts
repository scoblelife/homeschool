import { Platform, NativeModules } from 'react-native';

/**
 * Widget data that can be displayed in iOS widgets
 */
export interface WidgetData {
  activitiesLogged: number;
  streakDays: number;
  timerActive: boolean;
  timerSubject?: string;
  timerMinutes: number;
}

/**
 * iOS Widget Integration
 *
 * Uses App Groups (group.com.scoblelife.homeschool) to share data
 * between the main app and widget extensions.
 */

// For Expo, we'll use expo-shared-preferences or implement a native module
// For now, we'll use a placeholder that works with the existing async-storage

let SharedGroupPreferences: {
  setItem: (key: string, value: string, group: string) => Promise<void>;
  getItem: (key: string, group: string) => Promise<string | null>;
} | null = null;

// Try to load native module if available
try {
  SharedGroupPreferences = NativeModules.SharedGroupPreferences;
} catch {
  // Module not available
}

const APP_GROUP = 'group.com.scoblelife.homeschool';

/**
 * Update widget data for iOS and Android widgets
 * iOS: Data is shared via App Groups and read by the widget extension
 * Android: Data is stored in SharedPreferences and read by widget providers
 */
export async function updateWidgetData(data: Partial<WidgetData>): Promise<void> {
  if (Platform.OS === 'ios') {
    await updateWidgetDataIOS(data);
  } else if (Platform.OS === 'android') {
    await updateWidgetDataAndroid(data);
  }
}

async function updateWidgetDataIOS(data: Partial<WidgetData>): Promise<void> {
  if (!SharedGroupPreferences) {
    console.log('[Widgets] Native module not available, using fallback storage');
    return;
  }

  try {
    if (data.activitiesLogged !== undefined) {
      await SharedGroupPreferences.setItem(
        'activitiesLogged',
        String(data.activitiesLogged),
        APP_GROUP
      );
    }

    if (data.streakDays !== undefined) {
      await SharedGroupPreferences.setItem(
        'streakDays',
        String(data.streakDays),
        APP_GROUP
      );
    }

    if (data.timerActive !== undefined) {
      await SharedGroupPreferences.setItem(
        'timerActive',
        data.timerActive ? '1' : '0',
        APP_GROUP
      );
    }

    if (data.timerSubject !== undefined) {
      await SharedGroupPreferences.setItem(
        'timerSubject',
        data.timerSubject || '',
        APP_GROUP
      );
    }

    if (data.timerMinutes !== undefined) {
      await SharedGroupPreferences.setItem(
        'timerMinutes',
        String(data.timerMinutes),
        APP_GROUP
      );
    }

    await reloadWidgets();
  } catch (error) {
    console.error('[Widgets] Failed to update iOS widget data:', error);
  }
}

async function updateWidgetDataAndroid(data: Partial<WidgetData>): Promise<void> {
  try {
    const WidgetModule = NativeModules.WidgetModule;
    if (!WidgetModule) {
      console.log('[Widgets] Android widget module not available');
      return;
    }

    if (data.activitiesLogged !== undefined) {
      await WidgetModule.updateActivitiesLogged(data.activitiesLogged);
    }

    if (data.streakDays !== undefined) {
      await WidgetModule.updateStreakDays(data.streakDays);
    }

    if (data.timerActive !== undefined || data.timerSubject !== undefined || data.timerMinutes !== undefined) {
      await WidgetModule.updateTimerStatus(
        data.timerActive ?? false,
        data.timerSubject ?? null,
        data.timerMinutes ?? 0
      );
    }
  } catch (error) {
    console.error('[Widgets] Failed to update Android widget data:', error);
  }
}

/**
 * Request iOS to reload all widgets
 * This triggers the widgets to fetch fresh data
 */
export async function reloadWidgets(): Promise<void> {
  if (Platform.OS !== 'ios') {
    return;
  }

  try {
    // WidgetKit.reloadAllTimelines() would be called here
    // For now, the widget will refresh on its 15-minute schedule
    const WidgetModule = NativeModules.WidgetModule;
    if (WidgetModule?.reloadAllTimelines) {
      await WidgetModule.reloadAllTimelines();
    }
  } catch (error) {
    // Widget module might not be available
    console.log('[Widgets] Widget reload not available');
  }
}

/**
 * Update activity count for today
 * Call this whenever an activity is logged
 */
export async function updateActivityCount(count: number): Promise<void> {
  await updateWidgetData({ activitiesLogged: count });
}

/**
 * Update streak count
 * Call this when the streak changes
 */
export async function updateStreakCount(days: number): Promise<void> {
  await updateWidgetData({ streakDays: days });
}

/**
 * Update timer status
 * Call this when timer starts/stops or updates
 */
export async function updateTimerStatus(
  active: boolean,
  subject?: string,
  minutes?: number
): Promise<void> {
  await updateWidgetData({
    timerActive: active,
    timerSubject: subject,
    timerMinutes: minutes ?? 0,
  });
}
