import React, {useState,useEffect,useCallback} from 'react';
import { Text, StyleSheet ,View,TextInput,Pressable,Button,Keyboard,Modal,Alert} from 'react-native';
import { ScrollView } from 'react-native-gesture-handler';
import { account, tablesDb, ID } from "../lib/appwrite";
import { useLocalSearchParams,router,useFocusEffect } from 'expo-router';
import { Query } from "react-native-appwrite"; 
import { MaterialIcons } from "@expo/vector-icons";
import { common,colors } from './styles/common';
import Layout from "./home_layout";



export default function Profile()
{
    const params = useLocalSearchParams();
    const [firstName, setFirst] = useState("");
    const [lastName, setLast] = useState("");
    const [email, setEmail] = useState("");
    const [originalEmail, setOriginalEmail] =  useState("");
    const [role,setRole] = useState(Array.isArray(params.role) ? params.role[0] : params.role);  
    const [teams,setTeams] = useState([]);
    const [players,setPlayers] = useState([]);
    const name = Array.isArray(params.name) ? params.name[0] : params.name;
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
        firstName: firstName,
        lastName: lastName,
        email: email,
        });

    async function populateNameFromParams() 
    {
        if (!name || typeof name !== "string") return;

        const parts = name.trim().split(/\s+/); // split on spaces

        const first = parts[0] || "";
        const last = parts.slice(1).join(" ") || ""; // supports middle names
        setFirst(first);
        setLast(last);
    }
    async function getUser() 
    {
        try 
        {
            const user = await account.get();
            setEmail(user.email);
            setOriginalEmail(user.email);

        } 
        catch (err) {
            console.error("Error in getUser:", err);
        }
    }
    async function getTeamsByPlayer()
    {
        try
        {
            const filters = [
                Query.equal("PlayerId", playerId),
            ];
            const result = await tablesDb.listRows("68cfc3d00013a224d25f","teamlists",filters)
            const extractedTeams = Array.isArray(result?.rows)
                ? result.rows.map(r => ({
                    id: r.TeamId,
                    name: r.Team,
                    club: r.ClubName,
                    }))
                : [];

            setTeams(extractedTeams);
            
        }
        
        catch(err) {
            console.error("Error in getTeamsByPlayer:", err);
        }
        
    }
        async function getPlayerName() {
    try {
        const row = await tablesDb.getRow("68cfc3d00013a224d25f", "name", playerId);

        // Extract names (supporting both Appwrite formats)
        const first = row.firstName || row.data?.firstName || "";
        const last = row.lastName || row.data?.lastName || "";
        setFirst(first);
        setLast(last);

        // Update your state here directly
        setInitialValues((prev) => ({
        ...prev,
        firstName: first,
        lastName: last,
        }));

    } catch (err) {
        console.log("Error fetching player name:", err);
    }
    }
    async function getPlayersInClub()
    {
        try
        {
            const filters = [
            Query.equal("clubName", clubName),
            Query.equal("role", ["captain", "player"])
            ];
            const allPlayers = await tablesDb.listRows("68cfc3d00013a224d25f","name",filters);
            const extractedPlayers = Array.isArray(allPlayers?.rows)
                ? allPlayers.rows.map(r => ({
                    id: r.$id,
                    name: `${r.firstName} ${r.lastName}`,
                    
                    }))
                : [];
            setPlayers(extractedPlayers);
        }
        catch(err)
        {
            console.error("Error in fetchingPlayers in clubL:",err);
        }

    }
    const requestPassword = () => {
                setPasswordInput("");
                setShowPasswordModal(true);
                };
    async function onUpdate()
    {
        try {
            requestPassword();
            console.log("Profile updated!");
        } catch (err) {
            console.error("Error updating profile:", err);
        }
    }
    const handlePasswordConfirm = async (password) => {
        setShowPasswordModal(false);

        try {
            // update the auth email using the password provided
             const user = await account.get();
            // 1) Only update auth email if user actually touched it AND changed it
            if (touched.email && email !== user.email) {
            await account.updateEmail(email, password);
            }

            // 2) Only update auth name if first or last name was touched
            if (touched.firstName || touched.lastName) {
            await account.updateName(`${firstName} ${lastName}`);
            }

            // 3) Build DB update object only with touched fields
            const updateData = {};
            if (touched.firstName) updateData.firstName = firstName;
            if (touched.lastName) updateData.lastName = lastName;
            if (touched.email) updateData.email = email;

            await tablesDb.updateRow(
            "68cfc3d00013a224d25f",
            "name",              
            playerId.trim(),             
            updateData,

            );

            console.log("Email & profile updated successfully!");
            Alert.alert("Profile Updated Succesfully!");
        } catch (err) {
            console.log("Error here",err)
            Alert.alert("Error", "Incorrect password or update failed.");
        }
        };
    const handleCancel = () => {
            setFirst(initialValues.firstName);
            setLast(initialValues.lastName);
            setEmail(initialValues.email);
    };
    
    useEffect(() => 
        {
            populateNameFromParams();
            getPlayerName();
            getUser();
            getTeamsByPlayer();
            getPlayersInClub();
            setInitialValues({
      firstName,
      lastName,
      email,
    });
        }, [name]);

    return (
    <Layout
        title="Profile"
        headerExtras 
        onPressSchedule={() =>
        router.push({ pathname: '/Schedule', params: { clubName,role,name: `${initialValues.firstName} ${initialValues.lastName}`.trim(),playerId } })}
        onPressTeams={() =>
        router.push({ pathname: '/Teams' , params: { clubName,role,name: `${initialValues.firstName} ${initialValues.lastName}`.trim(),playerId }})}
        onPressProfile={() => {
        router.push({
            pathname: '/Profile',
            params: { clubName, role, name: `${initialValues.firstName} ${initialValues.lastName}`.trim(), playerId }
        });
        }}
    >
        <View style={common.screen}>
            <ScrollView contentContainerStyle={{ paddingRight: 16, paddingLeft: 16, paddingBottom: 12 }}>

            {/* FIRST NAME */}
            <Text style={styles.label}>First Name</Text>
            <TextInput
                style={styles.input}
                placeholder="First name"
                value={firstName}
                
                onChangeText={(text) => 
                    {
                    setTouched((prev) => ({ ...prev, firstName: true }));
                    setFirst(text)}
                }
                
                placeholderTextColor={colors.muted}
            />

            {/* LAST NAME */}
            <Text style={styles.label}>Last Name</Text>
            <TextInput
                style={styles.input}
                placeholder="Last name"
                value={lastName}
                onChangeText={(text) => {
                    setTouched((prev) => ({ ...prev, lastName: true }));
                    setLast(text)}}
                placeholderTextColor={colors.muted}
            />

            {/* EMAIL */}
            <Text style={styles.label}>Email</Text>
            <TextInput
                style={styles.input}
                placeholder="you@domain.com"
                value={email}
                onChangeText={(text) => {
                    setEmail(text);
                    setTouched((prev) => ({ ...prev, email: true }));
                }}
                autoCapitalize="none"
                keyboardType="email-address"
                placeholderTextColor={colors.muted}
            />

            {/* ROLE (DISPLAY ONLY) */}
            <Text style={styles.label}>Role</Text>
            <View style={[styles.input, { justifyContent: "center" }]}>
                <Text style={{ color: colors.surface, opacity: 0.8 }}>
                {role ? role.charAt(0).toUpperCase() + role.slice(1) : "Player"}
                </Text>
            </View>

            {/* TEAMS SECTION */}
            <Text style={styles.label}>Teams</Text>
            <View
                style={{
                borderWidth: 1,
                borderColor: colors.border,
                borderRadius: 10,
                backgroundColor: colors.surfaceAlt,
                padding: 12,
                marginTop: 4,
                }}
            >
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
            {(isCaptain || isAdmin) && (
<>
            <Text style = {styles.label}>
            All Players
            </Text>
            <View style={styles.scroll}>
                <ScrollView contentContainerStyle={{ padding: 10 }}>
                    {players.length === 0 ? (
                    <Text style={{ color: colors.muted }}>No Players Added Yet</Text>
                    ) : (
                    players.map((p, index) => (
                        <Pressable
                        key={p.id || index}
                        style={styles.playerBox}
                        onPress={() => {
                            // later: open modal for this player
                            // openPlayerModal(p);
                        }}
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

                

            {/* SPACER */}
            <View style={styles.actionsRow}>
                <View style={styles.buttonOutline}>
                <Button
                    title="Cancel"
                    onPress={() => {
                    Keyboard.dismiss();
                    handleCancel();
                    }}
                    color={colors.surface}
                />
                </View>
                <View style={styles.buttonOutline}>
                <Button title="Update Account" onPress={onUpdate}/>
                </View>
            </View>
            <View style={{ height: 20 }} />
            </ScrollView>
        </View>
        <Modal
        transparent={true}
        visible={showPasswordModal}
        animationType="fade"
        >
        <View style={styles.modalOverlay}>
            <View style={styles.modalBox}>
            
            <Text style={styles.modalTitle}>Confirm Password</Text>
            <Text style={styles.modalText}>
                For security, please enter your current password.
            </Text>

            <TextInput
                style={styles.modalInput}
                placeholder="Enter password"
                placeholderTextColor={colors.muted}
                secureTextEntry
                value={passwordInput}
                onChangeText={setPasswordInput}
            />

            <View style={styles.modalButtons}>
                <Pressable
                style={styles.modalCancel}
                onPress={() => {
                    handleCancel();
                    setShowPasswordModal(false);
                    }}
                >
                <Text style={styles.cancelText}>Cancel</Text>
                </Pressable>

                <Pressable
                style={styles.modalConfirm}
                onPress={() => handlePasswordConfirm(passwordInput)}
                >
                <Text style={styles.confirmText}>Confirm</Text>
                </Pressable>
            </View>

            </View>
        </View>
        </Modal>
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
      label: {
          color: colors.onBackground,
          fontWeight: "600",
          marginTop: 10,
        },
        scroll: {
        height: 200,
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: 12,
        backgroundColor: colors.surfaceAlt,
        marginTop: 10,
        },

        playerBox: 
        {
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

})