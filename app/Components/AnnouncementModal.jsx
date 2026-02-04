import React, { useEffect, useState } from "react";
import {
  Modal, View, Text, TextInput, TouchableOpacity,
  TouchableWithoutFeedback, KeyboardAvoidingView, Keyboard,
  Platform, StyleSheet, Switch
} from "react-native";

export default function AnnouncementModal({
  visible,
  onClose,
  onSubmit,                   // ({ title, body, active }) => Promise<void> | void
  submitting = false,
  initialTitle = "",
  initialBody = "",
  initialActive = true,       // 👈 NEW: default to active
  heading = "New Announcement",
}) {
  const [title, setTitle] = useState(initialTitle);
  const [body, setBody] = useState(initialBody);
  const [active, setActive] = useState(initialActive); // 👈 NEW

  useEffect(() => 
    {
    if (visible) 
      {
      setTitle(initialTitle);
      setBody(initialBody);
      setActive(initialActive);
    }
  }, [visible, initialTitle, initialBody, initialActive]);

  const canSubmit = title.trim().length > 0 && body.trim().length > 0;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={styles.backdrop}>
          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : undefined}
            style={styles.card}
          >
            <Text style={styles.heading}>{heading}</Text>

            <TextInput
              style={styles.input}
              placeholder="Title"
              placeholderTextColor="#888"
              value={title}
              onChangeText={setTitle}
            />

            <TextInput
              style={[styles.input, styles.textarea]}
              placeholder="Write your announcement…"
              placeholderTextColor="#888"
              value={body}
              onChangeText={setBody}
              multiline
            />

            {/* 👇 NEW: Active toggle row */}
            <View style={styles.switchRow}>
              <Text style={styles.switchLabel}>Active</Text>
              <Switch
                value={active}
                onValueChange={setActive}
                thumbColor={active ? "#0e6367" : "#ccc"}
                trackColor={{ true: "#9fd2d4", false: "#ddd" }}
              />
            </View>

            <View style={styles.actions}>
              <TouchableOpacity onPress={onClose} style={[styles.btn, styles.btnGhost]}>
                <Text style={styles.btnGhostText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => onSubmit({ title: title.trim(), body: body.trim(), active })}
                disabled={!canSubmit || submitting}
                style={[
                  styles.btn,
                  !canSubmit || submitting ? styles.btnDisabled : styles.btnPrimary,
                ]}
              >
                <Text style={styles.btnPrimaryText}>{submitting ? "Posting…" : "Post"}</Text>
              </TouchableOpacity>
            </View>
          </KeyboardAvoidingView>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.4)", alignItems: "center", justifyContent: "center", padding: 16 },
  card: { width: "100%", maxWidth: 520, borderRadius: 16, backgroundColor: "#fff", padding: 16 },
  heading: { fontSize: 18, fontWeight: "700", marginBottom: 12 },
  input: { borderWidth: 1, borderColor: "#ddd", borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, color: "#222", backgroundColor: "#f7f7f7", marginBottom: 10 },
  textarea: { height: 200, textAlignVertical: "top" },

  // NEW
  switchRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 6, marginBottom: 6 },
  switchLabel: { fontSize: 16, color: "#222", fontWeight: "600" },

  actions: { flexDirection: "row", justifyContent: "flex-end", gap: 8, marginTop: 8 },
  btn: { paddingHorizontal: 14, paddingVertical: 10, borderRadius: 10, marginBottom: 10 },
  btnGhost: { backgroundColor: "transparent" },
  btnGhostText: { color: "#444", fontWeight: "600" },
  btnPrimary: { backgroundColor: "#0e6367" },
  btnDisabled: { backgroundColor: "#b8c4c6" },
  btnPrimaryText: { color: "#fff", fontWeight: "700" },
});
