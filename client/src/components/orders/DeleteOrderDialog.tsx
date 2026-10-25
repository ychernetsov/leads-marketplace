import type { PurchasedItem } from '../../types/order';
import { ConfirmDialog } from '../ConfirmDialog';

interface DeleteOrderDialogProps {
  item: PurchasedItem;
  busy: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export function DeleteOrderDialog({ item, busy, onClose, onConfirm }: DeleteOrderDialogProps) {
  return (
    <ConfirmDialog title="REMOVE FROM PURCHASES" confirmLabel="REMOVE" danger busy={busy} onClose={onClose} onConfirm={onConfirm}>
      <div className="pc-row-meta" style={{ marginTop: 0, lineHeight: 1.6 }}>
        "{item.title.toUpperCase()}" WILL DISAPPEAR FROM YOUR PURCHASES AND YOU WON'T BE ABLE TO
        DOWNLOAD IT ANYMORE. {item.fileRemoved ? 'THE SELLER HAS REMOVED THIS DATASET, SO IT CANNOT BE BOUGHT AGAIN.' : 'TO GET IT BACK YOU WOULD HAVE TO BUY IT AGAIN.'}
        {item.archivedAt === null && ' IF YOU JUST WANT IT OUT OF THE WAY, ARCHIVE IT INSTEAD.'}
      </div>
    </ConfirmDialog>
  );
}
