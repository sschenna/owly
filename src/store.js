// Tiny app store — AsyncStorage persistence, no other dependencies.
// Screens read with useDocs()/usePeople() and re-render on every change.
import { useSyncExternalStore } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { normalizeDoc, seedDocs, seedPeople } from './data/seed';

export const USER_NAME = 'Sri';

const DOCS_KEY = 'owly-docs-v1';
const PEOPLE_KEY = 'owly-people-v1';

let docs = seedDocs();
let people = seedPeople();
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
}

// Load saved data once at launch. Screens render seed data first,
// then re-render with the real data when this resolves.
export async function hydrate() {
  try {
    const [d, p] = await Promise.all([
      AsyncStorage.getItem(DOCS_KEY),
      AsyncStorage.getItem(PEOPLE_KEY),
    ]);
    if (d) docs = JSON.parse(d).map(normalizeDoc);
    if (p) people = JSON.parse(p);
  } catch (e) {
    // Corrupt storage -> fall back to seeds rather than crashing.
  }
  hydrated = true;
  emit();
}

export const getDocs = () => docs;
export const getPeople = () => people;

export function useDocs() {
  return useSyncExternalStore(subscribe, getDocs);
}

export function usePeople() {
  return useSyncExternalStore(subscribe, getPeople);
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
