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
 * Detects any pending content delivered to the app by a share extension.
 *
 * If found, the function reads platform-specific pending share data (iOS/Android)
 * and may clear that pending data so it won't be returned again.
 *
 * @returns `SharedContent` if pending shared content was found, `null` otherwise.
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

/**
 * Checks the iOS app group shared storage for pending shared content and clears it if present.
 *
 * Only text content is returned; image data is not handled by this function. Returns `null` when no shared content is available or if an error occurs.
 *
 * @returns A `SharedContent` object with an optional `text` property and a `timestamp` expressed in milliseconds since the epoch if content was present; `null` otherwise.
 */
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

/**
 * Reads and returns any pending shared content provided by the Android native ShareModule.
 *
 * This will clear the pending shared content on the native side after successfully reading it.
 *
 * @returns A `SharedContent` object containing `text`, `imageUri`, and `timestamp` when pending content is found; `null` if no pending content exists or an error occurs.
 */
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
 * Determine whether an incoming deep link was issued by the share extension.
 *
 * @param url - The incoming deep link URL to inspect.
 * @returns `true` if the URL indicates the app was opened by the share extension (a share deep link), `false` otherwise.
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
 * Register a listener that invokes a callback when the app is opened via the share deep link.
 *
 * Also checks the initial launch URL so pending shared content is handled when the app starts.
 *
 * @param onShareReceived - Callback invoked with the detected `SharedContent` when a share deep link is handled
 * @returns A cleanup function that removes the URL event listener
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