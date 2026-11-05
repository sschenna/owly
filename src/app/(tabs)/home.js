import { useCallback, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, View,  } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path } from 'react-native-svg';
import { router, useFocusEffect } from 'expo-router';
import DocRow from '../../components/DocRow';
import SwipeRow from '../../components/SwipeRow';
import OptionSheet from '../../components/OptionSheet';
import Owly from '../../components/Owly';
import TopBar from '../../components/TopBar';
import { USER_NAME, consumeFilter, updateDocs, useDocs, usePeople } from '../../store';
import { daysLeft } from '../../lib/dates';
import { TYPE_LABELS } from '../../data/seed';
import { colors, fonts, gradients, radius } from '../../theme';
import Tap from '../../components/Tap';

function Chip({ label, color, selected, onPress }) {
  return (
    <Tap
      style={[styles.chip, selected && styles.chipOn]}
      onPress={onPress}
    >
      {color ? <View style={[styles.chipDot, { backgroundColor: color }]} /> : null}
      <Text style={[styles.chipText, selected && styles.chipTextOn]}>{label}</Text>
    </Tap>
  );
}

function SectionHead({ title, accent, count, open, onToggle }) {
  return (
    <Tap style={styles.sect} onPress={onToggle}>
      <Text style={styles.sectTitle}>
        {title} <Text style={styles.sectAccent}>{accent}</Text>
      </Text>
      <View style={styles.countBadge}>
        <Text style={styles.countText}>{count}</Text>
      </View>
      <Svg
        width={18}
        height={18}
        viewBox="0 0 24 24"
        fill="none"
        stroke={colors.muted}
        strokeWidth={2.4}
        style={{ transform: [{ rotate: open ? '90deg' : '0deg' }] }}
      >
        <Path d="M6 9l6 6-6 6" />
      </Svg>
    </Tap>
  );
}

export default function Home() {
  const docs = useDocs();
  const people = usePeople();
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('all');
  const [category, setCategory] = useState(null);
  const [status, setStatus] = useState(null); // null | 'valid' | 'soon' | 'expired'
  const [chillOpen, setChillOpen] = useState(false);
  const [needyOpen, setNeedyOpen] = useState(true);
  const [delDoc, setDelDoc] = useState(null);

  // Arriving from Summary/Coverage with a filter request (owner, category, or
  // status). Each filter type resets the others so stale combinations can't
  // hide documents.
  useFocusEffect(
    useCallback(() => {
      const f = consumeFilter();
      if (f) {
        if (f.category) {
          setCategory(f.category);
          setFilter('all');
          setStatus(null);
        } else if (f.owner) {
          setFilter(f.owner);
          setCategory(null);
          setStatus(null);
        } else if ('status' in f) {
          setStatus(f.status); // null clears the status filter (e.g. "Total")
          setFilter('all');
          setCategory(null);
        }
        setQuery('');
      }
    }, []),
  );

  const sorted = useMemo(() => {
    let list = docs.slice().sort((a, b) => daysLeft(a.expiry) - daysLeft(b.expiry));
    if (filter !== 'all') list = list.filter((d) => d.owner === filter);
    if (category) list = list.filter((d) => d.type === category);
    if (status) {
      list = list.filter((d) => {
        const dl = daysLeft(d.expiry);
        if (status === 'expired') return dl < 0;
        if (status === 'soon') return dl >= 0 && dl <= 30;
        return dl > 30;
      });
    }
    const q = query.trim().toLowerCase();
    if (q) list = list.filter((d) => d.name.toLowerCase().includes(q));
    return list;
  }, [docs, filter, category, status, query]);

  const flatMode = query.trim().length > 0 || category !== null || status !== null;
  const needy = flatMode
    ? []
    : sorted.filter((d) => {
        const dl = daysLeft(d.expiry);
        return dl < 0 || dl <= 30;
      });
  const chill = flatMode ? [] : sorted.filter((d) => daysLeft(d.expiry) > 30);
  const ownerOf = (id) =>
    id === 'me' ? { id: 'me', name: USER_NAME } : people.find((p) => p.id === id);

  const renderDoc = (d) => (
    <SwipeRow key={d.id} onDelete={() => setDelDoc(d)}>
      <DocRow doc={d} owner={ownerOf(d.owner)} onPress={() => router.push(`/doc/${d.id}`)} />
    </SwipeRow>
  );

  const confirmDelete = () => {
    if (!delDoc) return;
    updateDocs((ds) => ds.filter((x) => x.id !== delDoc.id));
    setDelDoc(null);
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        <TopBar
          onProfile={() => router.push('/profile')}
          onBell={() => router.push('/inbox')}
          hasAlerts={needy.length > 0}
        />

        <LinearGradient colors={gradients.brand} style={styles.hero} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
          <View style={styles.heroLeft}>
            <Text style={styles.heroHead}>NEVER MISS{'\n'}AN EXPIRY</Text>
            <Tap style={styles.startBtn} onPress={() => router.push('/add')}>
              <Text style={styles.startText}>Start</Text>
            </Tap>
          </View>
          <Owly size={104} mood={needy.length ? 'chill' : 'happy'} hideCaption />
        </LinearGradient>

        <View style={styles.searchRow}>
          <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke={colors.muted} strokeWidth={2}>
            <Path d="M11 4a7 7 0 1 0 0 14 7 7 0 0 0 0-14z" />
            <Path d="M20 20l-3.5-3.5" />
          </Svg>
          <TextInput
            style={styles.search}
            placeholder="Search documents…"
            placeholderTextColor={colors.muted}
            value={query}
            onChangeText={setQuery}
          />
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chips}
        >
          <Chip label="All" selected={filter === 'all'} onPress={() => setFilter('all')} />
          <Chip label={USER_NAME} selected={filter === 'me'} onPress={() => setFilter('me')} />
          {people.map((p) => (
            <Chip
              key={p.id}
              label={p.name}
              color={p.color}
              selected={filter === p.id}
              onPress={() => setFilter(p.id)}
            />
          ))}
        </ScrollView>

        {category && (
          <Tap style={styles.filterPill} onPress={() => setCategory(null)}>
            <Text style={styles.filterPillText}>
              {TYPE_LABELS[category] || category} <Text style={styles.filterX}>✕</Text>
            </Text>
          </Tap>
        )}
        {status && (
          <Tap style={styles.filterPill} onPress={() => setStatus(null)}>
            <Text style={styles.filterPillText}>
              {status === 'valid' ? 'Valid' : status === 'soon' ? 'Expiring soon' : 'Expired'}{' '}
              <Text style={styles.filterX}>✕</Text>
            </Text>
          </Tap>
        )}

        {flatMode ? (
          sorted.length ? (
            sorted.map(renderDoc)
          ) : (
            <View style={styles.empty}>
              <Text style={styles.emptyTitle}>
                {category ? (
                  <>No <Text style={styles.sectAccent}>{TYPE_LABELS[category]}</Text> documents here</>
                ) : status ? (
                  <>No <Text style={styles.sectAccent}>{status === 'valid' ? 'valid' : status === 'soon' ? 'expiring soon' : 'expired'}</Text> documents here</>
                ) : (
                  <>No matches for <Text style={styles.sectAccent}>"{query.trim()}"</Text></>
                )}
              </Text>
              <Text style={styles.emptySub}>
                {category || status ? 'Tap the pill above to clear the filter.' : 'Try a different search.'}
              </Text>
            </View>
          )
        ) : (
          <>
            {needy.length ? (
              <Tap onPress={() => router.navigate('/summary')}>
                <LinearGradient colors={gradients.red} style={styles.alert} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
                  <Text style={styles.alertText}>
                    Uh oh — {needy.length} document{needy.length > 1 ? 's' : ''} need
                    {needy.length > 1 ? '' : 's'} you now!
                  </Text>
                </LinearGradient>
              </Tap>
            ) : (
              <LinearGradient colors={gradients.green} style={styles.alert} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
                <Text style={styles.alertText}>All clear — everyone's on best behavior.</Text>
              </LinearGradient>
            )}

            {needy.length > 0 && (
              <>
                <SectionHead
                  title="Needs"
                  accent="you now"
                  count={needy.length}
                  open={needyOpen}
                  onToggle={() => setNeedyOpen((v) => !v)}
                />
                {needyOpen && needy.map(renderDoc)}
              </>
            )}
            {chill.length > 0 && (
              <>
                <SectionHead
                  title="Chill"
                  accent="zone"
                  count={chill.length}
                  open={chillOpen}
                  onToggle={() => setChillOpen((v) => !v)}
                />
                {chillOpen && chill.map(renderDoc)}
              </>
            )}
            {!needy.length && !chill.length && (
              <View style={styles.empty}>
                <Text style={styles.emptyTitle}>Squeaky clean!</Text>
                <Text style={styles.emptySub}>Tap Start to track your first document.</Text>
              </View>
            )}
          </>
        )}
      </ScrollView>

      <OptionSheet
        visible={!!delDoc}
        title="Delete this document?"
        options={delDoc ? [{ id: 'del', label: `Delete "${delDoc.name}"`, sub: 'Gone for good — no undo', destructive: true }] : []}
        onClose={() => setDelDoc(null)}
        onSelect={confirmDelete}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  scroll: { flex: 1 },
  content: { paddingHorizontal: 18, paddingTop: 14, paddingBottom: 110 },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.pill,
    paddingHorizontal: 16,
    paddingVertical: 11,
    marginBottom: 12,
  },
  search: { flex: 1, fontSize: 15, fontFamily: fonts.regular, color: colors.ink },
  hero: {
    borderRadius: 28,
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
    shadowColor: colors.coral,
    shadowOpacity: 0.35,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 10 },
    elevation: 6,
  },
  heroLeft: { flex: 1 },
  heroHead: { color: '#fff', fontSize: 22, fontFamily: fonts.extraBold, letterSpacing: 0.5, lineHeight: 28, marginBottom: 12 },
  startBtn: {
    backgroundColor: '#fff',
    borderRadius: radius.pill,
    paddingHorizontal: 32,
    paddingVertical: 12,
    alignSelf: 'flex-start',
  },
  startText: { color: '#e14e73', fontFamily: fonts.extraBold, fontSize: 15 },
  chips: { gap: 8, paddingVertical: 12, paddingRight: 18 },
  filterPill: {
    alignSelf: 'flex-start',
    backgroundColor: colors.coral,
    borderRadius: radius.pill,
    paddingHorizontal: 16,
    paddingVertical: 9,
    marginBottom: 4,
  },
  filterPillText: { color: '#fff', fontSize: 13.5, fontFamily: fonts.extraBold },
  filterX: { fontSize: 12 },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    borderRadius: radius.pill,
    paddingHorizontal: 16,
    paddingVertical: 9,
  },
  chipOn: { backgroundColor: colors.coral, borderColor: 'transparent' },
  chipDot: { width: 10, height: 10, borderRadius: 5 },
  chipText: { fontSize: 13.5, fontFamily: fonts.extraBold, color: colors.ink },
  chipTextOn: { color: '#fff' },
  alert: { borderRadius: 22, padding: 15, marginBottom: 6 },
  alertText: { color: '#fff', fontSize: 14.5, fontFamily: fonts.bold },
  sect: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 14, marginBottom: 10 },
  sectTitle: { fontSize: 17, fontFamily: fonts.extraBold, color: colors.ink, letterSpacing: -0.3 },
  sectAccent: { color: colors.coral },
  countBadge: { backgroundColor: colors.coral, borderRadius: radius.pill, paddingHorizontal: 11, paddingVertical: 4 },
  countText: { color: '#fff', fontSize: 12, fontFamily: fonts.extraBold },
  empty: { alignItems: 'center', paddingVertical: 36 },
  emptyTitle: { fontSize: 19, fontFamily: fonts.extraBold, color: colors.ink, marginBottom: 6 },
  emptySub: { fontSize: 14, fontFamily: fonts.regular, color: colors.muted, textAlign: 'center', lineHeight: 21 },
});
