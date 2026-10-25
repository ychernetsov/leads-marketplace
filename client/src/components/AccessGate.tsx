import { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { Header } from './Header';

interface AccessGateProps {
  /** Require the admin role (otherwise any logged-in user is enough). */
  admin?: boolean;
  /** What the page is for, used in the explanation ("…TO MANAGE DATASETS"). */
  purpose: string;
  children: ReactNode;
}

/**
 * Renders `children` only when the current user is allowed to see the page;
 * otherwise shows a friendly explanation with a way out. Never renders a
 * dead end.
 */
export function AccessGate({ admin = false, purpose, children }: AccessGateProps) {
  const navigate = useNavigate();
  const { isLoggedIn, isAdmin, isLoading } = useAuth();

  if (isLoading) return null;
  const allowed = isLoggedIn && (!admin || isAdmin);
  if (allowed) return <>{children}</>;

  return (
    <div className="pc-page">
      <Header />
      <div className="pc-error-state">
        <div className="pc-row-title">{admin ? 'ADMIN ACCESS REQUIRED' : 'LOG IN REQUIRED'}</div>
        <div className="pc-row-meta" style={{ marginTop: 8 }}>
          {isLoggedIn
            ? "YOU'RE SIGNED IN, BUT THIS ACCOUNT ISN'T AN ADMIN."
            : `LOG IN${admin ? ' WITH AN ADMIN ACCOUNT' : ''} TO ${purpose.toUpperCase()}.`}
        </div>
        <button
          className="pc-pill pc-pill-accent"
          style={{ marginTop: 20 }}
          onClick={() => navigate(isLoggedIn ? '/' : '/login')}
        >
          {isLoggedIn ? 'BACK TO CATALOG' : 'GO TO LOGIN'}
        </button>
      </div>
    </div>
  );
}
