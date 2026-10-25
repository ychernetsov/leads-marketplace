import type { AdminFile } from '../../types/file';
import { formatDate, formatPrice, pluralize } from '../../utilities/format';

interface DatasetRowProps {
  file: AdminFile;
  selected: boolean;
  onToggle: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

/** One dataset in the admin management list. */
export function DatasetRow({ file, selected, onToggle, onEdit, onDelete }: DatasetRowProps) {
  return (
    <div className={`pc-row${selected ? ' selected' : ''}`}>
      <input
        type="checkbox"
        className="pc-checkbox"
        checked={selected}
        onChange={onToggle}
        aria-label={`Select ${file.title}`}
      />
      <div className="pc-row-content" style={{ paddingLeft: 0, minWidth: 0 }}>
        <div className="pc-row-title">
          <span className={`pc-badge ${file.status}`}>{file.status.toUpperCase()}</span>
          {file.title.toUpperCase()}
        </div>
        <div className="pc-row-meta">
          {formatPrice(file.priceCents)}
          {file.numRows !== null && ` · ${file.numRows.toLocaleString()} ROWS`}
          {` · ${pluralize(file.orderCount, 'PURCHASE')}`}
          {` · ${formatDate(file.createdAt)}`}
        </div>
        <div
          className="pc-row-meta"
          style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}
          title={file.description}
        >
          {file.description}
        </div>
      </div>
      <div className="pc-row-actions">
        <button className="pc-pill pc-pill-outline" onClick={onEdit}>
          EDIT
        </button>
        <button className="pc-pill pc-pill-danger" onClick={onDelete}>
          DELETE
        </button>
      </div>
    </div>
  );
}
