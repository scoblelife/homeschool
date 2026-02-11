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

function useMenuItems(): MenuItem[] {
  const colors = useColors()
  return [
    {
      title: 'Calendar',
      description: 'Monthly view of activities and events',
      icon: 'calendar',
      route: '/(tabs)/calendar',
      color: colors.studentBlue,
    },
    {
      title: 'Events & Field Trips',
      description: 'Plan and track outings and events',
      icon: 'map',
      route: '/(tabs)/field-trips',
      color: colors.warning,
    },
    {
      title: 'Activities',
      description: 'Browse and manage all logged activities',
      icon: 'list',
      route: '/(tabs)/activities',
      color: colors.success,
    },
    {
      title: 'Library',
      description: 'Track books and reading progress',
      icon: 'book',
      route: '/(tabs)/library',
      color: colors.studentPurple,
    },
    {
      title: 'Milestones',
      description: 'View and manage learning milestones',
      icon: 'flag',
      route: '/(tabs)/milestones',
      color: colors.studentFuchsia,
    },
    {
      title: 'Weekly Planner',
      description: 'Plan milestones for the week',
      icon: 'clipboard',
      route: '/(tabs)/planner',
      color: colors.studentTeal,
    },
    {
      title: 'Reports',
      description: 'Detailed activity reports and analytics',
      icon: 'bar-chart',
      route: '/(tabs)/reports',
      color: colors.studentPurple,
    },
    {
      title: 'Sync',
      description: 'Family sync across devices',
      icon: 'sync',
      route: '/(tabs)/sync',
      color: colors.studentTeal,
    },
    {
      title: 'Settings',
      description: 'Manage students and preferences',
      icon: 'settings',
      route: '/(tabs)/settings',
      color: colors.textSecondary,
    },
  ]
}

export default function MoreScreen() {
  const router = useRouter()
  const colors = useColors()
  const menuItems = useMenuItems()

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={{ padding: 16 }}>
        {menuItems.map((item) => (
          <TouchableOpacity
            key={item.route}
            onPress={() => router.push(item.route as any)}
            activeOpacity={0.7}
            accessibilityLabel={`${item.title}: ${item.description}`}
            accessibilityRole="button"
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              backgroundColor: colors.surface,
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
              <Text style={{ fontSize: 15, fontWeight: '600', color: colors.text }}>{item.title}</Text>
              <Text style={{ fontSize: 13, color: colors.textSecondary, marginTop: 1 }}>{item.description}</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.border} />
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  )
}
