import { ReactNode } from 'react';

export function ListSkeleton({ rows = 3 }: { rows?: number }) {
  return (
    <div style={{ padding: 20 }}>
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className="pc-skeleton" />
      ))}
    </div>
  );
}

export function ListError({ what, onRetry }: { what: string; onRetry: () => void }) {
  return (
    <div className="pc-error-state">
      <div className="pc-row-title">COULDN'T LOAD {what.toUpperCase()}</div>
      <div className="pc-row-meta">CHECK YOUR CONNECTION AND TRY AGAIN</div>
      <button className="pc-pill pc-pill-outline" style={{ marginTop: 16 }} onClick={onRetry}>
        RELOAD
      </button>
    </div>
  );
}

export function ListEmpty({
  title,
  hint,
  action,
}: {
  title: string;
  hint: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="pc-empty-state">
      <div className="pc-row-title">{title}</div>
      <div className="pc-row-meta">{hint}</div>
      {action && <div style={{ marginTop: 16 }}>{action}</div>}
    </div>
  );
}
