import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, fonts } from '../theme';

// 4-digit PIN pad. Calls onDone(pin) when 4 digits are entered.
export default function PinPad({ onDone, onCancel }) {
  const [pin, setPin] = useState('');

  const press = (d) => {
    if (pin.length >= 4) return;
    const next = pin + d;
    setPin(next);
    if (next.length === 4) {
      setTimeout(() => {
        onDone(next);
        setPin('');
      }, 150);
    }
  };

  const del = () => setPin(pin.slice(0, -1));

  const key = (label, fn, wide) => (
    <Pressable key={label} style={[styles.key, wide && styles.keyWide]} onPress={() => (fn ? fn() : press(label))}>
      <Text style={styles.keyText}>{label}</Text>
    </Pressable>
  );

  return (
    <View style={styles.wrap}>
      <View style={styles.dots}>
        {[0, 1, 2, 3].map((i) => (
          <View key={i} style={[styles.dot, i < pin.length && styles.dotOn]} />
        ))}
      </View>
      <View style={styles.grid}>
        {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((d) => key(d))}
        {onCancel ? key('✕', onCancel) : <View style={styles.key} />}
        {key('0')}
        {key('⌫', del)}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center' },
  dots: { flexDirection: 'row', gap: 16, marginBottom: 28 },
  dot: { width: 18, height: 18, borderRadius: 9, borderWidth: 2, borderColor: colors.coral },
  dotOn: { backgroundColor: colors.coral },
  grid: { flexDirection: 'row', flexWrap: 'wrap', width: 270, justifyContent: 'center', gap: 12 },
  key: {
    width: 78,
    height: 78,
    borderRadius: 39,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  keyWide: {},
  keyText: { fontSize: 26, fontFamily: fonts.extraBold, color: colors.ink },
});
