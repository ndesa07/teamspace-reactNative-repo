// app/home.jsx
import React, { useEffect, useState, useCallback } from "react";
import { View, Text, ScrollView, StyleSheet, Button,TouchableWithoutFeedback,Keyboard } from "react-native";
import Layout from "./home_layout";
import { common,colors } from "./styles/common";
import { account, tablesDb, ID } from "../lib/appwrite";
import { MaterialIcons } from "@expo/vector-icons";
import AnnouncementModal from "./Components/AnnouncementModal.jsx";
import { Query } from "react-native-appwrite"; // or from your wrapper if re-exported
import { Pressable } from "react-native";
import AnnouncementDetailModal from "./Components/AnnouncementDetailModal";
import { router } from "expo-router";


export default function Home() {
  const [role, setRole] = useState(null);
  const [clubName, setClubName] = useState(null);
  const [firstName, setFirstName] = useState(null);
  const [lastName, setLastName] = useState(null);
  const [playerId,setPlayerId] = useState(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [announcements, setAnnouncements] = useState([]);
  const [annLoading, setAnnLoading] = useState(false);
  const [annError, setAnnError] = useState(null);

  const [showAddModal, setShowAddModal] = useState(false);
  const [posting, setPosting] = useState(false);
  
  const [isEditing, setIsEditing] = useState(false);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [deleting, setDeleting] = useState(false);

  const [detailVisible, setDetailVisible] = useState(false);
  const [selectedAnnouncement, setSelectedAnnouncement] = useState(null);
  const [updatingDetail, setUpdatingDetail] = useState(false);


  // 1) Load current user profile row (role/club/name)
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const user = await account.get();
        const row = await tablesDb.getRow("68cfc3d00013a224d25f", "name", user.$id); // ensure "name" is your collection ID
        if (!alive) return;
        setRole(row?.role ?? row?.data?.role ?? null);
        setClubName(row?.clubName ?? row?.data?.clubName ?? null);
        setFirstName(row?.firstName ?? row?.data?.firstName ?? null);
        setLastName(row?.lastName ?? row?.data?.lastName ?? null);
        setPlayerId(user.$id);
      } catch (e) {
        if (alive) setError(e?.message ?? String(e));
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, []);

  // 2) Function to (re)load announcements for current Club
  const loadAnnouncements = useCallback(async () => {
    if (!clubName) {
      setAnnouncements([]);
      return;
    }
  
    setAnnLoading(true);
    setAnnError(null);
  
    try {
      const filters = [
        Query.equal("Club", [clubName]),
        Query.orderDesc("$createdAt"),
        Query.limit(100),
      ];
  
      // Only players are restricted to Active = true
      if (role === "player") {
        filters.push(Query.equal("Active", [true]));
      }
  
      const res = await tablesDb.listRows("68cfc3d00013a224d25f", "announcments", filters);
      const rows = res?.rows ?? res?.documents ?? [];
      setAnnouncements(rows);
    } catch (e) {
      setAnnError(e?.message ?? String(e));
    } finally {
      setAnnLoading(false);
    }
  }, [clubName, role]);
  

  // 3) Load announcements whenever clubName becomes available/changes
  useEffect(() => {
    loadAnnouncements();
  }, [loadAnnouncements]);

  const isAdmin = typeof role === "string" && role.toLowerCase() === "admin";
  const isCaptain = typeof role === "string" && role.toLowerCase() === "captain";

  // 4) Create announcement, then refresh list
  const handleSubmitAnnouncement = async ({ title, body, active }) => {
    try {
      setPosting(true);

      // optional guard if Club is required in schema
      if (!clubName?.trim()) {
        setAnnError("Club is missing. Cannot post announcement.");
        return;
      }

      const user = await account.get();

      await tablesDb.createRow(
        "68cfc3d00013a224d25f",
        "announcments",     // collection ID
        ID.unique(),        // allow multiple announcements
        {
          titleText: title.trim(),         // match your schema field names
          bodyText: body.trim(),
          Active: Boolean(active),         // case-sensitive + boolean
          Club: clubName.trim(),           // case-sensitive attribute name
          name: (firstName +" " + lastName), // if you store author name
          // only if attribute exists in schema
        }
      );

      // Immediately refresh list
      await loadAnnouncements();

      setShowAddModal(false);
    } catch (e) {
      console.warn("Failed to post announcement:", e?.message ?? e);
      setAnnError(e?.message ?? String(e));
    } finally {
      setPosting(false);
    }
  };
  

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
    <Layout
      title={clubName}
      headerExtras={
        <View style={styles.headerRow}>
          <Text style={[common.subtitle, (!isAdmin && !isCaptain) && styles.centerSubtitle]}>
            Announcements
          </Text>

          {(isAdmin || isCaptain) && (
            <View style={styles.headerActions}>
              
              <View style={styles.actionBtn}>
                <MaterialIcons name="add" size={18} color= {colors.surface} style={styles.actionIcon} />
                <Button title="Add" color={colors.surface} onPress={() => setShowAddModal(true)} />
              </View>
              
            </View>
          )}
        </View>
      }
      onPressSchedule={() =>
        router.push({ pathname: '/Schedule', params: { clubName,role , name: `${firstName} ${lastName}`,playerId} })
      }
      onPressTeams={() => 
        router.push({ pathname: '/Teams', params: { clubName,role , name: `${firstName} ${lastName}` ,playerId}})
      }
      onPressProfile={() => {}}
    >
      <ScrollView style={common.scrollView} contentContainerStyle={{ padding: 16 }}>
        
        {announcements.length === 0 ? (
          <Text style={{ color: colors.surface, opacity: 0.9 }}>No announcements are here.</Text>
        ) : (
          announcements.map((a) => (
            
            <Pressable key={a.$id} onPress={() => { 
                setSelectedAnnouncement(a); 
                setDetailVisible(true); 
              }}>
                <View style={{ marginBottom: 12 }}>
                
                    <Text style={{ color: colors.surface, fontWeight: "700", fontSize: "20" }}>
                        {a.titleText ?? a.title}
                    </Text>
                    <View style = {{borderWidth:1, borderColor: colors.border, marginBottom: 10}} />
                    <Text style={{ color: colors.surface }}>
                      {(a.bodyText ?? a.body ?? '').slice(0, 60)}
                      {(a.bodyText ?? a.body ?? '').length > 60 ? '…' : ''}
                    </Text>
                <View style={{ height: 9, backgroundColor: colors.border, opacity: 0.6, marginTop: 8,width: "100%"}} />
                </View>
            </Pressable>
          ))
        )}
      </ScrollView>

      <AnnouncementDetailModal
        visible={detailVisible}
        onClose={() => setDetailVisible(false)}
        announcement={selectedAnnouncement}
        heading="Announcement"
        canEdit = {isAdmin || isCaptain}
        canDelete = {isAdmin || isCaptain}
        updating = {updatingDetail}
        onUpdate={async ({ title, body, active }) => {
          try {
            setUpdatingDetail(true);
            await tablesDb.updateRow(
              "68cfc3d00013a224d25f",
              "announcments",
              selectedAnnouncement.$id,
              { titleText: title, bodyText: body, Active: Boolean(active) }
            );
            await loadAnnouncements();
            setDetailVisible(false);
          } catch (e) {
            setAnnError(e?.message ?? String(e));
          } finally {
            setUpdatingDetail(false);
          }
        }}
        updateDelete = {async() => {
          try
          {
            await tablesDb.deleteRow("68cfc3d00013a224d25f",
              "announcments", selectedAnnouncement.$id)
              setAnnouncements(prev => prev.filter(a => a.$id !== selectedAnnouncement.$id));
              setSelectedAnnouncement(null);
              setDetailVisible(false);
          }
          catch(e)
          {
            setAnnError(e?.message ?? String(e));
          }
          finally
          {
            setDeleting(false);
          }
        }}        
      />

      {/* modal */}
      <AnnouncementModal
        visible={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSubmit={handleSubmitAnnouncement}
        submitting={posting}
        heading="New Announcement"
      />
    </Layout>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    width: "100%",
  },
  headerActions: { flexDirection: "row", alignItems: "center" },
  actionBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surfaceAlt,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginLeft: 4,
    borderColor: colors.border,

  },
  actionIcon: { marginRight: 6 },
  announcmentsText: { fontWeight: "600", fontSize: 16, color: colors.surface },
  centerSubtitle: { textAlign: "center", alignSelf: "center", width: "100%" },

});
