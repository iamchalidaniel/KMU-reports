"use client";

import { useState, useEffect } from 'react';
import { saveAs } from 'file-saver';
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
import { useAuth } from '../../context/AuthContext';
import { API_BASE_URL } from '../../config/constants';
import { fetchWithAuth, authHeaders, getProfile } from '../../utils/api';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import type { Case, Student } from '../../../types/global.d';
import { prepareChartExport } from '../../utils/chartExport';
import Notification, { useNotification } from '../../components/Notification';

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Title, Tooltip, Legend);

export default function AssistantDeanDashboard() {
  const { user, token, loading: authLoading } = useAuth();
  const router = useRouter();
  const { notification, showNotification, hideNotification } = useNotification();

  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [profile, setProfile] = useState<any>(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [cases, setCases] = useState<Case[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [filteredCases, setFilteredCases] = useState<Case[]>([]);
  const [filteredStudents, setFilteredStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [programFilter, setProgramFilter] = useState('');

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
      if (!user || user.role !== 'assistant_dean') {
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
      setLoading(true);
      setError(null);
      try {
        const casesData = await fetchWithAuth(`${API_BASE_URL}/cases`);
        setCases(Array.isArray(casesData) ? casesData : (casesData.cases || casesData || []));

        const studentsData = await fetchWithAuth(`${API_BASE_URL}/students`);
        setStudents(Array.isArray(studentsData) ? studentsData : (studentsData.students || studentsData || []));
      } catch (error: any) {
        console.error('Error fetching data:', error);
        setError(error.message || 'Failed to fetch data');
        setCases([]);
        setStudents([]);
      } finally {
        setLoading(false);
      }
    }

    if (token) {
      fetchStaffProfile();
      fetchData();
    }
  }, [token]);

  const safeStudents = Array.isArray(students) ? students : [];
  const safeCases = Array.isArray(cases) ? cases : [];

  useEffect(() => {
    let casesResult = safeCases;
    if (search) {
      casesResult = casesResult.filter((c: any) =>
        c.student?.fullName?.toLowerCase().includes(search.toLowerCase()) ||
        c.student?.studentId?.toLowerCase().includes(search.toLowerCase()) ||
        c.offenseType?.toLowerCase().includes(search.toLowerCase()) ||
        c.status?.toLowerCase().includes(search.toLowerCase())
      );
    }
    if (programFilter) {
      casesResult = casesResult.filter((c: any) => c.student?.program === programFilter);
    }
    setFilteredCases(casesResult);

    let studentsResult = safeStudents;
    if (search) {
      studentsResult = studentsResult.filter((s: any) =>
        s.fullName?.toLowerCase().includes(search.toLowerCase()) ||
        s.studentId?.toLowerCase().includes(search.toLowerCase())
      );
    }
    setFilteredStudents(studentsResult);
  }, [search, cases, students, programFilter]);

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
            title: 'Assistant Dean Dashboard - All Cases Report',
            url: typeof window !== 'undefined' ? window.location.href : ''
          }
        }),
      });

      if (!res.ok) throw new Error(await res.text());
      const blob = await res.blob();
      saveAs(blob, 'assistant_dean_all_cases_report.docx');
      showNotification('success', 'Report exported successfully!');
    } catch (err) {
      console.error('Export cases error:', err);
      showNotification('error', 'Failed to export cases');
    }
  }

  if (isCheckingAuth) {
    return <div className="text-center text-kmuGreen p-12">Loading...</div>;
  }

  if (!user || user.role !== 'assistant_dean') {
    return <div className="text-red-600 p-12">Access denied.</div>;
  }

  const staffData = profile || user;

  // Visualization data
  const totalCasesCount = filteredCases.length;
  const totalStudentsCount = safeStudents.length;
  const pendingCases = filteredCases.filter(c => c.status === 'Open' || c.status === 'Under Investigation').length;
  const resolvedCases = filteredCases.filter(c => c.status === 'Closed').length;

  const analyticsCases = programFilter
    ? safeCases.filter((c: any) => c.student?.program === programFilter)
    : safeCases;

  const statusCounts: Record<string, number> = {};
  const offenseCounts: Record<string, number> = {};
  const offenderCounts: Record<string, number> = {};

  analyticsCases.forEach((c: Case) => {
    if (c.status) statusCounts[c.status] = (statusCounts[c.status] || 0) + 1;
    if (c.offenseType) offenseCounts[c.offenseType] = (offenseCounts[c.offenseType] || 0) + 1;
    if (c.student?.fullName) offenderCounts[c.student.fullName] = (offenderCounts[c.student.fullName] || 0) + 1;
  });

  const statusChartData = {
    labels: Object.keys(statusCounts),
    datasets: [
      {
        label: 'Cases by Status',
        data: Object.values(statusCounts),
        backgroundColor: [
          'rgba(59, 130, 246, 0.7)',
          'rgba(251, 191, 36, 0.7)',
          'rgba(34, 197, 94, 0.7)',
          'rgba(168, 85, 247, 0.7)',
        ],
      },
    ],
  };

  const topOffences = Object.entries(offenseCounts).sort((a, b) => b[1] - a[1]).slice(0, 5);
  const topOffenders = Object.entries(offenderCounts).sort((a, b) => b[1] - a[1]).slice(0, 5);
  const programs = Array.from(new Set(safeStudents.map((s: any) => s.program).filter(Boolean)));

  const offenseChartData = {
    labels: topOffences.map(([offence]) => offence),
    datasets: [
      {
        label: 'Most Common Offences',
        data: topOffences.map(([, count]) => count),
        backgroundColor: 'rgba(16, 185, 129, 0.7)',
      },
    ],
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100 pb-12">
      <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="animate-in fade-in duration-300 space-y-6">

          {/* Page Header */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white dark:bg-gray-900 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white uppercase tracking-tight">Assistant Dean Dashboard</h1>
              <p className="text-sm text-gray-500 font-medium mt-1 uppercase tracking-wider">Academic oversight and disciplinary control center</p>
            </div>
            <div className="flex flex-wrap gap-3">
              <button
                onClick={exportCasesToWord}
                className="bg-gray-900 dark:bg-white dark:text-gray-900 text-white px-6 py-2.5 rounded-lg font-bold text-xs hover:opacity-90 transition flex items-center gap-2 shadow-sm uppercase tracking-wider"
              >
                📊 Export Registry
              </button>
              <Link
                href="/reports"
                className="bg-blue-600 text-white px-6 py-2.5 rounded-lg font-bold text-xs hover:bg-blue-700 transition flex items-center gap-2 shadow-sm uppercase tracking-wider"
              >
                📂 Full Reports
              </Link>
            </div>
          </div>

          {/* Quick Navigation Panel */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Link href="/assistant-dean-dashboard/cases" className="bg-white dark:bg-gray-900 p-6 rounded-xl border border-gray-200 dark:border-gray-800 hover:border-red-500/50 transition-all group shadow-sm">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-lg font-bold uppercase tracking-tight group-hover:text-red-600 transition-colors">Manage Cases</h3>
                  <p className="text-xs text-gray-500 font-medium mt-1">Review, update, and export disciplinary records</p>
                </div>
                <span className="text-2xl group-hover:translate-x-1 transition-transform">➡️</span>
              </div>
            </Link>
            <Link href="/assistant-dean-dashboard/students" className="bg-white dark:bg-gray-900 p-6 rounded-xl border border-gray-200 dark:border-gray-800 hover:border-kmuGreen/50 transition-all group shadow-sm">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-lg font-bold uppercase tracking-tight group-hover:text-kmuGreen transition-colors">Student Registry</h3>
                  <p className="text-xs text-gray-500 font-medium mt-1">View student profiles, programs, and academic status</p>
                </div>
                <span className="text-2xl group-hover:translate-x-1 transition-transform">➡️</span>
              </div>
            </Link>
          </div>

          {/* System Overview Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard title="Total Students" value={totalStudentsCount} color="indigo" />
            <StatCard title="Total Cases" value={totalCasesCount} color="purple" />
            <StatCard title="Open Cases" value={pendingCases} color="orange" />
            <StatCard title="Resolved" value={resolvedCases} color="green" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Case Status Distribution */}
            <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 p-6">
              <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-6">Case Status Metrics</h3>
              <div className="h-64">
                <Doughnut
                  data={statusChartData}
                  options={{
                    maintainAspectRatio: false,
                    plugins: { legend: { position: 'right', labels: { boxWidth: 10, font: { size: 10, weight: 'bold' } } } }
                  }}
                />
              </div>
            </div>

            {/* Offense Frequency */}
            <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider">Offense Intensity</h3>
                <select
                  className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-1.5 text-xs font-semibold outline-none focus:ring-2 focus:ring-kmuGreen transition-all"
                  value={programFilter}
                  onChange={(e) => setProgramFilter(e.target.value)}
                >
                  <option value="">All Programs</option>
                  {programs.map((p: any) => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
              <div className="h-64">
                <Bar
                  data={offenseChartData}
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
            </div>
          </div>

          {/* Frequent Offenders Snippet */}
          <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 p-6">
            <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-6">Frequent Offenders (Critical Watchlist)</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {topOffenders.length > 0 ? topOffenders.map(([name, count], i) => (
                <div key={i} className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-100 dark:border-gray-700">
                  <span className="font-bold text-xs text-gray-700 dark:text-gray-300 uppercase">{name}</span>
                  <span className="bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 px-2.5 py-1 rounded-full text-[9px] font-black uppercase">{count} Incidents</span>
                </div>
              )) : <p className="text-center text-gray-500 py-12 italic text-sm col-span-full uppercase tracking-widest">No critical watchlist items.</p>}
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
    indigo: 'border-indigo-500 dark:border-indigo-400',
    purple: 'border-purple-500 dark:border-purple-400',
    orange: 'border-orange-500 dark:border-orange-400',
    green: 'border-green-500 dark:border-green-400'
  };
  return (
    <div className={`bg-white dark:bg-gray-900 rounded-xl shadow-sm border-l-4 p-6 transition-all hover:shadow-md ${colors[color]}`}>
      <div className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">{title}</div>
      <div className="text-3xl font-bold text-gray-900 dark:text-white">{value}</div>
    </div>
  );
}

function NavButton({ label, icon, active, onClick }: any) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-4 px-6 py-4 transition-all border-l-4 text-left ${active
        ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/10 text-purple-600'
        : 'border-transparent text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'
        }`}
    >
      <span className="text-xl">{icon}</span>
      <span className="font-semibold">{label}</span>
    </button>
  );
}

function InfoField({ label, value }: any) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-[10px] font-extrabold text-purple-700 dark:text-purple-400 uppercase tracking-tighter ml-1">{label}</label>
      <div className="bg-gray-100 dark:bg-gray-800/80 rounded border border-gray-200 dark:border-gray-700 px-3 py-2 text-sm font-medium text-gray-800 dark:text-gray-200 min-h-[38px]">
        {value || '-'}
      </div>
    </div>
  );
}