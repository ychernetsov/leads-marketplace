import { useAuth } from '../hooks/useAuth';
import { useCatalog } from '../hooks/useCatalog';
import { useCatalogMode } from '../hooks/useCatalogMode';
import { isAdminFile } from '../types/file';
import { Header } from '../components/Header';
import { ListError, ListSkeleton } from '../components/ListState';
import { CatalogBrowser } from '../components/catalog/CatalogBrowser';
import { CatalogModeToggle } from '../components/catalog/CatalogModeToggle';
import { DatasetEditor } from '../components/admin/DatasetEditor';

/**
 * The single catalog route for everyone. Admins can flip it into edit mode,
 * which also reveals datasets that aren't published (uploading / failed).
 */
const CatalogPage = () => {
  const { isAdmin } = useAuth();
  const [mode, setMode] = useCatalogMode();
  const { data: files, isLoading, isError, refetch } = useCatalog();

  const editing = isAdmin && mode === 'edit';
  const adminFiles = editing ? (files ?? []).filter(isAdminFile) : [];
  // Outside edit mode admins see exactly what buyers see.
  const publicFiles = (files ?? []).filter((f) => f.status === 'ready');

  return (
    <div className="pc-page">
      <Header active="catalog" />

      <div
        className="pc-subheader"
        style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}
      >
        <span>
          {files
            ? editing
              ? `${adminFiles.length} DATASETS · ${publicFiles.length} PUBLISHED`
              : `${publicFiles.length} DATASETS · SAMPLE FREE · $4.00 TO UNLOCK THE FULL FILE`
            : ''}
        </span>
        {isAdmin && <CatalogModeToggle mode={mode} onChange={setMode} />}
      </div>

      {isLoading && <ListSkeleton rows={20} />}
      {isError && <ListError what="datasets" onRetry={() => refetch()} />}

      {files && (editing ? <DatasetEditor files={adminFiles} /> : <CatalogBrowser files={publicFiles} />)}

      <div className="pc-footer">FILES HOSTED ON CLOUDFLARE R2 · PAYMENTS VIA STRIPE</div>
    </div>
  );
};

export default CatalogPage;
