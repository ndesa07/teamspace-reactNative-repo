import React, { useEffect, useState } from "react";
import { Modal, View, Text, Pressable, StyleSheet, ScrollView, TextInput, Switch, Platform,TouchableWithoutFeedback,  Keyboard} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
function formatDate(iso) {
  const d = iso ? new Date(iso) : null;
  return d && !isNaN(d) ? d.toLocaleString() : "";
}

export default function AnnouncementDetailModal({
  visible,
  onClose,
  announcement,               // doc with $id, titleText/bodyText, Active, Club, name, createdAt/$createdAt
  heading = "Announcement",
  canEdit = false, 
  canDelete = false,            // 👈 pass true if role is admin/captain
  onUpdate, 
  updating =false,
  updateDelete                  // 👈 async ({ title, body, active }) => void
}) {
  const [isEditing, setIsEditing] = useState(false);

  const initialTitle = announcement?.titleText ?? announcement?.title ?? "";
  const initialBody  = announcement?.bodyText ?? announcement?.body ?? "";
  const initialActive = (announcement?.Active ?? announcement?.active) === true;

  const [title, setTitle]   = useState(initialTitle);
  const [body, setBody]     = useState(initialBody);
  const [active, setActive] = useState(initialActive);

  // Reset fields when modal opens or a new doc is shown
  useEffect(() => {
    if (visible) {
      setIsEditing(false);
      setTitle(initialTitle);
      setBody(initialBody);
      setActive(initialActive);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible, announcement?.$id]);

  if (!visible || !announcement) return null;

  const author = announcement.name ?? announcement.createdBy ?? "Unknown";
  const created = announcement.createdAt ?? announcement.$createdAt ?? null;
  const createdLabel = formatDate(created);
  const club = announcement.Club ?? announcement.clubName ?? "";

  const canSubmit = title.trim().length > 0 && body.trim().length > 0;
  const changed =
    title.trim() !== initialTitle.trim() ||
    body.trim()  !== initialBody.trim()  ||
    Boolean(active) !== Boolean(initialActive);

  const handleSave = async () => {
    if (!onUpdate) return;
    await onUpdate({ title: title.trim(), body: body.trim(), active });
    setIsEditing(false);
  };

  return (
   
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.card}>
            <ScrollView >
          <Text style={styles.heading}>{heading}</Text>

          {/* Title + Active badge or editor */}
          <View style={styles.titleRow}>
            {isEditing ? (
              <TextInput
                value={title}
                onChangeText={setTitle}
                placeholder="Title"
                placeholderTextColor="#9CA3AF"
                style={[styles.titleInput]}
              />
            ) : (
              <Text style={styles.title}>{initialTitle || "(Untitled)"}</Text>
            )}

            <View style={[styles.badge, initialActive ? styles.badgeActive : styles.badgeInactive]}>
              <Text style={styles.badgeText}>{initialActive ? "Active" : "Inactive"}</Text>
            </View>
          </View>

          {/* Meta row */}
          <View style={styles.metaRow}>
            {club ? <Text style={styles.metaText}>{club}</Text> : null}
            {createdLabel ? <Text style={styles.metaDot}>•</Text> : null}
            {createdLabel ? <Text style={styles.metaText}>{createdLabel}</Text> : null}
            <Text style={styles.metaDot}>•</Text>
            <Text style={styles.metaText}>by {author}</Text>
          </View>

          {/* Divider */}
          <View style={styles.sectionDivider} />

          {/* Active toggle (edit mode only) */}
          {isEditing && (
            <View style={styles.switchRow}>
              <Text style={styles.switchLabel}>Active</Text>
              <Switch
                value={active}
                onValueChange={setActive}
                thumbColor={active ? "#0e6367" : "#ccc"}
                trackColor={{ true: "#9fd2d4", false: "#ddd" }}
              />
            </View>
          )}

          {/* Body */}
          {isEditing ? (
            <View style={styles.bodyBox}>
              <TextInput
                value={body}
                onChangeText={setBody}
                multiline
                placeholder="Write your announcement…"
                placeholderTextColor="#9CA3AF"
                style={styles.bodyInput}
              />
            </View>
          ) : (
            <View style={styles.bodyBox}>
                <Text style={styles.body}>{initialBody}</Text>
            </View>
          )}
          </ScrollView>
          {/* Actions */}
          <View style={styles.actions}>
            {!isEditing ? (
              <>
              {canDelete &&(
              <Pressable onPress={updateDelete} style={({ pressed }) => [styles.btn, styles.btnGhost, pressed && styles.pressed,styles.row]}>
                  <Text style={styles.delete}>Delete</Text>
                  <MaterialIcons name = "delete" size = {18} color = "red">

                  </MaterialIcons>
                </Pressable>)}

                <View style ={[{flex: 1}]} />

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
                    setTitle(initialTitle);
                    setBody(initialBody);
                    setActive(initialActive);
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
    </Modal>
    
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.4)", alignItems: "center", justifyContent: "center", padding: 16 },
  card: {
  width: "100%",
  maxWidth: 560,
  maxHeight: "60%",          // 🔹 key change – give it actual height
  borderRadius: 12,
  backgroundColor: "#fff",
  overflow: "hidden",
  flexDirection: "column",
  padding: 16,
},
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

  bodyBox: 
  { 
    borderWidth: 1, 
    borderColor: "#0e6367", 
    borderRadius: 12, 
    padding: 12, marginTop: 4, 
    backgroundColor: "#fff", 
     },
  bodyScroll: { flex:1 },
  body: { color: "#111827", lineHeight: 22 },
  bodyInput: {
    minHeight: 160,
    textAlignVertical: "top",
    color: "#111827",
  },

  actions: { marginTop: 12, flexDirection: "row", justifyContent: "flex-end", gap: 8 },
  btn: { paddingHorizontal: 14, paddingVertical: 10, borderRadius: 10 },
  btnGhost: { backgroundColor: "transparent" },
  btnGhostText: { color: "#444", fontWeight: "700" },
  btnPrimary: { backgroundColor: "#0e6367" },
  btnDisabled: { backgroundColor: "#b8c4c6" },
  btnPrimaryText: { color: "#fff", fontWeight: "700" },
  pressed: { opacity: 0.9 },
  delete: {color: "red", fontWeight: "900", fontSize: "16"},
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center', // or 'flex-start'
  },
});
