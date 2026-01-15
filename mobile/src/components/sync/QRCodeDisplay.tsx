/**
 * QR Code Display Component - shows QR code for family invite
 */

import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Share,
  Alert,
} from "react-native";
import QRCode from "react-native-qrcode-svg";
import * as Clipboard from "expo-clipboard";
import { useColors } from "../../theme/createStyles";

interface QRCodeDisplayProps {
  inviteCode: string;
  inviteMessage: string;
  onClose: () => void;
}

export function QRCodeDisplay({
  inviteCode,
  inviteMessage,
  onClose,
}: QRCodeDisplayProps) {
  const colors = useColors();
  const handleShare = async () => {
    try {
      await Share.share({
        message: inviteMessage,
      });
    } catch (error) {
      console.error("Error sharing:", error);
    }
  };

  const handleCopyCode = async () => {
    try {
      await Clipboard.setStringAsync(inviteCode);
      Alert.alert("Copied", "Invite code copied to clipboard");
    } catch (error) {
      console.error("Error copying:", error);
    }
  };

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: colors.background,
        alignItems: "center",
        justifyContent: "center",
        padding: 20,
      }}
    >
      <Text
        style={{
          fontSize: 24,
          fontWeight: "bold",
          color: colors.text,
          marginBottom: 8,
        }}
      >
        Family Invite
      </Text>
      <Text
        style={{
          fontSize: 14,
          color: colors.textSecondary,
          textAlign: "center",
          marginBottom: 32,
          paddingHorizontal: 20,
        }}
      >
        Share this QR code with family members to let them join
      </Text>

      <View
        style={{
          backgroundColor: colors.card,
          padding: 20,
          borderRadius: 16,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.1,
          shadowRadius: 8,
          elevation: 4,
          marginBottom: 24,
        }}
      >
        <QRCode
          value={inviteCode}
          size={200}
          backgroundColor={colors.card}
          color={colors.text}
        />
      </View>

      <Text
        style={{
          fontSize: 14,
          color: colors.textSecondary,
          textAlign: "center",
          marginBottom: 32,
          paddingHorizontal: 40,
        }}
      >
        Scan this code with the Homeschool app or share the invite
      </Text>

      <View style={{ flexDirection: "row", gap: 12, marginBottom: 16 }}>
        <TouchableOpacity
          style={{
            backgroundColor: colors.primary,
            paddingVertical: 14,
            paddingHorizontal: 24,
            borderRadius: 8,
          }}
          onPress={handleShare}
        >
          <Text
            style={{
              color: colors.textInverse,
              fontSize: 16,
              fontWeight: "600",
            }}
          >
            Share Invite
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={{
            backgroundColor: colors.surfaceSecondary,
            paddingVertical: 14,
            paddingHorizontal: 24,
            borderRadius: 8,
          }}
          onPress={handleCopyCode}
        >
          <Text style={{ color: colors.text, fontSize: 16, fontWeight: "600" }}>
            Copy Code
          </Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={{ padding: 16 }} onPress={onClose}>
        <Text style={{ color: colors.textSecondary, fontSize: 14 }}>Close</Text>
      </TouchableOpacity>
    </View>
  );
}
