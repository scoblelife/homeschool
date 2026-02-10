import { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Platform,
  ViewStyle,
} from "react-native";
import DateTimePicker, {
  DateTimePickerEvent,
} from "@react-native-community/datetimepicker";
import { format } from "date-fns";
import { useColors } from "../../theme/createStyles";

interface DatePickerProps {
  label?: string;
  value: string; // 'yyyy-MM-dd' format
  onChange: (dateString: string) => void;
  placeholder?: string;
  containerStyle?: ViewStyle;
}

interface TimePickerProps {
  label?: string;
  value: string; // 'HH:mm' format
  onChange: (timeString: string) => void;
  placeholder?: string;
  containerStyle?: ViewStyle;
}

export function DatePicker({
  label,
  value,
  onChange,
  placeholder = "Select date",
  containerStyle,
}: DatePickerProps) {
  const colors = useColors();
  const [show, setShow] = useState(false);

  const dateValue = value ? new Date(value + "T12:00:00") : new Date();

  const handleChange = (_event: DateTimePickerEvent, selectedDate?: Date) => {
    if (Platform.OS === "android") {
      setShow(false);
    }
    if (selectedDate) {
      onChange(format(selectedDate, "yyyy-MM-dd"));
    }
  };

  return (
    <View style={{ marginBottom: 16, ...containerStyle }}>
      {label && (
        <Text
          style={{
            fontSize: 14,
            fontWeight: "500",
            color: colors.text,
            marginBottom: 4,
          }}
        >
          {label}
        </Text>
      )}
      <TouchableOpacity
        onPress={() => setShow(true)}
        style={{
          backgroundColor: colors.surface,
          borderRadius: 8,
          padding: 12,
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <Text
          style={{
            fontSize: 16,
            color: value ? colors.text : colors.textTertiary,
          }}
        >
          {value
            ? format(new Date(value + "T12:00:00"), "EEE, MMM d, yyyy")
            : placeholder}
        </Text>
      </TouchableOpacity>

      {show && (
        <DateTimePicker
          value={dateValue}
          mode="date"
          display={Platform.OS === "ios" ? "inline" : "default"}
          onChange={handleChange}
        />
      )}

      {Platform.OS === "ios" && show && (
        <TouchableOpacity
          onPress={() => setShow(false)}
          style={{
            alignSelf: "flex-end",
            paddingVertical: 8,
            paddingHorizontal: 16,
            marginTop: 4,
          }}
        >
          <Text
            style={{ fontSize: 14, fontWeight: "600", color: colors.primary }}
          >
            Done
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

export function TimePicker({
  label,
  value,
  onChange,
  placeholder = "Select time",
  containerStyle,
}: TimePickerProps) {
  const colors = useColors();
  const [show, setShow] = useState(false);

  // Parse "HH:mm" into a Date
  const parseTime = (timeStr: string): Date => {
    const d = new Date();
    if (timeStr) {
      const [hours, minutes] = timeStr.split(":").map(Number);
      d.setHours(hours, minutes, 0, 0);
    }
    return d;
  };

  const timeValue = parseTime(value);

  const handleChange = (_event: DateTimePickerEvent, selectedDate?: Date) => {
    if (Platform.OS === "android") {
      setShow(false);
    }
    if (selectedDate) {
      onChange(format(selectedDate, "HH:mm"));
    }
  };

  return (
    <View style={{ marginBottom: 16, ...containerStyle }}>
      {label && (
        <Text
          style={{
            fontSize: 14,
            fontWeight: "500",
            color: colors.text,
            marginBottom: 4,
          }}
        >
          {label}
        </Text>
      )}
      <TouchableOpacity
        onPress={() => setShow(true)}
        style={{
          backgroundColor: colors.surface,
          borderRadius: 8,
          padding: 12,
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <Text
          style={{
            fontSize: 16,
            color: value ? colors.text : colors.textTertiary,
          }}
        >
          {value || placeholder}
        </Text>
      </TouchableOpacity>

      {show && (
        <DateTimePicker
          value={timeValue}
          mode="time"
          display={Platform.OS === "ios" ? "spinner" : "default"}
          onChange={handleChange}
        />
      )}

      {Platform.OS === "ios" && show && (
        <TouchableOpacity
          onPress={() => setShow(false)}
          style={{
            alignSelf: "flex-end",
            paddingVertical: 8,
            paddingHorizontal: 16,
            marginTop: 4,
          }}
        >
          <Text
            style={{ fontSize: 14, fontWeight: "600", color: colors.primary }}
          >
            Done
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
}
