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
 * Register shortcuts with the system
 * On iOS, this donates Siri Shortcuts
 * On Android, this would set up App Actions (requires Play Console configuration)
 */
export async function registerShortcuts(): Promise<void> {
  if (Platform.OS === 'ios') {
    await registerShortcutsIOS();
  } else if (Platform.OS === 'android') {
    await registerShortcutsAndroid();
  }
}

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

async function registerShortcutsAndroid(): Promise<void> {
  // Android App Actions are configured in the Play Console
  // and linked to the app via shortcuts.xml
  // The setup is declarative, not programmatic
  console.log('[Shortcuts] Android App Actions configured declaratively');
}

/**
 * Handle a shortcut being invoked
 * Returns the shortcut type if the URL is a shortcut deep link
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
 * Set up listener for shortcut invocations
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
 * Present Siri Shortcuts voice setup for a specific shortcut
 * iOS only
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
