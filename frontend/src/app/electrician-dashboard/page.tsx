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
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100 pb-12 font-serif">
      <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="animate-in fade-in duration-300 space-y-6">

          {/* Executive Command Bar */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white dark:bg-gray-900 p-8 rounded-3xl border-t-4 border-blue-600 shadow-xl gap-4">
            <div>
              <h1 className="text-3xl font-black tracking-tighter text-gray-900 dark:text-white uppercase italic">Electrical Command</h1>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.3em] mt-1">Infrastructure Maintenance & Technical Operations</p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link
                href="/maintenance"
                className="bg-blue-600 text-white px-6 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:shadow-lg hover:shadow-blue-500/20 transition flex items-center gap-2 group border-none"
              >
                <span className="group-hover:animate-pulse">⚡</span> Infrastructure Ledger
              </Link>
            </div>
          </div>

          {/* Strategic Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard title="Asset Reports" value={reports.length} color="blue" />
            <StatCard title="Assigned Tasks" value={reports.filter(r => r.status === 'Assigned').length} color="indigo" />
            <StatCard title="In Operation" value={reports.filter(r => r.status === 'In Progress').length} color="orange" />
            <StatCard title="Restored" value={reports.filter(r => r.status === 'Completed').length} color="emerald" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Asset Distribution */}
            <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-sm border border-gray-200 dark:border-gray-800 p-8">
              <div className="flex justify-between items-center mb-8">
                <h3 className="text-xs font-black uppercase tracking-widest text-gray-400 font-bold">Asset Type Distribution</h3>
                <select
                  className="bg-gray-50 dark:bg-gray-800 border-none rounded-xl px-4 py-2 text-[10px] font-black uppercase outline-none focus:ring-2 focus:ring-blue-500 transition-all font-sans"
                  value={hallFilter}
                  onChange={(e) => setHallFilter(e.target.value)}
                >
                  <option value="">All Locations</option>
                  {halls.map((h: any) => <option key={h} value={h}>{h}</option>)}
                </select>
              </div>
              <div className="h-64 flex items-center justify-center">
                <Doughnut
                  data={categoryChartData}
                  options={{
                    maintainAspectRatio: false,
                    plugins: { legend: { position: 'right', labels: { boxWidth: 10, font: { size: 10, weight: 'bold' } } } }
                  }}
                />
              </div>
            </div>

            {/* Operational Status */}
            <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-sm border border-gray-200 dark:border-gray-800 p-8">
              <h3 className="text-xs font-black uppercase tracking-widest text-gray-400 mb-8 font-bold">Operational Status Index</h3>
              <div className="h-64 flex items-center justify-center">
                <Doughnut
                  data={statusChartData}
                  options={{
                    maintainAspectRatio: false,
                    plugins: { legend: { position: 'right', labels: { boxWidth: 10, font: { size: 10, weight: 'bold' } } } }
                  }}
                />
              </div>
            </div>
          </div>

          {/* Maintenance Task Ledger */}
          <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-sm border border-gray-200 dark:border-gray-800 overflow-hidden flex flex-col">
            <div className="p-8 border-b border-gray-100 dark:border-gray-800 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <h2 className="text-lg font-black uppercase tracking-tighter italic">Technical Dispatch Ledger</h2>
              <div className="flex gap-2 w-full md:w-auto font-sans">
                <input
                  placeholder="Search assets..."
                  className="bg-gray-50 dark:bg-gray-800 border-none rounded-2xl px-5 py-3 text-xs focus:ring-2 focus:ring-blue-500 transition-all shadow-inner w-full md:w-64"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
                <select
                  className="bg-gray-50 dark:bg-gray-800 border-none rounded-2xl px-5 py-3 text-xs focus:ring-2 focus:ring-blue-500 transition-all shadow-inner"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <option value="">Status</option>
                  {STATUSES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                </select>
              </div>
            </div>
            <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 font-sans">
              {filteredReports.slice(0, 12).map(report => {
                const reportId = report._id || report.id;
                return (
                  <div key={reportId} className="bg-gray-50 dark:bg-gray-800/50 rounded-2xl p-6 border border-transparent hover:border-blue-500/30 transition-all group relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4">
                      <select
                        value={report.status}
                        onChange={(e) => updateStatus(reportId!, e.target.value)}
                        className={`text-[9px] font-black uppercase tracking-widest border-none rounded-lg px-3 py-1.5 focus:ring-0 cursor-pointer ${report.status === 'Completed' ? 'bg-emerald-100 text-emerald-700' :
                          report.status === 'In Progress' ? 'bg-orange-100 text-orange-700' : 'bg-blue-100 text-blue-700'
                          }`}
                      >
                        {STATUSES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                      </select>
                    </div>
                    <div className="mb-4">
                      <span className="text-[9px] font-black tracking-[0.2em] text-blue-500 uppercase mb-2 block">
                        {ELECTRICAL_CATEGORIES.find(c => c.value === report.category)?.label || report.category}
                      </span>
                      <h3 className="font-bold text-sm text-gray-900 dark:text-gray-100 uppercase group-hover:text-blue-600 transition-colors">
                        {report.location.hall} {report.location.room ? `• ${report.location.room}` : ''}
                      </h3>
                    </div>
                    <p className="text-gray-500 dark:text-gray-400 text-xs mb-6 line-clamp-3 leading-relaxed">
                      {report.description}
                    </p>
                    <div className="flex items-center justify-between mt-auto pt-4 border-t border-gray-100 dark:border-gray-700/50">
                      <span className="text-[9px] text-gray-400 font-black uppercase tracking-tighter">REF: {reportId?.slice(-6).toUpperCase()}</span>
                      <Link href={`/maintenance/${reportId}`} className="text-[9px] font-black text-blue-600 hover:text-blue-700 uppercase tracking-widest transition-all">Command View →</Link>
                    </div>
                  </div>
                );
              })}
              {filteredReports.length === 0 && (
                <div className="col-span-full text-center py-24 text-gray-400 italic text-sm font-serif">No technical dispatches found in registry.</div>
              )}
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
    blue: 'text-blue-700 bg-blue-50/30 border-blue-100 dark:bg-blue-950/10 dark:border-blue-900/50',
    indigo: 'text-indigo-700 bg-indigo-50/30 border-indigo-100 dark:bg-indigo-950/10 dark:border-indigo-900/50',
    orange: 'text-orange-700 bg-orange-50/30 border-orange-100 dark:bg-orange-950/10 dark:border-orange-900/50',
    emerald: 'text-emerald-700 bg-emerald-50/30 border-emerald-100 dark:bg-emerald-950/10 dark:border-emerald-900/50'
  };
  return (
    <div className={`bg-white dark:bg-gray-900 rounded-3xl shadow-sm border p-8 transition-all duration-300 ${colors[color]}`}>
      <div className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 mb-3">{title}</div>
      <div className="text-4xl font-black tracking-tight">{value}</div>
    </div>
  );
}
