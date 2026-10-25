import type { PurchasedItem } from '../types/order';

export type OrderSortKey =
  | 'newest'
  | 'oldest'
  | 'title-asc'
  | 'title-desc'
  | 'price-desc'
  | 'price-asc';

export type OrderView = 'active' | 'archived' | 'all';

export const ORDER_SORT_OPTIONS: { value: OrderSortKey; label: string }[] = [
  { value: 'newest', label: 'NEWEST FIRST' },
  { value: 'oldest', label: 'OLDEST FIRST' },
  { value: 'title-asc', label: 'NAME A–Z' },
  { value: 'title-desc', label: 'NAME Z–A' },
  { value: 'price-desc', label: 'PRICE HIGH–LOW' },
  { value: 'price-asc', label: 'PRICE LOW–HIGH' },
];

export interface OrderFilters {
  search: string;
  view: OrderView;
  /** Only items carrying *all* of these label ids are kept. Empty = no filter. */
  labelIds: string[];
}

export const DEFAULT_ORDER_FILTERS: OrderFilters = {
  search: '',
  view: 'active',
  labelIds: [],
};

function matchesView(item: PurchasedItem, view: OrderView): boolean {
  if (view === 'all') return true;
  return view === 'archived' ? item.archivedAt !== null : item.archivedAt === null;
}

function matchesSearch(item: PurchasedItem, search: string): boolean {
  const q = search.trim().toLowerCase();
  if (!q) return true;
  return [item.title, item.originalTitle, item.description, ...item.labels.map((l) => l.name)]
    .join(' ')
    .toLowerCase()
    .includes(q);
}

function matchesLabels(item: PurchasedItem, labelIds: string[]): boolean {
  if (labelIds.length === 0) return true;
  const own = new Set(item.labels.map((l) => l.id));
  return labelIds.every((id) => own.has(id));
}

export function filterOrders(items: PurchasedItem[], filters: OrderFilters): PurchasedItem[] {
  return items.filter(
    (item) =>
      matchesView(item, filters.view) &&
      matchesSearch(item, filters.search) &&
      matchesLabels(item, filters.labelIds),
  );
}

export function sortOrders(items: PurchasedItem[], sort: OrderSortKey): PurchasedItem[] {
  const byTitle = (a: PurchasedItem, b: PurchasedItem) =>
    a.title.localeCompare(b.title, undefined, { sensitivity: 'base' });
  const byDate = (a: PurchasedItem, b: PurchasedItem) =>
    new Date(a.paidAt).getTime() - new Date(b.paidAt).getTime();
  const byPrice = (a: PurchasedItem, b: PurchasedItem) => a.amountCents - b.amountCents;

  const sorted = [...items];
  switch (sort) {
    case 'oldest':
      return sorted.sort(byDate);
    case 'title-asc':
      return sorted.sort(byTitle);
    case 'title-desc':
      return sorted.sort((a, b) => byTitle(b, a));
    case 'price-desc':
      return sorted.sort((a, b) => byPrice(b, a) || byTitle(a, b));
    case 'price-asc':
      return sorted.sort((a, b) => byPrice(a, b) || byTitle(a, b));
    case 'newest':
    default:
      return sorted.sort((a, b) => byDate(b, a));
  }
}
