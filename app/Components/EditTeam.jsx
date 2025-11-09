import { React, useState } from 'react';
import {View,Text,Modal,TextInput, Pressable,StyleSheet,KeyboardAvoidingView,TouchableWithoutFeedback, Keyboard, ScrollView,Platform } from 'react-native';
import { colors, common } from '../styles/common';
import Dropdown from './UniversalDropDownBar';
import DateTimePicker from "@react-native-community/datetimepicker";


export default function EditTeamModal({ visible,teamName,teamId ,clubName,playerOptions, onClose, onSubmit }) 
{
    const [selectedPlayers, setSelectedPlayers] = useState([]);
    const [playerValue, setPlayerValue] = useState(null);
    const [matchDate,setMatchDate] = useState(null);
    const [showDatePicker, setShowDatePicker] = useState(true);
      const handleSubmit = () => {
        onSubmit({
          teamId,
          teamName,
          players: selectedPlayers, 
          date: matchDate, 
        });
        setSelectedPlayers([]);
        setPlayerValue(null);
        onClose?.();
      };
      const onChangeDate = (_, d) => {
        if (d) setMatchDate(d);
        setShowDatePicker(false);
      };
      const handleClose = () => {
        setSelectedPlayers([]);
        setPlayerValue(null);
        onClose?.();
      };
      const handleSelectPlayer = (val) => {
        setPlayerValue(val);
        if (val && !selectedPlayers.includes(val)) {
          setSelectedPlayers((prev) => [...prev, val]);
        }
        setTimeout(() => setPlayerValue(null), 0);
      };
      const removeAt = (idx) => {
        setSelectedPlayers((prev) => prev.filter((_, i) => i !== idx));
      };
      
    
    return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={handleClose}>
      <KeyboardAvoidingView
        behavior={Platform.select({ ios: 'padding', android: undefined })}
        style={styles.container}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={styles.card}>
            <View style={{ marginTop: 10 }}>
              <View style={styles.headerRow}>
                <Text style={styles.titleText}>Edit Team</Text>
              </View>
              <Text style={styles.clubText}>Club: {clubName}</Text>
              <Text style={styles.sectionLabel}>Team Name</Text>
              <TextInput
                style={styles.input}
                value={teamName}
                onChangeText={() => {}}
                placeholder="Enter team name"
                placeholderTextColor={colors.muted}
              />

              {/* 
              <Text style={styles.sectionLabel}>Match Date</Text>
              <Pressable style={styles.dateDisplayBox} onPress={() => setShowDatePicker(true)}>
              <Text style={styles.dateDisplayText}>
                {matchDate ? matchDate.toDateString() : "Pick a date"}
              </Text>
            </Pressable>

              {showDatePicker && (
                  <DateTimePicker
                    mode="date"
                    value={matchDate || new Date()}
                    onChange={onChangeDate}
                    display={Platform.OS === 'ios' ? 'spinner' : 'calendar'}
                    textColor={colors.surface}   // iOS only
                  />
              )}
              */}
              <Text style={styles.sectionLabel}>Player Selection</Text>
              <Dropdown
                value={playerValue}
                onChange={handleSelectPlayer}
                options={playerOptions}
                placeholder="Select Player"
              />
                <View style={styles.listWrap}>
                    <ScrollView
                        keyboardShouldPersistTaps="handled"
                        nestedScrollEnabled
                        keyboardDismissMode="on-drag"
                        scrollEventThrottle={16}
                        showsVerticalScrollIndicator
                    >
                    {selectedPlayers.length === 0 ? (
                    <Text style={styles.emptyText}>No players selected</Text>
                    ) : (
                    selectedPlayers.map((name, idx) => (
                        <View key={`${name}-${idx}`} style={styles.listItemRow}>
                        <Text style={styles.listIndex}>{idx + 1}.</Text>
                        <Text style={styles.listItemText}>
                          {typeof name === "object" ? name.label ?? name.value : name}
                        </Text>
                        <Pressable onPress={() => removeAt(idx)} style={styles.removeBtn}>
                            <Text style={styles.removeText}>Remove</Text>
                        </Pressable>
                        </View>
                    ))
                    )}
                    </ScrollView>
                </View>
            </View>
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
                <Text style={styles.actionText}>Save</Text>
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
  dateDisplayBox: {
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceAlt,
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
  },
  dateDisplayText: {
    color: colors.surface,
    fontSize: 16,
  },
  

});
