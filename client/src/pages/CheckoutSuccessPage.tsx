import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { api, ApiError } from '../lib/api';
import { triggerFileDownload } from '../lib/download';
import { useUiStore } from '../store/uiStore';

type State = 'checking' | 'processing' | 'done' | 'error';

export function CheckoutSuccessPage() {
  const [searchParams] = useSearchParams();
  const fileId = searchParams.get('fileId');
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const addToast = useUiStore((s) => s.addToast);

  const [state, setState] = useState<State>('checking');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function attemptDownload() {
    if (!fileId) {
      setState('error');
      setErrorMessage('Missing file reference');
      return;
    }

    setState('checking');
    try {
      const { url } = await api.get<{ url: string }>(
        `/files/${fileId}/download-url`,
      );
      await triggerFileDownload(url);
      setState('done');
      addToast('success', 'File unlocked — download started');
      queryClient.invalidateQueries({ queryKey: ['orders', 'mine'] });
    } catch (err: any) {
      if (err instanceof ApiError && err.status === 409) {
        setState('processing');
      } else {
        setState('error');
        setErrorMessage(err.message || 'Something went wrong');
      }
    }
  }

  useEffect(() => {
    attemptDownload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fileId]);

  return (
    <div className="pc-page">
      <div className="pc-header" style={{ justifyContent: 'center' }}>
        <span className="pc-wordmark">CSV ARCHIVE</span>
      </div>

      <div
        style={{
          padding: '60px 24px',
          textAlign: 'center',
          maxWidth: 400,
          margin: '0 auto',
        }}
      >
        {state === 'checking' && (
          <>
            <span
              className="pc-spin"
              style={{ width: 20, height: 20, borderWidth: 3 }}
            />
            <div className="pc-row-title" style={{ marginTop: 16 }}>
              CONFIRMING PAYMENT...
            </div>
          </>
        )}

        {state === 'processing' && (
          <>
            <div className="pc-row-title">PAYMENT PROCESSING</div>
            <div
              className="pc-row-meta"
              style={{ marginTop: 8, lineHeight: 1.6 }}
            >
              YOUR PAYMENT IS STILL BEING CONFIRMED.
              <br />
              THIS USUALLY TAKES A FEW SECONDS.
            </div>
            <button
              className="pc-pill pc-pill-accent"
              style={{ marginTop: 20 }}
              onClick={attemptDownload}
            >
              RETRY
            </button>
          </>
        )}

        {state === 'done' && (
          <>
            <div className="pc-row-title">FILE UNLOCKED</div>
            <div className="pc-row-meta" style={{ marginTop: 8 }}>
              YOUR DOWNLOAD SHOULD START AUTOMATICALLY.
            </div>
            <button
              className="pc-pill pc-pill-outline"
              style={{ marginTop: 20 }}
              onClick={() => navigate('/orders')}
            >
              GO TO MY PURCHASES
            </button>
          </>
        )}

        {state === 'error' && (
          <>
            <div className="pc-row-title">SOMETHING WENT WRONG</div>
            <div className="pc-row-meta" style={{ marginTop: 8 }}>
              {errorMessage?.toUpperCase()}
            </div>
            <button
              className="pc-pill pc-pill-outline"
              style={{ marginTop: 20 }}
              onClick={() => navigate('/orders')}
            >
              GO TO MY PURCHASES
            </button>
          </>
        )}
      </div>
    </div>
  );
}
