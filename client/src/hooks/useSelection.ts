import { useMemo, useState } from 'react';

/** Multi-select state for a list of items with string ids. */
export function useSelection<T extends { id: string }>(items: T[] | undefined) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Only ids that still exist count as selected (items may be deleted/refetched).
  const selected = useMemo(
    () => (items ?? []).filter((item) => selectedIds.has(item.id)),
    [items, selectedIds],
  );
  const allSelected = !!items && items.length > 0 && selected.length === items.length;

  function toggle(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleAll() {
    if (!items) return;
    setSelectedIds(allSelected ? new Set() : new Set(items.map((i) => i.id)));
  }

  function clear() {
    setSelectedIds(new Set());
  }

  return { selected, selectedIds, allSelected, toggle, toggleAll, clear, isSelected: (id: string) => selectedIds.has(id) };
}
