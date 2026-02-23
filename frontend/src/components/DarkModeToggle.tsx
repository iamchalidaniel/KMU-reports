import React from 'react';
import { useTheme } from '../context/ThemeContext';

export default function DarkModeToggle() {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <button
      className="rounded p-2 bg-gray-200 dark:bg-gray-800 hover:bg-gray-300 dark:hover:bg-gray-700 transition-colors flex items-center justify-center"
      onClick={toggleTheme}
      aria-label="Toggle dark mode"
    >
      {isDark ? (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-5 w-5 text-yellow-400"
          viewBox="0 0 20 20"
          fill="currentColor"
        >
          <path d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1z" />
          <path d="M10 16a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1z" />
          <path d="M4.22 4.22a1 1 0 011.42 0L6.64 5.22a1 1 0 11-1.42 1.42L4.22 5.64a1 1 0 010-1.42z" />
          <path d="M13.36 13.36a1 1 0 011.42 0l1 1a1 1 0 11-1.42 1.42l-1-1a1 1 0 010-1.42z" />
          <path d="M2 10a1 1 0 011-1h1a1 1 0 110 2H3a1 1 0 01-1-1z" />
          <path d="M16 10a1 1 0 011-1h1a1 1 0 110 2h-1a1 1 0 01-1-1z" />
          <path d="M4.22 15.78a1 1 0 010-1.42l1-1a1 1 0 011.42 1.42l-1 1a1 1 0 01-1.42 0z" />
          <path d="M13.36 6.64a1 1 0 010-1.42l1-1a1 1 0 011.42 1.42l-1 1a1 1 0 01-1.42 0z" />
          <circle cx="10" cy="10" r="3" />
        </svg>
      ) : (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-5 w-5 text-gray-800"
          viewBox="0 0 20 20"
          fill="currentColor"
        >
          <path
            fillRule="evenodd"
            d="M17.293 13.293a8 8 0 11-10.586-10.586 7 7 0 008.586 8.586 1 1 0 01-1 1h-.919a1 1 0 00-.993.883 5 5 0 01-4.97 4.12 1 1 0 00-.992.883V17a1 1 0 01-1 1h-1a8 8 0 007.293-4.707z"
            clipRule="evenodd"
          />
        </svg>
      )}
    </button>
  );
}
