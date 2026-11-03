// App PIN. On a real phone it lives in the OS keychain via expo-secure-store;
// on web (no keychain) it falls back to AsyncStorage so the feature still works.
import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = 'owly-app-pin';
const FALLBACK_KEY = 'owly-app-pin-fallback';

let secureAvailable = null;
async function isSecure() {
  if (secureAvailable === null) {
    try {
      secureAvailable = await SecureStore.isAvailableAsync();
    } catch (e) {
      secureAvailable = false;
    }
  }
  return secureAvailable;
}

async function read() {
  if (await isSecure()) return SecureStore.getItemAsync(KEY);
  return AsyncStorage.getItem(FALLBACK_KEY);
}

async function write(pin) {
  if (await isSecure()) {
    await SecureStore.setItemAsync(KEY, pin);
  } else {
    await AsyncStorage.setItem(FALLBACK_KEY, pin);
  }
}

async function remove() {
  try {
    if (await isSecure()) await SecureStore.deleteItemAsync(KEY);
    else await AsyncStorage.removeItem(FALLBACK_KEY);
  } catch (e) {}
}

export async function hasPin() {
  try {
    return (await read()) !== null;
  } catch (e) {
    return false;
  }
}

export async function verifyPin(pin) {
  try {
    return (await read()) === pin;
  } catch (e) {
    return false;
  }
}

export async function setPin(pin) {
  await write(pin);
}

export async function clearPin() {
  await remove();
}

// Rotating jokes for wrong PIN attempts (a prototype tradition).
const JOKES = [
  'Nope! The owl saw that coming.',
  'Wrong! Owly is judging you slightly.',
  'Hmm, that\u2019s not it. Try again, human.',
  'Access denied, but points for confidence.',
];
let jokeIdx = 0;
export function wrongPinJoke() {
  const j = JOKES[jokeIdx % JOKES.length];
  jokeIdx += 1;
  return j;
}
