// Tiny app store — AsyncStorage persistence, no other dependencies.
// Screens read with useDocs()/usePeople() and re-render on every change.
import { useSyncExternalStore } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { normalizeDoc, seedDocs, seedPeople } from './data/seed';

export const USER_NAME = 'Sri';

const DOCS_KEY = 'owly-docs-v1';
const PEOPLE_KEY = 'owly-people-v1';
const SETTINGS_KEY = 'owly-settings-v1';

let docs = seedDocs();
let people = seedPeople();
let settings = {
  push: true,
  email: false,
  sound: true,
  quietHours: false,
  quietStart: '22:00',
  quietEnd: '07:00',
  ocrKey: '',
  tone: 'funky', // 'funky' | 'straight' — notification message style
  defaultSound: 'Gentle chime',
};
let hydrated = false;

const listeners = new Set();
const emit = () => listeners.forEach((fn) => fn());
const subscribe = (fn) => {
  listeners.add(fn);
  return () => listeners.delete(fn);
};

function persist() {
  if (!hydrated) return; // never overwrite storage with seeds before loading
  AsyncStorage.setItem(DOCS_KEY, JSON.stringify(docs)).catch(() => {});
  AsyncStorage.setItem(PEOPLE_KEY, JSON.stringify(people)).catch(() => {});
  AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(settings)).catch(() => {});
}

// Load saved data once at launch. Screens render seed data first,
// then re-render with the real data when this resolves.
export async function hydrate() {
  try {
    const [d, p, s] = await Promise.all([
      AsyncStorage.getItem(DOCS_KEY),
      AsyncStorage.getItem(PEOPLE_KEY),
      AsyncStorage.getItem(SETTINGS_KEY),
    ]);
    if (d) docs = JSON.parse(d).map(normalizeDoc);
    if (p) people = JSON.parse(p);
    if (s) settings = { ...settings, ...JSON.parse(s) };
  } catch (e) {
    // Corrupt storage -> fall back to seeds rather than crashing.
  }
  hydrated = true;
  emit();
}

export const getDocs = () => docs;
export const getPeople = () => people;
export const getSettings = () => settings;

export function useDocs() {
  return useSyncExternalStore(subscribe, getDocs);
}

export function usePeople() {
  return useSyncExternalStore(subscribe, getPeople);
}

export function useSettings() {
  return useSyncExternalStore(subscribe, getSettings);
}

// Lets non-component modules (like the notification scheduler) react to changes.
export function onStoreChange(fn) {
  return subscribe(fn);
}

// Writers (used from Milestone 3 onward):
export function updateDocs(fn) {
  docs = fn(docs);
  emit();
  persist();
}

export function updatePeople(fn) {
  people = fn(people);
  emit();
  persist();
}

export function updateSettings(patch) {
  settings = { ...settings, ...patch };
  emit();
  persist();
}

// Cross-screen filter requests: Summary/Coverage ask Home to filter itself
// (by owner or by category) the next time it gains focus.
let pendingFilter = null;
export function requestFilter(f) {
  pendingFilter = f;
}
export function consumeFilter() {
  const f = pendingFilter;
  pendingFilter = null;
  return f;
}

// Scanned expiry handoff: the Scan screen stashes the picked date here,
// and the Add flow consumes it when it regains focus.
let scannedExpiry = null;
export function setScannedExpiry(iso) {
  scannedExpiry = iso;
}
export function consumeScannedExpiry() {
  const v = scannedExpiry;
  scannedExpiry = null;
  return v;
}
