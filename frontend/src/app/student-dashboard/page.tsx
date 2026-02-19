"use client";

import { useAuth } from '../../context/AuthContext';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { API_BASE_URL } from '../../config/constants';
import { authHeaders } from '../../utils/api';
import { OFFENSE_TYPES, SEVERITY_LEVELS } from '../../config/constants';
import Notification, { useNotification } from '../../components/Notification';

interface Report {
  _id: string;
  incidentDate: string;
  description: string;
  offenseType: string;
  severity: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  appealStatus?: string;
  appealReason?: string;
}

interface Appeal {
  _id: string;
  reportId: string;
  reason: string;
  status: string;
  adminResponse?: string;
  createdAt: string;
  updatedAt: string;
}

export default function StudentDashboardPage() {
  const { user, token, loading: authLoading } = useAuth();
  const router = useRouter();
  const { notification, showNotification, hideNotification } = useNotification();

  // Authentication checks
  if (typeof window !== 'undefined') {
    if (!authLoading && !token) {
      router.replace('/login');
      return <div className="text-center text-kmuGreen">Redirecting to login...</div>;
    }

    if (authLoading) {
      return <div className="text-center text-kmuGreen">Loading...</div>;
    }

    if (!user || user.role !== 'student') {
      return <div className="text-red-600">Access denied. This page is for students only.</div>;
    }
  }

  // Form state
  const [incidentDate, setIncidentDate] = useState('');
  const [offenseType, setOffenseType] = useState('');
  const [severity, setSeverity] = useState('');
  const [description, setDescription] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  // Reports and appeals state
  const [reports, setReports] = useState<Report[]>([]);
  const [appeals, setAppeals] = useState<Appeal[]>([]);
  const [loadingReports, setLoadingReports] = useState(true);
  const [activeTab, setActiveTab] = useState<'submit' | 'myReports' | 'appeals'>('myReports');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [total, setTotal] = useState(0);
  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch] = useState('');

  // Fetch student's reports
  useEffect(() => {
    if (user?.studentId) {
      fetchReports();
    }
  }, [user?.studentId, page, statusFilter, search]);

  // Fetch appeals
  useEffect(() => {
    if (user?.studentId && activeTab === 'appeals') {
      fetchAppeals();
    }
  }, [user?.studentId, activeTab]);

  const fetchReports = async () => {
    setLoadingReports(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
      });

      if (statusFilter) params.append('status', statusFilter);
      if (search) params.append('search', search);

      const res = await fetch(`${API_BASE_URL}/api/student-reports?${params}`, {
        headers: { ...authHeaders() },
      });

      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      setReports(data.reports || []);
      setTotal(data.total || 0);
    } catch (err: any) {
      console.error('Failed to fetch reports:', err);
      showNotification('error', 'Failed to load reports');
    } finally {
      setLoadingReports(false);
    }
  };

  const fetchAppeals = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/appeals?studentId=${user?.studentId}`, {
        headers: { ...authHeaders() },
      });

      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      setAppeals(data.appeals || []);
    } catch (err: any) {
      console.error('Failed to fetch appeals:', err);
      showNotification('error', 'Failed to load appeals');
    }
  };

  // Validate form
  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!incidentDate) {
      newErrors.incidentDate = 'Incident date is required';
    } else {
      const selectedDate = new Date(incidentDate);
      const today = new Date();
      if (selectedDate > today) {
        newErrors.incidentDate = 'Incident date cannot be in the future';
      }
    }

    if (!offenseType) {
      newErrors.offenseType = 'Please select an offense type';
    }

    if (!severity) {
      newErrors.severity = 'Please select severity level';
    }

    if (!description.trim()) {
      newErrors.description = 'Description is required';
    } else if (description.trim().length < 10) {
      newErrors.description = 'Description must be at least 10 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Submit report
  const handleSubmitReport = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setSubmitting(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/student-reports`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...authHeaders(),
        },
        body: JSON.stringify({
          incident_date: incidentDate,
          offense_type: offenseType,
          severity,
          description: description.trim(),
        }),
      });

      if (!res.ok) throw new Error(await res.text());

      showNotification('success', 'Report submitted successfully! Admin will review your report shortly.');
      
      // Reset form
      setIncidentDate('');
      setOffenseType('');
      setSeverity('');
      setDescription('');
      setErrors({});

      // Refresh reports
      setPage(1);
      await fetchReports();
      setActiveTab('myReports');
    } catch (err: any) {
      console.error('Failed to submit report:', err);
      showNotification('error', 'Failed to submit report. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  // Submit appeal
  const handleSubmitAppeal = async (reportId: string, reason: string) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/appeals`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...authHeaders(),
        },
        body: JSON.stringify({
          reportId,
          reason,
        }),
      });

      if (!res.ok) throw new Error(await res.text());

      showNotification('success', 'Appeal submitted successfully');
      await fetchReports();
      await fetchAppeals();
    } catch (err: any) {
      console.error('Failed to submit appeal:', err);
      showNotification('error', 'Failed to submit appeal. Please try again.');
    }
  };

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'open':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'closed':
      case 'resolved':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'in appeal':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200';
      case 'appeal rejected':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
    }
  };

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-kmuGreen mb-2">Student Dashboard</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Welcome, {user?.name || user?.username}. Manage your reports and appeals here.
          </p>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 border-b border-gray-200 dark:border-gray-700">
          <button
            onClick={() => setActiveTab('myReports')}
            className={`px-4 py-2 font-medium transition-colors ${
              activeTab === 'myReports'
                ? 'border-b-2 border-kmuGreen text-kmuGreen'
                : 'text-gray-600 dark:text-gray-400 hover:text-kmuGreen'
            }`}
          >
            My Reports ({total})
          </button>
          <button
            onClick={() => setActiveTab('submit')}
            className={`px-4 py-2 font-medium transition-colors ${
              activeTab === 'submit'
                ? 'border-b-2 border-kmuGreen text-kmuGreen'
                : 'text-gray-600 dark:text-gray-400 hover:text-kmuGreen'
            }`}
          >
            Submit Report
          </button>
          <button
            onClick={() => setActiveTab('appeals')}
            className={`px-4 py-2 font-medium transition-colors ${
              activeTab === 'appeals'
                ? 'border-b-2 border-kmuGreen text-kmuGreen'
                : 'text-gray-600 dark:text-gray-400 hover:text-kmuGreen'
            }`}
          >
            Appeals ({appeals.length})
          </button>
        </div>

        {/* Submit Report Tab */}
        {activeTab === 'submit' && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-6">
            <h2 className="text-2xl font-bold text-kmuGreen mb-6">Submit a Report</h2>

            <form onSubmit={handleSubmitReport} className="space-y-6">
              {/* Incident Date */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Incident Date *
                </label>
                <input
                  type="date"
                  value={incidentDate}
                  onChange={(e) => setIncidentDate(e.target.value)}
                  className={`w-full px-4 py-2 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white ${
                    errors.incidentDate ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                  }`}
                />
                {errors.incidentDate && (
                  <p className="text-red-500 text-sm mt-1">{errors.incidentDate}</p>
                )}
              </div>

              {/* Offense Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Offense Type *
                </label>
                <select
                  value={offenseType}
                  onChange={(e) => setOffenseType(e.target.value)}
                  className={`w-full px-4 py-2 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white ${
                    errors.offenseType ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                  }`}
                >
                  <option value="">Select offense type...</option>
                  {OFFENSE_TYPES.map((ot) => (
                    <option key={ot.value} value={ot.value}>
                      {ot.label}
                    </option>
                  ))}
                </select>
                {errors.offenseType && (
                  <p className="text-red-500 text-sm mt-1">{errors.offenseType}</p>
                )}
              </div>

              {/* Severity */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Severity Level *
                </label>
                <select
                  value={severity}
                  onChange={(e) => setSeverity(e.target.value)}
                  className={`w-full px-4 py-2 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white ${
                    errors.severity ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                  }`}
                >
                  <option value="">Select severity level...</option>
                  {SEVERITY_LEVELS.map((sv) => (
                    <option key={sv} value={sv}>
                      {sv}
                    </option>
                  ))}
                </select>
                {errors.severity && (
                  <p className="text-red-500 text-sm mt-1">{errors.severity}</p>
                )}
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Description *
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe the incident in detail..."
                  rows={5}
                  className={`w-full px-4 py-2 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white ${
                    errors.description ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                  }`}
                />
                {errors.description && (
                  <p className="text-red-500 text-sm mt-1">{errors.description}</p>
                )}
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  Minimum 10 characters required
                </p>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-kmuGreen text-white py-2 rounded-lg font-medium hover:bg-kmuGreen/90 transition disabled:opacity-50"
              >
                {submitting ? 'Submitting...' : 'Submit Report'}
              </button>
            </form>
          </div>
        )}

        {/* My Reports Tab */}
        {activeTab === 'myReports' && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h2 className="text-2xl font-bold text-kmuGreen mb-4">My Reports</h2>

            {/* Filters */}
            <div className="flex flex-col md:flex-row gap-4 mb-6">
              <input
                type="text"
                placeholder="Search reports..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setPage(1);
                }}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="">All Statuses</option>
                <option value="Open">Open</option>
                <option value="Pending">Pending</option>
                <option value="Closed">Closed</option>
                <option value="In Appeal">In Appeal</option>
              </select>
            </div>

            {/* Reports Table */}
            {loadingReports ? (
              <div className="text-center py-8">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-kmuGreen"></div>
              </div>
            ) : reports.length === 0 ? (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                No reports submitted yet. Create your first report to get started.
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-100 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
                      <tr>
                        <th className="px-4 py-2 text-left font-semibold text-gray-700 dark:text-gray-300">
                          Date
                        </th>
                        <th className="px-4 py-2 text-left font-semibold text-gray-700 dark:text-gray-300">
                          Description
                        </th>
                        <th className="px-4 py-2 text-left font-semibold text-gray-700 dark:text-gray-300">
                          Type
                        </th>
                        <th className="px-4 py-2 text-left font-semibold text-gray-700 dark:text-gray-300">
                          Status
                        </th>
                        <th className="px-4 py-2 text-left font-semibold text-gray-700 dark:text-gray-300">
                          Severity
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {reports.map((report) => (
                        <tr
                          key={report._id}
                          className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700"
                        >
                          <td className="px-4 py-2 text-gray-900 dark:text-white">
                            {formatDate(report.incidentDate)}
                          </td>
                          <td className="px-4 py-2 text-gray-900 dark:text-white truncate max-w-xs">
                            {report.description}
                          </td>
                          <td className="px-4 py-2 text-gray-900 dark:text-white text-xs">
                            {report.offenseType}
                          </td>
                          <td className="px-4 py-2">
                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(report.status)}`}>
                              {report.status}
                            </span>
                          </td>
                          <td className="px-4 py-2">
                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                              report.severity === 'High'
                                ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                                : report.severity === 'Medium'
                                ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                                : 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                            }`}>
                              {report.severity}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex justify-center gap-2 mt-6">
                    <button
                      onClick={() => setPage(Math.max(1, page - 1))}
                      disabled={page === 1}
                      className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg disabled:opacity-50 hover:bg-gray-50 dark:hover:bg-gray-700"
                    >
                      Previous
                    </button>
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                      <button
                        key={p}
                        onClick={() => setPage(p)}
                        className={`px-4 py-2 rounded-lg ${
                          page === p
                            ? 'bg-kmuGreen text-white'
                            : 'border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
                        }`}
                      >
                        {p}
                      </button>
                    ))}
                    <button
                      onClick={() => setPage(Math.min(totalPages, page + 1))}
                      disabled={page === totalPages}
                      className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg disabled:opacity-50 hover:bg-gray-50 dark:hover:bg-gray-700"
                    >
                      Next
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* Appeals Tab */}
        {activeTab === 'appeals' && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h2 className="text-2xl font-bold text-kmuGreen mb-6">My Appeals</h2>

            {appeals.length === 0 ? (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                No appeals submitted yet. You can appeal a closed report to request a review.
              </div>
            ) : (
              <div className="space-y-4">
                {appeals.map((appeal) => (
                  <div key={appeal._id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="font-semibold text-gray-900 dark:text-white">
                          Appeal for Report {appeal.reportId?.substring(0, 8)}...
                        </h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                          Submitted: {formatDate(appeal.createdAt)}
                        </p>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(appeal.status)}`}>
                        {appeal.status}
                      </span>
                    </div>
                    <div className="space-y-2">
                      <div>
                        <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          Appeal Reason:
                        </p>
                        <p className="text-gray-900 dark:text-gray-100">{appeal.reason}</p>
                      </div>
                      {appeal.adminResponse && (
                        <div>
                          <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            Admin Response:
                          </p>
                          <p className="text-gray-900 dark:text-gray-100">{appeal.adminResponse}</p>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Notification */}
      {notification?.isVisible && (
        <Notification
          type={notification.type}
          message={notification.message}
          isVisible={notification.isVisible}
          onClose={hideNotification}
        />
      )}
    </div>
  );
}
