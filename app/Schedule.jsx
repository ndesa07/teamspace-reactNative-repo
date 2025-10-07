import React, {useState,useCallback ,useEffect,useRef} from 'react';
import { Text, StyleSheet ,View,Pressable} from 'react-native';
import Calendar from 'react-native-swipe-calendar';
import Layout from "./home_layout";
import CalendarKnob from './calendarKnob';
import { ScrollView } from 'react-native-gesture-handler';
import { account, tablesDb, ID } from "../lib/appwrite";
import { useLocalSearchParams,router } from 'expo-router';
import { Query } from "react-native-appwrite"; 
import { MaterialIcons } from "@expo/vector-icons";
import AddEventModal from './Components/AddEventModal';
import EventDetailModal from './Components/EventModal';
import { runOnJS } from 'react-native-reanimated';

const ymd = (d) => {
  if (typeof d === 'string') {
    const [y,m,dd] = d.split('-');
    return [y, String(m).padStart(2,'0'), String(dd).padStart(2,'0')].join('-');
  }
  const pad = (n) => String(n).padStart(2,'0');
  return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;
};

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
export default function Schedule()
{
  const calRef = useRef(null);
  const params = useLocalSearchParams();
  const clubName = Array.isArray(params.clubName) ? params.clubName[0] : params.clubName;
  const role = Array.isArray(params.role) ? params.role[0] : params.role;
  const name = Array.isArray(params.name) ? params.name[0] : params.name;
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

  const isAdmin = typeof role === "string" && role.toLowerCase() === "admin";
  const isCaptain = typeof role === "string" && role.toLowerCase() === "captain";

  const handleAnchor = useCallback((date) => {
    setweekDates(getWeek(date));
    setSelectedDate(ymd(date));
  }, []);

  useEffect(() => {
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

  const handleSubmit = async ({ EventName, EventBody, Date, Active }) => {
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
    headerFontColor: "white",
    selectedDayFontColor: "white",
    dayFontColor: "white",
    dayInactiveFontColor: "white",
    dayLabelColor: "white",
    headerFontSize: 30,
    dayLabelFontSize: 14,
    dayFontSize: 18,
  }), []);

  return (
    <Layout
      title="Schedule"
      headerExtras 
      onPressSchedule={() =>
        router.push({ pathname: '/Schedule', params: { clubName,role,name } })}
    >
      <View style={styles.hideOverflow}>
        <Calendar
          pageInterval="week"
          weekStartsOn={1}
          currentDate={currentDate}
          onPageChange={handleAnchor}
          theme={calendarTheme}
        />

        <View style={[{marginTop: 5}, {marginBottom: 5}]}>
          <CalendarKnob />
        </View>
      </View>

      {(isAdmin || isCaptain) && (
        <View style={[{ flexDirection: "row", alignItems: "center", justifyContent: "space-between"}]}>
          <Pressable
            onPress={() => {
              const today = new Date();
              setCurrentDate(today);
              setSelectedDate(ymd(today));
              setweekDates(getWeek(today));
              loadEvents(ymd(today));
            }}
            style={[{flexDirection: "row", borderWidth: 2, padding: 5, borderRadius: 10, borderColor: "white", backgroundColor: "white"}]}
          >
            <MaterialIcons name="today" size={22} color="#0e6367" />
            <Text style={[{fontSize: 18, color: "#0e6367"}]}>Today</Text>
          </Pressable>

          <Pressable
            onPress={() => setAddEventModal(true)}
            style={[{flexDirection: "row", borderWidth: 2, padding: 5, borderRadius: 10, borderColor: "white", backgroundColor: "white"}]}
          >
            <MaterialIcons name="add" size={22} color="#0e6367" />
            <Text style={[{fontSize: 18, color: "#0e6367"}]}>Add Event</Text>
          </Pressable>
        </View>
      )}

      <View style={styles.list}>
        <ScrollView>
          {weekDates.map((d) => {
            const key = ymd(d);
            const todays = eventsByDay[key] ?? [];
            return (
              <View style={styles.inEventRow} key={d.toISOString()}>
                <Text style={styles.eventList}>
                  {getMonthName(d.getMonth())} {' '}{d.getDate()}
                </Text>

                {todays.length === 0 ? (
                  <View />
                ) : (
                  <View style={styles.eventStack}>
                    {todays.map((evt, idx) => (
                      <Pressable
                        key={evt.$id}
                        onPress={() => { setSelectedEvent(evt); setEventDetailModal(true); }}
                        style={({ pressed }) => [
                          styles.eventBox,
                          idx !== todays.length - 1 && styles.eventBoxSpacer,
                          pressed && styles.eventBoxPressed,
                        ]}
                        android_ripple={{ color: '#e5e7eb' }}
                      >
                        <Text style={styles.eventTitle}>{evt.EventName ?? 'Event'}</Text>
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
        initialName={name}
      />

      <EventDetailModal
        visible={eventDetailModal}
        onClose={() => setEventDetailModal(false)}
        event={selectedEvent}
        heading={"Event"}
        canEdit={isAdmin || isCaptain}
        canDelete={isAdmin || isCaptain}
        updating={updatingDetail}
        onUpdate={async ({ EventName, EventBody, Active, Date }) => {
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
  container: {
    alignItems: "center",
    marginTop: 4,
  },
  list: {
    flex: 1,
    borderRadius: 10,
    borderColor: "white",
    borderWidth: 2,
    marginTop: 5,
    marginBottom: 5
  },
  eventList: {
    padding: 10,
    flex: 1,
    fontSize: 30,
    color: 'white',
    fontWeight: '400',
  },
  inEventRow: {
    padding: 2,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 4,
    borderColor: 'white',
    borderWidth: 2,
  },
  eventBox: {
    flex: 1.5,
    alignSelf: 'center',
    paddingVertical: 6,
    paddingHorizontal: 14,
    minHeight: 40,
    minWidth: 200,
    backgroundColor: 'white',
    borderRadius: 10,
    borderWidth: 3,
    borderColor: '#BDBDBD',
    justifyContent: 'center',
  },
  eventBoxSpacer: {
    marginBottom: 2,
  },
  eventTitle: {
    fontSize: 18,
    color: '#0e6367',
    padding: 5,
    textAlign: 'center',
  },
  eventBoxPressed: { opacity: 0.7 },
  eventStack: {
    alignSelf: 'stretch',
  },
  hideOverflow:{ overflow: "hidden" },
  addEventButton: {
    color: "white",
    borderRadius: 4,
    borderWidth: 10
  }
});
