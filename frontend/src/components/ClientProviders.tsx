"use client"

import React, { useState, Suspense } from 'react';
import { AuthProvider } from '../context/AuthContext';
import { ThemeProvider } from '../context/ThemeContext';
import { SyncProvider } from '../context/SyncContext';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import SyncManagerClient from './SyncManagerClient';
import ServiceWorkerRegistration from './ServiceWorkerRegistration';
import PreloadProgress from './PreloadProgress';
import CacheStatus from './CacheStatus';
import OfflineIndicator from './OfflineIndicator';
import SessionExpiryWarning from './SessionExpiryWarning';

export default function ClientProviders({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 1000 * 60 * 5, // 5 minutes
        refetchOnWindowFocus: false,
      },
    },
  }));

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <SyncProvider>
          <ThemeProvider>
            {children}
            <Suspense fallback={null}>
              <ServiceWorkerRegistration />
            </Suspense>
            <Suspense fallback={null}>
              <PreloadProgress />
            </Suspense>
            <Suspense fallback={null}>
              <CacheStatus />
            </Suspense>
            <Suspense fallback={null}>
              <OfflineIndicator />
            </Suspense>
            <Suspense fallback={null}>
              <SyncManagerClient />
            </Suspense>
            <Suspense fallback={null}>
              <SessionExpiryWarning />
            </Suspense>
          </ThemeProvider>
        </SyncProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}
