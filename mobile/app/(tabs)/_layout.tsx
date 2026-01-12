import { Tabs } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { useDeviceType } from '../../src/hooks/useDeviceType'

export default function TabLayout() {
  const { isTablet, isLandscape } = useDeviceType()

  // Tablet-specific styling
  const tabBarHeight = isTablet ? 64 : 50
  const iconSize = isTablet ? 26 : 24
  const labelFontSize = isTablet ? 12 : 10

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#d946ef',
        tabBarInactiveTintColor: '#9ca3af',
        tabBarStyle: {
          backgroundColor: '#fff',
          borderTopColor: '#e5e7eb',
          height: tabBarHeight,
          paddingBottom: isTablet ? 8 : 4,
          paddingTop: isTablet ? 8 : 4,
        },
        tabBarLabelStyle: {
          fontSize: labelFontSize,
        },
        headerStyle: {
          backgroundColor: '#fff',
          // Larger header on tablets
          ...(isTablet && { height: 64 }),
        },
        headerTintColor: '#1f2937',
        headerTitleStyle: {
          fontWeight: '600',
          fontSize: isTablet ? 20 : 17,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Dashboard',
          tabBarIcon: ({ color, size }) => <Ionicons name="home" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="activities"
        options={{
          title: 'Activities',
          tabBarIcon: ({ color, size }) => <Ionicons name="list" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="library"
        options={{
          title: 'Library',
          tabBarIcon: ({ color, size }) => <Ionicons name="book" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="milestones"
        options={{
          title: 'Milestones',
          tabBarIcon: ({ color, size }) => <Ionicons name="flag" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="planner"
        options={{
          title: 'Planner',
          tabBarIcon: ({ color, size }) => <Ionicons name="clipboard" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="calendar"
        options={{
          title: 'Calendar',
          tabBarIcon: ({ color, size }) => <Ionicons name="calendar" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="field-trips"
        options={{
          title: 'Events',
          tabBarIcon: ({ color, size }) => <Ionicons name="map" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="reports"
        options={{
          title: 'Reports',
          tabBarIcon: ({ color, size }) => <Ionicons name="bar-chart" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="sync"
        options={{
          title: 'Sync',
          headerShown: false,
          tabBarIcon: ({ color, size }) => <Ionicons name="sync" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: ({ color, size }) => <Ionicons name="settings" size={size} color={color} />,
        }}
      />
    </Tabs>
  )
}
