"use client";

import { useRouter } from "next/navigation";
import { useAuth } from "../../context/AuthContext";
import { useState } from 'react';

export default function HelpPage() {
  return (
    <div className="max-w-5xl mx-auto px-6 py-12">
      <div className="text-center mb-16">
        <div className="inline-flex items-center px-4 py-1.5 rounded-full bg-emerald-50 dark:bg-emerald-900/30 border border-emerald-100 dark:border-emerald-800 text-kmuGreen text-xs font-bold mb-6">
          📖 USER DOCUMENTATION & SUPPORT
        </div>
        <h1 className="text-4xl md:text-6xl font-extrabold mb-6 text-gray-900 dark:text-white tracking-tight">Help & <span className="text-kmuGreen">Support</span></h1>
        <p className="text-gray-600 dark:text-gray-400 text-lg md:text-xl max-w-2xl mx-auto leading-relaxed">
          Need assistance? Our comprehensive guides and FAQs are here to help you navigate CampusCare with ease.
        </p>
      </div>

      {/* Quick Start Guide */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-8">
        <h2 className="text-2xl font-semibold mb-4 text-kmuOrange">🚀 Quick Start Guide</h2>
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <h3 className="text-lg font-medium mb-3 text-kmuGreen">For New Users</h3>
            <ul className="space-y-2 text-gray-600 dark:text-gray-400">
              <li>• Use the sidebar to navigate between different sections</li>
              <li>• Click "+ New Case" to report a new disciplinary case</li>
              <li>• Search for students or staff by name or ID to view their history</li>
              <li>• Use the search and filter options to find specific cases</li>
              <li>• Export data using the export buttons in dashboards</li>
            </ul>
          </div>
          <div>
            <h3 className="text-lg font-medium mb-3 text-kmuGreen">Navigation Tips</h3>
            <ul className="space-y-2 text-gray-600 dark:text-gray-400">
              <li>• Toggle dark mode using the button in the sidebar</li>
              <li>• Check audit logs for system activity</li>
              <li>• Update your profile and settings as needed</li>
              <li>• Use the audit logs for transparency tracking</li>
            </ul>
          </div>
        </div>
      </div>




      {/* Key Features */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-8">
        <h2 className="text-2xl font-semibold mb-4 text-kmuOrange">✨ Key Features</h2>
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <h3 className="text-lg font-medium mb-3 text-kmuGreen">Case Management</h3>
            <ul className="space-y-2 text-gray-600 dark:text-gray-400">
              <li>• <strong>Predefined Offense Types:</strong> Academic Dishonesty, Fighting, Drug/Alcohol, Theft, Vandalism, Harassment, etc.</li>
              <li>• <strong>Severity Levels:</strong> Low, Medium, High, Critical</li>
              <li>• <strong>Case Status:</strong> Open, Under Investigation, Closed, Appealed</li>
              <li>• <strong>Guided Descriptions:</strong> Dynamic placeholders based on offense type</li>
              <li>• <strong>Sanctions Tracking:</strong> Optional disciplinary measures</li>
            </ul>
          </div>
          <div>
            <h3 className="text-lg font-medium mb-3 text-kmuGreen">Advanced Features</h3>
            <ul className="space-y-2 text-gray-600 dark:text-gray-400">
              <li>• <strong>Evidence Management:</strong> Upload and manage case evidence files</li>
              <li>• <strong>Audit Logging:</strong> Complete transparency and accountability</li>
              <li>• <strong>Export Options:</strong> DOCX and Excel formats</li>
              <li>• <strong>Search & Filter:</strong> Find cases and people quickly</li>
              <li>• <strong>Offline Support:</strong> Work without internet connection</li>
            </ul>
          </div>
        </div>
      </div>

      {/* How-To Guides */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-8">
        <h2 className="text-2xl font-semibold mb-4 text-kmuOrange">📋 How-To Guides</h2>
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-medium mb-3 text-kmuGreen">Creating a New Case</h3>
            <ol className="list-decimal list-inside space-y-2 text-gray-600 dark:text-gray-400">
              <li>Navigate to "Cases" → "New Case" or click "+ New Case" in the top bar</li>
              <li>Choose between Student Case or Staff Case</li>
              <li>Search and select the person involved</li>
              <li>Enter the incident date</li>
              <li>Select the offense type from the dropdown</li>
              <li>Choose the severity level</li>
              <li>Write a detailed description (guided by offense type)</li>
              <li>Add any sanctions applied (optional)</li>
              <li>Click "Create Case" to submit</li>
            </ol>
          </div>
          <div>
            <h3 className="text-lg font-medium mb-3 text-kmuGreen">Managing Cases</h3>
            <ol className="list-decimal list-inside space-y-2 text-gray-600 dark:text-gray-400">
              <li>View all cases in the "Cases" section</li>
              <li>Use search and filters to find specific cases</li>
              <li>Click "View Details" to see full case information</li>
              <li>Update case status (Open/Closed) as needed</li>
              <li>Add evidence files if required</li>
              <li>Export case data for reporting</li>
            </ol>
          </div>
          <div>
            <h3 className="text-lg font-medium mb-3 text-kmuGreen">Person Management</h3>
            <ol className="list-decimal list-inside space-y-2 text-gray-600 dark:text-gray-400">
              <li>View all students in the "Students" section</li>
              <li>View all staff in the "Staff" section</li>
              <li>Search by name or ID</li>
              <li>Click on a person's name to view their profile</li>
              <li>See their complete case history</li>
              <li>Add new cases directly from their profile</li>
              <li>Export records as needed</li>
            </ol>
          </div>
        </div>
      </div>

      {/* Staff Cases Information */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-8">
        <h2 className="text-2xl font-semibold mb-4 text-kmuOrange">👥 Staff Cases</h2>
        <div className="space-y-4">
          <p className="text-gray-600 dark:text-gray-400">
            CampusCare now supports incident reports for both students and staff members.
            This feature allows you to manage security concerns, facility issues, conduct violations, and other
            campus safety matters involving all university community members.
          </p>

          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-medium mb-3 text-kmuGreen">Staff Case Features</h3>
              <ul className="space-y-2 text-gray-600 dark:text-gray-400">
                <li>• Create cases for individual staff members</li>
                <li>• Track disciplinary actions for multiple staff</li>
                <li>• View staff member profiles and case history</li>
                <li>• Manage staff information and details</li>
                <li>• Export staff case reports</li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-medium mb-3 text-kmuGreen">Staff Management</h3>
              <ul className="space-y-2 text-gray-600 dark:text-gray-400">
                <li>• Add new staff members to the system</li>
                <li>• Bulk import staff via CSV/Excel files</li>
                <li>• Search and filter staff by department/position</li>
                <li>• Track recent staff interactions</li>
                <li>• Maintain staff directory</li>
              </ul>
            </div>
          </div>

          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded p-4">
            <h4 className="font-medium text-blue-800 dark:text-blue-200 mb-2">Getting Started with Staff Cases</h4>
            <p className="text-blue-700 dark:text-blue-300 text-sm">
              To create a staff case, navigate to "Cases" → "New Case" and select "Staff Case" from the case type options.
              Then search for the staff member by name or ID, fill in the case details, and submit.
            </p>
          </div>
        </div>
      </div>

      {/* Footer with Developer Info */}
      <footer className="bg-gray-100 dark:bg-gray-900 rounded-lg shadow p-6 text-center">
        <div className="text-gray-600 dark:text-gray-400">
          <p className="mb-2">
            <strong>CampusCare</strong> - AI-Powered Campus Safety Reporting System
          </p>
          <p className="text-sm">
            Developed by: <strong>Chali Daniel & Grace Namonje</strong> | 2025
          </p>
          <p className="text-xs mt-2">
            © 2025 Kapasa Makasa University. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
