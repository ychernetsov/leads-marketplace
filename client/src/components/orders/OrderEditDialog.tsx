import { FormEvent, useState } from 'react';
import type { PurchasedItem } from '../../types/order';
import { FormField } from '../FormField';
import { Modal } from '../Modal';

interface OrderEditDialogProps {
  item: PurchasedItem;
  busy: boolean;
  onClose: () => void;
  onSave: (values: { customTitle: string | null; customDescription: string | null }) => void;
}

/** Lets the buyer give a purchased item their own title and description. */
export function OrderEditDialog({ item, busy, onClose, onSave }: OrderEditDialogProps) {
  const [title, setTitle] = useState(item.title);
  const [description, setDescription] = useState(item.description);
  const [error, setError] = useState<string | null>(null);

  function submit(e: FormEvent) {
    e.preventDefault();
    const t = title.trim();
    if (!t) return setError('Title is required');
    setError(null);
    onSave({
      // Saving the original text clears the override, so the item follows
      // the dataset again if the seller renames it.
      customTitle: t === item.originalTitle ? null : t,
      customDescription:
        description.trim() === item.originalDescription ? null : description.trim(),
    });
  }

  function resetToOriginal() {
    setTitle(item.originalTitle);
    setDescription(item.originalDescription);
  }

  return (
    <Modal
      title="EDIT PURCHASE"
      onClose={onClose}
      footer={
        <>
          {item.isCustomized && (
            <button type="button" className="pc-nav-link" style={{ marginRight: 'auto' }} onClick={resetToOriginal}>
              RESET TO ORIGINAL
            </button>
          )}
          <button type="button" className="pc-pill pc-pill-outline" onClick={onClose} disabled={busy}>
            CANCEL
          </button>
          <button type="submit" form="order-edit-form" className="pc-pill pc-pill-accent" disabled={busy}>
            {busy ? 'SAVING…' : 'SAVE'}
          </button>
        </>
      }
    >
      <div className="pc-row-meta" style={{ marginTop: 0, marginBottom: 16, lineHeight: 1.6 }}>
        ONLY YOU SEE THESE CHANGES — THE DATASET ITSELF ISN'T MODIFIED.
      </div>
      <form id="order-edit-form" onSubmit={submit}>
        <FormField label="NAME" first>
          <input className="pc-input" value={title} onChange={(e) => setTitle(e.target.value)} autoFocus />
        </FormField>
        <FormField label="DESCRIPTION / NOTES">
          <textarea
            className="pc-input"
            rows={3}
            style={{ resize: 'vertical' }}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </FormField>
        {error && <div className="pc-field-error">{error}</div>}
      </form>
    </Modal>
  );
}
