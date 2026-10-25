import { FormEvent, useState } from 'react';
import type { LabelWithCount } from '../../types/order';
import { pluralize } from '../../utilities/format';
import { labelColor } from '../../utilities/labels';
import { Modal } from '../Modal';

interface ManageLabelsDialogProps {
  labels: LabelWithCount[];
  busy: boolean;
  onClose: () => void;
  onCreate: (name: string) => void;
  onRename: (id: string, name: string) => void;
  onDelete: (id: string) => void;
}

/** Create / rename / delete the buyer's labels. */
export function ManageLabelsDialog({
  labels,
  busy,
  onClose,
  onCreate,
  onRename,
  onDelete,
}: ManageLabelsDialogProps) {
  const [newName, setNewName] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');

  function create(e: FormEvent) {
    e.preventDefault();
    if (!newName.trim()) return;
    onCreate(newName.trim());
    setNewName('');
  }

  function commitRename(e: FormEvent) {
    e.preventDefault();
    if (editingId && editingName.trim()) onRename(editingId, editingName.trim());
    setEditingId(null);
  }

  return (
    <Modal
      title="MANAGE LABELS"
      onClose={onClose}
      footer={
        <button type="button" className="pc-pill pc-pill-outline" onClick={onClose}>
          DONE
        </button>
      }
    >
      <form onSubmit={create} style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        <input
          className="pc-input"
          placeholder="New label name"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          maxLength={40}
          autoFocus
          aria-label="New label name"
        />
        <button type="submit" className="pc-pill pc-pill-accent" disabled={busy || !newName.trim()}>
          + ADD
        </button>
      </form>

      {labels.length === 0 && (
        <div className="pc-row-meta" style={{ marginTop: 0 }}>
          NO LABELS YET.
        </div>
      )}

      <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
        {labels.map((label) => (
          <li key={label.id} className="pc-check-row" style={{ justifyContent: 'space-between' }}>
            {editingId === label.id ? (
              <form onSubmit={commitRename} style={{ display: 'flex', gap: 8, flex: 1 }}>
                <input
                  className="pc-input"
                  value={editingName}
                  onChange={(e) => setEditingName(e.target.value)}
                  maxLength={40}
                  autoFocus
                  aria-label="Label name"
                />
                <button type="submit" className="pc-pill pc-pill-accent" disabled={busy}>
                  SAVE
                </button>
                <button type="button" className="pc-pill pc-pill-outline" onClick={() => setEditingId(null)}>
                  CANCEL
                </button>
              </form>
            ) : (
              <>
                <span>
                  <span style={{ color: labelColor(label.name) }}>{label.name.toUpperCase()}</span>
                  <span className="pc-row-meta" style={{ display: 'inline', marginLeft: 8 }}>
                    {pluralize(label.orderCount, 'ITEM')}
                  </span>
                </span>
                <span style={{ display: 'flex', gap: 6 }}>
                  <button
                    type="button"
                    className="pc-pill pc-pill-outline"
                    onClick={() => {
                      setEditingId(label.id);
                      setEditingName(label.name);
                    }}
                  >
                    RENAME
                  </button>
                  <button
                    type="button"
                    className="pc-pill pc-pill-danger"
                    disabled={busy}
                    onClick={() => onDelete(label.id)}
                  >
                    DELETE
                  </button>
                </span>
              </>
            )}
          </li>
        ))}
      </ul>
    </Modal>
  );
}
