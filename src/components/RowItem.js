import { StyleSheet, Text, View } from 'react-native';
import Svg, { Path, Rect, Circle } from 'react-native-svg';
import { colors, fonts, radius } from '../theme';
import Tap from './Tap';

// Icon glyphs (24x24, stroke style, coral on pink)
function Glyph({ name }) {
  const s = { fill: 'none', stroke: colors.coral, strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round' };
  switch (name) {
    case 'calendar':
      return (
        <Svg width={22} height={22} viewBox="0 0 24 24" {...s}>
          <Rect x="3" y="5" width="18" height="16" rx="3" />
          <Path d="M8 3v4M16 3v4M3 10h18" />
        </Svg>
      );
    case 'bell':
      return (
        <Svg width={22} height={22} viewBox="0 0 24 24" {...s}>
          <Path d="M18 8a6 6 0 1 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
          <Path d="M13.7 21a2 2 0 0 1-3.4 0" />
        </Svg>
      );
    case 'repeat':
      return (
        <Svg width={22} height={22} viewBox="0 0 24 24" {...s}>
          <Path d="M17 2l4 4-4 4" />
          <Path d="M3 11v-1a4 4 0 0 1 4-4h14M7 22l-4-4 4-4" />
          <Path d="M21 13v1a4 4 0 0 1-4 4H3" />
        </Svg>
      );
    case 'clock':
      return (
        <Svg width={22} height={22} viewBox="0 0 24 24" {...s}>
          <Circle cx="12" cy="12" r="9" />
          <Path d="M12 7v5l3 2" />
        </Svg>
      );
    case 'music':
      return (
        <Svg width={22} height={22} viewBox="0 0 24 24" {...s}>
          <Path d="M9 18V5l12-2v13" />
          <Circle cx="6" cy="18" r="3" />
          <Circle cx="18" cy="16" r="3" />
        </Svg>
      );
    case 'calExport':
      return (
        <Svg width={22} height={22} viewBox="0 0 24 24" {...s}>
          <Rect x="3" y="5" width="18" height="16" rx="3" />
          <Path d="M8 3v4M16 3v4M3 10h18" />
          <Path d="M12 13v6M9 16l3 3 3-3" />
        </Svg>
      );
    case 'user':
      return (
        <Svg width={22} height={22} viewBox="0 0 24 24" {...s}>
          <Circle cx="12" cy="8" r="4" />
          <Path d="M4 21c0-4 3.6-6.5 8-6.5s8 2.5 8 6.5" />
        </Svg>
      );
    case 'lock':
      return (
        <Svg width={22} height={22} viewBox="0 0 24 24" {...s}>
          <Rect x="4" y="11" width="16" height="10" rx="2.5" />
          <Path d="M8 11V7a4 4 0 0 1 8 0v4" />
        </Svg>
      );
    case 'gear':
      return (
        <Svg width={22} height={22} viewBox="0 0 24 24" {...s}>
          <Circle cx="12" cy="12" r="3" />
          <Path d="M19.4 15a1.7 1.7 0 0 0 .34 1.87l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.7 1.7 0 0 0-1.87-.34 1.7 1.7 0 0 0-1 1.55V21a2 2 0 1 1-4 0v-.09a1.7 1.7 0 0 0-1-1.55 1.7 1.7 0 0 0-1.87.34l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.7 1.7 0 0 0 .34-1.87 1.7 1.7 0 0 0-1.55-1H3a2 2 0 1 1 0-4h.09a1.7 1.7 0 0 0 1.55-1 1.7 1.7 0 0 0-.34-1.87l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.7 1.7 0 0 0 1.87.34h.01a1.7 1.7 0 0 0 1-1.55V3a2 2 0 1 1 4 0v.09a1.7 1.7 0 0 0 1 1.55h.01a1.7 1.7 0 0 0 1.87-.34l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.7 1.7 0 0 0-.34 1.87v.01a1.7 1.7 0 0 0 1.55 1H21a2 2 0 1 1 0 4h-.09a1.7 1.7 0 0 0-1.55 1z" />
        </Svg>
      );
    default:
      return null;
  }
}

// A tappable settings card: icon | label (bold) + value (muted, below) | chevron.
// Each row is its own rounded card so it reads as a button, not a static field.
export default function RowItem({ label, value, valueColor, onPress, icon, children }) {
  return (
    <Tap
      style={styles.card}
      onPress={onPress}
      disabled={!onPress}
    >
      {icon && (
        <View style={styles.iconBox}>
          <Glyph name={icon} />
        </View>
      )}
      <View style={styles.mid}>
        <Text style={styles.label}>{label}</Text>
        {children || (
          <Text style={[styles.value, valueColor && { color: valueColor }]} numberOfLines={1}>
            {value}
          </Text>
        )}
      </View>
      {onPress && (
        <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke={colors.muted} strokeWidth={2.4}>
          <Path d="M9 6l6 6-6 6" />
        </Svg>
      )}
    </Tap>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 20,
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginBottom: 10,
    gap: 14,
    // soft tappable shadow
    shadowColor: '#be5a78',
    shadowOpacity: 0.10,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: 'rgba(242,102,139,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  mid: { flex: 1, gap: 2 },
  label: { fontSize: 16, fontFamily: fonts.extraBold, color: colors.ink, letterSpacing: -0.2 },
  value: { fontSize: 14, fontFamily: fonts.regular, color: colors.muted },
});
