import React, { useState, useMemo, useEffect } from "react";
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

export default function EditEmailTemplate({
  visible,
  onClose,
  teams,
  onSubmit,
  template,
  name,
  cname,
  teamsintemplate,
}) {
  // ----- Local form state -----
  const [templateName, setTemplateName] = useState("");
  const [senderName, setSenderName] = useState(name || "");
  const [clubName, setClubName] = useState(cname || "");
  const [subject, setSubject] = useState(""); // maps to subjectLine
  const [bodyText, setBodyText] = useState(""); // maps to bodyText

  // rows: [{ teamId, teamName, search, details }]
  const [rows, setRows] = useState([
    { teamId: null, teamName: "", search: "", details: "" },
  ]);

  // ----- Helper: build rows from TeamsInTemplate records -----
  const buildRowsFromTeamsInTemplate = (records = [], currentTemplateId) => {
    if (!currentTemplateId) {
      return [{ teamId: null, teamName: "", search: "", details: "" }];
    }

    // Only rows for this template
    const filtered = records.filter(
      (r) => r.templateId === currentTemplateId
    );

    if (filtered.length === 0) {
      return [{ teamId: null, teamName: "", search: "", details: "" }];
    }

    return filtered.map((r) => {
      const match = (teams || []).find((t) => t.$id === r.teamId);
      const teamName = match?.Name || "";

      return {
        teamId: match?.$id ?? r.teamId ?? null,
        teamName,
        search: teamName,              // preselect in SelectBar
        details: r.teamDetails || "",  // map from DB -> UI
      };
    });
  };

  // ----- Prefill when template / visibility / teamsintemplate changes -----
  useEffect(() => {
    if (!visible) return;

    if (template) {
      const {
        templateName: tmplName,
        senderName: tmplSender,
        clubName: tmplClub,
        subjectLine,
        bodyText: tmplBody,
      } = template;

      setTemplateName(tmplName || "");
      setSenderName(tmplSender ?? name ?? "");
      setClubName(tmplClub ?? cname ?? "");
      setSubject(subjectLine || "");
      setBodyText(tmplBody || "");

      setRows(
        buildRowsFromTeamsInTemplate(teamsintemplate || [], template.$id)
      );
    } else {
      // No template – just defaults
      setTemplateName("");
      setSenderName(name || "");
      setClubName(cname || "");
      setSubject("");
      setBodyText("");
      setRows([{ teamId: null, teamName: "", search: "", details: "" }]);
    }
  }, [template, visible, name, cname, teams, teamsintemplate]);

  // ----- Validation -----
  const isFormValid =
    templateName.trim().length > 0 &&
    senderName.trim().length > 0 &&
    clubName.trim().length > 0 &&
    subject.trim().length > 0 &&
    bodyText.trim().length > 0;

  // ----- Reset form back to original template / defaults -----
  const resetForm = () => {
    if (!template) {
      setTemplateName("");
      setSenderName(name || "");
      setClubName(cname || "");
      setSubject("");
      setBodyText("");
      setRows([{ teamId: null, teamName: "", search: "", details: "" }]);
      return;
    }

    const {
      templateName: tmplName,
      senderName: tmplSender,
      clubName: tmplClub,
      subjectLine,
      bodyText: tmplBody,
    } = template;

    setTemplateName(tmplName || "");
    setSenderName(tmplSender ?? name ?? "");
    setClubName(tmplClub ?? cname ?? "");
    setSubject(subjectLine || "");
    setBodyText(tmplBody || "");

    setRows(
      buildRowsFromTeamsInTemplate(teamsintemplate || [], template.$id)
    );
  };

  const handleClose = () => {
    resetForm();
    onClose?.();
  };

  // ----- SelectBar options -----
  const teamOptions = useMemo(
    () =>
      (teams || []).map((team) => ({
        label: team.Name,
        value: team.$id,
      })),
    [teams]
  );

  // ----- Handlers for teams + details -----
  const handleTeamChange = (index, newValue) => {
    setRows((prev) =>
      prev.map((row, i) => {
        if (i !== index) return row;

        const match = (teams || []).find((t) => t.$id === newValue);

        if (match) {
          return {
            ...row,
            teamId: match.$id,
            teamName: match.Name,
            search: match.Name,
          };
        }

        // If somehow user typed something not in options
        return {
          ...row,
          teamId: null,
          teamName: "",
          search: newValue,
        };
      })
    );
  };

  const handleDetailsChange = (index, text) => {
    setRows((prev) =>
      prev.map((row, i) => (i === index ? { ...row, details: text } : row))
    );
  };

  const handleAddTeam = () => {
    setRows((prev) =>
      prev.length >= 20
        ? prev
        : [...prev, { teamId: null, teamName: "", search: "", details: "" }]
    );
  };

  const handleDeleteTeam = () => {
    setRows((prev) => (prev.length <= 1 ? prev : prev.slice(0, -1)));
  };

  const atMax = rows.length >= 20;
  const atMin = rows.length <= 1;

  // ----- Save payload back to parent -----
  const handleSave = () => {
    const payload = {
      id: template?.$id, // EmailTemplate row id
      templateName,
      senderName,
      clubName,
      subjectLine: subject,
      bodyText,
      // Explicit mapping back to TeamsInTemplate structure
      teamsInTemplate: rows.map((row) => ({
        templateId: template?.$id,
        teamId: row.teamId,
        teamDetails: row.details,
      })),
    };

    onSubmit?.(payload);
  };

  // ----- UI -----
  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <View style={styles.card}>
          <ScrollView
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {/* Header */}
            <View style={styles.headerRow}>
              <Text style={styles.titleText}>Edit Email Template</Text>
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
                value={senderName}
                onChangeText={setSenderName}
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
                onChangeText={setSubject}
                placeholder="Enter subject"
                style={styles.input}
                placeholderTextColor={colors.surface}
              />
            </View>

            <View style={styles.fieldBlock}>
              <Text style={styles.label}>Header</Text>
              <TextInput
                value={bodyText}
                onChangeText={setBodyText}
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
                  options={teamOptions}
                  value={row.search}
                  required={true}
                  showError={false}
                  maxResults={10}
                  style={{ marginTop: 2, marginBottom: 10 }}
                  onChange={(val) => handleTeamChange(index, val)}
                />

                <View style={styles.fieldBlock}>
                  <Text style={styles.label}>Details</Text>
                  <TextInput
                    value={row.details}
                    onChangeText={(text) => handleDetailsChange(index, text)}
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
            <View className="actionsRow" style={styles.actionsRow}>
              <Pressable
                style={[common.pushButtonNav, styles.actionBtn]}
                onPress={handleClose}
              >
                <Text style={styles.actionText}>Cancel</Text>
              </Pressable>

              <Pressable
                style={[
                  common.pushButtonNav,
                  styles.actionBtn,
                  !isFormValid && { opacity: 0.5 },
                ]}
                onPress={handleSave}
                disabled={!isFormValid}
              >
                <Text style={styles.actionText}>Save Changes</Text>
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
    color: colors.surface,
    backgroundColor: colors.surfaceAlt,
  },
});
