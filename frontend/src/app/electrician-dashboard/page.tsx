"use client";

import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { API_BASE_URL } from '../../config/constants';
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
import Notification, { useNotification } from '../../components/Notification';
import { authHeaders, getProfile } from '../../utils/api';

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
  const { notification, showNotification, hideNotification } = useNotification();

  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [profile, setProfile] = useState<any>(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [reports, setReports] = useState<MaintenanceReport[]>([]);
  const [filteredReports, setFilteredReports] = useState<MaintenanceReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [hallFilter, setHallFilter] = useState('');

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

  useEffect(() => {
    async function fetchStaffProfile() {
      try {
        setProfileLoading(true);
        const data = await getProfile();
        setProfile(data);
      } catch (err) {
        console.error('Failed to fetch profile:', err);
      } finally {
        setProfileLoading(false);
      }
    }

    async function fetchReports() {
      try {
        setLoading(true);
        const res = await fetch(`${API_BASE_URL}/maintenance`, {
          headers: { ...authHeaders() }
        });
        if (!res.ok) throw new Error('Failed to fetch reports');
        const data = await res.json();
        const electricalReports = (data.reports || data || []).filter((r: MaintenanceReport) =>
          ELECTRICAL_CATEGORIES.some(cat => cat.value === r.category)
        );
        setReports(electricalReports);
      } catch (err: any) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    if (token) {
      fetchStaffProfile();
      fetchReports();
    }
  }, [token]);

  useEffect(() => {
    let filtered = [...reports];
    if (search) {
      filtered = filtered.filter(r =>
        r.description.toLowerCase().includes(search.toLowerCase()) ||
        r.location.room?.toLowerCase().includes(search.toLowerCase()) ||
        r.location.hall?.toLowerCase().includes(search.toLowerCase()) ||
        r.reported_by.name?.toLowerCase().includes(search.toLowerCase())
      );
    }
    if (statusFilter) filtered = filtered.filter(r => r.status === statusFilter);
    setFilteredReports(filtered);
  }, [search, statusFilter, reports]);

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

      // Refresh reports
      const resReports = await fetch(`${API_BASE_URL}/maintenance`, { headers: { ...authHeaders() } });
      if (resReports.ok) {
        const data = await resReports.json();
        const electricalReports = (data.reports || data || []).filter((r: MaintenanceReport) =>
          ELECTRICAL_CATEGORIES.some(cat => cat.value === r.category)
        );
        setReports(electricalReports);
      }
      showNotification('success', 'Status updated successfully');
    } catch (err: any) {
      showNotification('error', err?.message || 'Failed to update status');
    }
  }

  if (isCheckingAuth) {
    return <div className="text-center text-kmuGreen p-12">Loading...</div>;
  }

  if (!user || user.role !== 'electrician') {
    return <div className="text-red-600 p-12">Access denied.</div>;
  }

  const categoryCounts: Record<string, number> = {};
  const statusCounts: Record<string, number> = {};

  const analyticsReports = hallFilter
    ? reports.filter(r => r.location.hall === hallFilter)
    : reports;

  analyticsReports.forEach(r => {
    if (r.category) categoryCounts[r.category] = (categoryCounts[r.category] || 0) + 1;
    if (r.status) statusCounts[r.status] = (statusCounts[r.status] || 0) + 1;
  });

  const categoryChartData = {
    labels: Object.keys(categoryCounts).map(c => ELECTRICAL_CATEGORIES.find(cat => cat.value === c)?.label || c),
    datasets: [{
      data: Object.values(categoryCounts),
      backgroundColor: ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'],
      borderWidth: 0,
    }],
  };

  const statusChartData = {
    labels: Object.keys(statusCounts),
    datasets: [{
      data: Object.values(statusCounts),
      backgroundColor: ['#10B981', '#3B82F6', '#F59E0B', '#EF4444', '#8B5CF6'],
      borderWidth: 0,
    }],
  };

  const halls = Array.from(new Set(reports.map(r => r.location.hall).filter(Boolean)));

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100 pb-12 font-sans">
      <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="animate-in fade-in duration-300 space-y-6">

          {/* Electrician Header */}
          <div className="bg-white dark:bg-gray-900 p-8 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-800 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div>
              <h1 className="text-3xl font-black text-gray-900 dark:text-white uppercase tracking-tight">Maintenance Dashboard</h1>
              <p className="text-sm text-blue-600 font-black uppercase tracking-widest mt-1">System Maintenance & Equipment Logistics</p>
            </div>
            <div className="flex flex-wrap gap-4">
              <Link
                href="/electrician-dashboard/tasks"
                className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3.5 rounded-xl font-black text-[10px] uppercase tracking-[0.2em] transition shadow-xl hover:scale-[1.02] active:scale-95 flex items-center gap-2"
              >
                🛠️ View Tasks
              </Link>
              <Link
                href="/maintenance"
                className="bg-gray-900 dark:bg-white dark:text-gray-900 text-white px-8 py-3.5 rounded-xl font-black text-[10px] uppercase tracking-[0.2em] transition shadow-xl hover:scale-[1.02] active:scale-95 flex items-center gap-2"
              >
                📜 Maintenance History
              </Link>
            </div>
          </div>

          {/* System Overview */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard title="Assigned Tasks" value={reports.length} color="blue" />
            <StatCard title="Pending Tasks" value={reports.filter(r => r.status === 'Assigned').length} color="indigo" />
            <StatCard title="Tasks In Progress" value={reports.filter(r => r.status === 'In Progress').length} color="orange" />
            <StatCard title="Completed Tasks" value={reports.filter(r => r.status === 'Completed').length} color="emerald" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Asset Distribution */}
            <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-800 p-8">
              <div className="flex justify-between items-center mb-12">
                <h3 className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Faults by Category</h3>
                <select
                  className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-4 py-2 text-[10px] font-black uppercase outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                  value={hallFilter}
                  onChange={(e) => setHallFilter(e.target.value)}
                >
                  <option value="">All Institutional Zones</option>
                  {halls.map((h: any) => <option key={h} value={h}>{h}</option>)}
                </select>
              </div>
              <div className="h-64 flex items-center justify-center">
                <Doughnut
                  data={categoryChartData}
                  options={{
                    maintainAspectRatio: false,
                    cutout: '75%',
                    plugins: { legend: { position: 'right', labels: { boxWidth: 10, padding: 20, font: { family: 'sans-serif', size: 10, weight: 'bold' } } } }
                  }}
                />
              </div>
            </div>

            {/* Operational Status */}
            <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-800 p-8">
              <h3 className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-12">Maintenance Status Summary</h3>
              <div className="h-64 flex items-center justify-center">
                <Doughnut
                  data={statusChartData}
                  options={{
                    maintainAspectRatio: false,
                    cutout: '75%',
                    plugins: { legend: { position: 'right', labels: { boxWidth: 10, padding: 20, font: { family: 'sans-serif', size: 10, weight: 'bold' } } } }
                  }}
                />
              </div>
            </div>
          </div>

          {/* Quick Tasks Snippet */}
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-800 overflow-hidden">
            <div className="p-8 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center bg-gray-50/30 dark:bg-gray-800/20">
              <h2 className="text-xl font-black uppercase tracking-tight">Priority Maintenance Tasks</h2>
              <Link href="/electrician-dashboard/tasks" className="text-[10px] font-black text-blue-600 uppercase tracking-widest hover:underline transition-all">Full Registry →</Link>
            </div>
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredReports.slice(0, 6).map(report => {
                const reportId = report._id || report.id;
                return (
                  <div key={reportId} className="bg-gray-50 dark:bg-gray-800/50 rounded-2xl p-6 border border-gray-100 dark:border-gray-700 hover:border-blue-500/30 transition-all group relative">
                    <div className="mb-4 flex justify-between items-start">
                      <span className="text-[8px] font-black text-blue-600 border border-blue-600/30 px-2 py-0.5 rounded uppercase tracking-widest">
                        {report.category}
                      </span>
                      <div className={`w-2 h-2 rounded-full ${report.priority === 'Urgent' ? 'bg-red-500 animate-pulse' : 'bg-gray-300'}`} />
                    </div>
                    <h3 className="font-black text-xs text-gray-900 dark:text-gray-100 uppercase tracking-tight mb-2 truncate">
                      {report.location.hall} • Unit {report.location.room}
                    </h3>
                    <p className="text-[10px] text-gray-500 dark:text-gray-400 line-clamp-2 leading-relaxed italic mb-6">
                      "{report.description}"
                    </p>
                    <div className="flex items-center justify-between mt-auto pt-4 border-t border-gray-100 dark:border-gray-800">
                      <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest">{report.status}</span>
                      <Link href={`/maintenance/${reportId}`} className="text-[9px] font-black text-blue-600 uppercase tracking-widest group-hover:underline">Detailed Audit</Link>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {notification?.isVisible && (
        <Notification type={notification.type} message={notification.message} isVisible={notification.isVisible} onClose={hideNotification} />
      )}
    </div>
  );
}

function StatCard({ title, value, color }: any) {
  const colors: any = {
    blue: 'border-blue-500 dark:border-blue-400 shadow-blue-500/5',
    indigo: 'border-indigo-500 dark:border-indigo-400 shadow-indigo-500/5',
    orange: 'border-orange-500 dark:border-orange-400 shadow-orange-500/5',
    emerald: 'border-emerald-500 dark:border-emerald-400 shadow-emerald-500/5'
  };
  return (
    <div className={`bg-white dark:bg-gray-900 rounded-2xl shadow-xl border-l-4 p-8 transition-all hover:scale-[1.02] ${colors[color]}`}>
      <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">{title}</div>
      <div className="text-4xl font-black text-gray-900 dark:text-white tabular-nums">{value}</div>
    </div>
  );
}
