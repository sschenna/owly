// Tiny text helpers.

/** Up to 2 initials: "Asha" -> "A", "Mary Jane" -> "MJ". */
export function initials(name) {
  const w = String(name || '?').trim().split(/\s+/);
  const a = w[0] ? w[0].charAt(0) : '?';
  const b = w[1] ? w[1].charAt(0) : w[0] && w[0].length > 1 ? w[0].charAt(1) : '';
  return (a + b).toUpperCase();
}
