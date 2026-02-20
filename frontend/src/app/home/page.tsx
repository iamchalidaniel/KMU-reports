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
            <img 
              src="/kmu_logo.svg" 
              alt="Kampala Metropolitan University Logo" 
              className="w-24 h-24 md:w-32 md:h-32 object-contain"
            />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">KMU Reports</h1>
          <p className="text-xl md:text-2xl max-w-3xl mx-auto opacity-90 mb-8">
            Maintaining academic integrity and campus safety through transparent reporting and fair disciplinary processes
          </p>
          <div className="max-w-3xl mx-auto bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20 shadow-lg">
            <h2 className="text-xl font-semibold mb-4">About This System</h2>
            <p className="text-base opacity-90 leading-relaxed">
              KMU Reports is a comprehensive digital platform designed to streamline incident reporting and case management within the university community. Our system ensures secure, confidential reporting while maintaining transparency and accountability in disciplinary processes.
            </p>
          </div>
        </div>
      </div>



      {/* Features Section */}
      <div className="py-16 bg-white dark:bg-gray-800">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center text-gray-900 dark:text-white mb-12">Our Services</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-6 text-center shadow-md hover:shadow-lg transition-shadow">
              <div className="w-16 h-16 bg-kmuGreen/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-kmuGreen" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Incident Reporting</h3>
              <p className="text-gray-600 dark:text-gray-300">
                Secure and anonymous submission of incidents related to academic integrity, misconduct, and safety concerns.
              </p>
            </div>
            <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-6 text-center shadow-md hover:shadow-lg transition-shadow">
              <div className="w-16 h-16 bg-kmuGreen/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-kmuGreen" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Real-time Tracking</h3>
              <p className="text-gray-600 dark:text-gray-300">
                Monitor the status of your reports and cases from submission to resolution.
              </p>
            </div>
            <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-6 text-center shadow-md hover:shadow-lg transition-shadow">
              <div className="w-16 h-16 bg-kmuGreen/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-kmuGreen" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Secure Processing</h3>
              <p className="text-gray-600 dark:text-gray-300">
                All reports are handled with the highest level of confidentiality and security.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Call to Action Section */}
      <div className="bg-gradient-to-r from-kmuGreen to-green-700 py-16">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Ready to Report an Incident?</h2>
          <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto">
            Submit a report securely or log in to access your dashboard and track your cases
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link 
              href="/public/report" 
              className="px-8 py-4 bg-white text-kmuGreen rounded-lg font-bold text-lg hover:bg-gray-100 transition-colors shadow-lg"
            >
              Submit Anonymous Report
            </Link>
            <Link 
              href="/login" 
              className="px-8 py-4 bg-kmuOrange text-white rounded-lg font-bold text-lg hover:bg-orange-600 transition-colors shadow-lg"
            >
              Student/Staff Login
            </Link>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <div className="flex items-center mb-4">
                <img 
                  src="/kmu_logo.svg" 
                  alt="KMU Reports Logo" 
                  className="w-10 h-10 mr-3"
                />
                <span className="text-xl font-bold">KMU Reports</span>
              </div>
              <p className="text-gray-400">
                A comprehensive digital platform for incident reporting and case management within Kampala Metropolitan University.
              </p>
            </div>
            <div>
              <h4 className="text-lg font-semibold mb-4">Quick Links</h4>
              <ul className="space-y-2">
                <li><Link href="/public/report" className="text-gray-400 hover:text-white transition-colors">Submit Report</Link></li>
                <li><Link href="/login" className="text-gray-400 hover:text-white transition-colors">Login</Link></li>
                <li><Link href="/help" className="text-gray-400 hover:text-white transition-colors">Help Center</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-lg font-semibold mb-4">Contact Support</h4>
              <ul className="space-y-2 text-gray-400">
                <li>IT Help Desk</li>
                <li>University Administration</li>
                <li>Academic Affairs Office</li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center">
            <p className="text-gray-400">
              &copy; {new Date().getFullYear()} KMU Reports. All rights reserved.
            </p>
            <p className="text-gray-500 text-sm mt-2">
              Developed by Daniel Chali & Grace Namonje
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}