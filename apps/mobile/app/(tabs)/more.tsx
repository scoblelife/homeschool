import { View, Text, ScrollView, TouchableOpacity } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useRouter } from 'expo-router'
import { useColors } from '../../src/theme/createStyles'

interface MenuItem {
  title: string
  description: string
  icon: keyof typeof Ionicons.glyphMap
  route: string
  color: string
}

const menuItems: MenuItem[] = [
  {
    title: 'Calendar',
    description: 'Monthly view of activities and events',
    icon: 'calendar',
    route: '/(tabs)/calendar',
    color: '#3b82f6',
  },
  {
    title: 'Events & Field Trips',
    description: 'Plan and track outings and events',
    icon: 'map',
    route: '/(tabs)/field-trips',
    color: '#f59e0b',
  },
  {
    title: 'Activities',
    description: 'Browse and manage all logged activities',
    icon: 'list',
    route: '/(tabs)/activities',
    color: '#10b981',
  },
  {
    title: 'Library',
    description: 'Track books and reading progress',
    icon: 'book',
    route: '/(tabs)/library',
    color: '#8b5cf6',
  },
  {
    title: 'Milestones',
    description: 'View and manage learning milestones',
    icon: 'flag',
    route: '/(tabs)/milestones',
    color: '#ec4899',
  },
  {
    title: 'Weekly Planner',
    description: 'Plan milestones for the week',
    icon: 'clipboard',
    route: '/(tabs)/planner',
    color: '#06b6d4',
  },
  {
    title: 'Reports',
    description: 'Detailed activity reports and analytics',
    icon: 'bar-chart',
    route: '/(tabs)/reports',
    color: '#6366f1',
  },
  {
    title: 'Sync',
    description: 'Family sync across devices',
    icon: 'sync',
    route: '/(tabs)/sync',
    color: '#14b8a6',
  },
  {
    title: 'Settings',
    description: 'Manage students and preferences',
    icon: 'settings',
    route: '/(tabs)/settings',
    color: '#6b7280',
  },
]

export default function MoreScreen() {
  const router = useRouter()
  const colors = useColors()

  return (
    <ScrollView style={{ flex: 1, backgroundColor: '#f9fafb' }}>
      <View style={{ padding: 16 }}>
        {menuItems.map((item, index) => (
          <TouchableOpacity
            key={item.route}
            onPress={() => router.push(item.route as any)}
            activeOpacity={0.7}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              backgroundColor: '#fff',
              borderRadius: 12,
              padding: 14,
              marginBottom: 8,
              shadowColor: '#000',
              shadowOpacity: 0.03,
              shadowRadius: 4,
              elevation: 1,
            }}
          >
            <View style={{
              width: 40,
              height: 40,
              borderRadius: 10,
              backgroundColor: item.color + '15',
              justifyContent: 'center',
              alignItems: 'center',
              marginRight: 14,
            }}>
              <Ionicons name={item.icon} size={20} color={item.color} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 15, fontWeight: '600', color: '#1f2937' }}>{item.title}</Text>
              <Text style={{ fontSize: 13, color: '#6b7280', marginTop: 1 }}>{item.description}</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#d1d5db" />
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  )
}
