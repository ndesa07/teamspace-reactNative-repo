import React, { useEffect, useState } from "react";
import { Modal, View, Text, Pressable, StyleSheet, ScrollView, TextInput, Switch, Platform, TouchableWithoutFeedback, Keyboard } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";

function pad(n) { return String(n).padStart(2, "0"); }
function toAmPm(h, m) {
  const hour = Number(h);
  const min = pad(m);
  const am = hour < 12;
  const hr12 = hour % 12 === 0 ? 12 : hour % 12;
  return `${hr12}:${min} ${am ? "am" : "pm"}`;
}
function ymd(d) {
  if (typeof d === "string") return d;
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}
function parseTimeToDate(baseDateStr, timeStr) {
  const base = new Date(baseDateStr || ymd(new Date()));
  const m = timeStr?.trim().match(/^(\d{1,2}):(\d{2})\s*(am|pm)$/i);
  if (!m) return base;
  let [_, hh, mm, ap] = m;
  let H = Number(hh) % 12;
  if (/pm/i.test(ap)) H += 12;
  base.setHours(H, Number(mm), 0, 0);
  return base;
}
function isYmd(dateStr) {
  return /^\d{4}-\d{1,2}-\d{1,2}$/.test(String(dateStr ?? "").trim());
}

export default function EventDetailModal({
  visible,
  onClose,
  event,
  canEdit = false,
  canDelete = false,
  onUpdate,
  updating = false,
  updateDelete,
}) {
  const initialName   = event?.EventName ?? event?.Title ?? "";
  const initialBody   = event?.EventBody ?? event?.Body ?? "";
  const initialActive = (event?.Active ?? false) === true;
  const initialDate   = event?.Date ?? "";
  const initialTime   = event?.Time ?? "";

  const [isEditing, setIsEditing] = useState(false);
  const [name, setName]           = useState(initialName);
  const [body, setBody]           = useState(initialBody);
  const [active, setActive]       = useState(initialActive);
  const [dateStr, setDateStr]     = useState(initialDate);
  const [timeStr, setTimeStr]     = useState(initialTime);
  const [pickerDate, setPickerDate] = useState(() => {
    if (initialDate && initialTime) return parseTimeToDate(initialDate, initialTime);
    if (initialDate) return new Date(initialDate);
    return new Date();
  });

  useEffect(() => {
    if (visible) {
      setIsEditing(false);
      setName(initialName);
      setBody(initialBody);
      setActive(initialActive);
      setDateStr(initialDate);
      setTimeStr(initialTime);
      setPickerDate(() => {
        if (initialDate && initialTime) return parseTimeToDate(initialDate, initialTime);
        if (initialDate) return new Date(initialDate);
        return new Date();
      });
    }
  }, [visible, event?.$id]);

  if (!visible || !event) return null;

  const club    = event.Club ?? "";
  const author  = event.Name ?? event.createdBy ?? "Unknown";

  const canSubmit = name.trim().length > 0 && isYmd(dateStr);

  const changed =
    name.trim() !== initialName.trim() ||
    body.trim() !== initialBody.trim() ||
    Boolean(active) !== Boolean(initialActive) ||
    String(dateStr ?? "").trim() !== String(initialDate ?? "").trim() ||
    String(timeStr ?? "").trim() !== String(initialTime ?? "").trim();

  const handlePickDate = (_e, selected) => {
    const d = selected || pickerDate;
    setPickerDate(d);
    setDateStr(ymd(d));
    const hh = d.getHours();
    const mm = d.getMinutes();
    setTimeStr(toAmPm(hh, mm));
  };

  const handleTimeChange = (txt) => {
    setTimeStr(txt);
    const merged = parseTimeToDate(dateStr || ymd(new Date()), txt);
    setPickerDate(merged);
  };

  const handleSave = async () => {
    if (!onUpdate) return;
    await onUpdate({
      EventName: name.trim(),
      EventBody: body.trim(),
      Active: active,
      Date: String(dateStr).trim(),
      Time: String(timeStr || "").trim(),
    });
    setIsEditing(false);
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
        <View style={styles.backdrop}>
          <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
          <View style={styles.card}>
            <View style={styles.titleRow}>
              {isEditing ? (
                <TextInput
                  value={name}
                  onChangeText={setName}
                  placeholder="Event name"
                  placeholderTextColor="#9CA3AF"
                  style={styles.titleInput}
                />
              ) : (
                <Text style={styles.title}>{initialName || "(Untitled event)"}</Text>
              )}
              <View style={[styles.badge, initialActive ? styles.badgeActive : styles.badgeInactive]}>
                <Text style={styles.badgeText}>{initialActive ? "Active" : "Inactive"}</Text>
              </View>
            </View>

            <View style={styles.metaRow}>
              <Text style = {styles.switchLabel}>Time:</Text>
              {event.Time ? <Text style={[{fontSize:17}]}>{`${String(event.Time)}`}</Text> : null}
             
            </View>

            <View style={styles.sectionDivider} />

            {isEditing ? (
              <ScrollView
                style={styles.editScroll}
                contentContainerStyle={styles.editScrollContent}
                keyboardShouldPersistTaps="handled"
              >
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
                <View style={styles.switchRow}>
                  <Text style={styles.switchLabel}>Active</Text>
                  <Switch
                    value={active}
                    onValueChange={setActive}
                    thumbColor={active ? "#0e6367" : "#ccc"}
                    trackColor={{ true: "#9fd2d4", false: "#ddd" }}
                  />
                </View>

                <View style={{ marginBottom: 8 }}>
                  <Text style={styles.switchLabel}>Date</Text>
                  <DateTimePicker
                    mode="datetime"
                    value={pickerDate}
                    onChange={handlePickDate}
                    display={Platform.OS === "ios" ? "inline" : "calendar"}
                  />
                  <Text style={{ marginTop: 6, color: "#374151" }}>{dateStr}</Text>
                </View>
              </ScrollView>
            ) : (
              <View style={styles.bodyBox}>
                <ScrollView style={styles.bodyScroll} contentContainerStyle={{ paddingBottom: 8 }}>
                  <Text style={styles.body}>{initialBody || "(No details)"}</Text>
                </ScrollView>
              </View>
            )}

            <View style={styles.actions}>
              {!isEditing ? (
                <>
                  {canDelete && (
                    <Pressable
                      onPress={updateDelete}
                      style={({ pressed }) => [styles.btn, styles.btnGhost, pressed && styles.pressed, styles.row]}
                    >
                      <Text style={styles.delete}>Delete</Text>
                      <MaterialIcons name="delete" size={18} color="red" />
                    </Pressable>
                  )}
                  <View style={{ flex: 1 }} />
                  <Pressable onPress={onClose} style={({ pressed }) => [styles.btn, styles.btnPrimary, pressed && styles.pressed]}>
                    <Text style={styles.btnPrimaryText}>Close</Text>
                  </Pressable>
                  {canEdit && (
                    <Pressable onPress={() => setIsEditing(true)} style={({ pressed }) => [styles.btn, styles.btnPrimary, pressed && styles.pressed]}>
                      <Text style={styles.btnPrimaryText}>Edit</Text>
                    </Pressable>
                  )}
                </>
              ) : (
                <>
                  <Pressable
                    onPress={() => {
                      setIsEditing(false);
                      setName(initialName);
                      setBody(initialBody);
                      setActive(initialActive);
                      setDateStr(initialDate);
                      setTimeStr(initialTime);
                      setPickerDate(() => {
                        if (initialDate && initialTime) return parseTimeToDate(initialDate, initialTime);
                        if (initialDate) return new Date(initialDate);
                        return new Date();
                      });
                    }}
                    style={({ pressed }) => [styles.btn, styles.btnGhost, pressed && styles.pressed]}
                  >
                    <Text style={styles.btnGhostText}>Cancel</Text>
                  </Pressable>
                  <Pressable
                    disabled={!canSubmit || !changed || updating}
                    onPress={handleSave}
                    style={({ pressed }) => [
                      styles.btn,
                      (!canSubmit || !changed || updating) ? styles.btnDisabled : styles.btnPrimary,
                      pressed && styles.pressed,
                    ]}
                  >
                    <Text style={styles.btnPrimaryText}>{updating ? "Saving…" : "Save"}</Text>
                  </Pressable>
                </>
              )}
            </View>
          </View>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.4)", alignItems: "center", justifyContent: "center", padding: 16 },
  card: { width: "100%", maxWidth: 560, maxHeight: "80%", borderRadius: 16, backgroundColor: "#fff", padding: 16 },
  heading: { fontSize: 16, fontWeight: "700", marginBottom: 6, color: "#0e6367" },

  titleRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8 },
  title: { fontSize: 20, fontWeight: "800", color: "#111827", marginBottom: 4, flex: 1 },
  titleInput: {
    flex: 1, borderWidth: 1, borderColor: "#ddd", borderRadius: 10,
    paddingHorizontal: 12, paddingVertical: Platform.OS === "ios" ? 10 : 8, color: "#111827",
  },

  metaRow: { flexDirection: "row", alignItems: "center", marginTop: 4, marginBottom: 6, flexWrap: "wrap", gap: 6 },
  metaText: { color: "#374151" },
  metaDot: { color: "#9CA3AF" },

  badge: { alignSelf: "flex-start", borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4, marginBottom: 8 },
  badgeActive: { backgroundColor: "#DCF2F3" },
  badgeInactive: { backgroundColor: "#F3F4F6" },
  badgeText: { color: "#0e6367", fontWeight: "700" },

  sectionDivider: { height: StyleSheet.hairlineWidth, backgroundColor: "#0e6367", width: "100%", marginVertical: 8 },

  switchRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 8 },
  switchLabel: { fontSize: 16, color: "#111827", fontWeight: "600" },

  inputRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 8, gap: 8 },
  dateInput: {
    flex: 1, borderWidth: 1, borderColor: "#ddd", borderRadius: 10,
    paddingHorizontal: 12, paddingVertical: Platform.OS === "ios" ? 10 : 8, color: "#111827",
  },

  bodyBox: { borderWidth: 1, borderColor: "#0e6367", borderRadius: 12, padding: 12, marginTop: 4, backgroundColor: "#fff" ,marginBottom: 10},
  bodyScroll: { maxHeight: 320 },
  body: { color: "#111827", lineHeight: 22 },
  bodyInput: { minHeight: 120, textAlignVertical: "top", color: "#111827" },

  editScroll: { maxHeight: 360 },
  editScrollContent: { paddingBottom: 12 },

  actions: { marginTop: 12, flexDirection: "row", justifyContent: "flex-end", gap: 8 },
  btn: { paddingHorizontal: 14, paddingVertical: 10, borderRadius: 10 },
  btnGhost: { backgroundColor: "transparent" },
  btnGhostText: { color: "#444", fontWeight: "700" },
  btnPrimary: { backgroundColor: "#0e6367" },
  btnDisabled: { backgroundColor: "#b8c4c6" },
  btnPrimaryText: { color: "#fff", fontWeight: "700" },
  pressed: { opacity: 0.9 },
  delete: { color: "red", fontWeight: "900", fontSize: 16 },
  row: { flexDirection: "row", alignItems: "center", justifyContent: "center" },
});
