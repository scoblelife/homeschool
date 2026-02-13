import { Tabs } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { useDeviceType } from '../../src/hooks/useDeviceType'
import { useColors } from '../../src/theme/ThemeContext'

export default function TabLayout() {
  const { isTablet } = useDeviceType()
  const colors = useColors()

  const tabBarHeight = isTablet ? 64 : 62
  const labelFontSize = isTablet ? 12 : 10

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textTertiary,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          height: tabBarHeight,
          paddingBottom: isTablet ? 8 : 16,
          paddingTop: isTablet ? 8 : 4,
        },
        tabBarLabelStyle: {
          fontSize: labelFontSize,
        },
        headerStyle: {
          backgroundColor: colors.surface,
          ...(isTablet && { height: 64 }),
        },
        headerTintColor: colors.text,
        headerTitleStyle: {
          fontWeight: '600',
          fontSize: isTablet ? 20 : 17,
        },
      }}
    >
      {/* === 4 VISIBLE TABS === */}
      <Tabs.Screen
        name="index"
        options={{
          title: 'Today',
          tabBarIcon: ({ color, size }) => <Ionicons name="sunny" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="log"
        options={{
          title: 'Log',
          tabBarIcon: ({ color, size }) => <Ionicons name="add-circle" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="progress"
        options={{
          title: 'Progress',
          tabBarIcon: ({ color, size }) => <Ionicons name="trending-up" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="more"
        options={{
          title: 'More',
          tabBarIcon: ({ color, size }) => <Ionicons name="grid" size={size} color={color} />,
        }}
      />

      {/* === HIDDEN TABS (accessible via More screen stack navigation) === */}
      <Tabs.Screen
        name="activities"
        options={{
          href: null, // Hide from tab bar
          title: 'Activities',
        }}
      />
      <Tabs.Screen
        name="library"
        options={{
          href: null,
          title: 'Library',
        }}
      />
      <Tabs.Screen
        name="milestones"
        options={{
          href: null,
          title: 'Milestones',
        }}
      />
      <Tabs.Screen
        name="planner"
        options={{
          href: null,
          title: 'Planner',
        }}
      />
      <Tabs.Screen
        name="calendar"
        options={{
          href: null,
          title: 'Calendar',
        }}
      />
      <Tabs.Screen
        name="field-trips"
        options={{
          href: null,
          title: 'Events',
        }}
      />
      <Tabs.Screen
        name="reports"
        options={{
          href: null,
          title: 'Reports',
        }}
      />
      <Tabs.Screen
        name="sync"
        options={{
          href: null,
          title: 'Sync',
          headerShown: false,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          href: null,
          title: 'Settings',
        }}
      />
    </Tabs>
  )
}
