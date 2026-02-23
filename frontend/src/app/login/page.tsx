"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { performanceMonitor, addResourceHints } from '../../utils/performance';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isOnline, setIsOnline] = useState(true);
  const { user, login, loginOffline, isOnline: authIsOnline } = useAuth();
  const { theme } = useTheme();
  const router = useRouter();

  // Performance monitoring
  useEffect(() => {
    performanceMonitor.startTimer('login-page-load');
    addResourceHints();
    
    return () => {
      performanceMonitor.endTimer('login-page-load');
    };
  }, []);

  // Check online status
  useEffect(() => {
    setIsOnline(navigator.onLine);
    
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Redirect if user is already logged in
  useEffect(() => {
    if (user) {
      // Check if we're already on a valid page for this user
      const currentPath = window.location.pathname;
      const validPaths = ['/admin', '/academic-dashboard', '/security-dashboard', '/dashboard', '/cases', '/students', '/reports', '/evidence', '/audit', '/profile', '/help'];

      // If we're on a valid page, don't redirect
      if (validPaths.some(path => currentPath.startsWith(path))) {
        return;
      }

      // Otherwise, redirect based on role
      const role = user.role;
      if (role === 'admin') {
        router.push('/admin');
      } else if (role === 'chief_security_officer') {
        router.push('/chief-security-officer-dashboard');
      } else if (role === 'dean_of_students') {
        router.push('/dean-of-students-dashboard');
      } else if (role === 'assistant_dean') {
        router.push('/assistant-dean-dashboard');
      } else if (role === 'secretary') {
        router.push('/secretary-dashboard');
      } else if (role === 'security_officer') {
        router.push('/security-dashboard');
      } else {
        router.push('/dashboard');
      }
    }
  }, [user, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    performanceMonitor.startTimer('login-attempt');

    try {
      let success = false;
      
      if (isOnline && authIsOnline) {
        success = await login(username, password);
      } else {
        success = await loginOffline(username, password);
      }

      if (!success) {
        setError('Invalid credentials. Please try again.');
      }
    } catch (err) {
      setError('Login failed. Please check your connection and try again.');
    } finally {
      setLoading(false);
      performanceMonitor.endTimer('login-attempt');
    }
  };

  return (
    <div className={`min-h-screen flex flex-col ${theme === 'dark' ? 'bg-gray-950' : 'bg-white'}`}>
      {/* Main Content */}
      <div className={`flex-1 flex items-center justify-center px-4 py-12`}>
        <div className="w-full max-w-md">
          {/* Login Card */}
          <div className={`${theme === 'dark' ? 'bg-gray-900' : 'bg-white'} rounded-2xl p-8 md:p-12 shadow-xl`}>
            {/* Logo and Title */}
            <div className="text-center mb-12">
              <img
                src="/kmu_logo.svg"
                alt="KMU Logo"
                width={64}
                height={64}
                className="mx-auto mb-6 h-16 w-16 object-contain"
                onError={(e) => {
                  console.error('Logo failed to load');
                  e.currentTarget.style.display = 'none';
                }}
              />
              <h1 className={`text-3xl md:text-4xl font-bold mb-2 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                Welcome Back
              </h1>
              <p className={`text-base ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                Log in to your account
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6" autoComplete="off">
              {/* Username Field */}
              <div>
                <label htmlFor="username" className={`block text-sm font-semibold mb-3 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                  Username
                </label>
                <input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  className={`w-full px-4 py-3 border-2 rounded-lg focus:outline-none focus:ring-0 focus:border-kmuGreen transition-colors ${
                    theme === 'dark' 
                      ? 'border-gray-700 bg-gray-800 text-white placeholder-gray-500' 
                      : 'border-gray-300 bg-gray-50 text-gray-900 placeholder-gray-500'
                  }`}
                  placeholder="Enter your username"
                  autoComplete="off"
                  autoCorrect="off"
                  autoCapitalize="off"
                  spellCheck="false"
                />
              </div>

              {/* Password Field */}
              <div>
                <label htmlFor="password" className={`block text-sm font-semibold mb-3 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className={`w-full px-4 py-3 border-2 rounded-lg focus:outline-none focus:ring-0 focus:border-kmuGreen transition-colors ${
                    theme === 'dark' 
                      ? 'border-gray-700 bg-gray-800 text-white placeholder-gray-500' 
                      : 'border-gray-300 bg-gray-50 text-gray-900 placeholder-gray-500'
                  }`}
                  placeholder="Enter your password"
                  autoComplete="new-password"
                  autoCorrect="off"
                  autoCapitalize="off"
                  spellCheck="false"
                />
              </div>

              {/* Error Message */}
              {error && (
                <div className="bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-900 text-red-700 dark:text-red-200 px-4 py-3 rounded-lg text-sm font-medium">
                  {error}
                </div>
              )}

              {/* Connection Status */}
              <div className="flex items-center justify-between text-sm">
                <span className={`flex items-center ${isOnline ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                  <div className={`w-2 h-2 rounded-full mr-2 ${isOnline ? 'bg-green-500' : 'bg-red-500'}`}></div>
                  <span className="font-medium">{isOnline ? 'Online' : 'Offline'}</span>
                </span>
                {!isOnline && (
                  <span className="text-orange-600 dark:text-orange-400 text-xs font-medium">
                    Offline mode available
                  </span>
                )}
            </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className={`w-full py-3 px-4 rounded-lg font-bold text-lg transition-all duration-200 ${
                  loading 
                    ? 'bg-gray-400 text-white cursor-not-allowed' 
                    : 'bg-kmuGreen text-white hover:bg-green-700 active:scale-95'
                }`}
              >
                {loading ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent mr-2"></div>
                    Signing in...
                  </div>
                ) : (
                  'Sign In'
                )}
              </button>
                      
              {/* Register Link */}
              <div className="text-center text-sm">
                <p className={`${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                  No account?{' '}
                  <a 
                    href="/student-register" 
                    className="text-kmuGreen hover:text-green-700 font-semibold transition-colors"
                  >
                    Register here
                  </a>
                </p>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
