// Calendar export: native via expo-calendar (needs dev build, not Expo Go),
// web via .ics file download.
import { Platform } from 'react-native';
import * as Calendar from 'expo-calendar';

// --- ICS generation (web fallback) ---

function icsDate(isoDate) {
  // isoDate: 'YYYY-MM-DD' -> 'YYYYMMDD'
  return isoDate.replace(/-/g, '');
}

function icsEscape(s) {
  return (s || '').replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\n/g, '\\n');
}

export function buildICS(docs) {
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Owly//Document Expiry//EN',
    'CALSCALE:GREGORIAN',
  ];
  const now = new Date().toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  docs.forEach((doc) => {
    if (!doc.expiry) return;
    const uid = `owly-${doc.id}-expiry@owly`;
    lines.push(
      'BEGIN:VEVENT',
      `UID:${uid}`,
      `DTSTAMP:${now}`,
      `DTSTART;VALUE=DATE:${icsDate(doc.expiry)}`,
      `SUMMARY:${icsEscape(`⏰ ${doc.name} expires`)}`,
      `DESCRIPTION:${icsEscape(`Your ${doc.name} expires today. Don't panic — Owly's got you.`)}`,
      'BEGIN:VALARM',
      'TRIGGER:-P1D',
      'ACTION:DISPLAY',
      `DESCRIPTION:${icsEscape(`${doc.name} expires tomorrow!`)}`,
      'END:VALARM',
      'END:VEVENT'
    );
    // Nudge events
    (doc.reminders || []).forEach((r, i) => {
      const d = new Date(doc.expiry);
      d.setDate(d.getDate() - r.d);
      if (d < new Date()) return; // skip past nudges
      const nuid = `owly-${doc.id}-nudge-${i}@owly`;
      lines.push(
        'BEGIN:VEVENT',
        `UID:${nuid}`,
        `DTSTAMP:${now}`,
        `DTSTART;VALUE=DATE:${icsDate(d.toISOString().slice(0, 10))}`,
        `SUMMARY:${icsEscape(`🔔 ${doc.name} expires in ${r.d} days`)}`,
        `DESCRIPTION:${icsEscape(`Heads up! Your ${doc.name} expires on ${doc.expiry}.`)}`,
        'END:VEVENT'
      );
    });
  });
  lines.push('END:VCALENDAR');
  return lines.join('\r\n');
}

export function downloadICS(docs, filename = 'owly-expiries.ics') {
  const ics = buildICS(docs);
  const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// --- Native (expo-calendar) ---

export async function isNativeCalendarAvailable() {
  if (Platform.OS === 'web') return false;
  try {
    // expo-calendar is not available in Expo Go — this throws there
    await Calendar.getCalendarPermissions();
    return true;
  } catch (e) {
    return false;
  }
}

async function getOwlyCalendar() {
  const { status } = await Calendar.requestCalendarPermissions();
  if (status !== 'granted') throw new Error('Calendar permission denied');

  const calendars = Calendar.getCalendars(Calendar.EntityTypes.EVENT);
  let owly = calendars.find((c) => c.title === 'Owly');
  if (!owly) {
    owly = await Calendar.createCalendar({
      title: 'Owly',
      color: '#f2668b',
      entityType: Calendar.EntityTypes.EVENT,
    });
  }
  // getCalendars returns plain objects; createCalendar returns an id string on some platforms
  return typeof owly === 'string' ? owly : owly.id;
}

export async function exportToNativeCalendar(docs) {
  const calId = await getOwlyCalendar();
  let count = 0;
  for (const doc of docs) {
    if (!doc.expiry) continue;
    const expiryDate = new Date(doc.expiry + 'T09:00:00');
    await Calendar.createEvent(calId, {
      title: `⏰ ${doc.name} expires`,
      startDate: expiryDate,
      endDate: new Date(expiryDate.getTime() + 60 * 60 * 1000),
      notes: `Your ${doc.name} expires today. Don't panic — Owly's got you.`,
      alarms: [{ relativeOffset: -60 * 24 }, { relativeOffset: -60 * 24 * 7 }],
    });
    count++;
    // Nudge events
    for (const r of doc.reminders || []) {
      const d = new Date(doc.expiry + 'T09:00:00');
      d.setDate(d.getDate() - r.d);
      if (d < new Date()) continue;
      await Calendar.createEvent(calId, {
        title: `🔔 ${doc.name} expires in ${r.d} days`,
        startDate: d,
        endDate: new Date(d.getTime() + 30 * 60 * 1000),
        notes: `Heads up! Your ${doc.name} expires on ${doc.expiry}.`,
      });
      count++;
    }
  }
  return count;
}

// --- Unified entry point ---

export async function exportDocsToCalendar(docs) {
  if (Platform.OS === 'web') {
    downloadICS(docs);
    return { mode: 'download', count: docs.length };
  }
  if (await isNativeCalendarAvailable()) {
    const count = await exportToNativeCalendar(docs);
    return { mode: 'native', count };
  }
  // Expo Go / no native calendar: fall back to .ics via sharing is complex,
  // so we throw a friendly error
  throw new Error('Calendar export needs a dev build on this phone — try the web version for .ics download.');
}
