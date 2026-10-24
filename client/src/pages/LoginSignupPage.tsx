import { ChangeEvent, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import { useUiStore } from '../store/uiStore';

interface AuthResponse {
  id: string;
  email: string;
  role: 'regular' | 'admin';
}

export function LoginSignupPage() {
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fieldError, setFieldError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const addToast = useUiStore((s) => s.addToast);

  function validate(): string | null {
    if (!/^\S+@\S+\.\S+$/.test(email)) return 'Enter a valid email address';
    if (password.length < 8) return 'Password must be at least 8 characters';
    return null;
  }

  async function handleSubmit(e: ChangeEvent<HTMLFormElement>) {
    e.preventDefault();
    setFieldError(null);

    const validationError = validate();
    if (validationError) {
      setFieldError(validationError);
      return;
    }

    setIsSubmitting(true);
    try {
      const path = mode === 'login' ? '/auth/login' : '/auth/signup';
      await api.post<AuthResponse>(path, { email, password });

      // refresh the cached auth/me query so the whole app knows we're logged in
      await queryClient.invalidateQueries({ queryKey: ['auth', 'me'] });

      addToast('success', mode === 'login' ? 'Logged in' : 'Account created');
      navigate('/');
    } catch (err: any) {
      addToast('error', err.message || 'Something went wrong');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="pc-page">
      <div className="pc-header" style={{ justifyContent: 'center' }}>
        <span className="pc-wordmark">CSV ARCHIVE</span>
      </div>

      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          padding: '32px 24px 40px',
        }}
      >
        <div style={{ width: 280 }}>
          <div
            style={{
              display: 'flex',
              border: '1px solid var(--pc-border)',
              borderRadius: 20,
              overflow: 'hidden',
              marginBottom: 20,
            }}
          >
            <button
              type="button"
              onClick={() => {
                setMode('login');
                setFieldError(null);
              }}
              style={{
                flex: 1,
                textAlign: 'center',
                padding: '8px 0',
                fontSize: 11,
                letterSpacing: 1,
                border: 'none',
                cursor: 'pointer',
                background:
                  mode === 'login' ? 'var(--pc-accent)' : 'transparent',
                color:
                  mode === 'login'
                    ? 'var(--pc-accent-text)'
                    : 'var(--pc-text-muted)',
                fontWeight: mode === 'login' ? 500 : 400,
              }}
            >
              LOG IN
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('signup');
                setFieldError(null);
              }}
              style={{
                flex: 1,
                textAlign: 'center',
                padding: '8px 0',
                fontSize: 11,
                letterSpacing: 1,
                border: 'none',
                cursor: 'pointer',
                background:
                  mode === 'signup' ? 'var(--pc-accent)' : 'transparent',
                color:
                  mode === 'signup'
                    ? 'var(--pc-accent-text)'
                    : 'var(--pc-text-muted)',
                fontWeight: mode === 'signup' ? 500 : 400,
              }}
            >
              SIGN UP
            </button>
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
              EMAIL
            </div>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@company.com"
              style={{
                width: '100%',
                border: '1px solid var(--pc-border)',
                borderRadius: 4,
                padding: '10px 12px',
                fontSize: 12,
                color: 'var(--pc-text)',
                marginBottom: 16,
                background: 'var(--pc-field-bg)',
                fontFamily: 'inherit',
                boxSizing: 'border-box',
              }}
            />

            <div
              style={{
                fontSize: 10,
                letterSpacing: 1,
                color: 'var(--pc-text-muted)',
                marginBottom: 6,
              }}
            >
              PASSWORD
            </div>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••••"
              style={{
                width: '100%',
                border: '1px solid var(--pc-border)',
                borderRadius: 4,
                padding: '10px 12px',
                fontSize: 12,
                color: 'var(--pc-text)',
                marginBottom: 8,
                background: 'var(--pc-field-bg)',
                fontFamily: 'inherit',
                boxSizing: 'border-box',
              }}
            />

            {fieldError && (
              <div
                style={{
                  fontSize: 11,
                  color: 'var(--pc-error)',
                  marginBottom: 12,
                }}
              >
                {fieldError}
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="pc-pill pc-pill-accent"
              style={{
                width: '100%',
                padding: '11px 0',
                fontSize: 11,
                marginTop: 8,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
              }}
            >
              {isSubmitting && <span className="pc-spin" />}
              {mode === 'login' ? 'LOG IN' : 'SIGN UP'}
            </button>
          </form>

          <div
            style={{
              textAlign: 'center',
              fontSize: 11,
              color: 'var(--pc-text-muted)',
              marginTop: 14,
            }}
          >
            {mode === 'login' ? (
              <>
                NO ACCOUNT?{' '}
                <span
                  style={{ color: 'var(--pc-accent)', cursor: 'pointer' }}
                  onClick={() => setMode('signup')}
                >
                  SIGN UP
                </span>
              </>
            ) : (
              <>
                HAVE AN ACCOUNT?{' '}
                <span
                  style={{ color: 'var(--pc-accent)', cursor: 'pointer' }}
                  onClick={() => setMode('login')}
                >
                  LOG IN
                </span>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
