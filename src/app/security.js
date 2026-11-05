import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import * as LocalAuth from 'expo-local-authentication';
import AsyncStorage from '@react-native-async-storage/async-storage';
import PinPad from '../components/PinPad';
import RowItem from '../components/RowItem';
import OptionSheet from '../components/OptionSheet';
import { clearPin, hasPin, setPin, verifyPin, wrongPinJoke } from '../lib/pin';
import { colors, fonts, gradients, radius } from '../theme';
import Tap from '../components/Tap';

const BIO_KEY = 'owly-biometric-v1';

// Security & PIN: set, change, or remove the app lock PIN.
// The PIN lives in the OS keychain — never in app storage.
export default function Security() {
  const [pinned, setPinned] = useState(null);
  const [mode, setMode] = useState('menu'); // menu | enter | confirm | verify-change | verify-remove | new-after-verify
  const [temp, setTemp] = useState('');
  const [notice, setNotice] = useState('');
  const [removeAsk, setRemoveAsk] = useState(false);
  const [bioOn, setBioOn] = useState(false);
  const [bioAvail, setBioAvail] = useState(false);
  const [bioType, setBioType] = useState('');

  useEffect(() => {
    hasPin().then(setPinned);
    AsyncStorage.getItem(BIO_KEY).then((v) => setBioOn(v === '1'));
    (async () => {
      try {
        const ok = await LocalAuth.hasHardwareAsync();
        const enrolled = await LocalAuth.isEnrolledAsync();
        if (ok && enrolled) {
          setBioAvail(true);
          const types = await LocalAuth.supportedAuthenticationTypesAsync();
          // 1 = fingerprint, 2 = facial
          setBioType(types.includes(2) ? 'Face ID' : types.includes(1) ? 'Fingerprint' : 'Biometric');
        }
      } catch (e) {}
    })();
  }, []);

  const toggleBio = async () => {
    if (!bioOn) {
      // Turning on — verify it's really the owner first.
      try {
        const res = await LocalAuth.authenticateAsync({
          promptMessage: 'Unlock Owly with ' + (bioType || 'biometrics'),
          fallbackLabel: 'Use PIN instead',
        });
        if (res.success) {
          await AsyncStorage.setItem(BIO_KEY, '1');
          setBioOn(true);
        }
      } catch (e) {}
    } else {
      await AsyncStorage.removeItem(BIO_KEY);
      setBioOn(false);
    }
  };

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
    } else if (mode === 'new-after-verify') {
      // First entry of the NEW pin — save it, ask for confirmation next.
      setTemp(pin);
      setMode('confirm-new');
      setNotice('');
    } else if (mode === 'confirm' || mode === 'confirm-new') {
      if (pin === temp) {
        try {
          await setPin(pin);
          setPinned(true);
          backToMenu();
        } catch (e) {
          setNotice('Couldn\u2019t save the PIN — try again.');
          setTemp('');
          setMode('enter');
        }
      } else {
        setNotice('Those didn\u2019t match — let\u2019s try again.');
        setTemp('');
        setMode(mode === 'confirm-new' ? 'new-after-verify' : 'enter');
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
        : mode === 'confirm' || mode === 'confirm-new'
          ? 'Confirm your PIN'
          : mode === 'verify-change' || mode === 'verify-remove'
            ? 'Enter your current PIN'
            : 'Choose a new PIN';

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content}>
        <Tap style={styles.back} onPress={() => (mode === 'menu' ? router.back() : backToMenu())}>
          <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke={colors.coral} strokeWidth={2.6}>
            <Path d="M15 6l-6 6 6 6" />
          </Svg>
          <Text style={styles.backText}>{mode === 'menu' ? 'Profile' : 'Back'}</Text>
        </Tap>

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
            <View style={styles.toggleRow}>
              <View style={styles.toggleText}>
                <Text style={styles.toggleLabel}>App PIN</Text>
                <Text style={styles.toggleSub}>
                  {pinned ? 'Owly locks when you leave' : 'Turn on to lock Owly'}
                </Text>
              </View>
              <Switch
                value={!!pinned}
                onValueChange={(v) => {
                  if (v) setMode('enter');
                  else setMode('verify-remove');
                }}
                trackColor={{ false: '#e8dfe3', true: colors.coral }}
                thumbColor="#fff"
              />
            </View>
            {pinned ? (
              <>
                <RowItem label="Change PIN" value="••••" onPress={() => setMode('verify-change')} icon="lock" />
                {bioAvail && (
                  <RowItem
                    label={`${bioType || 'Biometric'} unlock`}
                    value={bioOn ? 'On' : 'Off'}
                    onPress={toggleBio}
                    icon="lock"
                  />
                )}
              </>
            ) : (
              bioAvail && (
                <RowItem
                  label={`${bioType || 'Biometric'} unlock`}
                  value={bioOn ? 'On' : 'Off'}
                  onPress={toggleBio}
                  icon="lock"
                />
              )
            )}
          </View>
        ) : (
          <View style={styles.padWrap}>
            {notice ? <Text style={styles.notice}>{notice}</Text> : null}
            <PinPad onDone={onPin} />
          </View>
        )}

        {mode === 'menu' && (
          <Tap
            style={styles.storage}
            onPress={() => router.push('/profile')}
          >
            <Text style={styles.storageTitle}>Your data stays on this phone</Text>
            <Text style={styles.storageSub}>
              Documents, nudges and comments live in on-device storage. No account, no cloud, no leaks.
            </Text>
          </Tap>
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
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  toggleText: { flex: 1 },
  toggleLabel: { fontSize: 16, fontFamily: fonts.extraBold, color: colors.ink },
  toggleSub: { fontSize: 13, fontFamily: fonts.regular, color: colors.muted, marginTop: 2 },
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
