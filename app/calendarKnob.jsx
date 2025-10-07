// CalendarKnob.native.js
import React, { useState, useRef, useMemo } from 'react';
import { View, Text, Pressable, StyleSheet, PanResponder, Animated } from 'react-native';


export default function CalendarKnob({ onToggle, isExpanded = true }) {
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState(0);     // for click threshold logic
  const dragY = useRef(new Animated.Value(0)).current; // for smooth visual translate
  const startY = useRef(0);
  const threshold = 30; // px to drag before toggle
  const clickThreshold = 5;

  const resetDrag = () => 
    {
    setIsDragging(false);
    setDragOffset(0);
    Animated.spring(dragY, { toValue: 0, useNativeDriver: true, bounciness: 0 }).start();
  };

  const pan = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dy) > 2,
        onPanResponderGrant: (_, g) => {
          setIsDragging(true);
          startY.current = g.y0;
          dragY.setOffset(0);
          dragY.setValue(0);
        },
        onPanResponderMove: (_, g) => {
          setDragOffset(g.dy);
          dragY.setValue(g.dy);
        },
        onPanResponderRelease: (_, g) => {
          const dy = g.dy;
          // drag-based toggle (same logic as web)
          if (Math.abs(dy) > threshold) {
            if (isExpanded && dy > 0) {
              onToggle?.(false); // dragged down -> collapse
            } else if (!isExpanded && dy < 0) {
              onToggle?.(true); // dragged up -> expand
            }
          }
          resetDrag();
        },
        onPanResponderTerminate: resetDrag,
        onPanResponderReject: resetDrag,
      }),
    [isExpanded]
  );

  const onPress = () => 
    {
    if (Math.abs(dragOffset) < clickThreshold) {
      onToggle?.(!isExpanded);
    }
  };

  const aStyle = 
  {
    transform: [{ translateY: dragY }],
  };

  const accLabel = isExpanded ? 'Collapse calendar' : 'Expand calendar';
  const accHint = isExpanded
    ? 'Double tap to collapse. Drag down to collapse.'
    : 'Double tap to expand. Drag up to expand.';

  return (
        <Pressable
        onPress={onPress}
        style={styles.root}
        hitSlop={8}
        accessibilityRole="button"
        accessibilityLabel={accLabel}
        accessibilityHint={accHint}
        accessibilityState={{ expanded: isExpanded }}
        >
        <Animated.View style={[styles.knobWrap, aStyle]} {...pan.panHandlers}>
            <View
                style={[
                styles.knobBase,        // size, rounding, layout
                styles.knobWhite,       // white color + border
                isDragging && styles.knobDragging
                ]}
            >
            </View>
        </Animated.View>

     
    </Pressable>
  );
}

const KNOB_W = 60;
const KNOB_H = 6;

const styles = StyleSheet.create({
  knobWrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  knobBase: {
    width: KNOB_W,
    height: KNOB_H,
    borderRadius: KNOB_H / 2,  // pill shape
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    // subtle shadow so white knob is visible on dark backgrounds
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  knobWhite: {
    backgroundColor: "#9ca3af",
    borderColor: "#9ca3af",
  },
  knobDragging: {
    transform: [{ scale: 1.05 }],
  },
  lines: {
    flexDirection: 'row',
    gap: 4,
  },
  line: {
    width: 4,
    height: 16,
    borderRadius: 2,
    backgroundColor: '#9ca3af', // gray on white
    marginHorizontal: 2,
  },
  chevron: {
    position: 'absolute',
    bottom: -22,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

