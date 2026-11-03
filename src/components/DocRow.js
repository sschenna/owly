import { Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import DocIcon from './DocIcon';
import { colors, fonts, radius } from '../theme';
import { daysLeft, docSubtitle } from '../lib/dates';
import { initials } from '../lib/format';

const TONE_COLORS = { red: colors.red, amber: '#d97706', green: '#16a34a' };

// One document row on the Home screen: icon, name, status, owner badge.
export default function DocRow({ doc, owner, onPress }) {
  const sub = docSubtitle(daysLeft(doc.expiry));
  return (
    <Pressable
      style={({ pressed }) => [styles.row, pressed && styles.pressed]}
      onPress={onPress}
    >
      <DocIcon type={doc.type} size={56} />
      <View style={styles.mid}>
        <Text style={styles.name} numberOfLines={1}>
          {doc.name}
        </Text>
        <Text style={[styles.sub, { color: TONE_COLORS[sub.tone] }]}>{sub.text}</Text>
      </View>
      {owner && owner.id !== 'me' ? (
        <View style={[styles.badge, { backgroundColor: owner.color }]}>
          <Text style={styles.badgeText}>{initials(owner.name)}</Text>
        </View>
      ) : null}
      <Svg
        width={20}
        height={20}
        viewBox="0 0 24 24"
        fill="none"
        stroke={colors.muted}
        strokeWidth={2.4}
      >
        <Path d="M9 6l6 6-6 6" />
      </Svg>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    padding: 14,
    marginBottom: 12,
    shadowColor: '#be5a78',
    shadowOpacity: 0.08,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 6 },
    elevation: 2,
  },
  pressed: { transform: [{ scale: 0.98 }], opacity: 0.9 },
  mid: { flex: 1, minWidth: 0 },
  name: { fontSize: 17, fontFamily: fonts.extraBold, color: colors.ink, letterSpacing: -0.2 },
  sub: { fontSize: 13.5, fontFamily: fonts.bold, marginTop: 4 },
  badge: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: { color: '#fff', fontSize: 12, fontFamily: fonts.extraBold },
});
