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
import {
  Shield,
  Users,
  FolderOpen,
  UserCheck,
  Wrench,
  BarChart2,
  Scale,
  Building2,
  UserCog,
  FileText,
  Loader2,
  ChevronRight,
  AlertTriangle,
} from 'lucide-react';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

function getTimeBasedGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

export default function AdminPage() {
  const { user, token, loading: authLoading } = useAuth();
  const router = useRouter();
  const { notification, showNotification, hideNotification } = useNotification();

  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [dataLoading, setDataLoading] = useState(true);
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
  const [pendingReportsCount, setPendingReportsCount] = useState(0);

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
      setDataLoading(true);
      try {
        const [casesRes, studentsRes, maintenanceRes, usersRes, reportsRes] = await Promise.all([
          fetch(`${API_BASE_URL}/cases`, { headers: { ...authHeaders() } }),
          fetch(`${API_BASE_URL}/students`, { headers: { ...authHeaders() } }),
          fetch(`${API_BASE_URL}/maintenance`, { headers: { ...authHeaders() } }),
          fetch(`${API_BASE_URL}/users`, { headers: { ...authHeaders() } }),
          fetch(`${API_BASE_URL}/student-reports?status=Pending`, { headers: { ...authHeaders() } }),
        ]);

        if (casesRes.ok) {
          const data = await casesRes.json();
          setCases(data.cases || data || []);
        }
        if (studentsRes.ok) {
          const data = await studentsRes.json();
          setStudents(data.students || data || []);
        }
        if (maintenanceRes.ok) {
          const data = await maintenanceRes.json();
          setMaintenanceReports(data.maintenance || data.reports || data || []);
        }
        if (usersRes.ok) {
          const data = await usersRes.json();
          const usersData = data.users || data || [];
          setUsersCount(Array.isArray(usersData) ? usersData.length : 0);
        }
        if (reportsRes.ok) {
          const data = await reportsRes.json();
          setPendingReportsCount(data.total ?? (data.reports?.length ?? 0));
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setDataLoading(false);
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
    return (
      <div className="flex items-center justify-center min-h-[50vh] text-kmuGreen">
        <Loader2 className="w-12 h-12 animate-spin" />
      </div>
    );
  }

  if (!user || user.role !== 'admin') {
    return <div className="text-red-600 p-12 text-center">Access denied.</div>;
  }

  const displayName = profile?.name || user?.name || user?.username || 'Administrator';

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
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100 pb-12">
      <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="animate-in fade-in duration-300 space-y-6">

          {/* Needs attention */}
          {pendingReportsCount > 0 && (
            <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-xl p-4 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-amber-800 dark:text-amber-200">
                <AlertTriangle className="w-5 h-5 shrink-0" />
                <span className="text-sm font-medium">{pendingReportsCount} student report(s) pending review</span>
              </div>
              <Link
                href="/reports"
                className="inline-flex items-center gap-1 text-sm font-semibold text-amber-700 dark:text-amber-300 hover:underline"
              >
                View reports
                <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
          )}

          {/* Page Header */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white dark:bg-gray-900 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-kmuGreen flex items-center justify-center text-white shrink-0">
                <Shield className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                  {getTimeBasedGreeting()}, {displayName}
                </h1>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Administrator dashboard · Discipline & facilities overview</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-3">
              <button
                onClick={exportCasesToWord}
                className="inline-flex items-center gap-2 bg-kmuGreen text-white px-5 py-2.5 rounded-lg font-semibold text-sm hover:bg-kmuGreen-dark transition shadow-sm"
              >
                <BarChart2 className="w-4 h-4" />
                Full System Report
              </button>
            </div>
          </div>

          {/* System Overview */}
          {dataLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 p-6 animate-pulse"
                >
                  <div className="h-4 w-24 bg-gray-200 dark:bg-gray-700 rounded mb-3" />
                  <div className="h-9 w-16 bg-gray-200 dark:bg-gray-700 rounded" />
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard title="Total Students" value={safeStudents.length} color="indigo" link="/students" icon={Users} />
              <StatCard title="Total Cases" value={safeCases.length} color="blue" link="/cases" icon={FolderOpen} />
              <StatCard title="Active Users" value={usersCount} color="emerald" link="/admin/users" icon={UserCheck} />
              <StatCard title="Maintenance" value={safeMaintenance.length} color="teal" link="/maintenance" icon={Wrench} />
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider">Case Distribution</h3>
                <select
                  className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-1.5 text-xs font-semibold outline-none focus:ring-2 focus:ring-kmuGreen transition-all"
                  value={programFilter}
                  onChange={(e) => setProgramFilter(e.target.value)}
                  disabled={dataLoading}
                >
                  <option value="">All Programs</option>
                  {programs.map((p: any) => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
              {dataLoading ? (
                <div className="h-64 flex items-center justify-center bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                  <Loader2 className="w-10 h-10 animate-spin text-kmuGreen" />
                </div>
              ) : (
                <div className="h-64">
                  <Bar
                    data={offenceChartData}
                    options={{
                      maintainAspectRatio: false,
                      plugins: { legend: { display: false } },
                      scales: {
                        y: { beginAtZero: true, grid: { color: 'rgba(0,0,0,0.05)' } },
                        x: { grid: { display: false } }
                      }
                    }}
                  />
                </div>
              )}
            </div>

            <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider">Maintenance by Category</h3>
                <select
                  className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-1.5 text-xs font-semibold outline-none focus:ring-2 focus:ring-kmuGreen transition-all"
                  value={hostelFilter}
                  onChange={(e) => setHostelFilter(e.target.value)}
                  disabled={dataLoading}
                >
                  <option value="">All Halls</option>
                  {hostels.map((h: any) => <option key={h} value={h}>{h}</option>)}
                </select>
              </div>
              {dataLoading ? (
                <div className="h-64 flex items-center justify-center bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                  <Loader2 className="w-10 h-10 animate-spin text-kmuGreen" />
                </div>
              ) : (
                <div className="h-64">
                  <Bar
                    data={maintenanceChartData}
                    options={{
                      maintainAspectRatio: false,
                      plugins: { legend: { display: false } },
                      scales: {
                        y: { beginAtZero: true, grid: { color: 'rgba(0,0,0,0.05)' } },
                        x: { grid: { display: false } }
                      }
                    }}
                  />
                </div>
              )}
            </div>
          </div>

          {/* Quick Links */}
          <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 p-6">
            <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-6">Quick Actions</h3>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <QuickLink href="/students" label="Registry" icon={Users} />
              <QuickLink href="/cases" label="Discipline" icon={Scale} />
              <QuickLink href="/maintenance" label="Facility" icon={Building2} />
              <QuickLink href="/admin/users" label="Users" icon={UserCog} />
              <QuickLink href="/reports" label="Reports" icon={FileText} />
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

function StatCard({ title, value, color, link, icon: Icon }: { title: string; value: number; color: string; link?: string; icon?: React.ComponentType<{ className?: string }> }) {
  const colors: Record<string, string> = {
    indigo: 'border-l-indigo-500 dark:border-l-indigo-400',
    blue: 'border-l-blue-500 dark:border-l-blue-400',
    emerald: 'border-l-emerald-500 dark:border-l-emerald-400',
    teal: 'border-l-teal-500 dark:border-l-teal-400'
  };

  const content = (
    <div className={`bg-white dark:bg-gray-900 rounded-xl shadow-sm border-l-4 p-6 transition-all hover:shadow-md ${colors[color] || ''}`}>
      <div className="flex items-center gap-2 text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">
        {Icon && <Icon className="w-4 h-4 shrink-0" />}
        {title}
      </div>
      <div className="text-3xl font-bold text-gray-900 dark:text-white tabular-nums">{value}</div>
    </div>
  );

  return link ? <Link href={link}>{content}</Link> : content;
}

function QuickLink({ href, label, icon: Icon }: { href: string; label: string; icon: React.ComponentType<{ className?: string }> }) {
  return (
    <Link href={href} className="flex flex-col items-center justify-center p-4 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 hover:border-kmuGreen hover:bg-kmuGreen/5 transition-all group">
      <Icon className="w-8 h-8 mb-2 text-gray-500 dark:text-gray-400 group-hover:text-kmuGreen transition-colors group-hover:scale-110" />
      <span className="text-xs font-semibold text-gray-600 dark:text-gray-300 group-hover:text-kmuGreen transition-colors">{label}</span>
    </Link>
  );
}