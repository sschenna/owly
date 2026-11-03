import { useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Circle, Path } from 'react-native-svg';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import TopBar from '../../components/TopBar';
import DocIcon from '../../components/DocIcon';
import { USER_NAME, requestFilter, useDocs, usePeople } from '../../store';
import { daysLeft, isoOf, parseIso, todayIso } from '../../lib/dates';
import { nudgeMap, weekDays } from '../../lib/nudges';
import { TYPE_LABELS } from '../../data/seed';
import { colors, fonts, gradients, radius } from '../../theme';

const comingSoon = (what, milestone) =>
  Alert.alert('Coming soon', `${what} lands in Milestone ${milestone}.`, [{ text: 'OK' }]);

const LETTERS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

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
    const count = docs.filter((doc) => {
      const e = parseIso(doc.expiry);
      return e.getFullYear() === d.getFullYear() && e.getMonth() === d.getMonth();
    }).length;
    out.push({ label, count });
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

function StatCard({ kind, num, label }) {
  return (
    <View style={styles.statCard}>
      <StatIcon kind={kind} />
      <Text style={styles.statNum}>{num}</Text>
      <Text style={styles.statLbl}>{label}</Text>
    </View>
  );
}

export default function Summary() {
  const docs = useDocs();
  const people = usePeople();
  const [selDay, setSelDay] = useState(todayIso());
  const [range, setRange] = useState(6);

  const days = useMemo(weekDays, []);
  const map = useMemo(() => nudgeMap(docs), [docs]);
  const tIso = todayIso();
  const b = useMemo(() => bucket(docs), [docs]);
  const bars = useMemo(() => monthBuckets(docs, range), [docs, range]);
  const maxBar = Math.max(1, ...bars.map((x) => x.count));

  const sorted = useMemo(
    () => docs.slice().sort((a, b) => daysLeft(a.expiry) - daysLeft(b.expiry)),
    [docs],
  );
  const urgent = sorted.filter((d) => {
    const dl = daysLeft(d.expiry);
    return dl < 0 || dl <= 30;
  });

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

  const dayItems = map[selDay] || [];
  const dayLabel = parseIso(selDay).toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });

  const openDoc = () => comingSoon('Document details', 3);
  const openCoverage = () => router.push('/coverage');
  const openCategory = (type) => {
    requestFilter({ category: type });
    router.push('/home');
  };
  const pickRange = () =>
    Alert.alert('Show expirations for', undefined, [
      { text: 'Next 3 months', onPress: () => setRange(3) },
      { text: 'Next 6 months', onPress: () => setRange(6) },
      { text: 'Next 12 months', onPress: () => setRange(12) },
      { text: 'Cancel', style: 'cancel' },
    ]);

  const heroUrgent = urgent.length > 1;
  const next = sorted[0];
  const nextDl = next ? daysLeft(next.expiry) : 0;
  const heroColors = heroUrgent
    ? gradients.red
    : nextDl < 0
      ? gradients.red
      : nextDl <= 90
        ? gradients.amber
        : gradients.green;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        <TopBar
          onProfile={() => comingSoon('Profile', 5)}
          onBell={() => comingSoon('The nudge inbox', 5)}
          hasAlerts={urgent.length > 0}
        />

        <Text style={styles.title}>
          Mission <Text style={styles.accent}>Control</Text>
        </Text>

        <Text style={styles.label}>This week</Text>
        <View style={styles.weekCard}>
          <View style={styles.week}>
            {days.map((d, i) => {
              const iso = isoOf(d);
              const isToday = iso === tIso;
              const isSel = iso === selDay;
              const has = map[iso] && map[iso].length > 0;
              return (
                <Pressable key={iso} style={styles.day} onPress={() => setSelDay(iso)}>
                  <Text style={styles.dayLetter}>{LETTERS[i]}</Text>
                  <View style={[styles.dayNum, isToday && styles.dayNumToday, !isToday && isSel && styles.dayNumSel]}>
                    <Text style={[styles.dayNumText, isToday && styles.dayNumTextToday]}>{d.getDate()}</Text>
                  </View>
                  <View style={[styles.dot, !has && styles.dotNone]} />
                </Pressable>
              );
            })}
          </View>
          <Text style={styles.dayTitle}>
            Nudges · <Text style={styles.accent}>{dayLabel}</Text>
          </Text>
          {dayItems.length ? (
            dayItems.map((n, i) => (
              <Pressable key={`${n.docId}-${n.days}-${i}`} style={styles.nudgeRow} onPress={openDoc}>
                <View style={styles.ndot} />
                <View style={styles.nudgeMid}>
                  <Text style={styles.nudgeName}>{n.docName}</Text>
                  <Text style={styles.nudgeSub}>
                    {n.days} days before · {n.time}
                  </Text>
                </View>
              </Pressable>
            ))
          ) : (
            <Text style={styles.quiet}>All quiet on this day. Enjoy it.</Text>
          )}
        </View>

        {docs.length > 0 && (
          <Pressable onPress={openDoc}>
            <LinearGradient colors={heroColors} style={styles.hero} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
              {heroUrgent ? (
                <>
                  <Text style={styles.heroKicker}>{urgent.length} documents need you</Text>
                  {urgent.slice(0, 3).map((d) => {
                    const dl = daysLeft(d.expiry);
                    return (
                      <View key={d.id} style={styles.heroRow}>
                        <Text style={styles.heroDoc} numberOfLines={1}>
                          {d.name}{' '}
                          <Text style={styles.heroDocSub}>
                            · {dl < 0 ? `expired ${-dl}d ago` : `${dl}d left`}
                          </Text>
                        </Text>
                      </View>
                    );
                  })}
                  {urgent.length > 3 && (
                    <Text style={styles.heroMore}>+{urgent.length - 3} more — see Home for the full list</Text>
                  )}
                </>
              ) : (
                <>
                  <Text style={styles.heroKicker}>Up next — tap to open</Text>
                  <Text style={styles.heroBig}>
                    {next.name}
                    {nextDl < 0 ? ` expired ${-nextDl} days ago` : ` waves goodbye in ${nextDl} days`}
                  </Text>
                </>
              )}
            </LinearGradient>
          </Pressable>
        )}

        <Text style={styles.label}>At a glance</Text>
        <View style={styles.statGrid}>
          <StatCard kind="doc" num={b.total} label="Total Documents" />
          <StatCard kind="check" num={b.valid} label="Valid" />
          <StatCard kind="clock" num={b.soon} label="Expiring Soon" />
          <StatCard kind="alert" num={b.expired} label="Expired" />
        </View>

        {docs.length > 0 && (
          <>
            <View style={styles.cardHead}>
              <Text style={styles.cardTitle}>Upcoming Expirations</Text>
              <Pressable style={styles.rangeBtn} onPress={pickRange}>
                <Text style={styles.rangeText}>Next {range} Months</Text>
                <Svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke={colors.coral} strokeWidth={2.4}>
                  <Path d="M6 9l6 6-6 6" />
                </Svg>
              </Pressable>
            </View>
            <View style={styles.chartCard}>
              <View style={styles.bars}>
                {bars.map((bar) => (
                  <View key={bar.label} style={styles.barCol}>
                    <Text style={styles.barCount}>{bar.count}</Text>
                    <View style={styles.barTrack}>
                      <LinearGradient
                        colors={bar.count > 0 ? gradients.brand : ['#f3dfe4', '#f3dfe4']}
                        style={[styles.bar, { height: 18 + (bar.count / maxBar) * 92 }]}
                      />
                    </View>
                    <Text style={styles.barLabel}>{bar.label}</Text>
                  </View>
                ))}
              </View>
            </View>

            <Text style={styles.cardTitlePad}>Documents by Category</Text>
            <View style={styles.listCard}>
              {typeCounts.map(({ type, count }) => (
                <Pressable key={type} style={styles.catRow} onPress={() => openCategory(type)}>
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
                </Pressable>
              ))}
            </View>

            <Text style={styles.cardTitlePad}>Coverage by Person</Text>
            <Pressable style={styles.coverRow} onPress={openCoverage}>
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
            </Pressable>
          </>
        )}

        <Text style={styles.foot}>
          Home is your action list — this is the view from 30,000 feet.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  scroll: { flex: 1 },
  content: { paddingHorizontal: 18, paddingTop: 14, paddingBottom: 110 },
  title: { fontSize: 27, fontFamily: fonts.extraBold, color: colors.ink, letterSpacing: -0.6, marginBottom: 4 },
  accent: { color: colors.coral },
  label: { fontSize: 13, fontFamily: fonts.extraBold, color: colors.coral, letterSpacing: 0.4, marginTop: 10, marginBottom: 8 },
  weekCard: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    padding: 14,
    paddingBottom: 8,
    shadowColor: '#be5a78',
    shadowOpacity: 0.1,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 8 },
    elevation: 3,
  },
  week: { flexDirection: 'row' },
  day: { flex: 1, alignItems: 'center', gap: 3, paddingVertical: 6 },
  dayLetter: { fontSize: 11, fontFamily: fonts.bold, color: colors.muted },
  dayNum: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  dayNumToday: { backgroundColor: colors.coral },
  dayNumSel: { backgroundColor: 'rgba(242,102,139,0.16)' },
  dayNumText: { fontSize: 16, fontFamily: fonts.extraBold, color: colors.ink },
  dayNumTextToday: { color: '#fff' },
  dot: { width: 5, height: 5, borderRadius: 3, backgroundColor: colors.coral },
  dotNone: { backgroundColor: 'transparent' },
  dayTitle: { fontSize: 14, fontFamily: fonts.extraBold, color: colors.ink, marginTop: 10, marginBottom: 4 },
  nudgeRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10, borderTopWidth: 1, borderTopColor: colors.border },
  ndot: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.coral },
  nudgeMid: { flex: 1 },
  nudgeName: { fontSize: 14.5, fontFamily: fonts.bold, color: colors.ink },
  nudgeSub: { fontSize: 12.5, fontFamily: fonts.regular, color: colors.muted, marginTop: 2 },
  quiet: { fontSize: 13, fontFamily: fonts.regular, color: colors.muted, marginVertical: 8 },
  hero: { borderRadius: 26, padding: 22, marginTop: 14, marginBottom: 6 },
  heroKicker: { color: '#fff', fontSize: 14, fontFamily: fonts.bold, opacity: 0.92, marginBottom: 4 },
  heroBig: { color: '#fff', fontSize: 24, fontFamily: fonts.extraBold, letterSpacing: -0.5, lineHeight: 30 },
  heroRow: { borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.25)', paddingVertical: 10 },
  heroDoc: { color: '#fff', fontSize: 15, fontFamily: fonts.extraBold },
  heroDocSub: { fontFamily: fonts.regular, fontSize: 13, opacity: 0.9 },
  heroMore: { color: '#fff', fontSize: 13, fontFamily: fonts.regular, opacity: 0.9, paddingTop: 4 },
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
  listCard: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  catRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: colors.border },
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
  foot: { fontSize: 12.5, fontFamily: fonts.regular, color: colors.muted, textAlign: 'center', marginTop: 18, lineHeight: 19 },
});
