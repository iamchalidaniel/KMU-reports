"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function HomePage() {
  const router = useRouter();

  // always show splash screen on visit/reload
  useEffect(() => {
    router.push('/splash');
  }, [router]);

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950">
      {/* Navigation Bar */}
      <nav className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 sticky top-0 z-40">
        <div className="container mx-auto px-4 py-2 flex items-center justify-between">
          <Link href="/home" className="flex items-center space-x-2">
            <img 
              src="/kmu_logo.svg" 
              alt="KMU Logo" 
              width={32}
              height={32}
              className="h-8 w-8 object-contain"
            />
            <div>
              <div className="text-base font-bold text-gray-900 dark:text-white">CampusCare</div>
              <div className="text-xs text-gray-600 dark:text-gray-400">AI-Powered Campus Safety</div>
            </div>
          </Link>
          <div className="flex items-center space-x-4">
            <Link 
              href="/login"
              className="px-6 py-2 text-gray-900 dark:text-white font-medium hover:text-kmuGreen transition-colors"
            >
              Login
            </Link>
            <Link 
              href="/public/report"
              className="px-6 py-2 bg-kmuGreen text-white rounded-lg font-medium hover:bg-green-700 transition-colors"
            >
              Create Report
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="py-16 md:py-24 bg-white dark:bg-gray-950">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <div className="mb-8">
              {/* Logo removed from hero; navbar already shows it */}
              <h1 className="text-5xl md:text-6xl font-bold text-gray-900 dark:text-white mb-2">CampusCare</h1>
              <p className="text-gray-600 dark:text-gray-400 text-lg">Secure Campus Safety Reporting</p>
            </div>
            <p className="text-xl text-gray-600 dark:text-gray-300 mb-4 leading-relaxed">
              Report incidents, maintenance issues, and sensitive concerns safely and anonymously.
            </p>
            <p className="text-gray-600 dark:text-gray-400 text-lg mb-12">
              AI-assisted categorization, secure tracking, and real-time resolution.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link 
                href="/public/report"
                className="px-8 py-3 bg-kmuGreen text-white rounded-lg font-bold text-lg hover:bg-green-700 transition-colors"
              >
                Create Report
              </Link>
              <Link 
                href="/login"
                className="px-8 py-3 border-2 border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white rounded-lg font-bold text-lg hover:border-kmuGreen hover:text-kmuGreen transition-colors"
              >
                Login
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Cards Section */}
      <section className="py-20 md:py-28 bg-gray-50 dark:bg-gray-900">
        <div className="container mx-auto px-4">
          <h2 className="text-4xl font-bold text-center text-gray-900 dark:text-white mb-16">Comprehensive Reporting Solutions</h2>
          <p className="text-center text-gray-600 dark:text-gray-400 text-lg mb-16 max-w-3xl mx-auto">
            Secure, anonymous, and AI-enhanced reporting for all campus safety concerns
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Card 1: Security */}
            <div className="bg-white dark:bg-gray-800 rounded-xl p-8 hover:shadow-lg transition-shadow">
              <div className="w-16 h-16 bg-kmuGreen/10 rounded-lg flex items-center justify-center mb-6">
                <svg className="w-8 h-8 text-kmuGreen" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M12.316 3.051a1 1 0 01.633 1.265l-4 12a1 1 0 11-1.898-.632l4-12a1 1 0 011.265-.633zM5.707 6.293a1 1 0 010 1.414L3.414 10l2.293 2.293a1 1 0 11-1.414 1.414l-3-3a1 1 0 010-1.414l3-3a1 1 0 011.414 0zm8.586 0a1 1 0 011.414 0l3 3a1 1 0 010 1.414l-3 3a1 1 0 11-1.414-1.414L16.586 10l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">Security Incidents</h3>
              <p className="text-gray-600 dark:text-gray-400">
                Report suspicious activity, theft, vandalism, assault, and other security concerns
              </p>
            </div>

            {/* Card 2: Maintenance */}
            <div className="bg-white dark:bg-gray-800 rounded-xl p-8 hover:shadow-lg transition-shadow">
              <div className="w-16 h-16 bg-kmuGreen/10 rounded-lg flex items-center justify-center mb-6">
                <svg className="w-8 h-8 text-kmuGreen" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 17v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.381z" clipRule="evenodd" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">Maintenance Issues</h3>
              <p className="text-gray-600 dark:text-gray-400">
                Report plumbing, electrical, HVAC, and facility maintenance needs
              </p>
            </div>

            {/* Card 3: Anonymous */}
            <div className="bg-white dark:bg-gray-800 rounded-xl p-8 hover:shadow-lg transition-shadow">
              <div className="w-16 h-16 bg-kmuGreen/10 rounded-lg flex items-center justify-center mb-6">
                <svg className="w-8 h-8 text-kmuGreen" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                  <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">Anonymous Reporting</h3>
              <p className="text-gray-600 dark:text-gray-400">
                Safely report academic misconduct, harassment, and other sensitive concerns
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
