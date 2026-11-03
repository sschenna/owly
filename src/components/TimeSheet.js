import { useRef, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { colors, fonts, radius } from '../theme';

const ITEM_H = 46;
const HOURS = Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, '0'));
const MINUTES = Array.from({ length: 12 }, (_, i) => String(i * 5).padStart(2, '0'));
const PERIODS = ['AM', 'PM'];

// Three scroll wheels: hour, minute (5-min steps), AM/PM.
export default function TimeSheet({ visible, initial = '09:00', onPick, onClose }) {
  const [h12, m] = initial.split(':').map(Number);
  const initH = String(h12 % 12 === 0 ? 12 : h12 % 12).padStart(2, '0');
  const initM = String(Math.round(m / 5) * 5).padStart(2, '0');
  const initP = h12 >= 12 ? 'PM' : 'AM';

  const [hour, setHour] = useState(initH);
  const [min, setMin] = useState(initM);
  const [period, setPeriod] = useState(initP);
  const refs = useRef({});

  if (!visible) return null;

  const confirm = () => {
    let h = parseInt(hour, 10) % 12;
    if (period === 'PM') h += 12;
    onPick(`${String(h).padStart(2, '0')}:${min}`);
    onClose();
  };

  const wheel = (key, values, value, setValue) => (
    <ScrollView
      ref={(r) => (refs.current[key] = r)}
      style={styles.wheel}
      contentContainerStyle={{ paddingVertical: ITEM_H }}
      snapToInterval={ITEM_H}
      decelerationRate="fast"
      showsVerticalScrollIndicator={false}
      onMomentumScrollEnd={(e) => {
        const idx = Math.round(e.nativeEvent.contentOffset.y / ITEM_H);
        const v = values[Math.max(0, Math.min(values.length - 1, idx))];
        setValue(v);
      }}
    >
      {values.map((v) => (
        <Pressable
          key={v}
          style={styles.item}
          onPress={() => {
            setValue(v);
            refs.current[key]?.scrollTo({ y: values.indexOf(v) * ITEM_H, animated: true });
          }}
        >
          <Text style={[styles.itemText, v === value && styles.itemTextSel]}>{v}</Text>
        </Pressable>
      ))}
    </ScrollView>
  );

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
          <View style={styles.handle} />
          <Text style={styles.title}>Pick a time</Text>
          <View style={styles.wheels}>
            {wheel('h', HOURS, hour, setHour)}
            <Text style={styles.colon}>:</Text>
            {wheel('m', MINUTES, min, setMin)}
            {wheel('p', PERIODS, period, setPeriod)}
          </View>
          <Pressable style={styles.confirm} onPress={confirm}>
            <Text style={styles.confirmText}>Set time</Text>
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
  handle: { width: 44, height: 5, borderRadius: 3, backgroundColor: colors.border, alignSelf: 'center', marginBottom: 12 },
  title: { fontSize: 18, fontFamily: fonts.extraBold, color: colors.ink, marginBottom: 6, textAlign: 'center' },
  wheels: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', height: ITEM_H * 5 },
  wheel: { width: 84, height: ITEM_H * 5 },
  item: { height: ITEM_H, alignItems: 'center', justifyContent: 'center' },
  itemText: { fontSize: 21, fontFamily: fonts.regular, color: colors.muted },
  itemTextSel: { fontFamily: fonts.extraBold, color: colors.coral, fontSize: 24 },
  colon: { fontSize: 24, fontFamily: fonts.extraBold, color: colors.ink, marginHorizontal: 2 },
  confirm: { marginTop: 10, backgroundColor: colors.coral, borderRadius: radius.pill, paddingVertical: 16, alignItems: 'center' },
  confirmText: { color: '#fff', fontSize: 16, fontFamily: fonts.extraBold },
});
