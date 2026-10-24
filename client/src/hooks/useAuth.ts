import { useQuery } from '@tanstack/react-query';
import { api, ApiError } from '../lib/api';

type User = {
  id: string;
  email: string;
  role: 'admin' | 'regular';
};

export function useAuth() {
  const {
    data: user,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['auth', 'me'],
    queryFn: async (): Promise<User | null> => {
      try {
        return await api.get<User>('/auth/me');
      } catch (err) {
        // Not logged in is a valid state, not a query failure
        if (err instanceof ApiError && err.status === 401) return null;
        throw err;
      }
    },
    retry: (failureCount, err) => {
      if (failureCount >= 10) return false;
      if (err instanceof ApiError) return false;
      return true;
    },
    retryDelay: (attempt) => Math.min(1500, 200 * (attempt + 1)),
    refetchOnWindowFocus: false,
    staleTime: 60_000,
  });

  return {
    user: user ?? null,
    isLoggedIn: !!user,
    isLoading,
    isAdmin: user?.role === 'admin',
    error,
  };
}
