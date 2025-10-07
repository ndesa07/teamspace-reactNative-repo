// styles/common.js
import { StyleSheet } from "react-native";



export const colors = {
  background: "#0e6367",         // app background
  surface: "#ffffff",            // cards, inputs
  surfaceAlt: "#f7fafc",         // optional lighter surface
  border: "#e5e7eb",
  onBackground: "#ffffff",       // text on background
  onSurface: "#111827",          // text on surface
  muted: "#6b7280",
  dividerOnBg: "rgba(255,255,255,0.35)",
  dividerOnSurface: "#e5e7eb",
};
export default {}
export const common = StyleSheet.create({
  // Wrap your screen root with this so every page has the same bg
  screen: { 
    flex: 1, 
    backgroundColor: colors.background,
  },

 
  // Layout container (no bg so the screen bg shows through)
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
    borderColor: colors.surface, 
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
    color: colors.onBackground,      // readable on teal
    opacity: 0.9,
  },

  // Use this when the divider sits on the teal background
  divider: {
    height: 1,
    backgroundColor: colors.dividerOnBg,
    marginTop: 8,
    marginBottom: 6,
    width: "100%",
  },

  // Button wrapper for card-like buttons
  buttonCard: {
    flex: 1,
    padding: 8,
    marginHorizontal: 1,
    borderRadius: 14,
    backgroundColor: colors.surface,
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

  // Labels shown on the teal background (e.g., your login labels)
  label: {
    width: "100%",
    alignSelf: "center",
    marginBottom: 6,
    fontWeight: "600",
    color: colors.onBackground,      // white on teal
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
});
