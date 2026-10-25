import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import { useUiStore } from '../store/uiStore';
import type { LabelWithCount } from '../types/order';
import { queryKeys } from './queryKeys';

/** The buyer's own labels, with create / rename / delete. */
export function useLabels(enabled = true) {
  const queryClient = useQueryClient();
  const addToast = useUiStore((s) => s.addToast);

  const query = useQuery({
    queryKey: queryKeys.labels,
    queryFn: () => api.get<LabelWithCount[]>('/labels'),
    enabled,
  });

  function refresh() {
    queryClient.invalidateQueries({ queryKey: queryKeys.labels });
    queryClient.invalidateQueries({ queryKey: queryKeys.myOrders });
  }

  const onError = (err: Error) => addToast('error', err.message || 'Something went wrong');

  const create = useMutation({
    mutationFn: (name: string) => api.post<LabelWithCount>('/labels', { name }),
    onSuccess: refresh,
    onError,
  });

  const rename = useMutation({
    mutationFn: ({ id, name }: { id: string; name: string }) =>
      api.patch<LabelWithCount>(`/labels/${id}`, { name }),
    onSuccess: refresh,
    onError,
  });

  const remove = useMutation({
    mutationFn: (id: string) => api.delete(`/labels/${id}`),
    onSuccess: refresh,
    onError,
  });

  return { ...query, create, rename, remove };
}
