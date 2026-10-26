import { useNavigate } from 'react-router-dom';

interface DatasetBulkBarProps {
  total: number;
  selectedCount: number;
  allSelected: boolean;
  onToggleAll: () => void;
  onClear: () => void;
  onBulkEdit: () => void;
  onBulkDelete: () => void;
}

/** Select-all checkbox, selection count, and the bulk actions for edit mode. */
export function DatasetBulkBar({
  total,
  selectedCount,
  allSelected,
  onToggleAll,
  onClear,
  onBulkEdit,
  onBulkDelete,
}: DatasetBulkBarProps) {
  const navigate = useNavigate();

  return (
    <div className="pc-toolbar">
      <div className="pc-toolbar-row" style={{ justifyContent: 'space-between' }}>
        <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', fontSize: 11, letterSpacing: 1, color: 'var(--pc-text-muted)' }}>
          <input
            type="checkbox"
            className="pc-checkbox"
            checked={allSelected}
            disabled={total === 0}
            onChange={onToggleAll}
            aria-label="Select all datasets"
          />
          {selectedCount > 0 ? `${selectedCount} SELECTED` : 'SELECT ALL'}
        </label>

        <div className="pc-bulk-bar">
          {selectedCount > 0 ? (
            <>
              <button className="pc-pill pc-pill-outline" onClick={onBulkEdit}>
                EDIT SELECTED
              </button>
              <button className="pc-pill pc-pill-danger" onClick={onBulkDelete}>
                DELETE SELECTED
              </button>
              <button className="pc-nav-link" onClick={onClear}>
                CLEAR
              </button>
            </>
          ) : (
            <button className="pc-pill pc-pill-accent" onClick={() => navigate('/admin/upload')}>
              + UPLOAD NEW
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
