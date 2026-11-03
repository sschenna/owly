// Seed data — the same demo content as the prototype, so milestone builds
// feel alive from day one. Real user data replaces this later.

export const CATS = {
  passport: {
    label: 'Passport',
    nick: 'My Passport',
    processDays: 56,
    fee: '$130',
    defaults: [365, 180, 90, 30, 7],
    steps: [
      'Get a compliant passport photo',
      'Fill out form DS-82 (renewal)',
      'Pay the $130 fee',
      'Mail it or apply in person',
    ],
  },
  license: {
    label: "Driver's License",
    nick: 'My License',
    processDays: 21,
    fee: '$30-60',
    defaults: [90, 30, 7, 1],
    steps: [
      'Check online renewal eligibility',
      'Gather proof of residency',
      'Pay the renewal fee',
      'Vision test, if required',
    ],
  },
  visa: {
    label: 'Visa',
    nick: 'Travel Visa',
    processDays: 30,
    fee: 'varies',
    defaults: [90, 30, 14, 7],
    steps: [
      'Check consulate requirements',
      'Book your appointment early',
      'Prepare supporting documents',
    ],
  },
  idcard: {
    label: 'ID Card',
    nick: 'My ID Card',
    processDays: 14,
    fee: '$20-40',
    defaults: [60, 30, 7],
    steps: ['Check renewal options online', 'Gather ID documents', 'Pay the fee'],
  },
  insurance: {
    label: 'Insurance',
    nick: 'My Car Insurance',
    processDays: 7,
    fee: 'varies',
    defaults: [30, 14, 7, 1],
    steps: ['Compare quotes from providers', 'Confirm your coverage details', 'Pay the premium'],
  },
  custom: {
    label: 'Something else',
    nick: 'My Document',
    processDays: 14,
    fee: 'varies',
    defaults: [30, 7, 1],
    steps: ['Check the renewal requirements', 'Gather needed documents'],
  },
};

// Partner links shown at renewal moments (demo names — real affiliate
// partners get wired up before launch).
export const PARTNERS = {
  insurance: {
    label: 'Compare quotes online',
    sub: "See if you're overpaying — takes 2 minutes",
    partner: 'QuoteCompare (demo link)',
  },
  passport: {
    label: 'Renew online',
    sub: 'Skip the line — start your renewal',
    partner: 'SwiftPassport (demo link)',
  },
  visa: {
    label: 'Get travel insurance',
    sub: 'Cover your trip before you fly',
    partner: 'WanderSure (demo link)',
  },
};

export const REPEAT_OPTIONS = [
  { id: 'off', label: 'Off', months: 0 },
  { id: '6m', label: 'Every 6 months', months: 6 },
  { id: '1y', label: 'Every year', months: 12 },
  { id: '2y', label: 'Every 2 years', months: 24 },
  { id: '5y', label: 'Every 5 years', months: 60 },
  { id: '10y', label: 'Every 10 years', months: 120 },
];

export const NAG_FREQS = [
  { id: 'daily', label: 'Every day' },
  { id: '3days', label: 'Every 3 days' },
  { id: 'weekly', label: 'Every week' },
];

export const SOUNDS = ['Gentle chime', 'Playful pop', 'Robot boop', 'Silent'];

export function seedPeople() {
  return [
    { id: 'p1', name: 'Asha', color: '#f2668b' },
    { id: 'p2', name: 'Ravi', color: '#0ea5e9' },
  ];
}

const R = (d, t = '09:00') => ({ d, t, snooze: null });

export function seedDocs() {
  const now = Date.now();
  const H = 1000 * 60 * 60;
  return [
    {
      id: 'd1', type: 'passport', name: 'Passport', owner: 'me',
      expiry: '2027-01-08', reminders: [R(90), R(30), R(7)],
      repeat: { id: '10y', label: 'Every 10 years', months: 120 },
    },
    {
      id: 'd2', type: 'license', name: "Driver's License", owner: 'me',
      expiry: '2027-12-19', reminders: [R(60), R(14)],
    },
    {
      id: 'd3', type: 'visa', name: 'Visa', owner: 'me',
      expiry: '2026-10-21', reminders: [R(30), R(7)],
      nag: true, nagFreq: 'daily',
      comments: [
        { id: 'c-seed-1', author: 'p1', text: 'Hey @Sri, did you book the consulate appointment yet?', ts: now - 5 * H },
        { id: 'c-seed-2', author: 'me', text: 'Not yet — doing it this weekend, promise!', ts: now - 2 * H },
      ],
    },
    {
      id: 'd4', type: 'insurance', name: 'Car Insurance', owner: 'p1',
      expiry: '2026-11-12', reminders: [R(30), R(14), R(7), R(1)],
      comments: [
        { id: 'c-seed-3', author: 'me', text: 'Got the renewal quote — went up again. Shopping around.', ts: now - 26 * H },
      ],
    },
    {
      id: 'd5', type: 'passport', name: "Asha's Passport", owner: 'p1',
      expiry: '2026-11-22', reminders: [R(30), R(14), R(7)],
    },
    {
      id: 'd6', type: 'idcard', name: 'ID Card', owner: 'p2',
      expiry: '2028-03-15', reminders: [R(60), R(30), R(7)],
    },
    {
      id: 'd7', type: 'insurance', name: 'Health Insurance', owner: 'me',
      expiry: '2026-10-28', reminders: [R(14), R(7), R(1)],
      nag: true, nagFreq: '3days',
      history: [{ date: '2025-10-28', fee: '240' }],
    },
    {
      id: 'd8', type: 'visa', name: "Ravi's Visa", owner: 'p2',
      expiry: '2027-06-01', reminders: [R(90), R(30), R(14), R(7)],
    },
  ].map(normalizeDoc);
}

/** Fill in defaults so every doc has the full shape the UI expects. */
export function normalizeDoc(d) {
  const steps = (CATS[d.type] && CATS[d.type].steps) || [];
  return {
    repeat: null,
    nag: true,
    nagFreq: 'daily',
    sound: 'Gentle chime',
    soundOn: true,
    tone: 'funky', // 'funky' | 'straight' — per-doc nudge message style
    email: false,
    owner: 'me',
    history: [],
    comments: [],
    checkItems: steps.map((text) => ({ text, done: false })),
    file: null,
    ...d,
    reminders: (d.reminders || []).map((r) =>
      typeof r === 'number' ? { d: r, t: '09:00', snooze: null } : { t: '09:00', snooze: null, ...r },
    ),
  };
}

// Friendly labels for the doc-type keys.
export const TYPE_LABELS = {
  passport: 'Passport',
  license: "Driver's License",
  visa: 'Visa',
  idcard: 'ID Card',
  insurance: 'Insurance',
  custom: 'Custom',
};
