// Notification tones, synthesized in code — no audio files needed.
// Each recipe builds a tiny WAV (16-bit PCM mono) and plays it via expo-audio.
import { createAudioPlayer } from 'expo-audio';

const SR = 22050;
const B64 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

function base64Encode(bin) {
  let out = '';
  for (let i = 0; i < bin.length; i += 3) {
    const a = bin.charCodeAt(i);
    const b = i + 1 < bin.length ? bin.charCodeAt(i + 1) : 0;
    const c = i + 2 < bin.length ? bin.charCodeAt(i + 2) : 0;
    out +=
      B64[a >> 2] +
      B64[((a & 3) << 4) | (b >> 4)] +
      (i + 1 < bin.length ? B64[((b & 15) << 2) | (c >> 6)] : '=') +
      (i + 2 < bin.length ? B64[c & 63] : '=');
  }
  return out;
}

function wavDataUri(samples) {
  const n = samples.length;
  const buf = new ArrayBuffer(44 + n * 2);
  const v = new DataView(buf);
  const wstr = (o, s) => {
    for (let i = 0; i < s.length; i++) v.setUint8(o + i, s.charCodeAt(i));
  };
  wstr(0, 'RIFF');
  v.setUint32(4, 36 + n * 2, true);
  wstr(8, 'WAVE');
  wstr(12, 'fmt ');
  v.setUint32(16, 16, true);
  v.setUint16(20, 1, true);
  v.setUint16(22, 1, true);
  v.setUint32(24, SR, true);
  v.setUint32(28, SR * 2, true);
  v.setUint16(32, 2, true);
  v.setUint16(34, 16, true);
  wstr(36, 'data');
  v.setUint32(40, n * 2, true);
  for (let i = 0; i < n; i++) {
    const s = Math.max(-1, Math.min(1, samples[i]));
    v.setInt16(44 + i * 2, Math.round(s * 32767), true);
  }
  const bytes = new Uint8Array(buf);
  let bin = '';
  const CH = 8192;
  for (let i = 0; i < bytes.length; i += CH) {
    bin += String.fromCharCode.apply(null, bytes.subarray(i, i + CH));
  }
  return 'data:audio/wav;base64,' + base64Encode(bin);
}

// A sine note with exponential decay. Returns samples placed at `start`.
function note(freq, start, dur, vol = 0.4, total) {
  const out = new Float32Array(total).fill(0);
  const s0 = Math.floor(start * SR);
  const len = Math.floor(dur * SR);
  for (let i = 0; i < len && s0 + i < total; i++) {
    const t = i / SR;
    const env = Math.exp(-3.5 * (i / len));
    out[s0 + i] += Math.sin(2 * Math.PI * freq * t) * vol * env;
  }
  return out;
}

function mix(total, ...parts) {
  const out = new Float32Array(total).fill(0);
  parts.forEach((p) => {
    for (let i = 0; i < total; i++) out[i] += p[i] || 0;
  });
  return out;
}

function sweep(f0, f1, dur, vol = 0.45) {
  const total = Math.floor(dur * SR);
  const out = new Float32Array(total);
  for (let i = 0; i < total; i++) {
    const t = i / SR;
    const f = f0 + (f1 - f0) * (i / total);
    const env = Math.sin(Math.PI * (i / total)); // up-down envelope
    out[i] = Math.sin(2 * Math.PI * f * t) * vol * env;
  }
  return out;
}

function boop(freq, start, dur, vol = 0.35, total) {
  const out = new Float32Array(total).fill(0);
  const s0 = Math.floor(start * SR);
  const len = Math.floor(dur * SR);
  for (let i = 0; i < len && s0 + i < total; i++) {
    const t = i / SR;
    const env = i < len * 0.1 ? i / (len * 0.1) : Math.exp(-4 * ((i - len * 0.1) / len));
    out[s0 + i] += Math.sign(Math.sin(2 * Math.PI * freq * t)) * vol * env * 0.7;
  }
  return out;
}

const RECIPES = {
  'Gentle chime': () => {
    const total = Math.floor(1.4 * SR);
    return mix(total, note(659.25, 0, 0.6, 0.38, total), note(987.77, 0.28, 0.9, 0.34, total));
  },
  'Playful pop': () => sweep(320, 940, 0.22, 0.5),
  'Robot boop': () => {
    const total = Math.floor(0.6 * SR);
    return mix(total, boop(392, 0, 0.14, 0.32, total), boop(587.33, 0.16, 0.22, 0.32, total));
  },
};

const cache = {};

/** Data URI for a named sound (built once, then cached). Null for Silent. */
export function soundUri(name) {
  if (name === 'Silent' || !RECIPES[name]) return null;
  if (!cache[name]) cache[name] = wavDataUri(RECIPES[name]());
  return cache[name];
}

/** Play a short preview of the named sound. Never throws. */
export async function previewSound(name) {
  const uri = soundUri(name);
  if (!uri) return;
  try {
    // On web, use HTML5 Audio directly — more reliable than expo-audio for data URIs.
    if (typeof window !== 'undefined' && typeof window.Audio !== 'undefined') {
      const audio = new window.Audio(uri);
      audio.volume = 1.0;
      await audio.play().catch(() => {});
      setTimeout(() => {
        try {
          audio.pause();
          audio.src = '';
        } catch (e) {}
      }, 2500);
      return;
    }
    // Native: use expo-audio.
    const player = createAudioPlayer({ uri });
    player.play();
    setTimeout(() => {
      try {
        player.pause();
        player.remove && player.remove();
      } catch (e) {}
    }, 2500);
  } catch (e) {
    // Audio unavailable here (e.g. unsupported build) — picking still works.
  }
}
