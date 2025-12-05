import React, { useEffect, useState } from "react";
import { colors, common } from "../styles/common";
import {
  Modal,
  View,
  Text,
  Pressable,
  StyleSheet,
  TouchableWithoutFeedback,
  Keyboard,
} from "react-native";
import SelectBar from "./SelectBar";

export default function EmailTeamList({
  visible,
  onClose,
  teams,
  onOpenCreateTemplate,
  onSubmit,
  templateOptions = [],
  onEditTemplate,
}) {
  // Text shown in the SelectBar (what user types or the selected label)
  const [searchValue, setSearchValue] = useState("");
  // The selected template object: { label, value, ... } or null
  const [selectedTemplate, setSelectedTemplate] = useState("");

const isTemplateSelected = selectedTemplate !== "" ? true : false;

  const handleTemplateOptionChange = (val) => 
    {
    // Try to match what came back from SelectBar with an option's value
    const match = templateOptions.find((opt) => opt.value === val);

    if (match) 
    {
      // User actually selected a valid template
      setSelectedTemplate(match);
      setSearchValue(match.label); // show template name in the input
    } 
    else 
    {
      // User is typing / free-text search, not selecting an option
      setSelectedTemplate(null);
      setSearchValue(val); // keep whatever they typed
    }
  };


  const handleClose = () => 
    {
    // Optional: reset state when modal closes
    setSearchValue("");
    setSelectedTemplate(null);
    onClose?.();
  };

  const handleSend = () => {
    if (!selectedTemplate) return;
    onSubmit?.(selectedTemplate);
    setSearchValue("");
    setSelectedTemplate(null);
  };

  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={handleClose}>
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={styles.container}>
          <View style={styles.card}>
            <View style={styles.headerRow}>
              <Text style={styles.titleText}>Send Email</Text>
            </View>

            {/* Template selector */}
            <SelectBar
              placeholder="Search templates..."
              options={templateOptions} // [{ label, value }]
              value={searchValue}       // controlled input text
              onChange={handleTemplateOptionChange}
              maxResults={10}
            />

            {/* Edit / Create row */}
            <View style={styles.actionsRow}>
              <Pressable
                style={[
                  common.pushButtonNav,
                  styles.actionBtn,
                  !isTemplateSelected && { opacity: 0.5 },
                ]}
                disabled={!isTemplateSelected}
                onPress={() => 
                  {
                  onEditTemplate(selectedTemplate)
                }
                }
              >
                <Text style={styles.actionText}>Edit</Text>
              </Pressable>

              <Pressable
                style={[common.pushButtonNav, styles.actionBtn]}
                onPress={onOpenCreateTemplate}
              >
                <Text style={styles.actionText}>Create</Text>
              </Pressable>
            </View>

            {/* Send / Cancel row */}
            <View style={{ marginTop: 40, height: 2, backgroundColor: colors.border, width: "100%" }} />
            <View style={styles.actionsRow}>
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
                  !isTemplateSelected && { opacity: 0.5 },
                ]}
                disabled={!isTemplateSelected}
                onPress={handleSend}
              >
                <Text style={styles.actionText}>Send</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </TouchableWithoutFeedback>
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
});
