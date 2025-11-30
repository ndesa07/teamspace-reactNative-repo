import React, { useState, useMemo } from "react";
import { colors, common } from "../styles/common";
import {
  Modal,
  View,
  Text,
  Pressable,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableWithoutFeedback,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import SelectBar from "./SelectBar";

export default function SelectTeams({ visible, onClose, teams = [] }) {
  // Each entry: { teamId, details }
  const [rows, setRows] = useState([{ teamId: null, details: "" }]);

  const handleClose = () => {
    onClose?.();
  };

  const teamOptions = useMemo(
    () =>
      teams.map((t) => ({
        label: t.Name || t.name || t.teamName || "Unnamed team",
        value: t.$id ?? t.id ?? t.Name,
      })),
    [teams]
  );

  const handleTeamChange = (index, newTeamId) => {
    setRows((prev) =>
      prev.map((row, i) =>
        i === index ? { ...row, teamId: newTeamId } : row
      )
    );
  };

  const handleDetailsChange = (index, text) => {
    setRows((prev) =>
      prev.map((row, i) =>
        i === index ? { ...row, details: text } : row
      )
    );
  };

  const handleAddTeam = () => {
    setRows((prev) =>
      prev.length >= 20
        ? prev
        : [...prev, { teamId: null, details: "" }]
    );
  };

  const handleDeleteTeam = () => {
    setRows((prev) =>
      prev.length <= 1 ? prev : prev.slice(0, -1)
    );
  };

  const atMax = rows.length >= 20;
  const atMin = rows.length <= 1;

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
          <View style={styles.card}>
            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={styles.headerRow}>
                <Text style={styles.titleText}>Select Teams</Text>
              </View>

              {rows.map((row, index) => (
                <View key={index} style={{ marginBottom: 20 }}>
                  <Text style={styles.label}>Team {index + 1}</Text>
                  <SelectBar
                    label="Select Team"
                    placeholder="Choose a team…"
                    options={teamOptions}
                    value={row.teamId}
                    onChange={(value) => handleTeamChange(index, value)}
                    maxResults={20}
                    disabled={false}
                  />

                  <View style={styles.fieldBlock}>
                    <Text style={styles.label}>Details</Text>
                    <TextInput
                      value={row.details}
                      onChangeText={(text) =>
                        handleDetailsChange(index, text)
                      }
                      multiline
                      placeholder="Add details…"
                      placeholderTextColor="#9CA3AF"
                      style={styles.textarea}
                    />
                  </View>

                  {index < rows.length - 1 && (
                    <View
                      style={{
                        marginTop: 10,
                        height: 1,
                        backgroundColor: colors.border,
                        width: "100%",
                      }}
                    />
                  )}
                </View>
              ))}

              <View style={styles.actionsRow}>
                <Pressable
                  style={[
                    common.pushButtonNav,
                    styles.actionBtn,
                    atMax && { opacity: 0.5 },
                  ]}
                  disabled={atMax}
                  onPress={handleAddTeam}
                >
                  <Text style={styles.actionText}>Add Team</Text>
                </Pressable>

                <Pressable
                  style={[
                    common.pushButtonNav,
                    styles.actionBtn,
                    atMin && { opacity: 0.5 },
                  ]}
                  disabled={atMin}
                  onPress={handleDeleteTeam}
                >
                  <Text style={styles.actionText}>Delete Team</Text>
                </Pressable>
              </View>

              {/* Optional: close button at the bottom */}
              <View style={{ marginTop: 20 }}>
                <Pressable
                  style={[common.pushButtonNav, styles.actionBtn]}
                  onPress={handleClose}
                >
                  <Text style={styles.actionText}>Close</Text>
                </Pressable>
              </View>
            </ScrollView>
          </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.45)",
  },
  card: {
    width: "85%",
    backgroundColor: colors.surfaceAlt,
    borderRadius: 16,
    padding: 20,
    elevation: 5,
    shadowColor: "#000",
    shadowOpacity: 0.25,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    maxHeight: "75%",
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  titleText: {
    fontSize: 20,
    fontWeight: "600",
    color: colors.surface,
  },
  actionsRow: {
    flexDirection: "row",
    marginTop: 14,
  },
  actionBtn: {
    flex: 1,
    marginHorizontal: 4,
    width: "auto",
    borderColor: colors.border,
  },
  actionText: {
    fontSize: 18,
    color: colors.surface,
    textAlign: "center",
  },
  fieldBlock: { marginTop: 8, marginBottom: 12 },
  label: {
    fontSize: 14,
    color: colors.surface,
    marginBottom: 6,
    fontWeight: "600",
  },
  textarea: {
    minHeight: 80,
    borderWidth: 1,
    borderColor: "#0e6367",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    textAlignVertical: "top",
    color: "#111827",
    backgroundColor: colors.surfaceAlt,
  },
});
