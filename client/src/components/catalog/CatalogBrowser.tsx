import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useDownload } from '../../hooks/useDownload';
import { useMyOrders } from '../../hooks/useMyOrders';
import { api } from '../../lib/api';
import { useUiStore } from '../../store/uiStore';
import type { CatalogFile } from '../../types/file';
import { BuyButton } from './BuyButton';
import { CatalogRow } from './CatalogRow';
import { DownloadButton } from './DownloadButton';

/** The storefront list: sample links plus buy / download actions. */
export function CatalogBrowser({ files }: { files: CatalogFile[] }) {
  const { isLoggedIn, isAdmin } = useAuth();
  const navigate = useNavigate();
  const addToast = useUiStore((s) => s.addToast);
  const { download, downloadingId } = useDownload();

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
    <>
      {files.map((file) => (
        <CatalogRow key={file.id} file={file} actions={actionsFor(file)} />
      ))}
    </>
  );
}
