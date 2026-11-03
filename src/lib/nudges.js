// Nudge scheduling — ported from the prototype.
// A nudge fires `days` before expiry, at its set time, unless snoozed later.
import { isoOf, parseIso, todayIso } from './dates';

/** Effective fire date for one nudge (snooze wins if it's later). */
export function effDate(expiryIso, nudge) {
  const base = parseIso(expiryIso);
  base.setDate(base.getDate() - nudge.d);
  if (nudge.snooze) {
    const sn = parseIso(nudge.snooze);
    if (sn > base) return sn;
  }
  return base;
}

/**
 * Map of upcoming nudges: { 'YYYY-MM-DD': [{docId, docName, days, time}] }.
 * Past nudges are excluded (they live in the inbox, Milestone 5).
 */
export function nudgeMap(docs) {
  const map = {};
  const today = parseIso(todayIso());
  docs.forEach((d) => {
    (d.reminders || []).forEach((n) => {
      const dt = effDate(d.expiry, n);
      if (dt >= today) {
        const iso = isoOf(dt);
        (map[iso] = map[iso] || []).push({
          docId: d.id,
          docName: d.name,
          days: n.d,
          time: n.t,
        });
      }
    });
  });
  return map;
}

/** Mon..Sun dates for the week containing today. */
export function weekDays() {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const dow = (now.getDay() + 6) % 7; // Monday-first
  const mon = new Date(now);
  mon.setDate(now.getDate() - dow);
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(mon);
    d.setDate(mon.getDate() + i);
    return d;
  });
}
