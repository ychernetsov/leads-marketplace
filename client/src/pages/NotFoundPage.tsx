import { useNavigate } from 'react-router-dom';
import { Header } from '../components/Header';

/**
 * Shown for any URL that doesn't match a known route, instead of silently
 * rendering a blank page.
 */
export function NotFoundPage() {
  const navigate = useNavigate();

  return (
    <div className="pc-page">
      <Header />
      <div className="pc-error-state">
        <div className="pc-row-title">PAGE NOT FOUND</div>
        <div className="pc-row-meta" style={{ marginTop: 8 }}>
          THAT URL DOESN'T MATCH ANYTHING IN CSV ARCHIVE.
        </div>
        <button
          className="pc-pill pc-pill-accent"
          style={{ marginTop: 20 }}
          onClick={() => navigate('/')}
        >
          BACK TO CATALOG
        </button>
      </div>
    </div>
  );
}

export default NotFoundPage;
