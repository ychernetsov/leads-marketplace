import { ChangeEvent, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import { useUiStore } from '../store/uiStore';
import { Header } from '../components/Header';
import { AccessGate } from '../components/AccessGate';

import { getApiBaseUrl } from '../lib/apiBase';
import { queryKeys } from '../hooks/queryKeys';

const API_URL = getApiBaseUrl();

type UploadStatus = 'idle' | 'uploading' | 'processing' | 'ready' | 'failed';

export function AdminUploadPage() {
  return (
    <AccessGate admin purpose="upload datasets">
      <UploadForm />
    </AccessGate>
  );
}

/** The upload form itself; rendered only for admins. */
function UploadForm() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const addToast = useUiStore((s) => s.addToast);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priceDollars, setPriceDollars] = useState('4.00');
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<UploadStatus>('idle');
  const [progress, setProgress] = useState(0);
  const [isDragging, setIsDragging] = useState(false);

  function handleFileSelect(f: File) {
    setFile(f);
    if (!title) setTitle(f.name.replace(/\.csv$/i, '').replace(/_/g, ' '));
  }

  function uploadToR2(uploadUrl: string, fileToUpload: File): Promise<void> {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open('PUT', uploadUrl);
      xhr.setRequestHeader('Content-Type', 'text/csv');
      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable)
          setProgress(Math.round((e.loaded / e.total) * 100));
      };
      xhr.onload = () =>
        xhr.status >= 200 && xhr.status < 300
          ? resolve()
          : reject(new Error('R2 upload failed'));
      xhr.onerror = () => reject(new Error('R2 upload failed'));
      xhr.send(fileToUpload);
    });
  }

  async function handleSubmit(e: ChangeEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!file) {
      addToast('error', 'Select a CSV file first');
      return;
    }

    const priceCents = Math.round(parseFloat(priceDollars) * 100);
    if (!title || !description || isNaN(priceCents) || priceCents <= 0) {
      addToast('error', 'Fill in title, description, and a valid price');
      return;
    }

    try {
      setStatus('uploading');
      setProgress(0);

      const { fileId, uploadUrl } = await api.post<{
        fileId: string;
        uploadUrl: string;
      }>('/files/upload', {
        title,
        description,
        priceCents,
        originalFilename: file.name,
      });

      await uploadToR2(uploadUrl, file);

      setStatus('processing');
      const processRes = await fetch(`${API_URL}/files/${fileId}/process`, {
        method: 'POST',
        credentials: 'include',
      });
      const processBody = await processRes.json().catch(() => ({}));

      if (!processRes.ok) {
        // The upload itself succeeded, but the CSV failed processing
        // (e.g. no data rows). Previously this was silently treated as a
        // success, leaving a broken "failed" file for admins to wonder
        // about — now it's surfaced immediately so it can be fixed/retried.
        throw new Error(
          processBody.error || 'File processing failed — check the CSV and try again',
        );
      }

      setStatus('ready');
      addToast('success', 'File uploaded and ready in catalog');

      setTitle('');
      setDescription('');
      setPriceDollars('4.00');
      setFile(null);
      setProgress(0);
    } catch (err) {
      setStatus('failed');
      addToast('error', err instanceof Error ? err.message : 'Upload failed');
    } finally {
      // Even a failed upload leaves a (failed) dataset row behind, which
      // admins see in catalog edit mode — keep the cached catalog honest.
      queryClient.invalidateQueries({ queryKey: queryKeys.catalogAll });
    }
  }

  return (
    <div className="pc-page">
      <Header active="upload" />

      <div className="pc-subheader" style={{ display: 'flex', justifyContent: 'space-between' }}>
        <span>UPLOAD A NEW DATASET</span>
        <button type="button" className="pc-nav-link" onClick={() => navigate('/?mode=edit')}>
          ← MANAGE DATASETS
        </button>
      </div>

      <div style={{ padding: 32, maxWidth: 480, margin: '0 auto' }}>
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setIsDragging(false);
            const dropped = e.dataTransfer.files[0];
            if (dropped) handleFileSelect(dropped);
          }}
          style={{
            border: `1.5px dashed ${isDragging ? 'var(--pc-accent)' : 'var(--pc-border)'}`,
            borderRadius: 8,
            padding: 32,
            textAlign: 'center',
            marginBottom: 20,
            background: isDragging ? 'var(--pc-field-bg)' : 'transparent',
          }}
        >
          <input
            type="file"
            accept=".csv"
            id="file-input"
            style={{ display: 'none' }}
            onChange={(e) =>
              e.target.files?.[0] && handleFileSelect(e.target.files[0])
            }
          />
          <label
            htmlFor="file-input"
            style={{
              cursor: 'pointer',
              fontSize: 12,
              color: 'var(--pc-text-muted)',
            }}
          >
            {file
              ? file.name.toUpperCase()
              : 'DRAG A CSV HERE, OR CLICK TO SELECT'}
          </label>
        </div>

        <form onSubmit={handleSubmit}>
          <div
            style={{
              fontSize: 10,
              letterSpacing: 1,
              color: 'var(--pc-text-muted)',
              marginBottom: 6,
            }}
          >
            TITLE
          </div>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            style={inputStyle}
          />

          <div
            style={{
              fontSize: 10,
              letterSpacing: 1,
              color: 'var(--pc-text-muted)',
              marginBottom: 6,
              marginTop: 16,
            }}
          >
            DESCRIPTION
          </div>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            style={{ ...inputStyle, resize: 'vertical' as const }}
          />

          <div
            style={{
              fontSize: 10,
              letterSpacing: 1,
              color: 'var(--pc-text-muted)',
              marginBottom: 6,
              marginTop: 16,
            }}
          >
            PRICE (USD)
          </div>
          <input
            value={priceDollars}
            onChange={(e) => setPriceDollars(e.target.value)}
            style={inputStyle}
          />

          {(status === 'uploading' || status === 'processing') && (
            <div style={{ marginTop: 20 }}>
              <div
                style={{
                  fontSize: 11,
                  color: 'var(--pc-text-muted)',
                  marginBottom: 6,
                }}
              >
                {status === 'uploading'
                  ? `UPLOADING... ${progress}%`
                  : 'PROCESSING...'}
              </div>
              <div
                style={{
                  height: 6,
                  background: 'var(--pc-field-bg)',
                  borderRadius: 3,
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    height: '100%',
                    width: status === 'uploading' ? `${progress}%` : '100%',
                    background: 'var(--pc-accent)',
                    transition: 'width 0.2s',
                  }}
                />
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={status === 'uploading' || status === 'processing'}
            className="pc-pill pc-pill-accent"
            style={{
              width: '100%',
              padding: '11px 0',
              fontSize: 11,
              marginTop: 20,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
            }}
          >
            {(status === 'uploading' || status === 'processing') && (
              <span className="pc-spin" />
            )}
            {status === 'uploading'
              ? 'UPLOADING'
              : status === 'processing'
                ? 'PROCESSING'
                : 'UPLOAD FILE'}
          </button>
        </form>
      </div>
    </div>
  );
}

const inputStyle = {
  width: '100%',
  border: '1px solid var(--pc-border)',
  borderRadius: 4,
  padding: '10px 12px',
  fontSize: 12,
  color: 'var(--pc-text)',
  background: 'var(--pc-field-bg)',
  fontFamily: 'inherit',
  boxSizing: 'border-box' as const,
};
