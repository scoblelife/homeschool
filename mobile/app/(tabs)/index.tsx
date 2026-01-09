import { useEffect, useState, useCallback } from 'react'
import { View, Text, ScrollView, TouchableOpacity, RefreshControl } from 'react-native'
import { format, startOfWeek } from 'date-fns'
import { useStore } from '../../src/stores/useStore'
import {
  getActivities,
  getSuggestedMilestones,
  getStudentStarTotals,
  getActiveFamilyGoal,
  getFamilyTotalStars,
  getUpcomingFieldTrips,
} from '../../src/database'
import type { Activity, Milestone, FamilyGoal, FieldTrip } from '../../src/types'
import { StudentSelector } from '../../src/components/StudentSelector'
import { ActivityCard } from '../../src/components/ActivityCard'
import { MilestoneCard } from '../../src/components/MilestoneCard'
import { FieldTripCard } from '../../src/components/FieldTripCard'
import { StarDisplay } from '../../src/components/StarDisplay'

export default function Dashboard() {
  const { selectedStudentId, getSelectedStudent, getSubjectById, students } = useStore()
  const [recentActivities, setRecentActivities] = useState<Activity[]>([])
  const [suggestedMilestones, setSuggestedMilestones] = useState<Milestone[]>([])
  const [starTotals, setStarTotals] = useState({ weeklyTotal: 0, allTimeTotal: 0 })
  const [familyGoal, setFamilyGoal] = useState<FamilyGoal | null>(null)
  const [familyStars, setFamilyStars] = useState(0)
  const [upcomingTrips, setUpcomingTrips] = useState<FieldTrip[]>([])
  const [refreshing, setRefreshing] = useState(false)

  const selectedStudent = getSelectedStudent()

  const loadData = useCallback(async () => {
    if (!selectedStudentId) return

    try {
      const today = format(new Date(), 'yyyy-MM-dd')

      const [activities, milestones, stars, goal, totalStars, trips] = await Promise.all([
        getActivities({ studentId: selectedStudentId, startDate: today, endDate: today }),
        getSuggestedMilestones(selectedStudentId, 3),
        getStudentStarTotals(selectedStudentId),
        getActiveFamilyGoal(),
        getFamilyTotalStars(),
        getUpcomingFieldTrips(selectedStudentId, 3),
      ])

      setRecentActivities(activities.slice(0, 5))
      setSuggestedMilestones(milestones)
      setStarTotals(stars)
      setFamilyGoal(goal)
      setFamilyStars(totalStars)
      setUpcomingTrips(trips)
    } catch (err) {
      console.error('Failed to load dashboard data:', err)
    }
  }, [selectedStudentId])

  useEffect(() => {
    loadData()
  }, [loadData])

  const onRefresh = useCallback(async () => {
    setRefreshing(true)
    await loadData()
    setRefreshing(false)
  }, [loadData])

  if (students.length === 0) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
        <Text style={{ fontSize: 18, color: '#6b7280', textAlign: 'center' }}>
          No students yet. Add a student in Settings to get started.
        </Text>
      </View>
    )
  }

  const studentColor = selectedStudent?.color === 'child2' ? '#14b8a6' : '#d946ef'

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: '#f9fafb' }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={studentColor} />}
    >
      <View style={{ padding: 16 }}>
        {/* Student Selector */}
        <StudentSelector />

        {/* Stars Section */}
        <View style={{ marginTop: 16, backgroundColor: '#fff', borderRadius: 12, padding: 16, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 }}>
          <Text style={{ fontSize: 16, fontWeight: '600', color: '#1f2937', marginBottom: 12 }}>Stars Earned</Text>
          <StarDisplay weeklyStars={starTotals.weeklyTotal} totalStars={starTotals.allTimeTotal} color={studentColor} />
        </View>

        {/* Family Goal */}
        {familyGoal && (
          <View style={{ marginTop: 16, backgroundColor: '#fff', borderRadius: 12, padding: 16, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 }}>
            <Text style={{ fontSize: 16, fontWeight: '600', color: '#1f2937', marginBottom: 8 }}>Family Goal</Text>
            <Text style={{ fontSize: 14, color: '#6b7280' }}>{familyGoal.title}</Text>
            <View style={{ marginTop: 8 }}>
              <View style={{ height: 8, backgroundColor: '#e5e7eb', borderRadius: 4, overflow: 'hidden' }}>
                <View
                  style={{
                    height: '100%',
                    backgroundColor: '#10b981',
                    borderRadius: 4,
                    width: `${Math.min((familyStars / familyGoal.starTarget) * 100, 100)}%`,
                  }}
                />
              </View>
              <Text style={{ fontSize: 12, color: '#6b7280', marginTop: 4 }}>
                {familyStars} / {familyGoal.starTarget} stars
              </Text>
            </View>
            {familyGoal.rewardDescription && (
              <Text style={{ fontSize: 12, color: '#9ca3af', marginTop: 4 }}>Reward: {familyGoal.rewardDescription}</Text>
            )}
          </View>
        )}

        {/* Today's Activities */}
        <View style={{ marginTop: 16 }}>
          <Text style={{ fontSize: 16, fontWeight: '600', color: '#1f2937', marginBottom: 12 }}>Today's Activities</Text>
          {recentActivities.length === 0 ? (
            <View style={{ backgroundColor: '#fff', borderRadius: 12, padding: 16, alignItems: 'center' }}>
              <Text style={{ color: '#9ca3af' }}>No activities logged today</Text>
            </View>
          ) : (
            recentActivities.map((activity) => (
              <ActivityCard
                key={activity.id}
                activity={activity}
                subject={getSubjectById(activity.subjectId)}
              />
            ))
          )}
        </View>

        {/* Suggested Milestones */}
        <View style={{ marginTop: 16 }}>
          <Text style={{ fontSize: 16, fontWeight: '600', color: '#1f2937', marginBottom: 12 }}>Focus On</Text>
          {suggestedMilestones.length === 0 ? (
            <View style={{ backgroundColor: '#fff', borderRadius: 12, padding: 16, alignItems: 'center' }}>
              <Text style={{ color: '#9ca3af' }}>No milestones to suggest</Text>
            </View>
          ) : (
            suggestedMilestones.map((milestone) => (
              <MilestoneCard
                key={milestone.id}
                milestone={milestone}
                subject={getSubjectById(milestone.subjectId)}
              />
            ))
          )}
        </View>

        {/* Upcoming Field Trips */}
        <View style={{ marginTop: 16, marginBottom: 24 }}>
          <Text style={{ fontSize: 16, fontWeight: '600', color: '#1f2937', marginBottom: 12 }}>Upcoming Events</Text>
          {upcomingTrips.length === 0 ? (
            <View style={{ backgroundColor: '#fff', borderRadius: 12, padding: 16, alignItems: 'center' }}>
              <Text style={{ color: '#9ca3af' }}>No upcoming events</Text>
            </View>
          ) : (
            upcomingTrips.map((trip) => <FieldTripCard key={trip.id} fieldTrip={trip} />)
          )}
        </View>
      </View>
    </ScrollView>
  )
}
