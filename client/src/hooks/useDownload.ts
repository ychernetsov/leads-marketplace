import { useState } from 'react';
import { api, ApiError } from '../lib/api';
import { triggerFileDownload } from '../lib/download';
import { useUiStore } from '../store/uiStore';

/** Downloads a purchased dataset, tracking which file is in flight. */
export function useDownload() {
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const addToast = useUiStore((s) => s.addToast);

  async function download(fileId: string, filename: string) {
    setDownloadingId(fileId);
    try {
      const { url } = await api.get<{ url: string }>(`/files/${fileId}/download-url`);
      await triggerFileDownload(url, `${filename}.csv`);
      addToast('success', 'Download started');
    } catch (err) {
      if (err instanceof ApiError && err.status === 409) {
        addToast('error', 'Payment still processing — try again shortly');
      } else if (err instanceof ApiError && err.status === 403) {
        addToast('error', 'No valid purchase found for this file');
      } else {
        addToast('error', err instanceof Error ? err.message : 'Download failed');
      }
    } finally {
      setDownloadingId(null);
    }
  }

  return { download, downloadingId };
}
