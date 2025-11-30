import React, { useState, useRef, useMemo } from 'react';
import { View, Pressable, StyleSheet, PanResponder, Animated } from 'react-native';

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
      hitSlop={8}
      accessibilityRole="button"
      accessibilityLabel={isExpanded ? 'Collapse calendar' : 'Expand calendar'}
      accessibilityHint={isExpanded ? 'Drag down or tap to collapse' : 'Drag up or tap to expand'}
      accessibilityState={{ expanded: isExpanded }}
    >
      <Animated.View style={[styles.knobWrap, aStyle]} {...pan.panHandlers}>
        <View style={[styles.knobBase, styles.knobWhite, isDragging && styles.knobDragging]}>
          <View style={styles.arrowWrap}>
            {isExpanded ? <View style={styles.arrowUp} /> : <View style={styles.arrowDown} />}
          </View>
        </View>
        
      </Animated.View>
    </Pressable>
  );
}

const KNOB_W = 100;
const KNOB_H = 15;

const styles = StyleSheet.create({
  knobWrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  knobBase: {
    width: KNOB_W,
    height: KNOB_H,
    borderRadius: KNOB_H / 2,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
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
  arrowWrap: {
    
    alignItems: 'center',
    justifyContent: 'center',
  },
  arrowUp: {
    width: 0,
    height: 0,
    borderLeftWidth: 8,
    borderRightWidth: 8,
    borderBottomWidth: 10,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderBottomColor: 'black',
  },
  arrowDown: {
    width: 0,
    height: 0,
    borderLeftWidth: 8,
    borderRightWidth: 8,
    borderTopWidth: 10,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: 'black',
  },
});
