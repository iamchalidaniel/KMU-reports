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
      <div className="bg-gradient-to-b from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 text-gray-900 dark:text-white py-16 md:py-24">
        <div className="container mx-auto px-4 text-center">
          <div className="flex justify-center mb-6 md:mb-8">
            <img 
              src="/kmu_logo.svg" 
              alt="Kapasa Makasa University Logo" 
              className="w-24 h-24 md:w-32 md:h-32 object-contain drop-shadow-lg"
            />
          </div>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-4 md:mb-6 text-kmuGreen">KMU Reports</h1>
          <p className="text-lg md:text-xl lg:text-2xl max-w-3xl md:max-w-4xl mx-auto text-gray-600 dark:text-gray-300 mb-8 md:mb-10">
            Comprehensive reporting platform for Kapasa Makasa University - facilitating academic integrity and campus infrastructure management
          </p>
          <div className="max-w-3xl md:max-w-4xl mx-auto bg-white dark:bg-gray-800 rounded-xl p-6 md:p-8 shadow-lg">
            <h2 className="text-xl md:text-2xl font-semibold mb-3 md:mb-4 text-kmuGreen">About This Platform</h2>
            <p className="text-base md:text-lg text-gray-700 dark:text-gray-300">
              KMU Reports is a comprehensive digital platform designed to facilitate structured incident reporting and case management within Kapasa Makasa University. Our system supports both student conduct proceedings and facility maintenance workflows, ensuring secure, confidential submissions while maintaining transparency and accountability in all university administrative processes. With integrated AI assistance, users can get real-time help with form completion and reporting procedures.
            </p>
          </div>
        </div>
      </div>



      {/* Features Section */}
      <div className="py-16 bg-gray-50 dark:bg-gray-900">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold text-center text-gray-900 dark:text-white mb-12 md:mb-16">Platform Capabilities</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 md:p-8 text-center shadow-md hover:shadow-lg transition-all duration-300">
              <div className="w-16 h-16 md:w-20 md:h-20 bg-kmuGreen/10 rounded-full flex items-center justify-center mx-auto mb-4 md:mb-6">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 md:h-10 md:w-10 text-kmuGreen" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="text-xl md:text-2xl font-semibold text-gray-900 dark:text-white mb-2 md:mb-4">Structured Reporting</h3>
              <p className="text-base md:text-lg text-gray-600 dark:text-gray-300">
                Secure and confidential submission of academic conduct matters and facility maintenance requests.
              </p>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 md:p-8 text-center shadow-md hover:shadow-lg transition-all duration-300">
              <div className="w-16 h-16 md:w-20 md:h-20 bg-kmuGreen/10 rounded-full flex items-center justify-center mx-auto mb-4 md:mb-6">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 md:h-10 md:w-10 text-kmuGreen" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-xl md:text-2xl font-semibold text-gray-900 dark:text-white mb-2 md:mb-4">Case Status Monitoring</h3>
              <p className="text-base md:text-lg text-gray-600 dark:text-gray-300">
                Track the progression of submissions from initial filing through final disposition.
              </p>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 md:p-8 text-center shadow-md hover:shadow-lg transition-all duration-300">
              <div className="w-16 h-16 md:w-20 md:h-20 bg-kmuGreen/10 rounded-full flex items-center justify-center mx-auto mb-4 md:mb-6">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 md:h-10 md:w-10 text-kmuGreen" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <h3 className="text-xl md:text-2xl font-semibold text-gray-900 dark:text-white mb-2 md:mb-4">Confidential Handling</h3>
              <p className="text-base md:text-lg text-gray-600 dark:text-gray-300">
                All submissions are processed with the highest standards of data protection and privacy.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Call to Action Section */}
      <div className="py-16 bg-gray-100 dark:bg-gray-800">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-gray-900 dark:text-white mb-4 md:mb-6">Initiate a Formal Submission</h2>
          <p className="text-base md:text-lg lg:text-xl text-gray-600 dark:text-gray-300 mb-8 md:mb-12 max-w-2xl md:max-w-3xl lg:max-w-4xl mx-auto">
            File an academic conduct matter or facility maintenance request through our secure portal, or log in to access your dashboard and monitor submission status
          </p>
          <div className="flex flex-col sm:flex-row gap-4 md:gap-6 justify-center">
            <Link 
              href="/public/report" 
              className="px-6 py-3 md:px-8 md:py-4 bg-kmuGreen text-white rounded-lg font-medium md:font-bold text-base md:text-lg hover:bg-green-700 transition-colors shadow-md"
            >
              File Academic Conduct Matter or Maintenance Request
            </Link>
            <Link 
              href="/login" 
              className="px-6 py-3 md:px-8 md:py-4 bg-kmuOrange text-white rounded-lg font-medium md:font-bold text-base md:text-lg hover:bg-orange-600 transition-colors shadow-md"
            >
              Student/Staff Login
            </Link>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-800 text-white py-12">
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
              <p className="text-gray-300 text-sm md:text-base">
                A comprehensive digital platform for incident reporting and case management within Kapasa Makasa University.
              </p>
            </div>
            <div>
              <h4 className="text-lg font-semibold mb-4">Platform Access</h4>
              <ul className="space-y-2">
                <li><Link href="/public/report" className="text-gray-300 hover:text-white transition-colors text-sm md:text-base block">File Submission</Link></li>
                <li><Link href="/login" className="text-gray-300 hover:text-white transition-colors text-sm md:text-base block">User Portal</Link></li>
                <li><Link href="/help" className="text-gray-300 hover:text-white transition-colors text-sm md:text-base block">Support Resources</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-lg font-semibold mb-4">Contact Support</h4>
              <ul className="space-y-2 text-gray-300 text-sm md:text-base">
                <li>IT Help Desk</li>
                <li>Academic Affairs Office</li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-700 mt-8 pt-6 text-center">
            <p className="text-gray-400 text-sm md:text-base">
              &copy; {new Date().getFullYear()} KMU Reports. All rights reserved.
            </p>
            <p className="text-gray-500 text-xs md:text-sm mt-2">
              Developed by Daniel Chali & Grace Namonje
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}