import { useState, useCallback } from 'react';
import type { User } from '../interfaces';
import { authService, storage } from '../services/api';
import { clearJobsCache } from './useJobs';

interface AuthState {
  token: string | null;
  user: User | null;
  isAuthenticated: boolean;
}

export function useAuth() {
  const [auth, setAuth] = useState<AuthState>(() => {
    const token = storage.getToken();
    const user  = storage.getUser();
    return {
      token,
      user,
      isAuthenticated: !!(token && user && token.length > 20),
    };
  });
  const [loading, setLoading]   = useState(false);
  const [error,   setError]     = useState<string | null>(null);
  const [isMock,  setIsMock]    = useState(false);

  const login = useCallback(async (email: string, password: string) => {
    setLoading(true);
    setError(null);
    try {
      const data = await authService.login({ email, password });
      const isMockLogin = !!(data as unknown as { _isMock?: boolean })._isMock;
      const u    = (data.user as User & { firstName?: string; lastName?: string }) || {};
      const name = [u.firstName, u.lastName].filter(Boolean).join(' ') || u.name || email.split('@')[0];
      const user: User = { ...u, name, email: u.email || email };
      storage.setToken(data.token);
      storage.setUser(user);
      setAuth({ token: data.token, user, isAuthenticated: true });
      setIsMock(isMockLogin);
      return { success: true, isMock: isMockLogin };
    } catch (e) {
      const msg = (e as Error).message || 'Login failed';
      setError(msg);
      return { success: false, isMock: false };
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    storage.clear();
    clearJobsCache(); // ensure next recruiter sees their own jobs fresh
    setAuth({ token: null, user: null, isAuthenticated: false });
    setIsMock(false);
  }, []);

  return { ...auth, loading, error, isMock, login, logout };
}
