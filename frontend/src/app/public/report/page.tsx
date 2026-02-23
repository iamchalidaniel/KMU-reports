"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { API_BASE_URL } from '../../../config/constants';
import AIAssistant from '../../../components/AIAssistant';
import DarkModeToggle from '../../../components/DarkModeToggle';

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
      <div className="min-h-screen bg-white dark:bg-gray-950 flex flex-col">
        {/* Header */}
        <div className="border-b border-gray-200 dark:border-gray-800">
          <div className="container mx-auto px-4 py-2">
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
          </div>
        </div>

        <div className="flex-1 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl p-8 md:p-12 max-w-md w-full text-center">
            <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-8 h-8 text-kmuGreen" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">Report Submitted!</h1>
            <p className="text-gray-600 dark:text-gray-400 mb-8 text-lg">
              Thank you for your report. Our team will review it and take appropriate action.
            </p>
            
            {reportId && (
              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-5 mb-8">
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Reference Number</p>
                <p className="font-mono text-lg font-bold text-kmuGreen break-all">{reportId}</p>
              </div>
            )}
            
            <div className="space-y-3">
              <button
                onClick={() => {
                  setSuccess(false);
                  setReportId(null);
                }}
                className="w-full px-4 py-3 bg-kmuGreen text-white font-bold rounded-lg hover:bg-green-700 transition-colors"
              >
                Submit Another Report
              </button>
              
              <Link 
                href="/home"
                className="block w-full px-4 py-3 bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white font-bold rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
              >
                Back to Home
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950 flex flex-col">
      {/* Header */}
      <div className="border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
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
          <div className="flex items-center space-x-2">
            <Link 
              href="/home"
              className="px-4 py-1 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white font-medium transition-colors"
            >
              Back
            </Link>
            <DarkModeToggle />
          </div>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-2xl">
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4">File an Incident Report</h1>
            <p className="text-xl text-gray-600 dark:text-gray-400">
              Your report is confidential and will be reviewed by our team.
            </p>
          </div>

          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl p-8 md:p-12">
            <div className="flex items-start justify-between mb-8">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Incident Details</h2>
              </div>
              <div>
                <AIAssistant formType="case" />
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Incident Date */}
              <div>
                <label htmlFor="incident_date" className="block text-sm font-semibold text-gray-900 dark:text-white mb-3">
                  When did this happen?
                </label>
                <input
                  type="date"
                  id="incident_date"
                  name="incident_date"
                  value={formData.incident_date}
                  onChange={handleInputChange}
                  max={new Date().toISOString().split('T')[0]}
                  className="w-full px-4 py-3 border-2 border-gray-300 dark:border-gray-700 rounded-lg focus:border-kmuGreen focus:ring-0 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white transition-colors"
                />
              </div>

              {/* Offense Type */}
              <div>
                <label htmlFor="offense_type" className="block text-sm font-semibold text-gray-900 dark:text-white mb-3">
                  Type of Incident <span className="text-red-500">*</span>
                </label>
                <select
                  id="offense_type"
                  name="offense_type"
                  value={formData.offense_type}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-3 border-2 border-gray-300 dark:border-gray-700 rounded-lg focus:border-kmuGreen focus:ring-0 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white transition-colors"
                >
                  <option value="">Select incident type</option>
                  {offenseTypes.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>

              {/* Severity */}
              <div>
                <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-3">
                  How serious is this?
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {['Low', 'Medium', 'High'].map(level => (
                    <label 
                      key={level} 
                      className={`relative flex items-center justify-center p-4 rounded-lg border-2 cursor-pointer transition-all ${
                        formData.severity === level
                          ? 'border-kmuGreen bg-kmuGreen/5'
                          : 'border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 hover:border-gray-400 dark:hover:border-gray-600'
                      }`}
                    >
                      <input
                        type="radio"
                        name="severity"
                        value={level}
                        checked={formData.severity === level}
                        onChange={handleInputChange}
                        className="sr-only"
                      />
                      <span className={`font-semibold ${formData.severity === level ? 'text-kmuGreen' : 'text-gray-700 dark:text-gray-300'}`}>
                        {level}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Description */}
              <div>
                <label htmlFor="description" className="block text-sm font-semibold text-gray-900 dark:text-white mb-3">
                  What happened? <span className="text-red-500">*</span>
                </label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  required
                  rows={6}
                  placeholder="Please provide details about what happened, when, where, and any other relevant information..."
                  className="w-full px-4 py-3 border-2 border-gray-300 dark:border-gray-700 rounded-lg focus:border-kmuGreen focus:ring-0 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white transition-colors resize-none"
                />
                <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                  Minimum 10 characters. Be as detailed as possible.
                </p>
              </div>

              {/* Error Message */}
              {error && (
                <div className="bg-red-50 dark:bg-red-950/30 border-2 border-red-200 dark:border-red-900 text-red-700 dark:text-red-200 px-4 py-3 rounded-lg text-sm font-medium">
                  {error}
                </div>
              )}

              {/* Reporter Information (Optional) */}
              <div className="border-t-2 border-gray-200 dark:border-gray-800 pt-8">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Your Information</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
                  Optional - helps us follow up if needed.
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="reporter_name" className="block text-sm font-semibold text-gray-900 dark:text-white mb-3">
                      Your Name
                    </label>
                    <input
                      type="text"
                      id="reporter_name"
                      name="reporter_name"
                      value={formData.reporter_name}
                      onChange={handleInputChange}
                      placeholder="Leave blank to stay anonymous"
                      className="w-full px-4 py-3 border-2 border-gray-300 dark:border-gray-700 rounded-lg focus:border-kmuGreen focus:ring-0 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white transition-colors"
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="reporter_contact" className="block text-sm font-semibold text-gray-900 dark:text-white mb-3">
                      Contact Information
                    </label>
                    <input
                      type="text"
                      id="reporter_contact"
                      name="reporter_contact"
                      value={formData.reporter_contact}
                      onChange={handleInputChange}
                      placeholder="Email or phone"
                      className="w-full px-4 py-3 border-2 border-gray-300 dark:border-gray-700 rounded-lg focus:border-kmuGreen focus:ring-0 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white transition-colors"
                    />
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <div className="flex flex-col sm:flex-row gap-4 pt-8">
                <button
                  type="submit"
                  disabled={loading}
                  className={`flex-1 px-6 py-4 rounded-lg font-bold text-lg transition-all duration-200 ${
                    loading 
                      ? 'bg-gray-400 text-white cursor-not-allowed' 
                      : 'bg-kmuGreen text-white hover:bg-green-700 active:scale-95'
                  }`}
                >
                  {loading ? (
                    <span className="flex items-center justify-center">
                      <span className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent mr-2"></span>
                      Submitting...
                    </span>
                  ) : (
                    'Submit Report'
                  )}
                </button>
                
                <button
                  type="button"
                  onClick={() => router.back()}
                  className="px-6 py-4 bg-gray-200 dark:bg-gray-800 text-gray-900 dark:text-white rounded-lg font-bold hover:bg-gray-300 dark:hover:bg-gray-700 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>

          {/* Privacy Notice */}
          <div className="mt-12 mx-auto w-full max-w-2xl">
            <div className="bg-blue-50 dark:bg-blue-950/40 border-2 border-blue-200 dark:border-blue-900 rounded-xl p-6 md:p-8">
              <h3 className="font-bold text-blue-900 dark:text-blue-200 mb-3 flex items-center">
                <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                </svg>
                Your Privacy is Protected
              </h3>
              <p className="text-blue-800 dark:text-blue-300 text-sm leading-relaxed">
                All reports are handled confidentially. You can submit anonymously without providing your name or contact information. If you do provide contact details, they will only be used for follow-up with your consent and in accordance with university policies.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
