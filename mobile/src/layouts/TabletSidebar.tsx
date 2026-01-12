/**
 * Tablet Sidebar Navigation
 *
 * Provides a sidebar navigation for tablets, showing all tabs
 * in a vertical list instead of bottom tabs.
 */

import React from 'react'
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useRouter, usePathname } from 'expo-router'

interface NavItem {
  name: string
  href: string
  icon: keyof typeof Ionicons.glyphMap
  label: string
}

const navItems: NavItem[] = [
  { name: 'index', href: '/', icon: 'home', label: 'Dashboard' },
  { name: 'activities', href: '/activities', icon: 'list', label: 'Activities' },
  { name: 'library', href: '/library', icon: 'book', label: 'Library' },
  { name: 'milestones', href: '/milestones', icon: 'flag', label: 'Milestones' },
  { name: 'planner', href: '/planner', icon: 'clipboard', label: 'Planner' },
  { name: 'calendar', href: '/calendar', icon: 'calendar', label: 'Calendar' },
  { name: 'field-trips', href: '/field-trips', icon: 'map', label: 'Events' },
  { name: 'reports', href: '/reports', icon: 'bar-chart', label: 'Reports' },
  { name: 'sync', href: '/sync', icon: 'sync', label: 'Sync' },
  { name: 'settings', href: '/settings', icon: 'settings', label: 'Settings' },
]

interface TabletSidebarProps {
  children: React.ReactNode
  /** Width of the sidebar (default: 220) */
  width?: number
  /** Whether the sidebar is collapsed (icons only) */
  collapsed?: boolean
}

export function TabletSidebar({
  children,
  width = 220,
  collapsed = false,
}: TabletSidebarProps) {
  const router = useRouter()
  const pathname = usePathname()

  const effectiveWidth = collapsed ? 72 : width

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/' || pathname === ''
    return pathname.startsWith(href)
  }

  return (
    <View style={styles.container}>
      {/* Sidebar */}
      <View style={[styles.sidebar, { width: effectiveWidth }]}>
        {/* App Title */}
        <View style={styles.header}>
          {!collapsed && (
            <Text style={styles.title}>Homeschool</Text>
          )}
          {collapsed && (
            <Ionicons name="school" size={28} color="#d946ef" />
          )}
        </View>

        {/* Navigation Items */}
        <ScrollView style={styles.nav} showsVerticalScrollIndicator={false}>
          {navItems.map((item) => {
            const active = isActive(item.href)
            return (
              <TouchableOpacity
                key={item.name}
                style={[
                  styles.navItem,
                  active && styles.navItemActive,
                  collapsed && styles.navItemCollapsed,
                ]}
                onPress={() => router.push(item.href as any)}
                accessibilityRole="button"
                accessibilityLabel={item.label}
                accessibilityState={{ selected: active }}
              >
                <Ionicons
                  name={item.icon}
                  size={22}
                  color={active ? '#d946ef' : '#6b7280'}
                />
                {!collapsed && (
                  <Text
                    style={[
                      styles.navLabel,
                      active && styles.navLabelActive,
                    ]}
                  >
                    {item.label}
                  </Text>
                )}
              </TouchableOpacity>
            )
          })}
        </ScrollView>
      </View>

      {/* Main Content */}
      <View style={styles.content}>{children}</View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'row',
  },
  sidebar: {
    backgroundColor: '#ffffff',
    borderRightWidth: 1,
    borderRightColor: '#e5e7eb',
  },
  header: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    alignItems: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1f2937',
  },
  nav: {
    flex: 1,
    paddingVertical: 8,
  },
  navItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginHorizontal: 8,
    marginVertical: 2,
    borderRadius: 8,
  },
  navItemActive: {
    backgroundColor: '#fdf4ff',
  },
  navItemCollapsed: {
    justifyContent: 'center',
    paddingHorizontal: 0,
  },
  navLabel: {
    marginLeft: 12,
    fontSize: 15,
    color: '#6b7280',
    fontWeight: '500',
  },
  navLabelActive: {
    color: '#d946ef',
    fontWeight: '600',
  },
  content: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
})
