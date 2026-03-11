import React from 'react';
import '../globals.css';
import ClientProviders from '../components/ClientProviders';
import AppLayoutWrapper from '../components/AppLayoutWrapper';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="description" content="KMU Reports - Comprehensive Reporting Management System" />
        <meta name="theme-color" content="#10B981" />

        {/* Preload critical resources */}
        <link rel="preload" href="/kmu_logo.svg" as="image" type="image/svg+xml" />
        <link rel="preload" href="/api/health" as="fetch" crossOrigin="anonymous" />

        {/* DNS prefetch for external domains */}
        <link rel="dns-prefetch" href="//kmu-reports.onrender.com" />

        {/* Preconnect to API */}
        <link rel="preconnect" href="https://kmu-reports.onrender.com" />

        <title>KMU Reports</title>
      </head>
      <body className="min-h-screen">
        <ClientProviders>
          <AppLayoutWrapper>
            {children}
          </AppLayoutWrapper>
        </ClientProviders>
      </body>
    </html>
  );
}
