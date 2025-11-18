import React, {useState,useCallback ,useEffect,useRef} from 'react';
import { Text, StyleSheet ,View,Pressable,Animated} from 'react-native';
import Calendar from 'react-native-swipe-calendar';
import Layout from "./home_layout";
import CalendarKnob from './calendarKnob';
import { ScrollView } from 'react-native-gesture-handler';
import { account, tablesDb, ID } from "../lib/appwrite";
import { useLocalSearchParams,router } from 'expo-router';
import { Query } from "react-native-appwrite"; 
import { MaterialIcons } from "@expo/vector-icons";
import AddEventModal from './Components/AddEventModal';
import EventDetailModal from './Components/EventDetailModal';
import { colors } from './styles/common';

const WEEK_H = 110;     // tune for your header/week row height
const MONTH_H = 380;    // tune for full month
const clamp = (v, min, max) => Math.min(max, Math.max(min, v));

const ymd = (d) => {
  if (typeof d === 'string') {
    const [y,m,dd] = d.split('-');
    return [y, String(m).padStart(2,'0'), String(dd).padStart(2,'0')].join('-');
  }
  const pad = (n) => String(n).padStart(2,'0');
  return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;
};
async function upsertAvailability({ eventId, userId, available,name1,clubName1 }) {

  
  const res = await tablesDb.listRows("68cfc3d00013a224d25f", "availability", [
    Query.equal('EventId', eventId),
    Query.equal('PlayerID', userId),
    Query.limit(1),
  ]);
  const rows = res.rows ?? res.documents ?? [];
  if (rows.length) {
    // update
    await tablesDb.updateRow("68cfc3d00013a224d25f", "availability", rows[0].$id, { Available: !!available });
  } else {
    // create
    
    await tablesDb.createRow("68cfc3d00013a224d25f", "availability", ID.unique(), {
      EventId: eventId,
      PlayerID: userId,
      PlayerName: name1,
      ClubName: clubName1,
      Available: !!available,
    });
  }
}

async function getEventsOnDay(date, clubName)
{
  const filters = [
    Query.equal("Club",[clubName]),
    Query.equal("Date", [date]), 
    Query.orderDesc("$createdAt"),
    Query.limit(100)
  ];
  const res = await tablesDb.listRows("68cfc3d00013a224d25f", "eventstable", filters);
  const rows = res?.rows ?? res?.documents ?? [];
  return rows;
}
async function loadAvailability(eventId) 
{
  const res = await tablesDb.listRows(
    "68cfc3d00013a224d25f",
    "availability",
    [
      Query.equal("EventId", [eventId]),
      Query.limit(200),
    ]
  );

  return res.rows ?? res.documents ?? [];
}


function getWeek(anchor) 
{
  const d = new Date(anchor);
  const offset = (d.getDay() + 6) % 7;
  const start = new Date(d.getFullYear(), d.getMonth(), d.getDate() - offset);
  return Array.from({ length: 7 }, (_, i) =>
    new Date(start.getFullYear(), start.getMonth(), start.getDate() + i)
  );
}
function getMonthName(number) 
{
  const m = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  return m[number] ?? "";
}
function getDayOfWeek(num)
{
  const dayOfWeek= ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"]
  return dayOfWeek[num]
}

export default function Schedule()
{
  const calRef = useRef(null);
  const params = useLocalSearchParams();
  const clubName = Array.isArray(params.clubName) ? params.clubName[0] : params.clubName;
  const role = Array.isArray(params.role) ? params.role[0] : params.role;
  const name = Array.isArray(params.name) ? params.name[0] : params.name;
  const playerId = Array.isArray(params.playerId) ? params.playerId[0] : params.playerId; // <-- use playerId
  const [weekDates, setweekDates] = useState([]);
  const [eventsByDay, setEventsByDay] = useState({});
  const [eventDetailModal, setEventDetailModal] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [updatingDetail, setUpdatingDetail] = useState(false);
  const [annLoading, setAnnLoading] = useState(false);
  const [annError, setAnnError] = useState(null);
  const [selectedDate, setSelectedDate] = useState(ymd(new Date()));
  const [addEventModal, setAddEventModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [mode, setMode] = useState('week') // whatever you use
  const [myAvailFromDB, setMyAvailFromDB] = useState(null);
  const [availabilityRows, setAvailabilityRows] = useState([]);
  const calHeight = useRef(new Animated.Value(WEEK_H)).current;
  const baseHeightRef = useRef(WEEK_H);
  const [anchorDate, setAnchorDate] = useState(new Date());
  const [user,setUser] = useState(null);
  const [availabilityList,setAvailabilityList] = useState([]);
  const [teams,setTeams] = useState([]);
  const [myTeamIds, setMyTeamIds] = useState([]);

  async function getPlayerOnTeam()
  {
      {
      try {
        const response = await tablesDb.listRows(
          "68cfc3d00013a224d25f",
          "teamlists",
          [
            Query.equal("PlayerId", playerId)
          ]
        );
        const rows = response.rows ?? response.documents ?? [];
        const ids = rows.map(r => r.TeamId);
        setMyTeamIds(ids);
      } 
      catch (e) 
      {
        console.warn('Failed to fetch teams in player on team', e);
      }
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
      console.warn('Failed to fetch teams in fetch teams only', e);
    }
  }
  

React.useEffect(() => {
    fetchTeams();
  }, []);
  const isAdmin = typeof role === "string" && role.toLowerCase() === "admin";
  const isCaptain = typeof role === "string" && role.toLowerCase() === "captain";
  const fetchAvailability = async (eventId, playerId) => {
  const res = await tablesDb.listRows(
    "68cfc3d00013a224d25f",
    "availability",
    [ Query.equal("EventId", [eventId]), Query.limit(200) ]
  );
  const rows = res.rows ?? res.documents ?? [];

  const fullList = rows.map(r => ({
    playerId:  r.PlayerID ?? r.playerId ?? r.data?.PlayerID,
    playerName:r.PlayerName ?? r.playerName ?? r.data?.PlayerName ?? "Unknown",
    available: Boolean(r.Available ?? r.available ?? r.data?.Available),
  }));

  setAvailabilityList(fullList);
  if (playerId) {
    setMyAvailFromDB(fullList.find(x => x.playerId === playerId)?.available ?? null);
  }
};
async function loadEventDetails(evt) {

  const availRows = await loadAvailability(evt.$id);

  // Get all player profile rows
  const playerProfiles = {};
  for (let row of availRows) {
    const profile = await tablesDb.getRow(
      "68cfc3d00013a224d25f",
      "name",
      row.PlayerID
    );
    if (profile) {
      playerProfiles[row.PlayerID] = profile;
    }
  }
  // Build clean list
  const fullList = availRows.map(row => ({
    playerId: row.PlayerID,
    playerName: playerProfiles[row.PlayerID]?.firstName + " " + playerProfiles[row.PlayerID]?.lastName,
    available: row.Available,
  }));

  setAvailabilityList(fullList);
  setMyAvailFromDB(
    fullList.find(x => x.playerId === playerId)?.available ?? null
  );

}
  const handleAnchor = useCallback((date) => {
    setweekDates(getWeek(date));
    setSelectedDate(ymd(date));
  }, []);
  const handlePageChange = useCallback((date) => {
    setAnchorDate(date);
    setSelectedDate(ymd(date));
    setweekDates(getWeek(date));
    loadEvents(ymd(date));
  }, [loadEvents]);
  


  useEffect(() => {
    getPlayerOnTeam();
    if (!clubName || weekDates.length === 0) return;
    let cancelled = false;

    (async () => {
      const entries = await Promise.all(
        weekDates.map(async (d) => {
          const dateSender = ymd(d);
          const list = await getEventsOnDay(dateSender,clubName);
          const key = ymd(d);
          return [key, list];
        })
      );
      if (!cancelled) setEventsByDay(Object.fromEntries(entries));
    })();

    return () => { cancelled = true; };
  }, [clubName, weekDates]);

  const loadEvents = useCallback(async (dateStr) => {
    if (!clubName || !dateStr) return;
  
    setAnnLoading(true);
    setAnnError(null);
  
    try {
      const filters = [
        Query.equal('Club', [clubName]),
        Query.equal('Date', [dateStr]),
        Query.orderDesc('$createdAt'),
        Query.limit(100),
      ];
      if (role === 'player') filters.push(Query.equal('Active', [true]));
  
      const res = await tablesDb.listRows('68cfc3d00013a224d25f', 'eventstable', filters);
      const rows = res?.rows ?? res?.documents ?? [];
  
      setEventsByDay(prev => ({ ...prev, [dateStr]: rows }));
    } catch (e) {
      setAnnError(e?.message ?? String(e));
    } finally {
      setAnnLoading(false);
    }
  }, [clubName, role]);

  useEffect(() => {
    loadEvents(selectedDate);
  }, [loadEvents, selectedDate]);

  const handleDateSelect = useCallback((date) => {
    const dStr = ymd(date);
    setAnchorDate(date);
    setSelectedDate(dStr);
    setweekDates(getWeek(date));
    loadEvents(dStr);
    setCurrentDate(date);
    calRef.current?.setPage(date);
    if (mode === 'month') {
      setMode('week');
      Animated.spring(calHeight, { toValue: WEEK_H, useNativeDriver: false, bounciness: 0 }).start();
    }
  }, [mode, loadEvents]);
  
  
  const handleSubmit = async ({ EventName, EventBody, Date, Active,Time,EventType }) => {
    try {
      setSubmitting(true);
      if (!clubName?.trim()) {
        setAnnError("Club is missing. Cannot create event.");
        return;
      }

      const user = await account.get();
      const authorName =
        (typeof name === "string" && name.trim()) || (user?.name ?? "");

      await tablesDb.createRow(
        "68cfc3d00013a224d25f",
        "eventstable",
        ID.unique(),
        {
          EventName: String(EventName).trim(),
          EventBody: String(EventBody).trim(),
          Active: Boolean(Active),
          Club: clubName.trim(),
          Name: authorName,
          Date: String(Date).trim(),
          Time: String(Time).trim(),
          EventType: EventType,

        }
      );

      await loadEvents(String(Date).trim());
      setAddEventModal(false);
    } catch (e) {
      console.warn("Failed to create event:", e?.message ?? e);
      setAnnError(e?.message ?? String(e));
    } finally {
      setSubmitting(false);
    }
  };

  const calendarTheme = React.useMemo(() => ({
    headerFontColor: colors.surface,
    selectedDayFontColor: colors.surface,
    dayFontColor: colors.surface,
    dayInactiveFontColor: colors.surface,
    dayLabelColor: colors.surface,
    headerFontSize: 30,
    dayLabelFontSize: 14,
    dayFontSize: 18,
  }), []);
  const onKnobDragStart = () => {
    baseHeightRef.current = mode === 'month' ? MONTH_H : WEEK_H;
  };
const teamOptions = [
  { label: "All teams", value: "ALL" },             // 👈 special value
  ...teams.map(team => ({
    label: team.Name,
    value: team.$id,
  })),
];

  const onKnobDrag = (dy) => {
    calHeight.stopAnimation();
    calHeight.setValue(clamp(baseHeightRef.current + dy, WEEK_H, MONTH_H));
  };

  const onKnobRelease = (dy) => {
    const nextIsMonth = baseHeightRef.current + dy > (WEEK_H + MONTH_H) / 2;
    const target = nextIsMonth ? MONTH_H : WEEK_H;
    Animated.spring(calHeight, { toValue: target, useNativeDriver: false, bounciness: 0 }).start();
    setMode(nextIsMonth ? 'month' : 'week');
  };
  const isAdminOrCaptain = isAdmin || isCaptain;


  const canSeeEvent = (evt) => {
  // Admins / captains see everything
  if (isAdminOrCaptain) return true;

  const eventTeam = evt.EventType;

  // If event is for everyone:
  if (!eventTeam || eventTeam === "ALL") return true;

  // Players: only see events for their team(s)
  return myTeamIds.includes(eventTeam);
};

  return (
    <Layout
      title="Schedule"
      headerExtras 
      onPressSchedule={() =>
        router.push({ pathname: '/Schedule', params: { clubName,role,name,playerId } })}
      onPressTeams={() =>
        router.push({ pathname: '/Teams' , params: { clubName,role,name,playerId }})}
    >
      <View style={styles.hideOverflow}>
      <Animated.View style={{ height: calHeight, overflow: 'hidden' }}>
        <Calendar
          pageInterval={mode}
          weekStartsOn={1}
          ref={calRef}
          currentDate={currentDate}
          onPageChange={handlePageChange}
          onDateSelect={handleDateSelect}
          theme={calendarTheme}
          
        />
        </Animated.View>

        <View style={[{marginTop: 5}, {marginBottom: 5}]}>
          <CalendarKnob
          isExpanded={mode === 'month'}
          onToggle={(expanded) => {
            const target = expanded ? MONTH_H : WEEK_H;
            Animated.spring(calHeight, { toValue: target, useNativeDriver: false, bounciness: 0 }).start();
            setMode(expanded ? 'month' : 'week');
          }}
          onDragStart={onKnobDragStart}
          onDrag={onKnobDrag}
          onRelease={onKnobRelease}
      />
        </View>
      </View>

      {(isAdmin || isCaptain) && (
        <View style={[{ flexDirection: "row", alignItems: "center", justifyContent: "space-between"}]}>
          <Pressable
            onPress={() => {
              const today = new Date();
              calRef.current?.setPage?.(today, { animated: true });
              setCurrentDate(today);
              setSelectedDate(ymd(today));
              setweekDates(getWeek(today));
              loadEvents(ymd(today));
            }}
            style={[{flexDirection: "row", borderWidth: 2, padding: 5, borderRadius: 10, borderColor: colors.border, backgroundColor: colors.surfaceAlt}]}
          >
            <MaterialIcons name="today" size={22} color= {colors.surface} />
            <Text style={[{fontSize: 18,  color: colors.surface}]}>Today</Text>
          </Pressable>

          <Pressable
            onPress={() => setAddEventModal(true)}
            style={[{flexDirection: "row", borderWidth: 2, padding: 5, borderRadius: 10, borderColor: colors.border, backgroundColor: colors.surfaceAlt}]}
          >
            <MaterialIcons name="add" size={22} color= {colors.surface} />
            <Text style={[{fontSize: 18, color: colors.surface}]}>Add Event</Text>
          </Pressable>
        </View>
      )}

      <View style={styles.list}>
        <ScrollView>
          {weekDates.map((d) => {
            const key = ymd(d);
            const todays = eventsByDay[key] ?? [];
            const visibleEvents = todays.filter(canSeeEvent);

            return (
              <View style={styles.inEventRow} key={d.toISOString()}>
                <Text style={styles.eventList}>
                  {getMonthName(d.getMonth())}{" "}
                  {d.getDate()} {getDayOfWeek(d.getDay())}
                </Text>

                {visibleEvents.length === 0 ? (
                  <View />
                  // or: <Text style={styles.noEvents}>No events for your team</Text>
                ) : (
                  <View style={styles.eventStack}>
                    {visibleEvents.map((evt, idx) => (
                      <Pressable
                        key={evt.$id}
                        onPress={async () => {
                          setSelectedEvent(evt);
                          await fetchAvailability(evt.$id, playerId);
                          setEventDetailModal(true);
                        }}
                        style={({ pressed }) => [
                          styles.eventBox,
                          idx !== visibleEvents.length - 1 && styles.eventBoxSpacer,
                          pressed && styles.eventBoxPressed,
                        ]}
                        android_ripple={{ color: colors.surface }}
                      >
                        <Text style={styles.eventTitle}>
                          {evt.EventName ?? "Event"}
                        </Text>
                      </Pressable>
                    ))}
                  </View>
                )}
              </View>
            );
          })}
        </ScrollView>
      </View>

      <AddEventModal
        visible={addEventModal}
        onClose={() => setAddEventModal(false)}
        onSubmit={handleSubmit}
        submitting={submitting}
        initialName={""}
        options = {teamOptions}
      />

      <EventDetailModal
        visible={eventDetailModal}
        onClose={() => setEventDetailModal(false)}
        event={selectedEvent}
        heading={"Event"}
        userId={playerId}
        name1={name}
        clubName1={clubName}
        canEdit={isAdmin || isCaptain}
        canDelete={isAdmin || isCaptain}
        updating={updatingDetail}
        myAvailability={myAvailFromDB ?? null}
        availabilityList = {availabilityList}
        onSetAvailability={upsertAvailability}
        initialTeamId={selectedEvent?.EventType ?? null}
        options = {teamOptions}
        onRefreshAvailability={async () => {
              if (selectedEvent?.$id) {
                await fetchAvailability(selectedEvent.$id, playerId);
              }
            }}

        onUpdate={async ({ EventName, EventBody, Active, Date,Time,EventType }) => {
          try {
            setUpdatingDetail(true);
            await tablesDb.updateRow(
              "68cfc3d00013a224d25f",
              "eventstable",
              selectedEvent.$id,
              {
                EventName: String(EventName).trim(),
                EventBody: String(EventBody).trim(),
                Active: Active,
                Date: String(Date).trim(),
                Time: String(Time).trim(),
                EventType: EventType,
              }
            );
            await loadEvents(selectedEvent.Date);
            setEventDetailModal(false);
          } catch (e) {
            setAnnError(e?.message ?? String(e));
          } finally {
            setUpdatingDetail(false);
          }
        }}
        updateDelete={async () => {
          try {
            setUpdatingDetail(true);
            await tablesDb.deleteRow("68cfc3d00013a224d25f","eventstable",selectedEvent.$id);
            await loadEvents(selectedEvent.Date);
            setEventDetailModal(false);
          } catch (e) {
            setAnnError(e?.message ?? String(e));
          } finally {
            setUpdatingDetail(false);
          }
        }}
      />
    </Layout>
  );
}

const styles = StyleSheet.create({
  container: 
  {
    alignItems: "center",
    marginTop: 4,
  },
  list: 
  {
    flex: 1,
    borderRadius: 10,
    borderColor: colors.border,
    borderWidth: 2,
    marginTop: 5,
    marginBottom: 5
  },
  eventList: 
  {
    padding: 10,
    flex: 1,
    fontSize: 20,
    color: colors.surface,
    fontWeight: '400',
  },
  inEventRow: 
  {
    padding: 2,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 4,
    borderColor: colors.border,
    borderWidth: 2,
  },
  eventBox: 
  {
    flex: 1,
    alignSelf: 'center',
    paddingVertical: 6,
    paddingHorizontal: 14,
    maxHeight: 100,
    minWidth: 170,
    backgroundColor: colors.surfaceAlt,
    borderRadius: 10,
    borderWidth: 3,
    borderColor: colors.border,
    justifyContent: 'center',
  },
  eventBoxSpacer: 
  {
    marginBottom: 2,
  },
  eventTitle: 
  {
    fontSize: 18,
    color: colors.surface,
    padding: 5,
    textAlign: 'center',
  },
  eventBoxPressed: 
  { 
    opacity: 0.7 
  },
  eventStack: 
  {
    alignSelf: 'stretch',
  },
  hideOverflow:
  { 
    overflow: "hidden"
  },
});
