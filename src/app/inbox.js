import { useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';
import { router } from 'expo-router';
import DocIcon from '../components/DocIcon';
import { getPeople, updateDocs, useDocs } from '../store';
import { colors, fonts, radius } from '../theme';
import { effDate } from '../lib/nudges';
import { fmtD, isoOf, parseIso, todayIso } from '../lib/dates';

// The nudge inbox — every nudge across every document, upcoming and past.
// Past nudges are delete-only; upcoming ones can be deleted too.
export default function Inbox() {
  const docs = useDocs();
  const people = getPeople();

  const { upcoming, past } = useMemo(() => {
    const today = parseIso(todayIso());
    const up = [];
    const pa = [];
    docs.forEach((d) => {
      (d.reminders || []).forEach((n) => {
        const dt = effDate(d.expiry, n);
        const item = {
          key: `${d.id}-${n.d}`,
          docId: d.id,
          docName: d.name,
          type: d.type,
          days: n.d,
          time: n.t,
          iso: isoOf(dt),
        };
        (dt >= today ? up : pa).push(item);
      });
    });
    up.sort((a, b) => (a.iso < b.iso ? -1 : 1));
    pa.sort((a, b) => (a.iso < b.iso ? 1 : -1));
    return { upcoming: up, past: pa };
  }, [docs]);

  const deleteNudge = (item) =>
    updateDocs((ds) =>
      ds.map((d) =>
        d.id === item.docId ? { ...d, reminders: d.reminders.filter((n) => n.d !== item.days) } : d,
      ),
    );

  const ownerOf = (id) => {
    if (id === 'me') return null;
    return people.find((p) => p.id === id);
  };

  const row = (item) => {
    const doc = docs.find((d) => d.id === item.docId);
    const owner = doc ? ownerOf(doc.owner) : null;
    return (
      <View key={item.key} style={styles.row}>
        <Pressable style={styles.main} onPress={() => router.push(`/doc/${item.docId}`)}>
          <DocIcon type={item.type} size={44} />
          <View style={styles.mid}>
            <Text style={styles.docName} numberOfLines={1}>
              {item.docName}
              {owner ? <Text style={styles.owner}> · {owner.name}</Text> : null}
            </Text>
            <Text style={styles.detail}>
              {item.days} {item.days === 1 ? 'day' : 'days'} before · {item.time}
            </Text>
            <Text style={styles.date}>{fmtD(item.iso)}</Text>
          </View>
        </Pressable>
        <Pressable style={styles.del} onPress={() => deleteNudge(item)} accessibilityLabel="Delete nudge">
          <Svg width={19} height={19} viewBox="0 0 24 24" fill="none" stroke={colors.red} strokeWidth={2} strokeLinecap="round">
            <Path d="M3 6h18M8 6V4h8v2M6 6l1 15h10l1-15M10 11v6M14 11v6" />
          </Svg>
        </Pressable>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content}>
        <Pressable style={styles.back} onPress={() => router.back()}>
          <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke={colors.coral} strokeWidth={2.6}>
            <Path d="M15 6l-6 6 6 6" />
          </Svg>
          <Text style={styles.backText}>Back</Text>
        </Pressable>

        <Text style={styles.title}>Nudge inbox</Text>
        <Text style={styles.sub}>Everything Owly wants to tell you, in one place.</Text>

        <Text style={styles.sectionTitle}>Upcoming</Text>
        {upcoming.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyTitle}>All quiet</Text>
            <Text style={styles.emptySub}>No nudges on the horizon. Suspiciously peaceful.</Text>
          </View>
        ) : (
          upcoming.map(row)
        )}

        {past.length > 0 && (
          <>
            <Text style={[styles.sectionTitle, styles.pastTitle]}>Past</Text>
            {past.map(row)}
          </>
        )}
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
  sub: { fontSize: 14, fontFamily: fonts.regular, color: colors.muted, marginTop: 4, marginBottom: 6 },
  sectionTitle: { fontSize: 17, fontFamily: fonts.extraBold, color: colors.ink, letterSpacing: -0.3, marginTop: 14, marginBottom: 10 },
  pastTitle: { marginTop: 20 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    padding: 12,
    marginBottom: 10,
  },
  main: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 12 },
  mid: { flex: 1, minWidth: 0 },
  docName: { fontSize: 15.5, fontFamily: fonts.extraBold, color: colors.ink },
  owner: { fontFamily: fonts.regular, color: colors.muted, fontSize: 13 },
  detail: { fontSize: 13, fontFamily: fonts.regular, color: colors.muted, marginTop: 3 },
  date: { fontSize: 13, fontFamily: fonts.extraBold, color: colors.coral, marginTop: 3 },
  del: { padding: 10 },
  empty: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    padding: 22,
    alignItems: 'center',
  },
  emptyTitle: { fontSize: 16, fontFamily: fonts.extraBold, color: colors.ink },
  emptySub: { fontSize: 13.5, fontFamily: fonts.regular, color: colors.muted, marginTop: 4, textAlign: 'center' },
});
