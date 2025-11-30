import React, { useState } from 'react';
import { View, Text, Pressable, StyleSheet, Keyboard,ScrollView } from 'react-native';
import { common, colors } from './styles/common';
import Layout from "./home_layout";
import { router, useLocalSearchParams } from 'expo-router';
import SelectBar from './Components/SelectBar';
import AddTeamModal from './Components/CreateTeamModal';
import EditTeamModal from './Components/EditTeam';
import { tablesDb, ID } from "../lib/appwrite";
import { Query } from "react-native-appwrite"; 
import { ActivityIndicator } from 'react-native';
import { Alert } from "react-native";
import EmailTeamList from './Components/EmailTeamList';
import CreateEmailTemplate from './Components/CreateEmailTemplate';
import SelectTeams from './Components/SelectTeams';




export default function Teams() {
  const params = useLocalSearchParams();
  const clubName = Array.isArray(params.clubName) ? params.clubName[0] : params.clubName;
  const role = Array.isArray(params.role) ? params.role[0] : params.role;
  const name = Array.isArray(params.name) ? params.name[0] : params.name;
  const playerId = Array.isArray(params.playerId) ? params.playerId[0] : params.playerId;
  const [confirmDeleteVisible, setConfirmDeleteVisible] = useState(false);
  const [pendingDelete, setPendingDelete] = useState(null); 

  const [isSelectOpen, setIsSelectOpen] = useState(false);
  const [addTeamModalVisible, setAddTeamModalVisible] = useState(false);
  const [sendEmail, setSendEmail] = useState(false);
  const [editTeamModalVisible, setEditTeamModalVisible] = useState(false);
  const [teams, setTeams] = useState([]);
  const [selectedTeam, setSelectedTeam] = useState(null);
  const [teamObj, setTeamObj] = useState(null);
  const [players, setPlayers] = useState([]);
  const [removingIds, setRemovingIds] = useState(new Set());
  const [matchPlayers,setMatchPlayers]=useState([]);
  const [isCreateTemplateVisible, setIsCreateTemplateVisible] = useState(false);

  const [teamRows, setTeamRows] = useState([
    { teamId: null, details: "" },
  ]);
  const [templateData, setTemplateData] = useState({
    templateName: "",
    userName: "",
    clubName: "",
    subject: "",
    eventBody: "",
  });

  const selectedTeamName =teams.find(t => t.$id === selectedTeam)?.Name ?? null;
  const playerOptions = players.map(p => ({
  label:
    [p.firstName, p.lastName].filter(Boolean).join(' ').trim() ||
    p.username ||
    p.Name ||        // if your table uses capitalised Name
    p.$id,
  value: p.$id,
 
}));
const isAdmin = role === 'admin' || role === 'captain';
const canEditTeam = isAdmin && selectedTeam;


const handleOpenCreateTemplate = () => {
    setSendEmail(false);
    setIsCreateTemplateVisible(true); 
    
  };

const handleUpdateDelete = () => {
  Alert.alert(
    "Delete team?",
    "Are you sure you want to delete?",
    [
      { text: "Cancel", style: "cancel" },
      {
        text: "Continue",
        style: "destructive",
        onPress: async () => {
          try
        {

          setEditTeamModalVisible(false);
          tablesDb.deleteRow("68cfc3d00013a224d25f","teams",selectedTeam);
          const rows = await tablesDb.listRows(
            "68cfc3d00013a224d25f",
            "teamlists",
            [Query.equal("TeamId", selectedTeam)]
          );

          const deletePromises = rows.rows.map((row) =>
            tablesDb.deleteRow(
              "68cfc3d00013a224d25f",
              "teamlists",
              row.$id // or row.$id depending on your SDK
            )
          );

          await Promise.all(deletePromises);
          await fetchTeams();
          setMatchPlayers([]);
          setSelectedTeam(null);
        }
        catch (e) 
        {
          console.log(e?.message ?? String(e));
            alert(e?.message ?? String(e));
          }
        },
      },
    ]
  );
};


const removeMember = async (rowId) => {
  // optimistic UI: show spinner on this row
  setRemovingIds(prev => new Set(prev).add(rowId));
  try {
    await tablesDb.deleteRow("68cfc3d00013a224d25f", "teamlists", rowId);
    setMatchPlayers(prev => prev.filter(m => m.$id !== rowId));
  } catch (e) {
    console.warn('Failed to remove player', e);
  } finally {
    setRemovingIds(prev => {
      const next = new Set(prev);
      next.delete(rowId);
      return next;
    });
  }
};
  async function fetchTeamPlayers(teamId) {
  try {
    const res = await tablesDb.listRows(
      "68cfc3d00013a224d25f",
      "teamlists",       
      [
        Query.equal("TeamId", teamId),
        Query.limit(200),
        Query.orderAsc("Index"),
      ]
    );

    return res.rows ?? res.documents ?? [];
  } catch (e) {
    console.warn("Failed to fetch team players", e);
    return [];
  }
}
  async function fetchTeams() {
    try {
      const response = await tablesDb.listRows(
        "68cfc3d00013a224d25f",
        "teams",
        [
          Query.equal("ClubName", clubName)
        ]
      );
      setTeams(response.rows ?? response.documents ?? []);
    } 
    catch (e) 
    {
      console.warn('Failed to fetch teams', e);
    }
  }
  async function fetchPlayers()
  {
    try {
      const response = await tablesDb.listRows(
        "68cfc3d00013a224d25f",
        "name",
        [
          Query.equal("clubName", clubName),
          Query.or([
          Query.equal("role", "player"),
          Query.equal("role", "captain"),
        ]),
        ]
      );
      setPlayers(response.rows ?? response.documents ?? []);
    } 
    catch (e) 
    {
      console.warn('Failed to fetch players', e);
      return [];
    }
  }

  React.useEffect(() => {
    fetchTeams();
    fetchPlayers();
  }, []);
  return (
    <Layout
      title="Teams"
      showFooter={true}
      headerExtras
      onPressSchedule={() =>
        router.push({ pathname: '/Schedule', params: { clubName, role, name, playerId } })
      }
      onPressTeams={() =>
      {
        router.push({ pathname: '/Teams', params: { clubName, role, name, playerId } })
      }
        
        
      }
      onPressProfile={() =>
      {
        router.push({ pathname: '/Profile' , params: { clubName,role,name,playerId }})}   
      }
        
    >
      <View style={{ flex: 1, padding: 16, justifyContent: 'start', marginTop: -30 }}>
        <SelectBar
          placeholder="Search teams..."
          options={teams.map((team) => ({ label: team.Name, value: team.$id }))}
          value={selectedTeamName}
          required={true}
          
          showError={false}
          maxResults={10}
          style={{ marginTop: 20 }}
          onOpen={() => {
            fetchTeams();
             setSelectedTeam(null);
             setIsSelectOpen(true);

          }}
          onClose={() => setIsSelectOpen(false)}
          onChange={async (teamId) => {
            const teamObj = teams.find(t => t.$id === teamId);
            setSelectedTeam(teamId);
            setTeamObj(teamObj);
            setIsSelectOpen(false);
            const teamPlayers = await fetchTeamPlayers(teamId);
            setMatchPlayers(teamPlayers); 
          }}
        />

        <View style={{ borderRadius: 10, borderWidth: 1, borderColor: colors.border, flex: 1, margin: 5 }}>
          <ScrollView style={{ padding: 10 }}>
          {selectedTeam ? (
            <View>
              <Text style={{ fontSize: 22, fontWeight: '600', marginBottom: 10, color: colors.surface }}>
                Team Details
              </Text>

              <Text style={{ fontSize: 18, marginBottom: 5, color: colors.surface }}>
                <Text style={{ fontWeight: '600' }}>Name: </Text>{teamObj?.Name}
              </Text>

              <Text style={{ fontSize: 18, marginBottom: 5, color: colors.surface }}>
                <Text style={{ fontWeight: '600' }}>Club: </Text>{teamObj?.ClubName}
              </Text>

              <Text style={{ fontSize: 20, fontWeight: '600', marginTop: 20, marginBottom: 8, color: colors.surface }}>
                Players
              </Text>

              {matchPlayers.map((p, idx) => {
                const isRemoving = removingIds.has(p.$id);
                return (
                  <View
                    key={p.$id}
                    style={{
                      paddingVertical: 10,
                      borderBottomWidth: 1,
                      borderBottomColor: colors.border,
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 8,
                    }}
                  >
                    <Text style={{ fontSize: 16, color: colors.surface, flex: 1 }}>
                      {idx + 1}. {p.Player}
                    </Text>

                    {isAdmin && (
                      <Pressable
                        onPress={() => removeMember(p.$id)}
                        disabled={isRemoving}
                        style={{
                          paddingVertical: 6,
                          paddingHorizontal: 10,
                          borderRadius: 8,
                          borderWidth: 1,
                          borderColor: colors.border,
                          backgroundColor: colors.surfaceAlt,
                          opacity: isRemoving ? 0.6 : 1,
                        }}
                      >
                        {isRemoving ? (
                          <ActivityIndicator size="small" color={colors.surface} />
                        ) : (
                          <Text style={{ color: colors.surface, fontSize: 12 }}>Remove</Text>
                        )}
                      </Pressable>
                    )}
                  </View>
                );
              })}
            </View>
          ) : (
            <Text style={{ fontSize: 16, color: colors.surface }}>
              Please select a team to view details.
            </Text>
          )}
        </ScrollView>

        </View>

        {isAdmin && (
          <>
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
              <Pressable
                onPress={() => setAddTeamModalVisible(true)}
                style={common.buttonNav}
              >
                <Text style={{ fontSize: 18, color: colors.surface }}>Create Team</Text>
              </Pressable>
              <Pressable
                disabled={!canEditTeam}
                onPress={canEditTeam ? () => setEditTeamModalVisible(true) : undefined}
                style={[common.buttonNav, !canEditTeam && { opacity: 0.5 }]}
              >
                <Text style={{ fontSize: 18, color: colors.surface }}>
                  Edit Team
                </Text>
              </Pressable>
            </View>
           <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 10 }}>
              <Pressable
                  onPress={() => setSendEmail(true)}
                  style={common.buttonNav}
                >
                  <Text style={{ fontSize: 18, color: colors.surface }}> Send Email</Text>
                </Pressable>
            </View>
            </>
          )}
        
      </View>
      <EmailTeamList
      visible = {sendEmail}
      onClose={() => setSendEmail(false)}
      teams={teams}
      onOpenCreateTemplate={handleOpenCreateTemplate} 

      />
      <CreateEmailTemplate
        visible={isCreateTemplateVisible}
        onClose={() =>{
          setIsCreateTemplateVisible(false)
          setSendEmail(true)
        } }
        onOpenSelectTeams ={() => {
          setIsCreateTemplateVisible(false);
          setIsSelectTeamsTemplateVisible(true);
        }}
        teams={teams}
        onSubmit={
          async ({ templateName, senderName, subject,teamName, body, recipients }) => 
            {
            try 
            {
              const uniqueId = ID.unique();
              await tablesDb.createRow(
                "68cfc3d00013a224d25f",
                "emailtemplate",
                uniqueId,
                {
                  templateName: templateName,
                  senderName: senderName,
                  clubName: clubName,
                  subjectLine: subject,
                  bodyText: body,
                }
              );

                const waiting = recipients.filter(r => r.teamId) 
                .map((row, index)=>
                  tablesDb.createRow(
                    "68cfc3d00013a224d25f",
                    "teamsintemplate",
                    ID.unique(),
                    {
                      templateId: uniqueId,
                      teamId: row.teamId,
                      teamName: row.search,
                      teamDetails: row.details,
                    }
                  )
                );
                await Promise.all(waiting);
              console.log("Sending email with template:", 
                {
                templateName,
                senderName,
                clubName,
                subject,
                body,
                recipients,
              });
              setIsCreateTemplateVisible(false);
            } 
            catch (e) 
            {
              console.warn("Failed to send email", e);
            }
      }}
      />
      

      <AddTeamModal
        visible={addTeamModalVisible}
        clubName = {clubName}
        onClose={() => setAddTeamModalVisible(false)}
        onSubmit={async ({ Name, ClubName }) => {
          try {
          await tablesDb.createRow(
                  "68cfc3d00013a224d25f",
                  "teams",
                  ID.unique(),
                  {
                    Name: Name,
                    ClubName: ClubName,
                  }
                );
                await fetchTeams();
        } catch (e) {
          console.warn('Failed to create team', e);
        }
        }}
      />
      <EditTeamModal
      visible={editTeamModalVisible}
      teamName={teamObj?.Name ?? ''}   
      clubName={clubName}

      playerOptions={playerOptions}
      teamId={selectedTeam}
      onClose={() => setEditTeamModalVisible(false)}
      updateDelete={handleUpdateDelete}
      onSubmit={async ({ teamId, teamName, players, date }) => {
      try
      {
       await Promise.all(
        players.map(p =>
          tablesDb.createRow(
            "68cfc3d00013a224d25f",
            "teamlists",
            ID.unique(),
            {
              Team:     teamName,
              Player:   p.label,      // display name
              ClubName: clubName,
              PlayerId: p.value,      // user $id
              TeamId:   teamId,       // team $id
              MatchDate: date
            }
          )
        )
      );
      const teamPlayers = await fetchTeamPlayers(teamId);
      setMatchPlayers(teamPlayers); 
      setEditTeamModalVisible(false);
      
     } 
     catch (e) {
      console.warn("Failed to save team members", e);
    }
      
      
      }}
      />
    </Layout>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    // Transparent tap-catcher above everything
    backgroundColor: 'transparent',
    zIndex: 9999,
  },
});

