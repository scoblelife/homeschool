import { Modal as RNModal, View, Text, TouchableOpacity, SafeAreaView, KeyboardAvoidingView, Platform, ScrollView } from 'react-native'
import { ReactNode } from 'react'

interface ModalProps {
  visible: boolean
  onClose: () => void
  title: string
  children: ReactNode
  footer?: ReactNode
}

export function Modal({ visible, onClose, title, children, footer }: ModalProps) {
  return (
    <RNModal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <SafeAreaView
        style={{ flex: 1, backgroundColor: '#fff' }}
        accessibilityViewIsModal
        accessibilityLabel={`${title} dialog`}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1 }}
        >
          {/* Header */}
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: 16,
              borderBottomWidth: 1,
              borderBottomColor: '#e5e7eb',
            }}
          >
            <TouchableOpacity
              onPress={onClose}
              accessibilityRole="button"
              accessibilityLabel="Cancel"
              accessibilityHint="Closes this dialog"
            >
              <Text style={{ color: '#6b7280', fontSize: 16 }}>Cancel</Text>
            </TouchableOpacity>
            <Text
              style={{ fontSize: 18, fontWeight: '600', color: '#1f2937' }}
              accessibilityRole="header"
            >
              {title}
            </Text>
            <View style={{ width: 50 }} />
          </View>

          {/* Content */}
          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={{ padding: 16 }}
            keyboardShouldPersistTaps="handled"
          >
            {children}
          </ScrollView>

          {/* Footer */}
          {footer && (
            <View
              style={{
                padding: 16,
                borderTopWidth: 1,
                borderTopColor: '#e5e7eb',
              }}
            >
              {footer}
            </View>
          )}
        </KeyboardAvoidingView>
      </SafeAreaView>
    </RNModal>
  )
}

interface ModalHeaderProps {
  title: string
  onClose: () => void
  rightAction?: ReactNode
}

export function ModalHeader({ title, onClose, rightAction }: ModalHeaderProps) {
  return (
    <View
      style={{
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#e5e7eb',
      }}
    >
      <TouchableOpacity
        onPress={onClose}
        accessibilityRole="button"
        accessibilityLabel="Cancel"
        accessibilityHint="Closes this dialog"
      >
        <Text style={{ color: '#6b7280', fontSize: 16 }}>Cancel</Text>
      </TouchableOpacity>
      <Text
        style={{ fontSize: 18, fontWeight: '600', color: '#1f2937' }}
        accessibilityRole="header"
      >
        {title}
      </Text>
      {rightAction || <View style={{ width: 50 }} />}
    </View>
  )
}
