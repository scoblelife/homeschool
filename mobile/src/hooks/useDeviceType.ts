/**
 * Device Type Detection Hook
 *
 * Detects whether the device is a phone or tablet, and provides
 * responsive breakpoints for layout decisions.
 */

import { useState, useEffect } from 'react'
import { Dimensions, ScaledSize, Platform } from 'react-native'

export type DeviceType = 'phone' | 'tablet'
export type Orientation = 'portrait' | 'landscape'

export interface DeviceInfo {
  type: DeviceType
  orientation: Orientation
  width: number
  height: number
  isTablet: boolean
  isPhone: boolean
  isLandscape: boolean
  isPortrait: boolean
  // Responsive breakpoints
  isSmall: boolean // < 380px width (small phones)
  isMedium: boolean // 380-767px width (normal phones)
  isLarge: boolean // 768-1023px width (tablets portrait, large phones landscape)
  isXLarge: boolean // >= 1024px width (tablets landscape)
  // Layout helpers
  shouldUseSidebar: boolean // Use sidebar navigation instead of bottom tabs
  shouldUseMasterDetail: boolean // Use master-detail layout for list screens
  contentMaxWidth: number // Max width for content containers
  columns: 1 | 2 | 3 | 4 // Suggested grid columns
}

const TABLET_BREAKPOINT = 768
const SIDEBAR_BREAKPOINT = 768
const MASTER_DETAIL_BREAKPOINT = 1024

function getDeviceType(width: number, height: number): DeviceType {
  // Use the larger dimension to determine device type
  // (handles both orientations)
  const maxDimension = Math.max(width, height)
  const minDimension = Math.min(width, height)

  // iPad Mini is ~768x1024, regular iPads are larger
  // Android tablets typically start at 600dp width
  // We use 768 as a conservative tablet threshold
  if (minDimension >= 600 || maxDimension >= TABLET_BREAKPOINT) {
    return 'tablet'
  }

  return 'phone'
}

function getOrientation(width: number, height: number): Orientation {
  return width > height ? 'landscape' : 'portrait'
}

function getBreakpoints(width: number) {
  return {
    isSmall: width < 380,
    isMedium: width >= 380 && width < 768,
    isLarge: width >= 768 && width < 1024,
    isXLarge: width >= 1024,
  }
}

function getLayoutInfo(
  width: number,
  height: number,
  type: DeviceType,
  orientation: Orientation
): Pick<DeviceInfo, 'shouldUseSidebar' | 'shouldUseMasterDetail' | 'contentMaxWidth' | 'columns'> {
  const isLandscapeTablet = type === 'tablet' && orientation === 'landscape'
  const isPortraitTablet = type === 'tablet' && orientation === 'portrait'

  return {
    // Use sidebar on tablets (both orientations) or landscape large phones
    shouldUseSidebar: width >= SIDEBAR_BREAKPOINT,

    // Use master-detail on landscape tablets
    shouldUseMasterDetail: width >= MASTER_DETAIL_BREAKPOINT,

    // Content max width (prevent overly wide content on large screens)
    contentMaxWidth: isLandscapeTablet ? 1200 : isPortraitTablet ? 900 : width,

    // Grid columns based on width
    columns: width >= 1024 ? 4 : width >= 768 ? 3 : width >= 600 ? 2 : 1,
  }
}

function computeDeviceInfo(dimensions: ScaledSize): DeviceInfo {
  const { width, height } = dimensions
  const type = getDeviceType(width, height)
  const orientation = getOrientation(width, height)
  const breakpoints = getBreakpoints(width)
  const layoutInfo = getLayoutInfo(width, height, type, orientation)

  return {
    type,
    orientation,
    width,
    height,
    isTablet: type === 'tablet',
    isPhone: type === 'phone',
    isLandscape: orientation === 'landscape',
    isPortrait: orientation === 'portrait',
    ...breakpoints,
    ...layoutInfo,
  }
}

/**
 * Hook to detect device type and provide responsive layout information.
 *
 * Usage:
 * ```tsx
 * const { isTablet, shouldUseSidebar, columns } = useDeviceType()
 *
 * if (shouldUseSidebar) {
 *   return <SidebarLayout />
 * }
 * return <BottomTabLayout />
 * ```
 */
export function useDeviceType(): DeviceInfo {
  const [deviceInfo, setDeviceInfo] = useState<DeviceInfo>(() =>
    computeDeviceInfo(Dimensions.get('window'))
  )

  useEffect(() => {
    const subscription = Dimensions.addEventListener('change', ({ window }) => {
      setDeviceInfo(computeDeviceInfo(window))
    })

    return () => subscription.remove()
  }, [])

  return deviceInfo
}

/**
 * Get current device info without subscribing to changes.
 * Useful for one-time checks or when you don't need reactive updates.
 */
export function getDeviceInfo(): DeviceInfo {
  return computeDeviceInfo(Dimensions.get('window'))
}
