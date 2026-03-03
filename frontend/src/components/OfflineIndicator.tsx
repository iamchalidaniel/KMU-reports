"use client";

import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

export default function OfflineIndicator() {
  const [isOffline, setIsOffline] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    // Set initial state
    setIsOffline(!navigator.onLine);

    // Add event listeners
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (!isOffline || !user) {
    return null;
  }

  return (
    <div className="fixed top-3 left-1/2 -translate-x-1/2 z-50 animate-in fade-in slide-in-from-top-4 duration-500 pointer-events-none">
      <div className="bg-gray-900/80 backdrop-blur-sm text-white px-2.5 py-1 rounded-full shadow-lg flex items-center space-x-1.5 border border-white/10">
        <div className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse" />
        <span className="text-[9px] font-bold uppercase tracking-wider">You are Offline</span>
      </div>
    </div>
  );
} 
