import { FormEvent, useState } from 'react';
import type { DatasetBulkEditInput } from '../../hooks/useAdminFiles';
import type { AdminFile } from '../../types/file';
import { dollarsToCents } from '../../utilities/price';
import { FormField } from '../FormField';
import { Modal } from '../Modal';
import { DatasetList } from './DatasetList';

interface DatasetBulkEditDialogProps {
  files: AdminFile[];
  busy: boolean;
  onClose: () => void;
  onSave: (values: DatasetBulkEditInput) => void;
}

export function DatasetBulkEditDialog({ files, busy, onClose, onSave }: DatasetBulkEditDialogProps) {
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [error, setError] = useState<string | null>(null);

  function submit(e: FormEvent) {
    e.preventDefault();
    const values: DatasetBulkEditInput = {};
    if (description.trim()) values.description = description.trim();
    if (price.trim()) {
      const cents = dollarsToCents(price);
      if (cents === null) return setError('Enter a valid price, e.g. 4.00');
      values.priceCents = cents;
    }
    if (!values.description && values.priceCents === undefined) {
      return setError('Fill in at least one field to apply to the selected datasets');
    }
    setError(null);
    onSave(values);
  }

  return (
    <Modal
      title={`EDIT ${files.length} DATASET${files.length === 1 ? '' : 'S'}`}
      onClose={onClose}
      footer={
        <>
          <button type="button" className="pc-pill pc-pill-outline" onClick={onClose} disabled={busy}>
            CANCEL
          </button>
          <button type="submit" form="bulk-edit-form" className="pc-pill pc-pill-accent" disabled={busy}>
            {busy ? 'SAVING…' : `APPLY TO ${files.length}`}
          </button>
        </>
      }
    >
      <div className="pc-row-meta" style={{ marginTop: 0, marginBottom: 16, lineHeight: 1.6 }}>
        FIELDS LEFT BLANK ARE KEPT AS-IS. TITLES CAN ONLY BE EDITED ONE DATASET AT A TIME.
      </div>
      <form id="bulk-edit-form" onSubmit={submit}>
        <FormField label="NEW PRICE (USD)" first>
          <input
            className="pc-input"
            inputMode="decimal"
            placeholder="Keep current prices"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            autoFocus
          />
        </FormField>
        <FormField label="NEW DESCRIPTION">
          <textarea
            className="pc-input"
            rows={3}
            style={{ resize: 'vertical' }}
            placeholder="Keep current descriptions"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </FormField>
        {error && <div className="pc-field-error">{error}</div>}
      </form>
      <div className="pc-label" style={{ marginTop: 20, marginBottom: 8 }}>
        APPLIES TO
      </div>
      <DatasetList files={files} />
    </Modal>
  );
}
