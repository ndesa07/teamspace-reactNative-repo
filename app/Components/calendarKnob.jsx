import React, { useState, useRef, useMemo } from "react";
import { View, Pressable, StyleSheet, PanResponder, Animated } from "react-native";
import { colors } from "../styles/common";

export default function CalendarKnob({ onToggle, onDrag, isExpanded = true, range = 240 }) {
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState(0);
  const dragY = useRef(new Animated.Value(0)).current;

  const threshold = 30;
  const clickThreshold = 5;

  const reset = () => {
    setIsDragging(false);
    setDragOffset(0);
    Animated.spring(dragY, { toValue: 0, useNativeDriver: true, bounciness: 0 }).start();
  };

  const pan = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dy) > 2,
        onPanResponderGrant: () => {
          setIsDragging(true);
          dragY.setOffset(0);
          dragY.setValue(0);
        },
        onPanResponderMove: (_, g) => {
          setDragOffset(g.dy);
          dragY.setValue(g.dy);
          const p = Math.max(-1, Math.min(1, g.dy / range));
          onDrag?.(p);
        },
        onPanResponderRelease: (_, g) => {
          if (Math.abs(g.dy) > threshold) {
            if (isExpanded && g.dy > 0) onToggle?.(false);
            else if (!isExpanded && g.dy < 0) onToggle?.(true);
          }
          onDrag?.(0);
          reset();
        },
        onPanResponderTerminate: () => {
          onDrag?.(0);
          reset();
        },
        onPanResponderReject: () => {
          onDrag?.(0);
          reset();
        },
      }),
    [isExpanded, range, onDrag, onToggle]
  );

  const onPress = () => {
    if (Math.abs(dragOffset) < clickThreshold) onToggle?.(!isExpanded);
  };

  const aStyle = { transform: [{ translateY: dragY }] };

  return (
    <Pressable
      onPress={onPress}
      style={styles.root}
      hitSlop={10}
      accessibilityRole="button"
      accessibilityLabel={isExpanded ? "Collapse calendar" : "Expand calendar"}
      accessibilityHint={isExpanded ? "Drag down or tap to collapse" : "Drag up or tap to expand"}
      accessibilityState={{ expanded: isExpanded }}
    >
      <Animated.View style={[styles.knobWrap, aStyle]} {...pan.panHandlers}>
        <View style={[styles.knobBase, isDragging && styles.knobDragging]}>
          {/* optional grabber line */}

          {/* centred chevron */}
          <View style={[styles.chevron, isExpanded ? styles.chevronUp : styles.chevronDown]} />
        </View>
      </Animated.View>
    </Pressable>
  );
}

const KNOB_W = 140;
const KNOB_H = 22;

const styles = StyleSheet.create({
  root: {
    alignItems: "center",
    justifyContent: "center",
  },

  knobWrap: {
    alignItems: "center",
    justifyContent: "center",
  },

  knobBase: {
    width: KNOB_W,
    height: KNOB_H,
    borderRadius: KNOB_H / 2,

    // centre children (this centres the arrow)
    alignItems: "center",
    justifyContent: "center",

    // match your button styling
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.border,

    shadowColor: "#000",
    shadowOpacity: 0.12,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },

  knobDragging: {
    transform: [{ scale: 1.03 }],
    shadowOpacity: 0.18,
  },

  grabber: {
    position: "absolute",
    // put it slightly above centre so it doesn't clash with chevron
    top: 5,
    width: 44,
    height: 4,
    borderRadius: 2,
    backgroundColor: "rgba(240,247,255,0.25)", // matches onBackground but softer
  },

  chevron: {
    width: 10,
    height: 10,
    borderRightWidth: 2,
    borderBottomWidth: 2,
    borderColor: colors.onBackground, // same as your text/icons on dark bg
    opacity: 0.85,
  },
  chevronUp: {
    transform: [{ rotate: "-135deg" }],
  },
  chevronDown: {
    transform: [{ rotate: "45deg" }],
  },
});
