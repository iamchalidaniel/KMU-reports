"use client";

import { createContext, useContext, useState, useEffect } from 'react';
import { API_BASE_URL } from '../config/constants';
import { offlineApi } from '../utils/offlineApi';
import { backgroundSync } from '../utils/backgroundSync';

interface User {
  id: string;
  username: string;
  role: string;
  name?: string;
  studentId?: string;
  email?: string;
  department?: string;
}

// Inactivity timeout: 30 minutes of no user interaction
const INACTIVITY_TIMEOUT_MS = 30 * 60 * 1000;
// Warning shown 2 minutes before auto-logout
const INACTIVITY_WARNING_MS = 2 * 60 * 1000;

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (username: string, password: string) => Promise<boolean>;
  loginOffline: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
  changePassword: (oldPassword: string, newPassword: string) => Promise<boolean>;
  loading: boolean;
  isOnline: boolean;
  preloadData: () => Promise<void>;
  isPreloading: boolean;
  sessionExpiring: boolean;
  extendSession: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [isOnline, setIsOnline] = useState(true);
  const [isPreloading, setIsPreloading] = useState(false);
  const [sessionExpiring, setSessionExpiring] = useState(false);

  const inactivityTimer = { warning: null as ReturnType<typeof setTimeout> | null, logout: null as ReturnType<typeof setTimeout> | null };

  // Check online status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    setIsOnline(navigator.onLine);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Load stored auth data on mount
  useEffect(() => {
    const loadStoredAuth = async () => {
      const storedToken = localStorage.getItem('auth_token');
      const storedUser = localStorage.getItem('auth_user');
      const storedOfflineData = localStorage.getItem('offline_auth_data');

      if (storedToken && storedUser) {
        try {
          // Validate token if it's not an offline token
          if (storedToken !== 'offline_token') {
            try {
              // Test token by making a simple API call (using profile which is role-agnostic)
              const response = await fetch(`${API_BASE_URL}/users/me`, {
                headers: { 'Authorization': `Bearer ${storedToken}` }
              });

              if (!response.ok) {
                throw new Error('Token validation failed');
              }
            } catch (error) {
              console.warn('Token validation failed, clearing stored auth:', error);
              localStorage.removeItem('auth_token');
              localStorage.removeItem('auth_user');
              setLoading(false);
              return;
            }
          }

          setToken(storedToken);
          setUser(JSON.parse(storedUser));
        } catch (error) {
          console.error('Error parsing stored auth data:', error);
          localStorage.removeItem('auth_token');
          localStorage.removeItem('auth_user');
        }
      }

      setLoading(false);
    };

    loadStoredAuth();
  }, []);

  // Security: Use SHA-256 hash for offline credential verification
  // This stores only a hash, never the actual password
  const hashPassword = async (password: string): Promise<string> => {
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  };

  // Simple encryption/decryption for offline data using base64 (for non-sensitive data only)
  const encodeData = (data: string): string => {
    return btoa(data);
  };

  const decodeData = (encodedData: string): string => {
    try {
      return atob(encodedData);
    } catch {
      return '';
    }
  };

  const login = async (username: string, password: string): Promise<boolean> => {
    try {
      const response = await fetch(`${API_BASE_URL}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      if (!response.ok) {
        throw new Error('Login failed');
      }

      const data = await response.json();

      // Store auth data
      localStorage.setItem('auth_token', data.token);
      localStorage.setItem('auth_user', JSON.stringify(data.user));

      // Security: Store only a HASH of the password for offline verification
      // Never store the actual password in localStorage
      const passwordHash = await hashPassword(password);
      const offlineData = encodeData(JSON.stringify({
        username,
        passwordHash, // SHA-256 hash, not the actual password
        user: data.user,
        timestamp: Date.now()
      }));
      localStorage.setItem('offline_auth_data', offlineData);

      // Set auth state immediately for instant login
      setToken(data.token);
      setUser(data.user);

      // Start preloading data in the background (non-blocking)
      // Use requestIdleCallback for better performance, fallback to setTimeout
      const startPreload = () => {
        // Use a very short delay to ensure UI updates first
        setTimeout(() => {
          preloadData().catch(error => {
            console.warn('Background preload failed:', error);
            // Don't block login if preload fails
          });
        }, 100);
      };

      if ('requestIdleCallback' in window) {
        requestIdleCallback(startPreload);
      } else {
        startPreload();
      }

      return true;
    } catch (error) {
      console.error('Login error:', error);
      return false;
    }
  };

  const loginOffline = async (username: string, password: string): Promise<boolean> => {
    try {
      const storedOfflineData = localStorage.getItem('offline_auth_data');
      if (!storedOfflineData) {
        throw new Error('No offline data available');
      }

      const decodedData = decodeData(storedOfflineData);
      const offlineData = JSON.parse(decodedData);

      // Security: Compare password hash instead of plain text
      const inputPasswordHash = await hashPassword(password);
      
      // Check if stored credentials match
      if (offlineData.username === username && offlineData.passwordHash === inputPasswordHash) {
        // Check if data is not too old (e.g., 7 days for security)
        const sevenDaysAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
        if (offlineData.timestamp < sevenDaysAgo) {
          throw new Error('Offline data expired');
        }

        setUser(offlineData.user);
        setToken('offline_token'); // Special token for offline mode
        return true;
      }

      throw new Error('Invalid credentials');
    } catch (error) {
      console.error('Offline login error:', error);
      return false;
    }
  };

  const clearInactivityTimers = () => {
    if (inactivityTimer.warning) clearTimeout(inactivityTimer.warning);
    if (inactivityTimer.logout) clearTimeout(inactivityTimer.logout);
    inactivityTimer.warning = null;
    inactivityTimer.logout = null;
  };

  const resetInactivityTimer = () => {
    if (!localStorage.getItem('auth_token')) return;
    setSessionExpiring(false);
    clearInactivityTimers();

    // Show warning 2 minutes before logout
    inactivityTimer.warning = setTimeout(() => {
      setSessionExpiring(true);
    }, INACTIVITY_TIMEOUT_MS - INACTIVITY_WARNING_MS);

    // Auto-logout after full inactivity period
    inactivityTimer.logout = setTimeout(() => {
      setSessionExpiring(false);
      logout();
    }, INACTIVITY_TIMEOUT_MS);
  };

  const extendSession = () => {
    resetInactivityTimer();
  };

  // Start/stop inactivity tracking based on auth state
  useEffect(() => {
    if (!token || token === 'offline_token') {
      clearInactivityTimers();
      return;
    }

    const activityEvents = ['mousedown', 'mousemove', 'keydown', 'scroll', 'touchstart', 'click'];
    const handleActivity = () => resetInactivityTimer();

    activityEvents.forEach(e => window.addEventListener(e, handleActivity, { passive: true }));
    resetInactivityTimer();

    return () => {
      activityEvents.forEach(e => window.removeEventListener(e, handleActivity));
      clearInactivityTimers();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const logout = () => {
    clearInactivityTimers();
    setSessionExpiring(false);

    // Notify server to blacklist the token (best-effort, don't await)
    const currentToken = localStorage.getItem('auth_token');
    if (currentToken && currentToken !== 'offline_token') {
      fetch(`${API_BASE_URL}/logout`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${currentToken}` }
      }).catch(() => {}); // fire-and-forget
    }

    // Stop background sync
    backgroundSync.stop();

    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_user');
    localStorage.removeItem('offline_auth_data');
    setToken(null);
    setUser(null);

    // Force redirect to login page
    if (typeof window !== 'undefined') {
      window.location.href = '/login';
    }
  };

  const changePassword = async (oldPassword: string, newPassword: string): Promise<boolean> => {
    try {
      // Update password in online database
      const response = await fetch(`${API_BASE_URL}/users/me/password`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ oldPassword, newPassword }),
      });

      if (!response.ok) {
        throw new Error('Password change failed');
      }

      // Security: Clear offline data on password change
      // User must re-login to enable offline access with new password
      localStorage.removeItem('offline_auth_data');
      console.log('Offline credentials cleared - please re-login to enable offline access');

      return true;
    } catch (error) {
      console.error('Change password error:', error);
      return false;
    }
  };

  // Preload critical data for offline functionality
  const preloadData = async (): Promise<void> => {
    if (!token || isPreloading) return;

    setIsPreloading(true);
    try {
      console.log('Starting background data preload...');

      // Initialize offline API service (non-blocking)
      await Promise.race([
        offlineApi.init(),
        new Promise(resolve => setTimeout(resolve, 5000)) // 5 second timeout
      ]).catch(error => {
        console.warn('Offline API init timeout or error:', error);
        return;
      });

      // Preload critical data with timeout
      await Promise.race([
        offlineApi.preloadCriticalData(user?.role),
        new Promise(resolve => setTimeout(resolve, 10000)) // 10 second timeout
      ]).catch(error => {
        console.warn('Critical data preload timeout or error:', error);
      });

      // Preload role-specific data with timeout
      if (user?.role) {
        await Promise.race([
          offlineApi.preloadRoleSpecificData(user.role),
          new Promise(resolve => setTimeout(resolve, 8000)) // 8 second timeout
        ]).catch(error => {
          console.warn('Role-specific data preload timeout or error:', error);
        });
      }

      // Start background sync service (non-blocking)
      setTimeout(() => {
        try {
          backgroundSync.start(5); // Sync every 5 minutes
        } catch (error) {
          console.warn('Background sync start failed:', error);
        }
      }, 1000);

      console.log('Background data preload completed');

    } catch (error) {
      console.error('Data preload failed:', error);
    } finally {
      setIsPreloading(false);
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      token,
      login,
      loginOffline,
      logout,
      changePassword,
      loading,
      isOnline,
      preloadData,
      isPreloading,
      sessionExpiring,
      extendSession
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
