const PALETTE = ['#C98A2C', '#4C6B2F', '#2F5F6B', '#7A3E8C', '#A33F2E', '#5A5445'];

/** Deterministic colour for a label name so chips stay stable across renders. */
export function labelColor(name: string): string {
  let hash = 0;
  for (const ch of name.toLowerCase()) hash = (hash * 31 + ch.charCodeAt(0)) >>> 0;
  return PALETTE[hash % PALETTE.length];
}
