import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ActivityIndicator, Text, View } from 'react-native';
import { useEffect, useState } from 'react';
import {
  useFonts,
  PlusJakartaSans_400Regular,
  PlusJakartaSans_700Bold,
  PlusJakartaSans_800ExtraBold,
} from '@expo-google-fonts/plus-jakarta-sans';
import { colors, fonts } from '../theme';
import { hydrate } from '../store';
import { hasPin, verifyPin, wrongPinJoke } from '../lib/pin';
import PinPad from '../components/PinPad';
import Owly from '../components/Owly';

function LockScreen({ onUnlock }) {
  const [notice, setNotice] = useState('');
  const tryPin = async (pin) => {
    if (await verifyPin(pin)) {
      onUnlock();
    } else {
      setNotice(wrongPinJoke());
    }
  };
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
