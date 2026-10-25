/**
 * Parse a dollars string ("4", "4.5", "4.50") into whole cents.
 * Returns `null` for anything that isn't a positive amount.
 */
export function dollarsToCents(value: string): number | null {
  const trimmed = value.trim();
  if (!/^\d+(\.\d{1,2})?$/.test(trimmed)) return null;
  const cents = Math.round(parseFloat(trimmed) * 100);
  return cents > 0 ? cents : null;
}

export function centsToDollars(cents: number): string {
  return (cents / 100).toFixed(2);
}
