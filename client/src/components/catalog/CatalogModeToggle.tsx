export type CatalogMode = 'view' | 'edit';

interface CatalogModeToggleProps {
  mode: CatalogMode;
  onChange: (mode: CatalogMode) => void;
}

/** Admin-only switch between browsing the catalog and managing it. */
export function CatalogModeToggle({ mode, onChange }: CatalogModeToggleProps) {
  return (
    <div className="pc-segmented" role="tablist" aria-label="Catalog mode">
      <button
        type="button"
        role="tab"
        aria-selected={mode === 'view'}
        className={mode === 'view' ? 'active' : ''}
        onClick={() => onChange('view')}
      >
        VIEW
      </button>
      <button
        type="button"
        role="tab"
        aria-selected={mode === 'edit'}
        className={mode === 'edit' ? 'active' : ''}
        onClick={() => onChange('edit')}
      >
        EDIT MODE
      </button>
    </div>
  );
}
