import { Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { colors, fonts } from '../theme';

// A settings-style row: label on the left, value + chevron on the right.
export default function RowItem({ label, value, valueColor, onPress, last, children }) {
  return (
    <Pressable
      style={[styles.row, last && styles.last]}
      onPress={onPress}
      disabled={!onPress}
    >
      <Text style={styles.label}>{label}</Text>
      <View style={styles.right}>
        {children || (
          <Text style={[styles.value, valueColor && { color: valueColor }]} numberOfLines={1}>
            {value}
          </Text>
        )}
        {onPress && (
          <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke={colors.muted} strokeWidth={2.4}>
            <Path d="M9 6l6 6-6 6" />
          </Svg>
        )}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 15,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  last: { borderBottomWidth: 0 },
  label: { fontSize: 15.5, fontFamily: fonts.bold, color: colors.ink },
  right: { flexDirection: 'row', alignItems: 'center', gap: 6, flexShrink: 1, maxWidth: '60%' },
  value: { fontSize: 14.5, fontFamily: fonts.regular, color: colors.muted },
});
