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
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100 pb-12 font-serif">
      <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="animate-in fade-in duration-300 space-y-6">

          {/* Executive Command Bar */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white dark:bg-gray-900 p-8 rounded-3xl border-t-4 border-purple-600 shadow-xl gap-4 text-sm">
            <div>
              <h1 className="text-3xl font-black tracking-tighter text-gray-900 dark:text-white uppercase">Assistant Dean Oversight</h1>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.3em] mt-1">Student Affairs & Disciplinary Governance</p>
            </div>
            <div className="flex flex-wrap gap-3">
              <button
                onClick={exportCasesToWord}
                className="bg-kmuGreen text-white px-6 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:shadow-lg hover:shadow-emerald-500/20 transition flex items-center gap-2 group"
              >
                <span className="group-hover:animate-bounce">📄</span> Export Registry
              </button>
              <Link
                href="/reports"
                className="bg-blue-600 text-white px-6 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:shadow-lg hover:shadow-blue-500/20 transition flex items-center gap-2 group"
              >
                <span className="group-hover:animate-pulse">📂</span> Analytics Portal
              </Link>
            </div>
          </div>

          {/* Strategic Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard title="Total Students" value={totalStudentsCount} color="indigo" />
            <StatCard title="Total Cases" value={totalCasesCount} color="purple" />
            <StatCard title="Open Inquiries" value={pendingCases} color="orange" />
            <StatCard title="Resolved" value={resolvedCases} color="green" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 text-sm">
            {/* Case Status Distribution */}
            <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-sm border border-gray-200 dark:border-gray-800 p-8">
              <h3 className="text-xs font-black uppercase tracking-widest text-gray-400 mb-8 font-bold">Case Status Distribution</h3>
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

            {/* Offense Frequency */}
            <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-sm border border-gray-200 dark:border-gray-800 p-8">
              <div className="flex justify-between items-center mb-8">
                <h3 className="text-xs font-black uppercase tracking-widest text-gray-400 font-bold">Primary Offense Index</h3>
                <select
                  className="bg-gray-50 dark:bg-gray-800 border-none rounded-xl px-4 py-2 text-[10px] font-black uppercase outline-none focus:ring-2 focus:ring-purple-500 transition-all font-sans"
                  value={programFilter}
                  onChange={(e) => setProgramFilter(e.target.value)}
                >
                  <option value="">All Academic Units</option>
                  {programs.map((p: any) => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
              <div className="h-64 flex items-center justify-center">
                <Bar
                  data={offenseChartData}
                  options={{
                    maintainAspectRatio: false,
                    plugins: { legend: { display: false } },
                    scales: { y: { beginAtZero: true, grid: { display: false } }, x: { grid: { display: false } } }
                  }}
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 text-sm">
            {/* Recurrent Offenders */}
            <div className="lg:col-span-1 bg-white dark:bg-gray-900 rounded-3xl shadow-sm border border-gray-200 dark:border-gray-800 p-8">
              <h3 className="text-xs font-black uppercase tracking-widest text-gray-400 mb-6 font-bold">Recurrent Subjects</h3>
              <div className="space-y-4 font-sans">
                {topOffenders.length > 0 ? topOffenders.map(([name, count], i) => (
                  <div key={i} className="flex justify-between items-center p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 rounded-2xl transition-colors border-b border-gray-50 dark:border-gray-800 last:border-0 group">
                    <span className="font-bold text-xs tracking-tight text-gray-700 dark:text-gray-300 group-hover:text-purple-600 transition-colors uppercase">{name}</span>
                    <span className="bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-tighter">{count} Incidents</span>
                  </div>
                )) : <p className="text-center text-gray-500 py-12 italic text-sm">No offender telemetry found.</p>}
              </div>
            </div>

            {/* Case Registry Ledger */}
            <div className="lg:col-span-2 bg-white dark:bg-gray-900 rounded-3xl shadow-sm border border-gray-200 dark:border-gray-800 overflow-hidden flex flex-col">
              <div className="p-8 border-b border-gray-100 dark:border-gray-800 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <h2 className="text-lg font-black uppercase tracking-tighter">Case Registry Ledger</h2>
                <div className="relative w-full md:w-64 font-sans">
                  <input
                    placeholder="Search ledger..."
                    className="bg-gray-50 dark:bg-gray-800 border-none rounded-2xl px-5 py-3 text-xs w-full focus:ring-2 focus:ring-purple-500 transition-all shadow-inner"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </div>
              </div>
              <div className="overflow-x-auto flex-1 font-sans">
                <table className="w-full text-xs">
                  <thead className="bg-gray-50/50 dark:bg-gray-800/50 text-[10px] font-black uppercase text-gray-400 tracking-widest">
                    <tr>
                      <th className="px-8 py-5 text-left">Subject / Identification</th>
                      <th className="px-8 py-5 text-left">Classification</th>
                      <th className="px-8 py-5 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                    {filteredCases
                      .filter(c => c.status === 'Open' || c.status === 'Under Investigation')
                      .slice(0, 8)
                      .map((c, i) => (
                        <tr key={i} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 group transition-colors cursor-pointer" onClick={() => router.push(`/cases/${c._id}`)}>
                          <td className="px-8 py-5">
                            <div className="font-bold text-gray-900 dark:text-gray-100 group-hover:text-purple-600 transition-colors uppercase">{c.student?.fullName}</div>
                            <div className="text-[10px] text-gray-400 font-mono mt-0.5">{c.student?.studentId} • {c.student?.program}</div>
                          </td>
                          <td className="px-8 py-5">
                            <div className="text-gray-700 dark:text-gray-300 font-medium uppercase">{c.offenseType}</div>
                          </td>
                          <td className="px-8 py-5 text-center">
                            <span className="px-3 py-1 rounded-lg bg-orange-100 dark:bg-orange-950/30 text-orange-700 dark:text-orange-400 font-black text-[9px] uppercase tracking-tighter border border-orange-200 dark:border-orange-900/50">{c.status}</span>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
                {filteredCases.filter(c => c.status === 'Open' || c.status === 'Under Investigation').length === 0 && (
                  <div className="text-center py-20 text-gray-400 italic text-sm">No active inquiries found.</div>
                )}
              </div>
              <div className="p-6 bg-gray-50/30 dark:bg-gray-800/20 text-center border-t border-gray-100 dark:border-gray-800">
                <Link href="/students" className="text-[10px] font-black text-purple-600 hover:text-purple-700 uppercase tracking-[0.2em] transition-all">Expand Student Registry →</Link>
              </div>
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
    indigo: 'text-indigo-700 bg-indigo-50/30 border-indigo-100 hover:bg-indigo-50 dark:bg-indigo-950/10 dark:border-indigo-900/50',
    purple: 'text-purple-700 bg-purple-50/30 border-purple-100 hover:bg-purple-50 dark:bg-purple-950/10 dark:border-purple-900/50',
    orange: 'text-orange-700 bg-orange-50/30 border-orange-100 hover:bg-orange-50 dark:bg-orange-950/10 dark:border-orange-900/50',
    green: 'text-green-700 bg-green-50/30 border-green-100 hover:bg-green-50 dark:bg-green-950/10 dark:border-green-900/50'
  };
  return (
    <div className={`bg-white dark:bg-gray-900 rounded-3xl shadow-sm border p-8 transition-all duration-300 ${colors[color]}`}>
      <div className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 mb-3">{title}</div>
      <div className="text-4xl font-black tracking-tight">{value}</div>
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