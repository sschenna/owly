import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';
import { router, useLocalSearchParams } from 'expo-router';
import NudgeList from '../../../components/NudgeList';
import { getDocs, updateDocs } from '../../../store';
import { colors, fonts } from '../../../theme';

// Per-document nudge management. Editing nudges lands here —
// never inside the doc edit form.
export default function NudgesScreen() {
  const { id } = useLocalSearchParams();
  const doc = getDocs().find((d) => d.id === id);

  if (!doc) {
    return (
      <SafeAreaView style={styles.safe}>
        <Text style={styles.missing}>Couldn't find that document.</Text>
      </SafeAreaView>
    );
  }

  const setReminders = (reminders) =>
    updateDocs((ds) => ds.map((d) => (d.id === id ? { ...d, reminders } : d)));

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

        <NudgeList reminders={doc.reminders} onChange={setReminders} expiry={doc.expiry} />
      </ScrollView>
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
});
