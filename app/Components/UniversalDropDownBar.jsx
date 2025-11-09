// components/Dropdown.jsx
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  ScrollView,
  StyleSheet,
  Platform,
  Keyboard,
} from 'react-native';
import { colors } from '../styles/common';

export default function Dropdown({
  value,
  onChange,
  options = [],
  placeholder = 'Select…',
  disabled = false,
  required = false,
  errorText,
  maxResults = 25,
  searchable = true,
  style,
  inputProps = {},
  getLabel,
  getValue,
}) {
  const inputRef = useRef(null);
  const [open, setOpen] = useState(false);
  const [text, setText] = useState('');

  const norm = useMemo(
    () => normalizeOptions(options, getLabel, getValue),
    [options, getLabel, getValue]
  );

  useEffect(() => {
    if (!open) {
      const current = norm.find(o => o.value === value);
      setText(current ? current.label : '');
    }
  }, [value, open, norm]);

  const query = (text || '').trim().toLowerCase();
  const filtered = useMemo(() => {
    if (!searchable || !open) return norm.slice(0, maxResults);
    if (!query) return norm.slice(0, maxResults);
    const res = norm.filter(o => o.label.toLowerCase().includes(query));
    res.sort((a, b) =>
      a.label.toLowerCase() === query ? -1 :
      b.label.toLowerCase() === query ? 1 :
      a.label.localeCompare(b.label)
    );
    return res.slice(0, maxResults);
  }, [norm, query, maxResults, searchable, open]);

  const select = (opt) => {
    onChange?.(opt);
    setOpen(false);
    Keyboard.dismiss();
  };

  const showError = !!errorText || (required && !value && !open);

  return (
    <View style={[styles.container, style]}>
      <View
        style={[
          styles.inputWrap,
          disabled && styles.inputWrapDisabled,
          showError && styles.inputWrapError,
        ]}
      >
        <TextInput
          ref={inputRef}
          value={
            open && searchable
              ? text
              : (norm.find(o => o.value === value)?.label ?? '')
          }
          placeholder={placeholder}
          placeholderTextColor={PALETTE.hint}
          editable={!disabled && (open ? searchable : true)}
          onChangeText={(t) => {
            setText(t);
            if (!open) setOpen(true);
          }}
          onFocus={() => {
            setOpen(true);
            const current = norm.find(o => o.value === value);
            setText(current ? current.label : '');
          }}
          onBlur={() => setTimeout(() => setOpen(false), 120)}
          style={styles.input}
          {...inputProps}
        />
        <Text style={styles.chevron}>⌄</Text>
      </View>

      {showError && (
        <Text style={styles.errorText}>
          {errorText || 'This field is required'}
        </Text>
      )}

      {open && (
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={styles.dropdown}>
            <ScrollView
              style={styles.dropdownScroll}
              keyboardShouldPersistTaps="handled"
              nestedScrollEnabled
            >
              {filtered.length === 0 ? (
                <View style={styles.emptyItem}>
                  <Text style={styles.emptyText}>No results</Text>
                </View>
              ) : (
                filtered.map((opt) => (
                  <TouchableOpacity
                    key={String(opt.value)}
                    onPress={() => select(opt)}
                    style={styles.item}
                    activeOpacity={0.7}
                  >
                    <Text numberOfLines={1} style={styles.itemText}>
                      {opt.label}
                    </Text>
                  </TouchableOpacity>
                ))
              )}
            </ScrollView>
          </View>
        </TouchableWithoutFeedback>
      )}
    </View>
  );
}

export function normalizeOptions(options, getLabel, getValue) {
  if (!Array.isArray(options)) return [];
  return options
    .map((o, i) => {
      if (typeof o === 'string' || typeof o === 'number') {
        return { label: String(o), value: o };
      }
      const label = getLabel ? getLabel(o) : String(o?.label ?? o?.name ?? o?.title ?? '');
      const value = getValue ? getValue(o) : (o?.value ?? o?.id ?? i);
      return { label, value };
    })
    .filter(o => o.label !== '' && o.value !== undefined && o.value !== null);
}

const PALETTE = {
  bg: colors.surfaceAlt,
  border: colors.border,
  text: colors.surface,
  hint: colors.surface,
  error: '#dc2626',
  overlay: colors.surfaceAlt,
};

const styles = StyleSheet.create({
  container: { width: '100%' },
  inputWrap: {
    position: 'relative',
    width: '100%',
    backgroundColor: PALETTE.bg,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: PALETTE.border,
  },
  inputWrapDisabled: { opacity: 0.6 },
  inputWrapError: { borderColor: PALETTE.error },
  input: {
    color: PALETTE.text,
    height: 48,
    paddingHorizontal: 14,
    paddingVertical: Platform.OS === 'ios' ? 12 : 10,
  },
  chevron: {
    position: "absolute",
    right: 12,
    top: 12,
    color: PALETTE.hint,
  },
  errorText: { color: PALETTE.error, marginTop: 6, fontSize: 12 },
  dropdown: {
    position: 'absolute',
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
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
  },
  dropdownScroll: { width: '100%' },
  item: {
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: PALETTE.border,
  },
  itemText: { color: PALETTE.text },
  emptyItem: { padding: 12 },
  emptyText: { color: PALETTE.hint },
});
