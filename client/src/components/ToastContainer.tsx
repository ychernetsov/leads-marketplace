import { useEffect } from 'react';
import { useUiStore } from '../store/uiStore';

export function ToastContainer() {
  const toasts = useUiStore((s) => s.toasts);
  const removeToast = useUiStore((s) => s.removeToast);

  useEffect(() => {
    if (toasts.length === 0) return;
    const timers = toasts.map((t) => setTimeout(() => removeToast(t.id), 4000));
    return () => timers.forEach(clearTimeout);
  }, [toasts, removeToast]);

  if (toasts.length === 0) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: 20,
        right: 20,
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
        zIndex: 1000,
      }}
    >
      {toasts.map((t) => (
        <div
          onClick={() => removeToast(t.id)}
          key={t.id}
          className={`pc-toast ${t.type}`}
        >
          <span>{t.type === 'success' ? '✓' : '✕'}</span>
          <span>{t.message.toUpperCase()}</span>
        </div>
      ))}
    </div>
  );
}
