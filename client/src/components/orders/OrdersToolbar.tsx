import type { LabelWithCount } from '../../types/order';
import {
  ORDER_SORT_OPTIONS,
  type OrderFilters,
  type OrderSortKey,
  type OrderView,
} from '../../utilities/orders';
import { LabelFilter } from './LabelFilter';

interface OrdersToolbarProps {
  filters: OrderFilters;
  sort: OrderSortKey;
  labels: LabelWithCount[];
  counts: { active: number; archived: number };
  onFiltersChange: (filters: OrderFilters) => void;
  onSortChange: (sort: OrderSortKey) => void;
  onManageLabels: () => void;
}

const VIEWS: { value: OrderView; label: string }[] = [
  { value: 'active', label: 'ACTIVE' },
  { value: 'archived', label: 'ARCHIVED' },
  { value: 'all', label: 'ALL' },
];

/** Search / sort / view / label controls for the purchases list. */
export function OrdersToolbar({
  filters,
  sort,
  labels,
  counts,
  onFiltersChange,
  onSortChange,
  onManageLabels,
}: OrdersToolbarProps) {
  return (
    <div className="pc-toolbar">
      <div className="pc-toolbar-row">
        <input
          className="pc-input"
          style={{ maxWidth: 260 }}
          placeholder="Search purchases…"
          value={filters.search}
          onChange={(e) => onFiltersChange({ ...filters, search: e.target.value })}
          aria-label="Search purchases"
        />

        <div className="pc-segmented" role="tablist" aria-label="Show">
          {VIEWS.map((v) => {
            const count = v.value === 'all' ? counts.active + counts.archived : counts[v.value];
            return (
              <button
                key={v.value}
                type="button"
                role="tab"
                aria-selected={filters.view === v.value}
                className={filters.view === v.value ? 'active' : ''}
                onClick={() => onFiltersChange({ ...filters, view: v.value })}
              >
                {v.label} ({count})
              </button>
            );
          })}
        </div>

        <select
          className="pc-input"
          style={{ width: 'auto' }}
          value={sort}
          onChange={(e) => onSortChange(e.target.value as OrderSortKey)}
          aria-label="Sort purchases"
        >
          {ORDER_SORT_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>

        <button type="button" className="pc-pill pc-pill-outline" onClick={onManageLabels}>
          MANAGE LABELS
        </button>
      </div>

      <LabelFilter
        labels={labels}
        selectedIds={filters.labelIds}
        onChange={(labelIds) => onFiltersChange({ ...filters, labelIds })}
      />
    </div>
  );
}
