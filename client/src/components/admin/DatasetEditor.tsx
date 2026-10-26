import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDatasetMutations } from '../../hooks/useDatasetMutations';
import { useSelection } from '../../hooks/useSelection';
import type { AdminFile } from '../../types/file';
import { ListEmpty } from '../ListState';
import { DatasetBulkBar } from './DatasetBulkBar';
import { DatasetBulkEditDialog } from './DatasetBulkEditDialog';
import { DatasetDeleteDialog } from './DatasetDeleteDialog';
import { DatasetEditDialog } from './DatasetEditDialog';
import { DatasetRow } from './DatasetRow';

type Dialog =
  | { kind: 'edit'; file: AdminFile }
  | { kind: 'bulk-edit'; files: AdminFile[] }
  | { kind: 'delete'; files: AdminFile[] }
  | null;

/** The catalog in admin edit mode: selectable rows with single + bulk edit/delete. */
export function DatasetEditor({ files }: { files: AdminFile[] }) {
  const navigate = useNavigate();
  const mutations = useDatasetMutations();
  const selection = useSelection(files);
  const [dialog, setDialog] = useState<Dialog>(null);

  const closeDialog = () => !mutations.isPending && setDialog(null);
  const done = { onSuccess: () => setDialog(null) };

  return (
    <>
      <DatasetBulkBar
        total={files.length}
        selectedCount={selection.selected.length}
        allSelected={selection.allSelected}
        onToggleAll={selection.toggleAll}
        onClear={selection.clear}
        onBulkEdit={() => setDialog({ kind: 'bulk-edit', files: selection.selected })}
        onBulkDelete={() => setDialog({ kind: 'delete', files: selection.selected })}
      />

      {files.length === 0 && (
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

      {files.map((file) => (
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
          busy={mutations.edit.isPending}
          onClose={closeDialog}
          onSave={(values) => mutations.edit.mutate({ id: dialog.file.id, ...values }, done)}
        />
      )}

      {dialog?.kind === 'bulk-edit' && (
        <DatasetBulkEditDialog
          files={dialog.files}
          busy={mutations.bulkEdit.isPending}
          onClose={closeDialog}
          onSave={(values) =>
            mutations.bulkEdit.mutate({ ids: dialog.files.map((f) => f.id), ...values }, done)
          }
        />
      )}

      {dialog?.kind === 'delete' && (
        <DatasetDeleteDialog
          files={dialog.files}
          busy={mutations.remove.isPending}
          onClose={closeDialog}
          onConfirm={() =>
            mutations.remove.mutate(
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
    </>
  );
}
