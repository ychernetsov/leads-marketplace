import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { api, ApiError } from '../lib/api';
import { useUiStore } from '../store/uiStore';

interface Order {
  id: string;
  fileId: string;
  fileTitle: string;
  paidAt: string;
}

export function OrdersPage() {
  const navigate = useNavigate();
  const addToast = useUiStore((s) => s.addToast);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  const {
    data: orders,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ['orders', 'mine'],
    queryFn: () => api.get<Order[]>('/files/orders/mine'),
  });

  async function handleDownloadAgain(order: Order) {
    setDownloadingId(order.id);
    try {
      const { url } = await api.get<{ url: string }>(
        `/files/${order.fileId}/download-url`,
      );
      window.location.href = url;
      addToast('success', 'Download started');
    } catch (err: any) {
      if (err instanceof ApiError && err.status === 409) {
        addToast('error', 'Payment still processing — try again shortly');
      } else if (err instanceof ApiError && err.status === 403) {
        addToast('error', 'No valid purchase found for this file');
      } else {
        addToast('error', err.message || 'Download failed');
      }
    } finally {
      setDownloadingId(null);
    }
  }

  return (
    <div className="pc-page">
      <div className="pc-header">
        <span className="pc-wordmark">CSV ARCHIVE</span>
        <div style={{ display: 'flex', gap: 18 }}>
          <button className="pc-nav-link active">MY PURCHASES</button>
          <button
            className="pc-nav-link"
            onClick={async () => {
              await api.post('/auth/logout');
              window.location.href = '/';
            }}
          >
            LOG OUT
          </button>
        </div>
      </div>

      <div className="pc-subheader">
        {orders ? `${orders.length} FILES PURCHASED` : ''}
      </div>

      {isLoading && (
        <div style={{ padding: 20 }}>
          {[1, 2].map((i) => (
            <div key={i} className="pc-skeleton" />
          ))}
        </div>
      )}

      {isError && (
        <div className="pc-error-state">
          <div className="pc-row-title">COULDN'T LOAD PURCHASES</div>
          <div className="pc-row-meta">CHECK YOUR CONNECTION AND TRY AGAIN</div>
          <button
            className="pc-pill pc-pill-outline"
            style={{ marginTop: 16 }}
            onClick={() => refetch()}
          >
            RELOAD
          </button>
        </div>
      )}

      {orders && orders.length === 0 && (
        <div className="pc-empty-state">
          <div className="pc-row-title">NO PURCHASES YET</div>
          <div className="pc-row-meta">
            BUY A DATASET AND IT
            <br />
            WILL SHOW UP HERE
          </div>
          <button
            className="pc-pill pc-pill-accent"
            style={{ marginTop: 16 }}
            onClick={() => navigate('/')}
          >
            BROWSE CATALOG
          </button>
        </div>
      )}

      {orders &&
        orders.map((order) => (
          <div key={order.id} className="pc-row">
            <div className="pc-row-perforation" />
            <div className="pc-row-hole top" />
            <div className="pc-row-hole bottom" />
            <div className="pc-row-content">
              <div className="pc-row-title">
                {order.fileTitle.toUpperCase()}
              </div>
              <div className="pc-row-meta">
                PURCHASED{' '}
                {new Date(order.paidAt)
                  .toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })
                  .toUpperCase()}
              </div>
            </div>
            <button
              className="pc-pill pc-pill-outline"
              disabled={downloadingId === order.id}
              onClick={() => handleDownloadAgain(order)}
              style={{ display: 'flex', alignItems: 'center', gap: 6 }}
            >
              {downloadingId === order.id && <span className="pc-spin" />}
              {downloadingId === order.id ? 'DOWNLOADING' : 'DOWNLOAD AGAIN'}
            </button>
          </div>
        ))}
    </div>
  );
}
