// Tiny app store — in-memory for now, no dependencies.
// Screens read with useDocs()/usePeople() and re-render on every change.
// Later milestones add persistence (encrypted on-device storage) here,
// so screens never need to change how they read data.
import { useSyncExternalStore } from 'react';
import { seedDocs, seedPeople } from './data/seed';

export const USER_NAME = 'Sri';

let docs = seedDocs();
let people = seedPeople();

const listeners = new Set();
const emit = () => listeners.forEach((fn) => fn());
const subscribe = (fn) => {
  listeners.add(fn);
  return () => listeners.delete(fn);
};

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
}

export function updatePeople(fn) {
  people = fn(people);
  emit();
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
