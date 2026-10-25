import { FormEvent, useState } from 'react';
import type { LabelWithCount, PurchasedItem } from '../../types/order';
import { labelColor } from '../../utilities/labels';
import { Modal } from '../Modal';

interface OrderLabelsDialogProps {
  item: PurchasedItem;
  labels: LabelWithCount[];
  busy: boolean;
  onClose: () => void;
  onSave: (labelIds: string[]) => void;
  onCreateLabel: (name: string) => Promise<{ id: string } | undefined>;
}

/** Attach/detach the buyer's labels to one purchased item, creating new ones inline. */
export function OrderLabelsDialog({
  item,
  labels,
  busy,
  onClose,
  onSave,
  onCreateLabel,
}: OrderLabelsDialogProps) {
  const [checked, setChecked] = useState<Set<string>>(new Set(item.labels.map((l) => l.id)));
  const [newName, setNewName] = useState('');
  const [creating, setCreating] = useState(false);

  function toggle(id: string) {
    setChecked((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function createLabel(e: FormEvent) {
    e.preventDefault();
    const name = newName.trim();
    if (!name) return;
    setCreating(true);
    try {
      const created = await onCreateLabel(name);
      if (created) {
        setChecked((prev) => new Set(prev).add(created.id));
        setNewName('');
      }
    } finally {
      setCreating(false);
    }
  }

  return (
    <Modal
      title={`LABELS — ${item.title.toUpperCase()}`}
      onClose={onClose}
      footer={
        <>
          <button type="button" className="pc-pill pc-pill-outline" onClick={onClose} disabled={busy}>
            CANCEL
          </button>
          <button
            type="button"
            className="pc-pill pc-pill-accent"
            disabled={busy}
            onClick={() => onSave([...checked])}
          >
            {busy ? 'SAVING…' : 'SAVE LABELS'}
          </button>
        </>
      }
    >
      {labels.length === 0 ? (
        <div className="pc-row-meta" style={{ marginTop: 0, marginBottom: 12 }}>
          YOU HAVE NO LABELS YET — CREATE ONE BELOW.
        </div>
      ) : (
        <ul style={{ listStyle: 'none', margin: '0 0 16px', padding: 0, maxHeight: 220, overflow: 'auto' }}>
          {labels.map((label) => (
            <li key={label.id}>
              <label className="pc-check-row">
                <input
                  type="checkbox"
                  className="pc-checkbox"
                  checked={checked.has(label.id)}
                  onChange={() => toggle(label.id)}
                />
                <span style={{ color: labelColor(label.name) }}>{label.name.toUpperCase()}</span>
              </label>
            </li>
          ))}
        </ul>
      )}

      <form onSubmit={createLabel} style={{ display: 'flex', gap: 8 }}>
        <input
          className="pc-input"
          placeholder="New label name"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          maxLength={40}
          aria-label="New label name"
        />
        <button type="submit" className="pc-pill pc-pill-outline" disabled={creating || !newName.trim()}>
          {creating ? 'ADDING…' : '+ ADD'}
        </button>
      </form>
    </Modal>
  );
}
