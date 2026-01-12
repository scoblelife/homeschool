/**
 * Haptic Feedback Module
 *
 * Provides haptic feedback for various user interactions.
 * Uses platform-native haptics (Taptic Engine on iOS, vibration on Android).
 */

import * as Haptics from 'expo-haptics'
import { Platform } from 'react-native'

/**
 * Light feedback for subtle interactions
 * (button taps, selection changes)
 */
export function lightFeedback(): void {
  if (Platform.OS === 'ios') {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
  } else {
    Haptics.selectionAsync()
  }
}

/**
 * Medium feedback for more significant interactions
 * (completing an action, confirming a choice)
 */
export function mediumFeedback(): void {
  if (Platform.OS === 'ios') {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
  } else {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
  }
}

/**
 * Heavy feedback for important actions
 * (completing a major task, timer start/stop)
 */
export function heavyFeedback(): void {
  if (Platform.OS === 'ios') {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy)
  } else {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy)
  }
}

/**
 * Success feedback for completed actions
 * (activity logged, milestone completed, streak achieved)
 */
export function successFeedback(): void {
  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
}

/**
 * Warning feedback for important notices
 * (streak about to break, approaching deadline)
 */
export function warningFeedback(): void {
  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning)
}

/**
 * Error feedback for failures
 * (action failed, validation error)
 */
export function errorFeedback(): void {
  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error)
}

/**
 * Selection feedback for list selections
 * (selecting items in a list, picker changes)
 */
export function selectionFeedback(): void {
  Haptics.selectionAsync()
}

// Named exports for common scenarios
export const haptics = {
  light: lightFeedback,
  medium: mediumFeedback,
  heavy: heavyFeedback,
  success: successFeedback,
  warning: warningFeedback,
  error: errorFeedback,
  selection: selectionFeedback,

  // Semantic aliases
  buttonPress: lightFeedback,
  toggle: lightFeedback,
  activityLogged: successFeedback,
  milestoneCompleted: successFeedback,
  streakAchieved: heavyFeedback,
  timerStart: mediumFeedback,
  timerStop: heavyFeedback,
}

export default haptics
