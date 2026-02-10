import { useState, useRef } from 'react'
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  FlatList,
  TouchableOpacity,
  ViewToken,
} from 'react-native'
import { useRouter, Href } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

const { width } = Dimensions.get('window')

interface Slide {
  id: string
  title: string
  description: string
  emoji: string
}

const slides: Slide[] = [
  {
    id: '1',
    title: 'Welcome to Homeschool',
    description: 'The simplest way to track your homeschool journey. Log activities in seconds, not minutes.',
    emoji: '👋',
  },
  {
    id: '2',
    title: 'Log Learning Instantly',
    description: 'Quick-add activities with just a few taps. Track reading, math, science, art, and everything in between.',
    emoji: '📝',
  },
  {
    id: '3',
    title: 'Celebrate Progress',
    description: 'Watch streaks grow and earn badges. Visualize your educational journey with beautiful reports.',
    emoji: '🌟',
  },
  {
    id: '4',
    title: 'Stay Compliant',
    description: 'Generate attendance logs and portfolios that meet your state\'s requirements. Export anytime.',
    emoji: '📊',
  },
]

export default function OnboardingWelcome() {
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const [currentIndex, setCurrentIndex] = useState(0)
  const flatListRef = useRef<FlatList>(null)

  const handleViewableItemsChanged = useRef(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      if (viewableItems.length > 0 && viewableItems[0].index !== null) {
        setCurrentIndex(viewableItems[0].index)
      }
    }
  ).current

  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: 50,
  }).current

  const handleNext = () => {
    if (currentIndex < slides.length - 1) {
      flatListRef.current?.scrollToIndex({ index: currentIndex + 1 })
    } else {
      router.push('/onboarding/students' as Href)
    }
  }

  const handleSkip = () => {
    router.push('/onboarding/students' as Href)
  }

  const renderSlide = ({ item }: { item: Slide }) => (
    <View style={styles.slide} accessible accessibilityLabel={`${item.title}. ${item.description}`}>
      <Text style={styles.emoji} accessibilityElementsHidden>{item.emoji}</Text>
      <Text style={styles.title}>{item.title}</Text>
      <Text style={styles.description}>{item.description}</Text>
    </View>
  )

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.skipContainer}>
        {currentIndex < slides.length - 1 && (
          <TouchableOpacity
            onPress={handleSkip}
            accessibilityLabel="Skip onboarding"
            accessibilityRole="button"
          >
            <Text style={styles.skipText}>Skip</Text>
          </TouchableOpacity>
        )}
      </View>

      <FlatList
        ref={flatListRef}
        data={slides}
        renderItem={renderSlide}
        keyExtractor={(item) => item.id}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onViewableItemsChanged={handleViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        bounces={false}
      />

      <View style={[styles.footer, { paddingBottom: insets.bottom + 20 }]}>
        <View
          style={styles.pagination}
          accessible
          accessibilityLabel={`Slide ${currentIndex + 1} of ${slides.length}`}
          accessibilityRole="adjustable"
        >
          {slides.map((_, index) => (
            <View
              key={index}
              style={[
                styles.dot,
                index === currentIndex && styles.dotActive,
              ]}
            />
          ))}
        </View>

        <TouchableOpacity
          style={styles.button}
          onPress={handleNext}
          accessibilityLabel={currentIndex === slides.length - 1 ? 'Get Started' : 'Next slide'}
          accessibilityRole="button"
        >
          <Text style={styles.buttonText}>
            {currentIndex === slides.length - 1 ? 'Get Started' : 'Next'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  skipContainer: {
    alignItems: 'flex-end',
    paddingHorizontal: 20,
    paddingVertical: 10,
    minHeight: 44,
  },
  skipText: {
    fontSize: 16,
    color: '#6b7280',
  },
  slide: {
    width,
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
  },
  emoji: {
    fontSize: 80,
    marginBottom: 30,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1f2937',
    textAlign: 'center',
    marginBottom: 16,
  },
  description: {
    fontSize: 17,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 26,
  },
  footer: {
    paddingHorizontal: 20,
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 30,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#e5e7eb',
    marginHorizontal: 4,
  },
  dotActive: {
    backgroundColor: '#d946ef',
    width: 24,
  },
  button: {
    backgroundColor: '#d946ef',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
})
