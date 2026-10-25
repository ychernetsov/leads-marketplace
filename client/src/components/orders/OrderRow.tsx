import type { PurchasedItem } from '../../types/order';
import { formatDate, formatPrice } from '../../utilities/format';
import { DownloadButton } from '../catalog/DownloadButton';
import { LabelChip } from './LabelChip';

interface OrderRowProps {
  item: PurchasedItem;
  downloading: boolean;
  onDownload: () => void;
  onEdit: () => void;
  onLabels: () => void;
  onToggleArchive: () => void;
  onDelete: () => void;
}

/** One purchased dataset in the buyer's library, with all its actions. */
export function OrderRow({
  item,
  downloading,
  onDownload,
  onEdit,
  onLabels,
  onToggleArchive,
  onDelete,
}: OrderRowProps) {
  const archived = item.archivedAt !== null;

  return (
    <div className={`pc-row${archived ? ' archived' : ''}`}>
      <div className="pc-row-perforation" />
      <div className="pc-row-hole top" />
      <div className="pc-row-hole bottom" />
      <div className="pc-row-content" style={{ minWidth: 0 }}>
        <div className="pc-row-title">
          {archived && <span className="pc-badge">ARCHIVED</span>}
          {item.fileRemoved && (
            <span className="pc-badge failed" title="The seller removed this dataset from the catalog. You still own it.">
              REMOVED FROM CATALOG
            </span>
          )}
          {item.title.toUpperCase()}
        </div>
        <div className="pc-row-meta">
          PURCHASED {formatDate(item.paidAt)} · {formatPrice(item.amountCents)}
          {item.numRows !== null && ` · ${item.numRows.toLocaleString()} ROWS`}
          {item.isCustomized && item.title !== item.originalTitle && ` · ORIGINALLY "${item.originalTitle.toUpperCase()}"`}
        </div>
        {item.description && (
          <div
            className="pc-row-meta"
            style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}
            title={item.description}
          >
            {item.description}
          </div>
        )}
        {item.labels.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 6 }}>
            {item.labels.map((l) => (
              <LabelChip key={l.id} name={l.name} />
            ))}
          </div>
        )}
      </div>

      <div className="pc-row-actions">
        <DownloadButton downloading={downloading} onDownload={onDownload} />
        <button className="pc-pill pc-pill-outline" onClick={onEdit}>
          EDIT
        </button>
        <button className="pc-pill pc-pill-outline" onClick={onLabels}>
          LABELS
        </button>
        <button className="pc-pill pc-pill-outline" onClick={onToggleArchive}>
          {archived ? 'UNARCHIVE' : 'ARCHIVE'}
        </button>
        <button className="pc-pill pc-pill-danger" onClick={onDelete}>
          DELETE
        </button>
      </div>
    </div>
  );
}
