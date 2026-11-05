import { useRef, useState } from 'react';
import { Animated, PanResponder, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, fonts } from '../theme';

const DELETE_WIDTH = 84;

// Swipeable row: drag left to reveal a Delete button on the right.
//
// Two engines, picked by platform:
// - Native (iOS/Android): PanResponder — the reliable native gesture system.
// - Web: direct onTouch/onMouse handlers — PanResponder's negotiation with
//   ScrollView is unreliable on React Native Web.
export default function SwipeRow({ children, onDelete }) {
  const tx = useRef(new Animated.Value(0)).current;
  const [open, setOpen] = useState(false);
  const openRef = useRef(false);
  const posRef = useRef(0);
  const drag = useRef(null);

  const delOpacity = tx.interpolate({
    inputRange: [-DELETE_WIDTH, -20, 0],
    outputRange: [1, 0.3, 0],
    extrapolate: 'clamp',
  });

  const snapTo = (toOpen) => {
    openRef.current = toOpen;
    setOpen(toOpen);
    posRef.current = toOpen ? -DELETE_WIDTH : 0;
    Animated.spring(tx, {
      toValue: toOpen ? -DELETE_WIDTH : 0,
      useNativeDriver: false,
      speed: 20,
      bounciness: 0,
    }).start();
  };

  // ---------- Native: PanResponder ----------
  const pan = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, g) =>
        Math.abs(g.dx) > 10 && Math.abs(g.dx) > Math.abs(g.dy) * 1.2,
      onPanResponderMove: (_, g) => {
        const base = openRef.current ? -DELETE_WIDTH : 0;
        const v = Math.min(0, Math.max(-DELETE_WIDTH, base + g.dx));
        posRef.current = v;
        tx.setValue(v);
      },
      onPanResponderRelease: (_, g) => {
        const endX = posRef.current;
        const flickLeft = g.vx < -0.3;
        const flickRight = g.vx > 0.3;
        if (flickLeft || endX < -DELETE_WIDTH / 2) snapTo(true);
        else if (flickRight || endX > -DELETE_WIDTH / 2) snapTo(false);
        else snapTo(openRef.current);
      },
      onPanResponderTerminate: () => snapTo(openRef.current),
    })
  ).current;

  // ---------- Web: direct handlers ----------
  const posOf = (e) => {
    if (e.touches && e.touches.length > 0) return { x: e.touches[0].clientX, y: e.touches[0].clientY };
    if (e.changedTouches && e.changedTouches.length > 0)
      return { x: e.changedTouches[0].clientX, y: e.changedTouches[0].clientY };
    return { x: e.clientX, y: e.clientY };
  };
  const onStart = (e) => {
    const { x, y } = posOf(e);
    drag.current = { startX: x, startY: y, base: openRef.current ? -DELETE_WIDTH : 0, claimed: false };
  };
  const onMove = (e) => {
    const d = drag.current;
    if (!d) return;
    const { x, y } = posOf(e);
    const dx = x - d.startX;
    const dy = y - d.startY;
    if (!d.claimed) {
      if (Math.abs(dx) > 12 && Math.abs(dx) > Math.abs(dy) * 1.3) d.claimed = true;
      else return;
    }
    if (e.cancelable) e.preventDefault();
    const v = Math.min(0, Math.max(-DELETE_WIDTH, d.base + dx));
    posRef.current = v;
    tx.setValue(v);
  };
  const onEnd = (e) => {
    const d = drag.current;
    drag.current = null;
    if (!d || !d.claimed) return;
    const { x } = posOf(e);
    const dx = x - d.startX;
    const finalX = Math.min(0, Math.max(-DELETE_WIDTH, d.base + dx));
    snapTo(finalX < -DELETE_WIDTH / 2);
  };
  const webHandlers =
    Platform.OS === 'web'
      ? {
          onTouchStart: onStart,
          onTouchMove: onMove,
          onTouchEnd: onEnd,
          onTouchCancel: () => { drag.current = null; snapTo(openRef.current); },
          onMouseDown: onStart,
          onMouseMove: onMove,
          onMouseUp: onEnd,
        }
      : {};

  return (
    <View style={styles.wrap}>
      <Animated.View style={[styles.deleteZone, { opacity: delOpacity }]}>
        <Pressable style={styles.deleteBtn} onPress={onDelete}>
          <Text style={styles.deleteText}>Delete</Text>
        </Pressable>
      </Animated.View>
      <Animated.View
        style={[styles.row, { transform: [{ translateX: tx }] }]}
        {...(Platform.OS === 'web' ? webHandlers : pan.panHandlers)}
      >
        {children}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { position: 'relative' },
  deleteZone: {
    position: 'absolute',
    top: 0,
    bottom: 12,
    right: 0,
    width: DELETE_WIDTH,
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteBtn: {
    backgroundColor: colors.red,
    borderRadius: 16,
    width: DELETE_WIDTH - 8,
    flex: 1,
    marginVertical: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteText: { color: '#fff', fontSize: 14, fontFamily: fonts.extraBold },
  row: { backgroundColor: colors.bg },
});
