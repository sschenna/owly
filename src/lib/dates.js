// Date helpers — ported from the Owly prototype. All calculations are
// local-time, matching how the prototype behaved.

export function isoOf(d) {
  const m = `${d.getMonth() + 1}`.padStart(2, '0');
  const day = `${d.getDate()}`.padStart(2, '0');
  return `${d.getFullYear()}-${m}-${day}`;
}

export function todayIso() {
  return isoOf(new Date());
}

export function parseIso(iso) {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d);
}

/** Whole days from today until the expiry date (negative = overdue). */
export function daysLeft(expiryIso) {
  const t = new Date();
  t.setHours(0, 0, 0, 0);
  const e = parseIso(expiryIso);
  return Math.round((e - t) / 86400000);
}

/** "Jan 8, 2027" */
export function fmtD(expiryIso) {
  return parseIso(expiryIso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

/** "Jan 8" */
export function fmtShort(iso) {
  return parseIso(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

/** "now", "2m ago", "3h ago", "Yesterday", "4d ago", "Jan 8" */
export function relTime(ts) {
  const m = Math.floor((Date.now() - ts) / 60000);
  if (m < 1) return 'now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d === 1) return 'Yesterday';
  if (d < 7) return `${d}d ago`;
  return new Date(ts).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

/** 'overdue' | 'warn' (<=90d) | 'ok' */
export function statusOf(days) {
  if (days < 0) return 'overdue';
  if (days <= 90) return 'warn';
  return 'ok';
}

/** Subtitle + color key for a doc row, mirroring the prototype. */
export function docSubtitle(days, processDays = 14) {
  if (days < 0) return { text: `Expired ${-days} days ago — yikes!`, tone: 'red' };
  if (days <= processDays)
    return { text: `Renew now — takes ~${Math.ceil(processDays / 7)} wks!`, tone: 'red' };
  if (days <= 30) return { text: `${days} days left — heads up!`, tone: 'amber' };
  if (days <= 90) return { text: `${days} days left — plenty of time`, tone: 'amber' };
  return { text: `${days} days left — chilling`, tone: 'green' };
}
