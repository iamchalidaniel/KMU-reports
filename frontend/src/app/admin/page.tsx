"use client";

import { useState, useEffect } from 'react';
import { saveAs } from 'file-saver';
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
import { useAuth } from '../../context/AuthContext';
import { API_BASE_URL } from '../../config/constants';
import { authHeaders, getProfile } from '../../utils/api';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { prepareChartExport } from '../../utils/chartExport';
import Notification, { useNotification } from '../../components/Notification';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

export default function AdminPage() {
  const { user, token, loading: authLoading } = useAuth();
  const router = useRouter();
  const { notification, showNotification, hideNotification } = useNotification();

  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [profile, setProfile] = useState<any>(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [programFilter, setProgramFilter] = useState('');
  const [hostelFilter, setHostelFilter] = useState('');
  const [cases, setCases] = useState([]);
  const [students, setStudents] = useState([]);
  const [usersCount, setUsersCount] = useState(0);
  const [maintenanceReports, setMaintenanceReports] = useState([]);
  const [filteredCases, setFilteredCases] = useState([]);

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
      if (!user || user.role !== 'admin') {
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

    async function fetchData() {
      try {
        const casesRes = await fetch(`${API_BASE_URL}/cases`, { headers: { ...authHeaders() } });
        const studentsRes = await fetch(`${API_BASE_URL}/students`, { headers: { ...authHeaders() } });

        if (casesRes.ok) {
          const data = await casesRes.json();
          setCases(data.cases || data || []);
        }
        if (studentsRes.ok) {
          const data = await studentsRes.json();
          setStudents(data.students || data || []);
        }

        const [maintenanceRes, usersRes] = await Promise.all([
          fetch(`${API_BASE_URL}/maintenance`, { headers: { ...authHeaders() } }),
          fetch(`${API_BASE_URL}/users`, { headers: { ...authHeaders() } })
        ]);

        if (maintenanceRes.ok) {
          const data = await maintenanceRes.json();
          setMaintenanceReports(data.maintenance || data || []);
        }
        if (usersRes.ok) {
          const data = await usersRes.json();
          const usersData = data.users || data || [];
          setUsersCount(usersData.length);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    }

    if (token) {
      fetchStaffProfile();
      fetchData();
    }
  }, [token]);

  const safeCases = Array.isArray(cases) ? cases : [];
  const safeStudents = Array.isArray(students) ? students : [];

  useEffect(() => {
    let result = safeCases;
    if (search) {
      result = result.filter((c: any) =>
        c.student?.fullName?.toLowerCase().includes(search.toLowerCase()) ||
        c.student?.studentId?.toLowerCase().includes(search.toLowerCase()) ||
        c.offenseType?.toLowerCase().includes(search.toLowerCase()) ||
        c.status?.toLowerCase().includes(search.toLowerCase())
      );
    }
    if (programFilter) {
      result = result.filter((c: any) => c.student?.program === programFilter);
    }
    setFilteredCases(result);
  }, [search, cases, programFilter]);

  async function exportCasesToWord() {
    try {
      const chartExportData = await prepareChartExport();
      const res = await fetch(`${API_BASE_URL}/reports/dashboard-cases`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...authHeaders()
        },
        body: JSON.stringify({
          charts: chartExportData.charts,
          pageInfo: {
            title: 'Admin Panel Full Report',
            url: typeof window !== 'undefined' ? window.location.href : ''
          }
        }),
      });
      if (!res.ok) throw new Error(await res.text());
      const blob = await res.blob();
      saveAs(blob, 'admin_full_report.docx');
      showNotification('success', 'Report exported successfully!');
    } catch (err) {
      console.error('Export error:', err);
      showNotification('error', 'Failed to export cases');
    }
  }

  if (isCheckingAuth) {
    return <div className="text-center text-kmuGreen p-12">Loading...</div>;
  }

  if (!user || user.role !== 'admin') {
    return <div className="text-red-600 p-12 text-center">Access denied.</div>;
  }

  // Analytics
  const analyticsCases = programFilter
    ? safeCases.filter((c: any) => c.student?.program === programFilter)
    : safeCases;

  const offenceCounts: Record<string, number> = {};
  analyticsCases.forEach((c: any) => {
    if (c.offenseType) offenceCounts[c.offenseType] = (offenceCounts[c.offenseType] || 0) + 1;
  });
  const topOffences = Object.entries(offenceCounts).sort((a, b) => b[1] - a[1]).slice(0, 5);

  const safeMaintenance = Array.isArray(maintenanceReports) ? maintenanceReports : [];
  const filteredMaintenance = hostelFilter
    ? safeMaintenance.filter((r: any) => r.location?.hall === hostelFilter)
    : safeMaintenance;

  const maintenanceCounts: Record<string, number> = {};
  filteredMaintenance.forEach((r: any) => {
    if (r.category) maintenanceCounts[r.category] = (maintenanceCounts[r.category] || 0) + 1;
  });
  const topMaintenance = Object.entries(maintenanceCounts).sort((a, b) => b[1] - a[1]).slice(0, 5);

  const offenceChartData = {
    labels: topOffences.map(([offence]) => offence),
    datasets: [{
      label: 'Offenses',
      data: topOffences.map(([, count]) => count),
      backgroundColor: 'rgba(16, 185, 129, 0.7)',
      borderRadius: 12,
    }]
  };

  const maintenanceChartData = {
    labels: topMaintenance.map(([cat]) => cat),
    datasets: [{
      label: 'Issues',
      data: topMaintenance.map(([, count]) => count),
      backgroundColor: 'rgba(59, 130, 246, 0.7)',
      borderRadius: 12,
    }]
  };

  const programs = Array.from(new Set(safeStudents.map((s: any) => s.program).filter(Boolean)));
  const hostels = Array.from(new Set(safeMaintenance.map((r: any) => r.location?.hall).filter(Boolean)));

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100 pb-12 font-serif">
      <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="animate-in fade-in duration-300 space-y-6">

          {/* Executive Command Bar */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white dark:bg-gray-900 p-8 rounded-3xl border-t-4 border-indigo-600 shadow-xl gap-4">
            <div>
              <h1 className="text-3xl font-black tracking-tighter text-gray-900 dark:text-white uppercase italic">Administrator Terminal</h1>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.3em] mt-1">KMU Unified Governance & System Hub</p>
            </div>
            <div className="flex flex-wrap gap-3">
              <button
                onClick={exportCasesToWord}
                className="bg-indigo-600 text-white px-8 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:shadow-lg hover:shadow-indigo-500/20 transition flex items-center gap-2 group border-none"
              >
                <span className="group-hover:animate-pulse">📊</span> System Audit Report
              </button>
            </div>
          </div>

          {/* Strategic Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard title="Total Students" value={safeStudents.length} color="indigo" link="/students" />
            <StatCard title="Index of Cases" value={safeCases.length} color="blue" link="/cases" />
            <StatCard title="Active Users" value={usersCount} color="emerald" link="/admin/users" />
            <StatCard title="Maintenance Load" value={safeMaintenance.length} color="teal" link="/maintenance" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Disciplinary Intelligence */}
            <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-sm border border-gray-200 dark:border-gray-800 p-8">
              <div className="flex justify-between items-center mb-8">
                <h3 className="text-xs font-black uppercase tracking-widest text-gray-400 font-bold">Disciplinary Distribution</h3>
                <select
                  className="bg-gray-50 dark:bg-gray-800 border-none rounded-xl px-4 py-2 text-[10px] font-black uppercase outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-sans"
                  value={programFilter}
                  onChange={(e) => setProgramFilter(e.target.value)}
                >
                  <option value="">Full University</option>
                  {programs.map((p: any) => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
              <div className="h-64 flex items-center justify-center">
                <Bar
                  data={offenceChartData}
                  options={{
                    maintainAspectRatio: false,
                    plugins: { legend: { display: false } },
                    scales: { y: { beginAtZero: true, grid: { display: false } }, x: { grid: { display: false } } }
                  }}
                />
              </div>
            </div>

            {/* Maintenance Intelligence */}
            <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-sm border border-gray-200 dark:border-gray-800 p-8">
              <div className="flex justify-between items-center mb-8">
                <h3 className="text-xs font-black uppercase tracking-widest text-gray-400 font-bold">Facility Infrastructure Load</h3>
                <select
                  className="bg-gray-50 dark:bg-gray-800 border-none rounded-xl px-4 py-2 text-[10px] font-black uppercase outline-none focus:ring-2 focus:ring-blue-500 transition-all font-sans"
                  value={hostelFilter}
                  onChange={(e) => setHostelFilter(e.target.value)}
                >
                  <option value="">All Regions</option>
                  {hostels.map((h: any) => <option key={h} value={h}>{h}</option>)}
                </select>
              </div>
              <div className="h-64 flex items-center justify-center">
                <Bar
                  data={maintenanceChartData}
                  options={{
                    maintainAspectRatio: false,
                    plugins: { legend: { display: false } },
                    scales: { y: { beginAtZero: true, grid: { display: false } }, x: { grid: { display: false } } }
                  }}
                />
              </div>
            </div>
          </div>

          {/* Operational Links Area */}
          <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-sm border border-gray-200 dark:border-gray-800 p-8">
            <h3 className="text-xs font-black uppercase tracking-widest text-gray-400 mb-8 font-bold">Quick Administrative Dispatch</h3>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <QuickLink href="/students" label="Registry" icon="👥" />
              <QuickLink href="/cases" label="Discipline" icon="⚖️" />
              <QuickLink href="/maintenance" label="Facility" icon="🏢" />
              <QuickLink href="/admin/users" label="Users" icon="🔐" />
              <QuickLink href="/reports" label="Reports" icon="📜" />
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

function StatCard({ title, value, color, link }: any) {
  const colors: any = {
    indigo: 'text-indigo-700 bg-indigo-50/30 border-indigo-100 dark:bg-indigo-950/10 dark:border-indigo-900/50',
    blue: 'text-blue-700 bg-blue-50/30 border-blue-100 dark:bg-blue-950/10 dark:border-blue-900/50',
    emerald: 'text-emerald-700 bg-emerald-50/30 border-emerald-100 dark:bg-emerald-950/10 dark:border-emerald-900/50',
    teal: 'text-teal-700 bg-teal-50/30 border-teal-100 dark:bg-teal-950/10 dark:border-teal-900/50'
  };

  const content = (
    <div className={`bg-white dark:bg-gray-900 rounded-3xl shadow-sm border p-8 transition-all duration-300 ${colors[color]} cursor-pointer hover:shadow-lg`}>
      <div className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 mb-3">{title}</div>
      <div className="text-4xl font-black tracking-tight italic">{value}</div>
    </div>
  );

  return link ? <Link href={link}>{content}</Link> : content;
}

function QuickLink({ href, label, icon }: any) {
  return (
    <Link href={href} className="flex flex-col items-center justify-center p-6 bg-gray-50/50 dark:bg-gray-800/50 rounded-2xl border border-transparent hover:border-indigo-500/30 hover:bg-indigo-50/10 transition-all group">
      <span className="text-2xl mb-2 group-hover:scale-110 transition-transform">{icon}</span>
      <span className="text-[10px] font-black uppercase tracking-widest text-gray-500 group-hover:text-indigo-600 transition-colors">{label}</span>
    </Link>
  );
}