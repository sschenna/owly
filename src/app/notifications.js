import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';
import { router } from 'expo-router';
import TimeSheet from '../components/TimeSheet';
import { updateSettings, useSettings } from '../store';
import { colors, fonts, radius } from '../theme';

function Toggle({ on, onFlip }) {
  return (
    <Pressable
      style={[styles.toggle, on && styles.toggleOn]}
      onPress={onFlip}
      accessibilityRole="switch"
      accessibilityState={{ checked: on }}
    >
      <View style={[styles.knob, on && styles.knobOn]} />
    </Pressable>
  );
}

function Row({ label, sub, on, onFlip, last }) {
  return (
    <View style={[styles.row, last && styles.last]}>
      <View style={styles.mid}>
        <Text style={styles.label}>{label}</Text>
        {sub ? <Text style={styles.sub2}>{sub}</Text> : null}
      </View>
      <Toggle on={on} onFlip={onFlip} />
    </View>
  );
}

// Notification preferences. These are saved and honored by the app;
// actual OS-level push delivery needs a development build (Expo Go
// can't register push tokens), so that's called out honestly below.
export default function Notifications() {
  const s = useSettings();
  const [timeFor, setTimeFor] = useState(null); // 'start' | 'end' | null

  const flip = (key) => updateSettings({ [key]: !s[key] });

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content}>
        <Pressable style={styles.back} onPress={() => router.back()}>
          <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke={colors.coral} strokeWidth={2.6}>
            <Path d="M15 6l-6 6 6 6" />
          </Svg>
          <Text style={styles.backText}>Profile</Text>
        </Pressable>

        <Text style={styles.title}>Notifications</Text>
        <Text style={styles.sub}>How should Owly get your attention?</Text>

        <View style={styles.card}>
          <Row label="Push nudges" sub="A ping when a nudge fires" on={s.push} onFlip={() => flip('push')} />
          <Row label="Email summaries" sub="A weekly roundup, Sundays" on={s.email} onFlip={() => flip('email')} />
          <Row label="Nudge sound" sub="Play your chosen tone" on={s.sound} onFlip={() => flip('sound')} last />
        </View>

        <Text style={styles.sectionTitle}>Quiet hours</Text>
        <View style={styles.card}>
          <Row
            label="Do not disturb"
            sub="Owly naps — nudges wait till morning"
            on={s.quietHours}
            onFlip={() => flip('quietHours')}
          />
          {s.quietHours && (
            <>
              <Pressable style={styles.timeRow} onPress={() => setTimeFor('start')}>
                <Text style={styles.label}>From</Text>
                <Text style={styles.timeVal}>{s.quietStart}</Text>
              </Pressable>
              <Pressable style={[styles.timeRow, styles.last]} onPress={() => setTimeFor('end')}>
                <Text style={styles.label}>Until</Text>
                <Text style={styles.timeVal}>{s.quietEnd}</Text>
              </Pressable>
            </>
          )}
        </View>

        <View style={styles.note}>
          <Text style={styles.noteTitle}>A note on push delivery</Text>
          <Text style={styles.noteSub}>
            These preferences are saved and the app honors them. Real phone notifications need a development
            build — Expo Go can\u2019t register for push. Until then, the nudge inbox is your source of truth.
          </Text>
        </View>
      </ScrollView>

      <TimeSheet
        visible={timeFor !== null}
        initial={timeFor === 'start' ? s.quietStart : s.quietEnd}
        onClose={() => setTimeFor(null)}
        onPick={(t) => updateSettings(timeFor === 'start' ? { quietStart: t } : { quietEnd: t })}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  content: { paddingHorizontal: 18, paddingTop: 14, paddingBottom: 40 },
  back: { flexDirection: 'row', alignItems: 'center', gap: 2, marginBottom: 12, alignSelf: 'flex-start' },
  backText: { fontSize: 15, fontFamily: fonts.bold, color: colors.coral },
  title: { fontSize: 27, fontFamily: fonts.extraBold, color: colors.ink, letterSpacing: -0.6 },
  sub: { fontSize: 14, fontFamily: fonts.regular, color: colors.muted, marginTop: 4, marginBottom: 18 },
  sectionTitle: { fontSize: 17, fontFamily: fonts.extraBold, color: colors.ink, letterSpacing: -0.3, marginTop: 18, marginBottom: 10 },
  card: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    paddingHorizontal: 16,
    paddingVertical: 4,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  last: { borderBottomWidth: 0 },
  mid: { flex: 1 },
  label: { fontSize: 15.5, fontFamily: fonts.bold, color: colors.ink },
  sub2: { fontSize: 13, fontFamily: fonts.regular, color: colors.muted, marginTop: 3 },
  toggle: {
    width: 52,
    height: 31,
    borderRadius: 16,
    backgroundColor: '#e5dde1',
    padding: 3,
    justifyContent: 'center',
  },
  toggleOn: { backgroundColor: colors.coral },
  knob: { width: 25, height: 25, borderRadius: 13, backgroundColor: '#fff' },
  knobOn: { alignSelf: 'flex-end' },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  timeVal: { fontSize: 15, fontFamily: fonts.extraBold, color: colors.coral },
  note: {
    marginTop: 18,
    backgroundColor: 'rgba(179,136,255,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(179,136,255,0.3)',
    borderRadius: radius.lg,
    padding: 16,
  },
  noteTitle: { fontSize: 15, fontFamily: fonts.extraBold, color: colors.ink, marginBottom: 4 },
  noteSub: { fontSize: 13.5, fontFamily: fonts.regular, color: colors.muted, lineHeight: 20 },
});
