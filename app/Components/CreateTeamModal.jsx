// File: Components/AddTeamModal.jsx
import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  Pressable,
  TouchableWithoutFeedback,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  ScrollView
} from 'react-native';
import { colors, common } from '../styles/common';
import Dropdown from './UniversalDropDownBar';

export default function AddTeamModal({ visible, clubName,onClose, onSubmit })
 {
  const [teamName, setTeamName] = useState('');

  const handleSubmit = () => {
  if (!teamName.trim()) return;
  onSubmit?.({ Name: teamName.trim(), ClubName: clubName });
  setTeamName('');
  onClose?.();
};


  const handleClose = () => {
    setTeamName('');
    onClose?.();
  };
  

  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={handleClose}>
      <KeyboardAvoidingView
        behavior={Platform.select({ ios: 'padding', android: undefined })}
        style={styles.container}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={styles.card}>
            <View style={styles.headerRow}>
              <Text style={styles.titleText}>Create Team</Text>
            </View>

            <Text style={styles.clubText}>Club: {clubName || '—'}</Text>

            <TextInput
              value={teamName}
              onChangeText={setTeamName}
              placeholder="Enter team name"
              style={styles.input}
              placeholderTextColor={colors.surface}
            />

            {/* Cancel and Create Buttons */}
            <View style={styles.actionsRow}>
              <Pressable
                style={[common.pushButtonNav, styles.actionBtn]}
                onPress={handleClose}
              >
                <Text style={styles.actionText}>Cancel</Text>
              </Pressable>

              <Pressable
                style={[common.pushButtonNav, styles.actionBtn]}
                disabled={!teamName}
                onPress={handleSubmit}
              >
                <Text style={styles.actionText}>Create</Text>
              </Pressable>

            </View>
          </View>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </Modal>
  );
}

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
