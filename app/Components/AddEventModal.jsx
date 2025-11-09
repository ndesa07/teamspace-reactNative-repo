// app/EventModal.jsx
import React, { useEffect, useState } from "react";
import {
  Modal,
  View,
  Text,
  Pressable,
  StyleSheet,
  ScrollView,
  TextInput,
  Switch,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
} from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";

function pad(n) { return String(n).padStart(2, "0"); }
function ymd(d) {
  if (typeof d === "string") return d;
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}
function toAmPm(h, m) {
  const hour = Number(h);
  const min = pad(m);
  const am = hour < 12 ? "am" : "pm";
  const hr12 = hour % 12 === 0 ? 12 : hour % 12;
  return `${hr12}:${min} ${am}`;
}
function time12(d) {
  return toAmPm(d.getHours(), d.getMinutes());
}

export default function EventModal({
  visible,
  onClose,
  onSubmit,
  submitting = false,
  heading = "Add New Event",
  initialName = "",
  initialEventName = "",
  initialBody = "",
  initialActive = true,
}) {
  const [eventName, setEventName] = useState(initialEventName || initialName);
  const [eventBody, setEventBody] = useState(initialBody);
  const [isActive, setIsActive] = useState(initialActive);
  const [pickerDate, setPickerDate] = useState(new Date());
  const [dateStr, setDateStr] = useState(ymd(new Date()));
  const [timeStr, setTimeStr] = useState(time12(new Date()));
  const [showDate, setShowDate] = useState(false);
  const [showTime, setShowTime] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (visible) {
      const now = new Date();
      setEventName(initialEventName || initialName || "");
      setEventBody(initialBody || "");
      setIsActive(Boolean(initialActive));
      setPickerDate(now);
      setDateStr(ymd(now));
      setTimeStr(time12(now));
      setError("");
      setShowDate(false);
      setShowTime(false);
    }
  }, [visible, initialEventName, initialBody, initialActive, initialName]);

  const onChangeDate = (_e, selected) => {
    setShowDate(false);
    if (selected) {
      const d = new Date(selected);
      const merged = new Date(d);
      const [h12, mm, ap] = timeStr.match(/^(\d{1,2}):(\d{2})\s*(am|pm)$/i)?.slice(1) || [];
      if (h12 && mm && ap) {
        let H = Number(h12) % 12;
        if (/pm/i.test(ap)) H += 12;
        merged.setHours(H, Number(mm), 0, 0);
      }
      setPickerDate(merged);
      setDateStr(ymd(merged));
    }
  };

  const onChangeTime = (_e, selected) => {
    setShowTime(false);
    if (selected) {
      const d = new Date(selected);
      const merged = new Date(pickerDate);
      merged.setHours(d.getHours(), d.getMinutes(), 0, 0);
      setPickerDate(merged);
      setTimeStr(time12(merged));
    }
  };

  const handleSave = () => {
    if (!eventName.trim() || !dateStr.trim() || !timeStr.trim()) {
      setError("Event Name, Date, and Time are required.");
      return;
    }
    onSubmit({
      EventName: String(eventName).trim(),
      EventBody: String(eventBody).trim(),
      Date: dateStr,
      Time: timeStr,
      Active: isActive,
    });
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
        <View style={styles.backdrop}>
          <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
          <View style={styles.card}>
            <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
              <Text style={styles.heading}>{heading}</Text>

              {!!error && (
                <View style={styles.errorBox}>
                  <Text style={styles.errorText}>{error}</Text>
                </View>
              )}

              <View style={styles.fieldBlock}>
                <Text style={styles.label}>Event Name</Text>
                <TextInput
                  value={eventName}
                  onChangeText={setEventName}
                  placeholder="Enter event name"
                  placeholderTextColor="#9CA3AF"
                  style={styles.input}
                />
              </View>

              <View style={styles.row}>
                <View style={styles.col}>
                  <Text style={styles.label}>Date</Text>
                  <Pressable onPress={() => setShowDate(true)} style={styles.inputPressable}>
                    <Text style={styles.inputPressableText}>{dateStr}</Text>
                  </Pressable>
                </View>
                <View style={styles.col}>
                  <Text style={styles.label}>Time</Text>
                  <Pressable onPress={() => setShowTime(true)} style={styles.inputPressable}>
                    <Text style={styles.inputPressableText}>{timeStr}</Text>
                  </Pressable>
                </View>
              </View>

              {showDate && (
                <DateTimePicker
                  mode="date"
                  value={pickerDate}
                  onChange={onChangeDate}
                  display={Platform.OS === "ios" ? "inline" : "calendar"}
                />
              )}
              {showTime && (
                <DateTimePicker
                  mode="time"
                  value={pickerDate}
                  onChange={onChangeTime}
                  display={Platform.OS === "ios" ? "spinner" : "clock"}
                />
              )}

              <View style={styles.fieldBlock}>
                <Text style={styles.label}>Details</Text>
                <TextInput
                  value={eventBody}
                  onChangeText={setEventBody}
                  multiline
                  placeholder="Add event details…"
                  placeholderTextColor="#9CA3AF"
                  style={styles.textarea}
                />
              </View>

              <View style={styles.toggleRow}>
                <Text style={styles.toggleLabel}>Event Active</Text>
                <Pressable
                  onPress={() => setIsActive(!isActive)}
                  style={[styles.toggle, isActive ? styles.toggleOn : styles.toggleOff]}
                >
                  <View style={[styles.toggleThumb, isActive ? styles.toggleThumbOn : styles.toggleThumbOff]} />
                </Pressable>
              </View>
            </ScrollView>

            <View style={styles.footer}>
              <Pressable onPress={onClose} disabled={submitting} style={[styles.btn, styles.btnSecondary, submitting && styles.btnDisabled]}>
                <Text style={[styles.btnTextSecondary]}>Cancel</Text>
              </Pressable>
              <Pressable onPress={handleSave} disabled={submitting} style={[styles.btn, styles.btnPrimary, submitting && styles.btnDisabled]}>
                <Text style={styles.btnTextPrimary}>{submitting ? "Saving..." : "Save Event"}</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", alignItems: "center", justifyContent: "center", padding: 16 },
  card: { width: "100%", maxWidth: 560, maxHeight: "85%", borderRadius: 12, backgroundColor: "#fff", overflow: "hidden" },
  scroll: { flexGrow: 0 },
  scrollContent: { padding: 16 },
  heading: { fontSize: 20, fontWeight: "800", color: "#1f2937", marginBottom: 12 },

  errorBox: { backgroundColor: "#fee2e2", borderWidth: 1, borderColor: "#fecaca", padding: 10, borderRadius: 8, marginBottom: 12 },
  errorText: { color: "#b91c1c" },

  fieldBlock: { marginBottom: 12 },
  label: { fontSize: 14, color: "#374151", marginBottom: 6, fontWeight: "600" },
  input: {
    borderWidth: 1, borderColor: "#d1d5db", borderRadius: 8,
    paddingHorizontal: 12, paddingVertical: Platform.OS === "ios" ? 10 : 8, color: "#111827",
  },

  row: { flexDirection: "row", gap: 12, marginBottom: 12 },
  col: { flex: 1 },
  inputPressable: {
    borderWidth: 1, borderColor: "#d1d5db", borderRadius: 8,
    paddingHorizontal: 12, paddingVertical: Platform.OS === "ios" ? 10 : 12, justifyContent: "center",
  },
  inputPressableText: { color: "#111827" },

  textarea: {
    minHeight: 120, borderWidth: 1, borderColor: "#0e6367", borderRadius: 10,
    paddingHorizontal: 12, paddingVertical: 10, textAlignVertical: "top", color: "#111827",
  },

  toggleRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 4, marginBottom: 8 },
  toggleLabel: { fontSize: 14, color: "#374151", fontWeight: "600" },
  toggle: { width: 46, height: 24, borderRadius: 12, padding: 2, justifyContent: "center" },
  toggleOn: { backgroundColor: "#14b8a6" },
  toggleOff: { backgroundColor: "#d1d5db" },
  toggleThumb: { width: 20, height: 20, borderRadius: 10, backgroundColor: "#fff" },
  toggleThumbOn: { transform: [{ translateX: 22 }] },
  toggleThumbOff: { transform: [{ translateX: 0 }] },

  footer: { flexDirection: "row", justifyContent: "flex-end", gap: 8, paddingHorizontal: 16, paddingVertical: 12, backgroundColor: "#f9fafb" },
  btn: { paddingHorizontal: 14, paddingVertical: 10, borderRadius: 8 },
  btnPrimary: { backgroundColor: "#0e6367" },
  btnSecondary: { backgroundColor: "#fff", borderWidth: 1, borderColor: "#d1d5db" },
  btnDisabled: { opacity: 0.6 },
  btnTextPrimary: { color: "#fff", fontWeight: "700" },
  btnTextSecondary: { color: "#374151", fontWeight: "700" },
});
