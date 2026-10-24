/** Dev uses Vite proxy (`/api` → :3000) so cookies and CORS work on one origin. */
export function getApiBaseUrl(): string {
  const configured = import.meta.env.VITE_API_URL;
  if (configured) return configured.replace(/\/$/, '');
  if (import.meta.env.DEV) return '/api';
  return 'http://localhost:3000';
}
