import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../hooks/useAuth';
import { api } from '../lib/api';
import { useUiStore } from '../store/uiStore';

type ActivePage = 'catalog' | 'orders' | 'upload';

interface HeaderProps {
  /** Which nav link (if any) should be highlighted as the current page. */
  active?: ActivePage;
}

/**
 * Shared top navigation bar.
 *
 * Every page in the app renders this so there is always a way back to the
 * catalog, a visible indicator of who is logged in, and a working log out
 * action — regardless of which page (orders, admin upload, catalog, ...)
 * the user happens to be on.
 */
export function Header({ active }: HeaderProps) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const addToast = useUiStore((s) => s.addToast);
  const { user, isLoggedIn, isAdmin, isLoading } = useAuth();

  async function handleLogout() {
    try {
      await api.post('/auth/logout');
    } finally {
      // Make sure every cached view of "who is logged in" is cleared,
      // even if the network call above failed (e.g. session already gone).
      queryClient.setQueryData(['auth', 'me'], null);
      addToast('success', 'Logged out');
      navigate('/');
    }
  }

  return (
    <div className="pc-header">
      <span
        className="pc-wordmark"
        role="link"
        tabIndex={0}
        style={{ cursor: 'pointer' }}
        onClick={() => navigate('/')}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') navigate('/');
        }}
      >
        CSV ARCHIVE
      </span>

      <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
        {!isLoading && isLoggedIn && (
          <span
            className="pc-nav-link"
            style={{ cursor: 'default', color: 'var(--pc-text-muted)' }}
            title={user?.email ?? undefined}
          >
            {user?.email} {isAdmin ? '· ADMIN' : ''}
          </span>
        )}

        <button
          type="button"
          className={`pc-nav-link${active === 'catalog' ? ' active' : ''}`}
          onClick={() => navigate('/')}
        >
          CATALOG
        </button>

        {!isLoading && isLoggedIn && (
          <>
            {isAdmin ? (
              <button
                type="button"
                className={`pc-nav-link${active === 'upload' ? ' active' : ''}`}
                style={{ color: 'var(--pc-accent)' }}
                onClick={() => navigate('/admin/upload')}
              >
                UPLOAD
              </button>
            ) : (
              <button
                type="button"
                className={`pc-nav-link${active === 'orders' ? ' active' : ''}`}
                onClick={() => navigate('/orders')}
              >
                MY PURCHASES
              </button>
            )}
            <button type="button" className="pc-nav-link" onClick={handleLogout}>
              LOG OUT
            </button>
          </>
        )}

        {!isLoading && !isLoggedIn && (
          <>
            <button
              type="button"
              className="pc-nav-link"
              onClick={() => navigate('/login')}
            >
              LOG IN
            </button>
            <button
              type="button"
              className="pc-nav-link"
              style={{ color: 'var(--pc-accent)' }}
              onClick={() => navigate('/signup')}
            >
              SIGN UP
            </button>
          </>
        )}
      </div>
    </div>
  );
}

export default Header;
