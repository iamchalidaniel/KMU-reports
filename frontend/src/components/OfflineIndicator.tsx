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
    <div className="fixed bottom-4 left-4 z-50 animate-in fade-in slide-in-from-bottom-4 duration-500 pointer-events-none">
      <div className="bg-gray-900/90 backdrop-blur-md text-white px-3 py-1.5 rounded-full shadow-lg flex items-center space-x-2 border border-blue-500/30">
        <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(59,130,246,0.8)]" />
        <span className="text-[10px] font-bold uppercase tracking-wider">Offline</span>
        <div className="h-3 w-[1px] bg-gray-700" />
        <span className="text-[10px] opacity-70 font-medium">Local Sync Active</span>
      </div>
    </div>
  );
} 
