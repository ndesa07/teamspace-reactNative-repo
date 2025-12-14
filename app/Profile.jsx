import React, { useState, useEffect } from 'react';
import { 
  Text, 
  StyleSheet,
  View,
  TextInput,
  Pressable,
  Button,
  Keyboard,
  Modal,
  Alert,
  ScrollView,KeyboardAvoidingView,Platform 
} from 'react-native';

import { account, tablesDb } from "../lib/appwrite";
import { useLocalSearchParams, router } from 'expo-router';
import { Query } from "react-native-appwrite"; 
import { common, colors } from './styles/common';
import Layout from "./home_layout";

export default function Profile() {
  const params = useLocalSearchParams();

  // --- STATE ---
  const [firstName, setFirst] = useState("");
  const [lastName, setLast] = useState("");
  const [email, setEmail] = useState("");
  const [originalEmail, setOriginalEmail] = useState("");
  const [teams, setTeams] = useState([]);
  const [players, setPlayers] = useState([]);
  const [playerSearch, setPlayerSearch] = useState(""); // 🔍 SEARCH BAR

  const name = Array.isArray(params.name) ? params.name[0] : params.name;
  const role = Array.isArray(params.role) ? params.role[0] : params.role;
  const playerId = Array.isArray(params.playerId) ? params.playerId[0] : params.playerId;
  const clubName = Array.isArray(params.clubName) ? params.clubName[0] : params.clubName;

  const isAdmin = typeof role === "string" && role.toLowerCase() === "admin";
  const isCaptain = typeof role === "string" && role.toLowerCase() === "captain";

  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordInput, setPasswordInput] = useState("");

  const [touched, setTouched] = useState({
    firstName: false,
    lastName: false,
    email: false,
  });

  const [initialValues, setInitialValues] = useState({
    firstName: "",
    lastName: "",
    email: "",
  });

  // --- HELPERS ---

  async function populateNameFromParams() {
    if (!name || typeof name !== "string") return;
    const parts = name.trim().split(/\s+/);

    const first = parts[0] || "";
    const last = parts.slice(1).join(" ") || "";

    setFirst(first);
    setLast(last);
  }

  async function getUser() {
    try {
      const user = await account.get();
      setEmail(user.email);
      setOriginalEmail(user.email);

      setInitialValues((prev) => ({
        ...prev,
        email: user.email,
      }));
    } catch (err) {
      console.error("Error in getUser:", err);
    }
  }

  async function getTeamsByPlayer() {
    try {
      const filters = [Query.equal("PlayerId", playerId)];
      const result = await tablesDb.listRows("68cfc3d00013a224d25f", "teamlists", filters);

      const extractedTeams = Array.isArray(result?.rows)
        ? result.rows.map((r) => ({
            id: r.TeamId,
            name: r.Team,
            club: r.ClubName,
          }))
        : [];

      setTeams(extractedTeams);
    } catch (err) {
      console.error("Error in getTeamsByPlayer:", err);
    }
  }

  async function getPlayerName() {
    try {
      const row = await tablesDb.getRow("68cfc3d00013a224d25f", "name", playerId);

      const first = row.firstName || row.data?.firstName || "";
      const last = row.lastName || row.data?.lastName || "";

      setFirst(first);
      setLast(last);

      setInitialValues((prev) => ({
        ...prev,
        firstName: first,
        lastName: last,
      }));
    } catch (err) {
      console.log("Error fetching player name:", err);
    }
  }

  async function getPlayersInClub() {
    try {
      const filters = [
        Query.equal("clubName", clubName),
        Query.equal("role", ["captain", "player"]),
      ];

      const allPlayers = await tablesDb.listRows("68cfc3d00013a224d25f", "name", filters);

      const extractedPlayers = Array.isArray(allPlayers?.rows)
        ? allPlayers.rows.map((r) => ({
            id: r.$id,
            name: `${r.firstName} ${r.lastName}`,
          }))
        : [];

      setPlayers(extractedPlayers);
    } catch (err) {
      console.error("Error fetching players:", err);
    }
  }

  const requestPassword = () => {
    setPasswordInput("");
    setShowPasswordModal(true);
  };

  async function onUpdate() {
    try {
      requestPassword();
    } catch (err) {
      console.error("Error updating profile:", err);
    }
  }

  const handlePasswordConfirm = async (password) => {
    setShowPasswordModal(false);

    try {
      const user = await account.get();

      // update email if changed
      if (touched.email && email !== user.email) {
        await account.updateEmail(email, password);
      }

      // update name if touched
      if (touched.firstName || touched.lastName) {
        await account.updateName(`${firstName} ${lastName}`);
      }

      const updateData = {};
      if (touched.firstName) updateData.firstName = firstName;
      if (touched.lastName) updateData.lastName = lastName;
      if (touched.email) updateData.email = email;

      await tablesDb.updateRow(
        "68cfc3d00013a224d25f",
        "name",
        playerId.trim(),
        updateData
      );

      Alert.alert("Profile Updated Successfully!");
    } catch (err) {
      console.log("Error updating profile:", err);
      Alert.alert("Error", "Incorrect password or update failed.");
    }
  };

  const handleCancel = () => {
    setFirst(initialValues.firstName);
    setLast(initialValues.lastName);
    setEmail(initialValues.email);
  };

  useEffect(() => {
    populateNameFromParams();
    getPlayerName();
    getUser();
    getTeamsByPlayer();
    getPlayersInClub();
  }, [name]);

  // --- FILTERED PLAYERS FOR SEARCH ---
  const filteredPlayers = players.filter((p) => {
    if (!playerSearch.trim()) return true;
    return p.name.toLowerCase().includes(playerSearch.trim().toLowerCase());
  });

  // --- UI ---

  return (
    <Layout
      title="Profile"
      headerExtras
      onPressSchedule={() =>
        router.push({
          pathname: '/Schedule',
          params: {
            clubName,
            role,
            name: `${initialValues.firstName} ${initialValues.lastName}`.trim(),
            playerId,
          },
        })
      }
      onPressTeams={() =>
        router.push({
          pathname: '/Teams',
          params: {
            clubName,
            role,
            name: `${initialValues.firstName} ${initialValues.lastName}`.trim(),
            playerId,
          },
        })
      }
      onPressProfile={() => {
        router.push({
          pathname: '/Profile',
          params: {
            clubName,
            role,
            name: `${initialValues.firstName} ${initialValues.lastName}`.trim(),
            playerId,
          },
        });
      }}
    >
        <KeyboardAvoidingView
    style={{ flex: 1 }}
    behavior={Platform.OS === "ios" ? "padding" : "height"}
    keyboardVerticalOffset={80} // adjust depending on your header height
  >
      <View style={common.screen}>
        <ScrollView
          contentContainerStyle={{
            paddingRight: 16,
            paddingLeft: 16,
            paddingBottom: 12,
          }}
        >

          {/* --- FIRST NAME --- */}
          <Text style={styles.label}>First Name</Text>
          <TextInput
            style={styles.input}
            placeholder="First name"
            placeholderTextColor={colors.muted}
            value={firstName}
            onChangeText={(text) => {
              setFirst(text);
              setTouched((prev) => ({ ...prev, firstName: true }));
            }}
          />

          {/* --- LAST NAME --- */}
          <Text style={styles.label}>Last Name</Text>
          <TextInput
            style={styles.input}
            placeholder="Last name"
            placeholderTextColor={colors.muted}
            value={lastName}
            onChangeText={(text) => {
              setLast(text);
              setTouched((prev) => ({ ...prev, lastName: true }));
            }}
          />

          {/* --- EMAIL --- */}
          <Text style={styles.label}>Email</Text>
          <TextInput
            style={styles.input}
            placeholder="you@domain.com"
            placeholderTextColor={colors.muted}
            value={email}
            onChangeText={(text) => {
              setEmail(text);
              setTouched((prev) => ({ ...prev, email: true }));
            }}
            autoCapitalize="none"
            keyboardType="email-address"
          />

          {/* --- ROLE (READ ONLY) --- */}
          <Text style={styles.label}>Role</Text>
          <View style={[styles.input, { justifyContent: "center" }]}>
            <Text style={{ color: colors.surface, opacity: 0.8 }}>
              {role ? role.charAt(0).toUpperCase() + role.slice(1) : "Player"}
            </Text>
          </View>

          {/* --- TEAMS --- */}
          <Text style={styles.label}>Teams</Text>
          <View style={styles.teamBox}>
            {teams.length === 0 ? (
              <Text style={{ color: colors.muted }}>Not assigned to any teams.</Text>
            ) : (
              teams.map((t, index) => (
                <Text key={index} style={{ color: colors.surface, marginBottom: 6 }}>
                  • {t.name}
                </Text>
              ))
            )}
          </View>

          {/* --- ALL PLAYERS --- */}
          {(isAdmin || isCaptain) && (
            <>
              <Text style={styles.label}>All Players</Text>

              {/* 🔍 SEARCH BAR (ADMIN ONLY) */}
              {isAdmin && (
                <TextInput
                  style={[styles.input, { marginTop: 6, marginBottom: 6 }]}
                  placeholder="Search players..."
                  placeholderTextColor={colors.muted}
                  value={playerSearch}
                  onChangeText={setPlayerSearch}
                />
              )}

              <View style={styles.scroll}>
                <ScrollView contentContainerStyle={{ padding: 10 }}>
                  {filteredPlayers.length === 0 ? (
                    <Text style={{ color: colors.muted }}>
                      No players found.
                    </Text>
                  ) : (
                    filteredPlayers.map((p, index) => (
                      <Pressable
                        key={p.id}
                        style={styles.playerBox}
                      >
                        <Text style={styles.playerIndex}>{index + 1}.</Text>
                        <Text style={styles.playerName}>{p.name}</Text>
                      </Pressable>
                    ))
                  )}
                </ScrollView>
              </View>
            </>
          )}

          {/* --- ACTION BUTTONS --- */}
          <View style={styles.actionsRow}>
            <View style={styles.buttonOutline}>
              <Button title="Cancel" color={colors.surface} onPress={handleCancel} />
            </View>

            <View style={styles.buttonOutline}>
              <Button title="Update Account" onPress={onUpdate} />
            </View>
          </View>

          <View style={{ height: 20 }} />
        </ScrollView>
      </View>
      </KeyboardAvoidingView>
    </Layout>
  );
}

const styles = StyleSheet.create({
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    backgroundColor: colors.surfaceAlt,
    color: colors.surface,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },

  label: {
    color: colors.onBackground,
    fontWeight: "600",
    marginTop: 10,
  },

  teamBox: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    backgroundColor: colors.surfaceAlt,
    padding: 12,
    marginTop: 4,
  },

  scroll: {
    height: 200,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    backgroundColor: colors.surfaceAlt,
    marginTop: 10,
  },

  playerBox: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
    marginBottom: 8,
  },

  playerIndex: {
    color: colors.muted,
    marginRight: 8,
    fontSize: 14,
    fontWeight: "600",
  },

  playerName: {
    color: colors.surface,
    fontSize: 15,
    fontWeight: "500",
  },

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

  // --- MODAL ---
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },

  modalBox: {
    width: "85%",
    backgroundColor: colors.surfaceAlt,
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: colors.border,
  },

  modalTitle: {
    color: colors.surface,
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 10,
  },

  modalText: {
    color: colors.muted,
    marginBottom: 16,
  },

  modalInput: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    backgroundColor: colors.background,
    color: colors.surface,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginBottom: 20,
  },

  modalButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
  },

  modalCancel: {
    paddingVertical: 10,
    paddingHorizontal: 20,
  },

  modalConfirm: {
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },

  cancelText: {
    color: colors.muted,
  },

  confirmText: {
    color: colors.surface,
    fontWeight: "700",
  },
});
