export function formatPrice(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

export function formatDate(iso: string): string {
  return new Date(iso)
    .toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    .toUpperCase();
}

export function pluralize(count: number, singular: string, plural = `${singular}S`): string {
  return `${count} ${count === 1 ? singular : plural}`;
}
