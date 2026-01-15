import { Platform, NativeModules, Linking } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Shared content received from other apps via Share Extension (iOS)
 * or Share Intent (Android)
 */
export interface SharedContent {
  text?: string;
  imageUri?: string;
  timestamp: number;
}

const APP_GROUP = 'group.com.scoblelife.homeschool';

/**
 * Check if there is pending shared content from the share extension
 * Call this when the app launches or becomes active
 */
export async function checkForSharedContent(): Promise<SharedContent | null> {
  try {
    if (Platform.OS === 'ios') {
      return await checkForSharedContentIOS();
    } else if (Platform.OS === 'android') {
      return await checkForSharedContentAndroid();
    }
    return null;
  } catch (error) {
    console.error('[Share] Failed to check for shared content:', error);
    return null;
  }
}

async function checkForSharedContentIOS(): Promise<SharedContent | null> {
  try {
    const SharedGroupPreferences = NativeModules.SharedGroupPreferences;
    if (!SharedGroupPreferences) {
      console.log('[Share] SharedGroupPreferences not available');
      return null;
    }

    const hasContent = await SharedGroupPreferences.getItem('hasSharedContent', APP_GROUP);
    if (hasContent !== '1' && hasContent !== 'true') {
      return null;
    }

    const text = await SharedGroupPreferences.getItem('sharedText', APP_GROUP);
    const timestamp = await SharedGroupPreferences.getItem('sharedContentTimestamp', APP_GROUP);

    // Note: Image data would need a separate native module to handle Data -> file path conversion
    // For now, we just handle text

    // Clear the shared content
    await SharedGroupPreferences.setItem('hasSharedContent', '0', APP_GROUP);
    await SharedGroupPreferences.setItem('sharedText', '', APP_GROUP);

    return {
      text: text || undefined,
      timestamp: timestamp ? parseFloat(timestamp) * 1000 : Date.now(),
    };
  } catch (error) {
    console.error('[Share] Failed to check iOS shared content:', error);
    return null;
  }
}

async function checkForSharedContentAndroid(): Promise<SharedContent | null> {
  try {
    // On Android, we use AsyncStorage since SharedPreferences with a specific name
    // isn't directly accessible from JS. The ShareActivity should save to a known location.

    // For a production app, you'd create a native module to read from "SharedContent" prefs
    // For now, we'll use a workaround with a bridge module

    const ShareModule = NativeModules.ShareModule;
    if (ShareModule?.getSharedContent) {
      const content = await ShareModule.getSharedContent();
      if (content?.hasSharedContent) {
        // Clear after reading
        await ShareModule.clearSharedContent();
        return {
          text: content.text || undefined,
          imageUri: content.imagePath || undefined,
          timestamp: content.timestamp || Date.now(),
        };
      }
    }

    return null;
  } catch (error) {
    console.error('[Share] Failed to check Android shared content:', error);
    return null;
  }
}

/**
 * Clear any pending shared content
 */
export async function clearSharedContent(): Promise<void> {
  try {
    if (Platform.OS === 'ios') {
      const SharedGroupPreferences = NativeModules.SharedGroupPreferences;
      if (SharedGroupPreferences) {
        await SharedGroupPreferences.setItem('hasSharedContent', '0', APP_GROUP);
        await SharedGroupPreferences.setItem('sharedText', '', APP_GROUP);
        await SharedGroupPreferences.setItem('sharedImageData', '', APP_GROUP);
      }
    } else if (Platform.OS === 'android') {
      const ShareModule = NativeModules.ShareModule;
      if (ShareModule?.clearSharedContent) {
        await ShareModule.clearSharedContent();
      }
    }
  } catch (error) {
    console.error('[Share] Failed to clear shared content:', error);
  }
}

/**
 * Handle deep link from share extension
 * Returns true if this was a share deep link
 */
export async function handleShareDeepLink(url: string): Promise<boolean> {
  if (url.includes('homeschool://share')) {
    // The share extension opened the app
    // The calling code should then call checkForSharedContent()
    return true;
  }
  return false;
}

/**
 * Set up listener for share deep links
 */
export function setupShareListener(
  onShareReceived: (content: SharedContent) => void
): () => void {
  // Initial URL check
  Linking.getInitialURL().then((url) => {
    if (url && url.includes('homeschool://share')) {
      checkForSharedContent().then((content) => {
        if (content) {
          onShareReceived(content);
        }
      });
    }
  });

  // Listen for URL events
  const subscription = Linking.addEventListener('url', async ({ url }) => {
    if (url.includes('homeschool://share')) {
      const content = await checkForSharedContent();
      if (content) {
        onShareReceived(content);
      }
    }
  });

  // Return cleanup function
  return () => {
    subscription.remove();
  };
}
