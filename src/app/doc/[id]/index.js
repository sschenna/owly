import { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import DocIcon from '../../../components/DocIcon';
import RowItem from '../../../components/RowItem';
import OptionSheet from '../../../components/OptionSheet';
import CalendarSheet from '../../../components/CalendarSheet';
import Comments from '../../../components/Comments';
import { USER_NAME, getPeople, updateDocs, useDocs } from '../../../store';
import { colors, fonts, gradients, radius } from '../../../theme';
import { daysLeft, fmtD, todayIso } from '../../../lib/dates';
import { NAG_FREQS, PARTNERS, REPEAT_OPTIONS, SOUNDS } from '../../../data/seed';
import { previewSound } from '../../../lib/sounds';
import { initials } from '../../../lib/format';

// Document detail: countdown hero, editable rows, checklist,
// renewal history, partner card, comments. Tapping the Expiry date
// asks "did you renew?" — Yes records the renewal, No just fixes the date.
export default function Detail() {
  const { id } = useLocalSearchParams();
  const docs = useDocs();
  const people = getPeople();
  const doc = docs.find((d) => d.id === id);

  const [sheet, setSheet] = useState(null); // repeat | nag | sound
  const [cal, setCal] = useState(null); // { mode: 'correct' | 'renew' }
  const [renewAsk, setRenewAsk] = useState(false);
  const [delAsk, setDelAsk] = useState(false);
  const [feeOpen, setFeeOpen] = useState(false);
  const [fee, setFee] = useState('');
  const [renewDate, setRenewDate] = useState(null);

  if (!doc) {
    return (
      <SafeAreaView style={styles.safe}>
        <Text style={styles.missing}>Couldn't find that document.</Text>
      </SafeAreaView>
    );
  }

  const patch = (fn) => updateDocs((ds) => ds.map((d) => (d.id === id ? fn(d) : d)));
  const dl = daysLeft(doc.expiry);
  const owner = doc.owner === 'me' ? { id: 'me', name: USER_NAME, color: colors.coral } : people.find((p) => p.id === doc.owner);

  const heroColors = dl < 0 ? gradients.red : dl <= 30 ? gradients.amber : gradients.green;
  const bigText = dl < 0 ? `${-dl}d overdue` : dl === 0 ? 'Today!' : `${dl} days left`;

  // ---- expiry date: the renew-or-correct flow ----
  const onExpiryPress = () => setRenewAsk(true);

  const onPickDate = (iso) => {
    if (cal.mode === 'correct') {
      patch((d) => ({ ...d, expiry: iso }));
      setCal(null);
    } else {
      setRenewDate(iso);
      setFee('');
      setCal(null);
      setFeeOpen(true);
    }
  };

  const saveRenewal = () => {
    patch((d) => ({
      ...d,
      expiry: renewDate,
      history: [{ date: renewDate, fee: fee.trim() }, ...d.history],
      checkItems: d.checkItems.map((c) => ({ ...c, done: false })),
      reminders: d.reminders.map((r) => ({ ...r, snooze: null })),
    }));
    setFeeOpen(false);
  };

  const toggleCheck = (i) =>
    patch((d) => ({
      ...d,
      checkItems: d.checkItems.map((c, ci) => (ci === i ? { ...c, done: !c.done } : c)),
    }));

  const del = () => setDelAsk(true);
  const confirmDelete = () => {
    setDelAsk(false);
    updateDocs((ds) => ds.filter((d) => d.id !== id));
    router.back();
  };

  const nagLabel = !doc.nag ? 'Off' : (NAG_FREQS.find((f) => f.id === doc.nagFreq) || {}).label || 'Every day';
  const partner = PARTNERS[doc.type];
  const showPartner = partner && (dl < 0 || dl <= 30);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <KeyboardAvoidingView
        style={styles.kb}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={0}
      >
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.topRow}>
          <Pressable style={styles.back} onPress={() => router.back()}>
            <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke={colors.coral} strokeWidth={2.6}>
              <Path d="M15 6l-6 6 6 6" />
            </Svg>
            <Text style={styles.backText}>Home</Text>
          </Pressable>
          <Pressable onPress={() => router.push(`/add?edit=${id}`)}>
            <Text style={styles.editText}>Edit</Text>
          </Pressable>
        </View>

        <LinearGradient colors={heroColors} style={styles.hero} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
          <DocIcon type={doc.type} size={76} />
          <View style={styles.heroMid}>
            <Text style={styles.heroName} numberOfLines={2}>
              {doc.name}
            </Text>
            <View style={styles.ownerRow}>
              {owner && owner.id !== 'me' && (
                <View style={[styles.ownerBadge, { backgroundColor: 'rgba(255,255,255,0.3)' }]}>
                  <Text style={styles.ownerText}>{initials(owner.name)}</Text>
                </View>
              )}
              <Text style={styles.heroOwner}>{owner ? (owner.id === 'me' ? 'Yours' : `${owner.name}'s`) : ''}</Text>
            </View>
          </View>
          <Text style={styles.heroBig}>{bigText}</Text>
        </LinearGradient>

        <View style={styles.card}>
          <RowItem label="Expiry date" value={fmtD(doc.expiry)} onPress={onExpiryPress} />
          <RowItem
            label="Nudge plan"
            value={doc.reminders.length === 0 ? 'Off' : `${doc.reminders.length} nudge${doc.reminders.length > 1 ? 's' : ''}`}
            onPress={() => router.push(`/doc/${id}/nudges`)}
          />
          <RowItem label="Repeat" value={(doc.repeat && doc.repeat.label) || 'Off'} onPress={() => setSheet('repeat')} />
          <RowItem label="Nag me" value={nagLabel} onPress={() => setSheet('nag')} />
          <RowItem label="Sound" value={doc.sound} onPress={() => setSheet('sound')} last />
        </View>

        {doc.checkItems.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Renewal checklist</Text>
            <View style={styles.card}>
              {doc.checkItems.map((c, i) => (
                <Pressable
                  key={i}
                  style={[styles.check, i === doc.checkItems.length - 1 && styles.last]}
                  onPress={() => toggleCheck(i)}
                >
                  <View style={[styles.box, c.done && styles.boxDone]}>
                    {c.done && (
                      <Svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={3}>
                        <Path d="M5 13l4 4L19 7" />
                      </Svg>
                    )}
                  </View>
                  <Text style={[styles.checkText, c.done && styles.checkDone]}>{c.text}</Text>
                </Pressable>
              ))}
            </View>
          </View>
        )}

        {doc.history.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Renewal history</Text>
            <View style={styles.card}>
              {doc.history.map((h, i) => (
                <View key={i} style={[styles.hist, i === doc.history.length - 1 && styles.last]}>
                  <Text style={styles.histDate}>{fmtD(h.date)}</Text>
                  <Text style={styles.histFee}>{h.fee ? `$${h.fee}` : '—'}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {showPartner && (
          <Pressable
            style={styles.partnerWrap}
            onPress={() => Alert.alert('Demo link', `This would open ${partner.partner} in your browser.`, [{ text: 'OK' }])}
          >
            <LinearGradient colors={gradients.brandPurple} style={styles.partner} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
              <Text style={styles.partnerLabel}>{partner.label}</Text>
              <Text style={styles.partnerSub}>{partner.sub}</Text>
              <Text style={styles.partnerFine}>Partner link · we may earn a commission at no cost to you</Text>
            </LinearGradient>
          </Pressable>
        )}

        <Comments doc={doc} />

        <Pressable style={styles.delete} onPress={del}>
          <Text style={styles.deleteText}>Delete document</Text>
        </Pressable>
      </ScrollView>
      </KeyboardAvoidingView>

      <OptionSheet
        visible={sheet === 'repeat'}
        title="Repeat"
        options={REPEAT_OPTIONS.map((o) => ({ id: o.id, label: o.label }))}
        selectedId={doc.repeat ? doc.repeat.id : 'off'}
        onClose={() => setSheet(null)}
        onSelect={(o) => {
          const full = REPEAT_OPTIONS.find((x) => x.id === o.id);
          patch((d) => ({ ...d, repeat: o.id === 'off' ? null : full }));
        }}
      />
      <OptionSheet
        visible={sheet === 'nag'}
        title="Nag me"
        options={[{ id: 'off', label: 'Off', sub: 'No nagging — just the nudges' }, ...NAG_FREQS.map((f) => ({ id: f.id, label: f.label }))]}
        selectedId={!doc.nag ? 'off' : doc.nagFreq}
        onClose={() => setSheet(null)}
        onSelect={(o) => patch((d) => ({ ...d, nag: o.id !== 'off', nagFreq: o.id === 'off' ? d.nagFreq : o.id }))}
      />
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
        renderRight={() => (
          <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke={colors.coral} strokeWidth={2}>
            <Path d="M11 5L6 9H2v6h4l5 4V5z" />
            <Path d="M15.5 8.5a5 5 0 0 1 0 7M19 5a9 9 0 0 1 0 14" />
          </Svg>
        )}
      />

      <OptionSheet
        visible={renewAsk}
        title={`Did you renew "${doc.name}"?`}
        options={[
          { id: 'yes', label: 'Yes, renewed!', sub: 'Pick the new expiry date — I\u2019ll record it in your renewal history' },
          { id: 'no', label: 'No, just fixing the date', sub: 'Only correct the date, no history entry' },
        ]}
        onClose={() => setRenewAsk(false)}
        onSelect={(o) => {
          setRenewAsk(false);
          setCal({ mode: o.id === 'yes' ? 'renew' : 'correct' });
        }}
      />
      <OptionSheet
        visible={delAsk}
        title="Delete this document?"
        options={[{ id: 'del', label: `Delete "${doc.name}"`, sub: 'Gone for good — no undo', destructive: true }]}
        onClose={() => setDelAsk(false)}
        onSelect={confirmDelete}
      />
      <CalendarSheet
        visible={cal !== null}
        initial={cal && cal.mode === 'correct' ? doc.expiry : todayIso()}
        minToday={cal && cal.mode === 'renew'}
        onClose={() => setCal(null)}
        onPick={onPickDate}
      />

      <Modal visible={feeOpen} transparent animationType="fade" onRequestClose={() => setFeeOpen(false)}>
        <Pressable style={styles.feeBackdrop} onPress={() => setFeeOpen(false)}>
          <Pressable style={styles.feeCard} onPress={(e) => e.stopPropagation()}>
            <Text style={styles.feeTitle}>Nice — renewed!</Text>
            <Text style={styles.feeSub}>What did it cost? (optional)</Text>
            <View style={styles.feeRow}>
              <Text style={styles.dollar}>$</Text>
              <TextInput
                style={styles.feeInput}
                value={fee}
                onChangeText={(t) => setFee(t.replace(/[^0-9.]/g, ''))}
                placeholder="0"
                placeholderTextColor={colors.muted}
                keyboardType="decimal-pad"
                autoFocus
              />
            </View>
            <Pressable onPress={saveRenewal}>
              <LinearGradient colors={gradients.brand} style={styles.feeSave} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
                <Text style={styles.feeSaveText}>Record renewal</Text>
              </LinearGradient>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  kb: { flex: 1 },
  content: { paddingHorizontal: 18, paddingTop: 14, paddingBottom: 40 },
  topRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  back: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  backText: { fontSize: 15, fontFamily: fonts.bold, color: colors.coral },
  editText: { fontSize: 15, fontFamily: fonts.extraBold, color: colors.coral },
  missing: { fontSize: 16, fontFamily: fonts.bold, color: colors.muted, textAlign: 'center', marginTop: 60 },
  hero: { borderRadius: 26, padding: 20, flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 14 },
  heroMid: { flex: 1, minWidth: 0 },
  heroName: { color: '#fff', fontSize: 21, fontFamily: fonts.extraBold, letterSpacing: -0.4 },
  ownerRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 5 },
  ownerBadge: { width: 22, height: 22, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  ownerText: { color: '#fff', fontSize: 10, fontFamily: fonts.extraBold },
  heroOwner: { color: '#fff', fontSize: 13, fontFamily: fonts.bold, opacity: 0.9 },
  heroBig: { color: '#fff', fontSize: 19, fontFamily: fonts.extraBold, textAlign: 'right', maxWidth: 110 },
  card: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    paddingHorizontal: 16,
    paddingVertical: 4,
    marginBottom: 4,
  },
  section: { marginTop: 16 },
  sectionTitle: { fontSize: 17, fontFamily: fonts.extraBold, color: colors.ink, letterSpacing: -0.3, marginBottom: 10 },
  check: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: colors.border },
  last: { borderBottomWidth: 0 },
  box: { width: 26, height: 26, borderRadius: 9, borderWidth: 2, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' },
  boxDone: { backgroundColor: colors.coral, borderColor: colors.coral },
  checkText: { flex: 1, fontSize: 14.5, fontFamily: fonts.regular, color: colors.ink, lineHeight: 20 },
  checkDone: { textDecorationLine: 'line-through', color: colors.muted },
  hist: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: colors.border },
  histDate: { fontSize: 14.5, fontFamily: fonts.bold, color: colors.ink },
  histFee: { fontSize: 14.5, fontFamily: fonts.extraBold, color: colors.coral },
  partnerWrap: { marginTop: 16 },
  partner: { borderRadius: 22, padding: 18 },
  partnerLabel: { color: '#fff', fontSize: 17, fontFamily: fonts.extraBold },
  partnerSub: { color: '#fff', fontSize: 13.5, fontFamily: fonts.regular, opacity: 0.92, marginTop: 4 },
  partnerFine: { color: '#fff', fontSize: 11, fontFamily: fonts.regular, opacity: 0.7, marginTop: 10 },
  delete: { marginTop: 26, alignItems: 'center', paddingVertical: 12 },
  deleteText: { color: colors.red, fontSize: 15, fontFamily: fonts.bold },
  feeBackdrop: { flex: 1, backgroundColor: 'rgba(43,43,58,0.45)', alignItems: 'center', justifyContent: 'center', padding: 30 },
  feeCard: { backgroundColor: colors.surface, borderRadius: 26, padding: 24, width: '100%' },
  feeTitle: { fontSize: 21, fontFamily: fonts.extraBold, color: colors.ink, textAlign: 'center' },
  feeSub: { fontSize: 14, fontFamily: fonts.regular, color: colors.muted, textAlign: 'center', marginTop: 6, marginBottom: 16 },
  feeRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4, marginBottom: 18 },
  dollar: { fontSize: 26, fontFamily: fonts.extraBold, color: colors.coral },
  feeInput: { fontSize: 34, fontFamily: fonts.extraBold, color: colors.ink, minWidth: 110, textAlign: 'center', borderBottomWidth: 2, borderBottomColor: colors.border, paddingBottom: 4 },
  feeSave: { borderRadius: radius.pill, paddingVertical: 15, alignItems: 'center' },
  feeSaveText: { color: '#fff', fontSize: 16, fontFamily: fonts.extraBold },
});
