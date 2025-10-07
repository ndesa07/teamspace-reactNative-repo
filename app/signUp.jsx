// app/signUp.jsx
import React, { useState, useMemo, useEffect, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Button,
  Keyboard,
  KeyboardAvoidingView,
  TouchableWithoutFeedback,
  TouchableOpacity,
  Platform,
  ScrollView,
} from "react-native";
import { Picker } from "@react-native-picker/picker";
import { router } from "expo-router";
import { common, colors } from "./styles/common";
import { account, ID, tablesDb } from "../lib/appwrite";
import { DB_ID, Table_ID } from "../lib/constants";
import { Query } from "../lib/appwrite";
import ClubSearchDropdown from "./Components/dropDownBar";


/* ----------------------------------- Page ----------------------------------- */
export default function SignUp() {
  const [role, setRole] = useState(""); // 'admin' | 'captain' | 'player'
  const [firstName, setFirst] = useState("");
  const [lastName, setLast] = useState("");
  const [email, setEmail] = useState("");
  const [clubName, setClubName] = useState("");
  //const [teamNumber, setTeamNumber] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  

  // Clubs list for captain/player
  const [clubs, setClubs] = useState([]);
  const [clubsLoading, setClubsLoading] = useState(false);
  const [clubsError, setClubsError] = useState(null);

  const isAdmin = role === "admin";
  const needsClubSelect = role === "captain" || role === "player";

  // Validation
  const isValid = useMemo(() => {
    if (!role) return false;
    if (!firstName || !lastName || !email || !password || !confirm) return false;
    if (password !== confirm) return false;

    if (isAdmin) {
      if (!clubName) return false;
    } else if (needsClubSelect) {
      if (!clubName || clubsLoading) return false;
    }
    return true;
  }, [role, firstName, lastName, email, password, confirm, clubName, isAdmin, needsClubSelect, clubsLoading]);

  const handleRoleChange = (v) => {
    setRole(v);
    if (v === "admin") {
      setClubName("");
    } else if (v === "captain" || v === "player") {
      setClubName("");
    } else if (v === "") {
      setFirst("");
      setLast("");
      setEmail("");
      setPassword("");
      setConfirm("");
      setClubName("");
    }
  };

  // Load club names for captain/player
  useEffect(() => {
    let alive = true;
    (async () => {
      if (!needsClubSelect) return;
      setClubsLoading(true);
      setClubsError(null);
      try {
        const res = await tablesDb.listRows("68cfc3d00013a224d25f", "name", [
          Query.orderAsc("clubName"),
          Query.limit(1000),
        ]);
        const docs = res?.documents || res?.rows || [];
        const names = Array.from(
          new Set(
            docs
              .map((d) => d?.clubName ?? d?.data?.clubName ?? "")
              .filter((s) => typeof s === "string" && s.trim().length > 0)
              .map((s) => s.trim())
          )
        );
        if (alive) setClubs(names);
      } catch (e) {
        if (alive) setClubsError(e?.message ?? String(e));
      } finally {
        if (alive) setClubsLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [needsClubSelect]);

  const onSubmit = async () => {
    try {
      // end any current session on this device (safe if none)
      try {
        await account.deleteSession?.("current");
      } catch {}

      // create user
      const newUser = await account.create(
        ID.unique(),
        email.trim(),
        password,
        `${firstName} ${lastName}`
      );

      // start session
      if (account.createEmailPasswordSession) {
        await account.createEmailPasswordSession(email.trim(), password);
      } else {
        // older SDK
        // @ts-ignore
        await account.createEmailSession(email.trim(), password);
      }

      // write member row (document id == user id)
      await tablesDb.createRow("68cfc3d00013a224d25f", "name", newUser.$id, {
        clubName: clubName,
        firstName,
        lastName,
        role,
        email: email.trim(),
      });

      router.replace("/home");
    } catch (e) {
      console.warn("Sign up failed:", e);
      alert(e?.message ?? String(e));
    }
  };

  // ---------- BLANK (except picker) UNTIL ROLE CHOSEN ----------
  if (!role) {
    return (
      <View style={common.screen}>
        <View style={[common.container, { justifyContent: "center", alignItems: "center" }]}>
        <View style={[common.header, { alignItems: "center" }]}>
            <Text style={common.title}>Select Role</Text>
            <View style={common.divider} />
          </View>
          <View style = {[{paddingBottom: "10"}]}> 
            <Text style = {[{color: "white"},{fontWeight: "40"},{fontSize: "20"}]}>To create a new club select the admin option. </Text>
            <Text style = {[{color: "white"},{fontWeight: "40"},{fontSize: "20"}]}>To Join a team select the captain or player option. </Text>

          </View>
          <View style={[styles.pickerWrap, { width: "80%" }]}>
            <Picker
              selectedValue={role}
              onValueChange={handleRoleChange}
              dropdownIconColor={colors.onSurface}
              style={styles.picker}
            >
              <Picker.Item label="Select role..." value="" />
              <Picker.Item label="Admin" value="admin" />
              <Picker.Item label="Captain" value="captain" />
              <Picker.Item label="Player" value="player" />
            </Picker>
          </View>
        </View>
        <View style ={[{flex: 1}]} />   
      </View>
    );
  }

  // ---------- FULL FORM ----------
  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
      <View style={common.screen}>
        <KeyboardAvoidingView
          style={common.container}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <View style={[common.header, { alignItems: "center" }]}>
            <Text style={common.title}>Create your account</Text>
            <View style={common.divider} />
          </View>

          <ScrollView contentContainerStyle={styles.form} keyboardShouldPersistTaps="handled">
            {/* Role */}
            <Text style={styles.label}>Role</Text>
            <View style={styles.pickerWrap}>
              <Picker
                selectedValue={role}
                onValueChange={handleRoleChange}
                dropdownIconColor={colors.onSurface}
                style={styles.picker}
              >
                <Picker.Item label="Admin / Coach" value="admin" />
                <Picker.Item label="Captain" value="captain" />
                <Picker.Item label="Player" value="player" />
              </Picker>
            </View>
            
            {isAdmin && (
              <>
                <Text style={styles.label}>Club Name (create)</Text>
                <TextInput
                  style={styles.input}
                  value={clubName}
                  onChangeText={setClubName}
                  placeholder="e.g., UNSW Cricket Club"
                  placeholderTextColor={colors.muted}
                />
                {/*
                <Text style={styles.label}>Team Number (create)</Text> 
                <TextInput
                  style={styles.input}
                  value={teamNumber}
                  onChangeText={setTeamNumber}
                  keyboardType="numeric"
                  placeholder="Create a numeric team code"
                  placeholderTextColor={colors.muted}
                />
                */}
              </>
            )}
            
            {/* Captain/Player: typeahead club select */}
            {needsClubSelect && (
              <>
                <Text style={styles.label}>Select Club</Text>
                {(
                  <ClubSearchDropdown
                    value={clubName}
                    onChange={setClubName}
                    required
                    showError={!clubName}         // or hook this to your form validation
                  />
                )}
              </>
            )}

            {/* Common fields */}
            <Text style={styles.label}>First Name</Text>
            <TextInput
              style={styles.input}
              value={firstName}
              onChangeText={setFirst}
              placeholder="First name"
              placeholderTextColor={colors.muted}
            />

            <Text style={styles.label}>Last Name</Text>
            <TextInput
              style={styles.input}
              value={lastName}
              onChangeText={setLast}
              placeholder="Last name"
              placeholderTextColor={colors.muted}
            />

            <Text style={styles.label}>Email</Text>
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              placeholder="you@domain.com"
              placeholderTextColor={colors.muted}
            />

            <Text style={styles.label}>Password</Text>
            <TextInput
              style={styles.input}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              placeholder="••••••••"
              placeholderTextColor={colors.muted}
            />

            <Text style={styles.label}>Confirm Password</Text>
            <TextInput
              style={styles.input}
              value={confirm}
              onChangeText={setConfirm}
              secureTextEntry
              placeholder="••••••••"
              placeholderTextColor={colors.muted}
            />
            {password && confirm && password !== confirm && (
              <Text style={styles.error}>Passwords do not match</Text>
            )}

            {/* Actions */}
            <View style={styles.actionsRow}>
              <View style={styles.buttonOutline}>
                <Button
                  title="Cancel"
                  onPress={() => {
                    Keyboard.dismiss();
                    handleRoleChange("");
                  }}
                  color={colors.onSurface}
                />
              </View>
              <View style={styles.buttonOutline}>
                <Button title="Create Account" onPress={onSubmit} disabled={!isValid} />
              </View>
            </View>

            <Text style={styles.signInLink} onPress={() => router.replace("/")}>
              Already have an account? Sign In
            </Text>
          </ScrollView>
        </KeyboardAvoidingView>
      </View>
    </TouchableWithoutFeedback>
  );
}

/* ---------------------------------- Styles ---------------------------------- */
const styles = StyleSheet.create({
  form: {
    paddingHorizontal: 16,
    paddingBottom: 24,
    gap: 8,
  },
  label: {
    color: colors.onBackground,
    fontWeight: "600",
    marginTop: 10,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    backgroundColor: colors.surface,
    color: colors.onSurface,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  pickerWrap: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    backgroundColor: colors.surface,
    overflow: "hidden",
  },
  picker: { color: colors.onSurface },
  error: { color: "#dc2626", marginTop: 4, fontWeight: "600" },
  actionsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 18,
  },
  buttonOutline: {
    flex: 1,
    borderRadius: 14,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    marginHorizontal: 6,
  },
  signInLink: {
    marginTop: 14,
    textAlign: "center",
    color: colors.onBackground,
    opacity: 0.85,
    textDecorationLine: "underline",
  },
  // Dropdown panel
  dropdown: {
    position: "absolute",
    top: 50,
    left: 0,
    right: 0,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    maxHeight: 220,
    zIndex: 20,
    elevation: 4, // Android shadow
  },
  dropdownItem: {
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
});
