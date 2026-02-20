"use client";

import { useState } from 'react';
import Link from 'next/link';


interface HomepageData {
  // All stats removed for simplified public view
}

export default function HomePage() {
  // Simplified homepage - no API calls needed



  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      {/* Hero Section */}
      <div className="bg-gradient-to-b from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 text-gray-900 dark:text-white py-20">
        <div className="container mx-auto px-4 text-center">
          <div className="flex justify-center mb-8">
            <img 
              src="/kmu_logo.svg" 
              alt="Kapasa Makasa University Logo" 
              className="w-32 h-32 md:w-40 md:h-40 object-contain drop-shadow-lg"
            />
          </div>
          <h1 className="text-5xl md:text-6xl font-bold mb-6 text-kmuGreen tracking-tight">KMU Reports</h1>
          <p className="text-xl md:text-2xl max-w-4xl mx-auto text-gray-600 dark:text-gray-300 mb-10 leading-relaxed">
            Comprehensive reporting platform for Kapasa Makasa University - facilitating academic integrity and campus infrastructure management
          </p>
          <div className="max-w-4xl mx-auto bg-gray-50 dark:bg-gray-800 rounded-2xl p-8 shadow-xl">
            <h2 className="text-2xl font-semibold mb-4 text-kmuGreen">About This Platform</h2>
            <p className="text-lg text-gray-700 dark:text-gray-300 leading-relaxed">
              KMU Reports is a comprehensive digital platform designed to facilitate structured incident reporting and case management within Kapasa Makasa University. Our system supports both student conduct proceedings and facility maintenance workflows, ensuring secure, confidential submissions while maintaining transparency and accountability in all university administrative processes. With integrated AI assistance, users can get real-time help with form completion and reporting procedures.
            </p>
          </div>
        </div>
      </div>



      {/* Features Section */}
      <div className="py-20 bg-gradient-to-b from-gray-50/50 to-gray-100 dark:from-gray-800/50 dark:to-gray-900">
        <div className="container mx-auto px-4">
          <h2 className="text-4xl font-bold text-center text-gray-900 dark:text-white mb-16">Platform Capabilities</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            <div className="bg-gray-50 dark:bg-gray-800 rounded-2xl p-8 text-center shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1">
              <div className="w-20 h-20 bg-kmuGreen/10 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-kmuGreen" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">Structured Reporting</h3>
              <p className="text-lg text-gray-600 dark:text-gray-300">
                Secure and confidential submission of academic conduct matters and facility maintenance requests.
              </p>
            </div>
            <div className="bg-gray-50 dark:bg-gray-800 rounded-2xl p-8 text-center shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1">
              <div className="w-20 h-20 bg-kmuGreen/10 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-kmuGreen" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">Case Status Monitoring</h3>
              <p className="text-lg text-gray-600 dark:text-gray-300">
                Track the progression of submissions from initial filing through final disposition.
              </p>
            </div>
            <div className="bg-gray-50 dark:bg-gray-800 rounded-2xl p-8 text-center shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1">
              <div className="w-20 h-20 bg-kmuGreen/10 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-kmuGreen" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <h3 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">Confidential Handling</h3>
              <p className="text-lg text-gray-600 dark:text-gray-300">
                All submissions are processed with the highest standards of data protection and privacy.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Call to Action Section */}
      <div className="py-20 bg-gradient-to-b from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-6">Initiate a Formal Submission</h2>
          <p className="text-xl text-gray-600 dark:text-gray-300 mb-12 max-w-3xl mx-auto leading-relaxed">
            File an academic conduct matter or facility maintenance request through our secure portal, or log in to access your dashboard and monitor submission status
          </p>
          <div className="flex flex-col sm:flex-row gap-6 justify-center">
            <Link 
              href="/public/report" 
              className="px-10 py-5 bg-gradient-to-r from-kmuGreen to-green-600 text-white rounded-xl font-bold text-xl hover:from-green-700 hover:to-green-800 transition-all duration-300 shadow-xl hover:shadow-2xl transform hover:-translate-y-0.5"
            >
              File Academic Conduct Matter or Maintenance Request
            </Link>
            <Link 
              href="/login" 
              className="px-10 py-5 bg-gradient-to-r from-kmuOrange to-orange-600 text-white rounded-xl font-bold text-xl hover:from-orange-600 hover:to-orange-700 transition-all duration-300 shadow-xl hover:shadow-2xl transform hover:-translate-y-0.5"
            >
              Student/Staff Login
            </Link>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gradient-to-t from-gray-800 to-gray-900 text-white py-16">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            <div>
              <div className="flex items-center mb-6">
                <img 
                  src="/kmu_logo.svg" 
                  alt="KMU Reports Logo" 
                  className="w-12 h-12 mr-4"
                />
                <span className="text-2xl font-bold">KMU Reports</span>
              </div>
              <p className="text-gray-300 text-lg">
                A comprehensive digital platform for incident reporting and case management within Kapasa Makasa University.
              </p>
            </div>
            <div>
              <h4 className="text-xl font-semibold mb-6">Platform Access</h4>
              <ul className="space-y-3">
                <li><Link href="/public/report" className="text-gray-300 hover:text-white transition-colors text-lg block">File Submission</Link></li>
                <li><Link href="/login" className="text-gray-300 hover:text-white transition-colors text-lg block">User Portal</Link></li>
                <li><Link href="/help" className="text-gray-300 hover:text-white transition-colors text-lg block">Support Resources</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-xl font-semibold mb-6">Contact Support</h4>
              <ul className="space-y-3 text-gray-300 text-lg">
                <li>IT Help Desk</li>
                <li>Academic Affairs Office</li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-700 mt-12 pt-8 text-center">
            <p className="text-gray-400 text-lg">
              &copy; {new Date().getFullYear()} KMU Reports. All rights reserved.
            </p>
            <p className="text-gray-500 text-base mt-3">
              Developed by Daniel Chali & Grace Namonje
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}