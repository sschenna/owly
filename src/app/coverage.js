import { useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';
import { router } from 'expo-router';
import { USER_NAME, requestFilter, useDocs, usePeople } from '../store';
import { daysLeft } from '../lib/dates';
import { initials } from '../lib/format';
import { bucket } from './(tabs)/summary';
import { colors, fonts, radius } from '../theme';

// Drill-down from Summary: every person, and how their documents are doing.
// Tapping a person jumps to Home filtered to them.
function personDocs(allDocs, id) {
  return allDocs.filter((d) => d.owner === id);
}

function PersonCard({ id, name, color, docs }) {
  const b = bucket(docs);
  const open = () => {
    requestFilter({ owner: id });
    router.navigate('/home');
  };
  return (
    <Pressable style={styles.card} onPress={open}>
      <View style={styles.top}>
        <View style={[styles.avatar, { backgroundColor: color }]}>
          <Text style={styles.avatarText}>{initials(name)}</Text>
        </View>
        <View style={styles.mid}>
          <Text style={styles.name}>{name}</Text>
          <Text style={styles.sub}>
            {b.total} Document{b.total === 1 ? '' : 's'}
          </Text>
        </View>
        <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke={colors.muted} strokeWidth={2.4}>
          <Path d="M9 6l6 6-6 6" />
        </Svg>
      </View>
      <View style={styles.counts}>
        <View style={styles.count}>
          <View style={styles.countHead}>
            <View style={[styles.dot, { backgroundColor: '#16a34a' }]} />
            <Text style={styles.countLbl}>Valid</Text>
          </View>
          <Text style={styles.countNum}>{b.valid}</Text>
        </View>
        <View style={styles.div} />
        <View style={styles.count}>
          <View style={styles.countHead}>
            <View style={[styles.dot, { backgroundColor: '#d97706' }]} />
            <Text style={styles.countLbl}>Expiring Soon</Text>
          </View>
          <Text style={styles.countNum}>{b.soon}</Text>
        </View>
        <View style={styles.div} />
        <View style={styles.count}>
          <View style={styles.countHead}>
            <View style={[styles.dot, { backgroundColor: colors.red }]} />
            <Text style={styles.countLbl}>Expired</Text>
          </View>
          <Text style={styles.countNum}>{b.expired}</Text>
        </View>
      </View>
    </Pressable>
  );
}

export default function Coverage() {
  const docs = useDocs();
  const people = usePeople();

  const entries = useMemo(
    () => [
      { id: 'me', name: USER_NAME, color: colors.coral },
      ...people.map((p) => ({ id: p.id, name: p.name, color: p.color })),
    ],
    [people],
  );

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        <Pressable style={styles.back} onPress={() => router.back()}>
          <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke={colors.coral} strokeWidth={2.6}>
            <Path d="M15 6l-6 6 6 6" />
          </Svg>
          <Text style={styles.backText}>Summary</Text>
        </Pressable>

        <Text style={styles.title}>Coverage by Person</Text>
        <Text style={styles.sub}>
          {entries.length} People · {docs.length} Documents
        </Text>

        {entries.map((e) => (
          <PersonCard key={e.id} id={e.id} name={e.name} color={e.color} docs={personDocs(docs, e.id)} />
        ))}

        <Text style={styles.foot}>Tap a person to see their documents on Home.</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  scroll: { flex: 1 },
  content: { paddingHorizontal: 18, paddingTop: 14, paddingBottom: 40 },
  back: { flexDirection: 'row', alignItems: 'center', gap: 2, marginBottom: 12, alignSelf: 'flex-start' },
  backText: { fontSize: 15, fontFamily: fonts.bold, color: colors.coral },
  title: { fontSize: 27, fontFamily: fonts.extraBold, color: colors.ink, letterSpacing: -0.6 },
  sub: { fontSize: 14, fontFamily: fonts.regular, color: colors.muted, marginTop: 4, marginBottom: 16 },
  card: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    padding: 18,
    marginBottom: 14,
    shadowColor: '#be5a78',
    shadowOpacity: 0.08,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 6 },
    elevation: 2,
  },
  top: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 14 },
  avatar: { width: 52, height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: '#fff', fontSize: 18, fontFamily: fonts.extraBold },
  mid: { flex: 1 },
  name: { fontSize: 18, fontFamily: fonts.extraBold, color: colors.ink, letterSpacing: -0.3 },
  counts: { flexDirection: 'row', alignItems: 'center' },
  count: { flex: 1, alignItems: 'center', gap: 5 },
  countHead: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  countLbl: { fontSize: 12, fontFamily: fonts.bold, color: colors.muted },
  countNum: { fontSize: 22, fontFamily: fonts.extraBold, color: colors.ink },
  div: { width: 1, height: 40, backgroundColor: colors.border },
  foot: { fontSize: 12.5, fontFamily: fonts.regular, color: colors.muted, textAlign: 'center', marginTop: 8 },
});
