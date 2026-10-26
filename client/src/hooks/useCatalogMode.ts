import { useSearchParams } from 'react-router-dom';
import type { CatalogMode } from '../components/catalog/CatalogModeToggle';

/** Catalog view/edit mode, kept in the URL (`?mode=edit`) so it survives navigation. */
export function useCatalogMode(): [CatalogMode, (mode: CatalogMode) => void] {
  const [params, setParams] = useSearchParams();
  const mode: CatalogMode = params.get('mode') === 'edit' ? 'edit' : 'view';

  function setMode(next: CatalogMode) {
    const nextParams = new URLSearchParams(params);
    if (next === 'edit') nextParams.set('mode', 'edit');
    else nextParams.delete('mode');
    setParams(nextParams, { replace: true });
  }

  return [mode, setMode];
}
