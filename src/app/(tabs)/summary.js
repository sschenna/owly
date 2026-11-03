import { useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Circle } from 'react-native-svg';
import { LinearGradient } from 'expo-linear-gradient';
import TopBar from '../../components/TopBar';
import { useDocs } from '../../store';
import { daysLeft, fmtShort, isoOf, parseIso, todayIso } from '../../lib/dates';
import { nudgeMap, weekDays } from '../../lib/nudges';
import { colors, fonts, gradients, radius } from '../../theme';

const comingSoon = (what, milestone) =>
  Alert.alert('Coming soon', `${what} lands in Milestone ${milestone}.`, [{ text: 'OK' }]);

const LETTERS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

function HealthRing({ pct }) {
  const R = 30;
  const C = 2 * Math.PI * R;
  return (
    <View style={styles.ringWrap}>
      <Svg width={76} height={76} viewBox="0 0 76 76">
        <Circle cx={38} cy={38} r={R} fill="none" stroke={colors.border} strokeWidth={9} />
        <Circle
          cx={38}
          cy={38}
          r={R}
          fill="none"
          stroke={colors.coral}
          strokeWidth={9}
          strokeLinecap="round"
          strokeDasharray={`${(C * pct) / 100} ${C}`}
          transform="rotate(-90 38 38)"
        />
      </Svg>
      <View style={styles.ringCenter}>
        <Text style={styles.ringText}>{pct}%</Text>
      </View>
    </View>
  );
}

export default function Summary() {
  const docs = useDocs();
  const [selDay, setSelDay] = useState(todayIso());

  const days = useMemo(weekDays, []);
  const map = useMemo(() => nudgeMap(docs), [docs]);
  const tIso = todayIso();

  const sorted = useMemo(
    () => docs.slice().sort((a, b) => daysLeft(a.expiry) - daysLeft(b.expiry)),
    [docs],
  );
  const urgent = sorted.filter((d) => {
    const dl = daysLeft(d.expiry);
    return dl < 0 || dl <= 30;
  });
  const expired = docs.filter((d) => daysLeft(d.expiry) < 0).length;
  const soon = docs.filter((d) => {
    const dl = daysLeft(d.expiry);
    return dl >= 0 && dl <= 30;
  }).length;
  const health = docs.length
    ? Math.round((docs.filter((d) => daysLeft(d.expiry) >= 0).length / docs.length) * 100)
    : 0;

  const dayItems = map[selDay] || [];
  const dayLabel = parseIso(selDay).toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });

  const openDoc = () => comingSoon('Document details', 3);

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

        <View style={styles.health}>
          <HealthRing pct={health} />
          <View style={styles.healthMid}>
            <Text style={styles.healthTitle}>Document health</Text>
            <Text style={styles.healthSub}>
              {docs.length === 0
                ? 'Add documents to get your score.'
                : health === 100
                  ? 'Every document is healthy. Treat yourself.'
                  : health >= 60
                    ? 'Solid! Just keep an eye on the stragglers.'
                    : 'A few fires to put out — start at the top.'}
            </Text>
          </View>
        </View>

        <View style={styles.stats}>
          <View style={styles.stat}>
            <Text style={[styles.statNum, styles.accent]}>{docs.length}</Text>
            <Text style={styles.statLbl}>Tracked</Text>
          </View>
          <View style={styles.stat}>
            <Text style={[styles.statNum, { color: '#d97706' }]}>{soon}</Text>
            <Text style={styles.statLbl}>Heads-up</Text>
          </View>
          <View style={styles.stat}>
            <Text style={[styles.statNum, { color: colors.red }]}>{expired}</Text>
            <Text style={styles.statLbl}>Overdue</Text>
          </View>
        </View>

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
  hero: { borderRadius: 26, padding: 22, marginTop: 14, marginBottom: 14 },
  heroKicker: { color: '#fff', fontSize: 14, fontFamily: fonts.bold, opacity: 0.92, marginBottom: 4 },
  heroBig: { color: '#fff', fontSize: 24, fontFamily: fonts.extraBold, letterSpacing: -0.5, lineHeight: 30 },
  heroRow: { borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.25)', paddingVertical: 10 },
  heroDoc: { color: '#fff', fontSize: 15, fontFamily: fonts.extraBold },
  heroDocSub: { fontFamily: fonts.regular, fontSize: 13, opacity: 0.9 },
  heroMore: { color: '#fff', fontSize: 13, fontFamily: fonts.regular, opacity: 0.9, paddingTop: 4 },
  health: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    padding: 16,
    marginBottom: 12,
    backgroundColor: colors.surface,
  },
  ringWrap: { width: 76, height: 76, alignItems: 'center', justifyContent: 'center' },
  ringCenter: { position: 'absolute', alignItems: 'center', justifyContent: 'center' },
  ringText: { fontSize: 17, fontFamily: fonts.extraBold, color: colors.ink },
  healthMid: { flex: 1 },
  healthTitle: { fontSize: 15.5, fontFamily: fonts.extraBold, color: colors.ink, marginBottom: 3 },
  healthSub: { fontSize: 13, fontFamily: fonts.regular, color: colors.muted, lineHeight: 19 },
  stats: { flexDirection: 'row', gap: 10, marginBottom: 8 },
  stat: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 22,
    paddingVertical: 15,
    alignItems: 'center',
    backgroundColor: colors.surface,
  },
  statNum: { fontSize: 26, fontFamily: fonts.extraBold, letterSpacing: -0.5 },
  statLbl: { fontSize: 11.5, fontFamily: fonts.bold, color: colors.muted, marginTop: 2 },
  foot: { fontSize: 12.5, fontFamily: fonts.regular, color: colors.muted, textAlign: 'center', marginTop: 14, lineHeight: 19 },
});
