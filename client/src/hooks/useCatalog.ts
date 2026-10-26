import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';
import type { CatalogFile } from '../types/file';
import { queryKeys } from './queryKeys';
import { useAuth } from './useAuth';

/**
 * The dataset catalog. The server returns more (unpublished datasets and
 * management fields) when the caller is an admin, so the cache is keyed by
 * who is asking.
 */
export function useCatalog() {
  const { user } = useAuth();
  const scope = user ? `${user.role}:${user.id}` : 'public';

  return useQuery({
    queryKey: queryKeys.catalog(scope),
    queryFn: () => api.get<CatalogFile[]>('/files'),
    retry: false,
  });
}
