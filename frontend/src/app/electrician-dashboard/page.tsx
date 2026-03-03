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
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100 pb-12 font-sans text-sm">
      <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="animate-in fade-in duration-300 space-y-6">

          {/* Electrician Header */}
          <div className="bg-white dark:bg-gray-900 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div>
              <h1 className="text-xl font-bold text-gray-900 dark:text-white tracking-tight">Maintenance Dashboard</h1>
              <p className="text-xs text-blue-600 font-semibold mt-1">Repair Tasks</p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link
                href="/electrician-dashboard/tasks"
                className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-lg font-bold text-xs transition shadow-sm"
              >
                View Tasks
              </Link>
              <Link
                href="/electrician-dashboard/reports"
                className="bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 px-5 py-2 rounded-lg font-bold text-xs transition border border-gray-200 dark:border-gray-700"
              >
                Reports
              </Link>
              <Link
                href="/maintenance"
                className="bg-gray-900 dark:bg-white dark:text-gray-900 text-white px-5 py-2 rounded-lg font-bold text-xs transition shadow-sm"
              >
                History
              </Link>
            </div>
          </div>

          {/* System Overview */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard title="Assigned" value={reports.length} color="blue" />
            <StatCard title="Pending" value={reports.filter(r => r.status === 'Assigned').length} color="indigo" />
            <StatCard title="In Progress" value={reports.filter(r => r.status === 'In Progress').length} color="orange" />
            <StatCard title="Completed" value={reports.filter(r => r.status === 'Completed').length} color="emerald" />
          </div>

          {/* Priority Tasks Snippet */}
          <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 overflow-hidden">
            <div className="p-6 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center bg-gray-50/30 dark:bg-gray-800/20">
              <h2 className="text-base font-bold">Priority Tasks</h2>
              <Link href="/electrician-dashboard/tasks" className="text-xs font-bold text-blue-600 hover:underline">Full Registry →</Link>
            </div>
            <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredReports.slice(0, 6).map(report => {
                const reportId = report._id || report.id;
                return (
                  <div key={reportId} className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-5 border border-gray-100 dark:border-gray-700 hover:border-blue-500/30 transition-all group flex flex-col">
                    <div className="mb-3 flex justify-between items-start">
                      <span className="text-[10px] font-bold text-blue-600 border border-blue-600/20 px-2 py-0.5 rounded uppercase tracking-wider">
                        {report.category}
                      </span>
                      {report.priority === 'Urgent' && <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />}
                    </div>
                    <h3 className="font-bold text-xs text-gray-900 dark:text-gray-100 mb-1 truncate">
                      {report.location.hall} • Unit {report.location.room}
                    </h3>
                    <p className="text-[11px] text-gray-500 dark:text-gray-400 line-clamp-2 leading-relaxed italic mb-4">
                      "{report.description}"
                    </p>
                    <div className="flex items-center justify-between mt-auto pt-3 border-t border-gray-100 dark:border-gray-800">
                      <span className="text-[10px] font-bold text-gray-400 uppercase">{report.status}</span>
                      <Link href={`/maintenance/${reportId}`} className="text-[10px] font-bold text-blue-600 hover:underline">View Details</Link>
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
    <div className={`bg-white dark:bg-gray-900 rounded-xl shadow-sm border-l-4 p-6 transition-all hover:scale-[1.01] ${colors[color]}`}>
      <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">{title}</div>
      <div className="text-2xl font-bold text-gray-900 dark:text-white tabular-nums">{value}</div>
    </div>
  );
}
