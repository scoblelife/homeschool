/**
 * In-app Feedback Component for React Native
 *
 * Allows users to submit feedback (bugs, feature requests, etc.)
 * without leaving the app.
 */

import { useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Linking,
  KeyboardAvoidingView,
  Platform,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

type FeedbackCategory = 'bug' | 'feature' | 'question' | 'other'

interface FeedbackFormData {
  category: FeedbackCategory
  description: string
  email: string
}

const CATEGORIES: { value: FeedbackCategory; label: string; emoji: string }[] = [
  { value: 'bug', label: 'Bug Report', emoji: '🐛' },
  { value: 'feature', label: 'Feature Request', emoji: '💡' },
  { value: 'question', label: 'Question', emoji: '❓' },
  { value: 'other', label: 'Other', emoji: '💬' },
]

interface FeedbackModalProps {
  visible: boolean
  onClose: () => void
}

export function FeedbackModal({ visible, onClose }: FeedbackModalProps) {
  const insets = useSafeAreaInsets()
  const [formData, setFormData] = useState<FeedbackFormData>({
    category: 'bug',
    description: '',
    email: '',
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle')

  const handleSubmit = async () => {
    if (!formData.description.trim()) return

    setIsSubmitting(true)
    setSubmitStatus('idle')

    try {
      const categoryLabel = CATEGORIES.find((c) => c.value === formData.category)?.label
      const subject = encodeURIComponent(`[Homeschool Feedback] ${categoryLabel}`)
      const body = encodeURIComponent(
        `Category: ${formData.category}\n\n${formData.description}\n\n${formData.email ? `Reply to: ${formData.email}` : ''}`
      )

      const mailtoUrl = `mailto:support@scoble.life?subject=${subject}&body=${body}`

      const canOpen = await Linking.canOpenURL(mailtoUrl)
      if (canOpen) {
        await Linking.openURL(mailtoUrl)
      }

      setSubmitStatus('success')
      setFormData({ category: 'bug', description: '', email: '' })

      // Close after a delay
      setTimeout(() => {
        onClose()
        setSubmitStatus('idle')
      }, 2000)
    } catch (err) {
      console.error('Failed to submit feedback:', err)
      setSubmitStatus('error')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleClose = () => {
    if (!isSubmitting) {
      onClose()
      setSubmitStatus('idle')
    }
  }

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView
        style={styles.overlay}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <TouchableOpacity
          style={styles.backdrop}
          activeOpacity={1}
          onPress={handleClose}
        />

        <View style={[styles.modal, { paddingBottom: insets.bottom + 20 }]}>
          <View style={styles.handle} />

          <Text style={styles.title}>Send Feedback</Text>

          {submitStatus === 'success' ? (
            <View style={styles.successContainer}>
              <Text style={styles.successEmoji}>✓</Text>
              <Text style={styles.successText}>Thanks for your feedback!</Text>
            </View>
          ) : (
            <ScrollView
              style={styles.form}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              <Text style={styles.label}>Category</Text>
              <View style={styles.categoryGrid}>
                {CATEGORIES.map((category) => (
                  <TouchableOpacity
                    key={category.value}
                    style={[
                      styles.categoryButton,
                      formData.category === category.value && styles.categoryButtonActive,
                    ]}
                    onPress={() => setFormData({ ...formData, category: category.value })}
                  >
                    <Text style={styles.categoryEmoji}>{category.emoji}</Text>
                    <Text
                      style={[
                        styles.categoryLabel,
                        formData.category === category.value && styles.categoryLabelActive,
                      ]}
                    >
                      {category.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.label}>Description</Text>
              <TextInput
                style={styles.textArea}
                placeholder="Tell us what's on your mind..."
                placeholderTextColor="#9ca3af"
                value={formData.description}
                onChangeText={(text) => setFormData({ ...formData, description: text })}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />

              <Text style={styles.label}>Email (optional)</Text>
              <TextInput
                style={styles.input}
                placeholder="your@email.com"
                placeholderTextColor="#9ca3af"
                value={formData.email}
                onChangeText={(text) => setFormData({ ...formData, email: text })}
                keyboardType="email-address"
                autoCapitalize="none"
              />
              <Text style={styles.hint}>We'll only use this to follow up if needed</Text>

              {submitStatus === 'error' && (
                <Text style={styles.error}>Something went wrong. Please try again.</Text>
              )}

              <View style={styles.buttonRow}>
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={handleClose}
                  disabled={isSubmitting}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.submitButton,
                    (!formData.description.trim() || isSubmitting) && styles.submitButtonDisabled,
                  ]}
                  onPress={handleSubmit}
                  disabled={!formData.description.trim() || isSubmitting}
                >
                  <Text style={styles.submitButtonText}>
                    {isSubmitting ? 'Sending...' : 'Send Feedback'}
                  </Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          )}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  )
}

interface FeedbackButtonProps {
  onPress: () => void
}

export function FeedbackButton({ onPress }: FeedbackButtonProps) {
  return (
    <TouchableOpacity style={styles.feedbackButton} onPress={onPress}>
      <Text style={styles.feedbackButtonEmoji}>💬</Text>
      <Text style={styles.feedbackButtonText}>Send Feedback</Text>
      <Text style={styles.chevron}>›</Text>
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  modal: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 20,
    paddingTop: 12,
    maxHeight: '85%',
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: '#e5e7eb',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 20,
  },
  form: {
    flex: 1,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 8,
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 20,
  },
  categoryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    backgroundColor: '#fff',
  },
  categoryButtonActive: {
    borderColor: '#d946ef',
    backgroundColor: '#fdf4ff',
  },
  categoryEmoji: {
    fontSize: 16,
    marginRight: 6,
  },
  categoryLabel: {
    fontSize: 14,
    color: '#374151',
  },
  categoryLabelActive: {
    color: '#d946ef',
    fontWeight: '500',
  },
  textArea: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    minHeight: 100,
    marginBottom: 20,
    color: '#1f2937',
  },
  input: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    marginBottom: 4,
    color: '#1f2937',
  },
  hint: {
    fontSize: 12,
    color: '#9ca3af',
    marginBottom: 20,
  },
  error: {
    fontSize: 14,
    color: '#ef4444',
    marginBottom: 16,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    color: '#374151',
  },
  submitButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 10,
    backgroundColor: '#d946ef',
    alignItems: 'center',
  },
  submitButtonDisabled: {
    opacity: 0.5,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  successContainer: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  successEmoji: {
    fontSize: 48,
    color: '#22c55e',
    marginBottom: 16,
  },
  successText: {
    fontSize: 16,
    color: '#6b7280',
  },
  feedbackButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    backgroundColor: '#f9fafb',
    borderRadius: 10,
  },
  feedbackButtonEmoji: {
    fontSize: 20,
    marginRight: 12,
  },
  feedbackButtonText: {
    flex: 1,
    fontSize: 16,
    color: '#1f2937',
  },
  chevron: {
    fontSize: 20,
    color: '#9ca3af',
  },
})
