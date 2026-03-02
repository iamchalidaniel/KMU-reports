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
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100 pb-12 font-serif">
      <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="animate-in fade-in duration-300 space-y-6">

          {/* Executive Command Bar */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white dark:bg-gray-900 p-8 rounded-3xl border-t-4 border-emerald-600 shadow-xl gap-4">
            <div>
              <h1 className="text-3xl font-black tracking-tighter text-gray-900 dark:text-white uppercase">Secretariat Command</h1>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.3em] mt-1">Administrative Intelligence & Registry Governance</p>
            </div>
            <div className="flex flex-wrap gap-3">
              <button
                onClick={handleGenerateSummary}
                disabled={isSummarizing || cases.length === 0}
                className="bg-emerald-600 text-white px-6 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:shadow-lg hover:shadow-emerald-500/20 transition flex items-center gap-2 group border-none"
              >
                <span className="group-hover:animate-spin">✨</span> {isSummarizing ? "Analyzing Patterns..." : "AI Behavioral Summary"}
              </button>
              <button
                onClick={exportCasesToWord}
                className="bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 px-6 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:shadow-lg border border-gray-200 dark:border-gray-700 transition flex items-center gap-2 group"
              >
                📄 Export Ledger
              </button>
            </div>
          </div>

          {/* AI Insight banner */}
          {aiSummary && (
            <div className="p-8 bg-emerald-50/50 dark:bg-emerald-950/20 border-l-8 border-emerald-500 rounded-3xl animate-in slide-in-from-left duration-500 shadow-sm relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4">
                <button onClick={() => setAiSummary(null)} className="text-emerald-300 hover:text-emerald-500 transition">✕</button>
              </div>
              <div className="flex items-center gap-3 mb-4">
                <span className="text-2xl animate-pulse">🧠</span>
                <h3 className="text-xs font-black uppercase tracking-widest text-emerald-700 dark:text-emerald-400">Synthesized Administrative Intelligence</h3>
              </div>
              <div className="text-sm font-medium text-emerald-900 dark:text-emerald-100 leading-relaxed font-sans bg-white/50 dark:bg-black/20 p-6 rounded-2xl border border-emerald-100/50 dark:border-emerald-800/50">
                {aiSummary}
              </div>
            </div>
          )}

          {/* Strategic Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard title="Student Registry" value={safeStudents.length} color="teal" />
            <StatCard title="Incident Ledger" value={filteredCases.length} color="emerald" />
            <StatCard title="New Entries (24h)" value={todayCount} color="blue" />
            <StatCard title="Weekly Velocity" value={recentCount} color="orange" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Activity Trend */}
            <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-sm border border-gray-200 dark:border-gray-800 p-8">
              <div className="flex justify-between items-center mb-8">
                <h3 className="text-xs font-black uppercase tracking-widest text-gray-400 font-bold">Activity Velocity Index</h3>
                <select
                  className="bg-gray-50 dark:bg-gray-800 border-none rounded-xl px-4 py-2 text-[10px] font-black uppercase outline-none focus:ring-2 focus:ring-emerald-500 transition-all font-sans"
                  value={programFilter}
                  onChange={(e) => setProgramFilter(e.target.value)}
                >
                  <option value="">All Academic Units</option>
                  {programs.map((p: any) => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
              <div className="h-64 flex items-center justify-center font-sans">
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
            <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-sm border border-gray-200 dark:border-gray-800 p-8">
              <h3 className="text-xs font-black uppercase tracking-widest text-gray-400 mb-8 font-bold">Registry Anomaly Frequency</h3>
              <div className="space-y-4 font-sans">
                {topOffenders.slice(0, 5).length > 0 ? topOffenders.map(([name, count], i) => (
                  <div key={i} className="flex justify-between items-center p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 rounded-2xl transition-colors border-b border-gray-50 dark:border-gray-800 last:border-0 group">
                    <span className="font-bold text-xs tracking-tight text-gray-700 dark:text-gray-300 group-hover:text-emerald-600 transition-colors uppercase">{name}</span>
                    <span className="bg-emerald-100 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-tighter">{count} Entries</span>
                  </div>
                )) : <p className="text-center text-gray-500 py-12 italic text-sm">No significant anomalies detected.</p>}
              </div>
            </div>
          </div>

          {/* Central Registry Ledger */}
          <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-sm border border-gray-200 dark:border-gray-800 overflow-hidden flex flex-col">
            <div className="p-8 border-b border-gray-100 dark:border-gray-800 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <h2 className="text-lg font-black uppercase tracking-tighter">Central Registry Ledger</h2>
              <div className="relative w-full md:w-80 font-sans">
                <input
                  placeholder="Query central registry..."
                  className="bg-gray-50 dark:bg-gray-800 border-none rounded-2xl px-5 py-3.5 text-xs w-full focus:ring-2 focus:ring-emerald-500 transition-all shadow-inner"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </div>
            <div className="overflow-x-auto flex-1 font-sans">
              <table className="w-full text-xs">
                <thead className="bg-gray-50/50 dark:bg-gray-800/50 text-[10px] font-black uppercase text-gray-400 tracking-widest">
                  <tr>
                    <th className="px-8 py-5 text-left">Subject / Entity</th>
                    <th className="px-8 py-5 text-left">Classification</th>
                    <th className="px-8 py-5 text-center">Timestamp</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                  {filteredCases.slice(0, 12).map((c, i) => (
                    <tr key={i} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 group transition-colors cursor-pointer" onClick={() => router.push(`/cases/${c._id}`)}>
                      <td className="px-8 py-5">
                        <div className="font-bold text-gray-900 dark:text-gray-100 group-hover:text-emerald-600 transition-colors uppercase">{c.student?.fullName}</div>
                        <div className="text-[10px] text-gray-400 font-mono mt-0.5">{c.student?.studentId}</div>
                      </td>
                      <td className="px-8 py-5">
                        <div className="text-gray-700 dark:text-gray-300 font-medium uppercase tracking-tight">{c.offenseType}</div>
                      </td>
                      <td className="px-8 py-5 text-center text-gray-400 font-mono text-[10px]">
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
    teal: 'text-teal-700 bg-teal-50/30 border-teal-100 hover:bg-teal-50 dark:bg-teal-950/10 dark:border-teal-900/50',
    emerald: 'text-emerald-700 bg-emerald-50/30 border-emerald-100 hover:bg-emerald-50 dark:bg-emerald-950/10 dark:border-emerald-900/50',
    blue: 'text-blue-700 bg-blue-50/30 border-blue-100 hover:bg-blue-50 dark:bg-blue-950/10 dark:border-blue-900/50',
    orange: 'text-orange-700 bg-orange-50/30 border-orange-100 hover:bg-orange-50 dark:bg-orange-950/10 dark:border-orange-900/50'
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