import { Stack, router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import { useEffect, useState } from 'react';
import {
  useFonts,
  PlusJakartaSans_400Regular,
  PlusJakartaSans_700Bold,
  PlusJakartaSans_800ExtraBold,
} from '@expo-google-fonts/plus-jakarta-sans';
import * as LocalAuth from 'expo-local-authentication';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { colors, fonts } from '../theme';
import { hydrate } from '../store';
import { hasPin, verifyPin, wrongPinJoke } from '../lib/pin';
import { initNotifications } from '../lib/notify';
import PinPad from '../components/PinPad';
import Owly from '../components/Owly';

const BIO_KEY = 'owly-biometric-v1';

function LockScreen({ onUnlock }) {
  const [notice, setNotice] = useState('');
  const [bioAvail, setBioAvail] = useState(false);
  const [showPin, setShowPin] = useState(false);

  const tryPin = async (pin) => {
    if (await verifyPin(pin)) {
      onUnlock();
    } else {
      setNotice(wrongPinJoke());
    }
  };

  const tryBio = async () => {
    try {
      const res = await LocalAuth.authenticateAsync({
        promptMessage: 'Unlock Owly',
        fallbackLabel: 'Use PIN instead',
        disableDeviceFallback: true,
      });
      if (res.success) {
        onUnlock();
      } else if (res.error === 'user_fallback') {
        setShowPin(true);
      }
    } catch (e) {
      setShowPin(true);
    }
  };

  useEffect(() => {
    (async () => {
      try {
        const bioOn = (await AsyncStorage.getItem(BIO_KEY)) === '1';
        const ok = await LocalAuth.hasHardwareAsync();
        const enrolled = await LocalAuth.isEnrolledAsync();
        if (bioOn && ok && enrolled) {
          setBioAvail(true);
          // Try biometric immediately on lock screen.
          const res = await LocalAuth.authenticateAsync({
            promptMessage: 'Unlock Owly',
            fallbackLabel: 'Use PIN instead',
            disableDeviceFallback: true,
          });
          if (res.success) {
            onUnlock();
          } else {
            setShowPin(true);
          }
        } else {
          setShowPin(true);
        }
      } catch (e) {
        setShowPin(true);
      }
    })();
  }, []);

  // While biometric prompt is up, show a calm waiting state.
  if (bioAvail && !showPin) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        <Owly size={110} mood="sleepy" hideCaption />
        <Text style={{ fontSize: 24, fontFamily: fonts.extraBold, color: colors.ink, marginTop: 18 }}>
          Owly is napping
        </Text>
        <Text style={{ fontSize: 14, fontFamily: fonts.regular, color: colors.muted, marginTop: 6, textAlign: 'center' }}>
          Confirm it&apos;s you to wake it up.
        </Text>
        <Pressable onPress={() => setShowPin(true)} style={{ marginTop: 18, padding: 12 }}>
          <Text style={{ fontSize: 15, fontFamily: fonts.bold, color: colors.coral }}>Use PIN instead</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <Owly size={110} mood="sleepy" hideCaption />
      <Text style={{ fontSize: 24, fontFamily: fonts.extraBold, color: colors.ink, marginTop: 18 }}>
        Owly is napping
      </Text>
      <Text style={{ fontSize: 14, fontFamily: fonts.regular, color: colors.muted, marginTop: 6, marginBottom: 8, textAlign: 'center' }}>
        Enter your PIN to wake it up.
      </Text>
      {notice ? (
        <Text style={{ fontSize: 14, fontFamily: fonts.bold, color: colors.red, marginBottom: 12 }}>{notice}</Text>
      ) : null}
      <PinPad onDone={tryPin} />
      {bioAvail ? (
        <Pressable onPress={tryBio} style={{ marginTop: 16, padding: 12 }}>
          <Text style={{ fontSize: 15, fontFamily: fonts.bold, color: colors.coral }}>Use biometrics</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

// Root layout: loads the brand font, hydrates saved data,
// then hands off to Expo Router. If an app PIN is set,
// the lock screen gates everything until it's entered.
export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    PlusJakartaSans_400Regular,
    PlusJakartaSans_700Bold,
    PlusJakartaSans_800ExtraBold,
  });
  const [lockState, setLockState] = useState('checking'); // checking | locked | open

  useEffect(() => {
    hydrate();
    hasPin().then((h) => setLockState(h ? 'locked' : 'open'));
    // Start the local-notification scheduler; tapping a notification opens the doc.
    const cleanup = initNotifications((docId) => router.push(`/doc/${docId}`));
    return cleanup;
  }, []);

  if (!fontsLoaded || lockState === 'checking') {
    return (
      <View
        style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bg }}
      >
        <ActivityIndicator size="large" color={colors.coral} />
      </View>
    );
  }

  if (lockState === 'locked') {
    return (
      <>
        <StatusBar style="dark" />
        <LockScreen onUnlock={() => setLockState('open')} />
      </>
    );
  }

  return (
    <>
      <StatusBar style="dark" />
      <Stack screenOptions={{ headerShown: false, animation: 'slide_from_right' }} />
    </>
  );
}
