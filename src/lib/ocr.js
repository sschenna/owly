// OCR: photo -> expiry-date candidates via OCR.space.
// The photo is sent to OCR.space ONLY when the user taps "Extract" —
// never automatically. The user brings their own free API key
// (https://ocr.space/ocrapi, 25k req/month free); it's stored on-device.

const MONTHS = {
  jan: '01', feb: '02', mar: '03', apr: '04', may: '05', jun: '06',
  jul: '07', aug: '08', sep: '09', oct: '10', nov: '11', dec: '12',
  january: '01', february: '02', march: '03', april: '04', june: '06',
  july: '07', august: '08', september: '09', october: '10', november: '11', december: '12',
};

const pad = (n) => String(n).padStart(2, '0');
const validDate = (y, m, d) => {
  const dt = new Date(y, m - 1, d);
  return dt.getFullYear() === y && dt.getMonth() === m - 1 && dt.getDate() === d
    ? `${y}-${pad(m)}-${pad(d)}`
    : null;
};

const PATS = [
  // 15 JAN 2028 / 15-Jan-2028 / 15 Jan, 2028
  /\b(\d{1,2})[\s.\-\/](jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*[\s.\-\/,]+(\d{4})\b/gi,
  // JAN 15 2028 / Jan 15, 2028
  /\b(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*[\s.\-\/,]+(\d{1,2})[\s.\-\/,]+(\d{4})\b/gi,
  // 2028-12-25
  /\b(\d{4})[\-\/](\d{1,2})[\-\/](\d{1,2})\b/g,
  // 12/25/2028 or 25/12/2028 (ambiguous — try both)
  /\b(\d{1,2})[\/\.\-](\d{1,2})[\/\.\-](\d{4})\b/g,
  // EXP 12/27 or 12/27 (MM/YY — common on packaging/meds). Day = end of month.
  /\b(\d{1,2})[\/](\d{2})\b/g,
];

/** Last day of a month (for MM/YY dates). */
const endOfMonth = (y, m) => new Date(y, m, 0).getDate();

/** Pull {iso, raw} date candidates out of OCR text. Expiry-ish lines first. */
export function findDates(text) {
  const out = [];
  const seen = new Set();
  const push = (iso, raw) => {
    if (iso && !seen.has(iso)) {
      seen.add(iso);
      out.push({ iso, raw: raw.trim().slice(0, 40) });
    }
  };

  const lines = text.split('\n');
  const expRe = /expir|valid (until|thru|through)|exp\b/i;
  const ordered = [
    ...lines.filter((l) => expRe.test(l)),
    ...lines.filter((l) => !expRe.test(l)),
  ];
  const joined = ordered.join('\n');

  let m;
  const r1 = new RegExp(PATS[0].source, 'gi');
  while ((m = r1.exec(joined))) {
    const iso = validDate(+m[3], +MONTHS[m[2].toLowerCase().slice(0, 3)], +m[1]);
    push(iso, m[0]);
  }
  const r2 = new RegExp(PATS[1].source, 'gi');
  while ((m = r2.exec(joined))) {
    const iso = validDate(+m[3], +MONTHS[m[1].toLowerCase().slice(0, 3)], +m[2]);
    push(iso, m[0]);
  }
  const r3 = new RegExp(PATS[2].source, 'gi');
  while ((m = r3.exec(joined))) {
    push(validDate(+m[1], +m[2], +m[3]), m[0]);
  }
  const r4 = new RegExp(PATS[3].source, 'gi');
  while ((m = r4.exec(joined))) {
    const a = +m[1];
    const b = +m[2];
    const y = +m[3];
    // Try day-first, then month-first; keep whichever is valid.
    push(validDate(y, b, a) || validDate(y, a, b), m[0]);
  }
  // MM/YY (e.g. "EXP 12/27" on packaging). Skip if it was part of a longer
  // date already matched (avoid double-counting "12/25/2028" as "12/25").
  const r5 = new RegExp(PATS[4].source, 'g');
  while ((m = r5.exec(joined))) {
    const mo = +m[1];
    const yy = +m[2];
    if (mo < 1 || mo > 12) continue;
    const fullYear = 2000 + yy;
    // Don't re-add if this MM/YY is inside an already-found longer date.
    const alreadyCovered = out.some((c) => c.raw.includes(m[0]) && c.raw.length > m[0].length);
    if (alreadyCovered) continue;
    push(validDate(fullYear, mo, endOfMonth(fullYear, mo)), m[0]);
  }
  return out;
}

/** Run OCR on a base64 JPEG. Throws with a friendly message on failure. */
export async function ocrImage(base64, apiKey) {
  const form = new FormData();
  form.append('apikey', apiKey);
  form.append('base64Image', `data:image/jpeg;base64,${base64}`);
  form.append('OCREngine', '2');
  form.append('scale', 'true');

  let res;
  try {
    res = await fetch('https://api.ocr.space/parse/image', { method: 'POST', body: form });
  } catch (e) {
    throw new Error('Couldn\u2019t reach the OCR service — check your connection.');
  }
  const j = await res.json();
  if (j.IsErroredOnProcessing) {
    const msg = (j.ErrorMessage || ['OCR failed'])[0];
    if (/rate limit/i.test(msg)) {
      throw new Error('The free OCR key is rate-limited right now — try again in a minute.');
    }
    throw new Error('The OCR service couldn\u2019t read that photo.');
  }
  const text = (j.ParsedResults || []).map((r) => r.ParsedText || '').join('\n');
  return { text, candidates: findDates(text) };
}
