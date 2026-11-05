import { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Circle, Path } from 'react-native-svg';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import TopBar from '../../components/TopBar';
import DocIcon from '../../components/DocIcon';
import OptionSheet from '../../components/OptionSheet';
import { requestFilter, useDocs, usePeople } from '../../store';
import { daysLeft, fmtD, parseIso } from '../../lib/dates';
import { TYPE_LABELS } from '../../data/seed';
import { colors, fonts, gradients, radius } from '../../theme';
import Tap from '../../components/Tap';

// ---- status buckets, shared by stats / chart / categories / coverage ----
export function bucket(docs) {
  const b = { total: docs.length, valid: 0, soon: 0, expired: 0 };
  docs.forEach((d) => {
    const dl = daysLeft(d.expiry);
    if (dl < 0) b.expired += 1;
    else if (dl <= 30) b.soon += 1;
    else b.valid += 1;
  });
  return b;
}

function monthBuckets(docs, n) {
  const now = new Date();
  const out = [];
  for (let i = 0; i < n; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() + i, 1);
    const label = d.toLocaleDateString('en-US', { month: 'short' });
    const inMonth = docs.filter((doc) => {
      const e = parseIso(doc.expiry);
      return e.getFullYear() === d.getFullYear() && e.getMonth() === d.getMonth();
    });
    out.push({ label, count: inMonth.length, docs: inMonth });
  }
  return out;
}

// ---- little SVG icon set for the stat cards ----
function StatIcon({ kind }) {
  const conf = {
    doc: { c: colors.coral, bg: 'rgba(242,102,139,0.14)' },
    check: { c: '#16a34a', bg: 'rgba(22,163,74,0.12)' },
    clock: { c: '#d97706', bg: 'rgba(217,119,6,0.12)' },
    alert: { c: colors.red, bg: 'rgba(244,63,94,0.12)' },
  }[kind];
  const glyph =
    kind === 'doc' ? (
      <>
        <Path d="M6 3h8l4 4v14H6z" />
        <Path d="M14 3v4h4M9 12h6M9 16h4" />
      </>
    ) : kind === 'check' ? (
      <>
        <Circle cx="12" cy="12" r="9" />
        <Path d="M8.5 12.5l2.5 2.5 4.5-5.5" />
      </>
    ) : kind === 'clock' ? (
      <>
        <Circle cx="12" cy="12" r="9" />
        <Path d="M12 7v5l3.5 2" />
      </>
    ) : (
      <>
        <Path d="M12 3l10 18H2z" />
        <Path d="M12 10v5M12 18.5v.5" />
      </>
    );
  return (
    <View style={[styles.statIcon, { backgroundColor: conf.bg }]}>
      <Svg
        width={22}
        height={22}
        viewBox="0 0 24 24"
        fill="none"
        stroke={conf.c}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {glyph}
      </Svg>
    </View>
  );
}

function StatCard({ kind, num, label, onPress }) {
  return (
    <Tap style={styles.statCard} onPress={onPress}>
      <StatIcon kind={kind} />
      <Text style={styles.statNum}>{num}</Text>
      <Text style={styles.statLbl}>{label}</Text>
    </Tap>
  );
}

export default function Summary() {
  const docs = useDocs();
  const people = usePeople();
  const [range, setRange] = useState(6);
  const [rangeOpen, setRangeOpen] = useState(false);
  const [monthDocs, setMonthDocs] = useState(null); // {label, docs} for the bar sheet

  const b = useMemo(() => bucket(docs), [docs]);
  const bars = useMemo(() => monthBuckets(docs, range), [docs, range]);
  const maxBar = Math.max(1, ...bars.map((x) => x.count));

  const urgentCount = useMemo(
    () => docs.filter((d) => daysLeft(d.expiry) <= 30).length,
    [docs],
  );

  const typeCounts = useMemo(() => {
    const m = {};
    docs.forEach((d) => {
      m[d.type] = (m[d.type] || 0) + 1;
    });
    return Object.entries(m)
      .map(([type, count]) => ({ type, count }))
      .sort((a, z) => z.count - a.count);
  }, [docs]);
  const maxType = Math.max(1, ...typeCounts.map((x) => x.count));

  const openCoverage = () => router.push('/coverage');
  const openCategory = (type) => {
    requestFilter({ category: type });
    router.navigate('/home');
  };
  const openStatus = (status) => {
    requestFilter({ status });
    router.navigate('/home');
  };
  const pickRange = () => setRangeOpen(true);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        <TopBar
          onProfile={() => router.push('/profile')}
          onBell={() => router.push('/inbox')}
          hasAlerts={urgentCount > 0}
        />

        <Text style={styles.title}>Summary</Text>
        <Text style={styles.subtitle}>An overview of your documents</Text>

        <View style={styles.statGrid}>
          <StatCard kind="doc" num={b.total} label="Total Documents" onPress={() => openStatus(null)} />
          <StatCard kind="check" num={b.valid} label="Valid" onPress={() => openStatus('valid')} />
          <StatCard kind="clock" num={b.soon} label="Expiring Soon" onPress={() => openStatus('soon')} />
          <StatCard kind="alert" num={b.expired} label="Expired" onPress={() => openStatus('expired')} />
        </View>

        {docs.length > 0 && (
          <>
            <View style={styles.cardHead}>
              <Text style={styles.cardTitle}>Upcoming Expirations</Text>
              <Tap style={styles.rangeBtn} onPress={pickRange}>
                <Text style={styles.rangeText}>Next {range} Months</Text>
                <Svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke={colors.coral} strokeWidth={2.4}>
                  <Path d="M6 9l6 6-6 6" />
                </Svg>
              </Tap>
            </View>
            <View style={styles.chartCard}>
              <View style={styles.bars}>
                {bars.map((bar) => (
                  <Tap
                    key={bar.label}
                    style={styles.barCol}
                    onPress={() => bar.count > 0 && setMonthDocs({ label: bar.label, docs: bar.docs })}
                  >
                    <Text style={styles.barCount}>{bar.count}</Text>
                    <View style={styles.barTrack}>
                      <LinearGradient
                        colors={bar.count > 0 ? gradients.brand : ['#f3dfe4', '#f3dfe4']}
                        style={[styles.bar, { height: 18 + (bar.count / maxBar) * 92 }]}
                      />
                    </View>
                    <Text style={styles.barLabel}>{bar.label}</Text>
                  </Tap>
                ))}
              </View>
              <Text style={styles.chartHint}>Tap a bar to see what is expiring</Text>
            </View>

            <Text style={styles.cardTitlePad}>Documents by Category</Text>
            <View style={styles.listCard}>
              {typeCounts.map(({ type, count }, i) => (
                <Tap
                  key={type}
                  style={[styles.catRow, i === typeCounts.length - 1 && styles.catRowLast]}
                  onPress={() => openCategory(type)}
                >
                  <DocIcon type={type} size={40} />
                  <View style={styles.catMid}>
                    <Text style={styles.catName}>{TYPE_LABELS[type] || type}</Text>
                    <View style={styles.catTrack}>
                      <View style={[styles.catFill, { width: `${(count / maxType) * 100}%` }]} />
                    </View>
                  </View>
                  <Text style={styles.catCount}>{count}</Text>
                  <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke={colors.muted} strokeWidth={2.4}>
                    <Path d="M9 6l6 6-6 6" />
                  </Svg>
                </Tap>
              ))}
            </View>

            <Text style={styles.cardTitlePad}>Coverage by Person</Text>
            <Tap style={styles.coverRow} onPress={openCoverage}>
              <View style={styles.coverIcon}>
                <Svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke={colors.coral} strokeWidth={2} strokeLinecap="round">
                  <Path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                  <Circle cx="9" cy="7" r="4" />
                  <Path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
                </Svg>
              </View>
              <View style={styles.coverMid}>
                <Text style={styles.coverTitle}>Coverage by Person</Text>
                <Text style={styles.coverSub}>
                  {people.length + 1} People · {b.total} Documents
                </Text>
              </View>
              <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke={colors.muted} strokeWidth={2.4}>
                <Path d="M9 6l6 6-6 6" />
              </Svg>
            </Tap>
          </>
        )}

        <OptionSheet
          visible={rangeOpen}
          title="Show expirations for"
          options={[
            { id: '3', label: 'Next 3 months' },
            { id: '6', label: 'Next 6 months' },
            { id: '12', label: 'Next 12 months' },
          ]}
          selectedId={String(range)}
          onClose={() => setRangeOpen(false)}
          onSave={(o) => setRange(parseInt(o.id, 10))}
        />
        <OptionSheet
          visible={monthDocs !== null}
          title={monthDocs ? `Expiring in ${monthDocs.label}` : ''}
          options={(monthDocs ? monthDocs.docs : []).map((d) => ({
            id: d.id,
            label: d.name,
            sub: `Expires ${fmtD(d.expiry)}`,
          }))}
          onClose={() => setMonthDocs(null)}
          onSelect={(o) => {
            setMonthDocs(null);
            router.push(`/doc/${o.id}`);
          }}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  scroll: { flex: 1 },
  content: { paddingHorizontal: 18, paddingTop: 14, paddingBottom: 110 },
  title: { fontSize: 27, fontFamily: fonts.extraBold, color: colors.ink, letterSpacing: -0.6 },
  subtitle: { fontSize: 14, fontFamily: fonts.regular, color: colors.muted, marginTop: 4, marginBottom: 14 },
  statGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 6 },
  statCard: {
    width: '48%',
    flexGrow: 1,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 22,
    padding: 16,
    gap: 4,
  },
  statIcon: { width: 42, height: 42, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginBottom: 6 },
  statNum: { fontSize: 26, fontFamily: fonts.extraBold, color: colors.ink, letterSpacing: -0.5 },
  statLbl: { fontSize: 12, fontFamily: fonts.bold, color: colors.muted },
  cardHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 14, marginBottom: 10 },
  cardTitle: { fontSize: 17, fontFamily: fonts.extraBold, color: colors.ink, letterSpacing: -0.3 },
  cardTitlePad: { fontSize: 17, fontFamily: fonts.extraBold, color: colors.ink, letterSpacing: -0.3, marginTop: 16, marginBottom: 10 },
  rangeBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  rangeText: { fontSize: 13, fontFamily: fonts.extraBold, color: colors.coral },
  chartCard: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    padding: 16,
    paddingBottom: 10,
  },
  bars: { flexDirection: 'row', alignItems: 'flex-end' },
  barCol: { flex: 1, alignItems: 'center', gap: 6 },
  barCount: { fontSize: 13, fontFamily: fonts.extraBold, color: colors.ink },
  barTrack: { height: 110, justifyContent: 'flex-end' },
  bar: { width: 34, borderRadius: 9 },
  barLabel: { fontSize: 11.5, fontFamily: fonts.bold, color: colors.muted },
  chartHint: { fontSize: 12, fontFamily: fonts.regular, color: colors.muted, textAlign: 'center', marginTop: 8 },
  listCard: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  catRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: colors.border },
  catRowLast: { borderBottomWidth: 0 },
  catMid: { flex: 1, gap: 7 },
  catName: { fontSize: 14.5, fontFamily: fonts.bold, color: colors.ink },
  catTrack: { height: 7, borderRadius: 4, backgroundColor: '#f3e3e8', overflow: 'hidden' },
  catFill: { height: 7, borderRadius: 4, backgroundColor: colors.coral },
  catCount: { fontSize: 15, fontFamily: fonts.extraBold, color: colors.ink, minWidth: 20, textAlign: 'right' },
  coverRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    padding: 16,
  },
  coverIcon: { width: 44, height: 44, borderRadius: 15, backgroundColor: 'rgba(242,102,139,0.14)', alignItems: 'center', justifyContent: 'center' },
  coverMid: { flex: 1 },
  coverTitle: { fontSize: 16, fontFamily: fonts.extraBold, color: colors.ink },
  coverSub: { fontSize: 13, fontFamily: fonts.regular, color: colors.muted, marginTop: 3 },
});
