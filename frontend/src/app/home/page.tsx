"use client";

import { useState } from 'react';
import Link from 'next/link';


interface HomepageData {
  // All stats removed for simplified public view
}

export default function HomePage() {
  // Simplified homepage - no API calls needed



  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-kmuGreen to-green-700 text-white py-16">
        <div className="container mx-auto px-4 text-center">
          <div className="flex justify-center mb-6">
            <div className="bg-white/20 rounded-full w-24 h-24 md:w-32 md:h-32 flex items-center justify-center text-4xl md:text-5xl font-bold">
              KMU
            </div>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">KMU Reports</h1>
          <p className="text-xl md:text-2xl max-w-3xl mx-auto opacity-90">
            Maintaining academic integrity and campus safety through transparent reporting and fair disciplinary processes
          </p>
          <div className="mt-8 max-w-2xl mx-auto bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
            <h2 className="text-lg font-semibold mb-3">About This System</h2>
            <p className="text-base opacity-90">
              KMU Reports is a comprehensive digital platform designed to streamline incident reporting and case management within the university community. Our system ensures secure, confidential reporting while maintaining transparency and accountability in disciplinary processes.
            </p>
          </div>
        </div>
      </div>



      {/* Call to Action Section */}
      <div className="bg-gray-100 dark:bg-gray-800 py-12">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">Need to Report an Incident?</h2>
          <p className="text-gray-600 dark:text-gray-300 mb-8 max-w-2xl mx-auto">
            Submit a report anonymously or log in to access your dashboard and track your reports
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link 
              href="/public/report" 
              className="px-6 py-3 bg-kmuGreen text-white rounded-lg font-medium hover:bg-green-700 transition-colors shadow-lg"
            >
              Submit Anonymous Report
            </Link>
            <Link 
              href="/login" 
              className="px-6 py-3 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg font-medium hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors shadow-lg border border-gray-200 dark:border-gray-600"
            >
              Student/Staff Login
            </Link>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-8">
        <div className="container mx-auto px-4 text-center">
          <p className="text-gray-400 mb-2">
            &copy; {new Date().getFullYear()} KMU Reports. All rights reserved.
          </p>
          <p className="text-gray-500 text-sm">
            By Daniel Chali & Grace Namonje
          </p>
        </div>
      </footer>
    </div>
  );
}