// components/ClubSearchDropdown.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Platform,
} from "react-native";
import { tablesDb } from "../../lib/appwrite";
import { DB_ID, Table_ID } from "../../lib/constants";
import { colors } from "../styles/common";

// If you have a shared color system, swap these with your `colors`
const PALETTE = {
  bg: colors.surfaceAlt,
  border: colors.border,
  text: colors.surface,
  hint: colors.surface,
  error: "#dc2626",
  overlay:colors.surfaceAlt,
};

export default function ClubSearchDropdown({
  placeholder = "Type to search clubs…",
  value,
  onChange,            // (clubName: string) => void
  required = false,
  showError = false,
  maxResults = 25,     // how many options to show
  style,
  disabled = false,
}) {
  const [allClubs, setAllClubs] = useState([]);     // all names from DB
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState(null);
  const [open, setOpen] = useState(false);

  const inputRef = useRef(null);
  const containerRef = useRef(null);

  // fetch once on mount
  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      setLoadError(null);
      try {
        // Pull club names from your collection and de-dupe
        const res = await tablesDb.listRows("68cfc3d00013a224d25f", "name", []);
        const docs = res?.documents || res?.rows || [];
        const names = Array.from(
          new Set(
            docs
              .map(d => d?.clubName ?? d?.data?.clubName ?? "")
              .filter(s => typeof s === "string" && s.trim().length > 0)
              .map(s => s.trim())
          )
        ).sort((a, b) => a.localeCompare(b));
        if (alive) setAllClubs(names);
      } catch (e) {
        if (alive) setLoadError(e?.message ?? String(e));
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, []);

  const query = (value || "").toLowerCase().trim();
  const filtered = useMemo(() => {
    const pool = allClubs || [];
    if (!query) return pool.slice(0, maxResults);
    const matches = pool.filter(n => n.toLowerCase().includes(query));
    // sort so exact match floats to top
    matches.sort((a, b) => {
      const A = a.toLowerCase(), B = b.toLowerCase();
      if (A === query) return -1;
      if (B === query) return 1;
      return A.localeCompare(B);
    });
    return matches.slice(0, maxResults);
  }, [query, allClubs, maxResults]);

  const handleSelect = (name) => {
    onChange?.(name);
    setOpen(false);
    inputRef.current?.blur();
  };

  const showRequiredError = showError && required && !value;

  return (
    <View ref={containerRef} style={[styles.container, style]}>
      

      <View style={styles.inputWrap}>
        <TextInput
          ref={inputRef}
          value={value}
          placeholder={loading ? "Loading clubs…" : placeholder}
          placeholderTextColor={PALETTE.hint}
          editable={!disabled && !loading}
          onChangeText={(t) => {
            onChange?.(t);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 120)}
          style={styles.input}
        />
        <Text style={styles.chevron}>⌄</Text>
      </View>

      {loadError && <Text style={styles.errorText}>Failed to load clubs: {loadError}</Text>}
      {showRequiredError && <Text style={styles.errorText}>Please select a club</Text>}

      {open && filtered.length > 0 && (
        <View style={styles.dropdown}>
          <ScrollView
            style={styles.dropdownScroll}
            keyboardShouldPersistTaps="handled"
            nestedScrollEnabled
          >
            {filtered.map((name) => (
              <TouchableOpacity
                key={name}
                onPress={() => handleSelect(name)}
                style={styles.item}
              >
                <Text style={styles.itemText}>{name}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}
    </View>
  );
}

/* ----------------------------- Styles (RN) ----------------------------- */
const styles = StyleSheet.create({
  container: {
    width: "100%",
    marginVertical: 8,
  },
  label: {
    fontWeight: "600",
    fontSize: 14,
    color: PALETTE.text,
  },
  required: { color: PALETTE.error },
  inputWrap: {
    position: "relative",
    width: "100%",
  },
  input: {
    backgroundColor: PALETTE.bg,
    color: PALETTE.text,
    borderRadius: 12,
    marginTop: 8,
    height: 48,
    paddingHorizontal: 14,
    paddingVertical: Platform.OS === "ios" ? 12 : 10,
    borderColor: PALETTE.border,
    borderWidth: 1,
  },
  chevron: {
    position: "absolute",
    right: 12,
    top: 22,
    color: PALETTE.hint,
  },
  dropdown: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 56, // just below the input
    backgroundColor: PALETTE.overlay,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: PALETTE.border,
    maxHeight: 220,
    zIndex: 50,
    elevation: 6, // Android shadow
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
  },
  dropdownScroll: {
    width: "100%",
  },
  item: {
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: PALETTE.border,
  },
  itemText: { color: PALETTE.text },
  errorText: { color: PALETTE.error, marginTop: 6, fontSize: 12 },
});
