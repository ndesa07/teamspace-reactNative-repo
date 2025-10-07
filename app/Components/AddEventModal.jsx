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
  if (typeof d === "string") return d; // assume already YYYY-MM-DD
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export default function EventModal({
  visible,
  onClose,
  onSubmit,                 // ({ EventName, EventBody, Date, Active })
  submitting = false,
  heading = "Add Event",
  initialName = "",
  initialEventName = "",
  initialBody = "",
  initialActive = true,
}) {
  const [eventName, setEventName] = useState(initialEventName);
  const [body, setBody] = useState(initialBody);
  const [active, setActive] = useState(initialActive);
  const [pickerDate, setPickerDate] = useState(new Date());
  const [dateStr, setDateStr] = useState(ymd(new Date()));

  useEffect(() => {
    if (visible) {
      setEventName(initialEventName);
      setBody(initialBody);
      setActive(initialActive);
      const now = new Date();
      setPickerDate(now);
      setDateStr(ymd(now));
    }
  }, [visible, initialEventName, initialBody, initialActive]);

  const handlePickDate = (_e, selected) => {
    const d = selected || pickerDate;
    setPickerDate(d);
    setDateStr(ymd(d)); // keep as "YYYY-MM-DD"
  };

  const canSubmit = true; // never block submit; only disable when submitting

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
        <View style={styles.backdrop}>
          <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />

          <View style={styles.card}>
            {/* SCROLLABLE CONTENT */}
            <ScrollView
              style={styles.scroll}
              contentContainerStyle={styles.scrollContent}
              keyboardShouldPersistTaps="handled"
            >
              <Text style={styles.heading}>{heading}</Text>

              {/* Event name */}
              <TextInput
                value={eventName}
                onChangeText={setEventName}
                placeholder="Event name"
                placeholderTextColor="#9CA3AF"
                style={styles.titleInput}
              />

              {/* Body */}
              <View style={styles.bodyBox}>
                <TextInput
                  value={body}
                  onChangeText={setBody}
                  multiline
                  placeholder="Add event details…"
                  placeholderTextColor="#9CA3AF"
                  style={styles.bodyInput}
                />
              </View>

              {/* Date (picker only) */}
              <View style={{ marginTop: 8, marginBottom: 6 }}>
                <Text style={styles.switchLabel}>Date</Text>
                <DateTimePicker
                  mode="date"
                  value={pickerDate}
                  onChange={handlePickDate}
                  display= {"inline"}
                />
                <Text style={{ marginTop: 6, color: "#374151" }}>{dateStr}</Text>
              </View>

              {/* Active toggle */}
              <View style={styles.switchRow}>
                <Text style={styles.switchLabel}>Active</Text>
                <Switch
                  value={active}
                  onValueChange={setActive}
                  thumbColor={active ? "#0e6367" : "#ccc"}
                  trackColor={{ true: "#9fd2d4", false: "#ddd" }}
                />
              </View>

              {/* Actions */}
              <View style={styles.actions}>
                <Pressable
                  onPress={onClose}
                  style={({ pressed }) => [styles.btn, styles.btnGhost, pressed && styles.pressed]}
                >
                  <Text style={styles.btnGhostText}>Cancel</Text>
                </Pressable>

                <Pressable
                  disabled={submitting}
                  onPress={() =>
                    onSubmit({
                      EventName: String(eventName).trim(),
                      EventBody: String(body).trim(),
                      Date: dateStr,      // "YYYY-MM-DD"
                      Active: active,
                    })
                  }
                  style={({ pressed }) => [
                    styles.btn,
                    submitting ? styles.btnDisabled : styles.btnPrimary,
                    pressed && styles.pressed,
                  ]}
                >
                  <Text style={styles.btnPrimaryText}>{submitting ? "Saving…" : "Save Event"}</Text>
                </Pressable>
              </View>
            </ScrollView>
          </View>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.4)", alignItems: "center", justifyContent: "center", padding: 16 },
  card: { width: "100%", maxWidth: 560, maxHeight: "80%", borderRadius: 16, backgroundColor: "#fff", padding: 16 },
  // scroll takes the available height inside the card; content gets padding/gap
  scroll: { flexGrow: 0 },
  scrollContent: { paddingBottom: 12 },
  heading: { fontSize: 16, fontWeight: "700", marginBottom: 6, color: "#0e6367" },

  titleInput: {
    borderWidth: 1, borderColor: "#ddd", borderRadius: 10,
    paddingHorizontal: 12, paddingVertical: Platform.OS === "ios" ? 10 : 8, color: "#111827",
    marginBottom: 8,
  },

  switchRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 6, marginBottom: 6 },
  switchLabel: { fontSize: 16, color: "#111827", fontWeight: "600" },

  bodyBox: { borderWidth: 1, borderColor: "#0e6367", borderRadius: 12, padding: 12, marginTop: 4, backgroundColor: "#fff" },
  bodyInput: { minHeight: 120, textAlignVertical: "top", color: "#111827" },

  actions: { marginTop: 12, flexDirection: "row", justifyContent: "flex-end", gap: 8 },
  btn: { paddingHorizontal: 14, paddingVertical: 10, borderRadius: 10 },
  btnGhost: { backgroundColor: "transparent" },
  btnGhostText: { color: "#444", fontWeight: "700" },
  btnPrimary: { backgroundColor: "#0e6367" },
  btnDisabled: { backgroundColor: "#b8c4c6" },
  btnPrimaryText: { color: "#fff", fontWeight: "700" },
  pressed: { opacity: 0.9 },
});
