/**
 * Theme Context
 *
 * Provides theme colors and dark mode toggle throughout the app.
 * Respects system preference with option for manual override.
 */

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { useColorScheme } from 'react-native'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { ColorTheme, lightColors, darkColors } from './colors'

type ThemeMode = 'system' | 'light' | 'dark'

interface ThemeContextType {
  colors: ColorTheme
  isDark: boolean
  themeMode: ThemeMode
  setThemeMode: (mode: ThemeMode) => void
}

const THEME_STORAGE_KEY = '@homeschool/theme_mode'

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

interface ThemeProviderProps {
  children: ReactNode
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  const systemColorScheme = useColorScheme()
  const [themeMode, setThemeModeState] = useState<ThemeMode>('system')
  const [isLoaded, setIsLoaded] = useState(false)

  // Load saved theme preference
  useEffect(() => {
    async function loadTheme() {
      try {
        const saved = await AsyncStorage.getItem(THEME_STORAGE_KEY)
        if (saved && (saved === 'system' || saved === 'light' || saved === 'dark')) {
          setThemeModeState(saved)
        }
      } catch (err) {
        console.error('[Theme] Failed to load theme:', err)
      } finally {
        setIsLoaded(true)
      }
    }
    loadTheme()
  }, [])

  // Save theme preference when changed
  const setThemeMode = async (mode: ThemeMode) => {
    setThemeModeState(mode)
    try {
      await AsyncStorage.setItem(THEME_STORAGE_KEY, mode)
    } catch (err) {
      console.error('[Theme] Failed to save theme:', err)
    }
  }

  // Determine if we should use dark mode
  const isDark =
    themeMode === 'dark' || (themeMode === 'system' && systemColorScheme === 'dark')

  const colors = isDark ? darkColors : lightColors

  const value: ThemeContextType = {
    colors,
    isDark,
    themeMode,
    setThemeMode,
  }

  // Don't render until theme is loaded to prevent flash
  if (!isLoaded) {
    return null
  }

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

/**
 * Hook to access theme colors and dark mode state
 */
export function useTheme(): ThemeContextType {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}

/**
 * Hook to get just the colors (convenience)
 */
export function useColors(): ColorTheme {
  return useTheme().colors
}
