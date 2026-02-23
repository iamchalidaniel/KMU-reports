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
    <div className="min-h-screen bg-gradient-to-b from-kmuGreen to-green-600 dark:from-green-800 dark:to-green-900 flex items-center justify-center">
      <div className="text-center">
        {/* Logo */}
        <div className="mb-8 animate-fade-in">
          <img 
            src="/kmu_logo.svg" 
            alt="KMU Logo" 
            className="h-32 w-32 mx-auto object-contain drop-shadow-lg"
          />
        </div>

        {/* Main Text */}
        <div className="text-white mb-12">
          <h1 className="text-6xl md:text-7xl font-bold mb-4 animate-fade-in" style={{ animationDelay: '0.2s' }}>
            CampusCare
          </h1>
          <p className="text-xl md:text-2xl text-green-100 animate-fade-in" style={{ animationDelay: '0.4s' }}>
            AI-Powered Campus Safety Reporting
          </p>
        </div>

        {/* Tagline */}
        <div className="text-green-100 text-lg md:text-xl mb-12 animate-fade-in" style={{ animationDelay: '0.6s' }}>
          <p>Secure • Anonymous • Powered by AI</p>
        </div>

        {/* Loading Indicator */}
        <div className="flex justify-center items-center gap-2 animate-fade-in" style={{ animationDelay: '0.8s' }}>
          <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '0s' }}></div>
          <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
          <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
        </div>

        {/* Powered By */}
        <div className="mt-16 text-green-200 text-sm animate-fade-in" style={{ animationDelay: '1s' }}>
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
