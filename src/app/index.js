import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import Owly from '../components/Owly';
import { colors, fonts, radius } from '../theme';

// Welcome screen — the first thing anyone sees.
// Get Started drops you into the Home tab.
export default function Welcome() {
  const [name, setName] = useState('');

  const start = () => {
    router.replace('/home');
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          {/* soft decorative blobs */}
          <View style={[styles.blob, styles.blobA]} />
          <View style={[styles.blob, styles.blobB]} />

          <Owly size={190} mood="chill" />

          <Text style={styles.title}>
            We take care of your <Text style={styles.accent}>expiry dates.</Text>
          </Text>
          <Text style={styles.sub}>
            Owly watches your passports, licenses &amp; visas — and nudges you{' '}
            <Text style={styles.subBold}>before they expire</Text>. No spreadsheets, no panic.
          </Text>

          <Text style={styles.label}>What should I call you?</Text>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder="Your name"
            placeholderTextColor={colors.muted}
            autoCapitalize="words"
            returnKeyType="done"
            onSubmitEditing={start}
          />
          <Pressable
            style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}
            onPress={start}
          >
            <Text style={styles.buttonText}>Get Started</Text>
          </Pressable>

          <Text style={styles.foot}>Owly v0.1 · milestone 2</Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  flex: { flex: 1 },
  scroll: {
    flexGrow: 1,
    alignItems: 'center',
    paddingHorizontal: 28,
    paddingTop: 12,
    paddingBottom: 32,
  },
  blob: { position: 'absolute', borderRadius: radius.pill, opacity: 0.16 },
  blobA: { width: 260, height: 260, backgroundColor: colors.coral, top: -70, right: -70 },
  blobB: { width: 200, height: 200, backgroundColor: colors.purple, bottom: 40, left: -80 },
  title: {
    fontFamily: fonts.extraBold,
    fontSize: 32,
    color: colors.ink,
    textAlign: 'center',
    letterSpacing: -0.7,
    lineHeight: 38,
    marginTop: 4,
  },
  accent: { color: colors.coral },
  sub: {
    fontFamily: fonts.regular,
    fontSize: 15,
    color: colors.muted,
    textAlign: 'center',
    lineHeight: 23,
    marginTop: 10,
    maxWidth: 300,
  },
  subBold: { fontFamily: fonts.bold, color: colors.coral },
  label: {
    fontFamily: fonts.extraBold,
    fontSize: 13,
    color: colors.coral,
    letterSpacing: 0.4,
    alignSelf: 'flex-start',
    marginTop: 26,
    marginBottom: 8,
  },
  input: {
    width: '100%',
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    paddingHorizontal: 18,
    paddingVertical: 15,
    fontSize: 16,
    fontFamily: fonts.regular,
    color: colors.ink,
    shadowColor: '#be5a78',
    shadowOpacity: 0.08,
    shadowRadius: 14,
    elevation: 2,
  },
  button: {
    width: '100%',
    marginTop: 18,
    borderRadius: radius.pill,
    backgroundColor: colors.coral,
    paddingVertical: 17,
    alignItems: 'center',
    shadowColor: colors.coral,
    shadowOpacity: 0.38,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 10 },
    elevation: 6,
  },
  buttonPressed: { transform: [{ scale: 0.97 }], opacity: 0.92 },
  buttonText: { fontFamily: fonts.extraBold, fontSize: 17, color: '#fff', letterSpacing: -0.2 },
  foot: { fontFamily: fonts.regular, fontSize: 12, color: colors.muted, marginTop: 26 },
});
