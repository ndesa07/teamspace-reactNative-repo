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
import { Query } from "appwrite";
import ClubSearchDropdown from "./Components/dropDownBar";
import { sendWelcomeEmail } from "./Functions/WelcomeEmail";

/* ----------------------------------- Page ----------------------------------- */
export default function SignUp() {
  const [role, setRole] = useState("");
  const [firstName, setFirst] = useState("");
  const [lastName, setLast] = useState("");
  const [email, setEmail] = useState("");
  const [clubName, setClubName] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [sortCode, setSortCode] = useState("");
  const [captainSortCode, setCaptainSortCode] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [playerId, setPlayerId] = useState(null);

  const [clubs, setClubs] = useState([]);
  const [clubsLoading, setClubsLoading] = useState(false);
  const [clubsError, setClubsError] = useState(null);

  const isAdmin = role === "admin";
  const needsClubSelect = role === "captain" || role === "player";

  const isValid = useMemo(() => {
    if (!role) return false;
    if (!firstName || !lastName || !email || !password || !confirm) return false;
    if (password !== confirm) return false;
    if (isAdmin && !clubName) return false;

    return true;
  }, [role, firstName, lastName, email, password, confirm, clubName, isAdmin]);

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
    setIsSubmitting(true);
    try {
      try {
        
        await account.deleteSession?.("current");
      } catch {}
      let newUser;
      

      if (isAdmin) {
        const newSortCode = ID.unique();
        setSortCode(newSortCode);
        const newCaptainSortCode = ID.unique();
        setCaptainSortCode(newCaptainSortCode);


        await tablesDb.createRow("68cfc3d00013a224d25f", "clubtable", ID.unique(), {
          clubName,
          SortCode: newSortCode,
          SortCodeCaptain: newCaptainSortCode,
        });

        const newUser = await account.create(
        ID.unique(),
        email.trim(),
        password,
        `${firstName} ${lastName}`
      );

        await tablesDb.createRow("68cfc3d00013a224d25f", "name", newUser.$id, {
          clubName,
          firstName,
          lastName,
          role,
          email: email.trim(),
        });

        await sendWelcomeEmail({
          email,
          name: `${firstName} ${lastName}`,
          clubName,
          sortCode: newSortCode,
          SortCodeCaptain: newCaptainSortCode 
        });
      } 
      else 
        {
        const trimmedCode = sortCode.trim();

        const captainRes = await tablesDb.listRows("68cfc3d00013a224d25f", "clubtable", [
          Query.equal("SortCodeCaptain", [trimmedCode]),
          Query.limit(1),
        ]);
        const captainRow = captainRes.rows?.[0] || captainRes.documents?.[0] || null;

        let clubRow = null;
        let inferredRole = role; // whatever was selected in UI by default

        if (captainRow) {
          // Match found in SortCodeCaptain → this user is a captain
          clubRow = captainRow;

        }
        else 
        {
          const re = await tablesDb.listRows(
        "68cfc3d00013a224d25f",        // DB ID
        "clubtable",                   // table ID
        [
          Query.equal("SortCode", [trimmedCode]),   // 👈 search in SortCodeCaptain
          Query.limit(1),
        ]
      );
            const row1 = re.rows?.[0] || re.documents?.[0] || null;
            if (row1) 
              {
                clubRow = row1;
              }
        }
        if (!clubRow) {
          console.warn("No club found for that sort code");
          alert("No club found for that sort code");
          return;
        }
        
        newUser = await account.create(
        ID.unique(),
        email.trim(),
        password,
        `${firstName} ${lastName}`
      );
        const cname = clubRow.clubName || clubRow.data?.clubName;

        await tablesDb.createRow("68cfc3d00013a224d25f", "name", newUser.$id, {
          clubName: cname,
          firstName,
          lastName,
          role,
          email: email.trim(),
        });



        

      if (account.createEmailPasswordSession) {
        await account.createEmailPasswordSession(email.trim(), password);
      } else {
        await account.createEmailSession(email.trim(), password);
      }
      }
      await account.createVerification(
      "https://magic-portfolio-personal-projects-teamspace.appwrite.network/"
    );
      router.replace({
        pathname: "/VerifyEmail",
        params: { email, playerId: newUser.$id,password},
      });
      
      
    } catch (e) {
      console.warn("Sign up failed:", e);
      alert(e?.message ?? String(e));
    }
    finally {
    setIsSubmitting(false); // optional: or keep true if the screen navigates
  }
  };

  if (!role) {
    return (
      <View style={common.screen}>
        <View
          style={[common.container, { justifyContent: "center", alignItems: "center" }]}
        >
          <View style={[common.header, { alignItems: "center" }]}>
            <Text style={common.title}>Select Role</Text>
            <View style={common.divider} />
          </View>
          <View style={[{ paddingBottom: "10" }]}>
            <Text style={[{ color: colors.surface }, { fontWeight: "40" }, { fontSize: "20" }]}>
              To create a new club select the admin option.
            </Text>
            <Text style={[{ color: colors.surface }, { fontWeight: "40" }, { fontSize: "20" }]}>
              To Join a team select the captain or player option.
            </Text>
          </View>
          <View style={[styles.pickerWrap, { width: "80%" }]}>
            <Picker
              selectedValue={role}
              onValueChange={handleRoleChange}
              dropdownIconColor={colors.surface}
              style={styles.picker}
            >
              <Picker.Item label="Select role..." value="" color={colors.surface} />
              <Picker.Item label="Admin" value="admin" color={colors.surface} />
              <Picker.Item label="Captain" value="captain" color={colors.surface} />
              <Picker.Item label="Player" value="player" color={colors.surface} />
            </Picker>
          </View>
        </View>
        <View style={[{ flex: 1 }]} />
      </View>
    );
  }

  // ---------------------------------------------------------------------------

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
            <Text style={styles.label}>Role</Text>
            <View style={styles.pickerWrap}>
              <Picker
                selectedValue={role}
                onValueChange={handleRoleChange}
                dropdownIconColor={colors.surface}
                style={styles.picker}
              >
                <Picker.Item label="Admin / Coach" value="admin" color={colors.surface} />
                <Picker.Item label="Captain" value="captain" color={colors.surface} />
                <Picker.Item label="Player" value="player" color={colors.surface} />
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
                  maxLength ={254}
                />
              </>
            )}

            {!isAdmin && (
              <>
                <Text style={styles.label}>Sort Code (create)</Text>
                <TextInput
                  style={styles.input}
                  value={sortCode}
                  onChangeText={setSortCode}
                  placeholder="Enter Sort Code To Join A Team"
                  placeholderTextColor={colors.muted}
                  maxLength ={254}
                />
              </>
            )}

            <Text style={styles.label}>First Name</Text>
            <TextInput
              style={styles.input}
              value={firstName}
              onChangeText={setFirst}
              placeholder="First name"
              placeholderTextColor={colors.muted}
              maxLength ={254}
            />

            <Text style={styles.label}>Last Name</Text>
            <TextInput
              style={styles.input}
              value={lastName}
              onChangeText={setLast}
              placeholder="Last name"
              placeholderTextColor={colors.muted}
              maxLength ={254}
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
              maxLength ={254}
            />

            <Text style={styles.label}>Password</Text>
            <TextInput
              style={styles.input}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              placeholder="••••••••"
              placeholderTextColor={colors.muted}
              maxLength ={254}
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

            <View style={styles.actionsRow}>
              <View style={styles.buttonOutline}>
                <Button
                  title="Cancel"
                  onPress={() => {
                    Keyboard.dismiss();
                    handleRoleChange("");
                  }}
                  color={colors.surface}
                />
              </View>
              <View style={styles.buttonOutline}>
                <Button title="Create Account" onPress={onSubmit} disabled={!isValid || isSubmitting}  />
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
    backgroundColor: colors.surfaceAlt,
    color: colors.surface,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  pickerWrap: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    backgroundColor: colors.surfaceAlt,
    overflow: "hidden",
  },
  picker: { color: colors.surfaceAlt },
  error: { color: "#dc2626", marginTop: 4, fontWeight: "600" },
  actionsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 18,
  },
  buttonOutline: {
    flex: 1,
    borderRadius: 14,
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.border,
    marginHorizontal: 6,
  },
  signInLink: {
    marginTop: 14,
    textAlign: "center",
    color: colors.surface,
    opacity: 0.85,
    textDecorationLine: "underline",
  },
  dropdown: {
    position: "absolute",
    top: 50,
    left: 0,
    right: 0,
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    maxHeight: 220,
    zIndex: 20,
    elevation: 4,
  },
  dropdownItem: {
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
});
