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
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  PointElement,
  LineElement,
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

const CATEGORIES = [
  { value: 'fridge', label: 'Refrigerator' },
  { value: 'light', label: 'Lighting' },
  { value: 'socket', label: 'Electrical Socket' },
  { value: 'plumbing', label: 'Plumbing' },
  { value: 'furniture', label: 'Furniture' },
  { value: 'door', label: 'Door' },
  { value: 'window', label: 'Window' },
  { value: 'ac', label: 'Air Conditioning' },
  { value: 'fan', label: 'Fan' },
  { value: 'other', label: 'Other' },
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

export default function HallWardenDashboard() {
  const { user, token, loading: authLoading } = useAuth();
  const router = useRouter();
  
  if (typeof window !== 'undefined') {
    if (!authLoading && !token) {
      router.replace('/login');
      return <div className="text-center text-kmuGreen">Redirecting to login...</div>;
    }
    
    if (authLoading) {
      return <div className="text-center text-kmuGreen">Loading...</div>;
    }
    
    if (!user || user.role !== 'hall_warden') {
      return <div className="text-red-600">Access denied. Hall warden access only.</div>;
    }
  }

  const [reports, setReports] = useState<MaintenanceReport[]>([]);
  const [filteredReports, setFilteredReports] = useState<MaintenanceReport[]>([]);
  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [hallFilter, setHallFilter] = useState('');
  const [dateFilter, setDateFilter] = useState(''); // New filter for date range
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'priority'>('newest');
  const [electricians, setElectricians] = useState<any[]>([]);
  const [assigningReportId, setAssigningReportId] = useState<string | null>(null);
  
  // Form state
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    category: '',
    hall: '',
    room: '',
    floor: '',
    building: '',
    description: '',
    priority: 'Medium',
    reported_by_name: '',
    reported_by_contact: '',
  });

  useEffect(() => {
    fetchReports();
    fetchAnalytics();
    fetchElectricians();
  }, []);

  async function fetchElectricians() {
    try {
      // Fetch users with electrician role
      const res = await fetch(`${API_BASE_URL}/api/users`, {
        headers: { ...authHeaders() }
      });
      if (!res.ok) throw new Error('Failed to fetch electricians');
      const data = await res.json();
      const electricianUsers = (data.users || data || []).filter((u: any) => u.role === 'electrician');
      setElectricians(electricianUsers);
    } catch (err: any) {
      console.error('Failed to fetch electricians:', err);
    }
  }

  useEffect(() => {
    filterReports();
  }, [search, statusFilter, priorityFilter, categoryFilter, hallFilter, dateFilter, sortBy, reports]);

  async function fetchReports() {
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE_URL}/api/maintenance`, {
        headers: { ...authHeaders() }
      });
      if (!res.ok) throw new Error('Failed to fetch reports');
      const data = await res.json();
      setReports(data.reports || data || []);
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
        r.reported_by.name?.toLowerCase().includes(search.toLowerCase()) ||
        r.location.hall?.toLowerCase().includes(search.toLowerCase())
      );
    }
    
    if (statusFilter) {
      filtered = filtered.filter(r => r.status === statusFilter);
    }
    
    if (priorityFilter) {
      filtered = filtered.filter(r => r.priority === priorityFilter);
    }
    
    if (categoryFilter) {
      filtered = filtered.filter(r => r.category === categoryFilter);
    }

    if (hallFilter) {
      filtered = filtered.filter(r => r.location.hall?.toLowerCase().includes(hallFilter.toLowerCase()));
    }

    // Date filter
    if (dateFilter) {
      const now = new Date();
      const reportDate = (r: MaintenanceReport) => new Date(r.created_at);
      
      switch (dateFilter) {
        case 'new':
          // Show only reports from last 24 hours
          const dayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
          filtered = filtered.filter(r => reportDate(r) >= dayAgo);
          break;
        case 'today':
          filtered = filtered.filter(r => {
            const date = reportDate(r);
            return date.toDateString() === now.toDateString();
          });
          break;
        case 'this_week':
          const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          filtered = filtered.filter(r => reportDate(r) >= weekAgo);
          break;
        case 'this_month':
          const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          filtered = filtered.filter(r => reportDate(r) >= monthAgo);
          break;
        case 'older':
          const monthAgoOld = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          filtered = filtered.filter(r => reportDate(r) < monthAgoOld);
          break;
      }
    }

    // Sorting
    filtered.sort((a, b) => {
      const dateA = new Date(a.created_at).getTime();
      const dateB = new Date(b.created_at).getTime();
      
      if (sortBy === 'newest') {
        return dateB - dateA; // Newest first
      } else if (sortBy === 'oldest') {
        return dateA - dateB; // Oldest first
      } else if (sortBy === 'priority') {
        const priorityOrder = { 'Urgent': 4, 'High': 3, 'Medium': 2, 'Low': 1 };
        const priorityDiff = (priorityOrder[b.priority] || 0) - (priorityOrder[a.priority] || 0);
        return priorityDiff !== 0 ? priorityDiff : dateB - dateA; // If same priority, newest first
      }
      return 0;
    });
    
    setFilteredReports(filtered);
  }

  // Helper function to get relative time
  function getRelativeTime(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} week${Math.floor(diffDays / 7) > 1 ? 's' : ''} ago`;
    return date.toLocaleDateString();
  }

  // Check if report is new (within last 24 hours)
  function isNewReport(dateString: string): boolean {
    const date = new Date(dateString);
    const now = new Date();
    const diffHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
    return diffHours < 24;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE_URL}/api/maintenance`, {
        method: 'POST',
        headers: {
          ...authHeaders(),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          reported_by: {
            name: formData.reported_by_name,
            contact: formData.reported_by_contact,
          },
          location: {
            hall: formData.hall,
            room: formData.room,
            floor: formData.floor,
            building: formData.building,
          },
          status: 'Reported',
        }),
      });
      
      if (!res.ok) throw new Error('Failed to create report');
      
      setShowForm(false);
      setFormData({
        category: '',
        hall: '',
        room: '',
        floor: '',
        building: '',
        description: '',
        priority: 'Medium',
        reported_by_name: '',
        reported_by_contact: '',
      });
      fetchReports();
      fetchAnalytics();
    } catch (err: any) {
      setError(err?.message || 'Failed to create report');
    } finally {
      setLoading(false);
    }
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

  async function assignToElectrician(reportId: string, electricianId: string, electricianName: string) {
    try {
      setAssigningReportId(reportId);
      const res = await fetch(`${API_BASE_URL}/api/maintenance/${reportId}`, {
        method: 'PUT',
        headers: {
          ...authHeaders(),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: 'Assigned',
          assigned_to: {
            staff_id: electricianId,
            name: electricianName,
            role: 'electrician'
          }
        }),
      });
      
      if (!res.ok) throw new Error('Failed to assign report');
      fetchReports();
      fetchAnalytics();
      setAssigningReportId(null);
    } catch (err: any) {
      setError(err?.message || 'Failed to assign report');
      setAssigningReportId(null);
    }
  }

  // Check if report is electrical
  function isElectricalReport(category: string): boolean {
    return ['light', 'socket', 'ac', 'fan', 'fridge'].includes(category);
  }

  const categoryChartData = analytics ? {
    labels: analytics.categoryStats?.map((s: any) => s.category) || [],
    datasets: [{
      label: 'Reports by Category',
      data: analytics.categoryStats?.map((s: any) => s.count) || [],
      backgroundColor: [
        '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0',
        '#9966FF', '#FF9F40', '#FF6384', '#C9CBCF',
        '#4BC0C0', '#FF6384'
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
    <section className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-kmuGreen mb-2">Hall Warden Dashboard</h1>
        <p className="text-gray-600 dark:text-gray-400">Manage maintenance reports for hostel facilities</p>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {/* New Reports Alert Banner */}
      {reports.filter(r => isNewReport(r.created_at)).length > 0 && dateFilter !== 'new' && (
        <div className="bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-500 p-4 mb-6 rounded-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex-shrink-0">
                <span className="text-2xl">🔔</span>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-blue-800 dark:text-blue-200">
                  {reports.filter(r => isNewReport(r.created_at)).length} New Report{reports.filter(r => isNewReport(r.created_at)).length !== 1 ? 's' : ''} in Last 24 Hours
                </h3>
                <p className="text-sm text-blue-600 dark:text-blue-300 mt-1">
                  Click the "New Reports" button below to view only recent reports
                </p>
              </div>
            </div>
            <button
              onClick={() => {
                setDateFilter('new');
                setStatusFilter('');
                setPriorityFilter('');
                setCategoryFilter('');
                setHallFilter('');
                setSearch('');
              }}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition font-medium"
            >
              View New Reports
            </button>
          </div>
        </div>
      )}

      {/* Analytics Cards */}
      {analytics && (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
            <div className="text-sm text-gray-600 dark:text-gray-400">Total Reports</div>
            <div className="text-2xl font-bold text-kmuGreen">{analytics.total || 0}</div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 border-l-4 border-blue-500">
            <div className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-2">
              <span>New (24h)</span>
              {reports.filter(r => isNewReport(r.created_at)).length > 0 && (
                <span className="px-2 py-0.5 bg-blue-500 text-white text-xs rounded-full">
                  {reports.filter(r => isNewReport(r.created_at)).length}
                </span>
              )}
            </div>
            <div className="text-2xl font-bold text-blue-600">
              {reports.filter(r => isNewReport(r.created_at)).length}
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
            <div className="text-sm text-gray-600 dark:text-gray-400">Pending</div>
            <div className="text-2xl font-bold text-yellow-600">
              {analytics.statusStats?.find((s: any) => s.status === 'Reported')?.count || 0}
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
            <div className="text-sm text-gray-600 dark:text-gray-400">In Progress</div>
            <div className="text-2xl font-bold text-blue-600">
              {analytics.statusStats?.find((s: any) => s.status === 'In Progress')?.count || 0}
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
            <div className="text-sm text-gray-600 dark:text-gray-400">Completed</div>
            <div className="text-2xl font-bold text-green-600">
              {analytics.statusStats?.find((s: any) => s.status === 'Completed')?.count || 0}
            </div>
          </div>
        </div>
      )}

      {/* Charts */}
      {analytics && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          {categoryChartData && (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
              <h3 className="text-lg font-semibold mb-4">Reports by Category</h3>
              <Doughnut data={categoryChartData} />
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

      {/* Create Report Form */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-kmuOrange">Create Maintenance Report</h2>
          <button
            onClick={() => setShowForm(!showForm)}
            className="bg-kmuGreen text-white px-4 py-2 rounded hover:bg-kmuOrange transition"
          >
            {showForm ? 'Cancel' : 'New Report'}
          </button>
        </div>

        {showForm && (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Category *</label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full border border-gray-300 dark:border-gray-600 rounded px-3 py-2 bg-white dark:bg-gray-700"
                  required
                >
                  <option value="">Select category...</option>
                  {CATEGORIES.map(cat => (
                    <option key={cat.value} value={cat.value}>{cat.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Priority *</label>
                <select
                  value={formData.priority}
                  onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                  className="w-full border border-gray-300 dark:border-gray-600 rounded px-3 py-2 bg-white dark:bg-gray-700"
                  required
                >
                  {PRIORITIES.map(p => (
                    <option key={p.value} value={p.value}>{p.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Hall *</label>
                <input
                  type="text"
                  value={formData.hall}
                  onChange={(e) => setFormData({ ...formData, hall: e.target.value })}
                  className="w-full border border-gray-300 dark:border-gray-600 rounded px-3 py-2 bg-white dark:bg-gray-700"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Room</label>
                <input
                  type="text"
                  value={formData.room}
                  onChange={(e) => setFormData({ ...formData, room: e.target.value })}
                  className="w-full border border-gray-300 dark:border-gray-600 rounded px-3 py-2 bg-white dark:bg-gray-700"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Floor</label>
                <input
                  type="text"
                  value={formData.floor}
                  onChange={(e) => setFormData({ ...formData, floor: e.target.value })}
                  className="w-full border border-gray-300 dark:border-gray-600 rounded px-3 py-2 bg-white dark:bg-gray-700"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Building</label>
                <input
                  type="text"
                  value={formData.building}
                  onChange={(e) => setFormData({ ...formData, building: e.target.value })}
                  className="w-full border border-gray-300 dark:border-gray-600 rounded px-3 py-2 bg-white dark:bg-gray-700"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Description *</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full border border-gray-300 dark:border-gray-600 rounded px-3 py-2 bg-white dark:bg-gray-700"
                rows={3}
                required
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Reported By *</label>
                <input
                  type="text"
                  value={formData.reported_by_name}
                  onChange={(e) => setFormData({ ...formData, reported_by_name: e.target.value })}
                  className="w-full border border-gray-300 dark:border-gray-600 rounded px-3 py-2 bg-white dark:bg-gray-700"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Contact</label>
                <input
                  type="text"
                  value={formData.reported_by_contact}
                  onChange={(e) => setFormData({ ...formData, reported_by_contact: e.target.value })}
                  className="w-full border border-gray-300 dark:border-gray-600 rounded px-3 py-2 bg-white dark:bg-gray-700"
                />
              </div>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="bg-kmuGreen text-white px-6 py-2 rounded hover:bg-kmuOrange transition disabled:opacity-50"
            >
              {loading ? 'Submitting...' : 'Submit Report'}
            </button>
          </form>
        )}
      </div>

      {/* Reports List */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <div className="flex flex-wrap items-center justify-between mb-4 gap-4">
          <div>
            <h2 className="text-lg font-semibold text-kmuOrange">Maintenance Reports</h2>
            {dateFilter === 'new' && (
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Showing <span className="font-semibold text-blue-600">{filteredReports.length}</span> new report{filteredReports.length !== 1 ? 's' : ''} from the last 24 hours
              </p>
            )}
            {dateFilter === '' && (
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                <span className="font-semibold text-blue-600">{reports.filter(r => isNewReport(r.created_at)).length}</span> new report{reports.filter(r => isNewReport(r.created_at)).length !== 1 ? 's' : ''} in last 24h • 
                <span className="ml-1">{filteredReports.length}</span> total report{filteredReports.length !== 1 ? 's' : ''}
              </p>
            )}
          </div>
          <div className="flex flex-wrap gap-2 items-center">
            {/* Quick Filter Button for New Reports */}
            <button
              onClick={() => {
                setDateFilter(dateFilter === 'new' ? '' : 'new');
                setStatusFilter('');
                setPriorityFilter('');
                setCategoryFilter('');
                setHallFilter('');
                setSearch('');
              }}
              className={`px-4 py-2 rounded text-sm font-medium transition ${
                dateFilter === 'new'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'bg-blue-100 text-blue-700 hover:bg-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:hover:bg-blue-900/50'
              }`}
            >
              {dateFilter === 'new' ? '✓ ' : ''}New Reports ({reports.filter(r => isNewReport(r.created_at)).length})
            </button>
            <div className="border-l border-gray-300 dark:border-gray-600 h-6 mx-1"></div>
            <input
              type="text"
              placeholder="Search reports..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="border border-gray-300 dark:border-gray-600 rounded px-3 py-1 bg-white dark:bg-gray-700 text-sm"
            />
            <input
              type="text"
              placeholder="Filter by hall..."
              value={hallFilter}
              onChange={(e) => setHallFilter(e.target.value)}
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
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="border border-gray-300 dark:border-gray-600 rounded px-3 py-1 bg-white dark:bg-gray-700 text-sm"
            >
              <option value="">All Categories</option>
              {CATEGORIES.map(c => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>
            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="border border-gray-300 dark:border-gray-600 rounded px-3 py-1 bg-white dark:bg-gray-700 text-sm"
            >
              <option value="">All Dates</option>
              <option value="new">New (Last 24h) ({reports.filter(r => isNewReport(r.created_at)).length})</option>
              <option value="today">Today</option>
              <option value="this_week">This Week</option>
              <option value="this_month">This Month</option>
              <option value="older">Older than 30 days</option>
            </select>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'newest' | 'oldest' | 'priority')}
              className="border border-gray-300 dark:border-gray-600 rounded px-3 py-1 bg-white dark:bg-gray-700 text-sm"
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="priority">Priority</option>
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
                <th className="px-4 py-2 text-left text-xs font-medium uppercase">Date / Time</th>
                <th className="px-4 py-2 text-left text-xs font-medium uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {filteredReports.map((report) => {
                const reportId = report._id || report.id;
                const isNew = isNewReport(report.created_at);
                const relativeTime = getRelativeTime(report.created_at);
                return (
                  <tr 
                    key={reportId} 
                    className={`hover:bg-gray-50 dark:hover:bg-gray-700 ${
                      isNew ? 'bg-blue-50 dark:bg-blue-900/10 border-l-4 border-blue-500' : ''
                    }`}
                  >
                    <td className="px-4 py-2 whitespace-nowrap text-sm">
                      <div className="flex items-center gap-2">
                        {CATEGORIES.find(c => c.value === report.category)?.label || report.category}
                        {isNew && (
                          <span className="px-1.5 py-0.5 text-xs font-semibold bg-blue-500 text-white rounded">
                            NEW
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-2 text-sm">
                      <div className="font-medium">{report.location.hall}</div>
                      {report.location.room && <div className="text-xs text-gray-500">Room: {report.location.room}</div>}
                      {report.location.floor && <div className="text-xs text-gray-500">Floor: {report.location.floor}</div>}
                    </td>
                    <td className="px-4 py-2 text-sm max-w-xs truncate" title={report.description}>
                      {report.description}
                    </td>
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
                      {report.reported_by.student_id && (
                        <div className="text-xs text-gray-500">Student ID: {report.reported_by.student_id}</div>
                      )}
                    </td>
                    <td className="px-4 py-2 whitespace-nowrap text-sm">
                      <div className="flex flex-col">
                        <span className={isNew ? 'font-semibold text-blue-600 dark:text-blue-400' : ''}>
                          {relativeTime}
                        </span>
                        <span className="text-xs text-gray-500">
                          {new Date(report.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-2 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        {isElectricalReport(report.category) && !report.assigned_to && (
                          <select
                            value=""
                            onChange={(e) => {
                              if (e.target.value) {
                                const electrician = electricians.find((e: any) => e.id === e.target.value || e._id === e.target.value);
                                if (electrician) {
                                  assignToElectrician(reportId!, e.target.value, electrician.name || electrician.username);
                                }
                              }
                            }}
                            disabled={assigningReportId === reportId}
                            className="text-xs border border-gray-300 dark:border-gray-600 rounded px-2 py-1 bg-white dark:bg-gray-700 text-kmuGreen"
                          >
                            <option value="">Assign...</option>
                            {electricians.map((electrician: any) => (
                              <option key={electrician.id || electrician._id} value={electrician.id || electrician._id}>
                                {electrician.name || electrician.username}
                              </option>
                            ))}
                          </select>
                        )}
                        {report.assigned_to && (
                          <span className="text-xs px-2 py-1 bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 rounded">
                            ✓ {report.assigned_to.role === 'electrician' ? '⚡' : ''} {report.assigned_to.name}
                          </span>
                        )}
                        <Link
                          href={`/maintenance/${reportId}`}
                          className="text-kmuGreen hover:text-kmuOrange text-sm"
                        >
                          View
                        </Link>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filteredReports.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-4 py-4 text-center text-gray-500 dark:text-gray-400">
                    No maintenance reports found
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
