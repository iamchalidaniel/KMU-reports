"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { API_BASE_URL } from '../../../config/constants';

interface FormData {
  incident_date: string;
  description: string;
  offense_type: string;
  severity: string;
  reporter_name: string;
  reporter_contact: string;
}

export default function PublicReportPage() {
  const router = useRouter();
  const [formData, setFormData] = useState<FormData>({
    incident_date: '',
    description: '',
    offense_type: '',
    severity: 'Medium',
    reporter_name: '',
    reporter_contact: ''
  });
  
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [reportId, setReportId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const offenseTypes = [
    'Academic Dishonesty',
    'Harassment',
    'Theft',
    'Vandalism',
    'Substance Abuse',
    'Violence/Threats',
    'Cyberbullying',
    'Inappropriate Behavior',
    'Safety Violation',
    'Other'
  ];

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error when user starts typing
    if (error) setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    // Validation
    if (!formData.description.trim()) {
      setError('Description is required');
      return;
    }
    
    if (formData.description.trim().length < 10) {
      setError('Description must be at least 10 characters long');
      return;
    }
    
    if (!formData.offense_type) {
      setError('Please select an offense type');
      return;
    }
    
    setLoading(true);
    
    try {
      const response = await fetch(`${API_BASE_URL}/public/anonymous-report`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData)
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to submit report');
      }
      
      setSuccess(true);
      setReportId(result.reportId);
      setFormData({
        incident_date: '',
        description: '',
        offense_type: '',
        severity: 'Medium',
        reporter_name: '',
        reporter_contact: ''
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        {/* Navigation Bar */}
        <nav className="bg-white dark:bg-gray-800 shadow-sm">
          <div className="container mx-auto px-4 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <Link href="/home" className="flex items-center space-x-2">
                  <img 
                    src="/kmu_logo.svg" 
                    alt="KMU Logo" 
                    width={40} 
                    height={40} 
                    className="h-10 w-10 object-contain"
                  />
                  <span className="text-xl font-bold text-gray-900 dark:text-white">KMU Reports</span>
                </Link>
              </div>
              <div className="flex items-center space-x-4">
                <Link 
                  href="/home"
                  className="text-kmuGreen hover:text-green-700 font-medium text-sm"
                >
                  Home
                </Link>
                <Link 
                  href="/login"
                  className="px-4 py-2 bg-kmuGreen text-white rounded-lg text-sm hover:bg-green-700 transition-colors"
                >
                  Login
                </Link>
              </div>
            </div>
          </div>
        </nav>

        <div className="flex items-center justify-center p-4 min-h-[calc(100vh-73px)]">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl p-8 max-w-md w-full text-center">
            <div className="text-6xl mb-4">✅</div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Report Submitted Successfully!</h1>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              Thank you for submitting your report. Our team will review it and take appropriate action.
            </p>
            
            {reportId && (
              <div className="bg-gray-100 dark:bg-gray-700 rounded-lg p-4 mb-6">
                <p className="text-sm text-gray-600 dark:text-gray-300">Report ID (for reference):</p>
                <p className="font-mono text-lg font-bold text-kmuGreen break-all">{reportId}</p>
              </div>
            )}
            
            <div className="space-y-3">
              <button
                onClick={() => {
                  setSuccess(false);
                  setReportId(null);
                }}
                className="w-full px-4 py-2 bg-kmuGreen text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                Submit Another Report
              </button>
              
              <Link 
                href="/home"
                className="block w-full px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-white rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors text-center"
              >
                Back to Homepage
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Navigation Bar */}
      <nav className="bg-white dark:bg-gray-800 shadow-sm">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link href="/home" className="flex items-center space-x-2">
                <img 
                  src="/kmu_logo.svg" 
                  alt="KMU Logo" 
                  width={40} 
                  height={40} 
                  className="h-10 w-10 object-contain"
                />
                <span className="text-xl font-bold text-gray-900 dark:text-white">KMU Reports</span>
              </Link>
            </div>
            <div className="flex items-center space-x-4">
              <Link 
                href="/home"
                className="text-kmuGreen hover:text-green-700 font-medium text-sm"
              >
                Home
              </Link>
              <Link 
                href="/login"
                className="px-4 py-2 bg-kmuGreen text-white rounded-lg text-sm hover:bg-green-700 transition-colors"
              >
                Login
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 md:p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Anonymous Incident Report</h1>
            <p className="text-gray-600 dark:text-gray-300">
              Submit a report about an incident you witnessed or experienced. All information is kept confidential.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Incident Date */}
            <div>
              <label htmlFor="incident_date" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Incident Date
              </label>
              <input
                type="date"
                id="incident_date"
                name="incident_date"
                value={formData.incident_date}
                onChange={handleInputChange}
                max={new Date().toISOString().split('T')[0]}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-kmuGreen focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Date when the incident occurred (cannot be in the future)
              </p>
            </div>

            {/* Offense Type */}
            <div>
              <label htmlFor="offense_type" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Type of Incident *
              </label>
              <select
                id="offense_type"
                name="offense_type"
                value={formData.offense_type}
                onChange={handleInputChange}
                required
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-kmuGreen focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="">Select incident type</option>
                {offenseTypes.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>

            {/* Severity */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Severity Level
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {['Low', 'Medium', 'High'].map(level => (
                  <label key={level} className="flex items-center p-3 border border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700">
                    <input
                      type="radio"
                      name="severity"
                      value={level}
                      checked={formData.severity === level}
                      onChange={handleInputChange}
                      className="h-4 w-4 text-kmuGreen focus:ring-kmuGreen"
                    />
                    <span className="ml-2 text-gray-700 dark:text-gray-300">{level}</span>
                  </label>
                ))}
              </div>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Low: Minor infractions, Medium: Moderate concerns, High: Serious incidents requiring immediate attention
              </p>
            </div>

            {/* Description */}
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Incident Description *
              </label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                required
                rows={6}
                placeholder="Please provide a detailed description of the incident, including what happened, when, where, and any relevant details..."
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-kmuGreen focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Minimum 10 characters. Please be as detailed as possible.
              </p>
            </div>

            {/* Reporter Information (Optional) */}
            <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Your Information (Optional)</h3>
              <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
                Providing your information helps us follow up if needed, but is not required for anonymous reporting.
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="reporter_name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Your Name
                  </label>
                  <input
                    type="text"
                    id="reporter_name"
                    name="reporter_name"
                    value={formData.reporter_name}
                    onChange={handleInputChange}
                    placeholder="Optional"
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-kmuGreen focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
                
                <div>
                  <label htmlFor="reporter_contact" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Contact Information
                  </label>
                  <input
                    type="text"
                    id="reporter_contact"
                    name="reporter_contact"
                    value={formData.reporter_contact}
                    onChange={handleInputChange}
                    placeholder="Email or phone (optional)"
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-kmuGreen focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                <div className="flex items-center">
                  <span className="text-red-500 mr-2">⚠️</span>
                  <span className="text-red-700 dark:text-red-300">{error}</span>
                </div>
              </div>
            )}

            {/* Submit Button */}
            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 px-6 py-3 bg-kmuGreen text-white rounded-lg font-medium hover:bg-green-700 focus:ring-2 focus:ring-kmuGreen focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? (
                  <span className="flex items-center justify-center">
                    <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></span>
                    Submitting...
                  </span>
                ) : (
                  'Submit Anonymous Report'
                )}
              </button>
              
              <button
                type="button"
                onClick={() => router.back()}
                className="px-6 py-3 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-white rounded-lg font-medium hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>

        {/* Privacy Notice */}
        <div className="mt-8 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6">
          <h3 className="font-medium text-blue-800 dark:text-blue-200 mb-2">🔒 Privacy Notice</h3>
          <p className="text-blue-700 dark:text-blue-300 text-sm">
            Your report will be submitted anonymously and reviewed by authorized personnel only. 
            If you provided contact information, it will only be used for follow-up purposes with your consent.
            All reports are handled with the utmost confidentiality and in accordance with university policies.
          </p>
        </div>
      </div>
    </div>
  );
}