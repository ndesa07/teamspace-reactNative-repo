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
  const m = String(timeStr || "").trim().match(/^(\d{1,2}):(\d{2})\s*(am|pm)$/i);
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
  userId,
  name1,
  clubName1,
  canEdit = false,
  canDelete = false,
  onUpdate,
  updating = false,
  updateDelete,
  myAvailability = null,   // ← NEW (true/false/null)
  onSetAvailability,       // ← NEW
  availabilityList = [],
  onRefreshAvailability 
}) {
  const initialName   = event?.EventName ?? event?.Title ?? "";
  const initialBody   = event?.EventBody ?? event?.Body ?? "";
  const initialActive = (event?.Active ?? false) === true;
  const initialDate   = event?.Date ?? "";
  const initialTime   = event?.Time ?? "";

  const [isEditing, setIsEditing]   = useState(false);
  const [myAvail, setMyAvail] = useState(myAvailability);
  const [savingAvail, setSavingAvail] = useState(false);

  const [name, setName]             = useState(initialName);
  const [body, setBody]             = useState(initialBody);
  const [active, setActive]         = useState(initialActive);
  const [dateStr, setDateStr]       = useState(initialDate);
  const [timeStr, setTimeStr]       = useState(initialTime);
  const [pickerDate, setPickerDate] = useState(() => {
    if (initialDate && initialTime) return parseTimeToDate(initialDate, initialTime);
    if (initialDate) return new Date(initialDate);
    return new Date();
  });
 useEffect(() => {
      if (visible) {
        setMyAvail(
          myAvailability === true ? true :
          myAvailability === false ? false : null
        );
        setSavingAvail(false);
      }
    }, [visible, myAvailability]);

    const handleSaveAvailability = async () => {
      if (!event?.$id || !userId) return;
      setSavingAvail(true);
      try {
        await onSetAvailability({
          eventId: event.$id,
          userId,
          available: myAvail,
          name1,
          clubName1,
          
        });
        if (typeof onRefreshAvailability === "function") {
        await onRefreshAvailability();
      }
      } catch (e) {
        console.warn('Failed to save availability', e);
      } finally {
        setSavingAvail(false);
      }
    };
    const availablePlayers = (availabilityList || []).filter(p => p.available);


  const [showDate, setShowDate]     = useState(false);
  const [showTime, setShowTime]     = useState(false);
  const [error, setError]           = useState("");

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
      setShowDate(false);
      setShowTime(false);
      setError("");
    }
  }, [visible, event?.$id]);

  if (!visible || !event) return null;

  const club   = event.Club ?? "";
  const author = event.Name ?? event.createdBy ?? "Unknown";


  const canSubmit =
    name.trim().length > 0 &&
    isYmd(dateStr) &&
    String(timeStr).trim().length > 0;

  const changed =
    name.trim() !== initialName.trim() ||
    body.trim() !== initialBody.trim() ||
    Boolean(active) !== Boolean(initialActive) ||
    String(dateStr ?? "").trim() !== String(initialDate ?? "").trim() ||
    String(timeStr ?? "").trim() !== String(initialTime ?? "").trim();

  const handlePickDate = (_e, selected) => {
    setShowDate(false);
    const d = selected || pickerDate;
    const merged = new Date(d);
    if (timeStr) {
      const m = timeStr.match(/^(\d{1,2}):(\d{2})\s*(am|pm)$/i);
      if (m) {
        let H = Number(m[1]) % 12;
        if (/pm/i.test(m[3])) H += 12;
        merged.setHours(H, Number(m[2]), 0, 0);
      }
    }
    setPickerDate(merged);
    setDateStr(ymd(merged));
    const hh = merged.getHours();
    const mm = merged.getMinutes();
    setTimeStr(toAmPm(hh, mm));
  };

  const handlePickTime = (_e, selected) => {
    setShowTime(false);
    const d = selected || pickerDate;
    const merged = new Date(pickerDate);
    merged.setHours(d.getHours(), d.getMinutes(), 0, 0);
    setPickerDate(merged);
    setTimeStr(toAmPm(merged.getHours(), merged.getMinutes()));
  };

  const handleSave = async () => {
    if (!onUpdate) return;
    if (!canSubmit) {
      setError("Event Name, Date, and Time are required.");
      return;
    }
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
            <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">

              {!!error && (
                <View style={styles.errorBox}>
                  <Text style={styles.errorText}>{error}</Text>
                </View>
              )}

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

              <View style={styles.fieldBlock}>
                <Text style={styles.label}>Date & Time</Text>
                {isEditing ? (
                  <>
                    <View style={styles.row}>
                      <View style={styles.col}>
                        <Pressable onPress={() => setShowDate(true)} style={styles.inputPressable}>
                          <Text style={styles.inputPressableText}>{dateStr || "(Pick a date)"}</Text>
                        </Pressable>
                      </View>
                      <View style={styles.col}>
                        <Pressable onPress={() => setShowTime(true)} style={styles.inputPressable}>
                          <Text style={styles.inputPressableText}>{timeStr || "(Pick a time)"}</Text>
                        </Pressable>
                      </View>
                    </View>
                    {showDate && (
                      <DateTimePicker
                        mode="date"
                        value={pickerDate}
                        onChange={handlePickDate}
                        display={Platform.OS === "ios" ? "inline" : "calendar"}
                      />
                    )}
                    {showTime && (
                      <DateTimePicker
                        mode="time"
                        value={pickerDate}
                        onChange={handlePickTime}
                        display={Platform.OS === "ios" ? "spinner" : "clock"}
                      />
                    )}
                  </>
                ) : (
                  <View style={styles.row}>
                    <View style={styles.col}>
                      <View style={[styles.inputPressable, styles.readBox]}>
                        <Text style={styles.inputPressableText}>{dateStr || "—"}</Text>
                      </View>
                    </View>
                    <View style={styles.col}>
                      <View style={[styles.inputPressable, styles.readBox]}>
                        <Text style={styles.inputPressableText}>{timeStr || "—"}</Text>
                      </View>
                    </View>
                  </View>
                )}
              </View>

              <View style={styles.fieldBlock}>
                <Text style={styles.label}>Details</Text>
                {isEditing ? (
                  <TextInput
                    value={body}
                    onChangeText={setBody}
                    multiline
                    placeholder="Add event details…"
                    placeholderTextColor="#9CA3AF"
                    style={styles.textarea}
                  />
                ) : (
                  <View style={styles.bodyBox}>
                    <ScrollView style={styles.bodyScroll} contentContainerStyle={{ paddingBottom: 8 }}>
                      <Text style={styles.bodyText}>{initialBody || "(No details)"}</Text>
                    </ScrollView>
                  </View>
                )}
              </View>

              <View style={styles.toggleRow}>
                <Text style={styles.toggleLabel}>Event Active</Text>
                {isEditing ? (
                  <Pressable
                    onPress={() => setActive(!active)}
                    style={[styles.toggle, active ? styles.toggleOn : styles.toggleOff]}
                  >
                    <View style={[styles.toggleThumb, active ? styles.toggleThumbOn : styles.toggleThumbOff]} />
                  </Pressable>
                ) : (
                  <View style={[styles.badge, initialActive ? styles.badgeActive : styles.badgeInactive]}>
                    <Text style={styles.badgeText}>{initialActive ? "Active" : "Inactive"}</Text>
                  </View>
                )}
              </View>
            {/* ===== NEW: AVAILABILITY SECTION ===== */}

          {/* Player self-mark availability (always visible to non-admins; admins can ignore) */}
          { (
            <View style={styles.availBlock}>
                <Text style={styles.label}>My Availability</Text>

                <View style={styles.availButtonsRow}>
                  <Pressable
                    onPress={() => setMyAvail(true)}
                    style={[styles.avBtn, myAvail === true ? styles.avBtnOn : styles.avBtnOff]}
                  >
                    <Text style={[styles.avBtnText, myAvail === true ? styles.avBtnTextOn : styles.avBtnTextOff]}>
                      Available
                    </Text>
                  </Pressable>

                  <Pressable
                    onPress={() => setMyAvail(false)}
                    style={[styles.avBtn, myAvail === false ? styles.avBtnOnRed : styles.avBtnOff]}
                  >
                    <Text style={[styles.avBtnText, myAvail === false ? styles.avBtnTextOn : styles.avBtnTextOff]}>
                      Not Available
                    </Text>
                  </Pressable>
                </View>

              <Pressable
                onPress={handleSaveAvailability}
                disabled={savingAvail || myAvail == null}
                style={[
                  styles.btn,
                  (savingAvail || myAvail == null) ? styles.btnDisabled : styles.btnPrimary,
                  { marginTop: 10, alignSelf: 'flex-end' },
                ]}
              >
                <Text style={styles.btnTextPrimary}>{savingAvail ? 'Saving…' : 'Save Availability'}</Text>
              </Pressable>
            </View>
          )}

          {/* Admin list of available players */}
          {canEdit && (
            <View style={styles.availListBlock}>
              <Text style={styles.label}>Available Players ({availablePlayers.length})</Text>
              <View style={styles.availListBox}>
                <ScrollView style={{ maxHeight: 220 }} keyboardShouldPersistTaps="handled">
                  {availablePlayers.length === 0 ? (
                    <Text style={styles.emptyAvailText}>No players have marked themselves available yet.</Text>
                  ) : (
                    availablePlayers.map((p) => (
                      <View key={p.playerId} style={styles.availItemRow}>
                        <Text style={styles.availName}>{p.playerName}</Text>
                        <View style={[styles.badge, styles.badgeActive]}>
                          <Text style={styles.badgeText}>Available</Text>
                        </View>
                      </View>
                    ))
                  )}
                </ScrollView>
              </View>
            </View>
          )}

          {/* ===== END AVAILABILITY SECTION ===== */}
        </ScrollView>

            <View style={styles.footer}>
              {!isEditing ? (
                <>
                  {canDelete && (
                    <Pressable
                      onPress={updateDelete}
                      style={[styles.btn, styles.btnGhost, styles.rowCenter]}
                    >
                      <Text style={styles.delete}>Delete</Text>
                      <MaterialIcons name="delete" size={18} color="red" />
                    </Pressable>
                  )}
                  <View style={{ flex: 1 }} />
                  <Pressable onPress={onClose} style={[styles.btn, styles.btnSecondary]}>
                    <Text style={styles.btnTextSecondary}>Close</Text>
                  </Pressable>
                  {canEdit && (
                    <Pressable onPress={() => setIsEditing(true)} style={[styles.btn, styles.btnPrimary]}>
                      <Text style={styles.btnTextPrimary}>Edit</Text>
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
                      setError("");
                      setShowDate(false);
                      setShowTime(false);
                    }}
                    style={[styles.btn, styles.btnSecondary]}
                  >
                    <Text style={styles.btnTextSecondary}>Cancel</Text>
                  </Pressable>
                  <Pressable
                    disabled={!canSubmit || !changed || updating}
                    onPress={handleSave}
                    style={[styles.btn, (!canSubmit || !changed || updating) ? styles.btnDisabled : styles.btnPrimary]}
                  >
                    <Text style={styles.btnTextPrimary}>{updating ? "Saving…" : "Save"}</Text>
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
  backdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", alignItems: "center", justifyContent: "center", padding: 16 },
  card: { width: "100%", maxWidth: 560, maxHeight: "85%", borderRadius: 12, backgroundColor: "#fff", overflow: "hidden" },
  scroll: { flexGrow: 0 },
  scrollContent: { padding: 16 },

  heading: { fontSize: 20, fontWeight: "800", color: "#1f2937", marginBottom: 12 },

  errorBox: { backgroundColor: "#fee2e2", borderWidth: 1, borderColor: "#fecaca", padding: 10, borderRadius: 8, marginBottom: 12 },
  errorText: { color: "#b91c1c" },

  titleRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8, marginBottom: 8 },
  title: { fontSize: 20, fontWeight: "800", color: "#111827", flex: 1 },
  titleInput: {
    flex: 1, borderWidth: 1, borderColor: "#d1d5db", borderRadius: 8,
    paddingHorizontal: 12, paddingVertical: Platform.OS === "ios" ? 10 : 8, color: "#111827",
  },

  metaRow: { flexDirection: "row", alignItems: "center", marginBottom: 8, flexWrap: "wrap", gap: 6 },
  metaText: { color: "#374151" },
  metaDot: { color: "#9CA3AF" },

  badge: { alignSelf: "flex-start", borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4 },
  badgeActive: { backgroundColor: "#DCF2F3" },
  badgeInactive: { backgroundColor: "#F3F4F6" },
  badgeText: { color: "#0e6367", fontWeight: "700" },

  fieldBlock: { marginBottom: 12 },
  label: { fontSize: 14, color: "#374151", marginBottom: 6, fontWeight: "600" },

  row: { flexDirection: "row", gap: 12 },
  col: { flex: 1 },

  inputPressable: {
    borderWidth: 1, borderColor: "#d1d5db", borderRadius: 8,
    paddingHorizontal: 12, paddingVertical: Platform.OS === "ios" ? 10 : 12, justifyContent: "center",
  },
  inputPressableText: { color: "#111827" },

  readRow: { flexDirection: "row", gap: 8, alignItems: "center" },
  readText: { color: "#111827" },
  readDot: { color: "#9CA3AF" },

  textarea: {
    minHeight: 120, borderWidth: 1, borderColor: "#0e6367", borderRadius: 10,
    paddingHorizontal: 12, paddingVertical: 10, textAlignVertical: "top", color: "#111827",
  },

  bodyBox: { borderWidth: 1, borderColor: "#0e6367", borderRadius: 12, padding: 12, backgroundColor: "#fff" },
  bodyScroll: { maxHeight: 320 },
  bodyText: { color: "#111827", lineHeight: 22 },

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

  delete: { color: "red", fontWeight: "900", fontSize: 16 },
  rowCenter: { flexDirection: "row", alignItems: "center", gap: 6 },
  readBox: {
  backgroundColor: "#f9fafb",
  borderColor: "#e5e7eb",
},
availBlock: { marginTop: 6, marginBottom: 10 },
availButtonsRow: { flexDirection: 'row', gap: 8 },
avBtn: {
  flex: 1,
  borderRadius: 8,
  paddingVertical: 10,
  alignItems: 'center',
  borderWidth: 1,
  borderColor: '#d1d5db',
  backgroundColor: '#fff',
},
avBtnOff: { backgroundColor: '#fff', borderColor: '#d1d5db' },
avBtnOn: { backgroundColor: '#DCF2F3', borderColor: '#0e6367' },
avBtnOnRed: { backgroundColor: '#FEE2E2', borderColor: '#ef4444' },
avBtnText: { fontWeight: '700' },
avBtnTextOff: { color: '#374151' },
avBtnTextOn: { color: '#0e6367' },

availListBlock: { marginTop: 6, marginBottom: 12 },
availListBox: {
  borderWidth: 1,
  borderColor: '#e5e7eb',
  borderRadius: 10,
  backgroundColor: '#f9fafb',
  padding: 8,
},
availItemRow: {
  flexDirection: 'row',
  alignItems: 'center',
  paddingVertical: 8,
  borderBottomWidth: StyleSheet.hairlineWidth,
  borderBottomColor: '#e5e7eb',
  gap: 8,
},
availName: { flex: 1, color: '#111827', fontSize: 16 },
emptyAvailText: { color: '#6b7280', paddingVertical: 6 },

});
