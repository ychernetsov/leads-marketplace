import type { AdminFile } from '../../types/file';
import { formatPrice, pluralize } from '../../utilities/format';

/** Compact read-only list of datasets, used inside confirm/bulk dialogs. */
export function DatasetList({ files }: { files: AdminFile[] }) {
  return (
    <ul style={{ margin: 0, padding: 0, listStyle: 'none', maxHeight: 160, overflow: 'auto' }}>
      {files.map((f) => (
        <li key={f.id} className="pc-row-meta" style={{ marginTop: 4 }}>
          · {f.title.toUpperCase()} ({formatPrice(f.priceCents)}
          {f.orderCount > 0 ? `, ${pluralize(f.orderCount, 'PURCHASE')}` : ''})
        </li>
      ))}
    </ul>
  );
}
