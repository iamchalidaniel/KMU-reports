"use client";

import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { API_BASE_URL } from '../../config/constants';
import { authHeaders } from '../../utils/api';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Bar, Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

interface MaintenanceReport {
  _id?: string;
  id?: string;
  category: string;
  location: {
    hall: string;
    room?: string;
    floor?: string;
    building?: string;
  };
  description: string;
  priority: 'Low' | 'Medium' | 'High' | 'Urgent';
  status: 'Reported' | 'Assigned' | 'In Progress' | 'Completed' | 'Cancelled';
  reported_by: {
    student_id?: string;
    staff_id?: string;
    name: string;
    contact?: string;
  };
  assigned_to?: {
    staff_id?: string;
    name?: string;
    role?: string;
  };
  created_at: string;
  updated_at: string;
}

const ELECTRICAL_CATEGORIES = [
  { value: 'light', label: 'Lighting' },
  { value: 'socket', label: 'Electrical Socket' },
  { value: 'ac', label: 'Air Conditioning' },
  { value: 'fan', label: 'Fan' },
  { value: 'fridge', label: 'Refrigerator' },
  { value: 'other', label: 'Other Electrical' },
];

const PRIORITIES = [
  { value: 'Low', label: 'Low' },
  { value: 'Medium', label: 'Medium' },
  { value: 'High', label: 'High' },
  { value: 'Urgent', label: 'Urgent' },
];

const STATUSES = [
  { value: 'Reported', label: 'Reported' },
  { value: 'Assigned', label: 'Assigned' },
  { value: 'In Progress', label: 'In Progress' },
  { value: 'Completed', label: 'Completed' },
  { value: 'Cancelled', label: 'Cancelled' },
];

export default function ElectricianDashboard() {
  const { user, token, loading: authLoading } = useAuth();
  const router = useRouter();

  // all state hooks must be declared unconditionally at the top
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [reports, setReports] = useState<MaintenanceReport[]>([]);
  const [filteredReports, setFilteredReports] = useState<MaintenanceReport[]>([]);
  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      if (!authLoading && !token) {
        router.replace('/login');
        setIsCheckingAuth(false);
        return;
      }
      if (authLoading) {
        setIsCheckingAuth(true);
        return;
      }
      if (!user || user.role !== 'electrician') {
        setIsCheckingAuth(false);
        return;
      }
      setIsCheckingAuth(false);
    }
  }, [authLoading, token, user, router]);

  if (isCheckingAuth) {
    return <div className="text-center text-kmuGreen">Loading...</div>;
  }

  if (!user || user.role !== 'electrician') {
    return <div className="text-red-600">Access denied. Electrician access only.</div>;
  }

  useEffect(() => {
    fetchReports();
    fetchAnalytics();
  }, []);

  useEffect(() => {
    filterReports();
  }, [search, statusFilter, priorityFilter, reports]);

  async function fetchReports() {
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE_URL}/api/maintenance`, {
        headers: { ...authHeaders() }
      });
      if (!res.ok) throw new Error('Failed to fetch reports');
      const data = await res.json();
      // Backend already filters by assigned_to for electricians, but we also filter by electrical categories
      const electricalReports = (data.reports || data || []).filter((r: MaintenanceReport) =>
        ELECTRICAL_CATEGORIES.some(cat => cat.value === r.category)
      );
      setReports(electricalReports);
    } catch (err: any) {
      setError(err?.message || 'Failed to load reports');
    } finally {
      setLoading(false);
    }
  }

  async function fetchAnalytics() {
    try {
      const res = await fetch(`${API_BASE_URL}/api/maintenance/analytics`, {
        headers: { ...authHeaders() }
      });
      if (!res.ok) throw new Error('Failed to fetch analytics');
      const data = await res.json();
      // Filter analytics to only electrical categories
      if (data.categoryStats) {
        data.categoryStats = data.categoryStats.filter((s: any) =>
          ELECTRICAL_CATEGORIES.some(cat => cat.value === s.category)
        );
      }
      setAnalytics(data);
    } catch (err: any) {
      console.error('Failed to fetch analytics:', err);
    }
  }

  function filterReports() {
    let filtered = [...reports];
    
    if (search) {
      filtered = filtered.filter(r =>
        r.description.toLowerCase().includes(search.toLowerCase()) ||
        r.location.room?.toLowerCase().includes(search.toLowerCase()) ||
        r.reported_by.name?.toLowerCase().includes(search.toLowerCase())
      );
    }
    
    if (statusFilter) {
      filtered = filtered.filter(r => r.status === statusFilter);
    }
    
    if (priorityFilter) {
      filtered = filtered.filter(r => r.priority === priorityFilter);
    }
    
    setFilteredReports(filtered);
  }

  async function updateStatus(reportId: string, newStatus: string) {
    try {
      const res = await fetch(`${API_BASE_URL}/api/maintenance/${reportId}`, {
        method: 'PUT',
        headers: {
          ...authHeaders(),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      });
      
      if (!res.ok) throw new Error('Failed to update status');
      fetchReports();
      fetchAnalytics();
    } catch (err: any) {
      setError(err?.message || 'Failed to update status');
    }
  }

  const categoryChartData = analytics ? {
    labels: analytics.categoryStats?.map((s: any) => 
      ELECTRICAL_CATEGORIES.find(c => c.value === s.category)?.label || s.category
    ) || [],
    datasets: [{
      label: 'Electrical Reports by Category',
      data: analytics.categoryStats?.map((s: any) => s.count) || [],
      backgroundColor: [
        '#36A2EB', '#FF6384', '#FFCE56', '#4BC0C0', '#9966FF', '#FF9F40'
      ],
    }],
  } : null;

  const statusChartData = analytics ? {
    labels: analytics.statusStats?.map((s: any) => s.status) || [],
    datasets: [{
      label: 'Reports by Status',
      data: analytics.statusStats?.map((s: any) => s.count) || [],
      backgroundColor: [
        '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF'
      ],
    }],
  } : null;

  if (loading && reports.length === 0) {
    return <div className="text-center text-kmuGreen p-8">Loading dashboard...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-kmuGreen mb-2">Electrician Dashboard</h1>
          <p className="text-gray-600 dark:text-gray-400">Manage electrical maintenance reports</p>
        </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {/* Analytics Cards */}
      {analytics && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
            <div className="text-sm text-gray-600 dark:text-gray-400">Total Electrical Reports</div>
            <div className="text-2xl font-bold text-kmuGreen">{reports.length}</div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 border-l-4 border-blue-500">
            <div className="text-sm text-gray-600 dark:text-gray-400">Assigned to Me</div>
            <div className="text-2xl font-bold text-blue-600">
              {reports.filter(r => r.assigned_to && (r.status === 'Assigned' || r.status === 'In Progress')).length}
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
            <div className="text-sm text-gray-600 dark:text-gray-400">In Progress</div>
            <div className="text-2xl font-bold text-yellow-600">
              {reports.filter(r => r.status === 'In Progress').length}
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
            <div className="text-sm text-gray-600 dark:text-gray-400">Completed</div>
            <div className="text-2xl font-bold text-green-600">
              {reports.filter(r => r.status === 'Completed').length}
            </div>
          </div>
        </div>
      )}

      {/* Charts */}
      {analytics && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          {categoryChartData && (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
              <h3 className="text-lg font-semibold mb-4">Electrical Reports by Category</h3>
              <Bar data={categoryChartData} />
            </div>
          )}
          {statusChartData && (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
              <h3 className="text-lg font-semibold mb-4">Reports by Status</h3>
              <Doughnut data={statusChartData} />
            </div>
          )}
        </div>
      )}

      {/* Reports List */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <div className="flex flex-wrap items-center justify-between mb-4 gap-4">
          <h2 className="text-lg font-semibold text-kmuOrange">Electrical Maintenance Reports</h2>
          <div className="flex flex-wrap gap-2">
            <input
              type="text"
              placeholder="Search reports..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="border border-gray-300 dark:border-gray-600 rounded px-3 py-1 bg-white dark:bg-gray-700 text-sm"
            />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="border border-gray-300 dark:border-gray-600 rounded px-3 py-1 bg-white dark:bg-gray-700 text-sm"
            >
              <option value="">All Status</option>
              {STATUSES.map(s => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="border border-gray-300 dark:border-gray-600 rounded px-3 py-1 bg-white dark:bg-gray-700 text-sm"
            >
              <option value="">All Priorities</option>
              {PRIORITIES.map(p => (
                <option key={p.value} value={p.value}>{p.label}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-medium uppercase">Category</th>
                <th className="px-4 py-2 text-left text-xs font-medium uppercase">Location</th>
                <th className="px-4 py-2 text-left text-xs font-medium uppercase">Description</th>
                <th className="px-4 py-2 text-left text-xs font-medium uppercase">Priority</th>
                <th className="px-4 py-2 text-left text-xs font-medium uppercase">Status</th>
                <th className="px-4 py-2 text-left text-xs font-medium uppercase">Reported By</th>
                <th className="px-4 py-2 text-left text-xs font-medium uppercase">Date</th>
                <th className="px-4 py-2 text-left text-xs font-medium uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {filteredReports.map((report) => {
                const reportId = report._id || report.id;
                return (
                  <tr key={reportId} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-4 py-2 whitespace-nowrap text-sm">
                      {ELECTRICAL_CATEGORIES.find(c => c.value === report.category)?.label || report.category}
                    </td>
                    <td className="px-4 py-2 text-sm">
                      <div>{report.location.hall}</div>
                      {report.location.room && <div className="text-xs text-gray-500">Room: {report.location.room}</div>}
                    </td>
                    <td className="px-4 py-2 text-sm max-w-xs truncate">{report.description}</td>
                    <td className="px-4 py-2 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs rounded ${
                        report.priority === 'Urgent' ? 'bg-red-100 text-red-800' :
                        report.priority === 'High' ? 'bg-orange-100 text-orange-800' :
                        report.priority === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-green-100 text-green-800'
                      }`}>
                        {report.priority}
                      </span>
                    </td>
                    <td className="px-4 py-2 whitespace-nowrap">
                      <select
                        value={report.status}
                        onChange={(e) => updateStatus(reportId!, e.target.value)}
                        className="text-xs border border-gray-300 dark:border-gray-600 rounded px-2 py-1 bg-white dark:bg-gray-700"
                      >
                        {STATUSES.map(s => (
                          <option key={s.value} value={s.value}>{s.label}</option>
                        ))}
                      </select>
                    </td>
                    <td className="px-4 py-2 text-sm">
                      <div>{report.reported_by.name}</div>
                      {report.reported_by.contact && (
                        <div className="text-xs text-gray-500">{report.reported_by.contact}</div>
                      )}
                    </td>
                    <td className="px-4 py-2 whitespace-nowrap text-sm">
                      {new Date(report.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-2 whitespace-nowrap">
                      <Link
                        href={`/maintenance/${reportId}`}
                        className="text-kmuGreen hover:text-kmuOrange text-sm"
                      >
                        View
                      </Link>
                    </td>
                  </tr>
                );
              })}
              {filteredReports.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-4 py-4 text-center text-gray-500 dark:text-gray-400">
                    No electrical maintenance reports found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      </div>
    </div>
  );
}
