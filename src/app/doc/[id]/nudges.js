import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';
import { router, useLocalSearchParams } from 'expo-router';
import NudgeList from '../../../components/NudgeList';
import OptionSheet from '../../../components/OptionSheet';
import { getDocs, updateDocs } from '../../../store';
import { SOUNDS } from '../../../data/seed';
import { TONES, toneBody } from '../../../lib/notify';
import { previewSound } from '../../../lib/sounds';
import { colors, fonts, radius } from '../../../theme';

// Per-document nudge management. Editing nudges lands here —
// never inside the doc edit form.
export default function NudgesScreen() {
  const { id } = useLocalSearchParams();
  const doc = getDocs().find((d) => d.id === id);
  const [sheet, setSheet] = useState(null); // 'sound' | 'tone' | null

  if (!doc) {
    return (
      <SafeAreaView style={styles.safe}>
        <Text style={styles.missing}>Couldn't find that document.</Text>
      </SafeAreaView>
    );
  }

  const setReminders = (reminders) =>
    updateDocs((ds) => ds.map((d) => (d.id === id ? { ...d, reminders } : d)));
  const patch = (fn) => updateDocs((ds) => ds.map((d) => (d.id === id ? fn(d) : d)));

  const toneId = doc.tone || 'funky';

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Pressable style={styles.back} onPress={() => router.back()}>
          <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke={colors.coral} strokeWidth={2.6}>
            <Path d="M15 6l-6 6 6 6" />
          </Svg>
          <Text style={styles.backText}>Details</Text>
        </Pressable>

        <Text style={styles.title}>Nudges</Text>
        <Text style={styles.sub}>
          for <Text style={styles.subBold}>{doc.name}</Text> — tap one to change its time, snooze it, or delete it.
        </Text>

        <View style={styles.optCard}>
          <Pressable style={styles.optRow} onPress={() => setSheet('sound')}>
            <View style={styles.optMid}>
              <Text style={styles.optLabel}>Nudge sound</Text>
              <Text style={styles.optValue}>{doc.sound}</Text>
            </View>
            <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke={colors.muted} strokeWidth={2.4}>
              <Path d="M9 6l6 6-6 6" />
            </Svg>
          </Pressable>
          <Pressable style={[styles.optRow, styles.optLast]} onPress={() => setSheet('tone')}>
            <View style={styles.optMid}>
              <Text style={styles.optLabel}>Nudge tone</Text>
              <Text style={styles.optValue}>{TONES[toneId].label} — {TONES[toneId].desc.toLowerCase()}</Text>
            </View>
            <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke={colors.muted} strokeWidth={2.4}>
              <Path d="M9 6l6 6-6 6" />
            </Svg>
          </Pressable>
        </View>
        <View style={styles.tonePreview}>
          <Text style={styles.tonePreviewText}>{toneBody(toneId, doc.name, 30)}</Text>
        </View>

        <NudgeList reminders={doc.reminders} onChange={setReminders} expiry={doc.expiry} />
      </ScrollView>

      <OptionSheet
        visible={sheet === 'sound'}
        title="Nudge sound"
        options={SOUNDS.map((s) => ({ id: s, label: s }))}
        selectedId={doc.sound}
        onClose={() => setSheet(null)}
        onSelect={(o) => {
          previewSound(o.label);
          patch((d) => ({ ...d, sound: o.label }));
        }}
      />
      <OptionSheet
        visible={sheet === 'tone'}
        title="Nudge tone"
        options={Object.entries(TONES).map(([tid, t]) => ({
          id: tid,
          label: t.label,
          sub: toneBody(tid, doc.name, 30),
        }))}
        selectedId={toneId}
        onClose={() => setSheet(null)}
        onSelect={(o) => patch((d) => ({ ...d, tone: o.id }))}
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
  sub: { fontSize: 14, fontFamily: fonts.regular, color: colors.muted, marginTop: 4, marginBottom: 18, lineHeight: 21 },
  subBold: { fontFamily: fonts.extraBold, color: colors.ink },
  missing: { fontSize: 16, fontFamily: fonts.bold, color: colors.muted, textAlign: 'center', marginTop: 60 },
  optCard: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    paddingHorizontal: 16,
    marginBottom: 10,
  },
  optRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  optLast: { borderBottomWidth: 0 },
  optMid: { flex: 1 },
  optLabel: { fontSize: 15.5, fontFamily: fonts.bold, color: colors.ink },
  optValue: { fontSize: 13, fontFamily: fonts.regular, color: colors.muted, marginTop: 3 },
  tonePreview: {
    backgroundColor: 'rgba(179,136,255,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(179,136,255,0.3)',
    borderRadius: radius.lg,
    padding: 13,
    marginBottom: 18,
  },
  tonePreviewText: { fontSize: 13.5, fontFamily: fonts.regular, color: colors.ink, lineHeight: 20 },
});
