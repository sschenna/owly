import { useEffect, useState } from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path } from 'react-native-svg';
import { router } from 'expo-router';
import TimeSheet from '../components/TimeSheet';
import { ensurePushPermission, pushPermissionStatus, sendTestNudge, TONES, toneBody } from '../lib/notify';
import { previewSound } from '../lib/sounds';
import { SOUNDS } from '../data/seed';
import { updateSettings, useSettings } from '../store';
import { colors, fonts, gradients, radius } from '../theme';

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

// Notification preferences. Nudges are scheduled on this phone and the OS
// delivers them even with the app closed — no server involved.
export default function Notifications() {
  const s = useSettings();
  const [timeFor, setTimeFor] = useState(null); // 'start' | 'end' | null
  const [perm, setPerm] = useState('undetermined');
  const [permNote, setPermNote] = useState(false);
  const [testMsg, setTestMsg] = useState('');
  const [mockBanner, setMockBanner] = useState(false);

  useEffect(() => {
    pushPermissionStatus().then(setPerm);
  }, []);

  useEffect(() => {
    if (!mockBanner) return;
    const t = setTimeout(() => setMockBanner(false), 5000);
    return () => clearTimeout(t);
  }, [mockBanner]);

  const flip = (key) => updateSettings({ [key]: !s[key] });

  const flipPush = async () => {
    if (!s.push) {
      // Turning on: ask the OS first so the toggle means something.
      const granted = await ensurePushPermission();
      setPerm(granted ? 'granted' : 'denied');
      setPermNote(!granted);
      updateSettings({ push: true });
    } else {
      setPermNote(false);
      updateSettings({ push: false });
    }
  };

  const pickSound = (name) => {
    previewSound(name);
    updateSettings({ defaultSound: name });
  };

  const doTest = async () => {
    // Play the default sound so you hear what a nudge sounds like.
    previewSound(s.defaultSound);
    if (Platform.OS === 'web') {
      // No OS notifications on web — show the realistic mock instead.
      setMockBanner(true);
      setTestMsg('');
      return;
    }
    const ok = await sendTestNudge();
    setTestMsg(
      ok
        ? 'Test nudge incoming — watch for it in about 4 seconds.'
        : 'Could not schedule the test — check notification permission.',
    );
  };

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
          <Row label="Push nudges" sub="A ping when a nudge fires" on={s.push} onFlip={flipPush} />
          <Row label="Email summaries" sub="A weekly roundup, Sundays" on={s.email} onFlip={() => flip('email')} />
          <Row label="Nudge sound" sub="Play the default tone" on={s.sound} onFlip={() => flip('sound')} last />
        </View>

        {s.push && perm === 'denied' && (
          <View style={styles.warn}>
            <Text style={styles.warnText}>
              Owly doesn\u2019t have notification permission — enable it in your phone\u2019s Settings to get nudges.
            </Text>
          </View>
        )}
        {permNote && (
          <View style={styles.warn}>
            <Text style={styles.warnText}>
              Permission wasn\u2019t granted, so nudges are paused for now. Flip the switch again once it\u2019s allowed.
            </Text>
          </View>
        )}

        <Text style={styles.sectionTitle}>Nudge sound</Text>
        <Text style={styles.sectionSub}>Tap to hear it — the checkmark is the default for new documents.</Text>
        <View style={styles.card}>
          {SOUNDS.map((name, i) => (
            <Pressable
              key={name}
              style={[styles.soundRow, i === SOUNDS.length - 1 && styles.last]}
              onPress={() => pickSound(name)}
            >
              <View style={[styles.radio, s.defaultSound === name && styles.radioOn]}>
                {s.defaultSound === name && <Text style={styles.radioTick}>✓</Text>}
              </View>
              <Text style={styles.label}>{name}</Text>
              <View style={styles.playBtn}>
                <Svg width={16} height={16} viewBox="0 0 24 24" fill={colors.coral}>
                  <Path d="M8 5v14l11-7z" />
                </Svg>
              </View>
            </Pressable>
          ))}
        </View>

        <Text style={styles.sectionTitle}>Nudge tone</Text>
        <Text style={styles.sectionSub}>How should Owly word your nudges? Here is a taste:</Text>
        <View style={styles.toneWrap}>
          {Object.entries(TONES).map(([id, t]) => (
            <Pressable
              key={id}
              style={[styles.toneCard, s.tone === id && styles.toneCardOn]}
              onPress={() => updateSettings({ tone: id })}
            >
              <View style={styles.toneHead}>
                <Text style={styles.toneLabel}>{t.label}</Text>
                <View style={[styles.radio, s.tone === id && styles.radioOn]}>
                  {s.tone === id && <Text style={styles.radioTick}>✓</Text>}
                </View>
              </View>
              <Text style={styles.toneDesc}>{t.desc}</Text>
              <View style={styles.toneExample}>
                <Text style={styles.toneExampleText}>{toneBody(id, 'Passport', 30)}</Text>
              </View>
            </Pressable>
          ))}
        </View>

        <Text style={styles.sectionTitle}>Test it out</Text>
        <Pressable onPress={doTest}>
          <LinearGradient colors={gradients.brand} style={styles.testBtn} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
            <Text style={styles.testText}>Send me a test nudge</Text>
          </LinearGradient>
        </Pressable>
        {testMsg ? <Text style={styles.testMsg}>{testMsg}</Text> : null}
        {mockBanner && (
          <View style={styles.mockBanner}>
            <Text style={styles.mockTitle}>Owly nudge 🦉 (test)</Text>
            <Text style={styles.mockBody}>{toneBody(s.tone || 'funky', 'Passport', 30)}</Text>
            <Text style={styles.mockNote}>On your phone this arrives as a real notification, even with Owly closed.</Text>
          </View>
        )}

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
          <Text style={styles.noteTitle}>How delivery works</Text>
          <Text style={styles.noteSub}>
            Nudges are scheduled right on this phone — your documents never touch a server. The phone
            delivers them even with Owly closed. Quiet hours shift nudges to the morning; turning Push
            nudges off cancels everything scheduled.
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
  sectionTitle: { fontSize: 17, fontFamily: fonts.extraBold, color: colors.ink, letterSpacing: -0.3, marginTop: 18, marginBottom: 6 },
  sectionSub: { fontSize: 13, fontFamily: fonts.regular, color: colors.muted, marginBottom: 10, lineHeight: 19 },
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
  warn: {
    marginTop: 12,
    backgroundColor: 'rgba(242,102,139,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(242,102,139,0.35)',
    borderRadius: radius.lg,
    padding: 14,
  },
  warnText: { fontSize: 13.5, fontFamily: fonts.bold, color: colors.ink, lineHeight: 20 },
  soundRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 13,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  radio: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioOn: { borderColor: colors.coral, backgroundColor: 'rgba(242,102,139,0.14)' },
  radioTick: { color: colors.coral, fontSize: 14, fontFamily: fonts.extraBold },
  playBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(242,102,139,0.14)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  toneWrap: { gap: 10 },
  toneCard: {
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radius.lg,
    padding: 15,
  },
  toneCardOn: { borderColor: colors.coral, backgroundColor: 'rgba(242,102,139,0.06)' },
  toneHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 },
  toneLabel: { fontSize: 16, fontFamily: fonts.extraBold, color: colors.ink },
  toneDesc: { fontSize: 13, fontFamily: fonts.regular, color: colors.muted, marginBottom: 10 },
  toneExample: {
    backgroundColor: colors.bg,
    borderRadius: 12,
    padding: 12,
  },
  toneExampleText: { fontSize: 13.5, fontFamily: fonts.regular, color: colors.ink, lineHeight: 20 },
  testBtn: { borderRadius: radius.pill, paddingVertical: 15, alignItems: 'center' },
  testText: { color: '#fff', fontSize: 16, fontFamily: fonts.extraBold },
  testMsg: { fontSize: 13.5, fontFamily: fonts.bold, color: colors.ink, textAlign: 'center', marginTop: 10 },
  mockBanner: {
    marginTop: 12,
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.coral,
    borderRadius: radius.lg,
    padding: 15,
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  mockTitle: { fontSize: 14, fontFamily: fonts.extraBold, color: colors.ink, marginBottom: 4 },
  mockBody: { fontSize: 14, fontFamily: fonts.regular, color: colors.ink, lineHeight: 21 },
  mockNote: { fontSize: 12, fontFamily: fonts.regular, color: colors.muted, marginTop: 8, lineHeight: 17 },
});
