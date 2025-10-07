import React, { useEffect, useState } from "react";
import { Modal, View, Text, Pressable, StyleSheet, ScrollView, TextInput, Switch, Platform, TouchableWithoutFeedback, Keyboard } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";

// Accepts either ISO or your YYYY-M-D and returns a nice label
function formatWhen(dateVal) {
  if (!dateVal) return "";
  const maybeDate = new Date(dateVal);
  return String(dateVal); // your 'YYYY-M-D'
}

function isYmd(dateStr) {
  return /^\d{4}-\d{1,2}-\d{1,2}$/.test(dateStr.trim());
}

export default function EventDetailModal({
  visible,
  onClose,
  event,                 // doc with $id, EventName, EventBody, Active, Club, Name, Date, $createdAt
  canEdit = false,
  canDelete = false,
  onUpdate,             // async ({ EventName, EventBody, Active, Date }) => void
  updating = false,
  updateDelete,         // async () => void
}) {
  const [isEditing, setIsEditing] = useState(false);

  const initialName   = event?.EventName ?? event?.Title ?? "";
  const initialBody   = event?.EventBody ?? event?.Body ?? "";
  const initialActive = (event?.Active ?? false) === true;
  const initialDate   = event?.Date ?? ""; // you’re storing 'YYYY-M-D'

  const [name, setName]     = useState(initialName);
  const [body, setBody]     = useState(initialBody);
  const [active, setActive] = useState(initialActive);
  const [dateStr, setDateStr] = useState(initialDate); // edit as text in YYYY-M-D

  // Reset when opened or the record changes
  useEffect(() => {
    if (visible) {
      setIsEditing(false);
      setName(initialName);
      setBody(initialBody);
      setActive(initialActive);
      setDateStr(initialDate);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible, event?.$id]);

  if (!visible || !event) return null;

  const club    = event.Club ?? "";
  const author  = event.Name ?? event.createdBy ?? "Unknown";
  const created = event.$createdAt ?? event.createdAt ?? null;
  const createdLabel = created ? new Date(created).toLocaleString() : "";

  const canSubmit =
    name.trim().length > 0 &&
    isYmd(dateStr); // require valid YYYY-M-D; body optional

  const changed =
    name.trim() !== initialName.trim() ||
    body.trim() !== initialBody.trim() ||
    Boolean(active) !== Boolean(initialActive) ||
    dateStr.trim() !== (initialDate ?? "").trim();

  const handleSave = async () => {
    if (!onUpdate) return;
    await onUpdate({
      EventName: name.trim(),
      EventBody: body.trim(),
      Active: active,
      Date: dateStr.trim(), // keep your YYYY-M-D format
    });
    setIsEditing(false);
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
        <View style={styles.backdrop}>
          <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />

          <View style={styles.card}>

            {/* Title + Active badge / editor */}
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

            {/* Meta row */}
            <View style={styles.metaRow}>
              {club ? <Text style={styles.metaText}>{club}</Text> : null}
              {(club && (event.Date || createdLabel)) ? <Text style={styles.metaDot}>•</Text> : null}
             {event.Date ? <Text style={styles.metaText}>{formatWhen(event.Date)}</Text> : null}
             
              <Text style={styles.metaDot}>•</Text>
              <Text style={styles.metaText}>by {author}</Text>
            </View>

            <View style={styles.sectionDivider} />

            {/* Edit-only: Active + Date */}
            {isEditing && (
              <>
                <View style={styles.switchRow}>
                  <Text style={styles.switchLabel}>Active</Text>
                  <Switch
                    value={active}
                    onValueChange={setActive}
                    thumbColor={active ? "#0e6367" : "#ccc"}
                    trackColor={{ true: "#9fd2d4", false: "#ddd" }}
                  />
                </View>

                <View style={styles.inputRow}>
                  <Text style={styles.switchLabel}>Date</Text>
                  <TextInput
                    value={dateStr}
                    onChangeText={setDateStr}
                    placeholder="YYYY-M-D"
                    placeholderTextColor="#9CA3AF"
                    style={styles.dateInput}
                    keyboardType={Platform.OS === "ios" ? "numbers-and-punctuation" : "numeric"}
                    autoCapitalize="none"
                  />
                </View>
              </>
            )}

            {/* Body */}
            {isEditing ? (
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
            ) : (
              <View style={styles.bodyBox}>
                <ScrollView style={styles.bodyScroll} contentContainerStyle={{ paddingBottom: 8 }}>
                  <Text style={styles.body}>{initialBody || "(No details)"}</Text>
                </ScrollView>
              </View>
            )}

            {/* Actions */}
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

  bodyBox: { borderWidth: 1, borderColor: "#0e6367", borderRadius: 12, padding: 12, marginTop: 4, backgroundColor: "#fff" },
  bodyScroll: { maxHeight: 320 },
  body: { color: "#111827", lineHeight: 22 },
  bodyInput: { minHeight: 160, textAlignVertical: "top", color: "#111827" },

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
