import { FormEvent, useState } from 'react';
import type { DatasetEditInput } from '../../hooks/useDatasetMutations';
import type { AdminFile } from '../../types/file';
import { centsToDollars, dollarsToCents } from '../../utilities/price';
import { FormField } from '../FormField';
import { Modal } from '../Modal';

interface DatasetEditDialogProps {
  file: AdminFile;
  busy: boolean;
  onClose: () => void;
  onSave: (values: DatasetEditInput) => void;
}

export function DatasetEditDialog({ file, busy, onClose, onSave }: DatasetEditDialogProps) {
  const [title, setTitle] = useState(file.title);
  const [description, setDescription] = useState(file.description);
  const [price, setPrice] = useState(centsToDollars(file.priceCents));
  const [error, setError] = useState<string | null>(null);

  function submit(e: FormEvent) {
    e.preventDefault();
    const priceCents = dollarsToCents(price);
    if (!title.trim()) return setError('Title is required');
    if (!description.trim()) return setError('Description is required');
    if (priceCents === null) return setError('Enter a valid price, e.g. 4.00');
    setError(null);
    onSave({ title: title.trim(), description: description.trim(), priceCents });
  }

  return (
    <Modal
      title="EDIT DATASET"
      onClose={onClose}
      footer={
        <>
          <button type="button" className="pc-pill pc-pill-outline" onClick={onClose} disabled={busy}>
            CANCEL
          </button>
          <button type="submit" form="edit-dataset-form" className="pc-pill pc-pill-accent" disabled={busy}>
            {busy ? 'SAVING…' : 'SAVE CHANGES'}
          </button>
        </>
      }
    >
      <form id="edit-dataset-form" onSubmit={submit}>
        <FormField label="TITLE" first>
          <input className="pc-input" value={title} onChange={(e) => setTitle(e.target.value)} autoFocus />
        </FormField>
        <FormField label="DESCRIPTION">
          <textarea
            className="pc-input"
            rows={3}
            style={{ resize: 'vertical' }}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </FormField>
        <FormField label="PRICE (USD)">
          <input className="pc-input" inputMode="decimal" value={price} onChange={(e) => setPrice(e.target.value)} />
        </FormField>
        {error && <div className="pc-field-error">{error}</div>}
      </form>
    </Modal>
  );
}
