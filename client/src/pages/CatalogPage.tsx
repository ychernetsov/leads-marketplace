import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../hooks/useAuth';
import { useDownload } from '../hooks/useDownload';
import { useMyOrders } from '../hooks/useMyOrders';
import { queryKeys } from '../hooks/queryKeys';
import { api } from '../lib/api';
import { useUiStore } from '../store/uiStore';
import type { CatalogFile } from '../types/file';
import { Header } from '../components/Header';
import { ListError, ListSkeleton } from '../components/ListState';
import { BuyButton } from '../components/catalog/BuyButton';
import { CatalogRow } from '../components/catalog/CatalogRow';
import { DownloadButton } from '../components/catalog/DownloadButton';

const CatalogPage = () => {
  const { isLoggedIn, isAdmin } = useAuth();
  const navigate = useNavigate();
  const addToast = useUiStore((s) => s.addToast);
  const { download, downloadingId } = useDownload();

  const {
    data: files,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: queryKeys.catalog,
    queryFn: () => api.get<CatalogFile[]>('/files'),
    retry: false,
  });

  // Buyers see DOWNLOAD instead of BUY for datasets they already own.
  const myOrders = useMyOrders(isLoggedIn && !isAdmin);
  const ownedFileIds = useMemo(
    () => new Set((myOrders.data ?? []).map((o) => o.fileId)),
    [myOrders.data],
  );

  async function handleBuy(fileId: string) {
    if (!isLoggedIn) {
      navigate('/login');
      return;
    }
    try {
      const { checkoutUrl } = await api.post<{ checkoutUrl: string }>(`/files/${fileId}/checkout`);
      window.location.href = checkoutUrl;
    } catch (err) {
      addToast('error', err instanceof Error ? err.message : 'Could not start checkout');
    }
  }

  function actionsFor(file: CatalogFile) {
    if (isAdmin) return null;
    if (ownedFileIds.has(file.id)) {
      return (
        <DownloadButton
          downloading={downloadingId === file.id}
          onDownload={() => download(file.id, file.title)}
        />
      );
    }
    return <BuyButton priceCents={file.priceCents} onBuy={() => handleBuy(file.id)} />;
  }

  return (
    <div className="pc-page">
      <Header active="catalog" />

      <div className="pc-subheader">
        {files ? `${files.length} DATASETS` : ''} · SAMPLE FREE · $4.00 TO UNLOCK THE FULL FILE
      </div>

      {isLoading && <ListSkeleton rows={20} />}
      {isError && <ListError what="datasets" onRetry={() => refetch()} />}

      {files?.map((file) => (
        <CatalogRow key={file.id} file={file} actions={actionsFor(file)} />
      ))}

      <div className="pc-footer">FILES HOSTED ON CLOUDFLARE R2 · PAYMENTS VIA STRIPE</div>
    </div>
  );
};

export default CatalogPage;
