import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import { useUiStore } from '../store/uiStore';
import type { PurchasedItem } from '../types/order';
import { queryKeys } from './queryKeys';

interface EditOrderInput {
  customTitle?: string | null;
  customDescription?: string | null;
}

/** The buyer's library: paid orders plus every mutation the buyer can make on them. */
export function useMyOrders(enabled = true) {
  const queryClient = useQueryClient();
  const addToast = useUiStore((s) => s.addToast);

  const query = useQuery({
    queryKey: queryKeys.myOrders,
    queryFn: () => api.get<PurchasedItem[]>('/orders/mine'),
    enabled,
  });

  function refresh() {
    queryClient.invalidateQueries({ queryKey: queryKeys.myOrders });
    queryClient.invalidateQueries({ queryKey: queryKeys.labels });
  }

  const onError = (err: Error) => addToast('error', err.message || 'Something went wrong');

  const edit = useMutation({
    mutationFn: ({ id, ...body }: EditOrderInput & { id: string }) =>
      api.patch<PurchasedItem>(`/orders/${id}`, body),
    onSuccess: (item) => {
      addToast('success', `Saved "${item.title}"`);
      refresh();
    },
    onError,
  });

  const setArchived = useMutation({
    mutationFn: ({ id, archived }: { id: string; archived: boolean }) =>
      api.patch<PurchasedItem>(`/orders/${id}`, { archived }),
    onSuccess: (item) => {
      addToast('success', item.archivedAt ? `Archived "${item.title}"` : `Restored "${item.title}"`);
      refresh();
    },
    onError,
  });

  const setLabels = useMutation({
    mutationFn: ({ id, labelIds }: { id: string; labelIds: string[] }) =>
      api.put<PurchasedItem>(`/orders/${id}/labels`, { labelIds }),
    onSuccess: refresh,
    onError,
  });

  const remove = useMutation({
    mutationFn: (id: string) => api.delete(`/orders/${id}`),
    onSuccess: () => {
      addToast('success', 'Removed from your purchases');
      refresh();
      // The catalog shows BUY again for items no longer owned.
      queryClient.invalidateQueries({ queryKey: queryKeys.catalog });
    },
    onError,
  });

  return { ...query, edit, setArchived, setLabels, remove };
}
