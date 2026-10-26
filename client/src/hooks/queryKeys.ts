/** Central place for react-query keys so invalidation stays consistent. */
export const queryKeys = {
  auth: ['auth', 'me'] as const,
  /** Prefix matching every catalog variant — use for invalidation. */
  catalogAll: ['files'] as const,
  /** The catalog differs per role (admins also get unpublished datasets). */
  catalog: (scope: string) => ['files', scope] as const,
  myOrders: ['orders', 'mine'] as const,
  labels: ['labels'] as const,
};
