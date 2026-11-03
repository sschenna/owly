import { useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { colors, fonts, radius } from '../theme';
import { isoOf, parseIso, todayIso } from '../lib/dates';

const LETTERS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

// Month calendar bottom sheet. Monday-first. Past days disabled when minToday.
export default function CalendarSheet({ visible, initial, minToday, onPick, onClose }) {
  const init = initial ? parseIso(initial) : new Date();
  const [ym, setYm] = useState({ y: init.getFullYear(), m: init.getMonth() });
  const [sel, setSel] = useState(initial || null);

  if (!visible) return null;

  const first = new Date(ym.y, ym.m, 1);
  const startGap = (first.getDay() + 6) % 7;
  const daysInMonth = new Date(ym.y, ym.m + 1, 0).getDate();
  const cells = [...Array(startGap).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => i + 1)];
  const monthName = first.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  const tIso = todayIso();

  const move = (delta) => {
    const d = new Date(ym.y, ym.m + delta, 1);
    setYm({ y: d.getFullYear(), m: d.getMonth() });
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
          <View style={styles.handle} />
          <View style={styles.nav}>
            <Pressable style={styles.navBtn} onPress={() => move(-1)} accessibilityLabel="Previous month">
              <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke={colors.coral} strokeWidth={2.6}>
                <Path d="M15 6l-6 6 6 6" />
              </Svg>
            </Pressable>
            <Text style={styles.month}>{monthName}</Text>
            <Pressable style={styles.navBtn} onPress={() => move(1)} accessibilityLabel="Next month">
              <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke={colors.coral} strokeWidth={2.6}>
                <Path d="M9 6l6 6-6 6" />
              </Svg>
            </Pressable>
          </View>
          <View style={styles.grid}>
            {LETTERS.map((l, i) => (
              <Text key={i} style={styles.dow}>
                {l}
              </Text>
            ))}
            {cells.map((day, i) => {
              if (day === null) return <View key={`x${i}`} style={styles.cell} />;
              const iso = isoOf(new Date(ym.y, ym.m, day));
              const disabled = minToday && iso < tIso;
              const isSel = sel === iso;
              const isToday = iso === tIso;
              return (
                <Pressable
                  key={iso}
                  disabled={disabled}
                  style={styles.cell}
                  onPress={() => setSel(iso)}
                >
                  <View style={[styles.day, isSel && styles.daySel, !isSel && isToday && styles.dayToday]}>
                    <Text style={[styles.dayText, isSel && styles.dayTextSel, disabled && styles.dayDisabled]}>
                      {day}
                    </Text>
                  </View>
                </Pressable>
              );
            })}
          </View>
          <Pressable
            style={[styles.confirm, !sel && styles.confirmOff]}
            disabled={!sel}
            onPress={() => {
              onPick(sel);
              onClose();
            }}
          >
            <Text style={styles.confirmText}>Confirm date</Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(43,43,58,0.45)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 26,
  },
  handle: { width: 44, height: 5, borderRadius: 3, backgroundColor: colors.border, alignSelf: 'center', marginBottom: 8 },
  nav: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  navBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  month: { fontSize: 18, fontFamily: fonts.extraBold, color: colors.ink },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  dow: { width: `${100 / 7}%`, textAlign: 'center', fontSize: 11, fontFamily: fonts.bold, color: colors.muted, marginBottom: 6 },
  cell: { width: `${100 / 7}%`, aspectRatio: 1, alignItems: 'center', justifyContent: 'center' },
  day: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  daySel: { backgroundColor: colors.coral },
  dayToday: { borderWidth: 1.5, borderColor: colors.coral },
  dayText: { fontSize: 15, fontFamily: fonts.bold, color: colors.ink },
  dayTextSel: { color: '#fff' },
  dayDisabled: { color: '#d8cfd4' },
  confirm: { marginTop: 12, backgroundColor: colors.coral, borderRadius: radius.pill, paddingVertical: 16, alignItems: 'center' },
  confirmOff: { opacity: 0.4 },
  confirmText: { color: '#fff', fontSize: 16, fontFamily: fonts.extraBold },
});
