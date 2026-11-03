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
import Owly from '../components/Owly';
import { colors, fonts, radius } from '../theme';

// Welcome screen — the first thing anyone sees.
// Milestone 1: greeting + mascot. Home screen lands in Milestone 2.
export default function Welcome() {
  const [name, setName] = useState('');
  const [started, setStarted] = useState(false);

  const displayName = name.trim();

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

          <Owly size={190} mood={started ? 'happy' : 'chill'} />

          <Text style={styles.title}>
            We take care of your <Text style={styles.accent}>expiry dates.</Text>
          </Text>
          <Text style={styles.sub}>
            Owly watches your passports, licenses &amp; visas — and nudges you{' '}
            <Text style={styles.subBold}>before they expire</Text>. No spreadsheets, no panic.
          </Text>

          {!started ? (
            <>
              <Text style={styles.label}>What should I call you?</Text>
              <TextInput
                style={styles.input}
                value={name}
                onChangeText={setName}
                placeholder="Your name"
                placeholderTextColor={colors.muted}
                autoCapitalize="words"
                returnKeyType="done"
                onSubmitEditing={() => setStarted(true)}
              />
              <Pressable
                style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}
                onPress={() => setStarted(true)}
              >
                <Text style={styles.buttonText}>Get Started</Text>
              </Pressable>
            </>
          ) : (
            <View style={styles.helloCard}>
              <Text style={styles.helloTitle}>
                Welcome aboard{displayName ? `, ${displayName}` : ''}!
              </Text>
              <Text style={styles.helloSub}>
                This is Milestone 1 — the foundation. The Home screen, with your documents and
                Owly on duty, lands in Milestone 2.
              </Text>
            </View>
          )}

          <Text style={styles.foot}>Owly v0.1 · milestone 1</Text>
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
  helloCard: {
    width: '100%',
    marginTop: 26,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: 20,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: '#be5a78',
    shadowOpacity: 0.07,
    shadowRadius: 16,
    elevation: 2,
  },
  helloTitle: {
    fontFamily: fonts.extraBold,
    fontSize: 20,
    color: colors.ink,
    letterSpacing: -0.3,
  },
  helloSub: {
    fontFamily: fonts.regular,
    fontSize: 14,
    color: colors.muted,
    lineHeight: 21,
    marginTop: 6,
  },
  foot: { fontFamily: fonts.regular, fontSize: 12, color: colors.muted, marginTop: 26 },
});
