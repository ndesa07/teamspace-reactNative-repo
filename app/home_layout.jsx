import { View, Text, StyleSheet, Button, Pressable } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { usePathname, router } from "expo-router";
import { common, colors } from "./styles/common";
import { SafeAreaView } from "react-native-safe-area-context";


export default function Layout({
  title = "Team Space",
  headerExtras = null,
  children,
  showFooter = true,
  onPressHome,              // optional override
  homePath = "/home",
  onPressSchedule, 
  onPressTeams,
  onPressProfile,
}) {
  const pathname = usePathname?.() || "";
  const isHome = pathname === homePath || pathname === "/";
  const goHome = onPressHome || (() => router.replace(homePath));
  const isSchedule = pathname.startsWith("/schedule");
  const isTeams = pathname.startsWith("/teams");
  const isProfile = pathname.startsWith("/profile");

  return (

    <View style={common.screen}>
      <View style={[common.container, { flex: 1 }]}>
        {/* Header */}
        <View style={common.header}>
          <View style={styles.headerBar}>
            {/* LEFT: Home btn only if not on home, else placeholder to keep title centered */}
            {isHome ? (
              <View style={styles.iconSlot} />
            ) : (
              <Pressable
                onPress={goHome}
                style={styles.iconSlot}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <MaterialIcons name="home" size={22} color={colors.onBackground} />
              </Pressable>
            )}

            {/* CENTER: Title */}
            {!!title && (
              <Text numberOfLines={1} style={[common.title, styles.headerTitle]}>
                {title}
              </Text>
            )}

            {/* RIGHT: Placeholder to keep title centered even with only a left icon */}
            <View style={styles.iconSlot} />
          </View>

          <View style={common.divider} />
          {headerExtras}
        </View>

        {/* Content */}
        <View style={styles.content}>{children}</View>
        
        {/* Bottom Navigation Footer */}
          {showFooter && (
            <View style={styles.tabBarContainer}>
              <View style={styles.tabBar}>
                {/* Schedule */}
                <Pressable
                  style={[styles.tabItem, isSchedule && styles.tabItemActive]}
                  onPress={onPressSchedule}
                >
                  <View style={styles.iconWrapper}>
                    <MaterialIcons
                      name="event"
                      size={24}
                      color={
                        isSchedule
                          ? colors.onBackground
                          : colors.muted || colors.onSurface
                      }
                    />
                    {/* Example badge – hook this up to real data later */}
                    {/* <View style={styles.badge}>
                      <Text style={styles.badgeText}>2</Text>
                    </View> */}
                  </View>
                  <Text
                    style={[
                      styles.tabLabel,
                      isSchedule && styles.tabLabelActive,
                    ]}
                  >
                    Schedule
                  </Text>
                </Pressable>

                {/* Teams */}
                <Pressable
                  style={[styles.tabItem, isTeams && styles.tabItemActive]}
                  onPress={onPressTeams}
                >
                  <View style={styles.iconWrapper}>
                    <MaterialIcons
                      name="groups"
                      size={24}
                      color={
                        isTeams
                          ? colors.onBackground
                          : colors.muted || colors.onSurface
                      }
                    />
                    {/* Example badge on Teams */}
                    {/* <View style={styles.badge}>
                      <Text style={styles.badgeText}>2</Text>
                    </View> */}
                  </View>
                  <Text
                    style={[
                      styles.tabLabel,
                      isTeams && styles.tabLabelActive,
                    ]}
                  >
                    Teams
                  </Text>
                </Pressable>

                {/* Profile */}
                <Pressable
                  style={[styles.tabItem, isProfile && styles.tabItemActive]}
                  onPress={onPressProfile}
                >
                  <View style={styles.iconWrapper}>
                    <MaterialIcons
                      name="person"
                      size={24}
                      color={
                        isProfile
                          ? colors.onBackground
                          : colors.muted || colors.onSurface
                      }
                    />
                  </View>
                  <Text
                    style={[
                      styles.tabLabel,
                      isProfile && styles.tabLabelActive,
                    ]}
                  >
                    Profile
                  </Text>
                </Pressable>
              </View>
            </View>
          )}

      </View>
    </View>
  );
}

const ICON_WIDTH = 40;

const styles = StyleSheet.create({
  headerBar: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 8,
  },
  iconSlot: {
    width: ICON_WIDTH,
    height: ICON_WIDTH,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    flexGrow: 1,
    textAlign: "center",
  },
  content: {
    flex: 1,
    alignSelf: "stretch",
  },

  // --- bottom nav styles ---

  tabBarContainer: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    backgroundColor: colors.background,
    paddingBottom: 4,
    paddingTop: 4,
  },
  tabBar: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  tabItem: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 4,
    gap: 2,
  },
  tabItemActive: {
    // keep it subtle, still your color scheme
    // e.g. slightly stronger opacity is handled in label/icon styles
  },
  iconWrapper: {
    position: "relative",
    alignItems: "center",
    justifyContent: "center",
  },
  tabLabel: {
    fontSize: 11,
    opacity: 0.7,
    color: colors.muted || colors.onSurface,
  },
  tabLabelActive: {
    opacity: 1,
    fontWeight: "600",
    color: colors.onBackground,
  },

  // optional badge like in the screenshot
  badge: {
    position: "absolute",
    top: -4,
    right: -12,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    paddingHorizontal: 4,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.muted, // using your scheme, not hard-coded red
  },
  badgeText: {
    fontSize: 10,
    fontWeight: "700",
    color: colors.onBackground,
  },
});

