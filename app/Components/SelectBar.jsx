// components/Dropdown.jsx
import React, { useMemo, useRef, useState } from "react";
import { colors } from "../styles/common";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Platform,
} from "react-native";

const defaultPalette = {
  bg: colors.surfaceAlt,
  border: colors.border,
  text: colors.surface,
  hint: colors.surface,
  error: "#dc2626",
  overlay: colors.surfaceAlt,
};

// 🧩 styles factory so we can inject palette
const createStyles = (PALETTE) =>
  StyleSheet.create({
    container: { width: "100%", marginVertical: 1 },
    label: { fontWeight: "600", fontSize: 14, color: PALETTE.text },
    required: { color: PALETTE.error },
    inputWrap: { position: "relative", width: "100%" },
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
    chevron: { position: "absolute", right: 12, top: 22, color: PALETTE.hint },
    dropdown: {
      position: "absolute",
      left: 0,
      right: 0,
      top: 56,
      backgroundColor: PALETTE.overlay,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: PALETTE.border,
      maxHeight: 220,
      zIndex: 50,
      elevation: 6,
      shadowColor: "#000",
      shadowOpacity: 0.08,
      shadowRadius: 8,
      shadowOffset: { width: 0, height: 4 },
    },
    dropdownScroll: { width: "100%" },
    item: {
      paddingVertical: 12,
      paddingHorizontal: 14,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: PALETTE.border,
    },
    itemText: { color: PALETTE.text, fontSize: 14 },
    errorText: { color: PALETTE.error, marginTop: 6, fontSize: 12 },
  });

export default function SelectBar({
  label,
  placeholder = "Type to search…",
  options = [],
  value,
  onChange,
  required = false,
  showError = false,
  maxResults = Number.MAX_SAFE_INTEGER,
  style,
  disabled = false,
  palette: paletteOverrides = {},
}) {
  const [open, setOpen] = useState(false);
  const inputRef = useRef(null);

  const PALETTE = useMemo(
    () => ({ ...defaultPalette, ...paletteOverrides }),
    [paletteOverrides]
  );
  const styles = useMemo(() => createStyles(PALETTE), [PALETTE]);

  // Normalise string options → { label, value }
  const normalizedOptions = useMemo(
    () =>
      options.map((opt) =>
        typeof opt === "string" ? { label: opt, value: opt } : opt
      ),
    [options]
  );

  // ⭐ NEW: filter options based on what’s typed in the input (value)
  const filteredOptions = useMemo(() => {
    const term = (value || "").toString().toLowerCase().trim();

    if (!term) {
      // nothing typed → show all (limited)
      return normalizedOptions.slice(0, maxResults);
    }

    return normalizedOptions
      .filter((opt) =>
        opt.label?.toString().toLowerCase().includes(term)
      )
      .slice(0, maxResults);
  }, [normalizedOptions, maxResults, value]);

  const handleSelect = (newVal) => {
    // when an option is selected, update the input value in parent
    onChange?.(newVal);
    setOpen(false);
    inputRef.current?.blur();
  };

  const showRequiredError = showError && required && !value;

  return (
    <View style={[styles.container, style, disabled && { opacity: 0.6 }]}>
      {label && (
        <Text style={styles.label}>
          {label} {required && <Text style={styles.required}>*</Text>}
        </Text>
      )}

      <View style={styles.inputWrap}>
        <TextInput
          ref={inputRef}
          value={value}
          placeholder={placeholder}
          placeholderTextColor={PALETTE.hint}
          editable={!disabled}
          // typing updates the value in parent (and therefore the filter)
          onChangeText={(t) => onChange?.(t)}
          onFocus={() => setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 120)}
          style={styles.input}
        />
        <Text style={styles.chevron}>⌄</Text>
      </View>

      {showRequiredError && (
        <Text style={styles.errorText}>This field is required</Text>
      )}

      {open && filteredOptions.length > 0 && (
        <View style={styles.dropdown}>
          <ScrollView
            style={styles.dropdownScroll}
            keyboardShouldPersistTaps="handled"
            nestedScrollEnabled
          >
            {filteredOptions.map((opt) => (
              <TouchableOpacity
                key={String(opt.value)}
                onPress={() => handleSelect(opt.value)}
                style={styles.item}
              >
                <Text style={styles.itemText}>{opt.label}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}
    </View>
  );
}
