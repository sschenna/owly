import { useRef, useState } from 'react';
import { ActivityIndicator, Image, Linking, Platform, StyleSheet, Text, TextInput, View,  } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';
import { LinearGradient } from 'expo-linear-gradient';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { router } from 'expo-router';
import { ocrImage } from '../lib/ocr';
import { isLocalOcrAvailable, ocrImageLocal } from '../lib/ocrLocal';
import { fmtD } from '../lib/dates';
import { getSettings, setScannedExpiry, updateSettings } from '../store';
import { colors, fonts, gradients, radius } from '../theme';
import Tap from '../components/Tap';
import KbAvoid from '../components/KbAvoid';

// Scan a document: snap a photo, extract the expiry date with OCR,
// pick the right one. The photo is sent to OCR.space ONLY when you
// tap "Extract" — never automatically.
export default function Scan() {
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef(null);
  const [photo, setPhoto] = useState(null); // { uri, base64 }
  const [busy, setBusy] = useState(false);
  const [candidates, setCandidates] = useState(null);
  const [error, setError] = useState('');
  const [keyInput, setKeyInput] = useState('');
  const [showKey, setShowKey] = useState(false);

  // Built-in demo key so scanning works out of the box. It's OCR.space's
  // public test key (rate-limited, shared) — a user-pasted key overrides it.
  const apiKey = getSettings().ocrKey || 'helloworld';

  if (!permission) {
    return (
      <SafeAreaView style={styles.safe}>
        <ActivityIndicator size="large" color={colors.coral} style={styles.center} />
      </SafeAreaView>
    );
  }

  if (!permission.granted) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.centerWrap}>
          <Text style={styles.title}>Camera access</Text>
          <Text style={styles.sub}>
            Owly needs the camera to scan your document. The photo never leaves your phone except for the
            OCR lookup — and only when you tap Extract.
          </Text>
          <Tap onPress={requestPermission}>
            <LinearGradient colors={gradients.brand} style={styles.btn} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
              <Text style={styles.btnText}>Allow camera</Text>
            </LinearGradient>
          </Tap>
          <Tap style={styles.later} onPress={() => router.back()}>
            <Text style={styles.laterText}>Maybe later</Text>
          </Tap>
        </View>
      </SafeAreaView>
    );
  }

  const snap = async () => {
    try {
      const p = await cameraRef.current.takePictureAsync({ base64: true, quality: 0.7 });
      setPhoto(p);
      setCandidates(null);
      setError('');
    } catch (e) {
      setError('The camera hiccupped — try again.');
    }
  };

  const extract = async () => {
    // Prefer on-device OCR (private, free, offline). Fall back to OCR.space
    // when it's unavailable (Expo Go / web) — that path needs the API key.
    const useLocal = isLocalOcrAvailable();
    if (!useLocal && !apiKey) {
      setShowKey(true);
      return;
    }
    setBusy(true);
    setError('');
    try {
      const { candidates } = useLocal
        ? await ocrImageLocal(photo.uri)
        : await ocrImage(photo.base64, apiKey);
      setCandidates(candidates);
    } catch (e) {
      setError(e.message);
    }
    setBusy(false);
  };

  const saveKey = () => {
    const k = keyInput.trim();
    if (!k) return;
    updateSettings({ ocrKey: k });
    setShowKey(false);
    setKeyInput('');
  };

  const pick = (iso) => {
    setScannedExpiry(iso);
    router.back();
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <KbAvoid offset={0}>
      <View style={styles.header}>
        <Tap style={styles.back} onPress={() => router.back()}>
          <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke={colors.coral} strokeWidth={2.6}>
            <Path d="M15 6l-6 6 6 6" />
          </Svg>
          <Text style={styles.backText}>Back</Text>
        </Tap>
        <Text style={styles.headerTitle}>Scan document</Text>
        <View style={styles.back} />
      </View>

      {!photo ? (
        <View style={styles.camWrap}>
          <CameraView ref={cameraRef} style={styles.cam} facing="back" />
          <View style={styles.frame} pointerEvents="none">
            <View style={styles.frameBox} />
            <Text style={styles.frameHint}>Line up the expiry date</Text>
          </View>
          <Tap style={styles.shutterWrap} onPress={snap}>
            <View style={styles.shutter} />
          </Tap>
        </View>
      ) : (
        <KeyboardAwareScrollView
          contentContainerStyle={styles.previewWrap}
          keyboardShouldPersistTaps="handled"
          enableOnAndroid
          extraScrollHeight={20}
        >
          <Image source={{ uri: photo.uri }} style={styles.preview} resizeMode="cover" />
          {error ? <Text style={styles.error}>{error}</Text> : null}

          {candidates === null ? (
            <View style={styles.actions}>
              <Tap onPress={extract} disabled={busy} style={styles.actionBtn}>
                <LinearGradient
                  colors={busy ? ['#e8dfe3', '#e8dfe3'] : gradients.brand}
                  style={styles.btn}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  {busy ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={styles.btnText}>Extract expiry date</Text>
                  )}
                </LinearGradient>
              </Tap>
              <Tap style={styles.later} onPress={() => setPhoto(null)}>
                <Text style={styles.laterText}>Retake</Text>
              </Tap>
              <Text style={styles.fine}>
                {isLocalOcrAvailable()
                  ? 'On-device scan — this photo never leaves your phone.'
                  : 'Tapping Extract sends this photo to OCR.space for text recognition — nothing else ever leaves your phone.'}
              </Text>
              {!isLocalOcrAvailable() && !getSettings().ocrKey && (
                <Tap onPress={() => setShowKey(true)}>
                  <Text style={styles.ownKey}>Using the shared demo key — tap here to use your own free key instead</Text>
                </Tap>
              )}
            </View>
          ) : candidates.length === 0 ? (
            <View style={styles.actions}>
              <Text style={styles.noneTitle}>No dates found</Text>
              <Text style={styles.noneSub}>
                The scan couldn\u2019t spot an expiry date. Try a clearer photo — or just pick the date yourself.
              </Text>
              <Tap style={styles.later} onPress={() => setPhoto(null)}>
                <Text style={styles.laterText}>Retake photo</Text>
              </Tap>
            </View>
          ) : (
            <View style={styles.actions}>
              <Text style={styles.pickTitle}>Which one\u2019s the expiry?</Text>
              {candidates.map((c) => (
                <Tap key={c.iso} style={styles.cand} onPress={() => pick(c.iso)}>
                  <Text style={styles.candDate}>{fmtD(c.iso)}</Text>
                  <Text style={styles.candRaw}>read as \u201c{c.raw}\u201d</Text>
                </Tap>
              ))}
              <Tap style={styles.later} onPress={() => setPhoto(null)}>
                <Text style={styles.laterText}>None of these — retake</Text>
              </Tap>
            </View>
          )}

          {showKey && (
            <View style={styles.keyCard}>
              <Text style={styles.keyTitle}>Free OCR key needed</Text>
              <Text style={styles.keySub}>
                Grab a free key at{' '}
                <Text style={styles.keyLink} onPress={() => Linking.openURL('https://ocr.space/ocrapi')}>
                  ocr.space/ocrapi
                </Text>{' '}
                (25,000 scans/month free) and paste it here. It\u2019s stored only on this phone.
              </Text>
              <TextInput
                style={styles.keyInput}
                value={keyInput}
                onChangeText={setKeyInput}
                placeholder="Paste your OCR.space key"
                placeholderTextColor={colors.muted}
                autoCapitalize="none"
              />
              <Tap onPress={saveKey} disabled={!keyInput.trim()}>
                <LinearGradient
                  colors={keyInput.trim() ? gradients.brand : ['#e8dfe3', '#e8dfe3']}
                  style={styles.btn}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <Text style={styles.btnText}>Save key</Text>
                </LinearGradient>
              </Tap>
            </View>
          )}
        </KeyboardAwareScrollView>
      )}
      </KbAvoid>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  center: { flex: 1 },
  centerWrap: { flex: 1, padding: 28, alignItems: 'center', justifyContent: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 18, paddingTop: 14, paddingBottom: 10 },
  back: { flexDirection: 'row', alignItems: 'center', gap: 2, minWidth: 70 },
  backText: { fontSize: 15, fontFamily: fonts.bold, color: colors.coral },
  headerTitle: { fontSize: 17, fontFamily: fonts.extraBold, color: colors.ink },
  title: { fontSize: 24, fontFamily: fonts.extraBold, color: colors.ink, textAlign: 'center', marginBottom: 10 },
  sub: { fontSize: 14.5, fontFamily: fonts.regular, color: colors.muted, textAlign: 'center', lineHeight: 22, marginBottom: 22 },
  camWrap: { flex: 1, margin: 18, marginTop: 4, borderRadius: 26, overflow: 'hidden', backgroundColor: '#000' },
  cam: { flex: 1 },
  frame: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center' },
  frameBox: { width: '80%', height: 120, borderWidth: 2.5, borderColor: '#fff', borderRadius: 16, opacity: 0.9 },
  frameHint: { color: '#fff', fontFamily: fonts.bold, fontSize: 14, marginTop: 12, opacity: 0.95 },
  shutterWrap: { position: 'absolute', bottom: 26, alignSelf: 'center', padding: 10 },
  shutter: { width: 72, height: 72, borderRadius: 36, backgroundColor: '#fff', borderWidth: 5, borderColor: 'rgba(255,255,255,0.5)' },
  previewWrap: { padding: 18, paddingBottom: 40 },
  preview: { width: '100%', aspectRatio: 3 / 4, borderRadius: 22, backgroundColor: colors.border },
  actions: { marginTop: 16, alignItems: 'center' },
  actionBtn: { width: '100%' },
  btn: { borderRadius: radius.pill, paddingVertical: 16, alignItems: 'center', width: '100%' },
  btnText: { color: '#fff', fontSize: 16, fontFamily: fonts.extraBold },
  later: { marginTop: 14, padding: 8 },
  laterText: { fontSize: 15, fontFamily: fonts.bold, color: colors.coral },
  fine: { fontSize: 12, fontFamily: fonts.regular, color: colors.muted, textAlign: 'center', marginTop: 14, lineHeight: 18, paddingHorizontal: 10 },
  ownKey: { fontSize: 12, fontFamily: fonts.bold, color: colors.coral, textAlign: 'center', marginTop: 8, textDecorationLine: 'underline' },
  error: { fontSize: 14, fontFamily: fonts.bold, color: colors.red, textAlign: 'center', marginTop: 12 },
  pickTitle: { fontSize: 17, fontFamily: fonts.extraBold, color: colors.ink, marginBottom: 10 },
  cand: {
    width: '100%',
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.coral,
    borderRadius: radius.lg,
    padding: 16,
    marginBottom: 10,
    alignItems: 'center',
  },
  candDate: { fontSize: 19, fontFamily: fonts.extraBold, color: colors.ink },
  candRaw: { fontSize: 12.5, fontFamily: fonts.regular, color: colors.muted, marginTop: 4 },
  noneTitle: { fontSize: 18, fontFamily: fonts.extraBold, color: colors.ink, marginBottom: 6 },
  noneSub: { fontSize: 14, fontFamily: fonts.regular, color: colors.muted, textAlign: 'center', lineHeight: 21, marginBottom: 6 },
  keyCard: {
    marginTop: 16,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    padding: 16,
  },
  keyTitle: { fontSize: 16, fontFamily: fonts.extraBold, color: colors.ink, marginBottom: 6 },
  keySub: { fontSize: 13.5, fontFamily: fonts.regular, color: colors.muted, lineHeight: 20, marginBottom: 12 },
  keyLink: { color: colors.coral, fontFamily: fonts.extraBold },
  keyInput: {
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    fontFamily: fonts.bold,
    color: colors.ink,
    backgroundColor: colors.bg,
    marginBottom: 12,
  },
});
