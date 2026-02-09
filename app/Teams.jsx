import React, { useState,useEffect } from 'react';
import { View, Text, Pressable,TextInput, StyleSheet, Keyboard,ScrollView,Switch } from 'react-native';
import { common, colors } from './styles/common';
import Layout from "./home_layout";
import { router, useLocalSearchParams } from 'expo-router';
import SelectBar from './Components/SelectBar';
import AddTeamModal from './Components/CreateTeamModal';
import EditTeamModal from './Components/EditTeam';
import { tablesDb, ID } from "../lib/appwrite";
import { Query } from "appwrite"; 
import { ActivityIndicator } from 'react-native';
import { Alert } from "react-native";
import EmailTeamList from './Components/EmailTeamList';
import CreateEmailTemplate from './Components/CreateEmailTemplate';
import SelectTeams from './Components/SelectTeams';
import { TeamListEmail } from './Functions/TeamListEmail';
import EditEmailTemplate from './Components/EditEmailTemplate';
import { databases } from '../lib/appwrite';






export default function Teams() {
  const params = useLocalSearchParams();
  const clubName = Array.isArray(params.clubName) ? params.clubName[0] : params.clubName;
  const role = Array.isArray(params.role) ? params.role[0] : params.role;
  const name = Array.isArray(params.name) ? params.name[0] : params.name;
  const playerId = Array.isArray(params.playerId) ? params.playerId[0] : params.playerId;
  const [confirmDeleteVisible, setConfirmDeleteVisible] = useState(false);
  const [pendingDelete, setPendingDelete] = useState(null); 
  const [selectedTeamLabel, setSelectedTeamLabel] = useState(""); // what appears in the input
  const [editVisible, setEditVisible] = useState(false);
  const [templateToEdit, setTemplateToEdit] = useState(null); 

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
  const [allEmailTemplates, setAllEmailTemplates] = useState([]);
  const [templateOptions, setTemplateOptions] = useState([]);
  const [teamsintemplate, setTeamsInTemplate] = useState([]);
  const [eventBody, setEventBody] = useState("");
  const [notes,setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState("");
  


  const onSaveNotes = async () => {
    if (!teamObj?.$id) return;

    setSaving(true);
    setSaveError("");
    try {
      await databases.updateDocument("68cfc3d00013a224d25f", "teams", teamObj.$id, {
        Notes: notes, // make sure your Appwrite attribute is exactly "Notes"
      });
      setSaved(true);

      // Optional: auto-clear "Saved" after 1.5s
      setTimeout(() => setSaved(false), 1500);
    } catch (e) {
      console.error(e);
      setSaveError("Couldn’t save. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleEditTemplate = (tpl) => {
    fetchTempalte(tpl.value).then((fullTpl) => {
      setTemplateToEdit(fullTpl);   // store the selected template
      setEditVisible(true);         // open the edit modal
      setSendEmail(false);          // close email modal
    });
    fetchTeamsInTemplate(tpl.value).then((teamsInTpl) => {
      setTeamsInTemplate(teamsInTpl);
    });

  };

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
const handleSendEmail = async (selectedTemplate) => {
    try {
      const people = await tablesDb.listRows(
        "68cfc3d00013a224d25f",
        "name",
        [
          Query.equal("clubName", clubName)
        ]
      );
      const emails = people.rows
        .filter(p => p.email && p.email.includes("@"))
        .map(p => p.email);
        
      if (!emails.length)
         {
        alert("No valid email addresses found for this club.");
      return;
    }
    
       const result = await TeamListEmail({
      templateId: selectedTemplate.value, 
      recipients: emails,
    });
    
    alert(`Email sent to ${emails.length} recipients.`);

    } 
    catch (e) 
    {
      console.warn("Failed to send email", e);
      alert("Failed to send email: " + (e?.message ?? String(e)));
    }
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
const toggleActiveStatus = async (newValue) => {
  try {
    setIsActive(newValue); // optimistic update

    await tablesDb.updateRow(
      "68cfc3d00013a224d25f",
      "teams",
      teamObj.$id,
      { Active: newValue }
    );

  } catch (err) {
    console.warn("Failed to update active status:", err);
    alert("Failed to update status. Please try again.");
    setIsActive(!newValue); // revert on error
  }
};
async function fetchAllEmailTemplates() {
    try {
      const response = await tablesDb.listRows(
        "68cfc3d00013a224d25f",
        "emailtemplate",
        [
          Query.equal("clubName", clubName)
        ]
      );
      return response.rows ?? response.documents ?? [];
    } 
    catch (e) 
    {
      console.warn('Failed to fetch email templates', e);
      return [];
    }
  };
  const loadEmailTemplates = async () => {
  try {
    const templates = await fetchAllEmailTemplates();   // 👈 call the provided function
    setTemplateOptions(
      templates.map((t) => ({
        label: t.templateName,
        value: t.$id,
      }))
    );
  } catch (err) {
    console.error("Failed to load templates:", err);
  }
};
useEffect(() => {
  if (sendEmail) {
    loadEmailTemplates();   // 🔥 auto-load templates
  }
}, [sendEmail]);

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
  async function fetchTempalte(templateId) {
    try {
      const response = await tablesDb.getRow(
        "68cfc3d00013a224d25f",
        "emailtemplate",
        templateId
      );
      return response;
    } 
    catch (e) 
    {
      console.warn('Failed to fetch template', e);
      return null;
    }
  }
  async function fetchTeamsInTemplate(templateId) 
  {
    try {
      const response = await tablesDb.listRows(
        "68cfc3d00013a224d25f",
        "teamsintemplate",
        [
          Query.equal("templateId", templateId)
        ]
      );
      return response.rows ?? response.documents ?? [];
    } 
    catch (e) 
    {
      console.warn('Failed to fetch teams in template', e);
      return [];
    }
  }
  const isValidAppwriteId = (id) =>
  typeof id === "string" &&
  id.length > 0 &&
  id.length <= 36 &&
  /^[A-Za-z0-9][A-Za-z0-9_]*$/.test(id);

  async function fetchNotes(teamId)
  {
    if (!isValidAppwriteId(teamId)) {
    // silently skip
    return;
  }
  if (!teamId) {
    setNotes("");
    return;
  }

  try {
    const team = await tablesDb.getRow(
      "68cfc3d00013a224d25f", // project/db id you're using with tablesDb
      "teams",               // table id
      teamId                 // row id
    );

    setNotes(team?.Notes ?? "");
  } catch (e) {
    console.warn("Failed to fetch notes", e);
    setNotes("");
  }
}


async function fetchActivityStatus(teamId) {
  if (!isValidAppwriteId(teamId)) {
    // silently skip
    return;
  }
  if (!teamId) {
    setIsActive(false);
    return;
  }
  

  try {
    const team = await tablesDb.getRow(
      "68cfc3d00013a224d25f",
      "teams",
      teamId
    );

    setIsActive(team?.Active ?? false);
  } catch (e) {
    console.warn("Failed to fetch activity status", e);
    setIsActive(false);
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
    const [isActive, setIsActive] = useState(teamObj?.isSelectionActive ?? false);
    const canSeePlayers = isAdmin || isActive;
useEffect(() => {
  if (!selectedTeam) {
    setNotes("");
    setIsActive(false);
    return;
  }

  fetchNotes(selectedTeam);
  fetchActivityStatus(selectedTeam);
}, [selectedTeam]);

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
              setSelectedTeam(null);  // clear selected team internally?
              setSelectedTeamLabel(""); // clear UI text
              setIsSelectOpen(true);

          }}
          onClose={() => setIsSelectOpen(false)}
          onChange={async (teamId) => {        
      
            const teamObj = teams.find(t => t.$id === teamId);
            setSelectedTeam(teamId);
            setSelectedTeamLabel(teamObj?.Name || "");
            setTeamObj(teamObj);
            setIsSelectOpen(false);
            const teamPlayers = await fetchTeamPlayers(teamId);
            setMatchPlayers(teamPlayers); 
            setIsActive(teamObj?.Active ?? false);
            setNotes(teamObj?.Notes ?? "");

            
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
              {isAdmin && (
                <>
                  {/* Active row */}
                  <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 10 }}>
                    <Text style={{ fontSize: 18, marginRight: 10, color: colors.surface, fontWeight: "600" }}>
                      Active:
                    </Text>

                    <Switch
                      value={isActive}
                      onValueChange={toggleActiveStatus}
                      trackColor={{ false: colors.border, true: colors.muted }}
                      thumbColor={isActive ? colors.surface : colors.border}
                    />

                    <Text style={{ marginLeft: 10, fontSize: 16, color: colors.surface }}>
                      {isActive ? "Active" : "Inactive"}
                    </Text>
                  </View>

                  {/* Details below */}
                    <View style={{ marginTop: 8 }}>
                      <Text style={styles.label}>Details</Text>

                      <TextInput
                        value={notes}
                        onChangeText={(t) => {
                          setNotes(t);
                          setSaved(false); // optional: reset saved state when user edits
                        }}
                        multiline
                        placeholder="Add event details…"
                        placeholderTextColor="#9CA3AF"
                        style={styles.textarea}
                      />

                      <View style={{ marginTop: 10 }}>
                        <Pressable
                          onPress={onSaveNotes}
                          disabled={saving || !teamObj?.$id}
                          style={[
                            common.buttonNav,
                            (saving || !teamObj?.$id) && { opacity: 0.5 },
                          ]}
                        >
                          <Text style={{ fontSize: 18, color: colors.surface }}>
                            {saving ? "Saving…" : saved ? "Saved ✓" : "Save details"}
                          </Text>
                        </Pressable>
                      </View>

                      {/* Optional tiny helper text */}
                      {!!saveError && <Text style={styles.saveErrorText}>{saveError}</Text>}
                    </View>
                </>
              )}


              <Text style={{ fontSize: 20, fontWeight: '600', marginTop: 20, marginBottom: 8, color: colors.surface }}>
                Players
              </Text>
              {canSeePlayers ?  (
                matchPlayers.map((p, idx) => {
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
                })
              ): (
                <Text style={{ fontSize: 16, color: colors.surface, marginTop: 8 }}>
                  Team list is not yet published. Please check back later.
                </Text>
              )}
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
        templateOptions={templateOptions}
        onSubmit={async (selectedTemplate)=> 
          {
          setSendEmail(false); 
          handleSendEmail(selectedTemplate);
        }}
        onEditTemplate={handleEditTemplate}
      />
      <EditEmailTemplate
        visible={editVisible}
        onClose={() => {
          setEditVisible(false);
          setSendEmail(true);
        }}
        teams={teams}
        template={templateToEdit} // whatever you loaded from DB
        name={name}
        cname={clubName}
        teamsintemplate={teamsintemplate}
        onSubmit={async(updated) => 
        { 
          try
          {
            await tablesDb.updateRow(
            "68cfc3d00013a224d25f",
            "emailtemplate",
            updated.id, // template row id
            {
              templateName: updated.templateName,
              senderName: updated.senderName,
              clubName: updated.clubName,
              subjectLine: updated.subjectLine, // note: subjectLine
              bodyText: updated.bodyText,       // note: bodyText
            }
          );
          const existingForTemplate = teamsintemplate.filter(
          (row) => row.templateId === updated.id
        );

        for (const row of existingForTemplate) 
        {
          await tablesDb.deleteRow("68cfc3d00013a224d25f", "teamsintemplate", row.$id);
        }
        
          // 3. Create new teamsintemplate rows from payload
        const toCreate = updated.teamsInTemplate || [];

          for (const entry of toCreate) 
            {
            await tablesDb.createRow( "68cfc3d00013a224d25f", "teamsintemplate", 
            ID.unique(),
              {
              templateId: updated.id,
              teamId: entry.teamId,
              teamDetails: entry.teamDetails,
            });
          }
          setEditVisible(false);
          setSendEmail(true);
          }
          catch (e)
          {
            console.warn("Failed to update template", e);
          }
          
        }}
      />
      <CreateEmailTemplate
        visible={isCreateTemplateVisible}
        name={name}
        cname={clubName}
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
                      teamDetails: row.details,
                    }
                  )
                );
                await Promise.all(waiting);

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
  label: {
    marginBottom: 6,
    fontSize: 16,
    fontWeight: "600",
    color: colors.surface,
  },
  textarea: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    padding: 12,
    minHeight: 90,
    color: colors.surface,
    textAlignVertical: "top",
  },
  saveBtn: {
  marginTop: 12,
  paddingVertical: 12,
  borderRadius: 12,
  alignItems: "center",

  backgroundColor: "#1D4ED8",       // strong blue button
  borderWidth: 1,
  borderColor: "rgba(147,197,253,0.35)",

  shadowColor: "#000",
  shadowOpacity: 0.25,
  shadowRadius: 8,
  shadowOffset: { width: 0, height: 4 },

  // Android
  elevation: 3,
},
saveBtnPressed: {
  opacity: 0.9,
  transform: [{ scale: 0.99 }],
},
saveBtnDisabled: {
  opacity: 0.5,
},
saveBtnText: {
  color: "#E5E7EB",
  fontWeight: "700",
  fontSize: 15,
  letterSpacing: 0.2,
},
saveErrorText: {
  marginTop: 8,
  color: "#FCA5A5",
  fontSize: 12,
},
saveBtnOverride: {
  marginTop: 12,     // spacing under Details box
},

btnPressed: {
  opacity: 0.9,
  transform: [{ scale: 0.98 }],
},

btnDisabled: {
  opacity: 0.5,
},

});

