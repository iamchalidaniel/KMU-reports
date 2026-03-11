"use client";

import { useAuth } from '../context/AuthContext';

/**
 * Shows a warning banner when the user's session is about to expire due to inactivity.
 * Rendered once in the root layout — no need to add it to individual pages.
 */
export default function SessionExpiryWarning() {
  const { sessionExpiring, extendSession, logout } = useAuth();

  if (!sessionExpiring) return null;

  return (
    <div
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="session-title"
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm"
    >
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 p-8 max-w-sm w-full mx-4 text-center">
        {/* Icon */}
        <div className="mx-auto mb-4 w-14 h-14 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
          <svg className="w-7 h-7 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
          </svg>
        </div>

        <h2 id="session-title" className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
          Session Expiring Soon
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
          You have been inactive for a while. Your session will end in{' '}
          <span className="font-semibold text-amber-600 dark:text-amber-400">2 minutes</span>.
          <br />Do you want to stay logged in?
        </p>

        <div className="flex gap-3">
          <button
            onClick={logout}
            className="flex-1 px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            Log Out
          </button>
          <button
            onClick={extendSession}
            className="flex-1 px-4 py-2 rounded-lg bg-green-600 hover:bg-green-700 text-white text-sm font-medium transition-colors"
          >
            Stay Logged In
          </button>
        </div>
      </div>
    </div>
  );
}
