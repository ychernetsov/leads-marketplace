import type { AdminFile } from '../../types/file';
import { pluralize } from '../../utilities/format';
import { ConfirmDialog } from '../ConfirmDialog';
import { DatasetList } from './DatasetList';

interface DatasetDeleteDialogProps {
  files: AdminFile[];
  busy: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export function DatasetDeleteDialog({ files, busy, onClose, onConfirm }: DatasetDeleteDialogProps) {
  const many = files.length > 1;
  const purchased = files.filter((f) => f.orderCount > 0);
  const purchases = purchased.reduce((sum, f) => sum + f.orderCount, 0);

  return (
    <ConfirmDialog
      title={many ? `DELETE ${files.length} DATASETS` : 'DELETE DATASET'}
      confirmLabel={many ? `DELETE ${files.length}` : 'DELETE'}
      danger
      busy={busy}
      onClose={onClose}
      onConfirm={onConfirm}
    >
      <div className="pc-row-meta" style={{ marginTop: 0, lineHeight: 1.6 }}>
        {many ? 'THESE DATASETS' : 'THIS DATASET'} WILL BE REMOVED FROM THE CATALOG. THIS CANNOT BE UNDONE.
      </div>
      {purchases > 0 && (
        <div className="pc-row-meta" style={{ color: 'var(--pc-accent)', marginTop: 10, lineHeight: 1.6 }}>
          {pluralize(purchases, 'EXISTING PURCHASE')} {purchases === 1 ? 'IS' : 'ARE'} KEPT:
          BUYERS OF {many ? 'THESE DATASETS' : 'THIS DATASET'} STILL SEE {many ? 'THEM' : 'IT'} UNDER
          MY PURCHASES AND CAN KEEP DOWNLOADING.
        </div>
      )}
      <div className="pc-label" style={{ marginTop: 20, marginBottom: 8 }}>
        {many ? 'DATASETS' : 'DATASET'}
      </div>
      <DatasetList files={files} />
    </ConfirmDialog>
  );
}
