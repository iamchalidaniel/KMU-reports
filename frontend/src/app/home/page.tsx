"use client";

import { useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

export default function HomePage() {
  const router = useRouter();

  // redirect to splash screen when the user first lands on /home. once
  // they've been sent there we add a query parameter (`from=splash`) so the
  // effect won't fire again when they return. this also means a hard reload
  // of `/home` without the param will show the splash anew (behaviour similar
  // to "every visit").
  const searchParams = useSearchParams();
  const firstRun = useRef(true);

  useEffect(() => {
    if (!firstRun.current) return;
    firstRun.current = false;

    const fromSplash = searchParams.get('from');
    if (fromSplash === 'splash') {
      // clean up the URL so it doesn't persist if they reload
      router.replace('/home');
    } else {
      router.push('/splash');
    }
  }, [router, searchParams]);

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950 flex flex-col">
      {/* Navigation Bar */}
      <nav className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-800 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between">
          <Link href="/home" className="flex items-center space-x-2">
            <img
              src="/kmu_logo.svg"
              alt="KMU Logo"
              width={32}
              height={32}
              className="h-8 w-8 object-contain"
            />
            <div>
              <div className="text-base font-bold text-gray-900 dark:text-white leading-tight">CampusCare</div>
              <div className="text-[10px] text-gray-500 dark:text-gray-400 font-medium tracking-tight">AI-Powered Campus Safety</div>
            </div>
          </Link>
          <div className="flex items-center space-x-1 sm:space-x-4">
            <Link
              href="/login"
              className="px-4 py-2 text-sm text-gray-700 dark:text-gray-300 font-semibold hover:text-kmuGreen transition-colors"
            >
              Login
            </Link>
            <Link
              href="/public/report"
              className="px-5 py-2 bg-kmuGreen text-white rounded-full text-sm font-bold hover:bg-green-700 transition-all active:scale-95 shadow-lg shadow-green-500/20"
            >
              Create Report
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative py-20 md:py-32 overflow-hidden bg-white dark:bg-gray-950">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full max-w-7xl">
          <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-kmuGreen/5 rounded-full blur-[120px]"></div>
          <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] bg-blue-500/5 rounded-full blur-[120px]"></div>
        </div>

        <div className="max-w-7xl mx-auto px-6 relative z-10 text-center">
          <div className="inline-flex items-center px-3 py-1 rounded-full bg-green-50 dark:bg-green-900/30 border border-green-100 dark:border-green-800 text-kmuGreen text-xs font-bold mb-8 animate-in fade-in slide-in-from-bottom-2">
            ✨ AI-POWERED CAMPUS SAFETY MANGEMENT
          </div>
          <h1 className="text-5xl md:text-7xl font-extrabold text-gray-900 dark:text-white mb-6 tracking-tight leading-[1.1]">
            Your Safety, <span className="bg-gradient-to-r from-kmuGreen to-teal-500 bg-clip-text text-transparent">Our Priority.</span>
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 mb-10 max-w-2xl mx-auto leading-relaxed font-medium">
            Join thousands of students and staff in creating a safer, more transparent campus environment at Kapasa Makasa University.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link
              href="/public/report"
              className="w-full sm:w-auto px-10 py-4 bg-kmuGreen text-white rounded-full font-bold text-lg hover:bg-green-700 transition-all hover:scale-105 shadow-xl shadow-green-500/20 active:scale-95"
            >
              Start a Report
            </Link>
            <Link
              href="/login"
              className="w-full sm:w-auto px-10 py-4 border-2 border-gray-200 dark:border-gray-800 text-gray-900 dark:text-white rounded-full font-bold text-lg hover:border-kmuGreen hover:text-kmuGreen transition-all active:scale-95 bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm"
            >
              Sign In
            </Link>
          </div>
        </div>
      </section>

      {/* Feature Cards Section */}
      <section className="py-24 bg-gray-50 dark:bg-gray-900/50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-20">
            <h2 className="text-3xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4">How it works</h2>
            <div className="h-1.5 w-24 bg-kmuGreen mx-auto rounded-full"></div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-left">
            {/* Card 1: Security */}
            <div className="bg-white dark:bg-gray-800 p-8 rounded-3xl border border-gray-100 dark:border-gray-700 hover:shadow-2xl transition-all group">
              <div className="w-14 h-14 bg-red-50 dark:bg-red-900/20 rounded-2xl flex items-center justify-center mb-8 group-hover:scale-110 transition-transform">
                <span className="text-3xl">🛡️</span>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Security Incidents</h3>
              <p className="text-gray-600 dark:text-gray-400 leading-relaxed font-medium">
                Instant reporting for suspicious activity, safety hazards, and emergency concerns on campus.
              </p>
            </div>

            {/* Card 2: Maintenance */}
            <div className="bg-white dark:bg-gray-800 p-8 rounded-3xl border border-gray-100 dark:border-gray-700 hover:shadow-2xl transition-all group">
              <div className="w-14 h-14 bg-blue-50 dark:bg-blue-900/20 rounded-2xl flex items-center justify-center mb-8 group-hover:scale-110 transition-transform">
                <span className="text-3xl">🔧</span>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Maintenance</h3>
              <p className="text-gray-600 dark:text-gray-400 leading-relaxed font-medium">
                Track and resolve hostel plumbing, electrical issues, and general facility maintenance reports.
              </p>
            </div>

            {/* Card 3: Anonymous */}
            <div className="bg-white dark:bg-gray-800 p-8 rounded-3xl border border-gray-100 dark:border-gray-700 hover:shadow-2xl transition-all group">
              <div className="w-14 h-14 bg-emerald-50 dark:bg-emerald-900/20 rounded-2xl flex items-center justify-center mb-8 group-hover:scale-110 transition-transform">
                <span className="text-3xl">👁️</span>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Confidentiality</h3>
              <p className="text-gray-600 dark:text-gray-400 leading-relaxed font-medium">
                Submit sensitive reports anonymously with encrypted tracking and secure case management.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-300 py-12">
        <div className="container mx-auto px-4 text-center">
          <div className="flex items-center justify-center mb-4">
            <img
              src="/kmu_logo.svg"
              alt="KMU Logo"
              className="w-8 h-8 mr-3"
            />
            <span className="text-lg font-bold">CampusCare</span>
          </div>
          <p className="text-sm mb-4">
            &copy; 2026 CampusCare - AI-Powered Campus Safety Reporting
          </p>
          <p className="text-gray-500 dark:text-gray-400 text-xs">
            Powered by DredLabs
          </p>
        </div>
      </footer>
    </div>
  );
}
