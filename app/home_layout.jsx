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

        {/* Footer buttons */}
        {showFooter && (
          <View style={common.bottomSection}>
            <View style={common.row}>
              <View style={common.buttonCard}>
                <Button title="Schedule" color="#0e6367" onPress={onPressSchedule} />
              </View>
              <View style={common.buttonCard}>
                <Button title="Teams" color="#0e6367" onPress={() => {onPressTeams}} />
              </View>
              <View style={common.buttonCard}>
                <Button title="Profile" color="#0e6367" onPress={() => {onPressProfile}} />
              </View>
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
    alignItems: "start",
    justifyContent: "center",
    marginRight: " 60",
  },
  headerTitle: {
    flexGrow: 1,
    textAlign: "center",
  },
  content: {
    flex: 1,
    alignSelf: "stretch",
  },
});
