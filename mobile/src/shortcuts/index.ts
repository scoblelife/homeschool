import { Platform, NativeModules, Linking } from 'react-native';

/**
 * Shortcut types for voice commands
 */
export type ShortcutType = 'log_activity' | 'start_timer' | 'view_today';

export interface Shortcut {
  id: ShortcutType;
  title: string;
  phrase: string;
  description: string;
}

/**
 * Available shortcuts
 */
export const SHORTCUTS: Shortcut[] = [
  {
    id: 'log_activity',
    title: 'Log Activity',
    phrase: 'Log learning activity',
    description: 'Open Homeschool to log a new learning activity',
  },
  {
    id: 'start_timer',
    title: 'Start Timer',
    phrase: 'Start learning timer',
    description: 'Start a timer for a learning session',
  },
  {
    id: 'view_today',
    title: 'View Today',
    phrase: 'Show today\'s learning',
    description: 'View activities logged today',
  },
];

/**
 * Register platform-specific shortcuts for the app.
 *
 * On iOS this donates Siri Shortcuts so the system can surface voice and prediction suggestions; on Android this relies on declarative App Actions configuration (Play Console / shortcuts.xml).
 */
export async function registerShortcuts(): Promise<void> {
  if (Platform.OS === 'ios') {
    await registerShortcutsIOS();
  } else if (Platform.OS === 'android') {
    await registerShortcutsAndroid();
  }
}

/**
 * Donates the app's predefined voice shortcuts to Siri on iOS.
 *
 * Attempts to obtain the native SiriShortcuts module and donate each entry from `SHORTCUTS`.
 * If the native module is unavailable the function returns without throwing; failures during donation are caught and logged.
 */
async function registerShortcutsIOS(): Promise<void> {
  try {
    const SiriShortcutsModule = NativeModules.SiriShortcutsModule;
    if (!SiriShortcutsModule) {
      console.log('[Shortcuts] SiriShortcutsModule not available');
      return;
    }

    for (const shortcut of SHORTCUTS) {
      await SiriShortcutsModule.donateShortcut({
        activityType: `com.scoblelife.homeschool.${shortcut.id}`,
        title: shortcut.title,
        suggestedPhrase: shortcut.phrase,
        userInfo: { action: shortcut.id },
        isEligibleForSearch: true,
        isEligibleForPrediction: true,
      });
    }

    console.log('[Shortcuts] Registered iOS shortcuts');
  } catch (error) {
    console.error('[Shortcuts] Failed to register iOS shortcuts:', error);
  }
}

/**
 * No-op placeholder for registering Android shortcuts; Android App Actions are configured declaratively.
 *
 * Performs no runtime registration because Android App Actions are set up via the Play Console and shortcuts.xml.
 */
async function registerShortcutsAndroid(): Promise<void> {
  // Android App Actions are configured in the Play Console
  // and linked to the app via shortcuts.xml
  // The setup is declarative, not programmatic
  console.log('[Shortcuts] Android App Actions configured declaratively');
}

/**
 * Determine which app shortcut is represented by the given deep link URL.
 *
 * @returns `'log_activity'` for log deep links, `'start_timer'` for timer deep links, `'view_today'` for today/home deep links, or `null` if the URL does not match a known shortcut.
 */
export function parseShortcutFromURL(url: string): ShortcutType | null {
  if (url.includes('homeschool://log')) {
    return 'log_activity';
  } else if (url.includes('homeschool://timer')) {
    return 'start_timer';
  } else if (url.includes('homeschool://today') || url.includes('homeschool://')) {
    return 'view_today';
  }
  return null;
}

/**
 * Subscribes to app deep-link events and invokes the callback when a recognized shortcut URL is received.
 *
 * @param onShortcut - Callback invoked with the detected `ShortcutType` when a shortcut URL is handled
 * @returns A function that removes the URL event subscription when called
 */
export function setupShortcutListener(
  onShortcut: (type: ShortcutType) => void
): () => void {
  // Check initial URL
  Linking.getInitialURL().then((url) => {
    if (url) {
      const shortcut = parseShortcutFromURL(url);
      if (shortcut) {
        onShortcut(shortcut);
      }
    }
  });

  // Listen for URL events
  const subscription = Linking.addEventListener('url', ({ url }) => {
    const shortcut = parseShortcutFromURL(url);
    if (shortcut) {
      onShortcut(shortcut);
    }
  });

  return () => {
    subscription.remove();
  };
}

/**
 * Presents the Siri Shortcuts setup UI for the specified shortcut on iOS.
 *
 * Attempts to invoke the native Siri Shortcuts configuration UI for the shortcut identified by `shortcutId`.
 *
 * @param shortcutId - The shortcut identifier to configure.
 * @returns `true` if the setup UI was presented successfully, `false` otherwise.
 */
export async function presentShortcutSetup(shortcutId: ShortcutType): Promise<boolean> {
  if (Platform.OS !== 'ios') {
    return false;
  }

  try {
    const SiriShortcutsModule = NativeModules.SiriShortcutsModule;
    if (!SiriShortcutsModule?.presentShortcutSetup) {
      console.log('[Shortcuts] presentShortcutSetup not available');
      return false;
    }

    const shortcut = SHORTCUTS.find((s) => s.id === shortcutId);
    if (!shortcut) {
      return false;
    }

    await SiriShortcutsModule.presentShortcutSetup({
      activityType: `com.scoblelife.homeschool.${shortcut.id}`,
      title: shortcut.title,
      suggestedPhrase: shortcut.phrase,
    });

    return true;
  } catch (error) {
    console.error('[Shortcuts] Failed to present shortcut setup:', error);
    return false;
  }
}