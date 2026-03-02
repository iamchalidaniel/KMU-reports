"use client";

import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { API_BASE_URL } from '../../config/constants';
import { authHeaders, getProfile } from '../../utils/api';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Notification, { useNotification } from '../../components/Notification';
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

  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

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

      if (!user || user.role !== 'hall_warden') {
        setIsCheckingAuth(false);
        return;
      }
      setIsCheckingAuth(false);
    }
  }, [authLoading, token, user, router]);

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
  const [profile, setProfile] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'reports' | 'info' | 'password'>('dashboard');
  const { notification, showNotification, hideNotification } = useNotification();

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
    fetchStaffProfile();
  }, []);

  async function fetchStaffProfile() {
    try {
      const data = await getProfile();
      setProfile(data);
    } catch (err) {
      console.error('Failed to fetch profile:', err);
    }
  }

  async function fetchElectricians() {
    try {
      // Fetch users with electrician role
      const res = await fetch(`${API_BASE_URL}/users`, {
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
      const res = await fetch(`${API_BASE_URL}/maintenance`, {
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

  if (isCheckingAuth) {
    return <div className="text-center text-kmuGreen">Loading...</div>;
  }

  if (!user || user.role !== 'hall_warden') {
    return <div className="text-red-600">Access denied. Hall warden access only.</div>;
  }

  const analyticsReports = hallFilter
    ? reports.filter(r => r.location.hall === hallFilter)
    : reports;

  const categoryCounts: Record<string, number> = {};
  const statusCounts: Record<string, number> = {};

  analyticsReports.forEach(r => {
    if (r.category) categoryCounts[r.category] = (categoryCounts[r.category] || 0) + 1;
    if (r.status) statusCounts[r.status] = (statusCounts[r.status] || 0) + 1;
  });

  const categoryChartData = {
    labels: Object.keys(categoryCounts).map(c => c.toUpperCase()),
    datasets: [{
      label: 'Reports by Category',
      data: Object.values(categoryCounts),
      backgroundColor: [
        '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0',
        '#9966FF', '#FF9F40', '#4BC0C0', '#C9CBCF'
      ],
    }],
  };

  const statusChartData = {
    labels: Object.keys(statusCounts),
    datasets: [{
      label: 'Reports by Status',
      data: Object.values(statusCounts),
      backgroundColor: [
        '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF'
      ],
    }],
  };

  const halls = Array.from(new Set(reports.map(r => r.location.hall).filter(Boolean)));

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100 pb-12">
      <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">


        <div className="flex flex-col lg:flex-row gap-6">
          {/* Left Column: Side Navigation */}
          <div className="lg:w-1/4">
            <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 overflow-hidden sticky top-24">
              <nav className="flex flex-col">
                <NavButton label="Dashboard" icon="📊" active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} />
                <NavButton label="All Reports" icon="📋" active={activeTab === 'reports'} onClick={() => setActiveTab('reports')} />
              </nav>
            </div>
          </div>

          {/* Right Column: Content */}
          <div className="lg:w-3/4 space-y-6">

            {activeTab === 'dashboard' && (
              <div className="animate-in fade-in duration-300 space-y-6">
                {/* Stats Cards and Charts */}
                {analytics && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <StatCard title="Total" value={analytics.total || 0} color="teal" />
                    <StatCard title="New (24h)" value={reports.filter(r => isNewReport(r.created_at)).length} color="blue" />
                    <StatCard title="Pending" value={analytics.statusStats?.find((s: any) => s.status === 'Reported')?.count || 0} color="yellow" />
                    <StatCard title="Completed" value={analytics.statusStats?.find((s: any) => s.status === 'Completed')?.count || 0} color="green" />
                  </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 p-6 text-center">
                    <div className="flex justify-between items-center mb-6">
                      <h3 className="text-lg font-bold text-gray-800 dark:text-gray-200">Reports by Category</h3>
                      <select
                        className="bg-gray-50 dark:bg-gray-800 border-none rounded-lg px-3 py-1 text-xs outline-none"
                        value={hallFilter}
                        onChange={(e) => setHallFilter(e.target.value)}
                      >
                        <option value="">All Hostels</option>
                        {halls.map((h: any) => <option key={h} value={h}>{h}</option>)}
                      </select>
                    </div>
                    <div className="h-64 flex items-center justify-center">
                      <Doughnut data={categoryChartData} options={{ maintainAspectRatio: false }} />
                    </div>
                  </div>
                  <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 p-6 text-center">
                    <h3 className="text-lg font-bold mb-6 text-gray-800 dark:text-gray-200">Reports by Status</h3>
                    <div className="h-64 flex items-center justify-center">
                      <Doughnut data={statusChartData} options={{ maintainAspectRatio: false }} />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'reports' && (
              <div className="animate-in fade-in duration-300 space-y-6">
                <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 p-6">
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold">Maintenance Reports</h2>
                    <button
                      onClick={() => setShowForm(!showForm)}
                      className="bg-kmuGreen text-white px-4 py-2 rounded-lg font-bold hover:opacity-90 transition"
                    >
                      {showForm ? 'Close Form' : '+ New Report'}
                    </button>
                  </div>

                  {showForm && (
                    <div className="mb-10 p-6 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700">
                      <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <FormField label="Category" value={formData.category} onChange={(v: string) => setFormData({ ...formData, category: v })} type="select" options={CATEGORIES} />
                        <FormField label="Priority" value={formData.priority} onChange={(v: string) => setFormData({ ...formData, priority: v })} type="select" options={PRIORITIES} />
                        <FormField label="Hall" value={formData.hall} onChange={(v: string) => setFormData({ ...formData, hall: v })} />
                        <FormField label="Room" value={formData.room} onChange={(v: string) => setFormData({ ...formData, room: v })} />
                        <div className="md:col-span-2">
                          <FormField label="Description" value={formData.description} onChange={(v: string) => setFormData({ ...formData, description: v })} type="textarea" />
                        </div>
                        <FormField label="Reported By" value={formData.reported_by_name} onChange={(v: string) => setFormData({ ...formData, reported_by_name: v })} />
                        <FormField label="Contact" value={formData.reported_by_contact} onChange={(v: string) => setFormData({ ...formData, reported_by_contact: v })} />
                        <div className="md:col-span-2">
                          <button type="submit" disabled={loading} className="w-full bg-teal-600 text-white font-bold py-3 rounded-xl hover:bg-teal-700 transition disabled:opacity-50">
                            {loading ? 'Submitting...' : 'Create Report'}
                          </button>
                        </div>
                      </form>
                    </div>
                  )}

                  {/* Filters */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                    <input
                      placeholder="Search Description..."
                      className="bg-gray-100 dark:bg-gray-800 border-none rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-teal-500"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                    />
                    <select
                      className="bg-gray-100 dark:bg-gray-800 border-none rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-teal-500"
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                    >
                      <option value="">All Statuses</option>
                      {STATUSES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                    </select>
                    <select
                      className="bg-gray-100 dark:bg-gray-800 border-none rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-teal-500"
                      value={priorityFilter}
                      onChange={(e) => setPriorityFilter(e.target.value)}
                    >
                      <option value="">All Priorities</option>
                      {PRIORITIES.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
                    </select>
                    <button
                      onClick={() => setDateFilter(dateFilter === 'new' ? '' : 'new')}
                      className={`px-4 py-2 rounded-lg text-sm font-bold transition ${dateFilter === 'new' ? 'bg-teal-600 text-white' : 'bg-teal-50 text-teal-700 dark:bg-teal-900/20'}`}
                    >
                      {dateFilter === 'new' ? '✓ New Reports' : 'New Last 24h'}
                    </button>
                  </div>

                  {/* Table */}
                  <div className="overflow-x-auto border rounded-xl border-gray-100 dark:border-gray-800">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50 dark:bg-gray-800 border-b border-gray-100 dark:border-gray-800">
                        <tr>
                          <th className="px-4 py-4 text-left font-bold uppercase text-[10px] tracking-wider">Info</th>
                          <th className="px-4 py-4 text-left font-bold uppercase text-[10px] tracking-wider text-center">Priority</th>
                          <th className="px-4 py-4 text-left font-bold uppercase text-[10px] tracking-wider text-center">Status</th>
                          <th className="px-4 py-4 text-right font-bold uppercase text-[10px] tracking-wider">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                        {filteredReports.map(report => {
                          const reportId = report._id || report.id;
                          return (
                            <tr key={reportId} className="hover:bg-gray-50 dark:hover:bg-gray-900/50 transition-colors">
                              <td className="px-4 py-4">
                                <div className="font-bold text-gray-900 dark:text-gray-100 mb-0.5">{report.category.toUpperCase()}</div>
                                <div className="text-[11px] text-gray-500 flex gap-2">
                                  <span>📍 {report.location.hall} {report.location.room ? `- ${report.location.room}` : ''}</span>
                                  <span>🕒 {getRelativeTime(report.created_at)}</span>
                                </div>
                                <div className="text-xs text-gray-600 dark:text-gray-400 mt-2 line-clamp-1">{report.description}</div>
                              </td>
                              <td className="px-4 py-4 text-center">
                                <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${report.priority === 'Urgent' ? 'bg-red-100 text-red-700' :
                                  report.priority === 'High' ? 'bg-orange-100 text-orange-700' :
                                    report.priority === 'Medium' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'
                                  }`}>
                                  {report.priority}
                                </span>
                              </td>
                              <td className="px-4 py-4 text-center">
                                <select
                                  value={report.status}
                                  onChange={(e) => updateStatus(reportId!, e.target.value)}
                                  className={`text-[10px] font-bold border-none rounded px-2 py-1 bg-transparent dark:bg-transparent ${report.status === 'Completed' ? 'text-green-600' : 'text-blue-600'
                                    }`}
                                >
                                  {STATUSES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                                </select>
                              </td>
                              <td className="px-4 py-4 text-right">
                                {isElectricalReport(report.category) && report.status === 'Reported' && (
                                  <div className="flex flex-col gap-1 items-end">
                                    <span className="text-[9px] font-bold text-gray-400 uppercase">Assign to:</span>
                                    <select
                                      className="text-[10px] bg-gray-100 dark:bg-gray-700 border-none rounded px-2 py-1 max-w-[120px]"
                                      onChange={(e) => {
                                        const elec = electricians.find(el => el._id === e.target.value);
                                        if (elec) assignToElectrician(reportId!, elec._id, elec.name);
                                      }}
                                      defaultValue=""
                                    >
                                      <option value="" disabled>Select...</option>
                                      {electricians.map(el => <option key={el._id} value={el._id}>{el.name}</option>)}
                                    </select>
                                  </div>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                        {filteredReports.length === 0 && (
                          <tr>
                            <td colSpan={4} className="px-4 py-10 text-center text-gray-500 italic">No reports matching filters.</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}


          </div>
        </div>
      </div>

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

// UI Components
function NavButton({ label, icon, active, onClick }: any) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-4 px-6 py-4 transition-all border-l-4 text-left ${active
        ? 'border-teal-500 bg-teal-50 dark:bg-teal-900/10 text-teal-600'
        : 'border-transparent text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'
        }`}
    >
      <span className="text-xl">{icon}</span>
      <span className="font-semibold">{label}</span>
    </button>
  );
}

function StatCard({ title, value, color }: any) {
  const colors: any = {
    teal: 'text-teal-600 border-teal-100',
    blue: 'text-blue-600 border-blue-100',
    yellow: 'text-yellow-600 border-yellow-100',
    green: 'text-green-600 border-green-100'
  };
  return (
    <div className={`bg-white dark:bg-gray-900 rounded-xl shadow-sm border ${colors[color]} p-5`}>
      <div className="text-[10px] font-extrabold uppercase tracking-widest text-gray-400 mb-1">{title}</div>
      <div className={`text-3xl font-bold ${colors[color].split(' ')[0]}`}>{value}</div>
    </div>
  );
}

function FormField({ label, value, onChange, type = 'text', options = [] }: any) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-[10px] font-extrabold text-teal-700 dark:text-teal-400 uppercase tracking-tighter ml-1">{label}</label>
      {type === 'select' ? (
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 focus:ring-2 focus:ring-teal-500 outline-none"
        >
          <option value="">Select {label}...</option>
          {options.map((o: any) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      ) : type === 'textarea' ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 focus:ring-2 focus:ring-teal-500 outline-none min-h-[100px]"
        />
      ) : (
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 focus:ring-2 focus:ring-teal-500 outline-none"
        />
      )}
    </div>
  );
}

function InfoField({ label, value, fullWidth = false }: any) {
  return (
    <div className={`flex flex-col gap-1 ${fullWidth ? 'md:col-span-2' : ''}`}>
      <label className="text-[10px] font-extrabold text-teal-700 dark:text-teal-400 uppercase tracking-tighter">{label}</label>
      <div className="bg-gray-100 dark:bg-gray-800/80 rounded border border-gray-200 dark:border-gray-700 px-3 py-2 text-sm font-medium text-gray-800 dark:text-gray-200 min-h-[38px]">
        {value || '-'}
      </div>
    </div>
  );
}
