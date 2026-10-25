import { FormEvent, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../hooks/useAuth';
import { api } from '../lib/api';
import { useUiStore } from '../store/uiStore';
import { Header } from '../components/Header';
import { Modal } from '../components/Modal';

export interface AdminFile {
  id: string;
  title: string;
  description: string;
  priceCents: number;
  currency: string;
  numRows: number | null;
  sizeBytes: number | null;
  originalFilename: string | null;
  sampleUrl: string | null;
  status: 'uploading' | 'processing' | 'ready' | 'failed';
  createdAt: string;
  orderCount: number;
}

type Dialog =
  | { kind: 'edit'; file: AdminFile }
  | { kind: 'bulk-edit'; files: AdminFile[] }
  | { kind: 'delete'; files: AdminFile[] }
  | null;

const ADMIN_FILES_KEY = ['admin', 'files'] as const;

function dollarsToCents(value: string): number | null {
  const trimmed = value.trim();
  if (!/^\d+(\.\d{1,2})?$/.test(trimmed)) return null;
  const cents = Math.round(parseFloat(trimmed) * 100);
  return cents > 0 ? cents : null;
}

function formatPrice(cents: number) {
  return `$${(cents / 100).toFixed(2)}`;
}

function formatDate(iso: string) {
  return new Date(iso)
    .toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    .toUpperCase();
}

export function AdminDatasetsPage() {
  const navigate = useNavigate();
  const { isLoggedIn, isAdmin, isLoading: authLoading } = useAuth();
  const queryClient = useQueryClient();
  const addToast = useUiStore((s) => s.addToast);

  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [dialog, setDialog] = useState<Dialog>(null);

  const {
    data: files,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ADMIN_FILES_KEY,
    queryFn: () => api.get<AdminFile[]>('/files/admin/list'),
    enabled: !authLoading && isLoggedIn && isAdmin,
  });

  // Keep the selection honest if files disappear (deleted elsewhere / refetch).
  const selectedFiles = useMemo(
    () => (files ?? []).filter((f) => selected.has(f.id)),
    [files, selected],
  );
  const allSelected = !!files && files.length > 0 && selectedFiles.length === files.length;

  function invalidate() {
    queryClient.invalidateQueries({ queryKey: ADMIN_FILES_KEY });
    // The public catalog shows title/price too.
    queryClient.invalidateQueries({ queryKey: ['files'] });
  }

  const editMutation = useMutation({
    mutationFn: (vars: { id: string; title: string; description: string; priceCents: number }) =>
      api.patch<AdminFile>(`/files/${vars.id}`, {
        title: vars.title,
        description: vars.description,
        priceCents: vars.priceCents,
      }),
    onSuccess: (updated) => {
      addToast('success', `Saved "${updated.title}"`);
      invalidate();
      setDialog(null);
    },
    onError: (err: Error) => addToast('error', err.message || 'Could not save changes'),
  });

  const bulkEditMutation = useMutation({
    mutationFn: (vars: { ids: string[]; description?: string; priceCents?: number }) =>
      api.patch<{ updated: number }>('/files/bulk', vars),
    onSuccess: ({ updated }) => {
      addToast('success', `Updated ${updated} dataset${updated === 1 ? '' : 's'}`);
      invalidate();
      setDialog(null);
    },
    onError: (err: Error) => addToast('error', err.message || 'Bulk edit failed'),
  });

  const deleteMutation = useMutation({
    mutationFn: async (ids: string[]) => {
      if (ids.length === 1) {
        await api.delete(`/files/${ids[0]}`);
        return { deleted: 1 };
      }
      return api.post<{ deleted: number }>('/files/bulk-delete', { ids });
    },
    onSuccess: ({ deleted }, ids) => {
      addToast('success', `Deleted ${deleted} dataset${deleted === 1 ? '' : 's'}`);
      setSelected((prev) => {
        const next = new Set(prev);
        ids.forEach((id) => next.delete(id));
        return next;
      });
      invalidate();
      setDialog(null);
    },
    onError: (err: Error) => addToast('error', err.message || 'Delete failed'),
  });

  const busy = editMutation.isPending || bulkEditMutation.isPending || deleteMutation.isPending;

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleAll() {
    if (!files) return;
    setSelected(allSelected ? new Set() : new Set(files.map((f) => f.id)));
  }

  if (authLoading) return null;
  if (!isLoggedIn || !isAdmin) {
    return (
      <div className="pc-page">
        <Header />
        <div className="pc-error-state">
          <div className="pc-row-title">ADMIN ACCESS REQUIRED</div>
          <div className="pc-row-meta" style={{ marginTop: 8 }}>
            {isLoggedIn
              ? "YOU'RE SIGNED IN, BUT THIS ACCOUNT ISN'T AN ADMIN."
              : 'LOG IN WITH AN ADMIN ACCOUNT TO MANAGE DATASETS.'}
          </div>
          <button
            className="pc-pill pc-pill-accent"
            style={{ marginTop: 20 }}
            onClick={() => navigate(isLoggedIn ? '/' : '/login')}
          >
            {isLoggedIn ? 'BACK TO CATALOG' : 'GO TO LOGIN'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="pc-page">
      <Header active="datasets" />

      <div
        className="pc-subheader"
        style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}
      >
        <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
          <input
            type="checkbox"
            className="pc-checkbox"
            checked={allSelected}
            disabled={!files || files.length === 0}
            onChange={toggleAll}
            aria-label="Select all datasets"
          />
          {files ? `${files.length} DATASETS` : ''}
          {selectedFiles.length > 0 && ` · ${selectedFiles.length} SELECTED`}
        </label>

        <div className="pc-bulk-bar">
          {selectedFiles.length > 0 ? (
            <>
              <button
                className="pc-pill pc-pill-outline"
                onClick={() => setDialog({ kind: 'bulk-edit', files: selectedFiles })}
              >
                EDIT SELECTED
              </button>
              <button
                className="pc-pill pc-pill-danger"
                onClick={() => setDialog({ kind: 'delete', files: selectedFiles })}
              >
                DELETE SELECTED
              </button>
              <button className="pc-nav-link" onClick={() => setSelected(new Set())}>
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

      {isLoading && (
        <div style={{ padding: 20 }}>
          {[1, 2, 3].map((i) => (
            <div key={i} className="pc-skeleton" />
          ))}
        </div>
      )}

      {isError && (
        <div className="pc-error-state">
          <div className="pc-row-title">COULDN'T LOAD DATASETS</div>
          <div className="pc-row-meta">CHECK YOUR CONNECTION AND TRY AGAIN</div>
          <button className="pc-pill pc-pill-outline" style={{ marginTop: 16 }} onClick={() => refetch()}>
            RELOAD
          </button>
        </div>
      )}

      {files && files.length === 0 && (
        <div className="pc-empty-state">
          <div className="pc-row-title">NO DATASETS YET</div>
          <div className="pc-row-meta">UPLOAD A CSV AND IT WILL SHOW UP HERE</div>
          <button
            className="pc-pill pc-pill-accent"
            style={{ marginTop: 16 }}
            onClick={() => navigate('/admin/upload')}
          >
            UPLOAD A DATASET
          </button>
        </div>
      )}

      {files &&
        files.map((file) => {
          const isSelected = selected.has(file.id);
          return (
            <div key={file.id} className={`pc-row${isSelected ? ' selected' : ''}`}>
              <input
                type="checkbox"
                className="pc-checkbox"
                checked={isSelected}
                onChange={() => toggle(file.id)}
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
                  {` · ${file.orderCount} PURCHASE${file.orderCount === 1 ? '' : 'S'}`}
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
              <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                <button
                  className="pc-pill pc-pill-outline"
                  onClick={() => setDialog({ kind: 'edit', file })}
                >
                  EDIT
                </button>
                <button
                  className="pc-pill pc-pill-danger"
                  onClick={() => setDialog({ kind: 'delete', files: [file] })}
                >
                  DELETE
                </button>
              </div>
            </div>
          );
        })}

      {dialog?.kind === 'edit' && (
        <EditDialog
          file={dialog.file}
          busy={editMutation.isPending}
          onClose={() => !busy && setDialog(null)}
          onSave={(values) => editMutation.mutate({ id: dialog.file.id, ...values })}
        />
      )}

      {dialog?.kind === 'bulk-edit' && (
        <BulkEditDialog
          files={dialog.files}
          busy={bulkEditMutation.isPending}
          onClose={() => !busy && setDialog(null)}
          onSave={(values) =>
            bulkEditMutation.mutate({ ids: dialog.files.map((f) => f.id), ...values })
          }
        />
      )}

      {dialog?.kind === 'delete' && (
        <DeleteDialog
          files={dialog.files}
          busy={deleteMutation.isPending}
          onClose={() => !busy && setDialog(null)}
          onConfirm={() => deleteMutation.mutate(dialog.files.map((f) => f.id))}
        />
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Dialogs
// ---------------------------------------------------------------------------

function EditDialog({
  file,
  busy,
  onClose,
  onSave,
}: {
  file: AdminFile;
  busy: boolean;
  onClose: () => void;
  onSave: (values: { title: string; description: string; priceCents: number }) => void;
}) {
  const [title, setTitle] = useState(file.title);
  const [description, setDescription] = useState(file.description);
  const [price, setPrice] = useState((file.priceCents / 100).toFixed(2));
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
      title={`EDIT DATASET`}
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
        <div className="pc-label">TITLE</div>
        <input className="pc-input" value={title} onChange={(e) => setTitle(e.target.value)} autoFocus />

        <div className="pc-label" style={{ marginTop: 16 }}>
          DESCRIPTION
        </div>
        <textarea
          className="pc-input"
          rows={3}
          style={{ resize: 'vertical' }}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />

        <div className="pc-label" style={{ marginTop: 16 }}>
          PRICE (USD)
        </div>
        <input className="pc-input" inputMode="decimal" value={price} onChange={(e) => setPrice(e.target.value)} />

        {error && <div className="pc-field-error">{error}</div>}
      </form>
    </Modal>
  );
}

function BulkEditDialog({
  files,
  busy,
  onClose,
  onSave,
}: {
  files: AdminFile[];
  busy: boolean;
  onClose: () => void;
  onSave: (values: { description?: string; priceCents?: number }) => void;
}) {
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [error, setError] = useState<string | null>(null);

  function submit(e: FormEvent) {
    e.preventDefault();
    const values: { description?: string; priceCents?: number } = {};
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
        <div className="pc-label">NEW PRICE (USD)</div>
        <input
          className="pc-input"
          inputMode="decimal"
          placeholder="Keep current prices"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          autoFocus
        />

        <div className="pc-label" style={{ marginTop: 16 }}>
          NEW DESCRIPTION
        </div>
        <textarea
          className="pc-input"
          rows={3}
          style={{ resize: 'vertical' }}
          placeholder="Keep current descriptions"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />

        {error && <div className="pc-field-error">{error}</div>}
      </form>

      <div className="pc-label" style={{ marginTop: 20, marginBottom: 8 }}>
        APPLIES TO
      </div>
      <SelectedList files={files} />
    </Modal>
  );
}

function DeleteDialog({
  files,
  busy,
  onClose,
  onConfirm,
}: {
  files: AdminFile[];
  busy: boolean;
  onClose: () => void;
  onConfirm: () => void;
}) {
  const purchases = files.reduce((sum, f) => sum + f.orderCount, 0);
  const many = files.length > 1;

  return (
    <Modal
      title={many ? `DELETE ${files.length} DATASETS` : 'DELETE DATASET'}
      onClose={onClose}
      footer={
        <>
          <button type="button" className="pc-pill pc-pill-outline" onClick={onClose} disabled={busy}>
            CANCEL
          </button>
          <button
            type="button"
            className="pc-pill pc-pill-danger-solid"
            onClick={onConfirm}
            disabled={busy}
            autoFocus
          >
            {busy ? 'DELETING…' : many ? `DELETE ${files.length}` : 'DELETE'}
          </button>
        </>
      }
    >
      <div className="pc-row-meta" style={{ marginTop: 0, lineHeight: 1.6 }}>
        THIS PERMANENTLY REMOVES {many ? 'THESE DATASETS' : 'THIS DATASET'} AND{' '}
        {many ? 'THEIR' : 'ITS'} FILES FROM THE CATALOG. THIS CANNOT BE UNDONE.
      </div>
      {purchases > 0 && (
        <div className="pc-row-meta" style={{ color: 'var(--pc-error)', marginTop: 10, lineHeight: 1.6 }}>
          ⚠ {purchases} PURCHASE{purchases === 1 ? '' : 'S'} OF{' '}
          {many ? 'THESE DATASETS' : 'THIS DATASET'} WILL ALSO BE REMOVED — BUYERS WILL NO LONGER BE
          ABLE TO RE-DOWNLOAD.
        </div>
      )}
      <div className="pc-label" style={{ marginTop: 20, marginBottom: 8 }}>
        {many ? 'DATASETS' : 'DATASET'}
      </div>
      <SelectedList files={files} />
    </Modal>
  );
}

function SelectedList({ files }: { files: AdminFile[] }) {
  return (
    <ul style={{ margin: 0, padding: 0, listStyle: 'none', maxHeight: 160, overflow: 'auto' }}>
      {files.map((f) => (
        <li key={f.id} className="pc-row-meta" style={{ marginTop: 4 }}>
          · {f.title.toUpperCase()} ({formatPrice(f.priceCents)}
          {f.orderCount > 0 ? `, ${f.orderCount} PURCHASE${f.orderCount === 1 ? '' : 'S'}` : ''})
        </li>
      ))}
    </ul>
  );
}

export default AdminDatasetsPage;
