import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useDownload } from '../hooks/useDownload';
import { useLabels } from '../hooks/useLabels';
import { useMyOrders } from '../hooks/useMyOrders';
import type { PurchasedItem } from '../types/order';
import {
  DEFAULT_ORDER_FILTERS,
  filterOrders,
  sortOrders,
  type OrderFilters,
  type OrderSortKey,
} from '../utilities/orders';
import { pluralize } from '../utilities/format';
import { AccessGate } from '../components/AccessGate';
import { Header } from '../components/Header';
import { ListEmpty, ListError, ListSkeleton } from '../components/ListState';
import { DeleteOrderDialog } from '../components/orders/DeleteOrderDialog';
import { ManageLabelsDialog } from '../components/orders/ManageLabelsDialog';
import { OrderEditDialog } from '../components/orders/OrderEditDialog';
import { OrderLabelsDialog } from '../components/orders/OrderLabelsDialog';
import { OrderRow } from '../components/orders/OrderRow';
import { OrdersToolbar } from '../components/orders/OrdersToolbar';

type Dialog =
  | { kind: 'edit'; item: PurchasedItem }
  | { kind: 'labels'; item: PurchasedItem }
  | { kind: 'delete'; item: PurchasedItem }
  | { kind: 'manage-labels' }
  | null;

export function OrdersPage() {
  const navigate = useNavigate();
  const { isAdmin, isLoading: authLoading } = useAuth();

  // Admins have no purchases; send them to their own area instead.
  // (All hooks below still run unconditionally — see the early return at the end.)
  useEffect(() => {
    if (!authLoading && isAdmin) navigate('/admin/upload', { replace: true });
  }, [authLoading, isAdmin, navigate]);

  if (!authLoading && isAdmin) return null;

  return (
    <AccessGate purpose="see your purchases">
      <OrdersLibrary />
    </AccessGate>
  );
}

/** The buyer's library, rendered only for a logged-in regular user. */
function OrdersLibrary() {
  const orders = useMyOrders();
  const labels = useLabels();
  const { download, downloadingId } = useDownload();

  const [filters, setFilters] = useState<OrderFilters>(DEFAULT_ORDER_FILTERS);
  const [sort, setSort] = useState<OrderSortKey>('newest');
  const [dialog, setDialog] = useState<Dialog>(null);

  const items = orders.data ?? [];
  const visible = useMemo(() => sortOrders(filterOrders(items, filters), sort), [items, filters, sort]);
  const counts = useMemo(
    () => ({
      active: items.filter((i) => i.archivedAt === null).length,
      archived: items.filter((i) => i.archivedAt !== null).length,
    }),
    [items],
  );
  const isFiltered =
    filters.search.trim() !== '' || filters.labelIds.length > 0 || filters.view !== 'all';

  const busy =
    orders.edit.isPending ||
    orders.setLabels.isPending ||
    orders.remove.isPending ||
    labels.create.isPending ||
    labels.rename.isPending ||
    labels.remove.isPending;

  function closeDialog() {
    if (!busy) setDialog(null);
  }

  return (
    <div className="pc-page">
      <Header active="orders" />

      <div className="pc-subheader">
        {orders.data ? pluralize(items.length, 'FILE PURCHASED', 'FILES PURCHASED') : ''}
        {orders.data && visible.length !== items.length && ` · SHOWING ${visible.length}`}
      </div>

      {orders.data && items.length > 0 && (
        <OrdersToolbar
          filters={filters}
          sort={sort}
          labels={labels.data ?? []}
          counts={counts}
          onFiltersChange={setFilters}
          onSortChange={setSort}
          onManageLabels={() => setDialog({ kind: 'manage-labels' })}
        />
      )}

      {orders.isLoading && <ListSkeleton rows={2} />}
      {orders.isError && <ListError what="purchases" onRetry={() => orders.refetch()} />}

      {orders.data && items.length === 0 && (
        <ListEmpty
          title="NO PURCHASES YET"
          hint={
            <>
              BUY A DATASET AND IT
              <br />
              WILL SHOW UP HERE
            </>
          }
          action={
            <BrowseCatalogButton />
          }
        />
      )}

      {orders.data && items.length > 0 && visible.length === 0 && (
        <ListEmpty
          title="NOTHING MATCHES"
          hint={isFiltered ? 'TRY A DIFFERENT SEARCH, VIEW OR LABEL FILTER' : ''}
          action={
            <button
              className="pc-pill pc-pill-outline"
              onClick={() => setFilters({ ...DEFAULT_ORDER_FILTERS, view: 'all' })}
            >
              SHOW EVERYTHING
            </button>
          }
        />
      )}

      {visible.map((item) => (
        <OrderRow
          key={item.id}
          item={item}
          downloading={downloadingId === item.fileId}
          onDownload={() => download(item.fileId, item.title)}
          onEdit={() => setDialog({ kind: 'edit', item })}
          onLabels={() => setDialog({ kind: 'labels', item })}
          onToggleArchive={() =>
            orders.setArchived.mutate({ id: item.id, archived: item.archivedAt === null })
          }
          onDelete={() => setDialog({ kind: 'delete', item })}
        />
      ))}

      {dialog?.kind === 'edit' && (
        <OrderEditDialog
          item={dialog.item}
          busy={orders.edit.isPending}
          onClose={closeDialog}
          onSave={(values) =>
            orders.edit.mutate({ id: dialog.item.id, ...values }, { onSuccess: () => setDialog(null) })
          }
        />
      )}

      {dialog?.kind === 'labels' && (
        <OrderLabelsDialog
          item={dialog.item}
          labels={labels.data ?? []}
          busy={orders.setLabels.isPending}
          onClose={closeDialog}
          onSave={(labelIds) =>
            orders.setLabels.mutate(
              { id: dialog.item.id, labelIds },
              { onSuccess: () => setDialog(null) },
            )
          }
          onCreateLabel={(name) => labels.create.mutateAsync(name).catch(() => undefined)}
        />
      )}

      {dialog?.kind === 'delete' && (
        <DeleteOrderDialog
          item={dialog.item}
          busy={orders.remove.isPending}
          onClose={closeDialog}
          onConfirm={() => orders.remove.mutate(dialog.item.id, { onSuccess: () => setDialog(null) })}
        />
      )}

      {dialog?.kind === 'manage-labels' && (
        <ManageLabelsDialog
          labels={labels.data ?? []}
          busy={busy}
          onClose={closeDialog}
          onCreate={(name) => labels.create.mutate(name)}
          onRename={(id, name) => labels.rename.mutate({ id, name })}
          onDelete={(id) => {
            labels.remove.mutate(id);
            setFilters((f) => ({ ...f, labelIds: f.labelIds.filter((x) => x !== id) }));
          }}
        />
      )}
    </div>
  );
}

function BrowseCatalogButton() {
  const navigate = useNavigate();
  return (
    <button className="pc-pill pc-pill-accent" onClick={() => navigate('/')}>
      BROWSE CATALOG
    </button>
  );
}
