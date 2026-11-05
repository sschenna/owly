import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';
import { UI_SOUNDS, playUiSound } from '../lib/sounds';
import { updateSettings, useSettings } from '../store';
import { colors, fonts, radius } from '../theme';
import Tap from '../components/Tap';

// App preferences: UI sounds and other personal touches.
export default function Preferences() {
  const s = useSettings();

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        <Text style={styles.title}>Preferences</Text>
        <Text style={styles.sub}>Make Owly yours.</Text>

        <Text style={styles.sectionTitle}>UI sounds</Text>
        <Text style={styles.sectionSub}>Funny blips for taps and buttons. Tap to hear it.</Text>
        <View style={styles.card}>
          {UI_SOUNDS.map((name, i) => (
            <Tap
              key={name}
              style={[styles.soundRow, i === UI_SOUNDS.length - 1 && styles.last]}
              onPress={() => {
                playUiSound(name);
                updateSettings({ uiSound: name });
              }}
            >
              <View style={[styles.radio, s.uiSound === name && styles.radioOn]}>
                {s.uiSound === name && <Text style={styles.radioTick}>✓</Text>}
              </View>
              <Text style={styles.label}>{name}</Text>
              {name !== 'Silent' && (
                <View style={styles.playBtn}>
                  <Svg width={16} height={16} viewBox="0 0 24 24" fill={colors.coral}>
                    <Path d="M8 5v14l11-7z" />
                  </Svg>
                </View>
              )}
            </Tap>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  scroll: { flex: 1 },
  content: { paddingHorizontal: 18, paddingTop: 14, paddingBottom: 40 },
  title: { fontSize: 24, fontFamily: fonts.extraBold, color: colors.ink, letterSpacing: -0.5 },
  sub: { fontSize: 14, fontFamily: fonts.regular, color: colors.muted, marginTop: 4, marginBottom: 18 },
  sectionTitle: { fontSize: 17, fontFamily: fonts.extraBold, color: colors.ink, letterSpacing: -0.3, marginTop: 6, marginBottom: 4 },
  sectionSub: { fontSize: 13.5, fontFamily: fonts.regular, color: colors.muted, marginBottom: 10, lineHeight: 19 },
  card: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 20,
    paddingHorizontal: 16,
    marginBottom: 18,
  },
  soundRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 13,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  last: { borderBottomWidth: 0 },
  radio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioOn: { borderColor: colors.coral, backgroundColor: colors.coral },
  radioTick: { color: '#fff', fontSize: 13, fontFamily: fonts.extraBold, lineHeight: 16 },
  label: { flex: 1, fontSize: 15, fontFamily: fonts.bold, color: colors.ink },
  playBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(242,102,139,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
