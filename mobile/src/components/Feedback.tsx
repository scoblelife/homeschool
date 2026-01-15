/**
 * In-app Feedback Component for React Native
 *
 * Allows users to submit feedback (bugs, feature requests, etc.)
 * without leaving the app.
 */

import { useState } from "react";
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
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "../theme/createStyles";

type FeedbackCategory = "bug" | "feature" | "question" | "other";

interface FeedbackFormData {
  category: FeedbackCategory;
  description: string;
  email: string;
}

const CATEGORIES: { value: FeedbackCategory; label: string; emoji: string }[] =
  [
    { value: "bug", label: "Bug Report", emoji: "🐛" },
    { value: "feature", label: "Feature Request", emoji: "💡" },
    { value: "question", label: "Question", emoji: "❓" },
    { value: "other", label: "Other", emoji: "💬" },
  ];

interface FeedbackModalProps {
  visible: boolean;
  onClose: () => void;
}

export function FeedbackModal({ visible, onClose }: FeedbackModalProps) {
  const insets = useSafeAreaInsets();
  const colors = useColors();
  const [formData, setFormData] = useState<FeedbackFormData>({
    category: "bug",
    description: "",
    email: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<
    "idle" | "success" | "error"
  >("idle");

  const handleSubmit = async () => {
    if (!formData.description.trim()) return;

    setIsSubmitting(true);
    setSubmitStatus("idle");

    try {
      const categoryLabel = CATEGORIES.find(
        (c) => c.value === formData.category,
      )?.label;
      const subject = encodeURIComponent(
        `[Homeschool Feedback] ${categoryLabel}`,
      );
      const body = encodeURIComponent(
        `Category: ${formData.category}\n\n${formData.description}\n\n${formData.email ? `Reply to: ${formData.email}` : ""}`,
      );

      const mailtoUrl = `mailto:support@scoble.life?subject=${subject}&body=${body}`;

      const canOpen = await Linking.canOpenURL(mailtoUrl);
      if (canOpen) {
        await Linking.openURL(mailtoUrl);
      }

      setSubmitStatus("success");
      setFormData({ category: "bug", description: "", email: "" });

      // Close after a delay
      setTimeout(() => {
        onClose();
        setSubmitStatus("idle");
      }, 2000);
    } catch (err) {
      console.error("Failed to submit feedback:", err);
      setSubmitStatus("error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      onClose();
      setSubmitStatus("idle");
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView
        style={styles.overlay}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <TouchableOpacity
          style={styles.backdrop}
          activeOpacity={1}
          onPress={handleClose}
        />

        <View
          style={[
            {
              backgroundColor: colors.card,
              borderTopLeftRadius: 20,
              borderTopRightRadius: 20,
              paddingHorizontal: 20,
              paddingTop: 12,
              maxHeight: "85%",
            },
            { paddingBottom: insets.bottom + 20 },
          ]}
        >
          <View
            style={{
              width: 40,
              height: 4,
              backgroundColor: colors.border,
              borderRadius: 2,
              alignSelf: "center",
              marginBottom: 16,
            }}
          />

          <Text
            style={{
              fontSize: 20,
              fontWeight: "600",
              color: colors.text,
              marginBottom: 20,
            }}
          >
            Send Feedback
          </Text>

          {submitStatus === "success" ? (
            <View style={{ alignItems: "center", paddingVertical: 60 }}>
              <Text
                style={{
                  fontSize: 48,
                  color: colors.success,
                  marginBottom: 16,
                }}
              >
                ✓
              </Text>
              <Text style={{ fontSize: 16, color: colors.textSecondary }}>
                Thanks for your feedback!
              </Text>
            </View>
          ) : (
            <ScrollView
              style={{ flex: 1 }}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              <Text
                style={{
                  fontSize: 14,
                  fontWeight: "500",
                  color: colors.text,
                  marginBottom: 8,
                }}
              >
                Category
              </Text>
              <View
                style={{
                  flexDirection: "row",
                  flexWrap: "wrap",
                  gap: 8,
                  marginBottom: 20,
                }}
              >
                {CATEGORIES.map((category) => (
                  <TouchableOpacity
                    key={category.value}
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      paddingHorizontal: 14,
                      paddingVertical: 10,
                      borderRadius: 10,
                      borderWidth: 1,
                      borderColor:
                        formData.category === category.value
                          ? colors.primary
                          : colors.border,
                      backgroundColor:
                        formData.category === category.value
                          ? colors.primaryLight
                          : colors.card,
                    }}
                    onPress={() =>
                      setFormData({ ...formData, category: category.value })
                    }
                  >
                    <Text style={{ fontSize: 16, marginRight: 6 }}>
                      {category.emoji}
                    </Text>
                    <Text
                      style={{
                        fontSize: 14,
                        color:
                          formData.category === category.value
                            ? colors.primary
                            : colors.text,
                        fontWeight:
                          formData.category === category.value
                            ? "500"
                            : "normal",
                      }}
                    >
                      {category.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text
                style={{
                  fontSize: 14,
                  fontWeight: "500",
                  color: colors.text,
                  marginBottom: 8,
                }}
              >
                Description
              </Text>
              <TextInput
                style={{
                  borderWidth: 1,
                  borderColor: colors.border,
                  borderRadius: 10,
                  paddingHorizontal: 14,
                  paddingVertical: 12,
                  fontSize: 16,
                  minHeight: 100,
                  marginBottom: 20,
                  color: colors.text,
                }}
                placeholder="Tell us what's on your mind..."
                placeholderTextColor={colors.textTertiary}
                value={formData.description}
                onChangeText={(text) =>
                  setFormData({ ...formData, description: text })
                }
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />

              <Text
                style={{
                  fontSize: 14,
                  fontWeight: "500",
                  color: colors.text,
                  marginBottom: 8,
                }}
              >
                Email (optional)
              </Text>
              <TextInput
                style={{
                  borderWidth: 1,
                  borderColor: colors.border,
                  borderRadius: 10,
                  paddingHorizontal: 14,
                  paddingVertical: 12,
                  fontSize: 16,
                  marginBottom: 4,
                  color: colors.text,
                }}
                placeholder="your@email.com"
                placeholderTextColor={colors.textTertiary}
                value={formData.email}
                onChangeText={(text) =>
                  setFormData({ ...formData, email: text })
                }
                keyboardType="email-address"
                autoCapitalize="none"
              />
              <Text
                style={{
                  fontSize: 12,
                  color: colors.textTertiary,
                  marginBottom: 20,
                }}
              >
                We'll only use this to follow up if needed
              </Text>

              {submitStatus === "error" && (
                <Text
                  style={{
                    fontSize: 14,
                    color: colors.error,
                    marginBottom: 16,
                  }}
                >
                  Something went wrong. Please try again.
                </Text>
              )}

              <View style={{ flexDirection: "row", gap: 12, marginBottom: 20 }}>
                <TouchableOpacity
                  style={{
                    flex: 1,
                    paddingVertical: 14,
                    borderRadius: 10,
                    borderWidth: 1,
                    borderColor: colors.border,
                    alignItems: "center",
                  }}
                  onPress={handleClose}
                  disabled={isSubmitting}
                >
                  <Text style={{ fontSize: 16, color: colors.text }}>
                    Cancel
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={{
                    flex: 1,
                    paddingVertical: 14,
                    borderRadius: 10,
                    backgroundColor: colors.primary,
                    alignItems: "center",
                    opacity:
                      !formData.description.trim() || isSubmitting ? 0.5 : 1,
                  }}
                  onPress={handleSubmit}
                  disabled={!formData.description.trim() || isSubmitting}
                >
                  <Text
                    style={{
                      fontSize: 16,
                      fontWeight: "600",
                      color: colors.textInverse,
                    }}
                  >
                    {isSubmitting ? "Sending..." : "Send Feedback"}
                  </Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          )}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

interface FeedbackButtonProps {
  onPress: () => void;
}

export function FeedbackButton({ onPress }: FeedbackButtonProps) {
  const colors = useColors();

  return (
    <TouchableOpacity
      style={{
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: 14,
        paddingHorizontal: 16,
        backgroundColor: colors.surface,
        borderRadius: 10,
      }}
      onPress={onPress}
    >
      <Text style={{ fontSize: 20, marginRight: 12 }}>💬</Text>
      <Text style={{ flex: 1, fontSize: 16, color: colors.text }}>
        Send Feedback
      </Text>
      <Text style={{ fontSize: 20, color: colors.textTertiary }}>›</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "flex-end",
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.3)",
  },
});
