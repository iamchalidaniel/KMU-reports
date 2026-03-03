"use client";

import { useState, useEffect } from 'react';
import { saveAs } from 'file-saver';
import { Bar, Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { useAuth } from '../../context/AuthContext';
import { API_BASE_URL } from '../../config/constants';
import { authHeaders, getProfile } from '../../utils/api';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import type { Case, Student } from '../../../types/global.d';
import { prepareChartExport } from '../../utils/chartExport';
import Notification, { useNotification } from '../../components/Notification';

ChartJS.register(CategoryScale, LinearScale, BarElement, LineElement, PointElement, Title, Tooltip, Legend);

export default function SecretaryDashboard() {
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
  const [programFilter, setProgramFilter] = useState('');
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [aiSummary, setAiSummary] = useState<string | null>(null);

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
      if (!user || user.role !== 'secretary') {
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
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    }

    if (token) {
      fetchStaffProfile();
      fetchData();
    }
  }, [token]);

  const handleGenerateSummary = async () => {
    if (cases.length === 0 || isSummarizing) return;
    setIsSummarizing(true);
    setAiSummary(null);
    try {
      const descriptions = cases.slice(0, 20).map(c => c.description).filter(d => !!d);
      const res = await fetch('/api/ai-summarize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ descriptions })
      });
      if (res.ok) {
        const data = await res.json();
        setAiSummary(data.summary);
      } else {
        showNotification('error', 'Failed to generate AI summary');
      }
    } catch (err) {
      console.error('Summary error:', err);
      showNotification('error', 'An error occurred during AI analysis');
    } finally {
      setIsSummarizing(false);
    }
  };

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
            title: 'Secretary Dashboard Administrative Report',
            url: typeof window !== 'undefined' ? window.location.href : ''
          }
        }),
      });

      if (!res.ok) throw new Error(await res.text());
      const blob = await res.blob();
      saveAs(blob, 'secretary_report.docx');
      showNotification('success', 'Report exported successfully!');
    } catch (err) {
      console.error('Export error:', err);
      showNotification('error', 'Failed to export report');
    }
  }

  if (isCheckingAuth) {
    return <div className="text-center text-kmuGreen p-12">Loading...</div>;
  }

  if (!user || user.role !== 'secretary') return <div className="text-red-600 p-12">Access denied.</div>;

  const staffData = profile || user;

  // Stats
  const todayCount = filteredCases.filter(c => new Date(c.createdAt || 0).toDateString() === new Date().toDateString()).length;
  const recentCount = filteredCases.filter(c => {
    const d = new Date(c.createdAt || 0);
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    return d >= weekAgo;
  }).length;

  // Charts
  const last7Days = [];
  const casesPerDay = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    last7Days.push(d.toLocaleDateString('en-US', { weekday: 'short' }));
    casesPerDay.push(filteredCases.filter(c => new Date(c.createdAt || 0).toDateString() === d.toDateString()).length);
  }

  const trendData = {
    labels: last7Days,
    datasets: [{
      label: 'Cases',
      data: casesPerDay,
      borderColor: '#10B981',
      backgroundColor: 'rgba(16, 185, 129, 0.1)',
      fill: true,
      tension: 0.4
    }]
  };

  const analyticsCases = programFilter
    ? safeCases.filter((c: any) => c.student?.program === programFilter)
    : safeCases;

  const offenseCounts: Record<string, number> = {};
  const offenderCounts: Record<string, number> = {};
  analyticsCases.forEach((c: Case) => {
    if (c.offenseType) offenseCounts[c.offenseType] = (offenseCounts[c.offenseType] || 0) + 1;
    if (c.student?.fullName) offenderCounts[c.student.fullName] = (offenderCounts[c.student.fullName] || 0) + 1;
  });

  const topOffenses = Object.entries(offenseCounts).sort((a, b) => b[1] - a[1]).slice(0, 5);
  const topOffenders = Object.entries(offenderCounts).sort((a, b) => b[1] - a[1]).slice(0, 5);
  const programs = Array.from(new Set(safeStudents.map((s: any) => s.program).filter(Boolean)));

  const offenseChartData = {
    labels: topOffenses.map(([offence]) => offence),
    datasets: [
      {
        label: 'Offenses',
        data: topOffenses.map(([, count]) => count),
        backgroundColor: '#10B981',
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
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Administrative Dashboard</h1>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Student Records & Case Management</p>
            </div>
            <div className="flex flex-wrap gap-3">
              <button
                onClick={handleGenerateSummary}
                disabled={isSummarizing || cases.length === 0}
                className="bg-kmuGreen text-white px-6 py-2.5 rounded-lg font-bold text-sm hover:bg-green-700 transition flex items-center gap-2 shadow-sm disabled:opacity-50"
              >
                {isSummarizing ? "Analyzing..." : "✨ Generate AI Insight"}
              </button>
              <button
                onClick={exportCasesToWord}
                className="bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 px-6 py-2.5 rounded-lg font-bold text-sm shadow-sm border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition"
              >
                📄 Export Case Records
              </button>
            </div>
          </div>

          {/* AI Insight banner */}
          {aiSummary && (
            <div className="p-6 bg-emerald-50 dark:bg-emerald-900/10 border-l-4 border-emerald-500 rounded-xl animate-in slide-in-from-left duration-500 shadow-sm relative overflow-hidden">
              <div className="absolute top-2 right-2">
                <button onClick={() => setAiSummary(null)} className="text-emerald-400 hover:text-emerald-600 transition">✕</button>
              </div>
              <div className="flex items-center gap-2 mb-4">
                <span className="text-xl">🧠</span>
                <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">AI-Generated Trends</h3>
              </div>
              <div className="text-sm text-emerald-900 dark:text-emerald-100 leading-relaxed p-4 bg-white/60 dark:bg-black/20 rounded-lg border border-emerald-100/50 dark:border-emerald-800/50">
                {aiSummary}
              </div>
            </div>
          )}

          {/* System Overview */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard title="Total Students" value={safeStudents.length} color="teal" />
            <StatCard title="Total Cases" value={filteredCases.length} color="emerald" />
            <StatCard title="New Cases (24h)" value={todayCount} color="blue" />
            <StatCard title="Cases this Week" value={recentCount} color="orange" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Activity Trend */}
            <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider">Case Activity Trend</h3>
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
                <Line
                  data={trendData}
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

            {/* Top Offenders List */}
            <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 p-6">
              <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-6">Frequent Offenders</h3>
              <div className="space-y-3">
                {topOffenders.slice(0, 5).length > 0 ? topOffenders.map(([name, count], i) => (
                  <div key={i} className="flex justify-between items-center p-3 hover:bg-gray-50 dark:hover:bg-gray-800/50 rounded-lg transition-colors border border-gray-100 dark:border-gray-700 group">
                    <span className="font-bold text-sm text-gray-700 dark:text-gray-300 group-hover:text-kmuGreen transition-colors">{name}</span>
                    <span className="bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase">{count} Cases</span>
                  </div>
                )) : <p className="text-center text-gray-500 py-12 italic text-sm">No offenders found.</p>}
              </div>
            </div>
          </div>

          {/* Central Registry Ledger */}
          <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 overflow-hidden flex flex-col">
            <div className="p-6 border-b border-gray-100 dark:border-gray-800 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">Case Registry</h2>
              <div className="relative w-full md:w-80">
                <input
                  placeholder="Search cases..."
                  className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-4 py-2.5 text-sm w-full focus:ring-2 focus:ring-kmuGreen transition-all shadow-inner"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </div>
            <div className="overflow-x-auto flex-1">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 dark:bg-gray-800/50 text-gray-500 text-xs font-bold uppercase tracking-wider">
                  <tr>
                    <th className="px-6 py-4 text-left">Student</th>
                    <th className="px-6 py-4 text-left">Offense Category</th>
                    <th className="px-6 py-4 text-center">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                  {filteredCases.slice(0, 12).map((c, i) => (
                    <tr key={i} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 group transition-colors cursor-pointer" onClick={() => router.push(`/cases/${c._id}`)}>
                      <td className="px-6 py-4">
                        <div className="font-bold text-gray-900 dark:text-gray-100 group-hover:text-kmuGreen transition-colors">{c.student?.fullName}</div>
                        <div className="text-xs text-gray-500 mt-0.5">{c.student?.studentId}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-gray-600 dark:text-gray-400 font-medium uppercase tracking-tight">{c.offenseType}</div>
                      </td>
                      <td className="px-6 py-4 text-center text-gray-400 text-xs font-mono">
                        {new Date(c.createdAt || 0).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filteredCases.length === 0 && (
                <div className="text-center py-24 text-gray-400 italic text-sm">Registry query returned zero results.</div>
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
    teal: 'border-teal-500 dark:border-teal-400',
    emerald: 'border-emerald-500 dark:border-emerald-400',
    blue: 'border-blue-500 dark:border-blue-400',
    orange: 'border-orange-500 dark:border-orange-400'
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
        ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/10 text-emerald-600'
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
      <label className="text-[10px] font-extrabold text-emerald-700 dark:text-emerald-400 uppercase tracking-tighter ml-1">{label}</label>
      <div className="bg-gray-100 dark:bg-gray-800/80 rounded border border-gray-200 dark:border-gray-700 px-3 py-2 text-sm font-medium text-gray-800 dark:text-gray-200 min-h-[38px]">
        {value || '-'}
      </div>
    </div>
  );
}