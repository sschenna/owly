// Owly brand tokens — the single source of truth for colors, fonts & shape.
// If Sri ever wants a rebrand, it starts here.

export const colors = {
  // Brand
  coral: '#f2668b',
  pink: '#ff8fab',
  pinkSoft: '#ffb3c7',
  purple: '#b388ff',
  purpleDeep: '#8b5cf6',

  // Status
  amber: '#f59e0b',
  orange: '#f97316',
  green: '#10b981',
  teal: '#2dd4bf',
  red: '#f43f5e',
  blue: '#3b82f6',
  sky: '#0ea5e9',

  // Neutrals
  ink: '#2d2a32',
  muted: '#8a8494',
  bg: '#fff5f7',
  surface: '#ffffff',
  border: '#f3d9e2',
};

export const gradients = {
  brand: ['#f2668b', '#ff8fab'],
  brandPurple: ['#f2668b', '#b388ff'],
  amber: ['#f59e0b', '#f97316'],
  green: ['#10b981', '#2dd4bf'],
  red: ['#f43f5e', '#fb7185'],
};

// Per document-type gradient pairs (used for doc icons)
export const docGradients = {
  passport: ['#3b82f6', '#6366f1'],
  license: ['#10b981', '#14b8a6'],
  visa: ['#a855f7', '#ec4899'],
  idcard: ['#0ea5e9', '#22d3ee'],
  insurance: ['#f59e0b', '#f97316'],
  custom: ['#64748b', '#94a3b8'],
};

export const fonts = {
  regular: 'PlusJakartaSans_400Regular',
  bold: 'PlusJakartaSans_700Bold',
  extraBold: 'PlusJakartaSans_800ExtraBold',
};

export const radius = {
  sm: 12,
  md: 18,
  lg: 24,
  xl: 30,
  pill: 999,
};

export const peopleColors = ['#f2668b', '#8b5cf6', '#0ea5e9', '#10b981', '#f59e0b'];
