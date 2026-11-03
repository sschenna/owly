// Local notification scheduling — the OS delivers these even with the app
// closed, so nudges arrive on time without any server. Re-syncs on every
// store change (debounced). Web is a no-op.
import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import { getDocs, getSettings, onStoreChange } from '../store';
import { effDate } from './nudges';
import { parseIso } from './dates';

const NAG_DAYS = { daily: 1, '3days': 3, weekly: 7 };
const MAX_SCHEDULED = 60; // iOS caps at 64 per app
const NAG_HORIZON_DAYS = 90; // don't nag forever into the future

if (Platform.OS !== 'web') {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });
}

const toMin = (t) => {
  const [h, m] = String(t || '09:00').split(':').map(Number);
  return h * 60 + m;
};

/** Push a fire time out of quiet hours (to quietEnd). */
function applyQuietHours(dt, s) {
  if (!s.quietHours) return dt;
  const start = toMin(s.quietStart);
  const end = toMin(s.quietEnd);
  const cur = dt.getHours() * 60 + dt.getMinutes();
  const inQuiet = start <= end ? cur >= start && cur < end : cur >= start || cur < end;
  if (!inQuiet) return dt;
  const out = new Date(dt);
  const [eh, em] = String(s.quietEnd).split(':').map(Number);
  out.setHours(eh, em, 0, 0);
  if (out <= dt) out.setDate(out.getDate() + 1);
  return out;
}

/** Upcoming fire times for one doc's nudges (nag rolls past-due ones forward). */
function upcomingForDoc(doc, s) {
  const now = new Date();
  const out = [];
  (doc.reminders || []).forEach((n) => {
    const base = effDate(doc.expiry, n);
    const dt = new Date(base.getFullYear(), base.getMonth(), base.getDate(), ...(() => {
      const [h, m] = String(n.t || '09:00').split(':').map(Number);
      return [h, m, 0, 0];
    })());
    if (dt <= now && doc.nag) {
      const step = NAG_DAYS[doc.nagFreq] || 1;
      const horizon = new Date(now);
      horizon.setDate(horizon.getDate() + NAG_HORIZON_DAYS);
      while (dt <= now && dt <= horizon) dt.setDate(dt.getDate() + step);
    }
    if (dt <= now) return;
    const shifted = applyQuietHours(dt, s);
    if (shifted <= now) return;
    out.push({ dt: shifted, nudge: n });
  });
  return out;
}

/** Whole days from the fire date until expiry (negative = overdue). */
function daysAtFire(expiryIso, fireDt) {
  const fireMid = new Date(fireDt);
  fireMid.setHours(0, 0, 0, 0);
  return Math.round((parseIso(expiryIso) - fireMid) / 86400000);
}

/** Cancel everything and re-schedule from current docs + settings. */
export async function rescheduleAll() {
  if (Platform.OS === 'web') return;
  const s = getSettings();
  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
  } catch (e) {
    return;
  }
  if (!s.push) return;
  let perm = 'undetermined';
  try {
    perm = (await Notifications.getPermissionsAsync()).status;
  } catch (e) {
    return;
  }
  if (perm !== 'granted') return;

  const items = [];
  getDocs().forEach((d) => {
    upcomingForDoc(d, s).forEach(({ dt }) => {
      items.push({ dt, doc: d, dl: daysAtFire(d.expiry, dt) });
    });
  });
  items.sort((a, b) => a.dt - b.dt);

  const playSound = s.sound;
  for (const it of items.slice(0, MAX_SCHEDULED)) {
    const when =
      it.dl < 0 ? 'expired' : it.dl === 0 ? 'expires today' : `expires in ${it.dl} day${it.dl === 1 ? '' : 's'}`;
    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: 'Owly nudge \uD83E\uDD89',
          body: `${it.doc.name} ${when} — tap to take care of it.`,
          data: { docId: it.doc.id },
          sound: playSound ? 'default' : false,
        },
        trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: it.dt },
      });
    } catch (e) {
      // One bad trigger shouldn't kill the rest.
    }
  }
}

let debounceTimer = null;
function rescheduleSoon() {
  if (debounceTimer) clearTimeout(debounceTimer);
  debounceTimer = setTimeout(rescheduleAll, 800);
}

/**
 * Start the scheduler. onTapDoc(docId) fires when a notification is tapped.
 * Returns a cleanup function.
 */
export function initNotifications(onTapDoc) {
  if (Platform.OS === 'web') return () => {};
  let respSub = null;
  try {
    respSub = Notifications.addNotificationResponseReceivedListener((resp) => {
      const docId = resp?.notification?.request?.content?.data?.docId;
      if (docId && onTapDoc) onTapDoc(docId);
    });
  } catch (e) {
    // listeners unsupported here — scheduling still works
  }
  const unsubStore = onStoreChange(rescheduleSoon);
  rescheduleAll();
  return () => {
    if (respSub) respSub.remove();
    unsubStore();
    if (debounceTimer) clearTimeout(debounceTimer);
  };
}

/** Ask the OS for notification permission. Returns true if granted. */
export async function ensurePushPermission() {
  if (Platform.OS === 'web') return false;
  try {
    const { status: existing } = await Notifications.getPermissionsAsync();
    if (existing === 'granted') return true;
    const { status } = await Notifications.requestPermissionsAsync();
    return status === 'granted';
  } catch (e) {
    return false;
  }
}

/** Current OS permission status ('granted' | 'denied' | 'undetermined'). */
export async function pushPermissionStatus() {
  if (Platform.OS === 'web') return 'undetermined';
  try {
    return (await Notifications.getPermissionsAsync()).status;
  } catch (e) {
    return 'undetermined';
  }
}
