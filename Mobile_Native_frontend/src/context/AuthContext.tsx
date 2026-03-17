import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { login as loginService, logout as logoutService, getCurrentUser, getStoredToken, LoginCredentials, AuthUser } from '../services/authService';

interface AuthState {
  user: AuthUser | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

interface AuthContextType extends AuthState {
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    token: null,
    isLoading: true,
    isAuthenticated: false,
  });

  // On app start, check for a stored token and restore session
  useEffect(() => {
    async function restoreSession() {
      try {
        const token = await getStoredToken();
        if (token) {
          const user = await getCurrentUser();
          setState({ user, token, isLoading: false, isAuthenticated: true });
        } else {
          setState(prev => ({ ...prev, isLoading: false }));
        }
      } catch {
        // Token invalid / expired – clear and start fresh
        await logoutService();
        setState({ user: null, token: null, isLoading: false, isAuthenticated: false });
      }
    }
    restoreSession();
  }, []);

  const login = useCallback(async (credentials: LoginCredentials) => {
    const { token, user } = await loginService(credentials);
    setState({ user, token, isLoading: false, isAuthenticated: true });
  }, []);

  const logout = useCallback(async () => {
    await logoutService();
    setState({ user: null, token: null, isLoading: false, isAuthenticated: false });
  }, []);

  return (
    <AuthContext.Provider value={{ ...state, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
