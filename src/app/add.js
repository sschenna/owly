import { useState } from 'react';
import { StyleSheet, Text, TextInput, View,  } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useCallback } from 'react';
import DocIcon from '../components/DocIcon';
import RowItem from '../components/RowItem';
import CalendarSheet from '../components/CalendarSheet';
import NudgeList from '../components/NudgeList';
import OptionSheet from '../components/OptionSheet';
import { CATS, normalizeDoc } from '../data/seed';
import { USER_NAME, consumeScannedExpiry, getDocs, getPeople, updateDocs } from '../store';
import { colors, fonts, gradients, radius } from '../theme';
import { fmtD, todayIso } from '../lib/dates';
import Tap from '../components/Tap';
import KbAvoid from '../components/KbAvoid';

const TYPES = Object.keys(CATS);
const uid = () => `d-${Date.now()}-${Math.floor(Math.random() * 1e6)}`;

// Add flow — 3 steps: type, details, nudges.
// ?edit=<id> reuses it as the doc editor (steps 1-2 only;
// nudge editing lives on the dedicated Nudges screen).
export default function Add() {
  const { edit } = useLocalSearchParams();
  const editing = edit ? getDocs().find((d) => d.id === edit) : null;
  const people = getPeople();

  const [step, setStep] = useState(editing ? 2 : 1);
  const [type, setType] = useState(editing ? editing.type : null);
  const [name, setName] = useState(editing ? editing.name : '');
  const [owner, setOwner] = useState(editing ? editing.owner : 'me');
  const [expiry, setExpiry] = useState(editing ? editing.expiry : null);
  const [draft, setDraft] = useState(editing ? editing.reminders : []);
  const [calOpen, setCalOpen] = useState(false);
  const [expiryHow, setExpiryHow] = useState(false);
  const [ownerOpen, setOwnerOpen] = useState(false);
  const [notice, setNotice] = useState('');

  // Pick up a date scanned from the Scan screen.
  useFocusEffect(
    useCallback(() => {
      const iso = consumeScannedExpiry();
      if (iso) {
        setExpiry(iso);
        setNotice('');
      }
    }, []),
  );

  const steps = editing ? 2 : 3;
  const ownerName =
    owner === 'me' ? USER_NAME : (people.find((p) => p.id === owner) || {}).name || '?';

  const pickType = (t) => {
    setType(t);
    if (!editing && !name) setName(CATS[t].nick);
    // Smart start: seed the draft with this type's recommended nudges.
    if (!editing) {
      setDraft(CATS[t].defaults.map((d) => ({ d, t: '09:00', snooze: null })));
    }
    setStep(2);
  };

  const canNext2 = () => {
    if (!name.trim()) {
      setNotice('Give your document a name first.');
      return false;
    }
    if (!expiry) {
      setNotice('Pick the expiry date — that\u2019s the whole point.');
      return false;
    }
    setNotice('');
    return true;
  };

  const save = () => {
    if (editing) {
      updateDocs((ds) =>
        ds.map((d) => (d.id === editing.id ? { ...d, type, name: name.trim(), owner, expiry } : d)),
      );
      router.back();
      return;
    }
    const doc = normalizeDoc({
      id: uid(),
      type,
      name: name.trim(),
      owner,
      expiry,
      reminders: draft,
    });
    updateDocs((ds) => [doc, ...ds]);
    router.replace(`/doc/${doc.id}`);
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <KbAvoid>
      <KeyboardAwareScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        enableOnAndroid
        extraScrollHeight={20}
      >
        <View style={styles.header}>
          <Tap
            style={styles.back}
            onPress={() => (step > 1 ? setStep(step - 1) : router.back())}
          >
            <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke={colors.coral} strokeWidth={2.6}>
              <Path d="M15 6l-6 6 6 6" />
            </Svg>
            <Text style={styles.backText}>Back</Text>
          </Tap>
          <View style={styles.dots}>
            {Array.from({ length: steps }, (_, i) => (
              <View key={i} style={[styles.dot, i + 1 <= step && styles.dotOn]} />
            ))}
          </View>
          <View style={styles.back} />
        </View>

        <Text style={styles.title}>{editing ? 'Edit document' : step === 1 ? 'What are we tracking?' : step === 2 ? 'The details' : 'Set your nudges'}</Text>
        <Text style={styles.sub}>
          {step === 1
            ? 'Pick the document type — I\u2019ll tailor everything around it.'
            : step === 2
              ? 'Name it, say whose it is, and when it says goodbye.'
              : 'I\u2019ve pre-loaded the smart defaults. Tweak, add, or delete — your call.'}
        </Text>

        {step === 1 && (
          <View style={styles.grid}>
            {TYPES.map((t) => (
              <Tap
                key={t}
                style={[styles.typeCard, type === t && styles.typeCardOn]}
                onPress={() => pickType(t)}
              >
                <DocIcon type={t} size={52} />
                <Text style={styles.typeLabel}>{CATS[t].label}</Text>
              </Tap>
            ))}
          </View>
        )}

        {step === 2 && (
          <View>
            <Text style={styles.fieldLabel}>Name</Text>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder={type ? CATS[type].nick : 'My document'}
              placeholderTextColor={colors.muted}
              maxLength={60}
            />
            <View style={styles.card}>
              <RowItem label="Whose is it?" value={ownerName} onPress={() => setOwnerOpen(true)} />
              <RowItem
                label="Expiry date"
                value={expiry ? fmtD(expiry) : 'Pick a date'}
                valueColor={expiry ? colors.ink : colors.coral}
                onPress={() => setExpiryHow(true)}
                last
              />
            </View>
            {notice ? <Text style={styles.notice}>{notice}</Text> : null}
            <Tap
              onPress={() => {
                if (!canNext2()) return;
                if (editing) save();
                else setStep(3);
              }}
              style={styles.nextWrap}
            >
              <LinearGradient colors={gradients.brand} style={styles.next} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
                <Text style={styles.nextText}>{editing ? 'Save changes' : 'Continue'}</Text>
              </LinearGradient>
            </Tap>
          </View>
        )}

        {step === 3 && !editing && (
          <View>
            <NudgeList reminders={draft} onChange={setDraft} expiry={expiry} />
            <Tap onPress={save} style={styles.nextWrap}>
              <LinearGradient colors={gradients.brand} style={styles.next} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
                <Text style={styles.nextText}>Track it!</Text>
              </LinearGradient>
            </Tap>
          </View>
        )}
      </KeyboardAwareScrollView>

      <OptionSheet
        visible={expiryHow}
        title="How should we get the date?"
        options={[
          { id: 'pick', label: 'Pick a date', sub: 'Choose it on the calendar' },
          { id: 'scan', label: 'Scan document', sub: 'Snap a photo — Owly reads the expiry' },
        ]}
        onClose={() => setExpiryHow(false)}
        onSelect={(o) => {
          setExpiryHow(false);
          if (o.id === 'pick') setCalOpen(true);
          else router.push('/scan');
        }}
      />
      <CalendarSheet
        visible={calOpen}
        initial={expiry || todayIso()}
        minToday
        onClose={() => setCalOpen(false)}
        onPick={setExpiry}
      />
      <OptionSheet
        visible={ownerOpen}
        title="Whose document is this?"
        options={[
          { id: 'me', label: `${USER_NAME} (me)` },
          ...people.map((p) => ({ id: p.id, label: p.name })),
        ]}
        selectedId={owner}
        onClose={() => setOwnerOpen(false)}
        onSave={(o) => setOwner(o.id)}
      />
      </KbAvoid>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  content: { paddingHorizontal: 18, paddingTop: 14, paddingBottom: 40 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 },
  back: { flexDirection: 'row', alignItems: 'center', gap: 2, minWidth: 70 },
  backText: { fontSize: 15, fontFamily: fonts.bold, color: colors.coral },
  dots: { flexDirection: 'row', gap: 7 },
  dot: { width: 9, height: 9, borderRadius: 5, backgroundColor: colors.border },
  dotOn: { backgroundColor: colors.coral },
  title: { fontSize: 27, fontFamily: fonts.extraBold, color: colors.ink, letterSpacing: -0.6 },
  sub: { fontSize: 14, fontFamily: fonts.regular, color: colors.muted, marginTop: 4, marginBottom: 18, lineHeight: 21 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  typeCard: {
    width: '47%',
    flexGrow: 1,
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radius.lg,
    paddingVertical: 20,
    alignItems: 'center',
    gap: 10,
  },
  typeCardOn: { borderColor: colors.coral, backgroundColor: 'rgba(242,102,139,0.07)' },
  typeLabel: { fontSize: 14.5, fontFamily: fonts.extraBold, color: colors.ink },
  fieldLabel: { fontSize: 12, fontFamily: fonts.extraBold, color: colors.muted, letterSpacing: 0.4, marginBottom: 8 },
  input: {
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radius.lg,
    paddingHorizontal: 16,
    paddingVertical: 15,
    fontSize: 16,
    fontFamily: fonts.bold,
    color: colors.ink,
    marginBottom: 14,
  },
  card: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    paddingHorizontal: 16,
    paddingVertical: 4,
  },
  notice: { fontSize: 13.5, fontFamily: fonts.bold, color: colors.red, marginTop: 12, textAlign: 'center' },
  nextWrap: { marginTop: 20 },
  next: { borderRadius: radius.pill, paddingVertical: 17, alignItems: 'center' },
  nextText: { color: '#fff', fontSize: 17, fontFamily: fonts.extraBold },
});
