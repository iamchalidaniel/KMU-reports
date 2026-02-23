"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function SplashPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to home after 3 seconds
    const timer = setTimeout(() => {
      router.push('/home');
    }, 3000);

    return () => clearTimeout(timer);
  }, [router]);

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950 flex items-center justify-center">
      <div className="text-center">
        {/* Logo */}
        <div className="mb-8 animate-fade-in">
          <img 
            src="/kmu_logo.svg" 
            alt="KMU Logo" 
            className="h-28 w-28 mx-auto object-contain drop-shadow-lg"
          />
        </div>

        {/* Main Text */}
        <div className="text-gray-900 dark:text-white mb-12">
          <h1 className="text-5xl md:text-6xl font-bold mb-4 animate-fade-in" style={{ animationDelay: '0.2s' }}>
            CampusCare
          </h1>
          <p className="text-lg md:text-xl text-gray-700 dark:text-gray-300 animate-fade-in" style={{ animationDelay: '0.4s' }}>
            AI-Powered Campus Safety Reporting
          </p>
        </div>

        {/* Tagline */}
        <div className="text-gray-700 dark:text-gray-300 text-lg md:text-xl mb-12 animate-fade-in" style={{ animationDelay: '0.6s' }}>
          <p>Secure • Anonymous • Powered by AI</p>
        </div>

        {/* Loading Indicator */}
        <div className="flex justify-center items-center gap-2 animate-fade-in" style={{ animationDelay: '0.8s' }}>
          <div className="w-2 h-2 bg-gray-900 dark:bg-gray-200 rounded-full animate-bounce" style={{ animationDelay: '0s' }}></div>
          <div className="w-2 h-2 bg-gray-900 dark:bg-gray-200 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
          <div className="w-2 h-2 bg-gray-900 dark:bg-gray-200 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
        </div>

        {/* Powered By */}
        <div className="mt-16 text-gray-500 dark:text-gray-400 text-sm animate-fade-in" style={{ animationDelay: '1s' }}>
          <p>Powered by DredLabs</p>
          <p className="text-xs mt-2">Kapasa Makasa University</p>
        </div>
      </div>

      <style jsx>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .animate-fade-in {
          animation: fade-in 0.8s ease-in-out forwards;
          opacity: 0;
        }
      `}</style>
    </div>
  );
}
