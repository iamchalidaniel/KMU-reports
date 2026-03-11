"use client";

import { useAuth } from '../context/AuthContext';
import { useUIStore } from '../store/uiStore';
import React, { useState, useEffect, Suspense, lazy } from 'react';
import clsx from 'clsx';
import { usePathname } from 'next/navigation';

const Sidebar = lazy(() => import('./Sidebar'));
const StudentBottomNavWrapper = lazy(() => import('./StudentBottomNavWrapper'));
const Navbar = lazy(() => import('./Navbar'));

const LoadingFallback = () => (
  <div className="flex items-center justify-center p-4">
    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-kmuGreen"></div>
  </div>
);

export default function AppLayoutWrapper({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const sidebarWidth = useUIStore((state) => state.sidebarWidth);
  const [isMobile, setIsMobile] = useState(false);
  const pathname = usePathname();
  
  const isLogin = pathname === "/login";
  const isSplash = pathname === "/" || pathname === "/splash";
  const isPublic = isSplash || pathname?.startsWith("/home") || pathname?.startsWith("/public");
  
  const shouldShowNav = !isLogin && !isPublic && user;

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  return (
    <div className="flex min-h-screen">
      {shouldShowNav && (
        <Suspense fallback={<LoadingFallback />}>
          <Sidebar />
        </Suspense>
      )}

      <div
        className="flex-1 flex flex-col relative"
        style={{
          marginLeft: shouldShowNav && !isMobile ? `${sidebarWidth}px` : '0px'
        }}
      >
        {shouldShowNav && (
          <Suspense fallback={<div className="h-14 border-b border-gray-200 dark:border-gray-700" />}>
            <Navbar />
          </Suspense>
        )}
        <main className={clsx(
          "flex-1 overflow-x-hidden",
          shouldShowNav ? "px-2 py-2 md:px-6 md:py-8" : "px-0 py-0"
        )}>
          <Suspense fallback={<LoadingFallback />}>
            {children}
          </Suspense>
        </main>
        {shouldShowNav && (
          <Suspense fallback={null}>
            <StudentBottomNavWrapper />
          </Suspense>
        )}
      </div>
    </div>
  );
}
