import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAdminFiles } from '../hooks/useAdminFiles';
import { useSelection } from '../hooks/useSelection';
import type { AdminFile } from '../types/file';
import { AccessGate } from '../components/AccessGate';
import { Header } from '../components/Header';
import { ListEmpty, ListError, ListSkeleton } from '../components/ListState';
import { DatasetBulkBar } from '../components/admin/DatasetBulkBar';
import { DatasetBulkEditDialog } from '../components/admin/DatasetBulkEditDialog';
import { DatasetDeleteDialog } from '../components/admin/DatasetDeleteDialog';
import { DatasetEditDialog } from '../components/admin/DatasetEditDialog';
import { DatasetRow } from '../components/admin/DatasetRow';

type Dialog =
  | { kind: 'edit'; file: AdminFile }
  | { kind: 'bulk-edit'; files: AdminFile[] }
  | { kind: 'delete'; files: AdminFile[] }
  | null;

export function AdminDatasetsPage() {
  return (
    <AccessGate admin purpose="manage datasets">
      <DatasetManager />
    </AccessGate>
  );
}

/** Admin list of every dataset with single + bulk edit/delete. */
function DatasetManager() {
  const navigate = useNavigate();
  const files = useAdminFiles();
  const selection = useSelection(files.data);
  const [dialog, setDialog] = useState<Dialog>(null);

  const busy = files.edit.isPending || files.bulkEdit.isPending || files.remove.isPending;
  const closeDialog = () => !busy && setDialog(null);
  const done = { onSuccess: () => setDialog(null) };

  return (
    <div className="pc-page">
      <Header active="datasets" />

      <DatasetBulkBar
        total={files.data?.length ?? 0}
        selectedCount={selection.selected.length}
        allSelected={selection.allSelected}
        onToggleAll={selection.toggleAll}
        onClear={selection.clear}
        onBulkEdit={() => setDialog({ kind: 'bulk-edit', files: selection.selected })}
        onBulkDelete={() => setDialog({ kind: 'delete', files: selection.selected })}
      />

      {files.isLoading && <ListSkeleton />}
      {files.isError && <ListError what="datasets" onRetry={() => files.refetch()} />}

      {files.data && files.data.length === 0 && (
        <ListEmpty
          title="NO DATASETS YET"
          hint="UPLOAD A CSV AND IT WILL SHOW UP HERE"
          action={
            <button className="pc-pill pc-pill-accent" onClick={() => navigate('/admin/upload')}>
              UPLOAD A DATASET
            </button>
          }
        />
      )}

      {files.data?.map((file) => (
        <DatasetRow
          key={file.id}
          file={file}
          selected={selection.isSelected(file.id)}
          onToggle={() => selection.toggle(file.id)}
          onEdit={() => setDialog({ kind: 'edit', file })}
          onDelete={() => setDialog({ kind: 'delete', files: [file] })}
        />
      ))}

      {dialog?.kind === 'edit' && (
        <DatasetEditDialog
          file={dialog.file}
          busy={files.edit.isPending}
          onClose={closeDialog}
          onSave={(values) => files.edit.mutate({ id: dialog.file.id, ...values }, done)}
        />
      )}

      {dialog?.kind === 'bulk-edit' && (
        <DatasetBulkEditDialog
          files={dialog.files}
          busy={files.bulkEdit.isPending}
          onClose={closeDialog}
          onSave={(values) =>
            files.bulkEdit.mutate({ ids: dialog.files.map((f) => f.id), ...values }, done)
          }
        />
      )}

      {dialog?.kind === 'delete' && (
        <DatasetDeleteDialog
          files={dialog.files}
          busy={files.remove.isPending}
          onClose={closeDialog}
          onConfirm={() =>
            files.remove.mutate(
              dialog.files.map((f) => f.id),
              {
                onSuccess: () => {
                  selection.clear();
                  setDialog(null);
                },
              },
            )
          }
        />
      )}
    </div>
  );
}

export default AdminDatasetsPage;
