/** Central place for react-query keys so invalidation stays consistent. */
export const queryKeys = {
  auth: ['auth', 'me'] as const,
  catalog: ['files'] as const,
  adminFiles: ['admin', 'files'] as const,
  myOrders: ['orders', 'mine'] as const,
  labels: ['labels'] as const,
};
