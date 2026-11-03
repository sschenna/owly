import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { LinearGradient } from 'expo-linear-gradient';
import TimeSheet from './TimeSheet';
import OptionSheet from './OptionSheet';
import { colors, fonts, gradients, radius } from '../theme';
import { daysLeft, fmtShort } from '../lib/dates';
import { effDate } from '../lib/nudges';

// The nudge manager: list, add, change time, snooze, delete.
// Controlled: parent owns `reminders` and applies `onChange(next)`.
export default function NudgeList({ reminders, onChange, expiry }) {
  const [adding, setAdding] = useState(false);
  const [days, setDays] = useState('');
  const [time, setTime] = useState('09:00');
  const [timeOpen, setTimeOpen] = useState(false);
  const [notice, setNotice] = useState('');
  const [actNudge, setActNudge] = useState(null); // nudge with open action sheet
  const [snoozeFor, setSnoozeFor] = useState(null);
  const [delNudge, setDelNudge] = useState(null);
  const [pastWarn, setPastWarn] = useState(null); // days value awaiting confirm

  const sorted = (reminders || []).slice().sort((a, b) => b.d - a.d);
  const dl = expiry ? daysLeft(expiry) : null;

  const commit = (next) => onChange(next);

  const addNudge = () => {
    const d = parseInt(days, 10);
    if (!d || d <= 0) {
      setNotice('Give me a number of days greater than zero.');
      return;
    }
    if (sorted.some((n) => n.d === d)) {
      setNotice(`You already have a ${d}-day nudge.`);
      return;
    }
    setNotice('');
    if (dl !== null && d > dl) {
      setPastWarn(d);
    } else {
      doAdd(d);
    }
  };

  const doAdd = (d) => {
    commit([...sorted, { d, t: time, snooze: null }]);
    setDays('');
    setAdding(false);
    setPastWarn(null);
  };

  const snoozeTo = (n, addDays) => {
    const dt = effDate(expiry, n);
    dt.setDate(dt.getDate() + addDays);
    const iso = dt.toISOString().slice(0, 10);
    commit(sorted.map((x) => (x.d === n.d ? { ...x, snooze: iso } : x)));
    setSnoozeFor(null);
    setActNudge(null);
  };

  return (
    <View>
      {sorted.length === 0 && (
        <View style={styles.empty}>
          <Text style={styles.emptyTitle}>No nudges yet</Text>
          <Text style={styles.emptySub}>Add one below — future you says thanks.</Text>
        </View>
      )}
      {sorted.map((n) => (
        <Pressable key={n.d} style={styles.row} onPress={() => setActNudge(n)}>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{n.d}d</Text>
          </View>
          <View style={styles.mid}>
            <Text style={styles.name}>
              {n.d} {n.d === 1 ? 'day' : 'days'} before
            </Text>
            <Text style={styles.sub}>
              {n.t}
              {n.snooze ? ` · snoozed to ${fmtShort(n.snooze)}` : ''}
            </Text>
          </View>
          <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke={colors.muted} strokeWidth={2.4}>
            <Path d="M9 6l6 6-6 6" />
          </Svg>
        </Pressable>
      ))}

      {adding ? (
        <View style={styles.addCard}>
          <Text style={styles.addLabel}>Remind me</Text>
          {notice ? <Text style={styles.notice}>{notice}</Text> : null}
          <View style={styles.addRow}>
            <TextInput
              style={styles.daysInput}
              value={days}
              onChangeText={(t) => setDays(t.replace(/[^0-9]/g, ''))}
              placeholder="30"
              placeholderTextColor={colors.muted}
              keyboardType="number-pad"
              maxLength={4}
            />
            <Text style={styles.daysAfter}>days before, at</Text>
            <Pressable style={styles.timeBtn} onPress={() => setTimeOpen('new')}>
              <Text style={styles.timeText}>{time}</Text>
            </Pressable>
          </View>
          <View style={styles.addBtns}>
            <Pressable style={styles.cancelBtn} onPress={() => setAdding(false)}>
              <Text style={styles.cancelText}>Cancel</Text>
            </Pressable>
            <Pressable onPress={addNudge}>
              <LinearGradient colors={gradients.brand} style={styles.saveBtn} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
                <Text style={styles.saveText}>Add nudge</Text>
              </LinearGradient>
            </Pressable>
          </View>
        </View>
      ) : (
        <Pressable style={styles.addMore} onPress={() => setAdding(true)}>
          <Text style={styles.addMoreText}>+ Add custom nudge</Text>
        </Pressable>
      )}

      <TimeSheet
        visible={timeOpen !== false}
        initial={time}
        onClose={() => setTimeOpen(false)}
        onPick={(t) => {
          if (timeOpen === 'new') {
            setTime(t);
          } else {
            commit(sorted.map((x) => (x.d === timeOpen ? { ...x, t } : x)));
          }
        }}
      />

      <OptionSheet
        visible={actNudge !== null}
        title={actNudge ? `${actNudge.d} days before · ${actNudge.t}` : ''}
        options={[
          { id: 'time', label: 'Change time' },
          actNudge && actNudge.snooze
            ? { id: 'unsnooze', label: 'Clear snooze', sub: `Back to ${fmtShort(effDate(expiry, { ...actNudge, snooze: null }))}` }
            : { id: 'snooze', label: 'Snooze', sub: 'Push this nudge to later' },
          { id: 'delete', label: 'Delete nudge', destructive: true },
        ]}
        onClose={() => setActNudge(null)}
        onSelect={(o) => {
          const n = actNudge;
          setActNudge(null);
          if (o.id === 'time') {
            setTime(n.t);
            setTimeOpen(n.d);
          } else if (o.id === 'unsnooze') {
            commit(sorted.map((x) => (x.d === n.d ? { ...x, snooze: null } : x)));
          } else if (o.id === 'snooze') {
            setSnoozeFor(n);
          } else if (o.id === 'delete') {
            setDelNudge(n);
          }
        }}
      />
      <OptionSheet
        visible={snoozeFor !== null}
        title="Snooze until"
        options={[
          { id: 'tomorrow', label: 'Tomorrow' },
          { id: 'week', label: 'Next week' },
        ]}
        onClose={() => setSnoozeFor(null)}
        onSelect={(o) => snoozeTo(snoozeFor, o.id === 'tomorrow' ? 1 : 7)}
      />
      <OptionSheet
        visible={delNudge !== null}
        title="Delete this nudge?"
        options={[{ id: 'del', label: `Delete the ${delNudge ? delNudge.d : ''}-day nudge`, destructive: true }]}
        onClose={() => setDelNudge(null)}
        onSelect={() => {
          commit(sorted.filter((x) => x.d !== delNudge.d));
          setDelNudge(null);
        }}
      />
      <OptionSheet
        visible={pastWarn !== null}
        title="Heads up"
        options={[
          {
            id: 'add',
            label: 'Add anyway',
            sub: `That's ${pastWarn} days out, but the document expires in ${dl} days — this nudge would already be in the past.`,
          },
        ]}
        onClose={() => setPastWarn(null)}
        onSelect={() => doAdd(pastWarn)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  empty: { alignItems: 'center', paddingVertical: 20 },
  emptyTitle: { fontSize: 16, fontFamily: fonts.extraBold, color: colors.ink },
  emptySub: { fontSize: 13, fontFamily: fonts.regular, color: colors.muted, marginTop: 4 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    padding: 14,
    marginBottom: 10,
  },
  badge: {
    backgroundColor: 'rgba(242,102,139,0.14)',
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  badgeText: { color: colors.coral, fontFamily: fonts.extraBold, fontSize: 15 },
  mid: { flex: 1 },
  name: { fontSize: 15.5, fontFamily: fonts.extraBold, color: colors.ink },
  sub: { fontSize: 13, fontFamily: fonts.regular, color: colors.muted, marginTop: 3 },
  addMore: {
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: colors.coral,
    borderRadius: radius.lg,
    paddingVertical: 15,
    alignItems: 'center',
    marginTop: 2,
  },
  addMoreText: { color: colors.coral, fontFamily: fonts.extraBold, fontSize: 15 },
  addCard: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    padding: 16,
    marginTop: 2,
  },
  addLabel: { fontSize: 13, fontFamily: fonts.extraBold, color: colors.coral, letterSpacing: 0.4, marginBottom: 10 },
  notice: { fontSize: 13.5, fontFamily: fonts.bold, color: colors.red, marginBottom: 10 },
  addRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 14 },
  daysInput: {
    width: 74,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: 14,
    paddingVertical: 10,
    textAlign: 'center',
    fontSize: 17,
    fontFamily: fonts.extraBold,
    color: colors.ink,
    backgroundColor: colors.bg,
  },
  daysAfter: { fontSize: 14.5, fontFamily: fonts.regular, color: colors.ink },
  timeBtn: {
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: colors.bg,
  },
  timeText: { fontSize: 16, fontFamily: fonts.extraBold, color: colors.coral },
  addBtns: { flexDirection: 'row', gap: 10, justifyContent: 'flex-end' },
  cancelBtn: { paddingVertical: 12, paddingHorizontal: 16 },
  cancelText: { fontSize: 15, fontFamily: fonts.bold, color: colors.muted },
  saveBtn: { borderRadius: radius.pill, paddingVertical: 12, paddingHorizontal: 22 },
  saveText: { color: '#fff', fontSize: 15, fontFamily: fonts.extraBold },
});
