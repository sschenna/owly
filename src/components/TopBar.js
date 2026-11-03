import { Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { colors, fonts } from '../theme';
import { USER_NAME } from '../store';

// Greeting bar shared by Home and Summary:
// tappable avatar+name on the left, notification bell on the right.
export default function TopBar({ onProfile, onBell, hasAlerts }) {
  const initial = (USER_NAME || '?').trim().charAt(0).toUpperCase();
  return (
    <View style={styles.row}>
      <Pressable style={styles.profile} onPress={onProfile}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{initial}</Text>
        </View>
        <View>
          <Text style={styles.hello}>Hello,</Text>
          <Text style={styles.name}>{USER_NAME}</Text>
        </View>
      </Pressable>
      <Pressable
        style={styles.bell}
        onPress={onBell}
        accessibilityLabel="Notifications"
      >
        <Svg
          width={20}
          height={20}
          viewBox="0 0 24 24"
          fill="none"
          stroke={colors.ink}
          strokeWidth={2}
        >
          <Path d="M18 8a6 6 0 1 0-12 0c0 7-3 8-3 8h18s-3-1-3-8" />
          <Path d="M10.3 21a2 2 0 0 0 3.4 0" />
        </Svg>
        {hasAlerts && <View style={styles.dot} />}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  profile: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.coral,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.coral,
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 4,
  },
  avatarText: { color: '#fff', fontFamily: fonts.extraBold, fontSize: 20 },
  hello: { fontSize: 12, fontFamily: fonts.bold, color: colors.muted },
  name: { fontSize: 20, fontFamily: fonts.extraBold, color: colors.ink, lineHeight: 24 },
  bell: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#be5a78',
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 2,
  },
  dot: {
    position: 'absolute',
    top: 10,
    right: 11,
    width: 9,
    height: 9,
    borderRadius: 5,
    backgroundColor: colors.coral,
    borderWidth: 1.5,
    borderColor: colors.surface,
  },
});
