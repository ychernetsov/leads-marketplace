import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import { useUiStore } from '../store/uiStore';
import type { AdminFile } from '../types/file';
import { pluralize } from '../utilities/format';
import { queryKeys } from './queryKeys';

export interface DatasetEditInput {
  title: string;
  description: string;
  priceCents: number;
}

export interface DatasetBulkEditInput {
  description?: string;
  priceCents?: number;
}

/** Admin view of every dataset plus edit / bulk edit / delete mutations. */
export function useAdminFiles(enabled = true) {
  const queryClient = useQueryClient();
  const addToast = useUiStore((s) => s.addToast);

  const query = useQuery({
    queryKey: queryKeys.adminFiles,
    queryFn: () => api.get<AdminFile[]>('/files/admin/list'),
    enabled,
  });

  function refresh() {
    queryClient.invalidateQueries({ queryKey: queryKeys.adminFiles });
    queryClient.invalidateQueries({ queryKey: queryKeys.catalog });
  }

  const onError = (err: Error) => addToast('error', err.message || 'Something went wrong');

  const edit = useMutation({
    mutationFn: ({ id, ...body }: DatasetEditInput & { id: string }) =>
      api.patch<AdminFile>(`/files/${id}`, body),
    onSuccess: (updated) => {
      addToast('success', `Saved "${updated.title}"`);
      refresh();
    },
    onError,
  });

  const bulkEdit = useMutation({
    mutationFn: ({ ids, ...body }: DatasetBulkEditInput & { ids: string[] }) =>
      api.patch<{ updated: number }>('/files/bulk', { ids, ...body }),
    onSuccess: ({ updated }) => {
      addToast('success', `Updated ${pluralize(updated, 'dataset')}`);
      refresh();
    },
    onError,
  });

  const remove = useMutation({
    mutationFn: async (ids: string[]) => {
      if (ids.length === 1) {
        await api.delete(`/files/${ids[0]}`);
        return { deleted: 1 };
      }
      return api.post<{ deleted: number }>('/files/bulk-delete', { ids });
    },
    onSuccess: ({ deleted }) => {
      addToast('success', `Deleted ${pluralize(deleted, 'dataset')}`);
      refresh();
    },
    onError,
  });

  return { ...query, edit, bulkEdit, remove };
}
