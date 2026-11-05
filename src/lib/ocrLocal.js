import { Platform } from 'react-native';
import { findDates } from './ocr';

// On-device OCR via ML Kit (iOS Vision / Android ML Kit).
// The photo NEVER leaves the phone — no network, no API key, no third party.
// Requires a development build (native module). In Expo Go, this will be
// unavailable and the caller should fall back to OCR.space.

let TextRecognition = null;
try {
  TextRecognition = require('@react-native-ml-kit/text-recognition').default;
} catch (e) {
  // Module not available (Expo Go) — caller falls back to cloud OCR.
}

/** True if on-device OCR is available on this build. */
export function isLocalOcrAvailable() {
  return !!TextRecognition && Platform.OS !== 'web';
}

/**
 * Run on-device text recognition on a photo URI.
 * Returns { text, candidates } — same shape as ocrImage().
 * Throws with a friendly message on failure.
 */
export async function ocrImageLocal(uri) {
  if (!isLocalOcrAvailable()) {
    throw new Error('On-device OCR needs a development build — using cloud OCR instead.');
  }
  let result;
  try {
    result = await TextRecognition.recognize(uri);
  } catch (e) {
    throw new Error('Couldn\u2019t read that photo on-device — try a clearer shot.');
  }
  // ML Kit returns blocks[] with lines[] with text. Flatten to plain text.
  const text = (result.blocks || [])
    .map((b) => (b.lines || []).map((l) => l.text).join('\n'))
    .join('\n');
  if (!text.trim()) {
    throw new Error('No text found in that photo — try a clearer, well-lit shot.');
  }
  return { text, candidates: findDates(text) };
}
