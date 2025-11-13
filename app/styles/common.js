// styles/common.js
import { StyleSheet } from "react-native";

export const colors = {
  background: "#11192C",       // Softer, modern navy
  surface: "#F0F7FF",          // Clean, modern near-white
  surfaceAlt: "#152B44",       // Elevated buttons / cards
  border: "#3B6A9C",           // More modern desaturated border
  onBackground: "#F0F7FF",     // Crisp text on dark bg
  onSurface: "#0D1B2A",        // Clean text on light surface
  muted: "#8CB8E8",            // Softer, modern accent
  dividerOnBg: "rgba(240,247,255,0.12)",
  dividerOnSurface: "rgba(0,0,0,0.06)",
};


export default {};

export const common = StyleSheet.create({
  screen: { 
    flex: 1, 
    backgroundColor: colors.background,
  },
  mainScreen:{
    color: colors.background,
    flex: 1,
  },

  container: {
    flex: 1,
    paddingHorizontal: 16,
    justifyContent: "space-between",
  },

  header: {
    width: "100%",
    paddingTop: 8,
    backgroundColor: "transparent",
  },

  card: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    backgroundColor: colors.surface,
    padding: 12,
  },

  scrollView: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,      // updated
    borderRadius: 8,
    margin: 12,
  },

  title: { 
    fontSize: 30, 
    fontWeight: "700",
    color: colors.onBackground,    
  },

  subtitle: { 
    fontSize: 25, 
    fontWeight: "600", 
    color: colors.onBackground,
    opacity: 0.9,
  },

  divider: {
    height: 1,
    backgroundColor: colors.dividerOnBg,
    marginTop: 8,
    marginBottom: 6,
    width: "100%",
  },

  buttonCard: {
    flex: 1,
    padding: 8,
    marginHorizontal: 1,
    borderRadius: 14,
    backgroundColor: colors.surfaceAlt, // updated
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },

  bottomSection: {
    alignItems: "center",
    paddingBottom: 20,
  },
  middle: {
    flex: 1,
    justifyContent: "center",
    width: "90%",
    marginHorizontal: 20,
  },

  label: {
    width: "100%",
    alignSelf: "center",
    marginBottom: 6,
    fontWeight: "600",
    color: colors.onBackground,
  },

  hero: {
    width: "100%",
    height: 180,
    borderRadius: 12,
    marginBottom: 12,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
  },
  labelSpacer: { marginTop: 18 },

  buttonNav: {
    flexDirection: "row",
    borderWidth: 2,
    padding: 5,
    borderRadius: 10,
    flex: 1,
    textAlign: "center",
    justifyContent: "center",
    alignItems: "center",
    marginHorizontal: 5,
    backgroundColor: colors.surfaceAlt,
    borderColor: colors.border
  },
  pushButtonNav: {
    flexDirection: "row",
    borderWidth: 2,
    padding: 5,
    borderRadius: 10,
    textAlign: "center",
    justifyContent: "center",
    alignItems: "center",
    marginHorizontal: 5,
    backgroundColor: colors.surfaceAlt
  },
});
