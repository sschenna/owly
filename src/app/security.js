import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import PinPad from '../components/PinPad';
import RowItem from '../components/RowItem';
import OptionSheet from '../components/OptionSheet';
import { clearPin, hasPin, setPin, verifyPin, wrongPinJoke } from '../lib/pin';
import { colors, fonts, gradients, radius } from '../theme';

// Security & PIN: set, change, or remove the app lock PIN.
// The PIN lives in the OS keychain — never in app storage.
export default function Security() {
  const [pinned, setPinned] = useState(null);
  const [mode, setMode] = useState('menu'); // menu | enter | confirm | verify-change | verify-remove | new-after-verify
  const [temp, setTemp] = useState('');
  const [notice, setNotice] = useState('');
  const [removeAsk, setRemoveAsk] = useState(false);

  useEffect(() => {
    hasPin().then(setPinned);
  }, []);

  const backToMenu = () => {
    setMode('menu');
    setNotice('');
    setTemp('');
  };

  const onPin = async (pin) => {
    if (mode === 'enter') {
      setTemp(pin);
      setMode('confirm');
      setNotice('');
    } else if (mode === 'confirm' || mode === 'new-after-verify') {
      if (pin === temp) {
        await setPin(pin);
        setPinned(true);
        backToMenu();
      } else {
        setNotice('Those didn\u2019t match — let\u2019s try again.');
        setTemp('');
        setMode('enter');
      }
    } else if (mode === 'verify-change' || mode === 'verify-remove') {
      if (await verifyPin(pin)) {
        if (mode === 'verify-change') {
          setTemp('');
          setMode('new-after-verify');
          setNotice('');
        } else {
          setRemoveAsk(true);
        }
      } else {
        setNotice(wrongPinJoke());
      }
    }
  };

  const title =
    mode === 'menu'
      ? 'Security'
      : mode === 'enter'
        ? 'Choose a 4-digit PIN'
        : mode === 'confirm'
          ? 'Confirm your PIN'
          : mode === 'verify-change' || mode === 'verify-remove'
            ? 'Enter your current PIN'
            : 'Choose a new PIN';

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content}>
        <Pressable style={styles.back} onPress={() => (mode === 'menu' ? router.back() : backToMenu())}>
          <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke={colors.coral} strokeWidth={2.6}>
            <Path d="M15 6l-6 6 6 6" />
          </Svg>
          <Text style={styles.backText}>{mode === 'menu' ? 'Profile' : 'Back'}</Text>
        </Pressable>

        <Text style={styles.title}>{title}</Text>
        <Text style={styles.sub}>
          {mode === 'menu'
            ? 'Lock Owly behind a PIN. It\u2019s stored in your phone\u2019s keychain — we never see it.'
            : mode === 'confirm'
              ? 'One more time, to be sure.'
              : mode === 'verify-change' || mode === 'verify-remove'
                ? 'Prove it\u2019s you first.'
                : 'Pick something you\u2019ll remember at 2am.'}
        </Text>

        {mode === 'menu' ? (
          <View style={styles.card}>
            {!pinned ? (
              <RowItem label="Set app PIN" value="Off" onPress={() => setMode('enter')} last />
            ) : (
              <>
                <RowItem label="Change PIN" value="••••" onPress={() => setMode('verify-change')} />
                <RowItem label="Remove PIN" value="" valueColor={colors.red} onPress={() => setMode('verify-remove')} last />
              </>
            )}
          </View>
        ) : (
          <View style={styles.padWrap}>
            {notice ? <Text style={styles.notice}>{notice}</Text> : null}
            <PinPad onDone={onPin} />
          </View>
        )}

        {mode === 'menu' && (
          <Pressable
            style={styles.storage}
            onPress={() => router.push('/profile')}
          >
            <Text style={styles.storageTitle}>Your data stays on this phone</Text>
            <Text style={styles.storageSub}>
              Documents, nudges and comments live in on-device storage. No account, no cloud, no leaks.
            </Text>
          </Pressable>
        )}
      </ScrollView>

      <OptionSheet
        visible={removeAsk}
        title="Remove the PIN?"
        options={[{ id: 'yes', label: 'Remove it', sub: 'Owly will open without a PIN', destructive: true }]}
        onClose={() => {
          setRemoveAsk(false);
          backToMenu();
        }}
        onSelect={async () => {
          await clearPin();
          setPinned(false);
          setRemoveAsk(false);
          backToMenu();
        }}
      />
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
  card: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    paddingHorizontal: 16,
    paddingVertical: 4,
  },
  padWrap: { alignItems: 'center', paddingTop: 10 },
  notice: { fontSize: 14, fontFamily: fonts.bold, color: colors.red, marginBottom: 16, textAlign: 'center' },
  storage: {
    marginTop: 18,
    backgroundColor: 'rgba(179,136,255,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(179,136,255,0.3)',
    borderRadius: radius.lg,
    padding: 16,
  },
  storageTitle: { fontSize: 15, fontFamily: fonts.extraBold, color: colors.ink, marginBottom: 4 },
  storageSub: { fontSize: 13.5, fontFamily: fonts.regular, color: colors.muted, lineHeight: 20 },
});
