import React, { useEffect, useState } from "react";
import { colors,common } from "../styles/common";
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
  KeyboardAvoidingView,
  Button
} from "react-native";
import CreateEmailTemplate from "./CreateEmailTemplate";
import SelectBar from "./SelectBar";

export default function EmailTeamList ({ visible, onClose, teams,onOpenCreateTemplate,onSubmit })
{



const handleClose = () => { 
    onClose?.();
  };

  return (
  <Modal visible={visible} animationType="fade" transparent onRequestClose={handleClose}>
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
    <View style = {styles.container}>
        <View style={styles.card}>
            <View style={styles.headerRow}>
            <Text style={styles.titleText}>Send Email</Text>
            </View>
            <SelectBar
            label="Select Templates to Email"
            />
            <View style={styles.actionsRow}>
                <Pressable
                style={[common.pushButtonNav, styles.actionBtn]}
                onPress={{}}
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




            {/* Send and Cancel Buttons */}
            <View>
                <View style = {{ marginTop: 40,height: 2,backgroundColor: colors.border, width: '100%',}}/>
                <View style={styles.actionsRow}>
                    <Pressable
                    style={[common.pushButtonNav, styles.actionBtn]}
                    onPress={handleClose}
                    >
                    <Text style={styles.actionText}>Cancel</Text>
                    </Pressable>

                    <Pressable
                    style={[common.pushButtonNav, styles.actionBtn]}
                    onPress={{}}
                    >
                    <Text style={styles.actionText}>Send</Text>
                    </Pressable>

                </View>
            </View>
        </View>
    </View>
    </TouchableWithoutFeedback>
    </Modal>
    
    
    );
};
const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  card: {
    width: '85%',
    backgroundColor: colors.surfaceAlt,
    borderRadius: 16,
    padding: 20,
    elevation: 5,
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    maxHeight: '75%',  
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  titleText: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.surface,
  },
  clubText: {
    color: colors.surface,
    marginBottom: 8,
  },
  sectionLabel: {
    color: colors.surface,
    marginBottom: 6,
    fontSize: 15,
    fontWeight: '500',
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
    flexDirection: 'row',
    marginTop: 14,
  },
  actionBtn: {
    flex: 1,
    marginHorizontal: 4,
    width: 'auto',
    borderColor: colors.border,
  },
  actionText: {
    fontSize: 18,
    color: colors.surface,
  },
  listWrap: {
  marginTop: 10,
  borderWidth: 1,
  borderColor: colors.border,
  borderRadius: 10,
  backgroundColor: colors.surfaceAlt,
  maxHeight: 180,         
  overflow: 'hidden',     
},
  listItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  listIndex: {
    width: 24,
    color: colors.surface,
    fontWeight: '600',
    
  },
  listItemText: {
    fontSize: 16,
    flex: 1,
    color: colors.surface,
  },
  removeBtn: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  removeText: {
    color: colors.surface,
    fontSize: 12,
  },
  emptyText: {
    color: colors.surface,
  },

});
