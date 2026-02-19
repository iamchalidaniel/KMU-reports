"use client";
import { useAuth } from '../../context/AuthContext';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { API_BASE_URL } from '../../config/constants';
import { authHeaders } from '../../utils/api';
import { prepareChartExport } from '../../utils/chartExport';
import { saveAs } from 'file-saver';
import Notification, { useNotification } from '../../components/Notification';

interface Student {
  _id: string;
  studentId: string;
  fullName: string;
  department?: string;
}

interface StudentReport {
  _id: string;
  student?: Student;
  student_id?: string;
  incidentDate: string;
  description: string;
  offenseType: string;
  severity: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export default function ReportsPage() {
  const { user, token, loading: authLoading } = useAuth();
  const router = useRouter();
  const { notification, showNotification, hideNotification } = useNotification();
  
  const [offenseTrends, setOffenseTrends] = useState<{ _id: string; count: number }[]>([]);
  const [departmentStats, setDepartmentStats] = useState<{ _id: string; count: number }[]>([]);
  const [studentReports, setStudentReports] = useState<StudentReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingReports, setLoadingReports] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [exportingExcel, setExportingExcel] = useState(false);
  const [exportingDocx, setExportingDocx] = useState(false);
  const [exportingWithCharts, setExportingWithCharts] = useState(false);
  const [activeTab, setActiveTab] = useState<'analytics' | 'studentReports'>('analytics');
  const [statusFilter, setStatusFilter] = useState('');
  const [severityFilter, setSeverityFilter] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [total, setTotal] = useState(0);
  
  // Handle authentication like profile page - only on client side
  if (typeof window !== 'undefined') {
    if (!authLoading && !token) {
      router.replace('/login');
      return <div className="text-center text-kmuGreen">Redirecting to login...</div>;
    }
    
    if (authLoading) {
      return <div className="text-center text-kmuGreen">Loading...</div>;
    }
    
    if (!user || !['admin','chief_security_officer','dean_of_students','assistant_dean','secretary','security_officer'].includes(user.role)) {
      return <div className="text-red-600">Access denied.</div>;
    }
  }

  useEffect(() => {
    async function fetchAnalytics() {
      setLoading(true);
      setError(null);
      try {
        if (!API_BASE_URL) {
          setError('API base URL is not defined.');
          setLoading(false);
          return;
        }
        const res = await fetch(`${API_BASE_URL}/reports/analytics`, {
          headers: { ...authHeaders() },
        });
        if (!res.ok) throw new Error(await res.text());
        const data = await res.json();
        setOffenseTrends(data.offenseTrends);
        setDepartmentStats(data.departmentStats);
      } catch (err: any) {
        setError('Failed to load analytics');
      }
      setLoading(false);
    }
    if (user) fetchAnalytics();
  }, [token, user, API_BASE_URL]);

  // Fetch student reports
  useEffect(() => {
    if (activeTab === 'studentReports' && user) {
      fetchStudentReports();
    }
  }, [activeTab, user, page, statusFilter, severityFilter, search]);

  const fetchStudentReports = async () => {
    setLoadingReports(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
      });

      if (statusFilter) params.append('status', statusFilter);
      if (severityFilter) params.append('severity', severityFilter);
      if (search) params.append('search', search);

      const res = await fetch(`${API_BASE_URL}/api/cases?${params}`, {
        headers: { ...authHeaders() },
      });

      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      setStudentReports(data.cases || []);
      setTotal(data.total || 0);
    } catch (err: any) {
      console.error('Failed to fetch student reports:', err);
      showNotification('error', 'Failed to load student reports');
    } finally {
      setLoadingReports(false);
    }
  };

  async function handleExcelExport() {
    setExportingExcel(true);
    try {
      const res = await fetch(`${API_BASE_URL}/reports/export-excel`, {
        headers: { ...authHeaders() },
      });
      if (!res.ok) throw new Error(await res.text());
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'analytics.xlsx';
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      showNotification('success', 'Excel export completed successfully');
    } catch (err) {
      console.error('Excel export error:', err);
      showNotification('error', 'Failed to export Excel');
    } finally {
      setExportingExcel(false);
    }
  }

  async function handleDocxExport() {
    setExportingDocx(true);
    try {
      const res = await fetch(`${API_BASE_URL}/reports/docx`, {
        method: 'POST',
        headers: { ...authHeaders() },
      });
      if (!res.ok) throw new Error(await res.text());
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'analytics.docx';
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      showNotification('success', 'DOCX export completed successfully');
    } catch (err) {
      console.error('DOCX export error:', err);
      showNotification('error', 'Failed to export DOCX');
    } finally {
      setExportingDocx(false);
    }
  }

  async function handleExportWithCharts() {
    setExportingWithCharts(true);
    try {
      // Prepare chart data
      console.log('Preparing chart export...');
      const chartExportData = await prepareChartExport();
      console.log('Chart export data:', chartExportData);
      
      // Check payload size
      const payloadSize = JSON.stringify(chartExportData).length;
      console.log('Payload size:', payloadSize, 'bytes');
      if (payloadSize > 5000000) { // 5MB limit
        showNotification('error', 'Chart data too large. Please try again with fewer charts.');
        return;
      }
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout
      
      const res = await fetch(`${API_BASE_URL}/reports/with-charts`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          ...authHeaders() 
        },
        body: JSON.stringify({
          charts: chartExportData.charts,
          pageInfo: chartExportData.pageInfo,
          filters: {}
        }),
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (!res.ok) {
        const errorText = await res.text();
        console.error('Server error:', errorText);
        throw new Error(errorText);
      }
      const blob = await res.blob();
      saveAs(blob, 'reports_with_charts.docx');
      showNotification('success', 'Export with charts completed successfully');
    } catch (err: any) {
      console.error('Export with charts error:', err);
      if (err.name === 'AbortError') {
        showNotification('error', 'Export timed out. Please try again.');
      } else {
        showNotification('error', 'Failed to export with charts');
      }
    } finally {
      setExportingWithCharts(false);
    }
  }



  const safeOffenseTrends = Array.isArray(offenseTrends) ? offenseTrends : [];
  const safeDepartmentStats = Array.isArray(departmentStats) ? departmentStats : [];

  // Chart data for offense trends
  const offenseData = {
    labels: safeOffenseTrends.map(row => row._id),
    datasets: [
      {
        label: 'Count',
        data: safeOffenseTrends.map(row => row.count),
        backgroundColor: 'rgba(16, 185, 129, 0.7)', // kmuGreen
      },
    ],
  };
  // Chart data for department stats
  const deptData = {
    labels: safeDepartmentStats.map(row => row._id),
    datasets: [
      {
        label: 'Count',
        data: safeDepartmentStats.map(row => row.count),
        backgroundColor: 'rgba(251, 146, 60, 0.7)', // kmuOrange
      },
    ],
  };

  ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

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
    <>
      <section>
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-kmuGreen">Reports</h1>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 border-b border-gray-200 dark:border-gray-700">
          <button
            onClick={() => {
              setActiveTab('analytics');
              setPage(1);
            }}
            className={`px-4 py-2 font-medium transition-colors ${
              activeTab === 'analytics'
                ? 'border-b-2 border-kmuGreen text-kmuGreen'
                : 'text-gray-600 dark:text-gray-400 hover:text-kmuGreen'
            }`}
          >
            Analytics
          </button>
          <button
            onClick={() => {
              setActiveTab('studentReports');
              setPage(1);
            }}
            className={`px-4 py-2 font-medium transition-colors ${
              activeTab === 'studentReports'
                ? 'border-b-2 border-kmuGreen text-kmuGreen'
                : 'text-gray-600 dark:text-gray-400 hover:text-kmuGreen'
            }`}
          >
            Student Reports ({total})
          </button>
        </div>

        {/* Analytics Tab */}
        {activeTab === 'analytics' && (
          <>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-6">
          <h2 className="text-lg font-semibold mb-2 text-kmuOrange">Offense Trends</h2>
          {loading ? (
            <div className="text-gray-500 dark:text-gray-400">Loading...</div>
          ) : error ? (
            <div className="text-red-600">{error}</div>
          ) : (
            <div 
              id="offense-trends-chart"
              data-chart-export="true"
              data-chart-title="Offense Trends"
              data-chart-description="Distribution of disciplinary cases by offense type"
              style={{ height: 300 }}
            >
              <Bar data={offenseData} options={{ responsive: true, plugins: { legend: { display: false }, title: { display: false } } }} />
            </div>
          )}
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-6">
          <h2 className="text-lg font-semibold mb-2 text-kmuOrange">Department Stats</h2>
          {loading ? (
            <div className="text-gray-500 dark:text-gray-400">Loading...</div>
          ) : error ? (
            <div className="text-red-600">{error}</div>
          ) : (
            <div 
              id="department-stats-chart"
              data-chart-export="true"
              data-chart-title="Department Statistics"
              data-chart-description="Distribution of disciplinary cases by department"
              style={{ height: 300 }}
            >
              <Bar data={deptData} options={{ responsive: true, plugins: { legend: { display: false }, title: { display: false } } }} />
            </div>
          )}
        </div>
        {/* Export buttons for analytics */}
        <div className="flex gap-4">
          <button
            className="bg-kmuOrange text-white px-4 py-2 rounded hover:bg-kmuGreen transition disabled:opacity-50"
            onClick={handleExcelExport}
            disabled={exportingExcel}
          >
            {exportingExcel ? 'Exporting...' : 'Export to Excel'}
          </button>
          <button
            className="bg-gray-200 text-kmuGreen px-4 py-2 rounded hover:bg-kmuOrange/20 transition disabled:opacity-50"
            onClick={handleDocxExport}
            disabled={exportingDocx}
          >
            {exportingDocx ? 'Exporting...' : 'Export to DOCX'}
          </button>
          <button
            className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700 transition disabled:opacity-50"
            onClick={handleExportWithCharts}
            disabled={exportingWithCharts}
          >
            {exportingWithCharts ? 'Exporting...' : 'Export with Charts (DOCX)'}
          </button>
        </div>
          </>
        )}

        {/* Student Reports Tab */}
        {activeTab === 'studentReports' && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h2 className="text-2xl font-bold text-kmuGreen mb-6">Student-Submitted Reports</h2>

            {/* Filters */}
            <div className="flex flex-col md:flex-row gap-4 mb-6">
              <input
                type="text"
                placeholder="Search by student name or description..."
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
              <select
                value={severityFilter}
                onChange={(e) => {
                  setSeverityFilter(e.target.value);
                  setPage(1);
                }}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="">All Severity Levels</option>
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
              </select>
            </div>

            {/* Reports Table */}
            {loadingReports ? (
              <div className="text-center py-8">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-kmuGreen"></div>
              </div>
            ) : studentReports.length === 0 ? (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                No student reports found.
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-100 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
                      <tr>
                        <th className="px-4 py-2 text-left font-semibold text-gray-700 dark:text-gray-300">
                          Student
                        </th>
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
                      {studentReports.map((report) => (
                        <tr
                          key={report._id}
                          className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700"
                        >
                          <td className="px-4 py-2 text-gray-900 dark:text-white">
                            {report.student?.fullName || 'N/A'}
                          </td>
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
                    {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => i + Math.max(1, page - 2)).map((p) => (
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
      </section>
      
      {/* Notification */}
      {notification?.isVisible && (
        <Notification
          type={notification.type}
          message={notification.message}
          isVisible={notification.isVisible}
          onClose={hideNotification}
        />
      )}
    </>
  );
}
