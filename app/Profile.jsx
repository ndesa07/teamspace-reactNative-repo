import React, {useState,useEffect} from 'react';
import { Text, StyleSheet ,View,TextInput} from 'react-native';
import { ScrollView } from 'react-native-gesture-handler';
import { account, tablesDb, ID } from "../lib/appwrite";
import { useLocalSearchParams,router } from 'expo-router';
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
    const [role,setRole] = useState(Array.isArray(params.role) ? params.role[0] : params.role);  
    const [teams,setTeams] = useState([]);
    const fullName = Array.isArray(params.name) ? params.name[0] : params.name;
    const playerId = Array.isArray(params.playerId) ? params.playerId[0] : params.playerId;
    const clubName = Array.isArray(params.clubName) ? params.clubName[0] : params.clubName;

    function populateNameFromParams() 
    {
        if (!fullName || typeof fullName !== "string") return;

        const parts = fullName.trim().split(/\s+/); // split on spaces

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
    useEffect(() => 
        {
            populateNameFromParams();
            getUser();
            getTeamsByPlayer();
        }, []);

    return (
    <Layout
        title="Profile"
        headerExtras 
        onPressSchedule={() =>
        router.push({ pathname: '/Schedule', params: { clubName,role,fullName,playerId } })}
        onPressTeams={() =>
        router.push({ pathname: '/Teams' , params: { clubName,role,fullName,playerId }})}
        onPressProfile={() =>
        router.push({ pathname: '/Profile' , params: { clubName,role,fullName,playerId }})}
    >
        <View style={common.screen}>
            <ScrollView contentContainerStyle={{ padding: 16 }}>

            {/* FIRST NAME */}
            <Text style={styles.label}>First Name</Text>
            <TextInput
                style={styles.input}
                placeholder="First name"
                value={firstName}
                onChangeText={setFirst}
                placeholderTextColor={colors.muted}
            />

            {/* LAST NAME */}
            <Text style={styles.label}>Last Name</Text>
            <TextInput
                style={styles.input}
                placeholder="Last name"
                value={lastName}
                onChangeText={setLast}
                placeholderTextColor={colors.muted}
            />

            {/* EMAIL */}
            <Text style={styles.label}>Email</Text>
            <TextInput
                style={styles.input}
                placeholder="you@domain.com"
                value={email}
                onChangeText={setEmail}
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

            {/* SPACER */}
            <View style={{ height: 20 }} />
            </ScrollView>
        </View>
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
})