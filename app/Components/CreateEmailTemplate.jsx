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
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import SelectBar from "./SelectBar";

export default function CreateEmailTemplate({ visible, onClose, teams, onSubmit }) {
  const [templateName, setTemplateName] = useState("");
  const [userName, setUserName] = useState("");
  const [clubName, setClubName] = useState("");
  const [subject, setSubjectName] = useState("");
  const [eventBody, setEventBody] = useState("");

  // 🔹 rows now include `search` (what appears in SelectBar)
  const [rows, setRows] = useState([
    { teamId: null, search: "", details: "" },
  ]);

  const handleClose = () => {
    onClose?.();
  };

  // Build dropdown options from teams (memoised for performance)
  const teamOptions = useMemo(
    () =>
      (teams || []).map((team) => ({
        label: team.Name,
        value: team.$id,
      })),
    [teams]
  );

  // 🔹 Handle both typing + selecting from SelectBar
  const handleTeamChange = (index, newValue) => {
  setRows(prev =>
    prev.map((row, i) => {
      if (i !== index) return row;

      const match = teams.find(t => t.$id === newValue);

      if (match) {
        // user picked an option
        return {
          ...row,
          teamId: match.$id,
          search: match.Name,   // 👈 this makes the “opacity change” happen
        };
      }

      // user is just typing
      return {
        ...row,
        teamId: null,
        search: newValue,
      };
    })
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
        : [...prev, { teamId: null, search: "", details: "" }]
    );
  };

  const handleDeleteTeam = () => {
    setRows((prev) => (prev.length <= 1 ? prev : prev.slice(0, -1)));
  };

  const atMax = rows.length >= 20;
  const atMin = rows.length <= 1;

  const handleSend = () => 
    {
    const payload = {
      templateName: templateName,
      senderName: userName,
      clubName: clubName,
      subject: subject,
      body: eventBody,
      // only send the useful bits; no need to send `search`
      recipients: rows.map((row) => ({
        teamId: row.teamId,
        details: row.details,
      })),
    };
    onSubmit({
      templateName: templateName,
      senderName: userName,
      clubName: clubName,
      subject: subject,
      body: eventBody,
      // only send the useful bits; no need to send `search`
      recipients: rows.map((row) => ({
        teamId: row.teamId,
        teamName:row.search,
        details: row.details,
      })),
    });
  };

  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={handleClose}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <View style={styles.card}>
          <ScrollView showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          >
            {/* Header */}
            <View style={styles.headerRow}>
              <Text style={styles.titleText}>Create Email Template</Text>
            </View>

            {/* Template fields */}
            <View style={{ marginBottom: 0 }}>
              <Text style={styles.label}>Template Name</Text>
              <TextInput
                value={templateName}
                onChangeText={setTemplateName}
                placeholder="Enter template name"
                style={styles.input}
                placeholderTextColor={colors.surface}
              />
            </View>

            <View
              style={{
                marginTop: 5,
                marginBottom: 20,
                height: 2,
                backgroundColor: colors.border,
                width: "100%",
              }}
            />

            <View style={{ marginBottom: 0 }}>
              <Text style={styles.label}>Sender Name</Text>
              <TextInput
                value={userName}
                onChangeText={setUserName}
                placeholder="Enter sender name"
                style={styles.input}
                placeholderTextColor={colors.surface}
              />
            </View>

            <View style={{ marginBottom: 0 }}>
              <Text style={styles.label}>Club Name</Text>
              <TextInput
                value={clubName}
                onChangeText={setClubName}
                placeholder="Enter club name"
                style={styles.input}
                placeholderTextColor={colors.surface}
              />
            </View>

            <View style={{ marginBottom: 0 }}>
              <Text style={styles.label}>Email Subject</Text>
              <TextInput
                value={subject}
                onChangeText={setSubjectName}
                placeholder="Enter subject"
                style={styles.input}
                placeholderTextColor={colors.surface}
              />
            </View>

            <View style={styles.fieldBlock}>
              <Text style={styles.label}>Header</Text>
              <TextInput
                value={eventBody}
                onChangeText={setEventBody}
                multiline
                placeholder="Add email header"
                placeholderTextColor={colors.surface}
                style={styles.textarea}
              />
            </View>

            {/* --- Select Teams Section --- */}
            <View
              style={{
                marginTop: 10,
                marginBottom: 10,
                height: 2,
                backgroundColor: colors.border,
                width: "100%",
              }}
            />

            <Text style={[styles.label, { marginBottom: 10 }]}>
              Select Team Lists
            </Text>

            {rows.map((row, index) => (
              <View key={index} style={{ marginBottom: 10 }}>
                <Text style={styles.label}>Team {index + 1}</Text>
                <SelectBar
                  placeholder="Search teams..."
                  options={teams.map((team) => ({ label: team.Name, value: team.$id }))}
                  value={row.search} 
                  required = {true}
                  showError={false}
                  maxResults={10}
                  style={{ marginTop: 2, marginBottom: 10 }}
                  onChange={(val) => 
                    {
                      handleTeamChange(index, val)
                      
                    }}
                />

                <View style={styles.fieldBlock}>
                  <Text style={styles.label}>Details</Text>
                  <TextInput
                    value={row.details}
                    onChangeText={(text) =>
                      handleDetailsChange(index, text)
                    }
                    multiline
                    placeholder="Add details for this team…"
                    placeholderTextColor={colors.surface}
                    style={styles.textarea}
                  />
                </View>

                {index < rows.length - 1 && (
                  <View
                    style={{
                      marginTop: 6,
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

            {/* Bottom actions */}
            <View
              style={{
                marginTop: 30,
                height: 2,
                backgroundColor: colors.border,
                width: "100%",
              }}
            />
            <View style={styles.actionsRow}>
              <Pressable
                style={[common.pushButtonNav, styles.actionBtn]}
                onPress={handleClose}
              >
                <Text style={styles.actionText}>Cancel</Text>
              </Pressable>

            <Pressable
              style={[common.pushButtonNav, styles.actionBtn]}
              onPress={handleSend}
            >
              <Text style={styles.actionText}>Create</Text>
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
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceAlt,
    borderRadius: 10,
    padding: 12,
    color: colors.surface,
    marginBottom: 16,
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
  fieldBlock: { marginBottom: 10 },
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
