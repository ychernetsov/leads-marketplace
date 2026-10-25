import { ReactNode } from 'react';
import type { CatalogFile } from '../../types/file';

interface CatalogRowProps {
  file: CatalogFile;
  /** Action buttons for this dataset (buy / download), chosen by the page. */
  actions: ReactNode;
}

/** One dataset in the public catalog. */
export function CatalogRow({ file, actions }: CatalogRowProps) {
  return (
    <div className="pc-row">
      <div className="pc-row-perforation" />
      <div className="pc-row-hole top" />
      <div className="pc-row-hole bottom" />
      <div className="pc-row-content">
        <div className="pc-row-title">{file.title.toUpperCase()}</div>
        <div className="pc-row-meta">
          {file.numRows ? `${file.numRows.toLocaleString()} ROWS` : ''}
        </div>
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        {file.sampleUrl && (
          <a href={file.sampleUrl} className="pc-pill pc-pill-outline" style={{ textDecoration: 'none' }}>
            SAMPLE
          </a>
        )}
        {actions}
      </div>
    </div>
  );
}
